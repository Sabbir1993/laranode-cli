const BaseHandler = use('laranode/Foundation/Exceptions/Handler');

class Handler extends BaseHandler {

    /**
     * A list of exception types with custom responses.
     * Override this to add your own custom exception handling.
     * 
     * Example:
     *   this.dontReport = ['AuthenticationException', 'ValidationException'];
     */
    constructor(app) {
        super(app);

        /**
         * A list of exception types that are not reported (logged).
         * Add error names or message patterns here to suppress logging.
         */
        this.dontReport = [
            // 'ValidationException',
        ];
    }

    /**
     * Register custom exception handling callbacks.
     * This is called automatically and gives you a place to register
     * renderable and reportable callbacks.
     * 
     * Example:
     *   register() {
     *       this.renderable((error, req, res) => {
     *           if (error.name === 'CustomException') {
     *               return res.status(400).json({ message: 'Custom error' });
     *           }
     *       });
     * 
     *       this.reportable((error) => {
     *           // Send to external service like Sentry
     *           // Sentry.captureException(error);
     *       });
     *   }
     */
    register() {
        //
    }

    /**
     * Report or log an exception.
     * Override this method to customize error reporting.
     * 
     * @param {Error} error
     */
    report(error) {
        // Check if this error type should not be reported
        if (this.shouldntReport(error)) {
            return;
        }

        // Call registered reportable callbacks
        if (this._reportCallbacks) {
            for (const callback of this._reportCallbacks) {
                const result = callback(error);
                if (result === false) return; // Stop reporting
            }
        }

        super.report(error);
    }

    /**
     * Render an exception into an HTTP response.
     * Override this method to customize error rendering.
     * 
     * @param {Error} error
     * @param {Object} req
     * @param {Object} res
     */
    render(error, req, res) {
        // Call registered renderable callbacks
        if (this._renderCallbacks) {
            for (const callback of this._renderCallbacks) {
                const result = callback(error, req, res);
                if (result !== undefined) return result; // Custom response was sent
            }
        }

        // Fall back to the base handler's render
        return super.render(error, req, res);
    }

    /**
     * Determine if the exception should not be reported.
     */
    shouldntReport(error) {
        const code = this.getStatusCode(error);
        // Don't report client errors by default
        if (code >= 400 && code < 500) return true;

        return this.dontReport.some(type => {
            return error.name === type || (error.message && error.message.includes(type));
        });
    }

    /**
     * Register a renderable callback.
     * The callback receives (error, req, res).
     * Return a response to handle the error, or undefined to pass through.
     * 
     * @param {Function} callback
     */
    renderable(callback) {
        if (!this._renderCallbacks) this._renderCallbacks = [];
        this._renderCallbacks.push(callback);
    }

    /**
     * Register a reportable callback.
     * The callback receives (error).
     * Return false to stop further reporting.
     * 
     * @param {Function} callback
     */
    reportable(callback) {
        if (!this._reportCallbacks) this._reportCallbacks = [];
        this._reportCallbacks.push(callback);
    }
}

module.exports = Handler;
