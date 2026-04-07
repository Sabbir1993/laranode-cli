const Inertia = use('laranode/Support/Facades/Inertia');

class HandleInertiaRequests {
    /**
     * Determines the current asset version.
     */
    version(req) {
        return null;
    }

    /**
     * Defines the props that are shared by default.
     */
    async share(req) {
        return {
            errors: req.session ? (req.session.get('errors') || {}) : {},
            flash: {
                success: req.session ? req.session.get('success') : null,
                error: req.session ? req.session.get('error') : null,
            },
            auth: {
                user: req.user ? req.user : null,
            }
        };
    }

    /**
     * Handle the incoming request.
     */
    async handle(req, res, next) {
        if (!req.header('X-Inertia')) {
            return next();
        }

        // Asset Versioning Check
        const method = req.method;
        if (method === 'GET' && req.header('X-Inertia-Version') !== Inertia.getVersion()) {
            return Inertia.location(res, req.originalUrl || req.url);
        }

        // Load globally shared props
        const sharedProps = await this.share(req);
        Inertia.share(sharedProps);

        // Handle Inertia 409 manual Location intercepts
        const originalRedirect = res.redirect.bind(res);
        res.redirect = (status, url) => {
            if (arguments.length === 1) {
                url = status;
                status = 302;
            }
            if (['PUT', 'PATCH', 'DELETE'].includes(method) && status === 302) {
                status = 303;
            }
            return originalRedirect(status, url);
        };

        return next();
    }
}

module.exports = HandleInertiaRequests;
