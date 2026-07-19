// Module-scoped so state survives the per-request `new RateLimiter()` in Pipeline.
const hits = new Map();

// Periodic eviction so idle keys don't accumulate forever (unref so it never blocks exit).
setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of hits) {
        if (now > rec.resetAt) hits.delete(key);
    }
}, 60_000).unref();

class RateLimiter {
    async handle(context, next, maxAttempts = 60, decayMinutes = 1) {
        const { req, res } = context;
        const ip = req.ip || req.connection.remoteAddress;

        // Scope per-route so one endpoint's traffic can't exhaust another's budget.
        const key = `${req.method}:${req.baseUrl || ''}${req.path || ''}:${ip}`;

        const now = Date.now();
        const record = hits.get(key) || { count: 0, resetAt: now + decayMinutes * 60000 };

        if (now > record.resetAt) {
            record.count = 0;
            record.resetAt = now + decayMinutes * 60000;
        }

        record.count++;
        hits.set(key, record);

        res.header('X-RateLimit-Limit', maxAttempts);
        res.header('X-RateLimit-Remaining', Math.max(0, maxAttempts - record.count));

        if (record.count > maxAttempts) {
            res.header('Retry-After', Math.ceil((record.resetAt - now) / 1000));
            return res.status(429).json({ message: 'Too Many Attempts.' });
        }

        return next(context);
    }
}

module.exports = RateLimiter;
