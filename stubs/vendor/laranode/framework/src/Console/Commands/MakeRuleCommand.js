const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeRuleCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:rule {name}';
        this.description = 'Create a new custom validation rule class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/rule.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Rules`;
    }

    replaceClass(stub, name) {
        let className = name.split('/').pop();
        return stub.replace(/DummyRule/g, className);
    }
}

module.exports = MakeRuleCommand;
