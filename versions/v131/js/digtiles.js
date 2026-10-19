// Corley's Island: dig tiles, phase 2 (docs/dig-plans.html). The dig grid stays one block of memory for speed; this
// lifts any of its tiles' ground out into a store of its own and puts it back: the dug height (as a change from the
// original grade, so map edits under it still count), dumped-dirt colour, packing, puddles and wet spoil, the wettest
// it got, and editor-painted depth. Shapes, grass, paint and the drawn colours are not kept: they come from the map and
// from what is kept. Neighbouring tiles share an edge row of points; a tile put back never overwrites an edge that a
// neighbour still in the grid holds, so edges stay seamless. Ruts in the mud tiles (mud.js) become real dug ground when
// a tile takes that ground over.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// what a tile keeps, per grid point: the array, values per point, and its untouched value (H is kept as H - H0)
const TILE_FIELDS=[{id:'h',a:H,n:1,blank:0},{id:'c',a:spoilC,n:3,blank:0},{id:'p',a:comp,n:1,blank:0},{id:'w',a:Wt,n:1,blank:-1e9},
  {id:'m',a:mudA,n:1,blank:0},{id:'s',a:soakMax,n:1,blank:0},{id:'d',a:paintD,n:1,blank:0}];
// tiles lifted out of the grid, by 'ti,tj'
const tileStore=new Map();
const tileKey=t=>t.ti+','+t.tj;
// tile t's points in the grid, edges included: [i0, i1, j0, j1]
function tileRange(t){return [t.i0,t.i1,t.j0,t.j1]}
// tile t's ground as plain arrays (row by row over its points), or null if nothing on it differs from untouched ground
function tileGrab(t){const [i0,i1,j0,j1]=tileRange(t),w=i1-i0+1,np=w*(j1-j0+1),out={ti:t.ti,tj:t.tj,w};let any=false;
  for(const f of TILE_FIELDS){const o=new Float32Array(np*f.n);let q=0;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i;
      if(f.id==='h'){const d=H[k]-H0[k];o[q++]=d;if(d)any=true}
      else for(let c=0;c<f.n;c++){const v=f.a[k*f.n+c];o[q++]=v;if(v!==f.blank)any=true}}
    out[f.id]=o}
  return any?out:null}
// which of tile t's edges a neighbour in the grid holds (and so are left alone when t is put back): [west, east, north, south]
function tileHeldEdges(t){const a=t.ti-DIG_TILES[0].ti,b=t.tj-DIG_TILES[0].tj;return [a>0,a<TPG-1,b>0,b<TPG-1]}
// write tile t's points from a grab (or untouched ground for null), skipping held edges, and redraw them
function tilePut(t,g,held){const [i0,i1,j0,j1]=tileRange(t),w=i1-i0+1,[hw,he,hn,hs]=held||[false,false,false,false];
  let a0=N+1,a1=-1,b0=N+1,b1=-1,wet=false;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    if(hw&&i===i0||he&&i===i1||hn&&j===j0||hs&&j===j1)continue;
    const k=j*V+i,q=(j-j0)*w+(i-i0);
    for(const f of TILE_FIELDS)for(let c=0;c<f.n;c++){const v=g?g[f.id][q*f.n+c]:f.blank;
      if(f.id==='h')H[k]=H0[k]+v;else f.a[k*f.n+c]=v}
    if(H[k]!==H0[k]){a0=Math.min(a0,i);a1=Math.max(a1,i);b0=Math.min(b0,j);b1=Math.max(b1,j)}
    if(Wt[k]>-1e8)wet=true}
  if(a1>=0)growDug(a0,a1,b0,b1);
  if(wet)waterAny=waterSeen=true;
  touch(Math.max(0,i0-1),Math.min(N,i1+1),Math.max(0,j0-1),Math.min(N,j1+1));st.dirty=true}
// lift tile t out of the grid into the store, leaving untouched ground; and put a stored tile back (or untouched
// ground when none is stored)
function tileLift(t){const g=tileGrab(t);if(g)tileStore.set(tileKey(t),g);else tileStore.delete(tileKey(t));tilePut(t,null,tileHeldEdges(t));return g}
function tileRestore(t){tilePut(t,tileStore.get(tileKey(t))||null,tileHeldEdges(t));tileStore.delete(tileKey(t))}
// when tile t takes over ground the mud tiles rutted (mud.js), their ruts, puddles, churned mud and how wet they got
// carry into the grid: each grid point reads the fine grid around it. The fine grid is left as it was
function tileAdoptRuts(t){if(!FD)return 0;const [i0,i1,j0,j1]=tileRange(t);let n=0,a0=N+1,a1=-1,b0=N+1,b1=-1;
  const at=(A,fx,fz,blank)=>{const i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;if(i<0||j<0||i>=FNX||j>=FNZ)return blank;
    const p=j*FV+i;return A[p]*(1-u)*(1-v)+A[p+1]*u*(1-v)+A[p+FV]*(1-u)*v+A[p+FV+1]*u*v};
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=gX(i),z=gZ(j),fx=(x-FX0)/FC,fz=(z-FZ0)/FC,ci=Math.floor(fx),cj=Math.floor(fz);
    if(tileOf(Math.min(ci,FNX-1),Math.min(cj,FNZ-1))<0)continue;
    const k=j*V+i,d=at(FD,fx,fz,0);
    if(Math.abs(d)>1e-4&&H[k]===H0[k]){H[k]=H0[k]+d;n++;a0=Math.min(a0,i);a1=Math.max(a1,i);b0=Math.min(b0,j);b1=Math.max(b1,j)}
    const ri=Math.round(fx),rj=Math.round(fz),p=rj*FV+ri;
    if(FW[p]>-1e8&&Wt[k]<=-1e8){Wt[k]=FW[p];waterAny=waterSeen=true}
    mudA[k]=Math.max(mudA[k],FM[p]/255);soakMax[k]=Math.max(soakMax[k],FWX[p]/255)}
  if(a1>=0)growDug(a0,a1,b0,b1);
  touch(Math.max(0,i0-1),Math.min(N,i1+1),Math.max(0,j0-1),Math.min(N,j1+1));st.dirty=true;return n}
