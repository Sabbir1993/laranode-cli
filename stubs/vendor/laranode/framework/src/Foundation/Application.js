const Container = require('../Container/Container');
const path = require('path');

class Application extends Container {
    constructor(basePath = null) {
        super();
        this.serviceProviders = [];
        this.booted = false;
        this.hasBeenBootstrapped = false;

        if (basePath) {
            this.setBasePath(basePath);
        }

        this.registerBaseBindings();
        this.registerBaseServiceProviders();
        this.registerCoreContainerAliases();
    }

    /**
     * Set the base path for the application.
     * @param {string} basePath 
     */
    setBasePath(basePath) {
        this.basePath = basePath;
        this.bindPathsInContainer();
        return this;
    }

    /**
     * Bind all of the application paths in the container.
     */
    bindPathsInContainer() {
        this.instance('path.base', this.basePath);
        this.instance('path.app', path.join(this.basePath, 'app'));
        this.instance('path.config', path.join(this.basePath, 'config'));
        this.instance('path.database', path.join(this.basePath, 'database'));
        this.instance('path.public', path.join(this.basePath, 'public'));
        this.instance('path.resources', path.join(this.basePath, 'resources'));
        this.instance('path.storage', path.join(this.basePath, 'storage'));
    }

    /**
     * Register the basic bindings into the container.
     */
    registerBaseBindings() {
        Container.setInstance(this);
        this.instance('app', this);
        this.instance(Container, this);
    }

    /**
     * Register all of the base service providers.
     */
    registerBaseServiceProviders() {
        // Register events, routing, etc. base providers here
    }

    /**
     * Bootstrap the application for HTTP/Console
     */
    async bootstrapWith(bootstrappers) {
        this.hasBeenBootstrapped = true;

        for (const bootstrapper of bootstrappers) {
            await (new bootstrapper()).bootstrap(this);
        }
    }

    /**
     * Register a service provider with the application.
     * @param {ServiceProvider|string} provider 
     * @param {boolean} force 
     */
    register(provider, force = false) {
        if (!provider) {
            return null;
        }

        // Handle string/class instance/object instance
        let instance;
        if (typeof provider === 'string') {
            const ProviderClass = require(provider);
            instance = new ProviderClass(this);
        } else if (typeof provider === 'function') {
            instance = new provider(this);
        } else {
            instance = provider; // It's already instantiated
        }

        if (!force && this.getProvider(instance)) {
            return this.getProvider(instance);
        }

        if (instance && typeof instance.register === 'function') {
            instance.register();
        }
        
        this.serviceProviders.push(instance);

        // If the application has already booted, we will boot this provider immediately.
        if (this.booted && instance && typeof instance.boot === 'function') {
            instance.boot();
        }

        return instance;
    }

    /**
     * Get the registered service provider instance if it exists.
     */
    getProvider(provider) {
        if (!provider) {
            return null;
        }

        const name = typeof provider === 'string' ? provider : (provider.constructor ? provider.constructor.name : null);
        
        if (!name) {
            return null;
        }

        return this.serviceProviders.find(p => p && p.constructor && p.constructor.name === name);
    }

    /**
     * Boot the application's service providers.
     */
    async boot() {
        if (this.booted) {
            return;
        }

        for (const provider of this.serviceProviders) {
            if (typeof provider.boot === 'function') {
                await provider.boot();
            }
        }

        this.booted = true;
    }

    /**
     * Register the core class aliases in the container.
     */
    registerCoreContainerAliases() {
        const aliases = {
            'app': [Application, Container],
            'config': [require('../Config/Repository')],
            'router': [require('../Routing/Router')],
            // Add more core aliases (db, auth, etc)
        };

        for (const [key, classes] of Object.entries(aliases)) {
            for (const aliasClass of classes) {
                if (typeof aliasClass === 'function') {
                    this.alias(key, aliasClass.name);
                }
            }
        }
    }
}

module.exports = Application;
