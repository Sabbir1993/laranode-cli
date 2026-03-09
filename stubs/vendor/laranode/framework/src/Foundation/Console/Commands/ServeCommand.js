const Command = use('laranode/Console/Command');
const child_process = require('child_process');
const path = require('path');

class ServeCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'serve {--port}';
        this.description = 'Serve the application on the local development server';
    }

    async handle(args, options) {
        const port = options.port || config('app.port', 3000);
        const env = config('app.env', 'local');

        // Auto-restart logic like nodemon if not production
        if (env !== 'production' && !process.env.LARANODE_WATCHER_ACTIVE) {
            this.info('Starting development server with auto-reload...');
            this.info('Ignoring changes in: storage/, public/');

            const artisanScript = path.join(process.cwd(), 'artisan');
            const argsList = [
                'nodemon',
                '--watch', process.cwd(),
                '--ignore', 'storage/',
                '--ignore', 'public/',
                '--ext', 'js,json,html,css,md',
                artisanScript,
                'serve',
                options.port ? `--port=${options.port}` : ''
            ].filter(Boolean);

            const cp = child_process.spawn('npx', argsList, {
                stdio: 'inherit',
                env: { ...process.env, LARANODE_WATCHER_ACTIVE: 'true' },
                shell: true
            });

            return new Promise((resolve) => {
                cp.on('close', resolve);
            });
        }

        this.info(`Starting LaraNode server: http://localhost:${port}`);
        this.info(`Environment: ${env}`);

        // Boot the HTTP Kernel
        const kernel = this.app.make('laranode/Foundation/Http/Kernel');

        try {
            await this.app.boot();

            const expressApp = await kernel.handle();

            expressApp.listen(port, () => {
                this.info(`LaraNode server is running at http://localhost:${port}`);
            });

            // Keep process alive indefinitely
            return new Promise(() => {
                setInterval(() => { }, 1000 * 60 * 60);
            });
        } catch (err) {
            this.error('Failed to boot application: ' + err.message);
            console.error(err);
        }
    }
}

module.exports = ServeCommand;
