// Corley's Island: the excavator's hydraulic quick coupler and its three attachments, the thumb (a two-jaw grab), the
// breaker hammer and the auger, built from shapes and written out as models/attach.glb by tools/build_model.js (three.js
// r147 in headless Chromium). The game loads it (js/models.js, MDL_KIT.attach) in place of coupler.js's simple shapes
// when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - six nodes, each in its part group's own frame (js/coupler.js), x right, y up, z forward along the bucket:
//   coupler (cplG): rides on the bucket pins, the stick pin at the origin and the link pin at y 0.22, z 0.25; its side
//     plates about 0.21 m either side of the middle, its hook and wedge down to about y -0.15;
//   thumb (thG), hammer (hmG) and auger (agG): each hangs from the coupler by a top bracket whose plate is at y -0.13
//     (0.44 m wide, z -0.1 to 0.5), the two pins the coupler locks on at y -0.11, z -0.03 and 0.52. Thumb: three fixed
//     curved tines at x -0.26, 0 and 0.26 from (y -0.18, z 0.25) to their points at about (y -0.82, z 1.12). Hammer:
//     the housing 0.44 m square from y -0.18 to -0.62 and z 0.22 to 1.18, the chisel on y -0.4 to its point at z 1.92.
//     Auger: the drive head on y -0.4 from z 0.27 to 0.77;
//   thumbJaw (thJaw): the moving jaw, origin at its pivot (thG y -0.22, z 0.36), two curved tines at x ±0.13 reaching
//     (y -0.6, z 0.68); the game turns it about x, 0.12 closed to 0.85 open;
//   augerBit (agBit): origin on the drive's output (agG y -0.4, z 0.77), the bit along +z to its pilot point at z 1.52,
//     the flights 0.48 m across; the game spins it about z the negative way, so the bottom flight's cutting edge
//     leads and the flights carry the spoil up;
// - materials named for the game's: paint and paintD (the excavator's orange), steel, steelL, chrome, black, rubber
//   (the hoses), paintR (the lock flag), and 'steel#…', 'metal#…' for the worn wear parts and carbide.
// Metres. Classic script, no modules.
function buildAttach(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.6?2:1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||14);
// cylinders lying along x and along z
const cx=(part,mat,r,len,p,n)=>put(part,mat,CY(r,r,len,n||20),p,[0,0,Math.PI/2]);
const cz=(part,mat,r0,r1,len,p,n)=>put(part,mat,CY(r1,r0,len,n||20),p,[Math.PI/2,0,0]);
// a side profile [[z,y],...] made into a plate across x, of a width, with rounded edges, centred on x; holes [[z,y,r]]
function side(pts,w,bev,holes){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  for(const [hz,hy,hr] of holes||[]){const h=new T.Path();h.absarc(hz,hy,hr,0,Math.PI*2,true);s.holes.push(h)}
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:12});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.2);put(part,mat,new T.TubeGeometry(c,n||Math.max(10,pts.length*5),r,6,false))}
const arc=(cz0,cy0,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz0+Math.cos(a)*r,cy0+Math.sin(a)*r]});
// a hex bolt head with its washer on a face looking along +x or -x (s), or along +y (s=0)
function bolt(part,p,s,r){r=r||0.014;if(s){put(part,'steel',CY(r*1.5,r*1.5,0.004,6),[p[0]+s*0.002,p[1],p[2]],[0,0,Math.PI/2]);put(part,'steel',CY(r,r,r*0.8,6),[p[0]+s*(0.004+r*0.4),p[1],p[2]],[0,0,Math.PI/2])}
  else{put(part,'steel',CY(r*1.5,r*1.5,0.004,6),[p[0],p[1]+0.002,p[2]]);put(part,'steel',CY(r,r,r*0.8,6),[p[0],p[1]+0.004+r*0.4,p[2]])}}
// a hydraulic hose with a crimped fitting at each end
function hose(part,pts,r){tube(part,'rubber',pts,r||0.016);for(const p of [pts[0],pts[pts.length-1]])put(part,'chrome',CY((r||0.016)*1.35,(r||0.016)*1.35,0.05,10),p,
  (()=>{const a=p===pts[0]?pts[1]:pts[pts.length-2],d=new T.Vector3(a[0]-p[0],a[1]-p[1],a[2]-p[2]).normalize(),qq=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d),ee=new T.Euler().setFromQuaternion(qq);return [ee.x,ee.y,ee.z]})())}
// a tine's outline about a centre line f(t) [z,y], depth d(t) across it, with a point past its end
function tineOutline(f,d,t0,t1,n,tip){const up=[],dn=[];
  for(let i=0;i<=n;i++){const t=t0+(t1-t0)*i/n,[z,y]=f(t),[z2,y2]=f(t+1e-3),l=Math.hypot(z2-z,y2-y),nz=-(y2-y)/l,ny=(z2-z)/l,h=d(t)/2;
    up.push([z+nz*h,y+ny*h]);dn.unshift([z-nz*h,y-ny*h])}
  const [z,y]=f(t1),[z2,y2]=f(t1+1e-3),l=Math.hypot(z2-z,y2-y);
  return [...up,[z+(z2-z)/l*tip,y+(y2-y)/l*tip],...dn]}

// ---------- the coupler: two side plates on the bucket pins, the frame between, the front hook, the rear wedge
// driven by its lock cylinder, the hoses and the lock flag ----------
{const C='coupler',plate=[[-0.13,-0.07],[0.6,-0.07],[0.6,0.0],[0.4,0.13],...arc(0.25,0.22,0.09,-0.75,2.75,14),[0.09,0.11],...arc(0,0,0.11,1.05,3.45,14),[-0.13,-0.04]];
  for(const s of [-1,1]){put(C,'paintD',side(plate,0.035,0.006,[[0,0,0.058],[0.25,0.22,0.052]]),[0.21*s,0,0]);
    // pin bosses welded round the holes, and the retaining collars on the pins
    put(C,'paintD',CY(0.082,0.082,0.03,20),[0.243*s,0,0],[0,0,Math.PI/2]);put(C,'paintD',CY(0.072,0.072,0.03,20),[0.243*s,0.22,0.25],[0,0,Math.PI/2]);
    put(C,'steel',CY(0.064,0.064,0.012,20),[0.264*s,0,0],[0,0,Math.PI/2]);put(C,'steel',CY(0.056,0.056,0.012,20),[0.264*s,0.22,0.25],[0,0,Math.PI/2]);
    for(const [y,z] of [[0.04,0.035],[-0.035,-0.035],[0.26,0.28],[0.18,0.22]])bolt(C,[0.27*s,y,z],s,0.009);
    // the lock flag: shows red while the wedge is open
    put(C,'paintR',RB(0.008,0.035,0.06,0.004),[0.232*s,-0.03,0.47])}
  cx(C,'steel',0.05,0.53,[0,0,0],18);cx(C,'steel',0.045,0.53,[0,0.22,0.25],18);
  // the frame between the plates: a deck, a front cross tube and the hook that takes the attachment's front pin
  put(C,'steel',RB(0.385,0.035,0.42,0.008),[0,-0.052,0.34]);put(C,'paintD',RB(0.385,0.12,0.03,0.006),[0,-0.01,0.13]);
  cx(C,'steel',0.035,0.385,[0,0.03,0.52],18);
  for(const x of [-0.15,0.15]){put(C,'steel',side([...arc(0.52,-0.1,0.08,-0.35,Math.PI*0.95,10),...arc(0.52,-0.1,0.046,Math.PI*0.95,-0.35,10)],0.05,0.004),[x,0,0]);
    put(C,'steel',side([...arc(-0.03,-0.1,0.075,Math.PI*0.05,Math.PI+0.35,10),...arc(-0.03,-0.1,0.044,Math.PI+0.35,Math.PI*0.05,10)],0.05,0.004),[x,0,0])}
  put(C,'steel',RB(0.29,0.035,0.08,0.008),[0,-0.04,0.53]);
  // the rear wedge on its guides, the lock cylinder pushing it (chrome rod), its two hoses
  put(C,'steelL',side([[-0.13,-0.065],[-0.07,-0.065],[-0.058,-0.135],[-0.13,-0.135]],0.24,0.006));put(C,'steel',RB(0.05,0.04,0.06,0.006),[0,-0.045,-0.1]);
  for(const x of [-0.16,0.16])put(C,'steel',RB(0.03,0.035,0.12,0.006),[x,-0.05,-0.07]);
  cz(C,'paintD',0.042,0.042,0.2,[0,-0.005,0.3],20);cz(C,'steel',0.047,0.047,0.03,[0,-0.005,0.405],20);cz(C,'steel',0.047,0.047,0.03,[0,-0.005,0.195],20);
  cz(C,'chrome',0.022,0.022,0.14,[0,-0.005,0.12],16);put(C,'steel',RB(0.08,0.05,0.04,0.008),[0,-0.02,0.05]);
  for(const x of [-0.05,0.05])hose(C,[[x,0.03,0.38],[x,0.08,0.34],[x*1.6,0.14,0.2],[x*2,0.16,0.04]],0.011)}

// ---------- the bracket every attachment carries: a top plate, two ear plates and the pins the coupler locks on ----------
function bracket(P,deep){put(P,'paintD',RB(0.44,0.04,0.64,0.008),[0,-0.17,0.2]);
  for(const s of [-1,1]){put(P,'paintD',side([[-0.1,-0.19],[0.6,-0.19],[0.6,-0.11],[0.56,-0.055],[0.48,-0.055],[0.44,-0.13],[0.03,-0.13],[-0.01,-0.055],[-0.07,-0.055],[-0.1,-0.1]],0.03,0.004),[0.2*s,0,0]);
    put(P,'paintD',side([[-0.08,-0.19],[0.58,-0.19],[0.5,-0.19-deep],[0.0,-0.19-deep]],0.03,0.004),[0.16*s,0,0]);
    for(const z of [-0.03,0.52])put(P,'steel',CY(0.05,0.05,0.016,16),[0.223*s,-0.1,z],[0,0,Math.PI/2])}
  for(const z of [-0.03,0.52])cx(P,'chrome',0.034,0.46,[0,-0.1,z],16);
  for(const s of [-1,1])for(const z of [0.08,0.2,0.32])bolt(P,[0.22*s,-0.17,z],s,0.008)}

// ---------- the thumb: three fixed curved tines with cross tubes, a rotary actuator on the jaw's pivot, and the jaw
// on its own pivot (thumbJaw) closing up under them; worn tooth points on every tine ----------
{const P='thumb',F=t=>[0.25+0.85*t,-0.18-0.22*t-0.4*t*t*t];bracket(P,0.04);
  for(const x of [-0.26,0,0.26]){put(P,'paintD',side(tineOutline(F,t=>0.06+0.16*t-0.14*t*t,0,0.96,22,0.02),0.05,0.006),[x,0,0]);
    put(P,'steelL',side(tineOutline(F,t=>0.085-0.05*(t-0.9)/0.12,0.9,1.02,4,0.06),0.062,0.006),[x,0,0]);
    // a boss round the pivot on each tine, and its wear strip on the inside of the curve
    put(P,'paintD',CY(0.075,0.075,0.07,22),[x,-0.22,0.36],[0,0,Math.PI/2]);
    for(let i=0;i<4;i++){const t=0.3+i*0.15,[z,y]=F(t),[z2,y2]=F(t+0.15);put(P,'steelL',new T.BoxGeometry(0.056,0.014,Math.hypot(z2-z,y2-y)*0.92),[x,(y+y2)/2-0.055,(z+z2)/2],[-Math.atan2(y2-y,z2-z),0,0])}}
  for(const t of [0.38,0.72]){const [z,y]=F(t);cx(P,'steel',0.034,0.6,[0,y+0.01,z],16);for(const x of [-0.13,0.13])put(P,'steel',RB(0.03,0.06,0.05,0.008),[x,y+0.01,z])}
  // the bracket's web to the tines, and the pivot shaft with its keeper plates
  put(P,'paintD',RB(0.6,0.1,0.14,0.012),[0,-0.2,0.24]);cx(P,'chrome',0.036,0.68,[0,-0.22,0.36],18);
  for(const s of [-1,1]){put(P,'steel',RB(0.012,0.07,0.1,0.006),[0.302*s,-0.22,0.36]);bolt(P,[0.308*s,-0.2,0.39],s,0.008)}
  // the rotary actuator on the right end of the pivot, its end-cap bolts and two hoses up to the bracket
  cx(P,'paintD',0.095,0.13,[0.38,-0.22,0.36],22);cx(P,'steel',0.1,0.02,[0.325,-0.22,0.36],22);cx(P,'steel',0.1,0.02,[0.44,-0.22,0.36],22);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;bolt(P,[0.45,-0.22+Math.sin(a)*0.075,0.36+Math.cos(a)*0.075],1,0.008)}
  put(P,'steel',RB(0.08,0.07,0.06,0.01),[0.38,-0.14,0.33]);
  for(const [dz,dx] of [[-0.03,0.36],[0.03,0.4]])hose(P,[[dx,-0.11,0.33+dz],[dx,-0.06,0.3+dz],[0.3,-0.02,0.12+dz],[0.24,-0.04,-0.04+dz]],0.012);
  // the jaw: two tines on hubs round the pivot shaft, two cross tubes, worn points
  const J='thumbJaw',G=t=>[0.68*t*t,-0.6*t*(2-t)];
  for(const x of [-0.13,0.13]){put(J,'paint',side(tineOutline(G,t=>0.13-0.06*t,0.04,0.92,24,0.02),0.05,0.006),[x,0,0]);
    put(J,'steelL',side(tineOutline(G,t=>0.075-0.04*(t-0.88)/0.12,0.88,1.0,4,0.05),0.06,0.006),[x,0,0]);
    put(J,'paint',CY(0.078,0.078,0.075,24),[x,0,0],[0,0,Math.PI/2]);put(J,'steel',CY(0.05,0.05,0.08,18),[x,0,0],[0,0,Math.PI/2])}
  for(const t of [0.27,0.68]){const [z,y]=G(t);cx(J,'steel',0.032,0.31,[0,y,z],16)}
  {const [z,y]=G(0.27);put(J,'paint',RB(0.26,0.035,0.12,0.008),[0,y+0.04,z+0.02],[-0.9,0,0])}}

// ---------- the hammer: a breaker in a box housing with bolted wear plates and rubber dampers, its front head, tool
// bushing and moil point, the lift eye, the nitrogen valve and two hoses ----------
{const P='hammer';bracket(P,0.02);
  put(P,'paint',RB(0.42,0.42,0.92,0.03),[0,-0.4,0.7]);
  for(const s of [-1,1]){put(P,'steelL',RB(0.024,0.32,0.76,0.01),[0.222*s,-0.4,0.7]);
    for(const y of [-0.29,-0.51])for(let i=0;i<4;i++)bolt(P,[0.234*s,y,0.4+i*0.2],s,0.013);
    // the front head's retainer pin plugs
    put(P,'black',CY(0.028,0.028,0.012,16),[0.236*s,-0.4,1.08],[0,0,Math.PI/2])}
  // seams round the housing's ends and wear strips under it
  for(const z of [0.26,1.14])put(P,'steel',RB(0.43,0.43,0.02,0.008),[0,-0.4,z]);
  for(const x of [-0.12,0.12])put(P,'steelL',RB(0.06,0.014,0.8,0.004),[x,-0.615,0.72]);
  // lift eye and nitrogen valve on top, the hose ports and the hoses back to the bracket
  put(P,'paintD',side([[0.8,-0.19],[1.02,-0.19],...arc(0.91,-0.12,0.05,0,Math.PI,8)],0.03,0.004,[[0.91,-0.125,0.022]]));
  put(P,'steel',CY(0.03,0.03,0.04,12),[0,-0.17,0.68]);put(P,'black',CY(0.022,0.022,0.02,12),[0,-0.145,0.68]);
  for(const x of [-0.11,0.11]){put(P,'steel',RB(0.06,0.04,0.06,0.008),[x,-0.17,0.58]);
    hose(P,[[x,-0.15,0.58],[x,-0.08,0.62],[x*2.4,-0.04,0.56],[x*2.7,0.04,0.25],[x*2.6,0.12,-0.04]],0.017)}
  // the front head, its bushing and the chisel with a moil point
  cz(P,'steel',0.15,0.135,0.2,[0,-0.4,1.24],32);cz(P,'steelL',0.1,0.1,0.03,[0,-0.4,1.355],28);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+0.4;put(P,'steel',CY(0.012,0.012,0.03,6),[Math.cos(a)*0.12,-0.4+Math.sin(a)*0.12,1.35],[Math.PI/2,0,0])}
  cz(P,'steelL',0.066,0.062,0.44,[0,-0.4,1.57],24);
  put(P,'metal#a9adaf',CY(0.004,0.062,0.15,24),[0,-0.4,1.865],[Math.PI/2,0,0]);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2;put(P,'steel',RB(0.008,0.012,0.12,0.003),[Math.cos(a)*0.063,-0.4+Math.sin(a)*0.063,1.66],[0,0,a])}}

// ---------- the auger: a hanger under the bracket, the hydraulic motor and planetary drive with its bolted flange
// and hoses; the bit (augerBit): drive socket and cross pin, tube, welded helical flights, the cutting head with
// carbide teeth on the leading edge, and the pilot point ----------
{const P='auger';bracket(P,0.03);
  for(const s of [-1,1])put(P,'paintD',side([[0.38,-0.19],[0.62,-0.19],[0.56,-0.2],...arc(0.5,-0.21,0.042,-0.1,-Math.PI+0.1,10),[0.44,-0.2]],0.03,0.004,[[0.5,-0.21,0.018]]),[0.1*s,0,0]);
  cx(P,'chrome',0.016,0.26,[0,-0.21,0.5],12);for(const s of [-1,1])put(P,'steel',CY(0.028,0.028,0.012,12),[0.122*s,-0.21,0.5],[0,0,Math.PI/2]);
  put(P,'paintD',side([[0.43,-0.25],[0.57,-0.25],[0.545,-0.215],...arc(0.5,-0.21,0.038,-0.2,Math.PI+0.2,8),[0.455,-0.215]],0.16,0.006,[[0.5,-0.21,0.018]]));
  // motor and drive: the cast body with ribs, the end cap with its ports, the planetary housing and flange
  cz(P,'paintD',0.17,0.17,0.34,[0,-0.4,0.46],32);cz(P,'steel',0.13,0.15,0.05,[0,-0.4,0.265],28);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+Math.PI/6;put(P,'paintD',RB(0.03,0.025,0.3,0.006),[Math.cos(a)*0.175,-0.4+Math.sin(a)*0.175,0.46],[0,0,a+Math.PI/2])}
  cz(P,'paint',0.19,0.19,0.1,[0,-0.4,0.68],32);cz(P,'steel',0.215,0.215,0.03,[0,-0.4,0.745],32);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;put(P,'steel',CY(0.011,0.011,0.02,6),[Math.cos(a)*0.198,-0.4+Math.sin(a)*0.198,0.765],[Math.PI/2,0,0])}
  for(const x of [-0.06,0.06]){put(P,'steel',RB(0.05,0.05,0.04,0.008),[x,-0.33,0.225]);
    hose(P,[[x,-0.33,0.2],[x,-0.29,0.12],[x*1.6,-0.23,0.0],[x*2,-0.2,-0.14],[x*2,-0.12,-0.16]],0.016)}
  put(P,'steel',CY(0.012,0.012,0.03,8),[0,-0.22,0.62]);
  // the bit
  const B='augerBit',zb=1.32,zt=0.24,pitch=0.3,ri=0.052,ro=0.24,th=0.014,A=(zb-zt)/pitch*Math.PI*2,N=Math.ceil(A/(Math.PI*2)*48);
  const hex=CY(0.08,0.08,0.15,6);put(B,'steel',hex,[0,0,0.075],[Math.PI/2,0,0]);cx(B,'chrome',0.018,0.2,[0,0,0.07],10);
  put(B,'steel',new T.TorusGeometry(0.03,0.006,6,14),[0.11,0,0.07],[0,Math.PI/2,0]);
  cz(B,'steel',0.058,0.058,1.22,[0,0,0.75],20);cz(B,'steel',0.07,0.058,0.04,[0,0,0.17],20);
  // the flights: a ribbon round the tube, its top and bottom faces and outer rim; z falls as the angle grows
  {const P0=[],idx=[],ring=(a,r,z)=>[r*Math.cos(a),r*Math.sin(a),z];
    const quad=(a,b,c,d)=>{const o=P0.length/3;P0.push(...a,...b,...c,...d);idx.push(o,o+1,o+2,o,o+2,o+3)};
    for(let i=0;i<N;i++){const a0=A*i/N,a1=A*(i+1)/N,z0=zb-pitch*a0/(Math.PI*2),z1=zb-pitch*a1/(Math.PI*2);
      quad(ring(a0,ri,z0+th/2),ring(a0,ro,z0+th/2),ring(a1,ro,z1+th/2),ring(a1,ri,z1+th/2));
      quad(ring(a0,ro,z0-th/2),ring(a0,ri,z0-th/2),ring(a1,ri,z1-th/2),ring(a1,ro,z1-th/2));
      quad(ring(a0,ro,z0+th/2),ring(a0,ro,z0-th/2),ring(a1,ro,z1-th/2),ring(a1,ro,z1+th/2))}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P0,3));g.setIndex(idx);g.computeVertexNormals();put(B,'steelL',g)}
  // a weld bead along the flight's root
  {const pts=[];for(let i=0;i<=72;i++){const a=A*i/72;pts.push([0.062*Math.cos(a),0.062*Math.sin(a),zb-pitch*a/(Math.PI*2)-0.008])}tube(B,'steel',pts,0.007,120)}
  // cutting head: a cutter bar on the bottom flight's leading edge with four carbide teeth, and the pilot
  put(B,'steel',RB(0.2,0.04,0.035,0.008),[0.15,-0.012,zb+0.02],[0,0,0]);
  for(let i=0;i<4;i++){const r=0.08+i*0.05;put(B,'steel',RB(0.03,0.05,0.04,0.006),[r,-0.03,zb+0.05],[0.5,0,0]);
    put(B,'metal#b9bec0',CY(0.003,0.014,0.04,8),[r,-0.048,zb+0.085],[Math.PI/2+0.5,0,0])}
  for(const s of [-1,1])put(B,'steel',RB(0.09,0.012,0.08,0.004),[0.03*s,0,zb+0.08],[0,0,s*0.3]);
  put(B,'steel',CY(0.004,0.05,0.14,16),[0,0,zb+0.13],[Math.PI/2,0,0]);
  put(B,'metal#b9bec0',CY(0.003,0.016,0.04,12),[0,0,zb+0.185],[Math.PI/2,0,0])}

// ---------- merge: one mesh per node and material ----------
const root=new T.Group();root.name='attach';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
