/**
 * MeraProduct Content Script - Flipkart
 * Detects Made in India products on Flipkart pages
 */

(function() {
  'use strict';

  console.log('[MeraProduct] ===== FLIPKART SCRIPT INJECTED ===== URL:', window.location.href);
  
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
   * Process the Flipkart product page using a more robust, multi-step approach.
   */
  async function processPage() {
    if (hasProcessed) return;
    console.log('[MeraProduct] Starting page process for Flipkart...');

    try {
      // Step 1: Look for "Read More" button using the exact class selector
      const readMoreButton = document.querySelector('button.QqFHMw._4FgsLt, button._4FgsLt, button.QqFHMw') ||
                             Array.from(document.querySelectorAll('button'))
                                  .find(btn => btn.textContent.trim() === 'Read More');
      
      if (readMoreButton) {
        console.log('[MeraProduct] Found "Read More" button. Clicking it.');
        readMoreButton.click();
        
        // Wait for content to expand and DOM to update
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Debug: Log all visible text containing "Manufact" or "Import" or "Packaging"
        const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
        const relevantElements = allElements.filter(el => {
          const text = el.textContent.toLowerCase();
          return (text.includes('manufact') || text.includes('import') || text.includes('packaging')) &&
                 text.length < 200; // Avoid parent containers with too much text
        });
        console.log('[MeraProduct] Found', relevantElements.length, 'elements with manufacturing/import/packaging keywords');
        relevantElements.slice(0, 10).forEach(el => {
          console.log('  - Element text:', el.textContent.trim().substring(0, 150));
          console.log('    Tag:', el.tagName, 'Classes:', el.className);
        });
      } else {
        console.log('[MeraProduct] No "Read More" button found.');
      }
      
      // Step 2: Now look for "Manufacturing, Packaging and Import Info" link using exact class or text
      const infoLink = document.querySelector('div.rJ5jQ6') ||
                       Array.from(document.querySelectorAll('div'))
                            .find(el => {
                              const text = el.textContent.trim();
                              return text === 'Manufacturing, Packaging and Import Info';
                            });

      if (infoLink) {
        console.log('[MeraProduct] Found manufacturing info link:', infoLink.textContent.trim());
        infoLink.click();

        // Step 3: Wait for the modal to appear and get its text
        const modalText = await waitForModalAndGetText('._2-i-c4, .modal, [role="dialog"], ._3gRBUu, div.xe2C75, span.Ez0xjR', 6000);
        
        if (modalText) {
          console.log('[MeraProduct] Modal detected. Content preview:', modalText.substring(0, 300));
          const result = detector.detectFromText(modalText);
          console.log('[MeraProduct] Detection result:', result);
          
          if (result.isIndian && result.confidence > 0.6) {
            insertIndianBadge(result);
            hasProcessed = true;
            logAndSendMessage(result, modalText);
            return; // Stop processing
          } else {
            console.log('[MeraProduct] Modal content did not indicate Indian origin or low confidence.');
          }
        } else {
          console.log('[MeraProduct] Modal did not appear or could not be read.');
        }
      } else {
        console.log('[MeraProduct] Manufacturing info link not found after expanding.');
      }

      // Step 5: If the modal method fails or doesn't find anything, fall back to the old method.
      console.log('[MeraProduct] Modal method failed or no result. Falling back to general page scan.');
      const productInfo = extractProductInfo();
      
      if (!productInfo.allText.trim()) {
        console.log('[MeraProduct] No text content found on page yet.');
        return;
      }

      console.log('[MeraProduct] Analyzing full page text (first 500 chars):', productInfo.allText.substring(0, 500));
      const result = detector.detectFromText(productInfo.allText);
      console.log('[MeraProduct] Fallback detection result:', result);
      
      if (result.isIndian && result.confidence > 0.5) {
        insertIndianBadge(result);
        hasProcessed = true;
        logAndSendMessage(result, productInfo.allText);
      } else {
        console.log('[MeraProduct] No Indian origin detected in fallback scan.');
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
   * Waits for a modal to appear and extracts its text content.
   * @param {string} selector - The CSS selector for the modal container.
   * @param {number} timeout - How long to wait in milliseconds.
   * @returns {Promise<string|null>} A promise that resolves with the modal's text or null if not found.
   */
  function waitForModalAndGetText(selector, timeout) {
    console.log('[MeraProduct] Waiting for modal with selector:', selector);
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const modal = document.querySelector(selector);
        if (modal && modal.textContent.trim()) {
          console.log('[MeraProduct] Modal found!');
          clearInterval(interval);
          // Wait a bit for content to render inside the modal
          setTimeout(() => {
            console.log('[MeraProduct] Extracting modal text...');
            resolve(modal.textContent);
          }, 800);
        } else if (Date.now() - startTime > timeout) {
          console.log('[MeraProduct] Modal wait timeout reached.');
          clearInterval(interval);
          resolve(null); // Timeout reached
        }
      }, 300);
    });
  }

  /**
   * Logs detection and sends a message to the background script.
   * @param {object} result - The detection result from OriginDetector.
   * @param {string} textSource - The text that was analyzed.
   */
  function logAndSendMessage(result, textSource) {
    const productTitle = document.querySelector(FLIPKART_SELECTORS.productTitle)?.textContent.trim() || 'Unknown Product';
    const manufacturer = detector.extractManufacturer(textSource);
    
    detector.logDetection(result, 'flipkart', window.location.href);

    chrome.runtime.sendMessage({
      type: 'INDIAN_PRODUCT_DETECTED',
      site: 'flipkart',
      url: window.location.href,
      title: productTitle,
      manufacturer: manufacturer,
      confidence: result.confidence,
      indicator: result.indicator
    });
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