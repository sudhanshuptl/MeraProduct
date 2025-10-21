# Debug: Manufacturer Extraction Issue

## Problem
Only extracting `"‎Stylista Home Furnishing"` instead of full address with Okhla.

## Steps to Debug

### 1. Check Actual HTML Structure

Open the product page and run this in console:

```javascript
// Find all TH elements with "Manufacturer"
const ths = document.querySelectorAll('th');
ths.forEach((th, i) => {
  if (th.textContent.toLowerCase().includes('manufacturer')) {
    console.log(`\n=== TH ${i} ===`);
    console.log('TH text:', th.textContent.trim());
    console.log('TH HTML:', th.innerHTML);
    
    // Check next sibling
    const nextSib = th.nextElementSibling;
    if (nextSib) {
      console.log('\nNext Sibling Tag:', nextSib.tagName);
      console.log('Next Sibling Classes:', nextSib.className);
      console.log('Next Sibling Text:', nextSib.textContent.trim());
      console.log('Next Sibling Text Length:', nextSib.textContent.trim().length);
      console.log('Next Sibling HTML:', nextSib.innerHTML);
      
      // Check if there are child elements
      const children = nextSib.children;
      console.log('Number of child elements:', children.length);
      if (children.length > 0) {
        Array.from(children).forEach((child, j) => {
          console.log(`  Child ${j}:`, child.tagName, child.textContent.trim());
        });
      }
    }
    
    // Check parent row
    const row = th.parentElement;
    if (row) {
      console.log('\nParent Row HTML:', row.innerHTML);
      const cells = row.querySelectorAll('th, td');
      console.log('All cells in row:', cells.length);
      cells.forEach((cell, j) => {
        console.log(`  Cell ${j} (${cell.tagName}):`, cell.textContent.trim().substring(0, 100));
      });
    }
  }
});
```

### 2. Check What's Being Extracted

```javascript
// Simulate the extraction logic
const th = Array.from(document.querySelectorAll('th')).find(el => 
  el.textContent.toLowerCase().trim() === 'manufacturer'
);

if (th) {
  console.log('Found TH:', th.textContent);
  
  // Method 1: Next element sibling
  const nextSib = th.nextElementSibling;
  if (nextSib) {
    const extracted1 = nextSib.textContent.trim();
    console.log('\nMethod 1 - nextElementSibling:');
    console.log('  Extracted:', extracted1);
    console.log('  Length:', extracted1.length);
    console.log('  Has comma?', extracted1.includes(','));
    console.log('  Has Okhla?', extracted1.toLowerCase().includes('okhla'));
  }
  
  // Method 2: Parent row cells
  const row = th.parentElement;
  if (row) {
    const allCells = row.querySelectorAll('th, td');
    const thIndex = Array.from(allCells).indexOf(th);
    if (thIndex !== -1 && thIndex + 1 < allCells.length) {
      const nextCell = allCells[thIndex + 1];
      const extracted2 = nextCell.textContent.trim();
      console.log('\nMethod 2 - Next cell in row:');
      console.log('  Extracted:', extracted2);
      console.log('  Length:', extracted2.length);
      console.log('  Has comma?', extracted2.includes(','));
      console.log('  Has Okhla?', extracted2.toLowerCase().includes('okhla'));
    }
  }
}
```

### 3. Check for Hidden Elements

```javascript
// Check if text is split across multiple elements
const td = document.querySelector('td.prodDetAttrValue');
if (td) {
  console.log('TD full text:', td.textContent);
  console.log('TD innerHTML:', td.innerHTML);
  
  // Check if there are spans or divs inside
  const spans = td.querySelectorAll('span');
  const divs = td.querySelectorAll('div');
  
  console.log('Spans inside TD:', spans.length);
  spans.forEach((span, i) => console.log(`  Span ${i}:`, span.textContent.trim()));
  
  console.log('Divs inside TD:', divs.length);
  divs.forEach((div, i) => console.log(`  Div ${i}:`, div.textContent.trim()));
}
```

## Possible Issues

1. **Multiple Elements**: Text might be split across multiple `<span>` or `<div>` elements inside the `<td>`
2. **Hidden Elements**: Some text might be in hidden elements (display: none)
3. **Truncation in Amazon's HTML**: Amazon might show abbreviated text by default
4. **JavaScript Rendering**: Full address might load after initial page load

## Next Steps

Run the debug scripts above and share the output. This will help identify exactly where the text is being cut off.
