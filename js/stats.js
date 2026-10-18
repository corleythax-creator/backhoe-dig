// Corley's Island: the player's stats (☰ then Stats, or O): grass mowed, distance walked and driven, dirt dug and
// hauled, time in each machine and top speeds, kept for good on this device and synced with the site. Also the lawn
// heatmap (U, or from the Stats panel): times each patch of grass has been cut, how far it has grown back, and the way
// it was last mowed, drawn as flat tiles over the patch (the grass is hidden while it is on) and in the panel. And trails:
// where you have walked and driven, in 4 m squares, shown over the big map (maps.js) for all of it or one way of getting round.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- what is counted ----------
// distances in metres, volumes in cubic metres (bank), times in seconds, speeds in m/s; shown in feet, miles, yd³ and mph
const STAT_KEY='bhd_stats',HEAT_KEY='bhd_heat';
const STAT_ZERO={mowCuts:0,mowTall:0,mowLawns:0,mowBest:0,mowDist:0,mowTime:0,mowTop:0,walkDist:0,sprintDist:0,jumps:0,walkTime:0,walkTop:0,
  exDug:0,exDumps:0,exDist:0,exTime:0,strikes:0,caves:0,trDist:0,trTime:0,trTop:0,trHauled:0,skDist:0,skTime:0,skTop:0,skMoved:0,blocks:0,since:0};
const stats=Object.assign({},STAT_ZERO);
// how many times each lawn cell has been cut
const statCuts=new Uint16Array(LAWN_N);
let statDirty=false,statSaveT=0;
function statSave(){if(window.syncHold)return;statDirty=false;statSaveT=performance.now();
  const b=new Uint8Array(statCuts.buffer);let bin='';for(let k=0;k<b.length;k+=4096)bin+=String.fromCharCode.apply(null,b.subarray(k,k+4096));
  const s={};for(const k in STAT_ZERO)s[k]=+(+stats[k]).toFixed(3);
  try{localStorage.setItem(STAT_KEY,JSON.stringify({v:1,n:LAWN_N,s,cuts:btoa(bin),trail:trailPack()}))}catch(e){}}
function statLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(STAT_KEY))}catch(e){}
  if(d&&d.v===1&&d.s){for(const k in STAT_ZERO)if(isFinite(d.s[k]))stats[k]=+d.s[k];
    if(d.n===LAWN_N&&typeof d.cuts==='string')try{const b=atob(d.cuts);if(b.length===LAWN_N*2){const u=new Uint8Array(statCuts.buffer);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i)}}catch(e){}}
  if(d&&d.trail)try{trailUnpack(d.trail)}catch(e){}
  if(!stats.since)stats.since=Date.now()}
// ---------- trails ----------
// metres travelled in each 4 m square of the big map, one layer for each way of getting round. Saved sparse: three bytes
// a square that has been crossed (its index, then the distance on a log scale), so a save stays small enough to sync
// the grid covers the big map's square (MAP_X0, MAP_Z0, MAP_SZ in maps.js, which loads later): 135 x 135 squares
const TRAIL_C=4,TRAIL_X0=-260,TRAIL_Z0=-62,TRAIL_N=540/TRAIL_C,TRAIL_KINDS=['walk','ex','truck','mow','skid'],trail={};for(const k of TRAIL_KINDS)trail[k]=new Float32Array(TRAIL_N*TRAIL_N);
let trailDirty=true;
function trailAdd(k,x,z,d){const i=Math.floor((x-TRAIL_X0)/TRAIL_C),j=Math.floor((z-TRAIL_Z0)/TRAIL_C);
  if(i<0||j<0||i>=TRAIL_N||j>=TRAIL_N)return;trail[k][j*TRAIL_N+i]+=d;trailDirty=true}
function trailPack(){const o={};for(const k of TRAIL_KINDS){const a=trail[k],b=[];
    for(let n=0;n<a.length;n++)if(a[n]>0.05){const q=Math.max(1,Math.min(255,Math.round(Math.log2(1+a[n]*10)*12)));b.push(n&255,n>>8,q)}
    let bin='';for(let i=0;i<b.length;i+=4096)bin+=String.fromCharCode.apply(null,b.slice(i,i+4096));o[k]=btoa(bin)}
  return o}
function trailUnpack(o){for(const k of TRAIL_KINDS){if(typeof o[k]!=='string')continue;const b=atob(o[k]),a=trail[k];
  for(let i=0;i+2<b.length;i+=3){const n=b.charCodeAt(i)|b.charCodeAt(i+1)<<8;if(n<a.length)a[n]=(Math.pow(2,b.charCodeAt(i+2)/12)-1)/10}}}
statLoad();
addEventListener('pagehide',()=>{if(statDirty)statSave()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&statDirty)statSave()});
// mowCut (mower.js) calls this for each cell it cuts that had grown back at all; g is how grown it was
function statCut(n,g){if(statCuts[n]<65535)statCuts[n]++;stats.mowCuts++;if(g>=0.95)stats.mowTall++;statDirty=true;heatDirty=true}
function statLawnDone(s){stats.mowLawns++;if(s>0&&(!stats.mowBest||s<stats.mowBest))stats.mowBest=s;statDirty=true}
function statDug(v){stats.exDug+=v;statDirty=true}
// every frame: distance, time and top speed for whatever is in hand. Only time spent moving counts, so a device left
// open doesn't keep changing its save (and syncing). A long gap (the map editor, a hidden tab) or a jump of more than
// a few metres in a frame (a teleport, Reset, a sync reload) starts the count afresh
const statPrev={m:'',x:0,z:0,yaw:0,arm:0,t:0,hauled:0,dumped:0,strikes:0,caves:0,blocks:0,pour:false,ground:true};
function statTick(dt){if(bench.on)return;const now=performance.now(),P=statPrev;
  const o=mode==='mow'?mw:mode==='truck'?tr:mode==='skid'?sk:mode==='walk'?wk:st;
  const arm=mode==='dig'?st.swing+st.a1+st.a2+st.a3:mode==='truck'?tr.bed:mode==='skid'?sk.a+sk.c:0;
  const fresh=P.m!==mode||now-P.t>250;
  if(!fresh){const d=Math.hypot(o.x-P.x,o.z-P.z),moved=d>1e-4||Math.abs(o.yaw-P.yaw)>1e-4||Math.abs(arm-P.arm)>1e-5;
    if(d<3&&moved){const v=d/Math.max(dt,1e-3);statDirty=true;
      if(mode==='mow'){stats.mowDist+=d;stats.mowTime+=dt;stats.mowTop=Math.max(stats.mowTop,Math.abs(mw.v))}
      else if(mode==='truck'){stats.trDist+=d;stats.trTime+=dt;stats.trTop=Math.max(stats.trTop,Math.abs(tr.v))}
      else if(mode==='skid'){stats.skDist+=d;stats.skTime+=dt;stats.skTop=Math.max(stats.skTop,Math.abs(sk.v))}
      else if(mode==='walk'){stats.walkDist+=d;stats.walkTime+=dt;if(wk.ground)stats.walkTop=Math.max(stats.walkTop,Math.min(v,wk.spd+0.2));
        if(wk.spd>TU.wkRun+0.3)stats.sprintDist+=d}
      else{stats.exDist+=d;stats.exTime+=dt}
      trailAdd(mode==='drive'||mode==='dig'?'ex':mode,o.x,o.z,d)}
    if(mode==='walk'&&P.ground&&!wk.ground&&wk.vy>0){stats.jumps++;statDirty=true}}
  // counters the machines keep themselves: only the rises count (Reset and loading a save put them back)
  const up=(k,v,sk2)=>{const dv=v-P[k];if(!fresh&&dv>0&&dv<50){stats[sk2]+=dv;statDirty=true}P[k]=v};
  up('hauled',tr.hauled,'trHauled');up('dumped',sk.dumped,'skMoved');up('strikes',st.strikes,'strikes');up('caves',st.caves,'caves');up('blocks',blocks.length,'blocks');
  if(!fresh&&st.pouring&&!P.pour){stats.exDumps++;statDirty=true}
  P.pour=st.pouring;P.ground=wk.ground;P.m=mode;P.x=o.x;P.z=o.z;P.yaw=o.yaw;P.arm=arm;P.t=now;
  if(statDirty&&now-statSaveT>5000)statSave();
  heatTick(dt)}

// ---------- the lawn heatmap ----------
// modes: cut (times cut), grow (how far it has grown back), dir (the heading it was last mowed in)
const HEAT_MODES=[['cut','Times cut'],['grow','Grass height'],['dir','Mow direction']];
const heat={on:false,mode:'cut',t:0,posT:0};
try{const h=JSON.parse(localStorage.getItem(HEAT_KEY)||'null');if(h&&HEAT_MODES.some(m=>m[0]===h.mode))heat.mode=h.mode}catch(e){}
let heatDirty=true,heatMax=1;
// colour ramps: an inferno-like run for counts, straw to deep green for height, a colour wheel for direction
const HEAT_RAMP=[[0.16,0.07,0.33],[0.55,0.16,0.51],[0.87,0.29,0.41],[0.99,0.62,0.43],[0.99,0.99,0.75]];
const HEAT_GROW=[[0.93,0.84,0.5],[0.62,0.74,0.33],[0.18,0.49,0.2]];
const HEAT_NONE=[0.3,0.33,0.29],HEAT_DUG=[0.42,0.29,0.18];
function heatLerp(R,t,out){t=clamp(t,0,1)*(R.length-1);const i=Math.min(R.length-2,Math.floor(t)),f=t-i;for(let q=0;q<3;q++)out[q]=R[i][q]+(R[i+1][q]-R[i][q])*f;return out}
function heatHue(a,out){for(let q=0;q<3;q++)out[q]=0.55+0.42*Math.cos(a-q*2.094);return out}
const heatC=[0,0,0];
// one cell's colour in the current mode
function heatCol(n){
  if(lawn.dug[n])return HEAT_DUG;
  if(heat.mode==='cut'){const c=statCuts[n];return c?heatLerp(HEAT_RAMP,0.12+0.88*c/heatMax,heatC):HEAT_NONE}
  if(heat.mode==='grow')return heatLerp(HEAT_GROW,lawnG(n),heatC);
  if(lawn.ct[n]<-1e8&&!statCuts[n])return HEAT_NONE;
  heatHue(lawn.ga[n],heatC);const f=0.55+0.45*(1-ss(0,1,lawnG(n)));for(let q=0;q<3;q++)heatC[q]*=f;return heatC}
function heatScan(){let m=1;for(let n=0;n<LAWN_N;n++)if(statCuts[n]>m)m=statCuts[n];heatMax=m}
// flat tiles, one quad a cell, 1.5 in above the ground
const heatMesh=(function(){const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(LAWN_N*18),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(LAWN_N*18),3));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}));
  m.visible=false;m.frustumCulled=false;scene.add(m);return m})();
const HEAT_Q=[[0,0],[0,1],[1,0],[1,0],[0,1],[1,1]];
function heatPos(){const p=heatMesh.geometry.attributes.position.array,hs=new Float32Array(LAWN_VN);
  for(let j=0;j<=LAWN_NZ;j++)for(let i=0;i<=LAWN_NX;i++)hs[j*LAWN_VX+i]=hAt(LAWN_X0+i*LAWN_GS,LAWN_Z0+j*LAWN_GS)+0.04;
  for(let j=0;j<LAWN_NZ;j++)for(let i=0;i<LAWN_NX;i++){const n=j*LAWN_NX+i;
    for(let v=0;v<6;v++){const ii=i+HEAT_Q[v][0],jj=j+HEAT_Q[v][1],k=(n*6+v)*3;p[k]=LAWN_X0+ii*LAWN_GS;p[k+1]=hs[jj*LAWN_VX+ii];p[k+2]=LAWN_Z0+jj*LAWN_GS}}
  heatMesh.geometry.attributes.position.needsUpdate=true}
function heatColors(){const c=heatMesh.geometry.attributes.color.array;
  for(let n=0;n<LAWN_N;n++){const col=heatCol(n);for(let v=0;v<6;v++){const k=(n*6+v)*3;c[k]=col[0];c[k+1]=col[1];c[k+2]=col[2]}}
  heatMesh.geometry.attributes.color.needsUpdate=true}
// the grass grows back all the time, so the colours refresh a few times a second while the heatmap or the panel is up
function heatTick(dt){const panel=!statBox.hidden;if(!heat.on&&!panel)return;
  heat.t-=dt;if(heat.t>0)return;heat.t=0.25;
  if(heatDirty)heatScan();heatDirty=false;
  if(heat.on){heat.posT-=0.25;if(heat.posT<=0){heat.posT=2;heatPos()}heatColors()}
  heatKeySync();if(panel)heatDraw()}
function heatSave(){try{const h=JSON.parse(localStorage.getItem(HEAT_KEY)||'{}')||{};h.mode=heat.mode;localStorage.setItem(HEAT_KEY,JSON.stringify(h))}catch(e){}}
function setHeat(on,mode){if(mode&&mode!==heat.mode){heat.mode=mode;heatSave()}heat.on=!!on;
  heatMesh.visible=heat.on;lawnClumps.visible=lawnFar.visible=!heat.on;
  if(heat.on){heat.posT=0}heat.t=0;heatDirty=true;heatTick(0);heatKeySync();statPanelBtns()}
// the key strip on screen while the heatmap is on: what it shows and its colours; tap it to change what it shows
function heatGrad(){if(heat.mode==='cut')return `linear-gradient(90deg,${HEAT_RAMP.map(c=>heatCss(c)).join(',')})`;
  if(heat.mode==='grow')return `linear-gradient(90deg,${HEAT_GROW.map(c=>heatCss(c)).join(',')})`;
  const s=[];for(let a=0;a<=8;a++)s.push(heatCss(heatHue(a/8*Math.PI*2,[0,0,0])));return `linear-gradient(90deg,${s.join(',')})`}
const heatCss=c=>`rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`;
function heatEnds(){return heat.mode==='cut'?['Never',`${heatMax}×`]:heat.mode==='grow'?['Just cut','Full height']:['Mowed heading S · E · N · W','S']}
function heatKeySync(){const k=$('#heatKey');if(k.hidden===heat.on)k.hidden=!heat.on;if(!heat.on)return;
  const nm=HEAT_MODES.find(m=>m[0]===heat.mode)[1],e=heatEnds(),g=heatGrad(),key=nm+e.join()+g;if(k.dataset.k===key)return;k.dataset.k=key;
  $('#heatName').textContent=nm;$('#heatLo').textContent=e[0];$('#heatHi').textContent=e[1];$('#heatBar').style.background=g}
function heatNext(){const i=HEAT_MODES.findIndex(m=>m[0]===heat.mode);setHeat(heat.on,HEAT_MODES[(i+1)%HEAT_MODES.length][0])}
$('#heatKey').onclick=heatNext;
// the same map in the panel, north up, with the mower on it
function heatDraw(){const cv=$('#heatCv'),W=LAWN_NX*4,Hh=LAWN_NZ*4;if(cv.width!==W){cv.width=W;cv.height=Hh}const g=cv.getContext('2d');
  for(let j=0;j<LAWN_NZ;j++)for(let i=0;i<LAWN_NX;i++){g.fillStyle=heatCss(heatCol(j*LAWN_NX+i));g.fillRect(i*4,j*4,4,4)}
  const mx=(mw.x-LAWN_X0)/LAWN_GS*4,mz=(mw.z-LAWN_Z0)/LAWN_GS*4;
  if(mx>-8&&mx<W+8&&mz>-8&&mz<Hh+8){g.save();g.translate(mx,mz);g.rotate(-mw.yaw);g.fillStyle='#c8291f';g.strokeStyle='#fff';g.lineWidth=2;
    g.beginPath();g.moveTo(0,9);g.lineTo(-6,-6);g.lineTo(6,-6);g.closePath();g.fill();g.stroke();g.restore()}
  const e=heatEnds();$('#heatLo2').textContent=e[0];$('#heatHi2').textContent=e[1];$('#heatBar2').style.background=heatGrad()}

// ---------- the Stats panel ----------
const statBox=$('#statBox');
const sFt=m=>Math.round(m/FT).toLocaleString()+' ft',sMi=m=>m/FT>=5280?(m/1609.34).toFixed(2)+' mi':sFt(m);
const sYd=v=>(v*1.308).toFixed(1)+' yd³',sMph=v=>(v*2.237).toFixed(1)+' mph',sN=n=>Math.round(n).toLocaleString();
function sTime(s){s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s/60)%60;return h?`${h} h ${m} min`:m?`${m} min ${s%60} s`:`${s} s`}
function statRows(){const S=stats,cellFt=LAWN_GS*LAWN_GS/(FT*FT),all=S.mowTime+S.walkTime+S.exTime+S.trTime+S.skTime;
  let cut=0,most=0;for(let n=0;n<LAWN_N;n++){if(statCuts[n])cut++;if(statCuts[n]>most)most=statCuts[n]}
  return [['Mowing',[['Grass mowed',sN(S.mowCuts*cellFt)+' sq ft'],['Tall grass cut',sN(S.mowTall*cellFt)+' sq ft'],['Lawns finished',sN(S.mowLawns)],
      ['Best lawn time',S.mowBest?sTime(S.mowBest):'—'],['Patch ever mowed',Math.round(cut/LAWN_N*100)+'%'],['Most cuts on one spot',sN(most)],
      ['Mower driven',sMi(S.mowDist)],['Time mowing',sTime(S.mowTime)],['Mower top speed',sMph(S.mowTop)]]],
    ['On foot',[['Walked',sMi(S.walkDist)],['Sprinted',sMi(S.sprintDist)],['Jumps',sN(S.jumps)],['Time on foot',sTime(S.walkTime)],['Top speed',sMph(S.walkTop)]]],
    ['Excavator',[['Dirt dug',sYd(S.exDug)],['Buckets dumped',sN(S.exDumps)],['Tracked',sMi(S.exDist)],['Time running it',sTime(S.exTime)],['Gas line strikes',sN(S.strikes)],['Cave-ins',sN(S.caves)]]],
    ['Dump truck',[['Hauled off',sYd(S.trHauled)],['Driven',sMi(S.trDist)],['Time driving',sTime(S.trTime)],['Top speed',sMph(S.trTop)]]],
    ['Skid steer',[['Dirt moved',sYd(S.skMoved)],['Driven',sMi(S.skDist)],['Time driving',sTime(S.skTime)],['Top speed',sMph(S.skTop)]]],
    ['All together',[['Time playing',sTime(all)],['Distance, all ways',sMi(S.mowDist+S.walkDist+S.exDist+S.trDist+S.skDist)],['Blocks placed',sN(S.blocks)],
      ['Counting since',new Date(S.since).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})]]]]}
function statFill(){const L=$('#statList');let h='';
  for(const [g,rows] of statRows())h+=`<h2>${g}</h2><dl class="stl">${rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
  L.innerHTML=h}
function statPanelBtns(){document.querySelectorAll('#statHeat [data-h]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.h===heat.mode));
  const b=$('#heatOn');b.setAttribute('aria-pressed',heat.on);b.textContent=heat.on?'Heatmap on the lawn: on':'Heatmap on the lawn: off'}
let statFillT=0;
function showStats(on){statBox.hidden=!on;clearInterval(statFillT);
  if(on){statFill();statPanelBtns();heatDirty=true;heat.t=0;heatTick(0);statFillT=setInterval(statFill,1000)}}
$('#statsBtn').onclick=()=>{showStats(true);showMenu(false)};
$('#statDone').onclick=()=>showStats(false);
$('#heatOn').onclick=()=>setHeat(!heat.on);
document.querySelectorAll('#statHeat [data-h]').forEach(b=>b.onclick=()=>setHeat(heat.on,b.dataset.h));
$('#statClear').onclick=()=>{if(!confirm('Clear all your stats, the lawn heatmap and your trails? This can\'t be undone.'))return;
  Object.assign(stats,STAT_ZERO,{since:Date.now()});statCuts.fill(0);for(const k of TRAIL_KINDS)trail[k].fill(0);trailDirty=true;statSave();heatDirty=true;statFill();heat.t=0;heatTick(0)};
statBox.addEventListener('pointerdown',e=>{if(e.target===statBox)showStats(false)});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!statBox.hidden)showStats(false)});

// ---------- trails on the big map ----------
// which layer shows (off, all, or one way of getting round), kept on this device with the heatmap's choice
const TRAIL_OPTS=[['off','Off'],['all','All'],['walk','On foot'],['ex','Excavator'],['truck','Truck'],['mow','Mower'],['skid','Skid steer']];
let trailShow='off',trailCv=null,trailMax=0,trailDrawn='';
try{const h=JSON.parse(localStorage.getItem(HEAT_KEY)||'null');if(h&&TRAIL_OPTS.some(o=>o[0]===h.trail))trailShow=h.trail}catch(e){}
// one pixel a square: clear where never crossed, then the heatmap's colours, fainter where you've only passed through once
function trailImage(){if(!trailCv){trailCv=document.createElement('canvas');trailCv.width=trailCv.height=TRAIL_N}
  const g=trailCv.getContext('2d'),img=g.createImageData(TRAIL_N,TRAIL_N),D=img.data,L=trailShow==='all'?TRAIL_KINDS:[trailShow];let m=0;
  const v=new Float32Array(TRAIL_N*TRAIL_N);for(const k of L){const a=trail[k];for(let n=0;n<v.length;n++)v[n]+=a[n]}
  for(let n=0;n<v.length;n++)if(v[n]>m)m=v[n];trailMax=m;const lm=Math.log(1+m),c=[0,0,0];
  if(m>0)for(let n=0;n<v.length;n++){if(v[n]<=0.05)continue;const t=Math.log(1+v[n])/lm;heatLerp(HEAT_RAMP,0.15+0.85*t,c);
    D[n*4]=c[0]*255;D[n*4+1]=c[1]*255;D[n*4+2]=c[2]*255;D[n*4+3]=150+105*t}
  g.putImageData(img,0,0);trailDirty=false;trailDrawn=trailShow}
// drawMap (maps.js) calls this on the big map, over the ground and under the machines
function trailDrawOn(g,X,Y,sc){if(trailShow==='off')return;if(trailDirty||trailDrawn!==trailShow)trailImage();
  g.save();g.imageSmoothingEnabled=false;g.drawImage(trailCv,X(TRAIL_X0),Y(TRAIL_Z0),TRAIL_N*TRAIL_C*sc,TRAIL_N*TRAIL_C*sc);g.restore()}
function trailSet(k){trailShow=k;try{const h=JSON.parse(localStorage.getItem(HEAT_KEY)||'{}')||{};h.trail=k;localStorage.setItem(HEAT_KEY,JSON.stringify(h))}catch(e){}trailSync()}
function trailSync(){document.querySelectorAll('#trailBar [data-tr]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tr===trailShow));
  const on=trailShow!=='off';$('#trailKey').hidden=!on;
  if(on){if(trailDirty||trailDrawn!==trailShow)trailImage();$('#trailHi').textContent=trailMax>0?`More (busiest spot: ${sMi(trailMax)})`:'Nowhere yet'}
  if(!$('#bigmap').hidden)drawMap($('#big'),MAP_CX,MAP_CZ,MAP_HALF,true)}
{const bar=$('#trailBar');for(const [k,n] of TRAIL_OPTS){const b=document.createElement('button');b.dataset.tr=k;b.textContent=n;b.onclick=()=>trailSet(k);bar.appendChild(b)}}
$('#trailKey i').style.background=`linear-gradient(90deg,${HEAT_RAMP.map(c=>heatCss(c)).join(',')})`;
$('#statTrail').onclick=()=>{showStats(false);if(trailShow==='off')trailShow='all';toggleMap(true);trailSet(trailShow)};
