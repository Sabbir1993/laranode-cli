const Facade = require('./Facade');

class DB extends Facade {
    static getFacadeAccessor() {
        return 'db';
    }
}

// Proxy the DB class so static calls resolve to the facade root
module.exports = new Proxy(DB, {
    get(target, prop) {
        if (prop in target) {
            return target[prop];
        }

        const root = target.getFacadeRoot();
        if (root && typeof root[prop] === 'function') {
            return root[prop].bind(root);
        }
        if (root && root[prop] !== undefined) {
            return root[prop];
        }

        return undefined;
    }
});
