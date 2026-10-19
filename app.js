(() => {
  'use strict';
  const root = document.documentElement;
  const arabic = root.lang === 'ar';
  const languageLink = document.querySelector('.language-link');
  const languagePath = languageLink.getAttribute('href');
  function syncLanguageLink() {
    languageLink.setAttribute('href', languagePath + location.hash);
  }
  syncLanguageLink();
  addEventListener('hashchange', syncLanguageLink);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const group = document.querySelector('.portfolio-group');
  const duplicate = group.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.querySelectorAll('video').forEach(video => video.removeAttribute('aria-label'));
  group.parentElement.append(duplicate);
  const videos = [...document.querySelectorAll('video')];
  const hero = document.querySelector('#hero-video');
  const resultVideo = document.querySelector('#result-video');
  const resultControl = document.querySelector('.result-control');
  let resultReady = false;
  let resultPaused = false;
  let resultManualPlay = false;
  resultVideo.controls = false;
  resultControl.hidden = false;
  resultControl.tabIndex = -1;
  const inView = new Set();
  let tickerHeld = false;
  const ticker = document.querySelector('.portfolio-ticker');

  function syncVideos() {
    videos.forEach(video => {
      const isHero = video === hero;
      const allowed = isHero
        ? !reduced.matches
        : video === resultVideo
          ? resultReady && !resultPaused && (!reduced.matches || resultManualPlay)
          : !reduced.matches && !tickerHeld;
      if (allowed && !document.hidden && inView.has(video)) video.play().catch(() => {});
      else video.pause();
    });
  }
  function syncResultControl() {
    resultControl.setAttribute('aria-pressed', String(!resultVideo.paused));
    resultControl.setAttribute('aria-label', arabic
      ? (resultVideo.paused ? 'تشغيل فيديو الوكالة' : 'إيقاف فيديو الوكالة مؤقتاً')
      : `${resultVideo.paused ? 'Play' : 'Pause'} agency reel`);
    resultControl.firstElementChild.textContent = resultVideo.paused ? '▷' : 'Ⅱ';
  }
  function setResultReady(ready) {
    if (resultReady === ready) return;
    resultReady = ready;
    resultControl.tabIndex = ready ? 0 : -1;
    syncVideos();
  }
  resultVideo.addEventListener('play', syncResultControl);
  resultVideo.addEventListener('pause', syncResultControl);
  resultVideo.addEventListener('error', () => { resultControl.hidden = true; });
  resultControl.addEventListener('click', () => {
    resultPaused = !resultVideo.paused;
    resultManualPlay = !resultPaused;
    syncVideos();
  });
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
    document.querySelectorAll('video,.word-ticker,.portfolio-ticker,.hero-toolkit,.edit-workflow').forEach(el => activity.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
  }
  setResultReady(true);


  const header = document.querySelector('.header');
  let pending = false;
  addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { header.classList.toggle('is-scrolled', scrollY > 20); pending = false; });
  }, { passive: true });
  hero.addEventListener('error', () => {
    hero.setAttribute('aria-label', arabic
      ? 'صورة فيديو المونتاج بالذكاء الاصطناعي. الفيديو غير متاح حالياً.'
      : 'AI editing film poster. Video is currently unavailable.');
  });
  function holdTicker() {
    tickerHeld = ticker.matches(':hover') || ticker.matches(':focus-within');
    syncVideos();
  }
  ['pointerenter','pointerleave','focusin','focusout'].forEach(event => ticker.addEventListener(event, holdTicker));
  reduced.addEventListener('change', () => { resultManualPlay = false; syncMotion(); });
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
  syncMotion();
})();
