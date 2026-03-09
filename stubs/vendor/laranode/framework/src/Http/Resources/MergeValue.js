/**
 * This class serves as a signal to the JsonResource serializer
 * to merge the provided properties directly into the parent object.
 */
class MergeValue {
    constructor(data) {
        this.data = data;
    }
}

module.exports = MergeValue;
