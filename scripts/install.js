const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function findClaudeCli() {
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()
        const p = path.join(root, '@anthropic-ai', 'claude-code', 'cli.js')
        if (fs.existsSync(p)) return { root, cli: p }
    } catch { }
    return null
}

function findWrapperPath() {
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()
        const p = path.join(root, 'claude-memory', 'bin', 'claude.js')
        if (fs.existsSync(p)) return p
    } catch { }
    return null
}

function main() {
    console.log('\nclaude-memory: setting up...\n')

    const claude = findClaudeCli()
    if (!claude) {
        console.error('Claude Code not found.')
        console.error('Install it first: npm install -g @anthropic-ai/claude-code')
        process.exit(1)
    }

    const wrapper = findWrapperPath()
    if (!wrapper) {
        console.error('claude-memory wrapper not found.')
        console.error('Make sure you ran: npm install -g claude-memory')
        process.exit(1)
    }

    // claude.cmd sits two levels above node_modules/@anthropic-ai/claude-code
    const claudeCmd = path.join(
        path.dirname(path.dirname(path.dirname(claude.cli))),
        'claude.cmd'
    )

    if (!fs.existsSync(claudeCmd)) {
        console.error('Could not find claude.cmd at: ' + claudeCmd)
        console.error('Try running as Administrator.')
        process.exit(1)
    }

    // Back up original once
    const backup = claudeCmd + '.original'
    if (!fs.existsSync(backup)) {
        fs.copyFileSync(claudeCmd, backup)
        console.log('Backed up original claude.cmd')
    }

    // Write shim
    const shim = `@echo off\r\nREM claude-memory-shim\r\nnode "${wrapper}" %*\r\n`
    try {
        fs.writeFileSync(claudeCmd, shim)
        console.log('claude-memory: installed successfully.')
        console.log('Type  claude  in any project folder to get started.\n')
    } catch (err) {
        if (err.code === 'EACCES' || err.code === 'EPERM') {
            console.error('Permission denied. Run as Administrator.')
        } else {
            console.error('Failed:', err.message)
        }
        process.exit(1)
    }
}

main()