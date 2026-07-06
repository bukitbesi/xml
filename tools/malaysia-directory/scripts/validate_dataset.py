#!/usr/bin/env python3
"""Validate The Bukit Besi directory JSON without network access."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse

DATASET = Path(__file__).resolve().parents[1] / "data" / "pejabat-pos-selangor.json"
ALLOWED_STATUS = {"verified", "partial", "pending"}
REQUIRED = {"id", "name", "category", "state", "verificationStatus", "sourceUrl"}
VERIFIED_REQUIRED = {"address", "phone", "hours", "lastVerified"}


def valid_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def main() -> int:
    payload = json.loads(DATASET.read_text(encoding="utf-8"))
    items = payload.get("items")
    errors: list[str] = []

    if not isinstance(items, list) or not items:
        errors.append("items must be a non-empty array")
        items = []

    seen_ids: set[str] = set()
    seen_names: set[tuple[str, str]] = set()

    for index, item in enumerate(items, start=1):
        prefix = f"item {index}"
        missing = sorted(field for field in REQUIRED if not item.get(field))
        if missing:
            errors.append(f"{prefix}: missing required fields: {', '.join(missing)}")

        record_id = item.get("id", "")
        if record_id in seen_ids:
            errors.append(f"{prefix}: duplicate id {record_id}")
        seen_ids.add(record_id)

        name_key = (item.get("name", "").casefold(), item.get("state", "").casefold())
        if name_key in seen_names:
            errors.append(f"{prefix}: duplicate name/state pair {name_key}")
        seen_names.add(name_key)

        status = item.get("verificationStatus")
        if status not in ALLOWED_STATUS:
            errors.append(f"{prefix}: invalid verificationStatus {status!r}")

        source_url = item.get("sourceUrl", "")
        if source_url and not valid_http_url(source_url):
            errors.append(f"{prefix}: sourceUrl must be a valid HTTPS URL")

        if status == "verified":
            for field in sorted(VERIFIED_REQUIRED):
                if not item.get(field):
                    errors.append(f"{prefix}: verified record requires {field}")

        if status == "partial" and not item.get("address"):
            errors.append(f"{prefix}: partial record requires address")

        if status == "pending" and any(item.get(field) for field in ("phone", "hours")):
            errors.append(f"{prefix}: pending record must not publish phone or hours")

        postcode = str(item.get("postcode", ""))
        if postcode and (len(postcode) != 5 or not postcode.isdigit()):
            errors.append(f"{prefix}: postcode must contain exactly five digits")

    if errors:
        print("Directory dataset validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Directory dataset validation passed: {len(items)} records")
    return 0


if __name__ == "__main__":
    sys.exit(main())
