# MeraProduct - Developer Guide

**Version:** 1.0.0  
**Last Updated:** October 21, 2025

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Detection Logic](#detection-logic)
- [Storage System](#storage-system)
- [Debug & Logging](#debug--logging)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Architecture Overview

MeraProduct is a Chrome extension (Manifest V3) that identifies "Made in India" products on e-commerce platforms using local DOM parsing and privacy-first processing.

### Key Architectural Principles
- ✅ **Local Processing** - All analysis happens in browser
- ✅ **No External APIs** - Privacy-first approach
- ✅ **Direct DOM Extraction** - Minimal clicks required
- ✅ **Manifest V3** - Modern Chrome extension architecture

### Technical Stack
- **Manifest Version:** V3
- **Content Scripts:** Vanilla JavaScript
- **Background:** Service Worker
- **Storage:** `chrome.storage.local`
- **UI:** HTML/CSS with Chrome Extension APIs

---

## Project Structure

```
MeraProduct/
├── manifest.json              # Extension manifest (V3)
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background service worker
│   ├── content/
│   │   ├── content-amazon.js  # Amazon-specific detection
│   │   ├── content-flipkart.js# Flipkart-specific detection
│   │   └── content.css        # Injected styles
│   ├── popup/
│   │   ├── popup.html         # Extension popup UI
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styles
│   ├── options/
│   │   ├── options.html       # Settings page
│   │   ├── options.js         # Settings logic
│   │   └── options.css        # Settings styles
│   ├── utils/
│   │   ├── logger.js          # Logging utility
│   │   ├── origin-detector.js # Core detection logic
│   │   ├── storage.js         # Storage utility
│   │   └── common.js          # Shared utilities
│   └── config/
│       └── sites.json         # Site-specific selectors
├── assets/
│   └── icons/                 # Extension icons
├── _locales/                  # i18n translations
│   ├── en/messages.json
│   └── hi/messages.json
├── tests/                     # Unit tests
├── scripts/                   # Build scripts
└── docs/                      # Documentation
```

---

## Core Components

### 1. Content Scripts

**Location:** `src/content/content-{site}.js`

Each e-commerce site has a dedicated content script that:
- Extracts product information from DOM
- Detects origin using multiple methods
- Displays floating badge
- Saves to history

#### Amazon Content Script (`content-amazon.js`)

**Key Functions:**
```javascript
extractCountryOfOrigin()      // Direct extraction from product details
extractManufacturerInfo()     // Extract manufacturer from table
extractProductInfo()          // Get all product data
processPage()                 // Main processing logic
```

**Detection Flow:**
1. Extract product title, image, features, details
2. Look for explicit "Country of Origin" field (100% confidence)
3. Look for explicit "Manufacturer" field
4. Fallback to text pattern analysis if needed
5. Display badge and save to history

**Selectors:**
```javascript
const AMAZON_SELECTORS = {
  productTitle: '#productTitle, .product-title',
  productImage: '#landingImage, #imgTagWrapperId img',
  featureBullets: '#feature-bullets ul',
  productDetails: '#detailBullets_feature_div, #productDetails_detailBullets_sections1',
  additionalInfo: '#productDetails_techSpec_section_1',
  countryOfOrigin: ['tr', 'th', 'li', 'div', 'span'] // Multiple patterns
};
```

**Table Structure Handling:**
- Handles `<th>` → `<th>` sibling pattern
- Handles `<th>` → `<td>` sibling pattern
- Handles table rows with multiple cells
- Filters out label elements (e.g., "Manufacturer" when looking for value)

#### Flipkart Content Script (`content-flipkart.js`)

**Similar structure to Amazon but with:**
- Flipkart-specific selectors
- Click automation for modal dialogs
- Different table structures
- Mobile vs desktop handling

### 2. Origin Detector

**Location:** `src/utils/origin-detector.js`

Core detection engine used by all content scripts.

**Key Methods:**
```javascript
detectFromText(text)              // Main detection from text
extractManufacturer(text)         // Extract manufacturer info
createFloatingBadge(isIndian, conf) // Create badge UI
logDetection(result, site, url)   // Log detection
```

**Detection Patterns:**

**High Confidence (0.95):**
- "Made in India"
- "Manufactured in India"
- "मेड इन इंडिया"

**Very High (0.9):**
- Indian state names in text
- Indian PIN codes (100000-855999)

**Medium (0.6):**
- Generic origin indicators

**Confidence Calculation:**
```javascript
// Confidence is stored as decimal (0-1)
// Converted to percentage (0-100) by storage.js
// Example: 0.9 → 90%
```

### 3. Storage System

**Location:** `src/utils/storage.js`

Manages product history in `chrome.storage.local`.

**Key Methods:**
```javascript
saveProduct(product)    // Save to history (max 30 products)
getHistory()            // Retrieve all history
clearHistory()          // Clear all history
deleteProduct(id)       // Delete specific product
getStats()              // Get statistics
```

**Product Data Structure:**
```javascript
{
  id: 1234567890,                    // Timestamp
  timestamp: "2025-10-21T10:30:00Z", // ISO string
  name: "Product Name",
  url: "https://...",
  site: "amazon",                    // or "flipkart"
  isMadeInIndia: true,
  confidence: 90,                    // 0-100 percentage
  indicator: "Country of Origin: India (Verified)",
  manufacturer: "Company Name",
  image: "https://..."
}
```

**Important:** 
- Confidence is stored as 0-1 decimal in content scripts
- `storage.js` converts to 0-100 percentage
- Popup displays as percentage with `%` symbol

### 4. Logger Utility

**Location:** `src/utils/logger.js`

Hierarchical logging system with debug mode.

**Log Levels:**
- `verbose()` - Detailed trace information
- `debug()` - Debug information
- `info()` - General information
- `success()` - Success messages
- `warn()` - Warnings
- `error()` - Errors
- `data()` - Key-value data

**Log Groups:**
```javascript
log.group('🚀 Processing Page');
log.info('Starting...');
log.data('URL', window.location.href);
log.groupEnd();
```

**Enable Debug Mode:**
```javascript
// In browser console:
Logger.enableDebug();

// Or via extension popup:
// Click ⚙️ → Toggle "Debug Mode"
```

---

## Detection Logic

### Priority Order

1. **Explicit Country of Origin Field** (Confidence: 100%)
   - Searches for "Country of Origin" in table rows
   - Checks `<th>`, `<td>`, `<li>`, `<div>`, `<span>` elements
   - Extracts value from next sibling or table cell
   - If "India" → Made in India ✅

2. **Text Pattern Analysis** (Confidence: 50-95%)
   - Scans all product text for indicators
   - Matches explicit phrases ("Made in India")
   - Checks for Indian states and cities
   - Validates PIN codes and addresses

3. **Manufacturer Address Analysis** (Confidence: 50-70%)
   - Extracts manufacturer info
   - Checks if address contains Indian locations
   - Validates against known Indian states/cities

### Country of Origin Extraction

**Algorithm:**
```javascript
function extractCountryOfOrigin() {
  // 1. Search for "Country of Origin" text in multiple element types
  for (pattern of originPatterns) {
    for (element of document.querySelectorAll(pattern.selector)) {
      if (element.text.match(/country of origin/i)) {
        
        // 2. Try inline extraction
        if (match = element.text.match(/country of origin:\s*(\w+)/i)) {
          return match[1]; // e.g., "India"
        }
        
        // 3. Try table cell extraction (TH/TD)
        if (element.tagName === 'TH' || element.tagName === 'TR') {
          // Get next sibling cell
          nextCell = getNextCell(element);
          return nextCell.text;
        }
        
        // 4. Try sibling elements
        if (nextSibling = element.nextElementSibling) {
          return nextSibling.text;
        }
      }
    }
  }
  return null; // Fall back to text analysis
}
```

### Manufacturer Extraction

Similar algorithm but looks for "Manufacturer" label instead.

**Pattern Matching:**
- `manufacturer[\s:]+(.+)` - Inline format
- Table cell after "Manufacturer" label
- Sibling elements

---

## Debug & Logging

### Enabling Debug Mode

**Method 1: Extension Popup**
1. Click extension icon
2. Click settings (⚙️)
3. Toggle "Debug Mode" ON

**Method 2: Console**
```javascript
Logger.enableDebug();
```

**Method 3: LocalStorage**
```javascript
localStorage.setItem('meraproduct_debug', 'true');
```

### Log Output Structure

```
🚀 Processing Amazon Product Page
  URL: https://amazon.in/dp/B08R6JKY5G

📦 Product Information Extraction
  Product Title: "boAt Airdopes 141..."
  Product Image: ✓ Found
  Features/Bullets: 1245 characters
  Product Details: 3421 characters

📍 Country of Origin Detection
  Starting extraction process...
  Searching 5 pattern types...
    Checking 156 Table Header (TH)(s)...
    ✓ Found match in Table Header (TH)
       Raw text: "Country of Origin    India"
  ✅ EXTRACTED Country of Origin: "India"
  Extraction method: Next table cell (TH/TD sibling)

🏭 Manufacturer Detection
  ✅ EXTRACTED Manufacturer: "Imagine Marketing Private Limited"
  Extraction method: Next table cell (TH/TD sibling)

🔍 Origin Detection Analysis
  ═══════════════════════════════════════
    EXPLICIT COUNTRY OF ORIGIN FOUND!
  ═══════════════════════════════════════
  Country: India
  Confidence: 100% (Explicit field)
  🇮🇳 RESULT: MADE IN INDIA ✅
  Detection Method: Explicit Country of Origin field

  ═══════════════════════════════════════
    🇮🇳 DISPLAYING INDIAN BADGE
  ═══════════════════════════════════════
  Product saved to history
```

### Log Filtering

**Chrome DevTools Console:**
- Filter by `[MeraProduct]` to see extension logs only
- Use log levels to filter: `error`, `warn`, `info`, `debug`

---

## Development Workflow

### Setup

```bash
# Clone repository
git clone https://github.com/sudhanshuptl/MeraProduct.git
cd MeraProduct

# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

### Loading Extension in Chrome

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `MeraProduct` folder

### Development Tips

1. **Auto-reload:** Use extensions like "Extension Reloader" for hot reload
2. **Console logs:** Always check both content script and background console
3. **Debug mode:** Enable for detailed logs
4. **Test on real products:** Use actual Amazon/Flipkart product pages

### Making Changes

**Content Script Changes:**
1. Edit `src/content/content-amazon.js`
2. Reload extension in `chrome://extensions/`
3. Refresh product page
4. Check console for logs

**Popup Changes:**
1. Edit `src/popup/popup.js`
2. Reload extension
3. Close and reopen popup

**Background Changes:**
1. Edit `src/background/service-worker.js`
2. Reload extension
3. Check service worker console

### Common Debugging Steps

**Issue: Badge not appearing**
```javascript
// Check if content script loaded
console.log('[MeraProduct] loaded');

// Check if product info extracted
extractProductInfo(); // Should show data in console

// Check detection result
const result = detector.detectFromText(productInfo.allText);
console.log(result);
```

**Issue: Wrong confidence percentage**
```javascript
// Confidence should be 0-1 in content scripts
console.log(result.confidence); // Should be 0.9, not 90

// Storage converts to percentage
// Check storage.js line 45: Math.round(confidence * 100)
```

**Issue: Country not detected**
```javascript
// Enable debug mode and check extraction
extractCountryOfOrigin(); // Should show extraction attempts

// Check if element exists
document.querySelectorAll('th'); // Should show table headers
```

---

## Testing

### Unit Tests

**Location:** `tests/`

```bash
# Run all tests
npm test

# Run specific test
npm test origin-detector.test.js

# Watch mode
npm test -- --watch
```

**Test Files:**
- `origin-detector.test.js` - Core detection logic
- `country-detection.test.js` - Country extraction
- `storage.test.js` - Storage operations

### Manual Testing Checklist

**Amazon Testing:**
- [ ] Visit product with "Country of Origin: India"
- [ ] Visit product with "Country of Origin: China"
- [ ] Visit product without country field
- [ ] Check confidence percentages are correct (90%, not 9000%)
- [ ] Verify manufacturer extraction works
- [ ] Check badge appears and is clickable
- [ ] Verify product saved to history

**Flipkart Testing:**
- [ ] Similar checks as Amazon
- [ ] Test modal click automation
- [ ] Check mobile vs desktop layouts

**Cross-Browser Testing:**
- [ ] Chrome (primary)
- [ ] Edge (Chromium-based, should work)
- [ ] Brave (Chromium-based, should work)

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Version updated in `manifest.json`
- [ ] Debug mode disabled by default
- [ ] No console.log statements in production (use logger)
- [ ] Icons present in all sizes
- [ ] Privacy policy updated
- [ ] Permissions justified

### Building for Production

```bash
# Run production build
npm run build

# This creates:
# - Minified JavaScript
# - Optimized assets
# - Production manifest
# - ZIP file for Chrome Web Store
```

### Chrome Web Store Deployment

**Detailed guide:** See `docs/guides/CHROME_STORE_DEPLOYMENT.md`

1. **Prepare package:**
   ```bash
   npm run package
   # Creates: meraproduct-v1.0.0.zip
   ```

2. **Chrome Developer Dashboard:**
   - Go to: https://chrome.google.com/webstore/devconsole
   - Upload ZIP file
   - Fill in store listing details
   - Submit for review

3. **Review Process:**
   - Usually takes 1-3 days
   - Check for policy compliance
   - Respond to reviewer feedback if needed

### Version Management

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes
- **MINOR:** New features, backward compatible
- **PATCH:** Bug fixes

**Example:**
- `1.0.0` → Initial release
- `1.1.0` → Added Flipkart support
- `1.1.1` → Fixed confidence bug
- `2.0.0` → Changed storage format (breaking)

---

## Performance Optimization

### Best Practices

1. **Lazy Load Content Scripts**
   - Only inject on product pages
   - Use URL pattern matching in manifest

2. **Efficient DOM Queries**
   - Cache selectors
   - Use specific queries
   - Avoid repeated lookups

3. **Debounce MutationObserver**
   - Wait 1000ms before processing
   - Prevents excessive processing on dynamic content

4. **Limit History Size**
   - Max 30 products
   - Automatic cleanup

5. **Minimize Storage Operations**
   - Batch updates when possible
   - Only save on detection completion

### Memory Management

```javascript
// Good: Cache DOM queries
const titleElement = document.querySelector('#productTitle');

// Bad: Repeated queries
for (let i = 0; i < 100; i++) {
  document.querySelector('#productTitle'); // Don't do this
}
```

---

## Security Considerations

### Content Security Policy (CSP)

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Input Sanitization

```javascript
// Always use textContent, not innerHTML
const safeText = element.textContent; // ✅
const unsafeText = element.innerHTML; // ❌
```

### Permissions

Only request necessary permissions:
- `storage` - For product history
- `activeTab` - For current tab access
- `scripting` - For content script injection

**No network permissions needed!** (Privacy-first)

---

## Troubleshooting

### Common Issues

**1. Extension not loading:**
- Check manifest.json syntax
- Verify all files exist
- Check console for errors

**2. Content script not injecting:**
- Verify URL matches in manifest
- Check permissions
- Look for CSP violations

**3. Badge not showing:**
- Enable debug mode
- Check if product info extracted
- Verify detection logic runs

**4. Wrong confidence values:**
- Check confidence is 0-1 (decimal)
- Verify storage.js converts to percentage
- Don't multiply by 100 in content scripts

**5. Manufacturer not found:**
- Check table structure in DevTools
- Verify extractManufacturerInfo() runs
- Check logs for extraction attempts

---

## Contributing

### Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Comments:** JSDoc format for functions

### Pull Request Process

1. Fork repository
2. Create feature branch (`feature/my-feature`)
3. Make changes with tests
4. Run linter: `npm run lint`
5. Run tests: `npm test`
6. Submit PR with description

### Commit Messages

Follow conventional commits:
```
feat: Add Flipkart support
fix: Correct confidence calculation
docs: Update README
refactor: Simplify detection logic
test: Add unit tests for storage
```

---

## Resources

- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration:** https://developer.chrome.com/docs/extensions/mv3/intro/
- **Chrome Web Store Policies:** https://developer.chrome.com/docs/webstore/program-policies/

---

## Contact & Support

- **Repository:** https://github.com/sudhanshuptl/MeraProduct
- **Issues:** https://github.com/sudhanshuptl/MeraProduct/issues
- **Email:** [Your Email]

---

**Happy Coding! 🚀**
