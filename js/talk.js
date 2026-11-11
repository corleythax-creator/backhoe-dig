// Corley's Island: townsfolk who talk. Each grown-up townsperson has the personality designed for them in Human Forge
// (models/people/library.json's "mind", read by Human Forge's human-forge-mind.js, copied there by its forge_minds.py
// --wire). What they say comes from its built-in mind by default: free, made in this browser from their traits, what
// they have met and seen (kept per browser in bhd_talk_on-brain) and their mood, no server. For the owner, ☰ → Talk
// model can pick Haiku, Sonnet or Opus instead: Human Forge's /api/persona, a language model under that server's fixed
// rules (fictional adults, PG-13, nothing sexual, no real people, no hate or help with harm, honest about being an AI
// if asked), answering nobody without the owner key (Key, once a device), stopping at the daily cap; until then, and for
// what only the built-in mind knows (machines going by, someone going), the built-in mind speaks.
// On as Text unless switched off (☰ → Townsfolk talk: Off, Text, Aloud, Voice only: aloud with no lines shown; bhd_talk on this device); nobody dead, hurt,
// driving or a cop talks. The young ones (under 18) never go to the runtime or a model (grown-ups only): they say hi and
// answer in the talk box with the game's own kid and teen lines (talkKid, talkKidSay).
// On foot: they mostly carry on with their lives as you walk up (talkNotice: someone afraid or wary of you shows it; someone
// at a loose end, now and then, TU.tkNotice, looks up and says hello); bump into them and they say something about it;
// Talk (Enter, or the chip that shows near someone) opens a box to say something to the nearest one, who answers.
// Among themselves: within TU.talkSeeR of you (on foot or in a machine), two grown-ups within TU.talkChatR of each
// other now and then say something to each other (the runtime's chatter), both turning to face; alone, one may remark
// on what is round them (machines, the marina's gulls: talkSights). Drive a machine within TU.talkRoadR of
// someone and they remark on it: fast (over TU.talkRoadV), that it nearly had them; slow or stopped, on the machine.
// What they notice they act on (talkAct): run or step back from it, stop and watch it, freeze, or walk over to look or
// to help (TU.talkGoT); with a model speaking, the calm choices are the model's (Human Forge's runtime). Gunshots reach
// everyone about. Talk to everyone (the Everyone button, or starting with "everyone", "y'all"...) when two or more are
// within TU.talkGroupR: those it is for answer in turn. A model hears the moment (talkScene): the day and hour, the
// weather, the shop, what you are doing and driving, the day's work, the police, and what happened lately (talkNews).
// Errands (talkErrands): every so often a walker picks one (the General Store, the beer garden, Harbor Square, the shop
// windows, a stroll, or going over to someone about) by habit (the hour and their nature); with a model speaking, those
// near you have it choose (Human Forge's minds.plan, its town_* keys, at most one ask every TU.talkPlanGap), and two
// chatting may suggest one and go off on it together (joint, agreed). They walk there the shortest way (tfGoalPick).
// Lines show over their heads; Aloud reads them in the most natural voice the browser has, each townsperson keeping their own,
// heard only within TU.talkHearR of the camera and fainter with distance, muffled through walls and cabs (talkVoice).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TALK={mode:'text',lib:null,M:null,near:null,with:null,bub:new Map(),far:new Map(),bump:new Map(),v:new THREE.Vector3(),t:0,ui:null,
  here:[],at:new Map(),ride:null,v0:0,group:[],grp:false,log:[],news:null,planT:-1e9,planning:false,errT:0};
const TALK_NEAR=4,TALK_HI=2.2,TALK_FAR=5,TALK_URL='https://human-forge-beta.vercel.app/api/persona',TALK_ME='a man in a hard hat and a hi-vis vest';
// the menu's choice; an 'off' only counts if talk was ever on on this device (bhd_talk_on), since older versions wrote
// 'off' for everyone at load, when Off was the default
try{const m=localStorage.getItem('bhd_talk');TALK.mode=m&&(m!=='off'||localStorage.getItem('bhd_talk_on'))?m:'text'}catch(e){}
// the library's people, by id, for their personalities (once)
function talkLib(){if(TALK.lib!==null)return;TALK.lib=0;fetch('models/people/library.json').then(r=>r.json()).then(j=>{TALK.lib={};for(const p of j.people||[])TALK.lib[p.id]=p}).catch(()=>{TALK.lib=null})}
function talkCard(p){if(!TALK.lib||!p||p.dead||p.hurt||p.drv||p.cop)return null;const it=TALK.lib['island_'+p.body];return it&&window.HumanForgeMind?HumanForgeMind.card(p.tw?talkTwin(it,p):typeof lifeItem==='function'?lifeItem(it,p.body):it):null}
// more people than looks: someone else wearing a look already in town (townfolk.js tfTwin, p.tw) is their own person:
// the look's age and sex, a name, nature and interests of their own (seeded by look and number, so they stay who they are)
const TALK_TW={m:['Dale','Curtis','Roy','Leon','Marcus','Glenn','Otis','Vernon','Clay','Dwight','Russell','Floyd','Andre','Luther','Boyd','Garrett','Silas','Emmett','Reggie','Wade','Harlan','Jesse','Clint','Darnell','Lyle','Monroe','Abel','Rufus'],
  f:['Loretta','Tammy','Bonnie','Nadine','Gloria','Shelby','Opal','Renee','Carla','Faye','Darlene','Ivy','Josie','Mabel','Tessa','Wanda','Noreen','Celia','Hattie','June','Marla','Peggy','Rhonda','Sadie','Thea','Viola','Yvette','Della']};
function talkTwin(it,p){const k=p.body+'~'+p.tw,C=TALK.tw||(TALK.tw={});if(C[k])return C[k];let s=7;for(const ch of k)s=(s*31+ch.charCodeAt(0))>>>0;const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
  const taken=new Set(Object.values(TALK.lib||{}).map(q=>q.mind&&q.mind.name)),N=TALK_TW[+it.gender?'m':'f'].filter(n=>!taken.has(n)),H=window.HumanForgeMind||{};
  const some=(A,n)=>{const o=[];A=(A||[]).slice();while(A.length&&o.length<n)o.push(A.splice((r()*A.length)|0,1)[0]);return o},m0=it.mind||{};
  const m={name:N[(r()*N.length)|0],traits:some((H.TRAITS||[]).slice(0,22),3),mood:['calm','happy','curious','thoughtful','playful','tired'][(r()*6)|0],smarts:2+((r()*3)|0),likes:some(H.LIKES||m0.likes,3)};
  if(m0.school)m.school=m0.school;if(m0.on!=null)m.on=m0.on;return C[k]=Object.assign({},it,{mind:m})}
function talkName(p){if(p==='player')return say('tkPlayer');const c=talkCard(p);if(c)return c.name;const k=talkKid(p);return k?k.name:'someone'}
// the young ones (under 18): their name and light mind from the library (school, what they like), for the talk box and
// greetings. Never Human Forge's runtime, which is for grown-ups only (here and on its server): what they say is the
// game's own kid and teen lines (WORDS 'Town: kids'), talkKidSay
function talkKid(p){if(!TALK.lib||!p||typeof p!=='object'||p.dead||p.hurt||p.drv||p.cop)return null;const i0=TALK.lib['island_'+p.body],it=i0&&p.tw?talkTwin(i0,p):i0;
  if(!it||!it.mind||!(+it.age<18))return null;const m=it.mind;
  return {name:m.name||'',age:Math.round(+it.age),sex:+it.gender?'man':'woman',teen:+it.age>=13,likes:m.likes||[],school:m.school||'school',traits:m.traits||[],mood:m.mood||'happy'}}
// a young one's answer to what he says: their name and age, school, hello, or something they like
function talkKidSay(p,v){const k=talkKid(p);if(!k)return '';const t=k.teen?'tn':'kd',like=k.likes[(Math.random()*k.likes.length)|0];v=String(v||'').toLowerCase();
  if(typeof fmIntro==='function')fmIntro(tfWho(p));
  if(/name|who are you|how old|age/.test(v))return say(t+'Name',{name:k.name,age:k.age});
  if(/school|grade|class|teacher|homework/.test(v))return say(t+'School',{school:k.school});
  if(/\b(hi|hello|hey|howdy|morning|afternoon|evening)\b/.test(v))return fmSay(t+'Hi',{name:k.name});
  if(/\?$/.test(v)&&Math.random()<0.4)return fmSay(t+'Shrug',{});
  const lk=k.teen&&WORDS_BY['tnLike_'+like]?'tnLike_'+like:'kdLike_'+like;return like&&WORDS_BY[lk]?say(lk):fmSay(t+'Shrug',{})}
// a machine's name with its article ('an excavator', 'a dozer')
function talkA(n){return (/^[aeiou]/i.test(n)?'an ':'a ')+n}
// busy with their own life: with someone, on their way somewhere, doing something
function talkBusy(p){if(p.dy||p.tg||p.pu||p.nd||p.ord||p.goal||p.off||p.room||p.sit)return true;for(const q of TALK.here)if(q!==p&&Math.hypot(q.x-p.x,q.z-p.z)<3)return true;return false}
// walking up to someone: they mostly carry on with their lives. Someone afraid of you or wary of you always shows it
// (lives.js repMeet); otherwise only someone at a loose end, now and then (TU.tkNotice), looks up and says hello
function talkNotice(p){if(repOpinion(tfWho(p))<-25){repMeet(p);return}if(talkBusy(p)||Math.random()>=TU.tkNotice)return;
  if(!repMeet(p)&&!fmGreet(p)){talkFace(p,2.5);TALK.M.event(p,{kind:'approached',by:'player'})}}
// where they are and when, in a few plain words (the built-in mind answers "where are we?" from its first part)
const TALK_DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function talkScene(p,to){const h=typeof townHour==='function'?townHour():12,when=h>=4&&h<12?'morning':h<17?'afternoon':h<21?'evening':'night';
  const hh=Math.floor(h),clock=`${hh%12||12}${h%1>=0.5?':30':''} ${hh<12?'AM':'PM'}`,day=typeof townDow==='function'?TALK_DOW[townDow()]+' ':'';
  const R=p.room,open=R&&typeof townRoomOpen==='function'?townRoomOpen(R):true;
  const where=R&&typeof townShopName==='function'?'inside '+townShopName(R)+(open?'':' (closed now)'):'out on the street in town';
  const r=typeof weather==='object'?weather.r:0,wx=r>0.5?'raining hard':r>0.12?'raining':typeof weather==='object'&&weather.c>0.6?'overcast':'fair';
  let t=`Corley's Island, a small town on an island off the Mississippi Gulf Coast, ${day}${when} (about ${clock}), ${wx}. ${talkName(p)} is ${where}`+
    (to==='you'||to==null?`; the one talking to them is ${TALK_ME}`:`, talking with ${talkName(to)}`)+'. ';
  // him: what he is doing, the day's work, the police
  const rk=mode==='walk'&&!wk.inside?null:wk.inside||rideOf(mode),R2=rk&&WK_RIDES[rk];
  // (his work is in the background: who he is, not what everyone talks about; the day's digging only while he is in a machine)
  t+=R2?`He does earthwork out on the island and is in ${talkA(R2.n)} nearby`:`He lives out on the island and is just spending time in town, on foot`;
  if(typeof gunHas==='function'&&gunHas())t+=', with a gun out';
  const w=typeof stats==='object'?stats:{},yd=(w.dDug||0)*1.308;
  if(R2&&(yd>1||w.dEarn>1))t+=`; today he has dug about ${Math.round(yd)} cubic yards and earned $${Math.round(w.dEarn||0)}`;
  t+='.';
  if(typeof gunStars==='function'&&gunStars())t+=' The police are after him.';else if(typeof gun==='object'&&gun.cops&&gun.cops.length)t+=' Police are about.';
  // their day, and what they have heard of him (lives.js)
  if(typeof lifeScene==='function'&&p&&typeof p==='object'){const n=talkName(p),l=lifeScene(p,n),r=repScene(p,n),f=fmScene(p,n);if(l)t+=' '+l;if(r)t+=' '+r;if(f)t+=' '+f;const u=typeof puScene==='function'?puScene(p,n):'',b=typeof bdScene==='function'?bdScene(p,n):'',y=typeof dyScene==='function'?dyScene(p,n):'';if(u)t+=' '+u;if(b)t+=' '+b;if(y)t+=' '+y}
  const ln=talkLately();if(ln)t+=' Lately: '+ln+'.';
  return t.slice(0,895)}
// what happened lately, for the scene: the last few things, newest last, with how long ago
function talkLately(){const now=performance.now()/1000;return TALK.log.filter(e=>now-e.t<600).slice(-4).map(e=>{const m=Math.round((now-e.t)/60);
  return e.s+(m<1?' just now':m===1?' a minute ago':` ${m} minutes ago`)}).join('; ')}
// what happens about town, as it happens (four times a second): shots (and everyone about hears them), someone shot,
// the police coming, rain starting or stopping, lightning
function talkNews(){const G=typeof gun==='object'?gun:{},dn2=(G.downs||0)+(G.copDowns||0),cops=G.cops?G.cops.length:0,wet=typeof weather==='object'&&weather.r>0.12,
    bolts=typeof stats==='object'?stats.bolts||0:0,now=performance.now()/1000;
  const n=TALK.news;TALK.news={shots:G.shots||0,downs:dn2,cops,wet,bolts};if(!n)return;
  const add=s=>{const l=TALK.log[TALK.log.length-1];if(l&&l.s===s&&now-l.t<60){l.t=now;return}TALK.log.push({t:now,s});if(TALK.log.length>8)TALK.log.shift()};
  const near=TALK.here.some(p=>Math.hypot(p.x-wk.x,p.z-wk.z)<40);
  if((G.shots||0)>n.shots){add('gunshots in town');if(near)repDeed('shots');
    for(const p of TALK.here){const d=Math.hypot(p.x-wk.x,p.z-wk.z);if(d<60)TALK.M.event(p,{kind:'notice',what:'gunshots',danger:true,threat:0.9,sound:true,feet:Math.round(d/FT),ref:{x:wk.x,z:wk.z}})}}
  if(dn2>n.downs){add('someone was shot');repDeed((G.copDowns||0)>(n.cdowns||0)?'cop':'shot')}
  TALK.news.cdowns=G.copDowns||0;
  if(cops&&!n.cops){add('police cars came into town');repDeed('cops')}
  if(wet!==n.wet)add(wet?'it started to rain':'the rain stopped');
  if(bolts>n.bolts)add('lightning struck close by')}
// what they can see that is not a person (the runtime looks these over once a second and remarks on what is new or
// coming closer): the machines (driven or parked) and the gulls on the marina's pilings. The town's own cars are left
// out: they come and go all day, and a remark on each would drown the talk.
function talkSights(p){const out=[],R2=TU.talkSightR;
  for(const k in WK_RIDES){const o=WK_RIDES[k].o;if(!o||!isFinite(o.x))continue;const d=Math.hypot(o.x-p.x,o.z-p.z);
    if(d<R2){const mv=k===TALK.ride&&TALK.v0>0.5;out.push({what:talkA(WK_RIDES[k].n),feet:d/FT,ref:'ride:'+k,moving:mv,threat:mv&&d<10?Math.min(0.8,TALK.v0/6):0})}}
  if(typeof MAR==='object'&&Math.abs(p.x-MAR.x)<R2&&p.z>MAR.z0-R2&&p.z<MAR.z0+MAR.len+R2)out.push({what:'the gulls on the pier',ref:'gulls'});
  out.sort((a,b)=>(a.feet??1e9)-(b.feet??1e9));return out.slice(0,4)}
// someone who can join in among themselves: on foot or seated, not driving, fleeing or cowering
function talkFree(p){return !p.inside&&!p.drv&&!p.cop&&!p.dead&&!p.hurt&&!(p.flee>0)&&!(p.cower>0)}
// who they would talk to: the nearest other grown-up within TU.talkChatR, not one of their own look (the same name)
// (friends first, never someone they can't stand: bonds.js)
function talkNearest(p){let best=null,bd=1e9;for(const q of TALK.here){if(q===p||q.body===p.body||!talkFree(q))continue;
  const d=Math.hypot(q.x-p.x,q.z-p.z),b=typeof bdOf==='function'?bdOf(p,q):0;if(d>TU.talkChatR||b<-0.35||Math.abs((q.y||0)-(p.y||0))>=1.5)continue;const s=d-b*2;if(s<bd){bd=s;best=q}}return best}
// the present, for the built-in mind's answers (Human Forge's o.now): what they are doing, the hour, and how hungry,
// thirsty, tired and so on they are, worked out from the hour and where they are in their day (the island keeps no
// needs of its own), a little different for each look (their body)
function talkNow(p){if(!p||typeof p!=='object')return null;const h=typeof townHour==='function'?townHour():12,R=p.room;
  const shop=R&&!R.home&&typeof townShopName==='function'?townShopName(R):'',staff=R&&p.spot&&p.spot.staff&&!R.home;
  const O=(typeof ordDoing==='function'?ordDoing(p):'')||(typeof dyDoing==='function'?dyDoing(p):'')||(p.tg&&tf.people.includes(p.tg.lead)?'out with '+talkName(p.tg.lead):'')||(typeof puDoing==='function'?puDoing(p):'')||(typeof ndDoing==='function'?ndDoing(p):''),G=p.goal&&TALK_ERR[p.goal.k],doing=O?O:G?(p.goal.k==='town_stroll'?'out for a stroll':'on my way to '+G.n):p.drv?'driving':staff?'working'+(shop?' at '+shop:''):R&&R.home?'at home':R?(shop?'in '+shop:'inside'):p.flee>0?'running':p.sit?'sitting down for a bit':'out for a walk';
  let s=7;for(const ch of String(p.body||''))s=(s*31+ch.charCodeAt(0))>>>0;const j=(s%100)/500-0.1,cl=v=>Math.max(0,Math.min(1,v+j));
  const meal=Math.max(...[7.5,12.5,18.5].map(a=>Math.max(0,1-Math.abs(h-a)/1.5))),hot=typeof weather==='object'&&weather.r<0.1&&h>11&&h<17;
  const where=O?'':R?(R.home?'at home':shop?'at '+shop:''):p.goal&&TALK_ERR[p.goal.k]&&p.goal.k!=='town_stroll'?'on the way to '+TALK_ERR[p.goal.k].n:'';
  return {doing,where,did:(typeof dyDid==='function'?dyDid(p):'')||(typeof puDid==='function'?puDid(p):''),hour:h,needs:typeof ndNeeds==='function'&&talkCard(p)?ndNeeds(p):{hunger:cl(0.25+0.6*meal),thirst:cl(hot?0.5:0.3),energy:cl(h>=22||h<5?0.85:h>=20?0.6:h<7?0.55:0.3),fun:cl(staff?0.55:0.35),company:cl(0.35),clean:cl(0.25)}}}
// asked in the talk box to do something and agreed (the mind's wishes): the errand that does it, when they are out
// walking and it is open at this hour; they set off for it (you can follow)
const TALK_WISH={drink:'town_beer',eat:'town_store',coffee:'town_store',shop:'town_shop',sit:'town_square',walk:'town_stroll'};
function talkCanGo(p,w){const k=TALK_WISH[w];return !!k&&talkWalker(p)&&!p.goal&&(talkErrOpts(p,null)[k]||0)>0.2}
function talkGoWish(p,w){if(!talkCanGo(p,w))return false;const k=TALK_WISH[w];p.wait=0;p.goal=null;talkErrand(p,k,null);
  if(!p.goal)return false;const now=performance.now()/1000;TALK.log.push({t:now,s:`${talkName(p)} went off to ${TALK_ERR[k].n} because you asked`});if(TALK.log.length>8)TALK.log.shift();return true}
function talkInit(){if(TALK.M||!window.HumanForgeMind)return;
  TALK.M=HumanForgeMind.create({url:TALK_URL,storage:'bhd_talk_on',budget:200,card:p=>p==='player'?null:talkCard(p),people:()=>TALK.here,label:p=>talkName(p),
    nearest:p=>talkFree(p)?talkNearest(p):null,sights:p=>p==='player'?[]:talkSights(p),scene:(p,to)=>talkScene(p,to),now:p=>p==='player'?null:talkNow(p),go:(p,w)=>talkGoWish(p,w),canGo:(p,w)=>talkCanGo(p,w),
    show:(p,a,to,ev)=>talkShow(p,a,to,ev),act:(p,a,ev)=>talkAct(p,a,ev),joint:(p,q)=>talkJoint(p,q),agreed:(by,p,k,yes)=>talkAgreed(by,p,k,yes),changed:()=>talkPaint()});
  TALK.M.chatter=true;
  try{localStorage.setItem('bhd_talk_on','1')}catch(e){}  // the runtime's own switch, on; also marks that talk was on here
}
// ☰ → Townsfolk talk (saved only when picked)
function talkSet(m,keep){TALK.mode=m;if(keep)try{localStorage.setItem('bhd_talk',m)}catch(e){}
  for(const b of document.querySelectorAll('#talkRow button'))b.setAttribute('aria-pressed',String(b.dataset.talk===m));
  for(const r of document.querySelectorAll('.talkOpt'))r.hidden=m==='off';
  for(const b of TALK.bub.values())b.el.hidden=m==='say';
  if(m==='off'){talkClose();for(const b of TALK.bub.values())b.el.remove();TALK.bub.clear();if(TALK.M){TALK.M.chatter=false;TALK.M.hush()}}
  else{talkLib();talkInit();if(TALK.M){TALK.M.chatter=true;if(TALK.M.model!=='local')TALK.M.check()}talkPaint()}}
for(const b of document.querySelectorAll('#talkRow button'))b.onclick=()=>talkSet(b.dataset.talk,1);
talkSet(TALK.mode);

// ---- what shows: a chip near someone, the box to type in, the lines over heads
function talkUI(){if(TALK.ui)return TALK.ui;const d=document.createElement('div');d.id='talkBox';d.hidden=true;
  d.innerHTML='<button id="talkChip"></button><form id="talkForm" hidden><input id="talkIn" maxlength="300" autocomplete="off"><button></button><button type="button" id="talkMic" hidden aria-pressed="false"></button><button type="button" id="talkAll" hidden aria-pressed="false"></button><button type="button" id="talkX">×</button></form><div id="talkStatus"></div>';
  d.querySelector('#talkForm button').textContent=say('tkSay');d.querySelector('#talkAll').textContent=say('tkAll');
  talkMicInit(d);d.querySelector('#talkAll').onclick=()=>{TALK.grp=!TALK.grp;talkHint();d.querySelector('#talkIn').focus()};
  document.body.appendChild(d);
  const L=document.createElement('div');L.id='talkLines';document.body.appendChild(L);
  d.querySelector('#talkChip').onclick=()=>talkOpen();d.querySelector('#talkX').onclick=()=>talkClose();
  d.querySelector('#talkForm').onsubmit=e=>{e.preventDefault();const i=d.querySelector('#talkIn'),v=i.value.trim();i.value='';if(!v||!TALK.with||!TALK.M)return;
    const g=TALK.group,w=TALK.with;if(talkKid(w)){talkShow(w,{say:talkKidSay(w,v)},'you',null);repDeed('kind',[tfWho(w)]);return}
    if(typeof ordSaid==='function'&&ordSaid(v))return;
    if(g.length>1&&(TALK.grp||TALK_ALL.test(v))){for(const q of g)talkFace(q,8);TALK.M.tellAll(g,v);repDeed('kind',g.map(q=>tfWho(q)));for(const q of g)fmIntro(tfWho(q))}else{TALK.M.tell(w,v);repDeed('kind',[tfWho(w)]);fmIntro(tfWho(w))}};
  // typing goes to the box, not the game's keys
  for(const ev of ['keydown','keyup'])d.querySelector('#talkIn').addEventListener(ev,e=>{e.stopPropagation();if(ev==='keydown'&&e.key==='Escape')talkClose()});
  TALK.ui={d,L};return TALK.ui}
// speaking instead of typing (the browser's speech recognition, where it has one: Chrome, Edge, Safari): Speak
// listens once; what is heard fills the box as it comes and is said when they stop
const TALK_SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
function talkMicInit(d){const b=d.querySelector('#talkMic');if(!TALK_SR)return;b.hidden=false;b.textContent=say('tkMic');
  b.onclick=()=>{if(TALK.rec)talkMicStop();else talkMicStart()}}
function talkMicStart(){if(!TALK_SR||TALK.rec||!TALK.ui)return;const d=TALK.ui.d,i=d.querySelector('#talkIn'),b=d.querySelector('#talkMic');let r;
  try{r=new TALK_SR()}catch(e){return}r.lang='en-US';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;TALK.rec=r;let fin='';
  r.onresult=e=>{let t='';for(const x of e.results){t+=x[0].transcript;if(x.isFinal)fin=t}i.value=t};
  r.onend=()=>{TALK.rec=null;b.setAttribute('aria-pressed','false');b.textContent=say('tkMic');const v=(fin||i.value).trim();if(v&&TALK.with)d.querySelector('#talkForm').requestSubmit()};
  // no microphone, or the browser was told no: say so, put Speak away for this visit, and back to typing
  r.onerror=e=>{if(/audio-capture|not-allowed|service-not-allowed/.test(e.error)){toast(say(e.error==='audio-capture'?'tkNoMic':'tkMicNo'),'',5000);b.hidden=true;fin='';i.value='';i.focus()}};b.setAttribute('aria-pressed','true');b.textContent=say('tkListening');i.value='';try{r.start()}catch(e){TALK.rec=null}}
function talkMicStop(){if(TALK.rec)try{TALK.rec.stop()}catch(e){}}
// said to everyone: starting with everyone, everybody, all of you, y'all, folks...
const TALK_ALL=/^(hey|hi|hello|ok|okay|so|well)?[ ,]*(everyone|everybody|all of you|y'?all|you all|folks|guys|people)\b/i;
// Talk with nobody to talk to says why: talk is off, they are keeping away from him, or nobody is close enough
function talkOpen(){const p=TALK.near;if(TALK.mode==='off'){toast(say('tkOff'),'',4000);return}
  if(!p||!TALK.M){if(mode==='walk')toast(say(performance.now()/1000-(TALK.shunT||-99)<20?'tkShun':'tkNobody'),'',4000);return}TALK.with=p;p.tkGo=null;if(typeof dyInvite==='function'&&!talkKid(p))dyInvite(p);const u=talkUI();u.d.querySelector('#talkForm').hidden=false;
  const i=u.d.querySelector('#talkIn');talkHint();i.focus();talkFace(p,6);talkPaint()}
// the box's prompt and the Everyone button: to the one, or to everyone within TU.talkGroupR
function talkHint(){if(!TALK.ui||!TALK.with)return;const d=TALK.ui.d,b=d.querySelector('#talkAll'),many=TALK.group.length>1,all=many&&TALK.grp;
  b.hidden=!many;b.setAttribute('aria-pressed',String(all));
  d.querySelector('#talkIn').placeholder=all?say('tkSayAll'):say('tkSayTo',{name:talkName(TALK.with)})}
function talkClose(){talkMicStop();TALK.with=null;if(!TALK.ui)return;TALK.ui.d.querySelector('#talkForm').hidden=true;const i=TALK.ui.d.querySelector('#talkIn');i.blur();talkPaint()}
function talkPaint(){const M=TALK.M;if(!M)return;
  // ☰: who speaks, the cap (models only) and the meter
  for(const b of document.querySelectorAll('#talkModelRow [data-tm]'))b.setAttribute('aria-pressed',String(b.dataset.tm===M.model));
  for(const b of document.querySelectorAll('#talkCapRow [data-tc]'))b.setAttribute('aria-pressed',String(!!M.spend&&+b.dataset.tc===M.spend.cap));
  const cr=$('#talkCapRow');if(cr)cr.hidden=TALK.mode==='off'||M.model==='local';
  const mt=$('#talkMeter');if(mt)mt.textContent=HumanForgeMind.meterText(M)+(M.model!=='local'&&M.status&&!M.status.startsWith('Enter the owner')?' '+M.status:'');
  if(!TALK.ui)return;const s=TALK.ui.d.querySelector('#talkStatus'),p=TALK.with,sp=M.spend;
  s.textContent=p&&M.busy.has(p)?say('tkThinking',{name:talkName(p)}):M.model==='local'?'':M.status||(sp?`${HumanForgeMind.NAME[M.model]} · ${HumanForgeMind.money(sp.spent)} of ${HumanForgeMind.money(sp.cap)} today`:'')}
{const r=$('#talkModelRow'),l=r&&r.querySelector('[data-tm=local]');if(l&&!r.querySelector('[data-tm=mix]')){const b=document.createElement('button');b.dataset.tm='mix';b.textContent='Built-in + Haiku';b.title='The built-in mind answers what it understands, free; only what it cannot goes to Haiku';l.after(b)}}
for(const b of document.querySelectorAll('#talkModelRow [data-tm]'))b.onclick=()=>{if(TALK.M){TALK.M.model=b.dataset.tm;if(b.dataset.tm!=='local'&&TALK.M.key)TALK.M.meter();talkPaint()}};
for(const b of document.querySelectorAll('#talkCapRow [data-tc]'))b.onclick=()=>{if(TALK.M)TALK.M.setCap(+b.dataset.tc)};
$('#talkKeyBtn').onclick=()=>{if(!TALK.M)return;const v=prompt('The owner key for townsfolk talk (from Human Forge\'s Vercel settings, PERSONA_OWNER_KEY). It stays on this device.',TALK.M.key?'':'');if(v&&v.trim())TALK.M.key=v.trim()};
// stop and turn toward a spot a while (the player, unless given): walkers only, someone in a shop or a car stays put
// body language on a close-up townsperson (Ultra graphics, townfolk.js tfUhPose, after its clip has set the bones):
// the one talking moves their head with the words; the one told nods now and then and tilts their head a little. Turns
// about the body's own axes, on top of the clip; put back first if the clip left the bone alone
const _tbQ=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()],_tbX=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
function talkBend(p,h){const g=h.object,B=h._tb||(h._tb={neck:g.getObjectByName('neck_01'),head:g.getObjectByName('head'),done:[]});
  for(const d of B.done)if(d[0].quaternion.equals(d[1]))d[0].quaternion.copy(d[2]);B.done.length=0;
  if(!B.head||!B.neck)return;const t=performance.now()/1000,say=p.tkSay>t,hear=!say&&p.tkHear>t&&p.tkBy&&!p.tkBy.dead,S=p.tkB||(p.tkB={sw:0,lw:0,ph:Math.random()*9,nodAt:0,nod:null,tilt:(Math.random()<0.5?-1:1)*(0.04+Math.random()*0.05),t:t});
  const dt=Math.min(0.1,t-S.t);S.t=t;S.sw+=((say?1:0)-S.sw)*Math.min(1,dt*4);S.lw+=((hear?1:0)-S.lw)*Math.min(1,dt*3);if(S.sw<0.01&&S.lw<0.01){S.nod=null;return}
  let pt=S.sw*(0.05*Math.abs(Math.sin(t*5.3+S.ph))+0.03*Math.sin(t*2.3+S.ph)),yw=S.sw*0.07*Math.sin(t*0.7+S.ph),rl=S.sw*0.025*Math.sin(t*1.1+S.ph);
  if(S.lw>0.01){if(!S.nod&&t>S.nodAt)S.nod={t0:t,n:Math.random()<0.3?2:1,a:0.08+Math.random()*0.07};
    if(S.nod){const u=(t-S.nod.t0)/0.5;if(u>=S.nod.n){S.nod=null;S.nodAt=t+1.3+Math.random()*2.6}else pt+=S.lw*S.nod.a*(u>=1?0.6:1)*Math.sin(Math.PI*(u%1))}
    rl+=S.lw*S.tilt;pt+=S.lw*0.03}
  g.updateMatrixWorld(true);const oq=g.getWorldQuaternion(_tbQ[0]);
  const turn=(bo,ax,an)=>{if(!an)return;if(!B.done.some(d=>d[0]===bo))B.done.push([bo,null,bo.quaternion.clone()]);const rw=_tbQ[1].setFromAxisAngle(ax,an).premultiply(oq).multiply(_tbQ[2].copy(oq).invert());
    const wq=bo.getWorldQuaternion(_tbQ[2]),pq=bo.parent.getWorldQuaternion(_tbQ[3]).invert();bo.quaternion.copy(pq.multiply(rw.multiply(wq)));bo.updateMatrixWorld(true)};
  turn(B.neck,_tbX[0],pt*0.4);turn(B.neck,_tbX[1],yw*0.4);turn(B.head,_tbX[0],pt*0.6);turn(B.head,_tbX[1],yw*0.6);turn(B.head,_tbX[2],rl);
  for(const d of B.done)d[1]=d[0].quaternion.clone()}
function talkFace(p,s,x=wk.x,z=wk.z){if(!p||typeof p!=='object'||p.room||p.drv||p.cop||p.dead||p.flee>0)return;p.wait=Math.max(p.wait||0,s);p.look=Math.atan2(x-p.x,z-p.z)}
function talkShow(p,a,to,ev){if(to&&typeof to==='object'&&typeof bdChat==='function')bdChat(p,to,a);const u=talkUI();let b=TALK.bub.get(p);if(!b){b={el:document.createElement('div')};b.el.className='talkLine';b.el.style.left=b.el.style.top='0';u.L.appendChild(b.el);TALK.bub.set(p,b)}
  b.el.innerHTML='';b.w=undefined;b.el.hidden=TALK.mode==='say';const n=document.createElement('b');n.textContent=talkName(p);b.el.append(n,document.createTextNode(a.say));
  b.until=performance.now()/1000+3.5+a.say.split(/\s+/).length*0.38;const s=b.until-performance.now()/1000;
  // who they turn to: the one they talk to (and that one back), what happened to them, or you
  if(to&&typeof to==='object'&&talkCard(to)&&Math.random()<0.3)repGossip(p,to);
  // talking and listening (tfFgClip, talkBend): the one talking gestures (the talk clip), the one told stands and listens
  {const t=performance.now()/1000,L=to&&typeof to==='object'?to:ev&&ev.by&&typeof ev.by==='object'?ev.by:null;p.tkSay=t+Math.min(s-1,0.9+a.say.length*0.065);if(L&&L!==p){L.tkHear=t+s;L.tkBy=p}}
  if(p.tkGo&&to!=='you'){}
  else if(to&&typeof to==='object'){talkFace(p,s,to.x,to.z);talkFace(to,s,p.x,p.z);if(!p.spd)p.tk=1}
  else if(ev&&ev.kind==='thing'){const w=TALK.at.get(p);if(w)talkFace(p,Math.min(s,3),w[0],w[1])}
  else if(ev&&ev.by&&typeof ev.by==='object')talkFace(p,Math.min(s,4),ev.by.x,ev.by.z);
  else if(to==='you'||ev&&ev.by==='player')talkFace(p,s);
  if(TALK.mode==='voice'||TALK.mode==='say')talkVoice(p,a.say)}
// Aloud: heard only near the camera (where every game sound is heard from), as loud as the distance makes it, like a
// voice in the open (full at arm's length, a quarter at 33 ft, gone at TU.talkHearR), under the sound settings' master.
// Walls between (talkThru): someone in a room you are not in (or you in a closed cab, as the engine sound goes by) is
// heard through what the room is clad in (TALK_WALL) and through its doors as far as each stands open (the shop's,
// the house's and the Building Forge doors in RM_DOORS, a doorway always open: the room's ajar), best straight out of
// one. The browser's voice can't be filtered, so a line that mostly comes through the walls is the dull murmur of it
// (talkMurmur: their voice's pitch through vowel formants, low-passed by the wall); through an open door the words.
// A line still going when you get out of earshot stops.
function talkEar(p){return Math.hypot(p.x-camera.position.x,(p.y||0)+1.6-camera.position.y,p.z-camera.position.z)}
// how much of a voice gets through a wall (amplitude) and the highest it lets by (Hz): a pane of glass, a timber
// frame wall in siding, stucco on block, brick, a steel shed, a machine's cab
const TALK_WALL={glass:[0.2,1100],siding:[0.12,550],wood:[0.12,550],stucco:[0.09,450],brick:[0.05,320],stone:[0.04,300],steel:[0.1,650],cab:[0.22,800]};
// the closed cab you hear from (the cab view in the dump truck, excavator, skid steer or a heavy machine with a cab)
function talkCab(){if(camMode!=='cab'||mode==='walk')return false;if(['truck','dig','drive','skid'].includes(mode))return true;
  const R=mode==='heavy'&&WK_RIDES[wk.inside],h=R&&R.o;return !!(h&&h.K&&!h.K.rider)}
// one enclosure between them: r a room (or 'cab'), x, z where the other one is; {t: amplitude through, c: how much of it
// came by an open way (0 walls only, 1 a doorway), cut}
function talkEncl(r,x,z){if(r==='cab'){const W=TALK_WALL.cab;return {t:W[0],c:0,cut:W[1]}}
  const W=TALK_WALL[r.clad]||TALK_WALL.siding;let leak=(r.ajar||0)*0.5;
  for(const d of RM_DOORS){if(!(d.a>0.02))continue;const h=d.w/2,mx=d.x+Math.cos(d.f)*h,mz=d.z-Math.sin(d.f)*h,dx=mx-r.x,dz=mz-r.z;
    if(Math.abs(dx*r.cf-dz*r.sf)>r.hw+0.8||Math.abs(dx*r.sf+dz*r.cf)>r.hd+0.8||Math.abs(d.y-r.y)>1.2)continue;
    // straight out of the doorway best, round the side of it less
    const lx=x-mx,lz=z-mz,l=Math.hypot(lx,lz)||1,aim=0.3+0.7*Math.abs((lx*Math.sin(d.f)+lz*Math.cos(d.f))/l);leak=Math.max(leak,d.a*0.75*aim)}
  const t=Math.hypot(W[0],leak),c=leak*leak/(t*t);return {t,c,cut:W[1]+(4500-W[1])*c}}
// everything between the one speaking and the camera: {t, c, cut}; nothing between: t 1
function talkThru(p){const C=camera.position,ra=rmRoomAt(p.x,p.z,p.y||0),rb=rmRoomAt(C.x,C.z,C.y),out={t:1,c:1,cut:20000};
  const add=e=>{out.t*=e.t;out.c=Math.min(out.c,e.c);out.cut=Math.min(out.cut,e.cut)};
  if(ra!==rb){if(ra)add(talkEncl(ra,C.x,C.z));if(rb)add(talkEncl(rb,p.x,p.z))}
  if(talkCab())add(talkEncl('cab'));return out}
function talkVoice(p,text){if(!sndCfg.on||!p||typeof p!=='object')return;const d=talkEar(p),R=TU.talkHearR;if(d>R)return;
  const T=talkThru(p),v=1/(1+(d/6)*(d/6))*Math.min(1,(R-d)/(R*0.3))*T.t*(T.t<1?TU.talkWallK:1);if(v*sndCfg.master/100<0.006)return;
  const c=talkCard(p)||talkKid(p);
  if(T.c<0.55){talkMurmur(p,text,c,v,T.cut);return}
  if(v*sndCfg.master/100<0.02)return;TALK.M.speak(text,c,v*sndCfg.master/100);TALK.spk=p}
// a line heard through a wall: their voice (a man's, a woman's, a child's pitch) as syllables of vowel formants, as
// long as the line, low-passed at cut and placed where they are (late with distance, to one side)
function talkMurmur(p,text,c,v,cut){if(!snd||!snd.ready||!actx)return;const a=actx,t0=a.currentTime+0.05,y=(p.y||0)+1.6;
  const kid=c&&+c.age<14,man=!kid&&(c&&c.sex==='man'||c&&c.sex==='m'),f0=kid?260:man?118:205,dx=p.x-camera.position.x,dz=p.z-camera.position.z,d=Math.hypot(dx,dz)||1;
  const g=sndGain(0,snd.dry),lp=sndFilter('lowpass',cut,0.7,g),env=sndGain(0),f1=sndFilter('bandpass',600,5,env),f2=sndFilter('bandpass',1500,7,env),o=a.createOscillator(),lf=a.createOscillator(),lg=sndGain(5);
  if(a.createStereoPanner){sndR.setFromMatrixColumn(camera.matrixWorld,0);const pn=a.createStereoPanner();pn.pan.value=clamp((dx*sndR.x+dz*sndR.z)/d*0.7,-0.7,0.7);env.connect(pn);pn.connect(lp)}else env.connect(lp);
  o.type='sawtooth';o.frequency.value=f0;lf.frequency.value=5;lf.connect(lg);lg.connect(o.frequency);o.connect(f1);o.connect(f2);
  g.gain.value=v*2.2*(TU.talkMurmur??1);
  // a syllable every 0.12-0.24 s, a little rest between words, the pitch wandering and falling at the end
  const W=String(text).split(/\s+/).filter(Boolean);let t=t0+d/343;
  for(let i=0;i<W.length;i++){const n=Math.max(1,Math.round(W[i].replace(/[^a-z]/gi,'').length/3));
    for(let k=0;k<n;k++){const w=STL_VOW[(Math.random()*STL_VOW.length)|0],sc=kid?1.25:man?1:1.15,L=0.12+Math.random()*0.12;
      f1.frequency.setValueAtTime(w[0]*sc,t);f2.frequency.setValueAtTime(w[1]*sc,t);o.frequency.setTargetAtTime(f0*(0.9+Math.random()*0.22)*(i===W.length-1?0.92:1),t,0.05);
      env.gain.setTargetAtTime(0.5+Math.random()*0.5,t,0.02);env.gain.setTargetAtTime(0.08,t+L*0.75,0.02);t+=L}
    env.gain.setTargetAtTime(0,t,0.02);t+=/[,.!?]$/.test(W[i])?0.3:0.06}
  o.start(t0);lf.start(t0);o.stop(t+0.3);lf.stop(t+0.3);o.onended=()=>{for(const x of [g,lp,env,f1,f2,lg])x.disconnect()}}

// ---- what they decided to do about something they noticed (the runtime's act: flee, back, freeze, warn, watch,
// investigate, help or call): run from it, step back, stop and face it, or walk over to it along their walk
function talkWhere(r){if(r==='player'||r==='you')return [wk.x,wk.z];
  if(typeof r==='string'&&r.startsWith('ride:')){const R=WK_RIDES[r.slice(5)],o=R&&R.o;return o&&isFinite(o.x)?[o.x,o.z]:null}
  if(r==='gulls'&&typeof MAR==='object')return [MAR.x,MAR.z0+MAR.len/2];
  return r&&typeof r==='object'&&isFinite(r.x)?[r.x,r.z]:null}
function talkAct(p,a,ev){if(!p||typeof p!=='object'||!a||p.dead||p.hurt||p.drv||p.cop||p.inside)return;
  const at=talkWhere(a.at!=null?a.at:ev&&ev.by),d=a.do;if(!at||d==='ignore')return;const [x,z]=at;
  if(d==='flee')return talkRun(p,x,z,5+Math.random()*4,TU.gunFlee);
  if(d==='back')return talkRun(p,x,z,1.5+Math.random()*1.5,Math.max(p.vt||1.3,1.3)*1.5);
  const walker=p.w&&!p.off&&!p.path&&!p.room&&!p.sit;
  if((d==='investigate'||d==='help')&&walker&&Math.hypot(x-p.x,z-p.z)>3){
    p.wait=0;p.goal=null;p.dir=talkDir(p,x,z);p.tkGo={x,z,t:TU.talkGoT,stop:d==='help'?1.4:2.6,d:Math.hypot(x-p.x,z-p.z)};return}
  talkFace(p,d==='freeze'?3+Math.random()*2:d==='call'?6:d==='watch'?3+Math.random()*4:2.5,x,z)}
// which way along their walk heads toward x,z
function talkDir(p,x,z){const [,,ex,ez]=tfAt(p.w,p.s);return ex*(x-p.x)+ez*(z-p.z)>=0?1:-1}
// away from x,z for s seconds at speed v (the same running off as from gunfire, pistol.js gunRun and gunTick)
function talkRun(p,x,z,s,v){if(p.off&&!p.room){if(!roFlee(p,x,z,s,v*(0.85+Math.random()*0.3)))talkFace(p,s,x,z);return}
  if(p.room||p.sit||p.path||!p.w){talkFace(p,s,x,z);return}
  p.wait=0;p.tkGo=null;p.goal=null;if(!p.vt0)p.vt0=p.vt;p.vt=v*(0.85+Math.random()*0.3);p.flee=Math.max(p.flee||0,s);p.dir=-talkDir(p,x,z)}
// walking over: stop and look once close, if it got no nearer (the walk turned away) or after TU.talkGoT
function talkGoTick(dt){for(const p of tf.people){const g=p.tkGo;if(!g)continue;
  if(p.dead||p.hurt||p.flee>0||p.inside){p.tkGo=null;continue}
  const d=Math.hypot(g.x-p.x,g.z-p.z);g.t-=dt;
  if(d<g.stop||g.t<=0||d>g.d+0.5){p.tkGo=null;talkFace(p,4+Math.random()*4,g.x,g.z)}else{g.d=Math.min(g.d,d);p.wait=0}}}

// ---- errands: where a walker goes next, by habit or a model's pick, alone or with someone
// the errands (Human Forge's persona server words each key the same): where each ends, and what is said of it
const TALK_ERR={town_store:{n:'the General Store',at:()=>TF_DOOR},town_beer:{n:'the beer garden',at:()=>TF_GATE},
  town_square:{n:'Harbor Square',at:()=>[[SQ.gx0,SQ.gz0],[SQ.gx1,SQ.gz0],[SQ.gx0,SQ.gz1],[SQ.gx1,SQ.gz1]]},
  town_shop:{n:'the shop windows',at:()=>[[-MSX,TF_XN],[MSX,TF_XN],[-MSX,TF_XS],[MSX,TF_XS]]},town_stroll:{n:'a stroll',at:null},company:{n:'company',at:null}};
// someone free to set off on an errand: walking the town's walks, not stopped, talking, scared, hurt, a driver or a cop
function talkErrFree(p){return p.w&&!p.path&&!p.car&&!p.room&&!p.sit&&!p.drv&&!p.cop&&!p.dead&&!p.hurt&&!(p.inside>0)&&!(p.flee>0)&&!(p.cower>0)&&!p.tkGo&&!(p.wait>0)&&TALK.with!==p&&!p.ord&&!p.off&&!p.pu&&!p.nd&&!p.dy&&!p.tg}
// what they could do now, each with how much habit leans to it (the hour, the shops' hours, their nature)
function talkErrOpts(p,q){const h=typeof townHour==='function'?townHour():12,M=TALK.M,N=M&&talkCard(p)?M.nature(p):{},v=k=>N[k]==null?0.5:N[k],o={};
  o.town_stroll=0.6+v('energy')*0.6;o.town_shop=h>=8&&h<20?0.5+v('curious'):0.1;
  if(h>=7&&h<21)o.town_store=0.6;if(h>=11&&h<23.5&&(!TALK.lib||talkCard(p)))o.town_beer=(h>=16?0.9:0.25)+v('talk')*0.5;if(h>=6&&h<21)o.town_square=0.4+(1-v('energy'))*0.6+v('warm')*0.2;
  if(q)o.company=0.4+v('warm')*0.6+v('talk')*0.4;return o}
// a pick, weighted by habit
function talkErrHabit(o){let t=0;for(const k in o)t+=o[k];let r=Math.random()*t;for(const k in o)if((r-=o[k])<=0)return k;return 'town_stroll'}
// someone nearby they might go over to: a grown-up who talks, free, within 25 m, not one of their own look
function talkErrMate(p){let b=null,bd=25;for(const q of TALK.here){if(q===p||q.body===p.body||!talkErrFree(q))continue;const d=Math.hypot(q.x-p.x,q.z-p.z),v=typeof bdOf==='function'?bdOf(p,q):0;if(d<4||v<-0.2||d>25+v*40)continue;const s=d-v*40;if(s<bd){bd=s;b=q}}return b}
// set p off on errand k (with: who they go with, or go over to)
const talkWalker=p=>p&&typeof p==='object'&&p.w&&!p.off&&!p.path&&!p.car&&!p.room&&!p.drv&&!p.cop&&!p.dead&&!p.hurt;
function talkErrand(p,k,q){const E=TALK_ERR[k];if(!E||!talkWalker(p))return;let n;
  if(k==='company'){if(!q)return;n=tfNodeNear(q.x,q.z)}
  else if(k==='town_stroll'){const far=TF_NODES.filter(m=>Math.hypot(m.x-p.x,m.z-p.z)>40&&m.e.length);n=far[(Math.random()*far.length)|0]}
  else{const at=E.at(),pts=typeof at[0]==='number'?[at]:at;const ns=pts.map(a=>tfNodeNear(a[0],a[1])).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));n=ns[Math.random()<0.7?0:(Math.random()*ns.length)|0]}
  if(!n)return;const D=tfDistTo(n),far=Math.min(D.has(p.w.a)?D.get(p.w.a):1e9,D.has(p.w.b)?D.get(p.w.b):1e9)+p.w.len;
  p.goal={k,n,t:60+Math.min(far,600)/0.6,with:q||null,here:0};p.wait=0;tfGoalDir(p,n)}
// once there: a look in the windows, a while on the green, into the store or the garden (the door does that), beside them
function talkErrArrive(p){const g=p.goal,k=g.k;p.goal=null;p.errT=40+Math.random()*100;if(typeof ndErr==='function')ndErr(p,k);
  if(k==='town_shop'){p.wait=6+Math.random()*10;p.look=p.x<0?W_:E_}
  else if(k==='town_square'){p.wait=25+Math.random()*35;p.look=Math.atan2((SQ.gx0+SQ.gx1)/2-p.x,(SQ.gz0+SQ.gz1)/2-p.z)}}
// a model chooses for someone near you (one ask at a time, TU.talkPlanGap apart); else, and meanwhile, habit
async function talkErrPlan(p,o,q){const M=TALK.M,keys=Object.keys(o).sort((a,b)=>o[b]-o[a]),hab=talkErrHabit(o),opts=[hab,...keys.filter(k=>k!==hab)].slice(0,4);
  TALK.planning=true;TALK.planT=performance.now()/1000;let a=null;
  try{a=await M.plan(p,opts,undefined,q?talkName(q):undefined)}catch(e){}TALK.planning=false;
  if(!tf.people.includes(p)||!talkErrFree(p))return;const k=a&&a.pick||hab;
  if(k==='company'&&!(q&&tf.people.includes(q)))return talkErrand(p,'town_stroll');
  talkErrand(p,k,q);if(a&&a.say)talkShow(p,{say:a.say,mood:a.mood},null,null)}
// plans made together (a model speaking): what two chatting could go and do now; and when one says yes, both go
function talkJoint(p,q){if(!talkWalker(p)||!talkWalker(q)||p.goal||q.goal||p.ord||q.ord)return [];const o=talkErrOpts(p,null);delete o.company;
  return Object.keys(o).filter(k=>o[k]>0.2)}
function talkAgreed(by,p,k,yes){if(!yes||!TALK_ERR[k]||k==='company'||!talkWalker(by)||!talkWalker(p))return;
  for(const r of [by,p]){r.wait=0;r.goal=null}talkErrand(by,k,p);if(by.goal){p.goal=Object.assign({},by.goal,{with:by});p.wait=0;if(p.w&&!p.path)tfGoalDir(p,by.goal.n)}
  const now=performance.now()/1000;TALK.log.push({t:now,s:`${talkName(by)} and ${talkName(p)} went off to ${TALK_ERR[k].n} together`});if(TALK.log.length>8)TALK.log.shift()}
// each frame, a few times a second: errands under way (there yet? given up? going over to someone: beside them yet?)
// and new ones for whoever is free and due (not while the town is out of sight)
function talkErrands(dt){if(!tf.on)return;if((TALK.errT+=dt)<0.25)return;const t=TALK.errT;TALK.errT=0;
  const M=TALK.M,model=M&&TALK.mode!=='off'&&M.model!=='local'&&TALK.lib,now=performance.now()/1000;
  for(const p of tf.people){const g=p.goal;if(p.ord&&(!g||g.k==='order'))continue;
    if(g){if(p.dead||p.hurt||p.flee>0||p.cower>0||p.drv){p.goal=null;continue}
      if(p.inside>0){p.goal=null;p.errT=60+Math.random()*120;continue}
      g.t-=t;if(g.t<=0){p.goal=null;continue}
      if(g.k==='company'){const q=g.with;if(!q||!tf.people.includes(q)||q.dead){p.goal=null;continue}
        if(Math.hypot(q.x-p.x,q.z-p.z)<2.2){p.goal=null;p.errT=60+Math.random()*90;talkFace(p,10,q.x,q.z);talkFace(q,10,p.x,p.z);continue}
        if(g.here||Math.hypot(g.n.x-q.x,g.n.z-q.z)>8){g.n=tfNodeNear(q.x,q.z);g.here=0;if(p.w&&!p.path)tfGoalDir(p,g.n)}continue}
      if(g.here||!g.n.door&&Math.hypot(g.n.x-p.x,g.n.z-p.z)<1.4)talkErrArrive(p);continue}
    if(p.errT==null)p.errT=10+Math.random()*80;if((p.errT-=t)>0||!talkErrFree(p))continue;p.errT=50+Math.random()*90;
    const q=talkErrMate(p),o=talkErrOpts(p,q);
    if(model&&!TALK.planning&&now-TALK.planT>TU.talkPlanGap&&TALK.here.includes(p)&&talkCard(p))talkErrPlan(p,o,q);
    else{const k=talkErrHabit(o);talkErrand(p,k,k==='company'?q:null)}}}

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
      if(d>TALK_FAR)TALK.far.set(p,1);else if(d<TALK_HI&&TALK.far.get(p)){TALK.far.set(p,0);talkNotice(p)}
      // bumping into them on the way past
      if(d<0.6&&(wk.spd||0)>1){const t=TALK.bump.get(p)||0;if(now-t>3){TALK.bump.set(p,now);talkFace(p,3);M.event(p,{kind:'touched',by:'player',where:'shoulder'})}}}
    else if(o){
      // the machine he drives, close by: too fast and it nearly had them; slow or stopped, they remark on it
      let d=1e9;for(const lz of R.c||[0])d=Math.min(d,Math.hypot(p.x-o.x-Math.sin(o.yaw||0)*lz,p.z-o.z-Math.cos(o.yaw||0)*lz)-(R.r||1));
      if(d<TU.talkRoadR){TALK.at.set(p,[o.x,o.z]);if(v>TU.talkRoadV)repDeed('near',[tfWho(p)]);if(M.event(p,{kind:'thing',what:talkA(R.n),how:v>TU.talkRoadV?'road':'car'})&&!p.tkGo)talkFace(p,2.5,o.x,o.z)}}
    // someone lying still nearby
    for(const q of dead)if(Math.hypot(q.x-p.x,q.z-p.z)<TU.talkStillR){M.event(p,{kind:'still',by:q});break}}
  // the young ones near you on foot: you can talk to them too (the game's own lines), and walking up they may say hi
  if(foot)for(const p of tf.people){if(p.inside||p.flee>0||p.cower>0)continue;const d=Math.hypot(p.x-wk.x,p.z-wk.z);if(d>TALK_FAR+2||Math.abs((p.y||0)-wk.y)>1.6)continue;
    const k=talkKid(p);if(!k)continue;if(d<bd){bd=d;best=p}
    if(d>TALK_FAR)TALK.far.set(p,1);else if(d<TALK_HI&&TALK.far.get(p)){TALK.far.set(p,0);if(talkBusy(p)||Math.random()>=TU.tkNotice)continue;if(!repMeet(p)&&!fmGreet(p)){talkFace(p,4);talkShow(p,{say:fmSay(k.teen?'tnHi':'kdHi',{name:k.name})},'you',null)}}}
  for(const p of [...TALK.far.keys()])if(!tf.people.includes(p))TALK.far.delete(p);
  for(const p of [...TALK.at.keys()])if(!tf.people.includes(p))TALK.at.delete(p);
  TALK.near=best;
  // who hears it when he talks to everyone: those about within TU.talkGroupR, nearest first, up to six
  const g=foot?here.filter(p=>Math.hypot(p.x-wk.x,p.z-wk.z)<TU.talkGroupR).sort((a,b)=>Math.hypot(a.x-wk.x,a.z-wk.z)-Math.hypot(b.x-wk.x,b.z-wk.z)).slice(0,6):[];
  if(g.length!==TALK.group.length||g.some((q,i)=>q!==TALK.group[i])){TALK.group=g;if(g.length<2)TALK.grp=false;talkHint()}
  talkNews();talkGoTick(dt);
  if(TALK.with&&(!foot||!tf.people.includes(TALK.with)||Math.hypot(TALK.with.x-wk.x,TALK.with.z-wk.z)>8))talkClose()}

// where the canvas is on the page, read once a second (and on a resize), not every frame
function talkRect(){const n=performance.now();if(!TALK.rect||n-TALK.rectT>1000){TALK.rect=renderer.domElement.getBoundingClientRect();TALK.rectT=n}return TALK.rect}
addEventListener('resize',()=>{TALK.rectT=-1e9});
// ---- each frame (from main.js)
function talkTick(dt){
  talkErrands(dt);ordTick(dt);roTick(dt);puTick(dt);ndTick(dt);bdTick(dt);dyTick(dt);soTick(dt);repTick(dt);
  const on=TALK.mode!=='off'&&TALK.M&&TALK.lib&&tf.on;
  if(!on){if(TALK.ui)TALK.ui.d.hidden=true;if(TALK.with)talkClose();for(const b of TALK.bub.values())b.el.classList.remove('on');return}
  const u=talkUI(),now=performance.now()/1000,foot=mode==='walk'&&!wk.inside;
  if((TALK.t+=dt)>0.25){talkLook(TALK.t);TALK.t=0}
  if(TALK.with&&!(TALK.with.ord&&ORD_MOVE[TALK.with.ord.k]))talkFace(TALK.with,1);
  const chip=u.d.querySelector('#talkChip'),p=foot&&TALK.with;
  // near someone, the Use button offers the talk (ctx.js); while talking, the chip says to whom
  if(u.d.hidden!==!p)u.d.hidden=!p;if(p){const t=TALK.grp&&TALK.group.length>1?say('tkWithAll',{n:TALK.group.length}):say('tkWith',{name:talkName(p)});if(chip.textContent!==t)chip.textContent=t}
  // the lines over their heads. Nothing here makes the browser lay the page out again each frame (which, once per
  // line, was the stutter near a crowd of talkers, as at the brewery): the canvas's place is read once a second, a line's
  // width once when its words change (all read before anything is written), and the lines move by transform only
  const r=talkRect();
  for(const [q,b] of TALK.bub){if(!tf.people.includes(q)||now>b.until+1){b.el.remove();TALK.bub.delete(q);continue}if(b.w===undefined)b.w=b.el.offsetWidth}
  for(const [q,b] of TALK.bub){const up=now<b.until,v=TALK.v.set(q.x,q.y+1.95*(q.sc||1),q.z).project(camera);
    if(!up||v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1){if(b.on){b.on=false;b.el.classList.remove('on')}continue}
    if(!b.on){b.on=true;b.el.classList.add('on')}const half=b.w/2+6,x=Math.round(r.left+Math.max(half,Math.min(r.width-half,(v.x+1)/2*r.width))),y=Math.round(r.top+(1-v.y)/2*r.height);
    if(x!==b.x||y!==b.y){b.x=x;b.y=y;b.el.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-100%)`}}
  if(TALK.spk&&(!tf.people.includes(TALK.spk)||talkEar(TALK.spk)>TU.talkHearR+3)){TALK.spk=null;TALK.M.hush()}
  TALK.M.step(dt)}
