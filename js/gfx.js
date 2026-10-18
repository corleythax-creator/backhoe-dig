// Corley's Island: the Graphics setting (☰ menu, then Graphics): Low for phones, Medium for laptops, High for desktop PCs,
// and under them every setting on its own to play with. Each device keeps its own choice. The first time, it picks from
// the device: phones get Low, Intel graphics Medium, anything else High. Changing one setting makes it Custom: the preset
// with those changes on top (bhd_gfxc); picking a preset again clears them.
// Low is from the iPhone speed test (Oct 17): shadows, filmic lighting and ground detail each cost it 9-16 FPS.
// Only how things are drawn changes here, never what the ground does (CLAUDE.md).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// pr resolution cap, auto lower it when slow, fps frame cap (0 none), fov degrees added, sh shadow map (0 off), soft
// shadow edges, filmic lighting, exp brightness, tex texture size, base ground texture, detail cut faces, painted
// materials and machine grime, macro large-scale variation, aniso, tuft grass blades [amount, full-detail distance m,
// fade-out distance m, share kept far off], lawnFar lawn full detail within m, fog haze distance, wmFine fine puddle
// water, rainN raindrops, dirt the Dirt detail it sets when picked
const GFX={
  low:{name:'Low',pr:1.5,auto:true,fps:0,fov:0,sh:1024,soft:false,filmic:false,exp:1,tex:'low',detail:0,base:1,macro:false,aniso:4,dirt:1,lawnFar:6,fog:1,wmFine:false,rainN:600,tuft:[0.6,12,40,0.2]},
  med:{name:'Medium',pr:1.5,auto:true,fps:0,fov:0,sh:2048,soft:false,filmic:true,exp:1,tex:'med',detail:1,base:1,macro:false,aniso:8,dirt:2,lawnFar:15,fog:1,wmFine:true,rainN:1500,tuft:[0.85,18,60,0.3]},
  high:{name:'High',pr:2,auto:true,fps:0,fov:0,sh:2048,soft:true,filmic:true,exp:1,tex:'high',detail:1,base:1,macro:true,aniso:16,dirt:4,lawnFar:1e9,fog:1,wmFine:true,rainN:3000,tuft:[1,25,80,0.35]}};
let gfxKey='high',gfxOver={},gfxCur=Object.assign({},GFX.high);
function gfxName(){return GFX[gfxKey].name+(Object.keys(gfxOver).length?' (custom)':'')}
function gfxGuess(){if(PHONE)return 'low';
  try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),r=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'';if(/intel/i.test(r))return 'med'}catch(e){}
  return 'high'}
// the preset with the panel's changes on top, put into effect
function gfxApply(){const g=gfxCur=Object.assign({},GFX[gfxKey],gfxOver);
  // resolution cap (the auto resolution works under it); a preset stops at the screen's own, a picked one may go past it
  maxPR='pr' in gfxOver?g.pr:Math.min(devicePixelRatio||1,g.pr);pr=maxPR;viewDirty=true;
  // shadows: off, or the map size and filter
  sun.castShadow=g.sh>0;
  if(g.sh>0&&sun.shadow.mapSize.x!==g.sh){sun.shadow.mapSize.set(g.sh,g.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  const st=g.soft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
  // lighting: filmic, or a plain exposure that keeps about the same brightness for much less work per pixel
  const tm=g.filmic?THREE.ACESFilmicToneMapping:THREE.LinearToneMapping,te=(g.filmic?0.8:0.75)*g.exp;
  if(renderer.shadowMap.type!==st||renderer.toneMapping!==tm){renderer.shadowMap.type=st;renderer.toneMapping=tm;
    scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.needsUpdate=true})}
  renderer.toneMappingExposure=te;
  // ground detail: the cut-face detail, material library and machine grime (detail), and the grass and dirt textures (base)
  gfxDetail=g.detail;gfxBase=g.base;if(texOn){texMixU.value=gfxDetail;texBaseU.value=gfxBase;matTexUpdate()}
  // the ground pack's size, its filtering and the large-scale variation map (terrain.js)
  texTierSet(g.tex);texAnisoSet(g.aniso);macroSet(g.macro);
  // puddles: a finer water surface with sky reflections, or a 1 ft one without (water.js); the water itself is the same
  if(WM_K!==(g.wmFine?1:GRID_K))wmSet(g.wmFine);
  mudGfx(g.wmFine);
  // raindrops drawn (rain.js); the rain itself is the same
  rainGfx(g.rainN);
  // field of view and haze (effects.js, rain.js)
  gfxFov=g.fov;gfxFog=g.fog;scene.fog.far=760*g.fog;if(typeof resize==='function')resize();
  if(typeof gfxPanelSync==='function')gfxPanelSync()}
function setGfx(k,picked){gfxKey=GFX[k]?k:gfxGuess();
  if(picked){gfxOver={};try{localStorage.removeItem('bhd_gfxc')}catch(e){}}
  gfxApply();
  // dirt detail follows the setting when picked (or the first time), and stays its own setting after that
  let saved=null;try{saved=localStorage.getItem('bhd_dirt')}catch(e){}
  if(picked||saved===null)setDirtLevel(GFX[gfxKey].dirt,picked);
  if(picked){try{localStorage.setItem('bhd_gfx',gfxKey)}catch(e){}toast(`Graphics: ${GFX[gfxKey].name}`,'good')}}
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
  {id:'soft',label:'Soft shadow edges',opts:onOff},
  {id:'filmic',label:'Filmic lighting',hint:'Camera-like light and colour. Off is plainer and faster.',opts:onOff},
  {id:'exp',label:'Brightness',min:0.6,max:1.4,step:0.05,fmt:v=>`${Math.round(v*100)}%`},
  {id:'fog',label:'Haze distance',hint:'How far you see before the air turns hazy.',min:0.4,max:2,step:0.1,fmt:v=>`${(760*v*FT_M/5280).toFixed(1)} mi`},
  ['Textures'],
  {id:'tex',label:'Texture size',hint:'Ground and machine textures. Bigger is sharper and uses more memory.',opts:[['low','512'],['med','1024'],['high','2048']]},
  {id:'base',label:'Ground texture',hint:'Grass and dirt detail on the ground.',opts:[[1,'On'],[0,'Off']]},
  {id:'detail',label:'Extra detail',hint:'Cut dirt faces, painted materials and grime on the machines.',opts:[[1,'On'],[0,'Off']]},
  {id:'macro',label:'Ground variation',hint:'Large soft light and dark patches that hide the texture repeating.',opts:onOff},
  {id:'aniso',label:'Sharpness at an angle',hint:'Keeps far-off ground crisp (anisotropic filtering).',opts:[[1,'1x'],[2,'2x'],[4,'4x'],[8,'8x'],[16,'16x']]},
  ['Grass and scenery'],
  {id:'tuftA',label:'Grass blades',hint:'How many blades are drawn. The main triangle cost.',min:0,max:1,step:0.05,fmt:v=>`${Math.round(v*100)}%`},
  {id:'tuftR',label:'Grass distance',hint:'How far the blades reach before they thin out.',min:5,max:60,step:1,fmt:v=>`${Math.round(v*FT_M)} ft`},
  {id:'lawnFar',label:'Lawn full detail',hint:'The tall lawn is drawn simpler past this distance.',opts:[[6,'20 ft'],[15,'50 ft'],[30,'100 ft'],[1e9,'All']]},
  ['Effects'],
  {id:'dirt',label:'Dirt detail',hint:'Clods, flying dirt and lumpy loads. 16x is for screenshots.',opts:[[1,'1x'],[2,'2x'],[4,'4x'],[16,'16x']]},
  {id:'wmFine',label:'Puddle water',hint:'Fine water with sky reflections, or simple.',opts:[[true,'Fine'],[false,'Simple']]},
  {id:'rainN',label:'Raindrops',opts:[[0,'Off'],[600,'600'],[1500,'1500'],[3000,'3000'],[6000,'6000']]}];
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
  $('#gfxMenuBtn').textContent=`Graphics: ${gfxName()}`;
  $('#gfxCustom').hidden=!Object.keys(gfxOver).length;
  for(const r of GFX_ROWS){if(Array.isArray(r))continue;const row=gfxList.querySelector(`[data-id="${r.id}"]`),v=gfxGet(r.id);
    const ti=r.id==='tuftA'?0:r.id==='tuftR'?1:-1,ch=r.id==='dirt'?false:ti>=0?!!gfxOver.tuft&&gfxOver.tuft[ti]!==GFX[gfxKey].tuft[ti]:r.id in gfxOver;row.classList.toggle('changed',ch);
    if(r.opts){let lab='';row.querySelectorAll('button').forEach(b=>{const on=b.dataset.v===JSON.stringify(v);b.setAttribute('aria-pressed',on);if(on)lab=b.textContent});
      row.querySelector('output').textContent=r.id==='aniso'&&v>texAnisoN?`${texAnisoN}x (GPU max)`:''}
    else{const s=row.querySelector('input');if(document.activeElement!==s)s.value=v;row.querySelector('output').textContent=r.fmt(v)}}}
// live numbers while the panel is open, from the frame loop's own counters
let gfxStatT=0;
function gfxStats(){if(gfxBox.hidden)return;const i=renderer.info,t=i.render.triangles,f=$('#fpsVal').textContent;
  $('#gfxStats').innerHTML=`<b>${f}</b> fps · <b>${fmtNum(t)}</b> tris · <b>${i.render.calls}</b> draws · <b>${pr.toFixed(2).replace(/0$/,'')}x</b> res · <b>${i.memory.textures}</b> textures`}
function fmtNum(t){return t>=1e6?(t/1e6).toFixed(2)+'M':t>=1e3?Math.round(t/1e3)+'k':String(t)}
function showGfx(on){gfxBox.hidden=!on;if(on){gfxPanelSync();gfxStats();clearInterval(gfxStatT);gfxStatT=setInterval(gfxStats,500)}else clearInterval(gfxStatT)}
document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>setGfx(b.dataset.g,true));
$('#gfxMenuBtn').onclick=()=>{showGfx(true);$('#menu').hidden=true;$('#menuBtn').setAttribute('aria-expanded',false)};
$('#gfxDone').onclick=()=>showGfx(false);
$('#gfxReset').onclick=()=>setGfx(gfxKey,true);
gfxBox.addEventListener('pointerdown',e=>{if(e.target===gfxBox)showGfx(false)});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!gfxBox.hidden)showGfx(false)});
// the saved setting (or the device's guess) and any changes made to it
{let k=null;try{k=localStorage.getItem('bhd_gfx');gfxOver=JSON.parse(localStorage.getItem('bhd_gfxc')||'{}')||{}}catch(e){gfxOver={}}
  setGfx(k||gfxGuess(),false)}
