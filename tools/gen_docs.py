#!/usr/bin/env python3
"""Regenerate the data-driven parts of the docs from the registry and content.

    python3 tools/gen_docs.py

Writes docs/redirects.md and docs/review-notices.md (all "Content pending HYT
approval" notes, per page, from the English master).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import registry as R  # noqa: E402

BASE = R.BASE_URL
LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")


def redirects():
    rows = ["# Redirect map (HTTP 301)", "",
            "Generated from `src/registry.py` (Redirects tab of the workbook + the duplicate noted on Page Inventory row 34).",
            "Each rule is applied to the root and to every language folder, giving "
            f"{(len(R.REDIRECTS) + len(R.EXTRA_REDIRECTS)) * len(R.LANGS)} rules in `.htaccess`, `_redirects` and `deploy/nginx-hyt.conf`.", "",
            "| # | Old URL | New URL | Source |", "|---|---------|---------|--------|"]
    for i, (old, new) in enumerate(R.REDIRECTS, 1):
        rows.append(f"| {i} | {BASE}{old} | {BASE}{new} | Redirects tab |")
    for old, new in R.EXTRA_REDIRECTS:
        rows.append(f"| + | {BASE}{old} | {BASE}{new} | Page Inventory row 34 (old duplicate page) |")
    rows += ["", "Note: the workbook's SEO notes for rows 13 and 14 read '301 /underfloor-wheel-lathe/ to /underfloor-wheel-lathe/' "
             "(old and new identical – a typo). The Redirects tab gives the correct old URLs (`/cnc-underfloor-wheel-lathe/`, "
             "`/cnc-tandem-underfloor-wheel-lathe/`), which are used here.", "",
             "## Verify after deployment", "", "```bash",
             f"for u in {' '.join(o for o, _ in R.REDIRECTS + R.EXTRA_REDIRECTS)}; do",
             f"  curl -s -o /dev/null -w \"%{{http_code}} %{{redirect_url}}  $u\\n\" {BASE}$u",
             "done", "# expect: 301 https://hytengineering.com/<new>/ for every line",
             f"curl -s -o /dev/null -w '%{{http_code}}\\n' {BASE}/de-de/epc-project/   # 301 → /de-de/turnkey-project/",
             f"curl -s -o /dev/null -w '%{{http_code}}\\n' {BASE}/no-such-page/        # 404 (custom page)",
             f"curl -s -o /dev/null -w '%{{http_code}} %{{redirect_url}}\\n' {BASE}/products   # 301 → /products/",
             "```", ""]
    (ROOT / "docs" / "redirects.md").write_text("\n".join(rows))


def review_notes():
    out = ["# Content pending HYT approval (generated)", "",
           "Every yellow review note on the preview site, by page. Generated from the English master by `tools/gen_docs.py`.",
           "These notes are hidden by `python3 src/build.py --production`; resolve them before launch.", "",
           "| Page | URL | What HYT must supply or decide |", "|------|-----|-------------------------------|"]
    pages = {}
    for f in sorted((ROOT / "src/content/en").glob("*.json")):
        pages.update(json.loads(f.read_text()).get("pages", {}))
    n, pages_with = 0, set()
    for p in R.P:
        pg = pages.get(p["id"], {})
        for b in pg.get("blocks", []):
            if b.get("type") == "notice" and b.get("variant") == "review":
                n += 1
                pages_with.add(p["id"])
                text = LINK.sub(r"\1", b["text"]).replace("|", "/")
                out.append(f"| {pg.get('nav', p['id'])} | `{p['path']}` | {text} |")
    out.insert(3, f"**{n} notes on {len(pages_with)} pages.**\n")
    (ROOT / "docs" / "review-notices.md").write_text("\n".join(out) + "\n")


if __name__ == "__main__":
    redirects()
    review_notes()
    print("docs/redirects.md and docs/review-notices.md written")
