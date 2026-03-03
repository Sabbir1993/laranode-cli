const mysql = require('mysql2/promise');

class MysqlConnector {
    constructor(config) {
        this.config = config;
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = mysql.createPool({
                host: this.config.host,
                port: this.config.port,
                user: this.config.username,
                password: this.config.password,
                database: this.config.database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        }
        return this.pool;
    }

    async query(sql, bindings = []) {
        const db = await this.connect();
        try {
            // mysql2 execute returns [rows, fields]
            const [rows] = await db.execute(sql, bindings);

            // Normalize return formats to loosely match better-sqlite3 for compatibility
            // better-sqlite3 returns an array of objects for SELECT
            // and { changes: 1, lastInsertRowid: 1 } for INSERT/UPDATE/DELETE

            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                return rows;
            } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
                return {
                    changes: rows.affectedRows,
                    lastInsertRowid: rows.insertId
                };
            } else {
                return {
                    changes: rows.affectedRows || 0
                };
            }

        } catch (error) {
            throw new Error(`MySQL Error: ${error.message} \nQuery: ${sql} \nBindings: ${JSON.stringify(bindings)}`);
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

module.exports = MysqlConnector;
