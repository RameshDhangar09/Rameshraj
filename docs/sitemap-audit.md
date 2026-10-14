# Sitemap workbook audit – HYT_Website_Sitemap_and_Page_Hierarchy_v2.xlsx

All four worksheets were analysed: **Summary**, **Page Inventory** (74 rows incl. the 404 page),
**Sitemap** (final hierarchy in menu order) and **Redirects** (10 × 301).

## Totals – workbook vs build

| Item | Workbook | Built | Notes |
|------|----------|-------|-------|
| Pages | 74 | 79 per language, 474 in total (Annual Return removed; six Turnkey Solutions pages added – both at HYT's request, 14 Oct 2026) | `src/registry.py` holds one entry per row; `sr` = Sr. No. |
| Existing URLs kept | 39 | 39 | |
| New pages | 26 | 26 | URLs from the "Recommended URL" column |
| Changed URLs (301) | 9 + `/wheel-press/` = 10 | 10 + 1 | plus `/installation-and-commissioning/` → `/installation-commissioning/` (row 34 note) |
| Main menu items | 8 (Home is the logo) | 7 menu items + logo + Contact button | |
| Level-3 pages | 10 | 10 | Maintenance children (6), Certifications, Compliance children (3) |
| Footer pages | 4 | 3 | Privacy, Cookie, Disclaimer – Annual Return removed |
| Utility pages | 3 | 3 | /sitemap/, /thank-you/ (noindex), /404.html (noindex; one per language) |

## How menu rules were implemented

* **Products** is a hub with four sections and anchors `#wheel-lathes`, `#wheel-axle-shop-machines`, `#depot-workshop-equipment`, `#partner-products`; the dropdown headings link to these anchors (no category pages). The hub filter also reads the hash.
* **About Us** links to `/company/` and appears as "About HYT" inside its dropdown; headings Who We Are / Credentials / Responsibility are labels, not pages. Certifications is nested under Quality.
* **Services → Maintenance Services** opens the only nested submenu (six children indented in the dropdown and mobile menu).
* **Media & Resources** is a menu heading only (no page): headings News & Events and Resources. Breadcrumbs show it as an unlinked label.
* **Compliance** children (Code of Conduct, Guidelines, Policy Statement) are "Internal Link Only" – reached from the Compliance hub, not the dropdown.
* **Thank You** and **404** are internal only, `noindex`, excluded from `sitemap.xml`.
* **Contact Us** is the button at the right of the menu and accepts `?product=` to pre-fill the enquiry form.

## REVIEW items (18 rows) and unresolved decisions – implementation checklist

| Row | Page | Workbook issue | What the build does | Open for HYT |
|-----|------|----------------|---------------------|--------------|
| 4 | Quality | Overlaps Certifications; ISO PDF links on old page point to wrong certificates | Quality = process; Certifications = single place for certificates | Supply correct certificate PDFs |
| 10 | Memorialization | Label misleading | Menu label, title tag and H1 "Life at HYT"; URL `/memorialization/` kept; moved under Work With Us | Confirm label and move |
| 13 / 23 | YUL-08 vs YUGL | Same product name | Distinct title tags/H1s stating the difference; cross-linked as related models | Confirm how YUGL differs and whether both stay on sale |
| 14 / 24 | YUL-12T vs YUGLX | Same product name | As above | As above |
| 13 / 14 | SEO note typo | "301 /underfloor-wheel-lathe/ to /underfloor-wheel-lathe/" | Correct old URLs from the Redirects tab used | – |
| 29 | Turnkey Projects | 'EPC Projects' vs 'Turnkey Projects' | One label "Turnkey Projects" in menu, breadcrumbs and footer; title tag/H1 "Turnkey (EPC) Projects" | – |
| 38 | CMC vs CAMC | Pick one name | "Comprehensive Maintenance Contract (CMC)" everywhere; URL unchanged | – |
| 39 | Operation Contract | Overlaps O&M | Separate scope (operation only) with comparison table on /maintenance/ | Confirm both pages stay |
| 40 | Service Contract | Overlaps AMC/CMC | Positioned as call-based / pay-per-visit | Confirm scope |
| 44 | SPM Relocation | "SPM Machine" repetition | Menu "Machine Relocation & Shifting"; title tag "SPM Relocation & Shifting" | – |
| 51 | Careers | Job posts from 2022 | "Current openings" placeholder + application form | Supply current openings |
| 53 / 54 / 56 | Privacy, Disclaimer, Cookie | Old texts (2021) | New drafts written, flagged for legal review | Legal review |
| 55 | Annual Return | `-2` URL may be quoted in filings | **Page removed at HYT's request (14 Oct 2026)**; URL now returns 404 | Company Secretary to confirm s. 92(3) publication and any redirect |
| 58 | Thank You | Static site needs form service | Front end + reference serverless handler; see forms-integration.md | Choose provider / deploy endpoint |
| 59 / 60 | Knowledge Centre vs Blog | Overlap | Knowledge Centre = evergreen guides + FAQ; Blog = dated articles (topics listed as "coming soon") | Confirm split; supply articles |
| 62 | Certifications | Overlap with Quality | Single place for certificates, listed beside Quality | Certificate PDFs |
| 63 | Downloads | Catalogue released via form today | Direct download of the catalogue; catalogue form template ready (not placed) | Decide gated vs open download |
| 64 | Compliance | "Top level" in sheet; Supplier Code of Conduct & Information Security have no rows | Hub under About Us + footer; missing documents shown as "in preparation" | Supply documents or add rows |
| 66 | Guidelines | Vague label | H1/title "Business Conduct Guidelines"; menu label kept | Confirm name |
| 67 | Policy Statement | Which policies? | Integrated QHSE + anti-bribery statement drafted | Confirm policies and signatory |
| 72 | Defence | No defence products/customers verified | Capability-based copy, no customers named | Confirm what to feature |
| 73 | Heavy Engineering | No machines/customers confirmed | Capability-based copy | Confirm what to feature |

The full list of on-page review notes (35) is generated in [`review-notices.md`](review-notices.md).

## Changes requested by HYT after the workbook (14 Oct 2026)

| Change | Pages / URLs | Notes |
|--------|--------------|-------|
| Removed | Annual Return – `/annual-return-2/` | Now 404; Company Secretary to confirm s. 92(3) publication and any redirect (outstanding item B14). |
| Added – **Turnkey Solutions** (Level 3 under Turnkey Projects, new dropdown heading "Turnkey Solutions") | `/turnkey-project/wheel-shops/` · `/turnkey-project/railway-maintenance-depots/` · `/turnkey-project/rolling-stock-manufacturing-facilities/` · `/turnkey-project/wheelset-manufacturing-plants/` · `/turnkey-project/wheel-machining-lines/` · `/turnkey-project/axle-machining-lines/` | Registry `sr` 75–80. Nested under `/turnkey-project/` (like `/industries/…` and `/compliance/…`) so the hierarchy shows in the URL. Labels made plural and consistent ("Wheelshops" → "Wheel Shops"). Listed on the Turnkey Projects hub, in the mega menu, breadcrumbs, HTML sitemap and sitemap.xml with hreflang. The existing Executed Projects, Under Execution and Wheel Shop Automation pages sit under a second dropdown heading, "Projects & Automation". |
