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
        result = result.replace(/@forelse\s*\((.+)\s+as\s+(.+)\)/g, '`; if ($1 && $1.length > 0) { for (const $2 of $1) { out += `');
        result = result.replace(/@empty/g, '`; } } else { out += `');
        result = result.replace(/@endforelse/g, '`; } out += `');

        // Basic Loops (Supports Array and Objects via Object.values)
        result = result.replace(/@each\s*\((.+)\s+in\s+(.+)\)/g, '`; { let $loop = { index: 0 }; for (const $1 of (Array.isArray($2) ? $2 : (typeof $2 === "object" && $2 !== null ? Object.values($2) : []))) { out += `');
        result = result.replace(/@endeach/g, '`; $loop.index++; } } out += `');

        result = result.replace(/@foreach\s*\((.+)\s+as\s+(.+)\)/g, '`; for (const $2 of ($1 || [])) { out += `');
        result = result.replace(/@endforeach/g, '`; } out += `');

        result = result.replace(/@for\s*\((.+)\)/g, '`; for ($1) { out += `');
        result = result.replace(/@endfor/g, '`; } out += `');

        // 5. Control Structures
        result = result.replace(/@if\s*\((.+)\)/g, '`; if ($1) { out += `');
        result = result.replace(/@elseif\s*\((.+)\)/g, '`; } else if ($1) { out += `');
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
                    'process','Buffer','eval','Function','global','globalThis','GLOBAL'
                ]);

                const safeData = new Proxy(data, {
                    has(target, key) {
                        if (typeof key === 'symbol') return false;
                        if (DANGEROUS.has(key)) return true; // route through get → undefined
                        if (['escapeHtml','__raw','safeData','data','out','DANGEROUS'].includes(key)) return false;
                        if (Object.prototype.hasOwnProperty.call(target, key)) return true;
                        if (key in global) return false;
                        return true;
                    },
                    get(target, key) {
                        if (DANGEROUS.has(key)) return undefined;
                        return target[key];
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

    // ── Fix 4: @include extraData validation ─────────────────────────────────────

    /** Validate that an @include extra-data argument is a safe object literal (no code injection). */
    _isValidObjectLiteral(str) {
        const t = str.trim();
        if (!t.startsWith('{') || !t.endsWith('}')) return false;
        if (t.includes(';')) return false;
        if (/\b(require|eval|Function|process|import)\b/.test(t)) return false;
        let depth = 0;
        for (const ch of t) {
            if (ch === '{') depth++;
            if (ch === '}') depth--;
            if (depth < 0) return false;
        }
        return depth === 0;
    }
}

module.exports = EdgeCompiler;
