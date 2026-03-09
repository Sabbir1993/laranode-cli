const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeFactoryCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:factory {name}';
        this.description = 'Create a new model factory';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/factory.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `Database/Factories`; // Should go to database/factories outside of app/
    }

    buildClass(name) {
        const stub = super.buildClass(name);
        return stub;
    }
}

module.exports = MakeFactoryCommand;
