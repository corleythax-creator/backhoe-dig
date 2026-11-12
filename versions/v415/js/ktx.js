// Corley's Island: textures kept compressed on the graphics card (KTX2, Basis Universal ETC1S). A JPEG is unpacked to
// full size in video memory (a 2048 px ground map with its mipmaps is about 22 MB); its .ktx2 twin (tools/ktx.mjs,
// beside each textures/**/*.jpg) is transcoded to whatever the GPU reads natively (BC on a PC, ETC2/ASTC on a phone)
// and stays that size there: about a sixth to an eighth of the memory, nothing to unpack on the main thread, and
// mipmaps made ahead. Every textures/*.jpg the game asks THREE.TextureLoader for comes from its .ktx2 when there is
// one (the loader is patched here, so callers keep using it as before: the texture they get back fills in when it
// arrives); a missing .ktx2, or any failure, falls back to the JPEG. texInto fills an existing texture the same way
// (the ground pack's size swaps, terrain.js). Pictures read on the CPU (the material library's paint layers,
// materials.js) stay JPEG. Off with ?ktx=0 in the address, or localStorage bhd_ktx = 0, to compare.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const KTX_ON=(()=>{try{const q=new URLSearchParams(location.search).get('ktx');if(q!==null)return q!=='0';return localStorage.getItem('bhd_ktx')!=='0'}catch(e){return true}})();
const KTX_RE=/^textures\/.+\.jpg$/,ktxMgr=new THREE.LoadingManager();
let ktxL=null;
// the KTX2 loader (an ES module from the import map's three) and its Basis transcoder (from the same three release)
function ktxReady(){if(!ktxL)ktxL=import('three/addons/loaders/KTX2Loader.js').then(m=>{
  const im=JSON.parse(document.querySelector('script[type=importmap]').textContent).imports['three/addons/'];
  return new m.KTX2Loader(ktxMgr).setTranscoderPath(im+'libs/basis/').detectSupport(renderer)});return ktxL}
function ktxFill(t,k){t.isCompressedTexture=true;t.image=k.image;t.mipmaps=k.mipmaps;t.format=k.format;t.type=k.type;
  // the colour space stays what the caller set (sRGB for a colour map), as with the JPEG, so shaders read the same values
  t.flipY=false;t.generateMipmaps=false;t.minFilter=k.mipmaps.length>1?THREE.LinearMipmapLinearFilter:THREE.LinearFilter;t.needsUpdate=true}
// fills texture t from url (a .jpg path): its .ktx2 when KTX is on, else (or if that fails) the JPEG. mgr counts it as
// loading (the start's progress); pre(), if given, runs just before t changes and can return false to drop it (stale)
function texInto(t,url,mgr,ok,bad,pre){mgr=mgr||THREE.DefaultLoadingManager;mgr.itemStart(url);
  const set=f=>{if(!pre||pre()!==false){f();if(ok)try{ok(t)}catch(e){console.error(e)}}mgr.itemEnd(url)};
  const jpg=()=>new THREE.ImageLoader(ktxMgr).load(url,im=>set(()=>{if(t.isCompressedTexture){t.isCompressedTexture=false;t.mipmaps=[];t.flipY=true;t.generateMipmaps=true}
    t.image=im;t.needsUpdate=true}),undefined,e=>{if(bad)bad(e);mgr.itemError(url);mgr.itemEnd(url)});
  if(!KTX_ON||!KTX_RE.test(url)){jpg();return t}
  ktxReady().then(L=>L.loadAsync(url.slice(0,-4)+'.ktx2')).then(k=>set(()=>ktxFill(t,k)),jpg);return t}
if(KTX_ON){const load0=THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load=function(url,onLoad,onProgress,onError){
    if(typeof url!=='string'||!KTX_RE.test(url))return load0.apply(this,arguments);
    return texInto(new THREE.Texture(),url,this.manager,onLoad,onError)}}
