#!/bin/bash
# Generate simple placeholder icons using ImageMagick (if available)
# Run: bash generate-icons.sh

GRAY="#999999"
BLUE="#1976d2"

if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Please install it or create icons manually."
    echo "Creating minimal placeholder PNGs..."
    
    # Create minimal 1x1 PNGs using printf
    printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > tab-hero.png
    cp tab-hero.png tab-hero-active.png
    cp tab-hero.png tab-favorite.png
    cp tab-hero.png tab-favorite-active.png
    cp tab-hero.png tab-about.png
    cp tab-hero.png tab-about-active.png
    cp tab-hero.png hero-placeholder.png
    
    echo "Created minimal placeholder PNGs. Replace with actual icons for production."
    exit 0
fi

# Generate with ImageMagick
echo "Generating placeholder icons..."

convert -size 81x81 xc:"$GRAY" tab-hero.png
convert -size 81x81 xc:"$BLUE" tab-hero-active.png
convert -size 81x81 xc:"$GRAY" tab-favorite.png
convert -size 81x81 xc:"$BLUE" tab-favorite-active.png
convert -size 81x81 xc:"$GRAY" tab-about.png
convert -size 81x81 xc:"$BLUE" tab-about-active.png
convert -size 200x200 xc:"#cccccc" hero-placeholder.png

echo "Placeholder icons created!"
