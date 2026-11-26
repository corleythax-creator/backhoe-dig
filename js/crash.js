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
// - Jumps: over a crest at speed or off a ledge a machine leaves the ground and lands with a thump (crFly, crAir).
// - Tipping: a side slope or a hard turn past what its track and height can hold rolls it on its side; it is set
//   back on its wheels a few seconds later (crTip, crTipAt).
// - Damage: hard hits, hard landings and roll-overs knock it about (crDamage): it drags, pulls to a side and smokes,
//   until it stops at a fuel pump or its home spot.
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
    crSound(x,z,me,s>1.6?'gate':null,Math.min(1,0.15+s/6),0.75+0.25*Math.random()-Math.min(0.25,s*0.03));crDamage(o,s-2.5);if(s>2.5)crDent(crGroup(o),x,(o.y||0)+0.9,z,Math.min(0.18,0.018*s),0.45+0.06*s)}
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
function crTick(dt){crWear(dt);if(!CR.kn.length)return;const o=CR.o;
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
// ---------- jumps and landings ----------
// a machine's height over the ground under it (Y, from its wheels) each frame: on the ground it follows Y (k: how fast);
// when the ground falls away faster than gravity could follow (over a crest at speed, off a ledge) it leaves it with the
// upward speed it had and flies until it comes down, landing with a thump by how hard (crLand). True while in the air
function crFly(o,Y,k,dt){if(!dt||!isFinite(o.y)){o.y+=(Y-o.y)*k;o.crGy=Y;o.crGv=0;o.crFl=false;return false}
  const gv=o.crGy===undefined?0:Math.max(-12,Math.min(12,(Y-o.crGy)/dt));o.crGy=Y;
  if(!o.crFl){const was=o.crGv||0;o.crGv+=(gv-o.crGv)*Math.min(1,dt*20);
    if(Math.abs(o.v||0)>2.5&&(o.crGv-was)/dt<-9.8*TU.crAir&&Y<o.y-0.04){o.crFl=true;o.crVy=Math.max(0,was)}
    else{o.y+=(Y-o.y)*k;return false}}
  o.crVy-=9.8*dt;o.y+=o.crVy*dt;o.crAt=(o.crAt||0)+dt;
  if(o.y<=Y){const s=-o.crVy;o.y=Y;o.crVy=0;o.crFl=false;o.crGv=0;if(o.crAt>0.12)crLand(o,s);o.crAt=0;return false}
  return true}
function crLand(o,s){if(s<1.2)return;const me=blkRidden(o);
  if(me){shake=Math.max(shake,reduceMotion?0:Math.min(0.4,0.04+0.04*s));rumble(140+30*Math.min(8,s),Math.min(1,0.25+0.1*s))}
  crSound(o.x,o.z,me,s>3?'gate':null,Math.min(1,0.2+s/7),0.65+0.15*Math.random());crDamage(o,s-4);if(s>5)crDent(crGroup(o),o.x,(o.y||0)+0.3,o.z,Math.min(0.1,0.01*s),1.2)}
// ---------- tipping over ----------
// the centre of mass (m above the ground) of each kind, for when a side slope or a hard turn rolls it over: past the
// angle whose tangent is half the track over that height it goes over on its side (Tuning crTipAt scales it, 0: never)
const CR_CG={dozer:1.0,loader:1.35,semi:1.55,pickup:0.9,atv:0.6,backhoe:1.3,golf:0.65,kart:0.3};
// roll: the ground's roll under it (+: its right side, +x along it, higher), hw half its track, w how fast it turns;
// gives the extra roll to draw (T.a) and how far to lift it (T.lift) so it lies on its side rather than in the ground
function crTip(o,roll,dt,hw,cg,w){const T=o.crTp||(o.crTp={a:0,av:0,s:0,t:0,on:0,lift:0});if(!dt){T.on=0;T.a=0;T.lift=0;return T}
  if(!T.on){const eff=roll+Math.atan((o.v||0)*(w||0)/9.8),lim=Math.atan(hw/cg)*TU.crTipAt;
    if(TU.crTipAt>0&&Math.abs(eff)>lim&&!o.crFl){T.on=1;T.s=Math.sign(eff);T.t=0;T.av=0.6;if(blkRidden(o))say('crTipped',{m:crName(o)})}}
  if(T.on===1){T.av+=dt*5;T.a+=T.s*T.av*dt;o.v=0;o.w=0;
    if(Math.abs(T.a)>=Math.PI/2-0.05){T.a=T.s*(Math.PI/2-0.05);T.on=2;T.t=0;crSound(o.x,o.z,blkRidden(o),'gate',0.9,0.6);crDamage(o,3);{const hw=1.1,px=Math.cos(o.yaw),pz=-Math.sin(o.yaw);crDent(crGroup(o),o.x-px*T.s*hw,(o.y||0)+1.2,o.z-pz*T.s*hw,0.15,1.0)}
      if(blkRidden(o)){shake=Math.max(shake,reduceMotion?0:0.3);rumble(300,1)}}}
  else if(T.on===2){o.v=0;o.w=0;T.t+=dt;if(T.t>3.5)T.on=3}
  else if(T.on===3){o.v=0;o.w=0;T.a-=T.s*dt*1.4;if(T.a*T.s<=0){T.a=0;T.on=0;if(blkRidden(o))say('crRighted',{m:crName(o)})}}
  T.lift=hw*Math.sin(Math.abs(T.a));return T}
function crName(o){if(o.K)return o.K.n;return o===tr?'dump truck':o===st?'excavator':o===sk?'skid steer':o===mw?'mower':o===bk?'dirt bike':'machine'}
// ---------- damage ----------
// a hit past a fast walk (or a hard landing, a roll-over) knocks it about: o.crDmg, 0 to 1. A knocked-about machine
// drags (its top speed falls), pulls to one side and, badly hurt, smokes; stopping at a fuel pump (FUEL_PUMPS) or
// its home spot puts it right. Tuning crDamage scales it (0: no damage). Kept on the machine, not saved
function crDamage(o,x){if(x<=0||TU.crDamage<=0)return;const was=o.crDmg||0;o.crDmg=Math.min(1,was+TU.crDamage*Math.pow(x/12,1.3));
  if(o.crDs===undefined)o.crDs=Math.random()<0.5?-1:1;
  if(blkRidden(o)&&Math.floor(o.crDmg*10)>Math.floor(was*10))say('crDamaged',{m:crName(o),n:Math.round(o.crDmg*100)})}
const crMachines=()=>{const L=[];for(const o of [st,tr,sk,mw,bk])if(o)L.push(o);for(const h of hvs)L.push(h);return L};
function crWear(dt){for(const o of crMachines()){if(!o.crDmg)continue;const d=o.crDmg,v=Math.abs(o.v||0);
    if(v>0.4&&typeof o.v==='number'){o.v*=1-d*0.5*dt;if(o!==st&&o.yaw!==undefined)o.yaw+=o.crDs*d*0.06*dt*Math.sign(o.v)}
    if(d>0.5&&Math.random()<dt*(2+6*d))smokePuff(o.x,(o.y||0)+1.8,o.z,1,0.8);
    // fixed at a pump or back home, stopped
    if(v<0.2&&(FUEL_PUMPS.some(p=>Math.hypot(o.x-p.x,o.z-p.z)<7)||o.home&&Math.hypot(o.x-o.home.x,o.z-o.home.z)<4)){o.crDmg=Math.max(0,d-dt*0.25);if(!o.crDmg){crUndent(crGroup(o));if(blkRidden(o))say('crFixed',{m:crName(o)})}}}}
// ---------- dents ----------
// a hard hit pushes the body in where it struck: the machine's (or a car's) own meshes near the point, their corners
// moved in toward its middle, the most at the point and none past r. A mesh gets its own copy of its shape the first
// time (models share theirs), kept until it is fixed (crUndent). Wheels and tyres are left round
function crGroup(o){return o===tr?truck:o===st?machine:o===sk?skid:o===mw?mower:o===bk?bike:o.g||null}
const CR_V=new THREE.Vector3(),CR_D=new THREE.Vector3(),CR_M=new THREE.Matrix4(),CR_S=new THREE.Sphere();
function crDent(g,x,y,z,depth,r){if(!g||TU.crDent<=0)return;depth*=TU.crDent;g.updateMatrixWorld(true);const cx=g.position.x,cz=g.position.z;
  g.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh||m.isInstancedMesh||/wheel|tire|tyre|rim|hub/i.test(m.name+' '+(m.parent&&m.parent.name||'')))return;
    const G=m.geometry,P=G&&G.attributes.position;if(!P)return;if(!G.boundingSphere)G.computeBoundingSphere();
    const sc=m.matrixWorld.getMaxScaleOnAxis()||1;CR_S.copy(G.boundingSphere).applyMatrix4(m.matrixWorld);if(CR_S.center.distanceTo(CR_V.set(x,y,z))>CR_S.radius+r)return;
    CR_M.copy(m.matrixWorld).invert();const lp=CR_V.set(x,y,z).applyMatrix4(CR_M).clone(),ld=CR_D.set(cx-x,0,cz-z).normalize().transformDirection(CR_M).clone(),R=r/sc,dp=depth/sc;
    let Q=P,any=false;for(let i=0;i<Q.count;i++){const vx=Q.getX(i),vy=Q.getY(i),vz=Q.getZ(i),d=Math.hypot(vx-lp.x,vy-lp.y,vz-lp.z);if(d>=R)continue;
      if(!m.userData.crOrig){m.userData.crOrig=G;m.geometry=G.clone();Q=m.geometry.attributes.position}
      const f=(1-d/R)**2*dp;Q.setXYZ(i,vx+ld.x*f,vy+ld.y*f,vz+ld.z*f);any=true}
    if(any){Q.needsUpdate=true;m.geometry.computeBoundingSphere()}})}
function crUndent(g){if(!g)return;g.traverse(m=>{const O=m.userData&&m.userData.crOrig;if(!O)return;m.geometry.dispose();m.geometry=O;delete m.userData.crOrig})}
// ---------- the town's traffic ----------
// a machine meeting one of the town's cars (townfolk.js tf.drive): it is kept out as from a wall (blkPush), and the car
// takes it: stopped a few seconds with its horn going, dented, and in a hard enough hit (or by a heavy machine) wrecked
// (tfCarStep's wreck: it rolls to a stop, and is taken away once out of sight)
function crCarHit(o,c,p){const now=performance.now();if(now-(c.crT||0)<500)return;const l=Math.hypot(p[0],p[1])||1,nx=p[0]/l,nz=p[1]/l,[hx,hz]=crHead(o),
    cv=(c.v||0)*(Math.sin(c.yaw)*-nx+Math.cos(c.yaw)*-nz),s=Math.max(0,-(o.v||0)*(hx*nx+hz*nz))+Math.max(0,-cv);if(s<0.5)return;c.crT=now;
  const heavy=crMass(o)>=8000,cs=Math.cos(c.yaw),sn=Math.sin(c.yaw),dx=o.x-c.x,dz=o.z-c.z,u=Math.max(-c.wid/2,Math.min(c.wid/2,dx*cs-dz*sn)),v=Math.max(-c.len/2,Math.min(c.len/2,dx*sn+dz*cs));
  crDent(c.g,c.x+u*cs+v*sn,(c.g.position.y||0)+0.6,c.z-u*sn+v*cs,Math.min(0.25,0.03*s*(heavy?1.6:1)),0.5+0.08*s);
  if(!c.wreck&&(s>4.5||heavy&&s>2.5)){c.wreck=true;c.hold=0;if(c.drv&&typeof say==='function'&&blkRidden(o))say('crCarWreck',{m:crName(o)})}
  else if(!c.wreck){c.hold=Math.max(c.hold||0,3+s);crHorn(c.x,c.z,blkRidden(o))}}
// a car's horn: two reedy notes together, a short blast
function crHorn(x,z,me){if(!crPrep(x,z,me))return;const t=actx.currentTime,g=actx.createGain(),f=sndFilter('lowpass',2400,0.7,g);g.connect(CR.v.fx);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.16,t+0.02);g.gain.setValueAtTime(0.16,t+0.5);g.gain.linearRampToValueAtTime(0,t+0.6);
  for(const hz of [392,494]){const s=actx.createOscillator();s.type='sawtooth';s.frequency.value=hz;s.connect(f);s.start(t);s.stop(t+0.62)}setTimeout(()=>g.disconnect(),900)}
// ---------- saved ----------
// how damaged each machine is goes with the machines in the save (save.js cd): [excavator, truck, skid steer, mower,
// bike, then Dexter's machines in order]; the dents themselves are not kept, only how bad
function crSave(){return crMachines().map(o=>+(o.crDmg||0).toFixed(3))}
function crLoad(a){if(!Array.isArray(a))return;crMachines().forEach((o,i)=>{const v=+a[i];if(isFinite(v)&&v>0)o.crDmg=Math.min(1,v)})}
