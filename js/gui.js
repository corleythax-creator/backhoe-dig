// Corley's Island: the screen editor. Every part of the screen (the bars, buttons, gauges, sticks, panels and menus) can
// be restyled without touching the code: tap a part to pick it, then hide it, drag it, resize it, recolour it, rename it
// or give it any CSS; the Theme tab sets the colours and fonts everything shares. Changes can go to every screen, or to
// phones or big screens only. The result is a skin (JSON): edits save on this device as a draft straight away, and the
// owner publishes one, with the owner key, as the live look every device loads when the game opens (Supabase,
// supabase/island_gui.sql; only on the Vercel site, as sync is). The claude.ai screen editor (docs/gui-editor.html, made
// by tools/gui_editor.py) runs this same file over a copy of the screen and publishes through the owner's own
// Supabase connector.
// A skin: {v:1, t: when it went live (ms), L:{all|phone|big:{vars:{'--name':value}, el:{selector:{...}}, css}},
// text:{selector:text}}. An el entry: hide, x/y (px moved), sc (size %), fs (text px), fg (text colour), bg (background),
// rad (corners px), op (opacity %), css (any declarations).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md. This file needs nothing from the
// others (SYNC_URL and showMenu when they are there), so the claude.ai editor can load it alone.
const GUI_LS='bhd_gui',GUI_LIVE_LS='bhd_gui_live',GUI_KEY_LS='bhd_gui_key';
const GUI_SCOPES=[{k:'all',n:'Every screen',q:[]},{k:'phone',n:'Phones and small screens',q:['(max-width:900px)','(max-height:520px)']},
  {k:'big',n:'Big screens only',q:['(min-width:901px) and (min-height:521px)']}];
// the shared colours and fonts (css/game.css): name, label, c colour or f font
const GUI_VARS=[['--machine','Accent (machine orange)','c'],['--gas','Highlight (hazard yellow)','c'],['--ink','Text','c'],['--muted','Labels and dim text','c'],
  ['--ok','Good (green)','c'],['--danger','Warning (red)','c'],['--bar','Bars background','c'],['--hud','Panels background','c'],['--hud-line','Divider lines','c'],
  ['--f-display','Headings and numbers font','f'],['--f-body','Body text font','f']];
const GUI_FONTS=['"Saira Condensed","Arial Narrow",system-ui,sans-serif','"Saira",system-ui,sans-serif','system-ui,sans-serif','Arial,Helvetica,sans-serif',
  '"Arial Narrow",Arial,sans-serif','Verdana,sans-serif','"Trebuchet MS",sans-serif','Georgia,serif','Impact,"Arial Black",sans-serif','"Courier New",monospace'];
// parts that are usually hidden until the game needs them, shown on request so they can be styled
const GUI_PEEK=[['#menu','Menu'],['#help','Start card'],['#blkBar','Blocks bar'],['#walkBtns','Sprint and Jump'],['#seatBtn','Get in'],['#pumpBtn','Pump'],
  ['#boxBtn','Hook box'],['#lawnRow','Lawn gauge'],['#heatKey','Heatmap key'],['#updBtn','Update button']];
const GUI_TAGS={button:'button',span:'text',b:'text',div:'box',canvas:'drawing',select:'dropdown',input:'control',label:'label',p:'text',h1:'heading',h2:'heading',h3:'heading',h4:'heading',nav:'bar',header:'bar',footer:'bar',aside:'column'};
// doc and root: the page holding the screen (the claude.ai editor puts it in a stage box), media: how the phone and big
// screen layers are written (that editor sizes its stage with container queries), scale: the stage's zoom, host: the
// claude.ai editor's publish and load, dock: where that editor puts the panel, styleAt: where the skin's style sheet goes
// (last in the head; that editor's game CSS sits in the body, so it puts the skin after it)
const gui={doc:document,root:document.body,media:'@media',scale:()=>1,host:null,dock:null,
  skin:null,live:null,draft:false,open:false,pick:true,sel:'',el:null,scope:'all',tab:'el',undo:[],redo:[],pending:false,
  orig:new Map(),liveEls:new WeakSet(),peek:new Set(),down:null,hover:null,ui:null,box:null,hbox:null,msg:''};
const guiLayer=()=>({vars:{},el:{},css:''});
const guiNew=()=>({v:1,t:0,L:{all:guiLayer(),phone:guiLayer(),big:guiLayer()},text:{}});
function guiNorm(o){const s=guiNew();if(!o||typeof o!=='object')return s;s.t=+o.t||0;
  for(const sc of GUI_SCOPES){const l=o.L&&o.L[sc.k];if(!l||typeof l!=='object')continue;
    if(l.vars&&typeof l.vars==='object')for(const [k,v] of Object.entries(l.vars))if(/^--[\w-]+$/.test(k)&&typeof v==='string'&&v)s.L[sc.k].vars[k]=v;
    if(l.el&&typeof l.el==='object')for(const [k,v] of Object.entries(l.el))if(v&&typeof v==='object')s.L[sc.k].el[k]=Object.assign({},v);
    if(typeof l.css==='string')s.L[sc.k].css=l.css}
  if(o.text&&typeof o.text==='object')for(const [k,v] of Object.entries(o.text))if(typeof v==='string')s.text[k]=v;
  return s}
const guiCopy=s=>guiNorm(JSON.parse(JSON.stringify(s)));
function guiParse(t){try{return t?guiNorm(JSON.parse(t)):null}catch(e){return null}}
function guiLs(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
const guiEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

// ---------- the skin as CSS ----------
function guiDecl(p){const d=[];
  if(+p.x||+p.y)d.push(`translate:${+p.x||0}px ${+p.y||0}px`);
  if(p.sc!==undefined&&+p.sc!==100)d.push(`scale:${+p.sc/100}`);
  if(+p.fs)d.push(`font-size:${+p.fs}px!important`);
  if(p.fg)d.push(`color:${p.fg}!important`);
  if(p.bg)d.push(`background:${p.bg}!important`);
  if(p.rad!==undefined)d.push(`border-radius:${+p.rad}px!important`);
  if(p.op!==undefined&&+p.op!==100)d.push(`opacity:${+p.op/100}!important`);
  return d.join(';')}
function guiCss(s){let out='';
  for(const sc of GUI_SCOPES){const L=s.L[sc.k],v=Object.entries(L.vars);let r='';
    if(v.length)r+=`:root,#hud{${v.map(([k,x])=>k+':'+x).join(';')}}\n`;
    for(const [sel,p] of Object.entries(L.el)){const d=guiDecl(p);if(d)r+=`${sel}{${d}}\n`;if(p.hide)r+=`${sel}{display:none!important}\n`;if(p.css)r+=`${sel}{${p.css}}\n`}
    if(L.css)r+=L.css+'\n';
    if(r)out+=sc.q.length?sc.q.map(q=>`${gui.media} ${q}{\n${r}}\n`).join(''):r}
  return out}
// the skin onto the page: one style sheet after the game's own, and the renamed text. A text change only takes on a
// part with no parts inside it; the game's later writes to a renamed part are put back (guiMut)
function guiApply(){const d=gui.doc;let st=d.getElementById('guiSkin');
  if(!st){st=d.createElement('style');st.id='guiSkin'}
  const par=gui.styleAt||d.head;if(st!==par.lastElementChild)par.appendChild(st);
  st.textContent=guiCss(gui.skin);guiTexts()}
function guiTexts(){const want=new Map();
  for(const [sel,t] of Object.entries(gui.skin.text)){let els=[];try{els=gui.doc.querySelectorAll(sel)}catch(e){}for(const e of els)if(!e.firstElementChild)want.set(e,t)}
  for(const [e,t] of gui.orig)if(!want.has(e)){e.textContent=t;gui.orig.delete(e)}
  for(const [e,t] of want){if(!gui.orig.has(e))gui.orig.set(e,e.textContent);if(e.textContent!==t)e.textContent=t}
  guiWatch()}
let guiMO=null;
function guiWatch(){const need=gui.open||gui.orig.size>0;
  if(need&&!guiMO){guiMO=new MutationObserver(guiMut);guiMO.observe(gui.doc.body,{subtree:true,childList:true,characterData:true})}
  else if(!need&&guiMO){guiMO.disconnect();guiMO=null}}
// while the editor is open, parts whose text the game keeps changing (gauges, the frame rate) are noted, so they are not
// offered for renaming
function guiMut(recs){let fix=false;
  for(const r of recs){const e=r.target.nodeType===3?r.target.parentElement:r.target;if(!e||gui.ui&&gui.ui.contains(e)||e===gui.box||e===gui.hbox)continue;
    if(gui.orig.has(e))fix=true;else if(gui.open)gui.liveEls.add(e)}
  if(fix)for(const [e] of gui.orig){const t=guiTextOf(e);if(t!==undefined&&e.textContent!==t)e.textContent=t}}
function guiTextOf(e){for(const [sel,t] of Object.entries(gui.skin.text)){try{if(e.matches(sel))return t}catch(err){}}}

// ---------- drafts, the live look and publishing ----------
const GUI_NET=typeof SYNC_URL!=='undefined'&&!!SYNC_URL&&/(^|\.)vercel\.app$|^localhost$|^127\./.test(location.hostname)&&!/\/versions\//.test(location.pathname);
async function guiRpc(fn,body){const r=await fetch(SYNC_URL+'/rest/v1/rpc/'+fn,{method:'POST',
    headers:{'Content-Type':'application/json',apikey:SYNC_KEY,Authorization:'Bearer '+SYNC_KEY},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('gui '+r.status);return r.json()}
function guiBoot(){gui.live=guiParse(guiLs(GUI_LIVE_LS));const d=guiParse(guiLs(GUI_LS));
  gui.skin=d||(gui.live?guiCopy(gui.live):guiNew());gui.draft=!!d;guiApply();guiFetch()}
// a newer live look: kept for the next start too, and shown now unless this device has unpublished changes
function guiTakeLive(s){gui.live=s;guiLs(GUI_LIVE_LS,JSON.stringify(s));if(!gui.draft){gui.skin=guiCopy(s);guiApply();guiRender()}else guiStatus()}
async function guiFetch(){
  try{if(gui.host){const s=await gui.host.load();if(s&&(!gui.live||s.t>gui.live.t))guiTakeLive(s);return}
    if(!GUI_NET)return;
    const rows=await guiRpc('gui_get',{}),r=rows&&rows[0];if(!r||gui.live&&+r.t<=gui.live.t)return;
    const s=guiParse(r.data);if(s){s.t=+r.t;guiTakeLive(s)}}
  catch(e){gui.msg=gui.host?String(e&&e.message||e):'';guiStatus()}}
let guiSaveT=0;
function guiSaveSoon(){clearTimeout(guiSaveT);guiSaveT=setTimeout(guiSave,250)}
function guiSave(){clearTimeout(guiSaveT);const a=JSON.stringify(Object.assign({},gui.skin,{t:0})),b=JSON.stringify(Object.assign({},gui.live||guiNew(),{t:0}));
  gui.draft=a!==b;guiLs(GUI_LS,gui.draft?JSON.stringify(gui.skin):null);guiStatus()}
async function guiPublish(){guiSave();const key=gui.ui.querySelector('[data-f=key]'),k=key?key.value.trim():'';if(key)guiLs(GUI_KEY_LS,k);
  if(!gui.host&&!GUI_NET){gui.msg='Publishing works on the game\'s website (corleys-island.vercel.app), not this copy.';guiStatus();return}
  if(!gui.host&&!k){gui.msg='Type the owner key first.';guiStatus();return}
  gui.msg='Publishing…';guiStatus();const data=JSON.stringify(Object.assign({},gui.skin,{t:0}));
  try{const t=gui.host?await gui.host.publish(data):await guiRpc('gui_put',{p_key:k,p_data:data});
    if(!(t>0)){gui.msg='That owner key is not right. Nothing was published.';guiStatus();return}
    gui.skin.t=+t;gui.live=guiCopy(gui.skin);guiLs(GUI_LIVE_LS,JSON.stringify(gui.live));guiLs(GUI_LS,null);gui.draft=false;
    gui.msg='Published. Every device gets this look the next time the game opens.'}
  catch(e){gui.msg=gui.host?'Could not publish: '+(e&&e.message||e):'Could not reach the server. Your changes are still saved here.'}
  guiStatus()}
function guiSetSkin(s,msg){guiPush();gui.skin=s;gui.pending=false;guiApply();guiSave();gui.msg=msg||'';guiRender()}

// ---------- editing ----------
function guiPush(){gui.undo.push(JSON.stringify(gui.skin));if(gui.undo.length>100)gui.undo.shift();gui.redo=[]}
// one change: slider drags and drags of a part count as one step for Undo until they let go
function guiEdit(fn){if(!gui.pending){guiPush();gui.pending=true}gui.msg='';fn();guiClean();guiApply();guiSaveSoon();guiUndoBtns()}
function guiCommit(){gui.pending=false}
function guiClean(){for(const sc of GUI_SCOPES){const L=gui.skin.L[sc.k];
    for(const [k,p] of Object.entries(L.el)){for(const [a,v] of Object.entries(p))if(v===''||v===null||v===undefined||v===false)delete p[a];if(!Object.keys(p).length)delete L.el[k]}
    for(const [k,v] of Object.entries(L.vars))if(!v)delete L.vars[k]}}
function guiUndo(redo){const a=redo?gui.redo:gui.undo,b=redo?gui.undo:gui.redo;if(!a.length)return;
  b.push(JSON.stringify(gui.skin));gui.skin=guiNorm(JSON.parse(a.pop()));gui.pending=false;guiApply();guiSave();guiRender()}
const guiEntry=make=>{const L=gui.skin.L[gui.scope].el;if(!L[gui.sel]&&make)L[gui.sel]={};return L[gui.sel]||{}};
// what to call a part, and the ways to aim a change at it: just this one (by its id, or its place under the nearest
// part with an id), everything sharing one of its styles, or every part of its kind in the same box
function guiName(e){if(!e)return '';const t=(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').trim().replace(/\s+/g,' ');
  return t?'“'+(t.length>30?t.slice(0,29)+'…':t)+'”':e.id?'#'+e.id:(GUI_TAGS[e.tagName.toLowerCase()]||e.tagName.toLowerCase())}
function guiPath(el){const p=[];let e=el;
  while(e&&e.nodeType===1&&e!==gui.root&&e!==gui.doc.body){if(e.id){p.unshift('#'+CSS.escape(e.id));return p.join(' > ')}
    const par=e.parentElement;if(!par)return null;p.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...par.children].indexOf(e)+1})`);e=par}
  return null}
function guiSels(el){const o=[],p=guiPath(el),tag=el.tagName.toLowerCase();if(p)o.push([p,'Just this one']);
  for(const c of el.classList)if(!/^gui/.test(c))o.push(['.'+CSS.escape(c),`Everything styled “${c}”`]);
  const box=el.parentElement&&el.parentElement.closest('[id]'),bp=box&&guiPath(box);
  if(bp&&box!==gui.doc.body)o.push([`${bp} ${tag}`,`Every ${GUI_TAGS[tag]||tag} in ${guiName(box).length>24?'#'+box.id:guiName(box)}`]);
  return o}
function guiPick(t){while(t&&t.closest&&t.closest('svg'))t=t.closest('svg').parentElement;
  if(!t||t===gui.root||t===gui.doc.body||t===gui.doc.documentElement||t.id==='view'||t.id==='hud'){gui.el=null;gui.sel=''}
  else{gui.el=t;const o=guiSels(t);gui.sel=o.length?o[0][0]:''}
  if(!gui.sel)gui.el=null;gui.tab='el';guiRender()}
function guiSelect(sel){gui.sel=sel;let e=null;try{e=gui.doc.querySelector(sel)}catch(err){}gui.el=e;gui.tab='el';guiRender()}

// ---------- picking on the screen ----------
const GUI_EV=['pointerdown','pointerup','click','dblclick','mousedown','mouseup','touchstart','touchend','contextmenu'];
function guiListen(on){const w=gui.doc.defaultView,f=on?'addEventListener':'removeEventListener';
  for(const t of GUI_EV)w[f](t,guiEv,{capture:true,passive:false});w[f]('pointermove',guiMove,{capture:true,passive:false})}
const guiMine=e=>!!(gui.ui&&gui.ui.contains(e));
function guiEv(e){if(!gui.open||!gui.pick)return;let t=e.target;if(t&&t.nodeType===3)t=t.parentElement;if(!t||guiMine(t)||!gui.root.contains(t))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.type==='pointerdown'){const drag=!!(gui.el&&gui.sel&&(gui.el===t||gui.el.contains(t)));const p=guiEntry(false);
    gui.down={x:e.clientX,y:e.clientY,t,moved:false,drag,x0:+p.x||0,y0:+p.y||0}}
  else if(e.type==='pointerup'&&gui.down){const d=gui.down;gui.down=null;if(!d.moved)guiPick(d.t);else{guiCommit();guiRender()}}}
function guiMove(e){if(!gui.open||!gui.pick)return;let t=e.target;if(t&&t.nodeType===3)t=t.parentElement;
  const d=gui.down;if(!d){gui.hover=t&&!guiMine(t)&&gui.root.contains(t)?t:null;return}
  e.preventDefault();e.stopImmediatePropagation();
  const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>5)d.moved=true;
  if(d.drag&&d.moved){const k=gui.scale()||1;guiEdit(()=>{const p=guiEntry(true);p.x=Math.round(d.x0+dx/k);p.y=Math.round(d.y0+dy/k)});
    const f=gui.ui.querySelector('[data-f=x]'),g=gui.ui.querySelector('[data-f=y]');if(f)f.value=guiEntry(false).x||0;if(g)g.value=guiEntry(false).y||0}}
// the picked part's outline (solid) and the one under the mouse (dashed), kept on the parts while the editor is open
function guiFrame(){if(!gui.open){gui.box.hidden=gui.hbox.hidden=true;gui.framing=false;return}gui.framing=true;
  const put=(b,e)=>{if(!e||!e.isConnected){b.hidden=true;return}const r=e.getBoundingClientRect();if(!r.width&&!r.height){b.hidden=true;return}
    b.hidden=false;Object.assign(b.style,{left:r.left-3+'px',top:r.top-3+'px',width:r.width+6+'px',height:r.height+6+'px'})};
  put(gui.box,gui.el);put(gui.hbox,gui.pick&&gui.hover!==gui.el&&gui.hover&&gui.hover.id!=='view'&&gui.hover.id!=='hud'?gui.hover:null);
  requestAnimationFrame(guiFrame)}
function guiPeek(sel,on){let e=null;try{e=gui.doc.querySelector(sel)}catch(err){}if(!e)return;
  if(on){if(e.hidden){e.hidden=false;gui.peek.add(sel)}}else if(gui.peek.has(sel)){e.hidden=true;gui.peek.delete(sel)}}

// ---------- the panel ----------
const GUI_STYLE=`
.guiPicking #hud *:not(.sticks):not(.rpane),.guiPicking #editor *{pointer-events:auto!important}
.guiPicking #hud *,.guiPicking #editor *,.guiPicking #help *{cursor:crosshair!important}
#guiBox,#guiHBox{position:fixed;z-index:2147483600;pointer-events:none;border:3px solid #34d6ff;border-radius:6px;box-shadow:0 0 0 2px rgba(0,0,0,.6)}
#guiHBox{border:2px dashed rgba(255,255,255,.8);box-shadow:none}
#guiPanel{position:fixed;z-index:2147483640;top:0;right:0;bottom:0;width:380px;max-width:100%;box-sizing:border-box;display:flex;flex-direction:column;
  background:#171a14;color:#f3f5ef;border-left:2px solid #f07a22;font:500 16px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;
  box-shadow:-8px 0 24px rgba(0,0,0,.45);-webkit-user-select:none;user-select:none;touch-action:auto;pointer-events:auto}
#guiPanel.left{right:auto;left:0;border-left:0;border-right:2px solid #f07a22;box-shadow:8px 0 24px rgba(0,0,0,.45)}
#guiPanel.dock{position:relative;inset:auto;width:100%;height:100%;border-left:0;box-shadow:none}
@media (max-width:640px){#guiPanel:not(.dock){top:auto;left:0;width:auto;height:54vh;border-left:0;border-top:2px solid #f07a22}}
#guiPanel.min:not(.dock){height:auto}#guiPanel.min .gbody,#guiPanel.min .gtabs,#guiPanel.min .grow0{display:none}
#guiPanel *{box-sizing:border-box}
#guiPanel .ghead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.14)}
#guiPanel .ghead b{flex:1;font-size:19px;letter-spacing:.02em}
#guiPanel button,#guiPanel select,#guiPanel input,#guiPanel textarea{font:inherit;color:inherit;text-transform:none;letter-spacing:normal;box-shadow:none;width:auto;height:auto}
#guiPanel button{min-height:42px;padding:0 14px;border-radius:9px;border:1px solid rgba(255,255,255,.22);background:#2a2f25;cursor:pointer}
#guiPanel button:hover{background:#353b2f}#guiPanel button:disabled{opacity:.4;cursor:default}
#guiPanel button.go{background:#f07a22;color:#1c1309;border-color:#f07a22;font-weight:700}
#guiPanel button[aria-pressed=true]{background:#34d6ff;color:#06222b;border-color:#34d6ff;font-weight:700}
#guiPanel button.sm{min-height:34px;padding:0 10px;font-size:14px}
#guiPanel .gtabs{display:flex;gap:6px;padding:8px 12px 0}
#guiPanel .gtabs button{flex:1;border-radius:9px 9px 0 0;border-bottom:0}
#guiPanel .gtabs button[aria-selected=true]{background:#f07a22;color:#1c1309;font-weight:700;border-color:#f07a22}
#guiPanel .grow0{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.14);background:#1f231b}
#guiPanel .grow0 label{display:flex;align-items:center;gap:8px;width:100%;font-size:15px;color:#c3ccbb}
#guiPanel .grow0 select{flex:1}
#guiPanel .gbody{flex:1;overflow:auto;padding:12px;-webkit-overflow-scrolling:touch}
#guiPanel h3{margin:14px 0 6px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#f5c518}
#guiPanel h3:first-child{margin-top:0}
#guiPanel .gf{display:grid;grid-template-columns:118px 1fr auto;align-items:center;gap:6px 8px;margin:6px 0}
#guiPanel .gf>span{font-size:15px;color:#c3ccbb}
#guiPanel .gf output{min-width:48px;text-align:right;font-variant-numeric:tabular-nums}
#guiPanel select,#guiPanel input[type=text],#guiPanel input[type=number],#guiPanel input[type=password],#guiPanel textarea{min-height:40px;width:100%;padding:6px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#0f110d}
#guiPanel textarea{min-height:76px;font:14px/1.35 ui-monospace,Menlo,Consolas,monospace;resize:vertical;-webkit-user-select:text;user-select:text}
#guiPanel input[type=text],#guiPanel input[type=password]{-webkit-user-select:text;user-select:text}
#guiPanel input[type=range]{width:100%;accent-color:#f07a22;min-height:32px}
#guiPanel input[type=color]{width:48px;height:38px;padding:2px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#0f110d}
#guiPanel input[type=checkbox]{width:24px;height:24px;accent-color:#f07a22}
#guiPanel .gcol{display:flex;align-items:center;gap:8px}
#guiPanel .gnote{font-size:14px;color:#c3ccbb;margin:6px 0}
#guiPanel .gwho{font-size:17px;font-weight:700;margin:0 0 6px;word-break:break-word}
#guiPanel .gbtns{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
#guiPanel .glist{display:flex;flex-direction:column;gap:6px}
#guiPanel .glist button{text-align:left;font-size:14px;min-height:38px;word-break:break-all}
#guiPanel .gstat{margin:0;padding:9px 12px;border-top:1px solid rgba(255,255,255,.14);font-size:14px;color:#c3ccbb;min-height:40px}
#guiPanel .gpeek{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#guiPanel .gpeek label{display:flex;align-items:center;gap:8px;font-size:15px}
#guiPanel code{font-size:13px;color:#9fdcf0;word-break:break-all}
`;
function guiBuild(){if(gui.ui)return;const d=gui.doc,host=gui.dock?gui.dock.ownerDocument:d;
  if(!d.getElementById('guiStyle')){const st=d.createElement('style');st.id='guiStyle';st.textContent=GUI_STYLE;d.head.appendChild(st)}
  if(host!==d&&!host.getElementById('guiStyle')){const st=host.createElement('style');st.id='guiStyle';st.textContent=GUI_STYLE;host.head.appendChild(st)}
  gui.box=d.createElement('div');gui.box.id='guiBox';gui.box.hidden=true;gui.hbox=d.createElement('div');gui.hbox.id='guiHBox';gui.hbox.hidden=true;
  d.body.appendChild(gui.box);d.body.appendChild(gui.hbox);
  const p=host.createElement('div');p.id='guiPanel';p.setAttribute('role','dialog');p.setAttribute('aria-label','Screen editor');if(gui.dock)p.classList.add('dock');
  p.innerHTML=`<div class="ghead"><b>Screen editor</b>${gui.dock?'':'<button class="sm" data-a="side" aria-label="Move the editor to the other side" title="Other side">⇆</button><button class="sm" data-a="min" aria-label="Fold the editor away">▾</button>'}<button class="sm" data-a="undo" disabled>Undo</button><button class="sm" data-a="redo" disabled>Redo</button>${gui.dock?'':'<button class="go sm" data-a="close">Done</button>'}</div>
<div class="grow0"><button data-a="pick" aria-pressed="true">Tap to pick: on</button><label>Changes go to <select data-f="scope">${GUI_SCOPES.map(s=>`<option value="${s.k}">${s.n}</option>`).join('')}</select></label></div>
<div class="gtabs" role="tablist"><button role="tab" data-t="el">Parts</button><button role="tab" data-t="theme">Theme</button><button role="tab" data-t="share">Publish</button></div>
<div class="gbody"></div><p class="gstat" aria-live="polite"></p>`;
  if(!gui.dock&&guiLs('bhd_gui_side'))p.classList.add('left');
  (gui.dock||d.body).appendChild(p);gui.ui=p;
  // typing in the editor must not drive the machines
  for(const t of ['keydown','keyup','keypress'])p.addEventListener(t,e=>{e.stopPropagation();if(t==='keydown'&&e.key==='Escape'&&!gui.dock)guiOpen(false)});
  p.addEventListener('click',guiClick);p.addEventListener('input',guiInput);p.addEventListener('change',e=>{guiInput(e);guiCommit()});
  p.addEventListener('pointerup',guiCommit)}
function guiOpen(on){guiBuild();gui.open=on;gui.ui.hidden=!on;guiListen(on);gui.doc.documentElement.classList.toggle('guiPicking',on&&gui.pick);
  if(on){guiRender();if(!gui.framing)requestAnimationFrame(guiFrame)}else{gui.el=null;gui.sel='';gui.hover=null;for(const s of [...gui.peek])guiPeek(s,false);guiCommit();guiSave()}
  guiWatch()}
function guiUndoBtns(){if(!gui.ui)return;gui.ui.querySelector('[data-a=undo]').disabled=!gui.undo.length;gui.ui.querySelector('[data-a=redo]').disabled=!gui.redo.length}
function guiStatus(){if(!gui.ui)return;const lv=gui.live&&gui.live.t?new Date(gui.live.t).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
  const what=gui.draft?'Showing your unpublished changes (saved on this device).':lv?`Showing the live look, published ${lv}.`:'Showing the original look.';
  gui.ui.querySelector('.gstat').textContent=gui.msg?gui.msg:what;guiUndoBtns()}
// a colour as #rrggbb plus its opacity, from any CSS colour
function guiRgb(s){const c=gui.doc.createElement('canvas').getContext('2d');c.fillStyle='#000';c.fillStyle=s||'#000';const v=c.fillStyle;
  if(v[0]==='#')return {hex:v,a:1};const m=v.match(/[\d.]+/g)||[0,0,0];
  return {hex:'#'+[0,1,2].map(i=>Math.round(+m[i]).toString(16).padStart(2,'0')).join(''),a:m[3]!==undefined?+m[3]:1}}
function guiRgba(hex,a){if(a>=0.995)return hex;const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${Math.round(a*100)/100})`}
const guiCS=()=>gui.el?gui.doc.defaultView.getComputedStyle(gui.el):null;
function guiVar(n){const h=gui.doc.getElementById('hud')||gui.doc.documentElement;return gui.doc.defaultView.getComputedStyle(h).getPropertyValue(n).trim()}
function guiRow(label,inner,extra){return `<div class="gf"><span>${label}</span>${inner}${extra||'<i></i>'}</div>`}
function guiRender(){if(!gui.ui||!gui.open&&!gui.dock)return;const p=gui.ui;
  p.querySelectorAll('[data-t]').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===gui.tab));
  p.querySelector('[data-f=scope]').value=gui.scope;
  const pk=p.querySelector('[data-a=pick]');pk.setAttribute('aria-pressed',gui.pick);pk.textContent='Tap to pick: '+(gui.pick?'on':'off');
  const b=p.querySelector('.gbody');b.innerHTML=gui.tab==='theme'?guiThemeHtml():gui.tab==='share'?guiShareHtml():guiElHtml();guiStatus()}
function guiElHtml(){const sc=GUI_SCOPES.find(s=>s.k===gui.scope).n.toLowerCase();
  if(!gui.sel){const L=gui.skin.L[gui.scope],keys=[...new Set([...Object.keys(L.el),...(gui.scope==='all'?Object.keys(gui.skin.text):[])])];
    return `<p class="gnote">${gui.pick?'Tap any part of the screen to pick it. Drag a picked part to move it.':'Picking is off, so the game works as usual: open a menu or switch machine, then turn picking back on.'}</p>
<h3>Usually hidden</h3><p class="gnote">Show these to style them; they go back to normal when the editor closes.</p>
<div class="gpeek">${GUI_PEEK.map(([s,n])=>{let e=null;try{e=gui.doc.querySelector(s)}catch(err){}return e?`<label><input type="checkbox" data-peek="${guiEsc(s)}" ${gui.peek.has(s)?'checked':''}>${n}</label>`:''}).join('')}</div>
<h3>Changed for ${sc}</h3>${keys.length?`<div class="glist">${keys.map(k=>`<button data-go="${guiEsc(k)}">${guiEsc(guiLabelOf(k))}</button>`).join('')}</div><p class="gnote">Hidden parts can only be picked from this list.</p>`:'<p class="gnote">Nothing yet.</p>'}`}
  const e=gui.el,p=guiEntry(false),cs=guiCS(),opts=e?guiSels(e):[];if(!opts.some(o=>o[0]===gui.sel))opts.unshift([gui.sel,'This selection']);
  const fg=guiRgb(p.fg||(cs?cs.color:'#fff')),bg=guiRgb(p.bg||(cs?cs.backgroundColor:'rgba(0,0,0,0)'));
  const live=e&&(e.firstElementChild||gui.liveEls.has(e)&&!gui.orig.has(e)),txt=gui.skin.text[gui.sel];
  const fsNow=cs?Math.round(parseFloat(cs.fontSize)):16,radNow=cs?Math.round(parseFloat(cs.borderTopLeftRadius)||0):0;
  return `<p class="gwho">${e?guiEsc(guiName(e)):'(not on screen right now)'}</p>
<div class="gf"><span>Change</span><select data-f="sel" style="grid-column:2/4">${opts.map(o=>`<option value="${guiEsc(o[0])}" ${o[0]===gui.sel?'selected':''}>${guiEsc(o[1])}</option>`).join('')}</select></div>
<p class="gnote"><code>${guiEsc(gui.sel)}</code></p>
<div class="gbtns"><button class="sm" data-a="parent" ${e&&e.parentElement&&guiPath(e.parentElement)?'':'disabled'}>Pick the box around it</button><button class="sm" data-a="reset">Undo all changes to it</button><button class="sm" data-a="none">Pick nothing</button></div>
<h3>Show</h3>
${guiRow('Hide it',`<input type="checkbox" data-f="hide" ${p.hide?'checked':''}>`)}
${guiRow('Opacity',`<input type="range" min="0" max="100" step="5" data-f="op" value="${p.op!==undefined?p.op:100}">`,`<output data-o="op">${p.op!==undefined?p.op:100}%</output>`)}
<h3>Words</h3>
${live?`<p class="gnote">${e&&e.firstElementChild?'This part holds other parts; pick the words themselves to rename them.':'The game keeps changing these words, so they can\'t be renamed.'}</p>`:
  guiRow('Text',`<input type="text" data-f="text" value="${guiEsc(txt!==undefined?txt:e?e.textContent:'')}" ${gui.scope!=='all'?'disabled':''}>`,`<button class="sm" data-clr="text" title="Back to the original words">↺</button>`)+(gui.scope!=='all'?'<p class="gnote">Words change on every screen at once: switch to Every screen to rename.</p>':'')}
${guiRow('Text size',`<input type="range" min="0" max="64" step="1" data-f="fs" value="${p.fs||0}">`,`<output data-o="fs">${p.fs?p.fs+' px':'as is ('+fsNow+')'}</output>`)}
${guiRow('Text colour',`<div class="gcol"><input type="color" data-f="fg" value="${fg.hex}"></div>`,`<button class="sm" data-clr="fg" title="Back to the original colour">↺</button>`)}
<h3>Size and place</h3>
${guiRow('Size',`<input type="range" min="30" max="300" step="5" data-f="sc" value="${p.sc||100}">`,`<output data-o="sc">${p.sc||100}%</output>`)}
${guiRow('Move right',`<input type="number" step="1" data-f="x" value="${p.x||0}">`,'<span>px</span>')}
${guiRow('Move down',`<input type="number" step="1" data-f="y" value="${p.y||0}">`,'<span>px</span>')}
<p class="gnote">Or drag the outlined part on the screen.</p>
<h3>Box</h3>
${guiRow('Background',`<div class="gcol"><input type="color" data-f="bg" value="${bg.hex}"><input type="range" min="0" max="100" step="5" data-f="bga" value="${Math.round(bg.a*100)}" aria-label="Background strength"></div>`,`<button class="sm" data-clr="bg" title="Back to the original background">↺</button>`)}
${guiRow('Corners',`<input type="range" min="0" max="40" step="1" data-f="rad" value="${p.rad!==undefined?p.rad:radNow}">`,`<output data-o="rad">${p.rad!==undefined?p.rad:radNow} px</output>`)}
<h3>Anything else (CSS)</h3>
<textarea data-f="css" spellcheck="false" placeholder="border:2px solid gold; letter-spacing:2px; font-weight:800">${guiEsc(p.css||'')}</textarea>`}
function guiLabelOf(k){let e=null;try{e=gui.doc.querySelector(k)}catch(err){}return (e?guiName(e)+'  ':'')+k}
function guiThemeHtml(){const L=gui.skin.L[gui.scope];
  return `<p class="gnote">The colours and fonts the whole screen shares.</p>`+GUI_VARS.map(([n,label,t])=>{const v=L.vars[n],now=v||guiVar(n);
    if(t==='f')return `<h3>${label}</h3><div class="gf"><select data-v="${n}" style="grid-column:1/3">${(GUI_FONTS.includes(now)?[]:[now]).concat(GUI_FONTS).map(f=>`<option value="${guiEsc(f)}" ${f===now?'selected':''} style="font-family:${guiEsc(f)}">${guiEsc(f.split(',')[0].replace(/"/g,''))}</option>`).join('')}</select><button class="sm" data-vclr="${n}">↺</button></div>`;
    const c=guiRgb(now);return `<div class="gf"><span>${label}</span><div class="gcol"><input type="color" data-v="${n}" value="${c.hex}"><input type="range" min="0" max="100" step="5" data-va="${n}" value="${Math.round(c.a*100)}" aria-label="${label} strength"></div><button class="sm" data-vclr="${n}" ${v?'':'disabled'}>↺</button></div>`}).join('')+
  `<h3>Your own CSS (${GUI_SCOPES.find(s=>s.k===gui.scope).n.toLowerCase()})</h3><textarea data-f="pagecss" spellcheck="false" placeholder="#capL{display:none} .tbar button{font-weight:800}">${guiEsc(L.css||'')}</textarea>`}
function guiShareHtml(){const k=guiLs(GUI_KEY_LS)||'';
  return `<h3>Publish</h3><p class="gnote">Make this look the one every device gets when the game opens.</p>
${gui.host?'':`${guiRow('Owner key',`<input type="password" data-f="key" value="${guiEsc(k)}" autocomplete="off" style="grid-column:2/4">`,'')}`}
<div class="gbtns"><button class="go" data-a="publish">Publish to every device</button></div>
${gui.host?`<div class="gbtns"><button data-a="loadlive">Load the live look</button></div>`:''}
<h3>Undo a whole look</h3>
<div class="gbtns"><button data-a="droplocal" ${gui.draft?'':'disabled'}>Drop my unpublished changes</button><button data-a="original">Start from the original look</button></div>
<h3>As code</h3><p class="gnote">Copy a look to keep it, send it, or move it between the game and the claude.ai editor.</p>
<div class="gbtns"><button data-a="copy">Copy the look</button></div>
<textarea data-f="paste" placeholder="Paste a copied look here"></textarea><div class="gbtns"><button data-a="usepaste">Use the pasted look</button></div>
${gui.host&&gui.host.history?'<h3>Earlier live looks</h3><div class="glist" data-hist><button data-a="hist">Show them</button></div>':''}`}
function guiClick(e){const t=e.target.closest('button,[data-peek]');if(!t||!gui.ui.contains(t))return;const a=t.dataset.a;
  if(t.dataset.t){gui.tab=t.dataset.t;guiRender();return}
  if(t.dataset.go!==undefined){guiSelect(t.dataset.go);return}
  if(t.dataset.peek!==undefined){if(t.tagName==='INPUT')guiPeek(t.dataset.peek,t.checked);return}
  if(t.dataset.clr){const f=t.dataset.clr;guiEdit(()=>{if(f==='text')delete gui.skin.text[gui.sel];else delete guiEntry(true)[f]});guiCommit();guiRender();return}
  if(t.dataset.vclr){guiEdit(()=>delete gui.skin.L[gui.scope].vars[t.dataset.vclr]);guiCommit();guiRender();return}
  if(t.dataset.hist!==undefined){guiSetSkin(guiNorm(JSON.parse(gui.histList[+t.dataset.hist].data)),'An earlier live look is on screen. Publish to make it live again.');return}
  if(a==='close')guiOpen(false);
  else if(a==='min')gui.ui.classList.toggle('min');
  else if(a==='side')guiLs('bhd_gui_side',gui.ui.classList.toggle('left')?'left':null);
  else if(a==='undo')guiUndo(false);else if(a==='redo')guiUndo(true);
  else if(a==='pick'){gui.pick=!gui.pick;gui.hover=null;gui.doc.documentElement.classList.toggle('guiPicking',gui.pick);guiRender()}
  else if(a==='parent'&&gui.el){guiPick(gui.el.parentElement)}
  else if(a==='none'){gui.el=null;gui.sel='';guiRender()}
  else if(a==='reset'){guiEdit(()=>{delete gui.skin.L[gui.scope].el[gui.sel];if(gui.scope==='all')delete gui.skin.text[gui.sel]});guiCommit();guiRender()}
  else if(a==='publish')guiPublish();
  else if(a==='loadlive'){gui.msg='Loading…';guiStatus();gui.live=null;guiFetch().then(()=>{if(gui.live)guiSetSkin(guiCopy(gui.live),'The live look is on screen.');else{gui.msg='No live look yet: the game shows its original look.';guiStatus()}})}
  else if(a==='droplocal')guiSetSkin(gui.live?guiCopy(gui.live):guiNew(),'Back to the live look.');
  else if(a==='original')guiSetSkin(guiNew(),'The original look is on screen. Publish it to put every device back to it.');
  else if(a==='copy'){const s=JSON.stringify(Object.assign({},gui.skin,{t:0}));const ta=gui.ui.querySelector('[data-f=paste]');
    (navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>{gui.msg='Copied. Paste it into the other editor\'s Publish tab.';guiStatus()},
      ()=>{ta.value=s;ta.select();gui.msg='Copy the code from the box above.';guiStatus()})}
  else if(a==='usepaste'){const v=gui.ui.querySelector('[data-f=paste]').value.trim();let o=null;try{o=JSON.parse(v)}catch(err){}
    if(!o||typeof o!=='object'||!o.L){gui.msg='That is not a copied look.';guiStatus();return}guiSetSkin(guiNorm(o),'The pasted look is on screen.')}
  else if(a==='hist'){const box=gui.ui.querySelector('[data-hist]');box.textContent='Loading…';
    gui.host.history().then(l=>{gui.histList=l;box.innerHTML=l.length?l.map((h,i)=>`<button data-hist="${i}">${new Date(+h.t).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</button>`).join(''):'<p class="gnote">None yet.</p>'},
      err=>{box.textContent='Could not load them: '+(err&&err.message||err)})}}
function guiInput(e){const t=e.target,f=t.dataset.f,v=t.dataset.v||t.dataset.va;
  if(f==='scope'){gui.scope=t.value;guiRender();return}
  if(f==='sel'){gui.sel=t.value;guiRender();return}
  if(f==='key'||f==='paste')return;
  if(v){if(e.type==='change'&&t.tagName!=='SELECT')return;const L=gui.skin.L[gui.scope].vars,row=t.closest('.gf');
    if(t.tagName==='SELECT')guiEdit(()=>L[v]=t.value);
    else{const hex=row.querySelector('input[type=color]').value,a=+row.querySelector('input[type=range]').value/100;guiEdit(()=>L[v]=guiRgba(hex,a))}
    const r=row.querySelector('[data-vclr]');if(r)r.disabled=false;return}
  if(f==='pagecss'){guiEdit(()=>gui.skin.L[gui.scope].css=t.value);return}
  if(!f||!gui.sel||e.type==='change'&&t.type!=='checkbox'&&t.tagName!=='SELECT')return;
  guiEdit(()=>{const p=guiEntry(true);
    if(f==='hide')p.hide=t.checked;
    else if(f==='text')gui.skin.text[gui.sel]=t.value;
    else if(f==='fg')p.fg=t.value;
    else if(f==='bg'||f==='bga'){const row=t.closest('.gf');p.bg=guiRgba(row.querySelector('[data-f=bg]').value,+row.querySelector('[data-f=bga]').value/100)}
    else if(f==='css')p.css=t.value;
    else if(f==='fs')p.fs=+t.value||'';
    else if(f==='sc'||f==='op'||f==='rad'||f==='x'||f==='y')p[f]=t.value===''?'':+t.value});
  const o=gui.ui.querySelector(`[data-o=${f}]`);if(o)o.textContent=f==='fs'?(+t.value?t.value+' px':'as is'):f==='rad'?t.value+' px':t.value+'%'}

// the game: the look this device last had, then the live one if it is newer; the menu opens the editor
if(!window.GUI_HOSTED){guiBoot();
  addEventListener('visibilitychange',()=>{if(!document.hidden)guiFetch()});
  const gb=document.getElementById('guiBtn');if(gb)gb.onclick=()=>{if(typeof showMenu==='function')showMenu(false);guiOpen(true)}}
