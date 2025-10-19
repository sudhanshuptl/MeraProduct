const fs = require('fs');
const path = require('path');

/**
 * Create simple debug icons for development
 * This creates basic colored squares for testing
 */
function createDebugIcons() {
  const iconSizes = [16, 32, 48, 128];
  const iconsDir = path.join(__dirname, '../dist/assets/icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  try {
    let createCanvas;
    try {
      createCanvas = require('canvas').createCanvas;
    } catch (error) {
      console.error('🔴 Canvas package not found. Cannot generate debug icons.');
      console.error('   Please run "npm install canvas" to enable icon generation.');
      // As a fallback, create minimal 1x1 icons to prevent load failure
      createMinimalFallbackIcons(iconsDir, iconSizes);
      return;
    }
    
    console.log('🎨 Generating correctly sized debug icons...');
    
    iconSizes.forEach(size => {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Create Indian flag-inspired design
      const saffron = '#FF9933';
      const white = '#FFFFFF';
      const green = '#138808';
      
      const stripeHeight = Math.round(size / 3);
      
      ctx.fillStyle = saffron;
      ctx.fillRect(0, 0, size, stripeHeight);
      
      ctx.fillStyle = white;
      ctx.fillRect(0, stripeHeight, size, stripeHeight);
      
      ctx.fillStyle = green;
      ctx.fillRect(0, stripeHeight * 2, size, size - (stripeHeight * 2));
      
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
      console.log(`✅ Created: icon${size}.png (${size}x${size})`);
    });

    console.log('\n🎉 All debug icons created successfully!');

  } catch (e) {
    console.error('❌ An error occurred while creating debug icons:', e.message);
    createMinimalFallbackIcons(iconsDir, iconSizes);
  }
}

/**
 * Fallback to create minimal 1x1 PNGs if canvas fails
 */
function createMinimalFallbackIcons(iconsDir, iconSizes) {
    console.log('⚠️ Falling back to creating minimal 1x1 placeholder icons...');
    const orangePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/58BAzAyMDAAAAz2AQFscAr/AAAAAElFTkSuQmCC';
    const pngBuffer = Buffer.from(orangePNG, 'base64');
    
    iconSizes.forEach(size => {
        const filePath = path.join(iconsDir, `icon${size}.png`);
        fs.writeFileSync(filePath, pngBuffer);
        console.log(`✅ Created minimal fallback: icon${size}.png`);
    });
    console.log('🎉 Minimal icons created. The extension should load, but icons will be tiny.');
}

// Run the function
createDebugIcons();