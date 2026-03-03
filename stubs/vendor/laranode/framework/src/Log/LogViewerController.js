const fs = require('fs');
const path = require('path');
const Config = use('laranode/Support/Facades/Config');

class LogViewerController {

    async index(req, res) {
        const endpoint = Config.get('logging.log_viewer.endpoint', '/logs');

        // Return stunning UI wrapping an Alpine.js or Vanilla app
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log Viewer</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f111a; color: #e2e8f0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; height: 100vh; overflow: hidden; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0f111a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        .sidebar { background: #161b22; border-right: 1px solid #30363d; width: 320px; min-width: 320px; display: flex; flex-direction: column; }
        .main-content { flex: 1; display: flex; flex-direction: column; background: #0d1117; overflow: hidden; }
        
        .file-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #21262d; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
        .file-item:hover { background: #21262d; }
        .file-item.active { background: #1f6feb22; border-left: 3px solid #1f6feb; }
        .file-name { font-size: 0.85rem; font-weight: 500; word-break: break-all; }
        .file-size { font-size: 0.75rem; color: #8b949e; white-space: nowrap; margin-left: 10px; }
        
        .log-header { background: #161b22; border-bottom: 1px solid #30363d; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .log-table-header { display: grid; grid-template-columns: 90px 160px 70px 1fr; gap: 10px; padding: 10px 20px; font-size: 0.75rem; font-weight: 600; color: #8b949e; border-bottom: 1px solid #30363d; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
        
        .log-entry { border-bottom: 1px solid #21262d; cursor: pointer; transition: background 0.15s; }
        .log-entry:hover { background: #161b22; }
        .log-entry-row { display: grid; grid-template-columns: 90px 160px 70px 1fr; gap: 10px; padding: 10px 20px; font-size: 0.8rem; font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; align-items: center; }
        
        .col-sev { display: flex; align-items: center; gap: 6px; }
        .col-date { color: #8b949e; white-space: nowrap; }
        .col-env { color: #8b949e; }
        .col-msg { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; white-space: nowrap; }
        .badge.error { background: rgba(248,81,73,0.15); color: #f85149; border: 1px solid rgba(248,81,73,0.4); }
        .badge.info { background: rgba(88,166,255,0.15); color: #58a6ff; border: 1px solid rgba(88,166,255,0.4); }
        .badge.warning { background: rgba(210,153,34,0.15); color: #d29922; border: 1px solid rgba(210,153,34,0.4); }
        .badge.debug { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; }
        
        .log-detail { display: none; padding: 14px 20px; background: #0c0e14; border-top: 1px dashed #30363d; }
        .log-detail-label { font-size: 0.7rem; font-weight: 600; color: #58a6ff; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .log-detail-message { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.8rem; color: #e2e8f0; white-space: pre-wrap; word-break: break-all; line-height: 1.6; }
        .log-detail-stack { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.75rem; color: #8b949e; white-space: pre-wrap; word-break: break-all; line-height: 1.5; margin-top: 12px; padding-top: 12px; border-top: 1px solid #21262d; }
        .log-entry.expanded .log-detail { display: block; }
        .log-entry.expanded { background: #161b22; }
        .log-entry.expanded.error-entry { background: rgba(248,81,73,0.03); }
        
        .pagination { display: flex; gap: 5px; align-items: center; }
        .btn { background: #21262d; border: 1px solid #30363d; color: #c9d1d9; padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s; }
        .btn:hover:not(:disabled) { background: #30363d; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .severity-filters { display: flex; gap: 6px; align-items: center; }
        .filter-btn { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; cursor: pointer; transition: all 0.2s; border: 1px solid #30363d; background: #21262d; color: #8b949e; letter-spacing: 0.03em; }
        .filter-btn:hover { background: #30363d; color: #c9d1d9; }
        .filter-btn.active { color: #fff; }
        .filter-btn.active[data-filter="all"] { background: #1f6feb; border-color: #1f6feb; }
        .filter-btn.active[data-filter="error"] { background: rgba(248,81,73,0.25); border-color: rgba(248,81,73,0.6); color: #f85149; }
        .filter-btn.active[data-filter="warning"] { background: rgba(210,153,34,0.25); border-color: rgba(210,153,34,0.6); color: #d29922; }
        .filter-btn.active[data-filter="info"] { background: rgba(88,166,255,0.25); border-color: rgba(88,166,255,0.6); color: #58a6ff; }
        .filter-btn.active[data-filter="debug"] { background: rgba(139,148,158,0.2); border-color: rgba(139,148,158,0.5); color: #c9d1d9; }
        
        .loader { border: 2px solid #30363d; border-top-color: #58a6ff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body class="flex">

    <!-- Sidebar -->
    <div class="sidebar">
        <div class="p-4 border-b border-[#30363d]">
            <h1 class="text-xl font-semibold text-white flex items-center gap-2">
                Log Viewer
            </h1>
        </div>
        <div class="p-4 text-xs font-semibold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d] flex justify-between">
            <span>Log files on Local</span>
            <span id="filesCount">0 files</span>
        </div>
        <div id="fileList" class="flex-1 overflow-y-auto">
            <!-- Files injected here -->
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Header -->
        <div class="log-header">
            <div class="flex items-center gap-4">
                <span id="entriesCount" class="text-sm border border-[#30363d] px-3 py-1.5 rounded-md bg-[#21262d]">0 entries</span>
                <div class="severity-filters">
                    <button class="filter-btn active" data-filter="all" onclick="setFilter('all')">All</button>
                    <button class="filter-btn" data-filter="error" onclick="setFilter('error')">Error</button>
                    <button class="filter-btn" data-filter="warning" onclick="setFilter('warning')">Warning</button>
                    <button class="filter-btn" data-filter="info" onclick="setFilter('info')">Info</button>
                    <button class="filter-btn" data-filter="debug" onclick="setFilter('debug')">Debug</button>
                </div>
                <div id="loadingIndicator" class="loader"></div>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-xs text-[#8b949e]">25 items per page</span>
                <div class="pagination">
                    <button id="btnPrev" class="btn" disabled>&larr;</button>
                    <span id="pageIndicator" class="text-sm px-2">Page 1</span>
                    <button id="btnNext" class="btn" disabled>&rarr;</button>
                </div>
            </div>
        </div>

        <!-- Log Table Header -->
        <div class="log-table-header">
            <div>Severity</div>
            <div>Datetime</div>
            <div>Env</div>
            <div>Message</div>
        </div>

        <!-- Log Data -->
        <div id="logList" class="flex-1 overflow-y-auto w-full">
            <div class="flex h-full items-center justify-center text-[#8b949e]">Select a file to view logs...</div>
        </div>
    </div>

    <script>
        const LOG_API_ENDPOINT = '${endpoint}/api';
        
        let files = [];
        let currentFile = '';
        let currentPage = 1;
        let totalPages = 1;
        let currentFilter = 'all';

        const ui = {
            fileList: document.getElementById('fileList'),
            logList: document.getElementById('logList'),
            filesCount: document.getElementById('filesCount'),
            entriesCount: document.getElementById('entriesCount'),
            btnPrev: document.getElementById('btnPrev'),
            btnNext: document.getElementById('btnNext'),
            pageIndicator: document.getElementById('pageIndicator'),
            loadingIndicator: document.getElementById('loadingIndicator')
        };

        function setFilter(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(\`.filter-btn[data-filter="\${filter}"]\`).classList.add('active');
            loadFile(currentFile, 1);
        }

        // Initialize
        async function init() {
            try {
                const res = await fetch(LOG_API_ENDPOINT);
                const data = await res.json();
                files = data.files;
                ui.filesCount.innerText = files.length + ' files';
                renderFiles();
                
                if (files.length > 0) {
                    loadFile(files[0].name, 1);
                }
            } catch (e) {
                console.error('Failed to init', e);
            }
        }

        function renderFiles() {
            ui.fileList.innerHTML = files.map(f => \`
                <div class="file-item \${f.name === currentFile ? 'active' : ''}" onclick="loadFile('\${f.name}', 1)">
                    <span class="file-name">\${f.name}</span>
                    <span class="file-size">\${f.sizeStr}</span>
                </div>
            \`).join('');
        }

        async function loadFile(fileName, page = 1) {
            currentFile = fileName;
            currentPage = page;
            renderFiles();
            
            ui.loadingIndicator.style.display = 'block';
            ui.logList.innerHTML = '<div class="flex h-full items-center justify-center text-[#8b949e]">Loading...</div>';
            
            try {
                let url = \`\${LOG_API_ENDPOINT}?file=\${fileName}&page=\${page}\`;
                if (currentFilter !== 'all') url += \`&level=\${currentFilter}\`;
                const res = await fetch(url);
                const data = await res.json();
                
                totalPages = data.totalPages;
                const filterLabel = currentFilter !== 'all' ? currentFilter + ' ' : '';
                ui.entriesCount.innerText = data.totalEntries + ' ' + filterLabel + 'entries in ' + fileName;
                ui.pageIndicator.innerText = \`Page \${currentPage} of \${totalPages || 1}\`;
                
                ui.btnPrev.disabled = currentPage <= 1;
                ui.btnNext.disabled = currentPage >= totalPages;
                
                renderLogs(data.entries);
            } catch (e) {
                ui.logList.innerHTML = '<div class="text-red-500 p-5">Error loading logs</div>';
                console.error(e);
            } finally {
                ui.loadingIndicator.style.display = 'none';
            }
        }

        function toggleStack(element) {
            element.classList.toggle('expanded');
        }

        function getSeverityBadge(sev) {
            const lower = (sev || 'info').toLowerCase();
            if (lower.includes('err') || lower.includes('fail') || lower.includes('crit')) return 'error';
            if (lower.includes('warn')) return 'warning';
            if (lower.includes('debug')) return 'debug';
            return 'info';
        }

        function getSeverityIcon(badge) {
            if (badge === 'error') return '<svg style="color:#f85149" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"></path></svg>';
            if (badge === 'warning') return '<svg style="color:#d29922" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575ZM8 5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5Zm1 6a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z"></path></svg>';
            if (badge === 'debug') return '<svg style="color:#8b949e" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Z"></path></svg>';
            return '<svg style="color:#58a6ff" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.25 4.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0v-5.5Z"></path></svg>';
        }

        function renderLogs(entries) {
            if (!entries || entries.length === 0) {
                ui.logList.innerHTML = '<div class="flex h-full items-center justify-center text-[#8b949e]">No entries found' + (currentFilter !== 'all' ? ' for "' + currentFilter + '" filter' : '') + '.</div>';
                return;
            }

            ui.logList.innerHTML = entries.map(entry => {
                const badge = getSeverityBadge(entry.level);
                const hasStack = entry.stack && entry.stack.trim().length > 0;
                const msg = entry.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const stack = hasStack ? entry.stack.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
                
                return \`
                <div class="log-entry \${badge === 'error' ? 'error-entry' : ''}" data-level="\${badge}" onclick="toggleStack(this)">
                    <div class="log-entry-row">
                        <div class="col-sev">
                            \${getSeverityIcon(badge)}
                            <span class="badge \${badge}">\${entry.level}</span>
                        </div>
                        <div class="col-date">\${entry.datetime}</div>
                        <div class="col-env">\${entry.env}</div>
                        <div class="col-msg">\${msg}</div>
                    </div>
                    <div class="log-detail">
                        <div class="log-detail-label">Full Message</div>
                        <div class="log-detail-message">\${msg}</div>
                        \${hasStack ? \`<div class="log-detail-stack"><div class="log-detail-label" style="color:#f85149">Stack Trace</div>\${stack}</div>\` : ''}
                    </div>
                </div>\`
            }).join('');
        }

        ui.btnPrev.addEventListener('click', () => { if (currentPage > 1) loadFile(currentFile, currentPage - 1); });
        ui.btnNext.addEventListener('click', () => { if (currentPage < totalPages) loadFile(currentFile, currentPage + 1); });

        init();
    </script>
</body>
</html>
        `;
        res.status(200).send(html);
    }

    async api(req, res) {
        const logDir = base_path('storage/logs');
        let files = [];

        if (fs.existsSync(logDir)) {
            files = fs.readdirSync(logDir)
                .filter(f => f.endsWith('.log'))
                .map(f => {
                    const stats = fs.statSync(path.join(logDir, f));
                    return {
                        name: f,
                        mtime: stats.mtimeMs,
                        size: stats.size,
                        sizeStr: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
                    };
                })
                .sort((a, b) => b.mtime - a.mtime); // Newest first
        }

        const requestedFile = req.input('file');
        if (!requestedFile || !files.find(f => f.name === requestedFile)) {
            return res.json({ files, entries: [], totalEntries: 0, totalPages: 0 });
        }

        const filePath = path.join(logDir, requestedFile);
        const page = parseInt(req.input('page')) || 1;
        const perPage = 25;
        const levelFilter = req.input('level') || null;

        const parseResult = this.parseLogFileChunked(filePath, page, perPage, levelFilter);

        return res.json({
            files,
            entries: parseResult.entries,
            totalEntries: parseResult.totalEntries,
            totalPages: Math.ceil(parseResult.totalEntries / perPage)
        });
    }

    parseLogFileChunked(filePath, page, perPage, levelFilter = null) {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) return { entries: [], totalEntries: 0 };

        const fd = fs.openSync(filePath, 'r');
        const chunkSize = 64 * 1024; // 64KB chunks
        const buffer = Buffer.alloc(chunkSize);

        let position = stats.size;
        let leftover = '';
        let entries = [];
        let totalParsed = 0;

        const startIndex = (page - 1) * perPage;

        const logPattern = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+):([\s\S]*)/;

        // Helper to classify level into badge category (same logic as frontend)
        function classifyLevel(level) {
            const lower = (level || 'info').toLowerCase();
            if (lower.includes('err') || lower.includes('fail') || lower.includes('crit')) return 'error';
            if (lower.includes('warn')) return 'warning';
            if (lower.includes('debug')) return 'debug';
            return 'info';
        }

        try {
            while (position > 0) {
                const readSize = Math.min(position, chunkSize);
                position -= readSize;

                fs.readSync(fd, buffer, 0, readSize, position);
                const chunkString = buffer.toString('utf8', 0, readSize);

                const combined = chunkString + leftover;
                const parts = combined.split('\n[');

                leftover = parts.shift();
                if (position === 0) {
                    parts.unshift(leftover);
                    leftover = '';
                }

                for (let i = parts.length - 1; i >= 0; i--) {
                    let block = parts[i];
                    if (position > 0 || i > 0 || (position === 0 && block.startsWith('['))) {
                        if (!block.startsWith('[')) block = '[' + block;

                        const match = block.match(logPattern);
                        if (match) {
                            const level = match[3];
                            const badge = classifyLevel(level);

                            // Skip if level filter is active and doesn't match
                            if (levelFilter && badge !== levelFilter) continue;

                            totalParsed++;

                            if (totalParsed > startIndex && entries.length < perPage) {
                                const newlinePos = match[4].indexOf('\n');
                                let message = match[4];
                                let stack = '';

                                if (newlinePos !== -1) {
                                    message = match[4].substring(0, newlinePos);
                                    stack = match[4].substring(newlinePos + 1);
                                }

                                entries.push({
                                    datetime: match[1],
                                    env: match[2],
                                    level: level,
                                    message: message.trim(),
                                    stack: stack.trim()
                                });
                            }
                        }
                    }
                }

                // Early exit: if we've filled the page and read enough to estimate
                if (entries.length >= perPage && !levelFilter) break;
            }
        } finally {
            fs.closeSync(fd);
        }

        // For filtered results or full scan, totalParsed is exact
        // For unfiltered partial reads, estimate total
        let estimatedTotal = totalParsed;
        if (!levelFilter && position > 0) {
            const bytesRead = stats.size - position;
            if (bytesRead > 0 && totalParsed > 0) {
                estimatedTotal = Math.max(totalParsed, Math.floor((totalParsed / bytesRead) * stats.size));
            }
        }

        return {
            entries: entries,
            totalEntries: estimatedTotal
        };
    }
}

module.exports = LogViewerController;
