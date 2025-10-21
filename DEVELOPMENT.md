# MeraProduct - Developer Documentation

**Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**For:** Developers, Contributors, Maintainers

> **Quick Links:**  
> [Architecture](#architecture) • [Setup](#setup) • [Development](#development) • [Debugging](#debugging) • [Bug Fixes](#bug-fixes-history) • [Deployment](#deployment)

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Setup & Development](#setup--development)
4. [Core Components](#core-components)
5. [Detection System](#detection-system)
6. [Debug & Logging](#debug--logging)
7. [Bug Fixes History](#bug-fixes-history)
8. [Features Implemented](#features-implemented)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Architecture Overview

MeraProduct is a **Chrome Extension (Manifest V3)** that identifies "Made in India" products on e-commerce platforms using **local DOM parsing** and **privacy-first processing**.

### Key Principles
- ✅ **Local Processing** - All analysis happens in browser (no external APIs)
- ✅ **Direct Extraction** - Parses "Country of Origin" and "Manufacturer" from product details
- ✅ **Privacy-First** - No data leaves the browser
- ✅ **Multi-Layout Support** - Handles 5+ different Amazon page layouts
- ✅ **Manifest V3** - Modern Chrome extension architecture

### Technical Stack
```
- Manifest Version: V3
- Content Scripts: Vanilla JavaScript (no frameworks)
- Background: Service Worker
- Storage: chrome.storage.local
- UI: HTML/CSS with Chrome Extension APIs
- Testing: Jest + Puppeteer
```

### Confidence Scoring System
```javascript
// New scoring system (implemented Oct 2025)
let confidence = 0;

// +60% if Country of Origin = "India"
if (countryOfOrigin === 'India') confidence += 0.60;

// +50% if Manufacturer address contains Indian location
if (isIndianAddress(manufacturer)) confidence += 0.50;

// Maximum: 100% (both indicators present)
confidence = Math.min(confidence, 1.0);
```

**Badge Colors:**
- 🟢 **Green** (≥70%): High confidence "Made in India"
- 🟡 **Yellow** (<70%): Possible Indian origin
- 🔴 **Red** (0%): Confirmed NOT from India

---

## Project Structure

```
MeraProduct/
├── manifest.json                    # Extension manifest (V3)
├── package.json                     # npm dependencies & scripts
├── .github/
│   └── copilot-instructions.md     # AI assistant guidelines
├── src/
│   ├── background/
│   │   └── service-worker.js       # Background worker
│   ├── content/
│   │   ├── content-amazon.js       # Amazon detection (978 lines)
│   │   ├── content-flipkart.js     # Flipkart detection
│   │   └── content.css             # Injected styles
│   ├── popup/
│   │   ├── popup.html              # Extension popup UI
│   │   ├── popup.js                # Popup logic
│   │   └── popup.css               # Popup styles
│   ├── options/
│   │   ├── options.html            # Settings page
│   │   ├── options.js              # Settings logic
│   │   └── options.css             # Settings styles
│   ├── config/
│   │   ├── sites.json              # Site-specific selectors
│   │   └── indian-locations.js     # Location database (167 lines)
│   └── utils/
│       ├── common.js               # Shared utilities
│       ├── logger.js               # Logging system
│       ├── origin-detector.js      # Detection logic
│       └── storage.js              # Storage helpers
├── assets/
│   └── icons/                      # Extension icons
├── scripts/
│   ├── build-production.js         # Production build
│   └── create-*.js                 # Icon generation scripts
└── tests/
    ├── country-detection.test.js   # Unit tests
    └── origin-detector.test.js     # Detection tests
```

---

## Setup & Development

### Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/sudhanshuptl/MeraProduct.git
cd MeraProduct

# 2. Install dependencies
npm install

# 3. Build extension
npm run build:simple  # Creates dist/ folder with icons
```

### Load Extension in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `dist/` folder (NOT root!)

### Development Workflow
```bash
# Watch mode - auto-rebuild on file changes
npm run watch

# After changes, reload extension in chrome://extensions/
# No need to remove and re-add!
```

### Testing on Live Sites
```bash
# Opens test URLs in new tabs
npm run test:sites
```

### Project Scripts
```json
{
  "build:simple": "Creates dist/ with minimal icons",
  "build": "Production build with optimization",
  "watch": "Auto-rebuild on file changes",
  "test": "Run Jest unit tests",
  "test:sites": "Open Amazon/Flipkart test products"
}
```

---

## Core Components

### 1. Content Scripts (`src/content/`)

**content-amazon.js** (Main detection logic - 978 lines)

Key Functions:
```javascript
// Extract Country of Origin from product page
extractCountryOfOrigin()
  ├── Method 0: Grid layout (a-fixed-left-grid) - newer Amazon design
  ├── Method 1: Inline text patterns
  ├── Method 2: Table cells (TD/TH siblings)
  └── Method 3: Next sibling elements

// Extract Manufacturer information
extractManufacturerInfo()
  ├── Collects ALL manufacturer entries (handles multiple tables)
  ├── Returns LONGEST text (full address vs just company name)
  └── Supports grid layout + table layout

// Combine all product information
extractProductInfo()
  ├── Product title, image, features
  ├── Country of Origin (direct extraction)
  └── Manufacturer (direct extraction)

// Main processing function
processPage()
  ├── Wait for page load (10s delay + smart polling)
  ├── Extract product info
  ├── Calculate confidence score (60% + 50% = 100% max)
  └── Display badge (Indian/Non-Indian)
```

**Amazon Page Layouts Supported:**
1. Standard tables: `#productDetails_detailBullets_sections1`
2. Technical specs: `#productDetails_techSpec_section_1`
3. Product details: Under `<h2>Product details</h2>` heading
4. **Grid layout**: `<div class="a-fixed-left-grid product-facts-detail">` (NEW!)
5. Additional Information section

### 2. Indian Locations Config (`src/config/indian-locations.js`)

Centralized database for address validation:

```javascript
const INDIAN_LOCATIONS = {
  // 100+ Indian cities
  cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', ...],
  
  // 35+ states & union territories
  states: ['Maharashtra', 'Tamil Nadu', 'Karnataka', ...],
  
  // 13+ industrial areas
  industrialAreas: ['Noida', 'Gurgaon', 'Okhla', 'Faridabad', ...],
  
  // PIN code patterns
  pinCodePatterns: [/\b[1-9]\d{5}\b/]
};

// Validation function with word boundaries
function isIndianAddress(text) {
  // 1. Check for "India" keyword first (fast path)
  if (/\bIndia\b/i.test(text)) return true;
  
  // 2. Check cities, states, industrial areas
  // Uses regex with \b word boundaries for exact matches
  // Example: Matches "Okhla" but not "Okhlahoma"
  
  return found;
}
```

### 3. Logger System (`src/utils/logger.js`)

**6 Logging Levels:**
```javascript
log.error()   // ❌ Critical failures (always visible)
log.warn()    // ⚠️  Non-critical issues (always visible)
log.info()    // ℹ️  User-facing results (always visible)
log.success() // ✅ Important achievements (always visible)
log.data()    // 📊 Implementation details (debug mode only)
log.debug()   // 🐛 Technical details (debug mode only)
log.verbose() // 🔍 Deep debugging (debug mode only)
```

**Console Output (Debug Mode OFF):**
```
ℹ️ [MeraProduct][Amazon] MeraProduct loaded
✅ [MeraProduct][Amazon] 🇮🇳 RESULT: MADE IN INDIA ✅
ℹ️ [MeraProduct][Amazon]   🇮🇳 DISPLAYING INDIAN BADGE
ℹ️ [MeraProduct][Amazon] Product saved to history
```

**Console Output (Debug Mode ON):**
Shows all 40+ detailed logs including extraction methods, table structures, confidence calculations.

### 4. Background Service Worker (`src/background/service-worker.js`)

Handles:
- Product detection events
- Cross-origin requests (if needed)
- Storage management
- History tracking

---

## Detection System

### How Detection Works

**Flow:**
```
1. Page Load → 10 second delay (let Amazon load dynamic content)
2. Smart Polling → Wait up to 5s for manufacturer data (early exit if found)
3. Extract Product Info:
   ├── Country of Origin (5 extraction methods)
   ├── Manufacturer (3 extraction methods, picks longest)
   └── Product metadata (title, image, features)
4. Calculate Confidence:
   ├── Country = "India" → +60%
   ├── Manufacturer in India → +50%
   └── Cap at 100%
5. Display Badge:
   ├── ≥70% → 🟢 Green "Made in India"
   ├── <70% → 🟡 Yellow "Possibly India"
   └── 0% → 🔴 Red "Not India"
6. Save to History (if Indian product)
```

### Smart Polling System

**Problem:** Amazon loads product details dynamically, "Manufacturer" row may appear 2-5 seconds after page load.

**Solution:**
```javascript
async function waitForProductDetails() {
  const maxAttempts = 10; // 10 × 500ms = 5 seconds max
  
  for (let i = 0; i < maxAttempts; i++) {
    // Check BOTH tables AND "Product details" section
    const hasManufacturer = findManufacturerInTables() || 
                           findManufacturerInSection();
    
    if (hasManufacturer) {
      log.debug('✓ Manufacturer data found, proceeding...');
      return true; // Early exit!
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false; // Timeout after 5s
}
```

### Multi-Manufacturer Handling

**Problem:** Amazon has MULTIPLE manufacturer rows:
- Table 1: `<td>Samsung</td>` (8 characters - just company name)
- Table 2: `<td>Samsung India Electronics Pvt Ltd, 6th Floor, Building No. 5...</td>` (172 characters - full address)

**Solution:**
```javascript
function extractManufacturerInfo() {
  let allManufacturers = [];
  
  // Collect ALL manufacturer entries from all tables
  for (const pattern of manufacturerPatterns) {
    // ... find matches ...
    allManufacturers.push({ value, length, method });
  }
  
  // Sort by length descending, pick longest
  allManufacturers.sort((a, b) => b.length - a.length);
  return allManufacturers[0].value; // Full address with 172 chars!
}
```

### Grid Layout Support (New Amazon Design)

**Problem:** Newer Amazon pages use grid layout instead of tables:
```html
<div class="a-fixed-left-grid product-facts-detail">
  <div class="a-fixed-left-grid-col a-col-left">
    <span>Country of Origin</span>
  </div>
  <div class="a-fixed-left-grid-col a-col-right">
    <span>India</span>
  </div>
</div>
```

**Solution:**
```javascript
function extractFromGridLayout(labelPattern) {
  const grids = document.querySelectorAll('.a-fixed-left-grid.product-facts-detail');
  
  for (const grid of grids) {
    const leftCol = grid.querySelector('.a-col-left');
    const rightCol = grid.querySelector('.a-col-right');
    
    if (labelPattern.test(leftCol.textContent)) {
      return rightCol.textContent.trim(); // Found value!
    }
  }
  
  return null;
}
```

---

## Debug & Logging

### Enable Debug Mode

**Method 1: Extension Options**
1. Click extension icon → **Settings** (gear icon)
2. Toggle **"Debug Mode"** switch
3. Reload product page

**Method 2: Chrome Console**
```javascript
// Enable debug mode
chrome.storage.local.set({ debugMode: true });

// Disable debug mode
chrome.storage.local.set({ debugMode: false });

// Check current state
chrome.storage.local.get(['debugMode'], (result) => {
  console.log('Debug Mode:', result.debugMode);
});
```

### Debug Output

**With Debug Mode ON:**
```
🌍 Country of Origin Detection
  🐛 Starting extraction process...
  🐛 Searching 5 pattern types...
  🐛 ✓ Found match in Table Header (TH)
  🐛 ✅ EXTRACTED Country of Origin: "India"
  🐛 Extraction method: Next table cell (TH/TD sibling)
  🐛 Parent row structure: 2 cells found
  
🏭 Manufacturer Detection
  🐛 Starting manufacturer extraction...
  🐛 Found 2 manufacturer candidate(s)
  🐛 Selected longest manufacturer: 172 chars
  🐛 ✅ EXTRACTED Manufacturer: "Samsung India Electronics Pvt Ltd..."
  🐛 Extraction method: Next table cell (TH/TD sibling)
  
🔍 Origin Detection Analysis
  🐛 ✅ Country of Origin: India (+60%)
  🐛 ✅ Manufacturer Address: India (+50%)
  ✅ 🇮🇳 RESULT: MADE IN INDIA ✅
  🐛 Confidence: 100%
  🐛 Based on: Country of Origin: India + Manufacturer in India
```

### Logging Guidelines for Contributors

**What to log at each level:**
```javascript
// ERROR - Critical failures only
log.error('Failed to inject badge:', error);

// WARN - Deprecated features, non-critical issues
log.warn('Old API detected, using fallback');

// INFO - User-facing results (visible by default)
log.info('MeraProduct loaded');
log.info('🇮🇳 DISPLAYING INDIAN BADGE');
log.info('Product saved to history');

// SUCCESS - Important achievements (visible by default)
log.success('🇮🇳 RESULT: MADE IN INDIA ✅');

// DEBUG - Implementation details (debug mode only)
log.debug('Starting extraction process...');
log.debug('Extraction method: Grid layout');
log.debug('✅ EXTRACTED Country of Origin: "India"');

// VERBOSE - Deep debugging (debug mode only)
log.verbose('Raw text: "Country of Origin: India"');
log.verbose('Cell content lengths - textContent: 172, innerHTML: 198');
```

---

## Bug Fixes History

### 1. Confidence Calculation Fix (Oct 2025)
**Issue:** Extension showing 9000% confidence instead of 90%

**Root Cause:**
```javascript
// WRONG (old code)
confidence *= 100; // 0.90 × 100 = 90
result.confidence *= 100; // 90 × 100 = 9000! ❌
```

**Solution:**
- New scoring system: 60% + 50% = 100% max
- Remove all `× 100` multiplications
- Cap at 1.0 (100%)

**Files Changed:**
- `src/content/content-amazon.js` - Confidence calculation

---

### 2. Manufacturer Extraction Fix (Oct 2025)
**Issue:** Only extracting 8 characters ("Samsung") instead of full 172-character address

**Root Cause:** Amazon has MULTIPLE manufacturer rows:
- Short version: `<td>Samsung</td>` (8 chars)
- Full version: `<td>Samsung India Electronics Pvt Ltd, 6th Floor...</td>` (172 chars)

Old code returned first match (shortest).

**Solution:**
```javascript
// NEW: Collect ALL manufacturers, return LONGEST
let allManufacturers = [];
// ... collect from all tables ...
allManufacturers.sort((a, b) => b.length - a.length);
return allManufacturers[0].value; // Longest = full address!
```

**Files Changed:**
- `src/content/content-amazon.js` - `extractManufacturerInfo()`

---

### 3. Indian Address Detection Fix (Oct 2025)
**Issue:** "Okhla, New Delhi" not recognized as Indian location

**Root Cause:** Regex matching "India" substring in words like "Indiana", "Indian Ocean"

**Solution:**
```javascript
// WRONG
if (/India/i.test(text)) // Matches "Indiana" ❌

// CORRECT
if (/\bIndia\b/i.test(text)) // Word boundaries ✅
```

Also added:
- 100+ Indian cities
- 35+ states
- 13+ industrial areas (Noida, Gurgaon, Okhla, etc.)

**Files Changed:**
- `src/config/indian-locations.js` - Enhanced location database

---

### 4. Grid Layout Support (Oct 2025)
**Issue:** Newer Amazon pages using grid layout instead of tables, extraction failing

**Solution:** Added `extractFromGridLayout()` helper:
```javascript
function extractFromGridLayout(labelPattern) {
  const grids = document.querySelectorAll('.a-fixed-left-grid.product-facts-detail');
  // ... extract from left/right columns ...
}
```

**Files Changed:**
- `src/content/content-amazon.js` - Added grid layout support

---

### 5. Smart Polling Implementation (Oct 2025)
**Issue:** Product details (especially Manufacturer) load 2-5 seconds after page load

**Solution:**
- 10-second initial delay (let page stabilize)
- Smart polling: Wait up to 5s for manufacturer data
- Early exit when data found
- Checks BOTH tables AND "Product details" sections

**Files Changed:**
- `src/content/content-amazon.js` - `waitForProductDetails()`, `initialize()`

---

### 6. Console Output Cleanup (Oct 2025)
**Issue:** 40+ verbose log statements cluttering console for normal users

**Solution:**
- Converted 39 logs from `log.info/success/data()` → `log.debug()`
- Only 5 logs visible by default:
  1. Extension loaded
  2. Final result ("MADE IN INDIA")
  3. Badge displayed
  4. Product saved
  5. Non-Indian badge (if applicable)
- All 40+ logs available in Debug Mode

**Files Changed:**
- `src/content/content-amazon.js` - Logging cleanup across all functions

---

### 7. False Positive Prevention (Oct 2025)
**Issue:** Extension marking non-Indian products as Indian

**Solution:**
- Explicit "NOT India" check: If Country = "China", confidence = 0%
- No text analysis fallback for non-Indian countries
- Strict manufacturer validation with `isIndianAddress()`

**Files Changed:**
- `src/content/content-amazon.js` - `processPage()` confidence logic

---

## Features Implemented

### 1. Clickable Badge (Oct 2025)
**Feature:** Click badge to view detailed product information

**Implementation:**
- Badge opens panel with:
  - Confidence score
  - Country of Origin
  - Manufacturer details
  - Detection method
- Panel positioning: Below badge, follows scroll
- Close button + click-outside-to-close

**Files:**
- `src/content/content-amazon.js` - Badge click handler
- `src/content/content.css` - Panel styles

---

### 2. History Feature (Oct 2025)
**Feature:** Track all detected Indian products

**Storage:**
```javascript
{
  "indianProducts": [
    {
      "url": "https://amazon.in/dp/...",
      "title": "Samsung Galaxy M04",
      "manufacturer": "Samsung India Electronics...",
      "confidence": 1.0,
      "indicator": "Country of Origin: India + Manufacturer in India",
      "timestamp": 1729516800000
    }
  ]
}
```

**Access:** Extension popup → "History" tab

---

### 3. Debug Mode (Oct 2025)
**Feature:** Toggle detailed logging for troubleshooting

**Benefits:**
- Clean console by default (5 lines)
- Full debug output when enabled (40+ lines)
- Helps users report issues with detailed logs

**Access:** Extension options → Debug Mode toggle

---

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test country-detection.test.js
```

**Test Files:**
- `tests/origin-detector.test.js` - Detection logic tests
- `tests/country-detection.test.js` - Country extraction tests

### Manual Testing Checklist

**Test Products:**
1. ✅ Indian product (Country + Manufacturer)
   - Example: Samsung phone made in India
   - Expected: 🟢 Green badge, 100% confidence

2. ✅ Indian product (Country only)
   - Example: Product with "Country: India" but no manufacturer
   - Expected: 🟢 Green badge, 60% confidence

3. ✅ Indian product (Manufacturer only)
   - Example: Product with Indian address but no country field
   - Expected: 🟡 Yellow badge, 50% confidence

4. ✅ Non-Indian product
   - Example: Product with "Country: China"
   - Expected: 🔴 Red badge, 0% confidence

5. ✅ Missing data
   - Example: Product with no country or manufacturer
   - Expected: Text pattern analysis fallback

**Test Page Layouts:**
- ✅ Standard product details table
- ✅ Technical specifications table
- ✅ Grid layout (newer design)
- ✅ "Product details" section under heading
- ✅ Additional Information section

**Test Debug Mode:**
- ✅ Debug OFF → 5 logs visible
- ✅ Debug ON → 40+ logs visible
- ✅ All extraction methods logged

---

## Deployment

### Pre-Deployment Checklist

- [ ] **Code Quality**
  - [ ] All tests passing (`npm test`)
  - [ ] No console errors in production
  - [ ] Debug mode OFF by default
  - [ ] Manifest version updated

- [ ] **Testing**
  - [ ] Test on 10+ different products
  - [ ] Test all page layouts (table, grid)
  - [ ] Test with Debug Mode ON/OFF
  - [ ] Test badge click functionality
  - [ ] Test history feature

- [ ] **Documentation**
  - [ ] README updated
  - [ ] DEVELOPMENT.md updated (this file)
  - [ ] Version number bumped
  - [ ] CHANGELOG updated

- [ ] **Assets**
  - [ ] All icons present (16, 32, 48, 128)
  - [ ] Screenshots ready (1280×800 or 640×400)
  - [ ] Privacy policy updated

### Build for Production
```bash
# 1. Clean build
rm -rf dist/
npm run build

# 2. Test build
# Load dist/ in chrome://extensions/
# Test on live sites

# 3. Create submission package
npm run package  # Creates MeraProduct.zip
```

### Chrome Web Store Submission

**Required Files:**
- `MeraProduct.zip` (extension package)
- Screenshots (1-5 images)
- Privacy policy (hosted URL)
- Promotional images (optional)

**Store Listing:**
- Name: MeraProduct 🇮🇳
- Category: Shopping
- Language: English (+ Hindi support)

**Review Process:**
- Takes 1-3 business days
- Address any policy violations
- Respond to review feedback

**Post-Launch:**
- Monitor reviews
- Track crash reports
- Plan feature updates

---

## Contributing

### Code Style
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow existing naming conventions
- Keep functions focused and small

### Commit Messages
```
feat: Add grid layout support for Amazon
fix: Correct confidence calculation (9000% → 100%)
docs: Update DEVELOPMENT.md with bug fixes
refactor: Clean up console logging
test: Add unit tests for address detection
```

### Pull Request Process
1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with tests
4. Update documentation
5. Submit PR with description

---

## Support & Resources

- **Issues:** [GitHub Issues](https://github.com/sudhanshuptl/MeraProduct/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sudhanshuptl/MeraProduct/discussions)
- **Email:** sudhanshuptl@gmail.com

---

## License

MIT License - See LICENSE file for details.

---

**Document Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Maintained By:** Sudhanshu Patel (@sudhanshuptl)
