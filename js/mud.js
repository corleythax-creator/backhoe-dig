// Corley's Island: mud on the rest of the mesa, and getting stuck in it.
// Soak is how wet the ground is (0 dry, 1 saturated): the soil water of rain.js, from rain and from Mud painted in the
// map editor (which starts soaked and dries out), through soakAt here and mudOf/soakK (water.js) in the dig zone, so everything else reads it.
// Outside the dig zone the ground is a 0.5 m mesh that can't take ruts, so the first time a track or tyre churns soaked
// ground there, an 8 m tile of 2 in ground (FC, a third of a mid cell) takes over that spot: the mid mesh gets a hole
// and the tile ruts, heaps berms and holds puddles like the dig zone. Untouched mud costs nothing; tiles save with the
// site (so they sync), and the Graphics setting only changes how their puddles are drawn.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
function soakAt(x,z){return rainSoakAt(x,z)}
// a tile vertex's soak: the soil water (rain.js), where rutted ground counts as bare dirt
function fineSoak(v,x,z){const r=rwIdx(x,z);return r<0?0:ss(0.25,0.9,rainW[r])*(Math.abs(FD[v])>0.04?1:rainK[r])}

// ---------- the fine grid and its tiles ----------
const FC=0.5/3,FX0=MID[0],FZ0=MID[2],FNX=Math.round((MID[1]-MID[0])/FC),FNZ=Math.round((MID[3]-MID[2])/FC),FV=FNX+1;
const MT=48,MT_NX=Math.ceil(FNX/MT),MT_NZ=Math.ceil(FNZ/MT),MT_MAX=160;
// the dig zone in fine cells (its own grid draws it)
const FDI0=Math.round((-S/2-FX0)/FC),FDI1=Math.round((S/2-FX0)/FC),FDJ0=Math.round((-S/2-FZ0)/FC),FDJ1=Math.round((S/2-FZ0)/FC);
// per fine vertex, made on the first tile: original height, rut depth (+ up), water surface and churned mud (0-255)
let FH0=null,FD=null,FW=null,FM=null;
const mtIdx=new Int16Array(MT_NX*MT_NZ).fill(-1),mTiles=[];
let mtWet=false,mtWaterT=0,mtDryT=0,mtFine=false;
const cellOk=(ci,cj)=>ci>=0&&cj>=0&&ci<FNX&&cj<FNZ&&!(ci>=FDI0&&ci<FDI1&&cj>=FDJ0&&cj<FDJ1);
const tileOf=(ci,cj)=>ci<0||cj<0||ci>=FNX||cj>=FNZ?-1:mtIdx[((cj/MT)|0)*MT_NX+((ci/MT)|0)];
// a vertex moves only when all four cells around it are drawn by tiles, so tile edges against the mid mesh stay put
function vOk(i,j){for(const [a,b] of [[i-1,j-1],[i,j-1],[i-1,j],[i,j]])if(!cellOk(a,b)||tileOf(a,b)<0)return false;return true}
// the mid mesh's surface (bilinear over its 0.5 m points), which tile edges have to meet
function midH(x,z){const fx=(x-MID[0])/0.5,fz=(z-MID[2])/0.5,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,x0=MID[0]+i*0.5,z0=MID[2]+j*0.5;
  if(u<1e-6&&v<1e-6)return baseHeight(x0,z0);
  return baseHeight(x0,z0)*(1-u)*(1-v)+baseHeight(x0+0.5,z0)*u*(1-v)+baseHeight(x0,z0+0.5)*(1-u)*v+baseHeight(x0+0.5,z0+0.5)*u*v}
function mtBase(t){const n=MT+1,c=[0,0,0,0];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const gi=t.i0+i,gj=t.j0+j;if(gi>FNX||gj>FNZ)continue;const v=gj*FV+gi,x=FX0+gi*FC,z=FZ0+gj*FC,q=j*n+i;
    FH0[v]=midH(x,z);t.bd[q]=groundColor(x,z,FH0[v],c);t.bc[q*3]=c[0];t.bc[q*3+1]=c[1];t.bc[q*3+2]=c[2];t.bm[q]=c[3];
    if(FD[v]===0)FM[v]=0}
  t.dirty=true}
function mtAdd(ti,tj){if(ti<0||tj<0||ti>=MT_NX||tj>=MT_NZ)return -1;const at=mtIdx[tj*MT_NX+ti];if(at>=0)return at;if(mTiles.length>=MT_MAX)return -1;
  if(!FD){const n=FV*(FNZ+1);FH0=new Float32Array(n);FD=new Float32Array(n);FW=new Float32Array(n).fill(-1e9);FM=new Uint8Array(n)}
  const n=MT+1,nv=n*n,i0=ti*MT,j0=tj*MT,ix=[];
  for(let j=0;j<MT;j++)for(let i=0;i<MT;i++)if(cellOk(i0+i,j0+j)){const a=j*n+i;ix.push(a,a+n,a+1,a+1,a+n,a+n+1)}
  if(!ix.length)return -1;
  const g=new THREE.BufferGeometry();
  for(const [k,w] of [['position',3],['normal',3],['color',3],['dirt',1],['soilD',1],['matA',1],['mudW',1],['wetT',1]])g.setAttribute(k,new THREE.BufferAttribute(new Float32Array(nv*w),w));
  g.attributes.wetT.array.fill(-1e4);g.setIndex(ix);
  const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;m.frustumCulled=false;scene.add(m);
  const t={ti,tj,i0,j0,g,m,bc:new Float32Array(nv*3),bd:new Float32Array(nv),bm:new Float32Array(nv),dirty:true,wm:null,wet:false,wDirty:false};
  mtIdx[tj*MT_NX+ti]=mTiles.length;mTiles.push(t);mtBase(t);mtWaterMesh(t);return mTiles.length-1}
// the mid mesh skips the dig zone and every cell a tile draws
function midHoles(){const P=midPatch,ix=[];
  for(let j=0;j<P.NZ;j++)for(let i=0;i<P.NX;i++){const x0=P.X0+i*P.CO,z0=P.Z0+j*P.CO;
    if(x0>=-S/2-1e-6&&x0+P.CO<=S/2+1e-6&&z0>=-S/2-1e-6&&z0+P.CO<=S/2+1e-6)continue;
    if(mtIdx[((j*3/MT)|0)*MT_NX+((i*3/MT)|0)]>=0)continue;const a=j*P.VX+i;ix.push(a,a+P.VX,a+1,a+1,a+P.VX,a+P.VX+1)}
  P.g.setIndex(ix)}
function mtDraw(t){const n=MT+1,g=t.g,p=g.attributes.position.array,col=g.attributes.color.array,dA=g.attributes.dirt.array,sA=g.attributes.soilD.array,
  mA=g.attributes.matA.array,uA=g.attributes.mudW.array;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const gi=Math.min(FNX,t.i0+i),gj=Math.min(FNZ,t.j0+j),v=gj*FV+gi,q=j*n+i,d=FD[v],tt=ss(0.02,0.16,Math.abs(d));
    p[q*3]=FX0+gi*FC;p[q*3+1]=FH0[v]+d;p[q*3+2]=FZ0+gj*FC;sA[q]=-d;
    const sh=(0.82+0.34*hash(gi,gj))*rutShade(d);
    for(let c=0;c<3;c++)col[q*3+c]=t.bc[q*3+c]+(MUD_C[c]*sh-t.bc[q*3+c])*tt;
    dA[q]=Math.max(tt,t.bd[q]);mA[q]=t.bm[q]*(1-tt);uA[q]=FM[v]/255}
  for(const k of ['position','color','dirt','soilD','matA','mudW'])g.attributes[k].needsUpdate=true;
  t.dirty=false}
// height of the ground at x,z outside the dig zone: a tile where there is one, else the mesa
// (hAt in terrain.js reads it through farGround)
farGround=farH;
function farH(x,z){if(FD){const fx=(x-FX0)/FC,fz=(z-FZ0)/FC,i=Math.floor(fx),j=Math.floor(fz);
  if(tileOf(i,j)>=0&&i<FNX&&j<FNZ){const u=fx-i,v=fz-j,k=j*FV+i;
    return (FH0[k]+FD[k])*(1-u)*(1-v)+(FH0[k+1]+FD[k+1])*u*(1-v)+(FH0[k+FV]+FD[k+FV])*(1-u)*v+(FH0[k+FV+1]+FD[k+FV+1])*u*v}}
  return baseHeight(x,z)}
// how muddy x,z is outside the dig zone (churned mud in a tile, else the soak)
function farMud(x,z){if(FD){const i=Math.round((x-FX0)/FC),j=Math.round((z-FZ0)/FC);if(i>=0&&j>=0&&i<=FNX&&j<=FNZ&&tileOf(Math.min(i,FNX-1),Math.min(j,FNZ-1))>=0){const v=j*FV+i;return Math.max(FM[v]/255,fineSoak(v,x,z))}}
  return soakAt(x,z)}

// ---------- ruts outside the dig zone: the same rules as stampRut in the dig zone ----------
const fBerm=[];
// soft mud slumps to RUT_SLOPE, as rutSlump does in the dig zone
function farSlump(i0,i1,j0,j1){const lim=RUT_SLOPE*FC;
  const flow=(k,k2,i2,j2)=>{if(!vOk(i2,j2))return;const d=FD[k]-FD[k2],ad=Math.abs(d);if(ad<=lim)return;
    const hi=d>0?k:k2,lo=d>0?k2:k;if(Math.abs(FD[hi])>0.45||Math.abs(FD[lo])>0.45)return;
    const a=(ad-lim)*0.3;FD[hi]-=a;FD[lo]+=a;FM[lo]=Math.max(FM[lo],Math.round(FM[hi]*0.9))};
  for(let pass=0;pass<3;pass++)for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*FV+i;
    if(FM[k]<13||!vOk(i,j))continue;flow(k,k+1,i+1,j);flow(k,k+FV,i,j+1)}}
function farRut(x,z,yaw,hw,hl,dt){
  const R=Math.hypot(hw+RUT_BERM,hl),i0=Math.floor((x-R-FX0)/FC),i1=Math.ceil((x+R-FX0)/FC),j0=Math.floor((z-R-FZ0)/FC),j1=Math.ceil((z+R-FZ0)/FC);
  if(i1<0||j1<0||i0>FNX||j0>FNZ)return 0;
  // only properly muddy ground (or ground already churned) gets a tile, so a drive on damp grass doesn't tile the mesa
  let wet=false;for(const [px,pz] of [[x,z],[x-hw,z-hl],[x+hw,z-hl],[x-hw,z+hl],[x+hw,z+hl]])if(farMud(px,pz)>0.4){wet=true;break}
  if(!wet)return 0;
  let added=false;for(let tj=Math.max(0,((j0-1)/MT)|0);tj<=Math.min(MT_NZ-1,((j1+1)/MT)|0);tj++)for(let ti=Math.max(0,((i0-1)/MT)|0);ti<=Math.min(MT_NX-1,((i1+1)/MT)|0);ti++)
    if(mtIdx[tj*MT_NX+ti]<0&&mtAdd(ti,tj)>=0)added=true;
  if(added)midHoles();
  const s=Math.sin(yaw),c=Math.cos(yaw);let any=0,outL=0,outR=0,mSum=0,mN=0;fBerm.length=0;
  for(let j=Math.max(1,j0);j<=Math.min(FNZ-1,j1);j++)for(let i=Math.max(1,i0);i<=Math.min(FNX-1,i1);i++){
    const dx=FX0+i*FC-x,dz=FZ0+j*FC-z,u=dx*s+dz*c,v=dx*c-dz*s,av=Math.abs(v);if(Math.abs(u)>hl||av>hw+RUT_BERM||!vOk(i,j))continue;const k=j*FV+i;
    const wx=FX0+i*FC,wz=FZ0+j*FC;
    if(av>hw){const room=rutBerm(av-hw,wx,wz)-FD[k];if(room>0)fBerm.push(k,v,room);continue}
    const m=Math.max(FM[k]/255,fineSoak(k,wx,wz));if(m<=RUT_MUD)continue;const d=Math.min(0.5*dt,FD[k]+RUT_D*Math.min(1,m*1.25)*rutDepth(v,hw,wx*s+wz*c));
    if(d>0){FD[k]-=d;if(v<0)outL+=d;else outR+=d;mSum+=m;mN++;any=2}}
  if(outL+outR>0){let wL=0,wR=0;for(let n=0;n<fBerm.length;n+=3)if(fBerm[n+1]<0)wL+=fBerm[n+2];else wR+=fBerm[n+2];
    const m=mSum/mN;
    for(let n=0;n<fBerm.length;n+=3){const k=fBerm[n],w=fBerm[n+1]<0?(wL?outL/wL:0):(wR?outR/wR:0),a=Math.min(1,w)*fBerm[n+2];if(a<=0)continue;
      FD[k]+=a;FM[k]=Math.max(FM[k],Math.round(m*127))}
    farSlump(Math.max(1,i0),Math.min(FNX-2,i1),Math.max(1,j0),Math.min(FNZ-2,j1))}
  if(any){for(let tj=Math.max(0,(j0/MT)|0);tj<=Math.min(MT_NZ-1,(j1/MT)|0);tj++)for(let ti=Math.max(0,(i0/MT)|0);ti<=Math.min(MT_NX-1,(i1/MT)|0);ti++){const t=mTiles[mtIdx[tj*MT_NX+ti]];if(t)t.dirty=t.wDirty=true}
    mtWet=true;site.dirty=true}
  return any}

// ---------- puddles in the tiles ----------
// soaked ground holds its water 2 in under the surface (SAT_DEPTH, water.js): ruts below that fill up at the seep rate.
// Rain falls into ruts; once it stops, water above that level drains away, and churned mud dries back over several minutes
function mtWaterMesh(t){const K=mtFine?1:2,n=MT/K+1,g=new THREE.PlaneGeometry(1,1,n-1,n-1);
  if(t.wm){t.wm.geometry.dispose();t.wm.geometry=g}else{t.wm=new THREE.Mesh(g,wmMat);t.wm.frustumCulled=false;t.wm.receiveShadow=true;t.wm.visible=false;scene.add(t.wm)}
  t.wK=K;t.wDirty=true}
function mtWaterTick(dt){
  if(!mtWet||(mtWaterT-=dt)>0)return;const step=0.25;mtWaterT=step;let moving=false;
  const rain=weather.r>0.02,dry=(mtDryT-=step)<=0;if(dry)mtDryT=2.5;
  for(const t of mTiles){let any=false;
    for(let j=0;j<=MT;j++)for(let i=0;i<=MT;i++){const gi=t.i0+i,gj=t.j0+j;if(gi>FNX||gj>FNZ)continue;const v=gj*FV+gi,h=FH0[v]+FD[v],w0=FW[v];
      if(!vOk(gi,gj))continue;const sat=fineSoak(v,FX0+gi*FC,FZ0+gj*FC)>SAT_MUD,top=FH0[v]-SAT_DEPTH;
      if(sat&&h<top){if(FW[v]<h)FW[v]=h;if(FW[v]<top)FW[v]=Math.min(top,FW[v]+SEEP*step)}
      if(rain&&h<FH0[v]-0.02){if(FW[v]<h)FW[v]=h;if(FW[v]<top)FW[v]=Math.min(top,FW[v]+weather.r*RAIN_IN*step)}
      else if(!rain&&FW[v]>-1e8&&(!sat||FW[v]>top))FW[v]-=RAIN_DRAIN*step;
      if(dry&&FM[v]>0&&FW[v]<-1e8){FM[v]--;t.dirty=true}
      if(FW[v]<=h+0.001&&!(rain&&FW[v]>-1e8&&h<FH0[v]-0.02))FW[v]=-1e9;else if(FW[v]>h+0.003)any=true;
      if(Math.abs(FW[v]-w0)>1e-4){moving=true;t.wDirty=true}}
    t.wet=any;t.wm.visible=any;
    if(any&&t.wDirty){t.wDirty=false;const K=t.wK,n=MT/K+1,p=t.wm.geometry.attributes.position.array;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){const gi=Math.min(FNX,t.i0+i*K),gj=Math.min(FNZ,t.j0+j*K),v=gj*FV+gi,o=(j*n+i)*3;
        let y=FW[v];if(y<FH0[v]+FD[v]+0.003){const m=Math.max(gi>=K?FW[v-K]:-1e9,gi+K<=FNX?FW[v+K]:-1e9,gj>=K?FW[v-K*FV]:-1e9,gj+K<=FNZ?FW[v+K*FV]:-1e9),h=FH0[v]+FD[v];y=m>-1e8?Math.min(m,h-0.02):h-0.12}
        p[o]=FX0+gi*FC;p[o+1]=y;p[o+2]=FZ0+gj*FC}
      t.wm.geometry.attributes.position.needsUpdate=true;t.wm.geometry.computeVertexNormals()}}
  if(moving)site.dirty=true}
// Low graphics draws tile puddles every 1 ft, Medium and High every 2 in (the water itself is the same)
function mudGfx(fine){if(mtFine===fine)return;mtFine=fine;for(const t of mTiles)mtWaterMesh(t);mtWaterT=0}

// ---------- the map editor, reset and the save ----------
// after the editor reshapes or repaints an area (metres): tiles there take the new ground and soak, keeping their ruts
function mudEdRefresh(x0,x1,z0,z1){for(const t of mTiles){const tx0=FX0+t.i0*FC,tz0=FZ0+t.j0*FC,w=MT*FC;
  if(tx0>x1||tx0+w<x0||tz0>z1||tz0+w<z0)continue;mtBase(t);t.wDirty=true}mtWet=mTiles.length>0}
// the map editor painting over ruts: churned ground inside the brush (radius R, or a square when sq) goes back to grade,
// dry and without its puddles, except where keep(x,z) says to leave it. Holes dug deeper than a rut and heaps of spoil stay,
// and so does anything next to one, so painting near a trench doesn't carve its rim. Returns whether anything changed
function rutErase(cx,cz,R,sq,keep,all){const inB=(dx,dz)=>(sq?Math.max(Math.abs(dx),Math.abs(dz)):Math.hypot(dx,dz))<=R;let hit=false;
  const i0=Math.max(0,Math.floor((cx-R+S/2)/CELL)),i1=Math.min(N,Math.ceil((cx+R+S/2)/CELL)),j0=Math.max(0,Math.floor((cz-R+S/2)/CELL)),j1=Math.min(N,Math.ceil((cz+R+S/2)/CELL));
  if(i0<=i1&&j0<=j1){
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i,x=i*CELL-S/2,z=j*CELL-S/2,d=H[k]-H0[k];
      if(d===0&&!mudA[k]&&Wt[k]<-1e8||!all&&Math.abs(d)>RUT_D+0.12||prot[k]||!inB(x-cx,z-cz))continue;
      let deep=false;if(!all)for(let b=Math.max(0,j-2);b<=Math.min(N,j+2)&&!deep;b++)for(let a=Math.max(0,i-2);a<=Math.min(N,i+2);a++)if(Math.abs(H[b*V+a]-H0[b*V+a])>RUT_D+0.22){deep=true;break}
      if(deep||keep&&keep(x,z))continue;
      H[k]=H0[k];mudA[k]=0;Wt[k]=-1e9;comp[k]=0;wetT[k]=-1e4;hit=true}
    if(hit){touch(i0,i1,j0,j1);updateTufts(i0,i1,j0,j1);st.dirty=true}}
  if(FD){let ft=false;const fi0=Math.max(1,Math.floor((cx-R-FX0)/FC)),fi1=Math.min(FNX-1,Math.ceil((cx+R-FX0)/FC)),fj0=Math.max(1,Math.floor((cz-R-FZ0)/FC)),fj1=Math.min(FNZ-1,Math.ceil((cz+R-FZ0)/FC));
    for(let j=fj0;j<=fj1;j++)for(let i=fi0;i<=fi1;i++){const v=j*FV+i,x=FX0+i*FC,z=FZ0+j*FC;
      if(FD[v]===0&&!FM[v]&&FW[v]<-1e8||tileOf(Math.min(i,FNX-1),Math.min(j,FNZ-1))<0||!inB(x-cx,z-cz)||keep&&keep(x,z))continue;
      FD[v]=0;FM[v]=0;FW[v]=-1e9;ft=true}
    if(ft){for(const t of mTiles){const tx0=FX0+t.i0*FC,tz0=FZ0+t.j0*FC,w=MT*FC;if(tx0>cx+R||tx0+w<cx-R||tz0>cz+R||tz0+w<cz-R)continue;t.dirty=t.wDirty=true}
      site.dirty=true;hit=true}}
  return hit}
function mudReset(){for(const t of mTiles){scene.remove(t.m);t.g.dispose();scene.remove(t.wm);t.wm.geometry.dispose()}
  mTiles.length=0;mtIdx.fill(-1);mtWet=false;if(FD){FD.fill(0);FW.fill(-1e9);FM.fill(0)}midHoles();tuftsRefresh(-1e9,1e9,-1e9,1e9);grassReset()}
// each tile: [ti, tj, rut depths (Int16, mm), mud (bytes)], base64
function mtSave(){const out=[],n=MT+1;
  for(const t of mTiles){const d=new Int16Array(n*n),m=new Uint8Array(n*n);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const gi=Math.min(FNX,t.i0+i),gj=Math.min(FNZ,t.j0+j),v=gj*FV+gi;d[j*n+i]=Math.round(Math.max(-32,Math.min(32,FD[v]))*1000);m[j*n+i]=FM[v]}
    out.push([t.ti,t.tj,siteB64(new Uint8Array(d.buffer)),siteB64(m)])}
  return out}
// after the soil water has loaded (save.js): ruts in soaked ground come back with their puddles full
function mtRefill(){for(const t of mTiles)for(let j=0;j<=MT;j++)for(let i=0;i<=MT;i++){const gi=t.i0+i,gj=t.j0+j;if(gi>FNX||gj>FNZ)continue;const v=gj*FV+gi;
  if(vOk(gi,gj)&&FD[v]<-SAT_DEPTH&&fineSoak(v,FX0+gi*FC,FZ0+gj*FC)>SAT_MUD)FW[v]=FH0[v]-SAT_DEPTH}}
function mtLoad(a){if(!Array.isArray(a))return;const n=MT+1;
  for(const e of a){if(!Array.isArray(e)||e.length<4)continue;const idx=mtAdd(e[0]|0,e[1]|0);if(idx<0)continue;const t=mTiles[idx];
    let d,m;try{d=new Int16Array(siteUnB64(e[2]).buffer);m=siteUnB64(e[3])}catch(x){continue}if(d.length!==n*n||m.length!==n*n)continue;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const gi=t.i0+i,gj=t.j0+j;if(gi>FNX||gj>FNZ)continue;const v=gj*FV+gi;FD[v]=d[j*n+i]/1000;FM[v]=m[j*n+i]}
    t.dirty=true}
  mtWet=mTiles.length>0;mtWaterT=0;if(mTiles.length)midHoles();
  // no grass in the saved ruts
  for(const t of mTiles)tuftsRefresh(FX0+t.i0*FC,FX0+(t.i0+MT)*FC,FZ0+t.j0*FC,FZ0+(t.j0+MT)*FC)}

// ---------- getting stuck ----------
// sink: how far a machine has dug itself in (0 firm, 1 buried to the frame). Pushing on in mud digs it in slowly (k: how
// easily it bogs: the wide tracks less than the truck's tyres) and spinning digs it in fast; it settles slowly when
// parked there. Past about a third the tracks or tyres start to spin and near the top it barely moves. Rocking frees it:
// each time the drive flips between forward and back (no faster than every 0.6 s) it climbs out some way and lurches
// for half a second without digging in. Returns the traction (0-1).
function bogTick(o,mud,inp,k,dt){
  o.rockT=(o.rockT||0)+dt;o.lurch=Math.max(0,(o.lurch||0)-dt);
  if(mud<RUT_MUD){o.sink=Math.max(0,(o.sink||0)-dt*0.5);o.spin=0;o.pushDir=0;return 1}
  const dir=Math.abs(inp)>0.3?Math.sign(inp):0;
  if(dir&&o.pushDir&&dir!==o.pushDir&&o.sink>0.1&&o.rockT>0.6){o.sink=Math.max(0,o.sink-0.15-0.15*o.sink);o.lurch=0.5;o.rockT=0}
  const g=Math.max(1-0.95*ss(0.35,0.9,o.sink),o.lurch>0?0.6:0);
  o.spin=Math.abs(inp)*(1-g);
  if(dir){o.pushDir=dir;if(!o.lurch)o.sink=Math.min(1,o.sink+dt*mud*mud*k*(0.3+3*o.spin))}
  else o.sink=Math.min(1,o.sink+dt*0.004*mud);
  if(o.spin>0.5&&o.sink>0.7&&(!o.bogMsgT||performance.now()-o.bogMsgT>20000)){o.bogMsgT=performance.now();
    toast(`Stuck in the mud. Rock it free: ${keyLabel('lUp')} then ${keyLabel('lDown')}, and again.`,'bad',4200)}
  return g}

// ---------- flung mud ----------
// blobs thrown off spinning tracks and tyres and sprayed by fast ones; how many follows Dirt detail (so phones on Low throw fewer)
const MF_BASE=60,mfGeo=new THREE.DodecahedronGeometry(0.085,0),mfMat=M(0x3d2a1a,{shininess:30,specular:0x16120e});
let mfInst=null,mfP=null,mfV=null,mfOn=null,mfHead=0,mfAcc=0;
function mfBuild(){if(mfInst){scene.remove(mfInst);mfInst.dispose()}const n=MF_BASE*Math.min(DIRT,4);
  mfInst=new THREE.InstancedMesh(mfGeo,mfMat,n);mfInst.count=0;mfInst.frustumCulled=false;mfInst.castShadow=false;scene.add(mfInst);
  mfP=new Float32Array(n*3);mfV=new Float32Array(n*3);mfOn=new Uint8Array(n);mfHead=0}
// rate blobs a second from x,y,z, thrown back along heading yaw (radians) at speed sp
function flingMud(x,y,z,yaw,sp,rate,dt){if(!mfInst||DIRT!==mfInst.userData.d){mfBuild();mfInst.userData.d=DIRT}
  mfAcc+=rate*Math.min(DIRT,4)*dt;const n=mfOn.length;
  while(mfAcc>=1){mfAcc--;const q=mfHead;mfHead=(mfHead+1)%n;mfOn[q]=1;
    mfP[q*3]=x+(Math.random()-0.5)*0.3;mfP[q*3+1]=y;mfP[q*3+2]=z+(Math.random()-0.5)*0.3;const a=yaw+(Math.random()-0.5)*0.7,v=sp*(0.5+Math.random()*0.6);
    mfV[q*3]=-Math.sin(a)*v;mfV[q*3+1]=1.5+Math.random()*2.5;mfV[q*3+2]=-Math.cos(a)*v}}
const mfO=new THREE.Object3D();
function mudFlyTick(dt){if(!mfInst)return;let c=0;
  for(let q=0;q<mfOn.length;q++){if(!mfOn[q])continue;mfV[q*3+1]-=9.8*dt;for(let a=0;a<3;a++)mfP[q*3+a]+=mfV[q*3+a]*dt;
    if(mfP[q*3+1]<hAt(mfP[q*3],mfP[q*3+2])){mfOn[q]=0;continue}
    mfO.position.set(mfP[q*3],mfP[q*3+1],mfP[q*3+2]);mfO.rotation.set(q,q*0.7,0);mfO.scale.setScalar(0.6+(q%5)*0.2);mfO.updateMatrix();mfInst.setMatrixAt(c++,mfO.matrix)}
  mfInst.count=c;if(c)mfInst.instanceMatrix.needsUpdate=true}

// ---------- splashes ----------
// a tyre, track or boot moving through standing water throws muddy spray out to both sides and ahead (a bow wave, bigger
// the faster and deeper), flicks a little mud and sends rings across the water. It is only drawn: the puddles themselves
// don't change, so they stay the same on every device; the Graphics setting picks how many drops the spray has (splashN)
// standing water at x,z: its surface and depth (deepest of five points a step apart), or null when dry
const spAt={y:0,d:0};
function waterAt(x,z){let d=0,y=0;
  for(let n=0;n<5;n++){const px=x+(n===1?0.2:n===2?-0.2:0),pz=z+(n===3?0.2:n===4?-0.2:0);let w=-1e9,h=0;
    if(px>=-S/2&&px<=S/2&&pz>=-S/2&&pz<=S/2){const k=Math.round((pz+S/2)/CELL)*V+Math.round((px+S/2)/CELL);w=Wt[k];h=H[k]}
    else if(FD){const i=Math.round((px-FX0)/FC),j=Math.round((pz-FZ0)/FC);if(i>=0&&j>=0&&i<=FNX&&j<=FNZ&&tileOf(Math.min(i,FNX-1),Math.min(j,FNZ-1))>=0){const v=j*FV+i;w=FW[v];h=FH0[v]+FD[v]}}
    if(w>-1e8&&w-h>d){d=w-h;y=w}}
  if(d<0.004)return null;spAt.y=y;spAt.d=d;return spAt}
let spN=0,spPts=null,spP,spV,spLife,spAge,spSz,spHead=0,spAcc=0,splashLvl=0;
const spMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uScale:{value:400},uCol:{value:new THREE.Color(0x5c4630)}},
  vertexShader:'attribute float aA;attribute float aS;varying float vA;uniform float uScale;\nvoid main(){vA=aA;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=max(1.5,aS*uScale/max(0.1,-mv.z));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;uniform vec3 uCol;\nvoid main(){vec2 d=gl_PointCoord-0.5;float r=dot(d,d)*4.0;if(r>1.0)discard;float gl=smoothstep(0.22,0.0,length(d-vec2(-0.14,-0.14)));gl_FragColor=vec4(uCol*(1.2-0.5*r)+vec3(0.55*gl),vA);}'});
// n drops in the spray (from GFX)
function splashGfx(n){if(spPts){scene.remove(spPts);spPts.geometry.dispose()}spN=n;const g=new THREE.BufferGeometry();
  spP=new Float32Array(n*3);spV=new Float32Array(n*3);spLife=new Float32Array(n);spAge=new Float32Array(n).fill(1e9);spSz=new Float32Array(n);
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(n),1));g.setAttribute('aS',new THREE.BufferAttribute(new Float32Array(n),1));
  g.setDrawRange(0,0);spPts=new THREE.Points(g,spMat);spPts.frustumCulled=false;spPts.renderOrder=2;scene.add(spPts);spHead=0}
function spDrop(x,y,z,vx,vy,vz,sz){if(!spN)return;const i=spHead;spHead=(spHead+1)%spN;
  spP[i*3]=x;spP[i*3+1]=y;spP[i*3+2]=z;spV[i*3]=vx;spV[i*3+1]=vy;spV[i*3+2]=vz;spAge[i]=0;spLife[i]=1.6;spSz[i]=sz}
// rings on the water: flat circles that spread and fade
const RG_N=48,rgMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.45,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
const rgInst=new THREE.InstancedMesh(new THREE.RingGeometry(0.86,1,28).rotateX(-Math.PI/2),rgMat,RG_N),rgX=new Float32Array(RG_N),rgY=new Float32Array(RG_N),rgZ=new Float32Array(RG_N),rgAge=new Float32Array(RG_N).fill(1e9),rgS=new Float32Array(RG_N);
rgInst.count=0;rgInst.frustumCulled=false;rgInst.renderOrder=1;for(let i=0;i<RG_N;i++)rgInst.setColorAt(i,new THREE.Color(0,0,0));scene.add(rgInst);
let rgHead=0;
function spRing(x,y,z,s){const i=rgHead;rgHead=(rgHead+1)%RG_N;rgX[i]=x;rgY[i]=y+0.012;rgZ[i]=z;rgAge[i]=0;rgS[i]=s}
// a print of half width hw moving at v (m/s, + forward along yaw) through x,z this frame; k scales it (1 a truck tyre)
function splashMud(x,z,yaw,v,hw,k,dt){const w=waterAt(x,z);if(!w)return;const sp=Math.abs(v);if(sp<0.25)return;
  const I=Math.min(1,sp/3.5)*ss(0.004,0.07,w.d)*k,fx=Math.sin(yaw)*Math.sign(v),fz=Math.cos(yaw)*Math.sign(v),px=Math.cos(yaw),pz=-Math.sin(yaw),y=w.y;
  const cd=Math.hypot(x-camera.position.x,z-camera.position.z);splashLvl=Math.max(splashLvl,I*Math.min(1,12/(cd+4)));
  // drops: a fan out of each side, thrown up and forward
  spAcc+=spN*0.3*I*dt;
  while(spAcc>=1){spAcc--;const sd=Math.random()<0.5?-1:1,out=(0.8+Math.random()*2.2)*(0.4+sp*0.3),fw=sp*(0.3+Math.random()*0.6),up=(1.2+Math.random()*3)*(0.4+0.6*Math.min(1,sp/3));
    spDrop(x+px*sd*hw+fx*0.25,y+0.03,z+pz*sd*hw+fz*0.25,px*sd*out+fx*fw+(Math.random()-0.5)*0.5,up,pz*sd*out+fz*fw+(Math.random()-0.5)*0.5,(0.04+Math.random()*0.08)*(0.5+0.5*k))}
  // a ring every so often, and now and then a lump of mud with the water
  if(Math.random()<dt*7*Math.min(1,I*3))spRing(x+fx*0.3,y,z+fz*0.3,0.3+0.6*I+hw*0.6);
  if(I>0.25)flingMud(x+px*hw,y+0.05,z+pz*hw,yaw+(v<0?0:Math.PI),1+sp*0.3,3*I,dt)}
// landing in a puddle at height y (not on a block over it): a ring of drops all round and a ring on the water
function splashBurst(x,y,z,k){const w=waterAt(x,z);if(!w||y>w.y+0.3)return;const I=ss(0.004,0.06,w.d)*k;if(I<0.05)return;
  for(let n=Math.round(spN*0.12*I);n>0;n--){const a=Math.random()*6.283,o=0.6+Math.random()*1.4;spDrop(x+Math.cos(a)*0.15,w.y+0.03,z+Math.sin(a)*0.15,Math.cos(a)*o,1.2+Math.random()*2.2,Math.sin(a)*o,0.02+Math.random()*0.03)}
  spRing(x,w.y,z,0.9);splashLvl=Math.max(splashLvl,I)}
function splashTick(dt){
  splashLvl*=Math.exp(-dt*5);
  if(spPts){const g=spPts.geometry,P=g.attributes.position.array,A=g.attributes.aA.array,Sz=g.attributes.aS.array;let n=0;
    for(let i=0;i<spN;i++){if(spAge[i]>=spLife[i])continue;spAge[i]+=dt;spV[i*3+1]-=9.8*dt;for(let a=0;a<3;a++)spP[i*3+a]+=spV[i*3+a]*dt;
      if(spV[i*3+1]<0&&spP[i*3+1]<hAt(spP[i*3],spP[i*3+2])+0.01){spAge[i]=1e9;continue}
      P[n*3]=spP[i*3];P[n*3+1]=spP[i*3+1];P[n*3+2]=spP[i*3+2];A[n]=0.85*(1-spAge[i]/spLife[i]);Sz[n]=spSz[i];n++}
    g.setDrawRange(0,n);if(n){g.attributes.position.needsUpdate=true;g.attributes.aA.needsUpdate=true;g.attributes.aS.needsUpdate=true}
    spMat.uniforms.uScale.value=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360))}
  let c=0;const o=mfO,col=new THREE.Color();
  for(let i=0;i<RG_N;i++){if(rgAge[i]>=1.3)continue;rgAge[i]+=dt;const t=rgAge[i]/1.3;if(t>=1)continue;
    o.position.set(rgX[i],rgY[i],rgZ[i]);o.rotation.set(0,0,0);o.scale.setScalar(rgS[i]*(0.25+0.75*Math.sqrt(t)));o.updateMatrix();rgInst.setMatrixAt(c,o.matrix);
    const b=(1-t)*(1-t);rgInst.setColorAt(c,col.setRGB(b,b,b));c++}
  rgInst.count=c;if(c){rgInst.instanceMatrix.needsUpdate=true;rgInst.instanceColor.needsUpdate=true}}

// every frame: tiles that changed, puddles, flung mud, splashes
function mudTick(dt){for(const t of mTiles)if(t.dirty)mtDraw(t);mtWaterTick(dt);mudFlyTick(dt);splashTick(dt)}
