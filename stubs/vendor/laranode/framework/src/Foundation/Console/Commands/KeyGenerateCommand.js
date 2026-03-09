const Command = use('laranode/Console/Command');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KeyGenerateCommand extends Command {
    constructor() {
        super();
        this.signature = 'key:generate';
        this.description = 'Set the application key';
    }

    /**
     * Execute the console command.
     */
    async handle() {
        const key = this.generateRandomKey();

        if (!this.setKeyInEnvironmentFile(key)) {
            return;
        }

        this.info(`Application key set successfully.`);
    }

    /**
     * Generate a random key for the application.
     */
    generateRandomKey() {
        return 'base64:' + crypto.randomBytes(32).toString('base64');
    }

    /**
     * Set the application key in the environment file.
     */
    setKeyInEnvironmentFile(key) {
        const currentKey = process.env.APP_KEY;
        const envPath = path.join(process.cwd(), '.env');

        if (!fs.existsSync(envPath)) {
            this.error('.env file does not exist.');
            return false;
        }

        let envContents = fs.readFileSync(envPath, 'utf8');

        // Check if APP_KEY exists
        if (envContents.includes('APP_KEY=')) {
            // Replace existing key even if it has a value, or empty
            const currentKeyValue = currentKey ? `APP_KEY=${currentKey}` : 'APP_KEY=';
            // Use regex to replace the exact line to avoid partial matches
            envContents = envContents.replace(/^APP_KEY=.*$/m, `APP_KEY=${key}`);
        } else {
            envContents += `\nAPP_KEY=${key}\n`;
        }

        fs.writeFileSync(envPath, envContents);
        process.env.APP_KEY = key; // Update current process env

        return true;
    }
}

module.exports = KeyGenerateCommand;
