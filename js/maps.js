// Corley's Island: minimap and big site map.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- maps ----------
// the background covers the mesa and the islands round the Family Island: a square from MAP_X0, MAP_Z0, MAP_SZ metres across
const MAP_X0=-260,MAP_Z0=-62,MAP_SZ=540,MAP_HALF=MAP_SZ/2,MAP_CX=MAP_X0+MAP_HALF,MAP_CZ=MAP_Z0+MAP_HALF,BG_PX=800;let mapBg=null,digLayer=null,mapDirty=true,mapT=0;
function buildMapBg(){
  const c=document.createElement('canvas');c.width=c.height=BG_PX;const x2=c.getContext('2d'),img=x2.createImageData(BG_PX,BG_PX),d=img.data,mpp=MAP_SZ/BG_PX;
  const hs=new Float32Array(BG_PX*BG_PX);
  for(let py=0;py<BG_PX;py++)for(let px=0;px<BG_PX;px++)hs[py*BG_PX+px]=baseHeight(MAP_X0+px*mpp,MAP_Z0+py*mpp);
  for(let py=0;py<BG_PX;py++)for(let px=0;px<BG_PX;px++){
    const k=py*BG_PX+px,h=hs[k],hx=hs[py*BG_PX+Math.min(BG_PX-1,px+1)]-hs[py*BG_PX+Math.max(0,px-1)],hz=hs[Math.min(BG_PX-1,py+1)*BG_PX+px]-hs[Math.max(0,py-1)*BG_PX+px];
    const sl=Math.hypot(hx,hz)/(2*mpp);let r,g,b;
    if(h<WATER){const dp=Math.min(1,(WATER-h)/12);r=0.2-0.08*dp;g=0.5-0.15*dp;b=0.62-0.12*dp}
    else if(h<WATER+2.5){r=0.82;g=0.75;b=0.55}
    else if(sl>0.9){r=0.52;g=0.47;b=0.42}
    else if(mesaR(MAP_X0+px*mpp,MAP_Z0+py*mpp)<EDGE||famR(MAP_X0+px*mpp,MAP_Z0+py*mpp)<FAM_R||jesR(MAP_X0+px*mpp,MAP_Z0+py*mpp)<JES_R||dexR(MAP_X0+px*mpp,MAP_Z0+py*mpp)<DEX_R){const x=MAP_X0+px*mpp,z=MAP_Z0+py*mpp;r=0.38;g=0.6;b=0.3;
      if(yardAt(x,z)>0.4){r=0.6;g=0.47;b=0.33}if(roadAmt(x,z)>0.3){r=0.72;g=0.6;b=0.42}}else{r=0.42;g=0.58;b=0.32}
    const shade=h<WATER?1:Math.max(0.55,Math.min(1.25,1+(-hx-hz)*0.35/mpp*0.5));
    d[k*4]=Math.min(255,r*shade*255);d[k*4+1]=Math.min(255,g*shade*255);d[k*4+2]=Math.min(255,b*shade*255);d[k*4+3]=255;
  }
  x2.putImageData(img,0,0);mapBg=c;
  digLayer=document.createElement('canvas');digLayer.width=digLayer.height=256;
}
function updateDigLayer(){
  const x2=digLayer.getContext('2d'),img=x2.createImageData(256,256),d=img.data;
  for(let py=0;py<256;py++)for(let px=0;px<256;px++){
    const i=Math.round((px+0.5)/256*N),j=Math.round((py+0.5)/256*N),k=j*V+i,df=H[k]-H0[k],o=(py*256+px)*4;
    if(df<-0.04){const t=Math.min(1,-df/1.2);d[o]=120-50*t;d[o+1]=80-35*t;d[o+2]=48-22*t;d[o+3]=230}
    else if(df>0.04){d[o]=150;d[o+1]=108;d[o+2]=70;d[o+3]=Math.min(230,80+df*300)}
  }
  x2.putImageData(img,0,0);
}
// tall grass, cut stripes and dug cells, one pixel per clump
let lawnMap=null;
function updateLawnMap(){
  if(!lawnMap){lawnMap=document.createElement('canvas');lawnMap.width=LAWN_NX;lawnMap.height=LAWN_NZ}
  const x2=lawnMap.getContext('2d'),img=x2.createImageData(LAWN_NX,LAWN_NZ),d=img.data;
  for(let n=0;n<LAWN_N;n++){const o=n*4;if(lawn.dug[n])continue;
    const t=0.5+0.5*lawn.str[n],f=ss(0,0.6,lawn.gd[n]);d[o]=70+50*t+(163-70-50*t)*f;d[o+1]=120+70*t+(166-120-70*t)*f;d[o+2]=45+30*t+(76-45-30*t)*f;d[o+3]=235}
  x2.putImageData(img,0,0)}
function drawMap(cv,cx,cz,half,big){
  if(!mapBg)buildMapBg();
  const dpr=Math.min(2,devicePixelRatio||1),W=Math.round(cv.clientWidth*dpr);if(!W)return;
  if(cv.width!==W){cv.width=cv.height=W}
  const g=cv.getContext('2d'),sc=W/(2*half),X=x=>(x-cx)*sc+W/2,Y=z=>(z-cz)*sc+W/2;
  g.fillStyle='#1d4f63';g.fillRect(0,0,W,W);
  const spp=BG_PX/MAP_SZ;
  g.imageSmoothingEnabled=true;
  g.drawImage(mapBg,(cx-half-MAP_X0)*spp,(cz-half-MAP_Z0)*spp,2*half*spp,2*half*spp,0,0,W,W);
  // bridge decks, the Family Island's buildings
  for(const b of BRIDGES){g.save();g.translate(X(b.x0),Y(b.z0));g.rotate(Math.atan2(b.uz,b.ux));g.fillStyle='#55595c';g.fillRect(0,-(b.hw+0.4)*sc,b.len*sc,(2*b.hw+0.8)*sc);
    g.fillStyle='#9a9c9e';g.fillRect(0,-b.hw*sc,b.len*sc,2*b.hw*sc);g.restore()}
  g.fillStyle='#8a5a3a';for(const s of SOLIDS)if(s.hx>2||s.hz>2)g.fillRect(X(s.x-s.hx),Y(s.z-s.hz),2*s.hx*sc,2*s.hz*sc);
  g.drawImage(digLayer,X(-S/2),Y(-S/2),S*sc,S*sc);
  g.lineWidth=Math.max(1.5,0.18*sc);g.strokeStyle='#f2f2ee';g.strokeRect(X(-0.5),Y(TRENCH_Z0),1*sc,(TRENCH_Z1-TRENCH_Z0)*sc);
  g.setLineDash([6*dpr,5*dpr]);g.strokeStyle='#f5c518';g.lineWidth=Math.max(2,0.2*sc);g.beginPath();g.moveTo(X(-12),Y(PIPE_Z));g.lineTo(X(12),Y(PIPE_Z));g.stroke();g.setLineDash([]);
  g.save();g.translate(X(TB.x),Y(TB.z));g.rotate(-TB.yaw);g.fillStyle='#d8a514';g.fillRect(-BX_W/2*sc-1,-BX_L/2*sc,BX_W*sc+2,BX_L*sc);g.restore();
  if(lawn.mapDirty||!lawnMap){updateLawnMap();lawn.mapDirty=false}
  g.drawImage(lawnMap,X(LAWN_X0),Y(LAWN_Z0),LAWN_NX*LAWN_GS*sc,LAWN_NZ*LAWN_GS*sc);
  g.fillStyle='#b9b6ae';for(const b of blocks)g.fillRect(X(b.x-b.s/2),Y(b.z-b.s/2),Math.max(2,b.s*sc),Math.max(2,b.s*sc));
  if(big){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1.5*dpr;g.setLineDash([4*dpr,4*dpr]);g.strokeRect(X(-S/2),Y(-S/2),S*sc,S*sc);g.setLineDash([]);}
  const icon=(x,z,ang,fill,len,wid,active)=>{g.save();g.translate(X(x),Y(z));g.rotate(ang);
    const L=Math.max(len*sc,big?14*dpr:10*dpr),Wd=Math.max(wid*sc,big?9*dpr:7*dpr);
    if(active){g.beginPath();g.arc(0,0,L*0.9,0,Math.PI*2);g.fillStyle='rgba(255,255,255,.22)';g.fill()}
    g.fillStyle=fill;g.strokeStyle='#14161a';g.lineWidth=1.5*dpr;g.beginPath();g.moveTo(L/2,0);g.lineTo(-L/2,-Wd/2);g.lineTo(-L/2,Wd/2);g.closePath();g.fill();g.stroke();g.restore()};
  const hy=st.yaw+st.swing;
  g.strokeStyle='#f07a22';g.lineWidth=Math.max(2,0.3*sc);g.beginPath();g.moveTo(X(st.x),Y(st.z));g.lineTo(X(tip.x),Y(tip.z));g.stroke();
  if(!wk.inside){g.beginPath();g.arc(X(wk.x),Y(wk.z),Math.max((big?5:4)*dpr,0.4*sc)*(mode==='walk'?1.3:1),0,Math.PI*2);g.fillStyle='#2fb7e8';g.fill();g.strokeStyle='#14161a';g.lineWidth=1.5*dpr;g.stroke();}
  icon(sk.x,sk.z,Math.atan2(Math.cos(sk.yaw),Math.sin(sk.yaw)),'#f2b705',2.8,1.8,mode==='skid');
  icon(mw.x,mw.z,Math.atan2(Math.cos(mw.yaw),Math.sin(mw.yaw)),'#d8352a',2.2,1.4,mode==='mow');
  icon(tr.x,tr.z,Math.atan2(Math.cos(tr.yaw),Math.sin(tr.yaw)),'#e9ecea',9.1,2.6,mode==='truck');
  icon(st.x,st.z,Math.atan2(Math.cos(hy),Math.sin(hy)),'#f07a22',4.2,3,mode==='dig'||mode==='drive');
  g.fillStyle='rgba(20,23,19,.75)';g.fillRect(W-30*dpr,4*dpr,26*dpr,26*dpr);g.fillStyle='#f3f5ef';g.font=`800 ${16*dpr}px Saira Condensed, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('N',W-17*dpr,17*dpr);
  if(big){g.font=`700 ${15*dpr}px Saira Condensed, sans-serif`;g.fillStyle='rgba(255,255,255,.85)';g.fillText('DIG SITE',X(0),Y(-S/2)-10*dpr);g.fillText('LAKE',X(-110),Y(130));g.fillText('FAMILY ISLAND',X(FAM_X),Y(FAM_Z-FAM_R)-10*dpr);g.fillText("JESSICA'S ISLAND",X(JES_X),Y(JES_Z-JES_R)-10*dpr);g.fillText("DEXTER'S ISLAND",X(DEX_X),Y(DEX_Z-DEX_R)-10*dpr);}
}
function mapsTick(dt){
  mapT-=dt;if(mapDirty&&mapT<=0){if(!mapBg)buildMapBg();updateDigLayer();mapDirty=false;mapT=0.5}
  const fv=mode==='truck'?tr:mode==='mow'?mw:mode==='skid'?sk:mode==='walk'?wk:st;
  drawMap($('#mini'),fv.x,fv.z,42,false);
  if(!$('#bigmap').hidden)drawMap($('#big'),MAP_CX,MAP_CZ,MAP_HALF,true);
}
function sizeBig(){const c=$('#big'),sz=Math.max(200,Math.min(innerWidth-60,innerHeight-230,900));c.style.width=c.style.height=sz+'px'}
function toggleMap(show){const m=$('#bigmap');m.hidden=show===undefined?!m.hidden:!show;if(!m.hidden){sizeBig();drawMap($('#big'),MAP_CX,MAP_CZ,MAP_HALF,true)}}
$('#mini').addEventListener('click',()=>toggleMap(true));
$('#mapClose').onclick=()=>toggleMap(false);
$('#bigmap').addEventListener('click',e=>{if(e.target.id==='bigmap')toggleMap(false)});
addEventListener('keydown',e=>{if(e.code==='Escape')toggleMap(false)});
addEventListener('resize',()=>{if(!$('#bigmap').hidden)sizeBig()});
