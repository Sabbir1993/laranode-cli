class RateLimiter {
    constructor() {
        this.hits = new Map();
    }

    async handle(context, next, maxAttempts = 60, decayMinutes = 1) {
        const { req, res } = context;
        const ip = req.ip || req.connection.remoteAddress;

        const now = Date.now();
        const record = this.hits.get(ip) || { count: 0, resetAt: now + decayMinutes * 60000 };

        if (now > record.resetAt) {
            record.count = 0;
            record.resetAt = now + decayMinutes * 60000;
        }

        record.count++;
        this.hits.set(ip, record);

        res.header('X-RateLimit-Limit', maxAttempts);
        res.header('X-RateLimit-Remaining', Math.max(0, maxAttempts - record.count));

        if (record.count > maxAttempts) {
            return res.status(429).json({ message: 'Too Many Attempts.' });
        }

        return next(context);
    }
}

module.exports = RateLimiter;
