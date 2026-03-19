/**
 * LaraNode Inertia.js Server Adapter
 * Implements the core Inertia protocol for standard SSR/SPA transitions.
 */
class Inertia {
    constructor(app) {
        this.app = app;
        this.sharedProps = {};
        this.version = null;
        this.rootView = 'app';
    }

    /**
     * Share data to all components.
     * @param {string|object} key 
     * @param {*} value 
     */
    share(key, value = null) {
        if (typeof key === 'object') {
            this.sharedProps = { ...this.sharedProps, ...key };
        } else {
            this.sharedProps[key] = value;
        }
    }

    /**
     * Get shared data.
     */
    getShared(key = null) {
        if (key) return this.sharedProps[key];
        return this.sharedProps;
    }

    /**
     * Set the current asset version.
     * @param {string|function} version 
     */
    setVersion(version) {
        this.version = version;
    }

    /**
     * Get the current asset version.
     */
    getVersion() {
        return typeof this.version === 'function' ? this.version() : this.version;
    }

    /**
     * Set the root view (Edge template)
     */
    setRootView(view) {
        this.rootView = view;
    }

    /**
     * Set a custom view data to pass alongside the page object.
     */
    withViewData(req, key, value) {
        req.inertiaViewData = req.inertiaViewData || {};
        req.inertiaViewData[key] = value;
        return this;
    }

    /**
     * Create an Inertia Response.
     * @param {object} req Express request
     * @param {object} res Express response
     * @param {string} component Vue/React component name
     * @param {object} props Props for the component
     */
    async render(req, res, component, props = {}) {
        // Evaluate deferred/lazy props
        const evaluatedProps = await this._evaluateProps(req, { ...this.sharedProps, ...props });
        
        // Filter partial reloads
        let finalProps = evaluatedProps;
        const only = req.header('X-Inertia-Partial-Data');
        const partialComponent = req.header('X-Inertia-Partial-Component');

        if (only && partialComponent === component) {
            const onlyKeys = only.split(',').map(k => k.trim());
            finalProps = {};
            for (const key of onlyKeys) {
                if (evaluatedProps.hasOwnProperty(key)) {
                    finalProps[key] = evaluatedProps[key];
                }
            }
        }

        const page = {
            component: component,
            props: finalProps,
            url: req.originalUrl || req.url,
            version: this.getVersion()
        };

        // Determine if this is an Inertia request (XHR)
        if (req.header('X-Inertia')) {
            return res.status(200).json(page);
        }

        // Standard request: Return Edge view with HTML Shell
        const viewData = req.inertiaViewData || {};
        const View = this.app.make('view');
        
        // Render the page object into the dataset
        const jsonPage = JSON.stringify(page).replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        viewData.page = page;
        viewData.jsonPage = jsonPage;

            // Standard full page request, need to render the HTML shell
            try {
                const html = global.view(this.rootView, { jsonPage });
                return res.status(200).send(html);
            } catch (err) {
                throw err;
            }
    }

    /**
     * Execute an external redirect (forces Inertia frontend full refresh).
     */
    location(res, url) {
        return res.status(409).header('X-Inertia-Location', url).end();
    }

    /**
     * Recursively evaluate promises or callable props.
     */
    async _evaluateProps(req, props) {
        for (const key in props) {
            if (typeof props[key] === 'function') {
                props[key] = await props[key](req);
            } else Object.prototype.toString.call(props[key]) === '[object Promise]' ? props[key] = await props[key] : null;
        }
        return props;
    }
}

module.exports = Inertia;
