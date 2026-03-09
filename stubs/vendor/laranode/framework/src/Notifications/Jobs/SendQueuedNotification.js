/**
 * Internal job to send a queued notification.
 */
class SendQueuedNotification {
    constructor(notifiables, notification) {
        this.notifiables = notifiables;
        this.notification = notification;
    }

    async handle() {
        const app = use('app');
        const manager = app.make('notification');

        // Bypass queue check
        return await manager._sendNow(this.notifiables, this.notification);
    }
}

module.exports = SendQueuedNotification;
