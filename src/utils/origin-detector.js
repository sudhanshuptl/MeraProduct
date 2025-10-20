/**
 * MeraProduct Origin Detector Utility
 * Core logic for detecting product origin information
 */

console.log('[MeraProduct] OriginDetector class loaded');

class OriginDetector {
  constructor() {
    console.log('[MeraProduct] OriginDetector instance created');
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
      /made in india/i,
      /manufactured in india/i, 
      /(country of origin|country):?\s*india/i,
      /origin:?\s*india/i,
      /भारत में निर्मित/i,
      /मेड इन इंडिया/i
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
   * Create floating badge element
   * @param {boolean} isMadeInIndia - Whether product is made in India
   * @param {number} confidence - Confidence level (0-1)
   * @returns {HTMLElement} Badge element
   */
  createFloatingBadge(isMadeInIndia, confidence = 1.0) {
    const badge = document.createElement('div');
    badge.className = 'meraproduct-floating-badge';
    
    if (isMadeInIndia) {
      // Made in India - Green badge with Indian flag
      badge.innerHTML = `
        <div class="meraproduct-badge-inner meraproduct-badge-india">
          <div class="meraproduct-badge-icon">🇮🇳</div>
          <div class="meraproduct-badge-text">
            <div class="meraproduct-badge-title">MADE IN INDIA</div>
            <div class="meraproduct-badge-confidence">Confidence: ${Math.round(confidence * 100)}%</div>
          </div>
        </div>
      `;
      badge.setAttribute('title', 'This product is Made in India - Support Atmanirbhar Bharat! 🇮🇳');
    } else {
      // Not Made in India - Red badge with warning
      badge.innerHTML = `
        <div class="meraproduct-badge-inner meraproduct-badge-not-india">
          <div class="meraproduct-badge-icon">🚫</div>
          <div class="meraproduct-badge-text">
            <div class="meraproduct-badge-title">NOT MADE IN INDIA</div>
            <div class="meraproduct-badge-subtitle">Check other products</div>
          </div>
        </div>
      `;
      badge.setAttribute('title', 'This product is NOT Made in India');
    }
    
    this.injectBadgeStyles();
    return badge;
  }

  /**
   * Inject CSS styles for the floating badge
   */
  injectBadgeStyles() {
    // Check if styles already injected
    if (document.getElementById('meraproduct-badge-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'meraproduct-badge-styles';
    styles.textContent = `
      .meraproduct-floating-badge {
        position: fixed;
        top: 120px;
        right: 20px;
        z-index: 999999;
        animation: meraproduct-slideIn 0.5s ease-out, meraproduct-pulse 2s ease-in-out infinite;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
      }
      
      .meraproduct-badge-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 3px solid;
      }
      
      .meraproduct-badge-inner:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }
      
      /* Made in India - Green theme */
      .meraproduct-badge-india {
        background: linear-gradient(135deg, #138808 0%, #34a853 100%);
        border-color: #0d6906;
        color: white;
      }
      
      /* Not Made in India - Bold Red theme */
      .meraproduct-badge-not-india {
        background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
        border-color: #b71c1c;
        color: white;
      }
      
      .meraproduct-badge-icon {
        font-size: 32px;
        line-height: 1;
        animation: meraproduct-iconBounce 1s ease-in-out infinite;
      }
      
      .meraproduct-badge-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .meraproduct-badge-title {
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 0.5px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        line-height: 1.2;
      }
      
      .meraproduct-badge-confidence {
        font-size: 11px;
        font-weight: 600;
        opacity: 0.95;
        letter-spacing: 0.3px;
      }
      
      .meraproduct-badge-subtitle {
        font-size: 12px;
        font-weight: 600;
        opacity: 0.95;
        letter-spacing: 0.3px;
      }
      
      /* Animations */
      @keyframes meraproduct-slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes meraproduct-pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
      }
      
      @keyframes meraproduct-iconBounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .meraproduct-floating-badge {
          top: auto;
          bottom: 20px;
          right: 10px;
        }
        
        .meraproduct-badge-inner {
          padding: 10px 16px;
          gap: 10px;
        }
        
        .meraproduct-badge-icon {
          font-size: 28px;
        }
        
        .meraproduct-badge-title {
          font-size: 14px;
        }
        
        .meraproduct-badge-confidence,
        .meraproduct-badge-subtitle {
          font-size: 10px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Create Indian flag badge element (legacy method for compatibility)
   * @returns {HTMLElement} Badge element
   */
  createIndianBadge() {
    return this.createFloatingBadge(true, 1.0);
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