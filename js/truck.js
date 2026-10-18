// Corley's Island: the dump truck and its driving, plus texture hookup once the images load.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- dump truck ----------
const WHITE=M(0xe9ecea,PAINT),WHITE_DS=M(0xe9ecea,Object.assign({side:THREE.DoubleSide},PAINT)),BEDM=M(0x6c7378),BED_D=M(0x4c5257),TGLASS=new THREE.MeshPhongMaterial({color:0x5f7f93,shininess:90,flatShading:true,transparent:true,opacity:0.35,depthWrite:false,envMap:skyEnv,combine:THREE.MixOperation,reflectivity:0.9}),TAIL=M(0xd0281c,{emissive:0x400804}),REV=M(0xf4f1e6,{emissive:0x202018});
const BED_L=4.9,TR_START={x:-9,z:-11.6,yaw:1.47,v:0,sink:0,spin:0,steer:0,bed:0,load:0,hauled:0,rollA:0,y:0,pitch:0,roll:0,gear:1,shiftT:0,aL:0,brakeOn:false,sh:0,shV:0,sp:0,spV:0,sr:0,srV:0,bumpCd:0,loadedOnce:false,fullWarned:false,haulWarned:false,bedWarned:false};
const tr=Object.assign({},TR_START);
const truck=new THREE.Group();truck.rotation.order='YXZ';scene.add(truck);
// sprung: cab, frame and bed ride on the springs above the axles, pivoting near frame height
const sprung=new THREE.Group();sprung.position.y=1.0;truck.add(sprung);
const tBody=new THREE.Group();tBody.position.y=-1.0;sprung.add(tBody);
for(const x of [-0.5,0.5])box(0.18,0.28,7.8,STEEL,x,0.95,0.0,tBody);
for(let z=-3.8;z<=3.81;z+=0.75)box(1.0,0.1,0.12,STEEL,0,0.95,z,tBody);
// cab shell: roof, floor and walls with real window openings, so the glass shows the cab inside
box(2.35,0.05,1.5,WHITE,0,2.825,1.85,tBody);box(2.35,0.05,1.5,WHITE,0,1.475,1.85,tBody);
box(2.35,0.775,0.04,WHITE,0,1.8375,2.58,tBody);box(2.35,0.075,0.04,WHITE,0,2.8125,2.58,tBody);
box(2.35,0.775,0.04,WHITE,0,1.8375,1.12,tBody);box(2.35,0.175,0.04,WHITE,0,2.7625,1.12,tBody);
for(const sd of [-1,1]){box(0.175,0.55,0.04,WHITE,sd*1.0875,2.5,2.58,tBody);box(0.225,0.45,0.04,WHITE,sd*1.0625,2.45,1.12,tBody);
  box(0.04,0.8,1.5,WHITE,sd*1.155,1.85,1.85,tBody);box(0.04,0.1,1.5,WHITE,sd*1.155,2.8,1.85,tBody);
  box(0.04,0.5,0.225,WHITE,sd*1.155,2.5,2.4875,tBody);box(0.04,0.5,0.425,WHITE,sd*1.155,2.5,1.3125,tBody)}
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
const stack=cyl(0.08,0.08,1.9,32,CHROME,tBody);stack.position.set(-1.0,2.4,1.0);
for(const z of [-2.2,-1.6,-2.8]){const ax=cyl(0.07,0.07,1.9,10,STEEL,tBody);ax.rotation.z=Math.PI/2;ax.position.set(0,0.55,z)}
const ax2=cyl(0.07,0.07,2.0,10,STEEL,tBody);ax2.rotation.z=Math.PI/2;ax2.position.set(0,0.55,3.1);
for(const x of [-1.15,1.15])box(0.06,0.5,1.9,BED_D,x,1.15,-2.2,tBody);
// wheels
const wheels=[],frontWheels=[];
function makeWheel(x,z,dual){const g=new THREE.Group();g.rotation.order='YXZ';g.position.set(x,0.55,z);g.userData={lx:x,lz:z,off:0};truck.add(g);
  const offs=dual?[-0.21,0.21]:[0];
  for(const o of offs){const t=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.38,48,1),RUBBER);t.castShadow=true;g.add(t);t.rotation.z=Math.PI/2;t.position.x=o;
    for(const sd of [-1,1]){const sw=new THREE.Mesh(new THREE.TorusGeometry(0.46,0.075,5,28),RUBBER);sw.rotation.y=Math.PI/2;sw.position.x=o+sd*0.17;sw.castShadow=true;g.add(sw)}
    for(const row of [-1,1])for(let k=0;k<22;k++){const an=(k+(row>0?0.5:0))/22*Math.PI*2,tb=box(0.16,0.05,0.1,RUBBER,o+row*0.095,Math.sin(an)*0.565,Math.cos(an)*0.565,g);tb.rotation.x=-an}}
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,dual?0.84:0.4,32,1),STEEL_L);rim.castShadow=true;g.add(rim);rim.rotation.z=Math.PI/2;
  const hub=cyl(0.12,0.12,dual?0.9:0.46,32,CHROME,g);hub.rotation.z=Math.PI/2;
  const face=dual?0.43:0.21;
  for(const sd of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.025,4,28),STEEL);ring.rotation.y=Math.PI/2;ring.position.x=sd*face;g.add(ring);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(0.31,0.02,4,28),STEEL_L);lip.rotation.y=Math.PI/2;lip.position.x=sd*(face-0.01);g.add(lip);
    for(let k=0;k<8;k++){const an=(k+0.5)/8*Math.PI*2,hh=cyl(0.035,0.035,0.01,6,STEEL,g);hh.rotation.z=Math.PI/2;hh.position.set(sd*(face+0.005),Math.sin(an)*0.26,Math.cos(an)*0.26)}
    const dm=new THREE.Mesh(new THREE.SphereGeometry(0.1,12,4,0,Math.PI*2,0,Math.PI/2),CHROME);dm.rotation.z=-sd*Math.PI/2;dm.scale.set(1,0.6,1);dm.position.x=sd*(face+0.03);g.add(dm);
    for(let k=0;k<10;k++){const an=k/10*Math.PI*2,lug=cyl(0.028,0.028,0.06,6,CHROME,g);lug.rotation.z=Math.PI/2;lug.position.set(sd*(face+0.02),Math.sin(an)*0.17,Math.cos(an)*0.17)}}
  const vs=cyl(0.01,0.01,0.07,6,CHROME,g);vs.rotation.z=Math.PI/2;vs.position.set(face+0.02,0.24,0.08);
  mergeStatic(g,[]);wheels.push(g);if(!dual)frontWheels.push(g);return g}
makeWheel(-1.05,3.1,false);makeWheel(1.05,3.1,false);
for(const z of [-1.6,-2.8])for(const x of [-0.95,0.95])makeWheel(x,z,true);
// bed: a 16 ft body hinged at the rear, hanging about 6 ft past the tandem
const bedG=new THREE.Group();bedG.position.set(0,0.3,-4.0);sprung.add(bedG);
box(2.3,0.12,BED_L,BEDM,0,0.06,BED_L/2,bedG);
for(const x of [-1.15,1.15]){box(0.1,1.0,BED_L,BEDM,x,0.56,BED_L/2,bedG);box(0.18,0.1,BED_L+0.06,BED_D,x,1.08,BED_L/2,bedG);
  for(let z=0.15;z<BED_L;z+=0.3)box(0.06,0.9,0.08,BED_D,x*1.04,0.5,z,bedG);edges(0.1,1.0,bedG,BEDM,0.56,0,0.56,BED_L)}
for(const x of [-0.5,0.5])box(0.15,0.2,BED_L,STEEL,x,-0.1,BED_L/2,bedG);
box(2.3,1.15,0.1,BEDM,0,0.6,BED_L,bedG);box(2.4,0.08,0.95,BED_D,0,1.2,BED_L+0.42,bedG);
for(let i=-2;i<=2;i++)box(0.06,0.06,0.9,BEDM,i*0.5,1.26,BED_L+0.42,bedG);
const tailP=new THREE.Group();tailP.position.set(0,1.1,0.0);bedG.add(tailP);
box(2.3,1.0,0.1,BED_D,0,-0.52,-0.03,tailP);for(let i=-2;i<=2;i++)box(0.08,0.9,0.05,BEDM,i*0.45,-0.52,-0.1,tailP);
const heapGeo=(function(){const g=new THREE.BoxGeometry(2.1,1,BED_L-0.2,18,1,32),pa=g.attributes.position;
  for(let i=0;i<pa.count;i++){if(pa.getY(i)>0){const x=pa.getX(i),z=pa.getZ(i),e=Math.max(Math.abs(x)/1.05,Math.abs(z)/(BED_L/2-0.1));
    pa.setY(i,-0.5+(1-0.65*e*e)+0.07*Math.sin(x*5.1+z*3.7)+0.05*Math.cos(z*6.3))}}g.computeVertexNormals();return g})();
const heap=new THREE.Mesh(heapGeo,M(0x7a5232));heap.position.set(0,0.12,BED_L/2);heap.visible=false;heap.castShadow=true;bedG.add(heap);
edges(2.35,1.4,tBody,WHITE,2.15,1.1,2.15,2.6);edges(2.0,0.75,tBody,WHITE,1.75,2.6,1.75,4.05);
for(const sd of [-1,1]){
  // arched front fenders, mud flaps, door seams and handles, steps, air tanks, mirrors
  const fg=new THREE.CylinderGeometry(0.74,0.74,0.52,40,1,true,0,Math.PI);fg.rotateZ(Math.PI/2);
  const fe=new THREE.Mesh(fg,WHITE_DS);fe.position.set(sd*1.05,0.55,3.1);fe.castShadow=true;tBody.add(fe);
  box(0.5,0.6,0.03,RUBBER,sd*0.95,0.5,-3.4,tBody);box(0.5,0.08,0.04,STEEL,sd*0.95,0.82,-3.4,tBody);
  for(const z of [1.15,2.55])box(0.02,1.25,0.03,STEEL,sd*1.18,2.1,z,tBody);
  box(0.02,0.03,1.4,STEEL,sd*1.18,1.48,1.85,tBody);
  box(0.03,0.04,0.18,CHROME,sd*1.2,2.15,1.35,tBody);
  for(const y of [1.25,1.9]){const gh=cyl(0.02,0.02,0.55,12,CHROME,tBody);gh.position.set(sd*1.2,y+0.1,1.05)}
  const at=cyl(0.17,0.17,0.85,32,STEEL_L,tBody);at.rotation.x=Math.PI/2;at.position.set(sd*0.85,0.95,-0.4);
  for(const z of [-0.8,0.0]){const band=cyl(0.18,0.18,0.03,32,STEEL,tBody);band.rotation.x=Math.PI/2;band.position.set(sd*0.85,0.95,z)}
  const arm=box(0.04,0.04,0.55,STEEL,sd*1.35,2.3,2.8,tBody);arm.rotation.y=sd*0.4;
  box(0.06,0.6,0.28,STEEL,sd*1.5,2.3,2.95,tBody);box(0.07,0.22,0.24,M(0x9aa9b4,{shininess:90}),sd*1.5,1.88,2.95,tBody);
  box(0.25,0.12,0.06,TAIL,sd*0.9,1.0,-4.02,tBody);box(0.1,0.12,0.06,AMBER,sd*0.62,1.0,-4.02,tBody);box(0.12,0.1,0.06,REV,sd*0.36,1.0,-4.02,tBody);
  for(let i=0;i<6;i++)box(0.02,0.03,0.7,STEEL,sd*1.005,1.62+i*0.07,3.35,tBody);
}
box(0.9,0.5,0.6,STEEL_L,1.0,1.05,-0.45+0.0,tBody);
for(const x of [-0.25,0.25]){const hn=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.45,20,2,true),CHROME);hn.rotation.x=-Math.PI/2;hn.position.set(x,2.95,1.6);tBody.add(hn)}
const shield=cyl(0.11,0.11,0.9,32,STEEL_L,tBody);shield.position.set(-1.0,2.1,1.0);
for(let i=0;i<4;i++)box(2.0,0.02,0.02,STEEL,0,2.18,3.0+i*0.25,tBody);
// ---------- truck detail: fuel tank, DEF tank, driveline, springs, cab interior, lights and fittings ----------
{
  const SEATM=M(0x34373a),DEFB=M(0x1f5fb4),FCAP=M(0x2e7d32),PLATE=M(0xf2f0e4),BLACK=M(0x111213,{shininess:30});
  const add=(geo,mat,x,y,z,parent,rx,ry,rz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=true;parent.add(m);return m};
  const cylX=(r,h,seg,mat,x,y,z,p)=>add(new THREE.CylinderGeometry(r,r,h,seg),mat,x,y,z,p,0,0,Math.PI/2);
  const cylZ=(r,h,seg,mat,x,y,z,p)=>add(new THREE.CylinderGeometry(r,r,h,seg),mat,x,y,z,p,Math.PI/2,0,0);
  const tube=(pts,r,seg,mat,p)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(...q))),seg,r,6,false),mat,0,0,0,p);
  // a spring leaf: a thin plank bowed upward in the middle
  const leafGeo=(L,bow)=>{const g=new THREE.BoxGeometry(0.11,0.024,L,1,1,8),pa=g.attributes.position;
    for(let i=0;i<pa.count;i++){const z=pa.getZ(i)/(L/2);pa.setY(i,pa.getY(i)+bow*(1-z*z))}g.computeVertexNormals();return g};
  const springPack=(x,y,z,L,n,bow)=>{for(let i=0;i<n;i++)add(leafGeo(L*(1-i*0.13),bow),STEEL,x,y-i*0.026,z,tBody);
    for(const d of [-0.12,0.12]){box(0.14,0.03,0.05,STEEL_L,x,y+0.02,z+d,tBody);for(const sx of [-0.06,0.06])add(new THREE.CylinderGeometry(0.012,0.012,0.22,8),STEEL_L,x+sx,y-0.06,z+d,tBody)}
    for(const e of [-1,1])cylX(0.035,0.14,16,STEEL_L,x,y+bow*0.1,z+e*L/2,tBody)};

  // fuel tank (right side, between the cab steps and the air tanks): polished drum, rolled ends, straps, filler and cap, sender, drain, feed lines
  {const tx=1.0,ty=1.15,tz=0.6,R=0.29,L=0.86;
    cylZ(R,L,48,CHROME,tx,ty,tz,tBody);
    for(const e of [-1,1]){const d=add(new THREE.SphereGeometry(R,48,8,0,Math.PI*2,0,Math.PI/2),CHROME,tx,ty,tz+e*L/2,tBody,e*Math.PI/2,0,0);d.scale.set(1,0.18,1);
      add(new THREE.TorusGeometry(R,0.022,6,48),CHROME,tx,ty,tz+e*L/2,tBody)}
    for(const dz of [-0.26,0.26]){add(new THREE.TorusGeometry(R+0.012,0.016,6,48),STEEL,tx,ty,tz+dz,tBody);
      box(0.3,0.05,0.07,STEEL,0.73,ty-R+0.03,tz+dz,tBody);box(0.06,0.34,0.07,STEEL,0.62,ty-0.1,tz+dz,tBody);
      box(0.24,0.05,0.07,STEEL,0.75,ty+R-0.03,tz+dz,tBody);cylX(0.016,0.1,10,CHROME,0.65,ty+R-0.03,tz+dz,tBody);
      add(new THREE.BoxGeometry(0.08,0.03,0.04),RUBBER,tx,ty-R-0.012,tz+dz,tBody)}
    // filler neck and green diesel cap with a knurled rim, a vent and the fuel gauge sender
    add(new THREE.CylinderGeometry(0.055,0.065,0.08,24),CHROME,tx+0.06,ty+R+0.02,tz+0.33,tBody);
    add(new THREE.CylinderGeometry(0.075,0.075,0.035,32),FCAP,tx+0.06,ty+R+0.075,tz+0.33,tBody);
    for(let k=0;k<16;k++){const an=k/16*Math.PI*2;box(0.012,0.03,0.012,FCAP,tx+0.06+Math.cos(an)*0.077,ty+R+0.075,tz+0.33+Math.sin(an)*0.077,tBody)}
    add(new THREE.TorusGeometry(0.03,0.006,4,16),CHROME,tx+0.06,ty+R+0.1,tz+0.33,tBody,Math.PI/2);
    add(new THREE.CylinderGeometry(0.045,0.045,0.025,24),STEEL_L,tx-0.04,ty+R+0.005,tz-0.18,tBody);
    for(let k=0;k<6;k++){const an=k/6*Math.PI*2;add(new THREE.CylinderGeometry(0.008,0.008,0.02,6),CHROME,tx-0.04+Math.cos(an)*0.036,ty+R+0.02,tz-0.18+Math.sin(an)*0.036,tBody)}
    add(new THREE.CylinderGeometry(0.02,0.02,0.04,12),STEEL,tx,ty-R-0.01,tz,tBody);
    tube([[tx-0.04,ty+R,tz-0.18],[0.85,ty+R+0.05,tz-0.25],[0.62,ty+0.2,tz-0.35],[0.5,1.0,0.0]],0.014,24,HOSE,tBody);
    tube([[tx-0.07,ty+R,tz-0.14],[0.88,ty+R+0.06,tz-0.2],[0.66,ty+0.25,tz-0.3],[0.55,1.02,0.1]],0.012,24,HOSE,tBody);
    box(0.012,0.06,0.16,AMBER,tx+R*0.93,ty+0.12,tz+0.33,tBody).rotation.z=-0.4;
  }
  // DEF tank (left side): white plastic drum with blue cap and a level sender, on a cradle
  {const x=-1.0,y=1.05,z=0.55;
    cylZ(0.21,0.55,48,WHITE,x,y,z,tBody);
    for(const e of [-1,1]){const d=add(new THREE.SphereGeometry(0.21,32,6,0,Math.PI*2,0,Math.PI/2),WHITE,x,y,z+e*0.275,tBody,e*Math.PI/2,0,0);d.scale.set(1,0.2,1)}
    for(const dz of [-0.17,0.17]){add(new THREE.TorusGeometry(0.218,0.014,6,32),STEEL,x,y,z+dz,tBody);box(0.36,0.05,0.06,STEEL,-0.71,y-0.2,z+dz,tBody)}
    add(new THREE.CylinderGeometry(0.06,0.06,0.04,32),DEFB,x-0.05,y+0.225,z+0.18,tBody);
    add(new THREE.CylinderGeometry(0.035,0.035,0.02,16),STEEL_L,x+0.02,y+0.215,z-0.12,tBody);
    tube([[x+0.02,y+0.22,z-0.12],[-0.8,y+0.24,z-0.2],[-0.6,y,z-0.25],[-0.5,1.0,0.1]],0.01,20,HOSE,tBody);
  }
  // battery box lid with latches and cables (right, behind the tank)
  box(0.92,0.04,0.62,STEEL,1.0,1.32,-0.45,tBody);
  for(const dz of [-0.18,0.0,0.18])box(0.9,0.02,0.04,STEEL_L,1.0,1.345,-0.45+dz,tBody);
  for(const dz of [-0.2,0.2]){box(0.03,0.12,0.05,BLACK,1.47,1.22,-0.45+dz,tBody);add(new THREE.TorusGeometry(0.03,0.008,4,12),CHROME,1.48,1.16,-0.45+dz,tBody,0,Math.PI/2)}
  tube([[0.6,1.1,-0.3],[0.52,1.0,-0.1],[0.45,0.9,0.4],[0.35,0.88,1.0]],0.02,24,BLACK,tBody);
  tube([[0.6,1.1,-0.6],[0.5,0.95,-0.7],[0.4,0.85,-0.75]],0.02,16,M(0xb81f18),tBody);

  // driveline: engine sump and transmission under the cab, shafts with U-joints to the tandem diffs, axle hubs
  box(0.62,0.32,0.9,STEEL_L,0,0.92,2.9,tBody);
  add(new THREE.CylinderGeometry(0.26,0.3,0.25,40),STEEL_L,0,0.92,2.25,tBody,Math.PI/2);
  box(0.42,0.36,0.85,STEEL_L,0,0.9,1.65,tBody);for(let i=0;i<4;i++)box(0.44,0.02,0.02,STEEL,0,0.9,1.35+i*0.2,tBody);
  add(new THREE.CylinderGeometry(0.12,0.16,0.18,32),STEEL,0,0.86,1.15,tBody,Math.PI/2);
  const shaft=(z0,z1,y0,y1)=>{const dz=z1-z0,dy=y1-y0,Ls=Math.hypot(dz,dy),a=Math.atan2(dy,dz);
    add(new THREE.CylinderGeometry(0.05,0.05,Ls-0.12,24),STEEL_L,0,(y0+y1)/2,(z0+z1)/2,tBody,Math.PI/2-a);
    for(const [zz,yy] of [[z0,y0],[z1,y1]]){add(new THREE.CylinderGeometry(0.07,0.07,0.06,24),STEEL,0,yy,zz,tBody,Math.PI/2-a);
      box(0.16,0.025,0.025,STEEL,0,yy,zz,tBody);box(0.025,0.16,0.025,STEEL,0,yy,zz,tBody)}};
  shaft(1.04,-1.42,0.84,0.62);shaft(-1.78,-2.62,0.62,0.62);
  for(const z of [-1.6,-2.8]){
    const pk=add(new THREE.SphereGeometry(0.22,24,12),STEEL_L,0.08,0.55,z,tBody);pk.scale.set(1,0.95,0.85);
    add(new THREE.CylinderGeometry(0.17,0.17,0.08,40),STEEL,0.08,0.55,z+(z>-2?0.17:-0.17),tBody,Math.PI/2);
    for(let k=0;k<10;k++){const an=k/10*Math.PI*2;cylZ(0.012,0.04,8,CHROME,0.08+Math.cos(an)*0.15,0.55+Math.sin(an)*0.15,z+(z>-2?0.21:-0.21),tBody)}
    for(const sd of [-1,1]){add(new THREE.CylinderGeometry(0.09,0.12,0.35,24),STEEL,sd*0.6,0.55,z,tBody,0,0,Math.PI/2);
      add(new THREE.CylinderGeometry(0.15,0.15,0.12,24),STEEL_L,sd*0.68,0.55,z,tBody,0,0,Math.PI/2)}
  }
  // tandem: long leaf packs on a center trunnion, torque rods to the axles
  for(const sd of [-1,1]){springPack(sd*0.5,0.78,-2.2,1.5,6,0.05);
    add(new THREE.CylinderGeometry(0.09,0.09,0.2,32),STEEL,sd*0.5,0.66,-2.2,tBody,0,0,Math.PI/2);
    box(0.16,0.3,0.36,STEEL,sd*0.5,0.86,-2.2,tBody);
    for(const z of [-1.6,-2.8])cylZ(0.03,0.5,16,STEEL_L,sd*0.32,0.38,(z+(-2.2))/2+(z>-2?0.05:-0.05),tBody)}
  // front: leaf springs, shocks, steering knuckles, tie rod, drag link and steering box
  for(const sd of [-1,1]){springPack(sd*0.5,0.74,3.1,1.25,5,0.06);
    box(0.14,0.1,0.18,STEEL,sd*0.5,0.66,3.1,tBody);
    const sh=add(new THREE.CylinderGeometry(0.04,0.04,0.45,20),STEEL_L,sd*0.62,0.82,2.85,tBody,0.35);
    add(new THREE.CylinderGeometry(0.025,0.025,0.25,16),CHROME,sd*0.62,1.0,2.79,tBody,0.35);
    add(new THREE.CylinderGeometry(0.06,0.06,0.3,24),STEEL,sd*0.88,0.55,3.1,tBody);
    box(0.06,0.05,0.28,STEEL,sd*0.86,0.45,2.95,tBody)}
  cylX(0.025,1.7,16,STEEL_L,0,0.45,2.82,tBody);for(const sd of [-1,1])add(new THREE.SphereGeometry(0.04,16,8),STEEL,sd*0.85,0.45,2.82,tBody);
  box(0.24,0.2,0.22,STEEL,-0.62,1.05,3.85,tBody);tube([[-0.62,0.92,3.75],[-0.72,0.7,3.4],[-0.86,0.5,3.0]],0.022,16,STEEL_L,tBody);
  // front: grille surround, badge, headlight bezels, turn signals, fog lights, bumper bolts, tow hooks, plate, mud flaps
  box(1.58,0.06,0.06,CHROME,0,2.04,4.08,tBody);box(1.58,0.06,0.06,CHROME,0,1.41,4.08,tBody);
  for(const sd of [-1,1])box(0.06,0.69,0.06,CHROME,sd*0.77,1.72,4.08,tBody);
  for(let i=0;i<5;i++)box(0.03,0.58,0.03,STEEL_L,(i-2)*0.3,1.72,4.09,tBody);
  add(new THREE.CylinderGeometry(0.08,0.08,0.02,32),CHROME,0,2.12,4.07,tBody,Math.PI/2);
  for(const sd of [-1,1]){
    add(new THREE.TorusGeometry(0.12,0.018,6,40),CHROME,sd*0.8,1.85,4.075,tBody);
    box(0.12,0.1,0.04,AMBER,sd*0.95,1.85,4.06,tBody);box(0.08,0.06,0.03,AMBER,sd*1.0,2.06,4.05,tBody);
    cylZ(0.07,0.06,28,LENS,sd*1.0,1.0,4.35,tBody);add(new THREE.TorusGeometry(0.07,0.012,4,28),CHROME,sd*1.0,1.0,4.38,tBody);
    for(const bx of [0.35,0.6])cylZ(0.022,0.03,12,CHROME,sd*bx,1.0,4.35,tBody);
    const hk=add(new THREE.TorusGeometry(0.06,0.018,8,20,Math.PI*1.3),STEEL,sd*0.7,0.84,4.36,tBody,0,Math.PI/2,Math.PI*0.85);
    box(0.5,0.55,0.03,RUBBER,sd*1.05,0.48,2.32,tBody);box(0.5,0.06,0.04,STEEL,sd*1.05,0.78,2.32,tBody);
  }
  box(0.5,0.22,0.02,PLATE,0,1.0,4.345,tBody);
  // cab: two-piece windshield post, wipers, door window trim and hinges, beacon, antenna, hood spot mirrors
  box(0.05,0.55,0.03,WHITE,0,2.5,2.635,tBody);
  for(const sd of [-1,1]){const w=box(0.7,0.015,0.015,BLACK,sd*0.5,2.265,2.645,tBody);w.rotation.z=sd*0.08;box(0.04,0.04,0.04,BLACK,sd*0.15,2.245,2.64,tBody);
    box(0.02,0.04,0.88,CHROME,sd*1.19,2.77,1.95,tBody);box(0.02,0.04,0.88,CHROME,sd*1.19,2.23,1.95,tBody);
    for(const y of [1.75,2.4])cylX(0.03,0.04,12,STEEL,sd*1.19,y,2.58,tBody);
    tube([[sd*1.0,2.12,3.7],[sd*1.12,2.2,3.85],[sd*1.18,2.12,3.95]],0.012,12,STEEL,tBody);
    const sm=add(new THREE.SphereGeometry(0.075,16,6,0,Math.PI*2,0,Math.PI/2),BLACK,sd*1.2,2.1,3.97,tBody,-Math.PI/2);sm.scale.set(1,0.5,1);
  }
  add(new THREE.CylinderGeometry(0.1,0.12,0.06,32),BLACK,0.6,2.89,1.35,tBody);
  const bc=add(new THREE.SphereGeometry(0.09,24,8,0,Math.PI*2,0,Math.PI/2),AMBER,0.6,2.92,1.35,tBody);bc.scale.set(1,1.4,1);
  add(new THREE.CylinderGeometry(0.008,0.004,1.1,6),BLACK,-1.5,3.15,2.95,tBody);add(new THREE.CylinderGeometry(0.03,0.03,0.06,12),BLACK,-1.5,2.62,2.95,tBody);
  // cab interior (seen from the cab view): seats, dash with gauges, steering wheel and column, shifter
  for(const sx of [-0.55,0.55]){box(0.52,0.14,0.5,SEATM,sx,1.95,1.6,tBody);box(0.52,0.7,0.12,SEATM,sx,2.33,1.3,tBody);box(0.3,0.2,0.1,SEATM,sx,2.78,1.28,tBody);
    for(const ex of [-0.27,0.27])box(0.04,0.14,0.42,SEATM,sx+ex,2.05,1.6,tBody);box(0.3,0.3,0.3,STEEL,sx,1.72,1.6,tBody)}
  box(2.2,0.3,0.32,SEATM,0,2.05,2.42,tBody);box(2.2,0.04,0.36,BLACK,0,2.205,2.4,tBody);
  for(const gx of [-0.72,-0.55,-0.38]){cylZ(0.055,0.02,24,LENS,gx,2.12,2.255,tBody);add(new THREE.TorusGeometry(0.055,0.01,4,24),CHROME,gx,2.12,2.25,tBody)}
  for(let i=0;i<6;i++)box(0.05,0.03,0.02,i%2?AMBER:STEEL_L,0.05+i*0.09,2.12,2.255,tBody);
  {const sw=new THREE.Group();sw.position.set(-0.55,2.22,2.15);sw.rotation.x=0.65;tBody.add(sw);
    add(new THREE.TorusGeometry(0.2,0.025,8,36),BLACK,0,0,0,sw);add(new THREE.CylinderGeometry(0.05,0.05,0.04,24),BLACK,0,0,0,sw,Math.PI/2);
    for(const a of [0,2.1,4.2]){const sp=box(0.18,0.025,0.02,BLACK,Math.cos(a)*0.11,Math.sin(a)*0.11,0,sw);sp.rotation.z=a}
    sw.updateMatrix();for(const c of [...sw.children]){c.updateMatrix();c.matrix.premultiply(sw.matrix);c.matrix.decompose(c.position,c.quaternion,c.scale);sw.remove(c);tBody.add(c)}tBody.remove(sw)}
  add(new THREE.CylinderGeometry(0.035,0.04,0.42,16),BLACK,-0.55,2.094,2.318,tBody,2.214);
  add(new THREE.CylinderGeometry(0.012,0.012,0.3,8),CHROME,-0.15,1.95,2.05,tBody,0.3);add(new THREE.SphereGeometry(0.035,12,8),BLACK,-0.15,2.1,2.1,tBody);
  // exhaust: rain cap, clamps, stand-off brackets, flex pipe down under the cab
  {const sx=-1.0,sz=1.0;
    for(const y of [1.62,2.58])add(new THREE.TorusGeometry(0.115,0.015,6,40),CHROME,sx,y,sz,tBody,Math.PI/2);
    for(const y of [1.75,2.45]){box(0.04,0.04,0.12,STEEL,sx,y,sz+0.15,tBody);box(0.2,0.08,0.02,STEEL,sx,y,sz+0.1,tBody)}
    add(new THREE.CylinderGeometry(0.09,0.09,0.012,32),CHROME,sx-0.03,3.36,sz,tBody,0,0,0.5);
    add(new THREE.CylinderGeometry(0.01,0.01,0.12,8),STEEL,sx+0.06,3.35,sz,tBody,0,0,Math.PI/2);
    tube([[sx,1.48,sz],[sx,1.2,sz+0.05],[-0.8,0.95,sz+0.3],[-0.55,0.9,1.8]],0.075,32,STEEL_L,tBody);
  }
  // bed hoist hydraulic lines along the frame, air tank drains and air lines
  tube([[0.12,0.98,0.45],[0.2,0.95,1.0],[0.25,0.9,1.4]],0.022,20,HOSE,tBody);tube([[-0.12,0.98,0.45],[-0.2,0.95,1.0],[-0.25,0.9,1.4]],0.022,20,HOSE,tBody);
  for(const sd of [-1,1]){add(new THREE.CylinderGeometry(0.015,0.015,0.05,10),CHROME,sd*0.85,0.77,-0.4,tBody);
    for(const e of [-1,1])add(new THREE.SphereGeometry(0.17,24,4,0,Math.PI*2,0,Math.PI/2),STEEL_L,sd*0.85,0.95,-0.4+e*0.425,tBody,e*Math.PI/2).scale.set(1,0.25,1);
    tube([[sd*0.85,1.12,-0.1],[sd*0.7,1.12,0.0],[sd*0.55,1.08,0.3]],0.01,12,HOSE,tBody)}
  // rear: under-ride bar, light bar, plate with its lamp, pintle hitch, reflectors
  box(2.1,0.12,0.1,STEEL,0,0.62,-4.1,tBody);for(const sd of [-1,1])box(0.08,0.35,0.08,STEEL,sd*0.5,0.8,-4.05,tBody);
  box(2.1,0.18,0.05,STEEL,0,1.0,-4.0,tBody);box(0.38,0.2,0.02,PLATE,0,0.62,-4.16,tBody);cylZ(0.025,0.03,12,LENS,0,0.75,-4.16,tBody);
  add(new THREE.TorusGeometry(0.06,0.02,8,24),STEEL,0,0.48,-4.2,tBody,Math.PI/2);box(0.2,0.18,0.1,STEEL,0,0.55,-4.12,tBody);
  for(const sd of [-1,1])box(0.1,0.05,0.02,TAIL,sd*0.85,0.62,-4.16,tBody);

  // bed: cross sills, hinge pins, top-rail marker lights, front-corner ladder, tarp roller
  for(let z=0.3;z<BED_L;z+=0.45)box(1.0,0.1,0.08,STEEL,0,-0.09,z,bedG);
  for(const sd of [-1,1]){cylX(0.06,0.18,24,STEEL_L,sd*0.5,-0.15,0.05,bedG);box(0.14,0.2,0.16,STEEL,sd*0.5,-0.08,0.12,bedG);
    for(const z of [0.35,BED_L/2,BED_L-0.35]){box(0.04,0.07,0.12,AMBER,sd*1.255,0.92,z,bedG);box(0.02,0.09,0.14,STEEL,sd*1.24,0.92,z,bedG)}
    box(0.04,0.07,0.1,TAIL,sd*1.255,0.92,0.08,bedG)}
  for(const sd of [-1,1])box(0.05,1.0,0.05,STEEL_L,-1.27,0.45,BED_L-0.25+sd*0.14,bedG);for(let i=0;i<5;i++)box(0.04,0.04,0.32,STEEL_L,-1.27,0.05+i*0.2,BED_L-0.25,bedG);
  cylX(0.07,2.3,40,BLACK,0,1.34,BED_L+0.02,bedG);for(const sd of [-1,1])add(new THREE.CylinderGeometry(0.09,0.09,0.05,32),STEEL,sd*1.17,1.34,BED_L+0.02,bedG,0,0,Math.PI/2);
  tube([[1.2,1.34,BED_L+0.02],[1.3,0.9,BED_L-1.1],[1.3,0.5,BED_L-2.5],[1.27,0.3,0.6]],0.02,32,STEEL_L,bedG);
  // tailgate: top hinge eyes, bottom latch pins and hooks, reflectors
  for(const sd of [-1,1]){cylX(0.04,0.12,24,STEEL_L,sd*1.08,0,-0.05,tailP);add(new THREE.TorusGeometry(0.05,0.015,6,24),STEEL,sd*1.08,0,-0.05,tailP,0,Math.PI/2);
    cylX(0.03,0.16,20,STEEL,sd*1.06,-1.0,-0.06,tailP);box(0.05,0.14,0.08,STEEL,sd*1.06,-0.95,-0.12,tailP);
    box(0.25,0.06,0.02,TAIL,sd*0.8,-0.92,-0.1,tailP)}
  for(let i=0;i<3;i++)box(2.2,0.05,0.04,BEDM,0,-0.2-i*0.3,-0.1,tailP);
}
mergeStatic(tBody,[]);mergeStatic(bedG,[heap]);mergeStatic(tailP,[]);
ram(tBody,[0,1.05,0.4],bedG,[0,-0.05,BED_L-0.55],0.13,0.065,1.3);
ram(tBody,[0,1.05,0.4],bedG,[0,-0.05,BED_L-0.55],0.1,0.05,0.9);
const tl=new THREE.Vector3(),tv=new THREE.Vector3();
function inBed(p){tl.copy(p);bedG.worldToLocal(tl);return tl.x>-1.1&&tl.x<1.1&&tl.z>0.1&&tl.z<BED_L-0.1&&tl.y>-0.3&&tl.y<3.2}
function heapTop(){return 0.12+(heap.visible?heap.scale.y*0.5+0.5*heap.scale.y:0)}
const G=9.8,WB=5.3,REAR=-2.2;
function updateTruck(dt,thr,steerIn,bedIn){
  const f=tr.load/TU.trCap,mass=15000+tr.load*1400,vPrev=tr.v;
  // ground: the packed road rolls easiest and grips best, grass drags more, dug dirt most
  // mud drags, and pushing on in it digs the tyres in until they spin (bogTick, mud.js); bogged down it drags far more
  const mudN=mudAt(tr.x,tr.z),grip=bogTick(tr,mudN,thr,0.06,dt);
  const soft=Math.abs(hAt(tr.x,tr.z)-h0At(tr.x,tr.z))>0.04,road=!soft&&roadAmt(tr.x,tr.z)>0.5,crr=(soft?0.1:road?0.03:0.06)+0.06*mudN+0.06*tr.sink;
  // transmission: opposite stick brakes; come to a stop and hold it to shift between D and R
  let drive=0,brake=0;
  if(tr.shiftT>0){tr.shiftT-=dt;brake=1;if(tr.shiftT<=0)tr.gear=-tr.gear}
  else if(thr){const want=Math.sign(thr);
    if(want===tr.gear)drive=Math.abs(thr);
    else if(Math.abs(tr.v)>0.3)brake=Math.abs(thr);
    else{tr.shiftT=0.5;brake=1}}
  else if(Math.abs(tr.v)<0.6)brake=1;
  if(tr.bed>0.06&&drive&&Math.abs(tr.v)>2&&!tr.bedWarned){tr.bedWarned=true;toast(say('bedUp'))}
  if(tr.bed<0.02)tr.bedWarned=false;
  // diesel: traction-limited at low speed, power-limited above, governed top speed (20 mph, 6 mph in reverse or with the bed up)
  const vTop=tr.gear>0&&tr.bed<0.06?TU.trTop:TU.trRev,along=tr.v*tr.gear;
  const Fd=drive*Math.min(36000,230000/Math.max(1,Math.abs(tr.v)))*clamp(vTop-along,0,1)*grip;
  tr.v+=(tr.gear*Fd/mass+G*Math.sin(tr.pitch))*dt;
  const dec=(crr*G+(drive?0:0.35)+brake*65000/mass)*dt;
  tr.v=Math.abs(tr.v)<=dec?0:tr.v-Math.sign(tr.v)*dec;
  tr.drive=drive;tr.soft=soft;tr.road=road;tr.bedIn=bedIn;sndIn.dump=0;tr.brakeOn=brake>0.2&&(Math.abs(tr.v)>0.05||tr.shiftT>0||!!thr);
  // steering: the wheels turn at a hydraulic rate, and tires scrub wide when the turn asks for more grip than they have
  tr.steer+=clamp(steerIn*0.6-tr.steer,-TU.trSteer*dt,TU.trSteer*dt);
  let curv=Math.tan(tr.steer)/WB;const v2=tr.v*tr.v,latMax=(soft?2.8:road?4.2:3.5)*(1-0.25*f)*(1-0.35*mudAt(tr.x,tr.z));
  if(v2*Math.abs(curv)>latMax)curv=Math.sign(curv)*latMax/v2;
  // the rear tandem rolls along its heading and the cab swings around it, so the back end cuts inside the turn
  const sy0=Math.sin(tr.yaw),cy0=Math.cos(tr.yaw),rx=tr.x+sy0*REAR+sy0*tr.v*dt,rz=tr.z+cy0*REAR+cy0*tr.v*dt;
  const ox=tr.x,oz=tr.z,oyaw=tr.yaw,w0=wallCount(tr.x,tr.z,tr.yaw,TR_P);
  const yawRate=-tr.v*curv;tr.yaw+=yawRate*dt;
  tr.x=rx-Math.sin(tr.yaw)*REAR;tr.z=rz-Math.cos(tr.yaw)*REAR;
  // the scarp face, ramp banks and stockpiles are too steep to climb: the truck stops against them
  if(wallCount(tr.x,tr.z,tr.yaw,TR_P)>w0){tr.x=ox;tr.z=oz;tr.yaw=oyaw;if(Math.abs(tr.v)>1.2){shake=reduceMotion?0:0.12;rumble(200,0.5)}tr.v=0}
  // the rim berm keeps both axles on the mesa (the tail can still hang over the edge to dump): head-on it stops
  // the truck, at a glancing angle it scrapes along and keeps most of its speed
  // (and the railings keep it on a bridge deck)
  for(const lz of [3.1,REAR]){const sy=Math.sin(tr.yaw),cy=Math.cos(tr.yaw),px=tr.x+sy*lz,pz=tr.z+cy*lz,q=landClamp(px,pz,1.0,1.4);
    if(q[0]!==px||q[1]!==pz){tr.x+=q[0]-px;tr.z+=q[1]-pz;
      const nx=px-q[0],nz=pz-q[1],nl=Math.hypot(nx,nz)||1,c=(sy*nx+cy*nz)/nl*Math.sign(tr.v);
      if(c>0)tr.v*=Math.exp(-c*dt*40)}}
  // keep the truck from driving through the excavator or blocks it can't roll over
  const sy=Math.sin(tr.yaw),cy=Math.cos(tr.yaw);
  for(const lz of [2.2,-0.4,-2.6,-3.6]){const cx=tr.x+sy*lz,cz=tr.z+cy*lz,dx=cx-st.x,dz=cz-st.z,d=Math.hypot(dx,dz),min=1.5+2.7;
    if(d<min&&d>1e-3){tr.x+=dx/d*(min-d);tr.z+=dz/d*(min-d);
      if(Math.abs(tr.v)>1.2){shake=reduceMotion?0:0.15;rumble(250,0.7)}tr.v*=-0.15}}
  // and off Dexter's skid steer
  for(const lz of TR_C){const cx=tr.x+sy*lz,cz=tr.z+cy*lz;for(const q of SK_C){const dx=cx-sk.x-Math.sin(sk.yaw)*q,dz=cz-sk.z-Math.cos(sk.yaw)*q,d=Math.hypot(dx,dz),m=TR_R+SK_R;
    if(d<m&&d>1e-3){tr.x+=dx/d*(m-d);tr.z+=dz/d*(m-d);tr.v*=0.5}}}
  if(blkPush(tr,TR_C,TR_R)){if(Math.abs(tr.v)>1.2){shake=reduceMotion?0:0.15;rumble(250,0.7)}tr.v*=-0.15}
  tr.aL+=((tr.v-vPrev)/Math.max(dt,1e-3)-tr.aL)*Math.min(1,dt*6);
  // hydraulics lift slower under load; the bed comes down on its own weight
  tr.bed=clamp(tr.bed+bedIn*(bedIn>0?0.4*(1-0.4*f):0.55)*dt,0,0.9);
  // spinning tyres turn faster than the truck moves
  tr.rollA+=(tr.v+tr.gear*tr.spin*5)*dt/0.55;
  // axles follow the ground (the rear tandem averages its two axles like a walking beam)
  const smp=(lx,lz)=>surfAt(tr.x+lx*cy+lz*sy,tr.z-lx*sy+lz*cy);
  const fL=smp(1.05,3.1),fR=smp(-1.05,3.1),bL=(smp(0.95,-1.6)+smp(0.95,-2.8))/2,bR=(smp(-0.95,-1.6)+smp(-0.95,-2.8))/2;
  const hf=(fL+fR)/2,hb=(bL+bR)/2,k=Math.min(1,dt*14);
  const dy=((hf+hb)/2-0.15*tr.sink-tr.y)*k,dp=(-Math.atan2(hf-hb,WB)-tr.pitch)*k,dr=(Math.atan2((fL+bL)/2-(fR+bR)/2,2.0)-tr.roll)*k;
  tr.y+=dy;tr.pitch+=dp;tr.roll+=dr;
  // the sprung body lags the axles over bumps, squats and dives with the throttle and brakes, leans out of turns, and sags under load
  tr.sh=clamp(tr.sh-dy,-0.16,0.16);tr.sp=clamp(tr.sp-dp,-0.06,0.06);tr.sr=clamp(tr.sr-dr,-0.06,0.06);
  const cg=1+0.7*f,c=2*0.32*10.5,spring=(x,xv,t)=>((t-x)*110-xv*c)*dt;
  tr.shV+=spring(tr.sh,tr.shV,-0.07*f);tr.sh+=tr.shV*dt;
  tr.spV+=spring(tr.sp,tr.spV,clamp(-tr.aL*0.008*cg,-0.035,0.035));tr.sp+=tr.spV*dt;
  tr.srV+=spring(tr.sr,tr.srV,clamp(tr.v*yawRate*0.011*cg,-0.05,0.05));tr.sr+=tr.srV*dt;
  tr.bumpCd-=dt;if(Math.abs(dy)>0.05&&tr.bumpCd<=0&&mode==='truck'){rumble(120,Math.min(1,Math.abs(dy)*6));tr.bumpCd=0.3}
  // tyres rut loose fill and mud (deeper while they spin) and crush clods; they pick up mud there
  if((Math.abs(tr.v)>0.1||tr.spin>0.1)&&!bench.on){let r=false;for(const w of wheels){const u=w.userData,wx=tr.x+u.lx*cy+u.lz*sy,wz=tr.z-u.lx*sy+u.lz*cy;if(stampRut(wx,wz,tr.yaw,0.3,0.32,dt*(1+2*tr.spin)))r=true}
    if(r||mudAt(tr.x,tr.z)>0.3)tr.mud=Math.min(1,tr.mud+dt*0.08)}
  // tyres moving through puddles splash; spinning ones throw the water back
  if(!bench.on){const sv=Math.abs(tr.v)>tr.spin*3?tr.v:-(tr.gear<0?-1:1)*tr.spin*3;if(Math.abs(sv)>0.25)for(const w of wheels){const u=w.userData;splashMud(tr.x+u.lx*cy+u.lz*sy,tr.z-u.lx*sy+u.lz*cy,tr.yaw,sv,0.3,1,dt)}}
  // spinning or fast tyres throw mud off the back
  if(mudN>RUT_MUD&&(tr.spin>0.05||Math.abs(tr.v)>1)&&!bench.on)for(const w of wheels){const u=w.userData;if(u.lz>0)continue;const wx=tr.x+u.lx*cy+u.lz*sy,wz=tr.z-u.lx*sy+u.lz*cy;
    flingMud(wx,hAt(wx,wz)+0.3,wz,tr.yaw+(tr.gear<0?Math.PI:0),2+6*tr.spin+Math.abs(tr.v)*0.6,(tr.spin*30+Math.min(4,Math.abs(tr.v))*2)*mudN,dt)}
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
  const hv=Math.max(tr.load,tr.stuck);heap.visible=hv>0.01;if(heap.visible){const f=hv/TU.trCap;tintLoad(heap.material,tr.loadC);heap.scale.set(0.55+0.45*Math.min(1,f*1.5),0.08+0.95*f,0.6+0.4*Math.min(1,f*1.5))}heap.position.y=0.12+0.5*heap.scale.y;
  truck.updateMatrixWorld(true);
  // tipping the bed pours the load out the back
  tr.pourRate=0;
  if(tr.bed>0.32&&tr.load>0.0005){
    const out=Math.min(tr.load,(tr.bed-0.32)*3.2*dt);tr.load-=out;sndIn.dump=out/dt;if(tr.load<0.0005){tr.load=0;tr.stuck=TU.trCap*0.025*(0.4+1.6*tr.loadMix[CLAY])*(1+2*tr.loadWet)}
    truck.localToWorld(tv.set(0,0.3,-4.9));tr.pourRate=out/dt;tr.pourP.copy(tv);
    if(mesaR(tv.x,tv.z)<EDGE-1.2&&Math.abs(tv.x)<S/2-0.8&&Math.abs(tv.z)<S/2-0.8){deposit(tv.x,tv.z,out,tr.loadC,tr.loadMix,dropSpread(tv.y-hAt(tv.x,tv.z)),tr.loadWet);st.dirty=true;st.slumpT=2.5}
    else{tr.hauled+=out;if(!tr.haulWarned&&tr.load<=0){tr.haulWarned=true;toast(say(mesaR(tv.x,tv.z)<EDGE-1.2?'dumpYard':'dumpOff'),'good')}}
    bedG.localToWorld(tv.set(0,0.4,0.2));for(let n=0;n<Math.ceil(out*40);n++)spawn(tv,1.2);
  }
  if(tr.load<TU.trCap*0.95)tr.fullWarned=false;
}
// a grey copy of a texture (mean 0.8, or mean) so what wears it keeps its own colour: the dirt for the bucket load and
// truck heap, which take any soil colour, and library textures for the blocks and boulders
function greyDetail(t,mean){try{const im=t.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;
  const x2=c.getContext('2d');x2.drawImage(im,0,0);const d=x2.getImageData(0,0,c.width,c.height),p=d.data;let sum=0;
  for(let i=0;i<p.length;i+=4)sum+=p[i]*0.3+p[i+1]*0.59+p[i+2]*0.11;const k=(mean||0.8)*255/(sum/(p.length/4));
  for(let i=0;i<p.length;i+=4){const l=Math.min(255,(p[i]*0.3+p[i+1]*0.59+p[i+2]*0.11)*k);p[i]=p[i+1]=p[i+2]=l}
  x2.putImageData(d,0,0);const g=new THREE.CanvasTexture(c);g.wrapS=g.wrapT=THREE.RepeatWrapping;return g}catch(e){return null}}
function tintLoad(mat,c){const k=mat.map?1.25:1;mat.color.setRGB(Math.min(1,c[0]*k),Math.min(1,c[1]*k),Math.min(1,c[2]*k))}
// called by main.js once every script has loaded (the images can finish before the later scripts arrive)
function applyTextures(){
  texOn=true;texMixU.value=gfxDetail;texBaseU.value=gfxBase;
  for(const mt of [ORANGE,ORANGE_D,STEEL,STEEL_L,RUBBER,WHITE,WHITE_DS,BEDM,BED_D]){mt.map=texGrime;mt.needsUpdate=true}
  const grey=greyDetail(texDirt);heap.material.map=grey;heap.material.needsUpdate=true;
  ORANGE.color.setHex(0xf27a22);ORANGE_D.color.setHex(0xc85e1c);
  loadMesh.material.map=grey;loadMesh.material.needsUpdate=true;
  pMat.map=texDirt;pMat.color.setHex(0xc26330);pMat.needsUpdate=true;
  matTexUpdate();
  // concrete blocks wear the poured concrete texture and boulders the bedrock (materials.js), brightened back to their colours
  const lib=(id,mean,mt)=>new THREE.TextureLoader().load(`textures/${id}.jpg`,t=>{const g=greyDetail(t,mean);if(!g)return;
    g.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());mt.map=g;mt.color.setScalar(1/mean);mt.needsUpdate=true});
  lib('concrete',0.85,blkMesh.material);lib('granite',0.8,assetIMs.rock[0].material);
}
