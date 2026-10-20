// Corley's Island: detailed machine models from files (models/*.glb, glTF). The excavator's comes from
// tools/build_model.js, and any model that keeps its contract (tools/models/excavator.js: a node per moving part, in
// that part's own frame, materials named for the game's) can replace it. With the Graphics setting's Machine models on
// Detailed, the file is fetched once and its parts go into the game's own part groups in place of the simple shapes,
// which stay for the Simple setting; the rams, hoses and bucket linkage stay the game's own. Only how the machine looks
// changes, never how it digs or moves (CLAUDE.md).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const MDL_LOADER='https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js';
const mdl={want:false,on:false,ex:null,loading:false,simple:null,swap:[]};
// smooth-shaded copies of the game's flat-shaded materials, so curved parts read round; each gets the rain's wet look
function mdlSmooth(base,o){const m=base.clone();m.flatShading=false;m.userData={};if(o)Object.assign(m,o);if(typeof wetPatch==='function')wetPatch(m);return m}
let mdlMats=null;
function mdlMatsMake(){if(mdlMats)return mdlMats;
  const S=mdlSmooth;
  mdlMats={paint:S(ORANGE),paintD:S(ORANGE_D),steel:S(STEEL),steelL:S(STEEL_L),chrome:S(CHROME),rubber:S(RUBBER),
    track:S(M(0x34332f,{shininess:14,specular:0x1c1c1c})),bucket:S(STEEL_L),lens:S(LENS),redL:S(REDL),amber:S(AMBER),
    black:S(M(0x3a3d40,{shininess:18,specular:0x1a1a1a})),seat:S(M(0x3a3c40,{shininess:4,specular:0x0a0a0a})),trim:S(M(0x8c8f92,{shininess:6})),
    mirror:S(M(0x9aa9b4,{shininess:90,envMap:skyEnv,combine:THREE.MixOperation,reflectivity:1})),glass:glass.material,
    screen:new THREE.MeshBasicMaterial({map:mdlScreenTex(),toneMapped:false})};
  mdlMats.glass.userData.noWet=true;
  return mdlMats}
// the cab display: fuel and coolant gauges, engine hours, the clock and the work mode, in the game's own time
const mdlScr=document.createElement('canvas');mdlScr.width=320;mdlScr.height=224;
let mdlScrTex=null,mdlScrT=0;
function mdlScreenTex(){if(!mdlScrTex){mdlScrTex=new THREE.CanvasTexture(mdlScr);mdlScreenDraw()}return mdlScrTex}
function mdlScreenDraw(){const g=mdlScr.getContext('2d'),W=320,H=224;g.fillStyle='#0b1418';g.fillRect(0,0,W,H);
  const gauge=(cx,v,lab,col)=>{g.lineWidth=10;g.strokeStyle='#22343b';g.beginPath();g.arc(cx,92,46,Math.PI*0.8,Math.PI*2.2);g.stroke();
    g.strokeStyle=col;g.beginPath();g.arc(cx,92,46,Math.PI*0.8,Math.PI*(0.8+1.4*v));g.stroke();g.fillStyle='#cfe3ea';g.font='600 18px sans-serif';g.textAlign='center';g.fillText(lab,cx,100)};
  gauge(80,0.72,'FUEL','#4fd36b');gauge(240,0.46,'TEMP','#4fb6ff');
  g.fillStyle='#cfe3ea';g.font='600 22px sans-serif';g.textAlign='left';
  const t=typeof dn!=='undefined'&&typeof dnTime==='function'?dnTime(dn.t):'';g.fillText(t,16,190);
  g.textAlign='right';g.fillText('1022 h',W-16,190);
  g.fillStyle='#f07a22';g.fillRect(16,152,64,16);g.fillStyle='#0b1418';g.font='700 13px sans-serif';g.textAlign='center';g.fillText('P MODE',48,165);
  if(mdlScrTex)mdlScrTex.needsUpdate=true}
// the classic-script glTF loader, fetched the first time a detailed model is wanted
function mdlLoaderReady(cb){if(THREE.GLTFLoader){cb();return}const s=document.createElement('script');s.src=MDL_LOADER;s.onload=cb;
  s.onerror=()=>{mdl.loading=false};document.head.appendChild(s)}
function mdlLoadEx(){if(mdl.ex||mdl.loading)return;mdl.loading=true;
  mdlLoaderReady(()=>new THREE.GLTFLoader().load('models/excavator.glb',gl=>{mdl.loading=false;mdl.ex=gl.scene;if(mdl.want)mdlExOn(true)},undefined,()=>{mdl.loading=false}))}
// the excavator's part groups, by the model's node names
function mdlExParts(){return {machine,house,cab,boom:boomP,stick:stickP,bucket:bucketP}}
function mdlExOn(on){
  if(on&&!mdl.ex){mdlLoadEx();return}
  if(on===mdl.on)return;mdl.on=on;const P=mdlExParts();
  // the simple shapes of each part (everything but the moving linkage, the load and the wiper)
  if(!mdl.simple){mdl.simple=[];const keep=[loadMesh,sideL[0],sideL[1],hLink,jPin];
    for(const g of Object.values(P))for(const c of g.children)if(c.isMesh&&!keep.includes(c))mdl.simple.push(c)}
  if(on&&!mdl.swap.length){const mats=mdlMatsMake();
    for(const [name,par] of Object.entries(P)){const node=mdl.ex.getObjectByName(name);if(!node)continue;
      node.traverse(m=>{if(!m.isMesh)return;const k=m.material.name,mat=mats[k]||mats.steel;
        const mesh=new THREE.Mesh(m.geometry,mat);mesh.name='mdl_'+m.name;mesh.castShadow=k!=='glass'&&k!=='screen';mesh.receiveShadow=k!=='glass';
        if(k==='track'||k==='bucket'){mesh.userData.grime=k;mesh.userData.grimeBase=mat;
          // dirt builds up on its own copy, as on the simple shapes (dirt.js); if that has started, join it now
          if(grimeMats){const m2=mat.clone();mesh.material=m2;grimeMats.push({m:m2,base:mat,kind:k})}}
        if(!m.geometry.attributes.uv)mdlBoxUV(m.geometry);
        mesh.layers.enable(RAIN_LAYER);if(k==='glass')mesh.renderOrder=2;mesh.visible=false;par.add(mesh);mdl.swap.push(mesh)})}}
  for(const c of mdl.simple)c.visible=!on;glass.visible=!on;for(const m of mdl.swap)m.visible=on;
  // the rams and hoses turn smooth with the model
  if(!mdl.ramMat){mdl.ramMat={b:rams[0].barrel.material,r:rams[0].rod.material,e:rams[0].ea.material,h:HOSE};
    mdl.ramSm={b:mdlSmooth(mdl.ramMat.b),r:mdlSmooth(mdl.ramMat.r),e:mdlSmooth(mdl.ramMat.e),h:mdlSmooth(HOSE)}}
  const rm=on?mdl.ramSm:mdl.ramMat;
  for(const r of rams){r.barrel.material=rm.b;r.rod.material=rm.r;r.ea.material=r.eb.material=r.gl.material=rm.e}
  for(const h of hoses)h.g&&scene.children.forEach(o=>{if(o.geometry===h.g)o.material=rm.h});
}
// box-projected texture coordinates, as mergeStatic gives the simple shapes, for the grime and paint detail
function mdlBoxUV(g){const P=g.attributes.position.array,Nm=g.attributes.normal.array,n=P.length/3,UV=new Float32Array(n*2);
  for(let v=0;v<n;v++){const o=v*3,ax=Math.abs(Nm[o]),ay=Math.abs(Nm[o+1]),az=Math.abs(Nm[o+2]);let u,w;
    if(ax>=ay&&ax>=az){u=P[o+2];w=P[o+1]}else if(ay>=az){u=P[o];w=P[o+2]}else{u=P[o];w=P[o+1]}UV[v*2]=u*0.9;UV[v*2+1]=w*0.9}
  g.setAttribute('uv',new THREE.BufferAttribute(UV,2))}
// gfx.js: Detailed or Simple machine models
function mdlGfx(detail){mdl.want=!!detail;mdlExOn(mdl.want)}
// once a few seconds, the cab display's clock (only while the detailed model shows)
function mdlTick(dt){if(!mdl.on)return;mdlScrT+=dt;if(mdlScrT>5){mdlScrT=0;mdlScreenDraw()}}
