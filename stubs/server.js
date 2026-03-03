/**
 * LaraNode - A Laravel-Inspired Node.js Framework
 */

// 1. Load the Application
const app = require('./bootstrap/app');

// 2. Boot Service Providers and Handle the Request
app.boot().then(async () => {
    const kernel = app.make('laranode/Foundation/Http/Kernel');
    const expressApp = await kernel.handle();
    const config = app.make('config');

    const port = config.get('app.port', 8000);
    expressApp.listen(port, () => {
        console.log(`\nLaraNode development server started: http://localhost:${port}`);
        console.log(`Environment: ${env('APP_ENV', 'local')}`);
    });
}).catch(err => {
    console.error('Failed to boot LaraNode:', err);
});
