# Malaysia Directory Engine

Reusable, mobile-first vanilla JavaScript directory for The Bukit Besi.

## Purpose

The engine powers a central Malaysia directory hub and category/state article embeds without duplicating code. It is designed for location content such as post offices, couriers, government offices, clinics, tax offices, JPJ, UTC, Ar-Rahnu and other high-demand local searches.

## Files

- `index.html` — standalone demo
- `assets/directory.css` — isolated responsive styles
- `assets/directory.js` — search, filters, URL state, cards and copy actions
- `data/pejabat-pos-selangor.json` — draft seed dataset

## Production rule

Do not publish a record as verified until its name, address, phone, hours and source have been checked against an official or first-party source. Draft records intentionally omit unverified details.

## Embed configuration

The root element accepts:

```html
<div
  data-tbb-directory
  data-category="pejabat-pos"
  data-state="Selangor"
  data-source="DATA_URL">
</div>
```

The complete markup is available in `index.html`. Use absolute jsDelivr URLs when embedding into Blogger.

## Data fields

Required:

- `id`
- `name`
- `category`
- `state`
- `verificationStatus`

Recommended:

- `branchType`
- `district`
- `city`
- `postcode`
- `address`
- `phone`
- `hours`
- `services`
- `mapsQuery`
- `sourceUrl`
- `lastVerified`
- `notes`

## Verification states

- `verified` — core details checked against a first-party source
- `partial` — some details verified, others omitted or pending
- `pending` — discovery record only; not production-ready

## SEO model

The directory UI is enhancement, not a substitute for crawlable article content. Each Blogger article should still contain visible explanatory text, important locations, official-source notes, internal links and an update log.

Recommended page entities:

- Article page: `BlogPosting` + `BreadcrumbList` + `ItemList`
- Central hub: `CollectionPage` + `ItemList`
- Interactive tool hub: `WebApplication` only when the visible functionality supports it
- Location records: `Place` or a specific subtype only when data is accurate and visible

Do not represent The Bukit Besi as the owner of listed third-party branches.

## Scaling plan

1. Pejabat Pos Selangor
2. Pos Malaysia by state
3. Courier branches
4. Government office directories
5. Health facilities
6. Financial/public-service locations

Use one dataset per category or manageable geographic partition. Avoid one unbounded national JSON file.
