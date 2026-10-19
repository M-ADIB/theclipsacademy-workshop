(() => {
  'use strict';
  const switcher = document.querySelector('.path-switch');
  if (switcher) {
    const buttons = [...switcher.querySelectorAll('button')];
    const select = selected => buttons.forEach(button => {
      const active = button === selected;
      button.setAttribute('aria-pressed', String(active));
      document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
    });
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    select(buttons[0]);
    switcher.hidden = false;
  }
  const arabic = document.documentElement.lang === 'ar';
  const number = new Intl.NumberFormat(arabic ? 'ar' : 'en-US');
  const labels = arabic
    ? { approved: 'معتمد', change: 'طُلب تغييره', pending: 'بانتظارك' }
    : { approved: 'Approved', change: 'Change requested', pending: 'Waiting for you' };

  document.querySelectorAll('.demo-director').forEach(demo => {
    const beats = [...demo.querySelectorAll('[data-beat]')];
    function tally() {
      for (const state of Object.keys(labels)) {
        demo.querySelector(`[data-tally="${state}"]`).textContent = number.format(beats.filter(beat => beat.classList.contains(`is-${state}`)).length);
      }
    }
    beats.forEach(beat => {
      const approve = beat.querySelector('.beat-approve');
      const change = beat.querySelector('.beat-change');
      function setState(state) {
        beat.classList.remove('is-approved', 'is-change', 'is-pending');
        beat.classList.add(`is-${state}`);
        approve.setAttribute('aria-pressed', String(state === 'approved'));
        change.setAttribute('aria-pressed', String(state === 'change'));
        beat.querySelector('.beat-state').textContent = labels[state];
        tally();
      }
      setState(beat.classList.contains('is-approved') ? 'approved' : beat.classList.contains('is-change') ? 'change' : 'pending');
      approve.addEventListener('click', () => setState(beat.classList.contains('is-approved') ? 'pending' : 'approved'));
      change.addEventListener('click', () => {
        setState(beat.classList.contains('is-change') ? 'pending' : 'change');
        if (beat.classList.contains('is-change')) beat.querySelector('textarea').focus({ preventScroll: true });
      });
    });
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const counters = [...document.querySelectorAll('[data-count]')];
  const show = (element, value) => { element.textContent = number.format(Math.round(value)); };
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const element = entry.target;
      const target = Number(element.dataset.count);
      const start = performance.now();
      function tick(now) {
        const progress = reduced.matches ? 1 : Math.min((now - start) / 1800, 1);
        show(element, target * (1 - (1 - progress) ** 4));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }), { threshold: .6 });
    counters.forEach(element => observer.observe(element));
  }
})();
