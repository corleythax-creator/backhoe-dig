// Corley's Island: the town marina, on the lakeshore east of Main Street (mainland.js has the town itself). A timber
// pier on piles runs about 200 ft out from the beach to a T-head fuel dock, with a gangway down from the boardwalk,
// lamps, life rings and cleats; four finger piers off its east side hold the moored boats (cabin cruisers, a pontoon,
// a bowrider, a sloop, a centre console, a fishing boat), each riding the swells at its lines (marinaTick); a rubble
// breakwater curls round the basin from the shore to a little lighthouse at its tip, whose beam turns after dark. Ashore:
// the Harbor House (the marina office with its bait and tackle shop, porch and cupola), the Dockside Grill with its
// deck, umbrellas and string lights, an ice cream stand, a boat ramp, a dry-stack boat rack and the marina's car park.
// Mooring balls and channel buoys lie off the pier, with a sloop out on one of them.
// The decks walk (BRIDGES, dock set), the boats and the breakwater are walls to a boat you drive (BOAT_WALLS), and the
// buildings are solid (SOLIDS). Everything is built at load from the ground as it is (baseHeight), like the town.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// the pier: its foot x, where it starts (2 m out from the bank's rim), its deck height and length; the finger piers
// (metres out along the pier, each MAR.fl long off its east side), the boat ramp's middle x
const MAR={x:72,z0:mainRimS(72)+2,y:WATER+1.2,len:60,fingers:[25,34,43,52],fl:10,fhw:0.7,ramp:107,boats:[],buoys:[],beam:null};
// the pier itself is the Town dock in boats.js (BT_SPOTS); the gangway down from the boardwalk, the fingers and the T-head here
BRIDGES.push({x0:MAR.x,z0:MAR.z0+1.5,x1:MAR.x,z1:MAR.z0-8.3,hw:0.75,y:WATER+3.75,y1:MAR.y,dock:1,drawn:1});
for(const t of MAR.fingers)BRIDGES.push({x0:MAR.x+1.5,z0:MAR.z0-t,x1:MAR.x+1.5+MAR.fl,z1:MAR.z0-t,hw:MAR.fhw,y:MAR.y-0.01,y1:MAR.y-0.01,dock:1,drawn:1});
BRIDGES.push({x0:MAR.x-9,z0:MAR.z0-MAR.len+1.6,x1:MAR.x+9,z1:MAR.z0-MAR.len+1.6,hw:1.8,y:MAR.y-0.005,y1:MAR.y-0.005,dock:1,drawn:1});
for(const b of BRIDGES.slice(-6)){const dx=b.x1-b.x0,dz=b.z1-b.z0;b.len=Math.hypot(dx,dz);b.ux=dx/b.len;b.uz=dz/b.len}
// the breakwater's crest line, from the beach out and round to the lighthouse at its tip
const MAR_BW=[[126,552],[126,522],[123.5,502],[116,490],[105,484.5],[94,483]];
for(let i=0;i<MAR_BW.length-1;i++){const [ax,az]=MAR_BW[i],[bx,bz]=MAR_BW[i+1];BOAT_WALLS.push({ax,az,bx,bz,r:4.6})}

// ---------- boats: a hull lofted from stations (bow +z, waterline y=0), and the kinds that lie in the slips ----------
// t 0 at the transom to 1 at the stem: half-beam, sheer, chine and keel heights
function marSec(t,B,D,dr){return {w:B/2*(t<0.5?0.93+0.07*t/0.5:Math.sqrt(Math.max(0,1-Math.pow((t-0.5)/0.5,2.2)))),
  top:D*(0.82+0.36*t*t),chine:-0.04+0.32*t*t*t,keel:-dr*(1-0.35*t)+0.5*Math.pow(t,4)*dr*2.2}}
// topsides (and the transom) or the bottom, as one geometry
function marHull(L,B,D,dr,sides){const NS=18,pts=[],ix=[];
  for(let i=0;i<=NS;i++){const t=i/NS,s=marSec(t,B,D,dr),z=-L/2+t*L,w=Math.max(s.w,0.003);
    for(const [x,y] of [[-w,s.top],[-w*0.9,s.chine],[0,s.keel],[w*0.9,s.chine],[w,s.top]])pts.push(x,y,z)}
  for(let i=0;i<NS;i++)for(const k of sides?[0,3]:[1,2]){const a=i*5+k,b=a+5;ix.push(a,b,a+1,a+1,b,b+1)}
  if(sides)ix.push(0,1,4,1,3,4);else ix.push(1,2,3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(ix);return g}
// the deck inside the hull, h below the sheer, from t0 to t1
function marDeck(L,B,D,h,t0,t1){const NS=12,pts=[],ix=[];
  for(let i=0;i<=NS;i++){const t=t0+(t1-t0)*i/NS,s=marSec(t,B,D,0),z=-L/2+t*L,w=Math.max(s.w*0.96,0.003);pts.push(-w,s.top-h,z,w,s.top-h,z)}
  for(let i=0;i<NS;i++){const a=i*2;ix.push(a,a+2,a+1,a+1,a+2,a+3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(ix);return g}
// a hull with its bottom paint, a rub rail along the sheer and a boot stripe at the waterline
function marHullKit(K,L,B,D,dr,col,bot,rail){K.geo(marHull(L,B,D,dr,true),col,0,0,0);K.geo(marHull(L,B,D,dr,false),bot,0,0,0);
  for(let i=0;i<14;i++){const t0=i/14,t1=(i+1)/14,s0=marSec(t0,B,D,dr),s1=marSec(t1,B,D,dr),z0=-L/2+t0*L,z1=-L/2+t1*L,len=Math.hypot(s1.w-s0.w,z1-z0),a=Math.atan2(s1.w-s0.w,z1-z0);
    for(const sd of [-1,1]){K.box(0.07,0.08,len+0.03,rail,sd*(s0.w+s1.w)/2,(s0.top+s1.top)/2-0.02,(z0+z1)/2,sd*a);
      if(t1<0.8)K.box(0.03,0.1,len+0.03,rail,sd*(s0.w+s1.w)/2*0.99,0.12,(z0+z1)/2,sd*a)}}}
// a stainless rail along the deck edge from t0 to t1, on stanchions, h high
function marRail(K,L,B,D,t0,t1,h,col){let p=null;for(let i=0;i<=6;i++){const t=t0+(t1-t0)*i/6,s=marSec(t,B,D,0),z=-L/2+t*L,w=s.w*0.9;
  for(const sd of [-1,1]){K.cyl(0.015,0.015,h,4,col,sd*w,s.top+h/2,z);if(p){const [px,py,pz]=p[sd<0?0:1];mainRod(K,[px,py,pz],[sd*w,s.top+h,z],0.016,col,4)}}
  p=[[-w,s.top+h,z],[w,s.top+h,z]]}}
const MAR_SS=0xd4d8db,MAR_CAN=0x1f3a5f,MAR_CREAM=0xe8e0cc,MAR_GLASS=0x26343d,MAR_TEAK=0xa47a4f;
// fenders hanging over the side sd (-1 port, +1 starboard), at stations ts
function marFenders(K,L,B,D,sd,ts){for(const t of ts){const s=marSec(t,B,D,0);K.cyl(0.11,0.11,0.55,8,0xf2f1ec,sd*(s.w+0.12),0.35,-L/2+t*L)}}
const MAR_KIND={
  // a flybridge cabin cruiser: cabin with its windows and raked windscreen, the flybridge and its bimini, a swim platform
  cruiser:(K,o)=>{const L=o.L,B=o.B,D=1.15;marHullKit(K,L,B,D,0.55,0xf4f3ef,o.bot,o.trim);
    K.geo(marDeck(L,B,D,0.25,0.02,0.97),0xe4e1d8,0,0,0);K.box(B*0.92,0.07,0.8,MAR_TEAK,0,0.3,-L/2-0.38);
    const cz=L*0.08,cl=L*0.42,cw=B*0.74,cy=D*0.95;K.box(cw,1.0,cl,0xf4f3ef,0,cy+0.4,cz);for(const sd of [-1,1])K.box(0.03,0.32,cl*0.8,MAR_GLASS,sd*(cw/2+0.01),cy+0.55,cz);
    K.box(cw*0.96,0.08,0.9,MAR_GLASS,0,cy+0.62,cz+cl/2+0.28,0,-0.75);K.box(cw*1.02,0.08,cl+0.9,0xf4f3ef,0,cy+0.93,cz+0.3);
    K.box(cw*0.9,0.5,1.5,0xf4f3ef,0,cy+1.2,cz-cl/2+1.0);K.box(cw*0.7,0.35,0.5,MAR_CREAM,0,cy+1.6,cz-cl/2+0.6);K.box(0.7,0.4,0.4,0x2a2c2f,0,cy+1.7,cz-cl/2+1.4);
    for(const sd of [-1,1])for(const z of [cz-cl/2+0.2,cz-cl/2+2.0])K.cyl(0.02,0.02,1.2,4,MAR_SS,sd*cw*0.46,cy+2.0,z);K.box(cw*0.98,0.05,2.1,o.canvas,0,cy+2.6,cz-cl/2+1.1);
    K.box(B*0.8,0.45,0.6,MAR_CREAM,0,D*0.85,-L/2+1.0);K.box(0.04,0.04,0.1,0x2a2c2f,0,cy+2.7,cz-cl/2+1.1);marRail(K,L,B,D,0.62,0.97,0.6,MAR_SS);
    marFenders(K,L,B,D,o.fs,[0.3,0.55,0.75])},
  // a pontoon boat: twin tubes, a carpeted deck, rail fences with a coloured band, lounge seats and a bimini top
  pontoon:(K,o)=>{const L=o.L,B=o.B;for(const sd of [-1,1]){K.cyl(0.32,0.32,L-0.8,12,0xc7ccd0,sd*0.82,0.05,-0.3,0,Math.PI/2);K.cyl(0.32,0.02,0.9,12,0xc7ccd0,sd*0.82,0.05,L/2-0.3,0,Math.PI/2)}
    K.box(B,0.1,L-0.4,0x5d6366,0,0.45,-0.1);for(const sd of [-1,1]){K.box(0.05,0.75,L-1.6,0xc9cdd0,sd*(B/2-0.03),0.88,-0.6);K.box(0.055,0.2,L-1.65,o.trim,sd*(B/2-0.02),0.8,-0.6)}
    K.box(B,0.75,0.05,0xc9cdd0,0,0.88,-L/2+0.18);for(const sd of [-1,1])K.box(B*0.3,0.75,0.05,0xc9cdd0,sd*B*0.35,0.88,L/2-1.4);
    for(const sd of [-1,1]){K.box(0.6,0.45,L*0.45,MAR_CREAM,sd*(B/2-0.4),0.72,-0.3);K.box(0.15,0.4,L*0.45,MAR_CREAM,sd*(B/2-0.15),1.05,-0.3)}
    K.box(B*0.6,0.45,0.6,MAR_CREAM,0,0.72,-L/2+0.6);K.box(0.6,0.9,0.6,0xd8d9d6,B*0.2,0.95,L*0.12);K.box(0.5,0.05,0.35,MAR_GLASS,B*0.2,1.45,L*0.12+0.2,0,-0.6);
    for(const sd of [-1,1])for(const z of [-L/2+0.5,L*0.1])K.cyl(0.018,0.018,1.6,4,MAR_SS,sd*(B/2-0.08),1.75,z);K.box(B-0.1,0.05,L*0.6+0.4,o.canvas,0,2.55,(-L/2+0.5+L*0.1)/2);
    K.box(0.4,0.6,0.5,0x1e1f21,0,0.55,-L/2-0.05);K.box(0.14,0.7,0.2,0x1e1f21,0,0.05,-L/2-0.1)},
  // a bowrider: seats forward and aft of a split windscreen, an outboard on the transom
  bowrider:(K,o)=>{const L=o.L,B=o.B,D=0.95;marHullKit(K,L,B,D,0.45,o.col,o.bot,o.trim);K.geo(marDeck(L,B,D,0.35,0.03,0.9),0xd9d6cf,0,0,0);
    for(const sd of [-1,1])K.box(B*0.38,0.06,0.5,MAR_GLASS,sd*B*0.22,D*0.95+0.25,L*0.12,sd*0.2,-0.9);
    K.box(B*0.72,0.4,0.6,MAR_CREAM,0,D*0.72,-L/2+0.65);for(const sd of [-1,1])K.box(0.5,0.4,0.55,MAR_CREAM,sd*0.45,D*0.72,-0.1);
    K.box(B*0.55,0.3,1.1,MAR_CREAM,0,D*0.75,L*0.3);K.box(0.5,0.55,0.6,0x2a2c2f,0,D*0.95,-L/2-0.3);K.box(0.15,0.8,0.22,0x2a2c2f,0,0.2,-L/2-0.36);
    marRail(K,L,B,D,0.7,0.96,0.35,MAR_SS);marFenders(K,L,B,D,o.fs,[0.35,0.65])},
  // a sloop on a fin keel: a low cabin, the mast and boom with the mainsail under its cover, a furled jib, lifelines
  sloop:(K,o)=>{const L=o.L,B=o.B,D=0.95;marHullKit(K,L,B,D,0.4,o.col,o.bot,0x2a2c2f);K.geo(marDeck(L,B,D,0.08,0.02,0.97),0xe9e6dc,0,0,0);
    K.box(B*0.62,0.45,L*0.36,0xf1efe9,0,D+0.18,L*0.06);for(const sd of [-1,1])K.box(0.02,0.12,L*0.2,MAR_GLASS,sd*B*0.31,D+0.25,L*0.08);
    const mz=L*0.16,mh=L*1.35;K.cyl(0.06,0.08,mh,8,0xc0c4c7,0,D+mh/2,mz);K.cyl(0.05,0.05,L*0.42,6,0xc0c4c7,0,D+0.95,mz-L*0.21,0,Math.PI/2);
    K.cyl(0.17,0.12,L*0.4,8,o.canvas,0,D+1.13,mz-L*0.2,0,Math.PI/2);mainRod(K,[0,D+mh-0.2,mz],[0,D+0.1,L/2-0.05],0.035,0xeeeae0,6);
    mainRod(K,[0,D+mh-0.1,mz],[0,D+0.4,-L/2+0.1],0.01,0x9ea3a7,3);for(const sd of [-1,1])mainRod(K,[0,D+mh*0.6,mz],[sd*B*0.46,D,mz],0.01,0x9ea3a7,3);
    K.box(0.08,0.06,1.0,MAR_TEAK,0,D+0.25,-L/2+0.9);marRail(K,L,B,D,0.04,0.9,0.6,MAR_SS);marFenders(K,L,B,D,o.fs,[0.3,0.6])},
  // a centre console: the console and its windscreen under a T-top with rod holders, a leaning post, twin outboards
  console:(K,o)=>{const L=o.L,B=o.B,D=1.0;marHullKit(K,L,B,D,0.55,o.col,o.bot,o.trim);K.geo(marDeck(L,B,D,0.4,0.03,0.93),0xe6e4de,0,0,0);
    K.box(0.95,1.0,1.0,0xf2f1ec,0,D*0.6+0.5,0.1);K.box(0.95,0.06,0.45,MAR_GLASS,0,D*0.6+1.12,0.55,0,-0.7);K.box(0.85,0.7,0.5,MAR_CREAM,0,D*0.6+0.35,-1.0);
    for(const sx of [-0.55,0.55])for(const z of [-1.3,0.6])K.cyl(0.025,0.025,1.7,5,MAR_SS,sx,D*0.6+1.0,z);K.box(1.5,0.08,2.3,0xf2f1ec,0,D*0.6+1.88,-0.35);
    for(let i=0;i<5;i++)K.cyl(0.02,0.02,0.4,4,MAR_SS,-0.6+i*0.3,D*0.6+2.05,-1.4,0,0.3);
    for(const sx of [-0.4,0.4]){K.box(0.45,0.6,0.55,0x1e1f21,sx,D*0.85,-L/2-0.3);K.box(0.14,0.85,0.2,0x1e1f21,sx,0.2,-L/2-0.36)}
    marRail(K,L,B,D,0.72,0.96,0.4,MAR_SS);marFenders(K,L,B,D,o.fs,[0.35,0.65])},
  // a small aluminium fishing boat with bench seats and a tiller outboard
  fishing:(K,o)=>{const L=o.L,B=o.B,D=0.7;marHullKit(K,L,B,D,0.25,o.col,o.col,0x5a6064);K.geo(marDeck(L,B,D,0.45,0.03,0.9),0x7f868b,0,0,0);
    for(const z of [-L*0.3,0,L*0.28])K.box(B*0.85,0.05,0.35,0x9aa2a7,0,D*0.55,z);K.box(0.38,0.5,0.45,0x2a2c2f,0,D*0.8,-L/2-0.25);K.box(0.12,0.7,0.18,0x2a2c2f,0,0.15,-L/2-0.3);
    K.cyl(0.02,0.02,0.7,4,0x8d9297,0.2,D+0.15,-L/2+0.2,0,Math.PI/2.4)}};
// the material the moored boats share: gelcoat with a little sheen and the sky in it
// one boat at x, z, its bow toward yaw, moored to the deck at (cx, cz) pairs of cleats (the lines are drawn from them)
function marBoat(kind,o,x,z,yaw){const K=famKit();MAR_KIND[kind](K,o);const g=new THREE.Group(),m=famGelMesh(K.solid);
  m.castShadow=true;m.receiveShadow=true;g.add(m);g.position.set(x,WATER,z);g.rotation.order='YXZ';g.rotation.y=yaw;scene.add(g);
  const b={g,x,z,yaw,ph:hash(x,z)*6.3,hl:o.L/2,hb:o.B/2};MAR.boats.push(b);
  const sy=Math.sin(yaw)*o.L/2,cy=Math.cos(yaw)*o.L/2;BOAT_WALLS.push({ax:x-sy,az:z-cy,bx:x+sy,bz:z+cy,r:o.B/2+0.25});return b}

// ---------- the pier, the fingers, the T-head and the gangway ----------
(function(){const K=famKit(),LT=famKit(),X=MAR.x,Z0=MAR.z0,Y=MAR.y,BOARD=[0x8a7a66,0x7f705d,0x948571,0x857563,0x7a6b58],PILE=0x4d3f30;
  // boards across the deck with a hairline gap, two stringers, round piles standing proud of the deck as posts
  const deck=(x0,z0,x1,z1,hw,y,piles,step)=>{const len=Math.hypot(x1-x0,z1-z0),ux=(x1-x0)/len,uz=(z1-z0)/len,ry=Math.atan2(ux,uz),P=(t,u)=>[x0+ux*t-uz*u,z0+uz*t+ux*u];
    for(let t=0.1,n=0;t<len;t+=0.2,n++){const [x,z]=P(t,0);K.box(2*hw,0.06,0.18,'deckG',x,y-0.03,z,ry)}
    for(const u of [-hw+0.2,0,hw-0.2]){const [x,z]=P(len/2,u);K.box(0.1,0.25,len,0x5a4a38,x,y-0.19,z,ry)}
    for(const u of [-hw-0.05,hw+0.05]){const [x,z]=P(len/2,u);K.box(0.08,0.2,len,0x6d5c48,x,y-0.12,z,ry)}
    if(piles)for(let t=0.3;t<=len;t+=step||3){const tt=Math.min(t,len-0.2);for(const u of [-hw-0.08,hw+0.08]){const [x,z]=P(tt,u),g=Math.min(baseHeight(x,z),WATER)-0.8,top=y+0.55;
      K.cyl(0.15,0.16,top-g,9,PILE,x,(top+g)/2,z);K.cyl(0.16,0.16,0.04,9,0xe8e6e0,x,top+0.02,z)}}};
  deck(X,Z0,X,Z0-MAR.len,1.5,Y,1,3);
  for(const t of MAR.fingers){deck(X+1.5,Z0-t,X+1.5+MAR.fl,Z0-t,MAR.fhw,Y-0.01,1,4.9);
    // cleats at both sides of the finger's root and end, a power post with its lit outlet, a dock box
    for(const dx of [1.2,MAR.fl-0.4])for(const s of [-1,1])K.box(0.34,0.07,0.08,0x2b2d2f,X+1.5+dx,Y+0.04,Z0-t+s*(MAR.fhw-0.12));
    K.box(0.3,1.0,0.3,0xd7d9da,X+2.3,Y+0.5,Z0-t);K.box(0.32,0.05,0.32,0x6a6e72,X+2.3,Y+1.02,Z0-t);LT.lit(new THREE.BoxGeometry(0.12,0.08,0.02),0x6fdc8c,X+2.3,Y+0.8,Z0-t-0.16);
    K.box(1.1,0.55,0.55,0xf2f1ec,X+1.5+MAR.fl-1.6,Y+0.28,Z0-t);SOLIDS.push({x:X+1.5+MAR.fl-1.6,z:Z0-t,hx:0.6,hz:0.3})}
  const TZ=Z0-MAR.len+1.6;deck(X-9,TZ,X+9,TZ,1.8,Y-0.005,1,3);
  // the gangway down from the boardwalk: a ramp of boards with cleats across it and a handrail each side
  {const z0=Z0+1.5,z1=Z0-8.3,y0=WATER+3.75,y1=Y,n=Math.round((z0-z1)/0.25),a=Math.atan2(y0-y1,z0-z1);
    for(let i=0;i<n;i++){const f=(i+0.5)/n,z=z0+(z1-z0)*f,y=y0+(y1-y0)*f;K.box(1.5,0.05,0.22,'deckG',X,y-0.025,z,0,-a);if(i%3===0)K.box(1.4,0.04,0.04,0x6d5c48,X,y+0.02,z)}
    for(const s of [-1,1]){mainRod(K,[X+s*0.78,y0+1.0,z0],[X+s*0.78,y1+1.0,z1],0.03,0xb8bcc0,6);mainRod(K,[X+s*0.78,y0+0.5,z0],[X+s*0.78,y1+0.5,z1],0.02,0xb8bcc0,6);
      for(let i=0;i<=4;i++){const f=i/4;K.cyl(0.03,0.03,1.0,6,0xb8bcc0,X+s*0.78,y0+(y1-y0)*f+0.5,z0+(z1-z0)*f)}}}
  // lamps along the west edge of the pier and on the T-head, a life ring every 20 m, cleats every 6 m
  const LK=famKit();
  for(let t=6;t<MAR.len;t+=12){const x=X-1.4,z=Z0-t;LK.cyl(0.06,0.08,3.2,8,0x2f3236,x,Y+1.6,z);LK.box(0.36,0.42,0.36,0x2f3236,x,Y+3.35,z);LK.cyl(0.02,0.24,0.18,4,0x2f3236,x,Y+3.65,z,Math.PI/4);
    LK.lit(new THREE.BoxGeometry(0.28,0.3,0.28),0xfff1c8,x,Y+3.33,z)}
  for(const dx of [-8.4,8.4]){const x=X+dx,z=TZ+1.4;LK.cyl(0.06,0.08,3.2,8,0x2f3236,x,Y+1.6,z);LK.box(0.36,0.42,0.36,0x2f3236,x,Y+3.35,z);LK.cyl(0.02,0.24,0.18,4,0x2f3236,x,Y+3.65,z,Math.PI/4);
    LK.lit(new THREE.BoxGeometry(0.28,0.3,0.28),0xfff1c8,x,Y+3.33,z)}
  for(let t=10;t<MAR.len;t+=20){const x=X-1.3,z=Z0-t-3;K.box(0.1,1.3,0.1,0xe8e6e0,x,Y+0.65,z);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;K.geo(new THREE.TorusGeometry(0.33,0.07,6,4,Math.PI/4+0.02),i%2?0xf2f1ec:0xe2541c,x-0.08,Y+1.0,z,Math.PI/2,0,a)}}
  for(let t=3;t<MAR.len-2;t+=6)for(const s of [-1,1])K.box(0.08,0.07,0.34,0x2b2d2f,X+s*1.32,Y+0.04,Z0-t);
  // the fuel dock on the T-head: two pumps on an island, a hose reel, the attendant's hut with its window and trim
  {const fx=X+5.2,fz=TZ;K.box(2.6,0.15,0.8,0xbfc2c4,fx,Y+0.08,fz);for(const dx of [-0.65,0.65]){K.box(0.6,1.5,0.45,0xf2f1ec,fx+dx,Y+0.9,fz);K.box(0.62,0.3,0.47,0xb8322a,fx+dx,Y+1.5,fz);
      K.box(0.42,0.3,0.02,MAR_GLASS,fx+dx,Y+1.05,fz-0.24);K.cyl(0.04,0.04,0.25,5,0x1e1f21,fx+dx+0.33,Y+1.0,fz,0,0,0.3)}
    K.cyl(0.32,0.32,0.18,12,0xb8322a,fx+2.2,Y+0.6,fz+0.9,0,0,Math.PI/2);SOLIDS.push({x:fx,z:fz,hx:1.35,hz:0.45});
    const hx=X-5.5;K.box(2.4,2.3,2.0,0xf2f1ec,hx,Y+1.15,fz+0.3);K.box(2.6,0.12,2.2,0xb8322a,hx,Y+2.36,fz+0.3);K.box(2.0,0.08,1.6,0xe0ddd4,hx,Y+2.45,fz+0.3);
    K.box(1.2,0.8,0.04,0x2c3a44,hx+0.2,Y+1.4,fz-0.71);K.box(0.75,1.9,0.04,0x6a5a48,hx-0.75,Y+0.95,fz-0.71);SOLIDS.push({x:hx,z:fz+0.3,hx:1.25,hz:1.05});
    famSign(['FUEL DOCK','Gas · Diesel · Ice · Pump-out'],3.2,0.95,hx,Y+2.95,fz-0.71,Math.PI,'#b8322a','#ffffff')}
  // gulls on a few of the pile tops
  for(const [x,z,a] of [[X+1.58,Z0-18.3,0.4],[X-1.58,Z0-27.3,2.2],[X+1.58,Z0-42.3,-0.9],[X+1.5+MAR.fl,Z0-MAR.fingers[2]-0.78,1.5],[X-9,TZ-1.88,3.0]]){
    const y=Y+0.6;K.geo(new THREE.SphereGeometry(0.14,8,5).scale(1,0.85,1.9),0xf4f4f2,x,y+0.14,z,a);K.geo(new THREE.SphereGeometry(0.1,7,5),0xf4f4f2,x+Math.sin(a)*0.25,y+0.3,z+Math.cos(a)*0.25);
    for(const s of [-1,1])K.box(0.05,0.03,0.32,0x8f969c,x+Math.cos(a)*s*0.12,y+0.2,z-Math.sin(a)*s*0.12,a,0,s*0.2);
    K.cyl(0.0,0.03,0.12,4,0xe8b923,x+Math.sin(a)*0.38,y+0.29,z+Math.cos(a)*0.38,a,Math.PI/2)}
  famAdd(K);famAdd(LT);famAdd(LK)})();

// ---------- the boats in the slips, bows in toward the pier, and a sloop out on a mooring ----------
(function(){const X=MAR.x+1.5,Z0=MAR.z0,F=MAR.fingers.map(t=>Z0-t),side=(f,s,B)=>f+s*(MAR.fhw+0.3+B/2);
  // [kind, which finger, side (+1 the shore side of it), length, beam, colours]
  const SLIPS=[
    ['fishing',0,1,5,1.9,{col:0x8e979c}],
    ['pontoon',0,-1,7.4,2.5,{trim:0x2a7f86,canvas:0x2a6f76}],
    ['bowrider',1,1,6.4,2.4,{col:0xb8322a,bot:0xf2f1ec,trim:0x2a2c2f}],
    ['cruiser',1,-1,9.6,3.2,{bot:0x1f3a5f,trim:0x1f3a5f,canvas:MAR_CAN}],
    ['sloop',2,1,8.6,2.7,{col:0x1f4d3a,bot:0x8a2a22,canvas:0x23466e}],
    ['console',3,1,7.2,2.5,{col:0xbfd4e0,bot:0xf2f1ec,trim:0x2a2c2f}],
    ['cruiser',3,-1,8.4,2.9,{bot:0x8a2a22,trim:0x2a2c2f,canvas:0xd9d2bf}]];
  const LN=famKit();
  for(const [kind,fi,s,L,B,c] of SLIPS){const z=side(F[fi],s,B),x=X+0.5+L/2,o=Object.assign({L,B,bot:0xf2f1ec,trim:0x2a2c2f,col:0xf4f3ef,canvas:MAR_CAN,fs:s>0?1:-1},c);
    // bow toward the pier (-x): its starboard side is then toward +z, so the fenders hang on the finger's side
    o.fs=-s;marBoat(kind,o,x,z,-Math.PI/2);
    // the bow line to the pier's cleat and a spring line to the finger's
    mainRod(LN,[X-0.2,MAR.y+0.05,F[fi]+s*1.0],[X+0.6,WATER+0.95,z],0.018,0xe6e0d0,4);mainRod(LN,[X+MAR.fl-0.4,MAR.y+0.05,F[fi]+s*(MAR.fhw-0.12)],[X+0.5+L*0.75,WATER+0.95,z-s*B*0.42],0.018,0xe6e0d0,4)}
  famAdd(LN);
  // a sloop on a mooring ball off the pier, its bow to the breeze, and two empty balls
  marBoat('sloop',{L:9.2,B:2.9,col:0xf4f3ef,bot:0x1f3a5f,trim:0x1f3a5f,canvas:0x8a2a22,fs:1},36,503,0.3);
  for(const [x,z] of [[37.4,507.6],[22,516],[50,514]])MAR.buoys.push({x,z,k:'ball'});
  // the channel into the basin: a green can by the T-head, a red nun off the breakwater's tip (red right returning)
  MAR.buoys.push({x:84,z:488,k:'green'},{x:98,z:476,k:'red'})})();
// the buoys: each its own small mesh so it can bob
(function(){for(const b of MAR.buoys){const K=famKit();
  if(b.k==='ball'){K.geo(new THREE.SphereGeometry(0.45,12,8),0xf2f1ec,0,0.1,0);K.cyl(0.46,0.46,0.12,12,0x2a5f9a,0,0.12,0)}
  else{const c=b.k==='red'?0xc0302a:0x2f7a3a;K.cyl(0.55,0.6,0.7,12,c,0,0.2,0);if(b.k==='red')K.cyl(0.0,0.55,0.9,12,c,0,1.0,0);else K.cyl(0.42,0.42,0.8,12,c,0,0.95,0);
    K.cyl(0.04,0.04,0.6,5,0x2a2c2f,0,1.65,0);K.box(0.12,0.12,0.12,0xf2e7a0,0,1.98,0)}
  const g=new THREE.Group();g.add(famGelMesh(K.solid));g.position.set(b.x,WATER,b.z);scene.add(g);b.g=g;b.ph=hash(b.x,b.z)*6.3}})();

// ---------- the breakwater: grey granite boulders (scanned granite in six shades) heaped along its line, and the lighthouse on a concrete pad at its tip ----------
(function(){let sd=77;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  const K=shopKit(),RK=famKit(),conc=shopLib('concrete_old'),crest=WATER+1.7,ROCK=[0xa39e94,0x958f86,0xb0aa9f,0x8a857d,0x9d9488,0xaaa59c];
  // a boulder: an icosahedron with its corners pushed in and out, flattened a little
  const boulder=(r)=>{const g=new THREE.IcosahedronGeometry(r,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=0.78+0.4*hash(x*3.1+sd,z*2.7+y*1.3);p.setXYZ(i,x*k*1.15,y*k*0.72,z*k)}g.computeVertexNormals();return g};
  for(let i=0;i<MAR_BW.length-1;i++){const [ax,az]=MAR_BW[i],[bx,bz]=MAR_BW[i+1],len=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/len,uz=(bz-az)/len;
    for(let t=0;t<len;t+=1.7)for(const u of [-5.2,-3.6,-1.9,0,1.9,3.6,5.2]){const x=ax+ux*(t+rnd()*0.8)-uz*(u+(rnd()-0.5)*0.6),z=az+uz*(t+rnd()*0.8)+ux*(u+(rnd()-0.5)*0.6),g=baseHeight(x,z);
      const top=crest-Math.max(0,Math.abs(u)-1.5)*0.62;if(top<g-0.3||top<WATER-1.6)continue;const r=0.85+rnd()*0.65;
      RK.geo(boulder(r),famTint('rockBW',ROCK[(rnd()*6)|0]),x,Math.max(top,g+r*0.4)-r*0.3,z,rnd()*6.3,(rnd()-0.5)*0.5)}}
  // the lighthouse: a concrete pad, a white tapered tower with a red band, the gallery and its railing, the lantern
  // under a red dome; its lamp glows, and after dark its beam sweeps round (marinaTick)
  const [lx,lz]=MAR_BW[MAR_BW.length-1],F=famKit(),y0=crest+0.3;
  K.put(conc,new THREE.CylinderGeometry(2.6,3.0,crest-WATER+1.8,16),lx,(y0+WATER-1.5)/2,lz);
  F.cyl(0.95,1.25,6.4,16,0xf2f1ec,lx,y0+3.2,lz);F.cyl(0.99,1.04,1.1,16,0xb8322a,lx,y0+5.5,lz);F.box(0.6,1.4,0.06,0x6a5a48,lx,y0+0.7,lz-1.24);
  for(const h of [2.4,4.2])F.box(0.35,0.5,0.06,0x2c3a44,lx,y0+h,lz-(1.25-0.3*h/6.4)-0.01);
  F.cyl(1.45,1.45,0.14,16,0x3a3d40,lx,y0+6.45,lz);F.geo(new THREE.TorusGeometry(1.4,0.025,4,24),0x3a3d40,lx,y0+7.35,lz,0,Math.PI/2);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;F.cyl(0.025,0.025,0.9,4,0x3a3d40,lx+Math.cos(a)*1.4,y0+6.9,lz+Math.sin(a)*1.4)}
  F.cyl(0.62,0.62,0.25,12,0x3a3d40,lx,y0+6.65,lz);F.lit(new THREE.CylinderGeometry(0.56,0.56,1.05,12),0xfff6d8,lx,y0+7.3,lz);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;F.box(0.06,1.1,0.06,0x3a3d40,lx+Math.cos(a)*0.6,y0+7.3,lz+Math.sin(a)*0.6)}F.cyl(0.0,0.75,0.75,12,0xb8322a,lx,y0+8.2,lz);
  F.cyl(0.02,0.02,0.6,4,0x2a2c2f,lx,y0+8.8,lz);F.lit(new THREE.BoxGeometry(0.5,0.6,0.5),0xfff6d8,lx,y0+7.3,lz);
  // you can walk the breakwater's crest out to the lighthouse; its pad and tower
  for(let i=0;i<MAR_BW.length-1;i++){const [ax,az]=MAR_BW[i],[bx,bz]=MAR_BW[i+1],len=Math.hypot(bx-ax,bz-az);walkPad((ax+bx)/2,(az+bz)/2,1.6,len/2+0.8,Math.atan2(bx-ax,bz-az),crest+0.25)}
  walkPad(lx,lz,1.85,1.85,0,y0);SOLIDS.push({x:lx,z:lz,hx:1.25,hz:1.25});
  K.add();famAdd(F);famAdd(RK);
  // the beam: two long cones back to back, bright at the lamp and fading out, drawn added to the night
  const g=new THREE.ConeGeometry(2.2,46,14,1,true);g.translate(0,-23,0);g.rotateX(Math.PI/2);
  const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const f=Math.max(0,1+p.getZ(i)/46)*0.9;c[i*3]=f;c[i*3+1]=f*0.95;c[i*3+2]=f*0.8}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  const beam=new THREE.Group();for(const a of [0,Math.PI]){const m=new THREE.Mesh(g,mat);m.rotation.y=a;m.rotation.x=0.04;beam.add(m)}
  beam.position.set(lx,y0+7.3,lz);beam.visible=false;scene.add(beam);MAR.beam=beam})();

// ---------- ashore: the Harbor House, the Dockside Grill, the ice cream stand, the boat ramp, the rack and the car park ----------
(function(){const K=shopKit(),F=famKit(),BK=famKit(),shing=shopLib('shingles'),conc=shopLib('concrete_broom'),asph=shopLib('asphalt'),
    corr=shopLib('corrugated'),galv=shopStd(0x9aa0a4,0.9,0.38),paint=shopStd(0xe9e6dc,0,0.75),groove=shopStd(0x6b6a64,0,0.95);
  // decks and steps in the grey dock planks (bridge kit, through the famKit)
  const KD=(w,h,d,x,y,z,ry,rx)=>F.box(w,h,d,'deckG',x,y,z,ry,rx);
  const G=(x,z)=>baseHeight(x,z);
  // windows with white casing and a sill; dark glass (it glows warm after dark)
  const win=(x,y,z,w,h,yaw,shut)=>{const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    F.box(w+0.24,h+0.24,0.06,0xf4f3ef,x+fx*0.06,y,z+fz*0.06,yaw);F.box(w,h,0.04,0x2c3a44,x+fx*0.1,y,z+fz*0.1,yaw);F.box(w*0.96,0.05,0.05,0xf4f3ef,x+fx*0.12,y,z+fz*0.12,yaw);
    F.box(w+0.4,0.07,0.16,0xf4f3ef,x+fx*0.12,y-h/2-0.15,z+fz*0.12,yaw);
    if(shut)for(const s of [-1,1])F.box(w*0.5,h+0.1,0.05,shut,x+fx*0.08+rx*s*(w*0.75+0.15),y,z+fz*0.08+rz*s*(w*0.75+0.15),yaw)};

  // the Harbor House: two floors of grey-blue lap siding with white corner boards, a shingled gable roof along x with a
  // cupola and weathervane on the ridge, a porch along the water side under its own roof, the marina's sign above it
  {const hx=93,hz=572,W=15,D=10,g0=Math.min(G(hx-W/2,hz-D/2),G(hx+W/2,hz-D/2),G(hx-W/2,hz+D/2),G(hx+W/2,hz+D/2)),fl=g0+0.45,H=6.4,SID=0x8fa3ad,TR=0xf4f3ef;
    F.box(W+0.2,fl-g0+0.6,D+0.2,0x8d8a82,hx,(fl+g0-0.6)/2,hz);
    F.box(W+0.04,H,D+0.04,'sidingG',hx,fl+H/2,hz);for(const sx of [-1,1])for(const sz of [-1,1])F.box(0.22,H,0.22,TR,hx+sx*W/2,fl+H/2,hz+sz*D/2);
    F.box(W+0.3,0.3,D+0.3,TR,hx,fl+H-0.05,hz);F.box(W+0.25,0.18,D+0.25,TR,hx,fl+3.35,hz);
    // the gable ends, the roof planes and the ridge
    const rise=3.2,rp=Math.atan2(rise,D/2+0.5),rl=Math.hypot(rise,D/2+0.5);for(const sx of [-1,1])F.geo(famGable(D,rise,0.12),'sidingG',hx+sx*(W/2-0.06),fl+H,hz);
    for(const sz of [-1,1])K.box(shing,W+0.9,0.14,rl,hx,fl+H+rise/2,hz+sz*(D/4+0.25),0,sz*rp);F.box(W+0.95,0.16,0.3,0x3a3d40,hx,fl+H+rise+0.05,hz);
    for(const sz of [-1,1])F.box(W+0.95,0.2,0.1,TR,hx,fl+H-0.05,hz+sz*(D/2+0.5));
    // windows: the shop's big front windows and doors on the porch, double-hung windows with navy shutters upstairs
    for(const dx of [-5.2,-2.4,2.4,5.2])win(hx+dx,fl+1.55,hz-D/2,1.8,1.7,Math.PI,0);for(const dx of [-0.55,0.55])F.box(0.95,2.3,0.06,0x2c3a44,hx+dx,fl+1.15,hz-D/2-0.08,Math.PI);
    F.box(2.4,2.6,0.08,TR,hx,fl+1.3,hz-D/2-0.04,Math.PI);for(const dx of [-5.6,5.6])win(hx+dx,fl+4.8,hz-D/2,0.95,1.5,Math.PI,MAR_CAN);
    for(const dz of [-2.5,2.5])for(const sx of [-1,1])win(hx+sx*W/2,fl+(dz<0?4.8:1.6),hz+dz,0.95,1.5,sx*Math.PI/2,MAR_CAN);for(const dx of [-4,0,4])win(hx+dx,fl+4.8,hz+D/2,0.95,1.5,0,MAR_CAN);
    // the cupola: louvred sides, a little pyramid roof, the weathervane
    {const cy=fl+H+rise-0.1;F.box(1.5,1.3,1.5,TR,hx,cy+0.65,hz);for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2])for(let i=0;i<5;i++)F.box(0.9,0.06,0.06,0x9aa4a8,hx+Math.sin(a)*0.77,cy+0.35+i*0.17,hz+Math.cos(a)*0.77,a,-0.5);
      F.cyl(0,1.2,0.9,4,0x4f6a5a,hx,cy+1.75,hz,Math.PI/4);F.cyl(0.02,0.02,1.1,4,0x2a2c2f,hx,cy+2.6,hz);F.box(0.05,0.05,0.9,0x2a2c2f,hx,cy+2.9,hz,0.7);
      F.box(0.03,0.3,0.25,0x2a2c2f,hx-Math.sin(0.7)*0.4,cy+2.9,hz-Math.cos(0.7)*0.4,0.7);F.cyl(0,0.08,0.2,4,0x2a2c2f,hx+Math.sin(0.7)*0.48,cy+2.9,hz+Math.cos(0.7)*0.48,0.7,Math.PI/2)}
    // the porch: a plank deck with steps, white posts and railings, a low shed roof with its sign on the fascia
    const pz=hz-D/2-1.6,py=fl;KD(W+1,0.12,3.2,hx,py-0.06,pz);F.box(W+1,py-g0,0.1,0xe0ddd4,hx,(py+g0)/2,pz-1.6);
    for(let i=0;i<3;i++)KD(3,0.12,0.32,hx,py-0.18-i*0.15,pz-1.75-i*0.32);
    walkPad(hx,pz,W/2+0.5,1.6,0,py);walkPad(hx,pz-2.07,1.5,0.48,0,py-0.57,{rise:0.57});
    for(const s of [-1,1])SOLIDS.push({x:hx+s*4.5,z:pz-1.45,hx:2.95,hz:0.08});
    for(const dx of [-7.4,-4.4,-1.6,1.6,4.4,7.4])F.box(0.18,2.9,0.18,TR,hx+dx,py+1.45,pz-1.45);
    for(const [a,b] of [[-7.4,-4.4],[-4.4,-1.6],[1.6,4.4],[4.4,7.4]]){F.box(b-a,0.08,0.1,TR,hx+(a+b)/2,py+0.95,pz-1.45);F.box(b-a,0.06,0.06,TR,hx+(a+b)/2,py+0.12,pz-1.45);
      for(let x=a+0.18;x<b-0.1;x+=0.18)F.box(0.04,0.8,0.04,TR,hx+x,py+0.53,pz-1.45)}
    K.box(shing,W+1.4,0.1,3.6,hx,py+3.1,pz-0.1,0,-0.2);F.box(W+1.4,0.32,0.08,TR,hx,py+2.78,pz-1.86);
    famSign(['LAKESIDE MARINA','Harbor Master · Bait & Tackle · Ice'],7.4,1.5,hx,fl+4.75,hz-D/2-0.1,Math.PI,'#1f3a5f','#f4f1e6');
    // rocking chairs on the porch, the ice chest and bait cooler by the door
    for(const dx of [-6.2,-3.2,3.2,6.2]){const x=hx+dx,z=pz+0.3;F.box(0.55,0.06,0.5,0x2f4a3a,x,py+0.45,z);F.box(0.55,0.65,0.06,0x2f4a3a,x,py+0.8,z+0.24,0,-0.15);
      for(const s of [-1,1]){F.box(0.05,0.08,0.75,0x2f4a3a,x+s*0.26,py+0.06,z);F.box(0.04,0.4,0.04,0x2f4a3a,x+s*0.26,py+0.26,z)}}
    F.box(1.4,1.3,0.75,0xf2f1ec,hx+2.0,py+0.65,hz-D/2-0.5);F.box(1.3,0.35,0.05,0x2a6f9a,hx+2.0,py+1.0,hz-D/2-0.88);F.box(0.9,0.9,0.6,0x2a6f9a,hx-2.1,py+0.45,hz-D/2-0.45);
    SOLIDS.push({x:hx,z:hz,hx:W/2+0.1,hz:D/2+0.1});
    // the flagpole with a yardarm, between the porch and the boardwalk
    {const X=hx+9.5,Z=hz-7,y=G(X,Z);F.box(1,0.3,1,0x9b9a94,X,y+0.15,Z);F.cyl(0.06,0.1,11,8,0xf2f1ec,X,y+5.5,Z);F.box(3,0.08,0.08,0xf2f1ec,X,y+8.4,Z);
      F.geo(new THREE.IcosahedronGeometry(0.15,0),0xd8b04a,X,y+11.1,Z);const fw=2.2,fh=1.2,fx=X+fw/2+0.08,fy=y+10.3;
      for(let i=0;i<7;i++)F.box(fw,fh/7,0.03,i%2?0xf4f2ee:0xb3263a,fx,fy+fh/2-fh/14-i*fh/7,Z);F.box(fw*0.42,fh*4/7,0.04,0x2b3d78,X+0.08+fw*0.21,fy+fh/2-fh*2/7,Z);
      for(const s of [-1,1]){F.box(0.02,0.4,0.55,s<0?0x1f3a5f:0xd8a42a,X+s*1.3,y+8.1,Z+0.3);F.box(0.025,0.14,0.56,0xf4f2ee,X+s*1.3,y+8.1,Z+0.3)}
      SOLIDS.push({x:X,z:Z,hx:0.5,hz:0.5})}}

  // the Dockside Grill: dark red board-and-batten under a standing-seam roof, roll-up glass doors to a deck over the
  // beach with tables, umbrellas and string lights
  {const gx=46,gz=574,W=14,D=9,g0=Math.min(G(gx-W/2,gz-D/2),G(gx+W/2,gz+D/2),G(gx-W/2,gz+D/2),G(gx+W/2,gz-D/2)),fl=g0+0.4,H=4.6,RED=0x7e2f26,TR=0xefe9dc;
    F.box(W+0.2,fl-g0+0.5,D+0.2,0x7a7670,gx,(fl+g0-0.5)/2,gz);F.box(W,H,D,'sidingR~',gx,fl+H/2,gz);
    for(const [fx,fz,len,yaw] of [[0,-D/2,W,Math.PI],[0,D/2,W,0],[-W/2,0,D,-Math.PI/2],[W/2,0,D,Math.PI/2]]){const rx=Math.cos(yaw),rz=-Math.sin(yaw);
      for(let s=-len/2+0.3;s<len/2;s+=0.6)F.box(0.07,H,0.05,0x6c271f,gx+fx+Math.sin(yaw)*0.03+rx*s,fl+H/2,gz+fz+Math.cos(yaw)*0.03+rz*s,yaw)}
    for(const sx of [-1,1])for(const sz of [-1,1])F.box(0.2,H,0.2,TR,gx+sx*W/2,fl+H/2,gz+sz*D/2);
    for(const dx of [-4.2,0,4.2]){F.box(3.6,2.9,0.06,0x2c3a44,gx+dx,fl+1.5,gz-D/2-0.06,Math.PI);for(let i=1;i<4;i++)F.box(3.6,0.05,0.08,0x3a3d40,gx+dx,fl+i*0.72,gz-D/2-0.09,Math.PI);
      F.box(3.8,0.15,0.1,TR,gx+dx,fl+3.0,gz-D/2-0.08,Math.PI)}
    for(const dz of [-2.2,2.2])for(const sx of [-1,1])win(gx+sx*W/2,fl+1.9,gz+dz,1.3,1.2,sx*Math.PI/2,0);
    const rp=0.32,rl=(D/2+0.6)/Math.cos(rp);for(const sz of [-1,1])F.box(W+1,0.08,rl,famTint('seam',0x3d4245),gx,fl+H+Math.tan(rp)*(D/4+0.3)-0.05,gz+sz*(D/4+0.3),0,sz*rp);
    for(const sx of [-1,1])F.geo(famGable(D+1.2,Math.tan(rp)*(D/2+0.6),0.1),RED,gx+sx*(W/2+0.02),fl+H-0.02,gz);
    F.box(W+1.05,0.14,0.2,0x3a3d40,gx,fl+H+Math.tan(rp)*(D/2+0.6)-0.02,gz);
    famSign(['DOCKSIDE GRILL','Burgers · Fish Tacos · Cold Drinks'],7.2,1.35,gx,fl+H-0.8,gz-D/2-0.12,Math.PI,'#f0e6cf','#7e2f26');
    SOLIDS.push({x:gx,z:gz,hx:W/2+0.1,hz:D/2+0.1});
    // the deck: planks on posts, a railing on the water side, tables with umbrellas
    const dz0=gz-D/2,dz1=dz0-5.2,dy=fl;KD(W+2,0.12,5.2,gx,dy-0.06,(dz0+dz1)/2);
    for(const x of [-7.8,-3.9,0,3.9,7.8])F.box(0.16,dy-G(gx+x,dz1)+0.1,0.16,0x5c4632,gx+x,(dy+G(gx+x,dz1))/2,dz1+0.1);
    for(let x=-W/2-1;x<=W/2+1.01;x+=0.15)F.box(0.04,0.9,0.04,0x2a2c2f,gx+x,dy+0.45,dz1+0.08);F.box(W+2.1,0.08,0.14,0x5c4632,gx,dy+0.94,dz1+0.08);
    const UMB=[0x1f3a5f,0xe9e1cc,0xb8322a,0x2a6f76,0xe9e1cc];
    for(let i=0;i<5;i++){const x=gx-5.6+i*2.8,z=dz1+2.4+(i%2)*0.7;F.cyl(0.42,0.42,0.05,12,0xd9d2bf,x,dy+0.74,z);F.cyl(0.04,0.06,0.72,6,0x2a2c2f,x,dy+0.37,z);
      for(const a of [0,Math.PI*2/3,Math.PI*4/3])F.box(0.38,0.45,0.38,0x3a3d40,x+Math.sin(a)*0.75,dy+0.23,z+Math.cos(a)*0.75,a);
      F.cyl(0.02,0.02,2.4,4,0xe9e6dc,x,dy+1.2,z);F.cyl(0.02,1.25,0.45,8,UMB[i],x,dy+2.3,z)}
    walkPad(gx,(dz0+dz1)/2,W/2+1,2.6,0,dy);SOLIDS.push({x:gx,z:dz1+0.08,hx:W/2+1,hz:0.08});
    for(let i=0;i<5;i++)SOLIDS.push({x:gx-5.6+i*2.8,z:dz1+2.4+(i%2)*0.7,hx:0.45,hz:0.45});
    // steps down off its east end
    {const xe=gx+W/2+1,zm=(dz0+dz1)/2+1.2,n=Math.max(1,Math.round((dy-G(xe+0.5,zm))/0.15));for(let i=0;i<n;i++)KD(0.32,0.12,1.6,xe+0.16+i*0.32,dy-0.06-(i+1)*(dy-G(xe+0.5,zm))/(n+1),zm);
      walkPad(xe+n*0.16,zm,0.8,n*0.16,-Math.PI/2,dy-(dy-G(xe+0.5,zm))*(n+1)/n+0.02,{rise:(dy-G(xe+0.5,zm))*(n+1)/n-0.02})}
    // string lights from the eaves out to poles at the deck's corners, sagging between
    const poles=[[gx-W/2-0.9,dz1+0.2],[gx+W/2+0.9,dz1+0.2],[gx,dz1+0.2]];for(const [x,z] of poles)F.cyl(0.07,0.08,3.6,6,0x5c4632,x,dy+1.8,z);
    for(const [a,b] of [[[gx-W/2,dy+3.4,dz0],poles[0]],[[gx,dy+3.4,dz0],poles[2]],[[gx+W/2,dy+3.4,dz0],poles[1]],[poles[0],poles[2]],[poles[2],poles[1]]]){
      const A=[a[0],a.length>2?a[1]:dy+3.5,a.length>2?a[2]:a[1]],B=[b[0],dy+3.5,b[1]];let p=A;
      for(let i=1;i<=10;i++){const f=i/10,q=[A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f-Math.sin(f*Math.PI)*0.45,A[2]+(B[2]-A[2])*f];mainRod(F,p,q,0.008,0x1e1f21,3);
        if(i<10)F.lit(new THREE.SphereGeometry(0.06,6,4),0xffd47c,q[0],q[1]-0.08,q[2]);p=q}}}

  // the ice cream stand: a white booth with a pink-and-white striped awning over its window, and a cone on the roof
  {const ix=63,iz=566.5,g0=G(ix,iz)+0.1;F.box(3.2,0.2,2.6,0x9b9a94,ix,g0-0.05,iz);F.box(3,2.5,2.4,0xf6f3ec,ix,g0+1.25,iz);F.box(3.2,0.2,2.6,0xe78fb3,ix,g0+2.6,iz);
    F.box(1.8,0.9,0.05,0x2c3a44,ix,g0+1.55,iz-1.21);F.box(2.0,0.08,0.3,0xf6f3ec,ix,g0+1.05,iz-1.3);
    for(let i=0;i<8;i++)F.box(0.33,0.05,1.0,famTint('canvas',i%2?0xf6f3ec:0xe78fb3),ix-1.16+i*0.33,g0+2.25,iz-1.62,0,0.35);
    F.cyl(0.32,0.02,0.9,10,0xd2a15e,ix,g0+3.15,iz);F.geo(new THREE.SphereGeometry(0.36,10,8),0xf3d9e2,ix,g0+3.65,iz);F.geo(new THREE.SphereGeometry(0.06,6,4),0xb8322a,ix,g0+4.02,iz);
    famSign(['SCOOPS','Ice Cream · Shakes'],2.2,0.6,ix,g0+2.65,iz-1.32,Math.PI,'#f6f3ec','#c2477a');SOLIDS.push({x:ix,z:iz,hx:1.6,hz:1.3});
    for(const dx of [-2.6,2.6]){const x=ix+dx,z=iz-2.4,y=G(x,z);BK.box(1.6,0.06,0.45,0x2f4a3a,x,y+0.45,z);for(const s of [-1,1])BK.box(0.06,0.45,0.45,0x2a2c2f,x+s*0.7,y+0.22,z);famSpot('bench',x,y,z,Math.PI,0.9)}}

  // the boat ramp: grooved concrete from the car park down the bank and into the water, a dock alongside it
  {const R=MAR.ramp;K.sheet(conc,R-3,R+3,526,583,0.05);walkPad(R,554.5,3,28.5,0,0,{l:0.05});for(let z=528;z<556;z+=0.6)K.sheet(groove,R-2.9,R+2.9,z,z+0.08,0.06);
    famSign(['PUBLIC BOAT RAMP','No Wake · Slow Down'],2.6,0.95,R+4.6,G(R+4.6,562)+1.9,562,Math.PI,'#2f5a33','#ffffff');for(const s of [-1,1])F.box(0.1,2.4,0.1,0x8a8a86,R+4.6+s*1.2,G(R+4.6,562)+1.2,562)}
  // the dry-stack rack: galvanized columns and arms five bays wide, boats on it three high bow-in, under a steel roof
  {const x0=113,NB=5,BW=3,rz=572,y=G(x0+NB*BW/2,rz),levels=[1.3,3.4,5.5];
    for(let k=0;k<=NB;k++)for(const dz of [-3.3,3.3]){const x=x0+k*BW;K.box(galv,0.22,7.4,0.22,x,y+3.7,rz+dz);SOLIDS.push({x,z:rz+dz,hx:0.15,hz:0.15})}
    for(const ly of levels)for(let k=0;k<=NB;k++)K.box(galv,0.14,0.18,6.8,x0+k*BW,y+ly,rz);K.box(corr,NB*BW+0.6,0.06,7.4,x0+NB*BW/2,y+7.45,rz,0,0.06);
    const RK=famKit(),COLS=[0xf4f3ef,0x1f3a5f,0xb8322a,0xf4f3ef,0x2f6b4f,0xbfd4e0,0xf4f3ef,0xc9b27a,0x2a2c2f];let n=0;
    for(const ly of levels)for(let k=0;k<NB;k++,n++){if(n===6||n===12)continue;const L=5.6+(n%3)*0.4,B=2.3,c=COLS[n%COLS.length],K2=famKit();
      marHullKit(K2,L,B,0.85,0.45,c,0xf2f1ec,0x2a2c2f);K2.geo(marDeck(L,B,0.85,0.35,0.03,0.9),0xdedbd4,0,0,0);K2.box(0.6,0.6,0.5,0xf2f1ec,0,0.95,0);
      for(const g of K2.solid){g.translate(x0+k*BW+BW/2,y+ly+0.55,rz+0.2);RK.solid.push(g)}}
    famAdd(RK)}
  // the car park: asphalt with painted stalls between the buildings and the cross street, lamp poles at its middle,
  // and a boat on its trailer waiting by the ramp
  {K.sheet(asph,58,131,582,612,0.04);walkPad(94.5,597,36.5,15,0,0,{l:0.04});for(let x=60.5;x<129;x+=3)for(const [z0,z1] of [[583,588.5],[605.5,611]])K.sheet(paint,x-0.06,x+0.06,z0,z1,0.055);
    for(const [x,z] of [[72,597],[91,597],[110,597]]){const y=G(x,z);F.cyl(0.25,0.3,0.6,10,0xa3a19a,x,y+0.3,z);F.cyl(0.08,0.11,8,8,0x3a3d40,x,y+4.3,z);
      for(const s of [-1,1]){F.box(1.0,0.08,0.08,0x3a3d40,x+s*0.5,y+8.2,z);F.box(0.55,0.14,0.32,0x2f3236,x+s*1.05,y+8.15,z);F.lit(new THREE.BoxGeometry(0.45,0.03,0.24),0xfff1c8,x+s*1.05,y+8.07,z)}
      SOLIDS.push({x,z,hx:0.3,hz:0.3})}
    const tx=114,tz=592,ty=G(tx,tz);for(const s of [-1,1]){F.box(0.1,0.12,6.4,0x9aa0a4,tx+s*0.8,ty+0.55,tz);F.cyl(0.33,0.33,0.22,12,0x1e1f21,tx+s*1.05,ty+0.33,tz-0.6,0,0,Math.PI/2)}
    mainRod(F,[tx,ty+0.55,tz-3.2],[tx,ty+0.55,tz-4.4],0.05,0x9aa0a4,6);
    const K2=famKit();marHullKit(K2,6.2,2.4,0.95,0.45,0x2f6b4f,0xf2f1ec,0x2a2c2f);K2.geo(marDeck(6.2,2.4,0.95,0.35,0.03,0.9),0xdedbd4,0,0,0);
    for(const g of K2.solid){g.rotateY(Math.PI);g.translate(tx,ty+1.15,tz+0.3);F.solid.push(g)}SOLIDS.push({x:tx,z:tz,hx:1.3,hz:3.4})}
  K.add();famAdd(F);famAddSpot('bench',BK)})();

// the moored boats and buoys ride the swells at their lines; the lighthouse's beam turns after dark. Only near enough to see
function marinaTick(dt){const cx=camera.position.x-95,cz=camera.position.z-520;if(cx*cx+cz*cz>650*650){MAR.beam.visible=false;return}
  const t=performance.now()/1000;
  for(const b of MAR.boats){const y=lakeY(b.x,b.z);b.g.position.y=y-0.02;b.g.rotation.x=0.012*Math.sin(t*0.8+b.ph);b.g.rotation.z=0.02*Math.sin(t*0.65+b.ph*1.7)}
  for(const b of MAR.buoys){b.g.position.y=lakeY(b.x,b.z)-0.1;b.g.rotation.x=0.06*Math.sin(t*1.1+b.ph);b.g.rotation.z=0.06*Math.sin(t*0.9+b.ph*1.3)}
  // the beam shows as the lamps come on (the glow material brightens from 0.65 at day to 1 at night, daynight.js)
  const k=Math.max(0,(famGlowMat.color.r-0.66)/0.34);MAR.beam.visible=k>0.02;
  if(MAR.beam.visible){MAR.beam.rotation.y=t*0.55;for(const m of MAR.beam.children)m.material.opacity=0.28*k}}
