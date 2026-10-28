/**
 * Accessible accordion (FAQ). Panels are open in the static HTML so answers
 * are readable without JavaScript; this module collapses them and wires up
 * aria-expanded, keyboard navigation and a smooth height transition.
 */
export function initAccordions() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-accordion]').forEach((acc) => {
    const buttons = [...acc.querySelectorAll('.accordion-hyt__button')];
    const panelOf = (btn) => document.getElementById(btn.getAttribute('aria-controls'));

    const set = (btn, open, animate = true) => {
      const panel = panelOf(btn);
      if (!panel) return;
      btn.setAttribute('aria-expanded', String(open));
      if (!animate || reduce) {
        panel.hidden = !open;
        panel.style.height = '';
        return;
      }
      if (open) {
        panel.hidden = false;
        const h = panel.scrollHeight;
        panel.style.height = '0px';
        panel.classList.add('is-animating');
        requestAnimationFrame(() => { panel.style.height = `${h}px`; });
      } else {
        panel.style.height = `${panel.scrollHeight}px`;
        panel.classList.add('is-animating');
        requestAnimationFrame(() => { panel.style.height = '0px'; });
      }
      panel.addEventListener('transitionend', () => {
        panel.classList.remove('is-animating');
        panel.style.height = '';
        if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      }, { once: true });
    };

    // Open the first item, collapse the rest – unless the URL targets one
    buttons.forEach((btn, i) => set(btn, i === 0, false));

    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => set(btn, btn.getAttribute('aria-expanded') !== 'true'));
      btn.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowDown') next = buttons[i + 1] || buttons[0];
        if (e.key === 'ArrowUp') next = buttons[i - 1] || buttons[buttons.length - 1];
        if (e.key === 'Home') next = buttons[0];
        if (e.key === 'End') next = buttons[buttons.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
      });
    });
  });
}
