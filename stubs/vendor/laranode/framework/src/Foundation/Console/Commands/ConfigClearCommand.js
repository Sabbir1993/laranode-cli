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
        const jsonCache = base_path('bootstrap/cache/config.json');
        const jsCache = base_path('bootstrap/cache/config.js');
        let cleared = false;

        if (fs.existsSync(jsonCache)) {
            fs.unlinkSync(jsonCache);
            cleared = true;
        }

        if (fs.existsSync(jsCache)) {
            fs.unlinkSync(jsCache);
            cleared = true;
        }

        if (cleared) {
            this.info('Configuration cache cleared!');
        } else {
            this.info('No configuration cache found to clear.');
        }
    }
}

module.exports = ConfigClearCommand;
