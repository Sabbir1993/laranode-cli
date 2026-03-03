class SubstituteBindings {
    async handle(context, next) {
        const { req, app } = context;
        const router = app.make('router');
        const bindings = router.getBindings();

        // Express puts parameters in req.params
        for (const [key, value] of Object.entries(req.params)) {
            if (bindings[key]) {
                try {
                    const resolved = await bindings[key](value);

                    if (!resolved) {
                        // 404 if not found
                        const error = new Error(`Resource not found: ${key} [${value}]`);
                        error.status = 404;
                        throw error;
                    }

                    // Replace the parameter with the resolved model
                    req.params[key] = resolved;
                } catch (e) {
                    if (e.status === 404) throw e;
                    console.error(`Error resolving binding for ${key}:`, e);
                    throw e;
                }
            }
        }

        return next(context);
    }
}

module.exports = SubstituteBindings;
