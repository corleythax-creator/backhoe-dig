// Corley's Island: Dexter's dirt bike. It stands on its kickstand at the start line of his track (TRK_* in terrain.js; the
// track's tyres, bales and sign in dexter.js). Walk up and Get in to ride it (Bike mode): the left stick is the throttle
// (pull back to brake, then it backs up at a walk) and the bars. It leans into the turns, the forks and shock soak up the
// whoops, and it leaves the ground off the lip of a jump and flies until the ground comes back up to meet it; gas in the
// air lifts the front, the brake drops it. It goes anywhere the other machines can.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// a 250 four-stroke: 58 in between the axles, 28 in tyres, the forks raked back 18 degrees
const BK_WB=1.48,BK_WR=0.36,BK_RAKE=0.32,BK_FORK=0.706,BK_PIV=[0.56,-0.12];
// the circles along it, for getting on (wkNear) and bumping into things
const BK_C=[-0.45,0.45],BK_R=0.45;
// parked behind the start line on the south straight, facing down the track (west)
const BK_START={x:TRK_B[0]-0.2,z:TRK_A[1]+TRK_R,yaw:-Math.PI/2};
// where it is and how it moves (v along it, vy up), how it sits (pitch: nose up, lean: + to the right), the bars
// (steer: + right), the suspension (comp: metres squashed, cv its speed) and the wheels' turn
const bk={x:0,z:0,y:0,yaw:0,v:0,vy:0,air:false,pitch:0,lean:0,steer:0,comp:0,cv:0,rollF:0,rollR:0,run:0,thr:0};
const bike=new THREE.Group();scene.add(bike);
const bkBody=new THREE.Group(),bkArm=new THREE.Group(),bkHead=new THREE.Group(),bkSteer=new THREE.Group(),bkWF=new THREE.Group(),bkWR=new THREE.Group(),bkStand=new THREE.Group();
(function(){
  const mat=M(0xffffff,{vertexColors:true,flatShading:false,shininess:60,specular:0x404040});
  const mesh=(K,parent)=>{const m=new THREE.Mesh(famMerge(K.solid),mat);m.castShadow=true;m.receiveShadow=true;parent.add(m)};
  const Y=0xf2b705,BLK=0x1b1c1e,ALU=0xb9bdc1,DARK=0x3a3c40,GOLD=0xc9a227,PIPE=0x8c7a66;
  // a bar from a to b ([y, z] seen from the side) at x, w wide and t thick
  const strut=(K,col,x,a,b,w,t)=>{const dy=b[0]-a[0],dz=b[1]-a[1];K.box(w,t,Math.hypot(dy,dz),col,x,(a[0]+b[0])/2,(a[1]+b[1])/2,0,-Math.atan2(dy,dz))};
  // a knobby tyre on a black rim, laced with spokes, round the axle (x)
  const wheel=g=>{const K=famKit(),R=BK_WR;
    K.geo(new THREE.TorusGeometry(R-0.065,0.062,8,26),BLK,0,0,0,Math.PI/2);
    for(let i=0;i<30;i++){const a=i/30*Math.PI*2;K.box(i%2?0.13:0.09,0.035,0.05,0x252628,i%2?0:(i%4?0.03:-0.03),Math.cos(a)*(R-0.008),Math.sin(a)*(R-0.008),0,a)}
    K.geo(new THREE.TorusGeometry(R-0.125,0.016,5,26),BLK,0,0,0,Math.PI/2);K.cyl(0.05,0.05,0.13,10,ALU,0,0,0,0,0,Math.PI/2);
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=(R-0.125+0.05)/2;K.box(0.006,R-0.175,0.006,0x9a9ea2,i%2?0.03:-0.03,Math.cos(a)*r,Math.sin(a)*r,0,a)}
    mesh(K,g)};
  // the frame, engine, tank, seat, plastics and exhaust ride on the springs
  {const K=famKit();
    for(const x of [-0.11,0.11]){strut(K,ALU,x,[0.98,0.48],[BK_PIV[0],BK_PIV[1]],0.05,0.09);strut(K,ALU,x,[0.9,-0.1],[0.98,-0.62],0.03,0.04);K.box(0.1,0.03,0.06,ALU,x*1.9,0.43,-0.03)}
    strut(K,ALU,0,[0.96,0.5],[0.4,0.3],0.06,0.06);K.cyl(0.05,0.05,0.22,10,ALU,0,1.03,0.52,0,-BK_RAKE);
    K.box(0.26,0.34,0.42,DARK,0,0.42,0.04);K.box(0.3,0.2,0.22,BLK,0,0.4,0.04);K.box(0.22,0.24,0.22,0x5a5d61,0,0.69,0.15,0,0.35);
    for(let i=0;i<5;i++)K.box(0.25,0.012,0.2,0x6a6d71,0,0.6+i*0.045,0.14+i*0.016,0,0.35);
    for(const s of [-1,1]){K.box(0.05,0.24,0.18,0x5f6266,s*0.15,0.78,0.37);K.box(0.03,0.27,0.34,Y,s*0.2,0.86,0.35,0,0.25,s*0.12)}
    K.box(0.3,0.2,0.42,Y,0,0.99,0.27,0,0.12);K.cyl(0.035,0.035,0.03,10,BLK,0,1.1,0.33);
    K.box(0.25,0.1,0.92,BLK,0,1.03,-0.3,0,0.03);K.box(0.22,0.24,0.34,BLK,0,0.82,-0.4);
    for(const s of [-1,1])K.box(0.03,0.22,0.38,Y,s*0.15,0.88,-0.56,0,-0.1);
    K.box(0.22,0.035,0.64,Y,0,1.0,-0.92,0,0.22);
    // the shock, its gold spring; the header round the right side to the silencer
    K.cyl(0.04,0.04,0.36,10,GOLD,0,0.72,-0.2,0,0.5);K.cyl(0.022,0.022,0.44,8,ALU,0,0.71,-0.2,0,0.5);
    strut(K,PIPE,-0.1,[0.7,0.3],[0.5,0.16],0.05,0.05);strut(K,PIPE,-0.14,[0.5,0.16],[0.76,-0.3],0.05,0.05);
    K.cyl(0.058,0.058,0.46,12,ALU,-0.16,0.84,-0.56,0,-(Math.PI/2-0.2));K.cyl(0.04,0.04,0.03,10,BLK,-0.16,0.89,-0.79,0,-(Math.PI/2-0.2));
    mesh(K,bkBody)}
  bike.add(bkBody);
  // the swingarm, pivoted on the frame, carries the back wheel and the chain
  {const K=famKit();for(const x of [-0.1,0.1])K.box(0.04,0.07,0.66,ALU,x,0,-0.33);K.box(0.012,0.03,0.7,0x2a2a2a,0.13,0.02,-0.33);mesh(K,bkArm)}
  bike.add(bkArm);
  // the steering: forks, clamps, bars, number plate and front fender, raked back round the head tube
  bkHead.position.set(0,1.03,0.52);bkHead.rotation.x=-BK_RAKE;bkBody.add(bkHead);bkHead.add(bkSteer);
  {const K=famKit();
    K.box(0.3,0.05,0.12,ALU,0,0.1,0.03);K.box(0.3,0.05,0.12,ALU,0,-0.13,0.03);
    for(const x of [-0.11,0.11]){K.cyl(0.034,0.034,0.42,10,BLK,x,-0.05,0.03);K.cyl(0.027,0.027,0.44,10,GOLD,x,-0.46,0.03);K.box(0.05,0.08,0.08,BLK,x,-0.69,0.02)}
    for(const x of [-0.06,0.06])K.box(0.03,0.08,0.03,BLK,x,0.16,0.02);K.cyl(0.014,0.014,0.8,8,ALU,0,0.21,-0.02,0,0,Math.PI/2);
    for(const x of [-0.35,0.35])K.cyl(0.021,0.021,0.13,8,BLK,x,0.21,-0.02,0,0,Math.PI/2);K.box(0.2,0.045,0.05,Y,0,0.24,-0.02);
    K.box(0.27,0.25,0.02,Y,0,0.0,0.12,0,0.15);K.box(0.2,0.14,0.022,0xf4f3ef,0,0.0,0.125,0,0.15);
    K.box(0.15,0.03,0.52,Y,0,-BK_FORK+BK_WR+0.1,0.06,0,BK_RAKE-0.1);
    mesh(K,bkSteer)}
  bkSteer.add(bkWF);wheel(bkWF);
  bkWR.position.set(0,BK_WR,-BK_WB/2);bike.add(bkWR);wheel(bkWR);
  // the kickstand, down on the left while it is parked
  {const K=famKit();K.box(0.025,0.46,0.025,DARK,0.1,-0.21,0,0,0,0.42);mesh(K,bkStand)}
  bkStand.position.set(0.12,0.46,-0.1);bike.add(bkStand);
})();
function bikeReset(){Object.assign(bk,BK_START,{v:0,vy:0,air:false,steer:-0.3,lean:-0.15,comp:0,cv:0});bk.y=surfAt(bk.x,bk.z);bk.pitch=0;bikePose()}
function bikePose(){const b=bk;bike.position.set(b.x,b.y,b.z);bike.rotation.set(-b.pitch,b.yaw,b.lean,'YXZ');
  const c=b.comp;bkBody.position.y=-c;bkSteer.rotation.y=-b.steer;bkWF.position.set(0,-BK_FORK+c/Math.cos(BK_RAKE),0);
  bkArm.position.set(0,BK_PIV[0]-c,BK_PIV[1]);bkArm.rotation.x=Math.asin((BK_WR-BK_PIV[0]+c)/0.62);
  bkWF.rotation.x=b.rollF;bkWR.rotation.x=b.rollR;bkStand.visible=!b.run&&!b.v}
const bkV=new THREE.Vector3();
// every frame: thr (+ gas, - brake and back up) and steer (+ right); both 0 when nobody is on it
function bikeTick(dt,thr,steer){
  const b=bk,on=mode==='bike'&&wk.inside==='bike'&&!bench.on;if(!on){thr=0;steer=0}
  b.run=on?1:0;b.thr=thr;
  const ground=()=>{const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw),h=BK_WB/2,f=surfAt(b.x+sy*h,b.z+cy*h),r=surfAt(b.x-sy*h,b.z-cy*h);return [(f+r)/2,Math.atan2(f-r,BK_WB)]};
  let [gm,gp]=ground();
  const mudN=mudAt(b.x,b.z),grip=1-0.45*mudN*TU.mudDrag;
  // the engine, the brakes, the hill and the drag of the dirt, with both wheels down
  if(!b.air){let a=0;
    if(thr>0)a=thr*TU.bkPull*7*Math.max(0,1-Math.max(0,b.v)/TU.bkSpd)*grip;
    else if(thr<0)a=b.v>0.2?thr*9:b.v>-1.2?thr*1.5:0;
    a-=9.8*Math.sin(gp)*(on?1:0)+(Math.abs(b.v)>0.05?Math.sign(b.v)*(0.3+0.8*mudN):0)+0.01*b.v*Math.abs(b.v);
    b.v+=a*dt;if(!on||!thr&&Math.abs(b.v)<0.1){if(!on)b.v*=Math.exp(-dt*3);if(Math.abs(b.v)<0.1)b.v=0}}
  // the bars: full lock at a crawl, less the faster it goes; it turns about the back wheel, leaning into the turn
  const lock=on||b.v?TU.bkLock/(1+Math.abs(b.v)*0.16):0;
  b.steer+=((on||b.v?steer*lock:-0.3)-b.steer)*Math.min(1,dt*7);
  const w=b.air?0:b.v*Math.tan(b.steer)/BK_WB*grip;b.yaw-=w*dt;
  b.lean+=((b.air?0:on||b.v?clamp(Math.atan(b.v*w/9.8),-0.75,0.75):-0.15)-b.lean)*Math.min(1,dt*6);
  b.x+=Math.sin(b.yaw)*b.v*dt;b.z+=Math.cos(b.yaw)*b.v*dt;
  // on the islands and decks, out of buildings, blocks and the other machines
  [b.x,b.z]=landClamp(b.x,b.z,1.0,0.5);
  if(blkPush(b,BK_C,BK_R))b.v*=0.5;
  if(hvPush(b,BK_C,BK_R))b.v*=0.6;
  for(const lz of BK_C){const cx=b.x+Math.sin(b.yaw)*lz,cz=b.z+Math.cos(b.yaw)*lz;
    for(const [o,cs,r] of [[st,EX_C,EX_R],[tr,TR_C,TR_R],[mw,MW_C,MW_R],[sk,SK_C,SK_R]])for(const q of cs){const dx=cx-o.x-Math.sin(o.yaw)*q,dz=cz-o.z-Math.cos(o.yaw)*q,d=Math.hypot(dx,dz),m=BK_R+r;
      if(d<m&&d>1e-3){b.x+=dx/d*(m-d);b.z+=dz/d*(m-d);b.v*=0.6}}}
  [gm,gp]=ground();
  // up and down: it follows the ground until the ground drops away faster than it would fall, then flies
  const vy0=b.vy;
  if(b.air){b.vy-=9.8*dt;b.y+=b.vy*dt;b.pitch=clamp(b.pitch+(thr*1.1-0.12)*dt,-0.8,0.9);
    if(b.y<=gm){const hit=Math.max(0,b.v*Math.sin(gp)-b.vy);b.air=false;b.y=gm;b.vy=0;b.cv+=hit*0.7;b.v*=Math.max(0.55,Math.cos(b.pitch-gp));
      if(hit>2.5){bike.localToWorld(bkV.set(0,0,-BK_WB/2));dirtThud(bkV,Math.min(1,hit*0.08))}}}
  else{const ny=b.y+b.vy*dt-4.9*dt*dt;
    if(ny>gm+0.003&&Math.abs(b.v)>2.5&&dt<0.1){b.air=true;b.y=ny;b.vy-=9.8*dt}
    else{b.vy=dt>0?clamp((gm-b.y)/dt,-12,12):0;b.y=gm;b.pitch+=(gp-b.pitch)*Math.min(1,dt*14);b.cv+=Math.max(0,b.vy-vy0)*0.3}}
  // the springs: about 8 in of travel, quick to settle
  b.cv+=(-b.comp*120-b.cv*14)*dt;b.comp=clamp(b.comp+b.cv*dt,-0.04,0.2);if(b.comp>=0.2&&b.cv>0)b.cv=0;
  b.rollF+=b.v*dt/BK_WR;if(!b.air||thr>0)b.rollR+=(b.air?thr*12:b.v)*dt/BK_WR;
  // ruts and splashes under the back wheel
  if(!b.air&&Math.abs(b.v)>0.3){const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw),rx=b.x-sy*BK_WB/2,rz=b.z-cy*BK_WB/2;
    stampRut(rx,rz,b.yaw,0.07,0.35,dt);splashMud(rx,rz,b.yaw,b.v,0.08,0.5,dt)}
  bikePose();
  // the rider: on the seat, boots on the pegs, hands on the bars, leaning in with the bike; up on the pegs in the air
  if(wk.inside==='bike'){const up=b.air?0.12:0;bike.localToWorld(bkV.set(0,0.13-b.comp+up,-0.24));
    Object.assign(wk,{x:b.x,z:b.z,y:b.y,yaw:b.yaw});walker.position.copy(bkV);walker.rotation.set(-b.pitch,b.yaw,b.lean,'YXZ');
    walker.visible=!(mode==='bike'&&camMode==='cab');wkBody.position.y=0;wkBody.rotation.x=0.3;wkHead.rotation.x=-0.2;
    for(let s=0;s<2;s++){wkLegs[s].top.rotation.x=-0.85+up*2;wkLegs[s].low.rotation.x=1.15-up*2;wkArms[s].top.rotation.x=-1.05;wkArms[s].low.rotation.x=-0.4}}}
// the walker climbs on beside it (walker.js)
WK_RIDES.bike={o:bk,c:BK_C,r:BK_R,m:'bike',n:'dirt bike'};
bikeReset();
