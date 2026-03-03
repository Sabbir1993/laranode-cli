const Request = use('laranode/Http/Request');

class FormRequest extends Request {
    constructor(req) {
        super(req);
        this._validator = null;
        this._validatedData = null;
    }

    /**
     * Determine if the user is authorized to make this request.
     * @returns {boolean}
     */
    authorize() {
        return true; // Default to true, subclasses should override
    }

    /**
     * Get the validation rules that apply to the request.
     * @returns {Object}
     */
    rules() {
        return {};
    }

    /**
     * Custom error messages for validation Failures.
     * @returns {Object}
     */
    messages() {
        return {};
    }

    /**
     * Set the validator instance.
     * @param {Object} validator 
     */
    setValidator(validator) {
        this._validator = validator;
    }

    /**
     * Get the validator instance.
     * @returns {Object}
     */
    /**
     * Validate the class instance.
     * @returns {Promise<Object>}
     */
    async validateResolved() {
        if (!this.authorize()) {
            const error = new Error('This action is unauthorized.');
            error.status = 403;
            throw error;
        }

        return await this.validate(this.rules(), this.messages());
    }

    /**
     * Get the validated data.
     * @returns {Promise<Object>}
     */
    async validated() {
        if (!this._validatedData) {
            this._validatedData = await this.validateResolved();
        }
        return this._validatedData;
    }
}

module.exports = FormRequest;
