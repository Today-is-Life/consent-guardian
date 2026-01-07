# Changelog

All notable changes to Consent Guardian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-07

### Added
- **Bilingual Support**: German and English (auto-detected by browser language)
- **Tracker Database**: 263+ known trackers with detailed explanations
- **Expandable Details**: Click on trackers in network view to see detailed info
- **Color Coding**: Visual categorization of tracker types
  - Red: Advertising/Marketing
  - Yellow: Analytics
  - Blue: Social Media
  - Green: Technical/CDN
  - Purple: Fingerprinting
  - Gray: Functional
- **i18n System**: Full internationalization support using Chrome's i18n API
- **Locales**: `_locales/de/` and `_locales/en/` with 100+ translation keys

### Changed
- Improved network view with better UX
- Refactored dashboard for better performance
- Updated tracker descriptions to be more user-friendly (no jargon)

### Fixed
- Banner detection reliability improvements
- Storage handling for large consent histories

## [1.0.0] - 2026-01-05

### Added
- **Cookie Banner Detection**: Automatic detection of consent banners
  - Support for 35+ Consent Management Platforms (CMPs)
  - Generic banner detection for custom implementations
- **Dark Pattern Analysis**: Detection of manipulation tricks
  - Hidden reject buttons
  - Color manipulation (prominent accept, hidden reject)
  - Pre-selected tracking options
  - Confirmshaming language
  - Complexity barriers
- **Consent Logging**: Document all cookie decisions
  - Accept all / Reject all / Custom choices
  - Timestamp and domain tracking
  - Dark pattern score per site
- **Tracker Monitoring**: Third-party request tracking
  - Categorized by type (advertising, analytics, social, etc.)
  - Request counting per domain
- **Dashboard**: Statistics and history view
  - Overview statistics
  - Consent history list
  - Network request analysis
- **Popup**: Quick status for current page
- **Data Export/Import**: Backup and restore functionality
- **Cross-Browser Support**:
  - Chrome (Manifest V3)
  - Firefox (Manifest V2)
  - Safari (Manifest V3)
  - Edge, Opera, Brave (Chrome-compatible)

### Technical
- Browser API abstraction layer for cross-browser compatibility
- Local storage only (no external servers)
- Service Worker architecture for Chrome/Safari
- Background script for Firefox

---

## Roadmap

### [1.2.0] - Planned
- [ ] Automatic cookie rejection option
- [ ] Whitelist/blacklist for domains
- [ ] Statistics export (CSV/PDF)
- [ ] Browser sync for settings

### [2.0.0] - Future
- [ ] Machine learning for banner detection
- [ ] Community-contributed tracker database
- [ ] Browser comparison reports

---

(c) 2025-2026 Today is Life GmbH | Author: Guido Mitschke
