const path = require('path');

/**
 * LaraNode Filesystem Manager
 *
 * Manages filesystem disk instances.
 * Matches Laravel's Storage API.
 */
class FilesystemManager {
    constructor(app) {
        this.app = app;
        this.disks = {};
    }

    /**
     * Get a filesystem disk instance.
     *
     * @param {string|null} name
     * @returns {LocalDriver}
     */
    disk(name = null) {
        const config = this.app.make('config');
        name = name || config.get('filesystems.default', 'local');

        if (!this.disks[name]) {
            this.disks[name] = this._resolve(name);
        }

        return this.disks[name];
    }

    /**
     * Resolve a disk instance by name.
     */
    _resolve(name) {
        const config = this.app.make('config');
        const diskConfig = config.get(`filesystems.disks.${name}`);

        if (!diskConfig) {
            throw new Error(`Filesystem disk [${name}] is not defined.`);
        }

        switch (diskConfig.driver) {
            case 'local':
                const LocalDriver = require('./Drivers/LocalDriver');
                return new LocalDriver(diskConfig);
            case 's3':
                const S3Driver = require('./Drivers/S3Driver');
                return new S3Driver(diskConfig);
            default:
                throw new Error(`Filesystem driver [${diskConfig.driver}] is not supported. Install the appropriate driver package.`);
        }
    }

    // Proxy common methods to the default disk

    async put(filePath, contents, options = {}) {
        return this.disk().put(filePath, contents, options);
    }

    async get(filePath) {
        return this.disk().get(filePath);
    }

    async exists(filePath) {
        return this.disk().exists(filePath);
    }

    async delete(filePath) {
        return this.disk().delete(filePath);
    }

    async copy(from, to) {
        return this.disk().copy(from, to);
    }

    async move(from, to) {
        return this.disk().move(from, to);
    }

    async size(filePath) {
        return this.disk().size(filePath);
    }

    async lastModified(filePath) {
        return this.disk().lastModified(filePath);
    }

    async files(directory = '') {
        return this.disk().files(directory);
    }

    async allFiles(directory = '') {
        return this.disk().allFiles(directory);
    }

    async directories(directory = '') {
        return this.disk().directories(directory);
    }

    async makeDirectory(directory) {
        return this.disk().makeDirectory(directory);
    }

    async deleteDirectory(directory) {
        return this.disk().deleteDirectory(directory);
    }

    url(filePath) {
        return this.disk().url(filePath);
    }

    path(filePath) {
        return this.disk().path(filePath);
    }
}

module.exports = FilesystemManager;
