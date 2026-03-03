const GeneratorCommand = use('laranode/Console/GeneratorCommand');
const Str = use('laranode/Support/Str');

class MakeModelCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:model {name} {--migration} {--seeder} {--factory}';
        this.description = 'Create a new Loquent model class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/model.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Models`;
    }

    async handle(args, options) {
        await super.handle(args, options);

        const name = args[0];
        const execSync = require('child_process').execSync;

        if (this.options && this.options.migration) {
            const table = Str.plural(Str.snake(name));
            this.info(`Creating migration for ${table}...`);
            execSync(`node artisan make:migration create_${table}_table`, { stdio: 'inherit' });
        }

        if (this.options && this.options.seeder) {
            this.info(`Creating seeder for ${name}...`);
            execSync(`node artisan make:seeder ${name}Seeder`, { stdio: 'inherit' });
        }

        if (this.options && this.options.factory) {
            this.info(`Creating factory for ${name}...`);
            // execSync(`node artisan make:factory ${name}Factory`, { stdio: 'inherit' }); // If make:factory exists
        }
    }
}

module.exports = MakeModelCommand;
