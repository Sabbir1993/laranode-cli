const ServiceProvider = use('laranode/Support/ServiceProvider');
const Logger = use('laranode/Log/Logger');
const Route = use('laranode/Support/Facades/Route');
const LogViewerController = require('./LogViewerController');

class LogServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     *
     * @return void
     */
    register() {
        this.app.singleton('log', function (app) {
            return new Logger(app);
        });
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    boot() {
        const config = this.app.make('config');
        if (config.get('logging.allow_log_viewer', false)) {
            const endpoint = config.get('logging.log_viewer.endpoint', '/logs');
            const middleware = config.get('logging.log_viewer.middleware', []);

            const groupOptions = {};
            if (middleware && middleware.length > 0) {
                groupOptions.middleware = middleware;
            }

            Route.group(groupOptions, () => {
                const controller = new LogViewerController();
                Route.get(endpoint, (req, res) => controller.index(req, res));
                Route.get(`${endpoint}/api`, (req, res) => controller.api(req, res));
            });
        }
    }
}

module.exports = LogServiceProvider;
