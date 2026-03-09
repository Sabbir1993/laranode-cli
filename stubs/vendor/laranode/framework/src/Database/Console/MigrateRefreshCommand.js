const Command = use('laranode/Console/Command');
const Migrator = use('laranode/Database/Migrations/Migrator');

class MigrateRefreshCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'migrate:refresh {--seed}';
        this.description = 'Reset and re-run all migrations';
    }

    async handle() {
        const migrator = new Migrator(this.app);

        await migrator.setup();

        this.info('Rolling back all migrations...');
        let rollbackCount = 0;

        // Loop rollback until no migrations are left
        while (true) {
            try {
                const countBefore = await migrator.db.table('migrations').count();
                if (countBefore === 0) break;

                await migrator.rollback();
                rollbackCount++;
            } catch (e) {
                break;
            }
        }

        if (rollbackCount === 0) {
            this.info('Nothing to rollback.');
        }

        this.info('Running migrations...');
        await migrator.run();

        if (this.options && this.options.seed) {
            this.info('Seeding database...');
            const seedCommand = this.app.make('console').find('db:seed');
            if (seedCommand) {
                await seedCommand.handle();
            }
        }

        this.info('Refresh completed!');
    }
}

module.exports = MigrateRefreshCommand;
