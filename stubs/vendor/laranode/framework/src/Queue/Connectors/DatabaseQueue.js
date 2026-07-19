const DB = use('laranode/Support/Facades/DB');

class DatabaseQueue {
    constructor(app, config) {
        this.app = app;
        this.table = config.table || 'jobs';
        this.defaultQueue = config.queue || 'default';
        // Visibility timeout: a reserved job whose worker died is reclaimed after
        // this many seconds. Must be longer than the longest job runtime.
        this.retryAfter = config.retry_after || 90;
    }

    push(jobPath, data = '', queue = null) {
        return this.pushToDatabase(queue || this.defaultQueue, this.createPayload(jobPath, data));
    }

    later(delay, jobPath, data = '', queue = null) {
        return this.pushToDatabase(queue || this.defaultQueue, this.createPayload(jobPath, data), delay);
    }

    async pushToDatabase(queue, payload, delay = 0) {
        const now = Math.floor(Date.now() / 1000);
        const availableAt = now + delay;

        return await DB.table(this.table).insert({
            queue: queue,
            payload: payload,
            attempts: 0,
            reserved_at: null,
            available_at: availableAt,
            created_at: now
        });
    }

    createPayload(jobPath, data) {
        return JSON.stringify({
            job: jobPath,
            data: data
        });
    }

    /**
     * Release jobs whose reservation has expired (crashed/killed workers) so
     * they become available again. attempts is left intact so max-tries still
     * bounds a job that repeatedly kills its worker.
     */
    async releaseExpired(queueName) {
        const staleBefore = Math.floor(Date.now() / 1000) - this.retryAfter;
        await DB.table(this.table)
            .where('queue', queueName)
            .whereNotNull('reserved_at')
            .where('reserved_at', '<=', staleBefore)
            .update({ reserved_at: null });
    }

    async pop(queue = null) {
        const queueName = queue || this.defaultQueue;

        // Reclaim jobs orphaned by dead workers before looking for new work.
        await this.releaseExpired(queueName);

        // Atomically claim a job: SELECT a candidate, then a conditional UPDATE
        // that only succeeds if the row is still unreserved. Under concurrency
        // only one worker's UPDATE affects the row; losers retry a few times.
        for (let attempt = 0; attempt < 5; attempt++) {
            const jobRecord = await DB.table(this.table)
                .where('queue', queueName)
                .whereNull('reserved_at')
                .where('available_at', '<=', Math.floor(Date.now() / 1000))
                .oldest('id')
                .first();

            if (!jobRecord) return null;

            const now = Math.floor(Date.now() / 1000);
            const claimed = await DB.table(this.table)
                .where('id', jobRecord.id)
                .whereNull('reserved_at')
                .update({ reserved_at: now, attempts: jobRecord.attempts + 1 });

            if (claimed !== 1) {
                // Another worker won the race for this row; try the next candidate.
                continue;
            }

            return {
                id: jobRecord.id,
                payload: jobRecord.payload,
                queue: queueName,
                attempts: jobRecord.attempts + 1,
                delete: async () => {
                    await DB.table(this.table).where('id', jobRecord.id).delete();
                },
                // Release back to the queue, optionally after a backoff delay.
                release: async (delay = 0) => {
                    const availableAt = Math.floor(Date.now() / 1000) + delay;
                    await DB.table(this.table)
                        .where('id', jobRecord.id)
                        .update({ reserved_at: null, available_at: availableAt });
                }
            };
        }

        return null;
    }
}

module.exports = DatabaseQueue;
