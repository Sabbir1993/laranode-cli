const { faker } = require('@faker-js/faker');

class Factory {
    constructor(modelClass = null) {
        this.faker = faker;
        this._count = 1;
        this.states = [];
        // Support explicit constructors via inheritance OR dynamic injection via HasFactory trait
        this.targetModel = modelClass || this.model();
    }

    /**
     * Set the amount of models you wish to create / make.
     */
    count(num) {
        this._count = num;
        return this;
    }

    /**
     * Add a new state transformation to the model definition.
     */
    state(callback) {
        this.states.push(callback);
        return this;
    }

    /**
     * Create a collection of models and persist them to the database.
     */
    async create(attributes = {}) {
        let results = await this.make(attributes);
        return this.store(results);
    }

    /**
     * Create a collection of models without persisting them to the database.
     */
    async make(attributes = {}) {
        const items = [];
        for (let i = 0; i < this._count; i++) {
            let definition = this.definition();

            // apply states
            for (const stateCallback of this.states) {
                definition = { ...definition, ...stateCallback(definition) };
            }

            // apply overrides
            definition = { ...definition, ...attributes };

            items.push(new this.targetModel(definition));
        }

        if (this._count === 1) {
            return items[0];
        }

        const Collection = use('laranode/Support/Collection');
        return new Collection(items);
    }

    /**
     * Store the constructed models into the database.
     */
    async store(results) {
        if (Array.isArray(results) || (results.constructor && results.constructor.name === 'Collection')) {
            const arr = results.items || results;
            for (const item of arr) {
                await item.save();
            }
            return results;
        }

        await results.save();
        return results;
    }

    /**
     * Define the model's default state.
     * Must be implemented by child classes.
     */
    definition() {
        return {};
    }

    /**
     * The model that this factory corresponds to.
     */
    model() {
        if (this.targetModel) return this.targetModel;
        throw new Error('Factory must specify target Model class or override model() method');
    }
}

module.exports = Factory;
