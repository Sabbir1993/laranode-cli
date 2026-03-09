const Facade = use('laranode/Support/Facades/Facade');

class Broadcast extends Facade {
    static getFacadeAccessor() {
        return 'broadcast.manager';
    }
}

module.exports = Broadcast;
