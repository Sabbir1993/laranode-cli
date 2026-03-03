module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application. You may change these defaults
    | as required, but they're a perfect start for most applications.
    |
    */

    defaults: {
        guard: 'web',
    },

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | here which uses session storage and the eloquent user provider.
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | Supported: "session", "api"
    |
    */

    guards: {
        web: {
            driver: 'session',
            provider: 'users',
        },

        api: {
            driver: 'api', // Sanctum style token based
            provider: 'users',
            hash_tokens: true, // Whether to store tokens as SHA-256 hashes
        },
    },

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    */

    providers: {
        users: {
            driver: 'eloquent',
            model: 'App/Models/User',
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Password Reset & Hashing
    |--------------------------------------------------------------------------
    |
    */
    passwords: {
        users: {
            provider: 'users',
            table: 'password_resets',
            expire: 60,
            throttle: 60,
        },
    },

    password_timeout: 10800,
};
