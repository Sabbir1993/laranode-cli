const Facade = require('./Facade');

class Config extends Facade {
    static getFacadeAccessor() {
        return 'config';
    }
}

// Proxy the Config class so static calls resolve to the facade root
module.exports = new Proxy(Config, {
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
