// Corley's Island: Harbor Square, the lakeside town's centre, on the waterfront west of the foot of Main Street where the
// causeway comes ashore. Along the water a granite seawall (the shore there is straightened to it: mainRimS, terrain.js)
// with an iron rail, a paved promenade with benches, lamps, café tables, a flagpole and the town's founding stone, and
// broad steps down to the beach; the beach road crosses the square in brick between bollards, where cars go at a walk
// (townfolk.js). South of it the town green: a lawn crossed by brick paths, a fountain and, on the axis from the steps,
// a white bandstand with a band playing under festoon lights strung out to poles round the lawn, shade trees, benches and
// a row of market stalls; and facing it all from the south the brick Town Hall with its portico and clock tower, the
// clock keeping the game's time. People stroll, sit, shop, listen and look out at the islands (TF_ROOMS), and the
// town's walkers come round the green and over to the promenade (TF_WALK).
// Built at load from the ground as it is (baseHeight), like the town.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// the square: the seawall's face (z), the promenade's ends, the green's paths (x west, x east, z north, z south), the
// axis it is laid out on (x), the fountain's and the bandstand's middles (z), the Town Hall's middle and front
const SQ={wall:557.6,px0:-113,px1:-6.5,gx0:-99.5,gx1:-25.5,gz0:578.5,gz1:612.5,ax:-61,fz:588,bz:601,hx:-61,hz:623,hf:616.5,hands:[]};
// a sheet from x0 to x1 by z0 to z1, its height yf(x, z), cut every step metres
function sqSheet(K,mat,x0,x1,z0,z1,yf,step){const g=new THREE.PlaneGeometry(x1-x0,z1-z0,Math.max(1,Math.round((x1-x0)/step)),Math.max(1,Math.round((z1-z0)/step)));g.rotateX(-Math.PI/2);
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+(x0+x1)/2,z=p.getZ(i)+(z0+z1)/2;p.setXYZ(i,x,yf(x,z),z)}K.put(mat,g)}
// a ring (or a disc, r0 0) round cx, cz, its height yf(x, z)
function sqRing(K,mat,cx,cz,r0,r1,yf){const g=new THREE.RingGeometry(r0,r1,40,3);g.rotateX(-Math.PI/2);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i)+cx,z=p.getZ(i)+cz;p.setXYZ(i,x,yf(x,z),z)}K.put(mat,g)}
// festoon lights from a to b ([x, y, z]), sagging in the middle, a bulb every 1.4 m
function sqString(F,a,b,sag){const L=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.ceil(L/1.4),P=[];
  for(let i=0;i<=n;i++){const t=i/n;P.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b[2]-a[2])*t])}
  for(let i=0;i<n;i++){const [p,q]=[P[i],P[i+1]],l=Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]);F.box(0.015,0.015,l,0x1a1a1a,(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,Math.atan2(q[0]-p[0],q[2]-p[2]),-Math.asin((q[1]-p[1])/l));
    if(i)F.lit(new THREE.BoxGeometry(0.08,0.11,0.08),0xffe2a8,p[0],p[1]-0.09,p[2])}}

(function(){const K=shopKit(),F=famKit(),LK=famKit(),BK=famKit(),G=baseHeight,brk=shopLib('herringbone'),pav=shopLib('pavers'),
    IRON=0x1f2a24,WH=0xf2efe6,TR=0xe9e4d6,ax=SQ.ax,R={x:-58,z:590,r:48,spots:[],ground:1};
  const on=(x,z)=>G(x,z)+0.05,spot=(x,z,y,yaw,k)=>{const sp=Object.assign({x,z,y,yaw},k||{});R.spots.push(sp);return sp};
  const bench=(x,z,yaw,y)=>{y=y===undefined?on(x,z):y;const c=Math.cos(yaw),s=Math.sin(yaw);BK.box(1.6,0.45,0.5,0x5c4632,x,y+0.22,z,yaw);famSpot('bench',x,y,z,yaw,0.9);
    for(const t of [-0.4,0.4])spot(x+c*t,z-s*t,y,yaw,{sit:1});SOLIDS.push({x,z,lx:0.8,lz:0.3,cs:c,sn:s,hx:Math.abs(c)*0.8+Math.abs(s)*0.3,hz:Math.abs(s)*0.8+Math.abs(c)*0.3})};
  const lamp=(x,z,y)=>{y=y===undefined?on(x,z):y;LK.cyl(0.07,0.1,4.2,8,0x2f3236,x,y+2.1,z);LK.box(0.45,0.18,0.45,0x2f3236,x,y+4.25,z);LK.lit(new THREE.BoxGeometry(0.36,0.05,0.36),0xfff1c8,x,y+4.13,z);
    famSpot('lamp',x,y,z,0);SOLIDS.push({x,z,hx:0.12,hz:0.12})};

  // ---------- the waterfront ----------
  // the promenade: pavers from the seawall to the beach road (over the old bank at the wall's level), on east as a plaza
  // round the post clock at the foot of Main Street
  const py=(x,z)=>Math.max(G(x,z),-3.6)+0.06;sqSheet(K,pav,SQ.px0,-19,558,571.4,py,1.5);sqSheet(K,pav,-19,SQ.px1,560.5,571.4,(x,z)=>G(x,z)+0.06,1.5);
  walkPad((SQ.px0-19)/2,559.5,(-19-SQ.px0)/2,1.5,0,-3.54);walkPad((SQ.px0-19)/2,566.2,(-19-SQ.px0)/2,5.2,0,0,{l:0.06});walkPad((-19+SQ.px1)/2,566,(SQ.px1+19)/2,5.4,0,0,{l:0.06});
  // the seawall: granite ashlar from below the water up to the promenade, a coping, returns at its ends; the iron rail on it,
  // open where the steps go down
  const ty=-3.54,X0=SQ.px0,X1=-19,WZ=SQ.wall,SW0=ax-3.2,SW1=ax+3.2;F.box(X1-X0,ty-WATER+1.2,0.8,'ashlar',(X0+X1)/2,(ty+WATER-1.2)/2,WZ);
  F.box(X1-X0+0.3,0.22,1.0,0xb9b6ad,(X0+X1)/2,ty+0.05,WZ+0.05);for(const x of [X0,X1])F.box(0.8,ty-WATER+1.2,3.6,'ashlar',x,(ty+WATER-1.2)/2,WZ+1.8);
  for(const [a,b] of [[X0+0.3,SW0-0.3],[SW1+0.3,X1-0.3]]){const n=Math.round((b-a)/2);for(let i=0;i<=n;i++){const x=a+(b-a)*i/n;F.box(0.05,1.0,0.05,IRON,x,ty+0.66,WZ+0.25);if(!(i%4))F.cyl(0.05,0.05,0.08,8,0xb08d3a,x,ty+1.2,WZ+0.25)}
    for(const dy of [1.12,0.62])F.box(b-a,0.05,0.06,IRON,(a+b)/2,ty+dy,WZ+0.25);SOLIDS.push({x:(a+b)/2,z:WZ+0.2,hx:(b-a)/2,hz:0.25})}
  // the steps down to the beach, granite between ashlar cheeks
  {const yb=G(ax,WZ-4.6),n=13,rise=(ty-yb)/n;for(let k=0;k<n;k++){const z=WZ-0.3-(n-k-0.5)*0.32,y=yb+rise*(k+1);F.box(SW1-SW0,y-yb+0.3,0.34,0xb9b6ad,ax,(y+yb-0.3)/2,z)}
    for(const x of [SW0-0.3,SW1+0.3])F.box(0.6,ty-yb+0.6,4.6,'ashlar',x,(ty+yb)/2,WZ-2.1);walkPad(ax,WZ-2.3,SW1-ax,2.2,0,yb,{rise:ty-yb});
    for(const x of [SW0-0.3,SW1+0.3])SOLIDS.push({x,z:WZ-2.1,hx:0.3,hz:2.3})}
  // benches looking out at the islands, lamps, people at the rail
  for(const x of [-107,-97,-87,-77,-45,-35]){bench(x,560.2,Math.PI,py(x,560.2));lamp(x+5,559.2,py(x+5,559.2))}
  for(const x of [-104,-92,-80,-70,-50,-40,-30,-23])spot(x,558.7,py(x,558.7),Math.PI);
  // café tables by the foot of Main Street, under umbrellas
  for(const [x,z] of [[-31,563.2],[-26,565.6],[-21,563.2],[-16,565.8],[-12,562.6]]){const y=py(x,z),c=[0x2f6b4f,0xe9e1cc,0xb8322a][Math.abs(x)%3];
    F.cyl(0.4,0.4,0.04,16,0x2b2d2f,x,y+0.74,z);F.cyl(0.04,0.04,0.74,8,0x2b2d2f,x,y+0.37,z);F.cyl(0.03,0.03,2.4,6,TR,x,y+1.2,z);F.cyl(0.04,1.35,0.45,12,c,x,y+2.3,z);
    for(let i=0;i<3;i++){const a=i*2.09+0.4,cx=x+Math.cos(a)*0.75,cz=z+Math.sin(a)*0.75,yl=Math.atan2(x-cx,z-cz);F.box(0.42,0.05,0.42,0x2b2d2f,cx,y+0.45,cz,yl);F.box(0.42,0.45,0.04,0x2b2d2f,cx-Math.sin(yl)*0.2,y+0.68,cz-Math.cos(yl)*0.2,yl);
      spot(cx,cz,y,yl,{sit:1})}SOLIDS.push({x,z,hx:0.45,hz:0.45})}
  // the flagpole and the founding stone, either side of the steps
  {const x=ax-7,z=566,y=py(x,z);F.cyl(0.6,0.7,0.4,16,0xb9b6ad,x,y+0.2,z);F.cyl(0.07,0.1,13,10,WH,x,y+6.9,z);F.cyl(0.13,0.13,0.13,10,0xc9a640,x,y+13.46,z);
    const cv=document.createElement('canvas');cv.width=190;cv.height=100;const g=cv.getContext('2d');for(let i=0;i<13;i++){g.fillStyle=i%2?'#f4f1e8':'#b22234';g.fillRect(0,i*100/13,190,100/13+0.5)}
    g.fillStyle='#3c3b6e';g.fillRect(0,0,76,54);g.fillStyle='#f4f1e8';for(let r=0;r<5;r++)for(let c=0;c<6;c++)g.fillRect(5+c*12+(r%2)*6,5+r*10,2.5,2.5);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const fg=new THREE.PlaneGeometry(2.3,1.2,6,1),fp=fg.attributes.position;
    for(let i=0;i<fp.count;i++){const u=fp.getX(i)+1.15;fp.setZ(i,0.12*Math.sin(u*2.4)*u/2.3)}fg.computeVertexNormals();
    const fm=new THREE.Mesh(fg,M(0xffffff,{map:tex,side:THREE.DoubleSide,flatShading:false}));fm.position.set(x+1.2,y+12.6,z);scene.add(fm);SOLIDS.push({x,z,hx:0.6,hz:0.6})}
  {const x=ax+7,z=566,y=py(x,z);F.box(2.2,0.35,1.2,0xa9a69e,x,y+0.17,z);F.box(1.8,1.4,0.7,'ashlar',x,y+1.05,z);F.box(1.9,0.12,0.8,0xb9b6ad,x,y+1.8,z);
    famSign(['HARBOR SQUARE','Town of Lakeside · Founded 1872'],1.4,0.62,x,y+1.1,z-0.37,Math.PI,'#5a4a2e','#e8d6a0');SOLIDS.push({x,z,hx:1.1,hz:0.6})}
  // the beach road through the square is laid in brick (mainStreets); bollards line it, gaps where the walks cross
  for(let x=-104;x<=-8;x+=3.5){if(Math.abs(x-(ax+4))<2.5||Math.abs(x-SQ.gx1)<2.5)continue;const zc=x<-60?576-2*(x+170)/110:574;
    for(const s of [-1,1]){const z=zc+s*2.85,y=G(x,z);F.cyl(0.11,0.12,0.9,10,IRON,x,y+0.45,z);F.cyl(0.13,0.13,0.06,10,0xb08d3a,x,y+0.93,z);SOLIDS.push({x,z,hx:0.12,hz:0.12})}}

  // ---------- the green ----------
  // brick walks: along the road (on to Main Street's sidewalk), round the lawn, across it and up its axis; rings round
  // the fountain and the bandstand
  const P=(x0,x1,z0,z1)=>{sqSheet(K,brk,x0,x1,z0,z1,on,1.5);walkPad((x0+x1)/2,(z0+z1)/2,(x1-x0)/2,(z1-z0)/2,0,0,{l:0.05})};
  P(-101,-6.15,577,580);P(-101,-98,580,614);P(-98,-24,611,614);P(-27,-24,580,611);P(-98,-27,598.5,601.5);
  P(ax-1.5,ax+1.5,580,SQ.fz-5.5);P(ax-1.5,ax+1.5,SQ.fz+5.5,SQ.bz-7);P(ax-1.5,ax+1.5,SQ.bz+7,611);
  for(const [z,r0,r1] of [[SQ.fz,3.5,5.5],[SQ.bz,4.5,7]]){sqRing(K,brk,ax,z,r0,r1,on);walkPad(ax,z,r1*0.8,r1*0.8,Math.PI/4,0,{l:0.05})}
  // the fountain: a granite basin, a pedestal with two bowls spilling into it, people on its rim
  {const z=SQ.fz,y=G(ax,z);for(let i=0;i<16;i++){const a=i*Math.PI/8,cx=ax+Math.cos(a)*3.35,cz=z+Math.sin(a)*3.35,yl=Math.PI/2-a;
      F.box(1.36,0.6,0.32,'ashlar',cx,y+0.25,cz,yl);F.box(1.42,0.1,0.44,0xb9b6ad,cx,y+0.6,cz,yl)}
    F.cyl(0.55,0.75,1.5,12,0xb9b6ad,ax,y+0.75,z);F.cyl(1.6,0.45,0.35,24,0xb9b6ad,ax,y+1.62,z);F.cyl(0.25,0.3,0.9,10,0xb9b6ad,ax,y+2.2,z);F.cyl(0.9,0.25,0.25,20,0xb9b6ad,ax,y+2.72,z);
    F.cyl(0.05,0.14,0.45,10,0xb9b6ad,ax,y+3.05,z);
    const wm=new THREE.MeshStandardMaterial({color:0x3f6a72,roughness:0.06,metalness:0,envMap:skyEnv,envMapIntensity:1.2}),fall=new THREE.MeshBasicMaterial({color:0xd6ecf2,transparent:true,opacity:0.32,depthWrite:false,side:THREE.DoubleSide});
    const wd=new THREE.Mesh(new THREE.CircleGeometry(3.3,32).rotateX(-Math.PI/2),wm);wd.position.set(ax,y+0.44,z);scene.add(wd);
    for(const [r,y0,y1] of [[1.55,1.62,0.44],[0.86,2.7,1.8]]){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.06,y0-y1,24,1,true),fall);m.position.set(ax,y+(y0+y1)/2,z);scene.add(m)}
    for(let i=0;i<6;i++){const a=i*1.047+0.5;spot(ax+Math.cos(a)*3.55,z+Math.sin(a)*3.55,y+0.55,Math.atan2(Math.cos(a),Math.sin(a)),{sit:1})}SOLIDS.push({x:ax,z,hx:3.5,hz:3.5})}
  // the bandstand: an octagon on a brick base, white posts and rails, a green roof with a finial, steps up from the
  // fountain's side; the band on it, and festoon lights from its eaves out to poles round the lawn
  {const z=SQ.bz,y=G(ax,z),top=y+1.1,r=4.6,oc=a=>[ax+Math.cos(a)*r*0.93,z+Math.sin(a)*r*0.93];
    F.cyl(r,r,1.0,8,'brick',ax,y+0.5,z,Math.PI/8);F.cyl(r+0.15,r+0.15,0.12,8,0xd8d2c4,ax,top-0.04,z,Math.PI/8);F.cyl(r-0.1,r-0.1,0.03,8,'deckG',ax,top+0.03,z,Math.PI/8);
    for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8,[px,pz]=oc(a);F.box(0.2,3.0,0.2,WH,px,top+1.5,pz);
      if(i!==5){const [qx,qz]=oc(a+Math.PI/4),L=Math.hypot(qx-px,qz-pz),yl=Math.atan2(qx-px,qz-pz);for(const dy of [0.95,0.12])F.box(0.08,0.08,L,WH,(px+qx)/2,top+dy,(pz+qz)/2,yl);
        for(let t=0.15;t<0.9;t+=0.12)F.box(0.04,0.8,0.04,WH,px+(qx-px)*t,top+0.53,pz+(qz-pz)*t);F.box(0.12,0.25,L,WH,(px+qx)/2,top+2.88,(pz+qz)/2,yl)}}
    F.cyl(0.2,r+0.6,2.0,8,famTint('seam',0x2f5a3a),ax,top+4.0,z,Math.PI/8);F.cyl(r+0.6,r+0.6,0.15,8,WH,ax,top+2.98,z,Math.PI/8);F.cyl(0.5,0.6,0.7,8,WH,ax,top+5.3,z,Math.PI/8);F.cyl(0,0.55,0.8,8,famTint('seam',0x2f5a3a),ax,top+6.05,z,Math.PI/8);F.cyl(0.05,0.05,0.9,6,0xc9a640,ax,top+6.8,z);
    for(let k=0;k<6;k++){const zs=z-r-0.15-k*0.32,ys=y+1.1-k*1.1/6;F.box(2.4,ys-y+0.05,0.34,0xb9b6ad,ax,(ys+y)/2,zs)}
    walkPad(ax,z,r*0.9,r*0.9,Math.PI/8,top+0.04);walkPad(ax,z-r-1.0,1.2,1.0,0,y,{rise:1.14});
    for(const [o,s] of [[-1.6,0.6],[-0.5,1.6],[0.6,1.4],[1.5,0.4]])spot(ax+o,z+s,top+0.04,Math.PI,{staff:1});
    for(let i=0;i<8;i++){const [px,pz]=oc(i*Math.PI/4+Math.PI/8);SOLIDS.push({x:px,z:pz,hx:0.15,hz:0.15})}
    const poles=[[-88,589],[-88,609],[-34,589],[-34,609]];for(const [px,pz] of poles){const gy=G(px,pz);F.box(0.16,5.2,0.16,0x5c4632,px,gy+2.6,pz);SOLIDS.push({x:px,z:pz,hx:0.1,hz:0.1})}
    for(const [i,k] of [[4,0],[2,1],[6,2],[0,3]]){const [px,pz]=oc(i*Math.PI/4+Math.PI/8),[qx,qz]=poles[k];sqString(F,[px,top+2.85,pz],[qx,G(qx,qz)+5.0,qz],0.9)}
    sqString(F,[poles[0][0],G(...poles[0])+5,poles[0][1]],[poles[1][0],G(...poles[1])+5,poles[1][1]],0.8);sqString(F,[poles[2][0],G(...poles[2])+5,poles[2][1]],[poles[3][0],G(...poles[3])+5,poles[3][1]],0.8)}
  // the market: a row of stalls under white and striped canopies along the east walk, a vendor behind each table and
  // shoppers in front
  for(const [k,z] of [584.5,590.5,596.5,603.5,609.2].entries()){const x=-30.5,y=on(x,z),cc=[WH,0x2f6b4f,WH,0xb8322a,WH][k];
    for(const sx of [-1.3,1.3])for(const sz of [-1.3,1.3])F.box(0.07,2.4,0.07,TR,x+sx,y+1.2,z+sz);F.cyl(0,2.05,0.8,4,cc,x,y+2.8,z,Math.PI/4);
    F.box(0.8,0.78,2.6,0xa6743e,x+0.9,y+0.39,z);for(let i=0;i<5;i++)F.box(0.36,0.2,0.4,rmC(k*3+i),x+0.95,y+0.88,z-1.05+i*0.52);
    spot(x-0.3,z,y,Math.PI/2,{staff:1});spot(x+2.2,z-0.5,y,-Math.PI/2);spot(x+2.3,z+0.6,y,-Math.PI/2);SOLIDS.push({x:x+0.6,z,hx:1.0,hz:1.4})}
  // shade trees round the green and along the promenade's back, benches facing in, lamps on the walks
  treeGroup('square',[[-94,584],[-82,583.2],[-42,583.2],[-32,584.5],[-94.5,606.5],[-82,608.5],[-41,608.5],[-94,595],
    [-105,569.5],[-90,569.5],[-78,569.5],[-44,569.5]].map(([x,z],i)=>treeEntry('leafy',x,z,i*1.7,0.72+(i%4)*0.07,(i*5)%6,1.1)));
  for(const x of [-92,-86,-40,-34])bench(x,609.9,Math.PI);for(const z of [586,592,606])bench(-97.2,z,Math.PI/2);for(const x of [-70,-52])bench(x,598,Math.PI);
  for(const [x,z] of [[ax-5.6,SQ.fz],[ax+5.6,SQ.fz]])bench(x,z,x<ax?Math.PI/2:-Math.PI/2);
  for(const [x,z] of [[-90,580.8],[-74,580.8],[-48,580.8],[-32,580.8],[-97.6,590],[-97.6,604],[-88,610.6],[-34,610.6],[ax-2,604.5+5],[ax+2,604.5+5]])lamp(x,z);
  // people on the lawn, in twos and threes; and a few walking round the green and along the promenade
  for(const [x,z] of [[-84,596],[-80,601],[-44,597],[-40,602],[-70,590],[-52,590],[-55,607]]){const a=(x*7+z)%6.28;spot(x,z,G(x,z),a);spot(x+Math.sin(a)*1.1,z+Math.cos(a)*1.1,G(x,z),a+Math.PI)}
  const loop=rmLine([[SQ.gx1,SQ.gz0],[SQ.gx0,SQ.gz0],[SQ.gx0,SQ.gz1],[SQ.gx1,SQ.gz1],[SQ.gx1,SQ.gz0]]),prom=rmLine([[-110,568.6],[-20,568.6],[-110,568.6]]);
  for(let k=0;k<2;k++){spot(SQ.gx1,SQ.gz0,on(SQ.gx1,SQ.gz0),0,{staff:1,path:loop,at:k*90});spot(-110,568.6,py(-110,568.6),0,{staff:1,path:prom,at:k*80+20})}
  rmAdd(R,R.r,[0,16,30,48]);

  // ---------- the Town Hall ----------
  // two floors of red brick with white trim and tall windows, a slate-grey gable roof, a portico of four columns under a
  // pediment over granite steps, and the clock tower rising from the front: a brick shaft with a clock face each way, a
  // white open belfry, a copper-green spire and a weathervane
  {const W=26,D=13,x=SQ.hx,z=SQ.hz,y=rmGroundMax(x,z,Math.PI,W,D)+0.6,H=8.6,f=SQ.hf,BR='brick';
    F.box(W+0.3,y-G(x,z)+0.6,D+0.3,0x8d8a82,x,(y+G(x,z)-0.6)/2,z);F.box(W,H,D,BR,x,y+H/2,z);
    F.box(W+0.5,0.5,D+0.5,TR,x,y+H-0.05,z);F.box(W+0.2,0.25,D+0.2,TR,x,y+4.25,z);for(const sx of [-1,1])for(const sz of [-1,1])F.box(0.5,H,0.5,TR,x+sx*W/2,y+H/2,z+sz*D/2);
    const rise=3.6,rp=Math.atan2(rise,D/2+0.5),rl=Math.hypot(rise,D/2+0.5);for(const sz of [-1,1])F.box(W+0.8,0.16,rl,'roofG',x,y+H+0.2+rise/2,z+sz*(D/4+0.25),0,sz*rp);
    for(const sx of [-1,1])F.geo(famGable(D,rise,0.2),TR,x+sx*(W/2-0.05),y+H+0.2,z);F.box(W+0.8,0.18,0.3,0x3a3d40,x,y+H+rise+0.25,z);
    // windows: tall sashes in white frames, dark glass that lights at night, on the front, the back and the ends
    const win=(wx,wy,wz,yaw)=>{const fx=Math.sin(yaw),fz=Math.cos(yaw);F.box(1.3,2.3,0.06,'glass',wx+fx*0.02,wy,wz+fz*0.02,yaw);F.box(1.5,0.12,0.12,TR,wx+fx*0.06,wy-1.2,wz+fz*0.06,yaw);
      F.box(1.6,0.3,0.12,TR,wx+fx*0.06,wy+1.3,wz+fz*0.06,yaw);for(const t of [-1,1])F.box(0.1,2.4,0.1,TR,wx+fx*0.05+Math.cos(yaw)*t*0.7,wy,wz+fz*0.05-Math.sin(yaw)*t*0.7,yaw);F.box(1.3,0.06,0.08,TR,wx+fx*0.06,wy+0.25,wz+fz*0.06,yaw)};
    for(const wy of [y+2.1,y+6.3]){for(const dx of [-11,-8.2,-5.4,5.4,8.2,11]){win(x+dx,wy,f,Math.PI);win(x+dx,wy,z+D/2,0)}for(const dx of [-2.4,0,2.4])if(wy>y+4)win(x+dx,wy,f,Math.PI);
      for(const dz of [-3,0,3])for(const sx of [-1,1])win(x+sx*W/2,wy,z+dz,sx*Math.PI/2)}
    // the doors under a fanlight, the portico and its steps
    F.box(2.2,3.0,0.1,0x1f3a2a,x,y+1.5,f-0.03);F.box(0.05,3.0,0.12,0x2b2d2f,x,y+1.5,f-0.06);F.box(2.2,0.6,0.06,'glass',x,y+3.35,f-0.03);F.box(2.6,0.15,0.15,TR,x,y+3.7,f-0.05);
    const pz=f-2.6;F.box(10.5,0.25,3.4,0xb9b6ad,x,y-0.12,f-1.7);for(const dx of [-4.2,-1.4,1.4,4.2]){F.cyl(0.33,0.36,5.9,16,WH,x+dx,y+3.0,pz);F.box(0.8,0.3,0.8,WH,x+dx,y+0.15,pz);F.box(0.85,0.25,0.85,WH,x+dx,y+6.05,pz)}
    F.box(10.4,0.9,3.6,TR,x,y+6.6,f-1.6);F.geo(famGable(10.8,2.0,3.6),TR,x,y+7.05,f-1.6,Math.PI/2);for(const t of [-1,1])F.box(6.2,0.14,3.9,'roofG',x+t*2.7,y+8.05,f-1.6,0,0,-t*0.36);
    for(let k=0;k<4;k++)F.box(11.2-k*0.2,0.15*(k+1),0.36,0xb9b6ad,x,G(x,f-3.4-(3-k)*0.36)+0.15*(k+1)/2,f-3.5-(3-k)*0.36);
    walkPad(x,f-1.7,5.2,1.7,0,y);walkPad(x,f-4.12,5.6,0.72,0,0,{l:0.02,rise:0.58});
    famSign(['TOWN HALL','Town of Lakeside · 1889'],5.2,0.8,x,y+6.6,f-3.42,Math.PI,'#e9e6dc','#1f3a5f');
    // the tower: its shaft from the ridge, the clock faces, the belfry, the spire
    const tz=f+2.6,t0=y+H,c0=t0+4.2,b0=c0+3.2;F.box(5,c0+0.2-y,5,BR,x,(c0+0.2+y)/2,tz);F.box(5.4,0.35,5.4,TR,x,c0+0.2,tz);F.box(5.2,0.3,5.2,TR,x,t0+1.2,tz);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,fx=Math.sin(a),fz=Math.cos(a),cx=x+fx*2.52,cz=tz+fz*2.52,cy=t0+2.75;F.cyl(1.15,1.15,0.06,32,0xf4f1e6,cx,cy,cz,a,Math.PI/2);F.cyl(1.25,1.25,0.04,32,0x2a2c2f,cx-fx*0.01,cy,cz-fz*0.01,a,Math.PI/2);
      for(let h=0;h<12;h++){const ha=h*Math.PI/6;F.box(0.05,h%3?0.12:0.22,0.02,0x111111,cx+fx*0.04+Math.cos(a)*Math.sin(ha)*0.95,cy+Math.cos(ha)*0.95,cz+fz*0.04-Math.sin(a)*Math.sin(ha)*0.95,a,0,-ha)}
      for(const [len,wd] of [[0.6,0.07],[0.9,0.05]]){const g=new THREE.BoxGeometry(wd,len,0.02).translate(0,len/2-0.08,0),m=new THREE.Mesh(g,M(0x111111));m.position.set(cx+fx*0.06,cy,cz+fz*0.06);m.rotation.order='YXZ';m.rotation.y=a;scene.add(m);SQ.hands.push(m)}}
    for(const sx of [-1,1])for(const sz of [-1,1])F.box(0.5,3.0,0.5,WH,x+sx*1.85,c0+0.35+1.5,tz+sz*1.85);for(const sx of [-1,1]){F.box(4.2,0.12,0.12,WH,x,c0+1.1,tz+sx*1.85);F.box(0.12,0.12,4.2,WH,x+sx*1.85,c0+1.1,tz)}
    F.box(4.3,0.45,4.3,WH,x,b0+0.2,tz);F.cyl(0,3.1,5.6,8,0x4f7a6a,x,b0+3.2,tz,Math.PI/8);F.cyl(0.12,0.12,0.25,10,0xc9a640,x,b0+6.1,tz);F.cyl(0.02,0.02,1.2,4,0x2a2c2f,x,b0+6.7,tz);F.box(0.05,0.05,1.0,0x2a2c2f,x,b0+7.0,tz,0.6);
    SOLIDS.push({x,z,hx:W/2+0.2,hz:D/2+0.2});for(const dx of [-4.2,-1.4,1.4,4.2])SOLIDS.push({x:x+dx,z:pz,hx:0.4,hz:0.4})}
  K.add();famAdd(F);famAddSpot('lamp',LK);famAddSpot('bench',BK)})();
// the town clock keeps the game's time (dnMin, daynight.js); its hands move once a game minute
let sqMin=-1;
function sqTick(){if(!SQ.hands.length)return;const m=Math.floor(dnMin(dn.t));if(m===sqMin)return;sqMin=m;
  for(let i=0;i<SQ.hands.length;i++){const h=SQ.hands[i];h.rotation.z=-(i%2?(m%60)/60:((m/60)%12)/12)*Math.PI*2}}
