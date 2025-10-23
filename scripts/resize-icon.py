#!/usr/bin/env python3
"""
Resize the MeraProduct icon to all required sizes
Usage: python3 scripts/resize-icon.py <path-to-icon>
"""

import sys
import os
from PIL import Image

SIZES = [16, 32, 48, 128]
OUTPUT_DIRS = [
    'assets/icons',
    'dist/assets/icons'
]

def resize_icon(input_path):
    print(f'🖼️  Loading icon from: {input_path}')
    
    if not os.path.exists(input_path):
        print(f'❌ Error: Icon file not found: {input_path}')
        sys.exit(1)
    
    try:
        # Load the original image
        with Image.open(input_path) as img:
            print(f'✅ Original image loaded: {img.size[0]}x{img.size[1]}')
            
            # Convert to RGBA if necessary
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Create output directories if they don't exist
            for dir_path in OUTPUT_DIRS:
                os.makedirs(dir_path, exist_ok=True)
                print(f'📁 Created/verified directory: {dir_path}')
            
            # Resize and save for each size
            for size in SIZES:
                print(f'\n🔄 Creating {size}x{size} icon...')
                
                # Resize using high-quality LANCZOS resampling
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                
                # Save to both directories
                for dir_path in OUTPUT_DIRS:
                    output_path = os.path.join(dir_path, f'icon{size}.png')
                    resized.save(output_path, 'PNG', optimize=True)
                    print(f'   ✅ Saved: {output_path}')
            
            print('\n🎉 All icons created successfully!')
            print('\n📦 Icon locations:')
            for dir_path in OUTPUT_DIRS:
                print(f'   - {dir_path}/')
                for size in SIZES:
                    print(f'     • icon{size}.png')
    
    except Exception as e:
        print(f'❌ Error processing icon: {e}')
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('❌ Usage: python3 scripts/resize-icon.py <path-to-icon>')
        print('   Example: python3 scripts/resize-icon.py ~/Downloads/meraproduct-icon.png')
        sys.exit(1)
    
    input_path = os.path.abspath(sys.argv[1])
    resize_icon(input_path)
