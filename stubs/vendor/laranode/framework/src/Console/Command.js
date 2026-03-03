class Command {
    constructor() {
        this.signature = '';
        this.description = '';
    }

    /**
     * Set the commander program instance
     * @param {Object} program 
     */
    setProgram(program) {
        this.program = program;
    }

    /**
     * Register the command with Commander.js
     */
    register() {
        if (!this.signature) return;

        // Parse signature to extract command name and arguments
        // e.g. "make:controller {name} {--resource}"
        const parts = this.signature.split(' ');
        const name = parts[0];

        const cmd = this.program.command(name)
            .description(this.description);

        // Very basic MVP parse of arguments/options
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            // Check if it's an option like {--name} or {--class=Default} or {--force : description}
            if (part.startsWith('{--')) {
                // Extract everything after {-- up to the first space or = or }
                const optMatch = part.match(/{--([^=:}]+)/);
                if (optMatch) {
                    const optName = optMatch[1].trim();
                    cmd.option(`--${optName} [value]`, `The ${optName} option`);
                }
            } else if (part.startsWith('{') && part.endsWith('}')) {
                // Argument
                const argName = part.substring(1, part.length - 1);
                cmd.argument(argName, `The ${argName} argument`);
            }
        }

        cmd.action(async (...args) => {
            // Commander passes arguments followed by options object and the command object itself
            const commandObject = args.pop();
            const options = args.pop();
            const cmdArgs = args;

            await this.handle(cmdArgs, options);
        });
    }

    /**
     * Execute the console command.
     * To be implemented by subclasses.
     */
    async handle(args, options) {
        throw new Error('Command handle method not implemented.');
    }

    /**
     * Write a string as standard output.
     */
    info(string) {
        console.log(`\x1b[32m${string}\x1b[0m`); // Green
    }

    error(string) {
        console.error(`\x1b[31m${string}\x1b[0m`); // Red
    }

    warn(string) {
        console.warn(`\x1b[33m${string}\x1b[0m`); // Yellow
    }
}

module.exports = Command;
