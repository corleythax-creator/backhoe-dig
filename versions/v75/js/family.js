// Corley's Island: the Family Island south across the water (its ground, the family house, the picnic pavilion, the fire
// pit, the flagpole, trees, road ends and signs) and the bridges in BRIDGES (terrain.js): the steel truss bridge from the
// Lower Bench and the first stretch of the mainland bridge, which stops at a barrier for now.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const famGround=groundPatch(FAM_PATCH[0],FAM_PATCH[1],FAM_PATCH[2],FAM_PATCH[3],1.5,[]);
// low-poly parts gathered by colour into a few merged meshes: solid (lit, flat shaded) and glow (lamps, embers)
function famKit(){const solid=[],glow=[],O=new THREE.Object3D();O.rotation.order='YXZ';
  function add(L,g,col,x,y,z,ry,rx,rz){O.position.set(x,y,z);O.rotation.set(rx||0,ry||0,rz||0);O.updateMatrix();
    if(g.index)g=g.toNonIndexed();g.deleteAttribute('uv');g.applyMatrix4(O.matrix);
    const c=new THREE.Color(col),n=g.attributes.position.count,a=new Float32Array(n*3);
    for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));L.push(g)}
  return {solid,glow,
    box:(w,h,d,col,x,y,z,ry,rx,rz)=>add(solid,new THREE.BoxGeometry(w,h,d),col,x,y,z,ry,rx,rz),
    cyl:(r0,r1,h,seg,col,x,y,z,ry,rx,rz)=>add(solid,new THREE.CylinderGeometry(r0,r1,h,seg),col,x,y,z,ry,rx,rz),
    geo:(g,col,x,y,z,ry,rx,rz)=>add(solid,g,col,x,y,z,ry,rx,rz),
    lit:(g,col,x,y,z,ry)=>add(glow,g,col,x,y,z,ry)}}
function famMerge(list){let n=0;for(const g of list)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const g of list){P.set(g.attributes.position.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;g.dispose()}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));
  m.computeVertexNormals();m.computeBoundingSphere();return m}
const famMat=M(0xffffff,{vertexColors:true}),famGlowMat=new THREE.MeshBasicMaterial({vertexColors:true});
// a kit's parts into the scene, as one mesh per kind
function famAdd(K){
  if(K.solid.length){const m=new THREE.Mesh(famMerge(K.solid),famMat);m.castShadow=true;m.receiveShadow=true;scene.add(m)}
  if(K.glow.length)scene.add(new THREE.Mesh(famMerge(K.glow),famGlowMat))}
// a gable: a triangular prism along x, width d across z, height h, length L, its base at y=0
function famGable(d,h,L){const a=-L/2,b=L/2,p=-d/2,q=d/2,v=[
  a,0,p, a,h,0, a,0,q,  b,0,q, b,h,0, b,0,p,
  a,0,p, b,0,p, b,h,0,  a,0,p, b,h,0, a,h,0,
  a,0,q, a,h,0, b,h,0,  a,0,q, b,h,0, b,0,q];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));return g}
// a sign board with lettering, large and plain so it reads from a machine's cab
function famSign(lines,w,h,x,y,z,ry,bg,fg){
  const cv=document.createElement('canvas'),R=Math.round(256*w/h);cv.width=Math.min(1024,R);cv.height=Math.round(cv.width*h/w);
  const g=cv.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);g.strokeStyle=fg;g.lineWidth=cv.height*0.04;g.strokeRect(cv.height*0.05,cv.height*0.05,cv.width-cv.height*0.1,cv.height-cv.height*0.1);
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';const fs=cv.height*0.7/lines.length;
  lines.forEach((t,i)=>{g.font=`${i?600:800} ${Math.round(fs*(i?0.72:0.9))}px "Saira Condensed","Arial Narrow",Arial,sans-serif`;g.fillText(t,cv.width/2,cv.height*(0.5+(i-(lines.length-1)/2)*0.78/lines.length))});
  const tex=new THREE.CanvasTexture(cv);tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),M(0xffffff,{map:tex,flatShading:false,side:THREE.DoubleSide}));
  m.position.set(x,y,z);m.rotation.y=ry;scene.add(m)}

// ---------- bridges ----------
// in each deck's own frame: t metres along it, u out from its centreline, y up
function famBridge(b,K,o){
  const yaw=Math.atan2(b.ux,b.uz),W=(t,u)=>[b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u];
  const put=(fn,t,u,y,...a)=>{const [x,z]=W(t,u);fn(...a,x,y,z,yaw)};
  const at=(t,u,y,w,h,d,col,rx)=>{const [x,z]=W(t,u);K.box(w,h,d,col,x,y,z,yaw,rx)};
  const L=b.len,Y=b.y,D=o.depth,steel=o.steel,CON=0x9b9a94;
  // deck, asphalt, painted lines (white edges, dashed yellow centre), curbs and railings
  at(L/2,0,Y-0.27,2*b.hw+1,0.5,L,CON);
  at(L/2,0,Y+0.01,2*b.hw,0.06,L,0x3b3d40);
  for(const s of [-1,1])at(L/2,s*(b.hw-0.35),Y+0.045,0.15,0.02,L,0xe8e6de);
  for(let t=2;t<L-2;t+=9)at(t+1.5,0,Y+0.045,0.15,0.02,3,0xe2b52a);
  for(const s of [-1,1]){const u=s*(b.hw+0.2);at(L/2,u,Y+0.14,0.4,0.3,L,0xa8a69f);
    at(L/2,u,Y+1.15,0.12,0.12,L,steel);at(L/2,u,Y+0.7,0.08,0.08,L,steel);
    for(let t=0;t<=L+0.01;t+=2.5)at(t,u,Y+0.65,0.12,1.0,0.12,steel)}
  // a deck truss under each edge: chords, verticals and diagonals, with a cross beam at every panel point
  const NP=Math.max(2,Math.round(L/(D*1.1))),P=L/NP;
  for(const s of [-1,1]){const u=s*(b.hw-0.4);
    at(L/2,u,Y-0.75,0.5,0.5,L,steel);at(L/2,u,Y-0.5-D,0.5,0.5,L,steel);
    for(let i=0;i<=NP;i++){at(i*P,u,Y-0.5-D/2,0.35,D,0.35,steel);
      if(i<NP){const up=i%2===0,dl=Math.hypot(P,D),ang=Math.atan2(P,D)*(up?1:-1);at(i*P+P/2,u,Y-0.5-D/2,0.3,dl,0.3,steel,ang)}}}
  for(let i=0;i<=NP;i++)at(i*P,0,Y-0.5-D,2*b.hw-0.4,0.3,0.3,steel);
  // concrete piers: two columns and a cap wherever the ground falls well below the truss, and an abutment at each end
  const pier=(t)=>{const [x,z]=W(t,0),g=baseHeight(x,z)-2,top=Y-0.75-D,hgt=top-g;if(hgt<1)return;
    for(const s of [-1,1])at(t,s*(b.hw-0.4),g+hgt/2,1.4,hgt,1.4,CON);at(t,0,top-0.4,2*b.hw+0.6,0.8,1.8,CON)};
  for(const t of o.piers)pier(t);
  for(const t of [0,L]){const [x,z]=W(t,0),g=baseHeight(x,z);if(g<Y-1)continue;at(t,0,Y-1.6,2*b.hw+1.2,3,3,CON)}
  // street lamps, staggered, their heads lit
  for(let t=6,s=1;t<L-3;t+=24,s=-s){const u=s*(b.hw+0.45),[x,z]=W(t,u);
    K.cyl(0.08,0.11,6.2,8,0x55595c,x,Y+3.1,z);
    const [ax,az]=W(t,u-s*0.7);K.box(1.5,0.1,0.12,0x55595c,ax,Y+6.1,az,yaw+Math.PI/2);
    const [hx,hz]=W(t,u-s*1.35);K.box(0.55,0.16,0.3,0x45484a,hx,Y+6.0,hz,yaw);K.lit(new THREE.BoxGeometry(0.42,0.04,0.22),0xfff1c8,hx,Y+5.91,hz,yaw)}
  return {W,at,yaw}}

(function(){
  // the truss bridge from the Lower Bench: dark green steel
  const K1=famKit(),B1=BRIDGES[0];famBridge(B1,K1,{depth:4.5,steel:0x3f5e4e,piers:[34,69]});famAdd(K1);
  // the mainland bridge: grey steel, finished as far as a barrier, then two bare piers and a crane where the work stops
  const K2=famKit(),B2=BRIDGES[1],F=famBridge(B2,K2,{depth:4,steel:0x5d6a74,piers:[30,64,98,122,146]});
  const L=B2.len,Y=B2.y;
  for(let i=-3;i<=3;i++){F.at(L-1.2,i*1.05,Y+0.55,0.12,1.1,0.12,0x8a8a86);F.at(L-1.2,i*1.05,Y+1.05,0.95,0.2,0.08,i%2?0xf2f2ee:0xe0661e);F.at(L-1.2,i*1.05,Y+0.7,0.95,0.2,0.08,i%2?0xe0661e:0xf2f2ee)}
  for(const s of [-1,1])F.at(L-1.4,s*2.6,Y+1.6,0.12,3.2,0.12,0x8a8a86);
  {const [x,z]=F.W(L-1.2,0);SOLIDS.push({x,z,hx:Math.abs(B2.uz)*0.4+Math.abs(B2.ux)*B2.hw,hz:Math.abs(B2.ux)*0.4+Math.abs(B2.uz)*B2.hw})}
  // a tower crane on the last bare pier
  {const [x,z]=F.W(146,0),top=Y+18;K2.box(1.2,top-Y+5.2,1.2,0xe5b322,x,(top+Y-5.2)/2,z);
    K2.box(22,0.8,0.8,0xe5b322,x,top+0.4,z-6,Math.PI/2+F.yaw);K2.box(2.2,1.8,2.2,0x6a6f73,x,top+1.6,z+3,F.yaw);
    K2.box(0.05,8,0.05,0x333333,x,top-4,z-14);K2.box(1.6,0.6,1.2,0x6a6f73,x,top-8.3,z-14)}
  famAdd(K2);
  {const [x,z]=F.W(L-1.4,0);famSign(['MAINLAND BRIDGE','Under construction'],5.4,1.7,x,Y+2.4,z,F.yaw+Math.PI,'#1f5f3a','#ffffff')}
})();

// ---------- the Family Island ----------
(function(){
  const K=famKit(),G=(x,z)=>baseHeight(x,z);
  // the family house: a big timber house with a stone base, a steep roof, a stone chimney and a porch along the front
  // and the east side
  {const X=-34,Z=212,y=G(X,Z+6.5)+0.05,WALL=0x9a6a44,TRIM=0x5a3b26,ROOF=0x46494d,STONE=0x8d8781,GLASS=0x6f8fa4,WHITE=0xeeeae0;
    K.box(14.4,0.7,10.4,STONE,X,y+0.2,Z);
    K.box(14,5,10,WALL,X,y+3.05,Z);
    for(let r=0;r<8;r++)K.box(14.06,0.06,10.06,TRIM,X,y+0.9+r*0.62,Z);
    K.geo(famGable(10,3.6,14),WALL,X,y+5.55,Z);
    const sl=Math.atan2(3.6,5),rl=Math.hypot(5,3.6)+0.9;
    for(const s of [-1,1])K.box(15.2,0.25,rl,ROOF,X,y+5.55+1.8+0.1,Z+s*2.55,0,s*sl);
    K.box(15.2,0.3,0.4,TRIM,X,y+9.2,Z);
    K.box(1.4,8.6,1.4,STONE,X-5.2,y+5.0,Z-2.2);K.box(1.6,0.3,1.6,0x6f6a65,X-5.2,y+9.4,Z-2.2);
    for(const s of [-1,1]){K.box(0.3,5.1,0.3,TRIM,X+s*7,y+3.05,Z+5);K.box(0.3,5.1,0.3,TRIM,X+s*7,y+3.05,Z-5)}
    // windows (frame, glass, sill) round the ground floor, two up in each gable, and the front door
    const win=(x,yy,z,ry,w,h)=>{K.box(w+0.3,h+0.3,0.12,WHITE,x,yy,z,ry);K.box(w,h,0.16,GLASS,x,yy,z,ry);K.box(w+0.5,0.12,0.3,WHITE,x,yy-h/2-0.15,z,ry);K.box(0.08,h,0.18,WHITE,x,yy,z,ry)};
    for(const dx of [-5,-2.4,4.1,5.9])win(X+dx,y+2.3,Z+5.02,0,1.3,1.6);
    for(const dx of [-4.5,0,4.5])win(X+dx,y+2.3,Z-5.02,0,1.3,1.6);
    for(const s of [-1,1]){for(const dz of [-2.5,2.5])win(X+s*7.02,y+2.3,Z+dz,Math.PI/2,1.3,1.6);for(const dz of [-1.3,1.3])win(X+s*7.02,y+6.6,Z+dz,Math.PI/2,0.9,1.2)}
    const DX=X+1.3;K.box(1.5,2.6,0.12,WHITE,DX,y+1.85,Z+5.02);K.box(1.2,2.3,0.18,0xa3402e,DX,y+1.7,Z+5.04);K.box(0.12,0.12,0.24,0xd8b04a,DX+0.4,y+1.7,Z+5.1);
    // porch: deck, posts, rails, a roof sloping off the wall, steps down to the drive, two rocking chairs
    const PW=2.6,py=y+0.5;
    K.box(14+PW,0.2,PW,0x7a5434,X+PW/2,py,Z+5+PW/2);K.box(PW,0.2,10,0x7a5434,X+7+PW/2,py,Z);
    const posts=[];for(let i=0;i<=7;i++)posts.push([X-7+0.2+i*(14+PW-0.4)/7,Z+5+PW-0.2]);for(let i=1;i<=4;i++)posts.push([X+7+PW-0.2,Z+5+PW-0.2-i*(10+PW-0.4)/4]);
    for(const [px,pz] of posts)K.box(0.22,2.9,0.22,WHITE,px,py+1.55,pz);
    for(let i=0;i<posts.length-1;i++){const [ax,az]=posts[i],[bx,bz]=posts[i+1];if(i===3)continue;
      K.box(Math.abs(bx-ax)+0.1,0.1,Math.abs(bz-az)+0.1,WHITE,(ax+bx)/2,py+1.0,(az+bz)/2)}
    const ps=Math.atan2(0.5,PW);K.box(14+PW+0.4,0.18,PW+0.5,ROOF,X+PW/2,py+3.2,Z+5+PW/2,0,ps);K.box(PW+0.5,0.18,10.2,ROOF,X+7+PW/2,py+3.2,Z,0,0,-ps);
    for(let i=0;i<3;i++)K.box(2.0,0.2,0.4,0x8d8781,DX,py-0.15-i*0.2,Z+5+PW+0.2+i*0.4);
    for(const dx of [2.5,4.2]){const cx=X+dx,cz=Z+6.2;K.box(0.7,0.08,0.7,0x6b4428,cx,py+0.55,cz);K.box(0.7,0.8,0.08,0x6b4428,cx,py+0.95,cz-0.33);K.box(0.06,0.06,0.9,0x6b4428,cx-0.3,py+0.12,cz,0,0.3);K.box(0.06,0.06,0.9,0x6b4428,cx+0.3,py+0.12,cz,0,0.3)}
    SOLIDS.push({x:X+PW/2,z:Z+PW/2,hx:7+PW/2+0.1,hz:5+PW/2+0.1})}
  // picnic pavilion: a slab, six timber posts, a gable roof and two tables, with room to walk in under it
  {const X=26,Z=264,y=G(X,Z)+0.02,TIM=0x7f5634;
    K.box(11,0.2,7.5,0xa9a69e,X,y+0.05,Z);
    for(const dx of [-4.8,0,4.8])for(const dz of [-3.2,3.2]){K.box(0.35,3.2,0.35,TIM,X+dx,y+1.75,Z+dz);SOLIDS.push({x:X+dx,z:Z+dz,hx:0.2,hz:0.2})}
    K.box(10.2,0.35,0.3,TIM,X,y+3.3,Z-3.2);K.box(10.2,0.35,0.3,TIM,X,y+3.3,Z+3.2);
    K.geo(famGable(6.4,1.8,10.2),0xb98a5a,X,y+3.45,Z);const sl=Math.atan2(1.8,3.2),rl=Math.hypot(3.2,1.8)+0.8;
    for(const s of [-1,1])K.box(11.2,0.2,rl,0x5b3a2a,X,y+3.45+0.9-0.05,Z+s*1.75,0,s*sl);
    for(const dx of [-2.5,2.5]){const tx=X+dx;K.box(1.0,0.08,2.4,0x9a6b42,tx,y+0.82,Z);
      for(const s of [-1,1]){K.box(0.32,0.06,2.4,0x9a6b42,tx+s*0.75,y+0.48,Z);K.box(0.08,0.85,0.08,0x6b4428,tx+s*0.4,y+0.42,Z-1);K.box(0.08,0.85,0.08,0x6b4428,tx+s*0.4,y+0.42,Z+1)}
      SOLIDS.push({x:tx,z:Z,hx:0.9,hz:1.2})}}
  // fire pit: a ring of stones round glowing embers and crossed logs, with log benches round it
  {const X=40,Z=280,y=G(X,Z);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;K.geo(new THREE.IcosahedronGeometry(0.34,0),0x87827c,X+Math.cos(a)*1.1,y+0.12,Z+Math.sin(a)*1.1,a)}
    K.lit(new THREE.CylinderGeometry(0.85,0.9,0.12,10),0xff7a2a,X,y+0.06,Z);
    for(let i=0;i<3;i++)K.cyl(0.11,0.11,1.5,6,0x4a3020,X,y+0.24,Z,i*1.05,0,Math.PI/2-0.25);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+0.4,bx=X+Math.cos(a)*3.4,bz=Z+Math.sin(a)*3.4;K.cyl(0.24,0.24,2.2,8,0x6b4a30,bx,y+0.24,bz,Math.PI/2-a,0,Math.PI/2)}
    SOLIDS.push({x:X,z:Z,hx:1.4,hz:1.4})}
  // flagpole at the north rim where the bridge comes in, and a bench looking back across the water at Corley's
  {const X=9,Z=176,y=G(X,Z);K.box(1.2,0.3,1.2,0x9b9a94,X,y+0.15,Z);K.cyl(0.06,0.09,10,8,0xd9dcdf,X,y+5,Z);K.geo(new THREE.IcosahedronGeometry(0.16,0),0xd8b04a,X,y+10.1,Z);
    const FW=2.4,FH=1.3,fx=X+FW/2+0.08,fy=y+9.2;
    for(let i=0;i<7;i++)K.box(FW,FH/7,0.03,i%2?0xf4f2ee:0xb3263a,fx,fy+FH/2-FH/14-i*FH/7,Z);
    K.box(FW*0.42,FH*4/7,0.04,0x2b3d78,X+0.08+FW*0.21,fy+FH/2-FH*2/7,Z);
    SOLIDS.push({x:X,z:Z,hx:0.6,hz:0.6});
    const BX=-9,BZ=172,by=G(BX,BZ);K.box(2.2,0.08,0.5,0x8a5c38,BX,by+0.48,BZ);K.box(2.2,0.5,0.08,0x8a5c38,BX,by+0.85,BZ+0.25);
    for(const s of [-1,1])K.box(0.1,0.48,0.5,0x55595c,BX+s*0.95,by+0.24,BZ)}
  // a stone curb round the roundabout's middle
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;K.box(2.3,0.25,0.35,0x9b9890,FAM_X+Math.sin(a)*8.3,FAM_Y+0.1,FAM_Z-Math.cos(a)*8.3,-a)}
  // the west and east arms stop at barriers where Dexter's and Jessica's bridges will go
  for(const s of [-1,1]){const x=s*70.5,y=G(x,245);
    for(let i=-2;i<=2;i++){K.box(0.12,1.1,0.12,0x8a8a86,x,y+0.55,245+i*1.05);K.box(0.08,0.2,0.95,i%2?0xf2f2ee:0xe0661e,x,y+1.0,245+i*1.05);K.box(0.08,0.2,0.95,i%2?0xe0661e:0xf2f2ee,x,y+0.7,245+i*1.05)}
    SOLIDS.push({x,z:245,hx:0.3,hz:2.8});
    K.box(0.12,2.6,0.12,0x8a8a86,x-s*0.6,y+1.3,242.2);K.box(0.12,2.6,0.12,0x8a8a86,x-s*0.6,y+1.3,247.8);
    famSign([s<0?"DEXTER'S ISLAND":"JESSICA'S ISLAND",'Bridge coming soon'],5.4,1.7,x-s*0.68,y+2.2,245,s<0?Math.PI/2:-Math.PI/2,'#1f5f3a','#ffffff')}
  {const y=G(-2.7,170);famSign(['FAMILY ISLAND'],4.6,1.1,-6.4,y+2.0,169,Math.PI,'#6b3a22','#f6e7c8');K.box(0.15,2.6,0.15,0x5a3b26,-8.5,y+1.3,169);K.box(0.15,2.6,0.15,0x5a3b26,-4.3,y+1.3,169)}
  famAdd(K);
})();

// trees on the Family Island: the map editor's pine and leafy-tree shapes in their own instance meshes (not saved with
// the map), a band inside the rim, groves behind the house and to the east and south, and a big tree in the roundabout
const famTrees=(function(){
  let sd=11;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  const clear=(x,z,m)=>{const d=famR(x,z)-FAM_R;if(d>-2.5)return false;if(roadOff(x,z)<ROAD_W/2+m)return false;
    if(SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+m+1&&Math.abs(z-s.z)<s.hz+m+1))return false;
    if(Math.hypot(x-FAM_X,z-FAM_Z)<16||Math.hypot(x-26,z-264)<10||Math.hypot(x-40,z-280)<7||Math.hypot(x-9,z-176)<6||Math.hypot(x+9,z-172)<5||Math.hypot(x+6.4,z-169)<4)return false;
    if(Math.abs(x)>66&&Math.abs(z-245)<8)return false;return true};
  const out=[];
  const grove=(cx,cz,r,n,pf)=>{for(let i=0,g=0;i<n&&g<n*30;g++){const a=rnd()*6.283,d=Math.sqrt(rnd())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
    if(!clear(x,z,1.4)||out.some(o=>Math.hypot(o.x-x,o.z-z)<2.6))continue;out.push({t:rnd()<pf?'pine':'leafy',x,z,yaw:rnd()*6.3,s:0.85+rnd()*0.6,c:Math.floor(rnd()*6)});i++}};
  grove(-38,198,14,15,0.7);grove(40,205,13,11,0.5);grove(-45,288,15,12,0.6);grove(48,300,12,8,0.6);grove(-60,232,9,5,0.8);grove(60,262,9,5,0.8);
  for(let i=0,g=0;i<38&&g<4000;g++){const a=rnd()*6.283,x=FAM_X+Math.cos(a)*90,z=FAM_Z+Math.sin(a)*90,f=famR(x,z),k=(FAM_R-3-rnd()*10)/f,px=FAM_X+(x-FAM_X)*k,pz=FAM_Z+(z-FAM_Z)*k;
    if(!clear(px,pz,1.6)||out.some(o=>Math.hypot(o.x-px,o.z-pz)<3))continue;out.push({t:rnd()<0.7?'pine':'leafy',x:px,z:pz,yaw:rnd()*6.3,s:0.8+rnd()*0.7,c:Math.floor(rnd()*6)});i++}
  out.push({t:'leafy',x:FAM_X,z:FAM_Z,yaw:0.6,s:1.7,c:4});SOLIDS.push({x:FAM_X,z:FAM_Z,hx:0.35,hz:0.35});
  const np=out.filter(o=>o.t==='pine').length,nl=out.length-np;
  const mk=(src,n)=>{const im=new THREE.InstancedMesh(src.geometry,src.material,n);im.castShadow=true;im.receiveShadow=true;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);scene.add(im);treeIMs.push(im);return im};
  const pines=mk(assetIMs.pine[0],np),woods=mk(assetIMs.leafy[0],nl),crowns=mk(assetIMs.leafy[1],nl);
  const o=new THREE.Object3D(),c=new THREE.Color();let ip=0,il=0;
  for(const a of out){const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    o.position.set(a.x,baseHeight(a.x,a.z)-0.05,a.z);o.rotation.set((w-0.5)*0.08,a.yaw,(w2-0.5)*0.08);o.scale.set(a.s,a.s*(a.t==='pine'?0.9+0.35*w:1),a.s);o.updateMatrix();
    if(a.t==='pine'){const t=ASSET_PT[a.c%4],v=0.88+0.24*w2;pines.setMatrixAt(ip,o.matrix);c.setRGB(t[0]*v,t[1]*v,t[2]*v);pines.setColorAt(ip++,c)}
    else{const t=ASSET_LT[a.c%6],v=0.9+0.2*w2;woods.setMatrixAt(il,o.matrix);crowns.setMatrixAt(il,o.matrix);c.setRGB(t[0]*v,t[1]*v,t[2]*v);crowns.setColorAt(il,c);c.setRGB(1,1,1);woods.setColorAt(il++,c)}}
  return out})();
