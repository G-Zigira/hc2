(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- year ---------- */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- nav: stuck state, progress bar, active link ---------- */
  var nav = $('#nav');
  var progress = $('#progress');
  var links = $$('.nav__links a');
  var sections = links
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 20);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

    var current = null;
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= 140) current = s.id;
    });
    links.forEach(function (a) {
      a.classList.toggle('is-on', a.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = $('#burger');
  var navLinks = $('#navLinks');
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  links.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- reveal on scroll (staggered) ---------- */
  var revealEls = $$('.reveal');
  revealEls.forEach(function (el) {
    var siblings = $$('.reveal', el.parentElement);
    var i = siblings.indexOf(el);
    el.style.setProperty('--d', (Math.max(i, 0) * 0.09).toFixed(2) + 's');
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up numbers ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
    var dur = 1600, start = null;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  } else {
    $$('[data-count]').forEach(countUp);
  }

  /* ---------- hero charger demo ---------- */
  var ringFg = $('#ringFg');
  var pctEl = $('#pct');
  var barFill = $('#barFill');
  var stateEl = $('#chargeState');
  var CIRC = 2 * Math.PI * 84;
  var level = 0, hold = 0;

  function paintCharge(v) {
    ringFg.style.strokeDashoffset = String(CIRC * (1 - v / 100));
    pctEl.textContent = Math.round(v);
    barFill.style.width = v + '%';
    stateEl.textContent = v >= 100 ? 'Fully charged' : v < 3 ? 'Connecting…' : 'Fast charging';
  }
  if (reduceMotion) {
    paintCharge(80);
  } else {
    setInterval(function () {
      if (level >= 100) {
        hold++;
        if (hold > 18) { level = 0; hold = 0; }
      } else {
        // slows slightly near the top, like a real charge curve
        level += level < 80 ? 1.6 : 0.7;
        if (level > 100) level = 100;
      }
      paintCharge(level);
    }, 90);
  }

  /* ---------- energy canvas background ---------- */
  var canvas = $('#energy');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var W, H, dpr, pts = [];
    var mouse = { x: -999, y: -999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(90, Math.floor((W * H) / 16000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });

    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);

    (function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        var dxm = p.x - mouse.x, dym = p.y - mouse.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 120) { p.x += dxm / dm * 0.8; p.y += dym / dm * 0.8; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(182,255,60,0.75)';
        ctx.fill();

        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = dx * dx + dy * dy;
          if (d < 14000) {
            var a = 1 - d / 14000;
            ctx.strokeStyle = 'rgba(25,227,177,' + (a * 0.28).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    })();
  }

  /* ---------- network province explorer ---------- */
  var provinces = {
    kigali: {
      title: 'Kigali City', phase: 'Starting point',
      desc: 'Where the network begins. Fast chargers at trusted forecourts give the capital\'s drivers the confidence to switch to electric.',
      nodes: [[50, 50, 1], [34, 38], [66, 40], [42, 66], [62, 64]]
    },
    north: {
      title: 'Northern Province', phase: 'Expansion',
      desc: 'Extending fast charging beyond the capital so northern routes and towns are covered by the national network.',
      nodes: [[50, 28, 1], [30, 52], [68, 56], [48, 76]]
    },
    south: {
      title: 'Southern Province', phase: 'Expansion',
      desc: 'Connecting the south to the grid of chargers, keeping long-distance electric driving practical.',
      nodes: [[50, 70, 1], [28, 44], [70, 46], [52, 24]]
    },
    east: {
      title: 'Eastern Province', phase: 'Expansion',
      desc: 'Bringing reliable DC fast charging to the east, so that no driver is more than a short drive from a charger.',
      nodes: [[62, 50, 1], [34, 36], [34, 66], [80, 30], [82, 72]]
    },
    west: {
      title: 'Western Province', phase: 'Expansion',
      desc: 'Completing national coverage in the west, reinforcing a network designed to serve every province, every day.',
      nodes: [[40, 50, 1], [66, 32], [66, 68], [18, 34], [20, 70]]
    }
  };

  var tabs = $$('.net__tabs button');
  var nodesBox = $('#nodes');
  var svgNS = 'http://www.w3.org/2000/svg';

  function drawProvince(key) {
    var p = provinces[key];
    $('#netTitle').textContent = p.title;
    $('#netDesc').textContent = p.desc;
    $('#netPhase').textContent = p.phase;
    nodesBox.innerHTML = '';

    // connecting lines
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    var hub = p.nodes[0];
    p.nodes.slice(1).forEach(function (n) {
      var l = document.createElementNS(svgNS, 'line');
      l.setAttribute('x1', hub[0]); l.setAttribute('y1', hub[1]);
      l.setAttribute('x2', n[0]); l.setAttribute('y2', n[1]);
      l.setAttribute('stroke', 'rgba(25,227,177,.45)');
      l.setAttribute('stroke-width', '0.5');
      l.setAttribute('stroke-dasharray', '2 2');
      svg.appendChild(l);
    });
    nodesBox.appendChild(svg);

    p.nodes.forEach(function (n, i) {
      var d = document.createElement('span');
      d.className = 'node' + (n[2] ? ' hub' : '');
      d.style.left = 'calc(' + n[0] + '% - ' + (n[2] ? 11 : 7) + 'px)';
      d.style.top = 'calc(' + n[1] + '% - ' + (n[2] ? 11 : 7) + 'px)';
      d.style.animationDelay = (i * 0.08) + 's';
      nodesBox.appendChild(d);
    });
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (b) {
        var on = b === t;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      drawProvince(t.dataset.p);
    });
  });
  drawProvince('kigali');

  /* ---------- contact form ---------- */
  var form = $('#contactForm');
  var msg = $('#formMsg');
  var btn = $('#submitBtn');

  function say(text, ok) {
    msg.textContent = text;
    msg.className = 'form__msg ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
      consent: form.consent.checked,
      website: form.website.value
    };
    btn.disabled = true;
    say('Sending…', true);

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.ok) {
          say('Thank you! Your message has been received. We will be in touch soon.', true);
          form.reset();
        } else {
          say(res.j.error || 'Something went wrong. Please try again.', false);
        }
      })
      .catch(function () {
        say('Network error. Please email info@hcenergymobility.rw instead.', false);
      })
      .then(function () { btn.disabled = false; });
  });
})();
