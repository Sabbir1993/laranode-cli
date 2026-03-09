const Facade = require('./Facade');

class Mail extends Facade {
    static getFacadeAccessor() {
        return 'mailer';
    }
}

module.exports = Mail;
