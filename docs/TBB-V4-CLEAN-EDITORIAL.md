# TBB v4 — Clean Editorial Engine

Reference: current working The Bukit Besi Blogger XML supplied by the site owner. The v4 layer is intentionally progressive: it preserves Blogger-native `Blog1`, post body rendering, widgets and existing Open Graph/article schema while replacing fragile theme-dependent runtime behavior.

## Production assets

- `asset/v4/tbb.v4.css`
- `asset/v4/tbb.v4.core.js`
- `asset/v4/tbb.v4.widgets.js`

Pin all three to commit `d4ba5480955b5f2010f352213cfb9f72f96cc4ec` or a later verified commit containing all assets.

## Core goals

- Zero jQuery.
- Portable article content: normal `<a href>` links remain valid without JavaScript.
- Automatic TOC from H2/H3/H4; legacy `{getToc}` markers are removed/replaced automatically.
- Legacy `{getCard}` supports `$url`/`$link` + `$title` as a temporary migration fallback, but new articles should use ordinary links.
- Native Web Share API plus Copy Link; existing Facebook/X/WhatsApp/email share links remain usable.
- Related posts use the article label first and fall back to recent posts.
- Blogger JSONP feed widgets, live search and load-more remain supported.
- Modern editorial card system, responsive mobile drawer, dark mode and accessibility focus states.
- CWV controls: visible/featured image priority, below-fold loading, `content-visibility`, ad containment and reduced layout shifts.
- Existing canonical/OG/Twitter/BlogPosting/NewsArticle/Breadcrumb schema is retained. Remove duplicate homepage JSON-LD so one canonical schema graph remains.

## Content standard going forward

Preferred internal link markup:

```html
<p class="tbb-related-link"><a href="/YYYY/MM/article.html">Related article title</a></p>
```

Plain links are also valid and must remain readable if all theme JavaScript is disabled.

Do not add new `{getToc}` or `{getCard}` shortcodes to articles.

## Safe integration block

```xml
<link href='https://cdn.jsdelivr.net/gh/bukitbesi/xml@d4ba5480955b5f2010f352213cfb9f72f96cc4ec/asset/v4/tbb.v4.css' id='tbb-v4-ui' rel='stylesheet'/>
<script defer='defer' id='tbb-v4-core' src='https://cdn.jsdelivr.net/gh/bukitbesi/xml@d4ba5480955b5f2010f352213cfb9f72f96cc4ec/asset/v4/tbb.v4.core.js' type='text/javascript'/>
<script defer='defer' id='tbb-v4-widgets' src='https://cdn.jsdelivr.net/gh/bukitbesi/xml@d4ba5480955b5f2010f352213cfb9f72f96cc4ec/asset/v4/tbb.v4.widgets.js' type='text/javascript'/>
```

Remove the previous `tbb.v3.main.css`, `tbb.v3.core.js`, `tbb.v3.dynamic.js`, `tbb.analytics.v3.js`, and standalone `tbb.v3.toc.js` references when the v4 layer is installed.

## Validation gate before live upload

1. Blogger XML parses and saves.
2. Homepage: logo, menu, hero, Terkini, Islamik, latest posts and sidebar render.
3. Single article: post body remains present, auto TOC works, tables scroll, share buttons work, related posts render.
4. Mobile: menu drawer opens/closes and keyboard focus is usable.
5. Search and load more work.
6. Structured-data testing shows one intended article graph and no duplicate homepage graph.
7. Run PageSpeed after functional validation; do not trade content rendering for a synthetic score.
