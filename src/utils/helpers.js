const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Recursively copy a directory, skipping specified items.
 */
function copyDir(src, dest, skip = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (skip.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, skip);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Generate a random APP_KEY (base64, 32 bytes).
 */
function generateAppKey() {
    return 'base64:' + crypto.randomBytes(32).toString('base64');
}

/**
 * Simple colored console output (no chalk dependency needed).
 */
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

module.exports = { copyDir, generateAppKey, colors };
