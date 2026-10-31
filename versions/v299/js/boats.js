// Corley's Island: boats. A wooden dock runs out from a beach on each island with a centre-console runabout tied up at
// its end, and one more lies at the town marina's pier. Walk up to one and Get in to drive it (Boat mode: left stick throttle and steering); run it up onto any beach
// and it slides to a stop on the sand, where you can climb out and leave it; reverse pushes it back off.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// The docks are walkable decks in BRIDGES (dock set: no railings, and the machines keep off them)
const BT_L=5.2,BT_B=2.1,BT_DRAFT=0.32,BT_DECK=WATER+0.9;
// the circles along the hull (metres along it from the middle) and their radius, for getting in (wkNear) and bumping
const BT_C=[-1.7,-0.6,0.5,1.6],BT_R=0.95;
// each island's dock: the island's middle and the way out to the beach it starts from; the boat's hull colour. The town's
// boat ties up on the open (west) side of the marina pier marina.js draws (dock: that pier's deck, at: metres back from
// its end, clear of the T-head, side: which side of it)
const BT_MAR_X=MAR.x,BT_MAR_Z=MAR.z0;
const BT_SPOTS=[
  {n:"Corley's",cx:0,cz:MZ,dx:-1,dz:0,hull:0xe8b923},
  {n:'Family',cx:FAM_X,cz:FAM_Z,dx:-0.6,dz:0.8,hull:0x1f3a5f},
  {n:"Jessica's",cx:JES_X,cz:JES_Z,dx:0,dz:1,hull:0xa8322a},
  {n:"Dexter's",cx:DEX_X,cz:DEX_Z,dx:0,dz:-1,hull:0x2f6b4a},
  {n:'Town',dock:{x0:BT_MAR_X,z0:BT_MAR_Z,x1:BT_MAR_X,z1:BT_MAR_Z-MAR.len,hw:1.5,y:MAR.y,drawn:1},at:9,side:-1,hull:0x6d7f8c}];
// out from the middle to where the beach is just under the deck, then on until the water is deep enough to moor in
function btDockPlan(s){if(s.dock){const d=s.dock,dx=d.x1-d.x0,dz=d.z1-d.z0,len=Math.hypot(dx,dz);
    const b=Object.assign({y1:d.y,dock:1,len,ux:dx/len,uz:dz/len},d);BRIDGES.push(b);return b}
  const at=t=>baseHeight(s.cx+s.dx*t,s.cz+s.dz*t);
  let t0=10;while(t0<300&&at(t0)>BT_DECK-0.15)t0+=0.25;
  let t1=t0+14;while(t1<t0+40&&at(t1)>WATER-1.5)t1+=1;
  const b={x0:s.cx+s.dx*t0,z0:s.cz+s.dz*t0,x1:s.cx+s.dx*t1,z1:s.cz+s.dz*t1,hw:1.2,y:BT_DECK,y1:BT_DECK,dock:1,len:t1-t0,ux:s.dx,uz:s.dz};
  BRIDGES.push(b);return b}
const BT_DOCKS=BT_SPOTS.map(btDockPlan);
// ---------- the docks: boards across two stringers on piles, pile tops standing proud as posts, cleats by the boat ----------
(function(){const K=famKit(),WOOD=[0x8d6b4b,0x80603f,0x97765a],PILE=0x5a4632;
  for(const b of BT_DOCKS){if(b.drawn)continue;const ry=Math.atan2(b.ux,b.uz),P=(t,u)=>[b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u];
    for(let t=0.1,n=0;t<b.len;t+=0.2,n++){const [x,z]=P(t,0);K.box(2*b.hw,0.05,0.17,WOOD[n%3],x,b.y-0.025,z,ry)}
    for(const u of [-b.hw+0.25,b.hw-0.25]){const [x,z]=P(b.len/2,u);K.box(0.1,0.22,b.len,0x5f4a35,x,b.y-0.16,z,ry)}
    for(let t=0.5;t<=b.len;t+=3){const tt=Math.min(t,b.len-0.15);for(const u of [-b.hw-0.06,b.hw+0.06]){const [x,z]=P(tt,u),g=baseHeight(x,z)-0.6,top=b.y+0.45;
      K.cyl(0.13,0.14,top-g,9,PILE,x,(top+g)/2,z)}}
    for(const t of [b.len-5,b.len-1.4]){const [x,z]=P(t,b.hw-0.15);K.box(0.32,0.08,0.09,0x2b2d2f,x,b.y+0.06,z,ry)}}
  famAdd(K)})();
// ---------- the runabout: a deep-V hull lofted from stations, a centre console with a windscreen, seats, an outboard ----------
// half beam, gunwale height and keel depth at t along the hull (0 the transom, 1 the stem), metres from the waterline
function btSection(t){const w=t<0.55?BT_B/2*(0.93+0.07*t/0.55):BT_B/2*Math.sqrt(Math.max(0,1-((t-0.55)/0.45)**2));
  return {w,top:0.52+0.2*ss(0.55,1,t),keel:-BT_DRAFT-0.02+0.42*ss(0.7,1,t)**2,chine:-0.14+0.12*ss(0.6,1,t)}}
// the topsides (sides: the strips from chine to gunwale, and the transom) or the bottom (keel to chines)
function btHullGeo(sides){const NS=18,pts=[],ix=[];
  for(let i=0;i<=NS;i++){const t=i/NS,s=btSection(t),z=-BT_L/2+t*BT_L,w=Math.max(s.w,0.002);
    for(const [x,y] of [[-w,s.top],[-w*0.88,s.chine],[0,s.keel],[w*0.88,s.chine],[w,s.top]])pts.push(x,y,z)}
  for(let i=0;i<NS;i++)for(const k of sides?[0,3]:[1,2]){const a=i*5+k,b=a+5;ix.push(a,b,a+1,a+1,b,b+1)}
  if(sides)ix.push(0,1,4,1,3,4,1,2,3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(ix);return g}
const btGlass=new THREE.MeshPhongMaterial({color:0xb9d4dc,transparent:true,opacity:0.3,shininess:90,depthWrite:false});
function btModel(hull){const g=new THREE.Group(),K=famKit();
  // painted topsides over a white bottom, a dark rub rail along the gunwale
  K.geo(btHullGeo(true),hull,0,0,0);K.geo(btHullGeo(false),0xeae8e2,0,0,0);
  for(let i=0;i<12;i++){const t0=i/12,t1=(i+1)/12,s0=btSection(t0),s1=btSection(t1),z0=-BT_L/2+t0*BT_L,z1=-BT_L/2+t1*BT_L,len=Math.hypot(s1.w-s0.w,z1-z0),a=Math.atan2(s1.w-s0.w,z1-z0);
    for(const sd of [-1,1])K.box(0.05,0.06,len+0.02,0x2a2b2d,sd*(s0.w+s1.w)/2,(s0.top+s1.top)/2,(z0+z1)/2,sd*a)}
  // the cockpit sole and the bow deck
  K.box(BT_B*0.84,0.04,BT_L*0.62,0xd9d6cf,0,0.12,-0.45);K.box(BT_B*0.62,0.06,1.1,0xeeede8,0,0.5,1.75);
  // centre console, its dash and wheel, the leaning post behind it, a bench at the stern and a cushion on the bow
  K.box(0.78,0.82,0.62,0xf4f3ef,0,0.55,0.35);K.box(0.7,0.06,0.32,0x2e3033,0,0.98,0.48,0,-0.5);
  K.box(0.7,0.55,0.4,0xd2d0ca,0,0.42,-0.45);K.box(0.74,0.12,0.44,0x384049,0,0.74,-0.45);K.box(0.74,0.4,0.08,0x384049,0,0.96,-0.66);
  K.box(BT_B*0.82,0.36,0.5,0xe7e5df,0,0.3,-2.25);K.box(BT_B*0.82,0.08,0.52,0x384049,0,0.52,-2.25);
  K.box(BT_B*0.5,0.08,0.7,0x384049,0,0.57,1.6);
  // the outboard on the transom: cowling, leg, cavitation plate, propeller
  K.box(0.46,0.52,0.6,0x1b1c1e,0,0.86,-BT_L/2-0.32);K.box(0.42,0.12,0.56,0x6c7176,0,0.56,-BT_L/2-0.3);
  K.box(0.13,0.9,0.22,0x2a2c2f,0,0.05,-BT_L/2-0.36);K.box(0.32,0.03,0.42,0x2a2c2f,0,-0.3,-BT_L/2-0.33);
  K.cyl(0.07,0.07,0.16,10,0x3a3d40,0,-0.48,-BT_L/2-0.38,0,Math.PI/2);
  for(let k=0;k<3;k++)K.box(0.02,0.24,0.08,0x8d9297,0,-0.48,-BT_L/2-0.48,0,0,k*2.094);
  // bow and stern cleats, navigation lights
  for(const z of [2.35,-2.45])K.box(0.2,0.05,0.06,0xb8bcc0,0,z>0?0.66:0.58,z);
  K.box(0.1,0.06,0.06,0xd12a2a,0.3,0.7,2.2);K.box(0.1,0.06,0.06,0x1fa34a,-0.3,0.7,2.2);
  const m=famGelMesh(K.solid);m.castShadow=true;m.receiveShadow=true;g.add(m);
  // the windscreen, wrapped round the front of the console
  const ws=new THREE.Mesh(new THREE.BoxGeometry(0.82,0.32,0.02),btGlass);ws.position.set(0,1.12,0.66);ws.rotation.x=-0.45;g.add(ws);
  scene.add(g);return g}
// boats: where each is, its speed (m/s along the bow), how it sits (y, pitch, roll) and its model
const boats=BT_SPOTS.map((s,i)=>{const d=BT_DOCKS[i],t=d.len-(s.at||3.4),u=(s.side||1)*(d.hw+BT_B/2+0.12);
  const home={x:d.x0+d.ux*t-d.uz*u,z:d.z0+d.uz*t+d.ux*u,yaw:Math.atan2(d.ux,d.uz)};
  return {n:s.n,home,x:home.x,z:home.z,yaw:home.yaw,v:0,y:WATER,pitch:0,roll:0,g:btModel(s.hull)}});
// the detailed model (models.js, tools/models/boat.js): each boat's topsides in its own hull colour (glossy gelcoat, MDL_GEL), the windscreen see-through
const btScreen=new THREE.MeshStandardMaterial({color:0xcfe3ea,transparent:true,opacity:0.28,roughness:0.05,metalness:0,envMap:skyEnv,depthWrite:false});
MDL_KIT.boat={sets:()=>boats.map(b=>({body:b.g})),after(on){if(!on)return;const hull=mdlMatOf('gel#e8b923'),scr=mdlMatOf('glass#b9d4dc');
  boats.forEach((b,i)=>{for(const m of b.g.children){if(!m.name.startsWith('mdl_'))continue;
    if(m.material===hull)m.material=mdlMatOf('gel#'+BT_SPOTS[i].hull.toString(16).padStart(6,'0'));else if(m.material===scr){m.material=btScreen;m.castShadow=false}}})}};
let btI=0;
const btCur=()=>boats[btI];
// the walker climbs in at any of them (walker.js): the boats join WK_RIDES as boat0, boat1…
// at the helm (simple shapes; the detailed model has its own): the wheel on its tilted shaft, turning as you steer
// (boatTick), and the throttle and shift lever on the starboard side of the console
boats.forEach(b=>{ctlWheel(b,b.g,0,1.0,0.22,0.67,0.17,2.2);
  ctlGroup(b.g,k=>{k.box(0.08,0.14,0.14,CTL_DARK,-0.43,0.82,0.3);k.cyl(0.012,0.012,0.18,6,0xb8bcc0,-0.47,0.9,0.3,0.5);k.cyl(0.025,0.025,0.08,8,CTL_RUB,-0.47,0.98,0.26,0,Math.PI/2)})});
boats.forEach((b,i)=>{WK_RIDES['boat'+i]={o:b,c:BT_C,r:BT_R,reach:0.8,m:'boat',n:'boat',pick(){btI=i},out:()=>btOut(b)}});
// climbing out: onto the dock or the sand beside it if there is one (dry ground first, then shallow water), else into the lake
function btOut(b){const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw),gap=BT_B/2+WK_R+0.3,len=BT_L/2+0.5;
  const spots=[[gap,0],[-gap,0],[0,len],[gap,1.2],[-gap,1.2],[gap,-1.2],[-gap,-1.2],[0,-len-0.4]].map(([sx,sz])=>{const x=b.x+cy*sx+sy*sz,z=b.z-sy*sx+cy*sz;return {x,z,f:wkFloor(x,z,0,1e9)}});
  const free=p=>!SOLIDS.some(s=>solidOut(s,p.x,p.z,WK_R))&&!boats.some(o=>o!==b&&Math.hypot(o.x-p.x,o.z-p.z)<BT_L/2+0.4);
  const p=spots.find(p=>p.f>=WATER+0.15&&free(p))||spots.find(p=>p.f>=WATER-1&&free(p))||spots[0];
  Object.assign(wk,{x:p.x,z:p.z,y:Math.max(p.f,Math.min(b.y,WATER-WK_FLOAT)),vy:0,ground:p.f>=WATER-1,swim:false,yaw:b.yaw,airT:0});return true}
// what is in the way on the water this frame: the fixed piers and hulls, each trestle span's bents as it stands (timber
// or steel), and the crane's barge, a line down its length
const btWallList=[];
function btWalls(){btWallList.length=0;for(const w of BOAT_WALLS)btWallList.push(w);
  for(const s of crnSpans)for(const w of s.st.visible?s.stW:s.trW)btWallList.push(w);
  // the boats out on the lake (lakeboats.js), a line down each hull
  for(const o of lakeBoats){const sy=Math.sin(o.yaw)*o.hl,cy=Math.cos(o.yaw)*o.hl;btWallList.push({ax:o.x-sy,az:o.z-cy,bx:o.x+sy,bz:o.z+cy,r:o.hb})}
  const p=crnBarge.position,y=crnBarge.rotation.y,sy=Math.sin(y)*13,cy=Math.cos(y)*13;btWallList.push({ax:p.x-sy,az:p.z-cy,bx:p.x+sy,bz:p.z+cy,r:6.2});
  return btWallList}
// the ground under a hull, not counting decks (it runs under the docks and bridges, not onto them)
function btGround(x,z){return farGround?farGround(x,z):baseHeight(x,z)}
// thr: throttle (+ ahead), steer (+ right). Idle boats bob where they are left
function boatTick(dt,thr,steer){
  for(let i=0;i<boats.length;i++){const b=boats[i],drive=mode==='boat'&&btI===i&&wk.inside==='boat'+i&&!bench.on,th=drive?thr:0,sr=drive?steer:0;b.thr=th;b.swS=(b.swS||0)+(sr-(b.swS||0))*Math.min(1,dt*4);if(b.swG)b.swG.rotation.z=b.swS*b.swK;
    const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw),h=BT_L/2-0.4;
    const bx=b.x+sy*h,bz=b.z+cy*h,sx=b.x-sy*h,sz=b.z-cy*h,wB=lakeY(bx,bz),wS=lakeY(sx,sz),gB=btGround(bx,bz),gS=btGround(sx,sz),gM=btGround(b.x,b.z);
    // how much of the hull sits on the bottom (a beach): there it only creeps, as if shoved along, and comes to a stop a
    // few feet up the sand; it won't climb the rocks or the bank behind the beach. Reverse pushes it back off
    const sand=ss(-0.05,0.3,Math.max(gB,gM)+BT_DRAFT-(wB+wS)/2),onSand=ss(0,0.25,sand),cap=TU.btSpeed+(1.3-TU.btSpeed)*onSand;
    const want=(th>=0?th:th*0.35)*TU.btSpeed;b.v+=(want-b.v)*Math.min(1,dt*(Math.abs(want)>Math.abs(b.v)?0.55:0.35+4*onSand));
    if(Math.abs(b.v)>cap)b.v=Math.sign(b.v)*(cap+(Math.abs(b.v)-cap)*Math.exp(-dt*6));
    if(b.v>0&&gB>wB+0.55)b.v=0;if(b.v<0&&gS>wS+0.55)b.v=0;
    if(Math.abs(b.v)>0.02)b.yaw-=sr*TU.btTurn*Math.min(1,Math.abs(b.v)/2.5)*Math.sign(b.v)*(1-0.85*sand)*dt;
    b.x+=Math.sin(b.yaw)*b.v*dt;b.z+=Math.cos(b.yaw)*b.v*dt;
    b.x=clamp(b.x,-WK_BOUND.x,WK_BOUND.x);b.z=clamp(b.z,WK_BOUND.z0,WK_BOUND.z1);
    // the docks, piers and pile bents, the crane's barge and the other boats are in the way: push the hull's circles out
    let hit=false;const s2=Math.sin(b.yaw),c2=Math.cos(b.yaw),walls=btWalls();
    for(const lz of BT_C){let px=b.x+s2*lz,pz=b.z+c2*lz;
      for(const w of walls){if(Math.abs(px-w.ax)>60&&Math.abs(px-w.bx)>60||Math.abs(pz-w.az)>60&&Math.abs(pz-w.bz)>60)continue;
        const ex=w.bx-w.ax,ez=w.bz-w.az,f=clamp(((px-w.ax)*ex+(pz-w.az)*ez)/(ex*ex+ez*ez||1),0,1),dx=px-w.ax-ex*f,dz=pz-w.az-ez*f,dd=Math.hypot(dx,dz),m=w.r+BT_R;
        if(dd<m&&dd>1e-4){const k=(m-dd)/dd;b.x+=dx*k;b.z+=dz*k;px+=dx*k;pz+=dz*k;hit=true}}
      for(const d of BRIDGES){if(!d.dock)continue;const [t,u]=deckLocal(d,px,pz);if(t<-BT_R||t>d.len+BT_R||Math.abs(u)>=d.hw+BT_R)continue;
        if(t>0){const push=Math.sign(u||1)*(d.hw+BT_R)-u;b.x-=d.uz*push;b.z+=d.ux*push;px-=d.uz*push;pz+=d.ux*push;hit=true}}
      for(const o of boats){if(o===b)continue;for(const lo of BT_C){const qx=o.x+Math.sin(o.yaw)*lo,qz=o.z+Math.cos(o.yaw)*lo,dx=px-qx,dz=pz-qz,dd=Math.hypot(dx,dz),m=BT_R*2;
        if(dd<m&&dd>1e-4){b.x+=dx/dd*(m-dd)*0.5;b.z+=dz/dd*(m-dd)*0.5;hit=true}}}}
    if(hit)b.v*=Math.exp(-dt*4);
    // how it sits: afloat on the swells, or with its keel on the sand; bow lifts when it is going fast, leans into turns
    const yB=Math.max(wB,gB+BT_DRAFT),yS=Math.max(wS,gS+BT_DRAFT),wP=lakeY(b.x-cy*BT_B/2,b.z+sy*BT_B/2),wR=lakeY(b.x+cy*BT_B/2,b.z-sy*BT_B/2),plane=ss(2,7,b.v)*(1-sand);
    const ty=(yB+yS)/2+0.06*plane,tp=Math.atan2(yB-yS,2*h)+0.09*plane-0.05*ss(7,14,b.v)*(1-sand),tr=(wR-wP)/BT_B*0.7*(1-sand)+sr*0.12*ss(1,8,b.v);
    const k=Math.min(1,dt*5);b.y+=(ty-b.y)*k;b.pitch+=(tp-b.pitch)*k;b.roll+=(tr-b.roll)*k;btRock(b,dt);
    b.g.position.set(b.x,b.y,b.z);b.g.rotation.set(-b.pitch,b.yaw,b.roll+b.rk*(1-sand),'YXZ');
    // its wake (wakeEmit), and spray off the bow at speed
    if(sand<0.5)wakeEmit(b,dt,sx-sy*0.3,sz-cy*0.3,i);
    if(Math.abs(b.v)>1&&sand<0.5){const r=dt*Math.min(6,Math.abs(b.v));
      if(b.v>4&&Math.random()<r*1.5)for(const sd of [-1,1]){const a=Math.random()*0.4;spDrop(bx-sy*0.6+sd*cy*0.6,wB+0.05,bz-cy*0.6-sd*sy*0.6,sd*cy*(1.2+a)-sy*0.5,1+Math.random()*1.2,-sd*sy*(1.2+a)-cy*0.5,0.04+Math.random()*0.04)}}
  }
  // the worker at the helm: seated behind the console, hands on the wheel
  const R=WK_RIDES[wk.inside];if(R&&R.m==='boat'){const b=R.o;b.g.updateMatrixWorld();b.g.localToWorld(btV.set(0,0,-0.47));
    Object.assign(wk,{x:b.x,z:b.z,y:b.y,yaw:b.yaw});walker.position.copy(btV);walker.rotation.set(-b.pitch,b.yaw,b.roll,'YXZ');
    walker.visible=!(mode==='boat'&&camMode==='cab');wkBody.position.y=0;wkBody.rotation.x=0;wkHead.rotation.x=0;
    for(let s=0;s<2;s++){wkLegs[s].top.rotation.x=-1.45;wkLegs[s].low.rotation.x=1.4;wkArms[s].top.rotation.x=-0.9;wkArms[s].low.rotation.x=-0.5}}
  else if(walker.rotation.x||walker.rotation.z)walker.rotation.set(0,walker.rotation.y,0,'XYZ')}
const btV=new THREE.Vector3();
// a hull rocked by a passing wave: a damped swing about its keel, added to its roll (rk, rkv)
function btRock(b,dt){const rk=b.rk||0,rv=b.rkv||0;b.rkv=rv+(-rk*9-rv*1.4)*dt;b.rk=rk+b.rkv*dt}
// ---------- wakes ----------
// a moving boat lays down wake marks every eighth of a second: a pair off the stern that drift out sideways at about a
// third of its speed while it runs on, which spreads them into a V about 19° each side (as a real Kelvin wake is), and a
// churned trail behind the propeller. They fade over several seconds; a wave that reaches another hull rocks it (btRock),
// and one that runs into shallow water breaks in a ring of foam. What the marks do is the same on every device; the
// Graphics setting picks how many of the newest are drawn (wakeN, gfx.js)
const WAKE_MAX=640,wkX=new Float32Array(WAKE_MAX),wkZ=new Float32Array(WAKE_MAX),wkVX=new Float32Array(WAKE_MAX),wkVZ=new Float32Array(WAKE_MAX),
  wkYaw=new Float32Array(WAKE_MAX),wkAge=new Float32Array(WAKE_MAX).fill(99),wkLife=new Float32Array(WAKE_MAX).fill(1),wkK=new Float32Array(WAKE_MAX),
  wkTrail=new Uint8Array(WAKE_MAX),wkOwn=new Int16Array(WAKE_MAX),wkHit=new Uint32Array(WAKE_MAX);
let wakeHead=0,wakeDraw=260,wakeFrame=0;
// b: the boat (x, z, yaw, v; its own clock in wakeT), sx, sz: its stern, own: who laid it (a hull its own wake doesn't rock)
function wakeEmit(b,dt,sx,sz,own){const sp=Math.abs(b.v);if(sp<0.8){b.wakeT=0;return}
  b.wakeT=(b.wakeT||0)+dt;if(b.wakeT<0.125)return;b.wakeT=0;
  const k=ss(0.8,7,sp)*(b.wakeK||1),px=Math.cos(b.yaw),pz=-Math.sin(b.yaw),out=sp*0.34,back=b.yaw+Math.PI;
  for(const sd of [-1,1,0]){const i=wakeHead;wakeHead=(wakeHead+1)%WAKE_MAX;
    wkX[i]=sx+px*sd*0.6;wkZ[i]=sz+pz*sd*0.6;wkVX[i]=px*sd*out;wkVZ[i]=pz*sd*out;wkYaw[i]=back-sd*0.33*Math.sign(b.v);
    wkAge[i]=0;wkLife[i]=sd?6+3*k:3.5;wkK[i]=sd?k:k*0.8;wkTrail[i]=sd?0:1;wkOwn[i]=own;wkHit[i]=0}}
// a wake mark: churned foam in lace, thickest down its middle and fading out at the edges (alpha only; the foam is lit
// like the water round it, so it greys at dusk and is gone at night)
const wakeTex=(()=>{const W=128,H=64,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.strokeStyle='#fff';g.fillStyle='#fff';
  for(let n=0;n<520;n++){const x=Math.random()*W,y=H/2+(Math.random()+Math.random()+Math.random()-1.5)*H*0.42,r=0.6+Math.random()*Math.random()*4;
    g.globalAlpha=0.35+Math.random()*0.6;g.lineWidth=0.5+Math.random()*1.2;g.beginPath();g.ellipse(x,y,r*1.6,r,0,0,7);if(Math.random()<0.3)g.fill();else g.stroke()}
  g.globalAlpha=1;g.globalCompositeOperation='destination-in';const r=g.createRadialGradient(W/2,W/2,2,W/2,W/2,W/2);
  r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.5,'rgba(255,255,255,0.55)');r.addColorStop(1,'rgba(255,255,255,0)');
  g.setTransform(1,0,0,H/W,0,0);g.fillStyle=r;g.fillRect(0,0,W,W);
  return new THREE.CanvasTexture(c)})();
// how strong each mark is rides in its instance colour's red, read as alpha
const wakeMat=new THREE.MeshStandardMaterial({color:0xe9efee,roughness:0.85,metalness:0,alphaMap:wakeTex,transparent:true,depthWrite:false});
wakeMat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n#ifdef USE_COLOR\ndiffuseColor.a*=vColor.r;diffuseColor.rgb=diffuse;\n#endif')};
const wakeMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),wakeMat,WAKE_MAX);
wakeMesh.frustumCulled=false;wakeMesh.count=0;wakeMesh.renderOrder=2;scene.add(wakeMesh);
const wakeO=new THREE.Object3D(),wakeC=new THREE.Color();
function wakeGfx(n){wakeDraw=Math.min(WAKE_MAX,n|0)}
wakeGfx(gfxCur.wakeN??260);
// hulls: the boats the waves can rock, each {x, z, rk, rkv}, and its own index for wkOwn
function wakeTick(dt,hulls){wakeFrame++;let n=0;
  for(let j=0;j<WAKE_MAX;j++){const i=(wakeHead-1-j+WAKE_MAX*2)%WAKE_MAX;if(wkAge[i]>=wkLife[i])continue;
    wkAge[i]+=dt;const a=wkAge[i],f=a/wkLife[i];if(f>=1)continue;
    const dmp=Math.exp(-dt*0.25);wkVX[i]*=dmp;wkVZ[i]*=dmp;wkX[i]+=wkVX[i]*dt;wkZ[i]+=wkVZ[i]*dt;
    // shallow water breaks it (a quarter of the marks checked each frame)
    if((i&3)===(wakeFrame&3)&&btGround(wkX[i],wkZ[i])>WATER-0.35){if(!wkTrail[i]&&wkK[i]>0.3&&Math.random()<0.5)spRing(wkX[i],lakeY(wkX[i],wkZ[i]),wkZ[i],0.8+wkK[i]);wkAge[i]=wkLife[i];continue}
    // a wave front reaching a hull rocks it, once
    if(!wkTrail[i])for(let h=0;h<hulls.length;h++){const o=hulls[h];if(h===wkOwn[i]&&a<2.5)continue;if(wkHit[i]&(1<<h))continue;
      const dx=wkX[i]-o.x,dz=wkZ[i]-o.z;if(dx*dx+dz*dz<(o.hr||3)*(o.hr||3)){wkHit[i]|=1<<h;o.rkv=(o.rkv||0)+wkK[i]*(1-f)*0.55*(Math.random()<0.5?-1:1)}}
    if(n>=wakeDraw)continue;
    const k=wkK[i]*(1-f)*(1-f)*Math.min(1,a*4),len=wkTrail[i]?3+3.5*f:2.6+4*f,wid=wkTrail[i]?1.3+2.2*f:0.7+1.4*f;
    wakeO.position.set(wkX[i],lakeY(wkX[i],wkZ[i])+0.05,wkZ[i]);wakeO.rotation.set(0,wkYaw[i],0);wakeO.scale.set(wid,1,len);wakeO.updateMatrix();
    wakeMesh.setMatrixAt(n,wakeO.matrix);wakeMesh.setColorAt(n,wakeC.setScalar(k*(wkTrail[i]?0.75:1)));n++}
  wakeMesh.count=n;if(n){wakeMesh.instanceMatrix.needsUpdate=true;if(wakeMesh.instanceColor)wakeMesh.instanceColor.needsUpdate=true}}
