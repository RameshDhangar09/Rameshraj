#!/usr/bin/env python3
"""Validate a translated content file against the English master.

    python3 src/check_translation.py de-de products       # one file
    python3 src/check_translation.py de-de                # all files of a language

Checks: same keys and list lengths, structural values unchanged, identical
link targets in inline links, model codes preserved, no untranslated strings
left identical to English (reported as a warning, since some are legitimately
identical, e.g. names).
"""
import json
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent
STRUCT = {"type", "id", "icon", "image", "page", "pages", "href", "file", "layout", "cols", "variant", "form",
          "anchor", "products", "status_key", "related", "limit", "carousel"}
LINK = re.compile(r"\]\(([^)\s]+)\)")
MODELS = re.compile(r"\b(YUL-08|YUL-12T|YUGLX|YUGL|YPL-0[24]|YSL-(?:08|12|21)|YVM-04|ATL-01)\b")
FILES = ["common", "home", "about", "products", "projects", "turnkey", "services", "industries", "media", "work", "utility", "legal"]


def compare(en, tr, path, errors, same):
    if isinstance(en, dict):
        if not isinstance(tr, dict):
            errors.append(f"{path}: expected object")
            return
        missing = set(en) - set(tr)
        extra = set(tr) - set(en)
        if missing:
            errors.append(f"{path}: missing keys {sorted(missing)}")
        if extra:
            errors.append(f"{path}: extra keys {sorted(extra)}")
        for k in en:
            if k in tr:
                if k in STRUCT and not isinstance(en[k], dict) and not (k == "products" and isinstance(en[k], str)):
                    if en[k] != tr[k]:
                        errors.append(f"{path}.{k}: structural value changed ({en[k]!r} → {tr[k]!r})")
                else:
                    compare(en[k], tr[k], f"{path}.{k}", errors, same)
    elif isinstance(en, list):
        if not isinstance(tr, list):
            errors.append(f"{path}: expected list")
            return
        if len(en) != len(tr) and not path.endswith("countries"):
            errors.append(f"{path}: list length {len(tr)} != {len(en)}")
            return
        if path.endswith("countries"):
            return
        for i, (a, b) in enumerate(zip(en, tr)):
            compare(a, b, f"{path}[{i}]", errors, same)
    elif isinstance(en, str):
        if not isinstance(tr, str):
            errors.append(f"{path}: expected string")
            return
        if sorted(LINK.findall(en)) != sorted(LINK.findall(tr)):
            errors.append(f"{path}: link targets differ: {LINK.findall(en)} vs {LINK.findall(tr)}")
        if sorted(set(MODELS.findall(en))) != sorted(set(MODELS.findall(tr))):
            errors.append(f"{path}: model codes differ")
        if en == tr and len(en.split()) > 3:
            same.append(path)
    else:
        if en != tr:
            errors.append(f"{path}: value changed")


def check(lang, name):
    en_f = SRC / "content" / "en" / f"{name}.json"
    tr_f = SRC / "content" / lang / f"{name}.json"
    if not tr_f.exists():
        return [f"{tr_f} missing"], []
    try:
        tr = json.loads(tr_f.read_text())
    except json.JSONDecodeError as e:
        return [f"{tr_f}: invalid JSON – {e}"], []
    errors, same = [], []
    compare(json.loads(en_f.read_text()), tr, name, errors, same)
    return errors, same


if __name__ == "__main__":
    lang = sys.argv[1]
    names = sys.argv[2:] or FILES
    bad = False
    for n in names:
        errs, same = check(lang, n)
        if errs:
            bad = True
            print(f"✗ {lang}/{n}.json – {len(errs)} problem(s):")
            for e in errs[:60]:
                print("   ", e)
        else:
            print(f"✓ {lang}/{n}.json OK")
        if same:
            print(f"   note: {len(same)} strings identical to English (check they need no translation): {same[:8]}")
    sys.exit(1 if bad else 0)
