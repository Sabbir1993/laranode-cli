const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakePolicyCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:policy {name}';
        this.description = 'Create a new policy class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/policy.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Policies`;
    }
}

module.exports = MakePolicyCommand;
