const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

function findRealClaudeCli() {
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()
        const p = path.join(root, '@anthropic-ai', 'claude-code', 'cli.js')
        if (fs.existsSync(p)) return p
    } catch { }
    return null
}

function findClaudeCmd() {
    try {
        const result = execSync('where claude', { encoding: 'utf8' }).trim()
        const lines = result.split('\n').map(l => l.trim()).filter(Boolean)
        return lines.find(l => l.endsWith('.cmd') && !l.includes('claude-memory')) || null
    } catch { }
    return null
}

function getWrapperPath() {
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()
        return path.join(root, 'claude-memory', 'bin', 'claude.js')
    } catch { }
    return null
}

function addToSystemPath(dir) {
    try {
        const current = execSync(
            'powershell -Command "[System.Environment]::GetEnvironmentVariable(\'PATH\',\'Machine\')"',
            { encoding: 'utf8' }
        ).trim()
        if (current.toLowerCase().includes(dir.toLowerCase())) return true
        execSync(
            `powershell -Command "[System.Environment]::SetEnvironmentVariable('PATH','${dir};${current}','Machine')"`,
            { encoding: 'utf8' }
        )
        return true
    } catch { return false }
}

function main() {
    console.log('\nclaude-memory: installing...\n')

    const cliPath = findRealClaudeCli()
    if (!cliPath) {
        console.log('Note: Claude Code not found.')
        console.log('Install it first:  npm install -g @anthropic-ai/claude-code')
        console.log('Then reinstall:    npm install -g claude-memory\n')
        return
    }

    const wrapper = getWrapperPath()
    if (!wrapper) {
        console.log('Could not find wrapper path. Try reinstalling.\n')
        return
    }

    // Strategy 1: overwrite claude.cmd in the same folder as cli.js
    const claudeCmd = path.join(path.dirname(path.dirname(path.dirname(cliPath))), 'claude.cmd')
    const shimContent = `@echo off\r\nREM claude-memory-shim\r\nnode "${wrapper}" %*\r\n`

    try {
        // Backup original claude.cmd if not already backed up
        const backup = claudeCmd.replace('claude.cmd', 'claude.original.cmd')
        if (fs.existsSync(claudeCmd) && !fs.existsSync(backup)) {
            fs.copyFileSync(claudeCmd, backup)
        }
        fs.writeFileSync(claudeCmd, shimContent)
        console.log('claude-memory: installed successfully.')
        console.log('Open a new terminal, then type  claude  in any project folder.\n')
        return
    } catch {
        // No permission — fall back to shim in PATH
    }

    // Strategy 2: shim folder in PATH
    const shimDir = path.join(os.homedir(), '.claude-memory', 'shim')
    fs.mkdirSync(shimDir, { recursive: true })
    fs.writeFileSync(path.join(shimDir, 'claude.cmd'), shimContent)

    const added = addToSystemPath(shimDir)
    if (added) {
        console.log('claude-memory: installed successfully.')
        console.log('Open a new terminal, then type  claude  in any project folder.\n')
    } else {
        console.log('claude-memory: installed but needs one manual step.')
        console.log(`Add this to the front of your PATH: ${shimDir}`)
        console.log('Then restart your terminal.\n')
    }
}

main()