class Factory {
    constructor(model) {
        this.model = model;
        this.states = {};
    }

    /**
     * Define the model's default state.
     * @returns {Object}
     */
    definition() {
        return {};
    }

    /**
     * Create multiple instances of the model.
     * @param {number} count 
     */
    count(count) {
        this._count = count;
        return this;
    }

    /**
     * Make fake data objects (without saving)
     * @param {Object} attributes 
     */
    make(attributes = {}) {
        const count = this._count || 1;
        const results = [];

        for (let i = 0; i < count; i++) {
            const data = { ...this.definition(), ...attributes };
            results.push(new this.model(data));
        }

        return count === 1 ? results[0] : results;
    }

    /**
     * Create models and save to database
     * @param {Object} attributes 
     */
    create(attributes = {}) {
        const count = this._count || 1;
        const results = [];

        for (let i = 0; i < count; i++) {
            const data = { ...this.definition(), ...attributes };
            results.push(this.model.create(data));
        }

        return count === 1 ? results[0] : results;
    }
}

module.exports = Factory;
