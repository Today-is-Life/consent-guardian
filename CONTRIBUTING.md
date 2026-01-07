# Contributing to Consent Guardian

Thank you for your interest in contributing to Consent Guardian! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Today-is-Life/consent-guardian/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Browser and version
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the `enhancement` label
3. Describe the feature and its use case

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test in at least Chrome and Firefox
5. Commit with clear messages: `git commit -m "feat: Add new feature"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Today-is-Life/consent-guardian.git
cd consent-guardian

# Install dependencies
npm install

# Build CSS
npm run build:css

# Build extension
npm run build
```

### Loading the Extension

**Chrome:**
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/chrome`

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `dist/firefox/manifest.json`

## Code Style

- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- No `console.log` in production code (use DEBUG flag)

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Project Structure

```
src/
├── background/          # Service Worker (background.js)
├── content-scripts/     # Scripts injected into web pages
│   ├── banner-detector.js      # Detects cookie banners
│   ├── dark-pattern-analyzer.js # Analyzes dark patterns
│   ├── consent-observer.js     # Observes user decisions
│   ├── gdpr-link-finder.js     # Finds privacy policy links
│   └── main.js                 # Entry point
├── dashboard/           # Dashboard UI (index.html, dashboard.js)
├── popup/               # Browser action popup
├── lib/                 # Shared libraries
│   ├── browser-api.js   # Cross-browser API abstraction
│   ├── storage.js       # Local storage management
│   ├── tracker-db.js    # Tracker database (263+ trackers)
│   └── i18n.js          # Internationalization helper
├── icons/               # Extension icons
├── styles/              # Tailwind CSS
└── _locales/            # Translations (de, en)
```

## Adding New Trackers

Edit `src/lib/tracker-db.js`:

```javascript
'example-tracker.com': {
  name: 'Example Tracker',
  category: 'advertising', // or: analytics, social, cdn, functional, fingerprinting
  description: 'Short description for users',
  details: 'Detailed explanation of what this tracker does...'
},
```

## Adding Translations

1. Add new keys to `src/_locales/de/messages.json`
2. Add corresponding keys to `src/_locales/en/messages.json`
3. Use in code: `I18n.getMessage('keyName')` or `__('keyName')`
4. Use in HTML: `<span data-i18n="keyName"></span>`

## Questions?

Open an issue or contact us at info@todayislife.de

---

(c) 2025-2026 Today is Life GmbH
