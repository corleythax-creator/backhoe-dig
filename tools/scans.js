// Corley's Island: writes models/scans.glb, the photo-scanned street furniture and props, from CC0 Poly Haven models.
// Each SCANS entry below is a map-editor kind (PROPS in js/props.js; one also stands in MDL_SPOTS): its Poly Haven model,
// the parts of it to keep (null: all), and how it sits: a turn about each axis, a scale, and copies along x or up y.
// The kind's node has its origin on the ground under its middle, front toward +z, metres; its materials are named
// 'scan:…', which the game keeps as they are (textures and all) instead of mapping them to its own (mdlMatOf, models.js).
// Downloads go to SCAN_CACHE (default /tmp/scans). Credit a new model in CREDITS.md.
//   NODE_PATH=$(npm root -g) node tools/scans.js
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),CDN='https://cdn.jsdelivr.net/npm/three@0.147.0/',CACHE=process.env.SCAN_CACHE||'/tmp/scans';
// kind: [Poly Haven id, parts to keep, {rx, ry, s, xs: copies along x at these offsets, ys: copies up y at these heights}]
const SCANS={
  hydrant:['fire_hydrant',['fire_hydrant','fire_hydrant_cap_01','fire_hydrant_cap_02','fire_hydrant_cap_03','fire_hydrant_chain'],{}],
  jersey:['concrete_road_barrier_02',null,{s:0.971,xs:[-0.762,0.762]}],
  barrel:['barrel_03',null,{s:0.95}],
  genset:['portable_generator',null,{}],
  tires:['old_tyre',null,{rx:Math.PI/2,s:1.2,ys:[0,0.195,0.39,0.585],jog:0.03}],
  firepit:['stone_fire_pit',null,{s:0.9}],
  lamppost:['street_lamp_01',null,{}],
  trashcan:['metal_trash_can',['metal_trash_can','metal_trash_can_handle_left','metal_trash_can_handle_right'],{}],
  utilbox:['utility_box_01',null,{}]};
const get=(url,out)=>{if(!fs.existsSync(out)){fs.mkdirSync(path.dirname(out),{recursive:true});execFileSync('curl',['-sSLf','-o',out,url])}return out};
// a Poly Haven model's 1k glTF with its buffer and textures folded in as data URIs, as one JSON string
function gltfOf(id){const files=JSON.parse(execFileSync('curl',['-sSf',`https://api.polyhaven.com/files/${id}`])).gltf['1k'].gltf;
  const dir=path.join(CACHE,id),g=JSON.parse(fs.readFileSync(get(files.url,path.join(dir,id+'.gltf'))));
  const data=(uri,mime)=>`data:${mime};base64,`+fs.readFileSync(get(files.include[uri].url,path.join(dir,uri))).toString('base64');
  for(const b of g.buffers)b.uri=data(b.uri,'application/octet-stream');for(const im of g.images||[])im.uri=data(im.uri,'image/jpeg');
  return JSON.stringify(g)}
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();p.on('pageerror',e=>{console.error(e.message);process.exitCode=1});
  await p.setContent('<html><body></body></html>');
  for(const f of ['build/three.min.js','examples/js/exporters/GLTFExporter.js','examples/js/loaders/GLTFLoader.js'])await p.addScriptTag({url:CDN+f});
  const src={};for(const k in SCANS)src[k]=[gltfOf(SCANS[k][0]),SCANS[k][1],SCANS[k][2]];
  const r=await p.evaluate(src=>new Promise(async(ok,no)=>{const out=new THREE.Group(),tri={};
    for(const k in src){const [json,keep,o]=src[k],gl=await new Promise((y,n)=>new THREE.GLTFLoader().parse(json,'',y,n));
      const part=new THREE.Group();gl.scene.updateMatrixWorld(true);
      gl.scene.traverse(m=>{if(!m.isMesh||keep&&!keep.includes(m.name)&&!keep.includes(m.parent.name))return;const c=m.clone();c.geometry=m.geometry.clone().applyMatrix4(m.matrixWorld);
        c.position.set(0,0,0);c.rotation.set(0,0,0);c.scale.set(1,1,1);c.material=m.material.clone();c.material.name='scan:'+k+':'+m.material.name;
        for(const t of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(c.material[t])c.material[t].userData.mimeType='image/jpeg';part.add(c)});
      // turned, scaled, then set on the ground under its middle
      for(const c of part.children){c.geometry.rotateX(o.rx||0);c.geometry.rotateY(o.ry||0);c.geometry.scale(o.s||1,o.s||1,o.s||1)}
      const bb=new THREE.Box3().setFromObject(part),cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2;for(const c of part.children)c.geometry.translate(-cx,-bb.min.y,-cz);
      const node=new THREE.Group();node.name=k;
      for(const x of o.xs||[0])for(const [i,y] of (o.ys||[0]).entries())for(const c of part.children){const m=new THREE.Mesh(c.geometry,c.material);m.position.set(x+(i%2)*(o.jog||0),y,0);node.add(m)}
      out.add(node);const s=new THREE.Box3().setFromObject(node).getSize(new THREE.Vector3());
      let n=0;node.traverse(m=>{if(m.isMesh)n+=(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3});tri[k]=[Math.round(n),[s.x,s.y,s.z].map(v=>v.toFixed(2)).join('x')]}
    new THREE.GLTFExporter().parse(out,buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));ok({b64:btoa(s),tri})},no,{binary:true,maxTextureSize:512})}),src);
  const f=path.join(root,'models/scans.glb');fs.writeFileSync(f,Buffer.from(r.b64,'base64'));
  console.log(`models/scans.glb: ${(fs.statSync(f).size/1024).toFixed(0)} KB`);for(const k in r.tri)console.log(`  ${k}: ${r.tri[k][0]} triangles, ${r.tri[k][1]} m`)}
 finally{await b.close()}})();
