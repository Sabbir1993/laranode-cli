const DatabaseManager = require('../DatabaseManager');

class SqliteConnector {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    connect() {
        if (!this.connection) {
            const Database = require('better-sqlite3');
            this.connection = new Database(this.config.database);
            // PRAGMA statements can go here if needed
        }
        return this.connection;
    }

    query(sql, bindings = []) {
        const db = this.connect();
        try {
            // SQLite doesn't support booleans natively; convert to 1/0
            const processedBindings = bindings.map(b => typeof b === 'boolean' ? (b ? 1 : 0) : b);

            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = db.prepare(sql);
                return stmt.all(...processedBindings);
            } else if (sql.trim().toUpperCase().startsWith('INSERT') || sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE')) {
                const stmt = db.prepare(sql);
                const info = stmt.run(...processedBindings);
                return info;
            } else {
                // For other statements like CREATE TABLE, etc
                const stmt = db.prepare(sql);
                return stmt.run(...processedBindings);
            }
        } catch (error) {
            throw new Error(`SQL Error: ${error.message} \nQuery: ${sql} \nBindings: ${JSON.stringify(bindings)}`);
        }
    }

    async beginTransaction() {
        const db = this.connect();
        db.exec('BEGIN TRANSACTION');

        return {
            query: async (sql, bindings = []) => {
                return this.query(sql, bindings); // SQLite driver is synchronous, so safe to use standard query
            },
            commit: async () => {
                db.exec('COMMIT');
            },
            rollBack: async () => {
                db.exec('ROLLBACK');
            }
        };
    }
}

module.exports = SqliteConnector;
