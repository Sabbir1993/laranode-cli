const MessageBag = require('../Support/MessageBag');

class ValidationException extends Error {
    /**
     * Create a new ValidationException.
     * @param {Validator} validator 
     */
    constructor(validator) {
        super('The given data was invalid.');
        this.name = 'ValidationException';
        this.validator = validator;
        this.status = 422;

        // Store errors as MessageBag for Laravel-like access
        if (validator._errors) {
            this.errors = validator._errors;
        } else {
            this.errors = new MessageBag({});
        }

        // Also store as plain object for JSON response
        this._errorsObj = this.errors.all();
    }

    /**
     * Get errors as a plain object (Laravel-like).
     * @returns {Object}
     */
    getErrors() {
        return this._errorsObj;
    }

    /**
     * Get the first error message (Laravel-like).
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {string}
     */
    first(key = null, defaultValue = null) {
        if (key) {
            return this.errors.first(key, defaultValue);
        }
        return this.errors.first() || defaultValue;
    }

    /**
     * Get all error messages (Laravel-like).
     * @returns {Object}
     */
    all() {
        return this._errorsObj;
    }

    /**
     * Get the error count (Laravel-like).
     * @returns {number}
     */
    count() {
        return this.errors.count();
    }

    /**
     * Check if errors exist for a specific key (Laravel-like).
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.errors.has(key);
    }

    /**
     * Check if there are any errors (Laravel-like).
     * @returns {boolean}
     */
    isEmpty() {
        return this.errors.isEmpty();
    }

    /**
     * Check if there are errors (Laravel-like).
     * @returns {boolean}
     */
    isNotEmpty() {
        return this.errors.isNotEmpty();
    }

    /**
     * Get errors for a specific key (Laravel-like).
     * @param {string} key 
     * @returns {Array}
     */
    get(key) {
        return this.errors.get(key);
    }

    /**
     * Get the underlying validator instance.
     * @returns {Validator}
     */
    getValidator() {
        return this.validator;
    }

    /**
     * Get the response format for JSON (Laravel-like).
     * @returns {Object}
     */
    getResponse() {
        return {
            message: this.message,
            errors: this._errorsObj,
            // Additional Laravel 9+ format
            exception: this.constructor.name,
        };
    }
}

module.exports = ValidationException;
