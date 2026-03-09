const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeEventCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:event {name}';
        this.description = 'Create a new event class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/event.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Events`;
    }
}

module.exports = MakeEventCommand;
