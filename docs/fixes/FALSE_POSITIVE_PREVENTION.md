# False Positive Prevention Guide

## Common False Positives in Country Detection

This document lists common words that can cause false positive matches when detecting countries without proper word boundary checks.

### Indian Administrative Terms

| Word | Contains | False Match | Solution |
|------|----------|-------------|----------|
| **Taluk** | "uk" | United Kingdom | Word boundary check |
| **Tehsil** | N/A | None | Safe |
| **Mandal** | N/A | None | Safe |
| **Nagar** | N/A | None | Safe |

### Indian City/Area Names

| Word | Contains | False Match | Solution |
|------|----------|-------------|----------|
| **Chinaware** | "china" | China | Word boundary check |
| **Kochi** | N/A | None | Safe |
| **Itanagar** | "nagar" | None | Safe |

### Product Categories

| Word | Contains | False Match | Solution |
|------|----------|-------------|----------|
| **Chinaware** | "china" | China | Word boundary check |
| **Furniture** | N/A | None | Safe |
| **Kitchenware** | "china" (if "chinaware") | China | Word boundary check |

### Common Indian Place Name Components

- **Nagar** (city/town)
- **Puram** (place)
- **Bad** (city suffix, e.g., Ahmedabad)
- **Pur** (city suffix, e.g., Jaipur)
- **Taluk** (administrative division) ⚠️ Contains "uk"
- **Tehsil** (administrative division)
- **Mandal** (administrative division)
- **Gram** (village)
- **Ganj** (market area)

## Implementation Guidelines

### ✅ DO: Use Word Boundaries

```javascript
// CORRECT: Uses word boundary for single-word countries
const regex = new RegExp(`\\b${country}\\b`, 'i');
if (regex.test(text)) {
  // Match found
}
```

### ❌ DON'T: Use Simple Substring Matching

```javascript
// WRONG: Will match "uk" in "Taluk"
if (text.toLowerCase().includes('uk')) {
  // False positive!
}
```

### ✅ DO: Handle Multi-Word Countries Specially

```javascript
// For "United States", "South Korea", etc.
if (country.includes(' ')) {
  return text.toLowerCase().includes(country);
}
```

### ✅ DO: Test with Real Indian Addresses

```javascript
// Test cases
const testAddresses = [
  'Kanakapura Taluk Ramanagara Karnataka',
  'SIDCO Industrial Area Chennai Tamil Nadu',
  'MIDC Chinchpada Thane Maharashtra'
];
```

## Testing Checklist

Before deploying country detection logic:

- [ ] Test with address containing "Taluk" → Should NOT match "UK"
- [ ] Test with "Made in UK" → SHOULD match "UK"
- [ ] Test with "Chinaware" → Should NOT match "China"
- [ ] Test with "Made in China" → SHOULD match "China"
- [ ] Test with Indian state names (Karnataka, Maharashtra, etc.)
- [ ] Test with Indian city names (Bangalore, Mumbai, etc.)
- [ ] Test with Indian PIN codes (6 digits, 100000-855999)
- [ ] Test with multiple address formats (with/without commas, line breaks)

## Regex Patterns Reference

### Word Boundary Pattern
```javascript
// Matches whole words only
const pattern = /\b${country}\b/i;
```

### Common Delimiters
```javascript
// Stop at these characters when extracting
(?=\s*(?:,|;|\n|$|[A-Z]{2,}|Manufacturer|Importer|Details))
```

### Indian Address Patterns
```javascript
// Indian PIN code (6 digits)
/\b[1-8]\d{5}\b/

// State/City detection
/(maharashtra|karnataka|tamil nadu|bangalore|mumbai|delhi)/i
```

## Quick Fix: The containsCountry Function

Use this helper function for all country checks:

```javascript
const containsCountry = (text, country) => {
  if (!text) return false;
  
  // Multi-word countries: use includes
  if (country.includes(' ')) {
    return text.toLowerCase().includes(country.toLowerCase());
  }
  
  // Single-word countries: use word boundary
  const regex = new RegExp(`\\b${country}\\b`, 'i');
  return regex.test(text);
};
```

## Related Files

- `src/content/content-flipkart.js` - Main detection logic
- `src/content/content-amazon.js` - Amazon-specific detection
- `src/utils/origin-detector.js` - Generic detector
- `COUNTRY_EXTRACTION_FIX.md` - Detailed fix documentation
