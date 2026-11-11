// Corley's Island: what the townsfolk are doing with their hands. Human Forge's everyday clips (models/people/anims.glb,
// AC_CLIPS, on High and Ultra graphics, where the townsfolk are its people) given to whoever is in a room by where they
// are and what the place is (acPick, AC_DO): behind the bar pouring and wiping it down, behind a café's counter pouring
// coffee, in a kitchen stirring and chopping, behind a shop's counter at the till and fetching things down from the
// shelves; seated at a table eating, drinking, talking, listening, on the phone; at a café with a book; at shelves taking
// things down and picking things up; at home cooking, reading, on the phone; a waiter carrying plates round the tables
// (carry_plate in the walk's place). Each holds a while and changes (AC_HOLD); a line said or heard gives way to talking
// or listening (townfolk.js tfFgClip). And now and then a customer seated in a place with a door gets up (stand_up),
// walks to the back of the room round the furniture (the room's own paths, tfInPath) to the restroom, is out of sight a
// minute or so, and comes back to their seat (sit_down; acTrip, acTripStep). Outdoors, people standing together take turns
// talking and listening. Low and Medium graphics draw the game's own people, who only sit, stand and walk.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const AC_CLIPS=['sit_eat','sit_drink','pour','wipe','stir','chop','carry_plate','phone','read','sit_chat','sit_listen','stand_listen','reach_high','pick_up_low','sit_down','stand_up'];
// what each kind of spot does, by place: [clip, weight]...; '' is the plain sit or stand
const AC_DO={
  barStaff:[['pour',3],['wipe',3],['stand_listen',2],['',2]],cafeStaff:[['pour',3],['wipe',2],['stand_listen',2],['',1]],
  eatStaff:[['stir',2],['chop',2],['wipe',2],['pour',1],['',1]],shopStaff:[['',3],['reach_high',1],['wipe',1],['stand_listen',2],['pick_up_low',1]],
  eatSeat:[['sit_eat',5],['sit_drink',2],['sit_chat',2],['sit_listen',2],['phone',1]],barSeat:[['sit_drink',5],['sit_chat',3],['sit_listen',3],['phone',1],['',1]],
  cafeSeat:[['sit_drink',4],['read',2],['phone',2],['sit_chat',1],['sit_listen',1]],seat:[['',2],['sit_chat',2],['sit_listen',2],['phone',2],['read',1]],
  shopStand:[['',3],['reach_high',2],['pick_up_low',2],['stand_listen',1]],stand:[['',3],['stand_listen',1]],
  homeStand:[['stir',2],['chop',2],['wipe',2],['',1]],homeSeat:[['read',3],['phone',3],['sit_drink',1],['',1]]};
const AC_HOLD={sit_eat:[25,60],sit_drink:[12,30],read:[30,80],phone:[15,45],reach_high:[2.2,2.2],pick_up_low:[1.8,1.8],sit_down:[1.3,1.3],stand_up:[1.3,1.3]};
// which list fits p where they are now
function acKind(p){const R=p.room,sp=p.spot;if(!R||!sp)return null;tfShopW(R);const k=R.vk;
  if(R.home)return sp.sit?'homeSeat':'homeStand';
  if(sp.staff)return k==='pm'?'barStaff':k==='am'||k==='treat'?'cafeStaff':R.kind==='eat'||k==='meal'?'eatStaff':'shopStaff';
  if(sp.sit)return k==='pm'?'barSeat':k==='am'||k==='treat'?'cafeSeat':k==='meal'||R.kind==='eat'?'eatSeat':'seat';
  return R.grp?'stand':k==='day'?'shopStand':'stand'}
const acW=L=>{let t=0;for(const [,w] of L)t+=w;let r=Math.random()*t;for(const [k,w] of L)if((r-=w)<=0)return k;return L[0][0]};
// a new thing to do, and how long
function acPick(p){const L=AC_DO[acKind(p)];if(!L){p.act='';return}let k=acW(L);if(k&&!p.sit&&k.startsWith('sit_'))k='';if(k&&p.sit&&!/^sit_|^read$|^phone$/.test(k))k='';
  p.act=k;const H=AC_HOLD[k]||[8,22];p.actT=H[0]+Math.random()*(H[1]-H[0])}

// ---------- the restroom ----------
// up from the seat, round the furniture to the back of the room, out of sight a while, and back
function acTrip(p){const R=p.room,sp=p.spot,E=R&&R.ent&&tfEnt(R);if(!E||!E.d||!sp||!sp.sit||sp.path)return false;
  const mine=tfInPath(R,E,sp);if(!mine)return false;let far=null,fd=0;
  for(const q of R.spots){if(q===sp||q.staff||q.path)continue;const d=Math.hypot(q.x-E.mx,q.z-E.mz);if(d>fd){fd=d;far=q}}
  if(!far||fd<3)return false;const there=tfInPath(R,E,far);if(!there)return false;
  const pts=mine.slice().reverse().concat(there.slice(1));pts[pts.length-1]=[far.x,far.z];
  p.trip={pts,i:0,ph:'up',t:1.3,back:mine.slice().reverse().concat(there.slice(1)).reverse()};p.act='stand_up';p.actT=1.3;return true}
function acTripStep(p,dt){const T=p.trip,sp=p.spot;
  if(T.ph==='up'){if((T.t-=dt)<=0){T.ph='go';p.sit=0;p.act=''}return}
  if(T.ph==='in'){if((T.t-=dt)<=0){T.ph='back';T.pts=T.back;T.i=0;p.inside=0}return}
  if(T.ph==='down'){if((T.t-=dt)<=0){p.trip=null;acPick(p)}return}
  const P=T.pts[T.i];if(!P){if(T.ph==='go'){T.ph='in';T.t=40+Math.random()*50;p.inside=T.t+1;p.spd=0}else{T.ph='down';T.t=1.3;p.x=sp.x;p.z=sp.z;p.yaw=sp.yaw;p.sit=1;p.spd=0;p.act='sit_down';p.actT=1.3}return}
  const dx=P[0]-p.x,dz=P[1]-p.z,d=Math.hypot(dx,dz);if(d<0.12){T.i++;return}
  p.spd+=(p.vt*0.85-p.spd)*Math.min(1,dt*3);const s=Math.min(d,p.spd*dt);p.x+=dx/d*s;p.z+=dz/d*s;
  let a=Math.atan2(dx,dz)-p.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));p.yaw+=a*Math.min(1,dt*7);p.amp+=(Math.min(1,p.spd/1.2)*0.42-p.amp)*Math.min(1,dt*6);p.ph+=p.spd*dt*Math.PI*2/(1.5*p.sc)}

// ---------- each frame, for someone in a room (townfolk.js tfRoomStep) ----------
// true when this has them (walking to or from the restroom): the room's own step then leaves them be
function acRoom(p,dt){if(p.trip){acTripStep(p,dt);return true}
  if(p.actT==null)acPick(p);if((p.actT-=dt)>0)return false;
  if(p.sit&&!p.spot.staff&&!(p.room&&p.room.home)&&Math.random()<TU.acRest&&acTrip(p))return true;
  acPick(p);return false}
// the clip for p now, given the plain one (townfolk.js tfFgClip): the activity in a room, carrying plates for a waiter;
// talking and listening as lines go
function acClip(p,k,c){const n=performance.now()/1000;
  if(p.tkSay>n)return p.sit&&c.clips.sit_chat?'sit_chat':'talk';
  if(p.tkHear>n)return p.sit?(c.clips.sit_listen?'sit_listen':'sit'):(c.clips.stand_listen?'stand_listen':'idle');
  if(k==='walk'&&p.room&&p.spot&&p.spot.path&&c.clips.carry_plate&&p.plate)return 'carry_plate';
  if(p.room&&p.act&&c.clips[p.act]&&(k==='sit'||k==='idle'||k==='talk'))return p.act;
  // standing together outdoors: their turn to listen now and then
  if(!p.room&&k==='idle'&&p.wait>0&&c.clips.stand_listen&&(p.lsn=(p.lsn??Math.random()))<0.5)return 'stand_listen';
  return k}
