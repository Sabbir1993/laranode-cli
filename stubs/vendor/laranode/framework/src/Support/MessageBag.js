class MessageBag {
    constructor(messages = {}) {
        this.messages = messages;
    }

    /**
     * Add a message to the bag.
     * @param {string} key 
     * @param {string} message 
     * @returns {this}
     */
    add(key, message) {
        if (!this.messages[key]) {
            this.messages[key] = [];
        }
        this.messages[key].push(message);
        return this;
    }

    /**
     * Determine if messages exist for a given key.
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.messages[key] && this.messages[key].length > 0;
    }

    /**
     * Get the first message for a given key.
     * @param {string} key 
     * @param {string} defaultMessage 
     * @returns {string}
     */
    first(key, defaultMessage = '') {
        return this.has(key) ? this.messages[key][0] : defaultMessage;
    }

    /**
     * Get all messages for a given key.
     * @param {string} key 
     * @returns {Array}
     */
    get(key) {
        return this.has(key) ? this.messages[key] : [];
    }

    /**
     * Get all the messages in the bag.
     * @returns {Object}
     */
    all() {
        return this.messages;
    }

    /**
     * Get the number of messages in the bag.
     * @returns {number}
     */
    count() {
        return Object.keys(this.messages).reduce((count, key) => count + this.messages[key].length, 0);
    }

    /**
     * Determine if the message bag is empty.
     * @returns {boolean}
     */
    isEmpty() {
        return this.count() === 0;
    }

    /**
     * Convert the message bag to an array of messages.
     * @returns {Array}
     */
    toArray() {
        let arr = [];
        for (const key in this.messages) {
            arr = arr.concat(this.messages[key]);
        }
        return arr;
    }
}

module.exports = MessageBag;
