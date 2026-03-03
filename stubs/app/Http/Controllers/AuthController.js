const Controller = use('App/Http/Controllers/Controller');
const User = use('App/Models/User');
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

        const { email, password } = data;

        const user = await User.where('email', email).first();

        if (!user || !await Hash.check(password, user.password)) {
            return res.status(401).json({
                message: 'Invalid login credentials'
            });
        }

        // Generate token
        const tokenResult = await user.createToken('auth_token');

        return res.json({
            success: true,
            user,
            token: tokenResult.plainTextToken
        });
    }

    /**
     * Logout user.
     */
    async logout(req, res) {
        const user = req.user();
        if (user && user.currentAccessToken()) {
            await user.currentAccessToken().delete();
        }

        return res.json({ success: true });
    }
}

module.exports = AuthController;
