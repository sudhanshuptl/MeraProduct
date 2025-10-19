/**
 * MeraProduct Popup JavaScript
 * Handles popup UI interactions and data display
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});

/**
 * Initialize popup with current data
 */
async function initializePopup() {
  try {
    // Load extension stats
    const stats = await getExtensionStats();
    updateStatsDisplay(stats);
    
    // Load recent detections
    const recentDetections = await getRecentDetections();
    updateRecentDetections(recentDetections);
    
    // Update extension status
    const settings = await getSettings();
    updateExtensionStatus(settings.isEnabled);
    
  } catch (error) {
    console.error('[MeraProduct Popup] Initialization error:', error);
    showError('Failed to load extension data');
  }
}

/**
 * Set up event listeners for popup interactions
 */
function setupEventListeners() {
  // Toggle extension button
  const toggleBtn = document.getElementById('toggleBtn');
  toggleBtn?.addEventListener('click', handleToggleExtension);
  
  // Options button
  const optionsBtn = document.getElementById('optionsBtn');
  optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
  
  // About link
  const aboutLink = document.getElementById('aboutLink');
  aboutLink?.addEventListener('click', (e) => {
    e.preventDefault();
    showAboutInfo();
  });
  
  // Support link
  const supportLink = document.getElementById('supportLink');
  supportLink?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/sudhanshuptl/meraproduct/issues'
    });
    window.close();
  });
}

/**
 * Get extension statistics from background script
 */
function getExtensionStats() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      resolve(response || {
        totalDetections: 0,
        sitesSupported: ['amazon', 'flipkart'],
        lastDetection: null
      });
    });
  });
}

/**
 * Get recent detections from storage
 */
function getRecentDetections() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['detectionHistory'], (data) => {
      const history = data.detectionHistory || [];
      // Get last 5 detections
      resolve(history.slice(-5).reverse());
    });
  });
}

/**
 * Get extension settings
 */
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isEnabled', 'showNotifications', 'language'], (data) => {
      resolve({
        isEnabled: data.isEnabled !== false,
        showNotifications: data.showNotifications !== false,
        language: data.language || 'en'
      });
    });
  });
}

/**
 * Update stats display in popup
 */
function updateStatsDisplay(stats) {
  const totalDetectionsEl = document.getElementById('totalDetections');
  const sitesSupportedEl = document.getElementById('sitesSupported');
  
  if (totalDetectionsEl) {
    totalDetectionsEl.textContent = stats.totalDetections || 0;
  }
  
  if (sitesSupportedEl) {
    sitesSupportedEl.textContent = stats.sitesSupported?.length || 2;
  }
}

/**
 * Update recent detections list
 */
function updateRecentDetections(detections) {
  const recentList = document.getElementById('recentList');
  
  if (!recentList) return;
  
  if (detections.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    const icon = document.createElement('span');
    icon.textContent = '🔍';
    
    const text = document.createElement('p');
    text.textContent = 'No detections yet. Visit Amazon or Flipkart to start!';
    
    emptyState.appendChild(icon);
    emptyState.appendChild(text);
    recentList.appendChild(emptyState);
    return;
  }
  
  // Clear existing content
  recentList.innerHTML = '';
  
  detections.forEach(detection => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.title = detection.title;
    
    const site = document.createElement('span');
    site.className = 'site';
    site.textContent = detection.site;
    
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = truncateText(detection.title, 30);
    
    const confidence = document.createElement('span');
    confidence.className = 'confidence';
    confidence.textContent = `${Math.round(detection.confidence * 100)}%`;
    
    item.appendChild(site);
    item.appendChild(title);
    item.appendChild(confidence);
    recentList.appendChild(item);
  });
}

/**
 * Update extension status indicator
 */
function updateExtensionStatus(isEnabled) {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusDot = statusIndicator?.querySelector('.status-dot');
  const statusText = statusIndicator?.querySelector('.status-text');
  const toggleBtn = document.getElementById('toggleBtn');
  const toggleText = document.getElementById('toggleText');
  
  if (statusDot) {
    statusDot.classList.toggle('inactive', !isEnabled);
  }
  
  if (statusText) {
    statusText.textContent = isEnabled ? 'Active' : 'Disabled';
  }
  
  if (toggleBtn) {
    toggleBtn.classList.toggle('disabled', !isEnabled);
  }
  
  if (toggleText) {
    toggleText.textContent = isEnabled ? 'Disable Extension' : 'Enable Extension';
  }
}

/**
 * Handle extension toggle
 */
async function handleToggleExtension() {
  try {
    const settings = await getSettings();
    const newState = !settings.isEnabled;
    
    chrome.runtime.sendMessage({
      type: 'TOGGLE_EXTENSION',
      enabled: newState
    }, (response) => {
      if (response?.success) {
        updateExtensionStatus(newState);
        showSuccessMessage(newState ? 'Extension enabled!' : 'Extension disabled!');
      }
    });
    
  } catch (error) {
    console.error('[MeraProduct Popup] Toggle error:', error);
    showError('Failed to toggle extension');
  }
}

/**
 * Show about information
 */
function showAboutInfo() {
  const main = document.querySelector('.main');
  const originalContent = main.innerHTML;
  
  // Clear main content
  main.innerHTML = '';
  
  // Create about content safely
  const aboutDiv = document.createElement('div');
  aboutDiv.className = 'about-content';
  
  const title = document.createElement('h3');
  title.textContent = 'MeraProduct v1.0.0';
  aboutDiv.appendChild(title);
  
  const description = document.createElement('p');
  description.textContent = 'Detect Made in India products while browsing e-commerce sites.';
  aboutDiv.appendChild(description);
  
  const sitesTitle = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = 'Supported Sites:';
  sitesTitle.appendChild(strong);
  aboutDiv.appendChild(sitesTitle);
  
  const sitesList = document.createElement('ul');
  ['Amazon.in & Amazon.com', 'Flipkart.com'].forEach(site => {
    const li = document.createElement('li');
    li.textContent = site;
    sitesList.appendChild(li);
  });
  aboutDiv.appendChild(sitesList);
  
  const privacy = document.createElement('p');
  const privacyStrong = document.createElement('strong');
  privacyStrong.textContent = 'Privacy: ';
  privacy.appendChild(privacyStrong);
  privacy.appendChild(document.createTextNode('All processing happens locally in your browser.'));
  aboutDiv.appendChild(privacy);
  
  const footer = document.createElement('p');
  footer.textContent = 'Made with ❤️ for Atmanirbhar Bharat';
  aboutDiv.appendChild(footer);
  
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary';
  backBtn.id = 'backBtn';
  backBtn.textContent = 'Back';
  
  main.appendChild(aboutDiv);
  main.appendChild(backBtn);
  
  document.getElementById('backBtn')?.addEventListener('click', () => {
    main.innerHTML = originalContent;
    initializePopup();
    setupEventListeners();
  });
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  // Create temporary success indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #138808;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    animation: fadeInOut 2s ease-in-out;
  `;
  indicator.textContent = message;
  
  document.body.appendChild(indicator);
  setTimeout(() => indicator.remove(), 2000);
}

/**
 * Show error message
 */
function showError(message) {
  console.error('[MeraProduct Popup]:', message);
  
  // Create temporary error indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc3545;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
  `;
  indicator.textContent = message;
  
  document.body.appendChild(indicator);
  setTimeout(() => indicator.remove(), 3000);
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}