const ServiceProvider = require('../Support/ServiceProvider');

class CacheServiceProvider extends ServiceProvider {
    /**
     * Register the cache manager singleton.
     */
    register() {
        this.app.singleton('cache', (app) => {
            const CacheManager = require('./CacheManager');
            return new CacheManager(app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        //
    }
}

module.exports = CacheServiceProvider;
