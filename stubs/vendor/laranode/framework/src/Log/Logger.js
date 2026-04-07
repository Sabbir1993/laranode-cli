const fs = require('fs');
const path = require('path');

class Logger {
    constructor(app, channel = null) {
        this.app = app;
        this.channelName = channel;
    }

    /**
     * Get the logging configuration.
     */
    getConfig() {
        return this.app.make('config').get('logging') || {
            default: 'single',
            channels: {
                single: { path: base_path('storage/logs/laranode.log') }
            }
        };
    }

    /**
     * Resolve the channel configuration.
     */
    resolveChannelConfig(channelName) {
        const config = this.getConfig();
        return config.channels[channelName];
    }

    /**
     * Format the log message like Laravel.
     * @param {string} level 
     * @param {string} message 
     * @param {Object} context 
     * @returns {string}
     */
    formatMessage(level, message, context = {}) {
        const date = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
        const env = this.app.make('config').get('app.env', 'local');

        let contextStr = '';
        if (Object.keys(context).length > 0) {
            try {
                contextStr = ' ' + JSON.stringify(context);
            } catch (e) {
                contextStr = ' [Circular/Unserializable Context]';
            }
        }

        return `[${date}] ${env}.${level.toUpperCase()}: ${message}${contextStr}\n`;
    }

    /**
     * Write to a specific file, ensuring the directory exists.
     */
    writeToFile(filePath, content) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.appendFileSync(filePath, content, 'utf8');
    }

    /**
     * Process writing for a specific driver.
     */
    processDriver(channelName, channelConfig, formattedMessage) {
        let basePathLog = channelConfig.path || base_path('storage/logs/laranode.log');
        const driver = channelConfig.driver || 'single';
        const date = new Date();

        if (driver === 'stack') {
            const subChannels = channelConfig.channels || [];
            for (const sub of subChannels) {
                const subConfig = this.resolveChannelConfig(sub);
                if (subConfig) {
                    this.processDriver(sub, subConfig, formattedMessage);
                }
            }
            return;
        }

        let targetPath = basePathLog;
        const ext = path.extname(basePathLog);
        const basename = path.basename(basePathLog, ext); // e.g. laranode
        const dir = path.dirname(basePathLog);

        if (driver === 'daily') {
            const timestamp = date.toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' }).split(' ')[0]; // YYYY-MM-DD
            targetPath = path.join(dir, `${basename}-${timestamp}${ext}`);
        } else if (driver === 'hourly') {
            const localFormat = date.toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
            const timestamp = localFormat.split(' ')[0];
            const hour = localFormat.split(' ')[1].split(':')[0];
            targetPath = path.join(dir, `${basename}-${timestamp}-${hour}${ext}`);
        }

        this.writeToFile(targetPath, formattedMessage);
    }

    emergency(message, context = {}) { this.log('emergency', message, context); }
    alert(message, context = {}) { this.log('alert', message, context); }
    critical(message, context = {}) { this.log('critical', message, context); }
    error(message, context = {}) { this.log('error', message, context); }
    warning(message, context = {}) { this.log('warning', message, context); }
    notice(message, context = {}) { this.log('notice', message, context); }
    info(message, context = {}) { this.log('info', message, context); }
    debug(message, context = {}) { this.log('debug', message, context); }

    /**
     * Log a message at the given level.
     * @param {string} level 
     * @param {string} message 
     * @param {Object} context 
     */
    log(level, message, context = {}) {
        const line = this.formatMessage(level, message, context);

        const config = this.getConfig();
        const activeChannel = this.channelName || config.default || 'single';
        const channelConfig = this.resolveChannelConfig(activeChannel);

        if (channelConfig) {
            this.processDriver(activeChannel, channelConfig, line);
        }
    }

    /**
     * Access a specific logging channel.
     * @param {string} channel 
     * @returns {Logger}
     */
    channel(channel) {
        return new Logger(this.app, channel);
    }
}

module.exports = Logger;
