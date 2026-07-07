# Official Source Access Status

## VERIFIED

- The production dataset remains `draft`.
- All current seed records remain `pending`.
- The public renderer hides `pending` records by default.

## LIVE TEST REQUIRED

- Pos Malaysia outlet details must be checked manually in a normal browser session.
- Automated fetches to the Pos Malaysia homepage returned HTTP 403 on 2026-07-07.
- Search-engine queries on 2026-07-07 did not expose reliable first-party branch detail pages for the current seed records.

## DATA ENTRY RULE

Do not promote a record or add address, phone, postcode, business hours or services unless the exact detail is visible on an official or first-party source. Record the direct source URL and the date checked.

## NEXT MANUAL ACTION

Open the Pos Malaysia outlet locator in a normal browser, search each seed branch, and fill `VERIFICATION-WORKSHEET.md`. After review, update the JSON dataset in a separate PR and run both validator and schema builder.
