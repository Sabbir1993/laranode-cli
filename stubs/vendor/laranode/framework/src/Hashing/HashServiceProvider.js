const HashManager = require('./HashManager');

class HashServiceProvider {
    constructor(app) {
        this.app = app;
    }

    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('hash', () => {
            return new HashManager();
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        //
    }
}

module.exports = HashServiceProvider;
