# 🔧 Debug Mode & Logging System

## Overview

MeraProduct now has a **smart logging system** with two modes:

### **Production Mode** (Default)
- ℹ️ **Info**: Important events only
- ✅ **Success**: Made in India detected
- ⚠️ **Warning**: NOT Made in India
- ❌ **Error**: Technical errors

### **Debug Mode** (Optional)
- 🔍 **Debug**: Detailed step-by-step process
- 📝 **Verbose**: Raw data extraction
- All production logs included

---

## How to Enable Debug Mode

### **Method 1: Console Command** (Recommended)
Open browser console and type:
```javascript
Logger.enableDebug()
```

**Output:**
```
🐛 [MeraProduct] Debug mode ENABLED. Reload the page to see detailed logs.
```

Then **reload the product page** to see detailed logs.

### **Method 2: Disable Debug Mode**
```javascript
Logger.disableDebug()
```

---

## Log Examples

### **Production Mode (Default)**

```
ℹ️ [Flipkart] Script loaded on: https://www.flipkart.com/product/p/123
✅ [Flipkart] Made in India - Country + Manufacturer (100%)
```

**Or for non-Indian products:**
```
⚠️ [Flipkart] NOT Made in India - Country: China
```

### **Debug Mode (Detailed)**

```
ℹ️ [Flipkart] Script loaded on: https://www.flipkart.com/product/p/123
🔍 [Flipkart] Starting page process...
🔍 [Flipkart] Specifications section found
🔍 [Flipkart] Found Read More button, clicking...
🔍 [Flipkart] Click events dispatched
🔍 [Flipkart] Waiting for content to expand...
📝 [Flipkart] Found 12 elements with manufacturing keywords
📝 [Flipkart]   - Manufacturing, Packaging and Import Info
🔍 [Flipkart] Analyzing Manufacturing Info
   🔍 [Flipkart] Modal text (first 300 chars): Generic NameHeadphones...
   🔍 [Flipkart] Extracted - Country: China
   🔍 [Flipkart] Extracted - Manufacturer: Shenzen Chino E-Communication...
   ⚠️ [Flipkart] NOT Made in India - Country: China
```

---

## Log Levels Explained

### **Always Shown (Production)**

#### ℹ️ **Info**
Important milestones:
- Script loaded
- Detection started
- Major state changes

#### ✅ **Success**
Positive outcomes:
- Made in India detected
- Shows confidence level
- Shows detection method

#### ⚠️ **Warning**
Important alerts:
- NOT Made in India
- Shows reason (Country: China, etc.)
- No Indian indicators found

#### ❌ **Error**
Technical issues:
- Button click failures
- Modal detection failures
- Network errors

### **Debug Mode Only**

#### 🔍 **Debug**
Step-by-step process:
- Button searches
- Click attempts
- Modal waiting
- Detection logic flow

#### 📝 **Verbose**
Raw data:
- HTML snippets
- Extracted text
- Element counts
- Full modal content

---

## Use Cases

### **For Normal Users**
- Keep debug mode **OFF** (default)
- See only important results
- Clean, minimal console

### **For Developers / Debugging**
- Enable debug mode
- See full detection process
- Identify why detection succeeded/failed
- Find missing manufacturers

### **For Reporting Issues**
1. Enable debug mode
2. Reproduce the issue
3. Copy console logs
4. Share with developers

---

## Grouped Logs (Debug Mode)

Debug mode uses **collapsible groups** for organization:

```
▶ 🔍 [Flipkart] Analyzing Manufacturing Info
    🔍 [Flipkart] Modal text (first 300 chars): ...
    🔍 [Flipkart] Extracted - Country: India
    🔍 [Flipkart] Extracted - Manufacturer: TTK PRESTIGE...
    🔍 [Flipkart] Country of Origin: India? true
    🔍 [Flipkart] Manufacturer is Indian? true
    ✅ [Flipkart] Made in India - Country + Manufacturer (100%)
```

Click ▶ to expand/collapse for clean viewing.

---

## Performance Impact

### **Production Mode**
- **Minimal**: ~5-10 logs per page
- No performance impact
- Suitable for all users

### **Debug Mode**
- **Verbose**: ~50-100 logs per page
- Negligible performance impact
- Only affects console, not page speed

---

## Configuration Persistence

Debug mode setting is stored in `localStorage`:
- **Persists across page reloads**
- **Persists across browser sessions**
- **Per-domain** (Flipkart and Amazon separate)

To reset:
```javascript
localStorage.removeItem('meraproduct_debug')
```

---

## Quick Reference

| Command | Action |
|---------|--------|
| `Logger.enableDebug()` | Turn ON debug mode |
| `Logger.disableDebug()` | Turn OFF debug mode |
| `localStorage.getItem('meraproduct_debug')` | Check current state |
| Clear console | `Ctrl+L` or `Cmd+K` |

---

## Example Workflow

### **Debugging a Product**

1. **Open Console** (F12 or Right-click → Inspect)

2. **Enable Debug Mode**
   ```javascript
   Logger.enableDebug()
   ```

3. **Reload Page** (F5)

4. **Watch Logs** as detection runs

5. **Analyze Results**
   - If Made in India → Check confidence level
   - If NOT Made in India → Check which step detected foreign origin
   - If unsure → Check extracted data

6. **Disable Debug Mode** (optional)
   ```javascript
   Logger.disableDebug()
   ```

---

## Troubleshooting

### **No Logs Appearing**
- Check console is open (F12)
- Check correct tab (Console, not Elements)
- Reload the page after enabling debug

### **Too Many Logs**
- Disable debug mode: `Logger.disableDebug()`
- Refresh page

### **Debug Mode Not Working**
- Check command typed correctly
- Should see confirmation message
- Clear browser cache if issues persist

---

## Benefits

✅ **Clean by default** - Users see only important info  
✅ **Powerful debugging** - Developers see everything  
✅ **Easy toggle** - No code changes needed  
✅ **Organized logs** - Grouped and emoji-coded  
✅ **Production-ready** - Minimal overhead  
✅ **Persistent** - Settings remembered  

---

## Log Color Coding (in Console)

- **Blue ℹ️** = Info (neutral)
- **Green ✅** = Success (Made in India)
- **Yellow ⚠️** = Warning (NOT Made in India)
- **Red ❌** = Error (technical issue)
- **Gray 🔍📝** = Debug/Verbose (detailed)

This makes it easy to scan logs at a glance!
