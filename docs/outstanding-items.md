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
| A6 | Verify all 66 redirects return 301 (commands in `docs/redirects.md`) | live server | Open |
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
| B3 | Technical data for every value shown as "On request" (YUL-08 ranges, YUGL, YUGLX, YPL-04, YSL-12, YSL-21, YVM-04, ATL-01, presses, measuring, balancing, armature, washing plant, shunter) and confirmation of published values (YSL-08 min tread Ø 750 vs 540 mm) | product pages | Engineering |
| B4 | Confirm company figures: 1,100+ machines delivered (other sources say 500+ / 928), founding story 1977 | Home, About, History | Management |
| B5 | Full approved project list with client permissions, dates, photos; status of the Indian Railways nine-lathe contract | Executed / Under Execution, Industries | Projects |
| B6 | Approved client list and logo-usage permissions | Clientele | Sales |
| B7 | Group company names, activities, links | Group Companies | Management |
| B8 | Dated history milestones and archive photos | History | Management |
| B9 | ISO certificates (PDF, certifying body, validity) – fix the swapped links on the old Quality page | Certifications | QA |
| B10 | Award list | Awards | Marketing |
| B11 | CSR policy and projects | CSR | HR / CSR committee |
| B12 | Approval of Code of Conduct, Business Conduct Guidelines, Policy Statement (signatory, date); Supplier Code of Conduct and Information Security documents | Compliance pages | Management / Legal |
| B13 | Legal review of Privacy Policy, Cookie Policy, Disclaimer (incl. retention periods, form processor name, EU/UK representative question) | Legal pages | Legal |
| B14 | Annual return PDFs by financial year; Company Secretary confirmation that `/annual-return-2/` must not change | Annual Return | Company Secretary |
| B15 | Current job openings (2022 posts are outdated) | Careers | HR |
| B16 | Service-centre / field-engineer locations | After-Sales Service Network | Service |
| B17 | News dates, press releases, photos; exhibition years and stand photos; domestic exhibition list | News, Exhibitions | Marketing |
| B18 | SKC Gleittechnik product range, technical data, approved partner text and logo | SKC page | Sales |
| B19 | Confirm YUGL vs YUL-08 and YUGLX vs YUL-12T differences and whether all four stay on sale; YPL-04 "roller type" principle | product pages | Engineering |
| B20 | Decide Blog vs Knowledge Centre split; supply first articles (`/blog/article-name/`) | Blog | Marketing |
| B21 | Decide whether catalogues stay behind a form (template ready) or remain direct downloads | Downloads | Marketing |
| B22 | Confirm defence and heavy-engineering focus (machines/customers to feature) | Industries | Sales |
| B23 | Native-speaker review of the German, French, Italian and Dutch versions (see `docs/translation-checklist.md`) | 5 language versions | Marketing + reviewers |
| B25 | Approved customer logos (SVG/PNG) and written permission to display them – current files in `assets/images/clients/` are neutral placeholders | Home logo carousel, Clientele | Sales / Marketing |
| B26 | Product videos (MP4 or YouTube IDs) for each machine – all product pages currently show one sample clip labelled "Sample video" | Product pages (`src/videos.json`) | Marketing |
| B27 | Catalogue gating: implemented as a short form before download (per HYT request). Confirm fields and whether a separate datasheet per product will be offered | Product pages, Downloads | Marketing |
| B24 | Confirm the New Delhi sales office details (mentioned on an old page; not published) | Contact | Sales |

Every on-page review note is listed with its exact wording in
[`review-notices.md`](review-notices.md); the workbook REVIEW rows are mapped in
[`sitemap-audit.md`](sitemap-audit.md).
