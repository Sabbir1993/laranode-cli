const ServiceProvider = require('../Support/ServiceProvider');

class MailServiceProvider extends ServiceProvider {
    register() {
        this.app.singleton('mailer', (app) => {
            const Mailer = require('./Mailer');
            return new Mailer(app);
        });
    }

    boot() {
        //
    }
}

module.exports = MailServiceProvider;
