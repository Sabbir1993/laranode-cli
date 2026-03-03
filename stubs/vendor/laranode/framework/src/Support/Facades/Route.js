const Facade = use('laranode/Support/Facades/Facade');

class Route extends Facade {
    /**
     * Get the registered name of the component.
     *
     * @return {string}
     */
    static getFacadeAccessor() {
        return 'router';
    }
}

// Proxy the Route class so static calls resolve to the facade root
module.exports = new Proxy(Route, {
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
