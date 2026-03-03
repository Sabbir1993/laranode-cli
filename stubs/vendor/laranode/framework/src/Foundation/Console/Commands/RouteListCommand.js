const Command = use('laranode/Console/Command');

class RouteListCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'route:list {--method}';
        this.description = 'List all registered routes';
    }

    async handle(args, options) {
        // Need to boot providers to ensure routes are loaded
        await this.app.boot();

        const router = this.app.make('router');
        const routes = router.getRoutes();

        if (routes.length === 0) {
            this.error('No routes found.');
            return;
        }

        // We'll use basic native console.table for now

        const formattedRoutes = routes.map(route => {
            return {
                Method: route.method,
                URI: route.uri,
                Action: typeof route.action === 'function' ? 'Closure' : route.action,
                Middleware: route.middlewares.join(', ')
            };
        });

        if (options.method) {
            const filtered = formattedRoutes.filter(r => r.Method.toLowerCase() === options.method.toLowerCase());
            console.table(filtered);
            return;
        }

        console.table(formattedRoutes);
    }
}

module.exports = RouteListCommand;
