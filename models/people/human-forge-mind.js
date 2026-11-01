/* Human Forge minds: a person's personality and what they say, in any app (no engine code here). Personalities are
 * designed with the person in Human Forge (the Design tab's Personality; spec.mind, and library.json's per-person
 * "mind" once built); a person without one gets one rolled from their id, the same every time. What they say comes
 * from Human Forge's /api/persona (a language model under fixed rules kept on that server: see api/persona.js), which
 * answers only Human Forge's own pages and the sites it lists (Forge Studio).
 * Classic script: sets window.HumanForgeMind. ES module: import './human-forge-mind.js' then use globalThis.HumanForgeMind.
 *
 *   HumanForgeMind.card({ id, name, age, gender | sex, mind })   // the personality, or null (under 18, or switched off)
 *   const minds = HumanForgeMind.create({
 *     card: (key) => card or null,       // whose personality (key: anything the app uses for a person)
 *     people: () => [keys],              // who is in the scene
 *     nearest: (key) => key or null,     // who they would talk to among themselves
 *     scene: (key, to, ev) => 'a few plain words: where, when, who and what is about',
 *     show: (key, line, to, ev) => {},   // line: { say, mood, face, look }: put it over their head, turn them...
 *     changed: () => {},                 // something to redraw (the log, the status)
 *     url, budget, storage,              // optional: the API, most asks a visit (300), the on/off key ('hf-minds')
 *   });
 *   minds.on = true;                     // off until switched on (kept in this browser)
 *   minds.tell(key, 'hello');            // you say something; they answer
 *   minds.event(key, { kind: 'touched', by: otherKey, where: 'shoulder' });   // they react to what happens to them
 *   minds.event(key, { kind: 'arrived', by: otherKey });        // someone came in (or was put in the scene)
 *   minds.event(key, { kind: 'approached', by: otherKey });     // someone came over to them
 *   minds.event(key, { kind: 'animal', what: 'a black bear', danger: true, feet: 12 });
 *   minds.event(key, { kind: 'still', by: otherKey });          // someone lying still nearby (dead, in a game)
 *   minds.chatter = true; every frame: minds.step(dt)           // they talk among themselves now and then
 * Events are dropped while one is pending for that person and within COOL seconds of the same thing happening again,
 * so an app may call event() every frame something is true. Guardrails: adults only (here and on the server), the
 * server's rules, at most `budget` asks a visit, chatter stops after CHATTER lines with nothing from you.
 */
(function (root) {
  const TRAITS = ['warm', 'witty', 'shy', 'bold', 'dry', 'cheerful', 'grumpy', 'curious', 'calm', 'nervous', 'romantic',
    'sarcastic', 'kind', 'proud', 'dreamy', 'practical', 'chatty', 'quiet', 'flirty', 'serious', 'silly', 'worldly'];
  const MOODS = ['calm', 'happy', 'playful', 'curious', 'shy', 'tired', 'annoyed', 'sad', 'surprised', 'thoughtful'];
  const PARTS = ['head', 'face', 'hair', 'neck', 'shoulder', 'arm', 'hand', 'back', 'side', 'chest', 'waist', 'hip', 'leg', 'knee', 'foot'];
  const ADULT = 18, API = 'https://human-forge-beta.vercel.app/api/persona', CHATTER = 24, GAP = [9, 15];
  const COOL = { touched: 25, arrived: 40, approached: 45, animal: 40, still: 90 };

  // traits and a mood rolled from a seed (a person's id): the same each time
  function roll(seed) {
    let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296), traits = [];
    while (traits.length < 3) { const t = TRAITS[Math.floor(r() * TRAITS.length)]; if (!traits.includes(t)) traits.push(t); }
    return { traits, mood: MOODS[Math.floor(r() * 4)] };
  }
  const nice = (s) => String(s || 'someone').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  // a person's personality: what was designed (mind), filled in from their id; null for anyone under 18 or switched off
  function card(p) {
    if (!p || !(+p.age >= ADULT)) return null;
    const m = p.mind || {}; if (m.on === false) return null;
    const r = roll(p.id || p.name);
    return { name: m.name || nice(p.name || p.id), age: Math.round(+p.age), sex: p.sex ? (p.sex === 'man' ? 'man' : 'woman') : (+p.gender ? 'man' : 'woman'),
      traits: (m.traits && m.traits.length ? m.traits : r.traits).filter((t) => TRAITS.includes(t)).slice(0, 4), mood: MOODS.includes(m.mood) ? m.mood : r.mood,
      about: String(m.about || '').slice(0, 300), voice: String(m.voice || '').slice(0, 120) };
  }
  // a part of the body in plain words, from a bone or part name (anything else is their side)
  function partOf(n) {
    n = String(n || '').toLowerCase();
    return /finger|thumb|index|middle|ring|pinky|hand/.test(n) ? 'hand' : /head|face|jaw/.test(n) ? 'face' : /neck/.test(n) ? 'neck'
      : /clavicle|shoulder/.test(n) ? 'shoulder' : /arm/.test(n) ? 'arm' : /foot|toe|ball/.test(n) ? 'foot' : /calf|knee/.test(n) ? 'knee'
        : /thigh|leg/.test(n) ? 'leg' : /pelvis|hip/.test(n) ? 'hip' : /spine_01|waist/.test(n) ? 'waist' : 'side';
  }
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };

  function create(o) {
    const KEY = o.storage || 'hf-minds', url = o.url || API, budget = o.budget || 300, changed = () => o.changed && o.changed();
    const cool = new Map();  // key -> { 'kind|by': time }
    const ids = new WeakMap(); let nid = 0;
    const idOf = (x) => (typeof x === 'object' ? (ids.has(x) ? ids.get(x) : (ids.set(x, ++nid), nid)) : x);
    let next = 0, turn = 0;
    const M = {
      lines: [], asked: 0, busy: new Set(), status: '', server: null, chatter: false, left: CHATTER,
      get on() { return store(KEY) === '1'; },
      set on(v) { store(KEY, v ? '1' : '0'); if (!v) { M.chatter = false; M.hush(); } else M.check(); changed(); },
      card: (k) => o.card(k),
      nameOf: (k) => { const c = o.card(k); return c ? c.name : (o.label ? o.label(k) : 'someone'); },
      can: (k) => M.on && !!o.card(k),
      // is the server set up for it? (once a visit)
      async check() {
        if (M.server !== null) return M.server;
        try { const r = await fetch(url); M.server = r.ok && (await r.json()).on === true; } catch (e) { M.server = false; }
        if (!M.server) M.status = 'Not set up yet: Human Forge\'s site needs ANTHROPIC_API_KEY in its environment.';
        changed();
        return M.server;
      },
      // key says something: to you, to another person (to: their key), or in reaction to ev
      async ask(k, to = 'you', ev = null) {
        if (!M.can(k) || (to !== 'you' && to != null && !M.can(to)) || M.busy.has(k)) return null;
        if (M.asked >= budget) { M.status = `That's ${budget} lines this visit; reload the page for more.`; changed(); return null; }
        if (!(await M.check())) return null;
        const log = M.lines.filter((l) => l.p === k || l.to === k || (to !== 'you' && to != null && (l.p === to || l.to === to))).slice(-12).map((l) => ({ who: l.who, said: l.said }));
        const e = ev && { kind: ev.kind, who: ev.by != null ? M.nameOf(ev.by) : String(ev.who || '').slice(0, 40), what: String(ev.what || '').slice(0, 60), where: ev.where || '', danger: !!ev.danger, feet: ev.feet ? Math.round(ev.feet) : undefined };
        M.busy.add(k); M.asked++; M.status = ''; changed();
        try {
          const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ me: o.card(k), to: to === 'you' || to == null ? 'you' : o.card(to), scene: o.scene ? o.scene(k, to, ev) : '', log, event: e || undefined }) });
          const a = await r.json().catch(() => ({}));
          if (!r.ok) { M.status = a.why || 'They could not answer just now.'; if (a.error === 'off') M.server = false; return null; }
          if (!o.people().includes(k)) return null;
          M.lines.push({ p: k, to: ev ? (ev.by != null ? ev.by : null) : to, who: M.nameOf(k), said: a.say, ev: ev ? ev.kind : undefined });
          if (o.show) o.show(k, a, to, ev);
          return a;
        } catch (err) { M.status = 'They could not answer just now.'; return null; } finally { M.busy.delete(k); changed(); }
      },
      // you say something to key; they answer
      tell(k, text) {
        text = String(text || '').trim().slice(0, 400); if (!text || !M.can(k)) return null;
        M.lines.push({ p: 'you', to: k, who: 'you', said: text });
        M.left = CHATTER;
        return M.ask(k, 'you');
      },
      // something happened to them; they react (at most once per COOL seconds for the same thing)
      event(k, ev) {
        if (!M.can(k) || !ev || !COOL[ev.kind] || M.busy.has(k)) return false;
        const now = Date.now() / 1000, c = cool.get(k) || {}, id = ev.kind + '|' + (ev.by != null ? idOf(ev.by) : ev.who || ev.what || '');
        if (now - (c[id] || -1e9) < COOL[ev.kind] || now - (c.any || -1e9) < 6) return false;
        c[id] = c.any = now; cool.set(k, c);
        M.ask(k, null, ev);
        return true;
      },
      forget(k) { M.lines = M.lines.filter((l) => l.p !== k && l.to !== k); cool.delete(k); changed(); },
      logOf: (k) => M.lines.filter((l) => l.p === k || l.to === k).slice(-30),
      hush() { try { root.speechSynthesis && root.speechSynthesis.cancel(); } catch (e) { /* none */ } },
      // read a line aloud in a voice for their sex (the browser's own voices)
      speak(text, sex) {
        const S = root.speechSynthesis; if (!S || typeof SpeechSynthesisUtterance === 'undefined') return;
        const u = new SpeechSynthesisUtterance(text), man = sex === 'man', vs = S.getVoices().filter((v) => /^en/i.test(v.lang));
        const pick = vs.find((v) => (man ? /\b(male|man|daniel|alex|fred|george|david|james)\b/i : /\b(female|woman|samantha|victoria|karen|zira|susan|moira|tessa)\b/i).test(v.name));
        if (pick || vs[0]) u.voice = pick || vs[0];
        u.pitch = man ? 0.85 : 1.12; S.speak(u);
      },
      // among themselves: the next one in turn says something to whoever is nearest, now and then
      step() {
        const now = Date.now() / 1000;
        if (!M.on || !M.chatter || (typeof document !== 'undefined' && document.hidden) || now < next || M.busy.size) return;
        const who = o.people().filter((k) => M.can(k)); if (who.length < 2) return;
        if (M.left <= 0) { M.chatter = false; M.status = 'They have stopped talking among themselves; say something, or start them again.'; changed(); return; }
        next = now + GAP[0] + Math.random() * (GAP[1] - GAP[0]);
        const k = who[turn++ % who.length], to = o.nearest ? o.nearest(k) : who.find((q) => q !== k);
        if (to == null || !M.can(to)) return;
        M.left--; M.ask(k, to);
      },
    };
    return M;
  }

  root.HumanForgeMind = { TRAITS, MOODS, PARTS, ADULT, API, COOL, roll, card, partOf, create };
})(typeof window !== 'undefined' ? window : globalThis);
