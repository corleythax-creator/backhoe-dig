// Corley's Island: shared helpers, renderer, scene, sky, camera, lights and the flat-shaded material maker M().
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const $=s=>document.querySelector(s);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer / scene ----------
const canvas=$('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
// GPU memory: WebGL never says how much the GPU really uses, so this counts what the game asks it to hold: every
// texture level (and mip chain), vertex and index buffer and render buffer as it is made, resized or deleted, plus the
// screen's own buffers. The Graphics panel shows it (gfx.js) as an estimate
const gpuMem=(function(){const gl=renderer.getContext(),tex=new Map(),buf=new Map(),rb=new Map(),bound=new Map(),units=new Map();
  const tot={tex:0,buf:0,rb:0};let unit=0,bBuf=new Map(),bRb=null;
  const CUBE=gl.TEXTURE_CUBE_MAP,bpp=(fmt,type)=>type===gl.FLOAT?16:type===gl.HALF_FLOAT||type===0x8D61?8:fmt===gl.DEPTH_COMPONENT||fmt===0x81A6||fmt===0x88F0?4:4;
  const tgt=t=>t>=gl.TEXTURE_CUBE_MAP_POSITIVE_X&&t<=gl.TEXTURE_CUBE_MAP_POSITIVE_X+5?CUBE:t;
  const cur=t=>(units.get(unit)||{})[tgt(t)];
  const setLevel=(t,key,b)=>{const o=cur(t);if(!o)return;const e=tex.get(o)||{};tot.tex+=b-(e[key]||0);e[key]=b;tex.set(o,e)};
  const w=(name,f)=>{const g=gl[name];if(g)gl[name]=function(){f.apply(null,arguments);return g.apply(gl,arguments)}};
  w('activeTexture',u=>{unit=u});
  w('bindTexture',(t,o)=>{const u=units.get(unit)||{};u[t]=o;units.set(unit,u)});
  w('texImage2D',function(t,l,ifmt){const a=arguments;let W,H,fmt,type;
    if(a.length>=8){W=a[3];H=a[4];fmt=a[6];type=a[7]}else{const src=a[5]||{};W=src.naturalWidth||src.videoWidth||src.width||0;H=src.naturalHeight||src.videoHeight||src.height||0;fmt=a[3];type=a[4]}
    setLevel(t,t+':'+l,W*H*bpp(fmt,type))});
  w('texStorage2D',(t,levels,ifmt,W,H)=>{let b=0;for(let l=0;l<levels;l++)b+=Math.max(1,W>>l)*Math.max(1,H>>l)*(ifmt===0x881A?8:ifmt===0x8814?16:4);setLevel(t,'store',b*(t===CUBE?6:1))});
  w('generateMipmap',t=>{const o=cur(t),e=o&&tex.get(o);if(!e)return;let b0=0;for(const k in e)if(/:0$/.test(k))b0+=e[k];setLevel(t,'mip',Math.round(b0/3))});
  w('deleteTexture',o=>{const e=tex.get(o);if(e){for(const k in e)tot.tex-=e[k];tex.delete(o)}});
  w('bindBuffer',(t,o)=>{bBuf.set(t,o)});
  w('bufferData',(t,d)=>{const o=bBuf.get(t);if(!o)return;const b=typeof d==='number'?d:d?d.byteLength:0;tot.buf+=b-(buf.get(o)||0);buf.set(o,b)});
  w('deleteBuffer',o=>{tot.buf-=buf.get(o)||0;buf.delete(o)});
  w('bindRenderbuffer',(t,o)=>{bRb=o});
  w('renderbufferStorage',(t,f,W,H)=>{if(!bRb)return;const b=W*H*4;tot.rb+=b-(rb.get(bRb)||0);rb.set(bRb,b)});
  w('renderbufferStorageMultisample',(t,s,f,W,H)=>{if(!bRb)return;const b=W*H*4*Math.max(1,s);tot.rb+=b-(rb.get(bRb)||0);rb.set(bRb,b)});
  w('deleteRenderbuffer',o=>{tot.rb-=rb.get(o)||0;rb.delete(o)});
  // the screen: front and back colour, depth, and with antialiasing a 4x multisampled colour and depth copy
  const screen=()=>{const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,aa=gl.getContextAttributes().antialias;return W*H*(4+4+4+(aa?4*8:0))};
  return ()=>({textures:tot.tex,geometry:tot.buf,targets:tot.rb,screen:screen(),texCount:tex.size,bufCount:buf.size})})();
// phones (touch-first, short side 1000 CSS px or less) are held back by pixels, not triangles (speed test, Oct 17: 43 fps
// at 1x scene load and still 39 at three times the triangles): cap them at 1.5x and give them cheaper shadows
const PHONE=matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=1000;
// gfx.js sets these from the Graphics setting (Low, Medium, High); these are the defaults until it loads
let maxPR=Math.min(devicePixelRatio||1,PHONE?1.5:2),gfxDetail=1,gfxBase=1,gfxFov=0,gfxFog=1,texOn=false;let pr=maxPR,lowN=0,hiN=0,prHold=0,viewDirty=false;
renderer.setPixelRatio(pr);
// resizing the canvas wipes it, so resolution changes and window resizes only set viewDirty; the frame loop applies them
// just before it draws (applying them after a draw left that frame black, which flashed on phones)
// a phone short on memory can reset the graphics, which shows black; say so, and keep a count for the speed test
let glResets=0;try{glResets=+localStorage.getItem('bhd_glresets')||0}catch(e){}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();glResets++;try{localStorage.setItem('bhd_glresets',glResets)}catch(e){}
  if(typeof toast==='function')toast(say('glReset'),'bad',4500)});
renderer.shadowMap.enabled=true; renderer.shadowMap.type=PHONE?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;
// lighting is done in linear space and tone mapped like a camera; colours stay written as the sRGB values they were
// picked as, and the patched chunks below turn them linear before lighting
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.8;
(function(){
  const lin=c=>`${c}=mix(${c}/12.92,pow((${c}+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),${c}));`;
  const C=THREE.ShaderChunk;
  C.color_fragment+='\n'+lin('diffuseColor.rgb');
  C.emissivemap_fragment+='\n'+lin('totalEmissiveRadiance');
  // Phong reflections follow Fresnel: faint face-on, strong at grazing angles, as on paint, glass and water
  const ph=THREE.ShaderLib.phong;
  ph.fragmentShader=ph.fragmentShader.replace('#include <envmap_fragment>',C.envmap_fragment.replace(/specularStrength \* reflectivity/g,
    'specularStrength*reflectivity*(0.12+0.88*pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),5.0))'));
})();
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbfd2dd);
scene.fog=new THREE.Fog(0xbfd2dd,90,760);
// gradient sky dome and a hazy mountain ring past the fog
// where the sun is (a unit vector toward it): set every frame from the clock by daynight.js, which also sets LIGHT_DIR,
// the way the shadow-casting light shines from (the sun by day, the moon at night, never quite flat along the ground)
const SUN_DIR=new THREE.Vector3(13,15,9).normalize(),LIGHT_DIR=SUN_DIR.clone();
// dayKU: how much sunlight there is (0 at night, 1 by day), for the light through leaves and grass blades
const dayKU={value:1};
// things that keep the rain off (roofs, cabs, buildings, bridges, props, blocks) are also on this layer: rain.js draws
// them from above into its shelter map
const RAIN_LAYER=3;
// skySunVis: how much of the sun disc shows (rain.js clouds it over)
const skySunVis={value:1};
// the sky's colours, sun, moon and stars (daynight.js sets them): uTop and uHor the gradient, uGlow the twilight glow on
// the sun's side of the horizon, uCel turns the view into the star sphere's frame, uMet a shooting star
const skyU={uSun:{value:SUN_DIR},uSunVis:skySunVis,uTop:{value:new THREE.Color(0x4f86bd)},uHor:{value:new THREE.Color(0xbfd2dd)},
  uGlow:{value:new THREE.Color(0)},uSunC:{value:new THREE.Color(1,0.86,0.62)},uMoon:{value:new THREE.Vector3(0,-1,0)},uMoonV:{value:0},
  uStars:{value:0},uCel:{value:new THREE.Matrix3()},uGNP:{value:new THREE.Vector3(0,0,1)},uSkyT:{value:0},
  uMetA:{value:new THREE.Vector3(0,1,0)},uMetB:{value:new THREE.Vector3(0,1,0)},uMetT:{value:-1}};
const sky=(function(){
  const g=new THREE.SphereGeometry(1300,64,32);
  const mat=new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false,depthWrite:false,toneMapped:false});
  // gradient, sun disc and glow, moon with its phase, stars and the Milky Way, drawn per pixel
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,skyU);
    sh.vertexShader='varying vec3 vDir;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDir=position;');
    sh.fragmentShader='uniform vec3 uSun,uTop,uHor,uGlow,uSunC,uMoon,uGNP,uMetA,uMetB;uniform float uSunVis,uMoonV,uStars,uSkyT,uMetT;uniform mat3 uCel;\nvarying vec3 vDir;\n'+
      'float skH(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+
      'float skN(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(skH(i),skH(i+vec3(1,0,0)),f.x),mix(skH(i+vec3(0,1,0)),skH(i+vec3(1,1,0)),f.x),f.y),mix(mix(skH(i+vec3(0,0,1)),skH(i+vec3(1,0,1)),f.x),mix(skH(i+vec3(0,1,1)),skH(i+1.0),f.x),f.y),f.z);}\n'+
      sh.fragmentShader.replace('#include <color_fragment>',
      'vec3 sd=normalize(vDir);float cs=max(0.0,dot(sd,uSun));\n'+
      'float gt=clamp(sd.y*2.4,0.0,1.0);float az=0.5+0.5*dot(normalize(uSun.xz+1e-5),normalize(sd.xz+1e-5));\n'+
      'diffuseColor.rgb*=mix(uHor,uTop,pow(gt,0.8))+uGlow*(0.25+0.75*az*az*az)*(1.0-smoothstep(0.0,0.5,sd.y));\n'+
      '#include <color_fragment>\n'+
      'float up=smoothstep(-0.03,0.02,sd.y);\n'+
      'diffuseColor.rgb+=uSunVis*uSunC*(0.32*pow(cs,10.0)+0.5*pow(cs,180.0))*(0.6+0.4*smoothstep(0.0,0.3,sd.y))*up+uSunVis*uSunC*vec3(12.0,12.2,13.7)*smoothstep(0.99955,0.9997,cs)*up;\n'+
      // stars on the turning star sphere, more of them along the Milky Way, twinkling
      'if(uStars>0.001){vec3 cel=uCel*sd;float gb=dot(cel,uGNP),band=exp(-gb*gb*14.0);vec3 p=cel*130.0,id=floor(p),f=fract(p);float hh=skH(id);float s=0.0;\n'+
      '  if(hh>0.9-0.06*band){vec3 o=vec3(skH(id+1.7),skH(id+3.1),skH(id+5.3))*0.6+0.2;float b=pow((hh-0.84)/0.16,3.0);s=b*smoothstep(0.17,0.0,length(f-o))*(0.7+0.3*sin(uSkyT*(2.0+3.0*hh)+hh*90.0));}\n'+
      '  float mw=band*smoothstep(0.35,0.85,skN(cel*7.0)*0.6+skN(cel*19.0)*0.4)*0.05;\n'+
      '  diffuseColor.rgb+=(s*vec3(1.0,0.96,0.9)*1.6+mw*vec3(0.7,0.76,0.95))*uStars*uSunVis*smoothstep(0.0,0.12,sd.y);\n'+
      '  if(uMetT>0.0){vec3 ab=uMetB-uMetA;float q=clamp(dot(sd-uMetA,ab)/dot(ab,ab),0.0,uMetT),d=length(sd-uMetA-ab*q),tl=q/uMetT;\n'+
      '    diffuseColor.rgb+=vec3(1.0,0.95,0.85)*2.5*smoothstep(0.0016,0.0,d)*tl*tl*(1.0-smoothstep(0.75,1.0,uMetT))*uStars*uSunVis;}}\n'+
      // the moon: a disc lit on the side toward the sun, so it shows its real phase, with a faint glow round it
      'float cm=dot(sd,uMoon);if(uMoonV>0.001&&cm>0.99){const float R=0.0095;vec3 o=sd-uMoon*cm;float r=length(o)/R;\n'+
      '  diffuseColor.rgb+=vec3(0.55,0.6,0.7)*0.05*uMoonV*pow(max(0.0,(cm-0.99)/0.01),40.0)*uSunVis*up;\n'+
      '  if(r<1.0){vec3 n=o/R-uMoon*sqrt(1.0-r*r);float lit=smoothstep(-0.06,0.1,dot(n,uSun));float mare=0.82+0.18*skN(o/R*3.0+4.0);\n'+
      '    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,0.97,0.9)*(0.03+1.4*lit*mare)+diffuseColor.rgb*0.4,smoothstep(1.0,0.9,r)*uMoonV*uSunVis*up);}}\n'+
      'diffuseColor.rgb*=1.0-0.25*smoothstep(0.0,-0.08,sd.y);')};
  const m=new THREE.Mesh(g,mat);
  m.renderOrder=-1;scene.add(m);return m;
})();

const camera=new THREE.PerspectiveCamera(60,1,0.05,2400);
// warm sun as the key, a cooler and much dimmer sky fill, so shade reads blue-grey and lit faces stand out
scene.add(new THREE.HemisphereLight(0xb8d0ea,0x5b5a3c,0.5));
const sun=new THREE.DirectionalLight(0xfff0dc,1.6);
sun.castShadow=true; sun.shadow.mapSize.set(PHONE?1024:2048,PHONE?1024:2048);
// the shadow box's half width is the Graphics setting shR (gfx.js); the sun sits SUN_D m back so tall things at its edges still cast
const SUN_D=80;Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:SUN_D+90});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.02;
scene.add(sun); scene.add(sun.target);
// sky reflections: the dome over a dull ground, caught into a small cube map for glass, paint, chrome and water; daynight.js
// catches it again as the sky changes (skyEnvUpdate), from a scene of its own that holds only the dome and the ground
const skyEnvRT=new THREE.WebGLCubeRenderTarget(64,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}),skyEnv=skyEnvRT.texture;
const skyEnvScene=new THREE.Scene(),skyEnvCam=new THREE.CubeCamera(1,2000,skyEnvRT),skyEnvGnd=new THREE.MeshBasicMaterial({color:0x4a4a32,fog:false,toneMapped:false});
{const gnd=new THREE.Mesh(new THREE.CircleGeometry(900,24).rotateX(-Math.PI/2),skyEnvGnd);gnd.position.y=-12;skyEnvScene.add(gnd,new THREE.Mesh(sky.geometry,sky.material))}
// k: how bright the ground under the sky is (1 by day)
function skyEnvUpdate(k){skyEnvGnd.color.setHex(0x4a4a32).multiplyScalar(k);skyEnvScene.background=scene.background;skyEnvCam.update(renderer,skyEnvScene);skyEnv.needsPMREMUpdate=true}
skyEnvUpdate(1);
// straight-up normals for flat-shaded ground: lighting takes its slope from the faces, but the shadow lookup needs a
// real normal (an all-zero one gives no shadow at all)
function upNormals(n){const a=new Float32Array(n);for(let i=1;i<n;i+=3)a[i]=1;return a}
const M=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:6,specular:0x111111},o||{}));
