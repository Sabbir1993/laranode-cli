class Kernel {
    constructor(app) {
        this.app = app;
    }

    /**
     * Define the application's command schedule.
     *
     * @param  {Schedule} schedule
     */
    schedule(schedule) {
        // schedule.command('route:list').everyMinute();
        // schedule.call(() => { console.log('Ping!') }).hourly();
    }
}

module.exports = Kernel;
