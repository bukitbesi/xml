# Enterprise Blogger SEO Engineering Instructions

## Mission
Maintain and improve the production Blogger XML template for `https://www.thebukitbesi.com/` with evidence-based, rollback-safe changes. Optimize crawlability, indexability, structured data, Core Web Vitals, accessibility, security, maintainability, AdSense stability, and organic-search performance without damaging Blogger functionality or the current visual identity.

## Repository facts
- Repository: `bukitbesi/xml`
- Default branch: `main`
- Production template: `asset/tbb.xml`
- Platform: Google Blogger, v2 widget framework
- Locale: `ms_MY`
- Canonical origin: `https://www.thebukitbesi.com/`
- Cloudflare is active and the non-www host must redirect to `www`
- Source references may exist in `asset/src/`

## Non-negotiable workflow
1. Never edit or commit directly to `main`.
2. Start from a dedicated feature branch.
3. Read the repository before proposing changes.
4. Separate findings into VERIFIED, ASSUMPTION, LIVE TEST REQUIRED, and GSC DATA REQUIRED.
5. Do not modify `asset/tbb.xml` during an audit-only task.
6. Implement small, logically isolated patches. Avoid whole-file rewrites.
7. Preserve a usable rollback path and document every production-impacting change.
8. Open a draft pull request. Do not merge automatically.
9. Never claim a test passed unless it was actually executed and its output is available.
10. Never promise rankings, indexing, rich results, or PageSpeed scores.

## Blogger XML safety
- Preserve Blogger namespace declarations, `b:*`, `data:*`, `expr:*`, `b:skin`, `b:template-skin`, `b:section`, `b:widget`, `b:includable`, and `b:include` behavior.
- Do not convert Blogger expressions into ordinary HTML attributes.
- Keep XML well formed. Escape raw ampersands and invalid comparison characters where required.
- Do not self-close HTML elements that require explicit closing tags, especially `script`, `textarea`, `ins`, and non-void custom markup.
- Preserve widget IDs, section IDs, layout-editor compatibility, locked status, and configuration variables unless a change is explicitly justified.
- Do not prettify, minify, or re-indent the entire production XML merely for style.
- Treat CDATA boundaries as security and parsing boundaries. Do not move code across them without validation.
- Confirm that any JavaScript embedded in XML remains valid after XML entity encoding.

## Protected production assets
Do not remove, replace, regenerate, obscure, or duplicate without explicit evidence:
- AdSense publisher and slot IDs
- Google Analytics, Microsoft Clarity, verification tags, and social metadata
- Blogger native widgets and comment systems
- Existing branding, navigation, search, dark mode, related posts, breadcrumbs, pagination, cookie notice, and responsive behavior
- User-visible content, labels, author data, timestamps, and image URLs

## Controlled modernization policy
Preserve the present brand and layout while allowing targeted HTML, CSS, and JavaScript improvements. Every visual or structural change must include:
- reason and expected benefit;
- affected page types and breakpoints;
- regression risk;
- validation method;
- rollback instruction.

## SEO and crawl rules
- Use one canonical URL signal per document. Do not create conflicting canonical tags or JavaScript-only canonical logic.
- Normalize all canonical, Open Graph, Twitter, schema, internal-link, and breadcrumb URLs to the `https://www.thebukitbesi.com/` origin where appropriate.
- Do not block crawlable URLs merely to hide duplicate-content symptoms. Diagnose parameters, canonicals, redirects, internal links, pagination, archive behavior, and Blogger mobile variants first.
- Do not use `noindex`, `nofollow`, robots.txt disallow rules, redirects, or canonical changes without documenting the exact URL class and expected consequence.
- Preserve access to CSS, JavaScript, images, feeds, and resources required for rendering.
- Treat Blogger search, label, archive, pagination, feed, comment, preview, and `?m=1` URL classes separately.
- Do not fabricate sitemap capabilities. Validate Blogger-generated sitemap behavior and submitted sitemap URLs.
- Internal links must be crawlable anchors with meaningful text. Avoid JavaScript-only navigation for essential paths.
- Titles, descriptions, H1s, breadcrumbs, Open Graph, and schema must agree with the visible page and page type.

## Structured-data rules
- Prefer JSON-LD when Blogger-safe.
- Emit only schemas supported by visible page content.
- Prevent duplicate `Article`, `BlogPosting`, `NewsArticle`, `BreadcrumbList`, `FAQPage`, `HowTo`, `WebSite`, `Organization`, `VideoObject`, `Product`, or `Review` entities.
- Select `NewsArticle` only when the content and publishing context genuinely qualify; otherwise use the appropriate article type.
- Do not invent ratings, prices, availability, authors, dates, logos, addresses, FAQs, steps, images, or identifiers.
- Use ISO-8601 dates and absolute URLs.
- Ensure publisher, author, logo, image, headline, mainEntityOfPage, datePublished, and dateModified values are internally consistent.
- FAQ and HowTo schema must match visible, user-accessible content exactly.
- Validate syntax separately from Google rich-result eligibility.

## AdSense and whitespace policy
- Preserve all valid manual and auto-ad integration unless a verified defect requires change.
- Never hide ads, collapse occupied ad containers after fill, overlay content, force clicks, refresh ads, or manipulate viewability.
- Diagnose blank space by distinguishing reserved ad space, unfilled inventory, injected auto ads, CSS margins/padding, empty widgets, line breaks, minimum heights, sticky behavior, and responsive breakpoints.
- Prefer stable dimensions or aspect-ratio reservation when it reduces CLS and remains compatible with responsive ads.
- Empty-space cleanup must not cause content jumps when an ad later fills.
- Each manual `<ins class="adsbygoogle">` must use valid opening/closing markup and one intentional push call unless the integration method proves otherwise.
- Avoid loading the AdSense library more than once.
- Document every changed ad placement and test homepage, post, static page, mobile, desktop, logged-out, and consent states.

## Performance requirements
Target improvements, not fabricated scores:
- LCP <= 2.5 s at the 75th percentile
- INP <= 200 ms at the 75th percentile
- CLS <= 0.1 at the 75th percentile

Rules:
- Prioritize the actual LCP resource. Do not lazy-load the likely LCP image.
- Add explicit image dimensions or aspect ratio where possible.
- Lazy-load only below-the-fold media.
- Avoid render-blocking third-party additions.
- Use vanilla JavaScript. Do not add jQuery, frontend frameworks, icon libraries, or build dependencies without a demonstrated need.
- Keep event handlers passive where appropriate and avoid repeated DOM scans.
- Preserve progressive enhancement and essential navigation when JavaScript fails.
- Do not defer or async scripts blindly when execution order matters.

## Accessibility and semantic HTML
- Maintain a logical heading hierarchy with one primary page H1 unless the page architecture proves otherwise.
- Preserve keyboard access, visible focus, form labels, button semantics, accessible names, alt text, language direction, contrast, and reduced-motion preferences.
- Do not use empty anchors or clickable `div` elements for controls.
- Decorative images should use an appropriate empty alt; informative images need meaningful alt text.

## Security and privacy
- Do not commit secrets, credentials, private exports, API keys, service-account files, GSC authentication data, or personal data.
- Avoid `eval`, dynamic script construction, unsafe HTML injection, and untrusted URL execution.
- Preserve consent and privacy behavior for analytics and advertising.
- Flag third-party script risks rather than silently replacing them.

## Required audit coverage
Audit at minimum:
- repository structure and source-of-truth files;
- XML validity and Blogger compatibility;
- page-type conditions;
- titles, descriptions, canonicals, robots directives, hreflang, OG, Twitter;
- schemas and duplicate entities;
- heading hierarchy and semantic landmarks;
- internal navigation and pagination;
- image attributes, lazy loading, dimensions, and LCP handling;
- JavaScript errors and render dependencies;
- CSS causing overflow, hidden content, whitespace, CLS, or inaccessible states;
- AdSense markup, duplicate library loads, slot initialization, and layout stability;
- analytics and verification preservation;
- robots.txt and sitemap assumptions;
- Cloudflare redirect and cache items requiring live verification;
- GSC categories requiring exported data;
- tests, workflows, documentation, and rollback readiness.

## Required implementation output
For every implementation task provide:
1. concise verified findings;
2. files changed;
3. exact behavioral changes;
4. tests run and raw outcome summary;
5. items not testable in the repository;
6. Blogger live-test checklist;
7. Cloudflare/GSC follow-up checklist when applicable;
8. rollback procedure;
9. remaining risks.

## Stop conditions
Stop and report instead of guessing when:
- the production source of truth is unclear;
- required GSC, Cloudflare, Blogger, AdSense, or browser evidence is unavailable;
- a change would remove or regenerate large portions of working code;
- a proposed fix conflicts with Blogger syntax or an existing integration;
- a schema value cannot be derived from visible content;
- a redirect, canonical, robots, or cache change cannot be verified safely.
