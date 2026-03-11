/**
 * Password Controller
 * 
 * Handles password reset functionality:
 * - Show forgot password form
 * - Send password reset link
 * - Show reset password form
 * - Reset password
 */

const Controller = use('App/Http/Controllers/Controller');
const User = use('App/Models/User');
const PasswordBroker = use('laranode/Auth/PasswordBroker');

class PasswordController extends Controller {
    /**
     * Show the forgot password form.
     */
    showForgotForm(req, res) {
        return res.view('auth.forgot-password', {
            title: 'Forgot Password - LaraNode'
        });
    }

    /**
     * Send the password reset link.
     */
    async sendResetLink(req, res) {
        const { email } = req.body;

        if (!email) {
            return res.status(422).json({
                message: 'Email is required'
            });
        }

        const userProvider = use('App/Models/User');
        const broker = new PasswordBroker(userProvider);

        // Configure email sending callback
        const result = await broker.sendResetLink(email, async (user, token) => {
            // In a real application, send email here
            // Example with a mail service:
            // await Mail.send('emails.password-reset', { user, token }, (message) => {
            //     message.to(user.email).from('noreply@example.com').subject('Password Reset');
            // });

            // For development, log the reset link
            // For development, log the reset link
            if (process.env.APP_DEBUG === 'true') {
                const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/password/reset/${token}?email=${encodeURIComponent(email)}`;
                const Log = use('laranode/Support/Facades/Log');
                Log.debug(`Password Reset URL: ${resetUrl}`);
            }
        });

        // Always return success to prevent email enumeration
        return res.json({
            message: 'If the email exists, a password reset link has been sent.'
        });
    }

    /**
     * Show the password reset form.
     */
    showResetForm(req, res) {
        const { token, email } = req.query;

        return res.view('auth.reset-password', {
            title: 'Reset Password - LaraNode',
            token,
            email
        });
    }

    /**
     * Reset the user's password.
     */
    async reset(req, res) {
        const { email, token, password, password_confirmation } = req.body;

        // Validate input
        if (!email || !token || !password) {
            return res.status(422).json({
                message: 'Email, token, and password are required'
            });
        }

        if (password !== password_confirmation) {
            return res.status(422).json({
                message: 'Password confirmation does not match'
            });
        }

        if (password.length < 8) {
            return res.status(422).json({
                message: 'Password must be at least 8 characters'
            });
        }

        const userProvider = use('App/Models/User');
        const broker = new PasswordBroker(userProvider);

        const result = await broker.reset({
            email,
            token,
            password
        });

        if (result !== 'passwords.reset') {
            return res.status(400).json({
                message: 'Invalid or expired token'
            });
        }

        return res.json({
            message: 'Password has been reset successfully'
        });
    }
}

module.exports = PasswordController;
