const ServiceProvider = use('laranode/Support/ServiceProvider');
const Factory = require('./Factory');

class ViewServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('view', function (app) {
            return new Factory(app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        // Register the global `view()` helper
        global.view = (viewPath, data = {}) => {
            // Inject CSRF token into view data if available
            // The session will be available in the request context
            return this.app.make('view').make(viewPath, data);
        };

        // Usually we don't rely heavily on Express's res.render() in LaraNode,
        // so we skip binding expressApp.engine here to prevent container instantiation errors.
    }
}

module.exports = ViewServiceProvider;
