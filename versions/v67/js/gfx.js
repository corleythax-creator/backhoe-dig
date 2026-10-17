// Corley's Island: the Graphics setting (☰ menu): Low for phones, Medium for laptops, High for desktop PCs. Each device keeps
// its own choice. The first time, it picks from the device: phones get Low, Intel graphics Medium, anything else High.
// Low is from the iPhone speed test (Oct 17): shadows, filmic lighting and ground detail each cost it 9-16 FPS.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const GFX={
  low:{name:'Low',pr:1.5,sh:1024,soft:false,filmic:false,detail:0,dirt:1,lawnFar:6},
  med:{name:'Medium',pr:1.5,sh:2048,soft:false,filmic:true,detail:1,dirt:2,lawnFar:15},
  high:{name:'High',pr:2,sh:2048,soft:true,filmic:true,detail:1,dirt:4,lawnFar:1e9}};
let gfxKey='high';
function gfxGuess(){if(PHONE)return 'low';
  try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),r=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'';if(/intel/i.test(r))return 'med'}catch(e){}
  return 'high'}
function setGfx(k,picked){const g=GFX[k]?GFX[k]:GFX[gfxGuess()];gfxKey=GFX[k]?k:gfxGuess();
  // resolution cap (the auto resolution works under it)
  maxPR=Math.min(devicePixelRatio||1,g.pr);pr=maxPR;viewDirty=true;
  // shadows: map size and filter
  if(sun.shadow.mapSize.x!==g.sh){sun.shadow.mapSize.set(g.sh,g.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  const st=g.soft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
  // lighting: filmic, or a plain exposure that keeps about the same brightness for much less work per pixel
  const tm=g.filmic?THREE.ACESFilmicToneMapping:THREE.LinearToneMapping,te=g.filmic?0.8:0.75;
  if(renderer.shadowMap.type!==st||renderer.toneMapping!==tm){renderer.shadowMap.type=st;renderer.toneMapping=tm;
    scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.needsUpdate=true})}
  renderer.toneMappingExposure=te;
  // ground detail: the dirt and grass textures and the cut-face detail
  gfxDetail=g.detail;if(texOn){texMixU.value=gfxDetail;matTexUpdate()}
  // dirt detail follows the setting when picked (or the first time), and stays its own setting after that
  let saved=null;try{saved=localStorage.getItem('bhd_dirt')}catch(e){}
  if(picked||saved===null)setDirtLevel(g.dirt,picked);
  document.querySelectorAll('.sizes button[data-g]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===gfxKey));
  if(picked){try{localStorage.setItem('bhd_gfx',gfxKey)}catch(e){}toast(`Graphics: ${g.name}`,'good')}}
document.querySelectorAll('.sizes button[data-g]').forEach(b=>b.onclick=()=>setGfx(b.dataset.g,true));
{let k=null;try{k=localStorage.getItem('bhd_gfx')}catch(e){}setGfx(k||gfxGuess(),false)}
