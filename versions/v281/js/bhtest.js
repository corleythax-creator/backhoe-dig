// Corley's Island: load tests, for the backhoe and the excavator. Hands off: ☰ → Backhoe load test or Excavator load
// test, or open the game with ?bhtest or ?extest (=low, medium or high for that Graphics setting). From the machine's cab
// it does what a player does with the sticks: climbs in (the backhoe swivels its seat round to the hoe and puts its
// outriggers down), works each arm control in turn to check it moves the right way at its tuned rate, then digs, swings
// and dumps into the dump truck parked alongside, pass after pass. At each dump the camera leaves the cab and comes
// round behind the truck to watch the bucket pour out until it is empty, then goes back to the seat. The sticks are
// driven by an autopilot through the touch sticks (SL, SR), so every input goes the player's way: main.js turns them
// into the machine's inputs (the excavator's arm in main.js itself, the backhoe's through hvTick and bhTick). It times
// each pass, measures what each bucket held and what reached the bed, and the frame rate of each part, then the page
// reloads (nothing is saved while it runs: bench.on) and shows the results in the speed test's panel.
// ldTestRun('bh' or 'ex') runs the same script headless, through the game's own frame without drawing it:
//   NODE_PATH=$(npm root -g) node tools/play.js --eval "return ldTestRun('ex')"
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// where it works: the machine on the east lawn, digging east, the truck parked alongside on its north side, parallel to
// it, the middle of its bed at bed (x right, z forward of the machine's swing centre, m); r: how far out the dig starts
// from the swing centre; rIn: how close in the drag stops; mouth: how far the bucket's mouth faces up as it digs; lift: how high the carried load rides over the bed floor; BHT_CUT: how deep the teeth bite
const BHT_CUT=0.35,BHT_PASSES=6,BHT_CYCLE=30;
// each machine: the rates of its four arm controls (swing, stick, boom, bucket) in TUNE, how the sticks work them
// (main.js), where it stands, where the truck goes, and how to read and set its arm
const LDT={
  bh:{name:'Backhoe',J:['sw','hs','hb','hk'],R:['bhSwing','bhStick','bhBoom','bhBucket'],S:[-1,1,-1,-1],site:{x:58,z:4,yaw:-Math.PI/2},bed:[-3.4,-1.1],r:3.7,rIn:1.6,lift:1.5,mouth:0.15,
    names:['Swing (left stick, left and right)','Stick out and in (left stick, up and down)','Boom up and down (right stick, up and down)','Bucket curl and dump (right stick, left and right)'],
    o:()=>bhtH(),lim:k=>BH_LIM[k],cap:()=>TU.bhCap,load:()=>bhtH().hl.load,frame:()=>bhtH().g,king:()=>BH_SW[1],
    set(j){const h=bhtH();Object.assign(h,j);hvPose(h)},tip:v=>bhtH().parts.hoe.localToWorld(v.set(...BH_TIP)),mid:v=>bhtH().parts.hoe.localToWorld(v.set(...BH_MID)),
    up(){bhtH().parts.hoe.getWorldQuaternion(bhtQ);return bhtV.set(0,0.26,0.97).applyQuaternion(bhtQ).y}},
  ex:{name:'Excavator',J:['swing','a2','a1','a3'],R:['exSwing','exStick','exBoom','exBucket'],S:[-1,1,-1,1],site:{x:56,z:4,yaw:Math.PI/2},bed:[5.4,1.2],r:6.2,rIn:3.0,lift:2.0,mouth:0.15,
    names:['Swing (left stick, left and right)','Stick out and in (left stick, up and down)','Boom up and down (right stick, up and down)','Bucket curl and dump (right stick, left and right)'],
    o:()=>st,lim:k=>k==='swing'?[-1e9,1e9]:LIM[k],cap:()=>TU.exCap,load:()=>st.load,frame:()=>machine,king:()=>0,
    set(j){Object.assign(st,j);house.rotation.y=st.swing;boomP.rotation.x=-st.a1;stickP.rotation.x=-st.a2;bucketP.rotation.x=-st.a3;machine.updateMatrixWorld(true)},
    tip:v=>tipMark.getWorldPosition(v),mid:v=>midMark.getWorldPosition(v),up(){bucketP.getWorldQuaternion(bhtQ);return bhtV.set(0,-1,0).applyQuaternion(bhtQ).y}}};
// fill: how full the autopilot digs the bucket before lifting (0.97; over 1 to heap it and dig on into a spill)
const bht={fill:0.97,on:false,headless:false,kind:'bh',ph:'',t:0,pt:0,pass:0,passes:[],checks:[],parts:[],lastNow:0,u:[0,0,0,0],x0:0,z0:0,camK:0};
const bhtYd=m=>(m*1.308).toFixed(2)+' cu yd',bhtDeg=r=>Math.round(r*180/Math.PI)+'°';
function bhtH(){return hvs.find(h=>h.K.hoe)}
function bhtM(){return LDT[bht.kind]}
function bhtCheck(name,ok,note){bht.checks.push({name,ok:!!ok,note})}
const bhtV=new THREE.Vector3(),bhtW=new THREE.Vector3(),bhtQ=new THREE.Quaternion(),bhtC=new THREE.Vector3(),bhtL=new THREE.Vector3();
// the bucket's teeth or the middle of its load (pt 'tip' or 'mid') in world (w) and in the machine's frame from its
// swing centre (l), its reach out from that centre (r), and how far its mouth faces up
function bhtAt(pt){const M=bhtM(),w=M[pt](new THREE.Vector3()),l=M.frame().worldToLocal(w.clone());l.z-=M.king();return {w,l,r:Math.hypot(l.x,l.z),up:M.up()}}
const bhtArm=()=>{const M=bhtM(),o=M.o(),j={};for(const k of M.J)j[k]=o[k];return j};
// the boom and stick that put pt at reach r and height y in the machine's frame, swung to sw with the bucket at bk,
// found by trying them all; the arm is put back as it was
function bhtSolve(pt,sw,bk,r,y){const M=bhtM(),[S,K,B,C]=M.J,keep=bhtArm(),lk=M.lim(K),lb=M.lim(B);let best=null;
  for(let b=lb[0];b<=lb[1];b+=0.04)for(let k=lk[0];k<=lk[1];k+=0.04){M.set({[S]:sw,[B]:b,[K]:k,[C]:bk});const a=bhtAt(pt),e=(a.r-r)**2+(a.l.y-y)**2;if(!best||e<best.e)best={[B]:b,[K]:k,e}}
  M.set(keep);return best}
// the bucket angle at an arm pose whose mouth faces up nearest `up` (or the most, or the least, for 'max' and 'min')
function bhtCurl(j,up){const M=bhtM(),C=M.J[3],lc=M.lim(C),keep=bhtArm();let best=null;
  for(let c=lc[0];c<=lc[1];c+=0.05){M.set(Object.assign({},j,{[C]:c}));const u=M.up(),e=up==='max'?-u:up==='min'?u:Math.abs(u-up);if(!best||e<best.e)best={c,e}}
  M.set(keep);return best.c}
// how a point moves as each control is raised a little: +1 if it goes the way asked, -1 if the other
function bhtSign(j,k,f){const M=bhtM(),keep=bhtArm();M.set(j);const a=f();M.set(Object.assign({},j,{[k]:j[k]+0.05}));const b=f();M.set(keep);return Math.sign(b-a)||1}
function bhtGround(w){return bhtM().frame().worldToLocal(bhtV.set(w.x,hAt(w.x,w.z),w.z)).y}

function ldTestStart(kind){
  if(bench.on||edOn||!LDT[kind])return;const M=LDT[kind];bht.kind=kind;
  // whatever the player did last is saved first; nothing is saved from here until the page reloads
  siteSaveAll();
  bench.on=true;bench.kind='load';bench.t=0;bench.pr=0;bench.barT=0;viewDirty=true;help.hidden=true;$('#bench').hidden=true;$('#benchBar').hidden=false;
  Object.assign(bht,{on:true,ph:'in',t:0,pt:0,pass:0,passes:[],checks:[],lastNow:0,u:[0,0,0,0],camK:0,seatT:0,outT:0});
  bht.parts=[`Climbing in${kind==='bh'?', swivelling to the hoe':''}`,'Control check','Swinging back to dig','Digging','Swinging to the truck','Dumping into the truck'].map(name=>({name,ft:[],tris:0,k:0}));
  const S=M.site;
  if(kind==='bh'){// the backhoe set down parked, empty and at the wheel
    const h=bhtH(),i=hvs.indexOf(h);Object.assign(h,{x:S.x,z:S.z,yaw:S.yaw,ty:S.yaw,mv:S.yaw,v:0,w:0,steer:0});bhReset(h);h.load=0;hvGround(h,1);hvPose(h);
    hvI=i;wk.inside='hv'+i;setMode('heavy')}
  else{// the excavator set down with its bucket on and empty, the arm up
    if(cpl.fit!=='bucket'){cplReset();if(typeof cplPlace==='function')cplPlace()}
    Object.assign(st,{x:S.x,z:S.z,yaw:S.yaw,y:hAt(S.x,S.z),stuck:0,sink:0,load:0,swing:0,a1:0.75,a2:-1.45,a3:-1.6});wk.inside='ex';setMode('dig');
    machine.position.set(st.x,st.y,st.z);machine.rotation.set(0,st.yaw,0);M.set({})}
  bhtTimeOn();camSet('cab');fpReset();digTilesTick(0);const o=M.o();bht.x0=o.x;bht.z0=o.z;
  // the truck alongside, empty, its bed in the arm's swing
  const f=M.frame();f.updateMatrixWorld(true);const B=f.localToWorld(new THREE.Vector3(M.bed[0],0,M.bed[1]+M.king()));
  Object.assign(tr,{yaw:o.yaw,v:0,spin:0,steer:0,bed:0,load:0,stuck:0,gear:1,brakeOn:true});tr.x=B.x+Math.sin(o.yaw)*1.55;tr.z=B.z+Math.cos(o.yaw)*1.55;
  for(let n=0;n<3;n++){updateTruck(0.05,0,0,0);tr.v=0;bedG.updateWorldMatrix(true,false);const c=bedG.localToWorld(bhtW.set(0,0,BED_L/2));tr.x+=B.x-c.x;tr.z+=B.z-c.z}
  if(kind==='ex')bhtPlan()}
// the dig and dump poses (for the backhoe once it stands level on its outriggers), and which way each control moves the bucket
function bhtPlan(){const M=bhtM(),[S,K,B,C]=M.J,f=M.frame(),cap=M.cap();
  // which way round swinging goes: the bucket's bearing in the machine's frame at swing 0
  const keep=bhtArm();M.set(Object.assign({},keep,{[S]:0}));const a0=bhtAt('tip');const b0=Math.atan2(a0.l.x,a0.l.z);M.set(keep);
  const swTo=l=>{let s=Math.atan2(l.x,l.z)-b0;while(s>Math.PI)s-=2*Math.PI;while(s<-Math.PI)s+=2*Math.PI;return s};
  // dig: straight out from the swing centre (swing 0), the teeth just over the ground at reach r, the mouth a little up
  const dl=new THREE.Vector3(Math.sin(b0)*M.r,0,Math.cos(b0)*M.r+M.king()),dw=f.localToWorld(dl.clone()),gy=bhtGround(dw);
  const d=bhtSolve('tip',0,keep[C],M.r,gy+0.25);d[S]=0;d[C]=bhtCurl(d,M.mouth);
  // dump: swung over the middle of the bed, the load `lift` over the bed floor, the bucket curled to hold it
  bedG.updateWorldMatrix(true,false);const c=bedG.localToWorld(new THREE.Vector3(0,0,BED_L/2)),l=f.worldToLocal(c.clone());l.z-=M.king();
  const sw=swTo(l),r=Math.hypot(l.x,l.z);let u={[S]:sw,[C]:keep[C]};Object.assign(u,bhtSolve('mid',sw,keep[C],r,l.y+M.lift));u[C]=bhtCurl(u,'max');
  Object.assign(u,bhtSolve('mid',sw,u[C],r,l.y+M.lift));u[S]=sw;
  const lc=M.lim(C),hold=u[C],dump=bhtCurl(u,'min');
  bht.dig=d;bht.dump=u;bht.hold=hold;bht.dumpC=dump;bht.floor=l.y;bht.digW=dw;bht.b0=b0;
  bht.upS=bhtSign(d,C,()=>M.up());bht.boomS=bhtSign(d,B,()=>bhtAt('tip').w.y);bht.stickS=bhtSign(d,K,()=>bhtAt('tip').r);
  bht.dragEnd=bht.stickS>0?M.lim(K)[0]+0.1:M.lim(K)[1]-0.1}
// the autopilot's hands: each control's speed (-1..1, + raises its value) turned into the sticks as the player's thumbs
// give them (main.js: left x swings, left y works the stick, right y the boom, right x the bucket)
function bhtSticks(u){const S=bhtM().S,Ts=turnSens||1;SL.x=clamp(S[0]*u[0]/Ts,-1,1);SL.y=clamp(S[1]*u[1],-1,1);SR.y=clamp(S[2]*u[2],-1,1);SR.x=clamp(S[3]*u[3],-1,1)}
const bhtTo=(v,t,g)=>clamp((t-v)*(g||4),-1,1);
function bhtGo(ph){bht.ph=ph;bht.pt=0}
// one step of the script
function bhtStep(dt){const M=bhtM(),o=M.o(),[S,K,B,C]=M.J,u=[0,0,0,0];bench.t+=dt;bht.t+=dt;bht.pt+=dt;const cap=M.cap(),load=M.load();
  if(bht.ph==='in'){if(bht.pt>1){if(bht.kind==='bh'){bhSwap();bhtGo('swap')}else{bht.cj=0;bht.cs=null;bhtGo('ctl')}}}
  else if(bht.ph==='swap'){const h=o;
    if(h.seat>=0.999&&!bht.seatT)bht.seatT=bht.pt;if(h.out>=0.999&&!bht.outT)bht.outT=bht.pt;
    // the drive stick pushed while it swivels and stands on its outriggers: it must not move
    u[1]=1;
    if(bht.seatT&&bht.outT&&bht.pt>bht.outT+0.4||bht.pt>8){const ok=(m,w)=>m&&Math.abs(m-w)<=w*0.2+0.1;
      bhtCheck('The seat swivels round to the hoe',h.hoe&&ok(bht.seatT,TU.bhSeatT),bht.seatT?`in ${bht.seatT.toFixed(1)} s (tuned ${TU.bhSeatT.toFixed(1)} s)`:'not round in 8 s');
      bhtCheck('The outriggers come down',ok(bht.outT,TU.bhOutT),bht.outT?`in ${bht.outT.toFixed(1)} s (tuned ${TU.bhOutT.toFixed(1)} s)`:'not down in 8 s');
      bhtPlan();bht.cj=0;bht.cs=null;bhtGo('ctl')}}
  else if(bht.ph==='ctl'){
    // each arm control in turn, full stick away from its nearer stop for 0.8 s and back for 0.8 s; its speed is taken
    // from 0.2 s to 0.7 s in, once the input has reached it
    const j=bht.cj,k=M.J[j],lim=M.lim(k),v=o[k];
    if(!bht.cs)bht.cs={d:v-lim[0]>lim[1]-v?-1:1,m:[]};const c=bht.cs,seg=Math.floor(bht.pt/0.8),f=bht.pt-seg*0.8;
    if(seg<2){u[j]=seg?-c.d:c.d;if(f>=0.2&&!c.m[seg*2])c.m[seg*2]=[v,bht.pt];if(f>=0.7&&!c.m[seg*2+1])c.m[seg*2+1]=[v,bht.pt]}
    else{const want=TU[M.R[j]],r=c.m.length===4?[(c.m[1][0]-c.m[0][0])/(c.m[1][1]-c.m[0][1]),(c.m[3][0]-c.m[2][0])/(c.m[3][1]-c.m[2][1])]:[0,0];
      const way=r[0]*c.d>0&&r[1]*c.d<0,good=way&&Math.abs(Math.abs(r[0])-want)<=want*0.15&&Math.abs(Math.abs(r[1])-want)<=want*0.15;
      bhtCheck(M.names[j],good,`${bhtDeg(Math.abs(r[0]))}/s and ${bhtDeg(Math.abs(r[1]))}/s back${way?'':' (the wrong way)'}, tuned ${bhtDeg(want)}/s`);
      bht.cj++;bht.cs=null;bht.pt=0;if(bht.cj>=4){if(bht.kind==='bh'){bht.ld=o.a;bht.lc=o.c}bhtPass()}}}
  else{
    const P=bht.passes[bht.pass-1],tip=bhtAt('tip'),g=hAt(tip.w.x,tip.w.z),D=bht.dig,U=bht.dump,sw0=Math.abs(o[S]-D[S]);
    if(bht.ph==='reach'){u[0]=bhtTo(o[S],D[S]);u[1]=bhtTo(o[K],D[K]);u[2]=bhtTo(o[B],D[B]);u[3]=bhtTo(o[C],D[C]);
      if(sw0<0.05&&Math.abs(o[K]-D[K])<0.08&&Math.abs(o[B]-D[B])<0.08&&Math.abs(o[C]-D[C])<0.1||bht.pt>8){P.reach=bht.pt;bhtGo('plunge')}}
    else if(bht.ph==='plunge'){u[2]=-0.7*bht.boomS;u[3]=bht.upS*bhtTo(tip.up,M.mouth,3);if(tip.w.y<g-BHT_CUT||load>0.02*cap||bht.pt>4)bhtGo('drag')}
    // pull the stick in with the teeth held BHT_CUT under the ground, curling the bucket up as it fills
    else if(bht.ph==='drag'){u[1]=-0.8*bht.stickS;u[2]=clamp(-(tip.w.y-(g-BHT_CUT))*3,-1,1)*bht.boomS;u[3]=bht.upS*bhtTo(tip.up,M.mouth+0.5*load/cap,3);
      if(load>=cap*(bht.fill||0.97)||(bht.stickS>0?o[K]<=bht.dragEnd:o[K]>=bht.dragEnd)||tip.r<M.rIn||bht.pt>8){P.dig=bht.pt;P.got=load;bhtGo('curl')}}
    else if(bht.ph==='curl'){u[3]=bhtTo(o[C],bht.hold);u[2]=bht.boomS*(Math.abs(o[C]-bht.hold)<0.6?1:0.3);if(tip.w.y>g+0.5&&Math.abs(o[C]-bht.hold)<0.3||bht.pt>4){P.curl=bht.pt;bhtGo('out')}}
    // swing out once the bucket clears the bed's sides, reaching to the dump pose as it goes
    else if(bht.ph==='out'){const mid=bhtAt('mid'),clear=mid.l.y>bht.floor+1.0;u[0]=clear?bhtTo(o[S],U[S]):0;u[1]=bhtTo(o[K],U[K]);u[2]=bhtTo(o[B],U[B]);u[3]=bhtTo(o[C],bht.hold);
      if(Math.abs(o[S]-U[S])<0.05&&Math.abs(o[K]-U[K])<0.08&&Math.abs(o[B]-U[B])<0.08||bht.pt>10){P.out=bht.pt;P.held=load;P.tr0=tr.load;bhtGo('dump')}}
    // tip the bucket right over and hold it there till it is empty, then a moment more to see it so; clay still in it
    // after 1.5 s is shaken out, rocking the bucket against its stop
    else if(bht.ph==='dump'){const dir=Math.sign(bht.dumpC-bht.hold)||1;u[3]=bht.pt>1.5&&load>=0.003*cap?(Math.floor(bht.pt/0.3)%2?-dir:dir):bhtTo(o[C],bht.dumpC,6);u[0]=bhtTo(o[S],U[S]);
      if(load<0.003*cap&&!P.emptyT)P.emptyT=bht.pt;
      if(P.emptyT&&bht.pt>P.emptyT+0.8||bht.pt>8){P.dump=bht.pt;P.left=load;P.inBed=tr.load-P.tr0;P.t=bht.t-P.t0;if(bht.pass>=BHT_PASSES){bhtFinish();return false}bhtPass()}}}
  bht.u=u;return true}
function bhtPass(){bht.pass++;bht.passes.push({t0:bht.t});bhtGo('reach')}
// the checks from the loading
function bhtFinish(){const M=bhtM(),o=M.o(),ps=bht.passes,cap=M.cap(),n=ps.length;
  const full=ps.filter(p=>p.got>=cap*0.8).length,held=ps.reduce((a,p)=>a+p.held,0),got=ps.reduce((a,p)=>a+p.inBed,0),lost=ps.reduce((a,p)=>a+Math.max(0,p.held-p.inBed-p.left),0);
  bhtCheck('Fills the bucket every pass',full===n,`${full} of ${n} passes${n?', '+Math.round(100*ps.reduce((a,p)=>a+p.got,0)/n/cap)+'% of a '+bhtYd(cap)+' bucket on average':''}`);
  bhtCheck('Dumps into the truck bed',held>0&&got>=held*0.9,`${bhtYd(got)} of ${bhtYd(held)} carried landed in the bed${lost>0.001?', '+bhtYd(lost)+' spilled':''}`);
  bhtCheck('The bucket empties over the bed',ps.every(p=>p.left<=cap*0.05),`${bhtYd(Math.max(0,...ps.map(p=>p.left)))} left in it at most`);
  // the hole: the deepest point along the dig line, out from the swing centre
  const f=M.frame();let dd=0;for(let r=1.2;r<=M.r+0.6;r+=0.2){const w=f.localToWorld(bhtV.set(Math.sin(bht.b0)*r,0,Math.cos(bht.b0)*r+M.king()));
    if(inDig(w.x,w.z)){const k=Math.round(gJ(w.z))*V+Math.round(gI(w.x));dd=Math.max(dd,H0[k]-H[k])}}
  bhtCheck('Digs a hole',dd>0.3,`${ftIn(dd)} deep`);
  const mv=Math.hypot(o.x-bht.x0,o.z-bht.z0);bhtCheck(bht.kind==='bh'?'Stays put on its outriggers':'Stays put on its tracks',mv<0.05,`moved ${ftIn(mv)}`);
  if(bht.kind==='bh')bhtCheck('The loader stays still at the hoe',Math.abs(o.a-bht.ld)<1e-4&&Math.abs(o.c-bht.lc)<1e-4,'with the right stick working the hoe');
  const cyc=n?ps.reduce((a,p)=>a+p.t,0)/n:0;bht.cyc=cyc;bht.per=n?got/n:0;
  bhtCheck(`A pass takes under ${BHT_CYCLE} s`,cyc>0&&cyc<BHT_CYCLE,`${cyc.toFixed(1)} s on average, dig to dump and back`);
  // a freeze is judged only when frames are drawn (not headless, where the browser stalls on its own), and the test's own
  // pose finding (bhtPlan) is not the game's
  const long=(bht.hitches||[]).filter(h=>h.ms>=BHT_LONG*1000&&!h.own);
  if(!bht.headless)bhtCheck(`No freeze over ${BHT_LONG} s`,!long.length,long.length?`${long.length} freeze${long.length>1?'s':''}, the first ${bhtHitchTxt(long[0])}`:'none');
  bht.ph='done';bht.on=false}

function bhtTick(dt){if(bht.freeze){bhtSticks([0,0,0,0]);return}if(bht.ph==='done'){if(!bht.headless)bhtEnd();return}
  if(!bhtStep(dt)){if(!bht.headless)bhtEnd();return}bhtSticks(bht.u)}
// the camera: in the cab, the operator looking at the bucket; at each dump it eases out of the cab round behind the
// truck's tailgate, up over the bed, to watch the bucket pour until it is empty, and back to the seat as the arm swings back
function bhtCam(){if(bht.ph==='in'&&bht.pt<0.05)return;const M=bhtM(),m=M.mid(bhtC);
  const want=bht.ph==='dump'||bht.ph==='out'&&bht.pt>0.5&&Math.abs(M.o()[M.J[0]]-(bht.dump?bht.dump[M.J[0]]:0))<0.5?1:0,dt=Math.min(0.05,Math.max(0.001,bht.camDt||0.016));
  bht.camK+=(want-bht.camK)*Math.min(1,dt*(want?1.6:2.4));const k=bht.camK*bht.camK*(3-2*bht.camK);
  look.lerp(m,0.6);
  if(k>0.002){bedG.updateWorldMatrix(true,false);const back=bedG.localToWorld(bhtW.set(0,0,-1.6)),c=bedG.localToWorld(bhtL.set(0,0,BED_L/2));
    // behind the tailgate and a little out to the far side, 13 ft over the bed floor
    const px=back.x+(back.x-c.x)*0.6+(c.x-M.o().x)*0.25,pz=back.z+(back.z-c.z)*0.6+(c.z-M.o().z)*0.25,py=Math.max(c.y+4,surfAt(px,pz)+1.5);
    camera.position.lerp(bhtV.set(px,py,pz),k);look.lerp(m,k)}
  camera.lookAt(look)}
// ---------- freezes ----------
// while a test runs the frame's big parts are each timed (wrapped in place: game scripts call them by their global
// name), and a frame that takes over BHT_HITCH s is kept with its slowest parts and whatever it had to get ready for
// the first time: a new shader program (three.js builds one the first time a kind of material is drawn), a texture or
// a mesh sent to the graphics card. BHT_LONG: a freeze the player feels, which fails the test
const BHT_HITCH=0.2,BHT_LONG=0.5,BHT_TIMED={postRender:'Drawing the frame',updateTerrain:'Rebuilding the dug ground',updateTufts:'Grass on the dug ground',
  dig:'Digging',deposit:'Dumping on the ground',pourStream:'The pour stream',spawn:'Flying dirt',dropMix:'Clods',dustPuff:'Dust',slopeTick:'Slopes settling',caveTick:'Cave-ins',
  digTilesTick:'Moving the dig grid',updateTruck:'The truck',hvTick:'Heavy machines',mudTick:'Mud',rainTick:'Rain',grassTick:'Grass',waterTick:'Water',updateSound:'Sound',
  dirtSndTick:'Dirt sounds',dirtThud:'Dump thud',shadowProxyTick:'Shadows',lawnLod:'Lawn detail',tuftLod:'Grass detail',rainCover:'Rain cover',treesTick:'Trees',mainTick:'Gas main',
  updateWalker:'The worker',updateSkid:'Skid steer',updateMower:'Mower',boatTick:'Boats',bikeTick:'Dirt bike',updateRams:'Rams',updateHoses:'Hoses',updateLinkage:'Linkage',
  blkTick:'Blocks',cplTick:'Coupler',updateBox:'Trench box',fpTick:'Cab view',statTick:'Stats',bhtPlan:'The test working out its poses'};
const bhtOrig={};
function bhtTimeOn(){bht.sec={};bht.hitches=[];bht.progs=new Set(renderer.info.programs||[]);bht.mem=Object.assign({},renderer.info.memory);
  for(const n in BHT_TIMED){const f=window[n];if(typeof f!=='function'||bhtOrig[n])continue;bhtOrig[n]=f;
    window[n]=function(){const t=performance.now();try{return f.apply(this,arguments)}finally{bht.sec[n]=(bht.sec[n]||0)+performance.now()-t}}}}
// what this frame got ready for the first time
// which object a new shader program was built for: its name, or its parent's, or its kind and colour
function bhtWho(prog){let who=null;scene.traverse(o=>{if(who||!o.material)return;for(const m of [].concat(o.material)){const pr=renderer.properties.get(m);
    if(pr&&pr.currentProgram===prog){let n=o,s='';while(n&&!s){s=n.name;n=n.parent}who=(s?s+' ':'')+o.type+(m.color?' #'+m.color.getHexString():'')+(o.visible?'':' (hidden)');return}}});return who}
function bhtNew(){const ps=renderer.info.programs||[],np=[];for(const p of ps)if(!bht.progs.has(p)){bht.progs.add(p);const w=bhtWho(p);np.push((p.name||String(p.cacheKey||'').split(',')[0])+(w?' for '+w:''))}
  const m=renderer.info.memory,o=bht.mem,r={prog:np,tex:Math.max(0,m.textures-o.textures),geo:Math.max(0,m.geometries-o.geometries)};bht.mem=Object.assign({},m);return r}
function bhtHitch(ft,part){const sec=bht.sec;bht.sec={};const nw=bhtNew();if(ft<BHT_HITCH&&!bht.logAll)return;
  const top=Object.keys(sec).filter(n=>sec[n]>=5).sort((a,b)=>sec[b]-sec[a]).slice(0,4).map(n=>[BHT_TIMED[n],Math.round(sec[n])]);
  // (some timed parts run inside others, so this undercounts the time outside them: it errs low)
  const work=Object.keys(sec).reduce((a,n)=>a+sec[n],0),h={ms:Math.round(ft*1000),part,pass:bht.pass,top,...nw,gpu:Math.max(0,Math.round(ft*1000-work)),own:(sec.bhtPlan||0)>=ft*500};if(ft>=BHT_HITCH)bht.hitches.push(h);if(bht.logAll)(bht.log||(bht.log=[])).push(h)}
const bhtHitchTxt=h=>`${(h.ms/1000).toFixed(1)} s${h.pass?' in pass '+h.pass:''}, ${h.part}${h.own?' (the test\'s own setup, not counted)':''}: `+(h.top.length?h.top.map(([n,ms])=>`${n} ${ms} ms`).join(', '):'no timed part stood out')+(h.gpu>=100?`, the browser and graphics card ${h.gpu} ms outside the game's code`:'')+
  (h.prog.length?`; ${h.prog.length} new shader${h.prog.length>1?'s':''} (${h.prog.join(', ')})`:'')+(h.tex?`; ${h.tex} texture${h.tex>1?'s':''} uploaded`:'')+(h.geo?`; ${h.geo} new mesh${h.geo>1?'es':''}`:'');
function bhtSample(dt){bht.camDt=dt;const now=performance.now(),ft=bht.lastNow?(now-bht.lastNow)/1000:0;bht.lastNow=now;
  const k=({in:0,swap:0,ctl:1,reach:2,plunge:3,drag:3,curl:3,out:4,dump:5})[bht.ph],p=bht.parts[k];if(p&&ft)bhtHitch(ft,p.name);if(!ft||!p)return;if(bht.pt>0.2){p.ft.push(ft);p.tris+=renderer.info.render.triangles;p.k++}
  bench.barT-=ft;if(bench.barT<=0){bench.barT=0.2;const M=bhtM(),P=bht.pass?` · pass ${bht.pass} of ${BHT_PASSES}`:'',L=M.load();
    $('#benchBar').innerHTML=`${M.name.toUpperCase()} LOAD TEST${P}<small>${p.name} · bucket ${L<0.003*M.cap()?'empty':bhtYd(L)} · ${bhtYd(tr.load)} in the truck</small>`}}

function bhtResults(){const M=bhtM();
  const rows=bht.parts.map(s=>{const ft=s.ft.slice().sort((a,b)=>a-b),tot=ft.reduce((a,b)=>a+b,0);
    return {name:s.name,avg:tot>0?ft.length/tot:0,low:ft.length?1/ft[Math.min(ft.length-1,Math.floor(ft.length*0.99))]:0,worst:ft.length?ft[ft.length-1]*1000:0,tris:s.k?s.tris/s.k:0}});
  const timed=rows.filter(r=>r.avg>0),slow=timed.reduce((a,r)=>!a||r.avg<a.avg?r:a,null),fpsOk=!!slow&&slow.avg>=30,bad=bht.checks.filter(c=>!c.ok);
  const w=renderer.domElement.width,h=renderer.domElement.height,gpu=gpuName(),ver=window.EFFORT&&EFFORT.versions?EFFORT.versions[EFFORT.versions.length-1].v:'?';
  const device=`${gpu} · ${w}×${h} px at ${maxPR}x · Graphics ${gfxName()} · ${navigator.platform||''}`,cls=f=>f>=55?'fps-good':f>=30?'fps-mid':'fps-bad';
  const cyc=bht.cyc||0,per=bht.per||0,hr=cyc?per*3600/cyc:0,fill=per>0?TU.trCap/per*cyc/60:0;
  let sum=`<div class="lbl">Frame rate in the cab</div><div class="big ${fpsOk?'fps-good':'fps-bad'}">${slow?(fpsOk?'Pass':'Below 30 FPS'):'Not measured'}</div>`;
  if(slow)sum+=`<p>Slowest part: <b>${slow.name}</b>, ${slow.avg.toFixed(1)} FPS on average.</p>`;
  sum+=`<div class="lbl" style="margin-top:8px">Controls and loading</div><div class="big ${bad.length?'fps-bad':'fps-good'}">${bad.length?bad.length+' of '+bht.checks.length+' failed':'All '+bht.checks.length+' passed'}</div>`;
  if(cyc)sum+=`<p>A pass took ${cyc.toFixed(1)} s and put ${bhtYd(per)} in the truck: ${bhtYd(hr)} an hour, a full truck in about ${Math.round(fill)} minutes.</p>`;
  const hs=bht.hitches||[];
  if(hs.length)sum+=`<p>${hs.length} slow frame${hs.length>1?'s':''} (over ${BHT_HITCH} s), the worst ${(Math.max(...hs.map(h=>h.ms))/1000).toFixed(1)} s: see Freezes below.</p>`;
  let diag='<tr><th>Check</th><th>Result</th></tr>';
  for(const c of bht.checks)diag+=`<tr><td>${c.name}<br><small style="color:var(--muted)">${c.note}</small></td><td class="${c.ok?'fps-good':'fps-bad'}">${c.ok?'Pass':'Fail'}</td></tr>`;
  let table='<tr><th>Part</th><th>Avg FPS</th><th>1% low</th><th>Worst</th></tr>';
  for(const r of rows)table+=`<tr><td>${r.name}</td><td class="${r.avg?cls(r.avg):''}">${r.avg?r.avg.toFixed(1):'–'}</td><td class="${r.low?cls(r.low):''}">${r.low?r.low.toFixed(0):'–'}</td><td>${r.worst?Math.round(r.worst)+' ms':'–'}</td></tr>`;
  table+='<tr><th>Pass</th><th>Time</th><th>Bucket</th><th>In the bed</th></tr>';
  bht.passes.forEach((p,i)=>{table+=`<tr><td>${i+1}</td><td>${p.t?p.t.toFixed(1)+' s':'–'}</td><td>${bhtYd(p.got||0)}</td><td>${bhtYd(p.inBed||0)}</td></tr>`});
  if(hs.length){table+='<tr><th colspan="4">Freezes (slow frames, with what was slow in them)</th></tr>';for(const h of hs.slice(0,12))table+=`<tr><td colspan="4">${bhtHitchTxt(h)}</td></tr>`}
  const text=[`Corley's Island ${M.name.toLowerCase()} load test, game version ${ver}`,`GPU: ${gpu}`,`Graphics: ${gfxName()}${PHONE?' (phone)':''}`,`Resolution: ${w}x${h} (${maxPR}x)`,
    `Frame rate in the cab: ${slow?(fpsOk?'PASS':'FAIL')+`, slowest ${slow.name} at ${slow.avg.toFixed(1)} FPS`:'not measured'}`,`Checks: ${bad.length?bad.length+' of '+bht.checks.length+' FAILED':'all '+bht.checks.length+' passed'}`,
    cyc?`Speed: ${cyc.toFixed(1)} s a pass, ${bhtYd(per)} a pass, ${bhtYd(hr)} an hour, a full truck in about ${Math.round(fill)} min`:'Speed: not measured',
    ...bht.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),'Parts:',
    ...rows.map(r=>`${r.name} | ${r.avg?r.avg.toFixed(1)+' avg FPS | '+r.low.toFixed(0)+' 1% low | '+Math.round(r.worst)+' ms worst | '+fmtTris(r.tris)+' tris':'not timed'}`),'Passes:',
    ...bht.passes.map((p,i)=>`${i+1} | ${p.t?p.t.toFixed(1)+' s':'-'} | dig ${(p.dig||0).toFixed(1)} s | bucket ${bhtYd(p.got||0)} | in the bed ${bhtYd(p.inBed||0)}`),
    `Freezes (frames over ${BHT_HITCH} s): ${hs.length?hs.length:'none'}`,...hs.slice(0,20).map(bhtHitchTxt)].join('\n');
  return {title:`${M.name} load test results`,sum,diag,table,device,text,fpsOk,checksOk:!bad.length,hitches:hs,checks:bht.checks,rows}}
// done: the results are kept for the reload (digtest.js shows them), which puts the player's site back
function bhtEnd(){bht.on=false;bhtSticks([0,0,0,0]);const r=bhtResults();try{sessionStorage.setItem(DIGT_RES,JSON.stringify(r))}catch(e){}
  $('#benchBar').innerHTML=`${bhtM().name.toUpperCase()} LOAD TEST DONE<small>Putting your site back…</small>`;location.reload()}
// headless: the game's own frame stepped 20 times a game second with the drawing left out, until the script is done
// (or a step limit) or, with `until`, until until() is true, when the drawing and the frame loop are put back (for a
// screenshot, the script stopped where it is, or with `live` going on drawn from there). Without `until` the page is left in the test's state (bench.on stays set so nothing saves), so use a
// throwaway page (tools/play.js)
function ldTestRun(kind,until,live){ldTestStart(kind||'bh');bht.headless=true;renderer.setAnimationLoop(null);const draw=postRender;postRender=()=>{};
  const last0=last;let t=last,n=0;try{while(n<8000&&bht.ph!=='done'&&!(until&&until())){frame(t+=50);n++}}finally{postRender=draw}
  // the frame clock went on ahead of the real one (the browser's frame times, not performance.now()): set it back, or
  // the next real frame would step back in time
  if(until){bht.headless=false;bht.freeze=!live;bht.lastNow=0;last=last0;renderer.setAnimationLoop(frame);return {ph:bht.ph,pass:bht.pass}}
  if(bht.ph!=='done')bhtCheck('The test finished',false,`stuck at "${bht.ph}" on pass ${bht.pass}`);
  const r=bhtResults();return {ok:r.checksOk,checks:r.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),passes:r.text.split('Passes:')[1]}}

$('#bhTestBtn').onclick=()=>{showMenu(false);ldTestStart('bh')};$('#exTestBtn').onclick=()=>{showMenu(false);ldTestStart('ex')};
{const q=new URLSearchParams(location.search),k=q.has('bhtest')?'bhtest':q.has('extest')?'extest':null;
  if(k){const g=(q.get(k)||'').toLowerCase();q.delete(k);const qs=q.toString();
    history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);setTimeout(()=>{if(GFX[g])setGfx(g);ldTestStart(k==='bhtest'?'bh':'ex')},5000)}}
