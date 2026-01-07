/**
 * Consent Guardian Dashboard - UI/UX Test
 * Tester: Maya Santos (UI/UX Testing Expert)
 * Ziel: Dashboard aus Sicht eines DAU (Dümmster anzunehmender User) testen
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Dashboard-Pfad
const DASHBOARD_PATH = path.join(__dirname, '../src/dashboard/index.html');

// Mock-Daten für realistische Tests
const MOCK_CONSENTS = [
  {
    id: '1',
    domain: 'amazon.de',
    url: 'https://www.amazon.de/gp/bestsellers',
    consentType: 'accept_all',
    timestamp: Date.now() - 3600000,
    darkPatterns: ['visual_hierarchy', 'preselected', 'hidden_decline'],
    darkPatternScore: 68
  },
  {
    id: '2',
    domain: 'spiegel.de',
    url: 'https://www.spiegel.de/politik/',
    consentType: 'reject_all',
    timestamp: Date.now() - 7200000,
    darkPatterns: ['visual_hierarchy'],
    darkPatternScore: 25
  },
  {
    id: '3',
    domain: 'bild.de',
    url: 'https://www.bild.de/',
    consentType: 'custom',
    timestamp: Date.now() - 10800000,
    darkPatterns: ['visual_hierarchy', 'preselected', 'confirm_shaming', 'many_clicks'],
    darkPatternScore: 85
  },
  {
    id: '4',
    domain: 'zeit.de',
    url: 'https://www.zeit.de/',
    consentType: 'detected',
    timestamp: Date.now() - 14400000,
    darkPatterns: [],
    darkPatternScore: 10
  },
  {
    id: '5',
    domain: 'heise.de',
    url: 'https://www.heise.de/',
    consentType: 'reject_all',
    timestamp: Date.now() - 18000000,
    darkPatterns: [],
    darkPatternScore: 5
  }
];

const MOCK_REQUESTS = [
  {
    pageDomain: 'amazon.de',
    pageUrl: 'https://www.amazon.de/gp/bestsellers',
    timestamp: Date.now() - 3600000,
    requests: [
      { domain: 'doubleclick.net', category: 'advertising', type: 'script' },
      { domain: 'google-analytics.com', category: 'analytics', type: 'script' },
      { domain: 'facebook.com', category: 'social', type: 'pixel' },
      { domain: 'cloudfront.net', category: 'cdn', type: 'image' },
      { domain: 'criteo.com', category: 'advertising', type: 'script' }
    ]
  },
  {
    pageDomain: 'spiegel.de',
    pageUrl: 'https://www.spiegel.de/politik/',
    timestamp: Date.now() - 7200000,
    requests: [
      { domain: 'google-analytics.com', category: 'analytics', type: 'script' },
      { domain: 'fonts.googleapis.com', category: 'cdn', type: 'font' }
    ]
  },
  {
    pageDomain: 'bild.de',
    pageUrl: 'https://www.bild.de/',
    timestamp: Date.now() - 10800000,
    requests: [
      { domain: 'doubleclick.net', category: 'advertising', type: 'script' },
      { domain: 'google-analytics.com', category: 'analytics', type: 'script' },
      { domain: 'facebook.com', category: 'social', type: 'pixel' },
      { domain: 'twitter.com', category: 'social', type: 'script' },
      { domain: 'outbrain.com', category: 'advertising', type: 'script' },
      { domain: 'taboola.com', category: 'advertising', type: 'script' },
      { domain: 'adsrvr.org', category: 'advertising', type: 'script' }
    ]
  }
];

const MOCK_SETTINGS = {
  autoAnalyze: true,
  darkPatternWarnings: true,
  notifications: false,
  trackRequests: true,
  proMode: true
};

// BrowserAPI Mock injizieren
async function injectMocks(page) {
  await page.addInitScript((data) => {
    window.BrowserAPI = {
      runtime: {
        sendMessage: async (msg) => {
          console.log('[BrowserAPI Mock] Message:', msg.type);
          switch(msg.type) {
            case 'GET_CONSENTS': return data.consents;
            case 'GET_SETTINGS': return data.settings;
            case 'GET_REQUESTS': return data.requests;
            case 'GET_PAGE_LINKS': return {
              gdprLinks: [{ href: '#cookie-settings', text: 'Cookie-Einstellungen' }],
              privacyLinks: [{ href: '#datenschutz', text: 'Datenschutz' }],
              cmp: { found: true, name: 'Consent Manager Pro' }
            };
            default: return null;
          }
        }
      },
      storage: {
        get: async () => ({}),
        set: async () => {}
      }
    };

    // TrackerDB Mock
    window.TrackerDB = {
      getTracker: (domain) => {
        const trackers = {
          'doubleclick.net': { name: 'Google DoubleClick', category: 'advertising' },
          'google-analytics.com': { name: 'Google Analytics', category: 'analytics' },
          'facebook.com': { name: 'Facebook', category: 'social' },
          'criteo.com': { name: 'Criteo', category: 'advertising' },
          'outbrain.com': { name: 'Outbrain', category: 'advertising' },
          'taboola.com': { name: 'Taboola', category: 'advertising' }
        };
        return trackers[domain] || null;
      },
      getCategory: (cat) => {
        const cats = {
          advertising: { icon: '🔴', name: 'Werbung' },
          analytics: { icon: '🟡', name: 'Analyse' },
          social: { icon: '🔵', name: 'Social Media' },
          cdn: { icon: '🟢', name: 'CDN' },
          functional: { icon: '🟢', name: 'Funktional' },
          unknown: { icon: '⚪', name: 'Unbekannt' }
        };
        return cats[cat] || cats.unknown;
      },
      createHumanSummary: (domains) => ({
        summary: `${domains.length} externe Dienste wurden erkannt.`,
        stats: { total: domains.length, critical: 5, tracking: 2, harmless: 3 },
        details: [
          { icon: '🔴', title: 'Werbe-Tracker', description: '5 Werbe-Dienste verfolgen dich', examples: 'DoubleClick, Criteo' },
          { icon: '🟡', title: 'Analyse', description: '2 Dienste messen dein Verhalten', examples: 'Google Analytics' }
        ]
      })
    };
  }, { consents: MOCK_CONSENTS, settings: MOCK_SETTINGS, requests: MOCK_REQUESTS });
}

// Test-Konfiguration
test.describe('Consent Guardian Dashboard - DAU-Test', () => {

  // Screenshot-Verzeichnis erstellen
  test.beforeAll(async () => {
    const screenshotDir = path.join(__dirname, '../test-results/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Mocks injizieren
    await injectMocks(page);

    // Console-Errors sammeln
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Console Error] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`[Page Error] ${error.message}`);
    });

    // Dashboard laden
    await page.goto(`file://${DASHBOARD_PATH}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Warten bis JS geladen
  });

  // ============================================
  // TEST 1: Erster Eindruck - Was sieht ein DAU?
  // ============================================
  test('Erster Eindruck: Header und Hauptnavigation', async ({ page }) => {
    // Screenshot vom Start
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/01-erster-eindruck.png'),
      fullPage: true
    });

    // Ist der Titel verständlich?
    const title = await page.locator('h1').textContent();
    console.log(`[DAU-Test] Titel: "${title}"`);

    // Untertitel - versteht ein User "Cookie-Consent-Überblick"?
    const subtitle = await page.locator('header p').textContent();
    console.log(`[DAU-Test] Untertitel: "${subtitle}"`);

    // Navigation sichtbar?
    const navButtons = await page.locator('.tab-btn').count();
    console.log(`[DAU-Test] Anzahl Nav-Buttons: ${navButtons}`);

    // Prüfe Tab-Namen
    const tabNames = await page.locator('.tab-btn').allTextContents();
    console.log(`[DAU-Test] Tab-Namen: ${tabNames.join(', ')}`);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.tab-btn').first()).toBeVisible();
  });

  // ============================================
  // TEST 2: Übersicht-Tab - Statistik-Kacheln
  // ============================================
  test('Übersicht-Tab: Statistik-Kacheln verstehen', async ({ page }) => {
    // Screenshot der Statistiken
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/02-statistik-kacheln.png'),
      fullPage: false
    });

    // Finde alle Statistik-Cards
    const cards = await page.locator('.card').first().locator('..').locator('.card');

    // Prüfe Labels der Statistiken
    const statLabels = await page.locator('.card .text-sm').allTextContents();
    console.log(`[DAU-Test] Statistik-Labels: ${statLabels.slice(0,5).join(', ')}`);

    // PROBLEM-CHECK: Versteht ein DAU "Erkannt"?
    // Was bedeutet "Erkannt" ohne Kontext?
    const erkannt = await page.locator('text=Erkannt').first();
    if (await erkannt.isVisible()) {
      console.log('[DAU-PROBLEM] "Erkannt" ohne Erklärung - was wurde erkannt?');
    }

    // PROBLEM-CHECK: Was bedeutet "Angepasst"?
    const angepasst = await page.locator('text=Angepasst').first();
    if (await angepasst.isVisible()) {
      console.log('[DAU-PROBLEM] "Angepasst" - was wurde angepasst? Unklar!');
    }
  });

  // ============================================
  // TEST 3: Dark Pattern Card - Klickbar?
  // ============================================
  test('Dark Pattern Card: Klick-Test und Erklärung', async ({ page }) => {
    // Finde die Dark Pattern Card
    const darkPatternCard = page.locator('#darkPatternCard');

    // Ist sie als klickbar erkennbar? (cursor-pointer?)
    const hasPointer = await darkPatternCard.evaluate(el =>
      window.getComputedStyle(el).cursor === 'pointer'
    );
    console.log(`[DAU-Test] Dark Pattern Card klickbar: ${hasPointer}`);

    // Klicke darauf
    await darkPatternCard.click();
    await page.waitForTimeout(300);

    // Screenshot nach Klick
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/03-dark-pattern-detail.png'),
      fullPage: true
    });

    // Ist das Detail-Panel sichtbar?
    const detailPanel = page.locator('#darkPatternDetail');
    await expect(detailPanel).toBeVisible();

    // Prüfe Erklärungstext
    const explanation = await detailPanel.locator('.bg-amber-50').textContent();
    console.log(`[DAU-Test] Dark Pattern Erklärung vorhanden: ${explanation?.length > 0}`);

    // Gibt es einen Schließen-Button?
    const closeBtn = page.locator('#closeDarkPatternDetail');
    await expect(closeBtn).toBeVisible();

    // Schließen funktioniert?
    await closeBtn.click();
    await page.waitForTimeout(200);
    await expect(detailPanel).toBeHidden();
  });

  // ============================================
  // TEST 4: Domains Card - Klickbar?
  // ============================================
  test('Domains Card: Klick-Test', async ({ page }) => {
    const domainsCard = page.locator('#domainsCard');

    // Klicke darauf
    await domainsCard.click();
    await page.waitForTimeout(300);

    // Screenshot
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/04-domains-detail.png'),
      fullPage: true
    });

    // Detail-Panel sichtbar?
    const detailPanel = page.locator('#domainsDetail');
    await expect(detailPanel).toBeVisible();

    // Suchfeld vorhanden?
    const searchField = page.locator('#searchDomains');
    await expect(searchField).toBeVisible();

    // Schließen
    await page.locator('#closeDomainsDetail').click();
  });

  // ============================================
  // TEST 5: Tab-Navigation - Alle Tabs testen
  // ============================================
  test('Tab-Navigation: Alle Tabs durchklicken', async ({ page }) => {
    const tabs = ['overview', 'network', 'history', 'settings'];

    for (const tab of tabs) {
      // Tab klicken
      await page.locator(`[data-tab="${tab}"]`).click();
      await page.waitForTimeout(300);

      // Screenshot
      await page.screenshot({
        path: path.join(__dirname, `../test-results/screenshots/05-tab-${tab}.png`),
        fullPage: true
      });

      // Prüfe ob Tab-Content sichtbar ist
      const content = page.locator(`#tab-${tab}`);
      await expect(content).toBeVisible();

      console.log(`[DAU-Test] Tab "${tab}" funktioniert: OK`);
    }
  });

  // ============================================
  // TEST 6: Netzwerk-Tab - Verständlichkeit
  // ============================================
  test('Netzwerk-Tab: Verständlichkeit für DAU', async ({ page }) => {
    // Zum Netzwerk-Tab
    await page.locator('[data-tab="network"]').click();
    await page.waitForTimeout(500);

    // Screenshot
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/06-netzwerk-tab.png'),
      fullPage: true
    });

    // Prüfe Einführungstext
    const introText = await page.locator('#tab-network .card').first().textContent();
    console.log(`[DAU-Test] Netzwerk-Intro: ${introText?.substring(0, 100)}...`);

    // Sub-Tabs vorhanden?
    const subTabs = await page.locator('.network-subtab').allTextContents();
    console.log(`[DAU-Test] Netzwerk Sub-Tabs: ${subTabs.join(', ')}`);

    // "Besuchte Seiten" klicken
    await page.locator('.network-subtab[data-subtab="pages"]').click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/06a-netzwerk-seiten.png'),
      fullPage: true
    });

    // "Gesamtübersicht" klicken
    await page.locator('.network-subtab[data-subtab="summary"]').click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/06b-netzwerk-uebersicht.png'),
      fullPage: true
    });

    // Legende vorhanden?
    const legende = page.locator('text=So liest du die Ergebnisse');
    await expect(legende).toBeVisible();
  });

  // ============================================
  // TEST 7: Verlauf-Tab - Tabelle verständlich?
  // ============================================
  test('Verlauf-Tab: Tabellen-Verständlichkeit', async ({ page }) => {
    // Zum Verlauf-Tab
    await page.locator('[data-tab="history"]').click();
    await page.waitForTimeout(500);

    // Screenshot
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/07-verlauf-tab.png'),
      fullPage: true
    });

    // Tabellen-Header prüfen
    const headers = await page.locator('.data-table th').allTextContents();
    console.log(`[DAU-Test] Tabellen-Header: ${headers.join(', ')}`);

    // PROBLEM-CHECK: "Dark Patterns" als Header - versteht ein DAU das?
    if (headers.includes('Dark Patterns')) {
      console.log('[DAU-PROBLEM] "Dark Patterns" in Tabelle - Fachbegriff ohne Erklärung!');
    }

    // Filter-Optionen prüfen
    const filterOptions = await page.locator('#filterType option').allTextContents();
    console.log(`[DAU-Test] Filter-Optionen: ${filterOptions.join(', ')}`);

    // Suche testen
    const searchField = page.locator('#searchHistory');
    await searchField.fill('amazon');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/07a-verlauf-suche.png'),
      fullPage: true
    });
  });

  // ============================================
  // TEST 8: Einstellungen-Tab - Alle Optionen
  // ============================================
  test('Einstellungen-Tab: Optionen verstehen', async ({ page }) => {
    // Zum Einstellungen-Tab
    await page.locator('[data-tab="settings"]').click();
    await page.waitForTimeout(500);

    // Screenshot
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/08-einstellungen-tab.png'),
      fullPage: true
    });

    // Alle Einstellungs-Labels prüfen
    const settingLabels = await page.locator('#tab-settings label .font-medium').allTextContents();
    console.log(`[DAU-Test] Einstellungs-Labels: ${settingLabels.join(', ')}`);

    // PROBLEM-CHECK: "Request-Tracking" - zu technisch?
    if (settingLabels.some(l => l.includes('Request'))) {
      console.log('[DAU-PROBLEM] "Request-Tracking" - was ist ein Request?');
    }

    // Pro-Modus vorhanden?
    const proMode = page.locator('text=Pro-Modus');
    if (await proMode.isVisible()) {
      console.log('[DAU-Test] Pro-Modus gefunden - ist das kostenpflichtig? Unklar!');
    }

    // Daten-Buttons prüfen
    const dataButtons = await page.locator('#tab-settings button').allTextContents();
    console.log(`[DAU-Test] Daten-Buttons: ${dataButtons.join(', ')}`);

    // PROBLEM-CHECK: "Daten exportieren (JSON)" - was ist JSON?
    if (dataButtons.some(b => b.includes('JSON'))) {
      console.log('[DAU-PROBLEM] "JSON" im Button - technischer Begriff!');
    }
  });

  // ============================================
  // TEST 9: Mobile Responsiveness
  // ============================================
  test('Mobile Responsiveness Test', async ({ page }) => {
    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Screenshot Mobile
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/09-mobile-uebersicht.png'),
      fullPage: true
    });

    // Navigation noch nutzbar?
    const navVisible = await page.locator('.tab-btn').first().isVisible();
    console.log(`[DAU-Test] Mobile Navigation sichtbar: ${navVisible}`);

    // Tabs durchklicken
    for (const tab of ['network', 'history', 'settings']) {
      await page.locator(`[data-tab="${tab}"]`).click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(__dirname, `../test-results/screenshots/09-mobile-${tab}.png`),
        fullPage: true
      });
    }
  });

  // ============================================
  // TEST 10: Fehlende Tooltips / Erklärungen
  // ============================================
  test('Fehlende Tooltips und Erklärungen identifizieren', async ({ page }) => {
    const problemTerms = [
      'Dark Patterns',
      'Consent',
      'CMP',
      'Tracker',
      'Request',
      'CDN',
      'Analytics',
      'Score'
    ];

    const problems = [];

    for (const term of problemTerms) {
      const elements = await page.locator(`text=${term}`).all();
      for (const el of elements) {
        // Prüfe ob ein title-Attribut oder aria-label existiert
        const hasTooltip = await el.evaluate(e =>
          e.title || e.getAttribute('aria-label') || e.closest('[title]')
        );

        if (!hasTooltip) {
          const text = await el.textContent();
          problems.push(`"${term}" ohne Tooltip/Erklärung: "${text?.substring(0, 50)}..."`);
        }
      }
    }

    console.log('[DAU-Test] Fehlende Erklärungen:');
    problems.forEach(p => console.log(`  - ${p}`));
  });

  // ============================================
  // TEST 11: Button-Funktionalität
  // ============================================
  test('Button-Funktionalität: Alle klickbaren Elemente', async ({ page }) => {
    // Zum Einstellungen-Tab
    await page.locator('[data-tab="settings"]').click();
    await page.waitForTimeout(300);

    // Export-Button - funktioniert er?
    const exportBtn = page.locator('#exportData');
    await expect(exportBtn).toBeVisible();

    // Import-Button
    const importBtn = page.locator('#importData');
    await expect(importBtn).toBeVisible();

    // Löschen-Button - Warnung vorhanden?
    const clearBtn = page.locator('#clearData');
    await expect(clearBtn).toBeVisible();

    // Prüfe Button-Styling (Danger-Button rot?)
    const isClearRed = await clearBtn.evaluate(el =>
      el.classList.contains('btn-danger') ||
      window.getComputedStyle(el).backgroundColor.includes('220') // rot
    );
    console.log(`[DAU-Test] Löschen-Button ist rot/warnung: ${isClearRed}`);
  });

  // ============================================
  // TEST 12: Konsistenz der Farb-Badges
  // ============================================
  test('Farb-Badges Konsistenz prüfen', async ({ page }) => {
    // Zum Verlauf-Tab
    await page.locator('[data-tab="history"]').click();
    await page.waitForTimeout(500);

    // Prüfe Badge-Farben
    // Akzeptiert = Rot (schlecht)
    // Abgelehnt = Grün (gut)
    // Angepasst = Gelb (neutral)

    const acceptBadges = await page.locator('.consent-accept-all').count();
    const rejectBadges = await page.locator('.consent-reject-all').count();
    const customBadges = await page.locator('.consent-custom').count();

    console.log(`[DAU-Test] Badge-Verteilung: Accept=${acceptBadges}, Reject=${rejectBadges}, Custom=${customBadges}`);

    // Screenshot der Badges
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/12-badge-farben.png'),
      fullPage: false
    });
  });

  // ============================================
  // TEST 13: Leerer Zustand testen
  // ============================================
  test('Leerer Zustand: Keine Daten', async ({ page }) => {
    // Seite neu laden mit leeren Daten
    await page.addInitScript(() => {
      window.BrowserAPI = {
        runtime: {
          sendMessage: async (msg) => {
            switch(msg.type) {
              case 'GET_CONSENTS': return [];
              case 'GET_SETTINGS': return {};
              case 'GET_REQUESTS': return [];
              default: return null;
            }
          }
        },
        storage: { get: async () => ({}), set: async () => {} }
      };
      window.TrackerDB = {
        getTracker: () => null,
        getCategory: () => ({ icon: '⚪', name: 'Unbekannt' }),
        createHumanSummary: () => ({ summary: '', stats: {}, details: [] })
      };
    });

    await page.goto(`file://${DASHBOARD_PATH}`);
    await page.waitForTimeout(500);

    // Screenshot leerer Zustand
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/13-leerer-zustand.png'),
      fullPage: true
    });

    // Prüfe ob hilfreiche Texte für neue User angezeigt werden
    const helpText = await page.locator('text=Keine Aktivität').isVisible();
    console.log(`[DAU-Test] Hilfetext bei leerem Zustand: ${helpText}`);
  });

  // ============================================
  // TEST 14: Details-Akkordeon im Netzwerk-Tab
  // ============================================
  test('Netzwerk-Tab: Details-Akkordeon', async ({ page }) => {
    // Zum Netzwerk-Tab
    await page.locator('[data-tab="network"]').click();
    await page.waitForTimeout(500);

    // Finde das Details-Element
    const details = page.locator('details');

    // Klicke auf Summary um zu öffnen
    await details.locator('summary').click();
    await page.waitForTimeout(300);

    // Screenshot
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/14-details-offen.png'),
      fullPage: true
    });

    // Prüfe ob Inhalt sichtbar ist
    const isOpen = await details.evaluate(el => el.open);
    console.log(`[DAU-Test] Details-Akkordeon geöffnet: ${isOpen}`);
  });

  // ============================================
  // TEST 15: Accessibility-Check
  // ============================================
  test('Accessibility: Grundlegende Checks', async ({ page }) => {
    // Prüfe auf fehlende alt-Texte bei Bildern
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    console.log(`[Accessibility] Bilder ohne alt-Text: ${imagesWithoutAlt}`);

    // Prüfe auf Labels bei Inputs
    const inputsWithoutLabel = await page.locator('input:not([aria-label]):not([id])').count();
    console.log(`[Accessibility] Inputs ohne Label: ${inputsWithoutLabel}`);

    // Prüfe Kontrast von wichtigen Texten (visuell via Screenshot)
    // Fokus-States
    const tabBtn = page.locator('.tab-btn').first();
    await tabBtn.focus();
    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/15-fokus-state.png'),
      fullPage: false
    });

    // Keyboard-Navigation testen
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(__dirname, '../test-results/screenshots/15-keyboard-nav.png'),
      fullPage: true
    });
  });

});
