const ServiceProvider = require('../../Support/ServiceProvider');
const Router = require('../../Routing/Router');

class RouteServiceProvider extends ServiceProvider {
    /**
     * Register the router into the container.
     */
    register() {
        this.app.singleton('router', function (app) {
            const RouterClass = require('../../Routing/Router');
            const router = new RouterClass(app);

            if (typeof base_path === 'function') {
                const fs = require('fs');
                const cacheFile = base_path('bootstrap/cache/routes.json');
                if (fs.existsSync(cacheFile)) {
                    try {
                        const routes = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                        router.routes = routes;
                        router.routesAreCached = true;
                    } catch (e) {
                        // ignore broken cache
                    }
                }
            }
            return router;
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
