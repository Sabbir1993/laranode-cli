const Command = use('laranode/Console/Command');
const Migrator = use('laranode/Database/Migrations/Migrator');

class MigrateFreshCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'migrate:fresh {--seed}';
        this.description = 'Drop all tables and re-run all migrations';
    }

    async handle(args, options) {
        this.options = options || {};
        this.info('Dropping all tables...');

        const migrator = new Migrator(this.app);

        try {
            await migrator.fresh();
            this.info('Database refreshed successfully.');

            if (this.options && this.options.seed) {
                this.info('Seeding database...');
                const execSync = require('child_process').execSync;
                execSync(`node artisan db:seed`, { stdio: 'inherit' });
            }
        } catch (e) {
            this.error('Refresh failed.');
            console.error(e);
        } finally {
            await this.app.make('db').disconnect();
            process.exit(0);
        }
    }
}

module.exports = MigrateFreshCommand;
