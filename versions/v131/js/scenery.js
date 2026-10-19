// Corley's Island: lake, mountains, field grass, outer ground, gas main, stakes and trees.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- scenery ----------
const timeU={value:0};
(function(){
  // lake: low-poly water with gentle animated swells
  const wg=new THREE.PlaneGeometry(3400,3400,150,150);wg.rotateX(-Math.PI/2);
  const wm=new THREE.MeshPhongMaterial({color:0x1f5d72,specular:0xfff2dc,shininess:90,flatShading:true,envMap:skyEnv,combine:THREE.MixOperation,reflectivity:0.7});
  wm.onBeforeCompile=sh=>{sh.uniforms.uTime=timeU;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvec4 wpos=modelMatrix*vec4(transformed,1.0);\ntransformed.y+=sin(wpos.x*0.09+uTime*1.1)*0.16+cos(wpos.z*0.11+uTime*0.8)*0.13+sin((wpos.x+wpos.z)*0.23+uTime*1.7)*0.06;')};
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
  range(790,1080,40,220,30,240,0.42,0.66,0,false);
  range(1080,1320,28,200,60,430,0.7,0.85,1.7,true);
})();
// ---------- field grass ----------
// clumps over the mesa that disappear wherever the ground gets dug, buried or painted. Four kinds on two shapes: meadow
// grass (also the dry straw clumps) and seed-head grass, low broadleaf weeds and wildflowers. They grow in patches with bare-ish ground
// between, in little clusters: lush and green down on the flats, dry and straw coloured up the slopes and hilltops,
// seed heads in drifts and along the roads and yards, flowers in drifts of one colour
const TUFTS=15000,tX=new Float32Array(TUFTS),tZ=new Float32Array(TUFTS),tS=new Float32Array(TUFTS),tR=new Float32Array(TUFTS),tI=new Int32Array(TUFTS),tJ=new Int32Array(TUFTS),
  tK=new Uint8Array(TUFTS),tGone=new Uint8Array(TUFTS),tVis=new Uint8Array(TUFTS),tH=new Float32Array(TUFTS),tMi=new Uint16Array(TUFTS),tSl=new Int32Array(TUFTS);
// smooth value noise, 0 to 1, about one feature per unit
function tuftNoise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
// the two shapes (flat shaded, coloured per vertex: dark down in the clump, sunlit and a little yellower at the tips).
// aHead marks seed and flower heads (1), which take their colour from the clump's aTuft instead of its green, and their
// stalks (2); clumps without heads (aTuft.y below 0) fold both away
const TUFT_GEO=(function(){
  function build(f){const P=[],C=[],A=[],I=[];
    // one blade arching over from (rx,rz) along angle a: base quad then a tip, 3 triangles
    const blade=(rx,rz,a,h,lean,w,tw,hv)=>{const ca=Math.cos(a),sa=Math.sin(a),v=[],c=[];
      for(const [t,wf,k] of [[0,1,0.68],[0.5,0.72,0.9],[1,0,1.15]]){const o=lean*Math.pow(t,1.7),cx=rx+ca*o,cz=rz+sa*o,y=h*t*(1-0.18*t*lean/h),
          ta=a+Math.PI/2+tw*t,px=Math.cos(ta)*w*wf,pz=Math.sin(ta)*w*wf,col=[k*(1+0.1*hv+0.08*t),k*(1+0.04*hv),k*(1-0.12*hv-0.14*t)];
        if(wf>0){v.push([cx-px,y,cz-pz],[cx+px,y,cz+pz]);c.push(col,col)}else{v.push([cx,y,cz]);c.push(col)}}
      const o=A.length;for(let q=0;q<5;q++){P.push(...v[q]);C.push(...c[q]);A.push(0)}for(const q of [0,1,3,0,3,2,2,3,4])I.push(o+q)};
    const tri=(v,c,hd)=>{for(let q=0;q<3;q++){I.push(A.length);P.push(...v[q]);C.push(...c[q]);A.push(hd)}};
    f(blade,tri);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
    g.setAttribute('aHead',new THREE.Float32BufferAttribute(A,1));g.setIndex(I);g.computeVertexNormals();return g}
  const R=Math.random,grass=(bl,n,hh)=>{for(let b=0;b<n;b++){const a=b*6.28/n+R()*0.6,ra=0.01+R()*0.035;
    bl(Math.cos(a+1.9)*ra,Math.sin(a+1.9)*ra,a,hh*(0.55+0.45*R()),0.05+R()*0.13,0.02+R()*0.012,(R()-0.5)*1.2,R()*2-1)}};
  // a seed stalk to height h leaning along a, with a narrow straw head (aHead) at the top
  const stalk=(tri,a,h)=>{const ca=Math.cos(a),sa=Math.sin(a),lx=ca*h*0.12,lz=sa*h*0.12,ws=0.005,hw=0.016,hy=h*0.78,st=[0.5,0.55,0.32],hd=[1,1,1],hl=[0.8,0.8,0.8];
    tri([[-sa*ws,0,ca*ws],[sa*ws,0,-ca*ws],[lx,h,lz]],[st,st,st],2);
    tri([[lx*0.78,hy,lz*0.78],[lx*0.9+sa*hw,h*0.89,lz*0.9-ca*hw],[lx*0.9-sa*hw,h*0.89,lz*0.9+ca*hw]],[hl,hd,hd],1);
    tri([[lx*0.9-sa*hw,h*0.89,lz*0.9+ca*hw],[lx*0.9+sa*hw,h*0.89,lz*0.9-ca*hw],[lx*1.04,h*1.02,lz*1.04]],[hd,hd,hd],1)};
  // a flat leaf lying out from the root along a, tipped up a little (2 triangles)
  const leaf=(tri,a,l,w,up)=>{const ca=Math.cos(a),sa=Math.sin(a),r=[0.62,0.66,0.6],m=[0.92,0.95,0.86],t=[1.05,1.08,0.95];
    const L=[ca*l*0.55-sa*w,up*0.6+0.01,sa*l*0.55+ca*w],Rr=[ca*l*0.55+sa*w,up*0.6+0.01,sa*l*0.55-ca*w],T=[ca*l,up,sa*l],O=[0,0.012,0];
    tri([O,L,T],[r,m,t],0);tri([O,T,Rr],[r,t,m],0)};
  return [
    // grass: five blades, and two stalks gone to seed (21 triangles)
    build((bl,tri)=>{grass(bl,5,0.34);for(let b=0;b<2;b++)stalk(tri,b*3.1+R()*0.8,0.5+R()*0.18)}),
    // broadleaf: a rosette of six leaves close to the ground, and a stem with a four-petal flower facing up (17 triangles)
    build((bl,tri)=>{for(let b=0;b<6;b++)leaf(tri,b*1.047+R()*0.3,0.11+R()*0.06,0.035+R()*0.012,0.03+R()*0.04);
      const h=0.36+R()*0.08,hx=0.03,st=[0.45,0.55,0.32],hc=[1,1,1],ce=[0.75,0.7,0.5],r=0.065;
      tri([[-0.006,0,0],[0.006,0,0],[hx,h,0]],[st,st,st],2);
      for(let q=0;q<4;q++){const a0=q*1.571,a1=a0+1.571,y=h+0.006;
        tri([[hx,h+0.012,0],[hx+Math.cos(a0)*r,y,Math.sin(a0)*r],[hx+Math.cos(a1)*r,y,Math.sin(a1)*r]],[ce,hc,hc],1)}})]})();
const TUFT_KINDS=TUFT_GEO.length;
// per shape: how far out it is still drawn, as a share of the Graphics setting's distances (small things go first)
const TUFT_KR=[1,0.65];
// the clumps sit in 32 m squares, one instanced mesh per square and shape, so squares out of view or far away are skipped
const TC_X0=-48,TC_Z0=-19,TC_W=32,TC_NX=3,TC_NZ=3;
// thinning with distance, set each frame from the Graphics setting by tuftLod: share drawn up close, near and far
// distances (m) and the share still drawn far off. Each clump has a rank (aTuft.x): it shrinks away as the share drops
// below its rank, and the ones left grow a little to fill in
const tuftMats=TUFT_GEO.map(()=>{const mat=M(0xffffff,{side:THREE.DoubleSide,vertexColors:true}),thin={value:new THREE.Vector4(1,25,80,0.35)};
  mat.userData.thin=thin;
  mat.onBeforeCompile=sh=>{sh.uniforms.uTime=timeU;sh.uniforms.uThin=thin;sh.uniforms.uSun={value:SUN_DIR};sh.uniforms.uPush=lawnPush;
    sh.uniforms.tCrush={value:crTex};sh.uniforms.uCrO={value:new THREE.Vector4(CR_X0,CR_Z0,1/(CR_NX*CR_C),1/(CR_NZ*CR_C))};Object.assign(sh.uniforms,wetU);
    sh.vertexShader='uniform float uTime;\nuniform vec4 uThin;\nuniform vec4 uPush[5];\nuniform sampler2D tCrush;\nuniform vec4 uCrO;\nuniform sampler2D tWet;\nuniform vec4 uWetO;\nattribute vec4 aTuft;\nattribute float aHead;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.vertexShader
      .replace('#include <color_vertex>','vColor=vec3(1.0);\n#ifdef USE_COLOR\nvColor*=color;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvColor*=mix(instanceColor,aTuft.yzw,step(0.5,aHead)*step(aHead,1.5));\n#endif')
      .replace('#include <project_vertex>',
      '#ifdef USE_INSTANCING\nvec3 root=instanceMatrix[3].xyz;\n#else\nvec3 root=vec3(0.0);\n#endif\n'+
      'float fs=uThin.x*(uThin.w+(1.0-uThin.w)*(1.0-smoothstep(uThin.y,uThin.z,distance(root,cameraPosition))));\n'+
      'vec4 mvPosition=vec4(transformed*clamp((fs-aTuft.x)/0.08,0.0,1.0)*(1.0+0.6*(1.0-fs/uThin.x))*(1.0-step(0.5,aHead)*step(aTuft.y,-0.5)),1.0);\n'+
      '#ifdef USE_INSTANCING\nmvPosition=instanceMatrix*mvPosition;\n#endif\n'+
      // the same gusts as the tall grass (mower.js), so the whole mesa moves together
      'float hg=max(0.0,mvPosition.y-root.y);vec2 wd=vec2(0.8,0.6);\n'+
      // trampled (grassCrush): laid over the way the wheels went, paler where the undersides show; and in the wet
      // (rain.js) the blades hang heavier and darker. Read per vertex where the GPU can (nearly all), else left out
      (WET_VTX?'vec4 cr=texture2D(tCrush,(root.xz-uCrO.xy)*uCrO.zw);float fla=smoothstep(0.0,0.5,cr.r);vec2 cd=vec2(sin(cr.g*6.2832),cos(cr.g*6.2832));\n'+
        'float wet=texture2D(tWet,(root.xz-uWetO.xy)*uWetO.zw).r;\n':'float fla=0.0,wet=0.0;vec2 cd=vec2(0.0);\n')+
      'float gust=pow(0.5+0.5*sin(dot(root.xz,wd)*0.42-uTime*1.9+1.5*sin(dot(root.xz,vec2(-0.6,0.8))*0.11+uTime*0.23)),3.0);\n'+
      'float fl=sin(uTime*5.3+root.x*2.1+root.z*1.7)*0.5+sin(uTime*3.1+root.x*1.7-root.z*1.1)*0.5;\n'+
      'mvPosition.xz+=wd*hg*hg*(0.25+1.1*gust+0.2*fl+0.4*wet)*(1.0-fla);mvPosition.y-=hg*hg*(0.4*gust+0.5*wet)*(1.0-fla);\n'+
      'mvPosition.xz+=cd*hg*0.9*fla;mvPosition.y-=hg*0.8*fla;\n'+
      // and it leans away from the machines and the worker (uPush, set by updateMower)
      'for(int m=0;m<5;m++){vec2 d=root.xz-uPush[m].xy;float l=length(d),f=(1.0-smoothstep(uPush[m].z*0.55,uPush[m].z+0.35,l))*(1.0-fla);\n'+
      'if(f>0.0){mvPosition.xz+=d/max(l,0.05)*hg*0.9*f;mvPosition.y-=hg*0.6*f;}}\n'+
      'vColor*=(1.0+0.18*gust*smoothstep(0.05,0.3,hg)*(1.0-fla))*mix(vec3(1.0),vec3(1.3,1.22,0.78),fla)*(1.0-0.22*wet);\n'+
      'vLW=mvPosition.xyz;vTip=smoothstep(0.03,0.3,hg);\n'+
      'mvPosition=modelViewMatrix*mvPosition;\ngl_Position=projectionMatrix*mvPosition;');
    // looking toward the sun the blades glow where light comes through them
    sh.fragmentShader='uniform vec3 uSun;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\nfloat bl=pow(max(0.0,dot(normalize(vLW-cameraPosition),uSun)),3.0);\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.0,1.15,0.4)*bl*vTip*0.9;')};
  return mat});
// all the meshes, in a group so the speed test can hide them together; tuftMeshes[(square)*shapes+shape]
const tufts=new THREE.Group(),tuftMeshes=[];scene.add(tufts);
(function(){const DRY=[0.68,0.6,0.33],FLW=[[1,0.84,0.18],[0.97,0.96,0.9],[0.66,0.44,0.86],[1,0.84,0.18]],col=new Float32Array(TUFTS*3),hd=new Float32Array(TUFTS*3);
  const bad=(x,z)=>mesaR(x,z)>EDGE-0.8||roadAmt(x,z)>0.1||yardAt(x,z)>0.3||wallAt(x,z)||paintAt(x,z);
  // where clumps grow: patches every few metres, thinner on rocky slopes
  const dens=(x,z)=>ss(0.2,0.7,0.65*tuftNoise(x*0.17+3.1,z*0.17+7.3)+0.35*tuftNoise(x*0.6+11,z*0.6+5));
  let n=0;
  while(n<TUFTS){let x,z,q=0;do{x=(Math.random()-0.5)*94;z=-18+Math.random()*96}while((bad(x,z)||Math.random()>0.12+0.88*dens(x,z))&&++q<60);
    // a little cluster of one to four clumps
    const k=1+Math.floor(Math.pow(Math.random(),2)*4);
    for(let m=0;m<k&&n<TUFTS;m++){const a=Math.random()*6.3,r=m?0.12+Math.random()*0.3:0,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(m&&bad(px,pz))continue;
      const h=baseHeight(px,pz),sl=(Math.abs(baseHeight(px+1,pz)-baseHeight(px-1,pz))+Math.abs(baseHeight(px,pz+1)-baseHeight(px,pz-1)))/2;
      const dry=Math.min(1,ss(0.25,0.75,sl)+0.6*ss(3,9,h)+0.7*ss(0.62,0.85,tuftNoise(px*0.09+40,pz*0.09+2)));
      const edge=Math.max(1-ss(ROAD_W/2+0.4,ROAD_W/2+2.6,Math.abs(roadOff(px,pz))),ss(0.02,0.2,yardAt(px,pz)));
      const seedA=0.04+0.4*ss(0.6,0.82,tuftNoise(px*0.12+20,pz*0.12+9))+0.22*edge;
      const fd=ss(0.62,0.8,tuftNoise(px*0.1+70,pz*0.1+30))*(1-dry),flA=0.012+0.32*fd,bdA=0.06+0.12*(1-dry)*(1-edge);
      const u=Math.random(),kind=u<flA?3:u<flA+bdA?2:u<flA+bdA+seedA?1:0;
      tX[n]=px;tZ[n]=pz;tK[n]=kind>>1;tR[n]=Math.random()*6.3;
      tS[n]=(kind===2?0.75+Math.random()*0.6:kind===3?0.85+Math.random()*0.35:0.7+Math.random()*0.6)*(1+0.25*edge);
      // dry clumps lie lower
      const dk=kind<2&&Math.random()<0.06+0.6*dry;tH[n]=(0.8+Math.random()*0.45)*(dk?0.7:1);
      tI[n]=Math.round(gI(px));tJ[n]=Math.round(gJ(pz));if(tI[n]<0||tI[n]>N||tJ[n]<0||tJ[n]>N){tI[n]=-1;tJ[n]=-1}
      // the green of the ground, a touch deeper in the lush flats; dry clumps straw coloured
      const nv=Math.random(),lush=(1-dry)*0.15;
      let cr=(0.3+0.05*nv)*(1-lush),cg=(0.52+0.08*nv)*(1-lush*0.4),cb=(0.22+0.04*nv)*(1-lush);
      if(kind>=2){cr*=0.82;cg*=0.95;cb*=1.05}
      const da=dk?0.7+0.3*Math.random():kind<2?0.25*dry*Math.random():0;cr+=(DRY[0]-cr)*da;cg+=(DRY[1]-cg)*da;cb+=(DRY[2]-cb)*da;
      col[n*3]=cr;col[n*3+1]=cg;col[n*3+2]=cb;
      // seed heads straw to rust; a flower drift is all one colour (yellow, white or purple), with the odd stray
      const fl=FLW[Math.floor(hash(Math.floor(px/9),Math.floor(pz/9))*3.999)],hc=kind===3?(Math.random()<0.85?fl:FLW[Math.floor(Math.random()*3)]):[0.78+0.12*nv,0.76+0.06*nv,0.48-0.06*nv];
      hd[n*3]=kind&1?hc[0]:-1;hd[n*3+1]=hc[1];hd[n*3+2]=hc[2];n++}}
  // into the squares' meshes: count each, then give every clump a slot (in random order, so ranks spread evenly)
  const cnt=new Int32Array(TC_NX*TC_NZ*TUFT_KINDS);
  for(let n=0;n<TUFTS;n++){const cx=Math.min(TC_NX-1,Math.max(0,Math.floor((tX[n]-TC_X0)/TC_W))),cz=Math.min(TC_NZ-1,Math.max(0,Math.floor((tZ[n]-TC_Z0)/TC_W)));
    tMi[n]=(cz*TC_NX+cx)*TUFT_KINDS+tK[n];tSl[n]=cnt[tMi[n]]++}
  for(let m=0;m<cnt.length;m++){const k=m%TUFT_KINDS,sq=(m-k)/TUFT_KINDS,G=TUFT_GEO[k],g=new THREE.BufferGeometry();
    for(const a of ['position','color','normal','aHead'])g.setAttribute(a,G.attributes[a]);g.setIndex(G.index);
    const nn=Math.max(1,cnt[m]);g.setAttribute('aTuft',new THREE.InstancedBufferAttribute(new Float32Array(nn*4),4));
    const im=new THREE.InstancedMesh(g,tuftMats[k],nn);im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(nn*3),3);
    im.receiveShadow=true;im.count=cnt[m];im.visible=cnt[m]>0;
    // the square, with room for the hills and the clumps' height
    const x0=TC_X0+(sq%TC_NX)*TC_W,z0=TC_Z0+Math.floor(sq/TC_NX)*TC_W;let lo=1e9,hi=-1e9;
    for(let j=0;j<=8;j++)for(let i=0;i<=8;i++){const y=baseHeight(x0+i*TC_W/8,z0+j*TC_W/8);lo=Math.min(lo,y);hi=Math.max(hi,y)}
    g.boundingSphere=new THREE.Sphere(new THREE.Vector3(x0+TC_W/2,(lo+hi)/2,z0+TC_W/2),Math.hypot(TC_W/2,TC_W/2,(hi-lo)/2+1.5));
    im.userData.cx=x0+TC_W/2;im.userData.cz=z0+TC_W/2;im.userData.n=cnt[m];im.userData.k=k;tuftMeshes.push(im);tufts.add(im)}
  for(let n=0;n<TUFTS;n++){const im=tuftMeshes[tMi[n]],s=tSl[n],A=im.geometry.attributes.aTuft.array,C=im.instanceColor.array;
    A[s*4]=(s+0.5)/im.userData.n;A[s*4+1]=hd[n*3];A[s*4+2]=hd[n*3+1];A[s*4+3]=hd[n*3+2];for(let e=0;e<3;e++)C[s*3+e]=col[n*3+e]}})();
const tO=new THREE.Object3D(),tuftDirty=new Set();
// clump n standing on the ground (a slight random tilt each), or hidden
// (shorter while it grows back from a mowing, tuftCutK)
function tuftPut(n,show){const im=tuftMeshes[tMi[n]];tuftDirty.add(im);tVis[n]=show?1:0;
  if(!show){im.setMatrixAt(tSl[n],ZERO_M);return}
  const s=tS[n];tO.position.set(tX[n],hAt(tX[n],tZ[n])-0.02,tZ[n]);tO.rotation.set((hash(n,1.7)-0.5)*0.24,tR[n],(hash(n,4.3)-0.5)*0.24);tO.scale.set(s,s*tH[n]*tuftCutK(n),s);
  tO.updateMatrix();im.setMatrixAt(tSl[n],tO.matrix)}
function tuftFlush(){for(const im of tuftDirty)im.instanceMatrix.needsUpdate=true;tuftDirty.clear()}
function updateTufts(i0,i1,j0,j1){
  for(let n=0;n<TUFTS;n++){const i=tI[n],j=tJ[n];if(i<0)continue;if(i<i0||i>i1||j<j0||j>j1)continue;const k=j*V+i;
    tuftPut(n,!(Math.abs(H[k]-H0[k])>0.04||paintAt(tX[n],tZ[n])))}
  tuftFlush();
}
const ZERO_M=new THREE.Matrix4().makeScale(0,0,0);
// after the map editor reshapes, repaints or lays a road over an area (metres), or ruts or smooths the mud there: tufts
// follow the ground and keep off dirt, roads, steep ground and ruts (tGone: under the tall grass, mower.js)
function tuftsRefresh(x0,x1,z0,z1){
  for(let n=0;n<TUFTS;n++){const x=tX[n],z=tZ[n];if(x<x0||x>x1||z<z0||z>z1||tGone[n])continue;const i=tI[n],k=tJ[n]*V+i;
    tuftPut(n,!((i>=0?Math.abs(H[k]-H0[k])>0.04:Math.abs(hAt(x,z)-baseHeight(x,z))>0.04)||yardAt(x,z)>0.3||roadAmt(x,z)>0.1||wallAt(x,z)||paintAt(x,z)))}
  tuftFlush()}
// ruts outside the dig zone (farRut, mud.js) mark the area here; the tufts there are checked a few times a second
let tuftFarBox=null,tuftFarT=0;
function tuftFarMark(x0,x1,z0,z1){const b=tuftFarBox;tuftFarBox=b?[Math.min(b[0],x0),Math.max(b[1],x1),Math.min(b[2],z0),Math.max(b[3],z1)]:[x0,x1,z0,z1]}
// every frame: each shape's thinning from the Graphics setting, and how many clumps each square draws (none when every
// clump in it would be shrunk away)
function tuftLod(){const g=typeof gfxCur!=='undefined'?gfxCur.tuft:[1,25,80,0.35],cx=camera.position.x,cz=camera.position.z;
  for(let k=0;k<TUFT_KINDS;k++)tuftMats[k].userData.thin.value.set(g[0],g[1]*TUFT_KR[k],g[2]*TUFT_KR[k],k?0:g[3]);
  for(const im of tuftMeshes){const k=im.userData.k,n=im.userData.n;if(!n)continue;
    const d=Math.hypot(Math.max(0,Math.abs(cx-im.userData.cx)-TC_W/2),Math.max(0,Math.abs(cz-im.userData.cz)-TC_W/2)),fl=k?0:g[3];
    const f=g[0]*(fl+(1-fl)*(1-ss(g[1]*TUFT_KR[k],g[2]*TUFT_KR[k],d)));
    im.count=Math.min(n,Math.ceil(f*n)+1);im.visible=f>0.002}}
// ---------- trampled grass ----------
// a 0.5 m grid over the field grass: how flat it is (0 standing, 1 laid flat) and which way it was pushed. Tracks and
// tyres lay it flat (stampRut, dirt.js), the mower's wheels nearly and the worker's feet partway; it springs back over
// about two and a half minutes, staying down for the first minute. The same on every device; not saved, since it stands
// back up so soon. The grass shader reads it from a small texture (r flatness, g direction)
const CR_X0=TC_X0,CR_Z0=TC_Z0,CR_C=0.5,CR_NX=TC_NX*TC_W/CR_C,CR_NZ=TC_NZ*TC_W/CR_C,CR_BACK=150;
const crA=new Float32Array(CR_NX*CR_NZ),crTex=new THREE.DataTexture(new Uint8Array(CR_NX*CR_NZ*4),CR_NX,CR_NZ,THREE.RGBAFormat);
crTex.needsUpdate=true;
let crOn=false,crT=0;
// press the grass in a footprint centred on x,z facing yaw (half width hw, half length hl, metres) toward cap, at rate a second
function grassCrush(x,z,yaw,hw,hl,rate,cap,dt){const s=Math.sin(yaw),c=Math.cos(yaw),R=Math.hypot(hw,hl)+CR_C/2,d=Math.round(((yaw/6.2832)%1+1)%1*255);
  const i0=Math.max(0,Math.floor((x-R-CR_X0)/CR_C)),i1=Math.min(CR_NX-1,Math.ceil((x+R-CR_X0)/CR_C)),j0=Math.max(0,Math.floor((z-R-CR_Z0)/CR_C)),j1=Math.min(CR_NZ-1,Math.ceil((z+R-CR_Z0)/CR_C));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=CR_X0+(i+0.5)*CR_C-x,dz=CR_Z0+(j+0.5)*CR_C-z;
    if(Math.abs(dx*s+dz*c)>hl+CR_C/2||Math.abs(dx*c-dz*s)>hw+CR_C/2)continue;const k=j*CR_NX+i;if(crA[k]>=cap)continue;
    crA[k]=Math.min(cap,crA[k]+rate*dt);crTex.image.data[k*4+1]=d;crOn=true}}
// four times a second: the grass springs back, and the texture follows; tufts in fresh ruts go
function grassTick(dt){crT+=dt;if(tuftFarBox&&timeU.value-tuftFarT>0.3){tuftFarT=timeU.value;tuftsRefresh(...tuftFarBox);tuftFarBox=null}
  if(crT<0.25)return;const st=crT;crT=0;if(!crOn)return;let any=false;const a=crTex.image.data;
  for(let k=0;k<crA.length;k++){if(crA[k]<=0)continue;crA[k]=Math.max(0,crA[k]-st/CR_BACK);a[k*4]=Math.round(crA[k]*255);any=true}
  crOn=any;crTex.needsUpdate=true}
function grassReset(){crA.fill(0);crTex.image.data.fill(0);crTex.needsUpdate=true;crOn=false}
// ---------- mowed field grass ----------
// the mower cuts the field grass too: on the same 0.5 m grid, each cell remembers when it was last cut (fcT, on the lawn
// clock, mower.js), and its clumps stand at stubble height, then grow back on the tall grass's timing (TU.lawnWait, then
// TU.lawnGrow). Saved with the mowing (lawnSave), so it syncs. The clumps in each cell, for the mower to find:
// tuftsInCell(k) are tCellL[tCellS[k]] up to tCellS[k+1]
const fcT=new Float32Array(CR_NX*CR_NZ).fill(-1e9),fcAct=[],fcIn=new Uint8Array(CR_NX*CR_NZ),tCell=new Int32Array(TUFTS),tCellS=new Int32Array(CR_NX*CR_NZ+1),tCellL=new Int32Array(TUFTS);
// how tall each shape stands at full size (m): the grass with its seed stalks, the broadleaf with its flower
const TUFT_HK=[0.45,0.42];
{for(let n=0;n<TUFTS;n++){const i=Math.floor((tX[n]-CR_X0)/CR_C),j=Math.floor((tZ[n]-CR_Z0)/CR_C);tCell[n]=i<0||j<0||i>=CR_NX||j>=CR_NZ?-1:j*CR_NX+i;if(tCell[n]>=0)tCellS[tCell[n]+1]++}
  for(let k=0;k<CR_NX*CR_NZ;k++)tCellS[k+1]+=tCellS[k];const at=tCellS.slice(0,-1);for(let n=0;n<TUFTS;n++)if(tCell[n]>=0)tCellL[at[tCell[n]]++]=n}
// a clump's height (share of full): cut down to the deck's height, then growing back
function tuftCutK(n){const k=tCell[n];if(k<0||fcT[k]<-1e8)return 1;
  const g=Math.min(1,Math.max(0,(lawn.t-fcT[k]-TU.lawnWait)/TU.lawnGrow)),stub=Math.min(1,TU.lawnCut/(TUFT_HK[tK[n]]*tS[n]*tH[n]));return stub+(1-stub)*g}
function fcRedraw(k){for(let q=tCellS[k];q<tCellS[k+1];q++){const n=tCellL[q];if(tVis[n])tuftPut(n,true)}}
// the deck centred on x,z facing yaw (half width hw, half depth hd) cuts what stands in it; returns how many tall clumps it cut
function fieldCut(x,z,yaw,hw,hd){const s=Math.sin(yaw),c=Math.cos(yaw),R=Math.hypot(hw,hd)+CR_C/2;let cut=0;
  const i0=Math.max(0,Math.floor((x-R-CR_X0)/CR_C)),i1=Math.min(CR_NX-1,Math.floor((x+R-CR_X0)/CR_C)),j0=Math.max(0,Math.floor((z-R-CR_Z0)/CR_C)),j1=Math.min(CR_NZ-1,Math.floor((z+R-CR_Z0)/CR_C));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*CR_NX+i;if(tCellS[k]===tCellS[k+1])continue;
    const dx=CR_X0+(i+0.5)*CR_C-x,dz=CR_Z0+(j+0.5)*CR_C-z;if(Math.abs(dx*c-dz*s)>hw||Math.abs(dx*s+dz*c)>hd)continue;
    // only grass grown back past halfway counts as a cut (and restarts the clock)
    if(fcT[k]>-1e8&&lawn.t-fcT[k]<TU.lawnWait+TU.lawnGrow*0.5)continue;
    for(let q=tCellS[k];q<tCellS[k+1];q++)if(tVis[tCellL[q]])cut++;
    fcT[k]=lawn.t;if(!fcIn[k]){fcIn[k]=1;fcAct.push(k)}fcRedraw(k)}
  if(cut){tuftFlush();lawn.sDirty=true}return cut}
// once a second: the cut cells grow, and drop off the list when fully grown
let fcGrowT=0;
function fieldGrow(dt){if(!fcAct.length||(fcGrowT-=dt)>0)return;fcGrowT=1;
  for(let q=fcAct.length-1;q>=0;q--){const k=fcAct[q];fcRedraw(k);if(lawn.t-fcT[k]>=TU.lawnWait+TU.lawnGrow){fcT[k]=-1e9;fcIn[k]=0;fcAct[q]=fcAct[fcAct.length-1];fcAct.pop()}}
  tuftFlush()}
// the save: cells still growing, 3 bytes each (cell, low and high byte; then age as a share of the regrowth, 1-255)
function fieldSave(){const b=new Uint8Array(fcAct.length*3);let m=0;
  for(const k of fcAct){const a=lawn.t-fcT[k];if(a>=TU.lawnWait+TU.lawnGrow)continue;b[m++]=k&255;b[m++]=k>>8;b[m++]=1+Math.round(Math.max(0,a)/(TU.lawnWait+TU.lawnGrow)*254)}
  let bin='';for(let q=0;q<m;q++)bin+=String.fromCharCode(b[q]);return btoa(bin)}
function fieldLoad(str){if(typeof str!=='string')return;let b;try{b=atob(str)}catch(e){return}
  for(let q=0;q+2<b.length;q+=3){const k=b.charCodeAt(q)|b.charCodeAt(q+1)<<8;if(k>=fcT.length)continue;
    fcT[k]=lawn.t-(b.charCodeAt(q+2)-1)/254*(TU.lawnWait+TU.lawnGrow);if(!fcIn[k]){fcIn[k]=1;fcAct.push(k)}fcRedraw(k)}
  tuftFlush()}
// every clump stands up at the start
for(let n=0;n<TUFTS;n++)tuftPut(n,true);tuftFlush();
// ground outside the dig zone: 0.5 m over the rest of the mesa and its cliffs (hills, the scarp and the ramp need it),
// 2 m beyond; each patch has a hole where the finer one sits
const MID=[-58,58,-32,92];
// a ground vertex's colour into c (rgb array), and its dirt-texture amount: grass (darker down on the meadows), rock on
// steep ground, sand at the lake, the yards and the roads, and any painted material (how much covers it into c[3])
function groundColor(x,z,h,c){const n=hash(x*3.55+0.3,z*2.65+0.7);
  const sl=(Math.abs(baseHeight(x+1,z)-baseHeight(x-1,z))+Math.abs(baseHeight(x,z+1)-baseHeight(x,z-1)))/2;
  const rock=ss(0.55,1.1,sl),sand=1-ss(WATER+1.6,WATER+2.4,h),low=ss(-4,-20,h)*ss(EDGE-1,EDGE+2,mesaR(x,z));
  let r=0.30+0.08*n+0.05*low,g=0.50+0.09*n-0.02*low,b=0.24+0.04*n;
  // the mainland's hayfield, mown in rows, and the darker woods floor
  const hf=mainField(x,z),wf=mainWoods(x,z);
  if(hf>0){const st=0.5+0.5*Math.sin(z*0.9);r+=(0.58+0.08*st+0.04*n-r)*hf;g+=(0.55+0.05*st-g)*hf;b+=(0.28-b)*hf}
  if(wf>0){r-=0.1*wf;g-=0.12*wf;b-=0.05*wf}
  const strata=0.06*Math.sin(h*1.4+n);
  r+=(0.50+0.06*n+strata-r)*rock;g+=(0.44+0.05*n+strata-g)*rock;b+=(0.38+0.04*n+strata-b)*rock;
  r+=(0.80-r)*sand;g+=(0.72-g)*sand;b+=(0.52-b)*sand;
  c[0]=r;c[1]=g;c[2]=b;const ya=yardTint(x,z,c,n),ra=roadTint(x,z,c,n),mc=matTint(x,z,c);c[3]=mc;return Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9,ya*0.85))*(MAT_GL2?1:1-mc)}
let midPatch=null,skirtMesh=null;
// a ground mesh over a rectangle at CO metres, leaving out the cells inside any of the holes (where a finer mesh sits)
function groundPatch(X0,X1,Z0,Z1,CO,holes){
  const NX=Math.round((X1-X0)/CO),NZ=Math.round((Z1-Z0)/CO),VX=NX+1,pp=[],cc=[],ix=[],rk=[],ma=[],c=[0,0,0,0];
  for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const x=X0+i*CO,z=Z0+j*CO,h=baseHeight(x,z);pp.push(x,h,z);rk.push(groundColor(x,z,h,c));cc.push(c[0],c[1],c[2]);ma.push(c[3])}
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x0=X0+i*CO,z0=Z0+j*CO;
    if(holes.some(h=>x0>=h[0]-1e-6&&x0+CO<=h[1]+1e-6&&z0>=h[2]-1e-6&&z0+CO<=h[3]+1e-6))continue;const a=j*VX+i;ix.push(a,a+VX,a+1,a+1,a+VX,a+VX+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(pp.length),3));g.setIndex(ix);
  g.setAttribute('dirt',new THREE.Float32BufferAttribute(rk,1));g.setAttribute('wetT',new THREE.Float32BufferAttribute(new Float32Array(rk.length).fill(-1e4),1));g.setAttribute('soilD',new THREE.Float32BufferAttribute(new Float32Array(rk.length),1));g.setAttribute('matA',new THREE.Float32BufferAttribute(ma,1));
  const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;scene.add(m);
  return {g,m,X0,Z0,CO,VX,NX,NZ};
}
// the Family Island gets its own 1.5 m mesh (family.js)
const FAM_PATCH=[-111,111,136,352];
// 1 m over the rest of Corley's Island and its shore, round the 0.5 m mesh
const OUTER_MID=[-112,112,-122,94];
// the mainland (mainland.js): 4 m ground, with 1 m where each causeway lands
const MAIN_FINE=[[-42,42,-300,-196],[-42,42,480,600]];
groundPatch(-160,160,-160,160,2,[OUTER_MID,[FAM_PATCH[0],FAM_PATCH[1],FAM_PATCH[2],160]]);
midPatch=groundPatch(MID[0],MID[1],MID[2],MID[3],0.5,[[GX0,GX1,GZ0,GZ1]]);
const outPatch=groundPatch(OUTER_MID[0],OUTER_MID[1],OUTER_MID[2],OUTER_MID[3],1,[MID]);
buildSkirts();
// after the map editor reshapes or repaints an area (metres): the 0.5 m and 1 m ground there take the new heights and colours
function midUpdate(x0,x1,z0,z1){patchUpdate(midPatch,x0,x1,z0,z1);patchUpdate(outPatch,x0,x1,z0,z1)}
function patchUpdate(P,x0,x1,z0,z1){const g=P.g,pa=g.attributes.position,ca=g.attributes.color,da=g.attributes.dirt,ma=g.attributes.matA,c=[0,0,0,0];
  const i0=Math.max(0,Math.floor((x0-P.X0)/P.CO)),i1=Math.min(P.NX,Math.ceil((x1-P.X0)/P.CO)),j0=Math.max(0,Math.floor((z0-P.Z0)/P.CO)),j1=Math.min(P.NZ,Math.ceil((z1-P.Z0)/P.CO));
  if(i0>i1||j0>j1)return;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=j*P.VX+i,x=P.X0+i*P.CO,z=P.Z0+j*P.CO,h=baseHeight(x,z);
    pa.array[v*3+1]=h;da.array[v]=groundColor(x,z,h,c);ca.array[v*3]=c[0];ca.array[v*3+1]=c[1];ca.array[v*3+2]=c[2];ma.array[v]=c[3]}
  for(const [a,w] of [[pa,3],[ca,3],[da,1],[ma,1]]){a.updateRange.offset=j0*P.VX*w;a.updateRange.count=(j1-j0+1)*P.VX*w;a.needsUpdate=true}}
// skirts hide any hairline gap where a finer grid meets a coarser one; rebuilt when the editor reshapes the ground
function buildSkirts(){
  const sp=[],si=[];let q=0;
  const run=(fx,a0,a1,st,dp)=>{for(let t=a0;t<a1-1e-6;t+=st){const [x0,z0]=fx(t),[x1,z1]=fx(t+st),h0=baseHeight(x0,z0),h1=baseHeight(x1,z1);
    sp.push(x0,h0,z0,x1,h1,z1,x0,h0-dp,z0,x1,h1-dp,z1);si.push(q,q+2,q+1,q+1,q+2,q+3);q+=4}};
  run(t=>[t,GZ0],GX0,GX1,0.5,0.6);run(t=>[t,GZ1],GX0,GX1,0.5,0.6);run(t=>[GX0,t],GZ0,GZ1,0.5,0.6);run(t=>[GX1,t],GZ0,GZ1,0.5,0.6);
  run(t=>[t,OUTER_MID[2]],OUTER_MID[0],OUTER_MID[1],1,2);run(t=>[t,OUTER_MID[3]],OUTER_MID[0],OUTER_MID[1],1,2);run(t=>[OUTER_MID[0],t],OUTER_MID[2],OUTER_MID[3],1,2);run(t=>[OUTER_MID[1],t],OUTER_MID[2],OUTER_MID[3],1,2);
  for(const R of MAIN_FINE){run(t=>[t,R[2]],R[0],R[1],1,2);run(t=>[t,R[3]],R[0],R[1],1,2);run(t=>[R[0],t],R[2],R[3],1,2);run(t=>[R[1],t],R[2],R[3],1,2)}
  run(t=>[t,MID[2]],MID[0],MID[1],0.5,2);run(t=>[t,MID[3]],MID[0],MID[1],0.5,2);run(t=>[MID[0],t],MID[2],MID[3],0.5,2);run(t=>[MID[1],t],MID[2],MID[3],0.5,2);
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sg.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(sp.length),3));sg.setIndex(si);
  if(skirtMesh){skirtMesh.geometry.dispose();skirtMesh.geometry=sg}else{skirtMesh=new THREE.Mesh(sg,M(0x4a6a34,{side:THREE.DoubleSide}));scene.add(skirtMesh)}}
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
// the tree instance meshes, for shadowproxy.js
const treeIMs=[];
// placed assets (trees and boulders, and the things of props.js) as {t: type, x, z, yaw, s: size, c: tint}; the map editor moves, adds and removes them
const ASSET_CAP={pine:600,leafy:300,rock:400},assetIMs={},assets=mapAssets?mapAssets.slice():[];
const ASSET_PT=[[1,1,1],[0.85,0.95,1.06],[1.08,1.04,0.82],[0.92,0.98,0.9]],ASSET_LT=[[0.98,0.78,0.26],[0.93,0.52,0.2],[0.56,0.64,0.3],[0.78,0.32,0.18],[0.46,0.6,0.28],[0.95,0.85,0.4]];
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
  // boulder: a lumpy grey stone, lighter on top
  const rockGeo=(function(){const g=new THREE.IcosahedronGeometry(0.8,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+0.22*Math.sin(x*5.1+y*3.3)*Math.cos(z*4.7-y*2.1);p.setXYZ(i,x*n*1.15,y*n*0.62,z*n)}
    g.computeVertexNormals();return colorize(g,(x,y)=>{const k=0.62+0.3*Math.min(1,Math.max(0,(y+0.3)/0.8));return[0.62*k,0.6*k,0.56*k]})})();
  const treeM=M(0xffffff,{vertexColors:true});
  const pines=new THREE.InstancedMesh(pineGeo,treeM,ASSET_CAP.pine),woods=new THREE.InstancedMesh(woodGeo,treeM,ASSET_CAP.leafy),crowns=new THREE.InstancedMesh(crownGeo,treeM,ASSET_CAP.leafy),rocks=new THREE.InstancedMesh(rockGeo,M(0xffffff,{vertexColors:true}),ASSET_CAP.rock);
  // colour buffers sized to capacity up front (three r128 sizes them by the live count, which starts at 0 here)
  for(const im of [pines,woods,crowns,rocks]){im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(im.instanceMatrix.count*3),3);im.count=0;scene.add(im)}
  assetIMs.pine=[pines];assetIMs.leafy=[woods,crowns];assetIMs.rock=[rocks];treeIMs.push(pines,woods,crowns,rocks);
  if(!assets.length)assets.push(...defaultAssets());
  assetsBuild();
})();
// the default trees and boulders, the same every time (a seeded shuffle): clustered in a band inside the rim, round West
// Rise and on the meadows, clear of the roads, the yards, the scarp and the tall grass
function defaultAssets(){
  let sd=7;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  const okSpot=(x,z)=>{if(Math.abs(x)>116||Math.abs(z)>116)return false;const r=mesaR(x,z),h=baseHeight(x,z);
    if(r<EDGE-1.5){if(!(r>EDGE-9.5||Math.hypot(x+22,z-22)<7))return false;
      if(roadOff(x,z)<ROAD_W/2+1.6||yardAt(x,z)>0.05||(z<-2&&z>-38)||(Math.abs(x)<14&&z<2)||Math.hypot(x+7,z-1)<9||(x>-3&&x<17&&z>9&&z<25))return false;
      return Math.abs(baseHeight(x+1,z)-h)+Math.abs(baseHeight(x,z+1)-h)<0.5}
    const sl=Math.abs(baseHeight(x+1,z)-h)+Math.abs(baseHeight(x,z+1)-h);return h>WATER+2.5&&sl<0.7};
  const out=[];let guard=0,np=0,nb=0;
  while(np+nb<285&&guard++<20000){const cx=(rnd()-0.5)*230,cz=(rnd()-0.5)*230,n=3+Math.floor(rnd()*7);
    if(!okSpot(cx,cz))continue;
    for(let i=0;i<n&&np+nb<285;i++){const x=cx+(rnd()-0.5)*10,z=cz+(rnd()-0.5)*10;if(!okSpot(x,z))continue;
      const pine=np<210&&(nb>=75||rnd()<0.74);out.push({t:pine?'pine':'leafy',x,z,yaw:rnd()*6.3,s:0.8+rnd()*0.7,c:Math.floor(rnd()*(pine?4:6))});if(pine)np++;else nb++}}
  for(let n=0,g=0;n<18&&g<4000;g++){const x=(rnd()-0.5)*100,z=-20+rnd()*100;if(!okSpot(x,z))continue;out.push({t:'rock',x,z,yaw:rnd()*6.3,s:0.5+rnd()*0.9,c:0});n++}
  return out}
// fills the instance meshes from the asset list (after any change to it)
function assetsBuild(){const o=new THREE.Object3D(),c=new THREE.Color(),n={pine:0,leafy:0,rock:0};
  for(const a of assets){const k=n[a.t],y=baseHeight(a.x,a.z);if(k===undefined||k>=ASSET_CAP[a.t]||y<WATER-0.3)continue;n[a.t]++;
    const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    if(a.t==='rock'){o.position.set(a.x,y-0.18*a.s,a.z);o.rotation.set((w-0.5)*0.4,a.yaw,(w2-0.5)*0.4);o.scale.set(a.s,a.s*(0.8+0.4*w),a.s)}
    else{o.position.set(a.x,y-0.05,a.z);o.rotation.set((w-0.5)*0.08,a.yaw,(w2-0.5)*0.08);o.scale.set(a.s,a.s*(a.t==='pine'?0.9+0.35*w:1),a.s)}
    o.updateMatrix();for(const im of assetIMs[a.t])im.setMatrixAt(k,o.matrix);
    if(a.t==='pine'){const t=ASSET_PT[a.c%4],v=0.88+0.24*w2;c.setRGB(t[0]*v,t[1]*v,t[2]*v);assetIMs.pine[0].setColorAt(k,c)}
    else if(a.t==='leafy'){const t=ASSET_LT[a.c%6],v=0.9+0.2*w2;c.setRGB(t[0]*v,t[1]*v,t[2]*v);assetIMs.leafy[1].setColorAt(k,c);c.setRGB(1,1,1);assetIMs.leafy[0].setColorAt(k,c)}
    else{const v=0.85+0.3*w2;c.setRGB(v,v,v);assetIMs.rock[0].setColorAt(k,c)}}
  for(const t in assetIMs)for(const im of assetIMs[t]){im.count=n[t];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true}
  // the things placed from the editor's catalogue (props.js, which loads later)
  if(typeof propsBuild==='function')propsBuild()}
