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

        // Token must come from the request body (_token) or a header.
        // The XSRF-TOKEN cookie is NOT accepted as the submitted token: it is
        // auto-sent by the browser, so comparing it to the session proves nothing.
        const token = req.body?._token || req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

        const crypto = require('crypto');
        const valid = sessionToken && token &&
            token.length === sessionToken.length &&
            crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));

        if (!valid) {
            const error = new Error('TokenMismatchException: CSRF token mismatch.');
            error.status = 419;
            throw error;
        }

        return next(context);
    }
}

module.exports = VerifyCsrfToken;
