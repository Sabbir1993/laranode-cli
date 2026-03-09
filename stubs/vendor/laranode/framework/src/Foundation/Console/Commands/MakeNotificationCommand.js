const GeneratorCommand = use('laranode/Console/GeneratorCommand');

class MakeNotificationCommand extends GeneratorCommand {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'make:notification {name}';
        this.description = 'Create a new notification class';
    }

    getStub() {
        return base_path('vendor/laranode/framework/src/Console/stubs/notification.stub');
    }

    getDefaultNamespace(rootNamespace) {
        return `${rootNamespace}/Notifications`;
    }
}

module.exports = MakeNotificationCommand;
