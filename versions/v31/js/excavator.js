// Backhoe Dig: the excavator: tracks, house, cab, boom, stick, bucket, linkage, rams and hoses.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- machine ----------
const ORANGE=M(0xe8701d),ORANGE_D=M(0xb8561a),STEEL=M(0x2b2d2c),STEEL_L=M(0x55595a),CHROME=M(0xc9ccc8,{shininess:60}),RUBBER=M(0x1b1c1b),REDL=M(0xd0281c,{emissive:0x400804}),AMBER=M(0xffa21a,{emissive:0x402400}),HOSE=M(0x141414,{shininess:20}),LENS=M(0xfff6d8,{emissive:0x554a30});
function box(w,h,d,mat,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function cyl(rt,rb,h,seg,mat,parent){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);m.castShadow=true;parent.add(m);return m}
function pinX(r,len,mat,parent,y,z){const m=cyl(r,r,len,32,mat,parent);m.rotation.z=Math.PI/2;m.position.set(0,y,z);return m}
function edges(w,h,parent,mat,y0,z0,y1,z1){const dy=y1-y0,dz=z1-z0,L=Math.hypot(dy,dz),th=-Math.atan2(dy,dz),c=Math.cos(th),sn=Math.sin(th);
  for(const ox of [-w/2,w/2])for(const oy of [-h/2,h/2]){const e=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,L*0.97,1,1,6),mat);
    e.rotation.set(th,0,Math.PI/4);e.position.set(ox,(y0+y1)/2+oy*c,(z0+z1)/2+oy*sn);e.castShadow=true;parent.add(e)}}
function beam(w,h,parent,mat,y0,z0,y1,z1){const dy=y1-y0,dz=z1-z0,L=Math.hypot(dy,dz);const m=box(w,h,L,mat,0,(y0+y1)/2,(z0+z1)/2,parent);m.rotation.x=-Math.atan2(dy,dz);return m}
const machine=new THREE.Group(); scene.add(machine);
machine.rotation.order='YXZ';
// undercarriage
for(const s of [-1,1]){
  const X=1.05*s;
  box(0.56,0.46,3.0,STEEL,X,0.4,0,machine);
  box(0.2,0.3,2.6,STEEL_L,X-0.3*s,0.45,0,machine);
  for(const z of [-1.55,1.55]){const w=cyl(0.34,0.34,0.58,48,STEEL_L,machine);w.rotation.z=Math.PI/2;w.position.set(X,0.4,z);
    const hub=cyl(0.14,0.14,0.62,28,STEEL,machine);hub.rotation.z=Math.PI/2;hub.position.set(X,0.4,z);
    if(z<0)for(let t=0;t<16;t++){const an=t/16*Math.PI*2;const th=box(0.6,0.07,0.08,STEEL,X,0.4+Math.sin(an)*0.37,z+Math.cos(an)*0.37,machine);th.rotation.x=-an}}
  for(let i=0;i<5;i++){const r=cyl(0.14,0.14,0.6,28,STEEL_L,machine);r.rotation.z=Math.PI/2;r.position.set(X,0.2,-1.0+i*0.5)}
  for(let i=0;i<2;i++){const r=cyl(0.1,0.1,0.3,28,STEEL_L,machine);r.rotation.z=Math.PI/2;r.position.set(X,0.66,-0.6+i*1.2)}
  for(let z=-1.5;z<=1.51;z+=0.11){box(0.66,0.07,0.09,RUBBER,X,0.78,z,machine);box(0.66,0.07,0.09,RUBBER,X,0.02,z,machine);box(0.66,0.04,0.025,RUBBER,X,0.835,z,machine);box(0.66,0.04,0.025,RUBBER,X,-0.035,z,machine)}
  for(const e of [-1,1])for(let a=-6;a<=6;a++){const ang=a*0.22;
    const p=box(0.66,0.07,0.09,RUBBER,X,0.4+Math.sin(ang)*0.38,e*(1.55+Math.cos(ang)*0.38),machine);
    p.rotation.x=Math.atan2(e*Math.cos(ang),Math.sin(ang))}
}
box(1.5,0.42,2.4,STEEL_L,0,0.55,0,machine);
for(const s of [-1,1])for(let i=0;i<8;i++){const b=cyl(0.03,0.03,0.04,8,STEEL,machine);b.rotation.z=Math.PI/2;b.position.set(1.36*s,0.5,-1.2+i*0.34)}
const ring=cyl(0.95,0.95,0.14,64,STEEL,machine);ring.position.y=0.8;
// house
const house=new THREE.Group(); house.position.y=0.85; machine.add(house);
box(2.5,0.85,2.2,ORANGE,0,0.43,0,house);
box(0.62,0.3,0.55,ORANGE_D,0.42,0.35,1.35,house);
const cw=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,0.9,64,4,false,Math.PI/2,Math.PI),ORANGE_D);
cw.scale.z=0.55;cw.position.set(0,0.47,-1.1);cw.castShadow=true;house.add(cw);
box(1.4,0.3,1.3,ORANGE,0.5,1.0,-0.55,house);
for(let i=0;i<18;i++){box(0.02,0.015,0.9,STEEL,1.26,0.4+i*0.025,-0.55,house);box(0.02,0.015,0.7,STEEL,-1.26,0.4+i*0.025,-0.65,house)}
for(const x of [-0.9,0.9]){box(0.22,0.1,0.05,REDL,x,0.62,-1.6,house);box(0.08,0.1,0.05,AMBER,x*0.72,0.62,-1.66,house)}
for(const x of [-0.6,0.6]){const ey=cyl(0.06,0.06,0.04,16,STEEL,house);ey.rotation.x=Math.PI/2;ey.position.set(x,0.95,-1.3)}
for(const z of [-0.9,-0.3,0.3,0.9])box(0.03,0.6,0.02,ORANGE_D,1.255,0.45,z,house);
box(0.55,0.42,0.8,ORANGE,0.95,1.06,0.55,house);
const cap=cyl(0.17,0.17,0.08,28,STEEL,house);cap.position.set(0.95,1.3,0.75);
for(const x of [0.12,1.05]){box(0.04,0.04,1.2,ORANGE_D,x,1.4,-0.55,house);
  for(const z of [-1.05,-0.05])box(0.04,0.25,0.04,ORANGE_D,x,1.27,z,house)}
const ex=cyl(0.065,0.07,0.8,24,STEEL,house);ex.position.set(0.95,1.5,-0.7);
const exCap=cyl(0.08,0.08,0.05,24,STEEL_L,house);exCap.position.set(0.95,1.92,-0.7);
// cab
const cab=new THREE.Group(); cab.position.set(-0.72,0.85,0.4); house.add(cab);
for(const [x,z] of [[-0.45,-0.62],[0.45,-0.62],[-0.45,0.62],[0.45,0.62]])box(0.07,1.55,0.07,STEEL,x,0.78,z,cab);
box(1.12,0.07,1.5,ORANGE,0,1.57,0.02,cab);
box(1.0,0.05,1.3,STEEL,0,1.52,0,cab);
box(0.94,0.05,0.05,STEEL,0,0.7,0.62,cab);
box(0.05,0.05,1.2,STEEL,-0.45,0.7,0,cab);
box(0.94,0.35,0.05,ORANGE_D,0,0.18,0.62,cab);
for(let i=0;i<5;i++)box(0.03,0.03,1.36,STEEL,-0.36+i*0.18,1.64,0.02,cab);
for(const x of [-0.52,0.52])box(0.04,0.07,1.42,STEEL,x,1.64,0.02,cab);
const wiper=box(0.018,0.6,0.018,STEEL,0.12,0.98,0.645,cab);wiper.rotation.z=0.45;
for(const y of [0.55,1.0]){const gh=cyl(0.018,0.018,0.42,12,STEEL,cab);gh.position.set(-0.51,y+0.21,0.6)}
box(0.14,0.03,0.03,STEEL,-0.48,0.85,-0.2,cab);box(0.3,0.04,0.25,STEEL,-0.25,-0.1,0.5,cab);
const glass=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.45,1.24),new THREE.MeshPhongMaterial({color:0x8fb4c8,transparent:true,opacity:0.3,shininess:80}));
glass.position.y=0.78; cab.add(glass);
box(0.5,0.12,0.5,STEEL,0,0.42,-0.15,cab); box(0.5,0.55,0.12,STEEL,0,0.72,-0.4,cab);
for(const x of [-0.33,0.33]){box(0.16,0.3,0.4,STEEL_L,x,0.42,0.0,cab);const j=cyl(0.025,0.025,0.16,10,STEEL,cab);j.position.set(x,0.64,0.08)}
const lamp=cyl(0.07,0.09,0.1,28,STEEL,cab);lamp.rotation.x=Math.PI/2;lamp.position.set(0.3,1.66,0.6);
const lens=cyl(0.06,0.06,0.02,28,LENS,cab);lens.rotation.x=Math.PI/2;lens.position.set(0.3,1.66,0.66);
const lamp2=cyl(0.07,0.09,0.1,28,STEEL,cab);lamp2.rotation.x=Math.PI/2;lamp2.position.set(-0.3,1.66,0.6);
const lens2=cyl(0.06,0.06,0.02,28,LENS,cab);lens2.rotation.x=Math.PI/2;lens2.position.set(-0.3,1.66,0.66);
box(0.03,0.03,0.45,STEEL,-0.62,1.1,0.75,cab).rotation.y=0.6;
const mirror=cyl(0.15,0.15,0.03,48,STEEL,cab);mirror.rotation.set(Math.PI/2,0,0.5);mirror.position.set(-0.78,1.12,0.95);
const mGlass=cyl(0.13,0.13,0.01,48,M(0x9aa9b4,{shininess:90}),cab);mGlass.rotation.set(Math.PI/2,0,0.5);mGlass.position.set(-0.77,1.12,0.97);
// boom (bent)
const L1=4.2,L2=2.6,L3=1.1;
const boomP=new THREE.Group(); boomP.position.set(0.42,1.0,0.95); house.add(boomP);
box(0.5,0.45,0.5,ORANGE_D,0,-0.1,0.0,boomP);
beam(0.42,0.5,boomP,ORANGE,0,0,0.6,2.0);edges(0.42,0.5,boomP,ORANGE,0,0,0.6,2.0);
beam(0.38,0.46,boomP,ORANGE,0.6,2.0,0,L1);edges(0.38,0.46,boomP,ORANGE,0.6,2.0,0,L1);
box(0.44,0.3,0.4,ORANGE_D,0,0.62,2.0,boomP);
beam(0.46,0.36,boomP,ORANGE_D,0.05,0.3,0.55,1.85);beam(0.42,0.32,boomP,ORANGE_D,0.55,2.15,0.05,L1-0.3);
beam(0.44,0.08,boomP,ORANGE,0.31,0,0.86,2.0);beam(0.4,0.08,boomP,ORANGE,0.83,2.0,0.23,L1);
pinX(0.11,0.56,STEEL,boomP,0,0); pinX(0.1,0.5,STEEL,boomP,0,L1); pinX(0.08,0.62,STEEL,boomP,0.15,1.9);box(0.3,0.36,0.34,ORANGE_D,0,0.3,1.9,boomP); pinX(0.08,0.36,STEEL,boomP,0.85,1.6);box(0.22,0.3,0.34,ORANGE_D,0,0.72,1.6,boomP);
const stickP=new THREE.Group(); stickP.position.z=L1; boomP.add(stickP);
beam(0.32,0.4,stickP,ORANGE,0,-0.55,0,L2);edges(0.32,0.4,stickP,ORANGE,0,-0.55,0,L2);
box(0.36,0.2,0.5,ORANGE_D,0,0.26,-0.35,stickP);
beam(0.36,0.26,stickP,ORANGE_D,0,-0.3,0,L2-0.3);beam(0.34,0.06,stickP,ORANGE,0.23,-0.5,0.23,L2);
pinX(0.08,0.42,STEEL,stickP,0.35,-0.5); pinX(0.07,0.4,STEEL,stickP,0,L2); pinX(0.07,0.36,STEEL,stickP,0.34,0.25);box(0.22,0.22,0.3,ORANGE_D,0,0.25,0.25,stickP);
// bucket: curved shell + profiled side plates
const bucketP=new THREE.Group(); bucketP.position.z=L2; stickP.add(bucketP);
const shellPt=t=>[L3*t,0.2*Math.sin(Math.PI*t)-0.04*t];
const SEG=32;
for(let i=0;i<SEG;i++){const a=shellPt(i/SEG),b=shellPt((i+1)/SEG);beam(0.92,0.06,bucketP,STEEL_L,a[1],a[0],b[1],b[0])}
const shape=new THREE.Shape();
shape.moveTo(0,0);for(let i=1;i<=SEG;i++){const p=shellPt(i/SEG);shape.lineTo(p[0],p[1])}
shape.lineTo(L3*0.92,-0.22);shape.lineTo(L3*0.62,-0.5);shape.lineTo(L3*0.2,-0.58);shape.lineTo(0.02,-0.45);shape.lineTo(0,0);
const sideGeo=new THREE.ExtrudeGeometry(shape,{depth:0.05,bevelEnabled:false});sideGeo.rotateY(-Math.PI/2);
for(const x of [0.49,-0.44]){const m=new THREE.Mesh(sideGeo,STEEL_L);m.position.x=x;m.castShadow=true;bucketP.add(m)}
box(0.92,0.06,0.06,STEEL,0,-0.04,L3,bucketP);
for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.ConeGeometry(0.055,0.24,4),STEEL);t.rotation.x=Math.PI/2;t.position.set(-0.36+i*0.18,-0.05,L3+0.12);t.castShadow=true;bucketP.add(t)}
for(const x of [-0.12,0.12])box(0.04,0.3,0.36,STEEL,x,0.14,0.22,bucketP);
for(const x of [-0.3,0,0.3])for(let i=1;i<6;i++){const a=shellPt(i/7),b=shellPt((i+1)/7);beam(0.05,0.035,bucketP,STEEL,a[1]+0.045,a[0],b[1]+0.045,b[0]).position.x=x}
for(const x of [-0.49,0.49])box(0.04,0.22,0.26,STEEL,x,-0.12,L3-0.06,bucketP);
pinX(0.055,0.3,STEEL,bucketP,0.22,0.25);
const loadMesh=new THREE.Mesh(new THREE.DodecahedronGeometry(0.42,2),M(0x6b4426));
loadMesh.position.set(0,-0.3,0.55); loadMesh.visible=false; bucketP.add(loadMesh);
const tipMark=new THREE.Object3D(); tipMark.position.set(0,-0.02,L3+0.18); bucketP.add(tipMark);
const midMark=new THREE.Object3D(); midMark.position.set(0,-0.3,0.55); bucketP.add(midMark);
// bucket linkage: two side links from the stick and an H-link to the bucket meet where the bucket ram pushes
const unitBox=new THREE.BoxGeometry(1,1,1);
function linkMesh(w,h,mat,parent){const lm=new THREE.Mesh(unitBox,mat);lm.scale.set(w,h,1);lm.castShadow=true;parent.add(lm);return lm}
function setLink(lm,y0,z0,y1,z1,x){const dy=y1-y0,dz=z1-z0;lm.position.set(x||0,(y0+y1)/2,(z0+z1)/2);lm.rotation.x=-Math.atan2(dy,dz);lm.scale.z=Math.max(0.01,Math.hypot(dy,dz))}
const LS=new THREE.Vector3(0,0.05,L2-0.42),LB=new THREE.Vector3(0,0.22,0.25),LR1=0.46,LR2=0.42;
const jointJ=new THREE.Object3D();stickP.add(jointJ);
const sideL=[linkMesh(0.05,0.12,STEEL,stickP),linkMesh(0.05,0.12,STEEL,stickP)];
const hLink=linkMesh(0.3,0.11,ORANGE_D,stickP);
const jPin=pinX(0.06,0.48,STEEL,stickP,0,0);
pinX(0.06,0.46,STEEL,stickP,LS.y,LS.z);
const tBk=new THREE.Vector3();
function updateLinkage(){
  tBk.copy(LB).applyMatrix4(bucketP.matrix);
  const dy=tBk.y-LS.y,dz=tBk.z-LS.z,d=Math.max(1e-4,Math.hypot(dy,dz)),dd=Math.min(d,LR1+LR2-1e-3);
  const aa=(LR1*LR1-LR2*LR2+dd*dd)/(2*dd),hh=Math.sqrt(Math.max(0,LR1*LR1-aa*aa)),uy=dy/d,uz=dz/d,my=LS.y+uy*aa,mz=LS.z+uz*aa;
  const y1=my+uz*hh,z1=mz-uy*hh,y2=my-uz*hh,z2=mz+uy*hh,jy=y1>y2?y1:y2,jz=y1>y2?z1:z2;
  jointJ.position.set(0,jy,jz);jPin.position.set(0,jy,jz);
  setLink(sideL[0],LS.y,LS.z,jy,jz,0.2);setLink(sideL[1],LS.y,LS.z,jy,jz,-0.2);setLink(hLink,jy,jz,tBk.y,tBk.z,0);
}
// hydraulic rams that follow the joints
const rams=[],UPY=new THREE.Vector3(0,1,0),rA=new THREE.Vector3(),rB=new THREE.Vector3(),rD=new THREE.Vector3();
function ram(pa,a,pb,b,rb,rr,bl){
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(rb,rb,1,32,3),ORANGE_D),rod=new THREE.Mesh(new THREE.CylinderGeometry(rr,rr,1,32,3),CHROME);
  barrel.castShadow=rod.castShadow=true;scene.add(barrel);scene.add(rod);
  const eg=new THREE.IcosahedronGeometry(rb*1.15,3),ea=new THREE.Mesh(eg,STEEL),eb=new THREE.Mesh(eg,STEEL),gl=new THREE.Mesh(new THREE.CylinderGeometry(rb*1.2,rb*1.2,0.08,32),STEEL);
  scene.add(ea);scene.add(eb);scene.add(gl);
  rams.push({pa,a:new THREE.Vector3(...a),pb,b:new THREE.Vector3(...b),barrel,rod,bl,ea,eb,gl,wA:new THREE.Vector3(),wD:new THREE.Vector3(),cbl:bl});
}
ram(house,[0.2,0.35,1.55],boomP,[-0.25,0.15,1.9],0.1,0.055,1.2);
ram(house,[0.64,0.35,1.55],boomP,[0.25,0.15,1.9],0.1,0.055,1.2);
ram(boomP,[0,0.85,1.6],stickP,[0,0.35,-0.5],0.1,0.055,1.5);
ram(stickP,[0,0.34,0.25],jointJ,[0,0,0],0.08,0.045,1.0);
function updateRams(){
  for(const r of rams){
    r.pa.localToWorld(rA.copy(r.a));r.pb.localToWorld(rB.copy(r.b));
    rD.subVectors(rB,rA);const d=rD.length();rD.divideScalar(d);
    const bl=Math.min(r.bl,d*0.8);r.wA.copy(rA);r.wD.copy(rD);r.cbl=bl;
    r.barrel.quaternion.setFromUnitVectors(UPY,rD);r.rod.quaternion.copy(r.barrel.quaternion);
    r.barrel.position.copy(rA).addScaledVector(rD,bl/2);r.barrel.scale.y=bl;
    const rl=d-bl*0.5;r.rod.position.copy(rB).addScaledVector(rD,-rl/2);r.rod.scale.y=rl;
    r.ea.position.copy(rA);r.eb.position.copy(rB);r.gl.quaternion.copy(r.barrel.quaternion);r.gl.position.copy(rA).addScaledVector(rD,bl);
  }
}

// flexible hydraulic hoses: sagging tubes rebuilt every frame between moving fittings
const hoses=[],HS=32,HR=12,hT=new THREE.Vector3(),hN=new THREE.Vector3(),hBn=new THREE.Vector3(),hP=new THREE.Vector3(),hA=new THREE.Vector3(),hE=new THREE.Vector3(),hC=new THREE.Vector3(),hRef=new THREE.Vector3(1,0,0);
function wp(obj,x,y,z){const v=new THREE.Vector3(x,y,z);return out=>obj.localToWorld(out.copy(v))}
function rp(r,t){return out=>out.copy(r.wA).addScaledVector(r.wD,t<0?r.cbl+t:t)}
function hose(fa,fb,sag,rad){
  const nv=(HS+1)*HR,pa=new Float32Array(nv*3),idx=[];
  for(let i=0;i<HS;i++)for(let j=0;j<HR;j++){const a=i*HR+j,b=i*HR+(j+1)%HR;idx.push(a,a+HR,b,b,a+HR,b+HR)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pa,3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(nv*3),3));g.setIndex(idx);
  const hm=new THREE.Mesh(g,HOSE);hm.castShadow=true;hm.frustumCulled=false;scene.add(hm);
  hoses.push({fa,fb,sag,rad:rad||0.032,g,pa});
}
function updateHoses(){
  for(const h of hoses){
    h.fa(hA);h.fb(hE);const L=hA.distanceTo(hE);
    hC.addVectors(hA,hE).multiplyScalar(0.5);hC.y-=h.sag*L;
    for(let i=0;i<=HS;i++){const t=i/HS,u=1-t;
      hP.set(u*u*hA.x+2*u*t*hC.x+t*t*hE.x,u*u*hA.y+2*u*t*hC.y+t*t*hE.y,u*u*hA.z+2*u*t*hC.z+t*t*hE.z);
      hT.set(u*(hC.x-hA.x)+t*(hE.x-hC.x),u*(hC.y-hA.y)+t*(hE.y-hC.y),u*(hC.z-hA.z)+t*(hE.z-hC.z)).normalize();
      hN.crossVectors(hT,hRef);if(hN.lengthSq()<1e-4)hN.crossVectors(hT,UPY);hN.normalize();hBn.crossVectors(hT,hN);
      const rr=h.rad*(t<0.05||t>0.95?1.55:1);for(let j=0;j<HR;j++){const an=j/HR*Math.PI*2,c=Math.cos(an)*rr,sn=Math.sin(an)*rr,o=(i*HR+j)*3;
        h.pa[o]=hP.x+hN.x*c+hBn.x*sn;h.pa[o+1]=hP.y+hN.y*c+hBn.y*sn;h.pa[o+2]=hP.z+hN.z*c+hBn.z*sn}
    }
    h.g.attributes.position.needsUpdate=true;
  }
}
// boom rams: feed and return lines from the house front
hose(wp(house,0.24,0.78,1.12),rp(rams[0],0.15),0.3);hose(wp(house,0.16,0.62,1.12),rp(rams[0],-0.08),0.35);
hose(wp(house,0.60,0.78,1.12),rp(rams[1],0.15),0.3);hose(wp(house,0.68,0.62,1.12),rp(rams[1],-0.08),0.35);
// main trunk lines up to the boom bend, then along the boom top
for(const x of [-0.07,0.07]){
  hose(wp(house,0.42+x,0.95,1.1),wp(boomP,x,0.88,1.95),0.32);
  hose(wp(boomP,x,0.88,2.05),wp(boomP,x,0.31,L1-0.28),-0.02,0.03);
  hose(wp(boomP,x,0.31,L1-0.28),wp(stickP,x*1.4,0.25,0.15),-0.18,0.03);
}
// stick ram and bucket ram feeds
hose(wp(boomP,0.1,0.86,2.12),rp(rams[2],0.2),0.15);hose(wp(boomP,-0.1,0.86,2.12),rp(rams[2],-0.1),0.2);
hose(wp(stickP,0.1,0.25,0.15),rp(rams[3],0.15),0.12);hose(wp(stickP,-0.1,0.25,0.15),rp(rams[3],-0.08),0.15);

// merge each part's fixed pieces into one mesh per material (hundreds of draw calls down to a few dozen)
function mergeStatic(group,skip){
  const buckets=new Map();
  for(const c of [...group.children]){
    if(!c.isMesh||skip.includes(c))continue;
    c.updateMatrix();
    let g=c.geometry.clone(); if(g.index)g=g.toNonIndexed();
    g.applyMatrix4(c.matrix);
    const b=buckets.get(c.material)||[];b.push(g);buckets.set(c.material,b);
    group.remove(c);
  }
  for(const [mat,list] of buckets){
    let n=0;for(const g of list)n+=g.attributes.position.count;
    const P=new Float32Array(n*3),Nm=new Float32Array(n*3);let o=0;
    for(const g of list){P.set(g.attributes.position.array,o*3);Nm.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;g.dispose()}
    const UV=new Float32Array(n*2);
    for(let v=0;v<n;v+=3){let ax=0,ay=0,az=0;for(let q=0;q<3;q++){ax+=Math.abs(Nm[(v+q)*3]);ay+=Math.abs(Nm[(v+q)*3+1]);az+=Math.abs(Nm[(v+q)*3+2])}
      for(let q=0;q<3;q++){const o=(v+q)*3,x=P[o],y=P[o+1],z=P[o+2];let u,w;
        if(ax>=ay&&ax>=az){u=z;w=y}else if(ay>=az){u=x;w=z}else{u=x;w=y}
        UV[(v+q)*2]=u*0.9;UV[(v+q)*2+1]=w*0.9}}
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P,3));mg.setAttribute('normal',new THREE.BufferAttribute(Nm,3));mg.setAttribute('uv',new THREE.BufferAttribute(UV,2));
    const m=new THREE.Mesh(mg,mat);m.castShadow=true;group.add(m);
  }
}
[machine,house,cab,boomP,stickP,bucketP].forEach(g=>mergeStatic(g,[glass,loadMesh,sideL[0],sideL[1],hLink,jPin]));
