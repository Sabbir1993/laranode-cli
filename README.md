<h1 align="center">LaraNode</h1>
<p align="center">
  <strong>A Laravel-Inspired Node.js Framework for Web Artisans</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/laranode-cli"><img src="https://img.shields.io/npm/v/laranode-cli.svg?style=for-the-badge&color=blue" alt="NPM Version" /></a>
  <a href="https://github.com/Sabbir1993/laranode/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/laranode.svg?style=for-the-badge&color=blue" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node.js-%3E%3D_18.0-green.svg?style=for-the-badge" alt="Node.js Version" /></a>
</p>

<p align="center">
  <a href="#about-laranode">About</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 💡 About LaraNode

LaraNode is a powerful, expressive, and elegant Node.js framework designed to mirror the architecture and developer experience of Laravel. Built on top of Express.js, it provides a robust foundation for building modern web applications with a familiar, elegant API.

If you know Laravel, you already know LaraNode.

## 🚀 Installation

### Using LaraNode CLI (Recommended)

```bash
# Install the CLI globally
npm install -g laranode-cli

# Create a new project
laranode new my-app

# Start the development server
cd my-app
node artisan serve
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/Sabbir1993/laranode.git my-app
cd my-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your APP_KEY

# Start the server
node server.js
```

## ✨ Features

| Feature | Description |
|---|---|
| 🏛️ **Laravel Architecture** | Familiar directory structure — `app/`, `routes/`, `config/`, `resources/`, `database/` |
| 🧩 **Service Container** | Powerful IoC container with dependency injection and service providers |
| 🛣️ **Expressive Routing** | Route groups, middleware, prefixes, named routes, and **resource controllers** |
| 🗄️ **Loquent ORM** | Active Record ORM with relationships, eager loading, soft deletes, and query builder |
| ✨ **Edge Templates** | Blade-like templating engine with layouts, partials, and directives |
| 🛡️ **Authentication** | Session-based auth & Sanctum-style API tokens out of the box |
| 🔒 **Security Middleware** | CSRF protection, CORS, rate limiting, security headers, and input sanitization |
| ✅ **Validation** | Form request validation with 20+ built-in rules and custom rule support |
| 🔐 **Encryption & Hashing** | AES-256 encryption and bcrypt hashing via Facades |
| 📟 **Artisan CLI** | Command-line interface for migrations, scaffolding, and dev server |
| 💻 **Tinker REPL** | Interactive Node.js shell with top-level await and global context injection |
| 🪟 **Inertia.js Server** | Native server side protocol rendering for Vue/React SPAs without an API |
| 📊 **Log Viewer** | Built-in web-based log viewer with severity filtering and pagination |
| 🌐 **Translations** | Multi-language support with language files and the `Lang` facade |
| 🗃️ **Multi-Database** | SQLite and MySQL support with connection pooling |
| 📄 **Pagination** | Built-in query pagination with page metadata and HTML links |
| 📮 **Queues** | Database-driven job queue with dispatch, delay, retries, and failed jobs |
| 🎧 **Events & Listeners** | App-wide event dispatching with listener DI resolution |
| 🚀 **Cache** | Unified cache API with file and memory drivers (`Cache.remember`) |
| 📁 **Storage** | Unified filesystem API (`Storage.put`) with visibility, mime-type, and symbolic links |
| 📩 **Mail** | Fluent email sending API via Mailables with automatic queuing support |
| 🔔 **Notifications** | Multi-channel notifications routing (Mail, Database, Broadcast) with `Notifiable` trait |
| 📡 **Broadcasting** | Real-time event broadcasting via Socket.io with `ShouldBroadcast` trait |
| 🧪 **Testing** | Robust testing framework with `artisan test` and HTTP assertions |
| ⚡ **Performance** | Route and Config caching for production optimization (`node artisan route:cache`) |

---

## ⚡ Quick Start

### Directory Structure

```
my-app/
├── app/
│   ├── Console/          # Artisan commands
│   ├── Exceptions/       # Exception handlers
│   ├── Http/
│   │   ├── Controllers/  # Route controllers
│   │   ├── Kernel.js     # HTTP middleware stack
│   │   ├── Middleware/    # Custom middleware
│   │   └── Requests/     # Form request validation
│   ├── Models/           # Loquent models
│   └── Rules/            # Custom validation rules
├── bootstrap/
│   └── app.js            # Application bootstrapper
├── config/
│   ├── app.js            # App name, env, providers
│   ├── auth.js           # Guards, providers, passwords
│   ├── database.js       # Database connections
│   └── logging.js        # Log channels & log viewer
├── database/
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── resources/
│   └── views/            # Edge templates
├── routes/
│   ├── web.js            # Web routes (session, CSRF)
│   └── api.js            # API routes (stateless)
├── storage/
│   ├── app/              # Application files
│   ├── framework/views/  # Compiled views
│   └── logs/             # Log files
├── vendor/               # Framework source
├── .env                  # Environment variables
├── artisan.js            # CLI entry point
└── server.js             # HTTP server entry point
```

---

## 📚 Documentation

*(Click on a section below to expand the detailed API documentation)*

<details>
<summary><strong>🛣️ Routing</strong></summary>
<br>

Define routes in `routes/web.js` (with session & CSRF) or `routes/api.js` (stateless):

```javascript
const Route = use('laranode/Support/Facades/Route');

// Basic routes
Route.get('/', (req, res) => res.view('welcome'));
Route.post('/submit', 'FormController@store');

// Named routes
Route.get('/login', 'AuthController@showLoginForm').name('login');

// Route groups with middleware and prefix
Route.group({ middleware: ['auth'], prefix: '/admin' }, () => {
    Route.get('/dashboard', 'AdminController@index');
    Route.get('/users', 'AdminController@users');
});

// Route parameters
Route.get('/users/{id}', 'UserController@show');
Route.put('/users/{user}', 'UserController@update');
Route.delete('/users/{user}', 'UserController@destroy');
```

---

</details>

---

<details>
<summary><strong>🎛️ Controllers</strong></summary>
<br>

Controllers reside in `app/Http/Controllers/`:

```javascript
const Controller = use('laranode/Routing/Controller/Controller');

class HomeController extends Controller {

    async index(req, res) {
        const users = await User.all();
        return res.view('home', { users });
    }

    async store(req, res) {
        const data = req.only(['name', 'email']);
        const user = await User.create(data);
        return res.redirect('/users');
    }

    async show(req, res) {
        const user = await User.find(req.params.id);
        return res.json({ user });
    }
}

module.exports = HomeController;
```

---

</details>

---

<details>
<summary><strong>🧩 Service Container & Dependency Injection</strong></summary>
<br>

LaraNode features a powerful Service Container (IoC container) that manages class dependencies and performs dependency injection.

#### Dependency Injection (Constructor Injection)
When resolving a class from the container (e.g., via a Controller or `this.app.make()`), the framework automatically injects the **Application instance** (the container) into the constructor.

```javascript
// app/Http/Controllers/UserController.js
class UserController extends Controller {
    constructor(app) {
        super();
        this.userRepo = app.make('App/Repositories/UserRepository');
    }

    async index(req, res) {
        const users = await this.userRepo.all();
        return res.json(users);
    }
}
```

#### Binding in AppServiceProvider
You should register your service bindings in `app/Providers/AppServiceProvider.js`:

```javascript
// app/Providers/AppServiceProvider.js
class AppServiceProvider extends ServiceProvider {
    register() {
        // Simple binding
        this.app.bind('App/Repositories/UserRepository', require('../Repositories/UserRepository'));

        // Singleton binding
        this.app.singleton('payment.gateway', (app) => {
            return new PaymentGateway(app.make('config').get('services.payment_key'));
        });
    }
}
```

#### Sample Repository Pattern Example

**1. Create the Repository:**
```javascript
// app/Repositories/UserRepository.js
class UserRepository {
    constructor(app) {
        this.db = app.make('db'); // Resolve DB facade from container
    }

    async all() {
        return this.db.table('users').get();
    }
}
module.exports = UserRepository;
```

**2. Bind and Use:**
Once bound in your Service Provider, the repository is easily accessible throughout your application via DI or the `this.app.make()` helper.

---

</details>

---

<details>
<summary><strong>🗄️ Loquent ORM</strong></summary>
<br>

Loquent is LaraNode's Active Record ORM, inspired by Laravel's Eloquent:

```javascript
const Model = use('laranode/Database/Loquent/Model');

class User extends Model {
    static table = 'users';
    static fillable = ['name', 'email', 'password'];
    static hidden = ['password', 'remember_token'];
    static casts = { is_admin: 'boolean' };

    todos() {
        const Todo = use('App/Models/Todo');
        return this.hasMany(Todo, 'user_id');
    }
}

module.exports = User;
```

#### CRUD Operations

```javascript
// Create
const user = await User.create({ name: 'John', email: 'john@example.com' });

// Read
const all     = await User.all();
const first   = await User.first();
const found   = await User.find(1);
const many    = await User.findMany([1, 2, 3]);
const fail    = await User.findOrFail(1);     // throws ModelNotFoundException
const fail2   = await User.firstOrFail();     // throws ModelNotFoundException

// Find or Create
const user = await User.firstOrCreate({ email: 'john@example.com' }, { name: 'John' });
const user = await User.firstOrNew({ email: 'john@example.com' }, { name: 'John' });
const user = await User.updateOrCreate({ email: 'john@example.com' }, { name: 'Jane' });

// Update
await User.where('id', 1).update({ name: 'Jane' });

// Instance update & save
const user = await User.find(1);
user.name = 'Jane';
await user.save();

// Delete
await User.where('id', 1).delete();
await User.destroy([1, 2, 3]);         // Delete by IDs
```

#### Query Builder — Where Clauses

```javascript
// Basic where
User.where('active', true)
User.where('age', '>', 18)
User.orWhere('role', 'admin')

// Null checks
User.whereNull('deleted_at')
User.whereNotNull('email_verified_at')

// In / Not In
User.whereIn('status', ['active', 'pending'])
User.whereNotIn('role', ['banned'])

// Between
User.whereBetween('age', [18, 65])
User.whereNotBetween('price', [100, 500])

// Date where clauses
User.whereDate('created_at', '2026-01-01')
User.whereMonth('created_at', 3)
User.whereYear('created_at', 2026)
User.whereDay('created_at', 15)

// Column comparison
User.whereColumn('updated_at', '>', 'created_at')

// Raw where
User.whereRaw('age > ? AND status = ?', [18, 'active'])

// Exists
User.whereExists(query => query.select('*').from('orders').whereRaw('orders.user_id = users.id'))
```

#### Query Builder — Selecting & Ordering

```javascript
// Select specific columns
User.select('id', 'name', 'email').get()
User.selectRaw('COUNT(*) as total, status').groupBy('status').get()
User.distinct().select('role').get()

// Ordering
User.orderBy('created_at', 'desc').get()
User.orderByRaw('FIELD(status, "active", "pending", "inactive")').get()
User.latest().get()                    // ORDER BY created_at DESC
User.oldest().get()                    // ORDER BY created_at ASC
User.inRandomOrder().get()

// Limit & Offset
User.limit(10).offset(20).get()

// Conditional (when)
User.when(req.query.role, (query, role) => query.where('role', role)).get()
```

#### Query Builder — Joins

```javascript
User.join('orders', 'users.id', '=', 'orders.user_id').get()
User.leftJoin('profiles', 'users.id', '=', 'profiles.user_id').get()
User.rightJoin('orders', 'users.id', '=', 'orders.user_id').get()
User.crossJoin('roles').get()

// Closure-based joins (multiple conditions)
User.join('posts', (join) => {
    join.on('users.id', '=', 'posts.user_id')
        .on('users.tenant_id', '=', 'posts.tenant_id');
}).get()

// Subquery Joins (joinSub / leftJoinSub / rightJoinSub)
const latestPosts = DB.table('posts')
    .select('user_id')
    .selectRaw('MAX(created_at) as last_post')
    .groupBy('user_id');

DB.table('users')
    .joinSub(latestPosts, 'latest_posts', 'users.id', '=', 'latest_posts.user_id')
    .select('users.*', 'latest_posts.last_post')
    .get()

// Subquery join with multiple conditions
DB.table('users')
    .joinSub(latestPosts, 'lp', (join) => {
        join.on('users.id', '=', 'lp.user_id')
            .on('users.tenant_id', '=', 'lp.tenant_id');
    })
    .get()

// leftJoinSub
DB.table('users')
    .leftJoinSub(orderTotals, 'summary', 'users.id', '=', 'summary.user_id')
    .get()
```

#### Query Builder — Grouping & Aggregates

```javascript
// Grouping
User.groupBy('role').selectRaw('role, COUNT(*) as total').get()
User.groupBy('role').having('total', '>', 5).get()

// Aggregates
const count = await User.count();
const max   = await User.max('age');
const min   = await User.min('age');
const avg   = await User.avg('salary');
const sum   = await User.sum('balance');
const has   = await User.where('role', 'admin').exists();
const none  = await User.where('role', 'banned').doesntExist();
```

#### Query Builder — Insert Variants

```javascript
const DB = use('laranode/Support/Facades/DB');

// Basic insert
await DB.table('users').insert({ name: 'John', email: 'john@example.com' });

// Insert and get ID
const id = await DB.table('users').insertGetId({ name: 'Jane' });

// Insert or ignore (skip duplicates)
await DB.table('users').insertOrIgnore({ email: 'existing@example.com' });

// Upsert (insert or update on duplicate key)
await DB.table('users').upsert(
    [{ email: 'john@example.com', name: 'John Updated' }],
    ['email'],  // unique columns
    ['name']    // columns to update on conflict
);
```

#### Query Builder — Update & Delete

```javascript
// Increment / Decrement
await User.where('id', 1).increment('login_count');
await User.where('id', 1).increment('balance', 100, { last_deposit: new Date() });
await User.where('id', 1).decrement('balance', 50);

// Truncate table
await DB.table('logs').truncate();

#### Database Transactions

LaraNode's DB facade provides a simple way to run a set of operations within a database transaction. If an exception is thrown within the closure, the transaction is automatically rolled back.

```javascript
await DB.transaction(async () => {
    await DB.table('users').update({ votes: 1 });
    await DB.table('posts').delete();

    // Loquent models automatically use the active transaction
    await User.create({ name: 'Transaction User' });
});
```
```

#### Chunking & Pagination

```javascript
// Process large datasets in chunks
await User.where('active', true).chunk(100, async (users, page) => {
    for (const user of users) {
        // process each user
    }
    // return false to stop chunking
});

// Pluck values
const emails = await User.pluck('email');
const emailMap = await User.pluck('email', 'id');    // { 1: 'a@b.com', 2: 'c@d.com' }

// Get a single column value
const name = await User.where('id', 1).value('name');
```

#### Relationships

```javascript
class User extends Model {
    // One-to-One
    phone()   { return this.hasOne(Phone, 'user_id'); }

    // One-to-Many
    posts()   { return this.hasMany(Post, 'user_id'); }

    // Belongs To (inverse)
    team()    { return this.belongsTo(Team, 'team_id'); }

    // Many-to-Many (with pivot)
    roles()   {
        return this.belongsToMany(Role, 'role_user', 'user_id', 'role_id')
                   .withPivot('assigned_at')
                   .withTimestamps();
    }

    // Has One/Many Through
    countryPhone() { return this.hasOneThrough(Phone, Country, 'country_id', 'user_id'); }
    countryPosts() { return this.hasManyThrough(Post, Country, 'country_id', 'user_id'); }

    // Polymorphic
    image()    { return this.morphOne(Image, 'imageable'); }
    comments() { return this.morphMany(Comment, 'commentable'); }
    tags()     { return this.morphToMany(Tag, 'taggable'); }
}

// Pivot table operations
await user.roles().attach([1, 2]);
await user.roles().detach([1]);
await user.roles().sync([1, 3, 5]);
await user.roles().toggle([2, 4]);
```

#### Eager Loading

```javascript
const users = await User.with('posts').get();
const users = await User.with('posts', 'roles').get();
const user  = await User.with('posts:id,title').find(1);       // Select specific columns

// Nested Eager Loading (dot notation)
const users = await User.with('posts.comments.author').get();

// Querying relationship existence
const users = await User.has('posts').get();
const users = await User.doesntHave('posts').get();
const users = await User.whereHas('posts', q => q.where('published', true)).get();
const users = await User.withCount('posts').get();              // Adds posts_count
```

#### Model Events & Observers

```javascript
// Register event hooks
User.creating(user => { user.slug = slugify(user.name); });
User.created(user  => { console.log('User created:', user.id); });
User.updating(user => { /* ... */ });
User.updated(user  => { /* ... */ });
User.deleting(user => { /* ... */ });
User.deleted(user  => { /* ... */ });
User.saving(user   => { /* before create or update */ });
User.saved(user    => { /* after create or update */ });

// Observer class
User.observe({
    creating(user) { /* ... */ },
    created(user)  { /* ... */ },
    updating(user) { /* ... */ },
});
```

#### Global Scopes

```javascript
// Add a global scope
User.addGlobalScope('active', query => query.where('active', true));

// Query without a global scope
const allUsers = await User.withoutGlobalScope('active').get();
```

#### Model Utilities

```javascript
// Instance methods
const user = await User.find(1);

user.refresh();                              // Re-fetch from DB
const copy = user.replicate(['id']);         // Clone without id
user.touch();                                // Update updated_at timestamp
user.is(anotherUser);                        // Compare by primary key
user.isNot(anotherUser);

// Dirty tracking
user.name = 'New Name';
user.isDirty();                              // true
user.isDirty('name');                        // true
user.isClean();                              // false
user.getDirty();                             // { name: 'New Name' }
user.getOriginal('name');                    // 'Old Name'

// Serialization
user.toArray();                              // Plain object (respects hidden)
user.toJSON();                               // JSON-safe object (respects hidden)
user.makeVisible(['password']);               // Temporarily unhide
user.makeHidden(['email']);                   // Temporarily hide

// Load relations explicitly (useful before passing to views)
const user = await User.find(1);
await user.load('posts', 'roles');         // Always (re)loads from DB
await user.loadMissing('comments');        // Only loads if not already loaded

// Then in your view: {{ user.posts }}, {{ user.roles }}
```

#### Soft Deletes

```javascript
const SoftDeletes = use('laranode/Database/Loquent/SoftDeletes');

class Post extends SoftDeletes(Model) {
    static table = 'posts';
}

// Soft delete (sets deleted_at timestamp)
await Post.where('id', 1).delete();

// Include soft deleted records
const all = await Post.withTrashed().get();

// Restore
await Post.where('id', 1).restore();

// Force delete (permanent)
await Post.where('id', 1).forceDelete();
```

---

</details>

---

<details>
<summary><strong>🛡️ Authentication</strong></summary>
<br>

LaraNode provides session-based authentication and Sanctum-style API tokens.

#### Session Authentication (Web)

```javascript
// routes/web.js
Route.get('/login', 'AuthController@showLoginForm').name('login');
Route.post('/login', 'AuthController@login');
Route.post('/logout', 'AuthController@logout').name('logout');

// Protect routes with auth middleware
Route.group({ middleware: ['auth'] }, () => {
    Route.get('/dashboard', 'DashboardController@index');
});
```

#### API Token Authentication (Sanctum-style)

```javascript
const HasApiTokens = use('laranode/Auth/Traits/HasApiTokens');

class User extends HasApiTokens(Model) {
    static table = 'users';
}

// Create a token
const token = await user.createToken('api-token');
// Returns: { plainTextToken: '1|abc123...', accessToken: {...} }

// Use in API requests
// Header: Authorization: Bearer 1|abc123...

// Protect API routes
Route.group({ middleware: ['auth:api'] }, () => {
    Route.get('/user', (req, res) => res.json(req.user));
});
```

#### Password Reset

```javascript
Route.get('/password/reset', 'PasswordController@showForgotForm').name('password.request');
Route.post('/password/email', 'PasswordController@sendResetLink').name('password.email');
Route.get('/password/reset/{token}', 'PasswordController@showResetForm').name('password.reset');
Route.post('/password/reset', 'PasswordController@reset').name('password.update');
```

---

</details>

---

<details>
<summary><strong>🧩 Middleware</strong></summary>
<br>

#### Built-in Middleware

| Middleware | Purpose |
|---|---|
| `TrimStrings` | Trims whitespace from all input |
| `SecurityHeaders` | Sets security HTTP headers (X-Frame-Options, etc.) |
| `VerifyCsrfToken` | CSRF protection for web forms |
| `Cors` | Cross-Origin Resource Sharing headers |
| `RateLimiter` | Request rate limiting |
| `Authenticate` | Authentication guard |
| `SubstituteBindings` | Route model binding |

#### HTTP Kernel (`app/Http/Kernel.js`)

```javascript
const Kernel = require('../../vendor/laranode/framework/src/Foundation/Http/Kernel');

class HttpKernel extends Kernel {
    constructor(app, router) {
        super(app, router);

        // Global middleware (runs on every request)
        this.middleware = [
            require('../../vendor/laranode/framework/src/Http/Middleware/TrimStrings'),
            require('../../vendor/laranode/framework/src/Http/Middleware/SecurityHeaders'),
        ];

        // Middleware groups
        this.middlewareGroups = {
            'web': ['bindings', 'csrf'],
            'api': ['bindings'],
        };

        // Named middleware (for route-level use)
        this.routeMiddleware = {
            'auth': require('../../vendor/laranode/framework/src/Auth/Middleware/Authenticate'),
            'cors': require('../../vendor/laranode/framework/src/Http/Middleware/Cors'),
            'csrf': require('../../vendor/laranode/framework/src/Http/Middleware/VerifyCsrfToken'),
            'throttle': require('../../vendor/laranode/framework/src/Http/Middleware/RateLimiter'),
        };
    }
}
```

#### Custom Middleware

```javascript
// app/Http/Middleware/CheckAdmin.js
module.exports = function (req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).send('Forbidden');
};
```

---

</details>

---

<details>
<summary><strong>✅ Validation</strong></summary>
<br>

```javascript
// Inline validation in a controller
async store(req, res) {
    const validator = new Validator(req.all(), {
        name: 'required|string|min:3|max:255',
        email: 'required|email|unique:users,email',
        password: 'required|min:8|confirmed',
        age: 'nullable|integer|min:18',
    });

    if (validator.fails()) {
        return res.status(422).json({ errors: validator.errors() });
    }

    // Validated data is safe to use
    const user = await User.create(validator.validated());
}
```

**Available Validation Rules:**
`required`, `nullable`, `string`, `integer`, `numeric`, `boolean`, `email`, `url`, `min`, `max`, `between`, `in`, `not_in`, `unique`, `exists`, `confirmed`, `date`, `alpha`, `alpha_num`, `regex`, `required_if`, `required_with`, and more.

---

</details>

---

<details>
<summary><strong>🏗️ Facades</strong></summary>
<br>

Facades provide a static-like interface to services in the container:

```javascript
// Available Facades
const Route  = use('laranode/Support/Facades/Route');   // Routing
const Auth   = use('laranode/Support/Facades/Auth');     // Authentication
const DB     = use('laranode/Support/Facades/DB');       // Database
const Hash   = use('laranode/Support/Facades/Hash');     // Hashing
const Crypt  = use('laranode/Support/Facades/Crypt');    // Encryption
const Config = use('laranode/Support/Facades/Config');   // Configuration
const Log    = use('laranode/Support/Facades/Log');      // Logging
const Lang   = use('laranode/Support/Facades/Lang');     // Translation
const Http   = use('laranode/Support/Facades/Http');     // HTTP Client
```

#### HTTP Client & Macros

LaraNode features an expressive, fluent HTTP client (powered by native `fetch`) that is accessible via the `Http` Facade. It behaves identically to Laravel's HTTP Client.

```javascript
const Http = use('laranode/Support/Facades/Http');

// Basic Requests
const response = await Http.get('https://api.github.com/users/octocat');
const data     = await Http.post('https://api.example.com/users', { name: 'John' });

// Response helpers
response.status();       // 200
response.successful();   // true
response.json();         // { ... }
response.header('x-ratelimit-remaining');

// Fluent configuration
await Http.withHeaders({ 'X-Custom': '123' })
          .withToken('super-secret-token')
          .acceptJson()
          .get('/endpoint');

// File Uploads (Multipart/Form-Data)
const fileBuffer = fs.readFileSync('image.png');
await Http.attach('avatar', fileBuffer, 'image.png')
          .post('/upload');
```

**Macros**

You can register macros (custom HTTP client configurations) in your `AppServiceProvider` and call them fluently anywhere in your application.

```javascript
// app/Providers/AppServiceProvider.js
const Http = use('laranode/Support/Facades/Http');

class AppServiceProvider extends ServiceProvider {
    boot() {
        Http.macro('github', function () {
            return this.withBaseUrl('https://api.github.com')
                       .withHeaders({ 'Accept': 'application/vnd.github.v3+json' });
        });
    }
}

// In your Controllers
const response = await Http.github().get('/users/Sabbir1993');
```

#### Hashing

```javascript
const Hash = use('laranode/Support/Facades/Hash');

// Hash a password
const hashed = await Hash.make('my-password');

// Verify a password
const valid = await Hash.check('my-password', hashed); // true
```

#### Encryption

```javascript
const Crypt = use('laranode/Support/Facades/Crypt');

// Encrypt
const encrypted = Crypt.encrypt('sensitive-data');

// Decrypt
const decrypted = Crypt.decrypt(encrypted);
```

#### Logging

```javascript
const Log = use('laranode/Support/Facades/Log');

Log.info('User logged in', { userId: 1 });
Log.warning('Disk space low');
Log.error('Payment failed', { orderId: 123 });
```

---

</details>

---

<details>
<summary><strong>✨ Views (Edge Templating)</strong></summary>
<br>

LaraNode uses Edge templates (`.edge` files) — a Blade-like engine:

```html
<!-- resources/views/layouts/app.edge -->
<!DOCTYPE html>
<html>
<head>
    <title>@yield('title') - {{ config('app.name') }}</title>
</head>
<body>
    @section('content')
    @endsection
</body>
</html>
```

```html
<!-- resources/views/welcome.edge -->
@extends('layouts.app')

@section('title', 'Home')

@section('content')
    <h1>Welcome, {{ auth.user.name }}!</h1>

    @if(auth.user.isAdmin)
        <p>Admin Panel</p>
    @endif

    @foreach(todos as todo)
        <div>{{ todo.title }} - {{ todo.completed ? '✓' : '✗' }}</div>
    @endforeach
@endsection
```

```javascript
// Render a view from a controller
async index(req, res) {
    return res.view('welcome', {
        user: req.user,
        todos: await Todo.all()
    });
}
```

---

</details>

---

<details>
<summary><strong>⚙️ Configuration</strong></summary>
<br>

Configuration files in `config/` use environment variables:

```javascript
// config/app.js
module.exports = {
    name: env('APP_NAME', 'LaraNode'),
    env: env('APP_ENV', 'production'),
    debug: env('APP_DEBUG', false),
    url: env('APP_URL', 'http://localhost'),
    port: env('APP_PORT', 8000),
    key: env('APP_KEY'),
    providers: [
        // Service providers loaded at boot
    ],
};
```

```env
# .env
APP_NAME=LaraNode
APP_ENV=local
APP_DEBUG=true
APP_PORT=3333

DB_CONNECTION=sqlite
DB_DATABASE=laranode
```

---

</details>

---

<details>
<summary><strong>💾 Database</strong></summary>
<br>

#### Supported Databases

- **SQLite** — zero-config, great for development
- **MySQL** — production-ready with connection pooling

```javascript
// config/database.js
module.exports = {
    default: env('DB_CONNECTION', 'sqlite'),
    connections: {
        sqlite: {
            driver: 'sqlite',
            database: env('DB_DATABASE', database_path('database.sqlite')),
        },
        mysql: {
            driver: 'mysql',
            host: env('DB_HOST', '127.0.0.1'),
            port: env('DB_PORT', '3306'),
            database: env('DB_DATABASE', 'laranode'),
            username: env('DB_USERNAME', 'root'),
            password: env('DB_PASSWORD', ''),
        },
    }
};
```

#### Raw Queries via DB Facade

```javascript
const DB = use('laranode/Support/Facades/DB');

const users = await DB.table('users').where('active', true).get();
const result = await DB.raw('SELECT * FROM users WHERE id = ?', [1]);
```

---

</details>

---

<details>
<summary><strong>📄 Pagination</strong></summary>
<br>

LaraNode provides two types of paginators — `paginate()` for full page-number navigation and `simplePaginate()` for lightweight previous/next.

#### Length-Aware Pagination (paginate)

```javascript
// In a controller
async index(req, res) {
    const users = await User.where('active', true).paginate(10);

    // For API responses
    return res.json(users.toArray());
    // Returns: { data: [...], meta: { current_page, last_page, per_page, total } }

    // For views — render pagination links as HTML
    return res.view('users.index', {
        users: users.items,
        paginationLinks: users.links('/users?')
    });
}
```

```html
<!-- In your Edge template -->
@foreach(users as user)
    <div>{{ user.name }}</div>
@endforeach

{{{ paginationLinks }}}
```

#### Simple Pagination (simplePaginate)

For large datasets where you don't need the total count:

```javascript
async index(req, res) {
    const users = await User.simplePaginate(15);

    return res.view('users.index', {
        users: users.items,
        paginationLinks: users.links('/users?')
    });
}
```

#### Pagination Methods

| Method | Description |
|---|---|
| `paginate(perPage, page)` | Full pagination with total count and page numbers |
| `simplePaginate(perPage, page)` | Lightweight previous/next only |
| `.items` | The array of items for the current page |
| `.total` | Total number of records (paginate only) |
| `.currentPage` | Current page number |
| `.lastPage` | Last page number (paginate only) |
| `.hasMorePages()` | Whether more pages exist |
| `.toArray()` | Returns `{ data, meta }` object for API responses |
| `.links(path)` | Renders Bootstrap-compatible pagination HTML |

---

</details>

---

<details>
<summary><strong>📮 Queues</strong></summary>
<br>

LaraNode includes a database-driven queue system for processing jobs in the background, similar to Laravel.

#### Creating a Job

Create job classes in `app/Jobs/`:

```javascript
const Job = use('laranode/Queue/Job');

class ProcessPodcast extends Job {
    constructor(data) {
        super(data);
    }

    async handle() {
        console.log('Processing podcast:', this.data.podcastId);
        // Your job logic here...
    }
}

module.exports = ProcessPodcast;
```

#### Dispatching Jobs

```javascript
const ProcessPodcast = use('App/Jobs/ProcessPodcast');

// Basic dispatch
await ProcessPodcast.dispatch({ podcastId: 1 });

// Dispatch with delay (in seconds)
await ProcessPodcast.dispatch({ podcastId: 1 }).delay(600); // 10 minutes

// Dispatch to a specific queue
await ProcessPodcast.dispatch({ podcastId: 1 }).onQueue('high');

// Chained
await ProcessPodcast.dispatch({ podcastId: 1 }).onQueue('high').delay(60);
```

#### Running the Queue Worker

```bash
# Process jobs on the default queue
node artisan queue:work

# Process a specific queue
node artisan queue:work --queue=high

# Customize sleep interval and max retries
node artisan queue:work --sleep=1 --tries=5
```

#### Failed Jobs

When a job exceeds the maximum number of attempts (`--tries`), it is automatically moved to the `failed_jobs` table with the exception trace, queue name, payload, and a UUID.

#### Required Migrations

Run `node artisan migrate` to create the `jobs` and `failed_jobs` tables.

---

</details>

---

<details>
<summary><strong>📡 Broadcasting</strong></summary>
<br>

Powered by Socket.io, LaraNode's broadcasting allows you to share server-side events with your client-side JavaScript application in real-time.

```javascript
// app/Events/OrderShipped.js
class OrderShipped extends ShouldBroadcast {
    constructor(order) {
        super();
        this.order = order;
    }

    broadcastOn() {
        return ['orders', `user.${this.order.user_id}`];
    }
}

// In your controller
Event.dispatch(new OrderShipped(order));
```

---

</details>

---

<details>
<summary><strong>🧪 Testing</strong></summary>
<br>

LaraNode features a robust testing framework inspired by Laravel. It supports `artisan test` and provides a `TestCase` class for building expressive feature tests.

```javascript
// tests/Feature/UserTest.js
const TestCase = use('laranode/Foundation/Testing/TestCase');

class UserTest extends TestCase {
    async test_can_visit_home_page() {
        const response = await this.get('/');
        response.assertStatus(200);
        response.assertSee('LaraNode');
    }
}
```

#### Running Tests

```bash
node artisan test
```

---

</details>

---

<details>
<summary><strong>⚡ Performance</strong></summary>
<br>

Optimize your application for production by caching performance-heavy components.

```bash
# Cache configuration
node artisan config:cache

# Cache routes
node artisan route:cache
```

</details>

---

<details>
<summary><strong>🔌 Service Providers</strong></summary>
<br>

Register services in `config/app.js`:

```javascript
providers: [
    // Framework providers
    require(base_path('vendor/laranode/framework/src/Foundation/Providers/RouteServiceProvider')),
    require(base_path('vendor/laranode/framework/src/Foundation/Providers/DatabaseServiceProvider')),
    require(base_path('vendor/laranode/framework/src/Log/LogServiceProvider')),
    require(base_path('vendor/laranode/framework/src/View/ViewServiceProvider')),
    require(base_path('vendor/laranode/framework/src/Translation/TranslationServiceProvider')),
    require(base_path('vendor/laranode/framework/src/Auth/AuthServiceProvider')),
    require(base_path('vendor/laranode/framework/src/Hashing/HashServiceProvider')),
    require(base_path('vendor/laranode/framework/src/Encryption/EncryptionServiceProvider')),

    // Your custom providers
    // require(base_path('app/Providers/AppServiceProvider')),
],
```

---

</details>

---

<details>
<summary><strong>⚠️ Exception Handling</strong></summary>
<br>

Customize error handling in `app/Exceptions/Handler.js`:

```javascript
const BaseHandler = use('laranode/Foundation/Exceptions/Handler');

class Handler extends BaseHandler {
    constructor(app) {
        super(app);
        this.dontReport = [
            // Exceptions that should not be logged
        ];
    }

    register() {
        // Custom renderable
        this.renderable((error, req, res) => {
            if (error.name === 'PaymentException') {
                return res.status(402).json({ message: 'Payment required' });
            }
        });

        // Custom reportable
        this.reportable((error) => {
            // Send to Sentry, Datadog, etc.
        });
    }
}
```

---

</details>

---

<details>
<summary><strong>📊 Log Viewer</strong></summary>
<br>

LaraNode includes a built-in web-based log viewer with severity filtering:

```javascript
// config/logging.js
module.exports = {
    allow_log_viewer: true,
    log_viewer: {
        middleware: ['web'],
        endpoint: '/logs',
    },
};
```

Visit `/logs` to view application logs with:
- File browser sidebar
- Severity filters (Error, Warning, Info, Debug)
- Expandable rows for full stack traces
- Chunk-based pagination for large files

---

</details>

---

<details>
<summary><strong>📟 Artisan CLI</strong></summary>
<br>

The LaraNode Artisan CLI provides commands for scaffolding, database management, and running your application.

```bash
# Start the development server
node artisan serve

# Start with a custom port
node artisan serve --port=8080

# Run scheduled commands
node artisan schedule:run
```

#### Available Commands

Here is a full list of available Artisan commands:

| Command | Description | Usage |
|---|---|---|
| **Development** | | |
| `serve` | Serve the application on the local development server | `node artisan serve [options]` |
| `route:list` | List all registered routes | `node artisan route:list [options]` |
| **Make (Scaffolding)** | | |
| `make:controller` | Create a new controller class | `node artisan make:controller [options] <name>` |
| `make:model` | Create a new Loquent model class | `node artisan make:model [options] <name>` |
| `make:middleware` | Create a new middleware class | `node artisan make:middleware <name>` |
| `make:migration` | Create a new migration file | `node artisan make:migration <name>` |
| `make:seeder` | Create a new seeder class | `node artisan make:seeder <name>` |
| `make:request` | Create a new form request class | `node artisan make:request <name>` |
| `make:resource` | Create a new API resource class | `node artisan make:resource [options] <name>` |
| `make:event` | Create a new event class | `node artisan make:event <name>` |
| `make:listener` | Create a new event listener class | `node artisan make:listener <name>` |
| `make:mail` | Create a new mailable class | `node artisan make:mail <name>` |
| `make:notification`| Create a new notification class | `node artisan make:notification <name>` |
| `make:command` | Create a new Artisan command | `node artisan make:command <name>` |
| `make:rule` | Create a new custom validation rule class | `node artisan make:rule <name>` |
| **Database** | | |
| `migrate` | Run the database migrations | `node artisan migrate` |
| `migrate:rollback`| Rollback the last database migration | `node artisan migrate:rollback` |
| `migrate:fresh` | Drop all tables and re-run all migrations | `node artisan migrate:fresh [options]` |
| `db:seed` | Seed the database with records | `node artisan db:seed [options]` |
| **System** | | |
| `schedule:run` | Run the scheduled commands | `node artisan schedule:run` |
| `queue:work` | Start processing jobs on the queue | `node artisan queue:work [options]` |
| `help` | Display help for a specific command | `node artisan help [command]` |

*Note: You can run `node artisan help <command>` for more detailed usage and available options for any specific command.*

---

</details>

---

<details>
<summary><strong>💻 Tinker (Interactive REPL)</strong></summary>
<br>

LaraNode Tinker provides a powerful, interactive Node.js REPL environment where you can interact directly with your completely booted application.

```bash
node artisan tinker
```

Once inside Tinker, you can write JavaScript natively, wait on Promises (top-level await), and all your `app/Models/` classes are auto-loaded! Standard Facades (`DB`, `Route`, `Hash`, `Cache`, etc.) are also injected globally.

```javascript
// Auto-loaded Models & Top-Level Await
>>> await User.first()
User { id: 1, ... }

// Interactive debugging
>>> await DB.table('users').count()
42

// Global Helpers
>>> env('APP_PORT')
'3000'
```

---

</details>

---

<details>
<summary><strong>🪟 Inertia.js (Native SPAs)</strong></summary>
<br>

LaraNode comes with robust, out-of-the-box support for [Inertia.js](https://inertiajs.com).
This allows you to build modern single-page apps using React, Vue, or Svelte—all powered natively by your LaraNode controllers instead of maintaining a separate API!

The built-in `HandleInertiaRequests` middleware automatically handles asset versioning and global data sharing (like the current Auth User and Flash Messages) on every page transition.

### 1. Edge HTML Shell

Create your root template `resources/views/app.edge`. Notice how LaraNode automatically handles sending the initial payload using `{!! jsonPage !!}`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>LaraNode App</title>
    <!-- React Refresh Preamble (Required for Vite React Dev Mode) -->
    <script type="module">
        import RefreshRuntime from "http://localhost:5173/@react-refresh";
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="http://localhost:5173/@vite/client"></script>
    <script type="module" src="http://localhost:5173/resources/js/app.jsx"></script>
</head>
<body>
    <!-- The Inertia Payload is mounted here unescaped natively -->
    <div id="app" data-page="{!! jsonPage !!}"></div>
</body>
</html>
```

### 2. Vite Configuration

Configure `vite.config.js` to bundle your assets:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'public/build',
        rollupOptions: { input: 'resources/js/app.jsx' },
    },
});
```

### 3. Controller Usage

Using Inertia from a LaraNode controller is identical to Laravel. The framework handles rendering the HTML shell or strictly returning JSON for partial reloads automatically behind the scenes!

```javascript
// A standard Express controller method
index(req, res) {
    const users = await DB.table('users').get();
    
    // Renders your 'resources/js/Pages/Users/Index.jsx' seamlessly!
    return res.inertia('Users/Index', { users });
}
```
</details>

---

<details>
<summary><strong>🎧 Events & Listeners</strong></summary>
<br>

LaraNode provides a robust event dispatching system similar to Laravel. Listeners are automatically resolved through the service container.

```javascript
const Event = use('laranode/Support/Facades/Event');

// Dispatch an event
Event.dispatch('OrderShipped', order);

// Listen to an event
Event.listen('OrderShipped', SendShipmentNotification);
```

Register your listeners in `app/Providers/EventServiceProvider.js`.

---

</details>

---

<details>
<summary><strong>🚀 Cache</strong></summary>
<br>

The LaraNode Cache system provides a unified API for various cache drivers. Currently supported drivers: `file` and `memory`.

```javascript
const Cache = use('laranode/Support/Facades/Cache');

// Store an item
await Cache.put('key', 'value', 60);

// Retrieve an item
const value = await Cache.get('key');

// Retrieve & store if empty
const users = await Cache.remember('users', 60, async () => {
    return await DB.table('users').get();
});
```

---

</details>

---

<details>
<summary><strong>📁 Storage / Filesystem</strong></summary>
<br>

LaraNode provides a powerful filesystem abstraction matching Laravel's Storage API.

```javascript
const Storage = use('laranode/Support/Facades/Storage');

// Store a file with visibility
await Storage.put('avatars/1.jpg', fileData, 'public');

// Get URL (requires storage:link)
const url = Storage.url('avatars/1.jpg'); // '/storage/avatars/1.jpg'

// Get Mime Type
const type = await Storage.mimeType('document.pdf'); // 'application/pdf'

// Create symbolic link
// node artisan storage:link

// Read a file
const contents = await Storage.get('file.txt');

// Delete a file
await Storage.delete('file.txt');

// Verify existence
if (await Storage.exists('file.txt')) { ... }

#### File Uploads

LaraNode provides a convenient wrapper for uploaded files with a Laravel-compatible API.

```javascript
async upload(req, res) {
    const file = req.file('avatar'); // Returns UploadedFile instance

    if (file) {
        // Get file info
        const name = file.getClientOriginalName();
        const ext  = file.getClientOriginalExtension();
        const size = file.getSize();

        // Store the file (returns the generated path)
        const path = await file.store('avatars');
        
        return res.json({ path });
    }
}
```
```

---

</details>

---

<details>
<summary><strong>📩 Mail</strong></summary>
<br>

LaraNode's Mail system, built on top of Nodemailer, allows for expressive email creation via Mailable classes.

```javascript
const Mail = use('laranode/Support/Facades/Mail');

// Send a mailable
await Mail.to(user.email).send(new WelcomeMail(user));

// If Mailable implements ShouldQueue, it's sent in the background automatically!
class WelcomeMail extends Mailable implements ShouldQueue { ... }
```

```javascript
// A sample Mailable class
class WelcomeMail extends Mailable {
    constructor(user) { super(); this.user = user; }
    build() {
        return this.from('admin@app.com')
                   .subject('Welcome!')
                   .view('emails.welcome', { user: this.user });
    }
}
```

---

</details>

---

<details>
<summary><strong>🔔 Notifications</strong></summary>
<br>

LaraNode allows you to send notifications across various channels (Mail, Database).

```javascript
// Notify an entity
await Notification.send(user, new InvoicePaid(invoice));
```

```javascript
// A sample Notification class
class InvoicePaid extends Notification {
    via(notifiable) { return ['mail', 'database']; }

    toMail(notifiable) {
        return new MailMessage()
            .greeting('Hello!')
            .line('Your invoice has been paid.')
            .action('View Invoice', invoice.url);
    }

    toDatabase(notifiable) {
        return { invoice_id: this.invoice.id };
    }

    toBroadcast(notifiable) {
        return { amount: this.invoice.total };
    }
}

// Any model can receive notifications using the Notifiable mixin
class User extends Notifiable(Model) { ... }
await user.notify(new InvoicePaid(invoice));
```

---

</details>

---

<details>
<summary><strong>🛠️ Helper Functions</strong></summary>
<br>

LaraNode provides global helper functions:

```javascript
env('APP_NAME', 'default')        // Read environment variable
base_path('storage/logs')         // Absolute path from project root
database_path('database.sqlite')  // Path to database/ directory
config('app.name')                // Read config value
use('App/Models/User')            // Resolve from service container
```

---

</details>

---

## 🔧 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `APP_NAME` | Application name | `LaraNode` |
| `APP_ENV` | Environment (local, production) | `local` |
| `APP_KEY` | Encryption key (auto-generated) | — |
| `APP_DEBUG` | Debug mode | `true` |
| `APP_PORT` | Server port | `3333` |
| `APP_URL` | Application URL | `http://localhost` |
| `APP_LOCALE` | Default locale | `en` |
| `LOG_CHANNEL` | Log channel | `stack` |
| `LOG_LEVEL` | Minimum log level | `debug` |
| `DB_CONNECTION` | Database driver | `sqlite` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_DATABASE` | Database name | `laranode` |
| `DB_USERNAME` | Database user | `root` |
| `DB_PASSWORD` | Database password | — |

---

## 📱 Sample Application

The scaffolded project includes a complete sample application:

- **Authentication** — Login, Register, Logout, Password Reset
- **Todo CRUD** — Full create, read, update, delete with API authentication
- **API Endpoints** — `GET /api/user` for testing API access

### Sample Routes

```javascript
// Web routes (routes/web.js)
Route.get('/login', 'AuthController@showLoginForm');
Route.post('/login', 'AuthController@login');
Route.get('/register', 'AuthController@showRegisterForm');

const AuthController = use('App/Http/Controllers/AuthController');
Route.post('/register', [AuthController, 'register']);

// Protected CRUD routes
Route.group({ middleware: ['auth:api'] }, () => {
    Route.get('/todos', 'TodoController@index');
    Route.post('/todos', 'TodoController@store');
    Route.put('/todos/{todo}', 'TodoController@update');
    Route.delete('/todos/{todo}', 'TodoController@destroy');
});

// API routes (routes/api.js)
Route.get('/user', async (req, res) => {
    const user = await User.first();
    return res.json({ user });
});
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

The LaraNode framework is open-sourced software licensed under the [MIT license](LICENSE).
