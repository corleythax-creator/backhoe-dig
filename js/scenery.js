// Corley's Island: mountains, field grass, outer ground, gas main, stakes and trees.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- scenery ----------
const timeU={value:0};
// the mountain ranges' materials, dimmed at night by daynight.js (the simple ones, on Low), and the ranges themselves
const MTN_MATS=[],MTN_MESH=[];
(function(){
  // two mountain layers far across the lake: a lit front range, and pale hazy peaks behind it
  // (the front one is mtnFrontY's, terrain.js: stood back behind the town and rising out of the mainland where they meet)
  function range(R0,R1,NR,NA,lo,hi,hazeA,hazeB,phase,unlit,front){
    const pp=[],cc=[],ix=[],hz=[0.75,0.82,0.87];
    for(let ri=0;ri<=NR;ri++)for(let ai=0;ai<=NA;ai++){
      const t=ri/NR,a=ai/NA*Math.PI*2,R0a=front?mtnR0(a):R0,r=R0a+(R1-R0a)*Math.pow(t,0.85),x=Math.cos(a)*r,z=Math.sin(a)*r;
      const env=ss(0,0.3,t)*(1-0.5*ss(0.8,1,t)),side=0.5+0.5*Math.sin(a+2.4+phase);
      const n=(1-Math.abs(Math.sin(a*7+r*0.013+phase)))*0.5+(1-Math.abs(Math.sin(a*17+r*0.031+1.3+phase)))*0.3+(1-Math.abs(Math.sin(a*37-r*0.05+2.1)))*0.2;
      // the far range: finer ridges and gullies on top, for a sharper skyline (the front one meets the mainland, terrain.js, so keeps its shape)
      const fine=(1-Math.abs(Math.sin(a*71+r*0.09+3.7+phase)))*0.1+(1-Math.abs(Math.sin(a*149-r*0.13+0.6)))*0.05;
      // massifs: the peaks rise and fall in broad groups round the ring instead of standing like even teeth (the front
      // range only raised, and only from a quarter of the way back, so where it meets the mainland and the train's
      // tunnel it keeps mtnFrontY's height)
      const mass=Math.max(0,Math.sin(a*3+1.1+phase)*0.6+Math.sin(a*5.3+2.7+phase*2)*0.4);
      let hh=front?mtnFrontY(r,a)-WATER+6:env*(0.45+0.55*side)*(lo+hi*n*n)*(0.9+fine);
      hh*=front?1+ss(0.25,0.55,t)*(0.55*mass+fine):0.75+0.6*mass;
      pp.push(x,WATER-6+hh,z);
      const f=front?mtnF*270/(lo+hi):hh/(lo+hi),j=hash(ri*3.3+phase,ai*1.7)*0.06;let c;
      if(f<0.08)c=[0.26,0.4,0.26];else if(f<0.3)c=[0.18+j,0.32+j,0.22];else if(f<0.56+j)c=[0.46+j,0.44+j,0.43+j];else c=[0.95,0.96,0.98];
      const hk=hazeA+(hazeB-hazeA)*t;cc.push(c[0]+(hz[0]-c[0])*hk,c[1]+(hz[1]-c[1])*hk,c[2]+(hz[2]-c[2])*hk);
    }
    for(let ri=0;ri<NR;ri++)for(let ai=0;ai<NA;ai++){const q=ri*(NA+1)+ai;ix.push(q,q+1,q+NA+1,q+1,q+NA+2,q+NA+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
    g.setIndex(ix);g.computeVertexNormals();
    const mat=unlit?new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide,toneMapped:false})
      :new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,fog:false,side:THREE.DoubleSide,shininess:2,specular:0x000000,emissive:0x6a7686});
    const m=new THREE.Mesh(g,mat);m.renderOrder=-0.5;scene.add(m);MTN_MATS.push(mat);MTN_MESH.push(m);
  }
  range(790,1080,56,440,30,240,0.42,0.66,0,false,true);
  range(1080,1320,40,400,60,430,0.7,0.85,1.7,true);
})();
// the ranges on Medium and up (gfx.js mtnQ): lit by the sun and sky like the island, their faces worked out per pixel
// from where they are: ridges and gullies (a ridged noise bent into the light), forest on the gentler lower slopes with
// autumn colour low down, alpine grass, bare rock with its strata on the steep, snow on the high ground, grass where
// they meet the shore; then the air between: haze that thickens with distance and lies thicker in the valleys than on
// the peaks, glowing toward the sun (aerial perspective), mixed in as the scene's own haze is so it meets the sky
const MTN_U={uSun:{value:new THREE.Vector3()},uSunC:{value:new THREE.Color()},uHaze:{value:scene.fog.color},uHzD:{value:1500},uGlow:{value:1},uSnowH:{value:200}};
const MTN_GLSL='uniform vec3 uSun,uSunC,uHaze;uniform float uHzD,uGlow,uSnowH;varying vec3 vMtnP,vMtnN;\n'+
  'float mH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
  'float mN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mH(i),mH(i+vec2(1.0,0.0)),f.x),mix(mH(i+vec2(0.0,1.0)),mH(i+1.0),f.x),f.y);}\n'+
  'float mR(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){float n=1.0-abs(mN(p)*2.0-1.0);s+=a*n*n;p=p*2.03+vec2(1.7,9.2);a*=0.5;}return s;}\n';
const mtnMat=new THREE.MeshStandardMaterial({roughness:0.95,metalness:0,fog:false,side:THREE.DoubleSide});
mtnMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,MTN_U);
  sh.vertexShader='varying vec3 vMtnP,vMtnN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMtnP=(modelMatrix*vec4(transformed,1.0)).xyz;vMtnN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=`#define MTN_W ${WATER.toFixed(2)}\n`+MTN_GLSL+sh.fragmentShader
    // the ground's bumps: the ridged noise's slope (140 ft features down to 55), as if 40 m high per feature
    .replace('#include <color_fragment>','#include <color_fragment>\nvec3 nG=normalize(vMtnN);if(nG.y<0.0)nG=-nG;vec2 mq=vMtnP.xz/140.0;float m0=mR(mq);\n'+
      'vec3 nW=normalize(nG-vec3(mR(mq+vec2(0.03,0.0))-m0,0.0,mR(mq+vec2(0.0,0.03))-m0)*(40.0/(0.03*140.0)));\n'+
      'float mh=vMtnP.y-MTN_W,ms=1.0-nW.y,mg=1.0-nG.y,n1=mN(vMtnP.xz/45.0),n2=mN(vMtnP.xz/11.0);\n'+
      'vec3 rock=mix(vec3(0.07,0.065,0.06),vec3(0.15,0.13,0.11),n1)*(0.8+0.4*mN(vec2(vMtnP.y/6.0,n1*4.0)));\n'+
      'vec3 forest=mix(vec3(0.03,0.055,0.03)*(0.7+0.6*n2),vec3(0.24,0.08,0.025)*(0.7+0.6*n1),smoothstep(0.6,0.78,n2)*0.85*(1.0-smoothstep(60.0,140.0,mh)));\n'+
      'vec3 meadow=mix(vec3(0.14,0.12,0.07),vec3(0.08,0.11,0.045),n1);\n'+
      'float tree=(1.0-smoothstep(0.55,0.85,mg+0.25*(n1-0.5)))*(1.0-smoothstep(uSnowH*0.6,uSnowH*0.85,mh+60.0*n1));\n'+
      'vec3 mc=mix(mix(meadow,rock,smoothstep(0.35,0.6,ms+0.2*(n2-0.5))),forest,tree);\n'+
      'mc=mix(mc,vec3(0.78,0.81,0.86)*(0.9+0.1*n2),smoothstep(uSnowH-15.0,uSnowH+25.0,mh+80.0*(n1-0.5))*(1.0-smoothstep(0.6,0.85,mg)));\n'+
      'diffuseColor.rgb=mix(vec3(0.07,0.11,0.04),mc,smoothstep(4.0,40.0,mh));')
    .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize((viewMatrix*vec4(nW,0.0)).xyz);')
    .replace('#include <fog_fragment>','{vec3 mv=vMtnP-cameraPosition;float md=length(mv),mz=max(vMtnP.y-MTN_W,0.0);\n'+
      ' float hz=1.0-exp(-max(md-150.0,0.0)/uHzD*mix(1.25,0.45,smoothstep(0.0,350.0,mz)));float sg=max(dot(mv/md,uSun),0.0);\n'+
      ' gl_FragColor.rgb=mix(gl_FragColor.rgb,uHaze+uSunC*(0.3*pow(sg,6.0)+0.45*pow(sg,40.0))*uGlow,clamp(hz,0.0,1.0));}')};
mtnMat.customProgramCacheKey=()=>'mtn';
let mtnOn=false;
function mtnGfx(on){mtnOn=!!on;MTN_MESH.forEach((m,i)=>m.material=on?mtnMat:MTN_MATS[i])}
// every frame (main.js): the sun as it is, the tunings
function mtnTick(){if(!mtnOn)return;const u=MTN_U;u.uSun.value.copy(LIGHT_DIR);
  u.uSunC.value.copy(sun.color).multiplyScalar(Math.min(1,sun.intensity/(1.6*LI))*Math.min(1,Math.max(0,LIGHT_DIR.y*4+0.3)));
  u.uHzD.value=1500/Math.max(0.05,TU.mtnHaze);u.uGlow.value=TU.mtnGlow;u.uSnowH.value=TU.mtnSnow}
// ---------- field grass ----------
// clumps over the mesa that disappear wherever the ground gets dug, buried or painted. Four kinds on two shapes: meadow
// grass (also the dry straw clumps) and seed-head grass, low broadleaf weeds and wildflowers. They grow in patches with bare-ish ground
// between, in little clusters: lush and green down on the flats, dry and straw coloured up the slopes and hilltops,
// seed heads in drifts and along the roads and yards, flowers in drifts of one colour
// the field's own clumps, then the wild growth (tall grass gone to seed and bushes, Q19) in the rough ground
const TUFTS_FIELD=15000,TUFTS_TALL=2600,TUFTS_BUSH=700,TUFTS=TUFTS_FIELD+TUFTS_TALL+TUFTS_BUSH,tX=new Float32Array(TUFTS),tZ=new Float32Array(TUFTS),tS=new Float32Array(TUFTS),tR=new Float32Array(TUFTS),tI=new Int32Array(TUFTS),tJ=new Int32Array(TUFTS),
  tK=new Uint8Array(TUFTS),tGone=new Uint8Array(TUFTS),tVis=new Uint8Array(TUFTS),tH=new Float32Array(TUFTS),tMi=new Uint16Array(TUFTS),tSl=new Int32Array(TUFTS);
// smooth value noise, 0 to 1, about one feature per unit
function tuftNoise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
// the shapes of grass and weed (flat shaded, coloured per vertex: dark down in the clump, sunlit and a little yellower
// at the tips; the clump's own colour tints them). aHead marks seed and flower heads (1), which take their colour from
// the clump's aTuft instead of its green, and their stalks (2); clumps without heads (aTuft.y below 0) fold both away.
// Each shape is built at the Grass quality setting (gfx.js, tuftQuality): Simple is the first look (5 blades of 3
// triangles); Good, Fine and Best add blades, bend them in more steps, and shape leaves, petals and seed heads finer
const TUFT_Q=[{bl:5,seg:2,lf:1,pt:4,rs:6},{bl:7,seg:3,lf:2,pt:6,rs:7},{bl:10,seg:4,lf:3,pt:10,rs:8},{bl:13,seg:6,lf:4,pt:14,rs:9}];
// grass (seed stalks as heads), broadleaf (dandelion and chicory: rosette and a flower), clover (trefoils and a round
// head), thistle (spiny stem, purple tuft), plantain (broad upright leaves and a seed spike), sedge (stiff dark blades by
// damp ground, brown seed clusters), and the wild growth of the rough ground: tall grass (knee to waist high, long
// arching blades and feathery seed plumes) and a bush (woody stems up to clusters of leaves)
const TUFT_NAMES=['grass','broadleaf','clover','thistle','plantain','sedge','tall grass','bush'];
function tuftGeos(q){const Q=TUFT_Q[q];
  function build(seed,f){let s=seed;const R=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const P=[],C=[],A=[],I=[];
    // one triangle (corners, their colours, head mark)
    const tri=(v,c,hd)=>{for(let k=0;k<3;k++){I.push(A.length);P.push(...v[k]);C.push(...c[k]);A.push(hd)}};
    // a strip rising from (rx,rz) toward angle a: height h, leaning out by lean, width w shaped by wf(t), twisting by
    // tw, in n steps to a point; k0..k1 the shade from root to tip, hd the head mark
    const strip=(rx,rz,a,h,lean,w,tw,hv,n,wf,k0,k1,hd,droop)=>{const ca=Math.cos(a),sa=Math.sin(a),v=[],c=[];
      for(let i=0;i<=n;i++){const t=i/n,o=lean*Math.pow(t,1.7),cx=rx+ca*o,cz=rz+sa*o,y=h*t*(1-(droop||0.18)*t*lean/Math.max(h,0.01)),
          ta=a+Math.PI/2+tw*t,ww=i<n?w*wf(t):0,px=Math.cos(ta)*ww,pz=Math.sin(ta)*ww,k=k0+(k1-k0)*t,col=[k*(1+0.1*hv+0.08*t),k*(1+0.04*hv),k*(1-0.12*hv-0.14*t)];
        if(i<n){v.push([cx-px,y,cz-pz],[cx+px,y,cz+pz]);c.push(col,col)}else{v.push([cx,y,cz]);c.push(col)}}
      // shared corners, so the blade shades smoothly along its bend
      const o=A.length;for(let q=0;q<v.length;q++){P.push(...v[q]);C.push(...c[q]);A.push(hd)}
      for(let i=0;i<n;i++){const a0=o+i*2;if(i<n-1)I.push(a0,a0+1,a0+3,a0,a0+3,a0+2);else I.push(a0,a0+1,a0+2)}};
    // a leaf lying out from the root along a: length l, width w, tip up by up; from Good on, folded along its midrib in
    // Q.lf steps, its edge toothed (teeth) or smooth
    const leaf=(a,l,w,up,lift,teeth)=>{const ca=Math.cos(a),sa=Math.sin(a),n=Q.lf,r=[0.62,0.66,0.6],m=[0.92,0.95,0.86],t1=[1.05,1.08,0.95];
      const at=(t,s)=>{const ww=w*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.05)),0.7)*(teeth&&n>1&&t>0.1&&t<0.9?(Math.round(t*n*2)%2?1.25:0.8):1)*s,y=0.012+up*Math.pow(t,1.6)+(lift||0)*t*(1-t)*4;
        return [ca*l*t-sa*ww,y+(s?0:0.006*n/2),sa*l*t+ca*ww]};
      if(n===1){const O=[0,0.012,0],L=at(0.55,1),Rr=at(0.55,-1),T=at(1,0);tri([O,L,T],[r,m,t1],0);tri([O,T,Rr],[r,t1,m],0);return}
      for(let i=0;i<n;i++){const t0=i/n,t1v=(i+1)/n,cA=i?m:r,cB=i===n-1?t1:m;
        const m0=at(t0,0),m1=at(t1v,0),l0=at(t0,1),l1=at(t1v,1),r0=at(t0,-1),r1=at(t1v,-1);
        tri([m0,l0,l1],[cA,cA,cB],0);tri([m0,l1,m1],[cA,cB,cB],0);tri([m0,r1,r0],[cA,cB,cA],0);tri([m0,m1,r1],[cA,cB,cB],0)}};
    // a fan of n petals (or florets) round a centre at height y, radius r, cupped up by cup (heads: aHead 1)
    const flower=(x,y,z,r,n,cup,ce,hc)=>{for(let k=0;k<n;k++){const a0=k/n*6.2832,a1=a0+6.2832/n*0.8,am=(a0+a1)/2;
      tri([[x,y+0.006,z],[x+Math.cos(a0)*r*0.45,y+cup*0.4,z+Math.sin(a0)*r*0.45],[x+Math.cos(am)*r,y+cup,z+Math.sin(am)*r]],[ce,hc,hc],1);
      if(n>4)tri([[x,y+0.006,z],[x+Math.cos(am)*r,y+cup,z+Math.sin(am)*r],[x+Math.cos(a1)*r*0.45,y+cup*0.4,z+Math.sin(a1)*r*0.45]],[ce,hc,hc],1)}};
    // a thin stalk from the root to (x,h,z) (aHead 2: folds away with the head)
    const stem=(x,h,z,ws,col,hd)=>{const n=Math.max(1,Math.round(Q.seg/2));let px=0,py=0,pz=0;
      for(let i=1;i<=n;i++){const t=i/n,nx=x*Math.pow(t,1.5),ny=h*t,nz=z*Math.pow(t,1.5),w=ws*(1-0.5*t);
        tri([[px-w,py,pz],[px+w,py,pz],[nx,ny,nz]],[col,col,col],hd);if(n>1)tri([[px,py,pz-w],[px,py,pz+w],[nx,ny,nz]],[col,col,col],hd);px=nx;py=ny;pz=nz}};
    // a seed head: a narrow spike of n scales (or the first look's two triangles)
    const spike=(x,y,z,len,wd,n,hd)=>{const h1=[1,1,1],h0=[0.8,0.8,0.8];
      for(let k=0;k<n;k++){const t=k/n,y0=y+len*t,y1=y+len*(t+1/n)*1.02,a=k*2.4,ca=Math.cos(a)*wd*(1-0.4*t),sa=Math.sin(a)*wd*(1-0.4*t);
        tri([[x,y0,z],[x+ca,(y0+y1)/2,z+sa],[x,y1,z]],[h0,h1,h1],hd);tri([[x,y0,z],[x,y1,z],[x-ca,(y0+y1)/2,z-sa]],[h0,h1,h1],hd)}};
    f({R,tri,strip,leaf,flower,stem,spike});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
    g.setAttribute('aHead',new THREE.Float32BufferAttribute(A,1));g.setIndex(I);g.computeVertexNormals();return g}
  const W=t=>1-0.35*t,st=[0.5,0.55,0.32];
  return [
    // grass: blades arching over, and two stalks gone to seed
    build(11,({R,strip,stem,spike})=>{for(let b=0;b<Q.bl;b++){const a=b*6.28/Q.bl+R()*0.6,ra=0.01+R()*0.035+0.01*(Q.bl>7);
        strip(Math.cos(a+1.9)*ra,Math.sin(a+1.9)*ra,a,0.34*(0.55+0.45*R()),0.05+R()*0.13,(0.02+R()*0.012)*(Q.bl>7?0.8:1),(R()-0.5)*1.2,R()*2-1,Q.seg,W,0.68,1.15,0)}
      for(let b=0;b<2;b++){const a=b*3.1+R()*0.8,h=0.5+R()*0.18,lx=Math.cos(a)*h*0.12,lz=Math.sin(a)*h*0.12;stem(lx*0.8,h*0.8,lz*0.8,0.005,st,2);spike(lx*0.8,h*0.78,lz*0.8,h*0.24,0.016,Math.max(1,Q.seg-1),1)}}),
    // broadleaf: a rosette of leaves close to the ground, and a stem with a flower facing up
    build(23,({R,leaf,stem,flower})=>{for(let b=0;b<Q.rs-1;b++)leaf(b*6.28/(Q.rs-1)+R()*0.3,0.11+R()*0.06,0.035+R()*0.012,0.03+R()*0.04,0,true);
      const h=0.36+R()*0.08;stem(0.03,h,0,0.006,[0.45,0.55,0.32],2);flower(0.03,h,0,0.065,Q.pt,0.012,[0.75,0.7,0.5],[1,1,1])}),
    // clover: trefoils on short stems, and a round head of florets
    build(37,({R,tri,stem,flower})=>{const n=3+(Q.lf>>1);for(let b=0;b<n;b++){const a=b*2.4+R()*0.5,d=0.03+R()*0.07,x=Math.cos(a)*d,z=Math.sin(a)*d,h=0.06+R()*0.05;
        for(let l=0;l<3;l++){const la=a+l*2.094+R()*0.2,ca=Math.cos(la),sa=Math.sin(la),lw=0.016+R()*0.004;
          // each leaflet a small round leaf out from the stem's top
          const ox=x,oz=z,leafAt=(t,s)=>[ox+ca*0.035*t-sa*lw*Math.sin(Math.PI*t)*s,h+0.004*t,oz+sa*0.035*t+ca*lw*Math.sin(Math.PI*t)*s],m=[0.85,0.92,0.82],e=[1.0,1.05,0.95];
          for(let i=0;i<Math.max(1,Q.lf-1);i++){const t0=i/Math.max(1,Q.lf-1),t1=(i+1)/Math.max(1,Q.lf-1);
            tri([leafAt(t0,0),leafAt(t0,1),leafAt(t1,1)],[m,e,e],0);tri([leafAt(t0,0),leafAt(t1,1),leafAt(t1,0)],[m,e,m],0);
            tri([leafAt(t0,0),leafAt(t1,-1),leafAt(t0,-1)],[m,e,e],0);tri([leafAt(t0,0),leafAt(t1,0),leafAt(t1,-1)],[m,m,e],0)}}
        stem(x,h,z,0.003,[0.5,0.62,0.4],0)}
      const h=0.13+R()*0.03;stem(0.02,h,0.01,0.003,[0.5,0.62,0.4],2);
      for(let k=0;k<Math.max(2,Q.lf);k++)flower(0.02,h-0.006+k*0.008,0.01,0.014-k*0.002,Q.pt,0.012,[0.85,0.85,0.8],[1,1,1])}),
    // thistle: a stiff stem with spiny leaves up it, a green bulb and a purple tuft
    build(51,({R,strip,stem,flower,tri})=>{const h=0.62+R()*0.12,g=[0.55,0.62,0.5];stem(0.01,h,0,0.008,g,0);
      const nl=2+Q.lf;for(let b=0;b<nl;b++){const t=0.12+0.7*b/nl,a=b*2.3+R()*0.4,y=h*t,l=0.13*(1-0.5*t),ca=Math.cos(a),sa=Math.sin(a),n=2+Q.lf;
        for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,sp=(i%2?1:-1)*0.025*(1-t0),p0=[ca*l*t0+0.01*t,y+0.03*t0,sa*l*t0],p1=[ca*l*t1+0.01*t,y+0.05*t1,sa*l*t1];
          tri([p0,p1,[p0[0]-sa*sp+ca*0.01,p0[1]+0.01,p0[2]+ca*sp+sa*0.01]],[g,[0.95,1,0.9],[1.05,1.1,1]],0)}}
      const bx=0.01;for(let k=0;k<Math.max(4,Q.pt);k++){const a=k/Math.max(4,Q.pt)*6.2832,r=0.022;tri([[bx,h-0.03,0],[bx+Math.cos(a)*r,h,Math.sin(a)*r],[bx+Math.cos(a+0.8)*r,h,Math.sin(a+0.8)*r]],[g,g,g],0)}
      flower(bx,h,0,0.02,Q.pt,0.035,[0.9,0.85,0.95],[1,1,1])}),
    // plantain: broad ribbed leaves standing up and out, and a seed spike on a long stalk
    build(67,({R,leaf,stem,spike})=>{for(let b=0;b<Q.rs-2;b++)leaf(b*6.28/(Q.rs-2)+R()*0.4,0.13+R()*0.05,0.04+R()*0.01,0.05+R()*0.05,0.03,false);
      for(let b=0;b<1+(Q.lf>2);b++){const a=b*3+R(),h=0.28+R()*0.1,x=Math.cos(a)*0.03,z=Math.sin(a)*0.03;stem(x,h*0.7,z,0.004,[0.5,0.55,0.35],2);spike(x,h*0.7,z,h*0.3,0.011,1+Q.seg,1)}}),
    // sedge: stiff narrow blades standing nearly straight, and brown seed clusters
    build(83,({R,strip,stem,spike})=>{for(let b=0;b<Q.bl+3;b++){const a=b*6.28/(Q.bl+3)+R()*0.5,ra=0.005+R()*0.03;
        strip(Math.cos(a)*ra,Math.sin(a)*ra,a,0.5*(0.6+0.4*R()),0.03+R()*0.08,0.011+R()*0.005,(R()-0.5)*0.4,R()*2-1,Q.seg+1,t=>1-0.6*t,0.55,1.05,0,0.05)}
      for(let b=0;b<1+(Q.bl>7);b++){const a=b*2.8+R(),h=0.55+R()*0.1,x=Math.cos(a)*0.02,z=Math.sin(a)*0.02;stem(x,h,z,0.004,[0.45,0.5,0.32],2);spike(x,h,z,0.05,0.012,Math.max(2,Q.seg),1)}}),
    // tall grass: long blades arching out and over from a wide base, and stalks gone to seed in feathery plumes
    build(97,({R,strip,stem,spike})=>{const nb=Q.bl+4;for(let b=0;b<nb;b++){const a=b*6.28/nb+R()*0.5,ra=0.015+R()*0.06;
        strip(Math.cos(a+1.9)*ra,Math.sin(a+1.9)*ra,a,0.55+0.3*R(),0.12+R()*0.25,0.012+R()*0.006,(R()-0.5)*0.8,R()*2-1,Q.seg+1,W,0.55,1.15,0,0.35)}
      const ns=3+(Q.bl>7?2:0)+(Q.bl>10?1:0);for(let b=0;b<ns;b++){const a=b*6.28/ns+R()*0.9,h=0.85+R()*0.25,lx=Math.cos(a)*h*0.14,lz=Math.sin(a)*h*0.14;
        stem(lx,h,lz,0.004,[0.62,0.6,0.4],2);spike(lx,h-0.02,lz,0.15+R()*0.07,0.028,Math.max(2,Q.seg+1),1)}}),
    // bush: a few woody stems (head colour, so they stay bark brown under the leaf tint) up to clusters of small leaves
    // round a dome, darker deep inside and sunlit at the outside
    build(113,({R,tri,stem})=>{const nc=4+Q.lf,nl=[5,6,8,10][q],cs=[];
      for(let c=0;c<nc;c++){const a=c*6.28/nc+R()*0.7,u=0.35+0.55*R(),x=Math.cos(a)*0.42*u,z=Math.sin(a)*0.42*u,y=0.25+0.45*(1-u*u*0.6)+R()*0.1;cs.push([x,y,z]);
        stem(x*0.85,y*0.9,z*0.85,0.012,[1,1,1],1)}
      for(const [cx,cy,cz] of cs)for(let l=0;l<nl*2;l++){const a=R()*6.28,e=R()*1.4-0.3,r=0.06+0.12*R(),nx=Math.cos(a)*Math.cos(e),ny=Math.sin(e),nz=Math.sin(a)*Math.cos(e);
        const px=cx+nx*r,py=cy+ny*r*0.8,pz=cz+nz*r,t=R()*6.28,tx=Math.cos(t),tz=Math.sin(t),ln=0.05+0.03*R(),wd=0.022+0.01*R();
        // a leaf: a diamond along (tx, lift, tz), its sides across that and the outward normal
        const ux=tx*ln,uy=0.4*ln*(R()-0.3),uz=tz*ln,sx=(ny*uz-nz*uy),sy=(nz*ux-nx*uz),sz=(nx*uy-ny*ux),sl=Math.hypot(sx,sy,sz)||1,k=0.55+0.5*(r/0.18)*(0.6+0.4*ny),cl=[k*0.95,k,k*0.9];
        const A=[px-ux,py-uy,pz-uz],B=[px+ux,py+uy,pz+uz],L=[px+sx/sl*wd,py+sy/sl*wd,pz+sz/sl*wd],Rr=[px-sx/sl*wd,py-sy/sl*wd,pz-sz/sl*wd];
        tri([A,L,B],[cl,cl,cl],0);tri([A,B,Rr],[cl,cl,cl],0)}})]}
let tuftQ=0;const TUFT_GEO=tuftGeos(0),TUFT_GQ=[TUFT_GEO];
const TUFT_KINDS=TUFT_GEO.length;
// per shape: how far out it is still drawn, as a share of the Graphics setting's distances (small things go first)
const TUFT_KR=[1,0.65,0.5,0.85,0.65,0.9,1.6,1.8];
// per shape: how hard the wind moves it (the tall grass is long and springy, a bush's leaves only flutter)
const TUFT_SWAY=[1,1,1,1,1,1,0.3,0.06];
// the clumps sit in 32 m squares, one instanced mesh per square and shape, so squares out of view or far away are skipped
const TC_X0=-48,TC_Z0=-19,TC_W=32,TC_NX=3,TC_NZ=3;
// thinning with distance, set each frame from the Graphics setting by tuftLod: share drawn up close, near and far
// distances (m) and the share still drawn far off. Each clump has a rank (aTuft.x): it shrinks away as the share drops
// below its rank, and the ones left grow a little to fill in
let tuftMats0=0;
const tuftMats=TUFT_GEO.map(()=>{const mat=M(0xffffff,{side:THREE.DoubleSide,vertexColors:true}),thin={value:new THREE.Vector4(1,25,80,0.35)};
  mat.userData.thin=thin;const sway={value:TUFT_SWAY[tuftMats0++]};
  mat.onBeforeCompile=sh=>{sh.uniforms.uSway=sway;sh.uniforms.uTime=timeU;sh.uniforms.uDayK=dayKU;sh.uniforms.uThin=thin;sh.uniforms.uSun={value:SUN_DIR};sh.uniforms.uPush=lawnPush;
    sh.uniforms.tCrush={value:crTex};sh.uniforms.uCrO={value:new THREE.Vector4(CR_X0,CR_Z0,1/(CR_NX*CR_C),1/(CR_NZ*CR_C))};Object.assign(sh.uniforms,wetU);
    sh.vertexShader='uniform float uTime;\nuniform float uSway;\nuniform vec4 uThin;\nuniform vec4 uPush[5];\nuniform sampler2D tCrush;\nuniform vec4 uCrO;\nuniform sampler2D tWet;\nuniform vec4 uWetO;\nattribute vec4 aTuft;\nattribute float aHead;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.vertexShader
      .replace('#include <color_vertex>','vColor=vec4(1.0);\n#ifdef USE_COLOR\nvColor.rgb*=color;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvColor.rgb*=mix(instanceColor,aTuft.yzw,step(0.5,aHead)*step(aHead,1.5));\n#endif')
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
      'mvPosition.xz+=wd*hg*hg*uSway*(0.25+1.1*gust+0.2*fl+0.4*wet)*(1.0-fla);mvPosition.y-=hg*hg*uSway*(0.4*gust+0.5*wet)*(1.0-fla);\n'+
      'mvPosition.xz+=cd*hg*0.9*fla;mvPosition.y-=hg*0.8*fla;\n'+
      // and it leans away from the machines and the worker (uPush, set by updateMower)
      'for(int m=0;m<5;m++){vec2 d=root.xz-uPush[m].xy;float l=length(d),f=(1.0-smoothstep(uPush[m].z*0.55,uPush[m].z+0.35,l))*(1.0-fla);\n'+
      'if(f>0.0){mvPosition.xz+=d/max(l,0.05)*hg*0.9*f;mvPosition.y-=hg*0.6*f;}}\n'+
      'vColor.rgb*=(1.0+0.18*gust*smoothstep(0.05,0.3,hg)*(1.0-fla))*mix(vec3(1.0),vec3(1.3,1.22,0.78),fla)*(1.0-0.22*wet);\n'+
      'vLW=mvPosition.xyz;vTip=smoothstep(0.03,0.3,hg);\n'+
      'mvPosition=modelViewMatrix*mvPosition;\ngl_Position=projectionMatrix*mvPosition;');
    // looking toward the sun the blades glow where light comes through them
    sh.fragmentShader='uniform vec3 uSun;\nuniform float uDayK;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\nfloat bl=pow(max(0.0,dot(normalize(vLW-cameraPosition),uSun)),3.0);\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.0,1.15,0.4)*bl*vTip*0.9*uDayK;')};
  return mat});
// all the meshes, in a group so the speed test can hide them together; tuftMeshes[(square)*shapes+shape]
const tufts=new THREE.Group(),tuftMeshes=[];scene.add(tufts);
(function(){const DRY=[0.68,0.6,0.33],FLW=[[1,0.84,0.18],[0.97,0.96,0.9],[0.66,0.44,0.86],[1,0.84,0.18]],col=new Float32Array(TUFTS*3),hd=new Float32Array(TUFTS*3);
  const bad=(x,z)=>mesaR(x,z)>EDGE-0.8||roadAmt(x,z)>0.1||yardAt(x,z)>0.3||wallAt(x,z)||paintAt(x,z);
  // where clumps grow: patches every few metres, thinner on rocky slopes
  const dens=(x,z)=>ss(0.2,0.7,0.65*tuftNoise(x*0.17+3.1,z*0.17+7.3)+0.35*tuftNoise(x*0.6+11,z*0.6+5));
  // the ground's plant communities, from the lie of the land: dry up the slopes and hilltops, the edges of roads and
  // yards, damp hollows (lower than the ground 4 m round), and how weedy each stretch is (clean, lawn-like stretches and
  // weedy drifts, a few dozen metres across). Each clump's shape is drawn from the weights these give (tuftZone)
  const zone=(x,z)=>{const h=baseHeight(x,z),sl=(Math.abs(baseHeight(x+1,z)-baseHeight(x-1,z))+Math.abs(baseHeight(x,z+1)-baseHeight(x,z-1)))/2;
    const dry=Math.min(1,ss(0.25,0.75,sl)+0.6*ss(3,9,h)+0.7*ss(0.62,0.85,tuftNoise(x*0.09+40,z*0.09+2)));
    const edge=Math.max(1-ss(ROAD_W/2+0.4,ROAD_W/2+2.6,Math.abs(roadOff(x,z))),ss(0.02,0.2,yardAt(x,z)));
    let ring=0;for(let k=0;k<6;k++)ring+=baseHeight(x+Math.cos(k*1.047)*4,z+Math.sin(k*1.047)*4);
    const damp=ss(0.1,0.45,ring/6-h)*(1-dry)*ss(0.25,0.55,tuftNoise(x*0.07+90,z*0.07+15));
    const weedy=ss(0.3,0.75,tuftNoise(x*0.05+120,z*0.05+60)),clover=ss(0.55,0.8,tuftNoise(x*0.13+150,z*0.13+33));
    return {h,sl,dry,edge,damp,weedy,clover}};
  const pick=Z=>{const w=[1-0.4*Z.weedy-0.5*Z.damp,(0.05+0.18*Z.weedy)*(1-Z.dry)*(1-Z.damp)+0.08*Z.edge,(0.02+0.9*Z.clover*Z.weedy)*(1-Z.dry)*(1-Z.damp),
      (0.01+0.2*Z.weedy)*Z.dry+0.05*Z.edge*Z.weedy,0.3*Z.edge+0.05*Z.weedy*(1-Z.dry),1.4*Z.damp];
    let t=Math.random()*w.reduce((a,b)=>a+b,0);for(let k=0;k<w.length;k++){t-=w[k];if(t<=0)return k}return 0};
  // the clump's green by shape (grass, broadleaf, clover, thistle, plantain, sedge)
  const LEAF=[[0.3,0.52,0.22],[0.25,0.49,0.23],[0.22,0.47,0.24],[0.42,0.53,0.38],[0.28,0.5,0.21],[0.3,0.47,0.24]];
  let n=0;
  while(n<TUFTS_FIELD){let x,z,q=0;do{x=(Math.random()-0.5)*94;z=-18+Math.random()*96}while((bad(x,z)||Math.random()>0.12+0.88*dens(x,z))&&++q<60);
    // a little cluster of one to four clumps, mostly of one kind
    const k=1+Math.floor(Math.pow(Math.random(),2)*4),Z0=zone(x,z),kind0=pick(Z0);
    for(let m=0;m<k&&n<TUFTS;m++){const a=Math.random()*6.3,r=m?0.12+Math.random()*0.3:0,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(m&&bad(px,pz))continue;
      const Z=m?zone(px,pz):Z0,{dry,edge}=Z,kind=m&&Math.random()<0.4?pick(Z):kind0,nv=Math.random();
      // heads: grass gone to seed in drifts and along the edges; dandelions, daisies or asters in one-colour drifts, chicory
      // blue by the roads; clover white or pink; thistles purple; plantain and sedge seed spikes brown
      const seedA=0.04+0.4*ss(0.6,0.82,tuftNoise(px*0.12+20,pz*0.12+9))+0.22*edge+0.25*dry,fd=ss(0.62,0.8,tuftNoise(px*0.1+70,pz*0.1+30))*(1-dry);
      let head=null;
      if(kind===0){if(Math.random()<seedA)head=[0.78+0.12*nv,0.76+0.06*nv,0.48-0.06*nv]}
      else if(kind===1){if(Math.random()<0.2+0.7*fd+0.3*edge){const fl=FLW[Math.floor(hash(Math.floor(px/9),Math.floor(pz/9))*3.999)];head=edge>0.5&&Math.random()<0.5?[0.55,0.66,1]:Math.random()<0.85?fl:FLW[Math.floor(Math.random()*3)]}}
      else if(kind===2){if(Math.random()<0.7)head=hash(Math.floor(px/7)+3,Math.floor(pz/7))<0.7?[1,0.95,0.97]:[0.95,0.55,0.72]}
      else if(kind===3){if(Math.random()<0.8)head=[0.72,0.36+0.1*nv,0.8]}
      else if(Math.random()<0.85)head=kind===4?[0.6,0.5,0.32]:[0.5,0.38,0.22];
      tX[n]=px;tZ[n]=pz;tK[n]=kind;tR[n]=Math.random()*6.3;
      tS[n]=(kind===1?0.75+Math.random()*0.6:kind===0?0.7+Math.random()*0.6:0.8+Math.random()*0.5)*(1+0.25*edge);
      // dry clumps lie lower
      const dk=kind===0&&Math.random()<0.06+0.6*dry;tH[n]=(0.8+Math.random()*0.45)*(dk?0.7:1);
      // the green of the ground, a touch deeper in the lush flats and the damp; dry clumps straw coloured
      const lush=(1-dry)*0.15+0.1*Z.damp,L=LEAF[kind];
      let cr=(L[0]+0.05*nv)*(1-lush),cg=(L[1]+0.08*nv)*(1-lush*0.4),cb=(L[2]+0.04*nv)*(1-lush);
      const da=dk?0.7+0.3*Math.random():kind!==2&&kind!==5?0.25*dry*Math.random():0;cr+=(DRY[0]-cr)*da;cg+=(DRY[1]-cg)*da;cb+=(DRY[2]-cb)*da;
      col[n*3]=cr;col[n*3+1]=cg;col[n*3+2]=cb;
      hd[n*3]=head?head[0]:-1;hd[n*3+1]=head?head[1]:0;hd[n*3+2]=head?head[2]:0;n++}}
  // the wild growth, in the rough: a band in from the mesa's rim, and drifts across the rest that grow thicker where it
  // is dry, never along the roads and yards. Tall grass in stands of a few clumps, green to straw and rusty broomsedge
  // with pale or purple-brown plumes; bushes one by one, more of them toward the rim
  const wildW=(x,z,Z)=>Math.max(ss(EDGE-15,EDGE-3,mesaR(x,z)),ss(0.5,0.78,tuftNoise(x*0.045+210,z*0.045+80))*(0.45+0.55*Z.dry))*(1-0.9*Z.edge);
  const TALL=[[0.36,0.5,0.22],[0.55,0.55,0.3],[0.74,0.63,0.37],[0.72,0.46,0.25]],PLUME=[[0.88,0.82,0.66],[0.8,0.72,0.55],[0.58,0.44,0.42]];
  const BUSH=[[0.32,0.48,0.2],[0.26,0.42,0.18],[0.42,0.5,0.22],[0.6,0.5,0.2],[0.66,0.36,0.16]];
  for(const kind of [6,7]){const end=kind===6?TUFTS_FIELD+TUFTS_TALL:TUFTS;
    while(n<end){let x,z,Z,q=0;do{x=(Math.random()-0.5)*94;z=-18+Math.random()*96;Z=bad(x,z)?null:zone(x,z)}while((!Z||Math.random()>wildW(x,z,Z)*(kind===7?0.4+0.6*ss(EDGE-15,EDGE-3,mesaR(x,z)):1))&&++q<80);
      if(!Z)continue;
      const k=kind===6?2+Math.floor(Math.random()*4):1,nv=hash(Math.floor(x/6)+11,Math.floor(z/6)-4);
      for(let m=0;m<k&&n<end;m++){const a=Math.random()*6.3,r=m?0.25+Math.random()*0.45:0,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(m&&bad(px,pz))continue;
        tX[n]=px;tZ[n]=pz;tK[n]=kind;tR[n]=Math.random()*6.3;tS[n]=kind===6?0.8+Math.random()*0.5:0.75+Math.random()*0.7;tH[n]=kind===6?0.8+Math.random()*0.45:0.8+Math.random()*0.4;
        // one colour per stand (a few metres), drier toward straw on the dry ground
        const P=kind===6?TALL[Math.min(3,Math.floor(nv*2+Z.dry*2.2))]:BUSH[Math.floor(hash(Math.floor(px/4),Math.floor(pz/4)+7)*BUSH.length)],v=0.88+0.24*Math.random();
        col[n*3]=P[0]*v;col[n*3+1]=P[1]*v;col[n*3+2]=P[2]*v;
        const hc=kind===6?(Math.random()<0.8?PLUME[Math.floor(nv*2.999)]:null):[0.36,0.28,0.2];
        hd[n*3]=hc?hc[0]:-1;hd[n*3+1]=hc?hc[1]:0;hd[n*3+2]=hc?hc[2]:0;n++}}}
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
// the Grass quality setting (gfx.js): every square's meshes take that build of their shape (made the first time it is picked)
function tuftQuality(q){q=Math.max(0,Math.min(TUFT_Q.length-1,q|0));if(q===tuftQ)return;tuftQ=q;const G=TUFT_GQ[q]||(TUFT_GQ[q]=tuftGeos(q));
  for(const im of tuftMeshes){const g=im.geometry,sg=G[im.userData.k];for(const a of ['position','color','normal','aHead'])g.setAttribute(a,sg.attributes[a]);g.setIndex(sg.index)}}
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
// the wild growth (tall grass and bushes) takes its own share from the Graphics setting's Wild growth (wild), and stays
// in view far off like the field grass, being big
function tuftLod(){const g=typeof gfxCur!=='undefined'?gfxCur.tuft:[1,25,80,0.35],wl=typeof gfxCur!=='undefined'&&gfxCur.wild!=null?gfxCur.wild:1,cx=camera.position.x,cz=camera.position.z;
  const amt=k=>k>5?g[0]*wl:g[0],far=k=>k===0||k>5?g[3]:0;
  for(let k=0;k<TUFT_KINDS;k++)tuftMats[k].userData.thin.value.set(amt(k),g[1]*TUFT_KR[k],g[2]*TUFT_KR[k],far(k));
  for(const im of tuftMeshes){const k=im.userData.k,n=im.userData.n;if(!n)continue;
    const d=Math.hypot(Math.max(0,Math.abs(cx-im.userData.cx)-TC_W/2),Math.max(0,Math.abs(cz-im.userData.cz)-TC_W/2)),fl=far(k);
    const f=amt(k)*(fl+(1-fl)*(1-ss(g[1]*TUFT_KR[k],g[2]*TUFT_KR[k],d)));
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
// how tall each shape stands at full size (m), with its seed stalks or flower
const TUFT_HK=[0.45,0.42,0.15,0.7,0.38,0.6,1.0,0.85];
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
function fieldLoad(str,away){if(typeof str!=='string')return;let b;try{b=atob(str)}catch(e){return}
  for(let q=0;q+2<b.length;q+=3){const k=b.charCodeAt(q)|b.charCodeAt(q+1)<<8;if(k>=fcT.length)continue;
    fcT[k]=lawn.t-(b.charCodeAt(q+2)-1)/254*(TU.lawnWait+TU.lawnGrow)-(away||0);if(!fcIn[k]){fcIn[k]=1;fcAct.push(k)}fcRedraw(k)}
  tuftFlush()}
// every clump stands up at the start
// each tuft's dig-grid point, or -1 off the grid; again when the grid moves (the lawn patch's are cleared by mower.js)
function tuftIdx(){for(let n=0;n<TUFTS;n++){const i=Math.round(gI(tX[n])),j=Math.round(gJ(tZ[n]));if(i<0||i>N||j<0||j>N){tI[n]=-1;tJ[n]=-1}else{tI[n]=i;tJ[n]=j}}}
tuftIdx();
for(let n=0;n<TUFTS;n++)tuftPut(n,true);tuftFlush();
// ground outside the dig zone: 0.5 m over the rest of the mesa and its cliffs (hills, the scarp and the ramp need it),
// 2 m beyond; each patch has a hole where the finer one sits
const MID=[-58,58,-32,92];
// a ground vertex's colour into c (rgb array), and its dirt-texture amount: grass (darker down on the meadows), rock on
// steep ground, sand at the lake, the yards and the roads, and any painted material (how much covers it into c[3])
function groundColor(x,z,h,c){const n=hash(x*3.55+0.3,z*2.65+0.7);
  const sl=(Math.abs(baseHeight(x+1,z)-baseHeight(x-1,z))+Math.abs(baseHeight(x,z+1)-baseHeight(x,z-1)))/2;
  // (and on the foothills' face, outcrops where it steepens)
  const rock=Math.max(ss(0.55,1.1,sl),z>FH_Z0?ss(0.4,0.55,sl)*ss(0.72,0.86,tuftNoise(x*0.06,z*0.06)):0),sand=1-ss(WATER+1.6,WATER+2.4,h),low=ss(-4,-20,h)*ss(EDGE-1,EDGE+2,mesaR(x,z));
  let r=0.30+0.08*n+0.05*low,g=0.50+0.09*n-0.02*low,b=0.24+0.04*n;
  // the town's lawns (Harbor Square's green and the yards, turf.js): a deep natural green in soft drifts, lusher and
  // darker in some, worn yellower in others, never the open field's bluish green
  const tw=ss(190,175,Math.abs(x))*ss(540,552,z)*ss(790,775,z);
  if(tw>0){const lu=tuftNoise(x*0.09+17,z*0.09+41),dr=ss(0.6,0.85,tuftNoise(x*0.05+60,z*0.05+9));
    r+=(0.19+0.05*lu+0.08*dr+0.03*n-r)*tw;g+=(0.33+0.04*lu+0.02*dr+0.04*n-g)*tw;b+=(0.12+0.03*lu+0.01*n-b)*tw}
  // the mainland's hayfield, mown in rows, and the darker woods floor
  const hf=mainField(x,z),wf=Math.max(mainWoods(x,z),mainForest(x,z));
  if(hf>0){const st=0.5+0.5*Math.sin(z*0.9);r+=(0.58+0.08*st+0.04*n-r)*hf;g+=(0.55+0.05*st-g)*hf;b+=(0.28-b)*hf}
  if(wf>0){r-=0.1*wf;g-=0.12*wf;b-=0.05*wf}
  const strata=0.06*Math.sin(h*1.4+n);
  r+=(0.50+0.06*n+strata-r)*rock;g+=(0.44+0.05*n+strata-g)*rock;b+=(0.38+0.04*n+strata-b)*rock;
  r+=(0.80-r)*sand;g+=(0.72-g)*sand;b+=(0.52-b)*sand;
  c[0]=r;c[1]=g;c[2]=b;const ya=yardTint(x,z,c,n),ka=trkTint(x,z,c,n),ra=roadTint(x,z,c,n),mc=matTint(x,z,c);c[3]=mc;return Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9,ya*0.85,ka))*(MAT_GL2?1:1-mc)}
let midPatch=null,skirtMesh=null;
// a ground mesh over a rectangle at CO metres, leaving out the cells inside any of the holes (where a finer mesh sits)
function groundPatch(X0,X1,Z0,Z1,CO,holes){
  const NX=Math.round((X1-X0)/CO),NZ=Math.round((Z1-Z0)/CO),VX=NX+1,pp=[],cc=[],ix=[],rk=[],ma=[],c=[0,0,0,0];
  for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const x=X0+i*CO,z=Z0+j*CO,h=baseHeight(x,z);pp.push(x,h,z);rk.push(groundColor(x,z,h,c));cc.push(c[0],c[1],c[2]);ma.push(c[3])}
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x0=X0+i*CO,z0=Z0+j*CO;
    if(holes.some(h=>x0>=h[0]-1e-6&&x0+CO<=h[1]+1e-6&&z0>=h[2]-1e-6&&z0+CO<=h[3]+1e-6))continue;const a=j*VX+i;ix.push(a,a+VX,a+1,a+1,a+VX,a+VX+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
  // smooth normals: the ground is drawn flat-shaded, but rain runoff reads which way is downhill from them (terrain.js)
  g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(pp.length),3));g.setIndex(ix);g.computeVertexNormals();
  g.setAttribute('dirt',new THREE.Float32BufferAttribute(rk,1));g.setAttribute('wetT',new THREE.Float32BufferAttribute(new Float32Array(rk.length).fill(-1e4),1));g.setAttribute('soilD',new THREE.Float32BufferAttribute(new Float32Array(rk.length),1));g.setAttribute('matA',new THREE.Float32BufferAttribute(ma,1));
  const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;scene.add(m);
  return {g,m,X0,Z0,CO,VX,NX,NZ};
}
// the Family Island gets its own 1.5 m mesh (family.js)
const FAM_PATCH=[-111,111,136,352];
// 1 m over the rest of Corley's Island and its shore, round the 0.5 m mesh; whole dig tiles out to the water all round, so
// the dig grid (digtiles.js) can sit over the bank and the beach
const OUTER_MID=[-128,128,-128,128];
// the mainland (mainland.js): 4 m ground, with 1 m where each causeway lands
const MAIN_FINE=[[-42,42,-300,-196],[-42,42,480,600]];
// the town side in four meshes (mainland.js): 6 m out to where it runs under the mountains, 4 m over the town and the
// foothills, 2 m over the switchback road; [rect, step] where a finer one meets a coarser one, for the skirts
const MAIN_TOWN=[-450,450,480,780],MAIN_FOOT=[-258,258,780,1068],MAIN_ROAD=[-110,110,780,952];
const MAIN_SEAMS=[[MAIN_TOWN,2],[MAIN_FOOT,4],[MAIN_ROAD,2]];
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
  for(const [a,w] of [[pa,3],[ca,3],[da,1],[ma,1]]){a.addUpdateRange(j0*P.VX*w,(j1-j0+1)*P.VX*w);a.needsUpdate=true}}
// skirts hide any hairline gap where a finer grid meets a coarser one; rebuilt when the editor reshapes the ground
function buildSkirts(){
  const sp=[],si=[];let q=0;
  const run=(fx,a0,a1,st,dp)=>{for(let t=a0;t<a1-1e-6;t+=st){const [x0,z0]=fx(t),[x1,z1]=fx(t+st),h0=baseHeight(x0,z0),h1=baseHeight(x1,z1);
    sp.push(x0,h0,z0,x1,h1,z1,x0,h0-dp,z0,x1,h1-dp,z1);si.push(q,q+2,q+1,q+1,q+2,q+3);q+=4}};
  for(const R of [[GX0,GX1,GZ0,GZ1],...digSkirtRects]){run(t=>[t,R[2]],R[0],R[1],0.5,0.6);run(t=>[t,R[3]],R[0],R[1],0.5,0.6);run(t=>[R[0],t],R[2],R[3],0.5,0.6);run(t=>[R[1],t],R[2],R[3],0.5,0.6)}
  run(t=>[t,OUTER_MID[2]],OUTER_MID[0],OUTER_MID[1],1,2);run(t=>[t,OUTER_MID[3]],OUTER_MID[0],OUTER_MID[1],1,2);run(t=>[OUTER_MID[0],t],OUTER_MID[2],OUTER_MID[3],1,2);run(t=>[OUTER_MID[1],t],OUTER_MID[2],OUTER_MID[3],1,2);
  for(const R of MAIN_FINE){run(t=>[t,R[2]],R[0],R[1],1,2);run(t=>[t,R[3]],R[0],R[1],1,2);run(t=>[R[0],t],R[2],R[3],1,2);run(t=>[R[1],t],R[2],R[3],1,2)}
  for(const [R,st] of MAIN_SEAMS){run(t=>[t,R[2]],R[0],R[1],st,2);run(t=>[t,R[3]],R[0],R[1],st,2);run(t=>[R[0],t],R[2],R[3],st,2);run(t=>[R[1],t],R[2],R[3],st,2)}
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
// placed assets (trees and boulders, and the things of props.js) as {t: type, x, z, yaw, s: size, c: tint}; the map editor moves, adds and removes them.
// The trees are drawn by trees.js (its 'main' group); the boulders here
// ---------- boulders ----------
// photo-scanned stone (ambientCG Rock046L, lichen-spotted granite, and Rock028, a dark grey; made by
// tools/trees_scan.py) on lumpy shapes: an icosphere pushed out by layered waves, cut into a few flat faces the way split
// granite breaks and flattened underneath, a little darker low down and in its hollows. UVs are projected per face along
// its main axis; the scans' relief shows on High graphics (rockPbr). detail 2 is 320 triangles, 1 is 80
const ROCK_TEX=(()=>{const L=new THREE.TextureLoader(),T=n=>{const t=L.load(`textures/${n}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t};
  return{granite:T('rock_granite'),dark:T('rock_dark'),graniteN:null,darkN:null}})();
const ROCK_MATS=['granite','dark'].map(k=>new THREE.MeshPhongMaterial({map:ROCK_TEX[k],vertexColors:true,shininess:5,specular:0x101010}));
// gfx.js (through treePbr): the stone's relief on High, its normal maps fetched the first time
function rockPbr(on){['granite','dark'].forEach((k,i)=>{const m=ROCK_MATS[i];
  if(on&&!ROCK_TEX[k+'N']){const t=new THREE.TextureLoader().load(`textures/rock_${k}_n.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;ROCK_TEX[k+'N']=t}
  const want=on?ROCK_TEX[k+'N']:null;if(m.normalMap!==want){m.normalMap=want;m.normalScale.set(1.4,1.4);m.needsUpdate=true}})}
function rockShape(seed,detail){let sd=seed;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647},V=THREE.Vector3;
  const W=[];for(let k=0;k<9;k++)W.push([new V(rnd()-0.5,rnd()-0.5,rnd()-0.5).normalize(),1.5+rnd()*k*0.9,rnd()*6.28,0.16/(1+k*0.45)]);
  const cuts=[];for(let k=0;k<4;k++){const a=rnd()*6.28,e=k?(rnd()-0.3)*0.9:1.2;cuts.push([new V(Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e)),(0.7+0.15*rnd())*0.8])}
  const sx=1.05+0.25*rnd(),sy=0.6+0.2*rnd(),sz=0.85+0.2*rnd();
  const g=new THREE.IcosahedronGeometry(0.8,detail),P=g.attributes.position,u=new V(),q=new V(),C=new Float32Array(P.count*3);
  for(let i=0;i<P.count;i++){u.fromBufferAttribute(P,i).normalize();let n=0;for(const [d,f,ph,a] of W)n+=a*Math.sin(u.dot(d)*f*3+ph);
    q.copy(u).multiplyScalar(0.8*(1+n));for(const [c,o] of cuts){const t=q.dot(c);if(t>o)q.addScaledVector(c,-(t-o)*0.92)}
    if(q.y<-0.3)q.y=-0.3+(q.y+0.3)*0.25;q.set(q.x*sx,q.y*sy,q.z*sz);P.setXYZ(i,q.x,q.y,q.z);
    const k=(0.68+0.32*ss(-0.3,0.35,q.y))*(0.84+0.16*ss(-0.12,0.12,n));C[i*3]=C[i*3+1]=C[i*3+2]=k}
  g.setAttribute('color',new THREE.BufferAttribute(C,3));
  // smooth normals over the corners the faces share (the icosphere's faces each have their own), then UVs per face
  const fn=new V(),a=new V(),b=new V(),c=new V(),acc=new Map(),key=i=>`${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`,UV=new Float32Array(P.count*2);
  for(let i=0;i<P.count;i+=3){a.fromBufferAttribute(P,i);b.fromBufferAttribute(P,i+1);c.fromBufferAttribute(P,i+2);fn.subVectors(c,b).cross(a.clone().sub(b));
    for(let j=0;j<3;j++){const kk=key(i+j);if(!acc.has(kk))acc.set(kk,new V());acc.get(kk).add(fn)}
    const ax=Math.abs(fn.x),ay=Math.abs(fn.y),az=Math.abs(fn.z);
    for(let j=0;j<3;j++){const x=P.getX(i+j),y=P.getY(i+j),z=P.getZ(i+j),[s0,t0]=ax>=ay&&ax>=az?[z+0.37,y]:ay>=az?[x,z+0.71]:[x+0.13,y];UV[(i+j)*2]=s0*0.6;UV[(i+j)*2+1]=t0*0.6}}
  const N=g.attributes.normal;for(let i=0;i<P.count;i++){const v=acc.get(key(i)).clone().normalize();N.setXYZ(i,v.x,v.y,v.z)}
  g.setAttribute('uv',new THREE.BufferAttribute(UV,2));g.computeBoundingSphere();return g}
const ASSET_CAP={pine:600,leafy:300,rock:400},assetIMs={},assets=mapAssets?mapAssets.slice():[];
(function rocks(){
  // boulder: the photo-scanned granite (rockShape)
  const rocks=new THREE.InstancedMesh(rockShape(11,2),ROCK_MATS[0],ASSET_CAP.rock);
  // colour buffer sized to capacity up front (three r128 sizes it by the live count, which starts at 0 here)
  rocks.castShadow=true;rocks.receiveShadow=true;rocks.frustumCulled=false;
  rocks.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(rocks.instanceMatrix.count*3),3);rocks.count=0;scene.add(rocks);
  assetIMs.rock=[rocks];treeIMs.push(rocks);
  if(!assets.length)assets.push(...defaultAssets());else if(!mapSq)assets.push(...sqThings());
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
  return out.concat(sqThings())}
// Harbor Square's furniture (square.js), things like any other so the editor moves them: shade trees, benches, park
// lamps, café tables, market stalls and the bollards along the beach road. Maps saved before it (no sq in them) get
// them added once (mapSq, terrain.js). The square is laid out on x -61 (SQ.ax), the fountain at z 588 (SQ.fz)
function sqThings(){const out=[],P=Math.PI,ax=-61,fz=588,add=(t,x,z,yaw,s,c)=>out.push({t,x,z,yaw:yaw||0,s:s||1,c:c||0});
  [[-94,584],[-82,583.2],[-42,583.2],[-32,584.5],[-94.5,606.5],[-82,608.5],[-41,608.5],[-94,595],[-105,569.5],[-90,569.5],[-78,569.5],[-44,569.5]]
    .forEach(([x,z],i)=>add('leafy',x,z,i*1.7,0.72+(i%4)*0.07,(i*5)%6));
  for(const x of [-107,-97,-87,-77,-45,-35]){add('bench',x,560.2,P,0.9);add('lamp',x+5,559.2)}
  for(const x of [-92,-86,-40,-34])add('bench',x,609.9,P,0.9);for(const z of [586,592,606])add('bench',-97.2,z,P/2,0.9);
  for(const x of [-70,-52])add('bench',x,598,P,0.9);add('bench',ax-5.6,fz,P/2,0.9);add('bench',ax+5.6,fz,-P/2,0.9);
  for(const [x,z] of [[-90,580.8],[-74,580.8],[-48,580.8],[-32,580.8],[-97.6,590],[-97.6,604],[-88,610.6],[-34,610.6],[ax-2,609.5],[ax+2,609.5]])add('lamp',x,z);
  for(const [x,z] of [[-31,563.2],[-26,565.6],[-21,563.2],[-16,565.8],[-12,562.6]])add('cafe',x,z);
  for(const z of [584.5,590.5,596.5,603.5,609.2])add('stall',-30.5,z,P/2);
  for(let x=-104;x<=-8;x+=3.5){if(Math.abs(x-(ax+4))<2.5||Math.abs(x+25.5)<2.5)continue;const zc=x<-60?576-2*(x+170)/110:574;for(const s of [-1,1])add('bollard',x,zc+s*2.85)}
  return out}
// fills the instance meshes from the asset list (after any change to it): the trees go to trees.js, the boulders here
function assetsBuild(){const o=new THREE.Object3D(),c=new THREE.Color(),n={pine:0,leafy:0,rock:0},T=[];
  for(const a of assets){const k=n[a.t];if(a.hd||k===undefined||k>=ASSET_CAP[a.t])continue;const y=baseHeight(a.x,a.z);if(y<WATER-0.3)continue;n[a.t]++;
    if(a.t!=='rock'){T.push(treeEntry(a.t,a.x,a.z,a.yaw,a.s,a.c));continue}
    const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    o.position.set(a.x,y-0.18*a.s,a.z);o.rotation.set((w-0.5)*0.4,a.yaw,(w2-0.5)*0.4);o.scale.set(a.s,a.s*(0.8+0.4*w),a.s);
    o.updateMatrix();assetIMs.rock[0].setMatrixAt(k,o.matrix);const v=0.85+0.3*w2;c.setRGB(v,v,v);assetIMs.rock[0].setColorAt(k,c)}
  const im=assetIMs.rock[0];im.count=n.rock;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;
  treeGroup('main',T);
  // the things placed from the editor's catalogue (props.js, which loads later)
  if(typeof propsBuild==='function')propsBuild();if(typeof fxBuild==='function')fxBuild()}

// ---------- the town's boulders ----------
// Clusters of a big boulder, a medium one or two and a scatter of small stones on the town's open grass (the mainland,
// RT_BOX): one where the hash of an 18 m square says so, kept to natural ground (no paint, roads, streets, sidewalks,
// walk pads, other solids, tree trunks, water or steep ground), the same on every device. Each stone stands in a ring
// of the field's own grass clumps (the tuft shapes and material above, so they sway, thin out with distance and follow
// the Grass quality setting the same), with tall grass and a weed or two hugging its foot. The big and medium boulders
// are solids (SOLIDS, rk:1). Built once every script has loaded (the town's streets and solids are there then), and
// again by edRefresh over the town
const RT_BOX=[-180,180,548,800],RT_CELL=18;
const rtShapes=[rockShape(21,2),rockShape(22,2),rockShape(23,2),rockShape(24,1),rockShape(25,1)];
const rtIMs=rtShapes.map((g,i)=>ROCK_MATS.map(m=>{const im=new THREE.InstancedMesh(g,m,i<3?150:400);im.count=0;im.frustumCulled=false;im.castShadow=true;im.receiveShadow=true;
  im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(im.instanceMatrix.count*3),3);scene.add(im);return im}));
let rtTuftMs=[];
function rocksTown(){for(let i=SOLIDS.length-1;i>=0;i--)if(SOLIDS[i].rk)SOLIDS.splice(i,1);
  for(const im of rtTuftMs){tufts.remove(im);tuftMeshes.splice(tuftMeshes.indexOf(im),1);im.geometry.dispose()}rtTuftMs=[];
  const trunks=[];for(const g in treeGroups)for(const a of treeGroups[g])if(a.x>RT_BOX[0]-5&&a.x<RT_BOX[1]+5&&a.z>RT_BOX[2]-5&&a.z<RT_BOX[3]+5)trunks.push(a);
  const others=SOLIDS.slice();
  // open natural ground r round x, z
  const open=(x,z,r)=>{if(baseHeight(x,z)<WATER+2||paintAt(x,z)||Math.abs(roadOff(x,z))<ROAD_W/2+2.5||raiseAt(x,z)>0.01)return false;
    for(let k=0;k<6;k++){const a=k*1.047,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(raiseAt(px,pz)>0.01||paintAt(px,pz)||Math.abs(baseHeight(px,pz)-baseHeight(x,z))>0.5)return false}
    for(const t of trunks)if(Math.hypot(t.x-x,t.z-z)<r+2)return false;
    for(const q of others)if(Math.abs(x-q.x)<q.hx+r+2&&Math.abs(z-q.z)<q.hz+r+2)return false;
    return true};
  const o=new THREE.Object3D(),col=new THREE.Color(),n=rtIMs.map(()=>[0,0]),T=[];
  // a stone of shape k (0 to 2 big, 3 and 4 small) at x, z, size s, sunk by sink; its ring of clumps
  const put=(k,x,z,s,sink,w,h)=>{const m=h<0.5?0:1,im=rtIMs[k][m];if(n[k][m]>=im.instanceMatrix.count)return;
    o.position.set(x,baseHeight(x,z)-sink*s,z);o.rotation.set((h-0.5)*0.3,h*40,(w-0.5)*0.3);o.scale.set(s,s*(0.85+0.3*w),s);o.updateMatrix();
    im.setMatrixAt(n[k][m],o.matrix);const v=0.85+0.3*w;col.setRGB(v,v,v*0.97);im.setColorAt(n[k][m],col);n[k][m]++;
    const R=0.8*s*1.1,nt=Math.round(5+14*Math.min(1.6,s));
    for(let i=0;i<nt;i++){const hh=hash(x*3.1+i*1.7,z*2.3-i*0.9),a=i/nt*6.283+hh*0.8,d=R*(0.7+0.65*hash(z*1.9+i,x*0.7-i)),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
      if(raiseAt(px,pz)>0.01||paintAt(px,pz))continue;T.push([px,pz,hh<0.7?0:hh<0.9?6:1,hh])}};
  for(let cx=RT_BOX[0];cx<RT_BOX[1];cx+=RT_CELL)for(let cz=RT_BOX[2];cz<RT_BOX[3];cz+=RT_CELL){const h=hash(cx*0.37+4.1,cz*0.53-2.7);if(h>0.3)continue;
    const x=cx+RT_CELL*hash(cx*1.7,cz*0.9+5),z=cz+RT_CELL*hash(cz*1.3-3,cx*0.7),s=1.0+1.0*hash(x*2.1,z*1.1);
    if(!open(x,z,1.2*s))continue;
    put(Math.floor(h/0.1)%3,x,z,s,0.2,hash(x,z+1),hash(z,x+2));SOLIDS.push({x,z,hx:0.75*s,hz:0.75*s,rk:1});
    // a medium one alongside, and the small stones round them
    const nm=hash(x+3,z)<0.6?1:0,nsm=2+Math.floor(hash(x,z+3)*5);
    for(let i=0;i<nm;i++){const a=hash(x*0.3+i,z)*6.28,d=1.2*s+0.6,mx=x+Math.cos(a)*d,mz=z+Math.sin(a)*d,ms=s*(0.4+0.25*hash(mx,mz));
      if(!open(mx,mz,0.9*ms))continue;put((Math.floor(h/0.1)+1)%3,mx,mz,ms,0.25,hash(mx,mz+1),hash(mz,mx+2));SOLIDS.push({x:mx,z:mz,hx:0.75*ms,hz:0.75*ms,rk:1})}
    for(let i=0;i<nsm;i++){const a=hash(x*0.7-i,z*1.3+i)*6.28,d=1.0*s+0.4+1.8*hash(x+i,z-i),sx=x+Math.cos(a)*d,sz=z+Math.sin(a)*d;
      if(raiseAt(sx,sz)>0.01||paintAt(sx,sz)||Math.abs(roadOff(sx,sz))<ROAD_W/2+1)continue;put(3+(i&1),sx,sz,0.18+0.22*hash(sx,sz),0.3,hash(sx,sz+1),hash(sz,sx+2))}}
  rtIMs.forEach((P,k)=>P.forEach((im,m)=>{im.count=n[k][m];im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true}));
  // the clumps, in 32 m squares by shape like the field's (tuftLod draws each square's share by its distance)
  const GRN=[[0.32,0.52,0.22],[0.25,0.49,0.23],null,null,null,null,[0.5,0.53,0.27]],sq=new Map();
  for(const t of T){const kk=`${Math.floor(t[0]/32)},${Math.floor(t[1]/32)},${t[2]}`;if(!sq.has(kk))sq.set(kk,[]);sq.get(kk).push(t)}
  for(const [kk,L] of sq){const k=L[0][2],G=TUFT_GQ[tuftQ][k],g=new THREE.BufferGeometry();
    for(const a of ['position','color','normal','aHead'])g.setAttribute(a,G.attributes[a]);g.setIndex(G.index);
    const A=new Float32Array(L.length*4);g.setAttribute('aTuft',new THREE.InstancedBufferAttribute(A,4));
    const im=new THREE.InstancedMesh(g,tuftMats[k],L.length);im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(L.length*3),3);im.receiveShadow=true;im.frustumCulled=false;
    let sx=0,sz=0;L.forEach(([x,z,,hh],i)=>{sx+=x;sz+=z;const s=k===6?0.55+0.4*hh:0.95+0.6*hh;
      o.position.set(x,hAt(x,z)-0.02,z);o.rotation.set((hh-0.5)*0.24,hh*50,(hash(x,z)-0.5)*0.24);o.scale.set(s,s*(0.85+0.4*hash(z,x)),s);o.updateMatrix();im.setMatrixAt(i,o.matrix);
      const c=GRN[k],v=0.85+0.3*hash(x*2,z*2),dry=k===0&&hash(x*5,z*5)<0.3?0.5:0;col.setRGB((c[0]+(0.68-c[0])*dry)*v,(c[1]+(0.6-c[1])*dry)*v,(c[2]+(0.33-c[2])*dry)*v);im.setColorAt(i,col);
      // seed heads on some of the grass, the weeds' flowers yellow
      const hd=k===0&&hh<0.25?[0.8,0.76,0.48]:k===1?[1,0.84,0.18]:k===6?[0.84,0.78,0.6]:null;
      A[i*4]=(i+0.5)/L.length;A[i*4+1]=hd?hd[0]:-1;A[i*4+2]=hd?hd[1]:0;A[i*4+3]=hd?hd[2]:0});
    Object.assign(im.userData,{cx:sx/L.length,cz:sz/L.length,n:L.length,k});tuftMeshes.push(im);tufts.add(im);rtTuftMs.push(im)}}
document.addEventListener('DOMContentLoaded',rocksTown);
