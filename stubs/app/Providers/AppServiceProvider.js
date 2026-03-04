const ServiceProvider = use('laranode/Support/ServiceProvider');
const Http = use('laranode/Support/Facades/Http');

class AppServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        //
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        // Register custom Http Macro
        Http.macro('typicode', function () {
            return this.withBaseUrl('https://jsonplaceholder.typicode.com')
                .withHeaders({ 'X-Custom-Macro': 'Working' });
        });
    }
}

module.exports = AppServiceProvider;
