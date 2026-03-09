class MessageBag {
    constructor(messages = {}) {
        this.messages = messages;

        // Return a Proxy to allow Laravel-like property access (e.g., errors.email)
        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) {
                    const value = target[prop];
                    return typeof value === 'function' ? value.bind(target) : value;
                }

                // If property doesn't exist on class, check in messages
                if (typeof prop === 'string' && target.messages[prop]) {
                    return target.messages[prop];
                }

                return undefined;
            },
            has(target, prop) {
                return prop in target || prop in target.messages;
            },
            ownKeys(target) {
                // Only return the keys from the messages object for Object.keys()
                return Object.keys(target.messages);
            },
            getOwnPropertyDescriptor(target, prop) {
                if (prop in target.messages) {
                    return { enumerable: true, configurable: true, value: target.messages[prop] };
                }
                if (prop in target) {
                    return Reflect.getOwnPropertyDescriptor(target, prop);
                }
                return undefined;
            }
        });
    }

    /**
     * Alias for isNotEmpty
     */
    any() {
        return this.isNotEmpty();
    }

    /**
     * Make MessageBag iterable (over message groups).
     */
    *[Symbol.iterator]() {
        for (const key in this.messages) {
            yield this.messages[key];
        }
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
     * Get the first message for a given key (Laravel-like).
     * @param {string} key 
     * @param {string} defaultValue 
     * @returns {string}
     */
    first(key, defaultValue = null) {
        if (!key) {
            // If no key provided, return first error from any key
            for (const k in this.messages) {
                if (this.messages[k] && this.messages[k].length > 0) {
                    return this.messages[k][0];
                }
            }
            return defaultValue;
        }

        const msgs = this.get(key);
        return msgs.length > 0 ? msgs[0] : defaultValue;
    }

    /**
     * Get the first message for a given key, or throw an exception if not found.
     * @param {string} key 
     * @returns {string}
     */
    firstOrFail(key) {
        const message = this.first(key);
        if (!message) {
            throw new Error(`No message found for key: ${key}`);
        }
        return message;
    }

    /**
     * Get all messages for a given key.
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {Array}
     */
    get(key, defaultValue = []) {
        return this.has(key) ? this.messages[key] : defaultValue;
    }

    /**
     * Get all the messages in the bag (Laravel-like).
     * @param {string} format - Optional format (e.g., ':message')
     * @returns {Object|Array}
     */
    all(format = null) {
        if (format) {
            return this.formatMessages(format);
        }
        return { ...this.messages };
    }

    /**
     * Format all messages with a given format.
     * @param {string} format 
     * @returns {Array}
     */
    formatMessages(format) {
        const messages = [];

        for (const [key, msgs] of Object.entries(this.messages)) {
            for (const msg of msgs) {
                messages.push(format.replace(/:attribute/g, key).replace(/:message/g, msg));
            }
        }

        return messages;
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
     * Determine if the message bag is not empty.
     * @returns {boolean}
     */
    isNotEmpty() {
        return !this.isEmpty();
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

    /**
     * Convert the message bag to JSON.
     * @returns {string}
     */
    toJson() {
        return JSON.stringify(this.messages);
    }

    /**
     * Get messages for a given key with format.
     * @param {string} key 
     * @param {string} format 
     * @returns {Array}
     */
    getMessages(key, format = ':message') {
        if (!this.has(key)) return [];

        return this.messages[key].map(msg =>
            format.replace(/:attribute/g, key).replace(/:message/g, msg)
        );
    }

    /**
     * Check if a specific key has any messages.
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.messages[key] !== undefined && this.messages[key].length > 0;
    }

    /**
     * Check if any key has messages.
     * @param {Array} keys 
     * @returns {boolean}
     */
    hasAny(keys) {
        return keys.some(key => this.has(key));
    }

    /**
     * Get the first message without a key (Laravel-like).
     * @returns {string}
     */
    first() {
        for (const key in this.messages) {
            if (this.messages[key] && this.messages[key].length > 0) {
                return this.messages[key][0];
            }
        }
        return null;
    }

    /**
     * Get keys (field names) that have messages.
     * @returns {Array}
     */
    keys() {
        return Object.keys(this.messages).filter(key => this.messages[key].length > 0);
    }

    /**
     * Merge messages into the bag.
     * @param {Object|MessageBag} messages 
     * @returns {this}
     */
    merge(messages) {
        if (messages instanceof MessageBag) {
            messages = messages.all();
        }

        for (const [key, msgs] of Object.entries(messages)) {
            if (!this.messages[key]) {
                this.messages[key] = [];
            }

            if (Array.isArray(msgs)) {
                this.messages[key].push(...msgs);
            } else {
                this.messages[key].push(msgs);
            }
        }

        return this;
    }

    /**
     * Replace all messages in the bag.
     * @param {Object} messages 
     * @returns {this}
     */
    replace(messages) {
        this.messages = { ...messages };
        return this;
    }

    /**
     * Get a plain array representation.
     * @returns {Object}
     */
    toObject() {
        return { ...this.messages };
    }
}

module.exports = MessageBag;
