const Facade = require('./Facade');

class Cache extends Facade {
    static getFacadeAccessor() {
        return 'cache';
    }
}

module.exports = Cache;
