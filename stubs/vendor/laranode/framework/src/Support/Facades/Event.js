const Facade = require('./Facade');

class Event extends Facade {
    static getFacadeAccessor() {
        return 'events';
    }
}

module.exports = Event;
