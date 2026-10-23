/* EUCF 2026 — інтерактив лендінгу */
(function () {
  'use strict';

  /* Посилання, які надає оргкомітет. Порожнє значення = кнопка веде до блоку контактів. */
  var LINKS = {
    register: '', // Google Форма реєстрації
    pfe: ''       // сайт фундації Pray for Europe
  };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- external links ---------- */
  $$('[data-register]').forEach(function (a) {
    if (LINKS.register) a.href = LINKS.register;
    else { a.href = '#contact'; a.removeAttribute('target'); a.removeAttribute('rel'); }
  });
  $$('[data-link="pfe"]').forEach(function (a) {
    if (LINKS.pfe) a.href = LINKS.pfe;
    else { a.href = '#partners'; a.removeAttribute('target'); a.removeAttribute('rel'); }
  });

  /* ---------- theme ---------- */
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') || 'light';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  /* ---------- header, active nav & drawer ---------- */
  var header = $('.header');
  var navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
    var y = window.scrollY + 140, cur = null;
    sections.forEach(function (s) { if (s.offsetTop <= y) cur = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var drawer = $('.drawer');
  var burger = $('.burger');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  $$('[data-drawer-close]').forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });

  /* ---------- reveal & counters ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.hasAttribute('data-count')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  // cascade cards inside one grid by their index
  $$('.gallery, .partners').forEach(function (g) {
    $$('[data-reveal]', g).forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 0.06 + 's'); });
  });
  $$('[data-reveal], [data-count]').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- countdown ---------- */
  var cd = $('[data-countdown]');
  if (cd) {
    var start = new Date(cd.getAttribute('data-countdown')).getTime();
    var FORMS = { d: ['день', 'дні', 'днів'], h: ['година', 'години', 'годин'], m: ['хвилина', 'хвилини', 'хвилин'], s: ['секунда', 'секунди', 'секунд'] };
    function plural(n, f) {
      var a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return f[0];
      if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return f[1];
      return f[2];
    }
    var cells = {}, labels = {};
    ['d', 'h', 'm', 's'].forEach(function (k) { cells[k] = $('[data-cd="' + k + '"]', cd); labels[k] = $('[data-cd-l="' + k + '"]', cd); });
    var timer;
    function tick() {
      var left = Math.max(0, start - Date.now());
      if (!left) { cd.classList.add('is-done'); clearInterval(timer); return; }
      var s = Math.floor(left / 1000);
      var v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      Object.keys(v).forEach(function (k) {
        var txt = k === 'd' ? String(v[k]) : String(v[k]).padStart(2, '0');
        if (cells[k].textContent !== txt) cells[k].textContent = txt;
        labels[k].textContent = plural(v[k], FORMS[k]);
      });
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- gallery lightbox ---------- */
  var more = $('[data-gallery-more]');
  if (more) more.addEventListener('click', function () { $('[data-gallery-extra]').hidden = false; more.parentNode.hidden = true; });
  var lb = $('#lightbox');
  var items = $$('[data-gallery] [data-full]');
  var idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx], img = $('img', lb);
    img.src = it.getAttribute('data-full');
    img.alt = $('img', it).alt;
    $('.lightbox__count', lb).textContent = (idx + 1) + ' / ' + items.length;
    // preload neighbour
    new Image().src = items[(idx + 1) % items.length].getAttribute('data-full');
  }
  function openLb(i) { lastFocus = document.activeElement; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.lightbox__close', lb).focus(); }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  if (lb && items.length) {
    items.forEach(function (it, i) { it.addEventListener('click', function () { openLb(i); }); });
    lb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb]');
      if (b) { var a = b.getAttribute('data-lb'); if (a === 'close') closeLb(); else show(idx + (a === 'next' ? 1 : -1)); return; }
      if (e.target === lb) closeLb();
    });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  document.addEventListener('keydown', function (e) {
    if (lb && lb.classList.contains('open')) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
      return;
    }
    if (e.key === 'Escape') setDrawer(false);
  });

  /* ---------- contact form → e-mail (FormSubmit) ---------- */
  var form = $('#contact-form');
  if (form) {
    var err = $('.form-error', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('.field', form).forEach(function (f) {
        var inp = $('input, textarea', f);
        if (inp.value) inp.value = inp.value.trim();
        var bad = !inp.checkValidity();
        f.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { var first = $('.invalid input, .invalid textarea', form); if (first) first.focus(); return; }

      var btn = $('button[type="submit"]', form);
      btn.classList.add('is-loading');
      err.classList.remove('show');
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data._subject = 'EUCF 2026 — нове повідомлення з сайту від ' + data.name;
      data._template = 'table';
      data._replyto = data.email;
      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || String(res.j.success) === 'false') throw new Error(res.j.message || 'send failed');
          form.innerHTML = '<div class="sent"><div class="sent__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>' +
            '<h3>Дякуємо!</h3><p>Повідомлення надіслано. Оргкомітет зв\'яжеться з Вами найближчим часом.</p></div>';
        })
        .catch(function () { err.classList.add('show'); })
        .then(function () { btn.classList.remove('is-loading'); });
    });
    $$('input, textarea', form).forEach(function (inp) {
      inp.addEventListener('input', function () { var f = inp.closest('.field'); if (f && inp.checkValidity()) f.classList.remove('invalid'); });
    });
  }
})();
