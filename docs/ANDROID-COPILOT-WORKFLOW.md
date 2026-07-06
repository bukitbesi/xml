# Android + GitHub Chrome Workflow

This repository is designed to be operated safely from an Android phone using GitHub in Chrome.

## One-time setup
The governance files are already stored in:
- `.github/copilot-instructions.md`
- `AGENTS.md`
- `.github/prompts/`

Copilot or another coding agent must read these files before working.

## Safest execution order
1. Run `.github/prompts/01-repository-audit.md` first.
2. Review the generated files under `docs/audits/`.
3. Do not approve production changes until the audit identifies VERIFIED findings.
4. Use `.github/prompts/03-adsense-whitespace-audit.md` for blank-space and advertising analysis.
5. Select one remediation batch and use `.github/prompts/02-safe-remediation.md`.
6. Run `.github/prompts/05-pre-merge-validation.md` on the draft PR.
7. Back up the current Blogger theme before deployment.
8. Deploy the approved `asset/tbb.xml` manually in Blogger.
9. Run `.github/prompts/06-post-deployment-verification.md`.
10. Add GSC evidence later and use `.github/prompts/04-gsc-remediation.md`.

## GitHub mobile rules
- Never choose `Commit directly to the main branch`.
- Use a new branch for every audit or remediation batch.
- Keep the PR as Draft until validation is complete.
- Review the `Files changed` tab before merging.
- Reject a PR that rewrites most of `asset/tbb.xml` without a documented necessity.
- Prefer squash merge after all checks and live tests pass.

## Recommended branch names
- `audit/blogger-enterprise-seo`
- `audit/adsense-layout`
- `fix/seo-<finding-id>`
- `fix/schema-<finding-id>`
- `fix/cwv-<finding-id>`
- `fix/adsense-<finding-id>`

## GSC evidence to collect later
Capture the report name, issue category, affected count, representative URLs, validation state, dates, canonical details, crawl/indexing state, referring sitemap, and screenshots/export date for:
- Page indexing;
- Sitemaps;
- Core Web Vitals;
- HTTPS;
- Crawl stats;
- Enhancements/structured data;
- Manual actions;
- Security issues;
- Performance;
- URL Inspection examples.

Do not commit private authentication data, tokens, or full exports containing unnecessary personal data.

## Blogger deployment checklist
- Download a theme backup.
- Record the source commit SHA.
- Paste only the reviewed production XML.
- Save and immediately test homepage, post, static page, label, search, mobile menu, desktop menu, ads, related posts, comments, and 404.
- Roll back using the backup when a critical regression appears.

## What still requires manual access
AI repository agents cannot independently prove:
- actual Blogger save/parse success;
- live browser rendering on all devices;
- Cloudflare dashboard rules and cache behavior;
- real AdSense fill and policy status;
- GSC ownership reports and URL Inspection;
- CrUX field-data changes;
- final Google indexing or rankings.

Use the generated checklists to provide that evidence rather than asking the agent to guess.
