/**
 * In-memory cache store.
 * Fast but resets on application restart.
 */
class MemoryStore {
    constructor(prefix = '') {
        this.prefix = prefix;
        this.storage = new Map();
    }

    _key(key) {
        return this.prefix + key;
    }

    async get(key, defaultValue = null) {
        const prefixed = this._key(key);
        const item = this.storage.get(prefixed);

        if (!item) return defaultValue;

        if (item.expiration !== 0 && Date.now() >= item.expiration) {
            this.storage.delete(prefixed);
            return defaultValue;
        }

        return item.value;
    }

    async put(key, value, ttlSeconds = null) {
        const prefixed = this._key(key);
        const expiration = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : 0;
        this.storage.set(prefixed, { value, expiration });
        return true;
    }

    async has(key) {
        return (await this.get(key)) !== null;
    }

    async forget(key) {
        this.storage.delete(this._key(key));
        return true;
    }

    async flush() {
        this.storage.clear();
        return true;
    }

    async increment(key, value = 1) {
        const current = await this.get(key, 0);
        const newValue = (parseInt(current) || 0) + value;
        await this.put(key, newValue);
        return newValue;
    }

    async decrement(key, value = 1) {
        return this.increment(key, -value);
    }

    async remember(key, ttlSeconds, callback) {
        const value = await this.get(key);
        if (value !== null) return value;

        const result = await callback();
        await this.put(key, result, ttlSeconds);
        return result;
    }

    async pull(key, defaultValue = null) {
        const value = await this.get(key, defaultValue);
        await this.forget(key);
        return value;
    }
}

module.exports = MemoryStore;
