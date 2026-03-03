class Container {
    constructor() {
        this.bindings = {};
        this.instances = {};
        this.aliases = {};
    }

    /**
     * Get the globally available instance of the container (singleton pattern)
     */
    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    /**
     * Set the shared instance of the container
     * @param {Container} container 
     */
    static setInstance(container) {
        Container.instance = container;
    }

    /**
     * Determine if a given string is an alias
     * @param {string} name 
     * @returns {boolean}
     */
    isAlias(name) {
        return this.aliases[name] !== undefined;
    }

    /**
     * Register a binding with the container
     * @param {string} abstract 
     * @param {Function|null} concrete 
     * @param {boolean} shared 
     */
    bind(abstract, concrete = null, shared = false) {
        if (!concrete) {
            concrete = abstract;
        }

        this.bindings[abstract] = { concrete, shared };
    }

    /**
     * Register a shared binding in the container
     * @param {string} abstract 
     * @param {Function|null} concrete 
     */
    singleton(abstract, concrete = null) {
        this.bind(abstract, concrete, true);
    }

    /**
     * Register an existing instance as shared in the container
     * @param {string} abstract 
     * @param {*} instance 
     * @returns {*}
     */
    instance(abstract, instance) {
        this.instances[abstract] = instance;
        return instance;
    }

    /**
     * Alias a type to a different name
     * @param {string} abstract 
     * @param {string} alias 
     */
    alias(abstract, alias) {
        this.aliases[alias] = abstract;
    }

    /**
     * Resolve the given type from the container
     * @param {string} abstract 
     * @param {Object} parameters 
     * @returns {*}
     */
    make(abstract, parameters = {}) {
        const _abstract = this.getAlias(abstract);

        // If it's a singleton and we've already resolved it, return the instance
        if (this.instances[_abstract] !== undefined) {
            return this.instances[_abstract];
        }

        // Check if bound
        const binding = this.bindings[_abstract];

        if (!binding) {
            // If it's a class definition, try to instantiate it
            if (typeof abstract === 'function' && abstract.prototype) {
                return this.build(abstract, parameters);
            }
            throw new Error(`Target [${abstract}] is not instantiable.`);
        }

        // If concrete is a closure (factory)
        let object;
        if (typeof binding.concrete === 'function' && !binding.concrete.prototype) {
            object = binding.concrete(this, parameters);
        } else {
            // It's a class construct
            object = this.build(binding.concrete, parameters);
        }

        if (binding.shared) {
            this.instances[_abstract] = object;
        }

        return object;
    }

    /**
     * Get the alias for an abstract if available
     * @param {string} abstract 
     * @returns {string}
     */
    getAlias(abstract) {
        return this.aliases[abstract] || abstract;
    }

    /**
     * Instantiate a concrete instance of the given type
     * @param {Function} concrete 
     * @param {Object} parameters 
     */
    build(concrete, parameters = {}) {
        // Node.js doesn't have reflection like PHP, so dependency injection by constructor
        // variable names is tricky, but we can do a simple implementation or rely on manual resolution
        // For now, simply instantiate with parameters. We can implement a param parser later if needed.
        if (Object.keys(parameters).length > 0) {
            return new concrete(parameters);
        }
        return new concrete(this); // Pass container as default DI
    }
}

module.exports = Container;
