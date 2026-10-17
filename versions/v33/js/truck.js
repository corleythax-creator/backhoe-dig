// Backhoe Dig: the dump truck and its driving, plus texture hookup once the images load.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- dump truck ----------
const WHITE=M(0xe9ecea,PAINT),WHITE_DS=M(0xe9ecea,Object.assign({side:THREE.DoubleSide},PAINT)),BEDM=M(0x6c7378),BED_D=M(0x4c5257),TGLASS=new THREE.MeshPhongMaterial({color:0x5f7f93,shininess:90,flatShading:true,transparent:true,opacity:0.35,depthWrite:false,envMap:skyEnv,combine:THREE.MixOperation,reflectivity:0.9}),TAIL=M(0xd0281c,{emissive:0x400804}),REV=M(0xf4f1e6,{emissive:0x202018});
const TRUCK_CAP=10/1.308,TR_START={x:-9,z:-11.6,yaw:1.47,v:0,steer:0,bed:0,load:0,hauled:0,rollA:0,y:0,pitch:0,roll:0,gear:1,shiftT:0,aL:0,brakeOn:false,sh:0,shV:0,sp:0,spV:0,sr:0,srV:0,bumpCd:0,loadedOnce:false,fullWarned:false,haulWarned:false,bedWarned:false};
const tr=Object.assign({},TR_START);
const truck=new THREE.Group();truck.rotation.order='YXZ';scene.add(truck);
// sprung: cab, frame and bed ride on the springs above the axles, pivoting near frame height
const sprung=new THREE.Group();sprung.position.y=1.0;truck.add(sprung);
const tBody=new THREE.Group();tBody.position.y=-1.0;sprung.add(tBody);
for(const x of [-0.5,0.5])box(0.18,0.28,7.2,STEEL,x,0.95,0.3,tBody);
for(let z=-3.2;z<=3.81;z+=0.75)box(1.0,0.1,0.12,STEEL,0,0.95,z,tBody);
box(2.35,1.4,1.5,WHITE,0,2.15,1.85,tBody);
box(2.37,0.12,1.52,STEEL_L,0,1.5,1.85,tBody);
box(2.0,0.55,0.05,TGLASS,0,2.5,2.61,tBody);
for(const x of [-1.185,1.185])box(0.04,0.5,0.85,TGLASS,x,2.5,1.95,tBody);
box(1.9,0.45,0.05,TGLASS,0,2.45,1.09,tBody);
box(2.2,0.08,0.3,WHITE,0,2.82,2.72,tBody);
for(let i=-1;i<=1;i++)box(0.12,0.06,0.06,AMBER,i*0.35,2.9,2.55,tBody);
box(2.0,0.75,1.45,WHITE,0,1.75,3.32,tBody);
box(1.96,0.08,1.4,WHITE,0,2.16,3.3,tBody);
box(1.5,0.6,0.05,STEEL,0,1.72,4.06,tBody);
for(let i=0;i<7;i++)box(1.4,0.03,0.04,STEEL_L,0,1.48+i*0.08,4.09,tBody);
box(2.45,0.28,0.28,STEEL_L,0,1.0,4.2,tBody);
for(const x of [-0.8,0.8]){const hl=cyl(0.11,0.11,0.06,20,LENS,tBody);hl.rotation.x=Math.PI/2;hl.position.set(x,1.85,4.06)}
for(const x of [-1.05,1.05]){box(0.55,0.08,1.25,WHITE,x,1.42,3.1,tBody);box(0.55,0.35,0.08,WHITE,x,1.26,3.72,tBody);
  box(0.06,0.06,0.5,STEEL,x*1.18,2.6,2.75,tBody);box(0.08,0.45,0.22,STEEL,x*1.33,2.45,2.95,tBody);
  box(0.4,0.06,0.3,STEEL_L,x,1.2,1.6,tBody);box(0.4,0.06,0.3,STEEL_L,x,0.85,1.6,tBody)}
const tank=cyl(0.28,0.28,0.95,48,CHROME,tBody);tank.rotation.x=Math.PI/2;tank.position.set(1.0,1.15,0.6);
const stack=cyl(0.08,0.08,1.9,32,CHROME,tBody);stack.position.set(-1.0,2.4,1.0);
for(const z of [-2.2,-1.6,-2.8]){const ax=cyl(0.07,0.07,1.9,10,STEEL,tBody);ax.rotation.z=Math.PI/2;ax.position.set(0,0.55,z)}
const ax2=cyl(0.07,0.07,2.0,10,STEEL,tBody);ax2.rotation.z=Math.PI/2;ax2.position.set(0,0.55,3.1);
for(const x of [-1.15,1.15])box(0.06,0.5,1.9,BED_D,x,1.15,-2.2,tBody);
// wheels
const wheels=[],frontWheels=[];
function makeWheel(x,z,dual){const g=new THREE.Group();g.rotation.order='YXZ';g.position.set(x,0.55,z);g.userData={lx:x,lz:z,off:0};truck.add(g);
  const offs=dual?[-0.21,0.21]:[0];
  for(const o of offs){const t=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.38,40,1),RUBBER);t.castShadow=true;g.add(t);t.rotation.z=Math.PI/2;t.position.x=o;
    for(const sd of [-1,1]){const sw=new THREE.Mesh(new THREE.TorusGeometry(0.46,0.075,5,28),RUBBER);sw.rotation.y=Math.PI/2;sw.position.x=o+sd*0.17;sw.castShadow=true;g.add(sw)}
    for(let k=0;k<22;k++){const an=k/22*Math.PI*2,tb=box(0.34,0.05,0.09,RUBBER,o+(k%2?0.03:-0.03),Math.sin(an)*0.565,Math.cos(an)*0.565,g);tb.rotation.x=-an}}
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,dual?0.84:0.4,32,1),STEEL_L);rim.castShadow=true;g.add(rim);rim.rotation.z=Math.PI/2;
  const hub=cyl(0.12,0.12,dual?0.9:0.46,32,CHROME,g);hub.rotation.z=Math.PI/2;
  const face=dual?0.43:0.21;
  for(const sd of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.025,4,28),STEEL);ring.rotation.y=Math.PI/2;ring.position.x=sd*face;g.add(ring);
    for(let k=0;k<10;k++){const an=k/10*Math.PI*2,lug=cyl(0.028,0.028,0.06,6,CHROME,g);lug.rotation.z=Math.PI/2;lug.position.set(sd*(face+0.02),Math.sin(an)*0.17,Math.cos(an)*0.17)}}
  mergeStatic(g,[]);wheels.push(g);if(!dual)frontWheels.push(g);return g}
makeWheel(-1.05,3.1,false);makeWheel(1.05,3.1,false);
for(const z of [-1.6,-2.8])for(const x of [-0.95,0.95])makeWheel(x,z,true);
// bed, hinged at the rear
const bedG=new THREE.Group();bedG.position.set(0,0.3,-3.4);sprung.add(bedG);
box(2.3,0.12,4.3,BEDM,0,0.06,2.15,bedG);
for(const x of [-1.15,1.15]){box(0.1,1.0,4.3,BEDM,x,0.56,2.15,bedG);box(0.18,0.1,4.36,BED_D,x,1.08,2.15,bedG);
  for(let z=0.15;z<4.3;z+=0.3)box(0.06,0.9,0.08,BED_D,x*1.04,0.5,z,bedG);edges(0.1,1.0,bedG,BEDM,0.56,0,0.56,4.3)}
for(const x of [-0.5,0.5])box(0.15,0.2,4.3,STEEL,x,-0.1,2.15,bedG);
box(2.3,1.15,0.1,BEDM,0,0.6,4.3,bedG);box(2.4,0.08,0.95,BED_D,0,1.2,4.72,bedG);
for(let i=-2;i<=2;i++)box(0.06,0.06,0.9,BEDM,i*0.5,1.26,4.72,bedG);
const tailP=new THREE.Group();tailP.position.set(0,1.1,0.0);bedG.add(tailP);
box(2.3,1.0,0.1,BED_D,0,-0.52,-0.03,tailP);for(let i=-2;i<=2;i++)box(0.08,0.9,0.05,BEDM,i*0.45,-0.52,-0.1,tailP);
const heapGeo=(function(){const g=new THREE.BoxGeometry(2.1,1,4.1,18,1,32),pa=g.attributes.position;
  for(let i=0;i<pa.count;i++){if(pa.getY(i)>0){const x=pa.getX(i),z=pa.getZ(i),e=Math.max(Math.abs(x)/1.05,Math.abs(z)/2.05);
    pa.setY(i,-0.5+(1-0.65*e*e)+0.07*Math.sin(x*5.1+z*3.7)+0.05*Math.cos(z*6.3))}}g.computeVertexNormals();return g})();
const heap=new THREE.Mesh(heapGeo,M(0x7a5232));heap.position.set(0,0.12,2.15);heap.visible=false;heap.castShadow=true;bedG.add(heap);
edges(2.35,1.4,tBody,WHITE,2.15,1.1,2.15,2.6);edges(2.0,0.75,tBody,WHITE,1.75,2.6,1.75,4.05);
for(const sd of [-1,1]){
  // arched front fenders, mud flaps, door seams and handles, steps, air tanks, mirrors
  const fg=new THREE.CylinderGeometry(0.74,0.74,0.52,40,1,true,0,Math.PI);fg.rotateZ(Math.PI/2);
  const fe=new THREE.Mesh(fg,WHITE_DS);fe.position.set(sd*1.05,0.55,3.1);fe.castShadow=true;tBody.add(fe);
  box(0.5,0.6,0.03,RUBBER,sd*0.95,0.5,-3.35,tBody);box(0.5,0.08,0.04,STEEL,sd*0.95,0.82,-3.35,tBody);
  for(const z of [1.15,2.55])box(0.02,1.25,0.03,STEEL,sd*1.18,2.1,z,tBody);
  box(0.02,0.03,1.4,STEEL,sd*1.18,1.48,1.85,tBody);
  box(0.03,0.04,0.18,CHROME,sd*1.2,2.15,1.35,tBody);
  for(const y of [1.25,1.9]){const gh=cyl(0.02,0.02,0.55,12,CHROME,tBody);gh.position.set(sd*1.2,y+0.1,1.05)}
  const at=cyl(0.17,0.17,0.85,32,STEEL_L,tBody);at.rotation.x=Math.PI/2;at.position.set(sd*0.85,0.95,-0.4);
  for(const z of [-0.8,0.0]){const band=cyl(0.18,0.18,0.03,32,STEEL,tBody);band.rotation.x=Math.PI/2;band.position.set(sd*0.85,0.95,z)}
  const arm=box(0.04,0.04,0.55,STEEL,sd*1.35,2.3,2.8,tBody);arm.rotation.y=sd*0.4;
  box(0.06,0.6,0.28,STEEL,sd*1.5,2.3,2.95,tBody);box(0.07,0.22,0.24,M(0x9aa9b4,{shininess:90}),sd*1.5,1.88,2.95,tBody);
  box(0.25,0.12,0.06,TAIL,sd*0.9,1.0,-3.42,tBody);box(0.1,0.12,0.06,AMBER,sd*0.62,1.0,-3.42,tBody);box(0.12,0.1,0.06,REV,sd*0.36,1.0,-3.42,tBody);
  for(let i=0;i<6;i++)box(0.02,0.03,0.7,STEEL,sd*1.005,1.62+i*0.07,3.35,tBody);
}
box(0.9,0.5,0.6,STEEL_L,1.0,1.05,-0.45+0.0,tBody);
for(const x of [-0.25,0.25]){const hn=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.45,20,2,true),CHROME);hn.rotation.x=-Math.PI/2;hn.position.set(x,2.95,1.6);tBody.add(hn)}
const shield=cyl(0.11,0.11,0.9,32,STEEL_L,tBody);shield.position.set(-1.0,2.1,1.0);
for(let i=0;i<4;i++)box(2.0,0.02,0.02,STEEL,0,2.18,3.0+i*0.25,tBody);
mergeStatic(tBody,[]);mergeStatic(bedG,[heap]);mergeStatic(tailP,[]);
ram(tBody,[0,1.05,0.4],bedG,[0,-0.05,3.75],0.13,0.065,1.3);
ram(tBody,[0,1.05,0.4],bedG,[0,-0.05,3.75],0.1,0.05,0.9);
const tl=new THREE.Vector3(),tv=new THREE.Vector3();
function inBed(p){tl.copy(p);bedG.worldToLocal(tl);return tl.x>-1.1&&tl.x<1.1&&tl.z>0.1&&tl.z<4.2&&tl.y>-0.3&&tl.y<3.2}
function heapTop(){return 0.12+(heap.visible?heap.scale.y*0.5+0.5*heap.scale.y:0)}
const G=9.8,WB=5.3,REAR=-2.2;
function updateTruck(dt,thr,steerIn,bedIn){
  const f=tr.load/TRUCK_CAP,mass=15000+tr.load*1400,vPrev=tr.v;
  // ground: the packed road rolls easiest and grips best, grass drags more, dug dirt most
  const soft=Math.abs(hAt(tr.x,tr.z)-h0At(tr.x,tr.z))>0.04,road=!soft&&roadAmt(tr.x,tr.z)>0.5,crr=soft?0.1:road?0.03:0.06;
  // transmission: opposite stick brakes; come to a stop and hold it to shift between D and R
  let drive=0,brake=0;
  if(tr.shiftT>0){tr.shiftT-=dt;brake=1;if(tr.shiftT<=0)tr.gear=-tr.gear}
  else if(thr){const want=Math.sign(thr);
    if(want===tr.gear)drive=Math.abs(thr);
    else if(Math.abs(tr.v)>0.3)brake=Math.abs(thr);
    else{tr.shiftT=0.5;brake=1}}
  else if(Math.abs(tr.v)<0.6)brake=1;
  if(tr.bed>0.06&&drive&&Math.abs(tr.v)>2&&!tr.bedWarned){tr.bedWarned=true;toast('Bed is up. Lower it to drive faster.')}
  if(tr.bed<0.02)tr.bedWarned=false;
  // diesel: traction-limited at low speed, power-limited above, governed top speed (20 mph, 6 mph in reverse or with the bed up)
  const vTop=tr.gear>0&&tr.bed<0.06?8.9:2.7,along=tr.v*tr.gear;
  const Fd=drive*Math.min(36000,230000/Math.max(1,Math.abs(tr.v)))*clamp(vTop-along,0,1);
  tr.v+=(tr.gear*Fd/mass+G*Math.sin(tr.pitch))*dt;
  const dec=(crr*G+(drive?0:0.35)+brake*65000/mass)*dt;
  tr.v=Math.abs(tr.v)<=dec?0:tr.v-Math.sign(tr.v)*dec;
  tr.drive=drive;tr.brakeOn=brake>0.2&&(Math.abs(tr.v)>0.05||tr.shiftT>0||!!thr);
  // steering: the wheels turn at a hydraulic rate, and tires scrub wide when the turn asks for more grip than they have
  tr.steer+=clamp(steerIn*0.6-tr.steer,-1.1*dt,1.1*dt);
  let curv=Math.tan(tr.steer)/WB;const v2=tr.v*tr.v,latMax=(soft?2.8:road?4.2:3.5)*(1-0.25*f);
  if(v2*Math.abs(curv)>latMax)curv=Math.sign(curv)*latMax/v2;
  // the rear tandem rolls along its heading and the cab swings around it, so the back end cuts inside the turn
  const sy0=Math.sin(tr.yaw),cy0=Math.cos(tr.yaw),rx=tr.x+sy0*REAR+sy0*tr.v*dt,rz=tr.z+cy0*REAR+cy0*tr.v*dt;
  const yawRate=-tr.v*curv;tr.yaw+=yawRate*dt;
  tr.x=rx-Math.sin(tr.yaw)*REAR;tr.z=rz-Math.cos(tr.yaw)*REAR;
  // the rim berm keeps both axles on the mesa (the tail can still hang over the edge to dump): head-on it stops
  // the truck, at a glancing angle it scrapes along and keeps most of its speed
  for(const lz of [3.1,REAR]){const sy=Math.sin(tr.yaw),cy=Math.cos(tr.yaw),px=tr.x+sy*lz,pz=tr.z+cy*lz,rr=mesaR(px,pz),lim=EDGE-1.0;
    if(rr>lim){const k=lim/rr;tr.x+=px*k-px;tr.z+=MZ+(pz-MZ)*k-pz;
      const nz=pz-MZ,nl=Math.hypot(px,nz)||1,c=(sy*px+cy*nz)/nl*Math.sign(tr.v);
      if(c>0)tr.v*=Math.exp(-c*dt*40)}}
  // keep the truck from driving through the excavator or blocks it can't roll over
  const sy=Math.sin(tr.yaw),cy=Math.cos(tr.yaw);
  for(const lz of [2.2,-0.4,-2.6]){const cx=tr.x+sy*lz,cz=tr.z+cy*lz,dx=cx-st.x,dz=cz-st.z,d=Math.hypot(dx,dz),min=1.5+2.3;
    if(d<min&&d>1e-3){tr.x+=dx/d*(min-d);tr.z+=dz/d*(min-d);
      if(Math.abs(tr.v)>1.2){shake=reduceMotion?0:0.15;rumble(250,0.7)}tr.v*=-0.15}}
  if(blkPush(tr,TR_C,TR_R)){if(Math.abs(tr.v)>1.2){shake=reduceMotion?0:0.15;rumble(250,0.7)}tr.v*=-0.15}
  tr.aL+=((tr.v-vPrev)/Math.max(dt,1e-3)-tr.aL)*Math.min(1,dt*6);
  // hydraulics lift slower under load; the bed comes down on its own weight
  tr.bed=clamp(tr.bed+bedIn*(bedIn>0?0.4*(1-0.4*f):0.55)*dt,0,0.9);
  tr.rollA+=tr.v*dt/0.55;
  // axles follow the ground (the rear tandem averages its two axles like a walking beam)
  const smp=(lx,lz)=>surfAt(tr.x+lx*cy+lz*sy,tr.z-lx*sy+lz*cy);
  const fL=smp(1.05,3.1),fR=smp(-1.05,3.1),bL=(smp(0.95,-1.6)+smp(0.95,-2.8))/2,bR=(smp(-0.95,-1.6)+smp(-0.95,-2.8))/2;
  const hf=(fL+fR)/2,hb=(bL+bR)/2,k=Math.min(1,dt*14);
  const dy=((hf+hb)/2-tr.y)*k,dp=(-Math.atan2(hf-hb,WB)-tr.pitch)*k,dr=(Math.atan2((fL+bL)/2-(fR+bR)/2,2.0)-tr.roll)*k;
  tr.y+=dy;tr.pitch+=dp;tr.roll+=dr;
  // the sprung body lags the axles over bumps, squats and dives with the throttle and brakes, leans out of turns, and sags under load
  tr.sh=clamp(tr.sh-dy,-0.16,0.16);tr.sp=clamp(tr.sp-dp,-0.06,0.06);tr.sr=clamp(tr.sr-dr,-0.06,0.06);
  const cg=1+0.7*f,c=2*0.32*10.5,spring=(x,xv,t)=>((t-x)*110-xv*c)*dt;
  tr.shV+=spring(tr.sh,tr.shV,-0.07*f);tr.sh+=tr.shV*dt;
  tr.spV+=spring(tr.sp,tr.spV,clamp(-tr.aL*0.008*cg,-0.035,0.035));tr.sp+=tr.spV*dt;
  tr.srV+=spring(tr.sr,tr.srV,clamp(tr.v*yawRate*0.011*cg,-0.05,0.05));tr.sr+=tr.srV*dt;
  tr.bumpCd-=dt;if(Math.abs(dy)>0.05&&tr.bumpCd<=0&&mode==='truck'){rumble(120,Math.min(1,Math.abs(dy)*6));tr.bumpCd=0.3}
  // tyres rut loose fill and crush clods; they pick up mud there
  if(Math.abs(tr.v)>0.1&&!bench.on){let r=false;for(const w of wheels){const u=w.userData,wx=tr.x+u.lx*cy+u.lz*sy,wz=tr.z-u.lx*sy+u.lz*cy;if(stampRut(wx,wz,tr.yaw,0.3,0.32,dt))r=true}
    if(r)tr.mud=Math.min(1,tr.mud+dt*0.08)}
  truck.position.set(tr.x,tr.y,tr.z);truck.rotation.set(tr.pitch,tr.yaw,tr.roll);
  sprung.position.y=1.0+tr.sh;sprung.rotation.set(tr.sp,0,tr.sr);
  const sP=Math.sin(tr.pitch),sR=Math.sin(tr.roll),kw=Math.min(1,dt*20);
  for(const w of wheels){const u=w.userData;u.off+=(clamp(smp(u.lx,u.lz)-(tr.y-u.lz*sP+u.lx*sR),-0.2,0.2)-u.off)*kw;w.position.y=0.55+u.off;w.rotation.x=tr.rollA}
  for(const w of frontWheels)w.rotation.y=tr.steer;
  TAIL.emissive.setHex(tr.brakeOn?0xff2a10:0x400804);REV.emissive.setHex(tr.gear<0&&tr.shiftT<=0?0xfff0c0:0x202018);
  // clods off the rear tires in loose dirt
  if(soft&&Math.abs(tr.v)>2&&Math.random()<Math.abs(tr.v)*dt*1.2){truck.localToWorld(tv.set(Math.random()<0.5?0.95:-0.95,0.2,REAR-Math.sign(tr.v)*0.9));spawn(tv,0.9)}
  // dust behind the rear tyres on the dry road and over loose dirt
  if((soft||road)&&Math.abs(tr.v)>2.5){truck.localToWorld(tv.set(0,0.3,REAR-Math.sign(tr.v)*1.2));dustPuff(tv.x,tv.y,tv.z,Math.abs(tr.v)*dt*(soft?1.2:0.6),soft?tr.loadC:null)}
  bedG.rotation.x=-tr.bed;tailP.rotation.x=tr.bed*1.35;
  const hv=Math.max(tr.load,tr.stuck);heap.visible=hv>0.01;if(heap.visible){const f=hv/TRUCK_CAP;tintLoad(heap.material,tr.loadC);heap.scale.set(0.55+0.45*Math.min(1,f*1.5),0.08+0.95*f,0.6+0.4*Math.min(1,f*1.5))}heap.position.y=0.12+0.5*heap.scale.y;
  truck.updateMatrixWorld(true);
  // tipping the bed pours the load out the back
  if(tr.bed>0.32&&tr.load>0.0005){
    const out=Math.min(tr.load,(tr.bed-0.32)*3.2*dt);tr.load-=out;if(tr.load<0.0005){tr.load=0;tr.stuck=TRUCK_CAP*0.025*(0.4+1.6*tr.loadMix[CLAY])}
    truck.localToWorld(tv.set(0,0.3,-4.3));
    if(mesaR(tv.x,tv.z)<EDGE-1.2&&Math.abs(tv.x)<S/2-0.8&&Math.abs(tv.z)<S/2-0.8){deposit(tv.x,tv.z,out,tr.loadC,tr.loadMix);st.dirty=true;st.slumpT=2.5}
    else{tr.hauled+=out;if(!tr.haulWarned&&tr.load<=0){tr.haulWarned=true;toast('Load hauled off site.','good')}}
    bedG.localToWorld(tv.set(0,0.4,0.2));for(let n=0;n<Math.ceil(out*40);n++)spawn(tv,1.2);
  }
  if(tr.load<TRUCK_CAP*0.95)tr.fullWarned=false;
}
// a grey copy of the dirt texture (mean 0.8) so the bucket load and truck heap can take any soil colour
function greyDetail(t){try{const im=t.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;
  const x2=c.getContext('2d');x2.drawImage(im,0,0);const d=x2.getImageData(0,0,c.width,c.height),p=d.data;let sum=0;
  for(let i=0;i<p.length;i+=4)sum+=p[i]*0.3+p[i+1]*0.59+p[i+2]*0.11;const k=0.8*255/(sum/(p.length/4));
  for(let i=0;i<p.length;i+=4){const l=Math.min(255,(p[i]*0.3+p[i+1]*0.59+p[i+2]*0.11)*k);p[i]=p[i+1]=p[i+2]=l}
  x2.putImageData(d,0,0);const g=new THREE.CanvasTexture(c);g.wrapS=g.wrapT=THREE.RepeatWrapping;return g}catch(e){return null}}
function tintLoad(mat,c){const k=mat.map?1.25:1;mat.color.setRGB(Math.min(1,c[0]*k),Math.min(1,c[1]*k),Math.min(1,c[2]*k))}
// called by main.js once every script has loaded (the images can finish before the later scripts arrive)
function applyTextures(){
  texMixU.value=1;
  for(const mt of [ORANGE,ORANGE_D,STEEL,STEEL_L,RUBBER,WHITE,WHITE_DS,BEDM,BED_D]){mt.map=texGrime;mt.needsUpdate=true}
  const grey=greyDetail(texDirt);heap.material.map=grey;heap.material.needsUpdate=true;
  ORANGE.color.setHex(0xf27a22);ORANGE_D.color.setHex(0xc85e1c);
  loadMesh.material.map=grey;loadMesh.material.needsUpdate=true;
  pMat.map=texDirt;pMat.color.setHex(0xd0b8a6);pMat.needsUpdate=true;
}
