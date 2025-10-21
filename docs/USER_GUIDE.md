# MeraProduct - User Guide

**Your companion for discovering Made in India products**

---

## Table of Contents
- [Getting Started](#getting-started)
- [Installation](#installation)
- [How to Use](#how-to-use)
- [Features](#features)
- [Settings](#settings)
- [Privacy](#privacy)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is MeraProduct?

MeraProduct is a Chrome browser extension that helps you identify products made in India while shopping on e-commerce platforms like Amazon and Flipkart.

### Why MeraProduct?

- ✅ **Support Local:** Easily find and support Indian manufacturers
- ✅ **Instant Detection:** Automatic badge appears on product pages
- ✅ **Track History:** Keep track of products you've viewed
- ✅ **Privacy First:** All processing happens locally in your browser
- ✅ **No Account Required:** Works immediately after installation

### Supported Platforms

- ✅ **Amazon India** (amazon.in)
- ✅ **Flipkart** (flipkart.com)
- 🚧 More platforms coming soon!

---

## Installation

### From Chrome Web Store

1. **Visit Chrome Web Store**
   - Search for "MeraProduct"
   - Or visit: [MeraProduct Extension Link]

2. **Click "Add to Chrome"**
   - Review permissions
   - Click "Add extension"

3. **Done!**
   - Extension icon appears in toolbar
   - Visit any Amazon/Flipkart product page to start

### Manual Installation (Developer Mode)

1. **Download Extension**
   - Download from: https://github.com/sudhanshuptl/MeraProduct

2. **Unzip Files**
   - Extract to a folder on your computer

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked"
   - Select the MeraProduct folder

4. **Pin Extension (Optional)**
   - Click puzzle icon in toolbar
   - Find MeraProduct
   - Click pin icon to keep it visible

---

## How to Use

### Basic Usage

**Step 1: Visit a Product Page**
- Go to Amazon.in or Flipkart.com
- Open any product page

**Step 2: Check the Badge**
- A floating badge automatically appears
- 🇮🇳 **Green badge** = Made in India
- 🚫 **Red badge** = Not Made in India

**Step 3: View Details**
- Click the badge to see your product history
- Or click the extension icon in toolbar

### Badge Indicators

#### Made in India Badge 🇮🇳
```
┌─────────────────────────────┐
│  🇮🇳  MADE IN INDIA         │
│  Confidence: 95%            │
└─────────────────────────────┘
```
- **Green background**
- Shows confidence level
- Clickable to view history

#### Not Made in India Badge 🚫
```
┌─────────────────────────────┐
│  🚫  NOT MADE IN INDIA      │
│  Origin: China              │
└─────────────────────────────┘
```
- **Red background**
- Shows actual origin country
- Still saved to history for reference

### Confidence Levels

| Confidence | Meaning | Source |
|-----------|---------|--------|
| **100%** | Verified | Found "Country of Origin: India" field |
| **90-95%** | Very High | Found "Made in India" or manufacturer address |
| **70-80%** | High | Found Indian states/cities in description |
| **50-60%** | Medium | Found indirect indicators |

---

## Features

### 1. Automatic Detection

**No clicks needed!** The extension automatically:
- Scans product details
- Looks for "Country of Origin" information
- Checks manufacturer details
- Shows badge immediately

### 2. Product History

**Track your browsing:**
- Last 30 products viewed
- Made in India vs Not Made in India count
- Success rate percentage
- Quick access to previously viewed products

**View History:**
1. Click extension icon in toolbar
2. See all recently viewed products
3. Click any product to revisit its page

### 3. Search & Filter (in History)

- View products by date
- Filter Made in India products
- See confidence levels
- Delete individual items

### 4. Statistics

**See your impact:**
- Total products scanned
- Number of Indian products found
- Success rate percentage
- Most recent detections

### 5. Settings

**Customize your experience:**
- Toggle Debug Mode (for developers)
- Show/hide confidence scores
- Clear history
- Manage preferences

---

## Settings

### Accessing Settings

1. Click extension icon
2. Click ⚙️ (gear icon) in top-right
3. Adjust preferences
4. Changes save automatically

### Available Settings

#### Debug Mode
- **What it does:** Shows detailed logs in browser console
- **Who needs it:** Developers or users troubleshooting issues
- **Default:** OFF

**How to enable:**
1. Open settings
2. Toggle "Debug Mode" ON
3. Open browser console (F12)
4. Refresh product page
5. See detailed detection logs

#### Show Confidence Score
- **What it does:** Displays confidence percentage in history
- **Example:** "90% confident"
- **Default:** ON

**To toggle:**
1. Open settings
2. Toggle "Show Confidence Score"
3. View history to see changes

### Clear History

**Warning:** This action cannot be undone!

1. Click "Clear History" button
2. Confirm in popup dialog
3. All history will be deleted
4. Statistics reset to zero

---

## Privacy

### What We Collect

**Nothing!** 

MeraProduct:
- ❌ Does NOT send data to external servers
- ❌ Does NOT track your browsing history
- ❌ Does NOT require login or account
- ❌ Does NOT share data with third parties

### What We Store Locally

Only stored on YOUR device (never sent anywhere):
- Last 30 product pages you visited
- Your settings preferences (debug mode, etc.)

### Permissions Explained

| Permission | Why We Need It |
|-----------|---------------|
| **storage** | Save your product history locally |
| **activeTab** | Read product information from current tab |
| **scripting** | Inject detection code into Amazon/Flipkart pages |

### Data Security

- All data stored in Chrome's secure storage
- No passwords or personal information
- Data deleted when you uninstall extension
- You can clear history anytime

---

## FAQ

### General Questions

**Q: Is MeraProduct free?**
A: Yes, completely free and open source!

**Q: Does it work on mobile?**
A: Currently only for Chrome desktop browser. Mobile support coming soon.

**Q: Which websites are supported?**
A: Amazon India and Flipkart. More platforms coming soon.

**Q: How accurate is the detection?**
A: Very accurate when "Country of Origin" field is present (100% confidence). Otherwise uses multiple detection methods (50-95% confidence).

### Technical Questions

**Q: Why doesn't the badge appear?**
A: Try these steps:
1. Refresh the page
2. Check if you're on a product page (not search results)
3. Enable Debug Mode and check console for errors
4. Reload the extension

**Q: Wrong confidence percentage showing?**
A: This was a known issue, fixed in v1.1.1. Update to latest version.

**Q: Badge appears twice?**
A: Refresh the page. This can happen if page updates dynamically.

**Q: Manufacturer info not showing?**
A: Not all products have manufacturer information. If present, we'll show it.

### Privacy Questions

**Q: Do you track what I buy?**
A: No! We don't track purchases, only store product pages you VIEW (locally on your device).

**Q: Is my browsing history safe?**
A: Yes! History is stored only on your device, never sent anywhere.

**Q: Can I delete my history?**
A: Yes! Click extension icon → Settings → Clear History.

**Q: What happens if I uninstall?**
A: All local data is deleted automatically.

---

## Troubleshooting

### Badge Not Appearing

**Solution 1: Refresh Page**
- Press F5 or Cmd+R
- Wait a few seconds

**Solution 2: Check if Product Page**
- Badge only appears on individual product pages
- Not on search results or category pages

**Solution 3: Reload Extension**
1. Go to `chrome://extensions/`
2. Find MeraProduct
3. Click reload icon 🔄

**Solution 4: Check Console**
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for `[MeraProduct]` logs
4. Check for errors (red text)

### Wrong Detection

**Issue: Shows "Made in India" but it's not**

This can happen if:
- Product description mentions India for other reasons
- Seller is in India but product is imported

**What to do:**
- Check the confidence level (lower = less certain)
- Verify "Country of Origin" field on actual product page
- Report issue: [GitHub Issues Link]

**Issue: Shows "Not Made in India" but it is**

Possible reasons:
- "Country of Origin" field says otherwise
- Product details incomplete
- New page format not yet supported

**What to do:**
- Check actual product details on page
- Report the product URL so we can improve detection

### Extension Not Loading

**Check Chrome Version:**
- Requires Chrome 88 or higher
- Update Chrome: `chrome://settings/help`

**Check Extension Status:**
1. Go to `chrome://extensions/`
2. Find MeraProduct
3. Ensure toggle is ON (blue)
4. Check for errors below extension

**Reinstall Extension:**
1. Uninstall current version
2. Restart Chrome
3. Install fresh from Chrome Web Store

### Performance Issues

**Page Loading Slowly?**
- Extension runs after page loads
- Should not affect page speed
- If slow, try disabling other extensions

**High Memory Usage?**
- Clear history: Settings → Clear History
- Reload extension
- Restart Chrome

---

## Best Practices

### For Best Results

1. **Keep Extension Updated**
   - Check for updates regularly
   - Enable auto-updates in Chrome

2. **Report Issues**
   - Found a bug? Report it!
   - Help us improve detection

3. **Verify Critical Purchases**
   - Always check official product details
   - Extension is a helper tool, not 100% guarantee

4. **Share Feedback**
   - Rate extension on Chrome Web Store
   - Suggest new features

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Extension Popup | Click icon or `Alt+Shift+M` |
| Refresh Current Page | `F5` or `Cmd+R` |
| Open DevTools | `F12` or `Cmd+Option+I` |

*Note: Keyboard shortcut can be customized in `chrome://extensions/shortcuts`*

---

## Getting Help

### Support Channels

1. **GitHub Issues**
   - Report bugs: [Issues Link]
   - Request features: [Issues Link]

2. **Documentation**
   - Developer Guide: `docs/DEVELOPER_GUIDE.md`
   - Changelog: `docs/CHANGELOG.md`

3. **Community**
   - [Coming Soon: Discord/Telegram]

### Reporting Issues

**When reporting a bug, please include:**
- Extension version (found in `chrome://extensions/`)
- Chrome version (`chrome://version/`)
- Product URL where issue occurred
- Screenshot of the issue
- Console errors (if any)

**Example Bug Report:**
```
Extension Version: 1.1.1
Chrome Version: 120.0.6099.129
Issue: Badge not appearing on product page
URL: https://amazon.in/dp/B08R6JKY5G
Screenshot: [attach]
Console Errors: [paste errors]
```

---

## Uninstalling

### Remove Extension

1. **Via Extensions Page**
   - Go to `chrome://extensions/`
   - Find MeraProduct
   - Click "Remove"
   - Confirm deletion

2. **Via Extension Icon**
   - Right-click extension icon
   - Select "Remove from Chrome"
   - Confirm

**Note:** All local data (history, settings) will be deleted.

### Feedback Before Uninstalling

We'd love to know why you're uninstalling:
- Not working properly?
- Missing features?
- Privacy concerns?
- Just don't need it?

Please leave feedback: [Feedback Form Link]

---

## Credits

**Developed by:** Sudhanshu Patel  
**Contributors:** [See GitHub]  
**License:** MIT

### Acknowledgments

- Icons by [Icon Source]
- Inspired by the "Make in India" initiative
- Built with ❤️ for Indian consumers

---

## Stay Updated

- **GitHub:** https://github.com/sudhanshuptl/MeraProduct
- **Chrome Web Store:** [Extension Link]
- **Version:** 1.0.0

---

**Thank you for supporting Indian products! 🇮🇳**
