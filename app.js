(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const group = document.querySelector('.portfolio-group');
  const duplicate = group.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.querySelectorAll('video').forEach(video => video.removeAttribute('aria-label'));
  group.parentElement.append(duplicate);
  const videos = [...document.querySelectorAll('video')];
  const hero = document.querySelector('#hero-video');
  const heroControl = document.querySelector('.film-control');
  const inView = new Set();
  let heroPaused = false;
  let heroManualPlay = false;
  let tickerHeld = false;
  const ticker = document.querySelector('.portfolio-ticker');

  function syncControl() {
    heroControl.setAttribute('aria-pressed', String(!hero.paused));
    heroControl.setAttribute('aria-label', `${hero.paused ? 'Play' : 'Pause'} hero film`);
    heroControl.firstElementChild.textContent = hero.paused ? '▷' : 'Ⅱ';
  }
  function syncVideos() {
    videos.forEach(video => {
      const isHero = video === hero;
      const allowed = isHero ? !heroPaused && (!reduced.matches || heroManualPlay) : !reduced.matches && !tickerHeld;
      if (allowed && !document.hidden && inView.has(video)) video.play().catch(() => { if (isHero) syncControl(); });
      else video.pause();
    });
  }
  function syncMotion() {
    root.classList.toggle('motion', !reduced.matches);
    root.classList.toggle('page-hidden', document.hidden);
    syncVideos();
  }
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); reveal.unobserve(entry.target); }
    }), { threshold: .1, rootMargin: '0px 0px -2% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el));
    const activity = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
        if (entry.target.tagName === 'VIDEO') {
          if (entry.isIntersecting) inView.add(entry.target);
          else inView.delete(entry.target);
        }
      });
      syncVideos();
    }, { threshold: .05 });
    document.querySelectorAll('video,.word-ticker,.portfolio-ticker').forEach(el => activity.observe(el));
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) document.querySelectorAll('.nav a').forEach(a => {
        if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-20% 0px -50% 0px', threshold: 0 });
    document.querySelectorAll('main>section').forEach(section => navObserver.observe(section));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
  }
  const assembly = document.querySelector('.method');
  const assemblyPin = assembly.querySelector('.assembly-pin');
  const assemblySticky = assembly.querySelector('.assembly-sticky');
  const assemblyField = assembly.querySelector('.assembly-field');
  const ingredients = [...assembly.querySelectorAll('.ingredient')];
  const wires = [...assembly.querySelectorAll('.assembly-wires path')];
  const assemblyStatus = assembly.querySelector('.assembly-status');
  const assemblyResult = assembly.querySelector('.assembly-result');
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  let assemblyFrame = 0;
  let assemblyGeometry;
  let lastAssemblyProgress = -1;

  function renderAssembly(progress) {
    if (progress === lastAssemblyProgress) return;
    lastAssemblyProgress = progress;
    const { width, height, cards } = assemblyGeometry;
    const wirePull = ease(clamp((progress - .05) / .4));
    ingredients.forEach((card, index) => {
      const merge = ease(clamp((progress - .12 - index * .025) / .46));
      const remaining = 1 - merge;
      const { x, y, rotate } = cards[index];
      card.style.setProperty('--x', x * remaining);
      card.style.setProperty('--y', y * remaining);
      card.style.setProperty('--r', rotate * remaining);
      card.style.setProperty('--s', 1 - merge * .52);
      card.style.setProperty('--o', 1 - clamp((merge - .62) / .38));
      const other = cards[(index + 2) % cards.length];
      const startX = width / 2 + x * remaining;
      const startY = height / 2 + y * remaining;
      const endX = width / 2 + other.x * (1 - wirePull) * remaining;
      const endY = height / 2 + other.y * (1 - wirePull) * remaining;
      const bend = (index % 2 ? 65 : -65) * (1 - wirePull);
      wires[index].setAttribute('d', `M ${startX} ${startY} C ${width / 2 + bend} ${startY}, ${endX} ${height / 2 + bend}, ${endX} ${endY}`);
    });
    const result = ease(clamp((progress - .56) / .22));
    const finish = ease(clamp((progress - .56) / .22));
    const resultSize = Math.min(1, (height - 20) / assemblyGeometry.resultHeight);
    assembly.style.setProperty('--wire-opacity', .32 * (1 - clamp((progress - .48) / .2)));
    assembly.style.setProperty('--center-opacity', 1 - clamp((progress - .30) / .25));
    assembly.style.setProperty('--result-opacity', result);
    assembly.style.setProperty('--result-scale', (.55 + result * .45) * resultSize);
    assembly.style.setProperty('--type-offset', (1 - finish) * 100);
    assembly.style.setProperty('--ring-turn', finish * 70);
    assembly.style.setProperty('--assembly-progress', progress);
    assembly.classList.toggle('is-assembled', progress > .76);
    const status = progress > .76 ? '5 components. One great reel.' : '5 components. One connected method.';
    if (assemblyStatus.textContent !== status) assemblyStatus.textContent = status;
  }

  function updateAssembly() {
    assemblyFrame = 0;
    if (!assembly.classList.contains('assembly-animated')) return;
    const rect = assemblyPin.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(assemblySticky).top);
    const range = Math.max(1, rect.height - assemblySticky.offsetHeight);
    renderAssembly(clamp((top - rect.top) / range));
  }

  function requestAssembly() {
    if (!assemblyFrame) assemblyFrame = requestAnimationFrame(updateAssembly);
  }

  function measureAssembly() {
    // Short viewports and reduced motion use the fully readable static composition.
    assembly.classList.toggle('assembly-animated', !reduced.matches && innerHeight >= 640);
    const width = assemblyField.clientWidth;
    const height = assemblyField.clientHeight;
    assemblyGeometry = {
      width, height, resultHeight: assemblyResult.offsetHeight,
      cards: ingredients.map(card => {
        const xLimit = Math.max(0, (width - card.offsetWidth * 1.16) / 2 - 5);
        const yLimit = Math.max(0, (height - card.offsetHeight * 1.16) / 2 - 10);
        const x = Number(card.dataset.x) * width;
        const y = Number(card.dataset.y) * height;
        return { x: Math.sign(x) * Math.min(Math.abs(x), xLimit), y: Math.sign(y) * Math.min(Math.abs(y), yLimit), rotate: Number(card.dataset.rotate) };
      })
    };
    lastAssemblyProgress = -1;
    if (!assembly.classList.contains('assembly-animated')) {
      assembly.classList.remove('is-assembled');
      assemblyStatus.textContent = '5 components. One great reel.';
    }
    requestAssembly();
  }

  addEventListener('scroll', requestAssembly, { passive: true });
  addEventListener('resize', measureAssembly);
  reduced.addEventListener('change', measureAssembly);
  if ('ResizeObserver' in window) new ResizeObserver(measureAssembly).observe(assemblyField);
  measureAssembly();

  const header = document.querySelector('.header');
  let pending = false;
  addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { header.classList.toggle('is-scrolled', scrollY > 20); pending = false; });
  }, { passive: true });
  hero.addEventListener('play', syncControl);
  hero.addEventListener('pause', syncControl);
  hero.addEventListener('error', () => {
    heroControl.hidden = true;
    hero.setAttribute('aria-label', 'AI editing film poster. Video is currently unavailable.');
  });
  heroControl.addEventListener('click', () => {
    heroPaused = !hero.paused;
    heroManualPlay = !heroPaused;
    syncVideos();
  });
  function holdTicker() {
    tickerHeld = ticker.matches(':hover') || ticker.matches(':focus-within');
    syncVideos();
  }
  ['pointerenter','pointerleave','focusin','focusout'].forEach(event => ticker.addEventListener(event, holdTicker));
  reduced.addEventListener('change', () => { heroManualPlay = false; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(button => {
      button.addEventListener('pointermove', event => {
        if (reduced.matches) return;
        const rect = button.getBoundingClientRect();
        button.firstElementChild.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .035}px,${(event.clientY - rect.top - rect.height / 2) * .09}px)`;
      });
      button.addEventListener('pointerleave', () => { button.firstElementChild.style.transform = ''; });
    });
  }
  const dialog = document.querySelector('#booking-dialog');
  document.querySelector('[data-booking]').addEventListener('click', () => {
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
  const closeDialog = () => dialog.close();
  document.querySelector('.dialog-close').addEventListener('click', closeDialog);
  document.querySelector('.dialog-done').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  syncMotion();
  syncControl();
})();
