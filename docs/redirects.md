# Redirect map (HTTP 301)

Generated from `src/registry.py` (Redirects tab of the workbook, the duplicate noted on Page Inventory row 34 and pages merged later).
Each rule is applied to the root and to every language folder, giving 72 rules in `.htaccess`, `_redirects` and `deploy/nginx-hyt.conf`.

| # | Old URL | New URL | Source |
|---|---------|---------|--------|
| 1 | https://hytengineering.com/cnc-surface-wheel-lathe/ | https://hytengineering.com/surface-wheel-lathe/ | Redirects tab |
| 2 | https://hytengineering.com/cnc-underfloor-wheel-lathe/ | https://hytengineering.com/underfloor-wheel-lathe/ | Redirects tab |
| 3 | https://hytengineering.com/cnc-tandem-underfloor-wheel-lathe/ | https://hytengineering.com/tandem-underfloor-wheel-lathe/ | Redirects tab |
| 4 | https://hytengineering.com/cnc-portal-wheel-lathe/ | https://hytengineering.com/portal-wheel-lathe/ | Redirects tab |
| 5 | https://hytengineering.com/cnc-vertical-turning-boring-machine/ | https://hytengineering.com/vertical-turning-boring-machine/ | Redirects tab |
| 6 | https://hytengineering.com/cnc-axle-journal-turning-burnishing-lathe/ | https://hytengineering.com/axle-journal-turning-burnishing-lathe/ | Redirects tab |
| 7 | https://hytengineering.com/multipurpose-armature-machine/ | https://hytengineering.com/multi-purpose-armature-machine/ | Redirects tab |
| 8 | https://hytengineering.com/wheel-press/ | https://hytengineering.com/wheel-presses/ | Redirects tab |
| 9 | https://hytengineering.com/epc-project/ | https://hytengineering.com/turnkey-project/ | Redirects tab |
| 10 | https://hytengineering.com/maintainance/ | https://hytengineering.com/maintenance/ | Redirects tab |
| + | https://hytengineering.com/installation-and-commissioning/ | https://hytengineering.com/installation-commissioning/ | Page Inventory row 34 (old duplicate page) |
| + | https://hytengineering.com/wheel-shop-automation/ | https://hytengineering.com/turnkey-project/wheel-shops/ | Page merged into Wheel Shops at HYT's request (15 Oct 2026) |

Note: the workbook's SEO notes for rows 13 and 14 read '301 /underfloor-wheel-lathe/ to /underfloor-wheel-lathe/' (old and new identical – a typo). The Redirects tab gives the correct old URLs (`/cnc-underfloor-wheel-lathe/`, `/cnc-tandem-underfloor-wheel-lathe/`), which are used here.

## Verify after deployment

```bash
for u in /cnc-surface-wheel-lathe/ /cnc-underfloor-wheel-lathe/ /cnc-tandem-underfloor-wheel-lathe/ /cnc-portal-wheel-lathe/ /cnc-vertical-turning-boring-machine/ /cnc-axle-journal-turning-burnishing-lathe/ /multipurpose-armature-machine/ /wheel-press/ /epc-project/ /maintainance/ /installation-and-commissioning/ /wheel-shop-automation/; do
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}  $u\n" https://hytengineering.com$u
done
# expect: 301 https://hytengineering.com/<new>/ for every line
curl -s -o /dev/null -w '%{http_code}\n' https://hytengineering.com/de-de/epc-project/   # 301 → /de-de/turnkey-project/
curl -s -o /dev/null -w '%{http_code}\n' https://hytengineering.com/no-such-page/        # 404 (custom page)
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://hytengineering.com/products   # 301 → /products/
```
