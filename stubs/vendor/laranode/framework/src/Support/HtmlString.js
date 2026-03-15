/**
 * HtmlString - Laravel-compatible HTML string wrapper
 * 
 * This class implements the Htmlable interface, allowing HTML content
 * to be safely rendered without escaping when using {{ }} syntax.
 * 
 * Usage:
 *   const HtmlString = use('laranode/Support/HtmlString');
 *   return new HtmlString('<strong>Bold</strong>');
 * 
 * When used with {{ $html }} in templates, it will output raw HTML.
 */

class HtmlString {
    /**
     * Create a new HtmlString instance.
     * @param {string} html 
     */
    constructor(html) {
        this.html = html;
    }

    /**
     * Get the HTML string.
     * @returns {string}
     */
    toHtmlString() {
        return this.html;
    }

    /**
     * Get the HTML string (toString fallback).
     * @returns {string}
     */
    toString() {
        return this.html;
    }
}

module.exports = HtmlString;
