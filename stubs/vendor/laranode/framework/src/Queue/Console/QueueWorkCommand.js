const Command = use('laranode/Console/Command');
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
        return await DB.table('jobs')
            .where('queue', queue)
            .whereNull('reserved_at')
            .where('available_at', '<=', Math.floor(Date.now() / 1000))
            .oldest('id')
            .first();
    }

    async processJob(jobRecord, maxTries) {
        // Mark as reserved
        const now = Math.floor(Date.now() / 1000);
        await DB.table('jobs')
            .where('id', jobRecord.id)
            .update({
                reserved_at: now,
                attempts: jobRecord.attempts + 1
            });

        let jobInstance = null;
        let jobClassPath = 'Unknown';
        try {
            const payload = JSON.parse(jobRecord.payload);
            jobClassPath = payload.job;
            const JobClass = use(jobClassPath);
            jobInstance = new JobClass(payload.data);

            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            this.info(`[${timestamp}] Processing: ${jobClassPath}`);

            await jobInstance.handle();

            const endTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            this.info(`[${endTimestamp}] Processed:  ${jobClassPath}`);

            // Delete job if successful
            await DB.table('jobs').where('id', jobRecord.id).delete();
        } catch (error) {
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            this.error(`[${timestamp}] Failed:     ${jobClassPath}`);
            this.error(error.message);

            if (jobRecord.attempts + 1 >= maxTries) {
                // Move to failed_jobs table
                await this.failJob(jobRecord, error);
                this.error(`Job [${jobRecord.id}] has been moved to the failed_jobs table.`);
            } else {
                // Release back to queue
                await DB.table('jobs')
                    .where('id', jobRecord.id)
                    .update({
                        reserved_at: null
                    });
            }
        }
    }

    async failJob(jobRecord, error) {
        const crypto = require('crypto');
        const uuid = crypto.randomUUID();
        const failedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

        await DB.table('failed_jobs').insert({
            uuid: uuid,
            connection: 'database',
            queue: jobRecord.queue,
            payload: jobRecord.payload,
            exception: error.stack || error.message,
            failed_at: failedAt
        });

        // Remove from jobs table
        await DB.table('jobs').where('id', jobRecord.id).delete();
    }

    sleep(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}

module.exports = QueueWorkCommand;
