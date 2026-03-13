module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    */
    default: env('DB_CONNECTION', 'sqlite'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    */
    connections: {
        sqlite: {
            driver: 'sqlite',
            database: env('DB_DATABASE', database_path('database.sqlite')),
            foreign_key_constraints: env('DB_FOREIGN_KEYS', true),
        },

        mysql: {
            driver: 'mysql',
            host: env('DB_HOST', '127.0.0.1'),
            port: env('DB_PORT', '3306'),
            database: env('DB_DATABASE', 'laranode'),
            username: env('DB_USERNAME', 'root'),
            password: env('DB_PASSWORD', ''),
            timezone: env('DB_TIMEZONE', '+06:00'),
            strict: env('DB_STRICT', true),
            pool: {
                min: 2,
                max: 10,
            }
        },

        pgsql: {
            driver: 'pgsql',
            host: env('DB_HOST', '127.0.0.1'),
            port: env('DB_PORT', '5432'),
            database: env('DB_DATABASE', 'laranode'),
            username: env('DB_USERNAME', 'postgres'),
            password: env('DB_PASSWORD', ''),
            pool: {
                min: 2,
                max: 10,
            }
        },
    }
};
