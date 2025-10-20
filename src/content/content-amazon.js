/**
 * MeraProduct Content Script - Amazon
 * Detects Made in India products on Amazon pages
 */

(function() {
  'use strict';

  const log = new Logger('Amazon');
  const detector = new OriginDetector();
  const storage = new ProductStorage();
  let hasProcessed = false;

  // Show simple info message
  log.info('MeraProduct loaded' + (log.debugMode ? ' (Debug Mode ON)' : ''));
  
  // If not in debug mode, show how to enable it
  if (!log.debugMode) {
    console.log('%c💡 Tip: Enable debug mode in extension settings (click extension icon → ⚙️ → Debug Mode)', 
                'color: #888; font-style: italic;');
  }

  // Listen for debug mode changes from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateDebugMode') {
      if (message.debugMode) {
        Logger.enableDebug();
        console.log('%c✅ Debug Mode ENABLED from extension settings', 'color: #22c55e; font-weight: bold;');
      } else {
        Logger.disableDebug();
        console.log('%c⚠️ Debug Mode DISABLED from extension settings', 'color: #f59e0b; font-weight: bold;');
      }
    }
  });

  // Amazon-specific selectors
  const AMAZON_SELECTORS = {
    productTitle: '#productTitle, .product-title',
    productImage: '#landingImage, #imgTagWrapperId img, .a-dynamic-image',
    featureBullets: '#feature-bullets ul, .a-unordered-list.a-vertical.a-spacing-mini',
    productDetails: '#detailBullets_feature_div, #productDetails_detailBullets_sections1',
    additionalInfo: '#productDetails_techSpec_section_1, .a-section.a-spacing-small',
    breadcrumb: '#wayfinding-breadcrumbs_feature_div',
    priceSection: '.a-price-whole, .a-price .a-offscreen',
    // Specific selectors for Country of Origin
    countryOfOrigin: [
      '#productDetails_detailBullets_sections1 tr', // Product Details table rows
      '#detailBullets_feature_div li', // Detail bullets list items
      '#productDetails_techSpec_section_1 tr', // Technical specifications table
      '.a-keyvalue', // Key-value pairs
      '#detailBulletsWrapper_feature_div li' // Detail bullets wrapper
    ]
  };

  /**
   * Extract "Country of Origin" directly from Amazon page
   * Searches for the specific "Country of Origin" field without requiring clicks
   */
  function extractCountryOfOrigin() {
    log.debug('🔍 Searching for Country of Origin...');
    
    // Method 1: Look for "Country of Origin" text followed by value
    // Common patterns on Amazon:
    // - In product details table
    // - In feature bullets
    // - In additional information section
    
    const originPatterns = [
      // Pattern 1: Table rows with "Country of Origin" label
      { selector: 'tr', labelPattern: /country\s+of\s+origin/i },
      // Pattern 2: List items with "Country of Origin"
      { selector: 'li', labelPattern: /country\s+of\s+origin/i },
      // Pattern 3: Divs with "Country of Origin"
      { selector: 'div', labelPattern: /country\s+of\s+origin/i },
      // Pattern 4: Spans with "Country of Origin"
      { selector: 'span', labelPattern: /country\s+of\s+origin/i }
    ];
    
    for (const pattern of originPatterns) {
      const elements = document.querySelectorAll(pattern.selector);
      
      for (const element of elements) {
        const text = element.textContent.trim();
        
        if (pattern.labelPattern.test(text)) {
          log.debug('✓ Found element with "Country of Origin":', text.substring(0, 100));
          
          // Try to extract the country value from the same element
          // Look for : or other separators
          const matches = text.match(/country\s+of\s+origin[:\s]*([A-Za-z\s]+)/i);
          if (matches && matches[1]) {
            const country = matches[1].trim();
            log.success(`Found Country of Origin: "${country}"`);
            return country;
          }
          
          // If not found in same element, check siblings or child elements
          if (element.tagName === 'TR') {
            // For table rows, look for td elements
            const cells = element.querySelectorAll('td');
            if (cells.length >= 2) {
              const value = cells[1].textContent.trim();
              log.success(`Found Country of Origin in table: "${value}"`);
              return value;
            }
          }
          
          // Check next sibling
          const nextSibling = element.nextElementSibling;
          if (nextSibling) {
            const siblingText = nextSibling.textContent.trim();
            if (siblingText && siblingText.length < 50) {
              log.success(`Found Country of Origin in sibling: "${siblingText}"`);
              return siblingText;
            }
          }
          
          // Check child elements with class containing "value"
          const valueElement = element.querySelector('[class*="value"], [class*="Value"]');
          if (valueElement) {
            const value = valueElement.textContent.trim();
            log.success(`Found Country of Origin in child: "${value}"`);
            return value;
          }
        }
      }
    }
    
    log.debug('⚠️ Country of Origin not found with direct selectors');
    return null;
  }

  /**
   * Extract product information from Amazon page
   */
  function extractProductInfo() {
    const productInfo = {
      title: '',
      image: '',
      features: '',
      details: '',
      additionalInfo: '',
      countryOfOrigin: '',
      allText: ''
    };

    // Extract product title
    const titleElement = document.querySelector(AMAZON_SELECTORS.productTitle);
    if (titleElement) {
      productInfo.title = titleElement.textContent.trim();
    }

    // Extract product image
    const imageElement = document.querySelector(AMAZON_SELECTORS.productImage);
    if (imageElement) {
      productInfo.image = imageElement.src || imageElement.getAttribute('data-old-hires') || '';
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

    // Extract Country of Origin directly
    const countryOfOrigin = extractCountryOfOrigin();
    if (countryOfOrigin) {
      productInfo.countryOfOrigin = countryOfOrigin;
      log.info(`✅ Country of Origin extracted: "${countryOfOrigin}"`);
    }

    // Combine all text for analysis
    productInfo.allText = `${productInfo.title} ${productInfo.features} ${productInfo.details} ${productInfo.additionalInfo}`;
    
    // If we have explicit country of origin, prepend it to make detection more accurate
    if (productInfo.countryOfOrigin) {
      productInfo.allText = `Country of Origin: ${productInfo.countryOfOrigin} ${productInfo.allText}`;
    }

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
  async function insertFloatingBadge(isMadeInIndia, result = null, productInfo = null) {
    // Remove any existing badge first
    const existingBadge = document.querySelector('.meraproduct-floating-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    const confidence = result ? result.confidence : 0;
    const badge = detector.createFloatingBadge(isMadeInIndia, confidence);
    
    // Insert at the end of body for fixed positioning
    document.body.appendChild(badge);
    
    // Save product to history
    if (productInfo && productInfo.title) {
      try {
        await storage.saveProduct({
          name: productInfo.title,
          url: window.location.href,
          site: 'amazon',
          isMadeInIndia: isMadeInIndia,
          confidence: confidence,
          indicator: isMadeInIndia ? '🇮🇳 MADE IN INDIA' : '🚫 NOT MADE IN INDIA',
          manufacturer: result ? detector.extractManufacturer(productInfo.allText) : '',
          image: productInfo.image
        });
        console.log('[MeraProduct] Product saved to history');
      } catch (error) {
        console.error('[MeraProduct] Error saving product:', error);
      }
    }
    
    // Badge already shows the detection result, no need for extra notifications
  }

  /**
   * Insert Indian badge into the page (legacy wrapper)
   */
  async function insertIndianBadge(result, productInfo) {
    await insertFloatingBadge(true, result, productInfo);
  }

  /**
   * Process the Amazon product page
   */
  async function processPage() {
    if (hasProcessed) return;

    try {
      const productInfo = extractProductInfo();
      
      if (!productInfo.allText.trim()) {
        // Page might still be loading, try again later
        setTimeout(processPage, 2000);
        return;
      }

      // Check if we have explicit Country of Origin
      let result;
      if (productInfo.countryOfOrigin) {
        log.info(`🎯 Using explicit Country of Origin: "${productInfo.countryOfOrigin}"`);
        
        // Check if it's India
        const countryLower = productInfo.countryOfOrigin.toLowerCase().trim();
        if (countryLower === 'india' || countryLower.includes('india')) {
          result = {
            isIndian: true,
            confidence: 1.0, // 100% confidence when explicitly stated
            indicator: 'Country of Origin: India (Verified)'
          };
          log.success('✅ Explicit Country of Origin: INDIA (100% confidence)');
        } else {
          result = {
            isIndian: false,
            confidence: 1.0, // 100% confidence when explicitly stated
            indicator: `Country of Origin: ${productInfo.countryOfOrigin}`
          };
          log.info(`⚠️ Explicit Country of Origin: ${productInfo.countryOfOrigin} (NOT India)`);
        }
      } else {
        // Fallback to text analysis
        log.debug('No explicit Country of Origin found, using text analysis');
        result = detector.detectFromText(productInfo.allText);
      }
      
      if (result.isIndian && result.confidence > 0.5) {
        await insertIndianBadge(result, productInfo);
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
        log.info('[MeraProduct] Product is not Made in India - showing red badge.');
        await insertFloatingBadge(false, result, productInfo);
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