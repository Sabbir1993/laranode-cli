const Facade = require('./Facade');

class Notification extends Facade {
    static getFacadeAccessor() {
        return 'notification';
    }
}

module.exports = Notification;
