class Seeder {
    /**
     * Run the database seeds.
     * @return void
     */
    run() {
        // Must be implemented by child classes
    }

    /**
     * Seed the given connection from the given path.
     * @param {string|Array} classes 
     */
    async call(classes) {
        if (!Array.isArray(classes)) {
            classes = [classes];
        }

        for (const seederClass of classes) {
            const SeederClassOrInstance = typeof seederClass === 'string' ? use(seederClass) : seederClass;

            let instance;
            if (typeof SeederClassOrInstance === 'function') {
                instance = new SeederClassOrInstance();
            } else {
                instance = SeederClassOrInstance;
            }

            console.log(`\x1b[32mSeeding:\x1b[0m ${instance.constructor.name}`);

            if (instance.run.constructor.name === "AsyncFunction") {
                await instance.run();
            } else {
                instance.run();
            }

            console.log(`\x1b[32mSeeded:\x1b[0m  ${instance.constructor.name}`);
        }
    }
}

module.exports = Seeder;
