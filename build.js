const fs = require('fs');
const path = require('path');

// 1. Ensure www folder exists
if (!fs.existsSync('www')) {
    fs.mkdirSync('www');
}

// 2. Automatically sync app.html -> index.html for Capacitor
if (fs.existsSync('app.html')) {
    fs.copyFileSync('app.html', 'index.html');
    fs.copyFileSync('app.html', path.join('www', 'index.html'));
    fs.copyFileSync('app.html', path.join('www', 'app.html'));
    console.log('✅ Synchronized app.html -> index.html');
}

// 3. Copy frontend assets to www/
const allowedExts = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp'];
const ignoreFiles = ['build.js'];

fs.readdirSync('.').forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (allowedExts.includes(ext) && !ignoreFiles.includes(file)) {
        fs.copyFileSync(file, path.join('www', file));
    }
});

console.log('✅ Web assets copied to www/ successfully!');
