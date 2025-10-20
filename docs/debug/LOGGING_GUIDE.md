# 📊 Logging Guide - Simple & Clean

## Default Mode (Info Only) 🎯

### What You See:
```
ℹ️ [Flipkart] MeraProduct loaded
💡 Tip: Enable debug mode for detailed logs → Logger.enableDebug()
✅ [Flipkart] Made in India - Country + Manufacturer (100%)
```

**OR**

```
⚠️ [Flipkart] NOT Made in India - Country: China
```

### Key Points:
- **Clean**: Only 2-3 logs total
- **User-focused**: Shows results only
- **No technical details**: Perfect for normal browsing
- **Default**: Works out of the box

---

## Debug Mode (Full Details) 🔍

### How to Enable:
Open Console (F12) and type:
```javascript
Logger.enableDebug()
```

### What You See:
```
ℹ️ [Flipkart] MeraProduct loaded (Debug Mode ON)
🔍 [Flipkart] Starting page process...
🔍 [Flipkart] Specifications section found
🔍 [Flipkart] Found Read More button, clicking...
🔍 [Flipkart] Click events dispatched
🔍 [Flipkart] Waiting for content to expand...
🔍 [Flipkart] Searching for Manufacturing info link...
🔍 [Flipkart] Manufacturing link found, clicking...
🔍 [Flipkart] Waiting for modal...
🔍 [Flipkart] Modal found
🔍 [Flipkart] Analyzing Manufacturing Info
   🔍 [Flipkart] Extracted - Country: India
   🔍 [Flipkart] Extracted - Manufacturer: TTK PRESTIGE HOSUR 635126
   🔍 [Flipkart] Country of Origin: India? true
   🔍 [Flipkart] Indian PIN code detected: 635126
   🔍 [Flipkart] Indian city detected: hosur
   🔍 [Flipkart] Manufacturer is Indian? true
   ✅ [Flipkart] Made in India - Country + Manufacturer (100%)
```

### How to Disable:
```javascript
Logger.disableDebug()
```

---

## Quick Reference Card

| Command | What It Does |
|---------|-------------|
| `Logger.enableDebug()` | **Turn ON** detailed logs |
| `Logger.disableDebug()` | **Turn OFF** detailed logs |
| No command | **Default** - Clean info only |

---

## Log Levels Explained

### 🎯 INFO LEVEL (Always Shown)
**What:** Important user-facing events  
**When:** Script loaded, URL changed  
**Example:** `ℹ️ [Flipkart] MeraProduct loaded`

### ✅ SUCCESS LEVEL (Always Shown)
**What:** Made in India detected  
**When:** Product is Indian  
**Example:** `✅ [Flipkart] Made in India - Country + Manufacturer (100%)`

### ⚠️ WARNING LEVEL (Always Shown)
**What:** NOT Made in India  
**When:** Product is foreign  
**Example:** `⚠️ [Flipkart] NOT Made in India - Country: China`

### ❌ ERROR LEVEL (Always Shown)
**What:** Technical errors  
**When:** Something breaks  
**Example:** `❌ [Flipkart] Error processing page: ...`

### 🔍 DEBUG LEVEL (Debug Mode Only)
**What:** Step-by-step process  
**When:** You want to see what's happening  
**Example:** `🔍 [Flipkart] Found Read More button, clicking...`

### 📝 VERBOSE LEVEL (Debug Mode Only)
**What:** Raw data and details  
**When:** You need to see actual content  
**Example:** `📝 [Flipkart] Modal text (first 300 chars): ...`

---

## Real-World Examples

### Example 1: Normal User (Info Mode)
**Console:**
```
ℹ️ [Flipkart] MeraProduct loaded
💡 Tip: Enable debug mode for detailed logs → Logger.enableDebug()
✅ [Flipkart] Made in India - Country + Manufacturer (100%)
```

**Badge:** 🇮🇳 Green "MADE IN INDIA"  
**Clean & Simple!** ✨

---

### Example 2: Developer (Debug Mode)
**Console:**
```
ℹ️ [Flipkart] MeraProduct loaded (Debug Mode ON)
🔍 [Flipkart] Starting page process...
🔍 [Flipkart] Specifications section found
[... 50 more detailed logs ...]
🔍 [Flipkart] Extracted - Country: China
⚠️ [Flipkart] NOT Made in India - Country: China
```

**Badge:** 🚫 Red "NOT MADE IN INDIA"  
**Full Details!** 🔍

---

## Mode Comparison

### Info Mode (Default)
| Feature | Status |
|---------|--------|
| Logs per page | 2-3 |
| Technical details | Hidden |
| Result shown | ✅ Yes |
| Suitable for | All users |
| Performance | Perfect |

### Debug Mode (Optional)
| Feature | Status |
|---------|--------|
| Logs per page | 30-50 |
| Technical details | Shown |
| Result shown | ✅ Yes |
| Suitable for | Developers |
| Performance | Negligible impact |

---

## Tips & Tricks

### 💡 Tip 1: One Command Toggle
Debug mode on/off with just one command - no need to edit code!

### 💡 Tip 2: Persistent Setting
Your choice is saved - stays active across page reloads!

### 💡 Tip 3: Easy Sharing
Having an issue? Enable debug mode, copy console logs, share with support.

### 💡 Tip 4: Clear Console
Press `Ctrl+L` (Windows/Linux) or `Cmd+K` (Mac) to clear logs anytime.

### 💡 Tip 5: Grouped Logs
Debug mode uses collapsible groups - click ▶ to expand/collapse.

---

## Troubleshooting

### Q: I don't see any logs
**A:** Open DevTools (F12) → Console tab

### Q: Too many logs!
**A:** Run `Logger.disableDebug()`

### Q: Debug mode not working
**A:** Make sure you typed it correctly and refreshed the page

### Q: Logs disappeared
**A:** Console might be cleared - reload page to see logs again

---

## For Normal Users ✨

**Just browse!** The extension works silently. You'll only see:
- Green badge 🇮🇳 = Made in India
- Red badge 🚫 = NOT Made in India

Console shows minimal info - no clutter!

---

## For Developers 🛠️

**Enable debug mode** to see:
- Every button click
- Every search attempt
- Extracted data
- Detection logic
- Why a decision was made

Perfect for troubleshooting!

---

## Summary

- **Default = Clean** (2-3 logs)
- **Debug = Detailed** (30-50 logs)
- **Toggle = Easy** (one command)
- **Persistent = Convenient** (stays enabled)
- **User-focused = Results matter** ✨

Enjoy a clean, powerful logging experience! 🎉
