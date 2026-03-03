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

        let finalUri = (prefix + uri).replace(/\/+/g, '/'); // Normalize slashes
        // Convert Laravel {param} style to Express :param style
        finalUri = finalUri.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1');

        if (finalUri !== '/' && finalUri.endsWith('/')) {
            finalUri = finalUri.slice(0, -1);
        }

        let finalAction = action;
        if (typeof action === 'string' && namespace) {
            finalAction = namespace + '/' + action;
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

    resource(name, controller) {
        this.get(`/${name}`, `${controller}@index`);
        this.get(`/${name}/create`, `${controller}@create`);
        this.post(`/${name}`, `${controller}@store`);
        this.get(`/${name}/:id`, `${controller}@show`);
        this.get(`/${name}/:id/edit`, `${controller}@edit`);
        this.put(`/${name}/:id`, `${controller}@update`);
        this.patch(`/${name}/:id`, `${controller}@update`);
        this.delete(`/${name}/:id`, `${controller}@destroy`);
    }

    apiResource(name, controller) {
        this.get(`/${name}`, `${controller}@index`);
        this.post(`/${name}`, `${controller}@store`);
        this.get(`/${name}/:id`, `${controller}@show`);
        this.put(`/${name}/:id`, `${controller}@update`);
        this.patch(`/${name}/:id`, `${controller}@update`);
        this.delete(`/${name}/:id`, `${controller}@destroy`);
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
