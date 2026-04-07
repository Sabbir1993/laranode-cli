const JoinClause = require('./JoinClause');

class Builder {
    constructor(connection, table) {
        this.connection = connection;
        this.fromTable = table;

        this.components = {
            selects: [],
            wheres: [],
            joins: [],
            groups: [],
            havings: [],
            orders: [],
            limit: null,
            offset: null,
            distinct: false
        };

        this.bindings = {
            select: [],
            join: [],
            where: [],
            having: [],
            order: []
        };
    }

    // ─── Selection ────────────────────────────────────────

    select(...columns) {
        this.components.selects = columns.length ? columns : ['*'];
        return this;
    }

    selectRaw(expression, bindings = []) {
        this.components.selects.push(expression);
        this.bindings.select.push(...bindings);
        return this;
    }

    distinct() {
        this.components.distinct = true;
        return this;
    }

    // ─── Where Clauses ────────────────────────────────────

    where(column, operator = null, value = null, boolean = 'and') {
        if (value === null) {
            value = operator;
            operator = '=';
        }

        this.components.wheres.push({ type: 'Basic', column, operator, boolean });
        this.bindings.where.push(value);
        return this;
    }

    orWhere(column, operator = null, value = null) {
        return this.where(column, operator, value, 'or');
    }

    whereIn(column, values, boolean = 'and', not = false) {
        this.components.wheres.push({ type: 'In', column, values, boolean, not });
        this.bindings.where.push(...values);
        return this;
    }

    whereNotIn(column, values, boolean = 'and') {
        return this.whereIn(column, values, boolean, true);
    }

    whereNull(column, boolean = 'and', not = false) {
        this.components.wheres.push({ type: 'Null', column, boolean, not });
        return this;
    }

    whereNotNull(column, boolean = 'and') {
        return this.whereNull(column, boolean, true);
    }

    whereBetween(column, range, boolean = 'and', not = false) {
        this.components.wheres.push({ type: 'Between', column, boolean, not });
        this.bindings.where.push(range[0], range[1]);
        return this;
    }

    whereNotBetween(column, range, boolean = 'and') {
        return this.whereBetween(column, range, boolean, true);
    }

    whereDate(column, operator, value = null, boolean = 'and') {
        if (value === null) { value = operator; operator = '='; }
        this.components.wheres.push({ type: 'Date', dateType: 'date', column, operator, boolean });
        this.bindings.where.push(value);
        return this;
    }

    whereMonth(column, operator, value = null, boolean = 'and') {
        if (value === null) { value = operator; operator = '='; }
        this.components.wheres.push({ type: 'Date', dateType: 'month', column, operator, boolean });
        this.bindings.where.push(value);
        return this;
    }

    whereYear(column, operator, value = null, boolean = 'and') {
        if (value === null) { value = operator; operator = '='; }
        this.components.wheres.push({ type: 'Date', dateType: 'year', column, operator, boolean });
        this.bindings.where.push(value);
        return this;
    }

    whereDay(column, operator, value = null, boolean = 'and') {
        if (value === null) { value = operator; operator = '='; }
        this.components.wheres.push({ type: 'Date', dateType: 'day', column, operator, boolean });
        this.bindings.where.push(value);
        return this;
    }

    whereColumn(first, operator, second = null, boolean = 'and') {
        if (second === null) { second = operator; operator = '='; }
        this.components.wheres.push({ type: 'Column', first, operator, second, boolean });
        return this;
    }

    whereRaw(sql, bindings = [], boolean = 'and') {
        this.components.wheres.push({ type: 'Raw', sql, boolean });
        this.bindings.where.push(...bindings);
        return this;
    }

    orWhereRaw(sql, bindings = []) {
        return this.whereRaw(sql, bindings, 'or');
    }

    whereExists(callback, boolean = 'and', not = false) {
        const subQuery = new Builder(this.connection, '');
        callback(subQuery);
        const sql = subQuery.toSql();
        const subBindings = subQuery.getBindings();
        this.components.wheres.push({ type: 'Exists', sql, boolean, not });
        this.bindings.where.push(...subBindings);
        return this;
    }

    // ─── Joins ────────────────────────────────────────────

    join(table, first, operator = null, second = null, type = 'inner') {
        if (typeof first === 'function') {
            const joinClause = new JoinClause();
            first(joinClause);
            this.components.joins.push({ table, joinClause, type });
            // Merge any value-based bindings from the JoinClause
            this.bindings.join.push(...joinClause.getBindings());
        } else {
            this.components.joins.push({ table, first, operator, second, type });
        }
        return this;
    }

    leftJoin(table, first, operator = null, second = null) {
        return this.join(table, first, operator, second, 'left');
    }

    rightJoin(table, first, operator = null, second = null) {
        return this.join(table, first, operator, second, 'right');
    }

    crossJoin(table) {
        this.components.joins.push({ table, type: 'cross' });
        return this;
    }

    joinSub(query, alias, first, operator = null, second = null, type = 'inner') {
        // If query is a closure, execute it to get a Builder
        if (typeof query === 'function') {
            const subQuery = new Builder(this.connection, '');
            query(subQuery);
            query = subQuery;
        }

        // Compile the subquery and merge its bindings
        const subSql = query.toSql();
        this.bindings.join.push(...query.getBindings());

        // Wrap as (SELECT ...) as alias
        const table = `(${subSql}) as ${alias}`;
        return this.join(table, first, operator, second, type);
    }

    leftJoinSub(query, alias, first, operator = null, second = null) {
        return this.joinSub(query, alias, first, operator, second, 'left');
    }

    rightJoinSub(query, alias, first, operator = null, second = null) {
        return this.joinSub(query, alias, first, operator, second, 'right');
    }

    // ─── Grouping ─────────────────────────────────────────

    groupBy(...groups) {
        this.components.groups = groups;
        return this;
    }

    groupByRaw(sql) {
        this.components.groups = [{ raw: sql }];
        return this;
    }

    having(column, operator = null, value = null, boolean = 'and') {
        if (value === null) {
            value = operator;
            operator = '=';
        }
        this.components.havings.push({ column, operator, boolean });
        this.bindings.having.push(value);
        return this;
    }

    // ─── Ordering ─────────────────────────────────────────

    orderBy(column, direction = 'asc') {
        this.components.orders.push({ column, direction });
        return this;
    }

    orderByRaw(sql) {
        this.components.orders.push({ raw: sql });
        return this;
    }

    latest(column = 'created_at') {
        return this.orderBy(column, 'desc');
    }

    oldest(column = 'created_at') {
        return this.orderBy(column, 'asc');
    }

    inRandomOrder() {
        // Works for both MySQL and SQLite
        this.components.orders.push({ raw: 'RAND()' });
        return this;
    }

    // ─── Limit & Offset ──────────────────────────────────

    limit(value) {
        this.components.limit = value;
        return this;
    }

    offset(value) {
        this.components.offset = value;
        return this;
    }

    // ─── Conditional ──────────────────────────────────────

    when(condition, callback, elseCallback = null) {
        if (condition) {
            callback(this, condition);
        } else if (elseCallback) {
            elseCallback(this, condition);
        }
        return this;
    }

    // ─── SQL Compilation ──────────────────────────────────

    toSql() {
        let sql = this.compileSelect();
        return sql;
    }

    compileSelect() {
        const components = [
            this.compileColumns(),
            this.compileFrom(),
            this.compileJoins(),
            this.compileWheres(),
            this.compileGroups(),
            this.compileHavings(),
            this.compileOrders(),
            this.compileLimit(),
            this.compileOffset()
        ];

        return components.filter(c => c).join(' ');
    }

    compileColumns() {
        const distinct = this.components.distinct ? 'DISTINCT ' : '';
        const select = this.components.selects.length ? this.components.selects.join(', ') : '*';
        return `SELECT ${distinct}${select}`;
    }

    compileFrom() {
        return this.fromTable ? `FROM ${this.fromTable}` : '';
    }

    compileJoins() {
        if (!this.components.joins.length) return '';

        return this.components.joins.map(join => {
            if (join.type === 'cross') {
                return `CROSS JOIN ${join.table}`;
            }
            const onClause = join.joinClause
                ? join.joinClause.compile()
                : `${join.first} ${join.operator} ${join.second}`;
            return `${join.type.toUpperCase()} JOIN ${join.table} ON ${onClause}`;
        }).join(' ');
    }

    compileWheres() {
        if (!this.components.wheres.length) return '';

        const wheres = this.components.wheres.map((where, i) => {
            const leading = i === 0 ? 'WHERE' : where.boolean.toUpperCase();

            if (where.type === 'Basic') {
                return `${leading} ${where.column} ${where.operator} ?`;
            } else if (where.type === 'In') {
                const placeholders = Array(where.values.length).fill('?').join(', ');
                const operator = where.not ? 'NOT IN' : 'IN';
                return `${leading} ${where.column} ${operator} (${placeholders})`;
            } else if (where.type === 'Null') {
                const operator = where.not ? 'IS NOT NULL' : 'IS NULL';
                return `${leading} ${where.column} ${operator}`;
            } else if (where.type === 'Between') {
                const operator = where.not ? 'NOT BETWEEN' : 'BETWEEN';
                return `${leading} ${where.column} ${operator} ? AND ?`;
            } else if (where.type === 'Date') {
                const fn = {
                    date: 'DATE',
                    month: 'MONTH',
                    year: 'YEAR',
                    day: 'DAY'
                }[where.dateType];
                return `${leading} ${fn}(${where.column}) ${where.operator} ?`;
            } else if (where.type === 'Column') {
                return `${leading} ${where.first} ${where.operator} ${where.second}`;
            } else if (where.type === 'Raw') {
                return `${leading} ${where.sql}`;
            } else if (where.type === 'Exists') {
                const keyword = where.not ? 'NOT EXISTS' : 'EXISTS';
                return `${leading} ${keyword} (${where.sql})`;
            }
        });

        return wheres.join(' ');
    }

    compileGroups() {
        if (!this.components.groups.length) return '';
        const groups = this.components.groups.map(g => g.raw ? g.raw : g);
        return `GROUP BY ${groups.join(', ')}`;
    }

    compileHavings() {
        if (!this.components.havings.length) return '';

        const havings = this.components.havings.map((having, i) => {
            const leading = i === 0 ? 'HAVING' : having.boolean.toUpperCase();
            return `${leading} ${having.column} ${having.operator} ?`;
        });

        return havings.join(' ');
    }

    compileOrders() {
        if (!this.components.orders.length) return '';
        const orders = this.components.orders.map(order => {
            if (order.raw) return order.raw;
            return `${order.column} ${order.direction.toUpperCase()}`;
        });
        return `ORDER BY ${orders.join(', ')}`;
    }

    compileLimit() {
        return this.components.limit !== null ? `LIMIT ${this.components.limit}` : '';
    }

    compileOffset() {
        return this.components.offset !== null ? `OFFSET ${this.components.offset}` : '';
    }

    // ─── Model Support ────────────────────────────────────

    setModel(model) {
        this.model = model;
        return this;
    }

    getBindings() {
        return [
            ...this.bindings.select,
            ...this.bindings.join,
            ...this.bindings.where,
            ...this.bindings.having,
            ...this.bindings.order
        ];
    }

    // ─── Execution — Read ─────────────────────────────────

    async get() {
        const sql = this.toSql();
        const results = await this.connection.query(sql, this.getBindings());

        let models = results;

        if (this.model) {
            models = results.map(attr => {
                const instance = this.model.createInstance(attr);
                instance.exists = true;
                return instance;
            });

            // Handle eager loading
            if (this.eagerLoad && this.eagerLoad.length > 0) {
                await this.eagerLoadRelations(models);
            }
        }

        return models;
    }

    with(...relations) {
        if (!this.eagerLoad) this.eagerLoad = [];
        // Support .with('relation', constraintCallback) signature
        if (relations.length === 2 && typeof relations[0] === 'string' && typeof relations[1] === 'function') {
            this.eagerLoad.push({ name: relations[0], callback: relations[1] });
            return this;
        }
        this.eagerLoad.push(...relations);
        return this;
    }

    async eagerLoadRelations(models) {
        if (models.length === 0) return;

        for (const relation of this.eagerLoad) {
            // Support both plain string and { name, callback } object forms
            let name     = typeof relation === 'object' && relation !== null ? relation.name : relation;
            let callback = typeof relation === 'object' && relation !== null ? (relation.callback || null) : null;
            let nested   = null;
            let columns  = null;

            if (typeof name !== 'string') continue; // skip malformed entries

            // Support 'relation.nested' syntax
            if (name.includes('.')) {
                const parts = name.split('.');
                name = parts[0];
                nested = parts.slice(1).join('.');
            }

            // Support 'relation:col1,col2' syntax
            if (name.includes(':')) {
                const parts = name.split(':');
                name = parts[0];
                columns = parts[1].split(',');
            }

            // Instantiate a dummy model to access the relation method
            const dummy = new this.model();
            if (typeof dummy[name] !== 'function') continue;

            for (const model of models) {
                // Re-bind the local key / foreign key using the actual model instance
                const specificBuilder = model[name]();

                // Apply column selection if specified
                if (columns && specificBuilder && typeof specificBuilder.select === 'function') {
                    specificBuilder.select(...columns);
                }

                // Apply constraint callback e.g. .with('tickets', q => q.where('is_active', 1))
                if (callback && specificBuilder) {
                    callback(specificBuilder);
                }

                // Add nested relations to be loaded by the child query
                if (nested && specificBuilder && typeof specificBuilder.with === 'function') {
                    specificBuilder.with(nested);
                }

                if (specificBuilder && typeof specificBuilder.getResults === 'function') {
                    model.relations[name] = await specificBuilder.getResults();
                } else if (specificBuilder && typeof specificBuilder.get === 'function') {
                    model.relations[name] = await specificBuilder.get();
                }
            }
        }
    }

    async first() {
        this.limit(1);
        const results = await this.get();
        return results.length ? results[0] : null;
    }

    async firstOrFail() {
        const result = await this.first();
        if (!result) {
            const ModelNotFoundException = use('laranode/Database/Exceptions/ModelNotFoundException');
            throw new ModelNotFoundException(`No query results for table [${this.fromTable}]`);
        }
        return result;
    }

    async value(column) {
        const row = await this.select(column).first();
        return row ? (row.attributes ? row.attributes[column] : row[column]) : null;
    }

    async pluck(column, key = null) {
        const results = await this.select(...(key ? [column, key] : [column])).get();

        if (key) {
            const map = {};
            for (const row of results) {
                const r = row.attributes || row;
                map[r[key]] = r[column];
            }
            return map;
        }

        return results.map(row => {
            const r = row.attributes || row;
            return r[column];
        });
    }

    // ─── Execution — Aggregates ───────────────────────────

    async count(column = '*') {
        // Save current selects
        const originalSelects = [...this.components.selects];
        this.components.selects = [`COUNT(${column}) as aggregate`];
        const sql = this.compileSelect();
        const results = await this.connection.query(sql, this.getBindings());

        // Restore selects
        this.components.selects = originalSelects;
        return results.length ? results[0].aggregate : 0;
    }

    async max(column) {
        const originalSelects = [...this.components.selects];
        this.components.selects = [`MAX(${column}) as aggregate`];
        const sql = this.compileSelect();
        const results = await this.connection.query(sql, this.getBindings());
        this.components.selects = originalSelects;
        return results.length ? results[0].aggregate : null;
    }

    async min(column) {
        const originalSelects = [...this.components.selects];
        this.components.selects = [`MIN(${column}) as aggregate`];
        const sql = this.compileSelect();
        const results = await this.connection.query(sql, this.getBindings());
        this.components.selects = originalSelects;
        return results.length ? results[0].aggregate : null;
    }

    async avg(column) {
        const originalSelects = [...this.components.selects];
        this.components.selects = [`AVG(${column}) as aggregate`];
        const sql = this.compileSelect();
        const results = await this.connection.query(sql, this.getBindings());
        this.components.selects = originalSelects;
        return results.length ? results[0].aggregate : null;
    }

    async sum(column) {
        const originalSelects = [...this.components.selects];
        this.components.selects = [`SUM(${column}) as aggregate`];
        const sql = this.compileSelect();
        const results = await this.connection.query(sql, this.getBindings());
        this.components.selects = originalSelects;
        return results.length ? (results[0].aggregate || 0) : 0;
    }

    async exists() {
        const results = await this.limit(1).get();
        return results.length > 0;
    }

    async doesntExist() {
        return !(await this.exists());
    }

    // ─── Execution — Pagination ───────────────────────────

    /**
     * Paginate the query results.
     * Searches for 'page' parameter in query/body/params automatically if currentPage is not a number.
     */
    async paginate(perPage = 15, currentPage = null, options = {}) {
        // 1. If currentPage is missing or a Request object, detect from it
        if (currentPage === null || (typeof currentPage === 'object' && currentPage !== null)) {
            let request = currentPage;
            
            // If no request passed, try to detect from HttpContext
            if (!request) {
                try {
                    const HttpContext = use('laranode/Foundation/Http/HttpContext');
                    request = HttpContext.getRequest();
                } catch (e) { /* Framework not fully bootstrapped or running in script */ }
            }

            // Extract page from request (searches query, body, and params automatically)
            if (request && typeof request.input === 'function') {
                const reqPage = parseInt(request.input('page'));
                currentPage = (!isNaN(reqPage) && reqPage > 0) ? reqPage : 1;
            } else {
                currentPage = 1;
            }
        }

        const total = await this.count();
        const offset = (currentPage - 1) * perPage;

        this.limit(perPage).offset(offset);
        const results = await this.get();

        const LengthAwarePaginator = use('laranode/Database/Pagination/LengthAwarePaginator');
        return new LengthAwarePaginator(results, total, perPage, currentPage, options);
    }

    async simplePaginate(perPage = 15, currentPage = 1, options = {}) {
        const offset = (currentPage - 1) * perPage;

        // Fetch perPage + 1 to know if there are more
        this.limit(perPage + 1).offset(offset);
        const results = await this.get();

        const hasMore = results.length > perPage;
        const items = results.slice(0, perPage);

        const SimplePaginator = use('laranode/Database/Pagination/SimplePaginator');
        return new SimplePaginator(items, perPage, currentPage, hasMore, options);
    }

    async chunk(count, callback) {
        let page = 1;
        let results;

        do {
            // Clone builder to avoid messing up offset
            const offset = (page - 1) * count;

            // Re-apply limits safely for just this pull
            const originalLimit = this.components.limit;
            const originalOffset = this.components.offset;

            this.limit(count).offset(offset);
            results = await this.get();

            this.components.limit = originalLimit;
            this.components.offset = originalOffset;

            if (results.length === 0) {
                break;
            }

            // Await if the callback is async, otherwise just handle. Allows returning false to break chunking
            const returnVal = await callback(results, page);
            if (returnVal === false) {
                break;
            }

            page++;
        } while (results.length === count);

        return true;
    }

    // ─── Execution — Insert ───────────────────────────────

    async insert(values) {
        if (!Array.isArray(values)) {
            values = [values];
        }

        if (values.length === 0) return true;

        const columns = Object.keys(values[0]);
        const placeholders = `(${Array(columns.length).fill('?').join(', ')})`;
        const sql = `INSERT INTO ${this.fromTable} (${columns.join(', ')}) VALUES ${Array(values.length).fill(placeholders).join(', ')}`;

        const bindings = [];
        for (const row of values) {
            for (const col of columns) {
                // Fix: convert undefined to null for MySQL bindings to prevent crash
                bindings.push(row[col] === undefined ? null : row[col]);
            }
        }

        return await this.connection.query(sql, bindings);
    }

    async insertGetId(values) {
        const info = await this.insert(values);
        // SQLite better-sqlite3 returns info object
        return info.lastInsertRowid;
    }

    async insertOrIgnore(values) {
        if (!Array.isArray(values)) {
            values = [values];
        }
        if (values.length === 0) return 0;

        const columns = Object.keys(values[0]);
        const placeholders = `(${Array(columns.length).fill('?').join(', ')})`;
        const sql = `INSERT IGNORE INTO ${this.fromTable} (${columns.join(', ')}) VALUES ${Array(values.length).fill(placeholders).join(', ')}`;

        const bindings = [];
        for (const row of values) {
            for (const col of columns) {
                bindings.push(row[col] === undefined ? null : row[col]);
            }
        }

        const result = await this.connection.query(sql, bindings);
        return result.changes || 0;
    }

    async upsert(values, uniqueBy, update = null) {
        if (!Array.isArray(values)) {
            values = [values];
        }
        if (values.length === 0) return 0;

        const columns = Object.keys(values[0]);
        if (!update) {
            update = columns.filter(c => !uniqueBy.includes(c));
        }

        const placeholders = `(${Array(columns.length).fill('?').join(', ')})`;
        const valuesClause = Array(values.length).fill(placeholders).join(', ');
        const updateClause = update.map(c => `${c} = VALUES(${c})`).join(', ');

        const sql = `INSERT INTO ${this.fromTable} (${columns.join(', ')}) VALUES ${valuesClause} ON DUPLICATE KEY UPDATE ${updateClause}`;

        const bindings = [];
        for (const row of values) {
            for (const col of columns) {
                bindings.push(row[col] === undefined ? null : row[col]);
            }
        }

        const result = await this.connection.query(sql, bindings);
        return result.changes || 0;
    }

    // ─── Execution — Update ───────────────────────────────

    async update(values) {
        const columns = Object.keys(values);
        const setString = columns.map(c => `${c} = ?`).join(', ');

        const sql = `UPDATE ${this.fromTable} SET ${setString} ${this.compileWheres()}`.trim();

        const bindings = [];
        for (const col of columns) {
            bindings.push(values[col] === undefined ? null : values[col]);
        }
        bindings.push(...this.bindings.where);

        const info = await this.connection.query(sql, bindings);
        return info.changes; // Number of affected rows
    }

    async increment(column, amount = 1, extra = {}) {
        const sets = [`${column} = ${column} + ?`];
        const bindings = [amount];

        for (const [key, value] of Object.entries(extra)) {
            sets.push(`${key} = ?`);
            bindings.push(value);
        }

        const sql = `UPDATE ${this.fromTable} SET ${sets.join(', ')} ${this.compileWheres()}`.trim();
        bindings.push(...this.bindings.where);

        const info = await this.connection.query(sql, bindings);
        return info.changes;
    }

    async decrement(column, amount = 1, extra = {}) {
        return this.increment(column, -amount, extra);
    }

    // ─── Execution — Delete ───────────────────────────────

    async delete() {
        const sql = `DELETE FROM ${this.fromTable} ${this.compileWheres()}`.trim();
        const info = await this.connection.query(sql, this.bindings.where);
        return info.changes;
    }

    async truncate() {
        await this.connection.query(`TRUNCATE TABLE ${this.fromTable}`);
    }
}

module.exports = Builder;
