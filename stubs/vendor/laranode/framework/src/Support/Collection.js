class Collection {
    constructor(items = []) {
        this.items = Array.isArray(items) ? items : [items];
    }

    static make(items = []) {
        return new Collection(items);
    }

    all() {
        return this.items;
    }

    map(callback) {
        return new Collection(this.items.map(callback));
    }

    filter(callback) {
        return new Collection(this.items.filter(callback));
    }

    reduce(callback, initialValue) {
        return this.items.reduce(callback, initialValue);
    }

    each(callback) {
        this.items.forEach(callback);
        return this;
    }

    pluck(value, key = null) {
        if (!key) {
            return new Collection(this.items.map(item => item[value]));
        }

        const obj = {};
        this.items.forEach(item => {
            obj[item[key]] = item[value];
        });
        return new Collection(obj);
    }

    groupBy(key) {
        const result = {};
        this.items.forEach(item => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
        });

        // Wrap grouped arrays in Collections
        Object.keys(result).forEach(k => {
            result[k] = new Collection(result[k]);
        });

        return new Collection(result);
    }

    sortBy(callbackOrKey) {
        const sorted = [...this.items].sort((a, b) => {
            const valA = typeof callbackOrKey === 'function' ? callbackOrKey(a) : a[callbackOrKey];
            const valB = typeof callbackOrKey === 'function' ? callbackOrKey(b) : b[callbackOrKey];
            if (valA < valB) return -1;
            if (valA > valB) return 1;
            return 0;
        });
        return new Collection(sorted);
    }

    sortByDesc(callbackOrKey) {
        const sorted = [...this.items].sort((a, b) => {
            const valA = typeof callbackOrKey === 'function' ? callbackOrKey(a) : a[callbackOrKey];
            const valB = typeof callbackOrKey === 'function' ? callbackOrKey(b) : b[callbackOrKey];
            if (valA > valB) return -1;
            if (valA < valB) return 1;
            return 0;
        });
        return new Collection(sorted);
    }

    first(callback = null, defaultValue = null) {
        if (!callback) {
            return this.items.length > 0 ? this.items[0] : defaultValue;
        }
        const found = this.items.find(callback);
        return found !== undefined ? found : defaultValue;
    }

    last(callback = null, defaultValue = null) {
        if (!callback) {
            return this.items.length > 0 ? this.items[this.items.length - 1] : defaultValue;
        }
        const reversed = [...this.items].reverse();
        const found = reversed.find(callback);
        return found !== undefined ? found : defaultValue;
    }

    count() {
        return this.items.length;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    isNotEmpty() {
        return !this.isEmpty();
    }

    push(item) {
        this.items.push(item);
        return this;
    }

    pop() {
        return this.items.pop();
    }

    shift() {
        return this.items.shift();
    }

    unshift(item) {
        this.items.unshift(item);
        return this;
    }

    keyBy(key) {
        const obj = {};
        this.items.forEach(item => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            obj[groupKey] = item;
        });
        return new Collection(obj);
    }

    flatten(depth = Infinity) {
        return new Collection(this.items.flat(depth));
    }

    chunk(size) {
        const chunks = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(new Collection(this.items.slice(i, i + size)));
        }
        return new Collection(chunks);
    }

    whereIn(key, values) {
        return new Collection(this.items.filter(item => values.includes(item[key])));
    }

    diff(items) {
        const compareArray = items instanceof Collection ? items.items : items;
        return new Collection(this.items.filter(i => !compareArray.includes(i)));
    }

    intersect(items) {
        const compareArray = items instanceof Collection ? items.items : items;
        return new Collection(this.items.filter(i => compareArray.includes(i)));
    }

    merge(items) {
        const compareArray = items instanceof Collection ? items.items : items;
        return new Collection([...this.items, ...compareArray]);
    }

    take(limit) {
        if (limit < 0) {
            return new Collection(this.items.slice(limit));
        }
        return new Collection(this.items.slice(0, limit));
    }

    skip(count) {
        return new Collection(this.items.slice(count));
    }

    sum(callbackOrKey = null) {
        return this.items.reduce((acc, item) => {
            const val = callbackOrKey
                ? (typeof callbackOrKey === 'function' ? callbackOrKey(item) : item[callbackOrKey])
                : item;
            return acc + (Number(val) || 0);
        }, 0);
    }

    avg(callbackOrKey = null) {
        const count = this.count();
        if (count === 0) return 0;
        return this.sum(callbackOrKey) / count;
    }

    max(callbackOrKey = null) {
        if (this.isEmpty()) return null;
        return Math.max(...this.items.map(item => {
            return callbackOrKey
                ? (typeof callbackOrKey === 'function' ? callbackOrKey(item) : item[callbackOrKey])
                : item;
        }));
    }

    min(callbackOrKey = null) {
        if (this.isEmpty()) return null;
        return Math.min(...this.items.map(item => {
            return callbackOrKey
                ? (typeof callbackOrKey === 'function' ? callbackOrKey(item) : item[callbackOrKey])
                : item;
        }));
    }

    toArray() {
        return this.items;
    }

    toJson() {
        return JSON.stringify(this.items);
    }
}

module.exports = Collection;
