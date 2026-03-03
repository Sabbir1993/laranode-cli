const Command = use('laranode/Console/Command');
const Migrator = use('laranode/Database/Migrations/Migrator');

class MigrateRollbackCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'migrate:rollback';
        this.description = 'Rollback the last database migration';
    }

    async handle(args, options) {
        this.info('Rolling back last database migration batch...');

        const migrator = new Migrator(this.app);

        try {
            await migrator.rollback();
            this.info('Rollback completed successfully.');
        } catch (e) {
            this.error('Rollback failed.');
            console.error(e);
        } finally {
            await this.app.make('db').disconnect();
            process.exit(0);
        }
    }
}

module.exports = MigrateRollbackCommand;
