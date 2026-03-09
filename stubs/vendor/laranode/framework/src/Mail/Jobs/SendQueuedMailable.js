/**
 * Internal job to send a queued mailable.
 */
class SendQueuedMailable {
    constructor(mailable) {
        this.mailable = mailable;
    }

    async handle() {
        const app = use('app');
        const mailer = app.make('mailer');

        // We need to bypass the queue check in the mailer to avoid infinite loops
        return await mailer._sendNow(this.mailable);
    }
}

module.exports = SendQueuedMailable;
