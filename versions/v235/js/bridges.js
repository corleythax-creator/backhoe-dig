// Corley's Island: the bridges' kit, and the two road bridges off the Family Island: Corley's bridge (three riveted
// Parker through-truss spans in forest green on granite piers, 1931) and the mainland bridge (an inverted-Y concrete
// pylon on the middle pier and two fans of stay cables). Jessica's covered bridge (jessica.js) and the temporary trestles
// and the crane's steel spans (mainland.js) are built with the same kit; Dexter's haul bridge is still famBridge
// (family.js). The decks are BRIDGES (terrain.js): nothing here changes where anything drives, walks or floats, and the
// piers stand where they stood, so the boats pass the same way (BOAT_WALLS).
// Parts are merged per material into a few meshes (brKit), with texture coordinates in metres so stone courses, boards
// and rivets keep their real size. The finishes (weathered paint, rivet plates, granite ashlar, barn-red boards, cedar
// shakes, creosoted and weathered timber, lacing and lattice) are drawn here the first time they are wanted; concrete,
// asphalt, planks and rusty steel are the material library's pictures. Graphics (brGfx, from gfx.js): Low draws each
// material's plain colour and leaves out the detail parts (gusset plates, lacing, lattice, cover plates, braces, lamp
// trim, the covered bridge's lattice and rafters, batter piles), Medium adds the pictures, High their relief and sheen.
// Rain darkens and glosses them (brTick).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// ---------- finishes drawn here ----------
function brRand(s){return ()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
const brSS=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
// a noise field S by S that repeats at its edges, in 0..1: cx by cy cells, o octaves each twice as fine
function brNoise(S,cx,cy,o,seed){const F=new Float32Array(S*S),rnd=brRand(seed);let amp=1,tot=0;
  for(let k=0;k<o;k++){const nx=cx<<k,ny=cy<<k,G=new Float32Array(nx*ny);for(let i=0;i<G.length;i++)G[i]=rnd();
    for(let y=0;y<S;y++){const fy=y*ny/S,y0=fy|0,ty=fy-y0,sy=ty*ty*(3-2*ty),r0=y0*nx,r1=((y0+1)%ny)*nx;
      for(let x=0;x<S;x++){const fx=x*nx/S,x0=fx|0,tx=fx-x0,sx=tx*tx*(3-2*tx),x1=(x0+1)%nx,
        a=G[r0+x0]+(G[r0+x1]-G[r0+x0])*sx,b=G[r1+x0]+(G[r1+x1]-G[r1+x0])*sx;F[y*S+x]+=amp*(a+(b-a)*sy)}}
    tot+=amp;amp*=0.5}
  // stretched back out to about 0..1 (averaged octaves bunch up round the middle)
  for(let i=0;i<F.length;i++)F[i]=Math.min(1,Math.max(0,(F[i]/tot-0.5)*2.4+0.5));return F}
const BR_S=512;
function brField(){const N=BR_S*BR_S;return {S:BR_S,N,C:new Float32Array(N*3),H:new Float32Array(N),R:new Float32Array(N)}}
function brMix(o,i,r,g,b,e){o.C[i*3]+=(r-o.C[i*3])*e;o.C[i*3+1]+=(g-o.C[i*3+1])*e;o.C[i*3+2]+=(b-o.C[i*3+2])*e}
// painted steel, chalky with age: mottled, chipped to rust in places, rust weeping down from where water sits
function brGenPaint(d,seed){const o=brField(),{S,N}=o,[pr,pg,pb]=d.col,rnd=brRand(seed),m=brNoise(S,4,4,4,seed+1),f=brNoise(S,24,24,3,seed+2),ch=brNoise(S,40,40,2,seed+3);
  for(let i=0;i<N;i++){const k=0.9+0.22*(m[i]-0.5)+0.1*(f[i]-0.5),chalk=brSS(0.62,0.85,m[i])*0.3,chip=brSS(0.78,0.86,ch[i]*0.75+f[i]*0.25);
    let r=pr*k,g=pg*k,b=pb*k;const gr=(r+g+b)/3+0.07;r+=(gr-r)*chalk;g+=(gr-g)*chalk;b+=(gr-b)*chalk;
    o.C[i*3]=r;o.C[i*3+1]=g;o.C[i*3+2]=b;brMix(o,i,0.34+0.1*f[i],0.19+0.05*f[i],0.11,chip);
    o.H[i]=0.6+0.05*f[i]-0.3*chip;o.R[i]=0.48+0.1*m[i]+0.35*chip+0.12*chalk}
  for(let s=0;s<44;s++){const x0=rnd()*S|0,y0=rnd()*S|0,len=40+rnd()*210,w=1+rnd()*3,a0=0.12+rnd()*0.32;
    for(let dy=0;dy<len;dy++){const a=a0*Math.pow(1-dy/len,1.6),y=(y0+dy)%S,wob=Math.round(Math.sin((dy+x0)*0.07)*1.2);
      for(let dx=-Math.ceil(w);dx<=Math.ceil(w);dx++){const x=((x0+dx+wob)%S+S)%S,i=y*S+x,e=a*Math.max(0,1-Math.abs(dx)/(w+0.5));
        brMix(o,i,0.42,0.22,0.11,e);o.R[i]+=0.2*e}}}
  return o}
// the same paint over a field of rivet heads, for gusset and cover plates
function brGenRivet(d,seed){const o=brGenPaint(d,seed),S=o.S,P=S/8,rad=P*0.17,rnd=brRand(seed+9);
  for(let gy=0;gy<8;gy++)for(let gx=0;gx<8;gx++){const cx=(gx+0.5)*P,cy=(gy+0.5)*P,rust=rnd()<0.25;
    for(let y=Math.floor(cy-rad-3);y<=cy+rad+3;y++)for(let x=Math.floor(cx-rad-3);x<=cx+rad+3;x++){const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),i=y*S+x;
      if(r<rad){const h=Math.sqrt(1-(r/rad)**2),lit=1+0.3*(-dx-dy)/(rad*1.4)*h;o.H[i]+=0.5*h;o.C[i*3]*=lit;o.C[i*3+1]*=lit;o.C[i*3+2]*=lit}
      else if(r<rad+3)brMix(o,i,0.33,0.18,0.1,(1-(r-rad)/3)*(rust?0.6:0.2))}}
  return o}
// granite ashlar: courses of rock-faced blocks with pale mortar joints, speckled, a little lichen
function brGenAshlar(d,seed){const o=brField(),{S}=o,rnd=brRand(seed),sp=brNoise(S,128,128,1,seed+1),rk=brNoise(S,12,12,4,seed+2),li=brNoise(S,5,5,3,seed+3);
  let y0=0;for(const rh of [136,118,132,126]){const xs=[];let x=rnd()*S;const x0=x;while(x<x0+S){xs.push(x);x+=180+rnd()*150}
    // the last block closes the course where it began, so the picture repeats; a sliver joins its neighbour
    if(x0+S-xs[xs.length-1]<110&&xs.length>1)xs.pop();xs.push(x0+S);
    const tone=xs.map(()=>[0.40+rnd()*0.17,rnd()*0.05-0.025]);
    for(let y=y0;y<y0+rh;y++){const dy=Math.min(y-y0,y0+rh-1-y);
      for(let px=0;px<S;px++){const X=px<x0?px+S:px;let b=0;while(b<xs.length-2&&X>=xs[b+1])b++;
        const e=Math.min(dy,X-xs[b],xs[b+1]-X),i=y*S+px,[t,w]=tone[b];
        if(e<3.5){const v=0.56+0.08*sp[i];o.C[i*3]=v*1.02;o.C[i*3+1]=v;o.C[i*3+2]=v*0.94;o.H[i]=0.08;o.R[i]=0.95;continue}
        const bev=brSS(3.5,20,e),s=sp[i]>0.68?1.18:sp[i]<0.32?0.82:1,v=t*s*(0.88+0.24*rk[i]);
        o.C[i*3]=v*(1+w);o.C[i*3+1]=v;o.C[i*3+2]=v*(1-w);brMix(o,i,0.5,0.55,0.42,brSS(0.68,0.82,li[i])*0.45);
        o.H[i]=0.25+0.45*bev+0.3*rk[i]*bev;o.R[i]=0.84+0.08*(1-s)}}
    y0+=rh}
  return o}
// barn-red board-and-batten: a 5 cm batten over every joint of the 25 cm boards, the paint worn to grey wood in places
function brGenBarn(d,seed){const o=brField(),{S,N}=o,[pr,pg,pb]=d.col,gr=brNoise(S,48,3,3,seed+1),wt=brNoise(S,6,6,4,seed+2),dt=brNoise(S,16,2,2,seed+3);
  for(let i=0;i<N;i++){const x=i%S,jx=x%128,db=Math.min(jx,128-jx),bat=db<13,k=0.8+0.4*gr[i],wear=brSS(0.76,0.92,wt[i]*0.75+gr[i]*0.25)*0.75,dirt=0.86+0.14*dt[i];
    o.C[i*3]=pr*k*dirt;o.C[i*3+1]=pg*k*dirt;o.C[i*3+2]=pb*k*dirt;brMix(o,i,0.46*k,0.43*k,0.39*k,wear);
    if(!bat&&db<17){const sh=0.82+0.045*(db-13);o.C[i*3]*=sh;o.C[i*3+1]*=sh;o.C[i*3+2]*=sh}
    o.H[i]=bat?(db>10?0.62:0.9):0.35+0.12*gr[i];o.R[i]=0.72+0.2*wear}
  return o}
// cedar shakes gone silver: 25 cm courses of split shakes of random widths, thick at the butt, each casting a shadow
// on the course below; up the roof is up the picture
function brGenShakes(d,seed){const o=brField(),{S}=o,rnd=brRand(seed),gr=brNoise(S,64,4,3,seed+1),bl=brNoise(S,6,6,3,seed+2),RH=128;
  for(let r=0;r<S/RH;r++){const xs=[];let x=rnd()*S;const x0=x;while(x<x0+S){xs.push(x);x+=36+rnd()*92}if(x0+S-xs[xs.length-1]<30&&xs.length>1)xs.pop();xs.push(x0+S);
    const tone=xs.map(()=>{const q=rnd(),c=q<0.16?[0.40,0.34,0.27]:q<0.24?[0.35,0.38,0.30]:[0.46,0.45,0.43],s=0.8+rnd()*0.3;return c.map(v=>v*s)});
    for(let y=r*RH;y<(r+1)*RH;y++){const t=(y-r*RH)/RH;
      for(let px=0;px<S;px++){const X=px<x0?px+S:px;let b=0;while(b<xs.length-2&&X>=xs[b+1])b++;const e=Math.min(X-xs[b],xs[b+1]-X),i=y*S+px,[cr,cg,cb]=tone[b];
        if(e<2.5){o.C[i*3]=o.C[i*3+1]=o.C[i*3+2]=0.07;o.H[i]=0;o.R[i]=1;continue}
        const sh=t<0.1?0.5+0.5*t/0.1:1,v=(0.72+0.56*gr[i])*sh*(0.9+0.2*bl[i]);
        o.C[i*3]=cr*v;o.C[i*3+1]=cg*v;o.C[i*3+2]=cb*v;o.H[i]=0.12+0.72*t+0.1*gr[i];o.R[i]=0.88}}}
  return o}
// timber, the grain up the picture (along the member): dark creosoted, or bare and weathered; drying checks
function brGenWood(d,seed){const o=brField(),{S,N}=o,[pr,pg,pb]=d.col,rnd=brRand(seed),gr=brNoise(S,40,2,4,seed+1),wt=brNoise(S,4,8,3,seed+2);
  for(let i=0;i<N;i++){const k=0.72+0.56*gr[i],wz=brSS(0.62,0.8,wt[i])*d.wz;o.C[i*3]=pr*k;o.C[i*3+1]=pg*k;o.C[i*3+2]=pb*k;
    brMix(o,i,0.36*k,0.34*k,0.31*k,wz);o.H[i]=0.5+0.3*(gr[i]-0.5);o.R[i]=d.rough+0.12*wz-0.12*(1-wt[i])*(d.tar||0)}
  for(let s=0;s<30;s++){const x0=rnd()*S|0,y0=rnd()*S|0,len=60+rnd()*260;
    for(let dy=0;dy<len;dy++){const y=(y0+dy)%S,x=((x0+Math.round(Math.sin(dy*0.05+s)*2))%S+S)%S,i=y*S+x,e=Math.min(1,Math.min(dy,len-dy)/20);
      o.C[i*3]*=1-0.6*e;o.C[i*3+1]*=1-0.6*e;o.C[i*3+2]*=1-0.6*e;o.H[i]-=0.35*e}}
  return o}
const brHex=c=>`rgb(${c.map(v=>Math.round(v*255)).join(',')})`;
// lacing: flat bars zigzagging between the two channels of a built-up member (along the picture), riveted at each end
function brGenLace(d){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d'),pts=[];
  for(let x=-64;x<=320;x+=64)pts.push([x,(x/64)&1?7:121]);g.strokeStyle=brHex(d.col);g.lineWidth=17;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
  g.fillStyle='rgba(0,0,0,0.35)';for(const [x,y] of pts){g.beginPath();g.arc(x,y,4,0,7);g.fill()}return c}
// a lattice railing's or portal's crossed flat bars, one X to the picture
function brGenXlat(d){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.strokeStyle=brHex(d.col);g.lineWidth=22;
  g.beginPath();g.moveTo(0,0);g.lineTo(256,256);g.moveTo(0,256);g.lineTo(256,0);g.stroke();g.fillStyle='rgba(0,0,0,0.35)';g.beginPath();g.arc(128,128,5,0,7);g.fill();return c}
// a field's colour, relief (made into a normal map, strength k) and roughness as pictures
function brCanvas(S,fill){const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),im=g.createImageData(S,S);fill(im.data);g.putImageData(im,0,0);return c}
function brTexOut(o,k){const {S,C,H,R}=o;
  return {map:brCanvas(S,a=>{for(let i=0,j=0;i<S*S;i++,j+=4){a[j]=C[i*3]*255;a[j+1]=C[i*3+1]*255;a[j+2]=C[i*3+2]*255;a[j+3]=255}}),
    n:brCanvas(S,a=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++){const l=H[y*S+(x+S-1)%S],r=H[y*S+(x+1)%S],u=H[((y+S-1)%S)*S+x],dn=H[((y+1)%S)*S+x],
      nx=(l-r)*k,ny=(dn-u)*k,q=1/Math.hypot(nx,ny,1),j=(y*S+x)*4;a[j]=(nx*q*0.5+0.5)*255;a[j+1]=(ny*q*0.5+0.5)*255;a[j+2]=(q*0.5+0.5)*255;a[j+3]=255}}),
    r:brCanvas(S,a=>{for(let i=0,j=0;i<S*S;i++,j+=4){a[j]=a[j+1]=a[j+2]=Math.min(1,R[i])*255;a[j+3]=255}})}}

// ---------- materials ----------
// pictures stay in their own sRGB values (no colour space): the game's colour patch (core.js) makes every colour linear
// col: the plain colour (sRGB) drawn on Low and until the picture is in; tile: metres one picture covers; k: relief;
// uv: 'world' (from the face's direction, so courses and streaks stay level and upright) or 'local' (along each member);
// dry: rain doesn't change it
const BR_GREEN=[0.27,0.42,0.32],BR_GREY=[0.45,0.51,0.55];
const BR_DEF={
  paintG:{gen:brGenPaint,col:BR_GREEN,tile:1.6,k:4,seed:11},rivetG:{gen:brGenRivet,col:BR_GREEN,tile:0.6,k:10,seed:12},
  paintS:{gen:brGenPaint,col:BR_GREY,tile:1.6,k:4,seed:21},rivetS:{gen:brGenRivet,col:BR_GREY,tile:0.6,k:10,seed:22},
  ashlar:{gen:brGenAshlar,col:[0.47,0.47,0.45],tile:2.4,k:12,seed:31,rough:0.9},
  barn:{gen:brGenBarn,col:[0.50,0.16,0.11],tile:1.0,k:6,seed:41,rough:0.8},
  shakes:{gen:brGenShakes,col:[0.42,0.41,0.39],tile:1.0,k:10,seed:51,rough:0.9},
  creo:{gen:brGenWood,col:[0.17,0.13,0.10],tile:1.4,k:6,seed:61,uv:'local',wz:0.5,rough:0.62,tar:1},
  beam:{gen:brGenWood,col:[0.44,0.34,0.24],tile:1.4,k:6,seed:71,uv:'local',wz:0.35,rough:0.82},
  laceG:{gen:brGenLace,col:BR_GREEN,tile:0.7,alpha:1},xlatG:{gen:brGenXlat,col:BR_GREEN,tile:0.5,alpha:1},xlatS:{gen:brGenXlat,col:BR_GREY,tile:0.5,alpha:1},
  asphalt:{lib:'asphalt'},concrete:{lib:'concrete'},concOld:{lib:'concrete_old'},planks:{lib:'planks'},rust:{lib:'rustplate'},
  iron:{col:[0.08,0.08,0.08],metal:0.5,rough:0.5},white:{col:[0.88,0.86,0.80],rough:0.75},
  lineW:{col:[0.86,0.85,0.80],rough:0.8},lineY:{col:[0.85,0.66,0.15],rough:0.8},
  stain:{col:[0.74,0.75,0.76],metal:1,rough:0.3,dry:1},galv:{col:[0.6,0.62,0.63],metal:0.8,rough:0.45},cable:{col:[0.93,0.93,0.91],rough:0.35},
  glass:{col:[0.80,0.89,0.92],rough:0.05,glass:1,dry:1}};
const BR_MATS={},BR_DET=[],BR_WHITE=new THREE.Color(1,1,1);
let brTexWant=false,brPbrOn=false,brDetOn=true,brWet=0,brWetSeen=0;const brQ=[];let brQT=0;
function brMat(key){if(BR_MATS[key])return BR_MATS[key];const d=BR_DEF[key],lib=d.lib&&MAT_LIST.find(m=>m.id===d.lib),c=lib?lib.c:d.col;
  const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:d.rough??0.85,metalness:d.metal||0,envMap:skyEnv,envMapIntensity:0.7});
  if(d.alpha){m.alphaTest=0.5;m.side=THREE.DoubleSide;m.visible=false}
  if(d.glass){m.transparent=true;m.opacity=0.28;m.depthWrite=false;m.envMapIntensity=1}
  m.userData={key,def:d,col:new THREE.Color().setRGB(c[0],c[1],c[2]),base:new THREE.Color(),rough:m.roughness,tile:lib?lib.ft*0.3048:d.tile||1,uv:d.uv||'world',tex:null};
  BR_MATS[key]=m;brApply(m);if(d.alpha?brDetOn&&brTexReady:brTexWant)brTexQueue(key);return m}
let brTexReady=false;   // set once the Graphics setting has been applied (pictures are drawn only after that)
// pictures are made (or loaded) one material at a time, a frame or two apart, so loading never stalls on them
function brTexQueue(key){const m=BR_MATS[key],u=m.userData;if(u.tex||u.q||!(u.def.gen||u.def.lib))return;u.q=1;brQ.push(key);if(!brQT)brQT=setTimeout(brTexStep,40)}
function brTexStep(){brQT=0;const key=brQ.shift();if(!key)return;const m=BR_MATS[key],u=m.userData,d=u.def;
  if(!(d.alpha?brDetOn:brTexWant)){u.q=0;if(brQ.length)brQT=setTimeout(brTexStep,0);return}   // no longer wanted (the setting changed)
  const T=c=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  if(d.lib){let left=3;const done=()=>{if(--left===0){u.tex=tx;brApply(m)}},tx={},L=k=>{const t=new THREE.TextureLoader().load(`textures/${d.lib}${k}.jpg`,done,undefined,done);
      t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
    tx.map=L('');tx.n=L('_n');tx.r=L('_r')}
  else if(d.alpha){u.tex={map:T(d.gen(d))};brApply(m)}
  else{const o=brTexOut(d.gen(d,d.seed),d.k);u.tex={map:T(o.map),n:T(o.n),r:T(o.r)};brApply(m)}
  if(brQ.length)brQT=setTimeout(brTexStep,40)}
// a material's pictures on or off as the Graphics setting says, its colour and sheen as the rain has left it
function brApply(m){const u=m.userData,T=u.tex,d=u.def,on=d.alpha?brDetOn:brTexWant,map=T&&on?T.map:null,pbr=!!(map&&brPbrOn&&T.n),n=pbr?T.n:null,r=pbr?T.r:null;
  if(m.map!==map||m.normalMap!==n||m.roughnessMap!==r){m.map=map;m.normalMap=n;m.roughnessMap=r;m.needsUpdate=true}
  if(d.alpha)m.visible=!!map;
  u.base.copy(map?BR_WHITE:u.col);u.rough=pbr?1:(d.rough??0.85);brWetSet(m)}
function brWetSet(m){const u=m.userData,w=u.def.dry?0:brWet;m.color.copy(u.base).multiplyScalar(1-0.3*w);m.roughness=u.rough*(1-0.5*w)}
// from gfxApply (gfx.js): the detail parts, the pictures, their relief and sheen
function brGfx(g){brDetOn=g.brDet!==false;brTexWant=g.tex!=='low';brPbrOn=!!g.pbr;brTexReady=true;
  for(const m of BR_DET)m.visible=brDetOn;
  for(const k in BR_MATS){const m=BR_MATS[k],d=m.userData.def;if(d.alpha?brDetOn:brTexWant)brTexQueue(k);brApply(m)}}
// each frame (main.js): the bridges wet through in a minute or two of rain and dry over about ten minutes after it
function brTick(dt){const w=Math.min(1,weather.r*1.6);brWet+=w>brWet?Math.min(w-brWet,dt/90):Math.max(w-brWet,-dt/600);
  if(Math.abs(brWet-brWetSeen)>0.01||(brWet===0&&brWetSeen!==0)){brWetSeen=brWet;for(const k in BR_MATS)brWetSet(BR_MATS[k])}}

// ---------- the kit ----------
// a deck's own frame: t metres along it, u out from its centreline (to the right going along), y up; Y(t) its deck height
function brFrame(b){const A=new THREE.Vector3(b.ux,0,b.uz),C=new THREE.Vector3(-b.uz,0,b.ux);
  return {A,C,L:b.len,hw:b.hw,yaw:Math.atan2(b.ux,b.uz),Y:t=>b.y+(b.y1-b.y)*t/b.len,
    P:(t,u,y)=>new THREE.Vector3(b.x0+b.ux*t-b.uz*u,y,b.z0+b.uz*t+b.ux*u),W:(t,u)=>[b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u]}}
const BR_UP=new THREE.Vector3(0,1,0),BR_ONE=new THREE.Vector3(1,1,1);
// a box whose texture coordinates are in metres along each face
function brBoxGeo(w,h,d){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv.array,F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let v=0;v<4;v++){const j=(f*4+v)*2;uv[j]*=F[f][0];uv[j+1]*=F[f][1]}return g}
// parts merged per material, the detail parts apart (BR_DET, hidden on Low graphics). Options (o): det a detail part;
// S the direction a member's width w is measured in (default across the deck); w1, h1 its size at the far end (a
// taper); seg, r1 a rod's sides and far radius; uv 'world' or 'local' instead of the material's own; hint which way a
// flat face looks
function brKit(F){const parts=new Map(),M4=new THREE.Matrix4(),a=new THREE.Vector3(),b=new THREE.Vector3(),n=new THREE.Vector3();
  function put(key,g,mx,o,uvMode){const mat=brMat(key),u=mat.userData,mode=uvMode||(o&&o.uv)||u.uv,t=1/u.tile;
    if(mx)g.applyMatrix4(mx);if(g.index)g=g.toNonIndexed();
    if(mode==='world'){const P=g.attributes.position.array,uv=new Float32Array(P.length/3*2);
      for(let i=0;i<P.length;i+=9){a.set(P[i+3]-P[i],P[i+4]-P[i+1],P[i+5]-P[i+2]);b.set(P[i+6]-P[i],P[i+7]-P[i+1],P[i+8]-P[i+2]);n.crossVectors(a,b);
        const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);
        for(let k=0;k<3;k++){const q=i+k*3,w=(i/3+k)*2;if(ay>=ax&&ay>=az){uv[w]=P[q]*t;uv[w+1]=P[q+2]*t}else if(ax>=az){uv[w]=P[q+2]*t;uv[w+1]=P[q+1]*t}else{uv[w]=P[q]*t;uv[w+1]=P[q+1]*t}}}
      g.setAttribute('uv',new THREE.BufferAttribute(uv,2))}
    else{const uv=g.attributes.uv.array;for(let i=0;i<uv.length;i++)uv[i]*=t}
    const det=!!(o&&o.det),k=key+(det?'|d':'');if(!parts.has(k))parts.set(k,{key,det,list:[]});parts.get(k).list.push(g)}
  // triangles from points, each turned to face hint (a direction), texture coordinates from the faces' directions
  function tris(key,pts,idx,hint,o){const pos=[];for(let i=0;i<idx.length;i+=3){let [p,q,r]=[pts[idx[i]],pts[idx[i+1]],pts[idx[i+2]]];
      a.subVectors(q,p);b.subVectors(r,p);n.crossVectors(a,b);if(hint&&n.dot(typeof hint==='function'?hint(p,q,r):hint)<0)[q,r]=[r,q];pos.push(p.x,p.y,p.z,q.x,q.y,q.z,r.x,r.y,r.z)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();put(key,g,null,o,'world')}
  const K={
    // a member from A to B, w wide (along S) by h deep
    seg(key,A,B,w,h,o={}){const d=new THREE.Vector3().subVectors(B,A),L=d.length();if(L<1e-4)return;const y=d.divideScalar(L),S=o.S||F.C;
      const x=S.clone().addScaledVector(y,-S.dot(y));if(x.lengthSq()<1e-6)x.crossVectors(BR_UP,y);if(x.lengthSq()<1e-6)x.set(1,0,0);x.normalize();const z=new THREE.Vector3().crossVectors(x,y);
      const g=brBoxGeo(w,L,h);if(o.w1!==undefined){const p=g.attributes.position;for(let i=0;i<p.count;i++){const f=p.getY(i)/L+0.5;p.setX(i,p.getX(i)*(1+(o.w1/w-1)*f));p.setZ(i,p.getZ(i)*(1+(o.h1/h-1)*f))}g.computeVertexNormals()}
      M4.makeBasis(x,y,z).setPosition((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);put(key,g,M4,o)},
    // a box square to the deck: w across, h high, d along, centred t along, u out, at height y
    box(key,w,h,d,t,u,y,o={}){K.seg(key,F.P(t-d/2,u,y),F.P(t+d/2,u,y),w,h,o)},
    // a round bar from A (radius r) to B (radius o.r1)
    rod(key,A,B,r,o={}){const d=new THREE.Vector3().subVectors(B,A),L=d.length();if(L<1e-4)return;
      const g=new THREE.CylinderGeometry(o.r1??r,r,L,o.seg||8,1,!!o.open),uv=g.attributes.uv.array;for(let i=0;i<uv.length;i+=2){uv[i]*=2*Math.PI*r;uv[i+1]*=L}
      M4.compose(new THREE.Vector3((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2),new THREE.Quaternion().setFromUnitVectors(BR_UP,d.divideScalar(L)),BR_ONE);put(key,g,M4,o)},
    // an upright oval column, ra along the deck and rc across, from y0 to y1
    oval(key,t,u,y0,y1,ra,rc,o={}){const g=new THREE.CylinderGeometry(1,1,y1-y0,24),c=F.P(t,u,(y0+y1)/2);
      M4.makeBasis(F.C.clone().multiplyScalar(rc),BR_UP,F.A.clone().multiplyScalar(-ra)).setPosition(c);put(key,g,M4,o,'world')},
    // a flat four-sided face, its texture coordinates in metres at each corner (or from its direction when left out)
    quad(key,P4,UV4,o={}){if(!UV4){K.poly(key,P4,o.hint,o);return}const pos=[],uvs=[],idx=[0,1,2,0,2,3];
      a.subVectors(P4[1],P4[0]);b.subVectors(P4[2],P4[0]);n.crossVectors(a,b);const flip=o.hint&&n.dot(o.hint)<0;
      for(let i=0;i<6;i++){const q=idx[flip?5-i:i];pos.push(P4[q].x,P4[q].y,P4[q].z);uvs.push(UV4[q][0],UV4[q][1])}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();put(key,g,null,o,'custom')},
    // a flat convex face through the points, looking toward hint
    poly(key,pts,hint,o){const idx=[];for(let i=1;i<pts.length-1;i++)idx.push(0,i,i+1);tris(key,pts,idx,hint,o)},
    // an upright prism over a convex outline ([x, z] points) from y0 to y1, the top drawn in by s about its middle (a batter)
    prism(key,pts,y0,y1,o={}){const s=o.s||1;let cx=0,cz=0;for(const [x,z] of pts){cx+=x/pts.length;cz+=z/pts.length}
      const lo=pts.map(([x,z])=>new THREE.Vector3(x,y0,z)),hi=pts.map(([x,z])=>new THREE.Vector3(cx+(x-cx)*s,y1,cz+(z-cz)*s)),out=p=>new THREE.Vector3(p.x-cx,0,p.z-cz);
      for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;K.poly(key,[lo[i],lo[j],hi[j],hi[i]],out(lo[i].clone().add(lo[j]).multiplyScalar(0.5)),o)}
      K.poly(key,hi,BR_UP,o)},
    // a cross-section (sec: [across, height above the deck] points, round it) swept along the deck from t0 to t1
    sweep(key,sec,t0,t1,o={}){const at=(t,[c,y])=>F.P(t,c,F.Y(t)+y);let mc=0,my=0;for(const [c,y] of sec){mc+=c/sec.length;my+=y/sec.length}
      for(let i=0;i<sec.length;i++){const j=(i+1)%sec.length,mid=[(sec[i][0]+sec[j][0])/2-mc,(sec[i][1]+sec[j][1])/2-my];
        K.poly(key,[at(t0,sec[i]),at(t1,sec[i]),at(t1,sec[j]),at(t0,sec[j])],F.C.clone().multiplyScalar(mid[0]).add(new THREE.Vector3(0,mid[1],0)),o)}
      const tri=THREE.ShapeUtils.triangulateShape(sec.map(([c,y])=>new THREE.Vector2(c,y)),[]).flat();
      for(const [t,s] of [[t0,-1],[t1,1]])tris(key,sec.map(p=>at(t,p)),tri,F.A.clone().multiplyScalar(s),o)},
    // into the scene (or a group), one mesh per material and kind; returns the meshes
    add(parent){const out=[];for(const {key,det,list} of parts.values()){let N=0;for(const g of list)N+=g.attributes.position.count;
        const P=new Float32Array(N*3),Nn=new Float32Array(N*3),U=new Float32Array(N*2);let at=0;
        for(const g of list){P.set(g.attributes.position.array,at*3);Nn.set(g.attributes.normal.array,at*3);U.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose()}
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(Nn,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));geo.computeBoundingSphere();
        const mat=brMat(key),m=new THREE.Mesh(geo,mat),glass=mat.userData.def.glass;m.castShadow=!glass;m.receiveShadow=!glass;if(!glass)m.layers.enable(RAIN_LAYER);
        if(det){BR_DET.push(m);m.visible=brDetOn}(parent||scene).add(m);out.push(m)}
      parts.clear();return out}};
  return K}
// a seat for a deck end where the ground falls away below it: stone up to an old-concrete coping at top, w across,
// reaching back under the approach; nothing where the ground is right up under the deck
function brAbut(K,F,t,dir,w,top,key){const t0=t-dir*1.2,t1=t+dir*2.6;let g=1e9;for(const tt of [t0,t,t1])for(const u of [-w/2,0,w/2]){const [x,z]=F.W(tt,u);g=Math.min(g,baseHeight(x,z))}
  if(g>top-0.3)return;const tm=(t0+t1)/2,len=Math.abs(t1-t0);K.box(key,w,top-0.4-(g-1),len,tm,0,(top-0.4+g-1)/2);K.box('concOld',w+0.3,0.4,len+0.3,tm,0,top-0.2)}
// a bronze builder's plaque, lettered, facing ry
function brPlaque(lines,w,h,x,y,z,ry){const cv=document.createElement('canvas');cv.width=512;cv.height=Math.round(512*h/w);const g=cv.getContext('2d');
  g.fillStyle='#4b3b22';g.fillRect(0,0,cv.width,cv.height);g.strokeStyle='#c9a35e';g.lineWidth=10;g.strokeRect(14,14,cv.width-28,cv.height-28);
  g.fillStyle='#d9b66c';g.textAlign='center';g.textBaseline='middle';const fs=cv.height*0.62/lines.length;
  lines.forEach((s,i)=>{g.font=`700 ${Math.round(fs*(i?0.62:0.8))}px Georgia,"Times New Roman",serif`;g.fillText(s,cv.width/2,cv.height*(0.5+(i-(lines.length-1)/2)*0.8/lines.length))});
  const tex=new THREE.CanvasTexture(cv);tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,metalness:0.7,roughness:0.45,envMap:skyEnv,envMapIntensity:0.6}));
  m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m}
// a cast-iron lamp post with a glass acorn globe (lit after dark: FAM_LAMPS, kind 1), standing at x, y0, z
function brAcorn(K,G,x,y0,z){const V=(h)=>new THREE.Vector3(x,y0+h,z);
  K.rod('iron',V(0),V(0.55),0.24,{seg:10,r1:0.17});K.rod('iron',V(0.55),V(3.9),0.09,{seg:12,r1:0.065});K.rod('iron',V(3.9),V(4.0),0.17,{seg:12,r1:0.12});
  for(const h of [0.62,1.7,3.82])K.rod('iron',V(h),V(h+0.07),0.12,{seg:12,det:1});K.rod('iron',V(4.5),V(4.62),0.1,{seg:10,r1:0.02,det:1});
  G.lit(new THREE.LatheGeometry([[0.05,0],[0.16,0.07],[0.205,0.21],[0.19,0.35],[0.12,0.45],[0.06,0.5]].map(([r,y])=>new THREE.Vector2(r,y)),12),0xfff1c8,x,y0+4.0,z);
  FAM_LAMPS.push([x,y0+4.25,z,1])}

// ---------- Corley's bridge: from the Lower Bench to the Family Island ----------
// three riveted Parker through-trusses with curved top chords, forest green gone chalky, on granite piers with pointed
// cutwaters; a concrete deck with asphalt and a lattice railing, acorn lamps at the ends and over the piers, and a
// bronze plaque on each end portal
(function(){
  const b=BRIDGES[0],F=brFrame(b),K=brKit(F),G=famKit(),L=F.L,Y=F.Y(0),hw=b.hw,P=F.P,TU=hw+0.95,piers=[34,69],ends=[0,...piers,L];
  // deck: concrete slab, asphalt, painted lines, curbs, steel joints over the piers
  K.seg('concOld',P(0,0,Y-0.19),P(L,0,Y-0.19),2*hw+0.7,0.3);K.seg('asphalt',P(0,0,Y-0.01),P(L,0,Y-0.01),2*hw,0.06);
  for(const s of [-1,1])K.seg('lineW',P(0,s*(hw-0.35),Y+0.025),P(L,s*(hw-0.35),Y+0.025),0.15,0.01);
  for(let t=2;t<L-3;t+=9)K.seg('lineY',P(t,0,Y+0.025),P(t+3,0,Y+0.025),0.15,0.01);
  for(const t of [0.15,...piers,L-0.15])K.seg('iron',P(t,-hw,Y+0.022),P(t,hw,Y+0.022),0.3,0.012,{S:F.A,det:1});
  // curbs and a lattice railing along each side
  for(const s of [-1,1]){const u=s*(hw+0.42);K.seg('concOld',P(0,s*(hw+0.22),Y+0.12),P(L,s*(hw+0.22),Y+0.12),0.45,0.28);
    K.seg('paintG',P(0,u,Y+1.27),P(L,u,Y+1.27),0.1,0.1);K.seg('paintG',P(0,u,Y+0.33),P(L,u,Y+0.33),0.08,0.08);
    for(let t=0;t<=L+0.01;t+=2.5)K.seg('paintG',P(t,u,Y+0.26),P(t,u,Y+1.3),0.1,0.1);
    K.quad('xlatG',[P(0,u,Y+0.37),P(L,u,Y+0.37),P(L,u,Y+1.22),P(0,u,Y+1.22)],[[0,0],[L,0],[L,0.5],[0,0.5]],{det:1})}
  // the trusses, a span between each pair of piers (0.9 m apart over each pier)
  for(let k=0;k<ends.length-1;k++){const a=ends[k]+0.45,e=ends[k+1]-0.45,n=Math.max(5,Math.round((e-a)/5)),X=i=>a+(e-a)*i/n,
      yb=Y-0.55,yt=i=>Y+5.9+2.4*Math.sin(Math.PI*i/n),c=n/2;
    for(const s of [-1,1]){const u=s*TU,B=i=>P(X(i),u,yb),T=i=>P(X(i),u,yt(i));
      // chords and end posts, riveted cover plates along the top
      K.seg('paintG',B(0),B(n),0.42,0.5);K.seg('paintG',B(0),T(1),0.5,0.5);K.seg('paintG',B(n),T(n-1),0.5,0.5);
      for(let i=1;i<n-1;i++){K.seg('paintG',T(i),T(i+1),0.5,0.45);K.seg('rivetG',P(X(i),u,yt(i)+0.235),P(X(i+1),u,yt(i+1)+0.235),0.6,0.025,{det:1})}
      for(const [i0,i1] of [[0,1],[n,n-1]])K.seg('rivetG',P(X(i0),u,yb+0.1),P(X(i1),u,yt(i1)+0.1),0.6,0.025,{det:1});
      // verticals: two channels each, laced between on both faces
      for(let i=1;i<n;i++){for(const o of [-0.13,0.13])K.seg('paintG',P(X(i)+o,u,yb+0.25),P(X(i)+o,u,yt(i)-0.22),0.34,0.07);
        const y0=yb+0.35,y1=yt(i)-0.3;for(const f of [-0.172,0.172])K.quad('laceG',[P(X(i)-0.13,u+f,y0),P(X(i)-0.13,u+f,y1),P(X(i)+0.13,u+f,y1),P(X(i)+0.13,u+f,y0)],[[0,0],[y1-y0,0],[y1-y0,0.7],[0,0.7]],{det:1})}
      // diagonals as pairs of eyebars sloping down toward the middle, and crossed rods in a middle panel
      const dg=(i,j)=>{for(const o of [-0.1,0.1])K.seg('paintG',P(X(i),u+o,yt(i)-0.15),P(X(j),u+o,yb+0.15),0.05,0.24)};
      for(let i=1;i<n-1;i++){if(i+1<=c)dg(i,i+1);if(i>=c+1)dg(i+1,i)}
      if(n%2)for(const [i,j] of [[Math.floor(c),Math.ceil(c)],[Math.ceil(c),Math.floor(c)]])K.rod('paintG',P(X(i),u,yt(i)-0.2),P(X(j),u,yb+0.2),0.035,{seg:6});
      // riveted gusset plates on both faces of every joint, and the bearing shoes at the ends
      for(let i=0;i<=n;i++)for(const f of [-0.25,0.25]){K.seg('rivetG',P(X(i),u+f,yb-0.25),P(X(i),u+f,yb+0.7),0.02,0.95,{det:1});
        if(i>0&&i<n)K.seg('rivetG',P(X(i),u+f,yt(i)-0.8),P(X(i),u+f,yt(i)+0.2),0.02,0.95,{det:1})}
      for(const i of [0,n])K.box('iron',0.7,0.45,0.8,X(i),u,Y-1.025)}
    // floor beams at the joints under five lines of stringers; struts and crossed rods between the top chords, knee
    // braces at the posts, and a latticed portal at each end of the span
    for(let i=0;i<=n;i++){K.seg('paintG',P(X(i),-TU,Y-0.75),P(X(i),TU,Y-0.75),0.3,0.85,{S:F.A});
      for(const dy of [-0.43,0.43])K.seg('paintG',P(X(i),-TU+0.2,Y-0.75+dy),P(X(i),TU-0.2,Y-0.75+dy),0.42,0.04,{S:F.A,det:1})}
    for(const u of [-3.2,-1.6,0,1.6,3.2])K.seg('paintG',P(X(0),u,Y-0.6),P(X(n),u,Y-0.6),0.22,0.5);
    for(let i=1;i<n;i++){const portal=i===1||i===n-1,y=yt(i);K.seg('paintG',P(X(i),-TU,y),P(X(i),TU,y),portal?0.4:0.3,portal?0.5:0.38,{S:F.A});
      if(i<n-1)for(const s of [-1,1])K.rod('paintG',P(X(i),-TU*s,y),P(X(i+1),TU*s,yt(i+1)),0.03,{seg:6,det:1});
      for(const s of [-1,1])K.seg('paintG',P(X(i),s*(TU-0.2),y-(portal?2.4:1.4)),P(X(i),s*(TU-(portal?1.6:1.3)),y-(portal?1.05:0.2)),0.1,0.2,{S:F.A,det:!portal});
      if(portal){K.quad('xlatG',[P(X(i),-TU+0.3,y-1.05),P(X(i),TU-0.3,y-1.05),P(X(i),TU-0.3,y-0.22),P(X(i),-TU+0.3,y-0.22)],[[0,0],[2*TU-0.6,0],[2*TU-0.6,0.5],[0,0.5]],{det:1});
        K.seg('paintG',P(X(i),-TU+0.3,y-1.08),P(X(i),TU-0.3,y-1.08),0.3,0.06,{S:F.A})}}
    // the builder's plaque on each end portal, facing the road in
    if(k===0||k===ends.length-2){const i=k===0?1:n-1,dir=k===0?-1:1,p=P(X(i)+dir*0.25,0,yt(i)-0.63);
      brPlaque(["CORLEY'S ISLAND BRIDGE",'1931','AMERICAN BRIDGE COMPANY · BUILDERS'],1.9,0.8,p.x,p.y,p.z,dir<0?Math.atan2(-b.ux,-b.uz):F.yaw)}}
  // granite piers with pointed cutwaters and an old-concrete coping, and seats at the ends
  for(const t of piers){const [cx,cz]=F.W(t,0),g=baseHeight(cx,cz),hc=TU+1.1;
    K.prism('ashlar',[[-1.3,-hc],[0,-hc-1.3],[1.3,-hc],[1.3,hc],[0,hc+1.3],[-1.3,hc]].map(([al,c])=>F.W(t+al,c)),g-1.5,Y-1.7,{s:0.95});
    K.box('concOld',2*hc+0.6,0.45,3.0,t,0,Y-1.475);const [ax,az]=F.W(t,-hc-1),[bx,bz]=F.W(t,hc+1);BOAT_WALLS.push({ax,az,bx,bz,r:1.4})}
  brAbut(K,F,0,-1,2*TU+2.2,Y-1.25,'ashlar');brAbut(K,F,L,1,2*TU+2.2,Y-1.25,'ashlar');
  // acorn lamps: both sides over each pier, and both sides of the road at each end
  for(const t of piers)for(const s of [-1,1]){const [x,z]=F.W(t,s*(hw+0.42));brAcorn(K,G,x,Y+0.26,z)}
  for(const t of [-2.2,L+2.2])for(const s of [-1,1]){const [x,z]=F.W(t,s*(hw+0.6));brAcorn(K,G,x,baseHeight(x,z),z)}
  K.add();famAdd(G);
})();

// ---------- the mainland bridge: from the Family Island to the trestle and the town ----------
// a slim concrete box girder hung from one inverted-Y pylon on the middle pier (140 ft above the deck) by two fans of
// white stay cables, its legs straddling the road; oval piers at the other two, stainless and glass parapets, LED lamps
(function(){
  const b=BRIDGES[1],F=brFrame(b),K=brKit(F),G=famKit(),L=F.L,Y=F.Y(0),hw=b.hw,P=F.P,PT=64,TOP=Y+42.7,AU=hw+0.5;
  // the girder: a box under the road with cantilevered edges that carry the cable anchors
  K.sweep('concrete',[[-4.65,-0.02],[4.65,-0.02],[4.65,-0.55],[3.3,-0.62],[2.5,-1.45],[-2.5,-1.45],[-3.3,-0.62],[-4.65,-0.55]],0,L);
  K.seg('asphalt',P(0,0,Y-0.01),P(L,0,Y-0.01),2*hw-0.3,0.06);
  for(const s of [-1,1])K.seg('lineW',P(0,s*(hw-0.45),Y+0.025),P(L,s*(hw-0.45),Y+0.025),0.15,0.01);
  for(const s of [-1,1])K.seg('lineY',P(0,s*0.1,Y+0.025),P(L,s*0.1,Y+0.025),0.1,0.01);
  for(const t of [0.15,L-0.15])K.seg('stain',P(t,-hw,Y+0.022),P(t,hw,Y+0.022),0.35,0.012,{S:F.A,det:1});
  // curbs, and a parapet of stainless posts and rails with glass between
  for(const s of [-1,1]){const u=s*(hw+0.28);K.seg('concrete',P(0,s*(hw-0.05),Y+0.1),P(L,s*(hw-0.05),Y+0.1),0.3,0.22);
    for(let t=0.4;t<L;t+=1.6)K.rod('stain',P(t,u,Y+0.05),P(t,u,Y+1.12),0.035,{seg:8});
    K.rod('stain',P(0,u,Y+1.12),P(L,u,Y+1.12),0.045,{seg:10});K.rod('stain',P(0,u,Y+0.2),P(L,u,Y+0.2),0.025,{seg:8,det:1});
    K.seg('glass',P(0,u,Y+0.64),P(L,u,Y+0.64),0.02,0.86)}
  // the pylon: a footing in the lake, two legs leaning in to meet 60 ft above the road, the mast, a beam under the deck
  const [px,pz]=F.W(PT,0),gP=baseHeight(px,pz),ft=WATER+0.9;
  K.box('concOld',16,ft-(gP-1.5),7.5,PT,0,(ft+gP-1.5)/2);
  for(const s of [-1,1])K.seg('concrete',P(PT,s*6.6,ft),P(PT,s*0.95,Y+18),1.9,1.35,{S:F.A,w1:1.6,h1:1.05});
  K.seg('concrete',P(PT,-5.9,Y-1.95),P(PT,5.9,Y-1.95),1.9,1.0,{S:F.A});
  K.box('concrete',2.6,2.2,2.6,PT,0,Y+17.6);K.seg('concrete',P(PT,0,Y+17),P(PT,0,TOP),1.6,2.2,{S:F.A,w1:1.1,h1:1.5});
  K.box('stain',1.3,0.25,1.7,PT,0,TOP+0.12);G.lit(new THREE.BoxGeometry(0.35,0.3,0.35),0xff3020,px,TOP+0.4,pz);
  // the stay cables, a plane each side: eight to the main span and seven to the back span, each in an anchor pipe at
  // the deck and a socket on the mast
  const stays=[];for(let k=1;k<=8;k++)stays.push([PT-6.2*k,Y+29+(k-1)*1.75]);for(let k=1;k<=7;k++)stays.push([PT+4.6*k,Y+29.8+(k-1)*1.8]);
  for(const [t,yA] of stays)for(const s of [-1,1]){const A=P(PT,s*0.5,yA),B=P(t,s*AU,Y+0.05),d=A.clone().sub(B).normalize();
    K.rod('cable',A,B,0.07,{seg:8,open:true});K.rod('stain',B,B.clone().addScaledVector(d,1.6),0.13,{seg:10,det:1});K.rod('stain',A,A.clone().addScaledVector(d,-0.6),0.12,{seg:10,det:1})}
  // oval piers under the other two supports, with bearings
  for(const t of [30,98]){const [x,z]=F.W(t,0),g=baseHeight(x,z)-1.5,top=Y-1.45;K.oval('concrete',t,0,g,top-0.25,1.1,2.9);
    for(const s of [-1,1])K.box('iron',0.8,0.25,0.8,t,s*1.8,top-0.125);const [ax,az]=F.W(t,-3.2),[bx,bz]=F.W(t,3.2);BOAT_WALLS.push({ax,az,bx,bz,r:1.3})}
  {const [ax,az]=F.W(PT,-7.5),[bx,bz]=F.W(PT,7.5);BOAT_WALLS.push({ax,az,bx,bz,r:3.8})}
  brAbut(K,F,0,-1,10,Y-1.45,'concOld');
  // slim LED lamps on the parapet line, staggered and clear of the cable anchors, reaching over the road
  for(const [t,s] of [[8,-1],[36.1,-1],[61,-1],[84.7,-1],[23.7,1],[48.5,1],[75.5,1],[99,1]]){const u=s*(hw+0.45);
    K.rod('galv',P(t,u,Y),P(t,u,Y+8.6),0.075,{seg:10,r1:0.05});K.seg('galv',P(t,u,Y+8.55),P(t,u-s*1.5,Y+8.68),0.06,0.06,{S:F.A});K.box('galv',0.8,0.09,0.3,t,u-s*1.75,Y+8.68);
    const [hx,hz]=F.W(t,u-s*1.75);G.lit(new THREE.BoxGeometry(0.62,0.03,0.22),0xfff1c8,hx,Y+8.62,hz,F.yaw)}
  K.add();famAdd(G);
})();
