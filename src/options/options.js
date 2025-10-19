/**
 * MeraProduct Options Page JavaScript
 * Handles settings management and user preferences
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeOptionsPage();
  setupEventListeners();
});

/**
 * Initialize options page with current settings
 */
async function initializeOptionsPage() {
  try {
    const settings = await loadSettings();
    populateSettingsForm(settings);
  } catch (error) {
    console.error('[MeraProduct Options] Initialization error:', error);
    showMessage('Failed to load settings', 'error');
  }
}

/**
 * Set up event listeners for all interactive elements
 */
function setupEventListeners() {
  // Save button
  const saveBtn = document.getElementById('saveBtn');
  saveBtn?.addEventListener('click', handleSaveSettings);
  
  // Reset button
  const resetBtn = document.getElementById('resetBtn');
  resetBtn?.addEventListener('click', handleResetSettings);
  
  // Export data button
  const exportBtn = document.getElementById('exportDataBtn');
  exportBtn?.addEventListener('click', handleExportData);
  
  // Clear data button
  const clearBtn = document.getElementById('clearDataBtn');
  clearBtn?.addEventListener('click', handleClearData);
  
  // About button
  const aboutBtn = document.getElementById('aboutBtn');
  aboutBtn?.addEventListener('click', handleAbout);
  
  // Confidence threshold range
  const confidenceRange = document.getElementById('confidenceThreshold');
  const confidenceValue = document.getElementById('confidenceValue');
  
  confidenceRange?.addEventListener('input', (e) => {
    const value = Math.round(e.target.value * 100);
    confidenceValue.textContent = `${value}%`;
  });
  
  // Site toggles
  const siteToggles = ['amazonIn', 'amazonCom', 'flipkart'];
  siteToggles.forEach(siteId => {
    const toggle = document.getElementById(siteId);
    toggle?.addEventListener('change', (e) => {
      updateSiteStatus(siteId, e.target.checked);
    });
  });
  
  // Auto-save for certain settings
  const autoSaveElements = [
    'enableExtension',
    'showNotifications', 
    'language',
    'showLowConfidence'
  ];
  
  autoSaveElements.forEach(id => {
    const element = document.getElementById(id);
    element?.addEventListener('change', () => {
      debounce(autoSaveSettings, 1000)();
    });
  });
}

/**
 * Load current settings from storage
 */
function loadSettings() {
  return new Promise((resolve) => {
    const defaultSettings = {
      isEnabled: true,
      showNotifications: true,
      language: 'en',
      confidenceThreshold: 0.6,
      showLowConfidence: false,
      enabledSites: {
        amazonIn: true,
        amazonCom: true,
        flipkart: true,
        myntra: false
      }
    };
    
    chrome.storage.local.get(Object.keys(defaultSettings), (data) => {
      const settings = { ...defaultSettings, ...data };
      resolve(settings);
    });
  });
}

/**
 * Populate form with current settings
 */
function populateSettingsForm(settings) {
  // General settings
  setCheckboxValue('enableExtension', settings.isEnabled);
  setCheckboxValue('showNotifications', settings.showNotifications);
  setSelectValue('language', settings.language);
  
  // Detection settings
  setRangeValue('confidenceThreshold', settings.confidenceThreshold);
  setCheckboxValue('showLowConfidence', settings.showLowConfidence);
  
  // Site settings
  if (settings.enabledSites) {
    Object.entries(settings.enabledSites).forEach(([site, enabled]) => {
      setCheckboxValue(site, enabled);
      updateSiteStatus(site, enabled);
    });
  }
}

/**
 * Handle save settings
 */
async function handleSaveSettings() {
  try {
    const settings = collectFormSettings();
    await saveSettings(settings);
    
    // Notify background script of changes
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATED',
      settings: settings
    });
    
    showMessage('Settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('[MeraProduct Options] Save error:', error);
    showMessage('Failed to save settings', 'error');
  }
}

/**
 * Handle reset settings to defaults
 */
async function handleResetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
    return;
  }
  
  try {
    await chrome.storage.local.clear();
    
    // Reload page to show defaults
    window.location.reload();
    
  } catch (error) {
    console.error('[MeraProduct Options] Reset error:', error);
    showMessage('Failed to reset settings', 'error');
  }
}

/**
 * Handle export detection data
 */
async function handleExportData() {
  try {
    const data = await getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meraproduct-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Data exported successfully!', 'success');
    
  } catch (error) {
    console.error('[MeraProduct Options] Export error:', error);
    showMessage('Failed to export data', 'error');
  }
}

/**
 * Handle clear all data
 */
async function handleClearData() {
  const confirmed = confirm(
    'Are you sure you want to clear all detection data? This will remove:\n\n' +
    '• Detection history\n' +
    '• Statistics\n' +
    '• Error logs\n\n' +
    'Settings will be preserved. This action cannot be undone.'
  );
  
  if (!confirmed) return;
  
  try {
    // Clear data but preserve settings
    const currentSettings = await loadSettings();
    
    await chrome.storage.local.clear();
    await saveSettings(currentSettings);
    
    showMessage('All data cleared successfully!', 'success');
    
  } catch (error) {
    console.error('[MeraProduct Options] Clear data error:', error);
    showMessage('Failed to clear data', 'error');
  }
}

/**
 * Handle about dialog
 */
function handleAbout() {
  const aboutText = `MeraProduct Chrome Extension v1.0.0

Detect Made in India products while browsing e-commerce sites.

Features:
• Automatic detection on Amazon and Flipkart
• Local processing for privacy
• Detailed statistics and history
• Multi-language support

Privacy:
All product analysis happens locally in your browser. No data is sent to external servers.

Made with ❤️ for Atmanirbhar Bharat Initiative`;

  alert(aboutText);
}

/**
 * Collect settings from form
 */
function collectFormSettings() {
  return {
    isEnabled: getCheckboxValue('enableExtension'),
    showNotifications: getCheckboxValue('showNotifications'),
    language: getSelectValue('language'),
    confidenceThreshold: getRangeValue('confidenceThreshold'),
    showLowConfidence: getCheckboxValue('showLowConfidence'),
    enabledSites: {
      amazonIn: getCheckboxValue('amazonIn'),
      amazonCom: getCheckboxValue('amazonCom'),
      flipkart: getCheckboxValue('flipkart'),
      myntra: getCheckboxValue('myntra')
    }
  };
}

/**
 * Save settings to storage
 */
function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(settings, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Auto-save settings with debounce
 */
const autoSaveSettings = async () => {
  try {
    const settings = collectFormSettings();
    await saveSettings(settings);
    
    // Brief visual feedback
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Saved ✓';
      setTimeout(() => {
        saveBtn.textContent = 'Save Settings';
      }, 1000);
    }
    
  } catch (error) {
    console.error('[MeraProduct Options] Auto-save error:', error);
  }
};

/**
 * Get data for export
 */
function getExportData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (data) => {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        detectionHistory: data.detectionHistory || [],
        detectionLog: data.detectionLog || [],
        settings: {
          isEnabled: data.isEnabled,
          showNotifications: data.showNotifications,
          language: data.language,
          confidenceThreshold: data.confidenceThreshold,
          enabledSites: data.enabledSites
        }
      };
      resolve(exportData);
    });
  });
}

/**
 * Update site status indicator
 */
function updateSiteStatus(siteId, enabled) {
  const siteItem = document.querySelector(`#${siteId}`).closest('.site-item');
  const statusSpan = siteItem?.querySelector('.site-status');
  
  if (statusSpan && !statusSpan.classList.contains('coming-soon')) {
    statusSpan.textContent = enabled ? 'Active' : 'Inactive';
    statusSpan.className = `site-status ${enabled ? 'active' : 'inactive'}`;
  }
}

/**
 * Show success/error message
 */
function showMessage(text, type) {
  const messageId = `${type}Message`;
  const messageEl = document.getElementById(messageId);
  
  if (messageEl) {
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  }
}

/**
 * Utility functions for form elements
 */
function setCheckboxValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.checked = value;
}

function getCheckboxValue(id) {
  const element = document.getElementById(id);
  return element ? element.checked : false;
}

function setSelectValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function getSelectValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : '';
}

function setRangeValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
    // Trigger input event to update display
    element.dispatchEvent(new Event('input'));
  }
}

function getRangeValue(id) {
  const element = document.getElementById(id);
  return element ? parseFloat(element.value) : 0.6;
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
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