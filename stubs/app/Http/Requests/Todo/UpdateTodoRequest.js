const FormRequest = use('laranode/Foundation/Http/FormRequest');

class UpdateTodoRequest extends FormRequest {
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
            title: 'nullable|string|max:255',
            description: 'nullable|string',
            is_completed: 'nullable|boolean',
            remove_attachment: 'nullable|boolean'
        };
    }
}

module.exports = UpdateTodoRequest;
