const Request = use('laranode/Http/Request');
const MessageBag = use('laranode/Support/MessageBag');

class FormRequest extends Request {
    constructor(req) {
        super(req);
        this._validator = null;
        this._validatedData = null;
        this._errors = null;
    }

    /**
     * Determine if the user is authorized to make this request.
     * @returns {boolean}
     */
    authorize() {
        return true; // Default to true, subclasses should override
    }

    /**
     * Get the validation rules that apply to the request.
     * @returns {Object}
     */
    rules() {
        return {};
    }

    /**
     * Custom error messages for validation failures.
     * @returns {Object}
     */
    messages() {
        return {};
    }

    /**
     * Get custom attributes for validator.
     * @returns {Object}
     */
    attributes() {
        return {};
    }

    /**
     * Set the validator instance.
     * @param {Object} validator 
     */
    setValidator(validator) {
        this._validator = validator;
    }

    /**
     * Get the validator instance.
     * @returns {Object}
     */
    getValidator() {
        return this._validator;
    }

    /**
     * Validate the class instance.
     * @returns {Promise<Object>}
     */
    async validateResolved() {
        if (!this.authorize()) {
            const error = new Error('This action is unauthorized.');
            error.status = 403;
            throw error;
        }

        return await this.validate(this.rules(), this.messages());
    }

    /**
     * Get the validated data.
     * @returns {Promise<Object>}
     */
    async validated() {
        if (!this._validatedData) {
            this._validatedData = await this.validateResolved();
        }
        return this._validatedData;
    }

    /**
     * Get all input from the request (like Laravel's $request->all()).
     * @returns {Object}
     */
    allInput() {
        return super.all();
    }

    /**
     * Alias for allInput for backward compatibility.
     * @returns {Object}
     */
    all() {
        return this.allInput();
    }

    /**
     * Get only the specified keys from the input (like Laravel's $request->only()).
     * @param {Array|string} keys 
     * @returns {Object}
     */
    only(...keys) {
        if (keys.length === 1 && Array.isArray(keys[0])) {
            keys = keys[0];
        }

        const input = this.all();
        const result = {};

        for (const key of keys) {
            if (input.hasOwnProperty(key)) {
                result[key] = input[key];
            }
        }

        return result;
    }

    /**
     * Get all keys except the specified keys (like Laravel's $request->except()).
     * @param {Array|string} keys 
     * @returns {Object}
     */
    except(...keys) {
        if (keys.length === 1 && Array.isArray(keys[0])) {
            keys = keys[0];
        }

        const input = this.all();
        const result = { ...input };

        for (const key of keys) {
            delete result[key];
        }

        return result;
    }

    /**
     * Check if the request has a given key.
     * @param {string|string[]} key 
     * @returns {boolean}
     */
    has(key) {
        if (Array.isArray(key)) {
            return key.every(k => this.input(k) !== null);
        }
        return this.input(key) !== null;
    }

    /**
     * Check if any of the given keys exist.
     * @param {Array} keys 
     * @returns {boolean}
     */
    hasAny(keys) {
        return keys.some(key => this.input(key) !== null);
    }

    /**
     * Check if all keys are present and not empty.
     * @param {Array} keys 
     * @returns {boolean}
     */
    filled(key) {
        const value = this.input(key);
        return value !== null && value !== undefined && value !== '';
    }

    /**
     * Get the errors from the request (Laravel-like).
     * Returns a MessageBag instance with methods like all(), first(), count(), etc.
     * @returns {MessageBag}
     */
    errors() {
        if (!this._errors) {
            this._errors = new MessageBag({});

            // Try to get errors from session flash or validator
            if (this._validator && this._validator._errors) {
                this._errors = this._validator._errors;
            } else if (this.req && this.req.flash) {
                // Get errors from session flash
                const flashErrors = this.req.flash('errors');
                if (flashErrors && flashErrors.length > 0) {
                    this._errors = new MessageBag(flashErrors[0]);
                }
            }
        }

        return this._errors;
    }

    /**
     * Determine if validation fails (Laravel-like).
     * @returns {boolean}
     */
    fails() {
        return !this.errors().isEmpty();
    }

    /**
     * Determine if the request is asking for JSON response.
     * @returns {boolean}
     */
    wantsJson() {
        return this.req.xhr || this.req.accepts(['html', 'json']) === 'json' ||
            this.req.get('accept') === 'application/json';
    }

    /**
     * Get the bearer token from the request.
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
     * Get the authenticated user.
     * @returns {Object|null}
     */
    user() {
        // req.user is set as a property by AuthMiddleware
        return this.req.user || null;
    }

    /**
     * Get a subset of the input data.
     * @param {Array} keys 
     * @returns {Object}
     */
    intersect(keys) {
        const input = this.all();
        const result = {};

        for (const key of keys) {
            if (input.hasOwnProperty(key)) {
                result[key] = input[key];
            }
        }

        return result;
    }

    /**
     * Get the method of the request.
     * @returns {string}
     */
    method() {
        return this.req.method;
    }

    /**
     * Determine if the request is for an AJAX call.
     * @returns {boolean}
     */
    ajax() {
        return this.req.xhr === true || this.header('X-Requested-With') === 'XMLHttpRequest';
    }

    /**
     * Determine if the request is over HTTPS.
     * @returns {boolean}
     */
    secure() {
        return this.req.protocol === 'https' || this.header('X-Forwarded-Proto') === 'https';
    }

    /**
     * Get the client's IP address.
     * @returns {string}
     */
    ip() {
        return this.req.ip || this.req.connection && this.req.connection.remoteAddress;
    }

    /**
     * Get the client's IP addresses.
     * @returns {Array}
     */
    ips() {
        const forwarded = this.header('X-Forwarded-For');
        if (forwarded) {
            return forwarded.split(',').map(ip => ip.trim());
        }
        return [this.ip()];
    }

    /**
     * Get the user agent string.
     * @returns {string}
     */
    userAgent() {
        return this.header('User-Agent', '');
    }

    /**
     * Get the full URL of the request.
     * @returns {string}
     */
    fullUrl() {
        return this.req.protocol + '://' + this.req.get('host') + this.req.originalUrl;
    }

    /**
     * Get the path of the request.
     * @returns {string}
     */
    path() {
        return this.req.path;
    }

    /**
     * Get the URL root.
     * @returns {string}
     */
    root() {
        return this.req.protocol + '://' + this.req.get('host');
    }

    /**
     * Determine if the current request URI matches a pattern.
     * @param {string|string[]} pattern 
     * @returns {boolean}
     */
    is(pattern) {
        if (Array.isArray(pattern)) {
            return pattern.some(p => this.is(p));
        }

        const path = this.path();

        // Convert Laravel route pattern to regex
        const regex = pattern.replace(/:([^\/]+)/g, '([^/]+)');

        return new RegExp('^' + regex + '$').test(path);
    }

    /**
     * Determine if the route name matches a given pattern.
     * @param {string|string[]} pattern 
     * @returns {boolean}
     */
    routeIs(pattern) {
        const routeName = this.route('name');
        if (!routeName) return false;

        if (Array.isArray(pattern)) {
            return pattern.some(p => {
                const regex = p.replace(/:([^\/]+)/g, '([^/]+)');
                return new RegExp('^' + regex + '$').test(routeName);
            });
        }

        const regex = pattern.replace(/:([^\/]+)/g, '([^/]+)');
        return new RegExp('^' + regex + '$').test(routeName);
    }

    /**
     * Check if input is present.
     * @param {string} key 
     * @returns {boolean}
     */
    isNull(key) {
        return this.input(key) === null || this.input(key) === undefined;
    }

    /**
     * Check if input is not present.
     * @param {string} key 
     * @returns {boolean}
     */
    isNotNull(key) {
        return !this.isNull(key);
    }

    /**
     * Get a file from the request.
     * @param {string} key 
     * @returns {object|null}
     */
    file(key) {
        return super.file(key);
    }

    /**
     * Determine if a file exists.
     * @param {string} key 
     * @returns {boolean}
     */
    hasFile(key) {
        return this.req.files && this.req.files[key] !== undefined;
    }
}

module.exports = FormRequest;
