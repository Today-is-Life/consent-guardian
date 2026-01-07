/**
 * Consent Guardian - Popup Script
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

(function() {
  'use strict';

  // DOM-Elemente
  const elements = {
    currentDomain: document.getElementById('currentDomain'),
    bannerStatus: document.getElementById('bannerStatus'),
    noBanner: document.getElementById('noBanner'),
    loading: document.getElementById('loading'),
    analysisResult: document.getElementById('analysisResult'),
    darkPatterns: document.getElementById('darkPatterns'),
    lastConsent: document.getElementById('lastConsent'),
    lastConsentContent: document.getElementById('lastConsentContent'),
    gdprReset: document.getElementById('gdprReset'),
    gdprResetInfo: document.getElementById('gdprResetInfo'),
    openCookieSettings: document.getElementById('openCookieSettings'),
    statReject: document.getElementById('statReject'),
    statCustom: document.getElementById('statCustom'),
    statAccept: document.getElementById('statAccept'),
    statDarkPatterns: document.getElementById('statDarkPatterns'),
    statDomains: document.getElementById('statDomains'),
    openDashboard: document.getElementById('openDashboard')
  };

  // Aktueller Tab für GDPR-Reset
  let currentTab = null;

  /**
   * Initialisierung
   */
  async function init() {
    // Aktuellen Tab holen
    const [tab] = await BrowserAPI.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
      showNoAccess();
      return;
    }

    currentTab = tab;
    const domain = new URL(tab.url).hostname;
    elements.currentDomain.textContent = domain;

    // Parallel laden
    await Promise.all([
      analyzeCurrentPage(tab),
      loadStats(),
      loadLastConsent(domain),
      checkGDPRLinks(tab)
    ]);

    // Event-Listener
    elements.openDashboard.addEventListener('click', openDashboard);
    elements.openCookieSettings.addEventListener('click', openCookieSettings);
  }

  /**
   * Analysiert die aktuelle Seite
   */
  async function analyzeCurrentPage(tab) {
    elements.loading.classList.remove('hidden');
    elements.noBanner.classList.add('hidden');
    elements.bannerStatus.classList.add('hidden');

    try {
      const response = await BrowserAPI.tabs.sendMessage(tab.id, {
        type: 'GET_CURRENT_ANALYSIS'
      });

      elements.loading.classList.add('hidden');

      if (response && response.hasBanner) {
        showAnalysis(response.analysis);
      } else {
        elements.noBanner.classList.remove('hidden');
      }
    } catch (error) {
      // Fehler wird erwartet wenn Content-Script nicht geladen (z.B. chrome://, about: Seiten)
      // Nur bei echten Fehlern loggen
      if (!error.message?.includes('Receiving end does not exist')) {
        console.warn('Analyse nicht möglich:', error.message);
      }
      elements.loading.classList.add('hidden');
      elements.noBanner.classList.remove('hidden');
      // Sicher den Text ändern
      const pElement = elements.noBanner.querySelector('p');
      if (pElement) {
        pElement.textContent = 'Seite nicht analysierbar';
      }
    }
  }

  /**
   * Zeigt Analyse-Ergebnis
   */
  function showAnalysis(analysis) {
    elements.bannerStatus.classList.remove('hidden');

    // Score-Badge
    const levelColors = {
      danger: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      success: 'bg-green-100 text-green-800 border-green-200'
    };

    const levelIcons = {
      danger: '⚠️',
      warning: '⚡',
      info: 'ℹ️',
      success: '✅'
    };

    elements.analysisResult.innerHTML = `
      <div class="flex items-center gap-3 p-3 rounded-lg border ${levelColors[analysis.summary.level]}">
        <span class="text-2xl">${levelIcons[analysis.summary.level]}</span>
        <div>
          <div class="font-medium">${analysis.summary.title}</div>
          <div class="text-sm opacity-80">${analysis.summary.message}</div>
        </div>
      </div>
      <div class="mt-2 text-center">
        <span class="text-sm text-gray-500">Dark Pattern Score:</span>
        <span class="ml-1 font-bold ${getScoreColor(analysis.score)}">${analysis.score}/100</span>
      </div>
    `;

    // Dark Patterns auflisten
    if (analysis.patterns.length > 0) {
      elements.darkPatterns.innerHTML = `
        <div class="text-sm font-medium text-gray-700 mb-2">Erkannte Patterns:</div>
        ${analysis.patterns.map(p => `
          <div class="flex items-start gap-2 text-sm">
            <span class="text-red-500 mt-0.5">•</span>
            <div>
              <div class="font-medium text-gray-700">${p.name}</div>
              <div class="text-gray-500 text-xs">${p.description}</div>
            </div>
          </div>
        `).join('')}
      `;
    } else {
      elements.darkPatterns.innerHTML = '';
    }
  }

  /**
   * Lädt Statistiken
   */
  async function loadStats() {
    try {
      const stats = await BrowserAPI.runtime.sendMessage({ type: 'GET_STATS' });

      elements.statReject.textContent = stats.rejectAll || 0;
      elements.statCustom.textContent = stats.custom || 0;
      elements.statAccept.textContent = stats.acceptAll || 0;
      elements.statDarkPatterns.textContent = stats.darkPatternsDetected || 0;
      elements.statDomains.textContent = stats.domainsVisited?.length || 0;
    } catch (error) {
      console.error('Stats-Fehler:', error);
    }
  }

  /**
   * Lädt letzten Consent für Domain
   */
  async function loadLastConsent(domain) {
    try {
      const consents = await BrowserAPI.runtime.sendMessage({
        type: 'GET_CONSENTS',
        domain: domain
      });

      if (consents && consents.length > 0) {
        const lastConsent = consents.sort((a, b) => b.timestamp - a.timestamp)[0];
        showLastConsent(lastConsent);
      }
    } catch (error) {
      console.error('Consent-Fehler:', error);
    }
  }

  /**
   * Zeigt letzten Consent
   */
  function showLastConsent(consent) {
    elements.lastConsent.classList.remove('hidden');

    const typeLabels = {
      accept_all: { text: 'Alle akzeptiert', class: 'consent-accept-all' },
      reject_all: { text: 'Alle abgelehnt', class: 'consent-reject-all' },
      custom: { text: 'Angepasst', class: 'consent-custom' },
      detected: { text: 'Banner erkannt', class: 'bg-blue-100 text-blue-800' }
    };

    const type = typeLabels[consent.consentType] || { text: 'Unbekannt', class: '' };
    const date = new Date(consent.timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    elements.lastConsentContent.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="consent-badge ${type.class}">${type.text}</span>
        <span class="text-xs text-gray-400">${date}</span>
      </div>
      ${consent.darkPatternScore > 0 ? `
        <div class="mt-2 text-xs text-gray-500">
          Dark Pattern Score: <span class="${getScoreColor(consent.darkPatternScore)}">${consent.darkPatternScore}</span>
        </div>
      ` : ''}
    `;
  }

  /**
   * Prüft ob GDPR-Reset Links vorhanden sind
   */
  async function checkGDPRLinks(tab) {
    try {
      const response = await BrowserAPI.tabs.sendMessage(tab.id, {
        type: 'FIND_GDPR_LINKS'
      });

      if (response && response.found) {
        showGDPRReset(response);
      }
    } catch (error) {
      console.error('GDPR-Link Suche fehlgeschlagen:', error);
    }
  }

  /**
   * Zeigt GDPR-Reset Option
   */
  function showGDPRReset(gdprInfo) {
    elements.gdprReset.classList.remove('hidden');

    // Info-Text basierend auf Ergebnis
    if (gdprInfo.cmp && gdprInfo.cmp.found && gdprInfo.cmp.name !== 'Unbekannt') {
      elements.gdprResetInfo.textContent = `${gdprInfo.cmp.name} erkannt - direkt öffnen`;
    } else if (gdprInfo.links && gdprInfo.links.length > 0) {
      const firstLink = gdprInfo.links[0];
      elements.gdprResetInfo.textContent = firstLink.text || 'Cookie-Einstellungen öffnen';
    } else {
      elements.gdprResetInfo.textContent = 'Cookie-Einstellungen dieser Seite öffnen';
    }
  }

  /**
   * Öffnet die Cookie-Einstellungen auf der aktuellen Seite
   */
  async function openCookieSettings() {
    if (!currentTab) return;

    try {
      const result = await BrowserAPI.tabs.sendMessage(currentTab.id, {
        type: 'OPEN_GDPR_SETTINGS'
      });

      if (result && result.success) {
        // Popup schließen nach erfolgreichem Öffnen
        window.close();
      } else {
        // Fehler anzeigen
        elements.gdprResetInfo.textContent = result?.error || 'Konnte Einstellungen nicht öffnen';
        elements.gdprResetInfo.classList.add('text-red-500');
      }
    } catch (error) {
      console.error('GDPR-Settings öffnen fehlgeschlagen:', error);
      elements.gdprResetInfo.textContent = 'Fehler beim Öffnen';
      elements.gdprResetInfo.classList.add('text-red-500');
    }
  }

  /**
   * Zeigt "Kein Zugriff" Nachricht
   */
  function showNoAccess() {
    elements.currentDomain.textContent = 'Nicht verfügbar';
    elements.loading.classList.add('hidden');
    elements.noBanner.classList.remove('hidden');
    elements.noBanner.innerHTML = `
      <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
      <p>Extension hat keinen Zugriff auf diese Seite</p>
    `;
  }

  /**
   * Öffnet Dashboard
   */
  function openDashboard() {
    BrowserAPI.tabs.create({
      url: BrowserAPI.runtime.getURL('dashboard/index.html')
    });
    window.close();
  }

  /**
   * Holt Farbe basierend auf Score
   */
  function getScoreColor(score) {
    if (score >= 50) return 'text-red-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  }

  // Starten
  init();
})();
