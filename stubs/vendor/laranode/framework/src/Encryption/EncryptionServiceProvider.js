/**
 * Encryption Service Provider
 * 
 * Registers the encryption service in the container.
 * This is similar to Laravel's EncryptionServiceProvider.
 */

const EncryptionManager = require('./EncryptionManager');

class EncryptionServiceProvider {
    constructor(app) {
        this.app = app;
    }

    /**
     * Register the encryption service.
     */
    register() {
        this.app.singleton('encrypter', () => {
            const config = this.app.make('config');
            const encryption = new EncryptionManager();

            // Get the encryption key from config
            const key = config.get('app.key');

            if (!key) {
                console.warn('Warning: No APP_KEY configured. Encryption will not work properly.');
                return encryption;
            }

            // Handle base64 encoded keys (Laravel format)
            let keyValue = key;
            if (key.startsWith('base64:')) {
                keyValue = key.substring(7);
            }

            encryption.setKey(keyValue);

            return encryption;
        });

        // Also register as 'crypt' alias for Laravel compatibility
        this.app.singleton('crypt', () => {
            return this.app.make('encrypter');
        });
    }

    /**
     * Boot the service provider.
     */
    boot() {
        // Could add additional initialization here
    }
}

module.exports = EncryptionServiceProvider;
