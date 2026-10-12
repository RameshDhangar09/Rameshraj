# Forms – secure delivery to digitalmkt@hytengineering.com

The website is static HTML. A browser cannot send email securely by itself,
and **no SMTP password or API key may ever be placed in the website's
JavaScript**. Every form therefore posts to a separate, secure endpoint that
validates the data again, filters spam, applies rate limiting and delivers the
message by email.

## What is already built (front end)

| Form | Page(s) | `form_type` | Fields |
|------|---------|-------------|--------|
| Enquiry | `/contact-us/` (all languages) | `enquiry` | name*, company*, email*, phone, country*, interest* (product/service), subject*, message* (≥20 chars), privacy_consent* |
| Supplier registration | `/supplier-registration/` | `supplier` | name*, company*, email*, phone*, country*, designation, website, gst, supply_category*, years, certs, message, privacy_consent* |
| Job application | `/career/` | `career` | name*, company, email*, phone*, country*, position*, experience*, cv (PDF ≤5 MB), cv_link, message, privacy_consent* |
| Catalogue request | (template ready, not placed – catalogues are direct downloads today) | `catalogue` | … |

Every form also sends hidden fields: `form_type`, `language`, `page` (absolute
URL), `_next` (localised thank-you URL), `started_at` (timestamp for bot
timing), and a honeypot `_gotcha` that must stay empty.

`assets/js/forms.js`:
* validates in the browser with accessible messages in the page language
  (`aria-invalid`, `aria-describedby`, an error summary that receives focus);
* refuses to send when the honeypot is filled, and throttles repeat
  submissions (30 s);
* **reports success only when the endpoint returns HTTP 2xx**, then redirects
  to the localised `/thank-you/`;
* if no endpoint is configured, shows "Online submission is not active yet …
  your message has not been sent" – it never pretends to succeed;
* pre-selects the product from `/contact-us/?product=<page-id>` (used by every
  product page's *Enquire* button).

## What must be supplied before launch

1. **Choose a delivery option** (pick one):
   * **A. Own serverless function (recommended)** – `integrations/cloudflare-worker/form-handler.js`
     is a complete reference handler: server-side validation, honeypot and
     timing check, optional Cloudflare Turnstile, per-IP rate limiting (KV),
     PDF attachment checks, delivery via a transactional email API (Resend in
     the example; SendGrid, Postmark, Amazon SES or Zoho ZeptoMail work the same way).
   * **B. Hosted form service** – e.g. Formspree, Basin, Netlify Forms or
     Getform. Configure the recipient `digitalmkt@hytengineering.com` and
     spam filtering in the provider's dashboard.
2. **Set the endpoint** in `src/config.json` → `"form_endpoint": "https://…"` and rebuild
   (`python3 src/build.py`). The URL is written into each form's `action`, so
   forms also work without JavaScript when the provider supports redirects
   (`_next`).
3. **Optional CAPTCHA** – add a Cloudflare Turnstile site key to
   `"turnstile_sitekey"` (public key only; the secret stays on the server). The
   build then adds the widget and its script to every page that has a form.
4. **Email authentication** – publish SPF/DKIM/DMARC records for the sending
   domain so messages to digitalmkt@hytengineering.com are not filtered as spam.
5. **Tighten the Content-Security-Policy** in `hyt-website/.htaccess` so that
   `connect-src` and `form-action` list only your endpoint's origin.
6. **Privacy** – name the form processor in the Privacy Policy, confirm
   retention periods, and test a full submission in every language.

## Go-live test (record results in docs/qa-checklist.md)

* Submit each form in each language → message arrives at digitalmkt@hytengineering.com with correct fields and language.
* Submit with the honeypot filled (DevTools) → no email, no error shown.
* Submit 6 times in 10 minutes → HTTP 429 and the localised rate-limit message.
* Stop the endpoint → the page shows the localised error, not success.
* Upload a 6 MB file / a .docx → rejected on the client and on the server.
