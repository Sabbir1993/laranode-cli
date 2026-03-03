class Response {
    /**
     * Create a new Laranode Response instance wrapped around Express res.
     * @param {Object} res 
     */
    constructor(res) {
        this.res = res;
    }

    /**
     * Return a new JSON response.
     * @param {*} data 
     * @param {number} status 
     * @param {Object} headers 
     */
    json(data = {}, status = 200, headers = {}) {
        this.withHeaders(headers).status(status).res.json(data);
    }

    /**
     * Return a new string response.
     * @param {string} content 
     * @param {number} status 
     * @param {Object} headers 
     */
    send(content = '', status = 200, headers = {}) {
        this.withHeaders(headers).status(status).res.send(content);
    }

    /**
     * Set the HTTP status code.
     * @param {number} code 
     * @returns {Response}
     */
    status(code) {
        this.res.status(code);
        return this;
    }

    /**
     * Add a header to the response.
     * @param {string} key 
     * @param {string} value 
     * @returns {Response}
     */
    header(key, value) {
        this.res.setHeader(key, value);
        return this;
    }

    /**
     * Add multiple headers to the response.
     * @param {Object} headers 
     * @returns {Response}
     */
    withHeaders(headers) {
        for (const [key, value] of Object.entries(headers)) {
            this.header(key, value);
        }
        return this;
    }

    /**
     * Create a redirect response.
     * @param {string} url 
     * @param {number} status 
     */
    redirect(url, status = 302) {
        this.res.redirect(status, url);
    }
}

module.exports = Response;
