/* Human Forge minds: a person's personality and what they say, in any app (no engine code here). Personalities are
 * designed with the person in Human Forge (the Design tab's Personality; spec.mind, and library.json's per-person
 * "mind" once built); a person without one gets one rolled from their id, the same every time. What they say comes
 * from the built-in mind (Brain, below: free, in the browser, the default: lines from their traits, what they have
 * learned and their mood), or, for the owner, from Human Forge's /api/persona (a language model under fixed rules kept
 * on that server: see api/persona.js), which answers only Human Forge's own pages and the sites it lists (Forge Studio).
 * Without the owner key or a server set up, the built-in mind speaks whatever was picked.
 * Classic script: sets window.HumanForgeMind. ES module: import './human-forge-mind.js' then use globalThis.HumanForgeMind.
 *
 *   HumanForgeMind.card({ id, name, age, gender | sex, mind })   // the personality, or null (under 18, or switched off)
 *     // mind (all optional): { on, name, traits (up to 4 of TRAITS), mood, about, voice, smarts (1..5: SMARTS, simple
 *     //   .. brilliant), knack (KNACKS: book, street, people, hands, numbers, creative), values (up to 3 of VALUES),
 *     //   likes (up to 3 of LIKES, the topics they talk about), job, from, goal (what they want, a verb first), worry };
 *     //   what is missing is rolled from the id (traits, mood, smarts, knack, values), the same every time
 *   HumanForgeMind.describe(card)        // who they are in a line: 'bright, book smart; cares about family and honesty; ...'
 *   const minds = HumanForgeMind.create({
 *     card: (key) => card or null,       // whose personality (key: anything the app uses for a person)
 *     people: () => [keys],              // who is in the scene
 *     nearest: (key) => key or null,     // who they would talk to among themselves
 *     scene: (key, to, ev) => 'a few plain words: where, when, who and what is about',
 *     show: (key, line, to, ev) => {},   // line: { say, mood, face, look }: put it over their head, turn them...
 *     changed: () => {},                 // something to redraw (the log, the status)
 *     sights: (key) => ['a black bear', { what: 'a wolf', danger: true, feet: 30, ref: wolf }, 'the window'],  // optional:
 *                                        //   anything they can see or hear (words, or { what, danger, threat 0..1, feet,
 *                                        //   moving, toward, sound, ref: the app's own handle }); looked over once a
 *                                        //   second: they notice what is new, what comes closer, what feared has gone
 *     act: (key, act, ev) => {},         // optional: what they decided to do about something they noticed (act.do: flee,
 *                                        //   back, freeze, warn, watch, investigate, help or call; act.at: its ref or
 *                                        //   who; act.threat/felt/keen 0..1); the app moves them, or not
 *     hears: (key, other) => true,       // optional: whether other hears key raise the alarm (default: everyone)
 *     url, budget, storage,              // optional: the API, most asks a visit (300), the on/off key ('hf-minds')
 *   });
 *   minds.on = false;                    // on unless switched off (kept in this browser)
 *   minds.model = 'local';               // who speaks: 'local' (built-in, free, the default), 'haiku', 'sonnet', 'opus'
 *   minds.knows(key) ; minds.unlearn()   // what the built-in mind has learned about the world, in words; forget it all
 *   minds.key = '...';                   // the owner's key, once a device: the server answers nobody else
 *   minds.spend                          // the meter: { spent, cap, lines, day } (US$, today, Central), minds.cost the
 *                                        //   last line's; minds.meter() reads it, minds.setCap(usd) sets the cap
 *   minds.tell(key, 'hello');            // you say something; they answer
 *   minds.tellAll([keys], 'how is everyone?')   // to a group: those it is for answer in turn (someone named: just them;
 *                                        //   a question or 'everyone': all, up to 6; else a few); minds.groupLog(keys)
 *   minds.event(key, { kind: 'touched', by: otherKey, where: 'shoulder' });   // they react to what happens to them
 *   minds.event(key, { kind: 'touched', by: otherKey, where: 'arm', what: 'an ice cube', how: 'cold' });   // with something
 *                                        //   held (how: cold | sticky | wet | slap); a slap with or without (built-in words)
 *   minds.event(key, { kind: 'arrived', by: otherKey });        // someone came in (or was put in the scene)
 *   minds.event(key, { kind: 'approached', by: otherKey });     // someone came over to them
 *   minds.event(key, { kind: 'animal', what: 'a black bear', danger: true, feet: 12 });
 *   minds.event(key, { kind: 'still', by: otherKey });          // someone lying still nearby (dead, in a game)
 *   minds.event(key, { kind: 'left', by: otherKey });           // someone went (built-in mind only)
 *   minds.event(key, { kind: 'thing', what: 'a red pickup', how: 'car' });   // look | car | sit | pet | road (built-in mind only)
 *   minds.event(key, { kind: 'lost', how: 'wake', what, by, dir, goal, story });   // a story they are in (built-in words;
 *                                        //   with a model speaking the built-in mind says these too): not where they
 *                                        //   should be, finding the way out together. how: wake (coming to, looking
 *                                        //   round), around (what: what they see), ask (by: someone else lost), plan
 *                                        //   (goal: a verb first, 'get back home'), search (dir: 'toward the barn'),
 *                                        //   nothing (came back empty), found (what: 'a way out'), come (by: who found
 *                                        //   it), out (leaving), wonder (a thought while it goes on), done (goal reached)
 *                                        //   story: which (STORY: storm, pet, child, stranded, fire, treasure; else lost)
 *   minds.event(key, { kind: 'notice', what: 'smoke', feet: 40, ref }); // anything at all (built-in mind's words; any
 *                                        //   speaker's decision): fire, a scream, a strange box, a storm, footprints...
 *   minds.decide(key, { what: 'a wolf', danger: true, feet: 20 }) // what they would do, said nowhere: { do, at, ... }
 *   await minds.plan(key, ['eat', 'tv', 'company'], needs, 'Daniel') // a model's pick of what they do next: { pick, why, say, mood } or null
 *   // plans made together (a model speaking): o.joint(key, other) -> keys both could do together now (eat, drink, tv, pool,
 *   // sleep, or a town's errands: town_store, town_beer, town_square, town_shop, town_stroll); a line between them may suggest one (o.proposed(key, other, what)), the other answers, and
 *   // o.agreed(by, key, what, yes) says how it went: the app sets them both off
 *   minds.nature(key)                    // { fear, curious, nerve, bold, warm, shy, talk, energy }, 0..1
 * Everyone notices; what they make of it is their own. Each thing is felt through their nature: the easily frightened
 * (nervous, timid, cautious, shy) feel more threat from less and back off, freeze or run; the inquisitive (curious,
 * adventurous, worldly) go and look at what others only watch, and ask when someone raises the alarm; the bold and
 * warm warn the others and go to help; a bad mood makes anyone jumpier, and fear of a thing they keep meeting grows.
 *   minds.chatter = true; every frame: minds.step(dt)           // they talk among themselves now and then (built-in:
 *                                                               //   and remark on what is round them, even alone)
 * Events are dropped while one is pending for that person and within COOL seconds of the same thing happening again,
 * so an app may call event() every frame something is true. Guardrails: adults only (here and on the server), the
 * server's rules, at most `budget` asks a visit, chatter stops after CHATTER lines with nothing from you (models only).
 */
(function (root) {
  const TRAITS = ['warm', 'witty', 'shy', 'bold', 'dry', 'cheerful', 'grumpy', 'curious', 'calm', 'nervous', 'romantic',
    'sarcastic', 'kind', 'proud', 'dreamy', 'practical', 'chatty', 'quiet', 'flirty', 'serious', 'silly', 'worldly',
    'brave', 'cautious', 'adventurous', 'timid'];
  const ROLLED = TRAITS.slice(0, 22);   // what a person without a designed personality is rolled from (kept, so nobody's roll changes)
  const MOODS = ['calm', 'happy', 'playful', 'curious', 'shy', 'tired', 'annoyed', 'sad', 'surprised', 'thoughtful'];
  const PARTS = ['head', 'face', 'hair', 'neck', 'shoulder', 'arm', 'hand', 'back', 'side', 'chest', 'waist', 'hip', 'leg', 'knee', 'foot'];
  const ADULT = 18, API = 'https://human-forge-beta.vercel.app/api/persona', CHATTER = 24, GAP = [9, 15];
  const COOL = { touched: 25, arrived: 40, approached: 45, animal: 40, still: 90, left: 30, notice: 30, alarm: 20, gone: 60, thing: 45, lost: 5 };
  const SERVER = ['touched', 'arrived', 'approached', 'animal', 'still'];   // the kinds the server's model takes; the rest are built-in only
  const MILD = ['ignore', 'watch', 'investigate', 'help'];   // what a model may decide in place of the built-in mind's pick (api/persona.js has the same list); fleeing, backing off, freezing, warning and calling stay instinct
  const DECIDE_WAIT = 2500;   // ms a model has to decide before the built-in mind's pick is acted on
  const SPEAKERS = ['local', 'mix', 'haiku', 'sonnet', 'opus'];   // mix: the built-in mind, and Haiku for the lines it cannot understand
  // intelligence: how sharp they are (1..5) and the way they are clever; what matters to them; the topics they are into
  const SMARTS = ['', 'simple', 'average', 'sharp', 'bright', 'brilliant'];
  const KNACKS = { book: 'book smart', street: 'street smart', people: 'good with people', hands: 'good with their hands', numbers: 'quick with numbers', creative: 'creative' };
  const VALUES = ['family', 'honesty', 'loyalty', 'freedom', 'ambition', 'adventure', 'comfort', 'faith', 'fairness', 'knowledge', 'fun', 'tradition', 'kindness', 'independence', 'beauty'];
  // how they behave: what they keep quiet about (they still notice and learn from it), each a group of event kinds
  const QUIET = { touched: ['touched'], comings: ['arrived', 'approached'], goings: ['left'], things: ['notice', 'see', 'thing', 'animal', 'gone', 'muse'] };
  const LIKES = ['weather', 'food', 'music', 'travel', 'books', 'work', 'animals', 'movies', 'garden', 'cars', 'history', 'stars', 'sport', 'coffee', 'sea', 'art', 'games'];

  // traits and a mood rolled from a seed (a person's id): the same each time
  function roll(seed) {
    let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296), traits = [];
    while (traits.length < 3) { const t = ROLLED[Math.floor(r() * ROLLED.length)]; if (!traits.includes(t)) traits.push(t); }
    const mood = MOODS[Math.floor(r() * 4)];
    // how sharp (mostly average or sharp, a few simple, bright or brilliant), the way they are clever, two values
    const u = r(), smarts = u < 0.1 ? 1 : u < 0.45 ? 2 : u < 0.75 ? 3 : u < 0.93 ? 4 : 5, KK = Object.keys(KNACKS), knack = KK[Math.floor(r() * KK.length)], values = [];
    while (values.length < 2) { const v = VALUES[Math.floor(r() * VALUES.length)]; if (!values.includes(v)) values.push(v); }
    return { traits, mood, smarts, knack, values };
  }
  const listOf = (a, ok, n) => (Array.isArray(a) ? a : []).filter((x, i, all) => ok.includes(x) && all.indexOf(x) === i).slice(0, n);
  const nice = (s) => String(s || 'someone').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  // a person's personality: what was designed (mind), filled in from their id; null for anyone under 18 or switched off
  function card(p) {
    if (!p || !(+p.age >= ADULT)) return null;
    const m = p.mind || {}; if (m.on === false) return null;
    const r = roll(p.id || p.name), traits = (m.traits && m.traits.length ? m.traits : r.traits).filter((t) => TRAITS.includes(t)).slice(0, 4), values = listOf(m.values, VALUES, 3);
    // a rolled intelligence leans up a step for the curious, worldly and witty
    const smarts = +m.smarts >= 1 && +m.smarts <= 5 ? Math.round(+m.smarts) : Math.min(5, r.smarts + (traits.some((t) => /curious|worldly|witty/.test(t)) && r.smarts < 3 ? 1 : 0));
    return { name: m.name || nice(p.name || p.id), age: Math.round(+p.age), sex: p.sex ? (p.sex === 'man' ? 'man' : 'woman') : (+p.gender ? 'man' : 'woman'),
      traits, mood: MOODS.includes(m.mood) ? m.mood : r.mood,
      about: String(m.about || '').slice(0, 300), voice: String(m.voice || '').slice(0, 120),
      smarts, knack: KNACKS[m.knack] ? m.knack : r.knack, values: values.length ? values : r.values, likes: listOf(m.likes, LIKES, 3),
      job: String(m.job || '').trim().slice(0, 40), from: String(m.from || '').trim().slice(0, 40), goal: String(m.goal || '').trim().slice(0, 120), worry: String(m.worry || '').trim().slice(0, 120),
      // how they behave: how readily they start talking (0 only when spoken to .. 1 chatty), how they feel about the
      // others round them to begin with (-1 cold .. 1 fond; what happens moves it from there), what they keep quiet about
      chat: isFinite(+m.chat) && m.chat !== '' && m.chat != null ? Math.min(1, Math.max(0, +m.chat)) : 0.5,
      fond: isFinite(+m.fond) && m.fond != null ? Math.min(1, Math.max(-1, +m.fond)) : 0, quiet: listOf(m.quiet, Object.keys(QUIET), 4) };
  }
  // who someone is, in a line: how sharp and how, what matters to them, work and home, what they want and fear
  const aOf = (s) => (/^(a|an|the|new in)\b/i.test(s) ? s : (/^[aeiou]/i.test(s) || /^[AEFHILMNORSX][A-Z]/.test(s) ? 'an ' : 'a ') + s);
  function describe(c) {
    if (!c) return '';
    const and = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '');
    return [SMARTS[c.smarts] + ', ' + KNACKS[c.knack], c.values.length ? 'cares about ' + and(c.values) : '', c.job ? aOf(c.job) + (c.from ? ' from ' + c.from : '') : c.from ? 'from ' + c.from : '',
      c.goal ? 'wants to ' + c.goal : '', c.worry ? 'worries about ' + c.worry : ''].filter(Boolean).join('; ');
  }
  // a part of the body in plain words, from a bone or part name (anything else is their side)
  function partOf(n) {
    n = String(n || '').toLowerCase();
    return /finger|thumb|index|middle|ring|pinky|hand/.test(n) ? 'hand' : /head|face|jaw/.test(n) ? 'face' : /neck/.test(n) ? 'neck'
      : /clavicle|shoulder/.test(n) ? 'shoulder' : /arm/.test(n) ? 'arm' : /foot|toe|ball/.test(n) ? 'foot' : /calf|knee/.test(n) ? 'knee'
        : /thigh|leg/.test(n) ? 'leg' : /pelvis|hip/.test(n) ? 'hip' : /spine_01|waist/.test(n) ? 'waist' : 'side';
  }
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };

  // ---- the built-in mind: lines made here in the browser, from the personality, what they have learned and how they
  // feel; no server, no cost. Intelligence runs through it: the sharp work sums out right, know facts (or, by their knack,
  // things they have learnt about people, tools, the street, ideas), weigh a question and give real advice, reach for a
  // bigger word and keep more of what you said in mind; the simple fumble sums, may forget your name, keep it short and
  // hesitate; those good with people read how you feel and ask after it later. Their work, home, what they want, what
  // worries them and what they hold to come up when asked and on their own (a worry when low). Each person's profile (how warm, sharp, shy, bold, funny, plain, curious, dreamy, talkative,
  // lively and steady they are, two interests, a word they lean on, an exclamation) comes from their traits over a roll
  // of their own name and id, so no two are alike. What they learn is kept in this browser (KEY + '-brain'): who they
  // have met and how they feel about them, what those people are into, the user's name and likes, the things and animals
  // they have seen (a danger they keep meeting stays feared; a harmless one gets familiar), and a mood that events push
  // and that drifts back to their own. Every line is written here (nothing the user types is said back), so it stays clean.
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const rngOf = (seed) => { let h = hash(seed) || 1; return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0, h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0, h ^= h >>> 16) >>> 0) / 4294967296; };
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const cap = (s) => String(s).replace(/^./, (c) => c.toUpperCase());
  const FLAV = ['warm', 'edge', 'shy', 'bold', 'humor', 'plain'];
  const TRAIT_DIMS = {
    warm: { warm: 0.35 }, kind: { warm: 0.3, edge: -0.15 }, cheerful: { humor: 0.2, warm: 0.15, energy: 0.25 }, romantic: { warm: 0.15, dream: 0.35 },
    witty: { humor: 0.35 }, silly: { humor: 0.35, energy: 0.15, plain: -0.15 }, flirty: { bold: 0.25, humor: 0.1, warm: 0.1 },
    shy: { shy: 0.4, talk: -0.25, bold: -0.2 }, nervous: { shy: 0.3, nerve: -0.4 }, quiet: { shy: 0.2, talk: -0.4 },
    bold: { bold: 0.35, nerve: 0.3, shy: -0.2 }, proud: { bold: 0.3, edge: 0.1 }, dry: { edge: 0.25, humor: 0.15, energy: -0.1 },
    sarcastic: { edge: 0.35, humor: 0.15 }, grumpy: { edge: 0.4, warm: -0.2, energy: -0.1 }, calm: { plain: 0.3, nerve: 0.25, energy: -0.15 },
    practical: { plain: 0.35, dream: -0.15 }, serious: { plain: 0.3, humor: -0.2 }, curious: { curious: 0.4 }, dreamy: { dream: 0.4, plain: -0.1 },
    worldly: { curious: 0.15, plain: 0.1, bold: 0.1 }, chatty: { talk: 0.4, energy: 0.15, shy: -0.15 },
    // how easily frightened (fear) and how inquisitive (curious): every trait leans one way or the other a little
    brave: { fear: -0.4, nerve: 0.35, bold: 0.1 }, cautious: { fear: 0.25, curious: -0.1, plain: 0.1 },
    adventurous: { curious: 0.35, fear: -0.25, bold: 0.1, energy: 0.1 }, timid: { fear: 0.4, shy: 0.25, nerve: -0.3, bold: -0.15 },
  };
  const TRAIT_FEAR = { nervous: 0.35, shy: 0.12, quiet: 0.05, dreamy: 0.05, romantic: 0.05, kind: 0.05, bold: -0.2, calm: -0.15, proud: -0.1, grumpy: -0.05, practical: -0.08, worldly: -0.1, curious: -0.05 };
  const VALUE_DIMS = { kindness: { warm: 0.1 }, family: { warm: 0.05 }, ambition: { bold: 0.1, energy: 0.05 }, adventure: { bold: 0.05, energy: 0.1, curious: 0.05 }, knowledge: { curious: 0.15 },
    fun: { humor: 0.1, energy: 0.05 }, comfort: { energy: -0.05, plain: 0.05 }, tradition: { plain: 0.1 }, honesty: { plain: 0.05, edge: 0.05 }, fairness: { edge: 0.05 }, independence: { bold: 0.05, talk: -0.05 },
    freedom: { dream: 0.05, energy: 0.05 }, beauty: { dream: 0.15 }, faith: { warm: 0.05, nerve: 0.05 }, loyalty: { warm: 0.05 } };
  const MOOD_VA = { calm: [0.15, 0.3], happy: [0.6, 0.55], playful: [0.55, 0.75], curious: [0.3, 0.6], shy: [0, 0.4], tired: [-0.05, 0.1], annoyed: [-0.5, 0.7], sad: [-0.55, 0.25], surprised: [0.1, 0.9], thoughtful: [0.1, 0.35] };
  const TICS = { start: ['Honestly,', 'I mean,', 'Look,', 'Well,', 'Okay so,', 'To be fair,', 'Funny thing is,', 'Thing is,', 'See,', 'Right,'], end: [', you know.', ', honestly.', ', if you ask me.', ', I reckon.', ', really.', ', I suppose.'] };
  const EXCL = { warm: ['Oh!', 'Oh my.', 'Goodness!'], edge: ['Huh.', 'Hm.', 'Well.'], shy: ['Oh...', 'Oh, um.'], bold: ['Ha!', 'Whoa!'], humor: ['Ha!', 'Well, well.', 'Oh ho!'], plain: ['Oh.', 'Right.', 'Huh.'] };
  // what they talk about: a few things they would say, and ask, about each; words that mean the user is on it
  const TOPICS = {
    weather: { n: 'the weather', w: /weather|rain|sun|snow|wind|storm|cold|hot|warm out/, say: ['Feels like rain later.', 'Lovely light today, isn\'t it?', 'I could do with a bit more sun.', 'There\'s a chill in the air tonight.', 'I love a proper thunderstorm.'], ask: ['Warm enough for you?', 'Do you like it when it rains?'] },
    food: { n: 'food', w: /food|eat|hungry|dinner|lunch|breakfast|pizza|cook|snack|bread|soup|dessert|cake/, say: ['I could really go for a proper breakfast right now.', 'I tried baking bread last week. It came out a brick.', 'Nothing beats a good bowl of soup.', 'I\'ve been craving noodles all day.', 'I make a decent curry, if I say so myself.'], ask: ['What\'s the best thing you\'ve eaten lately?', 'Do you cook?'] },
    music: { n: 'music', w: /music|song|band|sing|guitar|piano|concert|jazz|rock|album/, say: ['I\'ve had the same song stuck in my head all day.', 'I used to play guitar. Badly.', 'Live music is the best thing there is.', 'I\'ve been listening to a lot of old jazz lately.'], ask: ['What are you listening to these days?', 'Do you play anything?'] },
    travel: { n: 'travel', w: /travel|trip|holiday|vacation|abroad|flight|beach|city|country|road trip/, say: ['I\'d love to see the mountains again.', 'Best trip I ever took was a week by the sea.', 'I always pack too much.', 'One day I\'m going to just get on a train and see where it goes.'], ask: ['Where would you go, if you could go anywhere?', 'Been anywhere good lately?'] },
    books: { n: 'books', w: /book|read|novel|story|library|author|poem/, say: ['I\'m halfway through a mystery and I can\'t put it down.', 'I fall asleep reading every single night.', 'Give me a rainy day and a good book.', 'I always read the last page first. Don\'t judge me.'], ask: ['Read anything good lately?', 'Are you a reader?'] },
    work: { n: 'work', w: /work|job|boss|office|shift|career|meeting|busy/, say: ['Work has been a lot this week.', 'I\'m trying not to think about work.', 'I like being busy, honestly.', 'I keep meaning to ask for a raise.'], ask: ['What do you do for work?', 'Busy week?'] },
    animals: { n: 'animals', w: /animal|dog|cat|horse|bird|pet|puppy|kitten/, say: ['I miss having a dog around.', 'Cats are smarter than they let on.', 'I could watch birds all day.', 'I always want to pet every dog I see.'], ask: ['Dogs or cats?', 'Do you have any pets?'] },
    movies: { n: 'movies', w: /movie|film|cinema|tv|show|series|watch/, say: ['I watched an old film last night, the kind with real stunts.', 'I\'ve seen that one comedy a dozen times.', 'I always cry at the end of films. Every time.', 'I can never pick what to watch.'], ask: ['Seen anything good lately?', 'What\'s your favourite film?'] },
    garden: { n: 'gardening', w: /garden|plant|flower|tomato|grow|seed|tree/, say: ['My tomatoes finally came up this year.', 'I talk to my plants. They seem to like it.', 'Nothing smells like a garden after rain.'], ask: ['Do you grow anything?', 'Got a garden?'] },
    cars: { n: 'cars', w: /car|drive|truck|engine|road|motor/, say: ['I\'d love an old convertible one day.', 'There\'s nothing like a long drive at night.', 'My car makes a noise I\'ve decided not to worry about.'], ask: ['What do you drive?', 'Do you like driving?'] },
    history: { n: 'history', w: /history|old|ancient|war|castle|museum/, say: ['I could spend a whole day in a museum.', 'Imagine living two hundred years ago. No coffee. Well, some coffee.', 'Old buildings have so many stories.'], ask: ['If you could visit any time in history, when?', 'Do you like museums?'] },
    stars: { n: 'the stars', w: /star|space|moon|planet|sky|night sky|astronom/, say: ['On a clear night you can see so many stars out here.', 'The moon was huge the other night.', 'I always wanted to be an astronaut.'], ask: ['Do you ever just look up at the stars?', 'Would you go to space, if you could?'] },
    sport: { n: 'sport', w: /sport|game|football|soccer|baseball|basketball|tennis|run|gym|team|match/, say: ['I go for a run most mornings. Most.', 'Did you catch the game?', 'I\'m terrible at sport but I love watching it.'], ask: ['Do you play anything?', 'Who do you follow?'] },
    coffee: { n: 'coffee', w: /coffee|tea|caf[eé]|espresso|latte/, say: ['I need coffee before I\'m a real person.', 'I\'ve gone over to tea. Mostly.', 'There\'s a little cafe I love near me.'], ask: ['Coffee or tea?', 'How do you take your coffee?'] },
    sea: { n: 'the sea', w: /sea|ocean|beach|boat|sail|swim|fish|lake|river/, say: ['I grew up near the water. I miss it.', 'I\'d live on a boat if I could.', 'Fishing is just sitting quietly with an excuse.'], ask: ['Do you like swimming?', 'Beach or mountains?'] },
    art: { n: 'art', w: /art|paint|draw|sketch|gallery|photo/, say: ['I\'ve started sketching again.', 'I took a pottery class once. One bowl survived.', 'I love a good gallery on a quiet day.'], ask: ['Do you make anything?', 'Painting or photography?'] },
    games: { n: 'games', w: /video game|games|cards|chess|puzzle|board game/, say: ['I\'m a menace at board games.', 'I\'ve been doing a crossword every morning.', 'Chess is the only game I lose gracefully.'], ask: ['Up for a game of cards sometime?', 'Are you competitive?'] },
  };
  const TKEYS = Object.keys(TOPICS);
  const LEANS = { dream: ['stars', 'books', 'music', 'sea', 'art'], plain: ['work', 'cars', 'food', 'garden', 'sport'], curious: ['history', 'travel', 'stars', 'books'], humor: ['games', 'movies', 'food'], warm: ['animals', 'food', 'garden', 'coffee'], bold: ['sport', 'travel', 'cars'] };
  // lines for what happens, by flavour (one is picked by the person's own mix of them; any: whoever)
  // how a touch felt (the app's ev.how) -> its lines
  const HOW = { tickle: 'tickled', cream: 'creamed', oil: 'oiled', pour: 'doused', brush: 'brushed' };
  const L = {
    touchGood: { warm: ['Oh, hello, {name}.', 'Hey you. That\'s nice.', 'Hi {name}.'], edge: ['Oh. Hi, {name}.', 'Yes, {name}? I\'m here.'], shy: ['Oh! Hi... {name}.', 'Oh, um, hello.'], bold: ['Ha, hello to you too, {name}.', 'There you are, {name}.'], humor: ['Tag, I\'m it?', 'Ha! Hi, {name}.'], plain: ['Hi, {name}.', 'Hey.'] },
    touchNew: { warm: ['Oh! Hello there.', 'Oh, hi. I don\'t think we\'ve met.'], edge: ['Can I help you?', 'Um. Hello?'], shy: ['Oh! Sorry, you made me jump.', 'Oh... hi.'], bold: ['Whoa, hello. And you are?', 'Well, hello. Introduce yourself first, maybe.'], humor: ['Oh! Is this how we\'re meeting?', 'Hi! Do I know you?'], plain: ['Oh, hello.', 'Hi. Can I help?'] },
    touchWary: { warm: ['Oh, my {part}. That\'s okay, just a bit sudden.', 'Easy, {name}.'], edge: ['That\'s my {part}, {name}.', 'Personal space, {name}.'], shy: ['Oh, um... my {part}.', 'Sorry, I\'m a bit jumpy.'], bold: ['Steady on, {name}.', 'Ask first, {name}.'], humor: ['Careful, the {part} bruises easily.', 'Whoa, warn a person.'], plain: ['Mind my {part}, please.', 'Not the {part}, {name}.'] },
    // touched with something held (what), by how it feels, and slapped
    touchWith: { warm: ['Oh, {the}? On my {part}? You\'re sweet, {name}.', 'Mm, what\'s that? {the}?'], edge: ['Why is {the} on my {part}, {name}?', 'Is that {the}? Really, {name}?'], shy: ['Oh! Um... {the}?', 'What... is that {the}?'], bold: ['Ha, {the}. What are you up to, {name}?', 'Bring {the} here, then.'], humor: ['Is {the} the new way of saying hello?', 'Ah yes, {the}. Very normal.'], plain: ['That\'s {the}, {name}.', 'What\'s with {the}?'] },
    touchWithWary: { warm: ['Um, {name}, why {the}?', 'Careful with {the}, please.'], edge: ['Get {the} off my {part}.', 'Not with {the}, {name}.'], shy: ['Please, not {the}...', 'Oh... I don\'t know about {the}.'], bold: ['Put {the} down, {name}.', 'Try that with {the} again and see.'], humor: ['I didn\'t order {the} on my {part}.', 'Is {the} on the room bill too?'], plain: ['Stop that with {the}.', 'No, {name}.'] },
    chilly: { warm: ['Ah! That\'s cold!', 'Eek! Cold, cold, cold, {name}!'], edge: ['Cold! Seriously, {name}?', 'That\'s freezing. Stop.'], shy: ['Oh! So cold...', 'Ah... cold.'], bold: ['Ooh, cold. Do that again.', 'Ha! Ice on my {part}? Bold.'], humor: ['Brr! Is the minibar out of ideas?', 'Cold! I\'m filing a complaint with the front desk.'], plain: ['That\'s cold.', 'Cold! {name}!'] },
    sticky: { warm: ['Mm, sticky. Is that {the}?', 'Now I\'m all sticky, {name}.'], edge: ['Great, now my {part} is sticky.', 'Sticky. Thanks, {name}.'], shy: ['Oh... sticky.', 'It\'s all sticky now.'], bold: ['Sticky. Got a napkin, {name}?', 'Mm, sweet. Now what?'], humor: ['I\'m candied now. Thanks.', 'I\'m going to attract ants, {name}.'], plain: ['That\'s sticky.', 'Sticky, {name}.'] },
    slapped: { warm: ['Ow! {name}!', 'Hey! That stung.'], edge: ['Did you just slap me?', 'Do that again. I dare you.'], shy: ['Ow... why?', 'Oh! That hurt a little.'], bold: ['Oh, rough today, {name}?', 'Ha! Is that all you\'ve got?'], humor: ['Ow! I felt that in my soul.', 'Was that a high five that missed?'], plain: ['Ow.', 'Hey! Don\'t.'] },
    slappedWith: { warm: ['Ow! With {the}, {name}?', 'Hey! {the} stings!'], edge: ['You hit me with {the}?', 'Put {the} down. Now.'], shy: ['Ow! Not with {the}...', 'Oh! That was {the}...'], bold: ['Ha! {the}? Really?', 'Swatting me with {the}, {name}?'], humor: ['Ow! Death by {the}. What a way to go.', 'Assaulted with {the}. I\'ll tell the front desk.'], plain: ['Ow, {the}.', 'Don\'t hit me with {the}.'] },
    tickled: { warm: ['Ha! No! Not there, {name}!', 'Stop, stop, ha, I\'m ticklish!'], edge: ['Don\'t. Tickle. Me. Ha! {name}!', 'Ha... stop that.'], shy: ['Hee! Oh no, I\'m so ticklish...', 'Ha, please, no!'], bold: ['Ha! You\'ll pay for that, {name}!', 'Oh, you want a tickle war?'], humor: ['Ha! I surrender! I surrender!', 'This is a war crime, {name}! Ha!'], plain: ['Ha! That tickles.', 'Ha, stop!'] },
    creamed: { warm: ['Whipped cream? On my {part}? Now you have to clean it up.', 'Mm, cold and sweet, {name}.'], edge: ['Really? Cream on my {part}?', 'You\'re cleaning that up, {name}.'], shy: ['Oh! It\'s cold... and everywhere.', 'Um, whipped cream?'], bold: ['Go on then, hand me a napkin.', 'Ha. Dessert is served, {name}.'], humor: ['Am I a sundae now?', 'I\'d like a cherry on top, please.'], plain: ['That\'s whipped cream.', 'Cream, {name}? Really?'] },
    oiled: { warm: ['Mm, warm oil. Keep going.', 'Oh, that smells lovely, {name}.'], edge: ['Easy, that\'s a lot of oil.', 'Don\'t get it on the sheets.'], shy: ['Oh... that feels nice.', 'Mm, it\'s warm.'], bold: ['Now rub it in, {name}.', 'Mm, my shoulders too.'], humor: ['Am I being basted?', 'I\'m going to slide right off the bed.'], plain: ['Mm, oil.', 'That\'s nice, {name}.'] },
    doused: { warm: ['Hey! That\'s {what}, {name}!', 'Oh! It\'s cold!'], edge: ['Did you just pour {what} on me?', 'That\'s a waste of {what}, {name}.'], shy: ['Oh! I\'m all wet...', 'Oh no... {what}?'], bold: ['Ha! Now you owe me a drink.', 'Bold, {name}. Very bold.'], humor: ['I\'ll have mine in a glass next time.', 'Is this how they serve it here?'], plain: ['Hey, I\'m soaked.', 'That\'s {what}!'] },
    brushed: { warm: ['Mm, that\'s lovely. Keep brushing.', 'Oh, nobody\'s brushed my hair in years.'], edge: ['Gently. There are knots.', 'Fine. Just be careful.'], shy: ['Oh... that\'s nice.', 'Mm, thank you, {name}.'], bold: ['Harder, it\'s fine.', 'Mm, I could get used to this.'], humor: ['Do I get a braid too?', 'Is this the deluxe service?'], plain: ['That\'s nice.', 'Thanks, {name}.'] },
    touchCross: { warm: ['{name}, that\'s enough now, please.', 'Okay, {name}, I need a bit of space.'], edge: ['Do you mind?', 'Hands to yourself, {name}.', 'Seriously, {name}. Stop.'], shy: ['Please stop, {name}.', 'Um, could you not?'], bold: ['Back off, {name}.', 'That\'s enough, {name}.'], humor: ['Okay, that\'s quite enough poking for one day.', 'I\'m starting a tab, {name}.'], plain: ['Please stop that.', 'Enough, {name}.'] },
    hello: { warm: ['Oh, hello! I\'m {me}. Lovely to meet you.', 'Hi there, I\'m {me}.'], edge: ['Hm. Someone new. I\'m {me}.', 'Hello. {me}.'], shy: ['Oh... hello. I\'m {me}.', 'Hi. Um, I\'m {me}.'], bold: ['Hey! I\'m {me}. And you are?', 'Hello, hello. {me}, nice to meet you.'], humor: ['A new face! I\'m {me}, the fun one.', 'Hi! I\'m {me}. Don\'t believe anything they\'ve told you.'], plain: ['Hi, I\'m {me}.', 'Hello. I\'m {me}.'] },
    again: { warm: ['{name}! So good to see you again.', 'There you are, {name}. I hoped you\'d come.'], edge: ['{name}. You again.', 'Oh, it\'s {name}.'], shy: ['Oh, hi {name}.', 'Hi again, {name}.'], bold: ['{name}! Get over here.', 'Look who it is. {name}!'], humor: ['{name}! I was just talking about you. Nothing bad. Mostly.', 'The famous {name} returns!'], plain: ['Hi again, {name}.', 'Good to see you, {name}.'] },
    cold: { warm: ['Oh, hello, {name}.'], edge: ['Oh. {name}\'s here.', 'Great. {name}.'], shy: ['Oh... {name}.'], bold: ['{name}. Thought you\'d gone.'], humor: ['Ah, {name}. Of course.'], plain: ['{name}.', 'Hello, {name}.'] },
    over: { warm: ['Hi {name}, come join me.', 'Oh, hello! Come and stand with me.'], edge: ['Can I help you, {name}?', 'Yes?'], shy: ['Oh, hi... {name}.', 'Oh, hello.'], bold: ['{name}! Pull up a spot.', 'Hey {name}, what\'s new?'], humor: ['{name}! You found the good spot.', 'Welcome to the cool corner, {name}.'], plain: ['Hey, {name}.', 'Hi, {name}. What\'s up?'] },
    danger: { warm: ['Oh no. Everyone, slowly, back away from {the}.', 'Please tell me {the} isn\'t coming this way.'], edge: ['Of course there\'s {what}. Perfect.', 'Nobody do anything stupid. {the} is right there.'], shy: ['Oh no, oh no, {the}...', 'I don\'t like this. {the} is so close.'], bold: ['Easy now. Nobody make any sudden moves.', 'Stay behind me. I\'ve got eyes on {the}.'], humor: ['So, um, is {the} friendly? Asking for me.', 'I\'d like to leave now, please.'], plain: ['{What}, about {feet} feet off. Keep still.', 'Back away from {the}, slowly.'] },
    dangerAgain: { warm: ['{the} is back. Stay close, everyone.'], edge: ['{the} again. I still don\'t trust it.'], shy: ['It\'s back... {the} is back.'], bold: ['{the} again. I\'m keeping an eye on it.'], humor: ['{the} returns. Nobody invited it.'], plain: ['{the} again. Same as before: keep clear.'] },
    animal: { warm: ['Oh, look at {the}!', 'Hello, sweetheart. Aren\'t you lovely?'], edge: ['{What}. As long as it keeps to itself.', 'Huh. {What}.'], shy: ['Oh, {what}. Hello there...', 'Is {the} friendly?'], bold: ['Hey there, you! Come here.', 'Look at {the}. Gorgeous.'], humor: ['{What}! Somebody give it a name.', 'Is {the} invited too?'], plain: ['There\'s {what}.', '{What}, over there.'] },
    animalAgain: { warm: ['Our friend {the} is back.', 'I think {the} likes it here.'], edge: ['{the}, still hanging about.'], shy: ['{the} again. I think I\'m getting used to it.'], bold: ['{the}! Old friend.'], humor: ['{the} has basically moved in.'], plain: ['{the} is still around.'] },
    still: { warm: ['{name}? Are you alright? {name}!', 'Oh no. Someone check on {name}.'], edge: ['{name}? Hey. Get up.', 'This isn\'t funny, {name}.'], shy: ['Is... is {name} okay?', 'Oh no. {name}?'], bold: ['{name}! Talk to me!', 'Someone help me with {name}.'], humor: ['{name}? Okay, joke\'s over. {name}?'], plain: ['{name} isn\'t moving.', 'Check on {name}.'] },
    left: { warm: ['Bye, {name}! Come back soon.', 'Oh, {name}\'s going. Take care!'], edge: ['And there goes {name}.', 'Bye, then.'], shy: ['Oh, bye, {name}.'], bold: ['See you around, {name}!'], humor: ['{name} has left the building.'], plain: ['Bye, {name}.', 'See you, {name}.'] },
    // a thing they went over to (ev.kind 'thing', built-in only): how 'look' at it, 'sit' on it, 'car' a vehicle up close,
    // 'pet' an animal they are stroking, 'road' a vehicle driving past too close
    look: { warm: ['Oh, {the} is lovely up close.', 'Come and look at {the}.'], edge: ['{the}. Seen better.', 'Hm. {the}. It\'ll do.'], shy: ['I just wanted a look at {the}...'], bold: ['Now this is {what}. Come see.', 'Look at the size of {the}.'], humor: ['If {the} talks back, I\'m leaving.', 'Me and {the}, getting acquainted.'], plain: ['Just having a look at {the}.', 'So this is {the}.'] },
    car: { warm: ['Isn\'t {the} nice? I\'d love a go in it.', 'Whose is {the}? It\'s gorgeous.'], edge: ['Somebody parked {the} right here. Brilliant.', '{the}. Probably drinks fuel.'], shy: ['I\'ve always wanted to sit in {what}.'], bold: ['Keys. Who has the keys to {the}?', 'I could drive {the}. Easy.'], humor: ['{the}: zero to late in sixty seconds.', 'I\'m not saying I\'d steal {the}, but I\'m not not saying it.'], plain: ['That\'s {what}.', '{the}. Nice.'] },
    sit: { warm: ['Ah, that\'s better. Sit with me.', 'Lovely to take the weight off.'], edge: ['Finally, somewhere to sit.', 'My feet were done.'], shy: ['I\'ll just sit here, if that\'s okay.'], bold: ['Best seat in the place. Mine.'], humor: ['{the} and I are in a relationship now.', 'I\'m never getting up.'], plain: ['I\'ll sit for a bit.', 'Good, {the}.'] },
    pet: { warm: ['Who\'s a good one? You are!', 'Oh, you\'re so soft.'], edge: ['Fine. One pat.', 'Alright, alright. Good animal.'], shy: ['Hi... can I pet you? Oh, okay.'], bold: ['Come here, you. Good!'], humor: ['I\'m adopting {the}. It\'s decided.', '{the} likes me more than people do.'], plain: ['Good {bare}.', 'There you go.'] },
    road: { warm: ['Careful! {the} nearly had me.', 'Slow down, please!'], edge: ['Watch where you\'re going!', 'Nice driving. Not.'], shy: ['Oh! That was close...'], bold: ['Hey! Eyes on the road!'], humor: ['{the} wants my spot that badly?', 'Was that {the} or a rocket?'], plain: ['Whoa. Close one.', 'Watch it!'] },
    // a story they are in (ev.kind 'lost', built-in only): they come to somewhere they don't know, with people they don't
    // know, and find the way out together; how: wake, around, ask, plan, search, nothing, found, come, out, wonder, done
    lostWake: { warm: ['Wait... where am I? This isn\'t home.', 'Hello? How did I get here?', 'This isn\'t right. I was just at home.'], edge: ['Okay. Where the hell am I?', 'This is not where I was. Somebody explain.', 'No. I did not walk here.'], shy: ['Um... where... where is this?', 'I don\'t... I don\'t know this place.'], bold: ['Right. Where is this, and who brought me here?', 'I don\'t remember coming here. Not one bit.'], humor: ['Either I sleepwalked a very long way, or something is going on.', 'Last thing I remember, I was at home. This is not home.'], plain: ['Where am I?', 'How did I get here?', 'This isn\'t where I was.'] },
    lostAround: { warm: ['There\'s {what}... I\'ve never seen this place.', '{What}? None of this is familiar.'], edge: ['{What}. Great. Still no idea where this is.', 'And {what}. Wonderful.'], shy: ['There\'s {what}... I don\'t like this.', 'I can see {what}... but where is this?'], bold: ['{What}. Okay. Let\'s work out where we are.', 'I see {what}. Nothing I know.'], humor: ['{What}. Nobody mentioned {what} on the way here. Because there was no way here.', 'Well, there\'s {what}. That narrows it down. Not.'], plain: ['There\'s {what}.', 'I can see {what}. Nothing I know.'] },
    lostAsk: { warm: ['{name}, are you alright? Do you know how we got here?', 'Oh, thank goodness, someone. {name}, where are we?'], edge: ['{name}. Tell me you know where this is.', 'You too, {name}? Fantastic.'], shy: ['{name}? Do you... know where we are?', 'Sorry, {name}, do you know this place?'], bold: ['{name}! You woke up here too? We stick together.', '{name}, what do you remember?'], humor: ['{name}, please tell me you drove.', 'So, {name}, come here often? Me neither.'], plain: ['{name}, do you know where we are?', 'You don\'t know either, {name}?'] },
    lostPlan: { warm: ['Let\'s stay together and {goal}. We can do this.', 'Everyone, let\'s each look a different way, and meet back here.'], edge: ['Fine. We split up and look. Shout if you find anything.', 'Nobody\'s coming for us. We {goal} ourselves.'], shy: ['Maybe if we each look a different way...?', 'Could we... look round together? We have to {goal}.'], bold: ['Listen up. We split up, each take a side, and whoever finds something shouts.', 'Right, we {goal}. You that way, me this way.'], humor: ['Plan: walk in all directions at once. Then {goal}.', 'Let\'s split up. That always goes well in films.'], plain: ['Let\'s split up and look.', 'We need to {goal}. Let\'s look round.'] },
    lostSearch: { warm: ['I\'ll look {dir}.', 'I\'ll try {dir}. Be careful, everyone.'], edge: ['{Dir}, then. Whatever.', 'I\'ll head {dir}.'], shy: ['I\'ll... I\'ll look {dir}.', 'I can try {dir}, I suppose.'], bold: ['I\'ll go {dir}. Leave it to me.', 'I\'ll head {dir}. Shout if you need me.'], humor: ['{Dir} it is. If I\'m not back, I found snacks.', 'I\'ll go {dir}. Don\'t have fun without me.'], plain: ['I\'ll check {dir}.', 'Going {dir}.'] },
    lostNothing: { warm: ['Nothing that way, I\'m sorry.', 'No way out over there. Anyone else?'], edge: ['Dead end. Of course.', 'Nothing. Next idea?'], shy: ['I didn\'t find anything... sorry.', 'Nothing my way...'], bold: ['Nothing my way. Where next?', 'Not that way. We try again.'], humor: ['Good news: I found more nothing.', 'That way is fully stocked with nothing.'], plain: ['Nothing that way.', 'No luck.'] },
    lostFound: { warm: ['Everyone! Over here! I think this is the way!', 'Here! {What}! Come on, everyone!'], edge: ['Here. {What}. This is it. Come on.', 'Over here. Found {what}. Hurry up.'], shy: ['Um, everyone? I think... I found {what}!', 'Over here... I think this is it!'], bold: ['Over here! {What}! Everyone, to me!', 'Found it! {What}! This way!'], humor: ['Found {what}! I accept applause and snacks.', 'Ladies and gentlemen: {what}!'], plain: ['Over here! I found {what}!', 'This way! {What}!'] },
    lostCome: { warm: ['Coming, {name}! Well done!', 'Oh, {name}, you clever thing! Coming!'], edge: ['About time. Coming.', 'Coming, {name}.'], shy: ['Oh! Coming...', 'Wait for me, {name}!'], bold: ['On my way, {name}!', 'Good work, {name}. Coming!'], humor: ['{name} for president. Coming!', 'Coming! Nobody leave without me.'], plain: ['Coming!', 'On my way.'] },
    lostOut: { warm: ['Let\'s go home, everyone.', 'Stay together. Home\'s this way, I\'m sure of it.'], edge: ['I\'m not waiting to find out who brought us here. Go.', 'Out. Now. Before anything else happens.'], shy: ['Can we go home now? Please?', 'I\'ll stay close to you, if that\'s okay.'], bold: ['Everyone through. I\'ll go last.', 'Out we go. Stay together.'], humor: ['Nobody look back. That\'s how films end badly.', 'Home. And I\'m never sleeping again.'], plain: ['Let\'s go.', 'Come on, home.'] },
    lostWonder: { warm: ['Someone must be missing us by now.', 'We\'ll be alright. We\'ve got each other.', 'I hope my family isn\'t worried sick.', 'Is everyone okay? Nobody hurt?'], edge: ['When I find out who did this...', 'This makes no sense at all.', 'Nobody just wakes up somewhere. Somebody did this.', 'My phone\'s gone. Of course it is.'], shy: ['I just want to go home.', 'What if there\'s no way out?', 'I don\'t like it here...', 'Please let this be a dream.'], bold: ['There\'s always a way out. Always.', 'We\'ll find it. Keep looking.', 'Stay sharp. Look for tracks, a fence, a road, anything.', 'Whoever brought us here, we\'re leaving without asking.'], humor: ['If this is a surprise party, it\'s a terrible one.', 'I\'d like to speak to whoever is in charge of this.', 'Note to self: never sleep again.', 'Five stars for the scenery. One for the directions.'], plain: ['How did we get here?', 'There has to be a way out.', 'Does anything look familiar to anyone?', 'Which way did the sun come up?'] },
    lostDone: { warm: ['We did it, all of us!', 'Oh, well done, everyone!'], edge: ['There. Done. Can we go now?', 'Finally.'], shy: ['We... we did it?', 'Oh, thank goodness.'], bold: ['Told you we would.', 'Good work, everyone.'], humor: ['Nailed it. Mostly.', 'Put that on my headstone: we did it.'], plain: ['Done.', 'That\'s it, then.'] },
    see: { warm: ['Oh, {the}. That\'s nice.'], edge: ['Hm. {What}.'], shy: ['Oh, {the}...'], bold: ['Check out {the}.'], humor: ['Who put {the} there?'], plain: ['There\'s {what}.'], any: ['Huh, I hadn\'t noticed {the} before.', 'Have you seen {the}?'] },
    seeAgain: { warm: ['I do like {the}.'], edge: ['Still staring at {the}. Don\'t mind me.'], shy: ['I keep looking at {the}.'], bold: ['I\'m telling you, {the} is the best thing here.'], humor: ['Me and {the}? We\'re close now.'], plain: ['{the}. Still there.'] },
    agree: { warm: ['Oh, I know exactly what you mean.', 'That\'s lovely.', 'I like that.'], edge: ['If you say so.', 'Hm. Can\'t say I agree.', 'Riveting.', 'Sure.'], shy: ['Oh... yes, me too.', 'Mm. That\'s nice.'], bold: ['Absolutely. No question.', 'Ha! Exactly right.'], humor: ['Ha! Story of my life.', 'Now that\'s a plot twist.'], plain: ['Fair enough.', 'Makes sense.', 'True.'] },
    share: { warm: ['Oh, me too! I love {topic}.', 'You like {topic} too? We\'re going to get on.'], edge: ['Finally, someone who gets {topic}.'], shy: ['Oh, I like {topic} too...'], bold: ['{topic}! Now you\'re talking.'], humor: ['A {topic} person! I knew I liked you.'], plain: ['Same here. {topic} is my thing.'] },
    dodge: { warm: ['Oh, I don\'t know much about that, but tell me more.'], edge: ['Not really my thing.', 'Can\'t say I care.'], shy: ['Um... I\'m not sure, honestly.'], bold: ['No idea, but I\'ll pretend I do.'], humor: ['I\'m going to nod like I know.'], plain: ['Never really thought about it.', 'Not my area.'] },
    unknownQ: { warm: ['Good question. I\'d have to think about that.', 'Hm, I\'m not sure. What do you think?'], edge: ['Why do you ask?', 'No idea.'], shy: ['Oh, um... I don\'t know.'], bold: ['Ask me something harder.'], humor: ['Ooh, a tricky one. Pass.'], plain: ['I don\'t know, to be honest.', 'Hard to say.'] },
    told: { warm: ['Oh, really? Tell me more.', 'I like hearing you talk.'], edge: ['Huh.', 'Okay.', 'Noted.'], shy: ['Oh. Mm.', 'Oh, I see.'], bold: ['Ha, go on.', 'Interesting. Keep going.'], humor: ['Plot thickens.', 'You don\'t say!'], plain: ['I see.', 'Right.', 'Makes sense.'] },
    hi: { warm: ['Hello! It\'s nice to see you.', 'Hi there! How are you?'], edge: ['Hey.', 'Oh, hello.'], shy: ['Oh, hi...', 'Hello.'], bold: ['Hey! What\'s up?', 'Hello, you!'], humor: ['Well, hello! You look like trouble.', 'Hi! I was hoping someone would talk to me.'], plain: ['Hi.', 'Hello there.'] },
    bye: { warm: ['Bye! Come back soon.', 'Take care of yourself.'], edge: ['Bye, then.', 'See you.'], shy: ['Oh, bye...', 'Bye. It was nice talking.'], bold: ['Later!', 'See you around!'], humor: ['Don\'t miss me too much.', 'Bye! Tell no one what you saw.'], plain: ['Bye.', 'See you later.'] },
    howGood: { warm: ['I\'m good, thank you! Better now.', 'Really well, thanks. And you?'], edge: ['Fine. Could be worse.', 'Surviving.'], shy: ['Oh, I\'m okay. Thanks for asking.', 'Good, I think. You?'], bold: ['Great! Never better.'], humor: ['Fantastic. Don\'t tell anyone.', 'Living the dream.'], plain: ['Good, thanks.', 'Not bad. You?'] },
    howBad: { warm: ['Honestly? A bit low today. But thanks for asking.'], edge: ['Don\'t ask.', 'Not great.'], shy: ['Um... not my best day.'], bold: ['Had better days. I\'ll live.'], humor: ['On a scale of one to ten? A soggy four.'], plain: ['Not great, to be honest.', 'Tired.'] },
    howTired: { any: ['Tired. I could sleep for a week.', 'Bit worn out, to be honest.'] },
    thanks: { warm: ['Oh, any time.', 'You\'re very welcome.'], edge: ['Sure.', 'Mm-hm.'], shy: ['Oh, it\'s nothing.'], bold: ['Any time!'], humor: ['I accept tips.'], plain: ['No problem.', 'You\'re welcome.'] },
    nice: { warm: ['Oh, that\'s so kind of you.', 'Aw, thank you. You\'re lovely too.'], edge: ['Hm. Thanks, I suppose.', 'Flattery. Noted.'], shy: ['Oh... thank you.', 'Oh, stop it.'], bold: ['I know. But thank you.', 'Ha! You\'re not wrong.'], humor: ['Keep going, I\'m listening.', 'Write that down somewhere.'], plain: ['Thanks.', 'That\'s kind of you.'] },
    rude: { warm: ['Oh. That wasn\'t very nice.', 'Ouch. Did I do something?'], edge: ['Charming.', 'Right back at you.'], shy: ['Oh. Sorry...', 'That\'s... okay then.'], bold: ['Excuse me?', 'Watch it.'], humor: ['Wow. Tell me how you really feel.'], plain: ['No need for that.', 'That\'s not fair.'] },
    joke: { any: ['Why did the scarecrow win an award? He was outstanding in his field.', 'I told my plants a joke. They didn\'t laugh. Tough crowd.', 'I\'m reading a book on gravity. I can\'t put it down.', 'What do you call a fish with no eyes? A fsh.', 'I used to hate facial hair, but then it grew on me.'] },
    me: { warm: ['I\'m {me}. Nice to meet you properly.'], edge: ['{me}. And you?'], shy: ['Oh, I\'m {me}.'], bold: ['{me}. Remember it.'], humor: ['{me}. The one and only. Probably.'], plain: ['I\'m {me}.'] },
    userName: { warm: ['{user}! What a lovely name.', 'Nice to meet you, {user}.', 'Hello, {user}. I\'m glad you said.'], edge: ['{user}. Got it.', '{user}. Fine.'], shy: ['Oh, hi, {user}.', 'Hi, {user}... nice name.'], bold: ['{user}! I\'ll remember that.', '{user}. Good name.'], humor: ['{user}. I\'ll try not to forget. No promises.', '{user}! I knew a dog called that. Lovely dog.'], plain: ['Nice to meet you, {user}.', 'Hi, {user}.'] },
    remember: { warm: ['Of course I remember you, {user}.'], edge: ['{user}. I\'m not that forgetful.'], any: ['You\'re {user}. See, I listen.'] },
    forgot: { any: ['I don\'t think you\'ve told me your name.', 'You never said! What is it?'] },
    yes: { warm: ['Oh, good!', 'I thought so.'], edge: ['Figures.', 'Thought so.'], any: ['Ha, I knew it.', 'Good to know.'] },
    no: { warm: ['Oh, that\'s alright.', 'Fair enough!'], edge: ['Hm. Your loss.'], any: ['No? Huh.', 'Fair enough.'] },
    where: { any: ['Looks like {where} to me.', 'As far as I can tell? {Where}.'] },
    sees: { any: ['I can see {sights}.', 'Well, there\'s {sights}.'] },
    seesNone: { any: ['Not much, honestly.', 'Nothing much. Just us.'] },
    likeWhat: { any: ['Me? {topic}, mostly. And {topic2}.', 'I\'m into {topic}. And {topic2}, when I get the chance.'] },
    yourLike: { warm: ['You like {topic}, don\'t you{, user}? How\'s that going?'], any: ['You said you\'re into {topic}. Still?', 'I remember you like {topic}.'] },
    noted: { warm: ['Oh, nice. I\'ll remember that.', 'I like that you like {topic}.'], edge: ['{topic}. Noted.'], any: ['Good to know.', '{topic}, huh? I\'ll remember that.'] },
    hiUser: { warm: ['Hi again{, user}! I was hoping you\'d say something.'], edge: ['Oh, you\'re back{, user}.'], shy: ['Oh, hi{, user}.'], bold: ['Hey{, user}! Talk to me.'], humor: ['Look who it is{, user}!'], plain: ['Hi{, user}.'] },
    museTired: { any: ['I could really do with a nap.', 'What time is it? Feels late.'] },
    museHappy: { any: ['I\'m in a good mood today.', 'This is nice. This is really nice.'] },
    museLow: { any: ['Bit of a long day.', 'I don\'t know. I\'m just a bit flat today.'] },
    museFear: { any: ['I keep thinking about {the}.', 'Is {the} still out there?'] },
    likeYou: { warm: ['I like talking with you, {name}.'], edge: ['You\'re alright, {name}.'], shy: ['It\'s nice, talking with you, {name}.'], bold: ['You\'re good company, {name}.'], humor: ['{name}, you\'re my favourite. Don\'t tell the others.'], plain: ['Good talking to you, {name}.'] },
    sameAs: { warm: ['Same as {name}, I love {topic}.', 'Oh, {topic} for me too, like {name}.'], edge: ['{name} took mine. {topic}.'], shy: ['Um, {topic} too... like {name}.'], bold: ['{topic}! {name} has good taste.'], humor: ['Copying {name}: {topic}. But I liked it first.'], plain: ['{topic}, same as {name}.'] },
    meToo: { warm: ['Me! I love {topic}.', 'Oh, that\'s me. {topic}, every time.'], edge: ['Guilty. {topic}.'], shy: ['Um... me. I like {topic}.'], bold: ['Me! Obviously.', 'Right here. {topic} all the way.'], humor: ['Me! Hand up, both hands.'], plain: ['Me. I like {topic}.'] },
    notMe: { warm: ['Not really me, sorry.'], edge: ['Not me.', 'Hard pass.'], shy: ['Um, not really me.'], bold: ['Not my thing.'], humor: ['I\'m going to sit this one out.'], plain: ['Not me.'] },
    nobody: { any: ['Doesn\'t look like anyone here is into {topic}.', 'Tough crowd for {topic}, I think.'] },
    knowAll: { warm: ['I know {names}. Lovely people.'], edge: ['I know {names}. That\'s enough.'], any: ['I know {names}, yes.', '{names}, yes. We\'ve talked.'] },
    knowSome: { any: ['I know {names}. The rest of you, not yet.', 'Only {names}, so far.'] },
    knowNone: { warm: ['Not yet, but I\'d like to.'], edge: ['Never met them.'], shy: ['Um, no, not really...'], any: ['Not really. We\'ve only just met.'] },
    aside: { warm: ['{name}, you like {topic} too? We should talk.'], edge: ['Fine, {name}. You and me, {topic}, later.'], shy: ['Oh, {name} likes {topic} too...'], bold: ['{name}! A fellow {topic} fan. Excellent.'], humor: ['{name}, {topic} club. First meeting\'s on me.'], plain: ['We should talk {topic} sometime, {name}.'] },
    theirTopic: { any: ['{name}, you\'re into {topic}, aren\'t you?', '{name}! Still into {topic}?', 'So, {name}, I remember you like {topic}.'] },
    // what they decide to do about something they noticed (fear: the easily frightened, curious: the inquisitive)
    flee: { fear: ['Nope. No. I\'m going!', 'Run! {The}!', 'I can\'t, I can\'t. I\'m getting away from {the}.'], shy: ['Oh no, oh no, oh no...'], bold: ['Everyone, move. Now!'], warm: ['Come on, everyone, away from {the}!'], humor: ['I\'m not paid enough for {what}. Bye!'], plain: ['Get clear of {the}. Now.'] },
    back: { fear: ['I\'m just going to... back away from {the}.', 'I don\'t like {the}. I\'m keeping my distance.', 'Nobody make me go near {the}.'], curious: ['I want to see {the}, but not that close.'], warm: ['Let\'s give {the} some room.'], edge: ['Not getting any closer to {the}, thanks.'], humor: ['Me and {the} are going to be friends from a distance.'], plain: ['Keep back from {the}.'] },
    freeze: { fear: ['Don\'t move. Don\'t move.', 'I can\'t move. Is {the} looking at me?'], shy: ['Oh no... I can\'t...'], any: ['Nobody move.', 'Shh. Stay still.'] },
    warn: { bold: ['Heads up, everyone: {what}, {feet} feet off.', 'Watch out! {The}!', 'Stay behind me. I\'ve got eyes on {the}.'], warm: ['Careful, everyone. {The}.', 'Everyone, slowly, away from {the}.'], edge: ['Nobody do anything stupid. {The} is right there.'], humor: ['Small announcement: {what}. Carry on panicking.'], plain: ['{What}, about {feet} feet off. Keep clear.'] },
    watch: { curious: ['Hang on. What\'s {the} doing?', 'Huh. Look at {the}.', 'Is that {what}? Interesting.', 'I can\'t stop looking at {the}.'], fear: ['I\'m keeping an eye on {the}.', 'Is {the} moving? I think it moved.', 'I don\'t like the look of {the}.'], warm: ['Oh, look, {the}.'], bold: ['I see {the}.'], humor: ['{The}. Of course. Why not.'], plain: ['There\'s {what}.'] },
    investigate: { curious: ['Ooh, what\'s {the}? I\'m going to look.', 'Hang on, I want a closer look at {the}.', 'Has anyone looked at {the}? No? Right, then.', 'I have to know what {the} is about.'], bold: ['Let\'s see what {the} is about.', 'I\'ll go and have a look.'], fear: ['I shouldn\'t... but I want to see {the}.'], warm: ['Oh, {the}! Let me see.'], humor: ['If I don\'t come back, {the} got me.'], plain: ['I\'ll go and check {the}.'] },
    ignore: { edge: ['Not interested in {the}.', '{The}. Whatever.'], plain: ['Just {what}.', 'Seen {the} before.'], any: ['Oh, {the}. Never mind.'] },
    help: { warm: ['{name}! Hold on, I\'m coming!', 'I\'ve got you, {name}.'], bold: ['Out of the way, I\'ll see to {name}.', 'Stay with me, {name}!'], plain: ['I\'ll check on {name}.'], any: ['{name}? I\'m coming over.'] },
    call: { fear: ['Help! Somebody, help!', 'Someone do something!'], shy: ['Can... can somebody help, please?'], any: ['Help! Over here!', 'We need help over here!'] },
    gone: { fear: ['Is {the} gone? Is it really gone?', 'Oh, thank goodness. {The}\'s gone.'], curious: ['Where did {the} go?', 'Wait, where\'s {the} gone?'], bold: ['{The}\'s gone. Told you.'], humor: ['And {the} has left the building.'], any: ['{The}\'s gone.'] },
    // hearing someone raise the alarm: the inquisitive want to know, the frightened don't wait to find out
    alarmAsk: { curious: ['Where? What is it, {name}?', 'What did you see, {name}?', 'Show me, {name}. Where?'], bold: ['Where, {name}?'], any: ['What? Where?', 'What is it?'] },
    alarmFear: { fear: ['{name}? What? Oh no.', 'I knew something was wrong.'], shy: ['Oh no... {name}, what is it?'], any: ['What? Where? Oh no.'] },
    museWorry: { any: ['Does anyone else feel like we\'re being watched?', 'It\'s too quiet.', 'Did anyone hear that?', 'I keep thinking something\'s about to happen.', 'I don\'t like it out here.'] },
    museWonder: { any: ['I wonder what\'s over there.', 'Has anyone actually looked round properly?', 'I bet there\'s something interesting just out of sight.', 'I want to know what\'s past all this.', 'What do you think that was, earlier?'] },
  };
  const STEADY = Object.fromEntries(Object.entries(L.danger).filter(([f]) => f !== 'shy'));   // a danger, to the unafraid
  // the first thing out of their mouth when they notice something of a kind (now and then)
  const OPEN = { fire: ['Is that smoke?', 'Wait. Fire?'], loud: ['What was that?', 'Did you hear that?'], odd: ['Huh.', 'Wait a second.'], storm: ['Uh oh.'], stranger: ['Who\'s that?'], hurt: ['Oh god.'], beast: ['Wait.', 'Oh.'], weapon: ['Is that a weapon?'] };
  // ---- noticing anything: what a thing is from its words (first match), how threatening (t) and interesting (i) it is
  // to anyone, and how pleasant (p); each person then feels it through their own nature (sense(), below)
  const NOTE = [
    { c: 'fire', w: /\b(fire|flames?|burning|smoke|smoking|smoulder\w*|blaze|embers?)\b/, t: 0.8, i: 0.45 },
    { c: 'weapon', w: /\b(guns?|rifles?|pistols?|shotguns?|knife|knives|blades?|swords?|axes?|machetes?|weapons?|bombs?|grenades?)\b/, t: 0.75, i: 0.35 },
    { c: 'hurt', w: /\b(blood|bleeding|hurt|injured|wounded|lying still|dead|body|corpse|bones|skull|unconscious)\b/, t: 0.5, i: 0.5 },
    { c: 'beast', w: /\b(bears?|wol(f|ves)|lions?|tigers?|cougars?|pumas?|panthers?|boars?|bulls?|sharks?|crocodiles?|alligators?|snakes?|vipers?|scorpions?|hornets?|wasps?|swarm)\b/, t: 0.6, i: 0.5 },
    { c: 'loud', w: /\b(bang|crash|explosion|screams?|screaming|shouts?|shouting|gunshots?|sirens?|alarms?|roar\w*|growl\w*|howl\w*|thud|smash\w*|breaking)\b/, t: 0.5, i: 0.65 },
    { c: 'storm', w: /\b(storm|lightning|thunder|tornado|hail|flood\w*|landslide|earthquake|blizzard)\b/, t: 0.55, i: 0.4 },
    { c: 'stranger', w: /\b(stranger|figure|masked|hooded|intruder|footsteps|someone (hiding|watching))\b/, t: 0.45, i: 0.6 },
    { c: 'creepy', w: /\b(spiders?|rats?|cockroach(es)?|bats?|leech(es)?|maggots?|slime|mou?ld)\b/, t: 0.3, i: 0.35 },
    { c: 'running', w: /\b(running|fleeing|chasing|charging)\b/, t: 0.35, i: 0.55 },
    { c: 'dark', w: /\b(dark(ness)?|shadows?|fog|mist|gloom)\b/, t: 0.2, i: 0.35 },
    { c: 'odd', w: /\b(strange|odd|weird|unusual|mysterious|glow\w*|flicker\w*|whisper\w*|footprints?|tracks|holes?|caves?|tunnels?|hatch(es)?|ruins?|statues?|symbols?|markings?|notes?|letters?|maps?|keys?|chests?|box(es)?|crates?|packages?|bags?|doors?|gates?|ladders?|wells?|lights?|machines?|wrecks?|signs?)\b/, t: 0.08, i: 0.8 },
    { c: 'animal', w: /\b(dogs?|pupp(y|ies)|cats?|kittens?|horses?|pon(y|ies)|cows?|calf|calves|sheep|lambs?|goats?|deer|rabbits?|hares?|birds?|ducks?|geese|chickens?|hens?|pigs?|piglets?|fox(es)?|squirrels?|herd|owls?|frogs?|butterfl(y|ies))\b/, t: 0.05, i: 0.55, p: 0.4 },
    { c: 'food', w: /\b(food|cake|bread|coffee|tea|wine|beer|pizza|fruit|apples?|cooking|barbecue|picnic|smell of)\b/, t: 0, i: 0.45, p: 0.5 },
    { c: 'lovely', w: /\b(flowers?|trees?|garden|view|stars|moon|sunset|sunrise|rainbow|paintings?|music|song|fountain|lake|river|sea|beach|waterfall)\b/, t: 0, i: 0.4, p: 0.55 },
    { c: 'weather', w: /\b(rain\w*|wind\w*|snow\w*|clouds?|sun|sunny|cold|heat|hot|drizzle)\b/, t: 0.05, i: 0.25 },
  ];
  const THING = { c: 'thing', t: 0.03, i: 0.25 };
  const noteOf = (what) => { const w = String(what || '').toLowerCase(); return NOTE.find((n) => n.w.test(w)) || THING; };
  // what someone can do about it (the app may act on it: Forge Studio's Live walks them there, away, holds them still...)
  const ACTS = ['flee', 'back', 'freeze', 'warn', 'watch', 'investigate', 'ignore', 'help', 'call'];
  // intelligence: what needs thinking about, answered by how sharp they are (lo: simple, mid: average or sharp, hi: bright
  // or brilliant) and the way they are clever (their knack); things they know or have learnt, by knack
  const tierOf = (P) => (P.smarts <= 1 ? 'lo' : P.smarts >= 4 ? 'hi' : 'mid');
  // the Scenario's other stories (ev.story): their own words for the turns that differ from being lost; the rest are
  // the lost lines above. Each turn by flavour, as L. storm, pet, child, stranded, fire, treasure
  const STORY = {
    storm: {
      wake: { warm: ["Oh, look at that sky. That's coming our way.", "Is that thunder? Everyone alright?"], edge: ["Great. Look at those clouds.", "That's not rain. That's a storm."], shy: ["That sky's gone so dark...", "Was that thunder?"], bold: ["Storm's coming in fast. We need to move.", "Feel that wind? We've got minutes."], humor: ["The forecast said sunny. The forecast lied.", "I left my umbrella at home. And my house."], plain: ["Storm's coming.", "Look at that sky."] },
      around: { warm: ["There's {what}, but nowhere to get out of the rain.", "{What}... none of it's any shelter."], edge: ["{What}. Not going to keep the rain off, is it.", "And {what}. Useless in a storm."], shy: ["There's {what}... where do we go?"], bold: ["{What}. No cover there. Keep looking.", "I see {what}. Not good enough."], humor: ["{What}. Not exactly storm-proof.", "Could we hide under {what}? No? No."], plain: ["There's {what}.", "Nothing to shelter under."] },
      ask: { warm: ["{name}, are you alright? We need to get out of this.", "Stay with me, {name}. Have you seen anywhere dry?"], edge: ["{name}, you seen any cover?", "Don't just stand there, {name}."], shy: ["{name}? Do you know anywhere to go?"], bold: ["{name}, with me. We find cover, now.", "{name}! Stick together."], humor: ["{name}, you don't happen to have a spare roof?", "Nice day for it, {name}."], plain: ["{name}, seen anywhere to shelter?", "You alright, {name}?"] },
      plan: { warm: ["Let's spread out and {goal}. Shout when you find something.", "We'll be fine if we're quick. Everyone take a side."], edge: ["Split up. First one to find cover yells.", "We've got minutes. Move."], shy: ["Should we... each look somewhere?"], bold: ["Everyone take a direction. We {goal}, fast.", "Go, go! Find cover and shout."], humor: ["Plan: find a roof before the sky falls on us.", "Run in every direction. Very scientific."], plain: ["Spread out and look for shelter.", "We need to {goal}."] },
      found: { warm: ["Over here! {What}! Quick, before it pours!", "Here, everyone! {What}!"], edge: ["Here. {What}. Hurry up.", "{What}. Over here. Now."], shy: ["I think... I found {what}! Over here!"], bold: ["{What}! Everyone, to me! Run!", "Found it! {What}! This way!"], humor: ["{What}! I'll take my medal later.", "Ladies and gentlemen, {what}! Dry-ish!"], plain: ["Over here! {What}!", "This way! I found {what}!"] },
      wonder: { warm: ["Hurry, everyone, it's getting closer.", "I hope everyone's family is inside."], edge: ["Any second now it's going to open up.", "Brilliant. Wind's picking up."], shy: ["I don't like thunder...", "It's getting so dark..."], bold: ["Keep moving. Don't stop for anything.", "It's close. Faster."], humor: ["I just had my hair done. For this.", "If I get struck by lightning, tell my mother it was heroic."], plain: ["It's getting closer.", "Feel that wind."] },
      done: { warm: ["Oh, thank goodness. Everyone in? Everyone dry?", "We made it. Come here, all of you."], edge: ["Made it. Just about.", "Finally. Let it rain."], shy: ["We're... we're safe?", "Oh, that was close."], bold: ["Everyone in. Good work.", "Told you we'd make it."], humor: ["Now we wait. Anyone know a song?", "Dry. Mostly. I'll take it."], plain: ["We made it.", "Everyone's in."] } },
    pet: {
      wake: { warm: ["Oh no, where's the dog gone?", "Has anyone seen the dog? It was right here."], edge: ["Brilliant. The dog's run off.", "Who left the gate open?"], shy: ["Oh no... the dog's gone..."], bold: ["The dog's gone. Right, we find it.", "Nobody panic. We'll find the dog."], humor: ["The dog has made a run for it. Can't blame it.", "Somebody's dog has gone on an adventure."], plain: ["Where's the dog?", "The dog's gone."] },
      around: { warm: ["There's {what}, but no sign of the dog.", "I can see {what}... where would it go?"], edge: ["{What}. No dog.", "And {what}. Still no dog."], shy: ["There's {what}... no dog though."], bold: ["{What}. Not there. Keep looking.", "I see {what}. No dog."], humor: ["{What}. The dog is clearly not hiding under {what}.", "No dog. Just {what}."], plain: ["There's {what}.", "No sign of it."] },
      ask: { warm: ["{name}, have you seen a dog run past?", "{name}, will you help us look?"], edge: ["{name}, you seen it?", "Don't suppose you saw where it went, {name}?"], shy: ["{name}? Did you see the dog?"], bold: ["{name}, you're with us. We find that dog.", "{name}, which way did it go?"], humor: ["{name}, have you seen a dog with somewhere better to be?", "{name}, you look like a dog finder."], plain: ["{name}, seen a dog?", "Help us look, {name}?"] },
      plan: { warm: ["Let's each look a different way. Call it gently, it might be scared.", "Spread out, everyone. We'll {goal}."], edge: ["Split up. Whoever finds it, shout.", "Everyone take a side. It can't have gone far."], shy: ["Maybe we each look somewhere?"], bold: ["Fan out. We {goal}. Shout if you see it.", "You that way, me this way. Go."], humor: ["Plan: everyone shout its name. Whatever it is.", "Split up and think like a dog."], plain: ["Let's split up and look.", "We need to {goal}."] },
      found: { warm: ["Here! It's {what}! Come here, sweetheart!", "Everyone! I found {what}!"], edge: ["Got it. {What}. Over here.", "Here. Found {what}."], shy: ["Um... I think I found {what}!"], bold: ["Found {what}! Over here!", "Here! {What}, safe and sound!"], humor: ["Found {what}! It was having a lovely time.", "{What}, located. Mission accomplished."], plain: ["Over here! Found {what}!", "Here it is!"] },
      wonder: { warm: ["I hope it's not frightened.", "It'll be alright. Dogs always turn up."], edge: ["It's probably found something to eat.", "Stupid dog."], shy: ["What if it's hurt?", "Please be okay..."], bold: ["Keep calling. It'll hear us.", "It can't have gone far."], humor: ["It's probably laughing at us somewhere.", "Somewhere a dog is having the best day of its life."], plain: ["Where could it be?", "Keep looking."] },
      done: { warm: ["Oh, there you are! Who's a good dog?", "Thank goodness. Good work, everyone."], edge: ["Found it. Now somebody hold on to it.", "There. Don't do that again."], shy: ["Oh, I'm so glad it's okay.", "Hello, you..."], bold: ["Good work, everyone.", "Told you we'd find it."], humor: ["The prodigal dog returns.", "Somebody get it a lead. And me a coffee."], plain: ["Found it.", "Good."] } },
    child: {
      wake: { warm: ["Where's {what}? Has anyone seen {what}?", "Oh no. {What} was just here."], edge: ["Where's the kid? Where's {what}?", "Nobody was watching {what}?"], shy: ["{What}? Where did {what} go?"], bold: ["{What}'s missing. Everyone, now.", "Nobody panic. We find {what}."], humor: ["{What} has vanished. Kids are faster than they look.", "Right. Who had {what}?"], plain: ["Where's {what}?", "{What}'s gone."] },
      around: { warm: ["There's {what}... no sign of the little one.", "I can see {what}. Where would a kid go?"], edge: ["{What}. No kid.", "And {what}. Nothing."], shy: ["There's {what}... I can't see them..."], bold: ["{What}. Not there. Keep moving.", "I see {what}. Nothing yet."], humor: ["{What}. Kids love {what}. Not there though.", "No kid. Just {what}."], plain: ["There's {what}.", "No sign."] },
      ask: { warm: ["{name}, have you seen a child? Please help us look.", "{name}, did you see which way they went?"], edge: ["{name}, you seen a kid?", "{name}, eyes open. We're missing a kid."], shy: ["{name}? Have you seen them?"], bold: ["{name}, you're with us. We've got a missing child.", "{name}, which way did they go?"], humor: ["{name}, have you seen a small, fast person?", "{name}, help. We've misplaced a child."], plain: ["{name}, seen a child?", "Help us look, {name}?"] },
      plan: { warm: ["Everyone take a direction. Call their name, calmly.", "Spread out and {goal}. Shout the moment you see them."], edge: ["Split up. Nobody stops till we find them.", "Each take a side. Go."], shy: ["Should we each look a different way?"], bold: ["Search party. Fan out, call out, shout when you've got them.", "We {goal}. You that way, me this way."], humor: ["Fan out. Kids hide in the strangest places.", "Everyone think small. Very small."], plain: ["Let's split up and look.", "We need to {goal}."] },
      found: { warm: ["Here! {What}'s here! It's alright, sweetheart!", "Everyone! I've got {what}!"], edge: ["Got {what}. Over here.", "Here. {What}. Safe."], shy: ["I found {what}! Over here!"], bold: ["Found {what}! Everyone, here!", "Here! {What}'s safe!"], humor: ["Found {what}! Hiding champion of the year.", "{What}, located. Everybody breathe."], plain: ["Over here! Found {what}!", "Here! {What}'s here!"] },
      wonder: { warm: ["They'll be alright. They'll be scared, that's all.", "Keep calling. They'll hear us."], edge: ["Kids. Never where you left them.", "Keep looking. Don't stop."], shy: ["Please be okay...", "What if we don't find them?"], bold: ["We'll find them. Keep moving.", "Check everywhere. Under things too."], humor: ["When we find them, nobody's grounded. Probably.", "I aged ten years in ten minutes."], plain: ["Keep calling.", "Where could they be?"] },
      done: { warm: ["Oh, come here. You gave us such a fright.", "Everyone, they're safe. Thank you, all of you."], edge: ["Found. Nobody let go of their hand.", "Never again, alright?"], shy: ["Oh, thank goodness...", "They're okay."], bold: ["Good work, everyone. They're safe.", "That's everyone accounted for."], humor: ["I need a sit down. And a coffee. And a nap.", "Hide and seek: we win."], plain: ["They're safe.", "Found them."] } },
    stranded: {
      wake: { warm: ["Well. The bus isn't coming back, is it?", "Is everyone alright? We're stuck out here."], edge: ["Broken down. In the middle of nowhere. Perfect.", "No signal. Of course."], shy: ["Are we... stuck here?", "How far is town?"], bold: ["Right. Nobody's coming. We walk.", "We're not waiting here all night."], humor: ["Next stop: nowhere.", "I'd like a refund."], plain: ["We're stuck.", "No bus, then."] },
      around: { warm: ["There's {what}... but which way is town?", "{What}. No road signs, though."], edge: ["{What}. Fat lot of good.", "And {what}. Still no town."], shy: ["There's {what}... which way do we go?"], bold: ["{What}. Doesn't matter. We find the road.", "I see {what}. Town's out there somewhere."], humor: ["{What}. Lovely. Not a taxi though.", "Scenic. Not helpful."], plain: ["There's {what}.", "No sign of town."] },
      ask: { warm: ["{name}, are you alright? Do you know the way to town?", "Stick with us, {name}."], edge: ["{name}, you know where we are?", "You stranded too, {name}?"], shy: ["{name}? Do you know which way town is?"], bold: ["{name}, walk with us. Safer together.", "{name}, any idea which way?"], humor: ["{name}, please tell me you know a shortcut.", "{name}, fancy a long walk?"], plain: ["{name}, which way's town?", "You coming, {name}?"] },
      plan: { warm: ["Let's look round for the road and go together.", "Each of us check a way, then we all {goal}."], edge: ["Split up and find the road. Then we walk.", "We need the road. Look."], shy: ["Maybe we each look for the road?"], bold: ["Find the road and we {goal}. Each take a side.", "Spread out. Whoever finds the road, shout."], humor: ["Plan: find a road. Follow road. Complain.", "Let's split up and find civilisation."], plain: ["Let's find the road.", "We need to {goal}."] },
      found: { warm: ["Here! {What}! We can follow it!", "Everyone! I found {what}!"], edge: ["Here. {What}. Let's go.", "{What}. Finally."], shy: ["I think this is {what}!"], bold: ["{What}! This way, everyone!", "Found {what}! Let's move!"], humor: ["{What}! Civilisation, here we come.", "Found {what}. Walking shoes on."], plain: ["Over here! {What}!", "This way!"] },
      wonder: { warm: ["It'll be dark soon. Best keep together.", "Someone will be wondering where we are."], edge: ["That bus company's getting a letter.", "My feet already hurt."], shy: ["I don't like it out here at night...", "Is it much further?"], bold: ["Keep going. We'll get there.", "Stay together, it's getting late."], humor: ["I've been on shorter holidays.", "Nobody mention the word bus."], plain: ["How far is it?", "Keep together."] },
      out: { warm: ["Come on, everyone, together. Town's this way.", "Let's go home."], edge: ["Walk. Don't stop.", "Let's get this over with."], shy: ["Can I walk with you?"], bold: ["This way. I'll lead.", "Everyone stay together. Let's go."], humor: ["Onwards. Somebody start a song.", "Last one to town buys dinner."], plain: ["Let's go.", "This way."] } },
    fire: {
      wake: { warm: ["Do you smell smoke? Everyone, look at that!", "Fire! There's a fire coming!"], edge: ["Smoke. That's a fire. We need to go.", "Fire. Right there. Move."], shy: ["Is that... smoke? Oh no..."], bold: ["Fire! Everyone, listen to me, we're getting out.", "That's a wildfire. Nobody panic. We move."], humor: ["That's not a barbecue.", "Who left the oven on? The whole oven?"], plain: ["Fire!", "Smoke. We need to go."] },
      around: { warm: ["There's {what}... we have to get away from the smoke.", "{What}... no way out there."], edge: ["{What}. No good. Find a way out.", "And {what}. Smoke everywhere."], shy: ["There's {what}... I can't see for the smoke..."], bold: ["{What}. Not that way. Keep looking.", "I see {what}. Keep moving."], humor: ["{What}. On fire soon, probably.", "No time for sightseeing."], plain: ["There's {what}.", "Smoke everywhere."] },
      ask: { warm: ["{name}, stay with me. Do you know a way out?", "{name}, are you hurt? Come on."], edge: ["{name}, move. Which way's clear?", "{name}! Don't stand there."], shy: ["{name}? Which way do we go?"], bold: ["{name}, with me. We're getting out.", "{name}, keep low and stay close."], humor: ["{name}, I'd love to chat but there's a fire.", "{name}, run now, small talk later."], plain: ["{name}, come on!", "Which way, {name}?"] },
      plan: { warm: ["Everyone, look for a clear way out and shout. Quickly!", "Stay low, spread out, and find a way through."], edge: ["Split up. Find a way out. Fast.", "No time. Everyone take a side and look."], shy: ["Should we... each look? Quickly?"], bold: ["Fan out and find a way out of here. Shout when you see one. Go!", "We {goal}. Each take a direction. Move!"], humor: ["Plan: not be here. Spread out!", "Find an exit. Any exit."], plain: ["Find a way out!", "Spread out and look!"] },
      found: { warm: ["Here! {What}! Everyone, this way, quickly!", "Over here! It's clear here!"], edge: ["Here. {What}. Run.", "This way. Now."], shy: ["Here! I think it's clear here!"], bold: ["{What}! Everyone, to me! Run!", "This way! Go, go, go!"], humor: ["{What}! Follow me, I'm suddenly very brave.", "Exit, found. Running, commencing."], plain: ["Over here! {What}!", "This way!"] },
      wonder: { warm: ["Keep your mouths covered, everyone.", "Hurry, it's getting closer."], edge: ["It's spreading. Faster.", "I can feel the heat."], shy: ["It's so hot...", "I can't breathe..."], bold: ["Don't stop. Keep moving.", "Stay low. Keep going."], humor: ["I didn't want eyebrows anyway.", "Note to self: no more camping."], plain: ["Hurry!", "It's getting closer."] },
      out: { warm: ["Go! Everyone through, quickly!", "Keep going, don't look back!"], edge: ["Run. Don't stop.", "Go. Now."], shy: ["Wait for me!"], bold: ["Everyone out! I'm last!", "Go, go! Keep running!"], humor: ["Don't look back. Run now, scream later.", "Run!"], plain: ["Go!", "Run!"] } },
    treasure: {
      wake: { warm: ["Ooh, a treasure hunt! Who wants to look?", "There's treasure buried round here somewhere!"], edge: ["Treasure. Sure. Fine, I'll look.", "Somebody's hidden something. Let's find it."], shy: ["Treasure? Really?", "Can I help look?"], bold: ["There's treasure out here and I'm finding it.", "Right, treasure. Let's go."], humor: ["X marks the spot. Nobody brought the X.", "I've always wanted to say 'arr'."], plain: ["There's treasure out here.", "Let's find it."] },
      around: { warm: ["Could it be by {what}?", "{What}... that looks like a clue!"], edge: ["{What}. Not hidden there.", "And {what}. No treasure."], shy: ["Maybe near {what}?"], bold: ["{What}. Not there. Keep digging.", "I see {what}. Nothing."], humor: ["{What}. Suspicious. Very suspicious.", "If I were treasure, I'd hide under {what}."], plain: ["There's {what}.", "Not there."] },
      ask: { warm: ["{name}, want to hunt together?", "{name}, did you see any clues?"], edge: ["{name}, you looking too?", "{name}, don't take my treasure."], shy: ["{name}? Can I look with you?"], bold: ["{name}, team up? Split it?", "{name}, which way are you looking?"], humor: ["{name}, we split it fifty-fifty. Sixty-forty.", "{name}, have you got a shovel?"], plain: ["{name}, looking too?", "Any clues, {name}?"] },
      plan: { warm: ["Let's each search a different way and share it!", "Spread out! Whoever finds it, shout!"], edge: ["Split up. Finders shout.", "Each take a side."], shy: ["Should we each look somewhere?"], bold: ["Fan out. We {goal}. Shout when you hit it.", "Each take a side. Go!"], humor: ["Spread out. Look for an X. Or a pirate.", "Plan: dig everywhere."], plain: ["Let's split up and look.", "We need to {goal}."] },
      found: { warm: ["Here! I found {what}!", "Everyone! It's {what}!"], edge: ["Here. {What}. Told you.", "Found {what}."], shy: ["Um! I found {what}!"], bold: ["Found {what}! Over here!", "{What}! Mine! Well, ours."], humor: ["{What}! I'm rich! We're rich!", "X marks the spot. Right here."], plain: ["Over here! {What}!", "Found it!"] },
      wonder: { warm: ["This is fun, isn't it?", "I wonder what it is?"], edge: ["It'd better be worth it.", "Probably a bag of sweets."], shy: ["What if it's not real?"], bold: ["It's here somewhere. Keep looking.", "Look under things."], humor: ["If it's gold, I'm retiring.", "Arr."], plain: ["Keep looking.", "Where could it be?"] },
      done: { warm: ["We found it, all of us!", "What a lovely surprise."], edge: ["There. Found. Can we open it?", "Worth it. Just about."], shy: ["Can we see what's inside?", "We found it!"], bold: ["Good work, everyone.", "Told you I'd find it."], humor: ["Nobody tell the pirates.", "Drinks are on the treasure."], plain: ["Found it.", "That's it."] } },
  };
  const IQ = {
    mathRight: { hi: { any: ['{ans}.', 'That\'s {ans}.', '{ans}. Easy.', '{ans}. Next?', '{ans}. Try me with a hard one.'] }, mid: { any: ['Um, {ans}?', 'Let me think... {ans}.', '{ans}, I think.', '{ans}. I had to count.'] }, lo: { any: ['Uh... {ans}? I think that\'s right.', 'Hang on, counting... {ans}!', '{ans}? Did I get it?'] } },
    mathWrong: { hi: { any: ['{ans}. No, wait, I rushed that.'] }, mid: { any: ['{ans}? No, maybe not.', 'About {ans}?', '{ans}, give or take.'] }, lo: { any: ['Uh... {ans}? Maths was never my thing.', '{ans}? Don\'t quote me.', 'Is it {ans}? I always get these wrong.'] } },
    mathNo: { any: ['That\'s a calculator question.', 'Way too many numbers for me.', 'You lost me at the second number.'] },
    numbers: { any: ['{ans}. I do these for fun, you know.', '{ans}. Numbers are my thing.'] },
    factPre: { hi: ['Here\'s one: {fact}', 'Did you know? {fact}', 'Fun fact: {fact}', 'Something I read: {fact}'], mid: ['I read once that {fact_lc}', 'Somebody told me {fact_lc}', 'Apparently {fact_lc}'], lo: ['Someone told me {fact_lc} Is that true?', 'I heard {fact_lc} Sounds made up.'] },
    sayPre: { hi: ['Thing I\'ve learnt: {fact}', 'Take it from me: {fact}', '{fact} Every time.'], mid: ['My dad always said: {fact}', 'Thing is, {fact_lc}', 'Way I see it, {fact_lc}'], lo: ['My mom used to say {fact_lc}', 'Somebody told me once: {fact}'] },
    blank: { any: ['Facts? Um. The sky is blue. Mostly.', 'I don\'t know many facts. I know a good sandwich when I see one.', 'Don\'t ask me, I\'m no genius.'] },
    unsure: { hi: { warm: ['Hm, I think it depends who you ask. What made you wonder?'], edge: ['Depends. Most things do.'], humor: ['Short answer: it\'s complicated. Long answer: also complicated.'], any: ['Honestly? I\'d want to know more before I guessed.', 'My guess is it\'s more than one thing at once.', 'There\'s probably a simple answer and a true one. They\'re not always the same.', 'I\'d want to look that up before I swore to it.'] } },
    self: { hi: { warm: ['Clever enough to know what I don\'t know.'], bold: ['Smart? Yes. I won\'t pretend otherwise.', 'Sharper than most, if I\'m honest.'], shy: ['Oh, I don\'t know. People say so.'], humor: ['Smart enough to change the subject. Speaking of which...'], any: ['I\'ve been told I\'m bright. I try not to let it go to my head.'] },
      mid: { any: ['Smart enough. I get by.', 'About average, I\'d say. A bit better on a good day.', 'Clever enough to get myself into trouble.'] }, lo: { warm: ['Not really. But I\'m nice.'], any: ['Smart? Ha. I get by.', 'Not book clever, no. But I\'m nobody\'s fool.', 'I\'m slow, but I get there.'] } },
    advice: { hi: ['Work out what you\'d regret more in a year. That\'s usually the answer.', 'What would you tell a friend in your place? Do that.', 'Split it into the part you can change and the part you can\'t. Start on the first.', 'Decide what would change your mind, then go and find out.'],
      mid: ['Go with your gut. It\'s usually right.', 'Sleep on it. Things look different in the morning.', 'Talk to someone who\'s done it before.'], lo: ['Don\'t ask me, I\'d just flip a coin.', 'Um. Do whatever\'s easiest?', 'I\'d probably just wing it.'] },
    feelLow: { warm: ['Oh no. Do you want to talk about it?', 'Come here. Sit with me a minute.'], edge: ['That\'s rough. It passes.', 'Yeah. Some days are like that.'], shy: ['Oh... I\'m sorry. Is there anything I can do?'], bold: ['Right. What do you need? Tell me.'], humor: ['Sounds like a day for cake. Medicinal cake.'], plain: ['Sorry to hear it. Take it easy.', 'That\'s hard. Get some rest.'] },
    forgotName: { any: ['It\'s... no, don\'t tell me. Sorry, remind me?', 'I\'m terrible with names. Tell me again?'] },
    better: { any: ['Feeling any better than before?', 'You seemed low earlier. Better now?'] },
    divZero: { any: ['You can\'t divide by nothing. Everyone knows that.', 'Divide by zero? Nice try.'] },
    feelRead: { any: ['You\'ve been carrying that a while, I think. What would help, right now?', 'I could tell before you said it. What happened?', 'You don\'t have to be fine. Want to tell me about it?'] },
    feelUp: { warm: ['Oh, I\'m so glad!', 'That\'s wonderful. You deserve it.'], edge: ['Good for you. Really.'], shy: ['Oh, that\'s nice...'], bold: ['That\'s what I like to hear!'], humor: ['Look at you, all sunshine.'], plain: ['Good. Glad to hear it.'] },
  };
  const KNOWS = {
    book: ['Octopuses have three hearts.', 'Honey never really goes off; they found some in an ancient tomb still good to eat.', 'A day on Venus is longer than its year.', 'Bananas are berries, and strawberries aren\'t.', 'The Eiffel Tower grows a few inches in the summer heat.', 'Sharks are older than trees.', 'Oxford University is older than the Aztec Empire.', 'Sea otters hold hands when they sleep so they don\'t drift apart.', 'Lightning is hotter than the surface of the sun.'],
    numbers: ['Shuffle a deck of cards properly and that order has almost certainly never existed before.', 'Put twenty-three people in a room and it\'s better than even odds two share a birthday.', 'A million seconds is about eleven and a half days. A billion is nearly thirty-two years.', 'Fold paper in half forty-two times and it would reach the moon. In theory.', 'Every odd number has an e in it, if you spell it out.'],
    street: ['Never trust a deal you have to make tonight.', 'Watch what people do, not what they say.', 'The quiet one in the room usually knows the most.', 'Always know where the exits are.', 'Be nice to the cook and you\'ll eat well.', 'If it sounds too good to be true, it is.'],
    people: ['Most people just want to be listened to.', 'You can tell a lot from how someone treats a waiter.', 'People remember how you made them feel, more than what you said.', 'When someone goes quiet, that\'s usually when they need asking.', 'Everybody\'s carrying something you can\'t see.'],
    hands: ['Measure twice, cut once. Every time.', 'Most things that break just need a new part and some patience.', 'Righty tighty, lefty loosey. Saved me a hundred times.', 'A sharp knife is safer than a dull one.', 'If it\'s stuck, don\'t force it. Find out why it\'s stuck.'],
    creative: ['Every cloud looks like something if you give it a minute.', 'The best ideas come in the shower. I\'m sure of it.', 'Put blue next to orange and both of them sing.', 'Any story gets better if you start it in the middle.', 'Boredom is just an idea waiting to happen.'],
  };
  const KNACK_ME = { book: 'a reader more than anything; I know a bit about a lot', street: 'street smart, if nothing else', people: 'good with people; I can usually tell what someone needs', hands: 'good with my hands; give me something broken',
    numbers: 'good with numbers', creative: 'the creative sort; ideas are my thing' };
  const VALUE_SAY = {
    family: ['Family first. Always has been.', 'I\'d do anything for my family.'], honesty: ['I\'d rather hear a hard truth than a kind lie.', 'Just tell me straight. I can take it.'],
    loyalty: ['You stick by your people. That\'s the rule.', 'I don\'t forget who stood by me.'], freedom: ['I just need room to breathe, you know?', 'Nobody tells me where to go.'],
    ambition: ['I\'m not stopping where I am. Not a chance.', 'I want to be the best at what I do.'], adventure: ['Life\'s too short to sit still.', 'I\'d rather regret doing it than not.'],
    comfort: ['A warm house and a full kettle. What more do you need?', 'I like my little routines.'], faith: ['My faith gets me through.', 'I believe there\'s a reason for most things.'],
    fairness: ['I can\'t stand it when things aren\'t fair.', 'Everyone deserves a fair shake.'], knowledge: ['I want to understand how things work. All of it.', 'There\'s always more to learn.'],
    fun: ['If it isn\'t fun, why are we doing it?', 'You\'ve got to laugh, don\'t you?'], tradition: ['Some things are done a certain way for a reason.', 'I like the old ways.'],
    kindness: ['It costs nothing to be kind.', 'Be kind. Everyone\'s having a harder time than you think.'], independence: ['I like doing things my own way.', 'I\'d rather fix it myself.'],
    beauty: ['I notice the light on things. I can\'t help it.', 'Something beautiful every day. That\'s all I ask.'],
  };
  const SELF = {
    job: { warm: ['I\'m {a_job}. I love it, mostly.', '{A_job}. It\'s good work.'], edge: ['{A_job}. Riveting stuff.', '{A_job}. Don\'t get me started.'], shy: ['Oh, I\'m {a_job}.'], bold: ['{A_job}, and a good one.'], humor: ['{A_job}, for my sins.'], plain: ['I\'m {a_job}.', '{A_job}. Have been for years.'] },
    noJob: { any: ['This and that.', 'Bit of everything, really.'] },
    from: { warm: ['{From}, born and raised. You?', 'I\'m from {from}. I love it there.'], edge: ['{From}. Not that it matters.'], any: ['I\'m from {from}.', '{From}. You?'] },
    noFrom: { any: ['Here and there.', 'Oh, all over.'] },
    goal: { warm: ['Honestly? I\'d love to {goal}.'], edge: ['I\'m going to {goal}. Watch me.'], shy: ['Um... I\'d like to {goal}. Don\'t laugh.'], bold: ['I\'m going to {goal}. That\'s the plan.'], dream: ['One day I\'m going to {goal}.'], any: ['I want to {goal}.', 'To {goal}. Someday.'] },
    noGoal: { any: ['I\'m still working that out.', 'Ask me next year.'] },
    worry: { warm: ['I worry about {worry}, if I\'m honest.'], edge: ['{Worry}. Not that I lose sleep. Much.'], shy: ['Um... {worry}, mostly.'], bold: ['Not much. Well, {worry}.'], any: ['{Worry}. That keeps me up some nights.', 'I worry about {worry}.'] },
    noWorry: { any: ['Not much, honestly.', 'I try not to worry.'] },
    values: { any: ['{Value} matters most to me.', 'For me? {Value}, every time.'] },
    museGoal: { any: ['One of these days I\'m going to {goal}.', 'I keep thinking I should {goal}.'] },
    museWorry: { any: ['I keep thinking about {worry}.', 'I can\'t stop worrying about {worry}.'] },
    introJob: { any: ['I\'m {a_job}.', '{A_job}, if you were wondering.'] },
  };
  // past conversations with you: each chat (a gap of EP_GAP starts the next) is remembered by what came up, never by your
  // words: the topics, what you asked them about, how you said you felt, what you told them (your name, a like). They
  // bring one up when they next start talking to you, and answer 'what did we talk about'; how far back they remember
  // goes with how sharp they are (HORIZON days)
  const EP_GAP = 20 * 60, HORIZON = [0, 2, 5, 14, 45, 120];
  const ASKED = { job: 'my work', from: 'where I\'m from', goal: 'what I want to do', worry: 'what worries me', values: 'what matters to me', sum: 'sums',
    fact: 'odd facts', advice: 'what you should do', smart: 'how clever I am' };
  const RECALL = {
    topic: { warm: ['I was thinking about what we said about {topic} {when}.'], edge: ['We were on about {topic} {when}. My view hasn\'t changed.'], any: ['Last time we got talking about {topic}, {when}.', 'We were talking about {topic} {when}, weren\'t we?'] },
    feel: { warm: ['You were having a rough time {when}. How are you now?'], any: ['You seemed low {when}. Any better?', 'I\'ve been wondering how you are. You seemed down {when}.'] },
    up: { any: ['You were in a good mood {when}. Still?', 'You seemed happy {when}. Good to see you again.'] },
    goal: { any: ['I told you {when} I want to {goal}. Still do.', 'Remember I said I want to {goal}? I\'ve been thinking about it.'] },
    worry: { any: ['Remember I told you about {worry}? Still on my mind.', 'I\'m still thinking about {worry}, since we talked {when}.'] },
    job: { any: ['You were asking about my work {when}. Still curious?'] },
    sum: { any: ['You were testing me with sums {when}. Go on, try me again.'] },
    fact: { any: ['I\'ve found another one for you, since you liked the last.'] },
    name: { any: ['{User}! You told me your name {when}. See, I remember.', 'Good to see you again, {user}.'] },
    summary: { any: ['We talked about {topics}, {when}.', '{When}? We talked about {topics}.'] },
    now: { any: ['Just now? {Topics}.', 'We\'ve been on {topics}.'] },
    none: { any: ['I don\'t think we\'ve talked before.', 'Have we talked? I don\'t think so.'] },
    gone: { any: ['Sorry, it\'s gone. Remind me?', 'It was a while back. I\'ve forgotten, honestly.'] },
  };
  const whenOf = (t) => { const d = Date.now() / 1000 - t, now = new Date(Date.now()), then = new Date(t * 1000), day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()) / 864e5;
    const days = Math.round(day(now) - day(then));
    return d < 3600 ? 'a little while ago' : days === 0 ? 'earlier today' : days === 1 ? 'yesterday' : days < 7 ? 'a few days ago' : days < 14 ? 'last week' : 'a while back'; };
  // what a line of yours was about, in kinds (never its words): for the chat's memory
  function heard(t, raw) {
    const asked = [], k = (re, x) => { if (re.test(t)) asked.push(x); };
    k(/what do you do\b(?! for fun)|what('s| is) your job|what do you work|where do you work|for a living|line of work/, 'job');
    k(/where are you from|where('d| did) you grow up|where('s| is) home|where do you live/, 'from');
    k(/what do you want|your (dream|dreams|plans?|goals?)\b|what do you hope|bucket list/, 'goal');
    k(/what (worries|scares|frightens|bothers) you|are you (afraid|scared|worried)|keeps you up/, 'worry');
    k(/what (matters|is important) to you|what do you (care about|value|believe in)/, 'values');
    k(/tell me something|teach me|fun fact|did you know|something interesting/, 'fact');
    k(/\badvice\b|what should i do|help me decide|what would you do/, 'advice');
    k(/are you (smart|clever|intelligent|bright|a genius)|what are you good at/, 'smart');
    if (SUM.test(raw)) asked.push('sum');
    const feel = /\bi('m| am| feel)( so| really| a bit| kind of| pretty)? (tired|exhausted|sad|down|stressed|worried|lonely|upset|awful|terrible|miserable|anxious|scared)\b|\b(bad|rough|long|awful) day\b/.test(t) ? 'low'
      : /\bi('m| am| feel)( so| really| pretty)? (happy|great|excited|fantastic|wonderful|proud)\b|\b(great|good|best) day\b/.test(t) ? 'up' : '';
    return { asked, feel };
  }
  // simple sums said or asked: 'what's 7 times 8', '12 + 30', 'what is 100 divided by 4'
  const SUM = /(-?\d+(?:\.\d+)?)\s*(plus|\+|minus|-|times|x|\*|×|multiplied by|divided by|over|\/)\s*(-?\d+(?:\.\d+)?)/i;
  // the words a sharper mind reaches for (a few, now and then), and a plainer one
  const BIG = [[/\breally good\b/, 'excellent'], [/\ba lot\b/, 'a great deal'], [/\bI think\b/, 'I suspect'], [/\bvery\b/, 'remarkably'], [/\bpretty sure\b/, 'fairly certain'], [/\bweird\b/, 'curious'], [/\bbig\b/, 'enormous'], [/\bmaybe\b/, 'perhaps'], [/\b(can|could) help\b/, '$1 be of use']];
  const STOP = /^(the|and|but|you|your|are|was|for|with|that|this|have|what|just|like|about|there|they|them|then|from|really|very|some|been|were|will|would|could|should)$/;


  // ---- the present (o.now(k): { doing, hour, needs }, the page's): what they are doing, the time, how they feel in
  // body, and yes or no to doing something with you; and following a conversation: why, more, and you?
  const NOWL = {
    doing: { warm: ['Just {doing}. Nice and easy.', 'Oh, {doing}. Come keep me company.'], edge: ['{Doing}. What does it look like?', '{Doing}. Riveting, I know.'], shy: ['Oh, just... {doing}.', 'Um, {doing}.'],
      bold: ['{Doing}, and enjoying it.', '{Doing}. And you?'], humor: ['{Doing}. Very important work, as you can see.', 'Officially? {Doing}. Unofficially, also {doing}.'], plain: ['{Doing}.', 'Just {doing}.'] },
    idle: { warm: ['Nothing much, just enjoying the quiet.', 'Not a lot. Keeping you company, I suppose.'], edge: ['Nothing. Is that allowed?', 'Standing here. Thrilling stuff.'], shy: ['Oh, nothing really.', 'Just... being here.'],
      bold: ['Nothing yet. Got a better idea?', 'Waiting for something to happen. You?'], humor: ['Professionally? Nothing. I\'m very good at it.', 'Absolutely nothing, and I\'m nailing it.'], plain: ['Not much.', 'Nothing really.'] },
    time: { hi: { any: ['It\'s {exact}.', '{Exact}, give or take a minute.', 'Just about {exact}.'] }, mid: { any: ['About {round}.', 'Around {round}, I think.', 'Must be {round} or so.'] },
      lo: { any: ['Um... {part}? I don\'t really keep track.', 'No idea. {Part}, I think.'] } },
    timeNone: { any: ['No idea. There\'s no clock I can see.', 'I couldn\'t tell you, sorry.'] },
    late: { any: ['Getting late, isn\'t it?', 'Where did the day go?'] }, early: { any: ['Early, isn\'t it?', 'Too early for me, honestly.'] },
    // a need asked about: yes (and how much), no
    need: {
      hunger: { yes: ['Starving, actually.', 'I could eat. I really could.', 'Now you mention it, yes. Very.'], some: ['A little peckish.', 'I could manage a snack.'], no: ['No, I\'m fine. I ate not long ago.', 'Not really.'] },
      thirst: { yes: ['Parched. I\'d kill for a drink.', 'Yes, very. My mouth\'s dry.'], some: ['A bit, yes.', 'I could do with a drink.'], no: ['No, I\'m fine.', 'Not right now.'] },
      energy: { yes: ['Exhausted. I could sleep standing up.', 'Very. I\'m flagging.'], some: ['A bit. It\'s been a day.', 'Getting there.'], no: ['No, I\'m wide awake.', 'Not at all. Plenty left in me.'] },
      fun: { yes: ['Bored out of my mind, honestly.', 'Yes. Entertain me.'], some: ['A little. Something to do would be nice.'], no: ['No, I\'m happy enough.', 'Not at all.'] },
      company: { yes: ['A bit lonely, yes. I\'m glad you\'re here.', 'Honestly? Yes. Stay a while.'], some: ['A little.'], no: ['No, I\'m fine on my own. But this is nice.'] },
      clean: { yes: ['I could really use a shower.', 'Yes. I feel grubby.'], some: ['A wash wouldn\'t hurt.'], no: ['No, I\'m fresh as anything.'] },
    },
    needNone: { any: ['I\'m fine, I think.', 'Not especially.', 'Can\'t say I am.'] },
    // a suggestion (let's..., do you want to...): yes, maybe, no and why
    yes: { warm: ['I\'d love that.', 'Oh, yes. Good idea.'], edge: ['Fine. Yes.', 'Sure, why not.'], shy: ['Oh... okay, yes.', 'I\'d like that.'], bold: ['Yes. Let\'s go.', 'Now you\'re talking.'], humor: ['Best idea anyone\'s had all day.', 'Twist my arm. Yes.'], plain: ['Sure.', 'Okay, yes.'] },
    maybe: { warm: ['Maybe in a little while?', 'Hm, maybe. Ask me again in a bit.'], edge: ['Maybe. Not yet.', 'Possibly.'], shy: ['Um, maybe later?'], bold: ['Later. Ask me again.'], humor: ['My answer is a firm maybe.'], plain: ['Maybe later.'] },
    no: { warm: ['Not right now, but thank you.', 'I\'ll pass for now, if that\'s okay.'], edge: ['No.', 'Not really.'], shy: ['Oh, um, maybe not.', 'I\'d rather not, sorry.'], bold: ['Nah. Something else?'], humor: ['Tempting. But no.'], plain: ['No thanks.'] },
    noWhy: { hunger: 'I\'m not hungry', thirst: 'I\'m not thirsty', energy: 'I\'m not tired', fun: 'I\'m fine as I am', company: 'I\'m fine as I am', clean: 'I\'m clean enough' },
    yesWhy: { hunger: 'I\'m starving', thirst: 'I\'m parched', energy: 'I\'m worn out', fun: 'I\'m bored stiff', company: 'it\'d be nice to have company', clean: 'I feel grubby' },
    // why, after what they said
    why: { warm: ['{Topic}? It just makes me happy. Always has.', 'I don\'t know, {topic} feels like home to me.'], edge: ['Because. Do I need a reason?', 'Why does anyone like anything?'],
      shy: ['Oh, I don\'t know... it\'s calming, I suppose.'], bold: ['Because {topic} is great, that\'s why.', 'Because life\'s short.'], humor: ['Honestly? No idea. I just do.', 'It\'s a long story. Very long. Mostly about {topic}.'],
      plain: ['Just do.', 'Always have.'] },
    whyNone: { any: ['Why what?', 'Just how I am, I suppose.', 'Good question. I\'m not sure.'] },
    aboutMe: { warm: ['Me? I love {topic}.', 'Oh, me too, {topic} especially.'], edge: ['Me? {Topic}, if you must know.'], shy: ['Me? Um... {topic}, I suppose.'], bold: ['Me? {Topic}, every time.'], humor: ['Me? I\'m a {topic} person. Shocking, I know.'], plain: ['{Topic}, for me.'] },
    notMine: { any: ['Me? Not really my thing, {topic}.', '{Topic}? Not for me, honestly.'] },
    again: { any: ['Like I said, ', 'As I said, ', 'You asked me that already. '] },
  };
  // the time in words: exact (9:40 pm), round (twenty to ten), part (the evening)
  const NUMW = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  function timeWords(h) {
    h = ((+h % 24) + 24) % 24; const hr = Math.floor(h), mi = Math.round((h - hr) * 60) % 60, h12 = hr % 12 || 12;
    const exact = `${h12}:${String(mi).padStart(2, '0')} ${hr < 12 ? 'am' : 'pm'}`;
    const q = Math.round(mi / 15) % 4, next = NUMW[(hr + 1) % 12], cur = NUMW[hr % 12];
    const round = q === 0 ? (mi > 52 ? next : cur) + ' o\'clock' : q === 1 ? 'quarter past ' + cur : q === 2 ? 'half past ' + cur : 'quarter to ' + next;
    const part = hr < 5 ? 'the middle of the night' : hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : hr < 21 ? 'evening' : 'night';
    return { exact, round: round.replace(/^twelve o'clock$/, hr < 12 ? 'midnight' : 'noon'), part };
  }
  // what a suggestion is about: which of their needs it answers
  const WANT_NEED = [[/\b(eat|food|dinner|lunch|breakfast|snack|hungry|bite|order (in|room service)|pizza|burger)\b/, 'hunger'], [/\b(drink|coffee|tea|beer|wine|cocktail|water|thirsty)\b/, 'thirst'],
    [/\b(sleep|bed|nap|rest|lie down|turn in)\b/, 'energy'], [/\b(shower|bath|wash|freshen up)\b/, 'clean'], [/\b(talk|chat|hang out|sit (with|together)|cuddle|keep me company)\b/, 'company'],
    [/\b(tv|television|movie|film|swim|pool|walk|dance|play|game|music|go out|explore)\b/, 'fun']];
  // the questions people ask twice (the sharp notice it): kinds, never your words
  const ASK_KIND = [['name', /what('s| is) your name|who are you/], ['job', /what do you do\b(?! for fun)|what('s| is) your job|for a living/], ['from', /where are you from|where('s| is) home/],
    ['doing', /what are you (doing|up to)/], ['time', /what time is it|what('s| is) the time|got the time/], ['like', /what do you (like|enjoy)|hobbies/], ['how', /how are you|how('s| is) it going/]];

  // ---- what you tell them about yourself, kept (only words from these lists are ever kept or said back, never yours):
  // your work, where you are from, a pet, kids, a partner; asked after later, and remembered when you ask
  const YOU_JOBS = ['nurse', 'doctor', 'teacher', 'engineer', 'lawyer', 'chef', 'cook', 'truck driver', 'driver', 'mechanic', 'electrician', 'plumber', 'carpenter',
    'farmer', 'fisherman', 'shrimper', 'deckhand', 'sailor', 'pilot', 'soldier', 'police officer', 'cop', 'firefighter', 'paramedic', 'student', 'artist', 'writer',
    'musician', 'programmer', 'developer', 'designer', 'accountant', 'banker', 'manager', 'salesman', 'saleswoman', 'waiter', 'waitress', 'bartender', 'barista',
    'builder', 'contractor', 'welder', 'scientist', 'dentist', 'vet', 'pharmacist', 'cashier', 'clerk', 'librarian', 'photographer', 'realtor', 'consultant',
    'construction worker', 'equipment operator', 'excavator operator', 'landscaper', 'painter', 'hairdresser', 'barber', 'baker', 'butcher', 'architect', 'therapist',
    'social worker', 'janitor', 'security guard', 'mail carrier', 'nanny', 'coach', 'trainer', 'receptionist', 'secretary', 'professor', 'researcher', 'surveyor'];
  const YOU_FROM = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois',
    'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska',
    'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island',
    'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming', 'canada', 'mexico',
    'england', 'scotland', 'ireland', 'wales', 'france', 'germany', 'italy', 'spain', 'portugal', 'australia', 'new zealand', 'japan', 'china', 'india', 'brazil',
    'chicago', 'houston', 'dallas', 'atlanta', 'miami', 'new orleans', 'boston', 'seattle', 'denver', 'phoenix', 'nashville', 'memphis', 'mobile', 'biloxi', 'gulfport',
    'los angeles', 'san francisco', 'las vegas', 'detroit', 'philadelphia', 'london'];
  const YOU_PETS = ['dog', 'cat', 'puppy', 'kitten', 'horse', 'parrot', 'bird', 'fish', 'rabbit', 'hamster', 'lizard', 'snake', 'turtle', 'goat', 'chickens'];
  const YOU_PARTNERS = ['wife', 'husband', 'girlfriend', 'boyfriend', 'partner', 'fiancee', 'fiance'];
  const alt = (a) => a.slice().sort((x, y) => y.length - x.length).map((w) => w.replace(/ /g, '\\s+')).join('|');
  const RX_JOB = new RegExp(`\\b(?:i(?:'m| am) (?:a|an)|i work as (?:a|an)|i'm working as (?:a|an)|my job is|i do) (${alt(YOU_JOBS)})\\b`);
  const RX_FROM = new RegExp(`\\b(?:i(?:'m| am) from|i grew up in|i come from|i live in|i was born in) (${alt(YOU_FROM)})\\b`);
  const RX_PET = new RegExp(`\\b(?:i (?:have|got|own|'ve got) (?:a|an|two|three|four|some|\\d+)|my) (${alt(YOU_PETS)})s?\\b`);
  const RX_KIDS = /\b(?:i (?:have|got|'ve got) (?:a|an|one|two|three|four|five|\d+) (?:kids?|children|child|sons?|daughters?|boys?|girls?)|my (?:kids|children|son|daughter|boys|girls))\b/;
  const RX_PARTNER = new RegExp(`\\b(?:my (${alt(YOU_PARTNERS)})|i(?:'m| am) (married|engaged))\\b`);
  const YOURS = {
    job: { warm: ['{A_job}? That\'s wonderful.', 'Oh, {a_job}. I bet you\'re good at it.'], edge: ['{A_job}. Huh. Long hours?', '{A_job}. Fair enough.'], shy: ['Oh, {a_job}? That\'s nice.'],
      bold: ['{A_job}! Respect.', '{A_job}, eh? Tell me the worst part.'], humor: ['{A_job}? So you\'re the one to blame. Kidding.'], plain: ['{A_job}. Good work, that.'], any: ['{A_job}. I\'ll remember that.'] },
    jobRetired: { any: ['Retired? Lucky you.', 'Retired. Do you miss it?'] },
    from: { warm: ['{From}! I\'ve always wanted to go.', 'Oh, {from}. Do you miss it?'], edge: ['{From}. Long way from here.'], bold: ['{From}! Good people there.'], humor: ['{From}? I won\'t hold it against you.'], any: ['{From}. Nice.'] },
    pet: { warm: ['Aw, a {pet}! What\'s it called?', 'Oh, I love that. A {pet}.'], edge: ['A {pet}. Lot of work, those.'], shy: ['Oh, a {pet}... that\'s lovely.'], humor: ['A {pet}? Who\'s really in charge, then?'], any: ['A {pet}. Nice.'] },
    kids: { warm: ['Oh, kids! That must keep you busy.', 'How lovely. How old are they?'], edge: ['Kids. You must be tired.'], humor: ['Kids? So you haven\'t slept since.'], any: ['Kids. Good for you.'] },
    partner: { warm: ['Oh, that\'s lovely.', 'Aw. How long have you two been together?'], edge: ['Good for you.'], humor: ['Lucky them.'], any: ['That\'s nice.'] },
    // asking after them, later
    askJob: { any: ['How\'s work been? Still {a_job}?', 'Busy at work lately?', 'How\'s life as {a_job}?'] },
    askFrom: { any: ['Do you get back to {from} much?', 'Is {from} anything like here?'] },
    askPet: { any: ['How\'s your {pet} doing?', 'Is your {pet} behaving?'] },
    askKids: { any: ['How are the kids?', 'Kids keeping you busy?'] },
    askPartner: { any: ['How\'s your {partner}?', 'Everything good at home?'] },
    // asked what they remember of you
    knowJob: { any: ['You\'re {a_job}. I remember.', '{A_job}, you said.'] }, knowFrom: { any: ['{From}, isn\'t it?', 'You\'re from {from}.'] },
    knowPet: { any: ['A {pet}, you told me.', 'You\'ve got a {pet}.'] }, knowNot: { any: ['You haven\'t told me yet.', 'I don\'t think you said.'] },
    forgot: { any: ['Oh, you told me... it\'s gone. Sorry. Tell me again?'] },
  };
  // ---- their own life, the same every time for the same person (from their name, age and sex, and their card's about):
  // a partner, kids, a pet, brothers and sisters
  const FAM = {
    partnerYes: { warm: ['I am. {Years} years now, and still happy.', 'Yes, I\'m spoken for. {Years} years.'], edge: ['Yes. {Years} years.', 'Married, yes.'], shy: ['Um, yes. I am.'],
      bold: ['I am, and proud of it.'], humor: ['Yes. {Years} years and counting, poor soul.'], any: ['Yes, I am.'] },
    partnerNo: { warm: ['No, not at the moment.', 'Single, for now.'], edge: ['No. Next question.', 'Single.'], shy: ['Oh... no, I\'m not.'], bold: ['Single, and happy that way.'], humor: ['No. My standards are too high. Or theirs are.'], any: ['No.'] },
    kidsYes: { warm: ['I do. {Kids}, and they\'re my whole world.', 'Yes, {kids}. Want to see a photo?'], edge: ['{Kids}. They keep me busy.'], humor: ['{Kids}. Send reinforcements.'], any: ['Yes, {kids}.'] },
    kidsNo: { warm: ['No, not yet. Maybe one day.'], edge: ['No.', 'No kids.'], humor: ['No. I can barely look after myself.'], any: ['No, no kids.'] },
    petYes: { warm: ['A {pet}. I miss them when I\'m out.', 'Yes, a {pet}. Best friend I\'ve got.'], humor: ['A {pet}. Technically it owns me.'], any: ['A {pet}, yes.'] },
    petNo: { any: ['No pets. I\'m out too much.', 'No, no pets. Maybe one day.'] },
    sibsYes: { any: ['{Sibs}. We\'re close.', '{Sibs}. We fight, but we\'re close.', 'Yes, {sibs}.'] }, sibsNo: { any: ['No, only child.', 'Just me. Only child.'] },
    alone: { any: ['On my own, yes. I like the quiet.', 'Just me, yes.'] }, notAlone: { any: ['No, not on my own.', 'No, there\'s {who} at home.'] },
    likeJob: { warm: ['I do, most days.', 'I love it, honestly.'], edge: ['It pays the bills.', 'Some days.'], bold: ['Love it. Wouldn\'t do anything else.'], humor: ['On Fridays I do.'], any: ['It\'s alright.'] },
    noJob: { any: ['I\'m between jobs at the moment.', 'No work right now.'] },
  };
  // a line's first word kept capitalised when a filler word goes before it: I, and the names of places (YOU_FROM)
  const PLACE1 = new Set(YOU_FROM.map((w) => w.split(' ')[0]));
  const keepCap = (s) => /^I\b/.test(s) || PLACE1.has(String(s).split(/[^A-Za-z]/)[0].toLowerCase());
  const COUNT = ['none', 'one', 'two', 'three', 'four'];
  const KIDW = ['', 'one kid', 'two kids', 'three kids', 'four kids'], SIBW = ['', 'a brother', 'a brother and a sister', 'two sisters and a brother'];
  function lifeOf(c) {
    let h = 7; for (const ch of `${c.name}|${c.age}|${c.sex}|life`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = +c.age || 35, ab = String(c.about || '').toLowerCase();
    let partner = a < 22 ? h % 100 < 12 : h % 100 < (a < 30 ? 35 : a < 45 ? 60 : 65);
    if (/\b(married|husband|wife|engaged|partner)\b/.test(ab)) partner = true; else if (/\b(single|divorced|widow\w*)\b/.test(ab)) partner = false;
    let kids = a >= 26 && (partner || h % 7 === 0) ? (h >>> 3) % 4 : 0;
    if (/\bno kids\b|\bchildless\b/.test(ab)) kids = 0; else if (/\b(kids|children|son|daughter|mother of|father of|mom of|dad of)\b/.test(ab) && !kids) kids = 1 + ((h >>> 3) % 3);
    const pet = /\bdog\b/.test(ab) ? 'dog' : /\bcat\b/.test(ab) ? 'cat' : ['', '', 'dog', 'cat', 'dog', '', 'cat', ''][(h >>> 6) % 8];
    return { partner, kids, pet, sibs: (h >>> 9) % 4, years: partner ? Math.max(1, Math.min(a - 20, 2 + ((h >>> 12) % 25))) : 0 };
  }
  // what they think of a thing (one of TOPICS): theirs, or not much
  const OPINION = {
    love: { warm: ['Oh, I love {topic}.', '{Topic}? One of my favourite things.'], edge: ['{Topic} is one of the few things I\'ll defend.'], shy: ['I really like {topic}, actually.'], bold: ['{Topic}? Best thing there is.'], humor: ['{Topic}? Don\'t get me started. Actually, do.'], any: ['I like {topic} a lot.'] },
    meh: { warm: ['{Topic}? I don\'t mind it. Not really my thing, but I can see why people love it.'], edge: ['{Topic}. Overrated.', 'Never really got the point of {topic}.'], shy: ['I don\'t know much about {topic}, honestly.'],
      bold: ['{Topic}? Not for me.'], humor: ['{Topic}? I\'m told it exists.'], any: ['{Topic}? It\'s fine.'] },
  };

  // ---- plain words: the slang, shorthand and common slips people type, put the way the rest of the mind reads them
  const PLAIN_W = [[/\bwhatcha\b|\bwhat ?cha\b|\bwotcha\b/g, 'what are you'], [/\bwhat'?s up\b|\bsup\b|\bwassup\b/g, 'how are you'], [/\bhow ya doin'?g?\b|\bhow you doin'?g?\b|\bhow r u\b/g, 'how are you'],
    [/\bu\b/g, 'you'], [/\bur\b/g, 'your'], [/\br\b/g, 'are'], [/\bya\b|\by'?all\b|\byou guys\b/g, 'you'], [/\bwanna\b/g, 'want to'], [/\bgonna\b/g, 'going to'], [/\bgotta\b/g, 'got to'],
    [/\bkinda\b/g, 'kind of'], [/\bdunno\b/g, "don't know"], [/\b(thx|thanx|ty|thank u)\b/g, 'thanks'], [/\b(pls|plz)\b/g, 'please'], [/\bim\b/g, "i'm"], [/\bdont\b/g, "don't"], [/\bwhats\b/g, "what's"],
    [/\bwheres\b/g, "where's"], [/\bhows\b/g, "how's"], [/\byoure\b/g, "you're"], [/\bcant\b/g, "can't"],
    [/\b(fella|feller|beau|sweetheart|significant other|other half|hubby|wifey|missus|man in your life|woman in your life)\b/g, 'partner'], [/\b(little ones|kiddos|kiddies|young'?uns|youngsters|rugrats)\b/g, 'kids'],
    [/\b(grub|chow|a bite|bite to eat|nosh|eats)\b/g, 'food'], [/\b(cold one|brewski|brews?|pint|cocktail|beverage|bevvy)\b/g, 'drink'], [/\b(doggo|pup|pooch|doggy)\b/g, 'dog'], [/\b(kitty|kitties)\b/g, 'cat'],
    [/\b(hungy|hungery|hungrey)\b/g, 'hungry'], [/\b(tierd|tird|tirde)\b/g, 'tired'], [/\b(thristy|thirstey)\b/g, 'thirsty'], [/\b(marryed|maried)\b/g, 'married'], [/\b(whta|waht)\b/g, 'what'],
    [/\b(teh)\b/g, 'the'], [/\b(yuo|yoo)\b/g, 'you'], [/\b(snooze|kip|shut ?eye)\b/g, 'sleep'], [/\b(telly)\b/g, 'tv'], [/\b(dip)\b/g, 'swim']];
  const plainWords = (t) => { let s = ' ' + String(t).toLowerCase().replace(/[‘’]/g, "'") + ' '; for (const [w, b] of PLAIN_W) s = s.replace(w, b); return s.replace(/\s+/g, ' ').trim(); };
  // ---- what the on-device model (SENSE) matches a line to when the mind's own words miss it: the line each answers to
  // (its first), and other ways people say it
  const BANK = [
    ['are you married', 'do you have a partner', 'are you seeing someone', 'is there someone special in your life', 'do you have a boyfriend', 'do you have a girlfriend', 'are you single'],
    ['do you have kids', 'do you have children', 'are you a parent', 'any kids at home'],
    ['do you have any pets', 'do you have a dog', 'do you have a cat', 'any animals at home'],
    ['do you have any brothers or sisters', 'do you have siblings', 'are you an only child'],
    ['do you live alone', 'who do you live with', 'is there anyone at home with you'],
    ['do you like your job', 'how is work going', 'do you enjoy your work'],
    ['what are you doing', 'what are you up to', 'what are you busy with', 'what is going on with you right now'],
    ['what time is it', 'do you know the time', 'what is the time now', 'how late is it'],
    ['are you hungry', 'are you starving', 'could you eat something', 'have you eaten'],
    ['are you thirsty', 'do you need a drink'],
    ['are you tired', 'are you sleepy', 'are you worn out', 'do you need a rest'],
    ['are you bored', 'are you having fun'],
    ['do you want to get something to eat', 'shall we get some food', 'do you want to grab dinner', 'let us eat'],
    ['do you want to get a drink', 'do you want to grab a beer', 'shall we have a drink', 'fancy a drink'],
    ['do you want to go to bed', 'shall we get some sleep', 'do you want to lie down'],
    ['do you want to go for a swim', 'shall we go to the pool'],
    ['do you want to watch tv', 'shall we watch a movie'],
    ['do you want to go for a walk', 'shall we take a stroll'],
    ['what do you do for a living', 'what is your job', 'what line of work are you in', 'what kind of work do you do'],
    ['where are you from', 'where did you grow up', 'where is home for you'],
    ['what do you want', 'what are your dreams', 'what are you hoping for in life'],
    ['what worries you', 'what are you afraid of', 'what keeps you up at night'],
    ['what matters to you', 'what do you care about most'],
    ['what do you like to do for fun', 'what are your hobbies', 'what are you into'],
    ['how are you', 'how are you feeling', 'how is it going', 'how have you been'],
    ['what is your name', 'who are you', 'what should i call you'],
    ['what is my name', 'do you remember me', 'do you know who i am'],
    ['what do i do', 'do you remember my job'],
    ['where am i from', 'do you remember where i am from'],
    ['tell me something interesting', 'tell me a fact', 'teach me something'],
    ['tell me a joke', 'make me laugh', 'say something funny'],
    ['what should i do', 'can you give me some advice', 'what would you do in my place'],
    ['are you smart', 'how clever are you', 'what are you good at'],
    ['what did we talk about', 'what were we talking about last time'],
    ['where are we', 'what is this place'],
    ['what can you see', 'what is around here'],
    ['tell me more', 'go on', 'and then what'],
    ['what about you', 'and you', 'how about yourself'],
    ['goodbye', 'see you later', 'i have to go'],
    ['thanks', 'thank you so much', 'i appreciate it'],
  ];
  const SENSE = {
    // the small model that reads a line for its meaning (all-MiniLM-L6-v2, 8-bit, about 23 MB once, then kept by the
    // browser), loaded when someone first talks to them and only where data is not being saved; its library from the CDN
    lib: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2', model: 'Xenova/all-MiniLM-L6-v2',
    st: '', pipe: null, vecs: [], why: '',
    ok() { try { return typeof window !== 'undefined' && typeof document !== 'undefined' && !(navigator.connection && navigator.connection.saveData); } catch (e) { return false; } },
    load() {
      if (this.st || !this.ok()) return; this.st = 'loading';
      import(/* @vite-ignore */ this.lib).then(async (T) => {
        T.env.allowLocalModels = false;
        this.pipe = await T.pipeline('feature-extraction', this.model, { dtype: 'q8' });
        this.st = 'ready'; this.fill();
      }).catch((e) => { this.st = 'off'; this.why = String(e && e.message || e).slice(0, 120); });
    },
    async emb(t) { const r = await this.pipe(t, { pooling: 'mean', normalize: true }); return r.data; },
    // the bank's lines, a few at a time while the page is idle, so nothing stutters (a phone too)
    fill() {
      const all = BANK.flatMap((g, i) => g.map((s) => [i, s])), idle = (f) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 60));
      const step = async () => { const n = this.vecs.length; if (n >= all.length) { this.st = 'full'; return; } const [i, s] = all[n]; try { this.vecs.push([i, await this.emb(s)]); } catch (e) { this.st = 'off'; return; } idle(step); };
      idle(step);
    },
    // the bank's line a line means, when it is clearly one of them (close, and clearly closer than any other), else null
    async match(t) {
      if (this.st !== 'full') return null;
      const v = await this.emb(t), best = new Map();
      for (const [i, w] of this.vecs) { let s = 0; for (let j = 0; j < w.length; j++) s += w[j] * v[j]; if (!(best.get(i) >= s)) best.set(i, s); }
      const r = [...best].sort((a, b) => b[1] - a[1]);
      return r.length && r[0][1] >= SENSE_MIN && r[0][1] - (r[1] ? r[1][1] : 0) >= SENSE_GAP ? { text: BANK[r[0][0]][0], sim: r[0][1] } : null;
    },
  };
  const SENSE_MIN = 0.5, SENSE_GAP = 0.07;   // how close a line must be to one of the bank's, and how much closer than the next
  // ---- knowing about each other: where someone is, what they are doing, what they think of them, whether they know them
  const ABOUT = {
    where: { any: ['{Name}? {Doing}, last I saw.', '{Name}\'s {doing}.', 'Over there. {Doing}, I think.'] },
    whereNot: { any: ['No idea, honestly.', 'Haven\'t seen {name} in a while.'] },
    me: { any: ['Right here!', 'I\'m right in front of you.'] },
    fond: { warm: ['{Name}? I adore {them}.', 'Oh, {name}\'s lovely. One of the good ones.'], edge: ['{Name}\'s alright. Don\'t tell {them} I said so.'], shy: ['I like {name}. {They_are} kind to me.'], bold: ['{Name}? Love {them}.'], humor: ['{Name}? Best person here. After me.'], any: ['I like {name}.'] },
    okay: { warm: ['{Name} seems nice. I\'d like to know {them} better.'], edge: ['{Name}? Fine, I suppose.', 'No complaints about {name}.'], shy: ['{Name} seems nice...'], humor: ['{Name}? Jury\'s still out.'], any: ['{Name}\'s okay.'] },
    cool: { warm: ['{Name} and I don\'t quite click, but I\'m trying.'], edge: ['{Name}? Not my favourite.', 'Let\'s not talk about {name}.'], shy: ['I... don\'t really get on with {name}.'], bold: ['{Name}? Not a fan.'], humor: ['{Name}? We\'re working on it. Slowly.'], any: ['Not really my sort, {name}.'] },
    stranger: { any: ['I don\'t really know {name}.', 'Haven\'t really met {name} yet.', 'Who, {name}? Never spoken to {them}.'] },
    knows: { any: ['Yes, I know {name}.', 'Sure, {name} and I have talked.'] },
    tell: { any: ['{Name}? {They_are} {a_job}.', '{Name}\'s {a_job}, I think.'] },
    tellNo: { any: ['{Name}? I don\'t know much, honestly.', 'Not much to tell. Ask {them} yourself.'] },
    // something another of them told them about you
    gossip: { warm: ['{Name} tells me you\'re {a_job}. That\'s lovely.'], edge: ['{Name} says you\'re {a_job}. That right?'], humor: ['I hear from {name} you\'re {a_job}. Word gets around.'], any: ['{Name} said you\'re {a_job}.'] },
    gossipFrom: { any: ['{Name} says you\'re from {from}.', 'I hear you\'re from {from}.'] },
    gossipPet: { any: ['{Name} says you\'ve got a {pet}.', 'I hear you have a {pet}.'] },
  };
  // ---- following the talk: their own question answered with something they did not catch, and coming back to a thing
  const TRACK = {
    good: { warm: ['Oh, good! I\'m glad.', 'That\'s good to hear.'], edge: ['Good.', 'Glad to hear it.'], humor: ['Excellent. That\'s the right answer.'], any: ['Good, good.'] },
    bad: { warm: ['Oh no. I\'m sorry.', 'That\'s a shame. Anything I can do?'], edge: ['That\'s rough.', 'Ah. Sorry.'], humor: ['Oof. Well, it can only get better.'], any: ['Sorry to hear that.'] },
    heard: { warm: ['Oh, really? Tell me more about that.', 'Huh. I didn\'t know that about you.'], edge: ['Huh. Okay.', 'Fair enough.'], shy: ['Oh... I see.'], bold: ['Ha! Didn\'t see that coming.'], humor: ['Well, I did ask.'], any: ['I see.'] },
    back: { any: ['Anyway, about {topic}...', 'Going back to {topic} for a second...', 'Where were we? Oh, {topic}.'] },
    cant: { warm: ['I\'d love to, but I can\'t right now.'], edge: ['Can\'t right now.'], any: ['Not right now, I can\'t.'] },
  };
  // a suggestion, by what it is about: the need it answers (yes or no by it) and what the page is asked to do (o.go)
  const WANT_GO = [[/\b(eat|food|dinner|lunch|breakfast|snack|pizza|burger|meal)\b/, 'hunger', 'eat'], [/\b(coffee|tea)\b/, 'thirst', 'coffee'], [/\b(drink|beer|wine|water|thirsty)\b/, 'thirst', 'drink'],
    [/\b(sleep|bed|nap|turn in)\b/, 'energy', 'sleep'], [/\b(lie down|rest|sit( down)?|take a seat)\b/, 'energy', 'sit'], [/\b(shower|bath|wash|freshen up)\b/, 'clean', 'wash'],
    [/\b(tv|television|movie|film|show)\b/, 'fun', 'tv'], [/\b(swim|pool)\b/, 'fun', 'pool'], [/\b(walk|stroll|go out|explore)\b/, 'fun', 'walk'], [/\b(shop|shopping|look round the shops)\b/, 'fun', 'shop'],
    [/\b(talk|chat|hang out|sit (with|together)|keep me company)\b/, 'company', ''], [/\b(dance|play|game|music)\b/, 'fun', '']];
  function Brain(o) {
    const SAVE = o.storage + '-brain', profiles = new Map(), recent = new Map(), ownRecent = new Map();
    let mem = {}; try { mem = JSON.parse(store(SAVE) || '{}') || {}; } catch (e) { mem = {}; }
    let saveAt = 0;
    const save = () => {
      const now = Date.now(); if (now - saveAt < 2000) { clearTimeout(save.t); save.t = setTimeout(save, 2100); return; }
      saveAt = now; const keys = Object.keys(mem);
      if (keys.length > 80) keys.sort((a, b) => (mem[a].t || 0) - (mem[b].t || 0)).slice(0, keys.length - 80).forEach((k) => delete mem[k]);
      store(SAVE, JSON.stringify(mem));
    };
    const idOf = (c) => `${c.name}|${c.age}|${c.sex}`;
    // the profile: traits over a roll of their own (name and id), two interests, a lean word and an exclamation
    function profile(c) {
      const id = idOf(c) + '|' + c.traits.join(','), key = id + '|' + [c.smarts, c.knack, (c.values || []).join(','), (c.likes || []).join(','), c.job, c.about].join('|');
      if (profiles.has(key)) return profiles.get(key);
      const r = rngOf(id), d = {};
      for (const k of ['warm', 'edge', 'shy', 'bold', 'humor', 'plain', 'curious', 'dream', 'talk', 'energy', 'nerve']) d[k] = 0.25 + r() * 0.3;
      // how easily frightened: a roll of its own (so the rest of the roll, and their interests, stay as they were)
      const rf = rngOf(id + '|fear'); d.fear = 0.22 + rf() * 0.32;
      for (const t of c.traits) { for (const [k, v] of Object.entries(TRAIT_DIMS[t] || {})) d[k] += v; d.fear += TRAIT_FEAR[t] || 0; }
      for (const t of c.values || []) for (const [k, v] of Object.entries(VALUE_DIMS[t] || {})) d[k] += v;
      d.fear += (0.4 - d.nerve) * 0.3;
      const [mv, ma] = MOOD_VA[c.mood] || MOOD_VA.calm; d.energy += (ma - 0.4) * 0.3;
      for (const k in d) d[k] = cl(d[k]);
      // how sharp they are (not rolled: designed, or the card's own roll): 0 simple .. 1 brilliant
      const smarts = c.smarts || 3; d.smart = (smarts - 1) / 4;
      // interests: leaning on the strongest sides of them, then anything
      const pool = []; for (const [k, ts] of Object.entries(LEANS)) for (const t of ts) for (let i = 0; i < Math.round(d[k] * 4); i++) pool.push(t);
      for (const t of TKEYS) pool.push(t);
      // their designed interests first, then what their 'about' and work name (a chef talks food), then the roll
      const likes = (c.likes || []).filter((t) => TOPICS[t]).slice(0, 3), said = (String(c.about || '') + ' ' + String(c.job || '')).toLowerCase();
      for (const t of TKEYS) if (likes.length < 2 && !likes.includes(t) && TOPICS[t].w.test(said)) likes.push(t);
      while (likes.length < 3) { const t = pool[Math.floor(r() * pool.length)]; if (!likes.includes(t)) likes.push(t); }
      const top = FLAV.slice().sort((a, b) => d[b] - d[a])[0];
      const p = { d, likes, top, base: [mv, ma], tic: r() < 0.5 ? { at: 'start', w: TICS.start[Math.floor(r() * TICS.start.length)] } : { at: 'end', w: TICS.end[Math.floor(r() * TICS.end.length)] },
        ex: EXCL[top][Math.floor(r() * EXCL[top].length)], ticRate: 0.08 + r() * 0.17, smarts, knack: KNACKS[c.knack] ? c.knack : 'street' };
      profiles.set(id, p); return p;
    }
    const memOf = (c) => {
      const k = idOf(c), m = mem[k] || (mem[k] = { rel: {}, seen: {}, user: { likes: [] }, mood: null });
      m.t = Date.now(); return m;
    };
    // mood: where events left it, drifting back to their own over a couple of minutes
    function moodNow(c, m, P) {
      const now = Date.now() / 1000;
      if (!m.mood) m.mood = { v: P.base[0], a: P.base[1], t: now };
      const k = Math.exp(-(now - m.mood.t) / 150);
      m.mood.v = P.base[0] + (m.mood.v - P.base[0]) * k; m.mood.a = P.base[1] + (m.mood.a - P.base[1]) * k; m.mood.t = now;
      return m.mood;
    }
    const push = (c, m, P, dv, da) => { const s = moodNow(c, m, P); s.v = cl(s.v + dv, -1, 1); s.a = cl(s.a + da, 0, 1); };
    function moodName(c, m, P) {
      const { v, a } = moodNow(c, m, P);
      if (a > 0.82 && Math.abs(v) < 0.35) return 'surprised';
      if (v < -0.35) return a > 0.5 ? 'annoyed' : 'sad';
      if (a < 0.15) return 'tired';
      if (v > 0.45) return a > 0.65 || P.d.humor > 0.6 ? 'playful' : 'happy';
      if (Math.abs(v - P.base[0]) < 0.15 && Math.abs(a - P.base[1]) < 0.15) return c.mood;
      return P.d.curious > 0.6 ? 'curious' : P.d.shy > 0.6 ? 'shy' : v > 0.15 ? 'calm' : 'thoughtful';
    }
    // the chat going on now (or a new one after EP_GAP), and the last one they still remember before it
    function episode(m) {
      const U = m.user, now = Date.now() / 1000, E = U.eps || (U.eps = []);
      let e = E[E.length - 1];
      if (!e || now - e.t1 > EP_GAP) { e = { t0: now, t1: now, n: 0, topics: [], asked: [] }; E.push(e); if (E.length > 12) E.shift(); }
      e.t1 = now; return e;
    }
    function pastEp(m, P, also) {
      const now = Date.now() / 1000, E = (m.user.eps || []).filter((e) => (also ? now - e.t0 > 120 : now - e.t1 > EP_GAP) && e.n > 0 && (e.topics.length || e.asked.length || e.feel || e.name));
      const e = E[E.length - 1];
      return !e ? null : now - e.t1 > HORIZON[P.smarts || 3] * 86400 ? 'gone' : e;
    }
    const addTo = (a, x, n = 6) => { if (x && !a.includes(x)) { a.push(x); if (a.length > n) a.shift(); } };
    // what you said goes into the chat's memory as kinds; their own topic too
    function note(m, text, meta) {
      const e = episode(m); e.n++;
      if (text != null) {
        const t = String(text).toLowerCase(), h = heard(t, String(text));
        for (const a of h.asked) addTo(e.asked, a);
        if (h.feel) e.feel = h.feel;
        addTo(e.topics, topicIn(t));
        if (m.user.name) e.name = 1;
      }
      if (meta && meta.topic) addTo(e.topics, meta.topic);
    }
    // bringing a past chat up: the strongest thing in it (how you felt, then what they told you, then a topic)
    function recall(k, P, c, m, e, slots) {
      slots.when = whenOf(e.t1);
      const opts = [];
      if (e.feel === 'low') opts.push('feel', 'feel', 'feel'); if (e.feel === 'up') opts.push('up');
      if (e.asked.includes('goal') && c.goal) opts.push('goal', 'goal'); if (e.asked.includes('worry') && c.worry) opts.push('worry', 'worry');
      if (e.asked.includes('job') && c.job) opts.push('job'); if (e.asked.includes('sum')) opts.push('sum'); if (e.asked.includes('fact')) opts.push('fact');
      if (e.topics.length) opts.push('topic', 'topic'); if (e.name && m.user.name) opts.push('name');
      if (!opts.length) return '';
      const w = opts[Math.floor(Math.random() * opts.length)];
      Object.assign(slots, { goal: c.goal, worry: c.worry, topic: e.topics.length ? TOPICS[e.topics[e.topics.length - 1]].n : '' });
      if (w === 'feel') m.user.feel = '';
      const s = pick(k, P, RECALL[w], slots);
      return w === 'fact' ? s + ' ' + knowLine(k, P) : s;
    }
    // 'what did we talk about': the last chat they remember, in a few words
    function summary(k, P, m, slots) {
      const e = pastEp(m, P, true);
      if (e === 'gone') return pick(k, P, RECALL.gone, slots);
      if (!e) return pick(k, P, RECALL.none, slots);
      const bits = e.topics.map((t) => TOPICS[t].n).concat(e.asked.map((a) => ASKED[a])).concat(e.feel === 'low' ? ['how you were feeling'] : []).slice(0, 4);
      if (!bits.length) bits.push('this and that');
      slots.topics = bits.length > 1 ? bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1] : bits[0]; slots.when = whenOf(e.t1);
      return pick(k, P, Date.now() / 1000 - e.t1 < EP_GAP ? RECALL.now : RECALL.summary, slots);
    }
    // what they think of someone: learned, on top of how fond of the others they were made (a change to that shifts it)
    const relOf = (m, name, c) => {
      const R = m.rel[name] || (m.rel[name] = { met: 0, like: 0, talks: 0, touch: [], likes: [] }), f = c && c.fond ? c.fond : 0;
      if ((R.fond || 0) !== f) { R.like = cl(R.like - (R.fond || 0) + f, -1, 1); R.fond = f; }
      if (Math.abs(f) > 0.3 && R.met < 2) R.met = 2;   // made fond (or cold) of them: they know them already
      return R;
    };
    // a thing as the app gives it: words, or { what, danger, threat (0..1), feet, moving, toward, sound, new, ref }
    const thing = (g) => (g && typeof g === 'object' ? g : { what: String(g || 'something') });
    // how a thing feels to them: its threat (closer, coming at them, heard and not seen, feared before: more; met often
    // and harmless: less) felt through how easily frightened they are; its interest (new, moving, a sound) through how
    // inquisitive they are
    function sense(P, m, g) {
      const d = P.d, w = bare(g.what), N = noteOf(g.what), S = m.seen[w];
      let t = N.t; if (g.danger) t = Math.max(t, 0.7); if (typeof g.threat === 'number') t = g.threat;
      const feet = g.feet != null && isFinite(g.feet) ? +g.feet : 30, prox = cl(1 - feet / 80);
      t *= 0.45 + prox * 0.85; if (g.toward) t += 0.15; if (g.moving && t > 0.2) t += 0.05; if (g.sound) t += 0.08 * d.fear;
      if (S && S.fear > 0.3) t += S.fear * 0.3; else if (S && S.n > 4 && !g.danger) t *= 0.7;
      const novel = S ? 1 / (1 + S.n * 0.45) : 1;
      if (/odd|dark|stranger|loud|creepy/.test(N.c)) t += d.fear * 0.14 * novel;   // the unknown, to the easily frightened
      const i = N.i * (0.4 + novel * 0.6) + (g.moving ? 0.1 : 0) + (g.sound ? 0.15 : 0) + (g.new ? 0.1 : 0);
      return { c: N.c, t: cl(t), felt: cl(t * (0.7 + d.fear * 0.7)), keen: cl(i * (0.3 + d.curious * 1.3)), nice: N.p || 0, feet, novel };
    }
    // what they do about it: run, back off, freeze, warn the others, watch it, go and look, ignore it, help, call for help.
    // The easily frightened back off and run from less, or freeze; the inquisitive go and look at what others only watch;
    // the bold and warm warn others or help; a bad mood makes anyone jumpier. A little chance in it, so a crowd differs.
    function choose(c, P, m, ev) {
      const d = P.d, g = thing(ev), s = sense(P, m, g), mood = moodNow(c, m, P), jit = () => (Math.random() - 0.5) * 0.14;
      const fear = cl(d.fear + (mood.v < -0.2 && mood.a > 0.5 ? 0.12 : 0) + jit()), cur = cl(d.curious + jit()), heart = (d.warm + d.bold) / 2 + jit();
      let act;
      const warns = d.bold > 0.5 || heart > 0.55;
      // nobody goes up to a danger, a storm or something far off to look; the inquisitive watch those
      const near = !g.danger && s.feet < 120 && !/storm|weather|dark/.test(s.c);
      if ((ev.kind === 'still' || s.c === 'hurt') && !g.danger) act = heart > fear * 0.8 + 0.12 ? 'help' : fear > 0.62 && Math.random() < 0.5 ? 'freeze' : 'call';
      else if (s.felt > 0.68) act = fear > 0.5 ? (d.shy > 0.55 && Math.random() < d.shy * 0.6 ? 'freeze' : 'flee') : warns ? 'warn' : 'back';
      else if (s.felt > 0.42) act = fear > 0.6 ? (d.shy > 0.55 && Math.random() < 0.4 ? 'freeze' : 'back') : s.t > 0.55 && warns ? 'warn' : cur > fear + 0.15 && s.keen > 0.35 ? 'watch' : warns ? 'warn' : 'back';
      else if (s.felt > 0.22) act = fear > 0.65 ? 'back' : near && s.t < 0.45 && cur > 0.55 + fear * 0.2 && s.keen > 0.4 ? 'investigate' : 'watch';
      else act = near && s.t < 0.45 && s.keen > 0.5 && cur > 0.45 + fear * 0.3 ? 'investigate' : s.keen > 0.3 || s.nice > 0.3 ? 'watch' : 'ignore';
      // told of it by someone else: go by what they say (nobody warns on a warning), and the inquisitive ask
      if (ev.kind === 'alarm') act = act === 'warn' ? 'watch' : act === 'investigate' ? 'watch' : act === 'ignore' ? 'watch' : act;
      // touched by someone, too often or by someone they don't like: the frightened step back
      if (ev.kind === 'touched') act = fear > 0.45 && s.felt > 0.15 ? 'back' : 'ignore';
      return { do: act, what: g.what, at: g.ref != null ? g.ref : ev.by, by: ev.kind === 'alarm' ? ev.by : undefined, kind: s.c, threat: +s.t.toFixed(2), felt: +s.felt.toFixed(2), keen: +s.keen.toFixed(2), feet: Math.round(s.feet) };
    }
    // a decision on something (an event or a thing seen), without saying anything or remembering it
    function decide(k, ev) {
      const c = o.card(k); if (!c || !ev) return null;
      const P = profile(c), m = memOf(c);
      if (ev.kind === 'touched') {
        const R = ev.by != null ? relOf(m, o.nameOf(ev.by), c) : null, many = R ? R.touch.length : 1;
        return choose(c, P, m, Object.assign({}, ev, { threat: many > 3 || (R && R.like < -0.3) ? 0.6 : ev.how === 'slap' ? (R && R.like > 0.4 ? 0.25 : 0.5) : ev.how === 'brush' || ev.how === 'oil' || ev.how === 'tickle' ? 0.02 : R && R.met + R.talks > 1 ? 0.05 : 0.3, feet: 1 }));
      }
      if (!/^(animal|see|notice|alarm|still|gone)$/.test(ev.kind)) return null;
      if (ev.kind === 'gone') return { do: 'ignore', what: ev.what, at: ev.ref };
      return choose(c, P, m, ev);
    }
    // learning from what happens to them
    function observe(k, ev) {
      const c = o.card(k); if (!c || !ev) return;
      const P = profile(c), m = memOf(c), d = P.d, now = Date.now() / 1000;
      const who = ev.by != null ? o.nameOf(ev.by) : '', R = who ? relOf(m, who, c) : null;
      if (ev.kind === 'touched' && R) {
        R.touch = R.touch.filter((t) => now - t < 40); R.touch.push(now);
        const many = R.touch.length, known = R.met + R.talks > 1;
        let dl = many > 3 ? -0.18 : (d.warm * 0.08 + d.bold * 0.04 - d.shy * (known ? 0.03 : 0.08) - d.edge * 0.07 + (R.like > 0.3 ? 0.05 : 0));
        if (ev.how === 'slap') dl -= 0.06 + 0.1 * (1 - Math.max(0, R.like)) * (1 - d.bold * 0.5); else if (ev.how === 'cold') dl -= 0.02;
        else if (ev.how === 'brush' || ev.how === 'oil') dl += 0.04; else if (ev.how === 'tickle') dl += d.warm * 0.04 - d.edge * 0.03; else if (ev.how === 'pour') dl -= 0.05 * (1 - d.bold);
        R.like = cl(R.like + dl, -1, 1); push(c, m, P, dl * 1.5, 0.25 + (1 - d.nerve) * 0.15);
      } else if ((ev.kind === 'arrived' || ev.kind === 'approached') && R) {
        R.met++; R.like = cl(R.like + 0.02 + d.warm * 0.04 - d.edge * 0.02, -1, 1); push(c, m, P, R.like * 0.1, 0.12);
      } else if (/^(animal|see|notice|alarm)$/.test(ev.kind)) {
        // a thing seen (or heard of): fear of it grows when it threatens them, by how easily frightened they are, and
        // fades when it doesn't; what is lovely lifts the mood, what is new wakes them up
        const w = bare(ev.what), s = sense(P, m, thing(ev)), S = m.seen[w] || (m.seen[w] = { n: 0, fear: 0 });
        S.n++; S.t = now;
        if (ev.danger || s.t > 0.45) { S.fear = cl(S.fear + 0.1 + s.felt * 0.25 + d.fear * 0.15); push(c, m, P, -0.3 * s.felt, 0.2 + s.felt * 0.4); }
        else { S.fear *= 0.8 - (d.smart || 0) * 0.2; push(c, m, P, s.nice * 0.12 + (ev.kind === 'animal' ? 0.08 * d.warm : 0), 0.05 + s.keen * 0.15); }
        if (ev.kind === 'alarm' && R) R.like = cl(R.like + 0.03, -1, 1);
      } else if (ev.kind === 'gone') {
        const S = m.seen[bare(ev.what)]; if (S && S.fear > 0.3) push(c, m, P, 0.15 + d.fear * 0.1, -0.15);
      } else if (ev.kind === 'thing') {
        const w = bare(ev.what), S = m.seen[w] || (m.seen[w] = { n: 0, fear: 0 });
        S.n++; S.t = now;
        if (ev.how === 'road') { S.fear = cl(S.fear + 0.1 + (1 - d.nerve) * 0.2); push(c, m, P, -0.2 * (1 - d.nerve), 0.45); }
        else push(c, m, P, ev.how === 'pet' ? 0.12 * (0.4 + d.warm) : ev.how === 'sit' ? 0.05 : 0.03 * (0.5 + d.curious), ev.how === 'sit' ? -0.12 : 0.05);
      } else if (ev.kind === 'lost') {
        // somewhere they don't know: unsettled, more so the easily frightened; finding the way lifts them
        const f = { wake: [-0.12 - d.fear * 0.15, 0.35], around: [-0.04, 0.1], ask: [0.04, 0.05], plan: [0.06, 0.05], nothing: [-0.06, 0], found: [0.3, 0.3], come: [0.25, 0.2], out: [0.35, -0.05], done: [0.35, 0.1] }[ev.how];
        if (f) push(c, m, P, f[0], f[1]);
        if (R && /^(ask|come)$/.test(ev.how)) R.like = cl(R.like + 0.04, -1, 1);
      } else if (ev.kind === 'still' && R) push(c, m, P, -0.35, 0.3);
      else if (ev.kind === 'left' && R) push(c, m, P, -0.03 * cl(R.like + 0.5), -0.05);
      save();
    }
    // what they say: pick from a table by their own mix of flavours, not what they said lately
    function pick(k, P, tab, slots) {
      if (!tab) return '';
      const fl = Object.keys(tab).filter((f) => f !== 'any'), ws = fl.map((f) => P.d[f] * P.d[f] + 0.03);
      let f = 'any';
      if (fl.length && (!tab.any || Math.random() > 0.25)) { let r = Math.random() * ws.reduce((a, b) => a + b, 0); f = fl[fl.length - 1]; for (let i = 0; i < fl.length; i++) if ((r -= ws[i]) <= 0) { f = fl[i]; break; } }
      // not what they said lately, nor what anyone here just said
      const list = tab[f] || tab.any, rc = recent.get(k) || [], all = recent.get('*') || []; recent.set(k, rc); recent.set('*', all);
      let fresh = list.filter((s) => !rc.includes(s) && !all.includes(s));
      // all said just now: borrow from their next flavour rather than echo someone
      if (!fresh.length) for (const g of fl.slice().sort((a, b) => P.d[b] - P.d[a]).concat(tab.any ? ['any'] : [])) { fresh = tab[g].filter((s) => !rc.includes(s) && !all.includes(s)); if (fresh.length) break; }
      if (!fresh.length) fresh = list.filter((s) => !rc.includes(s)); if (!fresh.length) fresh = list;
      const s = fresh[Math.floor(Math.random() * fresh.length)];
      rc.push(s); if (rc.length > 24) rc.shift(); all.push(s); if (all.length > 12) all.shift();
      return fill(s, slots);
    }
    function fill(s, v) {
      return s.replace(/\{, user\}/g, v.user ? ', ' + v.user : '').replace(/\{(\w+)\}/g, (_, x) => {
        const lo = x.toLowerCase(), val = v[lo] != null ? String(v[lo]) : '';
        return x[0] === x[0].toUpperCase() ? cap(val) : val;
      }).replace(/^(.)/, (c) => c.toUpperCase()).replace(/([^.][.!?] )([a-z])/g, (_, a, b) => a + b.toUpperCase());
    }
    // their way of talking over a line: a lean word, hesitation when shy, exclamations when lively, flat when dry
    function voice(s, P, mood, o2 = {}) {
      const d = P.d;
      if (o2.ex) s = P.ex + ' ' + s;
      if (Math.random() < P.ticRate && !/\?/.test(s) && s.length > 24 && s.length < 90 && !/thank|sorry|bye|name|I'm [A-Z]|^(Hi|Hello|Hey)\b/i.test(s)) {
        if (P.tic.at === 'start') s = P.tic.w + ' ' + s.replace(/^(.)/, (c) => (keepCap(s) ? c : c.toLowerCase()));
        else s = s.replace(/[.!]$/, '') + P.tic.w;
      }
      if (d.shy > 0.6 && Math.random() < d.shy * 0.35 && !/^(Um|Oh)/.test(s)) s = 'Um, ' + s.replace(/^(.)/, (c) => (keepCap(s) ? c : c.toLowerCase()));
      // the sharp reach for a bigger word now and then; the simple hesitate and keep it short
      if (P.smarts >= 4) { const n = P.smarts === 5 ? 2 : 1; let done = 0; for (const [w, b] of BIG) if (done < n && w.test(s) && Math.random() < (P.smarts === 5 ? 0.55 : 0.3)) { s = s.replace(w, b); done++; } }
      else if (P.smarts <= 1 && !o2.exact) { if (Math.random() < 0.2 && !/^(Uh|Um|Oh)/.test(s)) s = 'Uh, ' + s.replace(/^(.)/, (c) => (keepCap(s) ? c : c.toLowerCase())); const sn = s.split(/(?<=[.!?]) /); if (sn.length > 2 && Math.random() < 0.6) s = sn.slice(0, 2).join(' '); }
      if (d.edge > 0.65) s = s.replace(/!/g, '.');
      else if ((mood === 'happy' || mood === 'playful') && d.energy > 0.6 && Math.random() < 0.5) s = s.replace(/([^.])\.$/, '$1!');
      return s;
    }
    const face = (mood) => (mood === 'happy' || mood === 'playful' ? 'smiling' : mood === 'tired' ? 'closed' : /annoyed|sad|surprised/.test(mood) ? 'none' : 'calm');
    const topicIn = (t) => TKEYS.find((k) => TOPICS[k].w.test(t));
    const bare = (w) => String(w || 'something').replace(/^(a|an|the) /i, '');
    function topicLine(k, P, t, ask) { const T = TOPICS[t]; return pick(k, P, { any: ask ? T.ask : T.say }, {}); }
    const jobSlots = (c, slots) => Object.assign(slots, { job: c.job, a_job: aOf(c.job) });
    // something they know: a fact (the book smart, the quick with numbers) or a thing they have learnt (the rest), said
    // as sharply as they are; the sharpest now and then know things past their own knack
    function knowLine(k, P) {
      const tier = tierOf(P), from = P.smarts >= 4 && Math.random() < 0.3 ? (P.knack === 'book' ? 'numbers' : 'book') : P.knack, facts = from === 'book' || from === 'numbers';
      if (tier === 'lo' && facts && Math.random() < 0.5) return pick(k, P, IQ.blank, {});
      const fact = pick(k, P, { any: KNOWS[from] }, {}), lc = /^(Oxford|I)\b/.test(fact) ? fact : fact.replace(/^(.)/, (x) => x.toLowerCase());
      const pre = (facts ? IQ.factPre : IQ.sayPre)[tier];
      return fill(pre[Math.floor(Math.random() * pre.length)], { fact, fact_lc: lc });
    }
    // a sum: worked out right as often as they are sharp (more for the quick with numbers, less as it gets harder), or a
    // near miss; the simple may not try a hard one
    function sum(k, P, mt) {
      const a = +mt[1], b = +mt[3], op = mt[2].toLowerCase(), num = P.knack === 'numbers', tier = tierOf(P);
      const v = /plus|\+/.test(op) ? a + b : /minus|-/.test(op) ? a - b : /divided|over|\//.test(op) ? (b === 0 ? NaN : a / b) : a * b;
      if (!isFinite(v)) return pick(k, P, IQ.divZero, {});
      const hard = Math.min(1, (Math.abs(a) > 12 || Math.abs(b) > 12 ? 0.4 : 0) + (Math.abs(v) > 200 ? 0.3 : 0) + (v % 1 ? 0.3 : 0));
      if (P.smarts <= 1 && hard > 0.5 && Math.random() < 0.6) return pick(k, P, IQ.mathNo, {});
      const ok = cl(0.35 + P.d.smart * 0.6 + (num ? 0.25 : 0) - hard * (1 - P.d.smart) * 0.6, 0.05, 0.995);
      const show = (x) => (x % 1 ? (P.smarts >= 4 || num ? String(+x.toFixed(2)) : 'about ' + Math.round(x)) : String(x));
      if (Math.random() < ok) return pick(k, P, num && Math.random() < 0.4 ? IQ.numbers : IQ.mathRight[tier], { ans: show(v) });
      const miss = v % 1 ? Math.round(v) + (Math.random() < 0.5 ? 1 : -1) : v + (Math.random() < 0.5 ? -1 : 1) * Math.max(1, Math.round(Math.abs(v) * (0.02 + Math.random() * 0.1)));
      return pick(k, P, IQ.mathWrong[tier], { ans: String(miss) });
    }

    // a line: for the user (to 'you'), to someone (to: their key), on something that happened (ev), or to themself (ev.kind 'muse')
    function line(k, to, ev, lines, opt) {
      const c = o.card(k); if (!c) return null;
      const P = profile(c), m = memOf(c), d = P.d;
      let say = '', look = 'you', meta = {}, ex = false, act = ev && ev.dec ? ev.dec : null;
      const mood0 = moodName(c, m, P);
      const slots = { me: c.name, user: (o.youName && o.youName()) || m.user.name || '' };
      if (ev) {
        const who = ev.by != null ? o.nameOf(ev.by) : ev.who || 'someone', R = ev.by != null ? relOf(m, who, c) : null, w = bare(ev.what);
        Object.assign(slots, { name: who, part: ev.where || 'arm', what: ev.what || 'something', the: 'the ' + w, feet: ev.feet ? Math.round(ev.feet) : 'a few' });
        look = 'them';
        if (ev.kind === 'touched') {
          const recentN = R ? R.touch.length : 1, known = R && R.met + R.talks > 1;
          let tab = recentN > 3 || (R && R.like < -0.35) ? L.touchCross : !known ? (d.shy + d.edge > d.warm + d.bold ? L.touchWary : L.touchNew) : R.like > 0.1 ? L.touchGood : L.touchWary;
          // with something, or a slap: said for what it was, unless it has already gone too far (touchCross)
          if (tab !== L.touchCross || ev.how === 'slap') {
            const liked = !!(R && R.like > 0.1) || (ev.who === 'you' && d.warm + d.bold > d.shy + d.edge);
            if (ev.how === 'slap') tab = ev.what ? L.slappedWith : L.slapped;
            else if (L[HOW[ev.how]]) tab = L[HOW[ev.how]];
            else if (ev.how === 'cold') tab = L.chilly;
            else if (ev.how === 'sticky' && liked) tab = L.sticky;
            else if (ev.what) tab = liked ? L.touchWith : L.touchWithWary;
          }
          say = pick(k, P, tab, slots); ex = !known && d.energy > 0.5 && Math.random() < 0.4;
          if (ev.dec && ev.dec.do === 'back') look = 'away';
        } else if (ev.kind === 'arrived' || ev.kind === 'approached') {
          if (!R || R.met + R.talks <= 1) say = pick(k, P, ev.kind === 'arrived' ? L.hello : L.over, slots);
          else say = pick(k, P, R.like < -0.25 ? L.cold : ev.kind === 'arrived' ? L.again : L.over, slots);
          if (R && R.like > 0.5 && Math.random() < 0.3) say += ' ' + pick(k, P, L.likeYou, slots);
        } else if (ev.kind === 'animal') {
          const S = m.seen[w] || { n: 1, fear: 0 }, a = ev.dec ? ev.dec.do : 'watch';
          // what they decided says it (running, backing off, freezing, going to look); else the animal lines
          if (/^(flee|back|freeze|investigate)$/.test(a)) say = pick(k, P, L[a], slots);
          else say = pick(k, P, ev.danger ? (S.n > 2 ? L.dangerAgain : a === 'warn' ? L.warn : L.danger) : S.fear > 0.3 ? L.dangerAgain : S.n > 2 ? L.animalAgain : L.animal, slots);
          ex = ev.danger && S.n <= 2; look = /flee|back/.test(a) || (ev.danger && d.shy > 0.5) ? 'away' : 'them';
        } else if (ev.kind === 'thing') {
          slots.bare = w;
          const tab = { look: L.look, car: L.car, sit: L.sit, pet: L.pet, road: L.road }[ev.how] || L.look, S = m.seen[w];
          say = pick(k, P, ev.how === 'look' && S && S.n > 2 ? L.seeAgain : tab, slots);
          ex = ev.how === 'road' && d.energy > 0.4; look = ev.how === 'sit' ? 'away' : 'them';
        } else if (ev.kind === 'lost') {
          // the story: in their own words, by how it goes (lostWake ... lostDone)
          Object.assign(slots, { dir: ev.dir || 'over there', goal: ev.goal || 'find a way home', what: ev.what || 'a way out' });
          // a story's own words for this turn (STORY, ev.story), else being lost's (lostWake ... lostDone)
          const how = String(ev.how || 'wonder'), own = STORY[ev.story] && (STORY[ev.story][how] || (how === 'out' && STORY[ev.story].done) || (how === 'done' && STORY[ev.story].out));
          const tab = own || L['lost' + how.charAt(0).toUpperCase() + how.slice(1)] || L.lostWonder;
          say = pick(k, P, tab, slots);
          ex = /^(found|wake)$/.test(how) && d.energy > 0.35; look = /^(ask|come|plan|found)$/.test(how) ? 'them' : 'away';
        } else if (ev.kind === 'notice' || ev.kind === 'alarm' || ev.kind === 'gone') {
          // anything noticed: what they decided, in their words; an opener now and then for something new
          const a = ev.dec ? ev.dec.do : 'watch', S = m.seen[w], kind = noteOf(ev.what).c;
          if (ev.kind === 'gone') say = pick(k, P, L.gone, slots);
          else if (ev.kind === 'alarm') say = /flee|back|freeze/.test(a) ? pick(k, P, d.fear > 0.5 ? L.alarmFear : L[a], slots) : pick(k, P, L.alarmAsk, slots);
          else if (a === 'ignore') { if (Math.random() < 0.8) return null; say = pick(k, P, L.ignore, slots); }
          else if (a === 'watch' && S && S.n > 2 && !(S.fear > 0.3)) say = pick(k, P, L.seeAgain, slots);
          else if (a === 'watch' && ev.danger) say = pick(k, P, S && S.n > 2 ? L.dangerAgain : d.fear > 0.5 ? L.watch : STEADY, slots);
          else say = pick(k, P, L[a] || L.watch, slots);
          if (ev.kind === 'notice' && (ev.new || ev.sound) && OPEN[kind] && Math.random() < 0.5) say = OPEN[kind][Math.floor(Math.random() * OPEN[kind].length)] + ' ' + say;
          ex = ev.kind === 'notice' && /flee|warn|call/.test(a) && Math.random() < 0.5;
          look = /flee|back/.test(a) || (a === 'freeze' && d.shy > 0.5) ? 'away' : 'them';
        } else if (ev.kind === 'still') { const a = ev.dec ? ev.dec.do : 'call'; say = pick(k, P, a === 'help' ? L.help : a === 'freeze' ? L.freeze : L.still, slots); if (a === 'call' && Math.random() < 0.5) say += ' ' + pick(k, P, L.call, slots); }
        else if (ev.kind === 'aside') { slots.topic = TOPICS[ev.topic] ? TOPICS[ev.topic].n : 'that'; say = pick(k, P, L.aside, slots); if (R) R.like = cl(R.like + 0.06, -1, 1); }
        else if (ev.kind === 'left') say = pick(k, P, L.left, slots);
        else if (ev.kind === 'muse') {
          look = 'away';
          const feared = Object.entries(m.seen).filter(([, s]) => s.fear > 0.4).sort((a, b) => b[1].fear - a[1].fear)[0];
          const sights = o.sights ? o.sights(k) : [];
          const r = Math.random();
          if (feared && r < 0.1 + d.fear * 0.3) { slots.the = 'the ' + feared[0]; say = pick(k, P, L.museFear, slots); }
          else if (sights.length && r < 0.65) {
            // what catches their eye: the new, the threatening, the interesting (to them) first; and they decide on it
            const gs = sights.map(thing), ws = gs.map((g) => { const x = sense(P, m, g); return 0.12 + x.keen + x.felt * 1.2; });
            let rr = Math.random() * ws.reduce((a, b) => a + b, 0), g = gs[gs.length - 1];
            for (let i = 0; i < gs.length; i++) if ((rr -= ws[i]) <= 0) { g = gs[i]; break; }
            const s = g.what, bad = !!g.danger, S = m.seen[bare(s)], dec = choose(c, P, m, Object.assign({ kind: 'see' }, g));
            Object.assign(slots, { what: s, the: 'the ' + bare(s), feet: g.feet ? Math.round(g.feet) : 'a few' });
            if (/^(flee|back|freeze|warn|investigate|help|call)$/.test(dec.do)) { say = pick(k, P, L[dec.do], slots); look = /flee|back/.test(dec.do) ? 'away' : 'them'; }
            else say = pick(k, P, bad ? (S && S.n > 2 ? L.dangerAgain : L.danger) : S && S.fear > 0.3 ? L.museFear : S && S.n > 1 ? L.seeAgain : dec.do === 'watch' && d.curious > 0.55 ? L.watch : L.see, slots);
            if (dec.do !== 'ignore') act = dec;
            observe(k, Object.assign({}, g, { kind: 'see' }));
          } else if (d.fear > 0.6 && r < 0.78 && Math.random() < d.fear - 0.3) say = pick(k, P, L.museWorry, slots);
          else if (d.curious > 0.6 && r < 0.78 && Math.random() < d.curious - 0.3) say = pick(k, P, L.museWonder, slots);
          else if (mood0 === 'tired') say = pick(k, P, L.museTired, slots);
          else if ((mood0 === 'sad' || mood0 === 'annoyed') && c.worry && Math.random() < 0.45) { slots.worry = c.worry; say = pick(k, P, SELF.museWorry, slots); }
          else if (mood0 === 'sad' || mood0 === 'annoyed') say = pick(k, P, L.museLow, slots);
          else if (mood0 === 'happy' && Math.random() < 0.3) say = pick(k, P, L.museHappy, slots);
          else {
            // what is on their mind: what they want, what they hold to, something they know (the sharp and curious more), or a topic of theirs
            const q = Math.random(), knowing = 0.08 + 0.3 * d.smart * (0.4 + d.curious);
            if (q < 0.1 && c.goal) { slots.goal = c.goal; say = pick(k, P, SELF.museGoal, slots); }
            else if (q < 0.18 && c.values.length) say = pick(k, P, { any: VALUE_SAY[c.values[Math.floor(Math.random() * c.values.length)]] }, slots);
            else if (q < 0.18 + knowing) say = knowLine(k, P);
            else { const t = P.likes[Math.floor(Math.random() * P.likes.length)]; say = topicLine(k, P, t); meta.topic = t; }
          }
        }
      } else if (to === 'you' || to == null) {
        const U = m.user, last = lines.filter((l) => l.p === 'you' && (l.to === k || (l.group && l.group.includes(k)))).slice(-1)[0], mine = lines.filter((l) => l.p === k && l.to === 'you').slice(-1)[0];
        const fresh = last && (!mine || lines.indexOf(last) > lines.indexOf(mine));
        let pe;
        if (!fresh) {
          // they start: hello the first time, then something about what they know you like, or what they like
          if (!U.said) { say = pick(k, P, L.hello, slots); if (c.job && d.talk > 0.5 && Math.random() < 0.35) say += ' ' + pick(k, P, SELF.introJob, jobSlots(c, slots)); }
          else if ((pe = pastEp(m, P)) && pe !== 'gone' && U.rec !== pe.t0 && Math.random() < 0.4 + d.smart * 0.4 && (say = recall(k, P, c, m, pe, slots))) U.rec = pe.t0;
          else if (U.feel === 'low' && P.knack === 'people') { U.feel = ''; say = pick(k, P, IQ.better, slots); }
          // something you told them about yourself, asked after (the warmer and sharper more often)
          else if (U.facts && Object.keys(U.facts).length && Math.random() < 0.25 + d.warm * 0.15 + (P.smarts - 3) * 0.05) {
            const F = U.facts, ks = Object.keys(F).filter((x) => x !== 'job' || F.job !== 'retired'), f = ks[Math.floor(Math.random() * ks.length)];
            Object.assign(slots, { job: F.job, a_job: F.job ? aOf(F.job) : '', from: F.from, pet: F.pet, partner: F.partner });
            say = f ? pick(k, P, YOURS[{ job: 'askJob', from: 'askFrom', pet: 'askPet', kids: 'askKids', partner: 'askPartner' }[f]], slots) : pick(k, P, L.hiUser, slots);
            if (f) meta = { asked: f };
          }
          // something one of the others here knows about you that they do not: heard from them, said, and kept
          else if (Math.random() < 0.3 && (say = gossip(k, P, m, slots))) { /* said */ }
          else if (U.likes.length && Math.random() < 0.5) { slots.topic = TOPICS[U.likes[Math.floor(Math.random() * U.likes.length)]].n; say = pick(k, P, L.yourLike, slots); }
          else { const t = P.likes[Math.floor(Math.random() * P.likes.length)], q = Math.random() < 0.3 + d.curious * 0.4; say = pick(k, P, L.hiUser, slots) + ' ' + topicLine(k, P, t, q); meta = { topic: t, q }; }
        } else say = answer(k, c, P, m, (opt && opt.text) || last.said, mine, slots, (x) => { meta = x; }, last.group ? { group: last.group, said: lines.filter((l) => l.round === last.id && l.p !== k) } : null);
        U.said = (U.said || 0) + (fresh ? 1 : 0);
        note(m, fresh ? last.said : null, meta);   // this chat's memory: what came up, never your words
      } else {
        // among themselves: answer what they just said to me, else start on something
        const who = o.nameOf(to), R = relOf(m, who, c), tc = o.card(to);
        slots.name = who; look = 'them';
        const last = lines.filter((l) => (l.p === to && l.to === k) || (l.p === k && l.to === to)).slice(-1)[0];
        const recentTalk = last && Date.now() / 1000 - (last.t || 0) < 90;
        R.talks++; R.like = cl(R.like + 0.03 + d.warm * 0.02 - d.edge * 0.01, -1, 1);
        if (recentTalk && last.p === to && last.meta && last.meta.topic) {
          const t = last.meta.topic, mineToo = P.likes.includes(t); slots.topic = TOPICS[t].n;
          if (!R.likes.includes(t)) R.likes.push(t);   // learnt: they are into it
          if (mineToo) R.like = cl(R.like + 0.05, -1, 1);
          if (last.meta.q) say = mineToo ? topicLine(k, P, t) : pick(k, P, L.dodge, slots);
          else say = mineToo ? pick(k, P, L.share, slots) : pick(k, P, L.agree, slots);
          if (d.talk > 0.45 && Math.random() < d.talk * 0.7) {
            const q = Math.random() < 0.35 + d.curious * 0.4, t2 = mineToo || Math.random() < 0.5 ? t : P.likes[Math.floor(Math.random() * P.likes.length)];
            say += ' ' + topicLine(k, P, t2, q); meta = { topic: t2, q };
          }
        } else if (!R.met && !R.talks0) { R.talks0 = 1; R.met = 1; say = pick(k, P, L.hello, slots); }
        else if (R.likes.length && Math.random() < 0.35) {
          const t = R.likes[Math.floor(Math.random() * R.likes.length)]; slots.topic = TOPICS[t].n; say = pick(k, P, L.theirTopic, slots); meta = { topic: t, q: true };
        } else {
          const t = P.likes[Math.floor(Math.random() * P.likes.length)], q = Math.random() < 0.25 + d.curious * 0.45;
          if (Math.random() < 0.06 + d.smart * d.curious * 0.25) say = knowLine(k, P);
          else if (t === 'work' && c.job && Math.random() < 0.5) { say = pick(k, P, SELF.introJob, jobSlots(c, slots)) + ' ' + topicLine(k, P, t, q); meta = { topic: t, q }; }
          else { say = topicLine(k, P, t, q); meta = { topic: t, q }; }
          if (Math.random() < 0.3) say = `${who}, ` + say.replace(/^(.)/, (x) => (/^I\b/.test(say) ? x : x.toLowerCase()));
        }
        if (tc && R.like > 0.6 && Math.random() < 0.12) say += ' ' + pick(k, P, L.likeYou, slots);
        if (d.talk < 0.3 && say.split(/(?<=[.!?]) /).length > 2) say = say.split(/(?<=[.!?]) /).slice(0, 2).join(' ');
      }
      // the app's own lines between these two (o.lines(key, other, kind): kinds talk, touched, arrived, approached, muse,
      // reply), taken most of the time when it has some ({name} is the other's, {me} their own); a reply keeps its answer
      // and may add one
      if (o.lines) {
        const other = ev ? (ev.by != null ? ev.by : null) : to === 'you' ? (o.you ? o.you() : null) : to;
        const kind = ev ? ev.kind : to === 'you' || to == null ? 'reply' : 'talk', own = other != null || kind === 'muse' ? o.lines(k, other, kind) : null;
        if (own && own.length) {
          const rc = ownRecent.get(k) || [], fresh = own.filter((x) => !rc.includes(x)), x = (fresh.length ? fresh : own)[Math.floor(Math.random() * (fresh.length || own.length))];
          const t = String(x).replace(/\{name\}/g, other != null ? o.nameOf(other) : '').replace(/\{me\}/g, c.name);
          if (kind === 'reply' ? Math.random() < 0.35 : Math.random() < 0.7) {
            say = kind === 'reply' && say ? say + ' ' + t : t; rc.push(x); if (rc.length > Math.min(8, own.length - 1)) rc.shift(); ownRecent.set(k, rc);
          }
        }
      }
      save();
      const mood = moodName(c, m, P);
      say = voice(say || '...', P, mood, { ex });
      return { say: say.slice(0, 300), mood, face: face(mood), look: d.shy > 0.7 && look === 'you' && Math.random() < 0.4 ? 'away' : look, meta, act: act || undefined };
    }
    // the user said something: answer from what was said (never repeating their words), and learn from it
    // what another of them here knows of you and k does not (only the kept, listed words), said as heard from them
    function gossip(k, P, m, slots) {
      const U = m.user, F = U.facts || (U.facts = {});
      for (const q of (o.people ? o.people() : []).filter((x) => x !== k && o.card(x)).sort(() => Math.random() - 0.5)) {
        const om = mem[idOf(o.card(q))], G = om && om.user && om.user.facts; if (!G) continue;
        const f = ['job', 'from', 'pet'].find((x) => G[x] && !F[x] && (x !== 'job' || G.job !== 'retired')); if (!f) continue;
        F[f] = G[f]; Object.assign(slots, { name: o.nameOf(q), a_job: f === 'job' ? aOf(G.job) : '', from: G.from, pet: G.pet });
        return pick(k, P, f === 'job' ? ABOUT.gossip : f === 'from' ? ABOUT.gossipFrom : ABOUT.gossipPet, slots);
      }
      return '';
    }
    // asked the same kind of thing as last time: the sharp say so (kinds only are kept, never your words)
    function answer(k, c, P, m, text, mine, slots, setMeta, grp) {
      const t = String(text).toLowerCase(), U = m.user, kind = (ASK_KIND.find(([, w]) => w.test(t)) || [])[0] || '';
      let s = answer0(k, c, P, m, text, mine, slots, setMeta, grp);
      if (kind && kind === U.lastAsk && P.smarts >= 3 && s && Math.random() < 0.8) { const pre = pick(k, P, NOWL.again, slots); s = pre + (/[.!?]\s*$/.test(pre) ? s : s.replace(/^(.)/, (x) => (/^I\b/.test(s) ? x : x.toLowerCase()))); }
      U.lastAsk = kind;
      return s;
    }
    function answer0(k, c, P, m, text, mine, slots, setMeta, grp) {
      let t = plainWords(text); const raw = String(text), U = m.user, d = P.d;
      // who else is here, by name (theirs as the scene has them): someone named, or he/she for the last one talked of
      const others = (o.people ? o.people() : []).filter((q) => q !== k && o.card(q)), named0 = others.find((q) => new RegExp('\\b' + String(o.nameOf(q)).toLowerCase().replace(/[^a-z' -]/g, '') + '\\b').test(t));
      let who = named0 || null;
      if (!who && U.lastWho && /\b(he|she|him|her|they|them)\b/.test(t) && !/\b(you|your)\b.*\b(he|she)\b/.test(t)) who = others.find((q) => o.nameOf(q) === U.lastWho) || null;
      if (who) U.lastWho = o.nameOf(who);
      // asked as a group: who likes something, whether they know each other, names all round, and what the others said
      if (grp) {
        const others = grp.group.filter((q) => q !== k && o.card(q)).map((q) => o.nameOf(q));
        const tp = topicIn(t);
        if (/\b(who|anyone|anybody|any of you|which of you)\b.*\b(like|likes|love|loves|into|enjoy|enjoys|fan)\b/.test(t) && tp) {
          slots.topic = TOPICS[tp].n;
          if (P.likes.includes(tp)) { setMeta({ topic: tp, q: false }); return pick(k, P, L.meToo, slots); }
          return pick(k, P, grp.said.some((l) => l.meta && l.meta.topic === tp) ? L.notMe : L.nobody, slots);
        }
        if (/know each other|met (each other|before)|you (all|guys) friends|how do you (all )?know/.test(t)) {
          const known = others.filter((n) => m.rel[n] && m.rel[n].met + m.rel[n].talks > 0), list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]);
          slots.names = list(known);
          return pick(k, P, !known.length ? L.knowNone : known.length === others.length ? L.knowAll : L.knowSome, slots);
        }
        if (/your names|introduce yourselves|who are you all|who('s| is) (everyone|everybody)|who are you (guys|people)/.test(t)) return pick(k, P, L.me, slots);
        if (/what do you (all |guys |each )?(like|enjoy|do for fun)|what are you (all )?into|hobbies/.test(t)) {
          const same = grp.said.find((l) => l.meta && l.meta.topic && P.likes.includes(l.meta.topic));
          if (same) {
            const rest = P.likes.filter((x) => x !== same.meta.topic);
            Object.assign(slots, { name: same.who, topic: TOPICS[same.meta.topic].n });
            setMeta({ topic: same.meta.topic, q: false });
            return pick(k, P, L.sameAs, slots) + (rest.length && d.talk > 0.4 ? ` And ${TOPICS[rest[0]].n}.` : '');
          }
          const fresh = P.likes.filter((x) => !grp.said.some((l) => l.meta && l.meta.topic === x));
          const a = fresh[0] || P.likes[0], b = P.likes.find((x) => x !== a);
          Object.assign(slots, { topic: TOPICS[a].n, topic2: TOPICS[b].n }); setMeta({ topic: a, q: false });
          return pick(k, P, L.likeWhat, slots);
        }
      }
      const prevQ = mine && mine.meta && mine.meta.q, prevT = mine && mine.meta && mine.meta.topic, prevAsk = mine && mine.meta && mine.meta.asked;
      // it, that, them: what they last talked of (so do you like it? reads as the thing itself)
      if (prevT && !topicIn(t) && /\b(it|that|those|them)\b/.test(t) && !who) t += ' (' + TOPICS[prevT].n + ')';
      if (prevT || (U.topics && U.topics.length)) { const ts = U.topics || (U.topics = []); if (prevT && ts[ts.length - 1] !== prevT) { ts.push(prevT); if (ts.length > 6) ts.shift(); } }
      const named = raw.match(/\b(?:my name is|my name's|call me|i'm|i am|it's)\s+([a-z]{2,16})\b/i), cased = named && (/name|call/i.test(named[0]) || /^[A-Z]/.test(named[1]));
      const topic = topicIn(t);
      if (named && cased && !/^(Tired|Fine|Good|Okay|Ok|Sorry|Here|Back|Not|So|Just|Sure)$/.test(named[1])) { U.name = cap(named[1].toLowerCase()); slots.user = U.name; push(c, m, P, 0.08, 0.05); return pick(k, P, L.userName, slots); }
      if (/\b(stupid|idiot|ugly|shut up|boring|hate you|dumb|annoying|loser|jerk)\b/.test(t)) { U.like = cl((U.like || 0) - 0.25, -1, 1); push(c, m, P, -0.3, 0.3); return pick(k, P, L.rude, slots); }
      if (/\byou('re| are) (so )?(great|lovely|nice|funny|smart|kind|cool|awesome|sweet|amazing|clever)\b|\bi like you\b|\bnice (hair|shirt|smile|outfit)\b/.test(t)) { U.like = cl((U.like || 0) + 0.15, -1, 1); push(c, m, P, 0.25, 0.15); return pick(k, P, L.nice, slots); }
      // something about you: kept (the listed words only), answered, and asked after another time
      const F = U.facts || (U.facts = {});
      const tj = t.match(RX_JOB), tf = t.match(RX_FROM), tp = t.match(RX_PET), tk = RX_KIDS.test(t), tpa = t.match(RX_PARTNER);
      if (/\bi('m| am) retired\b/.test(t)) { F.job = 'retired'; push(c, m, P, 0.05, 0.03); return pick(k, P, YOURS.jobRetired, slots); }
      if (tj || tf || tp || tk || tpa) {
        const said = [];
        if (tj) { F.job = tj[1].replace(/\s+/g, ' '); slots.job = F.job; slots.a_job = aOf(F.job); said.push(pick(k, P, YOURS.job, slots)); }
        if (tf) { F.from = tf[1].replace(/\s+/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()); slots.from = F.from; said.push(pick(k, P, YOURS.from, slots)); }
        if (tp && /\b(have|got|own)\b/.test(t)) { F.pet = tp[1].replace(/^puppy$/, 'dog').replace(/^kitten$/, 'cat'); slots.pet = F.pet; said.push(pick(k, P, YOURS.pet, slots)); }
        if (tk) { F.kids = 1; said.push(pick(k, P, YOURS.kids, slots)); }
        if (tpa) { F.partner = tpa[1] || 'partner'; slots.partner = F.partner; said.push(pick(k, P, YOURS.partner, slots)); }
        if (said.length) { push(c, m, P, 0.06 * d.warm, 0.04); return said.slice(0, 2).join(' '); }
      }
      // what they remember of you: the simple sometimes lose it
      const lost = P.smarts <= 1 && Math.random() < 0.35;
      if (/what do i do|what('s| is) my (job|work)|remember (what i do|my job)|where do i work/.test(t)) { slots.job = F.job; slots.a_job = F.job ? aOf(F.job) : ''; return F.job ? pick(k, P, lost ? YOURS.forgot : F.job === 'retired' ? { any: ['You\'re retired, you said.'] } : YOURS.knowJob, slots) : pick(k, P, YOURS.knowNot, slots); }
      if (/where am i from|where do i (live|come from)|remember where i('m| am) from/.test(t)) { slots.from = F.from; return F.from ? pick(k, P, lost ? YOURS.forgot : YOURS.knowFrom, slots) : pick(k, P, YOURS.knowNot, slots); }
      if (/what (pet|animal) do i have|remember my (pet|dog|cat)|do i have a (pet|dog|cat)/.test(t)) { slots.pet = F.pet; return F.pet ? pick(k, P, lost ? YOURS.forgot : YOURS.knowPet, slots) : pick(k, P, YOURS.knowNot, slots); }
      // their own life (the same every time): a partner, kids, a pet, brothers and sisters, living alone, their work
      const Lf = lifeOf(c);
      Object.assign(slots, { years: COUNT[Lf.years] || String(Lf.years), kids: KIDW[Lf.kids], pet: Lf.pet, sibs: SIBW[Lf.sibs], who: Lf.partner ? 'my other half' : 'the kids' });
      if (/are you (married|single|engaged|seeing anyone|taken|with someone|in a relationship)|do you have a (wife|husband|partner|girlfriend|boyfriend|spouse)|got a (girlfriend|boyfriend|partner)/.test(t)) return pick(k, P, Lf.partner ? FAM.partnerYes : FAM.partnerNo, slots);
      if (/do you have (any )?(kids|children|a son|a daughter)|got (any )?kids|^(any|you have|have you got) (kids|children)\b|are you a (mom|mum|dad|mother|father|parent)/.test(t)) return pick(k, P, Lf.kids ? FAM.kidsYes : FAM.kidsNo, slots);
      if (/do you have (a |any )?(pets?|dog|cat|animals)|got (a |any )?(pets?|dog|cat)/.test(t)) return pick(k, P, Lf.pet ? FAM.petYes : FAM.petNo, slots);
      if (/(brothers?|sisters?|siblings)\b.*\?|do you have (any )?(brothers|sisters|siblings)|only child/.test(t)) return pick(k, P, Lf.sibs ? FAM.sibsYes : FAM.sibsNo, slots);
      if (/do you live (alone|on your own|by yourself)|who do you live with/.test(t)) return pick(k, P, !Lf.partner && !Lf.kids ? FAM.alone : FAM.notAlone, slots);
      if (/do you (like|enjoy|love|hate) (your|ur) (job|work)|how('s| is) (your )?work|is your job (good|hard|fun)/.test(t)) { if (!c.job) return pick(k, P, FAM.noJob, slots); const md = moodName(c, m, P); return pick(k, P, /sad|annoyed/.test(md) ? { any: FAM.likeJob.edge } : FAM.likeJob, slots); }
      // an opinion on a thing: theirs if it is one they like, not much otherwise
      const op = /what do you think (of|about)|how do you feel about|your (opinion|view|take) on|thoughts on|are you a fan of/.test(t) && topicIn(t);
      if (op) { slots.topic = TOPICS[op].n; setMeta({ topic: op, q: false }); return pick(k, P, P.likes.includes(op) ? OPINION.love : OPINION.meh, slots) + (P.likes.includes(op) && d.talk > 0.5 ? ' ' + topicLine(k, P, op, false) : ''); }
      // how they feel: everyone answers it in their way; those good with people read it, and ask after it later
      if (/\bi('m| am| feel)( so| really| a bit| kind of| pretty)? (tired|exhausted|sad|down|stressed|worried|lonely|upset|awful|terrible|miserable|anxious|scared)\b|\b(bad|rough|long|awful) day\b/.test(t)) {
        U.feel = 'low'; push(c, m, P, -0.04 * d.warm, 0.05);
        return pick(k, P, P.knack === 'people' && P.smarts >= 3 && Math.random() < 0.6 ? IQ.feelRead : IQ.feelLow, slots);
      }
      if (/\bi('m| am| feel)( so| really| pretty)? (happy|great|excited|fantastic|wonderful|proud)\b|\b(great|good|best) day\b/.test(t)) { U.feel = 'up'; push(c, m, P, 0.12 * d.warm, 0.08); return pick(k, P, IQ.feelUp, slots); }
      // a sum, asked: worked out as sharply as they are
      const mt = raw.match(SUM);
      if (mt && (/\?|\bwhat|how much|work out|calculate|equals?|=/.test(t) || t.trim().length < 18)) return sum(k, P, mt);
      // ---- someone else here: where they are, what they are doing, what they think of them, whether they know them
      if (who || /\bwhere('s| is| are)\b/.test(t) && /\b(he|she)\b/.test(t)) {
        const q = who, nm = q ? o.nameOf(q) : '', qc = q ? o.card(q) : null, R = m.rel[nm], she = qc && qc.sex === 'woman';
        Object.assign(slots, { name: nm, them: she ? 'her' : qc ? 'him' : 'them', they: she ? 'she' : qc ? 'he' : 'they', they_are: she ? 'she\'s' : qc ? 'he\'s' : 'they\'re', a_job: qc && qc.job ? aOf(qc.job) : '' });
        if (q && /where('s| is)|where did .* go|seen\b/.test(t)) { const Nq = (o.now && o.now(q)) || {}; slots.doing = [Nq.doing, Nq.where].filter(Boolean).join(', '); return pick(k, P, slots.doing ? ABOUT.where : ABOUT.whereNot, slots); }
        if (q && /what('s| is) .* (doing|up to)|what('re| are) (they|he|she) doing|is .* busy/.test(t)) { const Nq = (o.now && o.now(q)) || {}; slots.doing = Nq.doing || ''; return pick(k, P, slots.doing ? ABOUT.where : ABOUT.whereNot, slots); }
        if (q && /what do you (think|make) of|how do you feel about|do you (like|love|hate|trust) |is .* (nice|okay|alright|good)|opinion of|get on with/.test(t)) {
          if (!R || R.met + R.talks === 0) return pick(k, P, ABOUT.stranger, slots);
          const f = (R.like || 0) + (c.fond || 0) * 0.5; push(c, m, P, f * 0.05, 0.02);
          return pick(k, P, f > 0.25 ? ABOUT.fond : f < -0.15 ? ABOUT.cool : ABOUT.okay, slots);
        }
        if (q && /do you know|have you met|you (two|guys) friends|friends with/.test(t)) return pick(k, P, R && R.met + R.talks > 0 ? ABOUT.knows : ABOUT.stranger, slots);
        if (q && /tell me about|who is|who's|what('s| is) .* like|what does .* do/.test(t)) return pick(k, P, qc && qc.job ? ABOUT.tell : ABOUT.tellNo, slots);
      }
      // ---- the present: what they are doing, the time, how they feel in body, a suggestion (o.now(k), the page's)
      const N = (o.now && o.now(k)) || {}, needs = N.needs || null;
      if (/what are you (doing|up to)|what('re| are) you doing|(busy|doing anything)\??$|where are you (going|headed|heading|off to)|where you (going|headed|off to)/.test(t)) { slots.doing = N.doing || ''; return pick(k, P, N.doing && N.doing !== 'asleep' ? NOWL.doing : NOWL.idle, slots); }
      if (/what time is it|what('s| is) the time|got the time|is it (late|early)|what time do you (make|have) it/.test(t)) {
        if (N.hour == null || !isFinite(N.hour)) return pick(k, P, NOWL.timeNone, slots);
        Object.assign(slots, timeWords(N.hour));
        let s = pick(k, P, NOWL.time[tierOf(P)], slots);
        if (N.hour >= 23 || N.hour < 4) s += ' ' + pick(k, P, NOWL.late, slots); else if (N.hour >= 4 && N.hour < 7) s += ' ' + pick(k, P, NOWL.early, slots);
        return s;
      }
      const asked = t.match(/\b(?:(?:are|r) )?(?:you|u) (?:\w+ )?(hungry|starving|peckish|thirsty|tired|sleepy|exhausted|bored|lonely|dirty|sweaty)\b/);
      if (asked) {
        const need = { hungry: 'hunger', starving: 'hunger', peckish: 'hunger', thirsty: 'thirst', tired: 'energy', sleepy: 'energy', exhausted: 'energy', bored: 'fun', lonely: 'company', dirty: 'clean', sweaty: 'clean' }[asked[1]];
        const v = needs && isFinite(needs[need]) ? needs[need] : null;
        if (v == null) return pick(k, P, need === 'energy' && moodName(c, m, P) === 'tired' ? { any: NOWL.need.energy.some } : NOWL.needNone, slots);
        return pick(k, P, { any: NOWL.need[need][v > 0.7 ? 'yes' : v > 0.45 ? 'some' : 'no'] }, slots);
      }
      if (/\b(do you want to|want to|wanna|shall we|should we|let'?s|how about we|fancy|would you like to|you up for|care to)\b/.test(t)) {
        const wg = WANT_GO.find(([w]) => w.test(t)), nd = wg && wg[1], act = wg && wg[2];
        if (nd) {
          // the page cannot have them do it now (at work, the place shut): they say so
          if (act && o.canGo && !o.canGo(k, act)) return pick(k, P, TRACK.cant, slots);
          // yes or no by how much they need it, how they feel about you, their mood and how game they are
          const v = needs && isFinite(needs[nd]) ? needs[nd] : 0.4, mood = moodName(c, m, P);
          const go = v + 0.25 * (U.like || 0) + (/happy|playful/.test(mood) ? 0.12 : /annoyed|sad/.test(mood) ? -0.15 : 0) + (d.bold || 0) * 0.1 + (mood === 'tired' && nd === 'energy' ? 0.2 : 0);
          push(c, m, P, go > 0.55 ? 0.06 : 0, 0.04);
          if (go > 0.55) { if (act) setMeta({ go: act }); return pick(k, P, NOWL.yes, slots) + (v > 0.65 && Math.random() < 0.6 ? ' ' + cap(NOWL.yesWhy[nd]) + '.' : ''); }
          if (go > 0.38) return pick(k, P, NOWL.maybe, slots);
          return pick(k, P, NOWL.no, slots) + (v < 0.3 && Math.random() < 0.7 ? ' ' + cap(NOWL.noWhy[nd]) + '.' : '');
        }
      }
      // ---- following the conversation: why, tell me more, and what about you (on what they last talked about)
      if (/^(why|how come|why's that|why is that|what makes you say that)\??$/.test(t.trim())) {
        if (prevT) { slots.topic = TOPICS[prevT].n; setMeta({ topic: prevT, q: false }); return pick(k, P, NOWL.why, slots); }
        return pick(k, P, NOWL.whyNone, slots);
      }
      if (prevT && /^(tell me more|go on|really\??|like what\??|such as\??|and\??|oh yeah\??|interesting\.?|how so\??)$/.test(t.trim())) { setMeta({ topic: prevT, q: false }); return topicLine(k, P, prevT, false); }
      if (/^(what about you|and you|you\?|how about you|what do you think|and yourself|what about yourself)\??$/.test(t.trim())) {
        const tp = prevT || P.likes[0]; slots.topic = TOPICS[tp].n; setMeta({ topic: tp, q: false });
        return P.likes.includes(tp) ? pick(k, P, NOWL.aboutMe, slots) + ' ' + topicLine(k, P, tp, false) : pick(k, P, NOWL.notMine, slots);
      }
      // past chats: the last one they remember
      if (/what did we (talk|chat) about|remember (what we|our (chat|talk|conversation)|last time|talking)|last time we (talked|spoke)|what were we talking about/.test(t)) return summary(k, P, m, slots);
      // names: the simple sometimes forget yours
      if (/what('s| is) my name|do you (remember|know) me|who am i/.test(t)) return U.name ? pick(k, P, P.smarts <= 1 && Math.random() < 0.4 ? IQ.forgotName : L.remember, slots) : pick(k, P, L.forgot, slots);
      if (/what('s| is) your name|who are you/.test(t)) return pick(k, P, L.me, slots);
      // what they make of themselves, what they know, and advice
      if (/are you (smart|clever|intelligent|bright|a genius)|how (smart|clever) are you|what are you good at|what('s| is) your (talent|strength|superpower)/.test(t)) return pick(k, P, IQ.self[tierOf(P)], slots) + ' I\'m ' + KNACK_ME[P.knack] + '.';
      if (/tell me something|teach me|fun fact|did you know|something interesting|know any(thing)? (interesting|good)|any facts/.test(t)) return knowLine(k, P);
      if (/\badvice\b|what should i do|help me decide|what would you do/.test(t)) {
        let s = pick(k, P, { any: IQ.advice[tierOf(P)] }, slots);
        if (tierOf(P) !== 'lo' && !/book|numbers/.test(P.knack) && Math.random() < 0.4) s += ' ' + pick(k, P, { any: KNOWS[P.knack] }, slots);
        return s;
      }
      if (/how are (you|things|y'all)|how('s| is) (it going|everyone|everybody)|you (ok|okay|alright)|how do you (all )?feel|how you doing|how are we/.test(t)) {
        const mood = moodName(c, m, P); return pick(k, P, mood === 'tired' ? L.howTired : /sad|annoyed/.test(mood) ? L.howBad : L.howGood, slots);
      }
      if (/^(hi|hello|hey|yo|howdy|hiya|good (morning|evening|afternoon))\b/.test(t) && t.length < 40) return pick(k, P, U.said > 1 ? L.hiUser : L.hi, slots);
      if (/\b(bye|goodbye|see you|good ?night|later)\b/.test(t)) return pick(k, P, L.bye, slots);
      if (/\b(thanks|thank you|cheers)\b/.test(t)) return pick(k, P, L.thanks, slots);
      if (/\b(joke|make me laugh|something funny)\b/.test(t)) { push(c, m, P, 0.1, 0.1); return pick(k, P, L.joke, slots); }
      if (/where (are we|is this|am i)/.test(t)) { slots.where = String(o.scene ? o.scene(k, 'you', null) : '').split(/[.,]/)[0].replace(/^an? /i, (x) => x.toLowerCase()) || 'here'; return pick(k, P, L.where, slots); }
      if (/what (do|can) you see|what('s| is) (around|here|going on)|look around/.test(t)) {
        const s = (o.sights ? o.sights(k) : []).map((g) => (typeof g === 'object' ? g.what : g)); slots.sights = s.length > 1 ? s.slice(0, -1).join(', ') + ' and ' + s[s.length - 1] : s[0];
        return pick(k, P, s.length ? L.sees : L.seesNone, slots);
      }
      if (/what do you (like|enjoy|do for fun)|what are you into|hobbies|what do you love/.test(t)) {
        slots.topic = TOPICS[P.likes[0]].n; slots.topic2 = TOPICS[P.likes[1]].n; setMeta({ topic: P.likes[0], q: false }); return pick(k, P, L.likeWhat, slots);
      }
      // who they are: their work, where they are from, what they want, what worries them, what matters to them
      if (/what do you do\b(?! for fun)|what('s| is) your job|what do you work|where do you work|for a living|what line of work/.test(t)) return c.job ? pick(k, P, SELF.job, jobSlots(c, slots)) : pick(k, P, SELF.noJob, slots);
      if (/where are you from|where('d| did) you grow up|where('s| is) home|where do you live/.test(t)) { slots.from = c.from; return pick(k, P, c.from ? SELF.from : SELF.noFrom, slots); }
      if (/what do you want|your (dream|dreams|plans?|goals?)\b|what are you (hoping|saving|working) (for|toward)|what do you hope|bucket list/.test(t)) { slots.goal = c.goal; return pick(k, P, c.goal ? SELF.goal : SELF.noGoal, slots); }
      if (/what (worries|scares|frightens|bothers) you|are you (afraid|scared|worried)|what are you (afraid|scared|worried)|keeps you up/.test(t)) { slots.worry = c.worry; push(c, m, P, -0.05, 0.05); return pick(k, P, c.worry ? SELF.worry : SELF.noWorry, slots); }
      if (/what (matters|is important) to you|what do you (care about|value|believe in)|what('s| is) important to you/.test(t)) {
        const v = c.values[0] || 'kindness'; slots.value = v; return pick(k, P, SELF.values, slots) + ' ' + pick(k, P, { any: VALUE_SAY[v] }, slots);
      }
      if (/what do i like/.test(t)) { if (!U.likes.length) return pick(k, P, { any: ['You haven\'t told me yet.', 'I don\'t know yet. What do you like?'] }, slots); slots.topic = TOPICS[U.likes[U.likes.length - 1]].n; return pick(k, P, L.yourLike, slots); }
      const likes = /\bi (really |kind of |do )?(like|love|enjoy|am into|'m into)\b/.test(t) || /\bi'm (a|really) .* (fan|person)\b/.test(t);
      if (topic) {
        slots.topic = TOPICS[topic].n;
        if (likes && !U.likes.includes(topic)) { U.likes.push(topic); if (U.likes.length > 2 + P.smarts) U.likes.shift(); }   // the sharper keep more in mind
        const mineToo = P.likes.includes(topic), asked = /\?\s*$/.test(t) || /^(do|did|have|are|is|what|which|who|how|would|could|can)\b/.test(t);
        if (mineToo) { push(c, m, P, 0.1, 0.1); setMeta({ topic, q: false }); return (likes ? pick(k, P, L.share, slots) + ' ' : '') + topicLine(k, P, topic, false); }
        if (asked) return pick(k, P, L.dodge, slots);
        setMeta({ topic, q: false }); return pick(k, P, likes ? L.noted : L.agree, slots);
      }
      if (prevQ && /^(yes|yeah|yep|sure|of course|definitely|absolutely)\b/.test(t)) { if (prevT && !U.likes.includes(prevT)) U.likes.push(prevT); return pick(k, P, L.yes, slots); }
      if (prevQ && /^(no|nope|nah|not really)\b/.test(t)) return pick(k, P, L.no, slots);
      // their own question (asking after you), answered: good or bad, by the words
      if (prevAsk && !/\?\s*$/.test(t)) {
        if (/\b(bad|awful|terrible|rough|hard|not (great|good|well)|sick|broke|tough|horrible|stress\w*|sad|died|lost)\b/.test(t)) { push(c, m, P, -0.03, 0.03); return pick(k, P, TRACK.bad, slots); }
        if (/\b(good|great|fine|well|busy|okay|ok|alright|lovely|fantastic|amazing|better|not bad)\b/.test(t)) return pick(k, P, TRACK.good, slots);
      }
      if (/\?\s*$/.test(t)) { setMeta({ stuck: true }); return pick(k, P, tierOf(P) === 'hi' && Math.random() < 0.7 ? IQ.unsure.hi : L.unknownQ, slots); }
      // they asked you about a thing and did not catch your answer: taken as an answer about that thing
      if (prevQ && prevT) { slots.topic = TOPICS[prevT].n; setMeta({ topic: prevT, q: false, stuck: true }); return pick(k, P, TRACK.heard, slots); }
      // something else: a word back, and now and then back to an earlier thing, or on to one of their own
      let s = pick(k, P, L.told, slots);
      const back = (U.topics || []).filter((x) => x !== prevT);
      if (back.length && P.smarts >= 3 && Math.random() < 0.3) { const tp = back[back.length - 1]; slots.topic = TOPICS[tp].n; setMeta({ topic: tp, q: false, stuck: true }); return s + ' ' + pick(k, P, TRACK.back, slots) + ' ' + topicLine(k, P, tp, false); }
      setMeta({ stuck: true });
      if (d.talk > 0.5 && Math.random() < 0.5) { const tp = P.likes[Math.floor(Math.random() * P.likes.length)], q = Math.random() < d.curious; s += ' ' + topicLine(k, P, tp, q); setMeta({ topic: tp, q, stuck: true }); }
      return s;
    }
    // a group is spoken to: who answers, in order. Someone named answers alone (several named, those); a question to
    // all, or a who-likes, gets everyone (the keen first, up to 6, those who like it first); something said to them
    // gets a few, the talkative more likely; always at least one
    function plan(keys, text) {
      const t = String(text).toLowerCase(), cards = keys.map((k) => [k, o.card(k)]).filter(([, c]) => c);
      const named = cards.filter(([, c]) => { const n = c.name.toLowerCase(), f = n.split(' ')[0]; return new RegExp('\\b(' + [n, f].map((x) => x.replace(/[^a-z0-9 ]/g, '')).join('|') + ')\\b').test(t.replace(/[^a-z0-9 ]/g, ' ')); });
      if (named.length && named.length < cards.length) return named.map(([k]) => k);
      const keen = (c) => { const d = profile(c).d; return d.talk * 0.6 + d.energy * 0.25 + d.bold * 0.2 - d.shy * 0.3 + d.smart * 0.12 + Math.random() * 0.45; };
      let order = cards.map(([k, c]) => ({ k, c, w: keen(c) })).sort((a, b) => b.w - a.w);
      const tp = topicIn(t);
      // who likes it: those who do (or, if nobody, one to say so)
      if (/\b(who|anyone|anybody|any of you|which of you)\b.*\b(like|likes|love|loves|into|enjoy|enjoys|fan)\b/.test(t) && tp) {
        const yes = order.filter((x) => profile(x.c).likes.includes(tp)); return (yes.length ? yes.slice(0, 6) : order.slice(0, 1)).map((x) => x.k);
      }
      const all = /\?\s*$|\b(everyone|everybody|all of you|you all|y'all|guys|folks|each of you|who|anyone|anybody|introduce|tell me)\b|^(hi|hello|hey|good (morning|evening|afternoon)|my name)\b/.test(t);
      let who = all ? order.slice(0, 6) : order.filter((x) => Math.random() < 0.25 + profile(x.c).d.talk * 0.6).slice(0, 4);
      if (!who.length) who = order.slice(0, 1);
      return who.map((x) => x.k);
    }
    // two in a group who just found they like the same thing: one says so to the other (or null)
    function aside(lines, round) {
      const said = lines.filter((l) => l.round === round && l.meta && l.meta.topic);
      for (let i = 1; i < said.length; i++) for (let j = 0; j < i; j++) if (said[i].meta.topic === said[j].meta.topic && said[i].p !== said[j].p) return { k: said[j].p, by: said[i].p, topic: said[i].meta.topic };
      return null;
    }
    function reset() { mem = {}; store(SAVE, '{}'); recent.clear(); }
    function flush() { if (saveAt) { clearTimeout(save.t); saveAt = 0; save(); } }
    // what they have learned, in a few words (for a panel)
    function knows(k) {
      const c = o.card(k); if (!c) return '';
      const P = profile(c), m = memOf(c), bits = [];
      bits.push('into ' + P.likes.map((t) => TOPICS[t].n).join(', '));
      const rel = Object.entries(m.rel).filter(([, r]) => r.met + r.talks > 0);
      const fond = rel.filter(([, r]) => r.like > 0.25).map(([n]) => n), cool = rel.filter(([, r]) => r.like < -0.25).map(([n]) => n);
      if (fond.length) bits.push('fond of ' + fond.slice(0, 4).join(', ')); if (cool.length) bits.push('wary of ' + cool.slice(0, 4).join(', '));
      if (m.user.name) bits.push('knows you as ' + m.user.name); if (m.user.likes.length) bits.push('knows you like ' + m.user.likes.map((t) => TOPICS[t].n).join(', '));
      const fear = Object.entries(m.seen).filter(([, s]) => s.fear > 0.3).map(([w]) => 'the ' + w); if (fear.length) bits.push('afraid of ' + fear.slice(0, 3).join(', '));
      const d = P.d;
      bits.push(d.fear > 0.62 ? 'easily frightened' : d.fear < 0.3 ? 'hard to frighten' : 'steady enough');
      bits.push(d.curious > 0.62 ? 'very inquisitive' : d.curious < 0.32 ? 'not one to go poking about' : 'curious now and then');
      bits.push('feeling ' + moodName(c, m, P));
      return bits.join('; ') + '.';
    }
    // for a model speaking for them: what they know, and their past chats with you (by what came up, as far back as they
    // remember), in a few plain words written here
    function memoryNote(k) {
      const c = o.card(k); if (!c) return '';
      const P = profile(c), m = memOf(c), now = Date.now() / 1000, bits = [knows(k)];
      const eps = (m.user.eps || []).filter((e) => e.n > 0 && now - e.t1 < HORIZON[P.smarts || 3] * 86400 && (e.topics.length || e.asked.length || e.feel)).slice(-4);
      if (eps.length) bits.push('Earlier talks with the user: ' + eps.map((e) => whenOf(e.t1) + ', ' + e.topics.map((t) => TOPICS[t].n).concat(e.asked.map((a) => ASKED[a])).concat(e.feel === 'low' ? ['how the user was feeling (low)'] : e.feel === 'up' ? ['how the user was feeling (happy)'] : []).slice(0, 4).join(', ')).join('; ') + '.');
      return bits.join(' ').slice(0, 600);
    }
    return { profile, observe, line, reset, flush, knows, memoryNote, plan, aside, decide, sense: (k, g) => { const c = o.card(k); return c ? sense(profile(c), memOf(c), thing(g)) : null; }, moodOf: (k) => { const c = o.card(k); return c ? moodName(c, memOf(c), profile(c)) : ''; } };
  }

  function create(o) {
    const KEY = o.storage || 'hf-minds', url = o.url || API, budget = o.budget || 300, changed = () => o.changed && o.changed();
    // the owner's key (asked once a device; the server answers nobody else) and the model: 'haiku' (cheap) or 'opus'
    const OWN = KEY + '-key', MOD = KEY + '-model';
    // past conversations with you, kept per person (by name, age and sex, as the built-in mind keeps them) in this
    // browser (KEY + '-talk'): the last TALK_N lines each, for up to 80 people; with KEY + '-brain' they are what an app
    // syncs between devices (M.memoryKeys). Read again whenever another tab or a sync writes them
    const TALK = KEY + '-talk', TALK_N = 40;
    let talk = {};
    const loadTalk = () => { try { talk = JSON.parse(store(TALK) || '{}') || {}; } catch (e) { talk = {}; } };
    loadTalk();
    const cid = (k) => { const c = o.card(k); return c ? `${c.name}|${c.age}|${c.sex}` : null; };
    const saveTalk = () => {
      const ids = Object.keys(talk), last = (id) => { const a = talk[id]; return a.length ? a[a.length - 1].t : 0; };
      if (ids.length > 80) ids.sort((a, b) => last(a) - last(b)).slice(0, ids.length - 80).forEach((id) => delete talk[id]);
      store(TALK, JSON.stringify(talk));
    };
    // a line between you and k, kept: w 'y' you to them, 'g' you to a group they were in, 'm' them to you
    const keep = (k, l) => {
      const id = cid(k); if (!id || !l || !l.said) return;
      const a = talk[id] || (talk[id] = []);
      a.push({ w: l.p === 'you' ? (l.group ? 'g' : 'y') : 'm', s: String(l.said).slice(0, 300), t: Math.round(l.t * 10) / 10 });
      if (a.length > TALK_N) a.splice(0, a.length - TALK_N);
      saveTalk();
    };
    const history = (k) => (talk[cid(k)] || []).map((e) => ({ p: e.w === 'm' ? k : 'you', to: e.w === 'm' ? 'you' : k, who: e.w === 'm' ? M.nameOf(k) : e.w === 'g' ? 'you, to everyone' : 'you', said: e.s, t: e.t, kept: true }));
    const toYou = (l, k) => l.p === 'you' || (l.p === k && l.to === 'you');
    if (root.addEventListener) {
      root.addEventListener('storage', (e) => { if (e.key === TALK) loadTalk(); });
      const flush = () => brain.flush();
      root.addEventListener('pagehide', flush);
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    }
    const brain = Brain({ storage: KEY, now: o.now, people: o.people, canGo: o.canGo, card: (k) => o.card(k), nameOf: (k) => M.nameOf(k), sights: o.sights, scene: o.scene, youName: () => (M.as != null && o.card(M.as) ? o.card(M.as).name : ''), lines: o.lines, you: () => M.as });
    const send = (body) => fetch(url, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, M.key ? { 'x-persona-key': M.key } : {}), body: JSON.stringify(body) });
    const why = (a) => { if (a.spend) M.spend = a.spend; if (a.error === 'off') M.server = false; return a.why || 'They could not answer just now.'; };
    // the real voices' server beside this one (o.voiceUrl, else /api/voice next to /api/persona), on this M's key and meter
    const real = { url: o.voiceUrl || url.replace(/\/persona$/, '/voice'), key: () => M.key, on: () => M.realVoice,
      spend: (s, cost) => { if (s && s.cap != null) M.spend = s; if (cost) M.session += cost; changed(); } };
    VOICE.real = real;
    const cool = new Map();  // key -> { 'kind|by': time }
    const offers = new Map();  // key -> { by, key, t }: something to do together that by has just suggested to them
    const OFFER_FOR = 120;     // s an unanswered suggestion stands
    const ids = new WeakMap(); let nid = 0;
    const idOf = (x) => (typeof x === 'object' ? (ids.has(x) ? ids.get(x) : (ids.set(x, ++nid), nid)) : x);
    let next = 0, turn = 0, rid = 0, scanAt = 0;
    const snap = new Map();   // key -> what they could see a second ago (scan())
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // a line meant for k: to them, or to a group they are in; the round of yours k is answering (a group line not yet answered)
    const mine = (l, k) => l.to === k || (l.p === 'you' && !!l.group && l.group.includes(k));
    const roundOf = (k) => {
      for (let i = M.lines.length - 1; i >= 0; i--) { const l = M.lines[i]; if (l.p === k && l.to === 'you') return undefined; if (l.p === 'you' && mine(l, k)) return l.group ? l.id : undefined; }
      return undefined;
    };
    const M = {
      lines: [], asked: 0, busy: new Set(), status: '', server: null, chatter: false, left: CHATTER,
      as: null,   // the person you are playing (their key): they say only what you type, and the others talk to you as them
      spend: null, cost: 0, session: 0, sessionLines: 0,  // the meter: { spent, cap, lines, day } in US$ (today, Central time), and the last line's cost
      get key() { return store(OWN) || ''; },
      set key(v) { store(OWN, String(v || '').trim()); M.status = ''; M.meter(); },
      // who speaks: 'local' (the built-in mind, free, the default) or a model on the server: 'haiku', 'sonnet', 'opus'
      get model() { const v = store(MOD); return SPEAKERS.includes(v) ? v : 'local'; },
      set model(v) { v = String(v || '').replace(/^claude-/, '').split('-')[0]; store(MOD, SPEAKERS.includes(v) ? v : 'local'); M.status = ''; if (M.model !== 'local' && M.on) M.check(); changed(); },
      // the built-in mind answers: chosen, or the server is not set up, or no owner key on this device
      get local() { return M.model === 'local' || M.model === 'mix' || M.server === false || !M.key; },
      // mix, ready: a line the built-in mind cannot understand goes to Haiku
      get mixing() { return M.model === 'mix' && !!M.key && M.server !== false; },
      brain,
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
      // on unless switched off in this browser (the built-in mind costs nothing)
      get on() { return store(KEY) !== '0'; },
      set on(v) { store(KEY, v ? '1' : '0'); if (!v) { M.chatter = false; M.hush(); } else if (M.model !== 'local') M.check(); changed(); },
      card: (k) => o.card(k),
      nameOf: (k) => { const c = o.card(k); return c ? c.name : (o.label ? o.label(k) : 'someone'); },
      can: (k) => M.on && !!o.card(k),
      // is the server set up for it? (once a visit)
      async check() {
        if (M.server !== null) return M.server;
        try { const r = await fetch(url); M.server = r.ok && (await r.json()).on === true; } catch (e) { M.server = false; }
        if (!M.server) M.status = 'The built-in mind is speaking: the server is not set up for models (ANTHROPIC_API_KEY, PERSONA_OWNER_KEY, PERSONA_DB_SECRET).';
        else if (M.key) M.meter();
        changed();
        return M.server;
      },
      // key says something: to you, to another person (to: their key), or in reaction to ev
      async ask(k, to = 'you', ev = null, force = null) {   // force: a model asked whoever speaks (mix's Haiku)
        if (!M.can(k) || (to !== 'you' && to != null && !M.can(to)) || M.busy.has(k) || k === M.as) return null;
        if (M.model !== 'local' && M.server === null) await M.check();
        if (M.local && !force) return M.think(k, to, ev);
        if (ev && ev.kind === 'lost') return M.think(k, to, ev);   // the story's turns are the built-in mind's, whoever speaks
        if (ev && !SERVER.includes(ev.kind) && !(ev.kind === 'notice' && ev.decide)) return null;   // a notice goes to the server only to be decided
        if (M.asked >= budget) { M.status = `That's ${budget} lines this visit; reload the page for more.`; changed(); return null; }
        // talking with you (or anyone the app marks best, o.best): fuller answers, the last 30 lines and what they remember;
        // a passing remark or reaction stays short. best: fuller answers among themselves too, and the model picked thinks harder
        const best = !!(o.best && o.best(k, to === 'you' ? null : to)), direct = !ev && (to === 'you' || to == null);
        const depth = direct || (best && !ev) ? 'talk' : 'chat';
        const log = (direct ? history(k) : M.lines.filter((l) => l.p === k || mine(l, k) || (to !== 'you' && to != null && (l.p === to || l.to === to)))).slice(depth === 'talk' ? -30 : -12).map((l) => ({ who: l.who, said: l.said }));
        const e = ev && { kind: ev.kind, who: ev.by != null ? M.nameOf(ev.by) : String(ev.who || '').slice(0, 40), what: ev.kind === 'touched' ? '' : String(ev.what || '').slice(0, 60), where: ev.where || '', danger: !!ev.danger, feet: ev.feet ? Math.round(ev.feet) : undefined };
        // to be decided: the built-in mind's pick goes along as their instinct, and the server answers with a `do` (MILD only)
        if (e && ev.decide && ev.dec) Object.assign(e, { decide: true, toward: !!ev.toward, moving: !!ev.moving, inst: { do: ev.dec.do, threat: ev.dec.threat, felt: ev.dec.felt, keen: ev.dec.keen } });
        // plans made together, between two of them neither of whom you play: the answer to the other's suggestion, or what
        // they could suggest doing together now (the app's o.joint(k, to): keys the server knows)
        const peer = !ev && to !== 'you' && to != null && to !== M.as;
        const off = peer ? offers.get(k) : null, proposal = off && off.by === to && Date.now() / 1000 - off.t < OFFER_FOR ? { key: off.key } : undefined;
        const joint = peer && !proposal && o.joint ? (o.joint(k, to) || []).slice(0, 5) : [];
        M.busy.add(k); M.asked++; M.status = ''; changed();
        try {
          const r = await send({ me: o.card(k), to: to === 'you' || to == null ? 'you' : o.card(to), scene: o.scene ? o.scene(k, to, ev) : '', log, event: e || undefined,
            model: force || M.model, decide: !!(e && e.decide), depth, best, past: direct || best ? brain.memoryNote(k) : undefined, joint: joint.length ? joint : undefined, proposal });
          const a = await r.json().catch(() => ({}));
          if (!r.ok) { M.status = why(a); if (a.error === 'cap') M.chatter = false; return null; }
          if (a.spend) { M.spend = a.spend; M.cost = a.cost || 0; M.session += a.cost || 0; M.sessionLines++; } if (a.model) M.served = a.model;
          if (!o.people().includes(k)) return null;
          M.lines.push({ p: k, to: ev ? (ev.by != null ? ev.by : null) : to, who: M.nameOf(k), said: a.say, ev: ev ? ev.kind : undefined, t: Date.now() / 1000, round: to === 'you' ? roundOf(k) : undefined });
          if (!ev && to === 'you') keep(k, M.lines[M.lines.length - 1]);
          if (o.show) o.show(k, a, to, ev);
          if (proposal) { offers.delete(k); if (o.agreed) o.agreed(to, k, proposal.key, a.agree === true); }
          else if (a.propose && joint.includes(a.propose)) { offers.set(to, { by: k, key: a.propose, t: Date.now() / 1000 }); if (o.proposed) o.proposed(k, to, a.propose); M.answer(to, k); }
          return a;
        } catch (err) { M.status = 'They could not answer just now.'; return null; } finally { M.busy.delete(k); changed(); }
      },
      // k answers by's suggestion (once k is free to speak; given up after a few tries)
      async answer(k, by) {
        await wait(1200 + Math.random() * 1200);
        for (let i = 0; i < 12; i++) {
          const off = offers.get(k); if (!off || off.by !== by || !o.people().includes(k)) return;
          if (!M.busy.has(k) && !M.busy.has(by)) { await M.ask(k, by); return; }
          await wait(1000);
        }
        offers.delete(k);
      },
      // what by has suggested to k and not yet had an answer to (null when nothing stands)
      offer: (k) => { const f = offers.get(k); return f && Date.now() / 1000 - f.t < OFFER_FOR ? f : null; },
      // what key does next, chosen by a model from the few things the app would have them do (keys the server knows:
      // eat, drink, wash, sleep, tv, chair, pool, company; to: the name of whoever company goes to) and how pressing
      // their needs are ({ hunger, thirst, energy, clean, fun, company } 0..1). Resolves to { pick, why, say, mood } or
      // null (the built-in mind speaking, no server, the cap, a miss): the app then goes with its own pick
      async plan(k, options, needs, to) {
        if (!M.can(k) || k === M.as || !Array.isArray(options) || options.length < 2) return null;
        if (M.model !== 'local' && M.server === null) await M.check();
        if (M.local || M.asked >= budget) return null;
        M.asked++;
        try {
          const log = M.lines.filter((l) => l.p === k || mine(l, k) || l.to === k).slice(-8).map((l) => ({ who: l.who, said: l.said }));
          const r = await send({ op: 'plan', me: o.card(k), scene: o.scene ? o.scene(k, null, null) : '', options, needs, to: to || undefined, log, model: M.model });
          const a = await r.json().catch(() => ({}));
          if (a.spend) { M.spend = a.spend; M.cost = a.cost || 0; M.session += a.cost || 0; M.sessionLines++; changed(); }
          if (!r.ok) { if (a.why && a.error !== 'bad') { M.status = why(a); changed(); } return null; }
          return a.pick && options.includes(a.pick) ? a : null;
        } catch (err) { return null; }
      },
      // the built-in mind's line, after a moment's thought (longer for the slow and the shy)
      async think(k, to, ev) {
        M.busy.add(k); changed();
        try {
          const P = brain.profile(o.card(k));
          await new Promise((r) => setTimeout(r, Math.max(250, 350 + Math.random() * 600 + (1 - P.d.energy) * 500 + P.d.shy * 400 - P.d.smart * 200)));
          if (!o.people().includes(k) || !M.on) return null;
          const toYou = !ev && (to == null || to === 'you');
          if (toYou) SENSE.load();   // the model that reads for meaning: from the first time you talk to them
          let a = brain.line(k, to == null && !ev ? 'you' : to, ev, M.lines); if (!a) return null;
          if (toYou && a.meta && a.meta.stuck) {
            // not understood: what the on-device model makes of it, else (mix) Haiku, else their own word back
            const last = M.lines.filter((l) => l.p === 'you' && (l.to === k || (l.group && l.group.includes(k)))).slice(-1)[0];
            const hit = last ? await SENSE.match(plainWords(last.said)).catch(() => null) : null;
            if (hit) { const b = brain.line(k, 'you', null, M.lines, { text: hit.text }); if (b && !(b.meta && b.meta.stuck)) { a = b; a.meant = hit.text; } }
            if (a.meta && a.meta.stuck && M.mixing) { M.busy.delete(k); const r = await M.ask(k, 'you', null, 'haiku'); if (r) return r; M.busy.add(k); }
          }
          M.lines.push({ p: k, to: ev ? (ev.by != null ? ev.by : null) : to == null ? 'you' : to, who: M.nameOf(k), said: a.say, ev: ev ? ev.kind : undefined, t: Date.now() / 1000, meta: a.meta, round: !ev && (to == null || to === 'you') ? roundOf(k) : undefined });
          if (!ev && (to == null || to === 'you')) keep(k, M.lines[M.lines.length - 1]);
          if (M.lines.length > 400) M.lines.splice(0, 100);
          if (o.show) o.show(k, a, ev && ev.kind === 'muse' ? null : to, ev && ev.kind === 'muse' ? null : ev);
          if (a.act && !(ev && ev.dec) && o.act) o.act(k, a.act, ev);   // something they noticed while musing
          if (a.meta && a.meta.go && o.go) o.go(k, a.meta.go);   // agreed to do something: the page has them do it
          return a;
        } finally { M.busy.delete(k); changed(); }
      },
      // what someone has learned, in a few words (the built-in mind's memory)
      knows: (k) => (o.card(k) ? brain.knows(k) : ''),
      // forget everything everyone has learned (in this browser)
      unlearn() { brain.reset(); talk = {}; store(TALK, '{}'); changed(); },
      // the stores to sync between devices (an app's own save or sync copies these; never the owner key or model)
      memoryKeys: [KEY + '-brain', KEY + '-talk'],
      // you say something to a group (keys): those it is for answer you in turn, each hearing the ones before; two who
      // find they like the same thing may say so to each other. Resolves to the lines said
      async tellAll(keys, text, label = 'you, to everyone') {
        text = String(text || '').trim().slice(0, 400); keys = [...new Set(keys)].filter((k) => M.can(k));
        if (!text || !keys.length) return [];
        if (keys.length === 1) { const a = await M.tell(keys[0], text); return a ? [a] : []; }
        const id = ++rid, line = { p: 'you', to: 'group', group: keys, id, who: label, said: text, t: Date.now() / 1000 };
        M.lines.push(line); M.left = CHATTER; for (const k of keys) keep(k, line); changed();
        const who = M.local ? brain.plan(keys, text) : keys.slice(0, 4), out = [];
        for (const k of who) {
          if (!o.people().includes(k)) continue;
          for (let i = 0; i < 40 && M.busy.has(k); i++) await wait(150);   // finishing another line first
          const a = await M.ask(k, 'you'); if (a) out.push(a);
          await wait(250 + Math.random() * 450);
        }
        if (M.local && Math.random() < 0.6) { const s = brain.aside(M.lines, id); if (s && M.can(s.k) && M.can(s.by)) await M.ask(s.k, null, { kind: 'aside', by: s.by, topic: s.topic }); }
        return out;
      },
      // the conversation with a group: what you said to it and their answers (the last rounds)
      groupLog(keys) {
        const ids = new Set(M.lines.filter((l) => l.group && l.group.some((k) => keys.includes(k))).map((l) => l.id));
        return M.lines.filter((l) => (l.group && ids.has(l.id)) || (l.round && ids.has(l.round)) || (l.ev === 'aside' && keys.includes(l.p))).slice(-40);
      },
      // you say something to key; they answer
      tell(k, text) {
        text = String(text || '').trim().slice(0, 400); if (!text || !M.can(k)) return null;
        M.lines.push({ p: 'you', to: k, who: M.as != null ? M.nameOf(M.as) : 'you', said: text, t: Date.now() / 1000 }); keep(k, M.lines[M.lines.length - 1]);
        M.left = CHATTER;
        return M.ask(k, 'you');
      },
      // something happened to them; they react (at most once per COOL seconds for the same thing)
      event(k, ev) {
        if (!M.can(k) || !ev || !COOL[ev.kind]) return false;
        if (k === M.as) { brain.observe(k, ev); return false; }   // you: what happens to you is yours to answer
        const now = Date.now() / 1000, c = cool.get(k) || {}, id = ev.kind + '|' + (ev.by != null ? idOf(ev.by) : ev.ref != null ? idOf(ev.ref) : ev.who || ev.what || '') + (ev.kind === 'touched' && (ev.what || ev.how) ? '|' + (ev.what || '') + '|' + (ev.how || '') : '') + (ev.kind === 'lost' ? '|' + (ev.how || '') : '');
        // something dangerous coming at them, or someone raising the alarm, gets through the 6 s between reactions
        const urgent = ((ev.danger || ev.kind === 'alarm' || ev.how === 'slap') && now - (c.any || -1e9) > 2) || (ev.kind === 'lost' && now - (c.any || -1e9) > 2.5);
        // busy (speaking, or a model deciding): only the urgent gets through, acted on at once (the line is skipped)
        if (M.busy.has(k) && !urgent) return false;
        if (now - (c[id] || -1e9) < COOL[ev.kind] || (now - (c.any || -1e9) < 6 && !urgent)) return false;
        c[id] = c.any = now; cool.set(k, c);
        // decide first (on what they knew before this), tell the app, then learn from it and say something
        ev = Object.assign({}, ev); ev.dec = brain.decide(k, ev) || undefined;
        // a model decides a mild pick (never fleeing, backing off, freezing, warning or calling, nor anything urgent) when one is speaking:
        // the act waits for its answer (DECIDE_WAIT), else the built-in pick is acted on as ever
        if (ev.dec && MILD.includes(ev.dec.do) && !urgent && !M.local && o.act && !M.quiet(k, ev.kind) && /^(notice|animal|approached|arrived)$/.test(ev.kind)) {
          const dec = ev.dec; ev.decide = true;
          // a reply that comes after something newer (an urgent event got through meanwhile) is let go: that one stands
          const fin = (a) => { if (!o.people().includes(k)) return; const d = a && MILD.includes(a.do) ? Object.assign({}, dec, { do: a.do }) : dec; ev.dec = d; if (d.do !== 'ignore' && (cool.get(k) || {}).any === now) o.act(k, d, ev); brain.observe(k, ev); };
          const asked = M.ask(k, null, ev);
          Promise.race([asked, wait(DECIDE_WAIT).then(() => null)]).then(fin);
          return true;
        }
        if (ev.dec && ev.dec.do !== 'ignore' && o.act) o.act(k, ev.dec, ev);
        brain.observe(k, ev);
        if (!M.quiet(k, ev.kind)) M.ask(k, null, ev);
        // a warning, someone running or a call for help is heard by those near enough (o.hears), who decide for themselves
        if (ev.dec && /^(warn|flee|call)$/.test(ev.dec.do) && ev.kind !== 'alarm') {
          const near = o.people().filter((q) => q !== k && M.can(q) && (o.hears ? o.hears(k, q) : true));
          near.forEach((q, i) => setTimeout(() => M.event(q, { kind: 'alarm', by: k, what: ev.what || (ev.by != null ? M.nameOf(ev.by) : ev.who) || 'something', ref: ev.dec.at, danger: !!ev.danger || ev.dec.threat > 0.45, feet: ev.feet }), 500 + i * 250 + Math.random() * 700));
        }
        return true;
      },
      // what someone would do about a thing ({ what, danger, threat, feet, moving, toward, sound, ref } or words), without
      // a word or a memory of it: { do (one of ACTS), what, at, threat, felt, keen, feet }
      decide: (k, g) => (M.can(k) ? brain.decide(k, Object.assign({ kind: 'notice' }, typeof g === 'object' ? g : { what: g })) : null),
      // their nature, 0..1: how easily frightened, how inquisitive, how steady, bold, warm, shy, talkative, lively
      nature(k) { const c = o.card(k); if (!c) return null; const d = brain.profile(c).d; return { fear: d.fear, curious: d.curious, nerve: d.nerve, bold: d.bold, warm: d.warm, shy: d.shy, talk: d.talk, energy: d.energy }; },
      // what changed round each of them since a second ago (o.sights): something new, something coming closer, something
      // feared gone. The first look at a scene only takes it in (nobody remarks on everything at once)
      scan() {
        for (const k of o.people()) {
          if (!M.can(k)) continue;
          const cur = new Map();
          for (const g0 of o.sights(k) || []) { const g = typeof g0 === 'object' ? g0 : { what: g0 }; cur.set(g.ref != null ? idOf(g.ref) : g.what, g); }
          const prev = snap.get(k); snap.set(k, cur);
          if (!prev) continue;
          for (const [id, g] of cur) {
            const p = prev.get(id);
            if (!p) { if (!(g.feet > 120)) M.event(k, Object.assign({ kind: 'notice', new: true }, g)); }
            else if (g.feet != null && p.feet != null && g.feet < p.feet - 3 && g.feet < p.feet * 0.85 && g.feet < 60) M.event(k, Object.assign({ kind: 'notice', toward: true }, g));
          }
          for (const [id, g] of prev) if (!cur.has(id)) { const kn = brain.sense(k, g); if (kn && kn.t > 0.3) M.event(k, Object.assign({ kind: 'gone' }, g)); }
        }
        for (const k of snap.keys()) if (!o.people().includes(k)) snap.delete(k);
      },
      // do they keep quiet about this kind of thing (the card's quiet)? They still notice it and learn from it
      quiet(k, kind) { const c = o.card(k); return !!(c && c.quiet && c.quiet.some((g) => QUIET[g].includes(kind))); },
      forget(k) { M.lines = M.lines.filter((l) => l.p !== k && l.to !== k); const id = cid(k); if (id && talk[id]) { delete talk[id]; saveTalk(); } cool.delete(k); changed(); },
      // what k said and heard: your conversations with them (past visits too, kept), what was said to them by others
      // and the whole of any group round they were in
      logOf(k) {
        const ids = new Set(M.lines.filter((l) => l.group && l.group.includes(k)).map((l) => l.id));
        const here = M.lines.filter((l) => (l.p === k || mine(l, k) || (l.round && ids.has(l.round)) || (l.ev === 'aside' && l.to === k)) && !(toYou(l, k) && (l.p === k || l.to === k || (l.group && l.group.includes(k)))));
        return history(k).concat(here).sort((a, b) => a.t - b.t).slice(-30);
      },
      hush() { VOICE.hush(); },
      // read a line aloud: who is their card (or just 'man' / 'woman'); each person keeps one voice (VOICE); on: { start(s),
      // end() } as the voice starts (with about how long it runs, in seconds) and stops, for a mouth to move with it
      // (on may be a number instead: vol 0..1, how loud where you are, the app's distance; or { vol, start, end })
      speak(text, who, on) { VOICE.say(text, typeof who === 'object' && who ? who : { sex: who }, typeof on === 'number' ? { vol: on } : on); },
      speaking: () => VOICE.speaking(),
      // real voices (api/voice.js, the owner's, on the daily cap) unless switched off on this device; the browser's own
      // voices whenever they are off, there is no owner key, or the server is not set up for them
      get realVoice() { return store(KEY + '-real') !== '0'; },
      set realVoice(v) { store(KEY + '-real', v ? '1' : '0'); changed(); },
      get realVoiceNow() { return VOICE.usable(); },   // a line said now would be in a real voice (or it is still being asked)
      // among themselves: the next one in turn says something to whoever is nearest, now and then
      step() {
        const now = Date.now() / 1000;
        if (M.on && o.sights && now > scanAt && !(typeof document !== 'undefined' && document.hidden)) { scanAt = now + 1; M.scan(); }
        if (!M.on || !M.chatter || (typeof document !== 'undefined' && document.hidden) || now < next || M.busy.size) return;
        const who = o.people().filter((k) => M.can(k) && k !== M.as); if (who.length < (M.local || M.as != null ? 1 : 2)) return;
        if (M.left <= 0 && !M.local) { M.chatter = false; M.status = 'They have stopped talking among themselves; say something, or start them again.'; changed(); return; }
        next = now + GAP[0] + Math.random() * (GAP[1] - GAP[0]);
        // whose turn: in order, each taking it by how readily they start talking (the card's chat; 0.5 always does)
        let k = null;
        for (let i = 0; i < who.length && k == null; i++) { const q = who[turn++ % who.length], c = o.card(q); if (Math.random() < Math.min(1, 2 * (c ? c.chat : 0.5))) k = q; }
        if (k == null) return;
        const to = o.nearest ? o.nearest(k) : who.find((q) => q !== k);
        // the built-in mind: now and then, or with nobody to talk to, they remark on what is round them or on their mind
        // you are one of them: whoever is nearest you turns to you (as the one you play: who they know), more often than not
        if (M.as != null && (to === M.as || Math.random() < 0.6)) { M.ask(k, M.as); return; }
        if (M.local && (to == null || !M.can(to) || Math.random() < 0.22)) { if (!M.quiet(k, 'muse')) M.ask(k, null, { kind: 'muse' }); return; }
        if (to == null || !M.can(to)) return;
        if (!M.local) M.left--;
        M.ask(k, to);
      },
    };
    return M;
  }

  // what a line costs, roughly (about 1,200 tokens in and 300 out, at each model's price): for the meter's estimates
  const LINE = { haiku: 0.00027, mix: 0.00027, sonnet: 0.0054, opus: 0.0108 };
  const NAMES = { local: 'Built-in', mix: 'Built-in + Haiku', haiku: 'Haiku', sonnet: 'Sonnet', opus: 'Opus' }, NAME = NAMES;
  // under a dollar in cents, so line costs compare at a glance (0.03¢, 0.54¢, 1.1¢); a dollar or more as dollars
  const money = (v) => { v = +v || 0; if (v >= 1) return '$' + v.toFixed(2); const c = v * 100; return (c >= 10 ? c.toFixed(0) : c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '\u00a2'; };
  const dollars = (v) => '$' + (+v || 0).toFixed(2);
  // the meter in words: today's spend of the cap, lines, and about how many more at the model picked
  function meterText(M) {
    if (M.model === 'mix' && !M.spend) return 'Built-in + Haiku: the built-in mind answers everything it understands, free; only a line it cannot understand goes to Haiku (about ' + money(LINE.haiku) + ' each). ' + (M.key ? 'Reading the meter...' : 'Enter the owner key; until then the built-in mind alone speaks.');
    if (M.model === 'local') return 'Built-in: free, made in this browser. They notice what happens round them and decide what to do about it by their nature (the easily frightened back off or run, the inquisitive go and look), remember who they have met, what people like and what scared them, and their mood moves with it.';
    const s = M.spend; if (!s) return M.key ? 'Reading the meter...' : 'Enter the owner key for ' + NAMES[M.model] + '; until then the built-in mind speaks.';
    const left = Math.max(0, s.cap - s.spent), n = Math.floor(left / LINE[M.model]);
    return `Today: ${money(s.spent)} of ${dollars(s.cap)} (${s.lines} line${s.lines === 1 ? '' : 's'})` + (M.cost ? `, last line ${money(M.cost)}` : '') +
      `. About ${n.toLocaleString()} more at ${NAMES[M.model]}.` + (M.session ? ` This session: ${money(M.session)} (${M.sessionLines} line${M.sessionLines === 1 ? '' : 's'}).` : '');
  }
  // the meter in a few words, for a strip over a view: who speaks, today's spend of the cap, this session's
  function costText(M) { return spendText(M) + ' \u00b7 ' + VOICE.state(); }
  function spendText(M) {
    if (M.model === 'local') return 'Built-in, free';
    if (!M.key) return NAMES[M.model] + ': needs the owner key';
    const s = M.spend;
    return s ? `Today ${money(s.spent)} of ${dollars(s.cap)} · session ${money(M.session)}` : 'Reading the meter...';
  }
  // ---- voices: the most natural the browser has (Edge's Microsoft "Natural" voices, Chrome's Google ones, Safari's
  // Enhanced and Premium Siri voices), each person given one of their own (by their name, so it stays theirs) of their
  // sex, at their own pace (older and calmer slower, chatty and nervous quicker); the pitch is left alone on a natural
  // voice (shifting it is what makes them sound robotic), nudged a little on the plain ones; a backlog is cut short
  const F_NAMES = /\b(female|woman|aria|jenny|michelle|ana|sonia|libby|emma|ava|ashley|cora|elizabeth|jane|nancy|sara|amber|natasha|clara|molly|samantha|allison|susan|victoria|karen|moira|tessa|fiona|serena|kate|zira|hazel|heather|catherine|joanna|kendra|kimberly|salli|ivy|ruth|olivia)\b/i;
  const M_NAMES = /\b(male|man|guy|davis|tony|jason|christopher|eric|roger|steffan|brian|andrew|ryan|thomas|william|liam|connor|alex|daniel|fred|tom|aaron|nathan|evan|oliver|arthur|gordon|lee|rishi|david|mark|george|james|matthew|joey|justin|kevin|stephen|ralph|bruce)\b/i;
  const VOICE = {
    list: [], at: 0,
    // ---- real voices (api/voice.js): a line is fetched as soon as it is said and played in turn, never more than one
    // waiting (the scene has moved on); a line the server will not voice (off, over the cap, too slow, a word it stops)
    // is read by the browser instead
    real: null,      // { url, key(), on(), spend(s, cost) }: the owner's, from create()
    realOk: null,    // is the server set up for them (asked once a visit)
    playing: null, waiting: null, paused: false, gen: 0, cache: new Map(),
    last: null,      // the last line read: { real } and, read by the browser, why (for the chip: state())
    usable() { const r = this.real; return !!(r && r.on() && r.key() && this.realOk !== false && typeof Audio !== 'undefined' && typeof fetch === 'function'); },
    check() {
      if (this.realOk !== null) return Promise.resolve(this.realOk);
      return this.checking || (this.checking = fetch(this.real.url).then((r) => (r.ok ? r.json() : {})).then((a) => (this.realOk = a.on === true)).catch(() => (this.realOk = false)));
    },
    // the line as an mp3 (a blob URL; the last 30 kept, so a line said again costs nothing), or null
    async fetchLine(text, c) {
      const r0 = this.real, id = `${c.name || ''}|${c.sex || ''}|${c.age || ''}|${c.mood || ''}|${text}`;
      if (this.cache.has(id)) { const u = this.cache.get(id); this.cache.delete(id); this.cache.set(id, u); return u; }
      const r = await fetch(r0.url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-persona-key': r0.key() },
        body: JSON.stringify({ text, who: { name: c.name || '', sex: c.sex === 'man' ? 'man' : 'woman', age: +c.age || 35, traits: c.traits || [], mood: c.mood || '' } }) });
      if (!r.ok) {
        const a = await r.json().catch(() => ({}));
        this.why = ({ cap: 'cap reached', about: 'line not voiced', slow: 'too many at once', model: 'voice service failed', spend: 'meter unreadable', owner: 'wrong owner key', off: 'server off', origin: 'not this site', adult: 'adults only' })[a.error] || 'server error';
        if (['off', 'owner', 'origin'].includes(a.error)) this.realOk = false;   // not this visit
        if (a.spend) r0.spend(a.spend);
        return null;
      }
      let s = null; try { s = JSON.parse(r.headers.get('x-voice-spend') || 'null'); } catch (e) { /* none */ }
      r0.spend(s, +r.headers.get('x-voice-cost') || 0);
      const u = URL.createObjectURL(await r.blob());
      this.cache.set(id, u);
      if (this.cache.size > 30) { const [k, old] = this.cache.entries().next().value; this.cache.delete(k); URL.revokeObjectURL(old); }
      return u;
    },
    sayReal(text, c, on) {
      const item = { text, c, on, gen: this.gen };
      item.url = this.check().then((ok) => (ok ? this.fetchLine(text, c) : ((this.why = 'server off'), null))).catch(() => ((this.why = 'no connection'), null));
      this.waiting = item;   // one waiting at most: an older one is passed over
      if (!this.playing) this.next();
    },
    async next() {
      const item = this.waiting; if (!item) return;
      this.waiting = null; this.playing = item;
      const url = await item.url;
      const done = () => { if (this.playing !== item) return; this.playing = null; if (item.on.end) item.on.end(); this.next(); };
      if (item.gen !== this.gen) { if (this.playing === item) this.playing = null; return; }
      if (!url) { this.playing = null; this.said({ real: false, why: this.why || 'server error' }); this.sayBrowser(item.text, item.c, item.on); this.next(); return; }
      this.said({ real: true });
      const a = item.a = new Audio(url);
      if (item.on.vol != null) a.volume = Math.max(0, Math.min(1, +item.on.vol || 0));
      a.onended = done; a.onerror = done;
      a.onplaying = () => { if (item.started) return; item.started = true; if (item.on.start) item.on.start(isFinite(a.duration) ? a.duration : 0.9 + item.text.length * 0.065); };
      try { if (!this.paused) await a.play(); } catch (e) {
        // the browser would not play it (no tap on the page yet): the browser's voice, which may
        if (this.playing === item) { this.playing = null; this.said({ real: false, why: 'tap the page first' }); this.sayBrowser(item.text, item.c, item.on); this.next(); }
      }
    },
    speaking() { const S = root.speechSynthesis; return !!(this.playing || this.waiting || (S && (S.speaking || S.pending))); },
    hush() {
      this.gen++; this.waiting = null;
      const p = this.playing; this.playing = null;
      if (p && p.a) { try { p.a.pause(); } catch (e) { /* none */ } }
      try { root.speechSynthesis && root.speechSynthesis.cancel(); } catch (e) { /* none */ }
    },
    // the scene paused: the voice too, going on from where it was
    pause(on) {
      this.paused = !!on;
      const a = this.playing && this.playing.a;
      try { if (a) { if (on) a.pause(); else a.play().catch(() => {}); } } catch (e) { /* none */ }
      try { const S = root.speechSynthesis; if (S) { if (on) S.pause(); else S.resume(); } } catch (e) { /* none */ }
    },
    // how natural a voice sounds, as far as its name and kind tell
    score(v) {
      const n = v.name;
      return (/natural|neural/i.test(n) ? 100 : 0) + (/online/i.test(n) ? 40 : 0) + (/premium/i.test(n) ? 90 : /enhanced|siri/i.test(n) ? 70 : 0) +
        (/^google/i.test(n) ? 45 : 0) + (/en[-_]us/i.test(v.lang) ? 12 : /en[-_](gb|au|ie|ca)/i.test(v.lang) ? 6 : 0) + (v.localService === false ? 8 : 0) -
        (/compact|espeak|novelty|whisper|zarvox|bells|bubbles|cellos|organ|trinoids|bad news|good news|albert|jester|superstar/i.test(n) ? 200 : 0);
    },
    sexOf: (v) => (F_NAMES.test(v.name) ? 'woman' : M_NAMES.test(v.name) ? 'man' : /^google us english$/i.test(v.name) ? 'woman' : ''),
    voices() {
      const S = root.speechSynthesis; if (!S) return [];
      if (!this.list.length || Date.now() - this.at > 30000) { this.at = Date.now(); this.list = S.getVoices().filter((v) => /^en/i.test(v.lang)).map((v) => ({ v, s: this.score(v), sex: this.sexOf(v) })).sort((a, b) => b.s - a.s); }
      return this.list;
    },
    // their voice: the best of their sex, spread over the voices nearly as good, by their name
    pick(c) {
      const all = this.voices(); if (!all.length) return null;
      const mine = all.filter((x) => x.sex === (c.sex === 'man' ? 'man' : 'woman')), pool = mine.length ? mine : all;
      const top = pool[0].s, near = pool.filter((x) => x.s >= top - 15);
      let h = 0; for (const ch of String(c.name || c.sex || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return { voice: near[h % near.length], fits: !!mine.length, h };
    },
    // a line, as they would say it: in a real voice when the owner has them, else the browser's
    say(text, c, on) {
      if (!text) return;
      if (this.usable()) this.sayReal(String(text), c || {}, on || {});
      else { this.said({ real: false }); this.sayBrowser(text, c, on); }
    },
    sayBrowser(text, c, on = {}) {
      const S = root.speechSynthesis; if (!S || typeof SpeechSynthesisUtterance === 'undefined' || !text) return;
      if (S.pending && S.speaking) S.cancel();  // never more than one waiting: the scene has moved on
      const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim()), p = this.pick(c || {}), T = (c && c.traits) || [], age = +(c && c.age) || 35;
      const natural = p && p.voice.s >= 40;
      if (p) u.voice = p.voice.v;
      u.lang = (p && p.voice.v.lang) || 'en-US';
      const rate = 1 - Math.max(0, age - 45) * 0.004 + (T.some((t) => /chatty|nervous|silly|cheerful/.test(t)) ? 0.06 : 0) - (T.some((t) => /calm|quiet|tired|serious|dreamy/.test(t)) ? 0.06 : 0) - (c && c.mood === 'tired' ? 0.05 : 0);
      const wobble = p ? ((p.h % 7) - 3) * 0.01 : 0;  // a little of their own, so two on one voice differ
      u.rate = Math.max(0.8, Math.min(1.15, rate + wobble));
      // a natural voice keeps its own pitch; a plain one is nudged toward their sex and age (a voice of the other sex as the last resort)
      u.pitch = natural ? 1 + wobble : (c && c.sex === 'man' ? 0.9 : 1.08) - Math.max(0, age - 50) * 0.003 + (p && !p.fits ? (c && c.sex === 'man' ? -0.15 : 0.15) : 0);
      if (on.vol != null) u.volume = Math.max(0, Math.min(1, +on.vol || 0));
      if (on.start) u.onstart = () => on.start((0.9 + u.text.length * 0.065) / u.rate);
      if (on.end) u.onend = () => on.end();
      S.speak(u);
    },
    said(l) { const was = this.state(); this.last = l; if (this.state() !== was && this.real) this.real.spend(null, 0); },
    // which voice they speak in, in a few words, for a chip: Real voice, or Browser voice and why
    state() {
      const r = this.real;
      if (!r || !r.on()) return 'Browser voice';
      if (!r.key()) return 'Browser voice (no owner key)';
      if (this.realOk === false) return 'Browser voice (server off)';
      if (this.last && !this.last.real && this.last.why) return 'Browser voice (' + this.last.why + ')';
      return 'Real voice';
    },
    // what this browser has, in words, for the panels
    about() {
      if (this.usable() && this.realOk) return 'Voices: real ones (about 1.5\u00a2 a minute, on the daily cap), the browser\'s when those cannot.';
      const all = this.voices(); if (!all.length) return root.speechSynthesis ? 'Voices: still loading.' : 'Voices: this browser cannot speak.';
      const good = all.filter((x) => x.s >= 40), f = good.filter((x) => x.sex === 'woman').length, m = good.filter((x) => x.sex === 'man').length;
      return good.length ? `Voices: ${good.length} natural ones here (${f} wom${f === 1 ? 'a' : 'e'}n, ${m} m${m === 1 ? 'a' : 'e'}n), the best ${good[0].v.name}.` : 'Voices: only basic ones in this browser; Microsoft Edge (its Natural voices), Chrome (Google voices) or Safari with an Enhanced voice downloaded sound far more natural.';
    },
  };
  try { if (root.speechSynthesis) root.speechSynthesis.addEventListener('voiceschanged', () => { VOICE.list = []; }); } catch (e) { /* none */ }

  // a small panel for any page: who speaks (the built-in mind or a model), the owner key, the daily cap and the meter, and
  // forgetting what the built-in minds have learned (o.button: a class for
  // the buttons, o.on: the class a picked one gets); returns paint(), to call when M changes
  function controls(el, M, o = {}) {
    const B = o.button || '', ON = o.on || 'on', caps = [0.5, 1, 2, 5, 10];
    el.innerHTML = `<div class="hfm-row"><span>Who speaks</span><button class="${B}" data-m="local">Built-in, free</button><button class="${B}" data-m="mix">Built-in + Haiku when stuck, ~${money(LINE.haiku)} a miss</button><button class="${B}" data-m="haiku">Haiku, ~${money(LINE.haiku)} a line</button><button class="${B}" data-m="sonnet">Sonnet, ~${money(LINE.sonnet)} a line</button><button class="${B}" data-m="opus">Opus, ~${money(LINE.opus)} a line</button></div>
      <div class="hfm-row" data-paid><span>Owner key</span><input type="password" autocomplete="off" placeholder="${M.key ? 'saved on this device' : 'the key from Vercel'}"><button class="${B}" data-a="key">Save</button></div>
      <div class="hfm-row"><span>Voices</span><button class="${B}" data-v="0">Browser, free</button><button class="${B}" data-v="1">Real, ~1.5\u00a2 a minute</button></div>
      <div class="hfm-row" data-paid><span>Daily cap</span>${caps.map((c) => `<button class="${B}" data-c="${c}">${dollars(c)}</button>`).join('')}</div>
      <div class="hfm-meter"></div>
      <div class="hfm-row"><span>Memory</span><button class="${B}" data-a="unlearn">Forget what they have learned</button></div>`;
    const inp = el.querySelector('input');
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') el.querySelector('[data-a=key]').click(); };
    el.querySelector('[data-a=key]').onclick = () => { if (inp.value.trim()) { M.key = inp.value; inp.value = ''; inp.placeholder = 'saved on this device'; } };
    el.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { M.model = b.dataset.m; paint(); }; });
    el.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => M.setCap(+b.dataset.c); });
    el.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { M.realVoice = b.dataset.v === '1'; if (M.realVoice && VOICE.real) VOICE.check().then(paint); paint(); }; });
    el.querySelector('[data-a=unlearn]').onclick = () => { if (typeof confirm === 'undefined' || confirm('Forget who everyone has met, what they like and what scared them (in this browser)?')) M.unlearn(); };
    function paint() {
      if (!el.isConnected) return;
      el.querySelectorAll('[data-m]').forEach((b) => { b.classList.toggle(ON, b.dataset.m === M.model); b.setAttribute('aria-pressed', String(b.dataset.m === M.model)); });
      el.querySelectorAll('[data-c]').forEach((b) => { const on = !!M.spend && +b.dataset.c === M.spend.cap; b.classList.toggle(ON, on); b.setAttribute('aria-pressed', String(on)); });
      el.querySelectorAll('[data-v]').forEach((b) => { const on = (b.dataset.v === '1') === M.realVoice; b.classList.toggle(ON, on); b.setAttribute('aria-pressed', String(on)); });
      el.querySelectorAll('[data-paid]').forEach((r) => { r.style.display = M.model === 'local' && !M.realVoice ? 'none' : ''; });
      el.querySelector('.hfm-meter').textContent = meterText(M) + (M.status && M.model !== 'local' ? ' ' + M.status : '') + ' ' + VOICE.about();
    }
    paint(); if (M.key && !M.spend && M.model !== 'local') M.meter();
    return paint;
  }

  root.HumanForgeMind = { costText, spendText, SENSE, plainWords, SPEAKERS, TRAITS, MOODS, QUIET, PARTS, SMARTS, KNACKS, VALUES, LIKES, describe, ADULT, API, COOL, LINE, NAME, TOPICS, ACTS, roll, card, partOf, create, controls, meterText, money, Brain, VOICE };
})(typeof window !== 'undefined' ? window : globalThis);
