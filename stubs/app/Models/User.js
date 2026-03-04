const Model = use('laranode/Database/Loquent/Model');
const HasApiTokens = use('laranode/Auth/Traits/HasApiTokens');

class User extends HasApiTokens(Model) {
    static table = 'users';
    static fillable = [
        'name', 'email', 'password',
    ];
    static hidden = [
        'password', 'remember_token',
    ];

    constructor(attributes = {}) {
        super(attributes);
    }

    /**
     * Get the todos for the user.
     */
    todos() {
        const Todo = use('App/Models/Todo');
        return this.hasMany(Todo, 'user_id');
    }

}

module.exports = User;