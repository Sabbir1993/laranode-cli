const Event = require('./Event');

class Schedule {
    constructor() {
        this.events = [];
    }

    /**
     * Schedule a command.
     * @param {string} command 
     * @returns {Event}
     */
    command(command) {
        const event = new Event(command);
        this.events.push(event);
        return event;
    }

    /**
     * Schedule a custom closure callback.
     * @param {Function} callback 
     * @returns {Event}
     */
    call(callback) {
        const event = new Event(callback);
        this.events.push(event);
        return event;
    }

    /**
     * Get all due events for a specific date
     * @param {Date} date 
     * @returns {Array<Event>}
     */
    dueEvents(date = new Date()) {
        return this.events.filter(event => event.isDue(date));
    }
}

module.exports = Schedule;
