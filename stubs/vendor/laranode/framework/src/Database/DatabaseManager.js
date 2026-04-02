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

        // Check if we have a transaction for this connection in the current HttpContext
        const HttpContext = require('../Foundation/Http/HttpContext');
        const store = HttpContext.get();
        if (store && store.transactions && store.transactions[name]) {
            return store.transactions[name];
        }

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
            case 'pgsql':
                return new (require('./Connectors/PostgresConnector'))(config);
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
     * Execute a raw SQL statement (SET, CREATE, DROP, etc.) and return true on success.
     * Mirrors Laravel's DB::statement().
     *
     * @param  {string}  sql
     * @param  {Array}   bindings
     * @return {Promise<boolean>}
     */
    async statement(sql, bindings = []) {
        await this.connection().query(sql, bindings);
        return true;
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
     * Execute a closure within a transaction.
     * @param {Function} callback 
     */
    async transaction(callback) {
        const name = this.getDefaultConnection();
        const conn = this.connection(name);

        if (typeof conn.beginTransaction !== 'function') {
            throw new Error(`Database connection [${name}] does not support transactions.`);
        }

        const trxConnection = await conn.beginTransaction();

        // Propagate transaction through HttpContext
        const HttpContext = require('../Foundation/Http/HttpContext');
        const store = HttpContext.get();
        let originalTrx = null;

        if (store) {
            if (!store.transactions) store.transactions = {};
            originalTrx = store.transactions[name];
            store.transactions[name] = trxConnection;
        }

        // Create a scoped DatabaseManager proxy for this transaction
        const trxManager = Object.create(this);
        trxManager.connection = () => trxConnection;

        try {
            const result = await callback(trxManager);
            await trxConnection.commit();
            return result;
        } catch (error) {
            await trxConnection.rollBack();
            throw error;
        } finally {
            // Restore original transaction (null or previous)
            if (store) {
                store.transactions[name] = originalTrx;
            }
        }
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
