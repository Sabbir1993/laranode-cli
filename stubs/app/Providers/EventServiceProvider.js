const ServiceProvider = use('laranode/Support/ServiceProvider');

class EventServiceProvider extends ServiceProvider {
    /**
     * The event to listener mappings for the application.
     *
     * @example
     * get listen() {
     *     return {
     *         'UserRegistered': [
     *             require('../Listeners/SendWelcomeEmail'),
     *             require('../Listeners/CreateDefaultSettings'),
     *         ],
     *     };
     * }
     */
    get listen() {
        return {
            //
        };
    }

    /**
     * The subscriber classes to register.
     *
     * @example
     * get subscribe() {
     *     return [
     *         require('../Listeners/UserEventSubscriber'),
     *     ];
     * }
     */
    get subscribe() {
        return [];
    }

    /**
     * Register any application services.
     */
    register() {
        //
    }

    /**
     * Bootstrap the event listeners and subscribers.
     */
    boot() {
        const events = this.app.make('events');

        // Register listeners
        const listenerMap = this.listen;
        for (const [event, listeners] of Object.entries(listenerMap)) {
            for (const listener of listeners) {
                events.listen(event, listener);
            }
        }

        // Register subscribers
        const subscribers = this.subscribe;
        for (const subscriber of subscribers) {
            events.subscribe(subscriber);
        }
    }
}

module.exports = EventServiceProvider;
