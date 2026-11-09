// Corley's Island: street life in town. The town bus on its run along the cross street (in from the east, a stop at the
// shelter east of Main Street where people wait, sit, get on and off, then on over the four-way stop and out west), and a
// delivery van that pulls up double-parked at an open shop with its hazards blinking while the driver carries a parcel in
// through the door and comes back for the next drop; both are cars of townfolk.js (tfCarNew, tfPath), so they keep their
// lanes, stop and take turns at the four-way stop, yield at the crosswalks and wait for people, and the cars behind a
// double-parked van go round it once the other lane is clear (tfPassOk). The bus shelter (glass, a bench, a lit map and
// the stop sign) is built here; the street furniture (cans, newspaper boxes, chalkboards, the bike rack, the café end's
// tables under string lights) are map editor things (stlThings, scenery.js). At night the shops' light spills warm onto
// the walk (brighter while open, brighter still as a door swings), neon signs come on in the windows of the pub, the
// brewery, the diner, the pizza place, the cafés and the hotel while they are open, and on Medium graphics and up their
// colour glows on the walk (gfxCur.stlGlow). Sound: the chatter of the town along Main Street as busy as the hour,
// a bell over each shop door as it opens, the bus's air brakes, and at the marina water slapping the hulls, halyards
// ringing on the masts in the wind and the gulls (Tuning: Town, stl*).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const stl={busT:25,vanT:50,bus:null,van:null,wait:[],boarded:0,alighted:0,trips:0,drops:0,night:0,nm:null,upT:0,shops:[],snd:null,hiss:[]};
// the bus stop: the shelter's middle on the cross street's north side east of Main Street, and where the bus halts in
// its lane (its middle; the front door then comes level with the shelter's west end)
const STL_STOP={x:19.2,z:645.15,bx:24,bz:649.85,y:0,spots:[]};
(function stlShelter(){const K=shopKit(),G=baseHeight,{x,z}=STL_STOP,y=STL_STOP.y=G(x,646.85)+MST.top;
  const steel=shopStd(0x2b2f33,0.7,0.42),glass=shopStd(0x9fb4bc,0.1,0.05,{envMapIntensity:1.3,transparent:true,opacity:0.26,depthWrite:false}),
    roof=shopStd(0x3c4146,0.65,0.38),conc=shopLib('concrete_broom'),wood=shopLib('planks');
  // the pad out to the walk, the posts and rails, glass at the back and the two ends, the roof sloping back
  K.box(conc,4.8,0.3,2.46,x,y-0.15,645.25);walkPad(x,645.25,2.4,1.23,0,y);
  for(const sx of [-1.88,1.88])for(const sz of [644.35,645.9])K.box(steel,0.07,2.42,0.07,x+sx,y+1.21,sz);
  K.box(glass,3.72,1.9,0.02,x,y+1.27,644.35);for(const sx of [-1.88,1.88])K.box(glass,0.02,1.9,1.48,x+sx,y+1.27,645.12);
  for(const yy of [0.3,2.22]){K.box(steel,3.8,0.05,0.05,x,y+yy,644.35);for(const sx of [-1.88,1.88])K.box(steel,0.05,0.05,1.55,x+sx,y+yy,645.12)}
  K.box(roof,4.25,0.09,2.0,x,y+2.47,645.18,0,-0.06);K.box(steel,4.25,0.16,0.05,x,y+2.4,646.17);
  // the bench: three slats on steel legs, a lean rail on the glass
  for(const k of [0,1,2])K.box(wood,2.3,0.04,0.11,x,y+0.46,644.55+k*0.13);for(const sx of [-0.95,0,0.95])K.box(steel,0.05,0.44,0.36,x+sx,y+0.22,644.67);
  K.box(wood,2.3,0.09,0.035,x,y+0.85,644.4);
  const SG=new THREE.Group();K.add(SG);
  // the route map in a lit case on the west end, and the stop sign at the curb (a blue plate, both faces)
  const cv=document.createElement('canvas');cv.width=256;cv.height=320;const g=cv.getContext('2d');
  g.fillStyle='#1f4f8f';g.fillRect(0,0,256,320);g.fillStyle='#fff';g.font='bold 74px sans-serif';g.textAlign='center';g.fillText('BUS',128,96);
  g.fillRect(52,128,152,78);g.fillStyle='#1f4f8f';g.fillRect(64,140,56,32);g.fillRect(136,140,56,32);g.beginPath();g.arc(84,214,14,0,7);g.arc(172,214,14,0,7);g.fill();
  g.fillStyle='#fff';g.font='bold 30px sans-serif';g.fillText('Route 1',128,262);g.font='22px sans-serif';g.fillText('Main St · Harbor Sq',128,296);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const plate=new THREE.MeshStandardMaterial({map:tex,roughness:0.5,metalness:0.2});
  const sx=x+3.6,sz=648.05,P=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.62,0.5),plate);P.position.set(sx,G(sx,sz)+MST.top+2.45,sz);P.castShadow=true;SG.add(P);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,2.8,8),steel);pole.position.set(sx,G(sx,sz)+MST.top+1.4,sz);pole.castShadow=true;SG.add(pole);
  const mc=document.createElement('canvas');mc.width=128;mc.height=192;const m=mc.getContext('2d');m.fillStyle='#f3efe4';m.fillRect(0,0,128,192);
  m.strokeStyle='#2f6b4f';m.lineWidth=6;m.beginPath();m.moveTo(10,40);m.lineTo(64,40);m.lineTo(64,150);m.lineTo(118,150);m.stroke();m.fillStyle='#1f4f8f';
  for(const [a,b] of [[10,40],[64,40],[64,96],[64,150],[118,150]]){m.beginPath();m.arc(a,b,7,0,7);m.fill()}m.fillStyle='#2b2d2f';m.font='bold 16px sans-serif';m.fillText('TOWN BUS',22,20);
  m.font='12px sans-serif';for(let k=0;k<4;k++)m.fillText(['6:00a  every','  4 min till','10:00p','Mon–Sun'][k],8,170-112+k*16+60);
  const mt=new THREE.CanvasTexture(mc);mt.colorSpace=THREE.SRGBColorSpace;STL_STOP.mapMat=new THREE.MeshStandardMaterial({map:mt,emissiveMap:mt,emissive:0xffffff,emissiveIntensity:0,roughness:0.3});
  const M=new THREE.Mesh(new THREE.BoxGeometry(0.03,1.2,0.8),STL_STOP.mapMat);M.position.set(x-1.86,y+1.25,645.12);SG.add(M);
  stl.shelter=SG.children.slice();for(const o of stl.shelter)scene.add(o);
  SOLIDS.push({x,z:644.35,hx:1.93,hz:0.06},{x:x-1.88,z:645.12,hx:0.06,hz:0.78},{x:x+1.88,z:645.12,hx:0.06,hz:0.78},{x,z:644.62,hx:1.15,hz:0.2},{x:sx,z:sz,hx:0.05,hz:0.05});
  fxDecl('Bus shelter',x+0.9,646.1,3.0,2.2);
  // where people wait: two seated on the bench, three standing at the front of the pad looking up the road
  for(const [ox,oz,sit] of [[-0.5,644.78,1],[0.55,644.78,1],[-1.25,646.05,0],[1.35,646.1,0],[2.4,646.2,0]])STL_STOP.spots.push({x:x+ox,z:oz,sit,yaw:0,who:null})})();
// hanging flower baskets on Main Street's lamp posts: a scroll bracket out over the walk, a coco-lined wire basket on
// three chains, petunias and geraniums mounded in it and ivy trailing over its rim (one merged mesh)
(function stlBaskets(){const K=famKit(),FL=[0xd8344a,0xf28ab8,0x8a4fc8,0xf4f4f4,0xf07a2a,0xc8202a];let k=0;
  for(const s of [-1,1])for(const z of [584,606,628,672,694,716]){const x=s*4.42,y=baseHeight(x,z)+MST.top,bx=x+s*0.55,by=y+3.05;k++;
    K.box(0.5,0.04,0.04,0x1f2326,x+s*0.27,y+3.62,z);K.box(0.04,0.22,0.04,0x1f2326,x+s*0.12,y+3.5,z,0,0,s*0.6);K.cyl(0.11,0.11,0.06,8,0x1f2326,x,y+3.62,z);
    for(let c=0;c<3;c++){const a=c*2.09,cx=bx+Math.cos(a)*0.17,cz=z+Math.sin(a)*0.17;K.box(0.012,0.5,0.012,0x2a2a2a,(cx+bx+s*0.02)/2,by+0.36,(cz+z)/2,0,(cz-z)*0.5,-(cx-bx)*0.5)}
    K.cyl(0.25,0.15,0.22,10,0x6b4a2c,bx,by,z);K.cyl(0.24,0.24,0.03,10,0x3d2b1f,bx,by+0.1,z);
    for(let f=0;f<9;f++){const a=f*0.7+k,r=f<6?0.17:0.06,col=FL[(k+f*(f%3===0?2:1))%FL.length];K.geo(new THREE.IcosahedronGeometry(0.075+0.02*(f%2),0),f%4===3?0x3f6a2a:col,bx+Math.cos(a)*r,by+0.17+(f<6?0:0.07),z+Math.sin(a)*r)}
    for(let v=0;v<5;v++){const a=v*1.26+k*0.4;K.box(0.05,0.32+0.12*(v%2),0.03,0x2f5a24,bx+Math.cos(a)*0.24,by-0.12-0.06*(v%2),z+Math.sin(a)*0.24,a)}}
  stl.baskets=famAdd(K)})();
// ---------- the bus ----------
// a 35 ft town bus from parts, merged by material: white body with a green band, wheel arches, the glass band with its
// pillars, two doors on the right, the destination sign lit amber, the roof's air conditioner; a plain box far off
function stlBusModel(){const L=10.7,W=2.55,root=new THREE.Group(),hi=new THREE.Group(),lo=new THREE.Group(),K=shopKit(),
    white=shopStd(0xefefea,0.25,0.32),green=shopStd(0x1f4d3a,0.3,0.4),dark=shopStd(0x17191c,0.1,0.6),glass=stl.busGlass=shopStd(0x1b232a,0.3,0.07,{envMapIntensity:1.5,emissive:0x000000}),
    chrome=shopStd(0xb8bcc0,0.9,0.25),tyre=shopStd(0x151515,0,0.92),hub=shopStd(0xa4a8ac,0.85,0.3),
    lit=Object.assign(new THREE.MeshBasicMaterial({color:0xffa82e,toneMapped:false}),{userData:{ft:4}}),head=Object.assign(new THREE.MeshBasicMaterial({color:0xfff4dc,toneMapped:false}),{userData:{ft:4}}),
    tail=Object.assign(new THREE.MeshBasicMaterial({color:0xb81c16,toneMapped:false}),{userData:{ft:4}});
  const ZA=[3.35,-2.75];
  // the skirt between the arches, and over them
  for(const [z0,z1] of [[3.35+0.68,L/2],[-2.75+0.68,3.35-0.68],[-L/2,-2.75-0.68]])K.box(white,W,1.0,z1-z0,0,0.95,(z0+z1)/2);
  for(const z of ZA){K.box(white,W,0.42,1.36,0,1.24,z);K.box(dark,W-0.06,0.6,1.36,0,0.73,z)}
  K.box(green,W+0.012,0.2,L-0.06,0,1.32,0);K.box(glass,W-0.03,1.16,L-0.24,0,2.04,0);
  for(let z=-4.55;z<4.3;z+=1.3)K.box(white,W+0.016,1.16,0.12,0,2.04,z);
  K.box(white,W,0.32,L,0,2.78,0);K.box(white,1.5,0.26,2.4,0,3.06,-1.6);K.box(dark,W+0.04,0.3,0.18,0,0.52,L/2);K.box(dark,W+0.04,0.3,0.18,0,0.52,-L/2);
  K.box(lit,1.8,0.26,0.03,0,2.5,L/2-0.105);K.box(dark,W-0.2,0.06,0.03,0,2.33,L/2-0.105);
  for(const s of [-1,1]){K.box(head,0.34,0.17,0.04,s*0.88,0.78,L/2+0.01);K.box(tail,0.2,0.36,0.04,s*1.06,1.02,-L/2-0.01);K.box(chrome,0.05,0.05,0.42,s*(W/2+0.2),2.15,L/2-0.25);K.box(dark,0.08,0.34,0.18,s*(W/2+0.42),2.0,L/2-0.08)}
  // the doors (the kerb side, -x: right of the way it faces), dark glass in bright frames
  for(const z of [L/2-1.25,-1.0]){K.box(glass,0.04,2.05,1.12,-W/2-0.005,1.52,z);K.box(chrome,0.045,2.1,0.05,-W/2-0.01,1.52,z)}
  K.add(hi);
  // the wheels, each turning about its axle (userData.q0, r as the cars' wheel nodes)
  const tg=new THREE.CylinderGeometry(0.5,0.5,0.3,18).rotateZ(Math.PI/2),hg=new THREE.CylinderGeometry(0.28,0.28,0.31,12).rotateZ(Math.PI/2);
  for(const z of ZA)for(const s of [-1,1]){const w=new THREE.Group();w.position.set(s*(W/2-0.19),0.5,z);w.userData.q0=1;w.userData.r=0.5;
    const t=new THREE.Mesh(tg,tyre),h=new THREE.Mesh(hg,hub);t.castShadow=true;w.add(t,h);hi.add(w)}
  const lb=new THREE.Mesh(new THREE.BoxGeometry(W,2.35,L),white),lg=new THREE.Mesh(new THREE.BoxGeometry(W+0.02,1.0,L-0.3),glass);lb.position.y=1.6;lg.position.y=2.05;lo.add(lb,lg);
  root.add(hi,lo);lo.visible=false;return {g:root,len:L,wid:W}}
// the bus sets off from the east end when it is clear and out of sight; it halts at the stop (a park path: stlArrive),
// then goes on (S.out) over the four-way stop and out the west end
function stlBusGo(){const [x,z]=TF_IN.E[0];if(tfSeen(x,z,6)&&Math.hypot(x-camera.position.x,z-camera.position.z)<110||tf.drive.some(c=>Math.hypot(c.x-x,c.z-z)<c.len+12))return false;
  const M=stl.busM||(stl.busM=stlBusModel()),{bx,bz}=STL_STOP,S={k:'bus',out:[[bx,bz,W_],[16.4,650.25,W_,'s'],[-140,650.25,W_],[-146,650.25,W_]],car:null};
  const c=tfCarNew('bus',M,tfPath([...TF_IN.E,[bx+16,650.25,W_],[bx,bz,W_]],true),S,null);stl.bus=c;stl.trips++;return true}
// ---------- the delivery van ----------
// the open shops it can pull up at, each with the way in (from an entry) and on out: the north block of Main Street
// both sides (northbound from the cross street, southbound from the beach road), the cross street's north side east of
// the bus stop (westbound) and its south side west of Main Street (eastbound). It halts beside the door, double-parked
// against the cars along the curb, kept off the crosswalks
function stlVanTargets(){const L=[];
  for(const R of TF_ROOMS){const E=R.ent;if(R.si==null||!E||!E.d||!townRoomOpen(R))continue;const {mx,mz}=E;
    if(mx>5&&mx<7&&mz>595&&mz<640){const hz=mz-1.5;for(const from of ['E','W'])L.push({R,E,from,in:[...TF_IN[from],...(from==='E'?TF_RT_N:[[-13.1,653.75,E_,'s'],[2,642,N_]]),[2,mz+12,N_],[2.95,hz,N_]],
      out:[[2.95,hz,N_],[2,mz-10,N_],...TF_OUT_N.B]})}
    else if(mx<-5&&mx>-7&&mz>595&&mz<640){const hz=mz-1.5,to=Math.random()<0.5?'E':'W';L.push({R,E,from:'B',in:[...TF_IN.B,[-8,575.25,E_],[-2,581,S_],[-2,hz-12,S_],[-2.95,hz,S_]],
      out:[[-2.95,hz,S_],[-2,mz+8,S_],[-2,639.5,S_,'s'],...TF_OUT_S[to].slice(2)]})}
    else if(Math.abs(mz-645)<1&&mx>45&&mx<125)L.push({R,E,from:'E',in:[...TF_IN.E,[mx+13,650.25,W_],[mx+1,649.35,W_]],out:[[mx+1,649.35,W_],[mx-9,650.25,W_],...TF_THRU.E.W]});
    else if(Math.abs(mz-659)<1&&mx<-20&&mx>-125)L.push({R,E,from:'W',in:[...TF_IN.W,[mx-13,653.75,E_],[mx-1,654.65,E_]],out:[[mx-1,654.65,E_],[mx+9,653.75,E_],...TF_THRU.W.E]})}
  return L}
function stlVanGo(){const M=tf.cars.van;if(!M)return false;const L=stlVanTargets().filter(T=>!stl.lastR||T.R!==stl.lastR);if(!L.length)return false;const T=L[(Math.random()*L.length)|0],[x,z]=TF_IN[T.from][0];
  if(tfSeen(x,z,3)&&Math.hypot(x-camera.position.x,z-camera.position.z)<110||tf.drive.some(c=>Math.hypot(c.x-x,c.z-z)<c.len+8))return false;
  const S={k:'dlv',E:T.E,R:T.R,out:T.out,car:null},c=tfCarNew('van',M,tfPath(T.in,true),S,tfCarPaint(0));stl.lastR=T.R;
  // the hazard lamps at its four corners (and a halo round each on Medium and up), blinking while it stands
  const hz=new THREE.Group(),lm=stl.hzM||(stl.hzM=new THREE.MeshBasicMaterial({color:0xffa21e,toneMapped:false})),hm=stl.hzH||(stl.hzH=new THREE.SpriteMaterial({map:dnHaloTex,color:0xffa21e,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  for(const sx of [-1,1])for(const [sz,y] of [[1,0.82],[-1,1.0]]){const b=new THREE.Mesh(stl.hzG||(stl.hzG=new THREE.BoxGeometry(0.14,0.08,0.05)),lm);b.position.set(sx*(c.wid/2+0.02),y,sz*(c.len/2+0.01));hz.add(b);
    const s=new THREE.Sprite(hm);s.scale.setScalar(0.7);s.position.copy(b.position);s.userData.halo=1;hz.add(s)}
  hz.visible=false;c.g.add(hz);c.hz=hz;stl.van=c;return true}
// ---------- at the stop: the bus's doors, and the van's drop ----------
function stlArrive(c){const S=c.S,h=c.yaw,fx=Math.sin(h),fz=Math.cos(h),rx=-Math.cos(h),rz=Math.sin(h),P=(o,r)=>[c.x+fx*o+rx*r,c.z+fz*o+rz*r];S.t=0;
  if(S.k==='bus'){stl.hiss.push([c.x,c.z,1]);S.fd=P(c.len/2-1.25,c.wid/2+0.4);S.rd=P(-1.0,c.wid/2+0.4);S.off=Math.random()<0.2?0:1+((Math.random()*(1+townBusy()*2.5))|0);S.offT=1.4;
    stl.wait.forEach((p,i)=>stlBoard(p,i*0.9));return}
  // the van: the driver gets out on the street side, round the back for the parcel and in through the shop's door
  c.dbl=1;const p=c.drv,E=S.E;if(!p)return;c.drv=null;const A=P(0.9,-(c.wid/2+0.45)),B=P(-(c.len/2+0.7),-0.3),C=P(-(c.len/2+0.7),c.wid/2+0.25),
    path=tfLine([A,B,C,[E.wx,E.wz],[E.mx+E.ux*0.05,E.mz+E.uz*0.05]]);S.boxS=path.L[2];
  Object.assign(p,{drv:null,sit:0,path,s:0,x:A[0],z:A[1],yaw:h-Math.PI/2,spd:0,back:false,inside:0,dlv:1});p.y=baseHeight(A[0],A[1])+tfLift(A[0],A[1]);c.ped=p;stl.drops++}
// someone waiting walks to the bus's front door (after del s) and gets on
function stlBoard(p,del){const S=stl.bus&&stl.bus.S;if(!S||!S.fd)return;if(p.bus.sp)p.bus.sp.who=null;const [x,z]=S.fd;
  Object.assign(p.bus,{k:'board',sp:null,del:del||0});p.sit=0;p.bpath=tfLine([[p.x,p.z],[x,z-0.9],[x,z]]);p.bs=0}
// the people of the bus stop, stepped here (townfolk.js leaves anyone with p.bus to it)
function stlPedStep(p,dt){const B=p.bus;
  if(B.del>0){B.del-=dt;p.amp+=(0-p.amp)*Math.min(1,dt*6);return}
  if(p.bpath){const P=p.bpath;p.bs=Math.min(P.len,(p.bs||0)+p.vt*dt);const [x,z,dx,dz]=tfAt(P,p.bs);p.x=x;p.z=z;let a=Math.atan2(dx,dz)-p.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));p.yaw+=a*Math.min(1,dt*7);
    p.spd=p.vt;p.amp+=(0.42-p.amp)*Math.min(1,dt*6);p.ph+=p.vt*dt*Math.PI*2/(1.5*p.sc);const pa=padAt(x,z);p.y+=(Math.max(baseHeight(x,z)+tfLift(x,z),pa)-p.y)*Math.min(1,dt*8);
    if(p.bs>=P.len-0.01){p.bpath=null;p.bs=0;stlPedAt(p)}return}
  // waiting: standing or on the bench, facing the street, now and then looking up the road the bus comes along
  p.spd=0;p.amp+=(0-p.amp)*Math.min(1,dt*6);if(Math.random()<dt*0.15)B.look=Math.random()<0.5?0:(p.sit?0.6:1.1)*(0.7+Math.random()*0.5);
  let a=(B.sp?B.sp.yaw:0)+(B.look||0)-p.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));p.yaw+=a*Math.min(1,dt*3)}
function stlPedAt(p){const B=p.bus;
  if(B.k==='wait'){const sp=B.sp;if(!sp){stlToWalk(p);return}p.x=sp.x;p.z=sp.z;p.y=STL_STOP.y;p.sit=sp.sit;if(stl.bus&&stl.bus.st==='park'&&stl.bus.S.fd&&!(stl.bus.boardT>0))stlBoard(p,0.3)}
  else if(B.k==='board'){const i=stl.wait.indexOf(p);if(i>=0)stl.wait.splice(i,1);tfDrop(p);stl.boarded++}
  else stlToWalk(p)}
// off the bus (or done waiting): back to walking the cross street's north sidewalk
function stlToWalk(p){const w=stl.w0||(stl.w0=TF_WALK.find(w=>!w.x&&w.p[0][0]===MSX&&w.p[0][1]===MCN&&w.p[1][0]===TF_XX));const i=stl.wait.indexOf(p);if(i>=0)stl.wait.splice(i,1);
  if(p.bus&&p.bus.sp)p.bus.sp.who=null;Object.assign(p,{bus:null,bpath:null,sit:0,w,s:Math.max(0,Math.min(w.len,p.x-MSX)),dir:Math.random()<0.5?1:-1,side:0.32,xok:false,wait:0,blk:0})}
// the stop's waiting people: walkers going by who stop for it, and (while nobody is looking) people already there; as
// many as the hour's busyness and the bus's timetable want
function stlStopTick(dt){const want=stl.busHrs?Math.round((TU.stlBusWait??4)*Math.min(1,townBusy()*1.25)*(stl.bus&&stl.bus.st!=='park'||stl.busT<120?1:0.4)):0;
  stl.wait=stl.wait.filter(p=>tf.people.includes(p)&&p.bus);for(const sp of STL_STOP.spots)if(sp.who&&(!tf.people.includes(sp.who)||!sp.who.bus))sp.who=null;if(stl.wait.length>want&&(!stl.bus||stl.bus.st!=='park')){const p=stl.wait.find(p=>p.bus.k==='wait'&&!p.bpath);if(p&&Math.random()<0.05){p.sit=0;stlToWalk(p)}return}
  if(stl.wait.length>=want)return;const sp=STL_STOP.spots.find(s=>!s.who);if(!sp)return;const {x,z}=STL_STOP,w0=stl.w0||(stl.w0=TF_WALK.find(w=>!w.x&&w.p[0][0]===MSX&&w.p[0][1]===MCN&&w.p[1][0]===TF_XX));
  let p=tf.people.find(q=>q.w===w0&&!q.room&&!q.car&&!q.drv&&!q.go&&!q.goTo&&!q.path&&!q.bus&&!q.dead&&!q.hurt&&!q.hit&&!(q.cower>0)&&!(q.flee>0)&&!q.cop&&Math.abs(q.x-x)<2.5);
  if(p){if(Math.random()>0.5)return;p.bus={k:'wait',sp};p.bpath=tfLine([[p.x,p.z],[sp.x,Math.max(sp.z,645.9)],[sp.x,sp.z]]);p.bs=0}
  else{if(tfSeen(x,z,3)&&Math.hypot(x-camera.position.x,z-camera.position.z)<80||Math.random()>0.3)return;p=tfPerson({x:sp.x,z:sp.z,yaw:sp.yaw,bus:{k:'wait',sp},sit:sp.sit});p.y=STL_STOP.y}
  sp.who=p;stl.wait.push(p);if(stl.bus&&stl.bus.st==='park'&&stl.bus.S.fd&&!p.bpath)stlBoard(p,0.2)}
// ---------- each frame ----------
function stlTick(dt){const cx=camera.position.x,cz=camera.position.z,near=cx>-230&&cx<230&&cz>470&&cz<830;dt=Math.min(dt,0.1);
  stl.night=1-ss(-7,1,dn.el);stlNightTick(dt,near);
  if(!tf.on||!tf.carsOk){stl.bus=stl.van=null;stl.wait.length=0;for(const sp of STL_STOP.spots)sp.who=null;return}
  const h=townHour();stl.busHrs=h>=6&&h<22;
  // the bus: one at a time, every stlBusGap seconds through the day
  if(stl.bus&&!tf.drive.includes(stl.bus))stl.bus=null;
  if(!stl.bus&&stl.busHrs&&(stl.busT-=dt)<=0){stl.busT=stlBusGo()?TU.stlBusGap??240:3}
  const b=stl.bus;if(b){if(stl.busGlass)stl.busGlass.emissive.setRGB(0.32,0.27,0.18).multiplyScalar(stl.night);
    if(b.st==='park'&&b.S.fd&&!(b.boardT>0)){const S=b.S;S.t+=dt;
      if(S.off>0&&(S.offT-=dt)<=0){S.offT=1.2+Math.random()*0.6;S.off--;const [x,z]=S.rd,p=tfPerson({x,z,yaw:b.yaw-Math.PI/2,bus:{k:'off'}});p.y=baseHeight(x,z)+0.1;
        p.bpath=tfLine([[x,z],[x+(Math.random()-0.5)*2,646.95+Math.random()*0.2]]);p.bs=0;stl.alighted++}
      const busy=stl.wait.some(p=>p.bus.k==='board')||tf.people.some(p=>p.bus&&p.bus.k==='off'&&p.bpath&&Math.hypot(p.x-S.rd[0],p.z-S.rd[1])<0.6);
      if(S.t>6&&S.off<=0&&!busy||S.t>45){b.boardT=1.0;S.fd=null;stl.hiss.push([b.x,b.z,0.55])}}}
  // the van: through the shops' hours, every stlVanGap seconds
  if(stl.van&&!tf.drive.includes(stl.van))stl.van=null;
  if(!stl.van&&h>=7&&h<18.5&&(stl.vanT-=dt)<=0){stl.vanT=stlVanGo()?TU.stlVanGap??300:4}
  const v=stl.van;if(v){if(v.st!=='park')v.dbl=0;if(v.hz){v.hz.visible=v.st==='park'&&(tf.t*1.5)%1<0.5;for(const o of v.hz.children)if(o.userData.halo)o.visible=!!gfxCur.stlGlow}
    const p=v.ped,S=v.S,E=S.E;if(p&&tf.people.includes(p)){if(p.inside>0||p.back)p.carry=null;else if(p.path&&p.s>S.boxS-0.2)p.carry='box';
      if(E.d&&(p.path||p.inside>0)&&(Math.hypot(p.x-E.mx,p.z-E.mz)<2.4&&(!p.inside||p.inside<1.2)))E.d.hold=Math.max(E.d.hold||0,0.6)}}
  if((stl.stopT=(stl.stopT||0)-dt)<=0){stl.stopT=0.5;stlStopTick(0.5)}}
// ---------- night: the shops' light on the walk and the neon in their windows ----------
// the words, each a cell of one picture (two across, four down), and the colour they glow
const STL_NEON=[['OPEN','#ff3b3b','#3b8bff'],['BEER','#ffb43b','#ffb43b'],['PIZZA','#ff4a3a','#3bff7a'],['ON TAP','#ffc84a','#4ad8ff'],['COFFEE','#ff8a3b','#fff0d0'],
  ['DINER','#ff5ac8','#5ae0ff'],['VACANCY','#ff3b3b','#ff3b3b'],['COLD BEER','#4ab8ff','#4ab8ff']];
// which signs a shop has (its name and line): [word, which side of the door]
function stlNeonOf(n){return /pub|grill|tavern|kettle/.test(n)?[[1,1],[0,-1]]:/brew/.test(n)?[[3,1],[7,-1]]:/pizza/.test(n)?[[2,1],[0,-1]]:/diner/.test(n)?[[5,1],[0,-1]]:
  /coffee|cafe|roasted/.test(n)?[[4,1],[0,-1]]:/bakery|deli|sweet|market|laundromat|pharmacy/.test(n)?[[0,1]]:/hotel|rooms/.test(n)?[[6,1]]:[]}
function stlNightBuild(){if(!tf.shopsOk)tfShopsInit();const shops=[];
  for(const R of TF_ROOMS){const E=R.ent;if(!E||!E.d||!(E.ux||E.uz))continue;const S=R.si!=null&&MAIN_SHOPS[R.si],n=(S?S[0]+' '+S[1]:R.nm||'').toLowerCase();const neon=stlNeonOf(n);shops.push({R,E,neon,allNight:neon.some(q=>q[0]===6)})}
  stl.shops=shops;
  // the light on the walk: a quad out from each storefront, brightest at the glass, fading out over the walk and to the sides
  const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d'),im=g.createImageData(64,64);
  for(let j=0;j<64;j++)for(let i=0;i<64;i++){const u=(i+0.5)/64,v=(j+0.5)/64,a=Math.pow(1-v,1.7)*Math.exp(-Math.pow((u-0.5)*2.1,4)*1.2)*(0.82+0.18*Math.cos(u*Math.PI*6)**2),o=(j*64+i)*4;
    im.data[o]=im.data[o+1]=im.data[o+2]=Math.round(255*a);im.data[o+3]=255}g.putImageData(im,0,0);
  const tex=new THREE.CanvasTexture(cv),y=(x,z)=>baseHeight(x,z)+tfLift(x,z)+0.025;
  const quad=(P,U,C,x,z,tx,tz,ux,uz,w,d,o)=>{const c=[[-w/2,o],[w/2,o],[w/2,o+d],[-w/2,o+d]].map(([a,b])=>[x+tx*a+ux*b,z+tz*a+uz*b]),uv=[[0,0],[1,0],[1,1],[0,1]];
    for(const k of [0,2,1,0,3,2]){P.push(c[k][0],y(c[k][0],c[k][1]),c[k][1]);U.push(uv[k][0],1-uv[k][1]);C.push(0,0,0)}};
  const mk=(P,U,C,mat)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.computeBoundingSphere();const m=new THREE.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=2;m.visible=false;scene.add(m);return m};
  const add=o=>new THREE.MeshBasicMaterial(Object.assign({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2},o));
  {const P=[],U=[],C=[];for(const s of shops){const E=s.E;quad(P,U,C,E.mx,E.mz,E.uz,-E.ux,E.ux,E.uz,5.4,2.5,0.04)}stl.nm=mk(P,U,C,add({map:tex}))}
  // the neon: the words in their tubes (a bright core in a soft bloom, baked into the picture), in the display windows
  // beside the door, 6 ft up; and their colour on the walk under them
  const nc=document.createElement('canvas');nc.width=512;nc.height=256;const n=nc.getContext('2d');n.fillStyle='#000';n.fillRect(0,0,512,256);n.textAlign='center';n.textBaseline='middle';
  STL_NEON.forEach(([wd,c1,c2],i)=>{const cx=(i%2)*256+128,cy=(i>>1)*64+32;n.font=`bold ${wd.length>6?30:38}px "Arial Rounded MT Bold",Verdana,sans-serif`;
    for(const [b,lw,col] of [[14,5,c1],[6,3,c1],[0,1.4,'#fff']]){n.shadowColor=c1;n.shadowBlur=b;n.lineWidth=lw;n.strokeStyle=col;n.strokeText(wd,cx,cy+2)}
    n.shadowBlur=8;n.shadowColor=c2;n.strokeStyle=c2;n.lineWidth=2.5;n.strokeRect(cx-118,cy-27,236,54)});
  const ntex=new THREE.CanvasTexture(nc);ntex.colorSpace=THREE.SRGBColorSpace;
  {const P=[],U=[],C=[],G=[],GU=[],GC=[];stl.neonN=0;
    for(const s of shops){s.ni=[];for(const [k,side] of s.neon){const E=s.E,tx=E.uz,tz=-E.ux,ax=E.mx+tx*side*2.05+E.ux*0.05,az=E.mz+tz*side*2.05+E.uz*0.05,yy=baseHeight(E.mx,E.mz)+tfLift(E.mx+E.ux*0.6,E.mz+E.uz*0.6)+1.95,
        w=1.15,hh=0.29,u0=(k%2)/2,v0=1-((k>>1)+1)/4,p=[[-w/2,-hh/2],[w/2,-hh/2],[w/2,hh/2],[-w/2,hh/2]].map(([a,b])=>[ax+tx*a,yy+b,az+tz*a]),uv=[[u0,v0],[u0+0.5,v0],[u0+0.5,v0+0.25],[u0,v0+0.25]];
        for(const q of [0,1,2,0,2,3]){P.push(...p[q]);U.push(...uv[q]);C.push(0,0,0)}
        quad(G,GU,GC,ax,az,tx,tz,E.ux,E.uz,2.4,1.9,0.1);s.ni.push({i:stl.neonN++,col:new THREE.Color(STL_NEON[k][1])})}}
    const nm=new THREE.MeshBasicMaterial({map:ntex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,side:THREE.DoubleSide});
    stl.neon=mk(P,U,C,nm);stl.glow=mk(G,GU,GC,add({map:dnPoolTex}))}}
// every half second: each shop's light by whether it is open and its door ajar, each sign on while its shop is open (the
// hotel's all night), and now and then one buzzing off for a moment
function stlNightTick(dt,near){if(!stl.nm){if(near&&RM_DOORS.length)stlNightBuild();return}
  const k=stl.night,on=near&&k>0.01;stl.nm.visible=stl.neon.visible=on;stl.glow.visible=on&&!!gfxCur.stlGlow;
  STL_STOP.mapMat.emissiveIntensity=0.9*k;if(!on)return;
  stl.nm.material.color.setScalar(0.6*k*(TU.stlSpill??1));stl.neon.material.color.setScalar(Math.min(1,k*1.3));stl.glow.material.color.setScalar(0.35*k);
  if((stl.upT-=dt)>0)return;stl.upT=0.25;const C=stl.nm.geometry.attributes.color,N=stl.neon.geometry.attributes.color,G=stl.glow.geometry.attributes.color;
  stl.shops.forEach((s,i)=>{const open=townRoomOpen(s.R),a=s.E.d?s.E.d.a||0:0,v=(open?1:0.22)+0.7*a;for(let q=0;q<6;q++)C.setXYZ(i*6+q,v,v*0.8,v*0.55);
    for(const n of s.ni){const lit=(open||s.allNight)&&!(Math.random()<0.015),c=lit?n.col:null;
      for(let q=0;q<6;q++){N.setXYZ(n.i*6+q,lit?1:0,lit?1:0,lit?1:0);G.setXYZ(n.i*6+q,c?c.r:0,c?c.g:0,c?c.b:0)}}});
  C.needsUpdate=N.needsUpdate=G.needsUpdate=true}
function stlGfx(g){if(stl.glow&&!g.stlGlow)stl.glow.visible=false}
// ---------- sound ----------
// the town's chatter: four voices of filtered buzz (vowel formants moving syllable by syllable, phrases and pauses) and
// a murmur of noise under them, dull with distance; how much talk follows how busy the hour is
const STL_VOW=[[730,1090],[530,1840],[270,2290],[570,840],[300,870],[640,1190],[440,1020],[390,1990]];
function stlSndBuild(){const c=actx,S={},out=S.chat=sndGain(0,snd.amb),lp=S.lp=sndFilter('lowpass',1700,0.6,out);S.pan=c.createStereoPanner?c.createStereoPanner():null;
  if(S.pan){S.pan.connect(lp)}const into=S.pan||lp;S.v=[];
  for(let i=0;i<4;i++){const o=c.createOscillator(),lf=c.createOscillator(),lg=sndGain(4),env=sndGain(0,into),f1=sndFilter('bandpass',600,6,env),f2=sndFilter('bandpass',1500,8,env),f0=i<2?115+i*25:195+i*20;
    o.type='sawtooth';o.frequency.value=f0;lf.frequency.value=4.5+i*0.7;lf.connect(lg);lg.connect(o.frequency);o.connect(f1);o.connect(f2);o.start();lf.start();S.v.push({o,env,f1,f2,f0,t:Math.random()*2,n:0})}
  const ns=c.createBufferSource();ns.buffer=snd.noise;ns.loop=true;S.mur=sndGain(0,into);const mf=sndFilter('bandpass',650,0.8,S.mur);ns.connect(mf);ns.start();
  // the marina: water slapping the hulls and pilings (the lapping loop through a hollow band), clinks, gulls
  S.mar=sndGain(0,snd.amb);S.lapF=sndFilter('bandpass',520,1.2,S.mar);sndLoopSrc('lap',S.lapF,0.82);S.clT=1;S.gullT=5;S.marP=c.createStereoPanner?c.createStereoPanner():null;if(S.marP)S.marP.connect(snd.amb);
  stl.snd=S}
// a sound placed in the world: its way out (late with distance, duller, to one side)
function stlOut(x,y,z,g){const c=actx,dx=x-camera.position.x,dy=y-camera.position.y,dz=z-camera.position.z,d=Math.hypot(dx,dy,dz)||1,air=sndFilter('lowpass',Math.max(1500,16000/(1+d/20)),0.5,snd.dry),out=sndGain(g);
  if(c.createStereoPanner){sndR.setFromMatrixColumn(camera.matrixWorld,0);const pn=c.createStereoPanner();pn.pan.value=clamp((dx*sndR.x+dy*sndR.y+dz*sndR.z)/d*0.8,-0.8,0.8);out.connect(pn);pn.connect(air)}else out.connect(air);
  setTimeout(()=>{out.disconnect();air.disconnect()},4000);return {out,t:c.currentTime+d/343,d}}
// a struck bell or a ringing metal part: partials (ratio, gain) of f, decaying over len s
function stlRing(dest,t,f,P,len,g){for(const [r,a] of P){const o=actx.createOscillator(),e=sndGain(0,dest);o.type='sine';o.frequency.value=f*r;e.gain.setValueAtTime(0,t);
  e.gain.linearRampToValueAtTime(g*a,t+0.004);e.gain.exponentialRampToValueAtTime(0.0005,t+len*(1.1-r*0.08));o.connect(e);o.start(t);o.stop(t+len+0.1);o.onended=()=>e.disconnect()}}
// the bell over a shop door, jangling twice as the door swings
function stlBell(x,y,z){const g=sndVol(sndCfg.fx)*(TU.stlBell??0.5)*0.5/(1+(Math.hypot(x-camera.position.x,z-camera.position.z)/9)**2);if(g<0.003)return;
  const O=stlOut(x,y,z,1),f=1900+Math.random()*500,P=[[1,1],[2.76,0.45],[5.4,0.2],[8.9,0.08]];stlRing(O.out,O.t,f,P,0.9,g);stlRing(O.out,O.t+0.13+Math.random()*0.05,f*1.02,P,0.7,g*0.55);
  stlRing(O.out,O.t+0.3+Math.random()*0.08,f*0.99,P,0.5,g*0.25)}
// how near the town's busy streets are (Main Street's north block to the store, the cross street), and on which side
function stlSnd(dt,t,quiet){if(!snd||!snd.ready||!actx)return;const cx=camera.position.x,cz=camera.position.z;
  const qz=Math.max(575,Math.min(724,cz)),qx=Math.max(-125,Math.min(125,cx)),d1=Math.hypot(cx,cz-qz),d2=Math.hypot(cx-qx,cz-652),dT=Math.min(d1,d2),dM=Math.hypot(Math.max(40-cx,0,cx-112),Math.max(520-cz,0,cz-596));
  if(dT>260&&dM>260){if(stl.snd&&stl.snd.on){stl.snd.on=0;stl.snd.chat.gain.setTargetAtTime(0,t,0.5);stl.snd.mar.gain.setTargetAtTime(0,t,0.5)}return}
  if(!stl.snd){if(!snd.buf.lap)return;stlSndBuild()}const S=stl.snd;S.on=1;
  // chatter: as busy as the hour, dull and wide with distance, from the side the street is on
  const busy=townBusy(),nearT=1/(1+(dT/26)**2),cab=camMode==='cab'&&mode!=='walk',inT=wk.inside||cab?0.4:1,gc=quiet*inT*(TU.stlChat??0.5)*busy*nearT;
  S.chat.gain.setTargetAtTime(gc*0.5,t,0.4);S.lp.frequency.setTargetAtTime(700+2200/(1+dT/18),t,0.4);S.mur.gain.setTargetAtTime(0.5,t,0.5);
  if(S.pan){sndR.setFromMatrixColumn(camera.matrixWorld,0);const px=d1<d2?0:qx,pz=d1<d2?qz:652,l=Math.hypot(px-cx,pz-cz)||1;S.pan.pan.setTargetAtTime(clamp(((px-cx)*sndR.x+(pz-cz)*sndR.z)/l*0.6*Math.min(1,l/12),-0.6,0.6),t,0.3)}
  if(gc>0.002)for(const v of S.v){if((v.t-=dt)>0)continue;
    if(v.n>0){v.n--;const w=STL_VOW[(Math.random()*STL_VOW.length)|0];v.f1.frequency.setTargetAtTime(w[0]*(v.f0>180?1.15:1),t,0.02);v.f2.frequency.setTargetAtTime(w[1]*(v.f0>180?1.12:1),t,0.02);
      v.env.gain.setTargetAtTime(0.25+Math.random()*0.75,t,0.025);v.o.frequency.setTargetAtTime(v.f0*(0.88+Math.random()*0.28),t,0.06);v.t=0.08+Math.random()*0.16;if(Math.random()<0.18){v.env.gain.setTargetAtTime(0,t+0.05,0.02)}}
    else{v.env.gain.setTargetAtTime(0,t,0.04);v.t=0.3+Math.random()*(2.2-1.6*busy);v.n=3+((Math.random()*12)|0)}}
  // the shop doors: a bell as each one starts to open (near enough to hear)
  for(const d of RM_DOORS){if(d.k!=='shop')continue;const o=(d.a||0)>0.02;if(o&&!d.stlO&&Math.abs(d.x-cx)<45&&Math.abs(d.z-cz)<45)stlBell(d.x+Math.cos(d.f)*d.w/2,d.y+2.1,d.z-Math.sin(d.f)*d.w/2);d.stlO=o}
  // the bus's air brakes letting go: a psst as it stops and as it pulls away
  for(const [x,z,k] of stl.hiss.splice(0)){const g=quiet*sndVol(sndCfg.fx)*(TU.stlHiss??0.7)*k/(1+(Math.hypot(x-cx,z-cz)/14)**2);if(g>0.003){const O=stlOut(x,1.2,z,1);sndShot('brake',O.out,O.t+0.2,0.85+0.1*Math.random(),g*1.1)}}
  // the marina: the hulls slapping, halyards ringing on the masts as the wind gusts, gulls by day
  const nM=1/(1+(dM/22)**2),day=ss(-4,8,dn.el),wind=amb?0.3+0.7*amb.gust:0.6,gm=quiet*inT*(TU.stlMarina??0.6)*nM;
  S.mar.gain.setTargetAtTime(gm*0.7*(0.7+0.4*wind),t,0.5);
  if(gm>0.004&&(S.clT-=dt*(0.4+2.6*wind))<=0){S.clT=0.3+Math.random()*1.6;const o=S.marP||snd.amb;if(S.marP)S.marP.pan.setTargetAtTime(Math.random()*1.4-0.7,t,0.01);
    const f=1500+Math.random()*1800,n=Math.random()<0.4?2:1;for(let k=0;k<n;k++)stlRing(o,t+0.01+k*(0.07+Math.random()*0.1),f*(1+k*0.03),[[1,1],[2.4,0.4],[4.1,0.15]],0.35+Math.random()*0.3,gm*0.12*(0.4+0.6*Math.random()))}
  if(gm>0.02&&day>0.5&&(S.gullT-=dt)<=0){S.gullT=4+Math.random()*10;const o=S.marP||snd.amb;if(S.marP)S.marP.pan.setTargetAtTime(Math.random()*1.6-0.8,t,0.01);sndShot('gull',o,t+0.02,0.85+0.3*Math.random(),gm*0.45*(0.4+0.6*Math.random()))}}
