// Corley's Island: telling the townsfolk what to do. What you say in the talk box (typed or spoken) is read for an
// order first, with plain patterns and no model call (Forge Studio's orders.js, ported): "come here", "follow me",
// "Heather, follow Cal", "wait here", "go home", "carry on", "go to the bakery", "look at the excavator", "run",
// "everyone, come here", "go to the store and then come back here" (one after another, ORD_SPLIT). The one you are talking
// to answers (the Everyone button or "everyone, ..." for all within TU.talkGroupR, a name for that one if they are within
// TU.ordHearR). Whether they will is theirs: Human Forge's runtime decides (M.willing: their nature, mood and how they
// get on with you) and says it in their own words (M.ordered, the built-in mind's line at once), and someone who thinks
// badly of you (lives.js repOpinion) won't. What can't be done says why (ordCan, WORDS 'Town: orders'): someone
// working behind a counter, sitting down or on their way into a shop.
// They do it along the town's walks (townfolk.js): to the spot on the sidewalk nearest you or the place (ordChase,
// ordWalkOf), round corners the shortest way (tfGoalPick, the goal's walk w in tfPick), into a shop told by name if it is
// open (tfEntCross), home down their own street and in (ordHomeWay, lives.js lifeOf), keeping up with you (ordFollowT,
// faster when you get ahead, waiting at the curb when you leave the walks, ordLostR). p.ord is what they are doing for
// you (talk.js talkNow says it), p.ordQ what comes next; errands, shop calls and the talk box's facing leave them be.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const ORD_ALL=/^(everyone|everybody|every one|all of you|you all|y ?all|you guys|guys|folks|people)\b ?/;
const ORD_FILL=/^(hey|hi|ok|okay|alright|all right|now|so|right|please|um|uh|oh|well|can you|could you|would you|will you|i want you to|i need you to|you should|go ahead and|just|kindly)\b ?/;
const ORD_SPLIT=/ (?:and then|then|and|after that|and after that) /;
// the runtime's word for each (its ORDERL groups) and what is said of it coming next
const ORD_HOW={come:'come',follow:'follow',stay:'stay',home:'home',carry:'home',goto:'goto',look:'look',lookat:'lookat',run:'run'};
const ORD_MOVE={come:1,follow:1,goto:1,home:1,run:1};
// places by what people call them: the errands' own (talk.js TALK_ERR), and the marina
const ORD_PLACES=[[/^((general|corner) )?store$|^grocer(y|ies)$/,'town_store'],[/^(beer garden|brewery|pub|bar|tap ?room)$/,'town_beer'],
  [/^((harbor|harbour|town) )?square$|^green$/,'town_square'],[/^(shops|shop windows|main street|main st|downtown)$/,'town_shop'],[/^(marina|pier|docks?|harbou?r|boats)$/,'marina']];
const ORD_RIDE={digger:'ex',backhoe:'ex',excavator:'ex',dumper:'truck',truck:'truck','dump truck':'truck',bobcat:'skid','skid steer':'skid',skidsteer:'skid',mower:'mow','lawn mower':'mow'};
const ORD_AT=new Map();
const ordNorm=t=>String(t||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();

// ---------- reading it ----------
// ctx: { people: [[name, p]...], find(words) -> a place, machine or null, last: what "him", "her", "it" mean }
// -> null (not an order) or { who: 'all' | [p...] | null (whoever you are talking to), do, at }
function ordParse(text,ctx){let t=ordNorm(text);if(!t)return null;
  const named=(ctx.people||[]).map(([n,ref])=>({n:ordNorm(n),first:ordNorm(n).split(' ')[0],ref})).filter(x=>x.first);let who=null;
  for(let k=0;k<8;k++){let m;
    if((m=t.match(ORD_FILL))){t=t.slice(m[0].length);continue}
    if((m=t.match(ORD_ALL))){who='all';t=t.slice(m[0].length);continue}
    if((m=t.match(/^and\b ?/))&&who){t=t.slice(m[0].length);continue}
    const p=named.filter(x=>t===x.n||t.startsWith(x.n+' ')).sort((a,b)=>b.n.length-a.n.length)[0]||named.find(x=>t===x.first||t.startsWith(x.first+' '));
    if(p){const full=t===p.n||t.startsWith(p.n+' '),same=named.filter(x=>full?x.n===p.n:x.first===p.first).map(x=>x.ref);
      if(who!=='all')who=[...new Set([...(who||[]),...same])];t=t.slice(full?p.n.length:p.first.length).trim();continue}
    break}
  t=t.replace(/ ?\b(please|now|right now|for me|thanks|thank you|ok|okay)$/,'').trim();
  const first=ordMatch(t,who,named,ctx);if(first)return first;
  // everyone or a name at the end: "come here heather", "stop everyone"
  const tail=t.match(/ (everyone|everybody|all of you|you all|you guys|guys|folks)$/);
  if(tail)return ordMatch(t.slice(0,-tail[0].length),'all',named,ctx);
  const p=named.filter(x=>t.endsWith(' '+x.n)||t.endsWith(' '+x.first)).sort((a,b)=>b.n.length-a.n.length)[0];if(!p)return null;
  const len=t.endsWith(' '+p.n)?p.n.length:p.first.length;
  return ordMatch(t.slice(0,-len-1).trim(),who==='all'?'all':[...new Set([...(who||[]),p.ref])],named,ctx)}
function ordMatch(t,who,named,ctx){const out=(d,at=null)=>({who,do:d,at}),ok=a=>a&&a!=='all'&&a!=='me';let m;
  const thing=w=>{if(/^(him|her|it|them|that one|this one|that|those)$/.test(w))return ctx.last||null;
    w=w.replace(/^(the|that|this|a|an|my|your|our|his|her|their)\b ?/,'').trim();
    if(/^(me|us|here)$/.test(w))return 'me';if(/^(everyone|everybody)$/.test(w))return 'all';
    const p=named.find(x=>w===x.n||w===x.first);return p?p.ref:w&&ctx.find?ctx.find(w):null};
  if(/^(come|get|walk|run) (over )?(here|over|to me|back( here)?|closer|this way)$|^over here$|^come$|^come on( over)?$/.test(t))return out('come','me');
  if(/^(follow me|come with me|walk with me|come along|keep up|this way|with me|stick with me|stay with me|tag along)$/.test(t))return out('follow','me');
  if(/^(stop|wait|stay|halt|freeze|stand still|hold on|hold it|hold up|don't move|dont move|stay (there|put|here)|wait (there|here|for me)|stop (there|moving|walking|following( me)?|right there))( right there)?$/.test(t))return out('stay');
  if(/^((go|head|walk|get) (on |back )?home|home|time to go home)$/.test(t))return out('home');
  if(/^(go back|back to (what you were doing|your (walk|day))|as you were|carry on|at ease|dismissed|you can go|off you go|never mind|nevermind|forget it)$/.test(t))return out('carry');
  if(/^(look (at|over) (me|here|us)|look this way|look here|face me|turn around)$/.test(t))return out('look','me');
  if(/^(run|run away|get away|scatter|flee|run for it|run for your lives|get out of here|go away|beat it|get lost|scram|shoo)$/.test(t))return out('run','me');
  if((m=t.match(/^(go|walk|head|move|get|run|come) (on )?(over |down |up |back )?(to|toward|towards|by|into|in to|inside) (.+)$/))){const at=thing(m[5]);return at==='me'?out('come','me'):ok(at)?out('goto',at):null}
  if((m=t.match(/^(follow|go with|stay with|stick with|keep up with|walk with|tag along with) (.+)$/))){const at=thing(m[2]);return ok(at)&&typeof at==='object'&&!at.pl?out('follow',at):null}
  if((m=t.match(/^(look at|check out|go look at|have a look at|take a look at) (.+)$/))){const at=thing(m[2]);return at==='me'?out('look','me'):ok(at)?out('lookat',at):null}
  return null}
// several in one breath, done one after another; each part must be an order on its own ("Cal and Amber, come here" is
// one), and talk after them is left out ("go to the store and get some bread" goes to the store)
function ordParseAll(text,ctx){const one=()=>{const o=ordParse(text,ctx);return o?[o]:null};
  const parts=ordNorm(text).split(ORD_SPLIT).filter(Boolean);if(parts.length<2||parts.length>4)return one();
  const out=[];let last=ctx.last;
  for(const part of parts){const o=ordParse(part,Object.assign({},ctx,{last}));if(!o)return out.length?out:one();
    if(out.length)o.who=out[0].who;if(o.at&&typeof o.at==='object')last=o.at;out.push(o)}
  return out}
// a place, machine or shop by its name: the errands' places and the marina, a machine (WK_RIDES), a shop by its sign
function ordFind(w){w=w.replace(/^(the|a|an|my|your|our)\b ?/,'').replace(/'s$/,'').trim();if(!w)return null;
  const at=(k,o)=>ORD_AT.get(k)||(ORD_AT.set(k,o),o);
  for(const [re,k] of ORD_PLACES)if(re.test(w))return at(k,{pl:k,n:k==='marina'?'the marina':TALK_ERR[k].n});
  const rk=ORD_RIDE[w]||Object.keys(WK_RIDES).find(k=>WK_RIDES[k].n===w);if(rk&&WK_RIDES[rk])return 'ride:'+rk;
  for(const R of TF_ROOMS){if(R.si==null||R.home)continue;const n=ordNorm(townShopName(R)).replace(/^the /,'');
    if(n===w||w.length>=4&&n.split(' ').includes(w))return at(R,{pl:'shop',R,n:townShopName(R)})}
  return null}

// ---------- giving it ----------
// where a target is now
function ordPos(at){if(at==='me')return [wk.x,wk.z];if(typeof at==='string')return talkWhere(at);if(!at)return null;
  if(at.pl==='marina')return [MAR.x,MAR.z0];if(at.pl==='shop')return [at.R.x,at.R.z];
  if(at.pl){const a=TALK_ERR[at.pl].at(),pts=typeof a[0]==='number'?[a]:a;return pts[0]}return isFinite(at.x)?[at.x,at.z]:null}
// in the runtime's words: the thing ('the marina', 'an excavator', a name) and what comes next
function ordWhat(at){if(!at||at==='me')return '';if(typeof at==='string'&&at.startsWith('ride:'))return talkA(WK_RIDES[at.slice(5)].n);
  return at.pl?at.n:typeof at==='object'?talkName(at):''}
function ordNextWords(o){const w=ordWhat(o.at);return {come:'come over',follow:w?'follow '+w:'follow you',stay:'wait here',home:'head home',carry:'carry on',goto:'go to '+w,look:'look your way',lookat:'have a look at '+w,run:'run'}[o.do]}
// '' or why they can't (WORDS 'Town: orders')
function ordCan(p,o){if(o.do==='look'||o.do==='lookat'||o.do==='carry'||o.do==='stay'&&(p.room||p.sit))return '';
  if(p.room)return say(p.spot&&p.spot.staff&&!p.room.home?'odWork':'odIn');if(p.sit)return say('odSeat');
  if(p.go||p.goTo||p.path||p.car||!p.w)return say('odBusy');
  if((o.do==='follow'||o.do==='goto')&&o.at===p)return say('odSelf');
  if((o.do==='follow'||o.do==='goto')&&typeof o.at==='object'&&!o.at.pl&&!tf.people.includes(o.at))return say('odGone');
  if(o.do==='home'&&!ordHomeWay(p))return say('odNoHome');return ''}
// who an order is for: everyone about, those named within earshot, or the one you are talking to (grown-ups only)
function ordWho(o){const M=TALK.M,g=TALK.group.filter(q=>M.can(q)&&!talkKid(q)),w=TALK.with;
  if(o.who==='all')return g.length?g:[w];
  if(Array.isArray(o.who)){const h=o.who.filter(q=>tf.people.includes(q)&&M.can(q)&&!talkKid(q)&&Math.hypot(q.x-wk.x,q.z-wk.z)<TU.ordHearR);if(h.length)return h}
  return TALK.grp&&g.length>1?g:[w]}
// the talk box's text: an order? Then those it is for decide, answer and do it; true when it was one (talk.js)
function ordSaid(text){const M=TALK.M;if(!M||!TALK.with)return false;
  const people=tf.people.filter(q=>!talkKid(q)&&talkCard(q)).map(q=>[talkName(q),q]);
  const list=ordParseAll(text,{people,find:ordFind,last:TALK.ordLast});if(!list)return false;
  const o0=list[0],ts=ordWho(o0).filter(Boolean);if(!ts.length)return false;
  // "never mind" with nothing under way is only talk
  if(list.every(o=>o.do==='carry')&&!ts.some(p=>p.ord||p.ordQ&&p.ordQ.length))return false;
  for(const o of list)if(o.at&&typeof o.at==='object')TALK.ordLast=o.at;
  const please=/\bplease\b/i.test(text);
  ts.forEach((p,i)=>{const why=ordCan(p,o0),ok=!why&&M.willing(p,{how:ORD_HOW[o0.do],please})&&repOpinion(tfWho(p))>TU.ordSpite;
    if(ok){ordStart(p,o0);p.ordQ=list.slice(1)}
    M.ordered(p,{how:ORD_HOW[o0.do],what:ordWhat(o0.at),text,ok:why?undefined:ok,can:why?false:undefined,why,next:ok&&list.length>1?ordNextWords(list[1]):'',after:i*700});
    if(o0.do!=='come'&&o0.do!=='follow'&&o0.do!=='run')talkFace(p,1.2);repDeed('kind',[tfWho(p)]);fmIntro(tfWho(p));
    const did=ok&&{come:'came over to you',follow:o0.at==='me'?'followed you':'followed '+ordWhat(o0.at),home:'headed home',goto:'went to '+ordWhat(o0.at)}[o0.do];if(did)ordLog(`${talkName(p)} ${did} because you asked`)});
  return true}
function ordLog(s){TALK.log.push({t:performance.now()/1000,s});if(TALK.log.length>8)TALK.log.shift()}

// ---------- doing it ----------
function ordStart(p,o){p.tkGo=null;if(p.pu)puEnd(p);if(p.ordV==null)p.ordV=p.vt;const T=TU;
  switch(o.do){
    case 'carry':ordStop(p);p.wait=0;return;
    case 'stay':p.goal=null;p.ord={k:'stay'};if(!p.room&&!p.sit)talkFace(p,T.ordStayT);return;
    case 'look':p.ord={k:'look',t:2.5};talkFace(p,4,wk.x,wk.z);return;
    case 'lookat':{const at=ordPos(o.at);p.ord={k:'lookat',t:3};if(at)talkFace(p,5,at[0],at[1]);return}
    case 'run':p.goal=null;p.ord={k:'run'};talkRun(p,wk.x,wk.z,5+Math.random()*3,Math.max(p.vt||1.3,1.3)*2);return;
    case 'home':{const L=typeof lifeOf==='function'&&lifeOf(p.body),R=L&&L.home;
      if(R&&roGo(p,R.x,R.z,{near:1.2,tag:'ord',max:600,then:q=>{q.ord=null;q.ordQ=null;tfDrop(q)},fail:q=>{roJoin(q);ordHomeWalk(q)}})){p.ord={k:'home'};return}
      ordHomeWalk(p);return}
    case 'goto':if(!p.off&&o.at&&o.at.pl&&TALK_ERR[o.at.pl]){p.goal=null;p.wait=0;talkErrand(p,o.at.pl,null);if(p.goal)p.ord={k:'goto',at:o.at,err:p.goal};return}
      if(!p.off&&o.at&&typeof o.at==='object'&&!o.at.pl){p.goal=null;p.wait=0;talkErrand(p,'company',o.at);if(p.goal)p.ord={k:'goto',at:o.at,err:p.goal};return}
      // fall through: a machine, the marina or a shop, by the walks
    default:p.goal=null;p.wait=0;p.ord={k:o.do,at:o.at,t:o.do==='follow'?T.ordFollowT:o.do==='come'?120:240}}}
// home along the walks and down their street (when there is no way straight there)
function ordHomeWalk(p){const H=ordHomeWay(p);if(!H||!p.w)return;p.goal={k:'order',n:H.n,t:1e9,here:0};p.wait=0;tfGoalDir(p,H.n);p.ord={k:'home',H}}
// done, or given up: walking pace back, the goal cleared, the next in line (if they still can)
function ordStop(p){p.ord=null;p.ordQ=null;if(p.goal&&p.goal.k==='order')p.goal=null;if(p.ordV!=null){p.vt=p.ordV;p.ordV=null}if(p.off&&!p.pu&&p.off.tag==='ord')roBack(p)}
function ordDone(p){const Q=p.ordQ;p.ordQ=null;ordStop(p);const o=Q&&Q.shift();if(o&&!ordCan(p,o)){ordStart(p,o);if(p.ord)p.ordQ=Q}}
// what they are about, in their own words (talk.js talkNow)
function ordDoing(p){const o=p.ord;if(!o)return '';const w=ordWhat(o.at);
  return {come:'coming over to you',follow:o.at==='me'?'following you, like you asked':'following '+w+', like you asked',stay:'waiting here, like you asked',home:'heading home',
    goto:'on my way to '+(w||'where you said'),run:'running off',look:'looking your way',lookat:'having a look at '+w}[o.k]||''}
// the nearest point of walk w to x,z: { s along it, d off it }
function ordProj(w,x,z){let bs=0,bd=1e9;const P=w.p,L=w.L;
  for(let i=1;i<P.length;i++){const ax=P[i-1][0],az=P[i-1][1],dx=P[i][0]-ax,dz=P[i][1]-az,l2=dx*dx+dz*dz||1,u=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),
    d=Math.hypot(ax+dx*u-x,az+dz*u-z);if(d<bd){bd=d;bs=L[i-1]+u*(L[i]-L[i-1])}}return {s:bs,d:bd}}
// the sidewalk nearest x,z (not a crosswalk) and where along it
function ordWalkOf(x,z){let b=null,bp=null;for(const w of TF_WALK){if(w.x)continue;const q=ordProj(w,x,z);if(!bp||q.d<bp.d){b=w;bp=q}}return b&&{w:b,s:bp.s,d:bp.d}}
// walk toward x,z along the walks, to the sidewalk spot nearest it; true once there (within near, or as close as the walks go)
function ordChase(p,x,z,near){const d=Math.hypot(x-p.x,z-p.z);if(d<near){p.goal=null;if(p.off){p.off.pts.length=0;p.off.i=0}talkFace(p,0.6,x,z);return true}
  if(p.path)return false;const o=p.off,now=performance.now()/1000;
  // anywhere: straight there off the walks (roam.js), a new way once it has moved on (at most once a second)
  if(o&&o.tag==='ord'&&Math.hypot(o.x-x,o.z-z)<1.5){if(o.i>=o.pts.length){talkFace(p,0.6,x,z);return true}return false}
  if(o&&o.tag==='ord'&&now-o.at<1)return false;
  if(!(p.roFail>now-6)&&roGo(p,x,z,{near:near*0.8,tag:'ord',fail:q=>{q.roFail=performance.now()/1000;roJoin(q)}}))return false;
  // no way across: along the walks
  if(p.off||!p.w)return false;const W=ordWalkOf(x,z);if(!W)return false;
  if(p.w===W.w){if(p.goal&&p.goal.k==='order')p.goal=null;const ds=W.s-p.s;if(Math.abs(ds)<0.8){talkFace(p,0.6,x,z);return true}p.wait=0;p.dir=ds>0?1:-1;return false}
  // onto that walk by whichever end is the shorter way round
  const Da=tfDistTo(W.w.a),Db=tfDistTo(W.w.b),from=D=>Math.min((D.get(p.w.a)??1e9)+p.s,(D.get(p.w.b)??1e9)+p.w.len-p.s),n=from(Da)+W.s<=from(Db)+W.w.len-W.s?W.w.a:W.w.b;
  if(!p.goal||p.goal.k!=='order'||p.goal.n!==n||p.goal.w!==W.w){p.goal={k:'order',n,w:W.w,t:1e9,here:0};tfGoalDir(p,n)}p.wait=0;return false}
// the way home: the walk's node nearest their street's mouth on the cross street, then down the street's sidewalk to
// their house (lives.js lifeOf: the house and its street, SUB_STREETS); null if they have none
function ordHomeWay(p){const L=typeof lifeOf==='function'&&lifeOf(p.body),R=L&&L.home;if(!R)return null;
  let S=null,bd=1e9;for(const s of SUB_STREETS){const [ax,az,bx,bz]=s,dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((R.x-ax)*dx+(R.z-az)*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(ax+dx*t-R.x,az+dz*t-R.z);if(d<bd){bd=d;S=s}}
  if(!S)return null;const side=R.z>(MCN+MCS)/2?MCS:MCN,off=(a,b)=>(a>=b?1:-1)*4.4,pts=[];
  if(S[0]===S[2]){const X=S[0];pts.push([X+off(R.x,X),side],[X+off(R.x,X),R.z])}
  else{const Z=S[1];
    if(Math.abs(Z-(MCN+MCS)/2)<8)pts.push([R.x,side]);
    else{// down the north-south street that meets it nearest the house
      let X=null,bx=1e9;for(const s of SUB_STREETS)if(s[0]===s[2]&&Math.min(s[1],s[3])-1<=Z&&Math.max(s[1],s[3])+1>=Z){const d=Math.abs(s[0]-R.x);if(d<bx){bx=d;X=s[0]}}
      if(X==null)X=S[0];const oz=off(R.z,Z);pts.push([X+off(R.x,X),side],[X+off(R.x,X),Z+oz],[R.x,Z+oz])}}
  const e=pts[pts.length-1],dd=Math.hypot(R.x-e[0],R.z-e[1]),k=Math.min(6,dd*0.4)/(dd||1);pts.push([e[0]+(R.x-e[0])*k,e[1]+(R.z-e[1])*k]);
  const n=tfNodeNear(pts[0][0],pts[0][1]);return n?{n,pts}:null}
// told into a shop by name and passing its door while it is open: in they go (townfolk.js tfEntCross)
function ordShopIn(p,E){const o=p.ord;if(!o||o.k!=='goto'||!o.at||o.at.R!==E.R)return false;const R=E.R;
  if(!R.live||!townRoomOpen(R))return false;const sp=tfFreeSpot(R,E);if(!sp)return false;ordDone(p);tfHold(p,R,E,sp);tfGoIn(p);return true}
// a few times a second (talk.js talkTick): each order under way
function ordTick(dt){if((TALK.ordT=(TALK.ordT||0)+dt)<0.1)return;const t=TALK.ordT;TALK.ordT=0;
  for(const p of tf.people.slice()){const o=p.ord;if(!o)continue;
    if(p.dead||p.hurt||p.cower>0||p.drv||p.go||p.goTo||p.room&&o.k!=='stay'&&o.k!=='look'&&o.k!=='lookat'||(p.flee>0&&o.k!=='run')){ordStop(p);continue}
    if(o.t!=null&&(o.t-=t)<=0){ordDone(p);continue}
    if(o.k==='stay'){if(p.room||p.sit||!(p.wait>0))ordDone(p);continue}
    if(o.k==='look'||o.k==='lookat')continue
    if(o.k==='run'){if(!(p.flee>0))ordDone(p);continue}
    if(o.k==='home'){if(p.off)continue;if(p.path){if(p.s>=p.path.len-0.05){ordStop(p);tfDrop(p)}continue}
      const g=p.goal;if(!g||g.k!=='order'){ordStop(p);continue}
      if(g.here||Math.hypot(g.n.x-p.x,g.n.z-p.z)<1.2){p.goal=null;p.wait=0;p.path=tfLine([[p.x,p.z],...o.H.pts]);p.s=0}continue}
    if(o.err){if(p.goal!==o.err){const at=ordPos(o.at);ordDone(p);if(at)talkFace(p,6+Math.random()*6,at[0],at[1])}continue}
    const at=ordPos(o.at);if(!at){ordDone(p);continue}
    const d=Math.hypot(at[0]-p.x,at[1]-p.z),you=o.at==='me';
    // you drove off or went far from the walks: following stops; coming stops
    if(you&&(mode!=='walk'||wk.inside)&&d>TU.ordLostR||you&&d>TU.ordLostR*2){ordDone(p);continue}
    if(p.ordV!=null)p.vt=p.ordV*(o.k==='follow'&&d>6?1.6:1);
    const there=ordChase(p,at[0],at[1],o.k==='follow'?2.6:you?2.2:typeof o.at==='string'?5:3.5);
    if(there&&o.k!=='follow'){ordDone(p);talkFace(p,you?6+Math.random()*4:8+Math.random()*6,at[0],at[1])}}}
