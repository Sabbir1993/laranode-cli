const fs = require('fs');
const path = require('path');
const Response = require('../../Http/Response');

class Handler {
    constructor(app) {
        this.app = app;

        // Default messages for each error code
        this.defaultMessages = {
            401: 'You need to be authenticated to access this resource. Please sign in and try again.',
            403: 'You don\'t have permission to access this resource. Contact an administrator if you believe this is an error.',
            404: 'The page you\'re looking for doesn\'t exist or has been moved.',
            419: 'Your session has expired. Please refresh the page and try again.',
            500: 'Something went wrong on our end. Our team has been notified and we\'re working to fix it.'
        };
    }

    /**
     * Report or log an exception.
     */
    report(error) {
        const code = this.getStatusCode(error);
        // Don't log client errors (4xx)
        if (code >= 400 && code < 500) return;

        try {
            const Log = use('laranode/Support/Facades/Log');
            Log.error(error.message, { stack: error.stack });
        } catch (e) {
            console.error(error);
        }
    }

    /**
     * Render an exception into an HTTP response.
     */
    render(error, req, res) {
        const isJson = req.headers.accept && req.headers.accept.includes('application/json');
        const statusCode = error.status || this.getStatusCode(error);

        // Validation errors
        if (error.name === 'ValidationException') {
            return res.status(error.status || 422).json({
                message: error.message,
                errors: error.errors
            });
        }

        // Check for custom error page (401, 403, 404, 419, 500)
        if ([401, 403, 404, 419, 500].includes(statusCode)) {
            return this.renderErrorPage(statusCode, error, req, res, isJson);
        }

        // JSON / API response
        if (isJson || req.path.startsWith('/api')) {
            return res.status(statusCode).json({
                message: error.message || 'Server Error',
                stack: config('app.debug', false) ? error.stack : undefined
            });
        }

        // Debug mode: pretty HTML stack trace
        if (config('app.debug', false)) {
            return res.status(statusCode).send(this.buildPrettyHtml(error));
        }

        // Production fallback
        return res.status(statusCode).send(`<h1>${statusCode} - Error</h1><p>Something went wrong.</p>`);
    }

    /**
     * Render a styled error page for known status codes.
     */
    renderErrorPage(statusCode, error, req, res, isJson) {
        // JSON / API response
        if (isJson || req.path.startsWith('/api')) {
            return res.status(statusCode).json({
                message: error.message || this.defaultMessages[statusCode] || 'Error',
                error: this.getErrorTitle(statusCode)
            });
        }

        // If debug mode and it's a 500, show the stack trace instead
        if (statusCode === 500 && config('app.debug', false)) {
            return res.status(500).send(this.buildPrettyHtml(error));
        }

        // Build a user-friendly message
        let message = this.defaultMessages[statusCode] || 'An unexpected error occurred.';

        // For 404 with ModelNotFoundException, customize the message
        if (statusCode === 404 && error.message && error.message.includes('ModelNotFoundException')) {
            const match = error.message.match(/\[(\w+)\]/);
            const modelName = match ? match[1] : 'Record';
            message = `The ${modelName.toLowerCase()} you're looking for could not be found.`;
        }

        // Try to load the error template
        // 1. Check app's custom error views first (allows user overrides)
        // We check for .edge first as it's the default, then .html
        const appEdgePath = path.join(process.cwd(), 'resources', 'views', 'errors', `${statusCode}.edge`);
        const appHtmlPath = path.join(process.cwd(), 'resources', 'views', 'errors', `${statusCode}.html`);

        // 2. Fallback to vendor's built-in error views
        const vendorViewPath = path.join(__dirname, '..', 'resources', 'views', 'errors', `${statusCode}.edge`);

        const response = res instanceof Response ? res : new Response(res);

        try {
            if (fs.existsSync(appEdgePath)) {
                return response.status(statusCode).view(`errors.${statusCode}`, { message });
            }

            if (fs.existsSync(appHtmlPath)) {
                const escMsg = (s) => String(s || '')
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
                let html = fs.readFileSync(appHtmlPath, 'utf-8');
                html = html.replace('{{message}}', escMsg(message));
                return response.status(statusCode).send(html);
            }

            if (fs.existsSync(vendorViewPath)) {
                return response.status(statusCode).view(vendorViewPath, { message });
            }
        } catch (e) {
            console.error('Error rendering error page:', e);
        }

        // statusCode is a number and getErrorTitle returns from a hardcoded map — both are safe
        return res.status(statusCode).send(
            `<h1>${statusCode} - ${this.getErrorTitle(statusCode)}</h1><p>An unexpected error occurred.</p>`
        );
    }

    /**
     * Get a human-readable title for the status code.
     */
    getErrorTitle(code) {
        const titles = {
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            419: 'Page Expired',
            500: 'Server Error'
        };
        return titles[code] || 'Error';
    }

    /**
     * Determine the HTTP status code for an error.
     */
    getStatusCode(error) {
        if (error.status) return error.status;
        if (error.message) {
            if (error.message.includes('ModelNotFoundException')) return 404;
            if (error.message.includes('AuthenticationException')) return 401;
            if (error.message.includes('AuthorizationException')) return 403;
            if (error.message.includes('TokenMismatchException')) return 419;
            if (error.message.includes('Not Found')) return 404;
            if (error.message.includes('Unauthorized')) return 401;
            if (error.message.includes('Forbidden')) return 403;
        }
        return 500;
    }

    /**
     * Check if an error is a specific HTTP exception.
     */
    isHttpException(error, code) {
        return this.getStatusCode(error) === code;
    }

    buildPrettyHtml(error) {
        const esc = (s) => String(s || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

        const stackFrames = (error.stack || '').split('\n').map(line => line.trim()).filter(line => line.startsWith('at '));

        let framesHtml = stackFrames.map((frame, i) => {
            return `<div class="frame ${i === 0 ? 'active' : ''}">
                <div class="frame-method">${esc(frame.replace(/^at\s+/, ''))}</div>
            </div>`;
        }).join('');

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error: ${error.message}</title>
            <style>
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fdfdfd; color: #333; }
                .header { background: #f44336; color: white; padding: 40px 30px; }
                .header h1 { margin: 0; font-size: 24px; font-weight: normal; }
                .header h2 { margin: 10px 0 0 0; font-size: 32px; font-weight: bold; overflow-wrap: break-word; }
                .content { display: flex; height: calc(100vh - 120px); }
                .sidebar { width: 350px; background: #fff; border-right: 1px solid #eee; overflow-y: auto; }
                .frame { padding: 15px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px; color: #555; word-break: break-all; }
                .frame.active { background: #f9f9f9; border-left: 4px solid #f44336; }
                .main { flex: 1; padding: 30px; overflow-y: auto; background: #fff; }
                .code-block { background: #282c34; color: #abb2bf; padding: 20px; border-radius: 6px; font-family: monospace; overflow-x: auto; white-space: pre; line-height: 1.5; font-size: 14px;}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${esc(error.name || 'Error')}</h1>
                <h2>${esc(error.message)}</h2>
            </div>
            <div class="content">
                <div class="sidebar">
                    ${framesHtml}
                </div>
                <div class="main">
                    <h3>Stack Trace</h3>
                    <div class="code-block">${esc(error.stack)}</div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = Handler;
