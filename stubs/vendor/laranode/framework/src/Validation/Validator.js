const MessageBag = use('laranode/Support/MessageBag');

class Validator {
    /**
     * Set of custom static rules.
     */
    static customRules = {};
    static customMessages = {};

    /**
     * Create a new Validator instance.
     * @param {Object} data 
     * @param {Object} rules 
     * @param {Object} messages 
     */
    constructor(data, rules, messages = {}) {
        this.data = data;
        this.rules = rules;
        this.customMessages = messages;
        this._errors = new MessageBag();
        this.validatedData = {};
        this.hasRun = false;

        this.implicitRules = [
            'required', 'required_if', 'required_unless', 'required_with',
            'required_with_all', 'required_without', 'required_without_all',
            'present', 'accepted', 'accepted_if', 'declined', 'declined_if', 'sometimes'
        ];
    }

    /**
     * Built-in validation rules implementation.
     */
    get standardRules() {
        return {
            required: (value) => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'string' && value.trim() === '') return false;
                if (Array.isArray(value) && value.length === 0) return false;
                return true;
            },
            string: (value) => typeof value === 'string',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
            min: (value, min) => {
                if (typeof value === 'string' || Array.isArray(value)) return value.length >= Number(min);
                if (typeof value === 'number') return value >= Number(min);
                return false;
            },
            max: (value, max) => {
                if (typeof value === 'string' || Array.isArray(value)) return value.length <= Number(max);
                if (typeof value === 'number') return value <= Number(max);
                return false;
            },
            numeric: (value) => !isNaN(parseFloat(value)) && isFinite(value),
            boolean: (value) => value === true || value === false || value === 1 || value === 0 || value === '1' || value === '0' || value === 'true' || value === 'false',
            in: (value, ...params) => params.includes(String(value)),
            not_in: (value, ...params) => !params.includes(String(value)),
            integer: (value) => Number.isInteger(Number(value)),
            array: (value) => Array.isArray(value),
            alpha: (value) => /^[a-zA-Z]+$/.test(String(value)),
            alpha_dash: (value) => /^[a-zA-Z0-9_-]+$/.test(String(value)),
            alpha_num: (value) => /^[a-zA-Z0-9]+$/.test(String(value)),
            date: (value) => !isNaN(Date.parse(value)),
            url: (value) => {
                try { new URL(value); return true; } catch (_) { return false; }
            },
            ip: (value) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(String(value)),
            ipv4: (value) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(String(value)),
            ipv6: (value) => /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(String(value)),
            mac_address: (value) => /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(String(value)),
            uuid: (value) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(String(value)),
            uppercase: (value) => String(value) === String(value).toUpperCase(),
            lowercase: (value) => String(value) === String(value).toLowerCase(),
            starts_with: (value, ...params) => params.some(prefix => String(value).startsWith(prefix)),
            ends_with: (value, ...params) => params.some(suffix => String(value).endsWith(suffix)),
            distinct: (value) => Array.isArray(value) && new Set(value).size === value.length,
            digits: (value, length) => /^\d+$/.test(String(value)) && String(value).length === Number(length),
            digits_between: (value, min, max) => /^\d+$/.test(String(value)) && String(value).length >= Number(min) && String(value).length <= Number(max),
            // Database Rules
            exists: async (value, table, column = 'id') => {
                const DB = use('laranode/Support/Facades/DB');
                const count = await DB.table(table).where(column, value).count();
                return count > 0;
            },
            unique: async (value, table, column = 'id', ignoreId = null, idColumn = 'id') => {
                const DB = use('laranode/Support/Facades/DB');
                let query = DB.table(table).where(column, value);
                if (ignoreId && ignoreId !== 'NULL') query = query.where(idColumn, '!=', ignoreId);
                const count = await query.count();
                return count === 0;
            },
            // String Rules
            active_url: async (value) => {
                const dns = require('dns');
                try {
                    const url = new URL(value);
                    return new Promise(resolve => dns.lookup(url.hostname, err => resolve(!err)));
                } catch { return false; }
            },
            ascii: (value) => /^[\x00-\x7F]*$/.test(String(value)),
            hex_color: (value) => /^#?(?:[0-9a-fA-F]{3}){1,2}$/.test(String(value)),
            json: (value) => { try { JSON.parse(value); return true; } catch { return false; } },
            same: (value, otherField, { data }) => String(value) === String(data[otherField]),
            different: (value, otherField, { data }) => String(value) !== String(data[otherField]),
            ulid: (value) => /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(String(value)),
            confirmed: (value, ...params) => {
                const { attribute, data } = params.pop();
                return String(value) === String(data[attribute + '_confirmation']);
            },
            // Numeric & Size Rules
            between: (value, min, max) => {
                if (typeof value === 'string' || Array.isArray(value)) return value.length >= Number(min) && value.length <= Number(max);
                if (typeof value === 'number') return value >= Number(min) && value <= Number(max);
                return false;
            },
            decimal: (value, minDigits, maxDigits) => {
                const str = String(value);
                if (!/^-?\d+(\.\d+)?$/.test(str)) return false;
                const decimals = str.includes('.') ? str.split('.')[1].length : 0;
                if (maxDigits !== undefined) return decimals >= Number(minDigits) && decimals <= Number(maxDigits);
                return decimals === Number(minDigits);
            },
            gt: (value, otherField, { data }) => Number(value) > Number(data[otherField]),
            gte: (value, otherField, { data }) => Number(value) >= Number(data[otherField]),
            lt: (value, otherField, { data }) => Number(value) < Number(data[otherField]),
            lte: (value, otherField, { data }) => Number(value) <= Number(data[otherField]),
            size: (value, size) => {
                if (typeof value === 'string' || Array.isArray(value)) return value.length === Number(size);
                if (typeof value === 'number') return String(value).length === Number(size);
                return false;
            },
            multiple_of: (value, multiplier) => Number(value) % Number(multiplier) === 0,
            // Conditional Rules
            required_if: (value, otherField, targetValue, { data }) => {
                if (String(data[otherField]) === String(targetValue)) return value !== null && value !== undefined && value !== '';
                return true;
            },
            required_unless: (value, otherField, targetValue, { data }) => {
                if (String(data[otherField]) !== String(targetValue)) return value !== null && value !== undefined && value !== '';
                return true;
            },
            required_with: (value, otherField, { data }) => {
                if (data[otherField] !== undefined && data[otherField] !== null && data[otherField] !== '') return value !== null && value !== undefined && value !== '';
                return true;
            },
            prohibited_if: (value, otherField, targetValue, { data }) => {
                if (String(data[otherField]) === String(targetValue)) return value === null || value === undefined || value === '';
                return true;
            },
            missing_with: (value, otherField, { data }) => {
                if (data[otherField] !== undefined && data[otherField] !== null && data[otherField] !== '') return value === null || value === undefined || value === '';
                return true;
            },
            present: (value, ...params) => {
                const { attribute, data } = params.pop();
                return data.hasOwnProperty(attribute);
            },
            // Date Rules
            after: (value, date) => new Date(value) > new Date(date),
            before: (value, date) => new Date(value) < new Date(date),
            date_format: (value, format) => !isNaN(Date.parse(value)),
            timezone: (value) => {
                try { Intl.DateTimeFormat(undefined, { timeZone: value }); return true; } catch { return false; }
            },
            // File Rules
            file: (value) => value && typeof value === 'object' && value.name,
            image: (value) => value && typeof value === 'object' && value.mimetype && value.mimetype.startsWith('image/'),
            mimes: (value, ...extensions) => {
                if (!value || typeof value !== 'object' || !value.name) return false;
                extensions.pop(); // remove {attribute, data}
                const ext = value.name.split('.').pop().toLowerCase();
                return extensions.includes(ext);
            },
            mimetypes: (value, ...types) => {
                if (!value || typeof value !== 'object' || !value.mimetype) return false;
                types.pop();
                return types.includes(value.mimetype);
            },
            extensions: (value, ...extensions) => {
                if (!value || typeof value !== 'object' || !value.name) return false;
                extensions.pop();
                const ext = value.name.split('.').pop().toLowerCase();
                return extensions.includes(ext);
            },
            dimensions: async (value, ...params) => true,

            // ---- Acceptance ----
            accepted: (value) => [true, 'true', 1, '1', 'yes', 'on'].includes(value),
            accepted_if: (value, otherField, targetValue, { data }) => {
                if (String(data[otherField]) === String(targetValue)) return [true, 'true', 1, '1', 'yes', 'on'].includes(value);
                return true;
            },
            declined: (value) => [false, 'false', 0, '0', 'no', 'off'].includes(value),
            declined_if: (value, otherField, targetValue, { data }) => {
                if (String(data[otherField]) === String(targetValue)) return [false, 'false', 0, '0', 'no', 'off'].includes(value);
                return true;
            },

            // ---- String extras ----
            doesnt_start_with: (value, ...params) => params.every(prefix => !String(value).startsWith(prefix)),
            doesnt_end_with: (value, ...params) => params.every(suffix => !String(value).endsWith(suffix)),
            regex: (value, pattern) => new RegExp(pattern.replace(/^\/|\/(\w*)$/g, '')).test(String(value)),
            not_regex: (value, pattern) => !new RegExp(pattern.replace(/^\/|\/(\w*)$/g, '')).test(String(value)),
            filled: (value) => value !== null && value !== undefined && value !== '',

            // ---- Numeric extras ----
            max_digits: (value, max) => /^\d+$/.test(String(value)) && String(value).replace('-', '').length <= Number(max),
            min_digits: (value, min) => /^\d+$/.test(String(value)) && String(value).replace('-', '').length >= Number(min),

            // ---- Array extras ----
            list: (value) => Array.isArray(value) && Object.keys(value).every((k, i) => Number(k) === i),
            contains: (value, ...params) => {
                params = params.filter(p => typeof p === 'string');
                if (!Array.isArray(value)) return false;
                return params.every(p => value.includes(p));
            },
            in_array: (value, otherField, { data }) => {
                const other = data[otherField];
                if (!Array.isArray(other)) return false;
                return other.includes(value);
            },
            required_array_keys: (value, ...keys) => {
                keys = keys.filter(k => typeof k === 'string');
                if (!Array.isArray(value) && typeof value !== 'object') return false;
                return keys.every(k => Object.prototype.hasOwnProperty.call(value, k));
            },

            // ---- Date extras ----
            after_or_equal: (value, date) => new Date(value) >= new Date(date),
            before_or_equal: (value, date) => new Date(value) <= new Date(date),
            date_equals: (value, date) => new Date(value).toDateString() === new Date(date).toDateString(),

            // ---- Exclusion rules (return true; actual exclusion is handled in validate()) ----
            exclude: () => true,
            exclude_if: (value, otherField, targetValue, { data }) => true,
            exclude_unless: (value, otherField, targetValue, { data }) => true,
            exclude_with: (value, otherField, { data }) => true,
            exclude_without: (value, otherField, { data }) => true,

            // ---- Prohibition extras ----
            prohibited: (value) => value === null || value === undefined || value === '',
            prohibited_unless: (value, otherField, targetValue, { data }) => {
                if (String(data[otherField]) !== String(targetValue)) return value === null || value === undefined || value === '';
                return true;
            },
            prohibits: (value, otherField, { data }) => {
                if (value !== null && value !== undefined && value !== '') {
                    return data[otherField] === null || data[otherField] === undefined || data[otherField] === '';
                }
                return true;
            },

            // ---- Missing extras ----
            missing: (value, ...params) => {
                const { attribute, data } = params.pop();
                return !Object.prototype.hasOwnProperty.call(data, attribute);
            },
            missing_if: (value, otherField, targetValue, { data, attribute }) => {
                if (String(data[otherField]) === String(targetValue)) return !Object.prototype.hasOwnProperty.call(data, attribute);
                return true;
            },
            missing_unless: (value, otherField, targetValue, { data, attribute }) => {
                if (String(data[otherField]) !== String(targetValue)) return !Object.prototype.hasOwnProperty.call(data, attribute);
                return true;
            },
            missing_with_all: (value, ...params) => {
                const ctx = params.pop();
                const fields = params;
                const allPresent = fields.every(f => ctx.data[f] !== undefined && ctx.data[f] !== null && ctx.data[f] !== '');
                if (allPresent) return value === null || value === undefined || value === '';
                return true;
            },

            // ---- Present extras ----
            present_if: (value, otherField, targetValue, { data, attribute }) => {
                if (String(data[otherField]) === String(targetValue)) return Object.prototype.hasOwnProperty.call(data, attribute);
                return true;
            },
            present_unless: (value, otherField, targetValue, { data, attribute }) => {
                if (String(data[otherField]) !== String(targetValue)) return Object.prototype.hasOwnProperty.call(data, attribute);
                return true;
            },
            present_with: (value, otherField, { data, attribute }) => {
                if (data[otherField] !== undefined && data[otherField] !== null && data[otherField] !== '') {
                    return Object.prototype.hasOwnProperty.call(data, attribute);
                }
                return true;
            },
            present_with_all: (value, ...params) => {
                const ctx = params.pop();
                const fields = params;
                const allPresent = fields.every(f => ctx.data[f] !== undefined && ctx.data[f] !== null && ctx.data[f] !== '');
                if (allPresent) return Object.prototype.hasOwnProperty.call(ctx.data, ctx.attribute);
                return true;
            },

            // ---- Required extras ----
            required_if_accepted: (value, otherField, { data }) => {
                const other = data[otherField];
                if ([true, 'true', 1, '1', 'yes', 'on'].includes(other)) return value !== null && value !== undefined && value !== '';
                return true;
            },
            required_if_declined: (value, otherField, { data }) => {
                const other = data[otherField];
                if ([false, 'false', 0, '0', 'no', 'off'].includes(other)) return value !== null && value !== undefined && value !== '';
                return true;
            },
            required_with_all: (value, ...params) => {
                const ctx = params.pop();
                const fields = params;
                const allPresent = fields.every(f => ctx.data[f] !== undefined && ctx.data[f] !== null && ctx.data[f] !== '');
                if (allPresent) return value !== null && value !== undefined && value !== '';
                return true;
            },
            required_without: (value, otherField, { data }) => {
                if (data[otherField] === undefined || data[otherField] === null || data[otherField] === '') {
                    return value !== null && value !== undefined && value !== '';
                }
                return true;
            },
            required_without_all: (value, ...params) => {
                const ctx = params.pop();
                const fields = params;
                const allMissing = fields.every(f => ctx.data[f] === undefined || ctx.data[f] === null || ctx.data[f] === '');
                if (allMissing) return value !== null && value !== undefined && value !== '';
                return true;
            },

            // ---- Auth Rule ----
            current_password: async (value, ...params) => {
                const Auth = use('laranode/Support/Facades/Auth');
                const Hash = use('laranode/Support/Facades/Hash');
                try {
                    const user = Auth.user();
                    if (!user) return false;
                    return await Hash.check(value, user.password);
                } catch { return false; }
            },

            // ---- Enum Rule ----
            enum: (value, enumClass) => {
                if (typeof enumClass === 'object' && enumClass !== null) {
                    return Object.values(enumClass).includes(value);
                }
                return false;
            },
        };
    }

    /**
     * Default error messages.
     */
    get defaultMessages() {
        return {
            required: 'The :attribute field is required.',
            string: 'The :attribute must be a string.',
            email: 'The :attribute must be a valid email address.',
            min: 'The :attribute must be at least :min.',
            max: 'The :attribute may not be greater than :max.',
            numeric: 'The :attribute must be a number.',
            boolean: 'The :attribute field must be true or false.',
            in: 'The selected :attribute is invalid.',
            not_in: 'The selected :attribute is invalid.',
            integer: 'The :attribute must be an integer.',
            array: 'The :attribute must be an array.',
            alpha: 'The :attribute may only contain letters.',
            alpha_dash: 'The :attribute may only contain letters, numbers, dashes and underscores.',
            alpha_num: 'The :attribute may only contain letters and numbers.',
            date: 'The :attribute is not a valid date.',
            url: 'The :attribute format is invalid.',
            ip: 'The :attribute must be a valid IP address.',
            ipv4: 'The :attribute must be a valid IPv4 address.',
            ipv6: 'The :attribute must be a valid IPv6 address.',
            mac_address: 'The :attribute must be a valid MAC address.',
            uuid: 'The :attribute must be a valid UUID.',
            uppercase: 'The :attribute must be uppercase.',
            lowercase: 'The :attribute must be lowercase.',
            starts_with: 'The :attribute must start with one of the following: :values.',
            ends_with: 'The :attribute must end with one of the following: :values.',
            distinct: 'The :attribute field has a duplicate value.',
            digits: 'The :attribute must be :length digits.',
            digits_between: 'The :attribute must be between :min and :max digits.',
            exists: 'The selected :attribute is invalid.',
            unique: 'The :attribute has already been taken.',
            active_url: 'The :attribute is not a valid URL.',
            ascii: 'The :attribute must only contain single-byte alphanumeric characters and symbols.',
            hex_color: 'The :attribute must be a valid hex color.',
            json: 'The :attribute must be a valid JSON string.',
            same: 'The :attribute and :other must match.',
            different: 'The :attribute and :other must be different.',
            ulid: 'The :attribute must be a valid ULID.',
            confirmed: 'The :attribute confirmation does not match.',
            between: 'The :attribute must be between :min and :max.',
            decimal: 'The :attribute must have between :min and :max decimal places.',
            gt: 'The :attribute must be greater than :other.',
            gte: 'The :attribute must be greater than or equal to :other.',
            lt: 'The :attribute must be less than :other.',
            lte: 'The :attribute must be less than or equal to :other.',
            size: 'The :attribute must be exactly :size.',
            multiple_of: 'The :attribute must be a multiple of :multiple.',
            required_if: 'The :attribute field is required when :other is :value.',
            required_unless: 'The :attribute field is required unless :other is in :values.',
            required_with: 'The :attribute field is required when :values is present.',
            prohibited_if: 'The :attribute field is prohibited when :other is :value.',
            missing_with: 'The :attribute field must be missing when :values is present.',
            present: 'The :attribute field must be present.',
            after: 'The :attribute must be a date after :date.',
            before: 'The :attribute must be a date before :date.',
            date_format: 'The :attribute does not match the format :format.',
            timezone: 'The :attribute must be a valid timezone.',
            file: 'The :attribute must be a file.',
            image: 'The :attribute must be an image.',
            mimes: 'The :attribute must be a file of type: :values.',
            mimetypes: 'The :attribute must be a file of type: :values.',
            extensions: 'The :attribute must have one of the following extensions: :values.',
            dimensions: 'The :attribute has invalid image dimensions.',
            accepted: 'The :attribute must be accepted.',
            accepted_if: 'The :attribute must be accepted when :other is :value.',
            declined: 'The :attribute must be declined.',
            declined_if: 'The :attribute must be declined when :other is :value.',
            doesnt_start_with: 'The :attribute must not start with one of the following: :values.',
            doesnt_end_with: 'The :attribute must not end with one of the following: :values.',
            regex: 'The :attribute format is invalid.',
            not_regex: 'The :attribute format is invalid.',
            filled: 'The :attribute must have a value.',
            max_digits: 'The :attribute must not have more than :max digits.',
            min_digits: 'The :attribute must have at least :min digits.',
            list: 'The :attribute must be a list.',
            contains: 'The :attribute must contain all of the following: :values.',
            in_array: 'The :attribute does not exist in :other.',
            required_array_keys: 'The :attribute must contain entries for: :values.',
            after_or_equal: 'The :attribute must be a date after or equal to :date.',
            before_or_equal: 'The :attribute must be a date before or equal to :date.',
            date_equals: 'The :attribute must be a date equal to :date.',
            exclude: '',
            exclude_if: '',
            exclude_unless: '',
            exclude_with: '',
            exclude_without: '',
            prohibited: 'The :attribute field is prohibited.',
            prohibited_unless: 'The :attribute field is prohibited unless :other is in :values.',
            prohibits: 'The :attribute field prohibits :other from being present.',
            missing: 'The :attribute field must be missing.',
            missing_if: 'The :attribute field must be missing when :other is :value.',
            missing_unless: 'The :attribute field must be missing unless :other is :value.',
            missing_with_all: 'The :attribute field must be missing when :values are present.',
            present_if: 'The :attribute field must be present when :other is :value.',
            present_unless: 'The :attribute field must be present unless :other is :value.',
            present_with: 'The :attribute field must be present when :values is present.',
            present_with_all: 'The :attribute field must be present when :values are present.',
            required_if_accepted: 'The :attribute field is required when :other is accepted.',
            required_if_declined: 'The :attribute field is required when :other is declined.',
            required_with_all: 'The :attribute field is required when :values are present.',
            required_without: 'The :attribute field is required when :other is not present.',
            required_without_all: 'The :attribute field is required when none of :values are present.',
            current_password: 'The :attribute is incorrect.',
            enum: 'The selected :attribute is invalid.',
        };
    }

    /**
     * Run the validator's rules asynchronously.
     */
    async validate() {
        if (this.hasRun) return !this._errors.isEmpty();

        const explodedRules = {};
        for (const [attribute, ruleConfig] of Object.entries(this.rules)) {
            if (attribute.includes('*')) {
                const parts = attribute.split('.');
                const firstWildcardIndex = parts.indexOf('*');
                const parentPath = parts.slice(0, firstWildcardIndex).join('.');
                const parentData = this.getValue(parentPath);

                if (Array.isArray(parentData)) {
                    parentData.forEach((_, index) => {
                        const concretePath = parts.map((p, i) => i === firstWildcardIndex ? index : p).join('.');
                        // Keep track of the original wildcard path for error message lookup
                        if (!this._wildcardMappings) this._wildcardMappings = {};
                        this._wildcardMappings[concretePath] = attribute;
                        explodedRules[concretePath] = ruleConfig;
                    });
                }
                continue;
            }
            explodedRules[attribute] = ruleConfig;
        }

        for (const [attribute, ruleConfig] of Object.entries(explodedRules)) {
            const rulesArray = typeof ruleConfig === 'string' ? ruleConfig.split('|') : ruleConfig;
            let bail = false;

            for (const item of rulesArray) {
                if (bail) break;

                const value = this.getValue(attribute);

                // If it's a Closure rule
                if (typeof item === 'function') {
                    let failedMessage = null;
                    const fail = (msg) => { failedMessage = msg; };

                    await item(attribute, value, fail);

                    if (failedMessage) {
                        this._errors.add(attribute, failedMessage);
                        if (rulesArray.includes('bail')) bail = true;
                    } else {
                        this.validatedData[attribute] = value;
                    }
                    continue;
                }

                // If it's a Custom Rule Class object
                if (typeof item === 'object' && typeof item.passes === 'function' && typeof item.message === 'function') {
                    const passed = await item.passes(attribute, value);
                    if (!passed) {
                        let message = item.message();
                        message = message.replace(':attribute', attribute.replace(/_/g, ' '));
                        this._errors.add(attribute, message);
                        if (rulesArray.includes('bail')) bail = true;
                    } else {
                        this.validatedData[attribute] = value;
                    }
                    continue;
                }

                // Otherwise, it's a standard string rule like 'max:255'
                const [ruleStr, paramStr] = item.split(':');
                const rule = ruleStr.trim();
                const params = paramStr ? paramStr.split(',').map(p => p.trim()) : [];

                if (rule === 'bail') {
                    continue;
                }

                if (rule === 'nullable' && (value === null || value === undefined)) {
                    bail = true;
                    continue;
                }

                // If it's empty, we only validate implicit rules
                const isEmpty = value === undefined || value === null || value === '';
                if (isEmpty && !this.implicitRules.includes(rule)) {
                    continue;
                }

                const customRuleFn = Validator.customRules[rule];

                if (this.standardRules[rule] || customRuleFn) {
                    const ruleFn = this.standardRules[rule] || customRuleFn;
                    const passed = await ruleFn(value, ...params, { attribute, data: this.data });
                    if (!passed) {
                        this.addError(attribute, rule, params);
                        // Implicit required rule or bail specifies stopping
                        if (this.implicitRules.includes(rule) || rulesArray.includes('bail')) {
                            bail = true;
                        }
                    } else {
                        // If an implicit rule passes on an empty value, we still don't want to run other non-implicit rules on that empty value usually, 
                        // unless it's 'sometimes'. Actually Laravel's behavior is: if it's empty and not required, we don't run other rules.
                        // We handled this with the `continue` above for non-implicit rules when empty!
                        this.validatedData[attribute] = value;
                    }
                }
            }
        }

        this.hasRun = true;
    }

    /**
     * Check if validation passes.
     * @returns {Promise<boolean>}
     */
    async passes() {
        await this.validate();
        return this._errors.isEmpty();
    }

    /**
     * Check if validation fails.
     * @returns {Promise<boolean>}
     */
    async fails() {
        return !(await this.passes());
    }

    /**
     * Get the validated data.
     * @returns {Promise<Object>}
     */
    async validated() {
        if (!this.hasRun) await this.validate();
        return this.validatedData;
    }

    /**
     * Get the error message bag.
     * @returns {Promise<MessageBag>}
     */
    async errors() {
        if (!this.hasRun) await this.validate();
        return this._errors;
    }

    /**
     * Get value from nested data struct using dot notation.
     * @param {string} attribute 
     * @returns {*}
     */
    getValue(attribute) {
        if (!attribute.includes('.')) {
            return this.data[attribute];
        }

        return attribute.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, this.data);
    }

    /**
     * Add an error message to the bag.
     * @param {string} attribute 
     * @param {string} rule 
     * @param {Array} params 
     */
    addError(attribute, rule, params) {
        const wildcardPath = this._wildcardMappings ? this._wildcardMappings[attribute] : null;

        let message = this.customMessages[`${attribute}.${rule}`] ||
            this.customMessages[attribute] ||
            (wildcardPath ? (this.customMessages[`${wildcardPath}.${rule}`] || this.customMessages[wildcardPath]) : null) ||
            Validator.customMessages[rule];

        if (!message && typeof __ === 'function') {
            const transKey = `validation.${rule}`;
            const translated = __(transKey, { attribute, min: params[0], max: params[0] });
            if (translated !== transKey) {
                message = translated;
            }
        }

        if (!message) {
            message = this.defaultMessages[rule] || `The :attribute field is invalid.`;
        }

        // Replace placeholders
        message = message.replace(':attribute', attribute.replace(/_/g, ' '));

        if (params.length > 0) {
            if (rule === 'min') message = message.replace(':min', params[0]);
            if (rule === 'max') message = message.replace(':max', params[0]);
            if (['same', 'different', 'gt', 'gte', 'lt', 'lte', 'required_if', 'required_unless', 'prohibited_if'].includes(rule)) {
                message = message.replace(':other', params[0]);
            }
            if (['required_if', 'prohibited_if'].includes(rule) && params.length > 1) {
                message = message.replace(':value', params[1]);
            }
            if (['mimes', 'mimetypes', 'extensions', 'required_unless', 'required_with', 'missing_with'].includes(rule)) {
                message = message.replace(':values', params.join(', '));
            }
            if (rule === 'size') message = message.replace(':size', params[0]);
            if (rule === 'multiple_of') message = message.replace(':multiple', params[0]);
            if (rule === 'decimal') {
                message = message.replace(':min', params[0]);
                message = message.replace(':max', params[1] || params[0]);
            }
            if (rule === 'between') {
                message = message.replace(':min', params[0]);
                message = message.replace(':max', params[1]);
            }
            if (['after', 'before'].includes(rule)) message = message.replace(':date', params[0]);
            if (rule === 'date_format') message = message.replace(':format', params[0]);
        }

        this._errors.add(attribute, message);
    }

    /**
     * Create a new Validator instance statically.
     * @param {Object} data 
     * @param {Object} rules 
     * @param {Object} messages 
     * @returns {Validator}
     */
    static make(data, rules, messages = {}) {
        return new Validator(data, rules, messages);
    }

    /**
     * Extend validator with a custom rule.
     * @param {string} name 
     * @param {Function} callback 
     * @param {string} message 
     */
    static extend(name, callback, message = null) {
        Validator.customRules[name] = callback;
        if (message) {
            Validator.customMessages[name] = message;
        }
    }
}

module.exports = Validator;
