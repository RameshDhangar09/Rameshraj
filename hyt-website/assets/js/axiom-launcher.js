/**
 * Axiom launcher (tiny, on every page). The chat panel and its knowledge
 * file are only downloaded when a visitor opens the chat, so the assistant
 * costs nothing for visitors who never use it.
 */
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};

export function initAxiomLauncher() {
  const root = document.querySelector('[data-axiom]');
  if (!root) return;
  const btn = root.querySelector('[data-axiom-open]');
  const bubble = root.querySelector('[data-axiom-bubble]');
  let chat = null;
  let loading = null;

  const load = () => {
    if (!loading) {
      loading = import('./axiom.js').then((m) => { chat = m.createAxiom(root, btn); return chat; });
    }
    return loading;
  };
  const hideBubble = () => { if (bubble) bubble.hidden = true; store.set('axiom-bubble', 'off'); };

  btn.addEventListener('click', async () => {
    hideBubble();
    btn.classList.add('is-loading');
    try {
      const c = await load();
      c.toggle();
    } catch (err) {
      console.warn('[hyt] Axiom failed to load', err);
    } finally {
      btn.classList.remove('is-loading');
    }
  });
  // Warm the module on hover/focus so the panel opens instantly
  ['pointerenter', 'focus'].forEach((ev) => btn.addEventListener(ev, () => { load().catch(() => {}); }, { once: true }));

  // One friendly greeting bubble per visit, after the visitor has had time to look around
  bubble?.querySelector('[data-axiom-bubble-close]')?.addEventListener('click', hideBubble);
  if (bubble && store.get('axiom-bubble') !== 'off' && store.get('axiom-open') !== '1') {
    setTimeout(() => {
      if (store.get('axiom-bubble') === 'off' || root.classList.contains('is-open')) return;
      bubble.hidden = false;
      setTimeout(() => { if (!root.classList.contains('is-open')) bubble.hidden = true; }, 12000);
    }, 9000);
  }
  // Re-open automatically on the next page if the chat was open
  if (store.get('axiom-open') === '1') load().then((c) => c.open(false)).catch(() => {});
}
