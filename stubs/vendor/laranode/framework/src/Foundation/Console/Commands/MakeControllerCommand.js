const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeControllerCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:controller {name} {--resource}';
        this.description = 'Create a new controller class';
    }

    getStub() {
        if (this.options && this.options.resource) {
            return base_path('vendor/laranode/framework/src/Console/stubs/controller.resource.stub');
        }
        return base_path('vendor/laranode/framework/src/Console/stubs/controller.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Http/Controllers`;
    }

    buildClass(name) {
        const stub = super.buildClass(name);
        // Replace base controller namespace if not in same folder
        return stub;
    }
}

module.exports = MakeControllerCommand;
