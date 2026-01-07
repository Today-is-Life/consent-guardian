/**
 * Consent Guardian - Banner Detector
 *
 * Erkennt Cookie-Consent-Banner auf Webseiten.
 * Unterstützt gängige CMP-Lösungen und generische Banner.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const BannerDetector = (function() {
  'use strict';

  /**
   * Bekannte CMP-Selektoren (Consent Management Platforms)
   * Stand: Januar 2026 - 35+ CMPs unterstützt
   */
  const CMP_SELECTORS = {
    // ==========================================
    // ENTERPRISE CMPs (Große Unternehmen)
    // ==========================================

    // Cookiebot (Cybot)
    cookiebot: {
      name: 'Cookiebot',
      selectors: ['#CybotCookiebotDialog', '#CybotCookiebotDialogBody'],
      acceptButton: '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
      rejectButton: '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll',
      settingsButton: '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection'
    },

    // OneTrust (CookiePro)
    onetrust: {
      name: 'OneTrust',
      selectors: ['#onetrust-consent-sdk', '#onetrust-banner-sdk', '.onetrust-pc-dark-filter'],
      acceptButton: '#onetrust-accept-btn-handler',
      rejectButton: '#onetrust-reject-all-handler',
      settingsButton: '#onetrust-pc-btn-handler'
    },

    // TrustArc (ehemals TRUSTe)
    trustarc: {
      name: 'TrustArc',
      selectors: ['#truste-consent-track', '#truste-consent-content', '.truste_overlay'],
      acceptButton: '.truste-consent-required',
      rejectButton: '.truste-consent-denied',
      settingsButton: '#truste-consent-button'
    },

    // Sourcepoint
    sourcepoint: {
      name: 'Sourcepoint',
      selectors: ['[id^="sp_message_container"]', '.sp_message_container', 'div[class*="sp_message"]'],
      acceptButton: '[title="Accept"]',
      rejectButton: '[title="Reject"]',
      settingsButton: '[title="Options"], [title="Manage"]'
    },

    // LiveRamp
    liveramp: {
      name: 'LiveRamp',
      selectors: ['.faktor-consent', '#faktor-consent-dialog'],
      acceptButton: '.faktor-consent-agree',
      rejectButton: '.faktor-consent-disagree',
      settingsButton: '.faktor-consent-preferences'
    },

    // Commanders Act (TrustCommander)
    commandersact: {
      name: 'Commanders Act',
      selectors: ['#tc-privacy-wrapper', '.tc-privacy-wrapper', '#popin_tc_privacy'],
      acceptButton: '#popin_tc_privacy_button_2',
      rejectButton: '#popin_tc_privacy_button_3',
      settingsButton: '#popin_tc_privacy_button'
    },

    // ==========================================
    // BELIEBTE EUROPÄISCHE CMPs
    // ==========================================

    // Quantcast Choice (TCF)
    quantcast: {
      name: 'Quantcast Choice',
      selectors: ['.qc-cmp2-container', '#qc-cmp2-ui', '.qc-cmp-ui-container'],
      acceptButton: '[data-accept-all]',
      rejectButton: '[data-reject-all]',
      settingsButton: '[data-purposes]'
    },

    // Usercentrics
    usercentrics: {
      name: 'Usercentrics',
      selectors: ['#usercentrics-root', '[data-testid="uc-banner"]', '#uc-banner-modal'],
      acceptButton: '[data-testid="uc-accept-all-button"]',
      rejectButton: '[data-testid="uc-deny-all-button"]',
      settingsButton: '[data-testid="uc-more-button"]'
    },

    // Didomi
    didomi: {
      name: 'Didomi',
      selectors: ['#didomi-popup', '#didomi-host', '#didomi-notice'],
      acceptButton: '#didomi-notice-agree-button',
      rejectButton: '#didomi-notice-disagree-button',
      settingsButton: '#didomi-notice-learn-more-button'
    },

    // Consentmanager.net
    consentmanager: {
      name: 'Consentmanager',
      selectors: ['#cmpbox', '#cmpbox2', '.cmpboxBG'],
      acceptButton: '#cmpbntnotxt',
      rejectButton: '#cmpbntnow',
      settingsButton: '#cmpbntmore'
    },

    // Axeptio
    axeptio: {
      name: 'Axeptio',
      selectors: ['#axeptio_overlay', '.axeptio_widget', '[id^="axeptio"]'],
      acceptButton: '[data-axeptio-action="accept"]',
      rejectButton: '[data-axeptio-action="deny"]',
      settingsButton: '[data-axeptio-action="configure"]'
    },

    // Sirdata
    sirdata: {
      name: 'Sirdata',
      selectors: ['#sd-cmp', '.sd-cmp-container'],
      acceptButton: '.sd-cmp-accept-all',
      rejectButton: '.sd-cmp-reject-all',
      settingsButton: '.sd-cmp-manage'
    },

    // Cookie Information
    cookieinformation: {
      name: 'Cookie Information',
      selectors: ['#coiOverlay', '#coiPage-1', '.coi-banner'],
      acceptButton: '#coiPage-1 .coi-banner__accept',
      rejectButton: '#coiPage-1 .coi-banner__decline',
      settingsButton: '#coiPage-1 .coi-banner__settings'
    },

    // CookieFirst
    cookiefirst: {
      name: 'CookieFirst',
      selectors: ['#cookiefirst-root', '.cookiefirst-root'],
      acceptButton: '[data-cookiefirst-action="accept"]',
      rejectButton: '[data-cookiefirst-action="reject"]',
      settingsButton: '[data-cookiefirst-action="adjust"]'
    },

    // iubenda
    iubenda: {
      name: 'iubenda',
      selectors: ['#iubenda-cs-banner', '.iubenda-cs-container'],
      acceptButton: '.iubenda-cs-accept-btn',
      rejectButton: '.iubenda-cs-reject-btn',
      settingsButton: '.iubenda-cs-customize-btn'
    },

    // Osano
    osano: {
      name: 'Osano',
      selectors: ['.osano-cm-window', '.osano-cm-dialog'],
      acceptButton: '.osano-cm-accept-all',
      rejectButton: '.osano-cm-deny-all',
      settingsButton: '.osano-cm-manage'
    },

    // Termly
    termly: {
      name: 'Termly',
      selectors: ['#termly-code-snippet-support', '.t-consent-banner'],
      acceptButton: '[data-tid="banner-accept"]',
      rejectButton: '[data-tid="banner-decline"]',
      settingsButton: '[data-tid="banner-preferences"]'
    },

    // Admiral
    admiral: {
      name: 'Admiral',
      selectors: ['[id^="admiral-"]', '.admiral-container'],
      acceptButton: '.admiral-accept',
      rejectButton: '.admiral-reject',
      settingsButton: '.admiral-preferences'
    },

    // ==========================================
    // WORDPRESS PLUGINS
    // ==========================================

    // Klaro!
    klaro: {
      name: 'Klaro!',
      selectors: ['.klaro', '.klaro .cookie-modal', '.klaro .cookie-notice'],
      acceptButton: '.klaro .cm-btn-accept, .klaro .cm-btn-accept-all',
      rejectButton: '.klaro .cm-btn-decline',
      settingsButton: '.klaro .cm-btn-info, .klaro .cm-link'
    },

    // Tarteaucitron.js
    tarteaucitron: {
      name: 'Tarteaucitron',
      selectors: ['#tarteaucitronRoot', '#tarteaucitronAlertBig', '.tarteaucitronAlertBig'],
      acceptButton: '#tarteaucitronPersonalize2, #tarteaucitronAllowed',
      rejectButton: '#tarteaucitronAllDenied2, #tarteaucitronDeny',
      settingsButton: '#tarteaucitronCloseAlert, #tarteaucitronPrivacyUrl'
    },

    // CookieYes / Cookie Law Info
    cookieyes: {
      name: 'CookieYes',
      selectors: ['.cky-consent-container', '#cky-consent', '.cli-modal'],
      acceptButton: '[data-cky-tag="accept-button"], .cli_settings_button',
      rejectButton: '[data-cky-tag="reject-button"], .cli_reject_btn',
      settingsButton: '[data-cky-tag="settings-button"], .cli_settings_button'
    },

    // Borlabs Cookie
    borlabs: {
      name: 'Borlabs Cookie',
      selectors: ['#BorlabsCookieBox', '.BorlabsCookie', '[class*="BorlabsCookie"]'],
      acceptButton: '[data-cookie-accept-all], .BorlabsCookie .accept',
      rejectButton: '[data-cookie-refuse], .BorlabsCookie .refuse',
      settingsButton: '[data-cookie-individual], .BorlabsCookie .individual'
    },

    // Complianz GDPR
    complianz: {
      name: 'Complianz',
      selectors: ['.cmplz-cookiebanner', '#cmplz-cookiebanner-container', '.cmplz-consent-banner'],
      acceptButton: '.cmplz-accept, .cmplz-btn.cmplz-accept',
      rejectButton: '.cmplz-deny, .cmplz-btn.cmplz-deny',
      settingsButton: '.cmplz-manage-consent, .cmplz-view-preferences'
    },

    // GDPR Cookie Compliance (Moove)
    moove: {
      name: 'Moove GDPR',
      selectors: ['#moove_gdpr_cookie_info_bar', '.moove-gdpr-info-bar-container'],
      acceptButton: '.moove-gdpr-infobar-allow-all',
      rejectButton: '.moove-gdpr-infobar-reject-all',
      settingsButton: '.moove-gdpr-modal-open, .mgbutton'
    },

    // Cookie Notice by WebToffee
    webtoffee: {
      name: 'WebToffee Cookie Notice',
      selectors: ['#cookie-law-info-bar', '.cli-bar-container'],
      acceptButton: '#cookie_action_close_header, .cli_action_button',
      rejectButton: '#cookie_action_reject, .cli_reject_btn',
      settingsButton: '.cli_settings_button'
    },

    // Real Cookie Banner
    realcookiebanner: {
      name: 'Real Cookie Banner',
      selectors: ['#rcb-banner', '.rcb-banner', '[class*="rcb-banner"]'],
      acceptButton: '[data-action="rcb-accept-all"]',
      rejectButton: '[data-action="rcb-deny-all"]',
      settingsButton: '[data-action="rcb-manage"]'
    },

    // Cookie Script
    cookiescript: {
      name: 'Cookie Script',
      selectors: ['#cookiescript_injected', '.cookiescript_wrapper'],
      acceptButton: '#cookiescript_accept',
      rejectButton: '#cookiescript_reject',
      settingsButton: '#cookiescript_manage'
    },

    // GDPR Cookie Consent (developer.developer)
    developerdevdeveloper: {
      name: 'GDPR Cookie Consent',
      selectors: ['#gdpr-cookie-notice', '.gdpr-cookie-notice-bar'],
      acceptButton: '#gdpr-cookie-accept',
      rejectButton: '#gdpr-cookie-reject',
      settingsButton: '#gdpr-cookie-settings'
    },

    // EU Cookie Law
    eucookielaw: {
      name: 'EU Cookie Law',
      selectors: ['#eu-cookie-law', '.eu-cookie-law-wrapper'],
      acceptButton: '.eu-cookie-law-button',
      rejectButton: '.eu-cookie-law-reject',
      settingsButton: null
    },

    // Cookie Consent by Osano (CookieConsent)
    cookieconsent: {
      name: 'Cookie Consent (OSS)',
      selectors: ['.cc-window', '.cc-banner', '.cc-floating'],
      acceptButton: '.cc-btn.cc-allow, .cc-allow',
      rejectButton: '.cc-btn.cc-deny, .cc-deny',
      settingsButton: '.cc-btn.cc-settings'
    },

    // Civic Cookie Control
    civic: {
      name: 'Civic Cookie Control',
      selectors: ['#ccc', '#ccc-notify', '.ccc-notify-wrapper'],
      acceptButton: '#ccc-recommended-settings, .ccc-accept-button',
      rejectButton: '#ccc-reject, .ccc-reject-button',
      settingsButton: '#ccc-icon, .ccc-settings-icon'
    },

    // ==========================================
    // REGIONALE/SPEZIALISIERTE CMPs
    // ==========================================

    // Evidon/Crownpeak
    evidon: {
      name: 'Evidon/Crownpeak',
      selectors: ['#_evidon_banner', '#evidon-banner', '.evidon-consent-wrapper'],
      acceptButton: '#_evidon-accept-button',
      rejectButton: '#_evidon-decline-button',
      settingsButton: '#_evidon-option-button'
    },

    // SFBX/Sibbo
    sibbo: {
      name: 'Sibbo',
      selectors: ['#sibbo-cmp-layout', '.sibbo-panel'],
      acceptButton: '#sibbo-accept-btn',
      rejectButton: '#sibbo-deny-btn',
      settingsButton: '#sibbo-settings-btn'
    },

    // Funding Choices (Google)
    fundingchoices: {
      name: 'Google Funding Choices',
      selectors: ['.fc-consent-root', '.fc-dialog-container'],
      acceptButton: '.fc-cta-consent',
      rejectButton: '.fc-cta-do-not-consent',
      settingsButton: '.fc-cta-manage-options'
    },

    // CMP by ConsentStack
    consentstack: {
      name: 'ConsentStack',
      selectors: ['#cs-container', '.cs-container'],
      acceptButton: '.cs-accept-all',
      rejectButton: '.cs-reject-all',
      settingsButton: '.cs-more-options'
    },

    // Piwik PRO Consent Manager
    piwikpro: {
      name: 'Piwik PRO',
      selectors: ['#ppms_cm_modal', '.ppms-cm-popup'],
      acceptButton: '.ppms-cm-btn-accept',
      rejectButton: '.ppms-cm-btn-reject',
      settingsButton: '.ppms-cm-btn-customize'
    },

    // Cookiebot Consent Mode (spezielle Version)
    cookiebotconsent: {
      name: 'Cookiebot Consent Mode',
      selectors: ['[id*="Cookiebot"]', '[class*="CookieConsent"]'],
      acceptButton: '[id*="AllowAll"], [class*="accept"]',
      rejectButton: '[id*="DeclineAll"], [class*="decline"]',
      settingsButton: '[id*="Settings"], [class*="settings"]'
    },

    // ==========================================
    // E-COMMERCE PLATTFORMEN
    // ==========================================

    // Shopify Cookie Banner (Native)
    shopifynative: {
      name: 'Shopify Native',
      selectors: ['#shopify-privacy-banner', '.shopify-privacy-banner', '[id*="shopify-section-cookie"]'],
      acceptButton: '[data-marketing-consent-accept]',
      rejectButton: '[data-marketing-consent-decline]',
      settingsButton: '[data-marketing-consent-preferences]'
    },

    // Pandectes GDPR (Shopify)
    pandectes: {
      name: 'Pandectes GDPR',
      selectors: ['#pandectes-banner', '.pandectes-consent-banner', '[class*="pandectes"]'],
      acceptButton: '.pandectes-accept-all',
      rejectButton: '.pandectes-reject-all',
      settingsButton: '.pandectes-customize'
    },

    // Enzuzo (Shopify)
    enzuzo: {
      name: 'Enzuzo',
      selectors: ['#enzuzo-cookie-banner', '.enzuzo-banner', '[id*="enzuzo"]'],
      acceptButton: '.enzuzo-accept',
      rejectButton: '.enzuzo-decline',
      settingsButton: '.enzuzo-preferences'
    },

    // Consentmo (Shopify)
    consentmo: {
      name: 'Consentmo',
      selectors: ['#consentmo-banner', '.consentmo-cookie-banner'],
      acceptButton: '.consentmo-accept-all',
      rejectButton: '.consentmo-reject-all',
      settingsButton: '.consentmo-preferences'
    },

    // GDPR Legal Cookie (Shopify)
    gdprlegalcookie: {
      name: 'GDPR Legal Cookie',
      selectors: ['#illow-cookie-consent', '.illow-banner'],
      acceptButton: '.illow-accept',
      rejectButton: '.illow-decline',
      settingsButton: '.illow-preferences'
    },

    // PrestaShop Cookie Banner
    prestashop: {
      name: 'PrestaShop GDPR',
      selectors: ['#lgcookieslaw_banner', '.lgcookieslaw', '#blockcookies'],
      acceptButton: '.lgcookieslaw_accept',
      rejectButton: '.lgcookieslaw_refuse',
      settingsButton: '.lgcookieslaw_config'
    },

    // Magento Cookie Banner
    magento: {
      name: 'Magento Cookie Notice',
      selectors: ['.cookie-status-message', '.message.cookie', '#notice-cookie-block'],
      acceptButton: '.action.allow',
      rejectButton: '.action.deny',
      settingsButton: '.action.configure'
    },

    // BigCommerce
    bigcommerce: {
      name: 'BigCommerce',
      selectors: ['#cookie-consent-container', '.cookie-consent-notification'],
      acceptButton: '.cookie-consent-accept',
      rejectButton: '.cookie-consent-reject',
      settingsButton: '.cookie-consent-settings'
    },

    // WooCommerce (Germanized)
    woogermanized: {
      name: 'WooCommerce Germanized',
      selectors: ['.woocommerce-gzd-cookie-notice', '#wc-gzd-cookie-notice'],
      acceptButton: '.wc-gzd-cookie-accept',
      rejectButton: '.wc-gzd-cookie-decline',
      settingsButton: '.wc-gzd-cookie-settings'
    },

    // ==========================================
    // CMS-SPEZIFISCHE LÖSUNGEN
    // ==========================================

    // Drupal EU Cookie Compliance
    drupaleu: {
      name: 'Drupal EU Cookie',
      selectors: ['#sliding-popup', '.eu-cookie-compliance-banner', '#eu-cookie-compliance-banner'],
      acceptButton: '.agree-button, .eu-cookie-compliance-agree-button',
      rejectButton: '.decline-button, .eu-cookie-compliance-decline-button',
      settingsButton: '.find-more-button'
    },

    // Drupal GDPR Module
    drupalgdpr: {
      name: 'Drupal GDPR',
      selectors: ['#gdpr-cookie-consent-banner', '.gdpr-cookie-consent'],
      acceptButton: '.gdpr-consent-agree',
      rejectButton: '.gdpr-consent-disagree',
      settingsButton: '.gdpr-consent-settings'
    },

    // Joomla Cookie Confirm
    joomlacookie: {
      name: 'Joomla Cookie Confirm',
      selectors: ['#mod-cookieconfirm', '.mod-cookieconfirm', '#cookie-confirm-container'],
      acceptButton: '.mod-cookieconfirm-accept',
      rejectButton: '.mod-cookieconfirm-decline',
      settingsButton: '.mod-cookieconfirm-settings'
    },

    // Joomla GDPR
    joomlagdpr: {
      name: 'Joomla GDPR',
      selectors: ['#regularlabs_cookieconfirm', '.rl-cookie-consent'],
      acceptButton: '.rl-cookie-accept',
      rejectButton: '.rl-cookie-decline',
      settingsButton: '.rl-cookie-settings'
    },

    // TYPO3 Cookie Consent
    typo3: {
      name: 'TYPO3 Cookie Consent',
      selectors: ['#cookieconsent', '.cookie-consent-banner', '[data-cookieconsent]'],
      acceptButton: '[data-cookieconsent-accept]',
      rejectButton: '[data-cookieconsent-decline]',
      settingsButton: '[data-cookieconsent-settings]'
    },

    // TYPO3 mindshape_cookie_consent
    typo3mindshape: {
      name: 'TYPO3 Mindshape',
      selectors: ['#msCookieConsent', '.msc-cookie-consent'],
      acceptButton: '.msc-accept-all',
      rejectButton: '.msc-deny-all',
      settingsButton: '.msc-show-details'
    },

    // Contao Cookie Bar
    contao: {
      name: 'Contao Cookie Bar',
      selectors: ['#cookie-bar', '.cookie-bar', '#netzhirsch-cookie-opt-in'],
      acceptButton: '.cookie-bar-accept',
      rejectButton: '.cookie-bar-decline',
      settingsButton: '.cookie-bar-settings'
    },

    // Neos CMS Cookie Consent
    neos: {
      name: 'Neos Cookie Consent',
      selectors: ['#neos-cookie-consent', '.neos-cookie-banner'],
      acceptButton: '.neos-cookie-accept',
      rejectButton: '.neos-cookie-decline',
      settingsButton: '.neos-cookie-settings'
    },

    // ==========================================
    // MARKETING PLATTFORMEN
    // ==========================================

    // HubSpot Cookie Banner
    hubspot: {
      name: 'HubSpot',
      selectors: ['#hs-eu-cookie-confirmation', '.hs-cookie-notification'],
      acceptButton: '#hs-eu-confirmation-button',
      rejectButton: '#hs-eu-decline-button',
      settingsButton: '#hs-eu-cookie-settings'
    },

    // Mailchimp GDPR
    mailchimp: {
      name: 'Mailchimp GDPR',
      selectors: ['.mc-banner', '.mc-gdpr-banner'],
      acceptButton: '.mc-banner-accept',
      rejectButton: '.mc-banner-decline',
      settingsButton: '.mc-banner-settings'
    },

    // Salesforce (Krux)
    salesforce: {
      name: 'Salesforce Krux',
      selectors: ['#kx-consent-banner', '.kx-consent'],
      acceptButton: '.kx-accept',
      rejectButton: '.kx-decline',
      settingsButton: '.kx-preferences'
    },

    // Adobe Experience Platform
    adobe: {
      name: 'Adobe Experience',
      selectors: ['#aep-consent-banner', '.aep-consent-wrapper'],
      acceptButton: '.aep-accept',
      rejectButton: '.aep-decline',
      settingsButton: '.aep-preferences'
    },

    // ==========================================
    // WEITERE ENTERPRISE CMPs
    // ==========================================

    // Ketch
    ketch: {
      name: 'Ketch',
      selectors: ['#ketch-consent', '.ketch-consent-banner', '[id*="ketch"]'],
      acceptButton: '[data-ketch-accept]',
      rejectButton: '[data-ketch-reject]',
      settingsButton: '[data-ketch-preferences]'
    },

    // Transcend
    transcend: {
      name: 'Transcend',
      selectors: ['#transcend-consent', '.transcend-consent-banner'],
      acceptButton: '.transcend-accept',
      rejectButton: '.transcend-reject',
      settingsButton: '.transcend-preferences'
    },

    // DataGrail
    datagrail: {
      name: 'DataGrail',
      selectors: ['#datagrail-banner', '.datagrail-consent'],
      acceptButton: '.datagrail-accept',
      rejectButton: '.datagrail-reject',
      settingsButton: '.datagrail-preferences'
    },

    // Securiti
    securiti: {
      name: 'Securiti',
      selectors: ['#securiti-consent-banner', '.securiti-banner'],
      acceptButton: '.securiti-accept',
      rejectButton: '.securiti-reject',
      settingsButton: '.securiti-preferences'
    },

    // CookieHub
    cookiehub: {
      name: 'CookieHub',
      selectors: ['#ch-consent', '.ch-consent-banner', '[id*="cookiehub"]'],
      acceptButton: '.ch-accept',
      rejectButton: '.ch-decline',
      settingsButton: '.ch-settings'
    },

    // Secure Privacy
    secureprivacy: {
      name: 'Secure Privacy',
      selectors: ['#sp-consent-banner', '.sp-consent-wrapper'],
      acceptButton: '.sp-accept-all',
      rejectButton: '.sp-reject-all',
      settingsButton: '.sp-preferences'
    },

    // Metomic
    metomic: {
      name: 'Metomic',
      selectors: ['#metomic-cookie-banner', '.metomic-banner'],
      acceptButton: '.metomic-accept',
      rejectButton: '.metomic-reject',
      settingsButton: '.metomic-preferences'
    },

    // ==========================================
    // REGIONALE CMPs (NACH LAND)
    // ==========================================

    // UK: Privacy Notice (ICO compliant)
    ukico: {
      name: 'UK ICO Compliant',
      selectors: ['#ico-consent-banner', '.ico-cookie-notice'],
      acceptButton: '.ico-accept',
      rejectButton: '.ico-reject',
      settingsButton: '.ico-preferences'
    },

    // France: CNIL Compliant
    cnilcompliant: {
      name: 'CNIL Compliant',
      selectors: ['#cnil-consent-banner', '.cnil-cookie-banner'],
      acceptButton: '.cnil-accept',
      rejectButton: '.cnil-refuse',
      settingsButton: '.cnil-personnaliser'
    },

    // Spain: AEPD Compliant
    aepd: {
      name: 'AEPD Compliant',
      selectors: ['#aepd-cookie-banner', '.aepd-consent'],
      acceptButton: '.aepd-accept',
      rejectButton: '.aepd-reject',
      settingsButton: '.aepd-configurar'
    },

    // Italy: Garante Compliant
    garante: {
      name: 'Garante Compliant',
      selectors: ['#garante-cookie-banner', '.garante-consent'],
      acceptButton: '.garante-accetta',
      rejectButton: '.garante-rifiuta',
      settingsButton: '.garante-personalizza'
    },

    // Netherlands: AVG Compliant
    avgcompliant: {
      name: 'AVG Compliant (NL)',
      selectors: ['#avg-cookie-melding', '.avg-consent-banner'],
      acceptButton: '.avg-accepteren',
      rejectButton: '.avg-weigeren',
      settingsButton: '.avg-instellingen'
    },

    // Nordic: Cookie Pro Nordic
    nordiccookie: {
      name: 'Nordic Cookie',
      selectors: ['#nordic-cookie', '.nordic-consent-banner'],
      acceptButton: '.nordic-accept',
      rejectButton: '.nordic-reject',
      settingsButton: '.nordic-settings'
    },

    // Poland: RODO Compliant
    rodocompliant: {
      name: 'RODO Compliant (PL)',
      selectors: ['#rodo-cookie-banner', '.rodo-consent'],
      acceptButton: '.rodo-akceptuj',
      rejectButton: '.rodo-odrzuc',
      settingsButton: '.rodo-ustawienia'
    },

    // ==========================================
    // WEITERE WORDPRESS PLUGINS
    // ==========================================

    // GDPR Cookie Compliance Pro
    gdprcookiecompliance: {
      name: 'GDPR Cookie Compliance Pro',
      selectors: ['#gdpr-cookie-message', '.gdpr-cookie-notice'],
      acceptButton: '.gdpr-accept-btn',
      rejectButton: '.gdpr-decline-btn',
      settingsButton: '.gdpr-settings-btn'
    },

    // Cookie Notice & Compliance
    cookienoticecomp: {
      name: 'Cookie Notice & Compliance',
      selectors: ['#cookie-notice', '.cn-top-container', '.cn-bottom-container'],
      acceptButton: '.cn-accept-cookie',
      rejectButton: '.cn-refuse-cookie',
      settingsButton: '.cn-set-cookie'
    },

    // Beautiful Cookie Banner
    beautifulcookie: {
      name: 'Beautiful Cookie Banner',
      selectors: ['#beautiful-cookie-banner', '.beautiful-cookie-consent'],
      acceptButton: '.beautiful-accept',
      rejectButton: '.beautiful-decline',
      settingsButton: '.beautiful-settings'
    },

    // Cookie Consent WP
    cookieconsentwp: {
      name: 'Cookie Consent WP',
      selectors: ['#cc-wp-banner', '.cc-wp-notice'],
      acceptButton: '.cc-wp-accept',
      rejectButton: '.cc-wp-decline',
      settingsButton: '.cc-wp-preferences'
    },

    // WP Cookie Choice
    wpcookiechoice: {
      name: 'WP Cookie Choice',
      selectors: ['#cookie-choice-banner', '.cookie-choice-notice'],
      acceptButton: '.cookie-choice-accept',
      rejectButton: '.cookie-choice-decline',
      settingsButton: '.cookie-choice-settings'
    },

    // Auto Cookie
    autocookie: {
      name: 'Auto Cookie',
      selectors: ['#autocookie-banner', '.autocookie-consent'],
      acceptButton: '.autocookie-accept',
      rejectButton: '.autocookie-decline',
      settingsButton: '.autocookie-settings'
    },

    // Starter Templates Cookie
    startertemplates: {
      name: 'Starter Templates',
      selectors: ['#starter-cookie-notice', '.starter-cookie-banner'],
      acceptButton: '.starter-accept',
      rejectButton: '.starter-decline',
      settingsButton: '.starter-settings'
    },

    // ==========================================
    // SPEZIALISIERTE / BRANCHEN-CMPs
    // ==========================================

    // Consent for News (Medienhäuser)
    consentfornews: {
      name: 'Consent for News',
      selectors: ['#cfn-consent-banner', '.cfn-banner'],
      acceptButton: '.cfn-accept',
      rejectButton: '.cfn-reject',
      settingsButton: '.cfn-settings'
    },

    // Wunderman Thompson (Agenturen)
    wunderman: {
      name: 'Wunderman Thompson',
      selectors: ['#wt-consent-banner', '.wt-cookie-notice'],
      acceptButton: '.wt-accept',
      rejectButton: '.wt-reject',
      settingsButton: '.wt-preferences'
    },

    // Optanon (OneTrust Legacy)
    optanon: {
      name: 'Optanon (Legacy)',
      selectors: ['#optanon-popup-wrapper', '.optanon-alert-box-wrapper', '#optanon-popup-bg'],
      acceptButton: '.optanon-allow-all',
      rejectButton: '.optanon-reject-all-handler',
      settingsButton: '.optanon-show-settings'
    },

    // PrivacyTools.io
    privacytools: {
      name: 'PrivacyTools',
      selectors: ['#pt-consent-banner', '.pt-cookie-notice'],
      acceptButton: '.pt-accept',
      rejectButton: '.pt-decline',
      settingsButton: '.pt-settings'
    },

    // Uniform (A/B Testing CMPs)
    uniform: {
      name: 'Uniform',
      selectors: ['#uniform-consent-banner', '.uniform-consent'],
      acceptButton: '.uniform-accept',
      rejectButton: '.uniform-reject',
      settingsButton: '.uniform-settings'
    },

    // ==========================================
    // TCF 2.0 KOMPATIBLE CMPs
    // ==========================================

    // TCF Generic (IAB Framework)
    tcfgeneric: {
      name: 'TCF 2.0 Generic',
      selectors: ['[class*="tcf-"]', '[id*="tcf-"]', '.iab-consent-banner'],
      acceptButton: '.tcf-accept-all, .iab-accept',
      rejectButton: '.tcf-reject-all, .iab-reject',
      settingsButton: '.tcf-settings, .iab-settings'
    },

    // Google Consent Mode
    googleconsent: {
      name: 'Google Consent Mode',
      selectors: ['[data-google-consent]', '.google-consent-banner'],
      acceptButton: '[data-google-consent-accept]',
      rejectButton: '[data-google-consent-reject]',
      settingsButton: '[data-google-consent-settings]'
    },

    // Facebook Pixel Consent
    fbpixelconsent: {
      name: 'FB Pixel Consent',
      selectors: ['#fb-consent-banner', '.fb-consent-notice'],
      acceptButton: '.fb-consent-accept',
      rejectButton: '.fb-consent-decline',
      settingsButton: '.fb-consent-settings'
    }
  };

  /**
   * Generische Selektoren für unbekannte Banner
   */
  const GENERIC_SELECTORS = [
    // ID-basiert (Englisch)
    '#cookie-banner',
    '#cookie-consent',
    '#cookie-notice',
    '#cookie-popup',
    '#cookie-modal',
    '#cookie-bar',
    '#cookie-law',
    '#cookie-policy',
    '#cookies-banner',
    '#cookies-notice',
    '#gdpr-banner',
    '#gdpr-notice',
    '#gdpr-consent',
    '#privacy-banner',
    '#privacy-notice',
    '#consent-banner',
    '#consent-notice',
    '#consent-modal',
    '#consent-popup',
    '#cc-banner',
    '#cc-notice',
    '#tracking-consent',

    // ID-basiert (Deutsch)
    '#datenschutz-banner',
    '#datenschutz-hinweis',
    '#cookie-hinweis',

    // ID-basiert (Französisch)
    '#bandeau-cookie',
    '#rgpd-banner',

    // ID-basiert (Spanisch)
    '#aviso-cookies',
    '#banner-cookies',

    // Class-basiert (Englisch)
    '.cookie-banner',
    '.cookie-consent',
    '.cookie-notice',
    '.cookie-popup',
    '.cookie-modal',
    '.cookie-bar',
    '.cookie-overlay',
    '.cookie-wrapper',
    '.cookies-banner',
    '.cookies-notice',
    '.gdpr-banner',
    '.gdpr-notice',
    '.gdpr-consent',
    '.gdpr-popup',
    '.gdpr-modal',
    '.privacy-banner',
    '.privacy-notice',
    '.privacy-popup',
    '.consent-banner',
    '.consent-notice',
    '.consent-popup',
    '.consent-modal',
    '.consent-layer',
    '.consent-wrapper',
    '.consent-overlay',
    '.cc-banner',
    '.cc-window',
    '.cc-floating',
    '.tracking-consent',

    // Class-basiert (Wildcards via Contains)
    '[class*="cookie-banner"]',
    '[class*="cookie-consent"]',
    '[class*="cookie-notice"]',
    '[class*="gdpr-banner"]',
    '[class*="consent-banner"]',
    '[class*="privacy-banner"]',
    '[class*="CookieBanner"]',
    '[class*="CookieConsent"]',
    '[class*="CookieNotice"]',

    // Attribute
    '[data-cookie-banner]',
    '[data-cookie-consent]',
    '[data-consent-banner]',
    '[data-consent]',
    '[data-gdpr]',
    '[data-privacy]',
    '[data-tracking-consent]',
    '[data-testid*="cookie"]',
    '[data-testid*="consent"]',

    // ARIA Dialoge
    '[role="dialog"][aria-label*="cookie" i]',
    '[role="dialog"][aria-label*="consent" i]',
    '[role="dialog"][aria-label*="privacy" i]',
    '[role="dialog"][aria-label*="datenschutz" i]',
    '[role="dialog"][aria-label*="rgpd" i]',
    '[role="alertdialog"][aria-label*="cookie" i]',

    // Shadow DOM Container (häufig bei CMPs)
    '[id*="consent"][id*="container"]',
    '[id*="cookie"][id*="container"]',
    '[class*="consent"][class*="container"]',
    '[class*="cookie"][class*="container"]'
  ];

  /**
   * Keywords die auf Cookie-Banner hindeuten (Multilingual)
   */
  const BANNER_KEYWORDS = [
    // Englisch
    'cookie', 'cookies',
    'consent', 'consents',
    'privacy', 'privacy policy',
    'gdpr', 'ccpa', 'lgpd',
    'accept', 'accept all',
    'reject', 'reject all', 'decline',
    'tracking', 'tracker', 'trackers',
    'personalization', 'personalized ads',
    'third party', 'third-party',
    'analytics', 'statistics',
    'marketing', 'advertising',

    // Deutsch
    'datenschutz', 'datenschutzerklärung',
    'einwilligung', 'zustimmung',
    'akzeptieren', 'alle akzeptieren',
    'ablehnen', 'alle ablehnen',
    'dsgvo', 'dsgvo-konform',
    'erforderlich', 'notwendig',
    'funktional', 'statistik',
    'werbung', 'marketing',

    // Französisch
    'consentement', 'accepter',
    'refuser', 'rgpd',
    'confidentialité', 'vie privée',
    'cookies', 'traceurs',

    // Spanisch
    'consentimiento', 'aceptar',
    'rechazar', 'privacidad',
    'rgpd', 'lopd',

    // Italienisch
    'consenso', 'accetta',
    'rifiuta', 'privacy',

    // Niederländisch
    'toestemming', 'accepteren',
    'weigeren', 'avg',

    // Portugiesisch
    'consentimento', 'aceitar',
    'recusar', 'lgpd',

    // Polnisch
    'zgoda', 'akceptuj',
    'odrzuć', 'rodo',

    // Schwedisch
    'samtycke', 'godkänn',
    'avvisa', 'gdpr'
  ];

  /**
   * Prüft ob ein Element sichtbar ist
   */
  function isVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Prüft ob Text Banner-Keywords enthält
   */
  function containsBannerKeywords(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return BANNER_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Findet CMP-spezifischen Banner
   */
  function detectCMPBanner() {
    for (const [key, cmp] of Object.entries(CMP_SELECTORS)) {
      for (const selector of cmp.selectors) {
        const element = document.querySelector(selector);
        if (element && isVisible(element)) {
          return {
            type: 'cmp',
            cmpName: cmp.name,
            cmpKey: key,
            element,
            buttons: {
              accept: document.querySelector(cmp.acceptButton),
              reject: document.querySelector(cmp.rejectButton),
              settings: document.querySelector(cmp.settingsButton)
            }
          };
        }
      }
    }
    return null;
  }

  /**
   * Findet generischen Banner
   */
  function detectGenericBanner() {
    for (const selector of GENERIC_SELECTORS) {
      try {
        const element = document.querySelector(selector);
        if (element && isVisible(element) && containsBannerKeywords(element.textContent)) {
          return {
            type: 'generic',
            element,
            buttons: findButtons(element)
          };
        }
      } catch (e) {
        // Ungültiger Selector, ignorieren
      }
    }
    return null;
  }

  /**
   * Sucht nach Buttons im Banner (Multilingual)
   */
  function findButtons(container) {
    const buttons = {
      accept: null,
      reject: null,
      settings: null
    };

    const allButtons = container.querySelectorAll(
      'button, a[role="button"], [type="submit"], .btn, [class*="btn"], [class*="button"]'
    );

    // Patterns für verschiedene Sprachen
    const acceptPatterns = [
      // Englisch
      /accept|accept all|allow|allow all|agree|i agree|ok|got it|understood|continue|yes/i,
      // Deutsch
      /akzeptieren|alle akzeptieren|zustimmen|einverstanden|verstanden|annehmen|ja/i,
      // Französisch
      /accepter|tout accepter|j'accepte|d'accord|oui/i,
      // Spanisch
      /aceptar|aceptar todo|acepto|sí|si/i,
      // Italienisch
      /accetta|accetto|accetta tutto|va bene/i,
      // Niederländisch
      /accepteren|akkoord|ja|toestaan/i,
      // Portugiesisch
      /aceitar|aceito|concordo/i,
      // Polnisch
      /akceptuj|zaakceptuj|zgadzam/i,
      // Schwedisch
      /godkänn|acceptera|jag godkänner/i
    ];

    const rejectPatterns = [
      // Englisch
      /reject|reject all|deny|deny all|decline|refuse|no thanks|no, thanks|disagree/i,
      // Deutsch
      /ablehnen|alle ablehnen|verweigern|nicht akzeptieren|nein|nur notwendige|nur essentielle/i,
      // Französisch
      /refuser|tout refuser|non|je refuse/i,
      // Spanisch
      /rechazar|rechazar todo|no acepto|no/i,
      // Italienisch
      /rifiuta|rifiuto|non accetto/i,
      // Niederländisch
      /weigeren|afwijzen|nee/i,
      // Portugiesisch
      /recusar|rejeitar|não/i,
      // Polnisch
      /odrzuć|odmów|nie/i,
      // Schwedisch
      /avvisa|neka|avböj/i
    ];

    const settingsPatterns = [
      // Englisch
      /settings|preferences|manage|customize|options|more options|details|configure|choose|select/i,
      // Deutsch
      /einstellungen|verwalten|anpassen|optionen|mehr optionen|details|auswählen|individuell/i,
      // Französisch
      /paramètres|préférences|gérer|personnaliser|plus d'options/i,
      // Spanisch
      /configuración|preferencias|gestionar|personalizar|más opciones/i,
      // Italienisch
      /impostazioni|preferenze|gestisci|personalizza/i,
      // Niederländisch
      /instellingen|voorkeuren|beheren|aanpassen/i,
      // Portugiesisch
      /configurações|preferências|gerenciar/i,
      // Polnisch
      /ustawienia|preferencje|zarządzaj/i,
      // Schwedisch
      /inställningar|hantera|anpassa/i
    ];

    for (const btn of allButtons) {
      const text = (btn.textContent || '').toLowerCase().trim();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();
      const combined = text + ' ' + ariaLabel + ' ' + title;

      // Accept-Button
      if (!buttons.accept && acceptPatterns.some(p => p.test(combined))) {
        buttons.accept = btn;
      }

      // Reject-Button
      if (!buttons.reject && rejectPatterns.some(p => p.test(combined))) {
        buttons.reject = btn;
      }

      // Settings-Button
      if (!buttons.settings && settingsPatterns.some(p => p.test(combined))) {
        buttons.settings = btn;
      }
    }

    return buttons;
  }

  /**
   * Heuristik: Sucht nach potenziellen Bannern via DOM-Analyse
   */
  function detectByHeuristic() {
    // Suche nach fixed/sticky Elementen am oberen/unteren Rand
    const candidates = document.querySelectorAll('*');
    const viewportHeight = window.innerHeight;

    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Fixed oder sticky positioniert?
      if (style.position !== 'fixed' && style.position !== 'sticky') continue;

      // Sichtbar?
      if (!isVisible(el)) continue;

      // Am oberen oder unteren Rand?
      const isTop = rect.top < 100;
      const isBottom = rect.bottom > viewportHeight - 100;
      if (!isTop && !isBottom) continue;

      // Enthält Cookie-Keywords?
      if (!containsBannerKeywords(el.textContent)) continue;

      // Enthält Buttons?
      const buttons = findButtons(el);
      if (!buttons.accept && !buttons.settings) continue;

      return {
        type: 'heuristic',
        element: el,
        position: isTop ? 'top' : 'bottom',
        buttons
      };
    }

    return null;
  }

  return {
    /**
     * Erkennt Cookie-Banner auf der Seite
     * @returns {Object|null} Banner-Info oder null
     */
    detect() {
      // Erst bekannte CMPs prüfen
      let banner = detectCMPBanner();
      if (banner) {
        console.log('[ConsentGuardian] CMP erkannt:', banner.cmpName);
        return banner;
      }

      // Dann generische Selektoren
      banner = detectGenericBanner();
      if (banner) {
        console.log('[ConsentGuardian] Generischer Banner erkannt');
        return banner;
      }

      // Zuletzt Heuristik
      banner = detectByHeuristic();
      if (banner) {
        console.log('[ConsentGuardian] Banner via Heuristik erkannt');
        return banner;
      }

      return null;
    },

    /**
     * Prüft ob gerade ein Banner sichtbar ist
     * @returns {boolean}
     */
    isBannerVisible() {
      return this.detect() !== null;
    },

    /**
     * Holt Liste der unterstützten CMPs
     * @returns {string[]}
     */
    getSupportedCMPs() {
      return Object.values(CMP_SELECTORS).map(cmp => cmp.name);
    },

    /**
     * Analysiert Button-Struktur für Dark Pattern Detection
     * @param {Object} banner
     * @returns {Object}
     */
    analyzeButtons(banner) {
      if (!banner || !banner.buttons) {
        return { hasAccept: false, hasReject: false, hasSettings: false };
      }

      const { accept, reject, settings } = banner.buttons;

      return {
        hasAccept: !!accept && isVisible(accept),
        hasReject: !!reject && isVisible(reject),
        hasSettings: !!settings && isVisible(settings),
        acceptSize: accept ? accept.getBoundingClientRect() : null,
        rejectSize: reject ? reject.getBoundingClientRect() : null
      };
    }
  };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BannerDetector;
} else if (typeof window !== 'undefined') {
  window.BannerDetector = BannerDetector;
}
