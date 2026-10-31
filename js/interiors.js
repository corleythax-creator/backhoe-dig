// Corley's Island: the town's insides, seen through the glass. Every shop on Main Street and the cross street has a lit
// ground-floor room behind its storefront glass, furnished for what it is (rmFurnish: a café's counter and tables, a
// store's shelves of goods and its till, a salon's chairs and mirrors, an office's counter, a laundromat's machines, a
// gallery's pictures), and the floors above show rooms behind their panes (rmWinAdd: one picture of sixteen rooms, lit
// at night). The rooms list where people stand, sit and work (TF_ROOMS), and townfolk.js puts staff and customers in
// them when the camera comes near; the brewery and its beer garden (mainland.js) and the General Store do the same.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// TF_ROOMS: {x, z, r (how far it reaches), y (its floor; ground: stand on the ground), spots: [{x, z, y, yaw, sit,
// staff, path}], big: [people for each Townsfolk setting] or extra customers by the setting}
const TF_ROOMS=[];
// a room's own frame: o outward through its glass (the yaw f looks along), s across; boxes in it, and its spots
function rmKit(K,x,z,y,f){const sf=Math.sin(f),cf=Math.cos(f),P=(o,s)=>[x+sf*o+cf*s,z+cf*o-sf*s],R={K,x,z,y,f,P,spots:[]};
  R.box=(w,h,d,col,o,s,y0,ry)=>{const [a,b]=P(o,s);K.box(w,h,d,col,a,y+y0+h/2,b,f+(ry||0))};
  R.cyl=(r0,r1,h,n,col,o,s,y0)=>{const [a,b]=P(o,s);K.cyl(r0,r1,h,n,col,a,y+y0+h/2,b)};
  R.lit=(w,d,o,s,y0)=>{const [a,b]=P(o,s);K.lit(new THREE.BoxGeometry(w,0.04,d),0xfff6d8,a,y+y0,b,f)};
  // a frame turned by yl (0 faces out through the glass) at o, s: put(w, h, d, col, forward, across, y0)
  R.at=(o,s,yl)=>{const c=Math.cos(yl),n=Math.sin(yl);return (w,h,d,col,lo,ls,y0)=>R.box(w,h,d,col,o+lo*c-ls*n,s+lo*n+ls*c,y0,yl)};
  // a spot: where someone stands (or sits) facing yl
  // a line to walk round (local points), for a spot's path
  R.path=pts=>rmLine(pts.map(([o,s])=>P(o,s)));
  R.spot=(o,s,yl,k)=>{const [a,b]=P(o,s);const sp=Object.assign({x:a,z:b,y,yaw:f+yl},k||{});R.spots.push(sp);return sp};
  // a solid w across by d deep at o, s (turned by yl, as R.box): the worker walks round it (rmSolid); h: how tall, for
  // a shot over it (none: a wall)
  R.solid=(o,s,w,d,yl,h)=>{const c=Math.abs(Math.cos(yl||0)),n=Math.abs(Math.sin(yl||0)),[a,b]=P(o,s);rmSolid(a,b,f,(c*w+n*d)/2,(n*w+c*d)/2,h?y+h:undefined)};
  return R}
// the highest ground under a w by d rectangle at x, z (turned to f), so a floor over it never has grass through it
function rmGroundMax(x,z,f,w,d){const sf=Math.sin(f),cf=Math.cos(f);let m=-1e9;
  for(let i=0;i<=6;i++)for(let j=0;j<=6;j++){const o=(i/6-0.5)*d,s=(j/6-0.5)*w;m=Math.max(m,baseHeight(x+sf*o+cf*s,z+cf*o-sf*s))}return m}
const RM_GOODS=[0xc8402e,0x2f6db0,0xe0b83a,0x3d8a4a,0xece6d6,0x7a4a9a,0xd8782a,0x2a2c2f,0x9ad0e0,0xb03a6a],rmC=i=>RM_GOODS[((Math.round(i)%10)+10)%10];
// a chair facing yl, its seat's middle at o, s; a seat spot on it when sit
function rmChair(R,o,s,yl,col,sit){const p=R.at(o,s,yl);p(0.44,0.05,0.44,col,0,0,0.43);p(0.44,0.48,0.05,col,-0.21,0,0.48);
  for(const [a,b] of [[-0.19,-0.19],[-0.19,0.19],[0.19,-0.19],[0.19,0.19]])p(0.035,0.43,0.035,0x2a2c2f,a,b,0);
  if(sit)R.spot(o-Math.cos(yl)*0.05,s-Math.sin(yl)*0.05,yl,{sit:1})}
// a café table (round when round) with chairs on two or four sides, the sitters facing it
function rmTable(R,o,s,n,col,round){R.solid(o,s,1.5,n===4?1.5:0.8,0,0.76);if(round){R.cyl(0.38,0.38,0.04,16,col,o,s,0.72);R.cyl(0.04,0.04,0.72,8,0x2a2c2f,o,s,0);R.cyl(0.22,0.22,0.03,12,0x2a2c2f,o,s,0)}
  else{R.box(0.75,0.04,0.75,col,o,s,0.72);R.box(0.06,0.72,0.06,0x2a2c2f,o,s,0)}
  const sides=n===4?[0,Math.PI/2,Math.PI,-Math.PI/2]:[Math.PI/2,-Math.PI/2];
  for(const a of sides){const so=-Math.cos(a)*0.62,ss=-Math.sin(a)*0.62;rmChair(R,o+so,s+ss,a,0x5a3b26,1)}
  // a cup or two on it
  for(const k of [-1,1])R.cyl(0.04,0.035,0.09,8,0xf2efe6,o+k*0.15,s-k*0.12,0.74)}
// a shelf unit w wide against the room's side (facing yl), four shelves of goods
function rmShelf(R,o,s,yl,w,seed){seed=Math.abs(Math.round(seed));R.solid(o,s,w,0.5,yl,1.95);const p=R.at(o,s,yl);p(w,1.9,0.05,0xd8d2c4,-0.22,0,0);for(const x of [-w/2,w/2])p(0.04,1.9,0.45,0xd8d2c4,0,x,0);
  for(let k=0;k<4;k++){const y0=0.15+k*0.45;p(w,0.03,0.45,0xd8d2c4,0,0,y0);let x=-w/2+0.08;
    while(x<w/2-0.12){const q=Math.round((x+w)*10),g=0.1+((seed*7+k*3+q)%5)*0.03,h=0.12+((seed+k+q)%4)*0.05;
      p(g,h,0.3,rmC(seed+k*5+q),0,x+g/2,y0+0.03);x+=g+0.03}}}
// the counter (w wide, the staff behind it facing out) with a till on it
function rmCounter(R,o,s,w,col,top){R.solid(o,s,w+0.06,0.7,0,1.05);R.box(w,1.0,0.6,col,o,s,0);R.box(w+0.06,0.04,0.66,top||0x3a3330,o,s,1.0);
  R.box(0.32,0.22,0.28,0x2a2c2f,o,s+w/2-0.35,1.04);R.box(0.26,0.18,0.02,0x9ad0e0,o+0.1,s+w/2-0.35,1.15)}
// the shops' kinds by sign (MAIN_SHOPS): eat, shop, salon, office, wash, art, gun
const RM_KIND={0:'eat',2:'eat',5:'eat',11:'eat',12:'eat',17:'eat',21:'eat',15:'eat',9:'salon',26:'salon',7:'office',8:'office',16:'office',23:'office',29:'office',31:'office',20:'wash',18:'art',13:'art',27:'gun'};
// the gun shops' counters and wall racks (pistol.js stocks them and sells from them): {x, z, y, yaw at the counter, rack:
// [[x, y, z, yaw] where a long gun hangs], case: the same for the pistols lying in the glass case}
const GUN_SHOPS=[];
// a shop's ground floor room: w across, d deep, its glass at o = d/2 (the room's middle at o = 0), floor at y
function rmFurnish(K,x,z,y,f,w,d,si,wall){const R=rmKit(K,x,z,y,f),kind=RM_KIND[si]||'shop',back=-d/2,W=w/2-0.3,wood=[0x8a6440,0x5a3b26,0xb08a5a][si%3];
  // the room: a timber floor, painted walls and ceiling, its lights
  R.box(w-0.5,0.03,d-0.05,'planks',0,0,0);R.box(w-0.5,0.03,d,0xf2efe6,0,0,2.9);
  for(const s of [-1,1])R.box(0.03,2.9,d,wall,0,s*(W+0.04),0);R.box(w-0.5,2.9,0.03,wall,back+0.02,0,0);
  for(let o=back+1.2;o<d/2-0.6;o+=2)for(const s of w>12?[-W/2,W/2]:[0]){const [a,b]=R.P(o,s);K.lit(new THREE.BoxGeometry(1.2,0.04,0.3),0xfff8ea,a,y+2.88,b,f)}
  R.spot(back+0.8,0,0,{staff:1});
  if(kind==='eat'){// a counter across the back with a pastry case and a menu board, tables in front
    rmCounter(R,back+1.3,-W/4,W*1.2,wood);R.box(1.4,0.45,0.5,'glass',back+1.3,-W/4-0.5,1.04);R.box(1.5,0.55,0.03,0x23402f,back+0.04,-W/4,1.7);
    R.spots.pop();R.spot(back+0.65,-W/4,0,{staff:1});R.spot(back+0.65,-W/4+1.2,0,{staff:1});
    for(const k of [-1,0,1])R.spot(back+1.95,-W/4+k*0.9,Math.PI);
    const n=Math.max(2,Math.floor((w-1)/2.6));for(let i=0;i<n;i++){const s=-W+1.0+i*(2*W-2)/Math.max(1,n-1);if(Math.abs(s)>1.4)rmTable(R,d/2-1.4,s,2,wood,i%2);if(d>7)rmTable(R,back+3.3,s+(i%2?0.6:-0.6),2,wood,1-i%2)}}
  else if(kind==='salon'){// chairs facing mirrors along one side, a bench by the window to wait on
    for(let i=0;i<3;i++){const o=back+1.2+i*1.4;R.box(0.03,1.0,1.0,0xdde4ea,o,-W-0.0,1.0);R.box(0.6,0.75,0.35,wood,o,-W+0.2,0);
      R.cyl(0.25,0.3,0.45,12,0x2a2c2f,o,-W+1.1,0);R.box(0.55,0.08,0.55,0x2a2c2f,o,-W+1.1,0.45);R.box(0.55,0.6,0.08,0x2a2c2f,o,-W+1.4,0.5);
      R.spot(o,-W+1.15,-Math.PI/2,{sit:1});R.spot(o+0.05,-W+1.75,-Math.PI/2,{staff:1});R.solid(o,-W+0.75,1.6,0.7)}
    R.box(1.6,0.45,0.45,wood,d/2-0.5,W-1.2,0);R.solid(d/2-0.5,W-1.2,1.7,0.55);for(const k of [-0.45,0.45])R.spot(d/2-0.45,W-1.2+k,Math.PI,{sit:1});rmCounter(R,back+1.0,W-1.0,1.2,wood)}
  else if(kind==='office'){// a long counter across the room, staff behind, a queue and chairs in front
    rmCounter(R,back+1.6,0,Math.min(2*W-1,6),wood,0xe9e4d6);R.spots.pop();for(const k of [-1.5,0,1.5])R.spot(back+0.9,k,0,{staff:1});
    for(const k of [-1.5,0,1.5])R.spot(back+2.3,k,Math.PI);R.spot(back+3.2,0.2,Math.PI);
    for(let i=0;i<3;i++)rmChair(R,d/2-0.7,W-0.5-i*0.6,Math.PI,0x2f5a7a,1);
    R.box(1.2,0.03,0.9,0x6b2a2a,back+3.4,-W+1.0,0.04)}
  else if(kind==='wash'){R.solid(back+0.45,0,2*W,0.8);R.solid(0,W-0.5,0.8,2.5);for(let i=0;i<Math.floor(2*W/0.75);i++){const s=-W+0.4+i*0.75;R.box(0.68,0.9,0.65,0xf2f2ee,back+0.4,s,0);R.cyl(0.22,0.22,0.03,14,0x2a3036,back+0.74,s,0.45)}
    for(let i=0;i<4;i++)rmChair(R,d/2-0.8,-W+0.6+i*0.6,Math.PI,0xc04a2a,1);R.box(2.4,0.9,0.7,0xd8d2c4,0,W-0.5,0,Math.PI/2);R.spot(-0.3,W-1.3,Math.PI/2);R.spot(back+1.2,-1,0);R.spots.shift()}
  else if(kind==='art'){for(const s of [-1,1])for(let o=back+0.8;o<d/2-0.8;o+=1.4)R.box(0.03,0.6+(Math.abs(o*7|0)%3)*0.2,0.8,rmC(o*3+s*5+si),o,s*(W+0.01),1.3);
    for(let s=-W+1;s<W-0.8;s+=1.5)R.box(1.1,0.7,0.04,rmC(s*5+si+20),back+0.05,s,1.2);R.box(1.6,0.45,0.45,0x2a2c2f,0,0,0);R.solid(0,0,1.7,0.55);
    R.spot(0.9,-1.2,-Math.PI/2);R.spot(-0.8,1.6,Math.PI/2);R.spot(back+1.0,1,0+Math.PI);R.spot(0,-0.5,Math.PI,{sit:1});rmCounter(R,d/2-1.0,W-0.8,1.0,wood)}
  else if(kind==='gun'){// a gun shop: a glass case across the room with handguns in it, long guns on a slatwall behind,
    // shelves of ammunition and gear down the sides, a target-shooting poster or two
    R.solid(back+1.6,0,Math.min(2*W-1.2,5.2)+0.06,0.7,0,1.1);const cw=Math.min(2*W-1.2,5.2);R.box(cw,0.85,0.6,0x2a2622,back+1.6,0,0);
    R.box(cw-0.1,0.22,0.52,'glass',back+1.6,0,0.85);R.box(cw+0.06,0.03,0.66,'glass',back+1.6,0,1.07);R.box(cw-0.2,0.02,0.48,0x5a1f1f,back+1.6,0,0.86);
    const cs=[];for(let k=0;k<6;k++){const [a,b]=R.P(back+1.55+(k%2?0.1:-0.1),-cw/2+0.5+k*(cw-1)/5);cs.push([a,y+0.89,b,f+(k%2?0.4:-0.3)])}
    R.box(2*W-0.2,1.6,0.04,0x3a3a36,back+0.04,0,0.8);for(let k=0;k<9;k++)R.box(2*W-0.2,0.012,0.05,0x2a2a27,back+0.06,0,0.85+k*0.18);
    for(const s of [-1,1])for(let o=back+2.6;o<d/2-1.6;o+=1.25)rmShelf(R,o,s*(W-0.25),s>0?-Math.PI/2:Math.PI/2,1.2,si+o*3+s*11+20);
    for(const s of [-1,1])R.box(0.03,0.7,0.5,s>0?0xe9e2cc:0xd8c890,back+2.0,s*(W+0.01),1.5);
    R.spots.pop();R.spot(back+0.9,-0.8,0,{staff:1});R.spot(back+0.9,1.0,0,{staff:1});R.spot(back+2.3,-1.1,Math.PI);R.spot(-0.4,-W+1.0,-Math.PI/2);
    const rack=[];for(let k=0;k<3;k++)for(const s of (W>2.2?[-W/2-0.2,W/2+0.2]:[0])){const [a,b]=R.P(back+0.12,s);rack.push([a,y+1.15+k*0.38,b,f+Math.PI/2])}
    const [cx,cz]=R.P(back+2.15,0);GUN_SHOPS.push({x:cx,z:cz,y,yaw:f+Math.PI,rack,case:cs})}
  else{// a store: shelves down both sides and across the back, a stand in the middle, the till by the door
    for(const s of [-1,1])for(let o=back+0.9;o<(s>0?d/2-2.4:d/2-1.4);o+=1.25)rmShelf(R,o,s*(W-0.25),s>0?-Math.PI/2:Math.PI/2,1.2,si+o*3+s*11+20);
    for(let s=-W+1.3;s<=W-1.3+1e-6;s+=1.3)rmShelf(R,back+0.3,s,0,1.2,si+s*5+40);
    if(w>12){const p=R.at(-0.2,0,0);p(0.9,1.2,2.2,wood,0,0,0);R.solid(-0.2,0,1.0,2.3);for(let k=0;k<5;k++)p(0.3,0.25,0.3,rmC(si+k),-0.2+(k%2)*0.4,-0.9+k*0.45,1.2)}
    rmCounter(R,d/2-1.3,W-0.7,1.4,wood);R.spots.pop();R.spot(d/2-1.95,W-0.7,0,{staff:1});
    R.spot(d/2-0.6,W-0.7,Math.PI);R.spot(-0.6,-W+1.0,-Math.PI/2);R.spot(0.6,W-1.1,Math.PI/2);R.spot(back+1.1,-1.0,Math.PI);R.spot(back+1.2,1.4,Math.PI);if(w>12)R.spot(-0.2,-1.3,Math.PI/2)}
  return R}
// a walking line through points, as townfolk.js reads one (tfAt): its points and their distances along
function rmLine(pts){const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return {p:pts,L,len:L[L.length-1]}}
// a room ready for people: how far it reaches, its extra customers for each Townsfolk setting
function rmAdd(R,r,big){R.r=r;R.big=big||null;R.n=0;TF_ROOMS.push(R);return R}

// ---------- the rooms behind the upper windows: one picture of sixteen rooms, a pane of it in each window ----------
const RM_WIN={P:[],U:[],mat:null};
function rmWinTex(){const C=document.createElement('canvas');C.width=1024;C.height=1024;const g=C.getContext('2d'),E=document.createElement('canvas');E.width=E.height=1024;const e=E.getContext('2d');
  let sd=7;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const walls=['#d9cfb8','#c9d4cf','#e6dccb','#b9c4cc','#d8c2a8','#cfc6d6','#e8e2d2','#a9b8a0'],floors=['#6b4a30','#8a6a4a','#5a5048','#7a3a2a'];
  for(let i=0;i<16;i++){const x0=(i%4)*256,y0=(i/4|0)*256,W=256,H=256,ix=W*0.2,iy=H*0.18,bw=W-2*ix,bh=H-2*iy,wc=walls[i%8];
    const poly=(c,pts)=>{g.fillStyle=c;g.beginPath();pts.forEach(([a,b],k)=>k?g.lineTo(x0+a,y0+b):g.moveTo(x0+a,y0+b));g.closePath();g.fill()};
    poly('#efe9dc',[[0,0],[W,0],[W-ix,iy],[ix,iy]]);poly(floors[i%4],[[0,H],[W,H],[W-ix,H-iy],[ix,H-iy]]);
    poly(wc,[[0,0],[ix,iy],[ix,H-iy],[0,H]]);poly(wc,[[W,0],[W-ix,iy],[W-ix,H-iy],[W,H]]);g.fillStyle=wc;g.fillRect(x0+ix,y0+iy,bw,bh);
    g.fillStyle='rgba(0,0,0,0.12)';g.fillRect(x0,y0,ix,H);g.fillRect(x0+W-ix,y0,ix,H);
    // the furniture against the back wall: a sofa, a bookcase, a desk and lamp, a bed; a picture; a plant; a person now and then
    const k=i%4,fy=y0+H-iy;
    if(k===0){g.fillStyle=['#7a3a2a','#2f4a6a','#5a6a3a'][i%3];g.fillRect(x0+ix+bw*0.15,fy-bh*0.32,bw*0.6,bh*0.32);g.fillRect(x0+ix+bw*0.15,fy-bh*0.45,bw*0.6,bh*0.15)}
    if(k===1){g.fillStyle='#5a3b26';g.fillRect(x0+ix+bw*0.1,y0+iy+bh*0.15,bw*0.35,bh*0.85);for(let s=0;s<4;s++)for(let b=0;b<7;b++){g.fillStyle=['#b03a2a','#2f5a8a','#e0b83a','#3d7a4a','#ece6d6'][(b+s+i)%5];g.fillRect(x0+ix+bw*(0.12+b*0.045),y0+iy+bh*(0.2+s*0.2),bw*0.035,bh*0.13)}}
    if(k===2){g.fillStyle='#6b4a30';g.fillRect(x0+ix+bw*0.45,fy-bh*0.4,bw*0.45,bh*0.06);g.fillRect(x0+ix+bw*0.47,fy-bh*0.34,bw*0.04,bh*0.34);g.fillRect(x0+ix+bw*0.85,fy-bh*0.34,bw*0.04,bh*0.34);
      g.fillStyle='#f4e2a8';g.beginPath();g.moveTo(x0+ix+bw*0.6,fy-bh*0.62);g.lineTo(x0+ix+bw*0.72,fy-bh*0.62);g.lineTo(x0+ix+bw*0.68,fy-bh*0.52);g.lineTo(x0+ix+bw*0.64,fy-bh*0.52);g.fill()}
    if(k===3){g.fillStyle='#ece6d6';g.fillRect(x0+ix+bw*0.2,fy-bh*0.25,bw*0.6,bh*0.25);g.fillStyle=['#6a3a5a','#3a5a7a'][i%2];g.fillRect(x0+ix+bw*0.2,fy-bh*0.2,bw*0.6,bh*0.2);g.fillStyle='#5a3b26';g.fillRect(x0+ix+bw*0.18,fy-bh*0.45,bw*0.64,bh*0.2)}
    g.fillStyle=['#2f5a8a','#b8322a','#e0b83a','#3d7a4a'][(i+1)%4];g.fillRect(x0+ix+bw*(k===1?0.6:0.25),y0+iy+bh*0.18,bw*0.22,bh*0.16);
    if(i%3===0){g.fillStyle='#3d6b2f';g.beginPath();g.arc(x0+ix+bw*0.92,fy-bh*0.3,bw*0.08,0,7);g.fill();g.fillStyle='#8a4a2a';g.fillRect(x0+ix+bw*0.88,fy-bh*0.18,bw*0.08,bh*0.18)}
    if(i%5===1){g.fillStyle=['#2a2c2f','#5a3b26','#3a4a6a'][i%3];const px=x0+ix+bw*0.62;g.beginPath();g.arc(px,fy-bh*0.62,bw*0.05,0,7);g.fill();g.fillRect(px-bw*0.07,fy-bh*0.56,bw*0.14,bh*0.36);g.fillRect(px-bw*0.05,fy-bh*0.2,bw*0.1,bh*0.2)}
    // curtains at the sides, a ceiling lamp
    g.fillStyle=['#e8dcc0','#c9a8a0','#a8b8c8','#d8c8a0'][i%4];g.fillRect(x0,y0,W*0.09,H);g.fillRect(x0+W*0.91,y0,W*0.09,H);g.fillStyle='#fff3cc';g.beginPath();g.arc(x0+W/2,y0+iy*0.8,8,0,7);g.fill();
    // lit at night (the light picture), except a few rooms left dark
    e.drawImage(C,x0,y0,W,H,x0,y0,W,H);if(i%6===5){e.fillStyle='rgba(0,0,0,0.92)';e.fillRect(x0,y0,W,H)}}
  const t=new THREE.CanvasTexture(C),te=new THREE.CanvasTexture(E);for(const x of [t,te]){x.colorSpace=THREE.SRGBColorSpace;x.anisotropy=4}return [t,te]}
// a window's room: a pane w by h at x, y, z looking along f
function rmWinAdd(x,y,z,f,w,h){const i=(Math.abs(Math.round(x*7.3+z*3.1+y*5.7)))%16,u0=(i%4)/4,v1=1-(i/4|0)/4,v0=v1-0.25,c=Math.cos(f),s=Math.sin(f);
  const pt=(a,b)=>[x+c*a,y+b,z-s*a],A=pt(-w/2,-h/2),B=pt(w/2,-h/2),C=pt(w/2,h/2),D=pt(-w/2,h/2);
  RM_WIN.P.push(...A,...B,...C,...A,...C,...D);RM_WIN.U.push(u0,v0,u0+0.25,v0,u0+0.25,v1,u0,v0,u0+0.25,v1,u0,v1)}
// the panes laid so far as one mesh (called by each part of town once its windows are in; the picture is made once)
function rmWinsBuild(){if(!RM_WIN.P.length)return;const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(RM_WIN.P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(RM_WIN.U,2));geo.computeVertexNormals();
  if(!RM_WIN.mat){const [t,te]=rmWinTex();RM_WIN.mat=new THREE.MeshStandardMaterial({map:t,emissiveMap:te,emissive:0x000000,roughness:0.9,color:0x9a9a9a})}
  const m=new THREE.Mesh(geo,RM_WIN.mat);m.receiveShadow=true;scene.add(m);RM_WIN.P=[];RM_WIN.U=[]}
// the rooms light up as the windows do (daynight.js sets famWinMat's glow)
function rmWinTick(){if(RM_WIN.mat)RM_WIN.mat.emissive.copy(famWinMat.emissive).multiplyScalar(1.6)}

// ---------- going in ----------
// Every shop, the General Store, the brewery and the houses can be walked into: their walls are solids with a gap at the
// door (rmSolid, rmWall), their floors walk pads, their furniture solid, and their doors open as the worker comes up to
// them (rmDoor). Inside a room (IN_ROOMS) the chase camera stays in it (rmCamClip, main.js).
// IN_ROOMS: {x, z (the middle), f (the yaw out through its front), hw across, hd deep (half), y floor, top ceiling}
const IN_ROOMS=[];
// indoors the eye adjusts: the exposure (rmExp0, set by gfx.js) rises by TU.inAdapt, and a warm light hangs under the
// ceiling of the room you are in: Jessica's fireside light (jessica.js, with the Graphics setting's extra lights),
// borrowed while you are in town and put back after, so no light is added to the scene. Runs after jesTick
let rmAdapt=1,rmExp0=0.8,rmLampI=0,rmLampBk=null;
function rmInsideTick(dt){const r=mode==='walk'&&!wk.inside?rmRoomAt(wk.x,wk.z,wk.y):null,k=1-Math.exp(-dt*3),L=jesLight;
  rmAdapt+=((r?1+TU.inAdapt:1)-rmAdapt)*k;if(Math.abs(rmAdapt-1)<1e-3)rmAdapt=1;renderer.toneMappingExposure=rmExp0*rmAdapt;
  rmLampI+=((r?TU.inLamp*LI:0)-rmLampI)*k;
  if(rmLampI>0.01){if(!rmLampBk)rmLampBk={p:L.position.clone(),c:L.color.getHex(),d:L.distance,y:L.decay};
    if(r){L.position.set(r.x,r.top-0.35,r.z);L.distance=Math.max(6,Math.hypot(r.hw,r.hd)*2.2)}L.color.setHex(0xffe6c4);L.decay=1.3;L.intensity=rmLampI}
  else if(rmLampBk){L.position.copy(rmLampBk.p);L.color.setHex(rmLampBk.c);L.distance=rmLampBk.d;L.decay=rmLampBk.y;rmLampBk=null}}
function rmRoom(x,z,f,hw,hd,y,top){const r={x,z,f,sf:Math.sin(f),cf:Math.cos(f),hw,hd,y,top};IN_ROOMS.push(r);return r}
// a solid hs across by ho deep (half sizes) at x, z in a frame turned to f (s across, o along f), as SOLIDS reads one
function rmSolid(x,z,f,hs,ho,top){const sf=Math.sin(f),cf=Math.cos(f),o={x,z,lx:hs,lz:ho,cs:cf,sn:sf,hx:Math.abs(cf)*hs+Math.abs(sf)*ho,hz:Math.abs(sf)*hs+Math.abs(cf)*ho};if(top!==undefined)o.top=top;SOLIDS.push(o)}
// a wall with holes in a room kit's frame: along s at o = c (ax 's') or along o at s = c (ax 'o'), from a to b, T thick
// toward n (+1 or -1: the inside), H high; out its outside, inn its painted inside face; holes [{m (its middle along the
// wall), w, y0, y1}]. What stands on the floor is solid; a hole down to the floor is a doorway
function rmWall(R,ax,c,n,a,b,T,H,out,inn,holes){
  const piece=(m0,m1,y0,y1)=>{if(m1-m0<0.01||y1-y0<0.01)return;const mm=(m0+m1)/2,L=m1-m0;
    for(const [t0,t1,col] of [[0,T-0.02,out],[T-0.02,T,inn]]){const q=c+n*(t0+t1)/2;if(ax==='s')R.box(L,y1-y0,t1-t0,col,q,mm,y0);else R.box(t1-t0,y1-y0,L,col,mm,q,y0)}
    if(y0<0.3){const q=c+n*T/2;if(ax==='s')R.solid(q,mm,L,T);else R.solid(mm,q,T,L)}};
  let at=a;for(const h of (holes||[]).slice().sort((p,q)=>p.m-q.m)){const h0=h.m-h.w/2,h1=h.m+h.w/2;piece(at,h0,0,H);piece(h0,h1,0,h.y0);piece(h0,h1,h.y1,H);at=h1}
  piece(at,b,0,H)}
// the room the worker stands in, or null
function rmRoomAt(x,z,y){for(const r of IN_ROOMS){const dx=x-r.x,dz=z-r.z;if(Math.abs(dx*r.cf-dz*r.sf)<r.hw&&Math.abs(dx*r.sf+dz*r.cf)<r.hd&&y>r.y-0.6&&y<r.top)return r}return null}
// on foot in a room, the chase camera's boom from a (the look point) to c is cut where it would leave the room, and kept
// under the ceiling; c is moved. True when it was
function rmCamClip(a,c){if(mode!=='walk'||wk.inside)return false;const r=rmRoomAt(wk.x,wk.z,wk.y);if(!r)return false;
  const L=(x,z)=>{const dx=x-r.x,dz=z-r.z;return [dx*r.cf-dz*r.sf,dx*r.sf+dz*r.cf]},[s0,o0]=L(a.x,a.z),[s1,o1]=L(c.x,c.z);let t=1;
  const cut=(p0,p1,h)=>{const d=p1-p0;if(d>1e-6&&p0+d>h)t=Math.min(t,(h-p0)/d);else if(d<-1e-6&&p0+d<-h)t=Math.min(t,(-h-p0)/d)};
  cut(s0,s1,r.hw-0.25);cut(o0,o1,r.hd-0.25);t=clamp(t,0,1);
  c.set(a.x+(c.x-a.x)*t,Math.min(a.y+(c.y-a.y)*Math.max(t,0.5),r.top-0.25),a.z+(c.z-a.z)*t);return true}

// ---------- doors that open ----------
// RM_DOORS: {k (its kind), x, y, z (the hinge's foot, or a sliding leaf's closed near edge), f (the yaw it faces out
// along; the leaf runs along +s from there), w, sl (a sliding leaf: how far, and which way along s, it runs), a (how
// open, 0 to 1)}. Each kind is drawn as instanced meshes, one per material, and only a moving door's matrix changes
const RM_DOORS=[],RM_DK={},RM_DM=new THREE.Matrix4(),RM_DQ=new THREE.Quaternion(),RM_DV=new THREE.Vector3(),RM_DS=new THREE.Vector3(1,1,1),RM_DY=new THREE.Vector3(0,1,0);
let rmDoorsMade=false;
function rmDoor(k,x,y,z,f,w,sl){const d={k,x,y,z,f,w,sl:sl||0,a:0,i:-1};RM_DOORS.push(d);return d}
// a kind's leaf in its own frame: the hinge (or near edge) at x = 0 on the floor, the leaf along +x, its outside +z
const RM_DOOR_KIND={
  shop:K=>{const DW=0x4a3424;for(const x of [0.05,1.15])K.box(0.1,2.3,0.07,DW,x,1.15,0);K.box(1.2,0.22,0.07,DW,0.6,0.11,0);K.box(1.2,0.12,0.07,DW,0.6,2.24,0);
    K.box(1.0,1.96,0.02,'glass',0.6,1.2,0);K.box(0.04,0.04,0.5,0xc9ccc8,0.95,1.05,0.06,Math.PI/2);K.box(0.04,0.04,0.5,0xc9ccc8,0.95,1.05,-0.06,Math.PI/2)},
  slide:K=>{const BZ=0x3b3631;K.box(1.25,2.4,0.02,'glass',0.625,1.25,0);for(const x of [0.04,1.21])K.box(0.08,2.45,0.1,BZ,x,1.225,0);K.box(1.25,0.1,0.1,BZ,0.625,0.05,0);K.box(1.25,0.08,0.1,BZ,0.625,2.41,0);
    K.box(0.6,0.04,0.06,0x9aa0a4,0.625,1.05,-0.07);K.box(1.1,0.25,0.02,0x9aa0a4,0.625,0.22,0.06)}};
for(const c of [0x7e1f1f,0x1f3a5f,0x23402f,0x2b2d2f,0xb98b2e])RM_DOOR_KIND['house'+c]=K=>{K.box(1.0,2.08,0.05,c,0.5,1.04,0);
  for(const y of [0.55,1.5])for(const x of [0.27,0.73])K.box(0.32,y<1?0.7:0.85,0.02,new THREE.Color(c).multiplyScalar(0.85).getHex(),x,y,0.03);K.box(0.05,0.05,0.08,0xc9a64a,0.88,1.0,0.05);K.box(0.05,0.05,0.08,0xc9a64a,0.88,1.0,-0.05)};
function rmDoorsMake(){rmDoorsMade=true;const by={};for(const d of RM_DOORS)(by[d.k]=by[d.k]||[]).push(d);
  for(const k in by){const K=famKit();RM_DOOR_KIND[k](K);const L=by[k],ms=famAdd(K);L.forEach((d,i)=>d.i=i);RM_DK[k]=[];
    for(const m of ms){scene.remove(m);const I=new THREE.InstancedMesh(m.geometry,m.material,L.length);I.castShadow=m.castShadow;I.receiveShadow=m.receiveShadow;I.frustumCulled=false;scene.add(I);RM_DK[k].push(I)}
    for(const d of L)rmDoorPut(d)}}
function rmDoorPut(d){const sl=d.sl*d.a;RM_DV.set(d.x+Math.cos(d.f)*sl,d.y,d.z-Math.sin(d.f)*sl);RM_DQ.setFromAxisAngle(RM_DY,d.f+(d.sl?0:d.a*Math.PI*0.48));RM_DM.compose(RM_DV,RM_DQ,RM_DS);
  for(const I of RM_DK[d.k]){I.setMatrixAt(d.i,RM_DM);I.instanceMatrix.needsUpdate=true}}
// every frame: a door opens when the worker on foot comes within reach of its middle and shuts again once he has gone
function rmDoorsTick(dt){if(!rmDoorsMade){if(!RM_DOORS.length)return;rmDoorsMake()}const foot=mode==='walk'&&!wk.inside;
  for(const d of RM_DOORS){const h=d.w/2,mx=d.x+Math.cos(d.f)*h,mz=d.z-Math.sin(d.f)*h,dx=wk.x-mx,dz=wk.z-mz,reach=d.sl?2.6:1.7;
    const t=foot&&dx*dx+dz*dz<reach*reach&&Math.abs(wk.y-d.y)<2?1:0;if(t===d.a)continue;d.a=t>d.a?Math.min(1,d.a+dt*2.2):Math.max(0,d.a-dt*1.4);rmDoorPut(d)}}

// ---------- a house's ground floor ----------
// in its kit's frame (rmKit: o out through the front, s across) inside walls T thick round s0..s1 by o0..o1: a living
// room at the front round the door (a sofa facing the TV, a rug and coffee table, the fireplace on the chimney when it
// stands in the room, the stairs up on a two storey house), and behind a partition with two doorways a kitchen
// (cabinets, fridge, stove, sink, a table for two) and a bedroom (a bed, nightstands with lamps). h: {s0, s1, o0, o1, H
// (the ceiling), cs, co (the chimney), stairs, u (its random number), inn (the walls' paint)}. Its rooms go in IN_ROOMS,
// a resident on the sofa in most (TF_ROOMS)
// an indoor light fitting, w by d, its glow seen through the windows but no halo like the street lamps' (FAM_LAMP_K)
function rmLit(R,w,d,o,s,y0){const [a,b]=R.P(o,s);R.K.lit(new THREE.BoxGeometry(w,0.04,d),0xfff2dc,a,R.y+y0,b,R.f)}
function rmHome(R,h){const {s0,s1,o0,o1,H,u,inn}=h,pb=o0+2.75,sm=(s0+s1)/2,kd=(s0+sm)/2,bd=(sm+s1)/2,
    wood=[0x8a6440,0x5a3b26,0xb08a5a,0x6e4a2e][Math.floor(u*17)%4],cab=[0xf2efe6,0x2f4a3a,0xd8d2c4,0x3a4a5a][Math.floor(u*23)%4],sofa=[0x5a6670,0x7a5a3a,0x3d5a4a,0xb8a88a,0x6a2f2f][Math.floor(u*29)%5],
    rug=[0x8a3a2a,0x2f4a6a,0xc8b89a,0x4a5a3a][Math.floor(u*37)%4];
  // the floor, the ceiling and its lights; the partition and the wall between kitchen and bedroom
  R.box(s1-s0,0.03,o1-o0,'planks',(o0+o1)/2,(s0+s1)/2,0);R.box(s1-s0,0.04,o1-o0,0xf4f2ec,(o0+o1)/2,(s0+s1)/2,H-0.04);
  rmWall(R,'s',pb,1,s0,s1,0.1,H,inn,inn,[{m:kd,w:1.4,y0:0,y1:2.05},{m:bd,w:0.9,y0:0,y1:2.05}]);rmWall(R,'o',sm,1,o0,pb,0.1,H,inn,inn,[]);
  for(const [o,s] of [[(pb+o1)/2,(s0+s1)/2],[(o0+pb)/2,kd],[(o0+pb)/2,bd]])rmLit(R,0.45,0.45,o,s,H-0.07);
  // the living room: the TV against the partition between its doorways, the sofa facing it, a rug and coffee table
  const so=Math.min(pb+3.0,o1-1.4);R.box(1.4,0.5,0.4,0x2a2c2f,pb+0.3,sm,0);R.box(1.2,0.7,0.05,0x111214,pb+0.22,sm,0.62);R.solid(pb+0.3,sm,1.45,0.45);
  R.box(2.6,0.01,2.0,rug,(pb+so)/2+0.2,sm,0.03);R.box(1.1,0.4,0.55,wood,pb+1.75,sm,0.03);R.solid(pb+1.75,sm,1.15,0.6);
  R.box(2.0,0.42,0.85,sofa,so,sm,0);R.box(2.0,0.48,0.2,sofa,so+0.33,sm,0.42);for(const t of [-1,1])R.box(0.18,0.24,0.85,sofa,so,sm+t*0.91,0.42);
  for(const t of [-0.45,0.45])R.box(0.86,0.12,0.6,new THREE.Color(sofa).multiplyScalar(1.12).getHex(),so-0.08,sm+t,0.42);R.solid(so,sm,2.1,0.95);
  R.cyl(0.015,0.015,1.5,6,0x2a2c2f,so+0.1,sm+1.35,0);R.cyl(0.14,0.14,0.02,10,0x2a2c2f,so+0.1,sm+1.35,0);rmLit(R,0.26,0.26,so+0.1,sm+1.35,1.5);
  if(u<0.65){R.spot(so-0.05,sm+0.45,Math.PI,{sit:1,staff:1})}
  // the fireplace on the chimney's front: a stone hearth, the firebox with its embers, a mantel
  if(h.cs>s0&&h.cs<s1){const cf=h.co+0.375;R.box(1.3,0.06,0.5,0x6b6a64,cf+0.25,h.cs,0);R.box(0.62,0.56,0.02,0x141414,cf+0.006,h.cs,0.08);rmLit(R,0.4,0.12,cf+0.08,h.cs,0.1);
    R.box(1.25,0.08,0.24,wood,cf+0.11,h.cs,1.2);R.solid(h.co,h.cs,0.9,0.8);R.solid(cf+0.25,h.cs,1.3,0.5)}
  // the stairs up, along the side away from the chimney
  if(h.stairs){const ss=h.cs>0?s0+0.55:s1-0.55,n=13,ri=H/(n+1);for(let k=0;k<n;k++)R.box(1.0,ri*(k+1),0.27,wood,o1-0.15-(k+0.5)*0.27,ss,0);
    R.box(0.05,H,n*0.27,0xf4f2ec,o1-0.15-n*0.135,ss+(h.cs>0?0.53:-0.53),0);R.solid(o1-0.15-n*0.135,ss,1.05,n*0.27)}
  // the kitchen along the back wall: the fridge at the end, base cabinets with the stove and sink, wall cabinets over;
  // a little table for two
  {const a=s0+0.85,b=sm-0.08,m=(a+b)/2,L=b-a;R.box(0.8,1.8,0.7,0xd9dbdc,o0+0.36,s0+0.42,0);R.box(0.02,0.5,0.03,0x9aa0a4,o0+0.72,s0+0.75,1.0);
    R.box(L,0.86,0.6,cab,o0+0.3,m,0);R.box(L+0.02,0.04,0.63,0x3a3330,o0+0.31,m,0.86);R.box(L,0.7,0.34,cab,o0+0.17,m,1.45);
    const st=a+L*0.3,sk=a+L*0.72;R.box(0.6,0.02,0.55,0x1e1f20,o0+0.3,st,0.9);for(const [p,q] of [[-0.13,-0.15],[-0.13,0.15],[0.13,-0.15],[0.13,0.15]])R.cyl(0.08,0.08,0.012,10,0x3a3a3a,o0+0.3+p,st+q,0.91);
    R.box(0.62,0.3,0.4,0x9aa0a4,o0+0.2,st,1.55);R.box(0.55,0.03,0.4,0x9aa0a4,o0+0.32,sk,0.89);R.cyl(0.015,0.015,0.25,6,0xc9ccc8,o0+0.1,sk,0.9);
    R.solid(o0+0.35,(s0+sm)/2,sm-s0,0.75);rmTable(R,(o0+0.6+pb)/2+0.05,kd,2,wood,1)}
  // the bedroom: the bed's head on the back wall, a nightstand and lamp each side where they fit
  {const bs=Math.min(bd+0.4,s1-0.85);R.box(1.6,1.0,0.06,wood,o0+0.03,bs,0);R.box(1.55,0.33,2.05,wood,o0+1.06,bs,0);R.box(1.5,0.22,1.95,0xf2efe6,o0+1.08,bs,0.33);
    R.box(1.53,0.07,1.3,rug,o0+1.42,bs,0.53);for(const t of [-0.38,0.38])R.box(0.6,0.12,0.38,0xf6f4ee,o0+0.3,bs+t,0.56);R.solid(o0+1.06,bs,1.6,2.1);
    for(const t of [-1,1]){const ns=bs+t*1.05;if(ns-0.24<sm+0.05||ns+0.24>s1)continue;R.box(0.45,0.55,0.4,wood,o0+0.22,ns,0);R.cyl(0.1,0.13,0.25,10,0xe9e1cc,o0+0.22,ns,0.55);R.solid(o0+0.22,ns,0.5,0.45)}}
  const [lx,lz]=R.P((pb+o1)/2,(s0+s1)/2),[kx,kz]=R.P((o0+pb)/2,(s0+sm)/2),[bx,bz]=R.P((o0+pb)/2,(sm+s1)/2);
  rmRoom(lx,lz,R.f,(s1-s0)/2,(o1-pb)/2,R.y,R.y+H);rmRoom(kx,kz,R.f,(sm-s0)/2,(pb-o0)/2,R.y,R.y+H);rmRoom(bx,bz,R.f,(s1-sm)/2,(pb-o0)/2,R.y,R.y+H)}
