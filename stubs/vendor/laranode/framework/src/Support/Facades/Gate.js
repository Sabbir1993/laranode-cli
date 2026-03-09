const Facade = use('laranode/Support/Facades/Facade');

class Gate extends Facade {
    /**
     * Get the registered name of the component.
     *
     * @return {string}
     */
    static getFacadeAccessor() {
        return 'gate';
    }
}

module.exports = new Proxy(Gate, {
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
