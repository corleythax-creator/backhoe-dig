// Corley's Island: detailed machine models from files (models/*.glb, glTF), on physically based materials. The
// excavator's and the dump truck's come from tools/build_model.js, and any model that keeps its contract
// (tools/models/excavator.js and truck.js: a node per moving part, in that part's own frame, materials named for the
// game's) can replace them, and so can the heavy machines' (tools/models/dozer.js, loader.js, semi.js, pickup.js,
// atv.js and backhoe.js). With the Graphics setting's Machine models on Detailed, each file is fetched once and its
// parts go into the game's own part groups in place of the simple shapes, which stay for the Simple setting; the parts
// the model leaves to the game (the excavator's rams, hoses and linkage; the truck's chassis, tanks, lights, cab inside
// and wheels) switch to the same physically based materials. Only how the machines look changes, never how they dig
// or move (CLAUDE.md).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const MDL_LOADER='three/addons/loaders/GLTFLoader.js';
const mdl={want:false,on:false,ex:null,loading:false,simple:null,swap:[],tr:null,trOn:false,trLoading:false,trSimple:null,trSwap:[]};
// physically based, smooth-shaded stand-ins for the game's flat-shaded materials (the rams and hoses), so curved parts
// read round: glossy ones (the chromed rods) as polished metal; each gets the rain's wet look
function mdlSmooth(base){const shiny=(base.shininess||0)>50,m=new THREE.MeshStandardMaterial({color:base.color.clone(),metalness:shiny?0.95:0.3,roughness:shiny?0.15:0.5,envMap:skyEnv});
  if(typeof wetPatch==='function')wetPatch(m);return m}
let mdlMats=null;
// physically based materials for the detailed models: paint, bare steel and rubber carry a seamless photo detail (the
// wear, scratches and grime of textures/mach_*.jpg, tinted to the part's colour by dividing out the texture's mean, in linear light as the shader reads it), its
// relief and roughness maps (tools/pbr.py), and the sky's reflection (skyEnv), so steel is metal and paint is paint
const MDL_TEX={paint:[0.301,0.301,0.301],steel:[0.084,0.084,0.084],rubber:[0.049,0.049,0.049]},mdlTexC={};
function mdlTex(id,kind){const k=id+kind;if(!mdlTexC[k]){const t=new THREE.TextureLoader().load(`textures/mach_${id}${kind}.jpg`);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(!kind)t.colorSpace=THREE.SRGBColorSpace;mdlTexC[k]=t}return mdlTexC[k]}
function mdlStd(hex,o){o=o||{};const m=new THREE.MeshStandardMaterial({color:hex,metalness:o.metal||0,roughness:o.rough==null?0.5:o.rough,envMap:skyEnv,envMapIntensity:o.env||1});
  if(o.tex){const c=MDL_TEX[o.tex];m.map=mdlTex(o.tex,'');m.color.setRGB(m.color.r/c[0],m.color.g/c[1],m.color.b/c[2]);
    m.normalMap=mdlTex(o.tex,'_n');m.normalScale.set(o.relief||0.6,o.relief||0.6);m.roughnessMap=mdlTex(o.tex,'_r');m.roughness=o.rough==null?1:o.rough}
  if(o.emissive)m.emissive.setHex(o.emissive);if(typeof wetPatch==='function')wetPatch(m);return m}
// a library material (textures/<id>.jpg with its relief and roughness, tools/pbr.py) on a machine: the lowboy's oak deck,
// its boards turned to run along the trailer
function mdlLib(id,o){const L=k=>{const t=new THREE.TextureLoader().load(`textures/${id}${k}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;
    t.center.set(0.5,0.5);t.rotation=o.turn||0;if(!k)t.colorSpace=THREE.SRGBColorSpace;return t};
  const m=new THREE.MeshStandardMaterial({color:0xffffff,map:L(''),normalMap:L('_n'),roughnessMap:L('_r'),roughness:1,envMap:skyEnv,envMapIntensity:0.6});
  m.normalScale.set(o.relief||1,o.relief||1);if(typeof wetPatch==='function')wetPatch(m);return m}
function mdlMatsMake(){if(mdlMats)return mdlMats;const P=(h,o)=>mdlStd(h,Object.assign({tex:'paint'},o)),St=(h,o)=>mdlStd(h,Object.assign({tex:'steel',metal:0.65},o));
  mdlMats={paint:P(0xe8701d),paintD:P(0xb8561a),paintW:P(0xe9ecea),paintR:P(0xb3291f),paintB:P(0x1d3557),paintY:P(0xf2b705),deck:mdlLib('planks',{turn:Math.PI/2}),
    steel:St(0x2b2d2c),steelL:St(0x55595a),bed:St(0x6c7378,{metal:0.35}),bedD:St(0x4c5257,{metal:0.35}),bucket:St(0x55595a),
    chrome:mdlStd(0xc9ccc8,{metal:1,rough:0.18}),rim:mdlStd(0xb9bdbf,{metal:0.85,rough:0.35}),
    rubber:mdlStd(0x1b1c1b,{tex:'rubber',relief:0.8}),track:mdlStd(0x34332f,{tex:'steel',metal:0.5,relief:1}),tire:mdlStd(0x1b1c1b,{tex:'rubber',relief:1}),
    lens:LENS,redL:REDL,amber:AMBER,
    black:mdlStd(0x2a2c2e,{rough:0.55}),seat:mdlStd(0x34363a,{rough:0.85}),trim:mdlStd(0x8c8f92,{rough:0.6}),
    mirror:mdlStd(0xdde4ea,{metal:1,rough:0.04}),glass:glass.material,tint:mdlStd(0x1c2328,{rough:0.04,env:1.6}),
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
  const fl=typeof fuelLeft==='function'?fuelLeft('ex')/FUEL.ex.tank:0.72;gauge(80,fl,'FUEL',fl<0.1?'#ff5a4a':fl<0.25?'#f0b022':'#4fd36b');gauge(240,0.46,'TEMP','#4fb6ff');
  g.fillStyle='#cfe3ea';g.font='600 22px sans-serif';g.textAlign='left';
  const t=typeof dn!=='undefined'&&typeof dnTime==='function'?dnTime(dn.t):'';g.fillText(t,16,190);
  g.textAlign='right';g.fillText((typeof fuelHrs==='function'?fuelHrs('ex').toFixed(1):'1022')+' h',W-16,190);
  g.fillStyle='#f07a22';g.fillRect(16,152,64,16);g.fillStyle='#0b1418';g.font='700 13px sans-serif';g.textAlign='center';g.fillText('P MODE',48,165);
  if(mdlScrTex)mdlScrTex.needsUpdate=true}
// the glTF loader (an ES module, mapped in index.html's import map), fetched the first time a detailed model is wanted
function mdlLoaderReady(cb){if(THREE.GLTFLoader){cb();return}
  import(MDL_LOADER).then(m=>{THREE.GLTFLoader=m.GLTFLoader;cb()},()=>{mdl.loading=mdl.trLoading=false})}
function mdlLoadEx(){if(mdl.ex||mdl.loading)return;mdl.loading=true;
  mdlLoaderReady(()=>new THREE.GLTFLoader().load('models/excavator.glb',gl=>{mdl.loading=false;mdl.ex=gl.scene;if(mdl.want)mdlExOn(true)},undefined,()=>{mdl.loading=false}))}
// the excavator's part groups, by the model's node names
function mdlExParts(){return {machine,house,cab,joyL:exJoy[0],joyR:exJoy[1],boom:boomP,stick:stickP,bucket:bkG}}
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
        if(k==='track'||k==='bucket'){mesh.userData.grime=k;mdlSide(mesh).grimeBase=mat;
          // dirt builds up on its own copy, as on the simple shapes (dirt.js); if that has started, join it now
          if(grimeMats){const m2=mdlClone(mat);mesh.material=m2;grimeMats.push({m:m2,base:mat,kind:k})}}
        if(!m.geometry.attributes.uv)mdlBoxUV(m.geometry);
        mesh.layers.enable(RAIN_LAYER);if(k==='glass')mesh.renderOrder=2;mesh.visible=false;par.add(mesh);mdl.swap.push(mesh)})}}
  for(const c of mdl.simple)c.visible=!on;glass.visible=!on;for(const m of mdl.swap)m.visible=on;
  for(const g of Object.values(P))mdlRemat(g,on);
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
// a copy of a material for one mesh's own dirt (dirt.js), with the rain's wet look put on again
// what a mesh's swaps keep (the materials and geometry it had): off userData, which every clone copies through JSON
const MDL_SIDE=new WeakMap();function mdlSide(o){let u=MDL_SIDE.get(o);if(!u)MDL_SIDE.set(o,u={});return u}
function mdlClone(m){const c=m.clone();c.userData={};if(typeof wetPatch==='function')wetPatch(c);return c}
// the game's flat-shaded materials and the physically based ones that stand in for them on the detailed machines
function mdlPbrMap(){if(mdl.pmap)return mdl.pmap;const m=mdlMatsMake();
  mdl.pmap=new Map([[ORANGE,m.paint],[ORANGE_D,m.paintD],[STEEL,m.steel],[STEEL_L,m.steelL],[CHROME,m.chrome],[RUBBER,m.tire],
    [WHITE,m.paintW],[WHITE_DS,m.paintW],[BEDM,m.bed],[BED_D,m.bedD]]);return mdl.pmap}
// puts every mesh of a part group (the game's own, not the model's) on its physically based stand-in, or back; a mesh
// carrying its own dirt (dirt.js grimeMats) gets its own copy, and the dirt follows it
function mdlRemat(root,on){const map=mdlPbrMap(),gm=typeof grimeMats!=='undefined'&&grimeMats;
  root.traverse(o=>{if(!o.isMesh||o.name.startsWith('mdl_'))return;const u=mdlSide(o);
    if(on){if(u.mdlOld)return;const cur=o.material,g=gm&&gm.find(e=>e.m===cur),pb=map.get(g?g.base:cur);if(!pb)return;
      u.mdlOld=cur;if(g){u.mdlOldBase=g.base;const c=mdlClone(pb);g.m=c;g.base=pb;o.material=c}else o.material=pb}
    else if(u.mdlOld){const g=gm&&gm.find(e=>e.m===o.material);if(g){g.m=u.mdlOld;g.base=u.mdlOldBase}o.material=u.mdlOld;u.mdlOld=null}})}
// ---------- the dump truck ----------
function mdlLoadTr(){if(mdl.tr||mdl.trLoading)return;mdl.trLoading=true;
  mdlLoaderReady(()=>new THREE.GLTFLoader().load('models/truck.glb',gl=>{mdl.trLoading=false;mdl.tr=gl.scene;if(mdl.want)mdlTrOn(true)},undefined,()=>{mdl.trLoading=false}))}
// the model's body panels go in place of the simple truck's painted ones (its white cab, hood and fenders, the dump body
// and the tailgate); the rest of the truck stays, on the physically based materials
function mdlTrOn(on){
  if(on&&!mdl.tr){mdlLoadTr();return}
  if(on===mdl.trOn)return;mdl.trOn=on;const P={body:tBody,bed:bedG,tail:tailP},PAINTED=[WHITE,WHITE_DS,BEDM,BED_D];
  if(!mdl.trSimple){mdl.trSimple=[];for(const g of Object.values(P))for(const c of g.children)if(c.isMesh&&c!==heap&&PAINTED.includes(c.material))mdl.trSimple.push(c)}
  if(on&&!mdl.trSwap.length){const mats=mdlMatsMake();
    for(const [name,par] of Object.entries(P)){const node=mdl.tr.getObjectByName(name);if(!node)continue;
      node.traverse(m=>{if(!m.isMesh)return;const mat=mats[m.material.name]||mats.steel,mesh=new THREE.Mesh(m.geometry,mat);mesh.name='mdl_'+m.name;
        mesh.castShadow=mesh.receiveShadow=true;if(!m.geometry.attributes.uv)mdlBoxUV(m.geometry);mesh.layers.enable(RAIN_LAYER);mesh.visible=false;par.add(mesh);mdl.trSwap.push(mesh)})}}
  for(const c of mdl.trSimple)c.visible=!on;for(const m of mdl.trSwap)m.visible=on;mdlRemat(truck,on)}
// ---------- every other machine: the same materials on its own shapes ----------
// The mower, skid steer, dirt bike, boats and the heavy machines (both sets) keep their shapes but go physically
// based too. Each part is sorted by its colour: rubber (near black), bare steel (greys), chrome (light greys), the cab
// glass, lamps (very bright, kept as they are, so they still light up at night) and paint (anything with colour).
// Parts painted by vertex colour (heavy.js and family.js kits, the bike, the boats) are regrouped by that sort into
// one geometry with a material per group; the rest change material by the sort of their own colour
function mdlSort(c){const mx=Math.max(c.r,c.g,c.b),mn=Math.min(c.r,c.g,c.b),sat=mx>0?(mx-mn)/mx:0,lum=0.3*c.r+0.59*c.g+0.11*c.b;
  if(Math.abs(c.r-0.235)<0.02&&Math.abs(c.g-0.29)<0.02&&Math.abs(c.b-0.322)<0.02)return 'glass';
  if(lum>0.85)return 'lamp';if(sat<0.2){if(mx<0.14)return 'rubber';if(lum>0.6)return 'chrome';return 'steel'}return 'paint'}
const MDL_SORTS=['paint','steel','rubber','chrome','glass','lamp'],mdlVC={};
// the materials for vertex-coloured parts: the vertex colour carries the hue, the photo detail the wear
function mdlVCMat(sort,side){const key=sort+side;if(mdlVC[key])return mdlVC[key];
  const o=sort==='paint'?{tex:'paint'}:sort==='steel'?{tex:'steel',metal:0.6}:sort==='rubber'?{tex:'rubber',relief:0.8}:sort==='chrome'?{metal:1,rough:0.2}:sort==='glass'?{rough:0.06,env:1.4}:{rough:0.15,emissive:0x2a261c};
  const m=mdlStd(0xffffff,o);m.vertexColors=true;m.side=side;return mdlVC[key]=m}
// a vertex-coloured geometry regrouped by sort, with box-projected texture coordinates
function mdlSplit(g){g=g.index?g.toNonIndexed():g;const P=g.attributes.position,Nm=g.attributes.normal,C=g.attributes.color,n=P.count/3,c=new THREE.Color(),tris=MDL_SORTS.map(()=>[]);
  for(let t=0;t<n;t++){c.fromBufferAttribute(C,t*3);tris[MDL_SORTS.indexOf(mdlSort(c))].push(t)}
  const tot=n*3,Pa=new Float32Array(tot*3),Na=new Float32Array(tot*3),Ca=new Float32Array(tot*3),out=new THREE.BufferGeometry();let o=0;
  tris.forEach((list,gi)=>{const start=o;for(const t of list)for(let v=0;v<3;v++){const i=t*3+v;
      Pa.set([P.getX(i),P.getY(i),P.getZ(i)],o*3);Na.set(Nm?[Nm.getX(i),Nm.getY(i),Nm.getZ(i)]:[0,1,0],o*3);Ca.set([C.getX(i),C.getY(i),C.getZ(i)],o*3);o++}
    if(o>start)out.addGroup(start,o-start,gi)});
  out.setAttribute('position',new THREE.BufferAttribute(Pa,3));out.setAttribute('normal',new THREE.BufferAttribute(Na,3));out.setAttribute('color',new THREE.BufferAttribute(Ca,3));
  if(!Nm)out.computeVertexNormals();mdlBoxUV(out);out.computeBoundingSphere();return out}
// a flat material's stand-in, by the sort of its colour (lamps, see-through and glowing ones stay as they are)
const mdlFlat=new Map();
function mdlFlatPbr(m){if(mdlFlat.has(m))return mdlFlat.get(m);let r=null;
  if(m.type==='MeshPhongMaterial'&&!m.transparent&&!(m.emissive&&m.emissive.getHex())&&!m.vertexColors){const sort=mdlSort(m.color),h=m.color.getHex();
    r=sort==='paint'?mdlStd(h,{tex:'paint'}):sort==='steel'?mdlStd(h,{tex:'steel',metal:0.6}):sort==='rubber'?mdlStd(h,{tex:'rubber',relief:0.8}):sort==='chrome'?mdlStd(h,{metal:1,rough:0.2}):sort==='glass'?mdlStd(h,{rough:0.06,env:1.4}):null;
    if(r)r.side=m.side}
  mdlFlat.set(m,r);return r}
// the machines this covers, and what on them is not paintwork (the loads, tinted as they fill)
function mdlOthers(){return [mower,skid,bike,...boats.map(b=>b.g),...hvs.flatMap(h=>h.trailer?[h.g,h.trailer]:[h.g])]}
function mdlOthersOn(on){const skip=new Set([skLoad,...hvs.flatMap(h=>[h.heap,h.hheap])]),gm=typeof grimeMats!=='undefined'&&grimeMats;
  for(const root of mdlOthers())root.traverse(o=>{if(!o.isMesh||skip.has(o)||o.isInstancedMesh)return;const u=mdlSide(o);
    if(on){if(u.mdlO)return;const mt=o.material;if(Array.isArray(mt))return;
      if(mt.vertexColors&&o.geometry.attributes.color){u.mdlO=[o.geometry,mt];if(!u.mdlG)u.mdlG=mdlSplit(o.geometry);o.geometry=u.mdlG;o.material=MDL_SORTS.map(k=>mdlVCMat(k,mt.side))}
      else{const g=gm&&gm.find(e=>e.m===mt),pb=mdlFlatPbr(g?g.base:mt);if(!pb)return;u.mdlO=[null,mt];if(g){u.mdlOB=g.base;const c=mdlClone(pb);g.m=c;g.base=pb;o.material=c}else o.material=pb}}
    else if(u.mdlO){const [geo,mt]=u.mdlO;if(geo)o.geometry=geo;else{const g=gm&&gm.find(e=>e.m===o.material);if(g){g.m=mt;g.base=u.mdlOB}}o.material=mt;u.mdlO=null}})
  mdl.othersOn=on}
// ---------- the dozers, loaders, semis, pickups and four-wheelers (both sets, heavy.js): their own detailed models ----------
const MDL_HV=['dozer','loader','semi','pickup','atv','backhoe'];mdl.hv={};mdl.hvOn=false;
function mdlLoadHv(k){if(mdl.hv[k]!==undefined)return;mdl.hv[k]=null;
  mdlLoaderReady(()=>new THREE.GLTFLoader().load(`models/${k}.glb`,gl=>{mdl.hv[k]=gl.scene;mdl.hvOn=!mdl.want},undefined,()=>{}))}
// a machine's part groups (hvMake), by the model's node names
const mdlHvParts=h=>Object.assign({body:h.g,blade:h.blade,ripper:h.ripG,arm:h.arm,bucket:h.bkt,trailer:h.trailer},h.parts);
// each machine of those kinds shows the model's meshes in its part groups in place of its kit-built ones (on and off as
// the setting goes), and a hydraulic ram between each pair of the model's ram pins
function mdlHvOn(on){mdl.hvOn=on;const mats=mdlMatsMake();
  for(const h of hvs){if(!MDL_HV.includes(h.k))continue;const src=mdl.hv[h.k],P=mdlHvParts(h);
    if(on&&!src){mdlLoadHv(h.k);continue}
    if(on&&!h.mdl){h.mdl=[];const pins={};
      for(const [name,par] of Object.entries(P)){const node=par&&src.getObjectByName(name);if(!node)continue;
        node.traverse(m=>{const pin=/^ram_(.+)_([ab])$/.exec(m.name);if(pin){(pins[pin[1]]=pins[pin[1]]||{})[pin[2]]={par,p:m.position.clone(),o:m.userData};return}
          if(!m.isMesh)return;const k=m.material.name,mesh=new THREE.Mesh(m.geometry,mats[k]||mats.steel);mesh.name='mdl_'+m.name;
          mesh.castShadow=k!=='tint';mesh.receiveShadow=true;if(!m.geometry.attributes.uv)mdlBoxUV(m.geometry);mesh.layers.enable(RAIN_LAYER);if(k==='tint')mesh.renderOrder=2;
          par.add(mesh);h.mdl.push(mesh)})}
      h.rams=Object.values(pins).filter(r=>r.a&&r.b).map(r=>mdlRam(r,mats));mdlRamPose(h)}
    for(const g of Object.values(P))if(g)for(const c of g.children)if(c.isMesh&&c!==h.heap&&c!==h.hheap)c.visible=c.name.startsWith('mdl_')?on:!on;
    for(const r of h.rams||[])r.ga.visible=r.gb.visible=on}}
// a ram: the barrel (in the machine's paint) turning on one pin, the chromed rod on the other, an eye round each pin
function mdlRam(r,mats){const o=r.a.o,rad=o.r||0.07,lb=o.lb||0.6,lr=o.lr||0.6,bk=o.bk||0;
  const end=(par,p)=>{const g=new THREE.Group();g.position.copy(p);par.add(g);return g},ga=end(r.a.par,r.a.p),gb=end(r.b.par,r.b.p);
  const cyl=(g,rd,len,z0,mat)=>{const geo=new THREE.CylinderGeometry(rd,rd,len,18);geo.rotateX(Math.PI/2);geo.translate(0,0,z0+len/2);mdlBoxUV(geo);
    const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;m.layers.enable(RAIN_LAYER);g.add(m);return m};
  cyl(ga,rad,lb+bk,-bk,mats[o.m||'paintY']);cyl(ga,rad*1.12,0.06,lb-0.06,mats.steel);cyl(ga,rad*1.1,0.08,-bk,mats.steel);
  const rod=cyl(gb,rad*0.55,lr,0,mats.chrome);
  for(const g of [ga,gb]){const eye=new THREE.Mesh(new THREE.CylinderGeometry(rad*0.85,rad*0.85,rad*2.2,14),mats.steel);g.add(eye)}
  return {ga,gb,rod,lb,lr}}
// points each ram's ends at each other as the parts move (heavy.js hvPose, with the machine's world matrices up to date)
const mdlRV=new THREE.Vector3();
function mdlRamPose(h){h.g.updateMatrixWorld(true);
  for(const r of h.rams){r.ga.up.set(1,0,0).transformDirection(h.g.matrixWorld);r.gb.up.copy(r.ga.up);
    r.gb.getWorldPosition(mdlRV);r.ga.lookAt(mdlRV);const d=mdlRV.distanceTo(r.ga.getWorldPosition(mdlRV));
    r.ga.getWorldPosition(mdlRV);r.gb.lookAt(mdlRV);r.rod.scale.z=Math.max(1,(d-r.lb+0.04)/r.lr)}}
// gfx.js: Detailed or Simple machine models (the other machines change on the next frame, once they all exist)
function mdlGfx(detail){mdl.want=!!detail;mdlExOn(mdl.want);mdlTrOn(mdl.want)}
// once a few seconds, the cab display's clock (only while the detailed model shows)
function mdlTick(dt){if(!!mdl.othersOn!==mdl.want)mdlOthersOn(mdl.want);if(mdl.hvOn!==mdl.want||mdl.want&&hvs.some(h=>MDL_HV.includes(h.k)&&!h.mdl&&mdl.hv[h.k]))mdlHvOn(mdl.want);if(!mdl.on)return;mdlScrT+=dt;if(mdlScrT>5){mdlScrT=0;mdlScreenDraw()}}
