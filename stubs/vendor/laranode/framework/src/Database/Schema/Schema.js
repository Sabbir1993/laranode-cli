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

        // This MVP doesn't support full ALTER TABLE correctly, this is a basic stub
        const driver = this.getDB().connection().config.driver;
        const statements = blueprint.columns.map(col => {
            let def = `${col.name} ${col.type}`;
            if (col.type === 'VARCHAR' && driver === 'sqlite') def = `${col.name} TEXT`;
            if (!col.isNullable) def += ' NOT NULL';
            return `ALTER TABLE ${table} ADD COLUMN ${def}`;
        });

        statements.push(...blueprint.toSql(driver).filter(s => s.startsWith('ALTER')));

        for (const sql of statements) {
            await this.getDB().query(sql);
        }
    }
}

module.exports = Schema;
