const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeMiddlewareCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:middleware {name}';
        this.description = 'Create a new middleware class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/middleware.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Http/Middleware`;
    }
}

module.exports = MakeMiddlewareCommand;
