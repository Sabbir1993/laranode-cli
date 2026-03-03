const Route = use('laranode/Support/Facades/Route');
const Hash = use('laranode/Support/Facades/Hash');
const User = use('App/Models/User');
const Auth = use('laranode/Support/Facades/Auth');

Route.get('/user', async (req, res) => {
    const user = await User.first();
    return res.json({
        user
    });
});