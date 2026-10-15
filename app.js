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
    document.querySelectorAll('video,.word-ticker,.portfolio-ticker,.day-row').forEach(el => activity.observe(el));
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
