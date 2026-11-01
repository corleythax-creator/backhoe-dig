// Corley's Island: townsfolk who talk. Each grown-up townsperson has the personality designed for them in Human Forge
// (models/people/library.json's "mind", read by Human Forge's human-forge-mind.js, copied there by its forge_minds.py
// --wire). What they say comes from its built-in mind by default: free, made in this browser from their traits, what
// they have met and seen (kept per browser in bhd_talk_on-brain) and their mood, no server. For the owner, ☰ → Talk
// model can pick Haiku, Sonnet or Opus instead: Human Forge's /api/persona, a language model under that server's fixed
// rules (fictional adults, PG-13, nothing sexual, no real people, no hate or help with harm, honest about being an AI
// if asked), answering nobody without the owner key (Key, once a device), stopping at the daily cap; until then, and for
// what only the built-in mind knows (machines going by, someone going), the built-in mind speaks.
// On as Text unless switched off (☰ → Townsfolk talk: Off, Text, Aloud; bhd_talk on this device); children never talk,
// nor anyone dead, hurt, driving or a cop.
// On foot: walk up to someone and they stop, turn to you and say hello; bump into them and they say something about it;
// Talk (Enter, or the chip that shows near someone) opens a box to say something to the nearest one, who answers.
// Among themselves: within TU.talkSeeR of you (on foot or in a machine), two grown-ups within TU.talkChatR of each
// other now and then say something to each other (the runtime's chatter), both turning to face; alone, one may remark
// on what is round them (machines, the marina's gulls: talkSights). Drive a machine within TU.talkRoadR of
// someone and they remark on it: fast (over TU.talkRoadV), that it nearly had them; slow or stopped, on the machine.
// Lines show over their heads; Aloud reads them in the most natural voice the browser has, each townsperson keeping their own.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TALK={mode:'text',lib:null,M:null,near:null,with:null,bub:new Map(),far:new Map(),bump:new Map(),v:new THREE.Vector3(),t:0,ui:null,
  here:[],at:new Map(),ride:null,v0:0};
const TALK_NEAR=3,TALK_HI=2.2,TALK_FAR=5,TALK_URL='https://human-forge-beta.vercel.app/api/persona',TALK_ME='a man in a hard hat and a hi-vis vest';
// the menu's choice; an 'off' only counts if talk was ever on on this device (bhd_talk_on), since older versions wrote
// 'off' for everyone at load, when Off was the default
try{const m=localStorage.getItem('bhd_talk');TALK.mode=m&&(m!=='off'||localStorage.getItem('bhd_talk_on'))?m:'text'}catch(e){}
// the library's people, by id, for their personalities (once)
function talkLib(){if(TALK.lib!==null)return;TALK.lib=0;fetch('models/people/library.json').then(r=>r.json()).then(j=>{TALK.lib={};for(const p of j.people||[])TALK.lib[p.id]=p}).catch(()=>{TALK.lib=null})}
function talkCard(p){if(!TALK.lib||!p||p.dead||p.hurt||p.drv||p.cop)return null;const it=TALK.lib['island_'+p.body];return it&&window.HumanForgeMind?HumanForgeMind.card(it):null}
function talkName(p){if(p==='player')return say('tkPlayer');const c=talkCard(p);return c?c.name:'someone'}
// a machine's name with its article ('an excavator', 'a dozer')
function talkA(n){return (/^[aeiou]/i.test(n)?'an ':'a ')+n}
// where they are and when, in a few plain words (the built-in mind answers "where are we?" from its first part)
function talkScene(p,to){const h=typeof townHour==='function'?townHour():12,when=h>=4&&h<12?'morning':h<17?'afternoon':h<21?'evening':'night';
  const where=p.room&&typeof townShopName==='function'?'inside '+townShopName(p.room):'out on the street in town';
  return `Corley's Island, a small town on an island off the Mississippi Gulf Coast, in the ${when}. ${talkName(p)} is ${where}`+
    (to==='you'||to==null?`; the one talking to them is ${TALK_ME}.`:`, talking with ${talkName(to)}.`)}
// what they can see that is not a person (the runtime looks these over once a second and remarks on what is new or
// coming closer): the machines (driven or parked) and the gulls on the marina's pilings. The town's own cars are left
// out: they come and go all day, and a remark on each would drown the talk.
function talkSights(p){const out=[],R2=TU.talkSightR;
  for(const k in WK_RIDES){const o=WK_RIDES[k].o;if(!o||!isFinite(o.x))continue;const d=Math.hypot(o.x-p.x,o.z-p.z);
    if(d<R2)out.push({what:talkA(WK_RIDES[k].n),feet:d/FT,ref:'ride:'+k,moving:k===TALK.ride&&TALK.v0>0.5})}
  if(typeof MAR==='object'&&Math.abs(p.x-MAR.x)<R2&&p.z>MAR.z0-R2&&p.z<MAR.z0+MAR.len+R2)out.push({what:'the gulls on the pier',ref:'gulls'});
  out.sort((a,b)=>(a.feet??1e9)-(b.feet??1e9));return out.slice(0,4)}
// someone who can join in among themselves: on foot or seated, not driving, fleeing or cowering
function talkFree(p){return !p.inside&&!p.drv&&!p.cop&&!p.dead&&!p.hurt&&!(p.flee>0)&&!(p.cower>0)}
// who they would talk to: the nearest other grown-up within TU.talkChatR, not one of their own look (the same name)
function talkNearest(p){let best=null,bd=TU.talkChatR;for(const q of TALK.here){if(q===p||q.body===p.body||!talkFree(q))continue;
  const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd&&Math.abs((q.y||0)-(p.y||0))<1.5){bd=d;best=q}}return best}
function talkInit(){if(TALK.M||!window.HumanForgeMind)return;
  TALK.M=HumanForgeMind.create({url:TALK_URL,storage:'bhd_talk_on',budget:200,card:p=>p==='player'?null:talkCard(p),people:()=>TALK.here,label:p=>talkName(p),
    nearest:p=>talkFree(p)?talkNearest(p):null,sights:p=>p==='player'?[]:talkSights(p),scene:(p,to)=>talkScene(p,to),
    show:(p,a,to,ev)=>talkShow(p,a,to,ev),changed:()=>talkPaint()});
  TALK.M.chatter=true;
  try{localStorage.setItem('bhd_talk_on','1')}catch(e){}  // the runtime's own switch, on; also marks that talk was on here
}
// ☰ → Townsfolk talk (saved only when picked)
function talkSet(m,keep){TALK.mode=m;if(keep)try{localStorage.setItem('bhd_talk',m)}catch(e){}
  for(const b of document.querySelectorAll('#talkRow button'))b.setAttribute('aria-pressed',String(b.dataset.talk===m));
  for(const r of document.querySelectorAll('.talkOpt'))r.hidden=m==='off';
  if(m==='off'){talkClose();for(const b of TALK.bub.values())b.el.remove();TALK.bub.clear();if(TALK.M){TALK.M.chatter=false;TALK.M.hush()}}
  else{talkLib();talkInit();if(TALK.M){TALK.M.chatter=true;if(TALK.M.model!=='local')TALK.M.check()}talkPaint()}}
for(const b of document.querySelectorAll('#talkRow button'))b.onclick=()=>talkSet(b.dataset.talk,1);
talkSet(TALK.mode);

// ---- what shows: a chip near someone, the box to type in, the lines over heads
function talkUI(){if(TALK.ui)return TALK.ui;const d=document.createElement('div');d.id='talkBox';d.hidden=true;
  d.innerHTML='<button id="talkChip"></button><form id="talkForm" hidden><input id="talkIn" maxlength="300" autocomplete="off"><button></button><button type="button" id="talkX">×</button></form><div id="talkStatus"></div>';
  d.querySelector('#talkForm button').textContent=say('tkSay');
  document.body.appendChild(d);
  const L=document.createElement('div');L.id='talkLines';document.body.appendChild(L);
  d.querySelector('#talkChip').onclick=()=>talkOpen();d.querySelector('#talkX').onclick=()=>talkClose();
  d.querySelector('#talkForm').onsubmit=e=>{e.preventDefault();const i=d.querySelector('#talkIn'),v=i.value.trim();i.value='';if(v&&TALK.with&&TALK.M)TALK.M.tell(TALK.with,v)};
  // typing goes to the box, not the game's keys
  for(const ev of ['keydown','keyup'])d.querySelector('#talkIn').addEventListener(ev,e=>{e.stopPropagation();if(ev==='keydown'&&e.key==='Escape')talkClose()});
  TALK.ui={d,L};return TALK.ui}
function talkOpen(){const p=TALK.near;if(!p||!TALK.M)return;TALK.with=p;const u=talkUI();u.d.querySelector('#talkForm').hidden=false;
  const i=u.d.querySelector('#talkIn');i.placeholder=say('tkSayTo',{name:talkName(p)});i.focus();talkFace(p,6);talkPaint()}
function talkClose(){TALK.with=null;if(!TALK.ui)return;TALK.ui.d.querySelector('#talkForm').hidden=true;const i=TALK.ui.d.querySelector('#talkIn');i.blur();talkPaint()}
function talkPaint(){const M=TALK.M;if(!M)return;
  // ☰: who speaks, the cap (models only) and the meter
  for(const b of document.querySelectorAll('#talkModelRow [data-tm]'))b.setAttribute('aria-pressed',String(b.dataset.tm===M.model));
  for(const b of document.querySelectorAll('#talkCapRow [data-tc]'))b.setAttribute('aria-pressed',String(!!M.spend&&+b.dataset.tc===M.spend.cap));
  const cr=$('#talkCapRow');if(cr)cr.hidden=TALK.mode==='off'||M.model==='local';
  const mt=$('#talkMeter');if(mt)mt.textContent=HumanForgeMind.meterText(M)+(M.model!=='local'&&M.status&&!M.status.startsWith('Enter the owner')?' '+M.status:'');
  if(!TALK.ui)return;const s=TALK.ui.d.querySelector('#talkStatus'),p=TALK.with,sp=M.spend;
  s.textContent=p&&M.busy.has(p)?say('tkThinking',{name:talkName(p)}):M.model==='local'?'':M.status||(sp?`${HumanForgeMind.NAME[M.model]} · ${HumanForgeMind.money(sp.spent)} of ${HumanForgeMind.money(sp.cap)} today`:'')}
for(const b of document.querySelectorAll('#talkModelRow [data-tm]'))b.onclick=()=>{if(TALK.M){TALK.M.model=b.dataset.tm;if(b.dataset.tm!=='local'&&TALK.M.key)TALK.M.meter();talkPaint()}};
for(const b of document.querySelectorAll('#talkCapRow [data-tc]'))b.onclick=()=>{if(TALK.M)TALK.M.setCap(+b.dataset.tc)};
$('#talkKeyBtn').onclick=()=>{if(!TALK.M)return;const v=prompt('The owner key for townsfolk talk (from Human Forge\'s Vercel settings, PERSONA_OWNER_KEY). It stays on this device.',TALK.M.key?'':'');if(v&&v.trim())TALK.M.key=v.trim()};
// stop and turn toward a spot a while (the player, unless given): walkers only, someone in a shop or a car stays put
function talkFace(p,s,x=wk.x,z=wk.z){if(!p||typeof p!=='object'||p.room||p.drv||p.cop||p.dead)return;p.wait=Math.max(p.wait||0,s);p.look=Math.atan2(x-p.x,z-p.z)}
function talkShow(p,a,to,ev){const u=talkUI();let b=TALK.bub.get(p);if(!b){b={el:document.createElement('div')};b.el.className='talkLine';u.L.appendChild(b.el);TALK.bub.set(p,b)}
  b.el.innerHTML='';const n=document.createElement('b');n.textContent=talkName(p);b.el.append(n,document.createTextNode(a.say));
  b.until=performance.now()/1000+3.5+a.say.split(/\s+/).length*0.38;const s=b.until-performance.now()/1000;
  // who they turn to: the one they talk to (and that one back), what happened to them, or you
  if(to&&typeof to==='object'){talkFace(p,s,to.x,to.z);talkFace(to,s,p.x,p.z);if(!p.spd)p.tk=1}
  else if(ev&&ev.kind==='thing'){const w=TALK.at.get(p);if(w)talkFace(p,Math.min(s,3),w[0],w[1])}
  else if(ev&&ev.by&&typeof ev.by==='object')talkFace(p,Math.min(s,4),ev.by.x,ev.by.z);
  else if(to==='you'||ev&&ev.by==='player')talkFace(p,s);
  if(TALK.mode==='voice'){const c=talkCard(p);TALK.M.speak(a.say,c)}}

// ---- a few times a second: who is about (TALK.here, near you or the machine you drive), who is near you on foot,
// walking up, bumping, a machine going by, someone lying still
function talkLook(dt){const M=TALK.M,now=performance.now()/1000,foot=mode==='walk'&&!wk.inside;
  const rk=foot?null:wk.inside||rideOf(mode),R=rk&&WK_RIDES[rk],o=R&&R.o,F=o&&isFinite(o.x)?o:wk;
  // how fast the machine is going (from where it was last look)
  let v=0;if(o){const L=TALK.ride===rk&&TALK.rideAt;if(L)v=Math.hypot(o.x-L[0],o.z-L[1])/Math.max(dt,0.05);TALK.rideAt=[o.x,o.z]}
  TALK.ride=rk;TALK.v0=v;
  const here=[],dead=[];
  for(const p of tf.people){if(p.dead){dead.push(p);continue}
    if(p.inside||p.flee>0||p.cower>0||Math.hypot(p.x-F.x,p.z-F.z)>TU.talkSeeR||!talkCard(p))continue;here.push(p)}
  TALK.here=here;
  let best=null,bd=TALK_NEAR;
  for(const p of here){
    if(foot){const d=Math.hypot(p.x-wk.x,p.z-wk.z);
      if(d<bd){bd=d;best=p}
      // walking up to them: from beyond TALK_FAR to within TALK_HI, they turn and say hello (once in a while)
      if(d>TALK_FAR)TALK.far.set(p,1);else if(d<TALK_HI&&TALK.far.get(p)){TALK.far.set(p,0);talkFace(p,4);M.event(p,{kind:'approached',by:'player'})}
      // bumping into them on the way past
      if(d<0.6&&(wk.spd||0)>1){const t=TALK.bump.get(p)||0;if(now-t>3){TALK.bump.set(p,now);talkFace(p,3);M.event(p,{kind:'touched',by:'player',where:'shoulder'})}}}
    else if(o){
      // the machine he drives, close by: too fast and it nearly had them; slow or stopped, they remark on it
      let d=1e9;for(const lz of R.c||[0])d=Math.min(d,Math.hypot(p.x-o.x-Math.sin(o.yaw||0)*lz,p.z-o.z-Math.cos(o.yaw||0)*lz)-(R.r||1));
      if(d<TU.talkRoadR){TALK.at.set(p,[o.x,o.z]);if(M.event(p,{kind:'thing',what:talkA(R.n),how:v>TU.talkRoadV?'road':'car'}))talkFace(p,2.5,o.x,o.z)}}
    // someone lying still nearby
    for(const q of dead)if(Math.hypot(q.x-p.x,q.z-p.z)<TU.talkStillR){M.event(p,{kind:'still',by:q});break}}
  for(const p of [...TALK.far.keys()])if(!tf.people.includes(p))TALK.far.delete(p);
  for(const p of [...TALK.at.keys()])if(!tf.people.includes(p))TALK.at.delete(p);
  TALK.near=best;
  if(TALK.with&&(!foot||!tf.people.includes(TALK.with)||Math.hypot(TALK.with.x-wk.x,TALK.with.z-wk.z)>8))talkClose()}

// ---- each frame (from main.js)
function talkTick(dt){
  const on=TALK.mode!=='off'&&TALK.M&&TALK.lib&&tf.on;
  if(!on){if(TALK.ui)TALK.ui.d.hidden=true;if(TALK.with)talkClose();for(const b of TALK.bub.values())b.el.classList.remove('on');return}
  const u=talkUI(),now=performance.now()/1000,foot=mode==='walk'&&!wk.inside;
  if((TALK.t+=dt)>0.25){talkLook(TALK.t);TALK.t=0}
  if(TALK.with)talkFace(TALK.with,1);
  const chip=u.d.querySelector('#talkChip'),p=foot&&(TALK.with||TALK.near);
  u.d.hidden=!p;if(p)chip.textContent=TALK.with?say('tkWith',{name:talkName(p)}):say(PHONE?'tkChipPhone':'tkChip',{name:talkName(p)});
  // the lines over their heads
  const r=renderer.domElement.getBoundingClientRect();
  for(const [q,b] of TALK.bub){if(!tf.people.includes(q)||now>b.until+1){b.el.remove();TALK.bub.delete(q);continue}
    const up=now<b.until,v=TALK.v.set(q.x,q.y+1.95*(q.sc||1),q.z).project(camera);
    if(!up||v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1){b.el.classList.remove('on');continue}
    b.el.classList.add('on');const half=b.el.offsetWidth/2+6;
    b.el.style.left=Math.round(r.left+Math.max(half,Math.min(r.width-half,(v.x+1)/2*r.width)))+'px';b.el.style.top=Math.round(r.top+(1-v.y)/2*r.height)+'px'}
  TALK.M.step(dt)}
