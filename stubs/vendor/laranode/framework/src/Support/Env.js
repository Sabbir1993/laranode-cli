const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

class Env {
    /**
     * Load environment variables from .env file
     * @param {string} rootPath - The application root directory path
     */
    static load(rootPath) {
        const envPath = path.join(rootPath, '.env');
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
        }
    }

    /**
     * Get an environment variable with an optional default value
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    static get(key, defaultValue = null) {
        const value = process.env[key];
        
        if (value === undefined) {
            return defaultValue;
        }

        switch (value.toLowerCase()) {
            case 'true':
            case '(true)':
                return true;
            case 'false':
            case '(false)':
                return false;
            case 'empty':
            case '(empty)':
                return '';
            case 'null':
            case '(null)':
                return null;
        }

        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }

        return value;
    }
}

module.exports = Env;
