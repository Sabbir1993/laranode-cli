class Macroable {
    /**
     * Define a macro on the class
     * @param {string} name 
     * @param {Function} macro 
     */
    static macro(name, macro) {
        if (!this.macros) {
            this.macros = new Map();
        }
        this.macros.set(name, macro);

        // Expose macro on the prototype so instances can call it directly
        // 'this' inside the macro will be bound dynamically when the method is called on the instance
        this.prototype[name] = macro;
    }

    /**
     * Check if a macro is defined
     * @param {string} name 
     * @returns {boolean}
     */
    static hasMacro(name) {
        return this.macros && this.macros.has(name);
    }
}

// Make `macro` and `hasMacro` available on instances (prototypes) as well,
// so Facades resolving to instances can call them statically matching PHP behavior.
Macroable.prototype.macro = function (name, macroFn) {
    return this.constructor.macro(name, macroFn);
};
Macroable.prototype.hasMacro = function (name) {
    return this.constructor.hasMacro(name);
};

module.exports = Macroable;
