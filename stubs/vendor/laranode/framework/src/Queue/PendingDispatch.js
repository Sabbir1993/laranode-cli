const DB = use('laranode/Support/Facades/DB');

class PendingDispatch {
    constructor(job) {
        this.job = job;
        this.queueName = job.queue || 'default';
        this.delaySeconds = 0;
        this._sendPromise = null;
    }

    /**
     * Set the desired queue for the job.
     * @param {string} queue
     * @returns {PendingDispatch}
     */
    onQueue(queue) {
        this.queueName = queue;
        return this;
    }

    /**
     * Set the delay (in seconds) for the job.
     * @param {number} seconds
     * @returns {PendingDispatch}
     */
    delay(seconds) {
        this.delaySeconds = seconds;
        return this;
    }

    /**
     * Resolve the job class path from the job instance.
     */
    resolveJobPath() {
        if (this.job.constructor._jobPath) {
            return this.job.constructor._jobPath;
        }
        return `App/Jobs/${this.job.constructor.name}`;
    }

    /**
     * Send the job to the queue. Cached so it only runs once.
     */
    send() {
        if (!this._sendPromise) {
            this._sendPromise = this._doSend();
        }
        return this._sendPromise;
    }

    /**
     * @private
     */
    async _doSend() {
        const now = Math.floor(Date.now() / 1000);
        const availableAt = now + this.delaySeconds;

        const payload = JSON.stringify({
            job: this.resolveJobPath(),
            data: this.job.data || {}
        });

        await DB.table('jobs').insert({
            queue: this.queueName,
            payload: payload,
            attempts: 0,
            reserved_at: null,
            available_at: availableAt,
            created_at: now
        });
    }

    /**
     * Make PendingDispatch thenable so `await` auto-sends.
     * This allows: await ExampleJob.dispatch(data)
     * And also:    await ExampleJob.dispatch(data).delay(60)
     */
    then(onFulfilled, onRejected) {
        return this.send().then(onFulfilled, onRejected);
    }

    catch(onRejected) {
        return this.send().catch(onRejected);
    }
}

module.exports = PendingDispatch;
