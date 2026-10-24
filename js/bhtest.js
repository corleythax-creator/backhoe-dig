// Corley's Island: backhoe load test. Hands off: ☰ → Backhoe load test, or open the game with ?bhtest (or ?bhtest=low,
// medium or high for that Graphics setting). From the backhoe's cab it does what a player does with the sticks: climbs
// in, swivels the seat round to the hoe (the outriggers come down), works each hoe control in turn to check it moves the
// right way at its tuned rate, then digs, swings and dumps into the dump truck parked alongside, pass after pass. The
// sticks are driven by an autopilot through the touch sticks (SL, SR), so every input goes the player's way: main.js
// turns them into the backhoe's inputs, hvTick and bhTick into its moves. It times each pass, measures what each bucket
// held and what reached the bed, and the frame rate of each part, then the page reloads (nothing is saved while it
// runs: bench.on) and shows the results in the speed test's panel. bhTestRun() runs the same script without drawing:
//   NODE_PATH=$(npm root -g) node tools/play.js --eval "return bhTestRun()"
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// where it works: the backhoe on the east lawn facing west, the hoe digging east, the truck parked on its right (south)
// with the middle of its bed BHT_BED m out and BHT_BACK m behind the kingpost; BHT_R the dig's reach from the kingpost,
// BHT_CUT how deep the teeth bite; BHT_PASSES passes; BHT_CYCLE the pass time (s) a pass should beat
const BHT_SITE={x:58,z:4,yaw:-Math.PI/2},BHT_BED=3.4,BHT_BACK=1.1,BHT_R=3.7,BHT_CUT=0.35,BHT_PASSES=6,BHT_CYCLE=30;
// the parts the frame rate is reported for, and the phase each step of a pass belongs to
const BHT_PARTS=['Climbing in, swivelling to the hoe','Control check','Swinging back to dig','Digging','Swinging to the truck','Dumping into the truck'];
const BHT_OF={swap:0,ctl:1,reach:2,plunge:3,drag:3,curl:3,out:4,dump:5};
const bht={on:false,headless:false,ph:'',t:0,pt:0,pass:0,passes:[],checks:[],parts:[],lastNow:0,u:[0,0,0,0],x0:0,z0:0};
const bhtYd=m=>(m*1.308).toFixed(2)+' cu yd',bhtDeg=r=>Math.round(r*180/Math.PI)+'°';
function bhtH(){return hvs.find(h=>h.K.hoe)}
function bhtCheck(name,ok,note){bht.checks.push({name,ok:!!ok,note})}
const bhtV=new THREE.Vector3(),bhtW=new THREE.Vector3(),bhtQ=new THREE.Quaternion();
// the hoe's teeth or the middle of its load in world (w) and in the machine's frame (l, z from the kingpost), and how
// far its mouth faces up
function bhtAt(h,pt){const K=h.parts.hoe;K.localToWorld(bhtW.set(...pt));const w=bhtW.clone(),l=h.g.worldToLocal(bhtV.copy(w)).clone();l.z-=BH_SW[1];
  K.getWorldQuaternion(bhtQ);return {w,l,r:Math.hypot(l.x,l.z),up:bhtV.set(0,0.26,0.97).applyQuaternion(bhtQ).y}}
// the hoe's pose (boom hb, stick hs) that puts pt at reach r and height y in the machine's frame, swung to sw with the
// bucket at hk, found by trying them all; the machine is put back as it was
function bhtSolve(h,pt,sw,hk,r,y){const keep=[h.sw,h.hb,h.hs,h.hk];let best=null;
  for(let hb=BH_LIM.hb[0];hb<=BH_LIM.hb[1];hb+=0.04)for(let hs=BH_LIM.hs[0];hs<=BH_LIM.hs[1];hs+=0.04){
    Object.assign(h,{sw,hb,hs,hk});hvPose(h);const a=bhtAt(h,pt),e=(a.r-r)**2+(a.l.y-y)**2;if(!best||e<best.e)best={hb,hs,e,up:a.up}}
  [h.sw,h.hb,h.hs,h.hk]=keep;hvPose(h);return best}
// the bucket angle that tips its mouth to face up by `up` at that pose
function bhtCurl(h,sw,hb,hs,up){const keep=[h.sw,h.hb,h.hs,h.hk];let best=null;
  for(let hk=BH_LIM.hk[0];hk<=BH_LIM.hk[1];hk+=0.05){Object.assign(h,{sw,hb,hs,hk});hvPose(h);const e=Math.abs(bhtAt(h,BH_TIP).up-up);if(!best||e<best.e)best={hk,e}}
  [h.sw,h.hb,h.hs,h.hk]=keep;hvPose(h);return best.hk}
// the ground's height in the machine's frame under a world point
function bhtGround(h,w){return h.g.worldToLocal(bhtV.set(w.x,hAt(w.x,w.z),w.z)).y}

function bhTestStart(){
  if(bench.on||edOn)return;const h=bhtH();if(!h)return;
  // whatever the player did last is saved first; nothing is saved from here until the page reloads
  siteSaveAll();
  bench.on=true;bench.kind='bh';bench.t=0;bench.pr=0;bench.barT=0;viewDirty=true;help.hidden=true;$('#bench').hidden=true;$('#benchBar').hidden=false;
  Object.assign(bht,{on:true,ph:'in',t:0,pt:0,pass:0,passes:[],checks:[],lastNow:0,u:[0,0,0,0]});bht.parts=BHT_PARTS.map(name=>({name,ft:[],tris:0,k:0}));
  // the backhoe set down parked, empty and at the wheel; you climb in and look from the seat
  const i=hvs.indexOf(h);Object.assign(h,{x:BHT_SITE.x,z:BHT_SITE.z,yaw:BHT_SITE.yaw,ty:BHT_SITE.yaw,mv:BHT_SITE.yaw,v:0,w:0,steer:0});bhReset(h);h.load=0;hvGround(h,1);hvPose(h);
  hvI=i;wk.inside='hv'+i;setMode('heavy');camSet('cab');fpReset();digTilesTick(0);bht.x0=h.x;bht.z0=h.z;
  // the truck alongside, empty, its bed in the hoe's swing on the right
  const sy=Math.sin(h.yaw),cy=Math.cos(h.yaw),bx=BHT_BED,bz=BH_SW[1]-BHT_BACK,B=[h.x+bx*cy+bz*sy,h.z-bx*sy+bz*cy];
  Object.assign(tr,{yaw:h.yaw,v:0,spin:0,steer:0,bed:0,load:0,stuck:0,gear:1,brakeOn:true});
  tr.x=B[0]+sy*1.55;tr.z=B[1]+cy*1.55;
  for(let n=0;n<3;n++){updateTruck(0.05,0,0,0);tr.v=0;bedG.updateWorldMatrix(true,false);const c=bedG.localToWorld(bhtW.set(0,0,BED_L/2));tr.x+=B[0]-c.x;tr.z+=B[1]-c.z}}
// the dig and dump poses, once the machine stands level on its outriggers
function bhtPlan(h){const sy=Math.sin(h.yaw),cy=Math.cos(h.yaw),kx=h.x+BH_SW[1]*sy,kz=h.z+BH_SW[1]*cy;
  // dig: straight back, the teeth just over the ground at BHT_R, the mouth facing a little up
  const dw=new THREE.Vector3(kx-sy*BHT_R,0,kz-cy*BHT_R),gy=bhtGround(h,dw);
  const d=bhtSolve(h,BH_TIP,0,0,BHT_R,gy+0.25);d.hk=bhtCurl(h,0,d.hb,d.hs,0.15);
  // dump: swung over the middle of the bed, the curled bucket's load 5 ft over the bed floor
  bedG.updateWorldMatrix(true,false);const c=bedG.localToWorld(new THREE.Vector3(0,0,BED_L/2)),l=h.g.worldToLocal(c.clone());l.z-=BH_SW[1];
  const sw=Math.atan2(-l.x,-l.z),r=Math.hypot(l.x,l.z),u=bhtSolve(h,BH_MID,sw,1.6,r,l.y+1.5);
  // which way curling turns the mouth up, for the drag
  const keep=h.hk;h.hk=0;hvPose(h);const u0=bhtAt(h,BH_TIP).up;h.hk=0.2;hvPose(h);const s=Math.sign(bhtAt(h,BH_TIP).up-u0)||1;h.hk=keep;hvPose(h);
  bht.dig=d;bht.dump={sw,hb:u.hb,hs:u.hs,r,e:u.e,floor:l.y};bht.upS=s;bht.digW=dw}
// the autopilot's hands: each joint's speed (-1..1, + raises it) turned into the sticks as the player's thumbs give them
// (main.js: left x swings, left y works the stick, right y the boom, right x the bucket)
function bhtSticks(u){const Ts=turnSens||1;SL.x=clamp(-u[0]/Ts,-1,1);SL.y=clamp(u[1],-1,1);SR.y=clamp(-u[2],-1,1);SR.x=clamp(-u[3],-1,1)}
const bhtTo=(v,t,g)=>clamp((t-v)*(g||4),-1,1),BHT_J=['sw','hs','hb','hk'],BHT_RATE=['bhSwing','bhStick','bhBoom','bhBucket'];
function bhtGo(ph){bht.ph=ph;bht.pt=0}
// one step of the script
function bhtStep(dt){const h=bhtH(),u=[0,0,0,0];bench.t+=dt;bht.t+=dt;bht.pt+=dt;const L=h.hl,cap=TU.bhCap;
  if(bht.ph==='in'){if(bht.pt>1){bht.sw0=bht.t;bhSwap();bhtGo('swap')}}
  else if(bht.ph==='swap'){
    if(h.seat>=0.999&&!bht.seatT)bht.seatT=bht.pt;if(h.out>=0.999&&!bht.outT)bht.outT=bht.pt;
    // the drive stick pushed while it swivels and stands on its outriggers: it must not move
    u[1]=1;
    if(bht.seatT&&bht.outT&&bht.pt>bht.outT+0.4){
      const ok=(m,w)=>Math.abs(m-w)<=w*0.2+0.1;
      bhtCheck('The seat swivels round to the hoe',h.hoe&&ok(bht.seatT,TU.bhSeatT),`in ${bht.seatT.toFixed(1)} s (tuned ${TU.bhSeatT.toFixed(1)} s)`);
      bhtCheck('The outriggers come down',ok(bht.outT,TU.bhOutT),`in ${bht.outT.toFixed(1)} s (tuned ${TU.bhOutT.toFixed(1)} s)`);
      bhtPlan(h);bht.cj=0;bht.cs=null;bhtGo('ctl')}
    else if(bht.pt>8){bhtCheck('The seat swivels round to the hoe',false,'not round in 8 s');bhtPlan(h);bht.cj=0;bhtGo('ctl')}}
  else if(bht.ph==='ctl'){
    // each hoe control in turn, full stick away from its nearer stop for 0.8 s and back for 0.8 s; its speed is taken
    // from 0.2 s to 0.7 s in, once the input has reached it
    const j=bht.cj,k=BHT_J[j],lim=BH_LIM[k],v=h[k];
    if(!bht.cs)bht.cs={d:v-lim[0]>lim[1]-v?-1:1,m:[]};const c=bht.cs,seg=Math.floor(bht.pt/0.8),f=bht.pt-seg*0.8;
    if(seg<2){u[j]=seg?-c.d:c.d;if(f>=0.2&&!c.m[seg*2])c.m[seg*2]=[v,bht.pt];if(f>=0.7&&!c.m[seg*2+1])c.m[seg*2+1]=[v,bht.pt]}
    else{const want=TU[BHT_RATE[j]],r=c.m.length===4?[(c.m[1][0]-c.m[0][0])/(c.m[1][1]-c.m[0][1]),(c.m[3][0]-c.m[2][0])/(c.m[3][1]-c.m[2][1])]:[0,0];
      const NM=['Swing (left stick, left and right)','Stick out and in (left stick, up and down)','Boom up and down (right stick, up and down)','Bucket curl and dump (right stick, left and right)'][j];
      const good=r[0]*c.d>0&&r[1]*c.d<0&&Math.abs(Math.abs(r[0])-want)<=want*0.15&&Math.abs(Math.abs(r[1])-want)<=want*0.15;
      bhtCheck(NM,good,`${bhtDeg(Math.abs(r[0]))}/s and ${bhtDeg(Math.abs(r[1]))}/s back${r[0]*c.d>0&&r[1]*c.d<0?'':' (the wrong way)'}, tuned ${bhtDeg(want)}/s`);
      bht.cj++;bht.cs=null;bht.pt=0;if(bht.cj>=4){bht.ld=h.a;bht.lc=h.c;bhtPass(h)}}}
  else{
    const P=bht.passes[bht.pass-1],tip=bhtAt(h,BH_TIP),g=hAt(tip.w.x,tip.w.z),D=bht.dig,M=bht.dump;
    if(bht.ph==='reach'){u[0]=bhtTo(h.sw,0);u[1]=bhtTo(h.hs,D.hs);u[2]=bhtTo(h.hb,D.hb);u[3]=bhtTo(h.hk,D.hk);
      if(Math.abs(h.sw)<0.05&&Math.abs(h.hs-D.hs)<0.08&&Math.abs(h.hb-D.hb)<0.08&&Math.abs(h.hk-D.hk)<0.1||bht.pt>8){P.reach=bht.pt;bhtGo('plunge')}}
    else if(bht.ph==='plunge'){u[2]=-0.7;u[3]=bht.upS*bhtTo(tip.up,0.1,3);if(tip.w.y<g-BHT_CUT||L.load>0.02*cap||bht.pt>4)bhtGo('drag')}
    // pull the stick in with the teeth held BHT_CUT under the ground, curling the bucket up as it fills
    else if(bht.ph==='drag'){u[1]=-0.8;u[2]=clamp(-(tip.w.y-(g-BHT_CUT))*3,-1,1);u[3]=bht.upS*bhtTo(tip.up,0.1+0.5*L.load/cap,3);
      if(L.load>=cap*0.97||h.hs<=BH_LIM.hs[0]+0.1||tip.r<1.6||bht.pt>8){P.dig=bht.pt;P.got=L.load;bhtGo('curl')}}
    else if(bht.ph==='curl'){u[3]=bhtTo(h.hk,1.6);u[2]=h.hk>0.6?1:0.3;if(tip.w.y>g+0.5&&h.hk>1.3||bht.pt>4){P.curl=bht.pt;bhtGo('out')}}
    // swing out once the bucket clears the bed's sides, reaching to the dump pose as it goes
    else if(bht.ph==='out'){const mid=bhtAt(h,BH_MID),clear=mid.l.y>M.floor+1.0;u[0]=clear?bhtTo(h.sw,M.sw):0;u[1]=bhtTo(h.hs,M.hs);u[2]=bhtTo(h.hb,M.hb);u[3]=bhtTo(h.hk,1.6);
      if(Math.abs(h.sw-M.sw)<0.05&&Math.abs(h.hs-M.hs)<0.08&&Math.abs(h.hb-M.hb)<0.08||bht.pt>8){P.out=bht.pt;P.held=L.load;P.tr0=tr.load;bhtGo('dump')}}
    else if(bht.ph==='dump'){u[3]=-1;u[0]=bhtTo(h.sw,M.sw);if(L.load<0.003*cap&&bht.pt>0.5||bht.pt>5){P.dump=bht.pt;P.left=L.load;P.inBed=tr.load-P.tr0;
      P.t=bht.t-P.t0;if(bht.pass>=BHT_PASSES){bhtFinish(h);return false}bhtPass(h)}}}
  bht.u=u;return true}
function bhtPass(h){bht.pass++;bht.passes.push({t0:bht.t});bhtGo('reach')}
// the checks from the loading
function bhtFinish(h){const ps=bht.passes,cap=TU.bhCap,n=ps.length;
  const full=ps.filter(p=>p.got>=cap*0.8).length,held=ps.reduce((a,p)=>a+p.held,0),got=ps.reduce((a,p)=>a+p.inBed,0),lost=ps.reduce((a,p)=>a+Math.max(0,p.held-p.inBed-p.left),0);
  bhtCheck('Fills the bucket every pass',full===n,`${full} of ${n} passes ${n?'took '+Math.round(100*ps.reduce((a,p)=>a+p.got,0)/n/cap)+'% of a bucket on average':''}`);
  bhtCheck('Dumps into the truck bed',held>0&&got>=held*0.9,`${bhtYd(got)} of ${bhtYd(held)} carried landed in the bed${lost>0.001?', '+bhtYd(lost)+' spilled':''}`);
  bhtCheck('The bucket empties over the bed',ps.every(p=>p.left<=cap*0.05),`${bhtYd(Math.max(0,...ps.map(p=>p.left)))} left in it at most`);
  const w=bht.digW,dd=inDig(w.x,w.z)?(()=>{let m=0;for(let r=1.2;r<=BHT_R+0.3;r+=0.2){const x=h.x+BH_SW[1]*Math.sin(h.yaw)-Math.sin(h.yaw)*r,z=h.z+BH_SW[1]*Math.cos(h.yaw)-Math.cos(h.yaw)*r,k=Math.round(gJ(z))*V+Math.round(gI(x));m=Math.max(m,H0[k]-H[k])}return m})():0;
  bhtCheck('Digs a hole',dd>0.3,`${ftIn(dd)} deep`);
  bhtCheck('Stays put on its outriggers',Math.hypot(h.x-bht.x0,h.z-bht.z0)<0.05,`moved ${ftIn(Math.hypot(h.x-bht.x0,h.z-bht.z0))}`);
  bhtCheck('The loader stays still at the hoe',Math.abs(h.a-bht.ld)<1e-4&&Math.abs(h.c-bht.lc)<1e-4,'with the right stick working the hoe');
  const cyc=n?ps.reduce((a,p)=>a+p.t,0)/n:0;bht.cyc=cyc;bht.per=n?got/n:0;
  bhtCheck(`A pass takes under ${BHT_CYCLE} s`,cyc>0&&cyc<BHT_CYCLE,`${cyc.toFixed(1)} s on average, dig to dump and back`);
  bht.ph='done';bht.on=false}

function bhtTick(dt){if(bht.headless)return;
  if(bht.ph==='done'){bhtEnd();return}
  if(!bhtStep(dt)){bhtEnd();return}bhtSticks(bht.u)}
// the cab view, the operator looking at the bucket
function bhtCam(){const h=bhtH();if(!h||!h.parts)return;const m=bhtAt(h,BH_MID).w;camera.lookAt(look.lerp(m,0.6))}
function bhtSample(){const now=performance.now(),ft=bht.lastNow?(now-bht.lastNow)/1000:0;bht.lastNow=now;
  const k=bht.ph==='in'?0:BHT_OF[bht.ph],p=bht.parts[k];if(!ft||!p)return;if(bht.pt>0.2){p.ft.push(ft);p.tris+=renderer.info.render.triangles;p.k++}
  bench.barT-=ft;if(bench.barT<=0){bench.barT=0.2;const P=bht.pass?` · pass ${bht.pass} of ${BHT_PASSES}`:'';
    $('#benchBar').innerHTML=`BACKHOE LOAD TEST${P}<small>${p.name} · ${bhtYd(tr.load)} in the truck · ${fmtTris(renderer.info.render.triangles)} tris</small>`}}

function bhtResults(){
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
  let diag='<tr><th>Check</th><th>Result</th></tr>';
  for(const c of bht.checks)diag+=`<tr><td>${c.name}<br><small style="color:var(--muted)">${c.note}</small></td><td class="${c.ok?'fps-good':'fps-bad'}">${c.ok?'Pass':'Fail'}</td></tr>`;
  let table='<tr><th>Part</th><th>Avg FPS</th><th>1% low</th><th>Worst</th></tr>';
  for(const r of rows)table+=`<tr><td>${r.name}</td><td class="${r.avg?cls(r.avg):''}">${r.avg?r.avg.toFixed(1):'–'}</td><td class="${r.low?cls(r.low):''}">${r.low?r.low.toFixed(0):'–'}</td><td>${r.worst?Math.round(r.worst)+' ms':'–'}</td></tr>`;
  table+='<tr><th>Pass</th><th>Time</th><th>Bucket</th><th>In the bed</th></tr>';
  bht.passes.forEach((p,i)=>{table+=`<tr><td>${i+1}</td><td>${p.t?p.t.toFixed(1)+' s':'–'}</td><td>${bhtYd(p.got||0)}</td><td>${bhtYd(p.inBed||0)}</td></tr>`});
  const text=[`Corley's Island backhoe load test, game version ${ver}`,`GPU: ${gpu}`,`Graphics: ${gfxName()}${PHONE?' (phone)':''}`,`Resolution: ${w}x${h} (${maxPR}x)`,
    `Frame rate in the cab: ${slow?(fpsOk?'PASS':'FAIL')+`, slowest ${slow.name} at ${slow.avg.toFixed(1)} FPS`:'not measured'}`,`Checks: ${bad.length?bad.length+' of '+bht.checks.length+' FAILED':'all '+bht.checks.length+' passed'}`,
    cyc?`Speed: ${cyc.toFixed(1)} s a pass, ${bhtYd(per)} a pass, ${bhtYd(hr)} an hour, a full truck in about ${Math.round(fill)} min`:'Speed: not measured',
    ...bht.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),'Parts:',
    ...rows.map(r=>`${r.name} | ${r.avg?r.avg.toFixed(1)+' avg FPS | '+r.low.toFixed(0)+' 1% low | '+Math.round(r.worst)+' ms worst | '+fmtTris(r.tris)+' tris':'not timed'}`),'Passes:',
    ...bht.passes.map((p,i)=>`${i+1} | ${p.t?p.t.toFixed(1)+' s':'-'} | dig ${(p.dig||0).toFixed(1)} s | bucket ${bhtYd(p.got||0)} | in the bed ${bhtYd(p.inBed||0)}`)].join('\n');
  return {title:'Backhoe load test results',sum,diag,table,device,text,fpsOk,checksOk:!bad.length,checks:bht.checks,rows}}
// done: the results are kept for the reload (digtest.js shows them), which puts the player's site back
function bhtEnd(){bht.on=false;bhtSticks([0,0,0,0]);const r=bhtResults();try{sessionStorage.setItem(DIGT_RES,JSON.stringify(r))}catch(e){}
  $('#benchBar').innerHTML='BACKHOE LOAD TEST DONE<small>Putting your site back…</small>';location.reload()}
// headless: the whole script at 20 steps a second without drawing, the sticks read as main.js reads them; the page is
// left in the test's state (bench.on stays set so nothing saves), so use a throwaway page (tools/play.js)
function bhTestRun(){bhTestStart();bht.headless=true;let n=0;const dt=0.05;
  while(n<6000){const go=bhtStep(dt);bhtSticks(bht.u);if(!go)break;const Ts=turnSens||1;
    hvTick(dt,clamp(SL.y,-1,1),clamp(SL.x,-1,1)*Ts,-clamp(SR.y,-1,1),-clamp(SR.x,-1,1));updateTruck(dt,0,0,0);slopeTick(dt);n++}
  if(bht.ph!=='done')bhtCheck('The test finished',false,`stuck at "${bht.ph}" on pass ${bht.pass}`);
  const r=bhtResults();return {ok:r.checksOk,checks:r.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),passes:r.text.split('Passes:')[1],dig:bht.dig,dump:bht.dump}}

$('#bhTestBtn').onclick=()=>{showMenu(false);bhTestStart()};
{const q=new URLSearchParams(location.search);if(q.has('bhtest')){const g=(q.get('bhtest')||'').toLowerCase();q.delete('bhtest');const qs=q.toString();
  history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);setTimeout(()=>{if(GFX[g])setGfx(g);bhTestStart()},5000)}}
