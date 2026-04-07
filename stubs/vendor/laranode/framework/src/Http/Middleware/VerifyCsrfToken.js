class VerifyCsrfToken {
    async handle(context, next) {
        const { req, res, app } = context;

        // Get session - express-session adds session to req
        const session = req.session;

        // Generate CSRF token for all requests if not exists (including GET)
        const sessionToken = session ? session.csrfToken : null;

        if (!sessionToken && session) {
            const crypto = require('crypto');
            const newToken = crypto.randomBytes(32).toString('hex');
            session.csrfToken = newToken;

            // Save session to ensure cookie is sent
            if (session.save) {
                session.save((err) => {
                    if (err) console.error('[CSRF] Session save error:', err);
                });
            }

            // Set cookie for JavaScript access
            res.cookie('XSRF-TOKEN', newToken, {
                httpOnly: false,
                secure: process.env.APP_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
        }

        // Skip CSRF verification for GET, HEAD, OPTIONS (safe methods)
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
            return next(context);
        }

        // Get token from multiple sources:
        // 1. Request body (_token)
        // 2. Request header (x-csrf-token or x-xsrf-token)
        // 3. Cookie (XSRF-TOKEN)
        let token = req.body?._token || req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

        // Use cookie-parser's parsed cookies (req.cookies) if available,
        // falling back to a safe manual parse with proper decoding.
        if (!token) {
            const parsed = req.cookies || {};
            token = parsed['XSRF-TOKEN'] || null;
        }

        if (!sessionToken || token !== sessionToken) {
            console.log('[CSRF] Token mismatch!', { sessionToken, token });
            const error = new Error('TokenMismatchException: CSRF token mismatch.');
            error.status = 419;
            throw error;
        }

        return next(context);
    }
}

module.exports = VerifyCsrfToken;
