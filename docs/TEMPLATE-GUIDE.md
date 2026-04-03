# TBB Template — Configuration & Troubleshooting Guide

---

## Table of Contents

1. [Installing the Template](#installing)
2. [Customiser Variables](#customiser-variables)
3. [AdSense Setup](#adsense-setup)
4. [Search Configuration](#search-configuration)
5. [Schema / JSON-LD](#schema--json-ld)
6. [Dark Mode](#dark-mode)
7. [Navigation / Mega Menu](#navigation--mega-menu)
8. [Widget Sections Reference](#widget-sections-reference)
9. [Common Errors & Fixes](#common-errors--fixes)
10. [SEO Verification Checklist](#seo-verification-checklist)

---

## Installing

1. Open **Blogger Dashboard → Theme → three-dot menu → Edit HTML**
2. Select all (`Ctrl+A`) and delete
3. Paste the full content of `asset/tbb.xml`
4. Click **Save theme**
5. Go to **Theme → Customise** to configure colours and options

> Always back up your current theme before replacing it.

---

## Customiser Variables

### Fonts
Change font families in the Blogger Customiser under **Fonts**:
- Main font: `Inter` (default)
- RTL font: `Cairo` (auto-applied when blog language is RTL)

### Layout Toggle Variables
These use `0px` / `1px` as boolean switches (Blogger limitation):

| Variable | `0px` = Off | `1px` = On |
|---|---|---|
| `boxedMode` | Full-width | Boxed container |
| `stickyMenu` | Static header | Sticky header |
| `stickySidebar` | Static sidebar | Sticky sidebar |
| `gridStyle` | List view | Grid view |
| `postSummary` | No excerpt | Show excerpt |
| `postCategory` | No category tag | Show category tag |
| `breadcrumb` | No breadcrumbs | Show breadcrumbs |
| `postnav` | No prev/next links | Show prev/next |
| `postSidebar` | No sidebar on posts | Sidebar on posts |
| `pageSidebar` | No sidebar on pages | Sidebar on pages |
| `pageHeaderAds` | No ads on pages | Header ads on pages |
| `pageFooterAds` | No footer ads on pages | Footer ads on pages |
| `darkMode` | Light only | System dark mode |
| `userDarkMode` | No toggle button | Show toggle button |

---

## AdSense Setup

### Loading the script
The AdSense JS is loaded conditionally:
```xml
<b:if cond='data:widgets.AdSense.first or data:blog.adsenseClientId'>
  <script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX'/>
</b:if>
```
It only loads if an AdSense widget or a connected AdSense account exists.

### Ad unit placement map

| Widget section ID | Placement | Format |
|---|---|---|
| `featured-ads` | Below featured posts | `auto` responsive |
| `content-section` (HTML4) | In content blocks | `auto` responsive |
| `post-ads-1` | Before post body | `auto` responsive |
| `post-ads-2` | After post body | `auto` responsive |
| `post-ads-3` | In-article (mid-post) | `fluid` in-article |
| `post-ads-4` | Below related posts | `auto` responsive |
| `content-section-2` (HTML17) | Homepage matched content | `autorelaxed` |
| `content-section-2` (HTML16) | Homepage content block 2 | `auto` |
| `footer-ads` | Site footer | `auto` responsive |

### Each `<ins>` must have its own `push({})` call
Every ad unit inside a `<b:widget-setting name='content'>` CDATA block must be followed by:
```html
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```
Without this, the ad unit will not render.

### Unfilled ad hiding
The template hides unfilled ad slots automatically:
```css
ins.adsbygoogle[data-ad-status="unfilled"] { display: none !important; }
```

---

## Search Configuration

### How search works
The template uses two search mechanisms:

1. **Blogger native search** (`/search?q=term`) — the `BlogSearch` widget links to this
2. **AJAX overlay search** — the floating search bar (triggered by the magnifier icon) fetches posts via the Blogger JSON feed API

### Search overlay requirements
The AJAX search reads post data from `pbt-feeds` includable (line 1805 in tbb.xml). It requires:
- Blog widget is present in section `main`
- The overlay `<div class='main-search'>` is rendered (inside `pbt-head` include)
- The `pbt.js` script at the bottom of the template runs without errors

### If overlay search shows no results
1. Check browser console for JS errors
2. Ensure there are published posts
3. Verify the blog feed is not disabled: **Settings → Other → Allow Blog Feed → Full**

---

## Schema / JSON-LD

### Page type → Schema type mapping

| Page | Schema types output |
|---|---|
| Homepage | `WebSite` + `Organization` |
| Regular post | `BlogPosting` + `BreadcrumbList` |
| Post labelled "News" | `NewsArticle` + `BreadcrumbList` |
| Static page | `WebPage` + `BreadcrumbList` |
| Label/archive | `CollectionPage` |
| Search results | `SearchResultsPage` |
| Search (no query) | `WebPage` |
| Error 404 | `WebPage` |

### SearchAction (Sitelinks search box)
The `WebSite` schema on the homepage includes a `SearchAction` pointing to:
```
https://www.thebukitbesi.com/search?q={search_term_string}
```
Google may show a search box directly in search results for this site.

### Validate
Run the live URL through:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org/)

---

## Dark Mode

The template supports two dark mode modes:

- **Native** (`darkMode = 1px`) — follows `prefers-color-scheme: dark` (OS-level)
- **User toggle** (`userDarkMode = 1px`) — shows a sun/moon button in the header

The user's choice is saved to `localStorage` key `is-dark`. The `.is-dark` class is applied to `<body>` to activate dark CSS variables.

---

## Navigation / Mega Menu

### Standard dropdown
```html
<li><a href="#">Parent</a>
  <ul>
    <li><a href="/category">Child</a></li>
  </ul>
</li>
```

### Mega menu
Add class `mega` to the parent `<li>` to enable the wide mega-menu panel:
```html
<li class="mega"><a href="#">Parent</a>
  <ul>
    <li><a href="#">Item 1</a></li>
    ...
  </ul>
</li>
```

Configure via **Layout → Edit** on the `main-menu` LinkList widget.

---

## Widget Sections Reference

| Section ID | Name | Notes |
|---|---|---|
| `pbt-panel` | Theme Options | Hidden helper widgets |
| `featured` | Featured Posts | Homepage hero section |
| `featured-ads` | Featured ADS | Below featured (homepage) |
| `content-section` | Content Blocks | Homepage content grid |
| `main` | Latest Posts | Blog1 widget (core) |
| `content-section-2` | Content Blocks 2 | More homepage sections |
| `post-ads-1` | Before Content | Post page only |
| `post-ads-2` | After Content | Post page only |
| `post-ads-3` | In-Article | Post page only |
| `related-posts` | Related Posts | Post page only |
| `post-ads-4` | Post Footer ADS | Post/page |
| `sidebar` | Sidebar | Main sidebar |
| `footer` | Footer | 3-column footer |
| `footer-ads` | Footer ADS | Full-width footer ad |
| `cookie` | Cookie Consent | GDPR notice |

---

## Common Errors & Fixes

### "Parse error" when saving template
- Blogger requires valid XML. Check for unescaped `<`, `>`, `&` characters in widget content
- Inside CDATA sections these are fine; outside CDATA use `&lt;`, `&gt;`, `&amp;`

### Ads not showing
1. AdSense account must be approved
2. Each `<ins>` must have its own `push({})` — see [AdSense Setup](#adsense-setup)
3. The AdSense JS must be loaded (`data:blog.adsenseClientId` must be set in Blogger)
4. Check for ad blockers in the browser during testing

### Schema not validating
- Ensure the `b:if` conditions in the JSON-LD block are not nested incorrectly (see fix in CHANGELOG 2.1.1)
- Use the Rich Results Test on the live URL (not the blogger.com preview URL)

### Search overlay not opening
- The magnifier button adds class `search-on` to `<body>` via JS
- Inspect the button element to confirm it has `class="search-toggle"`
- Check browser console for `pbt is not defined` or similar

### Layout broken in Blogger's editor
- Some sections use `!data:view.isLayoutMode` to hide content in layout edit mode — this is intentional
- The theme preview in Layout mode may look different from the live site

### `?m=1` in URLs (mobile redirect)
The template includes a canonical URL fix that uses `history.replaceState` to remove `?m=1` from the URL bar. This does not cause a page reload — it is purely cosmetic for canonical consistency.

---

## SEO Verification Checklist

After installing the template on your Blogger site:

- [ ] Submit sitemap to Google Search Console: `https://www.thebukitbesi.com/sitemap.xml`
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify all domain verification meta tags are present in page source
- [ ] Run homepage through Rich Results Test — expect `WebSite` + `Organization`
- [ ] Run a post through Rich Results Test — expect `BlogPosting` or `NewsArticle`
- [ ] Confirm `og:image` shows correct 1200×630 image
- [ ] Confirm `twitter:card` is `summary_large_image`
- [ ] Test search box on homepage in Google by searching `site:thebukitbesi.com`
- [ ] Check Google Analytics real-time report while loading the site
- [ ] Check Clarity recordings are appearing in the dashboard
