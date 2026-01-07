/**
 * Consent Guardian - Internationalization (i18n) Helper
 *
 * Provides easy access to translated strings based on browser language.
 * Uses Chrome's i18n API with fallback support.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const I18n = (function() {
  'use strict';

  /**
   * Gets a translated message by key
   * @param {string} key - Message key from messages.json
   * @param {string|Array} substitutions - Optional substitutions for placeholders
   * @returns {string} - Translated message or key if not found
   */
  function getMessage(key, substitutions) {
    try {
      // Chrome/Firefox/Safari extension API
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
        const message = chrome.i18n.getMessage(key, substitutions);
        return message || key;
      }

      // Fallback for browser API
      if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
        const message = browser.i18n.getMessage(key, substitutions);
        return message || key;
      }

      // Return key as fallback
      return key;
    } catch (e) {
      console.warn('[I18n] Error getting message:', key, e);
      return key;
    }
  }

  /**
   * Gets the current UI language
   * @returns {string} - Language code (e.g., 'de', 'en')
   */
  function getLanguage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
        return chrome.i18n.getUILanguage().split('-')[0];
      }
      if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getUILanguage) {
        return browser.i18n.getUILanguage().split('-')[0];
      }
      // Fallback to navigator language
      return navigator.language.split('-')[0];
    } catch (e) {
      return 'de'; // Default to German
    }
  }

  /**
   * Checks if current language is German
   * @returns {boolean}
   */
  function isGerman() {
    return getLanguage() === 'de';
  }

  /**
   * Checks if current language is English
   * @returns {boolean}
   */
  function isEnglish() {
    return getLanguage() === 'en';
  }

  /**
   * Translates all elements with data-i18n attribute
   * Call this after DOM is ready
   */
  function translatePage() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const message = getMessage(key);
      if (message && message !== key) {
        el.textContent = message;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const message = getMessage(key);
      if (message && message !== key) {
        el.placeholder = message;
      }
    });

    // Translate titles/tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const message = getMessage(key);
      if (message && message !== key) {
        el.title = message;
      }
    });

    // Set html lang attribute
    document.documentElement.lang = getLanguage();
  }

  /**
   * Shorthand function for getMessage
   * @param {string} key - Message key
   * @param {string|Array} substitutions - Optional substitutions
   * @returns {string} - Translated message
   */
  function __(key, substitutions) {
    return getMessage(key, substitutions);
  }

  // Auto-translate on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', translatePage);
    } else {
      // DOM already loaded
      setTimeout(translatePage, 0);
    }
  }

  return {
    getMessage,
    getLanguage,
    isGerman,
    isEnglish,
    translatePage,
    __
  };
})();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
} else if (typeof window !== 'undefined') {
  window.I18n = I18n;
  window.__ = I18n.__;
}
