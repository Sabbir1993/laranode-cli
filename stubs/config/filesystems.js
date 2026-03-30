module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application.
    |
    | Supported: "local", "public", "s3"
    |
    */

    default: env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Here you may configure as many filesystem "disks" as you wish, and you
    | may even configure multiple disks of the same driver.
    |
    */

    disks: {
        local: {
            driver: 'local',
            root: storage_path('app'),
        },

        public: {
            driver: 'local',
            root: storage_path('app/public'),
            url: '/storage',
        },

        s3: {
            driver: 's3',
            key: env('AWS_ACCESS_KEY_ID'),
            secret: env('AWS_SECRET_ACCESS_KEY'),
            region: env('AWS_DEFAULT_REGION'),
            bucket: env('AWS_BUCKET'),
            url: env('IMG_PATH'),
        },
    },
};
