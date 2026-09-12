const fs = require('fs');
const path = require('path');

// Ensure www folder exists
if (!fs.existsSync('www')) {
    fs.mkdirSync('www');
}

// Copy only frontend assets into www
const allowedExts = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp'];
const ignoreFiles = ['build.js'];

fs.readdirSync('.').forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (allowedExts.includes(ext) && !ignoreFiles.includes(file)) {
        fs.copyFileSync(file, path.join('www', file));
    }
});

console.log('✅ Web assets copied to www/ successfully!');