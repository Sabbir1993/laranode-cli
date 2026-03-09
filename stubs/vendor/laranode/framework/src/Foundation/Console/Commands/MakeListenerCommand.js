const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeListenerCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:listener {name}';
        this.description = 'Create a new event listener class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/listener.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Listeners`;
    }
}

module.exports = MakeListenerCommand;
