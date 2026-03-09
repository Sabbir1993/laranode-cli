/**
 * Notifiable Mixin
 * 
 * Provides notification methods to any class (typically a Model).
 */
const Notifiable = (BaseClass) => class extends BaseClass {
    /**
     * Send the given notification.
     *
     * @param {Notification} notification
     */
    async notify(notification) {
        const app = use('app');
        const manager = app.make('notification');
        return await manager.send(this, notification);
    }

    /**
     * Get the entity's notifications. (Requires Database relationship)
     */
    notifications() {
        // This assumes the model has the 'morphMany' setup if using Database notifications
        return this.morphMany('laranode/Notifications/DatabaseNotification', 'notifiable');
    }

    /**
     * Get the entity's unread notifications.
     */
    unreadNotifications() {
        return this.notifications().whereNull('read_at');
    }

    /**
     * Get the broadcast channel name for the notifiable.
     */
    receivesBroadcastNotificationsOn() {
        const className = this.constructor.name;
        const id = this.id || this._id;
        return `${className}.${id}`;
    }
};

module.exports = Notifiable;
