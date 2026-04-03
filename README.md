# The Bukit Besi — Blogger XML Template

> Official Blogger template for [thebukitbesi.com](https://www.thebukitbesi.com/) — Malaysia's digital platform for tutorials, reviews, current issues, daily tips, and local inspiration.

---

## Overview

This repository contains the production Blogger XML template (`asset/tbb.xml`) powering **The Bukit Besi** (`thebukitbesi.com`). The template is built on Blogger's v2 widget framework with custom layout, SEO infrastructure, and AdSense integration.

| | |
|---|---|
| **Platform** | Google Blogger |
| **Template version** | 2.1.0 |
| **Locale** | `ms_MY` (Malaysian) |
| **Responsive** | Yes |
| **Dark mode** | User toggle |
| **RTL support** | Yes (Arabic/Cairo font) |
| **Schema markup** | NewsArticle, BlogPosting, WebSite, Organization, BreadcrumbList |

---

## Features

- **SEO-first** — full JSON-LD structured data per page type, canonical URLs, Open Graph, Twitter Card
- **AdSense ready** — 8 ad placements (header, before/after content, in-article, footer, sidebar)
- **Fast loading** — async scripts, lazy images, deferred non-critical CSS
- **Analytics** — Google Analytics 4 + Microsoft Clarity
- **Search overlay** — AJAX-powered floating search with keyboard (ESC) dismiss
- **Dark mode** — user-toggled, persisted via localStorage
- **Mega menu** — responsive desktop/mobile navigation
- **Related posts** — label-based, 6 per post
- **Ajax pagination** — "Load More" button, no full-page reload
- **Comments** — Blogger native + Disqus (configurable)
- **Breadcrumbs** — visual + schema markup
- **Social links** — Facebook, Twitter/X, Instagram, YouTube
- **Cookie consent** — GDPR-style notice widget
- **Multilingual messages** — EN / MS / AR / ES / PT

---

## Repository Structure

```
xml/
├── asset/
│   ├── tbb.xml          # Main Blogger template (upload to Blogger)
│   └── src/
│       ├── tbb.css      # Source CSS (development reference)
│       └── tbb.js       # Source JS (development reference)
├── docs/
│   └── TEMPLATE-GUIDE.md  # Full configuration guide
├── .github/
│   └── workflows/
│       └── static.yml   # GitHub Pages deployment workflow
├── CHANGELOG.md
├── SECURITY.md
└── README.md
```

---

## Installation

1. Go to **Blogger Dashboard → Theme → Edit HTML**
2. Back up your current theme first
3. Select all existing code and delete it
4. Paste the full contents of `asset/tbb.xml`
5. Click **Save theme**

> Do not upload via "Upload" — paste directly into the HTML editor to preserve Blogger template tags.

---

## Configuration

All settings are configurable inside Blogger's **Theme Customizer** (paintbrush icon). Key variables:

### Layout
| Variable | Default | Description |
|---|---|---|
| `boxedMode` | `0px` | Enable boxed layout |
| `stickyMenu` | `1px` | Sticky header |
| `stickySidebar` | `1px` | Sticky sidebar |
| `gridStyle` | `1px` | Grid post layout |
| `postSummary` | `1px` | Show post excerpts |
| `userDarkMode` | `1px` | Show dark mode toggle |

### Colors
| Variable | Default | Description |
|---|---|---|
| `keycolor` | `#2563eb` | Brand/accent color |
| `title.color` | `#111827` | Post/page title color |
| `text.color` | `#4b5563` | Body text color |
| `footer.bg` | `#111827` | Footer background |

### AdSense
Replace `ca-pub-0182550701431501` with your own publisher ID if forking this template for another site. Ad slots are:

| Placement | Slot ID |
|---|---|
| Billboard (homepage header) | `5591327470` |
| Content blocks (homepage) | `1540172091` |
| Before post content | `1452706728` |
| After post content | `1491623528` |
| In-article | `5005644748` |
| Post footer | `3476140102` |
| Matched content / homepage | `6176154247` |
| Content blocks 2 | `5287845416` |
| Footer | `6102303443` |

---

## Known Issues & Fixes Applied

| # | Issue | Status |
|---|---|---|
| 1 | **JSON-LD double nesting** — outer `b:if isPost AND News` wrapped the entire schema block, preventing homepage, archive, static page, and regular post schemas from rendering | Fixed |
| 2 | **Wrong NewsArticle condition** — `isSingleItem and search.label == "News"` was used instead of `isPost and post.labels any News` | Fixed |
| 3 | **AdSense `<ins>` malformed tags** — several slots used `<ins ... />` (self-closing) or `<ins />\n</ins>` which is invalid HTML | Fixed |
| 4 | **AdSense missing `push({})`** — every `<ins>` block inside widget CDATA lacked its own `(adsbygoogle = window.adsbygoogle || []).push({})` call | Fixed |
| 5 | **Search overlay** — uses Blogger's native `/search?q=` API; ensure Blog widget `commentLabel` is set to `$type={blogger}` and the `pbt-feeds` includable is reachable | Notes in guide |
| 6 | **Layout mode visibility** — some sections are intentionally hidden outside Blogger layout edit mode via `!data:view.isLayoutMode` conditions | By design |

---

## SEO Checklist

- [x] `<title>` tag — dynamic per page type
- [x] `<meta name="description">` — per page
- [x] Canonical URL — set via `<link rel="canonical">` + JS `history.replaceState` for `?m=1` fix
- [x] Open Graph (`og:*`) tags — homepage, post, page
- [x] Twitter Card (`twitter:*`) — `summary_large_image`
- [x] JSON-LD structured data — all page types
- [x] BreadcrumbList schema — posts and pages
- [x] SearchAction schema — homepage sitelinks search box
- [x] Organization schema — homepage
- [x] robots meta — default allow
- [x] `hreflang` — follows Blogger locale (`ms_MY`)
- [x] Image `alt` attributes — enforced in template markup
- [x] Pagespeed — async GA4, async Clarity, deferred fonts

**Verify with:**
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Console](https://search.google.com/search-console)
- [Schema Markup Validator](https://validator.schema.org/)

---

## Analytics & Tracking IDs

| Service | ID |
|---|---|
| Google Analytics 4 | `G-0XL6FW2M0R` |
| Microsoft Clarity | `syxsjt7zf0` |
| Facebook App ID | `966242223397117` |

---

## Verification Tags

| Service | Meta tag |
|---|---|
| Pinterest | `p:domain_verify` — `28851edbaf4d68b4fd39bc8ec2e0b970` |
| Bing Webmaster | `msvalidate.01` — `0532DC52CE53C1BAE8E05CC0DCC7512A` |
| Facebook Domain | `facebook-domain-verification` — `ahdaybbwhsv8eelp8rkqmy8r8ngnb9` |
| Yandex | `yandex-verification` — `31dc76b8d3a1c64` |

---

## Social Media

| Platform | Handle | Followers |
|---|---|---|
| Facebook | [@bukitbesi](https://www.facebook.com/bukitbesi) | 2.5M |
| Twitter/X | [@bukitbesiblog](https://twitter.com/bukitbesiblog) | 278K |
| Instagram | [@bukitbesi](https://instagram.com/bukitbesi) | 92K |
| YouTube | [/bukitbesi](https://www.youtube.com/bukitbesi) | 1.89M |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

&copy; 2026 Bukit Besi Junior
