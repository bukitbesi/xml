# Changelog

All notable changes to the TBB Blogger template are documented here.

Format: `[version] YYYY-MM-DD`

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
