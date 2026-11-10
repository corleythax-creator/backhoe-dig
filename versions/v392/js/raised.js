// Corley's Island: raised and sunk paint (the Paint brush's Raise / inset, ED_R in terrain.js). A painted cell can stand
// up to 3 in proud of the ground (a brick patio, a stone path, a slab) or sit up to 3 in down in it (a gravel bed, a
// sunk paver walk). The ground shader leaves those cells out (matGlsl, materials.js) and this draws each one at its
// height in the same ground material, with a side wall wherever it meets lower ground: in the cell's own material
// where it stands up (bricks show their edge), in the neighbour's (soil, or its paint) down the side of a sunk one.
// matA tells the shader which is which: 2 a top, 3 to 6 a wall facing +x, -x, +z, -z, whose texture runs along the wall
// and up it. Built in 8 m chunks; rebuilt by edRefresh (rsEdRefresh) and, in the dig grid, a moment after digging
// moves the ground there (rsDigTouch). Feet and wheels step up and down with it through rsAt (hAt, terrain.js).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const RS={grp:new THREE.Group(),ch:new Map(),CH:16,any:false,dirty:new Set(),t:0};RS.grp.name='raised';scene.add(RS.grp);
// the ground under x, z as the ground meshes draw it
function rsGround(x,z){if(!inDig(x,z))return farGround?farGround(x,z):baseHeight(x,z);
  const fx=Math.max(0,Math.min(N-0.001,gI(x))),fz=Math.max(0,Math.min(N-0.001,gJ(z))),i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*V+i;
  return H[k]*(1-u)*(1-v)+H[k+1]*u*(1-v)+H[k+V]*(1-u)*v+H[k+V+1]*u*v}
// cell q's offset in metres where it is drawn raised or sunk (painted, and in the dig grid only on undug ground), else 0
function rsOff(i,j){if(i<0||j<0||i>=ED_NX||j>=ED_NZ)return 0;const q=j*ED_NX+i,r=ED_R[q];if(!r||!ED_M[q])return 0;
  const x=ED_X0+i*ED_C,z=ED_Z0+j*ED_C;if(inDig(x,z)){const k=Math.round(gJ(z))*V+Math.round(gI(x));if(!(matAA[k]>0.5))return 0}
  return r*RS_Q}
function rsChunk(ci,cj){const key=ci*1000+cj,old=RS.ch.get(key);if(old){RS.grp.remove(old);old.geometry.dispose();RS.ch.delete(key)}
  const P=[],C=[],A=[],D=[],h=ED_C/2,i0=ci*RS.CH,j0=cj*RS.CH,soil=[0.36,0.28,0.21];
  const vtx=(x,y,z,c,a,d)=>{P.push(x,y,z);C.push(c[0],c[1],c[2]);A.push(a);D.push(d)};
  // a wall on the line (xa, za) to (xb, zb), bottoms and tops at each end, facing direction code a (3 +x, 4 -x, 5 +z, 6 -z)
  const wall=(xa,za,xb,zb,ba,ta,bb,tb,a,c,d)=>{const nx=a===3?1:a===4?-1:0,nz=a===5?1:a===6?-1:0,
      p=[[xa,ba,za],[xb,bb,zb],[xa,ta,za],[xb,tb,zb]];
    // normal of (p0,p1,p2) is (p1-p0) x (p2-p0); flip the order when it faces away from n
    const ex=xb-xa,ez=zb-za,f=(ex*nz-ez*nx)>0?0:1,tri=(u,v,w)=>{for(const q of [u,v,w])vtx(q[0],q[1],q[2],c,a,d)};
    if(!f){tri(p[0],p[1],p[2]);tri(p[2],p[1],p[3])}else{tri(p[0],p[2],p[1]);tri(p[2],p[3],p[1])}};
  for(let j=j0;j<j0+RS.CH&&j<ED_NZ;j++)for(let i=i0;i<i0+RS.CH&&i<ED_NX;i++){const o=rsOff(i,j);if(!o)continue;
    const q=j*ED_NX+i,x=ED_X0+i*ED_C,z=ED_Z0+j*ED_C,c=matDef(ED_M[q]).c,x0=x-h,x1=x+h,z0=z-h,z1=z+h;
    const g00=rsGround(x0,z0),g01=rsGround(x0,z1),g10=rsGround(x1,z0),g11=rsGround(x1,z1);
    vtx(x0,g00+o,z0,c,2,0);vtx(x0,g01+o,z1,c,2,0);vtx(x1,g10+o,z0,c,2,0);vtx(x1,g10+o,z0,c,2,0);vtx(x0,g01+o,z1,c,2,0);vtx(x1,g11+o,z1,c,2,0);
    // each side: the edge's ends and ground there, the neighbour, the code of a wall facing out of this cell
    for(const [xa,za,xb,zb,ga,gb,ni,nj,a,back] of [[x1,z0,x1,z1,g10,g11,i+1,j,3,4],[x0,z0,x0,z1,g00,g01,i-1,j,4,3],[x0,z1,x1,z1,g01,g11,i,j+1,5,6],[x0,z0,x1,z0,g00,g10,i,j-1,6,5]]){
      const on=rsOff(ni,nj);if(on===o)continue;
      if(o>on){const lo=on?on:-0.03;wall(xa,za,xb,zb,ga+lo,ga+o,gb+lo,gb+o,a,c,0)}
      // sunk below a neighbour drawn by the ground: that neighbour's side of the hole, in its paint or soil
      else if(!on){const nq=nj*ED_NX+ni,m=nq>=0&&nq<ED_M.length?ED_M[nq]:0,nc=m&&ED_A[nq]>=128?matDef(m).c:soil;wall(xa,za,xb,zb,ga+o,ga+0.004,gb+o,gb+0.004,back,nc,m?0:1)}}}
  if(!P.length)return;const n=P.length/3,g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.setAttribute('matA',new THREE.Float32BufferAttribute(A,1));g.setAttribute('dirt',new THREE.Float32BufferAttribute(D,1));
  g.setAttribute('wetT',new THREE.Float32BufferAttribute(new Float32Array(n).fill(-1e4),1));g.setAttribute('soilD',new THREE.Float32BufferAttribute(new Float32Array(n),1));
  g.setAttribute('mudW',new THREE.Float32BufferAttribute(new Float32Array(n),1));g.setAttribute('crk',new THREE.Float32BufferAttribute(new Float32Array(n*2),2));
  g.computeVertexNormals();g.computeBoundingSphere();
  const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;m.castShadow=true;RS.grp.add(m);RS.ch.set(key,m)}
// rebuilds the chunks over x0..x1, z0..z1 (metres) and tells the ground shader which cells are left to them
function rsEdRefresh(x0,x1,z0,z1){matU.tMatR.value.needsUpdate=true;RS.any=ED_R.some(v=>v!==0);
  const c=v=>Math.floor(v/RS.CH),ci0=c(Math.max(0,(x0-ED_X0)/ED_C-1)),ci1=c(Math.min(ED_NX-1,(x1-ED_X0)/ED_C+1)),cj0=c(Math.max(0,(z0-ED_Z0)/ED_C-1)),cj1=c(Math.min(ED_NZ-1,(z1-ED_Z0)/ED_C+1));
  for(let cj=cj0;cj<=cj1;cj++)for(let ci=ci0;ci<=ci1;ci++)rsChunk(ci,cj)}
// digging moved the dig grid between vertices i0..i1, j0..j1: the chunks there follow a moment later
function rsDigTouch(i0,i1,j0,j1){if(!RS.any)return;
  const c=v=>Math.floor(v/RS.CH),ci0=c((gX(i0)-ED_X0)/ED_C-1),ci1=c((gX(i1)-ED_X0)/ED_C+1),cj0=c((gZ(j0)-ED_Z0)/ED_C-1),cj1=c((gZ(j1)-ED_Z0)/ED_C+1);
  for(let cj=cj0;cj<=cj1;cj++)for(let ci=ci0;ci<=ci1;ci++)if(RS.ch.has(ci*1000+cj))RS.dirty.add(ci*1000+cj);
  if(RS.dirty.size&&!RS.t)RS.t=setTimeout(()=>{RS.t=0;for(const k of RS.dirty)rsChunk(Math.floor(k/1000),k%1000);RS.dirty.clear()},300)}
rsEdRefresh(ED_X0,ED_X0+ED_NX*ED_C,ED_Z0,ED_Z0+ED_NZ*ED_C);
