// Corley's Island: paved lots and slabs, and rows of parking stripes, as a list the map editor changes (editpave.js:
// pick a lot to move, resize, turn, resurface or delete it, lay new ones, drag stripe rows along the paving).
// A lot (PAVES) is {x, z (its middle), w (across, its own u axis), d (along v), r (yaw, as walkPad), s (its surface, a
// library id in PAVE_SURF), l (how far its top stands above the ground)}; it lies on the ground (baseHeight, read live
// and rebuilt by edRefresh: paveEdRefresh), with an edge down into the soil, and is walked on as a pad (tag 'pave').
// A stripe row (STRIPES) is {a: [x, z], b: [x, z] (the row's base line, where the stalls' lines start), w (stall width),
// L (stall depth), an (the lines' angle to the row, degrees: 90 straight in, 60 or 45 angled toward b), sd (the side the
// stalls lie on: 1 left of a to b looking down with z south, -1 the other, 2 both: back to back)}; the lines are 4 in
// wide in worn white paint (wornPaint), on top of whatever paving lies under them.
// The game's own lots (the General Store's, the garden centre's pad, the Overlook's and the marina's car park) start
// the lists (paveDefaults); a map that has changed them keeps its own lists (mapPaves, mapStripes in terrain.js).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const PAVE_SURF=[['asphalt','Asphalt'],['concrete_broom','Broom concrete'],['concrete','Poured concrete'],['concrete_old','Old concrete'],['aggregate','Exposed aggregate'],
  ['pavers','Concrete pavers'],['herringbone','Brick pavers'],['cobble','Cobblestone'],['flagstone','Flagstone'],['gravel','Crushed gravel']];
const PAVES=[],STRIPES=[],PAVE={grp:new THREE.Group(),paint:null,box:null};scene.add(PAVE.grp);
const PAVE_LINE=0.1;
function paveDefaults(){const fz=SHOP.fz;
  return {p:[{x:-5,z:(724.5+fz-3.8)/2,w:45,d:fz-3.8-724.5,r:0,s:'asphalt',l:0.04},{x:-21.3,z:fz+5.2,w:12.2,d:18,r:0,s:'concrete_broom',l:0.07},
      {x:6,z:939,w:44,d:16,r:0,s:'asphalt',l:0.045},{x:94.5,z:597,w:73,d:30,r:0,s:'asphalt',l:0.04}],
    s:[{a:[-25.4,fz-4.6],b:[-6.2,fz-4.6],w:3.2,L:5.8,an:90,sd:-1},{a:[6.6,fz-4.6],b:[13,fz-4.6],w:3.2,L:5.8,an:90,sd:-1},
      {a:[-13,946.6],b:[23.4,946.6],w:2.8,L:5,an:90,sd:-1},{a:[60.5,583],b:[126.5,583],w:3,L:5.5,an:90,sd:1},{a:[60.5,611],b:[126.5,611],w:3,L:5.5,an:90,sd:-1}]}}
const paveSurfOk=s=>PAVE_SURF.some(q=>q[0]===s);
// a lot's corner or any spot of it: u across, v along, from its middle
const paveXZ=(p,u,v)=>{const c=Math.cos(p.r),s=Math.sin(p.r);return [p.x+u*c+v*s,p.z-u*s+v*c]};
const paveUV=(p,x,z)=>{const c=Math.cos(p.r),s=Math.sin(p.r),dx=x-p.x,dz=z-p.z;return [dx*c-dz*s,dx*s+dz*c]};
function paveIn(p,x,z,m){const [u,v]=paveUV(p,x,z);m=m||0;return Math.abs(u)<=p.w/2+m&&Math.abs(v)<=p.d/2+m}
// the lot at a spot (the last laid on top), and how far paving stands above the ground there
function paveAt(x,z){for(let i=PAVES.length-1;i>=0;i--)if(paveIn(PAVES[i],x,z))return PAVES[i];return null}
const paveHas=(x,z)=>!!paveAt(x,z);
function paveLift(x,z){let l=-1;for(const p of PAVES)if(paveIn(p,x,z))l=Math.max(l,p.l);return l}
// the area a lot or a row reaches (x0, x1, z0, z1)
function paveBox(p){const ex=Math.abs(Math.cos(p.r))*p.w/2+Math.abs(Math.sin(p.r))*p.d/2,ez=Math.abs(Math.sin(p.r))*p.w/2+Math.abs(Math.cos(p.r))*p.d/2;return [p.x-ex-0.5,p.x+ex+0.5,p.z-ez-0.5,p.z+ez+0.5]}
function stripeLines(S){const dx=S.b[0]-S.a[0],dz=S.b[1]-S.a[1],len=Math.hypot(dx,dz);if(len<0.5)return [];const ux=dx/len,uz=dz/len,an=S.an*Math.PI/180,sn=Math.sin(an),cs=Math.cos(an),
    sp=S.w/sn,k=Math.max(1,Math.floor(len/sp+0.02)),out=[];
  for(const sd of S.sd===2?[1,-1]:[S.sd]){const nx=-uz*sd,nz=ux*sd,lx=ux*cs+nx*sn,lz=uz*cs+nz*sn,ll=S.L/sn;
    for(let i=0;i<=k;i++){const x=S.a[0]+ux*sp*i,z=S.a[1]+uz*sp*i;out.push([x,z,x+lx*ll,z+lz*ll])}}
  return out}
function stripeBox(S){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of [[...S.a,...S.b],...stripeLines(S)]){x0=Math.min(x0,q[0],q[2]);x1=Math.max(x1,q[0],q[2]);z0=Math.min(z0,q[1],q[3]);z1=Math.max(z1,q[1],q[3])}return [x0-0.5,x1+0.5,z0-0.5,z1+0.5]}
// ---------- drawing ----------
// a lot: its top draped on the ground at about 1 m, and an edge down into the soil all round
function paveSheet(K,mat,p){const nu=Math.max(1,Math.ceil(p.w)),nv=Math.max(1,Math.ceil(p.d)),P=[];
  const pt=(i,j)=>{const [x,z]=paveXZ(p,-p.w/2+p.w*i/nu,-p.d/2+p.d*j/nv);return [x,baseHeight(x,z)+p.l,z]};
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);P.push(...a,...d,...b,...b,...d,...c)}
  const edge=(L)=>{for(let k=0;k<L.length-1;k++){const a=L[k],b=L[k+1],a0=[a[0],a[1]-p.l-0.12,a[2]],b0=[b[0],b[1]-p.l-0.12,b[2]];P.push(...a,...b,...a0,...b,...b0,...a0,...a,...a0,...b,...b,...a0,...b0)}};
  const side=(f)=>{const L=[];for(let k=0;k<=f.n;k++)L.push(f.q(k));edge(L)};
  side({n:nu,q:k=>pt(k,0)});side({n:nv,q:k=>pt(nu,k)});side({n:nu,q:k=>pt(nu-k,nv)});side({n:nv,q:k=>pt(0,nv-k)});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));K.put(mat,g)}
// a stripe: a 4 in strip on the paving, in 1 m steps so it follows the ground
function paveLine(P,x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0);if(L<0.05)return;const ux=(x1-x0)/L,uz=(z1-z0)/L,hx=-uz*PAVE_LINE/2,hz=ux*PAVE_LINE/2,n=Math.max(1,Math.ceil(L));
  const y=(x,z)=>baseHeight(x,z)+Math.max(paveLift(x,z),typeof rsAt==='function'?rsAt(x,z):0,0.02)+0.012;
  for(let k=0;k<n;k++){const xa=x0+ux*L*k/n,za=z0+uz*L*k/n,xb=x0+ux*L*(k+1)/n,zb=z0+uz*L*(k+1)/n,ya=y(xa,za),yb=y(xb,zb);
    P.push(xa+hx,ya,za+hz, xb+hx,yb,zb+hz, xa-hx,ya,za-hz, xb+hx,yb,zb+hz, xb-hx,yb,zb-hz, xa-hx,ya,za-hz)}}
function paveBuild(){for(const m of [...PAVE.grp.children]){PAVE.grp.remove(m);m.geometry.dispose()}walkPadsDrop('pave');
  const K=shopKit();for(const p of PAVES){paveSheet(K,shopLib(paveSurfOk(p.s)?p.s:'asphalt'),p);walkPad(p.x,p.z,p.w/2,p.d/2,p.r,0,{l:p.l,tag:'pave'})}
  K.add(PAVE.grp);
  if(STRIPES.length){if(!PAVE.paint)PAVE.paint=wornPaint(0xe9e7e0,0.3);const P=[];for(const S of STRIPES)for(const q of stripeLines(S))paveLine(P,...q);
    if(P.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));g.computeVertexNormals();
      const m=new THREE.Mesh(g,PAVE.paint);m.receiveShadow=true;m.renderOrder=2;PAVE.grp.add(m)}}
  let b=null;for(const q of [...PAVES.map(paveBox),...STRIPES.map(stripeBox)])b=b?[Math.min(b[0],q[0]),Math.max(b[1],q[1]),Math.min(b[2],q[2]),Math.max(b[3],q[3])]:q;PAVE.box=b}
// the ground changed under the paving (the map editor): lay it afresh on the new ground
function paveEdRefresh(x0,x1,z0,z1){const b=PAVE.box;if(b&&x1>b[0]&&x0<b[1]&&z1>b[2]&&z0<b[3])paveBuild()}
// at load: the map's own lists, else the game's
{const d=paveDefaults(),ok=p=>p&&[p.x,p.z,p.w,p.d,p.r,p.l].every(isFinite);
  PAVES.push(...(mapPaves||d.p).filter(ok).map(p=>Object.assign({},p,{s:paveSurfOk(p.s)?p.s:'asphalt'})));
  STRIPES.push(...(mapStripes||d.s).map(S=>Object.assign({},S,{a:S.a.slice(),b:S.b.slice()})));
  if(mapPaves)mapPaves=PAVES;if(mapStripes)mapStripes=STRIPES;paveBuild()}
