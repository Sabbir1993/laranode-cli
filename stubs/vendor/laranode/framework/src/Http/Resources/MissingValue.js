/**
 * This class serves as a marker object to instruct the
 * JsonResource serializer to drop the key entirely.
 */
class MissingValue {
    constructor() {
        this.isMissingValue = true;
    }
}

module.exports = MissingValue;
