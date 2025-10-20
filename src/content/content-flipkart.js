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
   * Process the Flipkart product page using a more robust, multi-step approach.
   * Uses MutationObserver to handle dynamically loaded content.
   */
  async function processPage() {
    if (hasProcessed) return;
    console.log('[MeraProduct] Starting page process for Flipkart...');

    try {
      // First, check if the Specifications section is already loaded (generic check)
      let readMoreButton = Array.from(document.querySelectorAll('button'))
                                .find(btn => btn.textContent.trim() === 'Read More');
      
      if (readMoreButton) {
        console.log('[MeraProduct] Specifications section already loaded. Processing...');
        await performManufacturingInfoClick();
      } else {
        console.log('[MeraProduct] Specifications section not yet loaded. Setting up MutationObserver...');
        
        // Set up observer to watch for the Specifications section to load
        const observer = new MutationObserver(async (mutations, obs) => {
          // Check if Read More button has appeared (generic check)
          const readMore = Array.from(document.querySelectorAll('button'))
                               .find(btn => btn.textContent.trim() === 'Read More');
          
          if (readMore && !hasProcessed) {
            console.log('[MeraProduct] Specifications section loaded via MutationObserver!');
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
          console.log('[MeraProduct] MutationObserver timeout reached.');
          // Try fallback method
          fallbackDetection();
        }, 10000);
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
      console.log('[MeraProduct] Found Specifications section. Looking for Read More button nearby...');
      // Look for Read More button within or near the Specifications section
      readMoreButton = Array.from(specificationsSection.querySelectorAll('button'))
                            .find(btn => btn.textContent.trim() === 'Read More');
    }
    
    // Fallback: search the entire page for any Read More button
    if (!readMoreButton) {
      console.log('[MeraProduct] Searching entire page for Read More button...');
      readMoreButton = Array.from(document.querySelectorAll('button'))
                            .find(btn => btn.textContent.trim() === 'Read More');
    }
    
    if (readMoreButton) {
      console.log('[MeraProduct] Found "Read More" button:', readMoreButton.outerHTML.substring(0, 100));
      console.log('[MeraProduct] Button parent:', readMoreButton.parentElement?.outerHTML.substring(0, 200));
      console.log('[MeraProduct] Attempting to click with multiple methods...');
      
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
        
        console.log('[MeraProduct] Click events dispatched.');
      } catch (error) {
        console.error('[MeraProduct] Error clicking button:', error);
      }
      
      // Wait for content to expand and DOM to update
      console.log('[MeraProduct] Waiting 4 seconds for content to expand...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Debug: Log all visible text containing manufacturing keywords
      const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
      const relevantElements = allElements.filter(el => {
        const text = el.textContent.toLowerCase();
        return (text.includes('manufact') || text.includes('import') || text.includes('packaging')) &&
               text.length < 200;
      });
      console.log('[MeraProduct] Found', relevantElements.length, 'elements with manufacturing/import/packaging keywords');
      relevantElements.slice(0, 10).forEach(el => {
        console.log('  - Element text:', el.textContent.trim().substring(0, 150));
        console.log('    Tag:', el.tagName, 'Classes:', el.className);
      });
    } else {
      console.log('[MeraProduct] No "Read More" button found.');
    }
    
    // Step 2: Look for "Manufacturing, Packaging and Import Info" link (generic, no hardcoded classes)
    console.log('[MeraProduct] Searching for Manufacturing info link...');
    
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
        console.log('[MeraProduct] Found link within Specifications section');
      }
    }
    
    // Fallback: search the entire page
    if (!infoLink) {
      console.log('[MeraProduct] Searching entire page...');
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
      console.log('[MeraProduct] ✓ Found manufacturing info link:', infoLink.textContent.trim());
      console.log('[MeraProduct] Link HTML:', infoLink.outerHTML.substring(0, 150));
      
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
        console.log('[MeraProduct] Manufacturing link clicked.');
      } catch (error) {
        console.error('[MeraProduct] Error clicking manufacturing link:', error);
      }

      // Step 3: Wait for the modal to appear and get its text (generic modal detection)
      console.log('[MeraProduct] Waiting for modal to appear...');
      const modalText = await waitForModalAndGetText(6000);
      
      if (modalText) {
        console.log('[MeraProduct] Modal detected. Full content:');
        console.log(modalText);
        
        // Enhanced detection logic
        const result = analyzeManufacturingInfo(modalText);
        console.log('[MeraProduct] Detection result:', result);
        
        if (result.isIndian) {
          insertIndianBadge(result);
          hasProcessed = true;
          logAndSendMessage(result, modalText);
          return;
        } else {
          console.log('[MeraProduct] Product is not Made in India.');
          // Show "NOT MADE IN INDIA" badge
          insertFloatingBadge(false, result);
          hasProcessed = true;
          return;
        }
      } else {
        console.log('[MeraProduct] Modal did not appear or could not be read.');
      }
    } else {
      console.log('[MeraProduct] Manufacturing info link not found after expanding.');
    }
    
    // If we got here, the modal method didn't work - try fallback
    fallbackDetection();
  }

  /**
   * Fallback detection method that scans all visible page text
   */
  function fallbackDetection() {
    if (hasProcessed) return;
    
    console.log('[MeraProduct] Using fallback detection method.');
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
      console.log('[MeraProduct] No Indian origin detected in fallback scan - showing NOT MADE IN INDIA badge.');
      // Show "NOT MADE IN INDIA" badge for non-Indian products
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
    console.log('[MeraProduct] Waiting for modal to appear (generic detection)...');
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
          console.log('[MeraProduct] Modal found!');
          clearInterval(interval);
          // Wait a bit for content to fully render
          setTimeout(() => {
            console.log('[MeraProduct] Extracting modal text...');
            resolve(modal.textContent);
          }, 1000);
        } else if (Date.now() - startTime > timeout) {
          console.log('[MeraProduct] Modal wait timeout reached.');
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
    console.log('[MeraProduct] ========== ANALYZING MANUFACTURING INFO ==========');
    console.log('[MeraProduct] Full modal text (first 500 chars):', text.substring(0, 500));
    
    const lowerText = text.toLowerCase();
    
    // STEP 1: Extract all relevant information with detailed logging
    console.log('[MeraProduct] --- Step 1: Extracting Information ---');
    
    // Extract Country of Origin
    const countryRegex = /country\s+of\s+origin[\s:]*([^\n]+)/i;
    const countryMatch = text.match(countryRegex);
    const countryOfOrigin = countryMatch ? countryMatch[1].trim() : null;
    console.log('[MeraProduct] Country of Origin extracted:', countryOfOrigin || 'NOT FOUND');
    
    // Extract manufacturer address
    const manufacturerAddress = extractManufacturerAddress(text);
    console.log('[MeraProduct] Manufacturer address extracted:', manufacturerAddress || 'NOT FOUND');
    
    // STEP 2: Check for explicit non-Indian countries
    console.log('[MeraProduct] --- Step 2: Checking for Non-Indian Countries ---');
    const nonIndianCountries = [
      'china', 'usa', 'united states', 'korea', 'south korea', 'japan', 'taiwan',
      'vietnam', 'thailand', 'malaysia', 'singapore', 'indonesia', 'philippines',
      'hong kong', 'germany', 'france', 'italy', 'uk', 'united kingdom', 'mexico'
    ];
    
    for (const country of nonIndianCountries) {
      if (countryOfOrigin && countryOfOrigin.toLowerCase().includes(country)) {
        console.log('[MeraProduct] ❌ NOT MADE IN INDIA - Country of Origin:', countryOfOrigin);
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
        if (manufacturerAddress.toLowerCase().includes(country)) {
          console.log('[MeraProduct] ❌ NOT MADE IN INDIA - Manufacturer in:', country);
          return {
            isIndian: false,
            confidence: 1.0,
            indicator: `Manufactured in ${country.charAt(0).toUpperCase() + country.slice(1)}`,
            manufacturer: manufacturerAddress
          };
        }
      }
    }
    
    // STEP 3: Check for explicit "Made in India" statements
    console.log('[MeraProduct] --- Step 3: Checking for Explicit Indian Indicators ---');
    const explicitIndicators = [
      'made in india',
      'manufactured in india',
      'मेड इन इंडिया',
      'भारत में निर्मित'
    ];
    
    for (const indicator of explicitIndicators) {
      if (lowerText.includes(indicator)) {
        console.log('[MeraProduct] ✓ Explicit indicator found:', indicator);
        return {
          isIndian: true,
          confidence: 1.0,
          indicator: indicator,
          manufacturer: manufacturerAddress
        };
      }
    }
    
    // STEP 4: Check for "Country of Origin: India"
    console.log('[MeraProduct] --- Step 4: Checking Country of Origin ---');
    const countryOfOriginRegex = /country\s+of\s+origin[\s:]*india/i;
    const hasCountryOfOrigin = countryOfOriginRegex.test(lowerText);
    console.log('[MeraProduct] Country of Origin: India?', hasCountryOfOrigin);
    
    // STEP 5: Check if manufacturer address is Indian
    console.log('[MeraProduct] --- Step 5: Checking Manufacturer Address ---');
    const hasManufacturerIndia = manufacturerAddress && isIndianAddress(manufacturerAddress);
    console.log('[MeraProduct] Manufacturer is Indian?', hasManufacturerIndia);
    
    // STEP 6: Combined scoring logic
    console.log('[MeraProduct] --- Step 6: Calculating Confidence ---');
    if (hasCountryOfOrigin && hasManufacturerIndia) {
      console.log('[MeraProduct] ✓ Country of Origin: India + Manufacturer in India (100% confidence)');
      return {
        isIndian: true,
        confidence: 1.0,
        indicator: 'Country of Origin: India + Manufacturer in India',
        manufacturer: manufacturerAddress
      };
    }
    
    if (hasCountryOfOrigin) {
      console.log('[MeraProduct] ✓ Country of Origin: India (70% confidence)');
      return {
        isIndian: true,
        confidence: 0.70,
        indicator: 'Country of Origin: India',
        manufacturer: manufacturerAddress
      };
    }
    
    if (hasManufacturerIndia && manufacturerAddress) {
      console.log('[MeraProduct] ✓ Manufacturer address is Indian (50% confidence)');
      return {
        isIndian: true,
        confidence: 0.50,
        indicator: 'Manufacturer address in India',
        manufacturer: manufacturerAddress
      };
    }
    
    // STEP 7: Generic "Origin: India" fallback
    console.log('[MeraProduct] --- Step 7: Generic Origin Check ---');
    const originRegex = /(?:origin)[\s:]+([^\n,]+)/i;
    const match = text.match(originRegex);
    if (match) {
      console.log('[MeraProduct] Origin field found:', match[1]);
      if (match[1].toLowerCase().includes('india')) {
        console.log('[MeraProduct] ✓ Origin: India (70% confidence)');
        return {
          isIndian: true,
          confidence: 0.70,
          indicator: 'Origin: India',
          manufacturer: manufacturerAddress
        };
      }
    }
    
    // STEP 8: Fallback to the generic detector
    console.log('[MeraProduct] --- Step 8: Using Fallback Generic Detector ---');
    const result = detector.detectFromText(text);
    console.log('[MeraProduct] Generic detector result:', result);
    
    // If no Indian indicators found, explicitly mark as NOT Indian
    if (!result.isIndian) {
      console.log('[MeraProduct] ❌ NO INDIAN INDICATORS FOUND - Product is NOT Made in India');
      return {
        isIndian: false,
        confidence: 0.8,
        indicator: 'No Indian origin indicators found',
        manufacturer: manufacturerAddress
      };
    }
    
    console.log('[MeraProduct] ========== ANALYSIS COMPLETE ==========');
    return result;
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
        console.log('[MeraProduct] ✓ Indian PIN code detected:', pinCodeMatch[0]);
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
        console.log('[MeraProduct] ✓ Indian industrial area detected:', area);
        return true;
      }
    }
    
    // Check 4: Major Indian cities (partial list of common manufacturing hubs)
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
        console.log('[MeraProduct] ✓ Indian city detected:', city);
        return true;
      }
    }
    
    // Check 5: Indian states (abbreviated or full names)
    const indianStates = [
      'maharashtra', 'tamil nadu', 'karnataka', 'kerala', 'gujarat', 'rajasthan',
      'west bengal', 'madhya pradesh', 'uttar pradesh', 'bihar', 'andhra pradesh',
      'telangana', 'punjab', 'haryana', 'jharkhand', 'odisha', 'uttarakhand',
      'himachal pradesh', 'assam', 'chhattisgarh', 'goa', 'jammu', 'kashmir'
    ];
    
    for (const state of indianStates) {
      if (lowerAddress.includes(state)) {
        console.log('[MeraProduct] ✓ Indian state detected:', state);
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
    console.log('[MeraProduct] Flipkart content script loaded');
    console.log('[MeraProduct] Waiting 10 seconds for page to fully load...');

    // Wait 10 seconds before starting the detection process
    setTimeout(() => {
      console.log('[MeraProduct] Starting detection process after 10 second delay.');
      
      // Process immediately if page is already loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processPage);
      } else {
        processPage();
      }

      // Set up observer for dynamic content
      setupObserver();
    }, 2000); // 10 second delay

    // Handle navigation in single-page apps
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        hasProcessed = false;
        console.log('[MeraProduct] URL changed. Waiting 10 seconds before processing...');
        setTimeout(processPage, 10000);
      }
    }, 1000);
  }

  // Start the extension
  initialize();

})();