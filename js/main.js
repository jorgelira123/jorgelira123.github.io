(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
  }

  /* ---------- Theme ---------- */
  function effectiveTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    storageSet('theme', next);
  });

  /* ---------- Language ----------
     English lives in the HTML. Portuguese strings come from js/i18n.js.
     The original English is cached on first switch so toggling back restores it. */
  var PT = window.I18N_PT || {};
  var originalHtml = new WeakMap();
  var originalAttrs = new WeakMap();

  function applyLanguage(lang) {
    var usePt = lang === 'pt';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
      if (usePt && PT[key] == null) console.warn('Missing PT translation:', key);
      el.innerHTML = usePt && PT[key] != null ? PT[key] : originalHtml.get(el);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      var saved = originalAttrs.get(el) || {};
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var key = parts[1].trim();
        if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
        if (usePt && PT[key] == null) console.warn('Missing PT translation:', key);
        el.setAttribute(attr, usePt && PT[key] != null ? PT[key] : saved[attr]);
      });
      originalAttrs.set(el, saved);
    });

    root.setAttribute('lang', usePt ? 'pt-BR' : 'en');
    renderCounts();
  }

  /* ---------- Count-up numbers (hero facts) ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('.count'));

  function formatCount(el, value) {
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var text = value.toFixed(decimals);
    if (root.getAttribute('lang') === 'pt-BR') text = text.replace('.', ',');
    return text + (el.getAttribute('data-suffix') || '');
  }

  // Shows the final value (or the in-progress value while animating) in the current language
  function renderCounts() {
    counters.forEach(function (el) {
      var value = el._current != null ? el._current : parseFloat(el.getAttribute('data-count'));
      el.textContent = formatCount(el, value);
    });
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el._current = target * eased;
      el.textContent = formatCount(el, el._current);
      if (t < 1) requestAnimationFrame(step);
      else el._current = null;
    }
    requestAnimationFrame(step);
  }

  if (!reduceMotion && hasIO) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el._current = 0;
      el.textContent = formatCount(el, 0);
      countObserver.observe(el);
    });
  }

  /* ---------- Language init ----------
     Priority: ?lang=pt|en in the URL, then the saved choice, then English */
  var params = new URLSearchParams(window.location.search);
  var lang = params.get('lang');
  if (lang !== 'pt' && lang !== 'en') lang = storageGet('lang');
  if (lang !== 'pt') lang = 'en';
  if (lang === 'pt') applyLanguage('pt');

  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'pt' ? 'en' : 'pt';
    storageSet('lang', lang);
    applyLanguage(lang);
  });

  /* ---------- Mobile nav ---------- */
  var nav = document.getElementById('site-nav');
  var navToggle = document.getElementById('nav-toggle');

  function setNavOpen(open) {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  navToggle.addEventListener('click', function () {
    setNavOpen(!nav.classList.contains('open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNavOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNavOpen(false);
  });

  /* ---------- Header shadow on scroll ---------- */
  var header = document.getElementById('site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link for the section in view ---------- */
  if (hasIO) {
    var navLinks = {};
    nav.querySelectorAll('a[href^="#"]').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navLinks[entry.target.id];
        if (link) link.classList.toggle('active', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navLinks).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Reveal on scroll (staggered inside grids) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
        var index = siblings.indexOf(el);
        if (siblings.length > 2) el.style.setProperty('--delay', Math.min(index * 0.07, 0.35) + 's');
        el.classList.add('in');
        // Drop the stagger delay afterwards so hover transitions respond immediately
        setTimeout(function () { el.style.removeProperty('--delay'); }, 1200);
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Data packets flowing along diagram edges ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';
  var edgeId = 0;

  function addPackets(svg) {
    svg.querySelectorAll('path.edge').forEach(function (path) {
      if (!path.id) path.id = 'edge-' + (++edgeId);
      var dur = Math.max(1.4, path.getTotalLength() / 45);
      for (var k = 0; k < 2; k++) {
        var dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('r', '2.6');
        dot.setAttribute('class', 'packet');
        var motion = document.createElementNS(SVG_NS, 'animateMotion');
        motion.setAttribute('dur', dur.toFixed(2) + 's');
        motion.setAttribute('repeatCount', 'indefinite');
        motion.setAttribute('begin', (-k * dur / 2).toFixed(2) + 's');
        var mpath = document.createElementNS(SVG_NS, 'mpath');
        mpath.setAttribute('href', '#' + path.id);
        mpath.setAttributeNS(XLINK_NS, 'xlink:href', '#' + path.id);
        motion.appendChild(mpath);
        dot.appendChild(motion);
        svg.appendChild(dot);
      }
    });
  }

  if (!reduceMotion) {
    var diagrams = document.querySelectorAll('svg.dg');
    diagrams.forEach(addPackets);
    // Only animate diagrams that are on screen
    if (hasIO) {
      var diagramObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var svg = entry.target;
          if (!svg.pauseAnimations) return;
          if (entry.isIntersecting) svg.unpauseAnimations();
          else svg.pauseAnimations();
        });
      });
      diagrams.forEach(function (svg) { diagramObserver.observe(svg); });
    }
  }

  /* ---------- Card spotlight follows the pointer ---------- */
  if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ---------- Copy e-mail ---------- */
  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');
      function done() {
        copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.classList.remove('copied'); }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, function () { window.location.href = 'mailto:' + email; });
      } else {
        window.location.href = 'mailto:' + email;
      }
    });
  }
})();
