# Prompt 02 — Safe Blogger SEO Remediation

Read `AGENTS.md`, `.github/copilot-instructions.md`, and the latest files under `docs/audits/`.

Implement only one approved remediation batch from `docs/audits/REMEDIATION_ROADMAP.md`. Do not combine unrelated fixes.

## Rules
- Confirm the finding is VERIFIED before editing production.
- State the selected finding IDs and affected page types.
- Keep the `asset/tbb.xml` diff minimal. Do not reformat the entire file.
- Preserve Blogger XML syntax, widgets, Layout editor compatibility, branding, analytics, verification, AdSense, and working behavior.
- Do not introduce unsupported schema, redirects, robots rules, canonical logic, dependencies, or third-party scripts.
- Do not use JavaScript to conceal a server/platform SEO defect when a Blogger-native solution exists.
- Do not change Cloudflare, Blogger settings, robots.txt, sitemap submissions, or GSC outside this repository; document exact external actions instead.

## Required validation
Run all repository-available checks relevant to the patch. At minimum:
- XML well-formedness;
- malformed/self-closing non-void tag inspection;
- duplicate critical metadata/schema inspection;
- JSON-LD parse checks when JSON-LD changes;
- JavaScript syntax checks when JS changes;
- diff review for unrelated churn;
- source-reference synchronization assessment for `asset/src/`.

## Required output
Update or create a remediation note under `docs/remediations/` containing:
- finding IDs and evidence;
- root cause;
- files and exact behavior changed;
- tests run and outcome;
- tests not possible in the repo;
- Android-friendly Blogger deployment and live-test steps;
- rollback steps;
- residual risks.

Open a draft pull request. Do not merge it.
