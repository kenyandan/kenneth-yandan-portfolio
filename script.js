(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  // theme
  const root = document.documentElement;
  $('#theme').addEventListener('click', () => {
    const dark = root.dataset.theme !== 'light';
    const next = dark ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('ky-theme', next); } catch (e) {}
  });

  // mobile menu
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = o => { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  // scroll progress + active link
  const bar = $('.progress i');
  const secs = $$('main section[id]');
  const links = $$('.links a');
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${scrollY / (h.scrollHeight - innerHeight || 1)})`;
    let cur = '';
    secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
    links.forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + cur));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });

  // counters
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) return;
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1100, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => co.observe(el));

  // hero glow follows pointer
  const hero = $('.hero');
  if (fine && !reduce) hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  // magnetic buttons
  if (fine && !reduce) $$('[data-magnet]').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .25}px)`;
    });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });

  // workflow demo
  const steps = [
    ['A lead fills your Meta form', 'Someone taps your Facebook or Instagram lead ad and submits their details. The lead is captured instantly, with source and campaign tracked.'],
    ['Data moves automatically', 'A webhook or Zapier zap sends the lead into GoHighLevel and any other tool in your stack, with fields mapped so nothing is retyped.'],
    ['Contact and pipeline created', 'GHL creates or updates the contact, tags the source, opens an opportunity in the right pipeline stage and assigns an owner.'],
    ['Speed-to-lead SMS', 'A friendly text goes out within seconds from a properly registered number (A2P 10DLC), with quiet hours and opt-out handled.'],
    ['Email nurture takes over', 'If they don’t reply, a timed email and SMS sequence follows up, stopping automatically the moment they respond or book.'],
    ['Call lands on the calendar', 'They book through your calendar, reminders reduce no-shows, and the pipeline moves. Your team only shows up for the conversation.']
  ];
  const nodes = $$('.node');
  const mobile = matchMedia('(max-width:980px)');
  // on small screens the description opens directly under the tapped step
  const inline = nodes.map(n => { const d = document.createElement('div'); d.className = 'idetail'; n.closest('li').appendChild(d); return d; });
  let cur = 0, timer;
  const show = i => {
    cur = i;
    nodes.forEach((n, k) => { n.classList.toggle('on', k === i); n.setAttribute('aria-pressed', k === i); n.setAttribute('aria-expanded', k === i); });
    $('#d-step').textContent = `Step ${i + 1} / ${steps.length}`;
    $('#d-title').textContent = steps[i][0];
    $('#d-text').textContent = steps[i][1];
    inline.forEach((d, k) => { d.innerHTML = ''; if (k !== i) return; const t = document.createElement('h3'), p = document.createElement('p'); t.textContent = steps[i][0]; p.textContent = steps[i][1]; d.append(t, p); });
  };
  const stop = () => clearInterval(timer);
  const play = () => { stop(); if (reduce || mobile.matches) return; timer = setInterval(() => show((cur + 1) % steps.length), 3200); };
  nodes.forEach((n, i) => n.addEventListener('click', () => {
    show(i); stop();
    if (mobile.matches) requestAnimationFrame(() => inline[i].scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
  }));
  const fu = $('.flow-ui');
  fu.addEventListener('pointerenter', stop); fu.addEventListener('pointerleave', play);
  fu.addEventListener('focusin', stop);
  mobile.addEventListener('change', play);
  show(0);
  new IntersectionObserver(es => es[0].isIntersecting ? play() : stop()).observe(fu);

  // work list
  const cats = { ghl: 'GHL Page', auto: 'Automation', zap: 'Zapier', wp: 'WordPress' };
  // [category, title, url, preview image id]
  const work = [
    ["ghl", "Renew Life Wellness Center", "https://www.renewlife.clinic/", "01"],
    ["ghl", "Graybox Theater", "https://graybox.theater/", "02"],
    ["ghl", "The Resort at Jefferson Landing", "https://resortatjeffersonlanding.com/", "03"],
    ["ghl", "Blue Wire Media", "https://app.bluewiremedia.com.au/v2/preview/vax4LRRg13EcXeor881L", "04"],
    ["ghl", "Flinders Lane", "https://flinderslaneoffers.com/giftcard629754", "07"],
    ["ghl", "Harv Eker FFC", "https://info.harvekeronline.com/ffc-letter?dfp=o2g7BlZwk2", "08"],
    ["ghl", "AMD Digital Solutions", "https://amddigitalsolutions.com/home-page", "09"],
    ["auto", "Gift Card Optin Confirmation & 30 Days Reminder", "https://drive.google.com/file/d/1mNaJ9aRRL5myhai1aI0Ht1NSynt4XzmC/view?usp=sharing", "10"],
    ["auto", "VSL Optin Sequence", "https://drive.google.com/file/d/1ZZ0V_iL7wKYb_c8IIwxxlT_ecCvbss02/view?usp=sharing", "11"],
    ["auto", "Best Year Email Sequence", "https://attachment.freshdesk.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTIxNTM1MzI3NDgsImRvbWFpbiI6ImJvbGRzb2x1dGlvbnMuZnJlc2hkZXNrLmNvbSIsImFjY291bnRfaWQiOjE1NTMzM30.HSnHEY_W4nzSiZt5Diwd63Y_FBJo4CsnzE5UzFn0S3A", "14"],
    ["auto", "Ebook", "https://attachment.freshdesk.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTIxNTMzMjU4OTYsImRvbWFpbiI6ImJvbGRzb2x1dGlvbnMuZnJlc2hkZXNrLmNvbSIsImFjY291bnRfaWQiOjE1NTMzM30.NJh3uOrlH7HFHbkXc4CKTT7WyHxGi6SmfQs8XX6o6Nw", "15"],
    ["auto", "Flashcards Lead Magnet Form Automation", "https://drive.google.com/file/d/1-VJxtIDSUQVCoX_h0DhKCbjZmPC3zcEc/view?usp=sharing", "16"],
    ["zap", "Zapier \u2192 Close", "https://attachment.freshdesk.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTIxNTM5MTYxNjcsImRvbWFpbiI6ImJvbGRzb2x1dGlvbnMuZnJlc2hkZXNrLmNvbSIsImFjY291bnRfaWQiOjE1NTMzM30.kNVlg54lgBvGIF7g6y963JsBjUaHXgfdPx6uGzIQ2tA", "17"],
    ["zap", "Stripe Failed Payment Follow-up", "https://drive.google.com/file/d/1tP0OUcb_K-ozup7tkwcBrw28951JQ-zD/view?usp=sharing", "18"],
    ["zap", "Passkit/GHL Generate Gift Card Pass", "https://drive.google.com/file/d/1lmTl_vPIaZt2tLHhE5NbYWHPxZp-U4Pg/view?usp=sharing", "19"],
    ["zap", "Passkit/GHL Generate Loyalty Pass", "https://drive.google.com/file/d/19K_iPl91841VEm8LLIfbS_AMjSmebfcE/view?usp=sharing", "20"],
    ["zap", "Webinargeek/GHL", "https://drive.google.com/file/d/18MeNySXEGFeNKKf-AtKJ6yy9f6asaP8o/view?usp=sharing", "21"],
    ["wp", "Holistic Sleep Coaching \u2014 Success", "https://holisticsleepcoaching.com/sleepcoachingsuccess/", "22"],
    ["wp", "Valehna Zemoff \u2014 Connect", "https://www.valehnazemoff.com/connect/", "23"],
    ["wp", "Holistic Sleep Coaching \u2014 Revolution", "https://holisticsleepcoaching.com/holistic-sleep-coaching-revolution/", "24"],
    ["wp", "Blackwing \u2014 5 Day Fast Start Program", "https://blackwing.com.au/5dayfaststartprogram-start/", "25"],
  ];
  const arrow = '<svg class="ar" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  const list = $('#list');
  const FEATURED = [1, 2, 3, 8, 15, 16];   // positions in the list above
  const LIMIT = 6;
  const items = work.map(([c, t, url, pid], i) => {
    const li = document.createElement('li');
    const el = document.createElement('a');
    el.className = 'item'; el.dataset.c = c; el.dataset.t = t; el.dataset.p = pid;
    el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer';
    el.setAttribute('aria-label', `${t} (opens in a new tab)`);
    el.innerHTML = `<span class="n mono"></span><span class="t"></span><span class="k mono">${cats[c]}</span>${arrow}`;
    el.querySelector('.t').textContent = t;
    li.appendChild(el);
    return { li, c, pos: i + 1 };
  });
  const more = $('#more');
  let filter = 'all', expanded = false;
  const renderList = () => {
    let vis = items.filter(x => filter === 'all' || x.c === filter);
    if (filter === 'all') vis = [...vis.filter(x => FEATURED.includes(x.pos)).sort((p, q) => FEATURED.indexOf(p.pos) - FEATURED.indexOf(q.pos)), ...vis.filter(x => !FEATURED.includes(x.pos))];
    items.forEach(x => { x.li.hidden = true; });
    vis.forEach((x, k) => {
      x.li.hidden = !expanded && k >= LIMIT;
      x.li.firstChild.querySelector('.n').textContent = String(k + 1).padStart(2, '0');
      list.appendChild(x.li);
    });
    const extra = vis.length - LIMIT;
    more.hidden = extra <= 0;
    more.setAttribute('aria-expanded', expanded);
    more.firstElementChild.textContent = expanded ? 'Show fewer' : `See ${extra} more projects`;
    more.classList.toggle('open', expanded);
  };
  more.addEventListener('click', () => { expanded = !expanded; renderList(); });
  $$('.f').forEach(b => b.addEventListener('click', () => {
    $$('.f').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    filter = b.dataset.f; expanded = false; renderList();
  }));
  renderList();

  // hover preview (screenshots of each project)
  const peek = $('#peek'), pimg = $('#peek-img');
  let px = 0, py = 0, tx = 0, ty = 0, active = null;
  const place = (x, y) => {
    const w = 340, h = 250;
    tx = Math.min(Math.max(x + 28, 12), innerWidth - w - 12);
    ty = Math.min(Math.max(y - h / 2, 12), innerHeight - h - 12);
  };
  const showPeek = it => {
    if (active === it) return;
    if (!active) { px = tx; py = ty; }
    active = it;
    $('#peek-t').textContent = it.dataset.t; $('#peek-cat').textContent = cats[it.dataset.c];
    pimg.classList.remove('ok'); pimg.onload = () => pimg.classList.add('ok');
    pimg.src = `assets/previews/${it.dataset.p}.png`;
    peek.classList.add('show');
  };
  const hidePeek = () => { active = null; peek.classList.remove('show'); };
  if (fine) {
    list.addEventListener('pointermove', e => {
      const it = e.target.closest('.item');
      if (!it) return hidePeek();
      place(e.clientX, e.clientY); showPeek(it);
    });
    list.addEventListener('pointerleave', hidePeek);
    list.addEventListener('focusin', e => { const it = e.target.closest('.item'); if (!it) return; const r = it.getBoundingClientRect(); place(r.right - 380, r.top + r.height / 2); showPeek(it); });
    list.addEventListener('focusout', hidePeek);
    setTimeout(() => work.forEach(w => { const im = new Image(); im.src = `assets/previews/${w[3]}.png`; }), 3000);
  }

  // ambient background: floating automation icons
  const ico = {
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    sms: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
    bot: '<rect x="4" y="8" width="16" height="11" rx="3.5"/><path d="M12 8V4.5"/><circle cx="12" cy="3.5" r="1.3"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/><path d="M9.5 16.5h5M2 12.5v3M22 12.5v3"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    flow: '<circle cx="5.5" cy="6" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><path d="M8 6h4c3 0 3 6 6 6M8 18h4c3 0 3-6 6-6"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17m-11 5 2 2 4-4"/>',
    hook: '<circle cx="12" cy="5.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M12 8v4l-5 4M12 12l5 4"/>',
    spark: '<path d="M12 3c.6 5 3 7.4 8 8-5 .6-7.4 3-8 8-.6-5-3-7.4-8-8 5-.6 7.4-3 8-8z"/>'
  };
  const keys = Object.keys(ico);
  const layer = document.createElement('div');
  layer.className = 'ambient'; layer.setAttribute('aria-hidden', 'true');
  const seeds = [[2,14],[95,9],[1,46],[96,40],[3,74],[94,68],[6,92],[93,90]];
  const bits = seeds.map(([x, y], i) => {
    const d = document.createElement('div'); d.className = 'amb';
    const depth = .3 + (i % 5) * .18;
    d.style.cssText = `left:${x}%;top:${y}%;--s:${30 + (i * 7) % 16}px;--dur:${20 + (i * 3) % 12}s;--dl:${-i * 2.3}s;--rot:${(i % 2 ? 1 : -1) * (6 + i % 9)}deg`;
    d.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${ico[keys[i % keys.length]]}</svg>`;
    layer.appendChild(d);
    return { d, depth, ox: 0, oy: 0 };
  });
  document.body.prepend(layer);

  // cursor ring, portrait tilt, icon parallax + repel
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  const pointerEl = document.createElement('div'); pointerEl.className = 'cur'; pointerEl.setAttribute('aria-hidden', 'true');
  pointerEl.innerHTML = '<span></span>';
  if (fine && !reduce) { document.body.append(pointerEl); document.documentElement.classList.add('has-cursor'); }
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('.item, a, button, input, textarea, label');
    let label = '';
    if (t) label = t.classList.contains('item') ? 'View' : t.matches('.btn') ? 'Go' : '';
    pointerEl.firstChild.textContent = label;
    pointerEl.classList.toggle('link', !!t && !label);
    pointerEl.classList.toggle('pill', !!label);
    pointerEl.classList.toggle('text', !!e.target.closest('input, textarea'));
  });
  document.addEventListener('pointerdown', () => pointerEl.classList.add('down'));
  document.addEventListener('pointerup', () => pointerEl.classList.remove('down'));
  const portrait = $('.portrait');
  const loop = () => {
    rx += (mx - rx) * .28; ry += (my - ry) * .28;
    pointerEl.style.transform = `translate(${rx}px,${ry}px)`;
    if (peek.classList.contains('show')) {
      px += (tx - px) * .2; py += (ty - py) * .2;
      peek.style.transform = `translate(${px}px,${py}px)`;
    }
    bits.forEach(b => {
      const r = b.d.getBoundingClientRect();
      const cx = r.left + r.width / 2 - b.ox, cy = r.top + r.height / 2 - b.oy;
      const dx = cx - mx, dy = cy - my, dist = Math.hypot(dx, dy) || 1;
      const push = Math.max(0, 1 - dist / 170) * 22;
      b.ox += ((dx / dist) * push - b.ox) * .08; b.oy += ((dy / dist) * push - b.oy) * .08;
      const par = (mx / innerWidth - .5) * 10 * b.depth;
      b.d.style.transform = `translate3d(${b.ox + par}px,${b.oy - scrollY * .03 * b.depth}px,0)`;
    });
    requestAnimationFrame(loop);
  };
  if (fine && !reduce) {
    requestAnimationFrame(loop);
    portrait.addEventListener('pointermove', e => {
      const r = portrait.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      portrait.style.setProperty('--tx', (-y * 8).toFixed(2) + 'deg'); portrait.style.setProperty('--ty', (x * 10).toFixed(2) + 'deg');
    });
    portrait.addEventListener('pointerleave', () => { portrait.style.setProperty('--tx', '0deg'); portrait.style.setProperty('--ty', '0deg'); });
  } else if (!reduce) {
    addEventListener('scroll', () => bits.forEach(b => { b.d.style.transform = `translate3d(0,${-scrollY * .03 * b.depth}px,0)`; }), { passive: true });
  }

  // contact form -> mailto
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#name').value.trim(), m = $('#email').value.trim(), g = $('#msg').value.trim(), err = $('#err');
    if (!n || !/^\S+@\S+\.\S+$/.test(m) || !g) {
      err.textContent = !n ? 'Please enter your name.' : !/^\S+@\S+\.\S+$/.test(m) ? 'Please enter a valid email address.' : 'Please tell me what you need help with.';
      ($('#name').value.trim() ? (/^\S+@\S+\.\S+$/.test(m) ? $('#msg') : $('#email')) : $('#name')).focus();
      return;
    }
    err.textContent = '';
    location.href = `mailto:kennethyandan@gmail.com?subject=${encodeURIComponent('Project inquiry from ' + n)}&body=${encodeURIComponent(g + '\n\n— ' + n + ' (' + m + ')')}`;
  });

  $('#yr').textContent = new Date().getFullYear();
})();
