// Corley's Island: minimap, big site map, and teleporting from it (on foot or in a machine).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- maps ----------
// The map's ground covers the whole world, the islands and both mainland shores, in square tiles of MPT_PX pixels at
// MPT_MPP metres a pixel, coloured as the ground itself is (groundColor, with hill shading, lake depth and every tree).
// Tiles are built a few rows a frame, nearest the player first, so nothing stalls; the map editor clears them (mapReset).
const MPT_PX=128,MPT_MPP=0.8,MPT_M=MPT_PX*MPT_MPP,MPT_NX=9,MPT_NZ=14,MAPW_X0=-MPT_NX*MPT_M/2,MAPW_Z0=-588,
  MAPW_X1=MAPW_X0+MPT_NX*MPT_M,MAPW_Z1=MAPW_Z0+MPT_NZ*MPT_M,MAP_FIT=[-452,452,-584,792],mapTiles=[];
let digLayer=null,mapDirty=true,mapT=0,mapBigT=0,mapJob=null,mapTreeList=null;
function mapReset(){mapTiles.length=0;mapJob=null;mapTreeList=null}
// every tree in the world as [x, z, crown radius, shade], read from the tree instance meshes (rocks are left out) and the
// planted ones
function mapTrees(){if(mapTreeList)return mapTreeList;const L=[],m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
  for(const im of treeIMs){const g=im.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox,hgt=b.max.y-b.min.y,rad=Math.max(b.max.x-b.min.x,b.max.z-b.min.z)/2;
    if(hgt<2.5||rad<0.6)continue;
    for(let i=0;i<im.count;i++){im.getMatrixAt(i,m);m.decompose(p,q,s);if(s.y<0.05)continue;L.push([p.x,p.z,rad*Math.max(s.x,s.z),hash(p.x*1.7,p.z*2.3)])}}
  // the trees you planted (plant.js), once they are taller than a person: their crown as it is on the game's date
  for(const a of plant.list){const G=plantGrowth(a,dn.t);if(G&&G.H>=1.8)L.push([a.x,a.z,Math.max(0.6,treeVitals(a.k,G.H).crown/2),hash(a.x*1.7,a.z*2.3)])}
  return mapTreeList=L}
function mapTile(i,j){const k=j*MPT_NX+i;return mapTiles[k]||(mapTiles[k]={i,j,cv:null,row:0,img:null,hs:null})}
// a few more rows of tile t; true once it is finished
function mapTileWork(t,until){const P=MPT_PX,E=P+2,x0=MAPW_X0+t.i*MPT_M,z0=MAPW_Z0+t.j*MPT_M,c=[0,0,0,0];
  if(!t.hs){t.hs=new Float32Array(E*E);for(let b=0;b<E;b++)for(let a=0;a<E;a++)t.hs[b*E+a]=baseHeight(x0+(a-0.5)*MPT_MPP,z0+(b-0.5)*MPT_MPP);
    t.cv=document.createElement('canvas');t.cv.width=t.cv.height=P;t.img=t.cv.getContext('2d').createImageData(P,P)}
  const hs=t.hs,d=t.img.data;
  for(;t.row<P;t.row++){if(performance.now()>until)return false;const py=t.row;
    for(let px=0;px<P;px++){const k=(py+1)*E+px+1,h=hs[k],hx=hs[k+1]-hs[k-1],hz=hs[k+E]-hs[k-E],o=(py*P+px)*4;let r,g,b;
      if(h<WATER){const dp=ss(0,3.5,WATER-h),sh=ss(WATER-0.9,WATER,h);
        r=0.27-0.17*dp+0.22*sh;g=0.52-0.24*dp+0.18*sh;b=0.58-0.17*dp+0.1*sh}
      else{groundColor(x0+(px+0.5)*MPT_MPP,z0+(py+0.5)*MPT_MPP,h,c);const sd=Math.max(0.6,Math.min(1.3,1+(-hx-hz)*0.22/MPT_MPP));r=c[0]*sd;g=c[1]*sd;b=c[2]*sd}
      d[o]=Math.min(255,r*255);d[o+1]=Math.min(255,g*255);d[o+2]=Math.min(255,b*255);d[o+3]=255}}
  const x2=t.cv.getContext('2d');x2.putImageData(t.img,0,0);t.img=t.hs=null;
  // tree crowns: a soft shadow to the south-east, then the crown, lit from the north-west
  const sc=1/MPT_MPP;
  for(const [x,z,rr,n] of mapTrees()){const X=(x-x0)*sc,Y=(z-z0)*sc,R=Math.max(1.2,rr*sc);if(X<-R*2||Y<-R*2||X>P+R*2||Y>P+R*2)continue;
    x2.fillStyle='rgba(10,20,8,.32)';x2.beginPath();x2.arc(X+R*0.45,Y+R*0.45,R,0,7);x2.fill();
    const gr=x2.createRadialGradient(X-R*0.35,Y-R*0.35,R*0.1,X,Y,R),v=n*18|0;gr.addColorStop(0,`rgb(${92+v},${128+v},${58})`);gr.addColorStop(1,`rgb(${30+v},${58+v},${26})`);
    x2.fillStyle=gr;x2.beginPath();x2.arc(X,Y,R,0,7);x2.fill()}
  return true}
// work on the map ground for up to ms milliseconds: the unfinished tile nearest x, z first
function mapBuild(ms,x,z){const until=performance.now()+ms;
  while(performance.now()<until){
    if(!mapJob||mapJob.cv&&!mapJob.hs&&!mapJob.img){let best=null,bd=1e18;
      for(let j=0;j<MPT_NZ;j++)for(let i=0;i<MPT_NX;i++){const t=mapTiles[j*MPT_NX+i];if(t&&t.cv&&!t.hs)continue;
        const d=(MAPW_X0+(i+0.5)*MPT_M-x)**2+(MAPW_Z0+(j+0.5)*MPT_M-z)**2;if(d<bd){bd=d;best=[i,j]}}
      if(!best){mapJob=null;return}mapJob=mapTile(best[0],best[1])}
    if(mapTileWork(mapJob,until))mapJob=null}}
function mapTilesDone(){let n=0;for(const t of mapTiles)if(t&&t.cv&&!t.hs)n++;return n}
function updateDigLayer(){
  if(!digLayer){digLayer=document.createElement('canvas');digLayer.width=digLayer.height=256}
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
// place names on the big map: [name, x, z, size], drawn at every zoom
const MAP_LABELS=[['DIG SITE',GX0+S/2,GZ0-4,1],["CORLEY'S ISLAND",0,-EDGE-8,1.2],['FAMILY ISLAND',FAM_X,FAM_Z-FAM_R-6,1.2],["JESSICA'S ISLAND",JES_X,JES_Z-JES_R-8,1.1],
  ["DEXTER'S ISLAND",DEX_X,DEX_Z-DEX_R-8,1.1],['THE LAKE',-130,120,1.3],['THE LAKE',170,390,1.3],['THE WOODS',-220,-450,1.3],['HAYFIELD',210,-440,1.3],['LAKESIDE TOWN',0,690,1.4],['MARINA BEACH',-120,545,1]];
// the map at canvas cv, centred on cx, cz at mpp metres a CSS pixel (big: the site map, with its layers and labels)
function drawMap(cv,cx,cz,mpp,big){
  const dpr=Math.min(2,devicePixelRatio||1),W=Math.round(cv.clientWidth*dpr),H=Math.round(cv.clientHeight*dpr);if(!W||!H)return;
  if(!mapTiles.some(t=>t&&t.cv&&!t.hs))mapBuild(250,cx,cz);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const g=cv.getContext('2d'),sc=dpr/mpp,X=x=>(x-cx)*sc+W/2,Y=z=>(z-cz)*sc+H/2,wx0=cx-W/2/sc,wx1=cx+W/2/sc,wz0=cz-H/2/sc,wz1=cz+H/2/sc;
  g.fillStyle='#1a4769';g.fillRect(0,0,W,H);
  g.imageSmoothingEnabled=true;
  for(let j=Math.max(0,Math.floor((wz0-MAPW_Z0)/MPT_M));j<=Math.min(MPT_NZ-1,Math.floor((wz1-MAPW_Z0)/MPT_M));j++)
    for(let i=Math.max(0,Math.floor((wx0-MAPW_X0)/MPT_M));i<=Math.min(MPT_NX-1,Math.floor((wx1-MAPW_X0)/MPT_M));i++){const t=mapTiles[j*MPT_NX+i];
      if(t&&t.cv&&!t.hs){const x=Math.floor(X(MAPW_X0+i*MPT_M)),y=Math.floor(Y(MAPW_Z0+j*MPT_M));g.drawImage(t.cv,x,y,Math.ceil(MPT_M*sc)+1,Math.ceil(MPT_M*sc)+1)}}
  // roads drawn sharp once zoomed in past the ground's own pixels
  if(sc>1.4/MPT_MPP){g.lineCap=g.lineJoin='round';g.strokeStyle='rgba(176,148,104,.9)';
    for(const r of ROADS.concat(ISLAND_ROADS)){g.lineWidth=r.w*sc;g.beginPath();r.pts.forEach((p,n)=>n?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.stroke()}}
  // causeways, bridge decks (the temporary trestles in timber), buildings with a shadow
  for(const b of CAUSEWAYS){g.save();g.translate(X(b.x0),Y(b.z0));g.rotate(Math.atan2(b.uz,b.ux));g.fillStyle='#7d7a72';g.fillRect(0,-(b.hw+1.5)*sc,b.len*sc,(2*b.hw+3)*sc);
    g.fillStyle='#a49a86';g.fillRect(0,-b.hw*sc,b.len*sc,2*b.hw*sc);g.restore()}
  for(const b of BRIDGES){g.save();g.translate(X(b.x0),Y(b.z0));g.rotate(Math.atan2(b.uz,b.ux));g.fillStyle='rgba(0,0,0,.3)';g.fillRect(0.8*sc,-(b.hw+0.4)*sc+0.8*sc,b.len*sc,(2*b.hw+0.8)*sc);
    g.fillStyle=b.temp||b.dock?'#5e4630':b.foot?'#8a2f24':'#55595c';g.fillRect(0,-(b.hw+0.4)*sc,b.len*sc,(2*b.hw+0.8)*sc);
    g.fillStyle=b.temp||b.dock?'#9c7c56':b.foot?'#b9563f':'#a2a4a6';g.fillRect(0,-b.hw*sc,b.len*sc,2*b.hw*sc);g.restore()}
  const sh=Math.max(1,0.9*sc);
  for(const s of SOLIDS){const rot=s.sn!==undefined,hx=rot?s.lx:s.hx,hz=rot?s.lz:s.hz;if(hx<1.4&&hz<1.4)continue;
    g.save();g.translate(X(s.x),Y(s.z));if(rot)g.rotate(Math.atan2(s.sn,s.cs));g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-hx*sc+sh,-hz*sc+sh,2*hx*sc,2*hz*sc);
    g.fillStyle='#8d6a52';g.fillRect(-hx*sc,-hz*sc,2*hx*sc,2*hz*sc);if(hx*sc>3){g.strokeStyle='rgba(255,236,210,.35)';g.lineWidth=Math.max(1,dpr);g.strokeRect(-hx*sc+0.5,-hz*sc+0.5,2*hx*sc-1,2*hz*sc-1)}g.restore()}
  if(big)trailDrawOn(g,X,Y,sc);
  if(digLayer)g.drawImage(digLayer,X(GX0),Y(GZ0),S*sc,S*sc);
  if(big)wetDrawOn(g,X,Y,sc);
  g.lineWidth=Math.max(1.5,0.18*sc);g.strokeStyle='#f2f2ee';g.strokeRect(X(-0.5),Y(TRENCH_Z0),1*sc,(TRENCH_Z1-TRENCH_Z0)*sc);
  g.setLineDash([6*dpr,5*dpr]);g.strokeStyle='#f5c518';g.lineWidth=Math.max(2,0.2*sc);g.beginPath();g.moveTo(X(-12),Y(PIPE_Z));g.lineTo(X(12),Y(PIPE_Z));g.stroke();g.setLineDash([]);
  g.save();g.translate(X(TB.x),Y(TB.z));g.rotate(-TB.yaw);g.fillStyle='#d8a514';g.fillRect(-BX_W/2*sc-1,-BX_L/2*sc,BX_W*sc+2,BX_L*sc);g.restore();
  if(lawn.mapDirty||!lawnMap){updateLawnMap();lawn.mapDirty=false}
  g.drawImage(lawnMap,X(LAWN_X0),Y(LAWN_Z0),LAWN_NX*LAWN_GS*sc,LAWN_NZ*LAWN_GS*sc);
  g.fillStyle='#b9b6ae';for(const b of blocks)g.fillRect(X(b.x-b.w/2),Y(b.z-b.d/2),Math.max(2,b.w*sc),Math.max(2,b.d*sc));
  if(big&&S*sc>40){g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1.5*dpr;g.setLineDash([4*dpr,4*dpr]);g.strokeRect(X(GX0),Y(GZ0),S*sc,S*sc);g.setLineDash([]);}
  if(big){g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';const fs=Math.max(12,Math.min(22,10+sc/dpr*4));
    for(const [t,x,z,k] of MAP_LABELS){if(t==='DIG SITE'&&S*sc<40)continue;if(t==="CORLEY'S ISLAND"&&S*sc>=40)continue;
      g.font=`800 ${Math.round(fs*k*dpr)}px Saira Condensed, sans-serif`;g.lineWidth=4*dpr;g.strokeStyle='rgba(12,16,12,.75)';g.strokeText(t,X(x),Y(z));g.fillStyle='#f6f3e8';g.fillText(t,X(x),Y(z))}}
  const icon=(x,z,ang,fill,len,wid,active)=>{g.save();g.translate(X(x),Y(z));g.rotate(ang);
    const L=Math.max(len*sc,big?18*dpr:10*dpr),Wd=Math.max(wid*sc,big?12*dpr:7*dpr);
    if(active){g.beginPath();g.arc(0,0,L*0.95,0,Math.PI*2);g.fillStyle='rgba(255,255,255,.28)';g.fill();g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.5*dpr;g.stroke()}
    g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=4*dpr;g.shadowOffsetY=1.5*dpr;
    g.fillStyle=fill;g.strokeStyle='#101214';g.lineWidth=2*dpr;g.beginPath();g.moveTo(L/2,0);g.lineTo(-L/2,-Wd/2);g.lineTo(-L*0.3,0);g.lineTo(-L/2,Wd/2);g.closePath();g.fill();g.shadowColor='transparent';g.stroke();g.restore()};
  const hy=st.yaw+st.swing;
  g.strokeStyle='#f07a22';g.lineWidth=Math.max(2,0.3*sc);g.beginPath();g.moveTo(X(st.x),Y(st.z));g.lineTo(X(tip.x),Y(tip.z));g.stroke();
  icon(sk.x,sk.z,Math.atan2(Math.cos(sk.yaw),Math.sin(sk.yaw)),'#f2b705',2.8,1.8,mode==='skid');
  icon(bk.x,bk.z,Math.atan2(Math.cos(bk.yaw),Math.sin(bk.yaw)),'#f2b705',2.2,0.8,mode==='bike');
  boats.forEach((b,i)=>icon(b.x,b.z,Math.atan2(Math.cos(b.yaw),Math.sin(b.yaw)),'#f4f3ef',BT_L,BT_B,mode==='boat'&&btI===i));
  for(const b of lakeBoats)icon(b.x,b.z,Math.atan2(Math.cos(b.yaw),Math.sin(b.yaw)),b.kind==='tug'?'#9e2a22':'#c9ced1',b.hl*2,b.hb*2,false);
  icon(mw.x,mw.z,Math.atan2(Math.cos(mw.yaw),Math.sin(mw.yaw)),'#d8352a',2.2,1.4,mode==='mow');
  icon(tr.x,tr.z,Math.atan2(Math.cos(tr.yaw),Math.sin(tr.yaw)),'#e9ecea',9.1,2.6,mode==='truck');
  icon(st.x,st.z,Math.atan2(Math.cos(hy),Math.sin(hy)),'#f07a22',4.2,3,mode==='dig'||mode==='drive');
  if(!wk.inside){const px=X(wk.x),py=Y(wk.z),r=Math.max((big?6:4)*dpr,0.4*sc)*(mode==='walk'?1.3:1);
    if(big){const pu=(performance.now()%1600)/1600;g.beginPath();g.arc(px,py,r*(1+pu*1.6),0,Math.PI*2);g.fillStyle=`rgba(47,183,232,${0.45*(1-pu)})`;g.fill()}
    g.save();g.translate(px,py);g.rotate(Math.atan2(Math.cos(wk.yaw),Math.sin(wk.yaw)));g.fillStyle='rgba(47,183,232,.4)';g.beginPath();g.moveTo(0,0);g.arc(0,0,r*2.6,-0.5,0.5);g.closePath();g.fill();g.restore();
    g.beginPath();g.arc(px,py,r,0,Math.PI*2);g.fillStyle='#2fb7e8';g.fill();g.strokeStyle='#fff';g.lineWidth=2*dpr;g.stroke()}
  if(big&&tpPick){const px=X(tpPick.x),py=Y(tpPick.z),r=10*dpr;g.lineWidth=3*dpr;g.strokeStyle='#14161a';g.fillStyle='rgba(245,197,24,.35)';
    g.beginPath();g.arc(px,py,r,0,Math.PI*2);g.fill();g.stroke();g.strokeStyle='#f5c518';g.lineWidth=2*dpr;g.stroke();
    g.beginPath();g.moveTo(px-r*1.6,py);g.lineTo(px+r*1.6,py);g.moveTo(px,py-r*1.6);g.lineTo(px,py+r*1.6);g.stroke()}
  // north badge, and on the big map a scale bar in feet
  const nb=big?34*dpr:26*dpr,nx=big?12*dpr:W-nb-4*dpr,ny=big?12*dpr:4*dpr;g.fillStyle='rgba(20,23,19,.78)';g.beginPath();g.roundRect?g.roundRect(nx,ny,nb,nb,6*dpr):g.rect(nx,ny,nb,nb);g.fill();
  g.fillStyle='#f3f5ef';g.font=`800 ${(big?19:16)*dpr}px Saira Condensed, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('N',nx+nb/2,ny+nb/2+dpr);
  if(big){const ftpx=FT*sc,want=130*dpr/ftpx,step=[25,50,100,200,250,500,1000,2000,2500,5000].find(v=>v>=want*0.6)||5000,len=step*ftpx,bx=W-len-16*dpr,by=H-18*dpr;
    g.fillStyle='rgba(20,23,19,.78)';g.fillRect(bx-10*dpr,by-26*dpr,len+20*dpr,36*dpr);g.fillStyle='#f3f5ef';g.fillRect(bx,by,len,3*dpr);g.fillRect(bx,by-6*dpr,2*dpr,9*dpr);g.fillRect(bx+len-2*dpr,by-6*dpr,2*dpr,9*dpr);
    g.font=`700 ${15*dpr}px Saira Condensed, sans-serif`;g.textBaseline='alphabetic';g.fillText(step>=1000?`${(step/5280).toFixed(step%5280?2:0)} mi · ${step.toLocaleString()} ft`:`${step} ft`,bx+len/2,by-8*dpr)}
}
// ---------- the big map's view: pan, zoom, places ----------
const MAP_PLACES=[['Whole map',0,104,null],['Dig site',0,8,90],['Family Island',FAM_X,FAM_Z,200],["Jessica's",JES_X,JES_Z,120],["Dexter's",DEX_X,DEX_Z,120],
  ['Woods & field',0,-440,330],['Lakeside town',0,640,260]];
const mapV={cx:0,cz:104,mpp:0,anim:null,hover:null};
function mapBox(){const c=$('#big');return [c.clientWidth||1,c.clientHeight||1]}
function mapFitMpp(){const [w,h]=mapBox();return Math.max((MAP_FIT[1]-MAP_FIT[0])/w,(MAP_FIT[3]-MAP_FIT[2])/h)}
function mapClamp(){const f=mapFitMpp();mapV.mpp=Math.max(0.1,Math.min(f*1.15,mapV.mpp||f));
  mapV.cx=Math.max(MAP_FIT[0],Math.min(MAP_FIT[1],mapV.cx));mapV.cz=Math.max(MAP_FIT[2],Math.min(MAP_FIT[3],mapV.cz))}
// glide to cx, cz showing span metres across the map's shorter side (null: the whole map)
function mapGo(cx,cz,span){const [w,h]=mapBox(),mpp=span?span/Math.min(w,h):mapFitMpp();mapV.anim={t:0,a:{cx:mapV.cx,cz:mapV.cz,mpp:mapV.mpp},b:{cx,cz,mpp}}}
function mapZoom(f,px,py){const [w,h]=mapBox();if(px===undefined){px=w/2;py=h/2}mapV.anim=null;
  const x=mapV.cx+(px-w/2)*mapV.mpp,z=mapV.cz+(py-h/2)*mapV.mpp;mapV.mpp*=f;mapClamp();mapV.cx=x-(px-w/2)*mapV.mpp;mapV.cz=z-(py-h/2)*mapV.mpp;mapClamp()}
function mapAt(px,py){const [w,h]=mapBox();return {x:mapV.cx+(px-w/2)*mapV.mpp,z:mapV.cz+(py-h/2)*mapV.mpp}}
function mapFocus(){return wk.inside?WK_RIDES[wk.inside].o:mode==='boat'?btCur():mode==='bike'?bk:mode==='walk'?wk:mode==='truck'?tr:mode==='mow'?mw:mode==='skid'?sk:st}
// what a spot on the map is called
function mapPlace(x,z){
  for(const b of BRIDGES){const [t,u]=deckLocal(b,x,z);if(t>0&&t<b.len&&Math.abs(u)<b.hw+1)return b.dock?'Dock':b.temp?'Temporary bridge':b.foot?'Covered footbridge':'Bridge'}
  if(jesR(x,z)<JES_R+4)return "Jessica's Island";if(dexR(x,z)<DEX_R+4)return "Dexter's Island";if(famR(x,z)<FAM_R+4)return 'Family Island';
  if(inDig(x,z))return 'Dig site';if(mesaR(x,z)<EDGE+4)return "Corley's Island";
  if(z<0&&z<mainRimN(x)+6)return x<-14?'The woods':x>14?'The hayfield':'North trail';if(z>0&&z>mainRimS(x)-6)return 'Lakeside town';return 'The lake'}
function mapWhere(){const el=$('#mapWhere'),f=mapFocus(),p=mapV.hover||tpPick;
  const t=p?`${mapPlace(p.x,p.z)} · ${Math.round(Math.hypot(p.x-f.x,p.z-f.z)/FT/10)*10} ft from you`:`You: ${mapPlace(f.x,f.z)}`;if(el.textContent!==t)el.textContent=t}
function drawBig(){if($('#bigmap').hidden)return;const a=mapV.anim;
  if(a){a.t=Math.min(1,a.t+1/14);const e=a.t*a.t*(3-2*a.t),lm=Math.log(a.a.mpp)+(Math.log(a.b.mpp)-Math.log(a.a.mpp))*e;
    mapV.cx=a.a.cx+(a.b.cx-a.a.cx)*e;mapV.cz=a.a.cz+(a.b.cz-a.a.cz)*e;mapV.mpp=Math.exp(lm);if(a.t>=1)mapV.anim=null}
  mapClamp();drawMap($('#big'),mapV.cx,mapV.cz,mapV.mpp,true);mapWhere()}
function mapsTick(dt){
  mapT-=dt;if(mapDirty&&mapT<=0){updateDigLayer();mapDirty=false;mapT=0.5}
  const fv=mapFocus(),open=!$('#bigmap').hidden;
  // the ground tiles fill in behind play (a little each frame), faster while the site map is open
  if(mapTilesDone()<MPT_NX*MPT_NZ){const c=open?mapAt(...mapBox().map(v=>v/2)):fv;mapBuild(open?14:gfxKey==='low'?1.5:3,c.x,c.z)}
  const mini=$('#mini');drawMap(mini,fv.x,fv.z,84/(mini.clientWidth||84),false);
  // the trails layer catches up with new travel once a second while the map is open
  if(open){mapBigT-=dt;if(mapBigT<=0&&trailDirty&&trailShow!=='off'){mapBigT=1;trailSync()}else drawBig()}
}
function toggleMap(show){const m=$('#bigmap');m.hidden=show===undefined?!m.hidden:!show;tpSet(null);mapV.hover=null;
  if(!m.hidden){if(!mapV.mpp)mapV.mpp=mapFitMpp();trailSync()}}
{const bar=$('#mapPlaces');for(const [n,x,z,sp] of MAP_PLACES){const b=document.createElement('button');b.textContent=n;b.onclick=()=>mapGo(x,z,sp);bar.appendChild(b)}}
$('#mapZin').onclick=()=>mapZoom(1/1.6);$('#mapZout').onclick=()=>mapZoom(1.6);$('#mapFit').onclick=()=>mapGo(0,104,null);
$('#mapMe').onclick=()=>{const f=mapFocus();mapGo(f.x,f.z,Math.min(160,mapV.mpp*Math.min(...mapBox())))};
// drag to pan, pinch or the wheel to zoom; a tap without a drag picks a teleport spot
{const cv=$('#big'),pts=new Map();let drag=null;
  const local=e=>{const b=cv.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top]};
  cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(err){}pts.set(e.pointerId,local(e));mapV.anim=null;
    drag=pts.size===1?{p:local(e),moved:false}:drag&&Object.assign(drag,{moved:true});cv.classList.add('drag')});
  cv.addEventListener('pointermove',e=>{const p=local(e);
    if(!pts.has(e.pointerId)){if(e.pointerType==='mouse')mapV.hover=mapAt(...p);return}
    const q=pts.get(e.pointerId);
    if(pts.size===1&&drag){if(Math.hypot(p[0]-drag.p[0],p[1]-drag.p[1])>6)drag.moved=true;
      if(drag.moved){mapV.cx-=(p[0]-q[0])*mapV.mpp;mapV.cz-=(p[1]-q[1])*mapV.mpp;mapClamp()}}
    else if(pts.size===2){const [o]=[...pts.entries()].filter(([k])=>k!==e.pointerId).map(([,v])=>v),d0=Math.hypot(q[0]-o[0],q[1]-o[1]),d1=Math.hypot(p[0]-o[0],p[1]-o[1]);
      const mx=(p[0]+o[0])/2,my=(p[1]+o[1])/2;if(d1>4)mapZoom(d0/d1,mx,my);mapV.cx-=(p[0]-q[0])/2*mapV.mpp;mapV.cz-=(p[1]-q[1])/2*mapV.mpp;mapClamp()}
    pts.set(e.pointerId,p)});
  const up=e=>{if(!pts.has(e.pointerId))return;const p=local(e);pts.delete(e.pointerId);
    if(!pts.size){cv.classList.remove('drag');if(drag&&!drag.moved&&e.type==='pointerup'){const {x,z}=mapAt(...p);
      if(!landIn(x,z,0,0,true)&&!tpSpot('foot',x,z))toast(say('tpLake'),'bad');else tpSet({x,z})}drag=null}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',()=>{mapV.hover=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();mapZoom(Math.exp(e.deltaY*(e.deltaMode?0.05:0.0016)),...local(e))},{passive:false})}
// ---------- teleport ----------
// tap a spot on the big map, then go there on foot or in a machine (the one you're in, or any other: it comes with you)
let tpPick=null;
function tpSet(p){tpPick=p;$('#tpOpts').hidden=!p;$('#tpHint').hidden=!!p;const cur=wk.inside||(mode==='walk'?'foot':rideOf(mode));
  for(const b of document.querySelectorAll('#tpOpts [data-tp]'))b.setAttribute('aria-pressed',b.dataset.tp===cur)}
// room for machine k (or the worker, k 'foot') at x,z facing yaw: on land, off steep ground, clear of buildings, blocks
// and the other machines
function tpFits(k,x,z,yaw){const R=WK_RIDES[k],circ=R?R.c.map(lz=>[x+Math.sin(yaw)*lz,z+Math.cos(yaw)*lz]):[[x,z]],r=R?R.r:WK_R;
  if(R){const lim=k==='ex'?[3.5,1.9]:k==='truck'?[3,1.4]:[2,1];if(!landIn(x,z,lim[0],lim[1]))return false}else if(!landIn(x,z,1.5,0.45,true))return false;
  for(const [cx,cz] of circ){if(R&&(!landIn(cx,cz,1,0.3)||wallAt(cx,cz)))return false;
    if(SOLIDS.some(s=>Math.abs(cx-s.x)<s.hx+r&&Math.abs(cz-s.z)<s.hz+r))return false;
    if(blocks.some(b=>Math.abs(cx-b.x)<b.w/2+r&&Math.abs(cz-b.z)<b.d/2+r))return false;
    for(const j in WK_RIDES){if(j===k)continue;const Q=WK_RIDES[j];
      for(const lz of Q.c)if(Math.hypot(cx-Q.o.x-Math.sin(Q.o.yaw)*lz,cz-Q.o.z-Math.cos(Q.o.yaw)*lz)<Q.r+r+0.3)return false}}
  return true}
// the nearest spot with room, out to 15 m from the one tapped, turning a machine a quarter at a time if it doesn't fit
function tpSpot(k,x,z){const y0=k==='foot'?wk.yaw:WK_RIDES[k].o.yaw;
  for(let d=0;d<=15;d+=1.5)for(let a=0,n=d?Math.ceil(d*4):1;a<n;a++){const px=x+Math.cos(a/n*Math.PI*2)*d,pz=z+Math.sin(a/n*Math.PI*2)*d;
    for(let q=0;q<(k==='foot'?1:4);q++){const yaw=y0+q*Math.PI/2;if(tpFits(k,px,pz,yaw))return {x:px,z:pz,yaw}}}
  return null}
function tpGo(k){if(!tpPick||bench.on)return;
  const p=tpSpot(k,tpPick.x,tpPick.z);if(!p){toast(say('tpNoRoom'),'bad');return}
  const from=wk.inside?WK_RIDES[wk.inside].o:wk,dist=Math.hypot(p.x-from.x,p.z-from.z)/FT;
  if(k==='foot'){Object.assign(wk,{x:p.x,z:p.z,vy:0,ground:true,airT:0,jumpQ:0,landT:0,spd:0,inside:null});wk.y=wkFloor(p.x,p.z,0,1e9);setMode('walk')}
  else{const R=WK_RIDES[k],o=R.o;Object.assign(o,{x:p.x,z:p.z,yaw:p.yaw,pitch:0,roll:0,sink:0,spin:0});o.y=surfAt(p.x,p.z);
    if(o===tr)Object.assign(tr,{v:0,steer:0,stuck:0,mud:0});else if(o===mw)Object.assign(mw,{l:0,r:0,vl:0,vr:0,v:0,w:0});else if(o===sk)Object.assign(sk,{v:0,w:0});
    wk.inside=k;walker.visible=false;setMode(rideOf(mode)===k?mode:R.m)}
  firstCam=true;toggleMap(false);
  toast(say('tpDone',{ft:Math.round(dist/10)*10,how:k==='foot'?'on foot':'in the '+WK_RIDES[k].n}),'good')}
for(const b of document.querySelectorAll('#tpOpts [data-tp]'))b.onclick=()=>tpGo(b.dataset.tp);
$('#tpCancel').onclick=()=>tpSet(null);
$('#mini').addEventListener('click',()=>toggleMap(true));
$('#mapClose').onclick=()=>toggleMap(false);
$('#bigmap').addEventListener('click',e=>{if(e.target.id==='bigmap')toggleMap(false)});
addEventListener('keydown',e=>{if(e.code==='Escape')toggleMap(false)});
