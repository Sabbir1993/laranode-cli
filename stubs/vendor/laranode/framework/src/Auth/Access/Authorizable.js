const Authorizable = (Base) => class extends Base {
    /**
     * Determine if the entity has the given abilities.
     */
    can(ability, ...args) {
        const Gate = use('laranode/Support/Facades/Gate');
        return Gate.forUser(this).allows(ability, ...args);
    }

    /**
     * Determine if the entity does not have the given abilities.
     */
    canAny(abilities, ...args) {
        const Gate = use('laranode/Support/Facades/Gate');
        return Gate.forUser(this).any(abilities, ...args);
    }

    /**
     * Determine if the entity does not have the given abilities.
     */
    cannot(ability, ...args) {
        const Gate = use('laranode/Support/Facades/Gate');
        return Gate.forUser(this).denies(ability, ...args);
    }
}

module.exports = Authorizable;
