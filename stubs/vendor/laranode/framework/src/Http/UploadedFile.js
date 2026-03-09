const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * UploadedFile class wraps the express-fileupload file object
 * and provides a Laravel-like API for storing files.
 */
class UploadedFile {
    /**
     * @param {Object} file File object from express-fileupload
     */
    constructor(file) {
        this.file = file;
    }

    /**
     * Get the original name of the file
     */
    getClientOriginalName() {
        return this.file.name;
    }

    /**
     * Get the file extension
     */
    getClientOriginalExtension() {
        return path.extname(this.file.name).replace('.', '');
    }

    /**
     * Get the file size in bytes
     */
    getSize() {
        return this.file.size;
    }

    /**
     * Get the mime type
     */
    getMimeType() {
        return this.file.mimetype;
    }

    /**
     * Store the uploaded file on a disk.
     *
     * @param {string} directory 
     * @param {string} disk 
     * @returns {Promise<string>} The path to the stored file
     */
    async store(directory, disk = null) {
        const Storage = use('laranode/Support/Facades/Storage');
        const filesystem = Storage.disk(disk);

        // Generate a unique filename: random-string.extension
        const extension = this.getClientOriginalExtension();
        const hash = crypto.randomBytes(16).toString('hex');
        const filename = `${hash}.${extension}`;

        const targetPath = path.join(directory, filename).replace(/\\/g, '/');

        // LocalDriver put() handles buffer or string
        await filesystem.put(targetPath, this.file.data, {
            visibility: 'public'
        });

        return targetPath;
    }

    /**
     * Move the file to a permanent location (express-fileupload native mv)
     * @param {string} targetPath 
     */
    async mv(targetPath) {
        return new Promise((resolve, reject) => {
            this.file.mv(targetPath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

module.exports = UploadedFile;
