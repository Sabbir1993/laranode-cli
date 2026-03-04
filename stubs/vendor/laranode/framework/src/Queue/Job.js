class Job {
    constructor(data = {}) {
        this.data = data;
        this.queue = 'default';
    }

    /**
     * Dispatch the job with the given data.
     * Usage: await ExampleJob.dispatch({ key: 'value' })
     * Usage: await ExampleJob.dispatch({ key: 'value' }).delay(60)
     * Usage: await ExampleJob.dispatch({ key: 'value' }).onQueue('high')
     *
     * @param  {...any} args - Arguments passed to the job constructor
     * @returns {PendingDispatch}
     */
    static dispatch(...args) {
        const PendingDispatch = use('laranode/Queue/PendingDispatch');
        const instance = new this(...args);
        return new PendingDispatch(instance);
    }

    /**
     * Execute the job. Override this in your job classes.
     */
    async handle() {
        throw new Error('Job handle() method must be implemented.');
    }
}

module.exports = Job;
