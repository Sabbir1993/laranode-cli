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
     * Include a value if a given condition is truthy.
     */
    when(condition, value, defaultVal = null) {
        if (condition) {
            return typeof value === 'function' ? value() : value;
        }
        const MissingValue = require('../MissingValue');
        return arguments.length >= 3
            ? (typeof defaultVal === 'function' ? defaultVal() : defaultVal)
            : new MissingValue();
    }

    /**
     * Include a relationship if it has been loaded on the model.
     */
    whenLoaded(relationship) {
        const MissingValue = require('../MissingValue');

        if (!this.resource || typeof this.resource.relationLoaded !== 'function') {
            return new MissingValue();
        }

        if (this.resource.relationLoaded(relationship)) {
            // We can return a generic JsonResource if the user hasn't specified a dedicated Resource
            return this.resource.relations[relationship];
        }

        return new MissingValue();
    }

    /**
     * Merge a value into the array if a given condition is truthy.
     */
    mergeWhen(condition, value) {
        if (condition) {
            const MergeValue = require('../MergeValue');
            return new MergeValue(typeof value === 'function' ? value() : value);
        }
        const MissingValue = require('../MissingValue');
        return new MissingValue();
    }

    /**
     * Resolve the resource to a final JSON object.
     * @param {Request} request 
     * @returns {Object}
     */
    resolve(request) {
        let data = this.toArray(request);

        data = this.filterData(data);

        // Standardize output to always wrap in { data: ... } unless disabled
        const finalPayload = {
            data: data,
            ...this.withData
        };

        return finalPayload;
    }

    /**
     * Recursively filter missing values and unpack merge values.
     * @param {*} data 
     * @private
     */
    filterData(data) {
        const MissingValue = require('../MissingValue');
        const MergeValue = require('../MergeValue');

        if (Array.isArray(data)) {
            return data.filter(item => !(item instanceof MissingValue)).map(item => this.filterData(item));
        }

        if (typeof data === 'object' && data !== null) {
            if (data instanceof MissingValue) return data;

            const filtered = {};
            for (const key in data) {
                const value = data[key];

                if (value instanceof MissingValue) {
                    continue; // Skip entirely
                }

                if (value instanceof MergeValue) {
                    const mergedData = this.filterData(value.data);
                    Object.assign(filtered, mergedData);
                } else {
                    filtered[key] = this.filterData(value);
                }
            }
            return filtered;
        }

        return data;
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
