const fs = require('fs')
const path = require('path')

const CLAUDE_MD = 'CLAUDE.md'
const MEMORY_START = '<!-- claude-memory-start -->'
const MEMORY_END = '<!-- claude-memory-end -->'

function injectMemory(cwd, projectName, contextText) {
    const claudeMdPath = path.join(cwd, CLAUDE_MD)
    const memoryBlock = [
        MEMORY_START,
        `# Project memory: ${projectName}`,
        '',
        contextText,
        '',
        MEMORY_END
    ].join('\n')

    if (fs.existsSync(claudeMdPath)) {
        let existing = fs.readFileSync(claudeMdPath, 'utf8')
        // Remove old memory block if present
        const s = existing.indexOf(MEMORY_START)
        const e = existing.indexOf(MEMORY_END)
        if (s !== -1 && e !== -1) {
            existing = existing.slice(0, s) + existing.slice(e + MEMORY_END.length)
        }
        fs.writeFileSync(claudeMdPath, memoryBlock + '\n\n' + existing.trim())
    } else {
        fs.writeFileSync(claudeMdPath, memoryBlock + '\n')
    }
}

function removeMemory(cwd) {
    const claudeMdPath = path.join(cwd, CLAUDE_MD)
    if (!fs.existsSync(claudeMdPath)) return

    let content = fs.readFileSync(claudeMdPath, 'utf8')
    const s = content.indexOf(MEMORY_START)
    const e = content.indexOf(MEMORY_END)

    if (s === -1 || e === -1) return

    const after = content.slice(e + MEMORY_END.length).trim()
    if (after.length === 0) {
        // We added the whole file, remove it
        fs.unlinkSync(claudeMdPath)
    } else {
        fs.writeFileSync(claudeMdPath, after)
    }
}

function ensureGitignore(cwd) {
    const gitignorePath = path.join(cwd, '.gitignore')
    const entries = ['.claude-memory', 'CLAUDE.md']

    if (fs.existsSync(gitignorePath)) {
        let content = fs.readFileSync(gitignorePath, 'utf8')
        let changed = false
        for (const entry of entries) {
            if (!content.includes(entry)) {
                content += (content.endsWith('\n') ? '' : '\n') + entry + '\n'
                changed = true
            }
        }
        if (changed) fs.writeFileSync(gitignorePath, content)
    } else {
        if (fs.existsSync(path.join(cwd, '.git'))) {
            fs.writeFileSync(gitignorePath, entries.join('\n') + '\n')
        }
    }
}

module.exports = { injectMemory, removeMemory, ensureGitignore }