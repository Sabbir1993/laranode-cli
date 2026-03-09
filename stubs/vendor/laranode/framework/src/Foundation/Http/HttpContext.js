const { AsyncLocalStorage } = require('node:async_hooks');

class HttpContext {
    constructor() {
        this.storage = new AsyncLocalStorage();
    }

    /**
     * Run the given callback within the HTTP context.
     * @param {Object} context { req, res }
     * @param {Function} callback 
     */
    run(context, callback) {
        return this.storage.run(context, callback);
    }

    /**
     * Get the current HTTP context.
     * @returns {Object|null}
     */
    get() {
        return this.storage.getStore();
    }

    /**
     * Get the current request.
     * @returns {Object|null}
     */
    getRequest() {
        const store = this.get();
        return store ? store.req : null;
    }

    /**
     * Get the current response.
     * @returns {Object|null}
     */
    getResponse() {
        const store = this.get();
        return store ? store.res : null;
    }
}

// Export as a singleton
module.exports = new HttpContext();
