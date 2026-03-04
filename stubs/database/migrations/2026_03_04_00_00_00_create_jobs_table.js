const Schema = use('laranode/Database/Schema/Schema');

class CreateJobsTable {
    async up() {
        await Schema.create('jobs', (table) => {
            table.id();
            table.string('queue').default('default');
            table.text('payload');
            table.integer('attempts').default(0);
            table.integer('reserved_at').nullable();
            table.integer('available_at');
            table.integer('created_at');
        });
    }

    async down() {
        await Schema.dropIfExists('jobs');
    }
}

module.exports = CreateJobsTable;
