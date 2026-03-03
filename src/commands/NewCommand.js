const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { copyDir, generateAppKey, colors } = require('../utils/helpers');

class NewCommand {
    handle(name, options = {}) {
        const targetDir = path.resolve(process.cwd(), name);

        console.log('');
        console.log(colors.bold(`  🚀 LaraNode Installer`));
        console.log('');

        // 1. Check if directory exists
        if (fs.existsSync(targetDir)) {
            if (!options.force) {
                console.log(colors.red(`  ✗ Directory "${name}" already exists.`));
                console.log(colors.dim(`    Use --force to overwrite.`));
                process.exit(1);
            }
            console.log(colors.yellow(`  ⚠ Overwriting existing directory...`));
        }

        console.log(colors.cyan(`  Creating project: ${name}`));
        console.log('');

        // 2. Copy stubs
        const stubsDir = path.join(__dirname, '..', '..', 'stubs');
        this.step('Copying project files...', () => {
            copyDir(stubsDir, targetDir, []);
        });

        // 3. Rename special files
        this.step('Configuring project...', () => {
            // Rename env.example -> .env.example
            const envExampleSrc = path.join(targetDir, 'env.example');
            if (fs.existsSync(envExampleSrc)) {
                fs.copyFileSync(envExampleSrc, path.join(targetDir, '.env.example'));
                fs.copyFileSync(envExampleSrc, path.join(targetDir, '.env'));
                fs.unlinkSync(envExampleSrc);
            }

            // Rename gitignore.stub -> .gitignore
            const gitignoreSrc = path.join(targetDir, 'gitignore.stub');
            if (fs.existsSync(gitignoreSrc)) {
                fs.renameSync(gitignoreSrc, path.join(targetDir, '.gitignore'));
            }
        });

        // 4. Generate APP_KEY in .env
        this.step('Generating application key...', () => {
            const envPath = path.join(targetDir, '.env');
            if (fs.existsSync(envPath)) {
                let envContent = fs.readFileSync(envPath, 'utf-8');
                const appKey = generateAppKey();
                envContent = envContent.replace('APP_KEY=', `APP_KEY=${appKey}`);
                fs.writeFileSync(envPath, envContent);
            }
        });

        // 5. Update package.json with project name
        this.step('Updating package name...', () => {
            const pkgPath = path.join(targetDir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                pkg.name = name;
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
            }
        });

        // 6. Create empty directories that git ignores
        this.step('Creating directory structure...', () => {
            const dirs = [
                'storage/app',
                'storage/framework/views',
                'storage/logs',
                'database/migrations',
            ];
            for (const dir of dirs) {
                const fullPath = path.join(targetDir, dir);
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });

        // 7. Install dependencies
        console.log(colors.dim(`  ◌ Installing dependencies (this may take a moment)...`));
        try {
            execSync('npm install', {
                cwd: targetDir,
                stdio: 'pipe',
            });
            console.log(colors.green(`  ✔ Dependencies installed`));
        } catch (e) {
            console.log(colors.yellow(`  ⚠ Failed to install dependencies. Run 'npm install' manually.`));
        }

        // 8. Success message
        console.log('');
        console.log(colors.green(colors.bold(`  ✔ LaraNode project "${name}" created successfully!`)));
        console.log('');
        console.log(colors.dim(`  Next steps:`));
        console.log(`    ${colors.cyan('cd')} ${name}`);
        console.log(`    ${colors.cyan('node')} artisan serve`);
        console.log('');
        console.log(colors.dim(`  Then open: http://localhost:3333`));
        console.log('');
    }

    step(message, fn) {
        try {
            fn();
            console.log(colors.green(`  ✔ ${message.replace('...', '')}`));
        } catch (e) {
            console.log(colors.red(`  ✗ ${message} Failed: ${e.message}`));
            process.exit(1);
        }
    }
}

module.exports = NewCommand;
