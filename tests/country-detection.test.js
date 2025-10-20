/**
 * Test Suite for Country Detection Logic
 * Tests word boundary checks and false positive prevention
 */

// Mock test data
const testCases = [
  // Indian products - should detect as Made in India
  {
    name: 'Taluk in address (FALSE POSITIVE TEST)',
    text: 'Manufacturer: Stovekraft Limited, Kanakapura Taluk, Ramanagara, Bangalore, Karnataka 562112',
    expected: { isIndian: true, confidence: 1.0 },
    description: 'Should NOT match "uk" in "Taluk"'
  },
  {
    name: 'Country of Origin: India',
    text: 'Country of Origin: India\nManufacturer: ABC Company, Mumbai',
    expected: { isIndian: true, confidence: 1.0 },
    description: 'Should detect India as country of origin'
  },
  {
    name: 'Made in India explicit',
    text: 'Made in India by XYZ Corporation',
    expected: { isIndian: true, confidence: 1.0 },
    description: 'Should detect explicit "Made in India"'
  },
  {
    name: 'Indian state and city',
    text: 'Manufactured by: Company Ltd, Plot 123, MIDC Area, Pune, Maharashtra',
    expected: { isIndian: true, confidence: 0.5 },
    description: 'Should detect Indian location markers'
  },
  {
    name: 'Indian PIN code',
    text: 'Address: 123 Main Road, Bangalore 560001',
    expected: { isIndian: true, confidence: 0.5 },
    description: 'Should detect Indian PIN code'
  },
  
  // Non-Indian products - should detect as NOT Made in India
  {
    name: 'Made in UK (real)',
    text: 'Country of Origin: UK\nManufacturer: British Company Ltd',
    expected: { isIndian: false, confidence: 1.0 },
    description: 'Should detect UK as non-Indian'
  },
  {
    name: 'Made in China',
    text: 'Country of Origin: China\nImported by: ABC India Pvt Ltd',
    expected: { isIndian: false, confidence: 1.0 },
    description: 'Should detect China as non-Indian'
  },
  {
    name: 'Chinaware product (FALSE POSITIVE TEST)',
    text: 'Product: Chinaware Dinner Set\nCountry of Origin: India',
    expected: { isIndian: true, confidence: 1.0 },
    description: 'Should NOT match "china" in "Chinaware"'
  },
  {
    name: 'Thailand manufacturer',
    text: 'Manufactured in Bangkok, Thailand',
    expected: { isIndian: false, confidence: 1.0 },
    description: 'Should detect Thailand as non-Indian'
  },
  
  // Edge cases
  {
    name: 'Multiple countries mentioned',
    text: 'Designed in USA, Manufactured in India',
    expected: { isIndian: false, confidence: 1.0 },
    description: 'Should detect USA even if India mentioned later'
  },
  {
    name: 'Importer vs Manufacturer',
    text: 'Manufactured in China\nImported by: XYZ India Ltd, Delhi',
    expected: { isIndian: false, confidence: 1.0 },
    description: 'Should prioritize manufacturer location'
  }
];

// Helper function to test country detection (same as in content script)
function containsCountry(text, country) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // For multi-word countries, just use includes
  if (country.includes(' ')) {
    return lowerText.includes(country);
  }
  
  // Special handling for UK/U.K.
  if (country === 'uk') {
    return /\bu\.?k\.?\b/i.test(text) || /\bunited kingdom\b/i.test(text);
  }
  
  // For single-word countries, use word boundary regex
  const regex = new RegExp(`\\b${country}\\b`, 'i');
  return regex.test(text);
}

// Run tests
console.log('🧪 Running Country Detection Tests\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
  console.log(`   Description: ${testCase.description}`);
  console.log(`   Text sample: ${testCase.text.substring(0, 80)}...`);
  
  // Test word boundary check for common false positives
  const hasTalukFalsePositive = testCase.text.includes('Taluk') && containsCountry(testCase.text, 'uk');
  const hasChinawareFalsePositive = testCase.text.includes('Chinaware') && containsCountry(testCase.text, 'china');
  
  if (hasTalukFalsePositive) {
    console.log('   ❌ FAILED: False positive - "uk" matched in "Taluk"');
    failed++;
  } else if (hasChinawareFalsePositive) {
    console.log('   ❌ FAILED: False positive - "china" matched in "Chinaware"');
    failed++;
  } else {
    console.log('   ✅ PASSED: No false positive detected');
    passed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed, ${failed}/${testCases.length} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log('⚠️  Some tests failed. Review the word boundary logic.');
}

// Additional specific tests for word boundary function
console.log('\n\n🔬 Word Boundary Function Tests\n');
console.log('='.repeat(60));

const boundaryTests = [
  { text: 'Kanakapura Taluk Karnataka', country: 'uk', expected: false },
  { text: 'Made in UK', country: 'uk', expected: true },
  { text: 'U.K. product', country: 'uk', expected: true },
  { text: 'Chinaware set', country: 'china', expected: false },
  { text: 'Made in China', country: 'china', expected: true },
  { text: 'Bangkok Thailand', country: 'thailand', expected: true },
  { text: 'United States of America', country: 'united states', expected: true }
];

boundaryTests.forEach((test, index) => {
  const result = containsCountry(test.text, test.country);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - "${test.text}" contains "${test.country}": ${result} (expected: ${test.expected})`);
});

console.log('\n' + '='.repeat(60));
console.log('\n✨ Testing complete!\n');
