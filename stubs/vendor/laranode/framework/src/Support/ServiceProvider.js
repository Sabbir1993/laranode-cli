class ServiceProvider {
    /**
     * Create a new service provider instance.
     * @param {Application} app 
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Register any application services.
     */
    register() {
        //
    }

    /**
     * Bootstrap any application services.
     */
    async boot() {
        //
    }

    /**
     * Merge the given configuration with the existing configuration.
     * @param {string} path 
     * @param {string} key 
     */
    mergeConfigFrom(path, key) {
        const config = this.app.make('config');
        const default_config = require(path);

        const current_config = config.get(key, {});
        config.set(key, { ...default_config, ...current_config });
    }
}

module.exports = ServiceProvider;
