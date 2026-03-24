const fs = require('fs');
const path = require('path');

class Repository {
    constructor() {
        this.items = {};
    }

    /**
     * Load all configuration files from the config directory
     * @param {string} configPath 
     */
    loadConfigurationFiles(configPath) {
        if (typeof base_path === 'function') {
            const jsCache = base_path('bootstrap/cache/config.js');
            const jsonCache = base_path('bootstrap/cache/config.json');

            if (fs.existsSync(jsCache)) {
                try {
                    // Use require to load the JS cache
                    delete require.cache[require.resolve(jsCache)];
                    this.items = require(jsCache);
                    return;
                } catch (e) {
                    // fall through if corrupt
                }
            }

            if (fs.existsSync(jsonCache)) {
                try {
                    this.items = JSON.parse(fs.readFileSync(jsonCache, 'utf8'));
                    return;
                } catch (e) {
                    // fall through if corrupt
                }
            }
        }

        if (!fs.existsSync(configPath)) {
            return;
        }

        const files = fs.readdirSync(configPath);

        for (const file of files) {
            if (file.endsWith('.js')) {
                const name = path.basename(file, '.js');
                const fullPath = path.join(configPath, file);

                // Clear cache to ensure fresh config if reloaded
                delete require.cache[require.resolve(fullPath)];
                this.items[name] = require(fullPath);
            }
        }
    }

    /**
     * Determine if the given configuration value exists
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== undefined;
    }

    /**
     * Get the specified configuration value
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    get(key, defaultValue = null) {
        if (!key.includes('.')) {
            return this.items[key] !== undefined ? this.items[key] : defaultValue;
        }

        const segments = key.split('.');
        let current = this.items;

        for (const segment of segments) {
            if (current === undefined || current === null || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[segment];
        }

        return current !== undefined ? current : defaultValue;
    }

    /**
     * Set a given configuration value
     * @param {string} key 
     * @param {*} value 
     */
    set(key, value) {
        const segments = key.split('.');
        const lastSegment = segments.pop();

        let current = this.items;

        for (const segment of segments) {
            if (!current[segment] || typeof current[segment] !== 'object') {
                current[segment] = {};
            }
            current = current[segment];
        }

        current[lastSegment] = value;
    }

    /**
     * Get all of the configuration items for the application
     * @returns {object}
     */
    all() {
        return this.items;
    }
}

module.exports = Repository;
