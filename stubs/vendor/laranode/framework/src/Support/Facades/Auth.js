const Facade = use('laranode/Support/Facades/Facade');

class Auth extends Facade {
    /**
     * Get the registered name of the component.
     *
     * @return {string}
     */
    static getFacadeAccessor() {
        return 'auth';
    }
}

module.exports = new Proxy(Auth, {
    get(target, prop) {
        if (prop in target) {
            return target[prop];
        }

        const root = target.getFacadeRoot();
        if (root && typeof root[prop] === 'function') {
            return root[prop].bind(root);
        }

        const guard = target.getFacadeRoot().guard();
        if (guard && typeof guard[prop] === 'function') {
            return guard[prop].bind(guard);
        }

        if (guard && guard[prop] !== undefined) {
            return guard[prop];
        }

        return undefined;
    }
});
