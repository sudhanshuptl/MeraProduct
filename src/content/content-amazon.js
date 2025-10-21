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
    log.group('� Country of Origin Detection');
    log.info('Starting extraction process...');
    
    // Method 1: Look for "Country of Origin" text followed by value
    // Common patterns on Amazon:
    // - In product details table
    // - In feature bullets
    // - In additional information section
    
    const originPatterns = [
      // Pattern 1: Table header (th) with "Country of Origin" label
      { selector: 'th', labelPattern: /country\s+of\s+origin/i, name: 'Table Header (TH)' },
      // Pattern 2: Table rows with "Country of Origin" label
      { selector: 'tr', labelPattern: /country\s+of\s+origin/i, name: 'Table Row' },
      // Pattern 3: List items with "Country of Origin"
      { selector: 'li', labelPattern: /country\s+of\s+origin/i, name: 'List Item' },
      // Pattern 4: Divs with "Country of Origin"
      { selector: 'div', labelPattern: /country\s+of\s+origin/i, name: 'Div Element' },
      // Pattern 5: Spans with "Country of Origin"
      { selector: 'span', labelPattern: /country\s+of\s+origin/i, name: 'Span Element' }
    ];
    
    log.debug(`Searching ${originPatterns.length} pattern types...`);
    
    for (const pattern of originPatterns) {
      const elements = document.querySelectorAll(pattern.selector);
      log.verbose(`  Checking ${elements.length} ${pattern.name}(s)...`);
      
      for (const element of elements) {
        const text = element.textContent.trim();
        
        if (pattern.labelPattern.test(text)) {
          log.debug(`  ✓ Found match in ${pattern.name}`);
          log.verbose(`     Raw text: "${text.substring(0, 150)}"`);
          
          // Try to extract the country value from the same element
          // Look for : or other separators
          const matches = text.match(/country\s+of\s+origin[:\s]*([A-Za-z\s]+)/i);
          if (matches && matches[1]) {
            const country = matches[1].trim();
            log.success(`✅ EXTRACTED Country of Origin: "${country}"`);
            log.data('Extraction method', `Inline text (${pattern.name})`);
            log.groupEnd();
            return country;
          }
          
          // If not found in same element, check siblings or child elements
          if (element.tagName === 'TH') {
            // For table headers, the value might be in the next sibling th or td
            const parentRow = element.parentElement;
            if (parentRow) {
              // Get all th and td elements in the row
              const allCells = parentRow.querySelectorAll('th, td');
              const currentIndex = Array.from(allCells).indexOf(element);
              
              // Check if there's a next cell
              if (currentIndex !== -1 && currentIndex + 1 < allCells.length) {
                const nextCell = allCells[currentIndex + 1];
                const value = nextCell.textContent.trim();
                // Exclude if it's another label (like "Manufacturer")
                if (value && value.length < 50 && !/manufacturer|importer|packer/i.test(value)) {
                  log.success(`✅ EXTRACTED Country of Origin: "${value}"`);
                  log.data('Extraction method', 'Next table cell (TH/TD sibling)');
                  log.data('Parent row structure', `${allCells.length} cells found`);
                  log.groupEnd();
                  return value;
                }
              }
            }
            
            // Also try next sibling element directly
            const nextSibling = element.nextElementSibling;
            if (nextSibling && (nextSibling.tagName === 'TH' || nextSibling.tagName === 'TD')) {
              const siblingText = nextSibling.textContent.trim();
              if (siblingText && siblingText.length < 50 && !/manufacturer|importer|packer/i.test(siblingText)) {
                log.success(`✅ EXTRACTED Country of Origin: "${siblingText}"`);
                log.data('Extraction method', `Next sibling ${nextSibling.tagName} element`);
                log.groupEnd();
                return siblingText;
              }
            }
          }
          
          if (element.tagName === 'TR') {
            // For table rows, look for td elements first
            const cells = element.querySelectorAll('td');
            if (cells.length >= 2) {
              const value = cells[1].textContent.trim();
              log.success(`✅ EXTRACTED Country of Origin: "${value}"`);
              log.data('Extraction method', 'Table cell (TD element)');
              log.data('Table structure', `${cells.length} cells found`);
              log.groupEnd();
              return value;
            }
            
            // If no td, try th elements
            const headerCells = element.querySelectorAll('th');
            if (headerCells.length >= 2) {
              const value = headerCells[1].textContent.trim();
              // Exclude if it's another label
              if (value && !/manufacturer|importer|packer/i.test(value)) {
                log.success(`✅ EXTRACTED Country of Origin: "${value}"`);
                log.data('Extraction method', 'Table header cell (TH element)');
                log.data('Table structure', `${headerCells.length} header cells found`);
                log.groupEnd();
                return value;
              }
            }
          }
          
          // Check next sibling
          const nextSibling = element.nextElementSibling;
          if (nextSibling) {
            const siblingText = nextSibling.textContent.trim();
            if (siblingText && siblingText.length < 50) {
              log.success(`✅ EXTRACTED Country of Origin: "${siblingText}"`);
              log.data('Extraction method', 'Next sibling element');
              log.groupEnd();
              return siblingText;
            }
          }
          
          // Check child elements with class containing "value"
          const valueElement = element.querySelector('[class*="value"], [class*="Value"]');
          if (valueElement) {
            const value = valueElement.textContent.trim();
            log.success(`✅ EXTRACTED Country of Origin: "${value}"`);
            log.data('Extraction method', 'Child element with "value" class');
            log.groupEnd();
            return value;
          }
        }
      }
    }
    
    log.warn('⚠️ Country of Origin NOT FOUND on page');
    log.info('Will fall back to text analysis method');
    log.groupEnd();
    return null;
  }

  /**
   * Extract "Manufacturer" directly from Amazon page
   * Similar to Country of Origin extraction but for manufacturer info
   */
  function extractManufacturerInfo() {
    log.group('🏭 Manufacturer Detection');
    log.info('Starting manufacturer extraction...');
    
    const manufacturerPatterns = [
      // Pattern 1: Table header (th) with "Manufacturer" label
      { selector: 'th', labelPattern: /^manufacturer$/i, name: 'Table Header (TH)' },
      // Pattern 2: Table rows with "Manufacturer" label
      { selector: 'tr', labelPattern: /manufacturer/i, name: 'Table Row' },
      // Pattern 3: Divs or spans with manufacturer info
      { selector: 'div, span', labelPattern: /manufacturer[:\s]/i, name: 'Div/Span Element' }
    ];
    
    log.debug(`Searching ${manufacturerPatterns.length} pattern types...`);
    
    for (const pattern of manufacturerPatterns) {
      const elements = document.querySelectorAll(pattern.selector);
      log.verbose(`  Checking ${elements.length} ${pattern.name}(s)...`);
      
      for (const element of elements) {
        const text = element.textContent.trim();
        
        if (pattern.labelPattern.test(text)) {
          log.debug(`  ✓ Found match in ${pattern.name}`);
          log.verbose(`     Raw text: "${text.substring(0, 150)}"`);
          
          // Try to extract manufacturer from same element
          const matches = text.match(/manufacturer[:\s]+(.+)/i);
          if (matches && matches[1] && matches[1].trim().length > 3) {
            const manufacturer = matches[1].trim();
            log.success(`✅ EXTRACTED Manufacturer: "${manufacturer.substring(0, 100)}"`);
            log.data('Extraction method', `Inline text (${pattern.name})`);
            log.groupEnd();
            return manufacturer;
          }
          
          // For TH elements
          if (element.tagName === 'TH') {
            const parentRow = element.parentElement;
            if (parentRow) {
              const allCells = parentRow.querySelectorAll('th, td');
              const currentIndex = Array.from(allCells).indexOf(element);
              
              if (currentIndex !== -1 && currentIndex + 1 < allCells.length) {
                const nextCell = allCells[currentIndex + 1];
                const value = nextCell.textContent.trim();
                if (value && value.length > 3 && value.length < 200) {
                  log.success(`✅ EXTRACTED Manufacturer: "${value.substring(0, 100)}"`);
                  log.data('Extraction method', 'Next table cell (TH/TD sibling)');
                  log.groupEnd();
                  return value;
                }
              }
            }
            
            const nextSibling = element.nextElementSibling;
            if (nextSibling && (nextSibling.tagName === 'TH' || nextSibling.tagName === 'TD')) {
              const siblingText = nextSibling.textContent.trim();
              if (siblingText && siblingText.length > 3 && siblingText.length < 200) {
                log.success(`✅ EXTRACTED Manufacturer: "${siblingText.substring(0, 100)}"`);
                log.data('Extraction method', `Next sibling ${nextSibling.tagName} element`);
                log.groupEnd();
                return siblingText;
              }
            }
          }
        }
      }
    }
    
    log.debug('⚠️ Manufacturer NOT FOUND with direct extraction');
    log.groupEnd();
    return null;
  }

  /**
   * Extract product information from Amazon page
   */
  function extractProductInfo() {
    log.group('📦 Product Information Extraction');
    
    const productInfo = {
      title: '',
      image: '',
      features: '',
      details: '',
      additionalInfo: '',
      countryOfOrigin: '',
      manufacturer: '',
      allText: ''
    };

    // Extract product title
    const titleElement = document.querySelector(AMAZON_SELECTORS.productTitle);
    if (titleElement) {
      productInfo.title = titleElement.textContent.trim();
      log.data('Product Title', productInfo.title.substring(0, 80) + (productInfo.title.length > 80 ? '...' : ''));
    } else {
      log.warn('Product title not found');
    }

    // Extract product image
    const imageElement = document.querySelector(AMAZON_SELECTORS.productImage);
    if (imageElement) {
      productInfo.image = imageElement.src || imageElement.getAttribute('data-old-hires') || '';
      log.data('Product Image', productInfo.image ? '✓ Found' : '✗ Not found');
    }

    // Extract feature bullets
    const featuresElement = document.querySelector(AMAZON_SELECTORS.featureBullets);
    if (featuresElement) {
      productInfo.features = featuresElement.textContent.trim();
      log.data('Features/Bullets', `${productInfo.features.length} characters`);
    }

    // Extract product details
    const detailsElement = document.querySelector(AMAZON_SELECTORS.productDetails);
    if (detailsElement) {
      productInfo.details = detailsElement.textContent.trim();
      log.data('Product Details', `${productInfo.details.length} characters`);
    }

    // Extract additional information
    const additionalElement = document.querySelector(AMAZON_SELECTORS.additionalInfo);
    if (additionalElement) {
      productInfo.additionalInfo = additionalElement.textContent.trim();
      log.data('Additional Info', `${productInfo.additionalInfo.length} characters`);
    }

    log.groupEnd();

    // Extract Country of Origin directly (this creates its own log group)
    const countryOfOrigin = extractCountryOfOrigin();
    if (countryOfOrigin) {
      productInfo.countryOfOrigin = countryOfOrigin;
      log.info(`✅ Country of Origin stored: "${countryOfOrigin}"`);
    }

    // Extract Manufacturer directly (this creates its own log group)
    const manufacturer = extractManufacturerInfo();
    if (manufacturer) {
      productInfo.manufacturer = manufacturer;
      log.info(`✅ Manufacturer stored: "${manufacturer.substring(0, 100)}${manufacturer.length > 100 ? '...' : ''}"`);
    }

    // Combine all text for analysis
    productInfo.allText = `${productInfo.title} ${productInfo.features} ${productInfo.details} ${productInfo.additionalInfo}`;
    
    // If we have explicit country of origin, prepend it to make detection more accurate
    if (productInfo.countryOfOrigin) {
      productInfo.allText = `Country of Origin: ${productInfo.countryOfOrigin} ${productInfo.allText}`;
      log.verbose('Combined text now includes explicit Country of Origin');
    }
    
    // If we have manufacturer, add it too
    if (productInfo.manufacturer) {
      productInfo.allText = `Manufacturer: ${productInfo.manufacturer} ${productInfo.allText}`;
      log.verbose('Combined text now includes explicit Manufacturer');
    }

    log.data('Total text for analysis', `${productInfo.allText.length} characters`);

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
        // Use explicitly extracted manufacturer if available, otherwise try to extract from text
        const manufacturerInfo = productInfo.manufacturer || 
                                (result ? detector.extractManufacturer(productInfo.allText) : '');
        
        await storage.saveProduct({
          name: productInfo.title,
          url: window.location.href,
          site: 'amazon',
          isMadeInIndia: isMadeInIndia,
          confidence: confidence,
          indicator: isMadeInIndia ? '🇮🇳 MADE IN INDIA' : '🚫 NOT MADE IN INDIA',
          manufacturer: manufacturerInfo,
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
      log.group('🚀 Processing Amazon Product Page');
      log.info(`URL: ${window.location.href}`);
      
      const productInfo = extractProductInfo();
      
      if (!productInfo.allText.trim()) {
        log.warn('No product text found yet, page may still be loading');
        log.groupEnd();
        // Page might still be loading, try again later
        setTimeout(processPage, 2000);
        return;
      }

      log.info('Product information extracted successfully');
      log.group('🔍 Origin Detection Analysis');

      // Check if we have explicit Country of Origin
      let result;
      if (productInfo.countryOfOrigin) {
        log.info('═══════════════════════════════════════');
        log.info('  EXPLICIT COUNTRY OF ORIGIN FOUND!');
        log.info('═══════════════════════════════════════');
        log.data('Country', productInfo.countryOfOrigin);
        log.data('Confidence', '100% (Explicit field)');
        
        // Check if it's India
        const countryLower = productInfo.countryOfOrigin.toLowerCase().trim();
        if (countryLower === 'india' || countryLower.includes('india')) {
          result = {
            isIndian: true,
            confidence: 1.0, // 100% confidence when explicitly stated
            indicator: 'Country of Origin: India (Verified)'
          };
          log.success('🇮🇳 RESULT: MADE IN INDIA ✅');
          log.data('Detection Method', 'Explicit Country of Origin field');
        } else {
          result = {
            isIndian: false,
            confidence: 1.0, // 100% confidence when explicitly stated
            indicator: `Country of Origin: ${productInfo.countryOfOrigin}`
          };
          log.warn(`🚫 RESULT: NOT Made in India (Origin: ${productInfo.countryOfOrigin})`);
          log.data('Detection Method', 'Explicit Country of Origin field');
        }
      } else {
        // Fallback to text analysis
        log.info('No explicit Country of Origin field found');
        log.info('Using text pattern analysis...');
        result = detector.detectFromText(productInfo.allText);
        log.data('Analysis Result', result.isIndian ? '🇮🇳 Made in India' : '🚫 Not Made in India');
        log.data('Confidence', `${Math.round(result.confidence * 100)}%`);
        log.data('Indicator', result.indicator);
        log.data('Detection Method', 'Text pattern matching');
      }
      
      log.groupEnd(); // End Origin Detection Analysis

      // Extract and log manufacturer information
      if (result.isIndian || productInfo.countryOfOrigin) {
        log.group('🏭 Manufacturer Information');
        // Use explicitly extracted manufacturer if available
        const manufacturer = productInfo.manufacturer || detector.extractManufacturer(productInfo.allText);
        if (manufacturer) {
          log.success(`✅ MANUFACTURER FOUND: "${manufacturer.substring(0, 100)}${manufacturer.length > 100 ? '...' : ''}"`);
          log.verbose(productInfo.manufacturer ? 
            'Extracted from product details table' : 
            'Extracted from product text analysis');
        } else {
          log.warn('⚠️ Manufacturer information not found');
        }
        log.groupEnd();
      }
      
      if (result.isIndian && result.confidence > 0.5) {
        log.success('═══════════════════════════════════════');
        log.success('  🇮🇳 DISPLAYING INDIAN BADGE');
        log.success('═══════════════════════════════════════');
        
        await insertIndianBadge(result, productInfo);
        hasProcessed = true;

        // Use explicitly extracted manufacturer if available
        const manufacturer = productInfo.manufacturer || detector.extractManufacturer(productInfo.allText);
        
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
        
        log.success('Product saved to history');
      } else {
        // Show "NOT MADE IN INDIA" badge for non-Indian products
        log.info('═══════════════════════════════════════');
        log.info('  🚫 DISPLAYING NON-INDIAN BADGE');
        log.info('═══════════════════════════════════════');
        log.data('Reason', result.indicator || 'Country of Origin is not India');
        
        await insertFloatingBadge(false, result, productInfo);
        hasProcessed = true;
      }

      log.groupEnd(); // End Processing Amazon Product Page

    } catch (error) {
      log.error('❌ Error processing Amazon page:', error);
      log.groupEnd();
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