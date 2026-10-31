// Corley's Island: the sky in a shower. A layer of cloud about 1,400 ft up drifts over the island with the wind: a few
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
  if(f>0.01){if(hemiL)hemiL.intensity+=f*1.4*LI;scene.background.lerp(stormFog.setRGB(0.85,0.88,0.95),Math.min(0.6,f*0.5));scene.fog.color.copy(scene.background)}}
