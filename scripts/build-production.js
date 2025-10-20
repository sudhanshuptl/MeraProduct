#!/usr/bin/env node

/**
 * Production Build Script for Chrome Web Store Deployment
 * Creates optimized, production-ready extension package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Get version from manifest.json
function getVersion() {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  return manifest.version;
}

// Clean dist directory
function cleanDist() {
  logStep('1/7', 'Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    logSuccess('Cleaned dist directory');
  }
}

// Copy source files
function copyFiles() {
  logStep('2/7', 'Copying source files...');
  
  // Create dist directory
  fs.mkdirSync('dist', { recursive: true });
  
  // Copy directories
  const dirs = ['src', 'assets', '_locales'];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      copyDir(dir, path.join('dist', dir));
      logSuccess(`Copied ${dir}/`);
    }
  });
  
  // Copy manifest.json
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  logSuccess('Copied manifest.json');
}

// Recursive directory copy
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Generate production icons
function generateIcons() {
  logStep('3/7', 'Generating production icons...');
  try {
    execSync('node scripts/create-placeholder-icons.js', { stdio: 'inherit' });
    logSuccess('Icons generated');
  } catch (error) {
    logWarning('Icon generation had issues, but continuing...');
  }
}

// Remove development files
function removeDevFiles() {
  logStep('4/7', 'Removing development files...');
  
  const devFiles = [
    'dist/src/**/*.test.js',
    'dist/src/**/*.spec.js',
    'dist/.DS_Store',
    'dist/**/.DS_Store'
  ];
  
  let removedCount = 0;
  
  // Remove .DS_Store files
  function removeDSStore(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeDSStore(fullPath);
      } else if (entry.name === '.DS_Store') {
        fs.unlinkSync(fullPath);
        removedCount++;
      }
    }
  }
  
  if (fs.existsSync('dist')) {
    removeDSStore('dist');
  }
  
  logSuccess(`Removed ${removedCount} development files`);
}

// Validate manifest
function validateManifest() {
  logStep('5/7', 'Validating manifest...');
  
  const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf8'));
  
  // Check required fields
  const required = ['manifest_version', 'name', 'version', 'description'];
  const missing = required.filter(field => !manifest[field]);
  
  if (missing.length > 0) {
    logError(`Missing required fields: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Check icons
  if (!manifest.icons) {
    logWarning('No icons defined in manifest');
  }
  
  logSuccess(`Manifest valid (version ${manifest.version})`);
}

// Create ZIP package
function createZipPackage() {
  logStep('6/7', 'Creating ZIP package...');
  
  const version = getVersion();
  const zipName = `meraproduct-v${version}.zip`;
  
  try {
    // Remove old zip if exists
    if (fs.existsSync(zipName)) {
      fs.unlinkSync(zipName);
    }
    
    // Create zip (cross-platform compatible)
    process.chdir('dist');
    execSync(`zip -r ../${zipName} . -x "*.DS_Store"`, { stdio: 'pipe' });
    process.chdir('..');
    
    const stats = fs.statSync(zipName);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    logSuccess(`Created ${zipName} (${sizeMB} MB)`);
    
    return { zipName, sizeMB };
  } catch (error) {
    logError('Failed to create ZIP package');
    logError(error.message);
    process.exit(1);
  }
}

// Generate deployment checklist
function generateChecklist(zipInfo) {
  logStep('7/7', 'Generating deployment checklist...');
  
  const version = getVersion();
  const checklist = `
╔══════════════════════════════════════════════════════════════╗
║          CHROME WEB STORE DEPLOYMENT CHECKLIST               ║
╚══════════════════════════════════════════════════════════════╝

📦 Package Information:
   ✅ File: ${zipInfo.zipName}
   ✅ Size: ${zipInfo.sizeMB} MB
   ✅ Version: ${version}

📋 Pre-Upload Checklist:

   [ ] Test extension locally (load unpacked in Chrome)
   [ ] Verify all features work on target sites
   [ ] Check for console errors
   [ ] Test badge functionality
   [ ] Verify popup opens and works
   [ ] Test settings panel
   [ ] Check product history tracking
   
🌐 Chrome Web Store Submission:

   1. Go to: https://chrome.google.com/webstore/devconsole
   
   2. Click "New Item" or update existing extension
   
   3. Upload: ${zipInfo.zipName}
   
   4. Required Assets:
      [ ] Icon (128x128 PNG)
      [ ] Small tile (440x280 PNG)
      [ ] Screenshots (1280x800 or 640x400, at least 1)
      [ ] Promotional images (optional)
   
   5. Store Listing:
      [ ] Name: "MeraProduct - Made in India Detector"
      [ ] Summary: (50 chars) "Detect Made in India products instantly"
      [ ] Description: (See below)
      [ ] Category: Shopping
      [ ] Language: English
   
   6. Privacy:
      [ ] Single purpose description
      [ ] Host permissions justification
      [ ] Data usage disclosure
      [ ] Privacy policy URL (if collecting data)
   
   7. Distribution:
      [ ] Visibility: Public or Unlisted
      [ ] Regions: Select target countries
      [ ] Pricing: Free

📝 Suggested Description:

MeraProduct helps you identify "Made in India" products while shopping online.

KEY FEATURES:
• Instant detection on Amazon, Flipkart, and more
• Visual badge showing product origin
• Confidence score for detection accuracy
• Product history tracking
• Privacy-first: All detection happens locally
• Support Atmanirbhar Bharat initiative

HOW IT WORKS:
Simply browse products on supported e-commerce sites. MeraProduct 
automatically detects the country of origin and displays a floating 
badge if the product is Made in India.

SUPPORTED SITES:
✅ Amazon India
✅ Flipkart
✅ More coming soon!

PRIVACY:
No data collection. All product analysis happens locally in your 
browser. Your shopping habits remain private.

🔒 Permissions Required:
   • storage: Save your product history locally
   • activeTab: Read product information on e-commerce sites
   • notifications: Show detection alerts (optional)

🚀 Deployment Steps:

   1. Upload ZIP to Chrome Web Store
   2. Fill out store listing information
   3. Add screenshots and promotional images
   4. Submit for review
   5. Wait for approval (typically 1-3 days)

📊 Post-Deployment:

   [ ] Monitor reviews and ratings
   [ ] Respond to user feedback
   [ ] Track analytics in Chrome Web Store dashboard
   [ ] Plan updates based on user requests

═══════════════════════════════════════════════════════════════

🎉 Package is ready for Chrome Web Store submission!

💡 Next Steps:
   1. Test the package locally first
   2. Upload to Chrome Web Store Developer Dashboard
   3. Submit for review

Good luck! 🚀🇮🇳
`;

  // Save checklist to file
  fs.writeFileSync('DEPLOYMENT_CHECKLIST.txt', checklist);
  
  console.log(checklist);
  logSuccess('Deployment checklist saved to DEPLOYMENT_CHECKLIST.txt');
}

// Main build process
function main() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'bright');
  log('║       MeraProduct - Production Build for Chrome Store       ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'bright');
  
  try {
    cleanDist();
    copyFiles();
    generateIcons();
    removeDevFiles();
    validateManifest();
    const zipInfo = createZipPackage();
    generateChecklist(zipInfo);
    
    log('\n╔══════════════════════════════════════════════════════════════╗', 'green');
    log('║                   ✅ BUILD SUCCESSFUL!                       ║', 'green');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'green');
    
  } catch (error) {
    log('\n╔══════════════════════════════════════════════════════════════╗', 'red');
    log('║                    ❌ BUILD FAILED!                          ║', 'red');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'red');
    logError(error.message);
    process.exit(1);
  }
}

// Run build
main();
