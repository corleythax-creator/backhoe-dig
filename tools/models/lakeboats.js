// Corley's Island: the detailed boats out on the lake (js/lakeboats.js): the two fishing boats, the two sloops, and the
// push tug with the spoil barge ahead of it. Built from shapes and written out as models/lakeboats.glb by
// tools/build_model.js (three.js r147 in headless Chromium); the game loads it (js/models.js, MDL_KIT.lakeboats) in place
// of the kit-built boats when Machine models are Detailed. Only the look changes: routes, wakes, swells and the horn are
// the game's.
// The contract with the game, so a model made in Blender or bought can replace this one. Every node is in its boat's
// own group frame: waterline at y 0, bow toward +z, x to starboard (right looking forward), metres in that frame (the
// fishing boats' groups are scaled 0.85, so their nodes are drawn at 85%):
// - fish: an aluminium fishing boat without its topsides, 5.2 m long in its frame (transom at z -2.6, stem at +2.6),
//   2.1 m beam, gunwale 0.52 m up aft rising to 0.72 at the bow, keel 0.34 m down; a tiller outboard behind the transom
//   (cowling at z -2.88), and two anglers: one at the tiller (hips at x 0.15, 0.62 up, z -2.2), one on the middle seat
//   (hips at 0, 0.66, -0.6) holding a rod out to starboard. fishHullA and fishHullB are the topsides and transom of each
//   (bare aluminium on the first, green paint on the second);
// - sail: a 25 ft sloop without its topsides and sails, 7.8 m long (z -3.9 to 3.9), 1.8 m beam, cabin trunk from z -1.1
//   to 1.5 (top 1.0 m up), mast stepped at z 0.9 to 9.5 m up, boom 1.65 m up from the mast to z -2.7, the helmsman's hips
//   at 0, 0.55, -2.6. sailHullA and sailHullB are the topsides, boot stripe and the sails of each (navy and white
//   hulls); the mainsail from the tack at 1.75 m up to the head at 9.2 m and back along the boom to z -2.65, the jib from
//   9.2 m... its head at 8.2 m up on the forestay, tack at z 3.7, clew at z 1.1; each set bellied to its own leeward
//   side (the first heels to port, the second to starboard);
// - tug: a steel push boat whose middle is 6.6 m behind the group's origin (its hull z -9.2 to -4.0, 2.8 m beam), the
//   wheelhouse roof 3.2 m up, push knees at x ±0.9 facing forward at z -3.65 against the barge's stern;
// - barge: the spoil barge ahead of it, its middle 3.6 m ahead of the origin (stern at z -3.4, deck 0.85 m up, raked bow
//   to z 11.6), 5.4 m beam, heaped with spoil to about 2.5 m up. It goes in a child group of the tug's.
// Materials are named for the game's (models.js mdlMatOf): mdlMats names (tire, black, seat, chrome, lens, redL, tint)
// and kind#colour (paint, steel, rubber, plastic, matte, metal, win) and lib:<id> (planks, diamond, rustplate, dirt2).
// Metres. Classic script, no modules.
function buildLakeboats(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),V=(x,y,z)=>new T.Vector3(x,y,z);
function put(part,mat,g,p,r,sc){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(V(...(p||[0,0,0])),q,sc?V(...sc):V(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
// rounded boxes: two segments on real panels, one (a chamfer) on smaller parts, plain boxes for thin strips and plates
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const RB=(w,h,d,r,seg)=>{const D=[w,h,d].sort((a,b)=>a-b);return D[0]<0.03&&!seg?BX(w,h,d):new T.RoundedBoxGeometry(w,h,d,seg||(D[1]>0.8?2:1),Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4))};
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||12);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)},lerp=(a,b,t)=>a+(b-a)*t;
// a profile in the z-y plane extruded w across x, centred on x 0
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// a profile in the x-y plane extruded d along z, centred on z 0
function front(pts,d,bev){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,d-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.translate(0,0,-(d-2*b)/2);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n,rs){const c=new T.CatmullRomCurve3(pts.map(p=>V(...p)),false,'catmullrom',0.1);return put(part,mat,new T.TubeGeometry(c,n||Math.max(4,pts.length*6),r,rs||8,false))}
// a straight rod (wire, stanchion, rail) from a to b
function rod(part,mat,a,b,r,n){const A=V(...a),B=V(...b),d=B.clone().sub(A),g=CY(r,r,d.length(),n||8);g.translate(0,d.length()/2,0);
  const qq=new T.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize());g.applyQuaternion(qq);g.translate(A.x,A.y,A.z);return put(part,mat,g)}
// a surface through rows of points (rows[i][j] = [x,y,z]), quads between neighbours; flip turns it to face the other way
function sheet(rows,flip,crease){const n=rows[0].length,P=[],ix=[];for(const r of rows)for(const p of r)P.push(...p);
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<n-1;j++){const a=i*n+j,b=a+n;flip?ix.push(a,a+1,b,a+1,b+1,b):ix.push(a,b,a+1,a+1,b,b+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(ix);g.computeVertexNormals();
  return crease?BGU.toCreasedNormals(g.toNonIndexed(),crease):g}
const mir=rows=>rows.map(r=>r.map(([x,y,z])=>[-x,y,z]));
// a seated person, hips at x,y,z facing +z, feet on the floor at fy; hands reach for hl and hr ([x,y,z]); lean forward a little
function person(part,x,y,z,fy,shirt,cap,hl,hr,o){o=o||{};const SK='matte#c68a62',JN='matte#34507a',SH='rubber#3a342e',lean=o.lean||0.12;
  for(const s of [-1,1]){const hx=x+s*0.1;tube(part,JN,[[hx,y+0.06,z-0.04],[hx+s*0.02,y+0.07,z+0.2],[hx+s*0.03,y+0.06,z+0.4]],0.075,6,8);
    const kz=z+0.42,ky=y+0.05;tube(part,JN,[[hx+s*0.03,ky,kz],[hx+s*0.035,lerp(ky,fy+0.1,0.5),kz+0.04],[hx+s*0.04,fy+0.1,kz+0.06]],0.058,4,8);
    put(part,SH,RB(0.11,0.09,0.27,0.04),[hx+s*0.04,fy+0.045,kz+0.12])}
  // the torso and the jacket over it, the life vest, neck and head, a cap with its bill
  const tw=0.37,ty=y+0.3;put(part,shirt,RB(tw,0.5,0.24,0.1,3),[x,ty,z-0.02+lean*0.25],[lean,0,0]);
  if(o.vest)put(part,o.vest,RB(tw+0.03,0.32,0.27,0.1,2),[x,ty+0.06,z+lean*0.28],[lean,0,0]);
  put(part,SK,CY(0.05,0.055,0.1,10),[x,y+0.59,z+lean*0.5]);const hz=z+lean*0.55+0.01;
  put(part,SK,new T.SphereGeometry(0.1,14,10),[x,y+0.69,hz],null,[0.92,1.05,1]);
  put(part,'matte#3b2e25',new T.SphereGeometry(0.103,16,10,0,Math.PI*2,0,Math.PI*0.6),[x,y+0.7,hz-0.006],[-0.35,0,0],[0.95,1,1]);
  put(part,cap,new T.SphereGeometry(0.106,16,8,0,Math.PI*2,0,Math.PI*0.42),[x,y+0.715,hz],[-0.08,0,0],[0.96,1,1]);
  put(part,cap,RB(0.17,0.012,0.12,0.005),[x,y+0.735,hz+0.12],[0.12,0,0]);
  put(part,'black',RB(0.15,0.03,0.02,0.008),[x,y+0.705,hz+0.094]);
  // arms: shoulder, elbow dropped and out, hand at its target
  for(const [s,h] of [[-1,hl],[1,hr]]){const sh=[x+s*0.2,y+0.5,z+lean*0.4],hd=h,el=[lerp(sh[0],hd[0],0.45)+s*0.07,lerp(sh[1],hd[1],0.5)-0.12,lerp(sh[2],hd[2],0.5)];
    tube(part,shirt,[sh,el],0.05,3,8);tube(part,shirt,[el,hd],0.044,3,8);put(part,SK,new T.SphereGeometry(0.045,8,6),hd,null,[1,0.8,1.25])}}

// =====================================================================================================================
// ---------- the fishing boat: a riveted aluminium mod-V hull with a spray rail, casting decks, pedestal seats ----------
{const F='fish',L=5.2,B=2.1,NS=30;
  const sec=t=>{const w=t<0.55?B/2*(0.93+0.07*t/0.55):B/2*Math.sqrt(Math.max(0,1-((t-0.55)/0.45)**2));
    return {w,top:0.52+0.2*ss(0.55,1,t),keel:-0.34+0.42*ss(0.7,1,t)**2,chine:-0.14+0.12*ss(0.6,1,t)}};
  const zt=t=>-L/2+t*L,ts=Array.from({length:NS+1},(_,i)=>i/NS);
  // bottom (keel to the spray rail) and topsides (rail to gunwale), starboard rows; port mirrored
  const bot=ts.map(t=>{const s=sec(t),w=Math.max(s.w,0.003),z=zt(t);return [[0,s.keel,z],[0.3*w,lerp(s.keel,s.chine,0.34),z],[0.6*w,lerp(s.keel,s.chine,0.68)-0.006,z],[0.87*w,s.chine-0.004,z],[0.9*w,s.chine-0.004,z],[0.905*w,s.chine+0.025,z]]});
  const topR=ts.map(t=>{const s=sec(t),w=Math.max(s.w,0.003),z=zt(t);return [[0.905*w,s.chine+0.025,z],[0.95*w,lerp(s.chine,s.top,0.4),z],[0.985*w,lerp(s.chine,s.top,0.75),z],[w,s.top,z]]});
  put(F,'paint#a4abb0',sheet(bot,true));put(F,'paint#a4abb0',sheet(mir(bot),false));
  for(const [nd,mat] of [['fishHullA','paint#9aa2a7'],['fishHullB','paint#3d5a3a']]){
    put(nd,mat,sheet(topR,true));put(nd,mat,sheet(mir(topR),false));
    // the transom: a flat plate across the stern, the motor well notch left to the bracket
    const s0=sec(0),sh=new T.Shape();sh.moveTo(-s0.w,s0.top);sh.lineTo(-0.905*s0.w,s0.chine+0.025);sh.lineTo(-0.87*s0.w,s0.chine);sh.lineTo(0,s0.keel);sh.lineTo(0.87*s0.w,s0.chine);
    sh.lineTo(0.905*s0.w,s0.chine+0.025);sh.lineTo(s0.w,s0.top);sh.lineTo(0.3,s0.top);sh.lineTo(0.3,s0.top-0.1);sh.lineTo(-0.3,s0.top-0.1);sh.lineTo(-0.3,s0.top);sh.closePath();
    const tg=new T.ShapeGeometry(sh);tg.rotateY(Math.PI);put(nd,mat,tg,[0,0,-L/2-0.001]);
    // rivet seams along the topsides: a raised strip per plate joint
    if(nd==='fishHullA')for(const k of [0.45,0.8])for(const sd of [-1,1])tube(nd,mat,ts.filter(t=>t<0.96).map(t=>{const s=sec(t);return [sd*(lerp(0.95,0.99,k)*s.w+0.004),lerp(s.chine,s.top,k*0.9),zt(t)]}),0.006,40,4);
    // registration-free bow numbers would be a logo; a plain contrasting stripe under the gunwale instead
    for(const sd of [-1,1])tube(nd,nd==='fishHullA'?'paint#2b3d55':'paint#d9d6cf',ts.filter(t=>t<0.97).map(t=>{const s=sec(t);return [sd*(0.992*s.w+0.004),s.top-0.07,zt(t)]}),0.018,44,4)}
  // the inner liner (bare aluminium) and the cockpit sole, carpeted decks fore and aft
  const lin=ts.filter(t=>t<0.985).map(t=>{const s=sec(t),w=Math.max(s.w-0.03,0.003),z=zt(t);return [[0.62*w,0.1,z],[0.9*w,0.14,z],[0.97*w,lerp(0.14,s.top,0.6),z],[w,s.top-0.005,z]]});
  put(F,'paint#8b9297',sheet(lin,false));put(F,'paint#8b9297',sheet(mir(lin),true));
  put(F,'paint#8b9297',RB(0.6,0.12,0.02,0.005),[0,sec(0).top-0.04,-L/2+0.02]);
  const sole=[];for(const t of ts.filter(t=>t<0.82)){const s=sec(t),w=Math.max(s.w-0.03,0.003)*0.92,z=zt(t);sole.push([[-w,0.11,z],[0,0.115,z],[w,0.11,z]])}
  put(F,'matte#4f5a45',sheet(sole,false));
  // front casting deck: a raised carpeted platform out to the hull sides, its face and a hatch
  {const pts=[];for(const t of ts.filter(t=>t>=0.6&&t<0.985)){const s=sec(t),w=Math.max(s.w-0.035,0.004);pts.push([[-w,0.45,zt(t)],[0,0.455,zt(t)],[w,0.45,zt(t)]])}
    put(F,'matte#5b6b48',sheet(pts,false));const s6=sec(0.6),w6=s6.w-0.035;put(F,'paint#8b9297',RB(2*w6,0.34,0.02,0.005),[0,0.28,zt(0.6)]);
    for(const [hx,hz] of [[0,1.25],[-0.42,0.9]]){put(F,'matte#4b5a3c',RB(0.5,0.012,0.4,0.004),[hx,0.458,hz]);put(F,'chrome',RB(0.08,0.012,0.02,0.004),[hx,0.465,hz-0.17])}}
  // rear deck with the livewell and the battery box under it, the tiller angler's seat on a short pedestal
  {const t0=0,t1=(L/2-1.65)/L;const pts=[];for(const t of ts.filter(t=>t<=t1+1e-6)){const s=sec(t),w=s.w-0.035;pts.push([[-w,0.44,zt(t)],[0,0.445,zt(t)],[w,0.44,zt(t)]])}
    put(F,'matte#5b6b48',sheet(pts,false));const s1=sec(t1);put(F,'paint#8b9297',RB(2*(s1.w-0.035),0.32,0.02,0.005),[0,0.28,zt(t1)]);
    put(F,'matte#4b5a3c',RB(0.62,0.012,0.36,0.004),[-0.45,0.446,-1.95]);put(F,'chrome',RB(0.1,0.012,0.02,0.004),[-0.45,0.452,-1.76])}
  // pedestal seats: the middle one (the angler's), the tiller seat, an empty one up on the bow deck
  for(const [sx,sz,sy,base] of [[0,-0.6,0.66,0.12],[0.15,-2.2,0.62,0.45],[0,1.55,0.95,0.46]]){
    put(F,'chrome',CY(0.035,0.035,sy-0.1-base,14),[sx,(sy-0.1+base)/2,sz]);put(F,'black',CY(0.12,0.14,0.03,18),[sx,base+0.015,sz]);
    put(F,'black',CY(0.06,0.06,0.04,14),[sx,sy-0.1,sz]);put(F,'seat',RB(0.42,0.08,0.4,0.035),[sx,sy-0.045,sz]);
    put(F,'seat',RB(0.4,0.3,0.07,0.03),[sx,sy+0.14,sz-0.2],[-0.14,0,0]);put(F,'matte#8c8f92',RB(0.43,0.02,0.41,0.008),[sx,sy-0.09,sz])}
  // gunwale: a rubber rail capping the sheer, a bow eye and cleats, rod holders, the navigation lights
  for(const sd of [-1,1]){tube(F,'rubber#2a2b2d',ts.filter(t=>t<0.995).map(t=>{const s=sec(t);return [sd*(s.w-0.012),s.top+0.012,zt(t)]}),0.025,60,6);
    for(const cz of [-2.3,1.9]){const s=sec((cz+L/2)/L);put(F,'chrome',RB(0.03,0.025,0.16,0.01),[sd*(s.w-0.04),s.top+0.045,cz]);put(F,'chrome',RB(0.025,0.03,0.04,0.008),[sd*(s.w-0.04),s.top+0.025,cz])}
    for(const cz of [-1.2,0.2]){const s=sec((cz+L/2)/L);put(F,'black',CY(0.022,0.02,0.22,10),[sd*(s.w-0.07),s.top-0.06,cz],[0.35,0,sd*0.15])}}
  put(F,'chrome',new T.TorusGeometry(0.035,0.008,6,14),[0,0.42,L/2+0.005]);
  put(F,'black',RB(0.12,0.05,0.08,0.02),[0,0.745,L/2-0.08]);put(F,'redL',RB(0.04,0.04,0.05,0.012),[-0.04,0.79,L/2-0.08]);put(F,'plastic#1f8a3a',RB(0.04,0.04,0.05,0.012),[0.04,0.79,L/2-0.08]);
  put(F,'black',CY(0.012,0.012,0.9,8),[-0.7,0.9,-2.42]);put(F,'lens',new T.SphereGeometry(0.025,10,8),[-0.7,1.36,-2.42]);
  // the bow-mount trolling motor: a mount on the deck, its shaft stowed up and the head over the bow, the foot pedal
  {const bz=2.25;put(F,'black',RB(0.18,0.06,0.42,0.02),[0.18,0.62,bz]);put(F,'black',RB(0.1,0.12,0.12,0.03),[0.18,0.7,bz+0.1]);
    put(F,'black',CY(0.016,0.016,1.15,10),[0.18,0.72,bz-0.4],[Math.PI/2,0,0]);put(F,'paint#1d1e20',RB(0.12,0.1,0.2,0.04),[0.18,0.75,bz+0.27]);
    put(F,'paint#1d1e20',CY(0.05,0.045,0.26,14),[0.18,0.69,bz-1.02],[Math.PI/2,0,0]);put(F,'steel#3a3d40',CY(0.008,0.008,0.05,6),[0.18,0.69,bz-1.17],[Math.PI/2,0,0]);
    for(let k=0;k<2;k++)put(F,'plastic#2a2c2f',RB(0.02,0.16,0.035,0.008),[0.18,0.69,bz-1.18],[0,0,k*Math.PI/2+0.3]);
    put(F,'black',RB(0.22,0.035,0.3,0.015),[-0.1,0.48,1.0],[-0.12,0,0])}
  // stuff in the boat: a cooler, a tackle box, a landing net laid along the side, a fire extinguisher
  put(F,'plastic#e4e1d8',RB(0.55,0.32,0.34,0.05),[-0.5,0.28,-1.15]);put(F,'plastic#2b5a8a',RB(0.57,0.05,0.36,0.03),[-0.5,0.46,-1.15]);
  put(F,'plastic#5a6a3a',RB(0.42,0.2,0.24,0.03),[0.5,0.22,0.2]);put(F,'black',RB(0.2,0.02,0.02,0.008),[0.5,0.34,0.2]);
  tube(F,'black',[[0.62,0.18,-1.9],[0.66,0.2,-0.7],[0.7,0.22,0.3]],0.012,6,6);put(F,'black',new T.TorusGeometry(0.2,0.01,6,18),[0.68,0.24,0.5],[Math.PI/2+0.1,0,0]);
  put(F,'paintR',CY(0.04,0.04,0.32,12),[-0.72,0.3,-0.2],[Math.PI/2,0,0]);
  // the tiller outboard: clamp bracket on the transom notch, cowling, midsection, leg, cavitation plate, skeg, propeller
  {const mz=-L/2-0.3,top=sec(0).top;put(F,'steel#3a3d40',RB(0.5,0.16,0.14,0.03),[0,top-0.06,-L/2-0.07]);
    for(const s of [-1,1])put(F,'chrome',CY(0.02,0.02,0.18,10),[s*0.16,top-0.1,-L/2+0.04],[Math.PI/2,0,0]);
    const cw=side([[0.22,0],[0.25,0.18],[0.22,0.36],[0.1,0.46],[-0.18,0.47],[-0.3,0.4],[-0.32,0.2],[-0.28,0],[0.22,0]],0.44,0.06);put(F,'paint#1d1e20',cw,[0,0.62,mz]);
    put(F,'paint#6c7176',RB(0.4,0.12,0.58,0.04),[0,0.58,mz]);put(F,'paint#c9ccc8',RB(0.41,0.02,0.59,0.008),[0,0.66,mz]);
    put(F,'paint#2a2c2f',side([[0.14,0.52],[0.16,0.1],[0.1,-0.3],[0.12,-0.4],[-0.14,-0.4],[-0.12,-0.3],[-0.1,0.1],[-0.12,0.52]],0.13,0.03),[0,0,mz-0.06]);
    put(F,'paint#2a2c2f',RB(0.36,0.025,0.42,0.01),[0,-0.24,mz-0.08]);put(F,'paint#2a2c2f',CY(0.07,0.07,0.32,16),[0,-0.48,mz-0.08],[Math.PI/2,0,0]);
    put(F,'paint#2a2c2f',side([[0.0,-0.5],[-0.16,-0.5],[-0.08,-0.7],[0.02,-0.68]],0.03,0.008),[0,0,mz-0.12]);
    put(F,'steel#3a3d40',CY(0.045,0.03,0.1,12),[0,-0.48,mz-0.3],[Math.PI/2,0,0]);
    for(let k=0;k<3;k++)put(F,'steel#3a3d40',RB(0.03,0.2,0.09,0.012),[0,-0.48,mz-0.3],[0,0.35,k*2.094+0.4],null);
    // the tiller handle reaching forward to the angler's hand, its twist grip
    tube(F,'paint#2a2c2f',[[0.08,0.78,mz+0.26],[0.2,0.82,mz+0.45],[0.3,0.86,mz+0.62]],0.03,8,10);put(F,'rubber#1b1c1b',CY(0.034,0.034,0.14,12),[0.32,0.865,mz+0.66],[Math.PI/2,0.5,0])}
  // the anglers: one with a hand on the tiller, one holding a rod out over the starboard side
  person(F,0.15,0.62,-2.2,0.45,'matte#7a3b2a','matte#2b4d6e',[-0.05,0.85,-1.95],[0.31,0.87,-2.2],{lean:0.08,vest:'matte#c8562a'});
  person(F,0,0.66,-0.6,0.12,'matte#3f6e4a','matte#d8c49a',[0.12,0.92,-0.32],[0.2,0.98,-0.18],{lean:0.16});
  // the rod: blank, cork grip, guides, spinning reel, the line hanging from the tip
  {const a=[0.1,0.9,-0.42],b=[1.45,2.55,1.05];rod(F,'black',a,b,0.009,8);rod(F,'matte#b08a5a',a,[0.21,1.03,-0.3],0.016,10);
    for(let k=1;k<6;k++){const t=k/6;put(F,'chrome',new T.TorusGeometry(0.012,0.003,4,8),[lerp(a[0],b[0],t),lerp(a[1],b[1],t)-0.018,lerp(a[2],b[2],t)],[0.6,0,0.7])}
    put(F,'metal#b8bcc0',CY(0.035,0.035,0.05,14),[0.19,0.98,-0.3],[0,0,Math.PI/2]);put(F,'black',RB(0.02,0.06,0.02,0.006),[0.19,0.95,-0.3]);
    rod(F,'matte#d8d4c8',b,[1.5,0.0,1.25],0.0015,4)}
}

// =====================================================================================================================
// ---------- the sloop: a 25 ft fibreglass hull with a fin keel and a transom-hung rudder, a cabin trunk, the rig ----------
{const S='sail',L=7.8,NS=30;
  const sec=t=>{const B=2.1*0.85,w=t<0.55?B/2*(0.86+0.14*Math.sin(t/0.55*Math.PI/2)):B/2*Math.sqrt(Math.max(0,1-((t-0.55)/0.45)**1.8));
    return {w,top:0.52+0.2*ss(0.45,1,t)**1.4,keel:-0.36+0.42*ss(0.72,1,t)**2,bilge:-0.2+0.1*ss(0.65,1,t)}};
  const zt=t=>-L/2+t*L,ts=Array.from({length:NS+1},(_,i)=>i/NS);
  // the round-bilged hull below the boot stripe, the stripe at the waterline, the topsides above
  const row=(t,k0,k1,n)=>{const s=sec(t),w=Math.max(s.w,0.003),z=zt(t),out=[];
    for(let i=0;i<=n;i++){const a=lerp(k0,k1,i/n),ang=a*Math.PI/2,x=w*Math.sin(ang)**0.8,y=lerp(s.keel,s.top,1-Math.cos(ang)**1.2);out.push([x,y,z])}return out};
  const ky=t=>{const s=sec(t);return [s.keel,s.top]};
  // the parameter where the hull crosses y (waterline 0, stripe top 0.1)
  const at=(t,y)=>{let lo=0,hi=1;const s=sec(t);for(let i=0;i<24;i++){const m=(lo+hi)/2,yy=lerp(s.keel,s.top,1-Math.cos(m*Math.PI/2)**1.2);yy<y?lo=m:hi=m}return lo};
  const band=(y0,y1,n)=>ts.map(t=>row(t,y0===null?0:at(t,y0),y1===null?1:at(t,y1),n));
  const bot=band(null,-0.02,6),boot=band(-0.02,0.1,1),top=band(0.1,null,5);
  put(S,'paint#2d3138',sheet(bot,true));put(S,'paint#2d3138',sheet(mir(bot),false));
  for(const [nd,hull,stripe] of [['sailHullA','paint#1f3a5f','paint#f2f1ec'],['sailHullB','paint#f2f1ec','paint#1f3a5f']]){
    put(nd,stripe,sheet(boot,true));put(nd,stripe,sheet(mir(boot),false));put(nd,hull,sheet(top,true));put(nd,hull,sheet(mir(top),false));
    // the transom, raked aft
    const s0=sec(0),sh=new T.Shape(),tr=row(0,0,1,8);sh.moveTo(-tr[8][0],tr[8][1]);for(let i=7;i>=0;i--)sh.lineTo(-tr[i][0],tr[i][1]);for(let i=1;i<=8;i++)sh.lineTo(tr[i][0],tr[i][1]);sh.closePath();
    const tg=new T.ShapeGeometry(sh);tg.rotateY(Math.PI);put(nd,hull,tg,[0,0,-L/2-0.001]);
    // a sheer stripe a hand below the toe rail
    for(const sd of [-1,1])tube(nd,stripe,ts.filter(t=>t<0.97).map(t=>{const s=sec(t);return [sd*(s.w*0.997+0.004),s.top-0.09,zt(t)]}),0.012,50,4)}
  // the fin keel and the transom-hung rudder with its tiller
  put(S,'paint#2d3138',side([[1.2,-0.3],[0.2,-0.3],[-0.05,-1.25],[0.75,-1.25]],0.16,0.04),[0,0,0]);
  put(S,'paint#2d3138',side([[0.75,-1.25],[-0.05,-1.25],[0.0,-1.35],[0.7,-1.35]],0.3,0.06),[0,0,0]);
  put(S,'paint#e9e6dc',side([[-3.82,0.75],[-3.95,0.35],[-4.05,-0.6],[-4.3,-0.8],[-4.32,-0.1],[-4.2,0.75]],0.06,0.02),[0,0,0]);
  for(const y of [0.1,-0.4])put(S,'metal#c9ccc8',RB(0.08,0.04,0.14,0.01),[0,y,-3.92]);
  put(S,'lib:planks',RB(0.06,0.06,1.0,0.02),[0,0.83,-3.5],[-0.2,0,0]);put(S,'rubber#1b1c1b',RB(0.07,0.07,0.16,0.02),[0,0.92,-3.06],[-0.2,0,0]);
  // the deck: foredeck to the cabin's after end, side decks and the after deck round the cockpit well
  const deckY=(t,x)=>{const s=sec(t);return s.top+0.035*(1-(x/Math.max(s.w,0.01))**2)};
  const deckRows=(t0,t1,x0,x1,n)=>ts.filter(t=>t>=t0-1e-6&&t<=t1+1e-6).map(t=>{const s=sec(t),w=Math.max(s.w-0.02,0.003),out=[];
    for(let i=0;i<=n;i++){const x=lerp(x0==null?-w:Math.max(-w,x0),x1==null?w:Math.min(w,x1),i/n);out.push([x,deckY(t,x),zt(t)])}return out});
  const tc0=(L/2-3.45)/L,tc1=(L/2-1.1)/L,cw=0.56;
  put(S,'paint#ece8dc',sheet(deckRows(tc1,1,null,null,8),false));
  for(const [x0,x1] of [[null,-cw],[cw,null]])put(S,'paint#ece8dc',sheet(deckRows(tc0,tc1,x0,x1,2),false));
  put(S,'paint#ece8dc',sheet(deckRows(0,tc0,null,null,6),false));
  // non-skid panels on the foredeck and side decks
  put(S,'matte#d8d0bc',RB(0.7,0.006,1.2,0.005),[0,deckY((2.3+L/2)/L,0)+0.003,2.3]);for(const sd of [-1,1])put(S,'matte#d8d0bc',RB(0.16,0.006,2.2,0.005),[sd*0.74,deckY((-0.1+L/2)/L,0.74)+0.004,-0.1]);
  // the cockpit well: sole, footwell sides, the seats with teak slats and cushions, coamings with winches
  const cz=(-3.45-1.1)/2,cl=2.35;put(S,'paint#e5e1d4',RB(2*cw,0.04,cl,0.01),[0,0.12,cz]);put(S,'lib:planks',RB(0.5,0.015,cl-0.2,0.005),[0,0.15,cz]);
  for(const sd of [-1,1]){put(S,'paint#e5e1d4',RB(0.03,0.42,cl,0.01),[sd*0.26,0.33,cz]);put(S,'paint#e5e1d4',RB(0.3,0.03,cl,0.01),[sd*0.41,0.42,cz]);
    for(let k=0;k<5;k++)put(S,'lib:planks',RB(0.05,0.015,cl-0.1,0.005),[sd*(0.3+k*0.055),0.442,cz]);
    put(S,'matte#2a4f7a',RB(0.27,0.06,0.9,0.025),[sd*0.41,0.48,cz+0.55]);
    put(S,'paint#ece8dc',RB(0.05,0.32,cl,0.015),[sd*(cw+0.01),0.6,cz]);put(S,'lib:planks',RB(0.08,0.025,cl,0.01),[sd*(cw+0.01),0.775,cz]);
    put(S,'chrome',CY(0.07,0.08,0.12,20),[sd*(cw+0.01),0.85,-1.6]);put(S,'black',CY(0.06,0.06,0.03,18),[sd*(cw+0.01),0.925,-1.6]);put(S,'chrome',CY(0.015,0.015,0.04,8),[sd*(cw+0.01),0.955,-1.6])}
  put(S,'paint#e5e1d4',RB(2*cw,0.42,0.03,0.01),[0,0.33,-3.45]);
  // the cabin trunk: sloped sides with port lights, a cambered top, handrails, the sliding hatch and washboards
  {const tr=side([[1.5,0.6],[1.62,0.86],[1.5,1.02],[-1.1,1.02],[-1.1,0.6]],1.3,0.06);put(S,'paint#f1efe9',tr,[0,0,0]);
    put(S,'paint#f1efe9',RB(1.22,0.05,2.45,0.02),[0,1.035,0.2]);put(S,'matte#d8d0bc',RB(0.9,0.006,1.6,0.004),[0,1.062,0.45]);
    for(const sd of [-1,1]){for(const pz of [-0.55,0.15,0.85]){put(S,'tint',RB(0.02,0.13,0.42,0.05),[sd*0.655,0.84,pz]);put(S,'metal#c9ccc8',RB(0.012,0.15,0.44,0.055),[sd*0.648,0.84,pz])}
      put(S,'lib:planks',RB(0.04,0.04,1.6,0.015),[sd*0.45,1.11,0.25]);for(const hz of [-0.45,0.25,0.95])put(S,'lib:planks',RB(0.035,0.07,0.05,0.01),[sd*0.45,1.075,hz])}
    for(const sd of [-1,1])put(S,'tint',RB(0.4,0.12,0.02,0.04),[sd*0.3,0.86,1.58],[0,0,0]);
    put(S,'paint#ece8dc',RB(0.62,0.06,0.75,0.02),[0,1.09,-0.72]);put(S,'lib:planks',RB(0.56,0.42,0.03,0.008),[0,0.8,-1.11]);
    for(let k=1;k<4;k++)put(S,'matte#8a6d4a',RB(0.56,0.006,0.032,0.002),[0,0.59+k*0.105,-1.11]);
    put(S,'chrome',RB(0.12,0.02,0.02,0.006),[0,1.13,-1.08]);
    // a dorade vent and the mast step on the cabin top
    put(S,'paint#ece8dc',RB(0.18,0.08,0.24,0.03),[0.35,1.1,1.25]);put(S,'paint#c0392b',CY(0.06,0.07,0.12,14),[0.35,1.2,1.25]);put(S,'paint#c0392b',CY(0.06,0.06,0.08,14),[0.35,1.28,1.29],[Math.PI/2,0,0]);
    put(S,'metal#c9ccc8',RB(0.2,0.04,0.26,0.01),[0,1.08,0.9])}
  // the rig: a tapered spar section, spreaders, the boom with its gooseneck, vang and sail cover, the standing rigging
  {const mz=0.9,mb=1.06,mt=9.5;put(S,'metal#c4c8cb',CY(0.055,0.075,mt-mb,16),[0,(mt+mb)/2,mz],null,[1,1,1.35]);
    put(S,'metal#c4c8cb',RB(0.08,0.06,0.16,0.02),[0,mt+0.02,mz+0.02]);put(S,'lens',new T.SphereGeometry(0.03,10,8),[0,mt+0.08,mz]);
    put(S,'black',CY(0.004,0.004,0.5,4),[0,mt+0.3,mz]);put(S,'black',RB(0.12,0.01,0.02,0.004),[0.05,mt+0.5,mz]);
    const spy=5.3;for(const sd of [-1,1])put(S,'metal#c4c8cb',RB(0.6,0.03,0.05,0.012),[sd*0.31,spy,mz]);
    put(S,'lens',RB(0.06,0.04,0.04,0.012),[0,spy-0.1,mz+0.07]);
    put(S,'metal#c4c8cb',CY(0.04,0.04,3.65,14),[0,1.65,-0.9],[Math.PI/2,0,0],[1,1,1.3]);put(S,'metal#c4c8cb',RB(0.07,0.08,0.12,0.02),[0,1.65,0.86]);
    rod(S,'metal#c4c8cb',[0,1.62,0.3],[0,1.12,0.84],0.016);
    put(S,'steel#3a3d40',RB(0.05,0.05,0.1,0.015),[0,1.6,-2.62]);rod(S,'metal#9aa0a4',[0,1.6,-2.62],[0,0.8,-2.9],0.004,4);
    // shrouds to the chainplates, the forestay to the stem, the backstay to the transom
    for(const sd of [-1,1]){const cp=[sd*0.84,0.72,mz];rod(S,'metal#9aa0a4',cp,[sd*0.6,spy,mz],0.005,5);rod(S,'metal#9aa0a4',[sd*0.6,spy,mz],[0,mt-0.1,mz],0.005,5);
      rod(S,'metal#9aa0a4',[sd*0.83,0.72,mz-0.5],[sd*0.04,spy+0.05,mz],0.005,5);rod(S,'metal#9aa0a4',[sd*0.83,0.72,mz+0.45],[sd*0.04,spy-0.4,mz],0.005,5);
      for(const dz of [-0.5,0,0.45])put(S,'metal#c9ccc8',RB(0.03,0.1,0.05,0.01),[sd*0.85,0.7,mz+dz])}
    rod(S,'metal#9aa0a4',[0,8.3,mz+0.07],[0,0.78,3.82],0.005,5);rod(S,'metal#9aa0a4',[0,mt,mz-0.05],[0,0.68,-3.88],0.005,5);
    // halyards down the mast to the cabin top, the mainsheet tackle
    for(const sd of [-1,1])rod(S,'matte#e8e4da',[sd*0.06,mt-0.15,mz-0.07],[sd*0.12,1.1,mz-0.4],0.004,4);
    put(S,'chrome',CY(0.03,0.03,0.08,12),[0,1.53,-2.3]);rod(S,'matte#e8e4da',[0,1.5,-2.3],[0,0.8,-2.35],0.006,5)}
  // the pulpit, pushpit, stanchions and two lifelines each side, the bow roller and anchor, the navigation lights
  {const ly=[0.3,0.58],st=[-3.2,-2.0,-0.8,0.4,1.6,2.7];
    for(const sd of [-1,1]){const pts=st.map(z=>{const t=(z+L/2)/L,s=sec(t);return [sd*(s.w-0.06),s.top,z]});
      for(const p of pts){rod(S,'metal#c9ccc8',p,[p[0],p[1]+ly[1]+0.04,p[2]],0.012,6);put(S,'metal#c9ccc8',RB(0.05,0.015,0.05,0.005),[p[0],p[1]+0.008,p[2]])}
      for(const h of ly)tube(S,'metal#c9ccc8',pts.map(p=>[p[0],p[1]+h,p[2]]),0.004,24,4);
      // the pushpit's corner and the pulpit's sides
      tube(S,'metal#c9ccc8',[[sd*0.6,0.62,-3.88],[sd*0.68,1.18,-3.7],[sd*0.72,1.2,-3.2]],0.014,10,6);
      tube(S,'metal#c9ccc8',[[sd*0.42,0.78,2.75],[sd*0.33,1.38,3.1],[sd*0.12,1.38,3.62],[sd*0.03,0.8,3.8]],0.014,14,6);
      }
    put(S,'redL',RB(0.05,0.05,0.07,0.015),[-0.36,1.43,3.2]);put(S,'plastic#1f8a3a',RB(0.05,0.05,0.07,0.015),[0.36,1.43,3.2]);
    tube(S,'metal#c9ccc8',[[-0.72,1.2,-3.2],[-0.5,1.24,-3.9],[0.5,1.24,-3.9],[0.72,1.2,-3.2]],0.014,16,6);
    put(S,'metal#c9ccc8',RB(0.12,0.08,0.3,0.02),[0,0.78,3.85]);put(S,'steel#3a3d40',RB(0.04,0.22,0.16,0.02),[0,0.7,4.0],[0.5,0,0]);
    for(const [cx,cz] of [[0.5,2.9],[-0.5,2.9],[0.62,-3.5],[-0.62,-3.5]])put(S,'metal#c9ccc8',RB(0.04,0.03,0.16,0.01),[cx,deckY((cz+L/2)/L,cx)+0.025,cz]);
    // an outboard tilted up on its stern bracket
    put(S,'steel#3a3d40',RB(0.3,0.2,0.06,0.02),[0.42,0.45,-3.93]);put(S,'paint#2a2c2f',RB(0.3,0.34,0.36,0.08),[0.42,0.55,-4.18],[0.9,0,0]);
    put(S,'paint#2a2c2f',RB(0.1,0.55,0.12,0.03),[0.42,0.72,-4.5],[1.2,0,0])}
  // the helmsman on the starboard seat with a hand on the tiller
  person(S,0.4,0.5,-2.62,0.45,'matte#2a4f7a','matte#f2f2ee',[0.06,0.93,-3.0],[0.62,0.8,-2.4],{lean:0.05,vest:'matte#d84a2a'});
  // the sails, bellied to leeward, with seams, battens and the leech line; both faces drawn
  const sail=(nd,pts,dir,camber,seams,battens,mat)=>{const [A,Bp,C]=pts.map(p=>V(...p)),NU=14,NV=10,rows=[];
    // u from the luff (A-B) to the clew C; v up the luff from A to B
    for(let i=0;i<=NV;i++){const v=i/NV,r=[];for(let j=0;j<=NU;j++){const u=j/NU*(1-v*0.999);const p=A.clone().lerp(Bp,v);p.add(C.clone().sub(A).multiplyScalar(u));
        const bel=camber*Math.sin(Math.PI*Math.min(1,u/(1-v*0.999+1e-6)))*(1-v*0.85)*(0.45+0.55*Math.sin(Math.PI*Math.min(1,u/(1-v+1e-6))*0.5+0.5));p.x+=dir*bel;r.push(p.toArray())}rows.push(r)}
    put(nd,mat,sheet(rows,dir>0));put(nd,mat,sheet(rows.map(r=>r.map(([x,y,z])=>[x-dir*0.004,y,z])),dir<=0));
    // seams across the sail, the battens, a bolt rope down the luff
    const pAt=(u,v)=>{const p=A.clone().lerp(Bp,v);p.add(C.clone().sub(A).multiplyScalar(u*(1-v*0.999)));
      p.x+=dir*camber*Math.sin(Math.PI*u)*(1-v*0.85)*(0.45+0.55*Math.sin(Math.PI*u*0.5+0.5));return p};
    for(const v of seams)tube(nd,'matte#c9c4b6',Array.from({length:9},(_,k)=>{const p=pAt(k/8,v);p.x+=dir*0.006;return p.toArray()}),0.004,16,3);
    for(const v of battens)tube(nd,'matte#d0ccc0',Array.from({length:4},(_,k)=>{const p=pAt(0.62+k*0.12,v);p.x+=dir*0.008;return p.toArray()}),0.011,6,5);
    tube(nd,'matte#c9c4b6',Array.from({length:12},(_,k)=>{const p=pAt(0.995,k/11);return p.toArray()}),0.006,22,4)};
  for(const [nd,dir] of [['sailHullA',-1],['sailHullB',1]]){
    sail(nd,[[0,1.75,0.82],[0,9.2,0.82],[0,1.72,-2.65]],dir,0.32,[0.16,0.32,0.48,0.64,0.8],[0.2,0.42,0.63,0.82],'plastic#f4f2ec');
    sail(nd,[[0,0.85,3.72],[0,8.2,0.98],[0,1.0,1.1]],dir,0.26,[0.2,0.4,0.6,0.8],[],'plastic#eeeae0');
    // the jib sheet to its winch
    rod(nd,'matte#e8e4da',[0,1.0,1.1],[dir*0.57,0.95,-1.55],0.005,4)}
}

// =====================================================================================================================
// ---------- the push tug: a steel hull with a heavy rubber fender all round, push knees, the house and an elevated
// wheelhouse, stacks, bitts and face wire winches ----------
{const G='tug',tz=-6.6,RED='paint#9e2a22',WH='paint#eeeeea',DK='paint#2b2b2b';
  // the hull: sides with a soft chine, a raked stern, the deck at 0.75 m with a low bulwark
  const hp=[[-1.4,0.75],[-1.4,-0.1],[-1.32,-0.45],[-1.1,-0.62],[1.1,-0.62],[1.32,-0.45],[1.4,-0.1],[1.4,0.75]];
  {const sh=new T.Shape();hp.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));const g=new T.ExtrudeGeometry(sh,{depth:5.3,bevelEnabled:true,bevelThickness:0.08,bevelSize:0.06,bevelSegments:2});
    g.translate(0,0,-2.65);put(G,RED,BGU.toCreasedNormals(g,0.5),[0,0,tz+0.05])}
  put(G,RED,side([[-2.6,0.75],[-2.6,-0.62],[-2.95,-0.2],[-3.25,0.5],[-3.25,0.75]],2.8,0.06),[0,0,tz]);
  put(G,'paint#2d3138',RB(2.9,0.25,5.5,0.08),[0,-0.5,tz-0.05]);
  // deck, bulwark and cap rail, scuppers
  put(G,'lib:diamond',RB(2.72,0.04,5.75,0.01),[0,0.77,tz-0.33]);
  for(const sd of [-1,1]){put(G,RED,RB(0.06,0.28,5.75,0.02),[sd*1.38,0.91,tz-0.33]);put(G,DK,RB(0.12,0.05,5.8,0.02),[sd*1.38,1.06,tz-0.33]);
    for(let z=-2.6;z<2.4;z+=0.9)put(G,DK,BX(0.07,0.06,0.18),[sd*1.41,0.82,tz+z])}
  put(G,RED,RB(2.8,0.28,0.06,0.02),[0,0.91,tz-3.2]);put(G,DK,RB(2.85,0.05,0.12,0.02),[0,1.06,tz-3.2]);
  // the D-fender round the sheer, tyres hung along the sides, the heavy fenders on the stern
  for(const sd of [-1,1]){tube(G,'rubber#1d1d1d',[[sd*1.47,0.7,tz-3.15],[sd*1.49,0.7,tz-1],[sd*1.49,0.7,tz+1.5],[sd*1.47,0.7,tz+2.7]],0.11,16,10);
    for(const z of [-1.8,-0.6,0.6,1.8]){put(G,'tire',new T.TorusGeometry(0.17,0.075,8,16),[sd*1.56,0.3,tz+z],[0,Math.PI/2,0]);
      tube(G,'steel#3a3d40',[[sd*1.56,0.42,tz+z],[sd*1.5,0.68,tz+z]],0.01,3,4)}}
  tube(G,'rubber#1d1d1d',[[-1.35,0.62,tz-3.3],[0,0.62,tz-3.32],[1.35,0.62,tz-3.3]],0.13,10,10);
  // push knees: tall steel frames at the bow, faced with rubber, the cross beam between them
  for(const sd of [-1,1]){const x=sd*0.9;put(G,RED,side([[3.0,-0.4],[3.0,1.85],[2.75,1.85],[2.15,0.8],[2.15,-0.4]],0.32,0.03),[x,0,tz]);
    put(G,'rubber#1d1d1d',RB(0.34,2.1,0.16,0.04),[x,0.75,tz+3.08]);for(let y=-0.2;y<1.8;y+=0.32)put(G,'rubber#262626',BX(0.36,0.06,0.03),[x,y,tz+3.17]);
    put(G,DK,RB(0.36,0.08,0.4,0.02),[x,1.89,tz+2.85])}
  put(G,RED,RB(1.5,0.3,0.24,0.04),[0,1.45,tz+2.85]);put(G,RED,RB(2.6,0.25,0.3,0.04),[0,0.95,tz+2.75]);
  // face wire winches on the foredeck with wires out to the barge's stern bitts
  for(const sd of [-1,1]){const x=sd*0.85,z=tz+1.5;put(G,'paint#4a5a3a',RB(0.5,0.32,0.42,0.04),[x,0.95,z]);put(G,'steel#3a3d40',CY(0.12,0.12,0.36,16),[x,1.12,z],[0,0,Math.PI/2]);
    for(const s2 of [-1,1])put(G,'paint#4a5a3a',CY(0.17,0.17,0.03,18),[x+s2*0.19,1.12,z],[0,0,Math.PI/2]);
    rod(G,'steel#5a5d60',[x,1.2,z+0.1],[sd*2.25,1.12,-3.0],0.012,5)}
  // H-bitts aft and forward, a towing post
  for(const z of [tz-2.6,tz+0.95])for(const sd of [-1,1]){put(G,DK,CY(0.07,0.07,0.42,14),[sd*0.95,0.98,z]);put(G,DK,CY(0.09,0.09,0.03,14),[sd*0.95,1.2,z])}
  for(const z of [tz-2.6,tz+0.95])put(G,DK,RB(0.18,0.08,0.08,0.02),[0,1.05,z]);
  // the house: engine room casing with doors and portholes, the stair, the raised wheelhouse with its big windows
  {const hx=2.1,hz=tz-0.6;put(G,WH,RB(hx,1.0,2.6,0.05),[0,1.27,hz]);put(G,'paint#d6d6d2',RB(hx+0.06,0.06,2.66,0.02),[0,1.79,hz]);
    for(const sd of [-1,1]){put(G,'paint#d6d6d2',RB(0.03,0.82,0.55,0.03),[sd*(hx/2+0.01),1.2,hz+0.55]);put(G,'chrome',RB(0.03,0.03,0.08,0.01),[sd*(hx/2+0.03),1.22,hz+0.35]);
      for(const pz of [-0.4,-0.9]){put(G,'tint',CY(0.11,0.11,0.02,18),[sd*(hx/2+0.01),1.4,hz+pz],[0,0,Math.PI/2]);put(G,'metal#c9ccc8',new T.TorusGeometry(0.11,0.015,6,18),[sd*(hx/2+0.015),1.4,hz+pz],[0,Math.PI/2,0])}}
    for(const sd of [-1,1])for(const vz of [-0.95,-0.6])put(G,DK,RB(0.04,0.18,0.2,0.01),[sd*(hx/2+0.02),1.6,hz+vz]);
    // the wheelhouse: sloping front, windows all round, a sun visor, the roof with its rail
    const wz=tz-0.2;put(G,WH,side([[0.85,1.8],[0.92,2.35],[0.78,3.12],[-0.82,3.12],[-0.82,1.8]],1.8,0.04),[0,0,wz]);
    put(G,'win#2b3a44',RB(1.62,0.55,0.03,0.02),[0,2.72,wz+0.86],[-0.16,0,0]);for(const sd of [-1,1,0])put(G,WH,RB(0.06,0.6,0.05,0.01),[sd*0.55,2.72,wz+0.875],[-0.16,0,0]);
    put(G,'win#2b3a44',RB(1.5,0.5,0.03,0.02),[0,2.72,wz-0.835]);
    for(const sd of [-1,1]){put(G,'win#2b3a44',RB(0.03,0.5,1.4,0.02),[sd*0.905,2.72,wz]);put(G,WH,RB(0.04,0.55,0.06,0.01),[sd*0.91,2.72,wz+0.15])}
    put(G,DK,RB(2.0,0.08,1.95,0.02),[0,3.16,wz]);put(G,DK,RB(1.95,0.04,0.35,0.01),[0,3.08,wz+1.02],[0.25,0,0]);
    for(const sd of [-1,1]){rod(G,'paint#d6d6d2',[sd*0.95,3.2,wz-0.9],[sd*0.95,3.48,wz-0.9],0.018);rod(G,'paint#d6d6d2',[sd*0.95,3.2,wz+0.9],[sd*0.95,3.48,wz+0.9],0.018);
      rod(G,'paint#d6d6d2',[sd*0.95,3.48,wz-0.9],[sd*0.95,3.48,wz+0.9],0.018)}
    rod(G,'paint#d6d6d2',[-0.95,3.48,wz-0.9],[0.95,3.48,wz-0.9],0.018);
    // wipers on the front glass, a life ring on the side, the stair up the house's side, the searchlight and horn
    for(const sx of [-0.35,0.35])rod(G,'black',[sx,2.48,wz+0.91],[sx+0.12,2.85,wz+0.85],0.006,4);
    put(G,'paint#e8601c',new T.TorusGeometry(0.2,0.055,10,22),[0.94,2.55,wz-0.35],[0,Math.PI/2,0]);
    for(let k=0;k<5;k++)put(G,DK,RB(0.4,0.035,0.18,0.01),[-0.8,0.95+k*0.2,tz-2.05+k*0.18]);rod(G,'paint#d6d6d2',[-1.02,1.0,tz-2.1],[-1.02,1.95,tz-1.2],0.016);
    put(G,DK,CY(0.09,0.11,0.12,16),[0.55,3.27,wz+0.6]);put(G,'black',CY(0.13,0.13,0.2,20),[0.55,3.42,wz+0.66],[Math.PI/2,0,0]);put(G,'lens',CY(0.11,0.11,0.02,20),[0.55,3.42,wz+0.77],[Math.PI/2,0,0]);
    put(G,'metal#c9ccc8',CY(0.03,0.07,0.24,14),[-0.5,3.3,wz+0.5],[Math.PI/2,0,0]);
    // the mast with its range lights, the radar dome, the side lights on their screens
    put(G,DK,CY(0.04,0.05,1.3,12),[0,3.85,wz-0.3]);put(G,DK,RB(0.5,0.04,0.04,0.01),[0,4.2,wz-0.3]);
    for(const y of [4.1,4.5])put(G,'lens',CY(0.035,0.035,0.08,10),[0,y,wz-0.25]);put(G,'redL',CY(0.03,0.03,0.07,10),[0.2,4.24,wz-0.3]);
    put(G,'paint#f2f1ec',CY(0.2,0.2,0.16,20),[-0.45,3.3,wz-0.45]);put(G,'paint#f2f1ec',new T.SphereGeometry(0.2,18,8,0,Math.PI*2,0,Math.PI/2),[-0.45,3.38,wz-0.45],null,[1,0.35,1]);
    for(const sd of [-1,1]){put(G,DK,RB(0.04,0.18,0.28,0.01),[sd*1.0,2.9,wz+0.6]);put(G,sd<0?'redL':'plastic#1f8a3a',RB(0.06,0.08,0.08,0.02),[sd*0.97,2.92,wz+0.68])}}
  // the stacks with their rain caps, aft of the house
  for(const sd of [-1,1]){const x=sd*0.62,z=tz-2.0;put(G,DK,CY(0.13,0.15,1.7,18),[x,1.85,z]);put(G,RED,CY(0.155,0.155,0.22,18),[x,2.35,z]);
    put(G,DK,CY(0.14,0.14,0.04,18),[x,2.72,z]);put(G,'steel#3a3d40',CY(0.12,0.12,0.02,16),[x+0.06,2.8,z],[0,0,-0.6])}
  // the skipper's shape through the glass
  put(G,'matte#2a4f7a',RB(0.36,0.5,0.24,0.08),[0.3,2.4,tz-0.05]);put(G,'matte#c68a62',new T.SphereGeometry(0.1,14,10),[0.3,2.76,tz-0.03]);put(G,'matte#e8b51a',new T.SphereGeometry(0.11,14,8,0,Math.PI*2,0,Math.PI/2),[0.3,2.8,tz-0.03])
}

// =====================================================================================================================
// ---------- the spoil barge: a raked-bow steel deck barge with rub strakes, coamings, corner bitts and a heap of spoil ----------
{const G='barge',bz=3.6,RUST='paint#5d5f5c',CO='paint#7d5a43';
  // the hull: a box with soft bilges, the bow rake rising to the deck; dents pressed into the sides
  {const n=30,m=6,rowsS=[],rowsP=[];
    const sideY=j=>lerp(-0.75,0.85,j/m),zAt=i=>-3.4+i/n*14,dent=(z,y)=>0.07*Math.exp(-(((z-2.1)/0.6)**2+((y-0.1)/0.35)**2))+0.05*Math.exp(-(((z-7.9)/0.45)**2+((y+0.25)/0.3)**2))+0.04*Math.exp(-(((z+1.4)/0.5)**2+((y-0.5)/0.25)**2));
    for(let i=0;i<=n;i++){const z=zAt(i),r=[];for(let j=0;j<=m;j++){const y=sideY(j);r.push([2.7-dent(z,y),y,z])}rowsS.push(r)}
    put(G,RUST,sheet(rowsS,true));
    for(let i=0;i<=n;i++){const z=zAt(i),r=[];for(let j=0;j<=m;j++){const y=sideY(j);r.push([-2.7+dent(z+1.3,y)*0.8,y,z])}rowsP.push(r)}
    put(G,RUST,sheet(rowsP,false));
    put(G,RUST,RB(5.4,0.12,14,0.05),[0,-0.75,bz]);put(G,RUST,RB(5.4,1.6,0.08,0.03),[0,0.05,-3.38]);
    // the rake: a sloped plate from the bottom up to the deck edge at the bow, its side cheeks
    put(G,RUST,side([[10.6,-0.75],[11.6,0.85],[10.6,0.85]],5.4,0.03),[0,0,0])}
  // rub strakes and the deck edge angle, draft marks, the deck plating
  for(const sd of [-1,1]){for(const y of [-0.2,0.4])put(G,'steel#4a4c4b',RB(0.1,0.12,14.1,0.03),[sd*2.73,y,bz]);put(G,'steel#4a4c4b',RB(0.12,0.1,14.2,0.03),[sd*2.73,0.85,bz]);
    for(const z of [-3.2,10.4])for(let k=0;k<4;k++)put(G,'paint#e8e6e0',RB(0.01,0.05,0.12,0.004),[sd*2.705,-0.05-k*0.15,z])}
  put(G,'steel#4a4c4b',RB(5.5,0.1,0.1,0.03),[0,0.85,-3.42]);put(G,'steel#4a4c4b',RB(5.5,0.12,0.12,0.03),[0,0.0,-3.45]);
  put(G,'lib:rustplate',RB(5.35,0.04,14.93,0.01),[0,0.87,4.08]);
  // the coamings along each side and across the ends, stiffened by brackets, a bull rail on top
  for(const sd of [-1,1]){put(G,CO,RB(0.15,0.38,13.6,0.03),[sd*2.6,1.06,bz]);for(let z=-3;z<10.5;z+=1.5)put(G,CO,BX(0.18,0.3,0.06),[sd*2.48,1.02,z]);
    put(G,'steel#4a4c4b',RB(0.22,0.05,13.7,0.015),[sd*2.6,1.26,bz])}
  for(const z of [-3.1,10.3])put(G,CO,RB(5.1,0.3,0.12,0.03),[0,1.02,z]);
  // bitts at the corners and midships, the stern ones taking the tug's face wires
  for(const [x,z] of [[2.25,-3.0],[-2.25,-3.0],[2.25,10.1],[-2.25,10.1],[2.25,3.6],[-2.25,3.6]]){
    for(const dz of [-0.16,0.16]){put(G,'paint#2b2b2b',CY(0.08,0.08,0.38,14),[x,1.08,z+dz]);put(G,'paint#2b2b2b',CY(0.1,0.1,0.03,14),[x,1.28,z+dz])}
    put(G,'paint#2b2b2b',RB(0.26,0.1,0.56,0.02),[x,0.92,z])}
  // the spoil: overlapping dumps from an excavator's bucket heaped along the deck, slumped at their foot, clods rolled
  // down to the coamings
  {const NX=26,NZ=64,X0=-2.38,X1=2.38,Z0=-2.95,Z1=10.05,mounds=[[0.35,-0.9,1.9,1.5],[-0.3,1.0,2.1,1.75],[0.2,3.3,2.0,1.6],[-0.15,5.2,2.2,1.8],[0.4,7.3,1.9,1.55],[-0.2,8.9,1.6,1.3]];
    const nz=(x,z)=>Math.sin(x*1.7+z*0.63+1.3)*0.45+Math.sin(x*3.9-z*2.7)*0.3+Math.sin(z*6.1+x*5.3)*0.15+Math.sin(z*13.3-x*11.1)*0.1;
    // a slumped ridge of spoil at its angle of repose, the peaks where each bucket was dumped, blended smoothly
    const smax=(a,b,k)=>{const h=Math.max(0,Math.min(1,0.5+0.5*(b-a)/k));return a*(1-h)+b*h+k*h*(1-h)};
    const H=(x,z)=>{let h=1.0*Math.pow(Math.max(0,Math.min(1,(2.25-Math.abs(x-0.1*Math.sin(z*0.7)))/1.45)),0.9)*Math.max(0,Math.min(1,(z+2.4)/1.6,(9.6-z)/1.6));
      for(const [mx,mz,r,ht] of mounds){const d=Math.hypot((x-mx)*1.1,z-mz)/r;if(d<1)h=smax(h,ht*Math.pow(1-Math.pow(d,1.5),1.6),0.35)}
      const ex=Math.min(1,(X1-Math.abs(x))/0.3),ez=Math.min(1,(z-Z0)/0.3,(Z1-z)/0.3);return Math.max(0,h+0.12*nz(x,z)*Math.min(1,h*2))*Math.max(0,Math.min(ex,ez))};
    const rows=[];for(let j=0;j<=NZ;j++){const z=lerp(Z0,Z1,j/NZ),r=[];for(let i=0;i<=NX;i++){const x=lerp(X0,X1,i/NX);r.push([x,0.885+H(x,z),z])}rows.push(r)}
    put(G,'matte#6b4a2e',sheet(rows,false));
    let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
    for(let k=0;k<34;k++){const x=lerp(-2.2,2.2,rnd()),z=lerp(-2.7,9.8,rnd()),h=H(x,z);if(h>0.5)continue;
      const g=new T.DodecahedronGeometry(0.1+rnd()*0.18,0);put(G,'matte#5e4129',g,[x,0.9+h*0.9,z],[rnd()*3,rnd()*3,rnd()*3],[1,0.7,1.1])}}
  // a ladder down the side, a lifebuoy on the stern coaming
  for(let k=0;k<5;k++)put(G,'steel#4a4c4b',RB(0.04,0.03,0.4,0.01),[2.77,-0.4+k*0.28,bz-5.5]);for(const dz of [-0.2,0.2])put(G,'steel#4a4c4b',RB(0.04,1.3,0.04,0.01),[2.77,0.2,bz-5.5+dz]);
  put(G,'paint#e8601c',new T.TorusGeometry(0.22,0.06,10,22),[1.2,1.1,-3.22])
}

// ---------- merge: one mesh per material in each node ----------
// small parts share a near enough material, so each boat draws in a dozen or so calls
const A=(o,...pairs)=>{for(let i=0;i<pairs.length;i+=2)for(const k of pairs[i].split(' '))o[k]=pairs[i+1];return o},HULL={};
A(HULL,'matte#c9c4b6 matte#d0ccc0 matte#e8e4da','matte#c9c4b6','plastic#eeeae0','plastic#f4f2ec');
const ALIAS={fish:A({},'matte#4b5a3c matte#4f5a45','matte#5b6b48','matte#8c8f92','seat','matte#b08a5a','matte#d8c49a','metal#b8bcc0 matte#d8d4c8 paint#c9ccc8 lens','chrome',
    'paint#2a2c2f plastic#2a2c2f steel#3a3d40','paint#1d1e20','rubber#1b1c1b rubber#3a342e','rubber#2a2b2d','paint#8b9297 paint#6c7176','paint#a4abb0',
    'plastic#2b5a8a','matte#2b4d6e','plastic#5a6a3a plastic#1f8a3a','matte#3f6e4a','paintR redL','matte#c8562a','matte#3b2e25','black'),
  sail:A({},'matte#8a6d4a','lib:planks','matte#34507a','matte#2a4f7a','matte#3b2e25 paint#2a2c2f steel#3a3d40 rubber#1b1c1b rubber#3a342e','black',
    'matte#f2f2ee matte#d8d0bc matte#e8e4da paint#e5e1d4 paint#e9e6dc paint#f1efe9','paint#ece8dc','metal#9aa0a4 metal#c9ccc8','metal#c4c8cb',
    'paint#c0392b redL','matte#d84a2a','lens','chrome'),
  sailHullA:HULL,sailHullB:HULL,
  tug:A({},'black rubber#262626 rubber#1d1d1d','tire','steel#3a3d40 steel#5a5d60 paint#2d3138 paint#4a5a3a','paint#2b2b2b','chrome lens','metal#c9ccc8',
    'matte#e8b51a','paint#e8601c','paint#d6d6d2 paint#f2f1ec','paint#eeeeea','tint','win#2b3a44'),
  barge:A({},'matte#5e4129','matte#6b4a2e','steel#4a4c4b','paint#2b2b2b')};
for(const [part,ms] of Object.entries(parts)){const al=ALIAS[part]||{},mats={};
  for(const [mat,list] of Object.entries(ms)){const k=al[mat]||mat;(mats[k]=mats[k]||[]).push(...list)}parts[part]=mats}
const root=new T.Group();root.name='lakeboats';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
