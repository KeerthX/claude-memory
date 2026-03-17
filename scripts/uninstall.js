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