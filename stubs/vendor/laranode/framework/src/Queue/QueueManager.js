const DatabaseQueue = require('./Connectors/DatabaseQueue');
const RedisQueue = require('./Connectors/RedisQueue');

class QueueManager {
    constructor(app) {
        this.app = app;
        this.connections = {};
    }

    /**
     * Get a queue connection instance.
     * @param {string} name
     */
    connection(name = null) {
        name = name || this.getDefaultDriver();

        if (!this.connections[name]) {
            this.connections[name] = this.resolve(name);
        }

        return this.connections[name];
    }

    /**
     * Resolve the given queue connection.
     * @param {string} name
     */
    resolve(name) {
        const config = this.app.make('config').get(`queue.connections.${name}`);

        if (!config) {
            throw new Error(`Queue connection [${name}] is not configured.`);
        }

        switch (config.driver) {
            case 'database':
                return new DatabaseQueue(this.app, config);
            case 'redis':
                return new RedisQueue(this.app, config);
            default:
                throw new Error(`Unsupported queue driver [${config.driver}].`);
        }
    }

    /**
     * Get the default queue connection name.
     */
    getDefaultDriver() {
        return this.app.make('config').get('queue.default', 'database');
    }

    /**
     * Push a new job onto the queue.
     * @param {string} job 
     * @param {*} data 
     * @param {string} queue 
     */
    push(job, data = '', queue = null) {
        return this.connection().push(job, data, queue);
    }

    /**
     * Push a new job onto the queue after a delay.
     * @param {number} delay 
     * @param {string} job 
     * @param {*} data 
     * @param {string} queue 
     */
    later(delay, job, data = '', queue = null) {
        return this.connection().later(delay, job, data, queue);
    }

    /**
     * Pop the next job off of the queue.
     * @param {string} queue 
     */
    pop(queue = null) {
        return this.connection().pop(queue);
    }
}

module.exports = QueueManager;
