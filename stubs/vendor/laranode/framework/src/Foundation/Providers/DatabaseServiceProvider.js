const ServiceProvider = require('../../Support/ServiceProvider');

class DatabaseServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    register() {
        this.app.singleton('db', function (app) {
            const DatabaseManager = require('../../Database/DatabaseManager');
            return new DatabaseManager(app);
        });

        // Also alias the connection method as the default db instance is the ConnectionManager
        this.app.bind('db.connection', function (app) {
            return app.make('db').connection();
        });
    }

    /**
     * Bootstrap any application services.
     */
    async boot() {
        //
    }
}

module.exports = DatabaseServiceProvider;
