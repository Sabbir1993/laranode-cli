const EdgeCompiler = require('./Compilers/EdgeCompiler');
const path = require('path');
const fs = require('fs');

class Factory {
    constructor(app) {
        this.app = app;
        // Default to resources/views
        this.viewPath = base_path('resources/views');
        this.compiler = new EdgeCompiler(base_path('storage/framework/views'));
        this.composers = {};
    }

    /**
     * Register a view composer event.
     * @param {string|Array} views
     * @param {Function} callback
     */
    composer(views, callback) {
        if (!Array.isArray(views)) {
            views = [views];
        }

        for (const view of views) {
            if (!this.composers[view]) {
                this.composers[view] = [];
            }
            this.composers[view].push(callback);
        }
    }

    /**
     * Render a view with the given data.
     * @param {string} view e.g., 'welcome' or 'admin.dashboard'
     * @param {Object} data 
     * @returns {string} HTML string
     */
    make(view, data = {}) {
        let absolutePath = '';
        if (path.isAbsolute(view)) {
            absolutePath = view;
            // If absolute path doesn't have an extension, assume .edge
            if (!path.extname(absolutePath)) {
                absolutePath += '.edge';
            }
        } else {
            // Replace dot notation with slash 'admin.dashboard' -> 'admin/dashboard'
            const relativePath = view.replace(/\./g, '/');
            absolutePath = path.join(this.viewPath, `${relativePath}.edge`);
        }

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`View [${view}] not found at ${absolutePath}`);
        }

        const compiledPath = this.compiler.compile(absolutePath);

        // In Node since we're writing CommonJS we have to bust require cache in local dev
        if (config('app.env') === 'local') {
            delete require.cache[require.resolve(compiledPath)];
        }

        const templateFunction = require(compiledPath);

        const viewData = { ...data };

        // Execute composers specific to this view
        if (this.composers[view]) {
            for (const composer of this.composers[view]) {
                composer(viewData); // The callback mutates viewData by ref
            }
        }

        // Execute wildcard composers applied to all views
        if (this.composers['*']) {
            for (const composer of this.composers['*']) {
                composer(viewData);
            }
        }

        return templateFunction(viewData);
    }
}

module.exports = Factory;
