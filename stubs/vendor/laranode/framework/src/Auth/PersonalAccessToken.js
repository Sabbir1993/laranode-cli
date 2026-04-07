const Model = use('laranode/Database/Loquent/Model');

class PersonalAccessToken extends Model {
    static table = 'personal_access_tokens';
    static fillable = [
        'name', 'token', 'abilities', 'last_used_at', 'expires_at', 'tokenable_id', 'tokenable_type'
    ];
    static hidden = ['token'];

    constructor(attributes = {}) {
        super(attributes);
    }

    tokenable() {
        return this.morphTo();
    }

    can(ability) {
        let abilities;
        try { abilities = JSON.parse(this.attributes.abilities || '[]'); } catch { abilities = []; }
        if (!Array.isArray(abilities)) return false;
        return abilities.includes('*') || abilities.includes(ability);
    }
}

module.exports = PersonalAccessToken;
