// Corley's Island: the detailed dirt bike (Dexter's, js/bike.js), built from shapes and written out as models/bike.glb by
// tools/build_model.js (three.js r147 in headless Chromium). The game loads it (js/models.js, MDL_KIT.bike) in place of the
// kit-built bike when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one. Metres; x is the bike's left
// (the chain and kickstand side), y up, z forward. Each node is in its part group's own frame (js/bike.js):
// - body (bkBody): the bike's frame, origin on the ground midway between the axles; the wheels' centres 0.36 m up at
//   z ±0.74 (a 58 in wheelbase, 28 in tyres); frame, engine, tank, radiators, plastics, seat (its top 1.08 m up round
//   z -0.3, where the game sits the rider), side panels, rear fender, shock, exhaust on the right, footpegs at
//   x ±0.21, 0.43 m up, z -0.03; the head tube round the steering axis through (0, 1.03, 0.52), raked back 0.32 rad;
// - steer (bkSteer): origin on the steering axis at (0, 1.03, 0.52), y up the axis, z forward; it turns about y. Triple
//   clamps (top 0.11, bottom -0.135), the fork's upper tubes at x ±0.105, z 0.025, bars 0.21 up with the grips at
//   x ±0.36, levers, front number plate and front fender (clear of the tyre for 0.19 m of fork travel);
// - fork (bkFork): the same frame at rest, slid up the axis as the fork compresses: the lower tubes, axle lugs, guards
//   and the front brake caliper; the front axle 0.706 below the origin;
// - wf, wr (bkWF, bkWR): the wheels, origin on the axle (x), turned about x as they roll: tyre, rim, spokes, hub and
//   disc (front on the left, rear on the right; the rear sprocket on the left);
// - arm (bkArm): the swingarm, origin on its pivot (0, 0.56, -0.12 in the body), running back along -z to the axle
//   about 0.65 m behind (it swings about x); the chain, slider, guide, axle blocks and rear caliper;
// - stand (bkStand): the kickstand, origin on its pivot (0.12, 0.46, -0.1), its foot down and out at (0.19, -0.42, 0).
// Materials named for the game's (models.js mdlMatOf): plastic#f2b705 (the yellow plastics), rim (bare aluminium:
// frame, swingarm, clamps, hubs), seat, black, tire, chrome, steelL, and colour kinds (metal#…, steel#…, plastic#…,
// rubber#…, paint#…).
// Classic script, no modules.
function buildBike(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),V=(...a)=>new T.Vector3(...a);
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  if(r&&r.isQuaternion)q.copy(r);else{e.set(...(r||[0,0,0]));q.setFromEuler(e)}
  mtx.compose(V(...(p||[0,0,0])),q,V(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.5?2:1,Math.max(1e-4,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4)));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n,open)=>new T.CylinderGeometry(rt,rb,h,n||16,1,!!open);
// a flat panel: an outline in (z, y), w thick across x, centred on x 0, its edges rounded by bev
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// an outline in (x, y) facing forward (+z), d thick
function face(pts,d,bev){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.001,d-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.translate(0,0,-(d-2*b)/2);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n,rs){const c=new T.CatmullRomCurve3(pts.map(p=>V(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,rs||10,false))}
// a round bar from a to b
function rod(part,mat,a,b,r,n,open){const A=V(...a),B=V(...b),d=B.clone().sub(A),L=d.length();
  put(part,mat,CY(r,r,L,n||10,open),A.add(B).multiplyScalar(0.5).toArray(),new T.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()))}
// a curved shell along a path in (z, y): hw half wide across x, bulging by arch at its middle, th thick (fenders, plates)
function shell(part,mat,path,hw,arch,th,nx){const n=path.length,m=nx||8,P=[],H=typeof hw==='function'?hw:()=>hw;
  for(let i=0;i<n;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(n-1,i+1)],dz=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dz,dy),N=[dz/l,-dy/l];// N as (y, z)
    for(const lay of [th/2,-th/2])for(let j=0;j<=m;j++){const u=-1+2*j/m,o=arch*(1-u*u)+lay;P.push([u*H(i/(n-1)),path[i][1]+N[0]*o,path[i][0]+N[1]*o])}}
  const id=(i,l,j)=>(i*2+l)*(m+1)+j,pos=[];
  const Nv=i=>{const a=path[Math.max(0,i-1)],b=path[Math.min(n-1,i+1)],dz=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dz,dy);return [V(0,dz/l,-dy/l),V(0,dy/l,dz/l)]};
  // each quad turned to face the way it should (want): up or down off the shell, out at its sides and ends
  const quad=(a,b,c,d,want)=>{for(const t of [[a,b,c],[c,b,d]]){const [A,B,C]=t.map(k=>V(...P[k]));if(B.clone().sub(A).cross(C.clone().sub(A)).dot(want)<0)t.reverse();for(const k of t)pos.push(...P[k])}};
  for(let i=0;i<n-1;i++){const [N]=Nv(i);for(let j=0;j<m;j++){quad(id(i,0,j),id(i+1,0,j),id(i,0,j+1),id(i+1,0,j+1),N);quad(id(i,1,j),id(i,1,j+1),id(i+1,1,j),id(i+1,1,j+1),N.clone().negate())}
    quad(id(i,1,0),id(i+1,1,0),id(i,0,0),id(i+1,0,0),V(-1,0,0));quad(id(i,0,m),id(i+1,0,m),id(i,1,m),id(i+1,1,m),V(1,0,0))}
  for(let j=0;j<m;j++){quad(id(0,1,j),id(0,0,j),id(0,1,j+1),id(0,0,j+1),Nv(0)[1].clone().negate());quad(id(n-1,0,j),id(n-1,1,j),id(n-1,0,j+1),id(n-1,1,j+1),Nv(n-1)[1])}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
  put(part,mat,BGU.toCreasedNormals(g,0.7))}
const lathe=(pts,seg)=>{const g=new T.LatheGeometry(pts.map(([r,x])=>new T.Vector2(r,x)),seg||40);g.rotateZ(Math.PI/2);return g};
const YEL='plastic#f2b705',WHT='plastic#f4f3ef',BLK='plastic#1b1c1e',ALU='rim',ANO='metal#1d1e21',CAST='steel#a2a5a9',DARK='steel#2f3135';
const BO='body',ST='steer',FK='fork',AR='arm',SD='stand';
const WB=0.74,WR=0.36,RAKE=0.32;

// ---------- the wheels: knobby tyres, black rims laced with spokes, hubs, wavy discs; the rear sprocket ----------
function wheel(part,o){const {bead,w,disc,dr,hubW}=o;
  // tyre: carcass, sidewalls rolling into the bead, and the knobs
  put(part,'tire',lathe([[bead,-w*0.42],[bead+0.012,-w*0.48],[bead+0.04,-w*0.52],[WR-0.04,-w*0.5],[WR-0.016,-w*0.4],[WR-0.008,-w*0.2],[WR-0.007,0],
    [WR-0.008,w*0.2],[WR-0.016,w*0.4],[WR-0.04,w*0.5],[bead+0.04,w*0.52],[bead+0.012,w*0.48],[bead,w*0.42]],40));
  const nk=o.knobs;for(let k=0;k<nk;k++){const a=k/nk*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),r=WR-0.004;
    const at=(x,rr,ry,rz,bw,bh,bd)=>put(part,'tire',BX(bw,bh,bd),[x,sa*rr,ca*rr],[a,ry||0,rz||0]);
    if(k%2){at(0,r,0,0,w*0.32,0.016,0.024)}else{for(const s of [-1,1])at(s*w*0.24,r-0.002,0,0,w*0.22,0.015,0.022)}
    // shoulder knobs leaning out over the sidewall
    for(const s of [-1,1]){const x=s*w*0.47,rr=WR-0.024;put(part,'tire',BX(0.016,w*0.22,0.022),[x,sa*rr,ca*rr],[a+(k%2?0.06:-0.06),0,0])}}
  // rim: a channel with flanges and a bead seat; rim lock
  put(part,ANO,lathe([[bead+0.004,-w*0.36],[bead-0.006,-w*0.37],[bead-0.016,-w*0.3],[bead-0.02,-w*0.12],[bead-0.02,w*0.12],[bead-0.016,w*0.3],[bead-0.006,w*0.37],[bead+0.004,w*0.36],
    [bead+0.002,w*0.3],[bead-0.006,w*0.26],[bead-0.008,0],[bead-0.006,-w*0.26],[bead+0.002,-w*0.3],[bead+0.004,-w*0.36]],36));
  put(part,ANO,RB(0.03,0.03,0.04,0.006),[0,bead-0.03,0]);
  // hub with its flanges, the axle through it
  put(part,ALU,CY(0.034,0.034,hubW*0.8,24),[0,0,0],[0,0,Math.PI/2]);
  for(const s of [-1,1]){put(part,ALU,CY(0.056,0.056,0.006,28),[s*hubW/2,0,0],[0,0,Math.PI/2]);put(part,ALU,CY(0.044,0.05,0.02,24),[s*(hubW/2-0.013),0,0],[0,0,Math.PI/2])}
  put(part,'steelL',CY(0.011,0.011,hubW+0.18,12),[0,0,0],[0,0,Math.PI/2]);for(const s of [-1,1])put(part,'steelL',CY(0.017,0.017,0.014,6),[s*(hubW/2+0.085),0,0],[0,0,Math.PI/2]);
  // 36 spokes, two crossings, each from a hub flange to a nipple in the rim
  for(let k=0;k<36;k++){const s=k%2?1:-1,a0=Math.floor(k/2)/18*Math.PI*2+(s>0?Math.PI/18:0),dir=(Math.floor(k/2)%2?1:-1),a1=a0+dir*0.62,rh=0.05,rr=bead-0.024;
    const A=[s*hubW/2,Math.sin(a0)*rh,Math.cos(a0)*rh],Bp=[s*0.009,Math.sin(a1)*rr,Math.cos(a1)*rr];rod(part,'chrome',A,Bp,0.0021,4,true);
    rod(part,'steelL',[s*0.009,Math.sin(a1)*(rr+0.004),Math.cos(a1)*(rr+0.004)],[s*0.009,Math.sin(a1)*(rr+0.016),Math.cos(a1)*(rr+0.016)],0.0035,4,true)}
  // the brake disc: a wavy rim with holes, on a carrier bolted to the hub
  {const x=o.dside*(hubW/2+0.012),sh=new T.Shape(),N=24;
    for(let i=0;i<=N*4;i++){const a=i/(N*4)*Math.PI*2,r=dr*(1-0.035*(0.5+0.5*Math.cos(a*N)));i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
    const hole=(cx,cy,r)=>{const h=new T.Path();h.absarc(cx,cy,r,0,Math.PI*2,true);sh.holes.push(h)};hole(0,0,dr-0.032);
    const g=new T.ExtrudeGeometry(sh,{depth:0.004,bevelEnabled:false,curveSegments:8});g.rotateY(Math.PI/2);put(part,'steelL',g,[x-0.002,0,0]);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;put(part,'steelL',CY(0.0055,0.0055,0.0045,8),[x,Math.sin(a)*(dr-0.017),Math.cos(a)*(dr-0.017)],[0,0,Math.PI/2])}
    // carrier and its bolts
    const cr=new T.Shape();cr.absarc(0,0,dr-0.028,0,Math.PI*2,false);const ch=new T.Path();ch.absarc(0,0,0.03,0,Math.PI*2,true);cr.holes.push(ch);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.26,hp=new T.Path();hp.absarc(Math.cos(a)*(dr-0.06),Math.sin(a)*(dr-0.06),dr*0.13,0,Math.PI*2,true);cr.holes.push(hp)}
    const cg=new T.ExtrudeGeometry(cr,{depth:0.003,bevelEnabled:false,curveSegments:10});cg.rotateY(Math.PI/2);put(part,ALU,cg,[x-o.dside*0.003,0,0]);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;put(part,'steelL',CY(0.0055,0.0055,0.008,6),[x,Math.sin(a)*0.045,Math.cos(a)*0.045],[0,0,Math.PI/2])}}
  if(o.sprocket){const sh=new T.Shape(),N=50,R=0.112;
    for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=a0+Math.PI/N*0.45,a2=a0+Math.PI/N,a3=a0+Math.PI/N*1.55;
      const pt=(a,r)=>[Math.cos(a)*r,Math.sin(a)*r];const p=[pt(a0,R-0.007),pt(a1,R+0.006),pt(a2,R+0.007),pt(a3,R+0.006)];
      p.forEach(([x,y],k)=>i||k?sh.lineTo(x,y):sh.moveTo(x,y))}
    const h0=new T.Path();h0.absarc(0,0,0.04,0,Math.PI*2,true);sh.holes.push(h0);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2,hp=new T.Path();hp.absellipse(Math.cos(a)*0.074,Math.sin(a)*0.074,0.021,0.013,0,Math.PI*2,true,a);sh.holes.push(hp)}
    const g=new T.ExtrudeGeometry(sh,{depth:0.005,bevelEnabled:false,curveSegments:8});g.rotateY(Math.PI/2);put(part,'metal#a9adb2',g,[hubW/2+0.016,0,0]);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.5;put(part,'steelL',CY(0.006,0.006,0.012,6),[hubW/2+0.018,Math.sin(a)*0.048,Math.cos(a)*0.048],[0,0,Math.PI/2])}}}
wheel('wf',{bead:0.267,w:0.084,knobs:40,disc:true,dr:0.13,dside:1,hubW:0.1});
wheel('wr',{bead:0.242,w:0.112,knobs:36,disc:true,dr:0.12,dside:-1,hubW:0.13,sprocket:true});

// ---------- the frame: twin aluminium spars from the head tube to the swingarm pivot, cradle rails, subframe ----------
put(BO,ALU,CY(0.033,0.033,0.22,24),[0,1.04,0.517],[-RAKE,0,0]);
for(const s of [-1,1]){
  put(BO,ALU,side([[0.5,1.11],[0.4,1.065],[0.2,0.975],[0.02,0.885],[-0.08,0.805],[-0.13,0.74],[-0.17,0.69],[-0.195,0.6],[-0.19,0.48],[-0.15,0.42],[-0.08,0.42],[-0.055,0.5],
    [-0.05,0.62],[0.0,0.71],[0.17,0.835],[0.35,0.93],[0.46,0.975],[0.53,1.0]],0.034,0.008),[s*0.092,0,0],[0,-s*0.085,0]);
  // the pivot boss
  put(BO,ALU,CY(0.034,0.034,0.03,20),[s*0.118,0.56,-0.12],[0,0,Math.PI/2]);put(BO,'steelL',CY(0.016,0.016,0.02,6),[s*0.14,0.56,-0.12],[0,0,Math.PI/2]);
  // the cradle: down from the head tube in front of the engine, under it and back up to the pivot plates
  tube(BO,ALU,[[s*0.02,0.95,0.54],[s*0.035,0.72,0.47],[s*0.05,0.48,0.38],[s*0.06,0.3,0.27],[s*0.065,0.25,0.12],[s*0.068,0.26,-0.05],[s*0.075,0.32,-0.12],[s*0.08,0.43,-0.12]],0.016,40,12);
  // the subframe under the seat
  tube(BO,ALU,[[s*0.08,0.86,-0.06],[s*0.078,0.9,-0.4],[s*0.07,0.94,-0.78]],0.012,24,10);
  tube(BO,ALU,[[s*0.1,0.66,-0.17],[s*0.085,0.78,-0.45],[s*0.072,0.92,-0.76]],0.011,24,10)}
for(const z of [-0.2,-0.6])rod(BO,ALU,[-0.08,z<-0.3?0.93:0.885,z],[0.08,z<-0.3?0.93:0.885,z],0.01,10);
put(BO,ALU,RB(0.1,0.03,0.05,0.01),[0,1.02,0.47]);
// engine mounts: plates bolting the engine into the cradle and the frame
for(const s of [-1,1]){put(BO,ALU,RB(0.012,0.07,0.05,0.004),[s*0.095,0.84,0.3]);put(BO,'steelL',CY(0.007,0.007,0.22,8),[0,0.84,0.3],[0,0,Math.PI/2])}

// ---------- the engine: crankcases, clutch and ignition covers, cylinder, head and cam cover, intake ----------
put(BO,CAST,side([[0.22,0.43],[0.19,0.32],[0.1,0.265],[-0.04,0.27],[-0.12,0.32],[-0.15,0.42],[-0.13,0.52],[-0.06,0.58],[0.06,0.6],[0.16,0.57],[0.21,0.51]],0.2,0.018));
put(BO,CAST,lathe([[0.0,-0.022],[0.095,-0.022],[0.104,-0.012],[0.104,0.008],[0.09,0.022],[0.0,0.022]],36),[-0.115,0.42,0.06]);
put(BO,'metal#b0b4b8',CY(0.04,0.04,0.012,24),[-0.14,0.43,0.07],[0,0,Math.PI/2]);
for(let i=0;i<9;i++){const a=i/9*Math.PI*2;put(BO,'steelL',CY(0.0045,0.0045,0.01,6),[-0.138,0.42+Math.sin(a)*0.092,0.06+Math.cos(a)*0.092],[0,0,Math.PI/2])}
put(BO,CAST,lathe([[0.0,-0.02],[0.08,-0.02],[0.088,-0.008],[0.085,0.012],[0.07,0.02],[0.0,0.02]],32),[0.112,0.43,-0.02]);
put(BO,DARK,RB(0.05,0.06,0.07,0.012),[-0.105,0.33,0.16]);put(BO,CAST,CY(0.03,0.03,0.025,16),[-0.12,0.33,0.17],[0,0,Math.PI/2]);
// the cylinder leans forward a little; water-cooled, ribbed head, the cam cover on top
{const tilt=-0.18,at=(y)=>[0,0.58+y*Math.cos(tilt),0.12-y*Math.sin(tilt)];
  put(BO,CAST,RB(0.15,0.16,0.13,0.02),at(0.08),[-tilt,0,0]);
  for(let i=0;i<4;i++)put(BO,CAST,BX(0.158,0.006,0.138),at(0.03+i*0.035),[-tilt,0,0]);
  put(BO,DARK,RB(0.17,0.08,0.15,0.02),at(0.2),[-tilt,0,0]);for(let i=0;i<5;i++)put(BO,DARK,BX(0.004,0.02,0.13),[-0.06+i*0.03,...at(0.25).slice(1)],[-tilt,0,0]);
  put(BO,'plastic#26282b',RB(0.15,0.04,0.12,0.018),at(0.26),[-tilt,0,0]);
  for(const s of [-1,1])for(const dz of [-0.04,0.04]){const p=at(0.285);put(BO,'steelL',CY(0.006,0.006,0.012,6),[s*0.06,p[1],p[2]+dz])}}
// the intake: throttle body and boot back to the airbox, the starter
put(BO,BLK,CY(0.033,0.03,0.12,16),[0,0.8,-0.04],[Math.PI/2+0.4,0,0]);put(BO,'metal#a9adb2',RB(0.07,0.06,0.06,0.012),[0,0.78,0.02]);
put(BO,DARK,CY(0.026,0.026,0.1,14),[0.06,0.62,-0.06],[0,0,Math.PI/2]);
// the skid plate under it all
put(BO,BLK,side([[0.27,0.33],[0.24,0.255],[0.12,0.225],[-0.12,0.24],[-0.16,0.28],[-0.13,0.29],[0.0,0.255],[0.2,0.275],[0.24,0.34]],0.16,0.008));
// radiators either side of the cradle, with their hoses to the head and the pump
for(const s of [-1,1]){const rx=s*0.13;
  put(BO,DARK,RB(0.05,0.3,0.15,0.01),[rx,0.77,0.36],[0.18,s*0.12,0]);
  for(let i=0;i<10;i++)put(BO,'steel#56595d',BX(0.052,0.004,0.142),[rx+s*0.001,0.64+i*0.028,0.355+0.028*(i-5)*0.18],[0.18,s*0.12,0]);
  put(BO,ALU,RB(0.05,0.022,0.16,0.006),[rx,0.935,0.39],[0.18,s*0.12,0]);
  tube(BO,'rubber#1d1e20',[[s*0.12,0.62,0.33],[s*0.08,0.58,0.26],[s*0.02,0.6,0.2]],0.012,16,8);
  tube(BO,'rubber#1d1e20',[[s*0.12,0.92,0.38],[s*0.07,0.89,0.3],[s*0.03,0.86,0.22]],0.012,16,8)}
put(BO,'steelL',CY(0.016,0.016,0.02,12),[0.13,0.96,0.42],[0.18,0,0]);

// ---------- tank, shrouds, seat, side panels, airbox and rear fender ----------
put(BO,'plastic#cfc5aa',side([[0.43,1.025],[0.41,0.9],[0.25,0.86],[0.08,0.85],[-0.07,0.87],[-0.08,1.0],[0.1,1.06],[0.32,1.065]],0.21,0.04));
put(BO,'plastic#26282b',CY(0.03,0.03,0.025,20),[0,1.075,0.3],[-0.1,0,0]);
for(const s of [-1,1]){
  put(BO,YEL,side([[0.48,1.02],[0.46,0.82],[0.39,0.63],[0.28,0.57],[0.15,0.64],[0.04,0.8],[-0.06,0.92],[-0.13,1.0],[-0.12,1.065],[0.1,1.075],[0.32,1.07],[0.44,1.05]],0.014,0.005),[s*0.172,0,0],[0,s*0.12,0]);
  // the louvred vent in each shroud: a dark insert and its slats
  put(BO,BLK,side([[0.43,0.95],[0.41,0.75],[0.34,0.66],[0.27,0.68],[0.29,0.9],[0.35,0.97]],0.006,0.002),[s*(0.172+0.12*0.35+0.007),0,0.0],[0,s*0.12,0]);
  for(let i=0;i<6;i++){const z=0.39-i*0.018,y=0.7+i*0.042;put(BO,YEL,BX(0.006,0.008,0.1),[s*(0.172+0.12*z+0.011),y,z],[0.5,s*0.12,0])}
  // side panels, a white number field on each
  put(BO,YEL,side([[-0.1,0.99],[-0.13,0.86],[-0.24,0.74],[-0.36,0.74],[-0.62,0.87],[-0.68,0.99]],0.014,0.005),[s*0.142,0,0],[0,s*0.05,0]);
  put(BO,WHT,side([[-0.2,0.96],[-0.24,0.83],[-0.34,0.79],[-0.56,0.88],[-0.6,0.96]],0.006,0.002),[s*0.151,0,0],[0,s*0.05,0])}
put(BO,'seat',side([[0.3,1.07],[0.18,1.085],[-0.05,1.085],[-0.4,1.082],[-0.74,1.078],[-0.86,1.06],[-0.88,1.03],[-0.7,1.0],[-0.3,0.995],[0.05,1.0],[0.2,1.02],[0.32,1.045]],0.25,0.04));
for(let i=0;i<12;i++)put(BO,'black',BX(0.21,0.004,0.008),[0,1.087,0.12-i*0.07]);
put(BO,BLK,RB(0.2,0.04,0.95,0.012),[0,1.0,-0.33]);
put(BO,'plastic#1f2022',RB(0.2,0.18,0.34,0.03),[0,0.88,-0.38]);
shell(BO,YEL,[[-0.5,0.985],[-0.62,0.99],[-0.78,1.02],[-0.92,1.06],[-1.04,1.1],[-1.12,1.125]],t=>0.11-0.035*t,0.014,0.008,8);
put(BO,'redL',RB(0.06,0.02,0.012,0.004),[0,1.05,-0.9],[0.3,0,0]);
// the rear brake master cylinder behind the right peg, its reservoir
put(BO,DARK,CY(0.012,0.012,0.08,10),[-0.1,0.5,-0.08],[0.6,0,0]);put(BO,'plastic#e9e3d2',CY(0.016,0.016,0.04,12),[-0.12,0.66,-0.15]);

// ---------- the shock: body, piggyback reservoir, spring, its mounts ----------
{const top=V(0,0.905,-0.16),bot=V(0,0.5,-0.26),d=bot.clone().sub(top),L=d.length(),qq=new T.Quaternion().setFromUnitVectors(V(0,-1,0),d.clone().normalize()),
    at=k=>top.clone().addScaledVector(d,k).toArray();
  put(BO,ALU,CY(0.026,0.026,L*0.55,18),at(0.3),qq);put(BO,'chrome',CY(0.008,0.008,L*0.6,10),at(0.72),qq);put(BO,ALU,CY(0.022,0.022,0.04,16),at(0.95),qq);
  put(BO,ALU,CY(0.022,0.022,0.13,16),[-0.045,0.86,-0.24],[0.4,0,0]);rod(BO,ALU,[-0.03,0.88,-0.2],[0,0.88,-0.19],0.01,8);
  const pts=[];for(let i=0;i<=72;i++){const t=i/72,a=t*Math.PI*2*8;const p=top.clone().addScaledVector(d,0.12+0.66*t);const r=V(Math.cos(a)*0.04,0,Math.sin(a)*0.04).applyQuaternion(qq);pts.push(p.add(r).toArray())}
  tube(BO,'paint#e2a81f',pts,0.0075,144,5);
  for(const k of [0.11,0.79])put(BO,ALU,CY(0.046,0.046,0.012,20),at(k),qq);
  put(BO,ALU,CY(0.022,0.022,0.06,12),top.toArray(),[0,0,Math.PI/2])}

// ---------- the exhaust: header wrapping round the right of the cylinder, mid pipe, silencer ----------
tube(BO,'metal#a68d6c',[[-0.01,0.83,0.245],[-0.06,0.79,0.33],[-0.13,0.68,0.33],[-0.16,0.58,0.24],[-0.165,0.56,0.08],[-0.165,0.6,-0.1],[-0.16,0.7,-0.27],[-0.158,0.76,-0.39]],0.021,44,12);
put(BO,'metal#7d6750',CY(0.026,0.026,0.04,16),[-0.158,0.765,-0.4],[Math.PI/2-0.22,0,0]);
{const a=Math.PI/2-0.22;put(BO,ALU,CY(0.056,0.056,0.42,28),[-0.16,0.815,-0.62],[a,0,0]);
  put(BO,'black',CY(0.058,0.05,0.06,28),[-0.16,0.865,-0.845],[a,0,0]);put(BO,'black',CY(0.058,0.058,0.03,28),[-0.16,0.768,-0.405],[a,0,0]);
  put(BO,'metal#8e9296',CY(0.018,0.018,0.05,14),[-0.16,0.875,-0.885],[a,0,0]);
  for(const k of [0.25,0.75])put(BO,'black',CY(0.06,0.06,0.012,28),[-0.16,0.77+0.09*k,-0.41-0.42*k],[a,0,0]);
  rod(BO,ALU,[-0.11,0.86,-0.6],[-0.15,0.83,-0.6],0.008,8)}

// ---------- footpegs, brake pedal, gear lever, sprocket cover ----------
for(const s of [-1,1]){put(BO,'steelL',RB(0.1,0.022,0.055,0.005),[s*0.21,0.43,-0.03]);
  for(let i=0;i<4;i++)for(const dz of [-0.022,0.022])put(BO,'steelL',BX(0.006,0.014,0.006),[s*(0.17+i*0.025),0.446,-0.03+dz]);
  put(BO,ALU,RB(0.06,0.04,0.06,0.01),[s*0.13,0.43,-0.05])}
tube(BO,'steelL',[[-0.12,0.44,-0.07],[-0.15,0.42,0.03],[-0.18,0.435,0.13]],0.009,12,8);put(BO,'steelL',RB(0.04,0.012,0.05,0.004),[-0.19,0.445,0.15]);
tube(BO,'steelL',[[0.12,0.52,0.02],[0.15,0.49,0.08],[0.18,0.48,0.13]],0.008,12,8);put(BO,'steelL',CY(0.008,0.008,0.05,8),[0.2,0.48,0.14],[0,0,Math.PI/2]);
put(BO,BLK,RB(0.02,0.1,0.11,0.015),[0.105,0.48,-0.07]);

// ---------- steering: clamps, the fork's upper tubes, bars, levers, plate and front fender ----------
{const fx=0.105,fz=0.025;
  for(const [y,h] of [[0.11,0.026],[-0.135,0.042]]){put(ST,ALU,RB(0.3,h,0.08,0.012),[0,y,fz-0.005]);put(ST,ALU,RB(0.07,h,0.11,0.02),[0,y,-0.01]);
    for(const s of [-1,1])put(ST,ALU,CY(0.04,0.04,h+0.004,24),[s*fx,y,fz])}
  put(ST,'steelL',CY(0.018,0.018,0.02,6),[0,0.13,0]);
  for(const s of [-1,1]){put(ST,ANO,CY(0.03,0.03,0.5,24),[s*fx,-0.115,fz]);put(ST,ALU,CY(0.026,0.026,0.03,16),[s*fx,0.15,fz]);
    put(ST,ANO,CY(0.032,0.032,0.03,24),[s*fx,-0.35,fz])}
  // bar mounts, the tapered bar, its pad, grips, the levers and the master cylinder, the throttle
  for(const s of [-1,1]){put(ST,ALU,CY(0.018,0.02,0.07,14),[s*0.06,0.155,-0.01]);put(ST,ALU,RB(0.045,0.04,0.05,0.01),[s*0.06,0.205,-0.02])}
  const bar=[[-0.41,0.265,-0.075],[-0.33,0.255,-0.06],[-0.2,0.225,-0.035],[-0.1,0.21,-0.022],[0,0.208,-0.02],[0.1,0.21,-0.022],[0.2,0.225,-0.035],[0.33,0.255,-0.06],[0.41,0.265,-0.075]];
  tube(ST,'metal#2a2c30',bar,0.0125,40,10);tube(ST,'metal#2a2c30',bar.slice(2,7),0.016,20,10);
  put(ST,YEL,RB(0.15,0.04,0.045,0.016),[0,0.232,-0.02]);
  for(const s of [-1,1]){put(ST,'rubber#2a2b2e',CY(0.017,0.017,0.115,16),[s*0.37,0.261,-0.068],[0,0.12*s,Math.PI/2-s*0.08]);
    put(ST,'black',CY(0.019,0.019,0.012,14),[s*0.43,0.268,-0.078],[0,0.12*s,Math.PI/2]);
    put(ST,DARK,RB(0.04,0.03,0.035,0.008),[s*0.27,0.25,-0.05]);
    tube(ST,ALU,[[s*0.27,0.25,-0.035],[s*0.31,0.245,0.02],[s*0.38,0.25,0.035],[s*0.41,0.255,0.03]],0.006,14,8)}
  put(ST,'plastic#e9e3d2',RB(0.045,0.035,0.04,0.008),[-0.25,0.282,-0.06]);put(ST,'black',RB(0.05,0.035,0.045,0.01),[-0.31,0.26,-0.06]);
  put(ST,'black',RB(0.04,0.03,0.03,0.008),[0.22,0.255,-0.05]);
  // the clutch cable and brake line looping down in front
  tube(ST,'rubber#1b1c1d',[[0.27,0.25,-0.03],[0.24,0.2,0.08],[0.12,0.05,0.12],[0.11,-0.1,0.09]],0.0045,24,6);
  tube(ST,'rubber#1b1c1d',[[-0.27,0.27,-0.05],[-0.22,0.22,0.06],[-0.04,0.1,0.13],[0.06,-0.08,0.09],[0.1,-0.2,0.07]],0.004,24,6);
  // the front number plate, a white field on it
  put(ST,YEL,face([[-0.13,0.12],[0.13,0.12],[0.15,0.05],[0.12,-0.13],[0.04,-0.17],[-0.04,-0.17],[-0.12,-0.13],[-0.15,0.05]],0.012,0.004),[0,0.0,0.125],[0.17,0,0]);
  put(ST,WHT,face([[-0.1,0.09],[0.1,0.09],[0.11,0.03],[0.09,-0.08],[-0.09,-0.08],[-0.11,0.03]],0.004,0.001),[0,0.0,0.133],[0.17,0,0]);
  // the front fender under the bottom clamp, long and thin, clear of the tyre
  shell(ST,YEL,[[-0.25,-0.255],[-0.15,-0.205],[-0.04,-0.18],[0.06,-0.172],[0.16,-0.182],[0.26,-0.215],[0.34,-0.265],[0.4,-0.32],[0.43,-0.36]],t=>0.06+0.03*Math.sin(Math.PI*Math.min(1,t*1.4)),0.014,0.007,8);
  put(ST,ALU,RB(0.07,0.02,0.08,0.006),[0,-0.162,0.02])}

// ---------- the fork's lower legs: coated tubes, guards, axle lugs, the front caliper (they slide with the wheel) ----------
{const fx=0.105,fz=0.025,ay=-0.706;
  for(const s of [-1,1]){put(FK,'metal#c7a23f',CY(0.0235,0.0235,0.36,22),[s*fx,-0.47,fz]);
    put(FK,ALU,RB(0.05,0.13,0.07,0.014),[s*fx,ay+0.03,0.012]);put(FK,'steelL',CY(0.006,0.006,0.012,6),[s*(fx+0.026),ay+0.06,0.035],[0,0,Math.PI/2]);
    // the guard: a curved shield round the front of each tube
    const sh=new T.Shape(),A0=-1.9,A1=1.9;for(let i=0;i<=16;i++){const a=A0+(A1-A0)*i/16;const p=[Math.sin(a)*0.034,Math.cos(a)*0.034];i?sh.lineTo(...p):sh.moveTo(...p)}
    for(let i=16;i>=0;i--){const a=A0+(A1-A0)*i/16;sh.lineTo(Math.sin(a)*0.029,Math.cos(a)*0.029)}
    const g=new T.ExtrudeGeometry(sh,{depth:0.25,bevelEnabled:false});g.rotateX(Math.PI/2);put(FK,BLK,g,[s*fx,-0.36,fz]);
    put(FK,BLK,RB(0.02,0.04,0.02,0.006),[s*(fx+0.03),-0.45,fz-0.02])}
  // the caliper on the left lug, gripping the disc behind the axle
  put(FK,DARK,RB(0.05,0.075,0.05,0.012),[0.075,ay+0.045,-0.11],[0.35,0,0]);put(FK,ALU,RB(0.035,0.12,0.04,0.01),[0.09,ay+0.03,-0.05],[0.7,0,0]);
  tube(FK,'rubber#1b1c1d',[[0.08,ay+0.09,-0.12],[0.1,ay+0.2,-0.04],[0.11,-0.28,0.05],[0.1,-0.2,0.07]],0.004,20,6)}

// ---------- the swingarm: tapered box legs, pivot, cross member, chain slider and guide, axle blocks, rear caliper ----------
{const ax=-0.651;
  for(const s of [-1,1]){put(AR,ALU,side([[0.035,0.034],[-0.12,0.042],[-0.4,0.034],[-0.62,0.028],[-0.69,0.026],[-0.69,-0.026],[-0.62,-0.028],[-0.4,-0.034],[-0.12,-0.05],[0.035,-0.036]],0.034,0.008),[s*0.108,0,0]);
    put(AR,ALU,RB(0.04,0.06,0.07,0.01),[s*0.108,0.0,ax+0.005]);put(AR,'steelL',RB(0.012,0.02,0.02,0.003),[s*0.127,0.0,ax-0.03]);
    rod(AR,'steelL',[s*0.127,0,ax-0.03],[s*0.127,0,ax-0.075],0.004,6)}
  put(AR,ALU,CY(0.03,0.03,0.25,20),[0,0,0],[0,0,Math.PI/2]);
  put(AR,ALU,side([[-0.13,0.03],[-0.2,0.035],[-0.24,0.0],[-0.2,-0.04],[-0.13,-0.045]],0.19,0.01));
  // the linkage under the pivot and its pull rod
  put(AR,ALU,RB(0.06,0.05,0.12,0.012),[0,-0.07,-0.12]);rod(AR,ALU,[0,-0.08,-0.06],[0,-0.12,0.08],0.012,10);
  // chain slider over the left leg, the guide below it, the rear caliper hanging off the right leg
  put(AR,BLK,side([[0.06,0.045],[-0.22,0.05],[-0.25,0.03],[-0.22,-0.05],[0.06,-0.045],[0.07,0.0]],0.02,0.006),[0.088,0,0]);
  put(AR,BLK,side([[-0.4,-0.035],[-0.52,-0.035],[-0.55,-0.08],[-0.52,-0.13],[-0.42,-0.12],[-0.39,-0.07]],0.035,0.006),[0.075,0,0]);
  put(AR,DARK,RB(0.04,0.05,0.07,0.012),[-0.072,-0.085,ax+0.08],[0.6,0,0]);put(AR,ALU,RB(0.012,0.06,0.12,0.008),[-0.095,-0.03,ax+0.04]);
  tube(AR,'rubber#1b1c1d',[[-0.09,-0.06,ax+0.12],[-0.11,-0.02,-0.4],[-0.11,0.0,-0.15],[-0.1,-0.04,0.02]],0.004,20,6);
  // the chain: from the countershaft sprocket by the pivot, round the rear sprocket and back, link by link
  const F=[-0.105,0.028],R=[0.01,ax],rf=0.035,rr=0.118,x=0.075,pts=[];
  const arc=(c,r,a0,a1,n)=>{for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push([c[0]+Math.sin(a)*r,c[1]+Math.cos(a)*r])}};
  const ang=Math.atan2(R[0]-F[0],R[1]-F[1]);
  arc(F,rf,ang+Math.PI/2,ang+Math.PI*1.5,10);arc(R,rr,ang-Math.PI/2,ang+Math.PI/2,20);pts.push(pts[0]);
  const path=[];for(let i=0;i<pts.length-1;i++){const [y0,z0]=pts[i],[y1,z1]=pts[i+1],L=Math.hypot(y1-y0,z1-z0),n=Math.max(1,Math.round(L/0.0159));for(let k=0;k<n;k++){const t=k/n;path.push([y0+(y1-y0)*t,z0+(z1-z0)*t,Math.atan2(y1-y0,z1-z0)])}}
  path.forEach(([y,z,a],k)=>put(AR,'steel#3d3b36',BX(0.02,k%2?0.009:0.0105,0.017),[x,y,z],[-a,0,0]))}

// ---------- the kickstand ----------
rod(SD,'steel#2b2d2f',[0.0,0,0],[0.19,-0.42,0],0.012,10);put(SD,'steel#2b2d2f',RB(0.05,0.012,0.06,0.004),[0.2,-0.435,0]);
put(SD,ALU,CY(0.016,0.016,0.04,12),[0,0,0],[0,0,Math.PI/2]);rod(SD,'steelL',[0.02,-0.04,0],[0.0,0.04,-0.06],0.004,6);

// ---------- merge: one mesh per material ----------
const root=new T.Group();root.name='bike';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
