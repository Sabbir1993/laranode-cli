module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | This option controls the default mailer that is used to send any email
    | messages sent by your application. Supported: "smtp", "log"
    |
    */

    default: env('MAIL_MAILER', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    */

    mailers: {
        smtp: {
            host: env('MAIL_HOST', 'smtp.mailgun.org'),
            port: env('MAIL_PORT', 587),
            username: env('MAIL_USERNAME'),
            password: env('MAIL_PASSWORD'),
            encryption: env('MAIL_ENCRYPTION', 'tls'),
        },

        log: {
            // Logs emails to the application log instead of sending
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    */

    from: {
        address: env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        name: env('MAIL_FROM_NAME', 'LaraNode'),
    },
};
