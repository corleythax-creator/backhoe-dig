// Corley's Island: the island tour test. Hands off: ☰ → Island tour test, or open the game with ?tourtest (=low, medium,
// high or ultra for that Graphics setting). It plays a run the way a player does, through the left touch stick and Get in
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
// the boat's legs round the lake (x, z in m); the bridges are passed between their piers, never through a trestle
const TOUR_LEGS=[
  {n:"Out from Dexter's dock",p:[[-200,145],[-130,122]]},
  {n:"Under the Corley's–Family bridge",p:[[-40,120],[40,120]]},
  {n:"North of Jessica's Island",p:[[140,140],[300,170]]},
  {n:"East of Jessica's Island",p:[[320,320],[260,385]]},
  {n:'Town waterfront and marina',p:[[140,440],[105,470],[60,450]]},
  {n:'Under the mainland bridge, past the crane barge',p:[[30,363],[-30,363],[-80,385]]},
  {n:"South and west of Dexter's",p:[[-200,410],[-330,330],[-330,170]]},
  {n:"West of Corley's",p:[[-300,20],[-160,-130]]},
  {n:'North channel: trestle and hayfield',p:[[-60,-200],[-150,-160]]},
  {n:"Back to Dexter's dock",p:[[-230,40],[-205,140]]}];
const tour={on:false,headless:false,ph:'',t:0,pt:0,checks:[],legs:{},leg:'',li:0,wi:0,atv:-1,moved:{x:0,z:0,t:0},stuck:0,stuckN:0,rec:0,
  prevNow:0,cpu:0,errs:[],lt:{n:0,ms:0,max:0},barT:0};
const tourFt=m=>Math.round(m/FT)+' ft',tourAng=a=>Math.atan2(Math.sin(a),Math.cos(a));
function tourCheck(name,ok,note){tour.checks.push({name,ok:!!ok,note:note||''})}
function tourGo(ph,leg){tour.ph=ph;tour.pt=0;tour.wi=0;tour.rec=0;tour.moved={x:1e9,z:1e9,t:tour.t};if(leg)tourLeg(leg)}
function tourLeg(n){tour.leg=n;if(!tour.legs[n])tour.legs[n]={name:n,ft:[],cpu:[],tris:0,calls:0,k:0,t0:tour.t,t:0,stuck:0}}
// the left stick pushed the way (x, z) lies from the worker, turned into the camera's frame as a thumb would push it
// (walker.js moves along the camera's heading); returns the distance left
function tourWalkTo(x,z){const dx=x-wk.x,dz=z-wk.z,d=Math.hypot(dx,dz);if(d<0.05)return d;
  const c=camMode==='cab'?wk.view:wk.view+orbitYaw,fx=Math.sin(c),fz=Math.cos(c),ux=dx/d,uz=dz/d,k=Math.min(1,0.35+d/1.5);
  SL.y=(ux*fx+uz*fz)*k;SL.x=(uz*fx-ux*fz)*k;return d}
// steers o (the four-wheeler or the boat: + steer turns right, so the yaw falls) at (x, z) and works the throttle: easing
// off for a sharp turn and in the last `slow` m. A machine that has made under 1.5 m in 3 s is stuck: it backs off for
// 2.5 s with the wheel over, and a leg counts its stucks
function tourDrive(o,x,z,slow,top){const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz),e=tourAng(Math.atan2(dx,dz)-o.yaw),Ts=turnSens||1;
  const m=tour.moved;if(Math.hypot(o.x-m.x,o.z-m.z)>1.5){m.x=o.x;m.z=o.z;m.t=tour.t}
  if(tour.rec>0){tour.rec-=tour.dt;SL.y=-0.8;SL.x=clamp(Math.sign(e||1)/Ts,-1,1);return d}
  if(tour.t-m.t>3){tour.rec=2.5;m.t=tour.t;tour.stuckN++;const L=tour.legs[tour.leg];if(L)L.stuck++;return d}
  SL.x=clamp(-e*2.2/Ts,-1,1);SL.y=clamp((1-0.7*Math.min(1,Math.abs(e)/1.6))*Math.min(1,0.2+d/slow),0.2,1)*top;return d}

function tourStart(){
  if(tour.on||bench.on||edOn)return;
  // whatever the player did last is saved first; nothing is saved from here until the page reloads
  siteSaveAll();window.syncHold=true;
  help.hidden=true;showMenu(false);toggleMap(false);$('#bench').hidden=true;$('#benchBar').hidden=false;
  Object.assign(tour,{on:true,ph:'start',t:0,pt:0,dt:0,checks:[],legs:{},leg:'',li:0,wi:0,stuckN:0,rec:0,prevNow:0,errs:[],lt:{n:0,ms:0,max:0},barT:0,
    pr:[renderer.getPixelRatio(),renderer.getPixelRatio()],mem0:Object.assign({},renderer.info.memory),progs0:(renderer.info.programs||[]).length,
    heap:performance.memory?[performance.memory.usedJSHeapSize,performance.memory.usedJSHeapSize]:null});
  // the four-wheeler and Dexter's boat back where they live, whatever the player did with them
  tour.atv=hvs.findIndex(h=>h.k==='atv'&&Math.hypot(h.K.x-DEX_X,h.K.z-DEX_Z)<100);const h=hvs[tour.atv];
  if(h){Object.assign(h,{x:h.K.x,z:h.K.z,yaw:h.K.yaw,v:0,w:0,steer:0});hvGround(h,1);hvPose(h)}
  const b=boats[3];Object.assign(b,{x:b.home.x,z:b.home.z,yaw:b.home.yaw,v:0});
  startOn('dexter','foot');camSet('chase');orbitYaw=0;orbitPitch=0.32;tourLeg("Starting on Dexter's Island");
  bhtTimeOn();bht.lastNow=0;
  if(!tour.headless){
    tour.onErr=e=>tour.errs.push(String(e.message||e.reason||e.type).slice(0,200));addEventListener('error',tour.onErr);addEventListener('unhandledrejection',tour.onErr);
    try{tour.obs=new PerformanceObserver(l=>{for(const e of l.getEntries()){tour.lt.n++;tour.lt.ms+=e.duration;tour.lt.max=Math.max(tour.lt.max,e.duration)}});tour.obs.observe({type:'longtask'})}catch(e){tour.obs=null}
    // the game's frame, timed: how long the main thread spends on it (frame() sets last to now when it runs)
    renderer.setAnimationLoop(now=>{const t=performance.now();frame(now);if(last===now){tour.cpu=performance.now()-t;tourSample(now)}})}}

// each frame, before the inputs are read (main.js): what the thumb does now
function tourStep(dt){if(!tour.on)return;tour.t+=dt;tour.pt+=dt;tour.dt=dt;SL.x=SL.y=0;const ph=tour.ph;
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
      if(mode==='boat')tourGo('boat',TOUR_LEGS[0].n);else tourGo('done')}
    else if(tour.pt>45){tourCheck("Walked out along the dock and got in Dexter's boat",false,`not in reach after 45 s, at ${Math.round(wk.x)}, ${Math.round(wk.z)}`);tourGo('done')}}
  else if(ph==='boat'){const b=boats[3],L=TOUR_LEGS[tour.li],[x,z]=L.p[tour.wi],end=tour.li===TOUR_LEGS.length-1&&tour.wi===L.p.length-1;
    const d=tourDrive(b,x,z,end?30:12,1),Lg=tour.legs[L.n];
    // a waypoint the boat can't make in 70 s is passed over (a fail for that leg) so one snag doesn't end the run
    const skip=tour.pt>70;if(d<(end?8:16)||skip){if(skip)Lg.skip=(Lg.skip||0)+1;tour.pt=0;
      if(++tour.wi>=L.p.length){Lg.t=tour.t-Lg.t0;tourCheck(`Boat: ${L.n}`,!Lg.skip,`${Lg.t.toFixed(0)} s${Lg.stuck?`, stuck ${Lg.stuck}×`:''}${Lg.skip?`, ${Lg.skip} waypoint${Lg.skip>1?'s':''} missed`:''}`);
        if(++tour.li>=TOUR_LEGS.length){tourGo('moor','Mooring');return}tour.wi=0;tourLeg(TOUR_LEGS[tour.li].n)}}}
  else if(ph==='moor'){const b=boats[3];if(b.v>0.3)SL.y=-0.6;
    if(Math.abs(b.v)<0.3||tour.pt>6){tourCheck("Back at Dexter's dock",Math.hypot(b.x-boats[3].home.x,b.z-boats[3].home.z)<60,`${tourFt(Math.hypot(b.x-b.home.x,b.z-b.home.z))} from where it was tied up`);tourGo('done')}}
  else if(ph==='done'){if(!tour.headless&&tour.pt>0.2)tourEnd()}}

// after each drawn frame (the timed loop in tourStart): the frame's time and the main thread's share of it
function tourSample(now){const ft=tour.prevNow?(now-tour.prevNow)/1000:0;tour.prevNow=now;
  const L=tour.legs[tour.leg];bhtHitch(ft,tour.leg);if(!ft||!L||tour.ph==='start'&&tour.pt<1)return;
  L.ft.push(ft);L.cpu.push(tour.cpu);L.tris+=renderer.info.render.triangles;L.calls+=renderer.info.render.calls;L.k++;
  const p=renderer.getPixelRatio();tour.pr[0]=Math.min(tour.pr[0],p);tour.pr[1]=Math.max(tour.pr[1],p);
  if(tour.heap)tour.heap[1]=Math.max(tour.heap[1],performance.memory.usedJSHeapSize);
  tour.barT-=ft;if(tour.barT<=0){tour.barT=0.25;const f=L.ft.slice(-30),fps=f.length/f.reduce((a,b)=>a+b,0);
    $('#benchBar').innerHTML=`ISLAND TOUR TEST · ${Math.round(fps)} FPS<small>${tour.leg} · ${Math.floor(tour.t/60)}:${String(Math.floor(tour.t%60)).padStart(2,'0')}</small>`}}

function tourResults(){
  const q=(a,f)=>a.length?a[Math.min(a.length-1,Math.floor(a.length*f))]:0,cls=f=>f>=55?'fps-good':f>=30?'fps-mid':'fps-bad';
  const rows=Object.values(tour.legs).filter(L=>L.k>0).map(L=>{const ft=L.ft.slice().sort((a,b)=>a-b),tot=ft.reduce((a,b)=>a+b,0),med=q(ft,0.5),cpu=L.cpu.slice().sort((a,b)=>a-b);
    const stut=L.ft.filter(f=>f>TOUR_STUT&&f>2*med).length;
    return {name:L.name,n:ft.length,avg:ft.length/tot,low:1/q(ft,0.99),worst:ft[ft.length-1]*1000,med:med*1000,stut,cpu:q(cpu,0.5),cpu95:q(cpu,0.95),tris:L.tris/L.k,calls:L.calls/L.k,stuck:L.stuck}});
  const all=[].concat(...Object.values(tour.legs).map(L=>L.ft)),tot=all.reduce((a,b)=>a+b,0),avg=all.length?all.length/tot:0,allS=all.slice().sort((a,b)=>a-b);
  const stut=rows.reduce((a,r)=>a+r.stut,0),slow=rows.reduce((a,r)=>!a||r.avg<a.avg?r:a,null),bad=tour.checks.filter(c=>!c.ok),hs=bht.hitches||[];
  const m=renderer.info.memory,o=tour.mem0||m,mb=v=>(v/1048576).toFixed(0)+' MB',progs=(renderer.info.programs||[]).length-(tour.progs0||0);
  const w=renderer.domElement.width,h=renderer.domElement.height,gpu=gpuName(),ver=window.EFFORT&&EFFORT.versions?EFFORT.versions[EFFORT.versions.length-1].v:'?';
  const device=`${gpu} · ${w}×${h} px · Graphics ${gfxName()} · ${navigator.platform||''}`,fpsOk=!!slow&&slow.avg>=30;
  const cpuMed=rows.length?rows.reduce((a,r)=>a+r.cpu*r.n,0)/rows.reduce((a,r)=>a+r.n,0):0,ftMed=q(allS,0.5)*1000;
  const bound=!rows.length?'':cpuMed>ftMed*0.75?'the main thread (the game\'s code and three.js): CPU-bound':'the graphics card and browser, not the game\'s code: GPU-bound';
  let sum=`<div class="lbl">Frame rate over the tour</div><div class="big ${slow?cls(slow.avg):''}">${avg?avg.toFixed(1)+' FPS':'Not measured'}</div>`;
  if(slow)sum+=`<p>Slowest leg: <b>${slow.name}</b>, ${slow.avg.toFixed(1)} FPS (1% low ${slow.low.toFixed(0)}).</p>`;
  if(rows.length)sum+=`<p>${stut} stutter${stut===1?'':'s'}, ${hs.length} freeze${hs.length===1?'':'s'} over ${BHT_HITCH} s. A typical frame took ${ftMed.toFixed(1)} ms, ${cpuMed.toFixed(1)} ms of it on the main thread: held back by ${bound}.</p>`;
  sum+=`<div class="lbl" style="margin-top:8px">The run</div><div class="big ${bad.length||tour.errs.length?'fps-bad':'fps-good'}">${bad.length?bad.length+' of '+tour.checks.length+' failed':'All '+tour.checks.length+' passed'}</div>`;
  if(tour.errs.length)sum+=`<p class="fps-bad">${tour.errs.length} script error${tour.errs.length>1?'s':''}: see below.</p>`;
  let diag='<tr><th>Check</th><th>Result</th></tr>';
  for(const c of tour.checks)diag+=`<tr><td>${c.name}<br><small style="color:var(--muted)">${c.note}</small></td><td class="${c.ok?'fps-good':'fps-bad'}">${c.ok?'Pass':'Fail'}</td></tr>`;
  const sys=[['Time',`${Math.floor(tour.t/60)} min ${Math.round(tour.t%60)} s, ${all.length} frames`],['Resolution',tour.pr?`${tour.pr[0]}× to ${tour.pr[1]}× (auto resolution ${tour.pr[0]<tour.pr[1]?'stepped':'held'})`:'–'],
    ['Long tasks',tour.obs?`${tour.lt.n}, ${Math.round(tour.lt.ms)} ms in all, the longest ${Math.round(tour.lt.max)} ms`:'not reported by this browser'],
    ['JS memory',tour.heap?`${mb(tour.heap[0])} at the start, ${mb(tour.heap[1])} at the most, ${mb(performance.memory.usedJSHeapSize)} at the end`:'not reported by this browser'],
    ['Graphics memory',`${m.geometries} meshes (${m.geometries-o.geometries>=0?'+':''}${m.geometries-o.geometries}), ${m.textures} textures (${m.textures-o.textures>=0?'+':''}${m.textures-o.textures}), ${progs} new shaders`],
    ['Script errors',tour.errs.length?tour.errs.slice(0,5).join(' | '):'none']];
  for(const [k,v] of sys)diag+=`<tr><td>${k}</td><td>${v}</td></tr>`;
  let table='<tr><th>Leg</th><th>Avg FPS</th><th>1% low</th><th>Worst</th><th>Stutters</th><th>Main thread</th><th>Tris · calls</th></tr>';
  for(const r of rows)table+=`<tr><td>${r.name}${r.stuck?` <small>(stuck ${r.stuck}×)</small>`:''}</td><td class="${cls(r.avg)}">${r.avg.toFixed(1)}</td><td class="${cls(r.low)}">${r.low.toFixed(0)}</td><td>${Math.round(r.worst)} ms</td><td>${r.stut}</td><td>${r.cpu.toFixed(1)} ms (95%: ${r.cpu95.toFixed(1)})</td><td>${fmtTris(r.tris)} · ${Math.round(r.calls)}</td></tr>`;
  if(hs.length){table+='<tr><th colspan="7">Freezes (slow frames, with what was slow in them)</th></tr>';for(const x of hs.slice(0,12))table+=`<tr><td colspan="7">${bhtHitchTxt(x)}</td></tr>`}
  const text=[`Corley's Island tour test, game version ${ver}`,`GPU: ${gpu}`,`Graphics: ${gfxName()}${PHONE?' (phone)':''}`,`Resolution: ${w}x${h}`,
    `Frame rate: ${avg?avg.toFixed(1)+' FPS average':'not measured'}${slow?`, slowest leg ${slow.name} at ${slow.avg.toFixed(1)}`:''}`,
    `Stutters: ${stut} · freezes over ${BHT_HITCH} s: ${hs.length} · typical frame ${ftMed.toFixed(1)} ms, main thread ${cpuMed.toFixed(1)} ms${bound?' ('+bound+')':''}`,
    `Checks: ${bad.length?bad.length+' of '+tour.checks.length+' FAILED':'all '+tour.checks.length+' passed'}`,...tour.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),
    ...sys.map(([k,v])=>`${k}: ${v}`),'Legs:',
    ...rows.map(r=>`${r.name} | ${r.avg.toFixed(1)} avg FPS | ${r.low.toFixed(0)} 1% low | ${Math.round(r.worst)} ms worst | ${r.stut} stutters | main thread ${r.cpu.toFixed(1)} ms (95% ${r.cpu95.toFixed(1)}) | ${fmtTris(r.tris)} tris | ${Math.round(r.calls)} calls${r.stuck?' | stuck '+r.stuck+'x':''}`),
    `Freezes: ${hs.length?hs.length:'none'}`,...hs.slice(0,20).map(bhtHitchTxt)].join('\n');
  return {title:'Island tour test results',sum,diag,table,device,text,fpsOk,checksOk:!bad.length&&!tour.errs.length,checks:tour.checks,rows}}
// done: the results are kept for the reload (digtest.js shows them), which puts the player's site back
function tourEnd(){tour.on=false;SL.x=SL.y=0;const r=tourResults();try{sessionStorage.setItem(DIGT_RES,JSON.stringify(r))}catch(e){}
  if(tour.obs)tour.obs.disconnect();$('#benchBar').innerHTML='ISLAND TOUR TEST DONE<small>Putting your site back…</small>';location.reload()}
// headless: the game's own frame stepped 20 times a game second with the drawing left out, until the run is done (or a
// step limit). The page is left in the test's state (nothing saves), so use a throwaway page (tools/play.js)
function tourRun(){tour.headless=true;tourStart();renderer.setAnimationLoop(null);const draw=postRender;postRender=()=>{};
  let t=last,n=0;try{while(n<16000&&tour.ph!=='done'){frame(t+=50);n++}}finally{postRender=draw}
  if(tour.ph!=='done')tourCheck('The run finished',false,`stuck at "${tour.ph}"${tour.ph==='boat'?' on '+TOUR_LEGS[tour.li].n:''}`);
  const b=boats[3];return {ok:tour.checks.every(c=>c.ok),time:`${Math.floor(tour.t/60)} min ${Math.round(tour.t%60)} s`,stucks:tour.stuckN,boat:[Math.round(b.x),Math.round(b.z)],
    checks:tour.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`)}}

$('#tourTestBtn').onclick=()=>{showMenu(false);tourStart()};
// the start card's Tests row: each runs its ☰ Tools test straight away
for(const b of document.querySelectorAll('#startTests [data-test]'))b.onclick=()=>{help.hidden=true;$('#'+b.dataset.test).click()};
{const q=new URLSearchParams(location.search);
  if(q.has('tourtest')){const g=(q.get('tourtest')||'').toLowerCase();q.delete('tourtest');const qs=q.toString();
    history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);setTimeout(()=>{if(GFX[g])setGfx(g);tourStart()},5000)}}
