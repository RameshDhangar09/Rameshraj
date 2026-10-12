# Netlify option

If the site is hosted on Netlify, the simplest secure option is **Netlify Forms**
(no code, spam filtering, email notifications to digitalmkt@hytengineering.com).
Alternatively deploy `../cloudflare-worker/form-handler.js` logic as a Netlify
Function (`netlify/functions/form.js`, `export default async (req, context) => {…}`)
and set `"form_endpoint": "/.netlify/functions/form"` in `src/config.json`.
Secrets go in *Site settings → Environment variables*, never in the website code.
