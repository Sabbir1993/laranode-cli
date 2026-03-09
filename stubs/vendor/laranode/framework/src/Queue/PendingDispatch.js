const Queue = use('laranode/Support/Facades/Queue');

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
        const jobPath = this.resolveJobPath();
        const data = this.job.data || {};

        if (this.delaySeconds > 0) {
            await Queue.later(this.delaySeconds, jobPath, data, this.queueName);
        } else {
            await Queue.push(jobPath, data, this.queueName);
        }
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
