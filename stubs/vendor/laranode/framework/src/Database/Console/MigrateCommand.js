const Command = use('laranode/Console/Command');
const Migrator = use('laranode/Database/Migrations/Migrator');

class MigrateCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'migrate';
        this.description = 'Run the database migrations';
    }

    async handle(args, options) {
        this.info('Running database migrations...');

        const migrator = new Migrator(this.app);

        try {
            await migrator.run();
            this.info('Migrations completed successfully.');
        } catch (e) {
            this.error('Migration failed.');
            console.error(e);
        } finally {
            await this.app.make('db').disconnect();
            process.exit(0);
        }
    }
}

module.exports = MigrateCommand;
