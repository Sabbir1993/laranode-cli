const Facade = use('laranode/Support/Facades/Facade');

class View extends Facade {
    static getFacadeAccessor() {
        return 'view';
    }
}

module.exports = View;
