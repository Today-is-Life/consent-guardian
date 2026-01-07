/**
 * Consent Guardian - GDPR Reset Link Finder
 *
 * Sucht nach Links/Buttons um Cookie-Einstellungen zu ändern.
 * Diese sind oft versteckt - wir machen sie sichtbar!
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const GDPRLinkFinder = (function() {
  'use strict';

  /**
   * Typische Texte für Cookie-Einstellungs-Links (DE + EN)
   */
  const LINK_PATTERNS = [
    // Deutsch
    'cookie-einstellungen',
    'cookie einstellungen',
    'cookies verwalten',
    'cookies anpassen',
    'datenschutz-einstellungen',
    'datenschutzeinstellungen',
    'privatsphäre-einstellungen',
    'einstellungen ändern',
    'einwilligung ändern',
    'einwilligung widerrufen',
    'consent ändern',
    'präferenzen',
    'cookie-präferenzen',

    // Englisch
    'cookie settings',
    'cookie preferences',
    'manage cookies',
    'privacy settings',
    'privacy preferences',
    'change consent',
    'update preferences',
    'manage preferences',
    'do not sell',
    'opt out',
    'your privacy choices'
  ];

  /**
   * CSS-Klassen die auf Cookie-Einstellungen hindeuten
   */
  const CLASS_PATTERNS = [
    // Generisch
    'cookie-settings',
    'cookie-preferences',
    'privacy-settings',
    'consent-settings',
    'cookie-consent-settings',
    'gdpr-settings',
    'privacy-preferences',

    // OneTrust
    'ot-sdk-show-settings',
    'optanon-toggle',
    'optanon-show-settings',

    // CookieYes
    'cky-btn-revisit',
    'cky-preference-btn',

    // Cookie Consent (OSS)
    'cc-revoke',
    'cc-btn-reset',

    // Sourcepoint
    'sp-cmp',
    'sp-preferences',

    // Quantcast
    'qc-cmp',
    'qc-cmp-showing',

    // iubenda
    'iubenda-cs-preferences',
    'iubenda-cs-preferences-link',

    // Termly
    'termly-cookie-preference',
    'termly-display-preferences',

    // Osano
    'osano-cm-dialog-open',
    'osano-cm-widget',

    // Klaro
    'klaro-show',
    'klaro-btn',

    // tarteaucitron
    'tarteaucitron',
    'tarteaucitronOpenPanel',
    'tac_activate',

    // Didomi
    'didomi',
    'didomi-popup-open',

    // Borlabs Cookie (WordPress)
    'borlabs-cookie-preference',
    'BorlabsCookie',

    // Complianz (WordPress)
    'cmplz-manage-consent',
    'cmplz-manage-cookies',
    'cmplz-show-banner',

    // Real Cookie Banner (WordPress)
    'rcb-revoke-link',
    'rcb-btn-accept',

    // Consentmanager
    'cmpboxreconsent',
    'cmpboxbtnyes',

    // Axeptio
    'axeptio_btn_open',
    'axeptio-widget',

    // Cookie Information
    'coi-banner-settings',
    'coi-consent-banner',

    // CookieFirst
    'cf-open-preferences',
    'cookiefirst-root',

    // Admiral
    'admiral-cmp',
    'admiral-open-settings',

    // Civic Cookie Control
    'ccc-notify-button',
    'ccc-module',

    // Evidon/Crownpeak
    'evidon-banner',
    'evidon-prefdiag-button',

    // Google Funding Choices
    'fc-cta-manage-options',
    'fc-dialog',

    // Piwik PRO
    'ppms_cm_open_form',

    // Shopify
    'shopify-privacy-banner',

    // Enzuzo
    'ez-cookie-banner',
    'ez-manage-preferences'
  ];

  /**
   * Bekannte CMP-Funktionen die man aufrufen kann
   * Sortiert nach Verbreitung
   */
  const CMP_FUNCTIONS = [
    // Große kommerzielle CMPs
    { name: 'OneTrust', check: () => typeof OneTrust !== 'undefined', open: () => OneTrust.ToggleInfoDisplay() },
    { name: 'Cookiebot', check: () => typeof Cookiebot !== 'undefined', open: () => Cookiebot.renew() },
    { name: 'Usercentrics', check: () => typeof UC_UI !== 'undefined', open: () => UC_UI.showSecondLayer() },
    { name: 'Didomi', check: () => typeof Didomi !== 'undefined', open: () => Didomi.preferences.show() },
    { name: 'Sourcepoint', check: () => typeof _sp_ !== 'undefined', open: () => _sp_.gdpr.loadPrivacyManagerModal() },
    { name: 'TrustArc', check: () => typeof truste !== 'undefined', open: () => truste.eu.clickListener() },
    { name: 'Quantcast', check: () => typeof __tcfapi !== 'undefined', open: () => __tcfapi('displayConsentUi', 2, () => {}) },

    // Weitere kommerzielle CMPs
    { name: 'iubenda', check: () => typeof _iub !== 'undefined' && _iub.cs, open: () => _iub.cs.api.openPreferences() },
    { name: 'Osano', check: () => typeof Osano !== 'undefined', open: () => Osano.cm.showDrawer() },
    { name: 'CookieYes', check: () => typeof revisitCkyConsent !== 'undefined', open: () => revisitCkyConsent() },
    { name: 'Termly', check: () => typeof Termly !== 'undefined', open: () => Termly.displayPreferenceModal() },
    { name: 'Axeptio', check: () => typeof axeptio !== 'undefined', open: () => axeptio.openCookies() },
    { name: 'Consentmanager', check: () => typeof cmp_cmpc !== 'undefined', open: () => cmp_cmpc() },
    { name: 'Cookie Information', check: () => typeof CookieInformation !== 'undefined', open: () => CookieInformation.renew() },
    { name: 'CookieFirst', check: () => typeof CookieFirst !== 'undefined', open: () => CookieFirst.openPanel() },

    // Open Source CMPs
    { name: 'Klaro', check: () => typeof klaro !== 'undefined', open: () => klaro.show() },
    { name: 'tarteaucitron', check: () => typeof tarteaucitron !== 'undefined', open: () => tarteaucitron.userInterface.openPanel() },
    { name: 'Cookie Consent (OSS)', check: () => typeof CookieConsent !== 'undefined' && CookieConsent.showSettings, open: () => CookieConsent.showSettings() },

    // WordPress Plugins
    { name: 'Borlabs Cookie', check: () => typeof BorlabsCookie !== 'undefined', open: () => BorlabsCookie.showCookieBox() },
    { name: 'Complianz', check: () => typeof cmplz_set_banner_status !== 'undefined', open: () => { cmplz_set_banner_status('show'); } },
    { name: 'Real Cookie Banner', check: () => typeof consentApi !== 'undefined', open: () => consentApi.openCustomizer() },
    { name: 'GDPR Cookie Consent', check: () => typeof CLI !== 'undefined', open: () => CLI.showAgain() },
    { name: 'Moove GDPR', check: () => typeof moove_gdpr_show_settings !== 'undefined', open: () => moove_gdpr_show_settings() },

    // Weitere
    { name: 'Admiral', check: () => typeof admiral !== 'undefined' && admiral.cmp, open: () => admiral.cmp.showConsentTool() },
    { name: 'Civic Cookie Control', check: () => typeof CookieControl !== 'undefined', open: () => CookieControl.open() },
    { name: 'Evidon', check: () => typeof evidon !== 'undefined', open: () => evidon.notice.showPreferences() },
    { name: 'Google Funding Choices', check: () => typeof googlefc !== 'undefined', open: () => googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => googlefc.showRevocationMessage() }) },
    { name: 'Piwik PRO', check: () => typeof ppms !== 'undefined' && ppms.cm, open: () => ppms.cm.api('openConsentForm') },
    { name: 'LiveRamp', check: () => typeof __uspapi !== 'undefined', open: () => __uspapi('displayUspUi', 1, () => {}) },
    { name: 'Sirdata', check: () => typeof Sddan !== 'undefined', open: () => Sddan.cmp.displayUI() }
  ];

  /**
   * Findet alle möglichen GDPR-Reset Links/Buttons
   */
  function findLinks() {
    const results = [];

    // 1. Suche nach Text-Matches in Links und Buttons
    const clickables = document.querySelectorAll('a, button, [role="button"], span[onclick], div[onclick]');

    for (const el of clickables) {
      const text = (el.textContent || '').toLowerCase().trim();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const title = (el.getAttribute('title') || '').toLowerCase();

      for (const pattern of LINK_PATTERNS) {
        if (text.includes(pattern) || ariaLabel.includes(pattern) || title.includes(pattern)) {
          results.push({
            type: 'link',
            element: el,
            text: el.textContent.trim().substring(0, 50),
            method: 'click'
          });
          break;
        }
      }
    }

    // 2. Suche nach CSS-Klassen
    for (const className of CLASS_PATTERNS) {
      const elements = document.querySelectorAll(`.${className}, [class*="${className}"]`);
      for (const el of elements) {
        // Duplikate vermeiden
        if (!results.some(r => r.element === el)) {
          results.push({
            type: 'cmp-button',
            element: el,
            text: el.textContent?.trim().substring(0, 50) || className,
            method: 'click'
          });
        }
      }
    }

    // 3. Suche nach CMP-Funktionen
    for (const cmp of CMP_FUNCTIONS) {
      try {
        if (cmp.check()) {
          results.push({
            type: 'cmp-api',
            cmpName: cmp.name,
            text: `${cmp.name} Einstellungen öffnen`,
            method: 'api',
            openFn: cmp.open
          });
        }
      } catch (e) {
        // CMP nicht verfügbar
      }
    }

    // 4. Footer-Links durchsuchen (oft versteckt dort)
    const footer = document.querySelector('footer, [role="contentinfo"], .footer, #footer');
    if (footer) {
      const footerLinks = footer.querySelectorAll('a');
      for (const link of footerLinks) {
        const text = (link.textContent || '').toLowerCase();
        const href = (link.getAttribute('href') || '').toLowerCase();

        if (text.includes('cookie') || text.includes('datenschutz') || text.includes('privacy') ||
            href.includes('cookie') || href.includes('privacy')) {
          if (!results.some(r => r.element === link)) {
            results.push({
              type: 'footer-link',
              element: link,
              text: link.textContent.trim().substring(0, 50),
              href: link.href,
              method: 'navigate'
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Öffnet die Cookie-Einstellungen
   */
  function openSettings(result) {
    try {
      if (result.method === 'api' && result.openFn) {
        result.openFn();
        return { success: true, method: 'api', cmp: result.cmpName };
      }

      if (result.method === 'click' && result.element) {
        result.element.click();
        return { success: true, method: 'click' };
      }

      if (result.method === 'navigate' && result.href) {
        window.location.href = result.href;
        return { success: true, method: 'navigate' };
      }

      return { success: false, error: 'Unbekannte Methode' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Prüft ob ein CMP vorhanden ist und gibt Info zurück
   */
  function detectCMP() {
    for (const cmp of CMP_FUNCTIONS) {
      try {
        if (cmp.check()) {
          return {
            found: true,
            name: cmp.name,
            canOpen: true
          };
        }
      } catch (e) {
        // Ignorieren
      }
    }

    // Fallback: Suche nach bekannten Elementen
    const links = findLinks();
    if (links.length > 0) {
      return {
        found: true,
        name: 'Unbekannt',
        canOpen: true,
        linkCount: links.length
      };
    }

    return { found: false };
  }

  /**
   * Versucht automatisch die beste Option zu öffnen
   */
  function openBestOption() {
    // Priorität: CMP API > CMP Button > Footer Link
    const links = findLinks();

    // Zuerst CMP API versuchen
    const apiOption = links.find(l => l.type === 'cmp-api');
    if (apiOption) {
      return openSettings(apiOption);
    }

    // Dann CMP Button
    const cmpButton = links.find(l => l.type === 'cmp-button');
    if (cmpButton) {
      return openSettings(cmpButton);
    }

    // Dann Link mit "Einstellungen" im Text
    const settingsLink = links.find(l =>
      l.text.toLowerCase().includes('einstellung') ||
      l.text.toLowerCase().includes('settings') ||
      l.text.toLowerCase().includes('präferenz') ||
      l.text.toLowerCase().includes('preference')
    );
    if (settingsLink) {
      return openSettings(settingsLink);
    }

    // Fallback: Ersten Link nehmen
    if (links.length > 0) {
      return openSettings(links[0]);
    }

    return { success: false, error: 'Keine Cookie-Einstellungen gefunden' };
  }

  return {
    findLinks,
    openSettings,
    detectCMP,
    openBestOption,
    CMP_FUNCTIONS,
    LINK_PATTERNS
  };
})();

// Export
if (typeof window !== 'undefined') {
  window.GDPRLinkFinder = GDPRLinkFinder;
}
