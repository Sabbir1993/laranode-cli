/**
 * Create Password Resets Table Migration
 * 
 * Creates a table for storing password reset tokens.
 */

const Schema = use('laranode/Database/Schema/Schema');

class PasswordResetsSchema {
    async up() {
        await Schema.create('password_resets', (table) => {
            table.string('email').index();
            table.string('token').index();
            table.timestamp('created_at').nullable();
            table.timestamp('expires_at').nullable();
        });
    }

    async down() {
        await Schema.dropIfExists('password_resets');
    }
}

module.exports = PasswordResetsSchema;
