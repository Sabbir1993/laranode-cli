const Mailable = require('../Mail/Mailable');

/**
 * Fluent builder for notification emails.
 */
class MailMessage extends Mailable {
    constructor() {
        super();
        this._greeting = null;
        this._salutation = null;
        this._lines = [];
        this._actionText = null;
        this._actionUrl = null;
        this._level = 'info'; // info, success, error
    }

    greeting(greeting) {
        this._greeting = greeting;
        return this;
    }

    salutation(salutation) {
        this._salutation = salutation;
        return this;
    }

    line(line) {
        this._lines.push(line);
        return this;
    }

    action(text, url) {
        this._actionText = text;
        this._actionUrl = url;
        return this;
    }

    success() {
        this._level = 'success';
        return this;
    }

    error() {
        this._level = 'error';
        return this;
    }

    /**
     * Build the Mailable.
     * Note: In a full implementation, this should point to a default notification view.
     * For now we'll format it as basic HTML.
     */
    build() {
        if (this._viewName) {
            return this;
        }

        // Extremely basic default HTML template if no view is provided
        const html = `
            ${this._greeting ? `<h2>${this._greeting}</h2>` : ''}
            ${this._lines.map(l => `<p>${l}</p>`).join('')}
            ${this._actionUrl ? `<p><a href="${this._actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${this._actionText}</a></p>` : ''}
            ${this._salutation ? `<p>${this._salutation}</p>` : ''}
        `;

        const plainText = `
            ${this._greeting || ''}
            ${this._lines.join('\n')}
            ${this._actionUrl ? `${this._actionText}: ${this._actionUrl}` : ''}
            ${this._salutation || ''}
        `.trim();

        return this.html(html).text(plainText);
    }
}

module.exports = MailMessage;
