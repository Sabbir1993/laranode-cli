class Gate {
    constructor(app, userResolver) {
        this.app = app;
        this.userResolver = userResolver;
        this.policies = {};
        this.abilities = {};
        this.beforeCallbacks = [];
        this.afterCallbacks = [];
    }

    /**
     * Define a new ability.
     * @param {string} ability
     * @param {Function} callback
     */
    define(ability, callback) {
        this.abilities[ability] = callback;
        return this;
    }

    /**
     * Define a policy class for a given class type.
     * @param {string|Function} model
     * @param {string|Function} policy
     */
    policy(model, policy) {
        const modelName = typeof model === 'string' ? model : model.name;
        this.policies[modelName] = policy;
        return this;
    }

    /**
     * Register a callback to run before all Gate checks.
     */
    before(callback) {
        this.beforeCallbacks.push(callback);
        return this;
    }

    /**
     * Register a callback to run after all Gate checks.
     */
    after(callback) {
        this.afterCallbacks.push(callback);
        return this;
    }

    /**
     * Determine if a given ability has been defined.
     */
    has(ability) {
        return this.abilities[ability] !== undefined;
    }

    /**
     * Determine if the given ability should be granted for the current user.
     */
    allows(ability, ...args) {
        return this.check(ability, ...args);
    }

    /**
     * Determine if the given ability should be denied for the current user.
     */
    denies(ability, ...args) {
        return !this.allows(ability, ...args);
    }

    /**
     * Determine if the given ability should be granted for the current user.
     */
    check(ability, ...args) {
        const user = this.resolveUser();

        if (!user) {
            return false;
        }

        return this.forUser(user).check(ability, ...args);
    }

    /**
     * Determine if the ability should be granted for the given user.
     */
    forUser(user) {
        return {
            allows: (ability, ...args) => this.checkRaw(user, ability, ...args),
            denies: (ability, ...args) => !this.checkRaw(user, ability, ...args),
            check: (ability, ...args) => this.checkRaw(user, ability, ...args),
            any: (abilities, ...args) => abilities.some(a => this.checkRaw(user, a, ...args)),
            none: (abilities, ...args) => !abilities.some(a => this.checkRaw(user, a, ...args)),
        };
    }

    /**
     * Perform the actual authorization check.
     */
    checkRaw(user, ability, ...args) {
        // Run before callbacks
        for (const before of this.beforeCallbacks) {
            const result = before(user, ability, ...args);
            if (result !== undefined && result !== null) {
                return result;
            }
        }

        let result = false;

        // Check if there is a policy for the first argument
        if (args.length > 0 && args[0]) {
            const model = args[0];
            const policy = this.getPolicyFor(model);

            if (policy && typeof policy[ability] === 'function') {
                result = policy[ability](user, ...args);
            }
        }

        // If no policy resolved it, check if a direct ability is defined
        if (result === false && this.has(ability)) {
            result = this.abilities[ability](user, ...args);
        }

        // Run after callbacks
        for (const after of this.afterCallbacks) {
            after(user, ability, result, ...args);
        }

        return !!result;
    }

    /**
     * Get a policy instance for a given class.
     */
    getPolicyFor(classOrObject) {
        if (!classOrObject) return null;

        const className = typeof classOrObject === 'string'
            ? classOrObject
            : (classOrObject.constructor ? classOrObject.constructor.name : null);

        if (!className || !this.policies[className]) {
            // Auto-resolve policy if not explicitly registered
            // Try to find ModelPolicy inside app/Policies
            if (className) {
                try {
                    const policyClass = use(`App/Policies/${className}Policy`);
                    this.policies[className] = policyClass;
                } catch (e) {
                    return null;
                }
            } else {
                return null;
            }
        }

        const PolicyClass = this.policies[className];
        return new PolicyClass();
    }

    /**
     * Resolve the user from the registered resolver.
     */
    resolveUser() {
        return this.userResolver ? this.userResolver() : null;
    }
}

module.exports = Gate;
