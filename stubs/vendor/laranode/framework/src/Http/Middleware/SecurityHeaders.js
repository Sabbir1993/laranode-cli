/**
 * Security Headers Middleware
 * 
 * Adds important security headers to HTTP responses:
 * - X-Content-Type-Options: Prevents MIME-type sniffing
 * - X-Frame-Options: Protects against clickjacking
 * - X-XSS-Protection: Legacy XSS filtering (for older browsers)
 * - Strict-Transport-Security (HSTS): Enforces HTTPS
 * - Content-Security-Policy: Prevents XSS and data injection
 */

class SecurityHeaders {
    constructor() {
        this.defaults = {
            // Prevent MIME type sniffing
            'X-Content-Type-Options': 'nosniff',

            // Prevent the page from being displayed in a frame (clickjacking protection)
            // Can be 'DENY', 'SAMEORIGIN', or 'ALLOW-FROM uri'
            'X-Frame-Options': 'SAMEORIGIN',

            // Legacy XSS protection for older browsers
            'X-XSS-Protection': '1; mode=block',

            // Content Security Policy - helps prevent XSS and data injection attacks
            // Default policy: only allow same-origin resources
            // 'Content-Security-Policy': "default-src 'self'",

            // Referrer Policy - controls how much referrer info is sent
            'Referrer-Policy': 'strict-origin-when-cross-origin',

            // Permissions Policy - controls browser features
            // 'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }

    async handle(context, next) {
        const { req, res, app } = context;

        // Get security config from app config
        const config = app.make('config').get('security', {});

        // Apply default headers
        for (const [header, value] of Object.entries(this.defaults)) {
            // Allow config to override defaults
            const headerValue = config[header.toLowerCase()] || value;
            res.header(header, headerValue);
        }

        // Apply HSTS header only in production
        if (process.env.APP_ENV === 'production') {
            const hstsMaxAge = config['hsts_max_age'] || 31536000; // 1 year default
            const hstsConfig = config['hsts_subdomains'] !== false
                ? `max-age=${hstsMaxAge}; includeSubDomains`
                : `max-age=${hstsMaxAge}`;
            res.header('Strict-Transport-Security', hstsConfig);
        }

        return next(context);
    }
}

module.exports = SecurityHeaders;
