#!/usr/bin/env node
// Loads the game headless and prints what a release entry in data/effort.js needs, plus any errors:
//   tris   triangles in the scene (every visible mesh, instanced meshes times their count, shadow-only copies left out),
//          counted with no saved site or map, the way earlier entries were
//   chars  size in bytes of index.html, css/game.css and js/*.js (what the build log calls chars)
// Run from the repo root:  NODE_PATH=$(npm root -g) node tools/scene-check.js
// Needs Playwright and a Chromium (the cloud sessions have both; elsewhere: npm i -g playwright && npx playwright install chromium).
// Software rendering is slow (a frame can take a second or two), so the script waits rather than counting frames.
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
server.listen(0,async()=>{const port=server.address().port,errs=[];
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{const p=await b.newPage({viewport:{width:800,height:500}});
    p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
    // no saves: cleared before the page's scripts run (a reload can stall while the page saves on its way out)
    await p.addInitScript(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('bhd_'))localStorage.removeItem(k)});
    const t0=Date.now();await p.goto(`http://localhost:${port}/index.html`,{waitUntil:'load',timeout:120000});const loadMs=Date.now()-t0;
    await p.waitForTimeout(5000);
    const r=await p.evaluate(()=>{let tris=0;scene.traverse(o=>{if(!o.isMesh||o.userData.shProxy)return;for(let q=o;q;q=q.parent)if(!q.visible)return;
      const g=o.geometry;let t=(g.index?g.index.count:g.attributes.position.count)/3;if(o.isInstancedMesh)t*=o.count;tris+=t});
      const E=window.EFFORT,v=E&&E.versions[E.versions.length-1];return {tris:Math.round(tris),version:v&&v.v}});
    let chars=0;for(const f of ['index.html','css/game.css',...fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f)])chars+=fs.statSync(path.join(root,f)).size;
    console.log(JSON.stringify({buildLogVersion:r.version,tris:r.tris,chars,loadMs,errors:errs},null,1));
    process.exitCode=errs.length?1:0}
  finally{await b.close();server.close()}});
