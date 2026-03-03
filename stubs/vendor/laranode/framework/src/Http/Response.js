class Response {
    /**
     * Create a new Response wrapper around Express res
     * @param {Object} res 
     */
    constructor(res) {
        this.res = res;
    }

    /**
     * Set the status code for the response.
     * @param {number} code 
     * @returns {this}
     */
    status(code) {
        this.res.status(code);
        return this;
    }

    /**
     * Send JSON response.
     * @param {Object} data 
     * @returns {*}
     */
    json(data) {
        return this.res.json(data);
    }

    /**
     * Send raw body response.
     * @param {string} body 
     * @returns {*}
     */
    send(body) {
        return this.res.send(body);
    }

    /**
     * Render a view and send it as a response.
     * @param {string} viewPath 
     * @param {Object} data 
     */
    view(viewPath, data = {}) {
        const html = global.view ? global.view(viewPath, data) : `View helper not found for ${viewPath}`;
        return this.send(html);
    }

    /**
     * Redirect to the given URL.
     * @param {string} url 
     * @param {number} status 
     */
    redirect(url, status = 302) {
        return this.res.redirect(status, url);
    }

    /**
     * Add a header to the response.
     * @param {string} key 
     * @param {string} value 
     * @returns {this}
     */
    header(key, value) {
        this.res.append(key, value);
        return this;
    }
}

module.exports = Response;
