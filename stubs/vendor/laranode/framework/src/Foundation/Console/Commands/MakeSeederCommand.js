const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeSeederCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:seeder {name}';
        this.description = 'Create a new seeder class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/seeder.stub');
    }

    getPath(name) {
        return base_path(`database/seeders/${name}.js`);
    }
}

module.exports = MakeSeederCommand;
