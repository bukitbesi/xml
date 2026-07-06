# Remediation Roadmap (PR-Sized Batches)

Scope: roadmap only, no production template edits in this task.

## Batch 1 — Documentation truth alignment (low risk)

**Goal:** eliminate repo-state contradictions before code changes.

- Update README source-of-truth language to reflect that `asset/tbb.xml` is authoritative.
- Correct verification token/documented values that mismatch implementation.
- Document status/purpose of `wp-theme/` subtree (active vs archival/reference).
- Add explicit statement that prior audits are historical and must be revalidated.

**Validation:** markdown review + link/path checks.  
**Rollback:** revert docs-only commit.

---

## Batch 2 — Audit automation baseline (low/medium risk)

**Goal:** add non-invasive quality gate without changing template behavior.

- Introduce CI checks for XML well-formedness and basic static assertions (canonical exists, JSON-LD block exists, Ads script count).
- Add artifact upload of validation outputs for reviewer evidence.
- Keep checks read-only and fail-fast on malformed template edits.

**Validation:** run workflow on feature branch and confirm pass/fail behavior.  
**Rollback:** revert workflow/check scripts.

---

## Batch 3 — Robots/indexing policy hardening (medium risk)

**Goal:** align robots strategy with actual indexing outcomes.

- Review and adjust noindex classes (label/archive/search-empty/error) only after GSC evidence.
- Define explicit URL-class policy document with expected indexing behavior.
- Keep canonical strategy unchanged unless evidence requires adjustment.

**Validation:** staged source review + post-deploy GSC delta tracking.  
**Rollback:** restore prior robots branch conditions in `asset/tbb.xml`.

---

## Batch 4 — Subscription/comment integration hygiene (medium risk)

**Goal:** remove brand/ownership mismatches in external integrations.

- Replace legacy Mailchimp subscribe URL with owned endpoint.
- Confirm Disqus shortname/site mapping and update only if business-confirmed.

**Validation:** live click-through + submission flow checks on mobile/desktop.  
**Rollback:** restore previous widget-setting values.

---

## Batch 5 — Canonical/mobile URL behavior verification and refinement (high risk)

**Goal:** confirm or safely refine `?m=1` and canonical URL normalization behavior.

- Validate current redirect/replaceState logic against Android and desktop back-button flows.
- Evaluate analytics/crawl side effects before any logic change.
- If changed, use smallest conditional patch with explicit guardrails.

**Validation:** full URL-class browser matrix + crawl/canonical evidence.  
**Rollback:** revert JS normalization block to previous known-good state.

---

## Batch 6 — Ad layout stability optimization (high risk)

**Goal:** reduce whitespace/CLS issues without breaking ad serving.

- Audit per-slot spacing and reserve-height rules under fill/unfill states.
- Refine ad container sizing/fallback behavior conservatively.
- Preserve one loader and intentional push behavior.

**Validation:** homepage/post/static/mobile/desktop/logged-out/consent test matrix with screenshots and CLS traces.  
**Rollback:** revert ad CSS/widget-slot changes as one batch.

---

## Batch 7 — Front-end dependency minimization (high risk)

**Goal:** evaluate safe removal or deferral of global jQuery dependency.

- Inventory runtime features depending on jQuery.
- Replace with equivalent vanilla logic only where fully testable.
- Remove jQuery include only after parity confirmation.

**Validation:** interaction regression matrix (menu/search/modal/share/pagination/comments).  
**Rollback:** restore original script include and dependent handlers.

---

## External evidence prerequisites before medium/high-risk batches

- **LIVE TEST REQUIRED:** Blogger production rendering, Cloudflare redirect/cache behavior, ad fill/no-fill state behavior, runtime interaction checks.
- **GSC DATA REQUIRED:** URL-class coverage, canonical selection, excluded reasons, enhancement eligibility, and trend deltas after deployment.

