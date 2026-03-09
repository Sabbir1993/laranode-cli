const Command = use('laranode/Console/Command');
const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');

class TestCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'test';
        this.description = 'Run the application tests';
    }

    async handle() {
        process.env.APP_ENV = 'testing';

        const mocha = new Mocha({
            timeout: 10000,
            color: true
        });

        const testDir = base_path('tests');

        if (!fs.existsSync(testDir)) {
            this.error('Tests directory not found.');
            return;
        }

        const files = this.getTestFiles(testDir);
        if (files.length === 0) {
            this.info('No tests found.');
            return;
        }

        for (const file of files) {
            mocha.addFile(file);
        }

        // Run tests
        return new Promise((resolve) => {
            mocha.run((failures) => {
                if (failures > 0) {
                    process.exitCode = 1;
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    getTestFiles(dir, filesList = []) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.getTestFiles(filePath, filesList);
            } else if (filePath.endsWith('.test.js')) {
                filesList.push(filePath);
            }
        }
        return filesList;
    }
}

module.exports = TestCommand;
