const Command = use('laranode/Console/Command');
const { execSync } = require('child_process');

class ScheduleRunCommand extends Command {
    constructor(app) {
        super(app);
        this.signature = 'schedule:run';
        this.description = 'Run the scheduled commands';
    }

    async handle() {
        const Schedule = use('laranode/Console/Scheduling/Schedule');
        const schedule = new Schedule();

        const kernelPath = app_path('Console/Kernel.js');
        let AppKernel;
        try {
            AppKernel = require(kernelPath);
        } catch (e) {
            this.warn('No custom app Console Kernel found. Scheduling might be skipped.');
            return;
        }

        const appKernelInstance = new AppKernel(this.app);

        // Define schedules in user space
        if (typeof appKernelInstance.schedule === 'function') {
            appKernelInstance.schedule(schedule);
        }

        const dueEvents = schedule.dueEvents(new Date());

        if (dueEvents.length === 0) {
            this.info('No scheduled commands are ready to run.');
            return;
        }

        this.info(`Running ${dueEvents.length} scheduled event(s).`);

        for (const event of dueEvents) {
            const cmd = event.getCommand();
            try {
                if (typeof cmd === 'function') {
                    this.info(`Running callback...`);
                    await cmd();
                } else {
                    this.info(`Running command: ${cmd}`);
                    // Run actual artisan command mapped
                    execSync(`node artisan ${cmd}`, { stdio: 'inherit', cwd: base_path() });
                }
            } catch (err) {
                this.error(`Error executing event: ${err.message}`);
            }
        }
    }
}

module.exports = ScheduleRunCommand;
