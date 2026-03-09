const Facade = require('./Facade');

class Storage extends Facade {
    static getFacadeAccessor() {
        return 'filesystem';
    }
}

module.exports = Storage;
