// Corley's Island: the mainland across the lake (mainHeight in terrain.js). To the north the field and woods: a mown
// hayfield with a fence and round bales east of the trail, a pine and leaf woods west of it. To the south the lakeside
// town: a boardwalk on the beach, a marina (marina.js), Main Street with a block of shops each side and a cross street. Both are
// reached by temporary crossings, a timber trestle (BRIDGES with temp set) and a rock causeway (CAUSEWAYS); the crane
// on its barge replaces the trestles with steel spans one at a time (mainTick).
const mainGround=[groundPatch(-514,514,-640,-196,4,[MAIN_FINE[0]]),groundPatch(...MAIN_FINE[0],1,[]),
  groundPatch(...MAIN_TOWN,4,[MAIN_FINE[1]]),groundPatch(...MAIN_FINE[1],1,[]),groundPatch(-702,702,480,1068,6,[MAIN_TOWN,MAIN_FOOT]),
  groundPatch(...MAIN_FOOT,4,[MAIN_ROAD]),groundPatch(...MAIN_ROAD,2,[])];
// where a finer mesh meets a coarser one, its edge takes the coarser one's straight runs (the side x0, x1, z0 or z1 of
// patch P, from lo to hi along it, against cells of CO metres from o), so no crack opens between them
function mainStitch(P,side,lo,hi,CO,o){const pa=P.g.attributes.position,ax=side[0]==='x',fix=side[1]==='0'?0:ax?P.NX:P.NZ;
  for(let k=0;k<=(ax?P.NZ:P.NX);k++){const i=ax?fix:k,j=ax?k:fix,x=P.X0+i*P.CO,z=P.Z0+j*P.CO,t=ax?z:x;if(t<lo||t>hi)continue;
    const c0=o+Math.floor((t-o)/CO+1e-6)*CO,f=(t-c0)/CO;if(f<1e-6)continue;const h0=ax?baseHeight(x,c0):baseHeight(c0,z),h1=ax?baseHeight(x,c0+CO):baseHeight(c0+CO,z);
    pa.array[(j*P.VX+i)*3+1]=h0+(h1-h0)*f}pa.needsUpdate=true}
{const [,,T,,,Fo,R]=mainGround;for(const sd of ['x0','x1'])mainStitch(R,sd,780,952,4,780);for(const sd of ['z0','z1'])mainStitch(R,sd,-110,110,4,-258);
  for(const sd of ['x0','x1']){mainStitch(Fo,sd,780,1068,6,480);mainStitch(T,sd,480,780,6,480)}mainStitch(Fo,'z1',-258,258,6,-702);
  for(const [a,b] of [[-450,-258],[258,450]])mainStitch(T,'z1',a,b,6,-702)}

// a kit's meshes in a group that can be shown or hidden
function mainGroup(K){const g=new THREE.Group();
  if(K.solid.length){const m=new THREE.Mesh(famMerge(K.solid),famMat);m.castShadow=true;m.receiveShadow=true;g.add(m)}
  if(K.glow.length)g.add(new THREE.Mesh(famMerge(K.glow),famGlowMat));if(K.win.length)g.add(new THREE.Mesh(famMerge(K.win),famWinMat));scene.add(g);return g}
// a round bar from a to b ([x, y, z]) into a kit
function mainRod(K,a,b,r,col,seg){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l=Math.hypot(dx,dy,dz);if(l<1e-4)return;
  K.geo(new THREE.CylinderGeometry(r,r,l,seg||6,1,true),col,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,Math.atan2(dx,dz),Math.atan2(Math.hypot(dx,dz),dy))}

// each temporary trestle in steel-span lengths of about 20 m, the order the crane replaces them in: the south trestle
// from the mainland bridge outward, then the north one from Corley's lawn outward. Each span has its timber (tr) and
// its steel (st), one shown at a time, both on the bridge kit (bridges.js). Timber: a crosswise plank deck with running
// boards, wheel guards, a rail on posts and timber stringers on bents of creosoted piles (batter piles splayed out at
// each end), cross-braced. Steel, to match Corley's bridge: two riveted plate girders in grey with stiffeners and
// cross frames, a concrete deck with curbs and a lattice railing, on a pipe-pile bent (or a concrete seat where the
// ground is close) at the far end, and at the near end of the first span
const crnSpans=[];
function mainSpanKits(b){
  const L=b.len,F=brFrame(b),Y=F.Y,hw=b.hw,NS=Math.max(1,Math.round(L/20)),SL=L/NS,NB=Math.max(2,Math.round(L/6)),at=(t,u,dy)=>F.P(t,u,Y(t)+dy),V=(x,y,z)=>new THREE.Vector3(x,y,z);
  for(let i=0;i<NS;i++){const t0=i*SL,t1=t0+SL,tm=t0+SL/2,last=i===NS-1,T=brKit(F),S=brKit(F);
    T.seg('planks',at(t0,0,-0.09),at(t1,0,-0.09),2*hw,0.18,{uv:'local'});
    for(const s of [-1,1]){T.seg('beam',at(t0,s*1.15,0.025),at(t1,s*1.15,0.025),0.6,0.05);T.seg('creo',at(t0,s*(hw-0.2),0.16),at(t1,s*(hw-0.2),0.16),0.3,0.25);
      T.seg('creo',at(t0,s*(hw+0.1),1.0),at(t1,s*(hw+0.1),1.0),0.12,0.2);T.seg('creo',at(t0,s*(hw+0.1),0.55),at(t1,s*(hw+0.1),0.55),0.1,0.16);
      for(let t=Math.ceil(t0/2.4)*2.4;t<t1-0.01||(last&&t<=t1+0.01);t+=2.4)T.seg('creo',at(t,s*(hw+0.1),0),at(t,s*(hw+0.1),1.1),0.2,0.2)}
    for(const u of [-2.4,-0.8,0.8,2.4])T.seg('creo',at(t0,u,-0.48),at(t1,u,-0.48),0.3,0.6);
    const trW=[],stW=[],wall=(Wl,t,u,r)=>{const [ax,az]=F.W(t,-u),[bx,bz]=F.W(t,u);Wl.push({ax,az,bx,bz,r})};
    for(let k=0;k<=NB;k++){const t=k*L/NB;if(t<t0-1e-6||(t>=t1-1e-6&&!(last&&t<=t1+1e-6)))continue;const top=Y(t)-1.0;T.box('creo',2*hw+0.9,0.45,0.5,t,0,top);wall(trW,t,hw+0.2,0.35);
      let lo=1e9;for(const u of [-2.4,0,2.4]){const [x,z]=F.W(t,u),g=baseHeight(x,z),h=top-0.2-g;lo=Math.min(lo,g);if(h>0.3)T.rod('creo',V(x,g,z),V(x,top-0.2,z),0.19,{seg:10,r1:0.17})}
      for(const s of [-1,1]){const [x,z]=F.W(t,s*3.3),h=top-0.2-baseHeight(x,z);if(h>0.6){const [xb,zb]=F.W(t,s*(3.3+h/6));T.rod('creo',V(xb,baseHeight(xb,zb),zb),V(x,top-0.2,z),0.18,{seg:10,r1:0.16,det:1})}}
      const hb=Math.min(3.2,top-0.4-Math.max(lo,WATER+0.2));
      if(hb>0.6)for(const sg of [-1,1])T.seg('creo',F.P(t+sg*0.22,-2.6,top-0.4-hb),F.P(t+sg*0.22,2.6,top-0.4),0.12,0.24,{S:F.A})}
    S.seg('concOld',at(t0,0,-0.15),at(t1,0,-0.15),2*hw+0.8,0.3);S.seg('asphalt',at(t0,0,-0.005),at(t1,0,-0.005),2*hw-0.7,0.05);
    for(const s of [-1,1]){const g=s*2.2,ur=s*(hw+0.3);S.seg('concOld',at(t0,s*(hw+0.15),0.12),at(t1,s*(hw+0.15),0.12),0.4,0.25);
      S.seg('paintS',at(t0,g,-0.78),at(t1,g,-0.78),0.05,0.9);for(const dy of [-0.32,-1.24])S.seg('paintS',at(t0,g,dy),at(t1,g,dy),0.5,0.06);
      for(const dy of [-0.28,-1.28])S.seg('rivetS',at(t0,g,dy),at(t1,g,dy),0.54,0.02,{det:1});
      for(let t=t0+1.5;t<t1;t+=2.5)for(const f of [-1,1])S.seg('paintS',at(t,g+f*0.125,-1.2),at(t,g+f*0.125,-0.36),0.2,0.03);
      S.seg('paintS',at(t0,ur,1.1),at(t1,ur,1.1),0.09,0.09);S.seg('paintS',at(t0,ur,0.3),at(t1,ur,0.3),0.07,0.07);
      for(let t=t0+0.5;t<t1;t+=2)S.seg('paintS',at(t,ur,0.24),at(t,ur,1.14),0.09,0.09);
      S.quad('xlatS',[at(t0,ur,0.34),at(t1,ur,0.34),at(t1,ur,1.06),at(t0,ur,1.06)],[[t0,0],[t1,0],[t1,0.5],[t0,0.5]],{det:1})}
    for(let t=t0+2.5;t<t1-1;t+=5)for(const s of [-1,1])S.rod('paintS',at(t,-2.2*s,-0.4),at(t,2.2*s,-1.2),0.04,{seg:6,det:1});
    for(const t of i===0?[t0,t1]:[t1]){const capY=Y(t)-1.6,[cx,cz]=F.W(t,0),gc=baseHeight(cx,cz);
      if(gc>capY-0.6){S.box('concOld',2*hw+1,Y(t)-0.3-gc+1,1.6,t,0,(Y(t)-0.3+gc-1)/2);continue}
      S.box('paintS',2*hw+1,0.7,0.9,t,0,capY);wall(stW,t,2.2,0.5);for(const u of [-2.2,2.2]){const [x,z]=F.W(t,u),g=baseHeight(x,z)-1,h=capY-0.35-g;if(h>0.3)S.rod('rust',V(x,g,z),V(x,capY-0.35,z),0.45,{seg:14})}}
    const tr=new THREE.Group(),st=new THREE.Group();scene.add(tr,st);T.add(tr);S.add(st);st.visible=false;crnSpans.push({b,i,t0,t1,tm,SL,W:F.W,Y,tr,st,last,trW,stW})}
  // a yellow limit sign at each end, taken down when the last span is steel
  const yaw=F.yaw;b.signs=[];for(const [t,ry] of [[-1.5,yaw+Math.PI],[L+1.5,yaw]]){const [x,z]=F.W(t,hw+1.3),y=baseHeight(x,z),K=famKit();
    for(const s of [-1,1]){const [px,pz]=F.W(t,hw+1.3+s*1.9);K.box(0.12,2.5,0.12,0x8a8a86,px,y+1.25,pz)}
    b.signs.push(mainGroup(K),famSign(['TEMPORARY BRIDGE','10 MPH · 40 TON LIMIT'],4.4,1.5,x,y+2.0,z,ry,'#e2b52a','#1a1a1a'))}}
mainSpanKits(BRIDGES[4]);mainSpanKits(BRIDGES[5]);

// ---------- the crane on its barge ----------
// a lattice-boom crawler crane on a deck barge that works its way along each trestle: for every span it lifts a steel
// pipe pile off the barge, upends it over the pier, drives it with the vibratory hammer, then sets a plate girder, and
// the span turns to steel. CRN.n spans are done and CRN.t seconds into the next (saved with the site, save.js); a span
// takes TU.craneSpan seconds. The barge (local x toward the bridge, z along it): hull, raked ends, spud poles, bollards,
// the pile stack and girder stack on the far side, a tool house; the crane's slew centre stands at CRN_SX
const CRN={n:0,t:0},CRN_LB=38,CRN_SX=2.8,CRN_DY=1.0,CRN_PILE=[-2.6,-9],CRN_GIRD=[-3.0,7];
const crnBarge=new THREE.Group(),crnUpper=new THREE.Group(),crnBoom=new THREE.Group(),crnHook=new THREE.Group();
const crnLines=[],crnPile=new THREE.Group(),crnGird=new THREE.Group();let crnHam=null;
(function(){const B=famKit(),HULL=0x2e3438,DK=0x5d5f5c,RUST=0x7d5a43,YEL=0xe5b322,DARK=0x2a2c2e,D=CRN_DY;
  B.box(12,2.2,29,HULL,0,-0.1,0);for(const s of [-1,1])B.box(12,2.2,2.6,HULL,0,0.25,s*15.2,0,s*0.5);
  B.box(11.6,0.06,28.6,DK,0,D,0);for(const s of [-1,1]){B.box(0.25,0.35,29,0x8a5a3a,s*5.85,D+0.18,0);B.box(11.9,0.35,0.25,0x8a5a3a,0,D+0.18,s*14.4)}
  for(const [x,z] of [[-5.3,-12],[5.3,-12],[-5.3,0],[5.3,0],[-5.3,12],[5.3,12]])B.cyl(0.22,0.26,0.6,10,DARK,x,D+0.3,z);
  for(const z of [-13.4,13.4]){B.box(1.6,2.6,1.6,0x3d4246,-5.2,D+1.0,z);B.cyl(0.45,0.45,17,12,0x3d4246,-5.2,D+3.5,z);B.cyl(0.46,0.46,0.6,12,YEL,-5.2,D+11.8,z)}
  // the pipe piles in a stack on timber dunnage, and the plate girders upright on blocking
  for(const z of [-14,-9,-4])B.box(5,0.25,0.4,0x6e5236,-2.4,D+0.13,z);
  {const rows=[[-4.1,-3.2,-2.3,-1.4],[-3.65,-2.75,-1.85],[-3.2,-2.3]];rows.forEach((r,k)=>r.forEach(x=>B.cyl(0.45,0.45,14,14,RUST,x,D+0.7+k*0.78,CRN_PILE[1],0,Math.PI/2)))}
  for(const z of [0,7,14])B.box(5,0.3,0.5,0x6e5236,-3,D+0.15,z);
  for(const x of [-4.4,-3.0,-1.6]){const y=D+0.3;B.box(0.05,0.9,18,0x6b7a84,x,y+0.5,CRN_GIRD[1]);for(const dy of [0.04,0.96])B.box(0.5,0.06,18,0x6b7a84,x,y+dy,CRN_GIRD[1])}
  B.box(2.4,2.3,3,0xd9d4c4,-4.2,D+1.15,-13.5+0.4);B.box(2.6,0.15,3.2,0x8a8a86,-4.2,D+2.35,-13.1);
  B.cyl(0.32,0.32,0.08,12,0xe0661e,5.95,D+1.2,6,0,0,Math.PI/2);
  crnBarge.add(mainGroup(B));
  // the crawler base: two track frames with shoes and idlers, the carbody and slewing ring
  const C=famKit();for(const s of [-1,1]){const x=CRN_SX+s*2.05;C.box(1.0,1.0,6.2,DARK,x,D+0.55,0);
    for(let z=-3.0;z<=3.01;z+=0.42){C.box(1.1,0.08,0.34,0x3a3c3e,x,D+1.08,z);C.box(1.1,0.08,0.34,0x3a3c3e,x,D+0.04,z)}
    for(const z of [-3.1,3.1])C.cyl(0.5,0.5,1.12,12,0x3a3c3e,x,D+0.55,z,0,0,Math.PI/2)}
  C.box(3.2,0.8,3.4,YEL,CRN_SX,D+0.9,0);C.cyl(1.5,1.6,0.35,18,DARK,CRN_SX,D+1.45,0);
  crnBarge.add(mainGroup(C));
  // the upper works (turns): machinery deck, house, cab, counterweight, A-frame gantry, boom foot and hoist drums
  const U=famKit();U.box(4.4,0.4,7.4,YEL,0,0.2,-0.6);U.box(3.6,2.3,5,YEL,0.3,1.55,-1.6);U.box(3.7,0.12,5.1,0x8a8a86,0.3,2.76,-1.6);
  U.box(1.2,1.9,2.1,YEL,-1.65,1.35,1.7);U.box(1.22,1.1,0.06,0x2c3a44,-1.65,1.6,2.76);U.box(0.06,1.0,1.7,0x2c3a44,-2.26,1.6,1.7);
  for(let k=0;k<4;k++)U.box(4.4,0.55,1.5,k%2?0x2a2c2e:0x3a3d40,0,0.7+k*0.57,-5.0);U.box(4.42,0.1,1.52,YEL,0,3.0,-5.0);
  for(const s of [-1,1]){mainRod(U,[s*1.5,0.4,-0.4],[s*0.6,6.4,-2.4],0.1,YEL);mainRod(U,[s*1.5,0.4,-4.2],[s*0.6,6.4,-2.4],0.1,YEL)}
  mainRod(U,[-0.7,6.4,-2.4],[0.7,6.4,-2.4],0.12,YEL);U.cyl(0.25,0.25,1.8,10,DARK,0,6.4,-2.4,0,0,Math.PI/2);
  for(const z of [-0.2,-1.4])U.cyl(0.42,0.42,2.4,14,DARK,0.3,1.0,z,0,0,Math.PI/2);
  U.cyl(0.09,0.09,1.2,8,DARK,1.6,3.3,-3.4);for(const s of [-1,1])mainRod(U,[s*1.4,0.8,2.05],[s*1.4,0.8,3.2],0.18,DARK);
  crnUpper.add(mainGroup(U));crnUpper.position.set(CRN_SX,D+1.65,0);crnBarge.add(crnUpper);
  // the boom: four chords, lacing on every face, tapering into the head with its sheaves; built along +z
  const M=famKit(),sz=z=>z<CRN_LB-4?0.65:0.65-0.3*(z-(CRN_LB-4))/4;
  for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){mainRod(M,[a*0.65,b*0.65,0],[a*0.65,b*0.65,CRN_LB-4],0.07,YEL);mainRod(M,[a*0.65,b*0.65,CRN_LB-4],[a*0.35,b*0.35,CRN_LB],0.07,YEL)}
  for(let z=0,k=0;z<CRN_LB-0.5;z+=1.4,k++){const z2=Math.min(CRN_LB,z+1.4),s1=sz(z),s2=sz(z2),f=k%2?1:-1;
    mainRod(M,[-s1,f*s1,z],[s2,f*s2,z2],0.035,YEL);mainRod(M,[f*s1,-s1,z],[f*s2,s2,z2],0.035,YEL);
    mainRod(M,[s1,-f*s1,z],[-s2,-f*s2,z2],0.035,YEL);mainRod(M,[-f*s1,s1,z],[-f*s2,-s2,z2],0.035,YEL)}
  M.cyl(0.18,0.18,2.0,8,DARK,0,0,0,0,0,Math.PI/2);for(const x of [-0.25,0.25])M.cyl(0.55,0.55,0.12,14,DARK,x,0.1,CRN_LB+0.2,0,0,Math.PI/2);
  crnBoom.add(mainGroup(M));crnBoom.position.set(0,1.0,2.0);crnUpper.add(crnBoom);
  // the hook block, the loads and the lines (pendants and hoist falls), placed every frame
  const H=famKit();H.box(0.7,1.0,0.45,YEL,0,-0.5,0);H.cyl(0.32,0.32,0.5,12,DARK,0,-0.2,0,0,0,Math.PI/2);H.cyl(0.1,0.1,0.35,8,DARK,0,-1.15,0);
  H.geo(new THREE.TorusGeometry(0.24,0.07,6,12,Math.PI*1.4),DARK,0,-1.55,0,0,0,Math.PI*0.8);
  crnHook.add(mainGroup(H));crnBarge.add(crnHook);
  // a pile (its centre at the group's origin) and the vibratory hammer clamped on its top
  const P=famKit();P.cyl(0.45,0.45,14,14,RUST,0,0,0);crnPile.add(mainGroup(P));
  const VH=famKit();VH.box(1.2,1.6,1.0,0x3a6e8f,0,7.8,0);VH.box(0.5,0.4,0.5,DARK,0,8.8,0);crnHam=mainGroup(VH);crnPile.add(crnHam);crnPile.visible=false;scene.add(crnPile);
  const G=famKit();G.box(0.05,0.9,1,0x6b7a84,0,-0.5,0);for(const dy of [-0.04,-0.96])G.box(0.5,0.06,1,0x6b7a84,0,dy,0);
  crnGird.add(mainGroup(G));crnGird.visible=false;scene.add(crnGird);
  const lm=new THREE.MeshBasicMaterial({color:0x1d1f21});for(let k=0;k<6;k++){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1,4,1,true),lm);scene.add(m);crnLines.push(m)}
  scene.add(crnBarge)})();
// a line between two world points
function crnLine(m,a,b){const d=new THREE.Vector3().subVectors(b,a),l=d.length();m.position.copy(a).addScaledVector(d,0.5);m.scale.set(1,Math.max(0.01,l),1);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.divideScalar(l||1))}
// where the barge lies for span k: 16 m east of the trestle, abreast of the span (or farther out, where the water is
// deep enough to float it), its long side along the bridge and the crane's side toward it
function crnBargeAt(k){const s=crnSpans[Math.min(k,crnSpans.length-1)],b=s.b,yaw=Math.atan2(b.ux,b.uz),u=s.W(0,16)[0]>s.W(0,0)[0]?16:-16;
  let t=s.tm;for(let g=0;g<20&&baseHeight(...s.W(t,u))>WATER-1.5;g++)t+=3;const [x,z]=s.W(t,u);return {x,z,yaw:yaw+(u<0?Math.PI:0)}}
// the hook's way through one span, in the barge's own frame: [share of the span's time, x, z, hook height], the crane
// swinging between them; pile: carried from 0.08, upended 0.18-0.26, driven 0.30-0.42; girder: carried 0.59-0.84
function crnKeys(s,toL){const P=CRN_PILE,G=CRN_GIRD,D=CRN_DY,[px,pz]=toL(...s.W(s.t1,0)),[gx,gz]=toL(...s.W(s.tm,0));
  const [bx,bz]=s.W(s.t1,0),bed=baseHeight(bx,bz)-1,top=s.Y(s.t1)-1.95-WATER,drop=Math.max(bed-WATER+14,top)+2.2,hi=D+17,gy=s.Y(s.tm)-0.3-WATER+1.2;
  return [[0,12,3,hi],[0.05,P[0],P[1],D+5],[0.08,P[0],P[1],D+3.1],[0.12,P[0],P[1],hi],[0.24,px,pz,hi+4],[0.30,px,pz,drop],[0.42,px,pz,top+2.2],[0.46,px,pz,top+7],
    [0.56,G[0],G[1],D+5],[0.59,G[0],G[1],D+3.2],[0.63,G[0],G[1],hi],[0.76,gx,gz,hi],[0.84,gx,gz,gy],[0.88,gx,gz,gy+5],[1,12,3,hi]]}
function crnPose(keys,u){let i=0;while(i<keys.length-2&&u>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],f=ss(0,1,(u-a[0])/(b[0]-a[0]));
  const pa=Math.atan2(a[1]-CRN_SX,a[2]),pb=Math.atan2(b[1]-CRN_SX,b[2]);let dA=pb-pa;while(dA>Math.PI)dA-=2*Math.PI;while(dA<-Math.PI)dA+=2*Math.PI;
  const ra=Math.hypot(a[1]-CRN_SX,a[2]),rb=Math.hypot(b[1]-CRN_SX,b[2]);return {th:pa+dA*f,r:ra+(rb-ra)*f,y:a[3]+(b[3]-a[3])*f}}
// shows spans 0..n-1 as steel (and span n too once its girder is down)
function crnShow(n,u){crnSpans.forEach((s,k)=>{const steel=k<n||(k===n&&u>=0.86);s.tr.visible=!steel;s.st.visible=steel});
  for(const b of [BRIDGES[4],BRIDGES[5]]){const left=crnSpans.some((s,k)=>s.b===b&&!(k<n||(k===n&&u>=0.86)));for(const g of b.signs)if(g)g.visible=left}}
const crnV=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
function mainTick(dt){rmWinTick();sqTick();rmDoorsTick(dt);rmInsideTick(dt);
  const NS=crnSpans.length,T=Math.max(10,TU.craneSpan);
  if(CRN.n<NS){CRN.t+=dt;if(CRN.t>=T){CRN.t=0;CRN.n++;if(typeof site!=='undefined')site.dirty=true;
      const s=crnSpans[CRN.n-1],near=Math.hypot(camera.position.x-crnBarge.position.x,camera.position.z-crnBarge.position.z)<320;
      if(near)toast(say(s.last?'bridgeDone':'spanDone',{bridge:s.b===BRIDGES[4]?'town':'north',left:crnSpans.filter((q,k)=>k>=CRN.n&&q.b===s.b).length}),'good')}
    else if((CRN.saveT=(CRN.saveT||0)+dt)>30){CRN.saveT=0;if(typeof site!=='undefined')site.dirty=true}}
  const k=Math.min(CRN.n,NS-1),done=CRN.n>=NS,u=done?0:CRN.t/T,s=crnSpans[k];
  // the barge: abreast of the span, moving on to the next one once the girder is set (same trestle only)
  const A=crnBargeAt(done?NS-1:k);let bx=A.x,bz=A.z;
  if(!done&&u>0.9&&k+1<NS&&crnSpans[k+1].b===s.b){const B2=crnBargeAt(k+1),f=ss(0.9,1,u);bx+=(B2.x-bx)*f;bz+=(B2.z-bz)*f}
  crnBarge.position.set(bx,WATER+0.05*Math.sin(timeU.value*0.7),bz);crnBarge.rotation.set(0.006*Math.sin(timeU.value*0.9),A.yaw,0.008*Math.sin(timeU.value*0.6));crnBarge.updateMatrixWorld();
  const cs=Math.cos(A.yaw),sn=Math.sin(A.yaw),toL=(x,z)=>{const dx=x-bx,dz=z-bz;return [dx*cs-dz*sn,dx*sn+dz*cs]};
  const p=done?{th:Math.atan2(12-CRN_SX,3),r:Math.hypot(12-CRN_SX,3),y:CRN_DY+17}:crnPose(crnKeys(s,toL),u);
  // slew toward the hook, boom up or down to its radius, the hook hanging under the head
  const phi=Math.acos(Math.max(0.17,Math.min(0.97,(p.r-2.0)/CRN_LB)));crnUpper.rotation.y=p.th;crnBoom.rotation.x=-phi;crnBarge.updateMatrixWorld();
  const tip=crnBoom.localToWorld(crnV[0].set(0,0.1,CRN_LB+0.2)),hy=Math.min(p.y+WATER,tip.y-2);crnHook.position.copy(crnBarge.worldToLocal(crnV[1].set(tip.x,hy,tip.z)));
  const hook=crnV[1].set(tip.x,hy,tip.z);
  for(const s2 of [-1,1]){crnLine(crnLines[s2<0?0:1],crnUpper.localToWorld(crnV[2].set(s2*0.6,6.4,-2.4)),crnBoom.localToWorld(crnV[3].set(s2*0.3,0.3,CRN_LB)));
    crnLine(crnLines[s2<0?2:3],crnV[2].set(tip.x+s2*0.12,tip.y-0.4,tip.z),crnV[3].set(hook.x+s2*0.12,hook.y-0.3,hook.z))}
  crnLine(crnLines[4],crnUpper.localToWorld(crnV[2].set(0.3,1.4,-0.2)),crnBoom.localToWorld(crnV[3].set(0,0.6,1.5)));
  crnLine(crnLines[5],crnBoom.localToWorld(crnV[2].set(0,0.6,1.5)),crnBoom.localToWorld(crnV[3].set(0,0.4,CRN_LB-1)));
  // the loads: the pile hangs from the hook, swings upright and is driven; the girder hangs level along the bridge
  crnPile.visible=!done&&u>=0.08&&u<0.88;crnGird.visible=!done&&u>=0.59&&u<0.88;
  if(crnPile.visible){const up=u<0.42?ss(0.18,0.26,u):1,[px,pz]=s.W(s.t1,0),hold=u>=0.42,jit=u>0.3&&u<0.42?0.03*Math.sin(timeU.value*70):0;
    if(hold)crnPile.position.set(px,s.Y(s.t1)-1.95-7,pz);else crnPile.position.set(hook.x+jit,hy-0.9-8.3*up,hook.z);
    crnPile.rotation.set((1-up)*Math.PI/2,A.yaw,0,'YXZ');crnHam.visible=up>0.5&&!hold}
  if(crnGird.visible){const hold=u>=0.84,[gx,gz]=s.W(s.tm,0);crnGird.position.set(hold?gx:hook.x,hold?s.Y(s.tm)-0.3:hy-1.2,hold?gz:hook.z);
    crnGird.rotation.set(0,Math.atan2(s.b.ux,s.b.uz),0);crnGird.scale.set(1,1,s.SL)}
  crnShow(CRN.n,u)}
function craneSave(){return {n:CRN.n,t:Math.round(CRN.t)}}
function craneLoad(d){if(d&&isFinite(d.n)){CRN.n=Math.max(0,Math.min(crnSpans.length,d.n|0));CRN.t=Math.max(0,+d.t||0)}crnShow(CRN.n,CRN.t/Math.max(10,TU.craneSpan))}

// the town's shop signs: one picture holds the first 32 (MAIN_SHOPS, two columns of 16; the waterfront's draw in their own), drawn as one mesh once the lots are
// built (mainSignsAdd). Each: its name, a line under it, the board colour and the lettering colour, serif or not
const MAIN_SHOPS=[["Lakeside Bakery","Bread · Pies · Coffee","#2f4a3a","#e9d9a6",1],["Harbor Books","New & Used","#1f3a5f","#f1ead8",1],
  ["Pine & Anchor","Cafe","#e9e1cc","#23402f",0],["Ridge Outfitters","Camp · Fish · Hike","#3a2a20","#e0b45a",0],["Hometown Hardware","Since 1948","#b8322a","#ffffff",0],
  ["Main St. Diner","Breakfast All Day","#e9e1cc","#b8322a",0],["Lakeside Pharmacy","Rx · Gifts","#ffffff","#1f5a7a",0],["Post Office","U.S. Mail","#1f3a5f","#ffffff",0],
  ["First Lake Bank","Est. 1912","#23402f","#e0c27a",1],["Barber Shop","Walk-ins Welcome","#2b2d2f","#f1ead8",1],["Wildflower","Florist","#e8d6dc","#6b2a44",1],
  ["Mountain Coffee","Roasted Here","#3a2a20","#f1ead8",0],["Lakeside Pizza","Slices · Pies","#23402f","#f4d27a",0],["Antiques","& Oddities","#5a2a22","#e9d9a6",1],
  ["Tackle & Trail","Bait · Licenses","#2f5a33","#ffffff",0],["The Sweet Shop","Fudge · Candy","#f3d9e2","#8a2a52",1],["Lake Realty","Homes · Cabins · Land","#ffffff","#1f3a5f",0],
  ["Village Deli","Sandwiches","#e9e1cc","#2f4a3a",0],["Gallery on Main","Local Art","#2b2d2f","#ffffff",1],["Toy Chest","Toys · Games","#2a5f9a","#f4d27a",0],
  ["Laundromat","Open 7 Days","#ffffff","#2a5f9a",0],["Copper Kettle","Pub & Grill","#2b2d2f","#d08a42",1],["Bike & Paddle","Rentals · Repairs","#d08a22","#ffffff",0],
  ["Lakeview Hotel","Rooms","#1f3a5f","#e0c27a",1],["Corner Market","Groceries","#2f6b4f","#ffffff",0],["Quilt Barn","Fabric · Yarn","#7e2f26","#f1ead8",1],
  ["Hair Studio","Cuts · Color","#e9e1cc","#2b2d2f",1],["Lakeside Guns","Firearms · Ammo","#2b2d2f","#d8b25a",0],["Town Library","Books · Story Time","#23402f","#f1ead8",1],
  ["Town Hall","Lakeside","#e9e6dc","#1f3a5f",1],["Ice House","Ice · Firewood","#2a5f9a","#ffffff",0],["Lakeside Theater","Movies Fri · Sat","#5a2a22","#f4d27a",1],
  // the waterfront's own (waterfront.js): drawn in its own picture
  ["Salt & Line","Fish Shack · Chowder","#f1ead8","#1f3a5f",0],["Shoreline Gifts","Gifts · Tees · Postcards","#2a6f76","#f6f1e4",1],
  ["The Rusty Anchor","Bar · Patio","#2b2d2f","#c9783a",1],["Paddle & Pedal","Kayak · Bike Rentals","#f4d27a","#1f3a5f",0]];
const mainSignList=[],MAIN_GAPS=[],MAIN_BACKS=[],MAIN_GRIME=[];
// weathering decals, drawn as one see-through mesh over the walls and paving (mainGrimeAdd; not on Low graphics): a quad
// from its corners [x, y, z] (bottom left, bottom right, top right, top left) and its cell of the grime picture: 0 rain
// streaks, 1 a damp base, 2 an oil stain, 3 cracks, 4 a patch of newer asphalt, 5 grime washed down from a cornice, 6 a
// dirty smear
function mainGrime(a,b,c,d,k){MAIN_GRIME.push([a,b,c,d,k])}
// ...on a wall whose face is at x, z, looking along f: W wide, from y0 to y1
function mainGrimeWall(x,z,f,W,y0,y1,k){const tx=Math.cos(f)*W/2,tz=-Math.sin(f)*W/2;x+=Math.sin(f)*0.025;z+=Math.cos(f)*0.025;
  mainGrime([x-tx,y0,z-tz],[x+tx,y0,z+tz],[x+tx,y1,z+tz],[x-tx,y1,z-tz],k)}
// ...on the ground (lift over it) at x, z, sx by sz turned by r
function mainGrimeFloor(x,z,sx,sz,r,k,lift){const c=Math.cos(r),s=Math.sin(r),p=(a,b)=>{const X=x+a*c+b*s,Z=z-a*s+b*c;return [X,baseHeight(X,Z)+lift,Z]};
  mainGrime(p(-sx/2,-sz/2),p(sx/2,-sz/2),p(sx/2,sz/2),p(-sx/2,sz/2),k)}
// an upright prism over a footprint (world [x, z] points, either way round) from y0 to y1, its top capped, into kit K
function mainPrism(K,mat,pts,y0,y1){let A=0;for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];A+=p[0]*q[1]-q[0]*p[1]}
  if(A>0)pts=pts.slice().reverse();const P=[];
  for(let i=0;i<pts.length;i++){const [ax,az]=pts[i],[bx,bz]=pts[(i+1)%pts.length];P.push(ax,y0,az,bx,y0,bz,bx,y1,bz,ax,y0,az,bx,y1,bz,ax,y1,az)}
  for(const [i,j,k] of THREE.ShapeUtils.triangulateShape(pts.map(p=>new THREE.Vector2(p[0],p[1])),[])){const a=pts[i],b=pts[j],c=pts[k],
    [u,v]=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0?[c,b]:[b,c];P.push(a[0],y1,a[1],u[0],y1,u[1],v[0],y1,v[1])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));K.geo(g,mat,0,0,0)}
// a box t thick along the line from a to b (world [x, z]; e longer at each end), from y0 to y1, moved by nx, nz
function mainSeg(K,mat,a,b,t,y0,y1,nx,nz,e){const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);
  K.box(L+2*(e||0),y1-y0,t,mat,(a[0]+b[0])/2+(nx||0),(y0+y1)/2,(a[1]+b[1])/2+(nz||0),Math.atan2(-dz,dx))}
// an upper window on a wall whose face is at x, z, looking along f, its middle at height y: the glass with a lit room
// behind it (rmWinAdd, interiors.js), frame and muntins, a sill under it and a lintel over it, and the rain's streaks
// down the wall under the sill; ac: an air conditioner sitting in its lower sash
function mainWin(K,x,z,f,y,TR,ac){const sf=Math.sin(f),cf=Math.cos(f),n=(o,s)=>[x+sf*o+cf*s,z+cf*o-sf*s],[p,q]=n(0.012,0),[g,k]=n(0.04,0),[e,h]=n(0.1,0);
  rmWinAdd(p,y,q,f,1.1,1.6);K.box(1.1,1.6,0.02,'glass',g,y,k,f);
  for(const t of [-1,1]){const [m,o]=n(0.05,t*0.57);K.box(0.06,1.66,0.08,TR,m,y,o,f);K.box(1.2,0.06,0.08,TR,g,y+t*0.81,k,f)}
  K.box(0.04,1.6,0.06,TR,g,y,k,f);K.box(1.1,0.04,0.06,TR,g,y+0.15,k,f);K.box(1.4,0.1,0.18,TR,e,y-0.86,h,f);K.box(1.35,0.16,0.1,TR,e,y+0.88,h,f);
  mainGrimeWall(x,z,f,1.3,y-2.5,y-0.91,0);
  if(ac){const [a,b]=n(0.24,0.05),[c,d]=n(0.515,0.05);K.box(0.66,0.42,0.55,0xd2cfc4,a,y-0.56,b,f);K.box(0.56,0.3,0.02,0x55585b,c,y-0.56,d,f);
    const [l,m]=n(0.12,0.05);K.box(0.7,0.04,0.3,0x8a8d8f,l,y-0.79,m,f);mainGrimeWall(x,z,f,0.8,y-2.6,y-0.8,0)}}
// a shop or house on a town lot. On the face toward the street (face: the yaw it looks along) a storefront with
// pilasters, display windows over kick plates, a door, flower boxes, a striped awning in its colour and the shop's sign
// above; over it the upper floors' windows with sills and lintels, a blade sign out over the walk on some. Its walls
// are a photo-scanned library material (wl: brick, old brick, plaster or siding); col is its trim. Solid to the machines
// and the worker. Each lot is built its own way, picked from its number si and its walls unless o says (all optional):
// roof 'flat' (a parapet with a concrete coping and a cornice, a rooftop unit, vents, a hatch, now and then a water
// tank), 'gable' (gable end to the street, shingles on the wood ones and standing-seam steel on the brick, gutters and
// downspouts, a chimney) or 'false' (a Western false front hiding a corrugated gable roof); dd metres shallower (the
// front stays put); sb the top floor set back that far behind a railed terrace; c the side (±1) whose front corner is
// cut off on a street corner, with a glazed corner window and the upper floors' windows round it. Out back: a door on
// a stoop, the upper windows, downspouts, and a fire escape on some three-storey brick ones; rain streaks and damp at
// the foot of the walls (mainGrime). MAIN_BACKS keeps each lot for the alleys and the wires (mainAlleys)
function mainLot(K,x,z,w,d,h,col,face,awn,si,wl,o){wl=wl||col;o=o||{};const fx=Math.sin(face),fz=Math.cos(face),wood=String(wl).startsWith('siding'),brickW=String(wl).startsWith('brick');
  const C=o.c||0,roof=o.roof||(C?'flat':wood?(si%2?'false':'gable'):(si%5===2?'gable':'flat')),dd=o.dd!==undefined?o.dd:[0,1,2,0.5,1.5][si%5];
  if(dd&&d-dd>=9){d-=dd;x+=fx*dd/2;z+=fz*dd/2}
  const y=rmGroundMax(x,z,face,w,d)+0.03,G=baseHeight;
  const F=(o,s)=>[x+fx*o+fz*s,z+fz*o-fx*s],TR=0xe9e4d6,DK=0x2a2c2f,IRON=0x26282a,GALV=0x8f9396,c=new THREE.Color(col).multiplyScalar(0.72).getHex();
  const rows=[];for(let wy=5.7;wy+1.1<h;wy+=2.8)rows.push(wy);
  const ch=C?1.6:0,sg=C||1,sb=o.sb!==undefined?o.sb:(roof==='flat'&&!C&&rows.length&&si%3===0?2.4:0),hf=sb?Math.max(4.75,rows[rows.length-1]-1.45):h;
  // the footprint from o0 to o1 (from the back to the front), inset by i, its street corner cut off on a corner lot
  const fp=(o0,o1,i)=>{i=i||0;const W=w/2-i,a=o0+i,b=o1-i,P=[[a,-W],[b,-W]];
      if(C&&o1>=d/2-1e-3)P.push([b,w/2-ch-0.414*i],[d/2-ch-0.414*i,W]);else P.push([b,W]);P.push([a,W]);return P.map(([p,q])=>F(p,sg*q))},
    mass=(mat,o0,o1,y0,y1)=>{if(y1-y0<0.01)return;if(C&&o1>=d/2-1e-3)mainPrism(K,mat,fp(o0,o1),y0,y1);else{const [a,b]=F((o0+o1)/2,0);K.box(w,y1-y0,o1-o0,mat,a,(y0+y1)/2,b,face)}};
  // the corner's cut: from the front (P1) to the side (P2), and the way it looks
  const P1=F(d/2,sg*(w/2-ch)),P2=F(d/2-ch,sg*w/2),fc=face+C*Math.PI/4,ncx=Math.sin(fc),ncz=Math.cos(fc);
  // the walls: the back of the building, the floors over the shop (to the front wall's top hf; above it the set-back
  // top floor), and the shop's own room behind its glass, furnished and with its people's spots (interiors.js)
  const RD=Math.min(5.4,d-3),RH=2.95,F0=F(d/2-RD/2,0);mass(wl,-d/2,d/2-RD,y-1,y+h);
  mass(wl,d/2-RD,d/2,y+RH,y+hf);if(sb)mass(wl,d/2-RD,d/2-sb,y+hf,y+h);mass(wl,d/2-RD,d/2,y-1,y);
  for(const s of [-1,1]){const L=s===C?RD-ch:RD,[a,b]=F(d/2-RD+L/2,s*(w/2-0.125));K.box(0.25,RH,L,wl,a,y+RH/2,b,face)}
  rmAdd(rmFurnish(K,F0[0],F0[1],y,face,w-0.5,RD,si%MAIN_SHOPS.length,[0xf0e6d2,0xe3ecea,0xf3e3d8,0xe6e8f0,0xefe9d0][si%5]),Math.max(w,RD)/2);
  // the roof
  const ot=sb?d/2-sb:d/2,GV=0x9aa0a4,DKC=0x232527,s0=(si%2?1:-1)*w*0.2;
  // a rim round a footprint: a parapet t thick from y0 h tall (inside the edge) with a coping over it
  const rim=(pts,y0,ht,mat)=>{let cx=0,cz=0;for(const p of pts){cx+=p[0]/pts.length;cz+=p[1]/pts.length}
    for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let nx=(b[1]-a[1])/L,nz=-(b[0]-a[0])/L;
      if(nx*(cx-(a[0]+b[0])/2)+nz*(cz-(a[1]+b[1])/2)<0){nx=-nx;nz=-nz}
      mainSeg(K,mat,a,b,0.24,y0,y0+ht,nx*0.12,nz*0.12,-0.0);mainSeg(K,'concrete',a,b,0.36,y0+ht,y0+ht+0.1,nx*0.1,nz*0.1,0.05)}};
  if(roof==='flat'){
    // a scanned bitumen membrane inside a parapet with a concrete coping; a set-back top floor's terrace railed in iron
    if(C)mainPrism(K,'roofFlat',fp(-d/2,d/2,0.2),y+h,y+h+0.06);else{const [a,b]=F((ot-d/2)/2,0);K.box(w-0.4,0.06,ot+d/2-0.4,'roofFlat',a,y+h+0.03,b,face)}
    rim(fp(-d/2,ot),y+h,0.7,wl);
    if(sb){{const [a,b]=F(d/2-sb/2,0);K.box(w-0.3,0.06,sb-0.1,'roofFlat',a,y+hf+0.03,b,face)}
      const [a,b]=F(d/2-0.1,0);K.box(w,0.3,0.24,wl,a,y+hf+0.15,b,face);const [e,f]=F(d/2-0.08,0);K.box(w+0.05,0.06,0.06,IRON,e,y+hf+1.1,f,face);
      for(let s=-w/2+0.15;s<=w/2-0.1;s+=0.5){const [p,q]=F(d/2-0.08,s);K.box(0.03,0.8,0.03,IRON,p,y+hf+0.7,q,face)}
      for(const s of [-1,1])for(let t=0.4;t<sb-0.2;t+=0.5){const [p,q]=F(d/2-t,s*(w/2-0.08));K.box(0.03,0.8,0.03,IRON,p,y+hf+0.7,q,face)}
      for(const s of [-1,1]){const [p,q]=F(d/2-sb/2,s*(w/2-0.08));K.box(0.06,0.06,sb,IRON,p,y+hf+1.1,q,face)}
      // the terrace: a couple of chairs and a table
      for(const t of [-1,1]){const [p,q]=F(d/2-sb/2,s0*0.5+t*0.7);K.box(0.45,0.45,0.45,0x3d5a4a,p,y+hf+0.29,q,face)}{const [p,q]=F(d/2-sb/2,s0*0.5);K.cyl(0.35,0.35,0.04,12,0xe9e4d6,p,y+hf+0.75,q);K.cyl(0.04,0.04,0.7,6,IRON,p,y+hf+0.4,q)}}
    // a water tank on legs on some of the tall brick ones; else a hatch and a pair of mushroom vents
    if(brickW&&rows.length>1&&si%4===3&&!sb){const to=-d*0.05,[a,b]=F(to,-s0),yt=y+h+0.06;for(const [p,q] of [[-0.9,-0.9],[-0.9,0.9],[0.9,-0.9],[0.9,0.9]]){const [e,f]=F(to+p,-s0+q);K.box(0.14,3,0.14,IRON,e,yt+1.5,f,face)}
      for(const t of [-1,1]){const [e,f]=F(to+t*0.9,-s0);K.box(0.05,0.05,3.1,IRON,e,yt+1.5,f,face,Math.atan2(2.6,1.8));const [g,k]=F(to,-s0+t*0.9);K.box(3.1,0.05,0.05,IRON,g,yt+1.5,k,face,0,Math.atan2(2.6,1.8))}
      K.box(2.3,0.15,2.3,0x4a3a2c,a,yt+3.05,b,face);K.cyl(1.25,1.3,2.5,16,0x6e5640,a,yt+4.35,b);for(const t of [0.5,1.2,1.9])K.cyl(1.32,1.32,0.06,16,IRON,a,yt+3.1+t,b);K.cyl(0.06,1.42,0.9,16,0x4f4134,a,yt+6.05,b)}
    else{const [a,b]=F(-d*0.38,s0);K.box(0.95,0.35,0.95,0x8a8d8f,a,y+h+0.2,b,face);K.box(1.0,0.06,1.0,0x6e7174,a,y+h+0.4,b,face);
      for(const t of [0.12,0.3]){const [e,f]=F(d*t-(sb?sb:0),-s0*1.4);K.cyl(0.12,0.14,0.45,8,GV,e,y+h+0.25,f);K.cyl(0.25,0.25,0.14,10,GV,e,y+h+0.55,f)}}
    // the rooftop unit: on its curb, a panelled casing (scanned seam steel, tinted), louvred coil faces on its long sides,
    // the condenser fan in its guard on top; and a vent stack with flashing and a rain cap
    if(si%3){const o0=-d*0.15,U=(o,s)=>F(o0+o,s0+s),yr=y+h+0.06,CAS=famTint('seam',0xcfccc3);
      {const [a,b]=U(0,0);K.box(1.95,0.16,1.35,0x5c5e60,a,yr+0.08,b,face);K.box(1.8,0.92,1.2,CAS,a,yr+0.62,b,face);K.box(1.84,0.05,1.24,0xb9b6ad,a,yr+1.1,b,face)}
      for(const sd of [-1,1]){const [a,b]=U(sd*0.605,-0.2);K.box(1.1,0.62,0.02,DKC,a,yr+0.6,b,face);
        for(let i=0;i<8;i++){const [e,f]=U(sd*0.625,-0.2);K.box(1.1,0.022,0.06,GV,e,yr+0.33+i*0.075,f,face,sd*0.6)}
        const [e,f]=U(sd*0.61,0.62);K.box(0.42,0.7,0.012,0xbcb9b0,e,yr+0.6,f,face)}
      {const [a,b]=U(0,-0.35),fy=yr+1.14;K.cyl(0.43,0.43,0.04,20,DKC,a,fy,b);K.geo(new THREE.TorusGeometry(0.42,0.014,4,24),GV,a,fy+0.05,b,0,Math.PI/2);
        K.geo(new THREE.TorusGeometry(0.22,0.01,4,16),GV,a,fy+0.05,b,0,Math.PI/2);for(const r of [0,Math.PI/2])K.box(0.84,0.012,0.02,GV,a,fy+0.05,b,face+r);
        for(let i=0;i<3;i++)K.box(0.34,0.012,0.11,0x55595c,a,fy+0.025,b,face+i*2.094+0.3,0.25)}
      {const [a,b]=U(0,0.45);K.box(0.75,0.07,1.0,0xbfbcb3,a,yr+1.15,b,face)}
      const [e,f]=F(-d*0.3,-s0*1.25);K.cyl(0.26,0.3,0.06,10,0x3b3d3f,e,y+h+0.06,f);K.cyl(0.13,0.13,0.95,10,GV,e,y+h+0.5,f);
      K.cyl(0.07,0.07,0.08,8,GV,e,y+h+1.01,f);K.cyl(0.02,0.24,0.12,10,GV,e,y+h+1.1,f)}
    // downspouts from scuppers at the back corners
    for(const s of [-1,1]){const [a,b]=F(-d/2-0.07,s*(w/2-0.35)),g=G(a,b);K.box(0.1,y+h-g,0.1,GALV,a,(y+h+g)/2,b,face);K.box(0.22,0.14,0.14,GALV,a,y+h-0.05,b,face);
      const [e,f]=F(-d/2-0.25,s*(w/2-0.35));K.box(0.12,0.08,0.35,GALV,e,g+0.06,f,face)}
  }else{
    // a pitched roof, its gable to the street: on a false front, a shallow one behind the tall square front
    const ff=roof==='false',pt=ff?0.36:(wood?0.5:0.42),rise=w/2*pt,th=Math.atan(pt),ov=0.4,eo=0.3,sl=Math.hypot(w/2,rise)+ov;
    const mat=ff?'corrugated':wood?(si%4<2?'shingles':'roofG'):famTint('seam',[0x3f5446,0x7a3428,0x3a3d40][si%3]);
    {const [a,b]=F(0,0);K.geo(famGable(w,rise,d),wl,a,y+h,b,face-Math.PI/2)}
    for(const t of [-1,1]){const cs=t*(w/4+Math.cos(th)*ov/2),cy=h+rise/2-Math.sin(th)*ov/2,[a,b]=F(ff?-eo/2:0,cs+t*Math.sin(th)*0.06);
      K.box(sl,0.1,d+(ff?eo:2*eo),mat,a,y+cy+Math.cos(th)*0.06,b,face,0,-t*th);
      // the gutter along the eave and downspouts at its ends
      const ge=t*(w/2+Math.cos(th)*ov),gy=y+h-Math.sin(th)*ov-0.04,[p,q]=F(ff?-eo/2:0,ge);K.box(0.14,0.13,d+(ff?eo:2*eo),GALV,p,gy,q,face);
      for(const e of ff?[-1]:[-1,1]){const oe=e*(d/2-0.2),[m,n]=F(oe,t*(w/2+0.08)),g=G(m,n);K.box(0.1,gy-g,0.1,GALV,m,(gy+g)/2,n,face);
        const [u,v]=F(oe,t*(w/2+0.08+ov*0.5));K.box(0.1,0.08,ov,GALV,u,gy-0.02,v,face+Math.PI/2);const [k2,l2]=F(oe,t*(w/2+0.3));K.box(0.35,0.08,0.12,GALV,k2,g+0.06,l2,face)}}
    {const [a,b]=F(ff?-eo/2:0,0);K.box(0.3,0.12,d+(ff?eo:2*eo),ff?GALV:mat,a,y+h+rise+0.1,b,face)}
    if(ff){
      // the false front: a square front wall standing well above the ridge, with a bracketed cornice; stepped
      // shoulders on some
      const top=h+rise+0.7,st=si%4===1;{const [a,b]=F(d/2-0.15,0);K.box(w,top-h+0.01,0.3,wl,a,y+(h+top)/2,b,face)}
      if(st)for(const s of [-1,1]){const [a,b]=F(d/2-0.15,s*w/2*0.72);K.box(w*0.28,0.01,0.3,wl,a,y+top,b,face)}
      const ctop=st?top+0.7:top,cw=st?w*0.44:w;{const [a,b]=F(d/2-0.15,0);if(st)K.box(cw,0.7,0.3,wl,a,y+top+0.35,b,face);
        const [e,f]=F(d/2+0.1,0);K.box(cw+0.4,0.3,0.6,TR,e,y+ctop-0.15,f,face);const [g,k]=F(d/2+0.03,0);K.box(cw,0.3,0.12,c,g,y+ctop-0.5,k,face);
        for(let s=-cw/2+0.3;s<=cw/2-0.29;s+=(cw-0.6)/Math.max(1,Math.round((cw-0.6)/1.2))){const [p,q]=F(d/2+0.12,s);K.box(0.14,0.4,0.24,TR,p,y+ctop-0.5,q,face)}
        if(st)for(const s of [-1,1]){const [p,q]=F(d/2+0.05,s*w*0.36);K.box(w*0.28+0.2,0.16,0.4,TR,p,y+top+0.03,q,face)}}
      mainGrimeWall(...F(d/2,0),face,cw,y+ctop-2.0,y+ctop-0.65,5);
      // a vent stack through the roof
      const [e,f]=F(-d*0.25,-s0);K.cyl(0.07,0.07,rise*0.8+0.6,8,GV,e,y+h+rise*0.6,f)}
    else{
      // the gable end: rake boards along its edges, a louvred vent; a brick chimney from the ridge's back half
      for(const t of [-1,1]){const [a,b]=F(d/2+eo+0.03,t*(w/4+Math.cos(th)*ov/2));K.box(sl,0.24,0.05,TR,a,y+h+rise/2-Math.sin(th)*ov/2+0.02,b,face,0,-t*th);
        const [e,f]=F(-d/2-eo-0.03,t*(w/4+Math.cos(th)*ov/2));K.box(sl,0.24,0.05,TR,e,y+h+rise/2-Math.sin(th)*ov/2+0.02,f,face,0,-t*th)}
      {const [a,b]=F(d/2+0.03,0);K.box(0.9,1.0,0.06,TR,a,y+h+rise*0.42,b,face);const [e,f]=F(d/2+0.06,0);for(let i=0;i<5;i++)K.box(0.74,0.04,0.05,DK,e,y+h+rise*0.42-0.36+i*0.18,f,face,-0.6)}
      const cs=-s0*0.9,ry=rise*(1-Math.abs(cs)/(w/2)),[a,b]=F(-d*0.25,cs);K.box(0.75,ry+1.1,0.75,'brick',a,y+h+(ry+1.1)/2,b,face);K.box(0.85,0.1,0.85,'concrete',a,y+h+ry+1.15,b,face)}
  }
  // the cornice and frieze across the front at the front wall's top (round the corner on a corner lot), and the grime
  // washed down under it
  if(C){const nx=fx,nz=fz,sx=sg*fz,sz=-sg*fx,A0=F(d/2,-sg*(w/2+0.125)),B0=F(-d/2-0.125,sg*w/2);
    mainSeg(K,TR,A0,P1,0.36,y+hf-0.4,y+hf-0.1,nx*0.18,nz*0.18,0.1);mainSeg(K,TR,P1,P2,0.36,y+hf-0.4,y+hf-0.1,ncx*0.18,ncz*0.18,0.1);mainSeg(K,TR,P2,B0,0.36,y+hf-0.4,y+hf-0.1,sx*0.18,sz*0.18,0.1);
    mainSeg(K,c,A0,P1,0.12,y+hf-1.0,y+hf-0.5,nx*0.06,nz*0.06);mainSeg(K,c,P1,P2,0.12,y+hf-1.0,y+hf-0.5,ncx*0.06,ncz*0.06);mainSeg(K,c,P2,B0,0.12,y+hf-1.0,y+hf-0.5,sx*0.06,sz*0.06);
    mainGrimeWall((P1[0]+P2[0])/2,(P1[1]+P2[1])/2,fc,ch*1.41,y+hf-2.4,y+hf-1.0,5);mainGrimeWall(...F(-ch/2,sg*w/2),face+C*Math.PI/2,d-ch,y+hf-2.4,y+hf-1.0,5)}
  else{const [a,b]=F(d/2+0.18,0);K.box(w+0.25,0.3,0.36,TR,a,y+hf-0.25,b,face);const [e,f]=F(d/2+0.06,0);K.box(w,0.5,0.12,c,e,y+hf-0.75,f,face)}
  mainGrimeWall(...F(d/2,C?-sg*ch/2:0),face,w-ch,y+hf-2.4,y+hf-1.0,5);
  // the storefront: pilasters at the ends, a kick plate and display window each side of the door, a transom
  for(const s of [-1,1]){const cn=s===C,[a,b]=F(d/2+0.1,s*(cn?w/2-ch-0.2:w/2-0.25));K.box(cn?0.4:0.5,4.2,0.2,TR,a,y+2.1,b,face)}
  {const [a,b]=F(d/2+0.08,C?sg*(0.3-ch)/2:0);K.box(w-0.6-(C?ch-0.3:0),0.25,0.16,TR,a,y+3.05,b,face)}
  const pw=(w-0.9)/2-0.8;for(const s of [-1,1]){const pq=s===C?pw-ch:pw,so=s*(0.8+pq/2),[a,b]=F(d/2+0.05,so),[e,f]=F(d/2+0.1,so),[g,k]=F(d/2+0.35,so);
    const [gx,gz]=F(d/2-0.02,so);K.box(pq,0.6,0.1,c,a,y+0.3,b,face);K.box(pq,2.3,0.02,'glass',gx,y+1.8,gz,face);K.box(pq+0.1,0.08,0.14,TR,e,y+0.62,f,face);K.box(0.08,2.2,0.12,TR,e,y+1.75,f,face);
    K.box(pq-0.4,0.3,0.4,0x6b4a30,g,y+0.75,k,face);K.box(pq-0.5,0.16,0.36,0x3d6b2f,g,y+0.96,k,face);
    const fc2=[0xc94c6a,0xe8b923,0xf2efe6,0x8a4fa8][(si+s+4)%4];for(let q=-(pq-0.7)/2;q<=(pq-0.7)/2;q+=0.22){const [m,n]=F(d/2+0.35+((q*7)%2?0.08:-0.08),so+q);K.box(0.11,0.1,0.11,fc2,m,y+1.07,n,face+q)}}
  // the corner: a glazed display window across the cut over a kick plate, a pier at its far end
  if(C){mainSeg(K,c,P1,P2,0.1,y,y+0.6,ncx*0.05,ncz*0.05);mainSeg(K,'glass',P1,P2,0.02,y+0.65,y+2.95,-ncx*0.02,-ncz*0.02);mainSeg(K,TR,P1,P2,0.14,y+0.58,y+0.66,ncx*0.1,ncz*0.1);
    mainSeg(K,TR,P1,P2,0.16,y+2.93,y+3.18,ncx*0.08,ncz*0.08);{const [a,b]=F(d/2-ch-0.1,sg*(w/2+0.02));K.box(0.25,4.2,0.4,TR,a,y+2.1,b,face)}
    const [a,b]=[(P1[0]+P2[0])/2+ncx*0.35,(P1[1]+P2[1])/2+ncz*0.35];K.box(ch*1.41-0.6,0.3,0.4,0x6b4a30,a,y+0.75,b,fc);K.box(ch*1.41-0.7,0.16,0.36,0x3d6b2f,a,y+0.96,b,fc)}
  // the door: a glazed timber door under a glass transom, the posts each side of it
  // (the door itself swings in as the worker comes up to it: rmDoor, interiors.js)
  {const [a,b]=F(d/2+0.03,0);for(const s of [-1,1]){const [g,k]=F(d/2+0.05,s*0.7);K.box(0.22,2.95,0.16,TR,g,y+1.475,k,face)}
    K.box(1.2,0.6,0.02,'glass',a,y+2.6,b,face);const [e,f]=F(d/2+0.03,-0.6);rmDoor('shop',e,y,f,face,1.2)}
  // the awning: stripes of its colour and white canvas (scanned weave, tinted), sloping out over the walk, with a valance
  {const sA=-(w-1)/2,sB=C?w/2-ch-0.1:(w-1)/2,n=Math.max(4,Math.round((sB-sA)/0.6)),sw=(sB-sA)/n;for(let i=0;i<n;i++){const s=sg*(sA+sw*(i+0.5)),[a,b]=F(d/2+0.58,s);K.box(sw+0.005,0.06,1.15,famTint('canvas',i%2?0xf2efe6:awn),a,y+2.95,b,face,-0.32);
    const [e,f]=F(d/2+1.13,s);K.box(sw+0.005,0.3,0.04,famTint('canvas',i%2?0xf2efe6:awn),e,y+2.62,f,face)}}
  // the sign over the awning (MAIN_SHOPS[si]), on a dark board
  {const sw=Math.min(w-1.6-(C?2*ch:0),8.5),[a,b]=F(d/2+0.1,0);K.box(sw+0.24,1.14,0.08,DK,a,y+3.75,b,face);const [e,f]=F(d/2+0.15,0);mainSignList.push({x:e,y:y+3.75,z:f,ry:face,w:sw,h:0.95,i:si%MAIN_SHOPS.length})}
  // a blade sign out over the walk at one end of the front: a tall one with the shop's name down it on the taller
  // buildings, a small painted board hung from an iron bracket on the low ones
  if(si%3===1){const bs=(C?-C:(si%2?1:-1))*(w/2-0.45),[a,b]=F(d/2+0.55,bs);
    if(hf>=7.9){const yb=y+4.45+1.3;K.box(0.08,2.6,0.62,DK,a,yb,b,face);K.box(0.1,2.7,0.05,TR,...F(d/2+0.88,bs),yb,face);
      for(const t of [-1,1]){const [p,q]=F(d/2+0.4,bs);K.box(0.05,0.05,0.8,IRON,p,yb+t*1.15,q,face)}
      for(const t of [-1,1]){const [p,q]=F(d/2+0.56,bs+t*0.045);mainSignList.push({x:p,y:yb,z:q,ry:face+t*Math.PI/2,w:2.4,h:0.3,i:si%MAIN_SHOPS.length,v:1})}}
    else{const [p,q]=F(d/2+0.55,bs);K.box(0.05,0.05,1.05,IRON,p,y+4.0,q,face);K.box(0.05,0.3,0.05,IRON,...F(d/2+0.05,bs),y+3.85,face);
      K.box(0.07,0.56,0.76,awn,a,y+3.55,b,face);K.box(0.05,0.66,0.86,TR,a,y+3.55,b,face);for(const t of [-1,1])K.box(0.02,0.16,0.02,IRON,...F(d/2+0.55+t*0.32,bs),y+3.92,face)}}
  // the upper floors: windows with a sill under and a lintel over each (on a set-back top floor, on its face); round
  // the corner on a corner lot, and the odd air conditioner
  rows.forEach((wy,ri)=>{const fr=wy+0.9<hf,of=fr?d/2:d/2-sb;let k=0;
    for(let s=-w/2+1.5;s<=w/2-1.4;s+=2.3){if(C&&s*C>w/2-ch-0.8)continue;mainWin(K,...F(of,s),face,y+wy,TR,si%3===2&&ri===0&&k===1);k++}
    if(C&&fr){mainWin(K,(P1[0]+P2[0])/2,(P1[1]+P2[1])/2,fc,y+wy,TR);for(let t=d/2-ch-1.4;t>=-d/2+1.2;t-=2.3)mainWin(K,...F(t,sg*w/2),face+C*Math.PI/2,y+wy,TR,ri===0&&t<0&&t>-2.4)}});
  // out back: a steel door on a concrete stoop (a step up), the upper windows, and on some of the tall brick ones a
  // fire escape: a landing at each upper floor, railed, stairs between them and a drop ladder from the lowest
  const bf=face+Math.PI,B=(t,s)=>F(-d/2-t,s),ds=-w/4*(si%2?1:-1);
  {const [a,b]=B(0.5,ds),gs=Math.max(G(...B(0.9,ds)),G(...B(0.1,ds)),G(...B(0.5,ds-0.8)),G(...B(0.5,ds+0.8)))+0.15;
    K.box(1.7,gs-G(a,b)+0.3,1.0,'concrete',a,(gs+G(a,b)-0.3)/2,b,face);walkPad(a,b,0.85,0.5,face,gs);
    const [e,f]=B(0.03,ds);K.box(1.0,2.1,0.06,[0x5c6b5e,0x7a3428,0x3b4a5a,0x8a8d8f][si%4],e,gs+1.05,f,face);const [g,k]=B(0.05,ds);K.box(1.2,0.08,0.1,DK,g,gs+2.16,k,face);
    for(const t of [-1,1])K.box(0.08,2.15,0.1,DK,...B(0.05,ds+t*0.56),gs+1.07,face);K.box(0.22,0.18,0.18,DK,...B(0.1,ds),gs+2.45,face)}
  const fe=brickW&&rows.length>1&&!sb&&(si%4===0||si%4===3),fs=w/4*(si%2?1:-1);
  rows.forEach((wy,ri)=>{for(const s of fe?[fs]:[-w/4,w/4])mainWin(K,...B(0,s),bf,y+wy,TR,!fe&&ri===0&&s===-ds&&si%2===0)});
  if(fe){const L=(t,s)=>B(t,fs+s);rows.forEach((wy,ri)=>{const ly=y+wy-0.95;{const [a,b]=L(0.55,0);K.box(3.4,0.05,1.0,IRON,a,ly,b,face)}
      {const [a,b]=L(1.03,0);K.box(3.4,0.04,0.04,IRON,a,ly+1.0,b,face);K.box(3.4,0.03,0.03,IRON,a,ly+0.5,b,face)}
      for(let s=-1.7;s<=1.71;s+=0.425){const [a,b]=L(1.03,s);K.box(0.025,1.0,0.025,IRON,a,ly+0.5,b,face)}
      for(const t of [-1,1]){const [a,b]=L(0.55,t*1.7);K.box(0.04,0.04,1.0,IRON,a,ly+1.0,b,face)}
      if(ri<rows.length-1){const ny=ly+2.8,a=L(0.55,-1.5),b=L(0.55,1.2),run=Math.atan2(2.8,2.7);for(const t of [-0.32,0.32]){const p=L(0.55+t,-0.15);K.box(3.9,0.12,0.03,IRON,p[0],(ly+ny)/2,p[1],face,0,-run)}
        for(let i=1;i<9;i++){const p=L(0.55,1.2-2.7*i/9);K.box(0.22,0.03,0.62,IRON,p[0],ly+2.8*i/9,p[1],face)}}
      if(ri===0){const [a,b]=L(0.9,-1.35),gl=G(a,b)+2.4;for(const t of [-0.2,0.2]){const [p,q]=L(0.9,-1.35+t);K.box(0.04,ly-gl,0.04,IRON,p,(ly+gl)/2,q,face)}
        for(let yy=gl+0.15;yy<ly;yy+=0.3)K.box(0.4,0.025,0.025,IRON,a,yy,b,face)}})}
  // rain streaks under the coping and damp at the foot of the back and side walls
  {const gl=Math.min(G(...B(0,-w/2)),G(...B(0,w/2)),G(...B(0,0)))-0.05;mainGrimeWall(...B(0,0),bf,w,gl,y+0.75,1);mainGrimeWall(...B(0,0),bf,w,y+h-1.6,y+h-0.1,5)}
  for(const s of [-1,1]){if(s===C)continue;const gl=Math.min(G(...F(-d/2,s*w/2)),G(...F(d/2,s*w/2)),G(...F(0,s*w/2)))-0.05;
    mainGrimeWall(...F(0,s*w/2),face+s*Math.PI/2,d-0.1,gl,y+0.7,1)}
  // solid: the building behind the shop, its side walls and the storefront either side of the door; the shop's floor to
  // walk on, and its room (the camera stays in it)
  SOLIDS.push({x,z,hx:(Math.abs(fz)*w+Math.abs(fx)*d)/2+0.1,hz:(Math.abs(fx)*w+Math.abs(fz)*d)/2+0.1,foot:1});{const [a,b]=F(-RD/2,0);rmSolid(a,b,face,w/2+0.1,(d-RD)/2+0.1)}
  for(const t of [-1,1]){if(t===C){const hs=(RD-ch+0.1)/2,[a,b]=F(d/2-RD-0.1+hs,t*(w/2-0.2));rmSolid(a,b,face,0.3,hs);const hw=(w/2-ch-0.6)/2,[e,f]=F(d/2,t*(0.6+hw));rmSolid(e,f,face,hw,0.14);
      rmSolid((P1[0]+P2[0])/2,(P1[1]+P2[1])/2,Math.atan2(-(P2[1]-P1[1]),P2[0]-P1[0]),ch*0.7071,0.14);continue}
    const [a,b]=F(d/2-RD/2,t*(w/2-0.2));rmSolid(a,b,face,0.3,RD/2+0.1);const [e,f]=F(d/2,t*(w/4+0.35));rmSolid(e,f,face,w/4-0.25,0.14)}
  walkPad(F0[0],F0[1],w/2-0.1,RD/2,face,y+0.03);rmRoom(F0[0],F0[1],face,w/2-0.55,RD/2,y,y+2.9);
  MAIN_BACKS.push({x,z,w,d,y,h,face,F,C,ds,si})}
// the shop signs: painted boards (famSignPaint, family.js) drawn into one picture, and every sign a quad of it, as one mesh.
// from: the first of mainSignList to draw (a later part of town, waterfront.js, draws its own: a smaller picture of just
// its shops' boards); the town's first picture holds the first 32 of MAIN_SHOPS, two columns of 16
function mainSignsAdd(from){from=from||0;const L=mainSignList.slice(from),ids=from?[...new Set(L.map(s=>s.i))]:MAIN_SHOPS.slice(0,32).map((_,i)=>i),
    R=from?2**Math.ceil(Math.log2(Math.max(1,Math.ceil(ids.length/2)))):16,cv=document.createElement('canvas');cv.width=2048;cv.height=R*128;const g=cv.getContext('2d'),SW=1024,SH=128;
  ids.forEach((si,i)=>{const [n,sub,bg,fg,serif]=MAIN_SHOPS[si];famSignPaint(g,(i%2)*SW,((i/2)|0)*SH,SW,SH,bg,fg,serif,
    [[serif?n:n.toUpperCase(),serif?0.44:0.5,0.4,700],[serif?sub:sub.toUpperCase(),0.2,0.77,600,serif]],si*97+5)});
  const tex=new THREE.CanvasTexture(cv);tex.anisotropy=8;tex.colorSpace=THREE.SRGBColorSpace;const P=[],U=[],v=new THREE.Vector3();
  for(const s of L){const k=ids.indexOf(s.i),u0=(k%2)/2,v1=1-((k/2)|0)/R,v0=v1-1/R,cs=Math.cos(s.ry),sn=Math.sin(s.ry),pt=(a,b)=>{v.set(a*cs,b,-a*sn);return [s.x+v.x,s.y+v.y,s.z+v.z]};
    // (a blade sign's name runs down it: v)
    if(s.v){const A=pt(-s.h/2,-s.w/2),B=pt(s.h/2,-s.w/2),C=pt(s.h/2,s.w/2),D=pt(-s.h/2,s.w/2);P.push(...A,...B,...C,...A,...C,...D);U.push(u0+0.5,v0,u0+0.5,v1,u0,v1,u0+0.5,v0,u0,v1,u0,v0);continue}
    const A=pt(-s.w/2,-s.h/2),B=pt(s.w/2,-s.h/2),C=pt(s.w/2,s.h/2),D=pt(-s.w/2,s.h/2);P.push(...A,...B,...C,...A,...C,...D);U.push(u0,v0,u0+0.5,v0,u0+0.5,v1,u0,v0,u0+0.5,v1,u0,v1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,famSignMat(tex));m.receiveShadow=true;scene.add(m);return m}

(function(){let sd=31;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  // ---------- north: the field and woods ----------
  const N=famKit();
  // a post and two-rail fence along the hayfield's south edge, a gap where the lane runs in, and round bales on the stubble
  for(let x=24;x<=400;x+=3.5){const z=-306,y=baseHeight(x,z);N.box(0.16,1.3,0.16,0x7a6a55,x,y+0.55,z);
    if(x+3.5<=400)for(const ry of [0.55,1.0])N.box(3.5,0.1,0.06,0x8c7b62,x+1.75,baseHeight(x+1.75,z)+ry,z)}
  const RB=famKit();
  for(let i=0;i<26;i++){const x=40+rnd()*340,z=-320-rnd()*220;if(Math.abs(roadOff(x,z))<4)continue;const yaw=rnd()*6.3;
    RB.cyl(0.75,0.75,1.3,12,0xc2a45a,x,baseHeight(x,z)+0.7,z,yaw,0,Math.PI/2);famSpot('roundbale',x,baseHeight(x,z),z,yaw)}
  famAddSpot('roundbale',RB);
  famSign(['FIELD AND WOODS','Trail west · Hayfield east'],4.6,1.5,-7,baseHeight(-7,-300)+2.0,-300,0,'#2f5a33','#ffffff');
  for(const s of [-1,1])N.box(0.12,2.5,0.12,0x8a8a86,-7+s*2.1,baseHeight(-7,-300)+1.25,-300);
  famAdd(N);
  // the woods: pines and leaf trees west of the trail, thinning at the edge, clear of the trail itself
  const out=[];
  for(let g=0;g<12000&&out.length<440;g++){const x=-440+rnd()*420,z=-555+rnd()*250,w=mainWoods(x,z);
    if(w<0.5||rnd()>0.35+0.65*ss(-20,-60,x)||Math.abs(roadOff(x,z))<ROAD_W/2+1.4||baseHeight(x,z)-WATER<3)continue;
    out.push({p:rnd()<0.9,x,z,yaw:rnd()*6.3,s:0.85+rnd()*0.7,c:(rnd()*6)|0})}
  // and a ragged tree line along the far side of the hayfield
  for(let x=30;x<400;x+=5+rnd()*6){const z=-548+rnd()*10;out.push({p:rnd()<0.75,x,z,yaw:rnd()*6.3,s:0.9+rnd()*0.6,c:(rnd()*6)|0})}
  treeGroup('mainland',out.map(a=>treeEntry(a.p?'pine':'leafy',a.x,a.z,a.yaw,a.s,a.c,a.p?1+0.45*hash(a.x*1.3+0.7,a.z*2.1+0.3):0)));

  // ---------- south: the lakeside town ----------
  const T=famKit(),COLS=[0xb5654a,0xd9cdb0,0x7d9aa8,0xc9b27a,0x9c4f3f,0xe4e0d4,0x8f9a7a,0xb98b5e],AWN=[0x2f6b4f,0xb8322a,0x2a4f7a,0xd08a22];
  const WALLS=['brick','plaster','sidingW','brickOld','sidingG','brick','sidingR','plaster','brickOld','sidingB','sidingW'];
  const LK=famKit(),BK=famKit();let li=0;const lot=(x,z,w,d,h,face,o)=>{
    // (a Main Street lot by the cross street turns the corner: its corner toward the crossing cut off)
    if(!o&&Math.abs(Math.sin(face))>0.9&&Math.abs(z-652)-w/2<21)o={c:Math.sign((652-z)*-Math.sin(face))};
    mainLot(T,x,z,w,d,h,COLS[li%COLS.length],face,AWN[(li*3)%AWN.length],li,WALLS[li%WALLS.length],o);li++};
  // Main Street: a block of shops each side, facing the street, at least 2 m apart, with lamps at the curb (the paving:
  // mainStreets) and a street tree in each gap (MAIN_GAPS)
  // (none nearest the water: the street opens there onto the plaza at its foot, waterfront.js, and those two shops
  // moved to the waterfront; li still counts them, so every other shop keeps its sign and look)
  for(const s of [-1,1]){let e0=null;for(let i=0;i<7;i++){const z=588+i*19+(i>2?8:0),w=14+((i*7+(s>0?3:0))%4),h=5.5+((i*5+(s>0?2:0))%5)*1.3;if(Math.abs(z-652)<10){e0=null;continue}if(!i){li++;continue}
      lot(s*(4+2+6.5),z,w,13,h,s>0?-Math.PI/2:Math.PI/2);if(e0!==null&&z-w/2-e0>=1.8)MAIN_GAPS.push([s,(e0+z-w/2)/2]);e0=z+w/2}
    for(const z of [584,606,628,672,694,716]){const x=s*4.42,y=baseHeight(x,z);LK.cyl(0.07,0.1,5,8,0x2f3236,x,y+2.5,z);LK.box(0.5,0.2,0.5,0x2f3236,x,y+5.05,z);LK.lit(new THREE.BoxGeometry(0.4,0.05,0.4),0xfff1c8,x,y+4.93,z);
      famSpot('lamp',x,y+0.17,z,0)}}
  // along the cross street, both sides
  for(const s of [-1,1])for(let i=0;i<5;i++){const x=s*(30+i*22);lot(x,652-13,16,12,5+((i*3)%4)*1.4,0);if(s>0&&i===1)continue;lot(x,652+13,16,12,5.5+((i*2)%3)*1.5,Math.PI)}
  // (the brewery stands in place of the cross street's second lot east, south side: mainBrewery)
  // a boardwalk along the top of the beach, and a few benches on it looking out at the islands
  // (a gap where the marina's boat ramp crosses it, marina.js)
  // (and none where it would lie on the beach road west of Main Street, nor along Harbor Square's promenade, square.js,
  // nor from there east to the boat ramp, where the waterfront promenade runs: waterfront.js)
  for(let x=-160;x<160;x+=6){if(Math.abs(x)<7||Math.abs(x+3-107)<4||x+3>-119&&x+3<102)continue;if(x+3<0&&Math.abs(mainRimS(x+3)+3-(x+3<-60?576-2*(x+173)/110:574))<4.4)continue;const z0=mainRimS(x)+3,z1=mainRimS(x+6)+3,y=Math.max(baseHeight(x+3,(z0+z1)/2),WATER+1.8);
    T.box(6.1,0.16,3.6,0x8c6e4c,x+3,y+0.07,(z0+z1)/2,-Math.atan2(z1-z0,6));walkPad(x+3,(z0+z1)/2,3.05,1.8,-Math.atan2(z1-z0,6),y+0.15);
    if(((x+160)/6|0)%5===2){BK.box(1.6,0.45,0.5,0x5c4632,x+3,y+0.37,(z0+z1)/2+1.2);famSpot('bench',x+3,y+0.15,(z0+z1)/2+1.2,Math.PI,0.9)}}
  // street trees along Main Street in the gaps between the shops (clear of the awnings and walls), each in a square of
  // brick pavers with an iron grate
  const TR=[];for(const [sx,z] of MAIN_GAPS){const x=sx*4.75,y=baseHeight(x,z);TR.push(treeEntry('leafy',x,z,(z*0.37)%6.3,0.48,(z/22|0)%6,1.15));
    T.box(1.0,0.04,1.0,0x8a4a36,x,y+0.18,z);T.box(0.8,0.03,0.8,0x2a2c2f,x,y+0.2,z);walkPad(x,z,0.5,0.5,0,y+0.2)}
  treeGroup('town',TR);
  // a post clock at the foot of Main Street: a fluted iron post, a head with a face each way and the hands at ten past ten
  {const X=-7.5,Z=570,y=baseHeight(X,Z);T.cyl(0.32,0.38,0.5,10,0x1f2a24,X,y+0.25,Z);T.cyl(0.12,0.14,3.6,10,0x1f2a24,X,y+2.2,Z);T.box(0.95,0.95,0.42,0x1f2a24,X,y+4.4,Z);
    T.cyl(0,0.3,0.4,8,0x1f2a24,X,y+5.08,Z);for(const s of [-1,1]){T.cyl(0.4,0.4,0.03,20,0xf4f1e6,X,y+4.4,Z+s*0.22,0,Math.PI/2);
      T.box(0.04,0.22,0.02,0x111111,X+0.05,y+4.48,Z+s*0.24,0,0,-0.5);T.box(0.03,0.32,0.02,0x111111,X-0.07,y+4.52,Z+s*0.245,0,0,0.6)}
    SOLIDS.push({x:X,z:Z,hx:0.4,hz:0.4})}
  famSign(['LAKESIDE','Main Street'],4.2,1.5,7.5,baseHeight(7.5,568)+2.0,568,Math.PI,'#1f4d6b','#ffffff');
  for(const s of [-1,1])T.box(0.12,2.5,0.12,0x8a8a86,7.5+s*1.9,baseHeight(7.5,568)+1.25,568);
  famAdd(T);famAddSpot('lamp',LK);famAddSpot('bench',BK);mainSignsAdd();rmWinsBuild();
})();

// ---------- the Lakeside Brewing Co. and its beer garden, south of the cross street ----------
// a brick taproom with a glass front (fermenting tanks, copper kettles, the bar and its taps, tables) and glass roll-up
// doors at the back onto a concrete patio of high-top tables; behind it a fenced lawn of picnic tables under festoon
// lights and umbrellas, a fire pit ringed by Adirondack chairs, a cornhole game, a food truck and shade trees; a path
// from the cross street's sidewalk down the side to its gate. The taproom and the garden are rooms (TF_ROOMS) where the
// townsfolk drink, eat, sit and play
const BREW={x:52,z:666,w:20,d:14,h:7,gx0:36,gx1:92,gz0:679,gz1:712};
function mainBrewery(){const K=famKit(),PK=famKit(),{x,z,w,d,h}=BREW,y=rmGroundMax(x,z,Math.PI,w,d)+0.03;
  const B=rmKit(K,x,z,y,Math.PI),W='brickOld',ST=0x2a2c2f,SS=0xc8ccce,CU=0xb87333,WD=0x7a5236,o0=d/2,G=baseHeight;
  // the shell: brick sides, the glass front between steel mullions over a brick base, the back with three glass roll-up doors
  for(const s of [-1,1])B.box(0.35,h,d,W,0,s*(w/2-0.175),0);B.box(w,1,d,W,0,0,-1);B.box(w-0.7,0.03,d-0.4,'concBroom',0,0,0);
  B.box(w,0.4,0.35,W,o0-0.175,0,0);B.box(w,h-4.6,0.35,W,o0-0.175,0,4.6);B.box(w-0.7,4.2,0.02,'glass',o0-0.2,0,0.4);
  for(let s=-w/2+0.35;s<=w/2-0.3;s+=(w-0.7)/8)B.box(0.1,4.2,0.14,ST,o0-0.15,s,0.4);B.box(w-0.7,0.1,0.14,ST,o0-0.15,0,2.6);
  for(const s of [-1,1])B.box(0.08,2.4,0.06,ST,o0-0.12,s*0.9,0.4);
  const doors=[-6,0,6];for(const [a,b] of [[-10,-7.5],[-4.5,-1.5],[1.5,4.5],[7.5,10]])B.box(b-a,3.2,0.35,W,-o0+0.175,(a+b)/2,0);B.box(w,h-3.2,0.35,W,-o0+0.175,0,3.2);
  // (the middle one rolled up onto the patio: the way in)
  B.box(3.1,0.42,0.42,ST,-o0+0.3,0,2.8);for(const s of doors){if(!s)continue;B.box(3,3.2,0.02,'glass',-o0+0.2,s,0);for(let k=0;k<=5;k++)B.box(3,0.06,0.08,ST,-o0+0.2,s,k*0.64-0.03+(k?0:0.03));for(const t of [-1,0,1])B.box(0.06,3.2,0.08,ST,-o0+0.2,s+t*1.47,0)}
  // the roof, its parapet and coping; the sign across the front; a grain silo by the east wall
  B.box(w,0.25,d,0x4a4c4e,0,0,h);for(const s of [-1,1]){B.box(0.3,0.7,d,W,0,s*(w/2-0.15),h);B.box(w,0.7,0.3,W,s*(o0-0.15),0,h);B.box(w+0.1,0.08,0.4,0xd8d2c4,s*(o0-0.15),0,h+0.7)}
  famSign(['LAKESIDE BREWING CO.','Taproom · Beer Garden · Est. 2019'],10,1.7,x,y+5.75,z-o0-0.04,Math.PI,'#1f2a24','#e8c27a');
  {const sx=40,sz=670,sy=G(sx,sz);K.cyl(1.3,1.3,6,20,SS,sx,sy+3.8,sz);K.cyl(0.1,1.3,1.2,20,SS,sx,sy+7.4,sz);K.cyl(1.3,0.2,1.0,20,SS,sx,sy+0.3+0.5,sz);
    for(const a of [0.8,2.4,4,5.6])K.box(0.1,0.8,0.1,ST,sx+Math.cos(a)*1.1,sy+0.4,sz+Math.sin(a)*1.1);SOLIDS.push({x:sx,z:sz,hx:1.35,hz:1.35})}
  // inside: four fermenting tanks on their legs and two copper kettles down the east side, the bar and back bar down the
  // west, the chalkboard, tables between, pendant lamps
  for(const o of [-4.2,-1.6,1.0,3.6]){const s=7.4;B.cyl(0.8,0.8,3.0,20,SS,o,s,1.25);B.cyl(0.8,0.12,0.75,20,SS,o,s,0.5);B.cyl(0.2,0.8,0.3,20,SS,o,s,4.25);B.cyl(0.08,0.08,0.4,8,SS,o,s,4.55);
    for(const a of [0.8,2.4,3.9,5.5])B.box(0.07,1.3,0.07,SS,o+Math.cos(a)*0.62,s+Math.sin(a)*0.62,0);B.box(0.04,0.3,0.04,0x2a5f9a,o,s-0.83,1.2)}
  for(const s of [3.6,5.6]){B.cyl(0.85,0.85,1.9,20,CU,-5.6,s,0.3);B.cyl(0.25,0.85,0.5,20,CU,-5.6,s,2.2);B.cyl(0.12,0.12,1.6,8,CU,-5.6,s,2.7)}
  B.box(0.75,1.05,8.4,WD,-0.6,-7.3,0);B.box(0.85,0.06,8.6,0x2b2420,-0.6,-7.3,1.05);B.box(0.05,0.15,8.4,0xc9ccc8,-0.6,-6.9,0.2);
  for(let o=-4.2;o<=3.0;o+=0.45){B.cyl(0.025,0.025,0.32,6,0xc9ccc8,o,-7.45,1.11);B.box(0.03,0.12,0.05,[0x2a2c2f,0xb8322a,0xe0b83a,0x2f5a8a][(o*10|0)&3],o,-7.35,1.4)}
  B.box(0.4,2.2,8.4,WD,-0.6,-9.45,0);for(const yy of [1.2,1.6,2.0])for(let o=-4.6;o<=3.4;o+=0.18)B.cyl(0.035,0.035,0.25,6,[0x3d2a16,0x2f5a2a,0x6b4a1a][Math.abs(Math.round(o*20+yy*7))%3],o,-9.4,yy);
  B.box(3.2,1.6,0.03,0x1e2420,-6.6,-4.5,2.6);B.box(3.3,1.7,0.02,WD,-6.635,-4.5,2.55);
  for(const [o,s] of [[-3.2,-1.6],[-3.2,2.4],[1.4,-1.6],[1.4,2.4]]){rmTable(B,o,s,4,WD,1);B.cyl(0.02,0.02,1.6,4,ST,o,s,3.3);const [a,b]=B.P(o,s);K.lit(new THREE.CylinderGeometry(0.12,0.22,0.22,10),0xffe2a8,a,y+3.2,b)}
  for(let o=-4;o<=3;o+=1.75){const [a,b]=B.P(o,-7.3);K.lit(new THREE.CylinderGeometry(0.1,0.18,0.2,10),0xffe2a8,a,y+3.1,b)}
  B.spot(-3.6,-8.55,Math.PI/2,{staff:1});B.spot(0.6,-8.55,Math.PI/2,{staff:1,path:B.path([[3.2,-8.55],[-4.4,-8.55],[3.2,-8.55]]),at:3});B.spot(-0.3,5.6,Math.PI/2,{staff:1});
  for(const o of [-4.0,-2.6,-1.2,0.2,1.6,3.0])B.spot(o,-6.55,-Math.PI/2);B.spot(-5.0,1.0,Math.PI/2);B.spot(4.6,0.5,-Math.PI*0.75);B.spot(5.2,1.1,Math.PI);
  rmAdd(B,9,[0,4,7,11]).hrs=[11,23];B.nm='Lakeside Brewing Co.';
  // solid: the walls (but the open door), the tanks, kettles, bar and back bar; the floor to walk on, and the room
  SOLIDS.push({x,z,hx:w/2+0.1,hz:d/2+0.1,foot:1});for(const t of [-1,1]){B.solid(0,t*(w/2-0.2),0.45,d+0.2);B.solid(-o0+0.2,t*(w/4+0.75),w/2-1.5,0.45)}B.solid(o0-0.2,0,w+0.2,0.45);
  B.solid(-0.3,7.4,1.8,9.6);B.solid(-5.6,4.6,3.9,1.8);B.solid(-0.6,-7.3,0.8,8.5);B.solid(-0.6,-9.45,0.5,8.5);
  walkPad(x,z,w/2-0.3,d/2-0.3,Math.PI,y+0.03);rmRoom(x,z,Math.PI,w/2-0.35,d/2-0.35,y,y+h-0.2);
  // the patio behind, its high-top tables, and the path from the sidewalk down the side to the garden's gate
  const pz=z+o0,G0=G(x,pz+2.5);K.box(w,0.25,5,'concBroom',x,G0+0.0,pz+2.5);walkPad(x,pz+2.5,w/2,2.5,0,G0+0.125);
  const GD={x:64,z:695.5,r:32,spots:[],ground:1},spot=(sx,sz,yaw,k)=>{const sp=Object.assign({x:sx,z:sz,y:padAt(sx,sz)>-1e8?padAt(sx,sz):G(sx,sz),yaw},k||{});GD.spots.push(sp);return sp};
  for(const tx of [x-6,x,x+6]){const tz=pz+3.0,ty=G0+0.125;K.cyl(0.35,0.35,0.04,16,WD,tx,ty+1.05,tz);K.cyl(0.04,0.04,1.05,8,ST,tx,ty+0.52,tz);K.cyl(0.25,0.25,0.03,12,ST,tx,ty+0.02,tz);
    spot(tx-0.6,tz,Math.PI/2);spot(tx+0.6,tz,-Math.PI/2);if(tx!==x)spot(tx,tz+0.62,Math.PI);SOLIDS.push({x:tx,z:tz,hx:0.35,hz:0.35})}
  {const L=(xx,zz)=>zz<661?0.17-(zz-658.8)/2.2*0.14:0.03;for(let zz=658.8;zz<BREW.gz0;zz+=1.0){const z1=Math.min(BREW.gz0,zz+1.0);K.box(2.8,0.06,z1-zz+0.02,'concBroom',64,G(64,(zz+z1)/2)+L(64,(zz+z1)/2)-0.03,(zz+z1)/2)}
    walkPad(64,659.9,1.4,1.1,0,0,{l:0.17,rise:-0.14});walkPad(64,(661+BREW.gz0)/2,1.4,(BREW.gz0-661)/2,0,0,{l:0.03})}
  // the lawn's fence (open to the patio and at the gate), festoon lights on timber poles, shade trees
  const {gx0,gx1,gz0,gz1}=BREW,post=(px,pz)=>K.box(0.12,1.05,0.12,WD,px,G(px,pz)+0.52,pz);
  const run=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(L/2.4)),ry=Math.atan2(bx-ax,bz-az);
    for(let i=0;i<=n;i++)post(ax+(bx-ax)*i/n,az+(bz-az)*i/n);for(let i=0;i<n;i++){const mx=ax+(bx-ax)*(i+0.5)/n,mz=az+(bz-az)*(i+0.5)/n;for(const ry2 of [0.45,0.9])K.box(0.05,0.09,L/n,WD,mx,G(mx,mz)+ry2,mz,ry)}
    SOLIDS.push({x:(ax+bx)/2,z:(az+bz)/2,hx:Math.abs(bx-ax)/2+0.06,hz:Math.abs(bz-az)/2+0.06})};
  run(gx0,gz0,x-w/2,gz0);run(66,gz0,gx1,gz0);run(gx1,gz0,gx1,gz1);run(gx1,gz1,gx0,gz1);run(gx0,gz1,gx0,gz0);
  const poles=[[gx0+0.5,gz0+0.5],[66.4,gz0+0.5],[gx1-0.5,gz0+0.5],[gx0+0.5,gz1-0.5],[64,gz1-0.5],[gx1-0.5,gz1-0.5]];
  for(const [px,pz] of poles){K.box(0.16,4.8,0.16,WD,px,G(px,pz)+2.4,pz);SOLIDS.push({x:px,z:pz,hx:0.1,hz:0.1})}
  const str=(a,b)=>{const [ax,az]=poles[a],[bx,bz]=poles[b],ya=G(ax,az)+4.6,yb=G(bx,bz)+4.6,L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/1.4),P=[];
    for(let i=0;i<=n;i++){const t=i/n;P.push([ax+(bx-ax)*t,ya+(yb-ya)*t-1.1*4*t*(1-t),az+(bz-az)*t])}
    for(let i=0;i<n;i++){const [p,q]=[P[i],P[i+1]],l=Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]);K.box(0.015,0.015,l,0x1a1a1a,(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,Math.atan2(q[0]-p[0],q[2]-p[2]),-Math.asin((q[1]-p[1])/l));
      if(i)K.lit(new THREE.BoxGeometry(0.08,0.11,0.08),0xffe2a8,p[0],p[1]-0.09,p[2])}};
  for(const [a,b] of [[0,1],[1,2],[3,4],[4,5],[0,4],[1,3],[1,5],[2,4]])str(a,b);
  treeGroup('brewery',[treeEntry('leafy',gx0+4,gz1-3,1.1,0.85,2),treeEntry('leafy',gx1-5,gz1-3.5,2.3,0.8,4),treeEntry('leafy',gx1-3,gz0+4,0.4,0.7,1)]);
  // picnic tables (town.glb's picnic on Detailed), four by four, umbrellas over some; six seats at each
  for(const tx of [41,47,53,59])for(const tz of [685,691,697,703]){const ty=G(tx,tz);famSpot('picnic',tx,ty,tz,0);SOLIDS.push({x:tx,z:tz,hx:0.95,hz:0.8});
    PK.box(1.8,0.05,0.75,0xa6743e,tx,ty+0.76,tz);for(const sz of [-0.6,0.6])PK.box(1.8,0.05,0.28,0xa6743e,tx,ty+0.45,tz+sz);for(const lx of [-0.7,0.7])PK.box(0.07,0.76,1.4,0x8a5e30,tx+lx,ty+0.38,tz);
    for(const k of [-0.55,0,0.55]){spot(tx+k,tz-0.64,0,{sit:1});spot(tx+k,tz+0.64,Math.PI,{sit:1})}
    if((tx+tz)%12===1||(tx*3+tz)%17===0){K.cyl(0.03,0.03,2.5,6,0xe9e4d6,tx,ty+1.25,tz);K.cyl(0.04,1.45,0.45,12,[0x2f5a33,0xe9e1cc,0xb8322a][(tx+tz)%3],tx,ty+2.45,tz)}}
  famAddSpot('picnic',PK);
  // the fire pit and its Adirondack chairs
  {const fx=80,fz=701,fy=G(fx,fz);K.cyl(0.8,0.85,0.4,16,0x8a857d,fx,fy+0.2,fz);K.cyl(0.62,0.62,0.02,14,0x1c1a18,fx,fy+0.38,fz);
    for(let i=0;i<5;i++)K.lit(new THREE.BoxGeometry(0.18,0.06,0.12),0xff8a3a,fx+Math.cos(i*1.3)*0.3,fy+0.42,fz+Math.sin(i*1.3)*0.3);SOLIDS.push({x:fx,z:fz,hx:0.85,hz:0.85});
    const C=rmKit(K,fx,fz,fy,0);for(let i=0;i<6;i++){const a=i/6*Math.PI*2,o=Math.cos(a)*2.1,s=Math.sin(a)*2.1,yl=Math.atan2(-s,-o),p=C.at(o,s,yl);
      p(0.6,0.06,0.5,0xe9e4d6,0.02,0,0.36);p(0.6,0.75,0.06,0xe9e4d6,-0.32,0,0.42);for(const t of [-1,1]){p(0.08,0.06,0.65,0xe9e4d6,0,t*0.34,0.6);p(0.06,0.6,0.06,0xe9e4d6,0.25,t*0.34,0);p(0.06,0.4,0.06,0xe9e4d6,-0.25,t*0.34,0)}
      const [sx,sz]=C.P(o-Math.cos(yl)*0.05,s-Math.sin(yl)*0.05);spot(sx,sz,yl,{sit:1})}}
  // cornhole: two boards facing each other, a player at each
  for(const [bz,t] of [[685.5,1],[694.5,-1]]){const bx=72,by=G(bx,bz);K.box(0.6,0.05,1.2,0x9a6a3a,bx,by+0.2,bz,t>0?0:Math.PI,0.2);K.cyl(0.08,0.08,0.06,12,0x111111,bx,by+0.33,bz+t*0.3);
    K.box(0.12,0.04,0.12,0xb8322a,bx+0.15,by+0.26,bz-t*0.2);K.box(0.12,0.04,0.12,0x2f5a8a,bx-0.2,by+0.25,bz);spot(bx+0.75,bz-t*1.0,t>0?0:Math.PI)}
  // the food truck by the east fence, its window to the lawn
  {const tx=88,tz=692,ty=G(tx,tz),T=rmKit(K,tx,tz,ty,-Math.PI/2),BODY=0x2f6b8a;// o: out of its window (west), s along it
    for(const [s0,s1] of [[-3,-1.5],[1.5,3]])T.box(s1-s0,1.4,0.06,BODY,1.12,(s0+s1)/2,1.0);T.box(6,1.2,0.06,BODY,1.12,0,0.5);T.box(3,0.35,0.06,BODY,1.12,0,2.4);
    T.box(6,2.1,0.06,BODY,-1.12,0,0.5);T.box(6,0.06,2.3,0xe9e9e6,0,0,2.75);T.box(0.06,2.1,2.3,BODY,0,-3,0.6);T.box(6,0.06,2.3,0x8a8e91,0,0,0.82);
    T.box(1.8,1.7,2.3,0xe9e9e6,0,3.9,0.5);T.box(0.02,0.55,1.9,0x1c2328,0,4.81,1.55);T.box(0.06,2.1,2.3,BODY,0,3,0.6);
    for(const s of [-2,2,3.7])for(const o of [-1.0,1.0]){const [a,b]=T.P(o,s);K.cyl(0.38,0.38,0.25,14,0x1b1c1b,a,ty+0.38,b,0,0,Math.PI/2)}
    T.box(3.2,0.04,0.9,0xe0b83a,1.55,0,2.45);T.box(3,0.06,0.6,0xc9ccc8,1.35,0,1.68);T.box(1.2,0.8,0.03,0x1e2420,1.16,-2.2,1.6);
    T.spot(0.3,-0.4,0,{staff:1,y:ty+0.88});T.spot(0.3,0.7,0,{staff:1,y:ty+0.88});for(const [o,s] of [[2.0,0],[2.6,-0.5],[3.1,0.6]]){const [a,b]=T.P(o,s);spot(a,b,-Math.PI/2+Math.PI)}
    for(const sp of T.spots)GD.spots.push(sp);SOLIDS.push({x:tx,z:tz+0.5,hx:1.2,hz:3.6})}
  // a server or two walking the aisles between the tables
  for(let k=0;k<2;k++){const sp=spot(44,682,0,{staff:1,path:rmLine([[44,682],[62,682],[62,706],[44,706],[44,682]]),at:k*21})}
  rmAdd(GD,32,[0,10,20,32]).hrs=[11,23];famAdd(K)}
mainBrewery();

// ---------- the Lakeside General Store, at the south end of Main Street ----------
// where the pickups' beds fill up (pickup.js): a brick store with a glass front under a steel canopy, a parking lot in
// front where Main Street ends, and the garden centre under a shade roof on its west side. It is built physically based:
// the library's brick, broom-finish concrete, asphalt, corrugated steel and planks with their relief and roughness maps
// (relief only on High graphics, Material relief: shopPbr), and metal, glass and paint that read as metal, glass and
// paint. The pictures load the first time the camera comes near (shopLoad, from pickup.js), so the phone downloads them
// only for a trip to town. SHOP.st: where each kind of stock is taken; pickup.js draws the stock on them
const SHOP={x:0,z:752,fz:744,lib:[],st:{mulch:[-20.6,746.2],tools:[-4.6,743.3],groc:[4.6,743.2]},loaded:false};
// a library material: its mean colour until the pictures are in (one per id, shared with the marina)
function shopLib(id){const m0=SHOP.lib.find(m=>m.userData.lib===id);if(m0)return m0;const d=MAT_LIST.find(m=>m.id===id),m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.85,envMap:skyEnv,envMapIntensity:0.5});
  m.color.setRGB(d.c[0],d.c[1],d.c[2]);m.userData.ft=d.ft;m.userData.lib=id;SHOP.lib.push(m);return m}
// road paint (centre lines, crosswalks, stop and yield bars, on every street): worn and weathered rather than fresh. In
// world space it wears through in patches and along the tyre lines, speckles where the grit shows, goes dull and a
// little dirty; wear 0 to 1 how far gone it is (brick wears the most, the paint sitting on the bricks' tops and lost
// in the joints and chipped edges), scaled live by the Road paint wear tuning. Drawn over the paving, see-through where thin
const PAINT_WORN=`varying vec3 vPw;uniform float uWear;
float pwH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pwN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(pwH(i),pwH(i+vec2(1,0)),f.x),mix(pwH(i+vec2(0,1)),pwH(i+1.0),f.x),f.y);}
`;
function wornPaint(c,wear){const m=new THREE.MeshStandardMaterial({color:c,roughness:0.8,envMap:skyEnv,envMapIntensity:0.4,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  m.userData.ft=4;m.userData.noWet=1;const u={get value(){return Math.min(0.95,wear*(typeof TU!=='undefined'?TU.lineWear:1))}};
  m.onBeforeCompile=sh=>{sh.uniforms.uWear=u;
    sh.vertexShader='varying vec3 vPw;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPw=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=PAINT_WORN+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
{vec2 p=vPw.xz;float big=pwN(p*0.35)*0.55+pwN(p*1.7)*0.3+pwN(p*6.0)*0.15,fine=pwN(p*23.0)*0.6+pwN(p*71.0)*0.4,chip=pwN(p*vec2(9.0,3.5)+7.0);
  float w=uWear,cov=smoothstep(w-0.12,w+0.18,big*0.75+fine*0.35-0.1*w*chip);
  cov*=mix(1.0,smoothstep(0.15,0.55,fine),w);
  vec3 dull=mix(vec3(dot(diffuseColor.rgb,vec3(0.33))),diffuseColor.rgb,0.72)*mix(0.72,0.97,big);
  diffuseColor.rgb=mix(dull,dull*vec3(0.82,0.78,0.72),0.5*(1.0-fine)*w);
  diffuseColor.a*=cov*mix(0.92,0.7,w);if(diffuseColor.a<0.02)discard;}`)};
  m.customProgramCacheKey=()=>'wornPaint';return m}
function shopStd(c,metal,rough,o){const m=new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:metal,roughness:rough,envMap:skyEnv},o||{}));m.userData.ft=4;return m}
function shopLoad(){if(SHOP.loaded)return;SHOP.loaded=true;
  for(const m of SHOP.lib){const L=k=>{const t=new THREE.TextureLoader().load(`textures/${m.userData.lib}${k}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(!k)t.colorSpace=THREE.SRGBColorSpace;return t};
    m.map=L('');m.color.setScalar(1);m.roughness=1;m.userData.n=L('_n');m.userData.r=L('_r');m.needsUpdate=true}
  for(const d of ST_SURF)if(d&&d.m)stSurfLoad(d.m);shopPbr(SHOP.pbr)}
// relief and sheen maps on (High graphics) or off
function shopPbr(on){SHOP.pbr=!!on;if(!SHOP.loaded)return;for(const m of SHOP.lib){m.normalMap=on?m.userData.n:null;m.roughnessMap=on?m.userData.r:null;m.roughness=on?1:0.85;m.needsUpdate=true}
  for(const d of ST_SURF)if(d&&d.m)stSurfPbr(d.m)}
// street paving besides asphalt (Main Street's brick, and sf on a map editor street: 1 brick, 2 cobblestone, 3 fan
// cobbles, 4 old brick, streets.js): CC0 photo-scanned paving
// (tools/street_tex.py, CREDITS.md) laid in the street's own frame, its rows straight across the street; ft the tile's
// size, dep how far the bricks stand up out of their joints at 100% (metres, the Street paving relief tuning), c the
// mean colour until the picture is in. Low and Medium draw the colour only; with Material relief (High) a parallax march
// through the height map raises every brick and sett, shades the joints on its far side from the sun, and reads the
// scan's normals, roughness and ambient occlusion where the eye's ray meets the paving (ST_POM)
const ST_SURF=[null,{id:'brick',n:'Brick',ft:5.09,dep:0.022,c:[0.604,0.534,0.523]},{id:'cobble',n:'Cobblestone',ft:3.77,dep:0.03,c:[0.479,0.470,0.409]},
  {id:'fan',n:'Fan cobbles',ft:17.7,dep:0.016,c:[0.426,0.397,0.355]},{id:'oldbrick',n:'Old brick',ft:6.73,dep:0.022,c:[0.421,0.392,0.371]}];
// the relief: from where the eye's ray enters the top of the paving it steps down through the height map (B of the _m
// map, 1 on top of a brick) to where it meets a brick or a joint, and from there a few steps toward the sun (shaded if a
// brick is in the way); dep in texture units, fading out by 130 ft so far paving stays calm and cheap
const ST_POM=`uniform float uStRel;
float stH(vec2 p,vec2 dx,vec2 dy){return textureGrad(roughnessMap,p,dx,dy).b;}
vec2 stPom(vec2 uv,vec3 V,vec3 L,float dep,out float sh){sh=1.0;if(dep<1e-5||V.z<=0.0)return uv;
  vec2 dx=dFdx(uv),dy=dFdy(uv),p=uv,pp=uv;float n=floor(mix(24.0,8.0,V.z)),st=1.0/n,l=0.0,h=1.0-stH(uv,dx,dy),hp=h;vec2 d=-V.xy/max(V.z,0.2)*dep*st;
  for(int i=0;i<24;i++){if(l>=h||float(i)>=n)break;pp=p;hp=h;p+=d;l+=st;h=1.0-stH(p,dx,dy);}
  float a=h-l,b=hp-l+st;p=mix(p,pp,clamp(a/min(a-b,-1e-5),0.0,1.0));
  float hd=1.0-stH(p,dx,dy);if(L.z>0.02&&hd>0.02){vec2 e=L.xy/max(L.z,0.15)*dep*hd/6.0;float o=0.0;
    for(int j=1;j<=6;j++){float f=float(j)/6.0;o=max(o,hd*(1.0-f)-1.0+stH(p+e*float(j),dx,dy));}
    sh=1.0-0.8*smoothstep(0.0,0.3,o);}
  return p;}
`;
const ST_POM_ON='defined(USE_NORMALMAP_TANGENTSPACE)&&defined(USE_ROUGHNESSMAP)';
function stPomPatch(sh){sh.uniforms.uStRel=this.userData.relU;
  sh.fragmentShader=sh.fragmentShader.replace('void main() {',`#if ${ST_POM_ON}\n${ST_POM}#endif\nvoid main() {`)
    .replace('#include <map_fragment>',`#if ${ST_POM_ON}
float stSh=1.0;vec2 stUv=vNormalMapUv;
{mat3 sT=getTangentFrame(-vViewPosition,normalize(vNormal),vNormalMapUv);vec3 sL=vec3(0.0,0.0,-1.0);
#if NUM_DIR_LIGHTS>0
sL=directionalLights[0].direction*sT;
#endif
stUv=stPom(vNormalMapUv,normalize(vViewPosition)*sT,sL,uStRel*(1.0-smoothstep(25.0,40.0,length(vViewPosition))),stSh);}
#define vMapUv stUv
#define vRoughnessMapUv stUv
#define vAoMapUv stUv
#endif
#include <map_fragment>`)
    .replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>\n#if ${ST_POM_ON}\n#define vNormalMapUv stUv\n#endif`)
    .replace('#include <lights_fragment_begin>',`#include <lights_fragment_begin>\n#if ${ST_POM_ON}\nreflectedLight.directDiffuse*=stSh;reflectedLight.directSpecular*=stSh;\n#endif`)}
// a surface's material, made the first time a street uses it, in its mean colour until the library's pictures load
// (shopLoad); its relief maps load the first time relief is on (shopPbr)
function stSurfMat(f){const d=ST_SURF[f];if(d.m)return d.m;
  const m=d.m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.8,envMap:skyEnv,envMapIntensity:0.5,aoMapIntensity:0.6});
  m.color.setRGB(d.c[0],d.c[1],d.c[2]);m.userData.lib='street_'+d.id;m.userData.ft=d.ft;m.onBeforeCompile=stPomPatch;
  m.userData.relU={get value(){return d.dep*TU.stRelief/(d.ft*0.3048)}};
  if(typeof wetPatch==='function')wetPatch(m);if(SHOP.loaded)stSurfLoad(m);return m}
function stTex(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
function stSurfLoad(m){new THREE.TextureLoader().load(`textures/${m.userData.lib}.jpg`,t=>{stTex(t);t.colorSpace=THREE.SRGBColorSpace;m.map=t;m.color.setScalar(1);m.needsUpdate=true});stSurfPbr(m)}
function stSurfPbr(m){const on=SHOP.pbr&&SHOP.loaded,u=m.userData;
  if(on&&u.n===undefined){u.n=null;let k=0;const L=s=>stTex(new THREE.TextureLoader().load(`textures/${u.lib}${s}.jpg`,()=>{if(++k===2){u.n=n;u.r=r;stSurfPbr(m)}})),n=L('_n'),r=L('_m');return}
  const p=on&&!!u.n;if(!!m.normalMap===p)return;m.normalMap=p?u.n:null;m.roughnessMap=m.aoMap=p?u.r:null;m.roughness=p?1:0.8;m.needsUpdate=true}
// parts merged per material, with texture coordinates in world metres (each material's tile size in feet), so brick
// courses and concrete joints keep their real size on every part
function shopKit(){const parts=new Map(),O=new THREE.Object3D(),n=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();O.rotation.order='YXZ';
  function put(mat,g,x,y,z,ry,rx){O.position.set(x||0,y||0,z||0);O.rotation.set(rx||0,ry||0,0);O.updateMatrix();
    if(g.index)g=g.toNonIndexed();g.applyMatrix4(O.matrix);const P=g.attributes.position.array,t=1/(mat.userData.ft*0.3048),uv=new Float32Array(P.length/3*2);
    for(let i=0;i<P.length;i+=9){a.set(P[i+3]-P[i],P[i+4]-P[i+1],P[i+5]-P[i+2]);b.set(P[i+6]-P[i],P[i+7]-P[i+1],P[i+8]-P[i+2]);n.crossVectors(a,b);
      const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);
      for(let k=0;k<3;k++){const q=i+k*3,o=(i/3+k)*2;if(ay>=ax&&ay>=az){uv[o]=P[q]*t;uv[o+1]=P[q+2]*t}else if(ax>=az){uv[o]=P[q+2]*t;uv[o+1]=P[q+1]*t}else{uv[o]=P[q]*t;uv[o+1]=P[q+1]*t}}}
    g.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(g)}
  return {put,box:(mat,w,h,d,x,y,z,ry,rx)=>put(mat,new THREE.BoxGeometry(w,h,d),x,y,z,ry,rx),
    cyl:(mat,r,h,x,y,z)=>put(mat,new THREE.CylinderGeometry(r,r,h,10),x,y,z),
    // a sheet lying on the ground, lift above it, x0 to x1 by z0 to z1
    sheet:(mat,x0,x1,z0,z1,lift)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0,Math.max(1,Math.round((x1-x0)/2)),Math.max(1,Math.round((z1-z0)/2)));g.rotateX(-Math.PI/2);
      const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+(x0+x1)/2,z=p.getZ(i)+(z0+z1)/2;p.setXYZ(i,x,baseHeight(x,z)+lift,z)}put(mat,g)},
    add(to){for(const [mat,list] of parts){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
      for(const g of list){P.set(g.attributes.position.array,o*3);U.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;g.dispose()}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));geo.computeVertexNormals();geo.computeBoundingSphere();
      const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER);(to||scene).add(m)}}}}
(function(){const K=shopKit(),F=famKit(),fz=SHOP.fz,g0=baseHeight(0,fz),fl=g0+0.14,yb=g0-0.5,top=fl+6.2,par=top+0.7,mid=(par+yb)/2,hgt=par-yb;
  const brick=shopLib('brick'),conc=shopLib('concrete_broom'),asph=shopLib('asphalt'),corr=shopLib('corrugated'),cap=shopLib('concrete'),roof=shopLib('concrete_old'),wood=shopLib('planks');
  const bronze=shopStd(0x3b3631,0.85,0.35),glass=shopStd(0x6f8794,0.1,0.04,{envMapIntensity:1.4,transparent:true,opacity:0.3,depthWrite:false}),green=shopStd(0x23402f,0.3,0.45),galv=shopStd(0x9aa0a4,0.9,0.38),
    paint=shopStd(0xe9e6dc,0,0.75),dark=shopStd(0x2b2d2f,0.2,0.6),pot=shopStd(0x1e1f20,0,0.55);
  // the store: brick walls with a parapet and its concrete coping, pilasters down the sides, a roll-up door on the east
  K.box(brick,30,hgt,0.35,0,mid,fz+15.825);for(const s of [-1,1]){K.box(brick,0.35,hgt,16,s*14.825,mid,fz+8);for(const z of [fz+3,fz+8,fz+13])K.box(brick,0.14,hgt,0.6,s*15.07,mid,z)}
  for(const s of [-1,1])K.box(brick,5,hgt,0.35,s*12.5,mid,fz+0.175);K.box(brick,20,par-fl-3.3,0.35,0,(par+fl+3.3)/2,fz+0.175);K.box(brick,20,fl-yb,0.35,0,(fl+yb)/2,fz+0.175);
  K.box(roof,29.3,0.2,15.3,0,top,fz+8);K.box(cap,30.3,0.25,0.42,0,fl+3.42,fz+0.12);
  for(const z of [fz+0.15,fz+15.85])K.box(cap,30.3,0.12,0.5,0,par+0.06,z);for(const s of [-1,1])K.box(cap,0.5,0.12,16.2,s*14.85,par+0.06,fz+8);
  K.box(corr,3.6,3.8,0.08,15.06,fl+1.9,fz+10,Math.PI/2);K.box(dark,0.12,0.2,3.8,15.07,fl+3.9,fz+10);
  // the glass front: bronze mullions, a transom, the sliding doors in the middle with their push bars and kick plates
  // (the doors slide apart as the worker comes up to them: rmDoor, interiors.js)
  for(const s of [-1,1])K.box(glass,8.75,3.3,0.04,s*5.625,fl+1.65,fz+0.2);K.box(glass,2.5,0.85,0.04,0,fl+2.875,fz+0.2);
  for(const x of [-10,-8.75,-6.25,-3.75,-1.25,1.25,3.75,6.25,8.75,10])K.box(bronze,0.1,3.3,0.16,x,fl+1.65,fz+0.16);
  for(const y of [fl+0.06,fl+2.45,fl+3.26])for(const s of [-1,1])K.box(bronze,y===fl+2.45?10.05:8.8,y===fl+0.06?0.12:0.1,0.16,s*(y===fl+2.45?5.025:5.65),y,fz+0.16);
  rmDoor('slide',0,fl,fz+0.28,Math.PI,1.25,1.2);rmDoor('slide',1.25,fl,fz+0.28,Math.PI,1.25,-1.2);
  // the canopy over the walk on its posts, lit underneath
  const cy=fl+3.55;K.box(green,31,0.34,3.9,0,cy+0.17,fz-1.9);K.box(galv,30.8,0.03,3.7,0,cy-0.005,fz-1.9);
  for(const x of [-14.6,-7.5,7.5,14.6]){K.box(green,0.16,cy-g0+0.1,0.16,x,(cy+g0-0.1)/2,fz-3.6);SOLIDS.push({x,z:fz-3.6,hx:0.08,hz:0.08})}
  for(const x of [-11,-5.5,0,5.5,11])F.lit(new THREE.BoxGeometry(0.5,0.04,0.5),0xfff1c8,x,cy-0.03,fz-1.9);
  // the walk in front: broom-finish concrete with its curb; the lot: asphalt with painted stalls, two lamp poles
  K.sheet(conc,-15.5,15.5,fz-3.8,fz+0.02,0.12);walkPad(0,fz-1.89,15.5,1.91,0,0,{l:0.12});K.box(conc,31,0.3,0.16,0,baseHeight(0,fz-3.8)-0.03,fz-3.8);
  K.sheet(asph,-27.5,17.5,724.5,fz-3.8,0.04);walkPad(-5,(724.5+fz-3.8)/2,22.5,(fz-3.8-724.5)/2,0,0,{l:0.04});
  for(let x=-25.4;x<16;x+=3.2)if(Math.abs(x)>4.2)K.sheet(paint,x-0.06,x+0.06,fz-10.4,fz-4.6,0.055);
  for(const [x,z] of [[-13,731],[10,731]]){const y=baseHeight(x,z);F.cyl(0.25,0.3,0.6,10,0xa3a19a,x,y+0.3,z);F.cyl(0.08,0.11,8,8,0x3a3d40,x,y+4.3,z);
    for(const s of [-1,1]){F.box(1.0,0.08,0.08,0x3a3d40,x+s*0.5,y+8.2,z);F.box(0.55,0.14,0.32,0x2f3236,x+s*1.05,y+8.15,z);F.lit(new THREE.BoxGeometry(0.45,0.03,0.24),0xfff1c8,x+s*1.05,y+8.07,z)}
    SOLIDS.push({x,z,hx:0.3,hz:0.3})}
  // the garden centre: a concrete pad under a shade roof of corrugated steel on galvanized posts, two pallets of bagged
  // mulch, and benches of potted shrubs along the back
  const gy=baseHeight(-21,749)+3.4;K.sheet(conc,-27.4,-15.2,fz-3.8,fz+14.2,0.07);walkPad(-21.3,fz+5.2,6.1,9,0,0,{l:0.07});
  K.box(corr,11.6,0.05,17.6,-21.3,gy,fz+5.2);for(const z of [fz-3.7,fz+14])K.box(green,11.8,0.28,0.1,-21.3,gy-0.08,z);K.box(green,0.1,0.28,17.8,-27.15,gy-0.08,fz+5.2);
  for(const x of [-26.9,-21.3,-15.7])for(const z of [fz-3.4,fz+5.2,fz+13.7]){if(x===-15.7&&z>fz)continue;const y=baseHeight(x,z);K.cyl(galv,0.06,gy-y,x,(gy+y)/2,z);SOLIDS.push({x,z,hx:0.1,hz:0.1})}
  for(const px of [-21.9,-19.3]){const y=baseHeight(px,fz+2.2)+0.07;walkPad(px,fz+2.2,0.6,0.5,0,y+0.13);for(const dz of [-0.45,0,0.45])K.box(wood,1.2,0.1,0.14,px,y+0.05,fz+2.2+dz);for(let dx=-0.52;dx<0.6;dx+=0.26)K.box(wood,0.12,0.03,1.0,px+dx,y+0.115,fz+2.2)}
  SOLIDS.push({x:-20.6,z:fz+2.2,hx:1.35,hz:0.55});
  for(let i=0;i<9;i++){const x=-26.2,z=fz+5.6+i*0.95,y=baseHeight(x,z)+0.07;if(i===0)K.box(wood,1.0,0.06,8.8,x,y+0.62,fz+9.4);
    for(const lx of [-0.28,0.24]){const r=0.16+0.04*((i+lx*3)%2);K.put(pot,new THREE.CylinderGeometry(r,r*0.8,r*1.5,12),x+lx,y+0.65+r*0.75,z);
      F.geo(new THREE.IcosahedronGeometry(r*1.5,1),[0x3d6b2f,0x4f7a36,0x2f5a2a][(i+(lx>0?1:0))%3],x+lx,y+0.65+r*1.5+r*1.1,z,i)}}
  for(const z of [fz+5.4,fz+13.4])K.box(galv,0.06,0.6,0.06,-26.2,baseHeight(-26.2,z)+0.37,z);SOLIDS.push({x:-26.2,z:fz+9.4,hx:0.55,hz:4.5});
  // by the doors: a steel shelf of toolboxes and a stand of groceries
  {const [x,z]=SHOP.st.tools,y=baseHeight(x,z)+0.12;for(const s of [-1,1])K.box(galv,0.05,1.8,0.5,x+s*0.92,y+0.9,z);K.box(dark,1.85,1.7,0.03,x,y+0.95,z+0.24);
    for(const h of [0.12,0.62,1.12])K.box(galv,1.85,0.03,0.5,x,y+h,z);SOLIDS.push({x,z,hx:0.95,hz:0.3})}
  {const [x,z]=SHOP.st.groc,y=baseHeight(x,z)+0.12;K.box(wood,1.95,0.05,0.8,x,y+0.8,z);for(const s of [-1,1])for(const t of [-1,1])K.box(dark,0.05,0.8,0.05,x+s*0.92,y+0.4,z+t*0.35);
    SOLIDS.push({x,z,hx:1.0,hz:0.45})}
  // solid: the back and side walls, the front either side of the doors
  SOLIDS.push({x:0,z:fz+8,hx:15.1,hz:8.1,foot:1},{x:0,z:fz+15.85,hx:15.1,hz:0.25});for(const s of [-1,1])SOLIDS.push({x:s*14.85,z:fz+8,hx:0.25,hz:8.1},{x:s*8.2,z:fz+0.18,hx:6.95,hz:0.2});
  // inside, through the glass: a polished floor, rows of gondola shelves full of goods, shelves along the back wall,
  // produce tables, three checkouts by the doors, rows of lights; cashiers and shoppers (TF_ROOMS)
  {const fi=Math.max(fl,rmGroundMax(0,fz+8,0,29.2,15.2)+0.03),R=rmKit(F,0,fz+8,fi,Math.PI);R.box(29.2,fi-yb,15.2,0xb9b6ad,0,0,yb-fi);walkPad(0,fz+8,14.6,7.6,0,fi);rmRoom(0,fz+8,Math.PI,14.6,7.6,fi,fl+6);
    // the entrance: the floor stands over the sloping walk, so a gentle concrete ramp runs up to it through the doors
    {const z0=fz-1.8,z1=fz+0.45,t0=baseHeight(0,z0)+0.12,L=z1-z0,ri=Math.max(0,fi-t0);if(ri>0.05){K.box(conc,2.7,0.12,Math.hypot(L,ri),0,t0+ri/2-0.06,(z0+z1)/2,0,-Math.atan2(ri,L));walkPad(0,(z0+z1)/2,1.35,L/2,0,t0,{rise:ri})}}
    for(const s of [-12,-8,-4,4,8,12])for(let o=-5.6;o<=1.4;o+=1.25){rmShelf(R,o,s-0.25,-Math.PI/2,1.2,s*3+o*5+60);rmShelf(R,o,s+0.25,Math.PI/2,1.2,s*7+o*3+90)}
    for(let s=-13.2;s<=13.21;s+=1.3)rmShelf(R,-7.15,s,0,1.2,s*11+7);
    for(const s of [-12,-8,-4,4,8,12])for(let o=-6.2;o<=2.0;o+=4.1){const [a,b]=R.P(o,s);F.lit(new THREE.BoxGeometry(0.3,0.05,3.6),0xfff8ea,a,fl+5.2,b,0)}
    for(const s of [-10,-7])for(const o of [4.3]){R.box(2.2,0.8,1.1,0x6b4a30,o,s,0,Math.PI/2);R.solid(o,s,2.3,1.2,Math.PI/2);for(let k=0;k<18;k++)R.box(0.18,0.12,0.18,[0x3d8a4a,0xc8402e,0xe8a23a,0xe0d050][(k+(s>-8?2:0))%4],o-0.8+(k%6)*0.32,s-0.35+(k/6|0)*0.35,0.8)}
    for(const s of [3.5,6.5,9.5]){R.box(0.8,0.95,2.4,0x2a2c2f,4.6,s,0);R.solid(4.6,s,0.9,2.5);R.box(0.85,0.04,2.45,0x8a8e91,4.6,s,0.95);R.box(0.3,0.25,0.25,0x1e1f20,4.6,s,0.99);
      R.spot(4.6,s+0.7,-Math.PI/2,{staff:1});R.spot(4.4,s-0.75,Math.PI/2);R.spot(5.7,s-0.8,Math.PI)}
    for(const s of [-10,-6,-2,2,6,10])for(const o of [-4.6,-1.3])R.spot(o,s+((o*3|0)%2?0.6:-0.6),((s+o*2)|0)%2?Math.PI/2:-Math.PI/2);
    R.spot(5.5,-8.5,Math.PI*0.8);R.spot(3.2,-11.4,Math.PI/2);R.spot(-6.1,0.5,Math.PI);
    // shoppers walking the aisles, round and round, and a clerk up and down the main one
    for(const [a,b,t] of [[-10,-6,0],[2,6,9],[6,10,4]])R.spot(2.7,a,0,{staff:1,path:R.path([[2.7,a],[-6.55,a],[-6.55,b],[2.7,b],[2.7,a]]),at:t});
    R.spot(2.7,0,0,{staff:1,path:R.path([[2.7,0],[-6.4,0],[2.7,0]])});rmAdd(R,16,[0,6,11,18]);R.hrs=[7,21];R.nm='Lakeside General Store';R.store=1}
  K.add();famAdd(F);
  famSign(['LAKESIDE GENERAL STORE','Garden · Hardware · Groceries'],13,2.1,0,fl+5.05,fz-0.03,Math.PI,'#23402f','#f1ead8');
  famSign(['GARDEN CENTER','Mulch · Soil · Plants'],4.6,1.3,-21.3,gy+0.85,fz-3.78,Math.PI,'#23402f','#f1ead8');
  SHOP.y=fl})();

// ---------- the town's streets (mainStreets) ----------
// Main Street (x ±4, from the causeway to the store's lot) paved in brick and the cross street (z 652) in asphalt over
// their gravel (ISLAND_ROADS, terrain.js), with a concrete gutter, a 6 in curb and a raised broom-finish sidewalk scored every
// 5 ft each side; a four-way stop where they meet (stop bars, stop signs, crosswalks landing on curb ramps with yellow
// warning pads), a double yellow line, curb inlets to the storm drains and manhole covers. The beach road is paved
// without curbs. Like the rest of the town it is laid on the ground as it is at load (baseHeight)
const MST={x:4,z0:556,z1:724.5,cz:652,cw:3.5,walk:1.85,curb:0.15,top:0.17,lift:0.04};
// the mid-block crosswalks: across Main Street at these z (between the shops, clear of the lamps, trees, inlets and
// manholes) and across the cross street at these x (in the gaps between its first and second shops)
const MST_XW={z:[611,685.5],x:[-42,42]};
// curb ramps where the crosswalks land: the sidewalk slopes down to the gutter over 4 ft. Each: the span along the
// curb (a0..a1), which axis the curb runs along, the curb line and which way the sidewalk lies from it
const MST_RAMPS=[];for(const s of [-1,1]){const X=MST.x,C0=MST.cz-MST.cw,C1=MST.cz+MST.cw;for(const [z0,z1] of [[C0-5,C0-2],[C1+2,C1+5]])MST_RAMPS.push({a0:z0,a1:z1,ax:'z',c:s*X,o:s});
  for(const [x0,x1] of s<0?[[-9.3,-6.3]]:[[6.3,9.3]])for(const t of [-1,1])MST_RAMPS.push({a0:x0,a1:x1,ax:'x',c:t<0?C0:C1,o:t});
  for(const z of MST_XW.z)MST_RAMPS.push({a0:z-1.5,a1:z+1.5,ax:'z',c:s*X,o:s});for(const x of MST_XW.x)MST_RAMPS.push({a0:x-1.5,a1:x+1.5,ax:'x',c:s<0?C0:C1,o:s})}
// the sidewalk's top above the ground at x, z (lower down the ramps)
function mstRamp(x,z){for(const r of MST_RAMPS){const a=r.ax==='z'?z:x,d=(r.ax==='z'?x-r.c:z-r.c)*r.o;if(a>=r.a0&&a<=r.a1&&d>=0&&d<1.25)return 0.045+(MST.top-0.045)*d/1.25}return MST.top}
// how far the paving stands above the ground at x, z (0 off it): the asphalt of Main Street and the cross street, and
// the curbs and sidewalks; what feet and wheels stand on (groundLift)
function mstLift(x,z){if(z<MST.z0||z>MST.z1)return 0;const ax=Math.abs(x),C0=MST.cz-MST.cw,C1=MST.cz+MST.cw,WE=MST.x+MST.curb+MST.walk;
  if(ax<MST.x)return MST.lift;if(ax>140)return 0;if(z>=C0&&z<=C1)return MST.lift;if(z<576.5||ax>128)return 0;
  return ax<=WE||z>=C0-3.3&&z<C0||z>C1&&z<=C1+3.3?mstRamp(x,z):0}
function mainStreets(){const K=shopKit(),F=famKit(),G=baseHeight,asph=shopLib('asphalt'),walk=shopLib('concrete_broom'),conc=shopLib('concrete'),
    joint=shopStd(0x6a6862,0,0.95),yel=wornPaint(0xd8b024,0.42),wht=wornPaint(0xe9e7e0,0.45),pad=shopStd(0xd9a91c,0,0.8),
    X=MST.x,W=X+MST.curb,WE=W+MST.walk,C0=MST.cz-MST.cw,C1=MST.cz+MST.cw,XE=140,WX=128,BZ=576.5;
  // a sheet over the ground, lifted lift(x, z) (or a number) above it, cut every step metres
  const sheet=(mat,x0,x1,z0,z1,lift,step)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0,Math.max(1,Math.round((x1-x0)/step)),Math.max(1,Math.round((z1-z0)/step)));g.rotateX(-Math.PI/2);
    const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+(x0+x1)/2,z=p.getZ(i)+(z0+z1)/2;p.setXYZ(i,x,G(x,z)+(typeof lift==='function'?lift(x,z):lift),z)}K.put(mat,g)};
  // a strip w wide along a line of points on the ground
  const ribbon=(mat,pts,w,lift)=>{const P=[],tri=(a,b,c)=>{if((b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2])<0)[b,c]=[c,b];P.push(...a,...b,...c)};
    for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1],L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,n=Math.max(1,Math.round(L/2));
      const v=(t,s)=>{const x=ax+ux*t-uz*s*w/2,z=az+uz*t+ux*s*w/2;return [x,G(x,z)+lift,z]};
      for(let k=0;k<n;k++){const t0=k/n*L,t1=(k+1)/n*L+(k===n-1&&i<pts.length-2?w/2:0),a=v(t0,-1),b=v(t0,1),c=v(t1,-1),d=v(t1,1);tri(a,c,b);tri(b,c,d)}
      walkPad((ax+bx)/2,(az+bz)/2,w/2,L/2,Math.atan2(ux,uz),0,{l:lift})}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));K.put(mat,g)};
  const RAMPS=MST_RAMPS,rampAt=mstRamp;
  // the curb along a run from a to b of one axis at c (o: the sidewalk's side), low across the ramps; the gutter beside it
  const curb=(ax,a,b,c,o)=>{const cut=[a,b];for(const r of RAMPS)if(r.ax===ax&&Math.abs(r.c-c)<0.01)cut.push(r.a0,r.a1);cut.sort((p,q)=>p-q);
    for(let i=0;i<cut.length-1;i++){const p0=Math.max(a,cut[i]),p1=Math.min(b,cut[i+1]);if(p1-p0<0.01)continue;const n=Math.ceil((p1-p0)/1.5);
      for(let k=0;k<n;k++){const q0=p0+(p1-p0)*k/n,q1=p0+(p1-p0)*(k+1)/n,m=(q0+q1)/2,cx=ax==='z'?c+o*MST.curb/2:m,cz=ax==='z'?m:c+o*MST.curb/2,g=G(cx,cz);
        const low=RAMPS.some(r=>r.ax===ax&&Math.abs(r.c-c)<0.01&&m>r.a0&&m<r.a1),top=low?0.05:MST.top;
        if(ax==='z')K.box(conc,MST.curb,top+0.1,q1-q0,cx,g+(top-0.1)/2,cz);else K.box(conc,q1-q0,top+0.1,MST.curb,cx,g+(top-0.1)/2,cz)}}
    if(ax==='z')sheet(conc,Math.min(c,c-o*0.42),Math.max(c,c-o*0.42),a,b,MST.lift+0.006,1.5);else sheet(conc,a,b,Math.min(c,c-o*0.42),Math.max(c,c-o*0.42),MST.lift+0.006,1.5)};
  // the paving: Main Street in brick (its rows across the street, the bricks standing up with Material relief: ST_SURF),
  // the cross street each side of it and the beach road west and east (into the marina's car park) in asphalt; across
  // Harbor Square (square.js) the beach road is brick pavers
  sheet(stSurfMat(1),-X,X,MST.z0,MST.z1,MST.lift,2);for(const s of [-1,1])sheet(asph,s<0?-XE:X,s<0?-X:XE,C0,C1,MST.lift,2);
  ribbon(asph,[[-170,576],[-106,574.84]],5,MST.lift);ribbon(shopLib('herringbone'),[[-106,574.84],[-60,574],[-X,574]],5,MST.lift);ribbon(asph,[[X,574],[26,574],[36,582],[58.5,586.6]],5,MST.lift);
  // curbs, gutters and sidewalks along Main Street (from the beach road to the store's lot, round the cross street) and the cross street
  for(const s of [-1,1]){for(const [z0,z1] of [[BZ,C0],[C1,MST.z1]]){curb('z',z0,z1,s*X,s);sheet(walk,Math.min(s*W,s*WE),Math.max(s*W,s*WE),z0,z1,rampAt,0.6);
      for(let z=z0+1.5;z<z1-0.5;z+=1.5)sheet(joint,Math.min(s*W,s*WE),Math.max(s*W,s*WE),z-0.012,z+0.012,(x,zz)=>rampAt(x,zz)+0.004,2)}
    K.box(conc,MST.walk+MST.curb,MST.top+0.1,MST.curb,s*(X+(MST.walk+MST.curb)/2),G(s*5,BZ)+(MST.top-0.1)/2,BZ+MST.curb/2);
    for(const t of [-1,1]){const c=t<0?C0:C1,w0=t<0?C0-3.3:C1,w1=t<0?C0:C1+3.3;curb('x',s<0?-XE:X,s<0?-X:XE,c,t);
      sheet(walk,s<0?-WX:WE,s<0?-WE:WX,w0,w1,rampAt,0.6);for(let x=WE+1.5;x<WX-0.5;x+=1.5)sheet(joint,s*x-0.012,s*x+0.012,w0,w1,(xx,z)=>rampAt(xx,z)+0.004,2)}}
  // the warning pads at the foot of each ramp
  for(const r of RAMPS){const y=(x,z)=>rampAt(x,z)+0.006;if(r.ax==='z')sheet(pad,Math.min(r.c+r.o*MST.curb,r.c+r.o*0.75),Math.max(r.c+r.o*MST.curb,r.c+r.o*0.75),r.a0+0.3,r.a1-0.3,y,0.3);
    else sheet(pad,r.a0+0.3,r.a1-0.3,Math.min(r.c+r.o*MST.curb,r.c+r.o*0.75),Math.max(r.c+r.o*MST.curb,r.c+r.o*0.75),y,0.3)}
  // markings: double yellow lines, stop bars and crosswalks of wide white bars
  // (the yellow lines broken over the mid-block crosswalks: runs from a to b less the spans round each of cut)
  const L=MST.lift+0.008,runs=(a,b,cut)=>{const R=[];let p=a;for(const c of cut.filter(c=>c>a&&c<b).sort((u,v)=>u-v)){R.push([p,c-2.5]);p=c+2.5}R.push([p,b]);return R};
  for(const o of [-0.12,0.12]){for(const [a,b] of [[MST.z0,C0-6.2],[C1+6.2,MST.z1-0.5]])for(const [z0,z1] of runs(a,b,MST_XW.z))sheet(yel,o-0.05,o+0.05,z0,z1,L,3);
    for(const s of [-1,1])for(const [x0,x1] of runs(s<0?-XE:10.5,s<0?-10.5:XE,MST_XW.x))sheet(yel,x0,x1,MST.cz+o-0.05,MST.cz+o+0.05,L,3)}
  sheet(wht,-X+0.4,0,C0-6,C0-5.6,L,1);sheet(wht,0,X-0.4,C1+5.6,C1+6,L,1);sheet(wht,-10.3,-9.9,MST.cz,C1-0.4,L,1);sheet(wht,9.9,10.3,C0+0.4,MST.cz,L,1);
  for(let x=-3.6;x<=3.61;x+=0.9)for(const [z0,z1] of [[C0-5,C0-2],[C1+2,C1+5]])sheet(wht,x-0.22,x+0.22,z0,z1,L,1);
  for(let z=C0+0.5;z<=C1-0.49;z+=0.9)for(const [x0,x1] of [[-9.3,-6.3],[6.3,9.3]])sheet(wht,x0,x1,z-0.22,z+0.22,L,1);
  // the mid-block crosswalks, each with a yield line before it in each lane (where cars wait for people crossing)
  for(const z of MST_XW.z){for(let x=-3.6;x<=3.61;x+=0.9)sheet(wht,x-0.22,x+0.22,z-1.5,z+1.5,L,1);sheet(wht,-X+0.4,0,z-2.9,z-2.5,L,1);sheet(wht,0,X-0.4,z+2.5,z+2.9,L,1)}
  for(const x of MST_XW.x){for(let z=C0+0.5;z<=C1-0.49;z+=0.9)sheet(wht,x-1.5,x+1.5,z-0.22,z+0.22,L,1);sheet(wht,x+2.5,x+2.9,C0+0.4,MST.cz,L,1);sheet(wht,x-2.9,x-2.5,MST.cz,C1-0.4,L,1)}
  // curb inlets: a cast grate in the gutter, the dark mouth in the curb face, the cover behind it with its drains-to-lake medallion
  const inlet=(x,z,ax,o)=>{const g=G(x,z),gx=ax==='z'?x-o*0.24:x,gz=ax==='z'?z:z-o*0.24,ry=ax==='z'?0:Math.PI/2;
    F.box(0.46,0.03,0.92,0x1c1d1e,gx,g+MST.lift+0.012,gz,ry);for(let i=-2;i<=2;i++){const a=i*0.08;F.box(0.03,0.035,0.86,0x4a4946,gx+(ax==='z'?a:0),g+MST.lift+0.02,gz+(ax==='z'?0:a),ry)}
    F.box(0.03,0.09,1.1,0x111213,ax==='z'?x+o*0.005:x,g+MST.lift+0.075,ax==='z'?z:z+o*0.005,ry);
    const hx=ax==='z'?x+o*(MST.curb+0.35):x,hz=ax==='z'?z:z+o*(MST.curb+0.35);F.box(0.6,0.02,1.3,0xb9b6ad,hx,g+MST.top+0.01,hz,ry);F.cyl(0.08,0.08,0.012,10,0x2a5f9a,hx,g+MST.top+0.025,hz)};
  for(const s of [-1,1]){for(const z of [588,620,640.5,664,698,721])inlet(s*X,z,'z',s);for(const x of [24,60,96,126])for(const t of [-1,1])inlet(s*x,t<0?C0:C1,'x',t)}
  // manhole covers in the lanes: a cast iron lid in its frame with a raised cross, and a few water valve boxes in the sidewalks
  const hole=(x,z)=>{const g=G(x,z)+MST.lift;F.cyl(0.4,0.4,0.03,18,0x57544e,x,g+0.008,z);F.cyl(0.33,0.33,0.03,18,0x3b3a37,x,g+0.016,z);
    for(const a of [0.4,0.4+Math.PI/2])F.box(0.56,0.012,0.05,0x302f2c,x,g+0.033,z,a)};
  for(const [x,z] of [[-2,598],[2,626],[0,MST.cz],[-2,688],[2,712],[-2,566],[-30,650.2],[30,653.8],[-70,653.8],[70,650.2],[-110,650.2],[110,653.8]])hole(x,z);
  for(const [x,z] of [[-5.6,601],[5.6,679],[-40,646],[80,657.8]]){const g=G(x,z)+MST.top;F.box(0.28,0.012,0.28,0x45433f,x,g+0.006,z)}
  // a stop sign at each corner, on the right before the stop bar, facing the traffic that stops there
  const cv=document.createElement('canvas');cv.width=cv.height=128;{const g=cv.getContext('2d'),R=62,P=n=>{g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(64+Math.cos(a)*n,64+Math.sin(a)*n)}g.closePath()};
    g.fillStyle='#ffffff';P(R);g.fill();g.fillStyle='#b8202a';P(R-5);g.fill();g.fillStyle='#ffffff';g.font='700 38px "Barlow Condensed","Arial Narrow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('STOP',64,66)}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const smat=M(0xffffff,{map:tex,transparent:true,alphaTest:0.5,flatShading:false}),sgeo=new THREE.PlaneGeometry(0.76,0.76);
  for(const [x,z,ry] of [[-X-0.9,C0-6.6,Math.PI],[X+0.9,C1+6.6,0],[-10.8,C1+0.9,-Math.PI/2],[10.8,C0-0.9,Math.PI/2]]){const g=G(x,z)+MST.top;
    F.cyl(0.035,0.035,2.5,6,0x9aa0a4,x,g+1.25,z);F.geo(new THREE.CylinderGeometry(0.36,0.36,0.02,8,1,false,Math.PI/8),0x8a8e91,x+Math.sin(ry)*0.045,g+2.25,z+Math.cos(ry)*0.045,ry,Math.PI/2);
    const m=new THREE.Mesh(sgeo,smat);m.position.set(x+Math.sin(ry)*0.06,g+2.25,z+Math.cos(ry)*0.06);m.rotation.y=ry;scene.add(m);SOLIDS.push({x,z,hx:0.1,hz:0.1})}
  K.add();famAdd(F)}
mainStreets();groundLift=mstLift;

// ---------- behind the shops: the alleys, the wires and the weathering ----------
// A service lane behind each block of Main Street (old asphalt, out to the cross street's sidewalk past the corner
// lot), with dumpsters, pallets and crates by the back doors (some behind the cross street's shops too, all solid);
// wooden utility poles along its far side with three power lines on a crossarm and a phone cable under them, sagging
// between the poles, a service drop to each building and a transformer on every other pole (the wires: one mesh of
// lines). Placed clear of everything solid, so a lot built elsewhere (or none) leaves its alley out
const MAIN_POLES=[];
function mainAlleys(){const K=shopKit(),T=famKit(),asph=shopLib('asphalt'),G=baseHeight,WP=[];let sd=17;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const clear=(x,z,r)=>!SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+(s.foot?0.1:r)&&Math.abs(z-s.z)<s.hz+(s.foot?0.1:r));
  const wire=(a,b,sag)=>{const L=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.max(4,Math.round(L/3)),sg=sag+0.0025*L*L/10;let p=a;
    for(let i=1;i<=n;i++){const t=i/n,q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sg*4*t*(1-t),a[2]+(b[2]-a[2])*t];WP.push(...p,...q);p=q}};
  // a dumpster (its long side along the wall, yaw r), a stack of pallets, a few crates
  const dump=(x,z,r,col)=>{const y=G(x,z),fx=Math.sin(r),fz=Math.cos(r),P=(o,s)=>[x+fx*o+fz*s,z+fz*o-fx*s];T.box(1.85,1.05,1.05,col,x,y+0.68,z,r);
    T.box(1.95,0.08,1.15,col,x,y+1.22,z,r);for(const s of [-1,1]){const [a,b]=P(0.02,s*0.47);T.box(0.9,0.05,1.1,0x1e2022,a,y+1.3,b,r,0.08)}
    for(const s of [-1,1]){const [a,b]=P(0,s*0.98);T.box(0.08,0.12,0.9,col,a,y+0.9,b,r)}for(const [o,s] of [[-0.4,-0.75],[-0.4,0.75],[0.4,-0.75],[0.4,0.75]]){const [a,b]=P(o,s);T.cyl(0.08,0.08,0.06,8,0x1a1a1a,a,y+0.09,b,r,0,Math.PI/2)}
    rmSolid(x,z,r,1.0,0.6);mainGrimeFloor(x,z,2.6,1.8,r+0.3,6,0.035)};
  const pallets=(x,z,r,n)=>{const y=G(x,z);for(let i=0;i<n;i++){const yy=y+0.07+i*0.145,a=r+(rnd()-0.5)*0.15;for(const t of [-0.5,0,0.5]){T.box(1.2,0.1,0.1,0x7a6a52,x+Math.sin(a)*t,yy,z+Math.cos(a)*t,a)}
      for(let k=-2;k<=2;k++)T.box(0.12,0.025,1.0,0xa08a64,x+Math.cos(a)*k*0.27,yy+0.065,z-Math.sin(a)*k*0.27,a)}rmSolid(x,z,r,0.62,0.52)};
  const crates=(x,z,r)=>{const y=G(x,z);T.box(0.55,0.42,0.4,0x2a5f9a,x,y+0.21,z,r);T.box(0.55,0.42,0.4,0x2a5f9a,x+0.05,y+0.63,z+0.02,r+0.1);T.box(0.6,0.5,0.5,0x9a7a52,x+Math.cos(r)*0.65,y+0.25,z-Math.sin(r)*0.65,r-0.2);
    rmSolid(x+Math.cos(r)*0.32,z-Math.sin(r)*0.32,r,0.7,0.32)};
  const DUMP=[0x2f5a3a,0x2a4f7a,0x3a4a3f,0x5a3a2a];let nd=0;
  // the lanes behind Main Street's blocks
  const st0=MST.cz-MST.cw-3.3,st1=MST.cz+MST.cw+3.3;
  for(const sx of [-1,1])for(const nb of [-1,1]){const L=MAIN_BACKS.filter(b=>Math.abs(Math.sin(b.face))>0.9&&Math.sign(b.x)===sx&&Math.sign(b.z-MST.cz)===nb);if(!L.length)continue;
    const xi=Math.min(...L.map(b=>Math.abs(b.x)+b.d/2))-0.1,xo=Math.max(...L.map(b=>Math.abs(b.x)+b.d/2))+4.4,za=Math.min(...L.map(b=>b.z-b.w/2))-1,zb=Math.max(...L.map(b=>b.z+b.w/2))+1;
    // the mouth onto the cross street, between the corner lot's back and the cross street's first shop
    const z0=nb<0?za:st1,z1=nb<0?st0:zb,zm0=nb<0?zb:st1,zm1=nb<0?st0:za;let xm=xo;
    for(const s of SOLIDS)if(s.foot&&Math.abs(s.x)-s.hx>xi&&Math.sign(s.x)===sx&&s.z+s.hz>zm0&&s.z-s.hz<zm1)xm=Math.min(xm,Math.abs(s.x)-s.hx-0.3);
    const pave=(a,b,c,d)=>{if(b-a<1||d-c<1)return;const x0=sx<0?-b:a,x1=sx<0?-a:b;K.sheet(asph,x0,x1,c,d,0.03);walkPad((x0+x1)/2,(c+d)/2,(x1-x0)/2,(d-c)/2,0,0,{l:0.03})};
    pave(xi,xo,za,zb);pave(xi,xm,zm0,zm1);
    // patches, cracks and oil in it
    for(let z=za+2;z<zb-2;z+=3+rnd()*4){const x=sx*(xi+0.8+rnd()*(xo-xi-1.6)),k=rnd();mainGrimeFloor(x,z,1.2+rnd()*2.4,1+rnd()*1.8,rnd()*6.3,k<0.35?3:k<0.6?4:k<0.85?2:6,0.035)}
    // dumpsters and the rest by every other back door
    L.forEach((b,i)=>{const r=b.face,[x,z]=b.F(-b.d/2-0.75,-b.ds);if(i%2===0&&clear(x,z,0.3)){dump(x,z,r,DUMP[nd++%DUMP.length])}
      const [px,pz]=b.F(-b.d/2-0.75,b.ds+Math.sign(b.ds||1)*(1.9+rnd()));if(i%3===1&&clear(px,pz,0.3))pallets(px,pz,r+0.1,1+(i%3));
      const [cx,cz]=b.F(-b.d/2-0.5,b.ds-Math.sign(b.ds||1)*2.2);if(i%2===1&&clear(cx,cz,0.3))crates(cx,cz,r+Math.PI/2)});
    // the poles along the far side (not in the mouth), every 25 to 30 m, and the wires between them
    const px=sx*(xo+0.5),n=Math.max(1,Math.round((zb-za)/28)),poles=[];
    for(let i=0;i<=n;i++){let z=za+1.5+(zb-za-3)*i/n;for(const dz of [0,2,-2,4,-4])if(clear(px,z+dz,0.6)){z+=dz;poles.push(z);break}}
    const P=poles.map((z,i)=>{const g=G(px,z),top=g+9.6;T.cyl(0.12,0.17,10.4,8,0x5e4b39,px,g+4.8,z);T.box(2.4,0.12,0.12,0x6a5844,px,top-0.45,z);
      for(const t of [-1,1])T.box(0.9,0.06,0.06,0x5a4a3a,px+t*0.32,top-0.75,z,0,0,t*Math.PI/4);
      for(const t of [-1.05,0,1.05])T.cyl(0.05,0.07,0.18,6,0x6f8f7a,px+t,(t?top-0.3:top+0.5),z);
      if(i%2===1){T.cyl(0.3,0.3,0.95,12,0x8f9396,px+sx*0.42,top-2.0,z);T.cyl(0.32,0.32,0.06,12,0x6e7174,px+sx*0.42,top-1.5,z);T.box(0.3,0.08,0.08,0x5a4a3a,px+sx*0.2,top-1.7,z)}
      SOLIDS.push({x:px,z,hx:0.2,hz:0.2});MAIN_POLES.push([px,z]);return {z,g,top}});
    for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];for(const t of [-1.05,0,1.05])wire([px+t,(t?a.top-0.2:a.top+0.6),a.z],[px+t,(t?b.top-0.2:b.top+0.6),b.z],0.35);
      wire([px-sx*0.17,a.top-3.4,a.z],[px-sx*0.17,b.top-3.4,b.z],0.5)}
    // guy wires off the end poles
    for(const [e,dz] of [[P[0],-1],[P[P.length-1],1]])if(e&&P.length>1)WP.push(px,e.top-0.4,e.z,px,G(px,e.z+dz*4)+0.1,e.z+dz*4);
    // a service drop from the nearest pole to each building, to a mast bracket on its back wall
    if(P.length)for(const b of L){const near=P.reduce((m,p)=>Math.abs(p.z-b.z)<Math.abs(m.z-b.z)?p:m),[hx,hz]=b.F(-b.d/2-0.15,b.ds*0.3),hy=b.y+Math.min(b.h,6.5)-0.4;
      T.box(0.06,0.9,0.06,0x2a2c2f,hx,hy+0.2,hz);T.box(0.18,0.25,0.14,0x8f9396,...b.F(-b.d/2-0.08,b.ds*0.3+0.4),hy-1.1,b.face);wire([px,near.top-2.6,near.z],[hx,hy+0.6,hz],0.3)}}
  // dumpsters behind some of the cross street's shops
  MAIN_BACKS.forEach((b,i)=>{if(Math.abs(Math.sin(b.face))>0.9||i%3)return;const [x,z]=b.F(-b.d/2-0.8,-b.ds);if(clear(x,z,0.4))dump(x,z,b.face,DUMP[nd++%DUMP.length])});
  // oil stains in the parking stalls, patches and cracks in the lots and across the cross street (some through the
  // crosswalks' paint, where the asphalt has been cut and patched)
  for(let x=-25.4;x<16;x+=3.2)if(Math.abs(x)>4.2&&rnd()<0.7)mainGrimeFloor(x+1.6,SHOP.fz-7.2+rnd()*1.5,0.9+rnd()*0.8,0.8+rnd()*0.9,rnd()*6.3,2,0.048);
  for(let i=0;i<9;i++)mainGrimeFloor(-26+rnd()*42,725.5+rnd()*13,1.5+rnd()*3,1+rnd()*2.5,rnd()*6.3,rnd()<0.5?3:4,0.046);
  for(let x=60.5;x<128;x+=3)for(const z of [585.8,608.2])if(rnd()<0.55)mainGrimeFloor(x+1.5,z+(rnd()-0.5),0.9+rnd()*0.8,0.8+rnd()*0.9,rnd()*6.3,2,0.048);
  for(let i=0;i<14;i++)mainGrimeFloor(59+rnd()*70,583+rnd()*28,1.5+rnd()*3.5,1+rnd()*2.5,rnd()*6.3,rnd()<0.55?3:4,0.046);
  for(let i=0;i<12;i++){const x=(rnd()<0.5?-1:1)*(12+rnd()*110),z=MST.cz+(rnd()-0.5)*(2*MST.cw-1);mainGrimeFloor(x,z,1.5+rnd()*3,0.8+rnd()*1.8,(rnd()-0.5)*0.4,rnd()<0.6?3:4,0.046)}
  for(const x of MST_XW.x)mainGrimeFloor(x+(rnd()-0.5),MST.cz+(x<0?1.6:-1.6),2.2,1.5,0.1,4,0.052);
  K.add();famAdd(T);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(WP,3));scene.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x161616})))}
// the grime picture (cells of 256 px: MAIN_GRIME's kinds), drawn at load, and every decal a quad of it, as one mesh
let mainGrimeM=null,mainGrimeOn=true;
function mainGrimeAdd(){const cv=document.createElement('canvas');cv.width=cv.height=1024;const g=cv.getContext('2d');let sd=29;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const cell=(k,f)=>{g.save();g.beginPath();g.rect((k%4)*256,(k/4|0)*256,256,256);g.clip();g.translate((k%4)*256,(k/4|0)*256);f();g.restore()};
  const streaks=(n,l0,l1,col,top)=>{const tg=g.createLinearGradient(0,0,0,top);tg.addColorStop(0,`rgba(${col},0.3)`);tg.addColorStop(1,`rgba(${col},0)`);g.fillStyle=tg;g.fillRect(0,0,256,top);
    for(let i=0;i<n;i++){const x=rnd()*256,w=1+rnd()*5,l=l0+rnd()*(l1-l0),a=0.06+rnd()*0.22,gr=g.createLinearGradient(0,0,0,l);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(x,0,w,l)}};
  const blob=(x,y,r,col,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)};
  cell(0,()=>streaks(70,40,256,'40,36,32',50));
  cell(1,()=>{for(let x=0;x<256;x+=4){const h=70+50*Math.sin(x*0.05+1)+30*rnd(),gr=g.createLinearGradient(0,256,0,256-h);gr.addColorStop(0,'rgba(34,32,28,0.5)');gr.addColorStop(1,'rgba(34,32,28,0)');g.fillStyle=gr;g.fillRect(x,256-h,4,h)}
    for(let i=0;i<12;i++)blob(rnd()*256,200+rnd()*56,20+rnd()*30,'30,28,24',0.15)});
  cell(2,()=>{for(let i=0;i<7;i++)blob(128+(rnd()-0.5)*70,128+(rnd()-0.5)*70,30+rnd()*80,'12,12,12',0.22+rnd()*0.15)});
  cell(3,()=>{for(let j=0;j<3;j++){let x=0,y=40+rnd()*176;const P=[[x,y]];while(x<256){x+=6+rnd()*14;y+=(rnd()-0.5)*22;P.push([x,y])}
      for(const [w,c] of [[7,'rgba(14,14,14,0.3)'],[1.8,'rgba(8,8,8,0.85)']]){g.lineWidth=w;g.strokeStyle=c;g.beginPath();P.forEach(([a,b],i)=>i?g.lineTo(a,b):g.moveTo(a,b));g.stroke()}
      for(let b=0;b<3;b++){const [a,c]=P[(rnd()*P.length)|0];g.lineWidth=1.2;g.beginPath();g.moveTo(a,c);let u=a,v=c;for(let s=0;s<5;s++){u+=(rnd()-0.5)*20;v+=(rnd()<0.5?-1:1)*(6+rnd()*10);g.lineTo(u,v)}g.stroke()}}});
  cell(4,()=>{g.beginPath();const pts=[[14,16],[242,12],[246,240],[12,244]];pts.forEach(([a,b],i)=>{const x=a+(rnd()-0.5)*8,y=b+(rnd()-0.5)*8;i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath();
    g.fillStyle='rgba(22,22,24,0.5)';g.fill();g.lineWidth=4;g.strokeStyle='rgba(10,10,10,0.55)';g.stroke();
    for(let i=0;i<900;i++){g.fillStyle=rnd()<0.5?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.12)';g.fillRect(16+rnd()*224,16+rnd()*224,2,2)}});
  cell(5,()=>streaks(110,30,200,'36,33,30',90));
  cell(6,()=>{for(let i=0;i<10;i++)blob(128+(rnd()-0.5)*120,128+(rnd()-0.5)*120,40+rnd()*70,'30,28,24',0.14)});
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const P=[],U=[],e=2/1024;
  for(const [a,b,c,d,k] of MAIN_GRIME){const u0=(k%4)/4+e,u1=u0+0.25-2*e,v1=1-(k/4|0)/4-e,v0=v1-0.25+2*e;P.push(...a,...b,...c,...a,...c,...d);U.push(u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.computeVertexNormals();
  mainGrimeM=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,roughness:0.95,side:THREE.DoubleSide}));
  mainGrimeM.receiveShadow=true;mainGrimeM.renderOrder=1;mainGrimeM.visible=mainGrimeOn;scene.add(mainGrimeM)}
// from gfxApply: the weathering drawn on Medium graphics and up (it's only looks)
function mainGrimeGfx(on){mainGrimeOn=!!on;if(mainGrimeM)mainGrimeM.visible=mainGrimeOn}
mainAlleys();mainGrimeAdd();
// ---------- the hayfield's margins: uncut grass ----------
// Where the hayfield meets the lawn, the trail and the woods (mainField's wandering edge, terrain.js) a band of tall uncut
// grass, thick in the margin and thinning out both ways, green on the lawn's side and going to straw on the field's, so
// no edge is a clean line. Looks only, nothing walks into it; the Graphics setting's Undergrowth draws a share of it
// (fmGrassK, from brushGfx). Placed from a fixed seed, so every device has the same; rebuilt on map edits (edRefresh).
const FMG_N=7000;let fmGrass=null,fmGrassN=0,fmGrassF=1;
function fmGrassBuild(){
  if(!fmGrass){const P=[],C=[];let s=7;const R=()=>{s=(s*16807)%2147483647;return s/2147483647};
    // one clump: five arching blades of three triangles, dark at the root and sunlit at the tip
    for(let b=0;b<5;b++){const a=b/5*6.283+R()*0.8,h=0.55+R()*0.5,l=0.12+R()*0.2,w=0.035+R()*0.02,ca=Math.cos(a),sa=Math.sin(a),rx=(R()-0.5)*0.2,rz=(R()-0.5)*0.2;
      const pt=t=>[rx+ca*l*t*t,h*t*(1-0.15*t),rz+sa*l*t*t],px=-sa*w,pz=ca*w,p0=pt(0),p1=pt(0.55),p2=pt(1);
      const v=[[p0[0]-px,p0[1],p0[2]-pz],[p0[0]+px,p0[1],p0[2]+pz],[p1[0]-px*0.7,p1[1],p1[2]-pz*0.7],[p1[0]+px*0.7,p1[1],p1[2]+pz*0.7],p2],kc=[0.42,0.42,0.75,0.75,1];
      for(const f of [[0,1,3],[0,3,2],[2,3,4]])for(const q of f){P.push(...v[q]);C.push(kc[q],kc[q],kc[q]*0.92)}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
    fmGrass=new THREE.InstancedMesh(g,M(0xffffff,{vertexColors:true,side:THREE.DoubleSide}),FMG_N);fmGrass.receiveShadow=true;scene.add(fmGrass)}
  let s=91;const R=()=>{s=(s*16807)%2147483647;return s/2147483647},O=new THREE.Object3D(),c=new THREE.Color();let n=0;
  for(let t=0;t<FMG_N*40&&n<FMG_N;t++){const x=R()*428-6,z=-556+R()*264,hf=mainField(x,z),band=4*hf*(1-hf);
    if(R()>Math.pow(band,0.8)*0.9+0.04*hf||Math.abs(roadOff(x,z))<ROAD_W/2+0.8)continue;const y=baseHeight(x,z);if(y-WATER<0.6)continue;
    const k=0.85+0.3*R(),st=ss(0.25,0.8,hf+0.25*(R()-0.5));
    O.position.set(x,y-0.03,z);O.rotation.set((R()-0.5)*0.2,R()*6.283,(R()-0.5)*0.2);const sc=0.75+0.6*R();O.scale.set(sc,sc*(0.8+0.5*(1-st)),sc);O.updateMatrix();
    fmGrass.setMatrixAt(n,O.matrix);c.setRGB((0.34+0.42*st)*k,(0.5+0.17*st)*k,(0.2+0.17*st)*k);fmGrass.setColorAt(n,c);n++}
  fmGrassN=n;fmGrass.count=Math.round(n*fmGrassF);fmGrass.instanceMatrix.needsUpdate=true;if(fmGrass.instanceColor)fmGrass.instanceColor.needsUpdate=true;fmGrass.computeBoundingSphere()}
function fmGrassK(k){fmGrassF=k;if(fmGrass)fmGrass.count=Math.round(fmGrassN*k)}
fmGrassBuild();
