/**
 * PendingRequest for LaraNode Http Client.
 * Provides a fluent interface to build and execute HTTP requests.
 */
class PendingRequest {
    constructor() {
        this.baseUrl = '';
        this.requestHeaders = {};
        this.requestBody = null;
        this.queryParams = {};
        this.isForm = false;
        this.isJson = true;
        this.attachments = [];
    }

    /**
     * Set the base URL for the request
     * @param {string} url 
     * @returns {PendingRequest}
     */
    withBaseUrl(url) {
        this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        return this;
    }

    /**
     * Set the headers for the request
     * @param {object} headers 
     * @returns {PendingRequest}
     */
    withHeaders(headers) {
        this.requestHeaders = { ...this.requestHeaders, ...headers };
        return this;
    }

    /**
     * Set a bearer token
     * @param {string} token 
     * @returns {PendingRequest}
     */
    withToken(token) {
        return this.withHeaders({ Authorization: `Bearer ${token}` });
    }

    /**
     * Accept JSON response
     * @returns {PendingRequest}
     */
    acceptJson() {
        return this.withHeaders({ Accept: 'application/json' });
    }

    /**
     * Send as form data (application/x-www-form-urlencoded)
     * @returns {PendingRequest}
     */
    asForm() {
        this.isForm = true;
        this.isJson = false;
        return this.withHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    }

    /**
     * Send as JSON (default)
     * @returns {PendingRequest}
     */
    asJson() {
        this.isForm = false;
        this.isJson = true;
        return this.withHeaders({ 'Content-Type': 'application/json' });
    }

    /**
     * Attach a file to the request (Multipart Form Data)
     * @param {string} name 
     * @param {string|Buffer|Blob} contents 
     * @param {string} filename 
     * @returns {PendingRequest}
     */
    attach(name, contents, filename = null) {
        this.isForm = false;
        this.isJson = false; // Fetch will automatically set multipart/form-data with boundary when passing FormData

        // Remove content-type so fetch can set the correct boundary
        if (this.requestHeaders['Content-Type']) {
            delete this.requestHeaders['Content-Type'];
        }

        this.attachments.push({ name, contents, filename });
        return this;
    }

    /**
     * Prepare the URL with query parameters
     * @param {string} url 
     * @param {object} query 
     * @returns {string}
     */
    buildUrl(url, query = {}) {
        let fullUrl = (this.baseUrl && !url.startsWith('http')) 
            ? `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}` 
            : url;

        const mergedQuery = { ...this.queryParams, ...query };
        if (Object.keys(mergedQuery).length > 0) {
            const queryString = new URLSearchParams(mergedQuery).toString();
            fullUrl += fullUrl.includes('?') ? `&${queryString}` : `?${queryString}`;
        }

        return fullUrl;
    }

    /**
     * Build the request body
     * @param {object} data 
     * @returns {string|FormData|URLSearchParams}
     */
    buildBody(data = {}) {
        if (Object.keys(data).length === 0 && this.attachments.length === 0) {
            return undefined;
        }

        if (this.attachments.length > 0) {
            const formData = new FormData();

            // Append regular data
            for (const [key, value] of Object.entries(data)) {
                formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
            }

            // Append attachments
            for (const attachment of this.attachments) {
                if (attachment.filename) {
                    formData.append(attachment.name, new Blob([attachment.contents]), attachment.filename);
                } else {
                    formData.append(attachment.name, new Blob([attachment.contents]));
                }
            }

            return formData;
        }

        if (this.isForm) {
            return new URLSearchParams(data).toString();
        }

        if (this.isJson) {
            return JSON.stringify(data);
        }

        return data; // Raw fallback
    }

    /**
     * Execute the fetch request and wrap the response
     * @param {string} method 
     * @param {string} url 
     * @param {object} data 
     * @returns {Promise<Response>}
     */
    async send(method, url, data = {}) {
        const fullUrl = method === 'GET' ? this.buildUrl(url, data) : this.buildUrl(url);
        const options = {
            method,
            headers: { ...this.requestHeaders },
        };

        if (method !== 'GET' && method !== 'HEAD') {
            options.body = this.buildBody(data);
        }

        try {
            const fetchResponse = await fetch(fullUrl, options);
            return await this.buildResponse(fetchResponse);
        } catch (error) {
            throw error; // Or wrap in a custom RequestException
        }
    }

    /**
     * Wrap the fetch response in a fluent Laravel-like Response object
     * @param {Response} fetchResponse 
     * @returns {object}
     */
    async buildResponse(fetchResponse) {
        // Clone the response so we can read text and optionally parse JSON
        const clone = fetchResponse.clone();
        const text = await clone.text();

        // Try parsing JSON
        let data = null;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // Not JSON
        }

        return {
            status: () => fetchResponse.status,
            ok: () => fetchResponse.ok,
            successful: () => fetchResponse.status >= 200 && fetchResponse.status < 300,
            failed: () => fetchResponse.status >= 400,
            clientError: () => fetchResponse.status >= 400 && fetchResponse.status < 500,
            serverError: () => fetchResponse.status >= 500,
            json: (key = null) => {
                if (key) {
                    return data ? data[key] : null;
                }
                return data;
            },
            body: () => text,
            header: (name) => fetchResponse.headers.get(name),
            headers: () => Object.fromEntries(fetchResponse.headers.entries()),
            _response: fetchResponse // Expose underlying fetch response if needed
        };
    }

    // --- HTTP Verbs ---

    get(url, query = null) {
        return this.send('GET', url, query || {});
    }

    post(url, data = {}) {
        return this.send('POST', url, data);
    }

    put(url, data = {}) {
        return this.send('PUT', url, data);
    }

    patch(url, data = {}) {
        return this.send('PATCH', url, data);
    }

    delete(url, data = {}) {
        return this.send('DELETE', url, data);
    }
}

module.exports = PendingRequest;
