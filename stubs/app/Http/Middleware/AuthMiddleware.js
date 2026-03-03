class AuthMiddleware {
    /**
     * Handle an incoming request.
     *
     * @param  {Object}  request
     * @param  {Function}  next
     * @return {Promise<any>}
     */
    async handle(request, next) {
        return await next(request);
    }
}

module.exports = AuthMiddleware;
