const fs = require('fs');
const path = require('path');
const Str = use('laranode/Support/Str');

class Translator {
    constructor(app, defaultLocale = 'en') {
        this.app = app;
        this.defaultLocale = defaultLocale;
        this.locale = defaultLocale;
        this.fallbackLocale = 'en';
        this.loaded = {}; // Store loaded translation files
    }

    /**
     * Get the current locale
     */
    getLocale() {
        return this.locale;
    }

    /**
     * Set the current locale
     */
    setLocale(locale) {
        this.locale = locale;
    }

    /**
     * Get the fallback locale
     */
    getFallback() {
        return this.fallbackLocale;
    }

    /**
     * Set the fallback locale
     */
    setFallback(fallback) {
        this.fallbackLocale = fallback;
    }

    /**
     * Translate the given message
     * @param {string} key - e.g. "messages.welcome"
     * @param {Object} replace - e.g. { name: 'Sabbir' }
     * @param {string} locale - target locale, defaults to current
     * @returns {string}
     */
    get(key, replace = {}, locale = null) {
        return this.trans(key, replace, locale);
    }

    /**
     * Alias for get()
     */
    trans(key, replace = {}, locale = null) {
        locale = locale || this.locale;

        // Parse the key into group (file) and item (dot path)
        const parts = key.split('.');
        if (parts.length === 1) {
            // Keys like 'Welcome' (for JSON translations usually)
            return this.getValue(locale, '*', key, replace);
        }

        const group = parts.shift(); // First part is the file name, e.g. 'messages'
        const item = parts.join('.'); // Rest is the dot path, e.g. 'welcome' or 'auth.failed'

        this.load(group, locale);

        let line = this.getValue(locale, group, item);

        // If not found, try fallback locale
        if (line === undefined && locale !== this.fallbackLocale) {
            this.load(group, this.fallbackLocale);
            line = this.getValue(this.fallbackLocale, group, item);
        }

        // If still not found, return the key itself
        if (line === undefined) {
            return key;
        }

        return this.makeReplacements(line, replace);
    }

    /**
     * Translate a message with pluralization support
     * @param {string} key 
     * @param {number} count 
     * @param {Object} replace 
     * @param {string} locale 
     * @returns {string}
     */
    choice(key, count, replace = {}, locale = null) {
        // We will perform a basic pluralization: 
        // string formatted as "There is one apple|There are many apples"
        let line = this.get(key, replace, locale);
        if (line === key) return key;

        const segments = line.split('|');
        let selected;

        if (count === 1 && segments.length > 0) {
            selected = segments[0];
        } else if (segments.length > 1) {
            selected = segments[1];
        } else {
            selected = segments[0];
        }

        return this.makeReplacements(selected, { count, ...replace });
    }

    /**
     * Determine if a translation exists
     * @param {string} key 
     * @param {string} locale 
     * @returns {boolean}
     */
    has(key, locale = null) {
        const value = this.get(key, {}, locale);
        return value !== key;
    }

    /**
     * Make placeholders replacements on a line
     * @param {string} line 
     * @param {Object} replace 
     * @returns {string}
     */
    makeReplacements(line, replace) {
        if (!line || typeof line !== 'string') return line;

        for (const [key, value] of Object.entries(replace)) {
            if (value === undefined || value === null) continue;

            // Replace :name with replacement
            line = line.replace(new RegExp(':' + key, 'g'), value);
            // Replace :Name with Title Case replacement
            line = line.replace(new RegExp(':' + Str.ucfirst(key), 'g'), Str.ucfirst(value.toString()));
            // Replace :NAME with UPPERCASE replacement
            line = line.replace(new RegExp(':' + key.toUpperCase(), 'g'), value.toString().toUpperCase());
        }
        return line;
    }

    /**
     * Extract nested value using dot notation
     */
    getValue(locale, group, item) {
        if (!this.loaded[locale] || !this.loaded[locale][group]) {
            return undefined;
        }

        let current = this.loaded[locale][group];
        if (item === '') return current;

        const parts = item.split('.');
        for (const part of parts) {
            if (current && current.hasOwnProperty(part)) {
                current = current[part];
            } else {
                return undefined;
            }
        }
        return current;
    }

    /**
     * Load the specified language group
     * @param {string} group 
     * @param {string} locale 
     */
    load(group, locale) {
        if (this.isLoaded(group, locale)) {
            return;
        }

        const exactPath = base_path(`resources/lang/${locale}/${group}.js`);
        const jsonPath = base_path(`resources/lang/${locale}/${group}.json`);

        let messages = {};

        if (fs.existsSync(exactPath)) {
            messages = require(exactPath);
            // bust cache for local dev
            if (config('app.env') === 'local') {
                delete require.cache[require.resolve(exactPath)];
            }
        } else if (fs.existsSync(jsonPath)) {
            const content = fs.readFileSync(jsonPath, 'utf8');
            try {
                messages = JSON.parse(content);
            } catch (e) {
                // Ignore parse errors
            }
        }

        if (!this.loaded[locale]) {
            this.loaded[locale] = {};
        }

        this.loaded[locale][group] = messages;
    }

    isLoaded(group, locale) {
        return this.loaded[locale] && this.loaded[locale][group];
    }
}

module.exports = Translator;
