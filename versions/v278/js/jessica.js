// Corley's Island: Jessica's Island, east of the Family Island and reached on foot by a red covered bridge: a forest of
// pines and autumn trees, lantern-lit paths, a herb garden, a bench at the cliff edge and a stone and timber cottage
// with a library inside (shelves to the ceiling, a rolling ladder, a window seat, armchairs by the fire). Walk in and
// the roof lifts off so the camera can look down into the room. Machines can't cross the footbridge.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const jesGround=groundPatch(125,275,170,320,1.5,[]);
// roofs are seen from inside too, so both faces draw
const jesRoofMat=M(0xffffff,{vertexColors:true,side:THREE.DoubleSide});
const JB=BRIDGES[2],jesGlass=new THREE.MeshPhongMaterial({color:0xcfe3ea,transparent:true,opacity:0.22,depthWrite:false,shininess:80});
let jesIn=false,jesRoof=null,jesBridgeRoof=null,jesInside=null,jesCeil=null,jesFire=null;const jesSmoke=[],jesSteam=[];
const jesLight=new THREE.PointLight(0xffb066,0,9,1.4);jesLight.castShadow=false;
function jesLightGfx(on){jesLight.visible=!!on}
function jesMesh(list,mat,shadow){if(!list.length)return null;const m=new THREE.Mesh(famMerge(list),mat);if(shadow){m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER)}scene.add(m);return m}

// ---------- the covered bridge ----------
// a New England covered bridge on the bridge kit (bridges.js): barn-red board-and-batten siding with small daylight
// windows trimmed white, Town lattice trusses inside (planks crossing every 3 ft), a plank floor with running boards, a
// silver cedar shake roof that lifts off in the chase view (jesBridgeRoof), white-trimmed portals, granite piers
(function(){
  const F=brFrame(JB),K=brKit(F),R=brKit(F),G=famKit(),L=F.L,hw=JB.hw,X0=JB.x0,Z=JB.z0,Y=F.Y,WU=hw+0.12,at=(t,u,dy)=>F.P(t,u,Y(t)+dy);
  // floor: crosswise planks on floor beams over two big timbers, two running boards
  K.seg('planks',at(0,0,-0.08),at(L,0,-0.08),2*WU+0.1,0.16,{uv:'local'});
  for(const s of [-1,1]){K.seg('beam',at(0,s*0.55,0.025),at(L,s*0.55,0.025),0.5,0.05);walkStrip(JB,s*0.55,0.25,0.05);walkStrip(JB,s*(WU-0.2),0.11,0.34);K.seg('beam',at(0,s*(WU-0.15),-0.6),at(L,s*(WU-0.15),-0.6),0.3,0.5)}
  for(let t=0.4;t<L;t+=1.2)K.seg('beam',at(t,-WU-0.05,-0.3),at(t,WU+0.05,-0.3),0.2,0.28,{S:F.A});
  // a Town lattice truss inside each wall: chords, and planks crossing at 50 degrees every 3 ft
  const LB=0.34,LT=2.57,RUN=(LT-LB)/Math.tan(50*Math.PI/180);
  for(const s of [-1,1]){const u=s*(WU-0.2);K.seg('beam',at(0,u,0.17),at(L,u,0.17),0.22,0.34);K.seg('beam',at(0,u,2.72),at(L,u,2.72),0.22,0.3);
    for(let t0=-RUN;t0<L;t0+=0.9)for(const dir of [1,-1]){const f0=Math.max(0,(0.15-t0)/RUN),f1=Math.min(1,(L-0.15-t0)/RUN);if(f1-f0<0.05)continue;
      const y0=dir>0?LB:LT,y1=dir>0?LT:LB,p=f=>at(t0+f*RUN,u+dir*0.045,y0+(y1-y0)*f);K.seg('beam',p(f0),p(f1),0.07,0.24,{det:1})}}
  // the siding, with a row of small windows along each side, trimmed white
  const NW=Math.round(L/4.65),PW=L/NW,WH=0.38,S0=1.5,S1=2.05;
  for(const s of [-1,1]){const u=s*WU,uo=u+s*0.035;
    K.seg('barn',at(0,u,0.6),at(L,u,0.6),0.05,1.9);K.seg('barn',at(0,u,2.525),at(L,u,2.525),0.05,0.95);
    for(let k=0;k<=NW;k++){const a=k?(k-0.5)*PW+WH:0,b=k<NW?(k+0.5)*PW-WH:L;K.seg('barn',at(a,u,(S0+S1)/2),at(b,u,(S0+S1)/2),0.05,S1-S0)}
    for(let k=0;k<NW;k++){const c=(k+0.5)*PW;for(const y of [S0-0.04,S1+0.04])K.seg('white',at(c-WH-0.07,uo,y),at(c+WH+0.07,uo,y),0.05,0.07,{det:1});
      for(const e of [-1,1])K.seg('white',at(c+e*(WH+0.035),uo,S0),at(c+e*(WH+0.035),uo,S1),0.05,0.07,{det:1})}}
  // white portal trim at each end
  for(const t of [0,L]){for(const s of [-1,1])K.seg('white',at(t,s*(WU+0.03),-0.3),at(t,s*(WU+0.03),3.0),0.14,0.22);K.seg('white',at(t,-WU-0.1,2.86),at(t,WU+0.1,2.86),0.12,0.24,{S:F.A})}
  // the roof: cedar shakes over boards and rafters, white fascia and rake boards, red gables, tie beams across
  const EU=WU+0.45,EY=2.95,RY=4.5,SLP=Math.hypot(EU,RY-EY);
  for(const s of [-1,1]){const out=new THREE.Vector3(0,1,0).addScaledVector(F.C,s);
    R.quad('shakes',[at(-0.4,s*EU,EY),at(L+0.4,s*EU,EY),at(L+0.4,0,RY),at(-0.4,0,RY)],[[-0.4,0],[L+0.4,0],[L+0.4,SLP],[-0.4,SLP]],{hint:out});
    R.quad('beam',[at(-0.4,s*EU,EY-0.08),at(L+0.4,s*EU,EY-0.08),at(L+0.4,0,RY-0.08),at(-0.4,0,RY-0.08)],[[0,-0.4],[0,L+0.4],[SLP,L+0.4],[SLP,-0.4]],{hint:out.clone().negate()});
    R.seg('white',at(-0.4,s*(EU+0.02),EY-0.05),at(L+0.4,s*(EU+0.02),EY-0.05),0.04,0.2);
    for(let t=0.45;t<L;t+=0.9)R.seg('beam',at(t,s*(WU-0.05),EY+0.05),at(t,0,RY-0.14),0.06,0.16,{S:F.A,det:1})}
  R.seg('shakes',at(-0.45,0,RY+0.03),at(L+0.45,0,RY+0.03),0.36,0.1,{uv:'world'});
  for(let t=1.4;t<L;t+=2.79)R.seg('beam',at(t,-WU+0.1,2.92),at(t,WU-0.1,2.92),0.18,0.18,{S:F.A});
  for(const [t,d] of [[0,-1],[L,1]]){const o=F.A.clone().multiplyScalar(d);
    R.poly('barn',[at(t,-WU,2.75),at(t,WU,2.75),at(t,0,RY-0.05)],o);R.poly('beam',[at(t-d*0.06,-WU,2.75),at(t-d*0.06,WU,2.75),at(t-d*0.06,0,RY-0.05)],o.clone().negate());
    for(const s of [-1,1])R.seg('white',at(t+d*0.05,s*(EU+0.02),EY-0.08),at(t+d*0.05,0,RY+0.06),0.05,0.2,{S:F.A})}
  // granite piers with cutwaters, an old-concrete coping and timber bolsters under the floor; seats at the ends
  for(const t of [L/3,2*L/3]){const [cx,cz]=F.W(t,0),g=baseHeight(cx,cz),top=Y(t)-0.95;
    K.prism('ashlar',[[-1.1,-2.5],[0,-3.4],[1.1,-2.5],[1.1,2.5],[0,3.4],[-1.1,2.5]].map(([al,c])=>F.W(t+al,c)),g-1.5,top,{s:0.95});
    K.box('concOld',5.4,0.3,2.6,t,0,top+0.15);K.box('beam',2*WU+0.3,0.2,1.6,t,0,top+0.4);
    const [ax,az]=F.W(t,-3),[bx,bz]=F.W(t,3);BOAT_WALLS.push({ax,az,bx,bz,r:1.2})}
  brAbut(K,F,0,-1,2*WU+1.2,Y(0)-0.45,'ashlar');brAbut(K,F,L,1,2*WU+1.2,Y(L)-0.45,'ashlar');
  // lanterns hanging from a beam inside
  for(let t=8;t<L-4;t+=11){K.seg('beam',at(t,-WU+0.1,2.8),at(t,WU-0.1,2.8),0.15,0.15,{S:F.A});
    G.box(0.04,0.45,0.04,0x333333,X0+t,Y(t)+2.5,Z);G.box(0.26,0.3,0.26,0x2f2f2f,X0+t,Y(t)+2.15,Z);G.lit(new THREE.BoxGeometry(0.2,0.22,0.2),0xffd27a,X0+t,Y(t)+2.1,Z)}
  // bollards keep the machines off at the Family Island end
  for(const s of [-1,1]){G.cyl(0.12,0.14,0.9,8,0xe5b322,X0-0.6,JB.y+0.45,Z+s*1.1);SOLIDS.push({x:X0-0.6,z:Z+s*1.1,hx:0.14,hz:0.14})}
  K.add();famAdd(G);const RG=new THREE.Group();scene.add(RG);R.add(RG);jesBridgeRoof=RG;
  famSign(["JESSICA'S ISLAND"],3.4,0.75,X0-0.14,JB.y+3.35,Z,-Math.PI/2,'#8e3b2c','#fff4dc');
  famSign(['FAMILY ISLAND'],3.4,0.75,X0+L+0.14,JB.y1+3.35,Z,Math.PI/2,'#8e3b2c','#fff4dc');
})();

// ---------- the cottage and its library ----------
(function(){
  const K=famKit(),R=famKit(),I=famKit(),GL=famKit(),CE=famKit();
  const CX=JES_CX,CZ=JES_CZ,W=8,D=6.5,T=0.35,WH=3.2,y0=JES_Y;
  const PLASTER=0xe9dfc6,BEAM='beam',STONE=0x8f8a84,MOSS=0x56704a,WOOD=0x8a5f3c,DARK=0x4a3020,TRIM=0xf2ead8;
  const xw=CX-W/2-T/2,xe=CX+W/2+T/2,zn=CZ-D/2-T/2,zs=CZ+D/2+T/2;
  // a wall along x (at z=c) or along z (at x=c) from a to b, with openings {a0, a1, y0, y1}; it also stands in SOLIDS
  // where it reaches the floor
  function wall(alongX,c,a,b,holes){
    const piece=(p0,p1,q0,q1)=>{if(p1-p0<1e-3||q1-q0<1e-3)return;const m=(p0+p1)/2,w=p1-p0,ym=y0+(q0+q1)/2;
      if(alongX)K.box(w,q1-q0,T,'plaster',m,ym,c);else K.box(T,q1-q0,w,'plaster',c,ym,m);
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
  K.box(2*ox,0.75,0.1,'cobble',CX,y0+0.37,CZ-oz);K.box(2*ox,0.75,0.1,'cobble',CX,y0+0.37,CZ+oz);K.box(0.1,0.75,2*oz,'cobble',CX+ox,y0+0.37,CZ);
  for(const s of [-1,1])K.box(0.1,0.75,oz-0.7,'cobble',CX-ox,y0+0.37,CZ+s*(oz+0.7)/2);
  for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]])K.box(0.24,WH,0.24,BEAM,CX+a*ox,y0+WH/2,CZ+b*oz);
  for(const s of [-1,1]){K.box(2*ox,0.18,0.08,'beam~',CX,y0+WH-0.05,CZ+s*oz);K.box(2*ox,0.14,0.08,'beam~',CX,y0+0.85,CZ+s*oz);
    for(const dx of [-2.6,2.6])K.box(0.18,WH-0.9,0.08,BEAM,CX+dx,y0+0.85+(WH-0.9)/2,CZ+s*oz);
    K.box(0.08,0.18,2*oz,'beam~',CX+s*ox,y0+WH-0.05,CZ)}
  // the front door, swung open inside, under a little gabled canopy with a lantern beside it
  K.box(1.4,0.12,0.12,TRIM,xw-T/2-0.02,y0+2.31,CZ);
  I.box(1.2,2.2,0.07,0x2f5a46,CX-W/2+0.62,y0+1.1,CZ-0.7);
  K.geo(famGable(1.9,0.7,1.1),'plaster',xw-T/2-0.55,y0+2.5,CZ);for(const s of [-1,1])K.box(1.3,0.08,1.25,MOSS,xw-T/2-0.55,y0+2.86,CZ+s*0.5,0,s*0.65);
  K.box(0.9,0.12,1.6,'flagstone',xw-T/2-0.45,y0+0.06,CZ);walkPad(xw-T/2-0.45,CZ,0.45,0.8,0,y0+0.12);
  K.box(0.2,0.3,0.2,0x2b2b2b,xw-T/2-0.12,y0+2.0,CZ+1.0);K.lit(new THREE.BoxGeometry(0.15,0.2,0.15),0xffd27a,xw-T/2-0.16,y0+1.98,CZ+1.0);
  // the roof (lifts off when you walk in): plaster gables and a mossy green roof with a ridge
  R.geo(famGable(D+2*T,3.0,W+2*T),PLASTER,CX,y0+WH,CZ);
  const ra=Math.atan2(3.0,D/2+T),rl=Math.hypot(D/2+T,3.0)+0.7,mo=rl/2;
  for(const s of [-1,1])R.box(W+2*T+0.9,0.22,rl,MOSS,CX,y0+WH+3.0+0.12-mo*Math.sin(ra),CZ+s*mo*Math.cos(ra),0,s*ra);
  R.box(W+2*T+0.9,0.2,0.3,0x435a3a,CX,y0+WH+3.05,CZ);
  // the stone chimney on the east gable
  const chx=xe+T/2+0.54,chTop=y0+WH+4.2;K.box(1.0,chTop-y0,1.4,'cobble',chx,(chTop+y0)/2,CZ);K.box(1.2,0.2,1.6,0x77726d,chx,chTop+0.1,CZ);
  SOLIDS.push({x:chx,z:CZ,hx:0.5,hz:0.7});
  // ---- inside ----
  I.box(W,0.05,D,WOOD,CX,y0+0.02,CZ);walkPad(CX,CZ,W/2,D/2,0,y0+0.045);for(let x=CX-W/2+0.25;x<CX+W/2;x+=0.25)I.box(0.015,0.01,D,0x6e4a2e,x,y0+0.05,CZ);
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
          // now and then a few lying flat in a stack, with room to spare beside them
          if(rnd()<0.05&&p+0.22<end&&room>0.14){for(let q=0;q<3;q++)box(p+0.1,0.19-q*0.012,y0+lv[k]+0.035+q*0.034,0.032,0.21-q*0.01,BOOKS[(rnd()*BOOKS.length)|0],-dir*0.03);p+=0.23;continue}
          const col=BOOKS[(rnd()*BOOKS.length)|0],yb=y0+lv[k]+0.02;box(p+w/2,w,yb+h/2,h,0.24,col,-dir*0.03);
          // gilt bands and a title label on the spine of about half of them
          if(rnd()<0.5){const g=rnd()<0.75?0xc9a04a:0xe8dcc0;box(p+w/2,w+0.002,yb+h*0.82,0.012,0.006,g,dir*0.093);box(p+w/2,w+0.002,yb+h*0.18,0.012,0.006,g,dir*0.093);
            if(rnd()<0.5)box(p+w/2,w*0.7,yb+h*0.55,h*0.22,0.006,g===0xe8dcc0?0xc9a04a:0xe8dcc0,dir*0.093)}
          p+=w+0.004}}}
    if(alongX)SOLIDS.push({x:(a0+a1)/2,z:c,hx:(a1-a0)/2,hz:dep/2});else SOLIDS.push({x:c,z:(a0+a1)/2,hx:dep/2,hz:(a1-a0)/2})}
  shelves(true,CZ-D/2,1,CX-W/2,CX+W/2);
  shelves(true,CZ+D/2,-1,CX-W/2+0.38,CX-1.45);shelves(true,CZ+D/2,-1,CX+1.45,CX+W/2-0.9);
  shelves(false,CX-W/2,1,CZ-D/2+0.38,CZ-0.95);shelves(false,CX-W/2,1,CZ+0.95,CZ+D/2-0.38);
  // the rolling ladder on its brass rail
  I.box(W-0.2,0.04,0.04,0xc9a04a,CX,y0+2.95,CZ-D/2+0.45);
  {const lx=CX-1.4,zb=CZ-D/2+1.15,zt=CZ-D/2+0.45,len=Math.hypot(zb-zt,2.95),ang=-Math.atan2(zb-zt,2.95);
    for(const s of [-1,1])I.box(0.06,len,0.07,0x7a5232,lx+s*0.24,y0+1.47,(zb+zt)/2,0,ang);
    for(let i=1;i<9;i++){const f=i/9;I.box(0.48,0.04,0.05,0x7a5232,lx,y0+2.95*f,zb+(zt-zb)*f)}}
  // the window seat: a cushioned bench in the south window with pillows and a plaid blanket (the ginger cat asleep on
  // it is below, with the tuxedo cat)
  I.box(2.6,0.5,0.62,0x6b4428,CX,y0+0.25,CZ+D/2-0.31);I.box(2.5,0.12,0.58,0x6f86a8,CX,y0+0.56,CZ+D/2-0.31);
  for(const [dx,col] of [[-1.0,0xd9a93c],[-0.62,0xc76f7a],[0.95,0xe8dcc0]])I.box(0.42,0.36,0.14,col,CX+dx,y0+0.8,CZ+D/2-0.12,0,-0.25);
  I.box(0.9,0.05,0.6,0xa33b2f,CX+0.35,y0+0.63,CZ+D/2-0.32);I.box(0.9,0.055,0.06,0x2f4f3a,CX+0.35,y0+0.635,CZ+D/2-0.42);
  SOLIDS.push({x:CX,z:CZ+D/2-0.31,hx:1.3,hz:0.31});
  // the fireplace: a stone surround and chimney breast, a wooden mantel with candles and a clock, logs and a fire
  {const fx=CX+W/2;for(const s of [-1,1])I.box(0.6,1.5,0.6,STONE,fx-0.3,y0+0.75,CZ+s*0.9);I.box(0.6,0.65,1.2,STONE,fx-0.3,y0+1.175,CZ);
    I.box(0.1,0.85,1.2,0x1f1a17,fx-0.05,y0+0.43,CZ);I.box(0.5,0.02,1.2,0x2a2420,fx-0.3,y0+0.09,CZ);
    I.box(1.1,0.08,2.8,0x77726d,fx-0.55,y0+0.04,CZ);walkPad(fx-0.55,CZ,0.55,1.4,0,y0+0.08);I.box(0.8,0.12,2.7,0x6b4428,fx-0.4,y0+1.55,CZ);I.box(0.5,WH-1.61,1.6,STONE,fx-0.25,y0+1.61+(WH-1.61)/2,CZ);
    for(const dz of [-1.0,1.05])I.cyl(0.035,0.035,0.2,6,0xf3ead6,fx-0.45,y0+1.71,CZ+dz);for(const dz of [-1.0,1.05])I.lit(new THREE.ConeGeometry(0.025,0.06,5),0xffd27a,fx-0.45,y0+1.84,CZ+dz);
    I.box(0.12,0.3,0.24,0x5a3b26,fx-0.45,y0+1.76,CZ+0.3);I.box(0.02,0.18,0.18,0xf3ead6,fx-0.52,y0+1.78,CZ+0.3);
    for(let i=0;i<3;i++)I.cyl(0.07,0.07,0.9,6,0x4a3020,fx-0.3,y0+0.12+i*0.05,CZ+(i-1)*0.12,0,Math.PI/2+0.2*(i-1),0);
    SOLIDS.push({x:fx-0.45,z:CZ,hx:0.45,hz:1.3});
    const F=famKit();for(let i=0;i<5;i++)F.lit(new THREE.ConeGeometry(0.1+0.03*(i%2),0.35+0.12*(i%3),5),i%2?0xffb347:0xff7a2a,0,0.17+0.05*(i%3),(i-2)*0.11);
    jesFire=new THREE.Mesh(famMerge(F.glow),famGlowMat);jesFire.position.set(fx-0.3,y0+0.1,CZ);scene.add(jesFire)}
  // two armchairs facing the fire, a rug, a side table with books and a teacup, a reading lamp
  I.box(2.9,0.015,3.5,0xe8dcc0,CX+1.5,y0+0.05,CZ);I.box(2.6,0.02,3.2,0x7a2d2d,CX+1.5,y0+0.055,CZ);I.box(1.8,0.022,2.4,0x9a4a3a,CX+1.5,y0+0.057,CZ);
  // two wingback armchairs: turned legs, a deep seat cushion, rolled arms, wings and a button-tufted back
  for(const [dz,col,dk] of [[-1.15,0x3f6b4a,0x335a3e],[1.15,0x9a4a2e,0x7e3c25]]){const x=CX+1.25,z=CZ+dz;
    for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]])I.cyl(0.03,0.022,0.12,6,0x4a3020,x+a*0.34,y0+0.1,z+b*0.34);
    I.box(0.82,0.26,0.82,dk,x,y0+0.29,z);I.box(0.66,0.13,0.62,col,x+0.06,y0+0.48,z);I.cyl(0.065,0.065,0.62,10,col,x+0.39,y0+0.48,z,0,Math.PI/2);
    I.box(0.18,0.9,0.74,col,x-0.34,y0+0.82,z);I.cyl(0.09,0.09,0.74,10,col,x-0.34,y0+1.27,z,0,Math.PI/2);
    for(let i=0;i<6;i++)I.geo(new THREE.IcosahedronGeometry(0.018,0),dk,x-0.245,y0+0.75+((i/3)|0)*0.25,z+((i%3)-1)*0.2,i);
    for(const s of [-1,1]){I.box(0.72,0.36,0.12,col,x+0.02,y0+0.58,z+s*0.36);I.cyl(0.075,0.075,0.72,10,col,x+0.02,y0+0.78,z+s*0.36,0,0,Math.PI/2);
      I.box(0.26,0.5,0.1,col,x-0.24,y0+1.02,z+s*0.36,0,-s*0.12)}
    SOLIDS.push({x,z,hx:0.45,hz:0.45})}
  {const tx=CX+1.15,tz=CZ;I.cyl(0.3,0.3,0.04,10,0x6b4428,tx,y0+0.6,tz);I.cyl(0.04,0.06,0.58,6,0x5a3b26,tx,y0+0.3,tz);
    I.box(0.24,0.05,0.17,0x2a3a5a,tx-0.06,y0+0.645,tz-0.05);I.box(0.22,0.05,0.16,0x7a2b2b,tx-0.05,y0+0.695,tz-0.04,0.3);
    I.cyl(0.07,0.07,0.01,8,0xf3ead6,tx+0.12,y0+0.625,tz+0.1);I.cyl(0.04,0.035,0.07,8,0xf3ead6,tx+0.12,y0+0.665,tz+0.1);SOLIDS.push({x:tx,z:tz,hx:0.3,hz:0.3})}
  {const lx=CX+0.55,lz=CZ-1.95;I.cyl(0.18,0.2,0.04,8,0x2b2b2b,lx,y0+0.04,lz);I.cyl(0.025,0.025,1.5,6,0x2b2b2b,lx,y0+0.8,lz);I.lit(new THREE.CylinderGeometry(0.16,0.26,0.28,8,1,true),0xffe0a0,lx,y0+1.6,lz)}
  // a potted fern in the corner by the window seat
  I.cyl(0.18,0.14,0.32,8,0xa65a3a,CX-1.7,y0+0.16,CZ+D/2-0.35);for(let i=0;i<5;i++)I.geo(new THREE.ConeGeometry(0.08,0.5,4),0x4f8a3e,CX-1.7+Math.cos(i*1.3)*0.08,y0+0.55,CZ+D/2-0.35+Math.sin(i*1.3)*0.08,i,Math.cos(i*1.3)*0.4,Math.sin(i*1.3)*0.4);
  // ---- the cozy extras ----
  const IRON=0x2b2724,BRASS=0xc9a04a,CREAM=0xf3ead6;
  // under the roof (and lifted with it when you walk in, so the camera sees down past them): exposed oak tie beams and a
  // wrought-iron candle chandelier on a chain from the middle one
  for(const bx of [-2.6,0,2.6])CE.box(0.2,0.22,D,0x4e3322,CX+bx,y0+WH-0.12,CZ);
  {const hy=y0+2.45;for(let i=0;i<5;i++)CE.geo(new THREE.TorusGeometry(0.03,0.007,4,8),IRON,CX,y0+WH-0.27-i*0.055,CZ,i*1.57);
    CE.geo(new THREE.TorusGeometry(0.42,0.018,5,24),IRON,CX,hy,CZ,0,Math.PI/2);CE.cyl(0.02,0.02,0.4,6,IRON,CX,hy+0.2,CZ);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,x=CX+Math.cos(a)*0.42,z=CZ+Math.sin(a)*0.42;CE.cyl(0.045,0.03,0.03,8,IRON,x,hy+0.02,z);
      CE.cyl(0.022,0.022,0.13,6,CREAM,x,hy+0.1,z);CE.lit(new THREE.ConeGeometry(0.016,0.05,5),0xffc866,x,hy+0.19,z)}}
  // bunches of lavender, sage and rosemary drying on a twine strung under the mantel shelf
  {const fx=CX+W/2-0.82;I.box(0.006,0.006,2.4,0xd8c79a,fx,y0+1.47,CZ);
    for(let i=0;i<9;i++){const z=CZ-1.1+i*0.275;const b=new THREE.ConeGeometry(0.045,0.2,6);b.rotateX(Math.PI);
      I.geo(b,[0x8a6fb0,0x7d9a6a,0x5f7a4a,0x9a7bb8,0x6f8a5a,0x8a6a4a][i%6],fx,y0+1.33,z,i);I.box(0.025,0.025,0.025,0xa33b2f,fx,y0+1.44,z)}}
  // fairy lights strung along the top of the shelves, drooping a little between their hooks
  function fairy(alongX,c,a0,a1){const n=Math.round((a1-a0)/0.16);let px=null;
    for(let i=0;i<=n;i++){const f=i/n,a=a0+(a1-a0)*f,sag=0.07*Math.sin(Math.PI*((f*6)%1)),y=y0+3.06-sag,x=alongX?a:c,z=alongX?c:a;
      I.lit(new THREE.IcosahedronGeometry(0.018,0),i%3===1?0xffe6b0:0xffcf7a,x,y,z);
      if(px){const dx=x-px[0],dy=y-px[1],dz=z-px[2],l=Math.hypot(dx,dy,dz);I.box(0.004,0.004,l,0x3a3a2a,(x+px[0])/2,(y+px[1])/2,(z+px[2])/2,Math.atan2(dx,dz),-Math.asin(dy/l))}
      px=[x,y,z]}}
  fairy(true,CZ-D/2+0.42,CX-W/2+0.1,CX+W/2-0.1);fairy(true,CZ+D/2-0.42,CX-W/2+0.45,CX-1.5);fairy(true,CZ+D/2-0.42,CX+1.5,CX+W/2-0.95);
  // the writing desk under the north shelves: turned legs, a drawer, a green banker's lamp, an open book, ink and quill
  {const dx=CX-2.3,dz=CZ-1.6,top=y0+0.76;I.box(1.3,0.045,0.66,0x6e4528,dx,top,dz);I.box(1.22,0.12,0.6,0x5e3a22,dx,top-0.08,dz);
    I.box(0.5,0.08,0.01,0x7a5232,dx,top-0.08,dz+0.305);I.box(0.06,0.015,0.015,BRASS,dx,top-0.08,dz+0.315);
    for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]])I.cyl(0.028,0.02,0.7,6,0x5e3a22,dx+a*0.58,y0+0.38,dz+b*0.27);
    I.cyl(0.07,0.08,0.02,10,BRASS,dx-0.42,top+0.03,dz-0.14);I.cyl(0.012,0.012,0.3,6,BRASS,dx-0.42,top+0.18,dz-0.14);
    const sh=new THREE.CylinderGeometry(0.08,0.08,0.34,10,1,true,0,Math.PI);sh.rotateZ(Math.PI/2);I.geo(sh,0x1f5a36,dx-0.42,top+0.33,dz-0.1,0,0.15);
    I.lit(new THREE.BoxGeometry(0.3,0.012,0.1),0xfff0c8,dx-0.42,top+0.3,dz-0.1);
    I.box(0.2,0.012,0.27,0xefe6cf,dx-0.02,top+0.035,dz+0.04,0.1,0,-0.06);I.box(0.2,0.012,0.27,0xefe6cf,dx+0.18,top+0.035,dz+0.06,0.1,0,0.06);I.box(0.42,0.01,0.29,0x7a2b2b,dx+0.08,top+0.026,dz+0.05,0.1);
    I.cyl(0.03,0.034,0.05,8,0x1a2030,dx+0.42,top+0.05,dz-0.15);I.geo(new THREE.ConeGeometry(0.012,0.26,4),CREAM,dx+0.45,top+0.17,dz-0.13,0,0.2,-0.35);
    for(let i=0;i<3;i++)I.box(0.26-i*0.02,0.05,0.19,[0x2f4f3a,0x6a3550,0xb08a3a][i],dx+0.5,top+0.05+i*0.05,dz+0.16,0.2*i-0.15);
    I.cyl(0.04,0.036,0.09,10,0xc76f4a,dx+0.28,top+0.07,dz-0.22);
    SOLIDS.push({x:dx,z:dz,hx:0.66,hz:0.34});
    // its chair: a spindle-back Windsor pulled out a little
    const cx=dx+0.1,cz=dz+0.68;I.box(0.46,0.05,0.44,0x7a5232,cx,y0+0.46,cz);for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]])I.cyl(0.02,0.018,0.45,6,0x6b4428,cx+a*0.19,y0+0.23,cz+b*0.18,0,b*0.08,-a*0.08);
    for(let i=0;i<6;i++)I.cyl(0.011,0.011,0.5,5,0x6b4428,cx-0.19+i*0.076,y0+0.73,cz+0.2,0,-0.12);I.box(0.5,0.05,0.05,0x7a5232,cx,y0+0.98,cz+0.23);
    I.box(0.4,0.06,0.38,0x9a4a3a,cx,y0+0.5,cz);SOLIDS.push({x:cx,z:cz,hx:0.24,hz:0.24})}
  // a globe on a tripod stand in the south-west corner
  {const gx=CX-3.05,gz=CZ+2.0;for(let i=0;i<3;i++){const a=i*2.09;I.cyl(0.015,0.02,0.72,5,0x5e3a22,gx+Math.cos(a)*0.12,y0+0.36,gz+Math.sin(a)*0.12,0,Math.sin(a)*0.2,-Math.cos(a)*0.2)}
    I.geo(new THREE.TorusGeometry(0.27,0.012,4,24),BRASS,gx,y0+1.0,gz,0.4);I.geo(new THREE.IcosahedronGeometry(0.25,2),0x3d6b8a,gx,y0+1.0,gz);
    for(const [a,b,r] of [[0.3,0.5,0.1],[2.0,0.2,0.12],[3.6,-0.4,0.09],[4.8,0.7,0.07],[1.2,-0.8,0.06]])I.geo(new THREE.IcosahedronGeometry(r,1),0xc8b27a,gx+Math.cos(a)*Math.cos(b)*0.2,y0+1.0+Math.sin(b)*0.2,gz+Math.sin(a)*Math.cos(b)*0.2);
    SOLIDS.push({x:gx,z:gz,hx:0.2,hz:0.2})}
  // stacks of books on the floor and the window seat
  for(const [x,z,n,r] of [[CX-3.2,CZ+1.25,6,0.2],[CX+1.95,CZ-1.95,4,-0.3],[CX+1.05,CZ+D/2-0.33,3,0.1],[CX-3.3,CZ-1.15,5,0.5]])
    for(let i=0;i<n;i++){const yy=(x===CX+1.05?y0+0.62:y0+0.05)+0.03+i*0.06;I.box(0.3-(i%3)*0.03,0.055,0.22+(i%2)*0.03,BOOKS[(i*3+n)%BOOKS.length],x,yy,z,r+((i*7)%5-2)*0.12)}
  // the armchairs made up: a cable-knit throw over the green one, a cushion in each, and a pouf with a book on it
  I.box(0.62,0.6,0.04,0xefe4cc,CX+0.87,y0+0.85,CZ-1.15,0,0,-0.12);I.box(0.5,0.035,0.62,0xefe4cc,CX+1.25,y0+0.57,CZ-1.15);
  for(let i=0;i<5;i++)I.box(0.012,0.6,0.045,0xd8ccb0,CX+0.87,y0+0.85,CZ-1.39+i*0.12,0,0,-0.12);
  for(const [dz,col] of [[-1.15,0xd9a93c],[1.15,0x3f6b4a]])I.box(0.14,0.36,0.42,col,CX+1.0,y0+0.75,CZ+dz,0,0,-0.2);
  I.cyl(0.28,0.3,0.36,12,0x7a5a3a,CX+2.1,y0+0.2,CZ-1.15);I.cyl(0.29,0.29,0.03,12,0x8a6a4a,CX+2.1,y0+0.39,CZ-1.15);I.box(0.22,0.04,0.16,0x2a3a5a,CX+2.1,y0+0.42,CZ-1.12,0.4);
  SOLIDS.push({x:CX+2.1,z:CZ-1.15,hx:0.3,hz:0.3});
  // a teapot and a plate of shortbread on the side table
  {const tx=CX+1.15,tz=CZ;const pot=new THREE.IcosahedronGeometry(0.07,2);pot.scale(1,0.8,1);I.geo(pot,0x3f6b8a,tx+0.04,y0+0.675,tz-0.15);
    I.cyl(0.03,0.035,0.025,8,0x3f6b8a,tx+0.04,y0+0.73,tz-0.15);I.geo(new THREE.ConeGeometry(0.014,0.09,6),0x3f6b8a,tx+0.12,y0+0.69,tz-0.15,0,0,-1.0);
    I.geo(new THREE.TorusGeometry(0.035,0.009,4,10),0x3f6b8a,tx-0.04,y0+0.68,tz-0.15);
    I.cyl(0.08,0.07,0.01,10,CREAM,tx-0.12,y0+0.625,tz+0.12);for(let i=0;i<4;i++)I.box(0.04,0.012,0.04,0xe0b870,tx-0.12+((i%2)-0.5)*0.05,y0+0.637+(i>1?0.012:0),tz+0.12+(i<2?-0.02:0.02),i)}
  // the main rug's medallion and border, and a round sage rug under the desk
  I.box(0.9,0.004,0.9,0xd9b56a,CX+1.5,y0+0.07,CZ,Math.PI/4);I.box(0.62,0.004,0.62,0x2f4f6a,CX+1.5,y0+0.073,CZ,Math.PI/4);I.box(0.3,0.004,0.3,0xd9b56a,CX+1.5,y0+0.076,CZ,Math.PI/4);
  for(let i=0;i<14;i++){const f=(i+0.5)/14-0.5;for(const s of [-1,1]){I.box(0.07,0.004,0.07,0xe8dcc0,CX+1.5+s*1.18,y0+0.068,CZ+f*2.9,Math.PI/4);if(i<11)I.box(0.07,0.004,0.07,0xe8dcc0,CX+1.5+f*2.9*11/14,y0+0.068,CZ+s*1.48,Math.PI/4)}}
  I.cyl(1.05,1.05,0.012,24,0xc9b98f,CX-2.3,y0+0.05,CZ-1.3);I.cyl(0.95,0.95,0.014,24,0x7d8f6a,CX-2.3,y0+0.052,CZ-1.3);I.cyl(0.55,0.55,0.016,20,0xa8b48a,CX-2.3,y0+0.054,CZ-1.3);
  // velvet curtains tied back at the windows, on brass rods
  function curtain(alongX,c,a,s){const fold=k=>[0x6e2430,0x7d2d38][k%2];
    for(let k=0;k<5;k++){const o=a+s*k*0.05,pinch=k*0.012;
      if(alongX)I.box(0.05,1.75,0.06,fold(k),o,y0+1.62,c-0.05,0,0,s*pinch);else I.box(0.06,1.4,0.05,fold(k),c-0.05,y0+1.75,o,0,-s*pinch)}
    if(alongX)I.box(0.3,0.05,0.08,BRASS,a+s*0.1,y0+1.25,c-0.08);else I.box(0.08,0.05,0.3,BRASS,c-0.08,y0+1.4,a+s*0.1)}
  I.cyl(0.015,0.015,3.0,6,BRASS,CX,y0+2.5,CZ+D/2-0.1,0,0,Math.PI/2);curtain(true,CZ+D/2,CX-1.4,1);curtain(true,CZ+D/2,CX+1.4,-1);
  for(const m of [-2.2,2.2]){I.cyl(0.013,0.013,1.3,6,BRASS,CX+W/2-0.1,y0+2.45,CZ+m,0,Math.PI/2);curtain(false,CX+W/2,CZ+m-0.6,1);curtain(false,CX+W/2,CZ+m+0.6,-1)}
  // candles in jars on the south window sill, and a sprig of ivy trailing off each end of the mantel
  I.box(2.7,0.04,0.16,TRIM,CX,y0+0.95,CZ+D/2-0.08);
  for(const dx of [-0.95,-0.75,0.85]){I.cyl(0.04,0.04,0.08,8,0xd8d0b8,CX+dx,y0+1.01,CZ+D/2-0.08);I.lit(new THREE.ConeGeometry(0.013,0.035,5),0xffc866,CX+dx,y0+1.07,CZ+D/2-0.08)}
  for(const s of [-1,1])for(let i=0;i<7;i++)I.geo(new THREE.IcosahedronGeometry(0.035,0),i%2?0x4f7a3e:0x3f6a34,CX+W/2-0.75+(i%2)*0.03,y0+1.6-i*0.07,CZ+s*(1.32+i*0.015),i);
  // a little framed photo on the mantel
  I.box(0.03,0.16,0.13,BRASS,CX+W/2-0.5,y0+1.69,CZ-0.45,0,0,-0.12);I.box(0.032,0.12,0.09,0x8aa0b0,CX+W/2-0.505,y0+1.69,CZ-0.45,0,0,-0.12);
  // at the hearth: fire irons on a stand, a basket of split logs, embers glowing under the grate
  {const fx=CX+W/2;I.cyl(0.08,0.1,0.03,8,IRON,fx-0.75,y0+0.1,CZ+1.2);I.cyl(0.012,0.012,0.75,5,IRON,fx-0.75,y0+0.47,CZ+1.2);
    for(let i=0;i<3;i++){const a=i*2.09;I.box(0.012,0.6,0.012,IRON,fx-0.75+Math.cos(a)*0.05,y0+0.45,CZ+1.2+Math.sin(a)*0.05)}I.geo(new THREE.TorusGeometry(0.05,0.008,4,10),BRASS,fx-0.75,y0+0.86,CZ+1.2,0,Math.PI/2);
    I.cyl(0.24,0.2,0.3,10,0x8a6a3a,fx-0.8,y0+0.15,CZ-1.65);for(let i=0;i<5;i++)I.cyl(0.05,0.05,0.5,6,i%2?0x6b4a30:0x8a6040,fx-0.8+((i%3)-1)*0.08,y0+0.33+(i>2?0.06:0),CZ-1.65+((i%2)-0.5)*0.1,0.3*i,Math.PI/2,0);
    I.lit(new THREE.BoxGeometry(0.3,0.03,0.55),0xff6a1e,fx-0.3,y0+0.12,CZ);
    SOLIDS.push({x:fx-0.8,z:CZ-1.65,hx:0.24,hz:0.24})}
  // trailing pothos in pots on top of the shelves, their vines hanging down the shelf fronts
  for(const [px,pz,dz] of [[CX-3.2,CZ+D/2-0.2,-1],[CX+2.4,CZ+D/2-0.2,-1],[CX-0.6,CZ-D/2+0.2,1],[CX+3.4,CZ-D/2+0.2,1]]){const py=y0+3.22;
    I.cyl(0.1,0.08,0.13,10,0xe8e0d0,px,py,pz);for(let i=0;i<5;i++)I.geo(new THREE.IcosahedronGeometry(0.05,0),i%2?0x4f8a3e:0x6a9a4a,px+(i-2)*0.04,py+0.09,pz,i);
    for(let k=0;k<4;k++){const vx=px+(k-1.5)*0.09;for(let i=0;i<7+(k%3)*3;i++)I.geo(new THREE.IcosahedronGeometry(0.03,0),i%2?0x4f8a3e:0x6a9a4a,vx+Math.sin(i*1.7+k)*0.025,py-0.05-i*0.1,pz+dz*0.24,i+k)}}
  // the cat's corner by the fire: a round bed with a plaid cushion, food and water bowls
  I.cyl(0.36,0.33,0.1,16,0x5a3b26,CX+2.62,y0+0.1,CZ+0.15);I.geo(new THREE.TorusGeometry(0.31,0.07,6,18),0x8a5a3a,CX+2.62,y0+0.16,CZ+0.15,0,Math.PI/2);
  I.cyl(0.29,0.29,0.04,16,0xa33b2f,CX+2.62,y0+0.15,CZ+0.15);for(const d of [-0.12,0,0.12])I.box(0.58,0.004,0.035,0x2f4f3a,CX+2.62,y0+0.172,CZ+0.15+d);
  for(const [dz,col] of [[2.2,0xd9cfb4],[2.48,0x6f86a8]]){I.cyl(0.08,0.065,0.05,12,col,CX+3.55,y0+0.075,CZ+dz);I.cyl(0.065,0.065,0.005,12,dz>2.3?0x9ec4d8:0x8a5a3a,CX+3.55,y0+0.1,CZ+dz)}
  famAdd(K);jesRoof=jesMesh(R.solid,jesRoofMat,true);jesInside=jesMesh(I.solid,famMat,false);
  if(I.glow.length){const g=new THREE.Mesh(famMerge(I.glow),famGlowMat);jesInside.add(g);g.position.set(0,0,0)}
  jesMesh(GL.solid,jesGlass,false);
  jesCeil=jesMesh(CE.solid,famMat,false);if(CE.glow.length)jesCeil.add(new THREE.Mesh(famMerge(CE.glow),famGlowMat));
  // an oil painting over the mantel: the lake at dusk, mountains, pines and a lit cottage window, in a gilt frame
  {const cv=document.createElement('canvas');cv.width=384;cv.height=272;const g=cv.getContext('2d');
    let gr=g.createLinearGradient(0,0,0,170);gr.addColorStop(0,'#2f3f6a');gr.addColorStop(0.55,'#c9757a');gr.addColorStop(1,'#f2b866');g.fillStyle=gr;g.fillRect(0,0,384,272);
    g.fillStyle='#fff2c8';g.beginPath();g.arc(270,120,16,0,7);g.fill();
    const ridge=(y,a,col,seed)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,272);for(let x=0;x<=384;x+=8)g.lineTo(x,y-a*Math.abs(Math.sin(x*0.013*seed+seed))-a*0.4*Math.sin(x*0.05+seed));g.lineTo(384,272);g.fill()};
    ridge(150,60,'#4a4a6a',1.3);ridge(165,35,'#3a4a5a',2.1);
    gr=g.createLinearGradient(0,170,0,272);gr.addColorStop(0,'#e0a070');gr.addColorStop(1,'#3a4a6a');g.fillStyle=gr;g.fillRect(0,172,384,100);
    g.fillStyle='rgba(255,240,200,0.5)';for(let i=0;i<9;i++)g.fillRect(250+Math.sin(i)*10,180+i*7,40-i*3,2);
    g.fillStyle='#1f2a24';for(let i=0;i<14;i++){const x=i<7?i*18:250+i*10,h=40+((i*37)%30);g.beginPath();g.moveTo(x,190);g.lineTo(x+9,190-h);g.lineTo(x+18,190);g.fill()}
    g.fillStyle='#2a201a';g.fillRect(140,168,34,22);g.beginPath();g.moveTo(136,170);g.lineTo(157,154);g.lineTo(178,170);g.fill();g.fillStyle='#ffd27a';g.fillRect(150,175,7,6);
    for(let i=0;i<2200;i++){g.fillStyle=`rgba(${i%2?255:0},${i%2?240:0},${i%2?210:0},0.05)`;g.fillRect(Math.random()*384,Math.random()*272,3,1)}
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.NoColorSpace;
    const fx=CX+W/2-0.5,py=y0+2.38;const pm=new THREE.Mesh(new THREE.PlaneGeometry(1.0,0.7),new THREE.MeshLambertMaterial({map:t}));pm.position.set(fx-0.035,py,CZ);pm.rotation.y=-Math.PI/2;jesInside.add(pm);
    const Fr=famKit();for(const [w,h,y,z] of [[1.16,0.08,py+0.39,CZ],[1.16,0.08,py-0.39,CZ],[0.08,0.86,py,CZ-0.54],[0.08,0.86,py,CZ+0.54]])Fr.box(0.06,h,w===0.08?0.08:w,0xb08a3a,fx-0.03,y,z);
    jesInside.add(new THREE.Mesh(famMerge(Fr.solid),famMat))}
  // steam curling off the teacup
  {const sm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.16,depthWrite:false}),sg=new THREE.IcosahedronGeometry(0.02,1);
    for(let i=0;i<4;i++){const m=new THREE.Mesh(sg,sm);m.userData={t:i*0.6,x:CX+1.27,y:y0+0.7,z:CZ+0.1};jesInside.add(m);jesSteam.push(m)}}
  // the warm light of the fire and lamps over the room (Medium graphics and up): flickers with the fire, stronger at night
  jesLight.position.set(CX+W/2-1.0,y0+1.0,CZ);scene.add(jesLight);
  // chimney smoke: a few soft puffs rising and drifting off
  const pg=new THREE.IcosahedronGeometry(0.45,0);
  for(let i=0;i<7;i++){const m=new THREE.Mesh(pg,new THREE.MeshLambertMaterial({color:0xe2e2e0,transparent:true,opacity:0,depthWrite:false,flatShading:true}));
    m.userData={t:i*0.9,x:chx,y:chTop+0.3,z:CZ};scene.add(m);jesSmoke.push(m)}
})();

// ---------- the tuxedo cat ----------
// Sits up in her bed by the fire: black coat with a white bib, muzzle, blaze and socks, green eyes. She breathes, swishes
// her tail, flicks an ear, blinks slowly and turns her head to watch you; walk up to her and Get in becomes Pet the cat
// (she shuts her eyes, leans into your hand and purrs). Smooth shaded, apart from the merged room, so she can move
const jesCat=(function(){
  const fur=M(0x151517,{flatShading:false,shininess:18,specular:0x2a2a30}),wht=M(0xf1eee6,{flatShading:false,shininess:10,specular:0x222222}),
    pink=M(0xd98f95,{flatShading:false,shininess:20}),eyeM=M(0x9cc43a,{flatShading:false,shininess:120,specular:0xffffff,emissive:0x1a2408}),
    blk=new THREE.MeshBasicMaterial({color:0x050505});
  const C=new THREE.Group(),sph=(r,m,x,y,z,sx,sy,sz,par)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);o.castShadow=true;(par||C).add(o);return o};
  const body=new THREE.Group();C.add(body);
  // haunches and back, the chest rising out of them, the white bib down the front
  sph(0.13,fur,0,0.12,-0.06,1.0,0.95,1.25,body);const chest=sph(0.1,fur,0,0.215,0.045,0.92,1.35,0.95,body);chest.rotation.x=-0.25;
  sph(0.075,wht,0,0.2,0.118,0.86,1.5,0.62,body);sph(0.05,wht,0,0.11,0.13,0.9,1.1,0.6,body);
  // front legs with white socks, and the hind feet tucked beside the haunches
  for(const s of [-1,1]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.028,0.16,10),fur);l.position.set(s*0.045,0.085,0.105);l.castShadow=true;body.add(l);
    sph(0.026,wht,s*0.045,0.035,0.11,1,1.2,1,body);sph(0.03,wht,s*0.045,0.015,0.125,1,0.65,1.4,body);sph(0.034,wht,s*0.105,0.016,0.02,0.95,0.6,1.8,body)}
  // the head: skull, white muzzle and chin, a white blaze between the eyes, pink nose, green eyes with slit pupils
  const head=new THREE.Group();head.position.set(0,0.335,0.075);C.add(head);
  sph(0.075,fur,0,0,0,1.06,0.92,0.95,head);sph(0.04,wht,0,-0.027,0.058,1.25,0.8,0.85,head);sph(0.03,wht,0,-0.05,0.045,1,0.7,1,head);
  sph(0.022,wht,0,0.008,0.066,0.55,1.7,0.45,head);sph(0.01,pink,0,-0.012,0.094,1.3,0.75,0.8,head);
  const eyes=[];for(const s of [-1,1]){const e=new THREE.Group();e.position.set(s*0.031,0.012,0.06);head.add(e);
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.016,14,10),eyeM);e.add(b);const pu=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.019,0.002),blk);pu.position.z=0.0155;e.add(pu);eyes.push(e)}
  const ears=[];for(const s of [-1,1]){const e=new THREE.Group();e.position.set(s*0.045,0.058,-0.005);e.rotation.z=-s*0.32;head.add(e);
    const o=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.058,10),fur);o.position.y=0.026;o.castShadow=true;e.add(o);
    const i=new THREE.Mesh(new THREE.ConeGeometry(0.019,0.04,8),pink);i.position.set(0,0.022,0.009);e.add(i);ears.push(e)}
  // whiskers fanning out from the muzzle
  {const v=[];for(const s of [-1,1])for(let k=0;k<3;k++){const y=-0.025-k*0.006;v.push(s*0.03,y,0.085,s*0.12,y+0.012-k*0.014,0.1-k*0.01)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));head.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xf4f2ea,transparent:true,opacity:0.8})))}
  // the tail: a chain of tapering segments curled round her feet, each joint swishing a beat behind the last
  const tail=[];{let par=C;const N=9;for(let i=0;i<N;i++){const j=new THREE.Group(),r=0.024-i*0.0012,L=0.048;
      if(i===0)j.position.set(0,0.035,-0.18);else j.position.set(0,0,L);par.add(j);
      const sg=new THREE.Mesh(new THREE.CylinderGeometry(r*0.92,r,L+0.006,10),fur);sg.rotation.x=Math.PI/2;sg.position.z=L/2;sg.castShadow=true;j.add(sg);
      if(i===N-1)sph(r*0.95,fur,0,0,L,1,1,1,j);tail.push(j);par=j}}
  C.position.set(JES_CX+2.62,JES_Y+0.17,JES_CZ+0.15);C.rotation.y=-Math.PI/2;scene.add(C);
  SOLIDS.push({x:JES_CX+2.62,z:JES_CZ+0.15,hx:0.34,hz:0.34});
  return {g:C,body,chest,head,eyes,ears,tail,yaw:0,pet:0,blink:3,ear:2,earI:0,earT:0,purr:null}})();
// and the ginger tabby, curled up asleep on the window seat with her nose under her tail; her side rises and falls
const jesGinger=(function(){const o=M(0xd9873a,{flatShading:false,shininess:12,specular:0x221a10}),od=M(0xa85a24,{flatShading:false,shininess:12}),cr=M(0xf2dcc0,{flatShading:false,shininess:8});
  const G=new THREE.Group(),sph=(r,m,x,y,z,sx,sy,sz,par)=>{const q=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),m);q.position.set(x,y,z);q.scale.set(sx,sy,sz);q.castShadow=true;(par||G).add(q);return q};
  const body=new THREE.Group();G.add(body);sph(0.16,o,0,0.09,0,1.25,0.62,1.0,body);sph(0.1,cr,0.02,0.05,0.09,1.1,0.45,0.6,body);
  // tabby stripes over her back
  for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(0.135,0.012,6,16,Math.PI*0.9),od);t.position.set(-0.13+i*0.06,0.08,0);t.rotation.set(0,Math.PI/2,0);t.scale.set(1,0.72,1);body.add(t)}
  const head=new THREE.Group();head.position.set(0.17,0.07,0.07);G.add(head);sph(0.07,o,0,0,0,1.05,0.85,1,head);sph(0.032,cr,0.05,-0.02,0.02,1,0.75,1,head);
  for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.ConeGeometry(0.027,0.05,8),o);e.position.set(-0.005,0.06,s*0.04);e.rotation.set(s*0.5,0,-0.5);head.add(e)}
  for(const s of [-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.024,0.003,0.004),new THREE.MeshBasicMaterial({color:0x3a2010}));l.position.set(0.055,0.012,0.02+s*0.026);l.rotation.y=-0.5;head.add(l)}
  const tail=new THREE.Mesh(new THREE.TorusGeometry(0.15,0.025,8,20,Math.PI*1.1),o);tail.rotation.set(Math.PI/2,0,0.6);tail.position.set(0.02,0.03,0.02);G.add(tail);
  for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(0.026,0.008,5,10),od);const a=0.6+i*0.8;r.position.set(0.02+Math.cos(a)*0.15,0.03,0.02+Math.sin(a)*0.15);r.rotation.set(0,-a,0);G.add(r)}
  G.position.set(JES_CX-0.2,JES_Y+0.62,JES_CZ+6.5/2-0.33);G.rotation.y=0.2;scene.add(G);return {g:G,body}})();
// within reach of the cat on foot: Get in becomes Pet the cat (walker.js)
function jesCatNear(){if(mode!=='walk'||wk.inside)return null;const c=jesCat.g.position;
  return Math.hypot(wk.x-c.x,wk.z-c.z)<1.25&&Math.abs(wk.y-JES_Y)<1?{b:say('petCatBtn'),pet:true}:null}
function jesPet(){const first=jesCat.pet<=0;jesCat.pet=6;if(first)toast(say('petCat'),'good',2600)}
// the purr: soft low noise pulsed about 25 times a second, louder while petted, on the ambience slider (sound.js)
function jesPurrMake(){const c=actx,sr=c.sampleRate,src=c.createBufferSource();src.buffer=toBuf(c,noiseBuf(sr,2,77));src.loop=true;
  const lp=sndFilter('lowpass',340,0.7),am=sndGain(0.5),out=sndGain(0,snd.amb),lfo=c.createOscillator(),lg=sndGain(0.5);
  lfo.frequency.value=25;lfo.connect(lg);lg.connect(am.gain);src.connect(lp);lp.connect(am);am.connect(out);src.start();lfo.start();return out}
function jesCatTick(dt,t){const k=jesCat,c=k.g.position;
  // breathing, a slow tail swish (lazier while petted)
  const br=Math.sin(t*1.7);k.body.scale.set(1+0.012*br,1+0.018*br,1+0.012*br);
  const sw=k.pet>0?0.35:1;for(let i=0;i<k.tail.length;i++){const j=k.tail[i];j.rotation.y=(i===0?-1.7:0.38)+sw*0.16*Math.sin(t*1.4-i*0.55);j.rotation.x=i===0?0.05:-0.015*i}
  // watch the worker when they are in the room, otherwise gaze at the room; petted, she lifts her chin into your hand
  let want=0,tilt=0;const dx=wk.x-c.x,dz=wk.z-c.z,d=Math.hypot(dx,dz);
  if(mode==='walk'&&d<7){const a=Math.atan2(dx,dz)-k.g.rotation.y;want=Math.max(-1.1,Math.min(1.1,Math.atan2(Math.sin(a),Math.cos(a))));tilt=-Math.min(0.35,0.5/Math.max(0.6,d))}
  if(k.pet>0){k.pet-=dt;want*=0.4;tilt=-0.45}
  k.yaw+=(want-k.yaw)*Math.min(1,dt*3);k.head.rotation.y=k.yaw;k.head.rotation.x+=(tilt-k.head.rotation.x)*Math.min(1,dt*3);k.head.rotation.z=k.pet>0?0.18*Math.sin(t*1.3):0;
  // slow blinks; eyes shut while petted
  k.blink-=dt;let lid=1;if(k.blink<0){lid=Math.abs(k.blink+0.12)/0.12;if(k.blink<-0.24)k.blink=2.5+Math.random()*4}
  if(k.pet>0)lid=0.08;for(const e of k.eyes)e.scale.y=Math.max(0.08,Math.min(1,lid));
  // now and then one ear flicks
  k.ear-=dt;if(k.ear<0){k.ear=3+Math.random()*6;k.earI=Math.random()<0.5?0:1;k.earT=0.25}
  for(let i=0;i<2;i++){const e=k.ears[i];e.rotation.x=i===k.earI&&k.earT>0?-0.6*Math.sin(k.earT/0.25*Math.PI):0}if(k.earT>0)k.earT-=dt;
  // the purr
  if(snd&&snd.ready){if(!k.purr)k.purr=jesPurrMake();const v=(k.pet>0?Math.min(1,k.pet):0)*Math.max(0,1-d/5)*0.5*(0.75+0.25*br);k.purr.gain.setTargetAtTime(v,actx.currentTime,0.15)}}

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
  {const X=236.5,Z=245,y=G(X,Z),BK=famKit();BK.box(0.5,0.08,2.2,0x8a5c38,X,y+0.48,Z);BK.box(0.08,0.5,2.2,0x8a5c38,X-0.25,y+0.85,Z);
    for(const s of [-1,1])BK.box(0.5,0.48,0.1,0x55595c,X,y+0.24,Z+s*0.95);SOLIDS.push({x:X,z:Z,hx:0.3,hz:1.1});
    famSpot('bench',X,y,Z,Math.PI/2,1.1);famAddSpot('bench',BK)}
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
  let sd=29;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const out=[],ok=(x,z)=>{if(jesR(x,z)>JES_R-2.5)return false;if(roadOff(x,z)<ROAD_W/2+0.9)return false;
    if(Math.hypot(x-JES_CX,z-JES_CZ)<9.5||(Math.abs(x-209)<5.5&&Math.abs(z-257)<4.5)||Math.hypot(x-236.5,z-245)<4.5||(x<172&&Math.abs(z-245)<6))return false;
    if(SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+1.2&&Math.abs(z-s.z)<s.hz+1.2))return false;return !out.some(o=>Math.hypot(o.x-x,o.z-z)<2.4)};
  for(let g=0;g<9000&&out.length<200;g++){const x=JES_X-50+rnd()*100,z=JES_Z-50+rnd()*100;if(!ok(x,z))continue;
    out.push({t:rnd()<0.78?'pine':'leafy',x,z,yaw:rnd()*6.3,s:0.8+rnd()*0.65,c:(rnd()*6)|0})}
  treeGroup('jes',out.map(a=>treeEntry(a.t,a.x,a.z,a.yaw,a.s,a.c,a.t==='pine'?0.95+0.4*hash(a.x*1.3+0.7,a.z*2.1+0.3):0)));
  return out})();

// every frame: the fire flickers, smoke rises, the library inside is drawn only when you are near, and the roof over
// the worker (the cottage's or the covered bridge's) lifts off in the chase view so you can see in
function jesTick(dt){
  const t=timeU.value,cx=camera.position.x-JES_CX,cz=camera.position.z-JES_CZ,near=cx*cx+cz*cz<90*90;
  jesInside.visible=near;jesFire.visible=near;jesCat.g.visible=jesGinger.g.visible=near;
  if(near){const fl=0.8+0.18*Math.sin(t*11)+0.1*Math.sin(t*23.7);jesFire.scale.set(1,fl,1+0.06*Math.sin(t*7.3));jesCatTick(dt,t);{const b=Math.sin(t*1.25);jesGinger.body.scale.set(1,1+0.03*b,1+0.015*b)}
    for(const m of jesSteam){const u=m.userData;u.t+=dt;if(u.t>2.4)u.t-=2.4;const a=u.t/2.4;m.position.set(u.x+Math.sin(u.t*2.1)*0.02,u.y+a*0.28,u.z+a*0.03);m.scale.setScalar(0.6+a*2.2)}}
  // the room's warm light: firelight flicker, brighter after dark, out when you are away
  if(jesLight.visible){const night=1-ss(-6,8,dn.el);jesLight.intensity=near?(0.9+1.6*night)*(0.9+0.12*Math.sin(t*9.3)+0.06*Math.sin(t*21.1))*LI:0}
  for(const m of jesSmoke){const u=m.userData;u.t+=dt;if(u.t>6.3)u.t-=6.3;const a=u.t/6.3;
    m.position.set(u.x+a*2.6+Math.sin(u.t*1.3)*0.2,u.y+a*5.5,u.z+a*1.2);m.scale.setScalar(0.45+a*1.6);m.material.opacity=0.42*Math.min(1,a*6)*(1-a)}
  const foot=mode==='walk'&&!wk.inside&&camMode!=='cab';
  jesIn=foot&&Math.abs(wk.x-JES_CX)<4.3&&Math.abs(wk.z-JES_CZ)<3.5;jesRoof.visible=!jesIn;jesCeil.visible=near&&!jesIn;
  const [bt,bu]=deckLocal(JB,wk.x,wk.z);jesBridgeRoof.visible=!(foot&&bt>-1&&bt<JB.len+1&&Math.abs(bu)<JB.hw+0.6)}
