const Schema = use('laranode/Database/Schema/Schema');

class CreatePersonalAccessTokensTable {
    async up() {
        await Schema.create('personal_access_tokens', (table) => {
            table.id();
            table.string('tokenable_type');
            table.integer('tokenable_id');
            table.string('name');
            table.string('token', 64).unique();
            table.string('abilities').nullable();
            table.string('last_used_at').nullable();
            table.string('expires_at').nullable();
            table.timestamps();
        });
    }

    async down() {
        await Schema.dropIfExists('personal_access_tokens');
    }
}

module.exports = CreatePersonalAccessTokensTable;
