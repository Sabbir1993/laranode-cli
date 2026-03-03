class SetLocale {
    /**
     * Handle an incoming request.
     * @param {Object} req 
     * @param {Object} res 
     * @param {Function} next 
     */
    async handle(req, res, next) {
        const Lang = use('laranode/Support/Facades/Lang');

        // 1. Check query parameter ?locale=
        let locale = req.query('locale');

        // 2. Check session if available
        if (!locale && req.session && req.session.has('locale')) {
            locale = req.session.get('locale');
        }

        // 3. Fallback to Accept-Language header
        if (!locale) {
            const acceptLanguage = req.header('Accept-Language');
            if (acceptLanguage) {
                // e.g., "en-US,en;q=0.9,bn;q=0.8" -> "en-US" -> "en"
                locale = acceptLanguage.split(',')[0].split('-')[0];
            }
        }

        if (locale) {
            Lang.setLocale(locale);
        }

        next();
    }
}

module.exports = SetLocale;
