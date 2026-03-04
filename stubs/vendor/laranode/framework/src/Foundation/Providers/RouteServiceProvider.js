const ServiceProvider = require('../../Support/ServiceProvider');
const Router = require('../../Routing/Router');

class RouteServiceProvider extends ServiceProvider {
    /**
     * Register the router into the container.
     */
    register() {
        this.app.singleton('router', function (app) {
            return new Router(app);
        });
    }

    /**
     * Bootstrap any application services.
     * Route file loading is handled by the user-level App/Providers/RouteServiceProvider.
     */
    async boot() {
        // No-op: route file loading has been moved to app/Providers/RouteServiceProvider.js
    }
}

module.exports = RouteServiceProvider;
