const { program } = require('commander');
const fs = require('fs');
const path = require('path');

class Kernel {
    constructor(app) {
        this.app = app;
        this.commands = [];
    }

    /**
     * Register the commands for the application
     */
    registerCommands() {
        // Built-in framework commands
        const builtInCommands = [
            require('./Commands/ServeCommand'),
            require('./Commands/KeyGenerateCommand'),
            require('./Commands/RouteListCommand'),
            require('./Commands/MakeControllerCommand'),
            require('./Commands/MakePolicyCommand'),
            require('./Commands/MakeFactoryCommand'),
            require('./Commands/MakeMiddlewareCommand'),
            require('./Commands/MakeMigrationCommand'),
            require('./Commands/MakeModelCommand'),
            require('./Commands/MakeSeederCommand'),
            require('./Commands/MakeRequestCommand'),
            require('./Commands/MakeResourceCommand'),
            require('./Commands/MakeCommandCommand'),
            require('./Commands/MakeEventCommand'),
            require('./Commands/MakeListenerCommand'),
            require('./Commands/MakeMailCommand'),
            require('./Commands/MakeNotificationCommand'),
            require('../../Console/Commands/MakeRuleCommand'),
            require('../../Database/Console/MigrateCommand'),
            require('../../Database/Console/MigrateRefreshCommand'),
            require('../../Database/Console/MigrateStatusCommand'),
            require('../../Database/Console/MigrateFreshCommand'),
            require('../../Database/Console/MigrateRollbackCommand'),
            require('./Commands/MakeTestCommand'),
            require('./Commands/TestCommand'),
            require('./Commands/ConfigCacheCommand'),
            require('./Commands/ConfigClearCommand'),
            require('./Commands/RouteCacheCommand'),
            require('./Commands/RouteClearCommand'),
            require('../../Database/Console/SeedCommand'),
            require('../../Console/Commands/ScheduleRunCommand'),
            require('../../Queue/Console/QueueWorkCommand'),
            require('./Commands/StorageLinkCommand'),
            require('./Commands/TinkerCommand'),
        ];

        for (const commandClass of builtInCommands) {
            const command = new commandClass(this.app);
            command.setProgram(program);
            command.register();
            this.commands.push(command);
        }

        // Auto-load application commands
        if (this.app && this.app.basePath) {
            const commandsPath = path.join(this.app.basePath, 'app', 'Console', 'Commands');
            if (fs.existsSync(commandsPath)) {
                const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                for (const file of files) {
                    try {
                        const commandClass = require(path.join(commandsPath, file));
                        if (typeof commandClass === 'function' && commandClass.prototype && commandClass.prototype.register) {
                            const command = new commandClass(this.app);
                            command.setProgram(program);
                            command.register();
                            this.commands.push(command);
                        }
                    } catch (e) {
                        // silently ignore files that are not valid commands or can't be registered
                    }
                }
            }
        }
    }

    /**
     * Run the console application
     */
    handle() {
        program
            .name('artisan')
            .description('LaraNode CLI for Web Artisans')
            .version(this.app.version || '1.0.0')
            .exitOverride();

        this.registerCommands();

        return program.parseAsync(process.argv);
    }
}

module.exports = Kernel;
