class Response {
    /**
     * Create a new Response wrapper around Express res
     * @param {Object} res 
     */
    constructor(res) {
        this.res = res;
        this._isLaraResponse = true; // sentinel for Kernel.handleResult
    }

    /**
     * Set the status code for the response.
     * @param {number} code 
     * @returns {this}
     */
    status(code) {
        this._statusCode = code;
        this.res.status(code);
        return this;
    }

    /**
     * Send JSON response.
     * @param {Object} data 
     * @returns {*}
     */
    json(data) {
        return this.res.json(data);
    }

    /**
     * Set a cookie on the response.
     * @param {string} name 
     * @param {string} value 
     * @param {Object} options 
     * @returns {this}
     */
    cookie(name, value, options = {}) {
        this.res.cookie(name, value, options);
        return this;
    }

    /**
     * Clear a cookie.
     * @param {string} name 
     * @param {Object} options 
     * @returns {this}
     */
    clearCookie(name, options = {}) {
        this.res.clearCookie(name, options);
        return this;
    }

    /**
     * Send raw body response.
     * @param {string} body 
     * @returns {*}
     */
    send(body) {
        return this.res.send(body);
    }

    raw(message = '') {
        const code = this._statusCode;
        if (code) {
            const fs = require('fs');
            const path = require('path');
            const viewPath = path.join(__dirname, '../Foundation/resources/views/errors', code + '.edge');
            if (fs.existsSync(viewPath)) {
                let html = fs.readFileSync(viewPath, 'utf8');
                // Escape before injecting into HTML to prevent reflected XSS
                const safe = (str) => String(str)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
                html = html.replace(/\{\{-?\s*message\s*-?\}\}/g, safe(message || ''));
                return this.res.send(html);
            }
        }
        // No matching error view — send plain text (or nothing if message is empty)
        return this.res.send(message);
    }

    /**
     * Render a view and send it as a response.
     * @param {string} viewPath 
     * @param {Object} data 
     */
    view(viewPath, data = {}) {
        const MessageBag = use('laranode/Support/MessageBag');

        // Ensure errors is always a MessageBag instance
        if (!data.errors) {
            data.errors = new MessageBag({});
        } else if (!(data.errors instanceof MessageBag)) {
            data.errors = new MessageBag(data.errors);
        }

        // Inject validation errors and old input from session flash
        if (this.res.req && typeof this.res.req.flash === 'function') {
            const errorsFlash = this.res.req.flash('errors');
            const oldFlash = this.res.req.flash('old');

            // flash() returns an array, we want the first element if it exists
            // Wrap errors in MessageBag for Laravel-like methods
            const rawErrors = errorsFlash && errorsFlash.length > 0 ? errorsFlash[0] : {};
            data.errors = new MessageBag(rawErrors);

            const oldInput = oldFlash && oldFlash.length > 0 ? oldFlash[0] : {};

            // Add an old() helper function if not already provided
            if (typeof data.old !== 'function') {
                data.old = function (key, defaultVal = '') {
                    if (!key) return oldInput;

                    if (!key.includes('.')) {
                        return oldInput[key] !== undefined ? oldInput[key] : defaultVal;
                    }

                    return key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, oldInput) ?? defaultVal;
                };
            }

            if (!data.csrfToken && this.res.req.session && this.res.req.session.csrfToken) {
                data.csrfToken = this.res.req.session.csrfToken;
            }
        }

        // Global data injection
        if (this.res.req) {
            const Request = use('laranode/Http/Request');
            const reqInstance = new Request(this.res.req);
            data.request = reqInstance;
            data.session = reqInstance.session;

            // Inject auth state — read directly from underlying Express req
            // (req.user is set as a model instance by AuthMiddleware, not a callable)
            const user = this.res.req.user || null;
            data.auth = {
                user: user,
                check: !!user
            };
        }

        const html = global.view ? global.view(viewPath, data) : `View helper not found for ${viewPath}`;
        return this.send(html);
    }

    /**
     * Redirect to the given URL or return this for chaining (e.g. .back()).
     * @param {string|null} url 
     * @param {number} status 
     * @returns {this|*}
     */
    redirect(url = null, status = 302) {
        if (url === null) {
            return this;
        }

        // Ensure session is saved before redirect (for flash data)
        if (this.res.req && this.res.req.session && this.res.req.session.save) {
            try {
                this.res.req.session.save();
            } catch (e) { }
        }
        return this.res.redirect(status, url);
    }

    /**
     * Redirect to the previous page.
     * @returns {*}
     */
    back() {
        const url = this.res.req ? (this.res.req.get('Referrer') || '/') : '/';
        return this.redirect(url);
    }

    /**
     * Add a header to the response.
     * @param {string} key 
     * @param {string} value 
     * @returns {this}
     */
    header(key, value) {
        this.res.append(key, value);
        return this;
    }
}

module.exports = Response;
