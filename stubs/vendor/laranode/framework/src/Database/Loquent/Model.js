class Model {
    constructor(attributes = {}) {
        this.attributes = { ...attributes };
        this.original = { ...attributes };
        this.changes = {};
        this.exists = false;
        this.relations = {};

        // Configuration
        this.table = this.constructor.table || this.constructor.name.toLowerCase() + 's';
        this.primaryKey = this.constructor.primaryKey || 'id';
        this.fillable = this.constructor.fillable || [];
        this.guarded = this.constructor.guarded || [];
        this.hidden = this.constructor.hidden || [];
        this.visible = this.constructor.visible || [];
        this.casts = this.constructor.casts || {};
        this.appends = this.constructor.appends || [];
        this.timestamps = this.constructor.timestamps !== undefined ? this.constructor.timestamps : true;

        // Boot the model class (once per class)
        if (!this.constructor._booted) {
            this.constructor._booted = true;
            this.constructor._eventListeners = {};
            this.constructor._globalScopes = {};
            if (typeof this.constructor.boot === 'function') {
                this.constructor.boot();
            }
            if (typeof this.constructor.booted === 'function') {
                this.constructor.booted();
            }
        }
    }

    /**
     * Serialize the model to a plain object for JSON responses.
     * Includes attributes and loaded relations, respects hidden/visible.
     */
    toJSON() {
        let attrs = { ...this.attributes };

        // Filter hidden fields
        if (this.hidden && this.hidden.length > 0) {
            for (const key of this.hidden) {
                delete attrs[key];
            }
        }

        // If visible is set, only include those fields
        if (this.visible && this.visible.length > 0) {
            const filtered = {};
            for (const key of this.visible) {
                if (attrs[key] !== undefined) filtered[key] = attrs[key];
            }
            attrs = filtered;
        }

        // Merge eager-loaded relations
        if (this.relations) {
            for (const [key, value] of Object.entries(this.relations)) {
                attrs[key] = value;
            }
        }

        return attrs;
    }

    // ─── Model Events ─────────────────────────────────────

    static on(event, callback) {
        if (!this._eventListeners) this._eventListeners = {};
        if (!this._eventListeners[event]) this._eventListeners[event] = [];
        this._eventListeners[event].push(callback);
    }

    static creating(callback) { this.on('creating', callback); }
    static created(callback) { this.on('created', callback); }
    static updating(callback) { this.on('updating', callback); }
    static updated(callback) { this.on('updated', callback); }
    static saving(callback) { this.on('saving', callback); }
    static saved(callback) { this.on('saved', callback); }
    static deleting(callback) { this.on('deleting', callback); }
    static deleted(callback) { this.on('deleted', callback); }

    async fireEvent(event) {
        const listeners = this.constructor._eventListeners && this.constructor._eventListeners[event];
        if (!listeners) return true;
        for (const listener of listeners) {
            const result = await listener(this);
            if (result === false) return false; // Cancel operation
        }
        return true;
    }

    // ─── Observer Support ─────────────────────────────────

    static observe(observer) {
        const events = ['creating', 'created', 'updating', 'updated', 'saving', 'saved', 'deleting', 'deleted'];
        const instance = typeof observer === 'function' ? new observer() : observer;
        for (const event of events) {
            if (typeof instance[event] === 'function') {
                this.on(event, (model) => instance[event](model));
            }
        }
    }

    // ─── Global Scopes ────────────────────────────────────

    static addGlobalScope(name, callback) {
        if (!this._globalScopes) this._globalScopes = {};
        this._globalScopes[name] = callback;
    }

    static withoutGlobalScope(name) {
        const builder = this._rawQuery();
        // Apply all scopes except the named one
        if (this._globalScopes) {
            for (const [scopeName, scope] of Object.entries(this._globalScopes)) {
                if (scopeName !== name) scope(builder);
            }
        }
        return builder;
    }

    static _rawQuery() {
        const DB = require('../../Support/Facades/DB');
        return DB.table(this.table || this.name.toLowerCase() + 's').setModel(this);
    }

    // ─── Query Builder ────────────────────────────────────

    static query() {
        const builder = this._rawQuery();

        // Apply global scopes
        if (this._globalScopes) {
            for (const scope of Object.values(this._globalScopes)) {
                scope(builder);
            }
        }

        // Proxy for local scopes: scopeActive(query) → .active()
        return new Proxy(builder, {
            get(target, prop) {
                if (prop in target) return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
                // Check for local scope
                const scopeName = 'scope' + prop.charAt(0).toUpperCase() + prop.slice(1);
                const ModelClass = target.model;
                if (ModelClass && ModelClass.prototype && typeof ModelClass.prototype[scopeName] === 'function') {
                    return (...args) => {
                        ModelClass.prototype[scopeName](target, ...args);
                        return target;
                    };
                }
                return target[prop];
            }
        });
    }

    // ─── Accessors & Mutators ─────────────────────────────

    getAttribute(key) {
        // Accessors: getFirstNameAttribute()
        const accessorName = 'get' + key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Attribute';
        if (typeof this[accessorName] === 'function') {
            return this[accessorName](this.attributes[key] || null);
        }

        if (this.relations[key] !== undefined) {
            return this.relations[key];
        }

        // Apply casts
        const value = this.attributes[key];
        if (this.casts[key] && value !== undefined && value !== null) {
            return this.castAttribute(key, value);
        }

        return value;
    }

    setAttribute(key, value) {
        // Mutators: setPasswordAttribute()
        const mutatorName = 'set' + key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Attribute';
        if (typeof this[mutatorName] === 'function') {
            this[mutatorName](value);
        } else {
            // Cast on set
            if (this.casts[key] && value !== undefined && value !== null) {
                value = this.castAttributeForSet(key, value);
            }
            this.attributes[key] = value;
        }
        return this;
    }

    // ─── Casting ──────────────────────────────────────────

    castAttribute(key, value) {
        const type = this.casts[key];
        switch (type) {
            case 'integer': case 'int': return parseInt(value, 10);
            case 'float': case 'double': case 'decimal': return parseFloat(value);
            case 'boolean': case 'bool': return !!value && value !== '0' && value !== 'false';
            case 'string': return String(value);
            case 'json': case 'array': case 'object':
                return typeof value === 'string' ? JSON.parse(value) : value;
            case 'date': case 'datetime':
                return value instanceof Date ? value : new Date(value);
            default: return value;
        }
    }

    castAttributeForSet(key, value) {
        const type = this.casts[key];
        switch (type) {
            case 'json': case 'array': case 'object':
                return typeof value === 'string' ? value : JSON.stringify(value);
            default: return value;
        }
    }

    // ─── Relationships ────────────────────────────────────

    hasOne(relatedClass, foreignKey = null, localKey = null) {
        foreignKey = foreignKey || this.constructor.name.toLowerCase() + '_id';
        localKey = localKey || this.primaryKey;

        const builder = relatedClass.query().where(foreignKey, this.attributes[localKey]);
        builder.getResults = () => builder.first();
        return builder;
    }

    hasMany(relatedClass, foreignKey = null, localKey = null) {
        foreignKey = foreignKey || this.constructor.name.toLowerCase() + '_id';
        localKey = localKey || this.primaryKey;

        const builder = relatedClass.query().where(foreignKey, this.attributes[localKey]);
        builder.getResults = () => builder.get();
        return builder;
    }

    belongsTo(relatedClass, foreignKey = null, ownerKey = null) {
        foreignKey = foreignKey || relatedClass.name.toLowerCase() + '_id';
        ownerKey = ownerKey || relatedClass.primaryKey || 'id';

        const builder = relatedClass.query().where(ownerKey, this.attributes[foreignKey]);
        builder.getResults = () => builder.first();
        return builder;
    }

    belongsToMany(relatedClass, pivotTable = null, foreignPivotKey = null, relatedPivotKey = null) {
        const thisName = this.constructor.name.toLowerCase();
        const relatedName = relatedClass.name.toLowerCase();

        pivotTable = pivotTable || [thisName, relatedName].sort().join('_');
        foreignPivotKey = foreignPivotKey || `${thisName}_id`;
        relatedPivotKey = relatedPivotKey || `${relatedName}_id`;

        const localId = this.attributes[this.primaryKey];
        const DB = require('../../Support/Facades/DB');

        const relation = {
            pivotTable,
            foreignPivotKey,
            relatedPivotKey,
            pivotColumns: [],
            withTimestampsFlag: false,

            withPivot(...columns) {
                this.pivotColumns.push(...columns);
                return this;
            },

            withTimestamps() {
                this.withTimestampsFlag = true;
                return this;
            },

            async getResults() {
                const pivotRows = await DB.table(pivotTable).where(foreignPivotKey, localId).get();
                const relatedIds = pivotRows.map(r => r[relatedPivotKey]);
                if (relatedIds.length === 0) return [];
                return relatedClass.query().whereIn(relatedClass.primaryKey || 'id', relatedIds).get();
            },

            async attach(ids, attributes = {}) {
                if (!Array.isArray(ids)) ids = [ids];
                const now = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
                const records = ids.map(id => {
                    const record = { [foreignPivotKey]: localId, [relatedPivotKey]: id, ...attributes };
                    if (this.withTimestampsFlag) {
                        record.created_at = now;
                        record.updated_at = now;
                    }
                    return record;
                });
                await DB.table(pivotTable).insert(records);
            },

            async detach(ids = null) {
                let query = DB.table(pivotTable).where(foreignPivotKey, localId);
                if (ids !== null) {
                    if (!Array.isArray(ids)) ids = [ids];
                    query = query.whereIn(relatedPivotKey, ids);
                }
                return query.delete();
            },

            async sync(ids) {
                if (!Array.isArray(ids)) ids = Object.keys(ids).map(Number);
                await this.detach();
                if (ids.length > 0) {
                    await this.attach(ids);
                }
            },

            async toggle(ids) {
                if (!Array.isArray(ids)) ids = [ids];
                const existing = await DB.table(pivotTable).where(foreignPivotKey, localId).get();
                const existingIds = existing.map(r => r[relatedPivotKey]);

                const toAttach = ids.filter(id => !existingIds.includes(id));
                const toDetach = ids.filter(id => existingIds.includes(id));

                if (toDetach.length > 0) await this.detach(toDetach);
                if (toAttach.length > 0) await this.attach(toAttach);

                return { attached: toAttach, detached: toDetach };
            }
        };

        return relation;
    }

    // ─── Through Relationships ────────────────────────────

    hasOneThrough(relatedClass, throughClass, firstKey = null, secondKey = null, localKey = null, secondLocalKey = null) {
        const thisName = this.constructor.name.toLowerCase();
        const throughName = throughClass.name.toLowerCase();

        firstKey = firstKey || `${thisName}_id`;
        secondKey = secondKey || `${throughName}_id`;
        localKey = localKey || this.primaryKey;
        secondLocalKey = secondLocalKey || 'id';

        const localId = this.attributes[localKey];
        const DB = require('../../Support/Facades/DB');
        const throughTable = throughClass.table || throughName + 's';
        const relatedTable = relatedClass.table || relatedClass.name.toLowerCase() + 's';

        const builder = DB.table(relatedTable)
            .join(throughTable, `${relatedTable}.${secondKey}`, '=', `${throughTable}.${secondLocalKey}`)
            .where(`${throughTable}.${firstKey}`, localId)
            .setModel(relatedClass);

        builder.getResults = () => builder.first();
        return builder;
    }

    hasManyThrough(relatedClass, throughClass, firstKey = null, secondKey = null, localKey = null, secondLocalKey = null) {
        const thisName = this.constructor.name.toLowerCase();
        const throughName = throughClass.name.toLowerCase();

        firstKey = firstKey || `${thisName}_id`;
        secondKey = secondKey || `${throughName}_id`;
        localKey = localKey || this.primaryKey;
        secondLocalKey = secondLocalKey || 'id';

        const localId = this.attributes[localKey];
        const DB = require('../../Support/Facades/DB');
        const throughTable = throughClass.table || throughName + 's';
        const relatedTable = relatedClass.table || relatedClass.name.toLowerCase() + 's';

        const builder = DB.table(relatedTable)
            .join(throughTable, `${relatedTable}.${secondKey}`, '=', `${throughTable}.${secondLocalKey}`)
            .where(`${throughTable}.${firstKey}`, localId)
            .setModel(relatedClass);

        builder.getResults = () => builder.get();
        return builder;
    }

    // ─── Polymorphic Relationships ────────────────────────

    morphOne(relatedClass, name, typeColumn = null, idColumn = null, localKey = null) {
        typeColumn = typeColumn || `${name}_type`;
        idColumn = idColumn || `${name}_id`;
        localKey = localKey || this.primaryKey;

        const builder = relatedClass.query()
            .where(typeColumn, this.constructor.name)
            .where(idColumn, this.attributes[localKey]);

        builder.getResults = () => builder.first();
        return builder;
    }

    morphMany(relatedClass, name, typeColumn = null, idColumn = null, localKey = null) {
        typeColumn = typeColumn || `${name}_type`;
        idColumn = idColumn || `${name}_id`;
        localKey = localKey || this.primaryKey;

        const builder = relatedClass.query()
            .where(typeColumn, this.constructor.name)
            .where(idColumn, this.attributes[localKey]);

        builder.getResults = () => builder.get();
        return builder;
    }

    morphTo(name = null, typeColumn = null, idColumn = null) {
        // Infer from calling method name if not provided
        name = name || 'commentable'; // fallback
        typeColumn = typeColumn || `${name}_type`;
        idColumn = idColumn || `${name}_id`;

        const morphType = this.attributes[typeColumn];
        const morphId = this.attributes[idColumn];

        // morphType should be a model class name — resolve it
        const relation = {
            async getResults() {
                if (!morphType || !morphId) return null;
                // Try to resolve the morph class via use()
                try {
                    const MorphClass = use(morphType);
                    return MorphClass.find(morphId);
                } catch (e) {
                    return null;
                }
            }
        };

        return relation;
    }

    morphToMany(relatedClass, name, pivotTable = null, foreignPivotKey = null, relatedPivotKey = null) {
        pivotTable = pivotTable || `${name}s`; // e.g., 'taggables'
        foreignPivotKey = foreignPivotKey || `${name}_id`;
        relatedPivotKey = relatedPivotKey || `${relatedClass.name.toLowerCase()}_id`;

        const localId = this.attributes[this.primaryKey];
        const morphType = this.constructor.name;
        const DB = require('../../Support/Facades/DB');

        const relation = {
            async getResults() {
                const pivotRows = await DB.table(pivotTable)
                    .where(foreignPivotKey, localId)
                    .where(`${name}_type`, morphType)
                    .get();
                const relatedIds = pivotRows.map(r => r[relatedPivotKey]);
                if (relatedIds.length === 0) return [];
                return relatedClass.query().whereIn(relatedClass.primaryKey || 'id', relatedIds).get();
            },

            async attach(ids, attributes = {}) {
                if (!Array.isArray(ids)) ids = [ids];
                const records = ids.map(id => ({
                    [foreignPivotKey]: localId,
                    [`${name}_type`]: morphType,
                    [relatedPivotKey]: id,
                    ...attributes
                }));
                await DB.table(pivotTable).insert(records);
            },

            async detach(ids = null) {
                let query = DB.table(pivotTable)
                    .where(foreignPivotKey, localId)
                    .where(`${name}_type`, morphType);
                if (ids !== null) {
                    if (!Array.isArray(ids)) ids = [ids];
                    query = query.whereIn(relatedPivotKey, ids);
                }
                return query.delete();
            },

            async sync(ids) {
                if (!Array.isArray(ids)) ids = Object.keys(ids).map(Number);
                await this.detach();
                if (ids.length > 0) await this.attach(ids);
            }
        };

        return relation;
    }

    morphedByMany(relatedClass, name, pivotTable = null, foreignPivotKey = null, relatedPivotKey = null) {
        // Inverse of morphToMany
        pivotTable = pivotTable || `${name}s`;
        relatedPivotKey = relatedPivotKey || `${name}_id`;
        foreignPivotKey = foreignPivotKey || `${relatedClass.name.toLowerCase()}_id`;

        const localId = this.attributes[this.primaryKey];
        const morphType = relatedClass.name;
        const DB = require('../../Support/Facades/DB');

        const relation = {
            async getResults() {
                const pivotRows = await DB.table(pivotTable)
                    .where(foreignPivotKey, localId)
                    .where(`${name}_type`, morphType)
                    .get();
                const relatedIds = pivotRows.map(r => r[relatedPivotKey]);
                if (relatedIds.length === 0) return [];
                return relatedClass.query().whereIn(relatedClass.primaryKey || 'id', relatedIds).get();
            }
        };

        return relation;
    }

    // ─── Relationship Querying ────────────────────────────

    static has(relation, operator = '>=', count = 1) {
        return this.whereHas(relation, null, operator, count);
    }

    static doesntHave(relation) {
        return this.has(relation, '<', 1);
    }

    static whereHas(relation, callback = null, operator = '>=', count = 1) {
        // Create a dummy instance to access the relation method
        const dummy = new this();
        if (typeof dummy[relation] !== 'function') {
            throw new Error(`Relation [${relation}] does not exist on model [${this.name}]`);
        }

        const rel = dummy[relation]();
        const DB = require('../../Support/Facades/DB');
        const table = this.table || this.name.toLowerCase() + 's';
        const pk = this.primaryKey || 'id';

        // Build a subquery-based where
        const builder = this._rawQuery();

        // Determine the foreign key from the relationship
        // For hasMany/hasOne: foreignKey on related table
        const foreignKey = rel.components ?
            rel.components.wheres.find(w => w.type === 'Basic')?.column : null;

        if (foreignKey && rel.fromTable) {
            let subSql = `SELECT COUNT(*) FROM ${rel.fromTable} WHERE ${foreignKey} = ${table}.${pk}`;

            if (callback) {
                const subBuilder = DB.table(rel.fromTable);
                callback(subBuilder);
                const subWheres = subBuilder.compileWheres();
                if (subWheres) {
                    subSql += ` AND ${subWheres.replace(/^WHERE /, '')}`;
                    builder.bindings.where.push(...subBuilder.bindings.where);
                }
            }

            builder.whereRaw(`(${subSql}) ${operator} ?`, [count]);
        }

        builder.setModel(this);
        return builder;
    }

    static whereDoesntHave(relation, callback = null) {
        return this.whereHas(relation, callback, '<', 1);
    }

    static withCount(...relations) {
        const builder = this.query();
        const table = this.table || this.name.toLowerCase() + 's';
        const pk = this.primaryKey || 'id';

        for (const relation of relations) {
            const dummy = new this();
            if (typeof dummy[relation] !== 'function') continue;

            const rel = dummy[relation]();
            const foreignKey = rel.components ?
                rel.components.wheres.find(w => w.type === 'Basic')?.column : null;

            if (foreignKey && rel.fromTable) {
                builder.selectRaw(
                    `(SELECT COUNT(*) FROM ${rel.fromTable} WHERE ${foreignKey} = ${table}.${pk}) as ${relation}_count`
                );
            }
        }

        // Also select all columns from the main table
        if (builder.components.selects.length > 0 && !builder.components.selects.includes('*')) {
            builder.components.selects.unshift(`${table}.*`);
        }

        return builder;
    }

    // ─── Proxy Instance ───────────────────────────────────

    static createInstance(attributes = {}) {
        const instance = new this(attributes);
        return new Proxy(instance, {
            get(target, prop) {
                // Priority 1: Check if relationship is already loaded
                if (target.relations && target.relations[prop] !== undefined) {
                    return target.relations[prop];
                }

                if (prop in target) {
                    const value = target[prop];
                    return typeof value === 'function' ? value.bind(target) : value;
                }
                return target.getAttribute(prop);
            },
            set(target, prop, value) {
                if (prop in target && typeof target[prop] !== 'function') {
                    target[prop] = value;
                } else {
                    target.setAttribute(prop, value);
                }
                return true;
            }
        });
    }

    // ─── Static Query Methods ─────────────────────────────

    static with(...relations) {
        const builder = this.query();
        const ModelClass = this;

        // Parse relations — support 'relation:col1,col2' syntax
        const parsedRelations = relations.map(r => {
            if (typeof r === 'string' && r.includes(':')) {
                const [name, cols] = r.split(':');
                return { name, columns: cols.split(',') };
            }
            return { name: r, columns: null };
        });

        // Override get() to eagerly load relations after fetching
        const originalGet = builder.get.bind(builder);
        builder.get = async function () {
            const rows = await originalGet();
            if (!rows || rows.length === 0) return rows;

            const models = rows.map(row => {
                if (row instanceof ModelClass) return row;
                const instance = ModelClass.createInstance(row);
                instance.exists = true;
                instance.original = { ...row };
                return instance;
            });

            for (const rel of parsedRelations) {
                await ModelClass._eagerLoadRelation(models, rel.name, rel.columns);
            }

            return models;
        };

        // Override first() to eagerly load relations on single result
        const originalFirst = builder.first.bind(builder);
        builder.first = async function () {
            const row = await originalFirst();
            if (!row) return row;

            const instance = (row instanceof ModelClass) ? row : ModelClass.createInstance(row);
            instance.exists = true;
            instance.original = { ...(row.attributes || row) };

            for (const rel of parsedRelations) {
                await ModelClass._eagerLoadRelation([instance], rel.name, rel.columns);
            }

            return instance;
        };

        return builder;
    }

    /**
     * Load a single relation onto an array of model instances.
     * Optionally select specific columns from the related model.
     * Supports dot notation for nested relations (e.g. 'items.product').
     */
    static async _eagerLoadRelation(models, relationName, columns = null) {
        if (!models || models.length === 0) return;

        if (relationName.includes('.')) {
            const parts = relationName.split('.');
            const currentRel = parts[0];
            const remainingRel = parts.slice(1).join('.');

            // First load the first level relation
            await this._eagerLoadRelation(models, currentRel);

            // Then recursively load for the nested levels
            for (const model of models) {
                const related = model.relations[currentRel];
                if (related) {
                    const relatedArray = Array.isArray(related) ? related : [related];
                    if (relatedArray.length > 0) {
                        const RelatedModelClass = relatedArray[0].constructor;
                        await RelatedModelClass._eagerLoadRelation(relatedArray, remainingRel, columns);
                    }
                }
            }
            return;
        }

        for (const model of models) {
            if (typeof model[relationName] === 'function') {
                const rel = model[relationName]();

                // Apply column selection if specified
                if (columns && rel && typeof rel.select === 'function') {
                    rel.select(...columns);
                }

                if (rel && typeof rel.getResults === 'function') {
                    model.relations[relationName] = await rel.getResults();
                } else if (rel && typeof rel.get === 'function') {
                    model.relations[relationName] = await rel.get();
                } else if (rel && typeof rel.first === 'function') {
                    model.relations[relationName] = await rel.first();
                }
            }
        }
    }

    static get() {
        return this.query().get();
    }

    static all() {
        return this.get();
    }

    static find(id) {
        return this.query().where(this.primaryKey || 'id', id).first();
    }

    static first() {
        return this.query().first();
    }

    static async findOrFail(id) {
        const model = await this.find(id);
        if (!model) {
            throw new Error(`ModelNotFoundException: No query results for model [${this.name}] ${id}`);
        }
        return model;
    }

    static async firstOrFail() {
        const model = await this.query().first();
        if (!model) {
            throw new Error(`ModelNotFoundException: No query results for model [${this.name}]`);
        }
        return model;
    }

    static async findMany(ids) {
        if (!ids || ids.length === 0) return [];
        return this.query().whereIn(this.primaryKey || 'id', ids).get();
    }

    static async firstOrCreate(search, values = {}) {
        let model = await this.query().where(Object.entries(search)[0][0], Object.entries(search)[0][1]);
        // Apply all search conditions
        for (const [key, value] of Object.entries(search).slice(1)) {
            model = model.where(key, value);
        }
        const found = await model.first();
        if (found) return found;

        return this.create({ ...search, ...values });
    }

    static async firstOrNew(search, values = {}) {
        let query = this.query();
        for (const [key, value] of Object.entries(search)) {
            query = query.where(key, value);
        }
        const found = await query.first();
        if (found) return found;

        return this.createInstance({ ...search, ...values });
    }

    static async updateOrCreate(search, values = {}) {
        let query = this.query();
        for (const [key, value] of Object.entries(search)) {
            query = query.where(key, value);
        }
        const found = await query.first();

        if (found) {
            found.fill(values);
            await found.save();
            return found;
        }

        return this.create({ ...search, ...values });
    }

    static where(column, operator = null, value = null) {
        return this.query().where(column, operator, value);
    }

    static async create(attributes) {
        const model = this.createInstance(attributes);
        await model.save();
        return model;
    }

    static async destroy(ids) {
        if (!Array.isArray(ids)) ids = [ids];
        if (ids.length === 0) return 0;
        return this.query().whereIn(this.primaryKey || 'id', ids).delete();
    }

    static latest(column = 'created_at') {
        return this.query().latest(column);
    }

    static oldest(column = 'created_at') {
        return this.query().oldest(column);
    }

    static select(...columns) {
        return this.query().select(...columns);
    }

    static orderBy(column, direction = 'asc') {
        return this.query().orderBy(column, direction);
    }

    static limit(value) {
        return this.query().limit(value);
    }

    static offset(value) {
        return this.query().offset(value);
    }

    static pluck(column, key = null) {
        return this.query().pluck(column, key);
    }

    // ─── Instance Methods — CRUD ──────────────────────────

    fill(attributes) {
        for (const key of Object.keys(attributes)) {
            if (this.isFillable(key)) {
                this.setAttribute(key, attributes[key]);
            }
        }
        return this;
    }

    isFillable(key) {
        // If fillable is defined, key must be in it
        if (this.fillable.length > 0) {
            return this.fillable.includes(key);
        }
        // If guarded has '*', nothing is fillable
        if (this.guarded.includes('*')) return false;
        // If guarded is defined, key must NOT be in it
        if (this.guarded.length > 0) {
            return !this.guarded.includes(key);
        }
        return true;
    }

    async save() {
        const now = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });

        // Fire saving event — can cancel
        if (await this.fireEvent('saving') === false) return false;

        if (this.timestamps) {
            this.attributes['updated_at'] = now;
            if (!this.exists) {
                this.attributes['created_at'] = now;
            }
        }

        const query = this.constructor._rawQuery();

        // Filter attributes to only include fillable/table columns for DB operations
        const saveAttributes = {};
        for (const key of Object.keys(this.attributes)) {
            // Include if it's in the fillable list, or it's a primary/timestamp column
            if (this.isFillable(key) || [this.primaryKey, 'created_at', 'updated_at', 'deleted_at'].includes(key)) {
                saveAttributes[key] = this.attributes[key];
            }
        }

        if (this.exists) {
            // Fire updating event — can cancel
            if (await this.fireEvent('updating') === false) return false;

            await query.where(this.primaryKey, this.attributes[this.primaryKey]).update(saveAttributes);

            this.changes = this.getDirty();
            this.original = { ...this.attributes };

            await this.fireEvent('updated');
        } else {
            // Fire creating event — can cancel
            if (await this.fireEvent('creating') === false) return false;

            const id = await query.insertGetId(saveAttributes);
            this.attributes[this.primaryKey] = id;
            this.exists = true;

            this.changes = this.getDirty();
            this.original = { ...this.attributes };

            await this.fireEvent('created');
        }

        await this.fireEvent('saved');

        return this;
    }

    async update(attributes) {
        this.fill(attributes);
        return this.save();
    }

    async delete() {
        if (!this.exists) {
            return false;
        }

        // Fire deleting event — can cancel
        if (await this.fireEvent('deleting') === false) return false;

        const result = await this.constructor._rawQuery().where(this.primaryKey, this.attributes[this.primaryKey]).delete();
        this.exists = false;

        await this.fireEvent('deleted');

        return result > 0;
    }

    async refresh() {
        const fresh = await this.constructor.find(this.attributes[this.primaryKey]);
        if (fresh) {
            this.attributes = { ...fresh.attributes };
            this.original = { ...fresh.attributes };
            this.relations = {};
        }
        return this;
    }

    async fresh() {
        return this.constructor.find(this.attributes[this.primaryKey]);
    }

    async increment(column, amount = 1, extra = {}) {
        this.attributes[column] = (this.attributes[column] || 0) + amount;
        for (const [key, value] of Object.entries(extra)) {
            this.attributes[key] = value;
        }
        if (this.exists) {
            await this.constructor.query()
                .where(this.primaryKey, this.attributes[this.primaryKey])
                .increment(column, amount, extra);
        }
        return this;
    }

    async decrement(column, amount = 1, extra = {}) {
        return this.increment(column, -amount, extra);
    }

    touch() {
        if (!this.timestamps) return this;
        const now = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
        this.attributes['updated_at'] = now;
        return this.save();
    }

    replicate(except = []) {
        const attrs = { ...this.attributes };
        delete attrs[this.primaryKey];
        delete attrs['created_at'];
        delete attrs['updated_at'];
        for (const key of except) {
            delete attrs[key];
        }
        return this.constructor.createInstance(attrs);
    }

    is(model) {
        return model &&
            model.constructor === this.constructor &&
            model.attributes[model.primaryKey] === this.attributes[this.primaryKey] &&
            this.exists;
    }

    isNot(model) {
        return !this.is(model);
    }

    // ─── Dirty Tracking ───────────────────────────────────

    getDirty() {
        const dirty = {};
        for (const [key, value] of Object.entries(this.attributes)) {
            if (this.original[key] !== value) {
                dirty[key] = value;
            }
        }
        return dirty;
    }

    isDirty(attr = null) {
        const dirty = this.getDirty();
        if (attr) {
            return attr in dirty;
        }
        return Object.keys(dirty).length > 0;
    }

    isClean(attr = null) {
        return !this.isDirty(attr);
    }

    wasChanged(attr = null) {
        if (attr) {
            return attr in this.changes;
        }
        return Object.keys(this.changes).length > 0;
    }

    getOriginal(attr = null) {
        if (attr) {
            return this.original[attr];
        }
        return { ...this.original };
    }

    // ─── Eager Loading ────────────────────────────────────

    /**
     * Eagerly load relations on this model instance (force reload).
     * Use this in controllers before passing the model to a view.
     *
     * @param {...string} relations - Relation names to load
     * @returns {Promise<this>}
     *
     * @example
     *   const user = await User.find(1);
     *   await user.load('posts', 'roles');
     *   return res.view('users.show', { user });
     */
    async load(...relations) {
        for (const relation of relations) {
            if (typeof this[relation] === 'function') {
                const rel = this[relation]();
                if (rel && typeof rel.getResults === 'function') {
                    this.relations[relation] = await rel.getResults();
                } else if (rel && typeof rel.get === 'function') {
                    this.relations[relation] = await rel.get();
                } else if (rel && typeof rel.first === 'function') {
                    this.relations[relation] = await rel.first();
                }
            }
        }
        return this;
    }

    /**
     * Load relations only if they haven't been loaded yet.
     *
     * @param {...string} relations - Relation names to load
     * @returns {Promise<this>}
     */
    async loadMissing(...relations) {
        for (const relation of relations) {
            if (this.relations[relation] === undefined && typeof this[relation] === 'function') {
                const rel = this[relation]();
                if (rel && typeof rel.getResults === 'function') {
                    this.relations[relation] = await rel.getResults();
                }
            }
        }
        return this;
    }

    // ─── Serialization ────────────────────────────────────

    toArray() {
        const result = {};
        for (const [key, value] of Object.entries(this.attributes)) {
            result[key] = this.getAttribute(key);
        }

        // Add appends
        for (const key of this.appends) {
            result[key] = this.getAttribute(key);
        }

        // Add relations
        for (const [key, relation] of Object.entries(this.relations)) {
            if (Array.isArray(relation)) {
                result[key] = relation.map(r => r.toArray ? r.toArray() : r);
            } else if (relation && relation.toArray) {
                result[key] = relation.toArray();
            } else {
                result[key] = relation;
            }
        }

        return result;
    }

    toJSON() {
        const json = this.toArray();

        // Apply visible/hidden
        if (this.visible.length > 0) {
            for (const key of Object.keys(json)) {
                if (!this.visible.includes(key) && !this.appends.includes(key)) {
                    delete json[key];
                }
            }
        } else {
            for (const hide of this.hidden) {
                delete json[hide];
            }
        }

        return json;
    }

    makeVisible(attrs) {
        if (!Array.isArray(attrs)) attrs = [attrs];
        this.hidden = this.hidden.filter(h => !attrs.includes(h));
        if (this.visible.length > 0) {
            this.visible.push(...attrs);
        }
        return this;
    }

    makeHidden(attrs) {
        if (!Array.isArray(attrs)) attrs = [attrs];
        this.hidden.push(...attrs);
        return this;
    }
}

module.exports = Model;
