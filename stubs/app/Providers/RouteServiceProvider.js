const ServiceProvider = use('laranode/Support/ServiceProvider');
const path = require('path');

class AppRouteServiceProvider extends ServiceProvider {
    /**
     * The path to the "home" route for your application.
     * This is used by LaraNode authentication to redirect users after login.
     */
    static HOME = '/dashboard';

    /**
     * Register any application services.
     */
    register() {
        //
    }

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    boot() {
        this.configureRoutes();
    }

    /**
     * Configure the routes for the application.
     * Users can customize this method to load additional route files.
     */
    configureRoutes() {
        const router = this.app.make('router');

        // Web Routes
        // These routes receive session state, CSRF protection, etc.
        router.group({ middleware: ['web'] }, () => {
            this.loadRouteFile('routes/web.js');
        });

        // API Routes
        // These routes are stateless and typically prefixed with /api.
        router.group({ prefix: '/api', middleware: ['api'] }, () => {
            this.loadRouteFile('routes/api.js');
        });

        // ──────────────────────────────────────────────────
        // Add your custom route files below:
        // ──────────────────────────────────────────────────
        //
        // Example: Admin routes
        // router.group({ prefix: '/admin', middleware: ['web', 'auth'] }, () => {
        //     this.loadRouteFile('routes/admin.js');
        // });
        //
        // Example: Webhook routes (no CSRF, no session)
        // router.group({ prefix: '/webhooks' }, () => {
        //     this.loadRouteFile('routes/webhooks.js');
        // });
    }

    /**
     * Load a route file by its relative path from the project root.
     * Handles cache busting for development and gracefully skips missing files.
     *
     * @param {string} routeFile - Relative path e.g. 'routes/web.js'
     */
    loadRouteFile(routeFile) {
        const fullPath = path.join(this.app.make('path.base'), routeFile);
        try {
            delete require.cache[require.resolve(fullPath)];
            require(fullPath);
        } catch (e) {
            // Only suppress MODULE_NOT_FOUND for the route file itself
            if (e.code !== 'MODULE_NOT_FOUND' || !e.message.includes(routeFile.replace(/\//g, '\\'))) {
                throw e;
            }
        }
    }
}

module.exports = AppRouteServiceProvider;
