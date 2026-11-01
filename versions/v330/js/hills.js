// Corley's Island: the foothills behind the lakeside town (the ground itself is fhGround in terrain.js). Overlook Road
// climbs from the end of the town's west side street in four switchback legs, about 1/3 mile at up to 10%, to the
// Lakeside Overlook on a shoulder of the mountain about 160 ft above the town: asphalt with a double yellow line and
// white edge lines on gravel shoulders, steel guardrail on the drop side, curve signs before the hairpins. The Lookout
// Trail goes more directly up the face through the woods for walkers, from the east side street, crossing the road, in
// packed earth with log steps on the steep bits. At the top: a paved lot, a flagstone terrace behind a fieldstone wall
// with an iron rail, benches, coin viewers, a sign naming what you see, a flagpole and lamps; people stand at the wall,
// sit on the benches and walk the trail (TF_ROOMS), and a few cars are parked (TF_PARKED). Woods cover the hillside and
// the ground round the town's sides out to where the mountains come up.
// Everything is built at load from the ground as it is (baseHeight), like the town.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// metres from x, z to the road's middle line (99 off its box)
function fhRoadD(x,z){if(!(x>FH_BB[0]&&x<FH_BB[1]&&z>FH_BB[2]&&z<FH_BB[3]))return 99;let d=99;
  for(const q of FH_G[Math.floor((z-FH_BB[2])/FH_C)*FH_NX+Math.floor((x-FH_BB[0])/FH_C)]){let t=((x-q.ax)*q.dx+(z-q.az)*q.dz)*q.il;t=t<0?0:t>1?1:t;d=Math.min(d,Math.hypot(x-q.ax-q.dx*t,z-q.az-q.dz*t))}return d}
// metres from x, z to a line of points
function fhLineD(P,x,z){let d=1e9;for(let i=0;i<P.length-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],dx=bx-ax,dz=bz-az;let t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz);t=t<0?0:t>1?1:t;d=Math.min(d,Math.hypot(x-ax-dx*t,z-az-dz*t))}return d}
// a strip along a line of points (each [x, z, ...]) from u0 to u1 across it (+ to the right going along), lift over the ground
function fhStrip(K,mat,P,u0,u1,lift){const Q=[],n=P.length,tri=(a,b,c)=>{if((b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2])<0)[b,c]=[c,b];Q.push(...a,...b,...c)};
  const at=(i,u)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,x=P[i][0]-(b[1]-a[1])/l*u,z=P[i][1]+(b[0]-a[0])/l*u;return [x,baseHeight(x,z)+lift,z]};
  for(let i=0;i<n-1;i++){const a=at(i,u0),b=at(i,u1),c=at(i+1,u0),d=at(i+1,u1);tri(a,c,b);tri(b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(Q,3));K.put(mat,g)}
// the trail's points every 1.5 m, each [x, z]
function fhDense(P,step){const out=[];for(let i=0;i<P.length-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/step));
  for(let k=0;k<n;k++)out.push([ax+(bx-ax)*k/n,az+(bz-az)*k/n])}out.push(P[P.length-1].slice());return out}

(function(){const K=shopKit(),F=famKit(),LK=famKit(),BK=famKit(),G=baseHeight,P=FH.pts,w=FH.w/2,n=P.length;
  const asph=shopLib('asphalt'),grav=shopLib('gravel'),flag=shopLib('flagstone'),yel=shopStd(0xd8b024,0,0.6),wht=shopStd(0xe9e7e0,0,0.6),GALV=0x9aa0a4;
  // ---------- the road ----------
  fhStrip(K,grav,P,-w,w,0.03);fhStrip(K,asph,P,-3.3,3.3,0.045);
  for(const o of [-0.16,0.06])fhStrip(K,yel,P,o,o+0.1,0.052);for(const o of [-3.1,3.0])fhStrip(K,wht,P,o,o+0.1,0.052);
  for(let i=0;i<n-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],L=Math.hypot(bx-ax,bz-az);walkPad((ax+bx)/2,(az+bz)/2,3.3,L/2+0.2,Math.atan2(bx-ax,bz-az),0,{l:0.045})}
  // the guardrail where the ground falls away beside the road: galvanized posts every 2 m and a W-beam rail, solid
  const side=(i,s)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,rx=-(b[1]-a[1])/l*s,rz=(b[0]-a[0])/l*s,[x,z]=P[i];
    return {x:x+rx*(w+0.4),z:z+rz*(w+0.4),drop:P[i][2]-G(x+rx*(w+2.5),z+rz*(w+2.5))}};
  for(const s of [-1,1]){let run=[];const end=()=>{if(run.length>2){for(let k=0;k<run.length;k++){const p=run[k],y=G(p.x,p.z);F.box(0.15,0.95,0.12,GALV,p.x,y+0.4,p.z);
        if(k){const q=run[k-1],L=Math.hypot(p.x-q.x,p.z-q.z),yaw=Math.atan2(p.x-q.x,p.z-q.z),c=Math.cos(yaw),sn=Math.sin(yaw),mx=(p.x+q.x)/2,mz=(p.z+q.z)/2,my=(y+G(q.x,q.z))/2;
          F.box(0.06,0.32,L+0.05,GALV,mx,my+0.62,mz,yaw);F.box(0.1,0.08,L+0.05,0x7d8388,mx,my+0.62,mz,yaw);
          SOLIDS.push({x:mx,z:mz,lx:0.12,lz:L/2,cs:c,sn,hx:Math.abs(c)*0.12+Math.abs(sn)*L/2,hz:Math.abs(sn)*0.12+Math.abs(c)*L/2})}}}run=[]};
    for(let i=4;i<n-6;i++){const p=side(i,s);if(p.drop>1.1)run.push(p);else end()}end()}
  // signs: the road's name at its foot, and a curve sign before each hairpin for the traffic going up
  const post2=(x,z,y,s)=>{for(const t of [-1,1])F.box(0.1,y+0.4,0.1,0x8a8a86,x+t*s,G(x,z)+(y+0.4)/2,z)};
  {const x=-70,z=784;famSign(['LAKESIDE OVERLOOK','Overlook Road · 1/3 mile'],3.4,1.2,x,G(x,z)+2.2,z,Math.PI,'#2f5a33','#ffffff');post2(x,z,2.2,1.4)}
  for(const [x,z,ry] of [[63,822,-Math.PI/2],[-42,854,Math.PI/2],[44,909.5,-Math.PI/2]]){famSign(['SHARP CURVE','15 MPH'],1.3,1.0,x,G(x,z)+2.0,z,ry,'#e2b52a','#1a1a1a');F.box(0.08,2.4,0.08,0x8a8a86,x,G(x,z)+1.2,z)}

  // ---------- the trail ----------
  // packed earth a metre and a half wide, a log step across it wherever it climbs more than about 1 in 5; a sign at its foot
  const T=fhDense(FH_TRAIL,1.5),dirt=shopStd(0x8c7a5e,0,0.95);fhStrip(K,dirt,T,-0.75,0.75,0.025);
  let last=G(...T[0]);for(let i=1;i<T.length;i++){const [x,z]=T[i],y=G(x,z);if(fhRoadD(x,z)<w+1){last=y;continue}
    if(y-last>0.28){const [px,pz]=T[i-1];F.box(1.7,0.16,0.18,0x5a4632,x,y+0.02,z,Math.atan2(x-px,z-pz)+Math.PI/2);last=y}}
  {const [x,z]=[34.5,742];famSign(['LOOKOUT TRAIL','To the Overlook · 0.2 mile · Steep'],2.2,0.9,x,G(x,z)+1.6,z,Math.PI,'#5a3a22','#f1ead8');post2(x,z,1.6,0.9)}

  // ---------- the overlook ----------
  const O=FH_OV,oy=O.y,LOT=[-16,28,931,947],TER=[-16,28,923.2,931];
  K.sheet(asph,LOT[0],LOT[1],LOT[2],LOT[3],0.045);walkPad((LOT[0]+LOT[1])/2,(LOT[2]+LOT[3])/2,(LOT[1]-LOT[0])/2,(LOT[3]-LOT[2])/2,0,0,{l:0.045});
  // the stalls along the lot's south side, nose to the trees
  for(let x=LOT[0]+3;x<=LOT[1]-2;x+=2.8)K.sheet(wht,x-0.05,x+0.05,LOT[3]-5.4,LOT[3]-0.4,0.052);
  for(const x of [-8.6,0.8,10.2])TF_PARKED.push({x:x+1.4,y:G(x+1.4,LOT[3]-2.9)+0.06,z:LOT[3]-2.9,yaw:0});
  // the terrace: flagstone a step up from the lot, a fieldstone wall along its edge with an iron rail on top
  K.sheet(flag,TER[0],TER[1],TER[2],TER[3],0.16);walkPad((TER[0]+TER[1])/2,(TER[2]+TER[3])/2,(TER[1]-TER[0])/2,(TER[3]-TER[2])/2,0,0,{l:0.16});
  F.box(TER[1]-TER[0],0.18,0.25,'concOld',(TER[0]+TER[1])/2,oy+0.07,TER[3],0);
  {const wz=TER[2]-0.3,x0=TER[0]-1,x1=TER[1]+1;F.box(x1-x0,1.1,0.6,'ashlar',(x0+x1)/2,oy-0.1,wz);F.box(x1-x0+0.1,0.1,0.7,0x8a857d,(x0+x1)/2,oy+0.5,wz);
    for(const x of [x0,x1])F.box(0.6,1.1,TER[3]-TER[2]+0.6,'ashlar',x,oy-0.1,(TER[2]+TER[3])/2);
    for(let x=x0+0.4;x<=x1-0.3;x+=1.6)F.box(0.05,0.55,0.05,0x1f2a24,x,oy+0.83,wz);F.box(x1-x0,0.06,0.07,0x1f2a24,(x0+x1)/2,oy+1.1,wz);F.box(x1-x0,0.04,0.05,0x1f2a24,(x0+x1)/2,oy+0.75,wz);
    SOLIDS.push({x:(x0+x1)/2,z:wz,hx:(x1-x0)/2,hz:0.35});for(const x of [x0,x1])SOLIDS.push({x,z:(TER[2]+TER[3])/2,hx:0.35,hz:(TER[3]-TER[2])/2})}
  // benches looking out, coin viewers on posts, the sign naming the view, a flagpole, two lamps, a bin
  const OV={x:6,z:930,r:28,spots:[],ground:1},spot=(x,z,yaw,k)=>{const sp=Object.assign({x,z,y:G(x,z)+0.16,yaw},k||{});OV.spots.push(sp);return sp};
  for(const x of [-10,-1,16,24]){const z=926.6,y=G(x,z)+0.16;BK.box(1.6,0.45,0.5,0x5c4632,x,y+0.22,z);famSpot('bench',x,y,z,Math.PI,0.9);for(const t of [-0.4,0.4])spot(x+t,z,Math.PI,{sit:1});SOLIDS.push({x,z,hx:0.8,hz:0.3})}
  for(const x of [-14.5,7.5]){const z=924.4,y=G(x,z)+0.16;F.cyl(0.07,0.09,1.05,8,0x2f3a2a,x,y+0.52,z);F.box(0.32,0.28,0.55,0x2f5a33,x,y+1.2,z,0,0.2);
    for(const t of [-0.08,0.08])F.cyl(0.07,0.07,0.16,10,0x1f2a24,x+t,y+1.24,z-0.32,0,Math.PI/2);spot(x,z+0.75,Math.PI);SOLIDS.push({x,z,hx:0.25,hz:0.3})}
  {const x=3.5,z=924.2,y=G(x,z)+0.16;famSign(["LAKESIDE OVERLOOK · ELEV. 160 FT ABOVE TOWN","Lakeside · The marina · Family Island · Corley's Island · Dexter's · Jessica's"],3.0,0.75,x,y+1.0,z,0,'#3a2a20','#f1ead8');
    for(const t of [-1.3,1.3])F.box(0.12,1.0,0.12,0x5a3a22,x+t,y+0.5,z+0.05);spot(x-0.8,z+1.3,Math.PI);spot(x+0.9,z+1.4,Math.PI-0.3)}
  {const x=-13,z=929,y=G(x,z)+0.16;F.cyl(0.07,0.09,11,10,0xe9e6dc,x,y+5.5,z);F.cyl(0.12,0.12,0.12,10,0xc9a640,x,y+11.06,z);F.box(0.02,1.1,1.9,0xb8322a,x,y+10.2,z+0.97);
    for(let k=0;k<4;k++)F.box(0.025,0.12,1.9,0xf1ead8,x,y+9.8+k*0.27,z+0.97);F.box(0.03,0.6,0.8,0x1f3a5f,x,y+10.45,z+0.4);SOLIDS.push({x,z,hx:0.12,hz:0.12})}
  for(const [x,z] of [[-6,930.6],[20,930.6]]){const y=G(x,z)+0.16;LK.cyl(0.07,0.1,4.2,8,0x2f3236,x,y+2.1,z);LK.box(0.45,0.18,0.45,0x2f3236,x,y+4.25,z);LK.lit(new THREE.BoxGeometry(0.36,0.05,0.36),0xfff1c8,x,y+4.13,z);famSpot('lamp',x,y,z,0);SOLIDS.push({x,z,hx:0.12,hz:0.12})}
  {const x=26.5,z=930.2,y=G(x,z)+0.16;F.cyl(0.28,0.28,0.95,12,0x2a4a32,x,y+0.48,z);SOLIDS.push({x,z,hx:0.3,hz:0.3})}
  // people: at the wall looking out, on the benches, by the sign; and a few walking the trail up and back
  for(const x of [-12,-6.5,-4,4,9.5,12,19.5,22])spot(x,923.9,Math.PI);
  const TR=fhDense(FH_TRAIL,3).concat(fhDense(FH_TRAIL,3).reverse());for(let k=0;k<3;k++)spot(30,739,0,{staff:1,path:rmLine(TR),at:k*80+20});
  rmAdd(OV,190,[0,4,7,10]);

  // ---------- the woods ----------
  // over the hillside and the ground round the town's sides out to the mountains' feet, in groves and glades: clear of the
  // road and its banks, the trail, the overlook's clearing and the beach; pines more often higher up
  let sd=57;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647},pts=[],trees=[],cell=new Map(),ck=(i,j)=>i*4096+j;
  const near=(x,z)=>{const i=Math.floor(x/4),j=Math.floor(z/4);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const p of cell.get(ck(i+a,j+b))||[])if((p[0]-x)**2+(p[1]-z)**2<11)return true;return false};
  for(let g=0;g<40000&&pts.length<850;g++){const x=-560+rnd()*1120,z=575+rnd()*465;if(z<fhZ(x)-4&&Math.abs(x)<432)continue;
    const r=Math.hypot(x,z),gy=G(x,z);if(gy-WATER<3||z>(Math.abs(x)<=430?mainZS(x)-3:1e9)||gy<mtnFrontY(r,Math.atan2(z,x))+2)continue;
    const dens=0.3+0.7*ss(0.35,0.65,tuftNoise(x*0.025+11,z*0.025+3));if(rnd()>dens)continue;
    if(fhRoadD(x,z)<w+3.5||fhLineD(FH_TRAIL,x,z)<2.4||Math.hypot((x-O.x)/O.rx,(z-O.z)/O.rz)<1.4)continue;
    if(near(x,z))continue;pts.push([x,z]);const k=ck(Math.floor(x/4),Math.floor(z/4));if(!cell.has(k))cell.set(k,[]);cell.get(k).push([x,z])}
  for(const [x,z] of pts){const pine=rnd()<0.35+0.4*ss(800,940,z);trees.push(treeEntry(pine?'pine':'leafy',x,z,rnd()*6.3,0.8+rnd()*0.6,(rnd()*6)|0))}
  treeGroup('foothills',trees);
  K.add();famAdd(F);famAddSpot('lamp',LK);famAddSpot('bench',BK)})();
