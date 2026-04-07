class Cors {
    async handle(context, next) {
        const { req, res, app } = context;
        const config = app.make('config').get('cors', {});

        // Default to same-origin (no header) — never fall back to wildcard '*'.
        // Override allowed_origins in app/Http/Middleware or config/cors.js as needed.
        const origin = config.allowed_origins || null;
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Methods', config.allowed_methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', config.allowed_headers || 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        }

        if (req.method === 'OPTIONS') {
            return res.status(200).send();
        }

        return next(context);
    }
}

module.exports = Cors;
