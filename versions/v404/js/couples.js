// Corley's Island: relationships that change. Grown-ups only (days.js dyAdult: 18 and over in the library). Two who are
// single (nobody else grown under their roof, lives.js LIFE_HOMES, and not seeing anyone) and have grown close (bonds.js:
// over TU.cpClose, and talked a fair bit) may start seeing each other (cpTick, now and then): a couple's plans are theirs
// alone and three times as likely (days.js dyPlan), they go places together (social.js, by the bond), it is in their
// diaries and goes round town as news (days.js gossip). A couple whose bond sours (spats, being stood up, what they hear)
// breaks up: exes cool on each other a good deal, and it is news too. And each has a best friend, the one they are
// closest to (over 0.7), which changes as friendships do. All kept in bhd_couples (synced, sync.js TALK_MEM); a model
// hears it (cpScene in talk.js talkScene). Nothing here touches anyone under 18.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const CP={rel:{},best:{},t:0,dirty:false,saveT:0};
try{const v=JSON.parse(localStorage.getItem('bhd_couples')||'null');if(v){CP.rel=v.rel||{};CP.best=v.best||{}}}catch(e){}
function cpSave(){if(!CP.dirty||window.syncHold)return;CP.dirty=false;try{localStorage.setItem('bhd_couples',JSON.stringify({v:1,rel:CP.rel,best:CP.best}))}catch(e){}}
// who id is seeing, or null
function cpOf(id){for(const k in CP.rel)if(CP.rel[k].s==='dating'){const [a,b]=k.split('|');if(a===id)return b;if(b===id)return a}return null}
// living with another grown-up (a partner under one roof: lives.js LIFE_HOMES)
function cpHome(id){return typeof LIFE_HOMES!=='undefined'&&LIFE_HOMES.some(g=>g.includes(id)&&g.some(o=>o!==id&&dyAdult(o)))}
const cpSingle=id=>dyAdult(id)&&!cpHome(id)&&!cpOf(id);
// what someone near you says about it, over their head (bonds.js bdSay)
function cpSay(id,w,v){const p=tf.people.find(q=>tfWho(q)===id);if(p)bdSay(p,w,v)}
// every few seconds (and the day's changes): new couples, breakups, best friends
function cpTick(dt){if(!TALK.lib||!tf.chars)return;if((CP.t+=dt)<5)return;CP.t=0;const day=fuelDayNo();
  const ids=[...new Set(tf.chars.map(c=>c.id))].filter(dyAdult);
  // breakups: a couple gone sour
  for(const k in CP.rel){const R=CP.rel[k];if(R.s!=='dating')continue;const [a,b]=k.split('|');if(dyBond(a,b)>=TU.cpSplit)continue;
    R.s='ex';R.day=day;CP.dirty=true;bdAddId(a,b,-0.35);dyNote(a,'split',`broke up with ${dyName(b)}`,-0.7,b);dyNote(b,'split',`broke up with ${dyName(a)}`,-0.7,a);cpSay(a,'cp_split',{name:dyName(b).split(' ')[0]})}
  // a new couple, now and then (at most one a game day)
  if(CP.lastNew!==day&&Math.random()<TU.cpStart){let best=null,bv=TU.cpClose;
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=ids[i],b=ids[j],k=bdKey(a,b);if(CP.rel[k]||!cpSingle(a)||!cpSingle(b))continue;const L=BD.l[k];if(!L||L[1]<6)continue;const v=dyBond(a,b);if(v>bv){bv=v;best=[a,b]}}
    if(best){const [a,b]=best;CP.rel[bdKey(a,b)]={s:'dating',day};CP.lastNew=day;CP.dirty=true;bdAddId(a,b,0.12);
      dyNote(a,'love',`started seeing ${dyName(b)}`,0.8,b);dyNote(b,'love',`started seeing ${dyName(a)}`,0.8,a);cpSay(a,'cp_start',{name:dyName(b).split(' ')[0]})}}
  // best friends: the one each is closest to, apart from a partner
  for(const a of ids){let b=null,bv=0.7;const mate=cpOf(a);for(const o of ids){if(o===a||o===mate)continue;const v=dyBond(a,o);if(v>bv){bv=v;b=o}}
    if(b&&CP.best[a]!==b){const had=CP.best[a];CP.best[a]=b;CP.dirty=true;if(had)dyNote(a,'bff',`has been getting close with ${dyName(b)}`,0.5,b)}}
  if((CP.saveT+=1)>=2){CP.saveT=0;cpSave()}}
// for a model (talk.js talkScene)
function cpScene(p,n){const id=tfWho(p),m=cpOf(id),bf=CP.best[id];let t='';
  if(m)t+=`${n} is seeing ${dyName(m)}.`;
  for(const k in CP.rel){const R=CP.rel[k];if(R.s!=='ex'||fuelDayNo()-R.day>7)continue;const [a,b]=k.split('|');if(a===id||b===id)t+=`${t?' ':''}${n} broke up with ${dyName(a===id?b:a)} not long ago.`}
  if(bf&&bf!==m)t+=`${t?' ':''}${n}'s best friend is ${dyName(bf)}.`;return t}
addEventListener('pagehide',cpSave);
