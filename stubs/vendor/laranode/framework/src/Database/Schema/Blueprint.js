class Blueprint {
    constructor(table) {
        this.table = table;
        this.columns = [];
        this.commands = [];
        this.foreignKeys = [];
    }

    // ─── Primary Key ──────────────────────────────────────

    id(column = 'id') {
        this.unsignedBigInteger(column).primary().autoIncrement();
        return this;
    }

    // ─── String Types ─────────────────────────────────────

    string(column, length = 255) {
        return this.addColumn('VARCHAR', column, { length });
    }

    longText(column) {
        return this.addColumn('LONGTEXT', column);
    }

    mediumText(column) {
        return this.addColumn('MEDIUMTEXT', column);
    }

    text(column) {
        return this.addColumn('TEXT', column);
    }

    binary(column) {
        return this.addColumn('BLOB', column);
    }

    // ─── Integer Types ────────────────────────────────────

    integer(column) {
        return this.addColumn('INTEGER', column);
    }

    bigInteger(column) {
        return this.addColumn('BIGINT', column);
    }

    tinyInteger(column) {
        return this.addColumn('TINYINT', column);
    }

    smallInteger(column) {
        return this.addColumn('SMALLINT', column);
    }

    unsignedInteger(column) {
        return this.addColumn('INTEGER', column, { unsigned: true });
    }

    unsignedBigInteger(column) {
        return this.addColumn('BIGINT', column, { unsigned: true });
    }

    // ─── Decimal / Float Types ────────────────────────────

    float(column, precision = 8, scale = 2) {
        return this.addColumn('FLOAT', column, { precision, scale });
    }

    double(column, precision = null, scale = null) {
        return this.addColumn('DOUBLE', column, { precision, scale });
    }

    decimal(column, precision = 8, scale = 2) {
        return this.addColumn('DECIMAL', column, { precision, scale });
    }

    // ─── Boolean ──────────────────────────────────────────

    boolean(column) {
        return this.addColumn('BOOLEAN', column);
    }

    // ─── Date & Time Types ────────────────────────────────

    date(column) {
        return this.addColumn('DATE', column);
    }

    dateTime(column) {
        return this.addColumn('DATETIME', column);
    }

    timestamp(column) {
        return this.addColumn('DATETIME', column);
    }

    time(column) {
        return this.addColumn('TIME', column);
    }

    timestamps() {
        this.addColumn('DATETIME', 'created_at').nullable();
        this.addColumn('DATETIME', 'updated_at').nullable();
        return this;
    }

    softDeletes(column = 'deleted_at') {
        this.addColumn('DATETIME', column).nullable();
        return this;
    }

    // ─── JSON & Enum ──────────────────────────────────────

    json(column) {
        return this.addColumn('JSON', column);
    }

    jsonb(column) {
        return this.addColumn('JSON', column); // MySQL uses JSON for both
    }

    enum(column, values) {
        return this.addColumn('ENUM', column, { enumValues: values });
    }

    // ─── Helper Columns ───────────────────────────────────

    rememberToken() {
        this.string('remember_token', 100).nullable();
        return this;
    }

    morphs(name) {
        this.unsignedBigInteger(`${name}_id`);
        this.string(`${name}_type`);
        return this;
    }

    nullableMorphs(name) {
        this.unsignedBigInteger(`${name}_id`).nullable();
        this.string(`${name}_type`).nullable();
        return this;
    }

    // ─── Column Definition ────────────────────────────────

    addColumn(type, name, parameters = {}) {
        const column = {
            type, name, ...parameters,
            isNullable: false,
            isPrimary: false,
            isAutoIncrement: false,
            isUnique: false,
            isIndex: false,
            defaultValue: undefined,
            afterColumn: null,
            columnComment: null
        };
        this.columns.push(column);

        // Chainable methods on column
        const chainable = {
            nullable: () => { column.isNullable = true; return chainable; },
            primary: () => { column.isPrimary = true; return chainable; },
            autoIncrement: () => { column.isAutoIncrement = true; return chainable; },
            unique: () => { column.isUnique = true; return chainable; },
            index: () => { column.isIndex = true; return chainable; },
            default: (val) => { column.defaultValue = val; return chainable; },
            after: (col) => { column.afterColumn = col; return chainable; },
            comment: (text) => { column.columnComment = text; return chainable; },
            unsigned: () => { column.unsigned = true; return chainable; }
        };

        return chainable;
    }

    // ─── Foreign Keys ─────────────────────────────────────

    foreign(column) {
        const fk = {
            column,
            referencesColumn: null,
            onTable: null,
            onDeleteAction: 'RESTRICT',
            onUpdateAction: 'RESTRICT'
        };
        this.foreignKeys.push(fk);

        const chainable = {
            references: (col) => { fk.referencesColumn = col; return chainable; },
            on: (table) => { fk.onTable = table; return chainable; },
            onDelete: (action) => { fk.onDeleteAction = action.toUpperCase(); return chainable; },
            onUpdate: (action) => { fk.onUpdateAction = action.toUpperCase(); return chainable; }
        };

        return chainable;
    }

    foreignId(column) {
        const colChainable = this.unsignedBigInteger(column);

        // Add constrained() shorthand
        colChainable.constrained = (table = null) => {
            // Infer table name: user_id → users
            if (!table) {
                table = column.replace(/_id$/, '') + 's';
            }
            this.foreign(column).references('id').on(table).onDelete('CASCADE');
            return colChainable;
        };

        return colChainable;
    }

    // ─── Column Modification Commands ─────────────────────

    dropColumn(column) {
        this.commands.push({ name: 'dropColumn', column });
    }

    renameColumn(from, to) {
        this.commands.push({ name: 'renameColumn', from, to });
    }

    dropIndex(indexName) {
        this.commands.push({ name: 'dropIndex', indexName });
    }

    dropUnique(indexName) {
        this.commands.push({ name: 'dropIndex', indexName });
    }

    dropForeign(indexName) {
        this.commands.push({ name: 'dropForeign', indexName });
    }

    // ─── SQL Compilation ──────────────────────────────────

    toSql(connectionDriver = 'sqlite') {
        const statements = [];

        // Compile CREATE TABLE with columns
        const colDefinitions = this.columns.map(col => {
            let def = this.compileColumnType(col, connectionDriver);

            // UNSIGNED must come right after the type in MySQL
            if (col.unsigned && connectionDriver === 'mysql') {
                def += ' UNSIGNED';
            }

            if (col.isPrimary) def += ' PRIMARY KEY';

            if (col.isAutoIncrement) {
                if (connectionDriver === 'mysql') def += ' AUTO_INCREMENT';
                else if (connectionDriver === 'sqlite') def += ' AUTOINCREMENT';
                // PostgreSQL handles auto-increment implicitly via SERIAL/BIGSERIAL types instead of an attribute keyword
            }

            if (!col.isNullable && !col.isPrimary) def += ' NOT NULL';
            if (col.isUnique) def += ' UNIQUE';

            if (col.defaultValue !== undefined) {
                const val = typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue;
                def += ` DEFAULT ${val}`;
            }

            if (col.columnComment && connectionDriver === 'mysql') {
                def += ` COMMENT '${col.columnComment}'`;
            }

            if (col.afterColumn && connectionDriver === 'mysql') {
                def += ` AFTER ${col.afterColumn}`;
            }

            return def;
        });

        // Compile foreign key constraints inline
        const fkDefinitions = this.foreignKeys.map(fk => {
            const name = `fk_${this.table}_${fk.column}`;
            return `CONSTRAINT ${name} FOREIGN KEY (${fk.column}) REFERENCES ${fk.onTable} (${fk.referencesColumn}) ON DELETE ${fk.onDeleteAction} ON UPDATE ${fk.onUpdateAction}`;
        });

        const allDefs = [...colDefinitions, ...fkDefinitions];

        if (allDefs.length > 0) {
            statements.push(`CREATE TABLE IF NOT EXISTS ${this.table} (${allDefs.join(', ')})`);
        }

        // Compile CREATE INDEX statements
        for (const col of this.columns) {
            if (col.isIndex) {
                const indexName = `idx_${this.table}_${col.name}`;
                if (connectionDriver === 'mysql') {
                    statements.push(`CREATE INDEX ${indexName} ON ${this.table} (${col.name})`);
                } else {
                    statements.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.table} (${col.name})`);
                }
            }
        }

        // Compile commands (ALTER TABLE operations)
        for (const cmd of this.commands) {
            if (cmd.name === 'dropColumn') {
                statements.push(`ALTER TABLE ${this.table} DROP COLUMN ${cmd.column}`);
            } else if (cmd.name === 'renameColumn') {
                if (connectionDriver === 'mysql') {
                    statements.push(`ALTER TABLE ${this.table} RENAME COLUMN ${cmd.from} TO ${cmd.to}`);
                } else {
                    statements.push(`ALTER TABLE ${this.table} RENAME COLUMN ${cmd.from} TO ${cmd.to}`);
                }
            } else if (cmd.name === 'dropIndex') {
                if (connectionDriver === 'mysql') {
                    statements.push(`DROP INDEX ${cmd.indexName} ON ${this.table}`);
                } else {
                    statements.push(`DROP INDEX IF EXISTS ${cmd.indexName}`);
                }
            } else if (cmd.name === 'dropForeign') {
                if (connectionDriver === 'mysql') {
                    statements.push(`ALTER TABLE ${this.table} DROP FOREIGN KEY ${cmd.indexName}`);
                }
            }
        }

        return statements;
    }

    compileColumnType(col, driver) {
        const name = col.name;
        const type = col.type;

        if (driver === 'sqlite') {
            // SQLite type affinity mapping
            const sqliteMap = {
                'VARCHAR': 'TEXT',
                'LONGTEXT': 'TEXT',
                'MEDIUMTEXT': 'TEXT',
                'TINYINT': 'INTEGER',
                'SMALLINT': 'INTEGER',
                'BIGINT': 'INTEGER',
                'FLOAT': 'REAL',
                'DOUBLE': 'REAL',
                'DECIMAL': 'REAL',
                'BOOLEAN': 'INTEGER',
                'DATE': 'TEXT',
                'DATETIME': 'TEXT',
                'TIME': 'TEXT',
                'JSON': 'TEXT',
                'ENUM': 'TEXT',
                'BLOB': 'BLOB'
            };
            return `${name} ${sqliteMap[type] || type}`;
        }

        if (driver === 'pgsql') {
            // PostgreSQL type mapping
            const pgMap = {
                'VARCHAR': `VARCHAR(${col.length || 255})`,
                'LONGTEXT': 'TEXT',
                'MEDIUMTEXT': 'TEXT',
                'TEXT': 'TEXT',
                'TINYINT': 'SMALLINT', // Postgres doesn't have TINYINT
                'SMALLINT': col.isAutoIncrement ? 'SMALLSERIAL' : 'SMALLINT',
                'INTEGER': col.isAutoIncrement ? 'SERIAL' : 'INTEGER',
                'BIGINT': col.isAutoIncrement ? 'BIGSERIAL' : 'BIGINT',
                'FLOAT': 'REAL',
                'DOUBLE': 'DOUBLE PRECISION',
                'DECIMAL': `DECIMAL(${col.precision || 8}, ${col.scale || 2})`,
                'BOOLEAN': 'BOOLEAN',
                'DATE': 'DATE',
                'DATETIME': 'TIMESTAMP',
                'TIME': 'TIME',
                'JSON': 'JSONB',
                'ENUM': `VARCHAR(${col.length || 255})`, // Simplest fallback without custom TYPE enum
                'BLOB': 'BYTEA'
            };
            return `${name} ${pgMap[type] || type}`;
        }

        // MySQL
        switch (type) {
            case 'VARCHAR':
                return `${name} VARCHAR(${col.length || 255})`;
            case 'DECIMAL':
                return `${name} DECIMAL(${col.precision || 8}, ${col.scale || 2})`;
            case 'FLOAT':
                return `${name} FLOAT(${col.precision || 8}, ${col.scale || 2})`;
            case 'DOUBLE':
                if (col.precision) return `${name} DOUBLE(${col.precision}, ${col.scale || 0})`;
                return `${name} DOUBLE`;
            case 'ENUM':
                const vals = (col.enumValues || []).map(v => `'${v}'`).join(', ');
                return `${name} ENUM(${vals})`;
            default:
                return `${name} ${type}`;
        }
    }
}

module.exports = Blueprint;
