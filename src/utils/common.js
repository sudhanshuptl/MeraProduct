/**
 * MeraProduct Utility Functions
 * Shared utilities used across the extension
 */

/**
 * Site Detection Utilities
 */
class SiteUtils {
  /**
   * Detect which e-commerce site we're on
   * @param {string} url - Current page URL
   * @returns {string|null} Site identifier
   */
  static detectSite(url = window.location.href) {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('amazon.')) {
      return 'amazon';
    } else if (hostname.includes('flipkart.')) {
      return 'flipkart';
    } else if (hostname.includes('myntra.')) {
      return 'myntra';
    }
    
    return null;
  }
  
  /**
   * Check if current page is a product page
   * @param {string} url - Current page URL
   * @returns {boolean} Is product page
   */
  static isProductPage(url = window.location.href) {
    const site = this.detectSite(url);
    
    switch (site) {
      case 'amazon':
        return /\/dp\/|\/gp\/product\//.test(url);
      case 'flipkart':
        return /\/p\//.test(url);
      case 'myntra':
        return /\/\d+\/buy/.test(url);
      default:
        return false;
    }
  }
  
  /**
   * Get site-specific configuration
   * @param {string} site - Site identifier
   * @returns {Object|null} Site configuration
   */
  static getSiteConfig(site) {
    // This would load from sites.json in a real implementation
    const configs = {
      amazon: {
        selectors: {
          productTitle: '#productTitle',
          featureBullets: '#feature-bullets ul',
          productDetails: '#detailBullets_feature_div'
        }
      },
      flipkart: {
        selectors: {
          productTitle: '.B_NuCI',
          highlights: '._2418kt',
          specifications: '._1mKl_E'
        }
      }
    };
    
    return configs[site] || null;
  }
}

/**
 * DOM Utilities
 */
class DOMUtils {
  /**
   * Safely query selector with fallback
   * @param {string|Array} selectors - CSS selectors to try
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Found element
   */
  static querySelector(selectors, context = document) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorList) {
      try {
        const element = context.querySelector(selector);
        if (element) return element;
      } catch (error) {
        console.warn('[MeraProduct] Invalid selector:', selector, error);
      }
    }
    
    return null;
  }
  
  /**
   * Extract text content from multiple selectors
   * @param {Array} selectors - CSS selectors to try
   * @param {Element} context - Context element
   * @returns {string} Combined text content
   */
  static extractTextFromSelectors(selectors, context = document) {
    const texts = [];
    
    for (const selector of selectors) {
      const element = this.querySelector(selector, context);
      if (element) {
        texts.push(element.textContent.trim());
      }
    }
    
    return texts.join(' ');
  }
  
  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Inner content
   * @returns {Element} Created element
   */
  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    if (content) {
      if (typeof content === 'string' && content.includes('<')) {
        // For HTML content, use textContent for security
        element.textContent = content;
      } else {
        element.textContent = content;
      }
    }
    
    return element;
  }
  
  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} Promise that resolves with element
   */
  static waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
}

/**
 * Text Processing Utilities
 */
class TextUtils {
  /**
   * Clean and normalize text for analysis
   * @param {string} text - Input text
   * @returns {string} Cleaned text
   */
  static cleanText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .toLowerCase();
  }
  
  /**
   * Extract manufacturer name from text
   * @param {string} text - Input text
   * @returns {string|null} Manufacturer name
   */
  static extractManufacturer(text) {
    if (!text) return null;
    
    const patterns = [
      /manufacturer[:\s]+([^,\n.]+)/i,
      /brand[:\s]+([^,\n.]+)/i,
      /made by[:\s]+([^,\n.]+)/i,
      /marketed by[:\s]+([^,\n.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Check if text contains Indian indicators
   * @param {string} text - Input text
   * @returns {Object} Detection result
   */
  static hasIndianIndicators(text) {
    const cleanText = this.cleanText(text);
    
    const strongIndicators = [
      'made in india',
      'manufactured in india',
      'country of origin india',
      'origin india'
    ];
    
    const weakIndicators = [
      'indian',
      'bharati',
      'desi',
      'swadeshi'
    ];
    
    // Check strong indicators
    for (const indicator of strongIndicators) {
      if (cleanText.includes(indicator)) {
        return { found: true, confidence: 0.9, indicator };
      }
    }
    
    // Check weak indicators
    for (const indicator of weakIndicators) {
      if (cleanText.includes(indicator)) {
        return { found: true, confidence: 0.6, indicator };
      }
    }
    
    return { found: false, confidence: 0 };
  }
}

/**
 * Storage Utilities
 */
class StorageUtils {
  /**
   * Get data from chrome storage with defaults
   * @param {Object} defaults - Default values
   * @returns {Promise<Object>} Storage data
   */
  static async get(defaults = {}) {
    return new Promise((resolve) => {
      chrome.storage.local.get(defaults, resolve);
    });
  }
  
  /**
   * Set data in chrome storage
   * @param {Object} data - Data to store
   * @returns {Promise} Storage promise
   */
  static async set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }
  
  /**
   * Add item to array in storage
   * @param {string} key - Storage key
   * @param {*} item - Item to add
   * @param {number} maxLength - Maximum array length
   */
  static async addToArray(key, item, maxLength = 1000) {
    const data = await this.get({ [key]: [] });
    const array = data[key];
    
    array.push(item);
    
    if (array.length > maxLength) {
      array.splice(0, array.length - maxLength);
    }
    
    await this.set({ [key]: array });
  }
  
  /**
   * Get statistics from stored data
   * @returns {Promise<Object>} Statistics object
   */
  static async getStats() {
    const data = await this.get({
      detectionHistory: [],
      detectionLog: []
    });
    
    const { detectionHistory, detectionLog } = data;
    
    return {
      totalDetections: detectionHistory.length,
      lastDetection: detectionHistory.length > 0 ? 
        detectionHistory[detectionHistory.length - 1].timestamp : null,
      averageConfidence: this.calculateAverageConfidence(detectionLog),
      topSites: this.getTopSites(detectionHistory)
    };
  }
  
  /**
   * Calculate average confidence from detection log
   * @param {Array} log - Detection log
   * @returns {number} Average confidence
   */
  static calculateAverageConfidence(log) {
    if (log.length === 0) return 0;
    
    const total = log.reduce((sum, entry) => sum + (entry.confidence || 0), 0);
    return total / log.length;
  }
  
  /**
   * Get top sites by detection count
   * @param {Array} history - Detection history
   * @returns {Array} Top sites
   */
  static getTopSites(history) {
    const siteCounts = {};
    
    history.forEach(detection => {
      siteCounts[detection.site] = (siteCounts[detection.site] || 0) + 1;
    });
    
    return Object.entries(siteCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([site, count]) => ({ site, count }));
  }
}

/**
 * Performance Utilities
 */
class PerformanceUtils {
  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
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
  
  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Execute function when browser is idle
   * @param {Function} callback - Function to execute
   * @param {number} timeout - Fallback timeout
   */
  static whenIdle(callback, timeout = 5000) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, 50);
    }
  }
}

// Export utilities for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SiteUtils,
    DOMUtils,
    TextUtils,
    StorageUtils,
    PerformanceUtils
  };
} else {
  window.MeraProductUtils = {
    SiteUtils,
    DOMUtils,
    TextUtils,
    StorageUtils,
    PerformanceUtils
  };
}