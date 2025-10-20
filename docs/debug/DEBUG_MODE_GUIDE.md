# 🔧 Debug Mode - User Guide

## How to Enable Debug Mode from Extension UI

### Method 1: Using Extension Popup (Recommended)

1. **Click the MeraProduct extension icon** in your Chrome toolbar
2. **Click the ⚙️ (Settings) icon** in the top-right corner of the popup
3. **Toggle "Debug Mode"** switch to ON (it will turn green)
4. **See confirmation**: The label will briefly show "Debug Mode ✓ Enabled" in green
5. **Open browser console** (Press F12 or right-click → Inspect)
6. **Refresh any product page** to see detailed logs

### Method 2: Using Browser Console (Advanced)

If you prefer using the console directly:

```javascript
// Enable debug mode
Logger.enableDebug()

// Disable debug mode
Logger.disableDebug()
```

## What Debug Mode Shows

When debug mode is enabled, you'll see detailed logs in the browser console:

### 🟢 On Page Load:
```
[Flipkart] MeraProduct loaded (Debug Mode ON)
💡 Tip: Enable debug mode in extension settings...
[Flipkart] Waiting for page to load...
[Flipkart] Starting detection process
```

### 🔍 During Detection:
```
[Flipkart] Starting page process...
[Flipkart] Found Read More button, clicking...
[Flipkart] Searching for Manufacturing info link...
[Flipkart] Manufacturing link found, clicking...
[Flipkart] Modal found
```

### 📊 Product Analysis:
```
[Flipkart] ▼ Analyzing Manufacturing Info
[Flipkart] Modal text (first 300 chars): Country of Origin: India...
[Flipkart] Extracted - Country: India
[Flipkart] Extracted - Manufacturer: XYZ Company, Mumbai
[Flipkart] Made in India - Country + Manufacturer (100%)
[Flipkart] ▲ (group end)
```

### 💾 Saving to History:
```
[Flipkart] Product info extracted: {title: "Apple iPhone 15", hasImage: true, textLength: 5234}
[Flipkart] Saving product to history: {name: "Apple iPhone 15", url: "https://...", ...}
[Flipkart] ✅ Product saved to history successfully!
```

## Benefits of Debug Mode

✅ **See exactly what the extension is doing**
✅ **Understand why a product was/wasn't detected as Made in India**
✅ **Check if product name and image are being captured**
✅ **Verify storage is working correctly**
✅ **Troubleshoot any issues**
✅ **Report bugs with detailed logs**

## Visual Feedback in Popup

When you toggle debug mode in the settings:

- **ON**: Label shows "Debug Mode ✓ Enabled" in **green** for 2 seconds
- **OFF**: Label shows "Debug Mode ✗ Disabled" in **orange** for 2 seconds
- Settings are **saved automatically** to localStorage
- All open tabs receive the update **instantly**

## Checking Current Debug Mode Status

### In Console:
```javascript
// Check if debug mode is enabled
Logger.debugMode  // Returns: true or false

// Or check localStorage
localStorage.getItem('meraproduct_debug')  // Returns: 'true' or null
```

### In Popup:
1. Click extension icon
2. Click ⚙️ Settings
3. Check if "Debug Mode" toggle is ON (green)

## Performance Impact

**Debug mode has minimal performance impact:**
- Logs are only written to console (not stored)
- No network requests
- No UI changes
- Safe to keep enabled

**Recommended:**
- **Enable** when testing or troubleshooting
- **Disable** for normal daily use (cleaner console)

## Console Log Levels

Debug mode shows these log types:

| Icon | Level | Color | Purpose |
|------|-------|-------|---------|
| ℹ️ | Info | Blue | General information |
| ✅ | Success | Green | Successful operations |
| ⚠️ | Warn | Orange | Warnings (not errors) |
| ❌ | Error | Red | Errors that need attention |
| 🔍 | Debug | Purple | Detailed debug info |
| 📊 | Verbose | Gray | Very detailed info |
| 📦 | Data | Cyan | Data dumps |
| ▼/▲ | Group | - | Collapsible groups |

## Common Use Cases

### 1. Product Not Saving to History?
Enable debug mode and check for:
```
⚠️ "Cannot save product - no title found"
```
This means the title selector needs adjustment.

### 2. Wrong Detection Result?
Check the analysis logs:
```
[Flipkart] ▼ Analyzing Manufacturing Info
[Flipkart] Extracted - Country: China  <-- Shows why it's not Indian
```

### 3. Badge Not Appearing?
Look for errors:
```
❌ "Error processing page: ..."
```

### 4. Slow Performance?
Check processing time:
```
[Flipkart] Waiting for modal...  <-- If stuck here, modal didn't appear
```

## Tips

1. **Always refresh the page** after enabling debug mode to see logs from the start
2. **Keep console open** (F12) while browsing to see real-time logs
3. **Use "Filter" in console** to search for specific keywords like "error" or "saved"
4. **Copy logs** when reporting bugs (right-click in console → "Save as...")
5. **Disable debug mode** when done to keep console clean

## Troubleshooting Debug Mode

### Debug mode not enabling?

**Check 1**: Verify localStorage is working
```javascript
localStorage.setItem('test', 'value')
localStorage.getItem('test')  // Should return 'value'
```

**Check 2**: Check for extension errors
- Go to `chrome://extensions/`
- Find MeraProduct
- Click "Errors" button
- Look for any red errors

**Check 3**: Reload extension
- Go to `chrome://extensions/`
- Find MeraProduct
- Click 🔄 Reload button
- Try enabling debug mode again

### Not seeing logs after enabling?

1. **Refresh the product page** (F5)
2. **Check console filter** - make sure it's set to "All levels"
3. **Check if extension is active** on the current site (only works on Flipkart/Amazon)

---

## Quick Reference Card

```
🎯 Enable Debug Mode:
   Extension Icon → ⚙️ → Debug Mode Toggle

📝 View Logs:
   Press F12 → Console tab

🔍 Filter Logs:
   Console search: [Flipkart] or [Amazon]

❌ Disable Debug Mode:
   Extension Icon → ⚙️ → Debug Mode Toggle OFF

💡 Check Status:
   Console: Logger.debugMode
```

---

**Enjoy debugging! 🐛🔍**

Debug mode helps you understand exactly what MeraProduct is doing behind the scenes!
