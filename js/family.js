// Corley's Island: the Family Island south across the water (its ground, the family house, the picnic pavilion, the fire
// pit, the flagpole, trees, road ends and signs), and famBridge, the steel deck-truss bridge Dexter's haul bridge is
// built from (dexter.js). The other bridges are on the bridge kit (bridges.js).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const famGround=groundPatch(FAM_PATCH[0],FAM_PATCH[1],FAM_PATCH[2],FAM_PATCH[3],1.5,[]);
// low-poly parts gathered by colour into a few merged meshes: solid (lit, flat shaded), glow (lamps, embers) and win
// (window glass, which lights up at night). Lamps (by colour: 1 street and bridge lamps, 2 light towers, 3 lanterns) also
// go in FAM_LAMPS ([x, y, z, kind]) for their halos and the light they throw on the ground after dark (daynight.js)
const FAM_LAMPS=[],FAM_LAMP_K={0xfff1c8:1,0xfff6d8:2,0xffd27a:3},FAM_WIN={0x6f8fa4:1,0x2c3a44:1};
function famKit(){const solid=[],glow=[],win=[],O=new THREE.Object3D();O.rotation.order='YXZ';
  function add(L,g,col,x,y,z,ry,rx,rz){O.position.set(x,y,z);O.rotation.set(rx||0,ry||0,rz||0);O.updateMatrix();
    if(g.index)g=g.toNonIndexed();g.deleteAttribute('uv');g.applyMatrix4(O.matrix);
    const c=new THREE.Color(col),n=g.attributes.position.count,a=new Float32Array(n*3);
    for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));L.push(g)}
  return {solid,glow,win,
    box:(w,h,d,col,x,y,z,ry,rx,rz)=>add(FAM_WIN[col]?win:solid,new THREE.BoxGeometry(w,h,d),col,x,y,z,ry,rx,rz),
    cyl:(r0,r1,h,seg,col,x,y,z,ry,rx,rz)=>add(solid,new THREE.CylinderGeometry(r0,r1,h,seg),col,x,y,z,ry,rx,rz),
    geo:(g,col,x,y,z,ry,rx,rz)=>add(solid,g,col,x,y,z,ry,rx,rz),
    lit:(g,col,x,y,z,ry)=>{if(FAM_LAMP_K[col]&&g.type==='BoxGeometry')FAM_LAMPS.push([x,y,z,FAM_LAMP_K[col]]);add(glow,g,col,x,y,z,ry)}}}
function famMerge(list){let n=0;for(const g of list)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const g of list){P.set(g.attributes.position.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;g.dispose()}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));
  m.computeVertexNormals();m.computeBoundingSphere();return m}
const famMat=M(0xffffff,{vertexColors:true}),famGlowMat=new THREE.MeshBasicMaterial({vertexColors:true}),famWinMat=M(0xffffff,{vertexColors:true,shininess:60,specular:0x333333});
// a kit's parts into the scene, as one mesh per kind; returns the meshes
function famAdd(K){const out=[];
  if(K.solid.length){const m=new THREE.Mesh(famMerge(K.solid),famMat);m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER);scene.add(m);out.push(m)}
  if(K.glow.length){const m=new THREE.Mesh(famMerge(K.glow),famGlowMat);scene.add(m);out.push(m)}
  if(K.win.length){const m=new THREE.Mesh(famMerge(K.win),famWinMat);m.receiveShadow=true;scene.add(m);out.push(m)}
  return out}
// things that stand in many places and have a detailed model (models.js, with Machine models on Detailed: cones, light
// towers, barriers, lamps, benches...): MDL_SPOTS[kind] lists where each stands, [x, y, z, yaw, scale] (the model's
// origin on the ground under its middle, its front +z turned by yaw), and MDL_SPOT_SIMPLE[kind] the kit meshes drawn
// for them otherwise. A kind's simple parts go in a kit of their own, added with famAddSpot
const MDL_SPOTS={},MDL_SPOT_SIMPLE={};
function famSpot(k,x,y,z,yaw,s){(MDL_SPOTS[k]=MDL_SPOTS[k]||[]).push([x,y,z,yaw||0,s||1])}
function famAddSpot(k,K){const ms=famAdd(K);(MDL_SPOT_SIMPLE[k]=MDL_SPOT_SIMPLE[k]||[]).push(...ms);return ms}
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
  lines.forEach((t,i)=>{g.font=`${i?600:700} ${Math.round(fs*(i?0.72:0.9))}px "Barlow Condensed","Arial Narrow",Arial,sans-serif`;g.fillText(t,cv.width/2,cv.height*(0.5+(i-(lines.length-1)/2)*0.78/lines.length))});
  const tex=new THREE.CanvasTexture(cv);tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),M(0xffffff,{map:tex,flatShading:false,side:THREE.DoubleSide}));
  m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m}

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
    for(const s of [-1,1])at(t,s*(b.hw-0.4),g+hgt/2,1.4,hgt,1.4,CON);at(t,0,top-0.4,2*b.hw+0.6,0.8,1.8,CON);
    const [ax,az]=W(t,0.3-b.hw),[bx,bz]=W(t,b.hw-0.3);BOAT_WALLS.push({ax,az,bx,bz,r:0.9})};
  for(const t of o.piers)pier(t);
  for(const t of [0,L]){const [x,z]=W(t,0),g=baseHeight(x,z);if(g<Y-1)continue;at(t,0,Y-1.6,2*b.hw+1.2,3,3,CON)}
  // street lamps, staggered, their heads lit, reaching over the road (lampArm, models.js on Detailed)
  const LK=famKit();
  for(let t=6,s=1;t<L-3;t+=24,s=-s){const u=s*(b.hw+0.45),[x,z]=W(t,u);
    LK.cyl(0.08,0.11,6.2,8,0x55595c,x,Y+3.1,z);
    const [ax,az]=W(t,u-s*0.7);LK.box(1.5,0.1,0.12,0x55595c,ax,Y+6.1,az,yaw+Math.PI/2);
    const [hx,hz]=W(t,u-s*1.35);LK.box(0.55,0.16,0.3,0x45484a,hx,Y+6.0,hz,yaw);LK.lit(new THREE.BoxGeometry(0.42,0.04,0.22),0xfff1c8,hx,Y+5.91,hz,yaw);
    famSpot('lampArm',x,Y-0.02,z,Math.atan2(s*b.uz,-s*b.ux))}
  famAddSpot('lampArm',LK);
  return {W,at,yaw}}

(function(){
  // the spoil yard on Corley's north lawn, where the truck dumps now the cliff is gone
  {const x=6,z=-41,y=baseHeight(x,z),K=famKit();for(const s of [-1,1])K.box(0.12,2.6,0.12,0x8a8a86,x+s*1.9,y+1.3,z);famAdd(K);
    famSign(['SPOIL YARD','Dump loads here'],4.2,1.4,x,y+2.1,z+0.07,0,'#c9601c','#ffffff')}
})();

// ---------- games at the pavilion ----------
// a chess board on the west picnic table and a checkers board on the east one, both set up to start. Sitting down at
// one (Get in) saves the island and opens that Mesa game at full quality; its back link brings you here again.
const MESA_URL='https://mesa-games-ochre.vercel.app/';
const FAM_GAMES=[{k:'chess',n:'chess',b:'Play chess',x:23.5,z:264},{k:'checkers',n:'checkers',b:'Play checkers',x:28.5,z:264}];
// the board's ranks run across the table (x), toward each bench, its files along it (z); a1 is dark
function famBoard(K,g,y){const S=0.06,X=g.x,Z=g.z,chess=g.k==='chess';
  K.box(8*S+0.06,0.03,8*S+0.06,chess?0x5a3b26:0x3a2a1e,X,y+0.015,Z);
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){const dark=(r+f)%2===0;
    K.box(S,0.008,S,chess?(dark?0x6e4a2c:0xe6d6b0):(dark?0x262422:0xb2382c),X+(r-3.5)*S,y+0.034,Z+(f-3.5)*S)}
  const top=y+0.038,at=(r,f)=>[X+(r-3.5)*S,Z+(f-3.5)*S];
  if(chess){const BACK='rnbqkbnr';
    for(const [r,col] of [[0,0xf1ead8],[1,0xf1ead8],[6,0x2b2622],[7,0x2b2622]])for(let f=0;f<8;f++){const [x,z]=at(r,f),t=r===1||r===6?'p':BACK[f];
      const h={p:0.026,r:0.036,n:0.038,b:0.044,q:0.05,k:0.054}[t];K.cyl(0.016,0.021,h,6,col,x,top+h/2,z);
      if(t==='p')K.geo(new THREE.IcosahedronGeometry(0.012,0),col,x,top+h+0.008,z);
      else if(t==='r')K.cyl(0.02,0.018,0.012,6,col,x,top+h+0.006,z);
      else if(t==='n')K.box(0.03,0.022,0.014,col,x+(r<4?0.006:-0.006),top+h+0.008,z,0,0,r<4?0.5:-0.5);
      else if(t==='b')K.cyl(0,0.014,0.024,6,col,x,top+h+0.012,z);
      else if(t==='q')K.geo(new THREE.IcosahedronGeometry(0.015,0),col,x,top+h+0.01,z);
      else{K.box(0.008,0.026,0.008,col,x,top+h+0.013,z);K.box(0.008,0.008,0.022,col,x,top+h+0.017,z)}}}
  else for(let r=0;r<8;r++){if(r===3||r===4)continue;for(let f=0;f<8;f++){if((r+f)%2)continue;const [x,z]=at(r,f);
    K.cyl(0.024,0.024,0.012,10,r<3?0xb3302a:0xeee3c8,x,top+0.006,z)}}}
// the game table the worker is standing at, if any (a stride from the table's edge)
let famPrefetched=false;
function famGameNear(){if(mode!=='walk'||wk.inside)return null;
  if(!famPrefetched&&Math.hypot(wk.x-26,wk.z-264)<25){famPrefetched=true;
    for(const g of FAM_GAMES){const l=document.createElement('link');l.rel='prefetch';l.href=MESA_URL+g.k+'/';document.head.appendChild(l)}}
  for(const g of FAM_GAMES){const dx=Math.max(0,Math.abs(wk.x-g.x)-0.9),dz=Math.max(0,Math.abs(wk.z-g.z)-1.2);
    if(Math.hypot(dx,dz)<1.1&&Math.abs(wk.y-baseHeight(g.x,g.z))<1)return g}
  // the cat in Jessica's library (jessica.js)
  return jesCatNear()}
// sit down: save everything, then go to the game. On the website the page itself goes (and Mesa's back link returns
// here); in the claude.ai version, or an old version, the game opens in a new tab instead
function famPlay(g){try{siteSaveAll()}catch(e){}try{lawnSave()}catch(e){}
  const url=MESA_URL+g.k+'/?from=island&back='+encodeURIComponent(location.origin+location.pathname);
  if(/(^|\.)vercel\.app$|^localhost$|^127\./.test(location.hostname)&&!/\/versions\//.test(location.pathname)){
    try{sessionStorage.setItem('bhd_table',g.k)}catch(e){}toast(say('famSit',{game:g.n}),'',3000);setTimeout(()=>{location.href=url},400);return}
  let w=null;try{w=window.open(url,'_blank')}catch(e){}
  if(!w)toast(`Play ${g.n} at mesa-games-ochre.vercel.app/${g.k}/`,'',5000)}

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
    // the tables (picnic8, models.js on Detailed: its top 0.76 m up, level with the boards)
    const PK=famKit();
    for(const dx of [-2.5,2.5]){const tx=X+dx;PK.box(1.0,0.08,2.4,0x9a6b42,tx,y+0.82,Z);
      for(const s of [-1,1]){PK.box(0.32,0.06,2.4,0x9a6b42,tx+s*0.75,y+0.48,Z);PK.box(0.08,0.85,0.08,0x6b4428,tx+s*0.4,y+0.42,Z-1);PK.box(0.08,0.85,0.08,0x6b4428,tx+s*0.4,y+0.42,Z+1)}
      famSpot('picnic8',tx,y+0.1,Z,Math.PI/2);SOLIDS.push({x:tx,z:Z,hx:0.9,hz:1.2})}
    famAddSpot('picnic8',PK);
    for(const g of FAM_GAMES)famBoard(K,g,y+0.86)}
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
    const BX=-9,BZ=172,by=G(BX,BZ),BK=famKit();BK.box(2.2,0.08,0.5,0x8a5c38,BX,by+0.48,BZ);BK.box(2.2,0.5,0.08,0x8a5c38,BX,by+0.85,BZ+0.25);
    for(const s of [-1,1])BK.box(0.1,0.48,0.5,0x55595c,BX+s*0.95,by+0.24,BZ);
    famSpot('bench',BX,by,BZ,Math.PI,1.1);famAddSpot('bench',BK)}
  // a stone curb round the roundabout's middle
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;K.box(2.3,0.25,0.35,0x9b9890,FAM_X+Math.sin(a)*8.3,FAM_Y+0.1,FAM_Z-Math.cos(a)*8.3,-a)}
  {const y=G(-2.7,170);famSign(['FAMILY ISLAND'],4.6,1.1,-6.4,y+2.0,169,Math.PI,'#6b3a22','#f6e7c8');K.box(0.15,2.6,0.15,0x5a3b26,-8.5,y+1.3,169);K.box(0.15,2.6,0.15,0x5a3b26,-4.3,y+1.3,169)}
  famAdd(K);
})();

// trees on the Family Island: the map editor's pines and leafy trees (trees.js, its 'fam' group; not saved with
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
  treeGroup('fam',out.map(a=>treeEntry(a.t,a.x,a.z,a.yaw,a.s,a.c)));
  return out})();
