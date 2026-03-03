const fs = require('fs');
const path = require('path');

class Migrator {
    constructor(app) {
        this.app = app;
        this.db = app.make('db');
    }

    /**
     * Create the migrations repository if it doesn't exist
     */
    async setup() {
        const Schema = require('../Schema/Schema');

        try {
            await Schema.create('migrations', (table) => {
                table.id();
                table.string('migration');
                table.integer('batch');
            });
        } catch (e) {
            // Table already exists — safe to ignore
        }
    }

    /**
     * Get paths to migration files
     */
    getMigrationFiles() {
        const migrationsPath = this.app.make('path.database') + '/migrations';
        if (!fs.existsSync(migrationsPath)) {
            fs.mkdirSync(migrationsPath, { recursive: true });
            return [];
        }

        return fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.js'))
            .sort();
    }

    /**
     * Get array of migrations that have already run
     */
    async getRanMigrations() {
        try {
            const rows = await this.db.table('migrations').select('migration').get();
            return rows.map(r => r.migration);
        } catch (e) {
            return [];
        }
    }

    /**
     * Get the next batch number
     */
    async getNextBatchNumber() {
        try {
            const lastBatch = await this.db.table('migrations').select('batch').orderBy('batch', 'desc').first();
            return lastBatch ? lastBatch.batch + 1 : 1;
        } catch (e) {
            return 1;
        }
    }

    /**
     * Run all pending migrations
     */
    async run() {
        await this.setup();

        const files = this.getMigrationFiles();
        const ran = await this.getRanMigrations();
        const pending = files.filter(f => !ran.includes(f));

        if (pending.length === 0) {
            this.info('Nothing to migrate.');
            return;
        }

        const batch = await this.getNextBatchNumber();

        for (const file of pending) {
            this.info(`Migrating: ${file}`);
            const migrationPath = path.join(this.app.make('path.database'), 'migrations', file);
            const MigrationClass = require(migrationPath);
            const migration = typeof MigrationClass === 'function' ? new MigrationClass() : MigrationClass;

            await migration.up();

            await this.db.table('migrations').insert({
                migration: file,
                batch: batch
            });
            this.info(`Migrated:  ${file}`);
        }
    }

    /**
     * Rollback the last migration operation
     */
    async rollback() {
        await this.setup();

        const lastBatchRow = await this.db.table('migrations').select('batch').orderBy('batch', 'desc').first();
        if (!lastBatchRow) {
            this.info('Nothing to rollback.');
            return;
        }

        const batch = lastBatchRow.batch;
        const migrations = await this.db.table('migrations').where('batch', batch).orderBy('id', 'desc').get();

        for (const record of migrations) {
            this.info(`Rolling back: ${record.migration}`);
            const migrationPath = path.join(this.app.make('path.database'), 'migrations', record.migration);
            const MigrationClass = require(migrationPath);
            const migration = typeof MigrationClass === 'function' ? new MigrationClass() : MigrationClass;

            await migration.down();

            await this.db.table('migrations').where('id', record.id).delete();
            this.info(`Rolled back:  ${record.migration}`);
        }
    }

    /**
     * Drop all tables and re-run all migrations
     */
    async fresh() {
        this.info('Dropping all tables...');

        const driver = this.db.connection().config.driver;
        const dbName = this.db.connection().config.database;

        if (driver === 'sqlite') {
            const tables = await this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            for (const table of tables) {
                await this.db.query(`DROP TABLE IF EXISTS ${table.name}`);
            }
        } else if (driver === 'mysql' || driver === 'pgsql') {
            if (driver === 'mysql') {
                await this.db.query('SET FOREIGN_KEY_CHECKS = 0');
                const tables = await this.db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = ?`, [dbName]);
                for (const table of tables) {
                    await this.db.query(`DROP TABLE IF EXISTS \`${table.table_name || table.TABLE_NAME}\``);
                }
                await this.db.query('SET FOREIGN_KEY_CHECKS = 1');
            } else {
                this.error(`Drop tables not fully implemented for ${driver}`);
            }
        }

        this.info('Dropped all tables successfully.');

        // Clear require cache for migration files so they can be re-required
        const migrationsPath = this.app.make('path.database') + '/migrations';
        if (fs.existsSync(migrationsPath)) {
            const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                const fullPath = path.join(migrationsPath, file);
                delete require.cache[require.resolve(fullPath)];
            }
        }

        await this.run();
    }

    /**
     * Log info message
     */
    info(message) {
        console.log(`\x1b[32m${message}\x1b[0m`);
    }

    /**
     * Log error message
     */
    error(message) {
        console.error(`\x1b[31m${message}\x1b[0m`);
    }
}

module.exports = Migrator;
