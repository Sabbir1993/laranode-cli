class Request {
    /**
     * Create a new Request wrapper based on Express req
     * @param {Object} req 
     */
    constructor(req) {
        this.req = req;
        // Properties that must use the Request wrapper's own getter/method,
        // not the raw Express req value (circular refs or wrapped APIs)
        const UNSAFE = new Set([
            'socket', 'connection', 'client',
            '_events', '_eventsCount', '_maxListeners', '_readableState',
            'read', 'write', 'pipe', 'unpipe', 'destroy', 'resume', 'pause',
            'emit', 'on', 'once', 'addListener', 'removeListener', 'removeAllListeners',
            'session', // LaraNode wraps this with .get()/.put()/.forget() API
            'flash',   // LaraNode wraps this so this.req.flash() is called with correct context
        ]);
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
                // 1. Own properties of this wrapper (e.g. this.req set in constructor)
                if (Object.prototype.hasOwnProperty.call(target, prop)) {
                    return Reflect.get(target, prop, receiver);
                }
                // 2. Middleware-set own properties on the raw Express req take priority
                //    over prototype methods (user, organizerId, organizer, body, method…)
                //    Blocked: native stream/socket props that carry circular references
                if (!UNSAFE.has(prop) && Object.prototype.hasOwnProperty.call(target.req, prop)) {
                    return target.req[prop];
                }
                // 3. Request class prototype methods (all, only, input, validate, etc.)
                if (prop in target) return Reflect.get(target, prop, receiver);
                return undefined;
            },
            set(target, prop, value) {
                if (prop === 'req') { target.req = value; return true; }
                target[prop] = value;
                return true;
            },
        });
    }

    /**
     * Get route parameters.
     */
    get params() {
        return this.req.params || {};
    }

    /**
     * Flash a message to the session (proxy to underlying Express req.flash)
     * @param {string} key 
     * @param {*} value 
     * @returns {*}
     */
    flash(key, value) {
        if (typeof this.req.flash === 'function') {
            if (value === undefined) {
                // Get flash data - returns array
                return this.req.flash(key);
            }
            // Set flash data
            return this.req.flash(key, value);
        }
        return null;
    }

    /**
     * Access a route parameter (Laravel style).
     */
    route(key, defaultValue = null) {
        if (!key) return this.params;
        return this.params[key] !== undefined ? this.params[key] : defaultValue;
    }

    /**
     * Alias for route()
     */
    param(key, defaultValue = null) {
        return this.route(key, defaultValue);
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
     * Get only the specified keys from the request input.
     * @param {Array} keys
     * @returns {Object}
     */
    only(keys) {
        const all = this.all();
        return keys.reduce((acc, k) => {
            if (k in all) acc[k] = all[k];
            return acc;
        }, {});
    }

    /**
     * Get all input except the specified keys.
     * @param {Array} keys
     * @returns {Object}
     */
    except(keys) {
        const all = this.all();
        return Object.fromEntries(Object.entries(all).filter(([k]) => !keys.includes(k)));
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
     * Get all or a specific header from the request.
     * @param {string|null} key 
     * @param {*} defaultValue 
     * @returns {string|Object|null}
     */
    headers() {
        return this.req.headers;
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
     * Get the request path.
     * @returns {string}
     */
    path() {
        return this.req.path;
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
     * Retrieve an uploaded file from the request.
     * @param {string} key 
     * @returns {UploadedFile|null}
     */
    file(key) {
        if (!this.req.files || !this.req.files[key]) {
            return null;
        }

        const UploadedFile = require('./UploadedFile');
        const fileData = this.req.files[key];

        // Handle multiple files if necessary, but for now wrap single
        if (Array.isArray(fileData)) {
            return fileData.map(f => new UploadedFile(f));
        }

        return new UploadedFile(fileData);
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
     * Check if the request wants JSON.
     * @returns {boolean}
     */
    wantsJson() {
        return this.req.xhr || this.req.accepts(['html', 'json']) === 'json';
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
        // req.user is set as a property by AuthMiddleware (a model instance, not a function)
        if (typeof this.req.user === 'function') return this.req.user();
        return this.req.user || null;
    }

    /**
     * Get the session instance with Laravel-like API.
     * @returns {Object}
     */
    get session() {
        const sessionObj = this.req.session;
        return {
            get(key, defaultValue = null) {
                return sessionObj && sessionObj[key] !== undefined ? sessionObj[key] : defaultValue;
            },
            put(key, value) {
                if (sessionObj) sessionObj[key] = value;
            },
            has(key) {
                return sessionObj && sessionObj[key] !== undefined;
            },
            forget(key) {
                if (sessionObj) delete sessionObj[key];
            },
            pull(key, defaultValue = null) {
                const value = this.get(key, defaultValue);
                this.forget(key);
                return value;
            },
            all() {
                return sessionObj || {};
            }
        };
    }

    /**
     * Validate the request with the given rules.
     * @param {Object} rules 
     * @param {Object} messages 
     * @returns {Promise<Object>} // Return Promise
     */
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

    /**
     * Merge new input into the current request's input.
     * @param {Object} input 
     * @returns {this}
     */
    merge(input) {
        this.req.body = { ...(this.req.body || {}), ...input };
        return this;
    }
}

module.exports = Request;
