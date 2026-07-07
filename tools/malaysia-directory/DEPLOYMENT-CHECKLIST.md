# Pejabat Pos Selangor — Blogger Deployment Checklist

## VERIFIED BEFORE DEPLOYMENT

- [ ] Every record shown publicly is `verified` or `partial`.
- [ ] `verified` records contain address, phone, hours, official source and `lastVerified`.
- [ ] `partial` records contain at least a verified address and official source.
- [ ] `pending` records are hidden from production output.
- [ ] Visible article facts match the JSON dataset.
- [ ] Generated ItemList/Place schema contains only locations visible on the page.

## BUILD AND VALIDATE

```bash
python tools/malaysia-directory/scripts/validate_dataset.py
python tools/malaysia-directory/scripts/build_schema.py
python -m json.tool tools/malaysia-directory/generated/pejabat-pos-selangor.schema.json > /dev/null
```

## BLOGGER MANUAL STEPS

1. Back up the current post HTML.
2. Replace the article body with `templates/pejabat-pos-selangor-blogger.html`.
3. Insert the directory markup from `templates/blogger-embed.html` at the marked position.
4. Add the generated JSON-LD in a `<script type="application/ld+json">` block only after confirming it matches visible locations.
5. Preview on Android and desktop before publishing.
6. Test search, district filter, reset, copy address, phone, maps and official-source links.
7. Confirm no menu, related-post, thumbnail, AdSense or layout regression.

## LIVE TEST REQUIRED

- [ ] Page loads without console errors.
- [ ] jsDelivr CSS, JS and JSON return HTTP 200.
- [ ] No pending location appears publicly.
- [ ] Google Rich Results Test reports valid syntax; rich-result eligibility is not guaranteed.
- [ ] Schema Markup Validator shows ItemList/Place relationships correctly.
- [ ] URL Inspection confirms the canonical page is accessible to Google.

## ROLLBACK

Restore the previous Blogger post HTML. No `asset/tbb.xml` modification is required for this directory deployment.
