const Command = use('laranode/Console/Command');
const Migrator = use('laranode/Database/Migrations/Migrator');

class MigrateStatusCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'migrate:status';
        this.description = 'Show the status of each migration';
    }

    async handle() {
        const migrator = new Migrator(this.app);

        await migrator.setup();

        const ran = await migrator.getRanMigrations();
        const files = migrator.getMigrationFiles();

        if (files.length === 0) {
            this.info('No migrations found');
            return;
        }

        const statusTable = files.map(file => {
            const isRan = ran.includes(file);
            return {
                Status: isRan ? '\x1b[32m[Ran]\x1b[0m' : '\x1b[33m[Pending]\x1b[0m',
                Migration: file
            };
        });

        console.table(statusTable);
    }
}

module.exports = MigrateStatusCommand;
