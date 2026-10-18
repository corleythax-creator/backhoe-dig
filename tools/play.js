#!/usr/bin/env node
// Plays the game headless for a quick behaviour check: serves the repo, opens the game with no saved site (unless
// --keep), hides the start card, runs each --eval in the page in turn (game functions and globals are all there; an
// eval can await and return a value, which is printed as JSON), then optionally takes one screenshot. Prints any page
// errors and exits 1 if there were some. Keep checks to calling the game's functions (CLAUDE.md): a frame takes a
// second or more in software rendering.
//   NODE_PATH=$(npm root -g) node tools/play.js --eval "setMode('walk');return wk.x" --wait 2000 --shot /tmp/x.png
// Options: --eval CODE (repeatable), --steps FILE (a module exporting async (page, help) => result, for real clicks:
//   help.center(selector) gives a part's middle), --wait MS after each step (default 600), --size WxH (1100x620),
//   --gfx low|medium|high, --shot FILE, --keep (keep this browser's saves), --boot MS before the first step (3000).
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),A=process.argv.slice(2),opt={eval:[],wait:600,size:'1100x620',boot:3000};
for(let i=0;i<A.length;i++){const k=A[i].replace(/^--/,'');if(k==='keep')opt.keep=true;else if(k==='eval')opt.eval.push(A[++i]);else opt[k]=A[++i]}
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
server.listen(0,async()=>{const port=server.address().port,errs=[],[w,h]=opt.size.split('x').map(Number);
  // the page is opened as http://play.test (mapped to this server), which is not one of the hosts the game syncs from
  // (localhost, 127.*, the Vercel site), so it makes no sync or live-skin calls
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--host-resolver-rules=MAP play.test 127.0.0.1']});
  try{const p=await b.newPage({viewport:{width:w,height:h}});
    p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
    await p.goto(`http://play.test:${port}/index.html`,{waitUntil:'load'});
    if(!opt.keep){await p.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('bhd_'))localStorage.removeItem(k)});await p.reload({waitUntil:'load'})}
    await p.waitForTimeout(+opt.boot);
    await p.evaluate(g=>{const h=document.getElementById('help');if(h)h.hidden=true;if(g&&typeof setGfx==='function')setGfx(g)},opt.gfx||'');
    const out=[];
    for(const code of opt.eval){out.push(await p.evaluate(`(async()=>{${code}})()`).catch(e=>'ERROR: '+e.message));await p.waitForTimeout(+opt.wait)}
    if(opt.steps){const help={center:async s=>{const r=await p.locator(s).boundingBox();return [r.x+r.width/2,r.y+r.height/2]}};
      out.push(await require(path.resolve(opt.steps))(p,help));await p.waitForTimeout(+opt.wait)}
    if(opt.shot)await p.screenshot({path:opt.shot,timeout:180000});
    console.log(JSON.stringify({results:out,errors:errs},null,1));process.exitCode=errs.length?1:0}
  finally{await b.close();server.close()}});
