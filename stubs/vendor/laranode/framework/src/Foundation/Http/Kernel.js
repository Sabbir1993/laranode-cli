const Pipeline = require('../../Pipeline/Pipeline');
const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const flash = require('connect-flash');

class Kernel {
    /**
     * 
     * @param {Application} app 
     * @param {Router} router 
     */
    constructor(app, router) {
        this.app = app;
        this.router = router;
        this.expressApp = express();

        this.middleware = [];
        this.middlewareGroups = {};
        this.routeMiddleware = {};

        this.bootstrappers = [
            // Add bootstrappers here (LoadEnvironmentVariables, LoadConfiguration, etc)
        ];
    }

    /**
     * Bootstrap the application.
     */
    async bootstrap() {
        if (!this.app.hasBeenBootstrapped) {
            await this.app.bootstrapWith(this.bootstrappers);
        }
    }

    /**
     * Setup Express HTTP server and connect to our Router
     */
    async handle() {
        await this.bootstrap();

        // 1. Setup global express middleware (body parser etc)
        this.expressApp.use(express.static(process.cwd() + '/public'));
        this.expressApp.use(express.json());
        this.expressApp.use(express.urlencoded({ extended: true }));
        this.expressApp.use(fileUpload({
            createParentPath: true, // Automatically creates directories if they don't exist
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max limit
        }));

        this.expressApp.use(session({
            secret: process.env.APP_KEY || 'laranode_secret_key',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: process.env.APP_ENV === 'production' }
        }));
        this.expressApp.use(flash());

        // 2. Setup global laranode middleware
        this.expressApp.use(async (req, res, next) => {
            const context = { req, res, app: this.app };

            try {
                await (new Pipeline(this.app))
                    .send(context)
                    .through(this.middleware)
                    .then(async (ctx) => {
                        next();
                    });
            } catch (err) {
                next(err);
            }
        });

        // 3. Mount registered routes
        this.mountRoutes();

        // 4. Catch-all 404 — any request that didn't match a route
        this.expressApp.use((req, res, next) => {
            const error = new Error(`The route [${req.method} ${req.path}] could not be found.`);
            error.status = 404;
            next(error);
        });

        // 5. Global Error Handler
        this.expressApp.use((err, req, res, next) => {
            let ExceptionHandler;
            try {
                // Try user's app handler first (app/Exceptions/Handler.js)
                ExceptionHandler = use('App/Exceptions/Handler');
            } catch (e) {
                // Fall back to base framework handler
                ExceptionHandler = use('laranode/Foundation/Exceptions/Handler');
            }
            const handler = new ExceptionHandler(this.app);
            if (typeof handler.register === 'function') {
                handler.register();
            }
            handler.report(err);
            handler.render(err, req, res);
        });

        return this.expressApp;
    }

    /**
     * Iterate over the Laranode router and attach to Express
     */
    mountRoutes() {
        const routes = this.router.getRoutes();

        for (const route of routes) {
            const method = route.method.toLowerCase();
            const uri = route.uri;
            const action = route.action;
            const middlewares = route.middlewares;

            this.expressApp[method](uri, async (req, res, next) => {
                const context = { req, res, app: this.app };

                // Resolve route specific middleware + group middleware
                const pipeMiddlewares = this.resolveMiddlewares(middlewares);

                try {
                    await (new Pipeline(this.app))
                        .send(context)
                        .through(pipeMiddlewares)
                        .then(async (ctx) => {
                            // Execute actual controller/closure
                            await this.executeAction(action, ctx.req, ctx.res, next);
                        });
                } catch (err) {
                    next(err);
                }
            });
        }
    }

    /**
     * Resolve string middleware to actual classes/functions
     */
    resolveMiddlewares(middlewares) {
        let resolved = [];

        const flatten = (mws) => {
            let result = [];
            for (let mw of mws) {
                let name = mw;
                let params = [];

                if (typeof mw === 'string' && mw.includes(':')) {
                    const parts = mw.split(':');
                    name = parts[0];
                    params = parts[1] ? parts[1].split(',') : [];
                }

                if (this.middlewareGroups[name]) {
                    result = result.concat(flatten(this.middlewareGroups[name]));
                } else if (this.routeMiddleware[name]) {
                    result.push({ isResolvedPipe: true, instance: this.routeMiddleware[name], params });
                } else if (typeof mw === 'function' || typeof mw === 'object') {
                    result.push(mw);
                } else {
                    throw new Error(`Route middleware [${name}] is not defined.`);
                }
            }
            return result;
        };

        return flatten(middlewares);
    }

    /**
     * Execute the controller action or closure
     */
    async executeAction(action, expressReq, expressRes, next) {
        try {
            const Request = use('laranode/Http/Request');
            const Response = use('laranode/Http/Response');

            const req = new Request(expressReq);
            const res = new Response(expressRes);

            if (typeof action === 'function') {
                const result = await action(req, res);
                this.handleResult(result, res, expressRes);
            } else if (typeof action === 'string') {
                // E.g 'UserController@index'
                const [controllerName, method] = action.split('@');
                const ControllerClass = require(this.app.make('path.app') + '/Http/Controllers/' + controllerName);
                const controller = this.app.make(ControllerClass); // Resolve via container

                let actionReq = req;

                // Auto-resolve FormRequest if specified in controller mapping
                if (ControllerClass.requests && ControllerClass.requests[method]) {
                    const RequestClass = ControllerClass.requests[method];
                    actionReq = new RequestClass(expressReq);
                    // Pre-validate. Will throw ValidationException if fails.
                    await actionReq.validateResolved();
                }

                const result = await controller[method](actionReq, res);
                this.handleResult(result, res, expressRes);
            }
        } catch (err) {
            if (err.name === 'ValidationException') {
                if (expressReq.xhr || expressReq.accepts(['html', 'json']) === 'json') {
                    expressRes.status(err.status || 422).json({
                        message: err.message,
                        errors: err.errors
                    });
                } else {
                    expressReq.flash('errors', err.errors);
                    expressReq.flash('old', expressReq.body);
                    const referer = expressReq.get('Referrer') || '/';
                    expressRes.redirect(referer);
                }
            } else {
                next(err);
            }
        }
    }

    /**
     * Automatically send response if the action returned a value (Laravel behavior)
     */
    handleResult(result, res, expressRes) {
        if (result !== undefined && !expressRes.headersSent) {
            // Check if it's a JsonResource or ResourceCollection
            // Note: Since JsonResource uses a Proxy, typeof result === 'object' is true
            // but we need to explicitly check for the resolve method
            if (result && typeof result.resolve === 'function') {
                const Request = use('laranode/Http/Request');
                const req = new Request(expressRes.req); // mock request for now

                // Set application/json explicitly
                expressRes.setHeader('Content-Type', 'application/json');
                expressRes.status(200).send(JSON.stringify(result.resolve(req)));
            } else if (typeof result === 'object') {
                expressRes.json(result);
            } else {
                expressRes.send(result);
            }
        }
    }
}

module.exports = Kernel;
