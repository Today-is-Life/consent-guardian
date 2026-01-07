/**
 * Consent Guardian - Tracker Database
 *
 * Datenbank bekannter Tracker-Domains mit Kategorien und Erklärungen.
 * Hilft Usern zu verstehen, was im Hintergrund passiert.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const TrackerDB = (function() {
  'use strict';

  /**
   * Kategorien mit Farben, Icons und MENSCHLICHEN Erklärungen
   */
  const CATEGORIES = {
    advertising: {
      name: 'Werbung',
      color: 'red',
      icon: '🔴',
      shortDesc: 'Verfolgt dich für Werbung',
      description: 'Diese Dienste merken sich, welche Seiten du besuchst, um dir später passende Werbung zu zeigen - auch auf anderen Websites.',
      userImpact: 'Du siehst Werbung für Produkte, die du dir angesehen hast. Dein Surfverhalten wird gespeichert.',
      riskLevel: 'high'
    },
    analytics: {
      name: 'Analyse',
      color: 'yellow',
      icon: '🟡',
      shortDesc: 'Beobachtet dein Verhalten',
      description: 'Diese Dienste beobachten, wie du die Website nutzt: Was du anklickst, wie lange du bleibst, wo du hinscrollst.',
      userImpact: 'Die Website-Betreiber sehen, was du auf ihrer Seite machst. Manche Dienste teilen diese Daten mit anderen.',
      riskLevel: 'medium'
    },
    social: {
      name: 'Social Media',
      color: 'blue',
      icon: '🔵',
      shortDesc: 'Teilt mit sozialen Netzwerken',
      description: 'Facebook, Twitter & Co. erfahren, dass du diese Seite besucht hast - auch wenn du nicht auf "Teilen" klickst.',
      userImpact: 'Soziale Netzwerke können ein Profil deiner Interessen erstellen, selbst wenn du dort nicht angemeldet bist.',
      riskLevel: 'medium'
    },
    cdn: {
      name: 'Technisch',
      color: 'green',
      icon: '🟢',
      shortDesc: 'Lädt Inhalte schneller',
      description: 'Diese Server liefern Bilder, Schriftarten oder Code aus, damit die Seite schneller lädt.',
      userImpact: 'Meist unbedenklich. Diese Dienste sind oft notwendig, damit die Seite funktioniert.',
      riskLevel: 'low'
    },
    functional: {
      name: 'Notwendig',
      color: 'green',
      icon: '🟢',
      shortDesc: 'Für die Website nötig',
      description: 'Diese Dienste sind notwendig, damit die Website funktioniert: Zahlungen, Chat-Support, Sicherheit.',
      userImpact: 'Ohne diese Dienste würde die Seite nicht richtig funktionieren.',
      riskLevel: 'low'
    },
    fingerprinting: {
      name: 'Fingerprinting',
      color: 'red',
      icon: '🔴',
      shortDesc: 'Erkennt dich ohne Cookies',
      description: 'Diese Technologie erkennt dich an deinem Browser und Gerät - auch wenn du Cookies löschst!',
      userImpact: 'Du kannst kaum verhindern, wiedererkannt zu werden. Besonders invasive Tracking-Methode.',
      riskLevel: 'high'
    },
    unknown: {
      name: 'Unbekannt',
      color: 'gray',
      icon: '⚪',
      shortDesc: 'Unbekannter Dienst',
      description: 'Wir kennen diesen Dienst nicht. Er könnte harmlos sein oder dich tracken.',
      userImpact: 'Unklar, was dieser Dienst mit deinen Daten macht.',
      riskLevel: 'unknown'
    }
  };

  /**
   * Bekannte Tracker-Domains
   * Format: domain -> { name, category, description, details? }
   *
   * - description: Kurze Erklärung für die Übersicht (1-2 Sätze)
   * - details: Ausführliche Erklärung was genau gesammelt wird
   */
  const TRACKERS = {
    // === GOOGLE ===
    'google-analytics.com': {
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Sammelt detaillierte Statistiken über dein Verhalten auf dieser Website',
      details: 'Google Analytics ist das meistgenutzte Analyse-Tool weltweit. Es erfasst: welche Seiten du besuchst, wie lange du bleibst, woher du kommst (Suchmaschine, Social Media, direkt), welches Gerät und Browser du nutzt, deinen ungefähren Standort (Stadt/Region), was du anklickst und wie weit du scrollst. Diese Daten werden mit einer ID verknüpft, die dich über Wochen wiedererkennt. Der Website-Betreiber sieht aggregierte Statistiken, aber Google kann die Rohdaten auch für eigene Zwecke nutzen.'
    },
    'googletagmanager.com': {
      name: 'Google Tag Manager',
      category: 'analytics',
      description: 'Lädt verschiedene Tracking-Scripts - oft Analytics und Werbung',
      details: 'Der Tag Manager ist ein "Container" der andere Tracker nachlädt. Er selbst sammelt wenig, aber er ermöglicht es Website-Betreibern, beliebig viele weitere Tracking-Pixel hinzuzufügen ohne den Code zu ändern. Wenn du den Tag Manager siehst, kommen meist noch weitere Tracker. Er kann auch Events tracken: Klicks, Formular-Absendungen, Video-Wiedergaben, Scroll-Tiefe und mehr.'
    },
    'googleadservices.com': {
      name: 'Google Ads',
      category: 'advertising',
      description: 'Google Werbung - trackt Conversions und zeigt personalisierte Werbung',
      details: 'Dieses Tracking verfolgt, ob du nach dem Klick auf eine Google-Werbeanzeige etwas gekauft oder dich angemeldet hast (Conversion-Tracking). Es speichert auch, welche Produkte du dir angesehen hast, um dir später Remarketing-Anzeigen zu zeigen. Google erstellt ein Interessenprofil basierend auf allen Websites die dieses Tracking nutzen - das sind Millionen.'
    },
    'googlesyndication.com': {
      name: 'Google AdSense',
      category: 'advertising',
      description: 'Zeigt Google Werbebanner auf dieser Website',
      details: 'AdSense liefert die Werbeanzeigen aus, die du auf vielen Websites siehst. Es nutzt Cookies um zu tracken: welche Anzeigen du gesehen hast, worauf du geklickt hast, und welche Themen dich interessieren. Die Anzeigen werden personalisiert basierend auf deinem Surfverhalten im gesamten Google-Werbenetzwerk.'
    },
    'doubleclick.net': {
      name: 'DoubleClick (Google)',
      category: 'advertising',
      description: 'Googles Werbenetzwerk - trackt dich über viele Websites hinweg',
      details: 'DoubleClick ist Googles professionelle Werbeplattform, 2007 für 3,1 Milliarden Dollar gekauft. Es ist eines der größten Cross-Site-Tracking-Netzwerke überhaupt. Es verfolgt dich über hunderttausende Websites und erstellt ein detailliertes Profil: Interessen, Kaufabsichten, demografische Merkmale. Die "IDE"-Cookie speichert deine Werbe-ID bis zu 13 Monate.'
    },
    'google.com': {
      name: 'Google',
      category: 'functional',
      description: 'Google-Dienste wie Fonts, Maps oder reCAPTCHA',
      details: 'Direkte Verbindungen zu google.com können verschiedene Dienste sein: reCAPTCHA (Bot-Schutz), Google Maps Einbettungen, oder API-Aufrufe. Auch diese "funktionalen" Anfragen können Cookies setzen und deine IP-Adresse an Google übermitteln.'
    },
    'googleapis.com': {
      name: 'Google APIs',
      category: 'functional',
      description: 'Google-Dienste wie Fonts, Maps oder YouTube',
      details: 'Über googleapis.com werden verschiedene Google-Dienste eingebunden: Fonts (Schriftarten), Maps (Karten), YouTube-Embeds, reCAPTCHA und mehr. Bei jedem Laden wird deine IP-Adresse an Google übermittelt. Theoretisch könnte Google so nachvollziehen, welche Websites du besuchst.'
    },
    'gstatic.com': {
      name: 'Google Static',
      category: 'cdn',
      description: 'Statische Inhalte von Google (Fonts, Bilder)',
      details: 'gstatic.com liefert statische Dateien wie Schriftarten, JavaScript-Bibliotheken und Bilder. Es ist hauptsächlich ein CDN (Content Delivery Network) und setzt normalerweise keine Tracking-Cookies, aber Google sieht trotzdem deine IP-Adresse bei jeder Anfrage.'
    },
    'youtube.com': {
      name: 'YouTube',
      category: 'social',
      description: 'Eingebettete YouTube-Videos - trackt auch ohne Abspielen',
      details: 'Wenn ein YouTube-Video auf einer Seite eingebettet ist, setzt YouTube Cookies auch BEVOR du auf Play klickst. YouTube/Google erfährt: dass du diese Seite besucht hast, welches Video eingebettet war, und kann dies mit deinem Google-Konto verknüpfen falls du angemeldet bist. Es gibt einen "privacy-enhanced mode" (youtube-nocookie.com) der weniger trackt.'
    },
    'ytimg.com': {
      name: 'YouTube Images',
      category: 'cdn',
      description: 'Bilder und Thumbnails von YouTube',
      details: 'ytimg.com liefert Video-Vorschaubilder (Thumbnails) für YouTube-Embeds. Weniger invasiv als youtube.com selbst, aber Google sieht immer noch deine IP-Adresse.'
    },

    // === FACEBOOK / META ===
    'facebook.com': {
      name: 'Facebook',
      category: 'social',
      description: 'Facebook-Verbindung - trackt dich auch ohne Account',
      details: 'Facebook erkennt dich auf jeder Website mit Facebook-Integration - auch wenn du nicht eingeloggt oder gar kein Mitglied bist. Über "Gefällt mir"-Buttons, Kommentarfunktionen oder Login-Optionen erfährt Facebook welche Seiten du besuchst. Diese Daten werden zu einem "Schattenprofil" zusammengeführt und für Werbung genutzt.'
    },
    'facebook.net': {
      name: 'Facebook Pixel',
      category: 'advertising',
      description: 'Facebook Pixel und SDK - verfolgt dein Verhalten für Werbung',
      details: 'Der Facebook Pixel ist auf Millionen Websites installiert. Er trackt: welche Seiten du besuchst, welche Produkte du ansiehst, was du in den Warenkorb legst, und was du kaufst. Facebook nutzt diese Daten um dir später passende Werbung auf Facebook und Instagram zu zeigen. Der Pixel kann sogar Formulareingaben erfassen bevor du auf "Absenden" klickst.'
    },
    'fbcdn.net': {
      name: 'Facebook CDN',
      category: 'cdn',
      description: 'Inhalte von Facebook (Bilder, Videos)',
      details: 'fbcdn.net ist Facebooks Content Delivery Network für Bilder, Videos und statische Dateien. Weniger invasiv als facebook.net, aber Meta sieht trotzdem dass du eine Seite mit Facebook-Inhalten besucht hast.'
    },
    'instagram.com': {
      name: 'Instagram',
      category: 'social',
      description: 'Eingebettete Instagram-Inhalte',
      details: 'Wenn Instagram-Posts, Stories oder Profile eingebettet sind, erfährt Meta (Facebook) davon. Auch hier werden Cookies gesetzt die dich über Websites hinweg verfolgen können. Die Daten fließen in dasselbe Werbesystem wie Facebook.'
    },
    'whatsapp.com': {
      name: 'WhatsApp',
      category: 'functional',
      description: 'WhatsApp-Teilen-Buttons oder Chat-Widgets',
      details: 'WhatsApp-Chat-Buttons auf Websites übertragen normalerweise erst beim Klick Daten. Allerdings gehört WhatsApp zu Meta und die Metadaten (wer mit wem kommuniziert) werden mit Facebook geteilt.'
    },

    // === MICROSOFT ===
    'bing.com': {
      name: 'Bing Ads',
      category: 'analytics',
      description: 'Microsoft Bing Tracking und Werbung',
      details: 'Bing UET (Universal Event Tracking) funktioniert ähnlich wie Google Analytics. Es trackt Seitenaufrufe, Conversions und Nutzerverhalten. Die Daten werden für Microsoft Advertising genutzt um dir personalisierte Werbung in Bing, MSN und dem Microsoft-Netzwerk zu zeigen.'
    },
    'clarity.ms': {
      name: 'Microsoft Clarity',
      category: 'analytics',
      description: 'Zeichnet deine Mausbewegungen und Klicks auf',
      details: 'Clarity ist Microsofts kostenloses Session-Recording-Tool. Es nimmt ALLES auf: Jeden Mauszeiger-Bewegung, jeden Klick, jedes Scrollen, jeden Tastendruck (außer in Passwort-Feldern). Der Website-Betreiber kann sich deine komplette Session als Video ansehen. Clarity erstellt auch Heatmaps die zeigen, wo Nutzer am meisten klicken.'
    },
    'msn.com': {
      name: 'MSN',
      category: 'advertising',
      description: 'Microsoft Werbenetzwerk',
      details: 'MSN ist Teil des Microsoft Advertising Netzwerks. Es liefert Werbeanzeigen aus und trackt Conversions für Microsoft-Werbekunden.'
    },
    'linkedin.com': {
      name: 'LinkedIn',
      category: 'social',
      description: 'LinkedIn-Verbindung und Tracking',
      details: 'LinkedIn Insight Tag trackt Website-Besucher für B2B-Werbung. Es erfasst berufliche Merkmale wie Branche, Unternehmensgröße und Jobtitel. Besonders beliebt für Recruiting und B2B-Marketing. Die Daten werden mit deinem LinkedIn-Profil verknüpft falls vorhanden.'
    },
    'licdn.com': {
      name: 'LinkedIn CDN',
      category: 'cdn',
      description: 'LinkedIn-Inhalte',
      details: 'Content Delivery Network für LinkedIn-Widgets, Profilbilder und eingebettete Inhalte.'
    },

    // === TWITTER / X ===
    'twitter.com': {
      name: 'Twitter/X',
      category: 'social',
      description: 'Twitter-Verbindung - trackt auch ohne Account'
    },
    'twimg.com': {
      name: 'Twitter Images',
      category: 'cdn',
      description: 'Bilder von Twitter'
    },
    't.co': {
      name: 'Twitter Links',
      category: 'analytics',
      description: 'Twitter Link-Tracking'
    },

    // === AMAZON ===
    'amazon-adsystem.com': {
      name: 'Amazon Ads',
      category: 'advertising',
      description: 'Amazon Werbung und Affiliate-Tracking'
    },
    'cloudfront.net': {
      name: 'Amazon CloudFront',
      category: 'cdn',
      description: 'Amazon CDN - lädt Inhalte schneller'
    },
    'amazonaws.com': {
      name: 'Amazon AWS',
      category: 'cdn',
      description: 'Amazon Cloud-Hosting'
    },

    // === GOOGLE ERWEITERT ===
    'googletagservices.com': {
      name: 'Google Publisher Tags',
      category: 'advertising',
      description: 'Koordiniert Werbeanzeigen auf der Seite - Teil des Google Ad-Systems'
    },
    'adtrafficquality.google': {
      name: 'Google Ad Traffic Quality',
      category: 'advertising',
      description: 'Googles System zur Überprüfung der Werbequalität und Betrugserkennung'
    },
    '2mdn.net': {
      name: 'Google DoubleClick',
      category: 'advertising',
      description: 'Google Display-Netzwerk für Werbebanner und Rich Media Ads'
    },
    'securepubads.g.doubleclick.net': {
      name: 'Google Secure Ads',
      category: 'advertising',
      description: 'Sichere Auslieferung von Google Werbung - trackt für personalisierte Anzeigen'
    },
    'ad.doubleclick.net': {
      name: 'DoubleClick Ads',
      category: 'advertising',
      description: 'Google Werbeserver - liefert Anzeigen aus und trackt Klicks'
    },
    'cm.g.doubleclick.net': {
      name: 'DoubleClick Cookie Matching',
      category: 'advertising',
      description: 'Synchronisiert deine Werbe-ID zwischen verschiedenen Plattformen'
    },
    'safeframe.googlesyndication.com': {
      name: 'Google SafeFrame',
      category: 'advertising',
      description: 'Sichere Container für Werbeanzeigen - Teil von Google AdSense'
    },

    // === AD VERIFICATION & QUALITY ===
    'adsafeprotected.com': {
      name: 'IAS (Integral Ad Science)',
      category: 'advertising',
      description: 'Prüft ob Werbung sichtbar ist und misst Werbe-Performance'
    },
    'geoedge.be': {
      name: 'GeoEdge',
      category: 'advertising',
      description: 'Werbe-Sicherheit und Qualitätsprüfung - scannt Anzeigen auf Malware'
    },
    'rumcdn.geoedge.be': {
      name: 'GeoEdge CDN',
      category: 'advertising',
      description: 'GeoEdge Werbe-Monitoring und Sicherheitsscans'
    },

    // === QUANTCAST ===
    'quantcount.com': {
      name: 'Quantcast Measure',
      category: 'analytics',
      description: 'Misst Website-Reichweite und erstellt Zielgruppen-Profile'
    },
    'quantserve.com': {
      name: 'Quantcast',
      category: 'advertising',
      description: 'Audience Targeting - erstellt Profile für personalisierte Werbung'
    },

    // === ANDERE WERBENETZWERKE ===
    'criteo.com': {
      name: 'Criteo',
      category: 'advertising',
      description: 'Retargeting-Spezialist - zeigt dir Produkte die du angesehen hast, überall im Internet',
      details: 'Criteo ist DER Retargeting-Spezialist. Wenn du Schuhe bei Shop A anschaust, zeigt Criteo dir diese Schuhe auf Website B, C und D. Criteo hat Partnerschaften mit über 20.000 Online-Shops und erreicht 1,2 Milliarden Nutzer monatlich. Sie speichern: alle Produkte die du ansiehst, Preise, Warenkörbe, und Käufe. Diese Daten werden 13 Monate gespeichert.'
    },
    'criteo.net': {
      name: 'Criteo Network',
      category: 'advertising',
      description: 'Criteo Werbenetzwerk - verfolgt dich über viele Websites',
      details: 'Das technische Netzwerk von Criteo für Anzeigenauslieferung. Hier werden die Retargeting-Banner geladen und Klicks/Impressionen getrackt.'
    },
    'gum.criteo.com': {
      name: 'Criteo User Matching',
      category: 'advertising',
      description: 'Synchronisiert deine Criteo-ID mit anderen Werbenetzwerken',
      details: 'Cookie-Syncing: Criteo tauscht hier deine ID mit anderen Werbenetzwerken aus, sodass du überall wiedererkannt werden kannst. Das passiert im Hintergrund ohne dein Wissen.'
    },
    'mug.criteo.com': {
      name: 'Criteo Mobile',
      category: 'advertising',
      description: 'Criteo Mobile Tracking und Retargeting',
      details: 'Spezieller Endpunkt für Mobile-Tracking. Versucht dich auch geräteübergreifend zu identifizieren.'
    },
    'outbrain.com': {
      name: 'Outbrain',
      category: 'advertising',
      description: 'Content-Empfehlungen - "Das könnte Sie auch interessieren"',
      details: 'Diese "Empfohlene Artikel" am Ende von Nachrichtenartikeln? Das ist meist Outbrain. Sie tracken welche Artikel du liest, um ein Interessenprofil zu erstellen. Outbrain verdient Geld wenn du auf die Links klickst - deshalb sind die Überschriften oft reißerisch (Clickbait).'
    },
    'taboola.com': {
      name: 'Taboola',
      category: 'advertising',
      description: 'Content-Empfehlungen und Native Advertising',
      details: 'Der größte Konkurrent von Outbrain. Taboola zeigt "gesponserte Inhalte" auf News-Seiten. Sie tracken dein Leseverhalten auf tausenden Websites um personalisierte Empfehlungen zu zeigen. Oft erkennbar an Überschriften wie "Ärzte sind sprachlos..." oder "Dieser Trick..."'
    },
    'adform.net': {
      name: 'Adform',
      category: 'advertising',
      description: 'Europäisches Werbenetzwerk',
      details: 'Adform ist eine der größten europäischen Ad-Tech-Plattformen mit Sitz in Kopenhagen. Sie bieten DSP (Demand Side Platform), DMP (Data Management Platform) und Ad Server. Besonders stark im europäischen Markt, speichern Nutzerdaten gemäß DSGVO.'
    },
    'adsrvr.org': {
      name: 'The Trade Desk',
      category: 'advertising',
      description: 'Einer der größten Werbeeinkäufer - kauft Werbeplätze in Echtzeit basierend auf deinem Profil',
      details: 'The Trade Desk ist der größte unabhängige DSP (Demand Side Platform). Werbekunden nutzen TTD um in Millisekunden Werbeplätze zu kaufen - basierend auf deinem Profil. TTD wertet Milliarden von "Bid Requests" pro Tag aus und entscheidet in Echtzeit, ob eine Werbeanzeige für DICH gekauft wird. Sie haben Zugang zu Daten von hunderten Datenanbietern.'
    },
    'match.adsrvr.org': {
      name: 'The Trade Desk Matching',
      category: 'advertising',
      description: 'Synchronisiert deine Trade Desk ID mit anderen Werbenetzwerken',
      details: 'Cookie-Synchronisierung zwischen Trade Desk und anderen Plattformen. Ermöglicht, dass dein Profil plattformübergreifend genutzt werden kann.'
    },
    'pubmatic.com': {
      name: 'PubMatic',
      category: 'advertising',
      description: 'Große Werbeplattform - verkauft Werbeplätze an Höchstbietende',
      details: 'PubMatic ist eine SSP (Supply Side Platform) - sie verkaufen die Werbeplätze von Websites. Wenn du eine Seite lädst, schickt PubMatic dein Profil (Browser, Standort, Interessen) an dutzende Werbeeinkäufer die in Millisekunden bieten. Der Höchstbietende zeigt dir die Werbung.'
    },
    'ads.pubmatic.com': {
      name: 'PubMatic Ads',
      category: 'advertising',
      description: 'PubMatic Werbeauslieferung und Tracking'
    },
    'rubiconproject.com': {
      name: 'Magnite (Rubicon)',
      category: 'advertising',
      description: 'Große Werbebörse - versteigert Werbeplätze in Millisekunden',
      details: 'Magnite (ehemals Rubicon Project) ist die größte unabhängige SSP. Sie betreiben eine der größten Werbebörsen der Welt. Pro Sekunde werden Millionen von Auktionen durchgeführt. Magnite hat Zugang zu Premium-Inventar von großen Publishern und TV-Sendern.'
    },
    'eus.rubiconproject.com': {
      name: 'Magnite EU',
      category: 'advertising',
      description: 'Europäischer Server für Magnite/Rubicon Werbung'
    },
    'token.rubiconproject.com': {
      name: 'Magnite Token',
      category: 'advertising',
      description: 'Authentifizierung und ID-Matching für Magnite Werbeplattform'
    },
    'openx.net': {
      name: 'OpenX',
      category: 'advertising',
      description: 'Programmatic Advertising Plattform'
    },
    'casalemedia.com': {
      name: 'Index Exchange',
      category: 'advertising',
      description: 'Große Werbebörse - handelt mit Werbeplätzen in Echtzeit'
    },
    'ssum-sec.casalemedia.com': {
      name: 'Index Exchange Sync',
      category: 'advertising',
      description: 'Index Exchange Server-Side User Matching'
    },
    'indexww.com': {
      name: 'Index Exchange',
      category: 'advertising',
      description: 'Index Exchange Wrapper und Bidding-System'
    },
    'advertising.com': {
      name: 'AOL Advertising',
      category: 'advertising',
      description: 'AOL/Verizon Werbenetzwerk'
    },

    // === WEITERE AD-TECH PLATTFORMEN ===
    'adnxs.com': {
      name: 'Xandr (AppNexus)',
      category: 'advertising',
      description: 'Microsoft-Werbeplattform - eine der größten Ad Exchanges weltweit'
    },
    'acdn.adnxs.com': {
      name: 'Xandr CDN',
      category: 'advertising',
      description: 'Xandr/AppNexus Werbe-Content-Delivery'
    },
    'ib.adnxs.com': {
      name: 'Xandr Impression Bus',
      category: 'advertising',
      description: 'Xandr Echtzeit-Werbeauslieferung und Tracking'
    },
    '3lift.com': {
      name: 'TripleLift',
      category: 'advertising',
      description: 'Native Advertising - Werbung die wie normaler Content aussieht'
    },
    'eb2.3lift.com': {
      name: 'TripleLift Exchange',
      category: 'advertising',
      description: 'TripleLift Werbe-Exchange für Native Ads'
    },
    'gumgum.com': {
      name: 'GumGum',
      category: 'advertising',
      description: 'Contextual Advertising - analysiert Seiteninhalte für passende Werbung'
    },
    'rtb.gumgum.com': {
      name: 'GumGum RTB',
      category: 'advertising',
      description: 'GumGum Echtzeit-Werbebietung'
    },
    'bidswitch.net': {
      name: 'BidSwitch',
      category: 'advertising',
      description: 'Verbindet verschiedene Werbenetzwerke - Werbe-Traffic-Router'
    },
    'turn.com': {
      name: 'Amobee (Turn)',
      category: 'advertising',
      description: 'DSP Plattform - kauft Werbung basierend auf Nutzerprofilen'
    },
    'ad.turn.com': {
      name: 'Amobee Ads',
      category: 'advertising',
      description: 'Amobee/Turn Werbeauslieferung'
    },
    'semasio.net': {
      name: 'Semasio',
      category: 'advertising',
      description: 'Semantic Targeting - analysiert was dich interessiert für Werbezwecke'
    },
    'connectad.io': {
      name: 'ConnectAd',
      category: 'advertising',
      description: 'Ad-Tech Plattform - Nutzer-Synchronisation zwischen Werbenetzwerken'
    },
    'relevant-digital.com': {
      name: 'Relevant Digital',
      category: 'advertising',
      description: 'Prebid Server - koordiniert Werbeauktionen im Hintergrund'
    },
    'k5a.io': {
      name: 'K5A/Koa',
      category: 'advertising',
      description: 'Werbe-Attribution und Conversion-Tracking'
    },
    'e-volution.ai': {
      name: 'E-volution',
      category: 'advertising',
      description: 'KI-basierte Werbetechnologie'
    },

    // === ADOBE / DEMDEX ===
    'demdex.net': {
      name: 'Adobe Audience Manager',
      category: 'advertising',
      description: 'Adobe DMP - sammelt Daten für Zielgruppen-Segmentierung und Werbung'
    },
    'dpm.demdex.net': {
      name: 'Adobe DPM',
      category: 'advertising',
      description: 'Adobe Data Provider Matching - synchronisiert IDs zwischen Plattformen'
    },

    // === SSP / DSP PLATTFORMEN ===
    'smartadserver.com': {
      name: 'Smart AdServer',
      category: 'advertising',
      description: 'Europäischer Ad Server - liefert Werbung aus und trackt Impressionen'
    },
    'sascdn.com': {
      name: 'Smart AdServer CDN',
      category: 'advertising',
      description: 'Smart AdServer Werbe-Auslieferung'
    },
    'teads.tv': {
      name: 'Teads',
      category: 'advertising',
      description: 'Video-Werbeplattform - platziert Werbung in Artikeln'
    },
    't.teads.tv': {
      name: 'Teads Tracking',
      category: 'advertising',
      description: 'Teads Werbe-Tracking und Analytics'
    },
    'spotxchange.com': {
      name: 'SpotX',
      category: 'advertising',
      description: 'Video-Werbebörse - handelt mit Video-Werbeplätzen'
    },
    'sharethrough.com': {
      name: 'Sharethrough',
      category: 'advertising',
      description: 'Native Advertising Plattform - Werbung die wie Content aussieht'
    },
    'sizmek.com': {
      name: 'Sizmek',
      category: 'advertising',
      description: 'Amazon-Werbeplattform für Kreativ-Management und Auslieferung'
    },

    // === IDENTITY / USER MATCHING ===
    'liveramp.com': {
      name: 'LiveRamp',
      category: 'advertising',
      description: 'Verknüpft deine Online-Identität mit Offline-Daten für Werbezwecke',
      details: 'LiveRamp ist der Marktführer für "Identity Resolution". Sie verbinden deine Online-Aktivitäten mit Offline-Daten: Kreditkarten-Transaktionen, Kundenkarten, Adressdaten. LiveRamp hat Daten zu über 250 Millionen US-Konsumenten. Wenn du online surfst und offline einkaufst, kann LiveRamp diese Daten zusammenführen.'
    },
    'rlcdn.com': {
      name: 'LiveRamp CDN',
      category: 'advertising',
      description: 'LiveRamp Identity-Auflösung - verbindet dich über Geräte hinweg',
      details: 'Über rlcdn.com synchronisiert LiveRamp deine Identität über verschiedene Websites und Geräte. Das Ziel: ob du am Laptop, Handy oder Tablet surfst - LiveRamp will dich als dieselbe Person erkennen.'
    },
    'pippio.com': {
      name: 'LiveRamp (Pippio)',
      category: 'advertising',
      description: 'LiveRamp Cross-Device Tracking',
      details: 'Pippio wurde von LiveRamp übernommen und spezialisiert auf Cross-Device-Identifikation. Es erkennt welche Geräte zu einer Person gehören.'
    },
    'id5-sync.com': {
      name: 'ID5',
      category: 'advertising',
      description: 'Universal ID - identifiziert dich über Websites hinweg auch ohne Cookies',
      details: 'ID5 ist eine "Post-Cookie"-Lösung für die Werbebranche. Wenn Third-Party-Cookies abgeschafft werden, soll ID5 als Alternative dienen. Sie nutzen First-Party-Daten, IP-Adressen und andere Signale um eine "Universal ID" zu erstellen die dich über Websites hinweg identifiziert.'
    },
    'liadm.com': {
      name: 'LiveIntent',
      category: 'advertising',
      description: 'E-Mail-basierte Identität für Werbung - verbindet dich mit deiner E-Mail',
      details: 'LiveIntent nutzt deine E-Mail-Adresse als persistenten Identifier. Wenn du dich irgendwo mit deiner E-Mail anmeldest, kann LiveIntent ein Profil erstellen das über alle Geräte und Websites funktioniert. E-Mail ist stabiler als Cookies!'
    },
    'crwdcntrl.net': {
      name: 'Lotame',
      category: 'advertising',
      description: 'Datenmanagement-Plattform - sammelt und verkauft Nutzerdaten',
      details: 'Lotame ist eine der größten DMPs (Data Management Platforms). Sie sammeln Daten von Websites, erstellen Zielgruppen-Segmente ("kaufkräftige Millennials", "Autointeressierte") und VERKAUFEN diese an Werbetreibende. Dein Profil wird buchstäblich gehandelt.'
    },
    'eyeota.net': {
      name: 'Eyeota',
      category: 'advertising',
      description: 'Audience Data Marketplace - handelt mit Nutzerprofilen',
      details: 'Eyeota betreibt einen globalen Marktplatz für Audience-Daten. Hier kaufen und verkaufen Unternehmen Nutzersegmente. Über 3 Milliarden Profile in 80 Ländern. Eyeota kombiniert Daten aus verschiedenen Quellen zu verkaufbaren Segmenten.'
    },
    'mathtag.com': {
      name: 'MediaMath',
      category: 'advertising',
      description: 'DSP - kauft Werbeplätze basierend auf deinem Profil in Echtzeit'
    },
    'bidr.io': {
      name: 'Beeswax',
      category: 'advertising',
      description: 'Programmatic Advertising Infrastruktur'
    },
    'mookie1.com': {
      name: 'MediaMath',
      category: 'advertising',
      description: 'MediaMath Cookie-Synchronisation'
    },

    // === YAHOO / VERIZON ===
    'yahoo.com': {
      name: 'Yahoo',
      category: 'advertising',
      description: 'Yahoo Werbenetzwerk - Teil von Verizon Media'
    },
    'oath.com': {
      name: 'Oath (Verizon)',
      category: 'advertising',
      description: 'Verizon Werbenetzwerk'
    },
    'adtechjp.com': {
      name: 'AdTech (AOL)',
      category: 'advertising',
      description: 'AOL/Verizon Werbeserver'
    },

    // === VIDEO ADVERTISING ===
    'springserve.com': {
      name: 'SpringServe',
      category: 'advertising',
      description: 'Video Ad Server für Publisher'
    },
    'innovid.com': {
      name: 'Innovid',
      category: 'advertising',
      description: 'Video-Werbeplattform und Connected TV Ads'
    },
    'connatix.com': {
      name: 'Connatix',
      category: 'advertising',
      description: 'Video-Content und Werbeplattform'
    },
    'ex.co': {
      name: 'EX.CO (Playbuzz)',
      category: 'advertising',
      description: 'Video-Content-Monetarisierung'
    },

    // === WEITERE WERBENETZWERKE ===
    'sovrn.com': {
      name: 'Sovrn',
      category: 'advertising',
      description: 'Publisher-Monetarisierung und Programmatic Advertising'
    },
    'lijit.com': {
      name: 'Sovrn (Lijit)',
      category: 'advertising',
      description: 'Sovrn Exchange für Werbeplätze'
    },
    'yieldmo.com': {
      name: 'Yieldmo',
      category: 'advertising',
      description: 'Mobile-First Advertising mit interaktiven Formaten'
    },
    'nativo.com': {
      name: 'Nativo',
      category: 'advertising',
      description: 'Native Advertising - Werbung integriert in redaktionellen Content'
    },
    'revcontent.com': {
      name: 'RevContent',
      category: 'advertising',
      description: 'Content Recommendation - "Das könnte Sie interessieren"'
    },
    'mgid.com': {
      name: 'MGID',
      category: 'advertising',
      description: 'Native Advertising und Content Empfehlungen'
    },
    'content-ad.net': {
      name: 'Content.ad',
      category: 'advertising',
      description: 'Native Content Advertising'
    },
    'zergnet.com': {
      name: 'ZergNet',
      category: 'advertising',
      description: 'Content-Empfehlungswidget'
    },

    // === AD OPERATIONS ===
    'adlooxtracking.com': {
      name: 'Adloox',
      category: 'advertising',
      description: 'Ad Verification und Brand Safety'
    },
    'doubleverify.com': {
      name: 'DoubleVerify',
      category: 'advertising',
      description: 'Werbe-Verifizierung - prüft ob Werbung sichtbar war'
    },
    'moatads.com': {
      name: 'Moat (Oracle)',
      category: 'advertising',
      description: 'Werbe-Messung und Viewability-Tracking'
    },
    'z.moatads.com': {
      name: 'Moat Tracking',
      category: 'advertising',
      description: 'Oracle Moat Analytics für Werbung'
    },
    'aniview.com': {
      name: 'Aniview',
      category: 'advertising',
      description: 'Video-Werbetechnologie'
    },

    // === RETARGETING ===
    'rtbhouse.com': {
      name: 'RTB House',
      category: 'advertising',
      description: 'Deep-Learning Retargeting - zeigt dir Produkte die du angesehen hast'
    },
    'adroll.com': {
      name: 'AdRoll',
      category: 'advertising',
      description: 'Retargeting - verfolgt dich um dir gesehene Produkte zu zeigen'
    },
    'd.adroll.com': {
      name: 'AdRoll Tracking',
      category: 'advertising',
      description: 'AdRoll Pixel und Conversion-Tracking'
    },
    'steelhouse.com': {
      name: 'SteelHouse',
      category: 'advertising',
      description: 'Retargeting und Display-Werbung'
    },
    'perfectaudience.com': {
      name: 'Perfect Audience',
      category: 'advertising',
      description: 'Retargeting Plattform'
    },

    // === CONSENT / PRIVACY ===
    'privacy-center.org': {
      name: 'Privacy Center',
      category: 'functional',
      description: 'Datenschutz-Präferenz-Management'
    },
    'privacymanager.io': {
      name: 'Privacy Manager',
      category: 'functional',
      description: 'DSGVO Consent Management'
    },
    'didomi.io': {
      name: 'Didomi',
      category: 'functional',
      description: 'Cookie-Consent und Preference Management'
    },
    'sp-prod.net': {
      name: 'Sourcepoint',
      category: 'functional',
      description: 'Sourcepoint Consent Management'
    },

    // === ANALYTICS ===
    'hotjar.com': {
      name: 'Hotjar',
      category: 'analytics',
      description: 'Zeichnet deine Mausbewegungen, Klicks und Scrollverhalten auf',
      details: 'Hotjar nimmt deine komplette Browsing-Session auf Video auf! Jede Mausbewegung, jeden Klick, jedes Scrollen. Der Website-Betreiber kann sich diese Aufnahmen später ansehen. Hotjar erstellt auch Heatmaps die zeigen, wo alle Nutzer klicken. Zusätzlich können Pop-up-Umfragen angezeigt werden. Sensible Felder (Passwörter, Kreditkarten) werden angeblich maskiert.'
    },
    'mouseflow.com': {
      name: 'Mouseflow',
      category: 'analytics',
      description: 'Session-Recording - nimmt deine Aktionen auf',
      details: 'Wie Hotjar: Mouseflow zeichnet deine komplette Session auf. Zusätzlich werden Formulare analysiert - welche Felder füllst du aus, wo brichst du ab? Mouseflow erkennt auch "Rage Clicks" (frustriertes Mehrfachklicken) und erstellt Funnel-Analysen.'
    },
    'crazyegg.com': {
      name: 'Crazy Egg',
      category: 'analytics',
      description: 'Heatmaps und Click-Tracking',
      details: 'Crazy Egg erstellt Heatmaps, Scrollmaps und Confetti-Reports (zeigt jeden einzelnen Klick). Auch Session-Recording ist verfügbar. Gegründet vom bekannten Marketer Neil Patel.'
    },
    'mixpanel.com': {
      name: 'Mixpanel',
      category: 'analytics',
      description: 'Produkt-Analytics - trackt wie du die App nutzt',
      details: 'Mixpanel trackt "Events" - also spezifische Aktionen die du ausführst: Button-Klicks, Käufe, Anmeldungen, Feature-Nutzung. Es erstellt Nutzer-Profile und analysiert User-Journeys. Besonders beliebt bei SaaS-Produkten um zu verstehen, welche Features genutzt werden.'
    },
    'segment.com': {
      name: 'Segment',
      category: 'analytics',
      description: 'Sammelt Daten und leitet sie an andere Tools weiter',
      details: 'Segment ist ein "Daten-Hub". Es sammelt alle deine Interaktionen und leitet sie an dutzende andere Tools weiter: Analytics, Marketing, CRM, Data Warehouses. Ein Segment-Pixel kann deine Daten an 300+ verschiedene Dienste schicken. Gehört jetzt zu Twilio.'
    },
    'segment.io': {
      name: 'Segment',
      category: 'analytics',
      description: 'Customer Data Platform',
      details: 'Segment CDP sammelt Daten aus allen Kanälen (Web, App, Server) und erstellt einheitliche Kundenprofile. Diese Profile werden dann für Personalisierung und Marketing verwendet.'
    },
    'amplitude.com': {
      name: 'Amplitude',
      category: 'analytics',
      description: 'Produkt-Analytics',
      details: 'Amplitude analysiert Nutzerverhalten in digitalen Produkten. Es trackt Events, erstellt Kohorten-Analysen und Funnels. Besonders beliebt bei Tech-Startups. Amplitude kann auch A/B-Tests auswerten und Nutzer-Engagement messen.'
    },
    'heap.io': {
      name: 'Heap',
      category: 'analytics',
      description: 'Auto-Capture Analytics - trackt automatisch alles',
      details: 'Heap ist besonders invasiv: Es trackt AUTOMATISCH JEDEN Klick, jede Texteingabe, jeden Seitenwechsel - ohne dass der Entwickler Events definieren muss. "Wir erfassen alles, damit du später entscheiden kannst was wichtig ist." Praktisch für Entwickler, aber sehr umfassende Datensammlung.'
    },
    'fullstory.com': {
      name: 'FullStory',
      category: 'analytics',
      description: 'Session-Replay - zeichnet deine komplette Session auf',
      details: 'FullStory rekonstruiert deine Session pixel-genau. Nicht nur Klicks, sondern das komplette visuelle Erlebnis wird aufgezeichnet. Support-Teams nutzen es um zu sehen, was der Kunde "wirklich" gemacht hat. FullStory hat auch AI-Features die automatisch "Frustrations-Signale" erkennen.'
    },
    'matomo.cloud': {
      name: 'Matomo',
      category: 'analytics',
      description: 'Open-Source Analytics - datenschutzfreundlicher als Google',
      details: 'Matomo (früher Piwik) ist die führende Open-Source-Alternative zu Google Analytics. Es kann selbst gehostet werden, sodass Daten nicht an Dritte gehen. Auch die Cloud-Version speichert Daten in der EU. IP-Anonymisierung und Cookie-freies Tracking sind möglich.'
    },
    'plausible.io': {
      name: 'Plausible',
      category: 'analytics',
      description: 'Privacy-freundliche Analytics ohne Cookies',
      details: 'Plausible ist eine der datenschutzfreundlichsten Analytics-Lösungen. Keine Cookies, keine persönlichen Daten, EU-Hosting. Das Script ist nur 1KB klein. Es zeigt nur aggregierte Statistiken - keine individuellen Nutzerprofile. Oft DSGVO-konform ohne Consent-Banner.'
    },

    // === SOCIAL MEDIA ===
    'pinterest.com': {
      name: 'Pinterest',
      category: 'social',
      description: 'Pinterest-Buttons und Tracking'
    },
    'tiktok.com': {
      name: 'TikTok',
      category: 'social',
      description: 'TikTok-Pixel und Tracking'
    },
    'snapchat.com': {
      name: 'Snapchat',
      category: 'social',
      description: 'Snapchat-Pixel für Werbung'
    },
    'reddit.com': {
      name: 'Reddit',
      category: 'social',
      description: 'Reddit-Einbettungen'
    },

    // === CDN / HOSTING ===
    'cloudflare.com': {
      name: 'Cloudflare',
      category: 'cdn',
      description: 'CDN und Sicherheit - meist harmlos'
    },
    'cdnjs.cloudflare.com': {
      name: 'cdnjs',
      category: 'cdn',
      description: 'JavaScript-Bibliotheken - harmlos'
    },
    'jsdelivr.net': {
      name: 'jsDelivr',
      category: 'cdn',
      description: 'Open-Source CDN - harmlos'
    },
    'unpkg.com': {
      name: 'unpkg',
      category: 'cdn',
      description: 'npm CDN - harmlos'
    },
    'bootstrapcdn.com': {
      name: 'Bootstrap CDN',
      category: 'cdn',
      description: 'Bootstrap Framework - harmlos'
    },
    'fontawesome.com': {
      name: 'Font Awesome',
      category: 'cdn',
      description: 'Icon-Bibliothek - harmlos'
    },
    'fonts.googleapis.com': {
      name: 'Google Fonts',
      category: 'cdn',
      description: 'Schriftarten von Google - trackt minimal'
    },
    'fonts.gstatic.com': {
      name: 'Google Fonts Static',
      category: 'cdn',
      description: 'Schriftarten-Dateien'
    },
    'typekit.net': {
      name: 'Adobe Fonts',
      category: 'cdn',
      description: 'Adobe Schriftarten'
    },
    'use.fontawesome.com': {
      name: 'Font Awesome',
      category: 'cdn',
      description: 'Icon-Bibliothek'
    },
    'akamaihd.net': {
      name: 'Akamai',
      category: 'cdn',
      description: 'Großes CDN-Netzwerk'
    },
    'fastly.net': {
      name: 'Fastly',
      category: 'cdn',
      description: 'CDN-Dienst'
    },

    // === FUNKTIONAL ===
    'recaptcha.net': {
      name: 'reCAPTCHA',
      category: 'functional',
      description: 'Google Bot-Schutz - notwendig für Formulare'
    },
    'hcaptcha.com': {
      name: 'hCaptcha',
      category: 'functional',
      description: 'Datenschutzfreundlicherer Bot-Schutz'
    },
    'stripe.com': {
      name: 'Stripe',
      category: 'functional',
      description: 'Zahlungsabwicklung - notwendig für Käufe'
    },
    'paypal.com': {
      name: 'PayPal',
      category: 'functional',
      description: 'Zahlungsabwicklung'
    },
    'klarna.com': {
      name: 'Klarna',
      category: 'functional',
      description: 'Zahlungsanbieter'
    },
    'intercom.io': {
      name: 'Intercom',
      category: 'functional',
      description: 'Chat-Support-Widget'
    },
    'zendesk.com': {
      name: 'Zendesk',
      category: 'functional',
      description: 'Kundenservice-Widget'
    },
    'crisp.chat': {
      name: 'Crisp',
      category: 'functional',
      description: 'Live-Chat-Widget'
    },
    'tawk.to': {
      name: 'Tawk.to',
      category: 'functional',
      description: 'Kostenloses Chat-Widget'
    },
    'cookiebot.com': {
      name: 'Cookiebot',
      category: 'functional',
      description: 'Cookie-Consent-Management'
    },
    'onetrust.com': {
      name: 'OneTrust',
      category: 'functional',
      description: 'Cookie-Consent-Management'
    },
    'usercentrics.eu': {
      name: 'Usercentrics',
      category: 'functional',
      description: 'Cookie-Consent-Management'
    },
    'cookiefirst.com': {
      name: 'CookieFirst',
      category: 'functional',
      description: 'Cookie-Consent-Management'
    },

    // === FINGERPRINTING ===
    'fingerprintjs.com': {
      name: 'FingerprintJS',
      category: 'fingerprinting',
      description: 'Identifiziert dich anhand von Browser-Merkmalen - ohne Cookies',
      details: 'FingerprintJS erstellt einen einzigartigen "Fingerabdruck" deines Browsers - OHNE Cookies! Es analysiert: installierte Schriften, Bildschirmauflösung, Zeitzone, Browser-Plugins, WebGL-Renderer, Audio-Kontext, Canvas-Rendering und hunderte weitere Merkmale. Die Kombination ist so einzigartig, dass du zu 99,5% wiedererkannt werden kannst - auch im Inkognito-Modus!'
    },

    // === E-MAIL MARKETING ===
    'mailchimp.com': {
      name: 'Mailchimp',
      category: 'analytics',
      description: 'E-Mail-Marketing und Newsletter-Tracking'
    },
    'hubspot.com': {
      name: 'HubSpot',
      category: 'analytics',
      description: 'Marketing-Automatisierung und CRM'
    },
    'hs-scripts.com': {
      name: 'HubSpot Scripts',
      category: 'analytics',
      description: 'HubSpot Tracking-Scripts'
    },
    'hsforms.com': {
      name: 'HubSpot Forms',
      category: 'functional',
      description: 'HubSpot Formulare'
    },
    'sendinblue.com': {
      name: 'Sendinblue',
      category: 'analytics',
      description: 'E-Mail-Marketing'
    },
    'klaviyo.com': {
      name: 'Klaviyo',
      category: 'analytics',
      description: 'E-Commerce Marketing'
    },

    // === DEUTSCHE DIENSTE ===
    'ioam.de': {
      name: 'IVW/AGOF',
      category: 'analytics',
      description: 'Deutsche Reichweitenmessung für Medien'
    },
    'etracker.com': {
      name: 'etracker',
      category: 'analytics',
      description: 'Deutsche Analytics-Lösung - DSGVO-konformer'
    },
    'econda.de': {
      name: 'econda',
      category: 'analytics',
      description: 'Deutsche Analytics für E-Commerce'
    },
    'webtrekk.net': {
      name: 'Webtrekk',
      category: 'analytics',
      description: 'Deutsche Enterprise-Analytics (jetzt Mapp)'
    },
    'mapp.com': {
      name: 'Mapp',
      category: 'analytics',
      description: 'Marketing Cloud - Analytics und Personalisierung'
    },
    'adition.com': {
      name: 'Adition',
      category: 'advertising',
      description: 'Deutscher Ad Server (Virtual Minds)'
    },

    // === AFFILIATE NETZWERKE ===
    'awin1.com': {
      name: 'Awin',
      category: 'advertising',
      description: 'Affiliate-Netzwerk - trackt ob du über Partnerlinks kaufst'
    },
    'dwin1.com': {
      name: 'Awin (Affilinet)',
      category: 'advertising',
      description: 'Awin Affiliate Tracking'
    },
    'webgains.com': {
      name: 'Webgains',
      category: 'advertising',
      description: 'Affiliate Marketing Netzwerk'
    },
    'tradedoubler.com': {
      name: 'Tradedoubler',
      category: 'advertising',
      description: 'Europäisches Affiliate-Netzwerk'
    },
    'cj.com': {
      name: 'CJ Affiliate',
      category: 'advertising',
      description: 'Commission Junction - großes Affiliate-Netzwerk'
    },
    'emjcd.com': {
      name: 'CJ Affiliate',
      category: 'advertising',
      description: 'Commission Junction Tracking'
    },
    'rakuten.com': {
      name: 'Rakuten Advertising',
      category: 'advertising',
      description: 'Rakuten Affiliate Marketing'
    },
    'impact.com': {
      name: 'Impact',
      category: 'advertising',
      description: 'Partnership Management Plattform'
    },
    'impactradius.com': {
      name: 'Impact Radius',
      category: 'advertising',
      description: 'Affiliate und Influencer Tracking'
    },
    'partnerize.com': {
      name: 'Partnerize',
      category: 'advertising',
      description: 'Partner Marketing Plattform'
    },
    'shareasale.com': {
      name: 'ShareASale',
      category: 'advertising',
      description: 'Affiliate-Netzwerk'
    },
    'skimlinks.com': {
      name: 'Skimlinks',
      category: 'advertising',
      description: 'Automatisches Affiliate-Linking in Artikeln'
    },

    // === E-COMMERCE TRACKING ===
    'richrelevance.com': {
      name: 'RichRelevance',
      category: 'analytics',
      description: 'Produktempfehlungen basierend auf deinem Verhalten'
    },
    'dynamicyield.com': {
      name: 'Dynamic Yield',
      category: 'analytics',
      description: 'Personalisierung - passt Website-Inhalte an dich an'
    },
    'monetate.net': {
      name: 'Monetate',
      category: 'analytics',
      description: 'E-Commerce Personalisierung und A/B-Testing'
    },
    'nosto.com': {
      name: 'Nosto',
      category: 'analytics',
      description: 'E-Commerce Personalisierung und Produktempfehlungen'
    },
    'barilliance.com': {
      name: 'Barilliance',
      category: 'analytics',
      description: 'E-Commerce Personalisierung und Cart-Abandonment'
    },
    'sailthru.com': {
      name: 'Sailthru',
      category: 'analytics',
      description: 'Personalisierte E-Mail und Web-Erlebnisse'
    },
    'bluecore.com': {
      name: 'Bluecore',
      category: 'analytics',
      description: 'E-Commerce Marketing Automatisierung'
    },
    'yotpo.com': {
      name: 'Yotpo',
      category: 'analytics',
      description: 'Bewertungen und User-Generated Content'
    },
    'bazaarvoice.com': {
      name: 'Bazaarvoice',
      category: 'analytics',
      description: 'Kundenbewertungen und Social Commerce'
    },
    'trustpilot.com': {
      name: 'Trustpilot',
      category: 'functional',
      description: 'Bewertungsplattform - zeigt Kundenmeinungen'
    },
    'trustedshops.com': {
      name: 'Trusted Shops',
      category: 'functional',
      description: 'Gütesiegel und Bewertungen (Deutschland)'
    },

    // === A/B TESTING ===
    'optimizely.com': {
      name: 'Optimizely',
      category: 'analytics',
      description: 'A/B-Testing - testet verschiedene Versionen an dir'
    },
    'vwo.com': {
      name: 'VWO',
      category: 'analytics',
      description: 'Visual Website Optimizer - A/B-Tests'
    },
    'abtasty.com': {
      name: 'AB Tasty',
      category: 'analytics',
      description: 'A/B-Testing und Personalisierung'
    },
    'kameleoon.com': {
      name: 'Kameleoon',
      category: 'analytics',
      description: 'AI-Personalisierung und A/B-Tests'
    },

    // === PUSH NOTIFICATIONS ===
    'onesignal.com': {
      name: 'OneSignal',
      category: 'analytics',
      description: 'Push-Benachrichtigungen und In-App Messaging'
    },
    'pushwoosh.com': {
      name: 'Pushwoosh',
      category: 'analytics',
      description: 'Push-Nachrichten für Mobile und Web'
    },
    'pushengage.com': {
      name: 'PushEngage',
      category: 'analytics',
      description: 'Web Push-Benachrichtigungen'
    },
    'subscribers.com': {
      name: 'Subscribers',
      category: 'analytics',
      description: 'Browser Push-Benachrichtigungen'
    },

    // === CMP (Consent Management) ===
    'sourcepoint.com': {
      name: 'Sourcepoint',
      category: 'functional',
      description: 'Cookie-Consent-Management'
    },
    'quantcast.com': {
      name: 'Quantcast',
      category: 'advertising',
      description: 'Audience Measurement und Targeting'
    },
    'consensu.org': {
      name: 'IAB TCF',
      category: 'functional',
      description: 'IAB Transparency & Consent Framework'
    },

    // === TAG MANAGEMENT ===
    'tealiumiq.com': {
      name: 'Tealium',
      category: 'analytics',
      description: 'Tag Management - lädt und koordiniert viele Tracking-Scripts'
    },
    'tags.tiqcdn.com': {
      name: 'Tealium CDN',
      category: 'analytics',
      description: 'Tealium Tag-Auslieferung'
    },
    'ensighten.com': {
      name: 'Ensighten',
      category: 'analytics',
      description: 'Enterprise Tag Management'
    },
    'commandersact.com': {
      name: 'Commanders Act',
      category: 'analytics',
      description: 'Tag Management und Server-Side Tracking'
    },
    'tagcommander.com': {
      name: 'Tag Commander',
      category: 'analytics',
      description: 'Europäisches Tag Management System'
    },

    // === CUSTOMER DATA PLATFORMS ===
    'treasuredata.com': {
      name: 'Treasure Data',
      category: 'analytics',
      description: 'Customer Data Platform - sammelt alle deine Daten'
    },
    'lytics.io': {
      name: 'Lytics',
      category: 'analytics',
      description: 'CDP - erstellt Kundenprofile aus deinem Verhalten'
    },
    'zeotap.com': {
      name: 'Zeotap',
      category: 'advertising',
      description: 'Customer Intelligence Platform - Datenhandel'
    },
    'permutive.com': {
      name: 'Permutive',
      category: 'analytics',
      description: 'Edge-basierte Audience Platform'
    },
    'blueconic.com': {
      name: 'BlueConic',
      category: 'analytics',
      description: 'Customer Data Platform'
    },

    // === FRAUD DETECTION ===
    'forter.com': {
      name: 'Forter',
      category: 'functional',
      description: 'Betrugserkennung bei Online-Käufen',
      details: 'Forter analysiert in Echtzeit ob du ein Betrüger bist. Es prüft: Geräte-Fingerprint, Mausbewegungen (Bots bewegen sich anders als Menschen), Tippgeschwindigkeit, Standort, Zahlungshistorie und mehr. Wenn Forter dich als verdächtig einstuft, wird deine Bestellung möglicherweise abgelehnt.'
    },
    'sift.com': {
      name: 'Sift',
      category: 'functional',
      description: 'Fraud Prevention - prüft ob du echt bist',
      details: 'Sift (früher Sift Science) nutzt Machine Learning um Betrug zu erkennen. Es analysiert tausende Signale: Gerätedaten, Verhaltensmuster, Netzwerk-Informationen. Sift hat ein globales Netzwerk - wenn du bei einer Website als Betrüger markiert wirst, kann das auch andere Websites beeinflussen.'
    },
    'riskified.com': {
      name: 'Riskified',
      category: 'functional',
      description: 'Betrugserkennung für E-Commerce',
      details: 'Riskified übernimmt die Haftung für Betrug - wenn sie eine Transaktion genehmigen und es doch Betrug war, zahlen sie. Deshalb sammeln sie sehr umfangreiche Daten: Geräte-Fingerprinting, Verhaltensanalyse, Social-Media-Verknüpfungen und mehr.'
    },
    'signifyd.com': {
      name: 'Signifyd',
      category: 'functional',
      description: 'E-Commerce Fraud Protection',
      details: 'Signifyd prüft jede Bestellung auf Betrugsrisiko. Sie analysieren das Gerät, die Identität, den Bestellverlauf und Tausende weitere Datenpunkte. Eine der größten Fraud-Prevention-Plattformen mit über 10.000 Händlern.'
    },
    'kount.com': {
      name: 'Kount',
      category: 'functional',
      description: 'AI-basierte Betrugserkennung',
      details: 'Kount (gehört zu Equifax) nutzt KI für Betrugserkennung. Es erstellt einen "Trust Score" basierend auf Gerätedaten, Standort, E-Mail-Reputation und Transaktionsmustern. Kount sieht über 32 Milliarden Transaktionen pro Jahr.'
    },
    'threatmetrix.com': {
      name: 'ThreatMetrix',
      category: 'fingerprinting',
      description: 'LexisNexis Device-Fingerprinting - erkennt dein Gerät',
      details: 'ThreatMetrix (jetzt LexisNexis Risk Solutions) ist einer der aggressivsten Fingerprinter. Es nutzt über 100 Attribute: Browser-Fingerprint, Netzwerk-Analyse, Verhaltensbiometrie (wie schnell tippst du? Wie bewegst du die Maus?). ThreatMetrix hat eine globale Datenbank mit Milliarden von Geräte-IDs.'
    },
    'online-metrix.net': {
      name: 'ThreatMetrix',
      category: 'fingerprinting',
      description: 'Device Intelligence und Fingerprinting',
      details: 'Technische Domain für ThreatMetrix-Datensammlung. Hier wird der JavaScript-Code geladen der dein Gerät analysiert und einen einzigartigen Fingerprint erstellt.'
    },

    // === SESSION RECORDING ===
    'smartlook.com': {
      name: 'Smartlook',
      category: 'analytics',
      description: 'Session Recording - nimmt deine Aktionen auf Video auf'
    },
    'inspectlet.com': {
      name: 'Inspectlet',
      category: 'analytics',
      description: 'Session Recording und Heatmaps'
    },
    'luckyorange.com': {
      name: 'Lucky Orange',
      category: 'analytics',
      description: 'Live-Session-Recording und Heatmaps'
    },
    'logrocket.com': {
      name: 'LogRocket',
      category: 'analytics',
      description: 'Session Replay für Entwickler'
    },
    'usertesting.com': {
      name: 'UserTesting',
      category: 'analytics',
      description: 'User Experience Research'
    },
    'contentsquare.com': {
      name: 'Contentsquare',
      category: 'analytics',
      description: 'Digital Experience Analytics - analysiert jeden Klick'
    },
    'clicktale.net': {
      name: 'Clicktale',
      category: 'analytics',
      description: 'Session Recording (jetzt Contentsquare)'
    },

    // === SURVEYS / FEEDBACK ===
    'qualtrics.com': {
      name: 'Qualtrics',
      category: 'analytics',
      description: 'Umfragen und Experience Management'
    },
    'surveymonkey.com': {
      name: 'SurveyMonkey',
      category: 'analytics',
      description: 'Online-Umfragen'
    },
    'typeform.com': {
      name: 'Typeform',
      category: 'functional',
      description: 'Interaktive Formulare und Umfragen'
    },
    'usabilla.com': {
      name: 'Usabilla',
      category: 'analytics',
      description: 'Website-Feedback-Widget'
    },
    'medallia.com': {
      name: 'Medallia',
      category: 'analytics',
      description: 'Customer Experience Management'
    },

    // === MEDIA / VIDEO ===
    'jwplayer.com': {
      name: 'JW Player',
      category: 'cdn',
      description: 'Video-Player - kann Wiedergabe tracken'
    },
    'brightcove.com': {
      name: 'Brightcove',
      category: 'cdn',
      description: 'Video-Hosting und Player'
    },
    'vimeo.com': {
      name: 'Vimeo',
      category: 'cdn',
      description: 'Video-Hosting - weniger Tracking als YouTube'
    },
    'wistia.com': {
      name: 'Wistia',
      category: 'analytics',
      description: 'Video-Hosting mit detailliertem Analytics'
    },
    'dailymotion.com': {
      name: 'Dailymotion',
      category: 'social',
      description: 'Video-Plattform'
    },
    'soundcloud.com': {
      name: 'SoundCloud',
      category: 'social',
      description: 'Audio-Streaming'
    },
    'spotify.com': {
      name: 'Spotify',
      category: 'social',
      description: 'Eingebettete Spotify-Player'
    },

    // === ATTRIBUTION ===
    'appsflyer.com': {
      name: 'AppsFlyer',
      category: 'advertising',
      description: 'Mobile Attribution - trackt woher App-Nutzer kommen'
    },
    'adjust.com': {
      name: 'Adjust',
      category: 'advertising',
      description: 'Mobile Marketing Analytics und Attribution'
    },
    'branch.io': {
      name: 'Branch',
      category: 'advertising',
      description: 'Deep Linking und Mobile Attribution'
    },
    'singular.net': {
      name: 'Singular',
      category: 'advertising',
      description: 'Marketing Analytics und Attribution'
    },
    'kochava.com': {
      name: 'Kochava',
      category: 'advertising',
      description: 'Mobile Attribution und Analytics'
    },

    // === ERROR TRACKING (meist harmlos) ===
    'sentry.io': {
      name: 'Sentry',
      category: 'functional',
      description: 'Fehler-Tracking für Entwickler - hilft Bugs zu finden'
    },
    'bugsnag.com': {
      name: 'Bugsnag',
      category: 'functional',
      description: 'Fehler-Monitoring'
    },
    'rollbar.com': {
      name: 'Rollbar',
      category: 'functional',
      description: 'Fehler-Tracking'
    },
    'raygun.com': {
      name: 'Raygun',
      category: 'functional',
      description: 'Error und Performance Monitoring'
    },
    'newrelic.com': {
      name: 'New Relic',
      category: 'analytics',
      description: 'Application Performance Monitoring'
    },
    'datadoghq.com': {
      name: 'Datadog',
      category: 'analytics',
      description: 'Infrastructure Monitoring - meist für Entwickler'
    },

    // === CLOUDFLARE ERWEITERT ===
    'cdnjs.com': {
      name: 'cdnjs',
      category: 'cdn',
      description: 'Open Source JavaScript CDN - harmlos'
    },
    'cloudflareinsights.com': {
      name: 'Cloudflare Analytics',
      category: 'analytics',
      description: 'Cloudflare Web Analytics - datenschutzfreundlicher'
    },

    // === ZUSÄTZLICHE WERBE-EXCHANGES ===
    'contextweb.com': {
      name: 'PulsePoint',
      category: 'advertising',
      description: 'Health-fokussierte Werbeplattform'
    },
    'rhythmone.com': {
      name: 'RhythmOne',
      category: 'advertising',
      description: 'Multi-Screen Werbeplattform'
    },
    'undertone.com': {
      name: 'Undertone',
      category: 'advertising',
      description: 'High-Impact Display Werbung'
    },
    'adyoulike.com': {
      name: 'Adyoulike',
      category: 'advertising',
      description: 'Native Advertising Plattform'
    },
    'kargo.com': {
      name: 'Kargo',
      category: 'advertising',
      description: 'Mobile Advertising'
    },
    'justpremium.com': {
      name: 'JustPremium',
      category: 'advertising',
      description: 'Premium Display Advertising'
    },
    'sublime.xyz': {
      name: 'Sublime',
      category: 'advertising',
      description: 'High-Impact Werbung'
    }
  };

  return {
    /**
     * Holt Info zu einer Domain
     * @param {string} domain
     * @returns {Object|null}
     */
    getTracker(domain) {
      // Exakte Übereinstimmung
      if (TRACKERS[domain]) {
        return { ...TRACKERS[domain], domain };
      }

      // Subdomain-Check (z.B. www.google.com -> google.com)
      const parts = domain.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (TRACKERS[parentDomain]) {
          return { ...TRACKERS[parentDomain], domain };
        }
      }

      return null;
    },

    /**
     * Kategorisiert eine Domain
     * @param {string} domain
     * @returns {string} - Kategorie-Key
     */
    categorize(domain) {
      const tracker = this.getTracker(domain);
      return tracker ? tracker.category : 'unknown';
    },

    /**
     * Holt Kategorie-Info
     * @param {string} categoryKey
     * @returns {Object}
     */
    getCategory(categoryKey) {
      return CATEGORIES[categoryKey] || CATEGORIES.unknown;
    },

    /**
     * Holt alle Kategorien
     * @returns {Object}
     */
    getAllCategories() {
      return { ...CATEGORIES };
    },

    /**
     * Analysiert eine Liste von Domains
     * @param {Array<string>} domains
     * @returns {Object} - { byCategory, known, unknown }
     */
    analyzeDomains(domains) {
      const byCategory = {};
      const known = [];
      const unknown = [];

      for (const domain of domains) {
        const tracker = this.getTracker(domain);
        const category = tracker ? tracker.category : 'unknown';

        if (!byCategory[category]) {
          byCategory[category] = [];
        }
        byCategory[category].push({
          domain,
          info: tracker
        });

        if (tracker) {
          known.push({ domain, ...tracker });
        } else {
          unknown.push(domain);
        }
      }

      return { byCategory, known, unknown };
    },

    /**
     * Zählt Tracker nach Kategorie
     * @param {Array<string>} domains
     * @returns {Object} - { advertising: 5, analytics: 3, ... }
     */
    countByCategory(domains) {
      const counts = {};
      for (const key of Object.keys(CATEGORIES)) {
        counts[key] = 0;
      }

      for (const domain of domains) {
        const category = this.categorize(domain);
        counts[category]++;
      }

      return counts;
    },

    /**
     * Berechnet Privacy-Score basierend auf Trackern
     * @param {Array<string>} domains
     * @returns {Object} - { score, level, breakdown }
     */
    calculatePrivacyScore(domains) {
      const counts = this.countByCategory(domains);

      // Gewichtung (höher = schlechter)
      const weights = {
        advertising: 10,
        fingerprinting: 15,
        analytics: 5,
        social: 3,
        unknown: 2,
        functional: 0,
        cdn: 0
      };

      let rawScore = 0;
      for (const [category, count] of Object.entries(counts)) {
        rawScore += count * (weights[category] || 0);
      }

      // Score 0-100 (0 = gut, 100 = schlecht)
      const score = Math.min(100, rawScore);

      let level;
      if (score <= 20) level = 'good';
      else if (score <= 50) level = 'moderate';
      else if (score <= 75) level = 'bad';
      else level = 'terrible';

      return {
        score,
        level,
        breakdown: counts,
        totalTrackers: domains.length
      };
    },

    /**
     * Erstellt eine MENSCHLICHE Zusammenfassung für normale User
     * @param {Array<string>} domains - Liste der kontaktierten Domains
     * @returns {Object} - { headline, summary, details, riskLevel, advice }
     */
    createHumanSummary(domains) {
      const analysis = this.analyzeDomains(domains);
      const counts = this.countByCategory(domains);
      const score = this.calculatePrivacyScore(domains);

      // Zähle kritische Tracker
      const adCount = counts.advertising || 0;
      const analyticsCount = counts.analytics || 0;
      const socialCount = counts.social || 0;
      const fingerprintCount = counts.fingerprinting || 0;
      const harmlessCount = (counts.cdn || 0) + (counts.functional || 0);

      const criticalCount = adCount + fingerprintCount;
      const trackingCount = adCount + analyticsCount + socialCount + fingerprintCount;
      const totalCount = domains.length;

      // Headline basierend auf Schwere
      let headline, riskLevel, riskColor;

      if (criticalCount === 0 && trackingCount <= 2) {
        headline = '✅ Diese Seite respektiert deine Privatsphäre';
        riskLevel = 'Niedriges Risiko';
        riskColor = 'green';
      } else if (criticalCount <= 2 && trackingCount <= 5) {
        headline = '⚠️ Diese Seite sammelt einige Daten über dich';
        riskLevel = 'Mittleres Risiko';
        riskColor = 'yellow';
      } else if (criticalCount <= 5) {
        headline = '🔴 Diese Seite verfolgt dein Verhalten intensiv';
        riskLevel = 'Hohes Risiko';
        riskColor = 'orange';
      } else {
        headline = '🚨 Diese Seite ist ein Datenkrake!';
        riskLevel = 'Sehr hohes Risiko';
        riskColor = 'red';
      }

      // Menschliche Zusammenfassung
      const summaryParts = [];

      if (totalCount === 0) {
        summaryParts.push('Diese Seite kontaktiert keine externen Dienste. Das ist selten und gut für deine Privatsphäre!');
      } else {
        summaryParts.push(`Diese Seite hat im Hintergrund ${totalCount} externe Dienste kontaktiert.`);

        if (adCount > 0) {
          summaryParts.push(`${adCount} davon ${adCount === 1 ? 'verfolgt' : 'verfolgen'} dich für Werbezwecke.`);
        }

        if (analyticsCount > 0) {
          summaryParts.push(`${analyticsCount} ${analyticsCount === 1 ? 'beobachtet' : 'beobachten'}, wie du die Seite nutzt.`);
        }

        if (socialCount > 0) {
          summaryParts.push(`${socialCount} Social-Media-${socialCount === 1 ? 'Dienst erfährt' : 'Dienste erfahren'}, dass du hier bist.`);
        }

        if (fingerprintCount > 0) {
          summaryParts.push(`⚠️ ${fingerprintCount} ${fingerprintCount === 1 ? 'Dienst versucht' : 'Dienste versuchen'}, dich per Fingerprinting zu identifizieren!`);
        }
      }

      // Details für Interessierte
      const details = [];

      if (adCount > 0) {
        const adTrackers = analysis.byCategory.advertising || [];
        details.push({
          icon: '🔴',
          title: `${adCount} Werbe-Tracker`,
          description: 'Merken sich, was dich interessiert, um dir später Werbung zu zeigen',
          examples: adTrackers.slice(0, 3).map(t => t.info?.name || t.domain).join(', ')
        });
      }

      if (analyticsCount > 0) {
        const analyticsTrackers = analysis.byCategory.analytics || [];
        details.push({
          icon: '🟡',
          title: `${analyticsCount} Analyse-Dienste`,
          description: 'Beobachten dein Klick- und Scroll-Verhalten auf dieser Seite',
          examples: analyticsTrackers.slice(0, 3).map(t => t.info?.name || t.domain).join(', ')
        });
      }

      if (socialCount > 0) {
        const socialTrackers = analysis.byCategory.social || [];
        details.push({
          icon: '🔵',
          title: `${socialCount} Social-Media-Verbindungen`,
          description: 'Soziale Netzwerke erfahren, dass du diese Seite besuchst',
          examples: socialTrackers.slice(0, 3).map(t => t.info?.name || t.domain).join(', ')
        });
      }

      if (harmlessCount > 0) {
        details.push({
          icon: '🟢',
          title: `${harmlessCount} technische Dienste`,
          description: 'Notwendig oder harmlos - laden Schriften, Bilder oder ermöglichen Funktionen',
          examples: ''
        });
      }

      // Ratschlag
      let advice;
      if (criticalCount === 0) {
        advice = 'Alles gut! Diese Seite scheint deine Privatsphäre zu respektieren.';
      } else if (criticalCount <= 2) {
        advice = 'Tipp: Wenn du Cookies abgelehnt hast, sind die meisten Tracker blockiert.';
      } else {
        advice = '💡 Du kannst deine Cookie-Einstellungen jederzeit ändern und Tracking reduzieren.';
      }

      return {
        headline,
        summary: summaryParts.join(' '),
        details,
        riskLevel,
        riskColor,
        advice,
        stats: {
          total: totalCount,
          tracking: trackingCount,
          critical: criticalCount,
          harmless: harmlessCount
        }
      };
    }
  };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrackerDB;
} else if (typeof window !== 'undefined') {
  window.TrackerDB = TrackerDB;
}
