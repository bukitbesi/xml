# Prompt 05 — Pre-Merge Validation Gate

Review the complete pull-request diff against `main`. Read the governance files first.

## Block merge when any applies
- production XML is not well formed;
- unrelated whole-file formatting churn exists;
- Blogger tags, conditions, widgets, sections, CDATA, or layout mode behavior are damaged;
- protected IDs or integrations were removed or duplicated;
- canonical, robots, title, description, OG, Twitter, hreflang, breadcrumb, or schema signals conflict;
- a schema entity is duplicated, fabricated, or not supported by visible content;
- essential navigation depends only on JavaScript;
- likely LCP media was newly lazy-loaded;
- image dimensions were removed without reason;
- ad markup is malformed, AdSense is loaded twice, or a whitespace fix creates likely CLS/policy risk;
- tests are claimed without evidence;
- live-only assumptions are presented as verified;
- rollback instructions are missing.

## Required review
- compare changed files and line-level diff;
- map changes to approved finding IDs;
- run all available XML, JS, JSON-LD, duplicate-marker, and repository checks;
- inspect responsive CSS and page-type conditions;
- confirm source/reference synchronization;
- confirm no secrets or private GSC exports were committed;
- confirm documentation and live-test checklist are complete.

## Output
Create or update `docs/validation/PR_VALIDATION.md` with:
- PASS, PASS WITH LIVE TESTS, or BLOCK;
- checks and evidence;
- missing evidence;
- exact live tests required before merge;
- exact post-deployment tests;
- rollback command/process.

Do not merge the PR.
