const Controller = use('App/Http/Controllers/Controller');

class DocsController extends Controller {
    /**
     * Show the detailed framework documentation.
     */
    index(req, res) {
        return res.view('docs', {
            title: 'LaraNode Documentation',
            version: '1.0.0'
        });
    }
}

module.exports = DocsController;
