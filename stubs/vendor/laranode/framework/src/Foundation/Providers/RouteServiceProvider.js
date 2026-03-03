const ServiceProvider = require('../../Support/ServiceProvider');
const Router = require('../../Routing/Router');
const path = require('path');

class RouteServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('router', function (app) {
            return new Router(app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    async boot() {
        this.registerRoutes();
    }

    /**
     * Load application routes using the router instance
     */
    registerRoutes() {
        const router = this.app.make('router');

        // Define web routes
        router.group({ middleware: ['web'] }, (router) => {
            const webPath = path.join(this.app.make('path.base'), 'routes', 'web.js');
            try {
                // Delete cache so we can reload dynamically if needed
                delete require.cache[require.resolve(webPath)];
                require(webPath);
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND' || e.message.indexOf('routes\\web.js') === -1 && e.message.indexOf('routes/web.js') === -1) {
                    throw e; // Relaunch if it's a syntax error or a missing module inside the route file
                }
            }
        });

        // Define API routes
        router.group({ prefix: '/api', middleware: ['api'] }, (router) => {
            const apiPath = path.join(this.app.make('path.base'), 'routes', 'api.js');
            try {
                delete require.cache[require.resolve(apiPath)];
                require(apiPath);
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND' || e.message.indexOf('routes\\api.js') === -1 && e.message.indexOf('routes/api.js') === -1) {
                    throw e;
                }
            }
        });
    }
}

module.exports = RouteServiceProvider;
