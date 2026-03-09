const request = require('supertest');
const chai = require('chai');
const app = require('../../../../../../bootstrap/app');

class TestCase {
    constructor() {
        this.app = app;
        this.server = null;
        this.expect = chai.expect;
        this.assert = chai.assert;
    }

    async setUp() {
        if (!this.server) {
            await this.app.boot();
            const kernel = this.app.make('laranode/Foundation/Http/Kernel');
            this.server = await kernel.handle();
        }
    }

    async tearDown() {
        // Optional logic to clear DB or reset caches
    }

    /**
     * Send a GET request to the application.
     */
    get(uri, headers = {}) {
        const req = request(this.server).get(uri);
        for (const [key, value] of Object.entries(headers)) {
            req.set(key, value);
        }
        return req;
    }

    /**
     * Send a POST request to the application.
     */
    post(uri, data = {}, headers = {}) {
        const req = request(this.server).post(uri).send(data);
        for (const [key, value] of Object.entries(headers)) {
            req.set(key, value);
        }
        return req;
    }

    /**
     * Send a PUT request to the application.
     */
    put(uri, data = {}, headers = {}) {
        const req = request(this.server).put(uri).send(data);
        for (const [key, value] of Object.entries(headers)) {
            req.set(key, value);
        }
        return req;
    }

    /**
     * Send a DELETE request to the application.
     */
    delete(uri, headers = {}) {
        const req = request(this.server).delete(uri);
        for (const [key, value] of Object.entries(headers)) {
            req.set(key, value);
        }
        return req;
    }
}

module.exports = TestCase;
