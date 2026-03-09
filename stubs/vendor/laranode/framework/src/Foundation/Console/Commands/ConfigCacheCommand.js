const Command = use('laranode/Console/Command');
const fs = require('fs');
const path = require('path');

class ConfigCacheCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'config:cache';
        this.description = 'Create a cache file for faster configuration loading';
    }

    async handle() {
        const configPath = base_path('config');
        const cacheDir = base_path('bootstrap/cache');
        const cacheFile = path.join(cacheDir, 'config.json');

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const config = {};
        const files = fs.readdirSync(configPath);

        this.info('Configuration caching started...');

        for (const file of files) {
            if (file.endsWith('.js')) {
                const key = file.replace('.js', '');
                const filePath = path.join(configPath, file);

                // Clear require cache safely so it pulls fresh
                delete require.cache[require.resolve(filePath)];
                config[key] = require(filePath);
            }
        }

        fs.writeFileSync(cacheFile, JSON.stringify(config, null, 2));

        this.info('Configuration cached successfully!');
    }
}

module.exports = ConfigCacheCommand;
