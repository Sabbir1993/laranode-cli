/**
 * SoftDeletes Mixin
 * 
 * Apply to a Model class to enable soft deleting:
 * 
 *   const SoftDeletes = use('laranode/Database/Loquent/SoftDeletes');
 *   class Post extends SoftDeletes(Model) {
 *       // ...
 *   }
 * 
 * Or apply manually:
 *   SoftDeletes.apply(Post);
 */

function SoftDeletes(Base) {
    return class extends Base {
        constructor(attributes = {}) {
            super(attributes);
            this.forceDeleting = false;
        }

        /**
         * Check if the model instance has been soft-deleted.
         */
        trashed() {
            const deletedAt = this.attributes[this.getDeletedAtColumn()];
            return deletedAt !== null && deletedAt !== undefined;
        }

        /**
         * Soft delete the model — sets deleted_at instead of removing the row.
         */
        async delete() {
            if (!this.exists) return false;

            if (this.forceDeleting) {
                const result = await this.constructor.query()
                    .where(this.primaryKey, this.attributes[this.primaryKey])
                    .delete();
                this.exists = false;
                return result > 0;
            }

            const now = new Date().toLocaleString('sv-SE', { timeZone: process.env.TZ || 'Asia/Dhaka' });
            this.attributes[this.getDeletedAtColumn()] = now;

            await this.constructor.query()
                .where(this.primaryKey, this.attributes[this.primaryKey])
                .update({ [this.getDeletedAtColumn()]: now });

            return true;
        }

        /**
         * Force delete — permanently removes the row.
         */
        async forceDelete() {
            this.forceDeleting = true;
            const result = await this.delete();
            this.forceDeleting = false;
            return result;
        }

        /**
         * Restore a soft-deleted model.
         */
        async restore() {
            this.attributes[this.getDeletedAtColumn()] = null;

            await this.constructor.query()
                .where(this.primaryKey, this.attributes[this.primaryKey])
                .update({ [this.getDeletedAtColumn()]: null });

            return true;
        }

        /**
         * Get the deleted_at column name.
         */
        getDeletedAtColumn() {
            return this.constructor.DELETED_AT || 'deleted_at';
        }

        /**
         * Query scope: include soft-deleted records.
         */
        static withTrashed() {
            return this.query(); // No deleted_at filter
        }

        /**
         * Query scope: only soft-deleted records.
         */
        static onlyTrashed() {
            const deletedAtColumn = this.DELETED_AT || 'deleted_at';
            return this.query().whereNotNull(deletedAtColumn);
        }

        /**
         * Override the default query to exclude soft-deleted records.
         */
        static query() {
            const deletedAtColumn = this.DELETED_AT || 'deleted_at';
            return super.query().whereNull(deletedAtColumn);
        }
    };
}

/**
 * Apply SoftDeletes to an existing class (alternative to mixin).
 */
SoftDeletes.apply = function (TargetClass) {
    const proto = SoftDeletes(Object.getPrototypeOf(TargetClass)).prototype;
    const methods = ['trashed', 'delete', 'forceDelete', 'restore', 'getDeletedAtColumn'];
    for (const method of methods) {
        TargetClass.prototype[method] = proto[method];
    }

    const staticMethods = ['withTrashed', 'onlyTrashed'];
    for (const method of staticMethods) {
        const MixedClass = SoftDeletes(Object.getPrototypeOf(TargetClass));
        TargetClass[method] = MixedClass[method];
    }
};

module.exports = SoftDeletes;
