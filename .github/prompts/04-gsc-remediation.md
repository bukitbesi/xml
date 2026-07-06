# Prompt 04 — Google Search Console Evidence-Based Remediation

Use this prompt only after GSC screenshots or exports are added under a private working context or summarized in an issue. Never commit credentials, private tokens, or unnecessary personal data.

Read the governance files and latest repository audits first.

## Required inputs
For each GSC issue capture:
- exact report name and issue category;
- validation status;
- affected URL count;
- representative URLs;
- first detected and last crawled dates when available;
- Google-selected canonical and user-declared canonical when available;
- crawl allowed, indexing allowed, fetch/render status, referring sitemap, and referring page when available;
- screenshot/export date.

## Method
1. Normalize and group URLs by Blogger URL class: post, static page, homepage, label, search, archive, pagination, feed, comment, `?m=1`, parameter, redirect, soft-404, true 404, or unknown.
2. Reproduce source-level causes where possible.
3. Distinguish expected exclusions from defects.
4. Map each GSC category to repository evidence, Blogger settings, Cloudflare behavior, content quality, internal linking, sitemap, canonical, robots, or live-rendering causes.
5. Do not request validation until the underlying fix is deployed and representative URLs pass inspection.

## Prohibited shortcuts
- no blanket noindex/disallow rules;
- no mass redirects without a URL map;
- no canonicalizing unrelated content to the homepage;
- no sitemap fabrication;
- no repeated indexing requests as a substitute for fixing causes;
- no claim that `Crawled - currently not indexed` has one universal technical fix;
- no deletion of valid URLs solely to reduce report counts.

## Deliverables
Create `docs/gsc/GSC_DIAGNOSIS.md` containing:
- dated input summary;
- issue-by-issue URL classification;
- expected versus actionable exclusions;
- verified root causes and confidence;
- repository fixes, Blogger setting actions, Cloudflare actions, content actions, and GSC actions kept separate;
- prioritized remediation batches;
- deployment, inspection, and validation sequence;
- monitoring checkpoints at 7, 14, 28, and 56 days without promising recovery.

Implement repository changes only through Prompt 02 and a separate draft PR.
