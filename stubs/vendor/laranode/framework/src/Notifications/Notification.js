/**
 * Base Notification class.
 */
class Notification {
    /**
     * Get the notification's delivery channels.
     *
     * @param {*} notifiable
     * @returns {string[]}
     */
    via(notifiable) {
        return ['mail'];
    }
}

module.exports = Notification;
