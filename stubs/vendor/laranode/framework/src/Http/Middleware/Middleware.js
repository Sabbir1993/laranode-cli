class Middleware {
    /**
     * Handle an incoming request.
     * @param {Object} context { req, res, app }
     * @param {Function} next 
     */
    async handle(context, next) {
        throw new Error('Middleware must implement a handle method.');
    }
}

module.exports = Middleware;
