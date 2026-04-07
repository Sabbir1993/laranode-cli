const fs = require('fs');
const path = require('path');

/**
 * Local filesystem driver.
 * Reads and writes files to the local disk.
 */
class LocalDriver {
    constructor(config) {
        this.root = config.root;
        this.urlPrefix = config.url || '';

        // Visibility constants
        this.VISIBILITY_PUBLIC = 'public';
        this.VISIBILITY_PRIVATE = 'private';

        // Ensure root exists
        if (!fs.existsSync(this.root)) {
            fs.mkdirSync(this.root, { recursive: true });
        }
    }

    /**
     * Get the full path for a given file.
     * Blocks directory traversal attempts (e.g. ../../etc/passwd).
     */
    path(filePath) {
        const resolved = path.resolve(this.root, filePath);
        const rootResolved = path.resolve(this.root) + path.sep;
        if (!resolved.startsWith(rootResolved) && resolved !== path.resolve(this.root)) {
            throw new Error(`Path traversal attempt blocked: ${filePath}`);
        }
        return resolved;
    }

    /**
     * Write contents to a file.
     */
    async put(filePath, contents, options = {}) {
        const fullPath = this.path(filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (Buffer.isBuffer(contents)) {
            fs.writeFileSync(fullPath, contents);
        } else {
            fs.writeFileSync(fullPath, contents, typeof options === 'string' ? 'utf8' : (options.encoding || 'utf8'));
        }

        if (options.visibility || typeof options === 'string') {
            const visibility = typeof options === 'string' ? options : options.visibility;
            this.setVisibility(filePath, visibility);
        }

        return true;
    }

    /**
     * Prepend to a file.
     */
    async prepend(filePath, contents) {
        if (await this.exists(filePath)) {
            const current = await this.get(filePath);
            return this.put(filePath, contents + current);
        }
        return this.put(filePath, contents);
    }

    /**
     * Append to a file.
     */
    async append(filePath, contents) {
        const fullPath = this.path(filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.appendFileSync(fullPath, contents, 'utf8');
        return true;
    }

    /**
     * Get the contents of a file.
     */
    async get(filePath) {
        const fullPath = this.path(filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        return fs.readFileSync(fullPath, 'utf8');
    }

    /**
     * Determine if a file exists.
     */
    async exists(filePath) {
        return fs.existsSync(this.path(filePath));
    }

    /**
     * Determine if a file is missing.
     */
    async missing(filePath) {
        return !(await this.exists(filePath));
    }

    /**
     * Delete a file.
     */
    async delete(filePath) {
        const paths = Array.isArray(filePath) ? filePath : [filePath];

        for (const p of paths) {
            const fullPath = this.path(p);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        return true;
    }

    /**
     * Copy a file to a new location.
     */
    async copy(from, to) {
        const dir = path.dirname(this.path(to));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.copyFileSync(this.path(from), this.path(to));
        return true;
    }

    /**
     * Move a file to a new location.
     */
    async move(from, to) {
        const dir = path.dirname(this.path(to));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.renameSync(this.path(from), this.path(to));
        return true;
    }

    /**
     * Get the file size in bytes.
     */
    async size(filePath) {
        const stats = fs.statSync(this.path(filePath));
        return stats.size;
    }

    /**
     * Get the file's last modification time.
     */
    async lastModified(filePath) {
        const stats = fs.statSync(this.path(filePath));
        return stats.mtime;
    }

    /**
     * Get an array of all files in a directory.
     */
    async files(directory = '') {
        const fullPath = this.path(directory);
        if (!fs.existsSync(fullPath)) return [];

        return fs.readdirSync(fullPath)
            .filter(f => fs.statSync(path.join(fullPath, f)).isFile());
    }

    /**
     * Get all files in a directory recursively.
     */
    async allFiles(directory = '') {
        const results = [];
        const fullPath = this.path(directory);

        const walk = (dir, prefix = '') => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                    walk(path.join(dir, entry.name), rel);
                } else {
                    results.push(rel);
                }
            }
        };

        walk(fullPath);
        return results;
    }

    /**
     * Get all directories within a directory.
     */
    async directories(directory = '') {
        const fullPath = this.path(directory);
        if (!fs.existsSync(fullPath)) return [];

        return fs.readdirSync(fullPath)
            .filter(f => fs.statSync(path.join(fullPath, f)).isDirectory());
    }

    /**
     * Create a directory.
     */
    async makeDirectory(directory) {
        const fullPath = this.path(directory);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        return true;
    }

    /**
     * Delete a directory.
     */
    async deleteDirectory(directory) {
        const fullPath = this.path(directory);
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        return true;
    }

    /**
     * Get the URL for a file (public disk only).
     */
    url(filePath) {
        if (this.urlPrefix) {
            return `${this.urlPrefix}/${filePath}`.replace(/\/+/g, '/');
        }
        return filePath;
    }

    /**
     * Get the visibility for the given path.
     */
    async getVisibility(filePath) {
        const stats = fs.statSync(this.path(filePath));
        const mode = stats.mode & 0o777;
        return mode === 0o644 || mode === 0o755 ? this.VISIBILITY_PUBLIC : this.VISIBILITY_PRIVATE;
    }

    /**
     * Set the visibility for the given path.
     */
    async setVisibility(filePath, visibility) {
        const fullPath = this.path(filePath);
        const mode = visibility === this.VISIBILITY_PUBLIC ? 0o644 : 0o600;
        fs.chmodSync(fullPath, mode);
        return true;
    }

    /**
     * Get the mime type of a file.
     */
    async mimeType(filePath) {
        const mime = require('mime-types');
        return mime.lookup(this.path(filePath)) || 'application/octet-stream';
    }
}

module.exports = LocalDriver;
