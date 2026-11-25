// Corley's Island: collisions. What happens when a machine meets the world: blkPush (blocks.js) and hvPush (heavy.js)
// keep it out of solids, blocks and the other machines and hand the contact here.
// - Walls (buildings, fences, posts, rocks, blocks): the speed into the wall bounces back a little (Tuning crBounce),
//   the speed along it is kept, less a scrape, so a glancing hit slides along the face and a head-on one stops dead.
//   A hit off the machine's middle (a front corner clipping a post) turns it a little (crSpin).
// - Machine against machine: each machine has a weight (crMass); they share the overlap by weight (the four-wheeler is
//   shoved aside by the dozer, the dozer barely by the four-wheeler, a parked one holds on its brakes as if twice its
//   weight) and trade speed along the line between them as two bodies of those weights would.
// - What it feels like: a hit thumps (the thud recording, with the steel clang of the tailgate past a walking pace),
//   louder the harder, from where it happened; scraping along a wall grinds; the driven machine shakes the camera and
//   the controller rumbles by how hard it hit.
// - The light things the bigger machines push through (soft props: drums, barricades, signs, bins) are knocked over:
//   they fall the way the machine was going, slide a little, and stand back up after a while (crKnockBack) once
//   nobody is near. Only the look: where they stand is still the asset's, so saves and the editor are unchanged.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const CR_KG={dozer:20000,loader:17000,semi:16000,pickup:2700,atv:400,backhoe:8200,golf:450,kart:180};
const CR={v:null,kn:[],st:new Map(),o:new THREE.Object3D(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),ax:new THREE.Vector3(),up:new THREE.Vector3(0,1,0)};
// a machine's weight (kg)
function crMass(o){if(o.k&&CR_KG[o.k])return CR_KG[o.k];if(o.K)return o.K.car?2000:12000;
  return o===st?22000:o===tr?15000:o===sk?3600:o===mw?350:o===bk?200:2000}
// how much of an overlap between o (moving) and h the first takes: h's share of their weight, a parked h on its brakes
// counting double
function crShare(o,h){const mo=crMass(o),mh=crMass(h)*(blkRidden(h)?1:2);return mh/(mo+mh)}
const crHead=o=>[Math.sin(o.mv!==undefined&&o.K&&o.K.car?o.mv:o.yaw),Math.cos(o.mv!==undefined&&o.K&&o.K.car?o.mv:o.yaw)];
// a turn from a hit off the middle: lz the contact along the machine, n the push, s the speed into it
function crSpin(o,lz,nx,nz,s,r){if(!o.yaw&&o.yaw!==0)return;const px=Math.cos(o.yaw),pz=-Math.sin(o.yaw),k=lz*(px*nx+pz*nz)/(Math.abs(lz)+r+1);
  o.yaw+=Math.max(-0.08,Math.min(0.08,0.05*TU.crSpin*s*k))}
// against something that doesn't move: dx, dz how far it was pushed out this frame
function crHit(o,dx,dz,lz,r){const l=Math.hypot(dx,dz);if(l<1e-6||typeof o.v!=='number')return;const nx=dx/l,nz=dz/l,[hx,hz]=crHead(o),c=hx*nx+hz*nz,s=-o.v*c;
  const t=Math.abs(o.v)*Math.sqrt(Math.max(0,1-c*c));
  if(s>0){o.v-=(1+TU.crBounce)*o.v*c*c;crSpin(o,lz,nx,nz,s,r)}
  if(t>0.5)o.v*=0.985;
  crFx(o,Math.max(0,s),t,o.x-nx*r,o.z-nz*r)}
// two machines: n (from h towards o, not yet unit) the line between them
function crBump(o,h,nx,nz,lz,r){const l=Math.hypot(nx,nz);if(l<1e-6)return;nx/=l;nz/=l;if(typeof o.v!=='number')o.v=0;
  const [ox,oz]=crHead(o),[hx,hz]=crHead(h),vo=o.v*(ox*nx+oz*nz),vh=(h.v||0)*(hx*nx+hz*nz),c=vh-vo;
  if(c>0){const mo=crMass(o),mh=crMass(h)*(blkRidden(h)?1:2),j=(1+TU.crBounce)*c/(1/mo+1/mh);
    o.v+=j/mo*(ox*nx+oz*nz);h.v=(h.v||0)-j/mh*(hx*nx+hz*nz);crSpin(o,lz,nx,nz,c*mh/(mo+mh),r)}
  const t=Math.abs(o.v)*Math.sqrt(Math.max(0,1-(ox*nx+oz*nz)**2));
  crFx(blkRidden(h)?h:o,Math.max(0,c),t,o.x-nx*r,o.z-nz*r)}
// the thump, the grind, the shake and the rumble: s the speed into it, t along it (m/s), at x, z
function crFx(o,s,t,x,z){const now=performance.now(),me=blkRidden(o);
  if(s>0.7&&now-(o.crT||0)>350){o.crT=now;
    if(me){shake=Math.max(shake,reduceMotion?0:Math.min(0.35,0.03+0.045*s));rumble(100+40*Math.min(6,s),Math.min(1,0.2+0.13*s))}
    crSound(x,z,me,s>1.6?'gate':null,Math.min(1,0.15+s/6),0.75+0.25*Math.random()-Math.min(0.25,s*0.03))}
  if(t>1.2&&now-(o.crS||0)>230){o.crS=now;if(crPrep(x,z,me))sndShot('scrape',CR.v.fx,actx.currentTime,0.75+0.15*Math.random(),Math.min(0.55,t/9))}}
function crPrep(x,z,me){if(!(snd&&snd.ready&&actx&&actx.state==='running'))return false;if(!CR.v)CR.v=sndVoice();const t=actx.currentTime;
  CR.v.fx.gain.setTargetAtTime(sndVol(sndCfg.fx),t,0.01);sndPlace(CR.v,x,surfAt(x,z)+0.8,z,t,me&&camMode==='cab');return true}
function crSound(x,z,me,metal,g,rate){if(!crPrep(x,z,me))return;const t=actx.currentTime;sndShot('thud',CR.v.fx,t,rate,g);if(metal)sndShot('gate',CR.v.fx,t+0.01,0.8+0.2*Math.random(),g*0.7)}
// ---------- knocked-over things ----------
// s: a soft prop's solid (its asset s.a; its instance from propsBuild, propInst); o the machine. What is knocked over
// is kept in CR.st (asset to state), never on the asset (the editor copies assets as JSON)
function crKnock(s,o){const a=s.a,I=propInst.get(a);if(CR.st.has(a)||!I||Math.abs(o.v||0)<0.8)return;const [hx,hz]=crHead(o),sg=Math.sign(o.v);
  // it falls away from the machine, a little to the side it was hit on
  let dx=a.x-o.x,dz=a.z-o.z;const l=Math.hypot(dx,dz)||1;dx=dx/l*0.4+hx*sg*0.6;dz=dz/l*0.4+hz*sg*0.6;const m=Math.hypot(dx,dz)||1;
  CR.st.set(a,{t:0,dx:dx/m,dz:dz/m,sp:Math.min(5,Math.abs(o.v)),w:0,I});CR.kn.push(a);
  if(crPrep(a.x,a.z,blkRidden(o)))sndShot('thud',CR.v.fx,actx.currentTime,1.3+0.3*Math.random(),0.35)}
// every frame: the knocked things fall and slide, and stand back up a while later when nobody is near
function crTick(dt){if(!CR.kn.length)return;const o=CR.o;
  for(let i=CR.kn.length-1;i>=0;i--){const a=CR.kn[i],k=CR.st.get(a),P=PROPS[a.t];if(!k){CR.kn.splice(i,1);continue}const I=k.I;k.t+=dt;
    if(k.t>TU.crKnockBack&&Math.hypot(camera.position.x-a.x,camera.position.z-a.z)>30){CR.st.delete(a);CR.kn.splice(i,1);
      o.position.set(a.x,I.py,a.z);o.rotation.set(0,a.yaw,0);o.scale.setScalar(a.s);o.updateMatrix();I.im.setMatrixAt(I.i,o.matrix);I.im.instanceMatrix.needsUpdate=true;continue}
    if(k.t>1.5)continue;
    // tips over like a falling post (faster and faster till it lies down), slides as it goes
    k.w=Math.min(Math.PI/2*0.96,k.w+dt*(2+k.w*6));const d=k.sp*0.35*(1-Math.exp(-k.t*3)),x=a.x+k.dx*d,z=a.z+k.dz*d;
    CR.ax.set(k.dz,0,-k.dx).normalize();CR.q.setFromAxisAngle(CR.ax,k.w);CR.q2.setFromAxisAngle(CR.up,a.yaw);
    o.quaternion.copy(CR.q).multiply(CR.q2);o.position.set(x,surfAt(x,z)+Math.sin(k.w)*Math.min(P.w,P.d)*a.s*0.5,z);o.scale.setScalar(a.s);o.updateMatrix();
    I.im.setMatrixAt(I.i,o.matrix);I.im.instanceMatrix.needsUpdate=true}}
// propsBuild lays every asset out again: none stays knocked
function crReset(){CR.st=new Map();CR.kn.length=0}
