# Google Search Console Diagnosis — 2026-07-06

## Inputs reviewed

- Coverage export dated 2026-07-06
- Performance export for the last 3 months
- Core Web Vitals exports for mobile
- User screenshots for redirect, duplicate canonical, discovered, crawled, and 4xx categories
- Representative URLs supplied by the site owner

## Executive summary

The dominant exclusion count is not a mass indexing failure. Most excluded URLs are Blogger-generated alternate or redirected URLs, especially `?m=1`, label/search variants, and feed comment endpoints.

Current coverage snapshot:

| Category | URLs | Assessment |
|---|---:|---|
| Indexed | 1,999 | Healthy inventory relative to the site size |
| Not indexed | 2,925 | Requires URL-class separation, not blanket fixing |
| Page with redirect | 2,115 | Mostly expected alternate/mobile URLs; verify redirect targets |
| Discovered — currently not indexed | 476 | Highest actionable content/crawl-priority group |
| Duplicate without user-selected canonical | 230 | Mostly Blogger comment-feed endpoints; likely expected duplicates |
| Crawled — currently not indexed | 97 | Actionable after content-quality and canonical review |
| Excluded by noindex | 6 | Must be checked against intended page classes |
| Blocked due to other 4xx | 1 | Defect: malformed label URL |

Do not press Validate Fix on the large redirect or duplicate groups until their URL classes are confirmed. Expected exclusions do not need to be forced into the index.

## Issue diagnosis

### GSC-001 — Page with redirect: 2,115 URLs

**Classification:** MIXED; predominantly EXPECTED.

Screenshot examples are primarily:

- normal post URLs ending in `?m=1`;
- label/search URLs ending in `?m=1`;
- homepage `/?m=1`;
- search result parameters.

These are Blogger mobile-alternate URLs. They should redirect or normalize to the canonical desktop URL when the final destination is correct, HTTPS, `www`, and returns a single clean redirect chain.

**Action:**

1. Sample at least 20 URLs across posts, labels, homepage, search and archive.
2. Verify each final target is the equivalent canonical URL.
3. Keep these excluded when redirects are intentional.
4. Do not request indexing for `?m=1` URLs.
5. Review the current `history.replaceState` and `?m=1` hard-redirect logic separately because client-side normalization can affect browser history and analytics.

**Do not validate yet.** This category is not automatically an error.

### GSC-002 — Duplicate without user-selected canonical: 230 URLs

**Classification:** LIKELY EXPECTED.

All visible examples use patterns such as:

`/feeds/{post-id}/comments/default`

These are Blogger comment feed endpoints, not primary content pages. They should not compete with the post URL.

**Action:**

- Confirm these endpoints are not linked as primary content.
- Ensure post canonicals point to the HTML post URL.
- Do not add canonicals to feed responses through unsafe template hacks.
- Do not redirect all feed URLs to the homepage.
- Treat as expected exclusion unless HTML pages appear in this group.

**Do not validate yet.** Export and inspect all URL patterns first.

### GSC-003 — Discovered, currently not indexed: 476 URLs

**Classification:** ACTIONABLE PRIORITY.

Visible examples are old article URLs, many from 2008–2009. `Last crawled: N/A` indicates Google knows the URLs but has not prioritized crawling them.

Likely causes:

- weak internal-link depth;
- old or thin directory-style content;
- low demand or duplicated intent;
- stale information;
- many similar state/branch/location pages;
- insufficient crawl priority relative to the total known URL inventory.

**Action:**

1. Export the full list and classify by topic, year, template and content quality.
2. Identify pages with impressions, backlinks, unique local value or commercial potential.
3. Refresh and strengthen only valuable URLs.
4. Add contextual internal links from relevant hubs and indexed pages.
5. Consolidate overlapping pages where appropriate.
6. Leave low-value obsolete pages out of the priority queue rather than requesting indexing blindly.
7. Submit only representative improved URLs for inspection after deployment.

### GSC-004 — Crawled, currently not indexed: 97 URLs

**Classification:** ACTIONABLE HIGH PRIORITY.

Examples include tool/static pages and ordinary posts. Some appear both with and without `?m=1`, indicating mixed URL classes within the report.

Representative URLs include:

- `/p/html-beautifier-online.html?m=1`
- `/p/robotstxt-generator.html?m=1`
- `/p/html-table-generator.html`
- `/p/remove-characters-from-text.html?m=1`
- `/2022/11/happy-birthday-wishes.html`
- `/2022/12/how-to-save-money-as-student.html`
- `/p/parser-unparser.html`

**Action:**

- Separate canonical HTML URLs from `?m=1` alternates.
- Audit each canonical page for unique value, visible content, title/H1 alignment, description, internal links, rendered tool functionality, and duplication.
- Improve tool pages with useful introductions, instructions, examples, FAQs and visible supporting content.
- Add appropriate `WebApplication` or `SoftwareApplication` schema only when the visible tool and properties support it.
- Refresh thin or outdated posts before requesting indexing.
- Do not request indexing for mobile alternate URLs.

### GSC-005 — Blocked due to other 4xx: 1 URL

**Classification:** VERIFIED DEFECT.

Malformed URL:

`https://www.thebukitbesi.com/search/label/${t[r]}`

This is a literal JavaScript/template placeholder leaking into a generated link.

**Action:**

- Search the template JavaScript for `${t[r]}` and related label URL construction.
- Correct the generation logic in a dedicated production PR.
- Verify no other unresolved template literals are emitted.
- After deployment, test the affected feature and then request validation.

### GSC-006 — Excluded by noindex: 6 URLs

**Classification:** REQUIRES URL LIST.

The template intentionally noindexes selected label, archive, empty-search and error classes. This may be correct.

**Action:**

- Export the six URLs.
- Compare them against the documented URL-class policy.
- Remove noindex only when a page class has unique search value and is intentionally maintained.
- Do not index empty search or error pages.

## Representative URL triage

### `/p/parser-unparser.html`

Current category: crawled, currently not indexed.

Priority actions:

- verify the tool renders and works without console errors;
- add a focused introduction, use cases, instructions, examples, privacy note and FAQ;
- ensure one canonical, one H1 and a unique title/description;
- add internal links from the tools hub and relevant articles;
- use tool schema only when all required visible fields are available.

### HTTP office article URL

`http://www.thebukitbesi.com/2021/08/pejabat-kesihatan-daerah-kuala-lumpur.html`

Priority actions:

- verify HTTP redirects once to the exact HTTPS `www` equivalent;
- ensure no chain through non-www or `?m=1`;
- update internal links to HTTPS canonical URLs.

### `/2022/02/pejabat-pos-selangor.html`

The performance export shows 197 impressions, average position about 3.02 and zero clicks in the last three months. This is a major CTR/content-refresh opportunity.

Priority actions:

- verify title and snippet match the actual search intent;
- update addresses, operating hours, contact methods and official-source references;
- add a clear updated date and change log;
- improve title/meta description for branch-location intent;
- ensure no misleading or stale details;
- add internal links to related postal and courier pages.

## Performance diagnosis — last 3 months

- Clicks: 83
- Impressions: 21,235
- Overall CTR: approximately 0.39%
- Mobile: 63 clicks from 6,240 impressions, CTR 1.01%
- Desktop: 19 clicks from 14,968 impressions, CTR 0.13%
- Malaysia: 80 clicks from 10,565 impressions, CTR 0.76%

The very low desktop CTR and several high-ranking zero-click pages indicate title/snippet mismatch, stale directory content, SERP feature competition, or impressions from irrelevant markets/queries.

High-opportunity pages include:

- `/2021/03/senarai-cawangan-ar-rahnu-yapeim.html` — 441 impressions, position 5.50, zero clicks
- `/2022/01/pejabat-tanah-kelantan.html` — 371 impressions, position 6.17, zero clicks
- `/2022/06/best-express-selangor.html` — 222 impressions, position 3.71, zero clicks
- `/2022/02/pejabat-pos-selangor.html` — 197 impressions, position 3.02, zero clicks
- `/2021/02/cawangan-jnt-express-perak.html` — 173 impressions, position 5.05, zero clicks

These should be refreshed before creating new overlapping pages.

## Core Web Vitals

The exports show mobile issues for CLS above 0.1 and LCP above 2.5 seconds, but the example tables are empty and daily counts fluctuate to zero. This is insufficient to identify exact URL groups.

**Action:**

- capture the GSC issue detail when example groups repopulate;
- run PageSpeed Insights on representative homepage, post, directory article and tool page;
- inspect ad-slot reservation, late font/layout changes, image dimensions, hero/LCP loading and third-party scripts;
- distinguish lab data from 28-day CrUX field data;
- do not claim resolution from one Lighthouse run.

## Execution order

1. Fix the malformed `${t[r]}` label URL.
2. Add repository validation to detect unresolved template literals and malformed internal URLs.
3. Export and classify all 476 discovered URLs and 97 crawled URLs.
4. Separate `?m=1`, feeds and other expected exclusions from canonical HTML pages.
5. Refresh high-impression zero-click pages.
6. Optimize valuable crawled/discovered tool and article pages.
7. Audit post schema and page-type metadata.
8. Investigate mobile CLS/LCP using representative live pages.
9. Validate fixes only after deployment and URL inspection evidence.

## Validation policy

- Validate the single 4xx defect after the malformed link is fixed and deployed.
- Do not validate expected redirects or feed duplicates merely to clear the report.
- For discovered/crawled groups, validate only after a meaningful batch of representative pages is improved and recrawled.
- Track changes at 7, 14, 28 and 56 days without promising indexing or ranking recovery.
