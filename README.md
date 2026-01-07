# 🛡️ Consent Guardian

**Dein Schutzschild gegen Cookie-Manipulation**

Überwache deine Cookie-Entscheidungen, erkenne Manipulationstricks (Dark Patterns) und behalte die Kontrolle über deine Privatsphäre.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Made in Germany](https://img.shields.io/badge/Made%20in-Germany%20🇩🇪-black)

## 🇬🇧 English

Monitor your cookie decisions, detect manipulation tricks, and stay in control of your privacy.

---

## ✨ Features

- **🔍 Cookie-Banner Erkennung** - Erkennt automatisch Cookie-Banner auf Websites
- **⚠️ Dark Pattern Analyse** - Identifiziert Manipulationstricks wie versteckte Ablehnen-Buttons
- **📊 Tracker-Übersicht** - Zeigt welche Tracker dich verfolgen (263+ bekannte Tracker)
- **📝 Entscheidungs-Log** - Dokumentiert alle deine Cookie-Entscheidungen
- **🌍 Zweisprachig** - Deutsch und Englisch (automatisch nach Browsersprache)
- **🔒 100% Privatsphäre** - Alle Daten bleiben lokal in deinem Browser

## 🚀 Installation

### Chrome / Edge / Opera / Brave
1. Lade die Extension von [Chrome Web Store](#) herunter
2. Oder: Entpacke `dist/chrome` und lade als "Entpackte Erweiterung"

### Firefox
1. Lade die Extension von [Firefox Add-ons](#) herunter
2. Oder: Lade `dist/firefox/manifest.json` als temporäre Erweiterung

### Safari
1. Verfügbar im [App Store](#) (macOS/iOS)

## 🛠️ Development

### Voraussetzungen
- Node.js 18+
- npm

### Setup
```bash
# Dependencies installieren
npm install

# CSS kompilieren (Tailwind)
npm run build:css

# Extension bauen
npm run build        # Alle Browser
npm run build:chrome # Nur Chrome
npm run build:firefox # Nur Firefox
```

### Projektstruktur
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
│   └── _locales/        # Übersetzungen (de/en)
├── manifests/           # Browser-spezifische Manifests
├── scripts/             # Build Scripts
└── dist/                # Build Output
```

## 📊 Erkannte Manipulationstricks

Consent Guardian erkennt diese Dark Patterns:

| Trick | Beschreibung |
|-------|--------------|
| **Versteckte Ablehnung** | "Ablehnen" ist schwer zu finden oder als kleiner Link versteckt |
| **Farbmanipulation** | "Akzeptieren" ist bunt und groß, "Ablehnen" grau und klein |
| **Vorauswahl** | Tracking-Optionen sind bereits angehakt |
| **Beschämung** | Formulierungen wie "Nein, ich will keine Vorteile" |
| **Komplexität** | Ablehnung erfordert viele Klicks, Akzeptieren nur einen |

## 🔒 Datenschutz

- **Keine Datenübertragung** - Alle Daten bleiben lokal im Browser
- **Keine Accounts** - Keine Registrierung erforderlich
- **Keine Analytics** - Wir tracken dich nicht
- **Open Source** - Der Code ist transparent und überprüfbar

## 🌐 Unterstützte Browser

| Browser | Status | Manifest |
|---------|--------|----------|
| Chrome | ✅ | V3 |
| Edge | ✅ | V3 (Chrome-kompatibel) |
| Firefox | ✅ | V2 |
| Safari | ✅ | V3 |
| Opera | ✅ | V3 (Chrome-kompatibel) |
| Brave | ✅ | V3 (Chrome-kompatibel) |

## 📝 Changelog

### v1.1.0
- 🌍 Zweisprachig: Deutsch und Englisch
- 📚 263+ Tracker mit detaillierten Erklärungen
- 🎨 Verbesserte Netzwerk-Ansicht mit aufklappbaren Details
- 🏷️ Neue Farbcodierung für bessere Übersicht
- ⚡ Performance-Verbesserungen

### v1.0.0
- 🚀 Initiale Version
- 🔍 Cookie-Banner Erkennung
- ⚠️ Dark Pattern Analyse
- 📊 Tracker-Übersicht

## 🤝 Contributing

Beiträge sind willkommen! Bitte erstelle einen Issue oder Pull Request.

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 👨‍💻 Entwickelt von

**Today is Life GmbH**
Hamburg, Germany 🇩🇪

- Website: [todayislife.de](https://www.todayislife.de)
- E-Mail: info@todayislife.de

---

*Consent Guardian - Weil deine Privatsphäre wichtig ist.*
