// Corley's Island: the town's waterfront, from Harbor Square (square.js) east to the marina (marina.js). Main Street
// opens at its foot onto plazas either side (pavers, a fountain, planters, shade trees, benches) and over the beach road
// onto the Landing at the water; along the top of the bank runs one paved promenade from the causeway to the Harbor
// House's porch: a granite coping with an iron rail on the water side (open at the steps down to the beach, the
// fishing pier, the marina's gangway and two timber overlooks out over the bank), benches facing the water, lamps and
// planters. Between it and the beach road a small park (lawn, shade trees, brick paths, picnic tables) with a timber
// fishing pier out over the lake; and six shops facing the water (built like Main Street's, mainLot: glazed storefront,
// awning, sign, a furnished room you can walk into): the Salt & Line fish shack on the Landing, the Lakeside Bakery and
// Lakeside Pharmacy (moved down from Main Street's first lots) and Shoreline Gifts along the beach road, and The Rusty
// Anchor bar and Paddle & Pedal rentals on the promenade by the marina, with café tables, a patio, racks of kayaks and
// bikes and postcard spinners out front. People stroll it (TF_WALK, WF_WALK), sit, fish and look out (TF_ROOMS).
// Built at load from the ground as it is (baseHeight), like the town.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the promenade: its edge at the water (z) and its land side, its ends (x); the pier: its middle x, where it leaves the
// promenade, where its ramp levels off, its T-head and its deck height
const WF={zN:557.6,zS:563,x0:4.6,x1:101,px:28,pzA:557.6,pzB:547,pzC:517,pT:[22,34],py:-5.0,y0:-3.56};
// the waterfront's walks (joined to the town's in TF_WALK, townfolk.js): along the promenade from the square over the
// causeway's foot, out the pier and onto the overlooks, over the beach road from the Landing to Main Street and along
// the shops, through the park, and from the shops' end back up to the promenade by the marina; {x:1}: a crossing
const WF_WALK=[[[-25.5,568.6],[-11,568.6],[-5.2,560.5]],{x:1,p:[[-5.2,560.5],[5.2,560.5]]},[[5.2,560.5],[9,560.5]],[[9,560.5],[28,560.5]],
  [[28,560.5],[42,560.5]],[[42,560.5],[58.5,560.5]],[[58.5,560.5],[72,560.5]],[[72,560.5],[89,560.5]],[[89,560.5],[99,560.5]],
  [[42,560.5],[42.6,555.4]],[[89,560.5],[89.6,555.4]],[[28,560.5],[28,557.2],[28,517.3]],[[28,517.3],[23,517.3]],[[28,517.3],[33,517.3]],
  [[9,560.5],[10.4,564],[10.4,570.6]],{x:1,p:[[10.4,570.6],[10.4,577.2]]},[[10.4,577.2],[5.3,580]],[[10.4,577.2],[17,577.2]],[[17,577.2],[26,577.2]],
  [[26,577.2],[30,581.8],[35.28,585.53]],[[35.28,585.53],[46.6,587.85]],[[46.6,587.85],[57.82,590.13]],{x:1,p:[[57.82,590.13],[59.6,584]]},[[59.6,584],[58.6,567],[58.5,560.5]],
  [[28,560.5],[29,563.5],[29,567]],[[29,567],[29,572.4]],{x:1,p:[[29,572.4],[26,577.2]]},[[29,567],[21.4,567]],[[29,567],[37.4,567]]];
// how high the paving is above the ground where the townsfolk walk on the waterfront (tfLift, townfolk.js): the pier's
// deck (no walk pads there: the worker walks it as a dock, BRIDGES) and the walk pads; null elsewhere
function wfLift(x,z){if(x<4.4||x>104||z<514||z>600)return null;const G=baseHeight(x,z);
  if(z<WF.pzA+0.2&&(Math.abs(x-WF.px)<1.3&&z>WF.pzC||Math.abs(z-WF.pzC)<1.7&&x>WF.pT[0]-0.1&&x<WF.pT[1]+0.1))
    return Math.max(0,(z>WF.pzB?WF.py+(WF.y0-WF.py)*(z-WF.pzB)/(WF.pzA-WF.pzB):WF.py)-G);
  const p=padAt(x,z);return p>-1e8?Math.max(0,p-G):null}

(function(){const K=shopKit(),F=famKit(),T=famKit(),LK=famKit(),BK=famKit(),PK=famKit(),G=baseHeight,{zN,zS}=WF,
    pav=shopLib('pavers'),brk=shopLib('herringbone'),walk=shopLib('concrete_broom'),IRON=0x1f2a24,GRAN=0xb9b6ad,WD=0x6d5c48,DK=0x2a2c2f,TREES=[];
  const py=(x,z)=>Math.max(G(x,z),-3.62)+0.06,on=(x,z)=>G(x,z)+0.06;
  // the people's places: the promenade west (with the Landing, the park and the pier) and east, the plaza at the foot of
  // Main Street, and the café seats (open with their shops)
  const room=(x,z,r,hrs)=>{const R={x,z,r,spots:[],ground:1};if(hrs)R.hrs=hrs;return R},RW=room(30,548,44),RE=room(72,561,32),RP=room(0,588,24),
    RB=room(26,582,12,[6,15]),RF=room(25,569,10,[11,21]),RA=room(71,565,8,[11,24]);
  const spot=(R,x,z,y,yaw,k)=>{const sp=Object.assign({x,z,y,yaw},k||{});R.spots.push(sp);return sp},roomOf=x=>x<46?RW:RE;
  // pieces: a bench (yaw: the way its sitters face), a lamp, a planter of shrubs, a café table and its chairs, a picnic table
  const bench=(R,x,z,y,yaw)=>{const c=Math.abs(Math.cos(yaw))>0.5;BK.box(1.6,0.45,0.5,0x5c4632,x,y+0.225,z,yaw);famSpot('bench',x,y,z,yaw,0.9);
    SOLIDS.push({x,z,hx:c?0.8:0.25,hz:c?0.25:0.8});for(const s of [-0.4,0.4])spot(R,x+Math.cos(yaw)*s,z-Math.sin(yaw)*s,y,yaw,{sit:1})};
  const lamp=(x,z,y)=>{LK.cyl(0.07,0.1,5,8,0x2f3236,x,y+2.5,z);LK.box(0.5,0.2,0.5,0x2f3236,x,y+5.05,z);LK.lit(new THREE.BoxGeometry(0.4,0.05,0.4),0xfff1c8,x,y+4.93,z);
    famSpot('lamp',x,y,z,0);SOLIDS.push({x,z,hx:0.15,hz:0.15})};
  const planter=(x,z,y,yaw)=>{const c=Math.abs(Math.cos(yaw||0))>0.5;F.box(2.0,0.5,0.9,'brick',x,y+0.25,z,yaw||0);F.box(1.84,0.04,0.74,0x3b2a1e,x,y+0.49,z,yaw||0);
    for(const s of [-0.6,0,0.6]){const a=x+Math.cos(yaw||0)*s,b=z-Math.sin(yaw||0)*s;F.geo(new THREE.IcosahedronGeometry(0.3+0.06*(s===0),1),s?0x3f6b34:0x4d7a3a,a,y+0.72,b);
      for(let i=0;i<3;i++)F.box(0.07,0.07,0.07,[0xc94c6a,0xe8b923,0xf2efe6][i],a+Math.cos(i*2.1)*0.2,y+0.95,b+Math.sin(i*2.1)*0.2)}
    SOLIDS.push({x,z,hx:c?1.0:0.45,hz:c?0.45:1.0})};
  const table=(R,x,z,y,umb,col)=>{T.cyl(0.33,0.33,0.04,14,0xd9d2bf,x,y+0.74,z);T.cyl(0.04,0.05,0.72,6,DK,x,y+0.37,z);T.cyl(0.22,0.22,0.03,10,DK,x,y+0.015,z);
    for(const s of [-1,1]){const cx=x+s*0.62;T.box(0.42,0.05,0.42,col||0x2f4a3a,cx,y+0.45,z);T.box(0.05,0.45,0.42,col||0x2f4a3a,cx+s*0.2,y+0.7,z);T.box(0.36,0.43,0.04,DK,cx,y+0.22,z);
      spot(R,cx-s*0.05,z,y,-s*Math.PI/2,{sit:1})}
    if(umb){T.cyl(0.02,0.02,2.3,4,0xe9e6dc,x,y+1.15,z);T.cyl(0.02,1.2,0.42,8,umb,x,y+2.2,z)}SOLIDS.push({x,z,hx:0.95,hz:0.35})};
  const picnic=(R,tx,tz)=>{const ty=G(tx,tz);famSpot('picnic',tx,ty,tz,0);SOLIDS.push({x:tx,z:tz,hx:0.95,hz:0.8});
    PK.box(1.8,0.05,0.75,0xa6743e,tx,ty+0.76,tz);for(const sz of [-0.6,0.6])PK.box(1.8,0.05,0.28,0xa6743e,tx,ty+0.45,tz+sz);for(const lx of [-0.7,0.7])PK.box(0.07,0.76,1.4,0x8a5e30,tx+lx,ty+0.38,tz);
    for(const k of [-0.55,0.55]){spot(R,tx+k,tz-0.64,ty,0,{sit:1});spot(R,tx+k,tz+0.64,ty,Math.PI,{sit:1})}};
  // an iron rail like the square's along z from x a to b (or along x at a fixed x, from z a to b), y its foot
  const railX=(a,b,z,yf)=>{const n=Math.max(1,Math.round((b-a)/2));for(let i=0;i<=n;i++){const x=a+(b-a)*i/n,y=yf(x);F.box(0.05,1.0,0.05,IRON,x,y+0.5,z);if(!(i%4))F.cyl(0.05,0.05,0.08,8,0xb08d3a,x,y+1.04,z)}
      for(let i=0;i<n;i++){const x0=a+(b-a)*i/n,x1=a+(b-a)*(i+1)/n,y=(yf(x0)+yf(x1))/2;for(const dy of [0.96,0.46])F.box(x1-x0,0.05,0.06,IRON,(x0+x1)/2,y+dy,z)}
      SOLIDS.push({x:(a+b)/2,z,hx:(b-a)/2,hz:0.2})},
    railZ=(a,b,x,y)=>{const n=Math.max(1,Math.round(Math.abs(b-a)/2));for(let i=0;i<=n;i++)F.box(0.05,1.0,0.05,IRON,x,y+0.5,a+(b-a)*i/n);
      for(const dy of [0.96,0.46])F.box(0.06,0.05,Math.abs(b-a),IRON,x,y+dy,(a+b)/2);SOLIDS.push({x,z:(a+b)/2,hx:0.2,hz:Math.abs(b-a)/2})};

  // ---------- the promenade ----------
  // pavers from the coping back to its land side, a granite coping along the water, the rail on it; open at the steps
  // (x 9), the pier (28), the overlooks (42, 89) and the marina's gangway (72)
  const GAPS=[[6.9,11.1],[26.7,29.3],[38.6,45.4],[70.6,73.4],[85.6,92.4]],runs=[];{let a=WF.x0+0.4;for(const [g0,g1] of GAPS){runs.push([a,g0]);a=g1}runs.push([a,WF.x1])}
  sqSheet(K,pav,WF.x0,WF.x1,zN,zS,py,1.5);
  for(let x=WF.x0;x<WF.x1;x+=8){const x1=Math.min(WF.x1,x+8);walkPad((x+x1)/2,(zN+zS)/2,(x1-x)/2,(zS-zN)/2,0,0,{l:0.06});if(x<36)walkPad((x+x1)/2,zN+0.6,(x1-x)/2,0.6,0,WF.y0)}
  for(const [a,b] of runs){for(let x=a;x<b-0.01;x+=6){const x1=Math.min(b,x+6),m=(x+x1)/2,top=py(m,zN+0.2)+0.08,yb=Math.min(G(x,zN-0.4),G(m,zN-0.4),G(x1,zN-0.4))-0.3;
      F.box(x1-x+0.02,top-yb,0.6,'ashlar',m,(top+yb)/2,zN)}
    railX(a+0.2,b-0.2,zN+0.15,x=>py(x,zN+0.2)+0.08)}
  // steps down to the beach below the Landing, granite between ashlar cheeks
  {const sx=9,ty=py(sx,zN+0.2),yb=G(sx,zN-4.6),n=Math.max(8,Math.round((ty-yb)/0.19)),run=0.3,rise=(ty-yb)/n,L=n*run;
    for(let k=0;k<n;k++){const z=zN-0.3-(n-k-0.5)*run,y=yb+rise*(k+1);F.box(3.0,y-yb+0.3,run+0.02,GRAN,sx,(y+yb-0.3)/2,z)}
    for(const s of [-1,1]){F.box(0.6,ty-yb+0.6,L+0.6,'ashlar',sx+s*1.8,(ty+yb)/2,zN-L/2);SOLIDS.push({x:sx+s*1.8,z:zN-L/2,hx:0.3,hz:L/2+0.3})}
    walkPad(sx,zN-0.3-L/2,1.5,L/2,0,yb,{rise:ty-yb})}
  // the overlooks: timber decks on posts out over the bank, railed round, a bench and a coin-op viewer on each
  for(const ox of [42,89]){const y=py(ox,zN+0.2),oz=zN-2;F.box(7,0.14,4,'deckG',ox,y-0.07,oz);F.box(7,0.3,0.12,WD,ox,y-0.29,zN-3.95);
    for(const dx of [-3.4,0,3.4])for(const dz of [-3.9,-0.2]){const g=G(ox+dx,zN+dz)-0.3;F.box(0.18,y-g,0.18,WD,ox+dx,(y+g)/2-0.07,zN+dz)}
    railX(ox-3.4,ox+3.4,zN-3.85,()=>y);for(const s of [-1,1])railZ(zN-3.85,zN-0.1,ox+s*3.45,y);
    bench(roomOf(ox),ox-1.4,zN-2.6,y,Math.PI);F.box(0.12,1.1,0.12,DK,ox+2.2,y+0.55,zN-3.2);F.box(0.32,0.26,0.42,0x3d5a6b,ox+2.2,y+1.25,zN-3.2);
    for(const s of [-1,1])F.cyl(0.06,0.06,0.14,8,DK,ox+2.2+s*0.08,y+1.3,zN-3.45,0,Math.PI/2);spot(roomOf(ox),ox+2.2,zN-2.75,y,Math.PI);spot(roomOf(ox),ox+0.8,zN-3.4,y,Math.PI);
    walkPad(ox,oz,3.5,2,0,y);fxDecl('Overlook',ox,oz,3.6,2.1)}
  // benches facing the water, lamps along the land side, planters, people at the rail
  for(const x of [14,20,34,50,56,64,78,84,96]){const z=zN+1.0;bench(roomOf(x),x,z,py(x,z),Math.PI)}
  for(const x of [6,22,34,48,62,76,90,100]){const z=zS-0.35;lamp(x,z,py(x,z))}
  for(const x of [24.5,41,55,87,98]){const z=zS-0.6;planter(x,z,py(x,z),0)}
  for(const x of [5.8,17,31.5,36.5,47,53,60,67,76.5,94,99.5])spot(roomOf(x),x,zN+0.6,py(x,zN+0.6),Math.PI);

  // ---------- the fishing pier ----------
  // a ramp from the promenade down over the beach, a deck out over the water and a T-head at its end; timber piles that
  // stand up as the rail posts, two rails, lamps; it walks as a dock (BRIDGES) and is a wall to boats (BOAT_WALLS)
  {const X=WF.px,ZA=WF.pzA,ZB=WF.pzB,ZC=WF.pzC,YD=WF.py,Y0=WF.y0,[T0,T1]=WF.pT,yAt=z=>z>ZB?YD+(Y0-YD)*(z-ZB)/(ZA-ZB):YD;
    BRIDGES.push({x0:X,z0:ZA,x1:X,z1:ZB,hw:1.2,y:Y0,y1:YD,dock:1,drawn:1},{x0:X,z0:ZB,x1:X,z1:ZC,hw:1.2,y:YD,y1:YD,dock:1,drawn:1},{x0:T0,z0:ZC,x1:T1,z1:ZC,hw:1.6,y:YD,y1:YD,dock:1,drawn:1});
    for(const b of BRIDGES.slice(-3)){const dx=b.x1-b.x0,dz=b.z1-b.z0;b.len=Math.hypot(dx,dz);b.ux=dx/b.len;b.uz=dz/b.len}
    BOAT_WALLS.push({ax:X,az:ZA,bx:X,bz:ZC,r:1.7},{ax:T0,az:ZC,bx:T1,bz:ZC,r:2.0});
    const a=Math.atan2(Y0-YD,ZA-ZB);for(let z=ZA-0.1;z>ZC+1.6;z-=0.2){const y=yAt(z);F.box(2.4,0.06,0.18,'deckG',X,y-0.03,z,0,z>ZB?-a:0)}
    for(let x=T0+0.1;x<T1;x+=0.2)F.box(0.18,0.06,3.2,'deckG',x,YD-0.03,ZC);
    for(const u of [-0.9,0,0.9]){mainRod(F,[X+u,Y0-0.2,ZA],[X+u,YD-0.2,ZB],0.09,0x5a4a38,4);F.box(0.12,0.25,ZB-ZC,0x5a4a38,X+u,YD-0.19,(ZB+ZC)/2)}
    // piles every 2.4 m up the sides, standing up as the rail's posts; the rails between
    const pile=(x,z,y)=>{const g=Math.min(G(x,z),WATER)-0.8;F.cyl(0.13,0.15,y+1.05-g,8,0x4d3f30,x,(y+1.05+g)/2,z);F.cyl(0.14,0.14,0.04,8,0xe8e6e0,x,y+1.07,z)};
    const zs=[];for(let z=ZA-0.15;z>ZC+1.5;z-=2.4)zs.push(z);zs.push(ZC+1.5);
    for(const s of [-1,1]){const x=X+s*1.25;zs.forEach(z=>pile(x,z,yAt(z)));for(let i=0;i<zs.length-1;i++)for(const dy of [1.0,0.55])mainRod(F,[x,yAt(zs[i])+dy,zs[i]],[x,yAt(zs[i+1])+dy,zs[i+1]],0.04,WD,4);
      SOLIDS.push({x,z:(ZA+ZC+1.5)/2,hx:0.08,hz:(ZA-ZC-1.5)/2})}
    const tp=(x0,z0,x1,z1)=>{const n=Math.max(1,Math.round(Math.hypot(x1-x0,z1-z0)/2.4));for(let i=0;i<=n;i++)pile(x0+(x1-x0)*i/n,z0+(z1-z0)*i/n,YD);
      for(const dy of [1.0,0.55])mainRod(F,[x0,YD+dy,z0],[x1,YD+dy,z1],0.04,WD,4);SOLIDS.push({x:(x0+x1)/2,z:(z0+z1)/2,hx:Math.abs(x1-x0)/2+0.08,hz:Math.abs(z1-z0)/2+0.08})};
    tp(T0+0.1,ZC-1.5,T1-0.1,ZC-1.5);tp(T0+0.1,ZC-1.5,T0+0.1,ZC+1.5);tp(T1-0.1,ZC-1.5,T1-0.1,ZC+1.5);tp(T0+0.1,ZC+1.5,X-1.25,ZC+1.5);tp(X+1.25,ZC+1.5,T1-0.1,ZC+1.5);
    // lamps on the rail, a life ring, a bench on the T-head, the sign over the way on
    for(const [x,z] of [[X+1.25,538],[X-1.25,527],[T0+0.5,ZC-1.2],[T1-0.5,ZC-1.2]]){F.cyl(0.05,0.06,2.6,8,0x2f3236,x,YD+1.3+1.05,z);F.lit(new THREE.SphereGeometry(0.16,8,6),0xffd27a,x,YD+3.75,z)}
    F.geo(new THREE.TorusGeometry(0.33,0.07,6,14),0xe8641c,X-1.32,YD+0.75,532,Math.PI/2);
    bench(RW,X,ZC-0.7,YD,Math.PI);for(const s of [-1,1]){F.box(0.14,3.1,0.14,WD,X+s*1.45,Y0+1.55,ZA+0.35);SOLIDS.push({x:X+s*1.45,z:ZA+0.35,hx:0.1,hz:0.1})}F.box(3.2,0.18,0.18,WD,X,Y0+3.0,ZA+0.35);
    famSign(['FISHING PIER','No Swimming · No Diving'],2.6,0.7,X,Y0+2.55,ZA+0.35,0,'#1f3a5f','#f1ead8');
    // anglers along the rails and at the T-head looking out; a rod or two leaning on the rail
    for(const z of [550,541,533,524])spot(RW,X+(z%2?1:-1)*0.85,z,yAt(z),(z%2?1:-1)*Math.PI/2);for(const x of [23,26,30,33])spot(RW,x,ZC-1.0,YD,Math.PI);
    for(const [x,z] of [[X+1.15,541],[T0+3,ZC-1.4]])mainRod(F,[x,yAt(z)+0.1,z],[x+(x>X?1.2:0),yAt(z)+2.6,z-1.6],0.012,0x2a2c2f,3)}

  // ---------- the Landing and the plazas at the foot of Main Street ----------
  // the Landing: brick between the causeway's foot and the fish shack, from the promenade to the beach road
  sqSheet(K,brk,WF.x0,12.5,zS,571.3,on,1.5);walkPad(8.55,(zS+571.3)/2,3.95,(571.3-zS)/2,0,0,{l:0.06});
  // a plaza each side of Main Street where its first shops stood: pavers, the east one round a fountain with benches,
  // planters and lamps; the west one a grove of shade trees in grates with benches and a round bed, beside the square
  sqSheet(K,pav,6.05,17,576.6,597.5,on,1.5);walkPad(11.5,587.05,5.5,10.45,0,0,{l:0.06});
  sqSheet(K,pav,-24,-6.05,580,597.5,on,1.5);walkPad(-15.03,588.75,8.97,8.75,0,0,{l:0.06});
  {const fx=11.5,fz=588,y=G(fx,fz)+0.06;for(let i=0;i<12;i++){const a=i*Math.PI/6,cx=fx+Math.cos(a)*2.3,cz=fz+Math.sin(a)*2.3,yl=Math.PI/2-a;
      F.box(1.24,0.55,0.32,'ashlar',cx,y+0.25,cz,yl);F.box(1.3,0.08,0.44,GRAN,cx,y+0.56,cz,yl)}
    F.cyl(0.4,0.55,1.2,10,GRAN,fx,y+0.6,fz);F.cyl(1.1,0.35,0.3,20,GRAN,fx,y+1.35,fz);F.cyl(0.05,0.12,0.4,8,GRAN,fx,y+1.65,fz);
    const wm=new THREE.MeshStandardMaterial({color:0x3f6a72,roughness:0.06,metalness:0,envMap:skyEnv,envMapIntensity:1.2}),fall=new THREE.MeshBasicMaterial({color:0xd6ecf2,transparent:true,opacity:0.32,depthWrite:false,side:THREE.DoubleSide});
    const wd=new THREE.Mesh(new THREE.CircleGeometry(2.2,24).rotateX(-Math.PI/2),wm);wd.position.set(fx,y+0.4,fz);scene.add(wd);
    const fm=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.12,1.1,20,1,true),fall);fm.position.set(fx,y+0.95,fz);scene.add(fm);
    for(let i=0;i<5;i++){const a=i*1.257+0.3;spot(RP,fx+Math.cos(a)*2.45,fz+Math.sin(a)*2.45,y+0.12,Math.atan2(Math.cos(a),Math.sin(a)),{sit:1})}
    SOLIDS.push({x:fx,z:fz,hx:2.4,hz:2.4});fxDecl('Plaza fountain',fx,fz,2.6,2.6);
    bench(RP,fx,583.4,y,0);bench(RP,fx,592.6,y,Math.PI);lamp(16.3,581.5,y);lamp(16.3,594.5,y);planter(8.5,596.3,y,0);planter(14.5,596.3,y,0);
    TREES.push(treeEntry('leafy',8.5,596.3,0.7,0.42,3,1.1),treeEntry('leafy',14.5,596.3,2.2,0.4,5,1.1))}
  {const y=G(-15,589)+0.06;for(const [x,z] of [[-10.5,584.5],[-19.5,584.5],[-10.5,594],[-19.5,594]]){TREES.push(treeEntry('leafy',x,z,(x*z)%6.3,0.6,((x+z)|0)&3,1.1));
      F.box(1.2,0.04,1.2,0x8a4a36,x,G(x,z)+0.08,z);F.box(1.0,0.03,1.0,DK,x,G(x,z)+0.1,z);walkPad(x,z,0.6,0.6,0,G(x,z)+0.1)}
    F.cyl(1.7,1.75,0.45,24,'brick',-15,y+0.22,589.25);F.cyl(1.55,1.55,0.04,20,0x3b2a1e,-15,y+0.45,589.25);for(let i=0;i<14;i++){const a=i*0.449;F.geo(new THREE.IcosahedronGeometry(0.28,1),i%3?0x4d7a3a:0xc94c6a,-15+Math.cos(a)*1.05,y+0.62,589.25+Math.sin(a)*1.05)}
    F.geo(new THREE.IcosahedronGeometry(0.55,1),0x3f6b34,-15,y+0.85,589.25);SOLIDS.push({x:-15,z:589.25,hx:1.75,hz:1.75});
    bench(RP,-15,584.6,y,0);bench(RP,-15,593.9,y,Math.PI);bench(RP,-21.5,589.25,y,Math.PI/2);lamp(-22.6,581.3,y);lamp(-22.6,596.6,y);lamp(-7.4,596.6,y)}

  // ---------- the shops ----------
  // six on mainLot (mainland.js, as Main Street's: glazed storefront, awning, sign, a furnished room you can walk into),
  // facing the water; some with a gable roof over the parapet. Each moves as one in the map editor (fxDecl), with what
  // stands out front
  const n0=mainSignList.length,shop=(nm,x,z,w,d,h,face,col,awn,si,wl,roof,fx0,fx1,fz0,fz1)=>{mainLot(T,x,z,w,d,h,col,face,awn,si,wl);
    if(roof){const y=rmGroundMax(x,z,face,w,d)+0.03+h+0.8,rise=roof[1],hw=w/2+0.3,ra=Math.atan2(rise,hw),rl=Math.hypot(rise,hw),fs=Math.sin(face),fc=Math.cos(face);
      for(const s of [-1,1])T.box(rl+0.05,0.12,d+0.6,roof[0],x+fc*s*hw/2,y+rise/2,z-fs*s*hw/2,face,0,-s*ra);
      for(const s of [-1,1])T.geo(famGable(w,rise,0.2),wl,x+fs*s*(d/2-0.1),y,z+fc*s*(d/2-0.1),face+Math.PI/2);T.box(0.26,0.16,d+0.7,0x3a3d40,x,y+rise+0.02,z,face)}
    fxDecl(nm,(fx0+fx1)/2,(fz0+fz1)/2,(fx1-fx0)/2,(fz1-fz0)/2)};
  const SEAM=famTint('seam',0x3d4245),RED=famTint('seam',0x4a2420);
  // the beach road's line east of Main Street (ISLAND_ROADS) and a point o metres to its right (south) at t metres along
  // its last stretch, where the shops there stand
  const R2=[36,582],U2=[22.5/Math.hypot(22.5,4.6),4.6/Math.hypot(22.5,4.6)],at2=(t,o)=>[R2[0]+U2[0]*t-U2[1]*o,R2[1]+U2[1]*t+U2[0]*o],F2=Math.atan2(U2[1],-U2[0]);
  // the Salt & Line fish shack on the Landing, its front on the promenade; picnic tables beside it in the park
  shop('Salt & Line',16.5,567.2,8,7.6,5.4,Math.PI,0xe9e4d6,0x1f3a5f,32,'sidingG',[RED,2.6],12.3,20.7,563.1,571.2);
  // the Lakeside Bakery on the corner by the plaza, café tables on its walk; its sidewalk along the beach road
  shop('Lakeside Bakery',22,585.5,8.5,12,7.7,Math.PI,0xe9e4d6,0x2f6b4f,0,'brick',null,17.6,26.4,577.9,591.7);
  sqSheet(K,walk,17,26.25,576.55,579.5,on,1.5);walkPad(21.63,578.03,4.63,1.48,0,0,{l:0.06});for(const x of [19.3,24.9])table(RB,x,578.6,on(x,578.6),0x2f6b4f,0x2f4a3a);
  // the pharmacy and the gift shop along the road's last stretch, turned to it, a 10 ft sidewalk in front (far enough
  // apart that their editor boxes, square to the world, don't overlap)
  const box2=(t0,t1,o0,o1)=>{const P=[at2(t0,o0),at2(t1,o0),at2(t0,o1),at2(t1,o1)],X=P.map(p=>p[0]),Z=P.map(p=>p[1]);return [Math.min(...X),Math.max(...X),Math.min(...Z),Math.max(...Z)]};
  {const [a,b]=at2(8,11.5);shop('Lakeside Pharmacy',a,b,9,12,7.1,F2,0xe9e4d6,0x2a4f7a,6,'plaster',null,...box2(3.3,12.7,5.4,17.6))}
  {const [a,b]=at2(19.1,11);shop('Shoreline Gifts',a,b,7.6,11,5.6,F2,0xf2efe6,0x2a6f76,33,'sidingW',['shingles',2.8],...box2(15.2,23.1,4.1,16.6))}
  {const L=23,g=new THREE.PlaneGeometry(L,3,Math.ceil(L/1.5),2);g.rotateX(-Math.PI/2);const p=g.attributes.position;
    for(let i=0;i<p.count;i++){const [x,z]=at2(p.getX(i)+L/2,p.getZ(i)+4);p.setXYZ(i,x,on(x,z)-0.01,z)}K.put(walk,g);const [mx,mz]=at2(L/2,4);walkPad(mx,mz,1.5,L/2,Math.atan2(U2[0],U2[1]),0,{l:0.05});
    // out front: postcard spinners and a rack of tees at the gift shop, a sandwich board at the pharmacy
    for(const t of [16,22.2]){const [x,z]=at2(t,4.55),y=on(x,z);T.cyl(0.04,0.04,1.5,6,DK,x,y+0.75,z);for(let k=0;k<4;k++)T.box(0.32,0.42,0.32,[0xe0b83a,0x2f6db0,0xc8402e,0xece6d6][k],x,y+0.55+k*0.25,z,k*0.4);SOLIDS.push({x,z,hx:0.25,hz:0.25})}
    {const [x,z]=at2(9.3,4.6),y=on(x,z);T.box(0.6,0.9,0.5,0x23402f,x,y+0.45,z,F2,0.2);SOLIDS.push({x,z,hx:0.3,hz:0.3})}}
  // the corner between the bakery and the pharmacy: a pocket of pavers with a shade tree, a bench and two café tables
  {const S=new THREE.Shape([[26.25,577.45],[35.5,584.45],[34.6,591.5],[26.25,591.5]].map(([x,z])=>new THREE.Vector2(x,-z))),g=new THREE.ShapeGeometry(S);g.rotateX(-Math.PI/2);
    const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,on(p.getX(i),p.getZ(i))+0.01);K.put(pav,g);walkPad(30.43,587.25,4.18,4.25,0,0,{l:0.07});walkPad(30.04,582.07,1.4,5.0,0.923,0,{l:0.07});
    table(RB,27.6,583.4,on(27.6,583.4)+0.01,0xe9e1cc,0x2f6b4f);table(RB,31,586,on(31,586)+0.01,0x2a6f76,0x2f6b4f);bench(RB,28,589.6,on(28,589.6)+0.01,Math.PI/2);
    TREES.push(treeEntry('leafy',31.2,589.3,1.7,0.62,1,1.15));F.box(1.2,0.04,1.2,0x8a4a36,31.2,on(31.2,589.3)+0.02,589.3)}
  // The Rusty Anchor and Paddle & Pedal on the promenade by the marina: a patio of tables under umbrellas at the bar,
  // a rack of kayaks and a rack of bikes at the rentals
  shop('The Rusty Anchor',71,571.5,8,11,7.4,Math.PI,0xd8d2c4,0xb8322a,34,'brickOld',[SEAM,2.9],66.6,75.4,563.1,577.4);
  shop('Paddle & Pedal',80,571.5,8.4,11,5.4,Math.PI,0xf2efe6,0xd08a22,35,'sidingB',['shingles',2.7],75.6,84.4,563.1,577.4);
  sqSheet(K,pav,66.6,84.4,zS,566,py,1.5);walkPad(75.5,564.5,8.9,1.5,0,0,{l:0.06});
  for(const x of [68.4,73.6]){table(RA,x,564.4,py(x,564.4),x<71?0x1f3a5f:0xb8322a,0x3a3d40)}
  {const y=py(77.8,564.3);for(const s of [-1,1])for(const t of [-1,1]){T.box(0.06,1.5,0.06,0x9aa0a4,77.8+s*1.2,y+0.75,564.3+t*0.4)}for(const h of [0.5,1.05])for(const t of [-1,1])T.box(2.5,0.05,0.05,0x9aa0a4,77.8,y+h,564.3+t*0.4);
    [[0.62,0xd8452a],[1.17,0xe8b923],[1.6,0x2a8a8a]].forEach(([h,c])=>{const g=new THREE.SphereGeometry(1,14,6);g.scale(1.8,0.17,0.32);T.geo(g,c,77.8,y+h,564.3)});SOLIDS.push({x:77.8,z:564.3,hx:1.4,hz:0.5})}
  {const bx=82.4,y=py(bx,564.4);T.box(2.2,0.05,0.05,0x9aa0a4,bx,y+0.4,564.5);for(let i=0;i<3;i++){const x=bx-0.8+i*0.8,c=[0x1f3a5f,0xb8322a,0x2f6b4f][i];
      for(const dz of [-0.48,0.48])T.geo(new THREE.TorusGeometry(0.33,0.03,6,16),0x1e1f21,x,y+0.34,564.4+dz,Math.PI/2);
      mainRod(T,[x,y+0.34,563.92],[x,y+0.75,564.35],0.025,c,4);mainRod(T,[x,y+0.75,564.35],[x,y+0.34,564.88],0.025,c,4);mainRod(T,[x,y+0.34,563.92],[x,y+0.34,564.5],0.025,c,4);
      T.box(0.12,0.05,0.24,DK,x,y+0.85,564.55);T.box(0.45,0.03,0.03,DK,x,y+0.95,564.0)}SOLIDS.push({x:bx,z:564.4,hx:1.2,hz:0.6})}

  // ---------- the park ----------
  // lawn between the promenade and the beach road: brick paths across it, shade trees, picnic tables and benches, its sign
  sqSheet(K,brk,28,30,zS,572.2,on,1.5);walkPad(29,(zS+572.2)/2,1,(572.2-zS)/2,0,0,{l:0.06});
  sqSheet(K,brk,20.8,37.6,566,568,on,1.5);walkPad(29.2,567,8.4,1,0,0,{l:0.06});
  for(const [x,z,s,c] of [[23.2,564.9,0.82,2],[35.6,564.9,0.78,4],[33.4,570.6,0.7,1],[25.4,571.0,0.66,3]])TREES.push(treeEntry('leafy',x,z,(x*1.7)%6.3,s,c,1.1));
  picnic(RF,23.2,569.3);picnic(RF,34.6,573.4);bench(RW,25.6,565.2,on(25.6,565.2),0);bench(RW,32.4,568.8,on(32.4,568.8),Math.PI);
  famSign(['WATERFRONT PARK','Fishing Pier · Picnic Area'],3.0,0.9,31.6,G(31.6,572.6)+1.7,572.6,0.9,'#2f5a33','#ffffff');
  for(const s of [-1,1])F.box(0.1,2.2,0.1,0x8a8a86,31.6+Math.cos(0.9)*s*1.35,G(31.6,572.6)+1.1,572.6-Math.sin(0.9)*s*1.35);
  // strollers on the promenade and the pier, sitting on the grass
  for(const [x,z] of [[31,564.6],[36.4,568.2]])spot(RW,x,z,G(x,z),(x*3)%6.3,{sit:1});
  rmAdd(RW,RW.r,[0,10,18,28]);rmAdd(RE,RE.r,[0,6,12,18]);rmAdd(RP,RP.r,[0,4,8,12]);rmAdd(RB,RB.r,[0,2,4,6]);rmAdd(RF,RF.r,[0,2,4,6]);rmAdd(RA,RA.r,[0,2,3,4]);
  treeGroup('waterfront',TREES);K.add();famAdd(F);famAdd(T);famAddSpot('lamp',LK);famAddSpot('bench',BK);famAddSpot('picnic',PK);mainSignsAdd(n0);rmWinsBuild()})();
