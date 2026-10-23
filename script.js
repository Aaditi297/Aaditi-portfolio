(function () {
  var root = document.documentElement;

  // theme toggle
  try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
  document.getElementById('themeBtn').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme');
    if (!cur) cur = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  links.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // active nav link on scroll
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a'));
  var sections = navAnchors.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var y = window.scrollY + 120, current = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) current = i; });
    navAnchors.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // project filters
  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('.project');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      cards.forEach(function (card) {
        var cats = card.getAttribute('data-cat').split(' ');
        card.hidden = !(f === 'all' || cats.indexOf(f) > -1);
        if (!card.hidden) { card.classList.remove('project-in'); void card.offsetWidth; card.classList.add('project-in'); }
      });
    });
  });


  // animations
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scroll progress bar
  var header = document.querySelector('.site-header');
  function progress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--p', h > 0 ? Math.min(1, window.scrollY / h) : 0);
  }
  window.addEventListener('scroll', progress, { passive: true });
  progress();

  // reveal on scroll
  var targets = document.querySelectorAll('.section-head, .about-copy, .stat, .skill-card, .filters, .project, .timeline li, .certs, .contact-grid > *, .cta-row');
  var groups = new Map();
  targets.forEach(function (el) {
    if (el.closest('.hero')) return;
    el.classList.add('reveal');
    var parent = el.parentElement;
    var n = groups.get(parent) || 0;
    groups.set(parent, n + 1);
    el.style.setProperty('--d', (Math.min(n, 5) * 0.08) + 's');
  });
  function showAll() { document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); }); }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    setTimeout(showAll, 6000);
  }

  // hero underline
  var em = document.querySelector('.hero h1 em');
  if (em) setTimeout(function () { em.classList.add('on'); }, 100);

  // count-up stats
  if (!reduce) {
    document.querySelectorAll('.stat b').forEach(function (b) {
      var end = parseInt(b.textContent, 10);
      if (!/^\d+$/.test(b.textContent.trim())) return;
      b.textContent = '0';
      var done = false;
      var so = new IntersectionObserver(function (es) {
        if (done || !es[0].isIntersecting) return;
        done = true; so.disconnect();
        var t0 = performance.now(), dur = 1100;
        (function step(t) {
          var k = Math.min(1, (t - t0) / dur);
          b.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step); else b.textContent = String(end);
        })(t0);
      }, { threshold: 0.6 });
      so.observe(b);
      setTimeout(function () { if (!done) { done = true; b.textContent = String(end); } }, 8000);
    });
  }

  // education journey
  var journey = document.getElementById('journey');
  if (journey) {
    var jn = journey.querySelectorAll('.node');
    function layoutJourney() {
      var base = journey.getBoundingClientRect().top;
      function c(n) { var r = n.getBoundingClientRect(); return r.top - base + r.height / 2; }
      var t0 = c(jn[0]), t1 = c(jn[1]), tn = c(jn[jn.length - 1]);
      journey.style.setProperty('--top', t0 + 'px');
      journey.style.setProperty('--len', (tn - t0) + 'px');
      journey.style.setProperty('--fill', (t1 - t0) + 'px');
    }
    layoutJourney();
    window.addEventListener('resize', layoutJourney);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutJourney);
    function playJourney() {
      layoutJourney();
      journey.classList.add('play');
      setTimeout(function () { journey.classList.add('arrived'); }, reduce ? 0 : 2400);
    }
    if (reduce || !('IntersectionObserver' in window)) { playJourney(); }
    else {
      var jo = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { jo.disconnect(); playJourney(); }
      }, { threshold: 0.35 });
      jo.observe(journey);
      setTimeout(function () { if (!journey.classList.contains('play')) playJourney(); }, 8000);
    }
  }

  // glowing grid (About)
  var gc = document.getElementById('grid');
  if (gc && gc.getContext) {
    var g = gc.getContext('2d'), cell = 48, gw = 0, gh = 0, gcol = '#2447F5', nodes = [], pulses = [], gRun = false, gVis = true, gLast = 0;
    function gColor() { var c = getComputedStyle(root).getPropertyValue('--accent').trim(); if (c) gcol = c; }
    function gSize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = gc.getBoundingClientRect();
      gw = r.width; gh = r.height;
      gc.width = Math.max(1, gw * dpr); gc.height = Math.max(1, gh * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cx = Math.ceil(gw / cell) + 1, cy = Math.ceil(gh / cell) + 1;
      nodes = []; pulses = [];
      for (var x = 0; x < cx; x++) for (var y = 0; y < cy; y++) {
        if (Math.random() < 0.07) nodes.push({ x: x * cell, y: y * cell, ph: Math.random() * 6.28, sp: 0.0007 + Math.random() * 0.0012 });
      }
    }
    function spawn() {
      var horiz = Math.random() < 0.5;
      pulses.push({ h: horiz, line: Math.floor(Math.random() * ((horiz ? gh : gw) / cell)) * cell, pos: -20, sp: 1.2 + Math.random() * 1.6, len: 80 + Math.random() * 60 });
    }
    function drawGrid(t, animate) {
      g.clearRect(0, 0, gw, gh);
      g.strokeStyle = gcol; g.globalAlpha = 0.1; g.lineWidth = 1;
      g.beginPath();
      for (var x = 0; x <= gw; x += cell) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, gh); }
      for (var y = 0; y <= gh; y += cell) { g.moveTo(0, y + 0.5); g.lineTo(gw, y + 0.5); }
      g.stroke();
      g.fillStyle = gcol;
      nodes.forEach(function (n) {
        var k = animate ? Math.pow(0.5 + 0.5 * Math.sin(t * n.sp + n.ph), 3) : 0.35;
        g.globalAlpha = 0.12 * k; g.beginPath(); g.arc(n.x + 0.5, n.y + 0.5, 16, 0, 6.28); g.fill();
        g.globalAlpha = 0.25 + 0.65 * k; g.beginPath(); g.arc(n.x + 0.5, n.y + 0.5, 2.2, 0, 6.28); g.fill();
      });
      if (!animate) { g.globalAlpha = 1; return; }
      if (pulses.length < 6 && Math.random() < 0.04) spawn();
      g.strokeStyle = gcol; g.lineWidth = 2; g.lineCap = 'round';
      pulses = pulses.filter(function (p) {
        p.pos += p.sp;
        var max = (p.h ? gw : gh) + p.len + 20;
        if (p.pos > max) return false;
        for (var s = 0; s < 10; s++) {
          var a = p.pos - (s / 10) * p.len, b = p.pos - ((s + 1) / 10) * p.len;
          g.globalAlpha = 0.7 * (1 - s / 10);
          g.beginPath();
          if (p.h) { g.moveTo(a, p.line + 0.5); g.lineTo(b, p.line + 0.5); } else { g.moveTo(p.line + 0.5, a); g.lineTo(p.line + 0.5, b); }
          g.stroke();
        }
        g.globalAlpha = 0.95; g.beginPath();
        if (p.h) g.arc(p.pos, p.line + 0.5, 3, 0, 6.28); else g.arc(p.line + 0.5, p.pos, 3, 0, 6.28);
        g.fill();
        return true;
      });
      g.globalAlpha = 1;
    }
    function gLoop(t) {
      if (!gRun) return;
      if (t - gLast > 33) { gLast = t; drawGrid(t, true); }
      requestAnimationFrame(gLoop);
    }
    function gStart() { if (!gRun && gVis && !document.hidden && !reduce) { gRun = true; requestAnimationFrame(gLoop); } }
    function gStop() { gRun = false; }
    gColor(); gSize(); drawGrid(0, false);
    if (!reduce) {
      gStart();
      document.addEventListener('visibilitychange', function () { document.hidden ? gStop() : gStart(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { gVis = es[0].isIntersecting; gVis ? gStart() : gStop(); }).observe(gc);
      }
    }
    var gt; window.addEventListener('resize', function () { clearTimeout(gt); gt = setTimeout(function () { gSize(); drawGrid(0, reduce ? false : true); }, 150); });
    document.getElementById('themeBtn').addEventListener('click', function () { setTimeout(function () { gColor(); if (reduce) drawGrid(0, false); }, 50); });
    setInterval(gColor, 3000);
  }

  // particle network (hero)
  var nc = document.getElementById('net');
  if (nc && nc.getContext) {
    var n = nc.getContext('2d'), nw = 0, nh = 0, ncol = '#2447F5', pts = [], mouse = { x: -999, y: -999 }, nRun = false, nVis = true, nf = 0;
    function nColor() { var c = getComputedStyle(root).getPropertyValue('--accent').trim(); if (c) ncol = c; }
    function nSize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = nc.getBoundingClientRect();
      nw = r.width; nh = r.height;
      nc.width = Math.max(1, nw * dpr); nc.height = Math.max(1, nh * dpr);
      n.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(28, Math.min(85, Math.round(nw * nh / 11000)));
      pts = [];
      for (var i = 0; i < count; i++) pts.push({ x: Math.random() * nw, y: Math.random() * nh, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1.4 + Math.random() * 1.6 });
    }
    function nDraw(move) {
      n.clearRect(0, 0, nw, nh);
      n.fillStyle = ncol; n.strokeStyle = ncol; n.lineWidth = 1;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > nw) p.vx *= -1;
          if (p.y < 0 || p.y > nh) p.vy *= -1;
          var mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
          if (md < 110 && md > 0) { p.x += (mx / md) * 0.8; p.y += (my / md) * 0.8; }
        }
        n.globalAlpha = 0.75; n.beginPath(); n.arc(p.x, p.y, p.r, 0, 6.28); n.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14400) { n.globalAlpha = (1 - d / 14400) * 0.35; n.beginPath(); n.moveTo(p.x, p.y); n.lineTo(q.x, q.y); n.stroke(); }
        }
        var ex = p.x - mouse.x, ey = p.y - mouse.y, ed = ex * ex + ey * ey;
        if (ed < 26000) { n.globalAlpha = (1 - ed / 26000) * 0.7; n.beginPath(); n.moveTo(p.x, p.y); n.lineTo(mouse.x, mouse.y); n.stroke(); }
      }
      n.globalAlpha = 1;
      if (++nf % 40 === 0) nColor();
    }
    function nLoop() { if (!nRun) return; nDraw(true); requestAnimationFrame(nLoop); }
    function nStart() { if (!nRun && nVis && !document.hidden && !reduce) { nRun = true; requestAnimationFrame(nLoop); } }
    function nStop() { nRun = false; }
    nColor(); nSize(); nDraw(false);
    var heroEl = nc.parentElement;
    heroEl.addEventListener('pointermove', function (e) { var r = nc.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    heroEl.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    if (!reduce) {
      nStart();
      document.addEventListener('visibilitychange', function () { document.hidden ? nStop() : nStart(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { nVis = es[0].isIntersecting; nVis ? nStart() : nStop(); }).observe(nc);
      }
    }
    var nt; window.addEventListener('resize', function () { clearTimeout(nt); nt = setTimeout(function () { nSize(); nDraw(false); }, 150); });
    document.getElementById('themeBtn').addEventListener('click', function () { setTimeout(function () { nColor(); if (reduce) nDraw(false); }, 50); });
  }

  // typed role
  var typed = document.getElementById('typed');
  if (typed) {
    var words = ['Machine learning', 'Web development', 'Python, C & Java', 'MySQL databases'], wi = 0, ci = words[0].length, del = true;
    typed.textContent = words[0];
    if (!reduce) {
      (function tick() {
        var w = words[wi], delay = del ? 45 : 85;
        if (del) {
          ci--; typed.textContent = w.slice(0, ci);
          if (ci <= 0) { del = false; wi = (wi + 1) % words.length; delay = 350; }
        } else {
          ci++; typed.textContent = words[wi].slice(0, ci);
          if (ci >= words[wi].length) { del = true; delay = 1700; }
        }
        setTimeout(tick, delay);
      })();
      setTimeout(function () {}, 0);
    }
  }

  // card spotlight follows the cursor
  document.addEventListener('pointermove', function (e) {
    var t = e.target.closest ? e.target.closest('.project, .skill-card, .stat') : null;
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  // back to top button
  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () { toTop.classList.toggle('show', window.scrollY > 700); }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  }
})();
