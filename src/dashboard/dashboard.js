/**
 * Consent Guardian - Dashboard Script
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

(function() {
  'use strict';

  // State
  let allConsents = [];
  let allRequests = [];
  let settings = {};
  let displayedPages = []; // Aktuell angezeigte Seiten (gefiltert/sortiert)

  // DOM-Elemente
  const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Overview
    totalConsents: document.getElementById('totalConsents'),
    totalDetected: document.getElementById('totalDetected'),
    totalReject: document.getElementById('totalReject'),
    totalCustom: document.getElementById('totalCustom'),
    totalAccept: document.getElementById('totalAccept'),
    detectedPercent: document.getElementById('detectedPercent'),
    rejectPercent: document.getElementById('rejectPercent'),
    customPercent: document.getElementById('customPercent'),
    acceptPercent: document.getElementById('acceptPercent'),
    darkPatternCount: document.getElementById('darkPatternCount'),
    avgScore: document.getElementById('avgScore'),
    domainCount: document.getElementById('domainCount'),
    lastAnalysis: document.getElementById('lastAnalysis'),
    recentActivity: document.getElementById('recentActivity'),

    // Detail Panels
    darkPatternCard: document.getElementById('darkPatternCard'),
    darkPatternDetail: document.getElementById('darkPatternDetail'),
    closeDarkPatternDetail: document.getElementById('closeDarkPatternDetail'),
    patternTypeList: document.getElementById('patternTypeList'),
    worstOffenders: document.getElementById('worstOffenders'),
    domainsCard: document.getElementById('domainsCard'),
    domainsDetail: document.getElementById('domainsDetail'),
    closeDomainsDetail: document.getElementById('closeDomainsDetail'),
    domainsList: document.getElementById('domainsList'),
    searchDomains: document.getElementById('searchDomains'),

    // History
    searchHistory: document.getElementById('searchHistory'),
    filterType: document.getElementById('filterType'),
    historyTable: document.getElementById('historyTable'),

    // Settings
    settingAutoAnalyze: document.getElementById('settingAutoAnalyze'),
    settingWarnings: document.getElementById('settingWarnings'),
    settingNotifications: document.getElementById('settingNotifications'),
    settingTrackRequests: document.getElementById('settingTrackRequests'),
    settingProMode: document.getElementById('settingProMode'),
    exportData: document.getElementById('exportData'),
    importData: document.getElementById('importData'),
    clearData: document.getElementById('clearData'),

    // Network Tab
    searchRequests: document.getElementById('searchRequests'),
    filterCategory: document.getElementById('filterCategory'),
    requestList: document.getElementById('requestList'),
    requestCount: document.getElementById('requestCount'),
    clearRequests: document.getElementById('clearRequests')
  };

  /**
   * Initialisierung
   */
  async function init() {
    // Daten laden
    await loadData();

    // Event-Listener
    setupEventListeners();

    // UI aktualisieren
    updateOverview();
    updateHistory();
    updateNetwork();
    updatePagesList();
    updateSettings();
  }

  /**
   * Lädt alle Daten
   */
  async function loadData() {
    try {
      [allConsents, settings, allRequests] = await Promise.all([
        BrowserAPI.runtime.sendMessage({ type: 'GET_CONSENTS' }),
        BrowserAPI.runtime.sendMessage({ type: 'GET_SETTINGS' }),
        BrowserAPI.runtime.sendMessage({ type: 'GET_REQUESTS' })
      ]);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      allConsents = [];
      allRequests = [];
      settings = {};
    }
  }

  /**
   * Event-Listener einrichten
   */
  function setupEventListeners() {
    // Tab-Navigation
    elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // History Filter
    elements.searchHistory.addEventListener('input', updateHistory);
    elements.filterType.addEventListener('change', updateHistory);

    // Settings
    elements.settingAutoAnalyze.addEventListener('change', saveSettings);
    elements.settingWarnings.addEventListener('change', saveSettings);
    elements.settingNotifications.addEventListener('change', saveSettings);
    elements.settingTrackRequests?.addEventListener('change', saveSettings);
    elements.settingProMode?.addEventListener('change', saveSettings);

    // Data Management
    elements.exportData.addEventListener('click', exportData);
    elements.importData.addEventListener('click', importData);
    elements.clearData.addEventListener('click', clearData);

    // Detail Panels - Dark Patterns
    elements.darkPatternCard?.addEventListener('click', () => {
      elements.darkPatternDetail?.classList.remove('hidden');
      elements.domainsDetail?.classList.add('hidden');
      updateDarkPatternDetail();
    });
    elements.closeDarkPatternDetail?.addEventListener('click', () => {
      elements.darkPatternDetail?.classList.add('hidden');
    });

    // Detail Panels - Domains
    elements.domainsCard?.addEventListener('click', () => {
      elements.domainsDetail?.classList.remove('hidden');
      elements.darkPatternDetail?.classList.add('hidden');
      updateDomainsDetail();
    });
    elements.closeDomainsDetail?.addEventListener('click', () => {
      elements.domainsDetail?.classList.add('hidden');
    });
    elements.searchDomains?.addEventListener('input', updateDomainsDetail);

    // Network Tab
    elements.searchRequests?.addEventListener('input', updateNetwork);
    elements.filterCategory?.addEventListener('change', updateNetwork);
    elements.requestView?.addEventListener('change', updateNetwork);
    elements.clearRequests?.addEventListener('click', clearRequests);

    // Network Sub-Tabs
    document.querySelectorAll('.network-subtab').forEach(btn => {
      btn.addEventListener('click', () => switchNetworkSubtab(btn.dataset.subtab));
    });

    // Page Detail View
    document.getElementById('backToPagesList')?.addEventListener('click', () => {
      document.getElementById('pageDetailView')?.classList.add('hidden');
      document.getElementById('subtab-pages')?.classList.remove('hidden');
    });

    // Event Delegation für Seitenliste (klickbare Seiten-Karten)
    document.getElementById('pagesList')?.addEventListener('click', (e) => {
      const pageItem = e.target.closest('[data-page-index]');
      if (pageItem) {
        const index = parseInt(pageItem.dataset.pageIndex, 10);
        if (!isNaN(index)) {
          showPageDetail(index);
        }
      }
    });

    // Search Pages
    document.getElementById('searchPages')?.addEventListener('input', updatePagesList);

    // Logo-Link: Zurück zur Übersicht
    document.getElementById('logoHomeLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('overview');
    });
  }

  /**
   * Tab wechseln
   */
  function switchTab(tabId) {
    elements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    elements.tabContents.forEach(content => {
      content.classList.toggle('hidden', content.id !== `tab-${tabId}`);
    });
  }

  /**
   * Übersicht aktualisieren
   */
  function updateOverview() {
    const total = allConsents.length;
    const detected = allConsents.filter(c => c.consentType === 'detected').length;
    const reject = allConsents.filter(c => c.consentType === 'reject_all').length;
    const custom = allConsents.filter(c => c.consentType === 'custom').length;
    const accept = allConsents.filter(c => c.consentType === 'accept_all').length;

    elements.totalConsents.textContent = total;
    elements.totalDetected.textContent = detected;
    elements.totalReject.textContent = reject;
    elements.totalCustom.textContent = custom;
    elements.totalAccept.textContent = accept;

    elements.detectedPercent.textContent = total > 0 ? `${Math.round(detected / total * 100)}%` : '0%';
    elements.rejectPercent.textContent = total > 0 ? `${Math.round(reject / total * 100)}%` : '0%';
    elements.customPercent.textContent = total > 0 ? `${Math.round(custom / total * 100)}%` : '0%';
    elements.acceptPercent.textContent = total > 0 ? `${Math.round(accept / total * 100)}%` : '0%';

    // Dark Pattern Stats
    const totalDarkPatterns = allConsents.reduce((sum, c) => sum + (c.darkPatterns?.length || 0), 0);
    const avgDarkPatternScore = total > 0
      ? Math.round(allConsents.reduce((sum, c) => sum + (c.darkPatternScore || 0), 0) / total)
      : 0;

    elements.darkPatternCount.textContent = totalDarkPatterns;
    elements.avgScore.textContent = avgDarkPatternScore;

    // Score Badge mit Farbcodierung
    const scoreBadge = document.getElementById('avgScoreBadge');
    if (scoreBadge) {
      if (avgDarkPatternScore <= 25) {
        scoreBadge.textContent = 'Sehr gut';
        scoreBadge.className = 'text-xs px-2 py-0.5 rounded bg-green-100 text-green-700';
      } else if (avgDarkPatternScore <= 50) {
        scoreBadge.textContent = 'Fragwürdig';
        scoreBadge.className = 'text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700';
      } else {
        scoreBadge.textContent = 'Manipulativ';
        scoreBadge.className = 'text-xs px-2 py-0.5 rounded bg-red-100 text-red-700';
      }
    }

    // Domains
    const uniqueDomains = [...new Set(allConsents.map(c => c.domain))];
    elements.domainCount.textContent = uniqueDomains.length;

    // Last Analysis
    if (allConsents.length > 0) {
      const lastConsent = allConsents.sort((a, b) => b.timestamp - a.timestamp)[0];
      elements.lastAnalysis.textContent = formatDate(lastConsent.timestamp);
    }

    // Recent Activity
    updateRecentActivity();
  }

  /**
   * Letzte Aktivität aktualisieren
   */
  function updateRecentActivity() {
    const recent = allConsents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    if (recent.length === 0) {
      elements.recentActivity.innerHTML = '<p class="text-gray-500 text-center py-4">Keine Aktivität vorhanden</p>';
      return;
    }

    elements.recentActivity.innerHTML = recent.map(consent => `
      <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div class="flex items-center gap-3">
          <span class="${getConsentBadgeClass(consent.consentType)} consent-badge">
            ${getConsentTypeLabel(consent.consentType)}
          </span>
          <span class="text-gray-700">${consent.domain}</span>
        </div>
        <div class="flex items-center gap-3">
          ${consent.darkPatternScore > 0 ? `
            <span class="text-xs ${getScoreColor(consent.darkPatternScore)}">
              Score: ${consent.darkPatternScore}
            </span>
          ` : ''}
          <span class="text-xs text-gray-400">${formatDate(consent.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Verlauf aktualisieren
   */
  function updateHistory() {
    const search = elements.searchHistory.value.toLowerCase();
    const filterType = elements.filterType.value;

    let filtered = allConsents;

    // Nach Domain filtern
    if (search) {
      filtered = filtered.filter(c => c.domain.toLowerCase().includes(search));
    }

    // Nach Typ filtern
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.consentType === filterType);
    }

    // Sortieren (neueste zuerst)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filtered.length === 0) {
      elements.historyTable.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-gray-500 py-8">Keine Einträge gefunden</td>
        </tr>
      `;
      return;
    }

    elements.historyTable.innerHTML = filtered.map(consent => `
      <tr>
        <td>
          <div class="font-medium text-gray-900">${consent.domain}</div>
          <div class="text-xs text-gray-400">${consent.url}</div>
        </td>
        <td>
          <span class="${getConsentBadgeClass(consent.consentType)} consent-badge">
            ${getConsentTypeLabel(consent.consentType)}
          </span>
        </td>
        <td>
          ${consent.darkPatterns?.length > 0 ? `
            <span class="text-red-600 text-sm">${consent.darkPatterns.length} erkannt</span>
            <div class="text-xs text-gray-400">${consent.darkPatterns.slice(0, 2).join(', ')}${consent.darkPatterns.length > 2 ? '...' : ''}</div>
          ` : `
            <span class="text-green-600 text-sm">Keine</span>
          `}
        </td>
        <td class="text-gray-500">${formatDate(consent.timestamp)}</td>
        <td>
          <button class="text-red-500 hover:text-red-700 text-sm" onclick="deleteConsent('${consent.id}')">
            Löschen
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Netzwerk-Tab aktualisieren
   */
  function updateNetwork() {
    const summaryEl = document.getElementById('networkSummary');

    // Alle Domains sammeln
    const allDomains = [];
    const domainMap = new Map();

    for (const page of (allRequests || [])) {
      for (const req of (page.requests || [])) {
        const key = req.domain;
        if (!allDomains.includes(key)) {
          allDomains.push(key);
        }
        if (!domainMap.has(key)) {
          domainMap.set(key, {
            domain: req.domain,
            category: req.category || 'unknown',
            count: 0,
            types: new Set(),
            pages: new Set()
          });
        }
        const entry = domainMap.get(key);
        entry.count++;
        entry.types.add(req.type);
        entry.pages.add(page.pageDomain);
      }
    }

    // Menschliche Zusammenfassung erstellen
    if (summaryEl && typeof TrackerDB !== 'undefined') {
      if (allDomains.length === 0) {
        summaryEl.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-4">🔍</div>
            <p class="font-medium">Noch keine Daten gesammelt</p>
            <p class="text-sm mt-2">Besuche einige Websites und komme dann hierher zurück.</p>
            <p class="text-sm">Wir zeigen dir, wer im Hintergrund deine Daten sammelt.</p>
          </div>
        `;
      } else {
        const summary = TrackerDB.createHumanSummary(allDomains);

        // Bewertung basierend auf kritischen Trackern
        const riskAssessment = summary.stats.critical >= 5 ? {
          icon: '🚨',
          title: 'Hohes Tracking-Risiko',
          color: 'red',
          message: 'Diese Websites verfolgen dich aktiv. Deine Surfgewohnheiten werden von mehreren Werbenetzwerken erfasst.'
        } : summary.stats.critical >= 2 ? {
          icon: '⚠️',
          title: 'Mittleres Tracking-Risiko',
          color: 'yellow',
          message: 'Einige Tracker sind aktiv. Überlege, ob du Tracking-Cookies auf diesen Seiten ablehnst.'
        } : {
          icon: '✅',
          title: 'Geringes Tracking-Risiko',
          color: 'green',
          message: 'Die besuchten Websites verwenden wenige kritische Tracker. Gut gemacht!'
        };

        summaryEl.innerHTML = `
          <!-- Risiko-Bewertung -->
          <div class="mb-6 p-4 rounded-lg ${riskAssessment.color === 'red' ? 'bg-red-50 border border-red-200' : riskAssessment.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">${riskAssessment.icon}</span>
              <div>
                <h2 class="text-lg font-bold ${riskAssessment.color === 'red' ? 'text-red-800' : riskAssessment.color === 'yellow' ? 'text-yellow-800' : 'text-green-800'}">${riskAssessment.title}</h2>
                <p class="text-sm ${riskAssessment.color === 'red' ? 'text-red-700' : riskAssessment.color === 'yellow' ? 'text-yellow-700' : 'text-green-700'}">${riskAssessment.message}</p>
              </div>
            </div>
          </div>

          <div class="text-center mb-4">
            <p class="text-gray-600 text-sm">${summary.summary}</p>
          </div>

          <!-- Visuelle Stats - KLICKBAR mit Erklärung -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="text-center p-4 bg-gray-50 rounded-lg cursor-help" title="Alle externen Server, die kontaktiert wurden">
              <div class="text-3xl font-bold text-gray-900">${summary.stats.total}</div>
              <div class="text-sm text-gray-500">Externe Dienste</div>
              <div class="text-xs text-gray-400 mt-1">insgesamt erkannt</div>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg cursor-help border-2 border-transparent hover:border-red-300" title="Werbe-Tracker und Social Media - diese solltest du ablehnen!">
              <div class="text-3xl font-bold text-red-600">${summary.stats.critical}</div>
              <div class="text-sm text-red-600 font-medium">Kritische Tracker</div>
              <div class="text-xs text-red-500 mt-1">verfolgen dich!</div>
            </div>
            <div class="text-center p-4 bg-yellow-50 rounded-lg cursor-help" title="Analyse-Dienste - beobachten dein Verhalten auf der Seite">
              <div class="text-3xl font-bold text-yellow-600">${summary.stats.tracking}</div>
              <div class="text-sm text-yellow-600">Beobachtend</div>
              <div class="text-xs text-yellow-500 mt-1">messen dich</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg cursor-help" title="CDNs, Schriftarten, technische Dienste - harmlos">
              <div class="text-3xl font-bold text-green-600">${summary.stats.harmless}</div>
              <div class="text-sm text-green-600">Unbedenklich</div>
              <div class="text-xs text-green-500 mt-1">kein Problem</div>
            </div>
          </div>

          <!-- Was wurde gefunden? -->
          ${summary.details.length > 0 ? `
            <div class="mb-6">
              <h3 class="font-medium text-gray-800 mb-3">Was haben wir gefunden?</h3>
              <div class="space-y-3">
                ${summary.details.map(d => `
                  <div class="flex items-start gap-3 p-3 rounded-lg ${d.icon === '🔴' ? 'bg-red-50 border border-red-100' : d.icon === '🔵' ? 'bg-blue-50 border border-blue-100' : d.icon === '🟡' ? 'bg-yellow-50 border border-yellow-100' : 'bg-green-50 border border-green-100'}">
                    <span class="text-2xl">${d.icon}</span>
                    <div>
                      <div class="font-medium text-gray-900">${d.title}</div>
                      <div class="text-sm text-gray-600">${d.description}</div>
                      ${d.examples ? `<div class="text-xs text-gray-500 mt-1"><strong>Erkannt:</strong> ${d.examples}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Was kannst du tun? -->
          <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 class="font-medium text-blue-900 mb-2">💡 Was kannst du tun?</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• <strong>Cookie-Banner ablehnen</strong> - Nutze unseren "Cookie-Einstellungen öffnen"-Button im Popup</li>
              <li>• <strong>Tracking-Schutz aktivieren</strong> - Dein Browser hat oft einen eingebauten Schutz</li>
              <li>• <strong>Bewusster surfen</strong> - Websites mit vielen Trackern meiden</li>
            </ul>
          </div>
        `;
      }
    }

    // Detail-Liste aktualisieren
    updateNetworkDetailList(domainMap);
  }

  /**
   * Detail-Liste für Fortgeschrittene aktualisieren
   */
  function updateNetworkDetailList(domainMap) {
    if (!elements.requestList) return;

    const search = elements.searchRequests?.value?.toLowerCase() || '';
    const filterCategory = elements.filterCategory?.value || 'all';

    let domains = Array.from(domainMap.values());

    // Filter
    if (search) {
      domains = domains.filter(d => d.domain.toLowerCase().includes(search));
    }
    if (filterCategory !== 'all') {
      domains = domains.filter(d => d.category === filterCategory);
    }

    // Sortieren
    domains.sort((a, b) => b.count - a.count);

    // Anzahl
    if (elements.requestCount) {
      elements.requestCount.textContent = domains.length;
    }

    if (domains.length === 0) {
      elements.requestList.innerHTML = '<p class="text-gray-500 text-center py-4">Keine Daten</p>';
      return;
    }

    elements.requestList.innerHTML = domains.map(d => {
      const info = typeof TrackerDB !== 'undefined' ? TrackerDB.getTracker(d.domain) : null;
      const catInfo = typeof TrackerDB !== 'undefined' ? TrackerDB.getCategory(d.category) : { icon: '⚪', name: 'Unbekannt' };
      const hasDetails = info?.details || info?.description;

      return `
        <div class="tracker-item p-2 bg-white border border-gray-100 rounded ${hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''}" ${hasDetails ? 'data-expandable="true"' : ''}>
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-2">
              <span>${catInfo.icon}</span>
              <div>
                <div class="font-medium text-sm text-gray-900">${info?.name || d.domain}</div>
                <div class="text-xs text-gray-500">${d.domain}</div>
                ${info?.description ? `<div class="text-xs text-gray-600 mt-1">${info.description}</div>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">${d.count}x</span>
              ${hasDetails && info?.details ? '<span class="text-gray-400 expand-icon">▼</span>' : ''}
            </div>
          </div>
          ${info?.details ? `
            <div class="tracker-details hidden mt-2 pt-2 border-t border-gray-100">
              <p class="text-xs text-gray-700 leading-relaxed">${info.details}</p>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Event-Listener für erweiterbare Tracker-Details
    elements.requestList.querySelectorAll('.tracker-item[data-expandable]').forEach(item => {
      item.addEventListener('click', () => {
        const details = item.querySelector('.tracker-details');
        const icon = item.querySelector('.expand-icon');
        if (details) {
          details.classList.toggle('hidden');
          if (icon) {
            icon.textContent = details.classList.contains('hidden') ? '▼' : '▲';
          }
        }
      });
    });
  }

  /**
   * Dark Pattern Detail-Panel aktualisieren
   */
  function updateDarkPatternDetail() {
    if (!elements.patternTypeList || !elements.worstOffenders) return;

    // Alle Dark Patterns sammeln und zählen
    const patternCounts = {};
    const domainScores = {};

    for (const consent of allConsents) {
      // Patterns zählen
      if (consent.darkPatterns) {
        for (const pattern of consent.darkPatterns) {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        }
      }
      // Höchste Scores pro Domain
      if (consent.darkPatternScore > 0) {
        if (!domainScores[consent.domain] || domainScores[consent.domain].score < consent.darkPatternScore) {
          domainScores[consent.domain] = {
            score: consent.darkPatternScore,
            patterns: consent.darkPatterns || []
          };
        }
      }
    }

    // Pattern-Erklärungen
    const patternExplanations = {
      'visual_hierarchy': {
        name: 'Visuelle Hierarchie',
        icon: '👁️',
        desc: 'Der "Akzeptieren"-Button ist größer, bunter oder auffälliger als der "Ablehnen"-Button'
      },
      'preselected': {
        name: 'Vorausgewählte Optionen',
        icon: '☑️',
        desc: 'Tracking-Optionen sind bereits angehakt - du musst aktiv ablehnen'
      },
      'hidden_decline': {
        name: 'Versteckter Ablehnen-Button',
        icon: '🙈',
        desc: 'Der Ablehnen-Button ist schwer zu finden oder als Link statt Button gestaltet'
      },
      'confirm_shaming': {
        name: 'Beschämende Formulierungen',
        icon: '😔',
        desc: 'Texte wie "Nein, ich will keine tollen Angebote" sollen dich beschämen'
      },
      'false_urgency': {
        name: 'Falscher Zeitdruck',
        icon: '⏰',
        desc: 'Künstlicher Zeitdruck wie "Nur noch heute!" oder Countdown-Timer'
      },
      'complex_language': {
        name: 'Komplizierte Sprache',
        icon: '📚',
        desc: 'Absichtlich verwirrender Juristenjargon statt einfacher Erklärungen'
      },
      'many_clicks': {
        name: 'Viele Klicks nötig',
        icon: '🖱️',
        desc: 'Ablehnen erfordert viele Klicks, Akzeptieren nur einen'
      },
      'dark_colors': {
        name: 'Manipulative Farben',
        icon: '🎨',
        desc: 'Ablehnen in grau/blass, Akzeptieren in leuchtenden Farben'
      },
      'nagging': {
        name: 'Wiederholtes Nerven',
        icon: '🔔',
        desc: 'Das Banner erscheint immer wieder, obwohl du schon entschieden hast'
      },
      'obstruction': {
        name: 'Behinderung der Nutzung',
        icon: '🚧',
        desc: 'Die Seite ist ohne Zustimmung kaum nutzbar'
      }
    };

    // Pattern-Liste rendern
    const sortedPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);

    if (sortedPatterns.length === 0) {
      elements.patternTypeList.innerHTML = '<p class="text-gray-500 text-sm">Noch keine Manipulationstricks erkannt - sehr gut!</p>';
    } else {
      elements.patternTypeList.innerHTML = sortedPatterns.map(([pattern, count]) => {
        const info = patternExplanations[pattern] || { name: pattern, icon: '⚠️', desc: 'Manipulationstechnik' };
        return `
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-xl">${info.icon}</span>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <div class="font-medium text-gray-900">${info.name}</div>
                <span class="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">${count}x erkannt</span>
              </div>
              <div class="text-sm text-gray-600 mt-1">${info.desc}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Schlimmste Websites rendern
    const sortedDomains = Object.entries(domainScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5);

    if (sortedDomains.length === 0) {
      elements.worstOffenders.innerHTML = '<p class="text-gray-500 text-sm">Noch keine Daten vorhanden.</p>';
    } else {
      elements.worstOffenders.innerHTML = sortedDomains.map(([domain, data]) => {
        const scoreClass = data.score >= 50 ? 'text-red-600 bg-red-100' :
                          data.score >= 25 ? 'text-yellow-600 bg-yellow-100' :
                          'text-green-600 bg-green-100';
        return `
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div class="font-medium text-gray-900">${domain}</div>
              <div class="text-xs text-gray-500">${data.patterns.length} Tricks erkannt</div>
            </div>
            <span class="text-sm font-bold ${scoreClass} px-2 py-1 rounded">Score: ${data.score}</span>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Domains Detail-Panel aktualisieren
   */
  function updateDomainsDetail() {
    if (!elements.domainsList) return;

    const search = elements.searchDomains?.value?.toLowerCase() || '';

    // Domains mit ihren Daten sammeln
    const domainData = {};
    for (const consent of allConsents) {
      if (!domainData[consent.domain]) {
        domainData[consent.domain] = {
          domain: consent.domain,
          visits: 0,
          lastVisit: 0,
          score: 0,
          patterns: [],
          decisions: []
        };
      }
      const d = domainData[consent.domain];
      d.visits++;
      if (consent.timestamp > d.lastVisit) {
        d.lastVisit = consent.timestamp;
      }
      if (consent.darkPatternScore > d.score) {
        d.score = consent.darkPatternScore;
        d.patterns = consent.darkPatterns || [];
      }
      if (consent.consentType !== 'detected') {
        d.decisions.push(consent.consentType);
      }
    }

    let domains = Object.values(domainData);

    // Filtern
    if (search) {
      domains = domains.filter(d => d.domain.toLowerCase().includes(search));
    }

    // Sortieren (neueste zuerst)
    domains.sort((a, b) => b.lastVisit - a.lastVisit);

    if (domains.length === 0) {
      elements.domainsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Keine Websites gefunden.</p>';
      return;
    }

    elements.domainsList.innerHTML = domains.map(d => {
      const scoreClass = d.score >= 50 ? 'text-red-600' :
                        d.score >= 25 ? 'text-yellow-600' :
                        'text-green-600';
      const scoreIcon = d.score >= 50 ? '🔴' : d.score >= 25 ? '🟡' : '🟢';
      const lastDecision = d.decisions[d.decisions.length - 1];

      return `
        <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-3">
            <span class="text-lg">${scoreIcon}</span>
            <div>
              <div class="font-medium text-gray-900">${d.domain}</div>
              <div class="text-xs text-gray-500">
                ${d.visits}x besucht
                ${lastDecision ? ` · Zuletzt: ${getConsentTypeLabel(lastDecision)}` : ''}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium ${scoreClass}">Score: ${d.score}</div>
            ${d.patterns.length > 0 ? `<div class="text-xs text-gray-400">${d.patterns.length} Tricks</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Network Sub-Tab wechseln
   */
  function switchNetworkSubtab(subtab) {
    // Buttons aktualisieren
    document.querySelectorAll('.network-subtab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subtab);
      btn.classList.toggle('bg-blue-100', btn.dataset.subtab === subtab);
      btn.classList.toggle('text-blue-700', btn.dataset.subtab === subtab);
      btn.classList.toggle('text-gray-600', btn.dataset.subtab !== subtab);
    });

    // Content aktualisieren
    document.querySelectorAll('.network-subtab-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(`subtab-${subtab}`)?.classList.remove('hidden');

    // Detail-View verstecken
    document.getElementById('pageDetailView')?.classList.add('hidden');

    // Daten laden
    if (subtab === 'pages') {
      updatePagesList();
    }
  }

  /**
   * Liste der besuchten Seiten aktualisieren
   */
  function updatePagesList() {
    const listEl = document.getElementById('pagesList');
    const countEl = document.getElementById('pagesCount');
    const searchEl = document.getElementById('searchPages');
    const search = searchEl?.value?.toLowerCase() || '';

    if (!listEl) return;

    // Keine Daten
    if (!allRequests || allRequests.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-4">📄</div>
          <p class="font-medium">Noch keine Seiten erfasst</p>
          <p class="text-sm mt-2">Besuche einige Websites - wir zeigen dir dann, was im Hintergrund passiert.</p>
        </div>
      `;
      if (countEl) countEl.textContent = '0 Seiten erfasst';
      return;
    }

    // Seiten filtern und sortieren (neueste zuerst)
    let pages = [...allRequests].sort((a, b) => b.timestamp - a.timestamp);

    if (search) {
      pages = pages.filter(p =>
        p.pageUrl?.toLowerCase().includes(search) ||
        p.pageDomain?.toLowerCase().includes(search)
      );
    }

    if (countEl) countEl.textContent = `${pages.length} Seiten erfasst`;

    if (pages.length === 0) {
      listEl.innerHTML = `<p class="text-center text-gray-500 py-4">Keine Seiten gefunden.</p>`;
      return;
    }

    // Seiten rendern (async wegen Links)
    renderPagesListAsync(pages, listEl);
  }

  /**
   * Rendert die Seitenliste asynchron (um Links zu laden)
   */
  async function renderPagesListAsync(pages, listEl) {
    // Speichere für spätere Verwendung in showPageDetail
    displayedPages = pages;

    // Erst ohne Links rendern (schnell)
    listEl.innerHTML = pages.map((page, index) => {
      const requestCount = page.requests?.length || 0;
      const analysis = analyzePageRequests(page.requests || []);
      const scoreColor = analysis.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        analysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700';
      const riskIcon = analysis.riskLevel === 'high' ? '🔴' :
                       analysis.riskLevel === 'medium' ? '🟡' : '🟢';
      const dateStr = new Date(page.timestamp).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
             data-page-index="${index}" data-domain="${page.pageDomain}">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg">${riskIcon}</span>
                <span class="font-medium text-gray-900 truncate">${page.pageDomain || 'Unbekannt'}</span>
              </div>
              <div class="text-xs text-gray-500 truncate mb-2" title="${page.pageUrl}">${page.pageUrl || '-'}</div>
              <div class="flex items-center gap-3 text-xs">
                <span class="${scoreColor} px-2 py-0.5 rounded font-medium">${analysis.riskLabel}</span>
                <span class="text-gray-500">${requestCount} externe Anfragen</span>
                ${analysis.criticalCount > 0 ? `<span class="text-red-600 font-medium">${analysis.criticalCount} kritisch</span>` : ''}
              </div>
              <!-- Platzhalter für Links -->
              <div class="page-links-row flex items-center gap-2 mt-2 hidden" data-page-domain="${page.pageDomain}"></div>
            </div>
            <div class="text-right ml-4 flex items-center">
              <div class="text-xs text-gray-400">${dateStr}</div>
              <svg class="w-4 h-4 text-gray-300 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Dann Links asynchron nachladen
    const uniqueDomains = [...new Set(pages.map(p => p.pageDomain).filter(Boolean))];
    for (const domain of uniqueDomains) {
      try {
        const pageLinks = await BrowserAPI.runtime.sendMessage({
          type: 'GET_PAGE_LINKS',
          domain: domain
        });

        if (pageLinks) {
          const linkRows = document.querySelectorAll(`.page-links-row[data-page-domain="${domain}"]`);
          linkRows.forEach(row => {
            let linksHtml = '';

            if (pageLinks.gdprLinks?.length > 0) {
              const gdprLink = pageLinks.gdprLinks.find(l => l.href);
              if (gdprLink?.href) {
                linksHtml += `<a href="${gdprLink.href}" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded">⚙️ Cookies</a>`;
              }
            }

            if (pageLinks.privacyLinks?.length > 0 && pageLinks.privacyLinks[0]?.href) {
              linksHtml += `<a href="${pageLinks.privacyLinks[0].href}" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-50 px-2 py-0.5 rounded">🔒 Datenschutz</a>`;
            }

            if (pageLinks.cmp?.found && pageLinks.cmp.name) {
              linksHtml += `<span class="text-xs text-gray-400">${pageLinks.cmp.name}</span>`;
            }

            if (linksHtml) {
              row.innerHTML = linksHtml;
              row.classList.remove('hidden');
            }
          });
        }
      } catch (e) {
        // Ignorieren
      }
    }
  }

  /**
   * Analysiert die Requests einer Seite
   */
  function analyzePageRequests(requests) {
    let criticalCount = 0;
    let trackingCount = 0;
    let harmlessCount = 0;

    for (const req of requests) {
      const category = req.category || 'unknown';
      if (category === 'advertising' || category === 'social') {
        criticalCount++;
      } else if (category === 'analytics') {
        trackingCount++;
      } else if (category === 'cdn' || category === 'functional') {
        harmlessCount++;
      }
    }

    const total = requests.length;
    const criticalRatio = total > 0 ? criticalCount / total : 0;

    let riskLevel, riskLabel;
    if (criticalCount >= 3 || criticalRatio > 0.3) {
      riskLevel = 'high';
      riskLabel = 'Hohes Risiko';
    } else if (criticalCount >= 1 || trackingCount >= 2) {
      riskLevel = 'medium';
      riskLabel = 'Mittleres Risiko';
    } else {
      riskLevel = 'low';
      riskLabel = 'Geringes Risiko';
    }

    return { criticalCount, trackingCount, harmlessCount, riskLevel, riskLabel };
  }

  /**
   * Zeigt Detail-Ansicht für eine Seite
   */
  function showPageDetail(pageIndex) {
    const page = displayedPages[pageIndex];
    if (!page) {
      console.error('Page not found at index', pageIndex);
      return;
    }

    // Verstecke Liste, zeige Detail
    document.getElementById('subtab-pages')?.classList.add('hidden');
    document.getElementById('subtab-summary')?.classList.add('hidden');
    const detailView = document.getElementById('pageDetailView');
    detailView?.classList.remove('hidden');

    // Header
    document.getElementById('pageDetailUrl').textContent = page.pageDomain || 'Unbekannte Seite';
    document.getElementById('pageDetailTime').textContent = new Date(page.timestamp).toLocaleString('de-DE');

    const requests = page.requests || [];
    const analysis = analyzePageRequests(requests);

    // Score Badge
    const scoreEl = document.getElementById('pageDetailScore');
    scoreEl.textContent = analysis.riskLabel;
    scoreEl.className = `text-sm font-medium px-2 py-1 rounded ${
      analysis.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
      analysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
      'bg-green-100 text-green-700'
    }`;

    document.getElementById('pageDetailTrackerCount').textContent = `${requests.length} externe Dienste kontaktiert`;

    // Risiko-Einschätzung
    const riskEl = document.getElementById('pageDetailRisk');
    if (analysis.riskLevel === 'high') {
      riskEl.className = 'p-4 rounded-lg mb-4 bg-red-50 border border-red-200';
      riskEl.innerHTML = `
        <div class="flex gap-3">
          <span class="text-2xl">🚨</span>
          <div>
            <div class="font-bold text-red-800">Diese Seite trackt dich intensiv!</div>
            <div class="text-sm text-red-700 mt-1">
              ${analysis.criticalCount} Werbe-/Social-Tracker wurden erkannt. Diese erstellen ein Profil über dich
              und verfolgen dich quer durchs Internet. <strong>Du solltest hier "Alle ablehnen" klicken.</strong>
            </div>
          </div>
        </div>
      `;
    } else if (analysis.riskLevel === 'medium') {
      riskEl.className = 'p-4 rounded-lg mb-4 bg-yellow-50 border border-yellow-200';
      riskEl.innerHTML = `
        <div class="flex gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <div class="font-bold text-yellow-800">Diese Seite beobachtet dein Verhalten</div>
            <div class="text-sm text-yellow-700 mt-1">
              Es wurden Analyse-Dienste gefunden, die messen wie du die Seite nutzt.
              Das ist weniger kritisch als Werbe-Tracker, aber du wirst dennoch beobachtet.
            </div>
          </div>
        </div>
      `;
    } else {
      riskEl.className = 'p-4 rounded-lg mb-4 bg-green-50 border border-green-200';
      riskEl.innerHTML = `
        <div class="flex gap-3">
          <span class="text-2xl">✅</span>
          <div>
            <div class="font-bold text-green-800">Diese Seite respektiert deine Privatsphäre</div>
            <div class="text-sm text-green-700 mt-1">
              Keine kritischen Tracker gefunden. Die externen Dienste sind hauptsächlich
              technisch notwendig (z.B. Schriftarten, CDNs).
            </div>
          </div>
        </div>
      `;
    }

    // Tracker-Liste gruppiert nach Kategorie
    const trackersByCategory = {
      advertising: { icon: '🔴', name: 'Werbe-Tracker', desc: 'Verfolgen dich für personalisierte Werbung', items: [] },
      social: { icon: '🔵', name: 'Social Media', desc: 'Soziale Netzwerke erfahren von deinem Besuch', items: [] },
      analytics: { icon: '🟡', name: 'Analyse-Dienste', desc: 'Messen dein Verhalten auf dieser Seite', items: [] },
      cdn: { icon: '🟢', name: 'Content Delivery', desc: 'Laden Bilder, Scripts, Schriftarten', items: [] },
      functional: { icon: '🟢', name: 'Funktional', desc: 'Notwendig für Website-Funktionen', items: [] },
      unknown: { icon: '⚪', name: 'Unbekannt', desc: 'Kategorie nicht ermittelbar', items: [] }
    };

    for (const req of requests) {
      const cat = req.category || 'unknown';
      if (trackersByCategory[cat]) {
        trackersByCategory[cat].items.push(req);
      } else {
        trackersByCategory.unknown.items.push(req);
      }
    }

    const trackersEl = document.getElementById('pageDetailTrackers');
    trackersEl.innerHTML = Object.entries(trackersByCategory)
      .filter(([_, data]) => data.items.length > 0)
      .map(([cat, data]) => {
        const isCritical = cat === 'advertising' || cat === 'social';
        return `
          <div class="border ${isCritical ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">${data.icon}</span>
                <span class="font-medium ${isCritical ? 'text-red-800' : 'text-gray-800'}">${data.name}</span>
                <span class="text-xs ${isCritical ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-600'} px-2 py-0.5 rounded">${data.items.length}x</span>
              </div>
            </div>
            <div class="text-xs ${isCritical ? 'text-red-600' : 'text-gray-500'} mb-2">${data.desc}</div>
            <div class="space-y-1">
              ${data.items.map(item => {
                const info = typeof TrackerDB !== 'undefined' ? TrackerDB.getTracker(item.domain) : null;
                const hasDetails = info?.details;
                return `
                  <div class="tracker-detail-item py-1 border-t ${isCritical ? 'border-red-100' : 'border-gray-100'} ${hasDetails ? 'cursor-pointer' : ''}" ${hasDetails ? 'data-has-details="true"' : ''}>
                    <div class="flex items-center justify-between text-sm">
                      <div>
                        <span class="${isCritical ? 'text-red-700' : 'text-gray-700'}">${info?.name || item.domain}</span>
                        ${info?.name ? `<span class="text-xs text-gray-400 ml-1">(${item.domain})</span>` : ''}
                      </div>
                      <div class="flex items-center gap-1">
                        <span class="text-xs text-gray-400">${item.type || 'request'}</span>
                        ${hasDetails ? '<span class="detail-expand-icon text-gray-400 text-xs">▼</span>' : ''}
                      </div>
                    </div>
                    ${info?.description ? `<div class="text-xs ${isCritical ? 'text-red-600' : 'text-gray-500'} mt-1">${info.description}</div>` : ''}
                    ${hasDetails ? `<div class="tracker-detail-text hidden mt-2 text-xs ${isCritical ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100'} p-2 rounded">${info.details}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');

    // Empfehlung
    const adviceEl = document.getElementById('pageDetailAdvice');
    if (analysis.riskLevel === 'high') {
      adviceEl.innerHTML = `
        <strong>💡 Empfehlung:</strong> Öffne die Cookie-Einstellungen und lehne alle nicht-notwendigen Cookies ab.
        Du kannst auch einen Browser mit eingebautem Tracking-Schutz verwenden (Firefox, Brave).
      `;
    } else if (analysis.riskLevel === 'medium') {
      adviceEl.innerHTML = `
        <strong>💡 Empfehlung:</strong> Die Seite ist akzeptabel, aber du kannst Analyse-Cookies ablehnen
        wenn du nicht möchtest, dass dein Verhalten gemessen wird.
      `;
    } else {
      adviceEl.innerHTML = `
        <strong>💡 Gut:</strong> Diese Seite verwendet kaum Tracking. Du kannst sie bedenkenlos nutzen.
      `;
    }

    // Links laden und anzeigen
    loadPageLinks(page.pageDomain);

    // Event-Listener für erweiterbare Tracker-Details in der Seitenansicht
    trackersEl.querySelectorAll('.tracker-detail-item[data-has-details]').forEach(item => {
      item.addEventListener('click', () => {
        const detailText = item.querySelector('.tracker-detail-text');
        const icon = item.querySelector('.detail-expand-icon');
        if (detailText) {
          detailText.classList.toggle('hidden');
          if (icon) {
            icon.textContent = detailText.classList.contains('hidden') ? '▼' : '▲';
          }
        }
      });
    });
  }

  /**
   * Lädt und zeigt GDPR/Privacy Links für eine Domain
   */
  async function loadPageLinks(domain) {
    const linksContainer = document.getElementById('pageDetailLinks');
    const gdprLink = document.getElementById('pageDetailGdprLink');
    const privacyLink = document.getElementById('pageDetailPrivacyLink');
    const cmpInfo = document.getElementById('pageDetailCmpInfo');

    if (!linksContainer) return;

    // Alle verstecken zunächst
    linksContainer.classList.add('hidden');
    gdprLink?.classList.add('hidden');
    privacyLink?.classList.add('hidden');
    cmpInfo?.classList.add('hidden');

    try {
      const pageLinks = await BrowserAPI.runtime.sendMessage({
        type: 'GET_PAGE_LINKS',
        domain: domain
      });

      if (!pageLinks) return;

      let hasAnyLink = false;

      // GDPR/Cookie-Einstellungen Link
      if (pageLinks.gdprLinks && pageLinks.gdprLinks.length > 0) {
        const firstGdpr = pageLinks.gdprLinks.find(l => l.href) || pageLinks.gdprLinks[0];
        if (firstGdpr?.href) {
          gdprLink.href = firstGdpr.href;
          gdprLink.classList.remove('hidden');
          hasAnyLink = true;
        }
      }

      // Privacy/Datenschutz Link
      if (pageLinks.privacyLinks && pageLinks.privacyLinks.length > 0) {
        const firstPrivacy = pageLinks.privacyLinks[0];
        if (firstPrivacy?.href) {
          privacyLink.href = firstPrivacy.href;
          privacyLink.classList.remove('hidden');
          hasAnyLink = true;
        }
      }

      // CMP Info
      if (pageLinks.cmp && pageLinks.cmp.found) {
        cmpInfo.textContent = `Cookie-Management: ${pageLinks.cmp.name || 'Erkannt'}`;
        cmpInfo.classList.remove('hidden');
        hasAnyLink = true;
      }

      if (hasAnyLink) {
        linksContainer.classList.remove('hidden');
      }
    } catch (e) {
      console.error('Fehler beim Laden der Page Links:', e);
    }
  }

  /**
   * Request-Daten löschen
   */
  async function clearRequests() {
    if (!confirm('Alle Request-Daten löschen?')) return;

    await BrowserAPI.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });

    allRequests = [];
    updateNetwork();
    updatePagesList();
  }

  /**
   * Einstellungen aktualisieren
   */
  function updateSettings() {
    elements.settingAutoAnalyze.checked = settings.autoAnalyze !== false;
    elements.settingWarnings.checked = settings.darkPatternWarnings !== false;
    elements.settingNotifications.checked = settings.notifications !== false;

    if (elements.settingTrackRequests) {
      elements.settingTrackRequests.checked = settings.trackRequests !== false;
    }
    if (elements.settingProMode) {
      elements.settingProMode.checked = settings.proMode !== false;
    }

    // Request-View basierend auf Pro-Status
    if (elements.requestView) {
      elements.requestView.disabled = !settings.proMode;
      if (!settings.proMode) {
        elements.requestView.value = 'grouped';
      }
    }
  }

  /**
   * Einstellungen speichern
   */
  async function saveSettings() {
    settings = {
      autoAnalyze: elements.settingAutoAnalyze.checked,
      darkPatternWarnings: elements.settingWarnings.checked,
      notifications: elements.settingNotifications.checked,
      trackRequests: elements.settingTrackRequests?.checked ?? true,
      proMode: elements.settingProMode?.checked ?? true
    };

    await BrowserAPI.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings
    });

    // UI aktualisieren wenn Pro-Status geändert
    updateSettings();
    updateNetwork();
  }

  /**
   * Daten exportieren
   */
  async function exportData() {
    const data = await BrowserAPI.runtime.sendMessage({ type: 'EXPORT_DATA' });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-guardian-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Daten importieren
   */
  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        await BrowserAPI.runtime.sendMessage({
          type: 'IMPORT_DATA',
          data
        });

        await loadData();
        updateOverview();
        updateHistory();

        alert('Daten erfolgreich importiert!');
      } catch (error) {
        alert('Fehler beim Import: ' + error.message);
      }
    };

    input.click();
  }

  /**
   * Alle Daten löschen
   */
  async function clearData() {
    if (!confirm('Wirklich ALLE Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    await BrowserAPI.storage.set({
      consent_history: [],
      statistics: {
        totalConsents: 0,
        acceptAll: 0,
        rejectAll: 0,
        custom: 0,
        darkPatternsDetected: 0,
        domainsVisited: []
      }
    });

    await loadData();
    updateOverview();
    updateHistory();

    alert('Alle Daten wurden gelöscht.');
  }

  /**
   * Einzelnen Consent löschen
   */
  window.deleteConsent = async function(id) {
    if (!confirm('Diesen Eintrag löschen?')) return;

    await BrowserAPI.runtime.sendMessage({
      type: 'DELETE_CONSENT',
      id
    });

    await loadData();
    updateOverview();
    updateHistory();
  };

  // Hilfsfunktionen
  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getConsentTypeLabel(type) {
    const labels = {
      accept_all: 'Alles akzeptiert',
      reject_all: 'Alles abgelehnt',
      custom: 'Teilweise erlaubt',
      detected: 'Banner gefunden'
    };
    return labels[type] || 'Unbekannt';
  }

  function getConsentBadgeClass(type) {
    const classes = {
      accept_all: 'consent-accept-all',
      reject_all: 'consent-reject-all',
      custom: 'consent-custom',
      detected: 'bg-blue-100 text-blue-800'
    };
    return classes[type] || '';
  }

  function getScoreColor(score) {
    if (score >= 50) return 'text-red-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  }

  // CSS für Tabs hinzufügen
  const style = document.createElement('style');
  style.textContent = `
    .tab-btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #374151;
      background: #f3f4f6;
    }
    .tab-btn.active {
      color: #2563eb;
      background: #eff6ff;
    }
    .network-subtab {
      color: #6b7280;
      background: #f3f4f6;
      transition: all 0.2s;
    }
    .network-subtab:hover {
      background: #e5e7eb;
    }
    .network-subtab.active {
      color: #1d4ed8;
      background: #dbeafe;
    }
  `;
  document.head.appendChild(style);

  // Starten
  init();
})();
