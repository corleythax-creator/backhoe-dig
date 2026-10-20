// Corley's Island: writes models/excavator.glb from tools/models/excavator.js. It runs the builder in headless Chromium
// with three.js r147 (the game's version) and its exporter, and prints the size and triangles per part.
//   NODE_PATH=$(npm root -g) node tools/build_model.js
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),CDN='https://cdn.jsdelivr.net/npm/three@0.147.0/';
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();p.on('pageerror',e=>{console.error(e.message);process.exitCode=1});
  await p.setContent('<html><body></body></html>');
  for(const f of ['build/three.min.js','examples/js/utils/BufferGeometryUtils.js','examples/js/geometries/RoundedBoxGeometry.js','examples/js/exporters/GLTFExporter.js'])await p.addScriptTag({url:CDN+f});
  await p.addScriptTag({path:path.join(root,'tools/models/excavator.js')});
  const r=await p.evaluate(()=>new Promise((ok,no)=>{const g=buildExcavator(),tri={};
    g.traverse(o=>{if(o.isMesh){const n=o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3;tri[o.parent.name]=(tri[o.parent.name]||0)+n}});
    new THREE.GLTFExporter().parse(g,buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));ok({b64:btoa(s),tri})},no,{binary:true})}));
  const out=path.join(root,'models/excavator.glb');fs.writeFileSync(out,Buffer.from(r.b64,'base64'));
  const all=Object.values(r.tri).reduce((a,b)=>a+b,0);
  console.log(`models/excavator.glb: ${(fs.statSync(out).size/1024).toFixed(0)} KB, ${Math.round(all)} triangles`,Object.fromEntries(Object.entries(r.tri).map(([k,v])=>[k,Math.round(v)])))}
 finally{await b.close()}})();
