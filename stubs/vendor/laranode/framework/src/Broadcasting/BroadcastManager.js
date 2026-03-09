const { Server } = require('socket.io');

class BroadcastManager {
    constructor(app) {
        this.app = app;
        this.io = null;
    }

    /**
     * Attach the Socket.IO server to an active HTTP/HTTPS server instance.
     */
    attach(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`[Broadcast] Socket connected: ${socket.id}`);

            // Allow client to subscribe to specific channels
            socket.on('subscribe', (channel) => {
                socket.join(channel);
                console.log(`[Broadcast] Socket ${socket.id} subscribed to ${channel}`);
            });

            socket.on('unsubscribe', (channel) => {
                socket.leave(channel);
                console.log(`[Broadcast] Socket ${socket.id} unsubscribed from ${channel}`);
            });

            socket.on('disconnect', () => {
                console.log(`[Broadcast] Socket disconnected: ${socket.id}`);
            });
        });

        return this;
    }

    /**
     * Broadcast an event over WebSockets
     * 
     * @param {string} eventName
     * @param {Object} payload 
     * @param {Array} channels 
     */
    emit(eventName, payload, channels = []) {
        if (!this.io) {
            console.warn('[Broadcast] Attempted to emit event but socket.io is not attached to a server.');
            return;
        }

        if (channels && channels.length > 0) {
            for (const channel of channels) {
                this.io.to(channel).emit(eventName, payload);
            }
        } else {
            // Broadcast globally if no specific channel provided
            this.io.emit(eventName, payload);
        }
    }
}

module.exports = BroadcastManager;
