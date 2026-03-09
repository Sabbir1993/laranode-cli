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

        // Migrate due delayed jobs into the main queue
        await this.migrateExpiredJobs(queueName + ':delayed', queueName);

        const payload = await this.redis.lpop(queueName);

        if (payload) {
            const jobData = JSON.parse(payload);
            const uuid = jobData.uuid;

            // Track active/reserved jobs
            jobData.attempts += 1;
            await this.redis.hset(queueName + ':reserved', uuid, JSON.stringify(jobData));

            return {
                id: uuid,
                payload: JSON.stringify(jobData),
                attempts: jobData.attempts,
                delete: async () => {
                    await this.redis.hdel(queueName + ':reserved', uuid);
                },
                release: async () => {
                    await this.redis.hdel(queueName + ':reserved', uuid);
                    await this.redis.rpush(queueName, JSON.stringify(jobData));
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
