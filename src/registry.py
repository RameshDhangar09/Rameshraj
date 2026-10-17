"""Language-independent page registry for the HYT Engineering website.

Source of truth: HYT_Website_Sitemap_and_Page_Hierarchy_v2.xlsx (Sitemap and
Page Inventory tabs). Every row of the workbook maps to exactly one entry here.
`sr` is the 'Sr. No.' on the Page Inventory tab.

Fields
  id        unique key used by content files and internal links
  path      final URL path (from the workbook 'Final URL' column)
  parent    id of the parent page (breadcrumbs, HTML sitemap)
  template  home | page | product | legal | utility
  image     default page image, relative to /assets/images/ (no extension)
  category  product menu heading (products only)
  model     model code shown in title tag / H1 (products only)
  sitemap   False -> excluded from sitemap.xml (noindex utility pages)
"""

BASE_URL = "https://hytengineering.com"

LANGS = [
    # code, URL prefix, html lang, hreflang, og locale, native name, short label
    {"code": "en",    "prefix": "",        "html": "en",    "hreflang": "en",    "og": "en_GB", "name": "English (Global)",        "short": "EN"},
    {"code": "de-de", "prefix": "/de-de",  "html": "de-DE", "hreflang": "de-DE", "og": "de_DE", "name": "Deutsch",                 "short": "DE"},
    {"code": "fr-fr", "prefix": "/fr-fr",  "html": "fr-FR", "hreflang": "fr-FR", "og": "fr_FR", "name": "Français",                "short": "FR"},
    {"code": "it-it", "prefix": "/it-it",  "html": "it-IT", "hreflang": "it-IT", "og": "it_IT", "name": "Italiano",                "short": "IT"},
    {"code": "nl-nl", "prefix": "/nl-nl",  "html": "nl-NL", "hreflang": "nl-NL", "og": "nl_NL", "name": "Nederlands",              "short": "NL"},
    {"code": "en-us", "prefix": "/en-us",  "html": "en-US", "hreflang": "en-US", "og": "en_US", "name": "English (North America)", "short": "US"},
]

P = []
def page(sr, id, path, parent, template="page", image=None, **kw):
    P.append(dict(sr=sr, id=id, path=path, parent=parent, template=template,
                  image=image, sitemap=kw.pop("sitemap", True), **kw))

# --- Home
page(1, "home", "/", None, "home", "homepage/hero-wheel-lathe-workshop")

# --- About Us
page(2,  "about",            "/company/",                         "home",  image="company/manufacturing-facility")
page(3,  "group-companies",  "/group-companies/",                 "about", image="company/corporate-office")
page(5,  "history",          "/history/",                         "about", image="company/manufacturing-facility")
page(4,  "quality",          "/quality/",                         "about", image="company/quality-inspection")
page(62, "certifications",   "/certifications/",                  "quality", image="company/quality-inspection")
page(9,  "awards",           "/awards/",                          "about", image="company/exhibition-stand")
page(48, "clientele",        "/clientele/",                       "about", image="industries/railways")
page(6,  "csr",              "/csr/",                             "about", image="company/csr-community")
page(64, "compliance",       "/compliance/",                      "about", image="company/corporate-office")
page(65, "code-of-conduct",  "/compliance/code-of-conduct/",      "compliance", "legal", image="company/corporate-office")
page(66, "guidelines",       "/compliance/guidelines/",           "compliance", "legal", image="company/corporate-office")
page(67, "policy-statement", "/compliance/policy-statement/",     "compliance", "legal", image="company/corporate-office")

# --- Products (hub sections are anchors on /products/, not pages)
page(11, "products", "/products/", "home", image="products/surface-wheel-lathe")
PRODUCT_CATEGORIES = ["wheel-lathes", "wheel-axle-shop-machines", "depot-workshop-equipment", "partner-products"]
def product(sr, id, path, cat, model=None):
    page(sr, id, path, "products", "product", image="products/" + IMG.get(id, id), category=cat, model=model)
IMG = {"underfloor-wheel-lathe": "underfloor-wheel-lathe-yul-08",
       "tandem-underfloor-wheel-lathe": "tandem-underfloor-wheel-lathe-yul-12t",
       "underfloor-wheel-lathe-yugl": "underfloor-wheel-lathe-yugl",
       "tandem-underfloor-wheel-lathe-yuglx": "tandem-underfloor-wheel-lathe-yuglx",
       "wheel-presses": "wheel-press",
       "skc-gleittechnik-gmbh-germany": "skc-partner-products"}
product(12, "surface-wheel-lathe",                 "/surface-wheel-lathe/",                 "wheel-lathes", "YSL-08 / YSL-12 / YSL-21")
product(13, "underfloor-wheel-lathe",              "/underfloor-wheel-lathe/",              "wheel-lathes", "YUL-08")
product(23, "underfloor-wheel-lathe-yugl",         "/underfloor-wheel-lathe-yugl/",         "wheel-lathes", "YUGL")
product(14, "tandem-underfloor-wheel-lathe",       "/tandem-underfloor-wheel-lathe/",       "wheel-lathes", "YUL-12T")
product(24, "tandem-underfloor-wheel-lathe-yuglx", "/tandem-underfloor-wheel-lathe-yuglx/", "wheel-lathes", "YUGLX")
product(15, "portal-wheel-lathe",                  "/portal-wheel-lathe/",                  "wheel-lathes", "YPL-02")
product(16, "roller-type-portal-wheel-lathe",      "/roller-type-portal-wheel-lathe/",      "wheel-lathes", "YPL-04")
product(17, "vertical-turning-boring-machine",     "/vertical-turning-boring-machine/",     "wheel-axle-shop-machines", "YVM-04")
product(18, "axle-journal-turning-burnishing-lathe", "/axle-journal-turning-burnishing-lathe/", "wheel-axle-shop-machines")
product(19, "axle-turning-lathe",                  "/axle-turning-lathe/",                  "wheel-axle-shop-machines", "ATL-01")
product(27, "wheel-presses",                       "/wheel-presses/",                       "wheel-axle-shop-machines")
product(25, "wheel-measuring-station",             "/wheel-measuring-station/",             "wheel-axle-shop-machines")
product(26, "dynamic-wheel-balancing-machine",     "/dynamic-wheel-balancing-machine/",     "wheel-axle-shop-machines")
product(20, "multi-purpose-armature-machine",      "/multi-purpose-armature-machine/",      "depot-workshop-equipment")
product(21, "automated-train-washing-plant",       "/automated-train-washing-plant/",       "depot-workshop-equipment")
product(22, "rail-cum-road-vehicle-shunter",       "/rail-cum-road-vehicle-shunter/",       "depot-workshop-equipment")
product(28, "skc-gleittechnik-gmbh-germany",       "/skc-gleittechnik-gmbh-germany/",       "partner-products")

# --- Turnkey Projects
page(29, "turnkey-project",       "/turnkey-project/",       "home",            image="projects/railway-wheel-shop")
page(30, "executed-projects",     "/executed-projects/",     "turnkey-project", image="projects/emu-car-shed")
page(31, "under-execution",       "/under-execution/",       "turnkey-project", image="projects/pit-foundation-civil-works")
# Turnkey Solutions – six solution pages added at HYT's request (14 Oct 2026); not rows of the v2 workbook (sr 75–80).
page(75, "ts-wheel-shops",              "/turnkey-project/wheel-shops/",                            "turnkey-project", image="projects/railway-wheel-shop")
page(76, "ts-maintenance-depots",       "/turnkey-project/railway-maintenance-depots/",             "turnkey-project", image="projects/metro-depot")
page(77, "ts-rolling-stock-facilities", "/turnkey-project/rolling-stock-manufacturing-facilities/", "turnkey-project", image="industries/rolling-stock-manufacturers")
page(78, "ts-wheelset-plants",          "/turnkey-project/wheelset-manufacturing-plants/",          "turnkey-project", image="products/wheel-press")
page(79, "ts-wheel-machining-lines",    "/turnkey-project/wheel-machining-lines/",                  "turnkey-project", image="products/vertical-turning-boring-machine")
page(80, "ts-axle-machining-lines",     "/turnkey-project/axle-machining-lines/",                   "turnkey-project", image="products/axle-turning-lathe")
TURNKEY_SOLUTIONS = ["ts-wheel-shops", "ts-maintenance-depots", "ts-rolling-stock-facilities",
                     "ts-wheelset-plants", "ts-wheel-machining-lines", "ts-axle-machining-lines"]

# --- Services
page(33, "services",                   "/services/",                   "home",        image="company/service-maintenance")
page(34, "installation-commissioning", "/installation-commissioning/", "services",    image="projects/installation-commissioning")
page(35, "maintenance",                "/maintenance/",                "services",    image="company/service-maintenance")
page(36, "operation-and-maintenance",  "/operation-and-maintenance/",  "maintenance", image="projects/metro-depot")
page(37, "annual-maintenance-contract", "/annual-maintenance-contract/", "maintenance", image="company/service-maintenance")
page(38, "comprehensive-annual-maintenance-contract", "/comprehensive-annual-maintenance-contract/", "maintenance", image="products/wheelset-profile-closeup")
page(39, "operation-contract",         "/operation-contract/",         "maintenance", image="projects/railway-wheel-shop")
page(40, "service-contract",           "/service-contract/",           "maintenance", image="company/service-maintenance")
page(41, "spare-supply",               "/spare-supply/",               "maintenance", image="company/spare-parts")
page(42, "retro-fitment-upgradation",  "/retro-fitment-upgradation/",  "services",    image="homepage/engineering-technology")
page(43, "repair",                     "/repair/",                     "services",    image="company/service-maintenance")
page(44, "shifting",                   "/shifting/",                   "services",    image="projects/installation-commissioning")
page(45, "wet-leasing",                "/wet-leasing/",                "services",    image="products/underfloor-wheel-lathe-yul-08")
page(46, "training",                   "/training/",                   "services",    image="company/training-session")
page(47, "service-centers",            "/service-centers/",            "services",    image="company/service-maintenance")

# --- Industries
page(68, "industries",                  "/industries/",                             "home",       image="industries/railways")
page(69, "ind-railways",                "/industries/railways/",                    "industries", image="industries/railways")
page(70, "ind-metros",                  "/industries/metros/",                      "industries", image="industries/metros")
page(71, "ind-rolling-stock",           "/industries/rolling-stock-manufacturers/", "industries", image="industries/rolling-stock-manufacturers")
page(72, "ind-defence",                 "/industries/defence/",                     "industries", image="industries/defence")
page(73, "ind-heavy-engineering",       "/industries/heavy-engineering/",           "industries", image="industries/heavy-engineering")

# --- Media & Resources (menu heading only, no hub page -> parent is home)
page(61, "news",                     "/news/",                     "home", image="company/exhibition-stand")
page(7,  "international-exhibitions", "/international-exhibitions/", "home", image="company/exhibition-stand")
page(8,  "domestic-exhibitions",      "/domestic-exhibitions/",      "home", image="company/exhibition-stand")
page(60, "blog",                     "/blog/",                     "home", image="products/wheelset-profile-closeup")
page(59, "knowledge-centre",         "/knowledge-centre/",         "home", image="homepage/engineering-technology")
page(63, "downloads",                "/downloads/",                "home", image="company/engineering-design")

# --- Work With Us
page(49, "work-with-us",          "/work-with-us/",          "home",         image="company/manufacturing-facility")
page(51, "career",                "/career/",                "work-with-us", image="careers/career-hero")
page(50, "supplier-registration", "/supplier-registration/", "work-with-us", image="company/manufacturing-facility")
page(10, "memorialization",       "/memorialization/",       "work-with-us", image="company/life-at-hyt")

# --- Contact
page(52, "contact-us", "/contact-us/", "home", image="company/corporate-office")

# --- Footer pages
page(53, "privacy-policy", "/privacy-policy/", "home", "legal")
page(56, "cookie-policy",  "/cookie-policy/",  "home", "legal")
page(54, "disclaimer",     "/disclaimer/",     "home", "legal")
# Sr. No. 55 "Annual Return" (/annual-return-2/) removed at HYT's request (14 Oct 2026).

# --- Utility pages
page(57, "sitemap",   "/sitemap/",   "home", "utility")
page(58, "thank-you", "/thank-you/", "contact-us", "utility", sitemap=False)
page(74, "404",       "/404.html",   "home", "utility", sitemap=False)

PAGES = {p["id"]: p for p in P}
assert len(P) == 78, len(P)
assert len({p["sr"] for p in P}) == 78

# Main menu (desktop mega menu + mobile accordion). Headings are not pages.
MENU = [
    {"id": "about", "feature": "history", "columns": [
        {"heading": "who-we-are", "items": ["about", "group-companies", "history"]},
        {"heading": "credentials", "items": ["quality", ("certifications", 1), "awards", "clientele"]},
        {"heading": "responsibility", "items": ["csr", "compliance"]},
    ]},
    {"id": "products", "wide": True, "columns": [
        {"heading": "wheel-lathes", "anchor": "wheel-lathes", "items": [
            "surface-wheel-lathe", "underfloor-wheel-lathe", "underfloor-wheel-lathe-yugl",
            "tandem-underfloor-wheel-lathe", "tandem-underfloor-wheel-lathe-yuglx",
            "portal-wheel-lathe", "roller-type-portal-wheel-lathe"]},
        {"heading": "wheel-axle-shop-machines", "anchor": "wheel-axle-shop-machines", "items": [
            "vertical-turning-boring-machine", "axle-journal-turning-burnishing-lathe", "axle-turning-lathe",
            "wheel-presses", "wheel-measuring-station", "dynamic-wheel-balancing-machine"]},
        {"heading": "depot-workshop-equipment", "anchor": "depot-workshop-equipment", "items": [
            "multi-purpose-armature-machine", "automated-train-washing-plant", "rail-cum-road-vehicle-shunter"]},
        {"heading": "partner-products", "anchor": "partner-products", "items": ["skc-gleittechnik-gmbh-germany"]},
    ]},
    {"id": "turnkey-project", "feature": "ts-wheel-shops", "columns": [
        {"heading": "turnkey-solutions", "items": ["ts-wheel-shops", "ts-maintenance-depots", "ts-rolling-stock-facilities",
                                                   "ts-wheelset-plants", "ts-wheel-machining-lines", "ts-axle-machining-lines"]},
        {"heading": "project-references", "items": ["executed-projects", "under-execution"]}]},
    {"id": "services", "feature": "wet-leasing", "columns": [
        {"items": ["installation-commissioning", "maintenance",
                   ("operation-and-maintenance", 1), ("annual-maintenance-contract", 1),
                   ("comprehensive-annual-maintenance-contract", 1), ("operation-contract", 1),
                   ("service-contract", 1), ("spare-supply", 1)]},
        {"items": ["retro-fitment-upgradation", "repair", "shifting", "wet-leasing", "training", "service-centers"]},
    ]},
    {"id": "industries", "feature": "ind-metros", "columns": [
        {"items": ["ind-railways", "ind-metros", "ind-rolling-stock", "ind-defence", "ind-heavy-engineering"]}]},
    {"id": None, "label": "media", "feature": "downloads", "columns": [
        {"heading": "news-events", "items": ["news", "international-exhibitions", "domestic-exhibitions"]},
        {"heading": "resources", "items": ["blog", "knowledge-centre", "downloads"]},
    ]},
    {"id": "work-with-us", "feature": "career", "columns": [
        {"items": ["career", "supplier-registration", "memorialization"]}]},
]

FOOTER = [
    {"heading": "company", "items": ["about", "group-companies", "history", "quality", "clientele", "csr", "compliance"]},
    {"heading": "products", "items": ["products", "surface-wheel-lathe", "underfloor-wheel-lathe", "tandem-underfloor-wheel-lathe",
                                       "portal-wheel-lathe", "vertical-turning-boring-machine", "turnkey-project"]},
    {"heading": "services", "items": ["services", "installation-commissioning", "annual-maintenance-contract", "spare-supply",
                                       "retro-fitment-upgradation", "wet-leasing", "training", "service-centers"]},
    {"heading": "resources", "items": ["industries", "news", "blog", "knowledge-centre", "downloads", "career", "supplier-registration", "contact-us"]},
]
LEGAL_FOOTER = ["privacy-policy", "cookie-policy", "disclaimer", "sitemap"]

# Ten 301s from the Redirects tab + the duplicate noted on Page Inventory row 34.
REDIRECTS = [
    ("/cnc-surface-wheel-lathe/", "/surface-wheel-lathe/"),
    ("/cnc-underfloor-wheel-lathe/", "/underfloor-wheel-lathe/"),
    ("/cnc-tandem-underfloor-wheel-lathe/", "/tandem-underfloor-wheel-lathe/"),
    ("/cnc-portal-wheel-lathe/", "/portal-wheel-lathe/"),
    ("/cnc-vertical-turning-boring-machine/", "/vertical-turning-boring-machine/"),
    ("/cnc-axle-journal-turning-burnishing-lathe/", "/axle-journal-turning-burnishing-lathe/"),
    ("/multipurpose-armature-machine/", "/multi-purpose-armature-machine/"),
    ("/wheel-press/", "/wheel-presses/"),
    ("/epc-project/", "/turnkey-project/"),
    ("/maintainance/", "/maintenance/"),
]
# /wheel-shop-automation/ was merged into the Wheel Shops page at HYT's request (15 Oct 2026)
EXTRA_REDIRECTS = [("/installation-and-commissioning/", "/installation-commissioning/"),
                   ("/wheel-shop-automation/", "/turnkey-project/wheel-shops/")]

# Customer marks for the home-page logo carousel (verified customers only, see docs/verified-facts.md).
# Files in hyt-website/assets/images/clients/ are neutral PLACEHOLDERS – replace with approved logos.
CLIENTS = [
    ("indian-railways", "Indian Railways"),
    ("dmrc", "Delhi Metro Rail Corporation (DMRC)"),
    ("ncrtc", "National Capital Region Transport Corporation (NCRTC)"),
    ("state-railway-of-thailand", "State Railway of Thailand"),
]
