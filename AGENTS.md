# AGENTS.md

These rules apply to every AI coding agent working in this repository.

## Source of truth
- Production Blogger template: `asset/tbb.xml`
- Source references: `asset/src/`
- Canonical site: `https://www.thebukitbesi.com/`
- Default branch: `main`

## Mandatory behavior
- Read `.github/copilot-instructions.md` before working.
- Never push directly to `main`.
- Use a feature branch and draft pull request.
- Audit before editing.
- Do not overwrite working code unnecessarily.
- Do not fabricate Blogger, Google Search Console, Cloudflare, AdSense, schema, or browser behavior.
- Label statements as VERIFIED, ASSUMPTION, LIVE TEST REQUIRED, or GSC DATA REQUIRED.
- Keep production XML diffs minimal and reviewable.
- Preserve Blogger tags, widgets, settings, analytics, verification, advertising, branding, and page-type behavior.
- Use vanilla JavaScript only unless the repository already requires otherwise.
- Never claim a ranking, indexing, rich-result, CWV, accessibility, or validation outcome without evidence.

## Audit-only tasks
During audit-only work:
- do not change `asset/tbb.xml`;
- create or update reports under `docs/audits/`;
- record file paths and line references where possible;
- provide prioritized remediation batches rather than a single mass rewrite.

## Implementation tasks
Before changing production:
1. identify the verified defect;
2. identify affected page types;
3. define a smallest safe patch;
4. define automated and live validation;
5. define rollback.

After changing production:
- validate XML well-formedness;
- inspect the diff for unrelated formatting churn;
- validate JavaScript and JSON-LD where tooling permits;
- document what still requires Blogger, browser, Cloudflare, AdSense, GSC, Rich Results Test, or PageSpeed verification.

## Pull request standard
Every PR must contain:
- problem and evidence;
- scope and exclusions;
- files changed;
- tests performed;
- screenshots or live evidence when relevant;
- Blogger deployment checklist;
- rollback instructions;
- unresolved risks.
