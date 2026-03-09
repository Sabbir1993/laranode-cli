const ServiceProvider = require('../Support/ServiceProvider');
const Dispatcher = require('./Dispatcher');

class EventServiceProvider extends ServiceProvider {
    /**
     * Register the event dispatcher singleton.
     */
    register() {
        this.app.singleton('events', (app) => {
            return new Dispatcher(app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    boot() {
        //
    }
}

module.exports = EventServiceProvider;
