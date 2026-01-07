/**
 * Consent Guardian - Consent Observer
 *
 * Beobachtet Consent-Entscheidungen des Nutzers und erfasst diese.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const ConsentObserver = (function() {
  'use strict';

  let isObserving = false;
  let currentBanner = null;
  let clickHandler = null;

  /**
   * Bestimmt den Consent-Typ basierend auf dem geklickten Button
   */
  function determineConsentType(button, banner) {
    if (!button || !banner) return 'unknown';

    // Prüfe gegen bekannte Buttons
    if (banner.buttons) {
      if (banner.buttons.accept && banner.buttons.accept.contains(button)) {
        return 'accept_all';
      }
      if (banner.buttons.reject && banner.buttons.reject.contains(button)) {
        return 'reject_all';
      }
      if (banner.buttons.settings && banner.buttons.settings.contains(button)) {
        return 'custom';
      }
    }

    // Fallback: Text-Analyse
    const text = (button.textContent || '').toLowerCase();

    if (/accept|akzeptieren|alle akzeptieren|allow all|agree|zustimmen|einverstanden/i.test(text)) {
      return 'accept_all';
    }

    if (/reject|ablehnen|alle ablehnen|deny all|decline|verweigern/i.test(text)) {
      return 'reject_all';
    }

    if (/settings|einstellungen|manage|anpassen|customize|save|speichern|auswahl/i.test(text)) {
      return 'custom';
    }

    return 'unknown';
  }

  /**
   * Extrahiert ausgewählte Kategorien aus dem Banner
   */
  function extractCategories(bannerElement) {
    const categories = [];

    if (!bannerElement) return categories;

    // Suche nach Checkboxen
    const checkboxes = bannerElement.querySelectorAll(
      'input[type="checkbox"], [role="checkbox"], [role="switch"]'
    );

    checkboxes.forEach(checkbox => {
      const isChecked = checkbox.checked ||
                       checkbox.getAttribute('aria-checked') === 'true';

      // Finde Label
      let label = '';
      const labelElement = checkbox.closest('label') ||
                          bannerElement.querySelector(`label[for="${checkbox.id}"]`);

      if (labelElement) {
        label = labelElement.textContent.trim();
      } else {
        // Aria-Label als Fallback
        label = checkbox.getAttribute('aria-label') || '';
      }

      if (label) {
        categories.push({
          name: label,
          enabled: isChecked,
          type: categorizeConsent(label)
        });
      }
    });

    return categories;
  }

  /**
   * Kategorisiert einen Consent-Namen
   */
  function categorizeConsent(name) {
    const lowerName = name.toLowerCase();

    if (/essential|notwendig|erforderlich|necessary|required/i.test(lowerName)) {
      return 'essential';
    }
    if (/functional|funktional|preferences|präferenzen/i.test(lowerName)) {
      return 'functional';
    }
    if (/analytics|statistik|statistics|performance/i.test(lowerName)) {
      return 'analytics';
    }
    if (/marketing|werbung|advertising|targeting/i.test(lowerName)) {
      return 'marketing';
    }
    if (/social|sozial/i.test(lowerName)) {
      return 'social';
    }

    return 'other';
  }

  /**
   * Erstellt Click-Handler für Banner-Buttons
   */
  function createClickHandler(banner, callback) {
    return function(event) {
      const target = event.target;

      // Prüfe ob Klick innerhalb des Banners war
      if (!banner.element.contains(target)) return;

      // Prüfe ob es ein Button war
      const button = target.closest('button, a[role="button"], [type="submit"], .btn');
      if (!button) return;

      // Consent-Daten sammeln
      const consentType = determineConsentType(button, banner);

      // Bei "unknown" nicht erfassen
      if (consentType === 'unknown') return;

      const consentData = {
        url: window.location.href,
        consentType: consentType,
        categories: extractCategories(banner.element),
        bannerType: banner.type === 'cmp' ? banner.cmpName : 'generic',
        timestamp: Date.now()
      };

      console.log('[ConsentGuardian] Consent erfasst:', consentData);

      // Callback aufrufen
      if (callback) {
        callback(consentData);
      }
    };
  }

  return {
    /**
     * Startet die Beobachtung eines Banners
     * @param {Object} banner - Banner-Objekt vom BannerDetector
     * @param {Function} onConsent - Callback bei Consent-Entscheidung
     */
    observe(banner, onConsent) {
      if (!banner || !banner.element) {
        console.warn('[ConsentGuardian] Kein Banner zum Beobachten');
        return;
      }

      // Alte Beobachtung stoppen
      this.stop();

      currentBanner = banner;
      isObserving = true;

      // Click-Handler erstellen und registrieren
      clickHandler = createClickHandler(banner, (consentData) => {
        // Dark Pattern Analyse hinzufügen
        const analysis = DarkPatternAnalyzer.analyze(banner);
        consentData.darkPatterns = analysis.patterns.map(p => p.name);
        consentData.darkPatternScore = analysis.score;

        // Callback
        if (onConsent) {
          onConsent(consentData);
        }

        // Beobachtung stoppen nach Consent
        this.stop();
      });

      // Event-Listener auf Document-Level (für Event Delegation)
      document.addEventListener('click', clickHandler, true);

      console.log('[ConsentGuardian] Banner-Beobachtung gestartet');
    },

    /**
     * Stoppt die Beobachtung
     */
    stop() {
      if (clickHandler) {
        document.removeEventListener('click', clickHandler, true);
        clickHandler = null;
      }

      isObserving = false;
      currentBanner = null;

      console.log('[ConsentGuardian] Banner-Beobachtung gestoppt');
    },

    /**
     * Prüft ob gerade beobachtet wird
     */
    isObserving() {
      return isObserving;
    },

    /**
     * Holt den aktuell beobachteten Banner
     */
    getCurrentBanner() {
      return currentBanner;
    },

    /**
     * Beobachtet auf neue Banner (z.B. nach Navigation)
     * @param {Function} onBannerFound - Callback wenn Banner gefunden
     * @param {number} interval - Prüfintervall in ms
     */
    watchForBanners(onBannerFound, interval = 1000) {
      let lastBannerElement = null;

      const checkForBanner = () => {
        const banner = BannerDetector.detect();

        if (banner && banner.element !== lastBannerElement) {
          lastBannerElement = banner.element;
          console.log('[ConsentGuardian] Neuer Banner erkannt');

          if (onBannerFound) {
            onBannerFound(banner);
          }
        }
      };

      // Initial prüfen
      setTimeout(checkForBanner, 500);

      // Periodisch prüfen
      const watcherId = setInterval(checkForBanner, interval);

      // MutationObserver für DOM-Änderungen
      const observer = new MutationObserver((mutations) => {
        // Nur prüfen wenn neue Nodes hinzugefügt wurden
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (hasNewNodes) {
          checkForBanner();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Cleanup-Funktion zurückgeben
      return () => {
        clearInterval(watcherId);
        observer.disconnect();
      };
    }
  };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsentObserver;
} else if (typeof window !== 'undefined') {
  window.ConsentObserver = ConsentObserver;
}
