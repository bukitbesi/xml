#!/usr/bin/env python3
"""Build ItemList/Place JSON-LD only from publishable directory records."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "pejabat-pos-selangor.json"
OUTPUT = ROOT / "generated" / "pejabat-pos-selangor.schema.json"
PAGE_URL = "https://www.thebukitbesi.com/2022/02/pejabat-pos-selangor.html"


def main() -> None:
    payload = json.loads(DATASET.read_text(encoding="utf-8"))
    publishable = [
        item for item in payload.get("items", [])
        if item.get("verificationStatus") in {"verified", "partial"}
        and item.get("name")
        and item.get("address")
    ]

    elements = []
    for position, item in enumerate(publishable, start=1):
        place = {
            "@type": "Place",
            "name": item["name"],
            "address": {
                "@type": "PostalAddress",
                "streetAddress": item["address"],
                "addressLocality": item.get("city", ""),
                "addressRegion": item.get("state", "Selangor"),
                "postalCode": item.get("postcode", ""),
                "addressCountry": "MY"
            }
        }
        if item.get("phone"):
            place["telephone"] = item["phone"]
        if item.get("sourceUrl"):
            place["sameAs"] = item["sourceUrl"]

        elements.append({
            "@type": "ListItem",
            "position": position,
            "item": place
        })

    graph = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": f"{PAGE_URL}#directory",
        "name": "Senarai Pejabat Pos di Selangor",
        "url": PAGE_URL,
        "numberOfItems": len(elements),
        "itemListElement": elements
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Built schema with {len(elements)} publishable locations: {OUTPUT}")


if __name__ == "__main__":
    main()
