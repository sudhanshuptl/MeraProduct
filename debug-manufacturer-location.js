/**
 * Debug Script: Find Manufacturer Address on Amazon
 * 
 * USAGE:
 * 1. Open Samsung product page on Amazon
 * 2. Open Chrome DevTools Console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Share the output with me
 */

console.log('🔍 SEARCHING FOR MANUFACTURER ADDRESS ON PAGE...\n');

// Search terms that might appear in full manufacturer address
const searchTerms = [
  'Samsung India Electronics',
  'Registered Office',
  'DLF Centre',
  'Sansad Marg',
  'New Delhi',
  '110001',
  'Okhla'
];

console.log('📋 Search Terms:', searchTerms.join(', '));
console.log('\n═══════════════════════════════════════════════════\n');

// Function to search in all text nodes
function findTextInPage(searchText) {
  const results = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text.toLowerCase().includes(searchText.toLowerCase())) {
      results.push({
        text: text.substring(0, 200),
        fullText: text,
        parent: node.parentElement.tagName,
        parentClass: node.parentElement.className,
        parentId: node.parentElement.id,
        html: node.parentElement.outerHTML.substring(0, 300)
      });
    }
  }
  
  return results;
}

// Search for each term
searchTerms.forEach(term => {
  console.log(`🔎 Searching for: "${term}"`);
  const results = findTextInPage(term);
  
  if (results.length > 0) {
    console.log(`   ✅ FOUND ${results.length} occurrence(s):\n`);
    results.forEach((result, idx) => {
      console.log(`   [${idx + 1}] Parent: <${result.parent}> class="${result.parentClass}" id="${result.parentId}"`);
      console.log(`       Text preview: "${result.text}"`);
      console.log(`       Full text length: ${result.fullText.length} characters`);
      console.log(`       HTML: ${result.html}...\n`);
    });
  } else {
    console.log(`   ❌ NOT FOUND\n`);
  }
});

console.log('\n═══════════════════════════════════════════════════\n');

// Also check all TH elements for "Manufacturer"
console.log('🏭 Checking ALL <TH> elements containing "manufacturer":\n');
const allTH = document.querySelectorAll('th');
let manufacturerFound = false;

allTH.forEach((th, idx) => {
  const text = th.textContent.trim();
  if (/manufacturer/i.test(text)) {
    manufacturerFound = true;
    console.log(`[TH #${idx + 1}] Text: "${text}"`);
    console.log(`  Parent row HTML: ${th.parentElement.outerHTML.substring(0, 500)}`);
    
    // Check all cells in the row
    const row = th.parentElement;
    const cells = row.querySelectorAll('th, td');
    console.log(`  Row has ${cells.length} cells:`);
    cells.forEach((cell, cellIdx) => {
      const cellText = cell.textContent.trim();
      console.log(`    Cell #${cellIdx + 1} (${cell.tagName}): "${cellText.substring(0, 100)}${cellText.length > 100 ? '...' : ''}"`);
      console.log(`      innerHTML length: ${cell.innerHTML.length}`);
    });
    
    console.log('\n');
  }
});

if (!manufacturerFound) {
  console.log('❌ No TH elements with "manufacturer" found\n');
}

console.log('═══════════════════════════════════════════════════\n');

// Check all TD elements with "Samsung" that might have more content
console.log('📱 Checking TD elements with "Samsung":\n');
const allTD = document.querySelectorAll('td');
allTD.forEach((td, idx) => {
  const text = td.textContent.trim();
  if (text.includes('Samsung') && text.length > 20) {
    console.log(`[TD #${idx + 1}] Length: ${text.length} chars`);
    console.log(`  Text: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"`);
    console.log(`  Class: "${td.className}"`);
    console.log(`  innerHTML length: ${td.innerHTML.length}\n`);
  }
});

console.log('\n✅ SEARCH COMPLETE! Please share this output.');
