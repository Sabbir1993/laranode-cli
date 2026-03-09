const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeTestCommand extends GeneratorCommand {
    constructor(app) {
        super(app);
        this.signature = 'make:test {name} {--unit?}';
        this.description = 'Create a new test class';
        this.type = 'Test';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/test.stub');
    }

    getDefaultNamespace(rootNamespace) {
        if (this.options && this.options.unit) {
            return 'Unit';
        }
        return 'Feature';
    }

    getPath(name) {
        const nameParts = name.split('/');
        const className = nameParts.pop();
        const baseFolder = this.options && this.options.unit ? 'Unit' : 'Feature';

        // tests/Feature/ExampleTest.test.js
        return base_path(`tests/${baseFolder}/${className}.test.js`);
    }
}

module.exports = MakeTestCommand;
