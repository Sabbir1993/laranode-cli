class Seeder {
    /**
     * Run the database seeds.
     */
    async run() {
        // To be implemented by subclasses
    }

    /**
     * Call another seeder
     * @param {class|string} seederClass 
     */
    async call(seederClass) {
        if (typeof seederClass === 'string') {
            const resolvedClass = require(seederClass);
            await (new resolvedClass()).run();
        } else {
            await (new seederClass()).run();
        }
    }
}

module.exports = Seeder;
