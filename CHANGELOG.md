# Changelog

All notable changes to the TBB Blogger template are documented here.

Format: `[version] YYYY-MM-DD`

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
