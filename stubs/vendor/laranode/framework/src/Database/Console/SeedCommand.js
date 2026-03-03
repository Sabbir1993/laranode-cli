const Command = use('laranode/Console/Command');
const path = require('path');
const fs = require('fs');

class SeedCommand extends Command {
    constructor() {
        super();
        this.signature = 'db:seed {--class=DatabaseSeeder : The class name of the root seeder}';
        this.description = 'Seed the database with records';
    }

    async handle(args, options) {
        const className = options.class || 'DatabaseSeeder';
        const seederPath = base_path(`database/seeders/${className}.js`);

        if (!fs.existsSync(seederPath)) {
            this.error(`Seeder class [${className}] does not exist.`);
            return;
        }

        this.info(`Seeding database using ${className}...`);

        try {
            const SeederClass = require(seederPath);
            const seeder = new SeederClass();

            // Execute the seeder explicitly providing its context if needed
            if (typeof seeder.run === 'function') {
                if (seeder.run.constructor.name === "AsyncFunction") {
                    await seeder.run();
                } else {
                    seeder.run();
                }
            } else {
                this.error(`The [run] method is missing on ${className}.`);
                return;
            }

            this.info('Database seeding completed successfully.');
        } catch (error) {
            this.error('Seeding failed:');
            console.error(error);
        }
    }
}

module.exports = SeedCommand;
