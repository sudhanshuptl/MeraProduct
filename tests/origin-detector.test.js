/**
 * Unit tests for MeraProduct Origin Detector
 */

const OriginDetector = require('../src/utils/origin-detector');

describe('OriginDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new OriginDetector();
  });

  describe('detectFromText', () => {
    test('should detect strong Indian indicators', () => {
      const result = detector.detectFromText('Made in India product description');
      
      expect(result.isIndian).toBe(true);
      expect(result.confidence).toBe(0.9);
      expect(result.indicator).toBe('made in india');
    });

    test('should detect weak Indian indicators', () => {
      const result = detector.detectFromText('This is an Indian manufactured product');
      
      expect(result.isIndian).toBe(true);
      expect(result.confidence).toBe(0.6);
      expect(result.indicator).toBe('indian');
    });

    test('should return false for non-Indian products', () => {
      const result = detector.detectFromText('Made in China product');
      
      expect(result.isIndian).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should handle empty text', () => {
      const result = detector.detectFromText('');
      
      expect(result.isIndian).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should handle null text', () => {
      const result = detector.detectFromText(null);
      
      expect(result.isIndian).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should detect Hindi indicators', () => {
      const result = detector.detectFromText('भारत में निर्मित उत्पाद');
      
      expect(result.isIndian).toBe(true);
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('extractManufacturer', () => {
    test('should extract manufacturer from standard format', () => {
      const manufacturer = detector.extractManufacturer('Manufacturer: Tata Industries Ltd');
      
      expect(manufacturer).toBe('Tata Industries Ltd');
    });

    test('should extract brand information', () => {
      const manufacturer = detector.extractManufacturer('Brand: Patanjali Products');
      
      expect(manufacturer).toBe('Patanjali Products');
    });

    test('should handle "made by" format', () => {
      const manufacturer = detector.extractManufacturer('Made by Reliance Industries');
      
      expect(manufacturer).toBe('Reliance Industries');
    });

    test('should return null for no manufacturer info', () => {
      const manufacturer = detector.extractManufacturer('Just a product description');
      
      expect(manufacturer).toBeNull();
    });

    test('should handle empty text', () => {
      const manufacturer = detector.extractManufacturer('');
      
      expect(manufacturer).toBeNull();
    });
  });

  describe('createIndianBadge', () => {
    test('should create badge element', () => {
      const badge = detector.createIndianBadge();
      
      expect(badge.className).toBe('meraproduct-badge');
      expect(badge.innerHTML).toContain('🇮🇳');
      expect(badge.innerHTML).toContain('Made in India');
    });

    test('should have correct attributes', () => {
      const badge = detector.createIndianBadge();
      
      expect(badge.getAttribute('title')).toContain('Support Atmanirbhar Bharat');
    });
  });

  describe('debounce', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = detector.debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
  });
});

describe('Integration Tests', () => {
  test('should work with typical Amazon product text', () => {
    const detector = new OriginDetector();
    const amazonText = `
      Product Title: Organic Turmeric Powder
      Brand: Tata Sampann
      Country of Origin: India
      Manufactured by: Tata Consumer Products
    `;
    
    const result = detector.detectFromText(amazonText);
    const manufacturer = detector.extractManufacturer(amazonText);
    
    expect(result.isIndian).toBe(true);
    expect(result.confidence).toBe(0.9);
    expect(manufacturer).toBe('Tata Consumer Products'); // This should pass now
  });

  test('should work with typical Flipkart product text', () => {
    const detector = new OriginDetector();
    const flipkartText = `
      Patanjali Ayurveda Aloe Vera Gel
      Highlights:
      - Natural and Pure
      - Made in India
      - Suitable for all skin types
    `;
    
    const result = detector.detectFromText(flipkartText);
    
    expect(result.isIndian).toBe(true);
    expect(result.confidence).toBe(0.9);
  });
});