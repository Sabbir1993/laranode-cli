const Controller = use('App/Http/Controllers/Controller');
const User = use('App/Models/User');
const Auth = use('laranode/Support/Facades/Auth');
const Hash = use('laranode/Support/Facades/Hash');
const RegisterRequest = use('App/Http/Requests/Auth/RegisterRequest');
const LoginRequest = use('App/Http/Requests/Auth/LoginRequest');

class AuthController extends Controller {
    static get requests() {
        return {
            register: RegisterRequest,
            login: LoginRequest
        };
    }
    /**
     * Show registration form.
     */
    showRegisterForm(req, res) {
        return res.view('auth.register', { title: 'Register - LaraNode' });
    }

    /**
     * Handle user registration.
     */
    async register(req, res) {
        const data = await req.validated();

        const user = await User.create({
            name: data.name,
            email: data.email,
            password: await Hash.make(data.password),
        });

        // Generate token
        const tokenResult = await user.createToken('auth_token');

        return res.json({
            success: true,
            user,
            token: tokenResult.plainTextToken
        });
    }

    /**
     * Show login form.
     */
    showLoginForm(req, res) {
        return res.view('auth.login', { title: 'Login - LaraNode' });
    }

    /**
     * Handle user login.
     */
    async login(req, res) {
        const data = await req.validated();
        const attempt = await Auth.attempt(data);

        if (attempt) {
            if (req.wantsJson()) {
                const user = Auth.user();
                return res.json({
                    success: true,
                    user,
                    token: user.plainToken || null
                });
            }

            if (Auth.user().role === 'admin') {
                return res.redirect('/todos');
            }
            return res.redirect('/');
        }

        if (req.wantsJson()) {
            return res.status(401).json({ message: 'Invalid login credentials' });
        }

        // Flash error manually (optional - can also rely on global middleware)
        // Old input is already flashed globally in Kernel
        if (typeof req.flash === 'function') {
            req.flash('errors', { email: ['Invalid email or password'] });
        }
        return res.redirect('/login');
    }

    /**
     * Logout user.
     */
    async logout(req, res) {
        await Auth.logout();

        if (!req.wantsJson()) {
            return res.redirect('/login');
        }

        return res.json({ success: true });
    }
}

module.exports = AuthController;
