// Corley's Island: the Graphics setting (☰ menu, then Graphics): Low for phones, Medium for laptops, High for desktop PCs, Ultra for strong ones,
// and under them every setting on its own to play with. Each device keeps its own choice. The first time, it picks from
// the device: phones get Low, Intel graphics Medium, anything else High. Changing one setting makes it Custom: the preset
// with those changes on top (bhd_gfxc); picking a preset again clears them.
// Low is from the iPhone speed test (Oct 17): shadows, filmic lighting and ground detail each cost it 9-16 FPS.
// Only how things are drawn changes here, never what the ground does (CLAUDE.md).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// pr resolution cap, auto lower it when slow, fps frame cap (0 none), fov degrees added, sh shadow map (0 off), shR how far
// shadows reach either side of you in m (the same map spread wider, so softer), soft
// shadow edges, filmic lighting, exp brightness, tex texture size, base ground texture, detail cut faces, painted
// materials and machine grime, macro large-scale variation, pbr relief and wet sheen on materials that have those maps, aniso, tuftQ how finely the grass and weeds are shaped (0 Simple to 3 Best, scenery.js), tuft grass blades [amount, full-detail distance m,
// fade-out distance m, share kept far off], lawnFar lawn full detail within m, fog haze distance, wmFine fine puddle
// water, lakeQ the lake's ripples (0 two layers, 1 and rain rings, 2 and a fine close-up layer, lake.js), cloudQ the clouds' fine billows (0 off: half the sky's noise), treeR full-detail tree distance m, rainN raindrops, rainSp splashes where they land, splashN drops in a puddle splash, wakeN boat wake marks drawn, dirt the Dirt detail it sets when picked,
// ao bloom grade the screen effects (post.js), model the detailed machine models (models.js), brush the share of undergrowth
// drawn (brush.js), skyLight shade and reflections coloured by the sky as it is (and a sharper reflection map), shSoft
// contact-hardening sun shadows, wetDrops beads and runs of rain on the machines and their cab glass, wetGround soaked ground mirroring the sky (all four Ultra, post.js)
const GFX={
  low:{name:'Low',trimClips:1,pr:1.5,auto:true,fps:0,fov:0,sh:1024,shR:22,soft:false,filmic:false,exp:1,tex:'low',detail:0,base:1,macro:false,pbr:false,aniso:4,dirt:1,lawnFar:0,fog:1,wmFine:false,cloudQ:0,rainN:600,rainSp:160,splashN:250,wakeN:140,brush:0.35,model:false,ao:false,bloom:false,grade:false,skyLight:false,shSoft:false,wetDrops:false,wetGround:false,lakeQ:0,treeR:45,tuftQ:0,tuft:[0.6,12,40,0.2]},
  med:{name:'Medium',trimClips:2,pr:1.5,auto:true,fps:0,fov:0,sh:2048,shR:32,soft:false,filmic:true,exp:1,tex:'med',detail:1,base:1,macro:false,pbr:false,aniso:8,dirt:2,lawnFar:15,fog:1,wmFine:true,cloudQ:1,rainN:1500,rainSp:400,splashN:600,wakeN:300,brush:0.7,model:true,ao:false,bloom:false,grade:false,skyLight:false,shSoft:false,wetDrops:false,wetGround:false,lakeQ:1,treeR:90,tuftQ:0,tuft:[0.85,18,60,0.3]},
  high:{name:'High',trimClips:4,pr:2,auto:true,fps:0,fov:0,sh:4096,shR:45,soft:true,filmic:true,exp:1,tex:'high',detail:1,base:1,macro:true,pbr:true,aniso:16,dirt:4,lawnFar:1e9,fog:1,wmFine:true,cloudQ:1,rainN:3000,rainSp:900,splashN:1200,wakeN:640,brush:1,model:true,ao:false,bloom:false,grade:false,skyLight:false,shSoft:false,wetDrops:false,wetGround:false,lakeQ:2,treeR:160,tuftQ:2,tuft:[1,25,80,0.35]}};
// Ultra: High with the screen effects (post.js) and trees in full detail farther out; for strong PC graphics only, never
// picked by itself
// the extra lamps: the warm light in Jessica's library and the boom's work light (Low keeps the glowing lamps only)
GFX.low.extraLt=false;GFX.med.extraLt=GFX.high.extraLt=true;
// two real spotlights from the placed lights nearest the camera (props.js); the glow and the pools of light are on every level
GFX.low.propLt=GFX.med.propLt=false;GFX.high.propLt=true;
GFX.ultra=Object.assign({},GFX.high,{name:'Ultra',tuftQ:3,ao:true,bloom:true,grade:true,treeR:220,skyLight:true,shSoft:true,wetDrops:true,wetGround:true});
// VR through a PC: the eye buffer drawn larger than the headset's own and scaled down (supersampling), for sharper edges
// and fine detail; only the levels for strong graphics do it
GFX.low.vrSS=GFX.med.vrSS=1;GFX.high.vrSS=1.25;GFX.ultra.vrSS=1.4;
// Quest: made for VR in the Meta Quest's own browser, where the headset's chip draws every frame twice at 72 Hz. Sharp
// shadows close round you (a small shadow area), the detailed machines, ground detail and filmic light kept, and what
// costs the most cut back: grass blades, undergrowth and full-detail trees only near you, a shorter haze so less is
// drawn far off, the plain puddle surface and fewer raindrops. Picked for you in the headset, never on a screen
GFX.quest=Object.assign({},GFX.med,{name:'Quest',pr:1,auto:false,sh:2048,shR:16,tex:'med',aniso:4,dirt:2,lawnFar:8,fog:0.7,wmFine:false,lakeQ:0,
  rainN:700,rainSp:180,splashN:260,wakeN:160,brush:0.3,model:true,treeR:50,tuft:[0.5,10,30,0.15],vrSS:0.9});
GFX.quest.extraLt=false;
// the bridges' detail parts: gusset and cover plates, lacing and lattice, braces, lamp trim, the covered bridge's
// lattice and rafters, batter piles (bridges.js); Low leaves them out
GFX.low.brDet=false;GFX.med.brDet=GFX.high.brDet=GFX.ultra.brDet=GFX.quest.brDet=true;
let gfxKey='high',gfxOver={},gfxCur=Object.assign({},GFX.high);
function gfxName(){return GFX[gfxKey].name+(Object.keys(gfxOver).length?' (custom)':'')}
function gfxGuess(){if(PHONE||IS_QUEST)return 'low';
  try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),r=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'';if(/intel/i.test(r))return 'med'}catch(e){}
  return 'high'}
// the Meta Quest's own browser draws VR on the headset's chip: it has its own level (bhd_vrq, Quest unless picked) that
// replaces the setting while in the headset; through a PC the player's setting stays
const IS_QUEST=/OculusBrowser|Quest/.test(navigator.userAgent);
function vrGfxKey(){let k=null;try{k=localStorage.getItem('bhd_vrq')}catch(e){}return k==='low'||k==='med'||k==='high'?k:'quest'}
function vrGfxPick(k){try{localStorage.setItem('bhd_vrq',k)}catch(e){}vrGfxSync()}
function vrGfxSync(){$('#vrGfxRow').hidden=!IS_QUEST;document.querySelectorAll('[data-vq]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.vq===vrGfxKey());b.onclick=()=>vrGfxPick(b.dataset.vq)})}
// the preset with the panel's changes on top, put into effect
function gfxApply(){const g=gfxCur=Object.assign({},GFX[gfxKey],gfxOver);
  // resolution cap (the auto resolution works under it); a preset stops at the screen's own, a picked one may go past it
  maxPR='pr' in gfxOver?g.pr:Math.min(devicePixelRatio||1,g.pr);pr=maxPR;viewDirty=true;
  // shadows: off, or the map size and filter
  sun.castShadow=g.sh>0;
  if(g.sh>0&&sun.shadow.mapSize.x!==g.sh){sun.shadow.mapSize.set(g.sh,g.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  const sc=sun.shadow.camera;if(sc.right!==g.shR){sc.left=sc.bottom=-g.shR;sc.right=sc.top=g.shR;sc.updateProjectionMatrix()}
  const st=THREE.PCFShadowMap;sun.shadow.radius=g.soft?1.5:1;
  // lighting: filmic, or a plain exposure that keeps about the same brightness for much less work per pixel
  const tm=g.filmic?THREE.ACESFilmicToneMapping:THREE.LinearToneMapping,te=(g.filmic?0.8:0.75)*g.exp;
  if(renderer.shadowMap.type!==st||renderer.toneMapping!==tm){renderer.shadowMap.type=st;renderer.toneMapping=tm;
    scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.needsUpdate=true})}
  renderer.toneMappingExposure=te;
  // ground detail: the cut-face detail, material library and machine grime (detail), and the grass and dirt textures (base)
  gfxDetail=g.detail;gfxBase=g.base;matU.texPbr.value=g.pbr?1:0;treePbr(g.pbr);shopPbr(g.pbr);
  // trees drawn with the full model out to this distance, the light one beyond (trees.js)
  if(treeNearR!==g.treeR){treeNearR=g.treeR;treeLodDirty=true}if(texOn){texMixU.value=gfxDetail;texBaseU.value=gfxBase;matTexUpdate()}
  // the ground pack's size, its filtering and the large-scale variation map (terrain.js)
  texTierSet(g.tex);texAnisoSet(g.aniso);macroSet(g.macro);
  // puddles: a finer water surface with sky reflections, or a 1 ft one without (water.js); the water itself is the same
  if(WM_K!==(g.wmFine?1:GRID_K))wmSet(g.wmFine);
  mudGfx(g.wmFine);
  // the lake: close-up ripples and rain rings (lake.js)
  lakeGfx(g.lakeQ);
  // the screen effects: shade where things meet, glow, colour grade (post.js)
  postGfx(g.ao,g.bloom,g.grade);
  // the warm light in Jessica's library (jessica.js) and the boom's work light (daynight.js)
  jesLightGfx(g.extraLt);dnBoomGfx(g.extraLt);if(typeof propLampGfx==='function')propLampGfx(g.propLt);
  // sky lighting, soft sun shadows and rain on the machines (post.js)
  ultraGfx(g.skyLight,g.shSoft&&g.sh>0,g.wetDrops,g.wetGround);
  // machine models: the detailed one from its file, or the simple shapes (models.js)
  mdlGfx(g.model);
  // the bridges: their detail parts, pictures (not on Low) and relief (bridges.js)
  brGfx(g);
  // undergrowth round the trees (brush.js)
  brushGfx(g.brush);
  // how finely the grass and weeds are shaped (scenery.js)
  tuftQuality(g.tuftQ);
  // raindrops drawn (rain.js); the rain itself is the same
  rainGfx(g.rainN,g.rainSp);
  // drops in the splash when something goes through a puddle (mud.js); the puddle itself is the same
  splashGfx(g.splashN);
  // boat wake marks drawn (boats.js); the wakes themselves are the same
  if(typeof wakeGfx==='function')wakeGfx(g.wakeN);
  // field of view and haze (effects.js, rain.js)
  gfxFov=g.fov;gfxFog=g.fog;scene.fog.far=760*g.fog;if(typeof resize==='function')resize();
  if(typeof gfxPanelSync==='function')gfxPanelSync()}
// Ultra is for strong PCs: when a PC can't hold it (main.js counts the slow seconds), it goes to High once and says so;
// picking Ultra again keeps it (the guard rests until the page reloads)
let ultraLowN=0,ultraGuardOff=false;
function ultraGuard(f){ultraLowN=0;if(ultraGuardOff)return;ultraGuardOff=true;setGfx('high',true);toast(say('ultraSlow',{fps:f}),'bad')}
function setGfx(k,picked){gfxKey=GFX[k]?k:gfxGuess();if(picked&&gfxKey==='ultra'&&typeof ultraLowN!=='undefined')ultraLowN=0;
  if(picked){gfxOver={};try{localStorage.removeItem('bhd_gfxc')}catch(e){}}
  gfxApply();
  // dirt detail follows the setting when picked (or the first time), and stays its own setting after that
  let saved=null;try{saved=localStorage.getItem('bhd_dirt')}catch(e){}
  if(picked||saved===null)setDirtLevel(GFX[gfxKey].dirt,picked);
  if(picked){try{localStorage.setItem('bhd_gfx',gfxKey)}catch(e){}toast(say('gfx',{name:GFX[gfxKey].name}),'good')}}
// one setting changed in the panel (back to the preset's own value drops it from the changes)
function gfxSet(id,v){if(JSON.stringify(v)===JSON.stringify(GFX[gfxKey][id]))delete gfxOver[id];else gfxOver[id]=v;
  try{if(Object.keys(gfxOver).length)localStorage.setItem('bhd_gfxc',JSON.stringify(gfxOver));else localStorage.removeItem('bhd_gfxc')}catch(e){}
  gfxApply()}

// ---------- the panel ----------
// each row: id, label, a hint, and either choices [value, label] or a slider (min, max, step, how the value reads)
const FT_M=3.28084,onOff=[[true,'On'],[false,'Off']];
const GFX_ROWS=[
  ['Screen'],
  {id:'pr',label:'Resolution',hint:'Pixels drawn per screen dot. The biggest cost on phones.',opts:[[0.5,'0.5x'],[0.75,'0.75x'],[1,'1x'],[1.5,'1.5x'],[2,'2x'],[3,'3x']]},
  {id:'auto',label:'Auto resolution',hint:'Lowers the resolution by itself when the game slows down.',opts:onOff},
  {id:'fps',label:'Frame cap',hint:'30 saves battery and heat.',opts:[[30,'30'],[60,'60'],[0,'None']]},
  {id:'fov',label:'Field of view',hint:'How wide the camera sees.',min:-15,max:25,step:1,fmt:v=>`${Math.round(camFovBase()+v)}°`},
  ['Light and shadows'],
  {id:'sh',label:'Shadows',hint:'Shadow sharpness. Off is the biggest saving after resolution.',opts:[[0,'Off'],[512,'512'],[1024,'1024'],[2048,'2048'],[4096,'4096']]},
  {id:'shR',label:'Shadow distance',hint:'How far around you things cast shadows. Farther spreads the same shadow map wider, so edges get softer.',min:14,max:80,step:2,fmt:v=>`${Math.round(v*FT_M)} ft`},
  {id:'soft',label:'Soft shadow edges',opts:onOff},
  {id:'shSoft',label:'Soft sun shadows',hint:'Shadows sharp where things touch the ground and softer the farther they fall, like real sunlight. Costs a strong graphics card. Adjust on the screen editor\'s Tuning tab (Ultra).',opts:onOff},
  {id:'skyLight',label:'Sky lighting',hint:'Shade and reflections take their colour from the sky as it is: warm at sunrise and sunset, blue at dusk, grey in the rain.',opts:onOff},
  {id:'filmic',label:'Filmic lighting',hint:'Camera-like light and colour. Off is plainer and faster.',opts:onOff},
  {id:'exp',label:'Brightness',min:0.6,max:1.4,step:0.05,fmt:v=>`${Math.round(v*100)}%`},
  {id:'fog',label:'Haze distance',hint:'How far you see before the air turns hazy.',min:0.4,max:2,step:0.1,fmt:v=>`${(760*v*FT_M/5280).toFixed(1)} mi`},
  ['Screen effects'],
  {id:'ao',label:'Contact shade',hint:'Soft shade where things meet the ground and in hollows (ambient occlusion). Costs a strong graphics card.',opts:onOff},
  {id:'bloom',label:'Glow',hint:'A soft glow round the sun, lamps and bright glints.',opts:onOff},
  {id:'grade',label:'Colour grade',hint:'Camera-like contrast and colour, with slightly darker corners. Adjust them on the screen editor\'s Tuning tab (Screen effects).',opts:onOff},
  ['Textures'],
  {id:'tex',label:'Texture size',hint:'Ground and machine textures. Bigger is sharper and uses more memory.',opts:[['low','512'],['med','1024'],['high','2048']]},
  {id:'base',label:'Ground texture',hint:'Grass and dirt detail on the ground.',opts:[[1,'On'],[0,'Off']]},
  {id:'detail',label:'Extra detail',hint:'Cut dirt faces, painted materials and grime on the machines.',opts:[[1,'On'],[0,'Off']]},
  {id:'pbr',label:'Material relief',hint:'Painted gravel, brick, concrete and other materials show bumps and glints in the sun and in the rain. Adjust them on the screen editor\'s Tuning tab (Ground look).',opts:onOff},
  {id:'macro',label:'Ground variation',hint:'Large soft light and dark patches that hide the texture repeating.',opts:onOff},
  {id:'aniso',label:'Sharpness at an angle',hint:'Keeps far-off ground crisp (anisotropic filtering).',opts:[[1,'1x'],[2,'2x'],[4,'4x'],[8,'8x'],[16,'16x']]},
  ['Grass and scenery'],
  {id:'brush',label:'Undergrowth',hint:'Leafy shrubs round the trees.',opts:[[0,'Off'],[0.35,'Few'],[0.7,'Some'],[1,'Full']]},
  {id:'model',label:'Machine models',hint:'Detailed models (every machine and boat, the excavator with a full cab inside, the trench box and attachments, and the yards\' and towns\' cones, light towers, barriers, lamps, benches and tables) or the simple ones. Detailed downloads about 17 MB once.',opts:[[true,'Detailed'],[false,'Simple']]},
  {id:'treeR',label:'Tree detail distance',hint:'How far trees keep their full model of branches and leaves.',min:20,max:400,step:5,fmt:v=>`${Math.round(v*FT_M)} ft`},
  {id:'tuftQ',label:'Grass quality',hint:'How finely the grass and weeds are shaped: more blades, bent in more steps, finer leaves, petals and seed heads. Costs triangles.',opts:[[0,'Simple'],[1,'Good'],[2,'Fine'],[3,'Best']]},
  {id:'tuftA',label:'Grass blades',hint:'How many blades are drawn. The main triangle cost.',min:0,max:1,step:0.05,fmt:v=>`${Math.round(v*100)}%`},
  {id:'tuftR',label:'Grass distance',hint:'How far the blades reach before they thin out.',min:5,max:60,step:1,fmt:v=>`${Math.round(v*FT_M)} ft`},
  {id:'lawnFar',label:'Lawn full detail',hint:'The tall lawn is drawn simpler past this distance.',opts:[[0,'On it only'],[6,'20 ft'],[15,'50 ft'],[30,'100 ft'],[1e9,'All']]},
  ['Effects'],
  {id:'dirt',label:'Dirt detail',hint:'Clods, flying dirt and lumpy loads. 16x is for screenshots.',opts:[[1,'1x'],[2,'2x'],[4,'4x'],[16,'16x']]},
  {id:'lakeQ',label:'Lake water',hint:'Fine ripples close up and rain rings on the lake, or plainer water.',opts:[[0,'Simple'],[1,'Good'],[2,'Fine']]},
  {id:'wmFine',label:'Puddle water',hint:'Fine water with sky reflections, or simple.',opts:[[true,'Fine'],[false,'Simple']]},
  {id:'rainN',label:'Raindrops',opts:[[0,'Off'],[600,'600'],[1500,'1500'],[3000,'3000'],[6000,'6000']]},
  {id:'rainSp',label:'Rain splashes',hint:'Spray and spreading rings where the drops land near you.',opts:[[0,'Off'],[160,'160'],[400,'400'],[900,'900'],[1800,'1800']]},
  {id:'wetDrops',label:'Rain on machines',hint:'Beads of water on the machines\' paint and glass, running down the sides while it rains.',opts:onOff},
  {id:'wetGround',label:'Wet ground shine',hint:'Soaked dirt and mud shine with a film of water that mirrors the sky, most at a slant.',opts:onOff},
  {id:'splashN',label:'Puddle splash',opts:[[0,'Off'],[250,'250'],[600,'600'],[1200,'1200'],[2400,'2400']]},
  {id:'wakeN',label:'Boat wakes',opts:[[0,'Off'],[140,'140'],[300,'300'],[640,'640']]}];
function camFovBase(){return innerWidth<innerHeight?68:58}
// grass blades are one array in GFX; the panel shows its amount and distance, the fade-out distance follows
function gfxGet(id){const g=gfxCur;if(id==='tuftA')return g.tuft[0];if(id==='tuftR')return g.tuft[1];if(id==='dirt')return DIRT;return g[id]}
function gfxPut(id,v){if(id==='dirt'){setDirtLevel(v,true);gfxPanelSync();return}
  if(id==='tuftA'||id==='tuftR'){const t=gfxCur.tuft.slice(),p=GFX[gfxKey].tuft;if(id==='tuftA')t[0]=v;else{t[1]=v;t[2]=Math.round(v*p[2]/p[1])}gfxSet('tuft',t);return}
  gfxSet(id,v)}
const gfxBox=$('#gfxBox'),gfxList=$('#gfxList');
for(const r of GFX_ROWS){
  if(Array.isArray(r)){const h=document.createElement('h2');h.textContent=r[0];gfxList.appendChild(h);continue}
  const row=document.createElement('div');row.className='grow';row.dataset.id=r.id;
  row.innerHTML=`<div class="gl"><b>${r.label}</b><output></output>${r.hint?`<small>${r.hint}</small>`:''}</div>`;
  if(r.opts){const seg=document.createElement('div');seg.className='gseg';
    for(const [v,l] of r.opts){const b=document.createElement('button');b.textContent=l;b.onclick=()=>gfxPut(r.id,v);b.dataset.v=JSON.stringify(v);seg.appendChild(b)}
    row.appendChild(seg)}
  else{const s=document.createElement('input');s.type='range';s.min=r.min;s.max=r.max;s.step=r.step;s.setAttribute('aria-label',r.label);
    s.oninput=()=>{row.querySelector('output').textContent=r.fmt(+s.value)};s.onchange=()=>gfxPut(r.id,+s.value);row.appendChild(s)}
  gfxList.appendChild(row)}
// the panel shows the settings in effect, marks the ones changed from the preset, and the preset (or Custom)
function gfxPanelSync(){
  document.querySelectorAll('[data-g]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===gfxKey&&!Object.keys(gfxOver).length));
  $('#gfxMenuBtn').textContent=`Graphics: ${gfxName()}`;vrGfxSync();
  $('#gfxCustom').hidden=!Object.keys(gfxOver).length;
  for(const r of GFX_ROWS){if(Array.isArray(r))continue;const row=gfxList.querySelector(`[data-id="${r.id}"]`),v=gfxGet(r.id);
    const ti=r.id==='tuftA'?0:r.id==='tuftR'?1:-1,ch=r.id==='dirt'?false:ti>=0?!!gfxOver.tuft&&gfxOver.tuft[ti]!==GFX[gfxKey].tuft[ti]:r.id in gfxOver;row.classList.toggle('changed',ch);
    if(r.opts){let lab='';row.querySelectorAll('button').forEach(b=>{const on=b.dataset.v===JSON.stringify(v);b.setAttribute('aria-pressed',on);if(on)lab=b.textContent});
      row.querySelector('output').textContent=r.id==='aniso'&&v>texAnisoN?`${texAnisoN}x (GPU max)`:''}
    else{const s=row.querySelector('input');if(document.activeElement!==s)s.value=v;row.querySelector('output').textContent=r.fmt(v)}}}
// live numbers while the panel is open, from the frame loop's own counters
let gfxStatT=0;
function gfxStats(){if(gfxBox.hidden)return;const i=renderer.info,t=i.render.triangles,f=$('#fpsVal').textContent;
  $('#gfxStats').innerHTML=`<b>${f}</b> fps · <b>${fmtNum(t)}</b> tris · <b>${i.render.calls}</b> draws · <b>${pr.toFixed(2).replace(/0$/,'')}x</b> res · <b>${i.memory.textures}</b> textures`;
  // GPU memory, counted from what the game asked the GPU to hold (core.js); the real figure is a little higher
  const m=gpuMem(),mb=b=>(b/1048576).toFixed(b<10485760?1:0),all=m.textures+m.geometry+m.targets+m.screen;
  $('#gfxMem').innerHTML=`GPU memory about <b>${mb(all)} MB</b>: textures <b>${mb(m.textures)}</b> · geometry <b>${mb(m.geometry)}</b> · screen <b>${mb(m.screen)}</b>`+(m.targets?` · depth buffers <b>${mb(m.targets)}</b>`:'')+` MB`}
function fmtNum(t){return t>=1e6?(t/1e6).toFixed(2)+'M':t>=1e3?Math.round(t/1e3)+'k':String(t)}
// frame rate graph: every frame's time goes in a ring (main.js), and while the panel is open the last 10 s are drawn as
// frames per second over time, with lines at 30 and 60, coloured green, yellow or red like the fps counter
const GFX_FT=new Float32Array(1200);let gfxFTi=0,gfxFTn=0;
function gfxFrame(ms){GFX_FT[gfxFTi]=ms;gfxFTi=(gfxFTi+1)%GFX_FT.length;if(gfxFTn<GFX_FT.length)gfxFTn++}
const gfxGraph=$('#gfxGraph'),GRAPH_S=10,GRAPH_MAX=120;
function gfxDraw(){const cv=gfxGraph,dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  const g=cv.getContext('2d'),css=getComputedStyle(document.documentElement),col=f=>css.getPropertyValue(f>=50?'--ok':f>=30?'--gas':'--danger').trim();
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  const y=f=>h-Math.min(f,GRAPH_MAX)/GRAPH_MAX*h;
  // newest frame at the right edge, back GRAPH_S seconds
  let t=0,n=0,sum=0;const fps=[];
  for(let k=1;k<=gfxFTn&&t<GRAPH_S*1000;k++){const ms=GFX_FT[(gfxFTi-k+GFX_FT.length)%GFX_FT.length];if(ms<=0)continue;t+=ms;const f=1000/ms;fps.push([t,f]);sum+=ms;n++}
  for(const [ft,f] of fps){const x=w-ft/(GRAPH_S*1000)*w,bw=Math.max(1,w*(1000/f)/(GRAPH_S*1000));g.fillStyle=col(f);g.fillRect(Math.floor(x),y(f),Math.ceil(bw)+1,h-y(f))}
  g.font='600 13px Barlow, sans-serif';g.textBaseline='bottom';
  for(const L of [30,60]){g.strokeStyle='rgba(243,245,239,.55)';g.setLineDash([4,4]);g.lineWidth=1;g.beginPath();g.moveTo(0,y(L)+0.5);g.lineTo(w,y(L)+0.5);g.stroke();
    g.fillStyle='rgba(243,245,239,.8)';g.fillText(String(L),4,y(L)-2)}
  g.setLineDash([]);
  // the summary: average over the window, and the slowest 1% of frames (the stutters you feel)
  const ms=fps.map(p=>1000/p[1]).sort((a,b)=>b-a),low=ms.length?1000/ms[Math.floor(ms.length*0.01)]:0;
  $('#gfxGraphCap').innerHTML=n?`Last ${GRAPH_S} s: <b>${(1000*n/sum).toFixed(0)}</b> fps average · <b>${low.toFixed(0)}</b> fps 1% low · slowest frame <b>${ms[0].toFixed(0)}</b> ms`:''}
function gfxTick(){gfxStats();gfxDraw()}
function showGfx(on){gfxBox.hidden=!on;if(on){gfxPanelSync();gfxTick();clearInterval(gfxStatT);gfxStatT=setInterval(gfxTick,250)}else clearInterval(gfxStatT)}
document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>setGfx(b.dataset.g,true));
$('#gfxMenuBtn').onclick=()=>{showGfx(true);$('#menu').hidden=true;$('#menuBtn').setAttribute('aria-expanded',false)};
$('#gfxDone').onclick=()=>showGfx(false);
$('#gfxReset').onclick=()=>setGfx(gfxKey,true);
gfxBox.addEventListener('pointerdown',e=>{if(e.target===gfxBox)showGfx(false)});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!gfxBox.hidden)showGfx(false)});
// the saved setting (or the device's guess) and any changes made to it
{let k=null;try{k=localStorage.getItem('bhd_gfx');gfxOver=JSON.parse(localStorage.getItem('bhd_gfxc')||'{}')||{}}catch(e){gfxOver={}}
  setGfx(k||gfxGuess(),false)}
