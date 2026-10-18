// Corley's Island: Dexter's skid steer. It starts parked in his yard (dexter.js). Left stick drives it (push to go, sideways
// to turn, and it spins in place like any skid steer); right stick runs the loader: up lowers the arms, down raises them,
// left curls the bucket back, right dumps it. The bucket stays level as the arms rise. On the dig site it scoops dirt with
// the bucket on the ground, and dumps it in a pile, over the cliff or into the dump truck's bed.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- the machine ----------
// about 6 ft wide and 9 ft long without the bucket; the bucket holds about half a cubic yard
const SK_START={x:-224,z:247,yaw:0};
const SK_C=[0.6,-0.6],SK_R=1.0,SK_P=[[-0.9,1.0],[0.9,1.0],[-0.9,-1.0],[0.9,-1.0]];
// arms: pivot high at the back, 2.44 m to the bucket pin; at sk.a=0 the bucket sits flat on the ground
const SK_PIV=[1.85,-0.75],SK_ARM=2.44,SK_A0=Math.atan2(-1.4,2.0),SK_ALIM=[-0.06,1.6],SK_CLIM=[-0.95,0.7];
const sk={x:0,z:0,y:0,yaw:0,pitch:0,roll:0,v:0,w:0,a:0,c:0.15,load:0,loadC:[0.5,0.34,0.21],loadMix:[0,0,0,1],loadWet:0,run:0,roll1:0,roll2:0,dumped:0};
const skid=new THREE.Group();scene.add(skid);
const skArm=new THREE.Group(),skBkt=new THREE.Group(),skWheels=[];
(function(){
  const Y=M(0xf2b705,{shininess:30}),D=M(0x2b2d30),BLK=M(0x1d1d1f),RIM=M(0xd9a404),GL=M(0x3c4a52,{shininess:60}),RED=M(0xc0392b,{emissive:0x300000}),STEEL=M(0x8a8a86,{shininess:30});
  const body=new THREE.Group();skid.add(body);
  box(1.5,0.7,2.2,Y,0,0.75,0,body);box(1.42,0.62,0.75,D,0,1.38,-0.82,body);box(1.3,0.05,0.6,BLK,0,1.7,-0.82,body);
  for(const x of [-0.58,0.58])box(0.06,0.06,0.06,RED,x,1.0,-1.11,body);
  // the cab: steel cage, roof, seat, grille in front, side screens
  for(const x of [-0.6,0.6]){for(const z of [-0.35,0.72])box(0.08,1.05,0.08,D,x,1.62,z,body);box(0.04,0.9,1.0,GL,x,1.6,0.2,body)}
  box(1.32,0.1,1.25,Y,0,2.18,0.2,body);box(0.5,0.12,0.5,BLK,0,1.2,0.05,body);box(0.5,0.55,0.1,BLK,0,1.48,-0.2,body);
  for(let i=-2;i<=2;i++)box(0.03,0.95,0.03,D,i*0.25,1.6,0.74,body);
  // the uprights at the back that carry the arms
  for(const x of [-0.82,0.82])box(0.16,1.25,0.45,Y,x,1.25,-0.75,body);
  // wheels (each spins as its side drives)
  for(const x of [-0.9,0.9])for(const z of [-0.7,0.7]){const w=new THREE.Group();w.position.set(x,0.38,z);
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.3,12),BLK);t.rotation.z=Math.PI/2;t.castShadow=true;w.add(t);
    for(let i=0;i<4;i++){const lug=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.06,0.1),D);lug.rotation.x=i*Math.PI/4;w.add(lug)}
    const r=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.32,8),RIM);r.rotation.z=Math.PI/2;w.add(r);body.add(w);skWheels.push({g:w,side:x<0?-1:1})}
  // arms and the bucket
  skArm.position.set(0,SK_PIV[0],SK_PIV[1]);skid.add(skArm);
  for(const x of [-0.82,0.82])box(0.14,0.24,SK_ARM+0.2,Y,x,0,SK_ARM/2,skArm);
  box(1.78,0.14,0.14,Y,0,-0.05,SK_ARM-0.25,skArm);
  for(const x of [-0.7,0.7])box(0.1,0.1,1.3,STEEL,x,-0.2,0.9,skArm);
  skBkt.position.set(0,0,SK_ARM);skArm.add(skBkt);
  box(1.86,0.56,0.07,D,0,-0.16,0.04,skBkt);box(1.86,0.07,0.72,D,0,-0.43,0.38,skBkt);box(1.86,0.06,0.26,D,0,0.1,0.15,skBkt);
  for(const x of [-0.93,0.93])box(0.06,0.56,0.74,D,x,-0.16,0.38,skBkt);
  box(1.9,0.05,0.12,STEEL,0,-0.45,0.76,skBkt);
})();
// the load heaped in the bucket
const skLoad=new THREE.Mesh(new THREE.IcosahedronGeometry(0.5,1),M(0x7a5232,{map:null}));skLoad.scale.set(1.6,0.45,0.6);skLoad.position.set(0,-0.3,0.38);skLoad.visible=false;skBkt.add(skLoad);
const skTip=new THREE.Vector3(),skTipL=new THREE.Vector3(),skTipR=new THREE.Vector3(),skLip=new THREE.Vector3();
function skidReset(){Object.assign(sk,SK_START,{v:0,w:0,a:0,c:0.15,load:0,loadWet:0,run:0,dumped:0});sk.y=surfAt(sk.x,sk.z);skidPose()}
// arms and bucket from sk.a (arm lift) and sk.c (bucket curl, kept level as the arms rise)
function skidPose(){skid.position.set(sk.x,sk.y,sk.z);skid.rotation.set(sk.pitch,sk.yaw,sk.roll,'YXZ');
  const e=SK_A0+sk.a;skArm.rotation.x=-e;skBkt.rotation.x=e-sk.c;skid.updateMatrixWorld(true);
  skBkt.localToWorld(skTip.set(0,-0.46,0.76));skBkt.localToWorld(skTipL.set(-0.5,-0.46,0.6));skBkt.localToWorld(skTipR.set(0.5,-0.46,0.6));skBkt.localToWorld(skLip.set(0,-0.3,0.85));
  // dirt pours forward off the lip as the bucket tips
  skLip.x+=Math.sin(sk.yaw)*0.45;skLip.z+=Math.cos(sk.yaw)*0.45}
// every frame: drive (in, turn: left stick), arms (arm: up/down) and bucket (curl: back/dump); all 0 when parked
function updateSkid(dt,drive,turn,arm,curl){
  const on=mode==='skid'&&!bench.on;sk.run+=((on?1:0)-sk.run)*Math.min(1,dt*(on?2:0.7));
  const mudN=mudAt(sk.x,sk.z),k=1-0.45*mudN,full=1-0.15*sk.load/TU.skCap;
  sk.v+=(drive*TU.skSpd*k*full-sk.v)*Math.min(1,dt*(drive?3:5));sk.w+=(-turn*TU.skTurn*k-sk.w)*Math.min(1,dt*6);
  const ox=sk.x,oz=sk.z,oyaw=sk.yaw,w0=wallCount(sk.x,sk.z,sk.yaw,SK_P);
  sk.yaw+=sk.w*dt;sk.x+=Math.sin(sk.yaw)*sk.v*dt;sk.z+=Math.cos(sk.yaw)*sk.v*dt;
  // on the islands and decks (never the footbridge), off steep ground, out of buildings, blocks and the other machines
  [sk.x,sk.z]=landClamp(sk.x,sk.z,1.2,1.0);
  if(wallCount(sk.x,sk.z,sk.yaw,SK_P)>w0){sk.x=ox;sk.z=oz;sk.yaw=oyaw;sk.v=0}
  if(blkPush(sk,SK_C,SK_R))sk.v*=0.5;
  for(const lz of SK_C){const cx=sk.x+Math.sin(sk.yaw)*lz,cz=sk.z+Math.cos(sk.yaw)*lz;
    for(const [o,cs,r] of [[st,EX_C,EX_R],[tr,TR_C,TR_R],[mw,MW_C,MW_R]])for(const q of cs){const qx=o.x+Math.sin(o.yaw)*q,qz=o.z+Math.cos(o.yaw)*q,dx=cx-qx,dz=cz-qz,d=Math.hypot(dx,dz),m=SK_R+r;
      if(d<m&&d>1e-3){sk.x+=dx/d*(m-d);sk.z+=dz/d*(m-d);sk.v*=0.6}}}
  // the wheels: each side turns at its own speed, and they rut soft ground
  const vl=sk.v+sk.w*0.9,vr=sk.v-sk.w*0.9;sk.roll1+=vl*dt/0.38;sk.roll2+=vr*dt/0.38;
  for(const W of skWheels)W.g.rotation.x=W.side<0?sk.roll1:sk.roll2;
  const sy=Math.sin(sk.yaw),cy=Math.cos(sk.yaw);
  if(Math.abs(sk.v)+Math.abs(sk.w)>0.05)for(const sd of [-1,1])stampRut(sk.x+sd*0.9*cy,sk.z-sd*0.9*sy,sk.yaw,0.16,1.05,dt);
  // the front of each track splashes through puddles (mud.js)
  for(const sd of [-1,1]){const tv=sk.v-sd*sk.w*0.9,f=Math.sign(tv||1)*0.9;splashMud(sk.x+sd*0.9*cy+sy*f,sk.z-sd*0.9*sy+cy*f,sk.yaw,tv,0.2,0.7,dt)}
  const sample=(lx,lz)=>surfAt(sk.x+lx*cy+lz*sy,sk.z-lx*sy+lz*cy);
  const hf=(sample(-0.9,0.7)+sample(0.9,0.7))/2,hb=(sample(-0.9,-0.7)+sample(0.9,-0.7))/2,hr=(sample(0.9,0.7)+sample(0.9,-0.7))/2,hl=(sample(-0.9,0.7)+sample(-0.9,-0.7))/2,kk=Math.min(1,dt*10);
  sk.y+=((hf+hb)/2-sk.y)*kk;sk.pitch+=(-Math.atan2(hf-hb,1.4)-sk.pitch)*kk;sk.roll+=(Math.atan2(hr-hl,1.8)-sk.roll)*kk;
  // the loader: hydraulics slow a little with a full bucket
  sk.a=clamp(sk.a+arm*TU.skArm*dt*full,...SK_ALIM);sk.c=clamp(sk.c+curl*TU.skCurl*dt,...SK_CLIM);
  skidPose();sndIn.skHyd=Math.min(1,Math.abs(arm)+Math.abs(curl));
  // scooping: the cutting edge under the ground on the dig site, the bucket near level
  const g=hAt(skTip.x,skTip.z);
  if(on&&sk.c>-0.3&&sk.load<TU.skCap-0.002&&skTip.y<g-0.03&&Math.abs(skTip.x)<S/2-1&&Math.abs(skTip.z)<S/2-1){
    let got=dig(skTipL,(TU.skCap-sk.load)/2);got+=dig(skTipR,TU.skCap-sk.load-got);
    if(got>0){const f=got/(sk.load+got);for(let q=0;q<3;q++)sk.loadC[q]+=(digC[q]-sk.loadC[q])*f;for(let q=0;q<4;q++)sk.loadMix[q]+=(digMix[q]-sk.loadMix[q])*f;
      sk.loadWet+=(mudAt(skTip.x,skTip.z)-sk.loadWet)*f;sk.load+=got;st.dirty=true;st.slumpT=2.5;sndIn.skDig=1;
      if(sk.load>=TU.skCap-0.003)toast(say('skidFull'),'',2400)}}
  // dumping: tipped past about 20 degrees it pours off the lip, into the truck bed, onto the ground or over the cliff
  const f=clamp((-0.35-sk.c)/0.45,0,1);
  if(f>0&&sk.load>0.0005){const out=Math.min(sk.load,f*(0.3+sk.load*2)*dt);sk.load-=out;sk.dumped+=out;
    if(inBed(skLip)&&tr.load<TU.trCap){const take=Math.min(out,TU.trCap-tr.load),ff=take/(tr.load+take||1);
      for(let q=0;q<3;q++)tr.loadC[q]+=(sk.loadC[q]-tr.loadC[q])*ff;for(let q=0;q<4;q++)tr.loadMix[q]+=(sk.loadMix[q]-tr.loadMix[q])*ff;tr.loadWet+=(sk.loadWet-tr.loadWet)*ff;tr.load+=take}
    else if(Math.abs(skLip.x)<S/2-1&&Math.abs(skLip.z)<S/2-1){const gy=hAt(skLip.x,skLip.z);deposit(skLip.x,skLip.z,out,sk.loadC,sk.loadMix,dropSpread(skLip.y-gy),sk.loadWet);st.dirty=true;st.slumpT=2.5}
    for(let n=0;n<Math.ceil(out*60);n++)spawn(skLip,0.6);sndIn.skPour=out/dt;
    if(sk.load<0.0005)sk.load=0}
  skLoad.visible=sk.load>0.01;if(skLoad.visible){const s=0.35+0.65*Math.sqrt(sk.load/TU.skCap);skLoad.scale.set(1.6*s,0.45*s,0.6+0.2*s);tintLoad(skLoad.material,sk.loadC)}}
skidReset();
