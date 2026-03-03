# LaraNode Framework

LaraNode is a powerful, expressive, and elegant Node.js framework designed to mirror the architecture and developer experience of Laravel. Built on top of Express.js, it provides a robust foundation for building modern web applications with a familiar, elegant API.

## Features

- **🏛️ Laravel-like Architecture**: Familiar directory structure (app/, routes/, config/, resources/, database/, etc.).
- **🧩 Service Container & Providers**: Powerful dependency injection and modular service registration.
- **🛣️ Expressive Routing**: Support for route groups, middleware, prefixes, and named routes.
- **🗄️ Loquent ORM**: An Active Record implementation for Node.js with support for relationships, eager loading, and accessors.
- **✨ Edge Templating**: A Blade-like templating engine for building dynamic views.
- **🛡️ Secure by Default**: Built-in middleware for CSRF protection, CORS, and Authentication (Sanctum-style API tokens).
- **📟 Artisan CLI**: A command-line interface for common tasks like running migrations and starting the development server.
- **📦 Form Request Validation**: Elegant request validation classes and custom rules.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Generate application key (Optional for now):
   ```bash
   node artisan key:generate
   ```

### Running the Development Server

Start the integrated development server using Artisan:

```bash
node artisan serve
```

Or run directly with node:

```bash
node server.js
```

The application will be available at `http://localhost:3000`.

## Architecture Overview

LaraNode follows the standard Laravel architecture:

- **`app/`**: Contains the core application logic (Models, Controllers, Middleware, Providers).
- **`bootstrap/`**: Handles the application initialization and container binding.
- **`config/`**: Stores application configuration files.
- **`database/`**: Contains migrations, factories, and seeders.
- **`public/`**: Publicly accessible assets.
- **`resources/`**: Views (Edge templates) and language files.
- **`routes/`**: Web and API route definitions.
- **`storage/`**: Application-generated files (logs, compiled views, etc.).
- **`vendor/`**: Framework source code and dependencies.

## License

The LaraNode framework is open-sourced software licensed under the [MIT license](LICENSE).
