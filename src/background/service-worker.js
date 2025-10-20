/**
 * MeraProduct Background Service Worker
 * Handles messages, notifications, and extension lifecycle
 */

// Extension state
let extensionState = {
  isEnabled: true,
  detectedProducts: [],
  stats: {
    totalDetections: 0,
    sitesSupported: ['amazon', 'flipkart'],
    lastDetection: null
  }
};

/**
 * Handle installation and updates
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[MeraProduct] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      isEnabled: true,
      showNotifications: true,
      language: 'en',
      detectionLog: []
    });
    
    // Show welcome notification (with error handling for icon loading issues)
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
        title: 'MeraProduct Extension Installed!',
        message: '🇮🇳 Start browsing e-commerce sites to discover Made in India products!'
      }).catch(err => {
        console.warn('[MeraProduct] Could not show welcome notification:', err);
      });
    } catch (error) {
      console.warn('[MeraProduct] Notification API error:', error);
    }
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[MeraProduct] Received message:', message.type);

  switch (message.type) {
    case 'INDIAN_PRODUCT_DETECTED':
      handleIndianProductDetected(message, sender);
      break;
      
    case 'SHOW_NOTIFICATION':
      handleShowNotification(message);
      break;
      
    case 'ERROR':
      handleError(message, sender);
      break;
      
    case 'GET_EXTENSION_STATE':
      sendResponse(extensionState);
      break;
      
    case 'GET_STATS':
      getStats().then(stats => sendResponse(stats));
      return true; // Async response
      
    case 'TOGGLE_EXTENSION':
      toggleExtension(message.enabled);
      sendResponse({ success: true });
      break;
      
    case 'CLEAR_DATA':
      clearData().then(() => sendResponse({ success: true }));
      return true; // Async response
      
    default:
      console.warn('[MeraProduct] Unknown message type:', message.type);
  }
});

/**
 * Handle Indian product detection
 */
function handleIndianProductDetected(message, sender) {
  const detection = {
    timestamp: new Date().toISOString(),
    site: message.site,
    url: message.url,
    title: message.title,
    manufacturer: message.manufacturer,
    confidence: message.confidence,
    indicator: message.indicator,
    tabId: sender.tab?.id
  };

  // Add to detected products
  extensionState.detectedProducts.push(detection);
  extensionState.stats.totalDetections++;
  extensionState.stats.lastDetection = detection.timestamp;

  // Update badge
  updateBadge(sender.tab?.id, '🇮🇳');

  // Show notification if enabled
  chrome.storage.local.get(['showNotifications'], (data) => {
    if (data.showNotifications !== false) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icons/icon48.png'),
        title: 'Made in India Product Found!',
        message: `🇮🇳 ${message.title.substring(0, 50)}${message.title.length > 50 ? '...' : ''}`
      }).catch(err => {
        console.warn('[MeraProduct] Notification error:', err);
      });
    }
  });

  // Store detection data
  chrome.storage.local.get(['detectionHistory'], (data) => {
    const history = data.detectionHistory || [];
    history.push(detection);
    
    // Keep only last 500 detections
    if (history.length > 500) {
      history.splice(0, history.length - 500);
    }
    
    chrome.storage.local.set({ detectionHistory: history });
  });
}

/**
 * Handle notification requests
 */
function handleShowNotification(message) {
  chrome.storage.local.get(['showNotifications'], (data) => {
    if (data.showNotifications !== false) {
      const iconUrl = message.notificationType === 'success' ? 
        chrome.runtime.getURL('assets/icons/icon48.png') : 
        chrome.runtime.getURL('assets/icons/icon32.png');
        
      chrome.notifications.create({
        type: 'basic',
        iconUrl: iconUrl,
        title: 'MeraProduct',
        message: message.message
      }).catch(err => {
        console.warn('[MeraProduct] Notification error:', err);
      });
    }
  });
}

/**
 * Handle error messages
 */
function handleError(message, sender) {
  console.error('[MeraProduct] Error from content script:', message.error);
  
  // Log error for debugging
  chrome.storage.local.get(['errorLog'], (data) => {
    const errors = data.errorLog || [];
    errors.push({
      timestamp: new Date().toISOString(),
      error: message.error,
      site: message.site,
      url: message.url,
      tabId: sender.tab?.id
    });
    
    // Keep only last 100 errors
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
    
    chrome.storage.local.set({ errorLog: errors });
  });
}

/**
 * Update extension badge
 */
function updateBadge(tabId, text = '') {
  if (tabId) {
    chrome.action.setBadgeText({
      text: text,
      tabId: tabId
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#ff6600',
      tabId: tabId
    });
  }
}

/**
 * Clear badge when tab is updated
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    updateBadge(tabId, '');
  }
});

/**
 * Get extension statistics
 */
async function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['detectionHistory', 'detectionLog'], (data) => {
      const history = data.detectionHistory || [];
      const log = data.detectionLog || [];
      
      const stats = {
        totalDetections: history.length,
        sitesSupported: ['amazon.in', 'amazon.com', 'flipkart.com'],
        lastDetection: history.length > 0 ? history[history.length - 1].timestamp : null,
        detectionsByMonth: getDetectionsByMonth(history),
        topSites: getTopSites(history),
        confidenceDistribution: getConfidenceDistribution(log)
      };
      
      resolve(stats);
    });
  });
}

/**
 * Get detections grouped by month
 */
function getDetectionsByMonth(history) {
  const monthlyData = {};
  
  history.forEach(detection => {
    const month = new Date(detection.timestamp).toISOString().substring(0, 7); // YYYY-MM
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });
  
  return monthlyData;
}

/**
 * Get top sites by detection count
 */
function getTopSites(history) {
  const siteData = {};
  
  history.forEach(detection => {
    siteData[detection.site] = (siteData[detection.site] || 0) + 1;
  });
  
  return Object.entries(siteData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([site, count]) => ({ site, count }));
}

/**
 * Get confidence score distribution
 */
function getConfidenceDistribution(log) {
  const distribution = { high: 0, medium: 0, low: 0 };
  
  log.forEach(entry => {
    if (entry.confidence >= 0.8) {
      distribution.high++;
    } else if (entry.confidence >= 0.6) {
      distribution.medium++;
    } else {
      distribution.low++;
    }
  });
  
  return distribution;
}

/**
 * Toggle extension enabled state
 */
function toggleExtension(enabled) {
  extensionState.isEnabled = enabled;
  chrome.storage.local.set({ isEnabled: enabled });
  
  // Update icon based on state (only if we have disabled icons)
  // For now, we'll skip changing the icon since we don't have disabled versions
  // TODO: Create disabled icon variants
  
  // If we want to change the icon in the future:
  // const iconPaths = enabled ? {
  //   "16": "assets/icons/icon16.png",
  //   "32": "assets/icons/icon32.png",
  //   "48": "assets/icons/icon48.png",
  //   "128": "assets/icons/icon128.png"
  // } : {
  //   "16": "assets/icons/icon16-disabled.png",
  //   "32": "assets/icons/icon32-disabled.png",
  //   "48": "assets/icons/icon48-disabled.png",
  //   "128": "assets/icons/icon128-disabled.png"
  // };
  // chrome.action.setIcon({ path: iconPaths });
}

/**
 * Clear all extension data
 */
async function clearData() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      extensionState.detectedProducts = [];
      extensionState.stats.totalDetections = 0;
      extensionState.stats.lastDetection = null;
      
      // Reset to defaults
      chrome.storage.local.set({
        isEnabled: true,
        showNotifications: true,
        language: 'en'
      });
      
      resolve();
    });
  });
}

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[MeraProduct] Extension started');
  
  // Load saved settings
  chrome.storage.local.get(['isEnabled'], (data) => {
    extensionState.isEnabled = data.isEnabled !== false;
    toggleExtension(extensionState.isEnabled);
  });
});

console.log('[MeraProduct] Background service worker loaded');