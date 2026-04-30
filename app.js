// ──────────────────────────────────────────────────────────────
// APP v2 — intro · smooth scroll · magnetic · scramble · audio
// ──────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── INTRO SEQUENCE ──────────────────────────────────────────
  const intro = document.getElementById('intro');
  const introBar = intro.querySelector('.intro__bar span');
  const introCount = document.getElementById('intro-count');
  const introStatus = document.getElementById('intro-status');

  const STATUSES = [
    'LOADING ASSETS', 'COMPILING SHADERS', 'WARMING PARTICLES',
    'CALIBRATING SCENE', 'READY',
  ];
  let pct = 0, statusIdx = 0;
  const introTimer = setInterval(() => {
    pct += Math.random() * 6 + 3;
    if (pct >= 100) {
      pct = 100;
      clearInterval(introTimer);
      introStatus.textContent = STATUSES[STATUSES.length - 1];
      setTimeout(finishIntro, 600);
    } else {
      const newIdx = Math.min(STATUSES.length - 2, Math.floor(pct / 25));
      if (newIdx !== statusIdx) {
        statusIdx = newIdx;
        introStatus.textContent = STATUSES[statusIdx];
      }
    }
    introBar.style.width = pct + '%';
    introCount.textContent = String(Math.floor(pct)).padStart(3, '0');
  }, 70);

  function finishIntro() {
    intro.classList.add('is-done');
    document.body.classList.add('is-loaded');
    setTimeout(() => intro.remove(), 1300);
  }

  // ── LENIS SMOOTH SCROLL ─────────────────────────────────────
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.6,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ── CUSTOM CURSOR ───────────────────────────────────────────
  if (!isCoarse) {
    const cursor = document.getElementById('cursor');
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    const label = cursor.querySelector('.cursor__label');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my;
    let rx = mx, ry = my;

    document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

    function cursorTick() {
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(cursorTick);
    }
    cursorTick();

    document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover');
        const kind = el.dataset.cursor;
        if (kind === 'cta') {
          cursor.classList.add('is-cta');
          label.textContent = 'CLICK';
        } else if (kind === 'project') {
          cursor.classList.add('is-project');
          label.textContent = 'VIEW';
        }
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover', 'is-cta', 'is-project');
        label.textContent = '';
      });
    });

    document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
    document.addEventListener('mouseenter', () => cursor.style.opacity = '1');
  }

  // ── MAGNETIC BUTTONS ────────────────────────────────────────
  if (!isCoarse) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      let raf;
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
          el.style.setProperty('--mx', `${(e.clientX - rect.left) / rect.width * 100}%`);
          el.style.setProperty('--my', `${(e.clientY - rect.top) / rect.height * 100}%`);
        });
        // signal hero blob to glow on CTA hover
        if (el.dataset.cursor === 'cta' && window.__bloblHover) window.__bloblHover(true);
      });
      el.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
        if (window.__bloblHover) window.__bloblHover(false);
      });
    });
  }

  // ── TEXT SCRAMBLE ───────────────────────────────────────────
  // Inspired by the classic "decoder" effect — scrambles to original
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#01';

  function scrambleText(el) {
    if (el.dataset.scrambling === '1') return;
    const original = el.dataset.scrambleOriginal || el.textContent;
    if (!el.dataset.scrambleOriginal) el.dataset.scrambleOriginal = original;

    el.dataset.scrambling = '1';
    const len = original.length;
    const queue = [];
    for (let i = 0; i < len; i++) {
      const from = original[i];
      const to = original[i];
      const start = Math.floor(Math.random() * 30);
      const end = start + Math.floor(Math.random() * 30) + 12;
      queue.push({ from, to, start, end });
    }

    let frame = 0;
    function update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        let char;
        if (frame >= end) { complete++; char = to; }
        else if (frame >= start) {
          char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        } else { char = from; }
        output += char;
      }
      el.textContent = output;
      if (complete === queue.length) {
        el.dataset.scrambling = '0';
      } else {
        frame++;
        requestAnimationFrame(update);
      }
    }
    update();
  }

  // run on hover
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    el.dataset.scrambleOriginal = el.textContent;
    if (!isCoarse) {
      el.addEventListener('mouseenter', () => scrambleText(el));
    }
  });

  // run once on intersection (auto-reveal effect)
  const scrambleObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // small delay so it doesn't all fire at once
        setTimeout(() => scrambleText(e.target), Math.random() * 250);
        scrambleObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.project__title[data-scramble], .timeline__body h4[data-scramble], .process__item h4[data-scramble]').forEach((el) => {
    scrambleObs.observe(el);
  });

  // ── NAV SCROLL STATE ────────────────────────────────────────
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── MOBILE MENU ─────────────────────────────────────────────
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    mobileMenu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      burger.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
      document.body.style.overflow = '';
    });
  });

  // ── SCROLL REVEALS ──────────────────────────────────────────
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const idx = Array.from(entry.target.parentNode.children).indexOf(entry.target);
      entry.target.style.transitionDelay = `${Math.min(idx * 70, 500)}ms`;
      entry.target.classList.add('is-visible');
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.fade-up').forEach((el) => revealObs.observe(el));

  // ── REVEAL LINES (contact title) ────────────────────────────
  document.querySelectorAll('.contact__title .reveal').forEach((el, i) => {
    const original = el.textContent;
    const cls = el.className;
    el.textContent = '';
    el.style.overflow = 'hidden';
    const inner = document.createElement('span');
    inner.style.cssText = `display:block; transform:translateY(110%) rotate(6deg); transition: transform 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 120}ms;`;
    inner.textContent = original;
    if (cls.includes('italic')) inner.classList.add('italic');
    if (cls.includes('accent')) inner.classList.add('accent');
    el.appendChild(inner);

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          inner.style.transform = 'translateY(0) rotate(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  // ── COUNTERS ────────────────────────────────────────────────
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const dur = 1500;
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(target * eased);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((c) => counterObs.observe(c));

  // ── PROJECT CARD TILT ───────────────────────────────────────
  if (!isCoarse) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      let rect, raf;
      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-4px)`;
          const shape = card.querySelector('.project__shape');
          if (shape) shape.style.transform = `translate(${x * 60}px, ${y * 60}px)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        card.style.transform = '';
        const shape = card.querySelector('.project__shape');
        if (shape) shape.style.transform = '';
      });
    });
  }

  // ── ANCHOR CLICKS (use Lenis for smooth scroll) ─────────────
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -60, duration: 1.4 });
      } else {
        const y = target.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // ── SECTION INDICATOR + SCROLL PROGRESS ─────────────────────
  const indicator = document.getElementById('indicator');
  const indicatorLinks = indicator ? Array.from(indicator.querySelectorAll('a')) : [];
  const progress = document.getElementById('progress');
  const sections = document.querySelectorAll('[data-section]');

  function updateIndicator() {
    const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const pct = (window.scrollY / max) * 100;
    if (progress) progress.style.width = pct + '%';

    let active = sections[0];
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.4) active = s;
    });
    if (active) {
      const id = active.dataset.section;
      indicatorLinks.forEach((a) => {
        a.classList.toggle('is-active', a.dataset.section === id);
      });
    }
  }
  window.addEventListener('scroll', updateIndicator, { passive: true });
  updateIndicator();

  // ── MARQUEE ANIMATION (manual, scroll-velocity reactive) ────
  const marquees = document.querySelectorAll('[data-marquee]');
  const marqueeState = [];
  marquees.forEach((el) => {
    const dir = el.dataset.marquee === 'reverse' ? 1 : -1;
    el.innerHTML = el.innerHTML + el.innerHTML; // double for seamless loop
    marqueeState.push({ el, x: 0, dir, baseSpeed: 0.4 });
  });

  let lastScrollY = window.scrollY;
  let scrollVel = 0;
  function marqueeTick() {
    const dy = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollVel += (Math.abs(dy) - scrollVel) * 0.1;

    marqueeState.forEach((s) => {
      const speed = s.baseSpeed + Math.min(scrollVel * 0.2, 4);
      s.x += s.dir * speed;
      const w = s.el.scrollWidth / 2;
      if (Math.abs(s.x) > w) s.x = 0;
      s.el.style.transform = `translate3d(${s.x}px, 0, 0)`;
    });
    requestAnimationFrame(marqueeTick);
  }
  if (!reduceMotion) requestAnimationFrame(marqueeTick);

  // ── AUDIO TOGGLE (Web Audio synth pad) ──────────────────────
  const audioBtn = document.getElementById('audio-toggle');
  let audioCtx = null;
  let masterGain = null;
  let oscNodes = [];

  function startAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    const reverb = audioCtx.createConvolver();
    // simple noise impulse for reverb
    const len = audioCtx.sampleRate * 2;
    const impulse = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    reverb.buffer = impulse;
    reverb.connect(masterGain);

    // ambient pad — three detuned sines
    const freqs = [110, 138.6, 220.0]; // A2, C#3, A3
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = (i - 1) * 6;

      const g = audioCtx.createGain();
      g.gain.value = 0.06;
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();

      osc.connect(g).connect(reverb);
      osc.start();
      oscNodes.push(osc, lfo);
    });

    // fade in
    masterGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 1.5);
  }

  function stopAudio() {
    if (!audioCtx) return;
    masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
    setTimeout(() => {
      oscNodes.forEach((n) => { try { n.stop(); } catch {} });
      oscNodes = [];
      audioCtx.close();
      audioCtx = null;
    }, 700);
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const on = audioBtn.classList.toggle('is-on');
      audioBtn.querySelector('.audio-toggle__label').textContent = on ? 'SOUND ON' : 'SOUND OFF';
      if (on) startAudio(); else stopAudio();
    });
  }

  // ── EASTER EGG: type "saad" → palette flash ────────────────
  let buf = '';
  document.addEventListener('keydown', (e) => {
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === 'saad') {
      document.documentElement.animate(
        [
          { filter: 'hue-rotate(0deg) saturate(1)' },
          { filter: 'hue-rotate(360deg) saturate(1.6)' },
          { filter: 'hue-rotate(0deg) saturate(1)' },
        ],
        { duration: 1400, easing: 'ease-in-out' }
      );
    }
  });
})();
