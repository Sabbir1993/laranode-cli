const Command = use('laranode/Console/Command');
const fs = require('fs');
const path = require('path');

class ConfigClearCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'config:clear';
        this.description = 'Remove the configuration cache file';
    }

    async handle() {
        const cacheFile = base_path('bootstrap/cache/config.json');

        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
            this.info('Configuration cache cleared!');
        } else {
            this.info('No configuration cache found to clear.');
        }
    }
}

module.exports = ConfigClearCommand;
