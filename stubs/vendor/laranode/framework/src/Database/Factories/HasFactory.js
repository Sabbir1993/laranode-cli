const HasFactory = (Base) => class extends Base {
    /**
     * Get a new factory instance for the model.
     *
     * @return {Factory}
     */
    static factory(count = null) {
        const factory = this.newFactory() || this.resolveFactory();

        if (count !== null) {
            return factory.count(count);
        }

        return factory;
    }

    /**
     * Create a new factory instance for the model.
     *
     * @return {Factory}
     */
    static newFactory() {
        // Can be overridden by the model if they want to explicitly return a factory
        return null;
    }

    /**
     * Resolve the factory based on conventions.
     *
     * @return {Factory}
     */
    static resolveFactory() {
        const modelName = this.name;

        try {
            // Attempt to resolve based on common convention (e.g., User -> UserFactory)
            const FactoryClass = use(`Database/Factories/${modelName}Factory`);
            return new FactoryClass(this);
        } catch (error) {
            throw new Error(`Unable to resolve factory for model [${modelName}]. Ensure database/factories/${modelName}Factory.js exists.`);
        }
    }
}

module.exports = HasFactory;
