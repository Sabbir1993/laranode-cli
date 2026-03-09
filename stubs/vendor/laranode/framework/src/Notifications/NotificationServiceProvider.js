const ServiceProvider = require('../Support/ServiceProvider');

class NotificationServiceProvider extends ServiceProvider {
    register() {
        this.app.singleton('notification', (app) => {
            const NotificationManager = require('./NotificationManager');
            return new NotificationManager(app);
        });
    }

    boot() {
        // Add notify macro to Collection if needed
    }
}

module.exports = NotificationServiceProvider;
