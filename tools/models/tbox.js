// Corley's Island: the detailed trench box (a steel trench shield), built from shapes and written out as
// models/tbox.glb by tools/build_model.js (three.js r147 in headless Chromium). The game loads it (js/models.js,
// MDL_KIT.tbox) in place of trenchbox.js's simple shapes when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node, tbox, in the box's own frame: origin on the ground under its middle, x across the trench, y up, z along
//   it; two side panels 1.5 m tall and 2.4 m long with their inner faces 0.5 m either side of the middle (BX_W, BX_H,
//   BX_L in trenchbox.js), held apart by spreaders near the ends; the crane chain hooks 0.15 m over the middle of its
//   top (the game draws the chain);
// - materials named for the game's or by kind and colour: paint#d8a514 (the yellow), paint#b88c10 (the darker channels),
//   steel#4c4f50 (the worn cutting edges), steelL (the spreader pipes), steel (pins, collars, bolts), metal#a7acaf
//   (galvanized shackles), paintR (the shackle pins), steel#9a9c98 (the rating plate).
// Metres. Classic script, no modules.
function buildTbox(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
// rounded boxes: a chamfer on every edge
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||14);
// a cross-section [[x,y],...] run along z, its length centred on z0
function along(pts,len,z0,bev){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,len-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:8});
  g.translate(0,0,(z0||0)-(len-2*b)/2);return BGU.toCreasedNormals(g,0.6)}
// a plate in the y-z plane (a profile [[z,y],...]) of a thickness across x, centred on x; holes [[z,y,r]]
function side(pts,w,bev,holes){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  for(const [hz,hy,hr] of holes||[]){const h=new T.Path();h.absarc(hz,hy,hr,0,Math.PI*2,true);s.holes.push(h)}
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:12});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(mat,pts,r,n,rs){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.2);put(B,mat,new T.TubeGeometry(c,n||Math.max(6,pts.length*4),r,rs||5,false))}
const arc=(c0,c1,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [c0+Math.cos(a)*r,c1+Math.sin(a)*r]});
// a hex bolt head and washer on a face looking along x (s = +1 or -1)
function boltX(p,s,r){put(B,'steel',CY(r*1.5,r*1.5,0.004,8),[p[0]+s*0.002,p[1],p[2]],[0,0,Math.PI/2]);put(B,'steel',CY(r,r,r*0.8,6),[p[0]+s*(0.004+r*0.4),p[1],p[2]],[0,0,Math.PI/2])}
// a pipe socket: a hollow collar 0.18 m across, 0.14 m long, along y
const COLLAR=new T.LatheGeometry([[0.072,-0.07],[0.09,-0.07],[0.09,0.07],[0.072,0.07],[0.072,-0.07]].map(([r,y])=>new T.Vector2(r,y)),18);
const B='tbox',Y='paint#d8a514',YD='paint#b88c10',EDGE='steel#4c4f50',H=1.5,L=2.4,XI=0.5,XO=0.61;

// ---------- each side panel, built for the right (+x) and turned half round for the left: a double-wall panel,
// the knife edge along its bottom, a capped top, C-channel ends, welded skin seams, spreader pockets inside,
// lifting lugs with shackles on top and drag eyes low on the ends ----------
for(const turn of [0,Math.PI]){const R=[0,turn,0],P=(x,y,z)=>turn?[-x,y,-z]:[x,y,z],put2=(mat,g,p,r)=>put(B,mat,g,P(...p),[r?r[0]:0,(r?r[1]:0)+turn,r?r[2]:0]);
  // the walls between the ends: the body above the knife edge, then the edge itself, bevelled on the outside
  put(B,Y,along([[XI,0.12],[XO,0.15],[XO,H-0.03],[XI,H-0.03]],L-0.03,0,0.004),[0,0,0],R);
  put(B,EDGE,along([[XI,0],[XI+0.022,0],[XO,0.15],[XI,0.12]],L-0.03,0,0.003),[0,0,0],R);
  // the top cap, standing a little proud of both skins
  put2(YD,RB(XO-XI+0.024,0.035,L-0.01,0.008),[(XI+XO)/2,H-0.0175,0]);
  // the ends: a C-channel (web across the panel, flanges proud of the skins), full height
  for(const s of [-1,1]){put2(YD,RB(XO-XI+0.006,H-0.02,0.014,0.004),[(XI+XO)/2,H/2,s*(L/2-0.007)]);
    for(const x of [XI-0.006,XO+0.006])put2(YD,RB(0.014,H-0.06,0.07,0.004),[x,H/2+0.02,s*(L/2-0.035)]);
    // a drag eye low on the end, and its welds
    put2(YD,side([[0,0.2],[0.11,0.22],...arc(0.12,0.32,0.06,-0.2,Math.PI*0.75,8),[0,0.38]],0.03,0.003,[[0.12,0.32,0.026]]),[(XI+XO)/2,0,s*(L/2-0.01)],[0,s>0?0:Math.PI,0])}
  // skin seams: the outer skin's sheets meet in two horizontal welds, the inner in one, with a bead along each
  for(const y of [0.55,1.05])put2(YD,new T.BoxGeometry(0.006,0.008,L-0.08),[XO+0.002,y,0]);
  put2(YD,new T.BoxGeometry(0.006,0.008,L-0.08),[XI-0.002,0.8,0]);
  // the rating plate on the outside, riveted
  put2('steel#9a9c98',RB(0.004,0.16,0.26,0.004),[XO+0.003,1.18,-0.72]);
  for(const [dy,dz] of [[-0.06,-0.11],[-0.06,0.11],[0.06,-0.11],[0.06,0.11]])put2('steel',CY(0.007,0.007,0.006,6),[XO+0.006,1.18+dy,-0.72+dz],[0,0,Math.PI/2]);
  // spreader pockets on the inner skin: a square base plate, a collar welded out from it with gussets, and the
  // collar pin dropped through it on its keeper
  for(const sz of [-1,1])for(const y of [0.35,1.25]){const z=sz*1.05;
    put2(YD,RB(0.016,0.22,0.22,0.004),[XI-0.008,y,z]);
    put2('steel',COLLAR,[XI-0.086,y,z],[0,0,Math.PI/2]);
    for(const d of [-1,1])put2(YD,side([[0,0],[0.1,0],[0,0.07]],0.014,0.002),[XI,y+d*0.09,z],[d>0?0:Math.PI,-Math.PI/2,0]);
    put2('chrome',CY(0.015,0.015,0.27,10),[XI-0.1,y+0.03,z]);put2('steel',CY(0.022,0.022,0.02,10),[XI-0.1,y+0.16,z]);
    put2('metal#a7acaf',new T.TorusGeometry(0.022,0.004,4,8),[XI-0.1,y-0.11,z+0.02],[0,0,Math.PI/2]);
    }
  // lifting lugs near each end of the top, a bow shackle through each, its pin painted red
  for(const sz of [-1,1]){const z=sz*0.92,x=(XI+XO)/2,yt=H;
    put2(YD,side([[-0.12,yt],[0.12,yt],[0.07,yt+0.1],...arc(0,yt+0.11,0.06,-0.2,Math.PI+0.2,10),[-0.07,yt+0.1]],0.03,0.003,[[0,yt+0.11,0.026]]),[x,0,z]);
    put2(YD,new T.BoxGeometry(0.04,0.012,0.25),[x,yt+0.004,z]);
    for(const d of [-1,1])put2('metal#a7acaf',CY(0.011,0.011,0.09,8),[x+d*0.03,yt+0.155,z]);
    put2('metal#a7acaf',new T.TorusGeometry(0.03,0.011,6,12,Math.PI),[x,yt+0.2,z]);
    put2('paintR',CY(0.012,0.012,0.1,8),[x,yt+0.11,z],[0,0,Math.PI/2]);put2('paintR',CY(0.02,0.02,0.012,6),[x+0.055,yt+0.11,z],[0,0,Math.PI/2])}
  // bolted wear strips along the outer face near the bottom, where the box drags on the trench wall
  for(const z of [-0.6,0,0.6]){put2(EDGE,new T.BoxGeometry(0.012,0.08,0.5),[XO+0.006,0.26,z]);for(const dz of [-0.2,0,0.2])boltX(P(XO+0.012,0.26,z+dz),turn?-1:1,0.01)}}

// ---------- the spreaders: two at each end, an outer pipe with a pinned inner pipe telescoping out of it, end
// fittings seated in the pockets, an adjusting collar and its pin ----------
for(const z of [-1.05,1.05])for(const y of [0.35,1.25]){
  put(B,'steelL',CY(0.064,0.064,0.62,16),[-0.11,y,z],[0,0,Math.PI/2]);put(B,'steelL',CY(0.054,0.054,0.36,16),[0.3,y,z],[0,0,Math.PI/2]);
  put(B,'steel',CY(0.075,0.075,0.07,16),[0.2,y,z],[0,0,Math.PI/2]);put(B,'chrome',CY(0.013,0.013,0.2,8),[0.2,y,z]);
  put(B,'steel',CY(0.02,0.02,0.015,6),[0.2,y+0.1,z]);
  // pin holes along the inner pipe, and the end fittings in the pockets
  for(const x of [0.28,0.34,0.4])put(B,'steel',CY(0.012,0.012,0.11,8),[x,y,z]);
  for(const s of [-1,1])put(B,'steel',CY(0.07,0.07,0.06,14),[s*(XI-0.115),y,z],[0,0,Math.PI/2]);
  put(B,YD,new T.TorusGeometry(0.065,0.005,3,16),[0.18,y,z],[0,Math.PI/2,0])}

// ---------- merge: one mesh per material ----------
const root=new T.Group();root.name='trenchBox';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
