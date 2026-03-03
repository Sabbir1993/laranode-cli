const Translator = require('./Translator');

class TranslationServiceProvider {
    constructor(app) {
        this.app = app;
    }

    register() {
        this.app.singleton('translator', () => {
            // Get configured locale, falback to 'en'
            const locale = typeof config === 'function' ? config('app.locale', 'en') : 'en';
            const fallback = typeof config === 'function' ? config('app.fallback_locale', 'en') : 'en';

            const translator = new Translator(this.app, locale);
            translator.setFallback(fallback);
            return translator;
        });

        // Register global helpers if not already defined
        if (typeof global.__ === 'undefined') {
            global.__ = (key, replace = {}, locale = null) => {
                return this.app.make('translator').get(key, replace, locale);
            };
        }

        if (typeof global.trans === 'undefined') {
            global.trans = (key, replace = {}, locale = null) => {
                return this.app.make('translator').get(key, replace, locale);
            };
        }

        if (typeof global.transChoice === 'undefined') {
            global.transChoice = (key, count, replace = {}, locale = null) => {
                return this.app.make('translator').choice(key, count, replace, locale);
            };
        }
    }

    boot() {
        // We can add middleware here to auto-detect and set locale from request
        // e.g. from session or headers, if needed.
    }
}

module.exports = TranslationServiceProvider;
