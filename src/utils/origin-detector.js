/**
 * MeraProduct Origin Detector Utility
 * Core logic for detecting product origin information
 */

class OriginDetector {
  constructor() {
    this.isIndianProduct = false;
    this.originInfo = null;
    this.confidence = 0;
  }

  /**
   * Detect product origin from text content
   * @param {string} text - Text to analyze
   * @returns {Object} Origin detection result
   */
  detectFromText(text) {
    if (!text) return { isIndian: false, confidence: 0 };

    const lowerText = text.toLowerCase();
    
    // Strong indicators for Indian origin
    const strongIndianIndicators = [
      'made in india',
      'manufactured in india', 
      'country of origin: india',
      'origin: india',
      'भारत में निर्मित',
      'मेड इन इंडिया'
    ];

    // Weak indicators for Indian origin
    const weakIndianIndicators = [
      'indian',
      'bharati',
      'desi',
      'swadeshi'
    ];

    // Check strong indicators
    for (const indicator of strongIndianIndicators) {
      if (lowerText.includes(indicator)) {
        return { isIndian: true, confidence: 0.9, indicator };
      }
    }

    // Check weak indicators
    for (const indicator of weakIndianIndicators) {
      if (lowerText.includes(indicator)) {
        return { isIndian: true, confidence: 0.6, indicator };
      }
    }

    return { isIndian: false, confidence: 0 };
  }

  /**
   * Extract manufacturer information
   * @param {string} text - Text to analyze
   * @returns {string|null} Manufacturer name
   */
  extractManufacturer(text) {
    if (!text) return null;

    const manufacturerPatterns = [
      /manufactured by[:\s]+([^,\n;]+?)(?=\s*(?:country|origin|brand|$))/i,
      /manufacturer[:\s]+([^,\n;]+?)(?=\s*(?:country|origin|brand|$))/i,
      /made by[:\s]+([^,\n;]+?)(?=\s*(?:country|origin|brand|$))/i,
      /brand[:\s]+([^,\n;]+?)(?=\s*(?:country|origin|manufactured|$))/i
    ];

    for (const pattern of manufacturerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Create Indian flag badge element
   * @returns {HTMLElement} Badge element
   */
  createIndianBadge() {
    const badge = document.createElement('div');
    badge.className = 'meraproduct-badge';
    badge.innerHTML = `
      <div class="meraproduct-badge-content">
        🇮🇳 <span class="meraproduct-text">Made in India</span>
      </div>
    `;
    badge.setAttribute('title', 'This product is made in India - Support Atmanirbhar Bharat!');
    return badge;
  }

  /**
   * Show notification to user
   * @param {string} message - Message to show
   * @param {string} type - Notification type (success, info, warning)
   */
  showNotification(message, type = 'success') {
    // Send message to background script for notification
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        message: message,
        notificationType: type
      });
    }
  }

  /**
   * Log detection result for analytics
   * @param {Object} result - Detection result
   * @param {string} site - Site name
   * @param {string} url - Current URL
   */
  logDetection(result, site, url) {
    const logData = {
      timestamp: new Date().toISOString(),
      site: site,
      url: url,
      isIndian: result.isIndian,
      confidence: result.confidence,
      indicator: result.indicator || null
    };

    // Store in local storage for analytics
    chrome.storage.local.get(['detectionLog'], (data) => {
      const log = data.detectionLog || [];
      log.push(logData);
      
      // Keep only last 1000 entries
      if (log.length > 1000) {
        log.splice(0, log.length - 1000);
      }
      
      chrome.storage.local.set({ detectionLog: log });
    });
  }

  /**
   * Debounce function to limit rapid calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OriginDetector;
} else {
  window.OriginDetector = OriginDetector;
}