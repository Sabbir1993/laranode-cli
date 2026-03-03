const crypto = require('crypto');
const PersonalAccessToken = use('laranode/Auth/PersonalAccessToken');
const Auth = use('laranode/Support/Facades/Auth');

class Authenticate {
    async handle(context, next, ...guards) {
        const { req, res, app } = context;

        guards = guards.length > 0 ? guards : [null];

        for (const guard of guards) {
            const authGuard = Auth.guard(guard);

            // API Token Authentication
            if (guard === 'api') {
                const authHeader = req.get('Authorization') || '';
                let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

                // Fallback to cookie if no header
                if (!token && req.headers.cookie) {
                    const cookies = Object.fromEntries(
                        req.headers.cookie.split('; ').map(c => {
                            const [k, ...v] = c.split('=');
                            return [k, v.join('=')];
                        })
                    );
                    token = cookies.token || null;
                }

                if (token) {
                    const [id, plainTextToken] = token.split('|');

                    if (id && plainTextToken) {
                        const config = use('laranode/Support/Facades/Config');
                        const shouldHash = config.get('auth.guards.api.hash_tokens', true);
                        const searchToken = shouldHash
                            ? crypto.createHash('sha256').update(plainTextToken).digest('hex')
                            : plainTextToken;

                        // We need access to the Database resolving QueryBuilder
                        const tokenModel = await PersonalAccessToken.where('id', id).where('token', searchToken).first();

                        if (tokenModel) {
                            // Valid token - find user
                            const AuthManager = use('laranode/Auth/AuthManager');
                            const authManagerInstance = new AuthManager(app); // Temporary instantiation to use helper methods
                            const providerClass = authManagerInstance.createUserProvider(Auth.getConfig('api').provider); // returns User model class

                            const user = await providerClass.find(tokenModel.tokenable_id);

                            if (user) {
                                user.withAccessToken(tokenModel);
                                authGuard.setUser(user);
                                req.user = () => user; // Bind to request context
                                return next(context);
                            }
                        }
                    }
                }
            }
            // Session Authentication (mocked fallback)
            else {
                if (authGuard.check()) {
                    return next(context);
                }
            }
        }

        // Unauthenticated Response
        if (req.xhr || req.accepts('json') || req.path.startsWith('/api')) {
            return res.status(401).json({ message: 'Unauthenticated.' });
        }

        return res.redirect('/login');
    }
}

module.exports = Authenticate;
