const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeResourceCommand extends GeneratorCommand {
    constructor(app, options = null) {
        super(app);
        this.app = app;
        // Commander gives us an explicitly parsed options object now
        this.commandOptions = options || {};
        this.signature = 'make:resource {name} {--collection}';
        this.description = 'Create a new API resource class';
    }

    getStub() {
        if (this.commandOptions && this.commandOptions.collection) {
            return base_path('vendor/laranode/framework/src/Console/stubs/resource-collection.stub');
        }
        return base_path('vendor/laranode/framework/src/Console/stubs/resource.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Http/Resources`;
    }
}

module.exports = MakeResourceCommand;
