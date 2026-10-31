// Corley's Island: the town's life. Money: the work on the island pays into your wallet (fuel.js, stats.earned) and the
// town's shops spend it: walk up to a shop's counter (Carry, the button says Order) for its menu (TOWN_MENU by sign,
// MAIN_SHOPS in mainland.js; the brewery's bar too), the General Store's mulch, toolboxes and groceries (TOWN_PB,
// pickup.js) and Lakeside Guns' guns and boxes of rounds (TOWN_GUN, pistol.js). A coffee or a meal puts a spring in your
// step (townPep, walker.js); the bank tells your balance; the hotel sleeps you to 7 AM. Hours: every shop opens and
// shuts on the game clock (townRoomOpen, by sign or kind; offices shut at weekends), houses have their residents home
// mornings and evenings, and how many people are out follows the hour of the day (townBusy: quiet at night, busy at
// lunch and after work; Tuning tfQuiet). People: passersby greet you now and then (Tuning greetChance, greetGap), and
// Carry next to anyone talks to them (a line fit for the time, the weather and your day's work, WORDS 'Town: talk').
// The regulars (TOWN_REGS) are named people with their own looks and lines: shopkeepers at their counters while their
// shop is open, and two who walk the town; they remember how often you've talked (town.met, saved with the rigs) and
// give a regular 10% off at their shop. One shot dead is gone for the rest of the game day.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const town={met:{},pep:0,gT:0,chipT:0,sig:0,regT:0,wel:null,shut:null,shop:null};
// ---------- money ----------
const townCash=()=>(TU.cashStart||0)+stats.earned-stats.fuelCost-(stats.spent||0);
const townCap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function townPay(v,item){v=Math.round(v*100)/100;if(!(v>0))return true;const c=townCash();
  if(c<v-1e-6){toast(say('shopShort',{item:townCap(item),price:usd(v),cash:usd(Math.max(0,c))}),'bad',4600);return false}
  stats.spent=(stats.spent||0)+v;statDirty=true;town.sig++;town.chipT=5;return true}
function townRefund(v){if(!(v>0))return;stats.spent=Math.max(0,(stats.spent||0)-v);statDirty=true;town.sig++;town.chipT=4;toast(say('shopRefund',{price:usd(v)}),'',2000)}
// the General Store's goods (PB_KINDS, pickup.js) and the gun shop's [gun, a round] (GUNS, pistol.js), boxes of TOWN_BOX
const TOWN_PB={mulch:5.49,tools:39.99,groc:24.5},TOWN_GUN={pistol:[0,0.35],shotgun:[449,1.1],rifle:[799,1.6],carbine:[899,0.6]},TOWN_BOX=50;
// ---------- the shops' menus by sign (MAIN_SHOPS): [item, price, what it does: p a pick-me-up, s a night's sleep, b the
// balance]; a price of 0 is free. Signs left out (the realty office, the gun shop) have no menu
const TOWN_MENU={0:[['Coffee',2.5,'p'],['Cinnamon roll',3.75,'p'],['Slice of pie',4.5,'p'],['Loaf of sourdough',6]],
  1:[['Paperback',8.99],['Map of the lake',12],['Hardcover',24]],2:[['Latte',4.75,'p'],['Scone',3.25,'p'],['Avocado toast',9.5,'p']],
  3:[['Work gloves',18],['Thermos',29],['Rain jacket',89]],4:[['Work gloves',14.99],['Marking paint',7.49],['Tape measure, 25 ft',19.99],['Flat shovel',34.99]],
  5:[['Coffee',1.75,'p'],['Two eggs and hash browns',8.95,'p'],['Patty melt',11.5,'p'],['Slice of pie',4.25,'p']],6:[['Sunscreen',9.99],['Bandages',5.49],['Aspirin',6.99]],
  7:[['Mail a letter',0.73],['Book of stamps',7.3],['Ship a package',14.95]],8:[['Check my balance',0,'b']],9:[['Haircut',22],['Beard trim',12]],
  10:[['Single rose',4],['Bouquet',35]],11:[['Drip coffee',2.75,'p'],['Cold brew',4.5,'p'],['Mocha',5.25,'p'],['Bag of beans',16]],
  12:[['Slice',3.5,'p'],['Whole pie',18,'p']],13:[['Railroad spike',5],['Old lantern',45]],14:[['Nightcrawlers',4.99],['Lures',8.99],['Fishing license',25]],
  15:[['Saltwater taffy',4,'p'],['Fudge, quarter pound',6.5,'p']],17:[['Pickle',1.25],['Soup of the day',5.5,'p'],['Turkey club',9.75,'p']],
  18:[['Postcard',2],['Print',40]],19:[['Kite',15],['Toy excavator',24.99]],20:[['Wash a load',3.5],['Dry a load',2.25]],
  21:[['Soda',2.5,'p'],['Pint',6.5],['Burger',13.5,'p'],['Fish and chips',15,'p']],22:[['Bike tune-up',45],['Kayak, an hour',25]],23:[['A night\'s stay',129,'s']],
  24:[['Bottled water',1.5,'p'],['Bag of ice',3.49],['Sandwich',6.99,'p']],25:[['Skein of yarn',7.99],['Quilt',180]],26:[['Cut',38],['Color',85]],
  28:[['Borrow a book',0],['Library card',0]],29:[['Dog license',15],['Building permit',75]],30:[['Bag of ice',3],['Bundle of firewood',7]],31:[['Movie ticket',11],['Popcorn',6,'p']]};
const TOWN_BREW=[['Lager',7],['Flight of four',12],['Soft pretzel',9,'p'],['Root beer',3,'p']];
// ---------- hours (24 h clock; a close of 24 is midnight) by sign, else by kind (RM_KIND, interiors.js) ----------
const TOWN_HRS={0:[6,15],2:[7,17],5:[6,21],11:[6,16],12:[11,22],15:[10,20],17:[8,17],21:[11,23],23:[0,24],24:[7,22],28:[10,19],29:[8,17],31:[12,23]};
const TOWN_KHRS={eat:[7,20],shop:[9,18],salon:[9,18],office:[9,17],wash:[6,22],art:[10,18],gun:[9,19]};
const townHour=()=>dnMin(dn.t)/60,townDow=()=>((fuelDayNo()+4)%7+7)%7,townWeekend=()=>{const d=townDow();return d===0||d===6};
function townHrs(R){return R.si!=null?TOWN_HRS[R.si]||TOWN_KHRS[R.kind]||[9,18]:R.hrs||null}
function townRoomOpen(R){const h=townHour();
  if(R.home)return townWeekend()?h>=7.5&&h<23.5:h>=6&&h<8.5||h>=17&&h<23.5;
  const H=townHrs(R);if(!H)return true;if(R.kind==='office'&&R.si!==7&&R.si!==23&&townWeekend())return false;return h>=H[0]&&h<H[1]}
const townAmPm=h=>h%24===0?'midnight':h===12?'noon':(h%12||12)+(h<12?' AM':' PM');
// how busy the town is this hour, 0 to 1: the walkers and cars (R undefined) and a room's customers
const TOWN_CURVE=[[0,0.05],[5,0.05],[6.5,0.35],[8,0.8],[10,0.7],[12,1],[14,0.85],[17,0.95],[19,0.75],[21,0.45],[23,0.15],[24,0.05]];
function townBusy(R){const h=townHour();let i=1;while(i<TOWN_CURVE.length-1&&TOWN_CURVE[i][0]<h)i++;const [a,u]=TOWN_CURVE[i-1],[b,w]=TOWN_CURVE[i];
  let v=u+(w-u)*Math.min(1,Math.max(0,(h-a)/(b-a)));if(townWeekend())v*=h<10?0.7:1.1;
  return R?Math.min(1,Math.max(0.3,v)):Math.min(1,Math.max(TU.tfQuiet??0.12,v))}
// a room with more people than it wants now (shut, or quieter): customers go first, then staff, the regular last, and only
// out of sight (or well away from the worker) so nobody vanishes in front of him
function townRoomEmpty(R,want){const ps=tf.people.filter(p=>p.room===R&&!p.dead&&!p.hurt&&!p.hit).sort((a,b)=>(a.reg?2:a.spot.staff?1:0)-(b.reg?2:b.spot.staff?1:0));
  for(const p of ps){if(R.n<=want)break;if(!tfSeen(p.x,p.z,1.5)||Math.hypot(p.x-wk.x,p.z-wk.z)>30)tfDrop(p)}}
// a coffee or a meal: walking and running faster for a while (walker.js)
const townPep=()=>town.pep>0?1+(TU.pepBoost||0):1;
// ---------- the regulars ----------
const TOWN_REGS=[{id:'ruth',n:'Ruth Halvorsen',look:'f70_cardigan',si:0},{id:'marisol',n:'Marisol Vega',look:'f28_maroon',si:11},
  {id:'dot',n:'Dot Kowalski',look:'f55_teal',si:5},{id:'hank',n:'Hank Dubois',look:'m60_cap',si:4},{id:'earl',n:'Earl Pruitt',look:'m70_flannel',si:27},
  {id:'gus',n:'Gus Lindqvist',look:'m50_tie',si:8},{id:'mick',n:'Mick O\'Rourke',look:'m40_cargo',si:21},
  {id:'walt',n:'Walt Ames',look:'m65_church',walk:[8,18]},{id:'jenna',n:'Jenna Park',look:'f35_denim',walk:[9,15],noSun:1}];
const townFirst=G=>G.n.split(' ')[0];
// turn p into regular G: G's own look (the character count moves with it)
function townMake(p,G){const i=tf.chars.findIndex(c=>c.id===G.look);if(i<0)return false;if(p.reg)p.reg.p=null;
  tf.use[p.ci]--;p.ci=i;p.body=tf.chars[i].id;tf.use[i]++;p.reg=G;p.sc=1;G.p=p;return true}
// once a second: each regular at their post (behind their shop's counter while it is open; the walkers on the streets in
// their hours), swapped in for a staff member or a walker out of sight; one shot dead is gone till the next game day
function townRegsTick(){const day=fuelDayNo(),h=townHour();
  for(const G of TOWN_REGS){if(G.p&&(G.p.dead||tf.people.indexOf(G.p)<0)){if(G.p.dead)G.gone=day;G.p.reg=null;G.p=null}
    if(G.p||G.gone===day)continue;
    if(G.si!=null){const p=tf.people.find(p=>p.room&&p.room.si===G.si&&p.spot.staff&&!p.reg&&!p.dead&&!p.hurt&&(!tfSeen(p.x,p.z,1.5)||Math.hypot(p.x-wk.x,p.z-wk.z)>30));if(p)townMake(p,G)}
    else if(h>=G.walk[0]&&h<G.walk[1]&&!(G.noSun&&townDow()===0)){const p=tfSpawnWalker(false);if(p)townMake(p,G)}}}
// ---------- what Carry does near people: order at a counter, or talk ----------
function townMenu(R){return R.si!=null?TOWN_MENU[R.si]||null:R.nm==='Lakeside Brewing Co.'?TOWN_BREW:null}
function townShopName(R){return R.si!=null?MAIN_SHOPS[R.si][0]:R.nm||'the shop'}
const townFace=p=>{const fx=Math.sin(wk.yaw),fz=Math.cos(wk.yaw),dx=p.x-wk.x,dz=p.z-wk.z,d=Math.hypot(dx,dz)||1;return (dx*fx+dz*fz)/d};
function townCtx(){if(!tf.on||pbS.hold)return null;let best=null,bd=1e9;
  for(const p of tf.people){if(p.dead||p.hurt||p.drv||p.cop||p.inside||p.flee>0||p.cower>0)continue;const d=Math.hypot(p.x-wk.x,p.z-wk.z);
    if(Math.abs(p.y-wk.y)>1.6)continue;const sh=p.room&&p.spot.staff&&townMenu(p.room)&&townRoomOpen(p.room),dd=sh?d-2:d;
    if(d<(sh?2.6:1.9)&&townFace(p)>(sh?0:0.2)&&dd<bd){bd=dd;best=p}}
  if(!best)return null;const p=best,G=p.reg,nm=G&&town.met[G.id]?' '+townFirst(G):'';
  if(p.room&&p.spot.staff&&townMenu(p.room)&&townRoomOpen(p.room))return {a:'order',p,R:p.room,lbl:(p.room.si===8?'Bank':'Order')+(nm?' ·'+nm:'')};
  return {a:'talk',p,lbl:'Talk'+(nm?' to'+nm:'')}}
function townAct(c){if(c.a==='order'){townLook(c.p);townOpen(c.R,c.p);return}townTalk(c.p)}
// p turns to the worker and holds still a few seconds
function townLook(p){const yw=Math.atan2(wk.x-p.x,wk.z-p.z);if(p.room){if(!p.spot.path){p.look=yw-p.spot.yaw;p.t=Math.max(p.t||0,6)}else p.wait=5}else{p.wait=Math.max(p.wait||0,5);p.look=yw}}
// what a regular says now: the first time who they are, then their lines in turn
function townRegLine(G){const n=town.met[G.id]||0;town.met[G.id]=n+1;town.sig++;return n?say('reg_'+G.id+'_'+(1+(n-1)%3)):say('regHi',{line:say('reg_'+G.id+'_0'),name:G.n})}
function townTalk(p){townLook(p);const G=p.reg,C=tf.chars[p.ci]||{},h=townHour();let who=G&&town.met[G.id]?townFirst(G):p.room&&p.spot.staff?'Clerk':C.age==='kid'?'Kid':'Passerby',line;
  if(typeof gun==='object'&&gun.eq)line=say('grGun');
  else if(typeof gun==='object'&&gun.stars>0)line=say('tkBusy');
  else if(G)line=townRegLine(G);
  else if(p.room&&p.room.home){who='Resident';line=say('tkHome')}
  else if(p.room&&p.spot.staff)line=say('tkStaff');
  else if(C.age==='kid')line=say('tkKid');
  else if(p.talked)line=say('tkAgain');
  else{const L=['tkWeather','tkTrain','tkBrew','tkBand','tkRuth','tkHank','tkLake'];if(weather.r>0.15)L.push('tkRain','tkRain');if(h<9)L.push('tkMorning');if(h>=21||h<5)L.push('tkNight','tkNight');
    if(stats.dDug>0.8)L.push('tkDug','tkDug');if(stats.dMow>500)L.push('tkMow');const k=L[(Math.random()*L.length)|0];
    line=say(k,{yd:sYd(stats.dDug),sqft:Math.round(stats.dMow).toLocaleString()+' sq ft'})}
  p.talked=1;toast(say('say',{who,line}),'',5600)}
// ---------- the counter: a shop's menu ----------
function townOff(R){const G=TOWN_REGS.find(G=>G.si!=null&&G.si===R.si);return G&&G.p&&(town.met[G.id]||0)>=5?0.1:0}
function townOpen(R,p){town.shop={R,p};if(document.pointerLockElement)document.exitPointerLock();const G=p.reg;
  $('#tsHead').textContent=townShopName(R);$('#tsWho').textContent=G?say('say',{who:town.met[G.id]?townFirst(G):'Clerk',line:townRegLine(G)}):say('shopWelcome',{shop:townShopName(R)});townDraw();$('#townShop').hidden=false}
function townClose(){town.shop=null;$('#townShop').hidden=true}
function townDraw(){const S=town.shop;if(!S)return;const M=townMenu(S.R)||[],off=townOff(S.R);
  $('#tsList').innerHTML=M.map((m,i)=>{const pr=m[1]*(1-off);return `<div class="gsRow"><div class="gsTxt"><b>${m[0]}</b><small>${m[2]==='p'?'A spring in your step':m[2]==='s'?'Sleep till 7 AM':m[2]==='b'?'What you have to spend':''}${off&&m[1]?(m[2]?' · ':'')+'10% off, a regular':''}</small></div>`+
    `<button data-i="${i}">${m[1]?'Buy '+usd(pr):m[2]==='b'?'Ask':'Take'}</button></div>`}).join('')+`<div class="gsCash">In your wallet: <b>${usd(townCash())}</b></div>`}
$('#tsList').addEventListener('click',e=>{const b=e.target.closest('button'),S=town.shop;if(!b||!S)return;const m=(townMenu(S.R)||[])[+b.dataset.i];if(!m)return;
  const pr=Math.round(m[1]*(1-townOff(S.R))*100)/100;
  if(m[2]==='b'){toast(say('bankBal',{cash:usd(townCash()),earned:usd(stats.earned),spent:usd(stats.spent||0)}),'',6000);return}
  if(!townPay(pr,m[0]))return;
  if(m[2]==='p'){town.pep=TU.pepTime||180;toast(say('shopPep',{item:m[0]}),'good',3600)}
  else if(m[2]==='s'){townClose();dn.t+=((420-dnMin(dn.t))%1440+1440)%1440*60000;dnSave();toast(say('shopSleep'),'good',4200);return}
  else if(!pr)toast(say('shopFree',{item:m[0]}),'',2600);
  else toast(say('shopBought',{item:m[0],price:usd(pr),cash:usd(townCash())}),'good',3000);
  townDraw()});
$('#tsClose').addEventListener('click',townClose);
// ---------- every frame ----------
function townTick(dt){if(town.pep>0)town.pep=Math.max(0,town.pep-dt);
  const B=TF_BOX,inTown=mode==='walk'&&wk.x>B[0]&&wk.x<B[1]&&wk.z>B[2]&&wk.z<B[3];town.chipT=Math.max(0,town.chipT-dt);
  const chip=$('#cashChip'),show=inTown||town.chipT>0||!!town.shop;if(chip.hidden===show)chip.hidden=!show;if(show){const t=usd(townCash());if($('#cashVal').textContent!==t)$('#cashVal').textContent=t}
  if(town.shop&&(mode!=='walk'||Math.hypot(wk.x-town.shop.p.x,wk.z-town.shop.p.z)>3.5||tf.people.indexOf(town.shop.p)<0))townClose();
  if(!tf.on||tf.load!==2)return;
  if((town.regT-=dt)<=0){town.regT=1;townRegsTick()}
  if(mode!=='walk'||!walker.visible)return;
  townDoors();
  // passersby: each gets one chance to greet as he goes by
  if((town.gT-=dt)>0)return;const armed=typeof gun==='object'&&(gun.eq||gun.stars>0);
  for(const p of tf.people){if(p.gr||p.room||p.drv||p.cop||p.dead||p.hurt||p.inside||p.flee>0||p.cower>0)continue;const d=Math.hypot(p.x-wk.x,p.z-wk.z);if(d>3.2||Math.abs(p.y-wk.y)>1.5)continue;
    p.gr=1;if(gun&&gun.stars>0||Math.random()>=(TU.greetChance??0.45))continue;
    const h=townHour(),C=tf.chars[p.ci]||{},G=p.reg,k=armed?'grGun':C.age==='kid'?'grKid':G&&town.met[G.id]?'reg_back':weather.r>0.2?'grRain':h>=4&&h<12?'grMorning':h<17?'grDay':h<21?'grEvening':'grNight';
    p.wait=Math.max(p.wait||0,1.4);p.look=Math.atan2(wk.x-p.x,wk.z-p.z);
    toast(say('say',{who:G&&town.met[G.id]?townFirst(G):C.age==='kid'?'Kid':'Passerby',line:say(Math.random()<0.25&&!armed&&k!=='reg_back'?'grHey':k)}),'',2800);town.gT=TU.greetGap??8;break}}
// coming in at a shop's door: a welcome from whoever is behind the counter, or a word that it is shut and when it opens
function townDoors(){let R=null;for(const Q of TF_ROOMS){if(Q.si==null&&!Q.nm)continue;if(Math.hypot(wk.x-Q.x,wk.z-Q.z)<Q.r*0.7&&Math.abs(wk.y-(Q.y??wk.y))<1.6){R=Q;break}}
  if(R===town.wel)return;town.wel=R;if(!R)return;const open=townRoomOpen(R),H=townHrs(R);
  if(!open&&H){toast(say('shopClosed',{shop:townShopName(R),open:townAmPm(H[0]),close:townAmPm(H[1])}),'',3600);return}
  const s=tf.people.find(p=>p.room===R&&p.spot.staff&&!p.dead&&!p.hurt);if(!s||!townMenu(R))return;
  const G=s.reg;toast(say('say',{who:G&&town.met[G.id]?townFirst(G):'Clerk',line:G&&town.met[G.id]?say('reg_back'):say('shopWelcome',{shop:townShopName(R)})}),'',3000)}
// ---------- saved with the rigs (save.js) ----------
function townSave(){return {m:town.met}}
function townLoad(d){if(!d||typeof d!=='object'||!d.m||typeof d.m!=='object')return;for(const G of TOWN_REGS){const n=d.m[G.id];if(isFinite(n)&&n>0)town.met[G.id]=Math.min(1e6,n|0)}}
