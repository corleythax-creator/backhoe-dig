// Corley's Island: far, tiny parts are not drawn. The world holds thousands of small separate meshes (a wheel, a
// mirror, a lamp head, a chair) and each costs a draw call when it is in view, however far off: from Main Street,
// over a thousand of them sit more than a quarter mile away at a few pixels across. A mesh whose bounding sphere
// would be under TU.farCull pixels across on screen is left out (its layers mask set to 0, which the renderer and the
// warm-up, main.js, both skip; its own mask comes back when it is big enough again, with a little slack so nothing
// flickers at the edge). It never touches .visible, which the game's own code switches. Left alone: instanced and
// skinned meshes, anything that turned frustum culling off (the sky, the water), shadow stand-ins and meshes on no
// layer of their own. Off in the map editor (everything can be picked there) and in VR. The list of meshes is made
// again every few seconds, and a quarter of it is looked at each tick, so the cost is a fraction of a millisecond.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const fcull={list:[],at:0,i:0,n:0,off:true,v:null};
function fcullList(){const L=[];let n=0;scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.frustumCulled||o.userData.shProxy||!o.geometry)return;
    const U=o.userData;if(U.fcMask===undefined&&!o.layers.mask)return;
    if(U.fcMask!==undefined)n++;if(U.fcG!==o.geometry.id){const g=o.geometry;U.fcG=g.id;if(!g.boundingSphere){if(!g.attributes.position||g.attributes.position.count>60000){U.fcR=0;fcullShow(o);return}g.computeBoundingSphere()}
      const s=g.boundingSphere;U.fcR=s&&isFinite(s.radius)?s.radius:0;U.fcC=s?s.center:null}
    if(U.fcR>0)L.push(o);else fcullShow(o)});fcull.list=L;fcull.i=0;fcull.n=n}
function fcullShow(o){const U=o.userData;if(U.fcMask!==undefined){o.layers.mask|=U.fcMask;U.fcMask=undefined;fcull.n--}}
function fcullAll(){for(const o of fcull.list)fcullShow(o);fcull.off=true}
function fcullTick(){const px=TU.farCull,now=performance.now();
  if(!(px>0)||edOn||bench.on||renderer.xr.isPresenting){if(!fcull.off)fcullAll();return}
  fcull.off=false;if(now-fcull.at>6000||!fcull.list.length){fcull.at=now;fcullList()}
  const L=fcull.list,n=Math.ceil(L.length/4),v=fcull.v||(fcull.v=new THREE.Vector3()),c=camera.position,
    k=renderer.domElement.clientHeight/Math.tan((camera.fov||60)*Math.PI/360);   // pixels across for radius/distance of 1
  for(let j=0;j<n&&L.length;j++){const o=L[fcull.i=(fcull.i+1)%L.length],U=o.userData,e=o.matrixWorld.elements;
    v.copy(U.fcC).applyMatrix4(o.matrixWorld);const d=Math.hypot(v.x-c.x,v.y-c.y,v.z-c.z),
      sc=Math.sqrt(Math.max(e[0]*e[0]+e[1]*e[1]+e[2]*e[2],e[4]*e[4]+e[5]*e[5]+e[6]*e[6],e[8]*e[8]+e[9]*e[9]+e[10]*e[10])),size=U.fcR*sc*k/Math.max(d,0.01);
    if(U.fcMask===undefined){if(size<px&&o.layers.mask){U.fcMask=o.layers.mask;o.layers.mask=0;fcull.n++}}
    else if(size>px*1.25)fcullShow(o)}}
setInterval(fcullTick,250);
