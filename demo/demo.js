(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width:980px)');
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // pane pulse + HUD metrics
  const hotT = {};
  const hot = id => {
    const el = document.getElementById('p-' + id); if (!el) return;
    el.classList.remove('hot'); void el.offsetWidth; el.classList.add('hot');
    clearTimeout(hotT[id]); hotT[id] = setTimeout(() => el.classList.remove('hot'), 1200);
  };
  const hud = { act: 0, msg: 0, t0: 0, raf: 0 };
  const sys = (t, cls) => { const e = $('#m-sys'); e.textContent = t; e.className = 'mono ' + (cls || ''); };
  const bump = (k, el) => { hud[k]++; const e = $(el); e.textContent = hud[k]; e.classList.remove('tick'); void e.offsetWidth; e.classList.add('tick'); };
  const speedEl = () => $('#m-speed');
  const startSpeed = () => {
    hud.t0 = performance.now(); cancelAnimationFrame(hud.raf); speedEl().classList.add('counting');
    const frame = () => { speedEl().textContent = ((performance.now() - hud.t0) / 1000).toFixed(2) + 's'; hud.raf = requestAnimationFrame(frame); };
    frame();
  };
  const stopSpeed = () => { if (!hud.raf) return; cancelAnimationFrame(hud.raf); hud.raf = 0; speedEl().classList.remove('counting'); speedEl().classList.add('tick'); };

  // theme, menu, year
  const root = document.documentElement;
  $('#theme').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('ky-theme', next); } catch (e) {}
  });
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = o => { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  $('#yr').textContent = new Date().getFullYear();

  // ---------- icons ----------
  const I = {
    bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8" r="1.5"/>',
    deal: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    sms: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    move: '<path d="M4 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4"/>',
    spin: '<path d="M12 3a9 9 0 1 0 9 9"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

  // ---------- workflow definition ----------
  const FLOWS = [
    { id: 'wf1', title: 'Workflow 1 · New lead intake', steps: [
      { k: 'trigger', ic: 'bolt', t: 'Trigger: Form submitted', s: 'Free inspection form' },
      { k: 'contact', ic: 'user', t: 'Create / update contact', s: 'Name, phone, email and source' },
      { k: 'tags', ic: 'tag', t: 'Add tags', s: 'new-lead · roofing · service' },
      { k: 'opp', ic: 'deal', t: 'Create opportunity', s: 'Roofing leads → New Lead' },
      { k: 'sms', ic: 'sms', t: 'Send SMS', s: 'Speed-to-lead text, under 60 seconds' },
      { k: 'email', ic: 'mail', t: 'Send email', s: 'Welcome + booking link' },
      { k: 'contacted', ic: 'move', t: 'Move opportunity', s: 'New Lead → Contacted' },
      { k: 'wait', ic: 'clock', t: 'Wait until booked', s: 'If no booking in 10 min, send a nudge SMS' }
    ] },
    { id: 'wf2', title: 'Workflow 2 · Call booked', steps: [
      { k: 'trigger2', ic: 'cal', t: 'Trigger: Appointment booked', s: 'Inspection calendar' },
      { k: 'booked', ic: 'move', t: 'Move opportunity', s: 'Contacted → Booked' },
      { k: 'tags2', ic: 'tag', t: 'Update tags', s: '+ booked · − new-lead' },
      { k: 'sms2', ic: 'sms', t: 'Send confirmation SMS', s: 'Date, time and reschedule option' },
      { k: 'notify', ic: 'bell', t: 'Notify owner', s: 'Internal alert to the sales rep' },
      { k: 'remind', ic: 'clock', t: 'Schedule reminders', s: '24 h and 1 h before the appointment' }
    ] }
  ];
  const wf = $('#wf'), node = {};
  const buildFlow = () => {
    wf.innerHTML = '';
    FLOWS.forEach(f => {
      wf.append(h('p', 'wf-h', f.title));
      const ol = h('ol');
      f.steps.forEach((st, i) => {
        const li = h('li', i === 0 ? 'trig' : '');
        const box = h('div', 'st-node');
        const ic = h('span', 'ic'); ic.innerHTML = svg(st.ic);
        const txt = h('div'); txt.append(h('b', '', st.t), h('small', '', st.s));
        const state = h('span', 'state', 'Idle');
        box.append(ic, txt, state); li.append(box); ol.append(li);
        node[st.k] = { li, ic, state, sub: txt.querySelector('small'), icon: st.ic, title: st.t };
      });
      wf.append(ol);
    });
  };
  const setNode = (k, cls, label, sub) => {
    const n = node[k];
    n.li.classList.remove('run', 'done', 'wait', 'skip');
    if (cls) n.li.classList.add(cls);
    n.state.textContent = label;
    n.ic.innerHTML = svg(cls === 'run' ? 'spin' : n.icon);
    if (sub) n.sub.textContent = sub;
    hot('flow');
    if (cls === 'run' || cls === 'wait') {
      const r = n.li.getBoundingClientRect(), w = wf.getBoundingClientRect();
      wf.scrollTop = Math.max(0, wf.scrollTop + r.top - w.top - wf.clientHeight / 2 + r.height / 2);
    }
  };

  // ---------- pipeline ----------
  const STAGES = ['New Lead', 'Contacted', 'Booked', 'Won'];
  const SEED = [
    ['New Lead', 'Dana R.', 'Leak repair', 1800],
    ['Contacted', 'Marcus T.', 'Roof inspection', 450],
    ['Booked', 'Priya K.', 'Full roof replacement', 14500],
    ['Won', 'Owen L.', 'Leak repair', 2100]
  ];
  const board = $('#board'), cols = {};
  const money = n => '$' + n.toLocaleString('en-US');
  const oppCard = (name, svc, val) => {
    const c = h('div', 'opp'); c.dataset.v = val;
    c.append(h('b', '', name), h('small', '', svc), h('span', 'v', money(val)));
    return c;
  };
  const tally = () => {
    let open = 0;
    STAGES.forEach(s => {
      const cards = $$('.opp', cols[s].list);
      const sum = cards.reduce((a, c) => a + +c.dataset.v, 0);
      cols[s].meta.textContent = `${cards.length} · ${money(sum)}`;
      if (s !== 'Won') open += cards.length;
    });
    $('#s-pipe').textContent = `${open} open`;
    hot('pipe');
  };
  const buildBoard = () => {
    board.innerHTML = '';
    STAGES.forEach(s => {
      const col = h('div', 'col'), head = h('div', 'col-h'), meta = h('span');
      head.append(h('b', '', s), meta);
      const list = h('div', 'cards-l');
      col.append(head, list); board.append(col);
      cols[s] = { col, list, meta };
    });
    SEED.forEach(([s, n, svc, v]) => cols[s].list.append(oppCard(n, svc, v)));
    tally();
  };
  const flash = s => { cols[s].col.classList.add('hit'); setTimeout(() => cols[s].col.classList.remove('hit'), 1100); };
  const moveCard = (card, stage) => {
    const a = card.getBoundingClientRect();
    cols[stage].list.prepend(card);
    const b = card.getBoundingClientRect();
    if (!reduce && card.animate) card.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(1.04)` }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.2,.7,.2,1)' });
    flash(stage); tally();
    const bl = board.getBoundingClientRect();
    if (b.left < bl.left || b.right > bl.right) board.scrollTo({ left: cols[stage].col.offsetLeft - 14, behavior: reduce ? 'auto' : 'smooth' });
  };

  // ---------- inbox ----------
  const thread = $('#thread');
  let msgCount = 0;
  const emptyInbox = () => { thread.innerHTML = ''; thread.append(h('p', 'empty', 'Messages the automation sends will appear here.')); msgCount = 0; $('#s-inbox').textContent = '0 messages'; };
  const scrollThread = () => { thread.scrollTop = thread.scrollHeight; };
  const addMsg = async (type, meta, body, subject) => {
    $('.empty', thread)?.remove();
    if (type !== 'note') {
      const dots = h('div', 'typing'); dots.innerHTML = '<i></i><i></i><i></i>';
      thread.append(dots); scrollThread();
      await sleep(reduce ? 150 : 1300); dots.remove();
    }
    const m = h('div', `msg ${type === 'note' ? 'note' : 'out'} ${type === 'mail' ? 'mail' : ''}`);
    m.append(h('span', 'meta', meta));
    const b = h('div', 'bub');
    if (subject) { b.append(h('b', '', subject), h('span', '', body)); } else b.textContent = body;
    m.append(b); thread.append(m); scrollThread();
    hot('inbox');
    if (type !== 'note') { bump('msg', '#m-msg'); msgCount++; $('#s-inbox').textContent = `${msgCount} message${msgCount > 1 ? 's' : ''}`; }
  };
  const setWho = (name, sub) => {
    const who = $('#who');
    who.innerHTML = '';
    const av = h('span', 'av', name[0].toUpperCase()), d = h('div');
    d.append(h('b', '', name), h('small', 'mono', sub));
    who.append(av, d); who.classList.remove('new'); void who.offsetWidth; who.classList.add('new');
  };
  const addTag = t => { const e = h('span', 'tag', t); e.dataset.t = t; $('#tags').append(e); };

  // ---------- log ----------
  const log = $('#log');
  const clock = () => new Date().toLocaleTimeString('en-US', { hour12: false });
  const say = (text, ok) => {
    $('.muted', log)?.remove();
    const li = h('li', ok ? 'ok' : ''); const t = h('time', '', clock());
    li.append(t, document.createTextNode(text)); log.append(li);
    while (log.children.length > 5) log.firstChild.remove();
  };

  // ---------- status ----------
  const stat = (id, text, cls) => { const e = $('#s-' + id); e.textContent = text; e.className = 'st mono ' + (cls || ''); };

  // ---------- mobile: tabs switch themselves to follow the action ----------
  // On phones one pane shows at a time; the active tab jumps to whichever pane is changing.
  // Tapping a tab yourself pauses auto-switching for a few seconds (other tabs then get a dot).
  const tabs = $$('.tab'), panes = { page: $('#p-page'), flow: $('#p-flow'), pipe: $('#p-pipe'), inbox: $('#p-inbox') };
  let curTab = 'page', pauseUntil = 0;
  const showTab = p => {
    curTab = p;
    tabs.forEach(t => { const on = t.dataset.p === p; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); if (on) t.classList.remove('ping'); });
    Object.entries(panes).forEach(([k, el]) => el.classList.toggle('on', k === p));
  };
  const bringIntoView = () => {
    const y = $('.lab').getBoundingClientRect().top + scrollY - 70;
    if (Math.abs(scrollY - y) > 60) scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };
  const follow = (p, force) => {
    if (!mobile.matches || p === curTab) return;
    if (!force && Date.now() < pauseUntil) { $(`.tab[data-p="${p}"]`).classList.add('ping'); return; }
    showTab(p);
  };
  tabs.forEach(t => t.addEventListener('click', () => { showTab(t.dataset.p); pauseUntil = Date.now() + 5000; }));
  // which pane shows the result of each workflow action
  const FOCUS = { contact: 'inbox', tags: 'inbox', opp: 'pipe', sms: 'inbox', email: 'inbox', contacted: 'pipe', booked: 'pipe', tags2: 'inbox', sms2: 'inbox', notify: 'inbox' };

  // progress line under the tabs
  const TOTAL = 14;
  const tick = () => { $('#tk-bar').style.width = (hud.act / TOTAL * 100) + '%'; };

  // ---------- run control ----------
  // canBook: the calendar only accepts a booking once the intake workflow has finished
  let run = 0, nudgeTimer, canBook = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pace = ms => reduce ? Math.min(ms, 250) : ms * 2;
  const lead = {};
  let myCard;

  const step = async (id, k, label, fn, ms = 900, sub) => {
    if (id !== run) throw 0;
    setNode(k, 'run', 'Running', sub);
    follow(FOCUS[k] || 'flow');
    await sleep(pace(ms));
    if (id !== run) throw 0;
    await fn?.();
    setNode(k, 'done', 'Done'); bump('act', '#m-act'); tick();
    $(`.prep li[data-k="${k}"]`)?.classList.add('ok');
    say(label, true);
    await sleep(pace(260));
  };

  // ---------- landing page ----------
  const form = $('#lp'), err = $('#lp-err');
  const screens = $$('.scr');
  const url = $('#url');
  const go = s => {
    screens.forEach(el => { el.classList.toggle('out', el.classList.contains('on') && el.dataset.s !== s); el.classList.toggle('on', el.dataset.s === s); });
    url.textContent = 'northlineroofing.com/' + ({ form: 'free-inspection', prep: 'thank-you', book: 'thank-you', done: 'booked' })[s];
    $$('[data-name]').forEach(e => e.textContent = lead.name || '');
    $$('[data-svc]').forEach(e => e.textContent = (lead.svc || '').toLowerCase());
    hot('page');
  };

  const SAMPLES = ['Jamie', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Jordan'];
  $('#fill').addEventListener('click', () => {
    const n = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    form.fname.value = n;
    form.phone.value = `(555) 01${Math.floor(Math.random() * 10)}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    form.email.value = n.toLowerCase() + '@example.com';
    form.svc.selectedIndex = Math.floor(Math.random() * 3);
    form.ok.checked = true;
    err.textContent = ''; $$('[aria-invalid]', form).forEach(e => e.removeAttribute('aria-invalid'));
  });

  const validate = () => {
    const bad = [];
    const name = form.fname.value.trim(), email = form.email.value.trim(), phone = form.phone.value.replace(/\D/g, '');
    if (!name) bad.push([form.fname, 'Please add your first name.']);
    if (phone.length < 7) bad.push([form.phone, 'Please add a phone number (any number works).']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push([form.email, 'Please add a valid email.']);
    if (!form.ok.checked) bad.push([form.ok, 'Please tick the consent box.']);
    $$('input', form).forEach(i => i.removeAttribute('aria-invalid'));
    bad.forEach(([el]) => el.setAttribute('aria-invalid', 'true'));
    err.textContent = bad.length ? bad[0][1] : '';
    if (bad.length) bad[0][0].focus();
    return !bad.length;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    const opt = form.svc.selectedOptions[0];
    Object.assign(lead, {
      name: form.fname.value.trim().split(/\s+/)[0].slice(0, 20),
      phone: form.phone.value.trim(), email: form.email.value.trim(),
      svc: opt.value, val: +opt.dataset.v
    });
    lead.name = lead.name[0].toUpperCase() + lead.name.slice(1);
    const btn = $('.lp-btn', form); btn.classList.add('busy'); btn.textContent = 'Sending…';
    const id = ++run;
    try { await intake(id); } catch (x) { /* run was reset */ }
  });

  const svcTag = () => lead.svc.toLowerCase().replace(/\s+/g, '-');

  async function intake(id) {
    stat('flow', 'Running', 'run'); stat('page', 'Submitted', 'live');
    sys('Running', 'run'); startSpeed();
    go('prep');
    pauseUntil = 0; bringIntoView(); follow('flow', true);
    say(`Form submission received from ${lead.name}`);
    await step(id, 'trigger', 'Trigger fired: Free inspection form', null, 600);
    await step(id, 'contact', `Contact created: ${lead.name} (${lead.phone})`, () => {
      setWho(lead.name, `${lead.email} · ${lead.phone}`)
    }, 900, `${lead.name} · ${lead.phone}`);
    await step(id, 'tags', 'Tags added: new-lead, roofing, ' + svcTag(), async () => {
      for (const t of ['new-lead', 'roofing', svcTag()]) { addTag(t); await sleep(pace(160)); }
    }, 700, `new-lead · roofing · ${svcTag()}`);
    await step(id, 'opp', `Opportunity created in New Lead (${money(lead.val)})`, () => {
      myCard = oppCard(lead.name, lead.svc, lead.val); myCard.classList.add('you', 'enter');
      cols['New Lead'].list.prepend(myCard); flash('New Lead'); tally();
      board.scrollTo({ left: 0 });
    }, 900, `Roofing leads → New Lead · ${money(lead.val)}`);
    await step(id, 'sms', 'SMS delivered to ' + lead.phone, () => addMsg('sms', `SMS · ${clock()}`,
      `Hi ${lead.name}, it’s Northline Roofing 👋 Thanks for requesting a ${lead.svc.toLowerCase()}. Pick a time here: nlroof.co/book, or reply with the best time to call.`).then(stopSpeed), 1000);
    await step(id, 'email', 'Email sent to ' + lead.email, () => addMsg('mail', `Email · ${clock()}`,
      `Hi ${lead.name}, here’s what happens during your free visit and how to book the time that suits you…`, `Your free ${lead.svc.toLowerCase()}: next steps`), 900);
    await step(id, 'contacted', 'Opportunity moved: New Lead → Contacted', () => moveCard(myCard, 'Contacted'), 800);
    if (id !== run) return;
    setNode('wait', 'wait', 'Waiting');
    canBook = true; go('book');
    stat('flow', 'Waiting for booking', 'run'); sys('Waiting', 'wait');
    say('Waiting for the lead to book…');
    // give the card move a beat on screen, then show the calendar (unless they already booked)
    await sleep(pace(700)); if (id === run && canBook) follow('page', true);
    nudgeTimer = setTimeout(() => {
      if (id !== run) return;
      say('No booking yet: nudge SMS sent (demo: 10 min shortened to 40 s)', true);
      addMsg('sms', `SMS · ${clock()}`, `Hi ${lead.name}, still want that free ${lead.svc.toLowerCase()}? We have openings this week: nlroof.co/book`);
      setNode('wait', 'wait', 'Waiting', 'Nudge SMS sent, still waiting for a booking');
    }, reduce ? 6000 : 40000);
  }

  // ---------- booking ----------
  const slotsEl = $('#slots'), confirm = $('#confirm');
  let picked = null;
  const buildSlots = () => {
    slotsEl.innerHTML = ''; picked = null; confirm.disabled = true;
    const d = new Date(); let n = 0;
    while (n < 3) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      n++;
      const day = h('div', 'day'), p = h('p', '', d.toLocaleDateString('en-US', { weekday: 'short' }));
      p.append(h('small', '', d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })));
      day.append(p);
      const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      ['9:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'].forEach(t => {
        const b = h('button', 'slot', t); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.dataset.when = `${label} at ${t}`;
        b.setAttribute('aria-label', `${label}, ${t}`);
        b.addEventListener('click', () => {
          $$('.slot', slotsEl).forEach(s => s.setAttribute('aria-pressed', s === b));
          picked = b.dataset.when; confirm.disabled = false;
        });
        day.append(b);
      });
      slotsEl.append(day);
    }
  };

  confirm.addEventListener('click', async () => {
    if (!picked || !canBook) return;
    canBook = false;
    const id = run;
    clearTimeout(nudgeTimer);
    lead.when = picked;
    $('#done-when').textContent = `Your ${lead.svc.toLowerCase()} is set for ${picked}. Check your texts for the confirmation.`;
    go('done'); stat('page', 'Booked', 'live');
    try { await booked(id); } catch (x) { /* reset */ }
  });

  async function booked(id) {
    setNode('wait', 'done', 'Booked', `Booked for ${lead.when}`); bump('act', '#m-act');
    tick();
    sys('Running', 'run');
    say(`Appointment booked: ${lead.when}`, true);
    stat('flow', 'Running', 'run');
    pauseUntil = 0;
    await step(id, 'trigger2', 'Trigger fired: Appointment booked', null, 600);
    await step(id, 'booked', 'Opportunity moved: Contacted → Booked', () => moveCard(myCard, 'Booked'), 800);
    await step(id, 'tags2', 'Tags updated: +booked, −new-lead', () => {
      $('.tag[data-t="new-lead"]')?.classList.add('rm'); addTag('booked');
    }, 700);
    await step(id, 'sms2', 'Confirmation SMS delivered', () => addMsg('sms', `SMS · ${clock()}`,
      `You’re all set, ${lead.name}! Your ${lead.svc.toLowerCase()} is booked for ${lead.when}. Reply C to confirm or R to reschedule.`), 1000);
    await step(id, 'notify', 'Owner notified: Alex (sales)', () => addMsg('note', `Internal · ${clock()}`,
      `🔔 New booking: ${lead.name}, ${lead.svc} (${money(lead.val)}), ${lead.when}. Assigned to Alex.`), 800);
    await step(id, 'remind', 'Reminders scheduled: 24 h and 1 h before', null, 800);
    if (id !== run) return;
    stat('flow', 'Completed', 'live'); sys('Complete', 'ok');
    await sleep(pace(600)); if (id === run) follow('pipe', true);
    say('All workflows finished. 0 manual steps.', true);
  }

  // ---------- reset ----------
  const reset = () => {
    run++; clearTimeout(nudgeTimer); canBook = false;
    $$('.prep li').forEach(li => li.classList.remove('ok'));
    Object.keys(lead).forEach(k => delete lead[k]);
    buildFlow(); buildBoard(); buildSlots(); emptyInbox();
    $('#tags').innerHTML = '';
    $('#who').innerHTML = '<span class="av">?</span><div><b>No contact yet</b><small class="mono">Submit the form to create one</small></div>';
    log.innerHTML = '<li class="mono muted">Waiting for a form submission…</li>';
    form.reset(); err.textContent = '';
    const btn = $('.lp-btn', form); btn.classList.remove('busy'); btn.textContent = 'Get my free inspection';
    stat('page', 'Live', 'live'); stat('flow', 'Idle');
    cancelAnimationFrame(hud.raf); hud.raf = 0; hud.act = 0; hud.msg = 0;
    $('#m-act').textContent = '0'; $('#m-msg').textContent = '0'; speedEl().textContent = '--.--s'; speedEl().className = '';
    sys('Armed'); tick();
    tabs.forEach(t => t.classList.remove('ping'));
    go('form');
  };
  $('#again').addEventListener('click', () => { reset(); showTab('page'); bringIntoView(); form.fname.focus({ preventScroll: true }); });
  $('#start').addEventListener('click', e => {
    e.preventDefault();
    showTab('page');
    $('#lab').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => form.fname && $('[data-s=form]').classList.contains('on') && form.fname.focus({ preventScroll: true }), reduce ? 0 : 700);
  });
  reset();
})();
