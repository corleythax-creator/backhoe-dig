// Corley's Island: game state, reset, touch sticks, keyboard, game controller, mode switch and menu.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- state ----------
const CAP=1.0;
const START={x:0.42,z:0,yaw:Math.PI,swing:0,a1:0.5,a2:-1.8,a3:-1.2};
const st={};
function resetState(){
  Object.assign(st,START,{y:0,pitch:0,roll:0,load:0,strikes:0,exposed:false,done:false,startT:0,doneT:0,below:false,strikeCd:0,slumpT:0,dirty:true,res:1,soil:-1,seenSand:false,seenRock:false,rumT:0,loadC:[...SOIL[SPOIL].c],loadMix:[...CRUMB_MIX],stuck:0,grime:0,mud:0,loadWet:0,pouring:false,caves:0,caveRisk:0,caveScanT:0,cave:null,sink:0,spin:0});
  cI0=N+1;cI1=-1;cJ0=N+1;cJ1=-1;
  H.set(H0);dI0=0;dI1=N;dJ0=0;dJ1=N;winOn=true;Object.assign(tr,TR_START);tr.loadC=[...SOIL[SPOIL].c];tr.loadMix=[...CRUMB_MIX];tr.stuck=0;tr.mud=0;tr.sink=0;tr.spin=0;tr.loadWet=0;tr.pourRate=0;tr.pourP=new THREE.Vector3();
  for(let k=0;k<V*V;k++)spoilC.set(SOIL[SPOIL].c,k*3);
  clearClods();wetT.fill(-1e4);comp.fill(0);clearDust();waterClear();mudReset();rainReset();
  blkReset();mowReset();skidReset();walkReset();Object.assign(TB,TB_START,{hooked:false,seated:false});TB.y=TB.ty=boxRest();prot.fill(0);chain.visible=false;
}
resetState();
const LIM={a1:[-0.55,1.3],a2:[-2.65,-0.45],a3:[-2.85,0.35]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------- input ----------
let mode='dig',camMode='chase',edOn=false;
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
// keyboard: every key runs the action it is bound to in keys.js (standard: WASD/arrows the left stick, IJKL the right stick);
// the sticks' captions show the keys once one is pressed
const MODES=['dig','drive','truck','mow','skid','walk'];let kbUsed=false;
const KEY_RUN={dig:()=>setMode('dig'),drive:()=>setMode('drive'),truck:()=>setMode('truck'),mow:()=>setMode('mow'),skid:()=>setMode('skid'),walk:()=>setMode('walk'),
  nextMode:e=>setMode(MODES[(MODES.indexOf(mode)+(e.shiftKey?MODES.length-1:1))%MODES.length]),
  stats:()=>showStats(statBox.hidden),heat:()=>{if(!heat.on)setHeat(true);else if(heat.mode!==HEAT_MODES[HEAT_MODES.length-1][0])heatNext();else setHeat(false)},
  enter:()=>seatToggle(),jump:()=>walkJump(),blocks:()=>setBlocks(!blkOn),place:()=>placeBlock(),lift:()=>removeBlock(),size:()=>setBlkSize(blkSize%3+1),
  box:()=>hookBox(),lookAhead:()=>{if(camMode==='cab')fpl.home=true;fpl.zt=1},pump:()=>setPump(!pumpOn),cam:()=>$('#camBtn').click(),map:()=>toggleMap(),sound:()=>setSound(!sndCfg.on),help:()=>{help.hidden=!help.hidden}};
addEventListener('keydown',e=>{const c=e.code;
  if((e.ctrlKey||e.metaKey||e.altKey)&&!/^(Control|Alt|Meta)/.test(c))return;
  if(c==='Escape'){help.hidden=true;return}
  if(!keysBox.hidden)return;
  const acts=keyActs(c);keys[c]=true;
  if(acts.length||c.startsWith('Arrow')||c==='Space'||c==='Tab')e.preventDefault();
  if(edOn)return;
  if(!kbUsed){kbUsed=true;padUsed=false;document.body.classList.add('kb');setCaps()}
  if(!e.repeat)for(const id of acts)if(KEY_RUN[id])KEY_RUN[id](e);
  started()});
addEventListener('keyup',e=>{keys[e.code]=false});
const clearKeys=()=>{for(const k in keys)keys[k]=false};
addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',clearKeys);
const held=id=>keyBind[id].some(c=>c&&keys[c]),kv=(a,b)=>(held(a)?1:0)-(held(b)?1:0);
// keys ease in over ~0.2 s and out over ~0.1 s so a tap nudges and a hold runs smooth; Fine control (Shift) is a slow gear
const KA={lx:0,ly:0,rx:0,ry:0};
function keyAxes(dt){const f=mode!=='walk'&&held('fine')?0.3:1;
  const t={lx:kv('lRight','lLeft'),ly:kv('lUp','lDown'),rx:kv('rRight','rLeft'),ry:kv('rUp','rDown')};
  // mower: ly / ry are the left / right lap bars. Up and down drive both (A / D still spin, as the left stick does), and the
  // numpad has both bars together (8 2), a spin in place (4 6) and each bar on its own (7 1 left, 9 3 right)
  if(mode==='mow'){const go=t.ly+kv('mwFwd','mwBack'),sp=kv('mwSpinR','mwSpinL')*turnSens;
    t.ly=go+sp+kv('mwLF','mwLB');t.ry=go-sp+kv('mwRF','mwRB');t.rx=0}
  for(const k in t){const g=clamp(t[k],-1,1)*f,r=(g===0?10:5)*dt;KA[k]+=clamp(g-KA[k],-r,r)}}
// game controller (standard mapping): sticks = the two on-screen sticks, triggers = gas / reverse when driving,
// LB/RB switch machine, Y cab view, View map, Menu help, B closes (or gets in and out of machines), A sets a block,
// D-pad runs blocks (in Walk mode A jumps and X sets a block); a line strike rumbles
const PA={lx:0,ly:0,rx:0,ry:0,thr:0,sprint:false},padPrev=[];let padIdx=-1,padUsed=false;
addEventListener('gamepadconnected',e=>{padIdx=e.gamepad.index;toast('Controller ready. LB / RB switch machine, Y cab view.','good',3500)});
addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index===padIdx)padIdx=-1;for(const k in PA)PA[k]=0;padPrev.length=0});
function getPad(){if(!navigator.getGamepads)return null;const all=navigator.getGamepads();
  if(padIdx<0||!all[padIdx])padIdx=[...all].findIndex(g=>g&&g.connected);return padIdx<0?null:all[padIdx]}
function usePad(){if(!padUsed){padUsed=true;kbUsed=false;document.body.classList.remove('kb');setCaps()}started()}
function padButton(i){usePad();
  if(i===4||i===5)setMode(MODES[(MODES.indexOf(mode)+(i===5?1:MODES.length-1))%MODES.length]);
  else if(i===3)$('#camBtn').click();
  else if(i===0&&mode==='walk')walkJump();
  else if(i===2&&mode==='walk')placeBlock();
  else if(i===2)hookBox();
  else if(i===0)placeBlock();
  else if(i===12)setBlocks(!blkOn);
  else if(i===13)removeBlock();
  else if(i===14||i===15)setBlkSize((blkSize+(i===15?0:1))%3+1);
  else if(i===11){if(camMode==='cab')fpl.home=true;fpl.zt=1}
  else if(i===8)toggleMap();
  else if(i===9)help.hidden=!help.hidden;
  else if(i===1){const open=!help.hidden||!$('#bigmap').hidden;help.hidden=true;toggleMap(false);if(!open&&(mode==='walk'||wk.inside))seatToggle()}}
function pollPad(){for(const k in PA)PA[k]=0;PA.sprint=false;const gp=getPad();if(!gp)return;
  const dz=v=>Math.abs(v)<0.15?0:(v-Math.sign(v)*0.15)/0.85,ax=gp.axes,b=gp.buttons,bv=i=>b[i]?b[i].value:0;
  PA.lx=dz(ax[0]||0);PA.ly=-dz(ax[1]||0);PA.rx=dz(ax[2]||0);PA.ry=-dz(ax[3]||0);PA.thr=bv(7)-bv(6);PA.sprint=!!(b[10]&&b[10].pressed);
  for(let i=0;i<b.length;i++){const on=b[i].pressed;if(on&&!padPrev[i])padButton(i);padPrev[i]=on}
  if(PA.lx||PA.ly||PA.rx||PA.ry||Math.abs(PA.thr)>0.05)usePad()}
function rumble(ms,mag){const gp=getPad(),va=gp&&gp.vibrationActuator;
  if(va&&va.playEffect)va.playEffect('dual-rumble',{duration:ms,strongMagnitude:mag,weakMagnitude:mag*0.6}).catch(()=>{})}
// orbit drag on the scene; in cab view the same drag turns your head instead (see fpTurn)
let orbitYaw=0,orbitPitch=0.42,camDist=9.5,drag=null;
const camPtrs=new Map();let pinch=0;
canvas.addEventListener('pointerdown',e=>{if(edOn)return;camPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
  if(camPtrs.size===2){const [a,b]=camPtrs.values();pinch=Math.hypot(a.x-b.x,a.y-b.y);drag=null;return}
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};
  if(camMode==='cab'&&e.pointerType==='mouse'&&e.button===0&&!PHONE)fpMouseLock(true)});
canvas.addEventListener('pointermove',e=>{const p=camPtrs.get(e.pointerId);if(p){p.x=e.clientX;p.y=e.clientY}
  // two fingers in cab view pinch to zoom
  if(camPtrs.size===2&&pinch>0){const [a,b]=camPtrs.values(),d=Math.hypot(a.x-b.x,a.y-b.y);if(camMode==='cab')fpl.zt=clamp(fpl.zt*d/pinch,1,FP_ZOOM);pinch=d;return}
  if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  if(camMode==='cab'){if(document.pointerLockElement!==canvas)fpTurn(dx*0.006,dy*0.005)}
  else{orbitYaw-=dx*0.006;orbitPitch=clamp(orbitPitch+dy*0.005,0.08,1.3)}});
const dend=e=>{camPtrs.delete(e.pointerId);if(camPtrs.size<2)pinch=0;if(drag&&e.pointerId===drag.id)drag=null};
canvas.addEventListener('pointerup',dend);canvas.addEventListener('pointercancel',dend);
canvas.addEventListener('wheel',e=>{if(edOn)return;e.preventDefault();
  if(camMode==='cab')fpl.zt=clamp(fpl.zt*Math.exp(-e.deltaY*0.0015),1,FP_ZOOM);else camDist=clamp(camDist+e.deltaY*0.01,5,22)},{passive:false});
// first person (cab view): where the eyes look. On foot the body turns with the view (wk.view) and fpl.pitch tilts the
// head; in a machine fpl.yaw and fpl.pitch turn the head in the seat. Drag the scene to look (on a PC, a click takes the
// mouse for mouse look until Esc); the wheel, a pinch or a held Z zooms; R looks straight ahead again
const FP_YAW=2.6,FP_UP=1.35,FP_DOWN=1.4,FP_ZOOM=4;
const fpl={yaw:0,pitch:0,zoom:1,zt:1,home:false};
function fpTurn(dx,dy){const k=1/fpl.zoom;fpl.home=false;
  if(mode==='walk')wk.view-=dx*k;else fpl.yaw=clamp(fpl.yaw-dx*k,-FP_YAW,FP_YAW);
  fpl.pitch=clamp(fpl.pitch-dy*k,-FP_DOWN,FP_UP)}
function fpReset(){fpl.yaw=fpl.pitch=0;fpl.zt=1;fpl.home=false}
let fpLockTold=false;
function fpMouseLock(on){
  if(on){if(document.pointerLockElement===canvas||!canvas.requestPointerLock)return;
    try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}
    if(!fpLockTold){fpLockTold=true;toast(`Mouse look. Move the mouse to look around, wheel or ${keyLabel('zoom')} zooms, ${keyLabel('lookAhead')} looks ahead. Esc frees the mouse.`,'',4200)}}
  else if(document.pointerLockElement===canvas)document.exitPointerLock()}
// (some browsers send a wild jump as the mouse is taken: skip any single move that large)
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||camMode!=='cab'||edOn)return;
  if(Math.abs(e.movementX)<300&&Math.abs(e.movementY)<300)fpTurn(e.movementX*0.0025,e.movementY*0.0025)});
// eases the head back to straight ahead after R; ends at once if you look somewhere
function fpTick(dt){if(fpl.home){const k=Math.min(1,dt*8);fpl.yaw-=fpl.yaw*k;fpl.pitch-=fpl.pitch*k;if(Math.abs(fpl.yaw)+Math.abs(fpl.pitch)<0.003){fpl.yaw=fpl.pitch=0;fpl.home=false}}
  const zt=camMode!=='cab'?1:held('zoom')?Math.max(fpl.zt,3):fpl.zt;fpl.zoom+=(zt-fpl.zoom)*Math.min(1,dt*10);
  const f=camFov/fpl.zoom;if(Math.abs(camera.fov-f)>0.01){camera.fov=f;camera.updateProjectionMatrix()}
  if(camMode!=='cab'||edOn||!help.hidden)fpMouseLock(false);
  const aim=camMode==='cab'&&mode==='walk'&&!bench.on;if(aimEl.hidden===aim)aimEl.hidden=!aim}
const aimEl=$('#aim');

function setCaps(){const m=mode,two=(a,b)=>`${keyLabel(a)} ${keyLabel(b)}`,lh=kbUsed?two('lLeft','lRight'):'◀ ▶',lv=kbUsed?two('lUp','lDown'):'▲ ▼',rh=kbUsed?two('rLeft','rRight'):'◀ ▶',rv=kbUsed?two('rUp','rDown'):'▲ ▼';
  for(const b of document.querySelectorAll('.seg button'))b.dataset.k=keyLabel(b.id.slice(4).toLowerCase());
  $('#capL').innerHTML=m==='dig'?`<b>${lh}</b> Swing<br><b>${lv}</b> Stick out / in`:m==='drive'?`<b>${lh}</b> Turn<br><b>${lv}</b> Drive fwd / back`:m==='mow'?(kbUsed?`<b>${lv}</b> Drive fwd / back<br><b>${lh}</b> Turn`:`<b>${lv}</b> Left lap bar<br><b>${lh}</b> Spin`):m==='walk'?`<b>${lv}</b> Walk / back<br><b>${lh}</b> Step left / right`:m==='skid'?`<b>${lv}</b> Drive fwd / back<br><b>${lh}</b> Turn`:`<b>${lh}</b> Steer<br><b>${lv}</b> Gas / reverse`;
  $('#capR').innerHTML=m==='truck'?`<b>${rv}</b> Bed up / down<br>&nbsp;`:m==='mow'?(kbUsed?`<b>${keyLabel('mwLF')} ${keyLabel('mwLB')}</b> Left bar · <b>${keyLabel('mwRF')} ${keyLabel('mwRB')}</b> Right bar<br><b>${keyLabel('mwSpinL')} ${keyLabel('mwSpinR')}</b> Spin in place`:`<b>${rv}</b> Right lap bar<br>&nbsp;`):m==='walk'?`<b>${rh}</b> Turn<br><b>${rv}</b> Look up / down`:m==='skid'?`<b>${rh}</b> Curl / dump<br><b>${rv}</b> Arms down / up`:`<b>${rh}</b> Curl / dump<br><b>${rv}</b> Boom down / up`;}
function setMode(m){if(m===mode)return;mode=m;for(const [id,k] of [['#modeDig','dig'],['#modeDrive','drive'],['#modeTruck','truck'],['#modeMow','mow'],['#modeSkid','skid'],['#modeWalk','walk']])$(id).setAttribute('aria-pressed',m===k);
  $('#walkBtns').hidden=m!=='walk';if(m!=='walk')setSprint(false);$('#capR').hidden=m==='walk';
  // switching to Walk from a machine you climbed into sets you down beside it
  if(m==='walk'){if(wk.inside){wkPlaceOut(wk.inside);wk.inside=null}wk.view=wk.yaw}
  setCaps();markTile();firstCam=true;fpReset();if(m==='mow'&&!lawn.startT&&!lawn.done)toast(kbUsed?`Mower running. ${keyLabel('lUp')} drives straight, ${keyLabel('lLeft')} ${keyLabel('lRight')} turn; the number pad works each lap bar.`:'Mower running. Push both sticks up to drive, one up and one back to spin.','',3800);
  if(m==='skid')toast(kbUsed?`Skid steer running. ${keyLabel('lUp')} ${keyLabel('lDown')} drive, ${keyLabel('lLeft')} ${keyLabel('lRight')} turn; ${keyLabel('rUp')} ${keyLabel('rDown')} lower and raise the arms, ${keyLabel('rLeft')} ${keyLabel('rRight')} curl and dump.`:'Skid steer running. Left stick drives and turns; right stick up and down lowers and raises the arms, left and right curls and dumps.','',4200);
  if(m==='walk')toast(padUsed?'On foot. A jumps, X sets a block, B gets into a machine.':kbUsed?`On foot. ${keyLabel('jump')} jumps, ${keyLabel('place')} sets a block, ${keyLabel('enter')} gets into a machine.`:'On foot. Tap Jump to jump. Walk up to a machine and tap Get in.','',3800)}
$('#modeDig').onclick=()=>setMode('dig'); $('#modeDrive').onclick=()=>setMode('drive'); $('#modeTruck').onclick=()=>setMode('truck'); $('#modeMow').onclick=()=>setMode('mow'); $('#modeSkid').onclick=()=>setMode('skid'); $('#modeWalk').onclick=()=>setMode('walk');
$('#camBtn').onclick=()=>{camMode=camMode==='chase'?'cab':'chase';fpReset();$('#camBtn').textContent=camMode==='chase'?'Cab view':'Chase view'};
let resetArm=0;
$('#resetBtn').onclick=()=>{const b=$('#resetBtn');
  if(resetArm&&performance.now()-resetArm<2500){resetState();siteSaveAll();resetArm=0;b.textContent='Reset';b.classList.remove('arm');toast('Fresh ground. Paint is back.','good');return}
  resetArm=performance.now();b.textContent='Tap again';b.classList.add('arm');
  setTimeout(()=>{if(resetArm&&performance.now()-resetArm>=2400){resetArm=0;b.textContent='Reset';b.classList.remove('arm')}},2500);};
const help=$('#help');
$('#helpBtn').onclick=()=>{help.hidden=false;showMenu(false)};
$('#soundBtn').onclick=()=>{showSound(true);showMenu(false)};
$('#keysBtn').onclick=()=>{showKeys(true);showMenu(false)};
function showMenu(on){$('#menu').hidden=!on;$('#menuBtn').setAttribute('aria-expanded',on)}
$('#menuBtn').onclick=()=>showMenu($('#menu').hidden);
$('#view').addEventListener('pointerdown',()=>showMenu(false));
let uiScale=1;
function setUiScale(v){uiScale=+v||1;const h=$('#hud');h.style.setProperty('--s',uiScale);h.style.setProperty('--ms',Math.min(uiScale,1.5));h.style.setProperty('--cs',Math.min(uiScale,1.3));h.classList.toggle('lg',uiScale>1.2);
  document.querySelectorAll('.sizes button[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===uiScale));try{localStorage.setItem('bhd_ui',uiScale)}catch(e){}}
document.querySelectorAll('.sizes button[data-s]').forEach(b=>b.onclick=()=>setUiScale(b.dataset.s));
try{setUiScale(localStorage.getItem('bhd_ui')||1)}catch(e){setUiScale(1)}
// turn sensitivity (above the left stick): scales every left / right input, swing, tracks, steering, the mower's spin
// and looking round on foot, from 25% to 200% (60% unless the player moves it); saved on this device once moved.
// Open on a computer, a tap away on a phone
const TURN_DEF=60;let turnSens=TURN_DEF/100;const turnSl=$('#turnSl'),turnBtn=$('#turnBtn');
function setTurnSens(v){turnSens=clamp(Math.round(+v/5)*5||TURN_DEF,25,200)/100;turnSl.value=Math.round(turnSens*100);turnBtn.textContent=`Turn ${turnSl.value}%`}
function showTurnSl(on){turnSl.hidden=!on;turnBtn.setAttribute('aria-expanded',on)}
// v82 saved 100% under bhd_turn on every load, moved or not, so only a value other than 100% there is the player's own
try{const s=+localStorage.getItem('bhd_turnS')||(+localStorage.getItem('bhd_turn')!==1&&+localStorage.getItem('bhd_turn'));setTurnSens(s?s*100:TURN_DEF)}catch(e){setTurnSens(TURN_DEF)}
showTurnSl(!PHONE);
turnBtn.onclick=()=>showTurnSl(turnSl.hidden);
turnSl.oninput=()=>{setTurnSens(turnSl.value);try{localStorage.setItem('bhd_turnS',turnSens)}catch(e){}};
// let go of the slider so the arrow keys drive again
turnSl.onchange=()=>turnSl.blur();
const statusEl=$('#status');try{statusEl.classList.toggle('min',localStorage.getItem('bhd_hudmin')==='1')}catch(e){}
statusEl.onclick=()=>{const m=statusEl.classList.toggle('min');try{localStorage.setItem('bhd_hudmin',m?'1':'0')}catch(e){}};
// the start card: tap a machine (or On foot) to start in that mode; tapping outside the card keeps the current one
function startIn(m){setMode(m);help.hidden=true;try{localStorage.setItem('bhd_seen','1')}catch(e){}}
const tiles=[...document.querySelectorAll('.tile')];
for(const t of tiles)t.onclick=()=>startIn(t.dataset.m);
function markTile(){const m=mode==='drive'?'dig':mode;for(const t of tiles)t.setAttribute('aria-pressed',t.dataset.m===m)}
markTile();
help.addEventListener('click',e=>{if(e.target===help)startIn(mode)});
$('#ctrlBtn').onclick=()=>{const b=$('#ctrlBtn'),box=$('#ctrlBox'),on=box.hidden;box.hidden=!on;b.setAttribute('aria-expanded',on);b.textContent=on?'Hide controls':'Controls';if(on)box.scrollIntoView({block:'start',behavior:'smooth'})};
function started(){if(!st.startT)st.startT=performance.now()}
// the version in the menu and on the help card is the last entry in data/effort.js (the build log), so it is never stale
{const E=window.EFFORT,v=E&&E.versions&&E.versions[E.versions.length-1];
  if(v){const d=new Date(v.live).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Chicago'});
    $('#verMenu').textContent=`Version ${v.v}`;$('#verHelp').textContent=`Version ${v.v} · went live ${d} Central`}}
// updates: a Home Screen app can stay open for days without reloading, so the game re-reads the build log when it comes
// back to the front, when it is restored from the back-forward cache, and every 10 minutes while it is open. The site and
// lawn are saved on the way out (save.js, mower.js), so a newer version reloads at once when the game comes back from the
// background or nothing is under way yet; one that lands mid-play waits behind a tap-to-update button instead of
// reloading under the player's thumbs
const GAME_V=(()=>{const E=window.EFFORT,v=E&&E.versions&&E.versions[E.versions.length-1];return v?v.v:0})();
let verBusy=false;
function verReload(){try{siteSaveAll()}catch(e){}try{lawnSave()}catch(e){}location.reload()}
function verCheck(back){if(verBusy||!GAME_V||!window.fetch)return;verBusy=true;
  fetch('data/effort.js?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{let n=0;for(const m of t.matchAll(/"v":\s*(\d+)/g))n=Math.max(n,+m[1]);
    if(n<=GAME_V)return;
    if(!bench.on&&(back||!help.hidden||!st.startT))verReload();
    else{const b=$('#updBtn');b.textContent=`Version ${n} is out · tap to update`;b.hidden=false}}).catch(()=>{}).finally(()=>{verBusy=false})}
$('#updBtn').onclick=verReload;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verCheck(true)});
addEventListener('pageshow',e=>{if(e.persisted)verCheck(true)});
setInterval(()=>{if(!document.hidden)verCheck(false)},600000);

let toastTimer=0;
function toast(t,kind,ms){const el=$('#toastText');el.textContent=t;el.className='show '+(kind||'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className=kind||'',ms||2200)}
