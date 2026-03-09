const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * File-based cache store.
 * Stores serialized data as JSON files in storage/framework/cache/.
 */
class FileStore {
    constructor(directory, prefix = '') {
        this.directory = directory;
        this.prefix = prefix;

        // Ensure cache directory exists
        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory, { recursive: true });
        }
    }

    /**
     * Get the cache file path for a key.
     */
    _path(key) {
        const hash = crypto.createHash('sha256').update(this.prefix + key).digest('hex');
        const parts = [hash.substring(0, 2), hash.substring(2, 4)];
        const dir = path.join(this.directory, ...parts);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        return path.join(dir, hash);
    }

    /**
     * Retrieve an item from the cache by key.
     */
    async get(key, defaultValue = null) {
        const filePath = this._path(key);

        try {
            if (!fs.existsSync(filePath)) return defaultValue;

            const raw = fs.readFileSync(filePath, 'utf8');
            const payload = JSON.parse(raw);

            // Check expiration
            if (payload.expiration !== 0 && Date.now() >= payload.expiration) {
                this.forget(key);
                return defaultValue;
            }

            return payload.value;
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * Store an item in the cache.
     *
     * @param {string} key
     * @param {*} value
     * @param {number|null} ttlSeconds - null = forever
     */
    async put(key, value, ttlSeconds = null) {
        const filePath = this._path(key);
        const expiration = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : 0;

        const payload = JSON.stringify({ value, expiration });
        fs.writeFileSync(filePath, payload, 'utf8');

        return true;
    }

    /**
     * Determine if an item exists in the cache.
     */
    async has(key) {
        return (await this.get(key)) !== null;
    }

    /**
     * Remove an item from the cache.
     */
    async forget(key) {
        const filePath = this._path(key);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Remove all items from the cache.
     */
    async flush() {
        try {
            fs.rmSync(this.directory, { recursive: true, force: true });
            fs.mkdirSync(this.directory, { recursive: true });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Increment the value of an item in the cache.
     */
    async increment(key, value = 1) {
        const current = await this.get(key, 0);
        const newValue = (parseInt(current) || 0) + value;
        await this.put(key, newValue);
        return newValue;
    }

    /**
     * Decrement the value of an item in the cache.
     */
    async decrement(key, value = 1) {
        return this.increment(key, -value);
    }

    /**
     * Get an item from the cache, or execute the closure and store the result.
     */
    async remember(key, ttlSeconds, callback) {
        const value = await this.get(key);

        if (value !== null) {
            return value;
        }

        const result = await callback();
        await this.put(key, result, ttlSeconds);
        return result;
    }

    /**
     * Retrieve an item from the cache and delete it.
     */
    async pull(key, defaultValue = null) {
        const value = await this.get(key, defaultValue);
        await this.forget(key);
        return value;
    }
}

module.exports = FileStore;
