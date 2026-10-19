// Corley's Island: the screen editor. Every part of the screen (the bars, buttons, gauges, sticks, panels and menus) can
// be restyled without touching the code: tap a part to pick it, then hide it, drag it, resize it, recolour it, rename it
// or give it any CSS; the Theme tab sets the colours and fonts everything shares. Changes can go to every screen, or to
// phones or big screens only. The result is a skin (JSON): edits save on this device as a draft straight away, and the
// owner publishes one, with the owner key, as the live look every device loads when the game opens (Supabase,
// supabase/island_gui.sql; only on the Vercel site, as sync is). The claude.ai screen editor (docs/gui-editor.html, made
// by tools/gui_editor.py) runs this same file over a copy of the screen and publishes through the owner's own
// Supabase connector.
// Parts can be picked one at a time, several at once (Shift-click, or Pick more), or as a ready-made group (every button,
// the gauge numbers…); the Layout tab docks the bars, the machine buttons, the minimap and the sticks on other sides.
// A skin: {v:1, t: when it went live (ms), L:{all|phone|big:{vars:{'--name':value}, el:{selector:{...}}, css, dock}},
// text:{selector:text}, words:{id:text}} (words: the tips and captions of js/words.js). An el entry: hide, x/y (px moved), sc (size %), fs (text px), fg (text colour), bg (background),
// rad (corners px), op (opacity %), css (any declarations). A selector can be a list (several parts or a group). dock:
// {top: top|bottom, bottom: bottom|top, map: right|left, sticks: normal|swap}.
// The Words tab rewrites the start card (skin.text) and the tips and captions (skin.words). The Tuning tab edits the
// numbers of js/tune.js, which publish on their own (supabase/island_tune.sql) but with the same owner key.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md. This file needs nothing from the
// others (SYNC_URL, showMenu, TUNE and WORDS when they are there), so the claude.ai editor can load it alone.
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
const GUI_PEEK=[['#menu','Menu'],['#help','Start card'],['#blkBar','Blocks bar'],['#walkBtns','Sprint and Jump'],['#seatBtn','Get in'],['#pumpBtn','Pump'],['#wipeBtn','Wipers'],
  ['#boxBtn','Hook box'],['#lawnRow','Lawn gauge'],['#heatKey','Heatmap key'],['#updBtn','Update button'],['#keysBox','Keys panel'],['#gfxBox','Graphics panel']];
// ready-made groups (selector, name), picked from the Groups tab and then edited like any part
const GUI_GROUPS=[['#hud button','Every button on the screen'],['.tbar button','Top bar buttons'],['#ctlMenu button','Machine buttons'],['.bbar button','Bottom bar buttons'],
  ['#menu button','Menu buttons'],['#blkBar button','Blocks bar buttons'],['.tbar, .bbar','The two bars'],['.srow','Gauges'],['.lbl','Gauge names'],
  ['.val','Gauge numbers'],['.sub','Gauge detail lines'],['.bar','Gauge meters'],['.stick','Sticks'],['.knob','Stick knobs'],['.cap','Stick captions'],
  ['#mini','Minimap'],['.card','Cards and panels'],['#toast span','Messages'],['#hud','The whole screen layer']];
// one-move settings at the top of the Groups tab: name, selector, field, slider top
const GUI_QUICK=[['Button corners','#hud button','rad',30],['Button text size','#hud button','fs',40],['Gauge name size','.lbl','fs',40],['Gauge number size','.val','fs',48],
  ['Panel corners','.card','rad',40]];
// where the big pieces can sit (Layout tab): key, name, choices (first is the game's own)
const GUI_DOCK=[['top','Top bar',[['top','Top'],['bottom','Bottom']]],['bottom','Bottom bar',[['bottom','Bottom'],['top','Top']]],
  ['map','Minimap',[['right','Right'],['left','Left']]],
  ['sticks','Sticks',[['normal','As they are'],['swap','Swapped']]]];
const GUI_TAGS={button:'button',span:'text',b:'text',div:'box',canvas:'drawing',select:'dropdown',input:'control',label:'label',p:'text',h1:'heading',h2:'heading',h3:'heading',h4:'heading',nav:'bar',header:'bar',footer:'bar',aside:'column'};
// doc and root: the page holding the screen (the claude.ai editor puts it in a stage box), media: how the phone and big
// screen layers are written (that editor sizes its stage with container queries), scale: the stage's zoom, host: the
// claude.ai editor's publish and load, dock: where that editor puts the panel, styleAt: where the skin's style sheet goes
// (last in the head; that editor's game CSS sits in the body, so it puts the skin after it)
const gui={doc:document,root:document.body,media:'@media',scale:()=>1,host:null,dock:null,
  skin:null,live:null,draft:false,open:false,pick:true,add:false,sel:'',multi:[],el:null,els:[],scope:'all',tab:'el',undo:[],redo:[],pending:false,
  orig:new Map(),liveEls:new WeakSet(),peek:new Set(),down:null,hover:null,ui:null,boxes:[],hbox:null,msg:''};
const guiLayer=()=>({vars:{},el:{},css:'',dock:{}});
const guiNew=()=>({v:1,t:0,L:{all:guiLayer(),phone:guiLayer(),big:guiLayer()},text:{},words:{}});
function guiNorm(o){const s=guiNew();if(!o||typeof o!=='object')return s;s.t=+o.t||0;
  for(const sc of GUI_SCOPES){const l=o.L&&o.L[sc.k];if(!l||typeof l!=='object')continue;
    if(l.vars&&typeof l.vars==='object')for(const [k,v] of Object.entries(l.vars))if(/^--[\w-]+$/.test(k)&&typeof v==='string'&&v)s.L[sc.k].vars[k]=v;
    if(l.el&&typeof l.el==='object')for(const [k,v] of Object.entries(l.el))if(v&&typeof v==='object')s.L[sc.k].el[k]=Object.assign({},v);
    if(typeof l.css==='string')s.L[sc.k].css=l.css;
    if(l.dock&&typeof l.dock==='object')for(const [k,v,ch] of GUI_DOCK)if(ch.some(c=>c[0]===l.dock[k]))s.L[sc.k].dock[k]=l.dock[k]}
  if(o.text&&typeof o.text==='object')for(const [k,v] of Object.entries(o.text))if(typeof v==='string')s.text[k]=v;
  if(o.words&&typeof o.words==='object')for(const [k,v] of Object.entries(o.words))if(typeof v==='string')s.words[k]=v;
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
// docking: #hud's grid gets more rows and columns (bars at the top: top bar, bottom bar if moved up, machine buttons if
// moved up; the middle; then the same below; columns: machine buttons left, minimap if moved left, the view, minimap,
// machine buttons right), and each piece takes its slot. The phone and big screen layers write the whole layout from
// their own choices over the every-screen ones, so a layer can put a piece back where the game has it
function guiDockCss(d){const c=k=>d[k]||GUI_DOCK.find(g=>g[0]===k)[2][0][0];
  const top=c('top'),bot=c('bottom'),map=c('map'),swap=c('sticks')==='swap';
  let r='#hud{grid-template-columns:auto auto minmax(0,1fr) auto auto;grid-template-rows:auto auto auto minmax(0,1fr) auto auto auto}\n';
  r+=`.tbar{grid-area:${top==='top'?1:6}/1/${top==='top'?2:7}/6}\n.bbar{grid-area:${bot==='bottom'?7:2}/1/${bot==='bottom'?8:3}/6}\n`;
  if(top==='bottom')r+='.tbar::after{top:auto;bottom:100%}\n';
  if(bot==='top')r+='.bbar{border-top:0;border-bottom:1px solid var(--hud-line)}\n';
  r+=`.rpane{grid-area:4/${map==='left'?2:4}/5/${map==='left'?3:5}${map==='left'?';align-items:flex-start;padding:11px 0 8px var(--pl)':''}}\n`;
  r+=`.sticks{grid-area:4/2/5/5${swap?';flex-direction:row-reverse;padding:0 14px 10px var(--pr)':''}}\n`;
  if(swap)r+='#capL{order:5;margin-left:auto;text-align:right}#capR{order:-1;margin-left:0;text-align:left}\n';
  return r}
function guiCss(s){let out='';
  for(const sc of GUI_SCOPES){const L=s.L[sc.k],v=Object.entries(L.vars);let r='';
    const dk=sc.k==='all'?L.dock:Object.assign({},s.L.all.dock,L.dock);if(Object.keys(dk).length)r+=guiDockCss(dk);
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
  st.textContent=guiCss(gui.skin);guiTexts();if(typeof wordsRefresh==='function')wordsRefresh()}
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
  for(const r of recs){const e=r.target.nodeType===3?r.target.parentElement:r.target;if(!e||gui.ui&&gui.ui.contains(e)||e===gui.hbox||e.classList.contains('guiBox'))continue;
    if(gui.orig.has(e))fix=true;else if(gui.open)gui.liveEls.add(e)}
  if(fix)for(const [e] of gui.orig){const t=guiTextOf(e);if(t!==undefined&&e.textContent!==t)e.textContent=t}}
function guiTextOf(e){for(const [sel,t] of Object.entries(gui.skin.text)){try{if(e.matches(sel))return t}catch(err){}}}

// ---------- drafts, the live look and publishing ----------
const GUI_NET=typeof SYNC_URL!=='undefined'&&!!SYNC_URL&&/(^|\.)vercel\.app$|^localhost$|^127\./.test(location.hostname)&&!/\/versions\//.test(location.pathname);
async function guiRpc(fn,body){const r=await fetch(SYNC_URL+'/rest/v1/rpc/'+fn,{method:'POST',
    headers:{'Content-Type':'application/json',apikey:SYNC_KEY,Authorization:'Bearer '+SYNC_KEY},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('gui '+r.status);return r.json()}
function guiBoot(){gui.live=guiParse(guiLs(GUI_LIVE_LS));const d=guiParse(guiLs(GUI_LS));
  gui.skin=d||(gui.live?guiCopy(gui.live):guiNew());gui.draft=!!d;guiApply();guiFetch();guiTuneFetch()}
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
// ---------- tuning (js/tune.js): this device tries changes as a draft, then they are published on their own ----------
const GUI_TUNE=typeof TUNE!=='undefined';
const guiTuneSame=(a,b)=>{const k=o=>JSON.stringify(Object.keys(o).sort().map(x=>[x,o[x]]));return k(a)===k(b)};
// one value changed (v undefined: back to the game's own); a draft the same as the live tuning is dropped
function guiTuneSet(k,v){const live=tune.live?tune.live.set:{},d=tune.draft?Object.assign({},tune.draft.set):Object.assign({},live);
  if(k===null)for(const x of Object.keys(d))delete d[x];else if(v===undefined)delete d[k];else d[k]=v;
  tune.draft=guiTuneSame(d,live)?null:{v:1,t:0,set:d};tuneLs(TUNE_LS,tune.draft?JSON.stringify(tune.draft):null);tuneUse();gui.msg='';guiStatus()}
async function guiTuneFetch(){if(!GUI_TUNE)return;
  try{let s=null;if(gui.host){if(!gui.host.tuneLoad)return;s=await gui.host.tuneLoad()}
    else{if(!GUI_NET)return;const rows=await guiRpc('tune_get',{}),r=rows&&rows[0];if(r){s=tuneParse(r.data);if(s)s.t=+r.t}}
    if(!s||tune.live&&s.t<=tune.live.t)return;
    tune.live=s;tuneLs(TUNE_LIVE_LS,JSON.stringify(s));if(tune.draft&&guiTuneSame(tune.draft.set,s.set)){tune.draft=null;tuneLs(TUNE_LS,null)}
    tuneUse();if(gui.tab==='tune')guiRender()}
  catch(e){if(gui.host){gui.msg=String(e&&e.message||e);guiStatus()}}}
async function guiTunePublish(){const key=gui.ui.querySelector('[data-f=key]'),k=key?key.value.trim():'';if(key)guiLs(GUI_KEY_LS,k);
  if(!gui.host&&!GUI_NET){gui.msg='Publishing works on the game\'s website (corleys-island.vercel.app), not this copy.';guiStatus();return}
  if(!gui.host&&!k){gui.msg='Type the owner key first.';guiStatus();return}
  gui.msg='Publishing…';guiStatus();const set=(tune.draft||tune.live||{set:{}}).set,data=JSON.stringify({v:1,set});
  try{const t=gui.host?await gui.host.tunePublish(data):await guiRpc('tune_put',{p_key:k,p_data:data});
    if(!(t>0)){gui.msg='That owner key is not right. Nothing was published.';guiStatus();return}
    tune.live={v:1,t:+t,set:Object.assign({},set)};tuneLs(TUNE_LIVE_LS,JSON.stringify(tune.live));tune.draft=null;tuneLs(TUNE_LS,null);tuneUse();
    gui.msg='Published. Every device plays by these numbers the next time the game opens.'}
  catch(e){gui.msg=gui.host?'Could not publish: '+(e&&e.message||e):'Could not reach the server. Your changes are still saved here.'}
  guiRender()}
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
// a tap picks one part; with Pick more on (or Shift held) it adds the part to the picked ones, or takes it back out
function guiPick(t,add){while(t&&t.closest&&t.closest('svg'))t=t.closest('svg').parentElement;
  const none=!t||t===gui.root||t===gui.doc.body||t===gui.doc.documentElement||t.id==='view'||t.id==='hud',o=none?[]:guiSels(t),s=o.length?o[0][0]:'';
  if(add&&gui.sel&&s){const i=gui.multi.indexOf(s);if(i>=0)gui.multi.splice(i,1);else gui.multi.push(s);guiSetSel(gui.multi.slice())}
  else guiSetSel(s?[s]:[],s?t:null);
  gui.tab='el';guiRender()}
// the picked parts: their selectors (one, a list, or a group), the elements they match, and the first of them
function guiSetSel(list,el){gui.multi=list;gui.sel=list.join(', ');gui.els=[];
  if(gui.sel)try{gui.els=[...gui.doc.querySelectorAll(gui.sel)]}catch(err){}
  gui.el=el&&gui.els.includes(el)?el:gui.els[0]||null}
function guiSelect(sel){guiSetSel(sel?[sel]:[]);gui.tab='el';guiRender()}

// ---------- picking on the screen ----------
const GUI_EV=['pointerdown','pointerup','click','dblclick','mousedown','mouseup','touchstart','touchend','contextmenu'];
function guiListen(on){const w=gui.doc.defaultView,f=on?'addEventListener':'removeEventListener';
  for(const t of GUI_EV)w[f](t,guiEv,{capture:true,passive:false});w[f]('pointermove',guiMove,{capture:true,passive:false})}
const guiMine=e=>!!(gui.ui&&gui.ui.contains(e));
function guiEv(e){if(!gui.open||!gui.pick)return;let t=e.target;if(t&&t.nodeType===3)t=t.parentElement;if(!t||guiMine(t)||!gui.root.contains(t))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.type==='pointerdown'){const drag=!!(gui.sel&&gui.els.some(x=>x===t||x.contains(t)));const p=guiEntry(false);
    gui.down={x:e.clientX,y:e.clientY,t,moved:false,drag,x0:+p.x||0,y0:+p.y||0,add:gui.add||e.shiftKey}}
  else if(e.type==='pointerup'&&gui.down){const d=gui.down;gui.down=null;if(!d.moved)guiPick(d.t,d.add);else{guiCommit();guiRender()}}}
function guiMove(e){if(!gui.open||!gui.pick)return;let t=e.target;if(t&&t.nodeType===3)t=t.parentElement;
  const d=gui.down;if(!d){gui.hover=t&&!guiMine(t)&&gui.root.contains(t)?t:null;return}
  e.preventDefault();e.stopImmediatePropagation();
  const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>5)d.moved=true;
  if(d.drag&&d.moved){const k=gui.scale()||1;guiEdit(()=>{const p=guiEntry(true);p.x=Math.round(d.x0+dx/k);p.y=Math.round(d.y0+dy/k)});
    const f=gui.ui.querySelector('[data-f=x]'),g=gui.ui.querySelector('[data-f=y]');if(f)f.value=guiEntry(false).x||0;if(g)g.value=guiEntry(false).y||0}}
// the picked part's outline (solid) and the one under the mouse (dashed), kept on the parts while the editor is open
function guiFrame(){if(!gui.open){for(const b of gui.boxes)b.hidden=true;gui.hbox.hidden=true;gui.framing=false;return}gui.framing=true;
  const put=(b,e)=>{if(!e||!e.isConnected){b.hidden=true;return}const r=e.getBoundingClientRect();if(!r.width&&!r.height){b.hidden=true;return}
    b.hidden=false;Object.assign(b.style,{left:r.left-3+'px',top:r.top-3+'px',width:r.width+6+'px',height:r.height+6+'px'})};
  const els=gui.els.slice(0,80);
  while(gui.boxes.length<els.length){const b=gui.doc.createElement('div');b.className='guiBox';b.hidden=true;gui.doc.body.appendChild(b);gui.boxes.push(b)}
  gui.boxes.forEach((b,i)=>put(b,els[i]));
  put(gui.hbox,gui.pick&&gui.hover&&!gui.els.includes(gui.hover)&&gui.hover.id!=='view'&&gui.hover.id!=='hud'?gui.hover:null);
  requestAnimationFrame(guiFrame)}
function guiPeek(sel,on){let e=null;try{e=gui.doc.querySelector(sel)}catch(err){}if(!e)return;
  if(on){if(e.hidden){e.hidden=false;gui.peek.add(sel)}}else if(gui.peek.has(sel)){e.hidden=true;gui.peek.delete(sel)}}

// ---------- the panel ----------
const GUI_STYLE=`
.guiPicking #hud *:not(.sticks):not(.rpane),.guiPicking #editor *{pointer-events:auto!important}
.guiPicking #hud *,.guiPicking #editor *,.guiPicking #help *{cursor:crosshair!important}
.guiBox,#guiHBox{position:fixed;z-index:2147483600;pointer-events:none;border:3px solid #34d6ff;border-radius:6px;box-shadow:0 0 0 2px rgba(0,0,0,.6)}
#guiHBox{border:2px dashed rgba(255,255,255,.8);box-shadow:none}
#guiPanel{position:fixed;z-index:2147483640;top:0;right:0;bottom:0;width:380px;max-width:100%;box-sizing:border-box;display:flex;flex-direction:column;
  background:#171a14;color:#f3f5ef;border-left:2px solid #f07a22;font:500 16px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;
  box-shadow:-8px 0 24px rgba(0,0,0,.45);-webkit-user-select:none;user-select:none;touch-action:auto;pointer-events:auto}
#guiPanel.left{right:auto;left:0;border-left:0;border-right:2px solid #f07a22;box-shadow:8px 0 24px rgba(0,0,0,.45)}
#guiPanel.dock{position:relative;inset:auto;width:100%;height:100%;border-left:0;box-shadow:none}
#guiPanel.min:not(.dock){height:auto;bottom:auto}
@media (max-width:640px){#guiPanel:not(.dock){top:auto;left:0;width:auto;height:54vh;border-left:0;border-top:2px solid #f07a22}#guiPanel.min:not(.dock){height:auto;bottom:0}}#guiPanel.min .gbody,#guiPanel.min .gtabs,#guiPanel.min .grow0{display:none}
#guiPanel *{box-sizing:border-box}
#guiPanel .ghead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.14)}
#guiPanel .ghead b{flex:1;font-size:19px;letter-spacing:.02em}
#guiPanel button,#guiPanel select,#guiPanel input,#guiPanel textarea{font:inherit;color:inherit;text-transform:none;letter-spacing:normal;box-shadow:none;width:auto;height:auto}
#guiPanel button{min-height:42px;padding:0 14px;border-radius:9px;border:1px solid rgba(255,255,255,.22);background:#2a2f25;cursor:pointer}
#guiPanel button:hover{background:#353b2f}#guiPanel button:disabled{opacity:.4;cursor:default}
#guiPanel button.go{background:#f07a22;color:#1c1309;border-color:#f07a22;font-weight:700}
#guiPanel button[aria-pressed=true]{background:#34d6ff;color:#06222b;border-color:#34d6ff;font-weight:700}
#guiPanel button.sm{min-height:34px;padding:0 10px;font-size:14px}
#guiPanel .gtabs{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0}
#guiPanel .gtabs button{flex:1 0 auto;min-width:62px;border-radius:9px 9px 0 0;border-bottom:0;padding:0 4px;font-size:14px}
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
#guiPanel .gw{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px 8px;margin:8px 0}#guiPanel .gw>span{font-size:14px;color:#c3ccbb}#guiPanel .gw textarea{grid-column:1/3;min-height:0;font-size:15px;line-height:1.35;font-family:inherit}
#guiPanel .gtu{display:flex;align-items:center;gap:6px;white-space:nowrap}
#guiPanel .gnote{font-size:14px;color:#c3ccbb;margin:6px 0}
#guiPanel .gwho{font-size:17px;font-weight:700;margin:0 0 6px;word-break:break-word}
#guiPanel .gbtns{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
#guiPanel .glist{display:flex;flex-direction:column;gap:6px}
#guiPanel .glist button{text-align:left;font-size:14px;min-height:38px;word-break:break-all}
#guiPanel .gstat{margin:0;padding:9px 12px;border-top:1px solid rgba(255,255,255,.14);font-size:14px;color:#c3ccbb;min-height:40px}
#guiPanel .gpeek{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#guiPanel .gpeek label{display:flex;align-items:center;gap:8px;font-size:15px}
#guiPanel .gseg{display:flex;flex-wrap:wrap;gap:6px}#guiPanel .gseg button{min-height:38px;padding:0 12px;font-size:15px}
#guiPanel code{font-size:13px;color:#9fdcf0;word-break:break-all}
`;
function guiBuild(){if(gui.ui)return;const d=gui.doc,host=gui.dock?gui.dock.ownerDocument:d;
  if(!d.getElementById('guiStyle')){const st=d.createElement('style');st.id='guiStyle';st.textContent=GUI_STYLE;d.head.appendChild(st)}
  if(host!==d&&!host.getElementById('guiStyle')){const st=host.createElement('style');st.id='guiStyle';st.textContent=GUI_STYLE;host.head.appendChild(st)}
  gui.hbox=d.createElement('div');gui.hbox.id='guiHBox';gui.hbox.hidden=true;d.body.appendChild(gui.hbox);
  const p=host.createElement('div');p.id='guiPanel';p.setAttribute('role','dialog');p.setAttribute('aria-label','Screen editor');if(gui.dock)p.classList.add('dock');
  p.innerHTML=`<div class="ghead"><b>Screen editor</b>${gui.dock?'':'<button class="sm" data-a="side" aria-label="Move the editor to the other side" title="Other side">⇆</button><button class="sm" data-a="min" aria-label="Fold the editor away">▾</button>'}<button class="sm" data-a="undo" disabled>Undo</button><button class="sm" data-a="redo" disabled>Redo</button>${gui.dock?'':'<button class="go sm" data-a="close">Done</button>'}</div>
<div class="grow0"><button data-a="pick" aria-pressed="true">Tap to pick: on</button><button data-a="add" aria-pressed="false" title="Each tap adds a part to the picked ones (or Shift-click)">Pick more: off</button><label>Changes go to <select data-f="scope">${GUI_SCOPES.map(s=>`<option value="${s.k}">${s.n}</option>`).join('')}</select></label></div>
<div class="gtabs" role="tablist"><button role="tab" data-t="el">Parts</button><button role="tab" data-t="groups">Groups</button><button role="tab" data-t="layout">Layout</button><button role="tab" data-t="theme">Theme</button><button role="tab" data-t="words">Words</button>${GUI_TUNE?'<button role="tab" data-t="tune">Tuning</button>':''}<button role="tab" data-t="share">Publish</button></div>
<div class="gbody"></div><p class="gstat" aria-live="polite"></p>`;
  if(!gui.dock&&guiLs('bhd_gui_side'))p.classList.add('left');
  (gui.dock||d.body).appendChild(p);gui.ui=p;
  // typing in the editor must not drive the machines
  for(const t of ['keydown','keyup','keypress'])p.addEventListener(t,e=>{e.stopPropagation();if(t==='keydown'&&e.key==='Escape'&&!gui.dock)guiOpen(false)});
  p.addEventListener('click',guiClick);p.addEventListener('input',guiInput);p.addEventListener('change',e=>{guiInput(e);guiCommit()});
  p.addEventListener('pointerup',guiCommit)}
function guiOpen(on){guiBuild();gui.open=on;gui.ui.hidden=!on;guiListen(on);gui.doc.documentElement.classList.toggle('guiPicking',on&&gui.pick);
  if(on){guiRender();if(!gui.framing)requestAnimationFrame(guiFrame)}else{guiSetSel([]);gui.hover=null;for(const s of [...gui.peek])guiPeek(s,false);guiCommit();guiSave()}
  guiWatch()}
function guiUndoBtns(){if(!gui.ui)return;gui.ui.querySelector('[data-a=undo]').disabled=!gui.undo.length;gui.ui.querySelector('[data-a=redo]').disabled=!gui.redo.length}
function guiStatus(){if(!gui.ui)return;const lv=gui.live&&gui.live.t?new Date(gui.live.t).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
  let what=gui.draft?'Showing your unpublished changes (saved on this device).':lv?`Showing the live look, published ${lv}.`:'Showing the original look.';
  if(gui.tab==='tune'){const tl=tune.live&&tune.live.t?new Date(tune.live.t).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
    what=tune.draft?'Playing by your unpublished tuning (this device only).':tl?`Playing by the live tuning, published ${tl}.`:'Playing by the game\'s own numbers.'}
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
  const ad=p.querySelector('[data-a=add]');ad.setAttribute('aria-pressed',gui.add);ad.textContent='Pick more: '+(gui.add?'on':'off');
  const b=p.querySelector('.gbody');b.innerHTML=gui.tab==='tune'?guiTuneHtml():gui.tab==='words'?guiWordsHtml():gui.tab==='theme'?guiThemeHtml():gui.tab==='share'?guiShareHtml():gui.tab==='groups'?guiGroupsHtml():gui.tab==='layout'?guiLayoutHtml():guiElHtml();guiStatus()}
function guiGroupsHtml(){const L=gui.skin.L[gui.scope].el;
  return `<h3>In one move</h3><p class="gnote">Each of these changes a whole group at once.</p>`+GUI_QUICK.map(([n,sel,f,mx],i)=>{const v=L[sel]&&L[sel][f];
    return guiRow(n,`<input type="range" min="0" max="${mx}" step="1" data-q="${i}" value="${v!==undefined&&v!==''?v:0}">`,`<output data-qo="${i}">${v!==undefined&&v!==''?v+' px':'as is'}</output><button class="sm" data-qclr="${i}" title="Back to the game's own">↺</button>`)}).join('')+
  `<h3>Pick a group</h3><p class="gnote">Then change it on the Parts tab like a single part: colours, size, hide, drag, CSS.</p><div class="glist">${GUI_GROUPS.map(([sel,n])=>{let c=0;try{c=gui.doc.querySelectorAll(sel).length}catch(err){}
    return c?`<button data-go="${guiEsc(sel)}">${guiEsc(n)} <span style="opacity:.6">(${c})</span></button>`:''}).join('')}</div>
<p class="gnote">To pick your own set, turn on Pick more (or hold Shift) and tap the parts.</p>`}
function guiLayoutHtml(){const L=gui.skin.L[gui.scope].dock,eff=gui.scope==='all'?L:Object.assign({},gui.skin.L.all.dock,L);
  return `<p class="gnote">Move the big pieces to other sides; the rest of the screen makes room. Use Changes go to for a different layout on phones and big screens.</p>`+
  GUI_DOCK.map(([k,n,ch])=>{const now=eff[k]||ch[0][0];return `<h3>${n}</h3><div class="gseg">${ch.map(([v,l])=>`<button data-dk="${k}" data-dv="${v}" aria-pressed="${v===now}">${l}</button>`).join('')}${L[k]?`<button class="sm" data-dclr="${k}" title="Back to ${gui.scope==='all'?'the game\'s own':'the every-screen choice'}">↺</button>`:''}</div>`}).join('')+
  `<p class="gnote">Dragging still works for fine moves: pick a part on the Parts tab and drag it.</p>`}
function guiElHtml(){const sc=GUI_SCOPES.find(s=>s.k===gui.scope).n.toLowerCase();
  if(!gui.sel){const L=gui.skin.L[gui.scope],keys=[...new Set([...Object.keys(L.el),...(gui.scope==='all'?Object.keys(gui.skin.text):[])])];
    return `<p class="gnote">${gui.pick?'Tap any part of the screen to pick it. Drag a picked part to move it.':'Picking is off, so the game works as usual: open a menu or switch machine, then turn picking back on.'}</p>
<h3>Usually hidden</h3><p class="gnote">Show these to style them; they go back to normal when the editor closes.</p>
<div class="gpeek">${GUI_PEEK.map(([s,n])=>{let e=null;try{e=gui.doc.querySelector(s)}catch(err){}return e?`<label><input type="checkbox" data-peek="${guiEsc(s)}" ${gui.peek.has(s)?'checked':''}>${n}</label>`:''}).join('')}</div>
<h3>Changed for ${sc}</h3>${keys.length?`<div class="glist">${keys.map(k=>`<button data-go="${guiEsc(k)}">${guiEsc(guiLabelOf(k))}</button>`).join('')}</div><p class="gnote">Hidden parts can only be picked from this list.</p>`:'<p class="gnote">Nothing yet.</p>'}`}
  const e=gui.el,p=guiEntry(false),cs=guiCS(),many=gui.els.length>1,opts=e&&gui.multi.length===1?guiSels(e):[];
  const grp=GUI_GROUPS.find(g=>g[0]===gui.sel);if(!opts.some(o=>o[0]===gui.sel))opts.unshift([gui.sel,grp?grp[1]:gui.multi.length>1?`These ${gui.multi.length} parts`:'This selection']);
  const fg=guiRgb(p.fg||(cs?cs.color:'#fff')),bg=guiRgb(p.bg||(cs?cs.backgroundColor:'rgba(0,0,0,0)'));
  const live=e&&gui.els.some(x=>x.firstElementChild||gui.liveEls.has(x)&&!gui.orig.has(x)),txt=gui.skin.text[gui.sel];
  const fsNow=cs?Math.round(parseFloat(cs.fontSize)):16,radNow=cs?Math.round(parseFloat(cs.borderTopLeftRadius)||0):0;
  return `<p class="gwho">${many?`${gui.els.length} parts`+(grp?': '+guiEsc(grp[1].toLowerCase()):''):e?guiEsc(guiName(e)):'(not on screen right now)'}</p>
<div class="gf"><span>Change</span><select data-f="sel" style="grid-column:2/4">${opts.map(o=>`<option value="${guiEsc(o[0])}" ${o[0]===gui.sel?'selected':''}>${guiEsc(o[1])}</option>`).join('')}</select></div>
<p class="gnote"><code>${guiEsc(gui.sel)}</code></p>
<div class="gbtns"><button class="sm" data-a="parent" ${e&&e.parentElement&&guiPath(e.parentElement)?'':'disabled'}>Pick the box around it</button><button class="sm" data-a="reset">Undo all changes to it</button><button class="sm" data-a="none">Pick nothing</button></div>
<h3>Show</h3>
${guiRow('Hide it',`<input type="checkbox" data-f="hide" ${p.hide?'checked':''}>`)}
${guiRow('Opacity',`<input type="range" min="0" max="100" step="5" data-f="op" value="${p.op!==undefined?p.op:100}">`,`<output data-o="op">${p.op!==undefined?p.op:100}%</output>`)}
<h3>Words</h3>
${live?`<p class="gnote">${gui.els.some(x=>x.firstElementChild)?'This part holds other parts; pick the words themselves to rename them.':'The game keeps changing these words, so they can\'t be renamed.'}</p>`:
  guiRow('Text',`<input type="text" data-f="text" value="${guiEsc(txt!==undefined?txt:e?e.textContent:'')}" ${gui.scope!=='all'?'disabled':''}>`,`<button class="sm" data-clr="text" title="Back to the original words">↺</button>`)+(gui.scope!=='all'?'<p class="gnote">Words change on every screen at once: switch to Every screen to rename.</p>':'')}
${guiRow('Text size',`<input type="range" min="0" max="64" step="1" data-f="fs" value="${p.fs||0}">`,`<output data-o="fs">${p.fs?p.fs+' px':'as is ('+fsNow+')'}</output>`)}
${guiRow('Text colour',`<div class="gcol"><input type="color" data-f="fg" value="${fg.hex}"></div>`,`<button class="sm" data-clr="fg" title="Back to the original colour">↺</button>`)}
<h3>Size and place</h3>
${guiRow('Size',`<input type="range" min="30" max="300" step="5" data-f="sc" value="${p.sc||100}">`,`<output data-o="sc">${p.sc||100}%</output>`)}
${guiRow('Move right',`<input type="number" step="1" data-f="x" value="${p.x||0}">`,'<span>px</span>')}
${guiRow('Move down',`<input type="number" step="1" data-f="y" value="${p.y||0}">`,'<span>px</span>')}
<p class="gnote">Or drag the outlined part${many?'s':''} on the screen.</p>
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
const guiNum=(e,v)=>{const d=(String(e[7]).split('.')[1]||'').length;return +tuneShow(e,v).toFixed(d)};
function guiTuneHtml(){const set=(tune.draft||tune.live||{set:{}}).set;let g='',h='';
  for(const e of TUNE){if(e[1]!==g){g=e[1];h+=`<h3>${guiEsc(g)}</h3>`}const ch=set[e[0]]!==undefined&&guiNum(e,set[e[0]])!==guiNum(e,e[3]);
    h+=guiRow(guiEsc(e[2]),`<input type="number" data-tu="${e[0]}" min="${e[5]}" max="${e[6]}" step="${e[7]}" value="${guiNum(e,TU[e[0]])}" aria-label="${guiEsc(e[2])} in ${TUNE_U[e[4]][1]}">`,
      `<span class="gtu"><span>${TUNE_U[e[4]][1]}</span><button class="sm" data-tuclr="${e[0]}" title="Back to the game's own: ${guiNum(e,e[3])} ${TUNE_U[e[4]][1]}" ${ch?'':'disabled'}>↺</button></span>`)}
  return `<p class="gnote">The numbers the game plays by. A change takes at once on this device; publish it to give every device the same numbers (saves sync, so they all play alike). ↺ puts one back to the game's own.</p>
<div class="gbtns"><button data-a="tunereset">Put every number back</button><button data-a="tunedrop" ${tune.draft?'':'disabled'}>Drop my unpublished tuning</button></div>${h}
<h3>Publish</h3>${gui.host?'':guiRow('Owner key',`<input type="password" data-f="key" value="${guiEsc(guiLs(GUI_KEY_LS)||'')}" autocomplete="off" style="grid-column:2/4">`,'')}
<div class="gbtns"><button class="go" data-a="tunepub">Publish the tuning to every device</button>${gui.host?'<button data-a="tuneload">Load the live tuning</button>':''}</div>`}
// the start card's words (renamed like any part, skin.text) and the tips and captions (skin.words)
const guiCardEls=()=>[...gui.doc.querySelectorAll('#help *')].filter(e=>!e.firstElementChild&&e.id!=='verHelp'&&e.tagName!=='IMG'&&(gui.orig.has(e)?gui.orig.get(e):e.textContent).trim());
function guiWordsHtml(){const T=gui.skin.text,Wd=gui.skin.words;let h=`<p class="gnote">Rewrite the start card, the tips that pop up and the stick captions. In a tip, a name in [brackets] is the key for that action and follows the player's own keys; {names} are filled in by the game. A caption's second line goes after a line break.</p>
<div class="gpeek"><label><input type="checkbox" data-peek="#help" ${gui.peek.has('#help')?'checked':''}>Show the start card</label></div><h3>Start card</h3>`;
  let last='';
  for(const e of guiCardEls()){const sel=guiPath(e);if(!sel)continue;const orig=gui.orig.has(e)?gui.orig.get(e):e.textContent,v=T[sel]!==undefined?T[sel]:orig;
    const lab=e.tagName==='DT'?'Heading':e.tagName==='DD'?(last||'Text'):guiName(e);if(e.tagName==='DT')last=orig;
    h+=`<div class="gw"><span>${guiEsc(lab.length>40?lab.slice(0,39)+'…':lab)}</span><button class="sm" data-wtclr="${guiEsc(sel)}" ${T[sel]!==undefined?'':'disabled'} title="Back to the original words">↺</button>
<textarea data-wt="${guiEsc(sel)}" rows="${Math.min(8,Math.ceil(orig.length/44)+1)}" ${gui.scope!=='all'?'disabled':''}>${guiEsc(v)}</textarea></div>`}
  if(gui.scope!=='all')h+='<p class="gnote">Words change on every screen at once: switch Changes go to back to Every screen.</p>';
  if(typeof WORDS!=='undefined'){let g='';
    for(const w of WORDS){if(w[1]!==g){g=w[1];h+=`<h3>${guiEsc(g)}</h3>`}const v=Wd[w[0]]!==undefined?Wd[w[0]]:w[2];
      h+=`<div class="gw"><span>${guiEsc(w[3]||'')}</span><button class="sm" data-wdclr="${w[0]}" ${Wd[w[0]]!==undefined?'':'disabled'} title="Back to: ${guiEsc(w[2])}">↺</button>
<textarea data-wd="${w[0]}" rows="${Math.min(4,Math.ceil(w[2].length/44)+(w[2].includes('\n')?1:0))}">${guiEsc(v)}</textarea></div>`}}
  return h}
// a tip being edited shows in the tip bar for a moment
let guiTipT=0;
function guiTipShow(id){const el=gui.doc.getElementById('toastText');if(!el||typeof say!=='function'||/^cap/.test(id))return;
  el.textContent=say(id);el.className='show';clearTimeout(guiTipT);guiTipT=setTimeout(()=>el.className='',2500)}
function guiClick(e){const t=e.target.closest('button,[data-peek]');if(!t||!gui.ui.contains(t))return;const a=t.dataset.a;
  if(t.dataset.t){gui.tab=t.dataset.t;guiRender();return}
  if(t.dataset.dk){const k=t.dataset.dk,v=t.dataset.dv;guiEdit(()=>{const D=gui.skin.L[gui.scope].dock;if(gui.scope==='all'&&v===GUI_DOCK.find(g=>g[0]===k)[2][0][0])delete D[k];else D[k]=v});guiCommit();guiRender();return}
  if(t.dataset.dclr){guiEdit(()=>delete gui.skin.L[gui.scope].dock[t.dataset.dclr]);guiCommit();guiRender();return}
  if(t.dataset.qclr!==undefined){const [,sel,f]=GUI_QUICK[+t.dataset.qclr];guiEdit(()=>{const P=gui.skin.L[gui.scope].el[sel];if(P)delete P[f]});guiCommit();guiRender();return}
  if(t.dataset.go!==undefined){guiSelect(t.dataset.go);return}
  if(t.dataset.tuclr){guiTuneSet(t.dataset.tuclr);guiRender();return}
  if(t.dataset.wtclr){guiEdit(()=>delete gui.skin.text[t.dataset.wtclr]);guiCommit();guiRender();return}
  if(t.dataset.wdclr){guiEdit(()=>delete gui.skin.words[t.dataset.wdclr]);guiCommit();guiRender();guiTipShow(t.dataset.wdclr);return}
  if(t.dataset.peek!==undefined){if(t.tagName==='INPUT')guiPeek(t.dataset.peek,t.checked);return}
  if(t.dataset.clr){const f=t.dataset.clr;guiEdit(()=>{if(f==='text')delete gui.skin.text[gui.sel];else delete guiEntry(true)[f]});guiCommit();guiRender();return}
  if(t.dataset.vclr){guiEdit(()=>delete gui.skin.L[gui.scope].vars[t.dataset.vclr]);guiCommit();guiRender();return}
  if(t.dataset.hist!==undefined){guiSetSkin(guiNorm(JSON.parse(gui.histList[+t.dataset.hist].data)),'An earlier live look is on screen. Publish to make it live again.');return}
  if(a==='close')guiOpen(false);
  else if(a==='min')gui.ui.classList.toggle('min');
  else if(a==='side')guiLs('bhd_gui_side',gui.ui.classList.toggle('left')?'left':null);
  else if(a==='undo')guiUndo(false);else if(a==='redo')guiUndo(true);
  else if(a==='add'){gui.add=!gui.add;guiRender()}
  else if(a==='pick'){gui.pick=!gui.pick;gui.hover=null;gui.doc.documentElement.classList.toggle('guiPicking',gui.pick);guiRender()}
  else if(a==='parent'&&gui.el){guiPick(gui.el.parentElement)}
  else if(a==='none'){guiSetSel([]);guiRender()}
  else if(a==='reset'){guiEdit(()=>{delete gui.skin.L[gui.scope].el[gui.sel];if(gui.scope==='all')delete gui.skin.text[gui.sel]});guiCommit();guiRender()}
  else if(a==='publish')guiPublish();
  else if(a==='tunepub')guiTunePublish();
  else if(a==='tunereset'){guiTuneSet(null);gui.msg='Every number is back to the game\'s own. Publish to give every device the same.';guiRender()}
  else if(a==='tunedrop'){tune.draft=null;tuneLs(TUNE_LS,null);tuneUse();gui.msg='Back to the live tuning.';guiRender()}
  else if(a==='tuneload'){gui.msg='Loading…';guiStatus();tune.live=null;guiTuneFetch().then(()=>{if(!tune.live){gui.msg='No live tuning yet: every device plays by the game\'s own numbers.';guiStatus()}else{gui.msg='The live tuning is loaded.';guiRender()}})}
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
  if(f==='sel'){const el=gui.el;guiSetSel([t.value],el);guiRender();return}
  if(t.dataset.q!==undefined){const [,sel,fld]=GUI_QUICK[+t.dataset.q];guiEdit(()=>{const E=gui.skin.L[gui.scope].el;(E[sel]=E[sel]||{})[fld]=+t.value});
    const o=gui.ui.querySelector(`[data-qo="${t.dataset.q}"]`);if(o)o.textContent=t.value+' px';return}
  if(f==='key'||f==='paste')return;
  if(t.dataset.tu){const en=TUNE.find(x=>x[0]===t.dataset.tu),d=parseFloat(t.value);if(!en||!isFinite(d))return;const v=Math.min(en[6],Math.max(en[5],d));
    if(e.type==='change')t.value=v;
    guiTuneSet(en[0],Math.abs(v-guiNum(en,en[3]))<en[7]/2?undefined:tuneCode(en,v));const r=t.closest('.gf').querySelector('[data-tuclr]');if(r)r.disabled=(tune.draft||tune.live||{set:{}}).set[en[0]]===undefined;return}
  if(t.dataset.wt!==undefined){if(e.type==='change')return;const sel=t.dataset.wt;guiEdit(()=>gui.skin.text[sel]=t.value);t.parentElement.querySelector('button').disabled=false;return}
  if(t.dataset.wd){if(e.type==='change')return;const id=t.dataset.wd,w=WORDS.find(x=>x[0]===id);guiEdit(()=>{if(w&&t.value===w[2])delete gui.skin.words[id];else gui.skin.words[id]=t.value});
    t.parentElement.querySelector('button').disabled=gui.skin.words[id]===undefined;guiTipShow(id);return}
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
