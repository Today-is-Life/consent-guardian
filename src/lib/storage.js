/**
 * Consent Guardian - Storage Layer
 *
 * Verwaltet die lokale Speicherung von Consent-Entscheidungen.
 * Verwendet die BrowserAPI für Cross-Browser-Kompatibilität.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const ConsentStorage = (function() {
  'use strict';

  const STORAGE_KEYS = {
    CONSENTS: 'consent_history',
    SETTINGS: 'settings',
    STATS: 'statistics',
    REQUESTS: 'third_party_requests',
    PAGE_LINKS: 'page_links'
  };

  /**
   * Free-Version Limits
   */
  const FREE_LIMITS = {
    historyLimit: 50,
    requestsPerPage: 10 // Gruppiert
  };

  /**
   * Default-Einstellungen
   */
  const DEFAULT_SETTINGS = {
    notifications: true,
    darkPatternWarnings: true,
    autoAnalyze: true,
    trackRequests: true,
    language: 'de',
    // Pro-Features (Default: An für Entwicklung)
    proMode: true,
    requestView: 'grouped' // 'grouped' oder 'detailed' (Pro)
  };

  /**
   * Generiert eine eindeutige ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Extrahiert Domain aus URL
   */
  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  return {
    /**
     * Speichert eine Consent-Entscheidung
     * @param {Object} consent - Consent-Daten
     * @returns {Promise<Object>} - Gespeicherter Consent mit ID
     */
    async saveConsent(consent) {
      const consents = await this.getAllConsents();

      const newConsent = {
        id: generateId(),
        domain: extractDomain(consent.url || ''),
        url: consent.url,
        timestamp: Date.now(),
        consentType: consent.consentType, // 'accept_all', 'reject_all', 'custom'
        categories: consent.categories || [],
        darkPatterns: consent.darkPatterns || [],
        darkPatternScore: consent.darkPatternScore || 0,
        bannerType: consent.bannerType || 'unknown',
        rawData: consent.rawData || null
      };

      consents.push(newConsent);

      await BrowserAPI.storage.set({
        [STORAGE_KEYS.CONSENTS]: consents
      });

      // Statistiken aktualisieren
      await this.updateStats(newConsent);

      return newConsent;
    },

    /**
     * Holt alle Consent-Entscheidungen
     * @returns {Promise<Array>}
     */
    async getAllConsents() {
      const result = await BrowserAPI.storage.get(STORAGE_KEYS.CONSENTS);
      return result[STORAGE_KEYS.CONSENTS] || [];
    },

    /**
     * Holt Consents für eine bestimmte Domain
     * @param {string} domain
     * @returns {Promise<Array>}
     */
    async getConsentsByDomain(domain) {
      const consents = await this.getAllConsents();
      return consents.filter(c => c.domain === domain);
    },

    /**
     * Holt den letzten Consent für eine Domain
     * @param {string} domain
     * @returns {Promise<Object|null>}
     */
    async getLastConsentForDomain(domain) {
      const consents = await this.getConsentsByDomain(domain);
      if (consents.length === 0) return null;

      return consents.sort((a, b) => b.timestamp - a.timestamp)[0];
    },

    /**
     * Löscht einen Consent
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteConsent(id) {
      const consents = await this.getAllConsents();
      const filtered = consents.filter(c => c.id !== id);

      if (filtered.length === consents.length) {
        return false;
      }

      await BrowserAPI.storage.set({
        [STORAGE_KEYS.CONSENTS]: filtered
      });

      return true;
    },

    /**
     * Löscht alle Consents für eine Domain
     * @param {string} domain
     * @returns {Promise<number>} - Anzahl gelöschter Einträge
     */
    async deleteConsentsByDomain(domain) {
      const consents = await this.getAllConsents();
      const filtered = consents.filter(c => c.domain !== domain);
      const deletedCount = consents.length - filtered.length;

      await BrowserAPI.storage.set({
        [STORAGE_KEYS.CONSENTS]: filtered
      });

      return deletedCount;
    },

    /**
     * Löscht alle Consents
     * @returns {Promise<void>}
     */
    async clearAllConsents() {
      await BrowserAPI.storage.set({
        [STORAGE_KEYS.CONSENTS]: []
      });
    },

    /**
     * Holt Einstellungen
     * @returns {Promise<Object>}
     */
    async getSettings() {
      const result = await BrowserAPI.storage.get(STORAGE_KEYS.SETTINGS);
      return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
    },

    /**
     * Speichert Einstellungen
     * @param {Object} settings
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
      const current = await this.getSettings();
      await BrowserAPI.storage.set({
        [STORAGE_KEYS.SETTINGS]: { ...current, ...settings }
      });
    },

    /**
     * Holt Statistiken
     * @returns {Promise<Object>}
     */
    async getStats() {
      const result = await BrowserAPI.storage.get(STORAGE_KEYS.STATS);
      return result[STORAGE_KEYS.STATS] || {
        totalConsents: 0,
        acceptAll: 0,
        rejectAll: 0,
        custom: 0,
        darkPatternsDetected: 0,
        domainsVisited: []
      };
    },

    /**
     * Aktualisiert Statistiken
     * @param {Object} consent
     * @returns {Promise<void>}
     */
    async updateStats(consent) {
      const stats = await this.getStats();

      stats.totalConsents++;

      switch (consent.consentType) {
        case 'accept_all':
          stats.acceptAll++;
          break;
        case 'reject_all':
          stats.rejectAll++;
          break;
        case 'custom':
          stats.custom++;
          break;
        case 'detected':
          stats.detected = (stats.detected || 0) + 1;
          break;
      }

      if (consent.darkPatterns && consent.darkPatterns.length > 0) {
        stats.darkPatternsDetected += consent.darkPatterns.length;
      }

      if (!stats.domainsVisited.includes(consent.domain)) {
        stats.domainsVisited.push(consent.domain);
      }

      await BrowserAPI.storage.set({
        [STORAGE_KEYS.STATS]: stats
      });
    },

    /**
     * Exportiert alle Daten als JSON
     * @returns {Promise<Object>}
     */
    async exportData() {
      const [consents, settings, stats] = await Promise.all([
        this.getAllConsents(),
        this.getSettings(),
        this.getStats()
      ]);

      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        consents,
        settings,
        stats
      };
    },

    /**
     * Importiert Daten aus JSON
     * @param {Object} data
     * @returns {Promise<void>}
     */
    async importData(data) {
      if (data.consents) {
        await BrowserAPI.storage.set({
          [STORAGE_KEYS.CONSENTS]: data.consents
        });
      }
      if (data.settings) {
        await BrowserAPI.storage.set({
          [STORAGE_KEYS.SETTINGS]: data.settings
        });
      }
      if (data.stats) {
        await BrowserAPI.storage.set({
          [STORAGE_KEYS.STATS]: data.stats
        });
      }
    },

    // =========================================
    // Third-Party Request Tracking (v1.1)
    // =========================================

    /**
     * Speichert Third-Party Requests für eine Seite
     * @param {string} pageUrl - URL der besuchten Seite
     * @param {Array} requests - Array von Request-Objekten
     * @returns {Promise<Object>}
     */
    async saveRequests(pageUrl, requests) {
      const settings = await this.getSettings();
      const allRequests = await this.getAllRequests();
      const pageDomain = extractDomain(pageUrl);

      const entry = {
        id: generateId(),
        pageUrl,
        pageDomain,
        timestamp: Date.now(),
        requests: requests.map(r => ({
          url: r.url,
          domain: extractDomain(r.url),
          type: r.type, // script, image, xhr, etc.
          category: r.category || 'unknown',
          blocked: r.blocked || false
        }))
      };

      allRequests.push(entry);

      // Historie-Limit anwenden (nur bei Free)
      let limitedRequests = allRequests;
      if (!settings.proMode) {
        limitedRequests = allRequests.slice(-FREE_LIMITS.historyLimit);
      }

      await BrowserAPI.storage.set({
        [STORAGE_KEYS.REQUESTS]: limitedRequests
      });

      return entry;
    },

    /**
     * Holt alle Third-Party Requests
     * @returns {Promise<Array>}
     */
    async getAllRequests() {
      const result = await BrowserAPI.storage.get(STORAGE_KEYS.REQUESTS);
      return result[STORAGE_KEYS.REQUESTS] || [];
    },

    /**
     * Holt Requests für eine bestimmte Domain
     * @param {string} domain
     * @returns {Promise<Array>}
     */
    async getRequestsByDomain(domain) {
      const requests = await this.getAllRequests();
      return requests.filter(r => r.pageDomain === domain);
    },

    /**
     * Holt gruppierte Third-Party Domains für eine Seite
     * @param {string} pageId - ID des Request-Eintrags
     * @returns {Promise<Object>} - { domain: { count, types, category } }
     */
    async getGroupedRequests(pageId) {
      const requests = await this.getAllRequests();
      const entry = requests.find(r => r.id === pageId);

      if (!entry) return {};

      const grouped = {};
      for (const req of entry.requests) {
        if (!grouped[req.domain]) {
          grouped[req.domain] = {
            domain: req.domain,
            count: 0,
            types: new Set(),
            category: req.category,
            urls: []
          };
        }
        grouped[req.domain].count++;
        grouped[req.domain].types.add(req.type);
        grouped[req.domain].urls.push(req.url);
      }

      // Sets zu Arrays konvertieren
      for (const domain in grouped) {
        grouped[domain].types = Array.from(grouped[domain].types);
      }

      return grouped;
    },

    /**
     * Löscht alle Request-Daten
     * @returns {Promise<void>}
     */
    async clearAllRequests() {
      await BrowserAPI.storage.set({
        [STORAGE_KEYS.REQUESTS]: []
      });
    },

    /**
     * Prüft ob Pro-Modus aktiv ist
     * @returns {Promise<boolean>}
     */
    async isProMode() {
      const settings = await this.getSettings();
      return settings.proMode === true;
    },

    /**
     * Holt die Free-Version Limits
     * @returns {Object}
     */
    getFreeLimits() {
      return { ...FREE_LIMITS };
    },

    // =========================================
    // Page Links (GDPR + Privacy) v1.2
    // =========================================

    /**
     * Speichert GDPR und Privacy Links für eine Domain
     * @param {Object} data - { domain, url, gdprLinks, privacyLinks, cmp }
     * @returns {Promise<void>}
     */
    async savePageLinks(data) {
      const allLinks = await this.getAllPageLinks();

      // Bestehenden Eintrag für Domain aktualisieren oder neuen erstellen
      const existingIndex = allLinks.findIndex(l => l.domain === data.domain);

      const entry = {
        domain: data.domain,
        url: data.url,
        gdprLinks: data.gdprLinks || [],
        privacyLinks: data.privacyLinks || [],
        cmp: data.cmp || { found: false },
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        // Nur updaten wenn neue Links gefunden wurden
        const existing = allLinks[existingIndex];
        if (entry.gdprLinks.length > 0 || entry.privacyLinks.length > 0 ||
            entry.cmp.found || !existing.gdprLinks?.length) {
          allLinks[existingIndex] = entry;
        }
      } else {
        allLinks.push(entry);
      }

      // Auf maximal 200 Domains begrenzen
      const limited = allLinks.slice(-200);

      await BrowserAPI.storage.set({
        [STORAGE_KEYS.PAGE_LINKS]: limited
      });
    },

    /**
     * Holt alle gespeicherten Page Links
     * @returns {Promise<Array>}
     */
    async getAllPageLinks() {
      const result = await BrowserAPI.storage.get(STORAGE_KEYS.PAGE_LINKS);
      return result[STORAGE_KEYS.PAGE_LINKS] || [];
    },

    /**
     * Holt Page Links für eine bestimmte Domain
     * @param {string} domain
     * @returns {Promise<Object|null>}
     */
    async getPageLinks(domain) {
      const allLinks = await this.getAllPageLinks();
      return allLinks.find(l => l.domain === domain) || null;
    }
  };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsentStorage;
} else if (typeof window !== 'undefined') {
  window.ConsentStorage = ConsentStorage;
}
