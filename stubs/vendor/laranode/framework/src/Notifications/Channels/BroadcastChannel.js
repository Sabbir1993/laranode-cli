/**
 * Broadcast channel for notifications.
 */
class BroadcastChannel {
    constructor(app) {
        this.app = app;
    }

    /**
     * Send the given notification.
     *
     * @param {*} notifiable
     * @param {Notification} notification
     */
    async send(notifiable, notification) {
        const data = await this._getData(notifiable, notification);

        const broadcast = this.app.make('broadcast');
        const channel = this._getBroadcastChannelName(notifiable);

        await broadcast.to(channel).emit('notification', {
            type: notification.constructor.name,
            data: data
        });
    }

    /**
     * Get the data for the notification.
     */
    async _getData(notifiable, notification) {
        if (typeof notification.toBroadcast === 'function') {
            return await notification.toBroadcast(notifiable);
        }

        if (typeof notification.toArray === 'function') {
            return await notification.toArray(notifiable);
        }

        throw new Error('Notification is missing toBroadcast or toArray method.');
    }

    /**
     * Get the broadcast channel name for the notifiable.
     */
    _getBroadcastChannelName(notifiable) {
        if (typeof notifiable.receivesBroadcastNotificationsOn === 'function') {
            return notifiable.receivesBroadcastNotificationsOn();
        }

        const className = notifiable.constructor.name;
        const id = notifiable.id || notifiable._id || 'guest';

        return `${className}.${id}`;
    }
}

module.exports = BroadcastChannel;
