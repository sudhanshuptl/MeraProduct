/**
 * Indian Locations Configuration
 * Centralized database of Indian geographic identifiers for product origin detection
 * Used by both Amazon and Flipkart content scripts
 * 
 * Last Updated: October 2025
 */

const IndianLocations = {
  
  /**
   * Indian PIN Code Validation
   * Valid range: 100000 to 855999 (6 digits)
   */
  pinCode: {
    pattern: /\b[1-8]\d{5}\b/,
    minRange: 100000,
    maxRange: 855999
  },

  /**
   * Indian Industrial Areas & Zones
   * Common industrial estates, SEZs, and manufacturing hubs
   * Add new industrial areas here as needed
   */
  industrialAreas: [
    // Specific Industrial Authorities
    'sipcot',           // State Industries Promotion Corporation of Tamil Nadu
    'sidco',            // State Industries Development Corporation
    'midc',             // Maharashtra Industrial Development Corporation
    'gidc',             // Gujarat Industrial Development Corporation
    'kasez',            // Kandla Special Economic Zone
    'seepz',            // Santacruz Electronics Export Processing Zone
    'nepz',             // Noida Export Processing Zone
    'okhla',            // Okhla Industrial Area (Delhi)
    
    // Generic Industrial Terms
    'industrial estate',
    'industrial area',
    'industrial zone',
    'industrial park',
    'industrial development area',
    'export processing zone',
    'special economic zone',
    'sez',
    'manufacturing zone',
    'production facility'
  ],

  /**
   * Major Indian Cities
   * 100+ cities including metro cities, tier-1, and tier-2 cities
   * Includes common name variations (e.g., Bengaluru/Bangalore)
   */
  majorCities: [
    // Metro Cities (including variations)
    'mumbai', 'delhi', 'new delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 
    'kolkata', 'pune', 'ahmedabad',
    
    // Tier-1 Cities
    'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 
    'bhopal', 'visakhapatnam', 'pimpri', 'chinchwad', 'patna', 'vadodara', 
    'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 
    'rajkot', 'kalyan', 'dombivli', 'vasai', 'virar', 'varanasi',
    
    // Tier-2 Cities & Important Manufacturing Hubs
    'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 
    'allahabad', 'prayagraj', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 
    'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota', 
    'chandigarh', 'guwahati', 'solapur', 'tiruchirappalli', 'trichy', 
    'mysore', 'mysuru', 'bareilly', 'aligarh', 'tiruppur', 'moradabad', 
    'jalandhar', 'bhubaneswar', 'salem', 'warangal', 'guntur', 'bhiwandi', 
    'saharanpur', 'gorakhpur', 'bikaner', 'amravati', 'noida', 'jamshedpur', 
    'bhilai', 'cuttack', 'firozabad', 'kochi', 'cochin', 'nellore', 
    'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'rourkela', 'nanded', 
    'kolhapur', 'ajmer', 'akola', 'gulbarga', 'jamnagar', 'ujjain', 'loni', 
    'siliguri', 'jhansi', 'ulhasnagar', 'jammu', 'mangalore', 'erode', 
    'belgaum', 'ambattur', 'tirunelveli', 'malegaon', 'gaya', 
    'thiruvananthapuram', 'trivandrum', 'puducherry', 'pondicherry',
    
    // Additional Manufacturing & Industrial Cities
    'vapi', 'silvassa', 'ankleshwar', 'bharuch', 'valsad', 'panipat',
    'sonipat', 'rohtak', 'bahadurgarh', 'gurgaon', 'gurugram', 'manesar',
    'neemrana', 'bhiwadi', 'alwar', 'udaipur', 'kota', 'sanganer',
    'pithampur', 'dewas', 'mandideep', 'hoshangabad', 'halol', 'himmatnagar',
    'mehsana', 'palanpur', 'gandhidham', 'mundra', 'sriperumbudur',
    'oragadam', 'irungattukottai', 'hosur', 'krishnagiri', 'ranipet',
    'ambur', 'vellore', 'karur', 'namakkal', 'dindigul', 'thoothukudi',
    'tuticorin', 'nagercoil', 'rajapalayam', 'pollachi'
  ],

  /**
   * Indian States and Union Territories
   * All 28 states and 8 union territories
   */
  states: [
    // States
    'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
    'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
    'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya',
    'mizoram', 'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim',
    'tamil nadu', 'telangana', 'tripura', 'uttar pradesh', 'uttarakhand',
    'west bengal',
    
    // Union Territories
    'andaman and nicobar islands', 'andaman', 'nicobar', 'chandigarh',
    'dadra and nagar haveli', 'dadra', 'nagar haveli', 'daman and diu',
    'daman', 'diu', 'delhi', 'jammu and kashmir', 'jammu', 'kashmir',
    'ladakh', 'lakshadweep', 'puducherry', 'pondicherry'
  ],

  /**
   * Validate if given text contains Indian address indicators
   * @param {string} addressText - The address text to validate
   * @returns {Object} - { isIndian: boolean, matchType: string, matchValue: string }
   */
  isIndianAddress(addressText) {
    if (!addressText || typeof addressText !== 'string') {
      return { isIndian: false, matchType: null, matchValue: null };
    }

    const lowerAddress = addressText.toLowerCase();

    // 1. Check for explicit "India" mention FIRST (most reliable)
    if (/\bindia\b/i.test(addressText)) {
      return { isIndian: true, matchType: 'Country', matchValue: 'India' };
    }

    // 2. Check for Indian PIN codes
    if (this.pinCode.pattern.test(addressText)) {
      const pinCode = addressText.match(this.pinCode.pattern)[0];
      const pinNum = parseInt(pinCode);
      if (pinNum >= this.pinCode.minRange && pinNum <= this.pinCode.maxRange) {
        return { isIndian: true, matchType: 'PIN Code', matchValue: pinCode };
      }
    }

    // 3. Check for Indian Industrial Areas (use regex with word boundaries)
    for (const area of this.industrialAreas) {
      const pattern = new RegExp('\\b' + area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (pattern.test(addressText)) {
        return { isIndian: true, matchType: 'Industrial Area', matchValue: area };
      }
    }

    // 4. Check for Major Indian Cities (use regex with word boundaries)
    for (const city of this.majorCities) {
      // Create regex pattern with word boundaries
      // Replace spaces with \s+ to handle multiple spaces
      const cityPattern = city.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp('\\b' + cityPattern + '\\b', 'i');
      
      if (pattern.test(addressText)) {
        return { isIndian: true, matchType: 'City', matchValue: city };
      }
    }

    // 5. Check for Indian States (use regex with word boundaries)
    for (const state of this.states) {
      const statePattern = state.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp('\\b' + statePattern + '\\b', 'i');
      
      if (pattern.test(addressText)) {
        return { isIndian: true, matchType: 'State', matchValue: state };
      }
    }

    return { isIndian: false, matchType: null, matchValue: null };
  }
};

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndianLocations;
}
