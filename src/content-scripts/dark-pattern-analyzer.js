/**
 * Consent Guardian - Dark Pattern Analyzer
 *
 * Erkennt und bewertet Dark Patterns in Cookie-Bannern.
 * Basierend auf wissenschaftlicher Forschung zu Consent Dark Patterns.
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const DarkPatternAnalyzer = (function() {
  'use strict';

  /**
   * Dark Pattern Definitionen mit Gewichtung
   */
  const DARK_PATTERNS = {
    // Schwerwiegend (Gewichtung: 3)
    noRejectButton: {
      weight: 3,
      name: 'Kein Ablehnen-Button',
      description: 'Es gibt keinen direkten Button zum Ablehnen aller Cookies.',
      category: 'obstruction'
    },

    hiddenReject: {
      weight: 3,
      name: 'Versteckter Ablehnen-Button',
      description: 'Der Ablehnen-Button ist versteckt oder schwer zu finden.',
      category: 'obstruction'
    },

    preselectedOptions: {
      weight: 3,
      name: 'Vorausgewählte Optionen',
      description: 'Tracking-Optionen sind standardmäßig aktiviert.',
      category: 'default'
    },

    // Mittel (Gewichtung: 2)
    asymmetricButtons: {
      weight: 2,
      name: 'Asymmetrische Buttons',
      description: 'Der Akzeptieren-Button ist visuell prominenter als der Ablehnen-Button.',
      category: 'interface'
    },

    colorManipulation: {
      weight: 2,
      name: 'Farbmanipulation',
      description: 'Farben werden genutzt um den Akzeptieren-Button attraktiver zu machen.',
      category: 'interface'
    },

    confirmShaming: {
      weight: 2,
      name: 'Confirm Shaming',
      description: 'Der Ablehnen-Text ist manipulativ formuliert.',
      category: 'language'
    },

    forcedAction: {
      weight: 2,
      name: 'Erzwungene Aktion',
      description: 'Die Seite ist nicht nutzbar ohne Consent-Entscheidung.',
      category: 'obstruction'
    },

    // Leicht (Gewichtung: 1)
    tooManyOptions: {
      weight: 1,
      name: 'Zu viele Optionen',
      description: 'Überwältigende Anzahl an Einstellungsmöglichkeiten.',
      category: 'complexity'
    },

    misleadingLanguage: {
      weight: 1,
      name: 'Irreführende Sprache',
      description: 'Verwendung von verwirrenden oder technischen Begriffen.',
      category: 'language'
    },

    noGranularControl: {
      weight: 1,
      name: 'Keine granulare Kontrolle',
      description: 'Keine Möglichkeit einzelne Cookie-Kategorien auszuwählen.',
      category: 'choice'
    }
  };

  /**
   * Confirm Shaming Phrasen
   */
  const SHAMING_PHRASES = [
    'nein, ich möchte nicht',
    'nein danke, ich verzichte',
    'ich möchte keine vorteile',
    'ohne personalisierung fortfahren',
    'ich mag keine guten angebote',
    'no thanks, i don\'t want',
    'no, i prefer not',
    'i don\'t care about',
    'i hate saving money'
  ];

  /**
   * Analysiert Farbe eines Elements
   */
  function getButtonColors(button) {
    if (!button) return null;

    const style = window.getComputedStyle(button);
    return {
      background: style.backgroundColor,
      color: style.color,
      border: style.borderColor
    };
  }

  /**
   * Berechnet Luminanz einer RGB-Farbe
   */
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Parst CSS-Farbwert zu RGB
   */
  function parseColor(color) {
    if (!color || color === 'transparent') return null;

    // RGB/RGBA
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    return null;
  }

  /**
   * Prüft ob Farbe "auffällig" ist (Grün, Blau = Call-to-Action)
   */
  function isAttractiveColor(rgb) {
    if (!rgb) return false;

    // Grüntöne (oft für positive CTAs)
    if (rgb.g > rgb.r * 1.3 && rgb.g > rgb.b) return true;

    // Blautöne (Trust-Farbe)
    if (rgb.b > rgb.r * 1.3 && rgb.b > rgb.g * 1.1) return true;

    // Hohe Sättigung generell
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const saturation = max > 0 ? (max - min) / max : 0;

    return saturation > 0.5 && max > 150;
  }

  /**
   * Prüft auf vorausgewählte Checkboxen
   */
  function checkPreselectedOptions(bannerElement) {
    if (!bannerElement) return false;

    const checkboxes = bannerElement.querySelectorAll(
      'input[type="checkbox"], [role="checkbox"], [role="switch"]'
    );

    for (const checkbox of checkboxes) {
      const isChecked = checkbox.checked ||
                       checkbox.getAttribute('aria-checked') === 'true' ||
                       checkbox.classList.contains('checked') ||
                       checkbox.classList.contains('active');

      const label = checkbox.closest('label')?.textContent?.toLowerCase() || '';

      // Ist es ein Tracking/Marketing-Checkbox?
      if (isChecked && /marketing|tracking|werbung|advertising|analytics|statistik/i.test(label)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Prüft auf Confirm Shaming
   */
  function checkConfirmShaming(bannerElement) {
    if (!bannerElement) return false;

    const text = bannerElement.textContent.toLowerCase();

    for (const phrase of SHAMING_PHRASES) {
      if (text.includes(phrase)) {
        return true;
      }
    }

    // Prüfe auch spezifisch Reject-Buttons
    const buttons = bannerElement.querySelectorAll('button, a[role="button"]');
    for (const btn of buttons) {
      const btnText = btn.textContent.toLowerCase();
      if (SHAMING_PHRASES.some(phrase => btnText.includes(phrase))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Prüft auf Forced Action (blockierender Overlay)
   */
  function checkForcedAction(bannerElement) {
    if (!bannerElement) return false;

    // Prüfe auf Overlay hinter dem Banner
    const style = window.getComputedStyle(bannerElement);
    const parent = bannerElement.parentElement;

    // Vollbild-Overlay?
    if (parent) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.position === 'fixed' &&
          parentStyle.inset === '0px' || (
            parentStyle.top === '0px' &&
            parentStyle.left === '0px' &&
            parentStyle.right === '0px' &&
            parentStyle.bottom === '0px'
          )) {
        return true;
      }
    }

    // Prüfe auf body scroll lock
    const bodyStyle = window.getComputedStyle(document.body);
    if (bodyStyle.overflow === 'hidden') {
      return true;
    }

    return false;
  }

  return {
    /**
     * Analysiert einen Banner auf Dark Patterns
     * @param {Object} banner - Banner-Objekt vom BannerDetector
     * @returns {Object} - Analyse-Ergebnis
     */
    analyze(banner) {
      if (!banner || !banner.element) {
        return {
          score: 0,
          patterns: [],
          recommendation: 'neutral'
        };
      }

      const detectedPatterns = [];
      const buttonAnalysis = BannerDetector.analyzeButtons(banner);

      // 1. Kein Ablehnen-Button
      if (!buttonAnalysis.hasReject && buttonAnalysis.hasAccept) {
        detectedPatterns.push({
          ...DARK_PATTERNS.noRejectButton,
          evidence: 'Kein sichtbarer Ablehnen-Button gefunden'
        });
      }

      // 2. Versteckter Ablehnen-Button (in Settings versteckt)
      if (!buttonAnalysis.hasReject && buttonAnalysis.hasSettings) {
        detectedPatterns.push({
          ...DARK_PATTERNS.hiddenReject,
          evidence: 'Ablehnen nur über Einstellungen möglich'
        });
      }

      // 3. Asymmetrische Buttons
      if (buttonAnalysis.acceptSize && buttonAnalysis.rejectSize) {
        const acceptArea = buttonAnalysis.acceptSize.width * buttonAnalysis.acceptSize.height;
        const rejectArea = buttonAnalysis.rejectSize.width * buttonAnalysis.rejectSize.height;

        if (acceptArea > rejectArea * 1.5) {
          detectedPatterns.push({
            ...DARK_PATTERNS.asymmetricButtons,
            evidence: `Akzeptieren-Button ist ${Math.round(acceptArea / rejectArea * 100)}% größer`
          });
        }
      }

      // 4. Farbmanipulation
      if (banner.buttons.accept && banner.buttons.reject) {
        const acceptColors = getButtonColors(banner.buttons.accept);
        const rejectColors = getButtonColors(banner.buttons.reject);

        if (acceptColors && rejectColors) {
          const acceptBg = parseColor(acceptColors.background);
          const rejectBg = parseColor(rejectColors.background);

          if (isAttractiveColor(acceptBg) && !isAttractiveColor(rejectBg)) {
            detectedPatterns.push({
              ...DARK_PATTERNS.colorManipulation,
              evidence: 'Akzeptieren hat auffällige Farbe, Ablehnen nicht'
            });
          }
        }
      }

      // 5. Vorausgewählte Optionen
      if (checkPreselectedOptions(banner.element)) {
        detectedPatterns.push({
          ...DARK_PATTERNS.preselectedOptions,
          evidence: 'Tracking-Optionen sind standardmäßig aktiviert'
        });
      }

      // 6. Confirm Shaming
      if (checkConfirmShaming(banner.element)) {
        detectedPatterns.push({
          ...DARK_PATTERNS.confirmShaming,
          evidence: 'Manipulativer Text beim Ablehnen gefunden'
        });
      }

      // 7. Forced Action
      if (checkForcedAction(banner.element)) {
        detectedPatterns.push({
          ...DARK_PATTERNS.forcedAction,
          evidence: 'Seite ist ohne Consent-Entscheidung nicht nutzbar'
        });
      }

      // 8. Keine granulare Kontrolle
      if (!buttonAnalysis.hasSettings) {
        const hasCheckboxes = banner.element.querySelectorAll('input[type="checkbox"]').length > 0;
        if (!hasCheckboxes) {
          detectedPatterns.push({
            ...DARK_PATTERNS.noGranularControl,
            evidence: 'Keine individuellen Einstellungsmöglichkeiten'
          });
        }
      }

      // Score berechnen
      const totalWeight = detectedPatterns.reduce((sum, p) => sum + p.weight, 0);
      const maxPossibleWeight = Object.values(DARK_PATTERNS).reduce((sum, p) => sum + p.weight, 0);
      const score = Math.round((totalWeight / maxPossibleWeight) * 100);

      // Empfehlung ableiten
      let recommendation;
      if (score >= 50) {
        recommendation = 'reject';
      } else if (score >= 25) {
        recommendation = 'caution';
      } else {
        recommendation = 'neutral';
      }

      return {
        score,
        patterns: detectedPatterns,
        recommendation,
        buttonAnalysis,
        summary: this.getSummary(score, detectedPatterns.length)
      };
    },

    /**
     * Erstellt Zusammenfassung der Analyse
     */
    getSummary(score, patternCount) {
      if (score >= 50) {
        return {
          level: 'danger',
          title: 'Viele Dark Patterns erkannt',
          message: `Dieser Banner verwendet ${patternCount} manipulative Techniken. Sei vorsichtig!`
        };
      } else if (score >= 25) {
        return {
          level: 'warning',
          title: 'Einige Dark Patterns erkannt',
          message: `${patternCount} leicht manipulative Elemente gefunden. Prüfe die Details.`
        };
      } else if (patternCount > 0) {
        return {
          level: 'info',
          title: 'Wenige Auffälligkeiten',
          message: `${patternCount} kleine Auffälligkeiten, aber insgesamt fair.`
        };
      } else {
        return {
          level: 'success',
          title: 'Faires Design',
          message: 'Keine Dark Patterns erkannt. Dieser Banner ist fair gestaltet.'
        };
      }
    },

    /**
     * Holt alle definierten Dark Patterns
     */
    getPatternDefinitions() {
      return DARK_PATTERNS;
    }
  };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkPatternAnalyzer;
} else if (typeof window !== 'undefined') {
  window.DarkPatternAnalyzer = DarkPatternAnalyzer;
}
