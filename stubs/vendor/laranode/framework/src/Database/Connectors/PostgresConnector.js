const { Pool } = require('pg');

class PostgresConnector {
    constructor(config) {
        this.config = config;
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = new Pool({
                host: this.config.host || '127.0.0.1',
                port: this.config.port || 5432,
                user: this.config.username,
                password: this.config.password,
                database: this.config.database,
                max: 10, // Default connection limit
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
        }
        return this.pool;
    }

    async query(sql, bindings = []) {
        const pool = await this.connect();
        try {
            // Postgres uses $1, $2 instead of ? for bindings.
            // Convert standard query builder '?' to '$N' natively at connection level.
            let i = 1;
            const pgSql = sql.replace(/\?/g, () => `$${i++}`);
            const result = await pool.query(pgSql, bindings);

            // Normalize return formats to loosely match better-sqlite3 for compatibility
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                return result.rows;
            } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
                return {
                    changes: result.rowCount,
                    // If returning id was used, it will be in result.rows[0]
                    lastInsertRowid: result.rows.length ? result.rows[0].id : null
                };
            } else {
                return {
                    changes: result.rowCount || 0
                };
            }

        } catch (error) {
            throw new Error(`Postgres Error: ${error.message} \nQuery: ${sql} \nBindings: ${JSON.stringify(bindings)}`);
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }

    async beginTransaction() {
        const pool = await this.connect();
        const client = await pool.connect(); // Acquire a dedicated client from the pool
        await client.query('BEGIN');

        return {
            query: async (sql, bindings = []) => {
                try {
                    let i = 1;
                    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
                    const result = await client.query(pgSql, bindings);

                    if (sql.trim().toUpperCase().startsWith('SELECT')) return result.rows;
                    if (sql.trim().toUpperCase().startsWith('INSERT')) {
                        return { changes: result.rowCount, lastInsertRowid: result.rows.length ? result.rows[0].id : null };
                    }
                    return { changes: result.rowCount || 0 };
                } catch (error) {
                    throw new Error(`Postgres Transaction Error: ${error.message} \nQuery: ${sql}`);
                }
            },
            commit: async () => {
                try {
                    await client.query('COMMIT');
                } finally {
                    client.release();
                }
            },
            rollBack: async () => {
                try {
                    await client.query('ROLLBACK');
                } finally {
                    client.release();
                }
            }
        };
    }
}

module.exports = PostgresConnector;
