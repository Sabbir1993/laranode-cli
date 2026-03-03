const fs = require('fs');
const path = require('path');
const Command = use('laranode/Console/Command');
const Str = use('laranode/Support/Str');

class MakeMigrationCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:migration {name}';
        this.description = 'Create a new migration file';
    }

    async handle(args, options) {
        const name = args[0]; // e.g. create_users_table
        if (!name) {
            this.error('Migration name is required.');
            return false;
        }

        const date = new Date();
        const timestamp = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
            String(date.getHours()).padStart(2, '0'),
            String(date.getMinutes()).padStart(2, '0'),
            String(date.getSeconds()).padStart(2, '0')
        ].join('_');

        const fileName = `${timestamp}_${Str.snake(name)}.js`;
        const dir = base_path('database/migrations');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filePath = path.join(dir, fileName);

        let stub = fs.readFileSync(base_path('vendor/laranode/framework/src/Console/stubs/migration.stub'), 'utf8');

        // Very basic table name parsing
        let table = 'table_name';
        if (name.startsWith('create_') && name.endsWith('_table')) {
            table = name.substring(7, name.length - 6);
        }

        stub = stub.replace(/\{\{\s*table\s*\}\}/g, table);

        fs.writeFileSync(filePath, stub);

        this.info(`Migration [${fileName}] created successfully.`);
    }
}

module.exports = MakeMigrationCommand;
