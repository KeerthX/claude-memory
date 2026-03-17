const fs = require('fs')
const path = require('path')
const os = require('os')

function cwdToFolder(cwd) {
    return cwd.replace(/:/g, '-').replace(/[/\\]/g, '-').replace(/^-+/, '')
}

function getSessionFiles(cwd) {
    const folder = cwdToFolder(cwd)
    const dir = path.join(os.homedir(), '.claude', 'projects', folder)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(dir, f))
        .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime)
}

function parseSession(jsonlPath) {
    const lines = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean)
    const entries = []

    for (const line of lines) {
        try {
            const obj = JSON.parse(line)

            // User message
            if (obj.type === 'user' &&
                obj.message?.role === 'user' &&
                typeof obj.message?.content === 'string') {
                entries.push({ role: 'User', text: obj.message.content })
            }

            // Assistant text
            if (obj.type === 'assistant' && Array.isArray(obj.message?.content)) {
                for (const block of obj.message.content) {
                    if (block.type === 'text' && block.text?.trim()) {
                        entries.push({ role: 'Claude', text: block.text.trim() })
                    }
                    if (block.type === 'tool_use') {
                        let summary = `[${block.name}]`
                        if (block.input?.file_path) summary += ` ${path.basename(block.input.file_path)}`
                        if (block.input?.command) summary += ` ${block.input.command.slice(0, 60)}`
                        entries.push({ role: 'Tool', text: summary })
                    }
                }
            }
        } catch { }
    }

    return entries
}

function getLatestSession(cwd) {
    const files = getSessionFiles(cwd)
    if (files.length === 0) return []

    // Get files modified in the last 10 minutes
    const cutoff = Date.now() - 10 * 60 * 1000
    const recent = files.filter(f => fs.statSync(f).mtime.getTime() > cutoff)
    const toRead = recent.length > 0 ? recent : [files[0]]

    const all = []
    for (const f of toRead) {
        all.push(...parseSession(f))
    }
    return all
}

module.exports = { getLatestSession, getSessionFiles }