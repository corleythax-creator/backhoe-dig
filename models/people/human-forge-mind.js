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
 *     sights: (key) => ['a black bear', { what: 'a wolf', danger: true, feet: 30 }, 'the window'],  // optional: things
 *                                        //   (not people) they can see, for the built-in mind to remark on
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
 *   minds.event(key, { kind: 'arrived', by: otherKey });        // someone came in (or was put in the scene)
 *   minds.event(key, { kind: 'approached', by: otherKey });     // someone came over to them
 *   minds.event(key, { kind: 'animal', what: 'a black bear', danger: true, feet: 12 });
 *   minds.event(key, { kind: 'still', by: otherKey });          // someone lying still nearby (dead, in a game)
 *   minds.event(key, { kind: 'left', by: otherKey });           // someone went (built-in mind only)
 *   minds.chatter = true; every frame: minds.step(dt)           // they talk among themselves now and then (built-in:
 *                                                               //   and remark on what is round them, even alone)
 * Events are dropped while one is pending for that person and within COOL seconds of the same thing happening again,
 * so an app may call event() every frame something is true. Guardrails: adults only (here and on the server), the
 * server's rules, at most `budget` asks a visit, chatter stops after CHATTER lines with nothing from you (models only).
 */
(function (root) {
  const TRAITS = ['warm', 'witty', 'shy', 'bold', 'dry', 'cheerful', 'grumpy', 'curious', 'calm', 'nervous', 'romantic',
    'sarcastic', 'kind', 'proud', 'dreamy', 'practical', 'chatty', 'quiet', 'flirty', 'serious', 'silly', 'worldly'];
  const MOODS = ['calm', 'happy', 'playful', 'curious', 'shy', 'tired', 'annoyed', 'sad', 'surprised', 'thoughtful'];
  const PARTS = ['head', 'face', 'hair', 'neck', 'shoulder', 'arm', 'hand', 'back', 'side', 'chest', 'waist', 'hip', 'leg', 'knee', 'foot'];
  const ADULT = 18, API = 'https://human-forge-beta.vercel.app/api/persona', CHATTER = 24, GAP = [9, 15];
  const COOL = { touched: 25, arrived: 40, approached: 45, animal: 40, still: 90, left: 30 };
  const SERVER = ['touched', 'arrived', 'approached', 'animal', 'still'];   // the kinds the server's model takes; the rest are built-in only
  const SPEAKERS = ['local', 'haiku', 'sonnet', 'opus'];
  // intelligence: how sharp they are (1..5) and the way they are clever; what matters to them; the topics they are into
  const SMARTS = ['', 'simple', 'average', 'sharp', 'bright', 'brilliant'];
  const KNACKS = { book: 'book smart', street: 'street smart', people: 'good with people', hands: 'good with their hands', numbers: 'quick with numbers', creative: 'creative' };
  const VALUES = ['family', 'honesty', 'loyalty', 'freedom', 'ambition', 'adventure', 'comfort', 'faith', 'fairness', 'knowledge', 'fun', 'tradition', 'kindness', 'independence', 'beauty'];
  const LIKES = ['weather', 'food', 'music', 'travel', 'books', 'work', 'animals', 'movies', 'garden', 'cars', 'history', 'stars', 'sport', 'coffee', 'sea', 'art', 'games'];

  // traits and a mood rolled from a seed (a person's id): the same each time
  function roll(seed) {
    let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296), traits = [];
    while (traits.length < 3) { const t = TRAITS[Math.floor(r() * TRAITS.length)]; if (!traits.includes(t)) traits.push(t); }
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
      job: String(m.job || '').trim().slice(0, 40), from: String(m.from || '').trim().slice(0, 40), goal: String(m.goal || '').trim().slice(0, 120), worry: String(m.worry || '').trim().slice(0, 120) };
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
  };
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
  const L = {
    touchGood: { warm: ['Oh, hello, {name}.', 'Hey you. That\'s nice.', 'Hi {name}.'], edge: ['Oh. Hi, {name}.', 'Yes, {name}? I\'m here.'], shy: ['Oh! Hi... {name}.', 'Oh, um, hello.'], bold: ['Ha, hello to you too, {name}.', 'There you are, {name}.'], humor: ['Tag, I\'m it?', 'Ha! Hi, {name}.'], plain: ['Hi, {name}.', 'Hey.'] },
    touchNew: { warm: ['Oh! Hello there.', 'Oh, hi. I don\'t think we\'ve met.'], edge: ['Can I help you?', 'Um. Hello?'], shy: ['Oh! Sorry, you made me jump.', 'Oh... hi.'], bold: ['Whoa, hello. And you are?', 'Well, hello. Introduce yourself first, maybe.'], humor: ['Oh! Is this how we\'re meeting?', 'Hi! Do I know you?'], plain: ['Oh, hello.', 'Hi. Can I help?'] },
    touchWary: { warm: ['Oh, my {part}. That\'s okay, just a bit sudden.', 'Easy, {name}.'], edge: ['That\'s my {part}, {name}.', 'Personal space, {name}.'], shy: ['Oh, um... my {part}.', 'Sorry, I\'m a bit jumpy.'], bold: ['Steady on, {name}.', 'Ask first, {name}.'], humor: ['Careful, the {part} bruises easily.', 'Whoa, warn a person.'], plain: ['Mind my {part}, please.', 'Not the {part}, {name}.'] },
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
  };
  // intelligence: what needs thinking about, answered by how sharp they are (lo: simple, mid: average or sharp, hi: bright
  // or brilliant) and the way they are clever (their knack); things they know or have learnt, by knack
  const tierOf = (P) => (P.smarts <= 1 ? 'lo' : P.smarts >= 4 ? 'hi' : 'mid');
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
  // simple sums said or asked: 'what's 7 times 8', '12 + 30', 'what is 100 divided by 4'
  const SUM = /(-?\d+(?:\.\d+)?)\s*(plus|\+|minus|-|times|x|\*|×|multiplied by|divided by|over|\/)\s*(-?\d+(?:\.\d+)?)/i;
  // the words a sharper mind reaches for (a few, now and then), and a plainer one
  const BIG = [[/\breally good\b/, 'excellent'], [/\ba lot\b/, 'a great deal'], [/\bI think\b/, 'I suspect'], [/\bvery\b/, 'remarkably'], [/\bpretty sure\b/, 'fairly certain'], [/\bweird\b/, 'curious'], [/\bbig\b/, 'enormous'], [/\bmaybe\b/, 'perhaps'], [/\bhelp\b/, 'be of use']];
  const STOP = /^(the|and|but|you|your|are|was|for|with|that|this|have|what|just|like|about|there|they|them|then|from|really|very|some|been|were|will|would|could|should)$/;

  function Brain(o) {
    const SAVE = o.storage + '-brain', profiles = new Map(), recent = new Map();
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
      for (const t of c.traits) for (const [k, v] of Object.entries(TRAIT_DIMS[t] || {})) d[k] += v;
      for (const t of c.values || []) for (const [k, v] of Object.entries(VALUE_DIMS[t] || {})) d[k] += v;
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
    const relOf = (m, name) => m.rel[name] || (m.rel[name] = { met: 0, like: 0, talks: 0, touch: [], likes: [] });
    // learning from what happens to them
    function observe(k, ev) {
      const c = o.card(k); if (!c || !ev) return;
      const P = profile(c), m = memOf(c), d = P.d, now = Date.now() / 1000;
      const who = ev.by != null ? o.nameOf(ev.by) : '', R = who ? relOf(m, who) : null;
      if (ev.kind === 'touched' && R) {
        R.touch = R.touch.filter((t) => now - t < 40); R.touch.push(now);
        const many = R.touch.length, known = R.met + R.talks > 1;
        const dl = many > 3 ? -0.18 : (d.warm * 0.08 + d.bold * 0.04 - d.shy * (known ? 0.03 : 0.08) - d.edge * 0.07 + (R.like > 0.3 ? 0.05 : 0));
        R.like = cl(R.like + dl, -1, 1); push(c, m, P, dl * 1.5, 0.25 + (1 - d.nerve) * 0.15);
      } else if ((ev.kind === 'arrived' || ev.kind === 'approached') && R) {
        R.met++; R.like = cl(R.like + 0.02 + d.warm * 0.04 - d.edge * 0.02, -1, 1); push(c, m, P, R.like * 0.1, 0.12);
      } else if (ev.kind === 'animal' || ev.kind === 'see') {
        const w = String(ev.what || 'something').replace(/^(a|an|the) /i, ''), S = m.seen[w] || (m.seen[w] = { n: 0, fear: 0 });
        S.n++; S.t = now;
        if (ev.danger) { S.fear = cl(S.fear + 0.15 + (1 - d.nerve) * 0.3); push(c, m, P, -0.25 * (1 - d.nerve), 0.5); }
        else { S.fear *= 0.85 - d.smart * 0.2; if (ev.kind === 'animal') push(c, m, P, 0.08 * d.warm, 0.1); }
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
        if (P.tic.at === 'start') s = P.tic.w + ' ' + s.replace(/^(.)/, (c) => (/^I\b/.test(s) ? c : c.toLowerCase()));
        else s = s.replace(/[.!]$/, '') + P.tic.w;
      }
      if (d.shy > 0.6 && Math.random() < d.shy * 0.35 && !/^(Um|Oh)/.test(s)) s = 'Um, ' + s.replace(/^(.)/, (c) => (/^I\b/.test(s) ? c : c.toLowerCase()));
      // the sharp reach for a bigger word now and then; the simple hesitate and keep it short
      if (P.smarts >= 4) { const n = P.smarts === 5 ? 2 : 1; let done = 0; for (const [w, b] of BIG) if (done < n && w.test(s) && Math.random() < (P.smarts === 5 ? 0.55 : 0.3)) { s = s.replace(w, b); done++; } }
      else if (P.smarts <= 1 && !o2.exact) { if (Math.random() < 0.2 && !/^(Uh|Um|Oh)/.test(s)) s = 'Uh, ' + s.replace(/^(.)/, (c) => (/^I\b/.test(s) ? c : c.toLowerCase())); const sn = s.split(/(?<=[.!?]) /); if (sn.length > 2 && Math.random() < 0.6) s = sn.slice(0, 2).join(' '); }
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
    function line(k, to, ev, lines) {
      const c = o.card(k); if (!c) return null;
      const P = profile(c), m = memOf(c), d = P.d;
      let say = '', look = 'you', meta = {}, ex = false;
      const mood0 = moodName(c, m, P);
      const slots = { me: c.name, user: m.user.name || '' };
      if (ev) {
        const who = ev.by != null ? o.nameOf(ev.by) : ev.who || 'someone', R = ev.by != null ? relOf(m, who) : null, w = bare(ev.what);
        Object.assign(slots, { name: who, part: ev.where || 'arm', what: ev.what || 'something', the: 'the ' + w, feet: ev.feet ? Math.round(ev.feet) : 'a few' });
        look = 'them';
        if (ev.kind === 'touched') {
          const recentN = R ? R.touch.length : 1, known = R && R.met + R.talks > 1;
          const tab = recentN > 3 || (R && R.like < -0.35) ? L.touchCross : !known ? (d.shy + d.edge > d.warm + d.bold ? L.touchWary : L.touchNew) : R.like > 0.1 ? L.touchGood : L.touchWary;
          say = pick(k, P, tab, slots); ex = !known && d.energy > 0.5 && Math.random() < 0.4;
        } else if (ev.kind === 'arrived' || ev.kind === 'approached') {
          if (!R || R.met + R.talks <= 1) say = pick(k, P, ev.kind === 'arrived' ? L.hello : L.over, slots);
          else say = pick(k, P, R.like < -0.25 ? L.cold : ev.kind === 'arrived' ? L.again : L.over, slots);
          if (R && R.like > 0.5 && Math.random() < 0.3) say += ' ' + pick(k, P, L.likeYou, slots);
        } else if (ev.kind === 'animal') {
          const S = m.seen[w] || { n: 1, fear: 0 };
          say = pick(k, P, ev.danger ? (S.n > 2 ? L.dangerAgain : L.danger) : S.fear > 0.3 ? L.dangerAgain : S.n > 2 ? L.animalAgain : L.animal, slots);
          ex = ev.danger && S.n <= 2; look = ev.danger && d.shy > 0.5 ? 'away' : 'them';
        } else if (ev.kind === 'still') say = pick(k, P, L.still, slots);
        else if (ev.kind === 'aside') { slots.topic = TOPICS[ev.topic] ? TOPICS[ev.topic].n : 'that'; say = pick(k, P, L.aside, slots); if (R) R.like = cl(R.like + 0.06, -1, 1); }
        else if (ev.kind === 'left') say = pick(k, P, L.left, slots);
        else if (ev.kind === 'muse') {
          look = 'away';
          const feared = Object.entries(m.seen).filter(([, s]) => s.fear > 0.4).sort((a, b) => b[1].fear - a[1].fear)[0];
          const sights = o.sights ? o.sights(k) : [];
          const r = Math.random();
          if (feared && r < 0.25) { slots.the = 'the ' + feared[0]; say = pick(k, P, L.museFear, slots); }
          else if (sights.length && r < 0.6) {
            const g = sights[Math.floor(Math.random() * sights.length)], s = typeof g === 'object' ? g.what : g, bad = typeof g === 'object' && g.danger, S = m.seen[bare(s)];
            Object.assign(slots, { what: s, the: 'the ' + bare(s), feet: typeof g === 'object' && g.feet ? Math.round(g.feet) : 'a few' });
            say = pick(k, P, bad ? (S && S.n > 2 ? L.dangerAgain : L.danger) : S && S.fear > 0.3 ? L.museFear : S && S.n > 1 ? L.seeAgain : L.see, slots);
            observe(k, { kind: 'see', what: s, danger: bad });
          } else if (mood0 === 'tired') say = pick(k, P, L.museTired, slots);
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
        if (!fresh) {
          // they start: hello the first time, then something about what they know you like, or what they like
          if (!U.said) { say = pick(k, P, L.hello, slots); if (c.job && d.talk > 0.5 && Math.random() < 0.35) say += ' ' + pick(k, P, SELF.introJob, jobSlots(c, slots)); }
          else if (U.feel === 'low' && P.knack === 'people') { U.feel = ''; say = pick(k, P, IQ.better, slots); }
          else if (U.likes.length && Math.random() < 0.5) { slots.topic = TOPICS[U.likes[Math.floor(Math.random() * U.likes.length)]].n; say = pick(k, P, L.yourLike, slots); }
          else { const t = P.likes[Math.floor(Math.random() * P.likes.length)], q = Math.random() < 0.3 + d.curious * 0.4; say = pick(k, P, L.hiUser, slots) + ' ' + topicLine(k, P, t, q); meta = { topic: t, q }; }
        } else say = answer(k, c, P, m, last.said, mine, slots, (x) => { meta = x; }, last.group ? { group: last.group, said: lines.filter((l) => l.round === last.id && l.p !== k) } : null);
        U.said = (U.said || 0) + (fresh ? 1 : 0);
      } else {
        // among themselves: answer what they just said to me, else start on something
        const who = o.nameOf(to), R = relOf(m, who), tc = o.card(to);
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
      save();
      const mood = moodName(c, m, P);
      say = voice(say || '...', P, mood, { ex });
      return { say: say.slice(0, 300), mood, face: face(mood), look: d.shy > 0.7 && look === 'you' && Math.random() < 0.4 ? 'away' : look, meta };
    }
    // the user said something: answer from what was said (never repeating their words), and learn from it
    function answer(k, c, P, m, text, mine, slots, setMeta, grp) {
      const t = String(text).toLowerCase(), raw = String(text), U = m.user, d = P.d;
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
      const prevQ = mine && mine.meta && mine.meta.q, prevT = mine && mine.meta && mine.meta.topic;
      const named = raw.match(/\b(?:my name is|my name's|call me|i'm|i am|it's)\s+([a-z]{2,16})\b/i), cased = named && (/name|call/i.test(named[0]) || /^[A-Z]/.test(named[1]));
      const topic = topicIn(t);
      if (named && cased && !/^(Tired|Fine|Good|Okay|Ok|Sorry|Here|Back|Not|So|Just|Sure)$/.test(named[1])) { U.name = cap(named[1].toLowerCase()); slots.user = U.name; push(c, m, P, 0.08, 0.05); return pick(k, P, L.userName, slots); }
      if (/\b(stupid|idiot|ugly|shut up|boring|hate you|dumb|annoying|loser|jerk)\b/.test(t)) { U.like = cl((U.like || 0) - 0.25, -1, 1); push(c, m, P, -0.3, 0.3); return pick(k, P, L.rude, slots); }
      if (/\byou('re| are) (so )?(great|lovely|nice|funny|smart|kind|cool|awesome|sweet|amazing|clever)\b|\bi like you\b|\bnice (hair|shirt|smile|outfit)\b/.test(t)) { U.like = cl((U.like || 0) + 0.15, -1, 1); push(c, m, P, 0.25, 0.15); return pick(k, P, L.nice, slots); }
      // how they feel: everyone answers it in their way; those good with people read it, and ask after it later
      if (/\bi('m| am| feel)( so| really| a bit| kind of| pretty)? (tired|exhausted|sad|down|stressed|worried|lonely|upset|awful|terrible|miserable|anxious|scared)\b|\b(bad|rough|long|awful) day\b/.test(t)) {
        U.feel = 'low'; push(c, m, P, -0.04 * d.warm, 0.05);
        return pick(k, P, P.knack === 'people' && P.smarts >= 3 && Math.random() < 0.6 ? IQ.feelRead : IQ.feelLow, slots);
      }
      if (/\bi('m| am| feel)( so| really| pretty)? (happy|great|excited|fantastic|wonderful|proud)\b|\b(great|good|best) day\b/.test(t)) { U.feel = 'up'; push(c, m, P, 0.12 * d.warm, 0.08); return pick(k, P, IQ.feelUp, slots); }
      // a sum, asked: worked out as sharply as they are
      const mt = raw.match(SUM);
      if (mt && (/\?|\bwhat|how much|work out|calculate|equals?|=/.test(t) || t.trim().length < 18)) return sum(k, P, mt);
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
      if (/\?\s*$/.test(t)) return pick(k, P, tierOf(P) === 'hi' && Math.random() < 0.7 ? IQ.unsure.hi : L.unknownQ, slots);
      // something else: a word back, and now and then on to one of their own things
      let s = pick(k, P, L.told, slots);
      if (d.talk > 0.5 && Math.random() < 0.5) { const tp = P.likes[Math.floor(Math.random() * P.likes.length)], q = Math.random() < d.curious; s += ' ' + topicLine(k, P, tp, q); setMeta({ topic: tp, q }); }
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
      bits.push('feeling ' + moodName(c, m, P));
      return bits.join('; ') + '.';
    }
    return { profile, observe, line, reset, knows, plan, aside, moodOf: (k) => { const c = o.card(k); return c ? moodName(c, memOf(c), profile(c)) : ''; } };
  }

  function create(o) {
    const KEY = o.storage || 'hf-minds', url = o.url || API, budget = o.budget || 300, changed = () => o.changed && o.changed();
    // the owner's key (asked once a device; the server answers nobody else) and the model: 'haiku' (cheap) or 'opus'
    const OWN = KEY + '-key', MOD = KEY + '-model';
    const brain = Brain({ storage: KEY, card: (k) => o.card(k), nameOf: (k) => M.nameOf(k), sights: o.sights, scene: o.scene });
    const send = (body) => fetch(url, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, M.key ? { 'x-persona-key': M.key } : {}), body: JSON.stringify(body) });
    const why = (a) => { if (a.spend) M.spend = a.spend; if (a.error === 'off') M.server = false; return a.why || 'They could not answer just now.'; };
    const cool = new Map();  // key -> { 'kind|by': time }
    const ids = new WeakMap(); let nid = 0;
    const idOf = (x) => (typeof x === 'object' ? (ids.has(x) ? ids.get(x) : (ids.set(x, ++nid), nid)) : x);
    let next = 0, turn = 0, rid = 0;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // a line meant for k: to them, or to a group they are in; the round of yours k is answering (a group line not yet answered)
    const mine = (l, k) => l.to === k || (l.p === 'you' && !!l.group && l.group.includes(k));
    const roundOf = (k) => {
      for (let i = M.lines.length - 1; i >= 0; i--) { const l = M.lines[i]; if (l.p === k && l.to === 'you') return undefined; if (l.p === 'you' && mine(l, k)) return l.group ? l.id : undefined; }
      return undefined;
    };
    const M = {
      lines: [], asked: 0, busy: new Set(), status: '', server: null, chatter: false, left: CHATTER,
      spend: null, cost: 0,  // the meter: { spent, cap, lines, day } in US$ (today, Central time), and the last line's cost
      get key() { return store(OWN) || ''; },
      set key(v) { store(OWN, String(v || '').trim()); M.status = ''; M.meter(); },
      // who speaks: 'local' (the built-in mind, free, the default) or a model on the server: 'haiku', 'sonnet', 'opus'
      get model() { const v = store(MOD); return SPEAKERS.includes(v) ? v : 'local'; },
      set model(v) { v = String(v || '').replace(/^claude-/, '').split('-')[0]; store(MOD, SPEAKERS.includes(v) ? v : 'local'); M.status = ''; if (M.model !== 'local' && M.on) M.check(); changed(); },
      // the built-in mind answers: chosen, or the server is not set up, or no owner key on this device
      get local() { return M.model === 'local' || M.server === false || !M.key; },
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
      async ask(k, to = 'you', ev = null) {
        if (!M.can(k) || (to !== 'you' && to != null && !M.can(to)) || M.busy.has(k)) return null;
        if (M.model !== 'local' && M.server === null) await M.check();
        if (M.local) return M.think(k, to, ev);
        if (ev && !SERVER.includes(ev.kind)) return null;
        if (M.asked >= budget) { M.status = `That's ${budget} lines this visit; reload the page for more.`; changed(); return null; }
        const log = M.lines.filter((l) => l.p === k || mine(l, k) || (to !== 'you' && to != null && (l.p === to || l.to === to))).slice(-12).map((l) => ({ who: l.who, said: l.said }));
        const e = ev && { kind: ev.kind, who: ev.by != null ? M.nameOf(ev.by) : String(ev.who || '').slice(0, 40), what: String(ev.what || '').slice(0, 60), where: ev.where || '', danger: !!ev.danger, feet: ev.feet ? Math.round(ev.feet) : undefined };
        M.busy.add(k); M.asked++; M.status = ''; changed();
        try {
          const r = await send({ me: o.card(k), to: to === 'you' || to == null ? 'you' : o.card(to), scene: o.scene ? o.scene(k, to, ev) : '', log, event: e || undefined, model: M.model });
          const a = await r.json().catch(() => ({}));
          if (!r.ok) { M.status = why(a); if (a.error === 'cap') M.chatter = false; return null; }
          if (a.spend) { M.spend = a.spend; M.cost = a.cost || 0; }
          if (!o.people().includes(k)) return null;
          M.lines.push({ p: k, to: ev ? (ev.by != null ? ev.by : null) : to, who: M.nameOf(k), said: a.say, ev: ev ? ev.kind : undefined, t: Date.now() / 1000, round: to === 'you' ? roundOf(k) : undefined });
          if (o.show) o.show(k, a, to, ev);
          return a;
        } catch (err) { M.status = 'They could not answer just now.'; return null; } finally { M.busy.delete(k); changed(); }
      },
      // the built-in mind's line, after a moment's thought (longer for the slow and the shy)
      async think(k, to, ev) {
        M.busy.add(k); changed();
        try {
          const P = brain.profile(o.card(k));
          await new Promise((r) => setTimeout(r, Math.max(250, 350 + Math.random() * 600 + (1 - P.d.energy) * 500 + P.d.shy * 400 - P.d.smart * 200)));
          if (!o.people().includes(k) || !M.on) return null;
          const a = brain.line(k, to == null && !ev ? 'you' : to, ev, M.lines); if (!a) return null;
          M.lines.push({ p: k, to: ev ? (ev.by != null ? ev.by : null) : to == null ? 'you' : to, who: M.nameOf(k), said: a.say, ev: ev ? ev.kind : undefined, t: Date.now() / 1000, meta: a.meta, round: !ev && (to == null || to === 'you') ? roundOf(k) : undefined });
          if (M.lines.length > 400) M.lines.splice(0, 100);
          if (o.show) o.show(k, a, ev && ev.kind === 'muse' ? null : to, ev && ev.kind === 'muse' ? null : ev);
          return a;
        } finally { M.busy.delete(k); changed(); }
      },
      // what someone has learned, in a few words (the built-in mind's memory)
      knows: (k) => (o.card(k) ? brain.knows(k) : ''),
      // forget everything everyone has learned (in this browser)
      unlearn() { brain.reset(); changed(); },
      // you say something to a group (keys): those it is for answer you in turn, each hearing the ones before; two who
      // find they like the same thing may say so to each other. Resolves to the lines said
      async tellAll(keys, text, label = 'you, to everyone') {
        text = String(text || '').trim().slice(0, 400); keys = [...new Set(keys)].filter((k) => M.can(k));
        if (!text || !keys.length) return [];
        if (keys.length === 1) { const a = await M.tell(keys[0], text); return a ? [a] : []; }
        const id = ++rid, line = { p: 'you', to: 'group', group: keys, id, who: label, said: text, t: Date.now() / 1000 };
        M.lines.push(line); M.left = CHATTER; changed();
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
        M.lines.push({ p: 'you', to: k, who: 'you', said: text, t: Date.now() / 1000 });
        M.left = CHATTER;
        return M.ask(k, 'you');
      },
      // something happened to them; they react (at most once per COOL seconds for the same thing)
      event(k, ev) {
        if (!M.can(k) || !ev || !COOL[ev.kind] || M.busy.has(k)) return false;
        const now = Date.now() / 1000, c = cool.get(k) || {}, id = ev.kind + '|' + (ev.by != null ? idOf(ev.by) : ev.who || ev.what || '');
        if (now - (c[id] || -1e9) < COOL[ev.kind] || now - (c.any || -1e9) < 6) return false;
        c[id] = c.any = now; cool.set(k, c);
        brain.observe(k, ev);
        M.ask(k, null, ev);
        return true;
      },
      forget(k) { M.lines = M.lines.filter((l) => l.p !== k && l.to !== k); cool.delete(k); changed(); },
      // what k said and heard: lines to them, and the whole of any group round they were in
      logOf(k) {
        const ids = new Set(M.lines.filter((l) => l.group && l.group.includes(k)).map((l) => l.id));
        return M.lines.filter((l) => l.p === k || mine(l, k) || (l.round && ids.has(l.round)) || (l.ev === 'aside' && l.to === k)).slice(-30);
      },
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
        const who = o.people().filter((k) => M.can(k)); if (who.length < (M.local ? 1 : 2)) return;
        if (M.left <= 0 && !M.local) { M.chatter = false; M.status = 'They have stopped talking among themselves; say something, or start them again.'; changed(); return; }
        next = now + GAP[0] + Math.random() * (GAP[1] - GAP[0]);
        const k = who[turn++ % who.length], to = o.nearest ? o.nearest(k) : who.find((q) => q !== k);
        // the built-in mind: now and then, or with nobody to talk to, they remark on what is round them or on their mind
        if (M.local && (to == null || !M.can(to) || Math.random() < 0.22)) { M.ask(k, null, { kind: 'muse' }); return; }
        if (to == null || !M.can(to)) return;
        if (!M.local) M.left--;
        M.ask(k, to);
      },
    };
    return M;
  }

  // what a line costs, roughly (about 1,200 tokens in and 300 out, at each model's price): for the meter's estimates
  const LINE = { haiku: 0.00027, sonnet: 0.0054, opus: 0.0108 };
  const NAMES = { local: 'Built-in', haiku: 'Haiku', sonnet: 'Sonnet', opus: 'Opus' }, NAME = NAMES;
  // under a dollar in cents, so line costs compare at a glance (0.03¢, 0.54¢, 1.1¢); a dollar or more as dollars
  const money = (v) => { v = +v || 0; if (v >= 1) return '$' + v.toFixed(2); const c = v * 100; return (c >= 10 ? c.toFixed(0) : c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '\u00a2'; };
  const dollars = (v) => '$' + (+v || 0).toFixed(2);
  // the meter in words: today's spend of the cap, lines, and about how many more at the model picked
  function meterText(M) {
    if (M.model === 'local') return 'Built-in: free, made in this browser. They notice what happens round them, remember who they have met, what people like and what scared them, and their mood moves with it.';
    const s = M.spend; if (!s) return M.key ? 'Reading the meter...' : 'Enter the owner key for ' + NAMES[M.model] + '; until then the built-in mind speaks.';
    const left = Math.max(0, s.cap - s.spent), n = Math.floor(left / LINE[M.model]);
    return `Today: ${money(s.spent)} of ${dollars(s.cap)} (${s.lines} line${s.lines === 1 ? '' : 's'})` + (M.cost ? `, last line ${money(M.cost)}` : '') +
      `. About ${n.toLocaleString()} more at ${NAMES[M.model]}.`;
  }
  // a small panel for any page: who speaks (the built-in mind or a model), the owner key, the daily cap and the meter, and
  // forgetting what the built-in minds have learned (o.button: a class for
  // the buttons, o.on: the class a picked one gets); returns paint(), to call when M changes
  function controls(el, M, o = {}) {
    const B = o.button || '', ON = o.on || 'on', caps = [0.5, 1, 2, 5, 10];
    el.innerHTML = `<div class="hfm-row"><span>Who speaks</span><button class="${B}" data-m="local">Built-in, free</button><button class="${B}" data-m="haiku">Haiku, ~${money(LINE.haiku)} a line</button><button class="${B}" data-m="sonnet">Sonnet, ~${money(LINE.sonnet)} a line</button><button class="${B}" data-m="opus">Opus, ~${money(LINE.opus)} a line</button></div>
      <div class="hfm-row" data-paid><span>Owner key</span><input type="password" autocomplete="off" placeholder="${M.key ? 'saved on this device' : 'the key from Vercel'}"><button class="${B}" data-a="key">Save</button></div>
      <div class="hfm-row" data-paid><span>Daily cap</span>${caps.map((c) => `<button class="${B}" data-c="${c}">${dollars(c)}</button>`).join('')}</div>
      <div class="hfm-meter"></div>
      <div class="hfm-row"><span>Memory</span><button class="${B}" data-a="unlearn">Forget what they have learned</button></div>`;
    const inp = el.querySelector('input');
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') el.querySelector('[data-a=key]').click(); };
    el.querySelector('[data-a=key]').onclick = () => { if (inp.value.trim()) { M.key = inp.value; inp.value = ''; inp.placeholder = 'saved on this device'; } };
    el.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { M.model = b.dataset.m; paint(); }; });
    el.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => M.setCap(+b.dataset.c); });
    el.querySelector('[data-a=unlearn]').onclick = () => { if (typeof confirm === 'undefined' || confirm('Forget who everyone has met, what they like and what scared them (in this browser)?')) M.unlearn(); };
    function paint() {
      if (!el.isConnected) return;
      el.querySelectorAll('[data-m]').forEach((b) => { b.classList.toggle(ON, b.dataset.m === M.model); b.setAttribute('aria-pressed', String(b.dataset.m === M.model)); });
      el.querySelectorAll('[data-c]').forEach((b) => { const on = !!M.spend && +b.dataset.c === M.spend.cap; b.classList.toggle(ON, on); b.setAttribute('aria-pressed', String(on)); });
      el.querySelectorAll('[data-paid]').forEach((r) => { r.style.display = M.model === 'local' ? 'none' : ''; });
      el.querySelector('.hfm-meter').textContent = meterText(M) + (M.status && M.model !== 'local' ? ' ' + M.status : '');
    }
    paint(); if (M.key && !M.spend && M.model !== 'local') M.meter();
    return paint;
  }

  root.HumanForgeMind = { TRAITS, MOODS, PARTS, SMARTS, KNACKS, VALUES, LIKES, describe, ADULT, API, COOL, LINE, NAME, TOPICS, roll, card, partOf, create, controls, meterText, money, Brain };
})(typeof window !== 'undefined' ? window : globalThis);
