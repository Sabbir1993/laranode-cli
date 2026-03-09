const FileStore = require('./Stores/FileStore');
const MemoryStore = require('./Stores/MemoryStore');

/**
 * LaraNode Cache Manager
 *
 * Manages cache store instances and resolves drivers.
 * Matches Laravel's Cache API.
 */
class CacheManager {
    constructor(app) {
        this.app = app;
        this.stores = {};
    }

    /**
     * Get a cache store instance by name.
     *
     * @param {string|null} name
     * @returns {FileStore|MemoryStore}
     */
    store(name = null) {
        const config = this.app.make('config');
        name = name || config.get('cache.default', 'file');

        if (!this.stores[name]) {
            this.stores[name] = this._resolve(name);
        }

        return this.stores[name];
    }

    /**
     * Resolve a cache store by name.
     */
    _resolve(name) {
        const config = this.app.make('config');
        const storeConfig = config.get(`cache.stores.${name}`);

        if (!storeConfig) {
            throw new Error(`Cache store [${name}] is not defined.`);
        }

        const prefix = config.get('cache.prefix', 'laranode_cache_');

        switch (storeConfig.driver) {
            case 'file':
                return new FileStore(storeConfig.path, prefix);
            case 'memory':
                return new MemoryStore(prefix);
            default:
                throw new Error(`Cache driver [${storeConfig.driver}] is not supported.`);
        }
    }

    // Proxy common methods to the default store

    async get(key, defaultValue = null) {
        return this.store().get(key, defaultValue);
    }

    async put(key, value, ttlSeconds = null) {
        return this.store().put(key, value, ttlSeconds);
    }

    async has(key) {
        return this.store().has(key);
    }

    async forget(key) {
        return this.store().forget(key);
    }

    async flush() {
        return this.store().flush();
    }

    async increment(key, value = 1) {
        return this.store().increment(key, value);
    }

    async decrement(key, value = 1) {
        return this.store().decrement(key, value);
    }

    /**
     * Get an item from the cache, or execute the given closure and store the result.
     *
     * @param {string} key
     * @param {number|null} ttlSeconds
     * @param {Function} callback
     * @returns {Promise<*>}
     */
    async remember(key, ttlSeconds, callback) {
        return this.store().remember(key, ttlSeconds, callback);
    }

    /**
     * Get an item from the cache, or execute the closure and store forever.
     */
    async rememberForever(key, callback) {
        return this.store().remember(key, null, callback);
    }

    async pull(key, defaultValue = null) {
        return this.store().pull(key, defaultValue);
    }

    async forever(key, value) {
        return this.store().put(key, value, null);
    }
}

module.exports = CacheManager;
