class ResourceCollection {
    /**
     * @param {Array} resource The array of models/data
     * @param {typeof JsonResource} collects The specific resource class to map over
     */
    constructor(resource, collects = null) {
        this.resource = resource;
        this.collects = collects;
        this.withData = {};
    }

    /**
     * Add additional meta data.
     * @param {Object} data 
     * @returns {this}
     */
    additional(data) {
        this.withData = { ...this.withData, ...data };
        return this;
    }

    /**
     * Handle native JSON.stringify to auto-resolve
     */
    toJSON() {
        const Request = use('laranode/Http/Request');
        const req = new Request({});
        return this.resolve(req);
    }

    /**
     * Transform the resource collection into an array of mapped objects.
     * @param {Request} request 
     * @returns {Array}
     */
    toArray(request) {
        let collectionList = [];

        // Handle LengthAwarePaginator
        if (this.resource && typeof this.resource.items === 'function' && this.resource.options) {
            collectionList = this.resource.items() || [];

            // Apply pagination meta to the payload
            const paginatedData = this.resource.toArray();
            this.withData = { ...this.withData, meta: paginatedData.meta };

        } else {
            collectionList = Array.isArray(this.resource) ? this.resource : [];
        }

        return collectionList.map(item => {
            if (this.collects) {
                const resourceInstance = new this.collects(item);
                return resourceInstance.toArray(request);
            }
            return item;
        });
    }

        return collectionList.map(item => {
        if (this.collects) {
            // Instantiate the underlying resource class dynamically
            const resourceInstance = new this.collects(item);
            return resourceInstance.toArray(request);
        }
        return item;
    });
    }

/**
 * Resolve the collection to a final JSON payload.
 * @param {Request} request 
 * @returns {Object}
 */
resolve(request) {
    const data = this.toArray(request);

    return {
        data: data,
        ...this.withData
    };
}
}

module.exports = ResourceCollection;
