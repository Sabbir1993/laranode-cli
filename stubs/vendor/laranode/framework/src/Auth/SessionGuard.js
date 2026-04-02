const Hash = use('laranode/Support/Facades/Hash');

class SessionGuard {
    constructor(name, provider) {
        this.name = name;
        this.provider = provider;
        this.userObj = null;
        this.loggedOut = false;
    }

    /**
     * Get the session key used for authentication state.
     * Fixed to be stable across restarts.
     *
     * @return {string}
     */
    getName() {
        const crypto = require('crypto');
        return 'login_' + this.name + '_' + crypto.createHash('md5').update(this.name + '_guard').digest('hex');
    }

    /**
     * Attempt to authenticate a user using the given credentials.
     *
     * @param  {Object}  credentials
     * @param  {boolean} [remember=false]
     * @return {Promise<boolean>}
     */
    async attempt(credentials, remember = false) {
        const user = await this.provider.where('email', credentials.email).first();

        if (user && await Hash.check(credentials.password, user.password)) {
            await this.login(user, remember);
            return true;
        }

        return false;
    }

    /**
     * Log a user into the application.
     *
     * @param  {Object}  user
     * @param  {boolean} [remember=false]
     * @return {Promise<void>}
     */
    async login(user, remember = false) {
        this.userObj = user;
        this.loggedOut = false;

        const req = request();
        if (!req) return;

        let session = req.session;

        // 1. Regenerate session ID to prevent fixation (like Laravel)
        const expressReq = req.getExpressRequest();
        if (expressReq && expressReq.session && typeof expressReq.session.regenerate === 'function') {
            await new Promise((resolve) => expressReq.session.regenerate(() => resolve()));
            // After regeneration, we MUST re-fetch the session from the request because it's a new object
            session = req.session; 
        }

        // 2. Persist user ID to session using the framework's Request.session proxy
        session.put(this.getName(), user.id);

        // 3. Force save the underlying Express session if the store doesn't do it automatically
        if (expressReq && expressReq.session && typeof expressReq.session.save === 'function') {
            await new Promise((resolve) => expressReq.session.save(() => resolve()));
        }

        // 4. Handle "Remember Me" if requested
        if (remember) {
            const res = response();
            const expressRes = res && res.res; // Get underlying Express response
            if (expressRes && typeof expressRes.cookie === 'function') {
                expressRes.cookie('remember_token', 'remember_' + this.name + '_' + user.id, {
                    httpOnly: true,
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                });
            }
        }
    }

    /**
     * Log the user out of the application.
     *
     * @return {Promise<void>}
     */
    async logout() {
        this.userObj = null;
        this.loggedOut = true;

        const req = request();
        if (!req) return;

        const session = req.session;
        session.forget(this.getName());

        const expressReq = req.getExpressRequest();
        if (expressReq && expressReq.session && typeof expressReq.session.destroy === 'function') {
            await new Promise((resolve) => expressReq.session.destroy(() => resolve()));
        }

        const res = response();
        const expressRes = res && res.res;
        if (expressRes && typeof expressRes.clearCookie === 'function') {
            expressRes.clearCookie('remember_token');
        }
    }

    /**
     * Get the currently authenticated user.
     *
     * @return {Promise<Object|null>}
     */
    async user() {
        if (this.loggedOut) return null;

        // 1. Return cached user for this instance (request lifecycle)
        if (this.userObj) return this.userObj;

        // 2. Try to load from session
        const req = request();
        if (!req) return null;

        const session = req.session;
        const id = session.get(this.getName());

        if (id) {
            this.userObj = await this.provider.find(id);
        }

        return this.userObj;
    }

    /**
     * Determine if the current user is authenticated.
     *
     * @return {Promise<boolean>}
     */
    async check() {
        return (await this.user()) !== null;
    }

    /**
     * Determine if the current user is a guest.
     *
     * @return {Promise<boolean>}
     */
    async guest() {
        return !(await this.check());
    }

    /**
     * Get the ID for the currently authenticated user.
     *
     * @return {Promise<number|string|null>}
     */
    async id() {
        const user = await this.user();
        return user ? user.id : null;
    }

    /**
     * Set the current user.
     *
     * @param  {Object}  user
     * @return {this}
     */
    setUser(user) {
        this.userObj = user;
        this.loggedOut = false;
        return this;
    }
}

module.exports = SessionGuard;
