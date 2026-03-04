const PendingRequest = require('./PendingRequest');
const Macroable = require('../../Support/Traits/Macroable');

/**
 * Factory for creating PendingRequests.
 * Acts as the entrypoint for the Http Facade.
 */
class Factory {
    constructor() {
        // Initialize an empty structure if needed
    }

    /**
     * Create a new pending request instance.
     * @returns {PendingRequest}
     */
    buildRequest() {
        const request = new PendingRequest();

        // If there are macros defined on the Factory, we inject them into this PendingRequest instance
        if (Factory.macros) {
            for (const [name, macro] of Factory.macros.entries()) {
                request[name] = macro.bind(request);
            }
        }

        return request;
    }

    /**
     * Dispatch method calls to a new PendingRequest instance
     */
    baseUrl(url) {
        return this.buildRequest().withBaseUrl(url);
    }

    withHeaders(headers) {
        return this.buildRequest().withHeaders(headers);
    }

    withToken(token) {
        return this.buildRequest().withToken(token);
    }

    acceptJson() {
        return this.buildRequest().acceptJson();
    }

    asForm() {
        return this.buildRequest().asForm();
    }

    asJson() {
        return this.buildRequest().asJson();
    }

    attach(name, contents, filename = null) {
        return this.buildRequest().attach(name, contents, filename);
    }

    get(url, query = null) {
        return this.buildRequest().get(url, query);
    }

    post(url, data = {}) {
        return this.buildRequest().post(url, data);
    }

    put(url, data = {}) {
        return this.buildRequest().put(url, data);
    }

    patch(url, data = {}) {
        return this.buildRequest().patch(url, data);
    }

    delete(url, data = {}) {
        return this.buildRequest().delete(url, data);
    }
}

// Add Macroable capabilities to Factory
Factory.macro = Macroable.macro.bind(Factory);
Factory.hasMacro = Macroable.hasMacro.bind(Factory);

// We overwrite the macro handler slightly to allow it to be seamlessly forwarded to the PendingRequest
const originalMacro = Factory.macro;
Factory.macro = function (name, macro) {
    originalMacro(name, macro);

    // Also attach to prototype so Factory instance can handle it
    Factory.prototype[name] = function (...args) {
        const request = this.buildRequest();
        return request[name](...args);
    };
};

// Expose macro registration to instances so Facade forwarding works
Factory.prototype.macro = function (name, macroFn) {
    return Factory.macro(name, macroFn);
};
Factory.prototype.hasMacro = function (name) {
    return Factory.hasMacro(name);
};

module.exports = Factory;
