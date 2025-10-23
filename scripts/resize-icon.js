/**
 * Resize the MeraProduct icon to all required sizes
 * Usage: node scripts/resize-icon.js <path-to-icon>
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const SIZES = [16, 32, 48, 128];
const OUTPUT_DIRS = [
  path.join(__dirname, '../assets/icons'),
  path.join(__dirname, '../dist/assets/icons')
];

async function resizeIcon(inputPath) {
  console.log('🖼️  Loading icon from:', inputPath);
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Error: Icon file not found:', inputPath);
    process.exit(1);
  }

  try {
    // Load the original image
    const image = await loadImage(inputPath);
    console.log(`✅ Original image loaded: ${image.width}x${image.height}`);

    // Create output directories if they don't exist
    OUTPUT_DIRS.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 Created directory:', dir);
      }
    });

    // Resize and save for each size
    for (const size of SIZES) {
      console.log(`\n🔄 Creating ${size}x${size} icon...`);
      
      // Create canvas
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the resized image
      ctx.drawImage(image, 0, 0, size, size);

      // Save to both directories
      const buffer = canvas.toBuffer('image/png');
      
      for (const dir of OUTPUT_DIRS) {
        const outputPath = path.join(dir, `icon${size}.png`);
        fs.writeFileSync(outputPath, buffer);
        console.log(`   ✅ Saved: ${outputPath}`);
      }
    }

    console.log('\n🎉 All icons created successfully!');
    console.log('\n📦 Icon locations:');
    OUTPUT_DIRS.forEach(dir => {
      console.log(`   - ${dir}/`);
      SIZES.forEach(size => console.log(`     • icon${size}.png`));
    });

  } catch (error) {
    console.error('❌ Error processing icon:', error.message);
    process.exit(1);
  }
}

// Get input path from command line
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Usage: node scripts/resize-icon.js <path-to-icon>');
  console.error('   Example: node scripts/resize-icon.js ~/Downloads/meraproduct-icon.png');
  process.exit(1);
}

resizeIcon(path.resolve(inputPath));
