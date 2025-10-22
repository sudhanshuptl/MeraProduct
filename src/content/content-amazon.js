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

  // Comprehensive Indian Address Validation Function
  // Uses centralized IndianLocations config (src/config/indian-locations.js)
  function isIndianAddress(addressText) {
    const result = IndianLocations.isIndianAddress(addressText);
    
    if (result.isIndian) {
      log.debug(`📍 Found Indian address: ${result.matchType} = ${result.matchValue}`);
    }
    
    return result.isIndian;
  }

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
   * Extract value from grid layout (newer Amazon design)
   * Structure: <div class="a-fixed-left-grid product-facts-detail">
   *   Left column: <span>Label</span>
   *   Right column: <span>Value</span>
   * @param {string} labelPattern - Regex pattern to match label
   * @returns {string|null} - Extracted value or null
   */
  function extractFromGridLayout(labelPattern) {
    const gridLayouts = document.querySelectorAll('.a-fixed-left-grid.product-facts-detail');
    
    for (const grid of gridLayouts) {
      const leftCol = grid.querySelector('.a-col-left');
      const rightCol = grid.querySelector('.a-col-right');
      
      if (leftCol && rightCol) {
        const label = leftCol.textContent.trim();
        if (labelPattern.test(label)) {
          const value = rightCol.textContent.trim();
          if (value && value.length > 0) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extract "Country of Origin" directly from Amazon page
   * Searches for the specific "Country of Origin" field without requiring clicks
   */
  function extractCountryOfOrigin() {
    log.group('🌍 Country of Origin Detection');
    log.debug('Starting extraction process...');
    
    // Method 0: Check for grid layout first (newer Amazon design)
    const gridValue = extractFromGridLayout(/country\s+of\s+origin/i);
    if (gridValue && gridValue.length < 50) {
      log.debug(`✅ EXTRACTED Country of Origin: "${gridValue}"`);
      log.debug('Extraction method', 'Grid layout (a-fixed-left-grid)');
      log.groupEnd();
      return gridValue;
    }
    
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
            log.debug(`✅ EXTRACTED Country of Origin: "${country}"`);
            log.debug('Extraction method', `Inline text (${pattern.name})`);
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
                  log.debug(`✅ EXTRACTED Country of Origin: "${value}"`);
                  log.debug('Extraction method', 'Next table cell (TH/TD sibling)');
                  log.debug('Parent row structure', `${allCells.length} cells found`);
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
                log.debug(`✅ EXTRACTED Country of Origin: "${siblingText}"`);
                log.debug('Extraction method', `Next sibling ${nextSibling.tagName} element`);
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
              log.debug(`✅ EXTRACTED Country of Origin: "${value}"`);
              log.debug('Extraction method', 'Table cell (TD element)');
              log.debug('Table structure', `${cells.length} cells found`);
              log.groupEnd();
              return value;
            }
            
            // If no td, try th elements
            const headerCells = element.querySelectorAll('th');
            if (headerCells.length >= 2) {
              const value = headerCells[1].textContent.trim();
              // Exclude if it's another label
              if (value && !/manufacturer|importer|packer/i.test(value)) {
                log.debug(`✅ EXTRACTED Country of Origin: "${value}"`);
                log.debug('Extraction method', 'Table header cell (TH element)');
                log.debug('Table structure', `${headerCells.length} header cells found`);
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
              log.debug(`✅ EXTRACTED Country of Origin: "${siblingText}"`);
              log.debug('Extraction method', 'Next sibling element');
              log.groupEnd();
              return siblingText;
            }
          }
          
          // Check child elements with class containing "value"
          const valueElement = element.querySelector('[class*="value"], [class*="Value"]');
          if (valueElement) {
            const value = valueElement.textContent.trim();
            log.debug(`✅ EXTRACTED Country of Origin: "${value}"`);
            log.debug('Extraction method', 'Child element with "value" class');
            log.groupEnd();
            return value;
          }
        }
      }
    }
    
    log.debug('⚠️ Country of Origin NOT FOUND in product details');
    log.debug('Will fall back to text analysis method');
    log.groupEnd();
    return null;
  }

  /**
   * Extract "Manufacturer" directly from Amazon page
   * Similar to Country of Origin extraction but for manufacturer info
   * NOTE: Amazon may have MULTIPLE manufacturer rows - we want the longest/most complete one!
   * Supports both table layouts and grid layouts (a-fixed-left-grid)
   */
  function extractManufacturerInfo() {
    log.group('🏭 Manufacturer Detection');
    log.debug('Starting manufacturer extraction...');
    
    // Store ALL found manufacturers and pick the longest one
    let allManufacturers = [];
    
    // Method 0: Check for grid layout first (newer Amazon design)
    const gridValue = extractFromGridLayout(/^manufacturer$/i);
    if (gridValue && gridValue.length > 3 && gridValue.length < 500) {
      allManufacturers.push({ value: gridValue, length: gridValue.length, method: 'Grid layout (a-fixed-left-grid)' });
      log.verbose(`     Found manufacturer in grid layout: ${gridValue.length} chars`);
    }
    
    // Method 1: Table-based extraction (original method)
    const manufacturerPatterns = [
      // Pattern 1: Table header (th) with "Manufacturer" label - trim() before matching!
      { selector: 'th', labelPattern: /^manufacturer$/i, name: 'Table Header (TH)' },
      // Pattern 2: Table rows with "Manufacturer" label
      { selector: 'tr', labelPattern: /manufacturer/i, name: 'Table Row' },
      // Pattern 3: Divs or spans with manufacturer info
      { selector: 'div, span', labelPattern: /manufacturer[:\s]/i, name: 'Div/Span Element' }
    ];
    
    log.debug(`Searching ${manufacturerPatterns.length} pattern types...`);
    
    // Method 1: Table-based extraction (original method)
    
    for (const pattern of manufacturerPatterns) {
      const elements = document.querySelectorAll(pattern.selector);
      log.verbose(`  Checking ${elements.length} ${pattern.name}(s)...`);
      
      for (const element of elements) {
        const text = element.textContent.trim(); // TRIM is crucial here!
        
        // For pattern 1, check exact match (case insensitive, already trimmed)
        // For others, use the pattern as-is
        const isMatch = pattern.labelPattern.test(text.toLowerCase());
        
        if (isMatch) {
          log.debug(`  ✓ Found match in ${pattern.name}`);
          log.verbose(`     Raw text: "${text.substring(0, 150)}"`);
          
          // Try to extract manufacturer from same element
          const matches = text.match(/manufacturer[:\s]+(.+)/i);
          if (matches && matches[1] && matches[1].trim().length > 3) {
            const manufacturer = matches[1].trim();
            allManufacturers.push({ value: manufacturer, length: manufacturer.length, method: `Inline text (${pattern.name})` });
          }
          
          // For TH elements
          if (element.tagName === 'TH') {
            const parentRow = element.parentElement;
            if (parentRow) {
              const allCells = parentRow.querySelectorAll('th, td');
              const currentIndex = Array.from(allCells).indexOf(element);
              
              if (currentIndex !== -1 && currentIndex + 1 < allCells.length) {
                const nextCell = allCells[currentIndex + 1];
                
                // Try ALL extraction methods
                const textContent = nextCell.textContent ? nextCell.textContent.trim() : '';
                const innerText = nextCell.innerText ? nextCell.innerText.trim() : '';
                const innerHTML = nextCell.innerHTML.trim();
                
                log.verbose(`     Cell content lengths - textContent: ${textContent.length}, innerText: ${innerText.length}, innerHTML: ${innerHTML.length}`);
                
                // Try to extract from innerHTML if textContent/innerText fail
                let value = '';
                
                // Method 1: Use longest of textContent/innerText
                if (innerText.length > 0 || textContent.length > 0) {
                  value = innerText.length > textContent.length ? innerText : textContent;
                }
                
                // Method 2: If both are short/empty, parse innerHTML to strip tags
                if (value.length < 10 && innerHTML.length > 10) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = innerHTML;
                  value = tempDiv.textContent.trim();
                }
                
                // Add to candidates if valid (but don't return yet - we want to find ALL manufacturers first)
                if (value && value.length > 3 && value.length < 500) {
                  allManufacturers.push({ value: value, length: value.length, method: 'Next table cell (TH/TD sibling)' });
                  log.verbose(`     Added manufacturer candidate: ${value.length} chars`);
                }
              }
            }
            
            const nextSibling = element.nextElementSibling;
            if (nextSibling && (nextSibling.tagName === 'TH' || nextSibling.tagName === 'TD')) {
              const textContent = nextSibling.textContent ? nextSibling.textContent.trim() : '';
              const innerText = nextSibling.innerText ? nextSibling.innerText.trim() : '';
              const innerHTML = nextSibling.innerHTML.trim();
              
              let siblingText = '';
              
              if (innerText.length > 0 || textContent.length > 0) {
                siblingText = innerText.length > textContent.length ? innerText : textContent;
              }
              
              if (siblingText.length < 10 && innerHTML.length > 10) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = innerHTML;
                siblingText = tempDiv.textContent.trim();
              }
              
              if (siblingText && siblingText.length > 3 && siblingText.length < 500) {
                allManufacturers.push({ value: siblingText, length: siblingText.length, method: `Next sibling ${nextSibling.tagName} element` });
              }
            }
          }
        }
      }
    }
    
    // Now pick the LONGEST manufacturer text (most likely to have full address)
    if (allManufacturers.length > 0) {
      log.debug(`Found ${allManufacturers.length} manufacturer candidate(s)`);
      
      // Sort by length descending and pick the longest
      allManufacturers.sort((a, b) => b.length - a.length);
      const longest = allManufacturers[0];
      
      log.debug(`Selected longest manufacturer: ${longest.length} chars`);
      log.debug(`✅ EXTRACTED Manufacturer: "${longest.value.substring(0, 150)}${longest.value.length > 150 ? '...' : ''}"`);
      log.debug('Extraction method', longest.method);
      log.debug('Full manufacturer text length', `${longest.length} characters`);
      log.groupEnd();
      return longest.value;
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
      log.debug('Product Title', productInfo.title.substring(0, 80) + (productInfo.title.length > 80 ? '...' : ''));
    } else {
      log.debug('Product title not found');
    }

    // Extract product image
    const imageElement = document.querySelector(AMAZON_SELECTORS.productImage);
    if (imageElement) {
      productInfo.image = imageElement.src || imageElement.getAttribute('data-old-hires') || '';
      log.debug('Product Image', productInfo.image ? '✓ Found' : '✗ Not found');
    }

    // Extract feature bullets
    const featuresElement = document.querySelector(AMAZON_SELECTORS.featureBullets);
    if (featuresElement) {
      productInfo.features = featuresElement.textContent.trim();
      log.debug('Features/Bullets', `${productInfo.features.length} characters`);
    }

    // Extract product details
    const detailsElement = document.querySelector(AMAZON_SELECTORS.productDetails);
    if (detailsElement) {
      productInfo.details = detailsElement.textContent.trim();
      log.debug('Product Details', `${productInfo.details.length} characters`);
    }

    // Extract additional information
    const additionalElement = document.querySelector(AMAZON_SELECTORS.additionalInfo);
    if (additionalElement) {
      productInfo.additionalInfo = additionalElement.textContent.trim();
      log.debug('Additional Info', `${productInfo.additionalInfo.length} characters`);
    }

    log.groupEnd();

    // Extract Country of Origin directly (this creates its own log group)
    const countryOfOrigin = extractCountryOfOrigin();
    if (countryOfOrigin) {
      productInfo.countryOfOrigin = countryOfOrigin;
      log.debug(`✅ Country of Origin stored: "${countryOfOrigin}"`);
    }

    // Extract Manufacturer directly (this creates its own log group)
    const manufacturer = extractManufacturerInfo();
    if (manufacturer) {
      productInfo.manufacturer = manufacturer;
      log.debug(`✅ Manufacturer stored: "${manufacturer.substring(0, 100)}${manufacturer.length > 100 ? '...' : ''}"`);
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

    log.debug('Total text for analysis', `${productInfo.allText.length} characters`);

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
      log.debug(`URL: ${window.location.href}`);
      
      const productInfo = extractProductInfo();
      
      if (!productInfo.allText.trim()) {
        log.debug('No product text found yet, page may still be loading');
        log.groupEnd();
        // Page might still be loading, try again later
        setTimeout(processPage, 2000);
        return;
      }

      log.debug('Product information extracted successfully');
      log.group('🔍 Origin Detection Analysis');

      // New Confidence Scoring System
      let result;
      let hasCountryOrigin = false;
      let hasManufacturerIndia = false;
      let confidence = 0;
      let indicators = [];
      
      // Check Country of Origin
      if (productInfo.countryOfOrigin) {
        const countryLower = productInfo.countryOfOrigin.toLowerCase().trim();
        
        if (countryLower === 'india' || countryLower.includes('india')) {
          hasCountryOrigin = true;
          confidence += 0.60; // 60% for Country of Origin = India
          indicators.push('Country of Origin: India');
          log.debug('✅ Country of Origin: India (+60%)');
        } else {
          // Confirmed NOT from India
          log.debug(`🚫 Country of Origin: ${productInfo.countryOfOrigin} (NOT India)`);
          result = {
            isIndian: false,
            confidence: 1.0,
            indicator: `Country of Origin: ${productInfo.countryOfOrigin}`,
            method: 'Explicit Country of Origin'
          };
          log.groupEnd();
          // Skip manufacturer check if confirmed not from India
          hasCountryOrigin = false;
        }
      }
      
      // Check Manufacturer Address (only if not already confirmed NOT India)
      if (result === undefined && productInfo.manufacturer) {
        // Check if manufacturer address is Indian using comprehensive validation
        const isIndianManufacturer = isIndianAddress(productInfo.manufacturer);
        
        if (isIndianManufacturer) {
          hasManufacturerIndia = true;
          confidence += 0.50; // 50% for Indian manufacturer
          indicators.push('Manufacturer in India');
          log.debug('✅ Manufacturer Address: India (+50%)');
        } else {
          log.debug('⚠️ Manufacturer address does not appear to be Indian');
        }
      }
      
      // Calculate final result
      if (result === undefined) {
        if (hasCountryOrigin || hasManufacturerIndia) {
          // At least one indicator found
          result = {
            isIndian: true,
            confidence: Math.min(confidence, 1.0), // Cap at 100%
            indicator: indicators.join(' + '),
            method: indicators.length === 2 ? 'Country + Manufacturer' : 
                    hasCountryOrigin ? 'Country of Origin' : 'Manufacturer Address'
          };
          
          log.debug('═══════════════════════════════════════');
          log.success('🇮🇳 RESULT: MADE IN INDIA ✅');
          log.debug('═══════════════════════════════════════');
          log.debug('Confidence', `${Math.round(confidence * 100)}%`);
          log.debug('Based on', result.indicator);
          log.debug('Detection Method', result.method);
        } else {
          // No explicit indicators found, fallback to text analysis
          log.debug('No explicit Country of Origin or Manufacturer found');
          log.debug('Falling back to text pattern analysis...');
          result = detector.detectFromText(productInfo.allText);
          result.method = 'Text Pattern Analysis';
          log.debug('Analysis Result', result.isIndian ? '🇮🇳 Made in India' : '🚫 Not Made in India');
          log.debug('Confidence', `${Math.round(result.confidence * 100)}%`);
          log.debug('Indicator', result.indicator);
        }
      }
      
      log.groupEnd(); // End Origin Detection Analysis

      // Extract and log manufacturer information
      if (result.isIndian || productInfo.countryOfOrigin) {
        log.group('🏭 Manufacturer Information');
        // Use explicitly extracted manufacturer if available
        const manufacturer = productInfo.manufacturer || detector.extractManufacturer(productInfo.allText);
        if (manufacturer) {
          log.debug(`✅ MANUFACTURER FOUND: "${manufacturer.substring(0, 100)}${manufacturer.length > 100 ? '...' : ''}"`);
          log.verbose(productInfo.manufacturer ? 
            'Extracted from product details table' : 
            'Extracted from product text analysis');
        } else {
          log.debug('Manufacturer information not available');
        }
        log.groupEnd();
      }
      
      if (result.isIndian && result.confidence > 0.5) {
        log.debug('═══════════════════════════════════════');
        log.info('  🇮🇳 DISPLAYING INDIAN BADGE');
        log.debug('═══════════════════════════════════════');
        
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
        
        log.info('Product saved to history');
      } else {
        // Show "NOT MADE IN INDIA" badge for non-Indian products
        log.debug('═══════════════════════════════════════');
        log.info('  🚫 DISPLAYING NON-INDIAN BADGE');
        log.debug('═══════════════════════════════════════');
        log.debug('Reason', result.indicator || 'Country of Origin is not India');
        
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
   * Wait for product details to be fully loaded
   * Search for manufacturer info in ALL possible locations on Amazon
   * Locations checked:
   * 1. All tables on page (product details tables)
   * 2. "Product details" section (under <h2>Product details</h2>)
   * 3. "Additional Information" section
   */
  function waitForProductDetails() {
    return new Promise((resolve) => {
      log.debug('⏳ Waiting for product details to load...');
      
      let attempts = 0;
      const maxAttempts = 10; // Wait up to 5 seconds (10 × 500ms) - reduced since we already waited 10s
      let foundAnyManufacturer = false;
      let longestManufacturer = 0;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        let foundFullManufacturer = false;
        let currentLongest = 0;
        let searchedSections = [];
        
        // Method 1: Search ALL tables on the page
        const allTables = document.querySelectorAll('table');
        searchedSections.push(`${allTables.length} tables`);
        
        for (const table of allTables) {
          const allTHs = table.querySelectorAll('th');
          
          for (const th of allTHs) {
            const thText = th.textContent.trim().toLowerCase();
            
            if (thText === 'manufacturer') {
              foundAnyManufacturer = true;
              
              const parentRow = th.parentElement;
              if (parentRow) {
                const cells = parentRow.querySelectorAll('th, td');
                const thIndex = Array.from(cells).indexOf(th);
                const tdCell = cells[thIndex + 1];
                
                if (tdCell) {
                  const manufacturerText = tdCell.textContent.trim();
                  const textLength = manufacturerText.length;
                  
                  if (textLength > currentLongest) {
                    currentLongest = textLength;
                  }
                  
                  log.verbose(`Found manufacturer in table "${table.id}": ${textLength} chars`);
                  
                  if (textLength > 100 && /registered|office|pvt|ltd|india/i.test(manufacturerText)) {
                    foundFullManufacturer = true;
                    log.debug(`✅ Full manufacturer in table "${table.id}" (${textLength} chars)`);
                    break;
                  }
                }
              }
            }
          }
          
          if (foundFullManufacturer) break;
        }
        
        // Method 2: Search in "Product details" section (if not found in tables)
        if (!foundFullManufacturer) {
          const productDetailsHeadings = Array.from(document.querySelectorAll('h2')).filter(
            h => /product\s+details/i.test(h.textContent)
          );
          
          searchedSections.push(`${productDetailsHeadings.length} "Product details" sections`);
          
          for (const heading of productDetailsHeadings) {
            // Find tables after this heading
            let nextElement = heading.nextElementSibling;
            while (nextElement && !foundFullManufacturer) {
              if (nextElement.tagName === 'H2' || nextElement.tagName === 'H1') {
                break; // Stop at next heading
              }
              
              // Check if this element or its children contain tables
              const tables = nextElement.tagName === 'TABLE' ? 
                [nextElement] : 
                nextElement.querySelectorAll('table');
              
              for (const table of tables) {
                const allTHs = table.querySelectorAll('th');
                
                for (const th of allTHs) {
                  const thText = th.textContent.trim().toLowerCase();
                  
                  if (thText === 'manufacturer') {
                    foundAnyManufacturer = true;
                    
                    const parentRow = th.parentElement;
                    if (parentRow) {
                      const cells = parentRow.querySelectorAll('th, td');
                      const thIndex = Array.from(cells).indexOf(th);
                      const tdCell = cells[thIndex + 1];
                      
                      if (tdCell) {
                        const manufacturerText = tdCell.textContent.trim();
                        const textLength = manufacturerText.length;
                        
                        if (textLength > currentLongest) {
                          currentLongest = textLength;
                        }
                        
                        log.verbose(`Found manufacturer in "Product details" section: ${textLength} chars`);
                        
                        if (textLength > 100 && /registered|office|pvt|ltd|india/i.test(manufacturerText)) {
                          foundFullManufacturer = true;
                          log.debug(`✅ Full manufacturer in "Product details" section (${textLength} chars)`);
                          break;
                        }
                      }
                    }
                  }
                }
                
                if (foundFullManufacturer) break;
              }
              
              nextElement = nextElement.nextElementSibling;
            }
            
            if (foundFullManufacturer) break;
          }
        }
        
        log.verbose(`Attempt ${attempts}: Searched ${searchedSections.join(', ')}`);
        
        // Update longest found
        if (currentLongest > longestManufacturer) {
          longestManufacturer = currentLongest;
          log.debug(`Longest manufacturer so far: ${longestManufacturer} chars`);
        }
        
        // If we found complete manufacturer info, we're done
        if (foundFullManufacturer) {
          clearInterval(checkInterval);
          log.debug(`Complete manufacturer info loaded after ${(attempts * 0.5).toFixed(1)} seconds`);
          resolve();
          return;
        }
        
        // After 5 attempts (2.5 seconds), if we found ANY manufacturer, proceed
        if (attempts >= 5 && foundAnyManufacturer) {
          clearInterval(checkInterval);
          log.debug(`Proceeding after ${(attempts * 0.5).toFixed(1)} seconds with manufacturer data found (${longestManufacturer} chars)`);
          resolve();
          return;
        }
        
        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (foundAnyManufacturer) {
            log.debug(`Timeout after ${(attempts * 0.5).toFixed(1)} seconds, but found manufacturer data (${longestManufacturer} chars)`);
          } else {
            log.debug('No manufacturer data found on page, will rely on Country of Origin only');
          }
          resolve();
        }
      }, 500); // Check every 500ms
    });
  }

  /**
   * Initialize the content script
   */
  async function initialize() {
    log.debug('Amazon content script loaded');
    
    // Wait for product details to be fully loaded
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
      log.debug('DOMContentLoaded fired');
    }
    
    // Wait 10 seconds for page to stabilize
    log.debug('Waiting 10 seconds for page to load completely...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Then wait for product details table to have full content
    await waitForProductDetails();
    
    // Now process the page
    log.debug('Starting processing with fully loaded content...');
    processPage();

    // Set up observer for dynamic content
    setupObserver();

    // Handle navigation in single-page apps
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        hasProcessed = false;
        console.log('[MeraProduct] URL changed - reprocessing...');
        waitForProductDetails().then(processPage);
      }
    }, 1000);
  }

  // Start the extension
  initialize();

})();