const path = require('path');
const Pipeline = require('../../Pipeline/Pipeline');
const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const HttpContext = require('./HttpContext');
const FileSessionStore = require('../../Session/FileSessionStore');

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

        // Trust the reverse proxy to ensure secure cookies and correct IP detection
        this.expressApp.set('trust proxy', true);

        // Workaround for Reverse Proxies (Nginx, Apache) that omit X-Forwarded-Proto
        this.expressApp.use((req, res, next) => {
            if (process.env.APP_ENV === 'production') {
                req.headers['x-forwarded-proto'] = 'https';
            }
            next();
        });

        // 1. Setup global express middleware (body parser etc)
        this.expressApp.use(helmet({
            contentSecurityPolicy: false,
        }));
        this.expressApp.use(cookieParser());
        this.expressApp.use(express.static(process.cwd() + '/public'));
        this.expressApp.use(express.json());
        this.expressApp.use(express.urlencoded({ extended: true }));
        // Method override: allows HTML forms to submit PUT/PATCH/DELETE via _method body field
        const methodOverride = require('method-override');
        this.expressApp.use(methodOverride((req) => {
            if (req.body && req.body._method) {
                const method = req.body._method;
                delete req.body._method;
                return method;
            }
        }));
        this.expressApp.use(fileUpload({
            createParentPath: true, // Automatically creates directories if they don't exist
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max limit
        }));

        const config = this.app.make('config');
        const sessionConfig = config.get('session');
        let sessionStore;

        if (sessionConfig.driver === 'file') {
            sessionStore = new FileSessionStore({
                directory: sessionConfig.files || path.join(process.cwd(), 'storage/framework/sessions')
            });
        } else if (sessionConfig.driver === 'redis') {
            try {
                const RedisStore = require('connect-redis').default;
                const Redis = use('laranode/Support/Facades/Redis');
                sessionStore = new RedisStore({
                    client: Redis.connection().client,
                    prefix: sessionConfig.cookie + ':sess:'
                });
            } catch (e) {
                console.warn('Redis session store requested but not fully configured or connect-redis not installed. Falling back to memory.');
            }
        }
        // Default to MemoryStore if no store resolved or memory driver requested

        this.expressApp.use(session({
            store: sessionStore,
            name: sessionConfig.cookie || 'laranode_session',
            secret: process.env.APP_KEY || 'laranode_secret_key',
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: sessionConfig.secure || process.env.APP_ENV === 'production',
                httpOnly: sessionConfig.http_only || true,
                sameSite: sessionConfig.same_site || 'lax',
                maxAge: (sessionConfig.lifetime || 120) * 60 * 1000,
                path: sessionConfig.path || '/',
                domain: sessionConfig.domain || null
            }
        }));
        this.expressApp.use(flash());

        // 2. Setup global laranode middleware
        this.expressApp.use(async (req, res, next) => {
            const context = { req, res, app: this.app };

            // Auto-flash old input on POST/PUT/PATCH requests
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
                if (typeof req.flash === 'function') {
                    req.flash('old', req.body);
                }
            }

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
            HttpContext.run({ req, res }, () => {
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
                HttpContext.run({ req, res }, async () => {
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
            } else if (Array.isArray(action)) {
                // E.g [UserController, 'index']
                const [ControllerClass, method] = action;
                const controller = this.app.make(ControllerClass);

                let actionReq = req;

                // Auto-resolve FormRequest if specified in controller mapping
                if (ControllerClass.requests && ControllerClass.requests[method]) {
                    const RequestClass = ControllerClass.requests[method];
                    actionReq = new RequestClass(expressReq);
                    await actionReq.validateResolved();
                }

                const routeParams = Object.values(expressReq.params || {});
                const result = await controller[method](...routeParams, actionReq, res);
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

                // Inject route params as leading args: edit(id, req, res), show(ref, req, res), etc.
                const routeParams = Object.values(expressReq.params || {});
                const result = await controller[method](...routeParams, actionReq, res);
                this.handleResult(result, res, expressRes);
            }
        } catch (err) {
            if (err.name === 'ValidationException') {
                // Check if this is an AJAX/JSON request
                const isJson = expressReq.xhr || expressReq.accepts(['html', 'json']) === 'json' ||
                    expressReq.get('accept') === 'application/json' ||
                    expressReq.path.startsWith('/api');

                if (isJson) {
                    // Laravel-like JSON response format
                    expressRes.status(err.status || 422).json({
                        message: err.message,
                        errors: err.errors,
                        // Additional Laravel-like info
                        error: err.message,
                        // You can also include validated data if needed
                        // validated: err.validator ? err.validator._validatedData : {}
                    });
                } else {
                    // View/HTML response - flash errors and old input
                    // Use getErrors() to get plain object for flash
                    const errorsToFlash = typeof err.getErrors === 'function' ? err.getErrors() : err.errors;
                    expressReq.flash('errors', errorsToFlash);
                    expressReq.flash('old', expressReq.body);

                    // Create a MessageBag-like object for backward compatibility
                    const MessageBag = use('laranode/Support/MessageBag');
                    const errorsBag = new MessageBag(err.errors);

                    // Make errors available in session for views
                    expressReq.session.errors = errorsBag;

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
            // Controller returned the Response wrapper (e.g. return res.status(500))
            // Trigger raw() so the appropriate error page is rendered
            if (result && result._isLaraResponse) {
                if (!expressRes.headersSent) result.raw();
                return;
            }

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
