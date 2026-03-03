class Request {
    /**
     * Create a new Laranode Request instance wrapped around Express req.
     * @param {Object} req 
     */
    constructor(req) {
        this.req = req;
    }

    /**
     * Get an input item from the request.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    input(key, defaultValue = null) {
        const payload = { ...this.req.query, ...this.req.body };
        return payload[key] !== undefined ? payload[key] : defaultValue;
    }

    /**
     * Get all of the input and files for the request.
     * @returns {Object}
     */
    all() {
        return { ...this.req.query, ...this.req.body };
    }

    /**
     * Get a subset containing the provided keys with values from the input data.
     * @param {Array} keys 
     * @returns {Object}
     */
    only(keys) {
        const payload = this.all();
        const result = {};
        for (const key of keys) {
            if (payload[key] !== undefined) {
                result[key] = payload[key];
            }
        }
        return result;
    }

    /**
     * Determine if the request contains a given input item key.
     * @param {string|Array} key 
     * @returns {boolean}
     */
    has(key) {
        const keys = Array.isArray(key) ? key : [key];
        const payload = this.all();

        for (const k of keys) {
            if (payload[k] === undefined) {
                return false;
            }
        }
        return true;
    }

    /**
     * Retrieve a header from the request.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    header(key, defaultValue = null) {
        const value = this.req.header(key);
        return value !== undefined ? value : defaultValue;
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
     * Get the client IP address.
     * @returns {string}
     */
    ip() {
        return this.req.ip;
    }

    /**
     * Get the request method.
     * @returns {string}
     */
    method() {
        return this.req.method;
    }

    /**
     * Get the root URL for the application.
     * @returns {string}
     */
    root() {
        return `${this.req.protocol}://${this.req.get('host')}`;
    }

    /**
     * Get the full URL for the request.
     * @returns {string}
     */
    url() {
        return this.root() + this.req.originalUrl;
    }
}

module.exports = Request;
