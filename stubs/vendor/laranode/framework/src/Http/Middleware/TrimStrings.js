const Middleware = require('./Middleware');

class TrimStrings extends Middleware {
    async handle(context, next) {
        if (context.req.body) {
            this.clean(context.req.body);
        }
        if (context.req.query) {
            this.clean(context.req.query);
        }

        return next(context);
    }

    clean(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.clean(obj[key]);
            }
        }
    }
}

module.exports = TrimStrings;
