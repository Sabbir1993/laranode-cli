const bcrypt = require('bcryptjs');

class HashManager {
    /**
     * Hash the given value.
     *
     * @param  {string}  value
     * @param  {Object}  options
     * @return {string}
     */
    make(value, options = {}) {
        if (value === undefined || value === null) value = '';
        const rounds = options.rounds || 10;
        return bcrypt.hashSync(String(value), rounds);
    }

    /**
     * Check the given plain value against a hash.
     *
     * @param  {string}  value
     * @param  {string}  hashedValue
     * @param  {Object}  options
     * @return {boolean}
     */
    check(value, hashedValue, options = {}) {
        if (value === undefined || value === null) value = '';
        if (!hashedValue || hashedValue.length === 0) {
            return false;
        }

        return bcrypt.compareSync(String(value), hashedValue);
    }

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  {string}  hashedValue
     * @param  {Object}  options
     * @return {boolean}
     */
    needsRehash(hashedValue, options = {}) {
        // A simple check could be added if we were switching algorithms, 
        // but for now bcrypt handles everything automatically via rounds.
        // We'll just return false for MVP.
        return false;
    }
}

module.exports = HashManager;
