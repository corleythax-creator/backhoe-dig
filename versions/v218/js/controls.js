// Corley's Island: game state, reset, touch sticks, keyboard, game controller, mode switch and menu.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- state ----------
const START={x:0.42,z:0,yaw:Math.PI,swing:0,a1:0.5,a2:-1.8,a3:-1.2};
const st={};
function resetState(){
  Object.assign(st,START,{y:0,pitch:0,roll:0,load:0,strikes:0,exposed:false,done:false,startT:0,doneT:0,below:false,strikeCd:0,slumpT:0,dirty:true,res:1,soil:-1,seenSand:false,seenRock:false,rumT:0,loadC:[...SOIL[SPOIL].c],loadMix:[...CRUMB_MIX],stuck:0,grime:0,mud:0,pack:0,packC:[...MUD_C],loadWet:0,pouring:false,caves:0,caveRisk:0,caveScanT:0,cave:null,sink:0,spin:0});
  cI0=N+1;cI1=-1;cJ0=N+1;cJ1=-1;
  H.set(H0);dI0=0;dI1=N;dJ0=0;dJ1=N;winOn=true;Object.assign(tr,TR_START);tr.loadC=[...SOIL[SPOIL].c];tr.loadMix=[...CRUMB_MIX];tr.stuck=0;tr.mud=0;tr.sink=0;tr.spin=0;tr.loadWet=0;tr.pourRate=0;tr.pourP=new THREE.Vector3();
  for(let k=0;k<V*V;k++)spoilC.set(SOIL[SPOIL].c,k*3);
  clearClods();wetT.fill(-1e4);comp.fill(0);clearDust();waterClear();mudReset();rainReset();
  blkReset();mowReset();skidReset();walkReset();if(typeof twReset==='function')twReset();Object.assign(TB,TB_START,{hooked:false,seated:false});TB.y=TB.ty=boxRest();prot.fill(0);chain.visible=false;
  if(typeof cplReset==='function')cplReset();
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
  el.addEventListener('pointerdown',e=>{e.preventDefault();if(s.id!==null)return;s.id=e.pointerId;el.setPointerCapture(e.pointerId);move(e);started()});
  el.addEventListener('pointermove',e=>{if(e.pointerId===s.id)move(e)});
  const end=e=>{if(e.pointerId!==s.id)return;s.id=null;s.x=s.y=0;knob.style.transform=''};
  // a second finger on a held stick is ignored; losing the capture lets go too, so a lost pointerup can't lock the stick
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
  return s;
}
const SL=makeStick($('#stickL')),SR=makeStick($('#stickR'));
const keys={};
// keyboard: every key runs the action it is bound to in keys.js (standard: WASD/arrows the left stick, IJKL the right stick);
// the sticks' captions show the keys once one is pressed
const MODES=['dig','drive','truck','mow','skid','walk'];let kbUsed=false;
const KEY_RUN={dig:()=>setMode('dig'),drive:()=>setMode('drive'),exSwap:()=>exSwap(),bhOut:()=>bhOut(),truck:()=>setMode('truck'),mow:()=>setMode('mow'),skid:()=>setMode('skid'),walk:()=>setMode('walk'),
  nextMode:e=>setMode(MODES[(MODES.indexOf(mode)+(e.shiftKey?MODES.length-1:1))%MODES.length]),
  stats:()=>showStats(statBox.hidden),heat:()=>{if(!heat.on)setHeat(true);else if(heat.mode!==HEAT_MODES[HEAT_MODES.length-1][0])heatNext();else setHeat(false)},
  enter:()=>seatToggle(),jump:()=>walkJump(),plant:()=>plantHere(),trim:()=>trimSet(!trim.on),trimBump:()=>trimBump(),plantKind:()=>plantNext(),carry:()=>pbAct(),blocks:()=>setBlocks(!blkOn),place:()=>placeBlock(),lift:()=>removeBlock(),size:()=>blkCube(1),blkTurn:()=>blkTurn(),blkLock:()=>toast(say('blkSnap',{snap:blkLockNext()}),'',1400),blkFar:()=>blkReachBy(2),blkNear:()=>blkReachBy(-2),
  blkMat:()=>{let m=blkMat;do m=(m+1)%MAT_MAX;while(m&&!MAT_LIST[m-1]);setBlkMat(m);toast(say('blkMat',{mat:blkMatName(blkMat)}),'',1400)},
  box:()=>hookBox(),coupler:()=>cplAct(),grip:()=>cplGrip(),lookAhead:()=>{if(camMode==='cab')fpl.home=true;fpl.zt=1},pump:()=>setPump(!pumpOn),wipers:()=>setWipers(!wipeOn),cam:()=>$('#camBtn').click(),map:()=>toggleMap(),sound:()=>setSound(!sndCfg.on),help:()=>{help.hidden=!help.hidden}};
addEventListener('keydown',e=>{const c=e.code;
  if((e.ctrlKey||e.metaKey||e.altKey)&&!/^(Control|Alt|Meta)/.test(c))return;
  if(c==='Escape'){help.hidden=true;return}
  if(!keysBox.hidden)return;
  const acts=keyActs(c);keys[c]=true;
  if(acts.length||c.startsWith('Arrow')||c==='Space'||c==='Tab')e.preventDefault();
  if(edOn)return;
  if(!kbUsed){kbUsed=true;padUsed=false;document.body.classList.add('kb');setCaps()}
  // a key shared by an on-foot action and a machine one (s:'walk', s:'ride', keys.js) runs only the one for where you are
  if(!e.repeat)for(const id of acts){const sc=KEY_BY[id].s;if(sc&&(sc==='walk')!==(mode==='walk'))continue;if(KEY_RUN[id])KEY_RUN[id](e)}
  started()});
// macOS sends no keyup for keys let go while Cmd is down, so Cmd's own keyup lets go of everything
addEventListener('keyup',e=>{keys[e.code]=false;if(e.key==='Meta')clearKeys()});
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
const PA={lx:0,ly:0,rx:0,ry:0,thr:0,sprint:false},padPrev=[];let padIdx=-1,padUsed=false,padBackT=0;
addEventListener('gamepadconnected',e=>{if(padIdx<0||e.gamepad.mapping==='standard')padIdx=e.gamepad.index;padPrev.length=0;toast(say('padReady'),'good',3500)});
addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index!==padIdx)return;padIdx=-1;for(const k in PA)PA[k]=0;padPrev.length=0;if(padUsed)toast(say('padLost'),'',3500)});
// the pad in use: the one last pressed, else the first connected (standard mapping first: Bluetooth can add a ghost pad)
function getPad(){if(!navigator.getGamepads)return null;const all=[...navigator.getGamepads()].filter(g=>g&&g.connected);
  for(const g of all)if(g.index!==padIdx&&g.buttons.some(b=>b.pressed)){padIdx=g.index;padPrev.length=0}
  let gp=all.find(g=>g.index===padIdx);if(!gp){gp=all.find(g=>g.mapping==='standard')||all[0];padIdx=gp?gp.index:-1}
  return gp?padStd(gp):null}
// a pad the browser leaves unmapped (an Xbox pad over Bluetooth in Firefox on Linux) reads in the Linux layout: axes LX LY LT
// RX RY RT, D-pad X Y; buttons A B X Y LB RB View Menu Xbox LS RS. Triggers rest at -1 but read 0 until first touched
const padTrigSeen=[];
function padStd(gp){if(gp.mapping==='standard'||gp.axes.length<6||gp.buttons.length<11)return gp;
  const a=gp.axes,btn=(on,v)=>({pressed:on,value:v}),trig=i=>{if(a[i]<-0.5)padTrigSeen[i]=true;return padTrigSeen[i]?clamp((a[i]+1)/2,0,1):0},
    B=gp.buttons,b=i=>B[i]||btn(false,0),lt=trig(2),rt=trig(5),dx=a[6]||0,dy=a[7]||0;
  return {index:gp.index,id:gp.id,mapping:'standard',vibrationActuator:gp.vibrationActuator,axes:[a[0],a[1],a[3],a[4]],
    buttons:[b(0),b(1),b(2),b(3),b(4),b(5),btn(lt>0.3,lt),btn(rt>0.3,rt),b(6),b(7),b(9),b(10),btn(dy<-0.5,+(dy<-0.5)),btn(dy>0.5,+(dy>0.5)),btn(dx<-0.5,+(dx<-0.5)),btn(dx>0.5,+(dx>0.5)),b(8)]}}
// Android turns some pad buttons into keys as well (A Enter, the D-pad arrows, B Back): drop those echoes so they neither
// drive nor press a focused button, and keep one page of history so B never leaves the game
const PAD_ECHO={Enter:0,NumpadEnter:0,Space:0,Escape:1,BrowserBack:1,ArrowUp:12,ArrowDown:13,ArrowLeft:14,ArrowRight:15};
addEventListener('keydown',e=>{const i=PAD_ECHO[e.code];if(i===undefined||padIdx<0)return;const gp=getPad(),b=gp&&gp.buttons[i];
  if(b&&b.pressed){e.preventDefault();e.stopImmediatePropagation()}},true);
addEventListener('popstate',()=>{const gp=padIdx<0?null:getPad();if(gp&&gp.buttons[1].pressed||performance.now()-padBackT<800)history.pushState({pad:1},'')});
function usePad(){if(!padUsed){padUsed=true;kbUsed=false;document.body.classList.remove('kb');setCaps();if(!(history.state&&history.state.pad))history.pushState({pad:1},'')}started()}
function padButton(i){usePad();if(i===1)padBackT=performance.now();
  if(i===4||i===5)setMode(MODES[(MODES.indexOf(mode)+(i===5?1:MODES.length-1))%MODES.length]);
  else if(i===3)$('#camBtn').click();
  else if(i===0&&mode==='walk')walkJump();
  else if(i===2&&mode==='walk')placeBlock();
  else if(i===2)hookBox();
  else if(i===0)placeBlock();
  else if(i===12)setBlocks(!blkOn);
  else if(i===13)removeBlock();
  else if(i===14||i===15)blkCube(i===15?1:-1);
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
  if(va&&va.playEffect)va.playEffect('dual-rumble',{duration:ms,strongMagnitude:mag,weakMagnitude:mag*0.6}).catch(()=>{});vrRumble(ms,mag)}
// orbit drag on the scene; in cab view the same drag turns your head instead (see fpTurn)
let orbitYaw=0,orbitPitch=0.42,camDist=9.5,drag=null;
// the orbit camera (camFree, in chase view): it holds its bearing as the machine turns, swings right over the top and zooms
// from close in to high overhead; the chase camera's limits come back when you leave it
let camFree=false,camBase=null;
const camPitchMax=()=>camFree?1.52:1.3,camPitchMin=()=>camFree?0.02:0.08,camDistMin=()=>camFree?2.5:5,camDistMax=()=>camFree?70:22;
const camPtrs=new Map();let pinch=0;
// (with the mouse taken for mouse look the browser refuses pointer capture; the click still has to go through)
canvas.addEventListener('pointerdown',e=>{if(edOn)return;camPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId)}catch(err){}
  if(camPtrs.size===2){const [a,b]=camPtrs.values();pinch=Math.hypot(a.x-b.x,a.y-b.y);drag=null;return}
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t0:performance.now(),btn:e.button,mouse:e.pointerType==='mouse',locked:document.pointerLockElement===canvas};
  // with the mouse taken on foot and blocks on, a click sets a block where the dot is and a right click lifts one
  if(document.pointerLockElement===canvas&&blkOn&&blkFP()){if(e.button===0)placeBlock();else if(e.button===2)removeBlock();return}
  if(camMode==='cab'&&e.pointerType==='mouse'&&e.button===0&&!PHONE)fpMouseLock(true)});
canvas.addEventListener('contextmenu',e=>{if(document.pointerLockElement===canvas)e.preventDefault()});
canvas.addEventListener('pointermove',e=>{const p=camPtrs.get(e.pointerId);if(p){p.x=e.clientX;p.y=e.clientY}
  // two fingers in cab view pinch to zoom
  if(camPtrs.size===2&&pinch>0){const [a,b]=camPtrs.values(),d=Math.hypot(a.x-b.x,a.y-b.y);if(camMode!=='cab'&&d>0)camDist=clamp(camDist*pinch/d,camDistMin(),camDistMax());if(camMode==='cab')fpl.zt=clamp(fpl.zt*d/pinch,1,FP_ZOOM);pinch=d;return}
  if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  if(camMode==='cab'){if(document.pointerLockElement!==canvas)fpTurn(dx*0.006,dy*0.005)}
  else{orbitYaw-=dx*0.006;orbitPitch=clamp(orbitPitch+dy*0.005,camPitchMin(),camPitchMax())}});
const dend=e=>{camPtrs.delete(e.pointerId);if(camPtrs.size<2)pinch=0;if(drag&&e.pointerId===drag.id)drag=null};
// with blocks on, a left click on the scene (not a drag) sets a block, in Dig or Walk mode and either view (the click
// that takes the mouse in cab view sets one too; once it is taken, pointerdown above does it)
canvas.addEventListener('pointerup',e=>{const d=drag;if(!d||e.pointerId!==d.id||!d.mouse||d.btn!==0||d.locked||!blkOn||edOn)return;
  if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<6&&performance.now()-d.t0<400&&(mode==='dig'||mode==='walk'))placeBlock()});
canvas.addEventListener('pointerup',dend);canvas.addEventListener('pointercancel',dend);
canvas.addEventListener('wheel',e=>{if(edOn)return;e.preventDefault();
  // in first person on foot with blocks on, the wheel pushes the block out and pulls it back instead of zooming
  if(blkOn&&blkFP()){blkReachBy(-e.deltaY*(e.deltaMode?0.67:0.02));return}
  if(camMode==='cab')fpl.zt=clamp(fpl.zt*Math.exp(-e.deltaY*0.0015),1,FP_ZOOM);else camDist=clamp(camDist*Math.exp(e.deltaY*(camFree?0.0012:0.001)),camDistMin(),camDistMax())},{passive:false});
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
    if(!fpLockTold){fpLockTold=true;toast(say('mouseLook'),'',4200)}}
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
  const sv={lh,lv,rh,rv},cap=id=>{const h=say(id,sv,true);return h.includes('<br>')?h:h+'<br>&nbsp;'},kb=m==='mow'&&kbUsed?'Kb':'';
  if(m==='heavy'){const k=hvCur().k+(hvCur().hoe?'Hoe':'');$('#capL').innerHTML=cap('capL_'+k);$('#capR').innerHTML=cap('capR_'+k);return}
  $('#capL').innerHTML=cap('capL_'+(m==='dig'||m==='drive'||m==='mow'||m==='walk'||m==='skid'||m==='boat'||m==='bike'?m+kb:'truck'));
  $('#capR').innerHTML=cap('capR_'+(m==='truck'||m==='mow'||m==='walk'||m==='skid'||m==='boat'||m==='bike'?m+kb:'dig'));}
// the excavator's Drive / Dig switch (over the right stick while you are in it): flips between driving the tracks and
// running the arm; exLast is the one you were last in, which Excavator in the Drive list goes back to
let exLast='dig';
// (in the backhoe it swivels the seat between the wheel and the hoe, backhoe.js)
const bhIn=()=>mode==='heavy'&&!!hvCur().K.hoe;
function exSwap(){if(bhIn()){bhSwap();return}if(mode!=='dig'&&mode!=='drive')return;setMode(mode==='dig'?'drive':'dig');toast(say(mode==='drive'?'exDriving':'exDigging'),'',2200)}
function setMode(m){if(m===mode)return;
  // no room to climb out: stay in the machine, as Get out does (seatToggle), rather than turn up where you got in
  if(m==='walk'&&wk.inside&&!wkPlaceOut(wk.inside)){toast(say('noRoomOut'));return}
  mode=m;setTurnSens();const ex=m==='dig'||m==='drive';if(ex)exLast=m;$('#exSwitch').hidden=!ex&&!bhIn();
  $('#exDrive').setAttribute('aria-pressed',m==='drive');$('#exDig').setAttribute('aria-pressed',m==='dig');bhSwitch();$('#modeDig').setAttribute('aria-pressed',ex);
  for(const [id,k] of [['#modeDrive','drive'],['#modeTruck','truck'],['#modeMow','mow'],['#modeSkid','skid'],['#modeWalk','walk']])$(id).setAttribute('aria-pressed',m===k);
  $('#walkBtns').hidden=m!=='walk';if(m!=='walk'){setSprint(false);trimSet(false)}
  // switching to Walk from a machine you climbed into sets you down beside it
  if(m==='walk'){wk.inside=null;wk.view=wk.yaw}
  setCaps();markTile();firstCam=true;fpReset();if(m==='mow'&&!lawn.startT&&!lawn.done)toast(say(kbUsed?'mowKb':'mowTouch'),'',3800);
  if(m==='skid')toast(say(kbUsed?'skidKb':'skidTouch'),'',4200);
  if(m==='boat')toast(say('boatTip'),'',4200);
  if(m==='bike')toast(say('bikeTip'),'',4200);
  if(m==='heavy')toast(say(hvCur().k+'Tip'),'',5200);
  if(m==='walk')toast(say(padUsed?'walkPad':kbUsed?'walkKb':'walkTouch'),'',3800)}
$('#modeDig').onclick=()=>setMode(exLast);$('#exDrive').onclick=()=>{if(mode==='dig'||bhIn()&&hvCur().hoe)exSwap()};$('#exDig').onclick=()=>{if(mode==='drive'||bhIn()&&!hvCur().hoe)exSwap()}; $('#modeDrive').onclick=()=>setMode('drive'); $('#modeTruck').onclick=()=>setMode('truck'); $('#modeMow').onclick=()=>setMode('mow'); $('#modeSkid').onclick=()=>setMode('skid'); $('#modeWalk').onclick=()=>setMode('walk');
// Chase, then Cab, then Orbit, then back to Chase
function camSet(m,free){camMode=m;camFree=!!free&&m==='chase';camBase=null;fpReset();
  if(!camFree){camDist=clamp(camDist,5,22);orbitPitch=clamp(orbitPitch,0.08,1.3)}$('#camBtn').dataset.cam=camMode==='cab'?'cab':camFree?'orbit':'chase';
  if(camFree&&!camSet.told){camSet.told=true;toast(say('orbitTip'),'',4200)}}
$('#camBtn').onclick=()=>{if(camMode==='cab')camSet('chase',true);else if(camFree)camSet('chase',false);else camSet('cab')};
// Drive (top right) drops the machine list; picking one, or tapping the scene, closes it
function showCtl(on){$('#ctlMenu').hidden=!on;$('#ctlBtn').setAttribute('aria-expanded',on)}
$('#ctlBtn').onclick=()=>{showCtl($('#ctlMenu').hidden);showMenu(false)};
$('#ctlMenu').addEventListener('click',e=>{if(e.target.closest('button'))showCtl(false)});
$('#ctrlsBtn').onclick=()=>{showCtrls(true);showCtl(false);showMenu(false)};
let resetArm=0;
$('#resetBtn').onclick=()=>{const b=$('#resetBtn');
  if(resetArm&&performance.now()-resetArm<2500){tileReset();resetState();siteSaveAll();resetArm=0;b.textContent='Reset';b.classList.remove('arm');toast(say('reset'),'good');return}
  resetArm=performance.now();b.textContent='Tap again';b.classList.add('arm');
  setTimeout(()=>{if(resetArm&&performance.now()-resetArm>=2400){resetArm=0;b.textContent='Reset';b.classList.remove('arm')}},2500);};
const help=$('#help');
$('#helpBtn').onclick=()=>{help.hidden=false;showMenu(false)};
$('#soundBtn').onclick=()=>{showSound(true);showMenu(false)};
$('#keysBtn').onclick=()=>{showKeys(true);showMenu(false)};
function showMenu(on){const m=$('#menu');m.hidden=!on;$('#menuBtn').setAttribute('aria-expanded',on);if(on)menuFit()}
// the menu's top in its own (zoomed) pixels, so its height limit (game.css) keeps it inside the window at any UI size
function menuFit(){const m=$('#menu');if(m.hidden)return;const r=m.getBoundingClientRect(),z=r.height/(m.offsetHeight||1)||1;m.style.setProperty('--mtop',Math.ceil(r.top/z)+'px')}
addEventListener('resize',menuFit);
$('#menuBtn').onclick=()=>{showMenu($('#menu').hidden);showCtl(false)};
$('#view').addEventListener('pointerdown',()=>{showMenu(false);showCtl(false)});
let uiScale=1;
function setUiScale(v){uiScale=+v||1;const h=$('#hud');h.style.setProperty('--s',uiScale);h.style.setProperty('--ms',Math.min(uiScale,1.5));h.style.setProperty('--cs',Math.min(uiScale,1.3));h.classList.toggle('lg',uiScale>1.2);menuFit();
  document.querySelectorAll('.sizes button[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===uiScale));try{localStorage.setItem('bhd_ui',uiScale)}catch(e){}}
document.querySelectorAll('.sizes button[data-s]').forEach(b=>b.onclick=()=>setUiScale(b.dataset.s));
try{setUiScale(localStorage.getItem('bhd_ui')||1)}catch(e){setUiScale(1)}
// turn sensitivity (above the left stick): scales the left / right input of the mode you are in, swing, tracks, steering,
// the mower's spin and looking round on foot, from 25% to 200%. Each mode keeps its own (the mower starts at 60%, the
// rest at 100%), saved on this device once moved. The slider sits in the Controls panel
const TURN_DEF={mow:60},TURN_NAME={dig:'Dig',drive:'Drive',truck:'Truck',mow:'Mow',skid:'Skid',walk:'Walk',boat:'Boat',bike:'Bike',heavy:'Heavy'},turnPct={};let turnSens=1;const turnSl=$('#turnSl'),turnBtn=$('#turnBtn');
try{Object.assign(turnPct,JSON.parse(localStorage.getItem('bhd_turnM')||'{}'))}catch(e){}
// shows the current mode's setting; with v, sets it
function setTurnSens(v){if(v!==undefined)turnPct[mode]=clamp(Math.round(+v/5)*5||100,25,200);
  const p=turnPct[mode]||TURN_DEF[mode]||100;turnSens=p/100;turnSl.value=p;turnBtn.textContent=`${p}% · ${TURN_NAME[mode]||mode}`}
setTurnSens();
turnSl.oninput=()=>{setTurnSens(turnSl.value);try{localStorage.setItem('bhd_turnM',JSON.stringify(turnPct))}catch(e){}};
// let go of the slider so the arrow keys drive again
turnSl.onchange=()=>turnSl.blur();
const statusEl=$('#status');try{statusEl.classList.toggle('min',localStorage.getItem('bhd_hudmin')==='1')}catch(e){}
statusEl.onclick=()=>{const m=statusEl.classList.toggle('min');try{localStorage.setItem('bhd_hudmin',m?'1':'0')}catch(e){}};
// the start card: tap a machine (or On foot) to start in that mode; tapping outside the card keeps the current one
function startIn(m){setMode(m);help.hidden=true;try{localStorage.setItem('bhd_seen','1')}catch(e){}}
// the island to start on (remembered): Corley's leaves you where you are; Dexter's or Jessica's takes you there in what
// you picked (startOn, maps.js)
let startIsl='corley';try{const v=localStorage.getItem('bhd_startIsl');if(v==='dexter'||v==='jessica')startIsl=v}catch(e){}
const islBtns=[...document.querySelectorAll('#startIsl [data-isl]')];
function markIsl(){for(const b of islBtns)b.setAttribute('aria-pressed',b.dataset.isl===startIsl)}
for(const b of islBtns)b.onclick=()=>{startIsl=b.dataset.isl;try{localStorage.setItem('bhd_startIsl',startIsl)}catch(e){}markIsl()};
markIsl();
// each tile is a ride (a WK_RIDES key, or 'foot'); a kind there are several of (data-k 'boat', or 'hv:dozer' and the
// like for the heavy machines on Corley's and Dexter's) means the one nearest the island picked
const tiles=[...document.querySelectorAll('.tile')];
const rideKind=k=>!k?'':k.startsWith('boat')?'boat':/^hv\d/.test(k)?'hv:'+hvs[+k.slice(2)].k:k;
function tileRide(t){const k=t.dataset.k;if(!k)return t.dataset.m==='walk'?'foot':rideOf(t.dataset.m);
  const [x,z]=START_ISL[startIsl]||[0,0];let best=null,bd=1e9;
  for(const r in WK_RIDES)if(rideKind(r)===k){const o=WK_RIDES[r].o,d=Math.hypot(o.x-x,o.z-z);if(d<bd){bd=d;best=r}}
  return best}
for(const t of tiles)t.onclick=()=>{const k=tileRide(t);if(!k)return;
  if(k==='foot')startIn('walk');else{const R=WK_RIDES[k];wk.inside=k;walker.visible=false;if(R.pick)R.pick();firstCam=true;startIn(R.m)}
  if(startIsl!=='corley')startOn(startIsl,k)};
function markTile(){const r=mode==='walk'?'foot':rideKind(wk.inside||rideOf(mode));
  for(const t of tiles)t.setAttribute('aria-pressed',(t.dataset.k||(t.dataset.m==='walk'?'foot':rideOf(t.dataset.m)))===r)}
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
