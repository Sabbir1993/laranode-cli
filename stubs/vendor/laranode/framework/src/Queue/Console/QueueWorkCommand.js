const Command = use('laranode/Console/Command');
const Queue = use('laranode/Support/Facades/Queue');
const DB = use('laranode/Support/Facades/DB');

class QueueWorkCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'queue:work {--queue=default : The queue to listen on} {--sleep=3 : Number of seconds to sleep when no job is available} {--tries=3 : Number of times to attempt a job before logging it failed}';
        this.description = 'Start processing jobs on the queue as a daemon';
    }

    async handle(args, options) {
        const queueName = options.queue || 'default';
        const sleepSeconds = parseInt(options.sleep || 3, 10);
        const maxTries = parseInt(options.tries || 3, 10);

        this.info(`Processing jobs from the [${queueName}] queue.`);

        while (true) {
            const jobRecord = await this.getNextJob(queueName);

            if (jobRecord) {
                await this.processJob(jobRecord, maxTries);
            } else {
                await this.sleep(sleepSeconds);
            }
        }
    }

    async getNextJob(queue) {
        return await Queue.pop(queue);
    }

    async processJob(jobRecord, maxTries) {
        // jobRecord is returned from the driver and contains { id, payload, attempts, delete, release }

        let jobInstance = null;
        let jobClassPath = 'Unknown';
        try {
            const payload = JSON.parse(jobRecord.payload);
            jobClassPath = payload.job;
            const JobClass = use(jobClassPath);
            jobInstance = new JobClass(payload.data);

            const timestamp = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
            this.info(`[${timestamp}] Processing: ${jobClassPath}`);

            await jobInstance.handle();

            const endTimestamp = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
            this.info(`[${endTimestamp}] Processed:  ${jobClassPath}`);

            // Delete job if successful
            if (typeof jobRecord.delete === 'function') {
                await jobRecord.delete();
            }
        } catch (error) {
            const timestamp = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
            this.error(`[${timestamp}] Failed:     ${jobClassPath}`);
            this.error(error.message);

            if (jobRecord.attempts >= maxTries) {
                // Move to failed_jobs table
                await this.failJob(jobRecord, error);
                this.error(`Job [${jobRecord.id}] has been moved to the failed_jobs table.`);
                if (typeof jobRecord.delete === 'function') {
                    await jobRecord.delete();
                }
            } else {
                // Release back to queue
                if (typeof jobRecord.release === 'function') {
                    await jobRecord.release();
                }
            }
        }
    }

    async failJob(jobRecord, error) {
        const crypto = require('crypto');
        const uuid = crypto.randomUUID();
        const failedAt = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });

        await DB.table('failed_jobs').insert({
            uuid: uuid,
            connection: 'database',
            queue: jobRecord.queue,
            payload: jobRecord.payload,
            exception: error.stack || error.message,
            failed_at: failedAt
        });

        // Will be removed from main queue by processJob via tracking
    }

    sleep(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}

module.exports = QueueWorkCommand;
