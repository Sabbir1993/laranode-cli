/**
 * Encryption Manager
 * 
 * Provides encryption/decryption functionality using AES-256-CBC.
 * This is similar to Laravel's Crypt facade.
 */

const crypto = require('crypto');

class EncryptionManager {
    constructor() {
        this.cipher = 'aes-256-cbc';
        this.key = null;
        this.driver = 'native';
    }

    /**
     * Initialize the encryption manager with a key.
     * The key should be 32 bytes (256 bits) for AES-256.
     * 
     * @param {string} key - The encryption key
     */
    setKey(key) {
        // If key is hex-encoded, convert to buffer
        if (key.startsWith('hex:')) {
            this.key = Buffer.from(key.substring(4), 'hex');
        } else if (Buffer.isBuffer(key)) {
            this.key = key;
        } else {
            // Assume base64 or raw string
            this.key = Buffer.from(key, 'utf8');
        }

        // Derive a fixed 32-byte key via HKDF regardless of input length.
        // This replaces the previous zero-padding / truncation approach which
        // silently produced weak or colliding keys for non-32-byte inputs.
        this.key = crypto.hkdfSync('sha256', this.key, Buffer.alloc(0), 'laranode-enc-v1', 32);
    }

    /**
     * Get the current encryption key.
     * 
     * @returns {Buffer|null}
     */
    getKey() {
        return this.key;
    }

    /**
     * Encrypt the given value.
     * 
     * @param {string} value - The value to encrypt
     * @returns {string} - Base64-encoded encrypted string with IV
     */
    encrypt(value) {
        if (!this.key) {
            throw new Error('Encryption key not set. Please configure APP_KEY.');
        }

        // Generate a random initialization vector (IV)
        const iv = crypto.randomBytes(16);

        // Create cipher
        const cipher = crypto.createCipheriv(this.cipher, this.key, iv);

        // Encrypt the value
        let encrypted = cipher.update(value, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Combine IV and encrypted data
        // Format: base64(iv):base64(encrypted)
        const combined = iv.toString('base64') + ':' + encrypted;

        return combined;
    }

    /**
     * Decrypt the given value.
     * 
     * @param {string} encryptedValue - The encrypted string
     * @returns {string} - Decrypted value
     */
    decrypt(encryptedValue) {
        if (!this.key) {
            throw new Error('Encryption key not set. Please configure APP_KEY.');
        }

        try {
            // Split IV and encrypted data
            const parts = encryptedValue.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted value format.');
            }

            const iv = Buffer.from(parts[0], 'base64');
            const encrypted = parts[1];

            // Create decipher
            const decipher = crypto.createDecipheriv(this.cipher, this.key, iv);

            // Decrypt
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    /**
     * Generate a random key.
     * 
     * @param {number} length - Key length in bytes (default 32 for AES-256)
     * @returns {string} - Base64-encoded key
     */
    generateKey(length = 32) {
        return crypto.randomBytes(length).toString('base64');
    }

    /**
     * Generate a random key in hex format.
     * 
     * @param {number} length - Key length in bytes (default 32 for AES-256)
     * @returns {string} - Hex-encoded key
     */
    generateKeyHex(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Check if the given hash needs to be re-hashed
     * (for future algorithm upgrades).
     * 
     * @param {string} hashedValue 
     * @param {Object} options 
     * @returns {boolean}
     */
    needsRehash(hashedValue, options = {}) {
        return false;
    }
}

module.exports = EncryptionManager;
