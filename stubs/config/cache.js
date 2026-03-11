module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Cache Store
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache connection that gets used while
    | using this caching library. Supported: "file", "memory"
    |
    */

    default: env('CACHE_DRIVER', 'file'),

    /*
    |--------------------------------------------------------------------------
    | Cache Stores
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the cache "stores" for your application as
    | well as their drivers.
    |
    */

    stores: {
        file: {
            driver: 'file',
            path: storage_path('framework/cache'),
        },

        memory: {
            driver: 'memory',
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Cache Key Prefix
    |--------------------------------------------------------------------------
    |
    | When utilizing a RAM based store such as memory, there might be other
    | applications utilizing the same cache. So, we'll specify a value to
    | get prefixed to all our keys so that we can avoid collisions.
    |
    */

    prefix: env('CACHE_PREFIX', 'laranode_cache_'),
};
