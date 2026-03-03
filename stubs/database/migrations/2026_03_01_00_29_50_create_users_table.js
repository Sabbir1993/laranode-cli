const Schema = use('laranode/Database/Schema/Schema');

class CreateUsersTable {
    async up() {
        await Schema.create('users', (table) => {
            table.id();
            table.string('name');
            table.string('email').unique();
            table.string('password');
            table.timestamps();
        });
    }

    async down() {
        await Schema.dropIfExists('users');
    }
}

module.exports = CreateUsersTable;
