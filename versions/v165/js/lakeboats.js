// Corley's Island: boats out on the lake. Two fishing boats run loops round the islands (low enough to pass under the
// bridges between their piers), two sailboats tack round open water where no bridge is overhead, and a tug pushes a barge
// heaped with spoil on its own loop, sounding its horn as it passes a dock. Each follows its route (LB_ROUTES) at its own
// speed and gives way: anything in its path (a boat you are driving or have left, another of them, a swimmer) slows it,
// swings it aside and, close in, stops it. They ride the swells and lay wakes like your boat (boats.js); they aren't saved,
// they start their loops afresh each visit.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// routes: corner points in metres, run round in order. The fishing loop crosses under the Lower Bench, Dexter's, the
// mainland and Jessica's bridges midway between piers; the others keep clear of every bridge (the masts and the tug's
// wheelhouse are too tall to pass under)
const LB_ROUTES={
  fishA:[[-118,120],[-118,362],[117,362],[117,120]],
  fishB:[[250,-90],[390,-40],[390,130],[260,80]],
  sailA:[[130,60],[330,30],[370,165],[180,150]],
  sailB:[[-130,380],[-340,360],[-360,500],[-150,500]],
  tug:[[-120,40],[-330,30],[-340,140],[-140,140]]};
// ---------- the models (waterline at y=0, bow toward +z) ----------
// a person sitting: hips at y, facing +z; arms forward (to a tiller or a rod)
function lbFigure(K,x,y,z,shirt,cap){K.box(0.34,0.48,0.22,shirt,x,y+0.3,z);K.box(0.2,0.22,0.2,0xc68a62,x,y+0.68,z);K.box(0.24,0.08,0.26,cap,x,y+0.82,z+0.03);
  K.box(0.32,0.14,0.42,0x34507a,x,y+0.05,z+0.18);for(const s of [-1,1])K.box(0.1,0.1,0.4,shirt,x+s*0.21,y+0.42,z+0.2)}
// a small aluminium fishing boat: the runabout's hull lines without the console, casting decks, an angler at the tiller
function lbFishModel(hull){const K=famKit();
  K.geo(btHullGeo(true),hull,0,0,0);K.geo(btHullGeo(false),0x9aa3a8,0,0,0);
  K.box(BT_B*0.84,0.04,BT_L*0.62,0x8b9196,0,0.12,-0.45);K.box(BT_B*0.7,0.08,1.3,0x5b6b48,0,0.45,1.5);K.box(BT_B*0.8,0.3,0.9,0x6f7a80,0,0.3,-2.0);
  K.box(0.3,0.36,0.3,0x2a2c2f,0,0.4,-0.6);K.box(0.42,0.08,0.42,0x384049,0,0.62,-0.6);
  K.box(0.38,0.46,0.5,0x2a2c2f,0,0.8,-BT_L/2-0.28);K.box(0.12,0.85,0.2,0x2a2c2f,0,0.05,-BT_L/2-0.32);K.cyl(0.03,0.03,0.7,6,0x8d9297,0.25,0.85,-BT_L/2+0.15,0,Math.PI/2.3);
  lbFigure(K,0.15,0.62,-BT_L/2+0.4,0x7a3b2a,0x2b4d6e);lbFigure(K,0,0.66,-0.6,0x3f6e4a,0xd8c49a);
  K.cyl(0.012,0.02,2.6,5,0x222222,0.6,1.75,0.4,0,-0.9,0.35);
  return lbGroup(K,0.85)}
// a sloop: a longer, slimmer hull, a cabin, the mast, the boom, and a mainsail and jib (both sides drawn)
function lbSail(K,pts,col){const g=new THREE.BufferGeometry(),p=pts.flat();g.setAttribute('position',new THREE.Float32BufferAttribute(p.concat([p[0],p[1],p[2],p[6],p[7],p[8],p[3],p[4],p[5]]),3));K.geo(g,col,0,0,0)}
function lbSailModel(hull){const K=famKit(),st=btHullGeo(true).scale(0.85,1,1.5),bt=btHullGeo(false).scale(0.85,1,1.5);
  K.geo(st,hull,0,0,0);K.geo(bt,0xe8e6e0,0,0,0);K.box(BT_B*0.72,0.05,BT_L*1.3,0xcdb48a,0,0.5,0);
  K.box(1.3,0.5,2.6,0xf1efe9,0,0.75,0.2);for(const s of [-1,1])K.box(0.02,0.14,1.6,0x2b3a44,s*0.66,0.85,0.25);
  K.box(0.18,0.8,0.12,0x8a6d4a,0,0.9,-3.2);K.cyl(0.07,0.09,9,8,0xc0c4c7,0,5,0.9);K.cyl(0.05,0.05,3.6,6,0xc0c4c7,0,1.65,-0.9,0,Math.PI/2);
  lbSail(K,[[0,1.75,0.85],[0,9.2,0.85],[0,1.75,-2.65]],0xf4f2ec);lbSail(K,[[0,8.2,0.95],[0,0.75,3.7],[0,1.0,1.1]],0xeeeae0);
  lbFigure(K,0,0.55,-2.6,0x2a4f7a,0xf2f2ee);
  return lbGroup(K,1)}
// a pusher tug with its wheelhouse up high, and ahead of it a flat-deck barge heaped with spoil
function lbTugModel(){const K=famKit(),RED=0x9e2a22,WH=0xeeeeea,RUST=0x5d5f5c;
  // the tug, its middle 6.6 m behind the group's
  const tz=-6.6;K.box(2.8,1.4,5.2,RED,0,0.05,tz);K.box(2.8,1.4,1.2,RED,0,0.25,tz-2.9,0,-0.5);K.box(2.9,0.18,6.4,0x2b2b2b,0,0.82,tz);
  K.box(2.1,1.0,2.6,WH,0,1.4,tz-0.6);K.box(1.8,1.2,1.6,WH,0,2.5,tz-0.2);for(const z of [0.62,-1.02])K.box(1.6,0.45,0.04,0x2b3a44,0,2.7,tz-0.2+z);
  for(const s of [-1,1])K.box(0.04,0.45,1.2,0x2b3a44,s*0.91,2.7,tz-0.2);K.box(2.0,0.1,1.8,0x55595c,0,3.15,tz-0.2);
  K.cyl(0.18,0.2,1.6,10,0x2b2b2b,0.7,2.4,tz-1.6);K.cyl(0.03,0.03,1.2,5,0xb8bcc0,0,3.8,tz-0.2);
  for(const s of [-1,1]){K.box(0.3,1.9,0.5,0x2b2b2b,s*0.9,0.9,tz+2.7);for(let z=-1.8;z<2.2;z+=1.2)K.cyl(0.22,0.22,0.36,10,0x1d1d1d,s*1.48,0.35,tz+z,0,0,Math.PI/2)}
  // the barge, its middle 3.6 m ahead: a deck with a low coaming, the spoil pile and a few loose lumps
  const bz=3.6;K.box(5.4,1.6,14,RUST,0,0.05,bz);K.box(5.4,1.0,1.6,RUST,0,0.35,bz+7.4,0,0.45);
  for(const s of [-1,1])K.box(0.15,0.35,13.6,0x7d5a43,s*2.6,1.0,bz);
  {const g=new THREE.SphereGeometry(1,14,6,0,Math.PI*2,0,Math.PI/2);g.scale(2.3,1.7,5.4);K.geo(g,0x6b4a2e,0,0.85,bz)}
  for(const [x,z] of [[1.6,bz-4.5],[-1.7,bz+3.2],[1.4,bz+5.1]]){const g=new THREE.SphereGeometry(0.45,7,4);g.scale(1,0.6,1);K.geo(g,0x5e4129,x,1.0,z)}
  return lbGroup(K,1)}
function lbGroup(K,sc){const g=new THREE.Group(),m=new THREE.Mesh(famMerge(K.solid),btMat);m.castShadow=true;m.receiveShadow=true;g.add(m);g.scale.setScalar(sc);scene.add(g);return g}
// kind, route, cruising speed m/s, turn rate rad/s, half length and half beam (what is in the way of others), how far
// out a wave rocks it (hr) and how hard (mass), how big a wake it lays (wakeK); eng: its engine for sound.js
const lakeBoats=[
  {kind:'fish',route:LB_ROUTES.fishA,spd:5,turn:0.35,hl:2.2,hb:0.9,hr:2.6,mass:1,wakeK:0.8,eng:1,g:lbFishModel(0x8e979c)},
  {kind:'fish',route:LB_ROUTES.fishB,spd:4.2,turn:0.35,hl:2.2,hb:0.9,hr:2.6,mass:1,wakeK:0.8,eng:1,g:lbFishModel(0x3d5a3a)},
  {kind:'sail',route:LB_ROUTES.sailA,spd:2.6,turn:0.18,hl:3.9,hb:0.9,hr:3.5,mass:1.6,wakeK:0.45,heel:0.14,g:lbSailModel(0x1f3a5f)},
  {kind:'sail',route:LB_ROUTES.sailB,spd:2.3,turn:0.18,hl:3.9,hb:0.9,hr:3.5,mass:1.6,wakeK:0.45,heel:-0.12,g:lbSailModel(0xf2f1ec)},
  {kind:'tug',route:LB_ROUTES.tug,spd:2.2,turn:0.1,hl:10,hb:2.8,hr:6,mass:5,wakeK:1.2,eng:2,g:lbTugModel()}];
// each starts at a corner of its route, facing the next
for(const b of lakeBoats){const [x,z]=b.route[0],[nx,nz]=b.route[1];Object.assign(b,{x,z,wp:1,yaw:Math.atan2(nx-x,nz-z),v:b.spd,y:WATER,pitch:0,roll:0,rk:0,rkv:0,hornT:0,hornQ:false})}
// every hull a wave can rock: your boats, then these (their order is the wake marks' owner index)
const BT_HULLS=boats.concat(lakeBoats);
for(const b of boats)b.hr=3;
function lakeBoatsTick(dt){
  for(let i=0;i<lakeBoats.length;i++){const b=lakeBoats[i],R=b.route;
    let [tx,tz]=R[b.wp];if(Math.hypot(tx-b.x,tz-b.z)<12){b.wp=(b.wp+1)%R.length;[tx,tz]=R[b.wp]}
    const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw);
    // give way: something within about 20 m ahead and a few metres either side slows it and swings it away from that side
    let slow=1,veer=0;const look=(x,z,r)=>{const dx=x-b.x,dz=z-b.z,f=dx*sy+dz*cy,l=dx*cy-dz*sy;
      if(f>0&&f<b.hl+24&&Math.abs(l)<b.hb+r+4){slow=Math.min(slow,ss(b.hl+r+2,b.hl+r+16,f));veer+=(l>=0?-1:1)*0.8*(1-ss(b.hl+4,b.hl+24,f))}};
    for(const o of boats)look(o.x,o.z,1.2);
    for(const o of lakeBoats)if(o!==b)look(o.x,o.z,o.hb);
    if(!wk.inside&&wk.y<WATER-0.3)look(wk.x,wk.z,0.5);
    let d=Math.atan2(tx-b.x,tz-b.z)+clamp(veer,-1.2,1.2)-b.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));
    b.yaw+=clamp(d,-b.turn*dt,b.turn*dt);
    const tv=b.spd*slow*(1-0.45*Math.min(1,Math.abs(d)));b.v+=(tv-b.v)*Math.min(1,dt*(tv<b.v?0.9:0.35));
    b.x+=Math.sin(b.yaw)*b.v*dt;b.z+=Math.cos(b.yaw)*b.v*dt;
    // afloat on the swells, rocked by passing wakes; the sails heel it
    const s2=Math.sin(b.yaw),c2=Math.cos(b.yaw),h=b.hl*0.8,wB=lakeY(b.x+s2*h,b.z+c2*h),wS=lakeY(b.x-s2*h,b.z-c2*h),wP=lakeY(b.x-c2*b.hb,b.z+s2*b.hb),wR=lakeY(b.x+c2*b.hb,b.z-s2*b.hb);
    const k=Math.min(1,dt*4);b.y+=((wB+wS)/2-b.y)*k;b.pitch+=(Math.atan2(wB-wS,2*h)-b.pitch)*k;b.roll+=((wR-wP)/(2*b.hb)*0.6/b.mass-b.roll)*k;
    btRock(b,dt);b.g.position.set(b.x,b.y,b.z);b.g.rotation.set(-b.pitch,b.yaw,b.roll+b.rk/b.mass+(b.heel||0),'YXZ');
    wakeEmit(b,dt,b.x-s2*b.hl,b.z-c2*b.hl,boats.length+i);
    // the tug sounds its horn passing a dock (sound.js plays it), not more than once a minute and a half
    if(b.kind==='tug'){b.hornT-=dt;if(b.hornT<=0&&BT_DOCKS.some(dk=>Math.hypot(dk.x1-b.x,dk.z1-b.z)<70)){b.hornQ=true;b.hornT=90}}}
  wakeTick(dt,BT_HULLS)}
