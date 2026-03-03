const EdgeCompiler = require('./Compilers/EdgeCompiler');
const path = require('path');
const fs = require('fs');

class Factory {
    constructor(app) {
        this.app = app;
        // Default to resources/views
        this.viewPath = base_path('resources/views');
        this.compiler = new EdgeCompiler(base_path('storage/framework/views'));
    }

    /**
     * Render a view with the given data.
     * @param {string} view e.g., 'welcome' or 'admin.dashboard'
     * @param {Object} data 
     * @returns {string} HTML string
     */
    make(view, data = {}) {
        // Replace dot notation with slash 'admin.dashboard' -> 'admin/dashboard'
        const relativePath = view.replace(/\./g, '/');
        const absolutePath = path.join(this.viewPath, `${relativePath}.edge`);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`View [${view}] not found at ${absolutePath}`);
        }

        const compiledPath = this.compiler.compile(absolutePath);

        // In Node since we're writing CommonJS we have to bust require cache in local dev
        if (config('app.env') === 'local') {
            delete require.cache[require.resolve(compiledPath)];
        }

        const templateFunction = require(compiledPath);

        // Merge global shared data if we decide to add `View.share()` later
        const viewData = { ...data };

        return templateFunction(viewData);
    }
}

module.exports = Factory;
