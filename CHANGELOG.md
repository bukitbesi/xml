# Changelog

All notable changes to the TBB Blogger template are documented here.

Format: `[version] YYYY-MM-DD`

---

## [2.2.1] — 2026-09-07

### Fixed — Widget rendering / thumbnails
- **Below-the-fold `getPosts` widgets (Terkini, Islamik, Direktori, Bantuan Kerajaan, etc.) could render with empty thumbnails** — `loadWidget()` fetches a widget's posts once it nears the viewport (IntersectionObserver, 300px margin), then called `images(target)`, which re-checked visibility with its own, narrower 240px margin. Any timing/scroll mismatch between the two checks left thumbnails permanently queued on an observer that had already fired and would not fire again, so the image never loaded even though the post content was on-screen. `images()` now accepts an `eager` flag; the three call sites that inject content that is already known to be on/near-screen (`loadWidget`, live search results, and “Load more” pagination) pass it so thumbnails render immediately instead of re-entering a second lazy-load queue. Confirmed with a Playwright reproduction (mocked Blogger feed JSON) that failed before the fix and passes after.

### Changed — Runtime rewrite (carried over from the 2.2.x branch)
- Site JS rewritten as a single vanilla-JS runtime (`tbb-runtime-v221`) — no jQuery or other DOM library at any point in this template's history on this branch; verified there are zero jQuery references in the shipped markup or script.
- Feed loading now uses `AbortController`, in-flight request de-duplication, and `IntersectionObserver`-gated fetches for below-the-fold widgets (was a plain `scroll` listener) — reduces homepage network/CPU work prior to LCP.
- Consolidated three previously separate inline `<script>` blocks (YouTube placeholder activation, responsive table wrapping, image alt-text fallback) into the single runtime script — fewer parser-blocking script tags, easier to audit, nothing duplicated.
- Removed the client-side "force canonical URL" `history.replaceState` script — canonical URLs are now purely declarative (`<link rel="canonical">`), which is what search engines expect; rewriting the URL after the fact was unnecessary and could mask real redirect issues.
- Pinned `master-ads-injector.js` to a specific commit SHA instead of `@main`, so the ad script can't change unexpectedly on this template's next Blogger publish.
- Removed a duplicate `<meta name="description">` tag on Page views (`data:blog.metaDescription` was emitted twice).
- Fixed `WebSite`/`WebPage`/`Organization` JSON-LD `@id`/`url` values to use the canonical `www.thebukitbesi.com` host consistently (previously mixed bare-domain and `www` variants, which fragments the `@graph` for structured-data consumers).

### Added — External hosting
- Split the supplemental UI stylesheet and the runtime script out of `asset/tbb.xml` into standalone files ready to host on a CDN once testing is complete: `asset/src/tbb.v2.2.1.css` and `asset/src/tbb.v2.2.1.js`. `asset/tbb.xml` still ships both **inline** (matching `2.2.0`'s approach) so it stays a single paste-and-test file in Blogger; swap the inline `<style id="tbb-ui-v221">` / `<script id="tbb-runtime-v221">` blocks for `<link rel="stylesheet">` / `<script src>` tags pointing at the hosted files (e.g. via jsdelivr from this repo, same pattern already used for `master-ads-injector.js`) when ready to go external.
- Note for future work: the `getPosts` shortcode widgets (Terkini, Islamik, Direktori, etc.) render their post cards entirely client-side via a fetch to Blogger's JSON feed endpoint — the raw server HTML for those sections has no post markup at all. That's fine for browsers and for crawlers that fully execute JS and scroll the page, but it means any crawler or AI/answer-engine fetcher that only reads static HTML (or a single non-scrolled render) sees empty widgets. If AEO/LLM-citation visibility for these specific sections matters, the durable fix is moving them to a server-rendered Blogger widget (e.g. a native label-search or Blog widget) instead of an AJAX shortcode — a larger, separate change from this fix.

---

## [2.1.2] — 2026-04-05

### Fixed — SEO & Meta Tags
- **Duplicate OG/Twitter meta** — `pbt-head` was emitting a full second set of `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` on every post and homepage. Removed duplicate block entirely.
- **Missing `article:` properties** — posts now output `article:published_time`, `article:modified_time`, `article:author`, `article:section`, and all `article:tag` values; required by Facebook News and Google Discover
- **No robots meta tag** — added `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1` for normal pages; `noindex,follow` for 404 and empty search result pages
- **`og:url` wrong variable** — `data:blog.url.canonical` (blog-level) changed to `data:view.url.canonical` (page-level) in `customOpenGraphMetaData`
- **Missing `og:image:width`, `og:image:height`, `og:image:alt`, `og:image:type`** — added to all image-bearing pages
- **Duplicate `theme-color` meta** — hardcoded `#2563eb` static tag removed; dynamic CSS-variable-driven tag retained
- **Deprecated `Content-Type` meta** (`http-equiv="Content-Type"`) replaced with modern `<meta charset="utf-8">`
- **`og:image` aspect ratio** — changed resizeImage second argument from `"630"` to `"16:9"` for correct proportional cropping
- **`twitter:image` fallback** — added `data:blog.postImageUrl` fallback when `data:view.featuredImage` is absent

### Fixed — HTML / Accessibility
- **`expr:ariby` typo** on all 3 contact form inputs changed to `expr:aria-label` (was a non-existent HTML attribute — ARIA was never applied)

### Fixed — CSS
- **`@keyframes darkOff`** was identical to `darkOn` (both 0.25→1 opacity) — dark mode toggle Off animation had no visual effect; fixed to 1→0.25
- **`@keyframes copyOff`** was identical to `copyOn` (both 0→1 opacity) — copy-link confirmation had no fade-out; fixed to 1→0

### Fixed — Performance
- **Bootstrap Icons render-blocking** — changed from synchronous `rel="stylesheet"` to async preload pattern (`rel="preload" as="style" onload="this.rel='stylesheet'"`) with `<noscript>` fallback; eliminates a render-blocking resource on every page
- **Missing preconnect** for `pagead2.googlesyndication.com`, `www.googletagmanager.com`, `www.clarity.ms` — added; reduces connection latency for ads and analytics

### Fixed — Blogger Logic
- **Disqus shortname** was `"probloggertemplates"` (template author's Disqus account) — changed to `"thebukitbesi"` in both declarations

### Added
- `docs/SEO-AUDIT.md` — comprehensive issue registry with severity, fix status, and validation checklist

---

## [2.1.1] — 2026-04-03

### Fixed
- **JSON-LD critical bug** — removed outer `b:if isPost AND News` wrapper that silently suppressed all structured data on homepage, archive, static page, and regular posts
- **NewsArticle condition** — corrected from `isSingleItem and search.label == "News"` to `isPost and post.labels any News`; now correctly applies NewsArticle schema to posts labelled "News"
- **AdSense self-closing `<ins>` tags** — replaced invalid `<ins ... />` and `<ins />\n</ins>` patterns with proper `<ins ...></ins>` on all ad units (post-ads-1, post-ads-3, autorelaxed matched-content)
- **AdSense missing `push({})` calls** — each `<ins>` block inside widget CDATA sections now has its own `(adsbygoogle = window.adsbygoogle || []).push({})` call (was missing on 7 of 9 ad placements)

### Added
- `README.md` — comprehensive project documentation
- `CHANGELOG.md` — this file
- `SECURITY.md` — security policy and responsible disclosure
- `.gitignore` — standard ignores
- `docs/TEMPLATE-GUIDE.md` — full configuration and customisation guide

---

## [2.1.0] — Initial release

### Added
- Full Blogger v2 template with responsive layout
- JSON-LD structured data: BlogPosting, NewsArticle, WebSite, Organization, CollectionPage, SearchResultsPage, WebPage, BreadcrumbList
- Google Analytics 4 (`G-0XL6FW2M0R`)
- Microsoft Clarity (`syxsjt7zf0`)
- AdSense integration — 9 placements
- Dark mode toggle (user preference)
- AJAX search overlay
- Related posts (label-based, 6 items)
- Ajax "Load More" pagination
- Cookie consent widget
- Mega menu navigation
- RTL support (Arabic / Cairo font)
- Disqus comments support
- Mailchimp newsletter integration
