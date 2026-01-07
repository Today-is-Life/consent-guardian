/**
 * Consent Guardian - Content Script Main
 *
 * Haupteinstiegspunkt für das Content Script.
 * Koordiniert Banner-Erkennung, Analyse und Speicherung.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

(function() {
  'use strict';

  const DEBUG = true;

  function log(...args) {
    if (DEBUG) {
      console.log('[ConsentGuardian]', ...args);
    }
  }

  /**
   * Initialisiert die Extension
   */
  async function init() {
    log('Initialisiere...');

    // Einstellungen laden
    const settings = await ConsentStorage.getSettings();

    // GDPR + Privacy Links im Hintergrund erfassen (immer, unabhängig von autoAnalyze)
    setTimeout(() => collectPageLinks(), 2000);

    if (!settings.autoAnalyze) {
      log('Auto-Analyse deaktiviert');
      return;
    }

    // Auf Banner warten und beobachten
    const stopWatching = ConsentObserver.watchForBanners(async (banner) => {
      log('Banner gefunden:', banner.type);

      // Dark Pattern Analyse
      const analysis = DarkPatternAnalyzer.analyze(banner);
      log('Analyse:', analysis);

      // Badge aktualisieren
      updateBadge(analysis);

      // AUTOMATISCH SPEICHERN: Banner-Erkennung im Hintergrund
      const autoSaveData = {
        url: window.location.href,
        consentType: 'detected', // Neuer Typ: nur erkannt, keine Entscheidung
        categories: [],
        bannerType: banner.type === 'cmp' ? banner.cmpName : (banner.type || 'generic'),
        darkPatterns: analysis.patterns.map(p => p.name),
        darkPatternScore: analysis.score,
        timestamp: Date.now()
      };

      try {
        await ConsentStorage.saveConsent(autoSaveData);
        log('Banner automatisch gespeichert:', autoSaveData.bannerType);

        // Background-Script benachrichtigen
        await BrowserAPI.runtime.sendMessage({
          type: 'CONSENT_RECORDED',
          data: autoSaveData
        });
      } catch (e) {
        log('Fehler beim Auto-Speichern:', e);
      }

      // Warnung anzeigen wenn nötig
      if (settings.darkPatternWarnings && analysis.score >= 25) {
        showWarning(analysis);
      }

      // Banner weiter beobachten für tatsächliche Klicks
      ConsentObserver.observe(banner, async (consentData) => {
        log('Consent-Klick erfasst:', consentData);

        // Speichern (zusätzlich zum Auto-Save)
        await ConsentStorage.saveConsent(consentData);

        // Background-Script benachrichtigen
        try {
          await BrowserAPI.runtime.sendMessage({
            type: 'CONSENT_RECORDED',
            data: consentData
          });
        } catch (e) {
          log('Fehler beim Senden an Background:', e);
        }
      });
    });

    // Cleanup bei Navigation
    window.addEventListener('beforeunload', () => {
      stopWatching();
      ConsentObserver.stop();
    });

    log('Initialisierung abgeschlossen');
  }

  /**
   * Aktualisiert das Extension-Badge
   */
  async function updateBadge(analysis) {
    try {
      await BrowserAPI.runtime.sendMessage({
        type: 'UPDATE_BADGE',
        data: {
          score: analysis.score,
          level: analysis.summary.level
        }
      });
    } catch (e) {
      log('Badge-Update fehlgeschlagen:', e);
    }
  }

  /**
   * Zeigt Warnung bei Dark Patterns
   */
  function showWarning(analysis) {
    // Prüfen ob schon eine Warnung existiert
    if (document.getElementById('consent-guardian-warning')) {
      return;
    }

    const warning = document.createElement('div');
    warning.id = 'consent-guardian-warning';

    // Inline-Styles um Konflikte zu vermeiden
    warning.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 2147483647;
      background: ${analysis.summary.level === 'danger' ? '#ef4444' : '#f59e0b'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      max-width: 320px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;

    warning.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        #consent-guardian-warning-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
        }
        #consent-guardian-warning-close:hover {
          opacity: 0.8;
        }
      </style>
      <button id="consent-guardian-warning-close" aria-label="Schließen">&times;</button>
      <strong style="display: block; margin-bottom: 4px;">
        ${getWarningIcon(analysis.summary.level)} ${analysis.summary.title}
      </strong>
      <span style="opacity: 0.9; font-size: 13px;">
        ${analysis.summary.message}
      </span>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
        Dark Pattern Score: ${analysis.score}/100
      </div>
    `;

    document.body.appendChild(warning);

    // Close-Button
    document.getElementById('consent-guardian-warning-close').addEventListener('click', () => {
      warning.remove();
    });

    // Auto-Hide nach 10 Sekunden
    setTimeout(() => {
      if (warning.parentNode) {
        warning.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => warning.remove(), 300);
      }
    }, 10000);
  }

  /**
   * Holt passendes Icon für Warnstufe
   */
  function getWarningIcon(level) {
    switch (level) {
      case 'danger': return '⚠️';
      case 'warning': return '⚡';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  }

  /**
   * Sammelt GDPR- und Privacy-Links und sendet sie ans Background-Script
   */
  async function collectPageLinks() {
    try {
      // GDPR/Cookie Settings Links
      let gdprLinks = [];
      let cmpInfo = { found: false };

      if (typeof GDPRLinkFinder !== 'undefined') {
        const rawLinks = GDPRLinkFinder.findLinks();
        gdprLinks = rawLinks.map(l => ({
          type: l.type,
          text: l.text,
          href: l.href || null,
          cmpName: l.cmpName || null
        }));
        cmpInfo = GDPRLinkFinder.detectCMP();
      }

      // Privacy Policy Links finden
      const privacyLinks = findPrivacyLinks();

      // Ans Background-Script senden
      await BrowserAPI.runtime.sendMessage({
        type: 'PAGE_LINKS_FOUND',
        data: {
          url: window.location.href,
          domain: window.location.hostname,
          gdprLinks,
          cmp: cmpInfo,
          privacyLinks,
          timestamp: Date.now()
        }
      });

      log('Page Links gesendet:', { gdprLinks: gdprLinks.length, privacyLinks: privacyLinks.length });
    } catch (e) {
      log('Fehler beim Sammeln der Links:', e);
    }
  }

  /**
   * Findet Privacy Policy / Datenschutz Links
   */
  function findPrivacyLinks() {
    const results = [];

    // Typische Texte für Privacy Links
    const privacyPatterns = [
      // Deutsch
      'datenschutz',
      'datenschutzerklärung',
      'privatsphäre',
      'privacy policy',
      'datenschutzhinweis',
      'datenschutzrichtlinie',
      // Englisch
      'privacy',
      'privacy policy',
      'privacy notice',
      'data protection',
      'data privacy'
    ];

    // Links im Footer suchen (dort sind sie meistens)
    const searchAreas = [
      document.querySelector('footer'),
      document.querySelector('[role="contentinfo"]'),
      document.querySelector('.footer'),
      document.querySelector('#footer'),
      document // Fallback: ganzes Dokument
    ].filter(Boolean);

    for (const area of searchAreas) {
      const links = area.querySelectorAll('a[href]');

      for (const link of links) {
        const text = (link.textContent || '').toLowerCase().trim();
        const href = (link.getAttribute('href') || '').toLowerCase();

        for (const pattern of privacyPatterns) {
          if (text.includes(pattern) || href.includes(pattern)) {
            // Absolute URL erstellen
            let fullUrl = link.href;
            try {
              fullUrl = new URL(link.getAttribute('href'), window.location.origin).href;
            } catch (e) {
              fullUrl = link.href;
            }

            // Duplikate vermeiden
            if (!results.some(r => r.href === fullUrl)) {
              results.push({
                text: link.textContent.trim().substring(0, 50),
                href: fullUrl,
                type: 'privacy'
              });
            }
            break;
          }
        }
      }

      // Wenn im Footer gefunden, nicht weitersuchen
      if (results.length > 0 && area !== document) {
        break;
      }
    }

    return results;
  }

  /**
   * Nachrichtenhandler für Kommunikation mit Popup/Background
   */
  BrowserAPI.runtime.onMessage.addListener((message, sender) => {
    switch (message.type) {
      case 'GET_CURRENT_ANALYSIS':
        const banner = BannerDetector.detect();
        if (banner) {
          const analysis = DarkPatternAnalyzer.analyze(banner);
          return Promise.resolve({
            hasBanner: true,
            analysis,
            url: window.location.href
          });
        }
        return Promise.resolve({
          hasBanner: false,
          url: window.location.href
        });

      case 'GET_PAGE_INFO':
        return Promise.resolve({
          url: window.location.href,
          domain: window.location.hostname,
          title: document.title
        });

      case 'FIND_GDPR_LINKS':
        // GDPR-Reset Links auf der Seite suchen
        if (typeof GDPRLinkFinder !== 'undefined') {
          const links = GDPRLinkFinder.findLinks();
          const cmpInfo = GDPRLinkFinder.detectCMP();
          return Promise.resolve({
            found: links.length > 0 || cmpInfo.found,
            links: links.map(l => ({
              type: l.type,
              text: l.text,
              href: l.href || null,
              cmpName: l.cmpName || null
            })),
            cmp: cmpInfo
          });
        }
        return Promise.resolve({ found: false, links: [], cmp: { found: false } });

      case 'OPEN_GDPR_SETTINGS':
        // Cookie-Einstellungen öffnen
        if (typeof GDPRLinkFinder !== 'undefined') {
          const result = GDPRLinkFinder.openBestOption();
          return Promise.resolve(result);
        }
        return Promise.resolve({ success: false, error: 'GDPRLinkFinder nicht verfügbar' });

      default:
        return Promise.resolve(null);
    }
  });

  // Starten wenn DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
