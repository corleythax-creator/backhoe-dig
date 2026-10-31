// Corley's Island: the lawns. The mowable grass is split into patches, each with its own share mowed: the tall grass
// patch (mower.js), and the field grass (scenery.js) cut into pieces where the roads, yards, paint, walls, steep banks
// and the beach break it up, so the inner mesa, the west lawn and the east lawn come out on their own and a road laid in
// the map editor splits a patch in two. A small gauge shows the patch you are on (on foot or mowing), and the site map
// labels every patch with its share and lists them in its side panel.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the patch map: 1 m cells over the field grass grid (two of its 0.5 m cells each way); -1 not a patch
const LWP_C=1,LWP_NX=CR_NX*CR_C/LWP_C,LWP_NZ=CR_NZ*CR_C/LWP_C,LWP_MIN=40;
const lwp={lab:new Int16Array(LWP_NX*LWP_NZ).fill(-1),list:[],stale:true,t:0,cur:null,uiT:0};
const lwpInTall=(x,z)=>x>LAWN_X0&&x<LAWN_X0+LAWN_NX*LAWN_GS&&z>LAWN_Z0&&z<LAWN_Z0+LAWN_NZ*LAWN_GS;
// grass that counts toward a patch: not road, yard, painted, wall, beach, steep or the tall grass
function lwpGrass(x,z){const b=baseHeight(x,z);if(b<-4||lwpInTall(x,z))return false;
  if(roadAmt(x,z)>=0.15||yardAt(x,z)>=0.3||paintAt(x,z)||wallAt(x,z))return false;
  const e=0.6;return Math.hypot(baseHeight(x+e,z)-baseHeight(x-e,z),baseHeight(x,z+e)-baseHeight(x,z-e))/(2*e)<0.45}
// a patch's name: the one centred on the dig is the mesa top, the others by compass from there to their label
function lwpName(p,used){let n;
  const dx=p.lx,dz=p.lz-12;
  n=Math.hypot(p.cx,p.cz-12)<12?'Mesa top lawn':(Math.abs(dx)>Math.abs(dz)?(dx<0?'West':'East'):(dz<0?'North':'South'))+' lawn';
  let m=n,k=2;while(used.has(m))m=`${n} ${k++}`;used.add(m);return m}
// split the grass into patches (again after the map editor changes the ground)
function lwpBuild(){const W=LWP_NX,Hn=LWP_NZ,g=new Uint8Array(W*Hn),lab=lwp.lab;lab.fill(-1);
  for(let j=0;j<Hn;j++)for(let i=0;i<W;i++)g[j*W+i]=lwpGrass(CR_X0+(i+0.5)*LWP_C,CR_Z0+(j+0.5)*LWP_C)?1:0;
  const found=[],tmp=new Int32Array(W*Hn).fill(-1);
  for(let s=0;s<W*Hn;s++){if(!g[s]||tmp[s]>=0)continue;const id=found.length,cells=[],st=[s];tmp[s]=id;
    while(st.length){const k=st.pop();cells.push(k);const i=k%W,j=(k/W)|0;
      for(const kk of [i+1<W?k+1:-1,i>0?k-1:-1,j+1<Hn?k+W:-1,j>0?k-W:-1])if(kk>=0&&g[kk]&&tmp[kk]<0){tmp[kk]=id;st.push(kk)}}
    found.push(cells)}
  const used=new Set(['Tall grass']),list=[{name:'Tall grass',tall:true,cx:LAWN_X0+LAWN_NX*LAWN_GS/2,cz:LAWN_Z0+LAWN_NZ*LAWN_GS/2,pct:0}];
  for(const cells of found){if(cells.length*LWP_C*LWP_C<LWP_MIN)continue;const id=list.length;
    let sx=0,sz=0,x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    for(const k of cells){lab[k]=id;const x=CR_X0+(k%W+0.5)*LWP_C,z=CR_Z0+(((k/W)|0)+0.5)*LWP_C;sx+=x;sz+=z;x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z)}
    const p={cx:sx/cells.length,cz:sz/cells.length,x0,x1,z0,z1,area:cells.length*LWP_C*LWP_C,cells,cuts:[],pct:0};
    list.push(p)}
  // the label goes on the cell deepest inside each patch (farthest from its edge; nearest the middle on a tie), so it
  // sits on the patch's own grass, clear of the roads and the tall grass
  const dist=new Uint16Array(W*Hn),q=[];
  for(let k=0;k<W*Hn;k++){if(lab[k]<1)continue;const i=k%W,j=(k/W)|0;
    if(i===0||j===0||i===W-1||j===Hn-1||lab[k-1]!==lab[k]||lab[k+1]!==lab[k]||lab[k-W]!==lab[k]||lab[k+W]!==lab[k]){dist[k]=1;q.push(k)}}
  for(let h=0;h<q.length;h++){const k=q[h],i=k%W,j=(k/W)|0;
    for(const kk of [i+1<W?k+1:-1,i>0?k-1:-1,j+1<Hn?k+W:-1,j>0?k-W:-1])if(kk>=0&&lab[kk]===lab[k]&&!dist[kk]){dist[kk]=dist[k]+1;q.push(kk)}}
  for(let q2=1;q2<list.length;q2++){const p=list[q2];let bd=-1,bc=1e18;
    for(const k of p.cells){const x=CR_X0+(k%W+0.5)*LWP_C,z=CR_Z0+(((k/W)|0)+0.5)*LWP_C,c=(x-p.cx)**2+(z-p.cz)**2;
      if(dist[k]>bd||dist[k]===bd&&c<bc){bd=dist[k];bc=c;p.lx=x;p.lz=z}}}
  for(let q=1;q<list.length;q++)list[q].name=lwpName(list[q],used);
  list[0].lx=list[0].cx;list[0].lz=list[0].cz;
  // each patch's field grass cells that have grass standing in them (only those can be cut)
  for(let j=0;j<CR_NZ;j++)for(let i=0;i<CR_NX;i++){const k=j*CR_NX+i;if(tCellS[k]===tCellS[k+1])continue;
    const id=lab[((j*CR_C/LWP_C)|0)*W+((i*CR_C/LWP_C)|0)];if(id<1)continue;
    let v=false;for(let q=tCellS[k];q<tCellS[k+1];q++)if(tVis[tCellL[q]]){v=true;break}if(v)list[id].cuts.push(k)}
  // patches with too little grass standing in them are left out, and the map relabelled with the ones kept
  lwp.list=list.filter((p,q)=>q===0||p.cuts.length>=20);lab.fill(-1);
  lwp.list.forEach((p,q)=>{if(q)for(const k of p.cells)lab[k]=q;delete p.cells});
  lwp.stale=false;lwpCount()}
// each patch's share mowed: the tall grass's own count, and for the field grass the cells cut and not yet half grown back
function lwpCount(){const T=TU.lawnWait+TU.lawnGrow*0.5;
  for(const p of lwp.list){if(p.tall){p.pct=lawnPct();continue}let c=0;for(const k of p.cuts)if(fcT[k]>-1e8&&lawn.t-fcT[k]<T)c++;p.pct=p.cuts.length?c/p.cuts.length:0}}
// the patch at x,z, or null
function lawnsAt(x,z){if(lwp.stale)lwpBuild();if(lwpInTall(x,z))return lwp.list[0];
  const i=Math.floor((x-CR_X0)/LWP_C),j=Math.floor((z-CR_Z0)/LWP_C);if(i<0||j<0||i>=LWP_NX||j>=LWP_NZ)return null;
  const id=lwp.lab[j*LWP_NX+i];return id>0?lwp.list[id]:null}
function lawnsStale(){lwp.stale=true}
// a few times a second: the counts, the gauge for the patch you are on, and the site map's list while it is open
function lawnsTick(dt){if((lwp.t-=dt)>0)return;lwp.t=0.4;if(lwp.stale)lwpBuild();lwpCount();
  const on=mode==='walk'&&!wk.inside?lawnsAt(wk.x,wk.z):mode==='mow'?lawnsAt(mw.x,mw.z):null,el=$('#lawnChip');
  if(el.hidden!==!on)el.hidden=!on;
  if(on){const p=Math.floor(on.pct*100);if(lwp.cur!==on){lwp.cur=on;$('#lawnChipName').textContent=on.name}
    $('#lawnChipVal').textContent=p+'%';$('#lawnChipBar').style.width=p+'%';el.classList.toggle('done',on.pct>=0.97)}else lwp.cur=null;
  if(!$('#bigmap').hidden)lawnsList()}
// the site map's Lawns list: name, share and a meter per patch; tap one to show it
function lawnsList(){const box=$('#lawnList');if(box.children.length!==lwp.list.length){box.textContent='';
    for(const p of lwp.list){const b=document.createElement('button');b.className='lwrow';b.innerHTML='<span></span><b></b><i><i></i></i>';
      b.onclick=()=>mapGo(p.lx,p.lz,p.tall?40:Math.max(40,Math.max(p.x1-p.x0,p.z1-p.z0)*1.3));box.appendChild(b)}}
  lwp.list.forEach((p,q)=>{const b=box.children[q],v=Math.floor(p.pct*100);b.children[0].textContent=p.name;b.children[1].textContent=v+'%';b.children[2].firstChild.style.width=v+'%'})}
// on the site map (drawMap, maps.js): each patch's name and share at its label spot, once zoomed in enough to read
function lawnsDraw(g,X,Y,sc,dpr){if(sc<1.6*dpr)return;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  for(const p of lwp.list){const v=Math.floor(p.pct*100),x=X(p.lx),y=Y(p.lz),fs=Math.round(Math.max(13,Math.min(20,8+sc/dpr*1.6))*dpr);
    g.font=`700 ${fs}px "Barlow Condensed", sans-serif`;const t=`${p.name.toUpperCase()} ${v}%`,w=g.measureText(t).width;
    g.fillStyle='rgba(15,18,22,.78)';g.beginPath();g.roundRect?g.roundRect(x-w/2-8*dpr,y-fs*0.75,w+16*dpr,fs*1.5+5*dpr,6*dpr):g.rect(x-w/2-8*dpr,y-fs*0.75,w+16*dpr,fs*1.5+5*dpr);g.fill();
    g.fillStyle=p.pct>=0.97?'#4ade80':'#eef2f5';g.fillText(t,x,y);
    const bw=w,by=y+fs*0.55;g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x-bw/2,by,bw,3*dpr);g.fillStyle=p.pct>=0.97?'#4ade80':'#9bd46a';g.fillRect(x-bw/2,by,bw*p.pct,3*dpr)}}
