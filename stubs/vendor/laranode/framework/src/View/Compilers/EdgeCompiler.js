const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EdgeCompiler {
    constructor(cachePath) {
        this.cachePath = cachePath;
        // Ensure cache directory exists
        if (!fs.existsSync(this.cachePath)) {
            fs.mkdirSync(this.cachePath, { recursive: true });
        }
    }

    /**
     * Compile a template string into PHP/JS equivalent
     * @param {string} template 
     * @returns {string} Compiled JS string
     */
    compileString(template, isChild = false) {
        let result = template;
        const sections = {};

        // If this template extends a layout or uses a layout, extract sections and compile the layout instead
        const extendsMatch = result.match(/@(extends|layout)\s*\(['"](.+?)['"]\)/);
        if (extendsMatch) {
            const layoutName = extendsMatch[2];

            // Extract all sections from the child template
            const sectionRegex = /@section\s*\(['"](.+?)['"]\)\s*([\s\S]*?)@endsection/g;
            let match;
            while ((match = sectionRegex.exec(result)) !== null) {
                sections[match[1]] = match[2];
            }

            // Find and load the parent layout
            let layoutPath = '';
            if (path.isAbsolute(layoutName)) {
                layoutPath = layoutName;
                if (!path.extname(layoutPath)) {
                    layoutPath += '.edge';
                }
            } else {
                layoutPath = path.join(base_path('resources/views'), `${layoutName.replace(/\./g, '/')}.edge`);
            }

            if (!fs.existsSync(layoutPath)) {
                throw new Error(`Layout [${layoutName}] not found for @${extendsMatch[1]}`);
            }

            // Start compiling the parent layout
            let parentTemplate = fs.readFileSync(layoutPath, 'utf8');

            // Replace @yield('sectionName') in the parent with the extracted child section contents
            parentTemplate = parentTemplate.replace(/@yield\s*\(['"](.+?)['"]\)/g, (fullMatch, sectionName) => {
                return (sections[sectionName] !== undefined) ? sections[sectionName] : '';
            });

            // Also support @section('name') @endsection in layouts as placeholders (AdonisJS style)
            parentTemplate = parentTemplate.replace(/@section\s*\(['"](.+?)['"]\)\s*@endsection/g, (fullMatch, sectionName) => {
                return (sections[sectionName] !== undefined) ? sections[sectionName] : '';
            });

            // Now recursively process the rest of the parent layout with substituted sections
            result = parentTemplate;
        }

        // Fix 1: Extract <script> blocks before compilation so directives and backtick-escaping
        // don't fire inside browser JS code.
        const { cleaned, slots } = this._extractScriptBlocks(result);
        result = cleaned;

        // 0. Escape existing backticks and ${} in the source content (HTML only — scripts already extracted)
        // We do this AFTER layout resolution to ensure parent content is also escaped.
        result = result.replace(/`/g, '\\`').replace(/\${/g, '\\${');

        // 1. Comments {{-- comment --}}
        result = result.replace(/{{--([\s\S]+?)--}}/g, '');

        // 2. Includes @include('partial.name', { extra: 'data' })
        // Supports optional second argument for passing local variables
        result = result.replace(/@include\s*\(['"](.+?)['"]\s*(?:,\s*([\s\S]+?))?\s*\)/g, (match, ipath, extraData) => {
            let safeExtra = '{}';
            if (extraData) {
                if (!this._isValidObjectLiteral(extraData.trim()))
                    throw new Error(`[EdgeCompiler] Unsafe @include extra data: ${extraData.trim().slice(0, 80)}`);
                safeExtra = extraData.trim();
            }
            return `\${global.view('${ipath}', Object.assign({}, data, ${safeExtra}))}`;
        });

        // 2.1 CSRF Token @csrf
        // Generates a hidden input with the CSRF token
        result = result.replace(/@csrf/g, '<input type="hidden" name="_token" value="${data.csrfToken || \'\'}">');

        // 3. Raw Echo {!! $var !!} — __raw() wrapper makes unescaped output visible in generated code
        result = result.replace(/{!!\s*(.+?)\s*!!}/g, '${__raw($1)}');

        // 4. Escaped Echo {{ $var }} (Basic escape for now)
        result = result.replace(/{{\s*(.+?)\s*}}/g, '${escapeHtml($1)}');

        // Forelse loops
        result = result.replace(/@forelse\s*\((.+)\s+as\s+(.+)\)/g, (_, col, item) => {
            this._assertSafeExpression(col, '@forelse');
            return '`; if (' + col + ' && ' + col + '.length > 0) { for (const ' + item + ' of ' + col + ') { out += `';
        });
        result = result.replace(/@empty/g, '`; } } else { out += `');
        result = result.replace(/@endforelse/g, '`; } out += `');

        // Basic Loops (Supports Array and Objects via Object.values)
        result = result.replace(/@each\s*\((.+)\s+in\s+(.+)\)/g, (_, item, col) => {
            this._assertSafeExpression(col, '@each');
            return '`; { let $loop = { index: 0 }; for (const ' + item + ' of (Array.isArray(' + col + ') ? ' + col + ' : (typeof ' + col + ' === "object" && ' + col + ' !== null ? Object.values(' + col + ') : []))) { out += `';
        });
        result = result.replace(/@endeach/g, '`; $loop.index++; } } out += `');

        result = result.replace(/@foreach\s*\((.+)\s+as\s+(.+)\)/g, (_, col, item) => {
            this._assertSafeExpression(col, '@foreach');
            return '`; for (const ' + item + ' of (' + col + ' || [])) { out += `';
        });
        result = result.replace(/@endforeach/g, '`; } out += `');

        result = result.replace(/@for\s*\((.+)\)/g, (_, expr) => {
            // @for allows semicolons (for init; cond; step) — only block function declarations
            if (/\bfunction\b/.test(expr))
                throw new Error(`[EdgeCompiler] Unsafe expression in @for: ${expr.slice(0, 60)}`);
            return '`; for (' + expr + ') { out += `';
        });
        result = result.replace(/@endfor/g, '`; } out += `');

        // 5. Control Structures
        result = result.replace(/@if\s*\((.+)\)/g, (_, expr) => {
            this._assertSafeExpression(expr, '@if');
            return '`; if (' + expr + ') { out += `';
        });
        result = result.replace(/@elseif\s*\((.+)\)/g, (_, expr) => {
            this._assertSafeExpression(expr, '@elseif');
            return '`; } else if (' + expr + ') { out += `';
        });
        result = result.replace(/@else/g, '`; } else { out += `');
        result = result.replace(/@endif/g, '`; } out += `');

        // @auth / @guest
        result = result.replace(/@auth/g, '`; if (data.auth && data.auth.user) { out += `');
        result = result.replace(/@endauth/g, '`; } out += `');
        result = result.replace(/@guest/g, '`; if (!data.auth || !data.auth.user) { out += `');
        result = result.replace(/@endguest/g, '`; } out += `');

        // Reintegrate <script> blocks with only {{ }} / {!! !!} interpolation applied
        for (const token of Object.keys(slots))
            slots[token] = this._compileScriptBlock(slots[token]);
        result = this._reintegrateScriptBlocks(result, slots);

        // Wrap the whole thing in a function body that returns the built string
        const compiled = `
            let out = \`${result}\`;
            return out;
        `;

        return compiled;
    }

    /**
     * Compile a file and cache it. Returns the path to the cached compiled file.
     * @param {string} viewPath 
     * @returns {string} Path to cached file
     */
    compile(viewPath) {
        if (!fs.existsSync(viewPath)) {
            throw new Error(`View not found: ${viewPath}`);
        }

        const stats = fs.statSync(viewPath);
        const hash = crypto.createHash('sha1').update(viewPath).digest('hex');
        const compiledPath = path.join(this.cachePath, `${hash}.js`);

        // Check if cached version exists and is newer than source
        if (config('app.env') !== 'local' && fs.existsSync(compiledPath)) {
            const cacheStats = fs.statSync(compiledPath);
            if (cacheStats.mtime >= stats.mtime) {
                return compiledPath;
            }
        }

        const template = fs.readFileSync(viewPath, 'utf8');
        const compiledContent = this.compileString(template);

        // We wrap the compiled code in a module.exports function taking data
        const jsWrapper = `
            module.exports = function(data) {
                function escapeHtml(unsafe) {
                    if (unsafe === null || unsafe === undefined) return '';
                    return String(unsafe)
                         .replace(/&/g, "&amp;")
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .replace(/"/g, "&quot;")
                         .replace(/'/g, "&#039;");
                }

                // RAW OUTPUT — no HTML escaping. Only pass pre-sanitized values. XSS risk if user data is passed here.
                function __raw(value) {
                    if (value === null || value === undefined) return '';
                    return String(value);
                }

                // Block dangerous Node.js globals from template expressions
                const DANGEROUS = new Set([
                    'require','__dirname','__filename','module','exports',
                    'process','Buffer','eval','Function','global','globalThis','GLOBAL',
                    'constructor', 'prototype', '__proto__'
                ]);

                // Fix B: Wrap every callable so .constructor/.prototype are unreachable.
                // Recursive so child functions returned from calls are also wrapped.
                const CALL_BLOCKED = new Set(['constructor','__proto__','prototype','caller','arguments']);
                function mkSafe(target) {
                    if (typeof target !== 'function' && (typeof target !== 'object' || target === null)) return target;
                    return new Proxy(target, {
                        get(t, prop) {
                            // Fix: Proxy invariant requires us to return actual value for non-configurable props
                            const desc = Object.getOwnPropertyDescriptor(t, prop);
                            if (desc && !desc.configurable && !desc.writable) {
                                return Reflect.get(t, prop);
                            }

                            if (typeof prop === 'string' && CALL_BLOCKED.has(prop)) return undefined;
                            let v = Reflect.get(t, prop);

                            // If v is a function (and not a constructor), bind it to the original target
                            // so built-ins with internal slots (Date, RegExp, Promise) still work.
                            if (typeof v === 'function' && !/^[A-Z]/.test(v.name || '')) {
                                v = v.bind(t);
                            }
                            return mkSafe(v); // Recursive protection
                        },
                        getPrototypeOf() { return null; },
                        construct(t, args) {
                            const result = Reflect.construct(t, args);
                            return mkSafe(result);
                        },
                        apply(t, thisArg, args) {
                            const result = Reflect.apply(t, thisArg, args);
                            return mkSafe(result);
                        },
                    });
                }
                function mkSafeConstructor(ctor) {
                    if (typeof ctor !== 'function') return mkSafe(ctor);
                    return new Proxy(ctor, {
                        get(t, prop) {
                            const desc = Object.getOwnPropertyDescriptor(t, prop);
                            if (desc && !desc.configurable && !desc.writable) {
                                return Reflect.get(t, prop);
                            }

                            if (typeof prop === 'string' && CALL_BLOCKED.has(prop)) return undefined;
                            const v = Reflect.get(t, prop);
                            return mkSafe(v);
                        },
                        getPrototypeOf() { return null; },
                        construct(t, args) { return mkSafe(Reflect.construct(t, args)); },
                    });
                }

                // Stripped-down safe replacements for common globals.
                // All callables wrapped with mkSafe() so .constructor chains are blocked.
                const SAFE_GLOBALS = Object.freeze({
                    Math, JSON,
                    parseInt:            mkSafe(parseInt),
                    parseFloat:          mkSafe(parseFloat),
                    isNaN, isFinite,
                    encodeURIComponent:  mkSafe(encodeURIComponent),
                    decodeURIComponent:  mkSafe(decodeURIComponent),
                    String:              mkSafe((v) => String(v)),
                    Number:              mkSafe((v) => Number(v)),
                    Boolean:             mkSafe((v) => Boolean(v)),
                    // Constructors — use mkSafeConstructor so new Date() / new RegExp() work
                    Date:                mkSafeConstructor(Date),
                    RegExp:              mkSafeConstructor(RegExp),
                    Error:               mkSafeConstructor(Error),
                    Array: Object.freeze({
                        isArray: mkSafe(Array.isArray),
                        from:    mkSafe(Array.from.bind(Array)),
                        of:      mkSafe(Array.of.bind(Array)),
                    }),
                    Object: Object.freeze({
                        keys:    mkSafe(Object.keys.bind(Object)),
                        values:  mkSafe(Object.values.bind(Object)),
                        entries: mkSafe(Object.entries.bind(Object)),
                        assign:  mkSafe(Object.assign.bind(Object)),
                        freeze:  mkSafe(Object.freeze.bind(Object)),
                        create:  mkSafe(Object.create.bind(Object)),
                        hasOwn:  mkSafe((o, k) => Object.prototype.hasOwnProperty.call(o, k)),
                    }),
                    // Framework-registered helpers — wrapped to block .constructor chain
                    route:               mkSafe(global.route),
                    url:                 mkSafe(global.url),
                    asset:               mkSafe(global.asset),
                    config:              mkSafe(global.config),
                    env:                 mkSafe(global.env),
                    use:                 mkSafe(global.use),
                    uses:                mkSafe(global.uses),
                    collect:             mkSafe(global.collect),
                    base_path:           mkSafe(global.base_path),
                    app_path:            mkSafe(global.app_path),
                    resource_path:       mkSafe(global.resource_path),
                    storage_path:        mkSafe(global.storage_path),
                    public_path:         mkSafe(global.public_path),
                    dump:                mkSafe(global.dump),
                    dd:                  mkSafe(global.dd),
                    e:                   mkSafe(global.e),
                    encrypt:             mkSafe(global.encrypt),
                    decrypt:             mkSafe(global.decrypt),
                    request:             mkSafe(global.request),
                    response:            mkSafe(global.response),
                });

                const safeData = new Proxy(data, {
                    has(target, key) {
                        if (typeof key === 'symbol') return false;
                        if (DANGEROUS.has(key)) return true; // route through get → undefined
                        // Internal compile-scope names: resolve as real locals, not via proxy
                        if (['escapeHtml','__raw','safeData','data','out','DANGEROUS','SAFE_GLOBALS','CALL_BLOCKED','mkSafe','mkSafeConstructor'].includes(key)) return false;
                        if (Object.prototype.hasOwnProperty.call(target, key)) return true;
                        if (key in SAFE_GLOBALS) return true; // intercept via get, not real global
                        // Fix A: return true (not false) so ALL unknown names route through get()
                        return true;
                    },
                    get(target, key) {
                        if (DANGEROUS.has(key)) return undefined;
                        if (Object.prototype.hasOwnProperty.call(target, key)) return target[key];
                        // SAFE_GLOBALS check comes before falling through to undefined
                        if (key in SAFE_GLOBALS) return SAFE_GLOBALS[key];
                        return undefined; // unknown identifier → undefined, not a real global
                    }
                });

                return (function() {
                    with(safeData) {
                        ${compiledContent}
                    }
                })();
            };
        `;

        fs.writeFileSync(compiledPath, jsWrapper);

        return compiledPath;
    }

    // ── Fix 1: Script-block awareness ────────────────────────────────────────────

    /** Replace <script>…</script> blocks with tokens before HTML compilation. */
    _extractScriptBlocks(template) {
        const slots = {};
        let idx = 0;
        const cleaned = template.replace(/<script(\s[^>]*)?>[\s\S]*?<\/script>/gi, (match) => {
            const token = `__SCRIPT_SLOT_${idx++}__`;
            slots[token] = match;
            return token;
        });
        return { cleaned, slots };
    }

    /** Apply only {{ }} and {!! !!} interpolation inside a <script> block — no backtick escaping, no @directives. */
    _compileScriptBlock(scriptTag) {
        const m = scriptTag.match(/^(<script(\s[^>]*)?>)([\s\S]*)(<\/script>)$/i);
        if (!m) return scriptTag;
        let inner = m[3];
        // NEW: Escape backticks and interpolation start because this will be inside a `...` literal
        inner = inner.replace(/`/g, '\\`').replace(/\${/g, '\\${');
        inner = inner.replace(/{{--([\s\S]+?)--}}/g, '');
        inner = inner.replace(/{!!\s*(.+?)\s*!!}/g, '${__raw($1)}');
        inner = inner.replace(/{{\s*(.+?)\s*}}/g, '${escapeHtml($1)}');
        return m[1] + inner + m[4];
    }

    /** Restore script tokens with their (now interpolation-processed) original content. */
    _reintegrateScriptBlocks(template, slots) {
        let result = template;
        for (const [token, content] of Object.entries(slots))
            result = result.replace(token, () => content);
        return result;
    }

    // ── Fix 2: Directive expression guard ────────────────────────────────────────

    /**
     * Throw if a directive expression contains structural injection patterns.
     * Blocks: { } ; function keyword — the exact payload form in the audit report.
     */
    _assertSafeExpression(expr, directive) {
        if (/[;{}]/.test(expr))
            throw new Error(`[EdgeCompiler] Illegal characters in ${directive} expression: ${expr.slice(0, 60)}`);
        if (/\bfunction\b/.test(expr))
            throw new Error(`[EdgeCompiler] function keyword not allowed in ${directive} expression: ${expr.slice(0, 60)}`);
        if (/\b(require|eval|import|constructor|prototype|__proto__)\b/.test(expr))
            throw new Error(`[EdgeCompiler] Unsafe identifier in ${directive} expression: ${expr.slice(0, 60)}`);
    }

    // ── Fix 4: @include extraData validation ─────────────────────────────────────

    /**
     * Validate that an @include extra-data argument is a safe object literal.
     * Uses vm.Script test-compile to catch syntax errors, plus keyword blocklist.
     */
    _isValidObjectLiteral(str) {
        const vm = require('vm');
        const t = str.trim();
        if (!t.startsWith('{') || !t.endsWith('}')) return false;
        if (t.includes(';')) return false;
        // Block prototype access, constructors, and known dangerous identifiers
        if (/\b(require|eval|Function|process|import|constructor|prototype|__proto__)\b/.test(t)) return false;
        // Test-compile: catches syntax errors and template-literal injection
        try {
            new vm.Script('(' + t + ')');
        } catch {
            return false;
        }
        return true;
    }
}

module.exports = EdgeCompiler;
