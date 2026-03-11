const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Str {
    static studly(value) {
        return value.replace(/[-_ \.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toUpperCase());
    }

    static camel(value) {
        return value.replace(/[-_ \.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toLowerCase());
    }

    static snake(value) {
        return value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
    }

    static plural(value) {
        // very simplified pluralizer for MVP
        if (value.endsWith('y')) return value.slice(0, -1) + 'ies';
        if (value.endsWith('s')) return value + 'es';
        return value + 's';
    }

    static singular(value) {
        // very simplified singularizer for MVP
        if (value.endsWith('ies')) return value.slice(0, -3) + 'y';
        if (value.endsWith('ses')) return value.slice(0, -2);
        if (value.endsWith('s')) return value.slice(0, -1);
        return value;
    }

    static kebab(value) {
        return Str.snake(value).replace(/_/g, '-');
    }

    static slug(title, separator = '-') {
        if (!title) return '';
        return title
            .toString()
            .toLowerCase()
            .replace(/\s+/g, separator)           // Replace spaces with separator
            .replace(/[^\w\-]+/g, '')             // Remove all non-word chars
            .replace(/\-\-+/g, separator)         // Replace multiple separators with single separator
            .replace(/^-+/, '')                   // Trim separators from start
            .replace(/-+$/, '');                  // Trim separators from end
    }

    static title(value) {
        if (!value) return '';
        return value.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    static ucfirst(value) {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    static limit(value, limit = 100, end = '...') {
        if (!value) return '';
        if (value.length <= limit) return value;
        return value.substring(0, limit).trimEnd() + end;
    }

    static words(value, words = 100, end = '...') {
        if (!value) return '';
        const arr = value.split(/\s+/);
        if (arr.length <= words) return value;
        return arr.slice(0, words).join(' ') + end;
    }

    static contains(haystack, needles) {
        if (!Array.isArray(needles)) needles = [needles];
        return needles.some(needle => haystack.includes(needle));
    }

    static is(pattern, value) {
        if (!Array.isArray(pattern)) pattern = [pattern];

        return pattern.some(pat => {
            if (pat === value) return true;
            // Escape special regex characters except *
            pat = pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
            const regex = new RegExp(`^${pat}$`);
            return regex.test(value);
        });
    }

    static random(length = 16) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static uuid() {
        return crypto.randomUUID();
    }

    static startsWith(haystack, needles) {
        if (haystack === null || haystack === undefined) return false;
        if (!Array.isArray(needles)) needles = [needles];
        return needles.some(needle => haystack.toString().startsWith(needle));
    }

    static endsWith(haystack, needles) {
        if (haystack === null || haystack === undefined) return false;
        if (!Array.isArray(needles)) needles = [needles];
        return needles.some(needle => haystack.toString().endsWith(needle));
    }

    static lower(value) {
        return (value === null || value === undefined) ? '' : value.toString().toLowerCase();
    }

    static upper(value) {
        return (value === null || value === undefined) ? '' : value.toString().toUpperCase();
    }

    static length(value) {
        return (value === null || value === undefined) ? 0 : value.toString().length;
    }

    static substr(string, start, length = null) {
        if (string === null || string === undefined) return '';
        string = string.toString();
        if (length === null) {
            return string.substring(start);
        }
        return string.substring(start, start + length);
    }

    static replaceFirst(search, replace, subject) {
        if (subject === null || subject === undefined) return '';
        subject = subject.toString();
        const pos = subject.indexOf(search);
        if (pos !== -1) {
            return subject.substring(0, pos) + replace + subject.substring(pos + search.length);
        }
        return subject;
    }

    static replaceLast(search, replace, subject) {
        if (subject === null || subject === undefined) return '';
        subject = subject.toString();
        const pos = subject.lastIndexOf(search);
        if (pos !== -1) {
            return subject.substring(0, pos) + replace + subject.substring(pos + search.length);
        }
        return subject;
    }
}

module.exports = Str;
