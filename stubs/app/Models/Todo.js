const Model = use('laranode/Database/Loquent/Model');

class Todo extends Model {
    static table = 'todos';
    static fillable = [
        'user_id', 'title', 'description', 'is_completed',
    ];

    /**
     * Get the user that owns the todo.
     */
    user() {
        const User = use('App/Models/User');
        return this.belongsTo(User, 'user_id');
    }
}

module.exports = Todo;
