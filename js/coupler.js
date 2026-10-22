// Corley's Island: the excavator's hydraulic quick coupler and its attachments, and how the bucket meets the ground.
// The coupler rides on the bucket linkage (bucketP) and takes one attachment at a time: the bucket (bkG, excavator.js),
// a thumb (a two-jaw grab that grips blocks), a hammer (breaks rock and hard clay in place, so the bucket then digs it
// as loose fill: ripD, terrain.js) and an auger (bores a round, flat-bottomed hole and throws the spoil round it). Lower
// the coupler onto an attachment on the ground and press the coupler key (or the button) to pick it up; press it again
// with the coupler low to set the one on it down where it is. Which one is on and where the others lie are saved in
// bhd_rigs (save.js, cp). The bucket's angle: teeth leading into the cut dig as deep as they reach; dragged flat or back
// first it only skims a thin layer (TU.bkAngle, TU.bkSkim).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- the bucket's angle in the cut ----------
// the cutting edge's own direction in the bucket's frame (along the lip, between the teeth and the mouth); st.atk is how
// well the motion of the teeth through the ground lines up with it, 0 (back first, sideways, flat) to 1 (teeth first)
const BK_EDGE=new THREE.Vector3(0,-0.55,1).normalize(),bkE=new THREE.Vector3(),bkVel=new THREE.Vector3(),bkPrev=new THREE.Vector3(),bkTip=new THREE.Vector3();
let bkPrevOk=false;
function bkAttack(dt){if(st.atk===undefined)st.atk=1;
  if(bkPrevOk&&dt>0){bkVel.subVectors(tip,bkPrev);const d=bkVel.length();
    // slower than about 2 in a second the teeth are only resting; the last angle holds
    if(d>0.05*dt){bkE.copy(BK_EDGE).applyQuaternion(q);st.atk+=(ss(-0.1,0.6,bkVel.dot(bkE)/d)-st.atk)*Math.min(1,dt*10)}}
  bkPrev.copy(tip);bkPrevOk=true}
// where the bucket cuts to: as deep as the teeth with them leading, only bkSkim under the surface (g) dragged flat
function bkCut(g,dt){const k=1-TU.bkAngle*(1-st.atk),D=TU.bkSkim+(1.6-TU.bkSkim)*k*k;bkTip.copy(tip);bkTip.y=Math.max(tip.y,g-D);
  if(k<0.4&&g-tip.y>D+0.04){cpl.skimT+=dt;if(cpl.skimT>2.5&&!cpl.toldSkim){cpl.toldSkim=true;toast(say('bkSkim'),'',4600)}}
  return bkTip}
// ---------- the coupler and the attachments ----------
const CPL_KINDS=['bucket','thumb','hammer','auger'],CPL_NAME={bucket:'Bucket',thumb:'Thumb',hammer:'Hammer',auger:'Auger',none:'Coupler'};
// the tooth point of each in the coupler's frame (tipMark); parked: turned rx about its length and rz on its side, the
// pin that far off the ground; and where each one lies at first, beside the dig (x, z, heading)
const CPL_TIP={bucket:[0,-0.02,L3+0.18],thumb:[0,-0.74,0.98],hammer:[0,-0.22,1.76],auger:[0,-0.2,2.2],none:[0,-0.1,0.5]};
const CPL_PARK={bucket:{rx:Math.PI,rz:0,h:0.2},thumb:{rx:0,rz:Math.PI/2,h:0.38},hammer:{rx:0,rz:0,h:0.45},auger:{rx:0,rz:0,h:0.45}};
const CPL_HOME={thumb:[4.4,1.6,Math.PI/2],hammer:[4.4,3.2,Math.PI/2],auger:[4.4,4.8,Math.PI/2]};
const cpl={fit:'bucket',park:{},held:null,jaw:0.85,spin:0,hamT:0,spoil:0,spoilT:0,spoilA:0,skimT:0,toldSkim:false,toldNoDig:false,mdlOn:false,g:{bucket:bkG}};
const cplV=new THREE.Vector3(),cplW=new THREE.Vector3();
// the coupler: a hydraulic wedge-lock frame between the stick and the linkage pins
const cplG=new THREE.Group();bucketP.add(cplG);
for(const x of [-0.2,0.2]){box(0.04,0.26,0.6,ORANGE_D,x,0.05,0.2,cplG);pinX(0.05,0.08,STEEL_L,cplG,0,0).position.x=x*1.15;pinX(0.05,0.08,STEEL_L,cplG,0.22,0.25).position.x=x*1.15}
box(0.36,0.1,0.56,STEEL,0,-0.05,0.2,cplG);box(0.4,0.08,0.08,STEEL_L,0,-0.09,0.5,cplG);box(0.4,0.08,0.08,STEEL_L,0,-0.09,-0.06,cplG);
{const c=cyl(0.035,0.035,0.34,16,CHROME,cplG);c.rotation.x=Math.PI/2;c.position.set(0,0.06,0.2);const b=cyl(0.05,0.05,0.2,16,STEEL,cplG);b.rotation.x=Math.PI/2;b.position.set(0,0.06,0.12)}
mergeStatic(cplG,[]);
// the plate every attachment but the bucket carries for the coupler to lock onto
function cplMount(g){box(0.44,0.06,0.6,STEEL,0,-0.13,0.2,g);for(const x of [-0.16,0.16])box(0.05,0.12,0.5,STEEL_L,x,-0.2,0.2,g)}
// the thumb: three fixed tines, and a two-tined thumb on its own pivot that opens and closes on them
const thG=new THREE.Group(),thJaw=new THREE.Group();cplMount(thG);
{const P=t=>[0.25+0.85*t,-0.18-0.22*t-0.4*t*t*t];
  for(const x of [-0.26,0,0.26]){for(let i=0;i<8;i++){const a=P(i/8),b=P((i+1)/8);beam(0.07,0.1,thG,ORANGE_D,a[1],a[0],b[1],b[0]).position.x=x}
    const t=new THREE.Mesh(new THREE.ConeGeometry(0.045,0.16,8),STEEL);t.position.set(x,-0.82,1.12);t.rotation.x=Math.PI*0.62;t.castShadow=true;thG.add(t)}
  box(0.62,0.1,0.12,ORANGE_D,0,-0.22,0.3,thG);
  thJaw.position.set(0,-0.22,0.36);thG.add(thJaw);pinX(0.05,0.62,STEEL_L,thJaw,0,0);
  const J=t=>[0.68*t*t,-0.6*t*(2-t)];
  for(const x of [-0.13,0.13])for(let i=0;i<8;i++){const a=J(i/8),b=J((i+1)/8);beam(0.07,0.1,thJaw,ORANGE,a[1],a[0],b[1],b[0]).position.x=x}
  box(0.34,0.08,0.1,ORANGE,0,-0.3,0.05,thJaw);mergeStatic(thJaw,[])}
mergeStatic(thG,[thJaw]);
// the hammer: a breaker's power cell in a steel housing, its front head and the chisel
const hmG=new THREE.Group();cplMount(hmG);
box(0.44,0.44,0.95,STEEL,0,-0.4,0.7,hmG);for(const x of [-0.235,0.235])box(0.03,0.3,0.75,STEEL_L,x,-0.4,0.7,hmG);
box(0.48,0.06,0.2,ORANGE_D,0,-0.17,0.45,hmG);
{const h=cyl(0.13,0.15,0.2,24,STEEL_L,hmG);h.rotation.x=Math.PI/2;h.position.set(0,-0.4,1.27);
  const c=cyl(0.065,0.065,0.42,20,CHROME,hmG);c.rotation.x=Math.PI/2;c.position.set(0,-0.4,1.55);
  const p=new THREE.Mesh(new THREE.ConeGeometry(0.065,0.16,20),STEEL_L);p.rotation.x=Math.PI/2;p.position.set(0,-0.4,1.84);p.castShadow=true;hmG.add(p)}
mergeStatic(hmG,[]);
// the auger: hydraulic drive head, its flange, and the flighted bit that turns on it
const agG=new THREE.Group(),agBit=new THREE.Group();cplMount(agG);
{const m=cyl(0.17,0.17,0.42,24,ORANGE_D,agG);m.rotation.x=Math.PI/2;m.position.set(0,-0.4,0.5);
  const f=cyl(0.21,0.21,0.06,24,STEEL,agG);f.rotation.x=Math.PI/2;f.position.set(0,-0.4,0.74);
  agBit.position.set(0,-0.4,0.77);agG.add(agBit);
  const s=cyl(0.05,0.05,1.35,16,STEEL_L,agBit);s.rotation.x=Math.PI/2;s.position.z=0.68;
  for(let i=0;i<54;i++){const a=i*0.42,z=0.2+i*0.022,b=box(0.19,0.022,0.07,STEEL_L,0,0,z,agBit);b.position.set(Math.cos(a)*0.145,Math.sin(a)*0.145,z);b.rotation.set(0.25,0,a)}
  const p=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.2,12),STEEL);p.rotation.x=Math.PI/2;p.position.z=1.42;p.castShadow=true;agBit.add(p);mergeStatic(agBit,[])}
mergeStatic(agG,[agBit]);
Object.assign(cpl.g,{thumb:thG,hammer:hmG,auger:agG});
for(const k of ['thumb','hammer','auger'])scene.add(cpl.g[k]);
function cplHome(){cpl.park={};for(const k in CPL_HOME){const h=CPL_HOME[k];cpl.park[k]={x:h[0],z:h[1],yaw:h[2]}}}
cplHome();
// puts each attachment on the coupler or on the ground
function cplPlace(){
  for(const k of CPL_KINDS){const g=cpl.g[k];
    if(k===cpl.fit){if(g.parent!==bucketP){bucketP.add(g)}g.position.set(0,0,0);g.rotation.set(0,0,0)}
    else{if(g.parent!==scene)scene.add(g);const p=cpl.park[k];if(!p){g.visible=false;continue}g.visible=true;const o=CPL_PARK[k];
      g.position.set(p.x,surfAt(p.x,p.z)+o.h,p.z);g.rotation.set(o.rx,p.yaw,o.rz,'YXZ')}}
  tipMark.position.fromArray(CPL_TIP[cpl.fit]||CPL_TIP.none)}
// the parked attachment the coupler is lowered onto, if any
function cplNear(){if(mode!=='dig')return null;bucketP.getWorldPosition(cplV);let best=null,bd=TU.cpReach+0.3;
  for(const k of CPL_KINDS){const p=cpl.park[k];if(k===cpl.fit||!p)continue;
    const d=cplV.distanceTo(cplW.set(p.x,surfAt(p.x,p.z)+CPL_PARK[k].h,p.z));if(d<bd){bd=d;best=k}}
  return best}
function cplLow(){bucketP.getWorldPosition(cplV);return cplV.y-surfAt(cplV.x,cplV.z)<1.6}
const cplKey=id=>padUsed?'':kbUsed?keyLabel(id):id==='grip'?'Grip':'the coupler button';
function cplWhat(k){return say(k==='bucket'?'cpWhatBucket':k==='thumb'?'cpWhatThumb':k==='hammer'?'cpWhatHammer':'cpWhatAuger',{key:cplKey('grip')})}
// the coupler key or button: set the attachment down, or take the one under the coupler
function cplAct(){
  if(mode!=='dig'){toast(say('cpMode'));return}
  if(cpl.fit!=='none'){const near=cplNear();
    if(!cplLow()&&!near){toast(say('cpLow'));return}
    const k=cpl.fit;bucketP.getWorldPosition(cplV);
    // a load still in the bucket spills where it is set down; a gripped block is let go
    if(k==='bucket'&&st.load>0.0005){deposit(mid.x,mid.z,st.load,st.loadC,st.loadMix,1,st.loadWet);st.load=0;st.stuck=0;st.dirty=true;st.slumpT=2.5}
    if(cpl.held){cpl.held=null;blkWake=1.5}
    cpl.park[k]={x:cplV.x,z:cplV.z,yaw:st.yaw+st.swing};cpl.fit='none';cplPlace();dirtThud(cplV,0.5);rumble(160,0.5);
    toast(say('cpDrop',{att:CPL_NAME[k],key:cplKey('coupler')}),'good',3600);return}
  const k=cplNear();if(!k){toast(say('cpFar'));return}
  cpl.fit=k;delete cpl.park[k];cplPlace();rumble(120,0.4);
  toast(say('cpPick',{att:CPL_NAME[k],what:cplWhat(k)}),'good',4200)}
// the grip key or button: the thumb takes the block between its jaws, or lets it go
function cplGrip(){
  if(mode!=='dig'){toast(say('cpMode'));return}
  if(cpl.fit!=='thumb'){toast(say('cpGripNo',{key:cplKey('coupler')}));return}
  if(cpl.held){cpl.held=null;blkWake=1.5;return}
  let best=null,top=-1e9;
  for(const b of blocks){const t=b.y+b.h;if(Math.abs(tip.x-b.x)<b.w/2+0.2&&Math.abs(tip.z-b.z)<b.d/2+0.2&&tip.y>b.y-0.3&&tip.y<t+0.6&&t>top){top=t;best=b}}
  if(!best){toast(say('cpGripNone'));return}
  if(Math.max(best.w,best.d,best.h)>TU.cpGrip+0.01){toast(say('cpGripBig',{size:blkFt(best)}));return}
  cpl.held=best;best.vy=0;rumble(100,0.3);toast(say('cpGripped',{key:cplKey('grip')}),'good',3200)}
// the arm's give in the ground with this attachment: the hammer and the auger get through hard ground faster than the
// bucket; a bare coupler or the thumb pushed into the ground barely moves
function cplRes(res){const f=cpl.fit;
  if(f==='hammer'){const k=Math.round(gJ(tip.z))*V+Math.round(gI(tip.x)),deep=H[k]-tip.y;return deep>0.45?0.05:Math.min(1,res*TU.cpHammer)}
  if(f==='auger')return Math.min(1,res*TU.cpAuger);
  if(f==='thumb'||f==='none')return Math.min(res,0.3);
  return res}
// the attachment working under the ground (the bucket digs in main.js)
function cplWork(dt){const f=cpl.fit;
  if(f==='hammer'){
    // the chisel breaks the ground round it a little below its point, once: broken rock bulks up a little where it lies
    const r=0.38,i0=Math.max(0,Math.floor(gI(tip.x-r))),i1=Math.min(N,Math.ceil(gI(tip.x+r))),j0=Math.max(0,Math.floor(gJ(tip.z-r))),j1=Math.min(N,Math.ceil(gJ(tip.z+r)));let any=0;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i;if(digKeep[k])continue;const d=Math.hypot(gX(i)-tip.x,gZ(j)-tip.z);if(d>r)continue;
      const depth=H0[k]-tip.y+0.1*(1-d/r),fresh=depth-Math.max(ripD[k],H0[k]-H[k]);if(fresh<=0.02)continue;
      const m=matAt(k,H0[k]-depth),dh=Math.min(fresh,0.3)*0.12*(0.6+0.4*hash(i*1.3,j*2.1));H[k]+=dh;mixSpoil(k,matColor(k,m),dh);comp[k]=0;ripD[k]=Math.max(ripD[k],depth);any+=fresh}
    if(any){touch(i0,i1,j0,j1);st.dirty=true;st.slumpT=Math.max(st.slumpT,1)}
    cpl.hamT-=dt;if(cpl.hamT<=0){cpl.hamT=0.11;dirtThud(tip,0.25+Math.min(0.5,any*3));rumble(70,0.6);dustPuff(tip.x,hAt(tip.x,tip.z)+0.15,tip.z,0.6,digC);if(Math.random()<0.5)spawn(tip,0.6)}
    return}
  if(f==='auger'){
    const got=dig(tip,1,{r:TU.cpBore/2,flat:true});
    if(got>0){statDug(got);st.dirty=true;st.slumpT=2.5;cpl.spoil+=got;cpl.spoilC=digC.slice();cpl.spoilM=digMix.slice()}
    return}
  if(!cpl.toldNoDig){cpl.toldNoDig=true;toast(say('cpNoDig',{att:CPL_NAME[f].toLowerCase(),key:cplKey('coupler')}),'',3600)}}
// every frame, before the digging: the bucket's angle, the parked attachments on the ground under them, the thumb's
// jaw and its block, the auger turning and throwing its spoil out round the hole, and the buttons
function cplTick(dt){
  if(!cpl.placed){cpl.placed=true;cplPlace()}
  bkAttack(dt);
  if(cpl.mdlOn!==mdl.on){cpl.mdlOn=mdl.on;for(const g of [cplG,thG,thJaw,hmG,agG,agBit])mdlRemat(g,mdl.on)}
  for(const k of CPL_KINDS){const p=cpl.park[k];if(k===cpl.fit||!p)continue;cpl.g[k].position.y=surfAt(p.x,p.z)+CPL_PARK[k].h}
  if(cpl.held&&(cpl.fit!=='thumb'||!blocks.includes(cpl.held)))cpl.held=null;
  const b=cpl.held;
  if(b){b.x=tip.x;b.z=tip.z;b.y=Math.max(blkGround(b.x,b.z,b.w,b.d),tip.y-b.h*0.6);b.vy=0;blkWake=Math.max(blkWake,0.05)}
  thJaw.rotation.x+=((b?0.12:0.85)-thJaw.rotation.x)*Math.min(1,dt*6);
  const boring=cpl.fit==='auger'&&st.below&&!bench.on;cpl.spin=boring?Math.min(1,cpl.spin+dt*3):Math.max(0,cpl.spin-dt);agBit.rotation.z-=cpl.spin*9*dt;
  hmG.position.z=cpl.fit==='hammer'&&st.below&&!bench.on?Math.sin(performance.now()*0.09)*0.018:0;
  // the flights carry the spoil up and out round the hole, a little at a time
  cpl.spoilT-=dt;if(cpl.spoil>0.002&&cpl.spoilT<=0){cpl.spoilT=0.3;cpl.spoilA+=2.1;const R=TU.cpBore/2+0.5;
    deposit(tip.x+Math.cos(cpl.spoilA)*R,tip.z+Math.sin(cpl.spoilA)*R,cpl.spoil,cpl.spoilC,cpl.spoilM,0.6,0);cpl.spoil=0}
  cplUI()}
const cplBtn=$('#cplBtn'),gripBtn=$('#gripBtn');
function cplUI(){const dig=mode==='dig'&&!bench.on,near=dig?cplNear():null,show=dig&&(!!near||cpl.fit!=='none'&&cplLow());
  if(cplBtn.hidden===show)cplBtn.hidden=!show;
  if(show){const t=cpl.fit!=='none'?'Set down '+CPL_NAME[cpl.fit].toLowerCase():'Pick up '+CPL_NAME[near].toLowerCase();if(cplBtn.textContent!==t)cplBtn.textContent=t}
  const g=dig&&cpl.fit==='thumb';if(gripBtn.hidden===g)gripBtn.hidden=!g;
  if(g){const t=cpl.held?'Let go':'Grip';if(gripBtn.textContent!==t){gripBtn.textContent=t;gripBtn.setAttribute('aria-pressed',!!cpl.held)}}}
cplBtn.onclick=cplAct;gripBtn.onclick=cplGrip;
// saved in bhd_rigs: which is on, and where each of the others lies
function cplSave(){const p={};for(const k in cpl.park){const o=cpl.park[k];p[k]=[+o.x.toFixed(3),+o.z.toFixed(3),+o.yaw.toFixed(4)]}return {f:cpl.fit,p}}
function cplLoad(d){if(!d||typeof d!=='object')return;
  const f=CPL_KINDS.includes(d.f)||d.f==='none'?d.f:'bucket',park={};
  if(d.p&&typeof d.p==='object')for(const k of CPL_KINDS){const v=d.p[k];if(k!==f&&Array.isArray(v)&&v.length===3&&v.every(isFinite))park[k]={x:v[0],z:v[1],yaw:v[2]}}
  // an attachment the save lost goes back to its spot by the dig (the bucket where the coupler is)
  for(const k of CPL_KINDS)if(k!==f&&!park[k]){const h=CPL_HOME[k]||[st.x+3,st.z+3,0];park[k]={x:h[0],z:h[1],yaw:h[2]}}
  cpl.fit=f;cpl.park=park;cpl.held=null;cpl.placed=false}
// a new site: the bucket back on, the others back by the dig
function cplReset(){cpl.fit='bucket';cpl.held=null;cplHome();cpl.placed=false}
function cplSig(){let s=CPL_KINDS.indexOf(cpl.fit)+1;for(const k in cpl.park){const o=cpl.park[k];s+=o.x*3+o.z*7+o.yaw*11}return s}
