const Command = use('laranode/Console/Command');
const fs = require('fs');
const path = require('path');

class RouteCacheCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'route:cache';
        this.description = 'Create a route cache file for faster route registration';
    }

    async handle() {
        const Router = this.app.make('router');
        const routes = Router.getRoutes();

        // Ensure all actions are strings, throw error if closure
        for (const route of routes) {
            if (typeof route.action === 'function') {
                this.error(`Unable to prepare route [${route.uri}] for serialization. Uses Closure.`);
                return false;
            }
        }

        const cacheDir = base_path('bootstrap/cache');
        const cacheFile = path.join(cacheDir, 'routes.json');

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // To properly serialize, we only need the primitive data from the route objects
        const serializableRoutes = routes.map(r => ({
            method: r.method,
            uri: r.uri,
            action: r.action,
            middlewares: r.middlewares,
            _name: r._name || null
        }));

        fs.writeFileSync(cacheFile, JSON.stringify(serializableRoutes, null, 2));

        this.info('Routes cached successfully!');
    }
}

module.exports = RouteCacheCommand;
