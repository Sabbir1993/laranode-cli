class Facade {
    /**
     * Get the registered name of the component.
     * @returns {string}
     */
    static getFacadeAccessor() {
        throw new Error('Facade does not implement getFacadeAccessor method.');
    }

    /**
     * Get the root object behind the facade.
     */
    static getFacadeRoot() {
        return Facade.resolveFacadeInstance(this.getFacadeAccessor());
    }

    /**
     * Resolve the facade root instance from the container.
     * @param {string|object} name 
     */
    static resolveFacadeInstance(name) {
        if (typeof name === 'object') {
            return name;
        }

        if (Facade.resolvedInstance[name]) {
            return Facade.resolvedInstance[name];
        }

        if (Facade.app) {
            Facade.resolvedInstance[name] = Facade.app.make(name);
            return Facade.resolvedInstance[name];
        }

        throw new Error('A facade root has not been set.');
    }

    /**
     * Clear a resolved facade instance.
     * @param {string} name 
     */
    static clearResolvedInstance(name) {
        delete Facade.resolvedInstance[name];
    }

    /**
     * Clear all of the resolved instances.
     */
    static clearResolvedInstances() {
        Facade.resolvedInstance = {};
    }

    /**
     * Get the application instance behind the facade.
     * @returns {Application}
     */
    static getFacadeApplication() {
        return Facade.app;
    }

    /**
     * Set the application instance.
     * @param {Application} app 
     */
    static setFacadeApplication(app) {
        Facade.app = app;
    }
}

// Initialize static properties
Facade.app = null;
Facade.resolvedInstance = {};

/**
 * ES6 Proxy magic to forward static calls to the underlying instance
 */
module.exports = new Proxy(Facade, {
    get(target, prop) {
        if (prop in target) {
            return target[prop];
        }

        // Return a proxy that delays resolution until called
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
