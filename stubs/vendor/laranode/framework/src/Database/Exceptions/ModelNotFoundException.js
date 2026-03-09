class ModelNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ModelNotFoundException';
        this.status = 404;
    }
}

module.exports = ModelNotFoundException;
