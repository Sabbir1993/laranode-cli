const ServiceProvider = use('laranode/Support/ServiceProvider');
const Gate = use('laranode/Auth/Access/Gate');

class GateServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('gate', () => {
            return new Gate(this.app, () => {
                // Since Node is asynchronous, Auth.user() per request isn't safely globally available here statically.
                // It relies on developers either passing the user explicitly or setting a scoped userResolver if AsyncLocalStorage is used.
                return null;
            });
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        // Core initialization if needed
    }
}

module.exports = GateServiceProvider;
