# Quick Reference: Indian Locations Configuration

## 📍 File Location
```
src/config/indian-locations.js
```

## 🎯 Purpose
Single configuration file containing all Indian geographic data (PIN codes, industrial areas, cities, states) used by both Amazon and Flipkart content scripts.

## 📊 What's Inside

| Category | Count | Examples |
|----------|-------|----------|
| **PIN Codes** | 755,999 range | 100000 to 855999 |
| **Industrial Areas** | 13+ | SIPCOT, SIDCO, MIDC, GIDC, Okhla, SEEPZ, NEPZ, SEZ |
| **Major Cities** | 100+ | Mumbai, Delhi, Bangalore, Pune, Ahmedabad, Surat |
| **States & UTs** | 35+ | Maharashtra, Tamil Nadu, Karnataka, Kerala, Gujarat |

## ⚡ Quick Add Guide

### Add Industrial Area
```javascript
// Line ~20 in src/config/indian-locations.js
industrialAreas: [
  'sipcot',
  'your-area-here',  // ← Add in lowercase
  ...
]
```

### Add City
```javascript
// Line ~50 in src/config/indian-locations.js
majorCities: [
  'mumbai',
  'yourcity',  // ← Add in lowercase
  ...
]
```

### Add State
```javascript
// Line ~115 in src/config/indian-locations.js
states: [
  'maharashtra',
  'your state',  // ← Add in lowercase
  ...
]
```

## 🔍 API Usage

```javascript
// Check if address is Indian
const result = IndianLocations.isIndianAddress("MIDC Pune, Maharashtra 411019");

// Returns:
{
  isIndian: true,
  matchType: "Industrial Area",  // or "PIN Code", "City", "State", "Country"
  matchValue: "midc"
}
```

## 🧪 Testing

1. **Add your location** to appropriate array
2. **Save** `src/config/indian-locations.js`
3. **Reload** extension in `chrome://extensions/`
4. **Visit** product page with that location
5. **Open** console (F12)
6. **Enable** Debug Mode in extension settings
7. **Check** for: `📍 Found Indian address: [Type] = [value]`

## 📖 Full Documentation

- **Main Guide**: See "🗺️ Indian Locations Configuration" in [README.md](../README.md)
- **Technical Details**: See [CENTRALIZED_CONFIG_UPDATE.md](../CENTRALIZED_CONFIG_UPDATE.md)
- **Inline Docs**: See comments in `src/config/indian-locations.js`

## 🎨 Detection Order

The function checks in this order (first match wins):

1. ✅ **PIN Code** (6 digits, 100000-855999)
2. ✅ **Industrial Area** (SIPCOT, MIDC, etc.)
3. ✅ **City** (Mumbai, Bangalore, etc.)
4. ✅ **State** (Maharashtra, etc.)
5. ✅ **Country** ("India" explicitly)

## 🔧 Used By

- `src/content/content-amazon.js` → Amazon product detection
- `src/content/content-flipkart.js` → Flipkart product detection
- Future: Myntra, other e-commerce platforms

## 💡 Benefits

✅ **Add once, works everywhere** (Amazon + Flipkart)  
✅ **No code duplication** (88% reduction)  
✅ **Easy updates** (one file to maintain)  
✅ **Consistent detection** (same logic everywhere)  
✅ **Better logging** (shows what matched)  

## 🚨 Important Notes

- **Always lowercase**: Add locations in lowercase
- **Reload required**: After changes, reload extension
- **Test thoroughly**: Check on real product pages
- **No breaking changes**: Existing detection still works

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Branch**: amazon_basic_feature
