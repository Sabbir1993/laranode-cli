const { 
    S3Client, 
    PutObjectCommand, 
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    CopyObjectCommand,
    ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');

/**
 * Amazon S3 filesystem driver.
 * Reads and writes files to an S3 bucket.
 */
class S3Driver {
    constructor(config) {
        this.bucket = config.bucket;
        this.urlPrefix = config.url || `https://${this.bucket}.s3.${config.region}.amazonaws.com`;
        
        // Visibility constants (ACLs)
        this.VISIBILITY_PUBLIC = 'public';
        this.VISIBILITY_PRIVATE = 'private';

        // Initialize S3 Client
        const clientConfig = {
            region: config.region,
        };

        if (config.key && config.secret) {
            clientConfig.credentials = {
                accessKeyId: config.key,
                secretAccessKey: config.secret
            };
        }

        if (config.endpoint) {
            clientConfig.endpoint = config.endpoint;
            // Needed for MinIO/DigitalOcean integration
            clientConfig.forcePathStyle = config.use_path_style_endpoint || false;
        }

        this.client = new S3Client(clientConfig);
    }

    /**
     * Map LaraNode visibility to S3 ACL strings
     */
    _parseVisibility(visibility) {
        return visibility === this.VISIBILITY_PUBLIC ? 'public-read' : 'private';
    }

    /**
     * Convert stream to buffer
     */
    async _streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    /**
     * Get the full path for a given file (strip leading slash for S3).
     */
    path(filePath) {
        return filePath.replace(/^\/+/, '');
    }

    /**
     * Write contents to a file.
     */
    async put(filePath, contents, options = {}) {
        const key = this.path(filePath);
        
        // Resolve visibility
        const visibility = typeof options === 'string' ? options : (options.visibility || this.VISIBILITY_PRIVATE);
        
        const uploadParams = {
            Bucket: this.bucket,
            Key: key,
            Body: contents,
        };

        if (visibility !== null) {
            uploadParams.ACL = this._parseVisibility(visibility);
        }

        if (options.contentType) {
            uploadParams.ContentType = options.contentType;
        } else {
            uploadParams.ContentType = await this.mimeType(key);
        }

        try {
            // Use @aws-sdk/lib-storage for seamless multipart uploads for buffers/streams
            const parallelUploads3 = new Upload({
                client: this.client,
                params: uploadParams,
            });

            await parallelUploads3.done();
            return true;
        } catch (e) {
            // If the bucket doesn't support ACLs, retry without it
            if ((e.name === 'AccessControlListNotSupported' || e.code === 'AccessControlListNotSupported') && uploadParams.ACL) {
                delete uploadParams.ACL;
                const retryUpload = new Upload({
                    client: this.client,
                    params: uploadParams,
                });
                await retryUpload.done();
                return true;
            }
            throw e;
        }
    }

    /**
     * Prepend to a file.
     */
    async prepend(filePath, contents) {
        if (await this.exists(filePath)) {
            const current = await this.get(filePath);
            return this.put(filePath, Buffer.from(contents + current));
        }
        return this.put(filePath, contents);
    }

    /**
     * Append to a file.
     */
    async append(filePath, contents) {
        if (await this.exists(filePath)) {
            const current = await this.get(filePath);
            return this.put(filePath, Buffer.from(current + contents));
        }
        return this.put(filePath, contents);
    }

    /**
     * Get the contents of a file as string.
     */
    async get(filePath) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: this.path(filePath)
        });

        try {
            const response = await this.client.send(command);
            const buffer = await this._streamToBuffer(response.Body);
            return buffer.toString('utf8');
        } catch (e) {
            if (e.name === 'NoSuchKey') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw e;
        }
    }

    /**
     * Determine if a file exists.
     */
    async exists(filePath) {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: this.path(filePath)
        });

        try {
            await this.client.send(command);
            return true;
        } catch (e) {
            if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw e;
        }
    }

    /**
     * Determine if a file is missing.
     */
    async missing(filePath) {
        return !(await this.exists(filePath));
    }

    /**
     * Delete a file or array of files.
     */
    async delete(filePath) {
        const paths = Array.isArray(filePath) ? filePath : [filePath];
        
        if (paths.length === 1) {
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: this.path(paths[0])
            });
            await this.client.send(command);
        } else {
            const objects = paths.map(p => ({ Key: this.path(p) }));
            const command = new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: { Objects: objects, Quiet: true }
            });
            await this.client.send(command);
        }

        return true;
    }

    /**
     * Copy a file to a new location.
     */
    async copy(from, to) {
        const command = new CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `/${this.bucket}/${this.path(from)}`,
            Key: this.path(to)
        });
        await this.client.send(command);
        return true;
    }

    /**
     * Move a file to a new location.
     */
    async move(from, to) {
        await this.copy(from, to);
        await this.delete(from);
        return true;
    }

    /**
     * Get the file size in bytes.
     */
    async size(filePath) {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: this.path(filePath)
        });
        const response = await this.client.send(command);
        return response.ContentLength;
    }

    /**
     * Get the file's last modification time.
     */
    async lastModified(filePath) {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: this.path(filePath)
        });
        const response = await this.client.send(command);
        return response.LastModified;
    }

    /**
     * Get an array of all files in a directory.
     */
    async files(directory = '') {
        const prefix = directory ? `${this.path(directory)}/` : '';
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            Delimiter: '/'
        });

        const response = await this.client.send(command);
        if (!response.Contents) return [];
        return response.Contents.map(obj => obj.Key);
    }

    /**
     * Get all files in a directory recursively.
     */
    async allFiles(directory = '') {
        const prefix = directory ? `${this.path(directory)}/` : '';
        let isTruncated = true;
        let continuationToken = undefined;
        const results = [];

        while (isTruncated) {
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken
            });
            
            const response = await this.client.send(command);
            if (response.Contents) {
                results.push(...response.Contents.map(obj => obj.Key));
            }

            isTruncated = response.IsTruncated;
            continuationToken = response.NextContinuationToken;
        }

        return results;
    }

    /**
     * Get all directories within a directory.
     */
    async directories(directory = '') {
        const prefix = directory ? `${this.path(directory)}/` : '';
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            Delimiter: '/'
        });

        const response = await this.client.send(command);
        if (!response.CommonPrefixes) return [];
        
        return response.CommonPrefixes.map(prefixObj => prefixObj.Prefix.replace(/\/$/, ''));
    }

    /**
     * Create a directory (No-op in S3 because directories are just prefixes).
     */
    async makeDirectory(directory) {
        return true;
    }

    /**
     * Delete a directory (Deletes all objects with the prefix).
     */
    async deleteDirectory(directory) {
        const files = await this.allFiles(directory);
        if (files.length > 0) {
            await this.delete(files);
        }
        return true;
    }

    /**
     * Get the URL for a file.
     */
    url(filePath) {
        return `${this.urlPrefix}/${this.path(filePath)}`;
    }

    /**
     * Get the visibility for the given path.
     * S3 doesn't easily expose individual ACLs via HeadObject.
     * Technically we'd need GetObjectAclCommand, but we'll mock or return PRIVATE by default.
     */
    async getVisibility(filePath) {
        return this.VISIBILITY_PRIVATE;
    }

    /**
     * Set the visibility for the given path.
     * Currently unsupported as an active modify step without re-upload/copy setting ACL.
     * Some folks use CopyObject onto itself with new ACL to change it.
     */
    async setVisibility(filePath, visibility) {
        // Not widely implemented directly without CopyObject.
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

module.exports = S3Driver;
