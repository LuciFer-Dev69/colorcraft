// ===== Mobile Menu Toggle =====
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-content')) {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// ===== Tool Management =====
function openTool(toolType) {
    const modal = document.getElementById('tool-modal');
    const container = document.getElementById('tool-container');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    switch (toolType) {
        case 'palette':
            container.innerHTML = getPaletteExtractorHTML();
            initPaletteExtractor();
            break;
        case 'gradient':
            container.innerHTML = getGradientGeneratorHTML();
            initGradientGenerator();
            break;
        case 'contrast':
            container.innerHTML = getContrastCheckerHTML();
            initContrastChecker();
            break;
        case 'scheme':
            container.innerHTML = getSchemeGeneratorHTML();
            initSchemeGenerator();
            break;
    }
}

function closeTool() {
    const modal = document.getElementById('tool-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('tool-modal');
    if (e.target === modal) {
        closeTool();
    }
});

// ===== Utility Functions =====
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!');
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===== PALETTE EXTRACTOR =====
function getPaletteExtractorHTML() {
    return `
        <div class="tool-workspace">
            <h2 class="tool-workspace-title">🎨 Color Palette Extractor</h2>
            <p class="tool-workspace-subtitle">Upload an image to extract its dominant colors</p>
            
            <div class="upload-area" id="upload-area">
                <input type="file" id="image-upload" accept="image/*" style="display: none;">
                <div class="upload-content">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect width="64" height="64" rx="16" fill="url(#upload-grad)"/>
                        <path d="M32 20v24M20 32h24" stroke="white" stroke-width="3" stroke-linecap="round"/>
                        <defs>
                            <linearGradient id="upload-grad" x1="0" y1="0" x2="64" y2="64">
                                <stop offset="0%" stop-color="#667eea"/>
                                <stop offset="100%" stop-color="#764ba2"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <h3>Click to upload or drag & drop</h3>
                    <p>PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>
            
            <div id="palette-result" class="palette-result" style="display: none;">
                <canvas id="preview-canvas" style="max-width: 100%; border-radius: 12px; margin-bottom: 1.5rem;"></canvas>
                <h3 style="margin-bottom: 1rem; font-family: 'Outfit', sans-serif;">Extracted Colors</h3>
                <div id="color-swatches" class="color-swatches"></div>
            </div>
        </div>
        
        <style>
            .tool-workspace {
                min-width: 600px;
                max-width: 800px;
            }
            
            .tool-workspace-title {
                font-family: 'Outfit', sans-serif;
                font-size: 2rem;
                font-weight: 800;
                margin-bottom: 0.5rem;
            }
            
            .tool-workspace-subtitle {
                color: #6b7280;
                margin-bottom: 2rem;
                font-size: 1.125rem;
            }
            
            .upload-area {
                border: 3px dashed #e5e7eb;
                border-radius: 16px;
                padding: 3rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.25s;
                background: #f8f9ff;
            }
            
            .upload-area:hover {
                border-color: #667eea;
                background: #f3f4ff;
            }
            
            .upload-area.dragover {
                border-color: #667eea;
                background: #eef0ff;
                transform: scale(1.02);
            }
            
            .upload-content h3 {
                margin: 1rem 0 0.5rem;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
            }
            
            .upload-content p {
                color: #6b7280;
            }
            
            .color-swatches {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
            }
            
            .color-swatch {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                transition: transform 0.25s;
                cursor: pointer;
            }
            
            .color-swatch:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }
            
            .color-preview {
                height: 100px;
                width: 100%;
            }
            
            .color-info {
                padding: 1rem;
            }
            
            .color-hex {
                font-weight: 700;
                font-family: 'Courier New', monospace;
                font-size: 1.125rem;
                margin-bottom: 0.25rem;
            }
            
            .color-rgb {
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            @media (max-width: 768px) {
                .tool-workspace {
                    min-width: auto;
                    width: 100%;
                }
            }
        </style>
    `;
}

function initPaletteExtractor() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('image-upload');

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            processImage(e.target.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files[0]) {
            processImage(e.dataTransfer.files[0]);
        }
    });
}

function processImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            extractColors(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function extractColors(img) {
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const maxWidth = 600;
    const scale = maxWidth / img.width;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Color quantization using median cut algorithm
    const colors = [];
    for (let i = 0; i < pixels.length; i += 4) {
        colors.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }

    // Sample colors (take every 10th pixel for performance)
    const sampledColors = colors.filter((_, i) => i % 10 === 0);

    // Get dominant colors using k-means clustering
    const dominantColors = kMeansClustering(sampledColors, 6);

    displayPalette(dominantColors);
}

function kMeansClustering(colors, k) {
    // Simple k-means implementation
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    for (let iter = 0; iter < 10; iter++) {
        const clusters = Array(k).fill().map(() => []);

        colors.forEach(color => {
            let minDist = Infinity;
            let clusterIndex = 0;

            centroids.forEach((centroid, i) => {
                const dist = Math.sqrt(
                    Math.pow(color[0] - centroid[0], 2) +
                    Math.pow(color[1] - centroid[1], 2) +
                    Math.pow(color[2] - centroid[2], 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    clusterIndex = i;
                }
            });

            clusters[clusterIndex].push(color);
        });

        centroids = clusters.map(cluster => {
            if (cluster.length === 0) return centroids[0];
            const sum = cluster.reduce((acc, color) => [
                acc[0] + color[0],
                acc[1] + color[1],
                acc[2] + color[2]
            ], [0, 0, 0]);
            return [
                Math.round(sum[0] / cluster.length),
                Math.round(sum[1] / cluster.length),
                Math.round(sum[2] / cluster.length)
            ];
        });
    }

    return centroids;
}

function displayPalette(colors) {
    document.getElementById('palette-result').style.display = 'block';
    const swatchesContainer = document.getElementById('color-swatches');
    swatchesContainer.innerHTML = '';

    colors.forEach(color => {
        const hex = rgbToHex(color[0], color[1], color[2]);
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.innerHTML = `
            <div class="color-preview" style="background-color: ${hex}"></div>
            <div class="color-info">
                <div class="color-hex">${hex.toUpperCase()}</div>
                <div class="color-rgb">RGB(${color[0]}, ${color[1]}, ${color[2]})</div>
            </div>
        `;
        swatch.addEventListener('click', () => {
            copyToClipboard(hex);
        });
        swatchesContainer.appendChild(swatch);
    });
}

// ===== GRADIENT GENERATOR =====
function getGradientGeneratorHTML() {
    return `
        <div class="tool-workspace">
            <h2 class="tool-workspace-title">🌈 Gradient Generator</h2>
            <p class="tool-workspace-subtitle">Create beautiful CSS gradients with live preview</p>
            
            <div class="gradient-preview" id="gradient-preview"></div>
            
            <div class="gradient-controls">
                <div class="control-group">
                    <label>Color 1</label>
                    <input type="color" id="color1" value="#667eea">
                </div>
                <div class="control-group">
                    <label>Color 2</label>
                    <input type="color" id="color2" value="#764ba2">
                </div>
                <div class="control-group">
                    <label>Angle</label>
                    <input type="range" id="angle" min="0" max="360" value="135">
                    <span id="angle-value">135°</span>
                </div>
                <div class="control-group">
                    <label>Type</label>
                    <select id="gradient-type">
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                    </select>
                </div>
            </div>
            
            <div class="gradient-code">
                <h3>CSS Code</h3>
                <div class="code-block" id="gradient-code">
                    <code></code>
                </div>
                <button class="copy-btn" onclick="copyGradientCode()">Copy CSS</button>
            </div>
        </div>
        
        <style>
            .gradient-preview {
                height: 300px;
                border-radius: 16px;
                margin-bottom: 2rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            }
            
            .gradient-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .control-group label {
                font-weight: 600;
                color: #1a1a2e;
            }
            
            .control-group input[type="color"] {
                height: 50px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .control-group input[type="range"] {
                width: 100%;
            }
            
            .control-group select {
                padding: 0.75rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
            }
            
            .gradient-code h3 {
                font-family: 'Outfit', sans-serif;
                margin-bottom: 1rem;
            }
            
            .code-block {
                background: #1a1a2e;
                color: #00f2fe;
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 1rem;
                font-family: 'Courier New', monospace;
                overflow-x: auto;
            }
            
            .copy-btn {
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: transform 0.25s;
            }
            
            .copy-btn:hover {
                transform: scale(1.02);
            }
        </style>
    `;
}

function initGradientGenerator() {
    const color1 = document.getElementById('color1');
    const color2 = document.getElementById('color2');
    const angle = document.getElementById('angle');
    const angleValue = document.getElementById('angle-value');
    const gradientType = document.getElementById('gradient-type');

    function updateGradient() {
        const preview = document.getElementById('gradient-preview');
        const codeBlock = document.querySelector('#gradient-code code');

        let gradient;
        if (gradientType.value === 'linear') {
            gradient = `linear-gradient(${angle.value}deg, ${color1.value}, ${color2.value})`;
        } else {
            gradient = `radial-gradient(circle, ${color1.value}, ${color2.value})`;
        }

        preview.style.background = gradient;
        codeBlock.textContent = `background: ${gradient};`;
        angleValue.textContent = angle.value + '°';
    }

    color1.addEventListener('input', updateGradient);
    color2.addEventListener('input', updateGradient);
    angle.addEventListener('input', updateGradient);
    gradientType.addEventListener('change', updateGradient);

    updateGradient();
}

function copyGradientCode() {
    const code = document.querySelector('#gradient-code code').textContent;
    copyToClipboard(code);
}

// ===== CONTRAST CHECKER =====
function getContrastCheckerHTML() {
    return `
        <div class="tool-workspace">
            <h2 class="tool-workspace-title">♿ Contrast Checker</h2>
            <p class="tool-workspace-subtitle">Check WCAG accessibility compliance for your color combinations</p>
            
            <div class="contrast-preview" id="contrast-preview">
                <div class="preview-text">
                    <h1>Large Text (24px+)</h1>
                    <p>Normal text (16px) - The quick brown fox jumps over the lazy dog</p>
                </div>
            </div>
            
            <div class="contrast-controls">
                <div class="control-group">
                    <label>Text Color</label>
                    <input type="color" id="text-color" value="#1a1a2e">
                </div>
                <div class="control-group">
                    <label>Background Color</label>
                    <input type="color" id="bg-color" value="#ffffff">
                </div>
            </div>
            
            <div class="contrast-results" id="contrast-results"></div>
        </div>
        
        <style>
            .contrast-preview {
                background: white;
                padding: 3rem;
                border-radius: 16px;
                margin-bottom: 2rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            }
            
            .preview-text h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            
            .preview-text p {
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .contrast-results {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-top: 2rem;
            }
            
            .result-card {
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            }
            
            .result-card h3 {
                font-family: 'Outfit', sans-serif;
                margin-bottom: 1rem;
                font-size: 1.25rem;
            }
            
            .ratio-display {
                font-size: 2.5rem;
                font-weight: 800;
                font-family: 'Outfit', sans-serif;
                margin-bottom: 1rem;
            }
            
            .compliance-badge {
                display: inline-block;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-weight: 600;
                margin: 0.25rem;
            }
            
            .badge-pass {
                background: #d1fae5;
                color: #065f46;
            }
            
            .badge-fail {
                background: #fee2e2;
                color: #991b1b;
            }
        </style>
    `;
}

function initContrastChecker() {
    const textColor = document.getElementById('text-color');
    const bgColor = document.getElementById('bg-color');

    function updateContrast() {
        const preview = document.getElementById('contrast-preview');
        const results = document.getElementById('contrast-results');

        preview.style.backgroundColor = bgColor.value;
        preview.style.color = textColor.value;

        const ratio = calculateContrastRatio(textColor.value, bgColor.value);

        results.innerHTML = `
            <div class="result-card">
                <h3>Contrast Ratio</h3>
                <div class="ratio-display">${ratio.toFixed(2)}:1</div>
            </div>
            <div class="result-card">
                <h3>WCAG AA</h3>
                <div class="compliance-badge ${ratio >= 4.5 ? 'badge-pass' : 'badge-fail'}">
                    Normal Text: ${ratio >= 4.5 ? '✓ Pass' : '✗ Fail'}
                </div>
                <div class="compliance-badge ${ratio >= 3 ? 'badge-pass' : 'badge-fail'}">
                    Large Text: ${ratio >= 3 ? '✓ Pass' : '✗ Fail'}
                </div>
            </div>
            <div class="result-card">
                <h3>WCAG AAA</h3>
                <div class="compliance-badge ${ratio >= 7 ? 'badge-pass' : 'badge-fail'}">
                    Normal Text: ${ratio >= 7 ? '✓ Pass' : '✗ Fail'}
                </div>
                <div class="compliance-badge ${ratio >= 4.5 ? 'badge-pass' : 'badge-fail'}">
                    Large Text: ${ratio >= 4.5 ? '✓ Pass' : '✗ Fail'}
                </div>
            </div>
        `;
    }

    textColor.addEventListener('input', updateContrast);
    bgColor.addEventListener('input', updateContrast);

    updateContrast();
}

function calculateContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val /= 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ===== SCHEME GENERATOR =====
function getSchemeGeneratorHTML() {
    return `
        <div class="tool-workspace">
            <h2 class="tool-workspace-title">🎨 Color Scheme Generator</h2>
            <p class="tool-workspace-subtitle">Generate harmonious color schemes using color theory</p>
            
            <div class="scheme-controls">
                <div class="control-group">
                    <label>Base Color</label>
                    <input type="color" id="base-color" value="#667eea">
                </div>
                <div class="control-group">
                    <label>Scheme Type</label>
                    <select id="scheme-type">
                        <option value="complementary">Complementary</option>
                        <option value="analogous">Analogous</option>
                        <option value="triadic">Triadic</option>
                        <option value="tetradic">Tetradic</option>
                        <option value="monochromatic">Monochromatic</option>
                    </select>
                </div>
            </div>
            
            <div class="scheme-result" id="scheme-result"></div>
        </div>
        
        <style>
            .scheme-result {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .scheme-color {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                cursor: pointer;
                transition: transform 0.25s;
            }
            
            .scheme-color:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }
            
            .scheme-color-preview {
                height: 120px;
            }
            
            .scheme-color-info {
                padding: 1rem;
                text-align: center;
            }
            
            .scheme-color-hex {
                font-weight: 700;
                font-family: 'Courier New', monospace;
            }
        </style>
    `;
}

function initSchemeGenerator() {
    const baseColor = document.getElementById('base-color');
    const schemeType = document.getElementById('scheme-type');

    function updateScheme() {
        const result = document.getElementById('scheme-result');
        const rgb = hexToRgb(baseColor.value);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        let colors = [];

        switch (schemeType.value) {
            case 'complementary':
                colors = [
                    hsl,
                    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'analogous':
                colors = [
                    { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
                    hsl,
                    { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'triadic':
                colors = [
                    hsl,
                    { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'tetradic':
                colors = [
                    hsl,
                    { h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'monochromatic':
                colors = [
                    { h: hsl.h, s: hsl.s, l: Math.max(20, hsl.l - 30) },
                    { h: hsl.h, s: hsl.s, l: Math.max(10, hsl.l - 15) },
                    hsl,
                    { h: hsl.h, s: hsl.s, l: Math.min(90, hsl.l + 15) },
                    { h: hsl.h, s: hsl.s, l: Math.min(95, hsl.l + 30) }
                ];
                break;
        }

        result.innerHTML = colors.map(color => {
            const rgb = hslToRgb(color.h, color.s, color.l);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            return `
                <div class="scheme-color" onclick="copyToClipboard('${hex}')">
                    <div class="scheme-color-preview" style="background-color: ${hex}"></div>
                    <div class="scheme-color-info">
                        <div class="scheme-color-hex">${hex.toUpperCase()}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    baseColor.addEventListener('input', updateScheme);
    schemeType.addEventListener('change', updateScheme);

    updateScheme();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
