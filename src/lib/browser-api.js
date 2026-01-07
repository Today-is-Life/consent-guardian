/**
 * Consent Guardian - Browser API Abstraction Layer
 *
 * Unified API für Chrome, Firefox und Safari.
 * Alle Browser-spezifischen Unterschiede werden hier abstrahiert.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const BrowserAPI = (function() {
  'use strict';

  // Detect browser
  const isFirefox = typeof browser !== 'undefined';
  const api = isFirefox ? browser : chrome;

  return {
    /**
     * Browser-Name für Debugging
     */
    browserName: isFirefox ? 'firefox' : (
      navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
        ? 'safari'
        : 'chrome'
    ),

    /**
     * Storage API
     */
    storage: {
      /**
       * Daten aus dem lokalen Storage lesen
       * @param {string|string[]|null} keys - Keys oder null für alle
       * @returns {Promise<Object>}
       */
      async get(keys) {
        return new Promise((resolve, reject) => {
          api.storage.local.get(keys, (result) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      },

      /**
       * Daten in den lokalen Storage schreiben
       * @param {Object} items - Key-Value Paare
       * @returns {Promise<void>}
       */
      async set(items) {
        return new Promise((resolve, reject) => {
          api.storage.local.set(items, () => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      },

      /**
       * Daten aus dem Storage löschen
       * @param {string|string[]} keys
       * @returns {Promise<void>}
       */
      async remove(keys) {
        return new Promise((resolve, reject) => {
          api.storage.local.remove(keys, () => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      },

      /**
       * Storage-Änderungen beobachten
       * @param {Function} callback
       */
      onChanged: {
        addListener(callback) {
          api.storage.onChanged.addListener(callback);
        },
        removeListener(callback) {
          api.storage.onChanged.removeListener(callback);
        }
      }
    },

    /**
     * Runtime API
     */
    runtime: {
      /**
       * Nachricht an Background Script senden
       * @param {Object} message
       * @returns {Promise<any>}
       */
      sendMessage(message) {
        return new Promise((resolve, reject) => {
          api.runtime.sendMessage(message, (response) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      },

      /**
       * Nachrichten-Listener
       */
      onMessage: {
        addListener(callback) {
          api.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const result = callback(message, sender);
            if (result instanceof Promise) {
              result.then(sendResponse).catch(err => {
                console.error('Message handler error:', err);
                sendResponse({ error: err.message });
              });
              return true; // Async response
            }
            if (result !== undefined) {
              sendResponse(result);
            }
            return false;
          });
        }
      },

      /**
       * Extension-ID
       */
      get id() {
        return api.runtime.id;
      },

      /**
       * URL zu Extension-Ressource
       * @param {string} path
       * @returns {string}
       */
      getURL(path) {
        return api.runtime.getURL(path);
      }
    },

    /**
     * Tabs API
     */
    tabs: {
      /**
       * Tabs abfragen
       * @param {Object} queryInfo
       * @returns {Promise<Tab[]>}
       */
      async query(queryInfo) {
        return new Promise((resolve, reject) => {
          api.tabs.query(queryInfo, (tabs) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(tabs);
            }
          });
        });
      },

      /**
       * Neuen Tab erstellen
       * @param {Object} createProperties
       * @returns {Promise<Tab>}
       */
      async create(createProperties) {
        return new Promise((resolve, reject) => {
          api.tabs.create(createProperties, (tab) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(tab);
            }
          });
        });
      },

      /**
       * Tab aktualisieren
       * @param {number} tabId
       * @param {Object} updateProperties
       * @returns {Promise<Tab>}
       */
      async update(tabId, updateProperties) {
        return new Promise((resolve, reject) => {
          api.tabs.update(tabId, updateProperties, (tab) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(tab);
            }
          });
        });
      },

      /**
       * Nachricht an Tab senden
       * @param {number} tabId
       * @param {Object} message
       * @returns {Promise<any>}
       */
      async sendMessage(tabId, message) {
        return new Promise((resolve, reject) => {
          api.tabs.sendMessage(tabId, message, (response) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      }
    },

    /**
     * Action API (Browser Action / Page Action)
     */
    action: {
      /**
       * Badge-Text setzen
       * @param {Object} details - { tabId?, text }
       * @returns {Promise<void>}
       */
      async setBadgeText(details) {
        const action = api.action || api.browserAction;
        return new Promise((resolve) => {
          action.setBadgeText(details, resolve);
        });
      },

      /**
       * Badge-Hintergrundfarbe setzen
       * @param {Object} details - { tabId?, color }
       * @returns {Promise<void>}
       */
      async setBadgeBackgroundColor(details) {
        const action = api.action || api.browserAction;
        return new Promise((resolve) => {
          action.setBadgeBackgroundColor(details, resolve);
        });
      },

      /**
       * Icon setzen
       * @param {Object} details - { tabId?, path }
       * @returns {Promise<void>}
       */
      async setIcon(details) {
        const action = api.action || api.browserAction;
        return new Promise((resolve) => {
          action.setIcon(details, resolve);
        });
      },

      /**
       * Titel setzen (Tooltip)
       * @param {Object} details - { tabId?, title }
       * @returns {Promise<void>}
       */
      async setTitle(details) {
        const action = api.action || api.browserAction;
        return new Promise((resolve) => {
          action.setTitle(details, resolve);
        });
      }
    },

    /**
     * Cookies API
     */
    cookies: {
      /**
       * Cookies abrufen
       * @param {Object} details - { url, name?, domain?, ... }
       * @returns {Promise<Cookie[]>}
       */
      async getAll(details) {
        return new Promise((resolve, reject) => {
          if (!api.cookies) {
            resolve([]);
            return;
          }
          api.cookies.getAll(details, (cookies) => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve(cookies || []);
            }
          });
        });
      },

      /**
       * Cookie löschen
       * @param {Object} details - { url, name }
       * @returns {Promise<void>}
       */
      async remove(details) {
        return new Promise((resolve, reject) => {
          if (!api.cookies) {
            resolve();
            return;
          }
          api.cookies.remove(details, () => {
            if (api.runtime.lastError) {
              reject(new Error(api.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      }
    },

    /**
     * Alarms API (für periodische Tasks)
     */
    alarms: {
      /**
       * Alarm erstellen
       * @param {string} name
       * @param {Object} alarmInfo - { when?, delayInMinutes?, periodInMinutes? }
       */
      create(name, alarmInfo) {
        if (api.alarms) {
          api.alarms.create(name, alarmInfo);
        }
      },

      /**
       * Alarm-Listener
       */
      onAlarm: {
        addListener(callback) {
          if (api.alarms) {
            api.alarms.onAlarm.addListener(callback);
          }
        }
      }
    }
  };
})();

// Export für ES Modules oder global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserAPI;
} else if (typeof window !== 'undefined') {
  window.BrowserAPI = BrowserAPI;
}
