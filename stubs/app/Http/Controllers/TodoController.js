const Controller = use('App/Http/Controllers/Controller');
const Todo = use('App/Models/Todo');
const StoreTodoRequest = use('App/Http/Requests/Todo/StoreTodoRequest');
const UpdateTodoRequest = use('App/Http/Requests/Todo/UpdateTodoRequest');

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
        const user = req.user();
        const todos = await user.todos().get();

        // If it's an API request or expects JSON explicitly (not just */* matching)
        if (req.xhr || req.accepts(['html', 'json']) === 'json') {
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
            const fileName = Date.now() + '_' + attachment.name;
            const uploadPath = process.cwd() + '/public/uploads/' + fileName;
            await attachment.mv(uploadPath);
            filePath = '/uploads/' + fileName;
        }

        const todo = await Todo.create({
            user_id: req.user().id,
            title: data.title,
            description: data.description,
            is_completed: false,
            file_path: filePath
        });

        if (req.xhr || req.accepts(['html', 'json']) === 'json') {
            return res.json({ success: true, todo });
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
            if (!model || model.user_id !== req.user().id) {
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
            const fileName = Date.now() + '_' + attachment.name;
            const uploadPath = process.cwd() + '/public/uploads/' + fileName;
            await attachment.mv(uploadPath);
            todo.file_path = '/uploads/' + fileName;
        }

        await todo.save();

        if (req.xhr || req.accepts(['html', 'json']) === 'json') {
            return res.json({ success: true, todo });
        }

        return res.redirect('/todos');
    }

    /**
     * Remove the specified todo from storage.
     */
    async destroy(req, res) {
        const id = req.params.todo;
        const todo = await Todo.find(id);

        if (!todo || todo.user_id !== req.user().id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await todo.delete();

        if (req.xhr || req.accepts(['html', 'json']) === 'json') {
            return res.json({ success: true });
        }

        return res.redirect('/todos');
    }
}

module.exports = TodoController;
