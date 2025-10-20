/**
 * MeraProduct Content Script - Flipkart
 * Detects Made in India products on Flipkart pages
 * 
 * Debug Mode: To enable detailed logs, run in console:
 * Logger.enableDebug()
 */

(function() {
  'use strict';

  const log = new Logger('Flipkart');
  const detector = new OriginDetector();
  const storage = new ProductStorage();
  let hasProcessed = false;

  // Show simple info message
  log.info('MeraProduct loaded' + (log.debugMode ? ' (Debug Mode ON)' : ''));
  
  // If not in debug mode, show how to enable it
  if (!log.debugMode) {
    console.log('%c[MeraProduct] 💡 Tip: Enable debug mode in extension settings (click extension icon → ⚙️ → Debug Mode)', 
                'color: #888; font-style: italic;');
  }

  // Listen for debug mode changes from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateDebugMode') {
      if (message.debugMode) {
        Logger.enableDebug();
        console.log('%c[MeraProduct] ✅ Debug Mode ENABLED from extension settings', 'color: #22c55e; font-weight: bold;');
      } else {
        Logger.disableDebug();
        console.log('%c[MeraProduct] ⚠️ Debug Mode DISABLED from extension settings', 'color: #f59e0b; font-weight: bold;');
      }
    }
  });

  // Flipkart-specific selectors
  const FLIPKART_SELECTORS = {
    productTitle: 'h1 span, .VU-ZEz, .B_NuCI, ._35KyD6, h1.yhB1nd',
    productImage: '._396cs4 img, ._2r_T1I img, .CXW8mj img',
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
      allText: '',
      image: ''
    };

    // Extract product title - try multiple methods
    let titleElement = document.querySelector(FLIPKART_SELECTORS.productTitle);
    
    // Fallback: try to find h1 with span inside
    if (!titleElement || !titleElement.textContent.trim()) {
      titleElement = document.querySelector('h1 span') || 
                     document.querySelector('h1') ||
                     document.evaluate('/html/body/div[1]/div/div[3]/div[1]/div[2]/div[2]/div/div[1]/h1/span', 
                                       document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    
    if (titleElement) {
      productInfo.title = titleElement.textContent.trim();
      log.verbose('Product title found:', productInfo.title.substring(0, 100));
    } else {
      log.warn('Product title not found with any selector');
    }

    // Extract product image - try multiple selectors
    let imageElement = document.querySelector(FLIPKART_SELECTORS.productImage);
    
    // Fallback selectors for product images
    if (!imageElement || !imageElement.src) {
      const fallbackSelectors = [
        '._2r_T1I img[src]',
        '._396cs4 img[src]',
        '.CXW8mj img[src]',
        '._2_AcLJ img[src]',
        'img[data-id]',
        'img[alt*="Product"]',
        'img[alt*="product"]'
      ];
      
      for (const selector of fallbackSelectors) {
        imageElement = document.querySelector(selector);
        if (imageElement && (imageElement.src || imageElement.getAttribute('data-src'))) {
          break;
        }
      }
    }
    
    if (imageElement) {
      const src = imageElement.src || imageElement.getAttribute('data-src') || '';
      // Filter out placeholder/loading images
      if (src && !src.includes('placeholder') && !src.includes('loading') && src.startsWith('http')) {
        productInfo.image = src;
        log.verbose('Product image found:', src.substring(0, 80));
      } else {
        log.verbose('Product image URL invalid or placeholder');
      }
    } else {
      log.verbose('Product image not found');
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
   * Insert floating badge into the page
   */
  async function insertFloatingBadge(isMadeInIndia, result = null) {
    // Remove any existing badge first
    const existingBadge = document.querySelector('.meraproduct-floating-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    const confidence = result ? result.confidence : 0;
    const badge = detector.createFloatingBadge(isMadeInIndia, confidence);
    
    // Insert at the end of body for fixed positioning
    document.body.appendChild(badge);
    
    // Extract product info and save to history
    const productInfo = extractProductInfo();
    
    log.debug('Product info extracted:', {
      title: productInfo.title,
      hasImage: !!productInfo.image,
      textLength: productInfo.allText.length
    });
    
    // Only save if we have a product title
    if (productInfo.title) {
      try {
        const productData = {
          name: productInfo.title,
          url: window.location.href,
          site: 'flipkart',
          isMadeInIndia: isMadeInIndia,
          confidence: Math.round(confidence), // Use confidence directly (already 0-100)
          indicator: (isMadeInIndia ? '🇮🇳 MADE IN INDIA' : '🚫 NOT MADE IN INDIA'),
          manufacturer: result?.manufacturer || '',
          image: productInfo.image || ''
        };
        
        log.debug('Saving product to history:', productData);
        await storage.saveProduct(productData);
        log.success('Product saved to history successfully!');
      } catch (error) {
        log.error('Failed to save product:', error);
      }
    } else {
      log.warn('Cannot save product - no title found');
    }
    
    // Badge already shows the detection result, no need for extra notifications
  }

  /**
   * Insert Indian badge into the page (legacy wrapper)
   */
  function insertIndianBadge(result) {
    insertFloatingBadge(true, result);
  }

  /**
   * Process the Flipkart product page using a more robust, multi-step approach.
   * Uses MutationObserver to handle dynamically loaded content.
   */
  async function processPage() {
    if (hasProcessed) return;
    log.debug('Starting page process...');

    try {
      // First, check if the Specifications section is already loaded (generic check)
      let readMoreButton = Array.from(document.querySelectorAll('button'))
                                .find(btn => btn.textContent.trim() === 'Read More');
      
      if (readMoreButton) {
        log.debug('Specifications section already loaded');
        await performManufacturingInfoClick();
      } else {
        log.debug('Waiting for Specifications section...');
        
        // Set up observer to watch for the Specifications section to load
        const observer = new MutationObserver(async (mutations, obs) => {
          // Check if Read More button has appeared (generic check)
          const readMore = Array.from(document.querySelectorAll('button'))
                               .find(btn => btn.textContent.trim() === 'Read More');
          
          if (readMore && !hasProcessed) {
            log.debug('Specifications section loaded dynamically');
            obs.disconnect(); // Stop observing once we found it
            await performManufacturingInfoClick();
          }
        });
        
        // Start observing the document for changes
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Set a timeout to disconnect the observer after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          log.debug('MutationObserver timeout reached');
          // Try fallback method
          fallbackDetection();
        }, 10000);
      }

    } catch (error) {
      log.error('Error processing page:', error);
      chrome.runtime.sendMessage({
        type: 'ERROR',
        error: error.message,
        site: 'flipkart',
        url: window.location.href
      });
    }
  }

  /**
   * Perform the click sequence to open manufacturing info modal
   */
  async function performManufacturingInfoClick() {
    if (hasProcessed) return;
    
    // Step 1: Find "Read More" button in a generic way (without relying on specific classes)
    // First, find the Specifications section
    const specificationsSection = Array.from(document.querySelectorAll('div'))
                                        .find(el => {
                                          const text = el.textContent;
                                          return text.includes('Specifications') && el.querySelector('button');
                                        });
    
    let readMoreButton = null;
    
    if (specificationsSection) {
      log.debug('Specifications section found');
      // Look for Read More button within or near the Specifications section
      readMoreButton = Array.from(specificationsSection.querySelectorAll('button'))
                            .find(btn => btn.textContent.trim() === 'Read More');
    }
    
    // Fallback: search the entire page for any Read More button
    if (!readMoreButton) {
      log.debug('Searching entire page for Read More button');
      readMoreButton = Array.from(document.querySelectorAll('button'))
                            .find(btn => btn.textContent.trim() === 'Read More');
    }
    
    if (readMoreButton) {
      log.debug('Found Read More button, clicking...');
      log.verbose('Button HTML:', readMoreButton.outerHTML.substring(0, 100));
      
      // Try multiple click methods to ensure it works
      try {
        // Method 1: MouseEvent with all mouse event types
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
          const event = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
          });
          readMoreButton.dispatchEvent(event);
        });
        
        // Method 2: Regular click
        readMoreButton.click();
        
        // Method 3: Try clicking the parent if the button itself doesn't work
        if (readMoreButton.parentElement) {
          readMoreButton.parentElement.click();
        }
        
        log.debug('Click events dispatched');
      } catch (error) {
        log.error('Error clicking button:', error);
      }
      
      // Wait for content to expand and DOM to update
      log.debug('Waiting for content to expand...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Debug: Log all visible text containing manufacturing keywords
      if (log.debugMode) {
        const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
        const relevantElements = allElements.filter(el => {
          const text = el.textContent.toLowerCase();
          return (text.includes('manufact') || text.includes('import') || text.includes('packaging')) &&
                 text.length < 200;
        });
        log.verbose(`Found ${relevantElements.length} elements with manufacturing keywords`);
        relevantElements.slice(0, 5).forEach(el => {
          log.verbose('  -', el.textContent.trim().substring(0, 100));
        });
      }
    } else {
      log.debug('No Read More button found');
    }
    
    // Step 2: Look for "Manufacturing, Packaging and Import Info" link
    log.debug('Searching for Manufacturing info link...');
    
    // First, try to find it within the specifications section for better accuracy
    let infoLink = null;
    if (specificationsSection) {
      infoLink = Array.from(specificationsSection.querySelectorAll('div, span'))
                      .find(el => {
                        const text = el.textContent.trim();
                        return (text === 'Manufacturing, Packaging and Import Info' ||
                               text === 'Manufacturing, Packaging & Import Info') &&
                               text.length < 100;
                      });
      if (infoLink) {
        log.debug('Found link within Specifications section');
      }
    }
    
    // Fallback: search the entire page
    if (!infoLink) {
      log.debug('Searching entire page for link...');
      infoLink = Array.from(document.querySelectorAll('div, span'))
                    .find(el => {
                      const text = el.textContent.trim();
                      // Must be EXACT match - not a parent container with lots of text
                      return (text === 'Manufacturing, Packaging and Import Info' ||
                             text === 'Manufacturing, Packaging & Import Info') &&
                             text.length < 100; // Ensure it's not a parent container
                    });
    }

    if (infoLink) {
      log.debug('Manufacturing link found, clicking...');
      log.verbose('Link:', infoLink.textContent.trim());
      
      // Trigger realistic click events
      try {
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
          const event = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
          });
          infoLink.dispatchEvent(event);
        });
        infoLink.click();
        log.debug('Click dispatched');
      } catch (error) {
        log.error('Error clicking link:', error);
      }

      // Step 3: Wait for the modal to appear
      log.debug('Waiting for modal...');
      const modalText = await waitForModalAndGetText(6000);
      
      if (modalText) {
        log.verbose('Modal detected, analyzing...');
        
        // Enhanced detection logic
        const result = analyzeManufacturingInfo(modalText);
        log.data('Detection result', result);
        
        if (result.isIndian) {
          insertIndianBadge(result);
          hasProcessed = true;
          logAndSendMessage(result, modalText);
          return;
        } else {
          insertFloatingBadge(false, result);
          hasProcessed = true;
          return;
        }
      } else {
        log.debug('Modal did not appear');
      }
    } else {
      log.debug('Manufacturing link not found');
    }
    
    // If we got here, the modal method didn't work - try fallback
    fallbackDetection();
  }

  /**
   * Fallback detection method that scans all visible page text
   */
  function fallbackDetection() {
    if (hasProcessed) return;
    
    log.debug('Using fallback detection method');
    const productInfo = extractProductInfo();
    
    if (!productInfo.allText.trim()) {
      log.debug('No text content found yet');
      return;
    }

    log.verbose('Page text:', productInfo.allText.substring(0, 200));
    const result = detector.detectFromText(productInfo.allText);
    log.data('Fallback result', result);
    
    if (result.isIndian && result.confidence > 0.5) {
      insertIndianBadge(result);
      hasProcessed = true;
      logAndSendMessage(result, productInfo.allText);
    } else {
      insertFloatingBadge(false, result);
      hasProcessed = true;
    }
  }

  /**
   * Waits for a modal to appear and extracts its text content (generic, no hardcoded selectors).
   * @param {number} timeout - How long to wait in milliseconds.
   * @returns {Promise<string|null>} A promise that resolves with the modal's text or null if not found.
   */
  function waitForModalAndGetText(timeout) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        // Look for modal using multiple generic strategies
        let modal = document.querySelector('[role="dialog"]') || // Standard modal role
                    document.querySelector('.modal') ||          // Common class name
                    Array.from(document.querySelectorAll('div')) // Find div with "Country of Origin" text
                         .find(el => el.textContent.includes('Country of Origin') && 
                                    el.textContent.includes('Manufacturing'));
        
        if (modal && modal.textContent.trim()) {
          log.debug('Modal found');
          clearInterval(interval);
          // Wait a bit for content to fully render
          setTimeout(() => {
            log.verbose('Extracting modal text...');
            resolve(modal.textContent);
          }, 1000);
        } else if (Date.now() - startTime > timeout) {
          log.debug('Modal timeout');
          clearInterval(interval);
          resolve(null);
        }
      }, 300);
    });
  }

  /**
   * Analyze manufacturing info text to determine if product is Made in India.
   * More robust than the generic detector.
   * 
   * Confidence Scoring:
   * - 100%: Country of Origin: India + Manufacturer in India (both present)
   * - 100%: Explicit "Made in India" or "Manufactured in India"
   * - 70%: Country of Origin: India (alone, without manufacturer info)
   * - 50%: Only Manufacturer address contains India (less certain)
   * 
   * @param {string} text - The text to analyze
   * @returns {Object} Detection result with isIndian and confidence
   */
  function analyzeManufacturingInfo(text) {
    log.group('Analyzing Manufacturing Info');
    log.verbose('Modal text (first 300 chars):', text.substring(0, 300));
    
    const lowerText = text.toLowerCase();
    
    // Extract all relevant information
    // Improved regex to capture only the country name, stopping at common delimiters
    const countryRegex = /country\s+of\s+origin[\s:]*([A-Za-z\s]+?)(?=\s*(?:Manufacturer|Importer|Packer|Details|$|[A-Z]{2,}))/i;
    const countryMatch = text.match(countryRegex);
    let countryOfOrigin = countryMatch ? countryMatch[1].trim() : null;
    
    // Fallback: if regex didn't work, try simpler pattern (just get next word(s) after "Country of Origin")
    if (!countryOfOrigin || countryOfOrigin.length > 50) {
      const simpleRegex = /country\s+of\s+origin[\s:]*([A-Za-z\s]{3,30})/i;
      const simpleMatch = text.match(simpleRegex);
      countryOfOrigin = simpleMatch ? simpleMatch[1].trim() : countryOfOrigin;
    }
    
    const manufacturerAddress = extractManufacturerAddress(text);
    
    log.debug('Extracted - Country:', countryOfOrigin || 'Not found');
    log.debug('Extracted - Manufacturer:', manufacturerAddress ? manufacturerAddress.substring(0, 100) : 'Not found');
    
    // Check for explicit non-Indian countries
    const nonIndianCountries = [
      'china', 'usa', 'united states', 'korea', 'south korea', 'japan', 'taiwan',
      'vietnam', 'thailand', 'malaysia', 'singapore', 'indonesia', 'philippines',
      'hong kong', 'germany', 'france', 'italy', 'uk', 'united kingdom', 'mexico'
    ];
    
    // Helper function to check if a country name appears as a complete word
    const containsCountry = (text, country) => {
      if (!text) return false;
      const lowerText = text.toLowerCase();
      // For multi-word countries, just use includes
      if (country.includes(' ')) {
        return lowerText.includes(country);
      }
      // For single-word countries, use word boundary regex to avoid false positives
      // e.g., "uk" in "Taluk" or "china" in "chinaware"
      
      // Special handling for UK/U.K.
      if (country === 'uk') {
        return /\bu\.?k\.?\b/i.test(text) || /\bunited kingdom\b/i.test(text);
      }
      
      const regex = new RegExp(`\\b${country}\\b`, 'i');
      return regex.test(text);
    };
    
    for (const country of nonIndianCountries) {
      if (containsCountry(countryOfOrigin, country)) {
        log.warn(`NOT Made in India - Country: ${countryOfOrigin}`);
        log.groupEnd();
        return {
          isIndian: false,
          confidence: 1.0,
          indicator: `Country of Origin: ${countryOfOrigin}`,
          manufacturer: manufacturerAddress
        };
      }
    }
    
    // Also check manufacturer address for foreign countries
    if (manufacturerAddress) {
      for (const country of nonIndianCountries) {
        if (containsCountry(manufacturerAddress, country)) {
          log.warn(`NOT Made in India - Manufacturer in ${country}`);
          log.groupEnd();
          return {
            isIndian: false,
            confidence: 1.0,
            indicator: `Manufactured in ${country.charAt(0).toUpperCase() + country.slice(1)}`,
            manufacturer: manufacturerAddress
          };
        }
      }
    }
    
    // Check for explicit "Made in India" statements
    const explicitIndicators = [
      'made in india',
      'manufactured in india',
      'मेड इन इंडिया',
      'भारत में निर्मित'
    ];
    
    for (const indicator of explicitIndicators) {
      if (lowerText.includes(indicator)) {
        log.success(`Made in India - Explicit: "${indicator}" (100%)`);
        log.groupEnd();
        return {
          isIndian: true,
          confidence: 1.0,
          indicator: indicator,
          manufacturer: manufacturerAddress
        };
      }
    }
    
    // Check for "Country of Origin: India" or "Country: India"
    const countryOfOriginRegex = /country\s+of\s+origin[\s:]*india/i;
    const countryIndiaRegex = /country[\s:]+india/i;
    const hasCountryOfOriginInText = countryOfOriginRegex.test(lowerText) || countryIndiaRegex.test(lowerText);
    
    // Also check if the extracted country name is "India"
    const hasCountryOfOriginExtracted = countryOfOrigin && countryOfOrigin.toLowerCase().trim() === 'india';
    
    const hasCountryOfOrigin = hasCountryOfOriginInText || hasCountryOfOriginExtracted;
    
    // Check if manufacturer address is Indian
    const hasManufacturerIndia = manufacturerAddress && isIndianAddress(manufacturerAddress);
    
    log.debug('Country of Origin: India (regex)?', hasCountryOfOriginInText);
    log.debug('Country of Origin: India (extracted)?', hasCountryOfOriginExtracted);
    log.debug('Manufacturer is Indian?', hasManufacturerIndia);
    
    // Combined scoring logic
    if (hasCountryOfOrigin && hasManufacturerIndia) {
      log.success('Made in India - Country + Manufacturer (100%)');
      log.groupEnd();
      return {
        isIndian: true,
        confidence: 1.0,
        indicator: 'Country of Origin: India + Manufacturer in India',
        manufacturer: manufacturerAddress
      };
    }
    
    if (hasCountryOfOrigin) {
      log.success('Made in India - Country only (70%)');
      log.groupEnd();
      return {
        isIndian: true,
        confidence: 0.70,
        indicator: 'Country of Origin: India',
        manufacturer: manufacturerAddress
      };
    }
    
    if (hasManufacturerIndia && manufacturerAddress) {
      log.success('Made in India - Manufacturer only (50%)');
      log.groupEnd();
      return {
        isIndian: true,
        confidence: 0.50,
        indicator: 'Manufacturer address in India',
        manufacturer: manufacturerAddress
      };
    }
    
    // Generic "Origin: India" fallback
    const originRegex = /(?:origin)[\s:]+([^\n,]+)/i;
    const match = text.match(originRegex);
    if (match) {
      log.debug('Origin field found:', match[1]);
      if (match[1].toLowerCase().includes('india')) {
        log.success('Made in India - Origin field (70%)');
        log.groupEnd();
        return {
          isIndian: true,
          confidence: 0.70,
          indicator: 'Origin: India',
          manufacturer: manufacturerAddress
        };
      }
    }
    
    // Fallback to the generic detector
    log.debug('Using fallback generic detector');
    log.debug('Text sample for detection:', text.substring(0, 300));
    const result = detector.detectFromText(text);
    log.debug('Generic detector result:', result);
    
    // If Indian indicators found, return result
    if (result.isIndian) {
      log.success(`Made in India - ${result.indicator} (${Math.round(result.confidence * 100)}%)`);
      log.groupEnd();
      return result;
    }
    
    // If no Indian indicators found, explicitly mark as NOT Indian
    log.warn('NOT Made in India - ' + text.substring(0, 200));
    log.groupEnd();
    return {
      isIndian: false,
      confidence: 0.8,
      indicator: 'No Indian origin indicators found',
      manufacturer: manufacturerAddress
    };
  }

  /**
   * Check if an address appears to be Indian based on PIN codes, cities, states, etc.
   * @param {string} address - The address text to check
   * @returns {boolean} True if address appears to be Indian
   */
  function isIndianAddress(address) {
    if (!address) return false;
    
    const lowerAddress = address.toLowerCase();
    
    // Check 1: Contains "India" explicitly
    if (lowerAddress.includes('india')) return true;
    
    // Check 2: Indian PIN code (6 digits, range 100000-855999)
    const pinCodeMatch = address.match(/\b[1-8]\d{5}\b/);
    if (pinCodeMatch) {
      const pinCode = parseInt(pinCodeMatch[0]);
      if (pinCode >= 100000 && pinCode <= 855999) {
        log.debug('Indian PIN code detected:', pinCodeMatch[0]);
        return true;
      }
    }
    
    // Check 3: Indian industrial areas and zones
    const indianIndustrialAreas = [
      'sipcot', 'sidco', 'midc', 'gidc', 'kasez', 'seepz', 'nepz',
      'industrial estate', 'industrial area', 'industrial complex',
      'export promotion', 'special economic zone', 'sez'
    ];
    
    for (const area of indianIndustrialAreas) {
      if (lowerAddress.includes(area)) {
        log.debug('Indian industrial area:', area);
        return true;
      }
    }
    
    // Check 4: Major Indian cities
    const indianCities = [
      'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
      'pune', 'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore',
      'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad',
      'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi',
      'noida', 'gurugram', 'gurgaon', 'hosur', 'coimbatore', 'madurai', 'kochi',
      'chandigarh', 'guwahati', 'thiruvananthapuram', 'trivandrum', 'mysore', 'mysuru',
      'aurangabad', 'dhanbad', 'amritsar', 'ranchi', 'jodhpur', 'raipur', 'kota'
    ];
    
    for (const city of indianCities) {
      if (lowerAddress.includes(city)) {
        log.debug('Indian city detected:', city);
        return true;
      }
    }
    
    // Check 5: Indian states
    const indianStates = [
      'maharashtra', 'tamil nadu', 'karnataka', 'kerala', 'gujarat', 'rajasthan',
      'west bengal', 'madhya pradesh', 'uttar pradesh', 'bihar', 'andhra pradesh',
      'telangana', 'punjab', 'haryana', 'jharkhand', 'odisha', 'uttarakhand',
      'himachal pradesh', 'assam', 'chhattisgarh', 'goa', 'jammu', 'kashmir'
    ];
    
    for (const state of indianStates) {
      if (lowerAddress.includes(state)) {
        log.debug('Indian state detected:', state);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract manufacturer address from text
   */
  function extractManufacturerAddress(text) {
    const patterns = [
      /manufacturer[^:]*:\s*([^\n]+)/i,
      /manufactured by[^:]*:\s*([^\n]+)/i,
      /address[^:]*:\s*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
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
    log.debug('Waiting for page to load...');

    // Wait 2 seconds before starting the detection process
    setTimeout(() => {
      log.debug('Starting detection process');
      
      // Process immediately if page is already loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processPage);
      } else {
        processPage();
      }

      // Set up observer for dynamic content
      setupObserver();
    }, 10000);

    // Handle navigation in single-page apps
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        hasProcessed = false;
        log.info('URL changed, reprocessing...');
        setTimeout(processPage, 5000);
      }
    }, 1000);
  }

  // Start the extension
  initialize();

})();