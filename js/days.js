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
const DY={d:{},op:{},plans:[],t:0,dirty:false,saveT:0};
try{const v=JSON.parse(localStorage.getItem('bhd_days')||'null');if(v){DY.d=v.d||{};DY.op=v.op||{};DY.plans=v.plans||[]}}catch(e){}
function dySave(){if(!DY.dirty||window.syncHold)return;DY.dirty=false;try{localStorage.setItem('bhd_days',JSON.stringify({v:1,d:DY.d,op:DY.op,plans:DY.plans}))}catch(e){}}
// a look's name (someone not in town now too): the card Human Forge's runtime would make for them
function dyName(id){const p=tf.people.find(q=>tfWho(q)===id);if(p)return talkName(p);const it=TALK.lib&&TALK.lib['island_'+id];
  if(!it||!window.HumanForgeMind)return 'a friend';const c=HumanForgeMind.card(typeof lifeItem==='function'?lifeItem(it,id):it);return c&&c.name||'a friend'}
const dyNow=()=>({day:fuelDayNo(),h:townHour()});
// something to remember: k (what kind), s (in their words), v (how it felt, -1..1)
function dyNote(p,k,s,v){const id=typeof p==='string'?p:tfWho(p),L=DY.d[id]||(DY.d[id]=[]),n=dyNow();L.push([n.day,+n.h.toFixed(1),k,s,v||0]);if(L.length>DY_KEEP)L.shift();DY.dirty=true}
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
function dyScene(p,n){const did=dyDid(p),id=tfWho(p),P=DY.plans.find(x=>x.st==='set'&&(x.a===id||x.b===id));let t='';
  if(did)t+=`Lately ${n} ${did}.`;if(P){const o=P.a===id?P.b:P.a;t+=`${t?' ':''}${n} has plans to meet ${dyName(o)} at ${P.n} around ${dyClock(P.h)}.`}return t}
const dyClock=h=>{const hh=Math.floor(h);return `${hh%12||12}${h%1>=0.5?':30':''} ${hh<12||hh===24?'AM':'PM'}`};

// ---------- plans ----------
// where to meet at hour h: the front of a place open then for it (a pub or grill in the evening, somewhere to eat at
// lunch), the one they like best, else the green
function dyWhere(p,q,h){const kinds=h<15?['meal','am']:['pm','meal'];let b=null,bs=-1e9;
  for(const R of TF_ROOMS){if(R.home||R.grp||R.si==null)continue;tfShopW(R);if(!kinds.includes(R.vk)||!townRoomOpen(R,h))continue;const E=R.ent||tfEnt(R);if(!E||!E.w)continue;
    const s=dyRate(p,R)+dyRate(q,R)+Math.random()*0.3;if(s>bs){bs=s;b={x:E.wx+E.ux*1.5,z:E.wz+E.uz*1.5,n:townShopName(R)}}}
  if(b)return b;const S=SQ;return {x:(S.gx0+S.gx1)/2,z:(S.gz0+S.gz1)/2,n:'Harbor Square'}}
// two friends talking by day may make a plan (bonds.js bdChat)
function dyPlan(p,q){if(p.tw||q.tw||Math.random()>TU.dyPlan)return;const a=tfWho(p),b=tfWho(q),h=townHour();
  if(DY.plans.some(x=>x.st==='set'&&[x.a,x.b].some(i=>i===a||i===b)))return;
  const at=h<10.5?12.5:h>=8&&h<17?18.5+Math.floor(Math.random()*5)/2:null;if(at==null)return;
  const w=dyWhere(p,q,at);DY.plans.push({a,b,day:fuelDayNo(),h:at,x:+w.x.toFixed(1),z:+w.z.toFixed(1),n:w.n,st:'set',in:[]});DY.dirty=true;
  bdSay(p,'dy_plan',{place:w.n,time:dyClock(at)});setTimeout(()=>{if(tf.people.includes(q))bdSay(q,'dy_planYes',{name:talkName(p).split(' ')[0]})},1600)}
// tfLook's lean (townfolk.js): lower draws them. Someone with a plan coming up, or under way, is likely to be in town
function dyScore(id){const n=dyNow();for(const P of DY.plans)if(P.st==='set'&&(P.a===id||P.b===id)&&P.day===n.day&&n.h>P.h-0.75&&n.h<P.h+0.75)return -2.5;return 0}
// going: off the walks to the spot, a step apart; once there they wait facing it
function dyGo(p,P){const k=P.a===tfWho(p)?1:-1;if(p.pu)puEnd(p);p.nd=null;
  if(roGo(p,P.x+k*0.7,P.z,{near:0.5,tag:'dy',max:500,then:q=>{q.dy.here=1;q.look=Math.atan2(P.x-q.x,P.z-q.z);q.wait=2},fail:q=>{q.dy=null;roJoin(q)}}))p.dy={P,here:0}}
// what they are doing about it (talk.js talkNow)
function dyDoing(p){const o=p.dy;if(!o)return '';const id=tfWho(p),other=dyName(o.P.a===id?o.P.b:o.P.a);
  return o.met?`out with ${other} at ${o.P.n}`:o.here?`waiting for ${other} at ${o.P.n}`:`on my way to meet ${other} at ${o.P.n}`}
// once a second: plans coming due, people heading off, meeting, a friend who never came
function dyTick(dt){if(!TALK.lib)return;if((DY.t+=dt)<1)return;DY.t=0;const n=dyNow();
  for(const P of DY.plans){if(P.st!=='set')continue;const late=n.day>P.day||n.h>P.h+0.9,due=n.day===P.day&&n.h>=P.h-0.3;
    const ps=tf.on?[P.a,P.b].map(id=>tf.people.find(q=>tfWho(q)===id&&!q.dead&&!q.hurt&&!q.drv&&!q.cop)||null):[null,null];
    if(due&&!late)for(const p of ps)if(p&&!p.dy&&!p.ord&&!p.room&&!p.go&&!p.goTo&&!(p.flee>0)&&!p.path)dyGo(p,P);
    const [pa,pb]=ps,ha=pa&&pa.dy&&pa.dy.P===P&&pa.dy.here,hb=pb&&pb.dy&&pb.dy.P===P&&pb.dy.here;
    if(ha&&hb&&!pa.dy.met){P.st='kept';DY.dirty=true;for(const [p,q] of [[pa,pb],[pb,pa]]){p.dy.met=1;p.look=Math.atan2(q.x-p.x,q.z-p.z);p.wait=50+Math.random()*40;bdAdd(p,q,0.04);dyNote(p,'met',`met ${talkName(q)} at ${P.n}`,0.6)}
      bdSay(pb,'dy_meet',{name:talkName(pa).split(' ')[0]})}
    else if(late){const one=ha?pa:hb?pb:null;
      if(one){P.st='missed';const other=one===pa?P.b:P.a;dyNote(one,'stood',`waited for ${dyName(other)} at ${P.n}, but they never came`,-0.5);
        const L=BD.l[bdKey(P.a,P.b)]||(BD.l[bdKey(P.a,P.b)]=[0,0]);L[0]=Math.max(-1,L[0]-0.08);BD.dirty=true;bdSay(one,'dy_stood',{name:dyName(other).split(' ')[0]});one.dy=null;roBack(one)}
      else{// both elsewhere: they met (or didn't) where nobody saw
        P.st=Math.random()<0.7?'kept':'missed';if(P.st==='kept'){dyNote(P.a,'met',`met ${dyName(P.b)} at ${P.n}`,0.6);dyNote(P.b,'met',`met ${dyName(P.a)} at ${P.n}`,0.6)}
        for(const p of ps)if(p&&p.dy&&p.dy.P===P){p.dy=null;roBack(p)}}
      DY.dirty=true}}
  // done together: back to their evening
  for(const p of tf.people)if(p.dy&&(p.dy.met&&!(p.wait>0)||p.dead||p.hurt||p.ord||p.flee>0)){const was=p.dy;p.dy=null;if(p.off&&!p.ord)roBack(p);if(was.met&&!p.ord)p.ndNext=0}
  DY.plans=DY.plans.filter(P=>P.st==='set'||n.day-P.day<2);
  if((DY.saveT+=1)>=10){DY.saveT=0;dySave();if(typeof ndSave==='function')ndSave()}}
addEventListener('pagehide',()=>{dySave();if(typeof ndSave==='function')ndSave()});
