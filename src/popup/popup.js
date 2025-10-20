const storage = new class ProductStorage {
  constructor() { this.storageKey = 'meraproduct_history'; }
  async saveProduct(product) {
    try {
      const history = await this.getHistory();
      const existingIndex = history.findIndex(p => p.url === product.url);
      const productData = { id: existingIndex >= 0 ? history[existingIndex].id : Date.now(), timestamp: Date.now(), ...product };
      if (existingIndex >= 0) history.splice(existingIndex, 1);
      history.unshift(productData);
      if (history.length > 30) history.splice(30);
      await chrome.storage.local.set({ [this.storageKey]: history });
      return productData;
    } catch (error) {
      console.error('[MeraProduct] Error saving product:', error);
      throw error;
    }
  }
  async getHistory() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || [];
    } catch (error) {
      console.error('[MeraProduct] Error getting history:', error);
      return [];
    }
  }
  async clearHistory() {
    try {
      await chrome.storage.local.set({ [this.storageKey]: [] });
    } catch (error) {
      console.error('[MeraProduct] Error clearing history:', error);
      throw error;
    }
  }
  async deleteProduct(id) {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(p => p.id !== id);
      await chrome.storage.local.set({ [this.storageKey]: filteredHistory });
    } catch (error) {
      console.error('[MeraProduct] Error deleting product:', error);
      throw error;
    }
  }
  async getStats() {
    try {
      const history = await this.getHistory();
      const total = history.length;
      const madeInIndia = history.filter(p => p.isMadeInIndia).length;
      const percentage = total > 0 ? Math.round((madeInIndia / total) * 100) : 0;
      return { total, madeInIndia, notMadeInIndia: total - madeInIndia, percentage };
    } catch (error) {
      return { total: 0, madeInIndia: 0, notMadeInIndia: 0, percentage: 0 };
    }
  }
};

const elements = {
  totalProducts: document.getElementById('totalProducts'),
  madeInIndiaCount: document.getElementById('madeInIndiaCount'),
  successRate: document.getElementById('successRate'),
  historyList: document.getElementById('historyList'),
  emptyState: document.getElementById('emptyState'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsPanel: document.getElementById('settingsPanel'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  debugModeToggle: document.getElementById('debugModeToggle'),
  showConfidenceToggle: document.getElementById('showConfidenceToggle')
};

function formatTime(ts) {
  const d = Date.now() - ts, s = d / 1000, m = s / 60, h = m / 60, day = h / 24;
  return s < 60 ? 'Just now' : m < 60 ? `${Math.floor(m)}m ago` : h < 24 ? `${Math.floor(h)}h ago` : day < 7 ? `${Math.floor(day)}d ago` : new Date(ts).toLocaleDateString();
}

function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.productId = p.id;
  const badge = p.isMadeInIndia ? `<span class="product-badge badge-success">${p.indicator}</span>` : `<span class="product-badge badge-danger">${p.indicator}</span>`;
  const img = p.image ? `<img src="${p.image}" alt="${p.name}" class="product-image" onerror="this.className='product-image no-image';this.innerHTML='📦';">` : `<div class="product-image no-image">📦</div>`;
  const conf = elements.showConfidenceToggle.checked ? `<span class="product-confidence">${p.confidence}% confident</span>` : '';
  card.innerHTML = `${img}<div class="product-info"><div class="product-header"><div class="product-name" title="${p.name}">${p.name}</div>${badge}</div><div class="product-meta"><span class="product-site">${p.site}</span>${conf}<span class="product-time">${formatTime(p.timestamp)}</span></div></div><button class="product-delete" title="Delete from history">×</button>`;
  card.onclick = e => { if (!e.target.classList.contains('product-delete')) chrome.tabs.create({ url: p.url }); };
  card.querySelector('.product-delete').onclick = async e => { e.stopPropagation(); if (confirm('Remove this product from history?')) { await storage.deleteProduct(p.id); await loadHistory(); } };
  return card;
}

async function loadStats() {
  const stats = await storage.getStats();
  elements.totalProducts.textContent = stats.total;
  elements.madeInIndiaCount.textContent = stats.madeInIndia;
  elements.successRate.textContent = stats.percentage + '%';
}

async function loadHistory() {
  const history = await storage.getHistory();
  elements.historyList.innerHTML = '';
  if (history.length === 0) {
    elements.emptyState.style.display = 'block';
    elements.historyList.style.display = 'none';
  } else {
    elements.emptyState.style.display = 'none';
    elements.historyList.style.display = 'flex';
    history.forEach(p => elements.historyList.appendChild(createProductCard(p)));
  }
  await loadStats();
}

elements.clearHistoryBtn.onclick = async () => { if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) { await storage.clearHistory(); await loadHistory(); } };
elements.refreshBtn.onclick = async () => { elements.refreshBtn.style.transform = 'rotate(360deg)'; await loadHistory(); setTimeout(() => elements.refreshBtn.style.transform = 'rotate(0deg)', 500); };
elements.settingsBtn.onclick = () => { elements.settingsPanel.style.display = 'flex'; elements.settingsPanel.classList.add('visible'); loadSettings(); };
elements.closeSettingsBtn.onclick = () => { elements.settingsPanel.classList.remove('visible'); setTimeout(() => elements.settingsPanel.style.display = 'none', 300); };

function loadSettings() {
  elements.debugModeToggle.checked = localStorage.getItem('meraproduct_debug') === 'true';
  elements.showConfidenceToggle.checked = localStorage.getItem('meraproduct_show_confidence') !== 'false';
}

elements.debugModeToggle.onchange = e => { 
  const isEnabled = e.target.checked;
  localStorage.setItem('meraproduct_debug', isEnabled);
  
  // Send message to all tabs to update debug mode
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'updateDebugMode', 
        debugMode: isEnabled 
      }).catch(() => {});
    });
  });
  
  // Show visual feedback
  const label = e.target.closest('.setting-item').querySelector('.setting-label span');
  const originalText = label.textContent;
  label.textContent = isEnabled ? 'Debug Mode ✓ Enabled' : 'Debug Mode ✗ Disabled';
  label.style.color = isEnabled ? '#22c55e' : '#f59e0b';
  
  setTimeout(() => {
    label.textContent = originalText;
    label.style.color = '';
  }, 2000);
};
elements.showConfidenceToggle.onchange = e => { localStorage.setItem('meraproduct_show_confidence', e.target.checked); loadHistory(); };

document.addEventListener('DOMContentLoaded', async () => { await loadHistory(); loadSettings(); setInterval(loadHistory, 30000); });
chrome.storage.onChanged.addListener((changes, ns) => { if (ns === 'local' && changes.meraproduct_history) loadHistory(); });
