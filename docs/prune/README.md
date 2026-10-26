# Content prune plan — October 2026

Built after the 16–17 Aug 2026 drop: impressions fell from ~4,000/day to ~100/day while ~1,900 pages stayed indexed. There was no manual action, so this is treated as a sitewide algorithmic quality/spam demotion.

Inputs: GSC Performance export (last 3 months, top 1,000 pages), GSC Pages report and the live sitemap (1,610 posts).
Note: the GSC export stops at 8 impressions, so "0 impressions" here means fewer than 8 in 3 months.

## Files
- `prune-plan-2026-10.csv`: every post with an action, its 3-month GSC metrics and the reason.
- `noindex.txt`: posts the theme marks `noindex, follow`. Edit it, run `python3 tools/build-noindex.py`, then paste `asset/tbb.xml` into Blogger.

## Actions
| Action | Posts | What to do |
|---|---|---|
| NOINDEX | 650 | Handled by the theme. Nothing to do per post. Rows marked "candidate to delete later" are dated or news posts. |
| UPGRADE | 119 | Work through them by impressions: re-check every address and phone number against the official locator, add a visible "Disemak pada: <date>" line and the source link, remove closed outlets, then update the post. |
| 301 MERGE | 2 | Copy any unique facts into the target post, revert the old post to draft, then add a permanent redirect under Settings → Errors and redirects → Custom redirects. |
| KEEP / KEEP (watch) | 838 | No change. Look at "watch" posts again in 3 months. |

Posts labelled "Bukit Besi" stay indexed whatever their traffic, because they are original local content.

## Rollback
Remove a URL from `noindex.txt` and rebuild, or empty the file to undo everything. Google re-indexes a post on its next crawl.

## Measure
In GSC → Pages, "Excluded by 'noindex' tag" should climb to about 650 over 2–6 weeks. Recovery normally lands at the next core or spam update after that.
