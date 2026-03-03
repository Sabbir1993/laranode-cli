const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeRequestCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:request {name}';
        this.description = 'Create a new form request class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/request.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Http/Requests`;
    }
}

module.exports = MakeRequestCommand;
