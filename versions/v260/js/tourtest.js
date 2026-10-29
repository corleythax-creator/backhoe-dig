// Corley's Island: the island tour test. Hands off: ☰ → Island tour test (or its first person run), or open the game with
// ?tourtest or ?tourfp (=low, medium, high or ultra for that Graphics setting). It plays a run the way a player does, through the left touch stick and Get in
// / Get out: starts on Dexter's Island on foot, walks to the four-wheeler and climbs on, drives it to the boat dock,
// climbs off, walks out along the dock into Dexter's boat and takes it right round the lake (under the Corley's–Family
// bridge, round Jessica's, along the town waterfront and marina, under the mainland bridge past the crane barge, round
// Dexter's and Corley's, up the north channel by the trestle and the hayfield) and back to Dexter's dock.
// Unlike the load tests the game runs just as in play (weather, sound, effects, auto resolution), so the numbers are what
// a player gets; only saving is held (syncHold) and the page reloads at the end to put the player's site back. For each
// leg it measures the frame rate, 1% low, worst frame, stutters (frames over 50 ms and over twice the leg's usual one),
// the main thread's time per frame (the game's code plus three.js handing the frame over: the CPU side) against the
// rest of each frame (the browser and graphics card), triangles and draw calls; over the run, long tasks, freezes with
// what was slow in them (bhtest.js's timing: bhtTimeOn, bhtNew), new shaders and textures, memory and script errors.
// The results show in the speed test's panel (digTestShow) with a text copy to paste.
// tourRun() plays it headless through the game's own frame without drawing, for the checks (the frame numbers mean
// nothing there):  NODE_PATH=$(npm root -g) node tools/play.js --eval "return tourRun()"
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// stutter: a frame over this (s) and over twice the leg's median; freeze: a frame over BHT_HITCH (bhtest.js)
const TOUR_STUT=0.05;
// on Dexter's: the four-wheeler's road to the top of the bank by the dock, then on foot down to the dock and out along it
const TOUR_ATV=[[-196,228],[-200,203]],TOUR_DOCK=[[-200,193],[-200,186],[-200,178]];
// the town stop: the boat ties up beside the marina pier (clear of the town's own boat), and he walks ashore, along the
// boardwalk, up Main Street and back, along the cross street and down to the pier again
const TOUR_MOOR=[[60,500],[64,526],[69.3,540]],TOUR_TOWN=[[72,550],[72,561],[40,563],[6,566],[0,580],[0,700],[0,652],[63,652],[63,600],[66,566],[72,556],[72,545]];
// the boat's legs round the lake (x, z in m); the bridges are passed between their piers, never through a trestle
const TOUR_LEGS=[
  {n:"Out from Dexter's dock",p:[[-200,145],[-130,122]]},
  {n:"Under the Corley's–Family bridge",p:[[-40,120],[40,120]]},
  {n:"North of Jessica's Island",p:[[140,140],[300,170]]},
  {n:"East of Jessica's Island",p:[[320,320],[260,385]]},
  {n:'Town waterfront and marina',p:[[140,440],[105,470],[60,450]],town:1},
  {n:'Under the mainland bridge, past the crane barge',p:[[30,363],[-30,363],[-80,385]]},
  {n:"South and west of Dexter's",p:[[-200,410],[-330,330],[-330,170]]},
  {n:"West of Corley's",p:[[-300,20],[-160,-130]]},
  {n:'North channel: trestle and hayfield',p:[[-60,-200],[-150,-160]]},
  {n:"Back to Dexter's dock",p:[[-230,40],[-205,140]]}];
const tour={on:false,headless:false,ph:'',t:0,pt:0,checks:[],legs:{},leg:'',li:0,wi:0,atv:-1,moved:{x:0,z:0,t:0},stuck:0,stuckN:0,rec:0,
  prevNow:0,cpu:0,errs:[],lt:{n:0,ms:0,max:0},barT:0};
const tourFt=m=>Math.round(m/FT)+' ft',tourAng=a=>Math.atan2(Math.sin(a),Math.cos(a));
function tourCheck(name,ok,note){tour.checks.push({name,ok:!!ok,note:note||''})}
function tourGo(ph,leg){tour.ph=ph;tour.pt=0;tour.wi=0;tour.rec=0;tour.detour=null;tour.moved={x:1e9,z:1e9,t:tour.t};if(leg)tourLeg(leg)}
function tourLeg(n){tour.leg=n;if(!tour.legs[n])tour.legs[n]={name:n,ft:[],cpu:[],gpu:[],sys:{},tris:0,calls:0,k:0,t0:tour.t,t:0,stuck:0}}
// the left stick pushed the way (x, z) lies from the worker, turned into the camera's frame as a thumb would push it
// (walker.js moves along the camera's heading); returns the distance left
function tourWalkTo(x,z){tour.aim=[x,z];const dx=x-wk.x,dz=z-wk.z,d=Math.hypot(dx,dz);if(d<0.05)return d;
  const c=camMode==='cab'?wk.view:wk.view+orbitYaw,fx=Math.sin(c),fz=Math.cos(c),ux=dx/d,uz=dz/d,k=Math.min(1,0.35+d/1.5);
  SL.y=(ux*fx+uz*fz)*k;SL.x=(uz*fx-ux*fz)*k;return d}
// steers o (the four-wheeler or the boat: + steer turns right, so the yaw falls) at (x, z) and works the throttle: easing
// off for a sharp turn and in the last `slow` m. A machine that has made under 1.5 m in 3 s is stuck: it backs off for
// 2.5 s with the wheel over, and a leg counts its stucks
function tourDrive(o,x,z,slow,top){const dr=Math.hypot(x-o.x,z-o.z);
  // after backing off something, it goes round it: a point to one side first, then on to the target
  if(tour.detour){const [qx,qz]=tour.detour;if(Math.hypot(qx-o.x,qz-o.z)<6||dr<10)tour.detour=null;else{x=qx;z=qz}}
  tour.aim=[x,z];const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz),e=tourAng(Math.atan2(dx,dz)-o.yaw),Ts=turnSens||1;
  const m=tour.moved;if(Math.hypot(o.x-m.x,o.z-m.z)>1.5){m.x=o.x;m.z=o.z;m.t=tour.t}
  if(tour.rec>0){tour.rec-=tour.dt;SL.y=-0.8;SL.x=clamp(Math.sign(e||1)/Ts,-1,1);return dr}
  if(tour.t-m.t>3){tour.rec=2.5;m.t=tour.t;tour.stuckN++;const L=tour.legs[tour.leg];if(L)L.stuck++;(tour.stuckAt||(tour.stuckAt=[])).push([Math.round(o.x),Math.round(o.z),tour.leg]);
    if(dr>14){const b=Math.atan2(dx,dz),sd=tour.stuckN%2?1:-1;tour.detour=[o.x+Math.sin(b)*10+Math.cos(b)*18*sd,o.z+Math.cos(b)*10-Math.sin(b)*18*sd]}return dr}
  SL.x=clamp(-e*2.2/Ts,-1,1);SL.y=clamp((1-0.7*Math.min(1,Math.abs(e)/1.6))*Math.min(1,0.2+d/slow),0.2,1)*top;return dr}

// first person (tourStart(true)): the head looks round as a person's does. Most of the time the eyes are on the way
// ahead (where the thumb is taking him, a little down), and every few seconds they go to something worth a look nearby,
// a machine, a boat, a bridge, the crane barge, a house, the town, hold there a second or two and come back. A look is a
// quick turn that slows as it lands (a saccade and the head following), with a slight drift while it rests. It turns
// the head through fpTurn, as the mouse does, so the seat's limits hold; on foot the body turns with it (the stick is
// worked out from the view, so he still walks to where he's going). The picks come from a fixed seed so runs compare.
const TOUR_SEE=[["Corley's dig site",0,-5],['the family house',FAM_X,FAM_Z],["Jessica's cottage",JES_X,JES_Z],['the marina',72,530],
  ['the town',0,600],['the hayfield',40,-330]];
let tourSeed=1;const tourRnd=()=>(tourSeed=(tourSeed*1664525+1013904223)>>>0)/4294967296;
// what there is to look at: the places above, every bridge's middle, the machines, the boats on the lake and at the docks, the crane barge
function tourSights(){const S=TOUR_SEE.map(([n,x,z])=>({n,x,z,y:Math.max(WATER,baseHeight(x,z))+3}));
  for(const b of BRIDGES)if(!b.dock)S.push({n:'the bridge',x:(b.x0+b.x1)/2,z:(b.z0+b.z1)/2,y:b.y+1});
  for(const h of hvs)S.push({n:'the '+h.K.n,x:h.x,z:h.z,y:h.y+1.3});
  for(const b of boats)if(b!==boats[3])S.push({n:b.n+' boat',x:b.x,z:b.z,y:b.y+1});
  for(const o of lakeBoats)S.push({n:'a boat on the lake',x:o.x,z:o.z,y:WATER+1.5});
  const p=crnBarge.position;S.push({n:'the crane barge',x:p.x,z:p.z,y:p.y+8});return S}
// the eye: where it is, which way the seat faces (world yaw) and how far the seat's own view tips down
function tourEye(){if(mode==='walk')return {x:wk.x,y:wk.y+WK_H,z:wk.z,yaw:0,p0:0,walk:true};
  const o=mode==='boat'?btCur():hvCur(),E=mode==='boat'?[0,1.62,-0.47,0,-1.5,8]:(o.eye||o.K.eye);
  return {x:o.x,y:o.y+E[1],z:o.z,yaw:o.yaw+Math.atan2(E[3],E[5]),p0:Math.atan2(E[4],Math.hypot(E[3],E[5])),walk:false}}
function tourLook(dt){const L=tour.look,E=tourEye(),lim=E.walk?Math.PI:1.25;L.t-=dt;
  // climbing in or out sets the view straight (setMode): the head starts again from rest
  if(L.m!==mode){L.m=mode;L.vy=L.vp=0;L.ay=undefined}
  const head=E.walk?wk.view:E.yaw;
  if(L.t<=0){
    // after a glance always back to the way ahead; from ahead, now and then a glance if there is something worth it
    // within a comfortable turn of the head
    let pick=null;if(L.ahead){const near=tourSights().filter(s=>{const d=Math.hypot(s.x-E.x,s.z-E.z),r=E.walk?[5,80]:[25,260];
        return d>r[0]&&d<r[1]&&(L.seen[s.n+Math.round(s.x)]||-99)<tour.t-30&&Math.abs(tourAng(Math.atan2(s.x-E.x,s.z-E.z)-head))<(E.walk?1.6:1.2)});
      if(near.length&&tourRnd()<0.45)pick=near[Math.floor(tourRnd()*near.length)]}
    if(pick){L.sight=pick;L.ahead=false;L.t=2+tourRnd()*2;L.seen[pick.n+Math.round(pick.x)]=tour.t;L.n++;L.names.add(pick.n)}
    else{L.sight=null;L.ahead=true;L.t=4+tourRnd()*5;L.dn=-0.06-tourRnd()*0.06;L.side=(tourRnd()-0.5)*0.2}}
  // the way ahead, eased so it never jumps when the next waypoint comes up: on foot where he is walking to (held while
  // he is nearly there), in a seat the machine's heading leaning a little into the turn
  const a=tour.aim,ad=a?Math.hypot(a[0]-E.x,a[1]-E.z):0;let raw;
  if(E.walk)raw=a&&ad>2.5?Math.atan2(a[0]-E.x,a[1]-E.z):(L.ay!==undefined?L.ay:wk.view);
  else raw=E.yaw+(a&&ad>3?clamp(tourAng(Math.atan2(a[0]-E.x,a[1]-E.z)-E.yaw),-0.5,0.5)*0.5:0);
  if(L.ay===undefined)L.ay=raw;else L.ay+=tourAng(raw-L.ay)*(1-Math.exp(-dt*1.2));
  // where the eyes want to be (world yaw, pitch)
  let ty,tp;const S=L.sight;
  if(S){ty=Math.atan2(S.x-E.x,S.z-E.z);tp=clamp(Math.atan2(S.y-E.y,Math.hypot(S.x-E.x,S.z-E.z)),-0.4,0.35)}
  else{ty=L.ay+(L.side||0);tp=L.dn||-0.08}
  // a very slow drift while resting, so the view is never frozen still
  ty+=Math.sin(tour.t*0.31)*0.012;tp+=Math.sin(tour.t*0.23)*0.008;
  // the head as a critically damped spring with an acceleration and a speed limit: a look starts gently, peaks at about
  // 1 rad/s and settles without overshoot (a person's head with the eyes leading), never a snap
  const W=2.4,AM=2.2,VM=1.0;
  const sp=(err,v)=>{const acc=clamp(W*W*err-2*W*v,-AM,AM);return clamp(v+acc*dt,-VM,VM)};
  if(E.walk){L.vy=sp(tourAng(ty-wk.view),L.vy||0);L.vp=sp(clamp(tp,-0.9,0.7)-fpl.pitch,L.vp||0);
    fpTurn(-L.vy*dt,-L.vp*dt)}
  else{const want=clamp(tourAng(ty-E.yaw),-lim,lim);L.vy=sp(want-fpl.yaw,L.vy||0);L.vp=sp(clamp(tp-E.p0,-0.8,0.7)-fpl.pitch,L.vp||0);
    fpTurn(-L.vy*dt,-L.vp*dt);L.max=Math.max(L.max,Math.abs(fpl.yaw))}
  L.vmax=Math.max(L.vmax||0,Math.abs(L.vy))}

// the conditions a run can add (the start card's Tour row, saved on this device; or the address: &rain &night &laps=2)
const tourOpt={rain:false,night:false,laps:1};try{Object.assign(tourOpt,JSON.parse(localStorage.getItem('bhd_tourOpt')||'{}'))}catch(e){}
// more of the game's work timed for the tour's freeze and cost reports (bhtest.js times the rest; missing ones are skipped)
const TOUR_TIMED={mapsTick:'Minimap',mdlTick:'Detailed models',jesTick:"Jessica's Island",particlesTick:'Particles',dustTick:'Dust',lakeBoatsTick:'Boats on the lake',
  crnTick:'The crane',famTick:'Family Island',wkMdlPose:'The worker\'s pose',grimeTick:'Grime',plantTick:'Planted trees',daynightTick:'Time of day',stormTick:'Storms',ambienceTick:'Ambience',tfTick:'Townsfolk'};
// where the player is: on foot, in the boat or on the machine
const tourPos=()=>mode==='walk'?wk:mode==='boat'?btCur():mode==='heavy'?hvCur():wk;

function tourStart(fp,opt){
  if(tour.on||bench.on||edOn)return;opt=Object.assign({},tourOpt,opt||{});
  tour.fp=!!fp;tour.opt=opt;tourSeed=1;tour.look={t:0,sight:null,ahead:true,seen:{},n:0,names:new Set(),max:0};tour.aim=null;
  // the boat's legs, once round or twice (lap 2 shows whether the device slows as it warms up, and whether memory grows)
  tour.route=[];for(let l=0;l<Math.max(1,Math.min(3,opt.laps|0||1));l++)for(const L of TOUR_LEGS)tour.route.push(Object.assign({},L,{n:(l?`Lap ${l+1} · `:'')+L.n,lap:l,town:L.town&&!l}));
  // whatever the player did last is saved first; nothing is saved from here until the page reloads. The clock is the
  // one setting the conditions write straight to storage (night): kept here and put back on the way out
  siteSaveAll();window.syncHold=true;try{tour.keepClock=localStorage.getItem('bhd_clock')}catch(e){}
  help.hidden=true;showMenu(false);toggleMap(false);$('#bench').hidden=true;$('#benchBar').hidden=false;
  Object.assign(tour,{on:true,ph:'start',t:0,pt:0,dt:0,checks:[],legs:{},leg:'',li:0,wi:0,stuckN:0,rec:0,prevNow:0,errs:[],lt:{n:0,ms:0,max:0},barT:0,
    pr:[renderer.getPixelRatio(),renderer.getPixelRatio()],mem0:Object.assign({},renderer.info.memory),progs0:(renderer.info.programs||[]).length,
    heap:performance.memory?[performance.memory.usedJSHeapSize,performance.memory.usedJSHeapSize]:null,
    cnt:{n:0,under:0,fell:0,sank:0,mute:0,snd:0},path:[],pathT:0,slow:[],loaf:[],laps:[],bat:null,bat0:null,walkM:null,stuckAt:[],hidMs:0,hidAt:0,hidSkip:false,readyT:0});
  if(opt.rain)setWeather('rain');if(opt.night)dnSet(22*60);
  // the four-wheeler and Dexter's boat back where they live, whatever the player did with them
  tour.atv=hvs.findIndex(h=>h.k==='atv'&&Math.hypot(h.K.x-DEX_X,h.K.z-DEX_Z)<100);const h=hvs[tour.atv];
  if(h){Object.assign(h,{x:h.K.x,z:h.K.z,yaw:h.K.yaw,v:0,w:0,steer:0});hvGround(h,1);hvPose(h)}
  const b=boats[3];Object.assign(b,{x:b.home.x,z:b.home.z,yaw:b.home.yaw,v:0});
  Object.assign(BHT_TIMED,TOUR_TIMED);bhtTimeOn();bht.lastNow=0;
  // first the game gets everything ready that it can (warmIdle, main.js: shaders and textures, the detailed machines
  // loading in), so the run measures playing, not loading; how long that took is reported on its own
  tour.ph='ready';if(tour.headless)tourBegin();
  if(!tour.headless){
    tour.onErr=e=>tour.errs.push(String(e.message||e.reason||e.type).slice(0,200));addEventListener('error',tour.onErr);addEventListener('unhandledrejection',tour.onErr);
    try{tour.obs=new PerformanceObserver(l=>{for(const e of l.getEntries()){tour.lt.n++;tour.lt.ms+=e.duration;tour.lt.max=Math.max(tour.lt.max,e.duration)}});tour.obs.observe({type:'longtask'})}catch(e){tour.obs=null}
    // Chrome's long animation frame reports name the scripts that ran in a slow frame, even between the game's frames
    // (a model or texture finishing loading, a timer): the freeze report says what they were
    try{tour.lo=new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.duration<200||tour.loaf.length>=30||tour.ph==='ready'||tour.hidSkip||document.hidden)continue;
        tour.loaf.push({ms:Math.round(e.duration),leg:tour.leg,block:Math.round(e.blockingDuration||0),scripts:(e.scripts||[]).slice().sort((a,b)=>b.duration-a.duration).slice(0,3).map(sc=>({
          n:sc.sourceFunctionName||sc.invoker||sc.invokerType||'script',f:String(sc.sourceURL||'').split('/').pop().split('?')[0],ms:Math.round(sc.duration)}))})}});tour.lo.observe({type:'long-animation-frame'})}catch(e){tour.lo=null}
    // time with the window hidden (another tab or app in front) isn't play: the browser stops drawing, so it's left out
    document.addEventListener('visibilitychange',()=>{if(!tour.on)return;if(document.hidden)tour.hidAt=performance.now();else if(tour.hidAt){tour.hidMs+=performance.now()-tour.hidAt;tour.hidAt=0;tour.hidSkip=true}});
    try{if(navigator.getBattery)navigator.getBattery().then(B=>{tour.bat=B;tour.bat0=B.level}).catch(()=>{})}catch(e){}
    // the graphics card's own time for each frame (WebGL timer queries, where the browser offers them): read back a few
    // frames later and put down to the leg it was drawn in
    try{const gl=renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
      if(ext&&!tour.gq){tour.gq={gl,ext,free:[],busy:[]};const pr=postRender;
        postRender=function(){const G=tour.gq;let q=null;if(tour.on&&G.busy.length<6){q=G.free.pop()||gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q)}
          try{return pr.apply(this,arguments)}finally{if(q){gl.endQuery(ext.TIME_ELAPSED_EXT);G.busy.push({q,leg:tour.leg})}}}}}catch(e){tour.gq=null}
    // the game's frame, timed: how long the main thread spends on it (frame() sets last to now when it runs)
    renderer.setAnimationLoop(now=>{const t=performance.now();frame(now);if(last===now){tour.cpu=performance.now()-t;tourSample(now)}})}}

// the run proper: on foot on Dexter's Island
function tourBegin(){tour.readyT=tour.pt;startOn('dexter','foot');camSet(tour.fp?'cab':'chase');orbitYaw=0;orbitPitch=0.32;tour.t=0;tour.pt=0;tour.ph='start';tourLeg("Starting on Dexter's Island")}
// walking to a point, giving it up if he makes no headway for 5 s (something in the way); true once there or given up
function tourWalkOn(x,z,near){const d=tourWalkTo(x,z),m=tour.walkM||(tour.walkM={x:wk.x,z:wk.z,t:tour.t});
  if(Math.hypot(wk.x-m.x,wk.z-m.z)>1){m.x=wk.x;m.z=wk.z;m.t=tour.t}
  if(d<(near||0.8)){tour.walkM=null;return true}
  if(tour.t-m.t>5){tour.walkM=null;tour.walkSkip=(tour.walkSkip||0)+1;return true}return false}

// each frame, before the inputs are read (main.js): what the thumb does now
function tourStep(dt){if(!tour.on)return;tour.t+=dt;tour.pt+=dt;tour.dt=dt;SL.x=SL.y=0;const ph=tour.ph;
  if(ph==='ready'){if(warmIdle()&&tour.pt>1||tour.pt>45)tourBegin();return}
  if(ph==='start'){if(tour.pt>2.5){
      tourCheck("Started on Dexter's Island on foot",mode==='walk'&&!wk.inside&&Math.hypot(wk.x-DEX_X,wk.z-DEX_Z)<70,`at ${Math.round(wk.x)}, ${Math.round(wk.z)}`);
      tourCheck('The four-wheeler is on Dexter\'s Island',tour.atv>=0,tour.atv>=0?'hv'+tour.atv:'not found');
      if(tour.atv<0)tourGo('done');else tourGo('walk','On foot to the four-wheeler')}}
  else if(ph==='walk'){const h=hvs[tour.atv],k='hv'+tour.atv;tourWalkTo(h.x,h.z);
    if(wkNear()===k){seatToggle();tourCheck('Walked to the four-wheeler and got on',mode==='heavy'&&wk.inside===k,`${tour.pt.toFixed(1)} s on foot`);
      if(mode==='heavy')tourGo('atv','Four-wheeler to the dock');else tourGo('done')}
    else if(tour.pt>40){tourCheck('Walked to the four-wheeler and got on',false,`not in reach after 40 s, ${tourFt(Math.hypot(h.x-wk.x,h.z-wk.z))} away`);tourGo('done')}}
  else if(ph==='atv'){const h=hvs[tour.atv],[x,z]=TOUR_ATV[tour.wi],last=tour.wi===TOUR_ATV.length-1,d=tourDrive(h,x,z,last?8:4,0.8);
    if(d<(last?2.5:4)){if(last){tourCheck('Drove the four-wheeler to the dock',true,`${tour.pt.toFixed(1)} s`);tourGo('atvOff')}else tour.wi++}
    else if(tour.pt>60){tourCheck('Drove the four-wheeler to the dock',false,`${tourFt(d)} short after 60 s`);tourGo('atvOff')}}
  else if(ph==='atvOff'){const h=hvs[tour.atv];if(h.v>0.3)SL.y=-0.5;
    if(Math.abs(h.v)<0.2&&tour.pt>0.5||tour.pt>4){seatToggle();tourCheck('Climbed off the four-wheeler',mode==='walk'&&!wk.inside,`${tour.pt.toFixed(1)} s to stop`);
      if(mode==='walk')tourGo('dock','On foot along the dock');else tourGo('done')}}
  else if(ph==='dock'){const b=boats[3];
    if(tour.wi<TOUR_DOCK.length){const [x,z]=TOUR_DOCK[tour.wi];if(tourWalkTo(x,z)<0.8)tour.wi++}else tourWalkTo(b.x,b.z);
    if(wkNear()==='boat3'){seatToggle();tourCheck("Walked out along the dock and got in Dexter's boat",mode==='boat'&&wk.inside==='boat3',`${tour.pt.toFixed(1)} s on foot`);
      if(mode==='boat')tourGo('boat',tour.route[0].n);else tourGo('done')}
    else if(tour.pt>45){tourCheck("Walked out along the dock and got in Dexter's boat",false,`not in reach after 45 s, at ${Math.round(wk.x)}, ${Math.round(wk.z)}`);tourGo('done')}}
  else if(ph==='boat'){const b=boats[3],L=tour.route[tour.li],[x,z]=L.p[tour.wi],end=tour.li===tour.route.length-1&&tour.wi===L.p.length-1;
    const d=tourDrive(b,x,z,end?30:12,1),Lg=tour.legs[L.n];
    // a waypoint the boat can't make in 70 s is passed over (a fail for that leg) so one snag doesn't end the run
    const skip=tour.pt>70;if(d<(end?8:16)||skip){if(skip)Lg.skip=(Lg.skip||0)+1;tour.pt=0;
      if(++tour.wi>=L.p.length){Lg.t=tour.t-Lg.t0;tourCheck(`Boat: ${L.n}`,!Lg.skip,`${Lg.t.toFixed(0)} s${Lg.stuck?`, stuck ${Lg.stuck}×`:''}${Lg.skip?`, ${Lg.skip} waypoint${Lg.skip>1?'s':''} missed`:''}`);
        const nx=tour.route[tour.li+1];if(nx&&nx.lap!==L.lap)tourLap();
        if(L.town){tourGo('tmoor','Tying up at the marina');return}
        if(++tour.li>=tour.route.length){tourGo('moor','Mooring');return}tour.wi=0;tourLeg(tour.route[tour.li].n)}}}
  // the town stop: up beside the marina pier slowly, out onto the pier, the walk, and back into the boat
  else if(ph==='tmoor'){const b=boats[3],[x,z]=TOUR_MOOR[tour.wi],last=tour.wi===TOUR_MOOR.length-1,d=tourDrive(b,x,z,last?14:10,last?0.6:0.8);
    if(d<(last?2:6)){if(!last)tour.wi++;else{tour.ph='tstop';tour.pt=0}}
    else if(tour.pt>60){tourCheck('Tied up at the marina',false,`${tourFt(d)} short after 60 s`);tour.ph='tstop';tour.pt=0}}
  else if(ph==='tstop'){const b=boats[3];if(b.v>0.2)SL.y=-0.5;
    if(Math.abs(b.v)<0.25&&tour.pt>0.5||tour.pt>5){seatToggle();tourCheck('Tied up at the marina and climbed out onto the pier',mode==='walk'&&!wk.inside&&wk.y>WATER+0.5,`at ${Math.round(wk.x)}, ${Math.round(wk.z)}`);
      tour.walkSkip=0;tour.walkM=null;tourGo('town','On foot through town: Main Street')}}
  else if(ph==='town'){const b=boats[3];
    if(tour.wi<TOUR_TOWN.length){const [x,z]=TOUR_TOWN[tour.wi];if(tourWalkOn(x,z,1.2))tour.wi++}else tourWalkTo(b.x,b.z);
    if(tour.wi>=TOUR_TOWN.length&&wkNear()==='boat3'){seatToggle();const sk=tour.walkSkip||0;
      tourCheck('Walked through town (boardwalk, Main Street, the cross street) and back into the boat',mode==='boat'&&!sk,`${tour.pt.toFixed(0)} s on foot${sk?`, ${sk} point${sk>1?'s':''} out of reach`:''}`);
      if(mode!=='boat'){tourGo('done');return}
      if(++tour.li>=tour.route.length){tourGo('moor','Mooring');return}
      // out the way it came in, clear of the pier and the town's boat, before the next leg
      const nx=tour.route[tour.li];tour.route[tour.li]=Object.assign({},nx,{p:[[64,528],[58,495],...nx.p]});tourGo('boat',nx.n);tour.rec=3.5}
    else if(tour.pt>240){tourCheck('Walked through town (boardwalk, Main Street, the cross street) and back into the boat',false,`still at ${Math.round(wk.x)}, ${Math.round(wk.z)} after 4 min`);tourGo('done')}}
  else if(ph==='moor'){const b=boats[3];if(b.v>0.3)SL.y=-0.6;
    if(Math.abs(b.v)<0.3||tour.pt>6){if(tour.fp){const L=tour.look;tourCheck('Looked round in first person',L.n>=6&&L.names.size>=4&&(L.vmax||0)<=1.01,`${L.n} glances at ${L.names.size} different things (${[...L.names].slice(0,8).join(', ')}), the head turned up to ${Math.round(L.max*180/Math.PI)}° from the seat, never faster than ${Math.round((L.vmax||0)*180/Math.PI)}°/s`)}
      const C=tour.cnt;
      tourCheck('The camera stayed out of the water',C.under<=Math.max(2,C.n*0.002),C.under?`under the surface in ${C.under} of ${C.n} frames`:'never under the surface');
      tourCheck('Nothing fell through the ground',!C.fell,C.fell?`below the ground in ${C.fell} frames`:'the worker and the four-wheeler stayed on top');
      tourCheck('The boat stayed afloat',!C.sank,C.sank?`under water in ${C.sank} frames`:'always on the surface');
      if(C.snd)tourCheck('The sound kept playing',C.mute<=Math.max(30,C.snd*0.005),C.mute?`the sound was stopped in ${C.mute} of ${C.snd} frames`:'running all the way');
      tourCheck("Back at Dexter's dock",Math.hypot(b.x-b.home.x,b.z-b.home.z)<60,`${tourFt(Math.hypot(b.x-b.home.x,b.z-b.home.z))} from where it was tied up`);tourLap();tourGo('done')}}
  else if(ph==='done'){if(!tour.headless&&tour.pt>0.2)tourEnd()}
  // what should never happen, counted each frame: the camera under the water, the worker or the machine below the ground,
  // the boat under, the sound stopped while it is switched on
  if(ph!=='start'&&ph!=='done'&&ph!=='ready'){const C=tour.cnt,c=camera.position;C.n++;
    if(c.y<lakeY(c.x,c.z)-0.05&&!(mode==='walk'&&wk.swim))C.under++;
    if(mode==='walk'&&!wk.inside&&!wk.swim&&wk.y<surfAt(wk.x,wk.z)-1)C.fell++;
    if(mode==='heavy'){const h=hvCur();if(h.y<surfAt(h.x,h.z)-1)C.fell++}
    if(mode==='boat'&&btCur().y<WATER-0.8)C.sank++;
    if(sndCfg.on&&actx&&!document.hidden){C.snd++;if(actx.state!=='running')C.mute++}}
  if(tour.fp&&tour.on&&ph!=='start'&&ph!=='done'&&camMode==='cab')tourLook(dt)}
// the end of a lap: memory then, for the lap-to-lap check
function tourLap(){const m=renderer.info.memory;tour.laps.push({t:tour.t,heap:performance.memory?performance.memory.usedJSHeapSize:0,geo:m.geometries,tex:m.textures})}

// the graphics card's times that are back: each to its leg (none while the card's clock jumped: disjoint)
function tourGpuPoll(){const G=tour.gq;if(!G)return;const {gl,ext}=G;let dis=false;try{dis=gl.getParameter(ext.GPU_DISJOINT_EXT)}catch(e){}
  while(G.busy.length){const b=G.busy[0];if(!gl.getQueryParameter(b.q,gl.QUERY_RESULT_AVAILABLE))break;G.busy.shift();
    if(!dis){const L=tour.legs[b.leg];if(L)L.gpu.push(gl.getQueryParameter(b.q,gl.QUERY_RESULT)/1e6)}G.free.push(b.q)}}
// after each drawn frame (the timed loop in tourStart): the frame's time, the main thread's and the graphics card's
// share of it, what the main thread spent it on, and where the player was
function tourSample(now){const ft=tour.prevNow?(now-tour.prevNow)/1000:0;tour.prevNow=now;tourGpuPoll();
  if(tour.ph==='ready'||document.hidden||tour.hidSkip){tour.hidSkip=false;bht.sec={};bhtNew();if(tour.ph==='ready'){tour.barT-=ft;if(tour.barT<=0){tour.barT=0.25;$('#benchBar').innerHTML=`ISLAND TOUR TEST${tourSweepLbl()}<small>Getting the game ready (shaders, textures, detailed machines)… ${Math.round(tour.pt)} s</small>`}}return}
  const L=tour.legs[tour.leg];if(L){if(!L.sys)L.sys={};for(const n in bht.sec)L.sys[n]=(L.sys[n]||0)+bht.sec[n]}
  bhtHitch(ft,tour.leg);if(!ft||!L||tour.ph==='start'&&tour.pt<1)return;
  L.ft.push(ft);L.cpu.push(tour.cpu);L.tris+=renderer.info.render.triangles;L.calls+=renderer.info.render.calls;L.k++;
  const P=tourPos();tour.pathT-=ft;if(tour.pathT<=0){tour.pathT=0.5;tour.path.push([Math.round(P.x),Math.round(P.z)])}
  // the 40 slowest frames of the run and where they were
  const S=tour.slow;if(S.length<40||ft>S[S.length-1].ft){S.push({ft,x:P.x,z:P.z,leg:tour.leg});S.sort((a,b)=>b.ft-a.ft);if(S.length>40)S.pop()}
  const p=renderer.getPixelRatio();tour.pr[0]=Math.min(tour.pr[0],p);tour.pr[1]=Math.max(tour.pr[1],p);
  if(tour.heap)tour.heap[1]=Math.max(tour.heap[1],performance.memory.usedJSHeapSize);
  tour.barT-=ft;if(tour.barT<=0){tour.barT=0.25;const f=L.ft.slice(-30),fps=f.length/f.reduce((a,b)=>a+b,0);
    $('#benchBar').innerHTML=`ISLAND TOUR TEST${tour.fp?' · FIRST PERSON':''}${tourSweepLbl()} · ${Math.round(fps)} FPS<small>${tour.leg} · ${Math.floor(tour.t/60)}:${String(Math.floor(tour.t%60)).padStart(2,'0')} · tap here to stop</small>`}}

// the route on the site map with the slow frames on it (a dot sized by how long the frame took): a picture in the results
function tourMap(){try{const P=tour.path;if(P.length<4)return '';let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const [x,z] of P){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z)}
  const W=480,H=360,pad=30,mpp=Math.max((x1-x0+2*pad)/W,(z1-z0+2*pad)/H),cx=(x0+x1)/2,cz=(z0+z1)/2;
  const cv=document.createElement('canvas');cv.style.cssText=`position:fixed;left:-9999px;top:0;width:${W}px;height:${H}px`;document.body.appendChild(cv);
  drawMap(cv,cx,cz,mpp,false);const g=cv.getContext('2d'),k=cv.width/W,X=x=>((x-cx)/mpp+W/2)*k,Y=z=>((z-cz)/mpp+H/2)*k;
  g.lineWidth=2*k;g.strokeStyle='rgba(255,255,255,.85)';g.beginPath();P.forEach(([x,z],i)=>i?g.lineTo(X(x),Y(z)):g.moveTo(X(x),Y(z)));g.stroke();
  for(const s of tour.slow){const r=Math.min(14,3+s.ft*60)*k;g.fillStyle=s.ft>BHT_HITCH?'rgba(230,40,30,.9)':s.ft>TOUR_STUT?'rgba(255,150,30,.85)':'rgba(255,220,60,.7)';g.beginPath();g.arc(X(s.x),Y(s.z),r,0,6.3);g.fill()}
  const url=cv.toDataURL('image/jpeg',0.82);cv.remove();return url}catch(e){return ''}}
// earlier runs on this device (newest last), and the one this run is compared with: the last with the same view, graphics and conditions
const tourKind=()=>`tour${tour.fp?' first person':''}${tour.opt.rain?' rain':''}${tour.opt.night?' night':''}${tour.opt.laps>1?' '+tour.opt.laps+' laps':''}`;
function tourHist(){try{return JSON.parse(localStorage.getItem('bhd_tours')||'[]')}catch(e){return []}}

function tourResults(){
  const q=(a,f)=>a.length?a[Math.min(a.length-1,Math.floor(a.length*f))]:0,cls=f=>f>=55?'fps-good':f>=30?'fps-mid':'fps-bad',srt=a=>a.slice().sort((x,y)=>x-y);
  const rows=Object.values(tour.legs).filter(L=>L.k>0).map(L=>{const ft=srt(L.ft),tot=ft.reduce((a,b)=>a+b,0),med=q(ft,0.5),cpu=srt(L.cpu),gpu=srt(L.gpu||[]);
    const stut=L.ft.filter(f=>f>TOUR_STUT&&f>2*med).length,sys=Object.entries(L.sys||{}).map(([n,ms])=>[BHT_TIMED[n]||n,ms/L.k]).sort((a,b)=>b[1]-a[1]).slice(0,4);
    return {name:L.name,n:ft.length,avg:ft.length/tot,low:1/q(ft,0.99),worst:ft[ft.length-1]*1000,med:med*1000,stut,cpu:q(cpu,0.5),cpu95:q(cpu,0.95),gpu:gpu.length?q(gpu,0.5):null,gpu95:gpu.length?q(gpu,0.95):null,
      tris:L.tris/L.k,calls:L.calls/L.k,stuck:L.stuck,sys}});
  rows.forEach(r=>{r.busy=Math.max(r.cpu,r.gpu||0);r.use=r.med?r.busy/r.med:0});
  const all=[].concat(...Object.values(tour.legs).map(L=>L.ft)),tot=all.reduce((a,b)=>a+b,0),avg=all.length?all.length/tot:0,allS=srt(all);
  const stut=rows.reduce((a,r)=>a+r.stut,0),slow=rows.reduce((a,r)=>!a||r.avg<a.avg?r:a,null),busiest=rows.reduce((a,r)=>!a||r.busy>a.busy?r:a,null),bad=tour.checks.filter(c=>!c.ok),hs=bht.hitches||[];
  const m=renderer.info.memory,o=tour.mem0||m,mb=v=>(v/1048576).toFixed(0)+' MB',progs=(renderer.info.programs||[]).length-(tour.progs0||0);
  const w=renderer.domElement.width,h=renderer.domElement.height,gpuN=gpuName(),ver=window.EFFORT&&EFFORT.versions?EFFORT.versions[EFFORT.versions.length-1].v:'?';
  const device=`${gpuN} · ${w}×${h} px · Graphics ${gfxName()} · ${navigator.platform||''}`,fpsOk=!!slow&&slow.avg>=30,hasGpu=rows.some(r=>r.gpu!==null);
  const n=rows.reduce((a,r)=>a+r.n,0)||1,cpuMed=rows.reduce((a,r)=>a+r.cpu*r.n,0)/n,gpuMed=hasGpu?rows.reduce((a,r)=>a+(r.gpu||0)*r.n,0)/n:null,ftMed=q(allS,0.5)*1000;
  // capped: the frames come at the screen's own rate (60, 75, 90, 120, 144 Hz), so the frame rate can't show how hard it is working
  const hz=[60,75,90,120,144,165,240].find(f=>Math.abs(ftMed-1000/f)<1000/f*0.04),capped=!!hz&&avg>hz*0.97;
  const part=gpuMed!==null&&gpuMed>cpuMed?'graphics card':'main thread (the game\'s code and three.js)',busyMed=Math.max(cpuMed,gpuMed||0);
  const verdict=!rows.length?'':capped?`capped by the screen at ${hz} Hz: the frame rate can't go higher. The busiest part, the ${part}, uses ${Math.round(busyMed/ftMed*100)}% of each frame${busiest?`, most on ${busiest.name} (${busiest.busy.toFixed(1)} ms of ${busiest.med.toFixed(1)})`:''}`
    :gpuMed!==null?(gpuMed>cpuMed?`held back by the graphics card (${gpuMed.toFixed(1)} ms a frame against ${cpuMed.toFixed(1)} ms on the main thread): fewer pixels, shadows or effects help`:`held back by the main thread (${cpuMed.toFixed(1)} ms a frame against ${gpuMed.toFixed(1)} ms on the graphics card): the game's code is the limit`)
    :cpuMed>ftMed*0.75?`probably held back by the main thread (${cpuMed.toFixed(1)} of ${ftMed.toFixed(1)} ms a frame; this browser doesn't report the graphics card's time)`:`probably held back by the graphics card (the main thread needs only ${cpuMed.toFixed(1)} of ${ftMed.toFixed(1)} ms a frame; this browser doesn't report the graphics card's time)`;
  // the last run like this one on this device, to compare with
  const kind=tourKind(),prev=tourHist().filter(r=>r.kind===kind&&r.gfx===gfxKey&&r.gpu===gpuN).pop(),pl=prev?prev.legs:{};
  const dl=r=>{const p=pl[r.name];if(!p)return '';const d=r.avg-p.avg,db=r.busy-p.busy;
    return Math.abs(d)>=1?`<span class="${d<0?'fps-bad':'fps-good'}">${d>0?'+':''}${d.toFixed(1)}</span>`:Math.abs(db)>=0.5?`<span class="${db>0?'fps-bad':'fps-good'}">${db>0?'+':''}${db.toFixed(1)} ms</span>`:'same'};
  // lap 2 against lap 1: the same legs, so a slower second lap is the device slowing as it warms up
  let lapTxt='';const l2=rows.filter(r=>r.name.startsWith('Lap 2 · '));
  if(l2.length){const pair=l2.map(r=>[rows.find(x=>x.name===r.name.slice(8)),r]).filter(p=>p[0]),a1=pair.reduce((a,p)=>a+p[0].avg,0)/pair.length,a2=pair.reduce((a,p)=>a+p[1].avg,0)/pair.length,b1=pair.reduce((a,p)=>a+p[0].busy,0)/pair.length,b2=pair.reduce((a,p)=>a+p[1].busy,0)/pair.length;
    const L=tour.laps,grow=L.length>=2?L[L.length-1].geo-L[0].geo:0,hg=L.length>=2&&L[0].heap?(L[L.length-1].heap-L[0].heap)/1048576:0;
    lapTxt=`Lap 2 ran at ${a2.toFixed(1)} FPS against ${a1.toFixed(1)} on lap 1 (busiest part ${b2.toFixed(1)} ms against ${b1.toFixed(1)} ms a frame)${a2<a1*0.9||b2>b1*1.15?': it slowed down as it went on, most likely the device warming up and holding itself back':': no slowdown from heat'}. `+
      `Between laps the meshes went ${grow>=0?'up':'down'} by ${Math.abs(grow)}${hg?` and JS memory by ${hg.toFixed(0)} MB`:''}${grow>20||hg>40?': something may be piling up (a leak)':': no sign of a leak'}.`}
  const bat=tour.bat&&tour.bat0!==null?`${Math.round(tour.bat0*100)}% to ${Math.round(tour.bat.level*100)}%${tour.bat.charging?' (charging)':''}`:'not reported by this browser';
  let sum=`<div class="lbl">Frame rate over the tour</div><div class="big ${slow?cls(slow.avg):''}">${avg?avg.toFixed(1)+' FPS':'Not measured'}</div>`;
  if(slow)sum+=`<p>Slowest leg: <b>${slow.name}</b>, ${slow.avg.toFixed(1)} FPS (1% low ${slow.low.toFixed(0)}).</p>`;
  if(rows.length)sum+=`<p>${stut} stutter${stut===1?'':'s'}, ${hs.length} freeze${hs.length===1?'':'s'} over ${BHT_HITCH} s. ${verdict.charAt(0).toUpperCase()+verdict.slice(1)}.</p>`;
  if(prev)sum+=`<p>Against your last run like this (version ${prev.v}, ${new Date(prev.t).toLocaleDateString()}): ${avg.toFixed(1)} FPS against ${prev.avg.toFixed(1)}, busiest part ${busyMed.toFixed(1)} ms against ${(prev.busy||0).toFixed(1)} ms a frame. The Vs last column has each leg.</p>`;
  if(lapTxt)sum+=`<p>${lapTxt}</p>`;
  sum+=`<div class="lbl" style="margin-top:8px">The run</div><div class="big ${bad.length||tour.errs.length?'fps-bad':'fps-good'}">${bad.length?bad.length+' of '+tour.checks.length+' failed':'All '+tour.checks.length+' passed'}</div>`;
  if(tour.errs.length)sum+=`<p class="fps-bad">${tour.errs.length} script error${tour.errs.length>1?'s':''}: see below.</p>`;
  const img=tourMap();if(img)sum+=`<div class="lbl" style="margin-top:8px">Where the slow frames were</div><img src="${img}" alt="The route on the map with the slowest frames marked" style="width:100%;border-radius:8px;margin-top:4px">`;
  let diag='<tr><th>Check</th><th>Result</th></tr>';
  for(const c of tour.checks)diag+=`<tr><td>${c.name}<br><small style="color:var(--muted)">${c.note}</small></td><td class="${c.ok?'fps-good':'fps-bad'}">${c.ok?'Pass':'Fail'}</td></tr>`;
  const cond=[tour.fp?'first person, the head looking round':'chase camera',tour.opt.rain?'rain':'',tour.opt.night?'night':'',tour.opt.laps>1?tour.opt.laps+' laps':''].filter(Boolean).join(', ');
  const sys=[['Conditions',cond],['Time',`${Math.floor(tour.t/60)} min ${Math.round(tour.t%60)} s, ${all.length} frames`],['Resolution',tour.pr?`${tour.pr[0]}× to ${tour.pr[1]}× (auto resolution ${tour.pr[0]<tour.pr[1]?'stepped':'held'})`:'–'],
    ['Graphics card time',hasGpu?`${gpuMed.toFixed(1)} ms a frame (median)`:'not reported by this browser'],
    ['Long tasks',tour.obs?`${tour.lt.n}, ${Math.round(tour.lt.ms)} ms in all, the longest ${Math.round(tour.lt.max)} ms`:'not reported by this browser'],
    ['JS memory',tour.heap?`${mb(tour.heap[0])} at the start, ${mb(tour.heap[1])} at the most, ${mb(performance.memory.usedJSHeapSize)} at the end`:'not reported by this browser'],
    ['Graphics memory',`${m.geometries} meshes (${m.geometries-o.geometries>=0?'+':''}${m.geometries-o.geometries}), ${m.textures} textures (${m.textures-o.textures>=0?'+':''}${m.textures-o.textures}), ${progs} new shaders`],
    ['Getting ready',`${tour.readyT.toFixed(1)} s before the run (shaders, textures and detailed machines got ready; not counted in the run)`],['Window hidden',tour.hidMs>500?`${(tour.hidMs/1000).toFixed(0)} s, left out`:'never'],
    ['Boat stuck at',tour.stuckAt.length?tour.stuckAt.map(([x,z,l])=>`${x}, ${z} m (${l})`).join('; '):'nowhere'],['Battery',bat],['Script errors',tour.errs.length?tour.errs.slice(0,5).join(' | '):'none']];
  for(const [k,v] of sys)diag+=`<tr><td>${k}</td><td>${v}</td></tr>`;
  const busyTd=r=>`${r.cpu.toFixed(1)}${r.gpu!==null?' · '+r.gpu.toFixed(1):''} ms <small>(${Math.round(r.use*100)}%)</small>`;
  let table=`<tr><th>Leg</th><th>Avg FPS</th><th>1% low</th><th>Worst</th><th>Stutters</th><th>${hasGpu?'Main · GPU':'Main thread'}</th><th>Tris · calls</th><th>Vs last</th></tr>`;
  for(const r of rows)table+=`<tr><td>${r.name}${r.stuck?` <small>(stuck ${r.stuck}×)</small>`:''}</td><td class="${cls(r.avg)}">${r.avg.toFixed(1)}</td><td class="${cls(r.low)}">${r.low.toFixed(0)}</td><td>${Math.round(r.worst)} ms</td><td>${r.stut}</td><td>${busyTd(r)}</td><td>${fmtTris(r.tris)} · ${Math.round(r.calls)}</td><td>${dl(r)||'–'}</td></tr>`;
  table+='<tr><th colspan="8">Where the main thread\'s time goes, per frame</th></tr>';
  for(const r of rows)if(r.sys.length)table+=`<tr><td>${r.name}</td><td colspan="7"><small>${r.sys.map(([k,ms])=>`${k} ${ms.toFixed(1)} ms`).join(' · ')}</small></td></tr>`;
  const spots=[];for(const s of tour.slow){if(spots.length>=8)break;if(spots.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<25))continue;spots.push(s)}
  if(spots.length){table+='<tr><th colspan="8">Slowest spots (the dots on the map)</th></tr>';
    for(const s of spots)table+=`<tr><td colspan="8">${Math.round(s.ft*1000)} ms · ${mapPlace(s.x,s.z)} (${Math.round(s.x/FT)}, ${Math.round(s.z/FT)} ft) · ${s.leg}</td></tr>`}
  const loafTxt=f=>`${(f.ms/1000).toFixed(1)} s, ${f.leg}: `+(f.scripts.length?f.scripts.map(sc=>`${sc.n}${sc.f?' ('+sc.f+')':''} ${sc.ms} ms`).join(', '):'no script ran: the browser or graphics card');
  if(hs.length||tour.loaf.length){table+='<tr><th colspan="8">Freezes (slow frames, with what was slow in them)</th></tr>';for(const x of hs.slice(0,12))table+=`<tr><td colspan="8">${bhtHitchTxt(x)}</td></tr>`;
    for(const f of tour.loaf.slice(0,12))table+=`<tr><td colspan="8">Scripts in a ${loafTxt(f)}</td></tr>`}
  const text=[`Corley's Island tour test (${cond}), game version ${ver}`,`GPU: ${gpuN}`,`Graphics: ${gfxName()}${PHONE?' (phone)':''}`,`Resolution: ${w}x${h}`,
    `Frame rate: ${avg?avg.toFixed(1)+' FPS average':'not measured'}${slow?`, slowest leg ${slow.name} at ${slow.avg.toFixed(1)}`:''}`,
    `Stutters: ${stut} · freezes over ${BHT_HITCH} s: ${hs.length} · ${verdict}`,
    prev?`Vs last run like this (v${prev.v}): ${avg.toFixed(1)} FPS against ${prev.avg.toFixed(1)}, busiest ${busyMed.toFixed(1)} ms against ${(prev.busy||0).toFixed(1)} ms`:'Vs last run: none like this on this device yet',
    ...(lapTxt?[lapTxt]:[]),
    `Checks: ${bad.length?bad.length+' of '+tour.checks.length+' FAILED':'all '+tour.checks.length+' passed'}`,...tour.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),
    ...sys.map(([k,v])=>`${k}: ${v}`),'Legs:',
    ...rows.map(r=>`${r.name} | ${r.avg.toFixed(1)} avg FPS | ${r.low.toFixed(0)} 1% low | ${Math.round(r.worst)} ms worst | ${r.stut} stutters | main thread ${r.cpu.toFixed(1)} ms (95% ${r.cpu95.toFixed(1)})${r.gpu!==null?` | GPU ${r.gpu.toFixed(1)} ms (95% ${r.gpu95.toFixed(1)})`:''} | ${Math.round(r.use*100)}% of the frame busy | ${fmtTris(r.tris)} tris | ${Math.round(r.calls)} calls${r.stuck?' | stuck '+r.stuck+'x':''}${r.sys.length?' | '+r.sys.map(([k,ms])=>`${k} ${ms.toFixed(1)}`).join(', '):''}`),
    'Slowest spots:',...spots.map(s=>`${Math.round(s.ft*1000)} ms | ${mapPlace(s.x,s.z)} | ${Math.round(s.x)}, ${Math.round(s.z)} m | ${s.leg}`),
    `Freezes: ${hs.length?hs.length:'none'}`,...hs.slice(0,20).map(bhtHitchTxt),...tour.loaf.slice(0,20).map(f=>'Scripts in a '+loafTxt(f))].join('\n');
  const rec={t:Date.now(),v:ver,kind,gfx:gfxKey,gpu:gpuN,avg,busy:busyMed,legs:Object.fromEntries(rows.map(r=>[r.name,{avg:+r.avg.toFixed(1),low:+r.low.toFixed(0),busy:+r.busy.toFixed(2),cpu:+r.cpu.toFixed(2),gpu:r.gpu===null?null:+r.gpu.toFixed(2),stut:r.stut}]))};
  return {title:`Island tour test${tour.fp?', first person,':''} results`,sum,diag,table,device,text,fpsOk,checksOk:!bad.length&&!tour.errs.length,checks:tour.checks,rows,rec,tour:1}}

// done: the run joins this device's history and the shared board, the results are kept for the reload (digtest.js
// shows them), the clock goes back, and the page reloads to put the player's site back. In a graphics sweep the next
// level's run follows the reload instead (tourSweepNext)
function tourEnd(){tour.on=false;SL.x=SL.y=0;const r=tourResults();
  try{const H=tourHist();H.push(r.rec);localStorage.setItem('bhd_tours',JSON.stringify(H.slice(-30)))}catch(e){}
  tourPut(r);
  try{if(tour.keepClock===null)localStorage.removeItem('bhd_clock');else localStorage.setItem('bhd_clock',tour.keepClock)}catch(e){}
  const S=tourSweepGet();
  if(S){S.res.push({g:gfxKey,name:GFX[gfxKey].name,avg:r.rec.avg,busy:r.rec.busy,legs:r.rec.legs,fails:r.checks.filter(c=>!c.ok).length});try{sessionStorage.setItem('bhd_tsweep',JSON.stringify(S))}catch(e){}}
  else{try{sessionStorage.setItem(DIGT_RES,JSON.stringify(r));sessionStorage.setItem('bhd_tourShow','1')}catch(e){}}
  if(tour.obs)tour.obs.disconnect();if(tour.lo)tour.lo.disconnect();$('#benchBar').innerHTML='ISLAND TOUR TEST DONE<small>Putting your site back…</small>';setTimeout(()=>location.reload(),400)}
// stopped by the player (a tap on the banner): no results are kept, a sweep ends, the graphics level and the clock go back,
// and the page reloads to put the site back, as at the end
function tourQuit(){const S=tourSweepGet();if(!tour.on&&!S)return;tour.on=false;SL.x=SL.y=0;
  try{sessionStorage.removeItem('bhd_tsweep')}catch(e){}if(S)setGfx(S.orig);
  try{if(tour.keepClock===null)localStorage.removeItem('bhd_clock');else if(tour.keepClock!==undefined)localStorage.setItem('bhd_clock',tour.keepClock)}catch(e){}
  if(tour.obs)tour.obs.disconnect();if(tour.lo)tour.lo.disconnect();$('#benchBar').innerHTML='ISLAND TOUR TEST STOPPED<small>Putting your site back…</small>';setTimeout(()=>location.reload(),400)}
$('#benchBar').addEventListener('click',()=>{if(tour.on||tourSweepGet())tourQuit()});
// the shared board (Supabase, supabase/island_tour.sql; on the Vercel site only, as sync is): every finished run
function tourPut(r){if(!sync.on)return;const d={legs:r.rec.legs,fails:r.checks.filter(c=>!c.ok).map(c=>c.name),busy:r.rec.busy,text:r.text.slice(0,20000)};
  syncRpc('island_tour_put',{p_v:+r.rec.v||0,p_device:r.device,p_gfx:gfxKey,p_kind:r.rec.kind,p_fps:+r.rec.avg.toFixed(2),p_data:d},true).catch(()=>{})}

// the graphics sweep: the tour once at each level (Low, Medium, High, Ultra), a reload between, then one table of all
// four; the level the player had goes back at the end
function tourSweepGet(){try{return JSON.parse(sessionStorage.getItem('bhd_tsweep')||'null')}catch(e){return null}}
function tourSweepLbl(){const S=tourSweepGet();return S?` · SWEEP ${S.res.length+1} OF ${S.res.length+S.left.length+1}`:''}
function tourSweep(fp){if(tour.on||bench.on)return;const S={left:['low','med','high','ultra'],res:[],orig:gfxKey,fp:!!fp,opt:Object.assign({},tourOpt)};
  try{sessionStorage.setItem('bhd_tsweep',JSON.stringify(S))}catch(e){return}tourSweepNext()}
function tourSweepNext(){const S=tourSweepGet();if(!S)return;
  if(!S.left.length){try{sessionStorage.removeItem('bhd_tsweep')}catch(e){}setGfx(S.orig);tourSweepShow(S);return}
  const g=S.left.shift();try{sessionStorage.setItem('bhd_tsweep',JSON.stringify(S))}catch(e){}help.hidden=true;setGfx(g);
  $('#benchBar').hidden=false;$('#benchBar').innerHTML=`ISLAND TOUR TEST · SWEEP<small>Next: ${GFX[g].name}… · tap here to stop</small>`;setTimeout(()=>{if(tourSweepGet())tourStart(S.fp,S.opt)},4000)}
function tourSweepShow(S){const R=S.res,names=[...new Set([].concat(...R.map(x=>Object.keys(x.legs))))],cls=f=>f>=55?'fps-good':f>=30?'fps-mid':'fps-bad';
  let table='<tr><th>Leg</th>'+R.map(x=>`<th>${x.name}</th>`).join('')+'</tr>';
  table+='<tr><td><b>Whole tour</b></td>'+R.map(x=>`<td class="${cls(x.avg)}"><b>${x.avg.toFixed(1)}</b> <small>${x.busy.toFixed(1)} ms</small></td>`).join('')+'</tr>';
  for(const n of names)table+=`<tr><td>${n}</td>`+R.map(x=>{const l=x.legs[n];return l?`<td class="${cls(l.avg)}">${l.avg.toFixed(1)} <small>${l.busy.toFixed(1)} ms</small></td>`:'<td>–</td>'}).join('')+'</tr>';
  const best=R.filter(x=>x.avg>=30).pop(),text=['Corley\'s Island tour test, graphics sweep',`GPU: ${gpuName()}`,...R.map(x=>`${x.name}: ${x.avg.toFixed(1)} FPS, busiest part ${x.busy.toFixed(1)} ms a frame${x.fails?`, ${x.fails} checks failed`:''}`),
    'Legs (FPS per level):',...names.map(n=>`${n} | `+R.map(x=>x.legs[n]?x.legs[n].avg.toFixed(1):'-').join(' | '))].join('\n');
  digTestShow({title:'Island tour test: every graphics level',sum:`<div class="lbl">Highest level above 30 FPS</div><div class="big ${best?'fps-good':'fps-bad'}">${best?best.name:'None'}</div><p>Each level ran the whole tour; the numbers are FPS, with the busiest part's time a frame beside them.</p>`,
    diag:'',table,device:`${gpuName()} · ${navigator.platform||''}`,text})}

// headless: the game's own frame stepped 20 times a game second with the drawing left out, until the run is done (or a
// step limit). The page is left in the test's state (nothing saves), so use a throwaway page (tools/play.js)
function tourRun(fp,opt){tour.headless=true;tourStart(fp,opt);renderer.setAnimationLoop(null);const draw=postRender;postRender=()=>{};
  let t=last,n=0;try{while(n<24000&&tour.ph!=='done'){frame(t+=50);n++}}finally{postRender=draw}
  if(tour.ph!=='done')tourCheck('The run finished',false,`stuck at "${tour.ph}"${tour.ph==='boat'?' on '+tour.route[tour.li].n:''} at ${Math.round(tourPos().x)}, ${Math.round(tourPos().z)}`);
  const b=boats[3];return {ok:tour.checks.every(c=>c.ok),time:`${Math.floor(tour.t/60)} min ${Math.round(tour.t%60)} s`,stucks:tour.stuckN,stuckAt:tour.stuckAt,boat:[Math.round(b.x),Math.round(b.z)],
    checks:tour.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`)}}

$('#tourTestBtn').onclick=()=>{showMenu(false);tourStart()};$('#tourFpBtn').onclick=()=>{showMenu(false);tourStart(true)};
// the start card's Tests row: each runs its ☰ Tools test straight away; the Tour row sets the tour's conditions and runs
// the sweep
for(const b of document.querySelectorAll('#startTests [data-test]'))b.onclick=()=>{help.hidden=true;$('#'+b.dataset.test).click()};
function tourOptShow(){for(const b of document.querySelectorAll('#startTourOpt [data-to]')){const k=b.dataset.to;b.setAttribute('aria-pressed',k==='laps'?tourOpt.laps>1:!!tourOpt[k])}}
for(const b of document.querySelectorAll('#startTourOpt [data-to]'))b.onclick=()=>{const k=b.dataset.to;if(k==='laps')tourOpt.laps=tourOpt.laps>1?1:2;else tourOpt[k]=!tourOpt[k];
  try{localStorage.setItem('bhd_tourOpt',JSON.stringify(tourOpt))}catch(e){}tourOptShow()};
tourOptShow();
$('#tourSweepBtn').onclick=()=>{help.hidden=true;tourSweep(false)};
// after the reload: other devices' latest runs from the shared board under this run's results
if((()=>{try{const v=sessionStorage.getItem('bhd_tourShow');sessionStorage.removeItem('bhd_tourShow');return v}catch(e){return null}})()&&sync.on)
  syncRpc('island_tour_list',{p_n:12}).then(L=>{if(!Array.isArray(L)||!L.length)return;let h='<tr><th colspan="8">Latest runs on every device (the shared board)</th></tr>';
    for(const x of L)h+=`<tr><td colspan="8">${new Date(x.t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · v${x.v} · ${x.kind} · ${GFX[x.gfx]?GFX[x.gfx].name:x.gfx} · <b>${x.fps!==null?(+x.fps).toFixed(1):'–'} FPS</b> · <small>${String(x.device).replace(/</g,'&lt;')}</small></td></tr>`;
    $('#benchTable').insertAdjacentHTML('beforeend',h)}).catch(()=>{});
{const q=new URLSearchParams(location.search);
  // ?tourtest runs it in chase view, ?tourfp in first person (=low, medium, high or ultra for that Graphics setting);
  // &rain, &night and &laps=2 add conditions, &sweep runs it at every level
  const k=q.has('tourfp')?'tourfp':q.has('tourtest')?'tourtest':null;
  if(k){const g=(q.get(k)||'').toLowerCase(),G=g==='medium'?'med':g,opt={rain:q.has('rain'),night:q.has('night'),laps:+q.get('laps')||1},sw=q.has('sweep');
    for(const d of [k,'rain','night','laps','sweep'])q.delete(d);const qs=q.toString();
    history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);
    setTimeout(()=>{if(sw){Object.assign(tourOpt,opt);tourSweep(k==='tourfp');return}if(GFX[G])setGfx(G);tourStart(k==='tourfp',opt)},5000)}
  // a sweep under way carries on after each reload
  else if(tourSweepGet())setTimeout(tourSweepNext,5000)}
