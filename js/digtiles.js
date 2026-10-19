// Corley's Island: dig tiles (docs/dig-plans.html). The dig grid stays one block of memory for speed, and follows the
// excavator or skid steer round Corley's (digMoveTo). Its tiles' ground lifts out into a store of its own and back: the dug height (as a change from the
// original grade, so map edits under it still count), dumped-dirt colour, packing, puddles and wet spoil, the wettest
// it got, and editor-painted depth. Shapes, grass, paint and the drawn colours are not kept: they come from the map and
// from what is kept. Neighbouring tiles share an edge row of points; a tile put back never overwrites an edge that a
// neighbour still in the grid holds, so edges stay seamless. Ruts in the mud tiles (mud.js) become real dug ground when
// a tile takes that ground over. Stored tiles are drawn at 0.64 m and ridden at full detail (farGround), and save with
// the site (tileStoreSave).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// what a tile keeps, per grid point: the array, values per point, and its untouched value (H is kept as H - H0); the
// dirt colour's is held at the arrays' own precision so untouched points compare equal
const TILE_FIELDS=[{id:'h',a:H,n:1,blank:0},{id:'c',a:spoilC,n:3,blank:Float32Array.from(SOIL[SPOIL].c)},{id:'p',a:comp,n:1,blank:0},{id:'wt',a:Wt,n:1,blank:-1e9},
  {id:'m',a:mudA,n:1,blank:0},{id:'s',a:soakMax,n:1,blank:0},{id:'d',a:paintD,n:1,blank:0}];
// tiles lifted out of the grid, by tKey(ti, tj)
const tileStore=new Map();
// tile t's points in the grid, edges included: [i0, i1, j0, j1]
function tileRange(t){return [t.i0,t.i1,t.j0,t.j1]}
// tile t's ground as plain arrays (row by row over its points), or null if nothing on it differs from untouched ground
function tileGrab(t){const [i0,i1,j0,j1]=tileRange(t),w=i1-i0+1,np=w*(j1-j0+1),out={ti:t.ti,tj:t.tj,w,t:Date.now()};let any=false;
  for(const f of TILE_FIELDS){const o=new Float32Array(np*f.n);let q=0;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i;
      if(f.id==='h'){const d=H[k]-H0[k];o[q++]=d;if(d)any=true}
      else for(let c=0;c<f.n;c++){const v=f.a[k*f.n+c];o[q++]=v;if(v!==(f.n>1?f.blank[c]:f.blank))any=true}}
    out[f.id]=o}
  return any?out:null}
// which of tile t's edges a neighbour in the grid holds (and so are left alone when t is put back): [west, east, north, south]
function tileHeldEdges(t){const a=t.ti-DIG_TILES[0].ti,b=t.tj-DIG_TILES[0].tj;return [a>0,a<TPG-1,b>0,b<TPG-1]}
// write tile t's points from a grab (or untouched ground for null), skipping held edges, and redraw them
function tilePut(t,g,held){const [i0,i1,j0,j1]=tileRange(t),w=i1-i0+1,[hw,he,hn,hs]=held||[false,false,false,false];
  let a0=N+1,a1=-1,b0=N+1,b1=-1,wet=false;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    if(hw&&i===i0||he&&i===i1||hn&&j===j0||hs&&j===j1)continue;
    const k=j*V+i,q=(j-j0)*w+(i-i0);
    for(const f of TILE_FIELDS)for(let c=0;c<f.n;c++){const v=g?g[f.id][q*f.n+c]:f.n>1?f.blank[c]:f.blank;
      if(f.id==='h')H[k]=H0[k]+v;else f.a[k*f.n+c]=v}
    if(H[k]!==H0[k]){a0=Math.min(a0,i);a1=Math.max(a1,i);b0=Math.min(b0,j);b1=Math.max(b1,j)}
    if(Wt[k]>-1e8)wet=true}
  if(a1>=0)growDug(a0,a1,b0,b1);
  if(wet)waterAny=waterSeen=true;
  touch(Math.max(0,i0-1),Math.min(N,i1+1),Math.max(0,j0-1),Math.min(N,j1+1));st.dirty=true}
// lift tile t out of the grid into the store, leaving untouched ground; and put a stored tile back (or untouched
// ground when none is stored)
function tileLift(t){const g=tileGrab(t);if(g)tileStore.set(tileKeyOf(t),g);else tileStore.delete(tileKeyOf(t));tilePut(t,null,tileHeldEdges(t));return g}
function tileRestore(t){tilePut(t,tileStore.get(tileKeyOf(t))||null,tileHeldEdges(t));tileStore.delete(tileKeyOf(t))}
// when tile t takes over ground the mud tiles rutted (mud.js), their ruts, puddles, churned mud and how wet they got
// carry into the grid: each grid point reads the fine grid around it. The fine grid is left as it was
function tileAdoptRuts(t){if(!FD)return 0;const [i0,i1,j0,j1]=tileRange(t);let n=0,a0=N+1,a1=-1,b0=N+1,b1=-1;
  const at=(A,fx,fz,blank)=>{const i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;if(i<0||j<0||i>=FNX||j>=FNZ)return blank;
    const p=j*FV+i;return A[p]*(1-u)*(1-v)+A[p+1]*u*(1-v)+A[p+FV]*(1-u)*v+A[p+FV+1]*u*v};
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=gX(i),z=gZ(j),fx=(x-FX0)/FC,fz=(z-FZ0)/FC,ci=Math.floor(fx),cj=Math.floor(fz);
    if(tileOf(Math.min(ci,FNX-1),Math.min(cj,FNZ-1))<0)continue;
    const k=j*V+i,d=at(FD,fx,fz,0);
    if(Math.abs(d)>1e-4&&H[k]===H0[k]){H[k]=H0[k]+d;n++;a0=Math.min(a0,i);a1=Math.max(a1,i);b0=Math.min(b0,j);b1=Math.max(b1,j)}
    const ri=Math.round(fx),rj=Math.round(fz),p=rj*FV+ri;
    if(FW[p]>-1e8&&Wt[k]<=-1e8){Wt[k]=FW[p];waterAny=waterSeen=true}
    mudA[k]=Math.max(mudA[k],FM[p]/255);soakMax[k]=Math.max(soakMax[k],FWX[p]/255)}
  if(a1>=0)growDug(a0,a1,b0,b1);
  touch(Math.max(0,i0-1),Math.min(N,i1+1),Math.max(0,j0-1),Math.min(N,j1+1));st.dirty=true;return n}

// ---------- where dug ground is: the grid (1) and stored tiles drawn outside it (2) ----------
const tKey=(ti,tj)=>(ti+64)*128+tj+64;
const farTiles=new Map();
function tileMade(x,z){if(x>=GX0&&x<GX1&&z>=GZ0&&z<GZ1)return 1;return farTiles.has(tKey(Math.floor(x/TILE),Math.floor(z/TILE)))?2:0}
// how far a stored tile's ground at x, z is dug (+ up) from the grade, at full detail; null where none is stored
function tileFarD(x,z){const ti=Math.floor(x/TILE),tj=Math.floor(z/TILE),f=farTiles.get(tKey(ti,tj));if(!f)return null;
  const g=f.g,w=g.w,fx=Math.min(w-1.001,(x-ti*TILE)/CELL),fz=Math.min(w-1.001,(z-tj*TILE)/CELL),i=fx|0,j=fz|0,u=fx-i,v=fz-j,q=j*w+i,h=g.h;
  return h[q]*(1-u)*(1-v)+h[q+1]*u*(1-v)+h[q+w]*(1-u)*v+h[q+w+1]*u*v}
{const mudFar=farGround;farGround=(x,z)=>{const d=tileFarD(x,z);return d===null?mudFar(x,z):baseHeight(x,z)+d}}
// a stored tile's ground mesh: every 4th point (0.64 m), coloured like the grid (soil by depth, dumped dirt, puddle mud)
const FAR_K=4;
function tileFarMesh(g){const n=(g.w-1)/FAR_K,vx=n+1,nv=vx*vx,x0=g.ti*TILE,z0=g.tj*TILE,c=[0,0,0,0];
  const P=new Float32Array(nv*3),C=new Float32Array(nv*3),D=new Float32Array(nv),SD=new Float32Array(nv),MA=new Float32Array(nv),MW=new Float32Array(nv),ix=[];
  for(let b=0;b<vx;b++)for(let a=0;a<vx;a++){const v=b*vx+a,q=b*FAR_K*g.w+a*FAR_K,x=x0+a*FAR_K*CELL,z=z0+b*FAR_K*CELL,d=g.h[q],h=baseHeight(x,z)+d;
    let rk=groundColor(x,z,h,c);const t=ss(0.02,0.16,Math.abs(d));
    if(t>0){const sc=d<0?SOIL[layerAt(x,z,-d,0.5)].c:[g.c[q*3],g.c[q*3+1],g.c[q*3+2]],sh=d<0?1-0.12*ss(0.3,2.5,-d):1;
      for(let e=0;e<3;e++)c[e]+=(sc[e]*sh*0.95-c[e])*t;rk=Math.max(rk,t)}
    P[v*3]=x;P[v*3+1]=h;P[v*3+2]=z;C.set(c.slice(0,3),v*3);D[v]=rk;SD[v]=-d;MA[v]=c[3]*(1-t);MW[v]=g.m[q]}
  for(let b=0;b<n;b++)for(let a=0;a<n;a++){const v=b*vx+a;ix.push(v,v+vx,v+1,v+1,v+vx,v+vx+1)}
  const G=new THREE.BufferGeometry();
  for(const [k,A,w] of [['position',P,3],['color',C,3],['normal',new Float32Array(nv*3),3],['dirt',D,1],['soilD',SD,1],['matA',MA,1],['mudW',MW,1],['wetT',new Float32Array(nv).fill(-1e4),1],['crk',new Float32Array(nv*2),2]])G.setAttribute(k,new THREE.BufferAttribute(A,w));
  G.setIndex(ix);const m=new THREE.Mesh(G,groundMat);m.receiveShadow=true;scene.add(m);return m}
function farDrop(key){const f=farTiles.get(key);if(!f)return;scene.remove(f.m);f.m.geometry.dispose();farTiles.delete(key)}
// draw every stored tile outside the grid, and edge them with skirts; the 1 m and 0.5 m meshes and the mud tiles skip them
function farSync(){for(const key of [...farTiles.keys()])if(!tileStore.has(key))farDrop(key);
  for(const [key,g] of tileStore){const f=farTiles.get(key);if(f&&f.g===g)continue;if(f)farDrop(key);farTiles.set(key,{g,m:tileFarMesh(g)})}
  digSkirtRects.length=0;for(const f of farTiles.values())digSkirtRects.push([f.g.ti*TILE,(f.g.ti+1)*TILE,f.g.tj*TILE,(f.g.tj+1)*TILE]);
  patchHoles(outPatch,MID);for(const P of [famGround,dexGround,jesGround])patchHoles(P,null);mtReindex();buildSkirts()}
// a ground patch's triangles: every cell but those in its fixed hole and on dug ground
function patchHoles(P,hole){const ix=[];for(let j=0;j<P.NZ;j++)for(let i=0;i<P.NX;i++){const x0=P.X0+i*P.CO,z0=P.Z0+j*P.CO;
    if(hole&&x0>=hole[0]-1e-6&&x0+P.CO<=hole[1]+1e-6&&z0>=hole[2]-1e-6&&z0+P.CO<=hole[3]+1e-6||tileMade(x0+P.CO/2,z0+P.CO/2))continue;const a=j*P.VX+i;ix.push(a,a+P.VX,a+1,a+1,a+P.VX,a+P.VX+1)}
  P.g.setIndex(ix)}
// after the map editor reshapes x0..x1, z0..z1: stored tiles there are redrawn on the new grade
function tileEdRefresh(x0,x1,z0,z1){let any=false;for(const [key,f] of farTiles){const tx=f.g.ti*TILE,tz=f.g.tj*TILE;
  if(tx>x1||tx+TILE<x0||tz>z1||tz+TILE<z0)continue;scene.remove(f.m);f.m.geometry.dispose();f.m=tileFarMesh(f.g);any=true}}

// ---------- moving the grid ----------
// where the grid may sit: wholly on one island's own ground mesh (Corley's 1 m and 0.5 m ground, the Family Island's,
// Dexter's and Jessica's), where its holes can be cut. Each region: the island's rectangle and the range of the grid's
// west and north edges inside it
const DIG_REGIONS=[OUTER_MID,FAM_PATCH,[dexGround.X0,dexGround.X0+dexGround.NX*dexGround.CO,dexGround.Z0,dexGround.Z0+dexGround.NZ*dexGround.CO],
  [jesGround.X0,jesGround.X0+jesGround.NX*jesGround.CO,jesGround.Z0,jesGround.Z0+jesGround.NZ*jesGround.CO]].map(r=>({r,
  x:[Math.ceil(r[0]/TILE)*TILE,Math.floor((r[1]-S)/TILE)*TILE],z:[Math.ceil(r[2]/TILE)*TILE,Math.floor((r[3]-S)/TILE)*TILE]}));
// tileStore keys are the same numbers as farTiles'
function tileKeyOf(t){return tKey(t.ti,t.tj)}
// move the grid so its west and north edges are x0, z0: its tiles' ground goes into the store, the new spot's comes out
// of it (or from the mud tiles' ruts), and everything built on the grid is redone. fresh: forget the grid's ground
function digMoveTo(x0,z0,fresh){
  if(!fresh)for(const t of DIG_TILES){const g=tileGrab(t),key=tileKeyOf(t);if(g)tileStore.set(key,g);else tileStore.delete(key)}
  GX0=x0;GZ0=z0;GX1=GX0+S;GZ1=GZ0+S;digTilesSet();
  st.cave=null;st.caveRisk=0;cI0=N+1;cI1=-1;cJ0=N+1;cJ1=-1;sI0=N+1;sI1=-1;sJ0=N+1;sJ1=-1;slInit=false;
  digInit();const blankW=-1e9;spoilC.fill(0);for(let k=0;k<V*V;k++)spoilC.set(SOIL[SPOIL].c,k*3);
  comp.fill(0);Wt.fill(blankW);mudA.fill(0);soakMax.fill(0);paintD.fill(0);crkA.fill(0);wetT.fill(-1e4);clearClods();
  const p=pos.array;for(let k=0;k<V*V;k++){p[k*3]=gX(k%V);p[k*3+2]=gZ((k/V)|0)}geo.computeBoundingSphere();
  // tiles coming in: stored ones oldest first, so where two share an edge the one dug last wins; new ground takes the ruts
  const ins=DIG_TILES.map(t=>({t,g:tileStore.get(tileKeyOf(t))||null})).sort((a,b)=>(a.g?a.g.t:0)-(b.g?b.g.t:0));
  for(const {t,g} of ins){tileStore.delete(tileKeyOf(t));if(g)tilePut(t,g);else{tilePut(t,null);tileAdoptRuts(t)}}
  farSync();if(typeof trenchKeys==='function')trenchKeys();lawnIdx();tuftIdx();
  for(let n=0;n<TUFTS;n++)if(tX[n]>LAWN_X0-0.2&&tX[n]<LAWN_X0+LAWN_NX*LAWN_GS+0.2&&tZ[n]>LAWN_Z0-0.2&&tZ[n]<LAWN_Z0+LAWN_NZ*LAWN_GS+0.2)tI[n]=-1;
  keepBuild();boxMask();dI0=0;dI1=N;dJ0=0;dJ1=N;winOn=true;st.dirty=true;if(typeof mapDirty!=='undefined')mapDirty=true;wetMapT=-1e9;if(typeof site!=='undefined')site.dirty=true;
  if(typeof lawnTerrain==='function'){const sv=[dI0,dI1,dJ0,dJ1];if(LAWN_I0<=LAWN_I1){dI0=LAWN_I0;dI1=LAWN_I1;dJ0=LAWN_J0;dJ1=LAWN_J1;lawnTerrain()}[dI0,dI1,dJ0,dJ1]=sv}}
// the grid follows the excavator or skid steer: once it is within 10 m of the grid's edge, the grid recentres on the tile
// corner nearest it (within where it may sit)
// (on a bridge or off every island it stays where it is)
function digTilesTick(dt){treeFallTick(dt);keepCheck();const o=wk.inside==='ex'?st:wk.inside==='skid'?sk:null;if(!o)return;
  const cx=GX0+S/2,cz=GZ0+S/2;if(Math.abs(o.x-cx)<S/2-10&&Math.abs(o.z-cz)<S/2-10)return;
  const R=DIG_REGIONS.find(R=>o.x>=R.r[0]&&o.x<=R.r[1]&&o.z>=R.r[2]&&o.z<=R.r[3]);if(!R)return;
  const cl=(v,r)=>Math.max(r[0],Math.min(r[1],v)),x0=cl(Math.round(o.x/TILE)*TILE-S/2,R.x),z0=cl(Math.round(o.z/TILE)*TILE-S/2,R.z);
  if(x0!==GX0||z0!==GZ0)digMoveTo(x0,z0)}
// Reset: back to the trench with nothing stored
function tileReset(){tileStore.clear();treeFallReset();digMoveTo(-TILE,-TILE,true)}

// ---------- saving the stored tiles ----------
// per tile (f:2), each point that differs from untouched ground: the gap since the last (varint), a flags byte, the dug
// height (mm), then as the flags say: dumped-dirt colour (only when it differs from the last point written), packing,
// wet spoil and the wettest it got (bytes), painted depth (mm) and the water surface (float). A tile worked over every
// point saves in about 375 KB of text (three times smaller than v135's form). Entries without f (v135) held every field at full width and still load; they carry w, which f:2 ones leave
// out so v135 skips them rather than misreading them
function tileEnc(g){const np=g.w*g.w,b=new Uint8Array(np*18+8),dv=new DataView(b.buffer);let o=0,last=-1;
  const SP=Float32Array.from(SOIL[SPOIL].c),q8=v=>Math.round(Math.min(1,Math.max(0,v))*255),mm=v=>Math.round(Math.max(-32.767,Math.min(32.767,v))*1000);
  let pc0=q8(SP[0]),pc1=q8(SP[1]),pc2=q8(SP[2]);
  for(let q=0;q<np;q++){const c0=g.c[q*3],c1=g.c[q*3+1],c2=g.c[q*3+2];
    if(!(g.h[q]||g.p[q]||g.m[q]||g.s[q]||g.d[q]||g.wt[q]>-1e8||c0!==SP[0]||c1!==SP[1]||c2!==SP[2]))continue;
    let gp=q-last;last=q;while(gp>=128){b[o++]=(gp&127)|128;gp>>>=7}b[o++]=gp;
    const k0=q8(c0),k1=q8(c1),k2=q8(c2),col=k0!==pc0||k1!==pc1||k2!==pc2,psm=g.p[q]||g.m[q]||g.s[q],wet=g.wt[q]>-1e8,pd=mm(g.d[q])!==0;
    b[o++]=(col?1:0)|(psm?2:0)|(pd?4:0)|(wet?8:0);dv.setInt16(o,mm(g.h[q]),true);o+=2;
    if(col){b[o++]=k0;b[o++]=k1;b[o++]=k2;pc0=k0;pc1=k1;pc2=k2}
    if(psm){b[o++]=q8(g.p[q]);b[o++]=q8(g.m[q]);b[o++]=q8(g.s[q])}
    if(pd){dv.setInt16(o,mm(g.d[q]),true);o+=2}
    if(wet){dv.setFloat32(o,g.wt[q],true);o+=4}}
  return {ti:g.ti,tj:g.tj,f:2,t:g.t,d:siteB64(b.subarray(0,o))}}
function tileStoreSave(){return [...tileStore.values()].map(tileEnc)}
// a saved tile back into arrays, or null if it can't be read
function tileDec(e){const W=N/TPG+1;
  {if(!e||!isFinite(e.ti)||!isFinite(e.tj)||typeof e.d!=='string'||(e.f===2?false:e.w!==W))return null;
    const np=W*W,g={ti:e.ti,tj:e.tj,w:W,t:e.t||0,h:new Float32Array(np),c:new Float32Array(np*3),p:new Float32Array(np),wt:new Float32Array(np).fill(-1e9),m:new Float32Array(np),s:new Float32Array(np),d:new Float32Array(np)};
    for(let q=0;q<np;q++)g.c.set(SOIL[SPOIL].c,q*3);
    try{const b=siteUnB64(e.d),dv=new DataView(b.buffer);let o=0,q=-1,c0=SOIL[SPOIL].c[0],c1=SOIL[SPOIL].c[1],c2=SOIL[SPOIL].c[2];
      while(o<b.length){let gp=0,sh=0,x;do{x=b[o++];gp|=(x&127)<<sh;sh+=7}while(x&128);q+=gp;if(q>=np)break;
        if(e.f===2){const fl=b[o++];g.h[q]=dv.getInt16(o,true)/1000;o+=2;
          if(fl&1){c0=b[o++]/255;c1=b[o++]/255;c2=b[o++]/255}g.c[q*3]=c0;g.c[q*3+1]=c1;g.c[q*3+2]=c2;
          if(fl&2){g.p[q]=b[o++]/255;g.m[q]=b[o++]/255;g.s[q]=b[o++]/255}
          if(fl&4){g.d[q]=dv.getInt16(o,true)/1000;o+=2}
          if(fl&8){g.wt[q]=dv.getFloat32(o,true);o+=4}}
        else{g.h[q]=dv.getFloat32(o,true);o+=4;for(let c=0;c<3;c++)g.c[q*3+c]=b[o++]/255;g.p[q]=b[o++]/255;g.m[q]=b[o++]/255;g.s[q]=b[o++]/255;
          g.d[q]=dv.getInt16(o,true)/1000;o+=2;if(b[o++]){g.wt[q]=dv.getFloat32(o,true);o+=4}}}}catch(err){return null}
    return g}}
function tileStoreLoad(a){tileStore.clear();if(!Array.isArray(a))return;for(const e of a){const g=tileDec(e);if(g)tileStore.set(tKey(g.ti,g.tj),g)}}
// the grid's own tiles in the same form, for a save too big for the browser in the usual form (siteSave)
function gridEnc(){const out=[];for(const t of DIG_TILES){const g=tileGrab(t);if(g)out.push(tileEnc(g))}return out}
function gridDec(a){if(!Array.isArray(a))return;for(const e of a){const g=tileDec(e),t=g&&DIG_TILES.find(t=>t.ti===g.ti&&t.tj===g.tj);if(t)tilePut(t,g)}}

// ---------- ground that can't be dug: under buildings and other solids, and at the bridge ends ----------
// grid points the bucket and blade leave alone, and that never slump or cave in; rebuilt when the grid moves or the
// solids change (props are placed in the map editor)
const digKeep=new Uint8Array(V*V);let keepSig='';
function keepBuild(){digKeep.fill(0);const m=0.6;
  for(const s of SOLIDS){const rot=s.sn!==undefined,hx=(rot?s.lx:s.hx)+m,hz=(rot?s.lz:s.hz)+m,R=Math.hypot(hx,hz);
    if(s.x+R<GX0||s.x-R>GX1||s.z+R<GZ0||s.z-R>GZ1)continue;
    const i0=Math.max(0,Math.floor(gI(s.x-R))),i1=Math.min(N,Math.ceil(gI(s.x+R))),j0=Math.max(0,Math.floor(gJ(s.z-R))),j1=Math.min(N,Math.ceil(gJ(s.z+R)));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){let dx=gX(i)-s.x,dz=gZ(j)-s.z;if(rot){const a=dx*s.cs-dz*s.sn;dz=dx*s.sn+dz*s.cs;dx=a}
      if(Math.abs(dx)<=hx&&Math.abs(dz)<=hz)digKeep[j*V+i]=1}}
  for(const b of BRIDGES)for(const [x,z] of [[b.x0,b.z0],[b.x1,b.z1]]){const R=b.hw+2.5;if(x+R<GX0||x-R>GX1||z+R<GZ0||z-R>GZ1)continue;
    const i0=Math.max(0,Math.floor(gI(x-R))),i1=Math.min(N,Math.ceil(gI(x+R))),j0=Math.max(0,Math.floor(gJ(z-R))),j1=Math.min(N,Math.ceil(gJ(z+R)));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(Math.hypot(gX(i)-x,gZ(j)-z)<=R)digKeep[j*V+i]=1}
  keepSig=solidSig()}
function solidSig(){let a=0;for(const s of SOLIDS)a+=s.x*1.3+s.z*0.7+(s.hx||s.lx||0);return SOLIDS.length+':'+a.toFixed(2)}
function keepCheck(){if(solidSig()!==keepSig)keepBuild()}

// ---------- trees on dug ground fall ----------
// once the ground round a trunk is dug out more than about 16 in, the tree tips over towards the hole and lies where it
// lands (saved with the site as tf). Standing trees come from their islands' groups; fallen ones are left out of them
// (treeFallen, trees.js) and drawn on their own
const TREE_FALL_D=0.4,TREE_FALL_T=2.2;let treeScanT=0;const treeFalls=[];
const treeUp=new THREE.Vector3(0,1,0),treeAx=new THREE.Vector3(),treeQ=new THREE.Quaternion(),treeO=new THREE.Object3D();
// the tree entry standing at x, z in any group, and its group name
function treeAt(key){for(const g in treeGroups)for(const a of treeGroups[g])if(treeKey(a.x,a.z)===key)return a;return null}
function treeFallMesh(f){const a=f.a,k=treeSpecies(a.t,a.x,a.z),sp=TREE_SP[k],ims=sp.hi.map((im,n)=>{const m=new THREE.InstancedMesh(im.geometry,im.material,1);
    m.frustumCulled=false;m.receiveShadow=true;if(n===1){m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(a.c),3)}scene.add(m);return m});
  f.ims=ims;treePose(f)}
function treePose(f){const a=f.a,w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9),th=(Math.PI/2-0.06)*Math.min(1,Math.pow(f.t/TREE_FALL_T,2));
  treeO.position.set(a.x,a.y-0.05,a.z);treeO.rotation.set((w-0.5)*0.06,a.yaw,(w2-0.5)*0.06);treeO.scale.set(a.s,a.s*(a.sy||1),a.s);
  treeAx.set(f.dz,0,-f.dx).normalize();treeQ.setFromAxisAngle(treeAx,th);treeO.quaternion.premultiply(treeQ);treeO.updateMatrix();
  for(const m of f.ims){m.setMatrixAt(0,treeO.matrix);m.instanceMatrix.needsUpdate=true}}
// knock tree a over towards dx, dz (t: how far through the fall it starts, so loaded trees lie flat at once)
function treeFell(a,dx,dz,t){const key=treeKey(a.x,a.z);if(treeFallen.has(key))return;const l=Math.hypot(dx,dz)||1;
  const f={a,key,dx:dx/l,dz:dz/l,t,landed:t>=TREE_FALL_T};treeFallen.set(key,f);treeFalls.push(f);treeFallMesh(f);
  const g=Object.keys(treeGroups)[0];if(g)treeGroup(g,treeGroups[g])}
function treeFallTick(dt){
  for(const f of treeFalls)if(!f.landed){f.t=Math.min(TREE_FALL_T,f.t+dt);treePose(f);
    if(f.t>=TREE_FALL_T){f.landed=true;const h=TREE_SP[treeSpecies(f.a.t,f.a.x,f.a.z)].h*f.a.s*0.6,x=f.a.x+f.dx*h,z=f.a.z+f.dz*h;
      dustPuff(x,hAt(x,z)+0.3,z,40,[0.42,0.36,0.27]);rumble(400,0.6);site.dirty=true}}
  if((treeScanT-=dt)>0)return;treeScanT=0.4;
  for(const g in treeGroups)for(const a of treeGroups[g]){if(!inDig(a.x,a.z,1)||treeFallen.has(treeKey(a.x,a.z)))continue;
    const ci=Math.round(gI(a.x)),cj=Math.round(gJ(a.z)),r=Math.ceil(0.7/CELL);let dmax=0;
    for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++){const k=j*V+i;if(H0[k]-H[k]>dmax)dmax=H0[k]-H[k]}
    if(dmax<TREE_FALL_D)continue;
    // towards the hole: the dug depth round it, weighted by where it is
    const R=Math.ceil(2.5/CELL);let sx=0,sz=0;
    for(let j=Math.max(0,cj-R);j<=Math.min(N,cj+R);j+=2)for(let i=Math.max(0,ci-R);i<=Math.min(N,ci+R);i+=2){const d=H0[j*V+i]-H[j*V+i];if(d>0.05){sx+=(gX(i)-a.x)*d;sz+=(gZ(j)-a.z)*d}}
    if(!sx&&!sz){sx=Math.cos(a.yaw);sz=Math.sin(a.yaw)}
    treeFell(a,sx,sz,0);stats.treesFelled++;statDirty=true}}
function treeFallReset(){for(const f of treeFalls)for(const m of f.ims){scene.remove(m);m.dispose()}treeFalls.length=0;treeFallen.clear();
  const g=Object.keys(treeGroups)[0];if(g)treeGroup(g,treeGroups[g])}
function treeFallSave(){return treeFalls.map(f=>[+f.a.x.toFixed(3),+f.a.z.toFixed(3),+f.dx.toFixed(3),+f.dz.toFixed(3)])}
function treeFallLoad(a){treeFallReset();if(!Array.isArray(a))return;for(const e of a){if(!Array.isArray(e)||e.length!==4||!e.every(isFinite))continue;
  const t=treeAt(treeKey(e[0],e[1]));if(t)treeFell(t,e[2],e[3],TREE_FALL_T)}}
