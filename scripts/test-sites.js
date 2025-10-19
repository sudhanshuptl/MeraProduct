const puppeteer = require('puppeteer');

/**
 * Test script to verify extension works on supported sites
 */
async function testSites() {
  console.log('🚀 Starting site compatibility tests...\n');
  
  const testUrls = [
    {
      name: 'Amazon India - Sample Product',
      url: 'https://www.amazon.in/dp/B08CF3B9N1', // Sample product URL
      site: 'amazon'
    },
    {
      name: 'Amazon.com - Sample Product',
      url: 'https://www.amazon.com/dp/B08N5WRWNW', // Sample product URL
      site: 'amazon'
    },
    {
      name: 'Flipkart - Sample Product',
      url: 'https://www.flipkart.com/samsung-galaxy-m32-light-blue-128-gb/p/itm847a64be621c4', // Sample product URL
      site: 'flipkart'
    }
  ];
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
    
    for (const testCase of testUrls) {
      console.log(`Testing: ${testCase.name}`);
      console.log(`URL: ${testCase.url}`);
      
      const page = await browser.newPage();
      
      try {
        await page.goto(testCase.url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Check if page loaded successfully
        const title = await page.title();
        console.log(`✅ Page loaded: ${title.substring(0, 50)}...`);
        
        // Check for product title (indicates it's a product page)
        const hasProductTitle = await page.evaluate(() => {
          const amazonTitle = document.querySelector('#productTitle');
          const flipkartTitle = document.querySelector('.B_NuCI, ._35KyD6');
          return !!(amazonTitle || flipkartTitle);
        });
        
        if (hasProductTitle) {
          console.log('✅ Product page detected');
        } else {
          console.log('⚠️ Could not detect product page elements');
        }
        
        // Simulate extension functionality
        console.log('🔍 Simulating extension detection...');
        
        const textContent = await page.evaluate(() => {
          const body = document.body;
          return body ? body.innerText.toLowerCase() : '';
        });
        
        const hasIndianIndicators = textContent.includes('made in india') || 
                                  textContent.includes('country of origin') ||
                                  textContent.includes('manufactured in india');
        
        if (hasIndianIndicators) {
          console.log('✅ Found potential Made in India indicators');
        } else {
          console.log('ℹ️ No obvious Made in India indicators found');
        }
        
        await page.close();
        console.log('✅ Test completed\n');
        
      } catch (error) {
        console.error(`❌ Error testing ${testCase.name}:`, error.message);
        await page.close();
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to start browser:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('🏁 Site compatibility tests completed');
  console.log('\nNext steps:');
  console.log('1. Load the extension in Chrome (chrome://extensions/)');
  console.log('2. Visit the test URLs above');
  console.log('3. Verify the extension detects Made in India products');
}

// Run if called directly
if (require.main === module) {
  testSites().catch(console.error);
}

module.exports = testSites;