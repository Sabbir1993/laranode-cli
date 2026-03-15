const path = require('path');
const Env = require('./Env');
const HttpContext = require('../Foundation/Http/HttpContext');

/**
 * Global helpers that mimic Laravel's helpers
 */

// Global state for application root path
let appRootPath = process.cwd();

/**
 * Set the application base path
 * @param {string} rootPath 
 */
function setBasePath(rootPath) {
    appRootPath = rootPath;
}

/**
 * Get the application base path
 * @param {string} extra 
 * @returns {string}
 */
function base_path(extra = '') {
    return path.join(appRootPath, extra);
}

/**
 * Get the app directory path
 * @param {string} extra 
 * @returns {string}
 */
function app_path(extra = '') {
    return path.join(appRootPath, 'app', extra);
}

/**
 * Get the config directory path
 * @param {string} extra 
 * @returns {string}
 */
function config_path(extra = '') {
    return path.join(appRootPath, 'config', extra);
}

/**
 * Get the database directory path
 * @param {string} extra 
 * @returns {string}
 */
function database_path(extra = '') {
    return path.join(appRootPath, 'database', extra);
}

/**
 * Get the public directory path
 * @param {string} extra 
 * @returns {string}
 */
function public_path(extra = '') {
    return path.join(appRootPath, 'public', extra);
}

/**
 * Get the resources directory path
 * @param {string} extra 
 * @returns {string}
 */
function resource_path(extra = '') {
    return path.join(appRootPath, 'resources', extra);
}

/**
 * Get the storage directory path
 * @param {string} extra 
 * @returns {string}
 */
function storage_path(extra = '') {
    return path.join(appRootPath, 'storage', extra);
}

/**
 * Get an environment variable
 * @param {string} key 
 * @param {*} defaultValue 
 * @returns {*}
 */
function env(key, defaultValue = null) {
    return Env.get(key, defaultValue);
}

/**
 * Get or set configuration values
 * @param {string|Array|Object} key 
 * @param {*} defaultValue 
 * @returns {*}
 */
function config(key = null, defaultValue = null) {
    // This will be wired up once the Config Repository is built
    const ConfigRepository = require('./Facades/Config');

    if (key === null) {
        return ConfigRepository;
    }

    if (Array.isArray(key)) {
        throw new Error('Setting config arrays not yet supported by helper');
    }

    if (typeof key === 'object') {
        for (const [k, v] of Object.entries(key)) {
            ConfigRepository.set(k, v);
        }
        return;
    }

    return ConfigRepository.get(key, defaultValue);
}

/**
 * Dump the passed variables
 */
function dump(...args) {
    console.log(...args);
}

/**
 * Require a module via namespace, similar to Laravel's use.
 * Maps 'laranode/' to 'vendor/laranode/framework/src/'
 * Maps 'App/' to 'app/'
 * 
 * @param {string} modulePath 
 * @returns {*}
 */
function use(modulePath) {
    if (modulePath.startsWith('laranode/')) {
        return require(path.join(appRootPath, 'vendor/laranode/framework/src', modulePath.substring(9)));
    }
    if (modulePath.startsWith('App/')) {
        return require(path.join(appRootPath, 'app', modulePath.substring(4)));
    }
    return require(path.join(appRootPath, modulePath));
}

/**
 * Dump the passed variables and end the script
 */
function dd(...args) {
    dump(...args);
    process.exit(1);
}

/**
 * Create a new collection
 * @param {Array|Object} items 
 * @returns {Collection}
 */
function collect(items = []) {
    const Collection = use('laranode/Support/Collection');
    return new Collection(items);
}

/**
 * Generate a URL for the application
 * @param {string} path 
 * @returns {string}
 */
function url(path = '') {
    const appUrl = config('app.url', 'http://localhost');
    const port = config('app.port', 3000);
    // If running on local standard port, format correctly
    const baseUrl = appUrl.includes('localhost') && port ? `${appUrl}:${port}` : appUrl;

    // remove leading slashes from path and trailing from base
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = path.toString().replace(/^\//, '');

    return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

/**
 * Generate a URL for an asset
 * @param {string} path 
 * @returns {string}
 */
function asset(path) {
    return url(path); // For now, asset is just url()
}

/**
 * Generate a URL to a named route.
 * @param {string} name 
 * @param {Object} parameters 
 * @returns {string}
 */
function route(name, parameters = {}) {
    // This assumes the Router is bound as an explicitly accessible singleton 
    // or we resolve it from the application context. We can fetch it via the Facade.
    const RouteCache = use('laranode/Support/Facades/Route');
    const routeObj = RouteCache.getRouteByName(name);

    if (!routeObj) {
        throw new Error(`Route [${name}] not defined.`);
    }

    let uri = routeObj.uri;

    // Replace :param with parameter value
    for (const [key, value] of Object.entries(parameters)) {
        uri = uri.replace(`:${key}`, value);
        uri = uri.replace(`{${key}}`, value); // also try swapping laravel pattern just in case
    }

    // append any unused parameters as query string
    const unusedParams = { ...parameters };
    const usedMatches = routeObj.uri.match(/\:([a-zA-Z0-9_]+)/g) || [];
    usedMatches.forEach(match => {
        const key = match.substring(1);
        delete unusedParams[key];
    });

    const query = Object.keys(unusedParams).length > 0
        ? '?' + new URLSearchParams(unusedParams).toString()
        : '';

    return url(uri) + query;
}

/**
 * Encrypt the given value using the Crypt service.
 * @param {string} value 
 * @returns {string}
 */
function encrypt(value) {
    const Crypt = use('laranode/Support/Facades/Crypt');
    return Crypt.encrypt(value);
}

/**
 * Decrypt the given value using the Crypt service.
 * @param {string} value 
 * @returns {string}
 */
function decrypt(value) {
    const Crypt = use('laranode/Support/Facades/Crypt');
    return Crypt.decrypt(value);
}

/**
 * Apply multiple mixins/traits to a base class.
 * @param {Function} BaseClass 
 * @param  {...Function} traits 
 * @returns {Function}
 */
function uses(BaseClass, ...traits) {
    if (traits.length === 1 && Array.isArray(traits[0])) {
        traits = traits[0];
    }
    return traits.reduce((Base, trait) => trait(Base), BaseClass);
}

/**
 * Get the current request instance.
 * @returns {Request}
 */
function request() {
    const expressReq = HttpContext.getRequest();
    if (!expressReq) return null;
    const Request = use('laranode/Http/Request');
    return new Request(expressReq);
}

/**
 * Get the current response instance.
 * @returns {Response}
 */
function response() {
    const expressRes = HttpContext.getResponse();
    if (!expressRes) return null;
    const Response = use('laranode/Http/Response');
    return new Response(expressRes);
}

/**
 * Escape HTML entities - Laravel's e() helper
 * Supports HtmlString objects that bypass escaping
 * @param {*} value 
 * @returns {string}
 */
function e(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && typeof value.toHtmlString === 'function') {
        return value.toHtmlString();
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Attach to global scope for Laravel-like experience
global.setBasePath = setBasePath;
global.base_path = base_path;
global.app_path = app_path;
global.config_path = config_path;
global.database_path = database_path;
global.public_path = public_path;
global.resource_path = resource_path;
global.storage_path = storage_path;
global.env = env;
global.config = config;
global.dump = dump;
global.dd = dd;
global.use = use;
global.uses = uses;
global.collect = collect;
global.url = url;
global.asset = asset;
global.route = route;
global.encrypt = encrypt;
global.decrypt = decrypt;
global.request = request;
global.response = response;
global.e = e;

module.exports = {
    setBasePath,
    base_path,
    app_path,
    config_path,
    database_path,
    public_path,
    resource_path,
    storage_path,
    env,
    config,
    dump,
    dd,
    use,
    uses,
    collect,
    url,
    asset,
    route,
    encrypt,
    decrypt,
    request,
    response,
    e
};
