module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Queue Connection Name
    |--------------------------------------------------------------------------
    |
    | LaraNode's queue API supports a variety of back-ends via a single
    | API, giving you convenient access to each back-end using the same
    | syntax for every one. Here you may define a default connection.
    |
    | Supported: "database", "redis"
    |
    */

    default: env('QUEUE_CONNECTION', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Queue Connections
    |--------------------------------------------------------------------------
    |
    | Here you may configure the connection information for each server that
    | is used by your application. A default configuration has been added
    | for each back-end shipped with LaraNode. You are free to add more.
    |
    */

    connections: {

        database: {
            driver: 'database',
            table: 'jobs',
            queue: 'default',
            retry_after: 90,
        },

        redis: {
            driver: 'redis',
            connection: env('REDIS_URL', 'redis://127.0.0.1:6379'),
            queue: env('REDIS_QUEUE', 'default'),
            retry_after: 90,
            prefix: env('REDIS_PREFIX', 'queues:'),
        },

    },

};
