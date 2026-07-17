# Brands to register for batch8 retrieval

Manual retrieval in `index.js` recognizes a brand only if the canonical key is in
`_HVAC_BRANDS` (line ~1450) and any typed variant maps through `_BRAND_ALIASES` (line ~1458).
`brandFromText()` returns `b.split(' ')[0]`, so multi-word keys resolve on their first token.

Below are the canonical brand keys used in `db/manuals.batch8.json`, split into
"already registered" (no action) and "MUST ADD" (retrieval will miss these until added).

## Already in `_HVAC_BRANDS` — no action needed
- `carrier`, `trane`, `goodman`, `rheem`, `ruud`, `lennox`, `allied`,
  `tempstar`, `fujitsu`, `frigidaire`

## MUST ADD to `_HVAC_BRANDS` (new canonical keys)
Add these lowercase keys to the `_HVAC_BRANDS` array:

```
'runtru','ameristar','champion','ducane','concord','airease','aireflo','ecotemp','grandaire','guardian','icp'
```

Notes on brand families (why these matter / how they relate):
- `runtru`  — Trane's budget line (A4AC4 / A4HP4 / A4AH4). Distinct brand key.
- `ameristar` — Trane/American Standard budget line (M4HP40, mini-splits). Distinct key.
- `champion` — Johnson Controls / York-family residential (LX, Momentum, TH4B). Distinct key.
- `ducane`   — Allied Air Enterprises (Lennox Intl) budget brand (4AC13, 92G1UHE furnaces).
- `concord`  — Allied Air Enterprises budget brand (4AC13/14/16L, 4HP14/15L).
- `airease`  — Allied Air Enterprises brand ("Air-Ease" / "AirEase"; A801E/A931E/A962E furnaces).
- `aireflo`  — Allied Air Enterprises / Lennox budget brand ("Aire-Flo"; 80AF/92AF/95AF, 4AC13L).
- `ecotemp`  — ICP (International Comfort Products) budget brand (WCA4/WPA4/WCH4).
- `grandaire`— ICP budget brand ("GrandAire" / "Grand Aire"; WCA4/WJH4).
- `guardian` — Allied Air Enterprises private-label (PRPAC/PRPHP packaged units).
- `icp`      — International Comfort Products (parent umbrella for Heil/Tempstar/Comfortmaker/
               Day&Night/Arcoaire/KeepRite/Grandaire/EcoTemp). `heil`,`tempstar`,`comfortmaker`,
               `arcoaire`,`keeprite` are already registered; `icp` is added as its own key so
               generic ICP-labeled docs resolve.

## MUST ADD to `_BRAND_ALIASES` (typed-variant → canonical)
User/tech spelling variants that will NOT match without an alias. Add these entries:

```
'run tru':'runtru','run-tru':'runtru',
'ameri star':'ameristar','ameri-star':'ameristar',
'air ease':'airease','air-ease':'airease',
'aire flo':'aireflo','aire-flo':'aireflo','air flo':'aireflo','air-flo':'aireflo',
'eco temp':'ecotemp','eco-temp':'ecotemp',
'grand aire':'grandaire','grand-aire':'grandaire',
'international comfort products':'icp','intl comfort products':'icp',
'day & night':'carrier','day and night':'carrier','day&night':'carrier'
```

Rationale for the last group (`day & night`): Day & Night is an ICP/Carrier-family
brand; its docs live on Carrier's shareddocs and share Carrier's model logic, so mapping
typed "Day & Night" to `carrier` keeps retrieval on the correct manual host. If a
dedicated `daynight` key/doc set is later added, remap accordingly.

## Verification status
All 71 URLs in `db/manuals.batch8.json` passed the required curl check
(browser UA, `-sL`) returning `200 + application/pdf + real size (>50KB)`.
Hosts confirmed UNREACHABLE from the build environment and therefore avoided:
`pts.myrheem.com`, `portal.fujitsugeneral.com`, and (rate-limited mid-run)
`www.trane.com` — for those brands, equivalent docs were sourced from reachable
mirrors (files.rheem.com, files.myrheem.com, hvacdirect.com, iwae.com, abrwholesalers.com,
www.fujitsugeneral.com).
