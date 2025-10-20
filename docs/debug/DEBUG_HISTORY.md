# 🐛 Debug Product History Feature

## Quick Test Steps

### 1. Reload Extension
```
1. Go to chrome://extensions/
2. Find "MeraProduct"
3. Click 🔄 Reload
```

### 2. Enable Debug Mode (Important!)
Open browser console (F12) and run:
```javascript
Logger.enableDebug()
```

### 3. Visit a Flipkart Product
Example product URL:
```
https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6fd4cf6593c5f
```

### 4. Check Console Logs
Look for these messages in console:
```
✅ "Product info extracted: {title: '...', hasImage: true, ...}"
✅ "Saving product to history: {...}"
✅ "Product saved to history successfully!"
```

If you see:
```
⚠️  "Cannot save product - no title found"
```
This means the title selector isn't working.

### 5. Check Storage
In console, run:
```javascript
chrome.storage.local.get('meraproduct_history', (result) => {
  console.log('History:', result.meraproduct_history);
});
```

You should see an array with your product data.

### 6. Open Extension Popup
Click the extension icon to see the popup UI.
- Should show statistics (total products, Made in India count, percentage)
- Should show product cards with names and badges
- Click any product card to revisit it

## Troubleshooting

### Problem: "Cannot save product - no title found"

**Solution 1**: Check if title element exists
```javascript
// Run in console on product page
document.querySelector('h1 span')?.textContent
```

If this returns the product name, the selector should work.

**Solution 2**: Manually check XPath
```javascript
// Run in console
document.evaluate('/html/body/div[1]/div/div[3]/div[1]/div[2]/div[2]/div/div[1]/h1/span', 
                  document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
         .singleNodeValue?.textContent
```

### Problem: Storage is empty

**Check 1**: Verify storage permissions in manifest.json
```json
"permissions": ["storage"]
```

**Check 2**: Clear and test
```javascript
// Clear storage
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});

// Then revisit a product page
```

### Problem: Popup shows "No products checked yet"

**Check 1**: Wait for page to fully load (10+ seconds)
The extension waits 10 seconds before processing the page.

**Check 2**: Verify badge appears
Look for floating badge in bottom-right corner of product page.
If no badge appears, detection isn't working.

**Check 3**: Check for errors
Open console (F12) and look for red error messages.

## Manual Storage Test

Test the storage system directly:
```javascript
// In console on any page with the extension
const testProduct = {
  name: 'Test Product',
  url: 'https://test.com/product',
  site: 'flipkart',
  isMadeInIndia: true,
  confidence: 95,
  indicator: '🇮🇳 MADE IN INDIA',
  manufacturer: 'Test Manufacturer',
  image: 'https://example.com/image.jpg'
};

// Save it
chrome.storage.local.get('meraproduct_history', (result) => {
  const history = result.meraproduct_history || [];
  history.unshift({
    id: Date.now(),
    timestamp: Date.now(),
    ...testProduct
  });
  chrome.storage.local.set({ meraproduct_history: history }, () => {
    console.log('Test product saved!');
  });
});

// Now open popup to see it
```

## Key Files to Check

1. **manifest.json** - Ensure storage.js is injected:
   ```json
   "js": ["src/utils/logger.js", "src/utils/storage.js", ...]
   ```

2. **src/utils/storage.js** - The ProductStorage class

3. **src/content/content-flipkart.js** - Lines 107-158 (insertFloatingBadge function)

4. **src/popup/popup.js** - The popup UI logic

## Expected Console Output (Debug Mode)

When everything works correctly:
```
[Flipkart] MeraProduct loaded (Debug Mode ON)
💡 Tip: Enable debug mode for detailed logs → Logger.enableDebug()
[Flipkart] Waiting for page to load...
[Flipkart] Starting detection process
[Flipkart] Starting page process...
[Flipkart] Searching entire page for Read More button
[Flipkart] Found Read More button, clicking...
[Flipkart] Click events dispatched
[Flipkart] Waiting for content to expand...
[Flipkart] Searching for Manufacturing info link...
[Flipkart] Manufacturing link found, clicking...
[Flipkart] Click dispatched
[Flipkart] Waiting for modal...
[Flipkart] Modal found
[Flipkart] Extracting modal text...
[Flipkart] ▼ Analyzing Manufacturing Info
[Flipkart] Extracted - Country: India
[Flipkart] Made in India - Country + Manufacturer (100%)
[Flipkart] ▲ (group end)
[Flipkart] Product info extracted: {title: "Apple iPhone 15...", hasImage: true, textLength: 5234}
[Flipkart] Saving product to history: {name: "Apple iPhone 15...", url: "https://...", ...}
[Flipkart] ✅ Product saved to history successfully!
```

## Quick Fixes

### Fix 1: Update product title selector
Already done! Now uses: `'h1 span, .VU-ZEz, .B_NuCI, ._35KyD6, h1.yhB1nd'`

### Fix 2: Add XPath fallback
Already done! Uses XPath as last resort.

### Fix 3: Better logging
Already done! Shows debug info about title extraction.

### Fix 4: Confidence format
Already done! Converts to percentage (0-100) for storage.

## Test Checklist

- [ ] Reload extension
- [ ] Enable debug mode (`Logger.enableDebug()`)
- [ ] Visit Flipkart product page
- [ ] Wait 10+ seconds for processing
- [ ] See badge appear (green 🇮🇳 or red 🚫)
- [ ] Check console for "Product saved to history successfully!"
- [ ] Verify storage: `chrome.storage.local.get('meraproduct_history', console.log)`
- [ ] Open extension popup
- [ ] See product card with name and badge
- [ ] Click product card → Opens product page
- [ ] Statistics show correct count

---

**If all checks pass**: Feature is working! 🎉  
**If any check fails**: See troubleshooting section above or enable debug mode for detailed logs.
