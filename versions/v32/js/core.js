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
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbfd2dd);
scene.fog=new THREE.Fog(0xbfd2dd,90,760);
// gradient sky dome and a hazy mountain ring past the fog
const sky=(function(){
  const g=new THREE.SphereGeometry(1300,64,32),p=g.attributes.position,c=new Float32Array(p.count*3);
  const top=new THREE.Color(0x4f86bd),hor=new THREE.Color(0xbfd2dd),col=new THREE.Color();
  for(let i=0;i<p.count;i++){const t=Math.min(1,Math.max(0,p.getY(i)/1300*2.4));col.copy(hor).lerp(top,Math.pow(t,0.8));c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.renderOrder=-1;scene.add(m);return m;
})();

const camera=new THREE.PerspectiveCamera(60,1,0.05,1700);
scene.add(new THREE.HemisphereLight(0xe2ecf3,0x4f5c3b,0.78));
const sun=new THREE.DirectionalLight(0xfff0d8,0.85);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:70});
sun.shadow.bias=-0.0008;
scene.add(sun); scene.add(sun.target);
const M=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:6,specular:0x111111},o||{}));
