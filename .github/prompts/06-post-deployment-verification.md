# Prompt 06 — Post-Deployment Blogger Verification

Use after an approved XML version is deployed to Blogger. Read the governance and remediation note first.

## Verify representative URLs
- homepage;
- regular post;
- news-labelled post when applicable;
- static page;
- label page;
- search results;
- archive/pagination;
- true 404;
- mobile viewport and desktop viewport;
- URL with `?m=1`;
- logged-out state;
- consent accepted and not-yet-accepted states where relevant.

## Verify behavior
- status and redirect chain;
- final `www` HTTPS URL;
- title, description, canonical, robots, hreflang, OG, Twitter;
- visible H1 and heading hierarchy;
- schema source and duplicate entities;
- header, menu, search, dark mode, pagination, related posts, comments, sharing, breadcrumbs, footer;
- image loading, dimensions, alt text, LCP candidate, lazy loading, and layout shifts;
- manual/auto ads, blank space, overflow, overlap, sticky behavior, and late fill;
- console errors and failed critical requests;
- analytics/verification tags remain present;
- no hidden or inaccessible content.

## External checks
Record results from the tools actually used, such as:
- URL Inspection;
- Rich Results Test;
- Schema Markup Validator;
- PageSpeed Insights;
- Chrome DevTools or equivalent browser checks;
- Cloudflare redirect/cache inspection.

Do not claim a field-data Core Web Vitals improvement immediately after deployment. Distinguish lab results from CrUX field data.

## Deliverable
Create `docs/validation/POST_DEPLOYMENT_VERIFICATION.md` with:
- deployment date and template commit;
- tested URL matrix;
- pass/fail evidence;
- screenshots or copied error details;
- regressions;
- rollback decision;
- GSC validation requests that are now justified;
- monitoring plan.
