const crypto = require('crypto');
const PersonalAccessToken = use('laranode/Auth/PersonalAccessToken');

const HasApiTokens = (Base) => class extends Base {
    /**
     * Get the access tokens that belong to model.
     */
    tokens() {
        return this.morphMany(PersonalAccessToken, 'tokenable');
    }

    /**
     * Create a new personal access token for the user.
     *
     * @param  {string}  name
     * @param  {Array}  abilities
     * @return {Object} PlainTextToken & AccessToken instance
     */
    async createToken(name, abilities = ['*']) {
        const plainTextToken = crypto.randomBytes(40).toString('hex');
        const config = use('laranode/Support/Facades/Config');
        const hashConfig = config.get('auth.guards.api.hash_tokens');
        const shouldHash = hashConfig === undefined ? true : hashConfig;
        const storedToken = shouldHash
            ? crypto.createHash('sha256').update(plainTextToken).digest('hex')
            : plainTextToken;

        const tokenModel = await PersonalAccessToken.create({
            name,
            token: storedToken,
            abilities: JSON.stringify(abilities),
            tokenable_id: this.id,
            tokenable_type: this.constructor.name
        });

        return {
            accessToken: tokenModel,
            plainTextToken: `${tokenModel.id}|${plainTextToken}`
        };
    }

    /**
     * Get the current access token being used.
     */
    currentAccessToken() {
        return this._accessToken;
    }

    /**
     * Set the current access token.
     */
    withAccessToken(token) {
        this._accessToken = token;
        return this;
    }
};

module.exports = HasApiTokens;
