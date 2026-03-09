const Command = use('laranode/Console/Command');
const fs = require('fs');
const path = require('path');

class StorageLinkCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'storage:link';
        this.description = 'Create a symbolic link from [public/storage] to [storage/app/public]';
    }

    async handle() {
        const publicStoragePath = path.join(this.app.make('path.public'), 'storage');
        const storagePath = path.join(this.app.make('path.storage'), 'app/public');

        if (fs.existsSync(publicStoragePath)) {
            this.error('The [public/storage] directory already exists.');
            return;
        }

        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }

        try {
            // In Windows, symlink requires administrative privileges or developer mode
            // Using 'junction' for better compatibility on Windows for directories
            const type = process.platform === 'win32' ? 'junction' : 'dir';
            fs.symlinkSync(storagePath, publicStoragePath, type);

            this.info(`The [${publicStoragePath}] link has been connected to [${storagePath}].`);
        } catch (error) {
            this.error('The symbolic link could not be created.');
            this.error(error.message);
        }
    }
}

module.exports = StorageLinkCommand;
