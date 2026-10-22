#!/usr/bin/env node
// Builds the Asset Yard artifact's data. Exports every machine, boat, placeable thing and tree species as the running game draws it, for the Asset Yard
// artifact: one glTF (as yard/<id>.json, {glb: base64}, since the artifact host takes no .glb) per model and look
// (Detailed and Simple machine models), with its triangle, vertex, draw and material counts and its size, into
// OUT/yard/data.json with every texture (size, pixels, file size; the library's tiles from MAT_LIST), sound (length,
// file size, credit from sounds/CREDITS.md) and title shot, and 512 px previews of the big textures in OUT/th/. Textures are not embedded: each material keeps the paths of its maps (and its game material type,
// Phong or Lambert or Standard, flat shading, vertex colours) in its extras, and the page loads them from textures/.
//   NODE_PATH=$(npm root -g) node tools/asset-yard.js OUT_DIR
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),OUT=path.resolve(process.argv[2]||'yard-out');
const {execFileSync}=require('child_process');
// a jpg's width and height, from its frame header
function jpgSize(f){const b=fs.readFileSync(f);let i=2;while(i<b.length){const m=b[i+1],l=b.readUInt16BE(i+2);if(m>=0xc0&&m<=0xc3)return [b.readUInt16BE(i+7),b.readUInt16BE(i+5)];i+=2+l}return [0,0]}
const kbOf=f=>Math.round(fs.statSync(path.join(root,f)).size/1024);
// a picture's entry; big ones get a 512 px preview (t) for the page's swatch
function img(p,n,note){const [w,h]=jpgSize(path.join(root,p));let t=p;
  if(w>1024){t='th/'+p.replace(/\//g,'_');fs.mkdirSync(path.join(OUT,'th'),{recursive:true});
    execFileSync('ffmpeg',['-y','-loglevel','error','-i',path.join(root,p),'-vf','scale=512:-1','-q:v','4',path.join(OUT,t)])}
  return {n,note:note||'',p,t,w,h,kb:kbOf(p)}}
const GROUND=[['Dirt','dirt'],['Grass','grass'],['Grime','grime']].flatMap(([n,f])=>[['High','high'],['Medium','med'],['Low','low']].map(([t,d])=>[`textures/ground/${d}/${f}.jpg`,`${n} · ${t}`,`${t} graphics tier`]))
  .concat([['textures/ground/dirt_n.jpg','Dirt normal','Relief for the natural ground'],['textures/ground/grass_n.jpg','Grass normal','Relief for the natural ground'],['textures/ground/macro.jpg','Macro variation','Large-scale tint that breaks up tiling']]);
const MUD=[['textures/mud_drying.jpg','Mud, drying','Damp, matte stage of painted mud'],['textures/mud_cracked.jpg','Mud, cracked','Pale, cracked stage once it dries out']];
const TREES=[['tree_bark','Bark','Spruce, red pine, oak, maple trunks'],['tree_bark_n','Bark normal',''],['tree_birch','Birch bark','Paper birch trunks'],['tree_birch_n','Birch normal',''],
  ['tree_leaves','Leaves','Grey, tinted per tree'],['tree_leaves_a','Leaves alpha','Leaf cut-out mask']].map(([f,n,d])=>[`textures/${f}.jpg`,n,d]);
const MACH=['paint','rubber','steel'].flatMap(k=>[['','Colour'],['_n','normal'],['_r','roughness']].map(([x,d])=>[`textures/mach_${k}${x}.jpg`,`Machine ${k}${x?' '+d:''}`,x?'':d]));
const SHOTS=['dig','truck','mow','walk'].map(f=>[`shots/${f}.jpg`,f[0].toUpperCase()+f.slice(1),'Title screen shot']);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});

// runs in the page: the subjects, each a list of root objects and the frame (x, y, z, yaw) its model is exported in
const PAGE=async look=>{
  const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js'),{mergeVertices}=await import('three/addons/utils/BufferGeometryUtils.js');
  const fr=o=>({x:o.x,y:o.y||0,z:o.z,yaw:o.yaw||0});
  const frOf=g=>{g.updateMatrixWorld(true);const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();g.matrixWorld.decompose(p,q,s);
    return {x:p.x,y:p.y,z:p.z,yaw:new THREE.Euler().setFromQuaternion(q,'YXZ').y}};
  const S=[];
  const tw=k=>TWINS.find(t=>t.k===k);
  for(const [id,k,n] of [['excavator','ex','Excavator'],['truck','truck','Dump truck'],['skid','skid','Skid steer'],['mower','mow','Zero-turn mower'],['bike','bike','Dirt bike']])
    S.push({id,n,g:'Machines',roots:tw(k).vis(),f:fr(tw(k).o())});
  const HN={dozer:'Dozer',loader:'Wheel loader',semi:'Semi and lowboy',pickup:'Pickup',atv:'Four-wheeler'};
  for(const k in HN){const h=hvs.find(h=>h.k===k);if(h)S.push({id:k,n:HN[k],g:'Machines',roots:[h.g,h.trailer].filter(Boolean),f:fr(h)})}
  const seen=new Set();boats.forEach((b,i)=>{const key=b.g.children.map(c=>c.geometry&&c.geometry.attributes.position.count).join();if(seen.has(key))return;seen.add(key);
    S.push({id:'boat'+i,n:b.n||'Boat '+(i+1),g:'Boats',roots:[b.g],f:fr(b)})});
  const LN={fish:'Fishing boat',sail:'Sailboat',tug:'Tug and spoil barge'};const ls=new Set();
  lakeBoats.forEach((b,i)=>{if(ls.has(b.kind))return;ls.add(b.kind);S.push({id:'lake_'+b.kind,n:LN[b.kind]||b.kind,g:'Boats',roots:[b.g],f:frOf(b.g)})});
  S.push({id:'crane',n:'Crawler crane on its barge',g:'Boats',roots:[crnBarge],f:frOf(crnBarge)});
  walker.visible=true;S.push({id:'worker',n:'Worker',g:'People',roots:[walker],f:frOf(walker)});
  if(look==='simple'){for(let i=S.length-1;i>=0;i--)if(S[i].g!=='Machines')S.splice(i,1)}
  else{for(const k in PROPS){const im=propIMs[k];S.push({id:'prop_'+k,n:PROPS[k].n,g:'Things',meshes:[{geo:im.geometry,mat:im.material,m:new THREE.Matrix4()}],cap:PROPS[k].cap,foot:[PROPS[k].w,PROPS[k].d]})}
    TREE_SP.forEach((sp,k)=>{const c=sp.all.count?[...sp.col.slice(0,3)]:null;
      S.push({id:'tree_'+sp.id,n:sp.name.replace(/^./,c=>c.toUpperCase()),g:'Trees',tint:c,meshes:[{geo:sp.hi[0].geometry,mat:sp.hi[0].material,m:new THREE.Matrix4()},{geo:sp.hi[1].geometry,mat:sp.hi[1].material,m:new THREE.Matrix4(),tint:1}],
        lod:sp.tris,h:sp.h})})}
  scene.updateMatrixWorld(true);
  const shown=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true};
  const rel=p=>{try{const u=new URL(p,location.href);return u.pathname.replace(/^\//,'')}catch(e){return null}};
  const SLOTS=['map','normalMap','roughnessMap','metalnessMap','alphaMap','emissiveMap','aoMap','bumpMap'];
  const out=[],cv=new Map();
  for(const s of S){
    const M0=new THREE.Matrix4().makeRotationY(s.f?s.f.yaw:0).setPosition(s.f?s.f.x:0,s.f?s.f.y:0,s.f?s.f.z:0),inv=M0.clone().invert();
    let list=s.meshes;
    if(!list){list=[];for(const r of s.roots)r.traverse(o=>{if((o.isMesh||o.isInstancedMesh)&&shown(o)&&o.geometry&&o.geometry.attributes.position)
      [].concat(o.material).some(m=>m.visible!==false&&m.opacity>0.01)&&list.push({geo:o.geometry,mat:o.material,m:inv.clone().multiply(o.isInstancedMesh?o.matrixWorld.clone().multiply((()=>{const t=new THREE.Matrix4();o.getMatrixAt(0,t);return t})()):o.matrixWorld)})})}
    const R=new THREE.Group(),gc=new Map(),mc=new Map();let tris=0,verts=0,draws=0;const mats=new Set();
    const mat=(m,tint)=>{const key=m.uuid+(tint?'t':'');if(mc.has(key))return mc.get(key);
      const u={kind:m.type,flat:!!m.flatShading,vc:!!m.vertexColors,side:m.side,tr:!!m.transparent,op:m.opacity,at:m.alphaTest||0,tex:{}};
      if(m.shininess!==undefined){u.shin=m.shininess;u.spec=m.specular.getHex()}
      if(m.emissive){u.em=m.emissive.getHex();u.emi=m.emissiveIntensity}
      if(m.metalness!==undefined){u.metal=m.metalness;u.rough=m.roughness;u.envI=m.envMapIntensity}
      if(m.normalScale)u.ns=m.normalScale.x;
      for(const sl of SLOTS){const t=m[sl],im=t&&t.image;if(!im||!im.width)continue;const src=im.currentSrc||im.src;let p=src&&rel(src);
        // a texture the game draws itself (the load's grey detail, the cab screen) goes in as a picture
        if(!src){if(!cv.has(im)){const c=document.createElement('canvas');c.width=Math.min(512,im.width);c.height=Math.round(im.height*c.width/im.width);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cv.set(im,c.toDataURL('image/jpeg',0.85))}p=cv.get(im)}
        if(!p)continue;
        u.tex[sl]={p,rep:[t.repeat.x,t.repeat.y],off:[t.offset.x,t.offset.y],rot:t.rotation,ctr:[t.center.x,t.center.y],srgb:t.colorSpace===THREE.SRGBColorSpace}}
      const c=m.color?m.color.clone():new THREE.Color(1,1,1);if(tint&&s.tint)c.multiply(new THREE.Color(...s.tint));
      const e=new THREE.MeshStandardMaterial({color:c,name:m.name||m.type});e.userData=u;mc.set(key,e);return e};
    // the file's copy of a geometry: only the attributes its materials read (a flat-shaded one needs no normals, an
    // untextured one no uvs), its vertices merged, and one copy of each shape however many meshes use it (the wheels)
    const hash=a=>{let h=a.count*31+a.itemSize;const v=a.array;for(let i=0;i<v.length;i++)h=(h*33+Math.round(v[i]*1e4))|0;return h};
    const geo=(g,ms)=>{const nN=ms.some(m=>!m.flatShading),nU=ms.some(m=>SLOTS.some(sl=>m[sl])),key=[hash(g.attributes.position),g.index?hash(g.index):0,nN,nU,g.drawRange.start,g.drawRange.count].join();
      if(gc.has(key))return gc.get(key);let n=new THREE.BufferGeometry();
      for(const a of ['position','normal','uv','color'])if(g.attributes[a]&&(a!=='normal'||nN)&&(a!=='uv'||nU))n.setAttribute(a,g.attributes[a].clone());if(g.index)n.setIndex(g.index.clone());
      if(g.drawRange.count<Infinity||g.drawRange.start){const st=g.drawRange.start,ct=Math.min(g.drawRange.count,(n.index||n.attributes.position).count-st);
        if(n.index)n.setIndex(Array.from(n.index.array.slice(st,st+ct)));else{const m=new THREE.BufferGeometry();for(const a in n.attributes){const A=n.attributes[a];m.setAttribute(a,new THREE.BufferAttribute(A.array.slice(st*A.itemSize,(st+ct)*A.itemSize),A.itemSize))}n=m}}
      if(!g.groups.length)n=mergeVertices(n,1e-5);else for(const gr of g.groups)n.addGroup(gr.start,gr.count,gr.materialIndex);
      gc.set(key,n);return n};
    for(const it of list){const ms=[].concat(it.mat),g0=it.geo,g=geo(g0,ms);const me=new THREE.Mesh(g,Array.isArray(it.mat)?ms.map(m=>mat(m,it.tint)):mat(ms[0],it.tint));
      me.matrixAutoUpdate=false;me.matrix.copy(it.m);R.add(me);
      const n=g0.index?g0.index.count:g0.attributes.position.count;tris+=Math.min(n,g0.drawRange.count)/3;verts+=g0.attributes.position.count;draws+=Math.max(1,g0.groups.length);ms.forEach(m=>mats.add(m.uuid))}
    R.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(R),sz=bb.getSize(new THREE.Vector3());
    const glb=await new GLTFExporter().parseAsync(R,{binary:true});
    let bin='';const u8=new Uint8Array(glb);for(let i=0;i<u8.length;i+=0x8000)bin+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));
    out.push({id:s.id,n:s.n,g:s.g,look,tris:Math.round(tris),verts,draws,mats:mats.size,size:[sz.x,sz.y,sz.z].map(v=>+v.toFixed(2)),
      cap:s.cap,foot:s.foot,lod:s.lod,h:s.h,glb:btoa(bin)})}
  return out};

server.listen(0,async()=>{const port=server.address().port,errs=[];
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--host-resolver-rules=MAP play.test 127.0.0.1']});
  try{const p=await b.newPage({viewport:{width:800,height:500}});p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('bhd_'))localStorage.removeItem(k)});
    await p.goto(`http://play.test:${port}/index.html`,{waitUntil:'load',timeout:120000});await p.waitForTimeout(3000);
    const all=[];
    for(const look of ['detail','simple']){
      await p.evaluate(on=>{document.getElementById('help').hidden=true;mdlGfx(on)},look==='detail');
      await p.waitForFunction(on=>on?mdl.on&&mdl.trOn&&mdl.othersOn&&mdl.hvOn&&hvs.every(h=>!MDL_HV.includes(h.k)||h.mdl):!mdl.on&&!mdl.trOn&&!mdl.othersOn&&!mdl.hvOn,look==='detail',{timeout:180000,polling:500});
      await p.waitForTimeout(3000);all.push(...await p.evaluate(PAGE,look))}
    fs.mkdirSync(path.join(OUT,'yard'),{recursive:true});
    const meta=all.map(({glb,...r})=>{const f=`yard/${r.id}${r.look==='simple'?'_simple':''}.json`;fs.writeFileSync(path.join(OUT,f),JSON.stringify({glb}));
      return Object.assign(r,{f,kb:Math.round(glb.length*0.75/1024)})});
    const lib=(await p.evaluate(()=>MAT_LIST.filter(m=>!/^own/.test(m.id)).map(m=>({id:m.id,n:m.n,cat:MAT_CATS[m.cat],ft:m.ft,pbr:!!m.pbr,sh:m.sh||null}))))
      .map(m=>Object.assign(m,{maps:[['','Colour'],['_n','Normal'],['_r','Roughness']].filter(([x])=>fs.existsSync(path.join(root,`textures/${m.id}${x}.jpg`))).map(([x,k])=>Object.assign(img(`textures/${m.id}${x}.jpg`,m.n),{k}))}));
    const sounds=fs.readFileSync(path.join(root,'sounds/CREDITS.md'),'utf8').split('\n').map(l=>l.match(/^\| (\w+) \| \[(.*)\]\((.*)\) \| (.*) \|$/)).filter(Boolean)
      .filter(m=>fs.existsSync(path.join(root,`sounds/${m[1]}.mp3`))).map(([,f,r,u,by])=>({f,r,u,by,kb:kbOf(`sounds/${f}.mp3`),
        sec:+(+execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',path.join(root,`sounds/${f}.mp3`)])).toFixed(2)}));
    const L=a=>a.map(x=>img(...x));
    fs.writeFileSync(path.join(OUT,'yard/data.json'),JSON.stringify({made:new Date().toISOString().slice(0,10),lib,ground:L(GROUND),mud:L(MUD),trees:L(TREES),mach:L(MACH),
      misc:[img('textures/thumbs.jpg','Editor swatch strip','Paint tool thumbnails, one per material')],shots:L(SHOTS),sounds,models:meta}));
    console.log(meta.map(m=>`${m.look.padEnd(6)} ${m.id.padEnd(16)} ${String(m.tris).padStart(7)} tris ${m.draws} draws ${m.kb} KB`).join('\n'));
    if(errs.length)console.log('page errors:',errs)}
  finally{await b.close();server.close()}});
