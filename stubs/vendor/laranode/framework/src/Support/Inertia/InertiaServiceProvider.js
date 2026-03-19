const ServiceProvider = use('laranode/Support/ServiceProvider');
const Inertia = require('./Inertia');

class InertiaServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('inertia', () => {
            return new Inertia(this.app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        const Response = use('laranode/Http/Response');
        const app = this.app; // Capture application instance via closure
        if (Response) {
            Response.prototype.inertia = function (component, props = {}) {
                const inertiaService = app.make('inertia');
                return inertiaService.render(this.res.req, this.res, component, props);
            };
        }
    }
}

module.exports = InertiaServiceProvider;
