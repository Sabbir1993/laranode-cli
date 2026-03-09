/**
 * LaraNode Mailer
 *
 * Provides Laravel-like API for sending emails.
 * Uses nodemailer under the hood.
 *
 * @example
 * await Mail.to('user@example.com').send(new WelcomeMail(user))
 */
class Mailer {
    constructor(app) {
        this.app = app;
        this._to = [];
        this._cc = [];
        this._bcc = [];
        this._transporter = null;
    }

    /**
     * Set the recipients.
     */
    to(address) {
        const mailer = this._fresh();
        if (typeof address === 'object' && address.email) {
            mailer._to.push(address.email);
        } else if (Array.isArray(address)) {
            mailer._to.push(...address.map(a => typeof a === 'object' ? a.email : a));
        } else {
            mailer._to.push(address);
        }
        return mailer;
    }

    cc(address) {
        this._cc.push(typeof address === 'object' ? address.email : address);
        return this;
    }

    bcc(address) {
        this._bcc.push(typeof address === 'object' ? address.email : address);
        return this;
    }

    /**
     * Send a Mailable instance.
     *
     * @param {Mailable} mailable
     */
    async send(mailable) {
        const ShouldQueue = require('../Contracts/Queue/ShouldQueue');

        if (mailable instanceof ShouldQueue) {
            const queue = this.app.make('queue');
            const SendQueuedMailable = require('./Jobs/SendQueuedMailable');
            return await queue.push(new SendQueuedMailable(mailable));
        }

        return await this._sendNow(mailable);
    }

    /**
     * Send the mailable immediately.
     */
    async _sendNow(mailable) {
        // Build the mailable
        mailable.build();

        const config = this.app.make('config');
        const mailConfig = config.get('mail');
        const defaultFrom = mailConfig.from || {};

        // Resolve the email body
        let html = mailable._html;
        let text = mailable._text;

        // Render view if specified
        if (mailable._viewName && !html) {
            try {
                const viewFactory = this.app.make('view');
                html = await viewFactory.render(mailable._viewName, mailable._viewData);
            } catch (e) {
                // If view rendering fails, use a simple text fallback
                text = text || `Email: ${mailable._subject}`;
            }
        }

        const attachments = [
            ...mailable._attachments,
            ...mailable._rawAttachments
        ];

        const mailOptions = {
            from: mailable._from || `${defaultFrom.name || 'LaraNode'} <${defaultFrom.address || 'noreply@localhost'}>`,
            to: [...this._to, ...mailable._to].join(', '),
            cc: [...this._cc, ...mailable._cc].join(', '),
            bcc: [...this._bcc, ...mailable._bcc].join(', '),
            replyTo: mailable._replyTo || undefined,
            subject: mailable._subject,
            html: html || undefined,
            text: text || undefined,
            attachments: attachments.length ? attachments : undefined,
        };

        // Cleanup undefined fields
        if (!mailOptions.cc) delete mailOptions.cc;
        if (!mailOptions.bcc) delete mailOptions.bcc;

        // Get the mailer driver
        const driverName = mailConfig.default || 'log';

        if (driverName === 'log') {
            return this._sendViaLog(mailOptions);
        }

        return this._sendViaSmtp(mailOptions, mailConfig);
    }

    /**
     * Send email via SMTP using nodemailer.
     */
    async _sendViaSmtp(mailOptions, mailConfig) {
        const nodemailer = require('nodemailer');
        const smtpConfig = mailConfig.mailers && mailConfig.mailers.smtp;

        if (!smtpConfig) {
            throw new Error('SMTP mailer is not configured. Check config/mail.js');
        }

        if (!this._transporter) {
            this._transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.encryption === 'ssl',
                auth: {
                    user: smtpConfig.username,
                    pass: smtpConfig.password,
                },
            });
        }

        const info = await this._transporter.sendMail(mailOptions);

        // Dispatch event if events system is available
        try {
            const events = this.app.make('events');
            await events.dispatch('MessageSent', { message: mailOptions, info });
        } catch (e) {
            // Events not available, silently ignore
        }

        return info;
    }

    /**
     * Log the email instead of sending (for development).
     */
    async _sendViaLog(mailOptions) {
        try {
            const log = this.app.make('log');
            log.info('Mail sent (log driver)', mailOptions);
        } catch (e) {
            console.log('[Mail - Log Driver]', JSON.stringify(mailOptions, null, 2));
        }

        return { messageId: 'log-' + Date.now() };
    }

    /**
     * Create a fresh Mailer instance (for chaining).
     */
    _fresh() {
        const mailer = new Mailer(this.app);
        return mailer;
    }
}

module.exports = Mailer;
