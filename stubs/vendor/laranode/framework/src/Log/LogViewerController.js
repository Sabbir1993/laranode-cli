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
        
        .file-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #21262d; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; position: relative; group; }
        .file-item:hover { background: #21262d; }
        .file-item.active { background: #1f6feb22; border-left: 3px solid #1f6feb; }
        .file-name { font-size: 0.85rem; font-weight: 500; word-break: break-all; }
        .file-size { font-size: 0.75rem; color: #8b949e; white-space: nowrap; margin-left: 10px; }
        
        .log-header { background: #161b22; border-bottom: 1px solid #30363d; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
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
        .log-detail-message { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.8rem; color: #e2e8f0; white-space: pre-wrap; word-break: break-all; line-height: 1.6; }
        .log-entry.expanded .log-detail { display: block; }
        
        .btn { background: #21262d; border: 1px solid #30363d; color: #c9d1d9; padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .btn:hover:not(:disabled) { background: #30363d; color: #fff; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-danger:hover { background: #f8514922; border-color: #f8514988; color: #f85149; }
        
        .filter-btn { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; cursor: pointer; transition: all 0.2s; border: 1px solid #30363d; background: #21262d; color: #8b949e; }
        .filter-btn.active { color: #fff; border-color: #1f6feb; background: #1f6feb; }
        
        .search-input { background: #0d1117; border: 1px solid #30363d; color: #e2e8f0; padding: 6px 12px 6px 36px; border-radius: 6px; font-size: 0.85rem; width: 240px; transition: border-color 0.2s; }
        .search-input:focus { outline: none; border-color: #1f6feb; box-shadow: 0 0 0 3px rgba(31,111,235,0.15); }
        .search-container { position: relative; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #8b949e; pointer-events: none; }
    </style>
</head>
<body class="flex">

    <!-- Sidebar -->
    <div class="sidebar">
        <div class="p-4 border-b border-[#30363d] flex justify-between items-center">
            <h1 class="text-xl font-semibold text-white">Log Viewer</h1>
            <div id="loadingIndicator" class="hidden">
                 <svg class="animate-spin h-5 w-5 text-[#58a6ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
        </div>
        <div class="p-4 text-xs font-semibold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d] flex justify-between">
            <span>Server Logs</span>
            <span id="filesCount">0 files</span>
        </div>
        <div id="fileList" class="flex-1 overflow-y-auto"></div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Header -->
        <div class="log-header">
            <div class="flex items-center gap-4">
                <div class="search-container">
                    <svg class="search-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                    <input type="text" id="searchInput" class="search-input" placeholder="Search logs..." oninput="handleSearch(this.value)">
                </div>
                <div class="severity-filters">
                    <button class="filter-btn active" data-filter="all" onclick="setFilter('all')">All</button>
                    <button class="filter-btn" data-filter="error" onclick="setFilter('error')">Error</button>
                    <button class="filter-btn" data-filter="warning" onclick="setFilter('warning')">Warning</button>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <span id="entriesCount" class="text-xs text-[#8b949e]">0 entries</span>
                <div class="flex items-center gap-2">
                    <button id="btnClearLog" class="btn btn-danger" onclick="clearCurrentLog()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Clear
                    </button>
                    <div class="h-6 w-[1px] bg-[#30363d] mx-1"></div>
                    <div class="pagination">
                        <button id="btnPrev" class="btn" disabled>&larr;</button>
                        <span id="pageIndicator" class="text-xs font-medium px-2">Page 1</span>
                        <button id="btnNext" class="btn" disabled>&rarr;</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Log Table -->
        <div class="log-table-header">
            <div>Severity</div>
            <div>Datetime</div>
            <div>Env</div>
            <div>Message</div>
        </div>
        <div id="logList" class="flex-1 overflow-y-auto"></div>
    </div>

    <script>
        const LOG_API_ENDPOINT = '${endpoint}/api';
        let files = [];
        let currentFile = '';
        let currentPage = 1;
        let totalPages = 1;
        let currentFilter = 'all';
        let searchTimeout;
        let searchQuery = '';

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

        // Escape HTML to prevent XSS when inserting log data into innerHTML
        function esc(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
        }

        function handleSearch(val) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = val;
                loadFile(currentFile, 1);
            }, 500);
        }

        function setFilter(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
            loadFile(currentFile, 1);
        }

        async function init() {
            try {
                const res = await fetch(LOG_API_ENDPOINT);
                const data = await res.json();
                files = data.files;
                ui.filesCount.innerText = files.length + ' files';
                if (files.length > 0) loadFile(files[0].name, 1);
                renderFiles();
            } catch (e) { console.error('Init failed', e); }
        }

        function renderFiles() {
            ui.fileList.innerHTML = files.map(f => \`
                <div class="file-item \${f.name === currentFile ? 'active' : ''}" onclick="loadFile(\${JSON.stringify(f.name)}, 1)">
                    <span class="file-name flex-1">\${esc(f.name)}</span>
                    <span class="file-size">\${esc(f.sizeStr)}</span>
                    <button class="ml-2 p-1 text-[#8b949e] hover:text-red-500 opacity-0 file-item:hover:opacity-100 transition-opacity"
                        onclick="event.stopPropagation(); deleteLogFile(\${JSON.stringify(f.name)})">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            \`).join('');
            
            // Re-render to fix the "file-item:hover:opacity-100" which Tailwind doesn't handle natively for nested group-hover easily in inline styles
            document.querySelectorAll('.file-item').forEach(item => {
                item.onmouseenter = () => item.querySelector('button').style.opacity = '1';
                item.onmouseleave = () => item.querySelector('button').style.opacity = '0';
            });
        }

        async function loadFile(fileName, page = 1) {
            if (!fileName) return;
            currentFile = fileName;
            currentPage = page;
            renderFiles();
            ui.loadingIndicator.classList.remove('hidden');
            
            try {
                let url = \`\${LOG_API_ENDPOINT}?file=\${fileName}&page=\${page}\`;
                if (currentFilter !== 'all') url += \`&level=\${currentFilter}\`;
                if (searchQuery) url += \`&search=\${encodeURIComponent(searchQuery)}\`;
                
                const res = await fetch(url);
                const data = await res.json();
                totalPages = data.totalPages;
                ui.entriesCount.innerText = \`\${data.totalEntries} entries\`;
                ui.pageIndicator.innerText = \`Page \${currentPage} of \${totalPages || 1}\`;
                ui.btnPrev.disabled = currentPage <= 1;
                ui.btnNext.disabled = currentPage >= totalPages;
                renderLogs(data.entries);
            } catch (e) {
                ui.logList.innerHTML = '<div class="text-red-500 p-10 flex justify-center">Error loading logs</div>';
            } finally {
                ui.loadingIndicator.classList.add('hidden');
            }
        }

        async function deleteLogFile(fileName) {
            if (!confirm(\`Are you sure you want to delete \${fileName}?\`)) return;
            try {
                const res = await fetch(\`\${LOG_API_ENDPOINT}?file=\${fileName}\`, { method: 'DELETE' });
                if (res.ok) {
                    files = files.filter(f => f.name !== fileName);
                    ui.filesCount.innerText = files.length + ' files';
                    if (currentFile === fileName) loadFile(files[0]?.name, 1);
                    else renderFiles();
                }
            } catch (e) { alert('Delete failed'); }
        }

        async function clearCurrentLog() {
            if (!currentFile || !confirm(\`Clear all entries in \${currentFile}?\`)) return;
            try {
                const res = await fetch(\`\${LOG_API_ENDPOINT}/clear?file=\${currentFile}\`, { method: 'POST' });
                if (res.ok) loadFile(currentFile, 1);
            } catch (e) { alert('Clear failed'); }
        }

        function renderLogs(entries) {
            if (!entries || entries.length === 0) {
                ui.logList.innerHTML = '<div class="flex h-full items-center justify-center text-[#8b949e]">No entries found.</div>';
                return;
            }
            ui.logList.innerHTML = entries.map(entry => {
                const lower = (entry.level || 'info').toLowerCase();
                const badge = lower.includes('err') || lower.includes('fail') ? 'error' : (lower.includes('warn') ? 'warning' : 'info');
                
                return \`
                <div class="log-entry" onclick="this.classList.toggle('expanded')">
                    <div class="log-entry-row">
                        <div class="col-sev py-1"><span class="badge \${esc(badge)}">\${esc(entry.level)}</span></div>
                        <div class="col-date">\${esc(entry.datetime)}</div>
                        <div class="col-env text-xs opacity-50">\${esc(entry.env)}</div>
                        <div class="col-msg">\${esc(entry.message)}</div>
                    </div>
                    <div class="log-detail">
                        <div class="log-detail-message">\${esc(entry.message)}\\n\${esc(entry.stack || '')}</div>
                    </div>
                </div>\`;
            }).join('');
        }

        ui.btnPrev.onclick = () => loadFile(currentFile, currentPage - 1);
        ui.btnNext.onclick = () => loadFile(currentFile, currentPage + 1);
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
                        sizeStr: (stats.size / 1024).toFixed(1) + ' KB'
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);
        }

        const requestedFile = req.input('file');
        if (!requestedFile || !files.find(f => f.name === requestedFile)) {
            return res.json({ files, entries: [], totalEntries: 0, totalPages: 0 });
        }

        const filePath = path.join(logDir, requestedFile);
        const page = parseInt(req.input('page')) || 1;
        const perPage = 25;
        const levelFilter = req.input('level') || null;
        const search = req.input('search') || null;

        const parseResult = this.parseLogFileChunked(filePath, page, perPage, levelFilter, search);

        return res.json({
            files,
            entries: parseResult.entries,
            totalEntries: parseResult.totalEntries,
            totalPages: Math.ceil(parseResult.totalEntries / perPage)
        });
    }

    async deleteFile(req, res) {
        const fileName = req.input('file');
        // Reject anything that is not a bare filename (no path separators, must end in .log)
        if (!fileName || path.basename(fileName) !== fileName || !fileName.endsWith('.log')) {
            return res.status(400).send('Invalid file');
        }
        const logDir = base_path('storage/logs');
        const filePath = path.resolve(logDir, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.status(200).send('Deleted');
        }
        return res.status(404).send('Not found');
    }

    async clearFile(req, res) {
        const fileName = req.input('file');
        if (!fileName || path.basename(fileName) !== fileName || !fileName.endsWith('.log')) {
            return res.status(400).send('Invalid file');
        }
        const logDir = base_path('storage/logs');
        const filePath = path.resolve(logDir, fileName);
        if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '');
            return res.status(200).send('Cleared');
        }
        return res.status(404).send('Not found');
    }

    parseLogFileChunked(filePath, page, perPage, levelFilter = null, search = null) {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) return { entries: [], totalEntries: 0 };

        const fd = fs.openSync(filePath, 'r');
        const chunkSize = 128 * 1024;
        const buffer = Buffer.alloc(chunkSize);

        let position = stats.size;
        let leftover = '';
        let entries = [];
        let totalMatched = 0;
        const skip = (page - 1) * perPage;

        try {
            while (position > 0) {
                const readSize = Math.min(position, chunkSize);
                position -= readSize;
                fs.readSync(fd, buffer, 0, readSize, position);
                
                const chunkString = buffer.toString('utf8', 0, readSize) + leftover;
                const parts = chunkString.split('\n[');
                leftover = parts.shift();
                if (position === 0) parts.unshift(leftover);

                for (let i = parts.length - 1; i >= 0; i--) {
                    let block = parts[i];
                    if (!block.startsWith('[')) block = '[' + block;
                    
                    const match = block.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+):([\s\S]*)/);
                    if (match) {
                        const level = match[3].toLowerCase();
                        const message = match[4].trim();
                        
                        // Apply filters
                        if (levelFilter && levelFilter !== 'all' && !level.includes(levelFilter)) continue;
                        if (search && !message.toLowerCase().includes(search.toLowerCase())) continue;

                        totalMatched++;
                        if (totalMatched > skip && entries.length < perPage) {
                            const lines = message.split('\\n');
                            entries.push({
                                datetime: match[1],
                                env: match[2],
                                level: match[3],
                                message: lines[0],
                                stack: lines.slice(1).join('\\n')
                            });
                        }
                    }
                }
                if (entries.length >= perPage && !search && !levelFilter) break;
            }
        } finally { fs.closeSync(fd); }

        return { entries, totalEntries: totalMatched };
    }
}

module.exports = LogViewerController;
