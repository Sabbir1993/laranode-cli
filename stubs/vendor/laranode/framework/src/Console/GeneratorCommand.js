const fs = require('fs');
const path = require('path');
const Command = use('laranode/Console/Command');
const Str = use('laranode/Support/Str');

class GeneratorCommand extends Command {
    /**
     * Get the stub file for the generator.
     * @returns {string}
     */
    getStub() {
        throw new Error('getStub must be implemented by subclass');
    }

    /**
     * Get the default namespace for the class.
     * @param {string} rootNamespace
     * @returns {string}
     */
    getDefaultNamespace(rootNamespace) {
        return rootNamespace;
    }

    /**
     * Build the class with the given name.
     * @param {string} name 
     * @returns {string}
     */
    buildClass(name) {
        let stub = fs.readFileSync(this.getStub(), 'utf8');
        stub = this.replaceNamespace(stub, name);
        return this.replaceClass(stub, name);
    }

    /**
     * Replace the namespace for the given stub.
     * @param {string} stub 
     * @param {string} name 
     * @returns {string}
     */
    replaceNamespace(stub, name) {
        // Simple MVP replace for {{ namespace }} and {{ rootNamespace }}
        return stub
            .replace(/\{\{\s*namespace\s*\}\}/g, this.getNamespace(name))
            .replace(/\{\{\s*rootNamespace\s*\}\}/g, this.rootNamespace());
    }

    /**
     * Replace the class name for the given stub.
     * @param {string} stub 
     * @param {string} name 
     * @returns {string}
     */
    replaceClass(stub, name) {
        const className = name.replace(this.getNamespace(name) + '/', '');
        return stub.replace(/\{\{\s*class\s*\}\}/g, className);
    }

    /**
     * Get the full namespace for a given class, without the class name.
     * @param {string} name 
     * @returns {string}
     */
    getNamespace(name) {
        const parts = name.split('/');
        parts.pop();
        return parts.length > 0 ? parts.join('/') : '';
    }

    /**
     * Get the root namespace for the class.
     * @returns {string}
     */
    rootNamespace() {
        return 'App';
    }

    /**
     * Get the destination class path.
     * @param {string} name 
     * @returns {string}
     */
    getPath(name) {
        let namePath = name;
        if (name.startsWith('App/')) {
            namePath = name.replace('App/', 'app/');
        }
        return path.join(base_path(), `${namePath}.js`);
    }

    /**
     * Execute the console command.
     */
    async handle(args, options) {
        this.options = options || {};

        const nameInput = args[0]; // e.g. UserController
        if (!nameInput) {
            this.error('Not enough arguments (missing: "name").');
            return false;
        }

        const name = this.qualifyClass(nameInput);
        const path = this.getPath(name);

        if (this.alreadyExists(name) && !options.force) {
            this.error(`${name} already exists!`);
            return false;
        }

        this.makeDirectory(path);

        fs.writeFileSync(path, this.buildClass(name));

        this.info(`${name} created successfully.`);
    }

    /**
     * Parse the class name and format according to the root namespace.
     * @param {string} name 
     * @returns {string}
     */
    qualifyClass(name) {
        name = name.replace(/\\/g, '/'); // Normalize slashes
        const rootNamespace = this.rootNamespace();

        if (name.startsWith(rootNamespace + '/')) {
            return name;
        }

        const prefix = this.getDefaultNamespace(rootNamespace);
        return prefix ? `${prefix}/${name}` : `${rootNamespace}/${name}`;
    }

    /**
     * Determine if the class already exists.
     * @param {string} rawName 
     * @returns {boolean}
     */
    alreadyExists(rawName) {
        return fs.existsSync(this.getPath(this.qualifyClass(rawName)));
    }

    /**
     * Build the directory for the class if necessary.
     * @param {string} filePath 
     * @returns {string}
     */
    makeDirectory(filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }
}

module.exports = GeneratorCommand;
