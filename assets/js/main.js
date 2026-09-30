/* ═══════════════════════════════════════════════════════════
   Shankari — UGC portfolio
   Mobile nav · scroll reveal · active link · video lightbox · form
   No dependencies. Everything degrades gracefully without JS.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Footer year ───────────────────────────────────────── */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ── Mobile nav ────────────────────────────────────────── */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // Close after tapping a link
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
  }

  /* ── Header shadow on scroll ───────────────────────────── */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('stuck', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Scroll reveal ─────────────────────────────────────── */
  var revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ── Active nav link ───────────────────────────────────── */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]:not(.btn)') : [];

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var linkFor = {};
    navLinks.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ── Hero loop: pause when off screen, and honour reduced motion ── */
  var heroVideo = document.querySelector('.phone video');
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var p = heroVideo.play();
            if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stays */ });
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.15 }).observe(heroVideo);
    }
  }

  /* ── Video lightbox ────────────────────────────────────── */
  var lightbox = document.getElementById('lightbox');
  var lbVideo = document.getElementById('lbVideo');
  var lbCaption = document.getElementById('lbCaption');
  var lbClose = document.getElementById('lbClose');
  var lastFocused = null;

  // Swap in fresh <source> children so the browser can pick mp4 or webm.
  function setSources(mp4, webm) {
    lbVideo.innerHTML = '';
    [[mp4, 'video/mp4'], [webm, 'video/webm']].forEach(function (pair) {
      if (!pair[0]) return;
      var s = document.createElement('source');
      s.src = pair[0];
      s.type = pair[1];
      lbVideo.appendChild(s);
    });
    lbVideo.load();
  }

  function openLightbox(src, webm, title, isWide) {
    if (!lightbox || !lbVideo) return;
    lastFocused = document.activeElement;

    setSources(src, webm);
    lbVideo.classList.toggle('wide', !!isWide);
    lbCaption.textContent = title || '';

    lightbox.hidden = false;
    document.body.classList.add('lb-open');
    // next frame so the transition runs
    requestAnimationFrame(function () { lightbox.classList.add('show'); });

    var p = lbVideo.play();
    if (p && p.catch) p.catch(function () { /* user can hit the controls */ });
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove('show');
    lbVideo.pause();

    var finish = function () {
      lightbox.hidden = true;
      lbVideo.innerHTML = '';
      lbVideo.removeAttribute('src');
      lbVideo.load();                       // release the buffer
      document.body.classList.remove('lb-open');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    if (reduceMotion) finish();
    else setTimeout(finish, 250);
  }

  document.querySelectorAll('.work-media').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openLightbox(
        btn.dataset.video,
        btn.dataset.videoWebm,
        btn.dataset.title,
        btn.closest('.work-card') && btn.closest('.work-card').classList.contains('is-wide')
      );
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);

  if (lightbox) {
    // Click the backdrop (not the video) to close
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    // Esc to close, Tab kept inside the dialog
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'Tab') {
        var focusables = [lbClose, lbVideo].filter(Boolean);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── Contact form ──────────────────────────────────────────
     If the form has an `action` (e.g. Formspree), we leave it alone.
     Otherwise we compose a mailto: so it works on static hosting.
  ───────────────────────────────────────────────────────────── */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');

  if (form && !form.getAttribute('action')) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var get = function (k) { return (data.get(k) || '').toString().trim(); };

      var subject = 'UGC enquiry from ' + (get('brand') || get('name') || 'a new project');
      var body = [
        'Name: ' + get('name'),
        'Brand: ' + (get('brand') || 'not given'),
        'Email: ' + get('email'),
        'Package: ' + get('package'),
        '',
        get('message')
      ].join('\n');

      var to = form.dataset.email || '';
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (note) {
        note.textContent = "Opening your email app. If nothing happens, write to " + to;
        note.classList.add('ok');
      }
    });
  }

})();
