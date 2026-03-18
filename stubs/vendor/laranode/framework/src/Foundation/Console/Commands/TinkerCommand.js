const Command = use('laranode/Console/Command');
const repl = require('repl');

class TinkerCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'tinker';
        this.description = 'Interact with your application via REPL';
    }

    async handle(args, options) {
        this.info('LaraNode Tinker Environment');
        this.info('Type .help for detailed instructions.');

        // Start REPL
        const replServer = repl.start({
            prompt: '>>> ',
            useColors: true,
            ignoreUndefined: true,
        });

        // Set up history if possible
        replServer.setupHistory('.tinker_history', (err) => {
            if (err) {
                // Ignore history setup errors quietly
            }
        });

        // Inject the application instance
        replServer.context.app = this.app;

        // Inject global functions that exist in LaraNode
        if (typeof use !== 'undefined') replServer.context.use = use;
        if (typeof env !== 'undefined') replServer.context.env = env;
        if (typeof config !== 'undefined') replServer.context.config = config;
        if (typeof base_path !== 'undefined') replServer.context.base_path = base_path;
        if (typeof null_col !== 'undefined') replServer.context.null_col = null_col;

        // Attempt to pre-load standard Facades to save developer typing
        const standardFacades = [
            { name: 'DB', path: 'laranode/Support/Facades/DB' },
            { name: 'Route', path: 'laranode/Support/Facades/Route' },
            { name: 'Config', path: 'laranode/Support/Facades/Config' },
            { name: 'Event', path: 'laranode/Support/Facades/Event' },
            { name: 'Log', path: 'laranode/Support/Facades/Log' },
            { name: 'Hash', path: 'laranode/Support/Facades/Hash' },
            { name: 'Crypt', path: 'laranode/Support/Facades/Crypt' },
            { name: 'Cache', path: 'laranode/Support/Facades/Cache' },
            { name: 'Storage', path: 'laranode/Support/Facades/Storage' },
            { name: 'Auth', path: 'laranode/Support/Facades/Auth' },
            { name: 'Http', path: 'laranode/Support/Facades/Http' },
            { name: 'Mail', path: 'laranode/Support/Facades/Mail' },
        ];

        standardFacades.forEach(facade => {
            try {
                if (typeof use !== 'undefined') {
                    replServer.context[facade.name] = use(facade.path);
                }
            } catch (e) {
                // Skip if facade not available
            }
        });

        // Attempt to auto-load models
        try {
            const fs = require('fs');
            const path = require('path');
            const modelsPath = path.join(process.cwd(), 'app', 'Models');
            
            if (fs.existsSync(modelsPath)) {
                const files = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));
                for (const file of files) {
                    const modelName = path.basename(file, '.js');
                    try {
                        replServer.context[modelName] = use(`App/Models/${modelName}`);
                    } catch (e) {
                        // Skip if model fails to load
                    }
                }
            }
        } catch (e) {
            // Ignore auto-load errors
        }

        // Return a promise that resolves when the REPL is exited
        return new Promise((resolve) => {
            replServer.on('exit', () => {
                resolve();
            });
        });
    }
}

module.exports = TinkerCommand;
