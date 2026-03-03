const FormRequest = use('laranode/Foundation/Http/FormRequest');

class RegisterRequest extends FormRequest {
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
            name: 'required|string|max:255',
            email: 'required|email|max:255|unique:users,email',
            password: 'required|string|min:8|confirmed',
        };
    }

    /**
     * Custom error messages for validation failures.
     * @return {Object}
     */
    messages() {
        return {
            'name.required': 'Name is required',
            'name.max': 'Name cannot exceed 255 characters',
            'email.required': 'Email is required',
            'email.email': 'Please provide a valid email address',
            'email.max': 'Email cannot exceed 255 characters',
            'email.unique': 'This email is already registered',
            'password.required': 'Password is required',
            'password.min': 'Password must be at least 8 characters',
            'password.confirmed': 'Password confirmation does not match',
        };
    }
}

module.exports = RegisterRequest;
