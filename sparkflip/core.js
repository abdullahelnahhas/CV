/* SparkFlip prototype core.
   Shared by all five design directions: seed data, state, the drag gesture,
   keyboard shortcuts, and the strip that links the directions together.
   Each design page owns its own markup, styles and rendering. */
(function () {
  'use strict';

  const MIN = 15;          // characters before a reply can be sent
  const MIN_THOUGHT = 10;  // characters before a thought can be posted
  const MAX = 280;         // longest thought
  const CATS = ['Business Idea', 'Life Dilemma', 'Weird Invention', 'Shower Thought', 'Social Experiment'];

  let seq = 0;
  const nid = (p) => p + (++seq);
  const R = (author, text, helpful, tag) => ({ id: nid('r'), author, text, helpful, tag: tag || null });
  const T = (cat, author, ago, text, advice, downsides) => ({
    id: nid('t'), cat, author, ago, text, advice, downsides,
    best: { advice: null, downside: null }, votes: { good: 0, bad: 0 }
  });

  /* ---------- Seed: the public deck ---------- */
  const feed = [
    T('Business Idea', '@latte_nomad', '14m ago',
      'A coworking café that charges by the minute instead of by the coffee. Espresso is free for as long as you’re on the clock.',
      [R('@saas_builder', 'Cap the day at $24. Nobody does deep work while watching a taxi meter.', 14),
       R('@barista_pro', 'Sell day passes to companies, not people. HR budgets don’t flinch at $24.', 8)],
      [R('@unit_econ', 'Your best customers stay longest, and they’re exactly the ones who hit the cap and stop paying.', 11)]),
    T('Life Dilemma', '@crossroads_29', '32m ago',
      'Safe 35% raise at a boring company, or a role at a 4-person startup with 6 months of runway? I’m 29, no kids.',
      [R('@founder_ex', 'Ask the startup to show you the bank balance. Founders who won’t have given you your answer.', 22),
       R('@career_coach', 'With 6 months of savings, your worst case is a good story and a job hunt next year.', 9)],
      [R('@pragmatist', 'Six months of runway means they’re fundraising right now. You’d be hired into a pitch deck, not a product.', 19)]),
    T('Weird Invention', '@tinker_lab', '1h ago',
      'A pillowcase that wakes only you: gentle vibration near your ear, no sound for whoever is asleep next to you.',
      [R('@sleep_nerd', 'Make the motor a removable puck so the case survives the washing machine.', 17)],
      [R('@heavy_sleeper', 'Stomach sleepers and pillow-throwers will sleep straight through their flight.', 15)]),
    T('Shower Thought', '@midnight_brain', '2h ago',
      'Delayed gates should have nap pods you rent by the 15 minutes. Your boarding pass unlocks one and it wakes you when boarding starts.',
      [R('@ux_traveler', 'Let the airline pay for it as a delay apology. Cheaper than meal vouchers.', 29)],
      [R('@ops_manager', 'Cleaning a pod after every 15-minute guest needs one cleaner for every six pods.', 13)]),
    T('Social Experiment', '@city_connector', '3h ago',
      'A weekly dinner where every phone goes into a locked box. The first person to ask for theirs back pays the whole bill.',
      [R('@host_with_most', 'Put a deck of absurd debate questions on the table to get through the first ten awkward minutes.', 12)],
      [R('@on_call_dev', 'Parents and on-call people can’t come without an emergency exception, and then everyone has an emergency.', 7)]),
    T('Business Idea', '@green_thumb', '4h ago',
      'Plant-sitting by the visit: a vetted neighbour waters your plants and sends a photo while you’re away. $10 a visit.',
      [R('@rover_vet', 'Bundle in mail, blinds and a quick look around. People pay $25 for “is my place okay?”, not for watering.', 21)],
      [R('@trust_safety', 'Handing a stranger your keys to water a $15 fern is a very big ask.', 18)]),
    T('Life Dilemma', '@quiet_maple', '5h ago',
      'My best friend asked me to co-sign the lease on her first apartment. I trust her, but I’ve seen this go wrong. How do I say no and keep her?',
      [R('@boundaries_bo', 'Offer something concrete instead: help with the deposit, or a written reference for the landlord.', 16)],
      [R('@been_there', 'If you sign, the lease is on your credit too. Late rent shows up on your report, not only hers.', 20)]),
    T('Weird Invention', '@commute_hacker', '6h ago',
      'Sunglasses with tiny speakers in the arms that cancel subway noise without anything in your ears.',
      [R('@audio_eng', 'Start with bone conduction for your own audio. Cancellation can wait for version two.', 9)],
      [R('@physics_101', 'Open-air cancellation works on low drones, not voices. The loud guy on the phone stays loud.', 14)]),
    T('Shower Thought', '@retro_futurist', '7h ago',
      'Streaming apps should have a comfort-rerun button that plays a random episode of something you’ve already finished.',
      [R('@product_pm', 'Let people choose which shows go in the pool. Nobody wants the sad finale on shuffle.', 16)],
      [R('@binge_watcher', 'Useless for serialised dramas. A random episode spoils the twists for whoever is watching with you.', 6)]),
    T('Social Experiment', '@slow_mornings', '9h ago',
      'One shared tool shelf for my building (drill, ladder, sewing kit) instead of 40 flats each owning a drill they use twice a year.',
      [R('@fixit_fran', 'Start with a sign-out sheet and five donated tools. If it survives a month, ask the landlord for a cabinet.', 11)],
      [R('@realist_ray', 'The ladder disappears in week two and nobody knows who had it last.', 10)])
  ];

  /* ---------- Seed: the viewer's own thoughts ---------- */
  const mine = [
    T('Business Idea', '@you', '2h ago',
      'An app that matches two strangers stuck in the same terminal on a 3+ hour layover, so they can split a lounge pass or grab a drink.',
      [R('@frequent_flyer', 'Check flight numbers live, so both people know the other is really stuck at gate B12.', 18),
       R('@growth_hacker', 'Partner with airport bars on a two-for-one layover drink. Revenue on day one.', 11),
       R('@solo_traveler', 'Add a “watch my bags” mode. Half of solo travellers need that more than a drink.', 9)],
      [R('@safety_first', 'Meeting a stranger you can’t walk away from until boarding is a real safety worry, especially travelling alone.', 14),
       R('@marketplace_vc', 'Two active users in the same terminal in the same hour needs enormous scale.', 12)]),
    T('Life Dilemma', '@you', 'Yesterday',
      'Move to a city where I know nobody for a fresh start, or stay near lifelong friends even though I feel stuck?',
      [R('@nomad_kate', 'Treat it as a one-year experiment, not forever. Join a weekly sport in your first week.', 25),
       R('@stoic_mind', 'Your real friends will still be there in a year, and you’ll come back with better stories.', 15)],
      [R('@city_realist', 'Adult friendships take 6 to 12 months. Expect the first three to be lonelier than you think.', 19)])
  ];
  mine.forEach((t) => { t.mine = true; });
  mine[0].best.downside = mine[0].downsides[1].id;
  mine[1].best.advice = mine[1].advice[0].id;

  /* ---------- Product layer: crowd votes, feedback tags, useful marks ---------- */
  const ANGEL_TAGS = ['First step', 'Shortcut', 'Who to ask', 'Cheaper', 'Safer'];
  const DEVIL_TAGS = ['Money', 'Demand', 'Competition', 'Execution', 'Safety', 'Timing'];
  const SEED = [
    // [good, bad], angel tags, devil tags
    [[41, 23], ['Cheaper', 'Who to ask'], ['Money']],
    [[18, 27], ['First step', 'Safer'], ['Timing']],
    [[52, 19], ['Shortcut'], ['Execution']],
    [[77, 12], ['Who to ask'], ['Money']],
    [[33, 30], ['First step'], ['Demand']],
    [[21, 34], ['Shortcut'], ['Safety']],
    [[9, 44], ['Safer'], ['Money']],
    [[26, 31], ['First step'], ['Execution']],
    [[61, 14], ['Shortcut'], ['Execution']],
    [[48, 17], ['First step'], ['Execution']]
  ];
  feed.forEach((t, i) => {
    const [v, at, dt] = SEED[i];
    t.votes = { good: v[0], bad: v[1] };
    t.advice.forEach((r, k) => { r.tag = at[k] || null; });
    t.downsides.forEach((r, k) => { r.tag = dt[k] || null; });
  });
  [[[38, 22], ['First step', 'Who to ask', 'Shortcut'], ['Safety', 'Demand']], [[29, 11], ['First step', 'Safer'], ['Timing']]].forEach(([v, at, dt], i) => {
    const t = mine[i];
    t.votes = { good: v[0], bad: v[1] };
    t.advice.forEach((r, k) => { r.tag = at[k] || null; });
    t.downsides.forEach((r, k) => { r.tag = dt[k] || null; });
  });
  mine[0].advice[0].useful = true;
  mine[0].downsides[1].useful = true;
  mine[1].advice[0].useful = true;

  /* Replies that "arrive" on a freshly posted thought. Generic enough for any category. */
  const INCOMING = [
    [3500, 'advice', '@first_reply', 'Do the smallest test of this you can this week, then decide with real information instead of guesses.', 'First step'],
    [7500, 'downside', '@cold_water', 'The part you’re most excited about is probably the part you’ve tested least. Check that first.', 'Demand'],
    [12500, 'advice', '@said_it_aloud', 'Say it to a friend out loud in one sentence. If it sounds strange, you’ll hear it before anyone else does.', 'Shortcut']
  ];
  const INCOMING_VOTES = [[1500, 2, 0], [2800, 1, 1], [4200, 3, 0], [6000, 1, 2], [8500, 4, 1], [11000, 2, 1]];

  /* ---------- State + events ---------- */
  const state = { feed, mine, done: new Set(), karma: 4, unread: 0, given: { advice: 3, downside: 1 },
    sparks: 5, votesCast: 41, withCrowd: 27, usefulMarks: 9, path: [], dayVotes: 0, dayWith: 0 };
  const POST_COST = 3;
  const DAILY = 10;
  const listeners = {};
  const on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
  const emit = (evt, data) => { (listeners[evt] || []).forEach((fn) => fn(data)); };

  const queue = () => state.feed.filter((t) => !state.done.has(t.id));
  const current = () => queue()[0] || null;
  const position = () => ({ index: Math.min(state.done.size + 1, state.feed.length), total: state.feed.length, left: queue().length });

  function check(text, min) {
    const need = min || MIN;
    const len = (text || '').trim().length;
    return { len, ok: len >= need, need: Math.max(0, need - len) };
  }

  function respond(t, kind, text, tag) {
    const r = R('@you', text.trim(), 1, tag);
    r.fresh = true;
    (kind === 'advice' ? t.advice : t.downsides).unshift(r);
    state.done.add(t.id);
    state.karma += 1;
    state.given[kind] += 1;
    state.sparks += 1;
    state.path.push(kind === 'advice' ? 'angel' : 'devil');
    emit('change');
    return r;
  }

  function skip(t) { state.done.add(t.id); state.path.push('skip'); emit('change'); }
  function reset() { state.done.clear(); state.path = []; state.dayVotes = 0; state.dayWith = 0; emit('change'); }

  /* A blind verdict: the crowd split is only revealed after you vote. */
  function vote(t, good) {
    const before = t.votes.good + t.votes.bad;
    const crowdGood = before ? t.votes.good / before >= 0.5 : true;
    t.votes[good ? 'good' : 'bad'] += 1;
    const total = t.votes.good + t.votes.bad;
    const pg = Math.round((t.votes.good / total) * 100);
    const withCrowd = good === crowdGood;
    state.done.add(t.id);
    state.votesCast += 1;
    state.dayVotes += 1;
    if (withCrowd) { state.withCrowd += 1; state.dayWith += 1; }
    state.path.push(good ? 'good' : 'bad');
    emit('change');
    return { pg, pb: 100 - pg, total, withCrowd };
  }
  function verdict(t) {
    const total = t.votes.good + t.votes.bad;
    const pg = total ? Math.round((t.votes.good / total) * 100) : 50;
    const name = total < 5 ? 'Being judged' : pg >= 60 ? 'Blessed' : pg <= 40 ? 'Damned' : 'In limbo';
    return { name, pg, pb: 100 - pg, total };
  }
  function tagCounts(t, kind) {
    const out = {};
    (kind === 'advice' ? t.advice : t.downsides).forEach((r) => { const k = r.tag || 'Other'; out[k] = (out[k] || 0) + 1; });
    return Object.entries(out).sort((a, b) => b[1] - a[1]);
  }
  function toggleUseful(t, kind, rid) {
    const r = (kind === 'advice' ? t.advice : t.downsides).find((x) => x.id === rid);
    if (r) { r.useful = !r.useful; emit('change'); }
    return r;
  }
  /* Who you are, from what you actually do. */
  const PERSONAS = [
    { min: 80, name: 'The Guardian', line: 'You see the version of an idea that works, and you hand people the first step.' },
    { min: 60, name: 'The Architect', line: 'Mostly a builder, but you’ll name the crack before it spreads.' },
    { min: 41, name: 'The Oracle', line: 'You play both sides honestly. Posters trust you because you’re not on a team.' },
    { min: 21, name: 'The Advocate', line: 'You stress-test ideas. Better they hear it from you than from the market.' },
    { min: 0, name: 'The Inquisitor', line: 'Nothing gets past you. Keep your devils useful, not just sharp.' }
  ];
  function persona() {
    const al = alignment();
    const p = PERSONAS.find((x) => al.pa >= x.min);
    const crowd = state.votesCast ? Math.round((state.withCrowd / state.votesCast) * 100) : 50;
    const mod = crowd >= 65 ? 'In tune with the crowd' : crowd <= 45 ? 'Contrarian' : 'Independent';
    return { name: p.name, line: p.line, crowd, mod, align: al, ladder: PERSONAS };
  }

  function stats(t) {
    const a = t.advice.length, d = t.downsides.length, total = a + d;
    const pa = total ? Math.round((a / total) * 100) : 50;
    return { a, d, total, pa, pd: 100 - pa };
  }

  /* The viewer's own lean: how often they play the angel vs the devil. */
  function alignment() {
    const a = state.given.advice, d = state.given.downside, total = a + d;
    const pa = total ? Math.round((a / total) * 100) : 50;
    return { a, d, total, pa, pd: 100 - pa };
  }

  function toggleBest(t, kind, rid) {
    t.best[kind] = t.best[kind] === rid ? null : rid;
    emit('change');
  }

  /* Replies sorted with the author's pick first. kind: 'advice' | 'downside' */
  function sorted(t, kind) {
    const list = (kind === 'advice' ? t.advice : t.downsides).slice();
    const b = t.best[kind];
    return list.sort((x, y) => (y.id === b) - (x.id === b));
  }

  function post({ text, cat, alias }) {
    const clean = (alias || '').trim().replace(/^@+/, '').replace(/\s+/g, '_');
    const t = T(cat || CATS[0], clean ? '@' + clean : '@you', 'Just now', text.trim(), [], []);
    t.mine = true;
    state.mine.unshift(t);
    state.sparks = Math.max(0, state.sparks - POST_COST);
    INCOMING_VOTES.forEach(([delay, g, b]) => {
      setTimeout(() => { t.votes.good += g; t.votes.bad += b; emit('vote', { thought: t }); emit('change'); }, delay);
    });
    INCOMING.forEach(([delay, kind, author, txt, tag], i) => {
      setTimeout(() => {
        const r = R(author, txt, 2 + i, tag);
        r.fresh = true;
        (kind === 'advice' ? t.advice : t.downsides).push(r);
        state.unread += 1;
        emit('reply', { thought: t, kind, reply: r });
        emit('change');
      }, delay);
    });
    emit('change');
    return t;
  }

  /* ---------- Saving on the device (phone build) ----------
     Everything you do is kept in this browser. A new day brings a fresh deck of ten. */
  const SCALARS = ['karma', 'sparks', 'votesCast', 'withCrowd', 'usefulMarks'];
  function persist(key) {
    const day = () => new Date().toDateString();
    try {
      const raw = localStorage.getItem(key);
      const d = raw ? JSON.parse(raw) : null;
      if (d && d.v === 1 && Array.isArray(d.feed) && Array.isArray(d.mine)) {
        state.feed.splice(0, state.feed.length, ...d.feed);
        state.mine.splice(0, state.mine.length, ...d.mine);
        SCALARS.forEach((k) => { if (typeof d[k] === 'number') state[k] = d[k]; });
        if (d.given) state.given = d.given;
        if (d.day === day()) {
          state.done = new Set(d.done || []);
          state.path = d.path || [];
          state.dayVotes = d.dayVotes || 0;
          state.dayWith = d.dayWith || 0;
        }
        seq = Math.max(seq, d.seq || 0);
      }
    } catch (_) { /* storage unavailable: run in memory */ }
    let timer = 0;
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const d = { v: 1, day: day(), seq, feed: state.feed, mine: state.mine, done: Array.from(state.done), path: state.path,
          given: state.given, dayVotes: state.dayVotes, dayWith: state.dayWith };
        SCALARS.forEach((k) => { d[k] = state[k]; });
        try { localStorage.setItem(key, JSON.stringify(d)); } catch (_) { /* ignore */ }
      }, 200);
    };
    on('change', save);
    return { clear() { try { localStorage.removeItem(key); } catch (_) { /* ignore */ } } };
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* Pointer drag with left / right / up commitment.
     o.move(dx, dy, progress 0..1, side) while dragging; o.end(dir|null, dx, dy) on release. */
  function drag(el, o) {
    const thr = o.threshold || 96;
    const upThr = o.up || 110;
    let sx = 0, sy = 0, dx = 0, dy = 0, pid = null;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      if (pid !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button, a, input, textarea, label, [data-nodrag]')) return;
      if (o.enabled && !o.enabled()) return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; dy = 0;
      try { el.setPointerCapture(pid); } catch (_) { /* ignore */ }
      if (o.start) o.start();
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      if (o.move) o.move(dx, dy, Math.min(1, Math.abs(dx) / thr), dx >= 0 ? 'right' : 'left');
    });
    const finish = (e, cancelled) => {
      if (e.pointerId !== pid) return;
      pid = null;
      try { el.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      let dir = null;
      if (!cancelled) {
        if (dx > thr) dir = 'right';
        else if (dx < -thr) dir = 'left';
        else if (dy < -upThr && Math.abs(dx) < thr * 0.75) dir = 'up';
      }
      if (o.end) o.end(dir, dx, dy);
    };
    el.addEventListener('pointerup', (e) => finish(e, false));
    el.addEventListener('pointercancel', (e) => finish(e, true));
  }

  /* Arrow keys for desktop testing. Escape always goes to map.escape. */
  function keys(map, enabled) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && map.escape) { map.escape(); return; }
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (enabled && !enabled()) return;
      const k = { ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up' }[e.key];
      if (k && map[k]) { e.preventDefault(); map[k](); }
    });
  }

  function toast(el, msg, ms) {
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }

  /* ---------- Shared page frame: the direction switcher + phone stage ---------- */
  const DESIGNS = [
    { file: 'halo.html', name: 'Halo', note: 'Liquid glass. Drag right and a halo forms over the idea; drag left and horns grow out of it.' },
    { file: 'versus.html', name: 'Versus', note: 'A game. Every idea has integrity points: angels build them up, devils knock them down.' },
    { file: 'blocks.html', name: 'Blocks', note: 'Every idea is a tower. Angels stack a block on it, devils swing the wrecking ball.' },
    { file: 'ember.html', name: 'Ember', note: 'Cinematic. Angel replies lift the card into light; devil replies burn it to embers.' },
    { file: 'whisper.html', name: 'Whisper', note: 'The angel and the devil on your shoulder. Every idea turns into a debate you read like a chat.' },
    { file: 'limbo.html', name: 'Limbo', note: 'Whisper and Ember merged. The angel and the devil wait in light and fire; whoever you play takes the idea.' },
    { file: 'app.html', name: 'SparkFlip', note: 'The product prototype. Swipe right for good, left for bad, up to play angel, down to play devil.' }
  ];

  const FRAME_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{height:100%;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);-webkit-text-size-adjust:100%}
body{height:100%;margin:0;display:flex;flex-direction:column;background:var(--stage);color:var(--stage-ink)}
[hidden]{display:none!important}
button,input,textarea,select{font:inherit;color:inherit;letter-spacing:inherit}
button{cursor:pointer}
.sf-rail{flex:none;display:flex;align-items:center;gap:14px;padding-block:10px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--stage-ink)}
.sf-rail a{color:inherit;text-decoration:none;border-radius:8px}
.sf-rail a:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.sf-rail-home{flex:none;opacity:.72;white-space:nowrap}
.sf-rail-home:hover{opacity:1}
.sf-rail-now{flex:1;min-width:0;display:flex;align-items:baseline;justify-content:center;gap:10px;white-space:nowrap}
.sf-rail-n{opacity:.55;font-variant-numeric:tabular-nums}
.sf-rail-now b{font-weight:650}
.sf-rail-note{opacity:.72;overflow:hidden;text-overflow:ellipsis;min-width:0}
.sf-rail-step{flex:none;display:flex;gap:6px}
.sf-rail-step a{width:32px;height:32px;display:grid;place-items:center;border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:50%}
.sf-rail-step a:hover{border-color:currentColor}
.sf-stage{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;padding:2px 16px 20px}
.sf-device{position:relative;flex:0 1 820px;min-height:620px;width:390px;margin:auto;overflow:hidden;border-radius:34px;isolation:isolate;box-shadow:0 34px 70px -28px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.12)}
@media (max-width:560px){
  .sf-rail{padding-block:6px;gap:10px}
  .sf-rail-note{display:none}
  .sf-stage{padding:0}
  .sf-device,.sf-stage .sf-device.app{flex:1 1 auto;width:100%;min-height:560px;margin:0;border-radius:0;box-shadow:none}
}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

  function rail(i) {
    const style = document.createElement('style');
    style.textContent = FRAME_CSS;
    document.head.prepend(style);
    const d = DESIGNS[i];
    const prev = DESIGNS[(i + DESIGNS.length - 1) % DESIGNS.length];
    const next = DESIGNS[(i + 1) % DESIGNS.length];
    const nav = document.createElement('nav');
    nav.className = 'sf-rail';
    nav.setAttribute('aria-label', 'Design directions');
    nav.innerHTML =
      `<a class="sf-rail-home" href="index.html">← All designs</a>` +
      `<div class="sf-rail-now"><span class="sf-rail-n">${i + 1}/${DESIGNS.length}</span><b>${esc(d.name)}</b><span class="sf-rail-note">${esc(d.note)}</span></div>` +
      `<div class="sf-rail-step"><a href="${prev.file}" aria-label="Previous direction: ${esc(prev.name)}">←</a><a href="${next.file}" aria-label="Next direction: ${esc(next.name)}">→</a></div>`;
    document.body.prepend(nav);
  }

  window.Spark = {
    MIN, MIN_THOUGHT, MAX, CATS, DESIGNS, state,
    on, emit, queue, current, position, check, respond, skip, reset, stats, alignment, toggleBest, sorted, post,
    vote, verdict, tagCounts, toggleUseful, persona, persist, ANGEL_TAGS, DEVIL_TAGS, POST_COST, DAILY,
    esc, drag, keys, toast, rail
  };
})();
