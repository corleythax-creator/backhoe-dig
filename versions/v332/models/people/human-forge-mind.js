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
 *   minds.key = '...';                   // the owner's key, once a device: the server answers nobody else
 *   minds.model = 'haiku' | 'sonnet' | 'opus';   // who speaks (about 0.03, 0.5 and 1 cent a line)
 *   minds.spend                          // the meter: { spent, cap, lines, day } (US$, today, Central), minds.cost the
 *                                        //   last line's; minds.meter() reads it, minds.setCap(usd) sets the cap
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
    // the owner's key (asked once a device; the server answers nobody else) and the model: 'haiku' (cheap) or 'opus'
    const OWN = KEY + '-key', MOD = KEY + '-model';
    const send = (body) => fetch(url, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, M.key ? { 'x-persona-key': M.key } : {}), body: JSON.stringify(body) });
    const why = (a) => { if (a.spend) M.spend = a.spend; if (a.error === 'off') M.server = false; return a.why || 'They could not answer just now.'; };
    const cool = new Map();  // key -> { 'kind|by': time }
    const ids = new WeakMap(); let nid = 0;
    const idOf = (x) => (typeof x === 'object' ? (ids.has(x) ? ids.get(x) : (ids.set(x, ++nid), nid)) : x);
    let next = 0, turn = 0;
    const M = {
      lines: [], asked: 0, busy: new Set(), status: '', server: null, chatter: false, left: CHATTER,
      spend: null, cost: 0,  // the meter: { spent, cap, lines, day } in US$ (today, Central time), and the last line's cost
      get key() { return store(OWN) || ''; },
      set key(v) { store(OWN, String(v || '').trim()); M.status = ''; M.meter(); },
      // 'haiku', 'sonnet' or 'opus' (a full model name such as 'claude-sonnet-5-5' is taken as its short one)
      get model() { const m = store(MOD) || ''; return LINE[m] ? m : 'haiku'; },
      set model(v) { const m = String(v || '').replace(/^claude-/, '').split('-')[0]; store(MOD, LINE[m] ? m : 'haiku'); changed(); },
      // today's spend and cap (owner only)
      async meter() {
        if (!M.key) { M.status = 'Enter the owner key to talk.'; changed(); return null; }
        try { const r = await send({ op: 'status' }), a = await r.json().catch(() => ({})); if (!r.ok) M.status = why(a); else { M.spend = a.spend; if (M.status.startsWith('Enter the owner')) M.status = ''; } } catch (e) { M.status = 'The meter could not be read.'; }
        changed(); return M.spend;
      },
      // the daily cap, US$ (0 to 50)
      async setCap(usd) {
        try { const r = await send({ op: 'cap', cap: +usd }), a = await r.json().catch(() => ({})); if (!r.ok) M.status = why(a); else { M.spend = a.spend; M.status = ''; } } catch (e) { M.status = 'The cap could not be set.'; }
        changed(); return M.spend;
      },
      get on() { return store(KEY) === '1'; },
      set on(v) { store(KEY, v ? '1' : '0'); if (!v) { M.chatter = false; M.hush(); } else M.check(); changed(); },
      card: (k) => o.card(k),
      nameOf: (k) => { const c = o.card(k); return c ? c.name : (o.label ? o.label(k) : 'someone'); },
      can: (k) => M.on && !!o.card(k),
      // is the server set up for it? (once a visit)
      async check() {
        if (M.server !== null) return M.server;
        try { const r = await fetch(url); M.server = r.ok && (await r.json()).on === true; } catch (e) { M.server = false; }
        if (!M.server) M.status = 'Not set up yet: Human Forge\'s site needs ANTHROPIC_API_KEY, PERSONA_OWNER_KEY and PERSONA_DB_SECRET.';
        else if (M.key) M.meter();
        changed();
        return M.server;
      },
      // key says something: to you, to another person (to: their key), or in reaction to ev
      async ask(k, to = 'you', ev = null) {
        if (!M.can(k) || (to !== 'you' && to != null && !M.can(to)) || M.busy.has(k)) return null;
        if (M.asked >= budget) { M.status = `That's ${budget} lines this visit; reload the page for more.`; changed(); return null; }
        if (!(await M.check())) return null;
        if (!M.key) { M.status = 'Enter the owner key to talk.'; changed(); return null; }
        const log = M.lines.filter((l) => l.p === k || l.to === k || (to !== 'you' && to != null && (l.p === to || l.to === to))).slice(-12).map((l) => ({ who: l.who, said: l.said }));
        const e = ev && { kind: ev.kind, who: ev.by != null ? M.nameOf(ev.by) : String(ev.who || '').slice(0, 40), what: String(ev.what || '').slice(0, 60), where: ev.where || '', danger: !!ev.danger, feet: ev.feet ? Math.round(ev.feet) : undefined };
        M.busy.add(k); M.asked++; M.status = ''; changed();
        try {
          const r = await send({ me: o.card(k), to: to === 'you' || to == null ? 'you' : o.card(to), scene: o.scene ? o.scene(k, to, ev) : '', log, event: e || undefined, model: M.model });
          const a = await r.json().catch(() => ({}));
          if (!r.ok) { M.status = why(a); if (a.error === 'cap') M.chatter = false; return null; }
          if (a.spend) { M.spend = a.spend; M.cost = a.cost || 0; }
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

  // what a line costs, roughly (about 1,200 tokens in and 300 out, at each model's price): for the meter's estimates
  const LINE = { haiku: 0.00027, sonnet: 0.0054, opus: 0.0108 }, NAME = { haiku: 'Haiku', sonnet: 'Sonnet', opus: 'Opus' };
  // under a dollar in cents, so line costs compare at a glance (0.03¢, 0.54¢, 1.1¢); a dollar or more as dollars
  const money = (v) => { v = +v || 0; if (v >= 1) return '$' + v.toFixed(2); const c = v * 100; return (c >= 10 ? c.toFixed(0) : c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '\u00a2'; };
  const dollars = (v) => '$' + (+v || 0).toFixed(2);
  // the meter in words: today's spend of the cap, lines, and about how many more at the model picked
  function meterText(M) {
    const s = M.spend; if (!s) return M.key ? 'Reading the meter...' : 'Enter the owner key to talk.';
    const left = Math.max(0, s.cap - s.spent), n = Math.floor(left / LINE[M.model]);
    return `Today: ${money(s.spent)} of ${dollars(s.cap)} (${s.lines} line${s.lines === 1 ? '' : 's'})` + (M.cost ? `, last line ${money(M.cost)}` : '') +
      `. About ${n.toLocaleString()} more at ${NAME[M.model]}.`;
  }
  // a small panel for any page: the owner key, which model speaks, the daily cap and the meter (o.button: a class for
  // the buttons, o.on: the class a picked one gets); returns paint(), to call when M changes
  function controls(el, M, o = {}) {
    const B = o.button || '', ON = o.on || 'on', caps = [0.5, 1, 2, 5, 10];
    el.innerHTML = `<div class="hfm-row"><span>Owner key</span><input type="password" autocomplete="off" placeholder="${M.key ? 'saved on this device' : 'the key from Vercel'}"><button class="${B}" data-a="key">Save</button></div>
      <div class="hfm-row"><span>Who speaks</span>${Object.keys(LINE).map((m) => `<button class="${B}" data-m="${m}">${NAME[m]}, ~${money(LINE[m])} a line</button>`).join('')}</div>
      <div class="hfm-row"><span>Daily cap</span>${caps.map((c) => `<button class="${B}" data-c="${c}">${dollars(c)}</button>`).join('')}</div>
      <div class="hfm-meter"></div>`;
    const inp = el.querySelector('input');
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') el.querySelector('[data-a=key]').click(); };
    el.querySelector('[data-a=key]').onclick = () => { if (inp.value.trim()) { M.key = inp.value; inp.value = ''; inp.placeholder = 'saved on this device'; } };
    el.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { M.model = b.dataset.m; paint(); }; });
    el.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => M.setCap(+b.dataset.c); });
    function paint() {
      if (!el.isConnected) return;
      el.querySelectorAll('[data-m]').forEach((b) => { b.classList.toggle(ON, b.dataset.m === M.model); b.setAttribute('aria-pressed', String(b.dataset.m === M.model)); });
      el.querySelectorAll('[data-c]').forEach((b) => { const on = !!M.spend && +b.dataset.c === M.spend.cap; b.classList.toggle(ON, on); b.setAttribute('aria-pressed', String(on)); });
      el.querySelector('.hfm-meter').textContent = meterText(M) + (M.status ? ' ' + M.status : '');
    }
    paint(); if (M.key && !M.spend) M.meter();
    return paint;
  }

  root.HumanForgeMind = { TRAITS, MOODS, PARTS, ADULT, API, COOL, LINE, NAME, roll, card, partOf, create, controls, meterText, money };
})(typeof window !== 'undefined' ? window : globalThis);
