#!/usr/bin/env python3
"""Write the post URLs in docs/prune/noindex.txt into the TBB-NOINDEX block of asset/tbb.xml.

Usage: python3 tools/build-noindex.py   (run from the repo root, then paste asset/tbb.xml into Blogger)
One canonical post URL per line; blank lines and lines starting with # are ignored.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIST = ROOT / "docs/prune/noindex.txt"
XML = ROOT / "asset/tbb.xml"
URL = re.compile(r"^https://www\.thebukitbesi\.com/\d{4}/\d{2}/[a-z0-9-]+\.html$")

urls = []
for n, line in enumerate(LIST.read_text().splitlines(), 1):
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    if not URL.match(line):
        sys.exit(f"{LIST}:{n}: not a canonical post URL: {line}")
    urls.append(line)
urls = sorted(set(urls))

items = ",".join(f"&quot;{u}&quot;" for u in urls)
block = re.compile(r"(<!-- TBB-NOINDEX:BEGIN[^\n]*-->\n<b:elseif cond='data:view\.isPost and \(data:blog\.canonicalUrl in \[)[^\]]*(\]\)'/>)")
xml = XML.read_text()
xml, count = block.subn(lambda m: m.group(1) + items + m.group(2), xml)
if count != 1:
    sys.exit("TBB-NOINDEX block not found exactly once in asset/tbb.xml")
XML.write_text(xml)
print(f"{len(urls)} URLs written to the noindex block")
