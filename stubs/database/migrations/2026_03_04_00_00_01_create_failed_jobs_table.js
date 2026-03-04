const Schema = use('laranode/Database/Schema/Schema');

class CreateFailedJobsTable {
    async up() {
        await Schema.create('failed_jobs', (table) => {
            table.id();
            table.string('uuid').unique();
            table.text('connection');
            table.text('queue');
            table.text('payload');
            table.text('exception');
            table.dateTime('failed_at');
        });
    }

    async down() {
        await Schema.dropIfExists('failed_jobs');
    }
}

module.exports = CreateFailedJobsTable;
