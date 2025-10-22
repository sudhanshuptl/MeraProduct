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
    if (!text) {
      console.log('[MeraProduct][OriginDetector] ✗ No text provided');
      return { isIndian: false, confidence: 0 };
    }

    // Clean up text: normalize whitespace and add spaces after common patterns
    let cleanedText = text
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space between camelCase
      .replace(/([a-z])(\d)/g, '$1 $2')      // Add space between letter and number
      .replace(/(\d)([a-z])/gi, '$1 $2')     // Add space between number and letter
      .replace(/([:\)])([A-Z])/g, '$1 $2')   // Add space after : or ) before capital
      .replace(/\s+/g, ' ')                   // Normalize multiple spaces to single space
      .trim();

    // Log the actual text being analyzed for debugging
    console.log('[MeraProduct][OriginDetector] 📝 Analyzing text (first 500 chars):', cleanedText.substring(0, 500));
    console.log('[MeraProduct][OriginDetector] 📝 Text length:', cleanedText.length);

    const lowerText = cleanedText.toLowerCase();
    
    // Strong indicators for Indian origin (all case-insensitive with /i flag)
    const strongIndianIndicators = [
      /made\s+in\s+india/i,
      /manufactured\s+in\s+india/i,
      /country\s+of\s+origin[:\s]*india/i,
      /country[:\s]+india/i,
      /origin[:\s]+india/i,
      /origin:\s*india/i,  // Specific for "Origin: India" or "Origin:India"
      /\bIndia\s*Manufacturer/i,
      /भारत में निर्मित/i,
      /मेड इन इंडिया/i
    ];
    
    console.log('[MeraProduct][OriginDetector] 🔍 Checking strong indicators...');

    // All 28 States of India (case-insensitive)
    const indianStates = [
      'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
      'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand',
      'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur',
      'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
      'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
      'uttar pradesh', 'uttarakhand', 'west bengal'
    ];

    // All 8 Union Territories of India (case-insensitive)
    const indianUTs = [
      'andaman and nicobar islands', 'chandigarh', 'dadra and nagar haveli and daman and diu',
      'delhi', 'jammu and kashmir', 'ladakh', 'lakshadweep', 'puducherry'
    ];

    // Major Indian Cities (Top 100+ cities, industrial hubs, and popular areas)
    const indianCities = [
      // Metro cities
      'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad',
      
      // Tier 1 cities
      'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'visakhapatnam', 'indore', 'thane', 'bhopal',
      'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot',
      'varanasi', 'srinagar', 'amritsar', 'allahabad', 'prayagraj', 'ranchi', 'howrah', 'coimbatore',
      'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota', 'chandigarh',
      
      // Tier 2 cities & Industrial hubs
      'gurgaon', 'gurugram', 'noida', 'greater noida', 'navi mumbai', 'mysore', 'mysuru', 'mangalore',
      'hubli', 'belgaum', 'gulbarga', 'davangere', 'bellary', 'shimoga', 'tumkur', 'raichur',
      'kochi', 'cochin', 'thiruvananthapuram', 'kozhikode', 'calicut', 'thrissur', 'kollam', 'kannur',
      'tiruchirappalli', 'tiruppur', 'salem', 'erode', 'vellore', 'tirunelveli', 'thanjavur', 'dindigul',
      'aurangabad', 'solapur', 'amravati', 'nanded', 'kolhapur', 'sangli', 'jalgaon', 'akola',
      'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar', 'anand', 'bharuch', 'vapi', 'morbi',
      'udaipur', 'ajmer', 'bikaner', 'alwar', 'bhilwara', 'sikar', 'pali', 'sri ganganagar',
      'dehradun', 'haridwar', 'roorkee', 'haldwani', 'rudrapur', 'kashipur', 'rishikesh',
      'panipat', 'ambala', 'karnal', 'rohtak', 'hisar', 'sonipat', 'panchkula', 'yamunanagar',
      'jalandhar', 'patiala', 'bathinda', 'mohali', 'pathankot', 'hoshiarpur', 'batala', 'moga',
      'guwahati', 'silchar', 'dibrugarh', 'jorhat', 'tezpur', 'nagaon', 'tinsukia',
      'rourkela', 'cuttack', 'bhubaneswar', 'berhampur', 'sambalpur', 'balasore', 'puri',
      'dhanbad', 'bokaro', 'jamshedpur', 'giridih', 'hazaribagh', 'ramgarh', 'deoghar',
      'raigarh', 'bhilai', 'bilaspur', 'korba', 'durg', 'rajnandgaon', 'jagdalpur',
      'gaya', 'bhagalpur', 'muzaffarpur', 'darbhanga', 'purnia', 'bihar sharif', 'arrah',
      'gorakhpur', 'aligarh', 'moradabad', 'saharanpur', 'bareilly', 'firozabad', 'jhansi',
      'mathura', 'rampur', 'shahjahanpur', 'farrukhabad', 'muzaffarnagar', 'bulandshahr',
      'ghazipur', 'unnao', 'sitapur', 'etawah', 'orai', 'sambhal', 'budaun',
      'warangal', 'nizamabad', 'karimnagar', 'ramagundam', 'khammam', 'mahbubnagar', 'nalgonda',
      'guntur', 'nellore', 'kurnool', 'kadapa', 'rajahmundry', 'kakinada', 'tirupati', 'anantapur',
      'imphal', 'aizawl', 'agartala', 'shillong', 'kohima', 'itanagar', 'gangtok', 'port blair',
      
      // Major Industrial Areas/Zones
      'manesar', 'bawal', 'neemrana', 'bhiwadi', 'sanand', 'mundra', 'pithampur', 'dewas',
      'halol', 'hosur', 'sriperumbudur', 'oragadam', 'mahindra world city', 'chakan', 'ranjangaon',
      'taloja', 'khopoli', 'silvassa', 'verna', 'bicholim', 'dharwad', 'peenya', 'whitefield',
      'electronic city', 'sipcot', 'mahape', 'rabale', 'turbhe', 'sanpada', 'vashi', 'airoli',
      'ghiloth', 'tapukara', 'dharuhera', 'kundli', 'rai', 'bahadurgarh', 'binola', 'farrukhnagar',
      'baddi', 'parwanoo', 'kala amb', 'nalagarh', 'solan', 'paonta sahib', 'dappar',
      'haridwar industrial estate', 'sidcul', 'iie pantnagar', 'kashipur industrial area',
      'balanagar', 'jeedimetla', 'patancheru', 'medchal', 'pashamylaram', 'bollaram',
      'jejuri', 'khed', 'kurkumbh', 'shikrapur', 'rajgurunagar', 'talegaon', 'urse',
      'waluj', 'chikalthana', 'shendra', 'bidkin', 'paithan', 'Okhla', 'kalamkhand', 'Manor', 'Wada', 'Rewari'
    ];

    // Industrial area keywords
    const industrialKeywords = [
      'industrial area', 'industrial estate', 'industrial zone', 'gidc', 'midc', 'sipcot',
      'sidcul', 'riico', 'hsiidc', 'kiadb', 'apiic', 'upsidc', 'mpidc', 'gmidc',
      'industrial park', 'export processing zone', 'special economic zone', 'sez',
      'software park', 'tech park', 'it park', 'cyber park', 'infotech park'
    ];

    // Create regex patterns for states (case-insensitive)
    const statePattern = new RegExp(`\\b(${indianStates.join('|')})\\b`, 'i');
    
    // Create regex patterns for UTs (case-insensitive)
    const utPattern = new RegExp(`\\b(${indianUTs.join('|')})\\b`, 'i');
    
    // Create regex patterns for cities (case-insensitive)
    const cityPattern = new RegExp(`\\b(${indianCities.join('|')})\\b`, 'i');
    
    // Create regex patterns for industrial keywords (case-insensitive)
    const industrialPattern = new RegExp(`\\b(${industrialKeywords.join('|')})\\b`, 'i');

    // Indian PIN code pattern (6 digits)
    const pinCodePattern = /\b[1-9]\d{5}\b/i;

    // Manufacturer address pattern with Indian locations
    const manufacturerIndiaPattern = /manufactured\s+by[:\s]+[^,]+(india|bharat|${indianStates.slice(0, 5).join('|')})/i;

    // Check strong indicators first (highest confidence)
    for (let i = 0; i < strongIndianIndicators.length; i++) {
      const indicator = strongIndianIndicators[i];
      if (indicator.test(text)) {
        console.log(`[OriginDetector] ✓ Strong indicator #${i} matched:`, indicator.source.substring(0, 50));
        return { isIndian: true, confidence: 0.95, indicator: 'Made in India' };
      }
    }
    console.log('[MeraProduct][OriginDetector] ✗ No strong indicators matched');

    // Check for Indian states (very high confidence)
    console.log('[MeraProduct][OriginDetector] 🔍 Checking for Indian states...');
    if (statePattern.test(text)) {
      const match = text.match(statePattern);
      console.log('[MeraProduct][OriginDetector] ✓ Indian state detected:', match[0]);
      return { isIndian: true, confidence: 0.92, indicator: `State: ${match[0]}` };
    }
    console.log('[MeraProduct][OriginDetector] ✗ No Indian states found');

    // Check for Indian UTs (very high confidence)
    console.log('[MeraProduct][OriginDetector] 🔍 Checking for Indian UTs...');
    if (utPattern.test(text)) {
      const match = text.match(utPattern);
      console.log('[MeraProduct][OriginDetector] ✓ Indian UT detected:', match[0]);
      return { isIndian: true, confidence: 0.92, indicator: `UT: ${match[0]}` };
    }
    console.log('[MeraProduct][OriginDetector] ✗ No Indian UTs found');

    // Check for Indian cities (high confidence)
    console.log('[MeraProduct][OriginDetector] 🔍 Checking for Indian cities...');
    if (cityPattern.test(text)) {
      const match = text.match(cityPattern);
      console.log('[MeraProduct][OriginDetector] ✓ Indian city detected:', match[0]);
      return { isIndian: true, confidence: 0.88, indicator: `City: ${match[0]}` };
    }
    console.log('[MeraProduct][OriginDetector] ✗ No Indian cities found');

    // Check for industrial area keywords (medium-high confidence)
    if (industrialPattern.test(text)) {
      const match = text.match(industrialPattern);
      console.log('[MeraProduct][OriginDetector] ✓ Indian industrial area detected:', match[0]);
      return { isIndian: true, confidence: 0.85, indicator: `Industrial: ${match[0]}` };
    }

    // Check for Indian PIN codes (medium confidence - could be false positive)
    if (pinCodePattern.test(text)) {
      const match = text.match(pinCodePattern);
      console.log('[MeraProduct][OriginDetector] ✓ Indian PIN code detected:', match[0]);
      return { isIndian: true, confidence: 0.75, indicator: `PIN: ${match[0]}` };
    }

    console.log('[MeraProduct][OriginDetector] ✗ No Indian origin indicators found');
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
      // Determine badge color based on confidence
      const confidencePercent = Math.round(confidence * 100);
      const badgeClass = confidencePercent >= 70 ? 'meraproduct-badge-india' : 'meraproduct-badge-india-low';
      const confidenceEmoji = confidencePercent >= 70 ? '✅' : '⚠️';
      
      // Made in India - Green (≥70%) or Yellow (<70%) badge with Indian flag
      badge.innerHTML = `
        <div class="meraproduct-badge-inner ${badgeClass}">
          <div class="meraproduct-badge-icon">🇮🇳</div>
          <div class="meraproduct-badge-text">
            <div class="meraproduct-badge-title">MADE IN INDIA</div>
            <div class="meraproduct-badge-confidence">${confidenceEmoji} Confidence: ${confidencePercent}%</div>
          </div>
        </div>
      `;
      badge.setAttribute('title', `Click to view product history - Made in India 🇮🇳 (${confidencePercent}% confidence)`);
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
      badge.setAttribute('title', 'Click to view product history - Not Made in India');
    }
    
    // Add click handler to open extension popup
    badge.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      console.log('[MeraProduct] Badge clicked!');
      
      // Show notification to click extension icon
      this.showNotification(
        '👆 Click the MeraProduct icon (🇮🇳) in your browser toolbar to view product history and stats!',
        'info',
        5000
      );
      
      console.log('[MeraProduct] Notification displayed');
      
      // Send message to background to flash the extension icon
      chrome.runtime.sendMessage({ 
        action: 'highlightExtensionIcon',
        productData: {
          isMadeInIndia: isMadeInIndia,
          confidence: confidence
        }
      }).then(() => {
        console.log('[MeraProduct] Icon flash requested');
      }).catch((error) => {
        console.log('[MeraProduct] Background script not responding:', error);
      });
      
      // Add a visual feedback animation to the badge
      badge.style.animation = 'none';
      setTimeout(() => {
        badge.style.animation = '';
      }, 10);
    });
    
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
        user-select: none;
      }
      
      .meraproduct-badge-inner:hover {
        transform: scale(1.08) translateY(-2px);
        filter: brightness(1.15);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      
      .meraproduct-badge-inner:active {
        transform: scale(1.02);
      }
      
      /* Made in India - Green theme (High Confidence ≥70%) */
      .meraproduct-badge-india {
        background: linear-gradient(135deg, #138808 0%, #34a853 100%);
        border-color: #0d6906;
        color: white;
      }
      
      /* Made in India - Yellow theme (Low Confidence <70%) */
      .meraproduct-badge-india-low {
        background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
        border-color: #d97706;
        color: #78350f;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
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
  showNotification(message, type = 'success', duration = 5000) {
    // Create in-page notification toast
    const notification = document.createElement('div');
    notification.className = `meraproduct-notification meraproduct-notification-${type}`;
    notification.textContent = message;
    
    // Inject notification styles if not already present
    if (!document.getElementById('meraproduct-notification-styles')) {
      const notifStyles = document.createElement('style');
      notifStyles.id = 'meraproduct-notification-styles';
      notifStyles.textContent = `
        .meraproduct-notification {
          position: fixed;
          top: 80px;
          right: 20px;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: white;
          z-index: 999998;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          animation: meraproduct-notificationSlideIn 0.3s ease-out;
          line-height: 1.5;
        }
        
        .meraproduct-notification-success {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }
        
        .meraproduct-notification-info {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .meraproduct-notification-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .meraproduct-notification-error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        @keyframes meraproduct-notificationSlideIn {
          from {
            transform: translateX(450px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes meraproduct-notificationSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(450px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(notifStyles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after duration
    setTimeout(() => {
      notification.style.animation = 'meraproduct-notificationSlideOut 0.3s ease-in';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
    
    // Also send message to background script for browser notification (optional)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        message: message,
        notificationType: type
      }).catch(() => {
        // Silently fail if background script doesn't respond
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