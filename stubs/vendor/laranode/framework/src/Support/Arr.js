class Arr {
    static get(target, key, defaultValue = null) {
        if (target === null || target === undefined) {
            return defaultValue;
        }

        if (key === null) {
            return target;
        }

        if (typeof key === 'string' && key in target) {
            return target[key];
        }

        if (!key.toString().includes('.')) {
            return target[key] !== undefined ? target[key] : defaultValue;
        }

        const keys = key.toString().split('.');
        
        for (const k of keys) {
            if (target === null || target === undefined || typeof target !== 'object') {
                return defaultValue;
            }
            if (k in target) {
                target = target[k];
            } else {
                return defaultValue;
            }
        }

        return target !== undefined ? target : defaultValue;
    }

    static set(target, key, value) {
        if (target === null || target === undefined || typeof target !== 'object') {
            return target;
        }

        const keys = key.toString().split('.');
        let current = target;

        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            
            if (i === keys.length - 1) {
                current[k] = value;
                break;
            }

            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            
            current = current[k];
        }

        return target;
    }

    static has(target, keys) {
        if (target === null || target === undefined || typeof target !== 'object') {
            return false;
        }

        if (!Array.isArray(keys)) keys = [keys];

        if (keys.length === 0) return false;

        for (const key of keys) {
            if (key === null) return false;
            
            const segments = key.toString().split('.');
            let current = target;
            let exists = true;

            for (const segment of segments) {
                if (current === null || current === undefined || typeof current !== 'object' || !(segment in current)) {
                    exists = false;
                    break;
                }
                current = current[segment];
            }

            if (!exists) return false;
        }

        return true;
    }

    static forget(target, keys) {
        if (target === null || target === undefined || typeof target !== 'object') {
            return target;
        }

        if (!Array.isArray(keys)) keys = [keys];

        for (const key of keys) {
            const segments = key.toString().split('.');
            
            if (segments.length === 1) {
                delete target[segments[0]];
                continue;
            }
            
            let current = target;
            for (let i = 0; i < segments.length - 1; i++) {
                if (current === null || current === undefined || typeof current !== 'object' || !(segments[i] in current)) {
                    current = null;
                    break;
                }
                current = current[segments[i]];
            }
            
            if (current !== null && current !== undefined && typeof current === 'object') {
                delete current[segments[segments.length - 1]];
            }
        }

        return target;
    }

    static only(target, keys) {
        const result = {};
        if (target === null || target === undefined || typeof target !== 'object') {
            return result;
        }

        if (!Array.isArray(keys)) keys = [keys];

        for (const key of keys) {
            if (key in target) {
                result[key] = target[key];
            }
        }
        
        return result;
    }

    static except(target, keys) {
        if (target === null || target === undefined || typeof target !== 'object') {
            return {};
        }

        if (!Array.isArray(keys)) keys = [keys];

        const result = { ...target };
        for (const key of keys) {
            delete result[key];
        }

        return result;
    }

    static pluck(array, value, key = null) {
        if (!Array.isArray(array)) {
            array = Object.values(array);
        }
        
        if (key === null) {
            return array.map(item => Arr.get(item, value));
        }

        const result = {};
        for (const item of array) {
            const itemKey = Arr.get(item, key);
            if (itemKey !== undefined) {
                result[itemKey] = Arr.get(item, value);
            }
        }
        return result;
    }

    static flatten(array, depth = Infinity) {
        if (!Array.isArray(array)) {
            array = Object.values(array);
        }
        
        return array.flat(depth);
    }

    static first(array, callback = null, defaultValue = null) {
        const iterable = Array.isArray(array) ? array : (typeof array === 'object' && array !== null ? Object.values(array) : []);
        
        if (callback === null) {
            return iterable.length > 0 ? iterable[0] : defaultValue;
        }

        for (let i = 0; i < iterable.length; i++) {
            if (callback(iterable[i], i)) {
                return iterable[i];
            }
        }

        return defaultValue;
    }

    static last(array, callback = null, defaultValue = null) {
        const iterable = Array.isArray(array) ? array : (typeof array === 'object' && array !== null ? Object.values(array) : []);
        
        if (callback === null) {
            return iterable.length > 0 ? iterable[iterable.length - 1] : defaultValue;
        }

        for (let i = iterable.length - 1; i >= 0; i--) {
            if (callback(iterable[i], i)) {
                return iterable[i];
            }
        }

        return defaultValue;
    }

    static wrap(value) {
        if (value === null || value === undefined) {
            return [];
        }
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    }
}

module.exports = Arr;
