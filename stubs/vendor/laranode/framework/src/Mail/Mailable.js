/**
 * Base Mailable class.
 *
 * Users extend this class and define build() to configure
 * the email (from, subject, view, attachments, etc.).
 *
 * @example
 * class WelcomeMail extends Mailable {
 *     constructor(user) { super(); this.user = user; }
 *     build() {
 *         return this.from('hello@app.com')
 *             .subject('Welcome!')
 *             .view('emails.welcome', { user: this.user });
 *     }
 * }
 */
class Mailable {
    constructor() {
        this._from = null;
        this._to = [];
        this._cc = [];
        this._bcc = [];
        this._replyTo = null;
        this._subject = '';
        this._viewName = null;
        this._viewData = {};
        this._html = null;
        this._text = null;
        this._attachments = [];
        this._rawAttachments = [];
    }

    to(address, name = null) {
        this._to.push(name ? { address, name } : address);
        return this;
    }

    cc(address, name = null) {
        this._cc.push(name ? { address, name } : address);
        return this;
    }

    bcc(address, name = null) {
        this._bcc.push(name ? { address, name } : address);
        return this;
    }

    replyTo(address, name = null) {
        this._replyTo = name ? { address, name } : address;
        return this;
    }

    from(address, name = null) {
        this._from = name ? { address, name } : address;
        return this;
    }

    subject(subject) {
        this._subject = subject;
        return this;
    }

    view(viewName, data = {}) {
        this._viewName = viewName;
        this._viewData = data;
        return this;
    }

    html(content) {
        this._html = content;
        return this;
    }

    text(content) {
        this._text = content;
        return this;
    }

    attach(filePath, options = {}) {
        this._attachments.push({ path: filePath, ...options });
        return this;
    }

    attachData(data, name, options = {}) {
        this._rawAttachments.push({ content: data, filename: name, ...options });
        return this;
    }

    with(key, value = null) {
        if (typeof key === 'object') {
            this._viewData = { ...this._viewData, ...key };
        } else {
            this._viewData[key] = value;
        }
        return this;
    }

    /**
     * Build the message. Override in subclasses.
     */
    build() {
        return this;
    }
}

module.exports = Mailable;
