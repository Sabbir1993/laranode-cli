class Cors {
    async handle(context, next) {
        const { req, res, app } = context;
        const config = app.make('config').get('cors', {});

        res.header('Access-Control-Allow-Origin', config.allowed_origins || '*');
        res.header('Access-Control-Allow-Methods', config.allowed_methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', config.allowed_headers || 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if (req.method === 'OPTIONS') {
            return res.status(200).send();
        }

        return next(context);
    }
}

module.exports = Cors;
