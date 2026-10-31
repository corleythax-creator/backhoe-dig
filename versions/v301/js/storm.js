// Corley's Island: the sky in a shower. Heaps of cloud (in 3D from Medium up, with their shadows on the land) drift over the island with the wind: a few
// fair-weather clouds on a dry day, rolling in grey and then dark and solid before a shower (weather.c, rain.js), and
// clearing after. While the sky is heavy, grey curtains of rain hang under it out over the lake and drift with it, so a
// shower can be seen coming. In a hard shower lightning strikes now and then somewhere off the island: the bolt, the
// flash on the clouds and the land, and the thunder after it, a second for about every 1,100 ft away.
// How it looks only: the weather itself is rain.js. Game scripts share one global scope and load in index.html order;
// see CLAUDE.md.

// ---------- the clouds ----------
const CL_Y=420,CL_S=5200;
const STORM_GLSL='float sh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
  'float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(sh(i),sh(i+vec2(1,0)),f.x),mix(sh(i+vec2(0,1)),sh(i+1.0),f.x),f.y);}\n'+
  'float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*sn(p);p=p*2.03+17.1;a*=0.5;}return s;}\n';
const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
  uniforms:{uC:{value:0.18},uQ:{value:1},uT:{value:0},uOff:{value:new THREE.Vector2()},uCam:{value:new THREE.Vector3()},uFog:{value:new THREE.Color()},uSunI:rainSunI,uFlash:{value:0},uDay:{value:DAY.cloud}},
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uC,uQ,uT,uSunI,uFlash;uniform vec2 uOff;uniform vec3 uCam,uFog,uDay;varying vec3 vW;\n'+STORM_GLSL+
    // density: billowing noise thresholded by how much of the sky is covered; thick cloud is dark underneath in a storm
    'void main(){vec2 p=(vW.xz+uOff)/950.0;float d=fbm(p);if(uQ>0.5)d=d*0.75+0.25*fbm(p*3.3+vec2(uT*0.004,0.0));\n'+
    'float th=0.78-0.62*uC,den=smoothstep(th,th+0.22-0.12*uC,d);\n'+
    'vec3 lit=vec3(1.0,0.98,0.95)*(0.72+0.28*uSunI),dark=mix(vec3(0.6,0.63,0.67),vec3(0.2,0.22,0.25),smoothstep(0.5,1.0,uC));\n'+
    'vec3 col=mix(lit,dark,smoothstep(0.1,0.9,den)*(0.35+0.65*uC)*(0.7+0.3*smoothstep(0.55,0.95,d)))*uDay+uFlash*vec3(0.75,0.8,1.0)*den;\n'+
    'float dist=length(vW.xz-uCam.xz);col=mix(col,uFog,smoothstep(400.0,2200.0,dist)*0.8);\n'+
    'gl_FragColor=vec4(col,den*(1.0-smoothstep(1500.0,2350.0,dist)));}'});
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(CL_S,CL_S,1,1).rotateX(-Math.PI/2),cloudMat);
clouds.frustumCulled=false;clouds.renderOrder=-0.9;scene.add(clouds);

// ---------- the clouds in 3D (Medium and up, gfx.js cloudQ; the flat layer above is Low's and VR's) ----------
// Real heaps of cloud with a base about 1,500 ft up (Cloud base, TUNE) that tower higher where they are thickest, drawn
// by marching each ray through the layer: a cover map (where the clouds are, its values spread evenly 0 to 1, so the
// share of sky covered is just 1 - the threshold) shaped by billowing 3D noise, lit by the sun through the cloud toward
// it (dark undersides, bright rims round the sun) and by the sky. The layer curves down with the earth (a small earth,
// so it meets the horizon in about 4 miles), fades into the haze with distance, and is drawn at a half or a third of
// the screen's size (it is soft) before each frame, blended with the frames before, then laid over the sky behind everything nearer. The
// ground beneath gets the same cover map as moving shadows (CS_U, core.js), cast along the sun's slant.
const CL_MAP=6000,CL_R=40000,CL_MAXD=14000,CL_Q=[null,{d:3,n:28,l:3,det:0},{d:2,n:40,l:4,det:1},{d:2,n:64,l:6,det:1}];
const clV={on:false,q:0,mat:{},done:false,rt:null,frame:0,off3:new THREE.Vector3()};
// the cover map: tiling noise, smooth and lumpy, ranked so its values are spread evenly over 0 to 1
function clMakeMap(){const N=512,v=new Float32Array(N*N),hs=(x,y,s)=>{const h=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return h-Math.floor(h)};
  const vn=(x,y,p,s)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),w=fy*fy*(3-2*fy),a=(ix%p+p)%p,b=(iy%p+p)%p,a1=(a+1)%p,b1=(b+1)%p;
    return (hs(a,b,s)*(1-u)+hs(a1,b,s)*u)*(1-w)+(hs(a,b1,s)*(1-u)+hs(a1,b1,s)*u)*w};
  const wo=(x,y,p,s)=>{const ix=Math.floor(x),iy=Math.floor(y);let m=9;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=ix+i,cy=iy+j,a=(cx%p+p)%p,b=(cy%p+p)%p;
    const dx=cx+hs(a,b,s+1)-x,dy=cy+hs(a,b,s+2)-y;m=Math.min(m,dx*dx+dy*dy)}return Math.sqrt(m)};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,w=y/N;let f=0,a=0.5;for(let o=0,p=4;o<5;o++,p*=2){f+=a*vn(u*p,w*p,p,o);a*=0.5}
    v[y*N+x]=0.5*f+0.35*(1-wo(u*10,w*10,10,9))+0.15*(1-wo(u*24,w*24,24,19))}
  const ix=Array.from(v.keys()).sort((a,b)=>v[a]-v[b]),d=new Uint8Array(N*N);ix.forEach((k,r)=>d[k]=r*255/(N*N-1));
  const t=new THREE.DataTexture(d,N,N,THREE.RedFormat,THREE.UnsignedByteType);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t}
// the billows: a tiling 64-cube of cloudy noise, r the big lumps (smooth noise carved by cells), g the fine detail
function clMakeNoise(){const N=64,n=N*N*N,hs=(i,s)=>{const h=Math.sin(i*12.9898+s*78.233)*43758.5453;return h-Math.floor(h)};
  const wor=g=>{const out=new Float32Array(n),c=N/g;for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){const fx=(x+0.5)/c,fy=(y+0.5)/c,fz=(z+0.5)/c,
      ix=Math.floor(fx),iy=Math.floor(fy),iz=Math.floor(fz);let m=9;
      for(let k=-1;k<=1;k++)for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=ix+i,cy=iy+j,cz=iz+k,id=(((cz%g+g)%g)*g+((cy%g+g)%g))*g+((cx%g+g)%g);
        const dx=cx+hs(id,g)-fx,dy=cy+hs(id,g+1)-fy,dz=cz+hs(id,g+2)-fz,dd=dx*dx+dy*dy+dz*dz;if(dd<m)m=dd}
      out[(z*N+y)*N+x]=Math.min(1,Math.sqrt(m))}return out};
  const vn=p=>{const out=new Float32Array(n),c=N/p;for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){const fx=x/c,fy=y/c,fz=z/c,ix=Math.floor(fx),iy=Math.floor(fy),iz=Math.floor(fz);
      const u=fx-ix,v=fy-iy,w=fz-iz,su=u*u*(3-2*u),sv=v*v*(3-2*v),sw=w*w*(3-2*w),h=(a,b,cc)=>hs((((iz+cc)%p)*p+((iy+b)%p))*p+((ix+a)%p),p*7);
      out[(z*N+y)*N+x]=((h(0,0,0)*(1-su)+h(1,0,0)*su)*(1-sv)+(h(0,1,0)*(1-su)+h(1,1,0)*su)*sv)*(1-sw)+((h(0,0,1)*(1-su)+h(1,0,1)*su)*(1-sv)+(h(0,1,1)*(1-su)+h(1,1,1)*su)*sv)*sw}return out};
  const w4=wor(4),w8=wor(8),w16=wor(16),v4=vn(4),v8=vn(8),v16=vn(16),d=new Uint8Array(n*2);
  for(let i=0;i<n;i++){const wf=1-(0.625*w4[i]+0.25*w8[i]+0.125*w16[i]),pf=0.55*v4[i]+0.3*v8[i]+0.15*v16[i];
    // smooth noise carved by the cells: round heaps, not blobs
    const r=Math.min(1,Math.max(0,wf+(pf-0.5)*0.8));d[i*2]=r*255;d[i*2+1]=(1-(0.6*w8[i]+0.4*w16[i]))*255}
  const t=new THREE.Data3DTexture(d,N,N,N);t.format=THREE.RGFormat;t.type=THREE.UnsignedByteType;
  t.wrapS=t.wrapT=t.wrapR=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.unpackAlignment=1;t.needsUpdate=true;return t}
const clU={uWx:CS_U.uCSMap,uNz:{value:null},uCam:{value:new THREE.Vector3()},uPI:{value:new THREE.Matrix4()},uCW:{value:new THREE.Matrix4()},
  uSun:{value:new THREE.Vector3()},uSunC:{value:new THREE.Color()},uAmbT:{value:new THREE.Color()},uAmbB:{value:new THREE.Color()},uFog:{value:new THREE.Color()},
  uOff:{value:new THREE.Vector2()},uOff3:{value:new THREE.Vector3()},uTh:{value:0.8},uW:{value:0.1},uDen:{value:0.02},uFlash:{value:0},uFrame:{value:0},
  uBase:{value:460},uTop:{value:1300},uHaze:{value:5000}};
function clVolMat(q){const Q=CL_Q[q];return new THREE.ShaderMaterial({uniforms:clU,depthTest:false,depthWrite:false,
  defines:{STEPS:Q.n,LSTEPS:Q.l,DET:Q.det,CL_R:CL_R.toFixed(1),CL_MAXD:CL_MAXD.toFixed(1),CL_MAP:CL_MAP.toFixed(1)},
  vertexShader:'uniform mat4 uPI,uCW;varying vec3 vD;void main(){vec4 v=uPI*vec4(position.xy,1.0,1.0);vD=mat3(uCW)*(v.xyz/v.w);gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:'precision highp sampler3D;uniform sampler2D uWx;uniform sampler3D uNz;uniform vec3 uCam,uSun,uSunC,uAmbT,uAmbB,uFog,uOff3;uniform vec2 uOff;\n'+
    'uniform float uTh,uW,uDen,uFlash,uFrame,uBase,uTop,uHaze;varying vec3 vD;\n'+
    'float hg(float c,float g){float g2=g*g;return (1.0-g2)/pow(1.0+g2-2.0*g*c,1.5);}\n'+
    'vec2 sph(vec3 o,vec3 d,float r){float b=dot(o,d),c=dot(o,o)-r*r,h=b*b-c;if(h<0.0)return vec2(-1.0);h=sqrt(h);return vec2(-b-h,-b+h);}\n'+
    // how thick the cloud is at p (per m), h its height through the layer (0 base, 1 top)
    // a heap is as tall as its cover is deep (a dome over a flat base); the billows eat into its edges, most near the top
    'float dens(vec3 p,float h,bool det){float c=clamp((texture(uWx,(p.xz+uOff)/CL_MAP).r-uTh)/uW,0.0,1.0);if(c<=0.0||h<0.0||h>1.0)return 0.0;\n'+
    '  float d=smoothstep(0.0,0.05,h)*smoothstep(0.0,0.25,sqrt(c)*(1.0-0.25*c)-h*0.8);if(d<=0.0)return 0.0;\n'+
    '  vec2 n=texture(uNz,(p+uOff3)/900.0).rg;float a=(1.0-n.r)*(0.55+0.3*h);d=(d-a)/(1.0-a);\n'+
    '  if(det&&d>0.0)d-=(1.0-texture(uNz,(p+uOff3*1.6)/420.0).g)*0.5*(1.0-d)*(1.0-0.4*h);return max(d,0.0)*uDen;}\n'+
    'void main(){vec3 d=normalize(vD),C=vec3(uCam.x,-CL_R,uCam.z),o=uCam-C;float r0=length(o);\n'+
    '  vec2 a=sph(o,d,CL_R+uBase),b=sph(o,d,CL_R+uTop);float t0,t1;\n'+
    '  if(r0<CL_R+uBase){t0=a.y;t1=b.y;}else if(r0<CL_R+uTop){t0=0.0;t1=a.x>0.0?a.x:b.y;}else{if(b.x<0.0){gl_FragColor=vec4(0);return;}t0=b.x;t1=a.x>0.0?a.x:b.y;}\n'+
    '  t1=min(t1,CL_MAXD);if(t1<=t0){gl_FragColor=vec4(0);return;}\n'+
    '  float dt=(t1-t0)/float(STEPS),jit=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453+uFrame*0.618034);\n'+
    '  float cs=dot(d,uSun),ph=0.7*hg(cs,0.6)+0.3*hg(cs,-0.25),T=1.0,tw=0.0,ws=0.0,t=t0+dt*jit;vec3 col=vec3(0.0);\n'+
    // long strides through clear air, short ones inside a cloud
    '  float di=max(10.0,dt*0.3);\n'+
    '  for(int i=0;i<STEPS*3;i++){if(t>t1)break;vec3 p=uCam+d*t;float h=(length(p-C)-CL_R-uBase)/(uTop-uBase),s=dens(p,h,DET==1),st=s>0.00005?di:dt;\n'+
    '    if(s>0.00005){float od=0.0,ls=26.0*(0.7+0.6*jit);vec3 q=p;\n'+
    '      for(int j=0;j<LSTEPS;j++){q+=uSun*ls;od+=dens(q,(length(q-C)-CL_R-uBase)/(uTop-uBase),false)*ls;ls*=1.6;}\n'+
    // light through the cloud toward the sun, with a softer second lobe for light scattered many times
    '      float lt=max(exp(-od),0.6*exp(-0.22*od)),pw=1.0-0.55*exp(-od*1.5);\n'+
    '      vec3 L=uSunC*lt*ph*pw+mix(uAmbB,uAmbT,clamp(h*1.4,0.0,1.0));float ts=exp(-s*st);\n'+
    '      col+=T*L*(1.0-ts);tw+=T*(1.0-ts)*t;ws+=T*(1.0-ts);T*=ts;if(T<0.015)break;}\n'+
    '    t+=st;}\n'+
    '  float A=1.0-T;if(A<0.002){gl_FragColor=vec4(0);return;}\n'+
    '  float md=tw/max(ws,1e-5),fd=1.0-smoothstep(CL_MAXD*0.55,CL_MAXD,md);\n'+
    '  col=mix(col,uFog*A,1.0-exp(-md/uHaze));col+=uFlash*vec3(0.75,0.8,1.0)*A;\n'+
    '  gl_FragColor=vec4(col*fd,A*fd);}'})}
// laid over the sky: a ball round the camera drawn at the far plane, so anything nearer (the mountains too) hides the clouds
const clLay=new THREE.Mesh(new THREE.SphereGeometry(2300,32,16),new THREE.ShaderMaterial({uniforms:{uRT:{value:null},uRes:{value:new THREE.Vector2(1,1)}},
  transparent:true,depthWrite:false,fog:false,side:THREE.BackSide,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
  vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w*0.99999;}',
  fragmentShader:'uniform sampler2D uRT;uniform vec2 uRes;void main(){gl_FragColor=texture(uRT,gl_FragCoord.xy/uRes);}'}));
clLay.frustumCulled=false;clLay.renderOrder=-0.9;clLay.visible=false;scene.add(clLay);
const clQuad=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3))),
  clScene=new THREE.Scene(),clCam=new THREE.Camera(),clSz=new THREE.Vector2();
clQuad.frustumCulled=false;clScene.add(clQuad);
// each frame's march is blended with the last frame's, found again by direction (the clouds are far off, so turning the
// camera is what moves them) and held to the new frame's neighbours so nothing smears: the march's grain averages out
const clHist={rt:[null,null],i:0,fresh:true,pvp:new THREE.Matrix4(),vr:new THREE.Matrix4()};
const clBlend=new THREE.ShaderMaterial({uniforms:{tNew:{value:null},tOld:{value:null},uPI:clU.uPI,uCW:clU.uCW,uPVP:{value:clHist.pvp},uK:{value:0},uTx:{value:new THREE.Vector2()}},
  depthTest:false,depthWrite:false,
  vertexShader:'uniform mat4 uPI,uCW;varying vec3 vD;varying vec2 vUv;void main(){vec4 v=uPI*vec4(position.xy,1.0,1.0);vD=mat3(uCW)*(v.xyz/v.w);vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:'uniform sampler2D tNew,tOld;uniform mat4 uPVP;uniform float uK;uniform vec2 uTx;varying vec3 vD;varying vec2 vUv;\n'+
    'void main(){vec4 c=texture(tNew,vUv);if(uK<=0.0){gl_FragColor=c;return;}vec4 lo=c,hi=c;\n'+
    '  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec4 n=texture(tNew,vUv+vec2(i,j)*uTx);lo=min(lo,n);hi=max(hi,n);}\n'+
    '  vec4 q=uPVP*vec4(normalize(vD),0.0);if(q.w<=0.0){gl_FragColor=c;return;}vec2 uv=q.xy/q.w*0.5+0.5;\n'+
    '  if(uv.x<0.0||uv.y<0.0||uv.x>1.0||uv.y>1.0){gl_FragColor=c;return;}\n'+
    '  gl_FragColor=mix(c,clamp(texture(tOld,uv),lo,hi),uK);}'});
// before each frame is drawn (post.js postRender): the clouds into clV.rt from the camera as it now is, then blended
function clVolRender(){if(!clV.on){clHist.fresh=true;return}const Q=CL_Q[clV.q];renderer.getDrawingBufferSize(clSz);
  const w=Math.max(1,Math.round(clSz.x/Q.d)),h=Math.max(1,Math.round(clSz.y/Q.d));
  if(!clV.rt||clV.rt.width!==w||clV.rt.height!==h){for(const r of [clV.rt,...clHist.rt])if(r)r.dispose();
    const mk=()=>{const r=new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,type:THREE.HalfFloatType});r.texture.minFilter=r.texture.magFilter=THREE.LinearFilter;return r};
    clV.rt=mk();clHist.rt=[mk(),mk()];clHist.fresh=true}
  clLay.material.uniforms.uRes.value.copy(clSz);
  camera.updateMatrixWorld();clU.uCam.value.copy(camera.position);clU.uPI.value.copy(camera.projectionMatrixInverse);clU.uCW.value.copy(camera.matrixWorld);
  clU.uFrame.value=clV.frame=(clV.frame+1)%64;clLay.position.copy(camera.position);
  clQuad.material=clV.mat[clV.q]||(clV.mat[clV.q]=clVolMat(clV.q));
  const t=renderer.getRenderTarget(),xr=renderer.xr.enabled;renderer.xr.enabled=false;renderer.setRenderTarget(clV.rt);renderer.render(clScene,clCam);
  const bu=clBlend.uniforms,a=clHist.rt[clHist.i],b=clHist.rt[1-clHist.i];bu.tNew.value=clV.rt.texture;bu.tOld.value=b.texture;
  bu.uK.value=clHist.fresh||clV.q!==clHist.q?0:0.85;bu.uTx.value.set(1/w,1/h);clQuad.material=clBlend;renderer.setRenderTarget(a);renderer.render(clScene,clCam);
  clLay.material.uniforms.uRT.value=a.texture;clHist.i=1-clHist.i;clHist.fresh=false;clHist.q=clV.q;
  // this frame's view, turned only, to find its pixels again next frame
  clHist.vr.copy(camera.matrixWorldInverse).setPosition(0,0,0);clHist.pvp.multiplyMatrices(camera.projectionMatrix,clHist.vr);
  renderer.setRenderTarget(t);renderer.xr.enabled=xr}
const clSunC=new THREE.Color();
function clVolTick(dt,cv,off){const q=gfxCur.cloudQ|0,on=q>0&&!renderer.xr.isPresenting&&!!CL_Q[q];
  if(on&&!clU.uNz.value){CS_U.uCSMap.value=clMakeMap();clU.uNz.value=clMakeNoise()}
  clV.on=on;clV.q=q;clLay.visible=on;clouds.visible=!on;
  if(!on){CS_U.uCSA.value.w=0;return}
  // the share of sky covered: a few fair-weather heaps on a dry day, a solid grey deck before a shower
  const cover=0.06+0.94*Math.pow(cv,1.15),th=1-cover,base=TU.clBase,thick=TU.clDense;
  clU.uTh.value=Math.max(0.0,th-0.04);clU.uW.value=0.22+0.1*cv;clU.uOff.value.copy(off);
  clU.uOff3.value.x=off.x*0.25;clU.uOff3.value.z=off.y*0.25;clU.uOff3.value.y=(clU.uOff3.value.y+dt*1.2)%1e5;
  clU.uBase.value=base-80*ss(0.5,1,cv);clU.uTop.value=base+420+700*ss(0.3,0.9,cv);
  clU.uDen.value=0.012*thick*(1+2.5*ss(0.4,1,cv));clU.uHaze.value=4200*gfxFog*(1-0.55*ss(0.4,1,cv));
  // lit by the sun (or the moon at night) as it reaches the land, rain and all, and by the sky's own colour
  clU.uSun.value.copy(LIGHT_DIR);clSunC.copy(sun.color).multiplyScalar(1.5*sun.intensity/SUN_I);clU.uSunC.value.copy(clSunC);
  const amb=clU.uAmbT.value.copy(skyU.uHor.value).lerp(skyU.uTop.value,0.45).multiplyScalar(1.05*(1-0.45*ss(0.5,1,cv)));
  amb.lerp(DAY.cloud,0.25*DAY.lum);clU.uAmbB.value.copy(amb).multiplyScalar(0.5);
  clU.uFog.value.copy(scene.fog.color);clU.uFlash.value=cloudMat.uniforms.uFlash.value;
  // the shadows: the same cover cast down the sun's slant; softer once the whole sky is grey (the sun is gone then)
  const sy=Math.max(0.12,LIGHT_DIR.y),S=CS_U;S.uCSA.value.set(off.x,off.y,1/CL_MAP,TU.clShadow*ss(-2,8,dn.el)*(1-0.7*ss(0.55,0.95,cv)));
  S.uCSB.value.set(LIGHT_DIR.x/sy,LIGHT_DIR.z/sy,(clU.uBase.value+clU.uTop.value)*0.5-0.15*(clU.uTop.value-clU.uBase.value),clU.uTh.value+0.02);S.uCSW.value=0.16}

// ---------- curtains of rain out over the water ----------
// each is a tall streaky sheet turned to the camera, from the lake up into the cloud, 500 to 1,300 m out; they drift with
// the cloud and a new one starts on the far side when one passes
const CU_N=6,curtMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
  uniforms:{uA:{value:0},uT:{value:0},uFog:{value:new THREE.Color()}},
  vertexShader:'attribute float aS;varying vec2 vU;varying float vS;void main(){vU=uv;vS=aS;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float uA,uT;uniform vec3 uFog;varying vec2 vU;varying float vS;\n'+STORM_GLSL+
    'void main(){float e=smoothstep(0.0,0.3,vU.x)*smoothstep(1.0,0.7,vU.x)*smoothstep(0.0,0.12,vU.y)*smoothstep(1.0,0.75,vU.y);\n'+
    'float s=fbm(vec2(vU.x*9.0+vS*7.0,vU.y*2.0+uT*0.25))*0.7+0.3*sn(vec2(vU.x*60.0+vS,vU.y*4.0+uT));e*=smoothstep(0.25,0.7,fbm(vec2(vU.x*3.0+vS*3.0,vU.y*0.7+vS)));\n'+
    'gl_FragColor=vec4(mix(uFog,vec3(0.33,0.36,0.4),0.45),uA*e*(0.45+0.55*s));}'});
const curtains=[];
for(let i=0;i<CU_N;i++){const g=new THREE.PlaneGeometry(1,1).translate(0,0.5,0);g.setAttribute('aS',new THREE.Float32BufferAttribute(new Array(4).fill(i*1.37),1));
  const m=new THREE.Mesh(g,curtMat);m.frustumCulled=false;m.renderOrder=-0.8;m.visible=false;scene.add(m);curtains.push(m)}
function curtPlace(m,c,far){const a=Math.random()*Math.PI*2,d=far?1100+Math.random()*200:500+Math.random()*800,w=180+Math.random()*260;
  m.position.set(c.x+Math.cos(a)*d,WATER,c.z+Math.sin(a)*d);m.scale.set(w,CL_Y+20-WATER,1)}

// ---------- lightning ----------
const boltMat=new THREE.LineBasicMaterial({color:0xeef3ff,transparent:true,opacity:1,fog:false,blending:THREE.AdditiveBlending,depthWrite:false});
const bolt=new THREE.LineSegments(new THREE.BufferGeometry(),boltMat);bolt.frustumCulled=false;bolt.visible=false;bolt.renderOrder=-0.7;scene.add(bolt);
// a jagged line from a to b, halving each piece and pushing its middle aside; a couple of shorter forks off it
function boltPath(ax,ay,az,bx,by,bz,rough,out){let pts=[[ax,ay,az],[bx,by,bz]];
  for(let l=0;l<6;l++){const n=[pts[0]];for(let i=1;i<pts.length;i++){const p=pts[i-1],q=pts[i],len=Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]);
      n.push([(p[0]+q[0])/2+(Math.random()-0.5)*len*rough,(p[1]+q[1])/2+(Math.random()-0.5)*len*rough*0.3,(p[2]+q[2])/2+(Math.random()-0.5)*len*rough]);n.push(q)}pts=n}
  for(let i=1;i<pts.length;i++)out.push(...pts[i-1],...pts[i]);return pts}
let lgT=20,lgAge=9,lgPulse=[];
function lightning(){const c=camera.position,a=Math.random()*Math.PI*2,d=450+Math.random()*2000,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,out=[];
  const pts=boltPath(x,CL_Y,z,x+(Math.random()-0.5)*120,WATER,z+(Math.random()-0.5)*120,0.45,out);
  for(let f=0;f<2;f++){const p=pts[8+(Math.random()*30|0)],l=60+Math.random()*120;boltPath(p[0],p[1],p[2],p[0]+(Math.random()-0.5)*l,p[1]-l,p[2]+(Math.random()-0.5)*l,0.5,out)}
  bolt.geometry.dispose();bolt.geometry=new THREE.BufferGeometry();bolt.geometry.setAttribute('position',new THREE.Float32BufferAttribute(out,3));
  // two or three flickers over a fifth of a second
  lgAge=0;lgPulse=[0,0.07+Math.random()*0.05,0.16+Math.random()*0.08].slice(0,2+(Math.random()<0.6?1:0));
  stats.bolts++;if(!stats.boltNear||d<stats.boltNear)stats.boltNear=d;statDirty=true;
  if(typeof sndThunder==='function')sndThunder(d)}

// ---------- every frame (from rainFxTick, after it sets the sky and the lights) ----------
const STORM_WD=new THREE.Vector2(0.8,0.6),stormFog=new THREE.Color();
function stormTick(dt){const c=camera.position,cv=weather.c,r=weather.r,u=cloudMat.uniforms;u.uQ.value=gfxCur.cloudQ===0?0:1;
  u.uC.value=cv;u.uT.value=(u.uT.value+dt)%10000;u.uOff.value.addScaledVector(STORM_WD,-dt*(4+TU.rainWind*3));
  u.uCam.value.copy(c);u.uFog.value.copy(scene.fog.color);clouds.position.set(c.x,CL_Y,c.z);
  // under a heavy sky the blue goes out of the dome down to the horizon
  sky.material.color.lerp(stormFog.setRGB(0.72,0.75,0.78),0.75*ss(0.45,1,cv));
  // the curtains: only while the sky is heavy, and fainter once the rain is here (it is all round you then)
  const ca=0.55*ss(0.55,0.95,cv)*(1-0.6*ss(0.2,0.8,r));curtMat.uniforms.uA.value=ca;curtMat.uniforms.uT.value=(curtMat.uniforms.uT.value+dt)%1000;
  curtMat.uniforms.uFog.value.copy(scene.fog.color);
  for(const m of curtains){const was=m.visible;m.visible=ca>0.01;if(!m.visible)continue;if(!was)curtPlace(m,c,false);
    m.position.x+=STORM_WD.x*dt*(4+TU.rainWind*3);m.position.z+=STORM_WD.y*dt*(4+TU.rainWind*3);
    const d=Math.hypot(m.position.x-c.x,m.position.z-c.z);if(d>1500||d<350)curtPlace(m,c,true);
    m.rotation.y=Math.atan2(c.x-m.position.x,c.z-m.position.z)}
  // lightning in a hard shower, about every 15 to 60 s
  if(r>0.55&&!bench.on&&(lgT-=dt*r)<=0){lgT=10+Math.random()*30;lightning()}
  lgAge+=dt;let f=0;for(const p of lgPulse){const t=lgAge-p;if(t>=0)f+=Math.exp(-t*22)*(t<0.05?1:0.7)}
  bolt.visible=f>0.05;boltMat.opacity=Math.min(1,f);u.uFlash.value=f;
  if(f>0.01){if(hemiL)hemiL.intensity+=f*1.4*LI;scene.background.lerp(stormFog.setRGB(0.85,0.88,0.95),Math.min(0.6,f*0.5));scene.fog.color.copy(scene.background)}
  clVolTick(dt,cv,u.uOff.value)}
