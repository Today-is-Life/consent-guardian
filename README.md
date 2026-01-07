# Consent Guardian

**Your Shield Against Cookie Manipulation**

Monitor your cookie decisions, detect manipulation tricks (dark patterns), and stay in control of your privacy.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Made in Germany](https://img.shields.io/badge/Made%20in-Germany-black)

## Features

- **Cookie Banner Detection** - Automatically detects cookie consent banners (35+ CMPs supported)
- **Dark Pattern Analysis** - Identifies manipulation tricks like hidden reject buttons
- **Tracker Overview** - Shows which trackers are following you (263+ known trackers with explanations)
- **Decision Log** - Documents all your cookie decisions
- **Bilingual** - German and English (automatically based on browser language)
- **100% Privacy** - All data stays locally in your browser

## Installation

### Chrome / Edge / Opera / Brave
1. Download from [Chrome Web Store](#) (coming soon)
2. Or: Unpack `dist/chrome` and load as "unpacked extension"

### Firefox
1. Download from [Firefox Add-ons](#) (coming soon)
2. Or: Load `dist/firefox/manifest.json` as temporary extension

### Safari
1. Available on [App Store](#) (macOS/iOS) (coming soon)

## Detected Dark Patterns

Consent Guardian detects these manipulation tricks:

| Pattern | Description |
|---------|-------------|
| **Hidden Reject** | "Reject" button is hard to find or hidden as small link |
| **Color Manipulation** | "Accept" is colorful and large, "Reject" is gray and small |
| **Pre-selection** | Tracking options are already checked |
| **Confirmshaming** | Wording like "No, I don't want benefits" |
| **Complexity** | Rejecting requires many clicks, accepting only one |

## Privacy

- **No Data Transfer** - All data stays locally in your browser
- **No Accounts** - No registration required
- **No Analytics** - We don't track you
- **Open Source** - Code is transparent and auditable

## Supported Browsers

| Browser | Status | Manifest |
|---------|--------|----------|
| Chrome | Supported | V3 |
| Edge | Supported | V3 (Chrome-compatible) |
| Firefox | Supported | V2 |
| Safari | Supported | V3 |
| Opera | Supported | V3 (Chrome-compatible) |
| Brave | Supported | V3 (Chrome-compatible) |

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
# Install dependencies
npm install

# Compile CSS (Tailwind)
npm run build:css

# Build extension
npm run build        # All browsers
npm run build:chrome # Chrome only
npm run build:firefox # Firefox only
```

### Project Structure
```
consent-guardian/
├── src/
│   ├── background/      # Service Worker
│   ├── content-scripts/ # Content Scripts
│   ├── dashboard/       # Dashboard UI
│   ├── popup/           # Popup UI
│   ├── lib/             # Shared Libraries
│   ├── icons/           # Extension Icons
│   ├── styles/          # Tailwind CSS
│   └── _locales/        # Translations (de/en)
├── manifests/           # Browser-specific Manifests
├── scripts/             # Build Scripts
└── dist/                # Build Output
```

## Changelog

### v1.1.0
- Bilingual: German and English
- 263+ trackers with detailed explanations
- Improved network view with expandable details
- New color coding for better overview
- Performance improvements

### v1.0.0
- Initial release
- Cookie banner detection
- Dark pattern analysis
- Tracker overview

## Contributing

Contributions are welcome! Please create an issue or pull request.

## License

MIT License - see [LICENSE](LICENSE)

## Author

**Guido Mitschke**

**Today is Life GmbH**
Hamburg, Germany

- Website: [todayislife.de](https://www.todayislife.de)
- Email: info@todayislife.de

---

*Consent Guardian - Because your privacy matters.*
