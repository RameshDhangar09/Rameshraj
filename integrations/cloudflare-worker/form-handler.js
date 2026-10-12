/**
 * HYT Engineering – secure form handler (Cloudflare Worker example).
 *
 * Receives POSTs from the website forms, validates them server-side, checks
 * the honeypot, verifies Cloudflare Turnstile (optional), applies rate
 * limiting and emails the submission to digitalmkt@hytengineering.com through
 * a transactional email API (Resend shown; any provider with an HTTPS API works).
 *
 * Secrets are configured in the Worker, never in website JavaScript:
 *   wrangler secret put RESEND_API_KEY
 *   wrangler secret put TURNSTILE_SECRET      (optional)
 * Vars (wrangler.toml): MAIL_TO, MAIL_FROM, ALLOWED_ORIGIN
 * KV namespace binding RATE_LIMIT (for per-IP limits).
 *
 * NOT DEPLOYED – reference implementation; test before go-live.
 */
const MAX_FIELD = 4000;
const REQUIRED = {
  enquiry: ['name', 'company', 'email', 'country', 'interest', 'subject', 'message', 'privacy_consent'],
  supplier: ['name', 'company', 'email', 'phone', 'country', 'supply_category', 'privacy_consent'],
  career: ['name', 'email', 'phone', 'country', 'position', 'experience', 'privacy_consent'],
  catalogue: ['name', 'company', 'email', 'phone', 'country', 'interest', 'privacy_consent'],
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://hytengineering.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept, Content-Type',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);

    const origin = request.headers.get('Origin') || '';
    if (env.ALLOWED_ORIGIN && origin && !origin.startsWith(env.ALLOWED_ORIGIN)) return json({ ok: false, error: 'origin' }, 403, cors);

    // Rate limit: 5 submissions per IP per 10 minutes
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_LIMIT) {
      const key = `rl:${ip}`;
      const count = Number((await env.RATE_LIMIT.get(key)) || 0);
      if (count >= 5) return json({ ok: false, error: 'rate' }, 429, cors);
      await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 600 });
    }

    let data;
    try { data = await request.formData(); } catch { return json({ ok: false, error: 'body' }, 400, cors); }
    const get = (k) => String(data.get(k) || '').trim().slice(0, MAX_FIELD);

    // Honeypot and minimum fill time (bots submit instantly)
    if (get('_gotcha')) return json({ ok: true }, 200, cors);
    const started = Number(get('started_at'));
    if (started && Date.now() - started < 3000) return json({ ok: true }, 200, cors);

    const type = get('form_type');
    if (!REQUIRED[type]) return json({ ok: false, error: 'type' }, 400, cors);
    const missing = REQUIRED[type].filter((k) => !get(k));
    if (missing.length) return json({ ok: false, error: 'missing', fields: missing }, 422, cors);
    if (!EMAIL.test(get('email'))) return json({ ok: false, error: 'email' }, 422, cors);

    if (env.TURNSTILE_SECRET) {
      const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: get('cf-turnstile-response'), remoteip: ip }),
      }).then((r) => r.json());
      if (!v.success) return json({ ok: false, error: 'captcha' }, 403, cors);
    }

    const skip = new Set(['_gotcha', '_next', 'started_at', 'cf-turnstile-response', 'cv']);
    const lines = [];
    for (const [k, v] of data.entries()) if (!skip.has(k) && typeof v === 'string') lines.push(`${k}: ${v.slice(0, MAX_FIELD)}`);

    const attachments = [];
    const cv = data.get('cv');
    if (cv && typeof cv === 'object' && cv.size) {
      if (cv.size > 5 * 1024 * 1024 || !/\.pdf$/i.test(cv.name)) return json({ ok: false, error: 'file' }, 422, cors);
      const buf = new Uint8Array(await cv.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      attachments.push({ filename: cv.name.replace(/[^\w.-]/g, '_'), content: btoa(bin) });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.MAIL_FROM || 'HYT Website <website@hytengineering.com>',
        to: [env.MAIL_TO || 'digitalmkt@hytengineering.com'],
        reply_to: get('email'),
        subject: `[Website ${type}] ${get('subject') || get('company') || get('name')}`,
        text: lines.join('\n'),
        attachments,
      }),
    });
    if (!res.ok) return json({ ok: false, error: 'mail' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
