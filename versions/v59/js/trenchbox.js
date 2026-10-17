// Backhoe Dig: the trench box: model, hooking to the bucket, setting it and the wall mask.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- trench box ----------
// a steel trench shield: two side panels held apart by spreaders at the ends. Hooked to the bucket it swings with the
// arm; set down in a cut it holds the walls between its panels, so they cannot slump or cave in (prot mask)
const BX_L=2.4,BX_W=1.1,BX_H=1.5,BOXM=M(0xd8a514),BOXD=M(0x3a3d3e);
const tbox=new THREE.Group();scene.add(tbox);
for(const sd of [-1,1]){const x=sd*BX_W/2;
  box(0.08,BX_H,BX_L,BOXM,x,BX_H/2,0,tbox);
  for(let z=-BX_L/2+0.2;z<=BX_L/2-0.19;z+=0.4)box(0.05,BX_H-0.12,0.07,BOXD,x+sd*0.06,BX_H/2,z,tbox);
  box(0.14,0.08,BX_L,BOXD,x,BX_H,0,tbox);box(0.14,0.08,BX_L,BOXD,x,0.04,0,tbox);
  for(const z of [-BX_L/2+0.12,BX_L/2-0.12])box(0.06,0.2,0.14,BOXD,x,BX_H+0.12,z,tbox)}
for(const z of [-BX_L/2+0.15,BX_L/2-0.15])for(const y of [0.35,BX_H-0.25]){const sp=cyl(0.06,0.06,BX_W,16,STEEL_L,tbox);sp.rotation.z=Math.PI/2;sp.position.set(0,y,z)}
mergeStatic(tbox,[]);
const chain=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1,6),BOXD);chain.visible=false;scene.add(chain);
const TB_START={x:2.8,z:-5.8,yaw:Math.PI},TB={x:0,z:0,y:0,ty:0,yaw:0,hooked:false,seated:false},prot=new Uint8Array(V*V),boxTop=new THREE.Vector3();
// the box rests on the highest ground under its centre line; a crossing gas main holds it up
function boxRest(){const s=Math.sin(TB.yaw),c=Math.cos(TB.yaw);let y=-1e9;
  for(let q=-4;q<=4;q++){const u=q/4*(BX_L/2-0.1);y=Math.max(y,hAt(TB.x+s*u,TB.z+c*u))}
  const za=TB.z-c*BX_L/2,zb=TB.z+c*BX_L/2;
  if(Math.abs(TB.x)<12&&Math.min(za,zb)-0.3<PIPE_Z&&Math.max(za,zb)+0.3>PIPE_Z)y=Math.max(y,PIPE_Y+PIPE_R+0.02);
  return y}
// grid vertices inside the panels, plus the wall band just outside them, are held while the box sits in a cut
function boxMask(){prot.fill(0);if(TB.hooked||!TB.seated)return;
  const s=Math.sin(TB.yaw),c=Math.cos(TB.yaw),n=Math.ceil(2/CELL),ci=Math.round((TB.x+S/2)/CELL),cj=Math.round((TB.z+S/2)/CELL);
  for(let j=Math.max(0,cj-n);j<=Math.min(N,cj+n);j++)for(let i=Math.max(0,ci-n);i<=Math.min(N,ci+n);i++){
    const dx=i*CELL-S/2-TB.x,dz=j*CELL-S/2-TB.z,u=dx*s+dz*c,v=dx*c-dz*s;
    if(Math.abs(u)<BX_L/2+0.15&&Math.abs(v)<BX_W/2+0.5)prot[j*V+i]=1}}
function boxNear(){return mode==='dig'&&tip.distanceTo(boxTop.set(TB.x,TB.y+BX_H,TB.z))<1.6}
function hookBox(){
  if(TB.hooked){TB.hooked=false;chain.visible=false;TB.ty=boxRest();TB.seated=h0At(TB.x,TB.z)-TB.ty>0.3;boxMask();
    toast(TB.seated?'Trench box set. The walls between its panels are safe.':'Box set down. Set it in a cut to hold the walls.','good',3000);return}
  if(!boxNear()){toast(mode==='dig'?'Bring the bucket over the box to hook it.':'Switch to Dig to handle the box.');return}
  TB.hooked=true;TB.seated=false;boxMask();chain.visible=true;
  toast(`Box hooked. Swing it over the trench and press ${padUsed?'X':kbUsed?'T':'Drop box'} to set it.`,'',3200)}
function updateBox(dt){
  if(TB.hooked){TB.x=tip.x;TB.z=tip.z;TB.yaw=st.yaw+st.swing;TB.y=TB.ty=Math.max(tip.y-0.45-BX_H,boxRest());
    boxTop.set(TB.x,TB.y+BX_H+0.15,TB.z);rD.subVectors(tip,boxTop);const d=Math.max(0.01,rD.length());
    chain.quaternion.setFromUnitVectors(UPY,rD.divideScalar(d));chain.position.copy(boxTop).addScaledVector(rD,d/2);chain.scale.y=d}
  else TB.y=Math.max(TB.ty,TB.y-4*dt);
  tbox.position.set(TB.x,TB.y,TB.z);tbox.rotation.y=TB.yaw}
$('#boxBtn').onclick=hookBox;
