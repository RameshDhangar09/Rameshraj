"""Derive North American English (en-US) copy from the British English master.

The en-US site uses the same pages and facts as the global English site; only
spelling and a few regional terms change. Structural values (page ids, image
names, icons, URLs and link targets) are never modified. To override any page
by hand, place a file with the same name in src/content/en-us/.
"""
import re

# British -> American. Whole words, case-preserving. Order does not matter.
WORDS = {
    "organisation": "organization", "organisations": "organizations", "organisational": "organizational",
    "organise": "organize", "organised": "organized", "organises": "organizes", "organising": "organizing",
    "centre": "center", "centres": "centers", "centred": "centered",
    "programme": "program", "programmes": "programs",
    "metre": "meter", "metres": "meters", "millimetre": "millimeter", "millimetres": "millimeters",
    "kilometre": "kilometer", "kilometres": "kilometers",
    "tyre": "tire", "tyres": "tires",
    "colour": "color", "colours": "colors", "coloured": "colored",
    "defence": "defense",
    "behaviour": "behavior", "behaviours": "behaviors",
    "labour": "labor", "favour": "favor", "favourable": "favorable", "honour": "honor", "neighbouring": "neighboring",
    "endeavour": "endeavor", "harbour": "harbor", "rumour": "rumor", "vigour": "vigor",
    "licence": "license", "licences": "licenses",
    "catalogue": "catalog", "catalogues": "catalogs",
    "analyse": "analyze", "analysed": "analyzed", "analyses": "analyzes", "analysing": "analyzing",
    "optimise": "optimize", "optimised": "optimized", "optimises": "optimizes", "optimising": "optimizing", "optimisation": "optimization",
    "minimise": "minimize", "minimised": "minimized", "minimises": "minimizes", "minimising": "minimizing",
    "maximise": "maximize", "maximised": "maximized", "maximises": "maximizes", "maximising": "maximizing",
    "standardise": "standardize", "standardised": "standardized", "standardisation": "standardization",
    "specialise": "specialize", "specialised": "specialized", "specialises": "specializes", "specialist": "specialist",
    "recognise": "recognize", "recognised": "recognized", "recognises": "recognizes", "recognition": "recognition",
    "authorise": "authorize", "authorised": "authorized", "authorisation": "authorization",
    "utilise": "utilize", "utilised": "utilized", "utilisation": "utilization",
    "modernise": "modernize", "modernised": "modernized", "modernisation": "modernization",
    "prioritise": "prioritize", "prioritised": "prioritized",
    "customise": "customize", "customised": "customized",
    "synchronise": "synchronize", "synchronised": "synchronized", "synchronisation": "synchronization",
    "realise": "realize", "realised": "realized",
    "summarise": "summarize", "summarised": "summarized",
    "emphasise": "emphasize", "emphasised": "emphasized",
    "characterise": "characterize", "characterised": "characterized",
    "familiarise": "familiarize", "familiarisation": "familiarization",
    "digitise": "digitize", "digitised": "digitized",
    "stabilise": "stabilize", "stabilised": "stabilized",
    "normalise": "normalize", "normalised": "normalized",
    "visualise": "visualize", "visualisation": "visualization",
    "categorise": "categorize", "categorised": "categorized",
    "apologise": "apologize",
    "minimisation": "minimization", "maximisation": "maximization",
    "fibre": "fiber", "fibres": "fibers",
    "aluminium": "aluminum",
    "enquiry": "inquiry", "enquiries": "inquiries", "enquire": "inquire", "enquiring": "inquiring",
    "travelled": "traveled", "travelling": "traveling", "cancelled": "canceled", "cancelling": "canceling",
    "labelled": "labeled", "labelling": "labeling", "modelling": "modeling", "modelled": "modeled",
    "levelling": "leveling", "levelled": "leveled", "signalling": "signaling", "fuelling": "fueling",
    "fulfil": "fulfill", "fulfils": "fulfills", "fulfilment": "fulfillment", "enrol": "enroll", "enrolment": "enrollment",
    "instalment": "installment",
    "judgement": "judgment", "ageing": "aging", "grey": "gray",
    "whilst": "while", "amongst": "among", "learnt": "learned",
    "mould": "mold", "moulds": "molds", "moulded": "molded",
    "manoeuvre": "maneuver", "manoeuvring": "maneuvering",
    "practise": "practice", "practised": "practiced",
    "draught": "draft", "plough": "plow",
    "sceptical": "skeptical", "storey": "story",
    "lorry": "truck", "lorries": "trucks",
    "spanner": "wrench", "spanners": "wrenches",
    "dialled": "dialed",
    "toll-free": "toll-free",
}

_PATTERN = re.compile(r"\b(" + "|".join(sorted(map(re.escape, WORDS), key=len, reverse=True)) + r")\b", re.IGNORECASE)
_LINK = re.compile(r"(\]\([^)]*\))")  # protect link targets like ](page:knowledge-centre)

STRUCTURAL = {"type", "id", "icon", "image", "page", "pages", "href", "file", "layout", "cols", "variant", "embed", "poster", "form",
              "anchor", "products", "status_key", "related", "limit", "carousel"}


def _case(src, dst):
    if src.isupper():
        return dst.upper()
    if src[0].isupper():
        return dst[0].upper() + dst[1:]
    return dst


def convert_text(text):
    parts = _LINK.split(text)
    for i in range(0, len(parts), 2):  # even indexes are outside link targets
        parts[i] = _PATTERN.sub(lambda m: _case(m.group(0), WORDS[m.group(0).lower()]), parts[i])
    return "".join(parts)


def americanize(obj, key=None):
    if key in STRUCTURAL and not isinstance(obj, dict) and not (key == "products" and isinstance(obj, str)):
        return obj
    if isinstance(obj, str):
        if obj.startswith("/") or obj.startswith("http") or "@" in obj and " " not in obj:
            return obj
        return convert_text(obj)
    if isinstance(obj, list):
        return [americanize(x, key) for x in obj]
    if isinstance(obj, dict):
        return {k: americanize(v, k) for k, v in obj.items()}
    return obj


if __name__ == "__main__":
    s = "The Knowledge Centre helps organisations analyse tyre wear – see [Knowledge Centre](page:knowledge-centre). Defence and colour."
    print(convert_text(s))
