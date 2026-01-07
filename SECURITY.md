# Security Policy

## Our Commitment

Consent Guardian is built with privacy and security as core principles. We take security vulnerabilities seriously and appreciate responsible disclosure.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | Yes                |
| 1.0.x   | Security fixes only|
| < 1.0   | No                 |

## Security Features

### Data Privacy
- **No data transmission**: All data stays locally in your browser
- **No external servers**: No connection to third-party services
- **No analytics**: We don't track users
- **No accounts**: No registration or login required

### Permissions Used
| Permission | Purpose |
|------------|---------|
| `storage` | Store consent history locally |
| `activeTab` | Analyze current tab for cookie banners |
| `webRequest` | Monitor third-party requests |
| `webNavigation` | Detect page navigation |
| `<all_urls>` | Analyze any website you visit |

### What We Don't Do
- We don't collect personal data
- We don't send data to external servers
- We don't inject ads or modify page content
- We don't sell or share any information

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Email**: info@todayislife.de
2. **Subject**: `[SECURITY] Consent Guardian - Brief Description`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect
- **Response time**: Within 48 hours
- **Updates**: Regular updates on the status
- **Credit**: Public acknowledgment (if desired)

### Please Don't
- Publicly disclose the vulnerability before we've addressed it
- Use the vulnerability for malicious purposes
- Access data that isn't yours

## Security Best Practices

When contributing code:

1. **No hardcoded secrets**: Never commit API keys or credentials
2. **Input validation**: Validate all external input
3. **Content Security**: Use CSP headers where applicable
4. **Dependencies**: Keep npm packages updated
5. **Code review**: All PRs require review before merging

## Audit History

| Date | Auditor | Result |
|------|---------|--------|
| Jan 2026 | Internal | Passed |

---

(c) 2025-2026 Today is Life GmbH
