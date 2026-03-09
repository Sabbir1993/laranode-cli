/**
 * LaraNode Event Dispatcher
 *
 * Provides an event-driven architecture matching Laravel's API.
 * Supports listeners, subscribers, and wildcard events.
 */
class Dispatcher {
    constructor(container = null) {
        this.container = container;
        this.listeners = {};
        this.wildcards = {};
    }

    /**
     * Register an event listener with the dispatcher.
     *
     * @param {string|string[]} events
     * @param {Function|string} listener
     */
    listen(events, listener) {
        if (!Array.isArray(events)) {
            events = [events];
        }

        for (const event of events) {
            if (event.includes('*')) {
                this._setupWildcardListen(event, listener);
            } else {
                if (!this.listeners[event]) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(this._makeListener(listener));
            }
        }
    }

    /**
     * Register a wildcard listener.
     * @param {string} event
     * @param {Function} listener
     */
    _setupWildcardListen(event, listener) {
        if (!this.wildcards[event]) {
            this.wildcards[event] = [];
        }
        this.wildcards[event].push(this._makeListener(listener));
    }

    /**
     * Determine if a given event has listeners.
     *
     * @param {string} eventName
     * @returns {boolean}
     */
    hasListeners(eventName) {
        return !!(
            this.listeners[eventName] ||
            this._getWildcardListeners(eventName).length > 0
        );
    }

    /**
     * Register an event subscriber with the dispatcher.
     *
     * @param {Object|Function} subscriber
     */
    subscribe(subscriber) {
        let instance = subscriber;

        if (typeof subscriber === 'function') {
            if (this.container) {
                instance = this.container.make(subscriber);
            } else {
                instance = new subscriber();
            }
        }

        if (typeof instance.subscribe === 'function') {
            instance.subscribe(this);
        }
    }

    /**
     * Dispatch an event and call the listeners.
     *
     * @param {string|Object} event - Event name string or event class instance
     * @param {*} payload - Data to pass to listeners
     * @param {boolean} halt - If true, stop on first non-null response
     * @returns {Promise<Array|null>}
     */
    async dispatch(event, payload = null, halt = false) {
        let eventName;
        let eventPayload;

        // Support event objects (class instances)
        if (typeof event === 'object' && event.constructor && event.constructor.name !== 'Object') {
            eventName = event.constructor.name;
            eventPayload = event;
        } else {
            eventName = event;
            eventPayload = payload;
        }

        const responses = [];
        const listeners = this.getListeners(eventName);

        // Submits the event over WebSockets if it implements ShouldBroadcast
        if (eventPayload && typeof eventPayload.broadcastOn === 'function') {
            try {
                const Broadcast = this.container ? this.container.make('broadcast.manager') : null;
                if (Broadcast) {
                    const channels = eventPayload.broadcastOn() || [];
                    const broadcastName = typeof eventPayload.broadcastAs === 'function' ? eventPayload.broadcastAs() : eventName;
                    const broadcastData = typeof eventPayload.broadcastWith === 'function' ? eventPayload.broadcastWith() : eventPayload;

                    Broadcast.emit(broadcastName, broadcastData, channels);
                }
            } catch (e) {
                console.warn('[Dispatcher] Error broadcasting event:', e.message);
            }
        }

        for (const listener of listeners) {
            const response = await listener(eventName, eventPayload);

            // If halt mode and we got a non-null response, stop
            if (halt && response !== null && response !== undefined) {
                return response;
            }

            // If listener returns false, stop propagation
            if (response === false) {
                break;
            }

            responses.push(response);
        }

        return halt ? null : responses;
    }

    /**
     * Fire an event (alias for dispatch).
     */
    async fire(event, payload = null, halt = false) {
        return this.dispatch(event, payload, halt);
    }

    /**
     * Get all of the listeners for a given event name.
     *
     * @param {string} eventName
     * @returns {Function[]}
     */
    getListeners(eventName) {
        const listeners = this.listeners[eventName] || [];
        const wildcards = this._getWildcardListeners(eventName);
        return [...listeners, ...wildcards];
    }

    /**
     * Get the wildcard listeners for the event.
     *
     * @param {string} eventName
     * @returns {Function[]}
     */
    _getWildcardListeners(eventName) {
        const wildcardListeners = [];

        for (const [pattern, listeners] of Object.entries(this.wildcards)) {
            if (this._matchesWildcard(pattern, eventName)) {
                wildcardListeners.push(...listeners);
            }
        }

        return wildcardListeners;
    }

    /**
     * Check if an event name matches a wildcard pattern.
     */
    _matchesWildcard(pattern, eventName) {
        const regex = new RegExp(
            '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
        );
        return regex.test(eventName);
    }

    /**
     * Wrap a listener into a callable function.
     *
     * @param {Function|string} listener
     * @returns {Function}
     */
    _makeListener(listener) {
        if (typeof listener === 'function') {
            // Check if it's a class (has prototype.handle)
            if (listener.prototype && typeof listener.prototype.handle === 'function') {
                return async (event, payload) => {
                    let instance;
                    if (this.container) {
                        instance = this.container.make(listener);
                    } else {
                        instance = new listener();
                    }
                    return instance.handle(payload);
                };
            }
            // Plain function/closure
            return async (event, payload) => {
                return listener(payload);
            };
        }

        if (typeof listener === 'string') {
            return async (event, payload) => {
                const ListenerClass = use(listener);
                let instance;
                if (this.container) {
                    instance = this.container.make(ListenerClass);
                } else {
                    instance = new ListenerClass();
                }
                return instance.handle(payload);
            };
        }

        throw new Error('Invalid event listener type.');
    }

    /**
     * Remove a set of listeners from the dispatcher.
     *
     * @param {string} event
     */
    forget(event) {
        if (event.includes('*')) {
            delete this.wildcards[event];
        } else {
            delete this.listeners[event];
        }
    }

    /**
     * Forget all of the pushed listeners.
     */
    forgetAll() {
        this.listeners = {};
        this.wildcards = {};
    }
}

module.exports = Dispatcher;
