// Corley's Island: day and night (☰ menu, Time). A clock runs through the day (a whole day in TU.dayLen) and the sun and
// the moon stand where they really would over the lake for that date and time (Lake Ouachita in Arkansas, on Central
// time), so the shadows fall the way they would there: long from the east in the morning, short at noon, long from the
// west at sunset, and from the moon at night. The sky goes through a golden hour and dusk to a night of stars that turn
// about the pole, the Milky Way, the moon in its real phase and now and then a shooting star. As the sun goes down the
// street and bridge lamps, the light towers, the lanterns and the windows come on, the machine you are in (or the
// worker's headlamp) lights the way, fireflies come out over the grass and the crickets and frogs start up.
// The clock is this device's own (bhd_clock), like the Graphics setting: it changes how things look and sound, never
// what the ground does. The map editor and the speed test always see the afternoon.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const DN_LAT=34.57,DN_LON=-93.4,DN_TZ='America/Chicago',DN_R=Math.PI/180;
// el, mel: the sun's and moon's height in degrees; ill: how much of the moon is lit (0-1)
const dn={t:Date.now(),run:true,el:40,mel:-10,ill:0.5,wax:true,saveT:0,saved:0,uiT:0,metT:-1,metNext:25,envSig:'',envT:0,day:'',rise:null,set:null,drag:false};
try{const c=JSON.parse(localStorage.getItem('bhd_clock')||'null');if(c&&isFinite(c.t)){dn.t=+c.t;dn.run=c.run!==false}}catch(e){}
dn.saved=dn.t;

// ---------- the clock, in Central time ----------
let dnFmt=null,dnHM=null,dnDayF=null,dnDateF=null;
try{dnFmt=new Intl.DateTimeFormat('en-US',{timeZone:DN_TZ,hour:'numeric',minute:'2-digit'});
  dnHM=new Intl.DateTimeFormat('en-US',{timeZone:DN_TZ,hourCycle:'h23',hour:'2-digit',minute:'2-digit'});
  dnDayF=new Intl.DateTimeFormat('en-US',{timeZone:DN_TZ,weekday:'short',month:'short',day:'numeric'});
  dnDateF=new Intl.DateTimeFormat('en-US',{timeZone:DN_TZ,month:'short',day:'numeric',year:'numeric'})}catch(e){}
const dnDate=t=>dnDateF?dnDateF.format(t):new Date(t).toDateString();
const dnTime=t=>dnFmt?dnFmt.format(t):new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
// minutes after midnight on the lake's clock
function dnMin(t){if(!dnHM){const d=new Date(t);return d.getHours()*60+d.getMinutes()+d.getSeconds()/60}
  const [h,m]=dnHM.format(t).split(':');return (+h%24)*60+(+m)+(t%60000)/60000}
function dnSave(){dn.saved=dn.t;try{localStorage.setItem('bhd_clock',JSON.stringify({t:Math.round(dn.t),run:dn.run}))}catch(e){}}

// ---------- where the sun and the moon are (low-precision almanac formulas, good to a fraction of a degree) ----------
// n: days since noon on 1 Jan 2000 (UTC); [right ascension, declination] in radians
const dnDays=t=>t/86400000-10957.5,dnEps=n=>(23.439-4e-7*n)*DN_R;
function dnSunRD(n){const g=(357.528+0.9856003*n)*DN_R,l=(280.46+0.9856474*n+1.915*Math.sin(g)+0.02*Math.sin(2*g))*DN_R,e=dnEps(n);
  return [Math.atan2(Math.cos(e)*Math.sin(l),Math.cos(l)),Math.asin(Math.sin(e)*Math.sin(l))]}
function dnMoonRD(n){const L=(218.316+13.176396*n)*DN_R,M=(134.963+13.064993*n)*DN_R,F=(93.272+13.22935*n)*DN_R,
  l=L+6.289*DN_R*Math.sin(M),b=5.128*DN_R*Math.sin(F),e=dnEps(n);
  return [Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l)),Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l))]}
// local sidereal time (radians): how far the sky has turned over the lake
const dnLST=n=>(280.46061837+360.98564736629*n+DN_LON)*DN_R;
// a sky position into the world: x east, y up, z south
function dnDir(rd,lst,out){const ha=lst-rd[0],f=DN_LAT*DN_R,cd=Math.cos(rd[1]);
  return out.set(-cd*Math.sin(ha),Math.sin(f)*Math.sin(rd[1])+Math.cos(f)*cd*Math.cos(ha),Math.sin(f)*cd*Math.cos(ha)-Math.cos(f)*Math.sin(rd[1]))}
const dnV=new THREE.Vector3();
function dnSunEl(t){const n=dnDays(t);return Math.asin(dnDir(dnSunRD(n),dnLST(n),dnV).y)/DN_R}
// sunrise and sunset on the day of t (the sun's top edge on the horizon, -0.83°)
function dnRiseSet(t){const t0=t-dnMin(t)*60000;let rise=null,set=null,a=dnSunEl(t0);
  for(let m=6;m<=1440;m+=6){const b=dnSunEl(t0+m*60000);if(a<-0.83&&b>=-0.83&&rise===null)rise=t0+(m-6+6*(-0.83-a)/(b-a))*60000;
    if(a>=-0.83&&b<-0.83)set=t0+(m-6+6*(a+0.83)/(a-b))*60000;a=b}
  return [rise,set]}
// the star sphere: the view turned into the sky's own frame (R^T A^T), and the galactic pole for the Milky Way
const dnRT=new THREE.Matrix3(),dnAT=new THREE.Matrix3();
{const f=DN_LAT*DN_R;dnAT.set(0,Math.cos(f),Math.sin(f), 1,0,0, 0,Math.sin(f),-Math.cos(f));
  const a=192.859*DN_R,d=27.128*DN_R;skyU.uGNP.value.set(Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d))}

// ---------- colours through the day, by the sun's height in degrees ----------
const DN_SKY=[[-18,0x02040a,0x05080f,0],[-10,0x050a18,0x0b1220,0],[-6,0x0f1d3a,0x1f2639,0x120806],[-3,0x22385f,0x4d4458,0x4a2210],
  [0,0x34548a,0xa9806a,0x8a3c18],[4,0x4271aa,0xd2ac8a,0x6e3a1c],[10,0x4a7fb6,0xc8cdcc,0x221510],[25,0x4f86bd,0xbfd2dd,0]];
const DN_SUNC=[[-2,0xff5a1e],[1,0xff7a36],[5,0xffa25e],[11,0xffcc94],[25,0xffe8cc],[45,0xfff0dc]];
const dnCa=new THREE.Color(),dnCb=new THREE.Color();
function dnKey(tab,h,col,out){if(h<=tab[0][0])return out.setHex(tab[0][col]);
  for(let i=1;i<tab.length;i++)if(h<tab[i][0]){const a=tab[i-1],b=tab[i],u=(h-a[0])/(b[0]-a[0]);return out.copy(dnCa.setHex(a[col])).lerp(dnCb.setHex(b[col]),u)}
  return out.setHex(tab[tab.length-1][col])}
const DAY={bg:new THREE.Color(0xbfd2dd),hemiI:0.5,lum:1,fogK:1,cloud:new THREE.Color(1,1,1)};
const DN_HOR0=new THREE.Color(0xbfd2dd),dnHemiSky=new THREE.Color(),dnHemiGnd=new THREE.Color(),dnMoonC=new THREE.Color(0x9db3dc),
  dnSunC=new THREE.Color(),dnMoonDir=new THREE.Vector3(),dnWarm=new THREE.Color(1,0.72,0.4);

// ---------- lamps: halos round the lit heads and the light they throw on the ground (FAM_LAMPS, family.js) ----------
function dnRadTex(stops){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
  for(const [o,a] of stops)r.addColorStop(o,'rgba(255,255,255,'+a+')');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
const dnHaloTex=dnRadTex([[0,1],[0.18,0.55],[0.5,0.12],[1,0]]),dnPoolTex=dnRadTex([[0,1],[0.4,0.55],[1,0]]);
const DN_LAMP={1:{size:2.6,col:0xffe2a8,pool:6,off:0},2:{size:3.4,col:0xfff2d8,pool:8,off:7},3:{size:1.2,col:0xffc866,pool:2.6,off:0}};
const dnHalos=[],dnPoolMat=new THREE.MeshBasicMaterial({map:dnPoolTex,color:0xffd9a0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
const dnPools=(function(){const P=[],U=[],I=[];
  for(const k of [1,2,3]){const L=FAM_LAMPS.filter(l=>l[3]===k);if(!L.length)continue;const d=DN_LAMP[k];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(L.flatMap(l=>[l[0],l[1],l[2]]),3));
    const m=new THREE.Points(g,new THREE.PointsMaterial({map:dnHaloTex,size:d.size,color:d.col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    m.userData.col=new THREE.Color(d.col);m.visible=false;scene.add(m);dnHalos.push(m);
    for(const l of L){const x=l[0],z=l[2]+d.off,y=hAt(x,z)+0.1,r=d.pool,o=P.length/3;
      P.push(x-r,y,z-r,x+r,y,z-r,x+r,y,z+r,x-r,y,z+r);U.push(0,0,1,0,1,1,0,1);I.push(o,o+2,o+1,o,o+3,o+2)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
  const m=new THREE.Mesh(g,dnPoolMat);m.visible=false;m.renderOrder=1;scene.add(m);return m})();

// ---------- headlights: one spot on the machine you are in, or the worker's headlamp ----------
// it is always in the scene (dark by day), so nothing has to compile again when it comes on
const dnHead=new THREE.SpotLight(0xfff1dc,0,46,0.6,0.55,0);dnHead.castShadow=false;scene.add(dnHead,dnHead.target);
const dnHP=new THREE.Vector3(),dnHT=new THREE.Vector3();
function dnHeadPlace(){
  // [part, lamp x y z, aim x y z] in the part's own frame, forward along +z
  const p=mode==='boat'?[btCur().g,0,0.75,2.3,0,-1,18]:mode==='heavy'?[hvCur().g,...hvCur().K.lamp]:mode==='bike'?[bike,0,1.05,0.8,0,-1,10]:mode==='truck'?[sprung,0,0.2,3.0,0,-1.6,16]:mode==='skid'?[skid,0,1.3,0.9,0,-1.2,10]:mode==='mow'?[mower,0,0.8,0.9,0,-0.9,8]:mode==='walk'?null:[house,0,1.75,0.7,0,-0.8,14];
  if(p){p[0].localToWorld(dnHP.set(p[1],p[2],p[3]));p[0].localToWorld(dnHT.set(p[4],p[5],p[6]))}
  else{const fx=Math.sin(wk.view),fz=Math.cos(wk.view);dnHP.set(wk.x+fx*0.2,wk.y+1.75,wk.z+fz*0.2);dnHT.set(wk.x+fx*9,wk.y,wk.z+fz*9)}
  dnHead.position.copy(dnHP);dnHead.target.position.copy(dnHT)}

// ---------- work lights on the boom and amber beacons ----------
// Two work lamps on the excavator's boom (their lenses glow with the others) throw a light on the bucket's work after
// dark (Medium graphics and up: a second lamp costs every pixel a little); a rotating amber beacon on the excavator's
// cab and the dump truck's flashes while you run that machine, day and night
const dnBoomL=new THREE.SpotLight(0xfff4e0,0,30,0.62,0.55,0);dnBoomL.castShadow=false;scene.add(dnBoomL,dnBoomL.target);
function dnBoomGfx(on){dnBoomL.visible=!!on}
const dnBoomG=new THREE.Group();dnBoomG.position.set(0,1.0,2.3);boomP.add(dnBoomG);
for(const x of [-0.2,0.2]){const l=new THREE.Group();l.position.set(x,0,0);l.rotation.x=0.3;dnBoomG.add(l);
  const hb=new THREE.Mesh(new THREE.BoxGeometry(0.17,0.14,0.12),STEEL);hb.castShadow=true;l.add(hb);
  const ln=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.02,20),LENS);ln.rotation.x=Math.PI/2;ln.position.z=0.065;l.add(ln);
  const br=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.1,0.04),STEEL);br.position.y=-0.1;l.add(br)}
const DN_BEACONS=[],dnBP=new THREE.Vector3();
function dnBeacon(par,x,y,z,on){const g=new THREE.Group();g.position.set(x,y,z);par.add(g);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.085,0.05,16),STEEL);base.position.y=0.025;g.add(base);
  const mat=M(0xffa21a,{flatShading:false,shininess:90,specular:0x664422,emissive:0x2a1400,transparent:true,opacity:0.9});
  const dome=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.065,0.11,20),mat);dome.position.y=0.105;g.add(dome);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(0.058,16,8,0,Math.PI*2,0,Math.PI/2),mat);cap.position.y=0.16;g.add(cap);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:dnHaloTex,color:0xff9a1a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  halo.position.y=0.11;halo.visible=false;g.add(halo);DN_BEACONS.push({g,mat,halo,on,ph:DN_BEACONS.length*1.7});return g}
dnBeacon(cab,0.36,1.63,-0.5,()=>mode==='dig'||mode==='drive');
dnBeacon(tBody,0.55,2.95,2.52,()=>mode==='truck');
function dnLightsTick(lamp){const t=timeU.value,dark=0.35+0.65*lamp;
  for(const b of DN_BEACONS){const on=b.on();b.halo.visible=on;
    if(!on){b.mat.emissive.setHex(0x2a1400);continue}
    // the reflector turns about 1.4 times a second: one sharp flash each turn as it sweeps past you
    const c=Math.cos(t*8.8+b.ph),f=Math.pow(Math.max(0,c),5)+0.18*Math.max(0,-c);
    b.mat.emissive.setRGB(0.16+0.95*f,0.08+0.5*f,0.01);b.halo.material.opacity=Math.min(1,f*dark*1.2);b.halo.scale.setScalar(0.35+(0.9+1.6*lamp)*f)}
  // the boom lamps light the bucket's work after dark, when you are in the excavator
  const ex=(mode==='dig'||mode==='drive')&&dnBoomL.visible,k=ex?lamp*TU.lampLight:0;dnBoomL.intensity=2.4*k*LI;
  if(k>0.01){dnBoomG.localToWorld(dnBP.set(0,0.05,0.1));dnBoomL.position.copy(dnBP);bkG.getWorldPosition(dnBoomL.target.position)}}

// ---------- fireflies over the land round you on a dry night ----------
const DN_FF=PHONE?90:200;
const dnFF=(function(){const g=new THREE.BufferGeometry(),p=new Float32Array(DN_FF*3).fill(-999),a=new Float32Array(DN_FF*3);
  for(let i=0;i<DN_FF;i++){a[i*3]=Math.random()*6.28;a[i*3+1]=0.6+Math.random()*1.1;a[i*3+2]=Math.random()}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aF',new THREE.BufferAttribute(a,3));
  const m=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uT:{value:0},uA:{value:0},uPx:{value:1}},
    vertexShader:'attribute vec3 aF;uniform float uT,uPx;varying float vB;void main(){vec3 p=position+vec3(sin(uT*0.4+aF.z*6.0),0.35*sin(uT*0.7+aF.x),cos(uT*0.33+aF.z*9.0))*0.9;\n'+
      'vec4 mv=modelViewMatrix*vec4(p,1.0);vB=pow(max(0.0,sin(uT*aF.y+aF.x)),6.0);gl_PointSize=clamp(28.0*uPx/-mv.z,1.0,6.0*uPx);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uA;varying float vB;void main(){float d=length(gl_PointCoord-0.5)*2.0;gl_FragColor=vec4(vec3(0.75,1.0,0.3)*vB*uA*(1.0-smoothstep(0.2,1.0,d)),1.0);}'}));
  m.frustumCulled=false;m.visible=false;scene.add(m);return m})();
let dnFFi=0;
function dnFFTick(){const P=dnFF.geometry.attributes.position,c=camera.position;
  // a few a frame: any that are far behind move to a new spot round you, over the grass, not the lake
  for(let k=0;k<12;k++){const i=dnFFi=(dnFFi+1)%DN_FF,x=P.getX(i),z=P.getZ(i);if(Math.hypot(x-c.x,z-c.z)<32&&P.getY(i)>-900)continue;
    const r=4+Math.random()*26,a=Math.random()*6.28,nx=c.x+Math.cos(a)*r,nz=c.z+Math.sin(a)*r,g=baseHeight(nx,nz);
    P.setXYZ(i,nx,g<WATER+0.5?-999:g+0.3+Math.random()*1.8,nz)}
  P.needsUpdate=true}

// ---------- every frame (from rainFxTick, before the rain greys it over; from the map editor on its own) ----------
function dnTick(dt){
  if(dn.run&&!edOn&&!bench.on)dn.t+=dt*86400000/TU.dayLen;
  // the map editor and the speed test see the afternoon, whatever the clock says
  const t=edOn||bench.on?dn.t+(840-dnMin(dn.t))*60000:dn.t,n=dnDays(t),lst=dnLST(n);
  const srd=dnSunRD(n),mrd=dnMoonRD(n);dnDir(srd,lst,SUN_DIR);dnDir(mrd,lst,dnMoonDir);
  const h=dn.el=Math.asin(SUN_DIR.y)/DN_R;dn.mel=Math.asin(dnMoonDir.y)/DN_R;
  const el=SUN_DIR.dot(dnMoonDir);dn.ill=(1-el)/2;dn.wax=((mrd[0]-srd[0])%(2*Math.PI)+2*Math.PI)%(2*Math.PI)<Math.PI;
  // the sky
  dnKey(DN_SKY,h,1,skyU.uTop.value);dnKey(DN_SKY,h,2,skyU.uHor.value);dnKey(DN_SKY,h,3,skyU.uGlow.value);
  const nl=TU.nightLight,moonUp=ss(-1,6,dn.mel),moonK=dn.ill*moonUp*(1-ss(-8,-3,h));
  if(moonK>0){const b=0.035*moonK*Math.min(2,nl);skyU.uTop.value.r+=b*0.5;skyU.uTop.value.g+=b*0.7;skyU.uTop.value.b+=b;skyU.uHor.value.r+=b*0.6;skyU.uHor.value.g+=b*0.7;skyU.uHor.value.b+=b*0.9}
  dnKey(DN_SUNC,h,1,dnSunC);skyU.uSunC.value.copy(dnSunC).multiplyScalar(ss(-3,2,h));
  skyU.uMoon.value.copy(dnMoonDir);skyU.uMoonV.value=moonUp*(1-0.75*ss(-2,12,h));
  skyU.uStars.value=1-ss(-14,-5,h);skyU.uSkyT.value=timeU.value%1000;
  {const L=dnLST(n);dnRT.set(Math.cos(L),-Math.sin(L),0, Math.sin(L),Math.cos(L),0, 0,0,1);skyU.uCel.value.multiplyMatrices(dnRT,dnAT)}
  // a shooting star now and then on a dark night
  if(skyU.uStars.value>0.6&&!bench.on){if(dn.metT>=0){dn.metT+=dt/0.7;if(dn.metT>1)dn.metT=-1}
    else if((dn.metNext-=dt)<=0){dn.metNext=8+Math.random()*40;dn.metT=0;const a=Math.random()*6.28,y=0.35+Math.random()*0.5,c=Math.sqrt(1-y*y);
      skyU.uMetA.value.set(Math.cos(a)*c,y,Math.sin(a)*c);const b=a+(Math.random()-0.5)*0.4;skyU.uMetB.value.set(Math.cos(b)*c,y-0.08-Math.random()*0.1,Math.sin(b)*c).normalize()}}
  else dn.metT=-1;
  skyU.uMetT.value=dn.metT;
  DAY.bg.copy(skyU.uHor.value).add(dnCb.copy(skyU.uGlow.value).multiplyScalar(0.35));
  DAY.lum=0.03+0.97*ss(-10,8,h);DAY.fogK=1-0.35*ss(-6,0,h)*(1-ss(2,12,h))*(dnMin(t)<720?1:0);
  // clouds dim toward a moonlit grey at night, and take the sunset's colour
  DAY.cloud.setRGB(1,1,1).multiplyScalar(0.06+0.04*moonK+0.9*ss(-8,6,h)).lerp(dnSunC,0.35*ss(-4,1,h)*(1-ss(4,14,h)));
  // the lights: the sun by day, the moon at night (shadows fall from whichever it is, never quite flat)
  const sunI=1.6*ss(-1.5,6,h)*(0.6+0.4*ss(6,30,h)),moonI=0.32*moonK*nl;
  if(h>-3){sun.color.copy(dnSunC);sun.intensity=sunI*LI;LIGHT_DIR.copy(SUN_DIR)}else{sun.color.copy(dnMoonC);sun.intensity=moonI*LI;LIGHT_DIR.copy(dnMoonDir)}
  if(LIGHT_DIR.y<0.07){LIGHT_DIR.y=0.07;LIGHT_DIR.normalize()}
  DAY.hemiI=0.5*(0.12*nl*(1+0.6*moonK)+0.88*ss(-10,8,h));const hk=ss(-8,6,h);
  if(hemiL0){hemiL0.color.copy(dnHemiSky.setHex(0x5d74a8).lerp(dnCa.setHex(0xb8d0ea),hk));hemiL0.groundColor.copy(dnHemiGnd.setHex(0x15171c).lerp(dnCa.setHex(0x5b5a3c),hk))}
  dayKU.value=ss(-2,10,h);
  // the base the rain works from (rain.js); the map editor shows it as it is
  scene.background.copy(DAY.bg);scene.fog.color.copy(DAY.bg);if(hemiL0)hemiL0.intensity=DAY.hemiI*LI;
  if(edOn||bench.on){scene.fog.far=760*gfxFog;sky.material.color.setRGB(1,1,1);skySunVis.value=1}
  // the mountains take the horizon's light, the far range all of it
  dnCa.copy(skyU.uHor.value);dnCa.r/=DN_HOR0.r;dnCa.g/=DN_HOR0.g;dnCa.b/=DN_HOR0.b;
  if(MTN_MATS[0])MTN_MATS[0].emissive.setHex(0x6a7686).multiply(dnCa);if(MTN_MATS[1])MTN_MATS[1].color.copy(dnCa);
  // lamps, windows and headlights come on as the sun goes down
  const lamp=1-ss(-5,2,h),win=1-ss(-7,1,h),ll=TU.lampLight;
  famGlowMat.color.setScalar(0.65+0.35*lamp);famWinMat.emissive.copy(dnWarm).multiplyScalar(0.7*win*Math.min(1.5,ll));
  for(const m of dnHalos){m.visible=lamp>0.01;m.material.color.copy(m.userData.col).multiplyScalar(lamp*Math.min(1.5,ll))}
  dnPools.visible=lamp>0.01;dnPoolMat.color.setHex(0xffd9a0).multiplyScalar(0.45*lamp*ll);
  const head=1-ss(-4,4,h);dnHead.intensity=2.2*head*ll*LI;if(head>0.01)dnHeadPlace();
  dnLightsTick(head);
  // the machines' lamp lenses (LENS, excavator.js) shine with them
  LENS.emissive.setHex(0x554a30).lerp(dnCa.copy(dnWarm).multiplyScalar(1.3*Math.min(1.5,ll)),head);
  // fireflies and night sounds
  const night=(1-ss(-9,-3,h))*(edOn||bench.on?0:1);
  const ff=night*(1-ss(0.05,0.3,weather.r));dnFF.visible=ff>0.01;if(dnFF.visible){dnFF.material.uniforms.uA.value=ff;dnFF.material.uniforms.uT.value=timeU.value%1000;dnFF.material.uniforms.uPx.value=renderer.getPixelRatio();dnFFTick()}
  dnSndTick(dt,night);
  // the reflections catch the sky again when it has changed enough to see
  dn.envT-=dt;if(dn.envT<=0){const sig=[skyU.uTop.value.getHexString(),skyU.uHor.value.getHexString(),skyU.uGlow.value.getHexString(),sky.material.color.getHexString(),Math.round(SUN_DIR.x*50),Math.round(SUN_DIR.y*50),Math.round(SUN_DIR.z*50)].join();
    if(sig!==dn.envSig){dn.envSig=sig;skyEnvUpdate(DAY.lum)}dn.envT=0.4}
  if(Math.abs(dn.t-dn.saved)>600000||(dn.run&&performance.now()-dn.saveT>20000)){dn.saveT=performance.now();dnSave()}
  if((dn.uiT-=dt)<=0){dn.uiT=0.5;dnUI()}}
const hemiL0=scene.children.find(o=>o.isHemisphereLight);

// ---------- the Time row in the ☰ menu: a slider through the day, run or stop the clock, back to the real time ----------
const dnSl=$('#todSlider');
const DN_DIRS=['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest'];
function dnCompass(v){const a=Math.atan2(v.x,-v.z)/DN_R;return DN_DIRS[Math.round(((a+360)%360)/22.5)%16]}
function dnPhase(){const i=dn.ill,w=dn.wax;return i<0.03?'new moon':i>0.97?'full moon':i<0.47?(w?'waxing':'waning')+' crescent':i<0.53?(w?'first':'last')+' quarter':(w?'waxing':'waning')+' gibbous'}
function dnUI(){if(!dnSl||$('#menu').hidden)return;const t=dn.t;
  if(!dn.drag)dnSl.value=Math.round(dnMin(t));
  const ah=dnAhead();if(!dn.dragD)dnDSl.value=Math.round(1000*Math.sqrt(Math.max(0,ah)/DN_DATE_MAX));$('#dateVal').textContent=dnDate(t);
  $('#todVal').textContent=dnTime(t);$('#todRun').textContent=dn.run?'Stop':'Run';
  const day=dnDayF?dnDayF.format(t):new Date(t).toDateString();if(day!==dn.day){dn.day=day;[dn.rise,dn.set]=dnRiseSet(t)}
  const sunTxt=dn.el>-0.83?'Sun '+Math.round(dn.el)+'° up in the '+dnCompass(SUN_DIR):'Sun down',
    moonTxt=dn.mel>0?', '+dnPhase()+' '+Math.round(dn.mel)+'° up in the '+dnCompass(dnMoonDir):'';
  const pc=typeof plantCount==='function'?plantCount():null,
    plTxt=pc&&pc.n?' · Planted: '+PLANT_STAGES.map((s,i)=>pc.c[i]?pc.c[i]+' '+s.toLowerCase():'').filter(Boolean).join(', '):'';
  $('#todSub').textContent=(ah>0?dnAheadTxt(ah)+plTxt+' · ':plTxt?plTxt.slice(3)+' · ':'')+day+' · '+sunTxt+moonTxt+' · Sunrise '+(dn.rise?dnTime(dn.rise):'–')+' · Sunset '+(dn.set?dnTime(dn.set):'–')}
function dnSet(min){dn.t+=(min-dnMin(dn.t))*60000;dn.uiT=0;dnSave()}
// the Date slider: whole days ahead of the real date, up to 100 years, finer near today (the slider's square); the time
// of day stays put. Planted trees (plant.js) grow with it
const DN_DATE_MAX=36525,dnDSl=$('#dateSlider');
const dnAhead=()=>Math.round((dn.t-Date.now())/86400000);
function dnAheadTxt(d){if(d<=0)return 'today';if(d<60)return d+(d===1?' day':' days')+' ahead';const y=Math.floor(d/365.25),m=Math.floor((d-y*365.25)/30.44);
  return (y?y+' yr':'')+(y&&m?' ':'')+(m?m+' mo':'')+' ahead'}
function dnSetDate(v){const d=Math.round(DN_DATE_MAX*Math.pow(v/1000,2));dn.t+=(d-Math.max(0,dnAhead()))*86400000;dn.uiT=0;dnSave()}
if(dnDSl){dnDSl.addEventListener('input',()=>{dn.dragD=true;dnSetDate(+dnDSl.value)});
  dnDSl.addEventListener('change',()=>{dn.dragD=false;dnSetDate(+dnDSl.value);toast(say('dateSet',{date:dnDate(dn.t),ahead:dnAheadTxt(dnAhead())}),'good',2200)})}
if(dnSl){dnSl.addEventListener('input',()=>{dn.drag=true;dnSet(+dnSl.value)});dnSl.addEventListener('change',()=>{dn.drag=false;dnSet(+dnSl.value)});
  $('#todRun').onclick=()=>{dn.run=!dn.run;dnSave();dn.uiT=0;toast(say(dn.run?'todRun':'todStop',{min:Math.round(TU.dayLen/60),time:dnTime(dn.t)}),'good')};
  $('#todNow').onclick=()=>{dn.t=Date.now();dnSave();dn.uiT=0;toast(say('todNow',{time:dnTime(dn.t)}),'good')}}
