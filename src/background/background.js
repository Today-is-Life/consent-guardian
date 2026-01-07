/**
 * Consent Guardian - Background Service Worker
 *
 * Verwaltet Extension-weite Funktionen und Kommunikation.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

// Für Firefox Manifest V2 Kompatibilität
if (typeof importScripts === 'function') {
  // Chrome/Safari Service Worker
  importScripts('../lib/browser-api.js', '../lib/storage.js', '../lib/tracker-db.js');
}

(function() {
  'use strict';

  /**
   * Badge-Farben basierend auf Level
   */
  const BADGE_COLORS = {
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#22c55e',
    neutral: '#6b7280'
  };

  /**
   * Request-Cache pro Tab
   * Format: { tabId: { pageUrl, requests: [] } }
   */
  const tabRequests = new Map();

  /**
   * Initialisierung
   */
  async function init() {
    console.log('[ConsentGuardian] Background Script gestartet');

    // Alarm für periodische Statistik-Updates
    BrowserAPI.alarms.create('dailyStats', {
      periodInMinutes: 1440 // Täglich
    });

    // Alarm für periodisches Speichern der Requests (alle 30 Sekunden)
    // Verhindert Datenverlust wenn Service Worker gestoppt wird
    BrowserAPI.alarms.create('saveRequests', {
      periodInMinutes: 0.5 // 30 Sekunden
    });

    // Request-Tracking initialisieren
    await initRequestTracking();
  }

  /**
   * Initialisiert das Third-Party Request Tracking
   */
  async function initRequestTracking() {
    const settings = await ConsentStorage.getSettings();

    if (!settings.trackRequests) {
      console.log('[ConsentGuardian] Request-Tracking deaktiviert');
      return;
    }

    // Prüfen ob webRequest API verfügbar
    const api = typeof browser !== 'undefined' ? browser : chrome;
    if (!api.webRequest) {
      console.log('[ConsentGuardian] webRequest API nicht verfügbar');
      return;
    }

    console.log('[ConsentGuardian] Request-Tracking aktiviert');

    // Request-Listener
    api.webRequest.onCompleted.addListener(
      handleRequest,
      { urls: ['<all_urls>'] }
    );

    // Tab-Navigation: Speichern der gesammelten Requests
    api.webNavigation?.onCommitted?.addListener(handleNavigation);

    // Tab geschlossen: Cleanup
    api.tabs.onRemoved.addListener(handleTabClosed);
  }

  /**
   * Verarbeitet einen abgeschlossenen Request
   */
  function handleRequest(details) {
    // Ignoriere Extension-eigene Requests
    if (details.tabId < 0) return;
    if (details.url.startsWith('chrome-extension://')) return;
    if (details.url.startsWith('moz-extension://')) return;

    // Hole oder erstelle Tab-Eintrag
    if (!tabRequests.has(details.tabId)) {
      tabRequests.set(details.tabId, {
        pageUrl: details.initiator || details.documentUrl || '',
        pageDomain: '',
        requests: []
      });
    }

    const tabData = tabRequests.get(details.tabId);

    // Extrahiere Domain
    let requestDomain = '';
    try {
      requestDomain = new URL(details.url).hostname;
    } catch {
      return;
    }

    // Setze Page-Domain beim ersten Request
    if (!tabData.pageDomain && details.initiator) {
      try {
        tabData.pageDomain = new URL(details.initiator).hostname;
      } catch {
        // Ignorieren
      }
    }

    // Nur Third-Party Requests (andere Domain als die Seite)
    if (tabData.pageDomain && requestDomain === tabData.pageDomain) {
      return;
    }

    // Kategorisiere mit TrackerDB
    const category = typeof TrackerDB !== 'undefined'
      ? TrackerDB.categorize(requestDomain)
      : 'unknown';

    tabData.requests.push({
      url: details.url,
      domain: requestDomain,
      type: details.type, // script, image, xmlhttprequest, etc.
      category: category,
      timestamp: Date.now()
    });
  }

  /**
   * Speichert Requests bei Navigation
   */
  async function handleNavigation(details) {
    // Nur Hauptframe-Navigation
    if (details.frameId !== 0) return;

    const tabId = details.tabId;
    const tabData = tabRequests.get(tabId);

    if (tabData && tabData.requests.length > 0) {
      try {
        await ConsentStorage.saveRequests(tabData.pageUrl, tabData.requests);
        console.log(`[ConsentGuardian] ${tabData.requests.length} Requests gespeichert für ${tabData.pageDomain}`);
      } catch (e) {
        console.error('[ConsentGuardian] Fehler beim Speichern der Requests:', e);
      }
    }

    // Neuen Eintrag für die neue Seite erstellen
    tabRequests.set(tabId, {
      pageUrl: details.url,
      pageDomain: '',
      requests: []
    });

    // Domain setzen
    try {
      const domain = new URL(details.url).hostname;
      tabRequests.get(tabId).pageDomain = domain;
    } catch {
      // Ignorieren
    }
  }

  /**
   * Cleanup bei Tab-Schließung
   */
  async function handleTabClosed(tabId) {
    const tabData = tabRequests.get(tabId);

    if (tabData && tabData.requests.length > 0) {
      try {
        await ConsentStorage.saveRequests(tabData.pageUrl, tabData.requests);
        console.log(`[ConsentGuardian] ${tabData.requests.length} Requests gespeichert (Tab geschlossen)`);
      } catch (e) {
        console.error('[ConsentGuardian] Fehler beim Speichern:', e);
      }
    }

    tabRequests.delete(tabId);
  }

  /**
   * Gruppiert Requests nach Domain
   */
  function groupRequests(requests) {
    const grouped = {};

    for (const req of requests) {
      if (!grouped[req.domain]) {
        grouped[req.domain] = {
          domain: req.domain,
          count: 0,
          types: new Set(),
          category: req.category,
          info: typeof TrackerDB !== 'undefined' ? TrackerDB.getTracker(req.domain) : null
        };
      }
      grouped[req.domain].count++;
      grouped[req.domain].types.add(req.type);
    }

    // Sets zu Arrays konvertieren
    for (const domain in grouped) {
      grouped[domain].types = Array.from(grouped[domain].types);
    }

    return grouped;
  }

  /**
   * Nachrichtenhandler
   */
  BrowserAPI.runtime.onMessage.addListener(async (message, sender) => {
    console.log('[ConsentGuardian] Nachricht empfangen:', message.type);

    switch (message.type) {
      case 'CONSENT_RECORDED':
        return handleConsentRecorded(message.data, sender);

      case 'UPDATE_BADGE':
        return updateBadge(message.data, sender.tab?.id);

      case 'GET_STATS':
        return ConsentStorage.getStats();

      case 'GET_CONSENTS':
        if (message.domain) {
          return ConsentStorage.getConsentsByDomain(message.domain);
        }
        return ConsentStorage.getAllConsents();

      case 'DELETE_CONSENT':
        return ConsentStorage.deleteConsent(message.id);

      case 'EXPORT_DATA':
        return ConsentStorage.exportData();

      case 'IMPORT_DATA':
        return ConsentStorage.importData(message.data);

      case 'GET_SETTINGS':
        return ConsentStorage.getSettings();

      case 'SAVE_SETTINGS':
        return ConsentStorage.saveSettings(message.settings);

      // Third-Party Request Tracking (v1.1)
      case 'GET_REQUESTS':
        if (message.domain) {
          return ConsentStorage.getRequestsByDomain(message.domain);
        }
        return ConsentStorage.getAllRequests();

      case 'GET_GROUPED_REQUESTS':
        return ConsentStorage.getGroupedRequests(message.pageId);

      case 'GET_CURRENT_TAB_REQUESTS':
        // Liefert aktuelle (noch nicht gespeicherte) Requests für einen Tab
        if (message.tabId && tabRequests.has(message.tabId)) {
          const tabData = tabRequests.get(message.tabId);
          return {
            pageUrl: tabData.pageUrl,
            pageDomain: tabData.pageDomain,
            requests: tabData.requests,
            grouped: groupRequests(tabData.requests)
          };
        }
        return { requests: [], grouped: {} };

      case 'CLEAR_REQUESTS':
        return ConsentStorage.clearAllRequests();

      case 'GET_TRACKER_INFO':
        // Holt Info zu einer Domain aus der TrackerDB
        if (typeof TrackerDB !== 'undefined') {
          return TrackerDB.getTracker(message.domain);
        }
        return null;

      case 'ANALYZE_DOMAINS':
        // Analysiert mehrere Domains
        if (typeof TrackerDB !== 'undefined') {
          return TrackerDB.analyzeDomains(message.domains);
        }
        return { byCategory: {}, known: [], unknown: [] };

      case 'PAGE_LINKS_FOUND':
        // GDPR und Privacy Links für eine Seite speichern
        return handlePageLinksFound(message.data);

      case 'GET_PAGE_LINKS':
        // Links für eine Domain abrufen
        return ConsentStorage.getPageLinks(message.domain);

      default:
        return { error: 'Unbekannter Nachrichtentyp' };
    }
  });

  /**
   * Speichert GDPR und Privacy Links für eine Seite
   */
  async function handlePageLinksFound(data) {
    try {
      await ConsentStorage.savePageLinks(data);
      console.log(`[ConsentGuardian] Links gespeichert für ${data.domain}: GDPR=${data.gdprLinks?.length || 0}, Privacy=${data.privacyLinks?.length || 0}`);
      return { success: true };
    } catch (e) {
      console.error('[ConsentGuardian] Fehler beim Speichern der Links:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Verarbeitet erfassten Consent
   */
  async function handleConsentRecorded(consentData, sender) {
    console.log('[ConsentGuardian] Consent erfasst:', consentData);

    // Statistik aktualisieren (wird schon in ConsentStorage gemacht)

    // Badge zurücksetzen nach Consent
    if (sender.tab?.id) {
      await BrowserAPI.action.setBadgeText({
        tabId: sender.tab.id,
        text: ''
      });
    }

    // Optional: Benachrichtigung
    const settings = await ConsentStorage.getSettings();
    if (settings.notifications) {
      showNotification(consentData);
    }

    return { success: true };
  }

  /**
   * Aktualisiert das Badge
   */
  async function updateBadge(data, tabId) {
    const { score, level } = data;

    let text = '';
    let color = BADGE_COLORS.neutral;

    if (score > 0) {
      text = score.toString();
      color = BADGE_COLORS[level] || BADGE_COLORS.neutral;
    }

    const details = tabId ? { tabId, text } : { text };
    const colorDetails = tabId ? { tabId, color } : { color };

    await Promise.all([
      BrowserAPI.action.setBadgeText(details),
      BrowserAPI.action.setBadgeBackgroundColor(colorDetails)
    ]);

    return { success: true };
  }

  /**
   * Zeigt Browser-Benachrichtigung
   */
  function showNotification(consentData) {
    // Nur in Browsern mit notifications API
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      const typeText = {
        accept_all: 'Alle akzeptiert',
        reject_all: 'Alle abgelehnt',
        custom: 'Angepasst'
      };

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Consent Guardian',
        message: `${consentData.domain}: ${typeText[consentData.consentType] || 'Erfasst'}`
      });
    }
  }

  /**
   * Alarm-Handler
   */
  BrowserAPI.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'dailyStats') {
      // Könnte für tägliche Reports genutzt werden
      console.log('[ConsentGuardian] Daily stats check');
    } else if (alarm.name === 'saveRequests') {
      // Periodisch alle offenen Tab-Requests speichern
      // Verhindert Datenverlust wenn Service Worker gestoppt wird
      await saveAllPendingRequests();
    }
  });

  /**
   * Speichert alle noch nicht gespeicherten Requests
   */
  async function saveAllPendingRequests() {
    for (const [tabId, tabData] of tabRequests.entries()) {
      if (tabData.requests.length > 0 && tabData.pageUrl) {
        try {
          await ConsentStorage.saveRequests(tabData.pageUrl, tabData.requests);
          // Requests als gespeichert markieren (leeren)
          tabData.requests = [];
        } catch (e) {
          console.error('[ConsentGuardian] Fehler beim periodischen Speichern:', e);
        }
      }
    }
  }

  /**
   * Installation/Update Handler
   */
  if (typeof chrome !== 'undefined' && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.log('[ConsentGuardian] Extension installiert');

        // Standard-Einstellungen setzen
        ConsentStorage.saveSettings({
          notifications: true,
          darkPatternWarnings: true,
          autoAnalyze: true,
          language: 'de'
        });

        // Dashboard öffnen bei Erstinstallation
        BrowserAPI.tabs.create({
          url: BrowserAPI.runtime.getURL('dashboard/index.html')
        });
      } else if (details.reason === 'update') {
        console.log('[ConsentGuardian] Extension aktualisiert auf', chrome.runtime.getManifest().version);
      }
    });
  }

  // Starten
  init();
})();
