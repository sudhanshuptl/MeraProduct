# MeraProduct 🇮🇳

MeraProduct is a lightweight Chrome extension built to empower users to make informed and patriotic purchase decisions.  
It automatically detects whether the product you’re viewing online is *Made in India* and displays key insights like origin, manufacturer, and review summaries.

---

## ✨ Features

- Instantly highlights **Made in India** products while browsing.
- Works seamlessly on **Amazon**, **Flipkart**, and other major eCommerce platforms.
- Shows product **origin**, **manufacturer details**, and **average review score**.
- Displays an **Indian flag badge** beside verified Indian-made listings.
- Privacy-first – all origin detection happens locally in your browser.

---

## 🧠 How It Works

1. The extension scans the product details section when you open an eCommerce product page.
2. It detects “Country of Origin” tags or similar metadata using a content script.
3. If the product is made in India, it instantly displays a 🇮🇳 badge and origin message.
4. Upcoming releases will include review aggregation and “Indian alternative” suggestions.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sudhanshuptl/MeraProduct.git
cd MeraProduct
```

### 2. Install Dependencies & Build
This project uses `npm` to manage dependencies and run build scripts.
```bash
# Install project dependencies
npm install

# Build the extension. This creates the `dist` folder with proper icons.
npm run build:simple
```

### 3. Load the Extension in Chrome
1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click the **“Load unpacked”** button.
4.  Select the **`dist`** folder from the project directory (NOT the root folder).

The MeraProduct extension icon should now appear in your Chrome toolbar!

---

## 💻 Development Workflow

For active development, use the `watch` script:

```bash
# Automatically rebuild the extension into the `dist` folder when source files change
npm run watch
```
After the initial build, you only need to **reload the extension** in `chrome://extensions/` to apply your changes. You do not need to remove and re-add it.

---

## 🧩 Tech Stack

- **Manifest v3** Chrome Architecture  
- **JavaScript** for DOM parsing & logic  
- **HTML/CSS** for extension UI  
- (Optional) **Node.js** for review API integration  

---

## �️ Indian Locations Configuration

MeraProduct uses a **centralized configuration file** (`src/config/indian-locations.js`) for all Indian geographic data detection. This makes it easy to add new locations and maintain consistency across all platforms.

### What's Included
The configuration includes:
- **PIN Codes**: Validates 6-digit codes in range 100000-855999
- **Industrial Areas**: 13+ zones (SIPCOT, SIDCO, MIDC, GIDC, KASEZ, SEEPZ, NEPZ, Okhla, SEZ, etc.)
- **Major Cities**: 100+ cities including metro and tier-2 cities with name variations
- **States & UTs**: All 28 states and 8 union territories

### Adding New Locations

To add new Indian cities, industrial areas, or states:

1. **Open the configuration file:**
   ```
   src/config/indian-locations.js
   ```

2. **Add your location to the appropriate array:**
   ```javascript
   // For industrial areas:
   industrialAreas: [
     'your-new-industrial-area',
     ...
   ]
   
   // For cities:
   majorCities: [
     'yourcity',
     ...
   ]
   
   // For states:
   states: [
     'your state',
     ...
   ]
   ```

3. **Save the file** - Changes apply to both Amazon and Flipkart automatically!

4. **Reload the extension** in `chrome://extensions/` to test

### Location Detection Logic
The `IndianLocations.isIndianAddress()` function checks in this order:
1. ✅ **PIN Code** validation (100000-855999)
2. ✅ **Industrial Areas** (SIPCOT, MIDC, Okhla, SEZ, etc.)
3. ✅ **Cities** (Mumbai, Bangalore, Pune, etc.)
4. ✅ **States** (Maharashtra, Tamil Nadu, etc.)
5. ✅ **Country** ("India" explicitly mentioned)

Returns: `{ isIndian: boolean, matchType: string, matchValue: string }`

**Example:**
```javascript
IndianLocations.isIndianAddress("Plot No. 5, MIDC Pune, Maharashtra 411019")
// Returns: { isIndian: true, matchType: "Industrial Area", matchValue: "midc" }
```

---

## �🛠 Future Enhancements

- Support for more websites (Myntra, Croma)
- AI-driven product comparison for Indian-made alternatives
- Review sentiment visualization
- Language localization (Hindi, English)

---

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- **[Documentation Index](docs/README.md)** - Complete documentation navigation
- **[Usage Guide](docs/guides/USAGE_GUIDE.md)** - How to use all features
- **[Clickable Badge Guide](docs/guides/CLICKABLE_BADGE_GUIDE.md)** - Interactive badge system
- **[Debug Mode Guide](docs/debug/DEBUG_MODE_GUIDE.md)** - Troubleshooting and debugging
- **[Feature Documentation](docs/features/)** - Detailed feature descriptions
- **[Bug Fixes](docs/fixes/)** - History of fixes and improvements

**[📖 View Full Documentation Index →](docs/README.md)**

---

## 🚀 Chrome Web Store Deployment

Ready to deploy MeraProduct to the Chrome Web Store? Everything is set up for you!

### Quick Deploy
```bash
# Create production-ready package
npm run build:production

# This generates:
# ✅ meraproduct-v1.0.0.zip (ready for Chrome Web Store)
# ✅ DEPLOYMENT_CHECKLIST.txt (submission guide)
```

### Deployment Resources
- **[Quick Deploy Guide](QUICK_DEPLOY.md)** - 3-step deployment process
- **[Full Deployment Guide](docs/guides/CHROME_STORE_DEPLOYMENT.md)** - Comprehensive submission guide with store listing templates
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.txt)** - Auto-generated submission checklist

### What's Included
✅ Production-optimized ZIP package (49 KB)  
✅ All required icons (16x16, 32x32, 48x48, 128x128)  
✅ Validated manifest.json  
✅ Store listing templates  
✅ Privacy policy template  
✅ Screenshot guidelines  

**Ready to publish?** Follow the [Quick Deploy Guide](QUICK_DEPLOY.md) to upload to Chrome Web Store!

---

## �🙌 Contributing

Contributions are welcome! Please open a pull request or raise an issue with site support suggestions or feature improvements.

### For Contributors
1. Review the [Documentation Index](docs/README.md) to understand the project
2. Check [GitHub Issues](https://github.com/sudhanshuptl/MeraProduct/issues) for open tasks
3. Follow the coding guidelines in [Copilot Instructions](.github/copilot-instructions.md)
4. Use [Debug Mode](docs/debug/DEBUG_MODE_GUIDE.md) for testing your changes

---

## 📜 License

This project is licensed under the **Apache 2.0** – see the [LICENSE](LICENSE) file for details.

---

## ❤️ Made in India

Proudly developed to support the *Atmanirbhar Bharat* initiative.
