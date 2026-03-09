/**
 * LaraNode Notification Manager
 *
 * Routes notifications through channels (mail, database, etc.)
 */
class NotificationManager {
    constructor(app) {
        this.app = app;
        this.channels = {};
    }

    /**
     * Send the given notification to the given notifiable entities.
     *
     * @param {Object|Array} notifiables
     * @param {Object} notification
     */
    async send(notifiables, notification) {
        const ShouldQueue = require('../Contracts/Queue/ShouldQueue');

        if (notification instanceof ShouldQueue) {
            const queue = this.app.make('queue');
            const SendQueuedNotification = require('./Jobs/SendQueuedNotification');
            return await queue.push(new SendQueuedNotification(notifiables, notification));
        }

        return await this.sendNow(notifiables, notification);
    }

    /**
     * Send the notification immediately.
     */
    async sendNow(notifiables, notification) {
        const entities = Array.isArray(notifiables) ? notifiables : [notifiables];

        for (const notifiable of entities) {
            const channels = this._getChannels(notifiable, notification);

            for (const channelName of channels) {
                const channel = this.channel(channelName);
                if (channel) {
                    await channel.send(notifiable, notification);
                }
            }
        }
    }

    /**
     * Internal alias for sendNow to match Mailer naming convention if needed.
     */
    async _sendNow(notifiables, notification) {
        return this.sendNow(notifiables, notification);
    }

    /**
     * Get a channel instance.
     *
     * @param {string} name
     */
    channel(name) {
        if (!this.channels[name]) {
            this.channels[name] = this._createChannel(name);
        }
        return this.channels[name];
    }

    /**
     * Create a new channel instance.
     */
    _createChannel(name) {
        switch (name) {
            case 'mail':
                const MailChannel = require('./Channels/MailChannel');
                return new MailChannel(this.app);
            case 'database':
                const DatabaseChannel = require('./Channels/DatabaseChannel');
                return new DatabaseChannel(this.app);
            case 'broadcast':
                const BroadcastChannel = require('./Channels/BroadcastChannel');
                return new BroadcastChannel(this.app);
            default:
                throw new Error(`Notification channel [${name}] not supported.`);
        }
    }

    /**
     * Get the channels the notification should be sent via.
     */
    _getChannels(notifiable, notification) {
        if (typeof notification.via === 'function') {
            return notification.via(notifiable);
        }
        return ['mail']; // Default fallback
    }
}

module.exports = NotificationManager;
