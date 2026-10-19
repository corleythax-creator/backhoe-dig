// Corley's Island: VR on a WebXR headset (Meta Quest 3 in its browser). The camera sits in a rig; the game puts the rig
// at the seat (or the worker's eyes) each frame and the headset turns and moves your head inside it. The page's HUD is
// not drawn in a headset, so a dashboard panel in the rig stands in for it. The Touch controllers are a game controller:
// sticks as on a pad, triggers gas / reverse, B gets in and out, X next machine, A jumps (on foot) or flips the
// excavator between Drive and Dig, right grip sprints, left grip hooks the trench box, right stick click hides the
// panel, Y leaves VR. Right stick left / right turns you in 30° steps on foot.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const rig=new THREE.Group();rig.add(camera);scene.add(rig);
const vr={fake:false,mode:'',cam:'chase',gfx:null,yaw:0,snap:0,btn:{},panel:true,acc:1,headYaw:0};
const vrOn=()=>renderer.xr.isPresenting||vr.fake;
// the dashboard: a canvas on a panel low in front of you, like the gauges on a dash
const vrHud=(()=>{const c=document.createElement('canvas');c.width=1024;c.height=420;
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.205),new THREE.MeshBasicMaterial({map:t,transparent:true,depthTest:false,depthWrite:false,fog:false,toneMapped:false}));
  m.position.set(0,-0.42,-0.7);m.rotation.x=-0.55;m.renderOrder=20;m.frustumCulled=false;m.visible=false;rig.add(m);
  return {m,x:c.getContext('2d'),t}})();
const VR_NAMES={dig:'Excavator · Dig',drive:'Excavator · Drive',truck:'Dump truck',mow:'Mower',skid:'Skid steer',walk:'On foot',boat:'Boat',bike:'Dirt bike'};
function vrDraw(){const x=vrHud.x,W=1024,H=420,txt=s=>$(s).textContent;
  x.clearRect(0,0,W,H);x.fillStyle='rgba(14,17,20,.82)';x.beginPath();x.moveTo(30,6);x.arcTo(W-6,6,W-6,H-6,30);x.arcTo(W-6,H-6,6,H-6,30);x.arcTo(6,H-6,6,6,30);x.arcTo(6,6,W-6,6,30);x.fill();
  x.textAlign='center';x.textBaseline='middle';const font=(px,w)=>{x.font=`${w||700} ${px}px system-ui, sans-serif`};
  const te=$('#toastText'),msg=te.classList.contains('show')?te.textContent:'';
  x.fillStyle='#ffb347';font(54);x.fillText(mode==='heavy'?hvCur().K.n.replace(/^./,c=>c.toUpperCase()):VR_NAMES[mode]||mode,W/2,58);
  x.fillStyle='#fff';font(40,600);
  const rows=mode==='mow'?[txt('#mowVal'),'Lawn '+txt('#lawnVal')]:mode==='truck'?[txt('#haulVal'),'Bed '+txt('#truckVal')]:mode==='skid'?[txt('#tipVal'),'Bucket '+txt('#bucketVal')]:
    mode==='dig'||mode==='drive'?[txt('#tipVal'),'Bucket '+txt('#bucketVal')+' · Trench '+txt('#trenchVal')]:[txt('#trenchVal')?'Trench '+txt('#trenchVal'):'',txt('#gasVal')];
  rows.forEach((r,i)=>x.fillText(r,W/2,140+i*62,W-60));
  x.fillStyle=msg?'#9fe08a':'#c8d0d8';font(msg?40:36,600);
  x.fillText(msg||say(mode==='walk'?'vrHintWalk':mode==='dig'||mode==='drive'?'vrHintEx':'vrHintRide'),W/2,H-62,W-50);
  vrHud.t.needsUpdate=true}
// Touch controllers into the controller axes (PA, controls.js); called after pollPad each frame
function vrPoll(){const s=renderer.xr.getSession();if(!s)return;
  const dz=v=>Math.abs(v)<0.15?0:(v-Math.sign(v)*0.15)/0.85;let used=false,trig=0;
  for(const src of s.inputSources){const gp=src.gamepad,h=src.handedness;if(!gp||(h!=='left'&&h!=='right'))continue;
    const a=gp.axes,b=gp.buttons,ax=dz(a[2]||0),ay=-dz(a[3]||0),on=i=>!!(b[i]&&b[i].pressed);
    if(h==='left'){PA.lx=clamp(PA.lx+ax,-1,1);PA.ly=clamp(PA.ly+ay,-1,1);trig-=b[0]?b[0].value:0}
    else{
      // on foot the right stick turns you in steps (smooth turning is what makes people sick) and does not tilt the view
      if(mode==='walk'){if(Math.abs(ax)>0.7&&!vr.snap){vr.snap=Math.sign(ax);vr.yaw-=vr.snap*Math.PI/6}else if(Math.abs(ax)<0.3)vr.snap=0}
      else{PA.rx=clamp(PA.rx+ax,-1,1);PA.ry=clamp(PA.ry+ay,-1,1)}
      trig+=b[0]?b[0].value:0;PA.sprint=PA.sprint||on(1)}
    if(ax||ay||on(0))used=true;
    for(let i=1;i<6;i++){const k=h+i,p=on(i);if(p&&!vr.btn[k]){used=true;vrButton(h,i)}vr.btn[k]=p}}
  PA.thr=clamp(PA.thr+trig,-1,1);
  if(used)usePad()}
function vrButton(h,i){
  if(h==='right'&&i===5)seatToggle();
  else if(h==='right'&&i===4){if(mode==='walk')walkJump();else exSwap()}
  else if(h==='right'&&i===3)vr.panel=!vr.panel;
  else if(h==='left'&&i===4)setMode(MODES[(MODES.indexOf(mode)+1)%MODES.length]);
  else if(h==='left'&&i===1)hookBox();
  else if(h==='left'&&i===5){const s=renderer.xr.getSession();if(s)s.end()}}
function vrRumble(ms,mag){const s=renderer.xr.getSession();if(!s)return;
  for(const src of s.inputSources){const a=src.gamepad&&src.gamepad.hapticActuators&&src.gamepad.hapticActuators[0];if(a&&a.pulse)try{a.pulse(mag,ms)}catch(e){}}}
// after the game has placed the camera at the seat: move the rig there and let the headset do the looking
function vrFrame(dt){
  if(camMode!=='cab'){camMode='cab';fpReset()}
  fpl.yaw=fpl.pitch=0;fpl.zt=fpl.zoom=1;shake=0;
  if(vr.mode!==mode){vr.mode=mode;vr.yaw=vr.headYaw=wk.view}
  const p=camera.position;rig.position.copy(p);
  // on foot your body turns with the snap turns and walks the way your head faces; in a machine you face its way
  if(mode==='walk'){rig.rotation.set(0,vr.yaw+Math.PI,0);wk.view=vr.headYaw}
  else rig.rotation.set(0,Math.atan2(look.x-p.x,look.z-p.z)+Math.PI,0);
  rig.updateMatrixWorld();
  vrHud.m.visible=vr.panel;if(vr.panel&&(vr.acc+=dt)>0.15){vr.acc=0;vrDraw()}}
// after the frame is drawn the camera holds the head's pose in the rig: give the game its place in the world back
function vrAfter(){camera.matrixWorld.decompose(camera.position,camera.quaternion,camera.scale);
  const f=tmp.set(0,0,-1).applyQuaternion(camera.quaternion);if(Math.hypot(f.x,f.z)>0.05)vr.headYaw=Math.atan2(f.x,f.z)}
// headless checks (vr.fake): a head at the rig's middle, looking a little down, as the headset would put it
function vrFakeHead(){camera.position.set(0,0,0);camera.rotation.set(-0.3,0,0)}
function vrReset(){rig.position.set(0,0,0);rig.rotation.set(0,0,0);rig.updateMatrixWorld();vrHud.m.visible=false}
async function enterVR(){showMenu(false);
  // a headset draws every frame twice at 72-90 fps: VR plays on Low graphics, and the setting comes back after
  let s;try{s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['hand-tracking']})}catch(e){toast(say('vrFail'),'bad');return}
  vr.cam=camMode;vr.gfx=gfxKey;vr.mode='';if(gfxKey!=='low')setGfx('low');
  s.addEventListener('end',()=>{vrReset();camMode=vr.cam;fpReset();if(vr.gfx&&vr.gfx!==gfxKey)setGfx(vr.gfx);viewDirty=true;firstCam=true});
  await renderer.xr.setSession(s);started();toast(say('vrIn'),'good',6000)}
$('#vrBtn').onclick=enterVR;
if(navigator.xr&&navigator.xr.isSessionSupported)navigator.xr.isSessionSupported('immersive-vr').then(ok=>{$('#vrBtn').hidden=!ok}).catch(()=>{});
