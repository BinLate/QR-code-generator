// Language translations
const translations = {
    vi: {
        title: "Trình tạo mã QR",
        tabGenerate: "Tạo QR",
        tabDecode: "Giải mã QR",
        inputLabel: "Nhập văn bản hoặc URL:",
        inputPlaceholder: "Dán link hoặc văn bản của bạn vào đây...",
        generateBtn: "Tạo mã QR",
        resultTitle: "Mã QR đã tạo:",
        downloadBtn: "Tải xuống",
        copyBtn: "Sao chép hình ảnh",
        decodeLabel: "Tải lên hoặc dán hình ảnh mã QR:",
        uploadBtn: "Chọn tệp",
        pasteArea: "Nhấp để dán hình ảnh hoặc kéo thả",
        decodeResultTitle: "Nội dung đã giải mã:",
        copyDecodedBtn: "Sao chép văn bản",
        successGenerated: "Mã QR đã được tạo thành công!",
        successCopied: "Đã sao chép vào clipboard!",
        successDecoded: "Đã giải mã thành công!",
        errorEmpty: "Vui lòng nhập văn bản hoặc URL!",
        errorFile: "Vui lòng chọn một tệp hình ảnh!",
        errorPaste: "Vui lòng dán hình ảnh!",
        errorDecode: "Không thể giải mã mã QR từ hình ảnh này!",
        errorGenerate: "Không thể tạo mã QR! Vui lòng kiểm tra dữ liệu đầu vào.",
        errorInvalidFile: "Tệp không hợp lệ. Vui lòng chọn tệp hình ảnh!",
        errorCopy: "Không thể sao chép. Vui lòng thử lại!"
    },
    en: {
        title: "QR Code Generator",
        tabGenerate: "Generate QR",
        tabDecode: "Decode QR",
        inputLabel: "Enter text or URL:",
        inputPlaceholder: "Paste your link or text here...",
        generateBtn: "Generate QR Code",
        resultTitle: "Generated QR Code:",
        downloadBtn: "Download",
        copyBtn: "Copy Image",
        decodeLabel: "Upload or paste QR code image:",
        uploadBtn: "Choose File",
        pasteArea: "Click here to paste image or drag & drop",
        decodeResultTitle: "Decoded Content:",
        copyDecodedBtn: "Copy Text",
        successGenerated: "QR code generated successfully!",
        successCopied: "Copied to clipboard!",
        successDecoded: "Decoded successfully!",
        errorEmpty: "Please enter text or URL!",
        errorFile: "Please select an image file!",
        errorPaste: "Please paste an image!",
        errorDecode: "Cannot decode QR code from this image!",
        errorGenerate: "Cannot generate QR code! Please check your input.",
        errorInvalidFile: "Invalid file. Please select an image file!",
        errorCopy: "Cannot copy. Please try again!"
    }
};

// Global variables
let currentLanguage = 'en';
let qrCanvas = null;
let currentQRDataURL = null;

// Initialize the extension
document.addEventListener('DOMContentLoaded', function() {
    initializeExtension();
});

async function initializeExtension() {
    try {
        // Wait a bit for libraries to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if all libraries are loaded
        if (typeof qrcode === 'undefined') {
            console.error('qrcode library not loaded');
            // Don't show error message immediately, try to continue
        }
        
        if (typeof jsQR === 'undefined') {
            console.error('jsQR library not loaded');
            // Don't show error message immediately, try to continue
        }
        
        // Load saved language preference
        await loadLanguagePreference();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI with current language
        updateLanguage();
        
        console.log('Extension initialized successfully');
    } catch (error) {
        console.error('Error initializing extension:', error);
    }
}

async function loadLanguagePreference() {
    try {
        const result = await chrome.storage.local.get(['language']);
        currentLanguage = result.language || 'en';
    } catch (error) {
        console.error('Error loading language preference:', error);
        currentLanguage = 'en';
    }
}

async function saveLanguagePreference(lang) {
    try {
        await chrome.storage.local.set({ language: lang });
    } catch (error) {
        console.error('Error saving language preference:', error);
    }
}

function setupEventListeners() {
    try {
        // Language toggle
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', toggleLanguage);
        }
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.closest('.tab-btn').dataset.tab;
                if (tabName) {
                    switchTab(tabName);
                }
            });
        });
        
        // QR Generation
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generateQRCode);
        }
        
        // QR Decoding
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', handleFileUpload);
        }
        
        // Copy buttons
        const copyBtn = document.getElementById('copyBtn');
        const copyDecodedBtn = document.getElementById('copyDecodedBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyQRImage);
        }
        if (copyDecodedBtn) {
            copyDecodedBtn.addEventListener('click', copyDecodedText);
        }
        
        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadQRCode);
        }
        
        // Paste area
        const pasteArea = document.getElementById('pasteArea');
        if (pasteArea) {
            pasteArea.addEventListener('click', focusPasteArea);
            pasteArea.addEventListener('dragover', handleDragOver);
            pasteArea.addEventListener('dragleave', handleDragLeave);
            pasteArea.addEventListener('drop', handleDrop);
            
            // Global paste event listener
            document.addEventListener('paste', handleGlobalPaste);
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'v') {
                        // Check if decode tab is active
                        const decodeTab = document.getElementById('decodeTab');
                        if (decodeTab && decodeTab.classList.contains('active')) {
                            setTimeout(handlePaste, 10);
                        }
                    }
                }
            });
        }
        
        console.log('Event listeners setup successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'vi' : 'en';
    saveLanguagePreference(currentLanguage);
    updateLanguage();
}

function updateLanguage() {
    try {
        const elements = document.querySelectorAll('[data-text]');
        elements.forEach(element => {
            if (element && element.dataset && element.dataset.text) {
                const key = element.dataset.text;
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.textContent = translations[currentLanguage][key];
                }
            }
        });
        
        // Update placeholders
        const placeholders = document.querySelectorAll('[data-placeholder]');
        placeholders.forEach(element => {
            if (element && element.dataset && element.dataset.placeholder) {
                const key = element.dataset.placeholder;
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.placeholder = translations[currentLanguage][key];
                }
            }
        });
        
        // Update language button
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.textContent = currentLanguage === 'en' ? 'VI' : 'EN';
        }
    } catch (error) {
        console.error('Error updating language:', error);
    }
}

function switchTab(tabName) {
    try {
        if (!tabName) {
            console.error('Tab name is undefined');
            return;
        }
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn && btn.classList) {
                btn.classList.remove('active');
            }
        });
        
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn && activeTabBtn.classList) {
            activeTabBtn.classList.add('active');
        } else {
            console.error('Tab button not found:', tabName);
            return;
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content && content.classList) {
                content.classList.remove('active');
            }
        });
        
        const activeTabContent = document.getElementById(`${tabName}Tab`);
        if (activeTabContent && activeTabContent.classList) {
            activeTabContent.classList.add('active');
        } else {
            console.error('Tab content not found:', `${tabName}Tab`);
            return;
        }
        
        // Clear results when switching tabs
        clearResults();
        
        console.log('Switched to tab:', tabName);
    } catch (error) {
        console.error('Error switching tab:', error);
    }
}

function clearResults() {
    // Clear generation results
    const qrResult = document.getElementById('qrResult');
    const qrInput = document.getElementById('qrInput');
    if (qrResult) qrResult.style.display = 'none';
    if (qrInput) qrInput.value = '';
    
    // Clear decoding results
    const decodeResult = document.getElementById('decodeResult');
    const decodedText = document.getElementById('decodedText');
    const fileName = document.getElementById('fileName');
    const fileInput = document.getElementById('fileInput');
    
    if (decodeResult) decodeResult.style.display = 'none';
    if (decodedText) decodedText.value = '';
    if (fileName) fileName.textContent = '';
    if (fileInput) fileInput.value = '';
}

function generateQRCode() {
    const qrInputElement = document.getElementById('qrInput');
    if (!qrInputElement) {
        console.error('QR input element not found');
        return;
    }
    
    const input = qrInputElement.value.trim();
    
    if (!input) {
        showStatusMessage('errorEmpty', 'error');
        return;
    }
    
    // Check if qrcode library is loaded
    if (typeof qrcode === 'undefined') {
        console.error('qrcode library not loaded');
        console.log('Available globals:', Object.keys(window));
        showStatusMessage('errorGenerate', 'error');
        return;
    }
    
    try {
        // Generate QR code
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            showStatusMessage('errorGenerate', 'error');
            return;
        }
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Generate QR code using qrcode library
        const qr = qrcode(0, 'M');
        qr.addData(input);
        qr.make();
        
        // Set canvas size based on QR code
        const moduleCount = qr.getModuleCount();
        const cellSize = 8; // Larger cell size for better visibility
        const canvasSize = moduleCount * cellSize;
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill background with white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render QR code to canvas
        qr.renderTo2dContext(ctx, cellSize);
        
        console.log('QR code generated successfully');
        
        // Show result
        const qrResultElement = document.getElementById('qrResult');
        if (qrResultElement) {
            qrResultElement.style.display = 'block';
        }
        currentQRDataURL = canvas.toDataURL('image/png');
        showStatusMessage('successGenerated', 'success');
        
    } catch (error) {
        console.error('QR Code generation error:', error);
        showStatusMessage('errorGenerate', 'error');
    }
}

async function copyQRImage() {
    if (!currentQRDataURL) {
        showStatusMessage('errorCopy', 'error');
        return;
    }
    
    try {
        // Convert data URL to blob
        const response = await fetch(currentQRDataURL);
        const blob = await response.blob();
        
        // Copy to clipboard
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        
        showStatusMessage('successCopied', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        showStatusMessage('errorCopy', 'error');
    }
}

function downloadQRCode() {
    if (!currentQRDataURL) {
        showStatusMessage('errorCopy', 'error');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = currentQRDataURL;
        link.click();
        
        showStatusMessage('successCopied', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showStatusMessage('errorCopy', 'error');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        processImageFile(file);
    }
}

function focusPasteArea() {
    document.getElementById('pasteArea').focus();
}

function handleDragOver(event) {
    event.preventDefault();
    event.target.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.target.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.target.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            document.getElementById('fileName').textContent = file.name;
            processImageFile(file);
        } else {
            showStatusMessage('errorInvalidFile', 'error');
        }
    }
}

function handleGlobalPaste(event) {
    // Check if decode tab is active
    const decodeTab = document.getElementById('decodeTab');
    if (!decodeTab || !decodeTab.classList.contains('active')) {
        return;
    }
    
    // Prevent default paste behavior
    event.preventDefault();
    
    // Try clipboard API first
    if (navigator.clipboard && navigator.clipboard.read) {
        navigator.clipboard.read().then(data => {
            for (let item of data) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    item.getType('image/png').then(blob => {
                        const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
                        const fileNameElement = document.getElementById('fileName');
                        if (fileNameElement) fileNameElement.textContent = file.name;
                        processImageFile(file);
                    });
                    break;
                }
            }
        }).catch(error => {
            console.error('Clipboard API paste error:', error);
            // Fallback to traditional paste
            handleTraditionalPaste(event);
        });
    } else {
        // Fallback to traditional paste
        handleTraditionalPaste(event);
    }
}

function handleTraditionalPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) {
        showStatusMessage('errorPaste', 'error');
        return;
    }
    
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                const fileNameElement = document.getElementById('fileName');
                if (fileNameElement) fileNameElement.textContent = 'pasted-image.png';
                processImageFile(file);
                return;
            }
        }
    }
    
    showStatusMessage('errorPaste', 'error');
}

function handlePaste() {
    // This function is kept for backward compatibility
    handleGlobalPaste({ preventDefault: () => {}, clipboardData: null });
}

function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showStatusMessage('errorInvalidFile', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        decodeQRCode(e.target.result);
    };
    reader.readAsDataURL(file);
}

function decodeQRCode(imageSrc) {
    // Check if jsQR library is loaded
    if (typeof jsQR === 'undefined') {
        console.error('jsQR library not loaded');
        showStatusMessage('errorDecode', 'error');
        return;
    }
    
    const img = new Image();
    img.onload = function() {
        try {
            console.log('Image loaded:', img.width, 'x', img.height);
            
            // Create canvas with optimal size for QR detection
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // Try multiple sizes for better detection
            const sizes = [800, 600, 400, 300, 200, img.width, img.height];
            let code = null;
            
            for (let size of sizes) {
                // Calculate aspect ratio
                const aspectRatio = img.width / img.height;
                let canvasWidth, canvasHeight;
                
                if (img.width > img.height) {
                    canvasWidth = size;
                    canvasHeight = size / aspectRatio;
                } else {
                    canvasHeight = size;
                    canvasWidth = size * aspectRatio;
                }
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                
                // Clear and draw image
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                
                // Try to decode
                const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });
                
                if (code) break;
                
                // Try with inverted colors
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth"
                });
                
                if (code) break;
            }
            
            if (code) {
                console.log('QR code decoded successfully:', code.data);
                const decodedTextElement = document.getElementById('decodedText');
                const decodeResultElement = document.getElementById('decodeResult');
                
                if (decodedTextElement) {
                    decodedTextElement.value = code.data;
                }
                if (decodeResultElement) {
                    decodeResultElement.style.display = 'block';
                }
                showStatusMessage('successDecoded', 'success');
            } else {
                console.log('No QR code found in image');
                showStatusMessage('errorDecode', 'error');
            }
        } catch (error) {
            console.error('QR decode error:', error);
            showStatusMessage('errorDecode', 'error');
        }
    };
    
    img.onerror = function() {
        console.error('Image load error');
        showStatusMessage('errorDecode', 'error');
    };
    
    img.src = imageSrc;
}

async function copyDecodedText() {
    const decodedText = document.getElementById('decodedText').value;
    if (!decodedText) {
        showStatusMessage('errorCopy', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(decodedText);
        showStatusMessage('successCopied', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        showStatusMessage('errorCopy', 'error');
    }
}

function showStatusMessage(messageKey, type) {
    const statusElement = document.getElementById('statusMessage');
    const message = translations[currentLanguage][messageKey] || messageKey;
    
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.classList.add('show');
    
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 3000);
}
