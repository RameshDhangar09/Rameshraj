const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, LevelFormat, Header, Footer, PageNumber, BorderStyle, TableOfContents, PageBreak, TabStopType,
} = require('docx');

const BLUE = '184A72', ORANGE = 'F58220', GREY = '5A6170', LIGHT = 'EEF3F8';
const FONT = 'Arial';
const W = 9026; // A4 text width at 1" margins (DXA)

const p = (text, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: runs(text, o.run) });
function runs(text, base = {}) {
  // **bold** support
  const parts = String(text).split(/(\*\*[^*]+\*\*)/);
  return parts.filter(Boolean).map(t => t.startsWith('**') ? new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, size: 21, ...base })
    : new TextRun({ text: t, font: FONT, size: 21, ...base }));
}
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, font: FONT })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT })] });
const bl = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, spacing: { after: 60, line: 264 }, children: runs(t) });
const note = t => new Paragraph({ spacing: { before: 60, after: 160 }, shading: { type: ShadingType.CLEAR, fill: 'FFF7E6' },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: ORANGE, space: 6 } }, children: runs(t, { size: 19, color: '5A4300' }) });

function table(cols, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, i, head, zebra) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: head ? BLUE : (zebra ? 'F6F8FA' : 'FFFFFF') },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(t).split('\n').map(line => new Paragraph({ spacing: { after: 20 }, children: runs(line, head ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19 }) })),
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: cols.map((c, i) => cell(c, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, i, false, ri % 2 === 1)) }))],
  });
}
const gap = () => new Paragraph({ spacing: { after: 80 }, children: [] });

// ---------------- measured data (see appendix) ----------------
const D = JSON.parse(fs.readFileSync(__dirname + '/requirements-data.json', 'utf8'));

const c = [];
// ---------- Cover ----------
c.push(new Paragraph({ spacing: { before: 1800, after: 120 }, children: [new TextRun({ text: 'HYT Engineering Company Pvt. Ltd.', font: FONT, size: 26, color: GREY })] }));
c.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: ORANGE, space: 8 } },
  children: [new TextRun({ text: 'Website Requirements Specification', font: FONT, size: 52, bold: true, color: BLUE })] }));
c.push(p('Hosting, deployment, security, bandwidth, forms, maintenance and acceptance criteria for the new multilingual corporate website (hytengineering.com).', { run: { size: 24, color: GREY } }));
c.push(gap());
c.push(table(['Item', 'Detail'], [
  ['Document', 'Requirements for vendor quotation and delivery'],
  ['Version / date', `1.0 – ${D.date}`],
  ['Status', 'Draft for vendor discussion'],
  ['Owner', 'HYT Engineering – Digital Marketing (digitalmkt@hytengineering.com)'],
  ['Related files', 'HYT-Website-Page-List.xlsx (page list) · website source package (hyt-website-project.zip)'],
], [2400, 6626]));
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contents', font: FONT, size: 32, bold: true, color: BLUE })] }));
['1. Purpose and scope', '2. Website overview', '3. Functional requirements', '4. Hosting requirements', '5. Bandwidth and storage requirements',
 '6. Security requirements', '7. Performance, accessibility and compatibility', '8. SEO and launch requirements', '9. Maintenance and support (SLA)',
 '10. Deliverables and acceptance criteria', '11. What the vendor must include in the quotation', '12. Items HYT will provide', 'Appendix – Reference files in the website package']
  .forEach(t => c.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: t, font: FONT, size: 23, color: '2E3338' })] })));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 1 ----------
c.push(h1('1. Purpose and scope'));
c.push(p('HYT Engineering has a complete, ready-built website for hytengineering.com. This document states what we require from a vendor to host it, make it fully operational, keep it secure and fast, and maintain it after launch. It is the basis for the vendor\'s quotation and for acceptance testing.'));
c.push(p('Requirement keywords: **MUST** = mandatory; **SHOULD** = expected unless the vendor explains a better alternative; **MAY** = optional, quote separately.'));
c.push(h2('1.1 Vendor scope'));
[['Hosting and CDN', 'MUST'], ['Domain, DNS and SSL/TLS certificates', 'MUST'], ['Deployment pipeline (staging + production)', 'MUST'],
 ['Server-side 301 redirects and custom 404 pages', 'MUST'], ['Secure form backend and email delivery (4 forms)', 'MUST'],
 ['Security hardening, monitoring and backups', 'MUST'], ['Go-live support, SEO launch tasks and acceptance testing', 'MUST'],
 ['Annual maintenance and support (SLA)', 'MUST'], ['Content updates (pages, images, news, events) on request', 'SHOULD'],
 ['Video hosting / YouTube channel integration', 'SHOULD'], ['Web analytics with cookie consent', 'MAY'], ['Native-language review of DE/FR/IT/NL text', 'MAY']]
  .forEach(([a, b]) => c.push(bl(`${a} – **${b}**`)));
c.push(h2('1.2 Out of scope'));
c.push(bl('Redesign or rebuild of the website – the design, templates and content are complete.'));
c.push(bl('Writing new company content or technical specifications – HYT supplies or approves all content.'));
c.push(bl('Email mailbox hosting for hytengineering.com (existing mail service stays as is; only DNS records for sending are in scope).'));

// ---------- 2 ----------
c.push(h1('2. Website overview'));
c.push(table(['Item', 'Detail'], [
  ['Type', 'Static website – plain HTML5, CSS3 and JavaScript (ES modules), Bootstrap 5.3 CSS. No database, no PHP, no CMS, no server-side runtime.'],
  ['Pages', `${D.pages} unique pages × 6 languages = **${D.html} HTML pages** (full list in HYT-Website-Page-List.xlsx)`],
  ['Languages / URL folders', 'English – Global (/), German (/de-de/), French (/fr-fr/), Italian (/it-it/), Dutch (/nl-nl/), English – North America (/en-us/)'],
  ['Templates', 'Home, product (17 machines), content pages, turnkey solution pages, legal pages, utility pages (thank-you, sitemap, 404)'],
  ['Interactive features', 'Mega menu, site search (pre-built JSON index), language switcher, product filter, image galleries, FAQ accordions, tabbed sections, customer logo carousel, product videos, form-gated catalogue download, smooth scrolling and animations (disabled for users who prefer reduced motion)'],
  ['Forms', 'Enquiry, Supplier registration, Job application (with CV upload), Catalogue download request'],
  ['SEO', 'Unique titles/descriptions, canonical URLs, hreflang for all 6 languages + x-default, XML sitemap with alternates, robots.txt, structured data (Organization, Product, FAQ, Breadcrumb)'],
  ['Build tool', 'Python 3 generator (src/build.py) produces the hyt-website/ folder from JSON content. Python is only needed to rebuild after content edits, not to host.'],
  ['Source control', 'Git repository; all changes go through version control'],
  ['Current size', `${D.siteMB} MB in total (${D.htmlFiles} HTML files, ${D.imgMB} MB images, sample video ${D.videoMB} MB, sample catalogue ${D.pdfMB} MB)`],
], [2400, 6626]));
c.push(note('Images, the product video and the catalogue are currently labelled sample material. They will be replaced with HYT photographs, videos and catalogues before or after launch – the hosting plan must allow for this growth (section 5).'));

// ---------- 3 ----------
c.push(h1('3. Functional requirements'));
const fr = [
  ['F1', 'All 468 pages are published at the URLs in the page list, in all six languages, with trailing-slash URLs.', 'MUST'],
  ['F2', 'Language switcher keeps the visitor on the equivalent page; hreflang and canonical tags remain intact after deployment.', 'MUST'],
  ['F3', `All ${D.redirects} redirects are issued by the server as HTTP 301 (12 old URLs × 6 language folders). JavaScript or meta-refresh redirects are not acceptable.`, 'MUST'],
  ['F4', 'Custom 404 page per language returns HTTP status 404 (not 200).', 'MUST'],
  ['F5', 'Enquiry, supplier and catalogue forms are delivered to digitalmkt@hytengineering.com; job applications (with CV) to careers@hytengineering.com.', 'MUST'],
  ['F6', 'The website shows "thank you" only when the form backend confirms receipt (HTTP 2xx). Failures show an honest error message.', 'MUST'],
  ['F7', 'Catalogue download: visitor completes a short form, is redirected to the localised thank-you page and the PDF downloads automatically.', 'MUST'],
  ['F8', 'Site search, product filter, galleries, videos and accordions work in all supported browsers (section 7).', 'MUST'],
  ['F9', 'Product videos: self-hosted MP4/WebM or YouTube via the built-in privacy-friendly "click to load" player (youtube-nocookie.com).', 'SHOULD'],
  ['F10', '"Next Event" link in the top bar can be pointed to a new page or news item without developer effort (single config value).', 'SHOULD'],
];
c.push(table(['#', 'Requirement', 'Priority'], fr, [700, 7126, 1200]));

// ---------- 4 ----------
c.push(h1('4. Hosting requirements'));
c.push(p('Because the site is static, it needs very little server power. What matters is fast delivery to visitors in India and Europe, correct HTTP behaviour (redirects, headers, caching) and strong security.'));
c.push(table(['#', 'Requirement', 'Priority'], [
  ['H1', 'Static hosting or web server that supports server-side rules: Apache with .htaccess (file provided), nginx (config provided) or Netlify / Cloudflare Pages (_redirects file provided).', 'MUST'],
  ['H2', 'Content Delivery Network (CDN) with points of presence in India and Europe (target visitors: India, Europe, Middle East, Africa, South-East Asia, Australia).', 'MUST'],
  ['H3', 'HTTPS only, HTTP/2 (HTTP/3 preferred), Brotli or gzip compression for HTML, CSS, JS, JSON and SVG.', 'MUST'],
  ['H4', 'Caching headers: long cache (30 days, immutable where possible) for /assets/; short cache (≤10 minutes, revalidate) for HTML.', 'MUST'],
  ['H5', 'Canonical host: one form only (hytengineering.com recommended, as in the page list); www → non-www 301, http → https 301.', 'MUST'],
  ['H6', 'Separate **staging** environment, password-protected and set to noindex, for testing every change before production.', 'MUST'],
  ['H7', 'Uptime **99.9 %** per month or better, with a written SLA and service credits.', 'MUST'],
  ['H8', 'Server/CDN location and data processing compliant with India DPDP Act 2023 and EU GDPR (EU visitors use the DE, FR, IT and NL versions).', 'MUST'],
  ['H9', 'If a VPS / dedicated server is proposed instead of static hosting: minimum 2 vCPU, 2 GB RAM, SSD, managed OS patching, firewall – and the vendor remains responsible for server security.', 'SHOULD'],
  ['H10', 'IPv6 support.', 'SHOULD'],
], [700, 7126, 1200]));

// ---------- 5 Bandwidth ----------
c.push(h1('5. Bandwidth and storage requirements'));
c.push(h2('5.1 Measured page weight'));
c.push(p('Measured on the built website in a desktop browser (first visit, nothing cached, full page scrolled so all images load). "Transferred" assumes gzip/Brotli compression for text files, as required in H3.'));
c.push(table(['Page', 'Requests', 'Transferred (first visit)', 'of which images', 'of which CSS / JS / fonts'],
  D.weights.map(w => [w.page, String(w.req), `${w.gz} KB`, `${w.img} KB`, `${w.shared} KB`]), [2726, 1100, 1900, 1600, 1700]));
c.push(p(`Average first page view ≈ **${D.firstMB} MB**. CSS, JavaScript and fonts (≈ ${D.sharedKB} KB) are cached after the first page, so each further page view in the same visit transfers ≈ **${D.nextMB} MB** (HTML ≈ 15 KB compressed plus that page's images).`));
c.push(note('These figures use sample illustrations. Real photographs are usually larger: the hosting plan below adds a 50 % allowance. HYT will supply photos at max. 1600 × 1000 px, compressed JPG/WebP, to keep page weight under 1.5 MB.'));

c.push(h2('5.2 Monthly bandwidth estimate'));
c.push(p('Assumptions (adjust once real analytics data is available):'));
[`One visit = ${D.pagesPerVisit} page views → ${D.visitMB} MB per visit (first page + ${D.pagesPerVisit - 1} further pages, incl. 50 % real-photo allowance).`,
 `${D.catPct} % of visits download a catalogue ("Downloads" column) of ${D.catMB} MB (real catalogues; the sample is ${D.pdfMB} MB).`,
 `${D.vidPct} % of visits play a self-hosted product video of ${D.vidMB} MB (none if videos are on YouTube).`,
 `+${D.botPct} % for search-engine crawlers, bots and monitoring.`].forEach(t => c.push(bl(t)));
c.push(table(['Scenario', 'Visits / month', 'Pages', 'Downloads', 'Videos (self-hosted)', 'Bots', 'Total / month', 'If videos on YouTube'],
  D.scen.map(s => [s.name, s.visits.toLocaleString('en-IN'), `${s.pages} GB`, `${s.cat} GB`, `${s.vid} GB`, `${s.bots} GB`, `**${s.total} GB**`, `${s.yt} GB`]),
  [1450, 1000, 850, 1200, 1250, 750, 1250, 1276]));
c.push(gap());
c.push(h2('5.3 Bandwidth and storage requirement'));
c.push(table(['#', 'Requirement', 'Priority'], [
  ['B1', `Minimum **${D.reqGB} GB/month** data transfer included, or unmetered CDN bandwidth (preferred). The vendor must state overage prices and alert HYT at 80 % of the allowance.`, 'MUST'],
  ['B2', 'No throttling or suspension when traffic peaks (exhibitions, press releases, tenders); burst capacity of at least 10× normal traffic for 48 hours.', 'MUST'],
  ['B3', `Storage: minimum **${D.storeGB} GB** for the website, real images, catalogues and backups; **${D.storeVidGB} GB** if product videos are self-hosted.`, 'MUST'],
  ['B4', 'Product videos SHOULD be published on HYT\'s YouTube channel and embedded with the built-in click-to-load player. This removes the largest bandwidth cost.', 'SHOULD'],
  ['B5', 'Large downloads (catalogues > 10 MB, videos) SHOULD be served through the CDN with range requests (resumable downloads).', 'SHOULD'],
  ['B6', 'Monthly bandwidth and visitor report shared with HYT.', 'SHOULD'],
], [700, 7126, 1200]));

// ---------- 6 Security ----------
c.push(h1('6. Security requirements'));
c.push(h2('6.1 Transport and headers'));
c.push(table(['#', 'Requirement', 'Priority'], [
  ['S1', 'TLS 1.2 and 1.3 only; strong ciphers; certificate auto-renewal; SSL Labs grade **A or better**.', 'MUST'],
  ['S2', 'HSTS (Strict-Transport-Security, max-age ≥ 1 year, includeSubDomains) once HTTPS is verified on all subdomains.', 'MUST'],
  ['S3', 'Security headers kept as provided in .htaccess: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.', 'MUST'],
  ['S4', 'Content-Security-Policy tightened at launch so that form submissions and connections are allowed only to the chosen form endpoint.', 'MUST'],
  ['S5', 'Directory listing disabled; source/build files (src/, tools/, docs/, .git) never published – only the contents of hyt-website/.', 'MUST'],
  ['S6', 'securityheaders.com grade **A** or better.', 'SHOULD'],
], [700, 7126, 1200]));
c.push(h2('6.2 Protection and access'));
c.push(table(['#', 'Requirement', 'Priority'], [
  ['S7', 'DDoS protection and Web Application Firewall (WAF) at CDN level, including bot and rate limiting rules.', 'MUST'],
  ['S8', 'Hosting, CDN, DNS and registrar accounts in **HYT\'s name**, with the vendor as a delegated user. HYT keeps owner access at all times.', 'MUST'],
  ['S9', 'Multi-factor authentication on every admin account (hosting, CDN, DNS, registrar, email API, Git).', 'MUST'],
  ['S10', 'Least-privilege access; named accounts only (no shared passwords); access removed within 24 hours when a person leaves the project.', 'MUST'],
  ['S11', 'Domain registrar lock and DNSSEC enabled.', 'SHOULD'],
  ['S12', 'Deployment only through the version-controlled pipeline – no manual file edits on the production server.', 'MUST'],
], [700, 7126, 1200]));
c.push(h2('6.3 Forms and personal data'));
c.push(table(['#', 'Requirement', 'Priority'], [
  ['S13', '**No passwords, API keys or secrets in the website code.** Forms post to a separate server-side endpoint (serverless function or form service) that holds secrets in its secret store. A reference handler is provided (integrations/).', 'MUST'],
  ['S14', 'Server-side validation of every field (the browser checks are for usability only), honeypot and timing checks, per-IP rate limiting, CAPTCHA (Cloudflare Turnstile or equivalent, privacy-friendly).', 'MUST'],
  ['S15', 'CV upload: PDF only, max. 5 MB, file type verified on the server, malware scan, delivered as an email attachment to careers@ – never stored in a publicly reachable location.', 'MUST'],
  ['S16', 'Personal data (names, emails, phone numbers, CVs) is not written to logs and not retained by the form service longer than needed for delivery (target: 30 days max.).', 'MUST'],
  ['S17', 'Email authentication for the sending domain: SPF, DKIM and DMARC (start with p=none, move to quarantine), so website messages are not marked as spam.', 'MUST'],
  ['S18', 'Compliance with India\'s Digital Personal Data Protection Act 2023 and EU GDPR. The vendor signs a data processing agreement and names any sub-processors (e.g. email API provider).', 'MUST'],
  ['S19', 'The website sets no cookies today. If analytics or other tracking is added, a cookie consent banner and an updated Cookie Policy are required first.', 'MUST'],
], [700, 7126, 1200]));
c.push(h2('6.4 Monitoring, backup and incident response'));
c.push(table(['#', 'Requirement', 'Priority'], [
  ['S20', 'Uptime monitoring every 1–5 minutes from at least two regions, with alerts to the vendor and HYT.', 'MUST'],
  ['S21', 'Daily backups of the published site and form-handler configuration; 30-day retention; stored separately from production; restore tested every quarter. (The Git repository is the master copy of all content.)', 'MUST'],
  ['S22', 'Vulnerability scan before launch and every quarter (OWASP Top 10 checks on the form endpoint); findings fixed within 30 days (critical: 72 hours).', 'MUST'],
  ['S23', 'Third-party libraries (Bootstrap CSS, Bootstrap Icons, Lenis) kept on pinned versions with Subresource Integrity (already implemented); updates reviewed at least twice a year.', 'SHOULD'],
  ['S24', 'Security incident or data breach: vendor informs HYT within **24 hours** with impact and actions, and supports HYT\'s legal notification duties.', 'MUST'],
  ['S25', 'SSL certificate, domain and DNS expiry monitoring with reminders at 30 and 7 days.', 'MUST'],
], [700, 7126, 1200]));

// ---------- 7 Performance / accessibility ----------
c.push(h1('7. Performance, accessibility and compatibility'));
c.push(table(['#', 'Requirement', 'Target'], [
  ['P1', 'Core Web Vitals (mobile, 4G) for home, product and contact pages', 'LCP < 2.5 s · INP < 200 ms · CLS < 0.1'],
  ['P2', 'Google Lighthouse (mobile)', 'Performance ≥ 85 · Accessibility ≥ 95 · Best practices ≥ 95 · SEO ≥ 95'],
  ['P3', 'Time to first byte from India and Europe (via CDN)', '< 600 ms'],
  ['P4', 'Accessibility', 'WCAG 2.1 level AA maintained (automated test currently passes with no violations)'],
  ['P5', 'Browsers', 'Latest two versions of Chrome, Edge, Firefox, Safari (macOS and iOS), Samsung Internet, Chrome on Android'],
  ['P6', 'Screen sizes', 'From 360 px mobile to 1920 px desktop, no horizontal scrolling'],
  ['P7', 'Images added later', 'Max. 1600 × 1000 px, compressed (≈ 150–250 KB), responsive 800 px copies, descriptive alt text in each language'],
], [700, 4100, 4226]));

// ---------- 8 SEO ----------
c.push(h1('8. SEO and launch requirements'));
[ 'Keep every URL, title, description, canonical, hreflang and structured-data tag unchanged when deploying.',
  'Verify all 72 redirects return 301 to the correct page (test commands provided in docs/redirects.md).',
  'Submit sitemap.xml to Google Search Console and Bing Webmaster Tools under HYT\'s accounts; monitor crawl errors and 404s for 4 weeks after launch and add redirects for any old URL still receiving traffic.',
  'Staging must never be indexed (password + noindex).',
  'Build the production version with the "--production" option, which hides the internal review notes and sample-material labels.',
].forEach(t => c.push(bl(t)));

// ---------- 9 Maintenance ----------
c.push(h1('9. Maintenance and support (SLA)'));
c.push(table(['Severity', 'Example', 'Response', 'Resolution'], [
  ['Critical', 'Website down, security breach, forms not delivering', '1 hour (24×7)', '4 hours'],
  ['High', 'Section or language broken, redirect failure, SSL warning', '4 business hours', '1 business day'],
  ['Medium', 'Layout issue on one page or browser', '1 business day', '3 business days'],
  ['Low / change request', 'Content update, new news item or event, image replacement', '2 business days', 'As agreed (typically 5 business days)'],
], [1500, 3726, 1800, 2000]));
c.push(gap());
[ 'Monthly report: uptime, bandwidth, form submissions delivered/blocked, security events, changes made.',
  'Quote a bank of content-update hours per year (pages in 6 languages: English content changes need matching translations).',
  'All work committed to the Git repository with clear messages; HYT owns all code, content and credentials.',
  'At contract end: full hand-over of repository, accounts and documentation within 10 business days.',
].forEach(t => c.push(bl(t)));

// ---------- 10 Acceptance ----------
c.push(h1('10. Deliverables and acceptance criteria'));
c.push(table(['#', 'Acceptance test', 'Pass criterion'], [
  ['A1', 'Page check', 'All 468 pages return 200; automated link check shows 0 broken links'],
  ['A2', 'Redirects', 'All 72 old URLs return 301 to the right page; http and www variants redirect to https://hytengineering.com'],
  ['A3', '404', 'Unknown URLs return status 404 with the localised error page'],
  ['A4', 'Forms', 'Test submission of each form in all 6 languages arrives at the correct mailbox; CV attachment intact; spam test blocked; thank-you shown only after delivery'],
  ['A5', 'Catalogue', 'Form → thank-you page → PDF downloads automatically'],
  ['A6', 'Security', 'SSL Labs A or better; securityheaders.com A; vulnerability scan with no high/critical findings'],
  ['A7', 'Performance', 'Section 7 targets met on home, one product page and contact page'],
  ['A8', 'Accessibility', 'Automated WCAG 2.1 AA scan with no violations on 5 representative pages'],
  ['A9', 'SEO', 'Sitemap submitted and accepted; hreflang and canonical tags verified on a sample of pages'],
  ['A10', 'Documentation', 'Hand-over document: architecture, accounts (owner = HYT), deployment steps, backup/restore procedure, contacts'],
], [700, 2200, 6126]));

// ---------- 11 Vendor response ----------
c.push(h1('11. What the vendor must include in the quotation'));
[ 'Proposed hosting/CDN platform, server locations and why it suits visitors in India and Europe.',
  'Included bandwidth, storage and overage prices (section 5).',
  'Form backend and email-delivery solution, including where personal data is processed and stored.',
  'Security measures against each requirement in section 6 (a compliance table: Met / Partly / Alternative).',
  'One-time costs (setup, migration, launch) and annual recurring costs (hosting, CDN, form service, SSL if any, maintenance, support hours), with taxes shown separately.',
  'Project plan and timeline to go-live (target: within 3–4 weeks of order).',
  'SLA, support hours, escalation contacts and references from similar corporate or multilingual websites.',
].forEach(t => c.push(bl(t)));

// ---------- 12 HYT inputs ----------
c.push(h1('12. Items HYT will provide'));
[ 'Access to the website source package and Git repository.',
  'Decision on domain form (hytengineering.com vs www) and DNS access.',
  'Approved photographs, product videos (or YouTube links) and real catalogues to replace sample material.',
  'Approval of pending content (marked "Content pending HYT approval" on the preview site; list in docs/outstanding-items.md).',
  'Legal review of Privacy Policy, Cookie Policy and Disclaimer (form processor name, retention periods).',
  'Recipient mailboxes: digitalmkt@hytengineering.com (enquiries, supplier, catalogue) and careers@hytengineering.com (applications).',
].forEach(t => c.push(bl(t)));

// ---------- Appendix ----------
c.push(h1('Appendix – Reference files in the website package'));
c.push(table(['File / folder', 'Purpose'], [
  ['hyt-website/', 'The complete website to publish (upload its contents to the web root)'],
  ['hyt-website/.htaccess', 'Apache: redirects, 404s, security headers, caching, compression'],
  ['hyt-website/_redirects', 'Netlify / Cloudflare Pages redirects and 404s'],
  ['deploy/nginx-hyt.conf', 'nginx redirect rules'],
  ['integrations/cloudflare-worker/', 'Reference secure form handler (validation, rate limiting, CAPTCHA, email API)'],
  ['docs/forms-integration.md', 'Form fields, recipients and go-live test'],
  ['docs/redirects.md', 'Redirect map and verification commands'],
  ['docs/qa-checklist.md', 'Quality checklist and go-live test plan'],
  ['docs/outstanding-items.md', 'Content and configuration items to close before launch'],
  ['docs/HYT-Website-Page-List.xlsx', 'Page list with hierarchy, menus, footer, languages and redirects'],
  ['README.md', 'Technical overview, preview and rebuild instructions'],
], [3400, 5626]));

const doc = new Document({
  creator: 'HYT Engineering Company Pvt. Ltd.', title: 'Website Requirements Specification',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: BLUE, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, color: '2E3338', font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } },
    { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 300 } } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1200, left: 1440, right: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'HYT Engineering – Website Requirements Specification', font: FONT, size: 16, color: GREY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Page ', font: FONT, size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GREY }),
      new TextRun({ text: ' of ', font: FONT, size: 16, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GREY })] })] }) },
    children: c,
  }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(process.argv[2], b); console.log('written', process.argv[2]); });
