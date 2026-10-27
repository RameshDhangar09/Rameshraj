# Outstanding content and configuration – before launch

Nothing below blocks previewing the site; all of it must be closed before the
site replaces hytengineering.com. Owner suggestions in brackets.

## A. Configuration (web team)

| # | Item | Where | Status |
|---|------|-------|--------|
| A1 | Form endpoint (serverless function or form service) delivering to digitalmkt@hytengineering.com, with server-side validation, spam protection and rate limiting | `src/config.json` → `form_endpoint`; `integrations/`; `docs/forms-integration.md` | **Open** – forms show "not active yet" until set |
| A2 | Secrets for the endpoint (email API key, Turnstile secret) stored in the function's secret store | hosting dashboard | Open |
| A3 | SPF / DKIM / DMARC for the sending domain | DNS | Open |
| A4 | Choose hosting; upload `hyt-website/`; enable `.htaccess` (Apache) or `_redirects` (Netlify/Cloudflare) or `deploy/nginx-hyt.conf` | – | Open |
| A5 | Enable HTTPS + canonical host block in `.htaccess` (non-www, as in the workbook URLs) | `.htaccess` section 1 | Open |
| A6 | Verify all 72 redirects return 301 (commands in `docs/redirects.md`) | live server | Open |
| A7 | Tighten Content-Security-Policy to the chosen form endpoint | `.htaccess` | Open |
| A8 | Build with `python3 src/build.py --production` for launch (hides review notes and sample-material line) | – | Open |
| A9 | Submit `sitemap.xml` to Google Search Console and Bing; monitor 404s for 4 weeks | – | Open |
| A10 | If analytics or embedded video is added: cookie consent banner + Cookie Policy update | – | Not needed today (site sets no cookies) |
| A11 | Confirm domain form (`hytengineering.com` vs `www.`) – the workbook uses non-www; examples in the brief use www | `src/config.json` → `base_url` | Decide |

## B. Content HYT must supply or approve

| # | Item | Pages | Owner |
|---|------|-------|-------|
| B1 | Replace all sample illustrations with approved photographs (same filenames, 16:10, ≥1600×1000) – see `docs/image-inventory.md` | all | Marketing |
| B2 | Real product catalogue(s) and per-product datasheets to replace `hyt-sample-catalogue.pdf` | Downloads, all product pages | Marketing / Engineering |
| B3 | ~~Technical data~~ **Done 19 Oct 2026** for 13 products from HYT's product content document. Still "On request": wheel presses, wheel measuring station, dynamic wheel balancing machine, SKC partner products. Open queries from the document: YUL-12T/YUGLX and YUL-08/YUGL cycle time and wheelset-distance values were highlighted for checking (35 min / 1800–3200 mm; 30 min) | Product pages | Engineering |
| B4 | Confirm company figures: 1,100+ machines delivered (other sources say 500+ / 928), founding story 1977 | Home, About, History | Management |
| B5 | Full approved project list with client permissions, dates, photos; status of the Indian Railways nine-lathe contract | Executed / Under Execution, Industries | Projects |
| B6 | ~~Approved client list~~ **Done 27 Oct 2026** – 35 customer logos supplied by HYT, shown on Clientele (grouped) and in the Home carousel. HYT confirms it may display these names and logos; per-client project notes can be added later | Clientele | Sales |
| B7 | Group company names, activities, links | Group Companies | Management |
| B8 | ~~Dated history milestones~~ **Done 19 Oct 2026** (HYT history document, 1977–2026). Still open: archive photographs for the timeline | History | Management |
| B9 | ISO certificates (PDF, certifying body, validity) – fix the swapped links on the old Quality page | Certifications | QA |
| B10 | Award list | Awards | Marketing |
| B11 | CSR policy and projects | CSR | HR / CSR committee |
| B12 | Approval of Code of Conduct, Business Conduct Guidelines, Policy Statement (signatory, date); Supplier Code of Conduct and Information Security documents | Compliance pages | Management / Legal |
| B13 | Legal review of Privacy Policy, Cookie Policy, Disclaimer (incl. retention periods, form processor name, EU/UK representative question) | Legal pages | Legal |
| B14 | **Annual Return page removed** at HYT's request (14 Oct 2026). Company Secretary to confirm where the annual return will be published instead (Companies Act 2013, s. 92(3) requires it on the company website if one exists) and whether `/annual-return-2/` should 301-redirect somewhere; it now returns 404 | – | Company Secretary |
| B15 | Careers page redesigned from HR's brief: no vacancy listings (per Head HR); open applications go to careers@hytengineering.com. HR to confirm benefit wording, supply real facility photos (manufacturing, design office, quality lab, training room, canteen) and confirm the campus description | Careers | HR |
| B16 | Service-centre / field-engineer locations | After-Sales Service Network | Service |
| B17 | News dates, press releases, photos; exhibition years and stand photos; domestic exhibition list | News, Exhibitions | Marketing |
| B18 | SKC Gleittechnik product range, technical data, approved partner text and logo | SKC page | Sales |
| B19 | Product naming: the document asks HYT to confirm how YUL-12T and YUGLX (both "CNC Tandem Underfloor Wheel Lathe") and YUL-08 and YUGL (both "CNC Underfloor Wheel Lathe") are split – the website keeps four separate pages on the approved URLs. The document's proposed `/products/...` URLs were **not** used because they would change the approved URL structure | product pages | Engineering / Marketing |
| B20 | Decide Blog vs Knowledge Centre split; supply first articles (`/blog/article-name/`) | Blog | Marketing |
| B21 | Decide whether catalogues stay behind a form (template ready) or remain direct downloads | Downloads | Marketing |
| B22 | Confirm defence and heavy-engineering focus (machines/customers to feature) | Industries | Sales |
| B23 | Native-speaker review of the German, French, Italian and Dutch versions (see `docs/translation-checklist.md`) | 5 language versions | Marketing + reviewers |
| B25 | ~~Customer logos~~ **Done 27 Oct 2026** – HYT's logo files (`assets/images/clients/<slug>.webp/.png`, list and order in `src/registry.py` → `CLIENTS`) | Home logo carousel, Clientele | Sales / Marketing |
| B26 | Product videos: YouTube videos added for YUGL (H5TlP5VMCgw – HYT to confirm whether it shows the YUGL or the YUGLX), YVM-04, YTB 04, KRE 15 RCRV and the washing plant. **Still needed:** YUGLX, YUL-12T, YUL-08, YPL-04, YPL-02 (the supplied link b8IqjmsJbxs shows a tandem lathe, not used), YSL series, ATL-01, YMM-04 and the non-HYT-document products – these pages still show the labelled sample clip, to be removed before launch if no video arrives | Product pages (`src/videos.json`) | Marketing |
| B27 | Catalogue gating: implemented as a short form before download (per HYT request). Confirm fields and whether a separate datasheet per product will be offered | Product pages, Downloads | Marketing |
| B28 | Name, dates and page/news item of the next event for the highlighted "Next Event" link (currently points to International Exhibitions) | Top bar (`src/config.json` → `next_event`) | Marketing |
| B29 | **Wheel Shop Automation page merged into Wheel Shops** at HYT's request (15 Oct 2026); `/wheel-shop-automation/` now 301-redirects to `/turnkey-project/wheel-shops/` (all languages). HYT to confirm the automation scope it offers (handling, software, data integration) – shown as a review note on the Wheel Shops page | Wheel Shops | Projects / Engineering |
| B30 | Home page videos: the three hero slides use HYT's own clips (done). The corporate video in *Who we are* is embedded from Canva – keep the Canva design shared publicly, check it plays in a normal browser, and supply a poster image (a still from the film) to replace the sample illustration; alternatively export it as MP4 for self-hosting or publish it on YouTube | Home | Marketing |
| B32 | High-resolution product photographs: the 14 photos now on the product pages were taken from HYT's Word document (about 600 px wide, upscaled). Please send the original image files (≥ 1600 px) so they can be replaced at the same filenames. 27 Oct 2026: HYT supplied photos for ATL-01, YPL-04, wheel measuring station, dynamic wheel balancing machine and the wheel-profile close-up (used unchanged, not re-compressed) | Product pages | Marketing |
| B33 | Per-product catalogue PDFs named in the product document (e.g. `hyt-yugl-yuglx-catalogue.pdf`, `hyt-ypl-02-catalogue.pdf`) were not supplied – the sample catalogue is still used | Product pages, Downloads | Marketing |
| B31 | **Axiom chat assistant** is live in local mode (answers only from website content). To switch on AI answers: choose hosting for `integrations/cloudflare-worker/axiom-chat.js`, create an Anthropic API key (stored only as a Worker secret), set daily/per-IP caps, sign the provider's data processing terms, add the AI provider to the Privacy Policy, then set `chat_endpoint` in `src/config.json` and rebuild. Review Axiom's texts (`common.json` → `chat`) and test with typical customer questions in every language | All pages | Marketing / IT / Legal |
| B24 | ~~New Delhi office~~ **Done 19 Oct 2026** – New Delhi Sales & Marketing Office and SAFOP S.p.A. (Pordenone) published on Contact Us with the Pune HQ | Contact | Sales |

Every on-page review note is listed with its exact wording in
[`review-notices.md`](review-notices.md); the workbook REVIEW rows are mapped in
[`sitemap-audit.md`](sitemap-audit.md).
