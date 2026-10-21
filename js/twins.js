// Corley's Island: one of every machine on each island. The excavator, the dump truck and the mower live on Corley's
// Island and the skid steer and dirt bike on Dexter's; each has a twin parked on the other island (Dexter's heavy
// machines are a second set of their own, heavy.js). The game runs one of each (st, tr, mw, sk, bk), so a twin is a
// parked copy: its state (TWINS[i].p) and a still picture of the machine (a clone of its meshes, t.g), with a footprint
// in SOLIDS so everything bumps into it. Getting into a twin swaps the two: the running machine takes the twin's place
// and state, and where it stood a still copy of it is left parked. Only one can be driven at a time, so both always
// look and behave like real machines. Saved in bhd_rigs (save.js, tw).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TWINS=[
  {k:'ex',ride:'ex',n:'excavator',m:'dig',o:()=>st,c:EX_C,r:EX_R,half:[1.7,2.6],col:'#f07a22',len:5,wid:3.2,
    home:{x:-195,z:213,yaw:Math.PI/2},keys:['x','z','y','yaw','pitch','roll','swing','a1','a2','a3','load','loadC','loadMix','loadWet','stuck','grime','mud','pack','packC','sink'],
    vis:()=>[machine,...rams.flatMap(r=>[r.barrel,r.rod,r.ea,r.eb,r.gl]),...scene.children.filter(o=>o.isMesh&&hoses.some(h=>h.g===o.geometry))],
    after(){if(TB.hooked){TB.hooked=false;chain.visible=false;TB.ty=boxRest();TB.y=Math.max(TB.y,TB.ty);boxMask()}}},
  {k:'truck',ride:'truck',n:'dump truck',m:'truck',o:()=>tr,c:TR_C,r:TR_R,half:[1.3,4.7],col:'#e9ecea',len:8.5,wid:2.5,
    home:{x:-163,z:268,yaw:Math.PI},keys:['x','z','y','yaw','pitch','roll','bed','load','loadC','loadMix','loadWet','stuck','mud','sink','gear'],
    vis:()=>[truck],after(){Object.assign(tr,{v:0,spin:0,steer:0,shiftT:0,brakeOn:false})}},
  {k:'mow',ride:'mow',n:'mower',m:'mow',o:()=>mw,c:MW_C,r:MW_R,half:[0.8,1.0],col:'#c8291f',len:2,wid:1.5,
    home:{x:-172,z:214,yaw:Math.PI},keys:['x','z','y','yaw','pitch','roll'],
    vis:()=>[mower],after(){Object.assign(mw,{l:0,r:0,vl:0,vr:0,v:0,w:0,load:0})}},
  {k:'skid',ride:'skid',n:'skid steer',m:'skid',o:()=>sk,c:SK_C,r:SK_R,half:[0.9,1.5],col:'#f2b705',len:2.8,wid:1.8,
    home:{x:46,z:-4,yaw:-Math.PI/2},keys:['x','z','y','yaw','a','c','load','loadC','loadMix','loadWet','stuck'],
    vis:()=>[skid],after(){sk.v=0;sk.w=0;skidPose()}},
  {k:'bike',ride:'bike',n:'dirt bike',m:'bike',o:()=>bk,c:BK_C,r:BK_R,half:[0.4,1.0],col:'#f2b705',len:2.2,wid:0.8,
    home:{x:46,z:1,yaw:-Math.PI/2},keys:['x','z','y','yaw'],
    vis:()=>[bike],after(){Object.assign(bk,{v:0,vy:0,air:false});bikePose()}}];
const twCopy=v=>Array.isArray(v)?[...v]:v;
// a twin parked at its home, otherwise like the running machine
function twHome(t){const o=t.o(),p={};for(const k of t.keys)p[k]=twCopy(o[k]);Object.assign(p,t.home);p.y=surfAt(p.x,p.z);
  if('pitch' in p){p.pitch=0;p.roll=0}if(t.k==='ex'){Object.assign(p,{swing:START.swing,a1:START.a1,a2:START.a2,a3:START.a3,load:0,stuck:0,sink:0})}
  if('load' in p&&t.k!=='ex')p.load=0;return p}
// its footprint, a box round the machine whichever way it faces
function twSolid(t){const p=t.p,s=Math.abs(Math.sin(p.yaw)),c=Math.abs(Math.cos(p.yaw)),[w,l]=t.half;
  if(!t.sol){t.sol={};SOLIDS.push(t.sol)}Object.assign(t.sol,{x:p.x,z:p.z,hx:c*w+s*l,hz:s*w+c*l})}
// the still picture: the running machine's meshes cloned and carried from where it is to where the twin stands (a hose
// gets its own copy of its geometry, which the running excavator rewrites every frame)
const twM=new THREE.Vector3();
function twPicture(t){if(t.g){scene.remove(t.g);t.g=null}const o=t.o(),p=t.p,C=new THREE.Group();
  for(const src of t.vis()){const c=src.clone(true);c.traverse(m=>{if(m.isMesh&&t.k==='ex'&&hoses.some(h=>h.g===m.geometry))m.geometry=m.geometry.clone()});C.add(c)}
  C.rotation.y=p.yaw-o.yaw;C.updateMatrix();twM.set(o.x,0,o.z).applyMatrix4(C.matrix);C.position.set(p.x-twM.x,p.y-o.y,p.z-twM.z);
  C.traverse(m=>{if(m.isMesh)m.frustumCulled=true});scene.add(C);t.g=C}
// getting into a twin: the running machine and the twin change places
function twSwap(t){const o=t.o(),was={};for(const k of t.keys)was[k]=twCopy(o[k]);
  if(t.g){scene.remove(t.g);t.g=null}const p=t.p;t.p=was;
  twPicture(t);// the still copy of the running machine, where it stands now
  for(const k of t.keys)o[k]=twCopy(p[k]);o.y=surfAt(o.x,o.z);t.after();twSolid(t);wk.inside=t.ride}
// each one: the ride the walker climbs into, and its footprint
for(const t of TWINS){t.p=twHome(t);twSolid(t);
  WK_RIDES['twin_'+t.k]={o:{get x(){return t.p.x},get z(){return t.p.z},get yaw(){return t.p.yaw}},c:t.c,r:t.r,m:t.m,n:t.n,pick(){twSwap(t)}}}
// every frame: once the machines have their poses, take their pictures; again when the machine models change (models.js)
let twSig='',twFrames=0;
function twinTick(){if(++twFrames<3)return;const sig=(typeof mdl!=='undefined'?[mdl.on,mdl.trOn]:[]).join();
  if(sig===twSig&&TWINS.every(t=>t.g))return;twSig=sig;for(const t of TWINS)twPicture(t)}
// the save (save.js): each twin's state, and putting it back
function twSave(){const r={};for(const t of TWINS){const q={};for(const k of t.keys){const v=t.p[k];q[k]=Array.isArray(v)?v.map(x=>+x.toFixed(4)):typeof v==='number'?+v.toFixed(4):v}r[t.k]=q}return r}
function twLoad(d){for(const t of TWINS){const q=d&&d[t.k];if(!q)continue;
    for(const k of t.keys){const v=q[k];if(typeof v==='number'?isFinite(v):typeof v==='boolean'||Array.isArray(v)&&v.every(isFinite))t.p[k]=twCopy(v)}
    t.p.y=surfAt(t.p.x,t.p.z);twSolid(t)}
  twSig='';for(const t of TWINS)if(t.g){scene.remove(t.g);t.g=null}}
// every twin back at its home, and the running machines at theirs (the Reset and the move back home)
function twReset(){for(const t of TWINS){t.p=twHome(t);twSolid(t);if(t.g){scene.remove(t.g);t.g=null}}twSig=''}
