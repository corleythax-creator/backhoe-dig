// Corley's Island: dig site test, phase 6 of the dig tiles (docs/dig-plans.html). Hands off: ☰ → Dig site test, or open
// the game with ?digtest (or ?digtest=low, medium or high to run it on that Graphics setting; ?speedtest starts the
// older speed test the same way). It digs across tile edges at every dig site, drives the excavator from the mesa over
// the bridges to Dexter's yard, comes back and checks every hole is still there and saves and loads, timing each part.
// Then the page reloads, which puts the player's site back (nothing is saved while it runs: bench.on), and shows the
// results. digTestRun() runs the same script without drawing, for the headless check:
//   NODE_PATH=$(npm root -g) node tools/play.js --eval "return digTestRun()"
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// dig sites: the machine is set down at p and the grid follows it (digTilesTick); then two 20 ft cuts 3 ft deep cross
// the grid's inner tile edges, one across the north-south edge oz m south of the middle, one across the east-west edge
// ox m east of it (the mesa's keep clear of the gas main). edge: the first cut runs up to the grid's east edge instead,
// and the next stage moves the grid over it, so the edge a stored tile and the grid share is tested. The drive runs the
// route at DIGT_V m/s
const DIGT_CUT=3,DIGT_DEEP=0.9,DIGT_V=16,DIGT_DIG=7,DIGT_SHORT=5,DIGT_RES='bhd_benchres';
const DIGT_PLAN=[
  {name:'Mesa top',p:[6,12],ox:16,oz:8},
  {name:"Drive to Dexter's yard",route:[[6,12],[0,30],[0,66],[0,172],[0,226],[-40,245],[-70,245],[-163,245],[-196,236]]},
  {name:"Dexter's yard",p:[-196,236],ox:-8,oz:8},
  {name:'Family Island',p:[24,212],ox:8,oz:8},
  {name:"Jessica's Island",p:[196,236],ox:8,oz:8},
  {name:'Lower Bench',p:[6,50],ox:8,oz:8},
  {name:"Mesa top, to the grid's east edge",p:[10,-6],ox:-16,oz:-16,edge:true},
  {name:'East lawn',p:[60,-6],ox:8,oz:8},
  {name:'Back on the mesa top',back:[10,-6]},
  {name:'Looking over the dug tiles',look:true}];
const digT={stages:[],cuts:[],checks:[],headless:false,cur:-1,lastNow:0,moveN:0};
function digTestLen(s){let L=0;for(let i=1;i<s.route.length;i++)L+=Math.hypot(s.route[i][0]-s.route[i-1][0],s.route[i][1]-s.route[i-1][1]);return L}
// the point a distance d along the route, and its heading
function digTestAlong(r,d){for(let i=1;i<r.length;i++){const ax=r[i-1][0],az=r[i-1][1],l=Math.hypot(r[i][0]-ax,r[i][1]-az);
    if(d<=l||i===r.length-1){const u=Math.min(1,d/l);return [ax+(r[i][0]-ax)*u,az+(r[i][1]-az)*u,Math.atan2(r[i][0]-ax,r[i][1]-az)]}d-=l}}
// the excavator set down at x, z facing yaw; the dig grid follows it at once
function digTestPut(x,z,yaw){st.x=x;st.z=z;if(yaw!==undefined)st.yaw=yaw;st.y=hAt(x,z);st.stuck=0;st.sink=0;wk.inside='ex';digTilesTick(0)}
function digTestCheck(name,ok,note){digT.checks.push({name,ok:!!ok,note})}
// how a cut crosses its tile edge: the depth at every grid point along it within 5 ft of the edge; it passes when all
// are dug at least 1.6 ft and no step between neighbours is over 4 in (no seam)
function digTestSeam(c){if(!inDig(c.x0,c.z0)||!inDig(c.x1,c.z1))return null;const along=c.x0!==c.x1,ds=[];
  if(along){const j=Math.round(gJ(c.z0));for(let i=Math.ceil(gI(c.ex-1.5));i<=Math.floor(gI(c.ex+1.5));i++)ds.push(H0[j*V+i]-H[j*V+i])}
  else{const i=Math.round(gI(c.x0));for(let j=Math.ceil(gJ(c.ez-1.5));j<=Math.floor(gJ(c.ez+1.5));j++)ds.push(H0[j*V+i]-H[j*V+i])}
  let step=0;for(let k=1;k<ds.length;k++)step=Math.max(step,Math.abs(ds[k]-ds[k-1]));
  return {min:Math.min(...ds),step,ok:Math.min(...ds)>0.5&&step<0.1}}
// how far the ground at x, z is dug from the grade, in the grid or in a stored tile
function digTestDepth(x,z){if(inDig(x,z)){const k=Math.round(gJ(z))*V+Math.round(gI(x));return H[k]-H0[k]}const d=tileFarD(x,z);return d===null?0:d}
const ftIn=m=>{const i=Math.round(Math.abs(m)/FT*12);return (m<0?'-':'')+(i>=12?Math.floor(i/12)+' ft '+(i%12?i%12+' in':''):i+' in').trim()};

function digTestEnter(s){
  digT.moveN=digMoveN;s.moves=[];
  if(s.p){digTestPut(s.p[0],s.p[1]);const cx=GX0+TILE,cz=GZ0+TILE;
    s.cuts=[s.edge?{x0:GX1-DIGT_CUT,x1:GX1,z0:cz+s.oz,z1:cz+s.oz,ex:GX1,ez:cz+s.oz,edge:true}:{x0:cx-DIGT_CUT,x1:cx+DIGT_CUT,z0:cz+s.oz,z1:cz+s.oz,ex:cx,ez:cz+s.oz},{x0:cx+s.ox,x1:cx+s.ox,z0:cz-DIGT_CUT,z1:cz+DIGT_CUT,ex:cx+s.ox,ez:cz}];
    for(const c of s.cuts)c.done=0;digT.cuts.push({site:s.name,cuts:s.cuts});
    s.mid=[(cx+cx+s.ox)/2,(cz+s.oz+cz)/2];st.yaw=Math.atan2(s.mid[0]-st.x,s.mid[1]-st.z)}
  else if(s.route){const [x,z,yaw]=digTestAlong(s.route,0);digTestPut(x,z,yaw)}
  else if(s.back){digTestPut(s.back[0],s.back[1]);const m=digT.stages[0].mid;s.mid=m;st.yaw=Math.atan2(m[0]-st.x,m[1]-st.z)}
  if(digMoveN!==digT.moveN){s.moves.push(digMoveMs);digT.moveN=digMoveN}}
// a cut dug from where it got to up to share u (0..1) of its length, a bite every 5 in, the spoil heaped 8 ft to one side
function digTestCut(c,u){const L=c.x1-c.x0+c.z1-c.z0,along=c.x0!==c.x1;
  for(;c.done<=u*L;c.done+=0.12){const x=along?c.x0+c.done:c.x0,z=along?c.z0:c.z0+c.done;
    const v=dig({x,z,y:H0[Math.round(gJ(z))*V+Math.round(gI(x))]-DIGT_DEEP},2);
    if(v>0)deposit(along?x:x+2.4,along?z+2.4:z,v,digC.slice(),digMix.slice())}}
function digTestStage(s,u,dt){
  if(s.cuts){digTestCut(s.cuts[0],Math.min(1,Math.max(0,(u-0.5)/2)));if(u>2.5)digTestCut(s.cuts[1],Math.min(1,(u-2.5)/2))}
  else if(s.route){const [x,z,yaw]=digTestAlong(s.route,Math.min(s.len,u*DIGT_V));st.x=x;st.z=z;st.yaw=yaw;if(digT.headless)digTilesTick(dt)}
  if(digMoveN!==digT.moveN){s.moves.push(digMoveMs);digT.moveN=digMoveN}}
function digTestLeave(s){
  if(s.cuts){s.cuts.forEach((c,n)=>{c.mark=[c.ex,c.ez,digTestDepth(c.ex,c.ez)];
    if(c.edge){digTestCheck(`${s.name}: cut ${n+1} dug right up to the grid's edge`,c.mark[2]<-0.5,`${ftIn(-c.mark[2])} deep at the edge`);return}
    const r=digTestSeam(c);digTestCheck(`${s.name}: cut ${n+1} across the ${n?'east-west':'north-south'} tile edge`,r&&r.ok,r?`dug ${ftIn(r.min)} or more, no step over ${ftIn(Math.max(r.step,FT/12))}`:'not in the grid')})}
  else if(s.route){const R=DIG_REGIONS[2].r,ok=inDig(st.x,st.z,5)&&GX0>=R[0]&&GX1<=R[1]&&GZ0>=R[2]&&GZ1<=R[3];
    digTestCheck('The grid followed the excavator across three islands',ok&&s.moves.length>=2,`${s.moves.length} moves, the longest ${Math.round(Math.max(0,...s.moves))} ms`)}
  else if(s.back){
    for(const site of digT.cuts)for(const [n,c] of site.cuts.entries()){const d=digTestDepth(c.mark[0],c.mark[1]);
      digTestCheck(`${site.site}: cut ${n+1} kept through every grid move${inDig(c.mark[0],c.mark[1])?'':' (stored tile)'}`,c.mark[2]<-0.5&&!c.lost,
        `${ftIn(-c.mark[2])} deep when dug, `+(c.lost?`${ftIn(-c.lost[1])} after "${c.lost[0]}"`:`${ftIn(-d)} now`))}
    for(const [n,c] of digT.cuts[0].cuts.entries()){const r=digTestSeam(c);digTestCheck(`Mesa top: cut ${n+1} still seamless after the grid came back`,r&&r.ok,r?`no step over ${ftIn(Math.max(r.step,FT/12))}`:'not in the grid')}
    // saves: every stored tile and the grid's own tiles written in the save form and read back, within 1/16 in
    let worst=0,n=0;const cmp=(g,e)=>{const b=tileDec(e);if(!b){worst=1e9;return}n++;for(let q=0;q<g.h.length;q++)worst=Math.max(worst,Math.abs(g.h[q]-b.h[q]))};
    for(const g of tileStore.values())cmp(g,tileEnc(g));for(const t of DIG_TILES){const g=tileGrab(t);if(g)cmp(g,tileEnc(g))}
    digTestCheck('Saves and loads every dug tile',n>=6&&worst<0.0015,`${n} tiles, off by ${worst<1e8?(worst/FT*12).toFixed(3)+' in':'a tile that would not load'} at most`)}}

function digTestStart(){
  if(bench.on||edOn)return;
  // whatever the player did last is saved first; nothing is saved from here until the page reloads
  siteSaveAll();
  digT.stages=DIGT_PLAN.map(p=>Object.assign({},p,{ft:[],moves:[],tris:0,k:0}));digT.cuts=[];digT.checks=[];digT.cur=-1;digT.lastNow=0;
  let t=0;for(const s of digT.stages){if(s.route)s.len=digTestLen(s);s.t0=t;t+=s.p?DIGT_DIG:s.route?s.len/DIGT_V+1:DIGT_SHORT;s.t1=t}
  bench.on=true;bench.kind='dig';bench.t=0;bench.pr=0;viewDirty=true;
  help.hidden=true;$('#bench').hidden=true;$('#benchBar').hidden=false;st.load=0}
// one step of the script: the stage it is in, entered and left in turn
// every cut's edge point after each stage: the first stage after which it is no longer as dug is kept
function digTestMarks(s){for(const site of digT.cuts)for(const c of site.cuts)if(c.mark&&!c.lost){const d=digTestDepth(c.mark[0],c.mark[1]);if(Math.abs(d-c.mark[2])>0.05)c.lost=[s.name,d]}}
function digTestStep(dt){bench.t+=dt;const S=digT.stages;
  while(digT.cur<S.length&&(digT.cur<0||bench.t>=S[digT.cur].t1)){if(digT.cur>=0){digTestMarks(S[digT.cur]);digTestLeave(S[digT.cur])}digT.cur++;if(digT.cur<S.length)digTestEnter(S[digT.cur])}
  if(digT.cur>=S.length)return false;const s=S[digT.cur];digTestStage(s,bench.t-s.t0,dt);return true}
function digTestTick(dt){
  if(digT.headless)return;
  if(!digTestStep(dt)){digTestEnd();return}
  const u=bench.t;st.a1=0.75+0.25*Math.sin(u*1.3);st.a2=-1.45+0.3*Math.sin(u*0.9+1);st.a3=-1.6+0.9*Math.sin(u*1.7);st.swing=0.25*Math.sin(u*0.5)}
function digTestCam(){const s=digT.stages[digT.cur];if(!s)return;const u=bench.t-s.t0;
  if(s.route){const fx=Math.sin(st.yaw),fz=Math.cos(st.yaw);camera.position.set(st.x-fx*13,st.y+6,st.z-fz*13);camera.lookAt(look.set(st.x+fx*6,st.y+1,st.z+fz*6))}
  else if(s.look){const a=-0.5+u*0.06;camera.position.set(Math.sin(a)*150,105,Math.cos(a)*-150+60);camera.lookAt(look.set(0,-4,150))}
  // past the cuts, looking back over them at the machine
  else{const m=s.mid,y=hAt(m[0],m[1]),a=st.yaw+0.6+u*0.2;camera.position.set(m[0]+Math.sin(a)*14,y+9,m[1]+Math.cos(a)*14);camera.lookAt(look.set((m[0]*2+st.x)/3,y-0.5,(m[1]*2+st.z)/3))}}
// frame times from the clock (the game's own dt stops at 50 ms, which would hide a grid move's hitch); the first second
// of a dig stage, where the machine is set down and the grid moves, is left out: the move is timed on its own
function digTestSample(){const now=performance.now(),ft=digT.lastNow?(now-digT.lastNow)/1000:0;digT.lastNow=now;
  const s=digT.stages[digT.cur];if(!s||!ft)return;const u=bench.t-s.t0;
  if(u>=(s.route?0.3:1)){s.ft.push(ft);s.tris+=renderer.info.render.triangles;s.k++}
  bench.barT-=ft;if(bench.barT<=0){bench.barT=0.2;const left=Math.max(0,Math.ceil(digT.stages[digT.stages.length-1].t1-bench.t));
    $('#benchBar').innerHTML=`DIG SITE TEST · ${left} s left<small>${digT.cur+1} of ${digT.stages.length} · ${s.name} · ${fmtTris(renderer.info.render.triangles)} tris</small>`}}

// results: frame rate per stage (30 FPS on every one passes, the phone's target) and the checks
function digTestResults(){
  const rows=digT.stages.map(s=>{const ft=s.ft.slice().sort((a,b)=>a-b),tot=ft.reduce((a,b)=>a+b,0);
    return {name:s.name,avg:tot>0?ft.length/tot:0,low:ft.length?1/ft[Math.min(ft.length-1,Math.floor(ft.length*0.99))]:0,worst:ft.length?ft[ft.length-1]*1000:0,
      tris:s.k?s.tris/s.k:0,moves:s.moves.length,moveMs:Math.max(0,...s.moves)}});
  const timed=rows.filter(r=>r.avg>0),slow=timed.reduce((a,r)=>!a||r.avg<a.avg?r:a,null),fpsOk=!!slow&&slow.avg>=30;
  const bad=digT.checks.filter(c=>!c.ok),moveMs=Math.max(0,...rows.map(r=>r.moveMs));
  const w=renderer.domElement.width,h=renderer.domElement.height,gpu=gpuName(),ver=window.EFFORT&&EFFORT.versions?EFFORT.versions[EFFORT.versions.length-1].v:'?';
  const device=`${gpu} · ${w}×${h} px at ${maxPR}x · Graphics ${gfxName()} · ${navigator.platform||''}`;
  const cls=f=>f>=55?'fps-good':f>=30?'fps-mid':'fps-bad';
  let sum=`<div class="lbl">Frame rate</div><div class="big ${fpsOk?'fps-good':'fps-bad'}">${slow?(fpsOk?'Pass':'Below 30 FPS'):'Not measured'}</div>`;
  if(slow)sum+=`<p>Slowest part: <b>${slow.name}</b>, ${slow.avg.toFixed(1)} FPS on average.</p>`;
  sum+=`<div class="lbl" style="margin-top:8px">Digging checks</div><div class="big ${bad.length?'fps-bad':'fps-good'}">${bad.length?bad.length+' of '+digT.checks.length+' failed':'All '+digT.checks.length+' passed'}</div>`;
  if(moveMs)sum+=`<p>Moving the dig grid to a new spot took up to ${Math.round(moveMs)} ms (one stutter each time).</p>`;
  let diag='<tr><th>Check</th><th>Result</th></tr>';
  for(const c of digT.checks)diag+=`<tr><td>${c.name}<br><small style="color:var(--muted)">${c.note}</small></td><td class="${c.ok?'fps-good':'fps-bad'}">${c.ok?'Pass':'Fail'}</td></tr>`;
  let table='<tr><th>Part</th><th>Avg FPS</th><th>1% low</th><th>Worst</th><th>Grid moves</th></tr>';
  for(const r of rows)table+=`<tr><td>${r.name}</td><td class="${r.avg?cls(r.avg):''}">${r.avg?r.avg.toFixed(1):'–'}</td><td class="${r.low?cls(r.low):''}">${r.low?r.low.toFixed(0):'–'}</td><td>${r.worst?Math.round(r.worst)+' ms':'–'}</td><td>${r.moves?r.moves+' · '+Math.round(r.moveMs)+' ms':''}</td></tr>`;
  const text=[`Corley's Island dig site test (dig tiles phase 6), game version ${ver}`,`GPU: ${gpu}`,`Graphics: ${gfxName()}${PHONE?' (phone)':''}`,`Resolution: ${w}x${h} (${maxPR}x)`,
    `Frame rate: ${slow?(fpsOk?'PASS':'FAIL')+`, slowest ${slow.name} at ${slow.avg.toFixed(1)} FPS`:'not measured'}`,`Checks: ${bad.length?bad.length+' of '+digT.checks.length+' FAILED':'all '+digT.checks.length+' passed'}`,
    ...digT.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),'Parts:',
    ...rows.map(r=>`${r.name} | ${r.avg?r.avg.toFixed(1)+' avg FPS | '+r.low.toFixed(0)+' 1% low | '+Math.round(r.worst)+' ms worst | '+fmtTris(r.tris)+' tris':'not timed'}${r.moves?' | '+r.moves+' grid moves, longest '+Math.round(r.moveMs)+' ms':''}`)].join('\n');
  return {title:'Dig site test results',sum,diag,table,device,text,fpsOk,checksOk:!bad.length,checks:digT.checks,rows}}
// done: the results are kept for the reload, which puts the player's site back as it was saved before the test
function digTestEnd(){const r=digTestResults();try{sessionStorage.setItem(DIGT_RES,JSON.stringify(r))}catch(e){}
  $('#benchBar').innerHTML='DIG SITE TEST DONE<small>Putting your site back…</small>';location.reload()}
function digTestShow(r){$('#benchTitle').textContent=r.title;$('#benchSummary').innerHTML=r.sum;$('#benchDiag').innerHTML=r.diag;$('#benchTable').innerHTML=r.table;
  $('#benchDevice').textContent=r.device;$('#benchText').value=r.text;$('#benchCopy').textContent='Copy results';$('#bench').hidden=false}
// headless: the whole script at 10 steps a second without drawing; the page is left in the test's state (bench.on stays
// set so nothing saves), so use a throwaway page (tools/play.js)
function digTestRun(){digTestStart();digT.headless=true;let n=0;while(digTestStep(0.1)&&n<20000)n++;
  const r=digTestResults();return {ok:r.checksOk,checks:r.checks.map(c=>`${c.ok?'pass':'FAIL'} | ${c.name} | ${c.note}`),moves:r.rows.map(x=>x.name+': '+x.moves)}}

$('#digTestBtn').onclick=()=>{showMenu(false);digTestStart()};
// results from a test that just finished, and ?digtest / ?speedtest starting one hands off once the game is up
try{const r=sessionStorage.getItem(DIGT_RES);if(r){sessionStorage.removeItem(DIGT_RES);digTestShow(JSON.parse(r))}}catch(e){}
{const q=new URLSearchParams(location.search),k=q.has('digtest')?'digtest':q.has('speedtest')?'speedtest':null;
  if(k){const g=(q.get(k)||'').toLowerCase();q.delete(k);const qs=q.toString();history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);
    setTimeout(()=>{if(GFX[g])setGfx(g);if(k==='digtest')digTestStart();else startBench()},5000)}}
