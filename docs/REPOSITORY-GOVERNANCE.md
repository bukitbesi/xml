# Repository Governance

## Production source

`asset/tbb.xml` is the authoritative production Blogger template for `https://www.thebukitbesi.com/`.

Files under `asset/src/` are currently placeholders and are not synchronized production sources. The `wp-theme/` and `tools/` subtrees are separate from the Blogger production template.

## Change policy

- Never commit production changes directly to `main`.
- Use one feature branch and one draft pull request per remediation batch.
- Keep production XML changes minimal and reviewable.
- Preserve Blogger tags, widget IDs, sections, layout-editor compatibility, AdSense, analytics, verification markers, branding, and working page-type behavior.
- Back up the deployed Blogger theme before every production release.
- Do not claim ranking, indexing, rich-result, Core Web Vitals, or ad-fill outcomes without live evidence.

## Evidence classes

Every audit or remediation report must label material statements as:

- `VERIFIED` — supported by repository evidence;
- `ASSUMPTION` — plausible but not proven;
- `LIVE TEST REQUIRED` — requires deployed Blogger, browser, Cloudflare, or AdSense evidence;
- `GSC DATA REQUIRED` — requires Google Search Console evidence.

## Audit lifecycle

Documents under `docs/audits/` are dated snapshots. They must be revalidated against the current commit and live site before implementation.

## Recommended remediation sequence

1. Documentation truth alignment.
2. Read-only validation automation.
3. GSC-supported robots and indexing policy.
4. External integration hygiene.
5. Canonical and mobile URL verification.
6. Ad-layout and whitespace optimization.
7. Front-end dependency minimization.

Medium- and high-risk changes must remain separate from documentation and automation work.
