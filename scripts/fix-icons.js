const fs = require('fs');
const path = require('path');

/**
 * Create minimal valid PNG files for Chrome extension
 * Creates simple valid PNG files that Chrome can load
 */
function createValidPNGIcons() {
  const iconSizes = [16, 32, 48, 128];
  const iconsDir = path.join(__dirname, '../dist/assets/icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Minimal valid 1x1 pixel transparent PNG file
  const transparentPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hityUwAAAABJRU5ErkJggg==';
  
  // Minimal valid 1x1 pixel orange PNG file
  const orangePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/58BAzAyMDAAAAz2AQFscAr/AAAAAElFTkSuQmCC';
  
  // Use orange PNG for visibility
  const pngBuffer = Buffer.from(orangePNG, 'base64');
  
  console.log('Creating valid PNG icons for Chrome extension...');
  
  iconSizes.forEach(size => {
    const filePath = path.join(iconsDir, `icon${size}.png`);
    
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`✅ Created: icon${size}.png`);
  });
  
  console.log('');
  console.log('🎉 All PNG icons created successfully!');
  console.log('📁 Icons location:', iconsDir);
  console.log('🔄 Chrome extension should now load without icon errors!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Go to chrome://extensions/');
  console.log('   2. Enable Developer mode');
  console.log('   3. Click "Load unpacked"');
  console.log('   4. Select the dist/ folder');
}

// Run the function
createValidPNGIcons();