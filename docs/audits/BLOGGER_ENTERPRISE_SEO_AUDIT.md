# Blogger Enterprise SEO Audit — bukitbesi/xml

Date: 2026-07-06  
Repository: `bukitbesi/xml`  
Production source of truth: `/home/runner/work/xml/xml/asset/tbb.xml`

## Executive summary

- **VERIFIED**: The production Blogger template is present at `/home/runner/work/xml/xml/asset/tbb.xml` and includes broad SEO, schema, AdSense, analytics, and page-type logic.
- **VERIFIED**: The repository currently has no automated quality gate for XML/SEO correctness beyond a GitHub Pages deploy workflow (`/.github/workflows/static.yml`).
- **VERIFIED**: `asset/src/tbb.css` and `asset/src/tbb.js` are effectively empty placeholders (1 line each), so the XML file is the only meaningful implementation source.
- **VERIFIED**: Existing docs claim states that cannot be fully proven from repository-only evidence and include at least one value mismatch.
- **LIVE TEST REQUIRED**: Real rendering behavior, CWV outcomes, ad fill behavior, Cloudflare redirect/cache behavior, mobile parity, and browser runtime behavior.
- **GSC DATA REQUIRED**: Index coverage, canonical selection, duplicate clustering, enhancement eligibility, and crawl-budget impact.

## Repository map and source-of-truth assessment

- **VERIFIED**: Production template: `/home/runner/work/xml/xml/asset/tbb.xml`.
- **VERIFIED**: Supporting references advertised in docs at `/home/runner/work/xml/xml/asset/src/tbb.css` and `/home/runner/work/xml/xml/asset/src/tbb.js` are empty placeholders.
- **VERIFIED**: Additional unrelated implementation tree exists: `/home/runner/work/xml/xml/wp-theme/kadence-spotlight-child/*` (WordPress PHP theme code), not Blogger production source.
- **VERIFIED**: Utility web app exists under `/home/runner/work/xml/xml/tools/article-refresh/*`.
- **VERIFIED**: CI workflow only deploys static content to GitHub Pages on `main`; no lint/test/audit workflow exists.

## Findings table

| ID | Classification | Severity | Evidence | Affected page types | Impact | Recommended action |
|---|---|---|---|---|---|---|
| F-001 | VERIFIED | High | `/asset/src/tbb.css` and `/asset/src/tbb.js` are 1-line files (`wc -l`) while `/asset/tbb.xml` holds full CSS/JS | All | No maintainable source split; risky edits and diff churn | Establish authoritative editable sources or remove misleading source references |
| F-002 | VERIFIED | Medium | `README.md` advertises `asset/src/*` as development reference; files are empty | All | Documentation/implementation contradiction | Update docs to reflect current workflow or repopulate source files |
| F-003 | VERIFIED | Medium | `README.md` lists Yandex token `31dc76b8d3a1c64`, but XML has `31dc76b8d3a1ad64` at `tbb.xml:1262` | All | Verification/documentation inconsistency | Confirm correct token and align docs/template |
| F-004 | VERIFIED | Medium | Robots rules noindex label + archive + empty search + error (`tbb.xml:1225-1236`) | Label, archive, empty search, error | Potential intentional deindexing of useful taxonomies/archives | Revalidate intent with traffic/GSC evidence before keeping blanket noindex |
| F-005 | VERIFIED | Low | Canonical tag uses `data:view.url.canonical` (`tbb.xml:1306`) and JS forces URL to canonical (`tbb.xml:3031-3042`) | All | Strong canonical normalization pattern | Keep but verify no edge-case redirect loops in live browsers |
| F-006 | VERIFIED | Medium | `history.replaceState` and hard redirect for `?m=1` (`tbb.xml:3034-3041`) | Mobile variants | Could alter analytics URL patterns and back-button behavior | Validate on Android Chrome with live URLs |
| F-007 | VERIFIED | Low | No hreflang tags found in template head (search for `hreflang` returned none) | All | Limited multilingual annotation | Decide whether explicit hreflang is required for target markets |
| F-008 | VERIFIED | Low | JSON-LD graph includes `SpeakableSpecification` in article schemas (`tbb.xml:2848`, `2912`) | Post | Rich-result eligibility uncertain by content type/language | Validate eligibility assumptions with Rich Results + policy fit |
| F-009 | VERIFIED | Medium | NewsArticle triggered by label equality to `News` (`tbb.xml:2814`) | Post | Label-governed schema type may misclassify content | Review editorial taxonomy and tighten qualification criteria |
| F-010 | VERIFIED | Medium | `rel='sitemap'` points to `/sitemap.xml` (`tbb.xml:1307`) | All | Assumes Blogger sitemap path behavior and consistency | Verify submitted sitemap URLs and response classes live |
| F-011 | VERIFIED | Medium | jQuery loaded from CDN (`tbb.xml:4329`) despite vanilla-JS policy goals in repo instructions | All interactive pages | Extra dependency/perf risk | Evaluate if still required; remove only after behavior parity checks |
| F-012 | VERIFIED | Low | Logo image uses explicit closing `</img>` (`tbb.xml:1399-1401`, `1420-1422`) | Header/footer | XHTML-style tolerable in Blogger but atypical HTML semantics | Keep if Blogger-safe; adjust only with parser validation |
| F-013 | VERIFIED | Medium | Ad layout reserves heights with CSS including `:has()` selector (`tbb.xml:1160-1164`) | Ad-bearing pages | Browser-support variance could affect spacing/CLS behavior | Validate fallback behavior on Android/desktop browsers |
| F-014 | VERIFIED | Medium | Manual ad units are present with push calls and one global push (`tbb.xml:3246-3252 ... 4350`) | Homepage/post/footer | Potential over/under initialization risk if widget toggles differ | Validate ad fill/no-fill states across breakpoints and consent modes |
| F-015 | VERIFIED | Medium | Mailchimp URL still points to `probloggertemplates...list-manage.com` (`tbb.xml:3075`) | Footer subscribe | Brand and ownership mismatch risk | Replace with owned mailing endpoint after business validation |
| F-016 | VERIFIED | Low | Disqus shortname set to `thebukitbesi` (`tbb.xml:3878`) | Post comments | Requires external account alignment | Confirm Disqus property mapping live |
| F-017 | VERIFIED | Medium | No automated XML/schema/SEO tests in CI; only static Pages deploy (`/.github/workflows/static.yml`) | Repo process | Regressions can ship unnoticed | Add non-destructive validation workflow for XML and JSON-LD extraction |
| F-018 | LIVE TEST REQUIRED | High | Cloudflare non-www→www redirect behavior cannot be proven from repo files | All | Canonical host consistency unknown in production | Verify redirect chain/caching at edge with real HTTP traces |
| F-019 | GSC DATA REQUIRED | High | Indexing/canonical outcomes cannot be inferred from code alone | Search/label/archive/post/page | Risk of incorrect deindex/canonical assumptions | Pull GSC coverage, pages, canonical, and enhancement exports |
| F-020 | ASSUMPTION | Medium | WordPress child-theme directory may be archival/parallel and not active production path | Repo governance | Potential confusion over true deployment surface | Document status of `wp-theme/` explicitly in README |

## Blogger/XML compatibility findings

- **VERIFIED**: Blogger namespace and `b:*`, `data:*`, `expr:*` structures are intact (`tbb.xml:3` onward).
- **VERIFIED**: Page-type condition branches exist for homepage, post, page, search variants, archive, and error in metadata and schema (`tbb.xml:1225-1287`, `2752-3022`).
- **VERIFIED**: Layout mode controls and section/widget IDs are preserved extensively (e.g., `tbb.xml:3050+`, `3266+`, `3918+`).
- **VERIFIED**: XML contains inline JS/CSS blocks and CDATA boundaries in critical areas.
- **LIVE TEST REQUIRED**: Full Blogger template save/render validation in production dashboard.

## Technical SEO findings

- **VERIFIED**: Canonical emitted using `data:view.url.canonical` (`tbb.xml:1306`).
- **VERIFIED**: OG/Twitter meta generated centrally in `customOpenGraphMetaData` (`tbb.xml:1174-1222`).
- **VERIFIED**: Robots directives are branch-based with broad noindex classes (`tbb.xml:1225-1236`).
- **VERIFIED**: No explicit hreflang annotations found.
- **LIVE TEST REQUIRED**: Validate final rendered head output for each URL class.
- **GSC DATA REQUIRED**: Determine whether current robots/canonical policy improves or harms indexed URL quality.

## Structured-data findings

- **VERIFIED**: JSON-LD emitted in a single script with explicit page-type branches (`tbb.xml:2751-3022`).
- **VERIFIED**: Includes `NewsArticle`, `BlogPosting`, `WebSite`, `Organization`, `WebPage`, `CollectionPage`, `SearchResultsPage`, and `BreadcrumbList` depending on context.
- **VERIFIED**: News schema predicate depends on label `News` (`tbb.xml:2814`).
- **ASSUMPTION**: Schema intent appears aligned with content model but must be validated against visible rendered content per URL.
- **LIVE TEST REQUIRED**: Rich Results / Schema validator checks on live URLs.

## Performance / CWV findings

- **VERIFIED**: Resource hints and post-image preload/fetchpriority are present (`tbb.xml:1289-1311`).
- **VERIFIED**: jQuery is loaded globally from CDN (`tbb.xml:4329`).
- **VERIFIED**: Ad slot min-height strategy is present; includes `:has()` selector (`tbb.xml:1160-1164`).
- **LIVE TEST REQUIRED**: LCP/INP/CLS outcomes at 75th percentile require field/lab data.

## Accessibility findings

- **VERIFIED**: Landmark elements include header/main/footer/nav in primary layout (`tbb.xml:3113`, `3265`, `4152`, `2216`, `3635`).
- **VERIFIED**: Hidden homepage H1 uses visually-hidden technique, not `display:none` (`tbb.xml:362`, `1403-1405`).
- **VERIFIED**: Multiple controls include aria labels (menu/search/share/comment/back-to-top).
- **LIVE TEST REQUIRED**: Keyboard/focus order, modal trap behavior, and screen-reader UX.

## AdSense and layout findings

- **VERIFIED**: AdSense script loaded conditionally once (`tbb.xml:2744-2746`).
- **VERIFIED**: Manual `<ins class='adsbygoogle'>` blocks include explicit push calls across major slots (`tbb.xml:3246+`, `3286+`, `3922+`, `3934+`, `3951+`, `3974+`, `3990+`, `4000+`, `4137+`).
- **VERIFIED**: CSS hides unfilled ad slots (`tbb.xml:1159`).
- **LIVE TEST REQUIRED**: Real ad fill states, blank space under no-fill/fill transitions, sticky/viewport behavior with consent mode.

## Security and privacy findings

- **VERIFIED**: Public analytics/verification identifiers are embedded in template head (`tbb.xml:16-19`, `22-30`).
- **VERIFIED**: No repository evidence of private credentials committed in audited files.
- **LIVE TEST REQUIRED**: Consent gating behavior for analytics/ads in deployed runtime.

## Maintainability and testing findings

- **VERIFIED**: Single large XML file concentrates CSS/JS/markup logic (`4377` lines).
- **VERIFIED**: No dedicated validation/test tooling or CI gate for template correctness.
- **VERIFIED**: Docs include prior audit assertions not independently proven in this run and some stale values.

## Contradictions between documentation and implementation

1. **VERIFIED**: `README.md` describes `asset/src/tbb.css` and `asset/src/tbb.js` as development references; both are empty placeholders.
2. **VERIFIED**: Yandex verification token mismatch (`README.md` vs `tbb.xml:1262`).
3. **ASSUMPTION**: Some claims in `docs/SEO-AUDIT.md` may reflect prior state; they were not treated as facts without code confirmation.

## Explicit non-findings (checked, not found)

- **VERIFIED**: No duplicate AdSense loader include was found in `tbb.xml`.
- **VERIFIED**: Canonical tag is present (not missing).
- **VERIFIED**: JSON-LD block is present (not absent) and includes branch logic for key page types.
- **VERIFIED**: Homepage H1 is not hidden with `display:none` in current code; it uses visually-hidden CSS.
- **VERIFIED**: Manual ad `<ins>` blocks inspected in widget CDATA are not self-closing malformed tags.

## Ranked remediation priorities

### Quick wins (low risk)
1. Align README token and source-file descriptions with actual implementation.
2. Document authoritative source path and status of `wp-theme/` subtree.
3. Add audit checklist links and evidence conventions into docs.

### Medium changes
1. Reassess robots policy for label/archive/search-empty with GSC evidence.
2. Replace external subscribe endpoint with owned property.
3. Introduce CI validation for XML well-formedness and static checks.

### High-risk changes
1. Any rewrite/removal of canonical normalization JS (`?m=1` handling) without live redirect/crawl evidence.
2. Any ad container spacing/initialization refactor without multi-state ad-fill testing.
3. Any global JS dependency removal (e.g., jQuery) without full behavior regression testing.

## Items requiring external evidence before implementation

- **LIVE TEST REQUIRED**: Blogger save/render validation, mobile/desktop runtime behavior, Cloudflare redirect/cache, ad fill states, consent behavior, browser console/runtime issues.
- **GSC DATA REQUIRED**: Coverage and canonical reports by URL class, enhancement reports, performance queries for impacted templates.

