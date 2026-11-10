// Corley's Island: what the townsfolk need, and what they do about it. Each grown-up (by tfWho) gets hungry, thirsty,
// tired, bored and lonely as the game clock runs (ndOf: per game hour, ND_RATE; tiredness faster late at night; a night
// away and they wake rested and hungry), starting where the hour puts them, a little different for each. What eases it:
// time in a place (ndRoom, by the room's kind from tfShopW: a meal, coffee, a treat, the pub, shopping, people about, home),
// talking with someone (ndChat, from bonds.js), an errand done (ndErr: the green, the shop windows), a pursuit
// (pursuits.js). When one presses (over TU.ndPress, each their own) someone free on the walks acts on it (ndTick, ndAct):
// hungry or thirsty to the nearest place open for it, walking in at its door (ndIn from tfEntCross; a place far from you
// is gone into without showing the room), tired to a bench on the green or, late, home to bed (roam.js, then off the
// street), lonely to a friend (bonds.js) or where people are (the beer garden in the evening, the green), bored to their
// pursuit or a look round. Habit errands (talk.js talkErrands) fill the rest of their time. What they need goes to their
// answers and a model (talk.js talkNow's needs), what they are off to do too (ndDoing).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// per game hour: f hungry, d thirsty, e tired, u bored, c lonely
const ND_RATE={f:0.15,d:0.17,e:0.05,u:0.13,c:0.09};
const ND={who:new Map(),t:0};
const ndCl=v=>Math.max(0,Math.min(1,v)),ndGH=()=>dn.t/3.6e6;
function ndOf(p){const id=tfWho(p),gh=ndGH(),h=townHour();let n=ND.who.get(id);
  if(!n){const j=k=>(puH(id+k)-0.5)*0.3,meal=Math.max(...[7.5,12.5,18.5].map(a=>Math.max(0,1-Math.abs(h-a)/1.5)));
    n={f:ndCl(0.25+0.5*meal+j('f')),d:ndCl(0.3+j('d')),e:ndCl((h>=22||h<5?0.75:h>=20?0.5:0.2)+j('e')),u:ndCl(0.3+j('u')),c:ndCl(0.3+j('c')),gh,j:puH(id+'press')*0.2};ND.who.set(id,n)}
  const dh=Math.max(0,Math.min(12,gh-n.gh));n.gh=gh;
  if(dh>=6&&h>=5&&h<11){n.e=0.1;n.f=0.65;n.d=0.5}
  else if(dh>0){const hot=typeof weather==='object'&&weather.r<0.1&&h>11&&h<17;
    n.f=ndCl(n.f+dh*ND_RATE.f);n.d=ndCl(n.d+dh*ND_RATE.d*(hot?1.5:1));n.e=ndCl(n.e+dh*ND_RATE.e*(h>=21||h<6?2.6:1));n.u=ndCl(n.u+dh*ND_RATE.u);n.c=ndCl(n.c+dh*ND_RATE.c)}
  return n}
// eased: by a place they are in (its kind), talking, an errand
function ndRoom(p,R){const n=ndOf(p),k=R.home?'home':R.grp?'grp':(tfShopW(R),R.vk);
  const E={meal:{f:-0.75,d:-0.4,u:-0.2},am:{d:-0.6,f:-0.25,e:-0.1},treat:{f:-0.3,u:-0.25},pm:{d:-0.6,f:-0.2,c:-0.35,u:-0.3},day:{u:-0.35},grp:{c:-0.4,u:-0.2},home:{e:-0.4,f:-0.3,d:-0.3}}[k]||{u:-0.2};
  for(const x in E)n[x]=ndCl(n[x]+E[x])}
function ndChat(p){const n=ndOf(p);n.c=ndCl(n.c-0.15);n.u=ndCl(n.u-0.08)}
function ndErr(p,k){const n=ndOf(p);if(k==='town_square'){n.u=ndCl(n.u-0.25);n.c=ndCl(n.c-0.1);n.e=ndCl(n.e-0.2)}else if(k==='town_shop'||k==='town_stroll')n.u=ndCl(n.u-0.3)}
// for Human Forge's runtime (talk.js talkNow): its needs' names
function ndNeeds(p){const n=ndOf(p);return {hunger:n.f,thirst:n.d,energy:n.e,fun:n.u,company:n.c,clean:0.25}}

// ---------- acting on it ----------
// the nearest place open now of these kinds, with a way in: its entrance on the walks (townfolk.js tfEnt)
function ndPlace(p,kinds){let b=null,bd=260;for(const R of TF_ROOMS){if(R.home||R.grp||R.si==null)continue;tfShopW(R);if(!kinds.includes(R.vk)||!townRoomOpen(R))continue;
    const E=R.ent||tfEnt(R);if(!E||!E.w)continue;const d=Math.hypot(E.wx-p.x,E.wz-p.z);if(d<bd){bd=d;b=E}}return b}
// off to a place's entrance along the walks
function ndGo(p,E,k){p.nd={k,R:E.R,t:240};p.wait=0;p.goal=null;
  if(p.w===E.w){p.dir=E.s>=p.s?1:-1;return}
  const Da=tfDistTo(E.w.a),Db=tfDistTo(E.w.b),from=D=>Math.min((D.get(p.w.a)??1e9)+p.s,(D.get(p.w.b)??1e9)+p.w.len-p.s),n=from(Da)+E.s<=from(Db)+E.w.len-E.s?E.w.a:E.w.b;
  p.goal={k:'need',n,w:E.w,t:240,here:0};tfGoalDir(p,n)}
// at its door (tfEntCross): in they go; a room not drawn now (far from you) or full is gone into out of sight
function ndIn(p,E){const R=E.R;p.nd=null;if(!townRoomOpen(R))return false;
  if(R.live&&(tf.trans||0)<(TU.tfShopTransit??8)){const sp=tfFreeSpot(R,E);if(sp){tfHold(p,R,E,sp);tfGoIn(p);return true}}
  ndRoom(p,R);p.inside=25+Math.random()*50;p.goal=null;return true}
// the most pressing need over its mark, and what they do about it; true if they set off
function ndAct(p){const n=ndOf(p),h=townHour(),late=h>=21.5||h<5.5;
  const top=Object.entries({f:n.f,d:n.d,e:late?n.e+0.25:n.e,c:n.c,u:n.u}).sort((a,b)=>b[1]-a[1]);
  for(const [k,v] of top){if(v<TU.ndPress+n.j)return false;
    if(k==='f'){const E=ndPlace(p,h<10.5?['am','meal']:h>=16?['meal','pm']:['meal','am','treat']);if(E){ndGo(p,E,'eat');return true}
      if(h>=7&&h<21){talkErrand(p,'town_store',null);if(p.goal){p.nd={k:'eat',t:240};return true}}}
    else if(k==='d'){const E=ndPlace(p,h>=16?['pm','am']:['am','pm']);if(E){ndGo(p,E,'drink');return true}}
    else if(k==='e'){if(late||n.e>0.85){const L=lifeOf(p.body),R=L&&L.home;
        if(R&&roGo(p,R.x,R.z,{near:1.2,tag:'nd',max:600,then:q=>{q.nd=null;tfDrop(q)},fail:q=>{q.nd=null;roJoin(q)}})){p.nd={k:'bed',t:700};return true}}
      else{talkErrand(p,'town_square',null);if(p.goal){p.nd={k:'rest',t:240};return true}}}
    else if(k==='c'){const q=typeof bdFriend==='function'?bdFriend(p,90):null;if(q){talkErrand(p,'company',q);if(p.goal){p.nd={k:'friend',q,t:240};return true}}
      talkErrand(p,h>=16&&h<23.5?'town_beer':'town_square',null);if(p.goal){p.nd={k:'people',t:240};return true}}
    else if(k==='u'){const P=typeof puOf==='function'&&puOf(p);if(P&&puHour(PU_KINDS[P])&&puStart(p,P))return true;
      talkErrand(p,Math.random()<0.5?'town_shop':'town_stroll',null);if(p.goal){p.nd={k:'look',t:240};return true}}}
  return false}
// what they are off to do about it, in their words (talk.js talkNow)
function ndDoing(p){const o=p.nd;if(!o)return '';const R=o.R,at=R?' at '+townShopName(R):'';
  return {eat:'going to get something to eat'+at,drink:'going for a drink'+at,bed:'heading home to bed',rest:'going to sit on the green a while',
    friend:o.q?'going over to see '+talkName(o.q):'going to see a friend',people:'going where there are people about',look:'having a look round'}[o.k]||''}
// once a second: places they are in, needs that press, errands that ran out
function ndTick(dt){if(!tf.on||!TALK.lib)return;if((ND.t+=dt)<1)return;const t=ND.t;ND.t=0;const now=performance.now()/1000;let acts=0;
  for(const p of tf.people){if(talkKid(p)||!talkCard(p))continue;
    if(p.room&&p.ndR!==p.room){p.ndR=p.room;ndRoom(p,p.room)}else if(!p.room)p.ndR=null;
    if(p.nd){p.nd.t-=t;if(p.nd.t<=0||p.dead||p.hurt||p.ord||p.flee>0||p.nd.k!=='bed'&&!p.goal&&!p.off&&!p.nd.R)p.nd=null;continue}
    if(acts>=2||p.pu||p.ord||!talkErrFree(p)||now<(p.ndNext||0))continue;
    p.ndNext=now+8+Math.random()*12;if(ndAct(p))acts++}}
