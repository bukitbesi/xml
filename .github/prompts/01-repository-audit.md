# Prompt 01 — Read-Only Enterprise Repository Audit

Read `AGENTS.md` and `.github/copilot-instructions.md` first.

Perform a complete read-only audit of `bukitbesi/xml`. Do not modify `asset/tbb.xml`, source files, workflows, or configuration during this task.

## Objectives
1. Establish the actual repository state and source of truth.
2. Audit the production Blogger XML and supporting files.
3. Identify verified defects, risks, missing tests, missing documentation, and items requiring live evidence.
4. Produce an ordered remediation plan using small, rollback-safe batches.

## Required inspection
- repository structure, documentation, workflows, scripts, dependencies, and duplicated sources;
- `asset/tbb.xml` XML validity and Blogger v2 compatibility;
- page-type branching for homepage, item/post, static page, label, search, archive, error, layout, preview, and mobile variants;
- title, description, canonical, robots, hreflang, Open Graph, Twitter, and alternate links;
- JSON-LD syntax, page-type selection, entity duplication, and visible-content alignment;
- headings, landmarks, links, breadcrumbs, navigation, pagination, related posts, comments, and search;
- image dimensions, alt behavior, eager/lazy loading, fetch priority, decoding, and likely LCP handling;
- CSS/JS that may cause overflow, blank space, layout shifts, hidden content, inaccessible controls, or runtime errors;
- AdSense loader count, slot markup, push calls, container spacing, sticky behavior, responsive behavior, and CLS risks;
- analytics, verification, consent, security, and privacy integrations;
- Blogger sitemap/robots assumptions and URL classes;
- Cloudflare, live-browser, GSC, Rich Results, PageSpeed, and AdSense items that cannot be proven from source;
- test coverage, CI quality gates, release process, and rollback readiness.

## Evidence rules
Classify every material statement as:
- `VERIFIED` — directly supported by repository evidence;
- `ASSUMPTION` — plausible but not proven;
- `LIVE TEST REQUIRED` — requires deployed Blogger/browser/Cloudflare/AdSense validation;
- `GSC DATA REQUIRED` — requires Search Console export or inspection evidence.

Do not repeat claims from README or prior reports as facts unless verified against current code.

## Deliverables
Create:
- `docs/audits/BLOGGER_ENTERPRISE_SEO_AUDIT.md`
- `docs/audits/LIVE_SITE_VERIFICATION.md`
- `docs/audits/REMEDIATION_ROADMAP.md`

The main audit must contain:
- executive summary;
- repository map and source-of-truth assessment;
- findings table with ID, classification, severity, evidence, affected page types, impact, and recommended action;
- separate sections for Blogger/XML, technical SEO, schema, performance/CWV, accessibility, AdSense/layout, security/privacy, maintainability/testing;
- contradictions between documentation and implementation;
- ranked quick wins, medium changes, and high-risk changes;
- explicit non-findings where common issues were checked but not found.

The live verification document must provide exact Android-friendly checks for homepage, post, static page, label, search, archive, 404, mobile, desktop, logged-out, and consent states.

The roadmap must group fixes into independent PR-sized batches. Do not implement them yet.
