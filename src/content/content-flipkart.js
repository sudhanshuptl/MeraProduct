/**
 * MeraProduct Content Script - Flipkart
 * Detects Made in India products on Flipkart pages
 */

(function() {
  'use strict';

  const detector = new OriginDetector();
  let hasProcessed = false;

  // Flipkart-specific selectors
  const FLIPKART_SELECTORS = {
    productTitle: '.B_NuCI, ._35KyD6',
    specifications: '._1mKl_E, ._3k-BhJ',
    highlights: '._2418kt, ._1AN87F',
    productDetails: '._1mKl_E table, ._3k-BhJ table',
    breadcrumb: '._1naDKh, ._2m3-t3',
    priceSection: '._1_WHN1, ._30jeq3'
  };

  /**
   * Extract product information from Flipkart page
   */
  function extractProductInfo() {
    const productInfo = {
      title: '',
      highlights: '',
      specifications: '',
      details: '',
      allText: ''
    };

    // Extract product title
    const titleElement = document.querySelector(FLIPKART_SELECTORS.productTitle);
    if (titleElement) {
      productInfo.title = titleElement.textContent.trim();
    }

    // Extract highlights
    const highlightsElement = document.querySelector(FLIPKART_SELECTORS.highlights);
    if (highlightsElement) {
      productInfo.highlights = highlightsElement.textContent.trim();
    }

    // Extract specifications
    const specsElement = document.querySelector(FLIPKART_SELECTORS.specifications);
    if (specsElement) {
      productInfo.specifications = specsElement.textContent.trim();
    }

    // Extract product details
    const detailsElement = document.querySelector(FLIPKART_SELECTORS.productDetails);
    if (detailsElement) {
      productInfo.details = detailsElement.textContent.trim();
    }

    // Combine all text for analysis
    productInfo.allText = `${productInfo.title} ${productInfo.highlights} ${productInfo.specifications} ${productInfo.details}`;

    return productInfo;
  }

  /**
   * Find the best location to insert the Indian badge
   */
  function findBadgeLocation() {
    // Try to find title area first
    const titleElement = document.querySelector(FLIPKART_SELECTORS.productTitle);
    if (titleElement && titleElement.parentElement) {
      return titleElement.parentElement;
    }

    // Fallback to breadcrumb area
    const breadcrumbElement = document.querySelector(FLIPKART_SELECTORS.breadcrumb);
    if (breadcrumbElement) {
      return breadcrumbElement;
    }

    // Last resort - body
    return document.body;
  }

  /**
   * Insert Indian badge into the page
   */
  function insertIndianBadge(result) {
    const badge = detector.createIndianBadge();
    const location = findBadgeLocation();
    
    if (location) {
      // Add Flipkart-specific styling
      badge.classList.add('meraproduct-flipkart-badge');
      location.insertAdjacentElement('afterend', badge);
      
      // Show success notification
      detector.showNotification(
        `🇮🇳 Made in India product detected! Confidence: ${Math.round(result.confidence * 100)}%`,
        'success'
      );
    }
  }

  /**
   * Process the Flipkart product page
   */
  function processPage() {
    if (hasProcessed) return;

    try {
      const productInfo = extractProductInfo();
      
      if (!productInfo.allText.trim()) {
        // Page might still be loading, try again later
        setTimeout(processPage, 2000);
        return;
      }

      const result = detector.detectFromText(productInfo.allText);
      
      if (result.isIndian && result.confidence > 0.5) {
        insertIndianBadge(result);
        hasProcessed = true;

        // Extract manufacturer if possible
        const manufacturer = detector.extractManufacturer(productInfo.allText);
        
        // Log the detection
        detector.logDetection(result, 'flipkart', window.location.href);

        // Send message to background script
        chrome.runtime.sendMessage({
          type: 'INDIAN_PRODUCT_DETECTED',
          site: 'flipkart',
          url: window.location.href,
          title: productInfo.title,
          manufacturer: manufacturer,
          confidence: result.confidence,
          indicator: result.indicator
        });
      }

    } catch (error) {
      console.error('[MeraProduct] Error processing Flipkart page:', error);
      chrome.runtime.sendMessage({
        type: 'ERROR',
        error: error.message,
        site: 'flipkart',
        url: window.location.href
      });
    }
  }

  /**
   * Set up mutation observer for dynamic content
   */
  function setupObserver() {
    const debouncedProcess = detector.debounce(processPage, 1000);
    
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if important content was added
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const hasImportantContent = 
                node.querySelector && (
                  node.querySelector(FLIPKART_SELECTORS.productTitle) ||
                  node.querySelector(FLIPKART_SELECTORS.highlights) ||
                  node.querySelector(FLIPKART_SELECTORS.specifications)
                );
              
              if (hasImportantContent) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldProcess) {
        debouncedProcess();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  /**
   * Initialize the content script
   */
  function initialize() {
    console.log('[MeraProduct] Flipkart content script loaded');

    // Process immediately if page is already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processPage);
    } else {
      setTimeout(processPage, 500); // Small delay to ensure page is ready
    }

    // Set up observer for dynamic content
    setupObserver();

    // Handle navigation in single-page apps
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        hasProcessed = false;
        setTimeout(processPage, 1000);
      }
    }, 1000);
  }

  // Start the extension
  initialize();

})();