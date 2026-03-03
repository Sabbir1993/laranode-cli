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

        // If this template extends a layout, extract sections and compile the layout instead
        const extendsMatch = result.match(/@extends\s*\(['"](.+?)['"]\)/);
        if (extendsMatch) {
            const layoutName = extendsMatch[1];

            // Extract all sections from the child template
            // Matches @section('name') ... @endsection
            const sectionRegex = /@section\s*\(['"](.+?)['"]\)\s*([\s\S]*?)@endsection/g;
            let match;
            while ((match = sectionRegex.exec(result)) !== null) {
                sections[match[1]] = match[2];
            }

            // Find and load the parent layout
            const layoutPath = path.join(base_path('resources/views'), `${layoutName.replace(/\./g, '/')}.edge`);
            if (!fs.existsSync(layoutPath)) {
                throw new Error(`Layout [${layoutName}] not found for @extends`);
            }

            // Start compiling the parent layout
            let parentTemplate = fs.readFileSync(layoutPath, 'utf8');

            // Replace @yield('sectionName') in the parent with the extracted child section contents
            parentTemplate = parentTemplate.replace(/@yield\s*\(['"](.+?)['"]\)/g, (fullMatch, sectionName) => {
                return (sections[sectionName] !== undefined) ? sections[sectionName] : '';
            });

            // Now recursively process the rest of the parent layout with substituted sections
            result = parentTemplate;
        }

        // 0. Escape existing backticks and ${} in the source content
        // We do this AFTER layout resolution to ensure parent content is also escaped.
        result = result.replace(/`/g, '\\`').replace(/\${/g, '\\${');

        // 1. Comments {{-- comment --}}
        result = result.replace(/{{--([\s\S]+?)--}}/g, '');

        // 2. Includes @include('partial.name')
        // Note: we use ${} for our own markers, which will NOT be escaped because we do it after step 0
        result = result.replace(/@include\s*\(['"](.+?)['"]\)/g, '${global.view(\'$1\', data)}');

        // 2.1 CSRF Token @csrf
        // Generates a hidden input with the CSRF token
        result = result.replace(/@csrf/g, '<input type="hidden" name="_token" value="${data.csrfToken || \'\'}">');

        // 3. Raw Echo {!! $var !!}
        result = result.replace(/{!!\s*(.+?)\s*!!}/g, '${$1}');

        // 4. Escaped Echo {{ $var }} (Basic escape for now)
        result = result.replace(/{{\s*(.+?)\s*}}/g, '${escapeHtml($1)}');

        // Forelse loops
        result = result.replace(/@forelse\s*\((.+)\s+as\s+(.+)\)/g, '`; if ($1 && $1.length > 0) { for (const $2 of $1) { out += `');
        result = result.replace(/@empty/g, '`; } } else { out += `');
        result = result.replace(/@endforelse/g, '`; } out += `');

        // Basic Loops
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
                // Determine if a variable is defined, and default to empty string if not
                function escapeHtml(unsafe) {
                    if (unsafe === null || unsafe === undefined) return '';
                    return String(unsafe)
                         .replace(/&/g, "&amp;")
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .replace(/"/g, "&quot;")
                         .replace(/'/g, "&#039;");
                }
                
                // Expose data properties as local variables using a with() block MVP
                // In production, we'd use a safer parser mapping, but this mimics Blade's flat data context
                const safeData = new Proxy(data, {
                    has(target, key) {
                        if (typeof key === 'symbol') return false;
                        // Don't shadow internal functions/variables
                        if (['escapeHtml', 'safeData', 'data', 'out'].includes(key)) return false;
                        // Don't shadow global objects like String, Math, console
                        if (key in global) return false;
                        return true;
                    },
                    get(target, key) { return target[key]; }
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
}

module.exports = EdgeCompiler;
