# Confidence Percentage Fix

## Issue
The stored product information was showing **confidence percentage values 100 times higher** than they should be (e.g., 9000% instead of 90%).

## Root Cause
There was a **double multiplication** issue in the confidence calculation:

1. **Content Scripts** (Amazon & Flipkart) were receiving confidence as a decimal (0-1) from `OriginDetector`
2. **Content Scripts** were then multiplying by 100 or rounding it
3. **Storage.js** was multiplying by 100 again: `Math.round((product.confidence || 0) * 100)`
4. This resulted in values being **100x too large**

## Solution

### Amazon Content Script (`src/content/content-amazon.js`)
**Before:**
```javascript
const confidence = result ? Math.round(result.confidence * 100) : 0;
const badge = detector.createFloatingBadge(isMadeInIndia, confidence / 100);
// ...
await storage.saveProduct({
  confidence: confidence, // Already multiplied by 100
  // ...
});
```

**After:**
```javascript
const confidence = result ? result.confidence : 0;
const badge = detector.createFloatingBadge(isMadeInIndia, confidence);
// ...
await storage.saveProduct({
  confidence: confidence, // Keep as 0-1, storage.js will convert
  // ...
});
```

### Flipkart Content Script (`src/content/content-flipkart.js`)
**Before:**
```javascript
const confidence = result ? result.confidence : 0;
// ...
confidence: Math.round(confidence), // Incorrect comment said "already 0-100"
```

**After:**
```javascript
const confidence = result ? result.confidence : 0;
// ...
confidence: confidence, // Confidence is 0-1, storage.js will convert to percentage
```

## How It Works Now

1. **OriginDetector** returns confidence as decimal (0-1)
2. **Content Scripts** pass confidence as-is (0-1) to `storage.saveProduct()`
3. **storage.js** converts to percentage: `Math.round((product.confidence || 0) * 100)`
4. **Popup** displays the percentage correctly: `${p.confidence}% confident`

## Data Flow
```
OriginDetector.detectFromText()
  ↓ (returns 0-1)
Content Script (Amazon/Flipkart)
  ↓ (passes 0-1)
storage.saveProduct()
  ↓ (converts to 0-100)
Chrome Storage
  ↓ (stores as 0-100)
Popup Display
  ↓ (shows as percentage)
"90% confident" ✅
```

## Testing
To verify the fix:
1. Visit an Amazon product page (e.g., Indian product)
2. Open extension popup
3. Check the confidence percentage in history
4. Should show reasonable values like "90%" not "9000%"

## Files Modified
- `src/content/content-amazon.js` - Lines 135-143
- `src/content/content-flipkart.js` - Lines 171-194

## Related Files (Not Modified)
- `src/utils/storage.js` - Correctly converts 0-1 to 0-100
- `src/popup/popup.js` - Correctly displays percentage
- `src/utils/origin-detector.js` - Correctly returns 0-1 confidence
