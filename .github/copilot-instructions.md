# MeraProduct - AI Coding Agent Instructions

## Project Overview
MeraProduct is a Chrome extension that identifies "Made in India" products on e-commerce platforms. The extension uses **Manifest V3** architecture and focuses on DOM parsing, local processing, and privacy-first operation.

## Architecture & Core Components

### Extension Structure
- **Content Scripts**: Inject into e-commerce sites (Amazon, Flipkart) to scan product pages
- **Background Service Worker**: Handle cross-origin requests and data processing
- **Popup UI**: Display extension status and settings
- **Options Page**: User preferences and site configuration

### Key Technical Patterns

#### DOM Parsing Strategy
```javascript
// Target selectors for product origin detection
const ORIGIN_SELECTORS = {
  amazon: ['.a-row .a-text-bold:contains("Country of Origin")',
           '#feature-bullets .a-list-item:contains("Made in")'],
  flipkart: ['._2418kt', '._3Djpdu:contains("Country of Origin")']
};
```

#### Content Script Architecture
- Use `chrome.runtime.sendMessage()` for background communication
- Implement `MutationObserver` for SPA navigation detection
- Cache DOM queries to avoid repeated scanning
- Handle dynamic content loading with debounced observers

#### Privacy-First Processing
- All product analysis happens locally in browser
- No external API calls for origin detection
- Use `chrome.storage.local` for user preferences only
- Content Security Policy (CSP) compliant implementation

## Development Workflows

### Local Development Setup
```bash
# Load extension in development
chrome://extensions/ → Developer Mode → Load Unpacked

# Test on supported sites
npm run test:sites  # Opens test URLs in new tabs
```

### Testing Approach
- **Unit Tests**: Jest for utility functions and parsers
- **Integration Tests**: Puppeteer for full browser automation
- **Cross-Site Testing**: Automated tests across Amazon, Flipkart, Myntra
- **Manifest Validation**: `web-ext lint` for extension compliance

### Build Process
```bash
npm run build        # Production build with minification
npm run build:dev    # Development build with source maps
npm run package      # Create .zip for Chrome Web Store
```

## Project-Specific Conventions

### File Naming
- `content-{site}.js` for site-specific content scripts
- `utils/origin-detector.js` for core detection logic
- `ui/components/` for reusable UI elements
- `config/sites.json` for site-specific selectors

### Error Handling
```javascript
// Standard error wrapper for content scripts
try {
  detectProductOrigin();
} catch (error) {
  console.error('[MeraProduct]:', error);
  chrome.runtime.sendMessage({type: 'ERROR', error: error.message});
}
```

### Localization Strategy
- Support Hindi and English using `chrome.i18n`
- Store translations in `_locales/{locale}/messages.json`
- Use semantic keys: `"productMadeInIndia": {"message": "भारत में निर्मित"}`

## Integration Points

### E-commerce Platform Detection
- URL pattern matching for site identification
- Fallback selectors for UI changes
- Handle both desktop and mobile site variants

### Chrome Extension APIs
- `chrome.tabs`: Query active tab for product pages
- `chrome.storage.local`: User preferences and cache
- `chrome.runtime`: Message passing between components
- `chrome.scripting`: Dynamic content script injection

### Future API Integration
- Review aggregation service (Node.js backend)
- Indian alternative product suggestions
- Sentiment analysis for product reviews

## Critical Files to Understand

### `manifest.json`
- Manifest V3 configuration with proper permissions
- Content script registration for target sites
- Service worker and popup declarations

### `content/detector.js`
- Core product origin detection logic
- Site-specific parsing implementations
- Badge injection and UI updates

### `background/service-worker.js`
- Cross-origin data fetching
- Message routing between components
- Extension lifecycle management

## Development Guidelines

### Performance Considerations
- Lazy load content scripts only on product pages
- Use `requestIdleCallback()` for non-critical processing
- Implement efficient caching for repeated product visits
- Minimize DOM queries with smart selectors

### Browser Compatibility
- Target Chrome 88+ (Manifest V3 requirement)
- Test across different viewport sizes
- Handle extension contexts (incognito mode, etc.)

### Security Best Practices
- Validate all DOM content before processing
- Use `textContent` instead of `innerHTML` for safety
- Implement CSP headers for all extension pages
- Sanitize user inputs in options page

## Common Debugging Patterns

```javascript
// Debug content script injection
console.log('[MeraProduct] Script loaded on:', window.location.href);

// Monitor DOM changes
const observer = new MutationObserver((mutations) => {
  console.log('[MeraProduct] DOM changed:', mutations.length);
});
```

Always ask questions if you need clarification on any part of the codebase or architecture!stions before generating code snippets.