# PWA Lite for Namecheap + Blogger

## VERIFIED

- Production source is `asset/tbb.xml`.
- The previous manifest pointed to `https://tbbcom.github.io/on/manifest.json`.
- The theme already includes its own `.pbt-toc-wrap` / `#pbt-toc` implementation; the PWA helper detects and preserves it.
- PWA assets are served from `https://assets.thebukitbesi.com/pwa/` with CORS enabled.

## Scope

This patch replaces the old manifest reference, adds application metadata, loads the lightweight PWA CSS/JS, and explicitly disables Service Worker registration.

Included runtime enhancements:

- existing Blogger TOC preserved;
- reading progress on article pages;
- safe same-origin hover/touch prefetch that respects Data Saver;
- browser install prompt when available;
- accessible Add to Home Screen instructions when the native prompt is unavailable;
- online/offline status messaging.

## Exclusions

- No DNS, redirect, canonical, robots, schema, analytics, AdSense, widget, navigation or content changes.
- No custom offline cache.
- No web push subscription.
- No Cloudflare proxy or Worker dependency.

## Tests performed

- XML parsed successfully after the patch.
- External JavaScript passed `node --check`.
- Manifest parsed as valid JSON.
- Live asset host returned the manifest and JavaScript with correct MIME types.

## Blogger live-test checklist

1. Back up the current live theme.
2. Upload the patched `asset/tbb.xml` from this branch.
3. Test homepage, post, page, label, search, mobile and desktop views.
4. Confirm there is one manifest link and no Service Worker registration error.
5. Confirm the existing TOC is not duplicated.
6. On a post, confirm reading progress and install help.
7. Confirm menu, search, dark mode, related posts, ads, analytics and comments remain functional.
8. Compare representative Lighthouse tests under equivalent conditions.

## Rollback

Restore the pre-change template or revert the commit on this feature branch. The patch has no DNS or persistent Service Worker state.

## Remaining risks

- Browser installation UI varies by platform.
- Custom offline caching and push require a same-origin Service Worker and are intentionally unavailable in this mode.
- LIVE TEST REQUIRED for Blogger upload, installed-app UI and field performance.
