const fs = require('fs')
const path = require('path')

function createMemoryFile(memoryFile, projectName, projectPath) {
    fs.mkdirSync(path.dirname(memoryFile), { recursive: true })
    const today = new Date().toISOString().split('T')[0]
    fs.writeFileSync(memoryFile, [
        `# claude-memory: ${projectName}`,
        `Path: ${projectPath}`,
        `Created: ${today}`,
        `Last session: ${today}`,
        '',
        '---',
        '## Context',
        '_No context yet._',
        '',
        '---',
        '## Session log',
        ''
    ].join('\n'))
}

function readMemory(memoryFile) {
    if (!fs.existsSync(memoryFile)) return null
    return fs.readFileSync(memoryFile, 'utf8')
}

function getContext(memoryFile) {
    const content = readMemory(memoryFile)
    if (!content) return null
    const start = content.indexOf('## Context')
    const end = content.indexOf('## Session log')
    if (start === -1) return null
    const ctx = content.slice(start + '## Context'.length, end !== -1 ? end : undefined).trim()
    if (!ctx || ctx.startsWith('_No context')) return null
    return ctx
}

function updateContext(memoryFile, newContext) {
    const content = readMemory(memoryFile)
    if (!content) return
    const start = content.indexOf('## Context')
    const end = content.indexOf('## Session log')
    if (start === -1) return
    const before = content.slice(0, start + '## Context'.length)
    const after = end !== -1 ? '\n\n---\n' + content.slice(end) : ''
    const today = new Date().toISOString().split('T')[0]
    const updated = before + '\n' + newContext + after
    const withDate = updated.replace(/Last session: .+/, `Last session: ${today}`)
    fs.writeFileSync(memoryFile, withDate)
}

function appendLog(memoryFile, entry) {
    const content = readMemory(memoryFile)
    if (!content) return
    const idx = content.indexOf('## Session log')
    if (idx === -1) return
    const insertAt = idx + '## Session log'.length
    fs.writeFileSync(memoryFile,
        content.slice(0, insertAt) + '\n\n' + entry + content.slice(insertAt)
    )
}

function clearContext(memoryFile) {
    updateContext(memoryFile, '_Context cleared._')
}

function clearLog(memoryFile) {
    const content = readMemory(memoryFile)
    if (!content) return
    const idx = content.indexOf('## Session log')
    if (idx === -1) return
    fs.writeFileSync(memoryFile, content.slice(0, idx + '## Session log'.length) + '\n')
}

module.exports = {
    createMemoryFile, readMemory, getContext,
    updateContext, appendLog, clearContext, clearLog
}