class Request {
    /**
     * Create a new Request wrapper based on Express req
     * @param {Object} req 
     */
    constructor(req) {
        this.req = req;
    }

    /**
     * Get route parameters.
     */
    get params() {
        return this.req.params || {};
    }

    /**
     * Access a route parameter (Laravel style).
     */
    route(key, defaultValue = null) {
        if (!key) return this.params;
        return this.params[key] !== undefined ? this.params[key] : defaultValue;
    }

    /**
     * Retrieve an input item from the request.
     * Searches body, query, and params.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    input(key, defaultValue = null) {
        if (this.req.body && this.req.body[key] !== undefined) return this.req.body[key];
        if (this.req.query && this.req.query[key] !== undefined) return this.req.query[key];
        if (this.req.params && this.req.params[key] !== undefined) return this.req.params[key];
        return defaultValue;
    }

    /**
     * Get all input and files for the request.
     * @returns {Object}
     */
    all() {
        return {
            ...(this.req.query || {}),
            ...(this.req.body || {}),
            ...(this.req.params || {}),
            ...(this.req.files || {})
        };
    }

    /**
     * Determine if the request contains a given input item key.
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.input(key) !== null;
    }

    /**
     * Retrieve an uploaded file from the request.
     * @param {string} key 
     * @returns {object|null}
     */
    file(key) {
        return this.req.files && this.req.files[key] ? this.req.files[key] : null;
    }

    /**
     * Retrieve a query string item from the request.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    query(key, defaultValue = null) {
        if (!key) return this.req.query || {};
        return this.req.query && this.req.query[key] !== undefined ? this.req.query[key] : defaultValue;
    }

    /**
     * Retrieve a header from the request.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    header(key, defaultValue = null) {
        return this.req.get(key) || defaultValue;
    }

    /**
     * Get the bearer token from the request headers.
     * @returns {string|null}
     */
    bearerToken() {
        const header = this.header('Authorization', '');
        if (header.startsWith('Bearer ')) {
            return header.substring(7);
        }
        return null;
    }

    /**
     * Get the request method.
     * @returns {string}
     */
    method() {
        return this.req.method;
    }

    /**
     * Get the request path/url.
     * @returns {string}
     */
    url() {
        return this.req.originalUrl || this.req.url;
    }

    /**
     * Check if the request is of a given method type.
     * @param {string} method 
     * @returns {boolean}
     */
    isMethod(method) {
        return this.method().toUpperCase() === method.toUpperCase();
    }

    /**
     * Get the client IP address.
     * @returns {string}
     */
    ip() {
        return this.req.ip;
    }

    /**
     * Get uploaded file
     * @param {string} key 
     * @returns {*} 
     */
    file(key) {
        if (!this.req.files) return null;
        return this.req.files[key] || null;
    }

    /**
     * Get the underlying Express request
     * @returns {Object}
     */
    getExpressRequest() {
        return this.req;
    }

    /**
     * Check if the request is an AJAX request.
     * @returns {boolean}
     */
    get xhr() {
        return this.req.xhr;
    }

    /**
     * Check if the request accepts a specific content type.
     * @param {string} types 
     * @returns {string|false}
     */
    accepts(...types) {
        return this.req.accepts(...types);
    }

    /**
     * Get the authenticated user for the request.
     * @returns {Object|null}
     */
    user() {
        return typeof this.req.user === 'function' ? this.req.user() : null;
    }

    /**
     * Validate the request with the given rules.
     * @param {Object} rules 
     * @param {Object} messages 
     * @returns {Promise<Object>} // Return Promise
     */
    async validate(rules, messages = {}) {
        const Validator = use('laranode/Validation/Validator');
        const validator = Validator.make(this.all(), rules, messages);

        if (await validator.fails()) {
            const ValidationException = use('laranode/Validation/ValidationException');
            throw new ValidationException(validator); // Expects instantiated validator to pass back errors
        }

        return await validator.validated();
    }
}

module.exports = Request;
