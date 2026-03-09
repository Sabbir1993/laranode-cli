const Command = use('laranode/Console/Command');
const fs = require('fs');

class RouteClearCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'route:clear';
        this.description = 'Remove the route cache file';
    }

    async handle() {
        const cacheFile = base_path('bootstrap/cache/routes.json');

        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
            this.info('Route cache cleared!');
        } else {
            this.info('No route cache found to clear.');
        }
    }
}

module.exports = RouteClearCommand;
