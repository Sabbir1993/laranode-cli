const Controller = use('App/Http/Controllers/Controller');
const Todo = use('App/Models/Todo');
const Auth = use('laranode/Support/Facades/Auth');
const StoreTodoRequest = use('App/Http/Requests/Todo/StoreTodoRequest');
const UpdateTodoRequest = use('App/Http/Requests/Todo/UpdateTodoRequest');
const crypto = require('crypto');
const path = require('path');

class TodoController extends Controller {
    static get requests() {
        return {
            store: StoreTodoRequest,
            update: UpdateTodoRequest
        };
    }

    /**
     * Display a listing of the todos.
     */
    async index(req, res) {
        const user = Auth.user();
        const todos = await user.todos().get();

        if (req.wantsJson()) {
            return res.json({ todos });
        }

        return res.view('todos.index', { todos, user });
    }

    /**
     * Store a newly created todo in storage.
     */
    async store(req, res) {
        const data = await req.validated();

        let filePath = null; // Removed undefined manual validator here since Kernel auto-injects Request

        const attachment = req.file('attachment');
        if (attachment) {
            const ext = path.extname(attachment.name);
            const fileName = crypto.randomUUID() + ext;
            const uploadPath = process.cwd() + '/public/uploads/' + fileName;
            await attachment.mv(uploadPath);
            filePath = '/uploads/' + fileName;
        }

        const todo = await Todo.create({
            user_id: Auth.id(),
            title: data.title,
            description: data.description,
            is_completed: false,
            file_path: filePath
        });

        if (req.wantsJson()) {
            const html = global.view('todos.todo_item', { todo });
            return res.json({ success: true, todo, html });
        }

        return res.redirect('/todos');
    }

    /**
     * Update the specified todo in storage.
     */
    async update(req, res) {
        const data = await req.validated();
        let todo = req.params.todo; // Assumes Route Model Binding or manual load

        // Manual load if not bound
        if (!(todo instanceof Todo)) {
            const id = req.params.todo;
            const model = await Todo.find(id);
            if (!model || model.user_id !== Auth.id()) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            todo = model;
        }

        // Handle toggle completion or full update
        if (data.is_completed !== undefined) {
            todo.is_completed = !!data.is_completed;
        }
        if (data.title) {
            todo.title = data.title;
        }
        if (data.description !== undefined) {
            todo.description = data.description;
        }
        if (data.remove_attachment) {
            todo.file_path = null;
        }

        const attachment = req.file('attachment');
        if (attachment) {
            const ext = path.extname(attachment.name);
            const fileName = crypto.randomUUID() + ext;
            const uploadPath = process.cwd() + '/public/uploads/' + fileName;
            await attachment.mv(uploadPath);
            todo.file_path = '/uploads/' + fileName;
        }

        await todo.save();

        if (req.wantsJson()) {
            const html = global.view('todos.todo_item', { todo });
            return res.json({ success: true, todo, html });
        }

        return res.redirect('/todos');
    }

    /**
     * Remove the specified todo from storage.
     */
    async destroy(req, res) {
        const id = req.params.todo;
        const todo = await Todo.find(id);

        if (!todo || todo.user_id !== Auth.id()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await todo.delete();

        if (req.wantsJson()) {
            return res.json({ success: true });
        }

        return res.redirect('/todos');
    }
}

module.exports = TodoController;
