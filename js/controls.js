// Backhoe Dig: game state, reset, touch sticks, keyboard, game controller, mode switch and menu.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- state ----------
const CAP=1.0;
const START={x:0.42,z:0,yaw:Math.PI,swing:0,a1:0.5,a2:-1.8,a3:-1.2};
const st={};
function resetState(){
  Object.assign(st,START,{y:0,pitch:0,roll:0,load:0,strikes:0,exposed:false,done:false,startT:0,doneT:0,below:false,strikeCd:0,slumpT:0,dirty:true,res:1,soil:-1,seenSand:false,seenRock:false,rumT:0,loadC:[...SOIL[SPOIL].c],loadMix:[...CRUMB_MIX],stuck:0,grime:0,mud:0,loadWet:0,pouring:false,caves:0,caveRisk:0,caveScanT:0,cave:null});
  cI0=N+1;cI1=-1;cJ0=N+1;cJ1=-1;
  H.set(H0);dI0=0;dI1=N;dJ0=0;dJ1=N;winOn=true;Object.assign(tr,TR_START);tr.loadC=[...SOIL[SPOIL].c];tr.loadMix=[...CRUMB_MIX];tr.stuck=0;tr.mud=0;tr.loadWet=0;tr.pourRate=0;tr.pourP=new THREE.Vector3();
  for(let k=0;k<V*V;k++)spoilC.set(SOIL[SPOIL].c,k*3);
  clearClods();wetT.fill(-1e4);comp.fill(0);clearDust();waterClear();
  blkReset();Object.assign(TB,TB_START,{hooked:false,seated:false});TB.y=TB.ty=boxRest();prot.fill(0);chain.visible=false;
}
resetState();
const LIM={a1:[-0.65,1.15],a2:[-2.65,-0.45],a3:[-2.85,0.35]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------- input ----------
let mode='dig',camMode='chase';
function makeStick(el){
  const s={x:0,y:0,id:null},knob=el.querySelector('.knob');
  const move=e=>{const r=el.getBoundingClientRect(),R=r.width/2;
    let dx=e.clientX-(r.left+R),dy=e.clientY-(r.top+R);const d=Math.hypot(dx,dy),max=R-20;
    if(d>max){dx*=max/d;dy*=max/d}
    knob.style.transform=`translate(${dx}px,${dy}px)`;
    const dz=v=>Math.abs(v)<0.12?0:(v-Math.sign(v)*0.12)/0.88;
    s.x=dz(dx/max);s.y=dz(-dy/max);};
  el.addEventListener('pointerdown',e=>{e.preventDefault();s.id=e.pointerId;el.setPointerCapture(e.pointerId);move(e);started()});
  el.addEventListener('pointermove',e=>{if(e.pointerId===s.id)move(e)});
  const end=e=>{if(e.pointerId!==s.id)return;s.id=null;s.x=s.y=0;knob.style.transform=''};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  return s;
}
const SL=makeStick($('#stickL')),SR=makeStick($('#stickR'));
const keys={};
// keyboard: WASD/arrows = left stick, IJKL = right stick in every mode; the sticks' captions show the keys once one is pressed
const MODES=['dig','drive','truck'];let kbUsed=false;
addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;
  const c=e.code;keys[c]=true;
  if(c.startsWith('Arrow')||c==='Tab'||c==='Space')e.preventDefault();
  if(!e.repeat){
    if(c==='Digit1')setMode('dig');else if(c==='Digit2')setMode('drive');else if(c==='Digit3')setMode('truck');
    else if(c==='Tab')setMode(MODES[(MODES.indexOf(mode)+(e.shiftKey?2:1))%3]);
    else if(c==='KeyC')$('#camBtn').click();
    else if(c==='KeyT')hookBox();
    else if(c==='KeyP')setPump(!pumpOn);
    else if(c==='KeyB')setBlocks(!blkOn);
    else if(c==='Space'&&blkOn)placeBlock();
    else if(c==='KeyV')setBlkSize(blkSize%3+1);
    else if(c==='KeyX'&&blkOn)removeBlock();
    else if(c==='KeyN')setSound(!sndOn);
    else if(c==='KeyH')help.hidden=!help.hidden;
    else if(c==='Escape')help.hidden=true;}
  if(!kbUsed){kbUsed=true;padUsed=false;document.body.classList.add('kb');setCaps()}
  started()});
addEventListener('keyup',e=>{keys[e.code]=false});
const clearKeys=()=>{for(const k in keys)keys[k]=false};
addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',clearKeys);
const kv=(a,b)=>(keys[a]?1:0)-(keys[b]?1:0);
// keys ease in over ~0.2 s and out over ~0.1 s so a tap nudges and a hold runs smooth; Shift is a fine-control gear
const KA={lx:0,ly:0,rx:0,ry:0};
function keyAxes(dt){const f=keys.ShiftLeft||keys.ShiftRight?0.3:1;
  const t={lx:kv('KeyD','KeyA')+kv('ArrowRight','ArrowLeft'),ly:kv('KeyW','KeyS')+kv('ArrowUp','ArrowDown'),rx:kv('KeyL','KeyJ'),ry:kv('KeyI','KeyK')};
  for(const k in t){const g=clamp(t[k],-1,1)*f,r=(g===0?10:5)*dt;KA[k]+=clamp(g-KA[k],-r,r)}}
// game controller (standard mapping): sticks = the two on-screen sticks, triggers = gas / reverse when driving,
// LB/RB switch machine, Y cab view, View map, Menu help, B closes, A sets a block, D-pad runs blocks; a line strike rumbles
const PA={lx:0,ly:0,rx:0,ry:0,thr:0},padPrev=[];let padIdx=-1,padUsed=false;
addEventListener('gamepadconnected',e=>{padIdx=e.gamepad.index;toast('Controller ready. LB / RB switch machine, Y cab view.','good',3500)});
addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index===padIdx)padIdx=-1;for(const k in PA)PA[k]=0;padPrev.length=0});
function getPad(){if(!navigator.getGamepads)return null;const all=navigator.getGamepads();
  if(padIdx<0||!all[padIdx])padIdx=[...all].findIndex(g=>g&&g.connected);return padIdx<0?null:all[padIdx]}
function usePad(){if(!padUsed){padUsed=true;kbUsed=false;document.body.classList.remove('kb');setCaps()}started()}
function padButton(i){usePad();
  if(i===4||i===5)setMode(MODES[(MODES.indexOf(mode)+(i===5?1:2))%3]);
  else if(i===3)$('#camBtn').click();
  else if(i===2)hookBox();
  else if(i===0)placeBlock();
  else if(i===12)setBlocks(!blkOn);
  else if(i===13)removeBlock();
  else if(i===14||i===15)setBlkSize((blkSize+(i===15?0:1))%3+1);
  else if(i===8)toggleMap();
  else if(i===9)help.hidden=!help.hidden;
  else if(i===1){help.hidden=true;toggleMap(false)}}
function pollPad(){for(const k in PA)PA[k]=0;const gp=getPad();if(!gp)return;
  const dz=v=>Math.abs(v)<0.15?0:(v-Math.sign(v)*0.15)/0.85,ax=gp.axes,b=gp.buttons,bv=i=>b[i]?b[i].value:0;
  PA.lx=dz(ax[0]||0);PA.ly=-dz(ax[1]||0);PA.rx=dz(ax[2]||0);PA.ry=-dz(ax[3]||0);PA.thr=bv(7)-bv(6);
  for(let i=0;i<b.length;i++){const on=b[i].pressed;if(on&&!padPrev[i])padButton(i);padPrev[i]=on}
  if(PA.lx||PA.ly||PA.rx||PA.ry||Math.abs(PA.thr)>0.05)usePad()}
function rumble(ms,mag){const gp=getPad(),va=gp&&gp.vibrationActuator;
  if(va&&va.playEffect)va.playEffect('dual-rumble',{duration:ms,strongMagnitude:mag,weakMagnitude:mag*0.6}).catch(()=>{})}
// orbit drag on the scene
let orbitYaw=0,orbitPitch=0.42,camDist=9.5,drag=null;
canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
  orbitYaw-=(e.clientX-drag.x)*0.006;orbitPitch=clamp(orbitPitch+(e.clientY-drag.y)*0.005,0.08,1.3);drag.x=e.clientX;drag.y=e.clientY});
const dend=e=>{if(drag&&e.pointerId===drag.id)drag=null};
canvas.addEventListener('pointerup',dend);canvas.addEventListener('pointercancel',dend);
canvas.addEventListener('wheel',e=>{e.preventDefault();camDist=clamp(camDist+e.deltaY*0.01,5,22)},{passive:false});

function setCaps(){const m=mode,lh=kbUsed?'A D':'◀ ▶',lv=kbUsed?'W S':'▲ ▼',rh=kbUsed?'J L':'◀ ▶',rv=kbUsed?'I K':'▲ ▼';
  $('#capL').innerHTML=m==='dig'?`<b>${lh}</b> Swing<br><b>${lv}</b> Stick out / in`:m==='drive'?`<b>${lh}</b> Turn<br><b>${lv}</b> Drive fwd / back`:`<b>${lh}</b> Steer<br><b>${lv}</b> Gas / reverse`;
  $('#capR').innerHTML=m==='truck'?`<b>${rv}</b> Bed up / down<br>&nbsp;`:`<b>${rh}</b> Curl / dump<br><b>${rv}</b> Boom down / up`;}
function setMode(m){if(m===mode)return;mode=m;for(const [id,k] of [['#modeDig','dig'],['#modeDrive','drive'],['#modeTruck','truck']])$(id).setAttribute('aria-pressed',m===k);
  setCaps();firstCam=true;}
$('#modeDig').onclick=()=>setMode('dig'); $('#modeDrive').onclick=()=>setMode('drive'); $('#modeTruck').onclick=()=>setMode('truck');
$('#camBtn').onclick=()=>{camMode=camMode==='chase'?'cab':'chase';$('#camBtn').textContent=camMode==='chase'?'Cab view':'Chase view'};
let resetArm=0;
$('#resetBtn').onclick=()=>{const b=$('#resetBtn');
  if(resetArm&&performance.now()-resetArm<2500){resetState();resetArm=0;b.textContent='Reset';b.classList.remove('arm');toast('Fresh ground. Paint is back.','good');return}
  resetArm=performance.now();b.textContent='Tap again';b.classList.add('arm');
  setTimeout(()=>{if(resetArm&&performance.now()-resetArm>=2400){resetArm=0;b.textContent='Reset';b.classList.remove('arm')}},2500);};
const help=$('#help');
$('#helpBtn').onclick=()=>{help.hidden=false;showMenu(false)};
$('#soundBtn').onclick=()=>setSound(!sndOn);
function showMenu(on){$('#menu').hidden=!on;$('#menuBtn').setAttribute('aria-expanded',on)}
$('#menuBtn').onclick=()=>showMenu($('#menu').hidden);
$('#view').addEventListener('pointerdown',()=>showMenu(false));
let uiScale=1;
function setUiScale(v){uiScale=+v||1;const h=$('#hud');h.style.setProperty('--s',uiScale);h.style.setProperty('--ms',Math.min(uiScale,1.5));h.style.setProperty('--cs',Math.min(uiScale,1.3));h.classList.toggle('lg',uiScale>1.2);
  document.querySelectorAll('.sizes button[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===uiScale));try{localStorage.setItem('bhd_ui',uiScale)}catch(e){}}
document.querySelectorAll('.sizes button[data-s]').forEach(b=>b.onclick=()=>setUiScale(b.dataset.s));
try{setUiScale(localStorage.getItem('bhd_ui')||1)}catch(e){setUiScale(1)}
const statusEl=$('#status');try{statusEl.classList.toggle('min',localStorage.getItem('bhd_hudmin')==='1')}catch(e){}
statusEl.onclick=()=>{const m=statusEl.classList.toggle('min');try{localStorage.setItem('bhd_hudmin',m?'1':'0')}catch(e){}};
$('#startBtn').onclick=()=>{help.hidden=true;try{localStorage.setItem('bhd_seen','1')}catch(e){}};
try{if(localStorage.getItem('bhd_seen'))help.hidden=true}catch(e){}
function started(){if(!st.startT)st.startT=performance.now()}

let toastTimer=0;
function toast(t,kind,ms){const el=$('#toastText');el.textContent=t;el.className='show '+(kind||'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className=kind||'',ms||2200)}
