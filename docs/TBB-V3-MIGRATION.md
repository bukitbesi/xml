# TBB v3 Blogger migration

Use commit `f42c0ca24bf7bc8b2d7026d564701f3d43e3b72c` for all jsDelivr URLs below so the bundle is immutable and cache-safe.

## 1. Remove from `<head>`

Remove the complete Microsoft Clarity bootstrap block.

Remove both Reader Revenue / Subscribe with Google blocks if TBB is not using RRM/paid subscriptions:

```xml
<script async='async' src='https://news.google.com/swg/js/v1/swg-basic.js'/>
```

and the following `SWG_BASIC` initialization block.

Remove the current GA4 loader + inline `gtag()` initialization block. It is replaced by the idle loader below.

## 2. Main non-critical CSS

Remove older external TBB UI CSS links (`tbb.v2.2.1.css`, `tbb.v2.3.2.css`) and keep only:

```xml
<link href='https://cdn.jsdelivr.net/gh/bukitbesi/xml@f42c0ca24bf7bc8b2d7026d564701f3d43e3b72c/asset/src/tbb.v3.main.css' id='tbb-ui-v3' rel='stylesheet'/>
```

Do NOT externalize the small existing header/layout critical rules needed for the first paint. Blogger variables and above-the-fold header shell should remain inside `<b:skin>`.

## 3. Replace the old single runtime

Remove `tbb.v2.3.js` and any 2.2.x hotfix scripts. Add these near the end of `<body>`:

```xml
<script defer='defer' id='tbb-core-v3' src='https://cdn.jsdelivr.net/gh/bukitbesi/xml@f42c0ca24bf7bc8b2d7026d564701f3d43e3b72c/asset/src/tbb.v3.core.js' type='text/javascript'/>
<script defer='defer' expr:data-blog-url='data:blog.homepageUrl.canonical' id='tbb-dynamic-v3' src='https://cdn.jsdelivr.net/gh/bukitbesi/xml@f42c0ca24bf7bc8b2d7026d564701f3d43e3b72c/asset/src/tbb.v3.dynamic.js' type='text/javascript'/>
<script defer='defer' id='tbb-analytics-v3' src='https://cdn.jsdelivr.net/gh/bukitbesi/xml@f42c0ca24bf7bc8b2d7026d564701f3d43e3b72c/asset/src/tbb.analytics.v3.js' type='text/javascript'/>
```

The core runtime restores the mobile drawer directly from the Blogger `main-menu` LinkList and does not depend on feed success. The dynamic runtime owns feeds, related posts, mega-menu feeds, live search, thumbnails and load-more.

## 4. CWV rules

- Keep the first visible/LCP image eager and high priority. Do not lazy-load the primary hero image.
- Keep below-fold `getPosts` widgets IntersectionObserver-gated.
- Collapse only confirmed `data-ad-status="unfilled"` AdSense containers.
- Preserve intrinsic size for delayed sections to avoid CLS.
- Avoid adding more analytics/session-recording scripts until PageSpeed stabilizes.

## 5. Validation

After paste/upload:

1. Confirm the mobile drawer contains all `LinkList200` items and nested labels.
2. Confirm Terkini/Islamik/Direktori load after scrolling.
3. Confirm search and related posts work.
4. Confirm no jQuery requests or `$()` runtime dependency.
5. Run PageSpeed mobile twice after CDN cache warm-up and inspect LCP element, render-blocking resources, unused JS/CSS, third-party main-thread time, and CLS sources before further tuning.
