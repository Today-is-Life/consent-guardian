# Consent Guardian - API Documentation

This document describes the internal APIs and modules of Consent Guardian.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [BrowserAPI](#browserapi)
- [ConsentStorage](#consentstorage)
- [TrackerDB](#trackerdb)
- [I18n](#i18n)
- [BannerDetector](#bannerdetector)
- [DarkPatternAnalyzer](#darkpatternanalyzer)
- [ConsentObserver](#consentobserver)
- [GDPRLinkFinder](#gdprlinkfinder)
- [Message Passing](#message-passing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Extension                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    Popup     │    │  Dashboard   │    │  Background  │  │
│  │  (popup.js)  │    │(dashboard.js)│    │(background.js│  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                    │          │
│         └───────────────────┼────────────────────┘          │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │   BrowserAPI    │                      │
│                    │   (Abstraction) │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│         ┌───────────────────┼───────────────────┐          │
│         │                   │                   │          │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐   │
│  │ConsentStorage│   │  TrackerDB  │    │    I18n     │   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                    Content Scripts                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Banner    │ │ DarkPattern │ │   Consent   │          │
│  │  Detector   │ │  Analyzer   │ │  Observer   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└────────────────────────────────────────────────────────────┘
```

---

## BrowserAPI

**File:** `src/lib/browser-api.js`

Cross-browser abstraction layer for Chrome, Firefox, and Safari APIs.

### Usage

```javascript
// Storage
await BrowserAPI.storage.get('key');
await BrowserAPI.storage.set({ key: 'value' });
await BrowserAPI.storage.remove('key');

// Runtime messaging
BrowserAPI.runtime.sendMessage({ type: 'getData' });
BrowserAPI.runtime.onMessage.addListener((message, sender) => {
  // Handle message
});

// Tabs
const tabs = await BrowserAPI.tabs.query({ active: true });
await BrowserAPI.tabs.sendMessage(tabId, { type: 'analyze' });

// Browser action
await BrowserAPI.action.setBadgeText({ text: '5' });
await BrowserAPI.action.setBadgeBackgroundColor({ color: '#ef4444' });
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `browserName` | `string` | `'chrome'`, `'firefox'`, or `'safari'` |

### Methods

#### storage.get(keys)
```javascript
@param {string|string[]|null} keys - Keys to retrieve, or null for all
@returns {Promise<Object>} - Retrieved data
```

#### storage.set(items)
```javascript
@param {Object} items - Key-value pairs to store
@returns {Promise<void>}
```

#### runtime.sendMessage(message)
```javascript
@param {Object} message - Message to send
@returns {Promise<any>} - Response from listener
```

#### tabs.query(queryInfo)
```javascript
@param {Object} queryInfo - Query parameters (active, currentWindow, etc.)
@returns {Promise<Tab[]>} - Matching tabs
```

---

## ConsentStorage

**File:** `src/lib/storage.js`

Manages local storage of consent decisions, settings, and statistics.

### Usage

```javascript
// Save a consent decision
const consent = await ConsentStorage.saveConsent({
  url: 'https://example.com',
  consentType: 'reject_all',
  darkPatterns: ['hidden_reject'],
  darkPatternScore: 3
});

// Get all consents
const consents = await ConsentStorage.getAllConsents();

// Get statistics
const stats = await ConsentStorage.getStats();

// Export/Import
const data = await ConsentStorage.exportData();
await ConsentStorage.importData(data);
```

### Storage Keys

| Key | Description |
|-----|-------------|
| `consent_history` | Array of consent decisions |
| `settings` | User settings |
| `statistics` | Aggregated statistics |
| `third_party_requests` | Network request history |
| `page_links` | GDPR/Privacy links per domain |

### Methods

#### saveConsent(consent)
```javascript
@param {Object} consent
@param {string} consent.url - Page URL
@param {string} consent.consentType - 'accept_all', 'reject_all', 'custom', 'detected'
@param {string[]} consent.darkPatterns - Detected dark patterns
@param {number} consent.darkPatternScore - Score 0-10
@returns {Promise<Object>} - Saved consent with ID
```

#### getAllConsents()
```javascript
@returns {Promise<Array>} - All consent decisions
```

#### getStats()
```javascript
@returns {Promise<Object>} - Statistics object
{
  totalConsents: number,
  acceptAll: number,
  rejectAll: number,
  custom: number,
  darkPatternsDetected: number,
  domainsVisited: string[]
}
```

#### saveRequests(pageUrl, requests)
```javascript
@param {string} pageUrl - Current page URL
@param {Array} requests - Third-party requests
@returns {Promise<Object>} - Saved entry
```

---

## TrackerDB

**File:** `src/lib/tracker-db.js`

Database of 263+ known trackers with categories and descriptions.

### Usage

```javascript
// Get tracker info
const tracker = TrackerDB.getTracker('google-analytics.com');
// Returns: { name, category, description, details }

// Get category info
const category = TrackerDB.getCategory('advertising');
// Returns: { name, color, icon, description, userImpact, riskLevel }

// Categorize a domain
const category = TrackerDB.categorize('doubleclick.net');
// Returns: 'advertising'

// Get all trackers
const all = TrackerDB.getAllTrackers();
```

### Categories

| Category | Color | Risk Level | Description |
|----------|-------|------------|-------------|
| `advertising` | red | high | Ad networks and retargeting |
| `analytics` | yellow | medium | Website analytics |
| `social` | blue | medium | Social media widgets |
| `cdn` | green | low | Content delivery networks |
| `functional` | gray | low | Required functionality |
| `fingerprinting` | purple | high | Browser fingerprinting |

### Tracker Object Structure

```javascript
{
  name: 'Google Analytics',
  category: 'analytics',
  description: 'Short user-friendly description',
  details: 'Detailed explanation of what this tracker does...'
}
```

### Methods

#### getTracker(domain)
```javascript
@param {string} domain - Domain to look up
@returns {Object|null} - Tracker info or null
```

#### categorize(domain)
```javascript
@param {string} domain - Domain to categorize
@returns {string} - Category name
```

#### getCategory(categoryId)
```javascript
@param {string} categoryId - Category identifier
@returns {Object} - Category details
```

---

## I18n

**File:** `src/lib/i18n.js`

Internationalization helper using Chrome's i18n API.

### Usage

```javascript
// Get translated message
const text = I18n.getMessage('extensionName');
// Or shorthand:
const text = __('extensionName');

// With substitutions
const text = __('trackerCount', ['5']);

// Get current language
const lang = I18n.getLanguage(); // 'de' or 'en'

// Check language
if (I18n.isGerman()) { ... }
if (I18n.isEnglish()) { ... }

// Translate page (auto-called on DOMContentLoaded)
I18n.translatePage();
```

### HTML Data Attributes

```html
<!-- Text content -->
<span data-i18n="keyName"></span>

<!-- Placeholder -->
<input data-i18n-placeholder="searchPlaceholder">

<!-- Title/tooltip -->
<button data-i18n-title="buttonTooltip"></button>
```

### Methods

#### getMessage(key, substitutions)
```javascript
@param {string} key - Message key from messages.json
@param {string|Array} substitutions - Placeholder values
@returns {string} - Translated message or key if not found
```

#### getLanguage()
```javascript
@returns {string} - Two-letter language code ('de', 'en')
```

#### translatePage()
```javascript
Translates all elements with data-i18n attributes.
Called automatically on DOMContentLoaded.
```

---

## BannerDetector

**File:** `src/content-scripts/banner-detector.js`

Detects cookie consent banners on web pages.

### Usage

```javascript
// Detect banner
const banner = BannerDetector.detect();
if (banner) {
  console.log(banner.element);  // DOM element
  console.log(banner.cmp);      // CMP name or 'generic'
  console.log(banner.buttons);  // { accept, reject, settings }
}

// Observe for dynamically loaded banners
BannerDetector.observe((banner) => {
  console.log('Banner appeared:', banner);
});
```

### Supported CMPs (35+)

- Cookiebot
- OneTrust
- TrustArc
- Quantcast
- Didomi
- Usercentrics
- CookieYes
- Klaro
- Tarteaucitron
- GDPR Cookie Compliance
- And many more...

### Return Object

```javascript
{
  element: HTMLElement,      // Banner container
  cmp: string,              // CMP identifier or 'generic'
  buttons: {
    accept: HTMLElement[],  // Accept buttons
    reject: HTMLElement[],  // Reject buttons
    settings: HTMLElement[] // Settings/customize buttons
  },
  confidence: number        // Detection confidence 0-1
}
```

---

## DarkPatternAnalyzer

**File:** `src/content-scripts/dark-pattern-analyzer.js`

Analyzes cookie banners for manipulation techniques (dark patterns).

### Usage

```javascript
// Analyze a banner
const result = DarkPatternAnalyzer.analyze(bannerElement);
console.log(result.score);       // 0-10
console.log(result.patterns);    // Array of detected patterns
console.log(result.explanation); // Human-readable explanation
```

### Detected Patterns

| Pattern | Weight | Description |
|---------|--------|-------------|
| `hidden_reject` | 3 | Reject button is hard to find |
| `preselected` | 3 | Options pre-checked |
| `confirmshaming` | 2 | Guilt-inducing language |
| `color_manipulation` | 2 | Visual emphasis on accept |
| `complexity` | 2 | Many steps to reject |
| `obstruction` | 2 | Blocking content |
| `forced_action` | 3 | No real choice |
| `nagging` | 1 | Repeated prompts |

### Return Object

```javascript
{
  score: 7,                    // Total score (0-10)
  patterns: [
    {
      type: 'hidden_reject',
      weight: 3,
      description: 'Reject button is hidden as small link'
    }
  ],
  explanation: 'This banner uses several manipulation techniques...',
  riskLevel: 'high'           // 'low', 'medium', 'high'
}
```

---

## ConsentObserver

**File:** `src/content-scripts/consent-observer.js`

Observes user interactions with consent banners.

### Usage

```javascript
// Start observing
ConsentObserver.start(bannerElement, (decision) => {
  console.log(decision.type);    // 'accept_all', 'reject_all', 'custom'
  console.log(decision.button);  // Clicked button
  console.log(decision.timestamp);
});

// Stop observing
ConsentObserver.stop();
```

### Decision Types

| Type | Description |
|------|-------------|
| `accept_all` | User clicked accept all |
| `reject_all` | User clicked reject all |
| `custom` | User customized settings |
| `dismissed` | Banner was dismissed |
| `timeout` | No interaction within timeout |

---

## GDPRLinkFinder

**File:** `src/content-scripts/gdpr-link-finder.js`

Finds links to privacy policies and cookie settings.

### Usage

```javascript
// Find all GDPR-related links
const links = GDPRLinkFinder.find();
console.log(links.gdprLinks);     // Privacy policy links
console.log(links.privacyLinks);  // General privacy links
console.log(links.cmp);           // CMP reset link if found
```

### Return Object

```javascript
{
  gdprLinks: [
    { text: 'Cookie Settings', href: '...', element: HTMLElement }
  ],
  privacyLinks: [
    { text: 'Privacy Policy', href: '...', element: HTMLElement }
  ],
  cmp: {
    found: true,
    resetFunction: 'Cookiebot.renew()'
  }
}
```

---

## Message Passing

Communication between content scripts, popup, and background.

### Message Types

#### Content Script → Background

```javascript
// Report detected banner
BrowserAPI.runtime.sendMessage({
  type: 'BANNER_DETECTED',
  data: { url, cmp, darkPatterns }
});

// Report consent decision
BrowserAPI.runtime.sendMessage({
  type: 'CONSENT_GIVEN',
  data: { url, consentType, timestamp }
});

// Report third-party requests
BrowserAPI.runtime.sendMessage({
  type: 'REQUESTS_DETECTED',
  data: { url, requests }
});
```

#### Popup/Dashboard → Background

```javascript
// Get current tab data
BrowserAPI.runtime.sendMessage({
  type: 'GET_TAB_DATA',
  tabId: 123
});

// Get statistics
BrowserAPI.runtime.sendMessage({
  type: 'GET_STATS'
});

// Clear data
BrowserAPI.runtime.sendMessage({
  type: 'CLEAR_DATA',
  scope: 'all' // or 'domain'
});
```

---

## Events

### Storage Changes

```javascript
BrowserAPI.storage.onChanged.addListener((changes, area) => {
  if (changes.consent_history) {
    // Consent history was updated
  }
});
```

### Tab Updates

```javascript
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Page finished loading
  }
});
```

---

## Error Handling

All async methods may throw errors. Wrap in try-catch:

```javascript
try {
  const data = await ConsentStorage.getAllConsents();
} catch (error) {
  console.error('[ConsentGuardian] Storage error:', error);
}
```

---

(c) 2025-2026 Today is Life GmbH | Author: Guido Mitschke
