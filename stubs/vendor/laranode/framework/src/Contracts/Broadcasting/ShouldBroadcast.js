class ShouldBroadcast {
    /**
     * Get the channels the event should broadcast on.
     *
     * @return {Array}
     */
    broadcastOn() {
        return [];
    }

    /**
     * Get the data to broadcast.
     *
     * @return {Object}
     */
    broadcastWith() {
        return this;
    }

    /**
     * Get the broadcast event name.
     *
     * @return {string}
     */
    broadcastAs() {
        return this.constructor.name;
    }
}

module.exports = ShouldBroadcast;
