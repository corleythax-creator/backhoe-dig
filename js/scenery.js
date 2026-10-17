// Backhoe Dig: lake, mountains, grass tufts, outer ground, gas main, stakes and trees.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- scenery ----------
const timeU={value:0};
(function(){
  // lake: low-poly water with gentle animated swells
  const wg=new THREE.PlaneGeometry(2600,2600,120,120);wg.rotateX(-Math.PI/2);
  const wm=new THREE.MeshPhongMaterial({color:0x1f5d72,specular:0xfff2dc,shininess:90,flatShading:true,envMap:skyEnv,combine:THREE.MixOperation,reflectivity:0.7});
  wm.onBeforeCompile=sh=>{sh.uniforms.uTime=timeU;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvec4 wpos=modelMatrix*vec4(transformed,1.0);\ntransformed.y+=sin(wpos.x*0.09+uTime*1.1)*0.35+cos(wpos.z*0.11+uTime*0.8)*0.3+sin((wpos.x+wpos.z)*0.23+uTime*1.7)*0.12;')};
  const water=new THREE.Mesh(wg,wm);water.position.y=WATER;water.receiveShadow=true;scene.add(water);
  // two mountain layers far across the lake: a lit front range, and pale hazy peaks behind it
  function range(R0,R1,NR,NA,lo,hi,hazeA,hazeB,phase,unlit){
    const pp=[],cc=[],ix=[],hz=[0.75,0.82,0.87];
    for(let ri=0;ri<=NR;ri++)for(let ai=0;ai<=NA;ai++){
      const t=ri/NR,r=R0+(R1-R0)*Math.pow(t,0.85),a=ai/NA*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r;
      const env=ss(0,0.3,t)*(1-0.5*ss(0.8,1,t)),side=0.5+0.5*Math.sin(a+2.4+phase);
      const n=(1-Math.abs(Math.sin(a*7+r*0.013+phase)))*0.5+(1-Math.abs(Math.sin(a*17+r*0.031+1.3+phase)))*0.3+(1-Math.abs(Math.sin(a*37-r*0.05+2.1)))*0.2;
      const hh=env*(0.45+0.55*side)*(lo+hi*n*n);
      pp.push(x,WATER-6+hh,z);
      const f=hh/(lo+hi),j=hash(ri*3.3+phase,ai*1.7)*0.06;let c;
      if(f<0.08)c=[0.26,0.4,0.26];else if(f<0.3)c=[0.18+j,0.32+j,0.22];else if(f<0.56+j)c=[0.46+j,0.44+j,0.43+j];else c=[0.95,0.96,0.98];
      const hk=hazeA+(hazeB-hazeA)*t;cc.push(c[0]+(hz[0]-c[0])*hk,c[1]+(hz[1]-c[1])*hk,c[2]+(hz[2]-c[2])*hk);
    }
    for(let ri=0;ri<NR;ri++)for(let ai=0;ai<NA;ai++){const q=ri*(NA+1)+ai;ix.push(q,q+1,q+NA+1,q+1,q+NA+2,q+NA+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(pp.length),3));g.setIndex(ix);
    const mat=unlit?new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide,toneMapped:false})
      :new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,fog:false,side:THREE.DoubleSide,shininess:2,specular:0x000000,emissive:0x6a7686});
    const m=new THREE.Mesh(g,mat);m.renderOrder=-0.5;scene.add(m);
  }
  range(470,820,40,220,30,240,0.42,0.66,0,false);
  range(860,1220,28,200,60,430,0.7,0.85,1.7,true);
})();
// grass tufts that disappear wherever the ground gets dug or buried
const TUFTS=9000,tX=new Float32Array(TUFTS),tZ=new Float32Array(TUFTS),tS=new Float32Array(TUFTS),tR=new Float32Array(TUFTS),tI=new Int32Array(TUFTS),tJ=new Int32Array(TUFTS);
const tuftGeo=(function(){const bp=[];for(let b=0;b<4;b++){const a=b*1.6+0.3,c=Math.cos(a),s=Math.sin(a),w=0.05,h=0.26+0.08*(b%2),ln=0.09;
  bp.push(-c*w,0,-s*w, c*w,0,s*w, -s*ln,h,c*ln)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));g.computeVertexNormals();
  // shaded at the root where the blades crowd together, sunlit at the tips
  g.setAttribute('color',new THREE.Float32BufferAttribute(bp.map((_,i)=>bp[i-i%3+1]>0?1.12:0.5),3));return g})();
const tufts=new THREE.InstancedMesh(tuftGeo,M(0xffffff,{side:THREE.DoubleSide,vertexColors:true}),TUFTS);tufts.receiveShadow=true;tufts.frustumCulled=false;scene.add(tufts);
(function(){const c=new THREE.Color();for(let n=0;n<TUFTS;n++){let gx,gz,q=0;do{gx=(Math.random()-0.5)*66;gz=-18+Math.random()*64}while((mesaR(gx,gz)>EDGE-0.8||roadAmt(gx,gz)>0.1)&&++q<60);
  tX[n]=gx;tZ[n]=gz;tS[n]=0.7+Math.random()*0.8;tR[n]=Math.random()*6.3;
  tI[n]=Math.round((tX[n]+S/2)/CELL);tJ[n]=Math.round((tZ[n]+S/2)/CELL);if(tI[n]<0||tI[n]>N||tJ[n]<0||tJ[n]>N){tI[n]=-1;tJ[n]=-1}
  const v=Math.random();c.setRGB(0.27+0.1*v,0.48+0.12*v,0.2+0.05*v);if(Math.random()<0.08)c.setRGB(0.62,0.58,0.3);tufts.setColorAt(n,c)}})();
const tO=new THREE.Object3D();
function updateTufts(i0,i1,j0,j1){
  for(let n=0;n<TUFTS;n++){const i=tI[n],j=tJ[n];if(i<0)continue;if(i<i0||i>i1||j<j0||j>j1)continue;const k=j*V+i;
    if(Math.abs(H[k]-H0[k])>0.04){tufts.setMatrixAt(n,ZERO_M);continue}
    tO.position.set(tX[n],hAt(tX[n],tZ[n])-0.02,tZ[n]);tO.rotation.set(0,tR[n],0);tO.scale.setScalar(tS[n]);tO.updateMatrix();tufts.setMatrixAt(n,tO.matrix)}
  tufts.instanceMatrix.needsUpdate=true;
}
const ZERO_M=new THREE.Matrix4().makeScale(0,0,0);
for(let n=0;n<TUFTS;n++){tO.position.set(tX[n],hAt(tX[n],tZ[n])-0.02,tZ[n]);tO.rotation.set(0,tR[n],0);tO.scale.setScalar(tS[n]);tO.updateMatrix();tufts.setMatrixAt(n,tO.matrix)}
// coarse 1 m ground outside the dig zone (the zone is cut out of it)
(function(){
  const SO=320,NO=160,CO=SO/NO,VO=NO+1,pp=[],cc=[],ix=[];
  const rk=[];
  for(let j=0;j<VO;j++)for(let i=0;i<VO;i++){const x=i*CO-SO/2,z=j*CO-SO/2,n=hash(i*7.1,j*5.3),h=baseHeight(x,z);pp.push(x,h,z);
    const sl=(Math.abs(baseHeight(x+1,z)-baseHeight(x-1,z))+Math.abs(baseHeight(x,z+1)-baseHeight(x,z-1)))/2;
    const rock=ss(0.55,1.1,sl),sand=1-ss(WATER+0.6,WATER+2.8,h),low=ss(-4,-20,h);
    let r=0.30+0.08*n+0.05*low,g=0.50+0.09*n-0.02*low,b=0.24+0.04*n;
    const strata=0.06*Math.sin(h*1.4+n);
    r+=(0.50+0.06*n+strata-r)*rock;g+=(0.44+0.05*n+strata-g)*rock;b+=(0.38+0.04*n+strata-b)*rock;
    r+=(0.80-r)*sand;g+=(0.72-g)*sand;b+=(0.52-b)*sand;
    const rc=[r,g,b],ra=roadTint(x,z,rc,n);cc.push(rc[0],rc[1],rc[2]);rk.push(Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9)))}
  for(let j=0;j<NO;j++)for(let i=0;i<NO;i++){const x0=i*CO-SO/2,z0=j*CO-SO/2;
    if(x0>=-S/2&&x0+CO<=S/2&&z0>=-S/2&&z0+CO<=S/2)continue;const a=j*VO+i;ix.push(a,a+VO,a+1,a+1,a+VO,a+VO+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(pp.length),3));g.setIndex(ix);
  g.setAttribute('dirt',new THREE.Float32BufferAttribute(rk,1));g.setAttribute('wetT',new THREE.Float32BufferAttribute(new Float32Array(rk.length).fill(-1e4),1));
  const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;scene.add(m);
  // skirt hides any hairline gap where the fine and coarse grids meet
  const sp=[],si=[];let q=0;const st=0.5,E=S/2;
  const run=(fx,fz)=>{for(let t=-E;t<E-1e-6;t+=st){const [x0,z0]=fx(t),[x1,z1]=fx(t+st),h0=baseHeight(x0,z0),h1=baseHeight(x1,z1);
    sp.push(x0,h0,z0,x1,h1,z1,x0,h0-0.6,z0,x1,h1-0.6,z1);si.push(q,q+2,q+1,q+1,q+2,q+3);q+=4}};
  run(t=>[t,-E]);run(t=>[t,E]);run(t=>[-E,t]);run(t=>[E,t]);
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sg.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(sp.length),3));sg.setIndex(si);
  scene.add(new THREE.Mesh(sg,M(0x4a6a34,{side:THREE.DoubleSide})));
})();
const pipe=new THREE.Mesh(new THREE.CylinderGeometry(PIPE_R,PIPE_R,24,36,4),M(0xf2c21a,{shininess:30}));
pipe.rotation.z=Math.PI/2; pipe.position.set(0,PIPE_Y,PIPE_Z); scene.add(pipe);
function stake(x,z,flagColor){
  const g=new THREE.Group(),y=baseHeight(x,z);
  const post=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.8,0.04),M(0xd9c9a3)); post.position.y=0.4; g.add(post);
  const flag=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.15,0.01),M(flagColor)); flag.position.set(0.12,0.72,0); g.add(flag);
  g.position.set(x,y,z); scene.add(g);
}
[[0.8,TRENCH_Z0-0.3],[-0.8,TRENCH_Z0-0.3],[0.8,TRENCH_Z1+0.3],[-0.8,TRENCH_Z1+0.3]].forEach(p=>stake(p[0],p[1],0xf2f2ee));
[[-3,PIPE_Z],[3,PIPE_Z],[-7,PIPE_Z],[7,PIPE_Z]].forEach(p=>stake(p[0],p[1],0xf5c518));
(function trees(){
  function colorize(g,fn){if(g.index)g=g.toNonIndexed();const p=g.attributes.position,c=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const col=fn(p.getX(i),p.getY(i),p.getZ(i));c[i*3]=col[0];c[i*3+1]=col[1];c[i*3+2]=col[2]}
    g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
  function mergeGeos(list){let n=0;for(const g of list)n+=g.attributes.position.count;
    const P=new Float32Array(n*3),Nn=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
    for(const g of list){P.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count}
    const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(Nn,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));return m}
  const BARK=[0.36,0.25,0.17];
  // pine: five drooping tiers with ragged skirts, darker underneath, lighter toward the tip
  const pine=[];
  const pt=new THREE.CylinderGeometry(0.09,0.19,1.7,12,2);pt.translate(0,0.85,0);pine.push(colorize(pt,()=>BARK));
  const TOP=5.9;
  for(let t=0;t<5;t++){
    const r=1.5*(1-t*0.17),h=1.65-t*0.08,base=0.85+t*0.92;
    const g=new THREE.ConeGeometry(r,h,24,3,true),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const y=p.getY(i);
      if(Math.abs(y+h/2)<1e-4){const j=Math.round((Math.atan2(p.getZ(i),p.getX(i))+Math.PI)/(Math.PI*2)*24),o=j%2?1.14:0.9;
        p.setX(i,p.getX(i)*o);p.setZ(i,p.getZ(i)*o);p.setY(i,y-(j%2?0.18:0))}}
    g.translate(0,base+h/2,0);
    pine.push(colorize(g,(x,y,z)=>{const f=Math.min(1,y/TOP),e=Math.min(1,Math.hypot(x,z)/r),k=0.72+0.28*f;
      return[(0.12+0.1*f)*k+0.03*e,(0.30+0.18*f)*k+0.05*e,(0.16+0.06*f)*k]}));
    const cap=new THREE.CircleGeometry(r*0.95,24);cap.rotateX(Math.PI/2);cap.translate(0,base+0.03,0);pine.push(colorize(cap,()=>[0.07,0.17,0.09]));
  }
  const pineGeo=mergeGeos(pine);
  // broadleaf: trunk and branches, plus a lumpy crown tinted per tree (autumn golds, oranges, greens)
  const lw=[];
  const lt=new THREE.CylinderGeometry(0.1,0.18,2.1,10,2);lt.translate(0,1.05,0);lw.push(colorize(lt,()=>BARK));
  for(const [ang,len,rot] of [[0.75,1.1,0],[-0.7,1.0,1.2],[0.6,0.9,2.6]]){const br=new THREE.CylinderGeometry(0.045,0.08,len,8);br.translate(0,len/2,0);br.rotateZ(ang);br.rotateY(rot);br.translate(0,1.5,0);lw.push(colorize(br,()=>BARK))}
  const woodGeo=mergeGeos(lw);
  const crown=[];
  for(const [x,y,z,r] of [[0,3.1,0,1.3],[0.95,2.65,0.2,0.95],[-0.9,2.6,-0.2,1.0],[0.2,2.45,0.95,0.9],[-0.15,2.6,-0.95,0.9],[0.1,3.85,0.05,0.85]]){
    const g=new THREE.IcosahedronGeometry(r,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const n=Math.sin(p.getX(i)*7.3+p.getY(i)*5.1+p.getZ(i)*3.7)*0.09;p.setXYZ(i,p.getX(i)*(1+n),p.getY(i)*(0.86+n),p.getZ(i)*(1+n))}
    g.translate(x,y,z);g.computeVertexNormals();
    crown.push(colorize(g,(px,py)=>{const k=0.62+0.38*Math.min(1,Math.max(0,(py-1.5)/3));return[k,k,k]}));
  }
  const crownGeo=mergeGeos(crown);
  const NP=170,NB=60,treeM=M(0xffffff,{vertexColors:true});
  const pines=new THREE.InstancedMesh(pineGeo,treeM,NP),woods=new THREE.InstancedMesh(woodGeo,treeM,NB),crowns=new THREE.InstancedMesh(crownGeo,treeM,NB);
  for(const im of [pines,woods,crowns]){im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false}
  // clustered placement in a ring around the work zone
  const spots=[];
  const okSpot=(x,z)=>{if(Math.abs(x)>116||Math.abs(z)>116)return false;const r=mesaR(x,z),h=baseHeight(x,z);
    if(r<EDGE-1.5)return r>EDGE-9.5&&r<ROAD_R-ROAD_W/2-1.6&&z>-2&&!(Math.abs(x)<14&&z<2)&&Math.hypot(x+7,z-1)>9;
    const sl=Math.abs(baseHeight(x+1,z)-h)+Math.abs(baseHeight(x,z+1)-h);return h>WATER+2.5&&sl<0.7};
  let guard=0;
  while(spots.length<NP+NB&&guard++<20000){const cx=(Math.random()-0.5)*230,cz=(Math.random()-0.5)*230,n=3+Math.floor(Math.random()*7);
    if(!okSpot(cx,cz))continue;
    for(let i=0;i<n&&spots.length<NP+NB;i++){const x=cx+(Math.random()-0.5)*10,z=cz+(Math.random()-0.5)*10;if(okSpot(x,z))spots.push([x,z])}}
  const o=new THREE.Object3D(),c=new THREE.Color();
  const PT=[[1,1,1],[0.85,0.95,1.06],[1.08,1.04,0.82],[0.92,0.98,0.9]],LT=[[0.98,0.78,0.26],[0.93,0.52,0.2],[0.56,0.64,0.3],[0.78,0.32,0.18],[0.46,0.6,0.28],[0.95,0.85,0.4]];
  let ip=0,ib=0;
  for(const [x,z] of spots){const s2=0.8+Math.random()*0.7,y=baseHeight(x,z);
    o.position.set(x,y-0.05,z);o.rotation.set((Math.random()-0.5)*0.08,Math.random()*6.3,(Math.random()-0.5)*0.08);
    if(ip<NP&&(ib>=NB||Math.random()<0.74)){o.scale.set(s2,s2*(0.9+Math.random()*0.35),s2);o.updateMatrix();pines.setMatrixAt(ip,o.matrix);
      const t=PT[Math.floor(Math.random()*PT.length)],v=0.88+Math.random()*0.24;c.setRGB(t[0]*v,t[1]*v,t[2]*v);pines.setColorAt(ip,c);ip++}
    else if(ib<NB){o.scale.set(s2,s2,s2);o.updateMatrix();woods.setMatrixAt(ib,o.matrix);crowns.setMatrixAt(ib,o.matrix);
      const t=LT[Math.floor(Math.random()*LT.length)],v=0.9+Math.random()*0.2;c.setRGB(t[0]*v,t[1]*v,t[2]*v);crowns.setColorAt(ib,c);c.setRGB(1,1,1);woods.setColorAt(ib,c);ib++}}
  pines.count=ip;woods.count=crowns.count=ib;scene.add(pines);scene.add(woods);scene.add(crowns);
})();
