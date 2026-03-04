module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    */
    name: env('APP_NAME', 'LaraNode'),

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    */
    env: env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    */
    debug: env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    */
    url: env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Application Port
    |--------------------------------------------------------------------------
    */
    port: env('APP_PORT', 8000),

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    */
    locale: env('APP_LOCALE', 'en'),

    /*
    |--------------------------------------------------------------------------
    | Application Key
    |--------------------------------------------------------------------------
    */
    key: env('APP_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Autoloaded Service Providers
    |--------------------------------------------------------------------------
    */
    providers: [
        // Laranode Framework Service Providers...
        require(base_path('vendor/laranode/framework/src/Http/HttpServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Foundation/Providers/RouteServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Foundation/Providers/DatabaseServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Log/LogServiceProvider')),
        require(base_path('vendor/laranode/framework/src/View/ViewServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Translation/TranslationServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Auth/AuthServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Hashing/HashServiceProvider')),
        require(base_path('vendor/laranode/framework/src/Encryption/EncryptionServiceProvider')),

        // Application Service Providers...
        require(base_path('app/Providers/AppServiceProvider')),
        require(base_path('app/Providers/RouteServiceProvider')),
    ],
};
