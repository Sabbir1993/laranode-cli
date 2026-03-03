class Pipeline {
    constructor(app = null) {
        this.app = app;
        this.passable = null;
        this.pipes = [];
    }

    /**
     * Set the object being sent through the pipeline.
     * @param {*} passable 
     * @returns {Pipeline}
     */
    send(passable) {
        this.passable = passable;
        return this;
    }

    /**
     * Set the array of pipes.
     * @param {Array} pipes 
     * @returns {Pipeline}
     */
    through(pipes) {
        this.pipes = pipes;
        return this;
    }

    /**
     * Run the pipeline with a final destination callback.
     * @param {Function} destination 
     * @returns {Promise}
     */
    async then(destination) {
        let pipeline = this.pipes.reduceRight((next, pipe) => {
            return async (passable) => {
                // If it's a pre-resolved alias object with parameters
                if (typeof pipe === 'object' && pipe.isResolvedPipe) {
                    let instance;
                    if (typeof pipe.instance === 'function') {
                        if (pipe.instance.prototype && pipe.instance.prototype.handle) {
                            instance = new pipe.instance();
                        } else {
                            return pipe.instance(passable, next, ...pipe.params);
                        }
                    } else {
                        instance = pipe.instance;
                    }
                    return instance.handle(passable, next, ...pipe.params);
                }

                // If pipe is a string, resolve middleware from container
                if (typeof pipe === 'string') {
                    const [name, parameters] = this.parsePipeString(pipe);
                    const instance = this.app ? this.app.make(name) : new (require(name))();
                    return instance.handle(passable, next, ...parameters);
                }

                // If it's a function (closure)
                if (typeof pipe === 'function' && !pipe.prototype?.handle) {
                    return pipe(passable, next);
                }

                // If it's a class/instance with a handle method
                const instance = typeof pipe === 'function' ? new pipe() : pipe;
                return instance.handle(passable, next);
            };
        }, destination);

        return pipeline(this.passable);
    }

    /**
     * Parse full pipe string to get name and parameters.
     * @param {string} pipe 
     * @returns {Array}
     */
    parsePipeString(pipe) {
        let [name, parameters] = pipe.split(':');
        parameters = parameters ? parameters.split(',') : [];
        return [name, parameters];
    }
}

module.exports = Pipeline;
