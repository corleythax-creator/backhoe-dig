#!/usr/bin/env node
// Plays the game headless for a quick behaviour check: serves the repo, opens the game with no saved site (unless
// --keep), hides the start card, runs each --eval in the page in turn (game functions and globals are all there; an
// eval can await and return a value, which is printed as JSON), then optionally takes one screenshot. Prints any page
// errors and exits 1 if there were some. Keep checks to calling the game's functions (CLAUDE.md): a frame takes a
// second or more in software rendering.
//   NODE_PATH=$(npm root -g) node tools/play.js --eval "setMode('walk');return wk.x" --wait 2000 --shot /tmp/x.png
// Options: --eval CODE (repeatable), --steps FILE (a module exporting async (page, help) => result, for real clicks:
//   help.center(selector) gives a part's middle), --wait MS after each step (default 600), --size WxH (1100x620),
//   --gfx low|medium|high (switched after boot), --gfx0 low|med|high (from the first frame), --view CODE (a view code from the map editor's Copy view, "view X,Z,FACE,TILT,BACK": the
//   shot looks from there in the editor; --view-game pins it over the game instead), --shot FILE, --init FILE (run in the page before the game's scripts), FORGE_LOCAL=DIR in the environment (forge-studio's site served from that checkout; one beside this repo is used by itself), --keep (keep this browser's saves), --boot MS before the first step (3000).
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
    // a fresh browser has no saves; clearing them before the page's own scripts run beats a reload, which can stall
    // while the page saves on its way out
    if(!opt.keep)await p.addInitScript(()=>{if(!sessionStorage.getItem('playCleared')){for(const k of Object.keys(localStorage))if(k.startsWith('bhd_'))localStorage.removeItem(k);sessionStorage.setItem('playCleared','1')}});
    // --gfx0: that Graphics setting from the page's first frame, the way a phone starts on Low (--gfx switches after boot)
    // --init FILE: a script run in the page before any of the game's (to hook three.js or the browser from the start)
    // forge-studio's live site (the town's buildings, forgetown.js; the Forge things, props.js) served from a checkout:
    // FORGE_LOCAL=/path/to/forge-studio, or one beside this repo (as tools/scene-check.js does); FORGE_LOCAL=0 for the live site
    {const fl=process.env.FORGE_LOCAL,fs2=fl==='0'?'':path.resolve(fl||path.join(root,'../forge-studio')),FS='https://corley-forge-studio.vercel.app/';
      if(fs2&&fs.existsSync(path.join(fs2,'building/library/library.json')))await p.route(FS+'**',r=>{const f=path.join(fs2,decodeURIComponent(new URL(r.request().url()).pathname));
        if(!f.startsWith(fs2)||!fs.existsSync(f)||fs.statSync(f).isDirectory())return r.fulfill({status:404,body:''});r.fulfill({status:200,path:f,headers:{'access-control-allow-origin':'*'}})})}
    if(opt.init)await p.addInitScript({path:opt.init});
    if(opt.gfx0)await p.addInitScript(g=>{try{localStorage.setItem('bhd_gfx',g)}catch(e){}},opt.gfx0);
    await p.goto(`http://play.test:${port}/index.html`,{waitUntil:'load',timeout:120000});
    await p.waitForTimeout(+opt.boot);
    await p.evaluate(g=>{const h=document.getElementById('help');if(h)h.hidden=true;if(g&&typeof setGfx==='function')setGfx(g)},opt.gfx||'');
    const out=[];
    if(opt.view||opt['view-game']){out.push(await p.evaluate(([c,g])=>viewGo(c,g),[opt.view||opt['view-game'],!opt.view]));await p.waitForTimeout(+opt.wait)}
    for(const code of opt.eval){out.push(await p.evaluate(`(async()=>{${code}})()`).catch(e=>'ERROR: '+e.message));await p.waitForTimeout(+opt.wait)}
    if(opt.steps){const help={center:async s=>{const r=await p.locator(s).boundingBox();return [r.x+r.width/2,r.y+r.height/2]}};
      out.push(await require(path.resolve(opt.steps))(p,help));await p.waitForTimeout(+opt.wait)}
    if(opt.shot)await p.screenshot({path:opt.shot,timeout:180000});
    console.log(JSON.stringify({results:out,errors:errs},null,1));process.exitCode=errs.length?1:0}
  finally{await b.close();server.close()}});
