const Hash = use('laranode/Support/Facades/Hash');

class SessionGuard {
    constructor(name, provider) {
        this.name = name;
        this.provider = provider;
        this.userObj = null;
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

        const req = request();
        const res = response();

        if (!req || !res) return;

        // 1. Set Session
        if (req.req.session) {
            req.req.session.user_id = user.id;
        }

        // 2. Generate and Set Token Cookie (Sanctum style for LaraNode)
        if (typeof user.createToken === 'function') {
            const tokenResult = await user.createToken('auth_token');
            const responseObj = res.res || res; // Handle wrapper proxy

            responseObj.cookie('token', tokenResult.plainTextToken, {
                httpOnly: true,
                maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days or 1 day
            });
        }
    }

    /**
     * Log the user out of the application.
     *
     * @return {Promise<void>}
     */
    async logout() {
        const req = request();
        const res = response();
        const user = this.user();

        if (user && typeof user.currentAccessToken === 'function' && user.currentAccessToken()) {
            await user.currentAccessToken().delete();
        }

        this.userObj = null;

        if (req && req.req.session) {
            req.req.session.user_id = null;
        }

        if (res) {
            const responseObj = res.res || res;
            responseObj.clearCookie('token');
        }
    }

    /**
     * Determine if the current user is authenticated.
     *
     * @return {boolean}
     */
    check() {
        return this.user() !== null;
    }

    /**
     * Determine if the current user is a guest.
     *
     * @return {boolean}
     */
    guest() {
        return !this.check();
    }

    /**
     * Get the currently authenticated user.
     *
     * @return {Object|null}
     */
    user() {
        if (this.userObj) {
            return this.userObj;
        }

        // If not set in memory, it will be set by the Authenticate middleware 
        // which runs before the controller.
        const req = request();
        if (req && typeof req.user === 'function') {
            this.userObj = req.user();
        }

        return this.userObj;
    }

    /**
     * Get the ID for the currently authenticated user.
     *
     * @return {number|string|null}
     */
    id() {
        const user = this.user();
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
        return this;
    }
}

module.exports = SessionGuard;
