#!/usr/bin/env node

/**
 * LaraNode - A Node.js Framework For Web Artisans
 */

const app = require('./bootstrap/app');

app.boot().then(() => {
    // Run the Console Kernel
    const Kernel = use('laranode/Foundation/Console/Kernel');
    const kernel = new Kernel(app);
    return kernel.handle();
}).catch(err => {
    if (err && err.name === 'CommanderError') {
        process.exit(err.exitCode);
    }
    console.error('Failed to boot Artisan:', err);
    process.exit(1);
});
