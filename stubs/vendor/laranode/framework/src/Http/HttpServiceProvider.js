const ServiceProvider = require('../Support/ServiceProvider');
const Factory = require('./Client/Factory');

class HttpServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        // Bind the Http Client Factory to the container as a singleton
        this.app.singleton('http', () => {
            return new Factory();
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        // No booting needed for Http currently
    }
}

module.exports = HttpServiceProvider;
