// Corley's Island: Dexter's Island, west of the Family Island across a wide yellow steel haul bridge the machines can
// drive: a gravel yard with an equipment shed, an office trailer, a fuel tank, parked machines (a dozer, a wheel loader
// and a semi with a lowboy trailer; his skid steer, skid.js, is drivable), light towers, a cone course and dirt piles to practise on.
// The parked machines are models for now; they can be made drivable one at a time, as the skid steer was.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const dexGround=groundPatch(-275,-125,170,320,1.5,[TRK_BOX]);
// the dirt bike track's jump, whoops and berms need a finer mesh than the yard (terrain.js, trkH)
const trkGround=groundPatch(TRK_BOX[0],TRK_BOX[1],TRK_BOX[2],TRK_BOX[3],0.5,[]);
const DB=BRIDGES[3];
// parts placed in a machine's own frame (x across, z forward) at x0,z0 turned by yaw, standing on ground y0
function dexFrame(K,x0,z0,yaw,y0){const c=Math.cos(yaw),s=Math.sin(yaw),W=(lx,lz)=>[x0+lx*c+lz*s,z0-lx*s+lz*c];
  return {W,
    box:(w,h,d,col,lx,ly,lz,rx)=>{const [x,z]=W(lx,lz);K.box(w,h,d,col,x,y0+ly,z,yaw,rx||0)},
    cyl:(r0,r1,h,seg,col,lx,ly,lz,rx,rz)=>{const [x,z]=W(lx,lz);K.cyl(r0,r1,h,seg,col,x,y0+ly,z,yaw,rx||0,rz||0)},
    // a tyre with its rim, the axle across the machine
    wheel:(r,w,lx,ly,lz,rim)=>{const [x,z]=W(lx,lz);K.cyl(r,r,w,12,0x1d1d1f,x,y0+ly,z,yaw,0,Math.PI/2);K.cyl(r*0.55,r*0.55,w+0.04,8,rim||0xd9a404,x,y0+ly,z,yaw,0,Math.PI/2)},
    lit:(g,col,lx,ly,lz)=>{const [x,z]=W(lx,lz);K.lit(g,col,x,y0+ly,z,yaw)}}}
const DEX_Y=0xf2b705,DEX_D=0x2b2d30,DEX_GLASS=0x3c4a52;

// ---------- the haul bridge ----------
(function(){
  const K=famKit(),F=famBridge(DB,K,{depth:2.8,steel:0xd9a404,piers:[31,62]});famAdd(K);
  famSign(["DEXTER'S ISLAND"],5.0,1.1,DB.x0-1.2,DB.y+6.9,DB.z0,Math.PI/2,'#2b2d30','#f2b705');
  famSign(['FAMILY ISLAND'],5.0,1.1,DB.x1+1.2,DB.y+6.9,DB.z0,-Math.PI/2,'#2b2d30','#f2b705');
  // a steel portal at each end to hang the signs on, tall enough for a raised boom
  const P=famKit();for(const x of [DB.x0-1.2,DB.x1+1.2]){for(const s of [-1,1])P.box(0.4,7.5,0.4,0xd9a404,x,DB.y+3.75,DB.z0+s*(DB.hw+0.8));P.box(0.5,0.5,2*DB.hw+2,0xd9a404,x,DB.y+7.6,DB.z0)}
  famAdd(P);void F;
})();

// ---------- the yard ----------
(function(){
  const K=famKit(),G=(x,z)=>baseHeight(x,z);
  // equipment shed: blue-grey ribbed steel, a low roof, three roll-up doors facing the yard, a light over each
  {const X=-213,Z=226,W=22,D=12,H=6.5,y=G(X,Z),WALL=0x8fa3ad,RIB=0x7d919b,ROOF=0x6b7780,TRIM=0xc0392b;
    K.box(W+0.4,0.3,D+0.4,0x9b9a94,X,y+0.1,Z);K.box(W,H,D,WALL,X,y+H/2,Z);
    for(let x=X-W/2+0.3;x<X+W/2;x+=0.6)for(const s of [-1,1])K.box(0.12,H,0.06,RIB,x,y+H/2,Z+s*(D/2+0.03));
    for(let z=Z-D/2+0.3;z<Z+D/2;z+=0.6)for(const s of [-1,1])K.box(0.06,H,0.12,RIB,X+s*(W/2+0.03),y+H/2,z);
    K.geo(famGable(D,1.6,W),WALL,X,y+H,Z);const ra=Math.atan2(1.6,D/2),rl=Math.hypot(D/2,1.6)+0.6,mo=rl/2;
    for(const s of [-1,1])K.box(W+0.8,0.18,rl,ROOF,X,y+H+1.6+0.1-mo*Math.sin(ra),Z+s*mo*Math.cos(ra),0,s*ra);
    K.box(W+0.1,0.25,0.1,TRIM,X,y+H-0.1,Z+D/2+0.08);
    for(const dx of [-7.5,0,7.5]){const x=X+dx;K.box(4.6,5.1,0.08,0x4d5459,x,y+2.55,Z+D/2+0.07);K.box(4.4,4.9,0.1,0xd4d6d4,x,y+2.5,Z+D/2+0.1);
      for(let i=1;i<10;i++)K.box(4.4,0.04,0.12,0xa9aca9,x,y+i*0.49,Z+D/2+0.12);K.box(0.6,0.25,0.3,0x2b2b2b,x,y+5.5,Z+D/2+0.2);K.lit(new THREE.BoxGeometry(0.45,0.06,0.2),0xfff1c8,x,y+5.36,Z+D/2+0.22)}
    K.box(0.08,2.2,1.0,0x5a6268,X+W/2+0.07,y+1.1,Z+3);
    famSign(["DEXTER'S EQUIPMENT"],8,1.3,X,y+H+0.55,Z+D/2+0.12,0,'#2b2d30','#f2b705');
    SOLIDS.push({x:X,z:Z,hx:W/2+0.1,hz:D/2+0.15})}
  // the office trailer on blocks, with steps up to the door
  {const X=-180,Z=227,y=G(X,Z);for(const dx of [-5,-1.7,1.7,5])K.box(0.4,0.6,3,0x9b9a94,X+dx,y+0.3,Z);
    K.box(12,2.8,3.4,0xeeeeea,X,y+2,Z);K.box(12.1,0.15,3.5,0xb9b9b4,X,y+3.45,Z);
    for(const dx of [-4.2,-1.6,3.6])K.box(1.4,0.9,0.06,DEX_GLASS,X+dx,y+2.3,Z+1.72);K.box(0.95,2.0,0.06,0x8a9198,X+1.2,y+1.65,Z+1.72);
    for(let i=0;i<3;i++)K.box(1.2,0.18,0.35,0x8a8a86,X+1.2,y+0.45+i*0.3-0.15,Z+2.6-i*0.3);K.box(1.6,0.08,1.0,0x8a8a86,X+1.2,y+0.62+0.3,Z+2.2);
    famSign(['OFFICE'],2.2,0.55,X-1.6,y+3.05,Z+1.74,0,'#ffffff','#2b2d30');
    SOLIDS.push({x:X,z:Z,hx:6.1,hz:1.8})}
  // diesel tank on saddles, with its pump
  {const X=-193,Z=226,y=G(X,Z);for(const dx of [-1.4,1.4])K.box(0.4,0.9,2.0,0x8a8a86,X+dx,y+0.45,Z);
    K.cyl(1.05,1.05,4.2,12,0xd8d8d4,X,y+1.9,Z,0,0,Math.PI/2);K.cyl(1.07,1.07,0.4,12,DEX_Y,X,y+1.9,Z,0,0,Math.PI/2);
    K.box(0.6,1.4,0.4,0xc0392b,X+2.8,y+0.7,Z+1.0);K.box(0.05,0.05,0.9,DEX_D,X+2.8,y+1.1,Z+1.5,0,0.6);
    famSign(['DIESEL'],1.6,0.45,X,y+3.25,Z,0,'#c0392b','#ffffff');
    SOLIDS.push({x:X,z:Z,hx:2.4,hz:1.2},{x:X+2.8,z:Z+1.0,hx:0.35,hz:0.25})}
  // concrete pipe stacked by the office, Jersey barriers behind the shed
  for(const [dx,dy] of [[-1.3,0],[1.3,0],[0,1.1]]){const x=-168+dx,z=232,y=G(x,z)+0.65+dy;K.cyl(0.65,0.65,2.4,10,0xa9a6a0,x,y,z,0,Math.PI/2,0)}
  SOLIDS.push({x:-168,z:232,hx:2,hz:1.25});
  for(let i=0;i<9;i++){const x=-230+i*3.4,z=212,y=G(x,z);K.box(3.2,0.3,0.8,0xc9c6bf,x,y+0.15,z);K.box(3.2,0.55,0.55,0xc9c6bf,x,y+0.55,z);K.box(3.2,0.3,0.3,0xc9c6bf,x,y+0.95,z)}
  SOLIDS.push({x:-216.4,z:212,hx:15.4,hz:0.45});
  // two light towers on their trailers
  for(const [x,z] of [[-168,258],[-235,233]]){const y=G(x,z);K.box(1.4,0.7,2.6,DEX_Y,x,y+0.75,z);for(const s of [-1,1])K.cyl(0.35,0.35,0.25,8,0x1d1d1f,x+s*0.8,y+0.35,z,0,0,Math.PI/2);
    K.cyl(0.08,0.12,8,6,0x8a8a86,x,y+5.1,z);K.box(2.2,0.15,0.15,0x8a8a86,x,y+9,z);for(const dx of [-0.8,-0.27,0.27,0.8]){K.box(0.42,0.42,0.2,0x3a3a3a,x+dx,y+9.35,z);K.lit(new THREE.BoxGeometry(0.34,0.34,0.04),0xfff6d8,x+dx,y+9.35,z+0.11)}
    SOLIDS.push({x,z,hx:0.75,hz:1.35})}
  // a cone course to weave through
  for(let i=0;i<10;i++){const x=-190+i*2.4,z=255+(i%2?1.2:-1.2),y=G(x,z);K.box(0.42,0.04,0.42,0xe0661e,x,y+0.02,z);K.cyl(0.03,0.17,0.62,8,0xe0661e,x,y+0.33,z);K.cyl(0.085,0.12,0.12,8,0xf2f2ee,x,y+0.38,z)}
  famAdd(K);
})();

// ---------- the parked machines ----------
(function(){
  const K=famKit(),G=(x,z)=>baseHeight(x,z);
  // small dozer
  {const X=-212,Z=247,f=dexFrame(K,X,Z,0,G(X,Z));
    for(const sx of [-1.05,1.05]){f.box(0.55,0.75,3.0,DEX_D,sx,0.4,0);for(const sz of [-1.45,1.45])f.cyl(0.38,0.38,0.56,10,0x3a3c40,sx,0.4,sz,0,Math.PI/2)}
    f.box(1.55,0.9,2.6,DEX_Y,0,1.2,-0.15);f.box(1.3,0.55,1.2,DEX_Y,0,1.85,0.6);f.cyl(0.07,0.07,0.8,6,DEX_D,0.4,2.4,0.8);
    f.box(1.3,1.15,1.3,DEX_GLASS,0,2.25,-0.65);f.box(1.5,0.12,1.5,DEX_Y,0,2.9,-0.65);for(const sx of [-0.68,0.68])for(const sz of [-1.3,0])f.box(0.08,1.2,0.08,DEX_Y,sx,2.25,sz);
    for(const sx of [-1.25,1.25])f.box(0.18,0.22,1.6,DEX_Y,sx,0.6,1.25,-0.1);
    f.box(3.1,1.05,0.22,DEX_Y,0,0.62,2.1,-0.15);f.box(3.12,0.08,0.12,0x8a8a86,0,0.1,2.2);
    f.box(0.15,0.8,0.2,DEX_D,0,0.55,-1.85,0.3);
    SOLIDS.push({x:X,z:Z+0.3,hx:1.6,hz:2.0})}
  // wheel loader
  {const X=-198,Z=246,f=dexFrame(K,X,Z,0,G(X,Z));
    for(const sx of [-1.15,1.15])for(const sz of [-1.3,1.4])f.wheel(0.8,0.62,sx,0.8,sz);
    f.box(1.8,1.0,2.6,DEX_Y,0,1.35,-1.0);f.box(1.6,0.9,1.5,DEX_Y,0,2.2,-1.65);f.box(2.0,0.8,0.45,DEX_D,0,1.35,-2.5);f.cyl(0.08,0.08,0.9,6,DEX_D,-0.45,2.95,-1.7);
    f.box(1.3,1.45,1.3,DEX_GLASS,0,2.6,-0.15);f.box(1.55,0.12,1.55,DEX_Y,0,3.38,-0.15);for(const sx of [-0.66,0.66])for(const sz of [-0.8,0.5])f.box(0.08,1.5,0.08,DEX_Y,sx,2.6,sz);
    f.box(1.2,0.8,1.6,DEX_Y,0,1.25,1.0);for(const sx of [-0.72,0.72])f.box(0.22,0.32,2.7,DEX_Y,sx,1.55,2.05,0.42);
    f.box(2.7,0.95,1.05,DEX_Y,0,0.55,3.3);f.box(2.72,0.08,0.3,0x8a8a86,0,0.1,3.8);
    SOLIDS.push({x:X,z:Z+0.6,hx:1.5,hz:3.4})}
  // a red semi with an empty lowboy trailer, parked along the south of the yard facing east
  {const X=-178,Z=268,f=dexFrame(K,X,Z,Math.PI/2,G(X,Z)),RED=0xb3262c,CHROME=0xc8ccd0;
    f.box(1.0,0.4,7.0,DEX_D,0,1.0,0.3);f.box(2.4,2.5,2.0,RED,0,2.45,1.5);f.box(2.2,0.9,0.06,DEX_GLASS,0,3.0,2.52);
    f.box(2.1,1.2,1.8,RED,0,1.85,3.4);f.box(1.5,1.0,0.1,CHROME,0,1.85,4.32);f.box(2.3,0.25,0.3,CHROME,0,0.75,4.4);
    for(const sx of [-1.1,1.1]){f.cyl(0.09,0.09,2.4,8,CHROME,sx*1.08,3.1,0.4);f.cyl(0.32,0.32,1.0,10,CHROME,sx*1.15,0.95,2.0,Math.PI/2)}
    for(const sx of [-1.05,1.05]){f.wheel(0.55,0.32,sx,0.55,3.4,CHROME);for(const sz of [-1.1,-2.4])f.wheel(0.55,0.5,sx,0.55,sz,CHROME)}
    f.box(1.6,0.12,1.4,DEX_D,0,1.3,-1.8);
    f.box(2.6,0.4,2.6,DEX_D,0,1.6,-2.2);f.box(2.6,0.35,1.6,DEX_D,0,1.05,-3.95,0.62);
    f.box(2.8,0.35,8.5,DEX_D,0,0.62,-8.9);f.box(2.7,0.05,8.4,0x7a5434,0,0.82,-8.9);f.box(2.8,0.45,3.4,DEX_D,0,1.1,-14.8);
    for(const sx of [-1.1,1.1])for(const sz of [-13.8,-15.0,-16.2])f.wheel(0.5,0.45,sx,0.5,sz,0x9a9ea2);
    SOLIDS.push({x:X-6.05,z:Z,hx:10.6,hz:1.45})}
  famAdd(K);
})();

// ---------- the dirt bike track: tyres half buried round the inside of the turns, hay bales at the ends of the jump and
// the whoops, a start line, and a sign on two posts by the start ----------
(function(){
  const K=famKit(),G=(x,z)=>baseHeight(x,z),hw=TRK_W/2,L=TRK_L2,PR=Math.PI*TRK_R;
  // the point s metres along the line and u out from it
  const at=(s,u)=>{s=(s%TRK_LEN+TRK_LEN)%TRK_LEN;let x,z,yaw;
    if(s<L){x=TRK_A[0]+s;z=TRK_A[1]-TRK_R-u;yaw=Math.PI/2}
    else if(s<L+PR){const a=-Math.PI/2+(s-L)/TRK_R;x=TRK_B[0]+Math.cos(a)*(TRK_R+u);z=TRK_A[1]+Math.sin(a)*(TRK_R+u);yaw=-a}
    else if(s<2*L+PR){x=TRK_B[0]-(s-L-PR);z=TRK_A[1]+TRK_R+u;yaw=-Math.PI/2}
    else{const a=Math.PI/2+(s-2*L-PR)/TRK_R;x=TRK_A[0]+Math.cos(a)*(TRK_R+u);z=TRK_A[1]+Math.sin(a)*(TRK_R+u);yaw=-a}
    return [x,z,yaw]};
  for(const [s0,s1] of [[L,L+PR],[2*L+PR,TRK_LEN]])for(let s=s0+0.6;s<s1;s+=0.75){const [x,z]=at(s,-hw-0.45),y=G(x,z);
    K.cyl(0.33,0.33,0.24,10,0x1d1d1f,x,y+0.04,z);K.cyl(0.2,0.2,0.26,8,0x4a3a2a,x,y+0.05,z)}
  const bale=(s,u)=>{const [x,z,yaw]=at(s,u),y=G(x,z);K.box(0.5,0.45,1.1,0xc9a75a,x,y+0.22,z,yaw);K.box(0.04,0.03,1.12,0x8a6f38,x,y+0.3,z,yaw)};
  for(const s of [L/2-6.5,L/2+6.5,L+PR+3,L+PR+16.5])for(const u of [-hw-0.9,hw+0.9])bale(s,u);
  // the start line across the south straight, and the sign
  {const s=L+PR+1.2;for(let u=-hw;u<hw;u+=0.5){const [x,z,yaw]=at(s,u+0.25),y=G(x,z);K.box(0.5,0.02,0.3,(u/0.5|0)%2?0x1d1d1f:0xf2f2ee,x,y+0.012,z,yaw)}
    const [x,z]=at(s,hw+1.6),y=G(x,z);for(const d of [-1.6,1.6])K.box(0.12,2.2,0.12,DEX_D,x+d,y+1.1,z);
    famSign(["DEXTER'S MX TRACK"],3.6,0.8,x,y+2.3,z-0.07,Math.PI,'#2b2d30','#f2b705')}
  famAdd(K);
})();

// a few pines round the rim (trees.js, its 'dex' group)
const dexTrees=(function(){
  let sd=41;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};const out=[];
  for(let g=0;g<3000&&out.length<34;g++){const a=rnd()*6.283,x=DEX_X+Math.cos(a)*60,z=DEX_Z+Math.sin(a)*60,k=(DEX_R-3-rnd()*4.5)/dexR(x,z),px=DEX_X+(x-DEX_X)*k,pz=DEX_Z+(z-DEX_Z)*k;
    if(roadOff(px,pz)<ROAD_W/2+3||Math.abs(pz-DEX_Z)<9&&px>-185||SOLIDS.some(s=>Math.abs(px-s.x)<s.hx+2&&Math.abs(pz-s.z)<s.hz+2)||out.some(o=>Math.hypot(o.x-px,o.z-pz)<3.2))continue;
    out.push({x:px,z:pz,yaw:rnd()*6.3,s:0.8+rnd()*0.6})}
  // none on the dirt bike track or its berms
  for(let i=out.length-1;i>=0;i--){if(trkH(out[i].x,out[i].z)>0||(trkAt(out[i].x,out[i].z),Math.abs(TRK_U)<TRK_W/2+4))out.splice(i,1)}
  treeGroup('dex',out.map(a=>treeEntry('pine',a.x,a.z,a.yaw,a.s,(a.x*7|0)&3,0.95+0.4*hash(a.x*1.3,a.z*2.1))));
  return out})();
