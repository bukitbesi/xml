# Prompt 03 — AdSense, Blank Space, and CLS Audit

Read the repository governance files first. Audit before editing.

Focus on unintended blank space, manual and auto-ad interaction, responsive layout, and Core Web Vitals. Do not treat every empty ad container as a defect.

## Diagnose separately
- intentionally reserved ad space;
- unfilled manual inventory;
- auto-ad insertion;
- duplicate AdSense library loads;
- missing or repeated push calls;
- invalid `<ins>` markup;
- CSS margin, padding, gap, min-height, height, display, visibility, overflow, or pseudo-elements;
- empty Blogger sections/widgets;
- injected line breaks or whitespace nodes;
- sticky/fixed containers;
- desktop/mobile breakpoint differences;
- consent-dependent loading;
- ad blockers and logged-in Blogger behavior;
- layout shifts caused when ads fill late.

## Safety rules
- Preserve publisher and slot IDs.
- Do not hide, overlay, auto-refresh, force interaction with, or deceptively position ads.
- Do not collapse a container in a way that causes a large shift after an ad fills.
- Do not remove a placement solely because it is unfilled in one test.
- Do not load the AdSense library more than once.
- Keep every manual ad block valid and intentionally initialized.

## Deliverables
Create `docs/audits/ADSENSE_LAYOUT_AUDIT.md` with:
- placement inventory;
- verified markup/CSS/JS findings;
- suspected live-only causes;
- affected page types and breakpoints;
- CLS risk rating;
- smallest safe corrections;
- exact Android live-test matrix;
- screenshots/evidence still required.

Do not edit `asset/tbb.xml` during this audit. Implementation must use Prompt 02 in a separate branch/PR.
