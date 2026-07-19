const Command = use('laranode/Console/Command');
const Queue = use('laranode/Support/Facades/Queue');
const DB = use('laranode/Support/Facades/DB');

class QueueWorkCommand extends Command {
    constructor(app) {
        super();
        this.app = app;
        this.signature = 'queue:work {--queue=default : The queue to listen on} {--sleep=3 : Seconds to sleep when no job is available} {--tries=3 : Attempts before a job is marked failed} {--backoff=0 : Seconds to wait before retrying a failed job} {--timeout=60 : Seconds a single job may run before it is aborted} {--max-jobs=0 : Exit after processing this many jobs (0 = unlimited)} {--max-time=0 : Exit after running this many seconds (0 = unlimited)} {--memory=128 : Restart the worker when memory (MB) is exceeded}';
        this.description = 'Start processing jobs on the queue as a daemon';
        this.shouldQuit = false;
    }

    async handle(args, options) {
        const queueName = options.queue || 'default';
        const sleepSeconds = parseInt(options.sleep || 3, 10);
        const maxTries = parseInt(options.tries || 3, 10);
        const backoff = parseInt(options.backoff || 0, 10);
        const timeout = parseInt(options.timeout || 60, 10);
        const maxJobs = parseInt(options['max-jobs'] || 0, 10);
        const maxTime = parseInt(options['max-time'] || 0, 10);
        const memoryLimit = parseInt(options.memory || 128, 10);

        this.registerSignalHandlers();

        this.info(`Processing jobs from the [${queueName}] queue.`);

        const startedAt = Date.now();
        let processed = 0;

        while (!this.shouldQuit) {
            if (maxTime > 0 && (Date.now() - startedAt) / 1000 >= maxTime) {
                this.info('Max execution time reached; stopping worker.');
                break;
            }
            if (memoryLimit > 0 && this.memoryExceeded(memoryLimit)) {
                this.info(`Memory limit of ${memoryLimit}MB exceeded; stopping worker for restart.`);
                break;
            }

            const jobRecord = await this.getNextJob(queueName);

            if (jobRecord) {
                await this.processJob(jobRecord, { maxTries, backoff, timeout });
                processed++;
                if (maxJobs > 0 && processed >= maxJobs) {
                    this.info(`Processed ${processed} job(s); stopping worker.`);
                    break;
                }
            } else {
                // Interruptible sleep so a shutdown signal is honored promptly.
                await this.sleep(sleepSeconds);
            }
        }

        this.info('Worker stopped.');
    }

    /**
     * Finish the in-flight job on SIGTERM/SIGINT, then exit. A second signal
     * forces an immediate exit.
     */
    registerSignalHandlers() {
        const shutdown = (signal) => {
            if (this.shouldQuit) {
                this.error(`Received ${signal} again; forcing exit.`);
                process.exit(1);
            }
            this.info(`Received ${signal}; finishing current job then exiting...`);
            this.shouldQuit = true;
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    memoryExceeded(limitMb) {
        return process.memoryUsage().rss / (1024 * 1024) >= limitMb;
    }

    async getNextJob(queue) {
        return await Queue.pop(queue);
    }

    async processJob(jobRecord, { maxTries, backoff, timeout }) {
        // jobRecord: { id, payload, attempts, delete, release }
        let jobClassPath = 'Unknown';
        try {
            const payload = JSON.parse(jobRecord.payload);
            jobClassPath = payload.job;

            // Only load jobs from the app's Jobs directory. The payload comes from
            // the queue store, so an untrusted `job` value must never reach require().
            if (typeof jobClassPath !== 'string' ||
                jobClassPath.includes('..') ||
                !/^app[\/\\]Jobs[\/\\][A-Za-z0-9_\/\\-]+$/.test(jobClassPath)) {
                throw new Error(`Refused to load untrusted job class path: ${jobClassPath}`);
            }

            const JobClass = use(jobClassPath);
            const jobInstance = new JobClass(payload.data);

            this.info(`[${this.now()}] Processing: ${jobClassPath}`);

            // Soft timeout: stop waiting on a runaway job and treat it as failed.
            // Note: this does not hard-kill the underlying async work in Node —
            // set --timeout above the longest expected job and keep jobs abortable.
            await this.runWithTimeout(jobInstance, timeout);

            this.info(`[${this.now()}] Processed:  ${jobClassPath}`);

            if (typeof jobRecord.delete === 'function') {
                await jobRecord.delete();
            }
        } catch (error) {
            this.error(`[${this.now()}] Failed:     ${jobClassPath}`);
            this.error(error.message);

            if (jobRecord.attempts >= maxTries) {
                await this.failJob(jobRecord, error);
                this.error(`Job [${jobRecord.id}] has been moved to the failed_jobs table.`);
                if (typeof jobRecord.delete === 'function') {
                    await jobRecord.delete();
                }
            } else if (typeof jobRecord.release === 'function') {
                // Release with backoff so a persistently failing job doesn't
                // burn through all its tries in a tight loop.
                await jobRecord.release(backoff);
            }
        }
    }

    runWithTimeout(jobInstance, timeoutSeconds) {
        if (!timeoutSeconds || timeoutSeconds <= 0) {
            return jobInstance.handle();
        }
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(
                () => reject(new Error(`Job exceeded timeout of ${timeoutSeconds}s`)),
                timeoutSeconds * 1000
            );
        });
        return Promise.race([jobInstance.handle(), timeoutPromise])
            .finally(() => clearTimeout(timer));
    }

    async failJob(jobRecord, error) {
        const crypto = require('crypto');
        await DB.table('failed_jobs').insert({
            uuid: crypto.randomUUID(),
            connection: 'database',
            queue: jobRecord.queue,
            payload: jobRecord.payload,
            exception: error.stack || error.message,
            failed_at: this.now()
        });
    }

    now() {
        return new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
    }

    sleep(seconds) {
        return new Promise(resolve => {
            const ms = seconds * 1000;
            const step = 250;
            let elapsed = 0;
            const tick = () => {
                if (this.shouldQuit || elapsed >= ms) return resolve();
                elapsed += step;
                setTimeout(tick, Math.min(step, ms - elapsed + step));
            };
            tick();
        });
    }
}

module.exports = QueueWorkCommand;
