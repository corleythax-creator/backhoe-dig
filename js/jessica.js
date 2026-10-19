// Corley's Island: Jessica's Island, east of the Family Island and reached on foot by a red covered bridge: a forest of
// pines and autumn trees, lantern-lit paths, a herb garden, a bench at the cliff edge and a stone and timber cottage
// with a library inside (shelves to the ceiling, a rolling ladder, a window seat, armchairs by the fire). Walk in and
// the roof lifts off so the camera can look down into the room. Machines can't cross the footbridge.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const jesGround=groundPatch(125,275,170,320,1.5,[]);
// roofs are seen from inside too, so both faces draw
const jesRoofMat=M(0xffffff,{vertexColors:true,side:THREE.DoubleSide});
const JB=BRIDGES[2],jesGlass=new THREE.MeshPhongMaterial({color:0xcfe3ea,transparent:true,opacity:0.22,depthWrite:false,shininess:80});
let jesPineGeo=null,jesIn=false,jesRoof=null,jesBridgeRoof=null,jesInside=null,jesFire=null;const jesSmoke=[];
function jesMesh(list,mat,shadow){if(!list.length)return null;const m=new THREE.Mesh(famMerge(list),mat);if(shadow){m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER)}scene.add(m);return m}

// ---------- the covered bridge ----------
(function(){
  const K=famKit(),R=famKit(),L=JB.len,X0=JB.x0,Z=JB.z0,hw=JB.hw,sl=Math.atan2(JB.y1-JB.y,L),Y=t=>JB.y+(JB.y1-JB.y)*t/L;
  const RED=0x8e3b2c,TRIM=0xefe6d2,WOOD=0x7a5434,STONE=0x8f8a84,ROOF=0x4f554a;
  // a member running along the bridge, centred t metres along it, dz across, dy above the deck
  const run=(Kc,t,dz,dy,len,h,d,col)=>Kc.box(len,h,d,col,X0+t,Y(t)+dy,Z+dz,0,0,sl);
  run(K,L/2,0,-0.15,L,0.3,2*hw+0.5,WOOD);
  for(let t=0.6;t<L;t+=1.2)run(K,t,0,0.005,0.04,0.02,2*hw,0x5e3f26);
  for(const s of [-1,1]){run(K,L/2,s*(hw+0.1),0.55,L,1.1,0.12,RED);run(K,L/2,s*(hw+0.1),1.12,L,0.1,0.24,TRIM);run(K,L/2,s*(hw+0.1),2.65,L,0.25,0.24,RED);
    for(let t=0;t<=L+0.01;t+=L/Math.round(L/2.4))K.box(0.18,2.6,0.18,RED,X0+t,Y(t)+1.35,Z+s*(hw+0.1));
    run(K,L/2,s*(hw-0.3),-0.6,L,0.6,0.3,WOOD)}
  // stone piers, and a white-trimmed portal at each end
  for(const t of [L/3,2*L/3]){const g=baseHeight(X0+t,Z)-2,top=Y(t)-0.9;K.box(2,top-g,2*hw+1.4,STONE,X0+t,(top+g)/2,Z);K.box(2.4,0.3,2*hw+1.8,0xa29d96,X0+t,top-0.15,Z)}
  for(const t of [0,L]){for(const s of [-1,1])K.box(0.26,2.8,0.26,TRIM,X0+t,Y(t)+1.4,Z+s*(hw+0.15));K.box(0.26,0.26,2*hw+0.6,TRIM,X0+t,Y(t)+2.75,Z)}
  // lanterns hanging inside
  for(let t=8;t<L-4;t+=11){K.box(0.04,0.4,0.04,0x333333,X0+t,Y(t)+2.45,Z);K.box(0.26,0.3,0.26,0x2f2f2f,X0+t,Y(t)+2.15,Z);K.lit(new THREE.BoxGeometry(0.2,0.22,0.2),0xffd27a,X0+t,Y(t)+2.1,Z)}
  // bollards keep the machines off at the Family Island end
  for(const s of [-1,1]){K.cyl(0.12,0.14,0.9,8,0xe5b322,X0-0.6,JB.y+0.45,Z+s*1.1);SOLIDS.push({x:X0-0.6,z:Z+s*1.1,hx:0.14,hz:0.14})}
  // the roof: red gables and a weathered shingle roof
  R.geo(famGable(2*hw+0.7,1.5,L+0.5),RED,X0+L/2,Y(L/2)+2.77,Z,0,0,sl);
  // each slope from the ridge out past the wall, so the two meet at the ridge
  const ra=Math.atan2(1.5,hw+0.35),rl=Math.hypot(hw+0.35,1.5)+0.55,mo=rl/2;
  for(const s of [-1,1])R.box(L+1.0,0.14,rl,ROOF,X0+L/2,Y(L/2)+2.77+1.5+0.08-mo*Math.sin(ra),Z+s*mo*Math.cos(ra),0,s*ra,sl);
  R.box(L+1.0,0.16,0.22,0x3d423a,X0+L/2,Y(L/2)+4.3,Z,0,0,sl);
  famAdd(K);jesBridgeRoof=jesMesh(R.solid,jesRoofMat,true);
  famSign(["JESSICA'S ISLAND"],3.4,0.75,X0-0.14,JB.y+3.35,Z,-Math.PI/2,'#8e3b2c','#fff4dc');
  famSign(['FAMILY ISLAND'],3.4,0.75,X0+L+0.14,JB.y1+3.35,Z,Math.PI/2,'#8e3b2c','#fff4dc');
})();

// ---------- the cottage and its library ----------
(function(){
  const K=famKit(),R=famKit(),I=famKit(),GL=famKit();
  const CX=JES_CX,CZ=JES_CZ,W=8,D=6.5,T=0.35,WH=3.2,y0=JES_Y;
  const PLASTER=0xe9dfc6,BEAM=0x5a3b26,STONE=0x8f8a84,MOSS=0x56704a,WOOD=0x8a5f3c,DARK=0x4a3020,TRIM=0xf2ead8;
  const xw=CX-W/2-T/2,xe=CX+W/2+T/2,zn=CZ-D/2-T/2,zs=CZ+D/2+T/2;
  // a wall along x (at z=c) or along z (at x=c) from a to b, with openings {a0, a1, y0, y1}; it also stands in SOLIDS
  // where it reaches the floor
  function wall(alongX,c,a,b,holes){
    const piece=(p0,p1,q0,q1)=>{if(p1-p0<1e-3||q1-q0<1e-3)return;const m=(p0+p1)/2,w=p1-p0,ym=y0+(q0+q1)/2;
      if(alongX)K.box(w,q1-q0,T,PLASTER,m,ym,c);else K.box(T,q1-q0,w,PLASTER,c,ym,m);
      if(q0===0){if(alongX)SOLIDS.push({x:m,z:c,hx:w/2,hz:T/2});else SOLIDS.push({x:c,z:m,hx:T/2,hz:w/2})}};
    let p=a;for(const o of holes){piece(p,o.a0,0,WH);piece(o.a0,o.a1,0,o.y0);piece(o.a0,o.a1,o.y1,WH);p=o.a1}piece(p,b,0,WH)}
  // windows: a white frame and cross bars on both faces, glass in the middle
  function win(alongX,c,a0,a1,q0,q1,out){const m=(a0+a1)/2,w=a1-a0,h=q1-q0,ym=y0+(q0+q1)/2;
    const bx=(ww,hh,dd,yy,off)=>alongX?K.box(ww,hh,dd,TRIM,m,yy,c+off):K.box(dd,hh,ww,TRIM,c+off,yy,m);
    for(const off of [-T/2,T/2]){bx(w+0.2,0.1,0.06,y0+q0,off);bx(w+0.2,0.1,0.06,y0+q1,off);bx(0.06,h,0.07,ym,off);bx(w,0.06,0.07,ym,off);
      if(alongX){K.box(0.1,h,0.06,TRIM,a0,ym,c+off);K.box(0.1,h,0.06,TRIM,a1,ym,c+off)}else{K.box(0.06,h,0.1,TRIM,c+off,ym,a0);K.box(0.06,h,0.1,TRIM,c+off,ym,a1)}}
    if(alongX)GL.box(w,h,0.03,0xffffff,m,ym,c);else GL.box(0.03,h,w,0xffffff,c,ym,m);
    // a flower box under it outside, red, pink and yellow
    const fx=alongX?m:c+out*(T/2+0.2),fz=alongX?c+out*(T/2+0.2):m;
    if(alongX)K.box(w+0.2,0.25,0.35,0x6b4428,fx,y0+q0-0.2,fz);else K.box(0.35,0.25,w+0.2,0x6b4428,fx,y0+q0-0.2,fz);
    for(let i=0;i<6;i++){const f=(i+0.5)/6-0.5,px=alongX?fx+f*w:fx,pz=alongX?fz:fz+f*w;K.geo(new THREE.IcosahedronGeometry(0.11,0),[0xd8434e,0xf08aa8,0xf2c94c,0x4f8a3e][i%4],px,y0+q0-0.02,pz,i)}}
  wall(true,zn,CX-W/2-T,CX+W/2+T,[]);
  wall(true,zs,CX-W/2-T,CX+W/2+T,[{a0:CX-1.3,a1:CX+1.3,y0:0.95,y1:2.35}]);
  wall(false,xe,CZ-D/2,CZ+D/2,[{a0:CZ-2.65,a1:CZ-1.75,y0:1.1,y1:2.3},{a0:CZ+1.75,a1:CZ+2.65,y0:1.1,y1:2.3}]);
  wall(false,xw,CZ-D/2,CZ+D/2,[{a0:CZ-0.65,a1:CZ+0.65,y0:0,y1:2.25}]);
  win(true,zs,CX-1.3,CX+1.3,0.95,2.35,1);win(false,xe,CZ-2.65,CZ-1.75,1.1,2.3,1);win(false,xe,CZ+1.75,CZ+2.65,1.1,2.3,1);
  // stone base and dark timber framing outside
  const ox=W/2+T+0.05,oz=D/2+T+0.05;
  K.box(2*ox,0.75,0.1,STONE,CX,y0+0.37,CZ-oz);K.box(2*ox,0.75,0.1,STONE,CX,y0+0.37,CZ+oz);K.box(0.1,0.75,2*oz,STONE,CX+ox,y0+0.37,CZ);
  for(const s of [-1,1])K.box(0.1,0.75,oz-0.7,STONE,CX-ox,y0+0.37,CZ+s*(oz+0.7)/2);
  for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]])K.box(0.24,WH,0.24,BEAM,CX+a*ox,y0+WH/2,CZ+b*oz);
  for(const s of [-1,1]){K.box(2*ox,0.18,0.08,BEAM,CX,y0+WH-0.05,CZ+s*oz);K.box(2*ox,0.14,0.08,BEAM,CX,y0+0.85,CZ+s*oz);
    for(const dx of [-2.6,2.6])K.box(0.18,WH-0.9,0.08,BEAM,CX+dx,y0+0.85+(WH-0.9)/2,CZ+s*oz);
    K.box(0.08,0.18,2*oz,BEAM,CX+s*ox,y0+WH-0.05,CZ)}
  // the front door, swung open inside, under a little gabled canopy with a lantern beside it
  K.box(1.4,0.12,0.12,TRIM,xw-T/2-0.02,y0+2.31,CZ);
  I.box(1.2,2.2,0.07,0x2f5a46,CX-W/2+0.62,y0+1.1,CZ-0.7);
  K.geo(famGable(1.9,0.7,1.1),PLASTER,xw-T/2-0.55,y0+2.5,CZ);for(const s of [-1,1])K.box(1.3,0.08,1.25,MOSS,xw-T/2-0.55,y0+2.86,CZ+s*0.5,0,s*0.65);
  K.box(0.9,0.12,1.6,STONE,xw-T/2-0.45,y0+0.06,CZ);
  K.box(0.2,0.3,0.2,0x2b2b2b,xw-T/2-0.12,y0+2.0,CZ+1.0);K.lit(new THREE.BoxGeometry(0.15,0.2,0.15),0xffd27a,xw-T/2-0.16,y0+1.98,CZ+1.0);
  // the roof (lifts off when you walk in): plaster gables and a mossy green roof with a ridge
  R.geo(famGable(D+2*T,3.0,W+2*T),PLASTER,CX,y0+WH,CZ);
  const ra=Math.atan2(3.0,D/2+T),rl=Math.hypot(D/2+T,3.0)+0.7,mo=rl/2;
  for(const s of [-1,1])R.box(W+2*T+0.9,0.22,rl,MOSS,CX,y0+WH+3.0+0.12-mo*Math.sin(ra),CZ+s*mo*Math.cos(ra),0,s*ra);
  R.box(W+2*T+0.9,0.2,0.3,0x435a3a,CX,y0+WH+3.05,CZ);
  // the stone chimney on the east gable
  const chx=xe+T/2+0.54,chTop=y0+WH+4.2;K.box(1.0,chTop-y0,1.4,STONE,chx,(chTop+y0)/2,CZ);K.box(1.2,0.2,1.6,0x77726d,chx,chTop+0.1,CZ);
  SOLIDS.push({x:chx,z:CZ,hx:0.5,hz:0.7});
  // ---- inside ----
  I.box(W,0.05,D,WOOD,CX,y0+0.02,CZ);for(let x=CX-W/2+0.25;x<CX+W/2;x+=0.25)I.box(0.015,0.01,D,0x6e4a2e,x,y0+0.05,CZ);
  // bookshelves along a wall: uprights, seven shelves, books in leather colours (heights and widths vary, one leans)
  let sd=5;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const BOOKS=[0x7a2b2b,0x2f4f3a,0x2a3a5a,0xb08a3a,0x5a3a26,0xd9cfb4,0x6a3550,0x3d5f6b,0x8c5a2b,0x1f2a3a];
  function shelves(alongX,face,dir,a0,a1){const dep=0.38,c=face+dir*dep/2,H=WH-0.05;
    const box=(p,w,y,h,d,col,off)=>alongX?I.box(w,h,d,col,p,y,c+(off||0)):I.box(d,h,w,col,c+(off||0),y,p);
    const n=Math.max(1,Math.round((a1-a0)/0.95));for(let i=0;i<=n;i++)box(a0+(a1-a0)*i/n,0.05,y0+H/2,H,dep,0x6b4428);
    const lv=[0.06,0.5,0.94,1.38,1.82,2.26,2.7,H];
    for(let k=0;k<lv.length;k++)box((a0+a1)/2,a1-a0,y0+lv[k],0.04,dep,0x6b4428);
    for(let k=0;k<lv.length-1;k++){const room=lv[k+1]-lv[k]-0.06;
      for(let i=0;i<n;i++){let p=a0+(a1-a0)*i/n+0.04;const end=a0+(a1-a0)*(i+1)/n-0.04;
        while(p<end-0.03){const w=0.03+rnd()*0.045,h=Math.min(room,0.24+rnd()*0.14);if(p+w>end)break;
          if(rnd()<0.08){p+=0.06;continue}
          box(p+w/2,w,y0+lv[k]+0.02+h/2,h,0.24,BOOKS[(rnd()*BOOKS.length)|0],-dir*0.03);p+=w+0.004}}}
    if(alongX)SOLIDS.push({x:(a0+a1)/2,z:c,hx:(a1-a0)/2,hz:dep/2});else SOLIDS.push({x:c,z:(a0+a1)/2,hx:dep/2,hz:(a1-a0)/2})}
  shelves(true,CZ-D/2,1,CX-W/2,CX+W/2);
  shelves(true,CZ+D/2,-1,CX-W/2+0.38,CX-1.45);shelves(true,CZ+D/2,-1,CX+1.45,CX+W/2-0.9);
  shelves(false,CX-W/2,1,CZ-D/2+0.38,CZ-0.95);shelves(false,CX-W/2,1,CZ+0.95,CZ+D/2-0.38);
  // the rolling ladder on its brass rail
  I.box(W-0.2,0.04,0.04,0xc9a04a,CX,y0+2.95,CZ-D/2+0.45);
  {const lx=CX-1.4,zb=CZ-D/2+1.15,zt=CZ-D/2+0.45,len=Math.hypot(zb-zt,2.95),ang=-Math.atan2(zb-zt,2.95);
    for(const s of [-1,1])I.box(0.06,len,0.07,0x7a5232,lx+s*0.24,y0+1.47,(zb+zt)/2,0,ang);
    for(let i=1;i<9;i++){const f=i/9;I.box(0.48,0.04,0.05,0x7a5232,lx,y0+2.95*f,zb+(zt-zb)*f)}}
  // the window seat: a cushioned bench in the south window with pillows, a plaid blanket and a sleeping cat
  I.box(2.6,0.5,0.62,0x6b4428,CX,y0+0.25,CZ+D/2-0.31);I.box(2.5,0.12,0.58,0x6f86a8,CX,y0+0.56,CZ+D/2-0.31);
  for(const [dx,col] of [[-1.0,0xd9a93c],[-0.62,0xc76f7a],[0.95,0xe8dcc0]])I.box(0.42,0.36,0.14,col,CX+dx,y0+0.8,CZ+D/2-0.12,0,-0.25);
  I.box(0.9,0.05,0.6,0xa33b2f,CX+0.35,y0+0.63,CZ+D/2-0.32);I.box(0.9,0.055,0.06,0x2f4f3a,CX+0.35,y0+0.635,CZ+D/2-0.42);
  {const cx=CX-0.2,cz=CZ+D/2-0.33,cy=y0+0.72,ORANGE=0xd9873a;const b=new THREE.IcosahedronGeometry(0.2,1);b.scale(1.3,0.7,1);I.geo(b,ORANGE,cx,cy,cz);
    I.geo(new THREE.IcosahedronGeometry(0.12,0),ORANGE,cx+0.24,cy+0.04,cz+0.04);
    for(const s of [-1,1])I.geo(new THREE.ConeGeometry(0.04,0.08,4),ORANGE,cx+0.27,cy+0.15,cz+0.04+s*0.06);
    const tail=new THREE.CylinderGeometry(0.035,0.035,0.4,5);I.geo(tail,ORANGE,cx-0.15,cy-0.05,cz+0.18,0,Math.PI/2,0.3)}
  SOLIDS.push({x:CX,z:CZ+D/2-0.31,hx:1.3,hz:0.31});
  // the fireplace: a stone surround and chimney breast, a wooden mantel with candles and a clock, logs and a fire
  {const fx=CX+W/2;for(const s of [-1,1])I.box(0.6,1.5,0.6,STONE,fx-0.3,y0+0.75,CZ+s*0.9);I.box(0.6,0.65,1.2,STONE,fx-0.3,y0+1.175,CZ);
    I.box(0.1,0.85,1.2,0x1f1a17,fx-0.05,y0+0.43,CZ);I.box(0.5,0.02,1.2,0x2a2420,fx-0.3,y0+0.09,CZ);
    I.box(1.1,0.08,2.8,0x77726d,fx-0.55,y0+0.04,CZ);I.box(0.8,0.12,2.7,0x6b4428,fx-0.4,y0+1.55,CZ);I.box(0.5,WH-1.61,1.6,STONE,fx-0.25,y0+1.61+(WH-1.61)/2,CZ);
    for(const dz of [-1.0,1.05])I.cyl(0.035,0.035,0.2,6,0xf3ead6,fx-0.45,y0+1.71,CZ+dz);for(const dz of [-1.0,1.05])I.lit(new THREE.ConeGeometry(0.025,0.06,5),0xffd27a,fx-0.45,y0+1.84,CZ+dz);
    I.box(0.12,0.3,0.24,0x5a3b26,fx-0.45,y0+1.76,CZ+0.3);I.box(0.02,0.18,0.18,0xf3ead6,fx-0.52,y0+1.78,CZ+0.3);
    for(let i=0;i<3;i++)I.cyl(0.07,0.07,0.9,6,0x4a3020,fx-0.3,y0+0.12+i*0.05,CZ+(i-1)*0.12,0,Math.PI/2+0.2*(i-1),0);
    SOLIDS.push({x:fx-0.45,z:CZ,hx:0.45,hz:1.3});
    const F=famKit();for(let i=0;i<5;i++)F.lit(new THREE.ConeGeometry(0.1+0.03*(i%2),0.35+0.12*(i%3),5),i%2?0xffb347:0xff7a2a,0,0.17+0.05*(i%3),(i-2)*0.11);
    jesFire=new THREE.Mesh(famMerge(F.glow),famGlowMat);jesFire.position.set(fx-0.3,y0+0.1,CZ);scene.add(jesFire)}
  // two armchairs facing the fire, a rug, a side table with books and a teacup, a reading lamp
  I.box(2.9,0.015,3.5,0xe8dcc0,CX+1.5,y0+0.05,CZ);I.box(2.6,0.02,3.2,0x7a2d2d,CX+1.5,y0+0.055,CZ);I.box(1.8,0.022,2.4,0x9a4a3a,CX+1.5,y0+0.057,CZ);
  for(const [dz,col] of [[-1.15,0x3f6b4a],[1.15,0x9a4a2e]]){const x=CX+1.25,z=CZ+dz;
    I.box(0.85,0.42,0.85,col,x,y0+0.25,z);I.box(0.75,0.1,0.75,col,x+0.04,y0+0.5,z);I.box(0.2,0.95,0.85,col,x-0.36,y0+0.67,z);
    for(const s of [-1,1])I.box(0.85,0.62,0.16,col,x,y0+0.36,z+s*0.37);SOLIDS.push({x,z,hx:0.45,hz:0.45})}
  {const tx=CX+1.15,tz=CZ;I.cyl(0.3,0.3,0.04,10,0x6b4428,tx,y0+0.6,tz);I.cyl(0.04,0.06,0.58,6,0x5a3b26,tx,y0+0.3,tz);
    I.box(0.24,0.05,0.17,0x2a3a5a,tx-0.06,y0+0.645,tz-0.05);I.box(0.22,0.05,0.16,0x7a2b2b,tx-0.05,y0+0.695,tz-0.04,0.3);
    I.cyl(0.07,0.07,0.01,8,0xf3ead6,tx+0.12,y0+0.625,tz+0.1);I.cyl(0.04,0.035,0.07,8,0xf3ead6,tx+0.12,y0+0.665,tz+0.1);SOLIDS.push({x:tx,z:tz,hx:0.3,hz:0.3})}
  {const lx=CX+0.55,lz=CZ-1.95;I.cyl(0.18,0.2,0.04,8,0x2b2b2b,lx,y0+0.04,lz);I.cyl(0.025,0.025,1.5,6,0x2b2b2b,lx,y0+0.8,lz);I.lit(new THREE.CylinderGeometry(0.16,0.26,0.28,8,1,true),0xffe0a0,lx,y0+1.6,lz)}
  // a potted fern in the corner by the window seat
  I.cyl(0.18,0.14,0.32,8,0xa65a3a,CX-1.7,y0+0.16,CZ+D/2-0.35);for(let i=0;i<5;i++)I.geo(new THREE.ConeGeometry(0.08,0.5,4),0x4f8a3e,CX-1.7+Math.cos(i*1.3)*0.08,y0+0.55,CZ+D/2-0.35+Math.sin(i*1.3)*0.08,i,Math.cos(i*1.3)*0.4,Math.sin(i*1.3)*0.4);
  famAdd(K);jesRoof=jesMesh(R.solid,jesRoofMat,true);jesInside=jesMesh(I.solid,famMat,false);
  if(I.glow.length){const g=new THREE.Mesh(famMerge(I.glow),famGlowMat);jesInside.add(g);g.position.set(0,0,0)}
  jesMesh(GL.solid,jesGlass,false);
  // chimney smoke: a few soft puffs rising and drifting off
  const pg=new THREE.IcosahedronGeometry(0.45,0);
  for(let i=0;i<7;i++){const m=new THREE.Mesh(pg,new THREE.MeshLambertMaterial({color:0xe2e2e0,transparent:true,opacity:0,depthWrite:false,flatShading:true}));
    m.userData={t:i*0.9,x:chx,y:chTop+0.3,z:CZ};scene.add(m);jesSmoke.push(m)}
})();

// ---------- outside: garden, bench, lanterns, an arch at the bridge, the forest ----------
(function(){
  const K=famKit(),G=(x,z)=>baseHeight(x,z);
  // herb garden south of the cottage: a white picket fence with a gate, three raised beds of herbs and flowers
  {const X=209,Z=257,FW=7,FD=5;
    const post=(x,z)=>{const y=G(x,z);K.box(0.07,0.9,0.07,0xf2ead8,x,y+0.45,z)};
    for(let i=0;i<=Math.round(FW/0.5);i++){const x=X-FW/2+i*0.5;post(x,Z+FD/2);if(Math.abs(x-X)>0.6)post(x,Z-FD/2)}
    for(let i=1;i<Math.round(FD/0.5);i++){post(X-FW/2,Z-FD/2+i*0.5);post(X+FW/2,Z-FD/2+i*0.5)}
    const y=G(X,Z);for(const h of [0.35,0.7]){K.box(FW,0.06,0.03,0xf2ead8,X,y+h,Z+FD/2);K.box(0.03,0.06,FD,0xf2ead8,X-FW/2,y+h,Z);K.box(0.03,0.06,FD,0xf2ead8,X+FW/2,y+h,Z);
      for(const s of [-1,1])K.box(FW/2-0.6,0.06,0.03,0xf2ead8,X+s*(FW/4+0.3),y+h,Z-FD/2)}
    SOLIDS.push({x:X,z:Z+FD/2,hx:FW/2,hz:0.08},{x:X-FW/2,z:Z,hx:0.08,hz:FD/2},{x:X+FW/2,z:Z,hx:0.08,hz:FD/2},{x:X-FW/4-0.3,z:Z-FD/2,hx:FW/4-0.3,hz:0.08},{x:X+FW/4+0.3,z:Z-FD/2,hx:FW/4-0.3,hz:0.08});
    for(const dx of [-2.2,0,2.2]){K.box(1.3,0.35,3,0x7a5434,X+dx,y+0.17,Z+0.3);K.box(1.2,0.04,2.9,0x4a3424,X+dx,y+0.35,Z+0.3);
      for(let i=0;i<8;i++){const px=X+dx+((i%2)-0.5)*0.6,pz=Z+0.3+(Math.floor(i/2)-1.5)*0.7;K.geo(new THREE.IcosahedronGeometry(0.17,0),[0x4f8a3e,0x6a9a4a,0x3f7a44][i%3],px,y+0.48,pz,i);
        if(i%3===0)K.geo(new THREE.IcosahedronGeometry(0.07,0),[0xb38be0,0xf2c94c,0xf08aa8][(i/3)%3|0],px,y+0.64,pz)}
      SOLIDS.push({x:X+dx,z:Z+0.3,hx:0.65,hz:1.5})}}
  // a bench at the east cliff, looking out over the lake to the mountains
  {const X=236.5,Z=245,y=G(X,Z);K.box(0.5,0.08,2.2,0x8a5c38,X,y+0.48,Z);K.box(0.08,0.5,2.2,0x8a5c38,X-0.25,y+0.85,Z);
    for(const s of [-1,1])K.box(0.5,0.48,0.1,0x55595c,X,y+0.24,Z+s*0.95);SOLIDS.push({x:X,z:Z,hx:0.3,hz:1.1})}
  // a wooden arch with her name where the path leaves the bridge
  {const X=168,Z=245,y=G(X,Z);for(const s of [-1,1])K.box(0.22,2.9,0.22,0x6b4428,X,y+1.45,Z+s*1.35);K.box(0.3,0.25,3.2,0x6b4428,X,y+2.95,Z);
    famSign(["JESSICA'S"],2.2,0.55,X-0.17,y+2.5,Z,-Math.PI/2,'#6b3a22','#f6e7c8');
    for(const s of [-1,1])SOLIDS.push({x:X,z:Z+s*1.35,hx:0.12,hz:0.12})}
  // lanterns along the paths
  for(const [x,z] of [[172,245.5],[180,249.5],[188,250.5],[195,242],[201,247.4],[206,250.5],[215,253.6],[224,250],[232,247.2]]){const y=G(x,z);
    K.box(0.09,1.3,0.09,0x2b2b2b,x,y+0.65,z);K.box(0.24,0.3,0.24,0x2b2b2b,x,y+1.42,z);K.lit(new THREE.BoxGeometry(0.18,0.22,0.18),0xffd27a,x,y+1.4,z);SOLIDS.push({x,z,hx:0.08,hz:0.08})}
  famAdd(K);
})();
const jesTrees=(function(){
  // a lighter pine than the map editor's (four ragged tiers), so a dense forest stays cheap on a phone
  const P=famKit();P.cyl(0.08,0.16,1.4,6,0x5c4030,0,0.7,0);
  for(let t=0;t<4;t++){const r=1.45*(1-t*0.2),h=1.7-t*0.12,b=0.8+t*1.0,g=new THREE.ConeGeometry(r,h,9,1,true),p=g.attributes.position;
    for(let i=0;i<p.count;i++)if(p.getY(i)<0){const k=i%2?1.12:0.92;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);p.setY(i,p.getY(i)-(i%2?0.15:0))}
    P.geo(g,[0x2a5233,0x30603a,0x387041,0x427a48][t],0,b+h/2,0);const cap=new THREE.CircleGeometry(r*0.95,9);cap.rotateX(Math.PI/2);P.geo(cap,0x1c3a24,0,b+0.02,0)}
  const pineGeo=jesPineGeo=famMerge(P.solid);
  let sd=29;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const out=[],ok=(x,z)=>{if(jesR(x,z)>JES_R-2.5)return false;if(roadOff(x,z)<ROAD_W/2+0.9)return false;
    if(Math.hypot(x-JES_CX,z-JES_CZ)<9.5||(Math.abs(x-209)<5.5&&Math.abs(z-257)<4.5)||Math.hypot(x-236.5,z-245)<4.5||(x<172&&Math.abs(z-245)<6))return false;
    if(SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+1.2&&Math.abs(z-s.z)<s.hz+1.2))return false;return !out.some(o=>Math.hypot(o.x-x,o.z-z)<2.4)};
  for(let g=0;g<9000&&out.length<200;g++){const x=JES_X-50+rnd()*100,z=JES_Z-50+rnd()*100;if(!ok(x,z))continue;
    out.push({t:rnd()<0.78?'pine':'leafy',x,z,yaw:rnd()*6.3,s:0.8+rnd()*0.65,c:(rnd()*6)|0})}
  const np=out.filter(o=>o.t==='pine').length,nl=out.length-np;
  const mk=(geo,mat,n)=>{const im=new THREE.InstancedMesh(geo,mat,n);im.castShadow=true;im.receiveShadow=true;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);scene.add(im);treeIMs.push(im);return im};
  const pines=mk(pineGeo,famMat,np),woods=mk(assetIMs.leafy[0].geometry,assetIMs.leafy[0].material,nl),crowns=mk(assetIMs.leafy[1].geometry,assetIMs.leafy[1].material,nl);
  const o=new THREE.Object3D(),c=new THREE.Color();let ip=0,il=0;
  for(const a of out){const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    o.position.set(a.x,baseHeight(a.x,a.z)-0.05,a.z);o.rotation.set((w-0.5)*0.08,a.yaw,(w2-0.5)*0.08);o.scale.set(a.s,a.s*(a.t==='pine'?0.95+0.4*w:1),a.s);o.updateMatrix();
    if(a.t==='pine'){const v=0.85+0.3*w2;pines.setMatrixAt(ip,o.matrix);c.setRGB(v,v*(0.95+0.1*w),v);pines.setColorAt(ip++,c)}
    else{const t=ASSET_LT[a.c%6],v=0.9+0.2*w2;woods.setMatrixAt(il,o.matrix);crowns.setMatrixAt(il,o.matrix);c.setRGB(t[0]*v,t[1]*v,t[2]*v);crowns.setColorAt(il,c);c.setRGB(1,1,1);woods.setColorAt(il++,c)}}
  return out})();

// every frame: the fire flickers, smoke rises, the library inside is drawn only when you are near, and the roof over
// the worker (the cottage's or the covered bridge's) lifts off in the chase view so you can see in
function jesTick(dt){
  const t=timeU.value,cx=camera.position.x-JES_CX,cz=camera.position.z-JES_CZ,near=cx*cx+cz*cz<90*90;
  jesInside.visible=near;jesFire.visible=near;
  if(near){jesFire.scale.set(1,0.8+0.18*Math.sin(t*11)+0.1*Math.sin(t*23.7),1+0.06*Math.sin(t*7.3))}
  for(const m of jesSmoke){const u=m.userData;u.t+=dt;if(u.t>6.3)u.t-=6.3;const a=u.t/6.3;
    m.position.set(u.x+a*2.6+Math.sin(u.t*1.3)*0.2,u.y+a*5.5,u.z+a*1.2);m.scale.setScalar(0.45+a*1.6);m.material.opacity=0.42*Math.min(1,a*6)*(1-a)}
  const foot=mode==='walk'&&!wk.inside&&camMode!=='cab';
  jesIn=foot&&Math.abs(wk.x-JES_CX)<4.3&&Math.abs(wk.z-JES_CZ)<3.5;jesRoof.visible=!jesIn;
  const [bt,bu]=deckLocal(JB,wk.x,wk.z);jesBridgeRoof.visible=!(foot&&bt>-1&&bt<JB.len+1&&Math.abs(bu)<JB.hw+0.6)}
