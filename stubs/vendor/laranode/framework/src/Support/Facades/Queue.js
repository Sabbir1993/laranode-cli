const Facade = use('laranode/Support/Facades/Facade');

class Queue extends Facade {
    static getFacadeAccessor() {
        return 'queue';
    }
}

module.exports = Queue;
