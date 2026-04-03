# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 2.1.x | Yes |
| < 2.1.0 | No |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this template, please **do not open a public GitHub issue**.

Email: contact via [thebukitbesi.com](https://www.thebukitbesi.com/) contact page.

We will acknowledge reports within 48 hours and aim to release a fix within 14 days for critical issues.

---

## About Public IDs in This Repository

### AdSense Publisher ID (`ca-pub-0182550701431501`)

**This is safe to be public.**

The AdSense publisher ID is embedded in every rendered page of the live website and is visible to anyone who views page source. It is not a secret credential — it is designed to be publicly visible so Google can attribute ad revenue to your account.

To protect against ad fraud (someone embedding your publisher ID on their own site):
1. In **Google AdSense → Sites**, add only `thebukitbesi.com` as an authorized site
2. Enable **AdSense ad serving controls** to block unauthorised domains
3. Monitor the **Sites** report regularly for unexpected traffic sources

### Analytics IDs (GA4, Clarity)

These IDs are also embedded in every page of the live site and visible in source. They are measurement identifiers, not authentication secrets. They cannot be used to modify your analytics data or account settings.

### Verification Tokens

Domain verification tokens for Pinterest, Bing, Facebook, and Yandex are safe to be public. They only prove domain ownership and cannot be used maliciously.

### What should NEVER be committed

- Google AdSense secret keys (not the publisher ID)
- OAuth tokens / service account JSON
- `.env` files with API keys
- Any private keys (`*.pem`, `*.p12`)
