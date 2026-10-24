// Corley's Island: VR on a WebXR headset (Meta Quest 3 in its browser). The camera sits in a rig; the game puts the rig
// at the seat (or the worker's eyes) each frame and the headset turns and moves your head inside it. The page's HUD is
// not drawn in a headset, so a dashboard panel in the rig stands in for it. The Touch controllers are a game controller:
// sticks as on a pad, triggers gas / reverse, B gets in and out, X next machine, A jumps (on foot) or flips the
// excavator between Drive and Dig, right grip sprints, left grip hooks the trench box, right stick click hides the
// panel, Y leaves VR. Right stick left / right turns you on foot: smoothly at the VR turn speed (TUNE vrTurn), or in
// 30° steps when that is 0.
// Looks: where the browser has WebXR layers (the Quest's own) the dashboard is its own headset layer, drawn by the
// headset straight from its picture, so its text stays sharp; elsewhere it is a panel in the scene, drawn at twice the
// size. Work gloves follow the controllers and take hold of the excavator's joysticks when you reach for them. Through a
// PC the eye buffer is supersampled on High and Ultra (vrSS, gfx.js) at the highest refresh rate offered. The view
// darkens at its edges while you drive fast or turn (TUNE vrComfort), the motion your inner ear does not feel. The
// near clip sits farther out than on a screen (VR_NEAR): a headset's depth buffer can be coarser than a screen's, and at
// the screen's 2 in, trim and panels a few mm off a machine's body flickered in stripes through it (PC VR).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const rig=new THREE.Group();rig.add(camera);scene.add(rig);
const vr={fake:false,mode:'',cam:'chase',gfx:null,yaw:0,snap:0,btn:{},panel:true,acc:1,headYaw:0,hudKey:'',turn:0,quad:null,proj:null,quadOn:false,quadDirty:false,lp:new THREE.Vector3(),ly:0,motion:0};
const vrOn=()=>renderer.xr.isPresenting||vr.fake;
// the near clip in m, on foot and seated (in a cab the walls and glass are close by): depth resolves 5 and 2 times finer
// than at the screen's camera.near, which comes back when you leave
const VR_NEAR={walk:0.25,seat:0.1},CAM_NEAR=camera.near;
function vrNear(n){if(camera.near!==n){camera.near=n;camera.updateProjectionMatrix()}}
// the dashboard: a canvas on a panel low in front of you, like the gauges on a dash
// (the canvas is twice the size it is drawn at, for sharp text; as a scene panel it is mipmapped and filtered at a slant)
const vrHud=(()=>{const c=document.createElement('canvas');c.width=2048;c.height=840;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const m=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.205),new THREE.MeshBasicMaterial({map:t,transparent:true,depthTest:false,depthWrite:false,fog:false,toneMapped:false}));
  m.position.set(0,-0.42,-0.7);m.rotation.x=-0.55;m.renderOrder=20;m.frustumCulled=false;m.visible=false;rig.add(m);
  const x=c.getContext('2d');x.scale(2,2);return {m,x,t,c}})();
const VR_NAMES={dig:'Excavator · Dig',drive:'Excavator · Drive',truck:'Dump truck',mow:'Mower',skid:'Skid steer',walk:'On foot',boat:'Boat',bike:'Dirt bike'};
function vrDraw(){const x=vrHud.x,W=1024,H=420,txt=s=>$(s).textContent;
  const te=$('#toastText'),msg=te.classList.contains('show')?te.textContent:'';
  const rows=mode==='mow'?[txt('#mowVal'),'Lawn '+txt('#lawnVal')]:mode==='truck'?[txt('#haulVal'),'Bed '+txt('#truckVal')]:mode==='skid'?[txt('#tipVal'),'Bucket '+txt('#bucketVal')]:
    mode==='dig'||mode==='drive'?[txt('#tipVal'),'Bucket '+txt('#bucketVal')+' · Trench '+txt('#trenchVal')]:[txt('#trenchVal')?'Trench '+txt('#trenchVal'):'',txt('#gasVal')];
  // a texture upload costs the headset a frame: draw and send it only when what it shows has changed
  const key=mode+'|'+(mode==='heavy'?hvCur().K.n:'')+'|'+rows.join('|')+'|'+msg;if(key===vr.hudKey)return;vr.hudKey=key;
  x.clearRect(0,0,W,H);x.fillStyle='rgba(14,17,20,.82)';x.beginPath();x.moveTo(30,6);x.arcTo(W-6,6,W-6,H-6,30);x.arcTo(W-6,H-6,6,H-6,30);x.arcTo(6,H-6,6,6,30);x.arcTo(6,6,W-6,6,30);x.fill();
  x.textAlign='center';x.textBaseline='middle';const font=(px,w)=>{x.font=`${w||700} ${px}px system-ui, sans-serif`};
  x.fillStyle='#ffb347';font(54);x.fillText(mode==='heavy'?hvCur().K.n.replace(/^./,c=>c.toUpperCase()):VR_NAMES[mode]||mode,W/2,58);
  x.fillStyle='#fff';font(40,600);
  rows.forEach((r,i)=>x.fillText(r,W/2,140+i*62,W-60));
  x.fillStyle=msg?'#9fe08a':'#c8d0d8';font(msg?40:36,600);
  x.fillText(msg||say(mode==='walk'?'vrHintWalk':mode==='dig'||mode==='drive'?'vrHintEx':'vrHintRide'),W/2,H-62,W-50);
  if(vr.quad)vr.quadDirty=true;else vrHud.t.needsUpdate=true}
// Touch controllers into the controller axes (PA, controls.js); called after pollPad each frame
function vrPoll(){const s=renderer.xr.getSession();if(!s)return;
  const dz=v=>Math.abs(v)<0.15?0:(v-Math.sign(v)*0.15)/0.85;let used=false,trig=0;
  for(const src of s.inputSources){const gp=src.gamepad,h=src.handedness;if(!gp||(h!=='left'&&h!=='right'))continue;
    const a=gp.axes,b=gp.buttons,ax=dz(a[2]||0),ay=-dz(a[3]||0),on=i=>!!(b[i]&&b[i].pressed);
    if(h==='left'){PA.lx=clamp(PA.lx+ax,-1,1);PA.ly=clamp(PA.ly+ay,-1,1);trig-=b[0]?b[0].value:0}
    else{
      // on foot the right stick turns you (smoothly, eased in on the stick, or in steps for those it makes sick) and does not tilt the view
      if(mode==='walk'){vr.turn=ax;if(TU.vrTurn>0)vr.snap=0;
        else if(Math.abs(ax)>0.7&&!vr.snap){vr.snap=Math.sign(ax);vr.yaw-=vr.snap*Math.PI/6}else if(Math.abs(ax)<0.3)vr.snap=0}
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
  vrNear(mode==='walk'?VR_NEAR.walk:VR_NEAR.seat);
  const p=camera.position;rig.position.copy(p);
  // on foot your body turns with the snap turns and walks the way your head faces; in a machine you face its way
  if(mode==='walk'){if(TU.vrTurn>0&&vr.turn){const t=vr.turn*Math.abs(vr.turn);vr.yaw-=t*TU.vrTurn*dt;vr.headYaw-=t*TU.vrTurn*dt}
    rig.rotation.set(0,vr.yaw+Math.PI,0);wk.view=vr.headYaw}
  else rig.rotation.set(0,Math.atan2(look.x-p.x,look.z-p.z)+Math.PI,0);
  rig.updateMatrixWorld();
  if(vr.quad){vrHud.m.visible=false;vrQuadShow(vr.panel)}else vrHud.m.visible=vr.panel;
  if(vr.panel&&(vr.acc+=dt)>0.15){vr.acc=0;vrDraw()}
  if(vr.quad&&vr.quadOn&&(vr.quadDirty||vr.quad.needsRedraw))vrQuadUpload();
  vrHandsTick();vrComfortTick(dt)}
// after the frame is drawn the camera holds the head's pose in the rig: give the game its place in the world back
function vrAfter(){camera.matrixWorld.decompose(camera.position,camera.quaternion,camera.scale);
  const f=tmp.set(0,0,-1).applyQuaternion(camera.quaternion);if(Math.hypot(f.x,f.z)>0.05)vr.headYaw=Math.atan2(f.x,f.z)}
// headless checks (vr.fake): a head at the rig's middle, looking a little down, as the headset would put it
function vrFakeHead(){camera.position.set(0,0,0);camera.rotation.set(-0.3,0,0)}
function vrReset(){vrNear(CAM_NEAR);rig.position.set(0,0,0);rig.rotation.set(0,0,0);rig.updateMatrixWorld();vrHud.m.visible=false;vrVig.visible=false;
  vr.quad=vr.proj=null;vr.quadOn=false;for(const h of vrHands)h.glove.visible=false}
// ---------- the dashboard as a headset layer ----------
// The layer sits in the headset's own space, which is the rig's (the headset's poses are in it), so it stays where the
// panel would be. Its picture is the panel's canvas, sent when it changes.
function vrQuadMake(s){vr.quad=null;vr.quadOn=false;
  try{const b=renderer.xr.getBinding(),sp=renderer.xr.getReferenceSpace();
    if(!b||!b.createQuadLayer||!s.renderState.layers||!s.renderState.layers.length||typeof XRRigidTransform==='undefined')return;
    const m=vrHud.m,q=new THREE.Quaternion().setFromEuler(m.rotation),w=m.geometry.parameters;
    vr.proj=s.renderState.layers[0];
    // (width and height are half the quad's size, as three.js gives them)
    vr.quad=b.createQuadLayer({space:sp,viewPixelWidth:vrHud.c.width,viewPixelHeight:vrHud.c.height,layout:'mono',width:w.width/2,height:w.height/2,clearOnAccess:false,
      transform:new XRRigidTransform({x:m.position.x,y:m.position.y,z:m.position.z},{x:q.x,y:q.y,z:q.z,w:q.w})});
    vr.quadDirty=true}catch(e){vr.quad=null}}
function vrQuadShow(on){if(on===vr.quadOn)return;const s=renderer.xr.getSession();if(!s||!vr.proj)return;
  try{s.updateRenderState({layers:on?[vr.proj,vr.quad]:[vr.proj]});vr.quadOn=on}catch(e){vr.quad=null}}
function vrQuadUpload(){const f=renderer.xr.getFrame(),b=renderer.xr.getBinding();if(!f||!b)return;
  try{const sub=b.getSubImage(vr.quad,f),gl=renderer.getContext();
    gl.bindTexture(gl.TEXTURE_2D,sub.colorTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,vrHud.c);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.bindTexture(gl.TEXTURE_2D,null)}catch(e){}
  // three.js keeps its own record of the GL state: start it afresh after touching it
  renderer.resetState();vr.quadDirty=false}
// ---------- work gloves ----------
// A gloved fist round a rod, in the controller's grip frame (WebXR: -z along the rod toward the thumb, +y toward the
// arm, the back of the right hand toward +x); the left glove is the same mirrored. Within reach of an excavator
// joystick the glove takes hold of it and moves with it.
const VR_GLOVE=M(0x9a7444,{flatShading:false,shininess:10}),VR_CUFF=M(0x5a4128,{flatShading:false,shininess:6});
function vrGlove(){const g=new THREE.Group(),add=(geo,mat,x,y,z,rz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.z=rz||0;m.castShadow=true;g.add(m)};
  // the back of the hand, from the knuckles toward the wrist
  add(new THREE.BoxGeometry(0.03,0.095,0.085),VR_GLOVE,0.043,0.035,-0.002);
  // index to little finger, curled from the knuckles round the far side of the rod back toward the palm
  for(const [z,r,t] of [[-0.03,0.036,0.0105],[-0.009,0.037,0.011],[0.012,0.036,0.0105],[0.031,0.033,0.009]])add(new THREE.TorusGeometry(r,t,8,16,3.65),VR_GLOVE,0,0,z,-4.19);
  // the thumb over the top of the rod, and the cuff
  add(new THREE.CapsuleGeometry(0.011,0.045,4,8),VR_GLOVE,0.008,0.012,-0.05,2.14);
  add(new THREE.CylinderGeometry(0.036,0.04,0.07,16),VR_CUFF,0.03,0.11,0);
  return g}
// the grip frame on a joystick: the rod up its stick, the arm back toward the seat
const VR_HOLD=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1),new THREE.Vector3(0,-1,0)));
const vrHands=[0,1].map(i=>{const grip=renderer.xr.getControllerGrip(i);rig.add(grip);const h={grip,side:'',glove:vrGlove()};h.glove.visible=false;scene.add(h.glove);
  grip.addEventListener('connected',e=>{h.side=e.data&&e.data.handedness||'';h.glove.scale.x=h.side==='left'?-1:1});
  grip.addEventListener('disconnected',()=>{h.side='';h.glove.visible=false});return h});
const vrJoyAt=new THREE.Vector3(),vrJoyQ=new THREE.Quaternion(),vrS=new THREE.Vector3();
function vrHandsTick(){const ex=mode==='dig'||mode==='drive';
  for(const h of vrHands){const on=vrOn()&&(h.side==='left'||h.side==='right')&&h.grip.visible;h.glove.visible=on;if(!on)continue;
    h.grip.updateMatrixWorld(true);h.grip.matrixWorld.decompose(h.glove.position,h.glove.quaternion,vrS);
    if(ex){const j=exJoy[h.side==='left'?0:1];j.updateMatrixWorld(true);vrJoyAt.copy(EX_JOY_GRIP).applyMatrix4(j.matrixWorld);
      if(h.glove.position.distanceTo(vrJoyAt)<0.25){h.glove.position.copy(vrJoyAt);h.glove.quaternion.copy(j.getWorldQuaternion(vrJoyQ)).multiply(VR_HOLD)}}}}
// ---------- comfort vignette ----------
// a ring of dark round the edge of the view, on the head, that closes in while the view is moved for you (driving,
// swinging, turning on foot) and opens again when it stops
const vrVig=(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{k:{value:0}},
  vertexShader:'varying vec2 vU;void main(){vU=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float k;varying vec2 vU;void main(){float r=length(vU);gl_FragColor=vec4(0.0,0.0,0.0,smoothstep(mix(0.9,0.3,k),mix(1.1,0.62,k),r)*min(1.0,k*2.0));}'}));
  m.position.z=-0.3;m.renderOrder=30;m.frustumCulled=false;m.visible=false;camera.add(m);return m})();
function vrComfortTick(dt){const d=Math.max(dt,1e-3),v=rig.position.distanceTo(vr.lp)/d;let w=rig.rotation.y-vr.ly;w=Math.abs(Math.atan2(Math.sin(w),Math.cos(w)))/d;
  vr.lp.copy(rig.position);vr.ly=rig.rotation.y;
  // a jump in place (getting in, a teleport) is not motion
  const t=v<40?clamp(Math.max((v-1.2)/8,(w-0.15)/1.2),0,1):0;vr.motion+=(t-vr.motion)*Math.min(1,dt*(t>vr.motion?6:2));
  const k=Math.min(1,vr.motion*TU.vrComfort*1.6);vrVig.visible=k>0.01;vrVig.material.uniforms.k.value=k}
async function enterVR(){showMenu(false);
  // a headset draws every frame twice at 72-90 fps. In the Quest's own browser the headset's chip draws it: VR plays on
  // its own level (Graphics, In VR; Quest unless picked), and the setting comes back after. Through a PC (Quest Link, Air
  // Link, Virtual Desktop, SteamVR) the PC draws it: the player's own Graphics setting stays, with no foveation, and High
  // and Ultra supersample the eye buffer
  const onQuest=IS_QUEST;
  let s;try{s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['hand-tracking','layers']})}catch(e){toast(say('vrFail'),'bad');return}
  vr.cam=camMode;vr.hudKey='';vr.gfx=gfxKey;vr.mode='';if(onQuest&&gfxKey!==vrGfxKey())setGfx(vrGfxKey());
  // smoothness (Quest): a slightly smaller eye buffer keeps every frame inside the headset's 72 Hz, so head turns never
  // drop frames (a dropped frame is the judder you feel when looking round). Sharpness (PC): the eye buffer drawn larger
  // than the headset's own and scaled down
  renderer.xr.setFramebufferScaleFactor(onQuest?0.9:gfxCur.vrSS||1);
  const fr=s.supportedFrameRates?[...s.supportedFrameRates]:[],want=onQuest?(fr.includes(72)?72:0):Math.max(0,...fr.filter(r=>r<=120));
  if(want&&s.updateTargetFrameRate)s.updateTargetFrameRate(want).catch(()=>{});
  s.addEventListener('end',()=>{vrReset();camMode=vr.cam;fpReset();if(vr.gfx&&vr.gfx!==gfxKey)setGfx(vr.gfx);viewDirty=true;firstCam=true});
  await renderer.xr.setSession(s);
  // foveated edges on the Quest's chip only (three.js turns it fully on as the session starts, so it is set after)
  if(renderer.xr.setFoveation)renderer.xr.setFoveation(onQuest?1:0);
  vr.lp.copy(rig.position);vr.motion=0;vrQuadMake(s);started();toast(say('vrIn'),'good',6000)}
$('#vrBtn').onclick=enterVR;
if(navigator.xr&&navigator.xr.isSessionSupported)navigator.xr.isSessionSupported('immersive-vr').then(ok=>{$('#vrBtn').hidden=!ok}).catch(()=>{});
