/**
 * Password Broker
 * 
 * Handles password reset operations including:
 * - Generating reset tokens
 * - Sending reset emails
 * - Resetting passwords
 * 
 * Similar to Laravel's PasswordBroker.
 */

const crypto = require('crypto');

class PasswordBroker {
    constructor(userProvider) {
        this.userProvider = userProvider;
        this.passwordResetTable = 'password_resets';
        this.tokenLife = 60; // Token valid for 60 minutes
    }

    /**
     * Send a password reset link to the given email.
     * 
     * @param {string} email 
     * @param {Function} callback - Callback to send the reset email
     * @returns {Promise<string>}
     */
    async sendResetLink(email, callback) {
        const User = this.userProvider;

        // Find user by email
        const user = await User.where('email', email).first();

        if (!user) {
            return 'passwords.user';
        }

        // Generate reset token
        const token = await this.createResetToken(user);

        // Send reset link via callback (email service)
        if (callback) {
            await callback(user, token);
        }

        return 'passwords.sent';
    }

    /**
     * Create a password reset token for the user.
     * 
     * @param {Object} user 
     * @returns {Promise<string>}
     */
    async createResetToken(user) {
        const DB = use('laranode/Support/Facades/DB');

        // Generate random token
        const token = crypto.randomBytes(64).toString('hex');

        // Hash token for storage (like Laravel)
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Delete any existing tokens for this user
        await DB.table(this.passwordResetTable)
            .where('email', user.email)
            .delete();

        // Insert new token
        await DB.table(this.passwordResetTable).insert({
            email: user.email,
            token: hashedToken,
            created_at: new Date().toISOString()
        });

        return token;
    }

    /**
     * Reset the user's password.
     * 
     * @param {Object} credentials - { email, token, password, password_confirmation }
     * @returns {Promise<string>}
     */
    async reset(credentials) {
        const { email, token, password } = credentials;
        const DB = use('laranode/Support/Facades/DB');
        const Hash = use('laranode/Support/Facades/Hash');

        // Hash the incoming token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset record
        const resetRecord = await DB.table(this.passwordResetTable)
            .where('email', email)
            .where('token', hashedToken)
            .first();

        // Check if token exists and is valid
        if (!resetRecord) {
            return 'passwords.token';
        }

        // Check token expiration
        const tokenCreated = new Date(resetRecord.created_at).getTime();
        const now = Date.now();
        const tokenAgeInMinutes = (now - tokenCreated) / 1000 / 60;

        if (tokenAgeInMinutes > this.tokenLife) {
            return 'passwords.expired';
        }

        // Find the user
        const User = this.userProvider;
        const user = await User.where('email', email).first();

        if (!user) {
            return 'passwords.user';
        }

        // Update password
        user.password = await Hash.make(password);
        await user.save();

        // Delete used token
        await DB.table(this.passwordResetTable)
            .where('email', email)
            .delete();

        return 'passwords.reset';
    }

    /**
     * Validate the given password.
     * 
     * @param {string} password 
     * @returns {boolean}
     */
    validatePassword(password) {
        // Minimum 8 characters
        if (!password || password.length < 8) {
            return false;
        }
        return true;
    }

    /**
     * Set the password reset table name.
     * 
     * @param {string} table 
     */
    setPasswordResetTable(table) {
        this.passwordResetTable = table;
    }

    /**
     * Set token lifetime in minutes.
     * 
     * @param {number} minutes 
     */
    setTokenLife(minutes) {
        this.tokenLife = minutes;
    }
}

module.exports = PasswordBroker;
