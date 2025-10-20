/**
 * MeraProduct Storage Utility
 * Manages product history in chrome.storage.local
 */

class ProductStorage {
  constructor() {
    this.MAX_PRODUCTS = 30;
    this.STORAGE_KEY = 'meraproduct_history';
  }

  /**
   * Save a product to history
   * @param {Object} product - Product information
   * @param {string} product.name - Product name
   * @param {string} product.url - Product URL
   * @param {string} product.site - Site name (flipkart/amazon)
   * @param {boolean} product.isMadeInIndia - Origin status
   * @param {number} product.confidence - Confidence score (0-1)
   * @param {string} product.indicator - Detection method
   * @param {string} product.manufacturer - Manufacturer info
   * @param {string} product.image - Product image URL (optional)
   */
  async saveProduct(product) {
    try {
      console.log('[ProductStorage] Starting to save product:', {
        name: product.name,
        url: product.url,
        site: product.site,
        isMadeInIndia: product.isMadeInIndia,
        confidence: product.confidence
      });
      
      const history = await this.getHistory();
      console.log('[ProductStorage] Current history length:', history.length);
      
      // Create product entry
      const productEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: product.name || 'Unknown Product',
        url: product.url,
        site: product.site,
        isMadeInIndia: product.isMadeInIndia,
        confidence: Math.round((product.confidence || 0) * 100),
        indicator: product.indicator || '',
        manufacturer: product.manufacturer || '',
        image: product.image || ''
      };

      // Check if product already exists (same URL)
      const existingIndex = history.findIndex(p => p.url === product.url);
      
      if (existingIndex !== -1) {
        // Update existing entry
        console.log('[ProductStorage] Updating existing product at index:', existingIndex);
        history[existingIndex] = productEntry;
      } else {
        // Add new entry at the beginning
        console.log('[ProductStorage] Adding new product to history');
        history.unshift(productEntry);
      }

      // Keep only last 30 products
      const limitedHistory = history.slice(0, this.MAX_PRODUCTS);

      // Save to storage
      await chrome.storage.local.set({ [this.STORAGE_KEY]: limitedHistory });
      
      console.log('✅ [ProductStorage] Product saved successfully! Total products:', limitedHistory.length);
      console.log('   Storage Key:', this.STORAGE_KEY);
      console.log('   Product:', productEntry.name);
      
      return productEntry;
    } catch (error) {
      console.error('❌ [ProductStorage] Error saving product:', error);
      throw error;
    }
  }

  /**
   * Get product history
   * @returns {Promise<Array>} Array of products
   */
  async getHistory() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('❌ Error getting history:', error);
      return [];
    }
  }

  /**
   * Clear all history
   */
  async clearHistory() {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
      console.log('✅ History cleared');
    } catch (error) {
      console.error('❌ Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const history = await this.getHistory();
    
    const total = history.length;
    const madeInIndia = history.filter(p => p.isMadeInIndia).length;
    const notMadeInIndia = total - madeInIndia;
    const percentage = total > 0 ? Math.round((madeInIndia / total) * 100) : 0;

    return {
      total,
      madeInIndia,
      notMadeInIndia,
      percentage
    };
  }

  /**
   * Delete a specific product by ID
   * @param {number} id - Product ID
   */
  async deleteProduct(id) {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(p => p.id !== id);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: filtered });
      console.log('✅ Product deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      throw error;
    }
  }
}

// Export for use in content scripts and popup
if (typeof window !== 'undefined') {
  window.ProductStorage = ProductStorage;
}
