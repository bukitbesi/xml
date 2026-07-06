# Live Site Verification Checklist (Android-Friendly)

Use this checklist on the deployed site (`https://www.thebukitbesi.com/`) after any remediation batch.  
Primary device: Android Chrome (latest stable). Repeat critical checks on desktop Chrome.

## Test matrix (required states)

- Homepage
- Single post
- Static page
- Label page
- Search page (with query)
- Search page (empty query state)
- Archive page
- 404 page
- Mobile viewport
- Desktop viewport
- Logged-out state
- Consent banner shown/accepted/rejected states

## Prerequisites

1. Use production URLs (not Blogger preview URLs).
2. Test in normal mode and incognito.
3. Disable browser extensions/ad blockers.
4. Record timestamp, URL, device, and network profile for each run.

## Common checks for every page type

1. View source and confirm:
   - single canonical tag;
   - expected robots directive for that URL class;
   - OG/Twitter tags rendered once;
   - exactly one JSON-LD script block with expected schema type(s).
2. Confirm page has visible primary content and no broken template sections.
3. Check console for runtime errors.
4. Check network requests for failed critical assets/scripts.

## Android mobile checks (per page type)

### 1) Homepage (`/`)
- Validate canonical host is `https://www.thebukitbesi.com/`.
- Confirm WebSite + Organization schema in rendered source.
- Verify featured/content blocks render and are crawlable links.
- Check ad containers:
  - no permanent blank gaps;
  - no overlap with content;
  - no layout jump after ad fill/no-fill.
- Open menu, search overlay, dark-mode toggle, and back-to-top button.

### 2) Single post
- Confirm BlogPosting or NewsArticle branch correctness.
- Validate breadcrumb links are clickable anchors.
- Confirm headline, date, author, and featured image alignment with schema/meta.
- Verify in-article ads and before/after-content ads behavior.
- Open comments and share modal; verify no blocked controls.

### 3) Static page
- Confirm WebPage schema branch.
- Confirm title/description/canonical consistency.
- Verify optional ad behavior if `{showAds}` marker is used.

### 4) Label page (`/search/label/...`)
- Verify robots directive expected by current policy.
- Confirm CollectionPage schema output.
- Check pagination/load-more behavior and canonical continuity.

### 5) Search page with query (`/search?q=...`)
- Confirm SearchResultsPage schema.
- Confirm crawlable result links and visible query context.

### 6) Search page without query
- Confirm expected WebPage branch and robots directive.
- Verify no broken UI state.

### 7) Archive page
- Confirm CollectionPage schema and current robots policy.
- Verify post cards/pagination render normally.

### 8) 404 page
- Confirm noindex robots behavior.
- Confirm user can navigate back to valid pages.

## Desktop checks

Repeat the same URL matrix on desktop viewport and additionally validate:
- sticky header/sidebar behavior;
- dropdown/mega menu accessibility;
- ad placements around sidebar/footer/header;
- no horizontal overflow at common widths (1366px, 1440px).

## Logged-out + consent-state checks

For mobile and desktop:
1. Clear site data.
2. Load homepage logged out.
3. Capture behavior before interacting with consent.
4. Accept consent and re-check analytics/ad requests.
5. Reject/close consent and re-check behavior.
6. Ensure no blocked interaction with core navigation/content.

## Cloudflare checks

- `http://thebukitbesi.com` → must redirect to `https://www.thebukitbesi.com/`.
- `https://thebukitbesi.com` → must redirect to `https://www.thebukitbesi.com/`.
- `https://www.thebukitbesi.com/?m=1` behavior should align with canonical policy.
- Verify cache headers for HTML and critical static resources.

## Evidence capture requirements

For each tested URL/state, capture:
- URL and timestamp
- device/browser version
- screenshot (viewport)
- view-source snippet for canonical/robots/schema
- console summary
- network summary of failed requests
- notes on ad layout stability and interaction failures

