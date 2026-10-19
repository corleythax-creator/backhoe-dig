// Corley's Island: the mainland across the lake (mainHeight in terrain.js). To the north the field and woods: a mown
// hayfield with a fence and round bales east of the trail, a pine and leaf woods west of it. To the south the lakeside
// town: a boardwalk on the beach, a marina, Main Street with a block of shops each side and a cross street. Both are
// reached by temporary crossings, a timber trestle (BRIDGES with temp set) and a rock causeway (CAUSEWAYS), until the
// crane builds steel spans; the crane waits on a barge beside the south trestle.
const mainGround=[groundPatch(-450,450,-572,-196,4,[MAIN_FINE[0]]),groundPatch(...MAIN_FINE[0],1,[]),
  groundPatch(-450,450,480,780,4,[MAIN_FINE[1]]),groundPatch(...MAIN_FINE[1],1,[])];

// a temporary trestle: timber pile bents every 6 m with cap beams and cross bracing, steel stringers, a plank deck
// with wheel guards and a timber rail, and a yellow limit sign at each end
function mainTrestle(b,K){
  const L=b.len,yaw=Math.atan2(b.ux,b.uz),W=(t,u)=>[b.x0+b.ux*t-b.uz*u,b.z0+b.uz*t+b.ux*u],Y=t=>b.y+(b.y1-b.y)*t/L;
  const pit=Math.atan2(b.y-b.y1,L),at=(t,u,y,w,h,d,col,rx,rz)=>{const [x,z]=W(t,u);K.box(w,h,d,col,x,y,z,yaw,rx,rz)};
  const TIM=0x6e5236,DECK=0x8a6c4a,STL=0x5a5f63,hw=b.hw;
  at(L/2,0,Y(L/2)-0.09,2*hw,0.18,L,DECK,pit);
  for(const s of [-1,1]){at(L/2,s*(hw-0.2),Y(L/2)+0.12,0.3,0.25,L,TIM,pit);
    at(L/2,s*(hw+0.1),Y(L/2)+1.0,0.12,0.2,L,TIM,pit);at(L/2,s*(hw+0.1),Y(L/2)+0.55,0.1,0.16,L,TIM,pit);
    for(let t=0;t<=L+0.01;t+=2.4)at(t,s*(hw+0.1),Y(t)+0.55,0.2,1.1,0.2,TIM)}
  for(const u of [-2.4,-0.8,0.8,2.4])at(L/2,u,Y(L/2)-0.48,0.3,0.6,L,STL,pit);
  const NB=Math.max(2,Math.round(L/6));
  for(let i=0;i<=NB;i++){const t=i*L/NB,top=Y(t)-1.0;at(t,0,top,2*hw+0.9,0.45,0.5,TIM);
    let lo=1e9;for(const u of [-2.4,0,2.4]){const [x,z]=W(t,u),g=baseHeight(x,z),h=top-0.2-g;lo=Math.min(lo,g);if(h>0.3)K.cyl(0.17,0.19,h,7,TIM,x,g+h/2,z)}
    const hb=Math.min(3.2,top-0.4-Math.max(lo,WATER+0.2));
    if(hb>0.6){const dl=Math.hypot(4.8,hb),a=Math.atan2(hb,4.8);for(const sg of [-1,1])at(t,0,top-0.4-hb/2,dl,0.24,0.12,TIM,0,sg*a)}}
  for(const [t,ry] of [[-1.5,yaw+Math.PI],[L+1.5,yaw]]){const [x,z]=W(t,hw+1.3),y=baseHeight(x,z);
    for(const s of [-1,1]){const [px,pz]=W(t,hw+1.3+s*1.9);K.box(0.12,2.5,0.12,0x8a8a86,px,y+1.25,pz)}
    famSign(['TEMPORARY BRIDGE','10 MPH · 40 TON LIMIT'],4.4,1.5,x,y+2.0,z,ry,'#e2b52a','#1a1a1a')}}

// a shop or house on a town lot: a block with a parapet, two rows of windows and a door on the face toward the street
// (face: the yaw it looks along), and a coloured awning; solid to the machines and the worker
function mainLot(K,x,z,w,d,h,col,face,awn){const y=Math.min(baseHeight(x-w/2,z-d/2),baseHeight(x+w/2,z+d/2),baseHeight(x-w/2,z+d/2),baseHeight(x+w/2,z-d/2));
  const fx=Math.sin(face),fz=Math.cos(face),F=(o,s)=>[x+fx*o+fz*s,z+fz*o-fx*s];
  K.box(w,h+1,d,col,x,y+(h-1)/2,z,face);K.box(w+0.3,0.5,d+0.3,0xd8d2c4,x,y+h+0.15,z,face);
  for(let s=-w/2+1.6;s<=w/2-1.5;s+=2.4){for(const wy of [h>7?h-2.4:null,h>4.5?h-4.6:null])if(wy){const [a,b]=F(d/2+0.03,s);K.box(1.3,1.4,0.06,0x2c3a44,a,y+wy,b,face)}}
  {const [a,b]=F(d/2+0.03,0);K.box(1.2,2.2,0.08,0x4a3424,a,y+1.1,b,face);const [c,e]=F(d/2+0.7,0);K.box(w*0.8,0.1,1.4,awn,c,y+2.9,e,face,-0.25)}
  SOLIDS.push({x,z,hx:(Math.abs(fz)*w+Math.abs(fx)*d)/2+0.1,hz:(Math.abs(fx)*w+Math.abs(fz)*d)/2+0.1})}

(function(){let sd=31;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  // the two crossings
  {const K=famKit();mainTrestle(BRIDGES[4],K);famAdd(K)}
  {const K=famKit();mainTrestle(BRIDGES[5],K);famAdd(K)}
  // the crane, on a barge beside the south trestle, ready to swap the spans for steel
  {const K=famKit(),x=12,z=462,y=WATER+0.5,top=y+22;K.box(8,1.6,16,0x50565a,x,WATER,z);K.box(3,1.2,3,0x6a6f73,x,y+0.6,z);
    K.box(1.2,top-y,1.2,0xe5b322,x,(top+y)/2,z);K.box(1.2,0.8,24,0xe5b322,x-1,top+0.4,z-5,0.12);K.box(2.2,1.8,2.2,0x6a6f73,x,top+1.6,z+5);
    K.box(0.05,9,0.05,0x333333,x-2.4,top-4.5,z-15);K.box(1.6,0.6,1.2,0x6a6f73,x-2.4,top-9.3,z-15);famAdd(K)}

  // ---------- north: the field and woods ----------
  const N=famKit();
  // a post and two-rail fence along the hayfield's south edge, a gap where the lane runs in, and round bales on the stubble
  for(let x=24;x<=400;x+=3.5){const z=-306,y=baseHeight(x,z);N.box(0.16,1.3,0.16,0x7a6a55,x,y+0.55,z);
    if(x+3.5<=400)for(const ry of [0.55,1.0])N.box(3.5,0.1,0.06,0x8c7b62,x+1.75,baseHeight(x+1.75,z)+ry,z)}
  for(let i=0;i<26;i++){const x=40+rnd()*340,z=-320-rnd()*220;if(Math.abs(roadOff(x,z))<4)continue;
    N.cyl(0.75,0.75,1.3,12,0xc2a45a,x,baseHeight(x,z)+0.7,z,rnd()*6.3,0,Math.PI/2)}
  famSign(['FIELD AND WOODS','Trail west · Hayfield east'],4.6,1.5,-7,baseHeight(-7,-300)+2.0,-300,0,'#2f5a33','#ffffff');
  for(const s of [-1,1])N.box(0.12,2.5,0.12,0x8a8a86,-7+s*2.1,baseHeight(-7,-300)+1.25,-300);
  famAdd(N);
  // the woods: pines and leaf trees west of the trail, thinning at the edge, clear of the trail itself
  const out=[];
  for(let g=0;g<12000&&out.length<440;g++){const x=-440+rnd()*420,z=-555+rnd()*250,w=mainWoods(x,z);
    if(w<0.5||rnd()>0.35+0.65*ss(-20,-60,x)||Math.abs(roadOff(x,z))<ROAD_W/2+1.4)continue;
    out.push({p:rnd()<0.9,x,z,yaw:rnd()*6.3,s:0.85+rnd()*0.7,c:(rnd()*6)|0})}
  // and a ragged tree line along the far side of the hayfield
  for(let x=30;x<400;x+=5+rnd()*6){const z=-548+rnd()*10;out.push({p:rnd()<0.75,x,z,yaw:rnd()*6.3,s:0.9+rnd()*0.6,c:(rnd()*6)|0})}
  const np=out.filter(o=>o.p).length,nl=out.length-np,mk=(geo,mat,n)=>{const im=new THREE.InstancedMesh(geo,mat,Math.max(1,n));im.castShadow=true;im.receiveShadow=true;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1,n)*3),3);im.count=n;scene.add(im);treeIMs.push(im);return im};
  const pines=mk(jesPineGeo,famMat,np),woods=mk(assetIMs.leafy[0].geometry,assetIMs.leafy[0].material,nl),crowns=mk(assetIMs.leafy[1].geometry,assetIMs.leafy[1].material,nl);
  const o=new THREE.Object3D(),c=new THREE.Color();let ip=0,il=0;
  for(const a of out){const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    o.position.set(a.x,baseHeight(a.x,a.z)-0.05,a.z);o.rotation.set((w-0.5)*0.08,a.yaw,(w2-0.5)*0.08);o.scale.set(a.s,a.s*(a.p?1+0.45*w:1),a.s);o.updateMatrix();
    if(a.p){const v=0.82+0.3*w2;pines.setMatrixAt(ip,o.matrix);c.setRGB(v,v*(0.95+0.1*w),v);pines.setColorAt(ip++,c)}
    else{const t=ASSET_LT[a.c%6],v=0.9+0.2*w2;woods.setMatrixAt(il,o.matrix);crowns.setMatrixAt(il,o.matrix);c.setRGB(t[0]*v,t[1]*v,t[2]*v);crowns.setColorAt(il,c);c.setRGB(1,1,1);woods.setColorAt(il++,c)}}

  // ---------- south: the lakeside town ----------
  const T=famKit(),COLS=[0xb5654a,0xd9cdb0,0x7d9aa8,0xc9b27a,0x9c4f3f,0xe4e0d4,0x8f9a7a,0xb98b5e],AWN=[0x2f6b4f,0xb8322a,0x2a4f7a,0xd08a22];
  let li=0;const lot=(x,z,w,d,h,face)=>{mainLot(T,x,z,w,d,h,COLS[li%COLS.length],face,AWN[(li*3)%AWN.length]);li++};
  // Main Street: a block of shops each side, facing the street, with sidewalks and lamps
  for(const s of [-1,1]){for(let i=0;i<7;i++){const z=588+i*19+(i>2?8:0),w=15+((i*7+(s>0?3:0))%4),h=5.5+((i*5+(s>0?2:0))%5)*1.3;if(Math.abs(z-652)<10)continue;
      lot(s*(4+2+6.5),z,w,13,h,s>0?-Math.PI/2:Math.PI/2)}
    for(let z=568;z<724;z+=6){const x=s*5,y=baseHeight(x,z);T.box(2,0.16,6,0xbdb8ac,x,y+0.08,z)}
    for(let z=574;z<724;z+=22){const x=s*5.6,y=baseHeight(x,z);T.cyl(0.07,0.1,5,8,0x2f3236,x,y+2.5,z);T.box(0.5,0.2,0.5,0x2f3236,x,y+5.05,z);T.lit(new THREE.BoxGeometry(0.4,0.05,0.4),0xfff1c8,x,y+4.93,z)}}
  // along the cross street, both sides
  for(const s of [-1,1])for(let i=0;i<5;i++){const x=s*(30+i*22);lot(x,652-13,16,12,5+((i*3)%4)*1.4,0);lot(x,652+13,16,12,5.5+((i*2)%3)*1.5,Math.PI)}
  // a boardwalk along the top of the beach, and a few benches on it looking out at the islands
  for(let x=-160;x<160;x+=6){if(Math.abs(x)<7)continue;const z0=mainRimS(x)+3,z1=mainRimS(x+6)+3,y=Math.max(baseHeight(x+3,(z0+z1)/2),WATER+1.8);
    T.box(6.1,0.16,3.6,0x8c6e4c,x+3,y+0.25,(z0+z1)/2,-Math.atan2(z1-z0,6));
    if(((x+160)/6|0)%5===2)T.box(1.6,0.45,0.5,0x5c4632,x+3,y+0.55,(z0+z1)/2+1.2)}
  // the marina: a pier out from the beach east of town with finger slips and boats tied up
  {const X=72,Z0=mainRimS(X)+2,Y=WATER+1.1,Lp=46;T.box(3,0.2,Lp,0x8c6e4c,X,Y,Z0-Lp/2);
    for(let t=0;t<=Lp;t+=4)for(const s of [-1,1])T.cyl(0.14,0.14,4,6,0x5c4632,X+s*1.4,Y-1.9,Z0-t);
    for(let i=0;i<3;i++){const z=Z0-14-i*12;T.box(9,0.18,1.6,0x8c6e4c,X+6,Y,z);
      for(const [dz,col] of [[-3,0xf2f2ee],[3,i===1?0x2a4f7a:0xf2f2ee]]){T.box(2.4,0.9,6,col,X+7,WATER+0.35,z+dz,Math.PI/2);T.box(1.4,0.8,2,0xdadfe2,X+6.6,WATER+1.1,z+dz,Math.PI/2)}}}
  famSign(['LAKESIDE','Main Street'],4.2,1.5,7.5,baseHeight(7.5,568)+2.0,568,Math.PI,'#1f4d6b','#ffffff');
  for(const s of [-1,1])T.box(0.12,2.5,0.12,0x8a8a86,7.5+s*1.9,baseHeight(7.5,568)+1.25,568);
  famAdd(T);
})();
