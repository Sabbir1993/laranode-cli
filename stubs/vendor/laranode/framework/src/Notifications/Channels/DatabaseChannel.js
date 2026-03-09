const crypto = require('crypto');

/**
 * Database notification channel.
 */
class DatabaseChannel {
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
        if (!notification.toDatabase && !notification.toArray) {
            return;
        }

        const data = notification.toDatabase
            ? await notification.toDatabase(notifiable)
            : await notification.toArray(notifiable);

        let type = notification.constructor.name;
        if (typeof notification.databaseType === 'function') {
            type = notification.databaseType(notifiable);
        }

        return this._buildRecord(notifiable, type, data);
    }

    /**
     * Insert the notification record into the database.
     */
    async _buildRecord(notifiable, type, data) {
        const DB = this.app.make('db');

        // We assume notifiable is a Loquent Model instance with an 'id' and 'constructor.name'
        const notifiableId = notifiable.id;
        let notifiableType = 'User'; // Default fallback
        if (notifiable.constructor && notifiable.constructor.name !== 'Object') {
            notifiableType = notifiable.constructor.name;
        }

        const payload = {
            id: crypto.randomUUID(),
            type: type,
            notifiable_type: notifiableType,
            notifiable_id: notifiableId,
            data: JSON.stringify(data),
            read_at: null,
            created_at: new Date(),
            updated_at: new Date()
        };

        if (typeof notifiable.routeNotificationFor === 'function') {
            const customPayload = notifiable.routeNotificationFor('database', notification);
            if (customPayload) {
                Object.assign(payload, customPayload);
            }
        }

        await DB.table('notifications').insert(payload);
        return payload;
    }
}

module.exports = DatabaseChannel;
