class Authenticate {
    async handle(context, next, ...guards) {
        const { req, res, app } = context;

        // In Phase 11, AuthManager will be fully implemented.
        // For now, simple check via app.make('auth')
        try {
            const auth = app.make('auth');
            if (!auth.check(guards)) {
                return res.status(401).json({ message: 'Unauthenticated.' });
            }
        } catch (e) {
            // Auth not fully configured yet
        }

        return next(context);
    }
}

module.exports = Authenticate;
