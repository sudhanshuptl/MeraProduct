/**
 * MeraProduct Content Script - Amazon
 * Detects Made in India products on Amazon pages
 */

(function() {
  'use strict';

  const detector = new OriginDetector();
  let hasProcessed = false;

  // Amazon-specific selectors
  const AMAZON_SELECTORS = {
    productTitle: '#productTitle, .product-title',
    featureBullets: '#feature-bullets ul, .a-unordered-list.a-vertical.a-spacing-mini',
    productDetails: '#detailBullets_feature_div, #productDetails_detailBullets_sections1',
    additionalInfo: '#productDetails_techSpec_section_1, .a-section.a-spacing-small',
    breadcrumb: '#wayfinding-breadcrumbs_feature_div',
    priceSection: '.a-price-whole, .a-price .a-offscreen'
  };

  /**
   * Extract product information from Amazon page
   */
  function extractProductInfo() {
    const productInfo = {
      title: '',
      features: '',
      details: '',
      additionalInfo: '',
      allText: ''
    };

    // Extract product title
    const titleElement = document.querySelector(AMAZON_SELECTORS.productTitle);
    if (titleElement) {
      productInfo.title = titleElement.textContent.trim();
    }

    // Extract feature bullets
    const featuresElement = document.querySelector(AMAZON_SELECTORS.featureBullets);
    if (featuresElement) {
      productInfo.features = featuresElement.textContent.trim();
    }

    // Extract product details
    const detailsElement = document.querySelector(AMAZON_SELECTORS.productDetails);
    if (detailsElement) {
      productInfo.details = detailsElement.textContent.trim();
    }

    // Extract additional information
    const additionalElement = document.querySelector(AMAZON_SELECTORS.additionalInfo);
    if (additionalElement) {
      productInfo.additionalInfo = additionalElement.textContent.trim();
    }

    // Combine all text for analysis
    productInfo.allText = `${productInfo.title} ${productInfo.features} ${productInfo.details} ${productInfo.additionalInfo}`;

    return productInfo;
  }

  /**
   * Find the best location to insert the Indian badge
   */
  function findBadgeLocation() {
    // Try to find title area first
    const titleElement = document.querySelector(AMAZON_SELECTORS.productTitle);
    if (titleElement && titleElement.parentElement) {
      return titleElement.parentElement;
    }

    // Fallback to breadcrumb area
    const breadcrumbElement = document.querySelector(AMAZON_SELECTORS.breadcrumb);
    if (breadcrumbElement) {
      return breadcrumbElement;
    }

    // Last resort - body
    return document.body;
  }

  /**
   * Insert floating badge into the page
   */
  function insertFloatingBadge(isMadeInIndia, result = null) {
    // Remove any existing badge first
    const existingBadge = document.querySelector('.meraproduct-floating-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    const confidence = result ? result.confidence : 0;
    const badge = detector.createFloatingBadge(isMadeInIndia, confidence);
    
    // Insert at the end of body for fixed positioning
    document.body.appendChild(badge);
    
    // Show notification
    if (isMadeInIndia) {
      detector.showNotification(
        `🇮🇳 Made in India product detected! Confidence: ${Math.round(confidence * 100)}%`,
        'success'
      );
    } else {
      detector.showNotification(
        `⚠️ This product is NOT Made in India`,
        'info'
      );
    }
  }

  /**
   * Insert Indian badge into the page (legacy wrapper)
   */
  function insertIndianBadge(result) {
    insertFloatingBadge(true, result);
  }

  /**
   * Process the Amazon product page
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
        detector.logDetection(result, 'amazon', window.location.href);

        // Send message to background script
        chrome.runtime.sendMessage({
          type: 'INDIAN_PRODUCT_DETECTED',
          site: 'amazon',
          url: window.location.href,
          title: productInfo.title,
          manufacturer: manufacturer,
          confidence: result.confidence,
          indicator: result.indicator
        });
      } else {
        // Show "NOT MADE IN INDIA" badge for non-Indian products
        console.log('[MeraProduct] Product is not Made in India - showing red badge.');
        insertFloatingBadge(false, result);
        hasProcessed = true;
      }

    } catch (error) {
      console.error('[MeraProduct] Error processing Amazon page:', error);
      chrome.runtime.sendMessage({
        type: 'ERROR',
        error: error.message,
        site: 'amazon',
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
                  node.querySelector(AMAZON_SELECTORS.productTitle) ||
                  node.querySelector(AMAZON_SELECTORS.featureBullets) ||
                  node.querySelector(AMAZON_SELECTORS.productDetails)
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
    console.log('[MeraProduct] Amazon content script loaded');

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