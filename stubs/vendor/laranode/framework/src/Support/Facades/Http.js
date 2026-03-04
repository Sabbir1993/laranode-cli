const Facade = require('./Facade');

/**
 * Http Facade
 * Provides static access to the Http Client Factory in the container.
 */
class Http extends Facade {
    /**
     * Get the registered name of the component.
     * @returns {string}
     */
    static getFacadeAccessor() {
        return 'http';
    }
}

module.exports = new Proxy(Http, {
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
