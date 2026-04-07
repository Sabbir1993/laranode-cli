const SessionGuard = require('./SessionGuard');
const config = global.config; // Use the global helper
const use = global.use;

class AuthManager {
    constructor(app) {
        this.app = app;
        this.customCreators = {};
        this.guards = {};
        this.userResolver = null;
    }

    /**
     * Get the currently authenticated user for the default or specified guard.
     */
    user(guard = null) {
        return this.guard(guard).user();
    }

    /**
     * Get a guard instance by name.
     *
     * @param  {string|null}  name
     * @return {Object}
     */
    guard(name = null) {
        name = name || this.getDefaultDriver();

        if (!this.guards[name]) {
            this.guards[name] = this.resolve(name);
        }

        return this.guards[name];
    }

    /**
     * Resolve the given guard.
     *
     * @param  {string}  name
     * @return {Object}
     */
    resolve(name) {
        const config = this.getConfig(name);

        if (!config) {
            throw new Error(`Auth guard [${name}] is not defined.`);
        }

        if (this.customCreators[config.driver]) {
            return this.customCreators[config.driver](this.app, name, config);
        }

        const driverMethod = 'create' + this.studly(config.driver) + 'Driver';

        if (typeof this[driverMethod] === 'function') {
            return this[driverMethod](name, config);
        }

        throw new Error(`Auth driver [${config.driver}] for guard [${name}] is not defined.`);
    }

    /**
     * Get the auth guard configuration.
     *
     * @param  {string}  name
     * @return {Object}
     */
    getConfig(name) {
        return config(`auth.guards.${name}`);
    }

    /**
     * Get the default authentication driver name.
     *
     * @return {string}
     */
    getDefaultDriver() {
        return config('auth.defaults.guard');
    }

    /**
     * Create a session based authentication guard.
     */
    createSessionDriver(name, configData) {
        const provider = this.createUserProvider(configData.provider);
        return new SessionGuard(name, provider);
    }

    /**
     * Create a token based authentication guard.
     */
    createApiDriver(name, configData) {
        const provider = this.createUserProvider(configData.provider);
        return {
            provider,
            userObj: null,

            check() {
                return this.userObj !== null;
            },
            guest() {
                return this.userObj === null;
            },
            user() {
                return this.userObj;
            },
            id() {
                return this.userObj ? this.userObj.id : null;
            },
            setUser(user) {
                this.userObj = user;
                return this;
            }
        };
    }

    createUserProvider(providerName) {
        const providerConfig = config(`auth.providers.${providerName}`);

        if (!providerConfig) {
            throw new Error(`Auth provider [${providerName}] is not defined.`);
        }

        if (providerConfig.driver === 'eloquent') {
            return use(providerConfig.model); // return the model class itself
        }

        throw new Error(`Auth provider driver [${providerConfig.driver}] is not supported.`);
    }

    /**
     * Dynamically call the default guard instance.
     *
     * @param  {string}  method
     * @param  {Array}   parameters
     * @return {any}
     */
    __call(method, parameters) {
        const guard = this.guard();
        if (typeof guard[method] === 'function') {
            return guard[method](...parameters);
        }
        throw new Error(`Method ${method} does not exist on auth guard.`);
    }

    studly(value) {
        return value.replace(/[-_]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toUpperCase());
    }
}

module.exports = AuthManager;
