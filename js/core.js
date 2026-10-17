// Backhoe Dig: shared helpers, renderer, scene, sky, camera, lights and the flat-shaded material maker M().
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const $=s=>document.querySelector(s);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer / scene ----------
const canvas=$('#view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
const maxPR=Math.min(devicePixelRatio||1,2);let pr=maxPR,lowN=0,hiN=0;
renderer.setPixelRatio(pr);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
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
// afternoon sun from the south-east of the dig, about 40 degrees up
const SUN_DIR=new THREE.Vector3(13,15,9).normalize();
const sky=(function(){
  const g=new THREE.SphereGeometry(1300,64,32),p=g.attributes.position,c=new Float32Array(p.count*3);
  const top=new THREE.Color(0x4f86bd),hor=new THREE.Color(0xbfd2dd),col=new THREE.Color();
  for(let i=0;i<p.count;i++){const t=Math.min(1,Math.max(0,p.getY(i)/1300*2.4));col.copy(hor).lerp(top,Math.pow(t,0.8));c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  const mat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false,toneMapped:false});
  // sun disc and glow drawn per pixel over the gradient
  mat.onBeforeCompile=sh=>{sh.uniforms.uSun={value:SUN_DIR};
    sh.vertexShader='varying vec3 vDir;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDir=position;');
    sh.fragmentShader='uniform vec3 uSun;\nvarying vec3 vDir;\n'+sh.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\nvec3 sd=normalize(vDir);float cs=max(0.0,dot(sd,uSun));\ndiffuseColor.rgb+=vec3(1.0,0.86,0.62)*(0.32*pow(cs,10.0)+0.5*pow(cs,180.0))*(0.6+0.4*smoothstep(0.0,0.3,sd.y))+vec3(12.0,10.5,8.5)*smoothstep(0.99955,0.9997,cs);\ndiffuseColor.rgb*=1.0-0.25*smoothstep(0.0,-0.08,sd.y);')};
  const m=new THREE.Mesh(g,mat);
  m.renderOrder=-1;scene.add(m);return m;
})();

const camera=new THREE.PerspectiveCamera(60,1,0.05,1700);
// warm sun as the key, a cooler and much dimmer sky fill, so shade reads blue-grey and lit faces stand out
scene.add(new THREE.HemisphereLight(0xb8d0ea,0x5b5a3c,0.5));
const sun=new THREE.DirectionalLight(0xfff0dc,1.6);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:70});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.02;
scene.add(sun); scene.add(sun.target);
// sky reflections: the dome over a dull ground, caught once into a small cube map for glass, paint, chrome and water
const skyEnv=(function(){
  const rt=new THREE.WebGLCubeRenderTarget(64,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  const gnd=new THREE.Mesh(new THREE.CircleGeometry(900,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x4a4a32,fog:false,toneMapped:false}));
  gnd.position.y=-12;scene.add(gnd);
  new THREE.CubeCamera(1,2000,rt).update(renderer,scene);
  scene.remove(gnd);gnd.geometry.dispose();gnd.material.dispose();
  return rt.texture;
})();
const M=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:6,specular:0x111111},o||{}));
