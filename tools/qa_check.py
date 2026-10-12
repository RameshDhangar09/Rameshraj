#!/usr/bin/env python3
"""Static QA for the generated site in hyt-website/.

    python3 tools/qa_check.py

Checks every generated HTML page for:
  * internal links, images, scripts, stylesheets and downloads that do not resolve
  * #anchors that do not exist on the target page
  * html lang attribute matches the language folder
  * canonical = own URL; reciprocal hreflang set (6 languages + x-default)
  * unique <title> and meta description within each language
  * exactly one <h1>; images without alt attribute; duplicate element ids
  * redirect sources do not exist as pages (they must be server-side 301s)
Exit code 1 when errors are found.
"""
import re
import sys
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "hyt-website"
sys.path.insert(0, str(ROOT / "src"))
import registry as R  # noqa: E402

BASE = R.BASE_URL
LANG_HTML = {L["prefix"].strip("/"): L["html"] for L in R.LANGS}


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.assets, self.ids, self.alts = [], [], [], []
        self.h1 = 0
        self.title = ""
        self._in_title = False
        self.meta = {}
        self.canonical = None
        self.hreflang = {}
        self.lang = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])
        if tag == "img":
            if "alt" not in a:
                self.alts.append(a.get("src"))
            if a.get("src"):
                self.assets.append(a["src"])
            for part in (a.get("srcset") or "").split(","):
                if part.strip():
                    self.assets.append(part.strip().split()[0])
        if tag == "script" and a.get("src"):
            self.assets.append(a["src"])
        if tag == "link":
            rel = a.get("rel", "")
            if rel == "stylesheet" or rel == "icon" or rel == "preload":
                self.assets.append(a.get("href"))
            if rel == "canonical":
                self.canonical = a.get("href")
            if rel == "alternate" and a.get("hreflang"):
                self.hreflang[a["hreflang"]] = a["href"]
        if tag == "meta" and a.get("name") == "description":
            self.meta["description"] = a.get("content", "")
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def url_of(path: Path):
    rel = "/" + path.relative_to(SITE).as_posix()
    return rel[: -len("index.html")] if rel.endswith("/index.html") else rel


def resolve(url):
    """Map a site-relative URL to a file, or None."""
    p = unquote(urlparse(url).path)
    f = SITE / p.lstrip("/")
    if p.endswith("/"):
        f = f / "index.html"
    return f if f.exists() else None


def main():
    pages = {}
    for f in sorted(SITE.rglob("*.html")):
        if "assets" in f.parts:
            continue
        pp = Page()
        pp.feed(f.read_text())
        pages[url_of(f)] = pp

    errors, warns = [], []
    titles, descs = defaultdict(lambda: defaultdict(list)), defaultdict(lambda: defaultdict(list))
    for url, pp in pages.items():
        folder = url.strip("/").split("/")[0] if url.strip("/") else ""
        langkey = folder if folder in LANG_HTML else ""
        if pp.lang != LANG_HTML[langkey]:
            errors.append(f"{url}: lang={pp.lang} expected {LANG_HTML[langkey]}")
        if pp.h1 != 1:
            errors.append(f"{url}: {pp.h1} <h1> elements")
        dup = {i for i in pp.ids if pp.ids.count(i) > 1}
        if dup:
            errors.append(f"{url}: duplicate ids {sorted(dup)[:5]}")
        if pp.alts:
            errors.append(f"{url}: img without alt {pp.alts[:3]}")
        for href in pp.links:
            if href.startswith(("mailto:", "tel:", "http://", "https://")):
                continue
            target, _, frag = href.partition("#")
            if not target:
                if frag and frag not in pp.ids and frag != "top":
                    errors.append(f"{url}: missing in-page anchor #{frag}")
                continue
            if not target.startswith("/"):
                errors.append(f"{url}: relative link {href}")
                continue
            if target.split("?")[0].endswith((".pdf", ".jpg", ".png", ".svg")):
                if not resolve(target.split("?")[0]):
                    errors.append(f"{url}: broken file link {href}")
                continue
            path = target.split("?")[0]
            if not path.endswith("/") and not path.endswith(".html"):
                errors.append(f"{url}: link without trailing slash {href}")
            if not resolve(path):
                errors.append(f"{url}: broken link {href}")
                continue
            if frag:
                tgt = pages.get(path)
                if tgt and frag not in tgt.ids:
                    errors.append(f"{url}: anchor #{frag} not found on {path}")
        for src in pp.assets:
            if not src or src.startswith("http"):
                continue
            if not resolve(src.split("?")[0]):
                errors.append(f"{url}: missing asset {src}")
        noindex = url.endswith("/thank-you/") or url.endswith("404.html")
        if not noindex:
            if pp.canonical != BASE + url:
                errors.append(f"{url}: canonical {pp.canonical}")
            if len(pp.hreflang) != 7:
                errors.append(f"{url}: {len(pp.hreflang)} hreflang links")
            for code, href in pp.hreflang.items():
                other = pages.get(href.replace(BASE, ""))
                if not other:
                    errors.append(f"{url}: hreflang {code} → missing page {href}")
                elif BASE + url not in other.hreflang.values():
                    errors.append(f"{url}: hreflang not reciprocal with {href}")
            titles[langkey][pp.title.strip()].append(url)
            descs[langkey][pp.meta.get("description", "")].append(url)
            if not pp.meta.get("description"):
                errors.append(f"{url}: no meta description")
    for lang, d in titles.items():
        for t, urls in d.items():
            if len(urls) > 1:
                errors.append(f"[{lang or 'en'}] duplicate title '{t}': {urls}")
    for lang, d in descs.items():
        for t, urls in d.items():
            if len(urls) > 1:
                errors.append(f"[{lang or 'en'}] duplicate description on {urls}")
    for old, _new in R.REDIRECTS + R.EXTRA_REDIRECTS:
        if (SITE / old.lstrip("/") / "index.html").exists():
            errors.append(f"redirect source {old} exists as a page")

    print(f"Checked {len(pages)} HTML pages.")
    for e in errors:
        print("ERROR", e)
    for w in warns:
        print("WARN ", w)
    print(f"{len(errors)} errors, {len(warns)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
