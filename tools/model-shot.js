#!/usr/bin/env node
// Corley's Island: a quick look at a detailed model without booting the game. Renders models/<name>.glb (or only the
// nodes named) on a ground plane under sun and sky, in four views (front left, rear right, side, from above), with the
// game's material names read as models.js reads them (mdlMats names, 'paint#hex' and the other kinds, 'lib:<id>' with
// the library texture; the photo wear detail of the paint, steel and rubber kinds included). Nodes are laid out side
// by side when there are several. Takes a few seconds in software rendering, where the game takes a minute or more.
//   NODE_PATH=$(npm root -g) node tools/model-shot.js NAME OUT.png [node ...] [--size 1400x900] [--dist 1.0]
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),A=process.argv.slice(2),opt={size:'1400x900',dist:'1'},pos=[];
for(let i=0;i<A.length;i++){if(A[i].startsWith('--'))opt[A[i].slice(2)]=A[++i];else pos.push(A[i])}
const [name,out,...nodes]=pos;if(!name||!out){console.error('usage: model-shot.js NAME OUT.png [node ...]');process.exit(1)}
const types={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const PAGE=`<!doctype html><html><body style="margin:0;background:#9fb8cc"><script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const P=new URLSearchParams(location.search),[W,H]=P.get('size').split('x').map(Number),want=P.get('nodes')?P.get('nodes').split(','):null,dist=+P.get('dist');
const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});R.setSize(W,H);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;document.body.appendChild(R.domElement);R.setScissorTest(true);
const S=new THREE.Scene();S.background=new THREE.Color(0xa9c3d6);const pm=new THREE.PMREMGenerator(R),env=pm.fromScene(new RoomEnvironment(),0.04).texture;S.environment=env;
S.add(new THREE.HemisphereLight(0xcfe3ff,0x5a4a32,0.9));const sun=new THREE.DirectionalLight(0xfff2dc,3.2);sun.position.set(6,10,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);S.add(sun);S.add(sun.target);
const TL=new THREE.TextureLoader(),tex=(f,srgb)=>{const t=TL.load(f);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t};
const MEAN={paint:0.301,steel:0.084,rubber:0.049};
function std(hex,o){o=o||{};const m=new THREE.MeshStandardMaterial({color:hex,metalness:o.metal||0,roughness:o.rough==null?0.5:o.rough,envMapIntensity:o.env||1});
  if(o.tex){m.map=tex('textures/mach_'+o.tex+'.jpg',true);m.color.convertSRGBToLinear();m.color.multiplyScalar(1/MEAN[o.tex]);m.color.convertLinearToSRGB();
    m.normalMap=tex('textures/mach_'+o.tex+'_n.jpg');m.normalScale.set(o.relief||0.6,o.relief||0.6);m.roughnessMap=tex('textures/mach_'+o.tex+'_r.jpg');m.roughness=o.rough==null?1:o.rough}
  if(o.emissive)m.emissive.setHex(o.emissive);return m}
const P_=(h,o)=>std(h,Object.assign({tex:'paint'},o)),St=(h,o)=>std(h,Object.assign({tex:'steel',metal:0.65},o));
const NAMED={paint:P_(0xe8701d),paintD:P_(0xb8561a),paintW:P_(0xe9ecea),paintR:P_(0xb3291f),paintB:P_(0x1d3557),paintY:P_(0xf2b705),
  steel:St(0x2b2d2c),steelL:St(0x55595a),bed:St(0x6c7378,{metal:0.35}),bedD:St(0x4c5257,{metal:0.35}),bucket:St(0x55595a),chrome:std(0xc9ccc8,{metal:1,rough:0.18}),rim:std(0xb9bdbf,{metal:0.85,rough:0.35}),
  rubber:std(0x1b1c1b,{tex:'rubber',relief:0.8}),track:std(0x34332f,{tex:'steel',metal:0.5,relief:1}),tire:std(0x1b1c1b,{tex:'rubber',relief:1}),
  lens:std(0xfff6d8,{emissive:0x554a30,rough:0.1}),redL:std(0xd0281c,{emissive:0x400804,rough:0.2}),amber:std(0xffa21a,{emissive:0x402400,rough:0.2}),
  black:std(0x2a2c2e,{rough:0.55}),seat:std(0x34363a,{rough:0.85}),trim:std(0x8c8f92,{rough:0.6}),mirror:std(0xdde4ea,{metal:1,rough:0.04}),
  glass:std(0x3c4a52,{rough:0.05,env:1.4}),tint:std(0x1c2328,{rough:0.04,env:1.6}),screen:std(0x0b1418,{emissive:0x10202a}),deck:null};
function lib(id,turn){const L=k=>{const t=tex('textures/'+id+k+'.jpg',!k);t.center.set(0.5,0.5);t.rotation=turn?Math.PI/2:0;return t};
  const m=new THREE.MeshStandardMaterial({map:L(''),normalMap:L('_n'),roughnessMap:L('_r'),roughness:1,envMapIntensity:0.6});return m}
NAMED.deck=lib('planks',true);const cache={};
function matOf(k){if(NAMED[k])return NAMED[k];if(cache[k])return cache[k];let r=null;const l=/^lib:([a-z0-9_]+)(:turn)?$/.exec(k),c=/^([a-z]+)#([0-9a-fA-F]{6})$/.exec(k);
  if(l)r=lib(l[1],!!l[2]);else if(c){const h=parseInt(c[2],16),t=c[1];
    r=t==='paint'?P_(h):t==='steel'?St(h):t==='rubber'?std(h,{tex:'rubber',relief:0.8}):t==='plastic'?P_(h,{relief:0.25,rough:0.75}):t==='matte'?std(h,{tex:'rubber',relief:0.5}):
      t==='metal'?std(h,{metal:1,rough:0.25}):t==='glass'||t==='win'?std(h,{rough:0.05,env:1.5}):t==='glow'?new THREE.MeshBasicMaterial({color:h}):null}
  if(!r)console.warn('unknown material '+k);return cache[k]=r||NAMED.steel}
// box-projected texture coordinates, as the game gives them (models.js mdlBoxUV)
function boxUV(g){const p=g.attributes.position.array,n=g.attributes.normal.array,c=p.length/3,uv=new Float32Array(c*2);
  for(let v=0;v<c;v++){const o=v*3,ax=Math.abs(n[o]),ay=Math.abs(n[o+1]),az=Math.abs(n[o+2]);let u,w;
    if(ax>=ay&&ax>=az){u=p[o+2];w=p[o+1]}else if(ay>=az){u=p[o];w=p[o+2]}else{u=p[o];w=p[o+1]}uv[v*2]=u*0.9;uv[v*2+1]=w*0.9}g.setAttribute('uv',new THREE.BufferAttribute(uv,2))}
new GLTFLoader().load('models/'+P.get('name')+'.glb',gl=>{const top=gl.scene.children[0].children.length?gl.scene.children[0]:gl.scene;
  let list=top.children.filter(n=>!want||want.includes(n.name));const G=new THREE.Group();let x=0,tri=0;
  const groups=[];for(const n of list){const g=new THREE.Group();n.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry;if(!geo.attributes.uv)boxUV(geo);
      const ms=new THREE.Mesh(geo,matOf(m.material.name));ms.castShadow=ms.receiveShadow=true;m.updateWorldMatrix(true,false);ms.applyMatrix4(m.matrixWorld);g.add(ms);
      tri+=(geo.index?geo.index.count:geo.attributes.position.count)/3});groups.push(g)}
  // several nodes of one machine (moving parts) stay together; separate things (no shared bounds) go side by side
  const sep=want&&want.length>1&&P.get('apart')!=='0'||P.get('apart')==='1';
  for(const g of groups){const b=new THREE.Box3().setFromObject(g);if(sep&&!b.isEmpty()){g.position.x=x-b.min.x;x+=b.max.x-b.min.x+0.6}G.add(g)}
  S.add(G);const b=new THREE.Box3().setFromObject(G),c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3()),r=Math.max(sz.x,sz.y,sz.z)*dist;
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x7d7462,roughness:0.95}));gr.rotation.x=-Math.PI/2;gr.position.y=b.min.y-0.002;gr.receiveShadow=true;S.add(gr);
  sun.target.position.copy(c);sun.position.copy(c).add(new THREE.Vector3(r*1.2,r*2,r*1.4));const sc=sun.shadow.camera;sc.left=sc.bottom=-r*1.5;sc.right=sc.top=r*1.5;sc.near=0.1;sc.far=r*8;sc.updateProjectionMatrix();
  const views=[[1,0.55,1.25],[-1.1,0.5,-1.1],[1.6,0.2,0],[0.25,1.7,0.6]],w=W/2,h=H/2;
  const cams=views.map(([vx,vy,vz])=>{const cam=new THREE.PerspectiveCamera(32,w/h,0.01,r*20);cam.position.copy(c).add(new THREE.Vector3(vx,vy,vz).normalize().multiplyScalar(r*1.45));cam.lookAt(c);return cam});
  // drawn again as the textures come in
  const draw=()=>cams.forEach((cam,i)=>{const X=(i%2)*w,Y=(1-Math.floor(i/2))*h;R.setViewport(X,Y,w,h);R.setScissor(X,Y,w,h);R.render(S,cam)});
  draw();THREE.DefaultLoadingManager.onLoad=()=>{draw();window.drawn=true};setTimeout(()=>{draw();window.drawn=true},8000);
  window.done={tri:Math.round(tri),size:sz.toArray().map(v=>+v.toFixed(3)),nodes:list.map(n=>n.name)}},undefined,e=>{window.done={err:String(e)}});
</script></body></html>`;
const server=http.createServer((req,res)=>{const u=req.url.split('?')[0];if(u==='/shot.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end(PAGE);return}
  const f=path.join(root,decodeURIComponent(u));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
server.listen(0,async()=>{const port=server.address().port,[w,h]=opt.size.split('x').map(Number),errs=[];
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});
    const q=new URLSearchParams({name,size:opt.size,dist:opt.dist,nodes:nodes.join(','),apart:opt.apart||''});
    await p.goto(`http://127.0.0.1:${port}/shot.html?${q}`);await p.waitForFunction(()=>window.done,null,{timeout:180000});
    const r=await p.evaluate(()=>window.done);await p.waitForFunction(()=>window.drawn,null,{timeout:120000});await p.screenshot({path:out,timeout:120000});
    console.log(JSON.stringify({...r,errors:errs}))}
  finally{await b.close();server.close()}});
