const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeMailCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:mail {name}';
        this.description = 'Create a new email class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/mail.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Mail`;
    }
}

module.exports = MakeMailCommand;
