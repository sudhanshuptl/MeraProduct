# MeraProduct 🇮🇳

**Identify Made in India products while shopping online**

MeraProduct is a Chrome extension that automatically detects "Made in India" products on e-commerce platforms like Amazon and Flipkart. It displays a badge and detailed origin information to help you make informed purchase decisions.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sudhanshuptl/MeraProduct)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](manifest.json)

---

## ✨ Features

- 🇮🇳 **Instant Detection** - Highlights "Made in India" products with a badge
- 🛡️ **Privacy-First** - All processing happens locally in your browser
- 🎯 **Accurate** - Uses direct extraction from "Country of Origin" and "Manufacturer" fields
- 📊 **Confidence Score** - Shows how certain we are (60% country + 50% manufacturer = 100% max)
- 🎨 **Color-Coded** - Green (≥70%), Yellow (<70%), Red (Not India)
- 📱 **Clickable Badge** - View detailed product information
- 📜 **History** - Track all Indian products you've viewed
- 🐛 **Debug Mode** - Toggle detailed logging for troubleshooting

**Supported Platforms:**
- ✅ Amazon India
- ✅ Flipkart (coming soon)

---

## 🚀 Quick Start

### For Users

1. **Install from Chrome Web Store** (Coming Soon)
2. Browse Amazon or Flipkart
3. Look for the 🇮🇳 badge on product pages!

### For Developers

\`\`\`bash
# 1. Clone & Install
git clone https://github.com/sudhanshuptl/MeraProduct.git
cd MeraProduct
npm install

# 2. Build
npm run build:simple

# 3. Load in Chrome
# Open chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select the "dist" folder
\`\`\`

**Development Mode:**
\`\`\`bash
# Auto-rebuild on file changes
npm run watch

# After changes, just reload extension in chrome://extensions/
\`\`\`

---

## 📖 Documentation

### For Developers
👉 **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete developer guide covering:
  - Architecture & project structure
  - Setup & development workflow  
  - Detection system explained
  - Debugging & logging
  - Bug fixes history
  - Features implemented
  - Testing & deployment

### For AI Assistants
👉 **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Coding guidelines and patterns

---

## 🎯 How It Works

\`\`\`
1. Page Load → Wait for Amazon to load product details (10s + smart polling)
2. Extract Data:
   ├── Country of Origin (from product details)
   ├── Manufacturer address (from product details)
   └── Product metadata (title, image, features)
3. Calculate Confidence:
   ├── Country = "India" → +60%
   ├── Manufacturer in India → +50%
   └── Maximum: 100%
4. Display Badge:
   ├── ≥70% → 🟢 Green "Made in India"
   ├── <70% → 🟡 Yellow "Possibly India"
   └── 0% → 🔴 Red "Not India"
5. Save to History (if Indian product)
\`\`\`

**What makes it accurate:**
- ✅ Direct extraction from "Country of Origin" field (not guessing!)
- ✅ Validates manufacturer address against 100+ Indian cities, 35+ states
- ✅ Handles 5+ different Amazon page layouts (including newer grid design)
- ✅ Multi-manufacturer detection (picks longest/most complete address)
- ✅ Smart polling (waits for dynamic content to load)

---

## 🛠️ Tech Stack

- **Manifest V3** - Modern Chrome extension architecture
- **Vanilla JavaScript** - No frameworks, fast and lightweight
- **Chrome Extension APIs** - Storage, tabs, runtime messaging
- **Local Processing** - Privacy-first, no external API calls

---

## 🔧 Configuration

### Debug Mode
Enable detailed logging to troubleshoot issues:

**Method 1:** Extension Options
1. Click extension icon → Settings (gear icon)
2. Toggle "Debug Mode"
3. Reload product page

**Method 2:** Chrome Console
\`\`\`javascript
chrome.storage.local.set({ debugMode: true });
\`\`\`

### Indian Locations Database
Located at \`src/config/indian-locations.js\`:
- 100+ Indian cities
- 35+ states & union territories
- 13+ industrial areas (Noida, Gurgaon, Okhla, etc.)
- PIN code validation

To add new locations, edit this file and rebuild.

---

## 🚀 Deployment

### Chrome Web Store Deployment

**Build Commands:**
\`\`\`bash
# Development build (for local testing)
npm run build:simple        # Basic build with placeholder icons
npm run build:dev           # Build with debug mode icons

# Production build (for Chrome Web Store)
npm run build:production    # Optimized production build
npm run build:store         # Alias for build:production

# Create deployment package (recommended)
npm run package             # Builds + creates meraproduct-v1.0.0.zip

# Quick deploy (one command)
npm run deploy              # Same as build:production
\`\`\`

**Quick Deploy:**
\`\`\`bash
# Create production-ready package in one command
npm run package

# Creates: 
#   - dist/ folder (optimized code)
#   - meraproduct-v1.0.0.zip (ready for upload)
\`\`\`

**Package Contents:**
- ✅ Optimized code (~49 KB)
- ✅ All required icons (16, 32, 48, 128)
- ✅ Validated manifest.json (V3)
- ✅ Privacy policy compliant
- ✅ Compressed ZIP for submission

**Submission Workflow:**
1. **Test Locally**
   - Load unpacked extension in `chrome://extensions/`
   - Test on Amazon/Flipkart products
   - Verify badge, popup, settings, history

2. **Prepare Submission**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "New Item" (or update existing)
   - Upload: `meraproduct-v1.0.0.zip`

3. **Required Assets**
   - Icon: 128×128 PNG (✅ included)
   - Screenshots: 1280×800 or 640×400 (minimum 1 required)
   - Small promotional tile: 440×280 PNG (optional)

4. **Store Listing Info**
   - **Name:** "MeraProduct - Made in India Detector"
   - **Summary:** "Detect Made in India products instantly" (50 chars max)
   - **Category:** Shopping
   - **Language:** English

5. **Privacy & Permissions**
   - **Permissions Used:**
     - `storage` - Save product history locally
     - `activeTab` - Read product information on e-commerce sites
   - **Privacy:** No data collection, all processing local
   - Single purpose: Identify Made in India products

6. **Submit & Wait**
   - Review time: 1-3 business days
   - Monitor review status in dashboard
   - Respond to any feedback promptly

**Post-Launch:**
- Track analytics and reviews
- Respond to user feedback
- Monitor crash reports
- Plan feature updates

See **[DEVELOPMENT.md#deployment](DEVELOPMENT.md#deployment)** for complete pre-deployment checklist and troubleshooting.

---

## 🧪 Testing

\`\`\`bash
# Run unit tests
npm test

# Test on live sites
npm run test:sites  # Opens test products in browser
\`\`\`

**Manual Testing:**
1. Test Indian product (Country + Manufacturer) → 🟢 100%
2. Test Indian product (Country only) → 🟢 60%
3. Test Indian product (Manufacturer only) → 🟡 50%
4. Test non-Indian product → 🔴 0%
5. Test different page layouts (table, grid)
6. Test Debug Mode ON/OFF

---

## 🙌 Contributing

Contributions welcome! 

**Getting Started:**
1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for architecture overview
2. Check [GitHub Issues](https://github.com/sudhanshuptl/MeraProduct/issues)
3. Fork repository and create feature branch
4. Make changes with tests
5. Submit pull request

**Code Guidelines:**
- Follow existing code style (2 spaces, camelCase)
- Add comments for complex logic
- Write meaningful commit messages
- Update DEVELOPMENT.md if needed
- Test with Debug Mode ON

---

## 📝 Project Structure

\`\`\`
MeraProduct/
├── DEVELOPMENT.md              # 📖 Complete developer documentation
├── README.md                   # 👋 This file
├── manifest.json               # Extension manifest
├── package.json               # npm scripts & dependencies
├── .github/
│   └── copilot-instructions.md # AI assistant guidelines
├── src/
│   ├── content/
│   │   ├── content-amazon.js   # Amazon detection (main logic)
│   │   ├── content-flipkart.js # Flipkart detection
│   │   └── content.css         # Badge & panel styles
│   ├── popup/                  # Extension popup UI
│   ├── options/                # Settings page
│   ├── background/             # Service worker
│   ├── config/
│   │   └── indian-locations.js # Location database
│   └── utils/
│       ├── logger.js           # Logging system
│       ├── origin-detector.js  # Detection utilities
│       └── storage.js          # Storage helpers
├── tests/                      # Unit tests
└── scripts/                    # Build scripts
\`\`\`

---

## 📜 License

This project is licensed under the **Apache 2.0** License - see the [LICENSE](LICENSE) file for details.

---

## ❤️ Support

- **Issues:** [GitHub Issues](https://github.com/sudhanshuptl/MeraProduct/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sudhanshuptl/MeraProduct/discussions)
- **Email:** sudhanshuptl13@gmail.com

---

## 🇮🇳 Made in India

Proudly developed to support the *Atmanirbhar Bharat* initiative.

**Star ⭐ this repo if you find it useful!**
