class ValidationException extends Error {
    /**
     * Create a new ValidationException.
     * @param {Validator} validator 
     */
    constructor(validator) {
        super('The given data was invalid.');
        this.name = 'ValidationException';
        this.validator = validator;
        this.status = 422;

        // Store errors as property (for synchronous access)
        if (validator._errors) {
            this.errors = validator._errors.all();
        } else {
            this.errors = {};
        }
    }

    /**
     * Get errors (method for compatibility)
     * @returns {Object}
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Get the underlying validator instance.
     * @returns {Validator}
     */
    getValidator() {
        return this.validator;
    }
}

module.exports = ValidationException;
