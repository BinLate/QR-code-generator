# QR Code Generator Chrome Extension

A Chrome extension for generating and decoding QR codes with bilingual support (Vietnamese/English).

## Features

- **Generate QR Codes**: Create QR codes from text or URLs
- **Decode QR Codes**: Upload or paste images to decode QR codes
- **Bilingual Support**: Vietnamese and English interface
- **No Permissions**: Only requires storage permission for language preference
- **Modern UI**: Clean, responsive design

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

## Usage

### Generate QR Code
1. Click the extension icon
2. Enter text or URL in the input field
3. Click "Generate QR Code"
4. Download or copy the generated QR code

### Decode QR Code
1. Switch to the "Decode QR" tab
2. Upload an image file or paste from clipboard
3. View the decoded content
4. Copy the decoded text

### Language Toggle
- Click the language button (VI/EN) in the header to switch languages
- Your preference will be saved automatically

## File Structure

```
qr-code-generator/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── popup.js              # Core functionality
├── styles.css            # Styling
├── libs/
│   ├── qrcode.min.js     # QR code generation library
│   └── jsQR.js           # QR code decoding library
├── icons/
│   ├── icon-16.png       # 16x16 icon
│   ├── icon-48.png       # 48x48 icon
│   └── icon-128.png      # 128x128 icon
└── README.md
```

## Icon Setup

**Important**: You need to create the icon files manually:

1. Create three icon files:
   - `icons/icon-16.png` (16x16 pixels)
   - `icons/icon-48.png` (48x48 pixels)  
   - `icons/icon-128.png` (128x128 pixels)

2. Use any QR code icon or create simple icons with:
   - Blue background (#4285f4)
   - White QR code pattern
   - Square format

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension format)
- **Permissions**: Only `storage` (for language preference)
- **Libraries**: 
  - qrcode.js for QR generation
  - jsQR for QR decoding
- **Browser Support**: Chrome, Edge, and other Chromium-based browsers

## Author

**Bin.Late**
- Website: https://muabanquyen.com
- Extension: QR Code Generator

## License

This project is open source and available under the MIT License.
