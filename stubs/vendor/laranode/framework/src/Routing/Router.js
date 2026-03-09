class Router {
    constructor(app) {
        this.app = app;
        this.routes = [];
        this.currentGroup = [];
        this.bindings = {};
    }

    /**
     * Bind a model to a route parameter.
     */
    model(key, modelClass) {
        this.bind(key, (value) => {
            return modelClass.find(value);
        });
    }

    /**
     * Bind a callback to a route parameter.
     */
    bind(key, callback) {
        this.bindings[key] = callback;
    }

    /**
     * Get all registered bindings.
     */
    getBindings() {
        return this.bindings;
    }

    addRoute(method, uri, action) {
        // Apply group attributes (prefix, middleware, namespace)
        let prefix = this.currentGroup.map(g => g.prefix || '').join('');
        const middlewares = this.currentGroup.reduce((acc, g) => acc.concat(g.middleware || []), []);
        let namespace = this.currentGroup.map(g => g.namespace || '').filter(Boolean).join('/');

        let finalUri = '/' + (prefix + uri);
        finalUri = finalUri.replace(/\/+/g, '/'); // Normalize slashes
        // Convert Laravel {param} style to Express :param style
        finalUri = finalUri.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1');

        if (finalUri !== '/' && finalUri.endsWith('/')) {
            finalUri = finalUri.slice(0, -1);
        }

        let finalAction = action;
        if (typeof action === 'string') {
            if (!action.includes('@')) {
                action = `${action}@__invoke`;
            }
            if (namespace) {
                finalAction = namespace + '/' + action;
            } else {
                finalAction = action;
            }
        }

        const route = {
            method,
            uri: finalUri,
            action: finalAction,
            middlewares: [...middlewares],
            name: function (routeName) {
                this._name = routeName;
                return this;
            },
            middleware: function (mw) {
                // If passed as array or multiple args
                if (Array.isArray(mw)) {
                    this.middlewares.push(...mw);
                } else {
                    this.middlewares.push(mw);
                }
                return this;
            }
        };

        this.routes.push(route);
        return route;
    }

    getRouteByName(name) {
        return this.routes.find(r => r._name === name);
    }

    get(uri, action) { return this.addRoute('GET', uri, action); }
    post(uri, action) { return this.addRoute('POST', uri, action); }
    put(uri, action) { return this.addRoute('PUT', uri, action); }
    patch(uri, action) { return this.addRoute('PATCH', uri, action); }
    delete(uri, action) { return this.addRoute('DELETE', uri, action); }

    /**
     * Register a resource controller with all 7 RESTful routes.
     * 
     * @param {string} name - Resource name (e.g. 'photos')
     * @param {string} controller - Controller name (e.g. 'PhotoController')
     * @param {Object} options - { only: [...], except: [...] }
     */
    resource(name, controller, options = {}) {
        const param = name.replace(/s$/, ''); // photos -> photo
        const allRoutes = {
            index: () => this.get(`/${name}`, `${controller}@index`).name(`${name}.index`),
            create: () => this.get(`/${name}/create`, `${controller}@create`).name(`${name}.create`),
            store: () => this.post(`/${name}`, `${controller}@store`).name(`${name}.store`),
            show: () => this.get(`/${name}/{${param}}`, `${controller}@show`).name(`${name}.show`),
            edit: () => this.get(`/${name}/{${param}}/edit`, `${controller}@edit`).name(`${name}.edit`),
            update: () => {
                this.put(`/${name}/{${param}}`, `${controller}@update`).name(`${name}.update`);
                this.patch(`/${name}/{${param}}`, `${controller}@update`);
            },
            destroy: () => this.delete(`/${name}/{${param}}`, `${controller}@destroy`).name(`${name}.destroy`),
        };

        this._registerResourceRoutes(allRoutes, options);
    }

    /**
     * Register an API resource controller (no create/edit views).
     * 
     * @param {string} name - Resource name
     * @param {string} controller - Controller name
     * @param {Object} options - { only: [...], except: [...] }
     */
    apiResource(name, controller, options = {}) {
        const param = name.replace(/s$/, '');
        const allRoutes = {
            index: () => this.get(`/${name}`, `${controller}@index`).name(`${name}.index`),
            store: () => this.post(`/${name}`, `${controller}@store`).name(`${name}.store`),
            show: () => this.get(`/${name}/{${param}}`, `${controller}@show`).name(`${name}.show`),
            update: () => {
                this.put(`/${name}/{${param}}`, `${controller}@update`).name(`${name}.update`);
                this.patch(`/${name}/{${param}}`, `${controller}@update`);
            },
            destroy: () => this.delete(`/${name}/{${param}}`, `${controller}@destroy`).name(`${name}.destroy`),
        };

        this._registerResourceRoutes(allRoutes, options);
    }

    /**
     * Internal: register resource routes filtered by only/except.
     */
    _registerResourceRoutes(allRoutes, options) {
        let actions = Object.keys(allRoutes);

        if (options.only) {
            actions = actions.filter(a => options.only.includes(a));
        } else if (options.except) {
            actions = actions.filter(a => !options.except.includes(a));
        }

        for (const action of actions) {
            allRoutes[action]();
        }
    }

    /**
     * Create a route group with shared attributes.
     * @param {Object} attributes 
     * @param {Function} callback 
     */
    group(attributes, callback) {
        this.currentGroup.push(attributes);
        callback(this);
        this.currentGroup.pop();
    }

    /**
     * Get all registered routes.
     * @returns {Array}
     */
    getRoutes() {
        return this.routes;
    }
}

module.exports = Router;
