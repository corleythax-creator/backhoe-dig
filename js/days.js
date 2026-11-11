// Corley's Island: the townsfolk's own days. What each grown-up (by tfWho) remembers of their days (DY.d, the last
// DY_KEEP things: where they ate or drank and whether they liked it, what came of a pursuit, a good talk with a friend,
// a falling-out, who they met and who stood them up, going home tired), with their game day and hour; how they rate the
// places they go (DY.op, by place: their taste, seeded, and a bit of luck each visit), which needs.js's ndPlace leans on
// (back to a place they like, not to one they didn't); and plans between friends (DY.plans): two who get on (bonds.js)
// chatting by day may agree to meet (dyPlan: lunch at a place to eat, the evening at a pub or a grill, else the green),
// and at the time whoever is in town heads there (dyTick, roam.js), waits, and once both are there they stand and talk a
// while; a friend who never comes is remembered, and so is a plan kept. A friend with a plan coming up is likelier to be
// in town (dyScore, townfolk.js tfLook). Both off-screen: kept or not, by chance. All of it, with needs.js's needs, is
// saved (bhd_days, bhd_needs) and synced (sync.js TALK_MEM). Their answers draw on it (talk.js talkNow's did, doing) and a
// model hears it (dyScene in talkScene).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const DY_KEEP=8;
const DY={d:{},op:{},plans:[],n:{},t:0,dirty:false,saveT:0,inGossip:false};
try{const v=JSON.parse(localStorage.getItem('bhd_days')||'null');if(v){DY.d=v.d||{};DY.op=v.op||{};DY.n=v.n||{};DY.plans=(v.plans||[]).map(P=>{delete P.outT;return P.m?P:Object.assign(P,{m:[P.a,P.b]})})}}catch(e){}
function dySave(){if(!DY.dirty||window.syncHold)return;DY.dirty=false;try{localStorage.setItem('bhd_days',JSON.stringify({v:1,d:DY.d,op:DY.op,n:DY.n,plans:DY.plans}))}catch(e){}}
// a look's name (someone not in town now too): the card Human Forge's runtime would make for them
function dyName(id){const p=tf.people.find(q=>tfWho(q)===id);if(p)return talkName(p);const it=TALK.lib&&TALK.lib['island_'+id];
  if(!it||!window.HumanForgeMind)return 'a friend';const c=HumanForgeMind.card(typeof lifeItem==='function'?lifeItem(it,id):it);return c&&c.name||'a friend'}
const dyNow=()=>({day:fuelDayNo(),h:townHour()});
// a grown-up look (18 and over in the library): only they make plans, date, gossip
const dyAdult=id=>{const it=TALK.lib&&TALK.lib['island_'+id];return !!(it&&it.mind&&+it.age>=18)};
// something to remember: k (what kind), s (in their words), v (how it felt, -1..1)
function dyNote(p,k,s,v,o){const id=typeof p==='string'?p:tfWho(p),L=DY.d[id]||(DY.d[id]=[]),n=dyNow();L.push([n.day,+n.h.toFixed(1),k,s,v||0,o||null]);if(L.length>DY_KEEP)L.shift();DY.dirty=true}
// how they rate a place, -1..1: their own taste for it, then each visit
function dyRate(p,R){const id=tfWho(p),nm=townShopName(R),O=DY.op[id]||(DY.op[id]={});return O[nm]!=null?O[nm]:(puH(id+nm+'taste')-0.4)*1.2}
// a visit: rated, remembered (needs.js ndRoom)
function dyVisit(p,R,k){if(R.home||R.grp||R.si==null)return;const id=tfWho(p),nm=townShopName(R),O=DY.op[id]||(DY.op[id]={}),was=dyRate(p,R),v=Math.max(-1,Math.min(1,was*0.7+(Math.random()-0.45)*0.9));
  O[nm]=+v.toFixed(2);const h=townHour(),what=k==='meal'?(h<10.5?'had breakfast':h<15?'had lunch':'had supper'):k==='am'?'had a coffee':k==='treat'?'got a treat':k==='pm'?'had a drink':'looked round';
  dyNote(p,'place',`${what} at ${nm} (${v>0.45?'loved it':v>0.05?'it was good':v>-0.35?'it was alright':"didn't think much of it"})`,v)}
// what they have been up to, newest first, in their words (talk.js talkNow's did)
function dyDid(p){const L=DY.d[tfWho(p)];if(!L||!L.length)return '';const n=dyNow();
  const when=(d,h)=>{const a=n.day-d;return a<=0?(h<12?'this morning':h<17?'this afternoon':'this evening'):a===1?(h<17?'yesterday':'last night'):'the other day'};
  return L.slice(-3).reverse().map(e=>when(e[0],e[1])+' '+e[3]).join('; ')}
// for a model (talk.js talkScene)
function dyScene(p,n){const did=dyDid(p),id=tfWho(p),P=DY.plans.find(x=>x.st==='set'&&x.m.includes(id)),N=(DY.n[id]||[]).slice(-2);let t='';
  if(did)t+=`Lately ${n} ${did}.`;
  if(P)t+=`${t?' ':''}${n} has plans to meet ${dyNames(P.m.filter(x=>x!==id))} at ${P.n} around ${dyClock(P.h)}${P.you?', and invited the user along':''}.`;
  if(N.length)t+=`${t?' ':''}${n} has heard that ${N.map(e=>dyName(e[0])+' '+e[1]).join(', and that ')}.`;return t}
const dyClock=h=>{const hh=Math.floor(h);return `${hh%12||12}${h%1>=0.5?':30':''} ${hh<12||hh===24?'AM':'PM'}`};

// ---------- plans ----------
// names in a line: 'Cal', 'Cal and Amber', 'Cal, Amber and Walt' (first names)
const dyNames=ids=>{const f=ids.map(i=>dyName(i).split(' ')[0]);return f.length<2?f[0]||'':f.slice(0,-1).join(', ')+' and '+f[f.length-1]};
// how two looks get on, whether or not they are in town (bonds.js)
const dyBond=(a,b)=>bdOf({body:a,tw:0},{body:b,tw:0});
// where to meet at hour h: the front of a place open then for it (a pub or grill in the evening, somewhere to eat at
// lunch), the one they like best, else the green
function dyWhere(ids,h){if(h>=19&&Math.random()<0.25&&typeof PU!=='undefined'&&PU.spots&&PU.spots.shore.length){const S=PU.spots.shore[(Math.random()*PU.spots.shore.length)|0];return {x:S[0],z:S[1],n:'the beach',beach:1}}
  const kinds=h<15?['meal','am']:['pm','meal'];let b=null,bs=-1e9;
  for(const R of TF_ROOMS){if(R.home||R.grp||R.si==null)continue;tfShopW(R);if(!kinds.includes(R.vk)||!townRoomOpen(R,h))continue;const E=R.ent||tfEnt(R);if(!E||!E.w)continue;
    const s=ids.reduce((t,id)=>t+dyRate({body:id,tw:0},R),0)+Math.random()*0.3;if(s>bs){bs=s;b={x:E.wx+E.ux*1.8,z:E.wz+E.uz*1.8,n:townShopName(R)}}}
  if(b)return b;const S=SQ;return {x:(S.gx0+S.gx1)/2,z:(S.gz0+S.gz1)/2,n:'Harbor Square'}}
const dyBusy=id=>DY.plans.some(x=>x.st==='set'&&x.m.includes(id));
// two friends talking by day may make a plan (bonds.js bdChat), and bring in friends of theirs (TU.dyGroup more at most)
function dyPlan(p,q){const a=tfWho(p),b=tfWho(q),two=typeof cpOf==='function'&&cpOf(a)===b;if(p.tw||q.tw||!dyAdult(a)||!dyAdult(b)||Math.random()>TU.dyPlan*(two?3:1))return;const h=townHour();if(dyBusy(a)||dyBusy(b))return;
  const at=h<10.5?12.5:h>=8&&h<17?18.5+Math.floor(Math.random()*5)/2:null;if(at==null)return;const m=[a,b];
  const looks=(tf.chars||[]).filter(c=>dyAdult(c.id)&&!m.includes(c.id)&&!dyBusy(c.id)).map(c=>c.id).sort(()=>Math.random()-0.5);
  // a couple's evening is theirs alone
  if(!two)for(const id of looks){if(m.length>=2+TU.dyGroup)break;const bs=m.map(x=>dyBond(x,id));if(Math.max(...bs)>0.4&&Math.min(...bs)>-0.2&&Math.random()<0.6)m.push(id)}
  const w=dyWhere(m,at);DY.plans.push({m,day:fuelDayNo(),h:at,x:+w.x.toFixed(1),z:+w.z.toFixed(1),n:w.n,st:'set',beach:w.beach||0});DY.dirty=true;
  bdSay(p,m.length>2?'dy_planGroup':'dy_plan',{place:w.n,time:dyClock(at),who:dyNames(m.slice(2))});setTimeout(()=>{if(tf.people.includes(q))bdSay(q,'dy_planYes',{name:talkName(p).split(' ')[0]})},1600)}
// tfLook's lean (townfolk.js): lower draws them. Someone with a plan coming up, or under way, is likely to be in town
function dyScore(id){const n=dyNow();for(const P of DY.plans)if(P.st!=='missed'&&P.m.includes(id)&&P.day===n.day&&n.h>P.h-1&&n.h<P.h+1.5)return -2.5;return 0}
// a member's place in the ring round the spot
function dySpot(P,id){const i=P.m.indexOf(id),n=P.m.length,a=i/n*Math.PI*2,r=0.7+0.18*n;return [P.x+Math.sin(a)*r,P.z+Math.cos(a)*r]}
// going: off the walks to their place in the ring; once there they wait facing the middle
function dyGo(p,P){const [x,z]=dySpot(P,tfWho(p));if(p.pu)puEnd(p);p.nd=null;p.tg=null;
  if(roGo(p,x,z,{near:0.4,tag:'dy',max:500,then:q=>{q.dy.here=1;q.look=Math.atan2(P.x-q.x,P.z-q.z);q.wait=2},fail:q=>{q.dy=null;roJoin(q)}}))p.dy={P,here:0}}
// what they are doing about it (talk.js talkNow)
function dyDoing(p){const o=p.dy;if(!o)return '';const w=dyNames(o.P.m.filter(x=>x!==tfWho(p)));
  return o.met?`out with ${w} at ${o.P.n}`:o.here?`waiting for ${w} at ${o.P.n}`:`on my way to meet ${w} at ${o.P.n}`}
// you talk to someone with a plan today who likes you (talk.js talkOpen): they may ask you along
function dyInvite(p){const id=tfWho(p),P=DY.plans.find(x=>x.st==='set'&&x.m.includes(id)&&!x.asked),n=dyNow();if(!P||P.day!==n.day||n.h>P.h)return;
  P.asked=1;DY.dirty=true;if(repOpinion(id)<5&&!(typeof fmKnown==='function'&&fmKnown(p))||Math.random()>TU.dyInvite)return;P.you=1;
  setTimeout(()=>{if(tf.people.includes(p))talkShow(p,{say:say('dy_invite',{place:P.n,time:dyClock(P.h),who:dyNames(P.m.filter(x=>x!==id))})},'you',null)},1800)}
// once a second: plans coming due, people heading off, meeting, late ones joining, those who never came
function dyTick(dt){DY.clk=(DY.clk||0)+dt;if(!TALK.lib)return;if((DY.t+=dt)<1)return;DY.t=0;const n=dyNow();
  for(const P of DY.plans){if(P.st==='missed'||P.st==='done')continue;const late=n.day>P.day||n.h>P.h+1.5,due=n.day===P.day&&n.h>=P.h-0.5;
    const ps=tf.on?P.m.map(id=>tf.people.find(q=>tfWho(q)===id&&!q.dead&&!q.hurt&&!q.drv&&!q.cop)||null):P.m.map(()=>null);
    if(due&&!late)for(const p of ps)if(p&&!p.dy&&!p.ord&&!p.room&&!p.go&&!p.goTo&&!(p.flee>0)&&!p.path&&!(P.st==='kept'&&p.dyDone===P))dyGo(p,P);
    const here=ps.filter(p=>p&&p.dy&&p.dy.P===P&&p.dy.here);
    // met: the first two there, then each who comes after
    // (one clock for them all outside, the game's own (DY.clk), so they go in together; the beach: a long while there)
    if(here.length>=2&&!P.outT)P.outT=DY.clk+(P.beach?120+Math.random()*120:20+Math.random()*8);
    if(here.length>=2)for(const p of here){if(p.dy.met)continue;p.dy.met=1;p.look=Math.atan2(P.x-p.x,P.z-p.z);p.wait=Math.max(3,P.outT-DY.clk);
      const with_=here.filter(q=>q!==p);for(const q of with_)bdAdd(p,q,0.03);dyNote(p,'met',`met ${dyNames(with_.map(q=>tfWho(q)))} at ${P.n}`,0.6);
      if(P.st==='set'){P.st='kept';DY.dirty=true;bdSay(p,'dy_meet',{name:talkName(with_[0]).split(' ')[0]})}
      // you came along
      if(P.you&&!P.youHi&&mode==='walk'&&Math.hypot(wk.x-P.x,wk.z-P.z)<15){P.youHi=1;talkFace(p,3);talkShow(p,{say:say('dy_youCame')},'you',null);repDeed('kind',P.m);for(const q of here)dyNote(q,'you','the newcomer from the island came along',0.5)}}
    if(late){if(P.st==='set'){const one=here[0];
        if(one){P.st='missed';const others=P.m.filter(x=>x!==tfWho(one));dyNote(one,'stood',P.m.length>2?`waited at ${P.n}, but nobody else turned up`:`waited for ${dyName(others[0])} at ${P.n}, but they never came`,-0.5,P.m.length===2?others[0]:null);
          if(P.m.length===2){const L=BD.l[bdKey(P.m[0],P.m[1])]||(BD.l[bdKey(P.m[0],P.m[1])]=[0,0]);L[0]=Math.max(-1,L[0]-0.08);BD.dirty=true}
          bdSay(one,'dy_stood',{name:dyNames(others)});one.dy=null;roBack(one)}
        else{// all elsewhere: they met (or didn't) where nobody saw
          P.st=Math.random()<0.7?'kept':'missed';if(P.st==='kept')for(const id of P.m)dyNote(id,'met',`met ${dyNames(P.m.filter(x=>x!==id))} at ${P.n}`,0.6)}}
      if(P.st==='kept')P.st='done';for(const p of ps)if(p&&p.dy&&p.dy.P===P&&!p.dy.met){p.dy=null;roBack(p)}DY.dirty=true}}
  // done together: back to their evening
  // together outside a while: then in at the door to sit at a table together, if there is one
  for(const P of DY.plans){if(P.in||P.beach||P.st==='missed'||P.st==='set')continue;const G=tf.people.filter(p=>p.dy&&p.dy.P===P&&p.dy.met);
    if(G.length>=2&&DY.clk>=(P.outT||1e12)&&dyInside(P,G))P.in=1}
  for(const p of tf.people)if(p.dy&&(p.dy.met&&!(p.wait>0)&&(p.dy.P.in||p.dy.P.beach||DY.clk>(p.dy.P.outT||0)+1.5)||p.dead||p.hurt||p.ord||p.flee>0)){const was=p.dy;p.dy=null;p.dyDone=was.P;if(p.off&&!p.ord)roBack(p);if(was.met&&!p.ord)p.ndNext=0}
  DY.plans=DY.plans.filter(P=>P.st==='set'||P.st==='kept'||n.day-P.day<2);
  if((DY.saveT+=1)>=10){DY.saveT=0;dySave();if(typeof ndSave==='function')ndSave()}}

// in together to the place they met at: seats at one table (or as near each other as there are), round the furniture;
// a place not drawn now (far from you) they go into out of sight
function dyInside(P,G){const R=TF_ROOMS.find(r=>r.si!=null&&!r.home&&townShopName(r)===P.n),E=R&&tfEnt(R);if(!R||!E||!townRoomOpen(R))return false;
  if(!R.live){for(const p of G){p.dy=null;p.dyDone=P;roJoin(p);p.inside=90+Math.random()*90;ndRoom(p,R)}return true}
  const free=R.spots.filter(sp=>sp.sit&&!sp.who&&!sp.staff&&!sp.path);if(free.length<G.length)return false;
  const by=new Map();for(const sp of free){const k=sp.tf!=null?'t'+sp.tf+'/'+Math.round(sp.x)+Math.round(sp.z/4):'x';if(!by.has(k))by.set(k,[]);by.get(k).push(sp)}
  let seats=[...by.entries()].filter(([k,L])=>k!=='x'&&L.length>=G.length).map(e=>e[1])[0];
  if(!seats){const s0=free[0];seats=free.slice().sort((a,b)=>Math.hypot(a.x-s0.x,a.z-s0.z)-Math.hypot(b.x-s0.x,b.z-s0.z))}
  G.forEach((p,i)=>{p.dy=null;p.dyDone=P;p.off=null;p.stay=1;tfHold(p,R,E,seats[i]);tfGoIn(p)});
  if(G.some(p=>TALK.here.includes(p)))ordLog(`${dyNames(G.map(tfWho))} went into ${P.n} together`);return true}

// ---------- gossip ----------
// what is worth passing on: who stood whom up, who fell out, who met, a catch or a painting show
const DY_NEWS=['stood','spat','met','pu','you','love','split'];
// two talking (bonds.js bdChat): now and then one passes on news, their own or what they heard, about anyone but the
// other; the other knows it now (DY.n, the last 10 each) and can pass it on. Said aloud near you (WORDS 'Town: gossip')
function dyGossip(p,q){if(DY.inGossip||Math.random()>TU.dyGossip)return;const a=tfWho(p),b=tfWho(q),n=dyNow(),heard=DY.n[b]||(DY.n[b]=[]);
  const knows=(about,txt)=>about===b||heard.some(e=>e[0]===about&&e[1]===txt);
  const own=(DY.d[a]||[]).filter(e=>DY_NEWS.includes(e[2])&&n.day-e[0]<=2&&!knows(a,e[3])&&e[5]!==b).map(e=>[a,e[3],e[2],e[5]]);
  const told=(DY.n[a]||[]).filter(e=>n.day-e[2]<=3&&!knows(e[0],e[1])&&e[4]!==b).map(e=>[e[0],e[1],e[3],e[4]]);
  const L=[...own,...told];if(!L.length)return;const [about,txt,k,o]=L[(Math.random()*L.length)|0];
  heard.push([about,txt,n.day,k||'',o||null]);if(heard.length>10)heard.shift();DY.dirty=true;
  // what it does to how they see those in it: someone who stood up or fell out with a friend of theirs drops in their
  // eyes; if they like the other one better, they take that one's side
  if(o&&(k==='stood'||k==='spat'||k==='split')&&dyAdult(o)){const fa=dyBond(b,about),fo=dyBond(b,o);
    if(fo>fa+0.25)bdAddId(b,about,-0.03);else bdAddId(b,o,-(fa>0.3?0.07:0.04))}
  DY.inGossip=true;try{bdSay(p,about===a?'gs_own':'gs_tell',{name:dyName(about).split(' ')[0],what:txt})}finally{DY.inGossip=false}}
addEventListener('pagehide',()=>{dySave();if(typeof ndSave==='function')ndSave()});
