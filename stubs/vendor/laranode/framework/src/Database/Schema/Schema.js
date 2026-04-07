class Schema {
    static getDB() {
        return require('../../Support/Facades/DB');
    }

    static async create(table, callback) {
        const Blueprint = require('./Blueprint');
        const blueprint = new Blueprint(table);

        callback(blueprint);

        const statements = blueprint.toSql(this.getDB().connection().config.driver);
        for (const sql of statements) {
            await this.getDB().query(sql);
        }
    }

    static async dropIfExists(table) {
        this.getDB().query(`DROP TABLE IF EXISTS ${table}`);
    }

    static async table(table, callback) {
        const Blueprint = require('./Blueprint');
        const blueprint = new Blueprint(table);

        callback(blueprint);

        const driver = this.getDB().connection().config.driver;
        const statements = blueprint.columns.map(col => {
            let def = blueprint.compileColumnType(col, driver);
            
            // Clean up name for ALTER TABLE syntax (Blueprint includes it in the definition)
            const typeStr = def.replace(new RegExp(`^${col.name}\\s+`), '');
            
            let alterDef = `${col.name} ${typeStr}`;
            if (col.type === 'VARCHAR' && driver === 'sqlite') alterDef = `${col.name} TEXT`;
            if (!col.isNullable) alterDef += ' NOT NULL';
            
            if (col.afterColumn && driver === 'mysql') {
                alterDef += ` AFTER ${col.afterColumn}`;
            }

            return `ALTER TABLE ${table} ADD COLUMN ${alterDef}`;
        });

        statements.push(...blueprint.toSql(driver).filter(s => s.startsWith('ALTER')));

        for (const sql of statements) {
            await this.getDB().query(sql);
        }
    }
}

module.exports = Schema;
