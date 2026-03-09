const ServiceProvider = use('laranode/Support/ServiceProvider');
const QueueManager = require('./QueueManager');

class QueueServiceProvider extends ServiceProvider {
    register() {
        this.app.singleton('queue', () => {
            return new QueueManager(this.app);
        });
    }

    boot() { }
}

module.exports = QueueServiceProvider;
