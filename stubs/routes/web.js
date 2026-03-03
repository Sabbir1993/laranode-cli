const Route = use('laranode/Support/Facades/Route');
const Log = use('laranode/Support/Facades/Log');

const path = require('path');

Route.get('/', (req, res) => {
    return res.redirect('/login');
});

Route.get('/docs', 'DocsController@index').name('docs');

Route.get('/about', 'HomeController@about');

// Note: web middleware is automatically applied by RouteServiceProvider to all routes in web.js
Route.get('/login', 'AuthController@showLoginForm').name('login');
Route.post('/login', 'AuthController@login');
Route.get('/register', 'AuthController@showRegisterForm').name('register');
Route.post('/register', 'AuthController@register');
Route.post('/logout', 'AuthController@logout').name('logout');

// Password Reset Routes
Route.get('/password/reset', 'PasswordController@showForgotForm').name('password.request');
Route.post('/password/email', 'PasswordController@sendResetLink').name('password.email');
Route.get('/password/reset/{token}', 'PasswordController@showResetForm').name('password.reset');
Route.post('/password/reset', 'PasswordController@reset').name('password.update');

// TODO Application Routes
Route.group({ middleware: ['auth:api'] }, () => {
    Route.get('/todos', 'TodoController@index').name('todos.index');
    Route.post('/todos', 'TodoController@store').name('todos.store');
    Route.put('/todos/{todo}', 'TodoController@update').name('todos.update');
    Route.delete('/todos/{todo}', 'TodoController@destroy').name('todos.destroy');
});
