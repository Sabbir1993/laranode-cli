const AuthManager = require('./AuthManager');

class AuthServiceProvider {
    constructor(app) {
        this.app = app;
    }

    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('auth', () => {
            return new AuthManager(this.app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        //
    }
}

module.exports = AuthServiceProvider;
