const ServiceProvider = require('../Support/ServiceProvider');

class FilesystemServiceProvider extends ServiceProvider {
    register() {
        this.app.singleton('filesystem', (app) => {
            const FilesystemManager = require('./FilesystemManager');
            return new FilesystemManager(app);
        });
    }

    boot() {
        //
    }
}

module.exports = FilesystemServiceProvider;
