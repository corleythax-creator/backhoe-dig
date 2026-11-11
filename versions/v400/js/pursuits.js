// Corley's Island: pursuits, what some of the townsfolk are working toward and go off and do (anywhere, roam.js). Who
// has one is theirs by their Human Forge personality (models/people/library.json's mind: likes and traits, PU_KINDS'
// likes/traits) and a seeded share (TU.puShare) of everyone who fits one; a look worn by more than one (tfWho) is each
// their own. Each kind has its hours, where it is done (puSpot: a spot on the shore with water in front for fishing,
// a high spot with a view of the lake to paint, an open spot for the stars, a loop of open spots for a fitness walk,
// or you yourself, to say hello), how long, and its progress
// toward a goal kept between visits (PU.rec, saved as bhd_pursuits on this device: fish caught and the biggest,
// paintings toward a show at Harbor Books, miles walked, shooting stars, times met). Now and then
// (TU.puGap) someone free on the walks (talkErrFree) sets off for theirs, at most TU.puMax at once; told something to do
// (orders.js) or scared off, they drop it. What they say about it near you is WORDS 'Town: pursuits'; what they are
// doing and have done goes to their answers (talk.js talkNow: doing, did) and a model hears it (puScene in talkScene).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const PU_KINDS={
  fish:{likes:['sea','animals'],traits:['calm','quiet','practical'],hrs:[[5.5,9.5],[16.5,20.5]],dur:[90,200],
    doing:'fishing off the shore',go:'going fishing',goal:r=>`catch a ${r.b>=10?15:10} lb redfish off the shore${r.b?` (best so far ${r.b} lb)`:''}`},
  paint:{likes:['art','beauty'],traits:['dreamy','quiet'],hrs:[[8.5,17.5]],dur:[100,220],
    doing:'painting the lake',go:'off to paint the view',goal:r=>`paint ${r.c>=12?24:12} views of the lake for a show at Harbor Books (${r.c||0} done)`},
  fit:{likes:['sport'],traits:['bold','cheerful'],hrs:[[6,9],[17,19.5]],dur:[0,0],
    doing:'out on a fitness walk',go:'off on a fitness walk',goal:r=>`walk 100 miles before summer (${((r.m||0)/1609).toFixed(1)} so far)`},
  meet:{likes:[],traits:['warm','chatty','kind'],hrs:[[8,20]],dur:[0,0],
    doing:'coming over to say hello',go:'coming to say hello',goal:r=>`get to know the newcomer from the island${r.c?` (met ${r.c} times)`:''}`},
  stars:{likes:['stars'],traits:['dreamy','curious'],hrs:[[20.5,24],[0,1.5]],dur:[90,200],
    doing:'out looking at the stars',go:'going out to see the stars',goal:r=>`see a shooting star${r.s?` (seen ${r.s})`:' this year'}`}};
const PU={rec:{},who:new Map(),t:0,lastStart:0,spots:null,sig:NaN,dirty:false,saveT:0};
try{const v=JSON.parse(localStorage.getItem('bhd_pursuits')||'null');if(v&&v.rec)PU.rec=v.rec}catch(e){}
function puSave(){if(!PU.dirty||window.syncHold)return;PU.dirty=false;try{localStorage.setItem('bhd_pursuits',JSON.stringify({v:1,rec:PU.rec}))}catch(e){}}
const puH=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h/4294967296};

// whose pursuit is which (null: none), by their personality; the same every time
function puOf(p){const id=tfWho(p);if(PU.who.has(id))return PU.who.get(id);const c=talkCard(p);if(!c||talkKid(p))return null;
  let best=null,bs=0;for(const k in PU_KINDS){const K=PU_KINDS[k],s=(c.likes||[]).filter(l=>K.likes.includes(l)).length*2+(c.traits||[]).filter(t=>K.traits.includes(t)).length+puH(id+k)*0.9;if(s>bs){bs=s;best=k}}
  const k=bs>=1.5&&puH(id+'pursuit')<TU.puShare?best:null;PU.who.set(id,k);return k}
const puRec=p=>{const id=tfWho(p);return PU.rec[id]||(PU.rec[id]={})};
const puHour=K=>{const h=townHour();return K.hrs.some(([a,b])=>h>=a&&h<b)};

// ---------- where ----------
// spots found a slice a frame (TU.roMs; again if the town's walls move): the shore with water in front, high spots with a lake view, open
// spots under the sky; each [x, z, facing]
function puSpots(){roSolids();if(PU.sig!==RO.sig){PU.sig=RO.sig;PU.spots={shore:[],view:[],open:[],n:0,seed:7}}const S=PU.spots;if(S.n>=5000)return S;
  const B=RO_BOX,rnd=()=>(S.seed=Math.imul(S.seed^(S.seed>>>15),2246822519)+0x9e3779b9>>>0)/4294967296,t0=performance.now();
  const wet=(x,z)=>!(hAt(x,z,baseHeight(x,z)+0.6)>WATER+0.08);
  for(;S.n<5000&&performance.now()-t0<TU.roMs;S.n++){const x=B[0]+rnd()*(B[1]-B[0]),z=B[2]+rnd()*(B[3]-B[2]),h=roAt(x,z);if(!(h===h))continue;
    let wa=null;for(let a=0;a<8&&wa==null;a++){const t=a*Math.PI/4;if(wet(x+Math.sin(t)*2.5,z+Math.cos(t)*2.5))wa=t}
    if(wa!=null){if(S.shore.length<40)S.shore.push([x,z,wa]);continue}
    if(S.n%3)continue;
    let open=true;for(let a=0;a<8&&open;a++){const t=a*Math.PI/4,q=roAt(x+Math.sin(t)*5,z+Math.cos(t)*5);if(!(q===q))open=false}
    if(!open||roSolidAt(x,z,h,4))continue;if(S.open.length<60)S.open.push([x,z,rnd()*6.28]);
    // a view: water somewhere within 45 m, looking at it, the higher the better
    for(let a=0;a<16;a++){const t=a*Math.PI/8;if(wet(x+Math.sin(t)*45,z+Math.cos(t)*45)){S.view.push([x,z,t,h]);S.view.sort((a,b)=>b[3]-a[3]);if(S.view.length>14)S.view.pop();break}}}
  return S}
// the nearer of a list's spots, a little at random
function puNear(p,L){if(!L.length)return null;const s=L.map(q=>[q,Math.hypot(q[0]-p.x,q[1]-p.z)*(0.7+Math.random()*0.6)]).sort((a,b)=>a[1]-b[1]);return s[0][1]<260?s[0][0]:null}
// where to do it now: [x, z, facing] or null (not now)
function puSpot(p,k){const S=puSpots();
  if(k==='fish')return puNear(p,S.shore);if(k==='paint')return puNear(p,S.view);if(k==='stars')return puNear(p,S.open);
  if(k==='fit')return puNear(p,S.open);
  if(k==='meet'){const r=puRec(p),day=fuelDayNo();if(r.t===day||mode!=='walk'||wk.inside||Math.hypot(wk.x-p.x,wk.z-p.z)>50||wk.x<RO_BOX[0]||wk.x>RO_BOX[1]||wk.z<RO_BOX[2]||wk.z>RO_BOX[3])return null;return [wk.x,wk.z,0]}
  return null}

// ---------- doing it ----------
// near you, and talk on: say it over their head (WORDS 'Town: pursuits')
function puSay(p,id,v){if(TALK.mode==='off'||!TALK.here.includes(p)||Math.hypot(p.x-wk.x,p.z-wk.z)>TU.talkSeeR)return;talkShow(p,{say:say(id,v)},null,null)}
function puStart(p,k){const at=puSpot(p,k);if(!at)return false;const K=PU_KINDS[k],run=k==='fit'&&puH(tfWho(p)+'jog')<0.5;
  const ok=roGo(p,at[0],at[1],{near:k==='meet'?2.2:0.7,tag:'pu',v:run?p.vt*1.9:k==='fit'?p.vt*1.25:0,max:400,then:q=>puArrive(q),fail:q=>{puEnd(q);roJoin(q)}});if(!ok)return false;
  p.pu={k,ph:'go',face:at[2],legs:k==='fit'?2+Math.floor(Math.random()*3):0,run,m:0,x:p.x,z:p.z};puSay(p,'pu_'+k+'Go');return true}
function puArrive(p){const u=p.pu;if(!u)return;const K=PU_KINDS[u.k];u.m+=Math.hypot(p.x-u.x,p.z-u.z);u.x=p.x;u.z=p.z;
  if(u.k==='fit'&&u.legs-->0){const S=puSpots(),L=S.open.filter(q=>Math.hypot(q[0]-p.x,q[1]-p.z)<90&&Math.hypot(q[0]-p.x,q[1]-p.z)>20),at=L[(Math.random()*L.length)|0];
    if(at&&roGo(p,at[0],at[1],{near:0.8,tag:'pu',v:p.vt*(u.run?1.9:1.25),max:300,then:q=>puArrive(q),fail:q=>puFinish(q)}))return;}
  if(u.k==='fit'||u.k==='meet'){puFinish(p);return}
  u.ph='do';p.look=u.face;p.wait=K.dur[0]+Math.random()*(K.dur[1]-K.dur[0])}
// done: what came of it, kept, and said
function puFinish(p){const u=p.pu;if(!u)return;if(typeof ndOf==='function'){const n=ndOf(p);n.u=0.05;if(u.k==='fit')n.e=Math.min(1,n.e+0.1)}const r=puRec(p),day=fuelDayNo();r.n=(r.n||0)+1;r.t=day;r.k=u.k;PU.dirty=true;
  if(u.k==='fish'){const c=Math.random()<0.35?0:1+Math.floor(Math.random()*3);let big=0;for(let i=0;i<c;i++)big=Math.max(big,+(1+Math.random()**2*(Math.random()<0.08?13:8)).toFixed(1));
    r.c=(r.c||0)+c;r.last=c;r.lastB=big;const rec=big>(r.b||0);if(big)r.b=Math.max(r.b||0,big);puSay(p,c?rec&&big>=10?'pu_fishRecord':'pu_fishGot':'pu_fishNone',{n:c,lb:big})}
  else if(u.k==='paint'){r.c=(r.c||0)+1;puSay(p,r.c===12||r.c===24?'pu_paintShow':'pu_paintDone',{n:r.c})}
  else if(u.k==='fit'){r.m=(r.m||0)+u.m;puSay(p,'pu_fitDone',{mi:(u.m/1609).toFixed(1)})}
  else if(u.k==='stars'){const s=Math.random()<0.18;if(s){r.s=(r.s||0)+1;u.saw=1}puSay(p,s?'pu_starsSaw':'pu_starsDone')}
  else if(u.k==='meet'){r.c=(r.c||0)+1;talkFace(p,6);puSay(p,r.c>1?'pu_meetAgain':'pu_meetHi');if(typeof fmIntro==='function')fmIntro(tfWho(p))}
  if(typeof dyNote==='function'){const r2=PU.rec[tfWho(p)]||{};dyNote(p,'pu',{fish:`went fishing and caught ${r2.last?`${r2.last} (the biggest ${r2.lastB} lb)`:'nothing'}`,
    paint:`painted the lake (that's ${r2.c} paintings now)`,fit:`went on a ${u.run?'run':'fitness walk'}, ${(u.m/1609).toFixed(1)} miles`,stars:r2.s&&u.saw?'saw a shooting star':'went out to look at the stars',
    meet:'went over and said hello to the newcomer from the island'}[u.k]||'',0.4)}
  p.pu=null;p.puNext=performance.now()/1000+TU.puGap*(0.7+Math.random()*0.8);if(p.off&&u.k!=='meet')roBack(p)}
// dropped (told something else, scared off)
function puEnd(p){if(!p.pu)return;p.pu=null;p.puNext=performance.now()/1000+TU.puGap}
// what they are about, and what they have done of it lately (talk.js talkNow), and for a model (talkScene)
function puDoing(p){const u=p.pu;if(!u)return '';const K=PU_KINDS[u.k];return u.ph==='go'?K.go:K.doing}
function puDid(p){const k=puOf(p),r=PU.rec[tfWho(p)];if(!k||!r||!r.n)return '';const ago=fuelDayNo()-(r.t||0),when=ago<=0?'today':ago===1?'yesterday':'the other day';
  return {fish:`went fishing ${when}${r.last!=null?` and caught ${r.last||'nothing'}`:''}`,paint:`painted the lake ${when} (${r.c} paintings now)`,fit:`went on a fitness walk ${when}`,
meet:`came over to say hello to you ${when}`,stars:`was out looking at the stars ${when}`}[k]}
function puScene(p,n){const k=puOf(p);if(!k)return '';const K=PU_KINDS[k],r=PU.rec[tfWho(p)]||{};
  return `${n}'s pursuit: ${K.doing.replace(/^out /,'')}, working toward this: ${K.goal(r)}.${p.pu?` Right now ${n} is ${puDoing(p)}.`:''}`}
// once a second: who is due to set off, and who is done or has to stop
function puTick(dt){if(!tf.on||!TALK.lib)return;if(!RO.jobs.length)puSpots();if((PU.t+=dt)<1)return;PU.t=0;const now=performance.now()/1000;let on=0;
  for(const p of tf.people){const u=p.pu;if(!u)continue;
    if(p.dead||p.hurt||p.cower>0||p.room||p.drv||p.ord||p.flee>0||!p.off&&u.ph==='go'){puEnd(p);continue}on++;
    if(u.ph==='do'&&!(p.wait>0))puFinish(p);
    // going over to you: after you as you move
    else if(u.k==='meet'&&u.ph==='go'&&p.off&&Math.hypot(p.off.x-wk.x,p.off.z-wk.z)>3&&now-p.off.at>1.5){if(mode!=='walk'||Math.hypot(wk.x-p.x,wk.z-p.z)>70)puEnd(p);else roGo(p,wk.x,wk.z,{near:2.2,tag:'pu',max:200,then:q=>puArrive(q)})}}
  if(on>=TU.puMax||now-PU.lastStart<1.5)return;
  for(const p of tf.people){if(p.pu||!talkErrFree(p)||p.inside>0)continue;if(p.puNext==null){p.puNext=now+10+Math.random()*TU.puGap;continue}if(now<p.puNext)continue;
    const k=puOf(p);if(!k||!puHour(PU_KINDS[k])||Math.random()<0.5){p.puNext=now+20+Math.random()*40;continue}
    PU.lastStart=now;if(!puStart(p,k))p.puNext=now+60+Math.random()*60;break}
  if((PU.saveT+=1)>=10){PU.saveT=0;puSave()}}
addEventListener('pagehide',puSave);
