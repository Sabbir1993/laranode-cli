const DB = use('laranode/Support/Facades/DB');

class DatabaseQueue {
    constructor(app, config) {
        this.app = app;
        this.table = config.table || 'jobs';
        this.defaultQueue = config.queue || 'default';
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

    async pop(queue = null) {
        const queueName = queue || this.defaultQueue;

        const jobRecord = await DB.table(this.table)
            .where('queue', queueName)
            .whereNull('reserved_at')
            .where('available_at', '<=', Math.floor(Date.now() / 1000))
            .oldest('id')
            .first();

        if (jobRecord) {
            const now = Math.floor(Date.now() / 1000);
            await DB.table(this.table)
                .where('id', jobRecord.id)
                .update({
                    reserved_at: now,
                    attempts: jobRecord.attempts + 1
                });

            return {
                id: jobRecord.id,
                payload: jobRecord.payload,
                queue: queueName,
                attempts: jobRecord.attempts + 1,
                delete: async () => {
                    await DB.table(this.table).where('id', jobRecord.id).delete();
                },
                release: async () => {
                    await DB.table(this.table).where('id', jobRecord.id).update({ reserved_at: null });
                }
            };
        }

        return null;
    }
}

module.exports = DatabaseQueue;
