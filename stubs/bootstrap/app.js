/*
|--------------------------------------------------------------------------
| Create The Application
|--------------------------------------------------------------------------
|
| The first thing we will do is create a new LaraNode application instance
| which serves as the "glue" for all the components of LaraNode, and is
| the IoC container for the system binding all of the various parts.
|
*/

const Application = require('../vendor/laranode/framework/src/Foundation/Application');
const Env = require('../vendor/laranode/framework/src/Support/Env');
const path = require('path');

// Load environment and helpers
require('../vendor/laranode/framework/src/Support/helpers');
const basePath = path.dirname(__dirname);
setBasePath(basePath);
Env.load(basePath);

const app = new Application(basePath);

/*
|--------------------------------------------------------------------------
| Initialize Facades
|--------------------------------------------------------------------------
*/

const Facade = require('../vendor/laranode/framework/src/Support/Facades/Facade');
Facade.setFacadeApplication(app);

/*
|--------------------------------------------------------------------------
| Load Configuration
|--------------------------------------------------------------------------
*/

const ConfigRepository = require('../vendor/laranode/framework/src/Config/Repository');
const config = new ConfigRepository();
config.loadConfigurationFiles(path.join(basePath, 'config'));
app.instance('config', config);

// Set application timezone
process.env.TZ = config.get('app.timezone', 'UTC');

/*
|--------------------------------------------------------------------------
| Register Service Providers
|--------------------------------------------------------------------------
*/

const providers = config.get('app.providers') || [];
for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    if (!provider) {
        console.error(`CRITICAL: A null or undefined provider was found in config/app.js at index ${i}`);
        continue;
    }
    app.register(provider);
}

/*
|--------------------------------------------------------------------------
| Bind Important Interfaces
|--------------------------------------------------------------------------
|
| Next, we need to bind some important interfaces into the container so
| we will be able to resolve them when needed. The kernels serve the
| incoming requests to this application from both the web and CLI.
|
*/

app.singleton(
    'laranode/Foundation/Http/Kernel',
    function (app) {
        const HttpKernel = require('../app/Http/Kernel');
        return new HttpKernel(app, app.make('router'));
    }
);

// Console Kernel could be bound here if it existed
// app.singleton(
//     'laranode/Foundation/Console/Kernel',
//     require('../app/Console/Kernel')
// );

/*
|--------------------------------------------------------------------------
| Return The Application
|--------------------------------------------------------------------------
|
| This script returns the application instance. The instance is given to
| the calling script so we can separate the building of the instances
| from the actual running of the application and sending responses.
|
*/

module.exports = app;
