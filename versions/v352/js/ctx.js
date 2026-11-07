// Corley's Island: what you can do here. CTX says when each button in the action dock over the right stick shows and how
// much it matters right now; the dock shows the CTX_MAX that matter most (in CTX order, so buttons keep their places) and
// More opens the rest. The Use button over the left stick does the best thing where you stand (useCtx): get in or out,
// load or unload a pickup, buy, order, talk, play chess. ctxTick (main.js, ten times a second) writes the screen only when
// something changes. Buttons run their actions through act (keys.js b, controls.js); Use is the enter action (F, B).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const ctxFoot=()=>mode==='walk'&&!wk.inside;
// [button id, when it shows, how much it matters now: higher shows first]
const CTX=[
  ['boxBtn',()=>TB.hooked||boxNear(),()=>9],
  ['cplBtn',()=>!!cpl.ui,()=>8],
  ['gripBtn',()=>!!cpl.grip,()=>9],
  ['pumpBtn',()=>waterAny,()=>pumpOn?9:6],
  ['wipeBtn',()=>wipeWant,()=>wipeOn?7:5],
  ['sprintBtn',ctxFoot,()=>wk.sprint?9:5],
  ['jumpBtn',ctxFoot,()=>8],
  ['plantBtn',ctxFoot,()=>3],
  ['trimBtn',ctxFoot,()=>trim.on?9:3],
  ['bumpBtn',()=>ctxFoot()&&trim.on,()=>trim.line<TU.trimMin?10:6],
  ['gunBtn',ctxFoot,()=>gun.eq?7:2],
  ['reloadBtn',()=>ctxFoot()&&gunHas(),()=>gun.am[gun.k][0]<gunW().mag?7:4],
  ['fireBtn',()=>ctxFoot()&&gunHas(),()=>10]];
const CTX_MAX=4;
let ctxOpen=false;
const ctxEl={};for(const c of CTX)ctxEl[c[0]]=$('#'+c[0]);
// the best thing to do here: {lbl, run}, or null
function useCtx(){
  if(!ctxFoot())return wk.inside&&rideOf(mode)?{lbl:say('useOut'),run:seatToggle}:null;
  const c=pbCtx(),lbl=c&&(c.lbl||(c.a==='buy'?'Buy '+PB_KINDS[c.k].s+' '+usd(TOWN_PB[c.k]):PB_BTN[c.a]));
  // something in your hands, or a pickup's load at its tailgate, comes first
  if(c&&(pbS.hold||c.a==='unload'))return {lbl,run:pbAct};
  if(wkNear())return {lbl:say('useIn'),run:seatToggle};
  const g=famGameNear();if(g)return {lbl:g.b,run:seatToggle};
  if(TALK.mode!=='off'&&TALK.M&&TALK.lib&&tf.on&&TALK.near)return {lbl:say('useTalk',{name:talkName(TALK.near)}),run:talkOpen};
  return c?{lbl,run:pbAct}:null}
function useAct(){const u=useCtx();if(u)u.run();else seatToggle()}
function ctxTick(){const av=CTX.filter(c=>c[1]()),many=av.length>CTX_MAX;
  if(!many)ctxOpen=false;
  const top=many&&!ctxOpen?new Set(av.slice().sort((a,b)=>b[2]()-a[2]()).slice(0,CTX_MAX)):null;
  for(const c of CTX){const el=ctxEl[c[0]],show=av.includes(c)&&(!top||top.has(c));if(el.hidden===show)el.hidden=!show}
  const mb=$('#moreBtn');if(mb.hidden===many)mb.hidden=!many;
  if(many){const t=ctxOpen?say('ctxLess'):say('ctxMore');if(mb.textContent!==t){mb.textContent=t;mb.setAttribute('aria-expanded',ctxOpen)}}
  const u=useCtx(),sb=$('#seatBtn');if(sb.hidden===!!u)sb.hidden=!u;if(u&&sb.textContent!==u.lbl)sb.textContent=u.lbl}
$('#moreBtn').addEventListener('pointerdown',e=>{e.preventDefault();ctxOpen=!ctxOpen;ctxTick()});
// a button picked from the opened list closes it again
$('#actDock').addEventListener('pointerup',e=>{const b=e.target.closest('button');if(ctxOpen&&b&&b.id!=='moreBtn'&&!b.closest('#exSwitch')){ctxOpen=false;setTimeout(ctxTick)}});
