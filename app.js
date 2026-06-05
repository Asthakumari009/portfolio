// ──────────────────────────────────────────────────────────────
// SAAD° — interaction layer
// Reveal motion, masthead state, active nav, mobile menu, contact form.
// No external dependencies.
// ──────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // app.js is in control now — cancel the head-level "force everything visible" timer.
  if (window.__showFailsafe) clearTimeout(window.__showFailsafe);

  // ── SCROLL REVEAL (transform/opacity only, staggered per group) ──
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  const heroTitle = document.querySelector('[data-hero-title]');
  const revealAll = () => {
    revealEls.forEach((el) => el.classList.add('is-in'));
    if (heroTitle) heroTitle.classList.add('is-in');
  };

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // stagger relative to data-reveal siblings sharing a parent
        const group = Array.from(el.parentElement.querySelectorAll(':scope > [data-reveal]'));
        const i = Math.max(0, group.indexOf(el));
        el.style.setProperty('--reveal-delay', `${Math.min(i * 70, 350)}ms`);
        el.classList.add('is-in');
        obs.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach((el) => io.observe(el));
    if (heroTitle) requestAnimationFrame(() => heroTitle.classList.add('is-in'));

    // Failsafe: content must never stay hidden. If a render context never
    // scrolls (headless, prerender, hidden tab), reveal everything anyway.
    window.addEventListener('load', () => setTimeout(revealAll, 2500), { once: true });
  } else {
    revealAll();
  }

  // ── SCROLL PROGRESS BAR ──
  const progress = document.querySelector('.scroll-progress span');
  if (progress) {
    let ticking = false;
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      progress.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  // ── MASTHEAD: hairline on scroll ──
  const masthead = document.querySelector('.masthead');
  const onScroll = () => masthead.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── ACTIVE NAV LINK ──
  const navLinks = Array.from(document.querySelectorAll('.masthead__nav a'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = '#' + e.target.id;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  // ── MOBILE MENU ──
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      mobileNav.hidden = false;
      requestAnimationFrame(() => mobileNav.classList.add('is-open'));
    } else {
      mobileNav.classList.remove('is-open');
      setTimeout(() => { mobileNav.hidden = true; }, reduceMotion ? 0 : 280);
    }
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ── HERO SHOWCASE: auto-rotating carousel of live projects ──
  const showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    const slides = [
      { domain: 'crackedai.in',           label: 'Cracked AI', href: 'https://crackedai.in' },
      { domain: 'van-lavino.vercel.app',  label: 'Van Lavino', href: 'https://van-lavino.vercel.app' },
      { domain: 'tender-iq-mu.vercel.app', label: 'TenderIQ',  href: 'https://tender-iq-mu.vercel.app' },
    ];
    const imgs = Array.from(showcase.querySelectorAll('.showcase__img'));
    const dots = Array.from(showcase.querySelectorAll('.showcase__dot'));
    const link = document.getElementById('showcase-link');
    const domainEl = document.getElementById('showcase-domain');
    const labelEl = document.getElementById('showcase-label');
    let idx = 0;
    let timer = null;

    const show = (n) => {
      idx = (n + slides.length) % slides.length;
      imgs.forEach((im, i) => im.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      link.href = slides[idx].href;
      domainEl.textContent = slides[idx].domain;
      labelEl.textContent = slides[idx].label;
    };

    const start = () => {
      if (reduceMotion || timer) return;
      timer = setInterval(() => show(idx + 1), 3600);
    };
    const stop = () => { clearInterval(timer); timer = null; };

    dots.forEach((d, i) => d.addEventListener('click', (e) => {
      e.preventDefault();
      stop(); show(i); start();
    }));
    showcase.addEventListener('mouseenter', stop);
    showcase.addEventListener('mouseleave', start);
    showcase.addEventListener('focusin', stop);
    showcase.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    start();
  }

  // ── MAGNETIC BUTTONS (pointer-fine only) ──
  if (fine && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      let raf;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.4;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.style.transform = `translate(${x}px, ${y}px)`; });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  // ── POINTER TILT on case media (subtle) ──
  if (fine && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      let raf, rect;
      el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(1100px) rotateX(${-py * 3.2}deg) rotateY(${px * 4}deg) translateY(-6px)`;
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  // ── LEDGER COUNT-UP ──
  const counts = Array.from(document.querySelectorAll('.count'));
  if (counts.length && 'IntersectionObserver' in window) {
    const countObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        obs.unobserve(el);
        if (reduceMotion) { el.textContent = String(target); return; }
        const dur = 1100;
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = String(target);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.8 });
    counts.forEach((c) => countObs.observe(c));
  }

  // ── CONTACT FORM: real submit with validation + states ──
  const form = document.getElementById('contact-form');
  if (form) {
    const statusEl = document.getElementById('cf-status');
    const submitBtn = document.getElementById('cf-submit');
    const btnLabel = submitBtn.querySelector('.contact__submit-label');
    const nameInput = document.getElementById('cf-name');
    const emailInput = document.getElementById('cf-email');
    const msgInput = document.getElementById('cf-message');
    const companyInput = document.getElementById('cf-company');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setStatus = (msg, kind) => {
      statusEl.textContent = msg;
      statusEl.classList.remove('is-ok', 'is-err');
      if (kind) statusEl.classList.add(kind === 'ok' ? 'is-ok' : 'is-err');
      statusEl.classList.toggle('is-shown', Boolean(msg));
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = msgInput.value.trim();
      const company = companyInput.value.trim(); // honeypot

      if (!name || !email || !message) {
        setStatus('Please fill in your name, email, and message.', 'err');
        return;
      }
      if (!emailRe.test(email)) {
        setStatus('That email doesn’t look right — mind checking it?', 'err');
        emailInput.focus();
        return;
      }

      submitBtn.setAttribute('aria-busy', 'true');
      btnLabel.textContent = 'Sending…';
      setStatus('', null);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, company }),
        });

        let data = {};
        try { data = await res.json(); } catch { /* non-JSON */ }

        if (res.ok && data.ok) {
          form.reset();
          setStatus('Message sent — I’ll get back to you soon. Thanks!', 'ok');
        } else {
          setStatus(data.error || 'Something went wrong. Email me directly instead.', 'err');
        }
      } catch {
        setStatus('Network error — please email me directly instead.', 'err');
      } finally {
        submitBtn.removeAttribute('aria-busy');
        btnLabel.textContent = 'Send message';
      }
    });
  }
})();
