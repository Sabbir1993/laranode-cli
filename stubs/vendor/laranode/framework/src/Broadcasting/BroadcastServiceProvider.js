const ServiceProvider = use('laranode/Support/ServiceProvider');
const BroadcastManager = require('./BroadcastManager');

class BroadcastServiceProvider extends ServiceProvider {
    register() {
        this.app.singleton('broadcast.manager', () => {
            return new BroadcastManager(this.app);
        });
    }

    boot() {
        // Server attachment happens inside server.js after listen()
    }
}

module.exports = BroadcastServiceProvider;
