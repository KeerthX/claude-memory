const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function findClaudeCli() {
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()

        // Check top level first
        const topLevel = path.join(root, '@anthropic-ai', 'claude-code', 'cli.js')
        if (fs.existsSync(topLevel)) return { root, cli: topLevel }

        // Check nested inside memclaude
        const nested = path.join(root, 'memclaude', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js')
        if (fs.existsSync(nested)) return { root, cli: nested }

        // Search all packages for cli.js
        const packages = fs.readdirSync(root)
        for (const pkg of packages) {
            const p = path.join(root, pkg, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js')
            if (fs.existsSync(p)) return { root, cli: p }
        }
    } catch { }
    return null
}

function main() {
    console.log('\nclaude-memory: restoring claude...\n')

    const claude = findClaudeCli()
    if (!claude) {
        console.log('Claude Code not found — nothing to restore.')
        return
    }

    const claudeCmd = path.join(
        path.dirname(path.dirname(path.dirname(claude.cli))),
        'claude.cmd'
    )
    const backup = claudeCmd + '.original'

    if (!fs.existsSync(backup)) {
        console.log('No backup found — claude.cmd may already be original.')
        return
    }

    try {
        fs.copyFileSync(backup, claudeCmd)
        fs.unlinkSync(backup)
        console.log('Original claude restored.')
        console.log('Now run:  npm uninstall -g claude-memory\n')
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