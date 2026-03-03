const Kernel = require('../../vendor/laranode/framework/src/Foundation/Http/Kernel');

class HttpKernel extends Kernel {
    constructor(app, router) {
        super(app, router);

        // Global Middleware
        this.middleware = [
            require('../../vendor/laranode/framework/src/Http/Middleware/TrimStrings'),
            require('../../vendor/laranode/framework/src/Http/Middleware/SecurityHeaders'),
        ];

        // Middleware groups
        this.middlewareGroups = {
            'web': [
                'bindings',
                'csrf',
            ],
            'api': [
                'bindings',
                // 'throttle:api'
            ]
        };

        // Named middleware
        this.routeMiddleware = {
            'auth': require('../../vendor/laranode/framework/src/Auth/Middleware/Authenticate'),
            'cors': require('../../vendor/laranode/framework/src/Http/Middleware/Cors'),
            'csrf': require('../../vendor/laranode/framework/src/Http/Middleware/VerifyCsrfToken'),
            'throttle': require('../../vendor/laranode/framework/src/Http/Middleware/RateLimiter'),
            'bindings': require('../../vendor/laranode/framework/src/Http/Middleware/SubstituteBindings'),
            'security': require('../../vendor/laranode/framework/src/Http/Middleware/SecurityHeaders'),
        };
    }
}

module.exports = HttpKernel;
