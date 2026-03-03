const Controller = use('App/Http/Controllers/Controller');

class HomeController extends Controller {
    about(req, res) {
        return {
            app: config('app.name'),
            version: '1.0.0',
            message: 'This is the LaraNode framework!'
        };
    }
}

module.exports = HomeController;
