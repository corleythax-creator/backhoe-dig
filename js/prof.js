// Corley's Island: the Profiler (☰ → Dev → Profiler). Two reports, to see what is slow and where:
// Loading: how long the page took to come up (the scripts, the loading cover), the slowest downloads (the browser's
//   resource timing: every file, its size and time), each game script's own running time at the start (from when its
//   load event came, start.js PF_BOOT.js, less the wait for its download), and every stretch the page froze 50 ms or
//   more (long tasks; with the browser's long-animation-frame timing, which script and function held it).
// Frames: Record times 10 s of play where you are (the scene: the nearest island or town, on foot or in what, inside a
//   room or not): every part the game's frame calls (each function frame() calls by name, wrapped while it records, so
//   bigger names like Drawing the frame include what they call), the time outside the game's code (the browser and the
//   graphics card), the graphics card's own time where the browser offers WebGL timer queries (desktop Chrome; not
//   iPhones), draw calls and triangles, the slowest frames with what was slow in each, and the heaviest things in view
//   (the scene's top-level groups by triangles). Each recording is kept, so record a few places and Copy them all.
// pfRecord(sec) records headless too (tools/play.js) and resolves with the report.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const PF={on:false,runs:[],tab:'load',loaf:[]};
// long animation frames from the moment this script runs (buffered: also those before), for both reports
try{new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.duration<100)continue;
  const sc=(e.scripts||[]).slice().sort((a,b)=>b.duration-a.duration).slice(0,3).map(s=>{const f=String(s.sourceURL||'').split('/').pop().split('?')[0];
    return (/^three\./.test(f)?'three.js drawing (building shaders, uploading to the graphics card)':(s.sourceFunctionName||s.invoker||s.invokerType||'script')+' ('+f+')')+' '+Math.round(s.duration)+' ms'});
  PF.loaf.push({t:e.startTime,ms:e.duration,sc});if(PF.loaf.length>600)PF.loaf.shift()}}).observe({type:'long-animation-frame',buffered:true})}catch(e){}
const pfMs=v=>v>=1000?(v/1000).toFixed(1)+' s':Math.round(v)+' ms',pfKB=b=>b>=1048576?(b/1048576).toFixed(1)+' MB':Math.round(b/1024)+' KB',pfFile=u=>String(u||'').split('?')[0].replace(location.origin+'/','').replace(/^https?:\/\//,'');
const pfEsc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
// ---------- Loading ----------
function pfLoadReport(){const B=typeof PF_BOOT==='object'?PF_BOOT:{js:[],long:[],done:0},R=performance.getEntriesByType('resource'),nav=performance.getEntriesByType('navigation')[0];
  const by={};for(const e of R)by[pfFile(e.name)]=e;
  const jsEnd=B.js.length?B.js[B.js.length-1][1]:0;
  // a script's own running time: from when it could start (the one before it done, and its file arrived) to its load event
  const sc=[];let prev=nav?nav.domInteractive:0;for(const [src,t] of B.js){const r=by[pfFile(src)],ready=Math.max(prev,r?r.responseEnd:0);sc.push([src,Math.max(0,t-ready)]);prev=t}
  sc.sort((a,b)=>b[1]-a[1]);
  const files=R.filter(e=>!/^data:|^blob:/.test(e.name)).map(e=>({f:pfFile(e.name),ms:e.duration,b:e.transferSize||e.encodedBodySize||0,at:e.startTime}));
  const tot=files.reduce((a,f)=>a+f.b,0),kind=f=>/\.(jpe?g|png|webp|ktx2|basis)$/i.test(f)?'Pictures':/\.(glb|gltf|bin)$/i.test(f)?'Models':/\.js$/i.test(f)?'Scripts':/\.(mp3|ogg|wav)$/i.test(f)?'Sounds':/\.json$/i.test(f)?'Data':'Other';
  const K={};for(const f of files){const k=kind(f.f);(K[k]=K[k]||{n:0,b:0,ms:0}).n++;K[k].b+=f.b;K[k].ms=Math.max(K[k].ms,f.at+f.ms)}
  const done=B.done||0,long=B.long.filter(l=>!done||l[0]<done),blocked=long.reduce((a,l)=>a+l[1],0);
  const loafs=PF.loaf.filter(l=>!done||l.t<done).sort((a,b)=>b.ms-a.ms).slice(0,10);
  return {nav:nav?{html:nav.responseEnd,dom:nav.domInteractive}:null,jsEnd,done,scripts:sc.slice(0,12),files:files.sort((a,b)=>b.ms-a.ms).slice(0,15),nFiles:files.length,tot,kinds:K,
    blocked,nLong:long.length,longs:long.slice().sort((a,b)=>b[1]-a[1]).slice(0,8),loafs}}
// ---------- Frames ----------
// the parts of the frame: every function frame() (main.js) calls by name
function pfParts(){const src=String(frame),seen=new Set();for(const m of src.matchAll(/(?<![\w$.])([a-zA-Z_$][\w$]*)\s*\(/g)){const n=m[1];
    if(seen.has(n)||n==='$'||/^(if|for|while|switch|return|function|catch|typeof|Math|Number|String|Object|Array|frame)$/.test(n))continue;if(typeof window[n]==='function'&&!/^[A-Z]/.test(n))seen.add(n)}
  seen.add('postRender');return [...seen]}
const PF_NAMES={postRender:'Drawing the frame',gpuWarmTick:'Uploading pictures to the graphics card',warmAllTick:'Warming shaders',tfTick:'Townsfolk',talkTick:'Townsfolk talk',
  townTick:'Town life',stlTick:'Street life (bus, vans)',jesTick:"Jessica's Island",marinaTick:'Marina',lakeTick:'Lake',brTick:'Bridges',plantTick:'Plants',gunTick:'Pistol',dnTick:'Day and night'};
const pfName=n=>PF_NAMES[n]||(typeof BHT_TIMED==='object'&&BHT_TIMED[n])||n;
function pfWhere(){const c=camera.position;let best='',bd=1e9;const N={corley:"Corley's Island",family:'Family Island',dexter:"Dexter's Island",jessica:"Jessica's Island",town:'Town',harbor:'Harbor',hills:'Hills'};
  if(typeof SPICK==='object')for(const k in SPICK.pins){const [x,z]=SPICK.pins[k],d=Math.hypot(c.x-x,c.z-z);if(d<bd){bd=d;best=N[k]||k}}
  const inR=typeof rmRoomAt==='function'&&rmRoomAt(c.x,c.z,c.y),what=($('#nowWhat')||{}).textContent||mode;
  return `${best}${inR?', inside':''} · ${what} · at ${Math.round(c.x/FT)}, ${Math.round(c.z/FT)} ft`}
// the scene's top-level groups in view, by triangles (an instanced mesh counts every copy drawn)
// counted as the game's own camera pass sees them: with the Graphics setting's tiny far detail, the indoor check and the
// islands' machines left out from town (gfxCullOn, gfxAway), and a draw call per material
function pfHeavy(){camera.updateMatrixWorld();const fr=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),out=[];
  gfxCullOn(camera);gfxAway(camera);gfxCull.mainF=fr;try{
  const nameOf=o=>{let n=o.name;if(!n)o.traverse(q=>{if(!n&&q.name)n=q.name});return n||(o.isInstancedMesh?'(instanced '+(o.material&&o.material.type||'')+')':'('+o.type+' '+(o.material&&o.material.type||'')+')')};
  for(const g of scene.children){if(!g.visible)continue;let tris=0,meshes=0;
    g.traverseVisible(o=>{if(!(o.isMesh||o.isPoints||o.isLine)||!o.geometry)return;const G=o.geometry;
      if(o.frustumCulled!==false&&!fr.intersectsObject(o))return;if(o.isInstancedMesh&&!o.count)return;
      const n=G.index?G.index.count:G.attributes.position?G.attributes.position.count:0,inst=o.isInstancedMesh?o.count:G.isInstancedBufferGeometry?G.instanceCount:1;tris+=(o.isMesh?n/3:n)*Math.min(inst,1e6);meshes+=Array.isArray(o.material)?Math.max(1,G.groups.length):1});
    if(meshes)out.push({n:nameOf(g)+(g.userData.pfSrc?' · '+g.userData.pfSrc+'.js':''),f:g.userData.pfSrc||'?',tris,meshes})}
  // and the same summed by the game file that added them
  }finally{gfxCull.on=false;while(gfxHid.length)gfxHid.pop().visible=true}
  const F={};for(const g of out){const e=F[g.f]||(F[g.f]={n:g.f+'.js (all)',tris:0,meshes:0});e.tris+=g.tris;e.meshes+=g.meshes}
  pfHeavyBy.length=0;pfHeavyBy.push(...Object.values(F).sort((a,b)=>b.tris-a.tris).slice(0,10));
  return out.sort((a,b)=>b.tris-a.tris).slice(0,12)}
const pfHeavyBy=[];
// record sec seconds of play here; resolves with the run (kept in PF.runs). Headless (tools/play.js) it steps the
// game's own frame with drawing (slow in software, but the split between the parts holds)
function pfRecord(sec){if(PF.on)return Promise.resolve(null);sec=sec||10;PF.on=true;const parts=pfParts(),orig={},acc={},run={where:pfWhere(),gfx:gfxCur.name||gfxKey,at:new Date().toLocaleTimeString(),frames:[],sec};
  for(const n of parts){const f=window[n];orig[n]=f;const w=function(){const t=performance.now();try{return f.apply(this,arguments)}finally{acc[n]=(acc[n]||0)+performance.now()-t}};w.pfW=1;window[n]=w}
  // the graphics card's own time (WebGL timer queries where offered), read back a few frames later
  let G=null;try{const gl=renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');if(ext)G={gl,ext,free:[],busy:[],ms:[]}}catch(e){}
  if(G){const pr=window.postRender;window.postRender=function(){let q=null;if(G.busy.length<6){q=G.free.pop()||G.gl.createQuery();G.gl.beginQuery(G.ext.TIME_ELAPSED_EXT,q)}
    try{return pr.apply(this,arguments)}finally{if(q){G.gl.endQuery(G.ext.TIME_ELAPSED_EXT);G.busy.push(q)}}}}
  const gpuPoll=()=>{if(!G)return;const gl=G.gl,dis=gl.getParameter(G.ext.GPU_DISJOINT_EXT);while(G.busy.length){const q=G.busy[0];if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))break;G.busy.shift();
    if(!dis)G.ms.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);G.free.push(q)}};
  const S={};let lastNow=0,t0=performance.now(),calls=0,tris=0,nf=0;const loaf0=PF.loaf.length;
  return new Promise(done=>{
    const step=now=>{for(const k in acc)delete acc[k];const c0=performance.now();frame(now);const cpu=performance.now()-c0;gpuPoll();
      const ft=lastNow?now-lastNow:0;lastNow=now;const ri=renderer.info.render;calls+=ri.calls;tris+=ri.triangles;nf++;
      let js=0;for(const k in acc){const s=S[k]||(S[k]={sum:0,max:0});s.sum+=acc[k];if(acc[k]>s.max)s.max=acc[k];js+=acc[k]}
      if(ft)run.frames.push({ft,cpu,top:Object.entries(acc).filter(e=>e[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>pfName(k)+' '+Math.round(v)+' ms')});
      const el=performance.now()-t0;if(typeof toast==='function'&&nf%15===0)toast(`Profiler: recording ${Math.max(0,Math.ceil(sec-el/1000))} s…`,'',800);
      if(el<sec*1000)return false;
      // put everything back
      for(const n of parts)if(window[n]&&window[n].pfW)window[n]=orig[n];if(G)window.postRender=orig.postRender;
      const F=run.frames.map(f=>f.ft).sort((a,b)=>a-b),n=F.length||1,avg=F.reduce((a,b)=>a+b,0)/n,low=F[Math.floor(n*0.99)]||0,cpuAvg=run.frames.reduce((a,f)=>a+f.cpu,0)/n;
      run.fps=1000/avg;run.low=1000/(low||1);run.worst=F[n-1]||0;run.cpu=cpuAvg;run.outside=Math.max(0,avg-cpuAvg);run.gpu=G&&G.ms.length?G.ms.reduce((a,b)=>a+b,0)/G.ms.length:null;
      run.calls=calls/nf;run.tris=tris/nf;run.parts=Object.entries(S).map(([k,v])=>({n:pfName(k),avg:v.sum/nf,max:v.max})).sort((a,b)=>b.avg-a.avg).slice(0,16);
      run.slow=run.frames.slice().sort((a,b)=>b.ft-a.ft).slice(0,6).map(f=>({ft:f.ft,top:f.top}));run.frames=null;
      run.loafs=PF.loaf.slice(loaf0).sort((a,b)=>b.ms-a.ms).slice(0,5);run.heavy=pfHeavy();run.heavyBy=pfHeavyBy.slice();run.mem=Object.assign({},renderer.info.memory,{programs:(renderer.info.programs||[]).length});
      PF.runs.push(run);PF.on=false;done(run);return true};
    if(typeof PF_HEADLESS!=='undefined'||navigator.webdriver){renderer.setAnimationLoop(null);const draw=()=>{if(!step(performance.now()))setTimeout(draw,0);else renderer.setAnimationLoop(frame)};draw();return}
    renderer.setAnimationLoop(now=>{if(step(now))renderer.setAnimationLoop(frame)})})}
// ---------- the panel ----------
function pfTable(head,rows){return `<div class="tablewrap"><table class="btab"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${pfEsc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`}
function pfLoadHtml(L){let h=`<div class="ticket"><div><span class="lbl">Page up</span> ${L.nav?pfMs(L.nav.dom):'?'} · <span class="lbl">scripts run</span> ${pfMs(L.jsEnd)} · <span class="lbl">loading cover done</span> ${L.done?pfMs(L.done):'not yet'}</div>
    <div><span class="lbl">Downloaded</span> ${L.nFiles} files, ${pfKB(L.tot)} · <span class="lbl">frozen while loading</span> ${pfMs(L.blocked)} in ${L.nLong} stretches over 50 ms</div></div>`;
  h+='<h2>By kind</h2>'+pfTable(['Kind','Files','Size','All in by'],Object.entries(L.kinds).sort((a,b)=>b[1].b-a[1].b).map(([k,v])=>[k,v.n,pfKB(v.b),pfMs(v.ms)]));
  h+='<h2>Slowest downloads</h2>'+pfTable(['File','Size','Took','Started'],L.files.map(f=>[f.f,pfKB(f.b),pfMs(f.ms),pfMs(f.at)]));
  h+='<h2>Scripts: own running time at the start</h2>'+pfTable(['Script','Ran for'],L.scripts.map(s=>[pfFile(s[0]),pfMs(s[1])]));
  if(L.loafs.length)h+='<h2>Longest freezes while loading</h2>'+pfTable(['At','Froze','What held it'],L.loafs.map(l=>[pfMs(l.t),pfMs(l.ms),l.sc.join(' · ')||'(the browser or graphics card)']));
  else if(L.longs.length)h+='<h2>Longest freezes while loading</h2>'+pfTable(['At','Froze'],L.longs.map(l=>[pfMs(l[0]),pfMs(l[1])]));
  return h}
function pfRunHtml(r,i){let h=`<h2>${i+1}. ${pfEsc(r.where)} <small>(${pfEsc(r.gfx)}, ${r.at})</small></h2><div class="ticket"><div><span class="lbl">${r.fps.toFixed(0)} FPS</span> average · ${r.low.toFixed(0)} FPS 1% low · slowest frame ${pfMs(r.worst)}</div>
    <div><span class="lbl">Frame</span> ${r.cpu.toFixed(1)} ms in the game's code, ${r.outside.toFixed(1)} ms outside it (browser, waiting on the graphics card)${r.gpu!=null?` · <span class="lbl">graphics card</span> ${r.gpu.toFixed(1)} ms drawing`:''}</div>
    <div><span class="lbl">Drawn</span> ${Math.round(r.calls)} draw calls, ${(r.tris/1e6).toFixed(2)} M triangles a frame · ${r.mem.programs} shaders, ${r.mem.textures} textures, ${r.mem.geometries} meshes on the card</div></div>`;
  h+=pfTable(['Part of the frame','Average','Worst'],r.parts.map(p=>[p.n,p.avg.toFixed(2)+' ms',pfMs(p.max)]));
  h+='<h3>Slowest frames</h3>'+pfTable(['Frame','Slow parts'],r.slow.map(s=>[pfMs(s.ft),s.top.join(', ')||'outside the game\'s code']));
  if(r.loafs.length)h+='<h3>Freezes (what the browser says held them)</h3>'+pfTable(['Froze','Script'],r.loafs.map(l=>[pfMs(l.ms),l.sc.join(' · ')||'(the browser or graphics card)']));
  h+='<h3>In view, by the game file that adds it</h3>'+pfTable(['File','Triangles','Draws'],(r.heavyBy||[]).map(g=>[g.n,g.tris>=1e6?(g.tris/1e6).toFixed(2)+' M':Math.round(g.tris/1000)+' k',g.meshes]));
  h+='<h3>Heaviest things in view</h3>'+pfTable(['Group','Triangles','Draws'],r.heavy.map(g=>[g.n,g.tris>=1e6?(g.tris/1e6).toFixed(2)+' M':Math.round(g.tris/1000)+' k',g.meshes]));
  return h}
function pfText(){const L=pfLoadReport(),T=[`Corley's Island profiler · ${window.EFFORT&&EFFORT.versions?'v'+EFFORT.versions[EFFORT.versions.length-1].v:''} · ${navigator.userAgent}`,
    `LOADING: page ${L.nav?pfMs(L.nav.dom):'?'}, scripts ${pfMs(L.jsEnd)}, cover done ${L.done?pfMs(L.done):'no'}; ${L.nFiles} files ${pfKB(L.tot)}; frozen ${pfMs(L.blocked)} in ${L.nLong}`,
    'Slowest downloads: '+L.files.slice(0,10).map(f=>`${f.f} ${pfKB(f.b)} ${pfMs(f.ms)}`).join('; '),'Scripts: '+L.scripts.slice(0,8).map(s=>`${pfFile(s[0])} ${pfMs(s[1])}`).join('; '),
    'Freezes: '+L.loafs.map(l=>`${pfMs(l.ms)} at ${pfMs(l.t)} [${l.sc.join(' · ')}]`).join('; ')];
  for(const r of PF.runs)T.push('',`SCENE ${r.where} (${r.gfx}): ${r.fps.toFixed(0)} fps, 1% low ${r.low.toFixed(0)}, worst ${pfMs(r.worst)}; game code ${r.cpu.toFixed(1)} ms, outside ${r.outside.toFixed(1)} ms${r.gpu!=null?', GPU '+r.gpu.toFixed(1)+' ms':''}; ${Math.round(r.calls)} calls ${(r.tris/1e6).toFixed(2)}M tris`,
    'Parts: '+r.parts.map(p=>`${p.n} ${p.avg.toFixed(2)}/${Math.round(p.max)}`).join('; '),'Slow frames: '+r.slow.map(s=>`${pfMs(s.ft)} [${s.top.join(', ')}]`).join('; '),
    'Freezes: '+r.loafs.map(l=>`${pfMs(l.ms)} [${l.sc.join(' · ')}]`).join('; '),'By file: '+(r.heavyBy||[]).map(g=>`${g.n} ${Math.round(g.tris/1000)}k/${g.meshes}`).join('; '),'Heaviest: '+r.heavy.map(g=>`${g.n} ${Math.round(g.tris/1000)}k/${g.meshes}`).join('; '));
  return T.join('\n')}
function pfPaint(){const b=$('#profBody');if(!b)return;for(const t of document.querySelectorAll('#profTabs [data-pt]'))t.setAttribute('aria-pressed',String(t.dataset.pt===PF.tab));
  $('#profRec').hidden=PF.tab!=='frames';
  b.innerHTML=PF.tab==='load'?pfLoadHtml(pfLoadReport()):PF.runs.length?PF.runs.map(pfRunHtml).reverse().join(''):'<p class="devline">Go to a place that stutters, open this and press Record: it times 10 seconds of play there (keep playing while it records). Record each place you want to compare; Copy sends them all.</p>'}
function pfOpen(){$('#prof').hidden=false;pfPaint()}
$('#profBtn').onclick=()=>{showMenu(false);pfOpen()};
$('#profClose').onclick=()=>{$('#prof').hidden=true};
for(const t of document.querySelectorAll('#profTabs [data-pt]'))t.onclick=()=>{PF.tab=t.dataset.pt;pfPaint()};
$('#profRec').onclick=()=>{$('#prof').hidden=true;pfRecord(10).then(r=>{if(!r)return;PF.tab='frames';pfOpen()})};
$('#profCopy').onclick=()=>{const t=pfText();const ok=()=>toast('Profiler results copied','',2500);try{navigator.clipboard.writeText(t).then(ok,()=>{const a=$('#profText');a.hidden=false;a.value=t;a.select()})}catch(e){const a=$('#profText');a.hidden=false;a.value=t;a.select()}};
