/**
 * JoinClause - Collects multiple ON and WHERE conditions for JOIN statements.
 * Supports .on(), .orOn(), .where(), and .orWhere() for complex join conditions.
 */
class JoinClause {
    constructor() {
        this.clauses = [];
        this.bindings = [];
    }

    /**
     * Add an ON condition (column-to-column comparison).
     * @param {string} first 
     * @param {string} operator 
     * @param {string} second 
     * @param {string} boolean 
     * @returns {JoinClause}
     */
    on(first, operator, second, boolean = 'and') {
        this.clauses.push({ type: 'on', first, operator, second, boolean });
        return this;
    }

    /**
     * Add an OR ON condition.
     * @param {string} first 
     * @param {string} operator 
     * @param {string} second 
     * @returns {JoinClause}
     */
    orOn(first, operator, second) {
        return this.on(first, operator, second, 'or');
    }

    /**
     * Add a WHERE condition (column-to-value comparison with binding).
     * @param {string} column 
     * @param {string} operator 
     * @param {*} value 
     * @param {string} boolean 
     * @returns {JoinClause}
     */
    where(column, operator = null, value = null, boolean = 'and') {
        if (value === null) {
            value = operator;
            operator = '=';
        }
        this.clauses.push({ type: 'where', column, operator, boolean });
        this.bindings.push(value);
        return this;
    }

    /**
     * Add an OR WHERE condition.
     * @param {string} column 
     * @param {string} operator 
     * @param {*} value 
     * @returns {JoinClause}
     */
    orWhere(column, operator = null, value = null) {
        return this.where(column, operator, value, 'or');
    }

    /**
     * Add a WHERE NULL condition.
     * @param {string} column 
     * @param {string} boolean 
     * @param {boolean} not 
     * @returns {JoinClause}
     */
    whereNull(column, boolean = 'and', not = false) {
        const operator = not ? 'IS NOT NULL' : 'IS NULL';
        this.clauses.push({ type: 'null', column, operator, boolean });
        return this;
    }

    /**
     * Add a WHERE NOT NULL condition.
     * @param {string} column 
     * @param {string} boolean 
     * @returns {JoinClause}
     */
    whereNotNull(column, boolean = 'and') {
        return this.whereNull(column, boolean, true);
    }

    /**
     * Get the collected bindings.
     * @returns {Array}
     */
    getBindings() {
        return this.bindings;
    }

    /**
     * Compile all ON/WHERE clauses into SQL.
     * @returns {string}
     */
    compile() {
        return this.clauses.map((clause, index) => {
            const prefix = index === 0 ? '' : ` ${clause.boolean.toUpperCase()} `;

            if (clause.type === 'on') {
                return `${prefix}${clause.first} ${clause.operator} ${clause.second}`;
            } else if (clause.type === 'where') {
                return `${prefix}${clause.column} ${clause.operator} ?`;
            } else if (clause.type === 'null') {
                return `${prefix}${clause.column} ${clause.operator}`;
            }
        }).join('');
    }
}

module.exports = JoinClause;
