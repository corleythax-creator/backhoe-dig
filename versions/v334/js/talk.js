// Corley's Island: townsfolk who talk. Each grown-up townsperson has the personality designed for them in Human Forge
// (models/people/library.json's "mind", read by Human Forge's human-forge-mind.js, copied there by forge.py wire);
// what they say comes from Human Forge's /api/persona, a language model under that server's fixed rules (fictional
// adults, PG-13, nothing sexual, no real people, no hate or help with harm, honest about being an AI if asked).
// Off unless switched on (☰ → Townsfolk talk: Off, Text, Aloud; bhd_talk on this device); children never talk.
// Only the owner can talk to them: the server answers nobody without the owner key (☰ → Talk model → Key, once a
// device). ☰ also picks who speaks (Built-in, free and made in this browser, the default; Haiku, about 0.03¢ a line; Sonnet, 0.5¢; Opus, 1¢), sets the daily cap in dollars
// (the server stops at it) and shows the meter: today's spend, lines, and about how many more at the model picked.
// On foot: walk up to someone and they stop, turn to you and say hello; bump into them and they say something about it;
// Talk (Enter, or the chip that shows near someone) opens a box to say something to the nearest one, who answers.
// Lines show over their heads; Aloud reads them in the browser's own voices.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TALK={mode:'off',lib:null,M:null,near:null,with:null,bub:new Map(),far:new Map(),bump:new Map(),v:new THREE.Vector3(),t:0,ui:null};
const TALK_NEAR=3,TALK_HI=2.2,TALK_FAR=5,TALK_URL='https://human-forge-beta.vercel.app/api/persona',TALK_ME='a man in a hard hat and a hi-vis vest';
try{TALK.mode=localStorage.getItem('bhd_talk')||'off'}catch(e){}
// the library's people, by id, for their personalities (once)
function talkLib(){if(TALK.lib!==null)return;TALK.lib=0;fetch('models/people/library.json').then(r=>r.json()).then(j=>{TALK.lib={};for(const p of j.people||[])TALK.lib[p.id]=p}).catch(()=>{TALK.lib=null})}
function talkCard(p){if(!TALK.lib||!p||p.dead||p.hurt||p.drv||p.cop)return null;const it=TALK.lib['island_'+p.body];return it&&window.HumanForgeMind?HumanForgeMind.card(it):null}
function talkName(p){const c=talkCard(p);return c?c.name:'someone'}
function talkInit(){if(TALK.M||!window.HumanForgeMind)return;
  TALK.M=HumanForgeMind.create({url:TALK_URL,storage:'bhd_talk_on',budget:200,card:p=>talkCard(p),people:()=>tf.people,label:p=>talkName(p),
    scene:p=>`Corley's Island, a small town on an island off the Mississippi Gulf Coast. ${talkName(p)} is ${p.room?'inside a shop':'out on the street'}; the one talking to them is ${TALK_ME}.`,
    show:(p,a)=>talkShow(p,a),changed:()=>talkPaint()});
  try{localStorage.setItem('bhd_talk_on','1')}catch(e){}  // the runtime's own switch: on whenever the menu's is not Off
}
// ☰ → Townsfolk talk
function talkSet(m){TALK.mode=m;try{localStorage.setItem('bhd_talk',m)}catch(e){}
  for(const b of document.querySelectorAll('#talkRow button'))b.setAttribute('aria-pressed',String(b.dataset.talk===m));
  for(const r of document.querySelectorAll('.talkOpt'))r.hidden=m==='off';
  if(m==='off'){talkClose();for(const b of TALK.bub.values())b.el.remove();TALK.bub.clear();if(TALK.M)TALK.M.hush()}else{talkLib();talkInit();TALK.M&&TALK.M.check();talkPaint()}}
for(const b of document.querySelectorAll('#talkRow button'))b.onclick=()=>talkSet(b.dataset.talk);
talkSet(TALK.mode);

// ---- what shows: a chip near someone, the box to type in, the lines over heads
function talkUI(){if(TALK.ui)return TALK.ui;const d=document.createElement('div');d.id='talkBox';d.hidden=true;
  d.innerHTML='<button id="talkChip"></button><form id="talkForm" hidden><input id="talkIn" maxlength="300" autocomplete="off" placeholder="Say something"><button>Say</button><button type="button" id="talkX">×</button></form><div id="talkStatus"></div>';
  document.body.appendChild(d);
  const L=document.createElement('div');L.id='talkLines';document.body.appendChild(L);
  d.querySelector('#talkChip').onclick=()=>talkOpen();d.querySelector('#talkX').onclick=()=>talkClose();
  d.querySelector('#talkForm').onsubmit=e=>{e.preventDefault();const i=d.querySelector('#talkIn'),v=i.value.trim();i.value='';if(v&&TALK.with&&TALK.M)TALK.M.tell(TALK.with,v)};
  // typing goes to the box, not the game's keys
  for(const ev of ['keydown','keyup'])d.querySelector('#talkIn').addEventListener(ev,e=>{e.stopPropagation();if(ev==='keydown'&&e.key==='Escape')talkClose()});
  TALK.ui={d,L};return TALK.ui}
function talkOpen(){const p=TALK.near;if(!p||!TALK.M)return;TALK.with=p;const u=talkUI();u.d.querySelector('#talkForm').hidden=false;
  const i=u.d.querySelector('#talkIn');i.placeholder='Say something to '+talkName(p);i.focus();talkFace(p,6);talkPaint()}
function talkClose(){TALK.with=null;if(!TALK.ui)return;TALK.ui.d.querySelector('#talkForm').hidden=true;const i=TALK.ui.d.querySelector('#talkIn');i.blur();talkPaint()}
function talkPaint(){const M=TALK.M;if(!M)return;
  // ☰: the model and cap picked, and the meter
  for(const b of document.querySelectorAll('#talkModelRow [data-tm]'))b.setAttribute('aria-pressed',String(b.dataset.tm===M.model));
  for(const b of document.querySelectorAll('#talkCapRow [data-tc]'))b.setAttribute('aria-pressed',String(!!M.spend&&+b.dataset.tc===M.spend.cap));
  const mt=$('#talkMeter');if(mt)mt.textContent=HumanForgeMind.meterText(M)+(M.status&&!M.status.startsWith('Enter the owner')?' '+M.status:'');
  if(!TALK.ui)return;const s=TALK.ui.d.querySelector('#talkStatus'),p=TALK.with,sp=M.spend;
  s.textContent=p&&M.busy.has(p)?talkName(p)+' is thinking…':M.status||(sp?`${HumanForgeMind.NAME[M.model]} · ${HumanForgeMind.money(sp.spent)} of ${HumanForgeMind.money(sp.cap)} today`:'')}
for(const b of document.querySelectorAll('#talkModelRow [data-tm]'))b.onclick=()=>{if(TALK.M){TALK.M.model=b.dataset.tm;talkPaint()}};
for(const b of document.querySelectorAll('#talkCapRow [data-tc]'))b.onclick=()=>{if(TALK.M)TALK.M.setCap(+b.dataset.tc)};
$('#talkKeyBtn').onclick=()=>{if(!TALK.M)return;const v=prompt('The owner key for townsfolk talk (from Human Forge\'s Vercel settings, PERSONA_OWNER_KEY). It stays on this device.',TALK.M.key?'':'');if(v&&v.trim())TALK.M.key=v.trim()};
// stop and turn to the player a while (walkers only: someone in a shop or a car stays put)
function talkFace(p,s){if(p.room||p.drv||p.cop||p.dead)return;p.wait=Math.max(p.wait||0,s);p.look=Math.atan2(wk.x-p.x,wk.z-p.z)}
function talkShow(p,a){const u=talkUI();let b=TALK.bub.get(p);if(!b){b={el:document.createElement('div')};b.el.className='talkLine';u.L.appendChild(b.el);TALK.bub.set(p,b)}
  b.el.innerHTML='';const n=document.createElement('b');n.textContent=talkName(p);b.el.append(n,document.createTextNode(a.say));
  b.until=performance.now()/1000+3.5+a.say.split(/\s+/).length*0.38;talkFace(p,b.until-performance.now()/1000);
  if(TALK.mode==='voice'){const c=talkCard(p);TALK.M.speak(a.say,c)}}

// ---- each frame (from main.js): who is near, walking up, bumping, the lines' places
function talkTick(dt){
  const on=TALK.mode!=='off'&&TALK.M&&TALK.lib&&tf.on&&mode==='walk'&&!wk.inside;
  if(!on){if(TALK.ui)TALK.ui.d.hidden=true;if(TALK.with)talkClose();for(const b of TALK.bub.values())b.el.classList.remove('on');return}
  const u=talkUI(),now=performance.now()/1000;
  // the nearest one who can talk, within reach
  let best=null,bd=TALK_NEAR;
  if((TALK.t+=dt)>0.2){TALK.t=0;
    for(const p of tf.people){if(p.inside||!talkCard(p))continue;const d=Math.hypot(p.x-wk.x,p.z-wk.z);
      if(d<bd){bd=d;best=p}
      // walking up to them: from beyond TALK_FAR to within TALK_HI, they turn and say hello (once in a while)
      if(d>TALK_FAR)TALK.far.set(p,1);else if(d<TALK_HI&&TALK.far.get(p)){TALK.far.set(p,0);talkFace(p,4);TALK.M.event(p,{kind:'approached',who:TALK_ME})}
      // bumping into them on the way past
      if(d<0.6&&(wk.spd||0)>1){const t=TALK.bump.get(p)||0;if(now-t>3){TALK.bump.set(p,now);talkFace(p,3);TALK.M.event(p,{kind:'touched',who:TALK_ME,where:'shoulder'})}}}
    for(const p of [...TALK.far.keys()])if(!tf.people.includes(p))TALK.far.delete(p);
    TALK.near=best;
    if(TALK.with&&(!tf.people.includes(TALK.with)||Math.hypot(TALK.with.x-wk.x,TALK.with.z-wk.z)>8))talkClose()}
  if(TALK.with)talkFace(TALK.with,1);
  const chip=u.d.querySelector('#talkChip'),p=TALK.with||TALK.near;
  u.d.hidden=!p;if(p)chip.textContent=TALK.with?'Talking to '+talkName(p):(PHONE?'Talk to ':'Enter: talk to ')+talkName(p);
  // the lines over their heads
  const r=renderer.domElement.getBoundingClientRect();
  for(const [q,b] of TALK.bub){if(!tf.people.includes(q)||now>b.until+1){b.el.remove();TALK.bub.delete(q);continue}
    const up=now<b.until,v=TALK.v.set(q.x,q.y+1.95*(q.sc||1),q.z).project(camera);
    if(!up||v.z>1){b.el.classList.remove('on');continue}
    b.el.classList.add('on');const half=b.el.offsetWidth/2+6;
    b.el.style.left=Math.round(r.left+Math.max(half,Math.min(r.width-half,(v.x+1)/2*r.width)))+'px';b.el.style.top=Math.round(r.top+(1-v.y)/2*r.height)+'px'}
  TALK.M.step(dt)}
