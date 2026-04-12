const fs = require('fs');
const path = require('path');
const session = require('express-session');

/**
 * File-based session store for express-session.
 */
class FileSessionStore extends session.Store {
    constructor(options = {}) {
        super();
        this.directory = options.directory || path.join(process.cwd(), 'storage/framework/sessions');

        // Ensure directory exists
        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory, { recursive: true });
        }
    }

    /**
     * Get the file path for a session ID.
     */
    _path(sid) {
        return path.join(this.directory, `${sid}.json`);
    }

    /**
     * Get a session from the store.
     */
    get(sid, callback) {
        const filePath = this._path(sid);

        if (!fs.existsSync(filePath)) {
            return callback(null, null);
        }

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return callback(err);
            
            // Skip empty files or non-JSON content
            if (!data || data.trim() === '') {
                return callback(null, null);
            }

            try {
                const sessionData = JSON.parse(data);
                callback(null, sessionData);
            } catch (e) {
                // If it's not valid JSON, treat it as expired/invalid session rather than crashing
                callback(null, null);
            }
        });
    }

    /**
     * Set a session in the store.
     */
    set(sid, sessionData, callback) {
        const filePath = this._path(sid);
        const data = JSON.stringify(sessionData);

        fs.writeFile(filePath, data, 'utf8', (err) => {
            if (err) {
                console.error(`[FileSessionStore] Failed to write session file ${filePath}:`, err);
            }
            if (callback) callback(err);
        });
    }

    /**
     * Destroy a session.
     */
    destroy(sid, callback) {
        const filePath = this._path(sid);

        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (callback) callback(err);
            });
        } else if (callback) {
            callback();
        }
    }

    /**
     * Refresh the session expiration (Not strictly needed for basic file store).
     */
    touch(sid, sessionData, callback) {
        this.set(sid, sessionData, callback);
    }
}

module.exports = FileSessionStore;
