const Facade = use('laranode/Support/Facades/Facade');

class Lang extends Facade {
    static getFacadeAccessor() {
        return 'translator';
    }
}

module.exports = new Proxy(Lang, {
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
