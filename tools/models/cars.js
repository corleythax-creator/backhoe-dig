// Corley's Island: the town's traffic cars (townfolk.js), built from shapes and written out as models/cars.glb by
// tools/build_model.js. Each car's body is one smooth lofted skin: a cross-section (sill, side, shoulder, glass, roof)
// swept along the car from tables of heights and widths, its wheel arches pressed in and its glass, pillars, seams,
// cowl and lower trim picked out as materials on the skin; lamps, grille, bumpers, plates, mirrors, handles, wipers
// and a cabin seen through the glass are parts laid on it; and each wheel is a rounded treaded tyre on a five-spoke
// alloy with a brake disc and calliper.
// The contract with the game, so Blender or bought cars can replace these:
// - one node per car (sedan, hatch, suv, wagon, minivan, pickup, van), in the car's own frame: origin on the ground under
//   its middle, x right, y up, z forward (nose to +z), metres; it holds body (the meshes that don't move) and four
//   wheel nodes (wheel_fl, wheel_fr, wheel_rl, wheel_rr) whose origins are the hubs, turning about x;
// - materials: carpaint (the game gives each car its colour), tint (the glass), gloss (gloss black), plastic (textured
//   black), under (the underside), chrome, lens, redL, amber, plate, seat, mirror, tire, rim, disc, caliper.
// Classic script, no modules.
function buildCars(){
const T=THREE,BGU=T.BufferGeometryUtils,mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),V=(x,y,z)=>new T.Vector3(x,y,z);
const RB=(w,h,d,r,s)=>new T.RoundedBoxGeometry(w,h,d,s||1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||20);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
// a table of [z, value] read with straight lines between, softened over r metres (straight glass, rounded edges)
function lin(K,r){const f=z=>{if(z<=K[0][0])return K[0][1];for(let i=1;i<K.length;i++)if(z<=K[i][0]){const a=K[i-1],b=K[i];return a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0])}return K[K.length-1][1]};
  if(!r)return f;return z=>(f(z-r)+2*f(z-r/2)+3*f(z)+2*f(z+r/2)+f(z+r))/9}
// centripetal Catmull-Rom between p1 and p2
function crs(p0,p1,p2,p3,t){const d=(a,b)=>Math.pow(Math.hypot(b[0]-a[0],b[1]-a[1]),0.5)||1e-4,t1=d(p0,p1),t2=t1+d(p1,p2),t3=t2+d(p2,p3),u=t1+(t2-t1)*t;
  const L=(a,b,ta,tb)=>{const k=(u-ta)/(tb-ta);return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]};
  const A1=L(p0,p1,0,t1),A2=L(p1,p2,t1,t2),A3=L(p2,p3,t2,t3),B1=L(A1,A2,0,t2),B2=L(A2,A3,t1,t3);return L(B1,B2,t1,t2)}
// the subdivisions of each span of the section: bottom, sill corner, lower side, upper side, shoulder ledge, side glass,
// roof edge (the A and C pillars where the glass slopes), roof, hood and deck
const SEG=[2,1,6,6,1,3,2,4],NSEG=SEG.length;

function car(name,S){
  const parts={},put=(part,mat,g,p,r,sc)=>{g=g.index?g.toNonIndexed():g.clone();e.set(...(r||[0,0,0]));q.setFromEuler(e);
      mtx.compose(V(...(p||[0,0,0])),q,V(...(sc||[1,1,1])));g.applyMatrix4(mtx);
      for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
      ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g},
    B='body',L2=S.L/2,z0=S.z0??-L2,z1=L2,zf=L2-S.fo,zr=zf-S.WB,WR=S.WR,WX=S.WX,TW=S.TW,AR=WR+0.075,xin=WX-TW/2-0.05;
  const yb=lin(S.yb,0.05),ybelt=lin(S.belt,0.08),ytop=lin(S.top,S.soft||0.07),hw=lin(S.w,0.12),tg=lin(S.tg,0.1),cr=lin(S.crown||[[z0,0.03],[z1,0.03]],0.1);
  const RND=S.rnd||0.07,sc=z=>{const a=z-(z1-RND),b=(z0+RND)-z;if(a>0)return Math.sqrt(Math.max(0,1-(a/RND)**2));if(b>0)return Math.sqrt(Math.max(0,1-(b/RND)**2));return 1};
  // the section at z: [x, y] at span i, t along it (right half; the left is its mirror)
  function sect(z){const b=yb(z),bl=Math.max(b+0.2,ybelt(z)),tp=Math.max(bl+0.03,ytop(z)),w=hw(z),g=tg(z);
    return [[0,b],[w-0.13,b],[w-0.025,b+0.1],[w,b+(bl-b)*0.55],[w-0.012,bl],[w-0.045,bl+0.012],[w-g,Math.max(bl+0.03,tp-0.06)],[w-g-0.07,tp],[0,tp+cr(z)]]}
  function at(z,i,t){const P=sect(z),g=k=>k<0?[-P[-k][0],P[-k][1]]:k>=P.length?[-P[2*P.length-2-k][0],P[2*P.length-2-k][1]]:P[k];
    let [x,y]=crs(g(i-1),g(i),g(i+1),g(i+2),t);const s=sc(z);if(s<1){const cy=(P[0][1]+P[8][1])/2;x*=s;y=cy+(y-cy)*s}
    // the wheel arches: below the shoulder, inside a circle round each hub, the skin turns in to the wheel well
    let f=0;if(i<4)for(const zc of [zf,zr]){const d=Math.hypot(y-WR,z-zc);f=Math.max(f,ss(AR+0.025,AR,d))}
    if(f>0)x=x+(Math.min(x,xin)-x)*f;return [x,y,z,f]}
  // the stations along the car: even spacing, finer round the arches and ends, and a line at every edge of the glass,
  // pillars and seams so they come out straight
  const zs=[];for(let z=z0;z<=z1+1e-6;z+=0.1)zs.push(z);for(const zc of [zf,zr])for(let z=zc-AR-0.04;z<=zc+AR+0.04;z+=0.04)zs.push(z);
  for(let k=0;k<=5;k++){const a=Math.PI/2*k/5;zs.push(z1-RND+Math.sin(a)*RND,z0+RND-Math.sin(a)*RND)}
  const G=S.glass,brk=[G.ws,G.ws+0.07,G.rf,G.rr,G.dk,G.sf,G.sr,...(G.bp||[]).flatMap(b=>[b-0.045,b+0.045]),...(S.seams||[]).flatMap(s=>[s-0.006,s+0.006]),...(S.extra||[])];
  for(const b of brk)if(b>z0&&b<z1)zs.push(b);zs.sort((a,b)=>a-b);const Z=[];for(const z of zs)if(z>=z0-1e-6&&z<=z1+1e-6&&(!Z.length||z-Z[Z.length-1]>0.004))Z.push(Math.min(z1,Math.max(z0,z)));
  const VS=[];for(let i=0;i<NSEG;i++)for(let k=0;k<SEG[i];k++)VS.push([i,k/SEG[i]]);VS.push([NSEG-1,1]);
  const grid=Z.map(z=>VS.map(([i,t])=>at(z,i,t)));
  // the skin's materials: by span and station (and pressed into the arches)
  const inB=z=>(G.bp||[]).some(b=>Math.abs(z-b)<0.045),seam=z=>(S.seams||[]).some(s=>Math.abs(z-s)<0.006);
  function matOf(z,i,t,y,f){if(f>0.95)return 'under';if(i===0)return 'under';
    if(i===1)return z>zf+AR-0.05||z<zr-AR+0.05||S.cladding?'plastic':'carpaint';
    if(S.cladding&&i===2&&t<0.5)return 'plastic';
    if((i===2||i===3)&&seam(z)&&y>S.seamY0&&y<S.seamY1)return 'gloss';
    if(i===4&&z>G.sr&&z<G.sf)return 'gloss';
    if(i===5&&z>G.sr&&z<G.sf)return inB(z)?'gloss':'tint';
    if(i===6&&z>G.sr&&z<G.sf&&inB(z))return 'gloss';
    if(i===7&&z>G.ws&&z<G.ws+0.07)return 'plastic';
    if(i===7&&t>0.08&&(z>G.rf&&z<G.ws||z>G.dk&&z<G.rr))return 'tint';
    return 'carpaint'}
  const tris={};for(let a=0;a<Z.length-1;a++)for(let v=0;v<VS.length-1;v++){const p=grid[a][v],q2=grid[a][v+1],r=grid[a+1][v],s=grid[a+1][v+1];
    const [i,t]=VS[v],m=matOf((Z[a]+Z[a+1])/2,i,t+0.5/SEG[i],(p[1]+s[1])/2,(p[3]+q2[3]+r[3]+s[3])/4);(tris[m]=tris[m]||[]).push([p,q2,r],[q2,s,r])}
  for(const [m,list] of Object.entries(tris)){const P=[];for(const sd of [1,-1])for(const [a,b,c] of list){const A=sd>0?[a,b,c]:[a,c,b];for(const p of A)P.push(p[0]*sd,p[1],p[2])}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));
    // smooth normals across the skin, but a crease where the glass meets the paint
    put(B,m,BGU.toCreasedNormals(BGU.mergeVertices(g,1e-5),0.5))}
  // a point on the skin's side at height y (x, the outward normal's x), for laying parts on it
  const sideAt=(z,y)=>{let best=null;for(let i=1;i<5;i++)for(let k=0;k<=12;k++){const p=at(z,i,k/12);if(!best||Math.abs(p[1]-y)<Math.abs(best[1]-y))best=p}return best[0]};
  const S2=s=>[1,-1].map(k=>k*s);

  // ---------- the cabin, seen through the glass: a dark tub to the beltline, dash, wheel, seats and headrests ----------
  const cz0=G.sr+0.1,cz1=G.ws-0.05,bl=ybelt((cz0+cz1)/2),wI=hw((cz0+cz1)/2)-0.09,fl=yb(0)+0.15;
  put(B,'under',RB(wI*2,bl-fl-0.02,cz1-cz0,0.04),[0,(bl+fl)/2-0.02,(cz0+cz1)/2]);
  put(B,'plastic',RB(wI*2-0.02,0.2,0.4,0.06),[0,bl+0.04,cz1-0.22]);put(B,'gloss',new T.TorusGeometry(0.17,0.02,8,24),[-0.37,bl+0.16,cz1-0.48],[-1.15,0,0]);
  // (the seats sit low in the tub, their headrests below the roof lining)
  for(const row of S.seats||[[0.55,2],[-0.35,3]]){const [sz,n]=row,ws=n===2?0.5:wI*2-0.1,hr=Math.min(ytop(sz-0.3)-0.12,fl+1.0),cu=fl+0.32,bh=hr-0.16-cu;
    for(const x of n===2?[-0.37,0.37]:[0]){put(B,'seat',RB(ws,0.16,0.5,0.05,1),[x,cu,sz]);put(B,'seat',RB(ws,bh,0.13,0.05,1),[x,cu+bh/2+0.04,sz-0.28],[-0.16,0,0]);
      for(const hx of n===2?[0]:[-0.4,0,0.4])put(B,'seat',RB(0.24,0.16,0.09,0.04,1),[x+hx,hr-0.08,sz-0.36])}}

  // ---------- the front: grille, headlamps, bumper and its intake, plate ----------
  const F=S.front,fz=z1;
  {const gy=F.grille,gw=F.gw;put(B,'gloss',RB(gw*2,gy[1]-gy[0],0.08,0.03),[0,(gy[0]+gy[1])/2,fz-0.03]);
    for(let y=gy[0]+0.04;y<gy[1]-0.02;y+=0.045)put(B,F.chromeBars?'chrome':'plastic',RB(gw*2-0.06,0.012,0.02,0.005,1),[0,y,fz+0.012]);
    put(B,F.chromeBars?'chrome':'gloss',RB(gw*2+0.04,0.03,0.05,0.012),[0,gy[1]+0.005,fz-0.005]);
    const iy=F.intake;put(B,'plastic',RB(F.iw*2,iy[1]-iy[0],0.06,0.025),[0,(iy[0]+iy[1])/2,fz-0.045]);
    put(B,'plate',RB(0.52,0.12,0.012,0.008,1),[0,(iy[0]+iy[1])/2+0.01,fz+0.02]);
    for(const s of [-1,1]){const [y0,y1]=F.ly,hz=fz-0.09,x0=F.lx[0],x1=Math.min(F.lx[1],sideAt(hz+0.06,(y0+y1)/2)-0.03);
      put(B,'gloss',RB(x1-x0,y1-y0,0.16,0.035),[s*(x0+x1)/2,(y0+y1)/2,hz]);
      put(B,'lens',RB((x1-x0)*0.96,(y1-y0)*0.8,0.04,0.02),[s*(x0+x1)/2,(y0+y1)/2,hz+0.07]);
      for(const k of [0.3,0.7])put(B,'chrome',CY(0.032,0.032,0.03,14),[s*(x0+(x1-x0)*k),(y0+y1)/2,hz+0.07],[Math.PI/2,0,0]);
      put(B,'amber',RB((x1-x0)*0.9,0.018,0.03,0.008,1),[s*(x0+x1)/2,y0+0.01,hz+0.08]);
      // the lamp wraps round the corner onto the side
      const lz=fz-0.12;put(B,'lens',RB(0.03,(y1-y0)*0.7,0.16,0.012),[s*(sideAt(lz,(y0+y1)/2)-0.004),(y0+y1)/2,lz]);
      put(B,'plastic',CY(0.05,0.05,0.03,14),[s*(F.iw-0.06),(iy[0]+iy[1])/2,fz+0.005],[Math.PI/2,0,0])}}

  // ---------- the back: tail lamps wrapping round, a reflector strip, plate and its lamp, exhaust ----------
  const R=S.rear,rz=z0;
  if(R){for(const s of [-1,1]){const [y0,y1]=R.ly,x0=R.lx[0],x1=Math.min(R.lx[1],sideAt(rz+0.03,(y0+y1)/2)-0.025);put(B,'redL',RB(x1-x0,y1-y0,0.07,0.025),[s*(x0+x1)/2,(y0+y1)/2,rz+0.035]);
      put(B,'lens',RB((x1-x0)*0.35,(y1-y0)*0.3,0.075,0.012),[s*(x0+(x1-x0)*0.35),(y0+y1)/2-(y1-y0)*0.2,rz+0.03]);
      const lz=rz+0.12;put(B,'redL',RB(0.03,(y1-y0)*0.8,0.18,0.012),[s*(sideAt(lz,(y0+y1)/2)-0.004),(y0+y1)/2,lz]);
      put(B,'redL',RB(0.12,0.03,0.02,0.008,1),[s*(R.iw-0.08),R.bump[0]+0.04,rz+0.03])}
    put(B,'plastic',RB(R.iw*2,R.bump[1]-R.bump[0],0.06,0.025),[0,(R.bump[0]+R.bump[1])/2,rz+0.05]);
    put(B,'plate',RB(0.52,0.12,0.012,0.008,1),[0,R.plate,rz-0.015]);put(B,'gloss',RB(0.58,0.17,0.02,0.01,1),[0,R.plate,rz-0.005]);
    if(R.badge)put(B,'chrome',RB(0.16,0.05,0.012,0.006,1),[0,R.badge,rz-0.01]);
    for(const s of R.pipes??[1])put(B,'chrome',CY(0.035,0.035,0.12,14),[s*(R.iw-0.22),R.bump[0]-0.02,rz+0.03],[Math.PI/2,0,0])}

  // ---------- the sides: mirrors on their arms, door handles, the wipers, an antenna fin, roof rails ----------
  {const mz=G.ws-0.12,my=ybelt(mz)+0.12;for(const s of [-1,1]){const x=sideAt(mz,my-0.1);
      put(B,'plastic',RB(0.12,0.06,0.1,0.02),[s*(x+0.03),my-0.06,mz]);put(B,'carpaint',RB(0.08,0.13,0.2,0.04),[s*(x+0.12),my,mz-0.02],[0,s*0.15,0]);
      put(B,'mirror',RB(0.012,0.1,0.16,0.03),[s*(x+0.12),my,mz-0.115],[0,s*0.15,0]);put(B,'amber',RB(0.012,0.02,0.1,0.006,1),[s*(x+0.165),my-0.035,mz+0.01],[0,s*0.15,0]);
      for(const hz of S.handles||[]){const hy=ybelt(hz)-0.09;put(B,S.chromeHandles?'chrome':'carpaint',RB(0.03,0.035,0.17,0.014),[s*(sideAt(hz,hy)+0.008),hy,hz])}}
    for(const s of [-1,1]){const y=ytop(G.ws+0.035)+0.02;put(B,'gloss',RB(0.55,0.012,0.022,0.005,1),[s*0.28,y,G.ws+0.04],[0,s*0.12,0])}
    const az=G.rr+0.18;put(B,'gloss',RB(0.06,0.06,0.2,0.03),[0,ytop(az)+cr(az)+0.02,az]);
    if(S.rails){const rx=hw(0)-tg(0)-0.12;for(const s of [-1,1]){const pts=[];for(let z=G.rr+0.05;z<=G.rf-0.05;z+=0.2)pts.push(V(s*rx,ytop(z)+0.04,z));
        put(B,'gloss',new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,0.018,6));for(const z of [G.rr+0.08,G.rf-0.08])put(B,'gloss',RB(0.05,0.05,0.08,0.02),[s*rx,ytop(z)+0.02,z])}}}
  // a lip round each wheel arch over the skin's cut edge, and the dark liner of the wheel well inside it
  for(const zc of [zf,zr]){if(S.bed&&zc===zr)continue;const pts=[];for(let k=0;k<=24;k++){const a=0.12+(Math.PI-0.24)*k/24,y=WR+Math.sin(a)*(AR+0.008),z=zc+Math.cos(a)*(AR+0.008);
      if(y<yb(z)+0.02)continue;pts.push([z,y])}
    for(const s of [-1,1]){put(B,S.cladding?'plastic':'carpaint',new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(([z,y])=>V(s*(sideAt(z,y)-0.012),y,z))),32,0.032,6));
      const lw=hw(zc)-xin+0.02,g=new T.CylinderGeometry(AR+0.005,AR+0.005,lw,20,1,true,0.15,Math.PI-0.3);g.rotateZ(Math.PI/2);put(B,'under',g,[s*(xin+lw/2-0.01),WR,zc],[0,0,0],[1,1,1]);
      const g2=g.clone();g2.scale(-1,1,1);put(B,'under',g2,[s*(xin+lw/2-0.01),WR,zc])}}
  // underneath: the fuel tank, the exhaust run and the axles, dark, so a low view shows a car not a shell
  put(B,'under',RB(1.0,0.12,0.8,0.03),[0,yb(0)+0.02,zr+AR+0.2]);put(B,'under',CY(0.035,0.035,S.L*0.7,8),[0.3,yb(0)-0.02,-0.2],[Math.PI/2,0,0]);
  for(const zc of [zf,zr])put(B,'under',CY(0.045,0.045,WX*2-0.3,8),[0,WR,zc],[0,0,Math.PI/2]);
  if(S.bed)S.bed(put,{z0,zr,WR,WX,AR,hw,ybelt});

  // ---------- merge: one mesh per material, and the four wheels as their own nodes ----------
  const root=new T.Group();root.name=name;
  const bodyG=new T.Group();bodyG.name='body';root.add(bodyG);
  for(const [mat,list] of Object.entries(parts[B])){const m=BGU.mergeVertices(BGU.mergeBufferGeometries(list),1e-5);const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=name+'_'+mat;bodyG.add(mesh)}
  const W=wheel(WR,TW,S.rim||5);
  for(const [k,x,z] of [['fl',WX,zf],['fr',-WX,zf],['rl',WX,zr],['rr',-WX,zr]]){const g=new T.Group();g.name='wheel_'+k;g.position.set(x,WR,z);if(x<0)g.rotation.y=Math.PI;
    for(const [mat,geo] of W){const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({name:mat}));mesh.name=name+'_w'+k+'_'+mat;g.add(mesh)}root.add(g)}
  return root}

// a wheel, its face to +x: the tyre (rounded shoulders, four tread grooves), the alloy (n spokes cut from a disc, a deep
// barrel, centre cap and lug nuts), and behind it the brake disc and calliper
const wheelC={};
function wheel(WR,TW,n){const key=WR+'_'+TW+'_'+n;if(wheelC[key])return wheelC[key];const out={},add=(m,g,p,r)=>{g=g.index?g.toNonIndexed():g.clone();
    e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(V(...(p||[0,0,0])),q,V(1,1,1));g.applyMatrix4(mtx);for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);(out[m]=out[m]||[]).push(g)};
  const RR=WR*0.62,hw=TW/2;
  // the tyre's section from the inner bead round the tread to the outer bead, revolved round the axle
  const prof=[[RR-0.005,-hw+0.02],[RR+0.02,-hw],[WR-0.06,-hw-0.008],[WR-0.022,-hw+0.006],[WR-0.004,-hw+0.03]];
  for(const g of [-0.2,0.2]){const c=g*TW*2*0.5;prof.push([WR,c-0.018],[WR-0.008,c-0.012],[WR-0.008,c+0.012],[WR,c+0.018])}
  prof.push([WR-0.004,hw-0.03],[WR-0.022,hw-0.006],[WR-0.06,hw+0.008],[RR+0.02,hw],[RR-0.005,hw-0.02]);
  prof.sort((a,b)=>a[1]-b[1]);
  const tire=new T.LatheGeometry(prof.map(([r,y])=>new T.Vector2(r,y)),24);tire.rotateZ(Math.PI/2);add('tire',BGU.toCreasedNormals(tire,0.6));
  // the alloy: the face cut into spokes, the barrel behind it
  const sh=new T.Shape();sh.absarc(0,0,RR,0,Math.PI*2,false);const sw=0.045/RR*1.6;
  for(let k=0;k<n;k++){const a0=k/n*Math.PI*2+sw/2+0.12,a1=(k+1)/n*Math.PI*2-sw/2-0.02,r0=0.075,r1=RR-0.028,h=new T.Path();
    h.absarc(0,0,r1,a0,a1,false);h.absarc(0,0,r0,a1+0.12,a0+0.12,true);h.closePath();sh.holes.push(h)}
  const face=new T.ExtrudeGeometry(sh,{depth:0.03,bevelEnabled:true,bevelThickness:0.008,bevelSize:0.006,bevelSegments:1,curveSegments:4});
  face.rotateY(Math.PI/2);add('rim',BGU.toCreasedNormals(face,0.5),[hw-0.06,0,0]);
  add('rim',new T.CylinderGeometry(RR-0.005,RR-0.005,TW-0.03,20,1,true),[-0.005,0,0],[0,0,Math.PI/2]);
  add('rim',CY(0.05,0.055,0.03,18),[hw-0.02,0,0],[0,0,Math.PI/2]);add('chrome',CY(0.03,0.03,0.012,14),[hw-0.002,0,0],[0,0,Math.PI/2]);
  for(let k=0;k<5;k++){const a=(k+0.5)/5*Math.PI*2;add('disc',CY(0.011,0.011,0.03,6),[hw-0.03,Math.sin(a)*0.055,Math.cos(a)*0.055],[0,0,Math.PI/2])}
  add('disc',CY(RR-0.04,RR-0.04,0.022,18),[-0.02,0,0],[0,0,Math.PI/2]);add('caliper',RB(0.06,0.13,0.09,0.02),[0.005,RR-0.07,-0.06],[0.5,0,0]);
  const res=Object.entries(out).map(([m,l])=>[m,BGU.mergeVertices(BGU.mergeBufferGeometries(l),1e-5)]);
  // the wheel turns about x: no rotation changes it except the turning, so the tread and spokes are what show it
  return wheelC[key]=res}

// ---------- the cars: their sizes, and the heights and widths their skins are swept from (z from the tail) ----------
const sedan={L:4.82,WB:2.83,fo:0.97,WR:0.335,WX:0.8,TW:0.225,
  yb:[[-2.41,0.4],[-2.2,0.25],[-1.9,0.19],[1.9,0.19],[2.2,0.25],[2.41,0.3]],
  belt:[[-2.41,0.96],[-1.6,1.0],[0,0.97],[1.25,0.93],[2.41,0.82]],
  top:[[-2.41,1.01],[-2.25,1.05],[-1.5,1.08],[-0.62,1.41],[0.5,1.445],[1.3,0.99],[2.25,0.88],[2.41,0.83]],
  w:[[-2.41,0.78],[-2.2,0.88],[-1.4,0.925],[1.3,0.925],[2.1,0.88],[2.41,0.72]],
  tg:[[-2.41,0.12],[-1.5,0.12],[-0.7,0.25],[0.5,0.25],[1.3,0.14],[2.41,0.1]],crown:[[-2.41,0.02],[-1,0.05],[0.5,0.05],[2.41,0.03]],
  glass:{ws:1.3,rf:0.5,rr:-0.62,dk:-1.5,sf:1.22,sr:-1.15,bp:[0.02]},seams:[1.12,0.02,-1.0],seamY0:0.35,seamY1:0.98,handles:[0.32,-0.66],
  front:{grille:[0.48,0.68],gw:0.42,intake:[0.27,0.42],iw:0.62,lx:[0.42,0.78],ly:[0.68,0.78],chromeBars:false},
  rear:{lx:[0.38,0.84],ly:[0.86,0.98],bump:[0.3,0.48],iw:0.72,plate:0.66,badge:0.92,pipes:[1,-1]},seats:[[0.38,2],[-0.5,3]]};
const hatch=Object.assign({},sedan,{L:4.3,WB:2.64,fo:0.9,WR:0.315,WX:0.77,
  yb:[[-2.15,0.38],[-1.95,0.24],[-1.7,0.18],[1.7,0.18],[2.0,0.25],[2.15,0.3]],
  belt:[[-2.15,0.97],[-1.4,0.99],[0,0.95],[1.15,0.9],[2.15,0.8]],
  top:[[-2.15,1.06],[-2.08,1.3],[-1.85,1.43],[0.55,1.47],[1.2,0.98],[2.0,0.86],[2.15,0.81]],
  w:[[-2.15,0.76],[-1.95,0.86],[-1.3,0.9],[1.2,0.9],[1.9,0.86],[2.15,0.72]],
  tg:[[-2.15,0.14],[-1.9,0.22],[0.55,0.24],[1.2,0.13],[2.15,0.1]],
  glass:{ws:1.2,rf:0.55,rr:-1.85,dk:-2.09,sf:1.12,sr:-1.62,bp:[0.0]},seams:[1.03,0.0,-1.0],handles:[0.28,-0.62],
  front:{grille:[0.46,0.64],gw:0.36,intake:[0.27,0.4],iw:0.58,lx:[0.4,0.76],ly:[0.66,0.76]},
  rear:{lx:[0.5,0.82],ly:[0.92,1.08],bump:[0.3,0.5],iw:0.7,plate:0.72,badge:1.15,pipes:[1]},seats:[[0.3,2],[-0.6,3]]});
const wagon=Object.assign({},sedan,{L:4.9,
  top:[[-2.45,1.05],[-2.36,1.36],[-2.15,1.43],[0.5,1.45],[1.3,0.99],[2.25,0.88],[2.45,0.83]],
  yb:[[-2.45,0.4],[-2.2,0.25],[-1.9,0.19],[1.9,0.19],[2.2,0.25],[2.45,0.3]],
  belt:[[-2.45,0.98],[-1.6,1.0],[0,0.97],[1.25,0.93],[2.45,0.82]],
  w:[[-2.45,0.78],[-2.25,0.88],[-1.4,0.925],[1.3,0.925],[2.1,0.88],[2.45,0.72]],
  tg:[[-2.45,0.14],[-2.15,0.22],[0.5,0.25],[1.3,0.14],[2.45,0.1]],
  glass:{ws:1.3,rf:0.5,rr:-2.15,dk:-2.37,sf:1.22,sr:-2.0,bp:[0.02,-1.15]},seams:[1.12,0.02,-1.0],rails:true,
  rear:{lx:[0.5,0.84],ly:[0.92,1.06],bump:[0.3,0.5],iw:0.74,plate:0.72,badge:1.12,pipes:[1]},seats:[[0.38,2],[-0.5,3]]});
const suv=Object.assign({},sedan,{L:4.75,WB:2.78,fo:0.92,WR:0.37,WX:0.82,TW:0.235,cladding:true,
  yb:[[-2.38,0.52],[-2.15,0.36],[-1.8,0.3],[1.8,0.3],[2.15,0.38],[2.38,0.45]],
  belt:[[-2.38,1.12],[-1.5,1.13],[0,1.1],[1.2,1.06],[2.38,0.98]],
  top:[[-2.38,1.2],[-2.3,1.55],[-2.1,1.68],[0.55,1.71],[1.25,1.14],[2.2,1.03],[2.38,0.99]],
  w:[[-2.38,0.8],[-2.2,0.9],[-1.4,0.94],[1.3,0.94],[2.1,0.9],[2.38,0.76]],
  tg:[[-2.38,0.15],[-2.1,0.22],[0.55,0.24],[1.25,0.14],[2.38,0.1]],
  glass:{ws:1.25,rf:0.55,rr:-2.1,dk:-2.31,sf:1.17,sr:-1.95,bp:[0.0,-1.12]},seams:[1.07,0.0,-1.05],seamY0:0.5,seamY1:1.12,rails:true,handles:[0.3,-0.7],
  front:{grille:[0.62,0.86],gw:0.48,intake:[0.4,0.56],iw:0.66,lx:[0.48,0.82],ly:[0.86,0.95],chromeBars:true},
  rear:{lx:[0.55,0.86],ly:[1.06,1.2],bump:[0.42,0.62],iw:0.76,plate:0.85,badge:1.3,pipes:[1,-1]},seats:[[0.35,2],[-0.55,3]]});
const minivan=Object.assign({},sedan,{L:5.15,WB:3.03,fo:1.0,WR:0.35,WX:0.84,TW:0.235,
  yb:[[-2.58,0.45],[-2.35,0.3],[-2.0,0.22],[2.0,0.22],[2.35,0.3],[2.58,0.36]],
  belt:[[-2.58,1.06],[-1.5,1.07],[0,1.05],[1.3,1.0],[2.58,0.9]],
  top:[[-2.58,1.15],[-2.52,1.6],[-2.3,1.76],[1.0,1.78],[1.85,1.1],[2.45,0.96],[2.58,0.91]],
  w:[[-2.58,0.84],[-2.35,0.96],[-1.4,0.99],[1.4,0.99],[2.2,0.94],[2.58,0.78]],
  tg:[[-2.58,0.14],[-2.3,0.18],[1.0,0.2],[1.85,0.14],[2.58,0.1]],soft:0.1,
  glass:{ws:1.85,rf:1.0,rr:-2.3,dk:-2.52,sf:1.75,sr:-2.18,bp:[0.75,-0.95]},seams:[1.62,0.75,-0.95],seamY0:0.4,seamY1:1.06,handles:[0.95,-0.15],
  front:{grille:[0.58,0.74],gw:0.42,intake:[0.32,0.5],iw:0.66,lx:[0.44,0.84],ly:[0.76,0.88]},
  rear:{lx:[0.62,0.9],ly:[1.0,1.3],bump:[0.36,0.56],iw:0.8,plate:0.8,badge:1.15,pipes:[1]},seats:[[1.05,2],[0.0,2],[-1.05,3]]});
const van=Object.assign({},sedan,{L:5.6,WB:3.4,fo:0.95,WR:0.36,WX:0.86,TW:0.235,
  yb:[[-2.8,0.5],[-2.6,0.38],[-2.3,0.3],[2.2,0.3],[2.6,0.36],[2.8,0.42]],
  belt:[[-2.8,1.12],[1.4,1.12],[2.8,1.0]],
  top:[[-2.8,2.36],[-2.65,2.42],[1.4,2.44],[2.1,1.28],[2.65,1.08],[2.8,1.02]],
  w:[[-2.8,0.96],[-2.55,1.0],[1.6,1.0],[2.35,0.96],[2.8,0.8]],
  tg:[[-2.8,0.1],[1.4,0.1],[2.1,0.14],[2.8,0.1]],soft:0.12,crown:[[-2.8,0.02],[2.8,0.02]],
  glass:{ws:2.1,rf:1.4,rr:-3,dk:-3,sf:2.02,sr:0.95},seams:[1.95,0.95,-0.15,-2.7],seamY0:0.4,seamY1:2.2,handles:[1.1,-0.05],
  front:{grille:[0.62,0.82],gw:0.5,intake:[0.36,0.54],iw:0.72,lx:[0.5,0.88],ly:[0.84,0.98]},
  rear:{lx:[0.82,0.96],ly:[0.9,1.5],bump:[0.4,0.58],iw:0.86,plate:0.75,pipes:[1]},seats:[[1.25,2]]});
// the pickup: a crew cab and a bed of separate panels behind it, cut round the rear wheels
const pickup=Object.assign({},suv,{L:5.85,WB:3.68,fo:1.0,WR:0.39,WX:0.86,TW:0.255,z0:-0.72,rnd:0.05,cladding:false,
  yb:[[-0.72,0.4],[2.2,0.4],[2.55,0.45],[2.92,0.5]],
  belt:[[-0.72,1.2],[1.1,1.2],[2.92,1.14]],
  top:[[-0.72,1.88],[-0.6,1.9],[0.42,1.92],[1.08,1.26],[2.7,1.18],[2.92,1.12]],
  w:[[-0.72,0.98],[1.2,0.99],[2.5,0.97],[2.92,0.86]],
  tg:[[-0.72,0.14],[0.42,0.2],[1.08,0.14],[2.92,0.1]],crown:[[-0.72,0.03],[2.92,0.03]],
  glass:{ws:1.08,rf:0.42,rr:-0.6,dk:-0.7,sf:1.0,sr:-0.6,bp:[0.18]},seams:[0.98,0.18,-0.66],seamY0:0.55,seamY1:1.2,handles:[0.48,-0.4],rails:false,
  front:{grille:[0.72,1.06],gw:0.6,intake:[0.46,0.66],iw:0.8,lx:[0.62,0.9],ly:[0.96,1.1],chromeBars:true},
  rear:{lx:[0.9,0.98],ly:[0.85,1.2],bump:[0.45,0.62],iw:0.94,plate:0.6,pipes:[1]},seats:[[0.6,2],[-0.3,3]],
  bed:(put,o)=>{const z0=-2.92,z1=-0.75,zc=(z0+z1)/2,arch=(cz,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,o.WR+Math.sin(a)*r]});
    const sh=new T.Shape(),pts=[[z1,0.55],...arch(o.zr,o.AR,0.25,Math.PI-0.25,16).map(p=>p).reverse(),[z0,0.6],[z0,1.2],[z1,1.2]];pts.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));
    for(const s of [-1,1]){const g=new T.ExtrudeGeometry(sh,{depth:0.06,bevelEnabled:true,bevelThickness:0.02,bevelSize:0.02,bevelSegments:2,curveSegments:16});g.rotateY(-Math.PI/2);
      put('body','carpaint',BGU.toCreasedNormals(g,0.6),[s*0.95+0.03,0,0]);put('body','gloss',RB(0.14,0.04,z1-z0,0.015),[s*0.93,1.23,zc]);
      put('body','plastic',RB(0.4,0.42,1.0,0.08),[s*0.72,o.WR+0.12,o.zr]);put('body','redL',RB(0.05,0.36,0.1,0.02),[s*0.95,1.0,z0+0.02])}
    put('body','plastic',RB(1.84,0.04,z1-z0,0.01),[0,0.66,zc]);for(let x=-0.75;x<=0.76;x+=0.25)put('body','plastic',RB(0.05,0.02,z1-z0-0.05,0.008,1),[x,0.69,zc]);
    put('body','carpaint',RB(1.9,0.62,0.06,0.02),[0,0.92,z0+0.03]);put('body','gloss',RB(0.3,0.05,0.02,0.01,1),[0,1.1,z0-0.005]);
    put('body','carpaint',RB(1.9,0.6,0.06,0.02),[0,0.92,z1+0.0]);put('body','chrome',RB(1.98,0.17,0.18,0.05),[0,0.55,z0-0.02]);
    put('body','plate',RB(0.52,0.12,0.012,0.008,1),[0,0.78,z0-0.008]);put('body','under',RB(1.0,0.12,2.2,0.02),[0,0.5,zc])}});
pickup.rear=null;

const root=new T.Group();root.name='cars';
for(const [n,s] of Object.entries({sedan,hatch,wagon,suv,minivan,pickup,van}))root.add(car(n,s));
return root}
