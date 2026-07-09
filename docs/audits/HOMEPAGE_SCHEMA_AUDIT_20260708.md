# Homepage Schema Audit — https://www.thebukitbesi.com/

Date: 2026-07-08
Scope: `asset/tbb.xml` on `main`, homepage-oriented structured data and rich-result interpretation.

## VERIFIED

- The current Blogger baseline in `asset/tbb.xml` is the authoritative template for the site.
- The homepage head currently renders standard SEO tags: title, meta description, canonical, Open Graph and Twitter metadata.
- The homepage Open Graph type is correctly set to `website` when `data:view.isHomepage` is true.
- The template already emits a homepage JSON-LD `@graph` under `data:view.isHomepage` (`asset/tbb.xml:2891–2933`) containing `WebSite` and `Organization` entities plus a `SearchAction` with a `/search?q=` URL template.
- Rich Results Test can report `No items detected` on a homepage even when normal SEO metadata exists, because `WebSite`, `Organization`, and `WebPage` do not always produce rich-result item cards.

## ASSUMPTION

- The homepage `No items detected` screenshot is not necessarily an indexing or ranking failure.
- A conservative homepage JSON-LD graph may improve machine readability, but it will not guarantee a Rich Results Test item or Google rich result.

## LIVE TEST REQUIRED

After any future schema change, test:

1. Google Rich Results Test for one article URL, not only the homepage.
2. Schema Markup Validator for the homepage.
3. Browser rendered source to confirm Blogger outputs valid JSON-LD.
4. Search Console URL Inspection after deployment.

## GSC DATA REQUIRED

- Confirm whether homepage is indexed.
- Confirm whether Search Console reports structured-data errors or only Rich Results Test `No items detected`.
- Confirm whether article pages show valid Article / BlogPosting enhancement data.

## SAFE RECOMMENDATION

Do not add unsupported schema just to force the Rich Results Test to show an item. Avoid `FAQPage`, `HowTo`, `Review`, `AggregateRating`, `LocalBusiness`, address, phone, business hours, or directory facts on the homepage unless those facts are visible and verified.

A safe future remediation batch may add one compact homepage-only JSON-LD graph:

- `WebSite`
- `WebPage`
- `Organization` or `OnlineBusiness` with only verified visible facts
- `SearchAction` (already present; verify that the `/search?q=` URL template returns valid results)

## NEXT PROPOSED BATCH

Create a minimal PR that adds homepage-only JSON-LD without changing widgets, AdSense, analytics, verification tags, Blogger IDs, comments, or layout.
