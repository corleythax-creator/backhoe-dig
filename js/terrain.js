// Corley's Island: dig-zone heightmap, the road, soil layers, digging, dumping, slumping and cave-ins.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- terrain heightmap ----------
// dig grid: 64 m square at 0.16 m (about 6 in) per cell. GRID_K = cells per 0.32 m, the old 1 ft cell, so reaches and
// settling speeds written in cells stay the same in feet
const S=64,N=400,CELL=S/N,V=N+1,CA=CELL*CELL,FLOOR=3.5,GRID_K=Math.round(0.32/CELL);
// dig tiles (docs/dig-plans.html): the map is cut into TILE m squares, named from the mesa top's centre (E0/W1 across,
// S0/N1 down). The dig grid covers TPG by TPG of them, its west and north edges at GX0, GZ0 (on tile lines); it starts
// on the four round the trench and follows the digging machine (digMoveTo, digtiles.js). Everything that turns world
// x, z into grid i, j or back goes through gX/gZ and gI/gJ
const TILE=32,TPG=S/TILE;let GX0=-TILE,GZ0=-TILE,GX1=GX0+S,GZ1=GZ0+S;
const gX=i=>GX0+i*CELL,gZ=j=>GZ0+j*CELL,gI=x=>(x-GX0)/CELL,gJ=z=>(z-GZ0)/CELL;
// inside the dig grid, at least m in from its edge
function inDig(x,z,m=0){return x>=GX0+m&&x<=GX1-m&&z>=GZ0+m&&z<=GZ1-m}
function tileName(ti,tj){return (ti<0?'W'+(-ti):'E'+ti)+' · '+(tj<0?'N'+(-tj):'S'+tj)}
// the grid's tiles: their map index (ti, tj) and grid point ranges (a shared edge row belongs to both)
const DIG_TILES=[];
function digTilesSet(){DIG_TILES.length=0;for(let b=0;b<TPG;b++)for(let a=0;a<TPG;a++){const ti=Math.round(GX0/TILE)+a,tj=Math.round(GZ0/TILE)+b,n=N/TPG;
  DIG_TILES.push({ti,tj,name:tileName(ti,tj),i0:a*n,i1:(a+1)*n,j0:b*n,j1:(b+1)*n})}}
digTilesSet();
// rectangles [x0, x1, z0, z1] of dug ground drawn outside the grid (digtiles.js), which buildSkirts edges too
const digSkirtRects=[];
// the dig tile under x, z, or null off the grid
function digTileAt(x,z){if(!inDig(x,z))return null;const a=Math.min(TPG-1,Math.floor((x-GX0)/TILE)),b=Math.min(TPG-1,Math.floor((z-GZ0)/TILE));return DIG_TILES[b*TPG+a]}
const H=new Float32Array(V*V),H0=new Float32Array(V*V),grass=new Float32Array(V*V*3),matCov=new Float32Array(V*V),mudBase=new Float32Array(V*V),paintD=new Float32Array(V*V),ripD=new Float32Array(V*V),paint=new Uint8Array(V*V),nz=new Float32Array(V*V),rockA=new Float32Array(V*V);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const hash=(i,j)=>{const s=Math.sin(i*127.1+j*311.7)*43758.5453;return s-Math.floor(s)};
// ---------- map edits ----------
// the map editor's layers over the generated ground, on a 0.5 m grid over Corley's Island and its shore: ED_H raises or
// lowers the ground (metres), ED_P paints it toward dirt (+) or grass (-), ED_M covers it with a material from the
// library (materials.js; 0 is the natural ground) and ED_A says how much of the cell it covers (255 full, as the Hard edge brush lays, 254 also full
// but laid by the square brush, drawn with sharp corners; the Soft edge brush lays 253 and less over its fade; 0 wherever ED_M is 0). The outer cells stay 0 so the edges meet the coarse ground. Saved on
// this device as bhd_map, with the placed assets (trees and boulders) and the roads; see editor.js
const ED_X0=-112,ED_Z0=-122,ED_C=0.5,ED_NX=449,ED_NZ=433,ED_H=new Float32Array(ED_NX*ED_NZ),ED_P=new Float32Array(ED_NX*ED_NZ),ED_M=new Uint8Array(ED_NX*ED_NZ),ED_A=new Uint8Array(ED_NX*ED_NZ);
let mapAssets=null,mapRoads=null,mapSq=0;
// ED_G: where tall grass grows (1), on the same grid (the editor's Tall grass brush; mower.js grows it). A map from
// before it has the first patch, 52 x 39 ft north-east of the trench
const ED_G=new Uint8Array(ED_NX*ED_NZ);
function tallDefault(){ED_G.fill(0);for(let j=Math.round((11-ED_Z0)/ED_C);j<=Math.round((23-ED_Z0)/ED_C);j++)for(let i=Math.round((-1-ED_X0)/ED_C);i<=Math.round((15-ED_X0)/ED_C);i++)ED_G[j*ED_NX+i]=1}
tallDefault();
// whether tall grass grows at x,z (the nearest cell)
function tallAt(x,z){const i=Math.round((x-ED_X0)/ED_C),j=Math.round((z-ED_Z0)/ED_C);return i>=0&&j>=0&&i<ED_NX&&j<ED_NZ&&ED_G[j*ED_NX+i]===1}
function edSample(A,x,z){const fx=(x-ED_X0)/ED_C,fz=(z-ED_Z0)/ED_C;if(fx<0||fz<0||fx>=ED_NX-1||fz>=ED_NZ-1)return 0;
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*ED_NX+i;return A[k]*(1-u)*(1-v)+A[k+1]*u*(1-v)+A[k+ED_NX]*(1-u)*v+A[k+ED_NX+1]*u*v}
// the material painted on the cell nearest a point (0: natural ground, or a soft edge fading out to less than half)
function paintAt(x,z){const i=Math.round((x-ED_X0)/ED_C),j=Math.round((z-ED_Z0)/ED_C);if(i<0||j<0||i>=ED_NX||j>=ED_NZ)return 0;const q=j*ED_NX+i;return ED_A[q]>=128?ED_M[q]:0}
// a ground vertex under the painted materials. With WebGL2 the shader draws them per pixel (materials.js): the colour
// c is left alone and this says only whether paint is near (1 when any of the 4 x 4 cells around it is painted), which
// the matA attribute carries. Without it, c (rgb array) is blended toward each nearby cell's material colour as the
// cells' corners blend, tightened so an edge turns over about 0.25 m, and this returns how much is covered (0 to 1);
// soft-edged paint (ED_A below 255) scales that cover down, so it fades out
function matTint(x,z,c){const fx=(x-ED_X0)/ED_C,fz=(z-ED_Z0)/ED_C;if(fx<0||fz<0||fx>=ED_NX-1||fz>=ED_NZ-1)return 0;
  if(MAT_GL2){const i=fx|0,j=fz|0;for(let b=Math.max(0,j-1);b<=Math.min(ED_NZ-1,j+2);b++)for(let a=Math.max(0,i-1);a<=Math.min(ED_NX-1,i+2);a++)if(ED_M[b*ED_NX+a])return 1;return 0}
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*ED_NX+i;let cov=0,al=0,r=0,g=0,b=0;
  for(const [q,w] of [[k,(1-u)*(1-v)],[k+1,u*(1-v)],[k+ED_NX,(1-u)*v],[k+ED_NX+1,u*v]]){const m=ED_M[q];if(!m||w<=0)continue;const mc=matDef(m).c;cov+=w;al+=w*ED_A[q];r+=mc[0]*w;g+=mc[1]*w;b+=mc[2]*w}
  if(cov<=0)return 0;const sc=ss(0.25,0.75,cov)*al/(cov*255),f=sc/cov;
  c[0]=c[0]*(1-sc)+r*f;c[1]=c[1]*(1-sc)+g*f;c[2]=c[2]*(1-sc)+b*f;
  return sc}
// how much of x,z one material covers (0 to 1, smoothed like matTint); painted Mud is saturated ground (water.js)
const MUD_ID=MAT_LIST.findIndex(m=>m&&m.id==='mud')+1;
function matCovOf(x,z,id){const fx=(x-ED_X0)/ED_C,fz=(z-ED_Z0)/ED_C;if(fx<0||fz<0||fx>=ED_NX-1||fz>=ED_NZ-1)return 0;
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*ED_NX+i;let cov=0,al=0;
  for(const [q,w] of [[k,(1-u)*(1-v)],[k+1,u*(1-v)],[k+ED_NX,(1-u)*v],[k+ED_NX+1,u*v]])if(ED_M[q]===id){cov+=w;al+=w*ED_A[q]}
  return cov>0?ss(0.25,0.75,cov)*al/(cov*255):0}
function b64Bytes(b){let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
function bytesB64(t){const s=atob(t),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b}
// a map as text: each edit layer as the smallest box holding its edits (heights in centimetres, paint in hundredths,
// materials as ids, and how much less than full each painted cell is covered, for soft edges; tg the tall grass, 0 for none), the assets as [type, x, z, turn, size, tint] and the roads as [width, grass up the middle, [[x, z, height if graded], ...]]
function edBox(A,scale,Arr){let i0=ED_NX,i1=-1,j0=ED_NZ,j1=-1;
  for(let j=0;j<ED_NZ;j++)for(let i=0;i<ED_NX;i++)if(Math.round(A[j*ED_NX+i]*scale)!==0){if(i<i0)i0=i;if(i>i1)i1=i;if(j<j0)j0=j;if(j>j1)j1=j}
  if(i1<0)return null;const w=i1-i0+1,h=j1-j0+1,q=new Arr(w*h),lim=Arr===Int8Array?127:32767;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)q[j*w+i]=Math.max(-lim,Math.min(lim,Math.round(A[(j+j0)*ED_NX+i+i0]*scale)));
  return {r:[i0,j0,w,h],d:b64Bytes(new Uint8Array(q.buffer))}}
// oi, oj: where the map's own grid starts in this one, in cells (maps from before v116 start at -58, -32)
function edUnbox(o,A,scale,Arr,oi=0,oj=0){if(!o)return;let [i0,j0,w,h]=o.r;i0+=oi;j0+=oj;const q=new Arr(bytesB64(o.d).buffer);
  if(!(w>0&&h>0&&i0>=0&&j0>=0&&i0+w<=ED_NX&&j0+h<=ED_NZ&&q.length===w*h))throw new Error('bad layer');
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)A[(j+j0)*ED_NX+i+i0]=q[j*w+i]/scale}
function mapEncode(){const doc={game:'backhoe-dig',v:1,g:[ED_X0,ED_Z0]},h=edBox(ED_H,100,Int16Array),p=edBox(ED_P,100,Int8Array);
  const m=edBox(ED_M,1,Uint8Array),fa=new Uint8Array(ED_A.length);for(let q=0;q<fa.length;q++)if(ED_M[q])fa[q]=255-ED_A[q];
  const a=edBox(fa,1,Uint8Array);if(h)doc.h=h;if(p)doc.p=p;if(m)doc.m=m;if(a)doc.a=a;doc.tg=edBox(ED_G,1,Uint8Array)||0;
  // sq: its things include Harbor Square's furniture (sqThings, scenery.js)
  if(mapAssets){doc.sq=1;doc.assets=(typeof fxSaveList==='function'?fxSaveList(mapAssets):mapAssets).map(a=>[a.t,+a.x.toFixed(2),+a.z.toFixed(2),+a.yaw.toFixed(2),+a.s.toFixed(2),a.c,...(a.lk?[1]:[])])}
  if(mapRoads)doc.roads=mapRoads.map(r=>[+r.w.toFixed(2),r.mid,r.pts.map(q=>q.map(v=>+v.toFixed(2))),...(r.pv?[{c:r.cb?1:0,s:+(r.sw||0).toFixed(2),l:r.cl?1:0,...(r.sf?{f:r.sf}:{})}]:[])]);
  return JSON.stringify(doc)}
// reads a map into new layers; throws on anything that is not one
function mapDecode(text){const doc=JSON.parse(text);if(!doc||doc.game!=='backhoe-dig'||doc.v!==1)throw new Error('not a Corley\'s Island map');
  const g=Array.isArray(doc.g)&&doc.g.length===2&&doc.g.every(isFinite)?doc.g:[-58,-32],oi=Math.round((g[0]-ED_X0)/ED_C),oj=Math.round((g[1]-ED_Z0)/ED_C);
  const h=new Float32Array(ED_H.length),p=new Float32Array(ED_P.length),m=new Uint8Array(ED_M.length);edUnbox(doc.h,h,100,Int16Array,oi,oj);edUnbox(doc.p,p,100,Int8Array,oi,oj);edUnbox(doc.m,m,1,Uint8Array,oi,oj);
  // cover: maps from before soft edges have no "a" and are covered fully wherever painted
  const a=new Uint8Array(ED_A.length);edUnbox(doc.a,a,1,Uint8Array,oi,oj);
  for(let q=0;q<m.length;q++){if(m[q]&&!matIdOk(m[q]))m[q]=0;a[q]=m[q]?255-a[q]:0;if(!a[q])m[q]=0}
  // tall grass: none in a map that has the layer empty (0), the first patch in one from before it
  let tg=null;if(doc.tg!==undefined){tg=new Uint8Array(ED_G.length);if(doc.tg)edUnbox(doc.tg,tg,1,Uint8Array,oi,oj);for(let q=0;q<tg.length;q++)tg[q]=tg[q]?1:0}
  for(let j=0;j<ED_NZ;j++)for(let i=0;i<ED_NX;i++)if(i<3||j<3||i>ED_NX-4||j>ED_NZ-4){h[j*ED_NX+i]=0;p[j*ED_NX+i]=0;m[j*ED_NX+i]=0;a[j*ED_NX+i]=0;if(tg)tg[j*ED_NX+i]=0}
  const as=Array.isArray(doc.assets)?doc.assets.filter(a=>Array.isArray(a)&&typeof a[0]==='string'&&/^[a-z]{2,16}$/.test(a[0])&&isFinite(a[1])&&isFinite(a[2]))
    .map(a=>Object.assign({t:a[0],x:+a[1],z:+a[2],yaw:+a[3]||0,s:Math.max(0.3,Math.min(3,+a[4]||1)),c:(a[5]|0)>=0?a[5]|0:0},a[6]===1?{lk:1}:{})):null;
  // roads: 1.5 to 8 m wide (streets to 12), 2 to 200 points each; graded only when every point has a height; a fourth
  // entry makes it a paved street (streets.js): c curbs, s sidewalk width (to 5 m), l centre line, f its surface when
  // not asphalt (1 brick, 2 cobblestone, 3 fan cobbles, 4 old brick: ST_SURF)
  const rs=Array.isArray(doc.roads)?doc.roads.slice(0,60).filter(r=>Array.isArray(r)&&isFinite(r[0])&&Array.isArray(r[2])&&r[2].length>=2&&r[2].length<=200&&r[2].every(q=>Array.isArray(q)&&q.length>=2&&q.slice(0,3).every(isFinite)))
    .map(r=>{const g=r[2].every(q=>q.length>2),o=r[3]&&typeof r[3]==='object'?r[3]:null,pv=o?{pv:1,cb:o.c?1:0,sw:Math.max(0,Math.min(5,+o.s||0)),cl:o.l?1:0,...(o.f>=1&&o.f<=4?{sf:o.f|0}:{})}:{};
      return Object.assign({w:Math.max(1.5,Math.min(o?12:8,+r[0])),mid:o?0:r[1]?1:0,pts:r[2].map(q=>g?[+q[0],+q[1],+q[2]]:[+q[0],+q[1]])},pv)}):null;
  return {h,p,m,a,tg,as,rs,sq:doc.sq===1}}
try{const t=localStorage.getItem('bhd_map');if(t){const m=mapDecode(t);ED_H.set(m.h);ED_P.set(m.p);ED_M.set(m.m);ED_A.set(m.a);if(m.tg)ED_G.set(m.tg);mapAssets=m.as;mapRoads=m.rs;mapSq=m.sq}}catch(e){}
// the painted ids for the ground shader, one texel per cell (materials.js); editor.js flags it when they change
matU.tMatId.value=new THREE.DataTexture(ED_M,ED_NX,ED_NZ,THREE.RedFormat,THREE.UnsignedByteType);
matU.tMatId.value.unpackAlignment=1;matU.tMatId.value.needsUpdate=true;
matU.tMatCov.value=new THREE.DataTexture(ED_A,ED_NX,ED_NZ,THREE.RedFormat,THREE.UnsignedByteType);
matU.tMatCov.value.unpackAlignment=1;matU.tMatCov.value.needsUpdate=true;
// the site sits on a grassy island 24 ft above the lake: a rocky bank drops to a sand beach all round (shore). It is
// about 525 ft across, centred north of the dig so its south rim (where the bridge starts) stays put, with wide lawns
// and the spoil yard to the north. Round the dig is the high top with two low hills; across the south a grassy scarp
// drops 8 ft to the Lower Bench, a dirt yard with stockpiles, and a ramp runs down it. coreR is the island's first,
// smaller outline (295 ft across, centred CORE_Z), which still bounds the bench yard
const EDGE=80,WATER=-7.3,MZ=-5,BENCH_H=-2.4,CORE_Z=30,CORE_R=45;
function coreR(x,z){z-=CORE_Z;const a=Math.atan2(z,x);return Math.pow(Math.pow(Math.abs(x),4)+Math.pow(Math.abs(z),4),0.25)*(1+0.06*Math.sin(a*5+0.7)+0.035*Math.sin(a*11+2.1))}
function mesaR(x,z){z-=MZ;const a=Math.atan2(z,x);return Math.pow(Math.pow(Math.abs(x),4)+Math.pow(Math.abs(z),4),0.25)*(1+0.06*Math.sin(a*5+0.7)+0.035*Math.sin(a*11+2.1))}
// the Family Island: a larger island (about 525 ft across, 16 ft above the lake) south across the water, its top at the Lower Bench's height so
// the bridge from the bench runs level. The same rounded-square shape; FAM_R is its half width
const FAM_X=0,FAM_Z=245,FAM_R=80,FAM_Y=BENCH_H;
function famR(x,z){x-=FAM_X;z-=FAM_Z;const a=Math.atan2(z,x);return Math.pow(x*x*x*x+z*z*z*z,0.25)*(1+0.035*Math.sin(a*4+1.9)+0.02*Math.sin(a*9+0.4))}
// Jessica's Island: a mesa the size of Corley's, east of the Family Island and 10 ft higher, reached on foot by a covered
// bridge. Forest, a garden and a stone cottage with a library inside (jessica.js)
const JES_X=200,JES_Z=245,JES_R=45,JES_Y=FAM_Y+10*0.3048,JES_CX=209,JES_CZ=245;
// Dexter's Island: a mesa the size of Corley's west of the Family Island, level with it so the machines drive straight
// across the haul bridge; a gravel yard with an equipment shed, parked machines and a practice yard (dexter.js)
const DEX_X=-200,DEX_Z=245,DEX_R=45;
function dexR(x,z){x-=DEX_X;z-=DEX_Z;const a=Math.atan2(z,x);return Math.pow(x*x*x*x+z*z*z*z,0.25)*(1+0.04*Math.sin(a*6+0.9)+0.025*Math.sin(a*10+2.4))}
function jesR(x,z){x-=JES_X;z-=JES_Z;const a=Math.atan2(z,x);return Math.pow(x*x*x*x+z*z*z*z,0.25)*(1+0.05*Math.sin(a*5+2.6)+0.03*Math.sin(a*8+1.2))}
// bridge decks, each a straight run from x0,z0 to x1,z1 (half width hw, deck height y): the truss bridge from the Lower
// Bench to the Family Island, the mainland bridge, Jessica's footbridge, Dexter's haul bridge, then the two temporary
// timber trestles (temp: drawn by mainland.js) that meet the causeways to the mainland: south from the end of the
// mainland bridge to the town, north from Corley's north lawn to the field and woods. The machines and the worker
// ride the decks (hAt) and landIn counts them as ground; family.js draws the steel ones
// A deck climbs evenly from y at its start to y1 at its end; a foot bridge carries the worker but no machines
const BRIDGES=[{x0:0,z0:68,x1:0,z1:171,hw:4,y:FAM_Y},{x0:0,z0:316,x1:0,z1:418,hw:4,y:FAM_Y},
  {x0:70,z0:JES_Z,x1:163,z1:JES_Z,hw:1.6,y:FAM_Y,y1:JES_Y,foot:true},
  {x0:-70,z0:DEX_Z,x1:-163,z1:DEX_Z,hw:5,y:FAM_Y},
  {x0:0,z0:418,x1:0,z1:500,hw:3.4,y:FAM_Y,y1:-3.6,temp:1},{x0:0,z0:-82,x1:0,z1:-213,hw:3.4,y:0,y1:-3,temp:1}];
// the temporary rock causeways out from each mainland shore to the trestles: a flat top hw either side of the line,
// rising evenly from y to y1, with rough rock sides down to the lake bed (causewayH)
const CAUSEWAYS=[{x0:0,z0:500,x1:0,z1:566,hw:4.6,y:-3.6,y1:-3.6},{x0:0,z0:-213,x1:0,z1:-296,hw:4.6,y:-3,y1:-3}];
for(const b of BRIDGES.concat(CAUSEWAYS)){const dx=b.x1-b.x0,dz=b.z1-b.z0;b.len=Math.hypot(dx,dz);b.ux=dx/b.len;b.uz=dz/b.len;if(b.y1===undefined)b.y1=b.y}
// the mainland across the lake: the field and woods to the north and the lakeside town to the south, each a low shore
// (shore) rising gently inland to about 29 ft. The rim lines wander, but run straight where the causeways land. The
// field and woods are a broad point of land with beaches all round (mainSdN: its far shore and ends, corners rounded);
// the town's shore runs on east and west under the mountains, and behind the town the ground climbs into the foothills
const MAIN_N=-288,MAIN_S=558;
function mainWob(x,a){return (9*Math.sin(x*0.013+a)+5*Math.sin(x*0.031+1+a))*ss(14,40,Math.abs(x))}
function mainRimN(x){return MAIN_N+mainWob(x,0)}
// (west of Main Street the shore is the town square's seawall, square.js: straight along z 558 to 561 between its ends)
function mainRimS(x){const r=MAIN_S+mainWob(x,2.2),k=ss(-124,-112,x)*(1-ss(-20,-12,x));return r+(561-r)*k}
// metres outside the field and woods' land (negative inside): its town-side shore (mainRimN), far shore and two ends,
// as a box with corners rounded 70 m
function mainSdN(x,z){const a=Math.max(z-mainRimN(x),-588+6*Math.sin(x*0.017+0.7)+4*Math.sin(x*0.043+2)-z),
    b=Math.abs(x)-452-6*Math.sin(z*0.021+1.1)-4*Math.sin(z*0.05),qa=a+70,qb=b+70;
  return Math.hypot(Math.max(qa,0),Math.max(qb,0))+Math.min(Math.max(qa,qb),0)-70}
function mainHeight(x,z){
  if(z<0){const d=mainSdN(x,z);if(d>=0)return shore(d,x,z,-3);
    return -3+Math.min(4,-d*0.018)+0.5*Math.sin(x*0.021+0.6)*Math.cos(z*0.026)*ss(0,40,-d)}
  const d=mainRimS(x)-z;if(d>=0)return shore(d,x,z,-3.6);
  const h=-3.6+Math.min(5,-d*0.022)+0.35*Math.sin(x*0.017+1.4)*Math.cos(z*0.023+0.4)*ss(0,40,-d);
  return z>FH_Z0?fhGround(x,z,h):h}
// ---------- the foothills behind the town (hills.js draws the road, the trail and the overlook) ----------
// from a foot line behind the town (fhZ, swinging north round its sides and never nearer the shore than 40 m) the ground
// climbs about 150 ft over 560 ft to a shoulder of the mountain, steady up the face (about 20 degrees at the steepest),
// with spurs and gullies across it, then on gently toward the peaks. A switchback road is graded into it (FH_RD: its
// line; FH.pts its heights, set at load from the ground under it, smoothed and held to a 10% grade), and the overlook's
// lot and terrace at its top are levelled (FH_OV)
const FH={top:46,run:170,e:0.25,w:8,pts:[]},FH_Z0=590,
  FH_RD=[[-63,778],[-60,786],[-48,792],[70,818],[82,823],[87,831],[82,839],[70,842],[-56,862],[-68,867],[-72,875],[-66,883],[-54,886],[58,906],[68,911],[70,919],[64,926],[52,929],[22,934]],
  FH_OV={x:8,z:937,rx:30,rz:16,y:null};
// the Lookout Trail's line (hills.js), from the east side street's sidewalk up to the overlook's terrace
const FH_TRAIL=[[30,739],[30,770],[24,784],[32,797],[28,812],[18,824],[26,837],[14,850],[20,864],[8,876],[16,889],[6,898],[12,911],[4,921],[2,925.5]];
function fhZ(x){return Math.max(mainRimS(x)+40,772-0.0016*Math.max(0,Math.abs(x)-170)**2)}
// 0 to 1 up the face: easing in at the foot and onto the shoulder, steady between
function fhRamp(p){const e=FH.e,k=1/(1-e);return p<=0?0:p<e?k*p*p/(2*e):p<1-e?k*(e/2+p-e):p<1?1-k*(1-p)*(1-p)/(2*e):1}
// how far the foothills raise the ground at x, z
function fhHill(x,z){const u=z-fhZ(x);if(u<=0)return 0;const p=u/FH.run,top=FH.top*(1+0.08*Math.sin(x*0.019+1.3)+0.05*Math.sin(x*0.053+0.4));
  return top*fhRamp(p)+Math.max(0,u-FH.run)*0.07+3*Math.sin(x*0.043+z*0.011)*ss(0,0.4,p)*(1-0.7*ss(0.85,1.1,p))+Math.sin(x*0.13+0.7)*Math.sin(z*0.11+1.9)*ss(0,0.3,p)}
// the road's segments (from FH.pts) bucketed on an 8 m grid over its box
const FH_BB=[-100,112,768,950],FH_C=8,FH_NX=Math.ceil((FH_BB[1]-FH_BB[0])/FH_C),FH_G=[];
// the ground with the foothills on it, the overlook levelled and the road graded in: each stretch of road within reach
// in turn (in order up the road) takes the ground to its height across its width and down banks either side, their
// width growing with the height to cut or fill (grassed, about 1 in 2), up to 10 m
function fhGround(x,z,h){let n=h+fhHill(x,z);
  const od=Math.hypot((x-FH_OV.x)/FH_OV.rx,(z-FH_OV.z)/FH_OV.rz);if(od<1.6&&FH_OV.y!==null)n=FH_OV.y+(n-FH_OV.y)*ss(1,1.6,od);
  if(FH_G.length&&x>FH_BB[0]&&x<FH_BB[1]&&z>FH_BB[2]&&z<FH_BB[3]){const L=FH_G[Math.floor((z-FH_BB[2])/FH_C)*FH_NX+Math.floor((x-FH_BB[0])/FH_C)],w=FH.w/2;
    let nd=99,nr=0;for(const q of L){let t=((x-q.ax)*q.dx+(z-q.az)*q.dz)*q.il;t=t<0?0:t>1?1:t;const d=Math.hypot(x-q.ax-q.dx*t,z-q.az-q.dz*t);if(d>w+10)continue;
      const r=q.ha+(q.hb-q.ha)*t;n=r+(n-r)*ss(w,w+Math.min(10,1.5+2*Math.abs(n-r)),d);if(d<nd){nd=d;nr=r}}
    // (and the roadway itself always at the road's height, wherever another leg's bank reaches it)
    if(nd<w+1.5)n=nr+(n-nr)*ss(w,w+1.5,nd)}
  return n}
// the road's heights: sampled every 2 m from the ground under it, smoothed, held to a 10% grade; the overlook level with its end
(function(){const S=[];for(let i=0;i<FH_RD.length-1;i++){const [ax,az]=FH_RD[i],[bx,bz]=FH_RD[i+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/2));
    for(let k=0;k<n;k++)S.push([ax+(bx-ax)*k/n,az+(bz-az)*k/n])}S.push(FH_RD[FH_RD.length-1].slice());
  let h=S.map(([x,z])=>mainHeight(x,z));const s=[0];for(let i=1;i<S.length;i++)s.push(s[i-1]+Math.hypot(S[i][0]-S[i-1][0],S[i][1]-S[i-1][1]));
  for(let it=0;it<40;it++){const g=h.slice();for(let i=1;i<h.length-1;i++)g[i]=(h[i-1]+2*h[i]+h[i+1])/4;h=g}
  for(let i=1;i<h.length;i++)h[i]=Math.min(h[i],h[i-1]+0.1*(s[i]-s[i-1]));for(let i=h.length-2;i>=0;i--)h[i]=Math.min(h[i],h[i+1]+0.1*(s[i+1]-s[i]));
  for(let i=1;i<h.length;i++)h[i]=Math.max(h[i],h[i-1]-0.1*(s[i]-s[i-1]));
  FH.pts=S.map((p,i)=>[p[0],p[1],h[i],s[i]]);FH_OV.y=h[h.length-1];
  const Q=[];for(let i=0;i<S.length-1;i++){const [ax,az,ha]=FH.pts[i],[bx,bz,hb]=FH.pts[i+1],dx=bx-ax,dz=bz-az;Q.push({ax,az,dx,dz,il:1/(dx*dx+dz*dz),ha,hb})}
  for(let j=0;j<Math.ceil((FH_BB[3]-FH_BB[2])/FH_C);j++)for(let i=0;i<FH_NX;i++){const cx=FH_BB[0]+(i+0.5)*FH_C,cz=FH_BB[2]+(j+0.5)*FH_C;
    FH_G.push(Q.filter(q=>{let t=((cx-q.ax)*q.dx+(cz-q.az)*q.dz)*q.il;t=Math.max(0,Math.min(1,t));return Math.hypot(cx-q.ax-q.dx*t,cz-q.az-q.dz*t)<FH_C*0.71+FH.w/2+10.5}))}})();
// ---------- the mountains ----------
// the front range (scenery.js draws it, train.js runs along its foot) rises from 790 m out from the middle of the lake,
// pushed back to 1000 m behind the town for the foothills; where it meets the mainland it rises out of the ground,
// under it at its foot and at least 20 m over it a little way up. mtnFrontY: its height r out at angle a (x = r cos a,
// z = r sin a), and mtnF how far up its full height that is, 0 to 1 (for its colour)
function mtnR0(a){const d=Math.abs(Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2)));return 790+210*(1-ss(0.3,0.6,d))}
let mtnF=0;
function mtnFrontY(r,a){const R0=mtnR0(a),t=Math.pow(Math.max(0,(r-R0)/(1080-R0)),1/0.85),env=ss(0,0.3,t)*(1-0.5*ss(0.8,1,t)),side=0.5+0.5*Math.sin(a+2.4);
  const n=(1-Math.abs(Math.sin(a*7+r*0.013)))*0.5+(1-Math.abs(Math.sin(a*17+r*0.031+1.3)))*0.3+(1-Math.abs(Math.sin(a*37-r*0.05+2.1)))*0.2;
  let y=WATER-6+env*(0.45+0.55*side)*(30+240*n*n);
  let up=0;if(Math.sin(a)>0.3){const L=mainHeight(Math.cos(a)*r,Math.sin(a)*r);if(L>WATER+0.5){const q=L-12+32*ss(0.02,0.18,t);if(q>y){up=1;y=q}}}
  // (where it comes up out of the ground it is wooded, like the foothills)
  mtnF=up?Math.min(0.2,(y-WATER+6)/270):(y-WATER+6)/270;return y}
// the town side's walkable ground ends where the mountains come up out of it: for every 4 m of x, the furthest z south
// that is still clear of them (MAIN_ZS), found at load
const MAIN_ZMAX=1040,MAIN_ZS=new Float32Array(217);
for(let i=0;i<217;i++){const x=-432+i*4;let z=mainRimS(x)+4;while(z<MAIN_ZMAX){const r=Math.hypot(x,z+4),a=Math.atan2(z+4,x);if(mainHeight(x,z+4)<mtnFrontY(r,a)+3)break;z+=4}MAIN_ZS[i]=z}
function mainZS(x){const f=Math.max(0,Math.min(215.999,(x+432)/4)),i=f|0;return MAIN_ZS[i]+(MAIN_ZS[i+1]-MAIN_ZS[i])*(f-i)}
function causewayH(x,z){let y=-1e9;for(const c of CAUSEWAYS){const [t,u]=deckLocal(c,x,z);if(t<-14||t>c.len+2)continue;
  const e=Math.max(Math.abs(u)-c.hw,-t,0),top=c.y+(c.y1-c.y)*Math.max(0,Math.min(1,t/c.len));
  const h=top-0.8*e-0.3*Math.sin(x*1.3+z*0.9)*ss(0,1.5,e);if(h>y)y=h}return y}
// how much of the mainland ground is the hayfield (east of the north trail) or the woods floor (west of it); 0 to 1
function mainField(x,z){return z>-300?0:ss(16,24,x)*ss(-300,-308,z)*(1-ss(390,420,x))}
function mainWoods(x,z){return z>-300?0:ss(-16,-26,x)*ss(-300,-308,z)}
// the forest floor round the town: up the foothills and out past the town's woods, but not on the overlook's clearing
function mainForest(x,z){if(z<FH_Z0)return 0;return ss(0,24,Math.max(z-fhZ(x)+6,Math.abs(x)-300))*ss(1.3,2.2,Math.hypot((x-FH_OV.x)/FH_OV.rx,(z-FH_OV.z)/FH_OV.rz))}
// on the mainland, at least lim in from its shore and inside the part that is drawn
function mainIn(x,z,lim){return Math.abs(x)<=430-lim&&(z<0?z<=mainRimN(x)-lim&&z>=-555+lim:z>=mainRimS(x)+lim&&z<=mainZS(x)-lim)}
// metres along a deck and out from its centreline
function deckLocal(b,x,z){const dx=x-b.x0,dz=z-b.z0;return [dx*b.ux+dz*b.uz,dz*b.ux-dx*b.uz]}
// the deck height at x,z, or -1e9 off every deck
function deckAt(x,z){let y=-1e9;for(const b of BRIDGES){const [t,u]=deckLocal(b,x,z);if(t>=0&&t<=b.len&&Math.abs(u)<=b.hw+0.3){const h=b.y+(b.y1-b.y)*t/b.len;if(h>y)y=h}}return y}
// ground a machine or the worker (walk: foot bridges too) can stand on, at least lim in from a cliff edge (side: from a
// deck's railings): the mesa, the Family Island, Jessica's Island or a bridge deck
// Corley's bank and beach, down to the water: the ground here and lim further out from the island's middle above the lake
function shoreIn(x,z,lim){if(mesaR(x,z)>EDGE+40)return false;const dz=z-MZ,l=Math.hypot(x,dz)||1;
  return baseHeight(x,z)>WATER+0.15&&baseHeight(x+x/l*lim,z+dz/l*lim)>WATER+0.15}
function landIn(x,z,lim,side,walk){if(mesaR(x,z)<=EDGE-lim||shoreIn(x,z,lim)||famR(x,z)<=FAM_R-lim||jesR(x,z)<=JES_R-lim||dexR(x,z)<=DEX_R-lim||mainIn(x,z,lim))return true;
  for(const c of CAUSEWAYS){const [t,u]=deckLocal(c,x,z);if(t>=0&&t<=c.len&&Math.abs(u)<=c.hw-side-0.4)return true}
  for(const b of BRIDGES){if((b.foot||b.dock)&&!walk)continue;const [t,u]=deckLocal(b,x,z);if(t>=0&&t<=b.len&&Math.abs(u)<=b.hw-side)return true}return false}
// the nearest such spot to x,z (x,z itself when it already is one)
function landClamp(x,z,lim,side,walk){if(landIn(x,z,lim,side,walk))return [x,z];
  const c=[],r=mesaR(x,z),f=famR(x,z),j=jesR(x,z),dx=dexR(x,z);
  c.push([DEX_X+(x-DEX_X)*(DEX_R-lim)/dx,DEX_Z+(z-DEX_Z)*(DEX_R-lim)/dx]);
  c.push([x*(EDGE-lim)/r,MZ+(z-MZ)*(EDGE-lim)/r]);
  // in the lake off Corley's: back in towards the middle to the water's edge
  if(r<EDGE+60){const dz=z-MZ,l=Math.hypot(x,dz)||1,ux=x/l,uz=dz/l;let px=x,pz=z;
    for(let n=0;n<160;n++){px-=ux*0.5;pz-=uz*0.5;if(mesaR(px,pz)<=EDGE-lim||shoreIn(px,pz,lim)){c.push([px,pz]);break}}}
  c.push([FAM_X+(x-FAM_X)*(FAM_R-lim)/f,FAM_Z+(z-FAM_Z)*(FAM_R-lim)/f]);
  c.push([JES_X+(x-JES_X)*(JES_R-lim)/j,JES_Z+(z-JES_Z)*(JES_R-lim)/j]);
  {const mx=Math.max(lim-430,Math.min(430-lim,x));c.push(z<0?[mx,Math.max(-555+lim,Math.min(mainRimN(mx)-lim,z))]:[mx,Math.min(mainZS(mx)-lim,Math.max(mainRimS(mx)+lim,z))])}
  for(const b of CAUSEWAYS){let [t,u]=deckLocal(b,x,z);t=Math.max(0,Math.min(b.len,t));u=Math.max(side+0.4-b.hw,Math.min(b.hw-side-0.4,u));c.push([b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u])}
  for(const b of BRIDGES){if((b.foot||b.dock)&&!walk)continue;let [t,u]=deckLocal(b,x,z);t=Math.max(0,Math.min(b.len,t));u=Math.max(side-b.hw,Math.min(b.hw-side,u));
    c.push([b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u])}
  let best=c[0],bd=1e18;for(const q of c){const d=(q[0]-x)**2+(q[1]-z)**2;if(d<bd){bd=d;best=q}}return best}
// fixed things the machines and the worker can't pass through (buildings on the Family Island), as boxes along the
// axes {x, z, hx, hz: half sizes}; family.js fills it. Things placed in the map editor (props.js) are turned boxes:
// lx, lz their own half sizes, cs and sn the cosine and sine of their turn, hx and hz then the box along the axes round them
const SOLIDS=[];
// a fixed thing's box, declared by the code that builds it, for the map editor to pick and move as one with all that
// stands in it (fixed.js): n its name, x, z its middle, hx, hz half its size
const FX_DECL=[],fxDecl=(n,x,z,hx,hz)=>FX_DECL.push({n,x,z,hx,hz});
// what a boat can't get past on the water (boats.js): bridge piers, pile bents and moored hulls, each a thick line from
// ax,az to bx,bz, r out from it. family.js, jessica.js and boats.js fill it as they build them; a trestle's bents are kept
// with its spans instead (crnSpans in mainland.js), as they change from timber to steel
const BOAT_WALLS=[];
// how far to move a circle (x, z, radius r) so it clears a solid, [dx, dz], or null when it is clear already. A foot:1
// entry is only a building's footprint (one you can walk into: its walls are solids of their own), which keeps things
// placed round it out of it but stops nothing
function solidOut(s,x,z,r){if(s.foot)return null;let dx=x-s.x,dz=z-s.z,hx=s.hx,hz=s.hz;const rot=s.sn!==undefined;
  if(rot){const a=dx*s.cs-dz*s.sn;dz=dx*s.sn+dz*s.cs;dx=a;hx=s.lx;hz=s.lz}
  const nx=dx-Math.max(-hx,Math.min(hx,dx)),nz=dz-Math.max(-hz,Math.min(hz,dz)),d=Math.hypot(nx,nz);if(d>=r)return null;
  let px=0,pz=0;if(d>1e-4){px=nx/d*(r-d);pz=nz/d*(r-d)}else if(hx-Math.abs(dx)<hz-Math.abs(dz))px=Math.sign(dx||1)*(hx-Math.abs(dx)+r);else pz=Math.sign(dz||1)*(hz-Math.abs(dz)+r);
  return rot?[px*s.cs+pz*s.sn,pz*s.cs-px*s.sn]:[px,pz]}
// roads: centrelines in metres and widths; a third number on every point grades the road to that height (the ramp).
// The map editor can replace them (a saved map's roads load here)
const ROAD_W=3.6;
const ROADS=[
  {w:3.6,mid:1,pts:[[-40,16],[-30,-6],[-14,-12],[0,-13],[16,-12],[32,-6],[40,6],[41,22],[40,34],[28,35],[12,38.5],[0,39.5],[-24,37.5],[-38,33],[-40,16]]},
  {w:4.8,mid:0,pts:[[40,34,0],[38,36.5,BENCH_H*0.027],[20,44.5,BENCH_H*0.33],[0,49,BENCH_H*0.66],[-22,53,BENCH_H]]},
  {w:3.6,mid:1,pts:[[-22,53],[-33,59.5],[-20,66.5],[0,66.5],[20,65],[30,58.5],[18,55],[2,57],[-14,56.5],[-22,53]]},
  {w:2.4,mid:0,pts:[[41,12],[33,9],[24,10.5],[19,17],[21,23.5],[27,20]]},
];
if(mapRoads){ROADS.length=0;ROADS.push(...mapRoads);mapRoads=ROADS}
// roads that come with the islands, not the map editor (it neither shows nor saves them): the approach on the Lower
// Bench to the Family Island bridge, and the Family Island's roads, all graded to the bridge deck: the road from the
// bridge to a roundabout in the middle, on to the mainland bridge, arms west and east (where Dexter's and Jessica's
// bridges will go) and the drive to the house
const ISLAND_ROADS=[
  {w:4.2,mid:1,pts:[[0,-13],[0,-44],[0,-84]]},
  // the mainland: over each causeway, the north trail into the woods and the lane along the hayfield, and the town's
  // main street, beach road (east of Main Street it turns into the marina's car park) and cross street; the town's are
  // paved over in mainland.js (mainStreets)
  {w:6,mid:0,pts:[[0,-213],[0,-296],[0,-336]]},
  {w:3.2,mid:1,pts:[[0,-336],[-30,-346],[-90,-370],[-150,-362],[-220,-396],[-300,-410],[-380,-440]]},
  {w:3.6,mid:1,pts:[[0,-336],[60,-333],[180,-337],[320,-331],[400,-334]]},
  {w:6,mid:0,pts:[[0,500],[0,566]]},
  {w:8,mid:0,pts:[[0,566],[0,725]]},
  {w:5,mid:0,pts:[[-170,576],[-60,574],[0,574]]},
  {w:5,mid:0,pts:[[0,574],[26,574],[36,582],[57.5,586.4]]},
  {w:6,mid:0,pts:[[-140,652],[0,652],[140,652]]},
  // Overlook Road and the Lookout Trail up the foothills (graded in fhGround; paved and laid in hills.js)
  {w:6.6,mid:0,pts:FH_RD},{w:1.5,mid:0,pts:FH_TRAIL},
  {w:4.8,mid:0,pts:[[0,63,FAM_Y],[0,72,FAM_Y]]},
  {w:4.8,mid:0,pts:[[0,165,FAM_Y],[0,234,FAM_Y]]},
  {w:4.8,mid:0,pts:Array.from({length:17},(_,i)=>[FAM_X+Math.sin(i/16*Math.PI*2)*11,FAM_Z-Math.cos(i/16*Math.PI*2)*11,FAM_Y])},
  {w:4.8,mid:0,pts:[[0,256,FAM_Y],[0,322,FAM_Y]]},
  {w:4.8,mid:0,pts:[[-11,245,FAM_Y],[-72,245,FAM_Y]]},
  {w:4.8,mid:0,pts:[[11,245,FAM_Y],[72,245,FAM_Y]]},
  {w:3.6,mid:1,pts:[[-34,243,FAM_Y],[-34,223,FAM_Y]]},
  {w:3,mid:0,pts:[[158,JES_Z,JES_Y],[166,JES_Z,JES_Y]]},
  {w:9,mid:0,pts:[[-158,DEX_Z,FAM_Y],[-170,DEX_Z,FAM_Y]]},
  {w:5,mid:0,pts:[[-170,245],[-186,245],[-196,240],[-205,238.5],[-216,238.5],[-224,240]]},
  {w:2,mid:0,pts:[[165,245],[171,243.6],[178,247.4],[185,248.8],[191,245.6],[196,243.6],[201,245],[203.6,245]]},
];
// segments bucketed on a 4 m grid so a lookup only checks the few nearby; roadAt leaves its answer in RD_*.
// Rebuilt whenever the editor changes a road
const RG_X0=-452,RG_Z0=-600,RG_C=4,RG_NX=227,RG_NZ=412,RG=[],RSEG=[];
function roadsBuild(){RSEG.length=0;RG.length=0;
  for(const r of ROADS.concat(ISLAND_ROADS))for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1];if(dx*dx+dz*dz<1e-6)continue;
    RSEG.push({ax:a[0],az:a[1],dx,dz,il:1/(dx*dx+dz*dz),ha:a[2],hb:b[2],w:r.w,mid:r.mid,g:a.length>2&&b.length>2})}
  for(let j=0;j<RG_NZ;j++)for(let i=0;i<RG_NX;i++){const cx=RG_X0+(i+0.5)*RG_C,cz=RG_Z0+(j+0.5)*RG_C,l=[];
    for(const q of RSEG){let t=((cx-q.ax)*q.dx+(cz-q.az)*q.dz)*q.il;t=Math.max(0,Math.min(1,t));
      if(Math.hypot(cx-q.ax-q.dx*t,cz-q.az-q.dz*t)<RG_C*0.71+q.w/2+3.5)l.push(q)}RG.push(l)}}
roadsBuild();
// RD_o: metres out from the edge of a standard-width road (roadOff's old meaning), RD_mid: grass up the middle;
// RD_gd, RD_h, RD_gw: distance to the nearest graded road, its height there and its width
let RD_o=99,RD_mid=0,RD_gd=99,RD_h=0,RD_gw=0;
function roadAt(x,z){RD_o=99;RD_gd=99;
  const i=Math.floor((x-RG_X0)/RG_C),j=Math.floor((z-RG_Z0)/RG_C);if(i<0||j<0||i>=RG_NX||j>=RG_NZ)return;
  for(const q of RG[j*RG_NX+i]){let t=((x-q.ax)*q.dx+(z-q.az)*q.dz)*q.il;t=t<0?0:t>1?1:t;
    const d=Math.hypot(x-q.ax-q.dx*t,z-q.az-q.dz*t),o=d-(q.w-ROAD_W)/2;
    if(o<RD_o){RD_o=o;RD_mid=q.mid}
    if(q.g&&d<RD_gd){RD_gd=d;RD_h=q.ha+(q.hb-q.ha)*t;RD_gw=q.w}}}
// roadOff is metres across a standard-width road from its centreline
function roadOff(x,z){roadAt(x,z);return RD_o}
function roadAmt(x,z){return 1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,Math.abs(roadOff(x,z)))}
// packed tan dirt, darker in the two wheel tracks, a little grass up the middle; blends colour c (rgb array) toward it, returns the amount
function roadTint(x,z,c,n){const o=Math.abs(roadOff(x,z)),a=1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,o);if(a<=0)return 0;
  const rut=1-0.17*Math.exp(-((o-0.95)/0.32)*((o-0.95)/0.32)),mid=0.35*(1-ss(0.15,0.45,o))*RD_mid,v=0.92+0.16*n;
  const rc=[0.58*v*rut,0.47*v*rut,0.33*v*rut];rc[0]+=(0.36-rc[0])*mid;rc[1]+=(0.5-rc[1])*mid;rc[2]+=(0.26-rc[2])*mid;
  for(let q=0;q<3;q++)c[q]+=(rc[q]-c[q])*a;return a*(1-mid)}
// the scarp's centre line, and smooth round hills
function scarpZ(x){return 45+2.5*Math.sin(x*0.09+0.5)}
function hill(x,z,cx,cz,rx,rz,h){const t=Math.hypot((x-cx)/rx,(z-cz)/rz);return t>=1?0:h*0.5*(1+Math.cos(Math.PI*t))}
// worked dirt: the Lower Bench yard, a laydown pad west of the dig and the spoil yard on the north lawn; 0 to 1
function yardAt(x,z){const r=coreR(x,z),sp=1-ss(1,4,Math.hypot(Math.max(0,Math.abs(x)-12),Math.max(0,Math.abs(z+52)-8))),zs=scarpZ(x),dx=Math.abs(x-DEX_X)<DEX_R+8&&Math.abs(z-DEX_Z)<DEX_R+8?1-ss(DEX_R-9,DEX_R-4,dexR(x,z)):0;
  return Math.max(0,Math.min(1,Math.max(ss(zs+3,zs+6,z)*(1-ss(37,42,r)),ss(0.15,0.4,hill(x,z,-22,4,9,6,1)),dx,sp)+edSample(ED_P,x,z)))}
// colour c (rgb array) toward packed dirt by the yard amount; returns the amount
function yardTint(x,z,c,n){const a=yardAt(x,z);if(a<=0)return 0;const v=0.86+0.2*n;
  c[0]+=(0.55*v-c[0])*a;c[1]+=(0.42*v-c[1])*a;c[2]+=(0.29*v-c[2])*a;return a}
// the generated ground plus the editor's raise and lower
function baseHeight(x,z){return groundHeight(x,z)+edSample(ED_H,x,z)}
// the mesa and, rising from the lake to its south, the Family Island
function groundHeight(x,z){let h=mesaHeight(x,z);
  if(Math.abs(x-FAM_X)<FAM_R+50&&Math.abs(z-FAM_Z)<FAM_R+50){const f=famHeight(x,z);if(f>h)h=f}
  if(Math.abs(x-JES_X)<JES_R+50&&Math.abs(z-JES_Z)<JES_R+50){const f=jesHeight(x,z);if(f>h)h=f}
  if(Math.abs(x-DEX_X)<DEX_R+50&&Math.abs(z-DEX_Z)<DEX_R+50){const f=dexHeight(x,z);if(f>h)h=f}
  if(z<-170||z>460){const f=mainHeight(x,z);if(f>h)h=f}
  if(Math.abs(x)<30&&((z<-190&&z>-300)||(z>480&&z<570))){const f=causewayH(x,z);if(f>h)h=f}
  return h}
// the ground d metres out from an island's rim at height Y: a rocky bank down to the back of a sand beach 4 to 5 ft above
// the lake, the beach sloping gently into the water (narrower and wider round the island), a wading shelf, then the lake bed
function shore(d,x,z,Y){const W=WATER,back=W+1.4+0.25*Math.sin(x*0.05+z*0.04),bw=Math.max(2.5,(Y-back)*1.25);
  if(d<bw)return Y+(back-Y)*ss(0,bw,d)-0.4*Math.sin(d*2.3+x*0.1)*Math.sin(Math.PI*d/bw);
  const e=d-bw,bl=Math.max(5,12+4*Math.sin(x*0.043-z*0.037+1.7)+2.5*Math.sin(x*0.11+z*0.09));
  if(e<bl)return back-(back-W)*e/bl;
  const f=e-bl;return W-0.9*ss(0,9,f)-5*ss(6,28,f)-5*ss(24,60,f)}
function isleCliff(d,x,z,Y){return shore(d,x,z,Y)}
// Dexter's Island: a flat gravel yard at the Family Island's height, with a dirt pile to climb and his dirt bike track
// Dexter's dirt bike track (bike.js) in the practice yard: a 13 ft wide oval, two straights joined round A and B by
// banked turns, whoops on the south straight (where the bike starts, heading west) and a tabletop jump on the north one.
// trkAt(x,z) sets TRK_S, metres along the line (0 at the north straight's west end, running east, so clockwise on the
// map), and TRK_U, metres out from it (+ away from the infield)
const TRK_A=[-228,270],TRK_B=[-210,270],TRK_R=10.5,TRK_W=4,TRK_L2=TRK_B[0]-TRK_A[0],TRK_LEN=2*TRK_L2+2*Math.PI*TRK_R;
// the finer ground mesh drawn over it (dexter.js), on the 1.5 m mesh's lines
const TRK_BOX=[-243.5,-192.5,252.5,287];
let TRK_S=0,TRK_U=0;
function trkAt(x,z){const dz=z-TRK_A[1],R=TRK_R,L=TRK_L2;
  if(x>=TRK_A[0]&&x<=TRK_B[0]){if(dz<0){TRK_S=x-TRK_A[0];TRK_U=-dz-R}else{TRK_S=L+Math.PI*R+TRK_B[0]-x;TRK_U=dz-R}return}
  const e=x>TRK_B[0],dx=x-(e?TRK_B[0]:TRK_A[0]);let a=Math.atan2(dz,dx);TRK_U=Math.hypot(dx,dz)-R;
  if(e)TRK_S=L+(a+Math.PI/2)*R;else{if(a<0)a+=2*Math.PI;TRK_S=2*L+Math.PI*R+(a-Math.PI/2)*R}}
// the track's shape above the yard: the jump and the whoops fade off its edges, the turns bank up to a berm outside
function trkH(x,z){if(x<TRK_BOX[0]||x>TRK_BOX[1]||z<TRK_BOX[2]||z>TRK_BOX[3])return 0;trkAt(x,z);
  const s=TRK_S,u=TRK_U,hw=TRK_W/2,L=TRK_L2,PR=Math.PI*TRK_R;if(Math.abs(u)>hw+3)return 0;
  let f=0;
  // tabletop: 4 ft up a 10 ft ramp each way, a 14 ft top
  {const t=Math.abs(s-L/2);if(t<5.2)f+=t<2.2?1.2:1.2*Math.min(1,(5.2-t)/3)}
  // whoops: four 16 in rollers, 10 ft apart
  {const t=s-(L+PR+4);if(t>0&&t<12)f+=0.2*(1-Math.cos(t*Math.PI*2/3))}
  let h=f*(1-ss(hw,hw+1.5,Math.abs(u)));
  // berms: the turns lean in, rising to 3 ft along the outside edge and falling away behind it
  const c=s<L||s>2*L+PR?0:s<L+PR?ss(L,L+3,s)*(1-ss(L+PR-3,L+PR,s)):ss(L+PR+L,L+PR+L+3,s)*(1-ss(TRK_LEN-3,TRK_LEN,s));
  if(c>0)h+=c*(u<hw?0.75*ss(-hw,hw,u):0.9*(1-ss(hw+0.4,hw+2.8,u))+0.15*(1-ss(hw,hw+0.4,u)));
  return h}
// the track's dirt: dark, worked loam; returns how much of it there is at x,z (0 off the track)
function trkTint(x,z,c,n){if(x<TRK_BOX[0]||x>TRK_BOX[1]||z<TRK_BOX[2]||z>TRK_BOX[3])return 0;trkAt(x,z);
  const a=1-ss(TRK_W/2+0.3,TRK_W/2+2.2,Math.abs(TRK_U));if(a<=0)return 0;const v=0.9+0.2*n,line=1-0.12*Math.exp(-TRK_U*TRK_U*1.5);
  const tc=[0.42*v*line,0.3*v*line,0.2*v*line];for(let q=0;q<3;q++)c[q]+=(tc[q]-c[q])*a;return a}
function dexHeight(x,z){const d=dexR(x,z)-DEX_R;let top=FAM_Y;
  if(d<3){top+=hill(x,z,-233,249,5.5,5,1.8)+trkH(x,z);
    if(d<0)return top}
  const out=isleCliff(d,x,z,FAM_Y);
  return d<3?out+(top-FAM_Y)*(1-ss(0,3,d)):out}
// Jessica's Island: soft rolls, flat round the cottage, graded where the footbridge lands
function jesHeight(x,z){const d=jesR(x,z)-JES_R;let top=JES_Y;
  if(d<3){top+=(0.3*Math.sin(x*0.11+1.2)*Math.cos(z*0.09+0.3)+0.18*Math.sin(x*0.23-z*0.19))*ss(8,13,Math.hypot(x-JES_CX,z-JES_CZ));
    roadAt(x,z);if(RD_gd<RD_gw/2+2.5)top=RD_h+(top-RD_h)*ss(RD_gw/2,RD_gw/2+2.5,RD_gd);
    if(d<0)return top}
  const out=isleCliff(d,x,z,JES_Y);
  return d<3?out+(top-JES_Y)*(1-ss(0,3,d)):out}
// the Family Island: gently rolling grass graded flat along its roads, a rocky bank down to the beach (shore)
function famHeight(x,z){const d=famR(x,z)-FAM_R;let top=FAM_Y;
  if(d<3){top+=0.35*Math.sin(x*0.07+0.4)*Math.cos(z*0.06+1.1)+0.2*Math.sin(x*0.19-z*0.15);
    roadAt(x,z);if(RD_gd<RD_gw/2+2.5)top=RD_h+(top-RD_h)*ss(RD_gw/2,RD_gw/2+2.5,RD_gd);
    if(d<0)return top}
  const out=isleCliff(d,x,z,FAM_Y);
  return d<3?out+(top-FAM_Y)*(1-ss(0,3,d)):out}
function mesaHeight(x,z){
  const r=mesaR(x,z);let h;
  if(r<EDGE+3){
    // gentle rolls, flatter round the dig; Lookout Knoll (6 ft) and West Rise (3 ft) on the top; the bench and its stockpiles
    const roll=(0.012+0.025*ss(16,34,Math.hypot(x,z+4)))*(6*Math.sin(x*0.09+1.3)*Math.cos(z*0.08)+4*Math.sin(x*0.21+z*0.17));
    const top=roll+hill(x,z,27,20,12.5,12.5,1.83)+hill(x,z,-22,22,9,9,0.9);
    const zs=scarpZ(x),lo=ss(zs-4,zs+5,z);
    const bench=BENCH_H+roll*0.5+hill(x,z,-8,61.5,4.5,3.4,2.4)+hill(x,z,9,61.3,5,3.4,2.4)+hill(x,z,22,60,3.5,3,1.5);
    h=top+(bench-top)*lo;
    roadAt(x,z);
    const lip=ss(EDGE-6,EDGE,r)*0.4*(0.5+0.5*Math.sin(Math.atan2(z-MZ,x)*7));
    if(lip>0)h+=lip*(1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,Math.abs(RD_o)));
    // the ramp is graded into the scarp, with cut and fill banks either side
    if(RD_gd<RD_gw/2+2.5)h=RD_h+(h-RD_h)*ss(RD_gw/2,RD_gw/2+2.5,RD_gd);
    if(r<EDGE)return h;
  }
  // the bank and beach start from the ground at the rim (the bench is lower than the top)
  const d=r-EDGE,zs=scarpZ(x),rim=BENCH_H*ss(zs-4,zs+5,z);
  return shore(d,x,z,d<3?rim+(h-rim)*(1-ss(0,3,d)):rim);
}
// ground too steep to drive onto (the scarp, ramp banks, stockpiles), on a 0.5 m grid over the mesa from the original grade
const WG_X0=-112,WG_Z0=-122,WG_C=0.5,WG_NX=449,WG_NZ=405,WALL=new Uint8Array(WG_NX*WG_NZ);
// rebuilt over an area (metres) after the editor reshapes it
function wallBuild(x0,x1,z0,z1){
  const i0=Math.max(1,Math.floor((x0-WG_X0)/WG_C)-1),i1=Math.min(WG_NX-2,Math.ceil((x1-WG_X0)/WG_C)+1),j0=Math.max(1,Math.floor((z0-WG_Z0)/WG_C)-1),j1=Math.min(WG_NZ-2,Math.ceil((z1-WG_Z0)/WG_C)+1);
  const W=i1-i0+3,hh=new Float32Array(W*(j1-j0+3)),hv=(i,j)=>hh[(j-j0+1)*W+i-i0+1];
  for(let j=j0-1;j<=j1+1;j++)for(let i=i0-1;i<=i1+1;i++)hh[(j-j0+1)*W+i-i0+1]=baseHeight(WG_X0+i*WG_C,WG_Z0+j*WG_C);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*WG_NX+i;WALL[k]=0;
    if(mesaR(WG_X0+i*WG_C,WG_Z0+j*WG_C)>EDGE-1)continue;
    const sl=Math.hypot(hv(i+1,j)-hv(i-1,j),hv(i,j+1)-hv(i,j-1))/(2*WG_C);if(sl>0.85)WALL[k]=1}}
wallBuild(WG_X0,WG_X0+(WG_NX-1)*WG_C,WG_Z0,WG_Z0+(WG_NZ-1)*WG_C);
function wallAt(x,z){const i=Math.round((x-WG_X0)/WG_C),j=Math.round((z-WG_Z0)/WG_C);return i>=0&&j>=0&&i<WG_NX&&j<WG_NZ&&WALL[j*WG_NX+i]===1}
// how many of a machine's probe points (local [side, forward] offsets) stand on ground too steep to drive
function wallCount(x,z,yaw,P){const s=Math.sin(yaw),c=Math.cos(yaw);let n=0;for(const [lx,lz] of P)if(wallAt(x+lx*c+lz*s,z-lx*s+lz*c))n++;return n}
const PIPE_Z=-5.5, TRENCH_Z0=-8.5, TRENCH_Z1=-3.0;
// a dig-grid vertex's undug colour (grass, rock on steep ground, sand, the yards and roads, painted materials), its
// dirt-texture amount and how much material covers it. digBaseAt works from where the point is on the map alone (its
// noise from world cell numbers, cellW), so a point looks the same wherever the grid sits and a tile's ground can be
// worked out ahead of the grid (digBaseFill); it leaves r, g, b, rock, material cover and mud in DGB
const DGB=new Float32Array(6),cellW=v=>Math.round(v/CELL);
function digBaseAt(x,z,h,iw,jw){const n=hash(iw,jw),n2=hash(iw*0.37|0,jw*0.37|0);
  const rc=[0.30+0.07*n+0.05*n2,0.50+0.08*n+0.04*n2,0.24+0.04*n];
  const sl=(Math.abs(baseHeight(x+0.5,z)-baseHeight(x-0.5,z))+Math.abs(baseHeight(x,z+0.5)-baseHeight(x,z-0.5))),rock=ss(0.55,1.1,sl),sand=1-ss(WATER+1.6,WATER+2.4,h),st2=0.06*Math.sin(h*1.4+n);
  if(rock>0){rc[0]+=(0.50+0.06*n+st2-rc[0])*rock;rc[1]+=(0.44+0.05*n+st2-rc[1])*rock;rc[2]+=(0.38+0.04*n+st2-rc[2])*rock}
  if(sand>0){rc[0]+=(0.80-rc[0])*sand;rc[1]+=(0.72-rc[1])*sand;rc[2]+=(0.52-rc[2])*sand}
  const ya=yardTint(x,z,rc,n),ra=roadTint(x,z,rc,n),mc=matTint(x,z,rc);DGB[0]=rc[0];DGB[1]=rc[1];DGB[2]=rc[2];
  DGB[3]=Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9,ya*0.85))*(MAT_GL2?1:1-mc);DGB[4]=mc;DGB[5]=matCovOf(x,z,MUD_ID)}
function digBase(k){const x=gX(k%V),z=gZ((k/V)|0);digBaseAt(x,z,H0[k],cellW(x),cellW(z));
  grass[k*3]=DGB[0];grass[k*3+1]=DGB[1];grass[k*3+2]=DGB[2];rockA[k]=DGB[3];matCov[k]=DGB[4];mudBase[k]=DGB[5]}
// the untouched ground of tiles, by tile, so moving the grid copies it instead of working it out again (about 800,000
// height samples for the grid, most of a move's time): the grade (h), the colour, rock, material cover and mud as bytes
// (c, 6 a point) and the grain noise (nz). rows: how many rows are worked out so far (a tile can be done a few rows a
// frame ahead of the grid, digBasePrefetch in digtiles.js). Map edits drop them all (edRefresh); the oldest go past
// BASE_MAX tiles (about 450 KB each: the grid's 4 and the 12 round it, plus a few)
const baseCache=new Map(),BASE_MAX=20,BASE_W=N/TPG+1;
const baseKey=(ti,tj)=>(ti+64)*128+tj+64;
function baseEntry(ti,tj){const key=baseKey(ti,tj);let e=baseCache.get(key);
  if(e){baseCache.delete(key);baseCache.set(key,e);return e}
  const np=BASE_W*BASE_W;e={ti,tj,rows:0,h:new Float32Array(np),c:new Uint8Array(np*6),nz:new Uint8Array(np)};baseCache.set(key,e);
  for(const [k,o] of baseCache){if(baseCache.size<=BASE_MAX)break;if(o!==e&&!DIG_TILES.some(t=>baseKey(t.ti,t.tj)===k))baseCache.delete(k)}
  return e}
// work out up to n more rows of tile e; true once it is all done
function digBaseFill(e,n){const x0=e.ti*TILE,z0=e.tj*TILE,b1=Math.min(BASE_W,e.rows+n);
  for(let b=e.rows;b<b1;b++){const z=z0+b*CELL,jw=cellW(z);for(let a=0;a<BASE_W;a++){const x=x0+a*CELL,iw=cellW(x),q=b*BASE_W+a,h=baseHeight(x,z);
    e.h[q]=h;digBaseAt(x,z,h,iw,jw);for(let c=0;c<6;c++)e.c[q*6+c]=Math.round(Math.min(1,Math.max(0,DGB[c]))*255);e.nz[q]=Math.round(hash(iw*1.7+3,jw*2.3+1)*255)}}
  e.rows=b1;return e.rows>=BASE_W}
function baseCacheClear(){baseCache.clear()}
// the untouched grid where it sits: original grade, noise, colours and the trench's paint marks; run again when it moves
function digInit(){paint.fill(0);
for(const t of DIG_TILES){const e=baseEntry(t.ti,t.tj);digBaseFill(e,BASE_W);
  for(let b=0;b<BASE_W;b++)for(let a=0;a<BASE_W;a++){const k=(t.j0+b)*V+t.i0+a,q=b*BASE_W+a,c=e.c;
    H0[k]=H[k]=e.h[q];nz[k]=e.nz[q]/255;grass[k*3]=c[q*6]/255;grass[k*3+1]=c[q*6+1]/255;grass[k*3+2]=c[q*6+2]/255;rockA[k]=c[q*6+3]/255;matCov[k]=c[q*6+4]/255;mudBase[k]=c[q*6+5]/255}}
for(let j=0;j<V;j++)for(let i=0;i<V;i++){const k=j*V+i,x=gX(i),z=gZ(j);
  const hc=CELL/2+0.001,onSide=Math.abs(Math.abs(x)-0.5)<hc&&z>=TRENCH_Z0-hc&&z<=TRENCH_Z1+hc;
  const onEnd=(Math.abs(z-TRENCH_Z0)<hc||Math.abs(z-TRENCH_Z1)<hc)&&Math.abs(x)<=0.5+hc;
  if(onSide||onEnd)paint[k]=1;
  else if(Math.abs(z-PIPE_Z)<hc&&Math.abs(x)<12&&(Math.floor(x+50)&1)===0)paint[k]=2;
}}
digInit();
const PIPE_Y=baseHeight(0,PIPE_Z)-1.3, PIPE_R=0.08;
// textures: grass and dirt detail blended per vertex on the ground (the grass a photo-scanned lawn, ambientCG Grass001,
// with its own relief map), grime overlay on the machines, and a large soft
// macro map that breaks up the repeat. The ground pack (textures/ground/) has each map at 512, 1024 and 2048 px for
// Low, Medium and High graphics (or the size picked in the Graphics panel); this loads the one the saved setting (or a
// phone) wants, and gfx.js swaps it (texTierSet) if the setting turns out otherwise. Grass and dirt are neutral albedo,
// tinted by the vertex colours
const texManager=new THREE.LoadingManager(),texLoader=new THREE.TextureLoader(texManager);
let texTier=(()=>{let k=null,c=null;try{k=localStorage.getItem('bhd_gfx');c=JSON.parse(localStorage.getItem('bhd_gfxc')||'null')}catch(e){}
  if(c&&['low','med','high'].includes(c.tex))return c.tex;return k==='low'||k==='med'||k==='high'?k:PHONE?'low':'high'})();
// the pack's grime is centred on mid grey; the machines multiply it straight onto their paint, so it is lifted to
// near white (mean 0.9) keeping a gentle spread of stains: baked into grime_lift.jpg (tools/bake_tex.py), as doing it
// here held up the start by seconds
const texFile=n=>n==='grime'?'grime_lift':n;
// anisotropic filtering (sharper ground at a slant), capped by what the GPU offers; the Graphics setting sets it (texAnisoSet)
let texAnisoN=Math.min({low:4,med:8,high:16}[texTier],renderer.capabilities.getMaxAnisotropy());
function loadTex(name){const t=texLoader.load(`textures/ground/${texTier}/${texFile(name)}.jpg`);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=texAnisoN;return t}
const texGrass=loadTex('grass'),texDirt=loadTex('dirt'),texGrime=loadTex('grime');
// relief of the natural dirt and grass (Material relief, High graphics; made by tools/pbr.py ground): fetched the first
// time relief is on, and groundRelU (relief strength, 0 off) set each frame by matPbrSync (materials.js); faceRelU the
// same for the cut-face detail on dug and dumped dirt (no map: its own pattern is the height, FACE_GLSL)
const texGrassN=new THREE.Texture(),texDirtN=new THREE.Texture(),groundRelU={value:0},groundRelFarU={value:0},faceRelU={value:0};
for(const t of [texGrassN,texDirtN]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter}
function groundRelLoad(){if(texDirtN.image)return;for(const [t,n] of [[texGrassN,'grass_n'],[texDirtN,'dirt_n']])new THREE.ImageLoader().load(`textures/ground/${n}.jpg`,im=>{t.image=im;t.anisotropy=texAnisoN;t.needsUpdate=true})}
function texAnisoSet(n){n=Math.max(1,Math.min(n,renderer.capabilities.getMaxAnisotropy()));if(n===texAnisoN)return;texAnisoN=n;
  for(const t of [texGrass,texDirt,texGrime]){t.anisotropy=n;if(t.image)t.needsUpdate=true}}
// the macro map (High by default): when it is off the file is never fetched and the ground shader skips it (macroU is 0)
const texMacro=new THREE.Texture();texMacro.wrapS=texMacro.wrapT=THREE.RepeatWrapping;texMacro.generateMipmaps=true;texMacro.minFilter=THREE.LinearMipmapLinearFilter;
const macroU={value:0};
function macroSet(on){macroU.value=on?TEX_K.macro:0;
  if(on&&!texMacro.image)new THREE.ImageLoader().load('textures/ground/macro.jpg',im=>{texMacro.image=im;texMacro.needsUpdate=true})}
// swaps the three maps to another size's images (the textures stay the same objects, so every material keeps them). The
// old image stays on screen until the new one has loaded, then the old GPU copy is freed. A quick second change wins
function texTierSet(k){if(!['low','med','high'].includes(k)||k===texTier)return;texTier=k;
  for(const [t,n] of [[texGrass,'grass'],[texDirt,'dirt'],[texGrime,'grime']])new THREE.ImageLoader().load(`textures/ground/${k}/${texFile(n)}.jpg`,im=>{
    if(k!==texTier)return;t.dispose();t.image=im;t.needsUpdate=true})}
// texture repeats per metre (grass, dirt) and how strongly the macro map (one tile per 40 m) lightens and darkens
const TEX_K={grass:0.4,dirt:0.45,macro:1.5};
// texMixU gates the extras (cut-face detail, material library, machine grime); texBaseU is the plain grass and dirt
// texture on the ground, which Low keeps at 512 px
const texMixU={value:0},texBaseU={value:0};
// cut-face detail painted on dug and dumped dirt, by layer (the same depths as layerAt): roots and runners in topsoil,
// grey mottles and pebbles in clay, fine streaks in sand, cracks in rock, crumbs in loose fill, and on steep cuts the
// grooves the bucket's five teeth leave, about 7 in apart. vSD is depth below original grade (negative for fill).
const FACE_GLSL=`
float fh(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float fn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(fh(i),fh(i+vec2(1.0,0.0)),f.x),mix(fh(i+vec2(0.0,1.0)),fh(i+vec2(1.0,1.0)),f.x),f.y);}
float fb(vec2 p){return 0.5*fn(p)+0.3*fn(p*2.03+7.1)+0.2*fn(p*4.01+3.3);}
vec3 faceDetail(vec3 wp,float d,float pz){
  vec3 wn=normalize(cross(dFdx(wp),dFdy(wp)));float steep=1.0-abs(wn.y);
  vec2 along=normalize(vec2(-wn.z,wn.x)+vec2(1e-4,0.0));vec2 fc=vec2(dot(wp.xz,along),wp.y);
  vec2 uv=steep>0.35?fc:wp.xz;
  float w=0.06*sin(wp.x*1.7+wp.z*0.9);vec3 m=vec3(1.0);
  bool sand=abs(wp.x)<12.5&&abs(wp.z-pz)<0.55+0.08*sin(wp.x*0.8)&&d>0.95+w&&d<1.62+w;
  if(d<-0.02){m*=0.82+0.36*fb(uv*9.0);}
  else if(d<0.3+w){float r=abs(sin(fb(uv*3.0)*14.0+uv.x*6.0));float root=smoothstep(0.07,0.0,r)*step(0.55,fn(uv*5.0));
    m*=0.85+0.3*fb(uv*12.0);m=mix(m,vec3(1.45,1.22,0.92),root*0.75);}
  else if(sand){m*=0.9+0.14*(0.5+0.5*sin(uv.y*90.0+fb(uv*4.0)*6.0));}
  else if(d<1.95+2.0*w){float mot=fb(uv*2.5);m*=mix(vec3(1.0),vec3(0.78,0.87,0.96),smoothstep(0.55,0.75,mot)*0.85);
    vec2 pc=uv*14.0;float peb=step(0.92,fh(floor(pc)))*smoothstep(0.42,0.18,length(fract(pc)-0.5));m=mix(m,vec3(1.3,1.22,1.1),peb*0.8);}
  else{float c=abs(fb(uv*3.0)-0.5);m*=0.78+0.26*smoothstep(0.0,0.045,c);}
  if(d>0.0)m*=1.0-0.2*smoothstep(0.35,0.8,steep)*smoothstep(0.55,1.0,0.5+0.5*sin(fc.x*34.9));
  return m;}
vec3 faceBump(vec3 n,float h,vec3 pos){vec3 dx=dFdx(pos),dy=dFdy(pos);float hx=dFdx(h),hy=dFdy(h);vec3 r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);
  return normalize(abs(det)*n-sign(det)*(hx*r1+hy*r2));}
`;
// relief on the cut faces (High graphics, faceRelU): the detail's own light and dark taken as its height, so the teeth
// grooves, cracks and mottles sink and the roots and pebbles stand proud, by up to about an inch; fades out with distance
// like the material relief
const FACE_REL_GLSL=()=>`if(uFRel>0.0){float frK=uFRel*0.08*(1.0-smoothstep(0.5*${MAT_GL2?'uPbr.w':'55.0'},${MAT_GL2?'uPbr.w':'55.0'},length(vWP-cameraPosition)));
  if(frK>0.0)normal=faceBump(normal,faceH*frK,-vViewPosition);}\n`;
// the natural dirt and grass tilt the normal by their relief maps (x east, y south, as the material maps do), blended
// like their colours, less under painted materials, fading out with distance like the material relief
// and a second, larger layer of the same maps (turned, about 5 times the size) for lumps and hollows that carry on out to
// four times as far, so the far ground isn't a flat sheet (uGRelFar, TU.pbrGroundFar)
const GROUND_REL_GLSL=()=>`if(uGRel>0.0){vec2 grN=mix(texture2D(tGrassN,vWXZ*GRASS_K).xy,texture2D(tDirtN,vWXZ*DIRT_K).xy,vDirt)*2.0-1.0;
  float grD=length(vWP-cameraPosition),grK=uGRel*(1.0-${MAT_GL2?'matP':'0.0'})*(1.0-smoothstep(0.5*${MAT_GL2?'uPbr.w':'55.0'},${MAT_GL2?'uPbr.w':'55.0'},grD));
  vec2 grQ=mat2(0.8,0.6,-0.6,0.8)*vWXZ*0.19+0.37;vec2 grM=mix(texture2D(tGrassN,grQ*GRASS_K).xy,texture2D(tDirtN,grQ*DIRT_K).xy,vDirt)*2.0-1.0;
  float grMK=uGRelFar*(1.0-${MAT_GL2?'matP':'0.0'})*(1.0-smoothstep(2.0*${MAT_GL2?'uPbr.w':'55.0'},4.0*${MAT_GL2?'uPbr.w':'55.0'},grD));
  vec3 grW=inverseTransformDirection(normal,viewMatrix);grW=normalize(grW+vec3(grN.x,0.0,grN.y)*grK+vec3(grM.x,0.0,grM.y)*grMK);normal=transformDirection(grW,viewMatrix);}\n`;
// wet ground shine (Ultra, gfx.js wetGround; post.js sets groundWetU from the Ultra tuning, 0 off): soaked and muddy natural
// ground, where no material is painted, takes a thin film of water that mirrors the sky (skyEnv) faintly face-on and
// strongly at a slant, its normal flattened toward level as water lies flat, and darkens a little under it
const groundWetU={value:0};
const GROUND_WET_GLSL=()=>MAT_GL2?`if(uGWet>0.0){float gwk=uGWet*max(rainF,0.6*mudF)*(1.0-matP)*(1.0-smoothstep(60.0,160.0,length(vWP-cameraPosition)));
  if(gwk>0.001){vec3 gwN=normalize(mix(inverseTransformDirection(normal,viewMatrix),vec3(0.0,1.0,0.0),0.65)),gwV=normalize(vWP-cameraPosition);
  float gwF=0.03+0.97*pow(1.0-clamp(dot(-gwV,gwN),0.0,1.0),5.0);reflectedLight.indirectSpecular+=textureCube(tSkyEnv,reflect(gwV,gwN)).rgb*gwF*gwk*skyO;
  reflectedLight.directDiffuse*=1.0-0.12*gwk;}}
`:'';
const groundOcc={value:[new THREE.Vector4(0,0,0,0),new THREE.Vector4(1.4,2.0,0,0),new THREE.Vector4(0,0,0,0),new THREE.Vector4(1.2,3.9,0.0,0)]};
const groundMat=M(0xffffff,{vertexColors:true});
// rain (rain.js): a small texture of the wet ground over the mesa, r = wet surface, g = mud; read per vertex where the
// GPU can (most), else per pixel
const wetU={tWet:{value:null},uWetO:{value:new THREE.Vector4(0,0,0,0)},uWetView:{value:0},uWetMin:{value:0},uRunoff:{value:0}},WET_VTX=renderer.capabilities.vertexTextures;
groundMat.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,wetU);
  sh.uniforms.tGrass={value:texGrass};sh.uniforms.tDirt={value:texDirt};sh.uniforms.tMacro={value:texMacro};sh.uniforms.uMacro=macroU;sh.uniforms.texMix=texMixU;sh.uniforms.texBase=texBaseU;sh.uniforms.uTime=timeU;sh.uniforms.uPipeZ={value:PIPE_Z};
  // wetT: when this ground was last cut or dumped; fresh dirt shows dark and damp and dries over a few minutes
  sh.vertexShader='attribute float dirt;\nattribute float wetT;\nattribute float soilD;\nattribute float matA;\nattribute float mudW;\nattribute vec2 crk;\nvarying vec2 vCrk;\nuniform float uTime;\nuniform sampler2D tWet;\nuniform vec4 uWetO;\nvarying float vMud;\nvarying float vRain;\nvarying float vSoil;\nvarying float vDirt;\nvarying float vWet;\nvarying float vSD;\nvarying float vMatA;\nvarying vec2 vWXZ;\nvarying vec3 vWP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCrk=crk;\nvDirt=dirt;\nvMud=mudW;\nvSD=soilD;\nvMatA=matA;\nvWet=exp(-max(0.0,uTime-wetT)/100.0);\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;\nvWXZ=vWP.xz;'+(WET_VTX?'\nvec4 wt=texture2D(tWet,(vWXZ-uWetO.xy)*uWetO.zw);vMud=max(vMud,wt.g);vRain=wt.r;vSoil=wt.b;':'\nvRain=0.0;vSoil=0.0;'));
  // texture detail goes in ahead of the vertex colour so it is turned linear with it. groundOcc: sky light under the
  // excavator and truck, dimmed by distance to each footprint (x, z, yaw, unused; half width, half length, forward offset, unused)
  sh.uniforms.tCrack={value:texCrack};sh.uniforms.uOcc=groundOcc;Object.assign(sh.uniforms,matU);sh.uniforms.tGrassN={value:texGrassN};sh.uniforms.tDirtN={value:texDirtN};sh.uniforms.uGRel=groundRelU;sh.uniforms.uGRelFar=groundRelFarU;sh.uniforms.uFRel=faceRelU;sh.uniforms.uGWet=groundWetU;sh.uniforms.uFarWet=farWetU;
  sh.fragmentShader=`#define GRASS_K ${TEX_K.grass.toFixed(3)}\n#define DIRT_K ${TEX_K.dirt.toFixed(3)}\n`+'uniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform sampler2D tGrassN;\nuniform sampler2D tDirtN;\nuniform float uGRel,uGRelFar,uGWet,uFRel,uFarWet;\nuniform sampler2D tMacro;\nuniform float uMacro;\nuniform float texMix;\nuniform float texBase;\nuniform float uPipeZ;\nuniform vec4 uOcc[4];\nuniform sampler2D tWet;\nuniform vec4 uWetO;\nuniform float uWetView;\nuniform float uWetMin;\nuniform sampler2D tCrack;\nvarying vec2 vCrk;\nvarying float vMud;\nvarying float vRain;\nvarying float vSoil;\nvarying float vDirt;\nvarying float vWet;\nvarying float vSD;\nvarying float vMatA;\nvarying vec2 vWXZ;\nvarying vec3 vWP;\n'+MAT_GLSL_HEAD+FACE_GLSL+sh.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+matGlslNorm()+GROUND_REL_GLSL()+FACE_REL_GLSL()).replace('#include <specularmap_fragment>','#include <specularmap_fragment>\nspecularStrength*=(1.0+7.0*vWet*vDirt*(1.0-mudF))*mix(1.0,0.5,max(mudF,rainF));\n'+matGlslSpec()).replace('#include <lights_phong_fragment>','#include <lights_phong_fragment>\nmaterial.specularShininess=mix(material.specularShininess,24.0,max(mudF,rainF));\n'+matGlslShin()).replace('#include <color_fragment>',
    (WET_VTX?'float mudF=vMud,rainF=vRain,soilW=vSoil;\n':'vec4 wt=texture2D(tWet,(vWXZ-uWetO.xy)*uWetO.zw);float mudF=max(vMud,wt.g),rainF=wt.r,soilW=wt.b;\n')+
    // off the wet grid (the town and the rest of the mainland): the far soil water (rain.js), wet and darker on the grass
    'vec2 fwq=(vWXZ-uWetO.xy)*uWetO.zw;float fwOff=(fwq.x<0.0||fwq.y<0.0||fwq.x>1.0||fwq.y>1.0)?uFarWet:0.0;rainF=max(rainF,0.7*fwOff);\n'+'vec3 tg=texture2D(tGrass,vWXZ*GRASS_K).rgb/vec3(0.267,0.359,0.158);\nvec3 td=texture2D(tDirt,vWXZ*DIRT_K).rgb/vec3(0.491,0.467,0.431);\nvec3 gd=clamp(mix(tg,td,vDirt),0.0,2.2)*(uMacro>0.0?mix(1.0,texture2D(tMacro,vWXZ*0.025).r/0.502,uMacro):1.0);float gk=0.8;\n'+matGlsl()+'diffuseColor.rgb*=mix(vec3(1.0),gd,gk*texBase);\nfloat crkD=vDirt*(1.0-smoothstep(0.4,1.0,vSD));diffuseColor.rgb*=1.0+0.2*vCrk.x*crkD;\ndiffuseColor.rgb*=(1.0-0.32*max(vWet*vDirt,0.6*mudF))*(1.0-0.12*rainF)*(1.0-0.28*fwOff*(1.0-vDirt));\nfloat faceH=0.0;if(vDirt>0.01&&texMix>0.5){vec3 fdm=faceDetail(vWP,vSD,uPipeZ);diffuseColor.rgb*=mix(vec3(1.0),fdm,vDirt);faceH=dot(fdm,vec3(0.3333))*vDirt;}\n#include <color_fragment>\nif(vCrk.y*crkD>0.01){float cl=texMix>0.5?dot(texture2D(tCrack,vWXZ*0.547).rgb,vec3(0.299,0.587,0.114))/0.56:1.0;diffuseColor.rgb=mix(diffuseColor.rgb,(diffuseColor.rgb*0.5+vec3(0.2,0.15,0.1))*cl,vCrk.y*crkD);}\n'+matGlslPost()+'if(uWetView>0.5){float sw=max(soilW,vMud);float on=uWetMin>0.0?step(uWetMin,sw):smoothstep(0.03,0.08,sw);vec3 wc=uWetMin>0.0?vec3(0.02,0.1,0.5):mix(vec3(0.45,0.68,0.78),vec3(0.01,0.05,0.38),sw);diffuseColor.rgb=mix(diffuseColor.rgb,wc,0.8*on);}\n').replace('#include <lights_fragment_end>',
    'float skyO=1.0;\nfor(int m=0;m<4;m+=2){vec2 d=vWXZ-uOcc[m].xy;float c=cos(uOcc[m].z),s=sin(uOcc[m].z);vec2 l=vec2(d.x*c-d.y*s,d.x*s+d.y*c-uOcc[m+1].z);vec2 q=abs(l)-uOcc[m+1].xy;\nfloat dist=length(max(q,0.0))+min(max(q.x,q.y),0.0);skyO*=1.0-0.75*(1.0-smoothstep(-0.4,1.6,dist));}\nirradiance*=skyO;\n'+matGlslRefl()+GROUND_WET_GLSL()+'#include <lights_fragment_end>');
  // while it rains, water runs down wet slopes off the dig area too (the ramp, the roads, bare banks; grass drinks it): thin rills that stream
  // downhill, quicker on steeper ground, shining like the sky; uRunoff (rain.js) is how hard it is raining
  sh.vertexShader='varying vec3 vRunN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRunN=(modelMatrix*vec4(normal,0.0)).xyz;');
  sh.fragmentShader='uniform float uRunoff;\nvarying vec3 vRunN;\n'+(sh.fragmentShader.includes('uniform float uTime')?'':'uniform float uTime;\n')+sh.fragmentShader.replace('#include <dithering_fragment>',
    'if(uRunoff>0.01){vec3 gn=normalize(vRunN);float sl=length(gn.xz);\n'+
    '  float rf=uRunoff*smoothstep(0.3,0.75,rainF)*smoothstep(0.012,0.035,sl)*(1.0-smoothstep(0.55,0.85,sl))*(1.0-smoothstep(0.0,0.05,gl_FragColor.g-max(gl_FragColor.r,gl_FragColor.b)));if(rf>0.01){\n'+
    '  vec2 dn=gn.xz/sl;vec2 pp=vec2(dot(vWP.xz,vec2(-dn.y,dn.x)),dot(vWP.xz,dn));float sp=0.5+2.5*min(sl,0.5);\n'+
    '  vec2 a=vec2(pp.x*9.0+1.2*sin(pp.y*0.9)+0.6*sin(pp.y*2.3),pp.y*0.6-uTime*sp);vec2 ia=floor(a),fa=fract(a);fa=fa*fa*(3.0-2.0*fa);\n'+
    '  float n=mix(mix(fract(sin(dot(ia,vec2(127.1,311.7)))*43758.5),fract(sin(dot(ia+vec2(1,0),vec2(127.1,311.7)))*43758.5),fa.x),mix(fract(sin(dot(ia+vec2(0,1),vec2(127.1,311.7)))*43758.5),fract(sin(dot(ia+1.0,vec2(127.1,311.7)))*43758.5),fa.x),fa.y);\n'+
    '  float riv=smoothstep(0.7,0.88,n)*rf;gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*0.45+fogColor*0.4,riv*0.6);}}\n#include <dithering_fragment>');
};
const geo=new THREE.PlaneGeometry(S,S,N,N); geo.rotateX(-Math.PI/2); geo.translate(GX0+S/2,0,GZ0+S/2);
const colors=new Float32Array(V*V*3);
geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const dirtA=new Float32Array(V*V);geo.setAttribute('dirt',new THREE.BufferAttribute(dirtA,1));
const wetT=new Float32Array(V*V).fill(-1e4);geo.setAttribute('wetT',new THREE.BufferAttribute(wetT,1));
const soilDA=new Float32Array(V*V);geo.setAttribute('soilD',new THREE.BufferAttribute(soilDA,1));
const matAA=new Float32Array(V*V);geo.setAttribute('matA',new THREE.BufferAttribute(matAA,1));
// mud: how wet the ground stays (puddles, wet spoil, painted Mud): darker for good, with tight wet glints rather than a dull sheen
const mudWA=new Float32Array(V*V);geo.setAttribute('mudW',new THREE.BufferAttribute(mudWA,1));
// dug, dumped and rutted ground that dries out: soakMax is the wettest it has been since it was last dug or dumped,
// and crkA what that shows now (x: drying, paler and matte; y: dried out and cracked), set as it dries (waterTick)
const soakMax=new Float32Array(V*V),crkA=new Float32Array(V*V*2);geo.setAttribute('crk',new THREE.BufferAttribute(crkA,2));
// the cracked look's pattern: the cracks of the dried mud texture, over each soil's own colour (Medium and High)
const texCrack=new THREE.TextureLoader().load('textures/mud_cracked.jpg');texCrack.wrapS=texCrack.wrapT=THREE.RepeatWrapping;
// sky view: for dug and dumped dirt, how high the ground rises around it (8 directions, about 1 ft and 3 ft out)
// darkens trench floors and lower walls, since the ground casts no shadows on itself
const AO_S=[],AO_R=Math.round(0.95/CELL);
for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]])for(const rc of [Math.round(0.33/CELL),AO_R])AO_S.push(di*rc,dj*rc,rc*CELL*Math.hypot(di,dj));
function skyOcc(k,h){const i=k%V,j=(k/V)|0;let occ=0;
  for(let n=0;n<AO_S.length;n+=6){let s=0;
    for(let q=n;q<n+6;q+=3){const ii=i+AO_S[q],jj=j+AO_S[q+1];if(ii<0||ii>N||jj<0||jj>N)continue;const e=(H[jj*V+ii]-h)/AO_S[q+2];if(e>s)s=e}
    occ+=Math.atan(s)}
  return occ/(8*1.5708)}
// drawn as TER_B x TER_B blocks that share the grid's vertices, each with its own triangles and bounds, so the blocks out
// of view are skipped; terBound keeps each block's bounds round its ground as it is dug, dumped or the grid moves
const TER_B=4,TER_Q=N/TER_B,terBlocks=[],terrain=new THREE.Group();scene.add(terrain);
for(let bj=0;bj<TER_B;bj++)for(let bi=0;bi<TER_B;bi++){const g=new THREE.BufferGeometry(),src=geo.index.array,I=new Uint32Array(TER_Q*TER_Q*6);let o=0;
  for(const n in geo.attributes)g.setAttribute(n,geo.attributes[n]);
  for(let j=bj*TER_Q;j<(bj+1)*TER_Q;j++){const q=(j*N+bi*TER_Q)*6;I.set(src.subarray(q,q+TER_Q*6),o);o+=TER_Q*6}
  g.setIndex(new THREE.BufferAttribute(I,1));g.boundingSphere=new THREE.Sphere();
  const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;m.userData.b=[bi,bj];terrain.add(m);terBlocks.push(m)}
function terBound(ja,jb){const p=geo.attributes.position.array;
  for(const m of terBlocks){const [bi,bj]=m.userData.b,j0=bj*TER_Q,j1=j0+TER_Q,i0=bi*TER_Q,i1=i0+TER_Q;if(j1<ja||j0>jb)continue;
    let lo=1e9,hi=-1e9;for(let j=j0;j<=j1;j++)for(let k=j*V+i0;k<=j*V+i1;k++){const y=p[k*3+1];if(y<lo)lo=y;if(y>hi)hi=y}
    const hx=(p[(j0*V+i1)*3]-p[(j0*V+i0)*3])/2,hz=(p[(j1*V+i0)*3+2]-p[(j0*V+i0)*3+2])/2,hy=(hi-lo)/2;
    m.geometry.boundingSphere.center.set(p[(j0*V+i0)*3]+hx,lo+hy,p[(j0*V+i0)*3+2]+hz);m.geometry.boundingSphere.radius=Math.sqrt(hx*hx+hy*hy+hz*hz)+1}}
terBound(0,N);
const pos=geo.attributes.position;
let dI0=0,dI1=N,dJ0=0,dJ1=N,winOn=true;
function touch(i0,i1,j0,j1){if(!winOn){dI0=i0;dI1=i1;dJ0=j0;dJ1=j1;winOn=true}else{dI0=Math.min(dI0,i0);dI1=Math.max(dI1,i1);dJ0=Math.min(dJ0,j0);dJ1=Math.max(dJ1,j1)}}
function updateTerrain(){
  const p=pos.array,ja=Math.max(0,dJ0-1-AO_R),jb=Math.min(N,dJ1+1+AO_R);
  for(let k=ja*V;k<(jb+1)*V;k++){
    const h=H[k],d=h-H0[k],bd=paintD[k],ad=Math.abs(bd?d-bd:d);
    p[k*3+1]=h;soilDA[k]=-d;
    let r=grass[k*3],g=grass[k*3+1],b=grass[k*3+2];
    if(paint[k]&&ad<0.04){ if(paint[k]===1){r=0.93;g=0.93;b=0.9}else{r=0.96;g=0.78;b=0.1} }
    let t=ss(0.02,0.16,ad);if(bd&&matCov[k]<1)t=Math.max(t,1-matCov[k]);dirtA[k]=Math.max(t,rockA[k]);matAA[k]=matCov[k]*(1-t);mudWA[k]=mudA[k];
    if(t>0){
      let dr,dg,db;
      if(d<0){const c=SOIL[layerAt(gX((k%V)),gZ(((k/V)|0)),-d,nz[k],H0[k])].c,sh=1-0.12*ss(0.3,2.5,-d);dr=c[0]*sh;dg=c[1]*sh;db=c[2]*sh}
      else{dr=spoilC[k*3];dg=spoilC[k*3+1];db=spoilC[k*3+2]}
      const cn=(0.82+0.34*nz[k])*(1-0.7*skyOcc(k,h))*(mudA[k]>0.05?rutShade(d):1);dr*=cn;dg*=cn;db*=cn;
      r+=(dr-r)*t;g+=(dg-g)*t;b+=(db-b)*t;
    }
    colors[k*3]=r;colors[k*3+1]=g;colors[k*3+2]=b;
  }
  const off=ja*V*3,cnt=(jb-ja+1)*V*3;
  pos.addUpdateRange(off,cnt);
  const ca=geo.attributes.color;ca.addUpdateRange(off,cnt);
  const da=geo.attributes.dirt;da.addUpdateRange(off/3,cnt/3);da.needsUpdate=true;
  const wa=geo.attributes.wetT;wa.addUpdateRange(off/3,cnt/3);wa.needsUpdate=true;
  const sa=geo.attributes.soilD;sa.addUpdateRange(off/3,cnt/3);sa.needsUpdate=true;
  const ma=geo.attributes.matA;ma.addUpdateRange(off/3,cnt/3);ma.needsUpdate=true;
  const ua=geo.attributes.mudW;ua.addUpdateRange(off/3,cnt/3);ua.needsUpdate=true;
  pos.needsUpdate=true; ca.needsUpdate=true;
  terBound(ja,jb);snapClods(ja,jb);updateShadowCaster();
}
// outside the dig zone: the mud tiles' ground once mud.js has loaded (farH), else the mesa
let farGround=null;
// raised ground that is not a deck, so feet and wheels stand on it: the town's sidewalks and curbs (mainland.js sets
// it, mstLift): metres above the ground at x, z, or 0
let groundLift=null;
// walk pads: the other raised floors drawn on the ground that are not decks or blocks (porches, steps, slabs, pads,
// lots, walks, the boardwalk, platforms), so feet and wheels stand on them. walkPad(x, z, hx, hz, yaw, top, o): the
// middle, half sizes along its own axes (turned by yaw as the models are), and its top: an absolute height, or with
// o.l metres above the ground under it (it follows the ground); o.rise: how much higher its far (+z) end is (a stair
// or a ramp). Kept on a 4 m grid; padAt is the highest pad top at x, z
const WALK_PADS=[],WP_C=4,WP_G=new Map(),wpKey=(i,j)=>(i+4096)*8192+(j+4096);
function walkPad(x,z,hx,hz,yaw,top,o){const c=Math.cos(yaw||0),s=Math.sin(yaw||0),p={x,z,hx,hz,c,s,t:top,l:o&&o.l!==undefined?o.l:null,rise:o&&o.rise||0,tag:o&&o.tag};
  WALK_PADS.push(p);const ex=Math.abs(c)*hx+Math.abs(s)*hz,ez=Math.abs(s)*hx+Math.abs(c)*hz;
  for(let i=Math.floor((x-ex)/WP_C);i<=Math.floor((x+ex)/WP_C);i++)for(let j=Math.floor((z-ez)/WP_C);j<=Math.floor((z+ez)/WP_C);j++){const k=wpKey(i,j);
    if(!WP_G.has(k))WP_G.set(k,[]);WP_G.get(k).push(p)}
  return p}
// the pads with a tag (the editor's props: props.js) taken out again, to be laid afresh
function walkPadsDrop(tag){for(let i=WALK_PADS.length-1;i>=0;i--)if(WALK_PADS[i].tag===tag)WALK_PADS.splice(i,1);
  for(const [k,L] of WP_G){const f=L.filter(p=>p.tag!==tag);if(f.length)WP_G.set(k,f);else WP_G.delete(k)}}
// a raised strip along a bridge deck (a curb, a running board): u across it, half wide hw, its top dy over the deck
function walkStrip(b,u,hw,dy){walkPad(b.x0+b.ux*b.len/2-b.uz*u,b.z0+b.uz*b.len/2+b.ux*u,hw,b.len/2,Math.atan2(b.ux,b.uz),b.y+dy,{rise:b.y1-b.y})}
function padAt(x,z){const L=WP_G.get(wpKey(Math.floor(x/WP_C),Math.floor(z/WP_C)));if(!L)return -1e9;let y=-1e9;
  for(const p of L){const dx=x-p.x,dz=z-p.z,u=dx*p.c-dz*p.s,v=dx*p.s+dz*p.c;if(u<-p.hx||u>p.hx||v<-p.hz||v>p.hz)continue;
    const t=(p.l===null?p.t:baseHeight(x,z)+p.l)+(p.rise?p.rise*(v+p.hz)/(2*p.hz):0);if(t>y)y=t}
  return y}
// how far the raised floors (groundLift, the walk pads) stand above the ground at x, z: a rise in it is a step, not a slope
function raiseAt(x,z){const g=farGround?farGround(x,z):baseHeight(x,z),r=groundLift?groundLift(x,z):0,p=padAt(x,z);return p>g+r?p-g:r}
function hAt(x,z){
  if(!inDig(x,z)){let g=(farGround?farGround(x,z):baseHeight(x,z))+(groundLift?groundLift(x,z):0);const p=padAt(x,z),d=deckAt(x,z);if(p>g)g=p;return d>g?d:g}
  let fx=gI(x),fz=gJ(z);
  fx=Math.max(0,Math.min(N-0.001,fx)); fz=Math.max(0,Math.min(N-0.001,fz));
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*V+i,h=H[k]*(1-u)*(1-v)+H[k+1]*u*(1-v)+H[k+V]*(1-u)*v+H[k+V+1]*u*v,p=padAt(x,z);
  return p>h?p:h;
}
function h0At(x,z){
  if(!inDig(x,z))return Math.max(baseHeight(x,z),deckAt(x,z));
  const i=Math.max(0,Math.min(N,Math.round(gI(x)))),j=Math.max(0,Math.min(N,Math.round(gJ(z))));
  return H0[j*V+i];
}
// ---------- soil ----------
// layers by depth below original grade, with wavy boundaries; sand bedding wraps the gas main.
// h: arm speed while the teeth bite, sw: swell (loose volume per bank volume), rp: steepest slope it holds (rise per run),
// rl: slope it holds for good; a deep wall steeper than rl caves in after a while; dp: how much steeper it stands damp
// (water between the grains holds them), wt: what is left of its slope soaked through (sand drains and keeps more,
// clay turns to slop); lp: the slope it holds tipped out loose (dumped clay stays lumpy and stands steeper than sand)
// the soils whose dig speed (h) the tuning sets (js/tune.js)
const SOIL_TU=['soilTop','soilClay','soilSand','soilRock'];
const SOIL=[
  {n:'Topsoil',c:[0.30,0.21,0.13],h:0.7,sw:1.25,rp:0.9,rl:0.75,dp:0.2,wt:0.55,lp:0.75},
  {n:'Clay',c:[0.64,0.36,0.21],h:0.45,sw:1.3,rp:1.6,rl:0.95,dp:0.05,wt:0.45,lp:0.9},
  {n:'Sand',c:[0.80,0.70,0.48],h:0.85,sw:1.12,rp:0.62,rl:0.62,dp:0.35,wt:0.7,lp:0.62},
  {n:'Rock',c:[0.47,0.46,0.44],h:0.12,sw:1.5,rp:3.0,rl:2.5,dp:0,wt:1,lp:0.8},
  {n:'Loose fill',c:[0.50,0.34,0.21],h:0.9,sw:1.0,rp:0.75,rl:0.7,dp:0.2,wt:0.6}];
const SPOIL=4,spoilC=new Float32Array(V*V*3);
// h0: the undug ground's height there, when known: the beach (low ground by the lake) is sand down to the rock
function layerAt(x,z,d,nn,h0){
  const w=0.06*Math.sin(x*1.7+z*0.9)+0.05*(nn-0.5);
  if(h0!==undefined&&h0<WATER+2.4+w)return d<2.6+2*w?2:3;
  if(d<0.3+w)return 0;
  if(Math.abs(x)<12.5&&Math.abs(z-PIPE_Z)<0.55+0.08*Math.sin(x*0.8)&&d>0.95+w&&d<1.62+w)return 2;
  return d<1.95+2*w?1:3;
}
// material at height y over grid vertex k: loose fill above original grade, a native layer below
function matAt(k,y){const d=H0[k]-y;return d<0?SPOIL:layerAt(gX((k%V)),gZ(((k/V)|0)),d,nz[k],H0[k])}
// how readily the ground at height y over vertex k gives (the excavator's res: 1 easy, rock about a tenth): loose fill,
// and ground the dozer's ripper has broken up (ripD: how far under the undug ground it reached, heavy.js), give like fill
function soilRes(k,y){const m=H0[k]-y<=ripD[k]?SPOIL:matAt(k,y);return m<4?TU[SOIL_TU[m]]:SOIL[m].h}
function matColor(k,m){return m===SPOIL?[spoilC[k*3],spoilC[k*3+1],spoilC[k*3+2]]:SOIL[m].c}
// blend material of colour c and height a into the loose fill on vertex k
function mixSpoil(k,c,a){const above=H[k]-H0[k];if(above<=0||a<=0)return;const f=Math.min(1,a/above);
  for(let q=0;q<3;q++)spoilC[k*3+q]+=(c[q]-spoilC[k*3+q])*f}
const digC=[0,0,0],digMix=[0,1,0,0];
// grid box holding every hole dug so far, scanned for walls that could cave in
let cI0=N+1,cI1=-1,cJ0=N+1,cJ1=-1;
function growDug(i0,i1,j0,j1){growSl(i0,i1,j0,j1);const mg=3*GRID_K;cI0=Math.max(0,Math.min(cI0,i0-mg));cI1=Math.min(N,Math.max(cI1,i1+mg));cJ0=Math.max(0,Math.min(cJ0,j0-mg));cJ1=Math.min(N,Math.max(cJ1,j1+mg))}
// o (optional): r, the reach round the tip (the bucket's 0.55 m); flat, a flat bottom (the auger's bore) instead of a bowl
function dig(tip,cap,o){
  const r=o&&o.r||0.55,flat=!!(o&&o.flat),list=[],vk=[0,0,0,0];let vol=0,cr=0,cg=0,cb=0,hh=0;
  const i0=Math.max(0,Math.floor(gI(tip.x-r))),i1=Math.min(N,Math.ceil(gI(tip.x+r)));
  const j0=Math.max(0,Math.floor(gJ(tip.z-r))),j1=Math.min(N,Math.ceil(gJ(tip.z+r)));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const x=gX(i),z=gZ(j),d=Math.hypot(x-tip.x,z-tip.z);
    if(d>r)continue;
    const k=j*V+i;if(digKeep[k])continue;
    const t=Math.max(flat?tip.y:tip.y+(d/r)*(d/r)*0.35,H0[k]-FLOOR);
    const dh=H[k]-t;
    if(dh>0){const y=H[k]-dh/2,m=matAt(k,y),c=matColor(k,m),v=dh*CA*(1+(SOIL[m].sw-1)*TU.fluff),ck=clodKind(m,H0[k]-y);list.push(k,dh);vol+=v;cr+=c[0]*v;cg+=c[1]*v;cb+=c[2]*v;hh+=SOIL[m].h*v;if(ck>=0)vk[ck]+=v}
  }
  if(vol<=0)return 0;
  touch(i0,i1,j0,j1);
  const s=Math.min(1,cap/vol);
  for(let n=0;n<list.length;n+=2){H[list[n]]-=list[n+1]*s;wetT[list[n]]=timeU.value;soakMax[list[n]]=0}
  digC[0]=cr/vol;digC[1]=cg/vol;digC[2]=cb/vol;for(let q=0;q<4;q++)digMix[q]=vk[q]/vol;
  growDug(i0,i1,j0,j1);
  clodsDug(tip.x,tip.z,r);dropMix(tip.x,tip.z,0.75,vol*s*DIRT,digMix,digC,'bite');
  // dry topsoil kicks up a little dust; the bucket picks up dirt as it works
  dustPuff(tip.x,tip.y+0.3,tip.z,vol*s*(digMix[SOD]+digMix[CRUMB])*25,digC);st.grime=Math.min(0.85,st.grime+vol*s*0.08);
  // every machine's bite buzzes the controller, rock hardest (controls.js)
  if(padUsed)rumbleDig(0.15+0.55*(1-hh/vol));
  return vol*s;
}
function deposit(x,z,vol,col,mix,spread,wet,quiet){
  const r=0.9*(spread||1),list=[];let sum=0;
  const i0=Math.max(0,Math.floor(gI(x-r))),i1=Math.min(N,Math.ceil(gI(x+r)));
  const j0=Math.max(0,Math.floor(gJ(z-r))),j1=Math.min(N,Math.ceil(gJ(z+r)));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const d=Math.hypot(gX(i)-x,gZ(j)-z); if(d>r)continue;
    const w=Math.exp(-(d/(0.5*(spread||1)))*(d/(0.5*(spread||1)))); list.push(j*V+i,w); sum+=w;
  }
  if(!sum)return;
  touch(i0,i1,j0,j1);growSl(i0,i1,j0,j1);
  for(let n=0;n<list.length;n+=2){const k=list[n],a=vol*list[n+1]/sum/CA;H[k]+=a;mixSpoil(k,col||SOIL[SPOIL].c,a);if(a>0.002){wetT[k]=timeU.value+(wet>0.3?600:0);comp[k]=0;soakMax[k]=0;if(wet>0.3)mudA[k]=Math.max(mudA[k],wet)}}
  dropMix(x,z,r,vol*DIRT,mix||CRUMB_MIX,col||SOIL[SPOIL].c,'dump');
  // dirt pouring out of a bucket or a bed thumps the controller, a heavier pour harder (controls.js)
  // (quiet: dirt that only trickles off by itself, clay shed from the tracks or a heaped bucket's overflow, doesn't)
  if(padUsed&&!quiet)rumbleDig(Math.min(0.5,0.12+vol*25));
  dustPuff(x,hAt(x,z)+0.2,z,vol*30*(1-(wet||0)),col);
}
// each layer holds its own slope: sand runs, clay stands steep, rock barely moves; what slides keeps its colour as loose fill.
// Water changes it (mudOf, water.js): damp sand and soil stand steeper, soaked soil slumps, so a pile or a trench wall
// can let go after rain. Like real soil, a soaked face only loses its slope once it is a foot or more tall (small
// lumps and tread prints in mud hold; mud ruts are rutSlump's, dirt.js). A face that gives way slides back a little below the angle it held (TU.slopeSlide), so a pile
// fed from the top grows by small avalanches and its faces sit just under their angle
const RP_MIN=0.2*CELL,M0=1.1*CELL;
// loose fill is whatever was dumped there: its share of topsoil, clay, sand and rock comes back from its colour (spoilC
// is their volume-weighted blend; four colours plus shares that add to one fix the four shares), so a sand pile runs out
// at the angle sand does and a clay pile stands up lumpy
const SPF=(()=>{const A=[0,1,2,3].map(m=>[...SOIL[m].c,1]),M=[0,1,2,3].map(r=>[0,1,2,3].map(c=>A[c][r])),I=M.map((r,i)=>r.map((_,j)=>+(i===j)));
  for(let c=0;c<4;c++){let p=c;for(let r=c+1;r<4;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];[I[c],I[p]]=[I[p],I[c]];
    const d=M[c][c];for(let j=0;j<4;j++){M[c][j]/=d;I[c][j]/=d}
    for(let r=0;r<4;r++)if(r!==c){const f=M[r][c];for(let j=0;j<4;j++){M[r][j]-=f*M[c][j];I[r][j]-=f*I[c][j]}}}
  return I})(),spF=[0,0,0,0],slP={rp:0,rl:0,dp:0,wt:0};
function spoilFr(k){let t=0;for(let m=0;m<4;m++){const r=SPF[m];spF[m]=Math.max(0,r[0]*spoilC[k*3]+r[1]*spoilC[k*3+1]+r[2]*spoilC[k*3+2]+r[3]);t+=spF[m]}
  for(let m=0;m<4;m++)spF[m]=t>0?spF[m]/t:0.25;return spF}
function soilP(k,m){if(m!==SPOIL)return SOIL[m];const f=spoilFr(k);slP.rp=slP.dp=slP.wt=0;
  for(let q=0;q<4;q++){const o=SOIL[q];slP.rp+=f[q]*o.lp;slP.dp+=f[q]*o.dp;slP.wt+=f[q]*o.wt}slP.rl=slP.rp*0.93;return slP}
function wetSlope(o,w,h){return Math.max(0.2,1+o.dp*TU.slopeDamp*ss(0.04,0.3,w)*(1-ss(0.45,0.75,w))-(1-o.wt)*TU.slopeWet*ss(0.5,0.95,w)*ss(0.25,0.9,h))}
// k: the high point, k2 its neighbour; the face is as tall as the deeper of the two cut or heaped heights
function slopeLim(k,k2,m,long){const o=soilP(k,m);return (long?o.rl:o.rp)*wetSlope(o,mudOf(k),Math.max(Math.abs(H[k]-H0[k]),Math.abs(H[k2]-H0[k2])))*CELL}
function slumpPair(k,k2,long){
  if(prot[k]||prot[k2]||digKeep[k]||digKeep[k2])return false;
  if((H[k]===H0[k]&&H[k2]===H0[k2])||Math.abs(H0[k]-H0[k2])>M0)return false;
  const df=H[k]-H[k2],ad=Math.abs(df);if(ad<=RP_MIN)return false;
  const hi=df>0?k:k2,lo=df>0?k2:k,m=matAt(hi,H[hi]-0.03),lim=slopeLim(hi,lo,m,long);if(ad<=lim)return false;
  const t=(ad-lim*(1-TU.slopeSlide))*0.4,c=matColor(hi,m);H[hi]-=t;H[lo]+=t;mixSpoil(lo,c,t);
  if(mudA[hi]>mudA[lo])mudA[lo]=Math.max(mudA[lo],mudA[hi]*0.97);return true;
}
// box around everything dug or dumped (from a save: every point off grade), swept a few rows a frame so slopes
// that the rain softens slump on their own
let sI0=N+1,sI1=-1,sJ0=N+1,sJ1=-1,slRow=-1,slInit=false;
function growSl(i0,i1,j0,j1){sI0=Math.max(0,Math.min(sI0,i0-2));sI1=Math.min(N,Math.max(sI1,i1+2));sJ0=Math.max(0,Math.min(sJ0,j0-2));sJ1=Math.min(N,Math.max(sJ1,j1+2))}
function slopeTick(dt){
  if(!slInit){slInit=true;for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const k=j*V+i;if(H[k]!==H0[k])growSl(i,i,j,j)}}
  if(sI1<sI0)return;
  if(slRow<sJ0||slRow>sJ1)slRow=sJ0;
  const n=Math.max(1,Math.ceil((sJ1-sJ0+1)*dt/3)),ja=slRow,jb=Math.min(sJ1,slRow+n-1);let moved=false;
  for(let j=ja;j<=jb;j++)for(let i=sI0;i<=sI1;i++){const k=j*V+i;
    if(i<N&&slumpPair(k,k+1))moved=true;if(j<N&&slumpPair(k,k+V))moved=true}
  slRow=jb+1;
  if(moved){touch(sI0,sI1,Math.max(0,ja-1),Math.min(N,jb+1));st.dirty=true;st.slumpT=Math.max(st.slumpT,0.6)}
}
function slump(){
  let moved=false;
  const ja=Math.max(0,dJ0-2),jb=Math.min(N,dJ1+2),ia=Math.max(0,dI0-2),ib=Math.min(N,dI1+2);
  for(let j=ja;j<=jb;j++)for(let i=ia;i<=ib;i++){
    const k=j*V+i;
    if(i<N&&slumpPair(k,k+1))moved=true;
    if(j<N&&slumpPair(k,k+V))moved=true;
  }
  if(moved){dI0=ia;dI1=ib;dJ0=ja;dJ1=jb}
  return moved;
}
// cave-ins: a wall over a cut deeper than ~4 ft that is steeper than its soil holds for good builds risk, and so does
// loose fill piled on the lip or up to 2 ft back (surcharge); returns the riskiest lip vertex
const CDIR=[[1,0],[-1,0],[0,1],[0,-1]];
function caveScan(){
  let best=0,bk=-1,bs=false;
  for(let j=cJ0;j<=cJ1;j++)for(let i=cI0;i<=cI1;i++){const k=j*V+i;if(prot[k]||digKeep[k])continue;
    for(const [di,dj] of CDIR){const i2=i+di,j2=j+dj;if(i2<0||i2>N||j2<0||j2>N)continue;const k2=j2*V+i2;
      const dep=H0[k2]-H[k2];if(dep<0.75)continue;
      const df=H[k]-H[k2];if(df<=0.62*CELL||Math.abs(H0[k]-H0[k2])>M0)continue;
      if(df<=slopeLim(k,k2,matAt(k,H[k]-0.03),true))continue;
      let sur=H[k]-H0[k];for(let q=1;q<=Math.round(TU.caveSpoil/CELL);q++){const i3=i-di*q,j3=j-dj*q;if(i3>=0&&i3<=N&&j3>=0&&j3<=N)sur=Math.max(sur,H[j3*V+i3]-H0[j3*V+i3])}
      const deep=Math.max(0,dep-TU.caveDepth)*2,load=sur>0.08?sur*3:0,risk=deep+load;
      if(risk>best){best=risk;bk=k;bs=load>deep}}}
  return {best,bk,bs};
}
function collapse(k,sur){
  const ci=k%V,cj=(k/V)|0,R=5*GRID_K,i0=Math.max(0,ci-R),i1=Math.min(N,ci+R),j0=Math.max(0,cj-R),j1=Math.min(N,cj+R);
  for(let it=0;it<24*GRID_K;it++)for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const kk=j*V+i;
    if(i<i1)slumpPair(kk,kk+1,true);if(j<j1)slumpPair(kk,kk+V,true)}
  touch(i0,i1,j0,j1);st.dirty=true;st.slumpT=2.5;st.caves++;
  const p=new THREE.Vector3(gX(ci),H[k]+0.1,gZ(cj));for(let n=0;n<40;n++)spawn(p,1.6);
  {const m=matAt(k,H[k]-0.05),ck=clodKind(m,H0[k]-H[k]+0.05);dropClods(ck,p.x,p.z,1.4,60*DIRT,ck===CRUMB?matColor(k,m):KIND_COL[Math.max(0,ck)],ck===SOD?1:1.4);dustPuff(p.x,p.y,p.z,25,matColor(k,m));dirtRumble(p)}
  shake=reduceMotion?0:0.35;rumble(500,0.8);
  toast(say(sur?'caveSpoil':'caveWall'),'bad',3600);
}
// risk builds while a bad wall stands, then dirt trickles off the lip for 2 s before it lets go
const lipP=new THREE.Vector3();
function caveTick(dt){
  if(st.cave&&prot[st.cave.k]){st.cave=null;st.caveRisk=0}
  if(st.cave){const c=st.cave;c.t-=dt;c.dT-=dt;
    if(c.dT<=0){c.dT=0.07;lipP.set(gX((c.k%V))+(Math.random()-0.5)*0.6,H[c.k]+0.05,gZ(((c.k/V)|0))+(Math.random()-0.5)*0.6);spawn(lipP,0.25)}
    if(c.t<=0){st.cave=null;st.caveRisk=0;collapse(c.k,c.sur)}}
  else if(cI1>=cI0&&(st.caveScanT-=dt)<=0){st.caveScanT=0.5;const r=caveScan();
    if(r.best>0){st.caveRisk+=r.best*0.04*TU.caveRate;if(st.caveRisk>=1)st.cave={k:r.bk,sur:r.bs,t:TU.caveWarn,dT:0}}else st.caveRisk=Math.max(0,st.caveRisk-0.05)}
}

// ---------- shadow caster ----------
// the 6 in ground casts no shadows (too many triangles for the shadow pass); a 1 ft copy of the dug area, sunk 2 in so
// it never shades the surface it copies, casts them instead, so trench walls throw real shade on the floor and the pipe
const SH_N=96,shGeo=new THREE.PlaneGeometry(1,1,SH_N,SH_N);
const shMesh=new THREE.Mesh(shGeo,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));
shMesh.castShadow=true;shMesh.frustumCulled=false;shMesh.visible=false;scene.add(shMesh);
function updateShadowCaster(){
  if(cI1<cI0){shMesh.visible=false;return}
  const span=SH_N*GRID_K,ci=(cI0+cI1)>>1,cj=(cJ0+cJ1)>>1;
  const i0=Math.max(0,Math.min(N-span,Math.round((ci-span/2)/GRID_K)*GRID_K)),j0=Math.max(0,Math.min(N-span,Math.round((cj-span/2)/GRID_K)*GRID_K));
  const p=shGeo.attributes.position.array;
  for(let j=0;j<=SH_N;j++)for(let i=0;i<=SH_N;i++){const gi=i0+i*GRID_K,gj=j0+j*GRID_K,o=(j*(SH_N+1)+i)*3;
    p[o]=gX(gi);p[o+1]=H[gj*V+gi]-0.05;p[o+2]=gZ(gj)}
  shGeo.attributes.position.needsUpdate=true;shMesh.visible=true;
}
