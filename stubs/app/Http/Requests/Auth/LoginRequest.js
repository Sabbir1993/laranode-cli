const FormRequest = use('laranode/Foundation/Http/FormRequest');

class LoginRequest extends FormRequest {
    /**
     * Determine if the user is authorized to make this request.
     * @return {boolean}
     */
    authorize() {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * @return {Object}
     */
    rules() {
        return {
            email: 'required|email',
            password: 'required|string',
        };
    }

    /**
     * Custom error messages for validation failures.
     * @return {Object}
     */
    messages() {
        return {
            'email.required': 'Email is required',
            'email.email': 'Please provide a valid email address',
            'password.required': 'Password is required',
        };
    }
}

module.exports = LoginRequest;
