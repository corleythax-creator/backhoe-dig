/* Human Forge runtime: puts Forge people (rigged, animated GLBs from human-forge) into any three.js game, r128 to r186.
 * No GLTFLoader needed: it reads the Forge files itself. Two ways to draw people:
 *   hero  - one skinned person with an AnimationMixer: cross-fades, props in hand, three LODs. For the few near the camera.
 *   crowd - any number of one character as a single InstancedMesh, skinned on the GPU from a baked bone texture; each
 *           instance has its own clip, phase and speed. One draw call per character (plus one for its shadow).
 * Classic script: sets window.HumanForge. ES module: import './human-forge.js' then use window.HumanForge (or
 * globalThis.HumanForge).
 *
 *   const forge = await HumanForge.load(THREE, 'models/people/');        // reads library.json and anims.glb
 *   const bob = await forge.hero('fan_olemiss_03'); scene.add(bob.object); bob.play('walk');
 *   const fans = await forge.crowd('fan_olemiss_03', {max: 400, clips: ['sit', 'sit_clap', 'sit_cheer']});
 *   scene.add(fans.object); const h = fans.add({x, y, z, heading, clip: 'sit_clap'});
 *   every frame: forge.update(dt)   (heroes' mixers and every crowd's clock)
 * Coordinates: metres, y up, a person faces +z at heading 0 (heading in radians, turning left is +).
 */
(function (root) {
  'use strict';
  const VERSION = '1.1.0';

  // ------------------------------------------------------------------ GLB reading
  const CT = { 5126: Float32Array, 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5122: Int16Array, 5120: Int8Array };
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

  function parseGLB(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
    let off = 12, json = null, bin = null;
    while (off < buf.byteLength) {
      const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len)));
      else if (type === 0x004e4942) bin = buf.slice(off + 8, off + 8 + len);
      off += 8 + len;
    }
    const acc = (i) => {
      const a = json.accessors[i], v = json.bufferViews[a.bufferView], T = CT[a.componentType];
      return new T(bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * NC[a.type]);
    };
    const view = (i) => { const v = json.bufferViews[i]; return new Uint8Array(bin, v.byteOffset || 0, v.byteLength); };
    return { json, acc, view };
  }

  async function fetchBuf(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Human Forge: ' + url + ' ' + r.status);
    return r.arrayBuffer();
  }

  function loadImage(bytes, mime) {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); res(im); };
      im.onerror = rej;
      im.src = url;
    });
  }

  // ------------------------------------------------------------------ the forge
  async function load(THREE, base, opts) {
    opts = opts || {};
    base = base.endsWith('/') ? base : base + '/';
    const lr = await fetch(base + 'library.json');
    if (!lr.ok) throw new Error('Human Forge: ' + base + 'library.json ' + lr.status);
    const lib = await lr.json();
    const ag = parseGLB(await fetchBuf(base + (lib.anims && lib.anims.file || 'anims.glb')));
    const info = {};
    (lib.anims && lib.anims.clips || []).forEach((c) => { info[c.name] = c; });
    const refHip = lib.anims && (lib.anims.ref_pelvis || lib.anims.ref_hip) || 0.95;
    // the clips, by node name (bone names are the same in every Forge person)
    const rawClips = (ag.json.animations || []).map((an) => {
      const tracks = an.channels.map((ch) => {
        const s = an.samplers[ch.sampler], node = ag.json.nodes[ch.target.node].name;
        const times = Array.from(ag.acc(s.input)), vals = Array.from(ag.acc(s.output));
        return { node, path: ch.target.path, times, vals };
      });
      return { name: an.name, tracks, duration: Math.max(...tracks.map((t) => t.times[t.times.length - 1])) };
    });
    const linear = 'colorSpace' in new THREE.Texture();
    const types = {}, heroes = new Set(), crowds = new Set();

    function clipsFor(hip) {
      const k = hip / refHip;
      return rawClips.map((c) => new THREE.AnimationClip(c.name, c.duration, c.tracks.map((t) => {
        if (t.path === 'rotation') return new THREE.QuaternionKeyframeTrack(t.node + '.quaternion', t.times, t.vals);
        const v = t.node === 'pelvis' ? t.vals.map((x) => x * k) : t.vals;
        return new THREE.VectorKeyframeTrack(t.node + '.position', t.times, v);
      })));
    }

    async function type(id) {
      if (types[id]) return types[id];
      const p = (async () => {
        const g = parseGLB(await fetchBuf(base + id + '.glb'));
        const J = g.json;
        const img = J.images[0];
        const tex = new THREE.Texture(await loadImage(g.view(img.bufferView), img.mimeType));
        tex.flipY = false;
        if (linear) tex.colorSpace = opts.linearTextures ? 'srgb-linear' : 'srgb';
        else if (!opts.linearTextures && THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        const skin = J.skins[0];
        const joints = skin.joints.map((n) => J.nodes[n]);
        const parent = {};
        J.nodes.forEach((n, i) => (n.children || []).forEach((c) => { parent[c] = i; }));
        const ibm = g.acc(skin.inverseBindMatrices);
        const lods = {};
        J.nodes.filter((n) => n.mesh !== undefined).forEach((n) => {
          const pr = J.meshes[n.mesh].primitives[0], a = pr.attributes;
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(g.acc(a.POSITION), 3));
          geo.setAttribute('normal', new THREE.BufferAttribute(g.acc(a.NORMAL), 3));
          geo.setAttribute('uv', new THREE.BufferAttribute(g.acc(a.TEXCOORD_0), 2));
          geo.setAttribute('skinIndex', new THREE.BufferAttribute(g.acc(a.JOINTS_0), 4));
          geo.setAttribute('skinWeight', new THREE.BufferAttribute(g.acc(a.WEIGHTS_0), 4, true));
          geo.setIndex(new THREE.BufferAttribute(g.acc(pr.indices), 1));
          geo.computeBoundingSphere();
          lods[n.name.replace('body_', '')] = geo;
        });
        const forge = (J.nodes.find((n) => n.extras && n.extras.forge) || {}).extras;
        const meta = lib.people.find((q) => q.id === id) || {};
        // the pelvis' rest height (world y of its head, from its inverse bind matrix): walk clips scale to it
        const pj = skin.joints.findIndex((n) => J.nodes[n].name === 'pelvis');
        const pm = pj >= 0 ? new THREE.Matrix4().fromArray(ibm, pj * 16).invert ? new THREE.Matrix4().fromArray(ibm, pj * 16).invert() : new THREE.Matrix4().getInverse(new THREE.Matrix4().fromArray(ibm, pj * 16)) : null;
        const t = { id, J, joints, jointIdx: skin.joints, parent, ibm, lods, tex, meta, height: (forge && forge.forge.height) || meta.height || 1.75 };
        t.hip = pm ? pm.elements[13] : refHip;
        t.clips = clipsFor(t.hip);
        return t;
      })();
      types[id] = p;
      return p;
    }

    function rig(t) {
      // bones from the GLB's nodes, the person's group holding them and the prop node
      const group = new THREE.Group();
      group.name = t.id;
      const byNode = {};
      t.jointIdx.forEach((ni) => {
        const n = t.J.nodes[ni], b = new THREE.Bone();
        b.name = n.name;
        if (n.translation) b.position.fromArray(n.translation);
        if (n.rotation) b.quaternion.fromArray(n.rotation);
        byNode[ni] = b;
      });
      t.jointIdx.forEach((ni) => { const p = t.parent[ni]; if (byNode[p]) byNode[p].add(byNode[ni]); else group.add(byNode[ni]); });
      const bones = t.jointIdx.map((ni) => byNode[ni]);
      const inv = bones.map((b, i) => new THREE.Matrix4().fromArray(t.ibm, i * 16));
      const prop = new THREE.Object3D();
      prop.name = 'prop';
      group.add(prop);
      return { group, bones, skeleton: new THREE.Skeleton(bones, inv), prop };
    }

    function material(t, extra) {
      return new THREE.MeshStandardMaterial(Object.assign({ map: t.tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 }, extra || {}));
    }
    const OLD_SKINNING = 'skinning' in new THREE.MeshStandardMaterial(); // three before r129 wants skinning: true on the material
    function heroMaterial(t) {
      const m = material(t);
      if (OLD_SKINNING) m.skinning = true;
      return m;
    }

    // ---------------------------------------------------------------- heroes
    async function hero(id, o) {
      o = o || {};
      const t = await type(id);
      const r = rig(t);
      const mat = o.material || heroMaterial(t);
      if (o.material && OLD_SKINNING) o.material.skinning = true;
      const meshes = {};
      Object.keys(t.lods).forEach((k) => {
        const m = new THREE.SkinnedMesh(t.lods[k], mat);
        m.name = 'body_' + k;
        m.castShadow = o.castShadow !== false;
        m.receiveShadow = !!o.receiveShadow;
        m.frustumCulled = false; // the bounds are the rest pose's; a seated person leaves them
        r.group.add(m);
        m.bind(r.skeleton, new THREE.Matrix4());
        meshes[k] = m;
      });
      const mixer = new THREE.AnimationMixer(r.group);
      const actions = {};
      t.clips.forEach((c) => { actions[c.name] = mixer.clipAction(c); });
      let cur = null, lod = null;
      const h = {
        id, object: r.group, prop: r.prop, mixer, actions, type: t, clip: null,
        lod(k) {
          if (k === lod || !meshes[k]) return h;
          lod = k;
          Object.keys(meshes).forEach((q) => { meshes[q].visible = q === k; });
          return h;
        },
        play(name, p) {
          p = p || {};
          const a = actions[name];
          if (!a) throw new Error('Human Forge: no clip ' + name);
          if (cur === a && !p.restart) { if (p.speed) a.setEffectiveTimeScale(p.speed); return h; }
          a.reset();
          a.setEffectiveTimeScale(p.speed || 1);
          if (p.time !== undefined) a.time = p.time; else if (p.phase !== undefined) a.time = p.phase * a.getClip().duration;
          a.play();
          if (cur && (p.fade === undefined ? 0.25 : p.fade) > 0) cur.crossFadeTo(a, p.fade === undefined ? 0.25 : p.fade, false);
          else if (cur) cur.stop();
          cur = a;
          h.clip = name;
          r.prop.visible = !!(info[name] && info[name].prop);
          return h;
        },
        /* walking speed (m/s) to the clip's own playback rate, so feet do not slide */
        pace(speed) {
          const c = info[h.clip];
          if (cur && c && c.speed) cur.setEffectiveTimeScale(speed / (c.speed * (t.hip / refHip) * h.object.scale.y));
          return h;
        },
        update(dt) { mixer.update(dt); return h; },
        dispose() { heroes.delete(h); r.group.removeFromParent && r.group.removeFromParent(); mixer.stopAllAction(); },
        auto: o.autoLod !== false
      };
      h.lod(o.lod || 'hi');
      h.play(o.clip || 'idle', { fade: 0, phase: o.phase !== undefined ? o.phase : Math.random() });
      heroes.add(h);
      return h;
    }

    // ---------------------------------------------------------------- crowds
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

    function bake(t, names, fps) {
      // every clip's bone matrices, frame by frame, into one float texture: a row per frame, 4 texels per bone
      const r = rig(t);
      const m = new THREE.SkinnedMesh(t.lods.lo || t.lods.md, new THREE.MeshBasicMaterial());
      r.group.add(m);
      m.bind(r.skeleton, new THREE.Matrix4());
      const mixer = new THREE.AnimationMixer(r.group);
      const nb = r.bones.length, cols = nb * 4 + 4; // the last 4 texels: the prop's matrix
      const clips = names.map((n) => t.clips.find((c) => c.name === n)).filter(Boolean);
      const at = {};
      let rows = 0;
      clips.forEach((c) => { const n = Math.max(2, Math.round(c.duration * fps)); at[c.name] = { start: rows, frames: n, fps: n / c.duration, duration: c.duration }; rows += n; });
      const data = new Float32Array(cols * 4 * rows);
      const propM = new Float32Array(16 * rows);
      clips.forEach((c) => {
        const a = mixer.clipAction(c);
        mixer.stopAllAction();
        a.play();
        const A = at[c.name];
        for (let f = 0; f < A.frames; f++) {
          a.time = (f / A.frames) * c.duration;
          mixer.update(0);
          r.group.updateMatrixWorld(true);
          r.skeleton.update();
          data.set(r.skeleton.boneMatrices, (A.start + f) * cols * 4);
          r.prop.matrixWorld.toArray(propM, (A.start + f) * 16);
          data.set(r.prop.matrixWorld.elements, (A.start + f) * cols * 4 + nb * 16);
        }
      });
      const tex = new THREE.DataTexture(data, cols, rows, THREE.RGBAFormat, THREE.FloatType);
      tex.magFilter = tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.flipY = false;
      tex.needsUpdate = true;
      return { tex, at, cols, rows, nb, propM };
    }

    const GLSL_PARS = `
      uniform sampler2D hfBones; uniform float hfTime;
      attribute vec4 hfAnim; // first row, frames, frames per second, time offset (s)
      attribute float hfRate;
      #ifndef USE_SKINNING
      attribute vec4 skinIndex; attribute vec4 skinWeight;
      #endif
      mat4 hfBone(int row, float j) {
        int c = int(j) * 4;
        return mat4(texelFetch(hfBones, ivec2(c, row), 0), texelFetch(hfBones, ivec2(c + 1, row), 0),
                    texelFetch(hfBones, ivec2(c + 2, row), 0), texelFetch(hfBones, ivec2(c + 3, row), 0));
      }
      mat4 hfSkin(int row) {
        return skinWeight.x * hfBone(row, skinIndex.x) + skinWeight.y * hfBone(row, skinIndex.y)
             + skinWeight.z * hfBone(row, skinIndex.z) + skinWeight.w * hfBone(row, skinIndex.w);
      }
    `;
    // the skin matrix, blended between the two baked frames either side of now; worked out once at the top of main()
    const GLSL_SKIN = `
      mat4 hfM;
      mat4 hfMat() {
        float hfF = (hfTime * hfRate + hfAnim.w) * hfAnim.z;
        float hfI = floor(hfF);
        float hfK = hfF - hfI;
        int hfA = int(hfAnim.x + mod(hfI, hfAnim.y));
        int hfB = int(hfAnim.x + mod(hfI + 1.0, hfAnim.y));
        return hfSkin(hfA) * (1.0 - hfK) + hfSkin(hfB) * hfK;
      }
    `;

    function patch(mat, U) {
      const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = function (sh, r) {
        if (prev) prev.call(this, sh, r);
        sh.uniforms.hfBones = U.hfBones;
        sh.uniforms.hfTime = U.hfTime;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\n' + GLSL_PARS + GLSL_SKIN)
          .replace(/void\s+main\s*\(\s*\)\s*\{/, 'void main() {\n  hfM = hfMat();')
          .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(mat3(hfM) * objectNormal);')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = (hfM * vec4(transformed, 1.0)).xyz;');
      };
      const key = mat.customProgramCacheKey;
      mat.customProgramCacheKey = function () { return 'hf1' + (key ? key.call(this) : ''); };
      return mat;
    }

    async function crowd(id, o) {
      o = o || {};
      const t = await type(id);
      const names = o.clips || Object.keys(info);
      const fps = o.fps || 15;
      t.bakes = t.bakes || {};
      const bk = names.join(',') + '@' + fps;
      const B = t.bakes[bk] || (t.bakes[bk] = bake(t, names, fps));
      const max = o.max || 256;
      const geo = t.lods[o.lod || 'md'].clone();
      const anim = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
      const rate = new THREE.InstancedBufferAttribute(new Float32Array(max).fill(1), 1);
      geo.setAttribute('hfAnim', anim);
      geo.setAttribute('hfRate', rate);
      const U = { hfBones: { value: B.tex }, hfTime: { value: 0 } };
      const mat = patch(o.material || material(t), U);
      const mesh = new THREE.InstancedMesh(geo, mat, max);
      mesh.name = 'forge_crowd_' + id;
      mesh.frustumCulled = false;
      mesh.castShadow = !!o.castShadow;
      mesh.receiveShadow = !!o.receiveShadow;
      if (mesh.castShadow) mesh.customDepthMaterial = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t.tex, alphaTest: 0.5 }), U);
      mesh.count = 0;
      // every instance starts white, so tint() works whenever it is first called
      if (o.tint !== false) { mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3); }
      const slots = [];
      const free = [];
      const scales = new Float32Array(max).fill(1);
      const _c = new THREE.Color();
      // playback rate: speed as given (0 stands still), or pace (m/s) over the clip's ground speed for this person's size
      const rateOf = (i, name, p) => {
        if (p.pace !== undefined && info[name] && info[name].speed) return p.pace / (info[name].speed * (t.hip / refHip) * scales[i]);
        return p.speed !== undefined ? p.speed : 1;
      };
      const c = {
        id, object: mesh, type: t, max, clips: B.at,
        get count() { return mesh.count; },
        /* add a person; returns a handle (a number) or -1 when full */
        add(p) {
          let i = free.length ? free.pop() : mesh.count < max ? mesh.count++ : -1;
          if (i < 0) return -1;
          slots[i] = true;
          c.place(i, p || {});
          c.anim(i, (p && p.clip) || names[0], p);
          return i;
        },
        remove(i) {
          slots[i] = false;
          _m.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, _m);
          mesh.instanceMatrix.needsUpdate = true;
          free.push(i);
          // trailing free slots leave the draw altogether
          while (mesh.count > 0 && !slots[mesh.count - 1]) { const k = free.indexOf(mesh.count - 1); if (k >= 0) free.splice(k, 1); mesh.count--; }
        },
        /* everyone out at once (for games that repack who is in view every frame: clear(), then add() each) */
        clear() { slots.length = 0; free.length = 0; mesh.count = 0; },
        /* p: x, y, z, heading (about +y), scale; tilt (radians about the person's own left-right axis: -PI/2 lays them
           on their back), roll (about their facing); or matrix (a Matrix4, used as is) */
        place(i, p) {
          if (p.matrix) { mesh.setMatrixAt(i, p.matrix); scales[i] = p.scale || new THREE.Vector3().setFromMatrixScale(p.matrix).y; mesh.instanceMatrix.needsUpdate = true; return; }
          const sc = p.scale || 1;
          scales[i] = sc;
          _q.setFromAxisAngle(_up, p.heading || 0);
          if (p.tilt || p.roll) _q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(p.tilt || 0, 0, p.roll || 0, 'XYZ')));
          _p.set(p.x || 0, p.y || 0, p.z || 0);
          _s.set(sc, sc, sc);
          _m.compose(_p, _q, _s);
          mesh.setMatrixAt(i, _m);
          mesh.instanceMatrix.needsUpdate = true;
        },
        /* a colour multiplied over person i (a THREE.Color, hex number or css string; white clears it) */
        tint(i, col) {
          if (!mesh.instanceColor) return;
          _c.set(col);
          mesh.setColorAt(i, _c);
          mesh.instanceColor.needsUpdate = true;
        },
        /* clip by name; p.phase 0..1 or p.offset seconds, p.speed playback rate (or p.pace in m/s for walk / run) */
        anim(i, name, p) {
          p = p || {};
          const A = B.at[name];
          if (!A) throw new Error('Human Forge: crowd ' + id + ' has no clip ' + name + ' (baked: ' + names.join(', ') + ')');
          const sp = rateOf(i, name, p);
          // restart: the clip's first frame now; otherwise a phase (0..1) or an offset (s), random by default
          const off = p.restart ? -U.hfTime.value * sp : p.offset !== undefined ? p.offset : (p.phase !== undefined ? p.phase : Math.random()) * A.duration;
          anim.setXYZW(i, A.start, A.frames, A.fps, off);
          rate.setX(i, sp);
          anim.needsUpdate = rate.needsUpdate = true;
        },
        /* a new playback rate (or pace, m/s) for person i, keeping their place in the clip */
        rate(i, p) {
          const n = c.clipOf(i);
          const sp = rateOf(i, n, p);
          const old = rate.getX(i);
          if (Math.abs(old - sp) < 1e-3) return;
          anim.setW(i, anim.getW(i) + U.hfTime.value * (old - sp));
          rate.setX(i, sp);
          anim.needsUpdate = rate.needsUpdate = true;
        },
        /* the clip person i is playing */
        clipOf(i) { const s0 = anim.getX(i); for (const n in B.at) if (B.at[n].start === s0) return n; return null; },
        /* the prop's world matrix for person i (a shovel or bag the game draws), into out (a Matrix4) */
        propAt(i, out) {
          const row = Math.floor(anim.getX(i) + ((U.hfTime.value * rate.getX(i) + anim.getW(i)) * anim.getZ(i)) % anim.getY(i));
          out.fromArray(B.propM, row * 16);
          mesh.getMatrixAt(i, _m);
          return out.premultiply(_m).premultiply(mesh.matrixWorld);
        },
        time: 0,
        update(dt) { U.hfTime.value += dt; },
        dispose() { crowds.delete(c); geo.dispose(); mat.dispose(); mesh.removeFromParent && mesh.removeFromParent(); }
      };
      crowds.add(c);
      return c;
    }

    // the LOD for every hero, by distance from the camera (metres)
    const lodAt = opts.lodAt || { hi: 12, md: 35 };
    const _w = new THREE.Vector3();
    function update(dt, camera) {
      heroes.forEach((h) => {
        h.update(dt);
        if (camera && h.auto) {
          h.object.getWorldPosition(_w);
          const d = _w.distanceTo(camera.position);
          h.lod(d < lodAt.hi ? 'hi' : d < lodAt.md ? 'md' : 'lo');
        }
      });
      crowds.forEach((c) => c.update(dt));
    }

    return {
      version: VERSION, library: lib, base, clips: info, people: lib.people,
      ids(tag) { return lib.people.filter((p) => !tag || (p.tags || []).indexOf(tag) >= 0).map((p) => p.id); },
      preload: (ids) => Promise.all(ids.map(type)),
      /* a person's texture, for a game that builds its own material (pass it as { material } to hero or crowd) */
      texture: async (id) => (await type(id)).tex,
      hero, crowd, update,
      /* where the drive clip's hands are: the steering wheel's middle, radius and tilt from a seated person's origin */
      wheel: lib.anims && lib.anims.wheel, bars: lib.anims && lib.anims.bars, seat: lib.anims && lib.anims.seat,
      driveSeat: (lib.anims && lib.anims.drive_seat) || 0.36
    };
  }

  const HF = { load, parseGLB, version: VERSION };
  root.HumanForge = HF;
  if (typeof module !== 'undefined' && module.exports) module.exports = HF;
})(typeof window !== 'undefined' ? window : globalThis);
