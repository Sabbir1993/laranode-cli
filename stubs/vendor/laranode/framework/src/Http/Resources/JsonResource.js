class JsonResource {
    constructor(resource) {
        this.resource = resource;
        this.withData = {};

        // ES6 Proxy to forward property access to the underlying resource
        return new Proxy(this, {
            get(target, prop) {
                // If it is 'toJSON', handle JSON.stringify natively
                if (prop === 'toJSON') {
                    return function () {
                        const Request = use('laranode/Http/Request');
                        // For a pure stringify, we might not have a request, mock it
                        const req = new Request({});
                        return target.resolve(req);
                    };
                }

                if (prop in target) {
                    const value = target[prop];
                    if (typeof value === 'function') {
                        // Bind it to the proxy so `this.id` invokes the proxy interceptor inside the method itself
                        return value.bind(new Proxy(target, this));
                    }
                    return value;
                }

                if (target.resource && prop in target.resource) {
                    return target.resource[prop];
                }

                return undefined;
            }
        });
    }

    /**
     * Transform the resource into an array/object.
     * @param {Request} request 
     * @returns {Object}
     */
    toArray(request) {
        if (this.resource && typeof this.resource.toArray === 'function') {
            return this.resource.toArray();
        }

        return this.resource;
    }

    /**
     * Add additional meta data to the resource response.
     * @param {Object} data 
     * @returns {this}
     */
    additional(data) {
        this.withData = { ...this.withData, ...data };
        return this;
    }

    /**
     * Resolve the resource to a final JSON object.
     * @param {Request} request 
     * @returns {Object}
     */
    resolve(request) {
        let data = this.toArray(request);

        // Standardize output to always wrap in { data: ... } unless disabled
        const finalPayload = {
            data: data,
            ...this.withData
        };

        return finalPayload;
    }

    /**
     * Factory to transform a collection of resources.
     * @param {Array} resourceCollection 
     */
    static collection(resourceCollection) {
        const ResourceCollection = require('./ResourceCollection');
        // This dynamically instantiates a generic collection
        // Since we are inside the parent class, we pass the current class constructor downstream
        return new ResourceCollection(resourceCollection, this);
    }
}

module.exports = JsonResource;
