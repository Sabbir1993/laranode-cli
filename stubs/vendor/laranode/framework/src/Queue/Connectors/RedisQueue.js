const Redis = require('ioredis');

class RedisQueue {
    constructor(app, config) {
        this.app = app;
        const options = {};
        if (config.host) options.host = config.host;
        if (config.port) options.port = config.port;
        if (config.password) options.password = config.password;

        this.redis = new Redis(options);
        this.defaultQueue = config.queue || 'default';
        this.prefix = config.prefix || 'queues:';
        // Visibility timeout: a reserved job whose worker died is reclaimed
        // after this many seconds.
        this.retryAfter = config.retry_after || 90;
    }

    getQueue(queue) {
        return this.prefix + (queue || this.defaultQueue);
    }

    async push(jobPath, data = '', queue = null) {
        const payload = this.createPayload(jobPath, data);
        await this.redis.rpush(this.getQueue(queue), payload);
        return true;
    }

    async later(delay, jobPath, data = '', queue = null) {
        const payload = this.createPayload(jobPath, data);
        const availableAt = Math.floor(Date.now() / 1000) + delay;
        await this.redis.zadd(this.getQueue(queue) + ':delayed', availableAt, payload);
    }

    createPayload(jobPath, data) {
        const crypto = require('crypto');
        return JSON.stringify({
            uuid: crypto.randomUUID(),
            job: jobPath,
            data: data,
            attempts: 0
        });
    }

    async pop(queue = null) {
        const queueName = this.getQueue(queue);

        // Migrate due delayed jobs, then reclaim jobs orphaned by dead workers.
        await this.migrateExpiredJobs(queueName + ':delayed', queueName);
        await this.migrateExpiredJobs(queueName + ':reserved', queueName);

        const payload = await this.redis.lpop(queueName);

        if (payload) {
            const jobData = JSON.parse(payload);
            jobData.attempts += 1;

            // Reserve in a sorted set scored by its expiry so a crashed worker's
            // job is reclaimed by migrateExpiredJobs once the timeout passes.
            const reservedPayload = JSON.stringify(jobData);
            const expiresAt = Math.floor(Date.now() / 1000) + this.retryAfter;
            await this.redis.zadd(queueName + ':reserved', expiresAt, reservedPayload);

            return {
                id: jobData.uuid,
                payload: reservedPayload,
                attempts: jobData.attempts,
                delete: async () => {
                    await this.redis.zrem(queueName + ':reserved', reservedPayload);
                },
                // Release back to the queue, optionally after a backoff delay.
                release: async (delay = 0) => {
                    await this.redis.zrem(queueName + ':reserved', reservedPayload);
                    if (delay > 0) {
                        const availableAt = Math.floor(Date.now() / 1000) + delay;
                        await this.redis.zadd(queueName + ':delayed', availableAt, reservedPayload);
                    } else {
                        await this.redis.rpush(queueName, reservedPayload);
                    }
                }
            };
        }

        return null;
    }

    async migrateExpiredJobs(from, to) {
        const now = Math.floor(Date.now() / 1000);
        const jobs = await this.redis.zrangebyscore(from, '-inf', now);

        if (jobs.length > 0) {
            const pipeline = this.redis.pipeline();
            pipeline.zremrangebyscore(from, '-inf', now);
            for (const job of jobs) {
                pipeline.rpush(to, job);
            }
            await pipeline.exec();
        }
    }
}

module.exports = RedisQueue;
