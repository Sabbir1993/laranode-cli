const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeCommandCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:command {name}';
        this.description = 'Create a new Artisan command';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/command.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Console/Commands`;
    }
}

module.exports = MakeCommandCommand;
