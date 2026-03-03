const FormRequest = use('laranode/Foundation/Http/FormRequest');

class StoreTodoRequest extends FormRequest {
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
            title: 'required|string|max:255',
            description: 'nullable|string',
        };
    }

    /**
     * Custom error messages for validation failures.
     * @return {Object}
     */
    messages() {
        return {
            'title.required': 'Title is required',
            'title.max': 'Title cannot exceed 255 characters',
        };
    }
}

module.exports = StoreTodoRequest;
