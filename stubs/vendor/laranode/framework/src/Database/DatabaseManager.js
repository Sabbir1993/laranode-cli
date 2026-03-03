class DatabaseManager {
    constructor(app) {
        this.app = app;
        this.connections = {};
    }

    /**
     * Get a database connection instance.
     * @param {string} name 
     */
    connection(name = null) {
        name = name || this.getDefaultConnection();

        if (!this.connections[name]) {
            this.connections[name] = this.makeConnection(name);
        }

        return this.connections[name];
    }

    /**
     * Get the default connection name.
     */
    getDefaultConnection() {
        return this.app.make('config').get('database.default');
    }

    /**
     * Make the database connection instance.
     */
    makeConnection(name) {
        const config = this.app.make('config').get(`database.connections.${name}`);

        if (!config) {
            throw new Error(`Database connection [${name}] not configured.`);
        }

        switch (config.driver) {
            case 'sqlite':
                return new (require('./Connectors/SqliteConnector'))(config);
            case 'mysql':
                return new (require('./Connectors/MysqlConnector'))(config);
            default:
                throw new Error(`Unsupported database driver [${config.driver}].`);
        }
    }

    /**
     * Perform a query against the default connection.
     */
    query(sql, bindings = []) {
        return this.connection().query(sql, bindings);
    }

    /**
     * Begin a fluent query against a database table.
     * @param {string} table 
     */
    table(table) {
        const Builder = require('./Query/Builder');
        return new Builder(this.connection(), table);
    }

    /**
     * Disconnect from all database connections.
     */
    async disconnect() {
        for (const name of Object.keys(this.connections)) {
            const conn = this.connections[name];
            if (conn && typeof conn.disconnect === 'function') {
                await conn.disconnect();
            }
        }
        this.connections = {};
    }
}

module.exports = DatabaseManager;
