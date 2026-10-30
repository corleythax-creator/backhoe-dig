// Corley's Island: writes models/<name>.glb from tools/models/<name>.js, whose build<Name>() returns the model (every
// file there with no names given; name them to build only those). It runs the builder in headless Chromium with three.js
// r147 and its exporter, and prints the size and triangles per part (node).
//   NODE_PATH=$(npm root -g) node tools/build_model.js [excavator] [truck] [mower] [site] ...
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),CDN='https://cdn.jsdelivr.net/npm/three@0.147.0/';
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();p.on('pageerror',e=>{console.error(e.message);process.exitCode=1});
  await p.setContent('<html><body></body></html>');
  // bmRead(path): a repo file as base64, for builders that start from a model file (cars.js reads tools/models/cars_src)
  await p.exposeFunction('bmRead',f=>fs.readFileSync(path.join(root,f)).toString('base64'));
  for(const f of ['build/three.min.js','examples/js/utils/BufferGeometryUtils.js','examples/js/geometries/RoundedBoxGeometry.js','examples/js/exporters/GLTFExporter.js','examples/js/loaders/GLTFLoader.js'])await p.addScriptTag({url:CDN+f});
  for(const name of process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync(path.join(root,'tools/models')).filter(f=>f.endsWith('.js')).map(f=>f.slice(0,-3))){
  await p.addScriptTag({path:path.join(root,`tools/models/${name}.js`)});
  const r=await p.evaluate(fn=>Promise.resolve(window[fn]()).then(g=>new Promise((ok,no)=>{const tri={};
    g.traverse(o=>{if(o.isMesh){const n=o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3;tri[o.parent.name]=(tri[o.parent.name]||0)+n}});
    new THREE.GLTFExporter().parse(g,buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));ok({b64:btoa(s),tri})},no,{binary:true,maxTextureSize:1024})})),'build'+name[0].toUpperCase()+name.slice(1));
  const out=path.join(root,`models/${name}.glb`);fs.writeFileSync(out,Buffer.from(r.b64,'base64'));
  const all=Object.values(r.tri).reduce((a,b)=>a+b,0);
  console.log(`models/${name}.glb: ${(fs.statSync(out).size/1024).toFixed(0)} KB, ${Math.round(all)} triangles`,Object.fromEntries(Object.entries(r.tri).map(([k,v])=>[k,Math.round(v)])))}}
 finally{await b.close()}})();
