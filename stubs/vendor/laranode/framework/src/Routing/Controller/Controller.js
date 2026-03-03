class Controller {
    constructor() {
        this.middlewares = [];
    }

    /**
     * Register middleware on the controller.
     * @param {string|Array} middleware 
     * @param {Object} options 
     */
    middleware(middleware, options = {}) {
        let middlewares = Array.isArray(middleware) ? middleware : [middleware];

        for (const mw of middlewares) {
            this.middlewares.push({
                middleware: mw,
                options: options
            });
        }

        return this;
    }

    /**
     * Get the middleware assigned to the controller.
     * @returns {Array}
     */
    getMiddleware() {
        return this.middlewares;
    }
}

module.exports = Controller;
