/**
 * Mail notification channel.
 */
class MailChannel {
    constructor(app) {
        this.app = app;
    }

    /**
     * Send the given notification.
     *
     * @param {Object} notifiable
     * @param {Object} notification
     */
    async send(notifiable, notification) {
        if (!notification.toMail) {
            return;
        }

        const message = await notification.toMail(notifiable);

        if (!message) {
            return;
        }

        // Determine recipient
        let recipient;
        if (typeof notifiable.routeNotificationFor === 'function') {
            recipient = notifiable.routeNotificationFor('mail', notification);
        } else {
            recipient = notifiable.email;
        }

        if (!recipient) {
            return;
        }

        const mailer = this.app.make('mailer');
        await mailer.to(recipient).send(message);
    }
}

module.exports = MailChannel;
