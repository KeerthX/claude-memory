const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

function findClaudeCmd() {
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()
        const cliPath = path.join(root, '@anthropic-ai', 'claude-code', 'cli.js')
        return path.join(path.dirname(path.dirname(path.dirname(cliPath))), 'claude.cmd')
    } catch { return null }
}

function removeFromPath(dir) {
    try {
        const current = execSync(
            'powershell -Command "[System.Environment]::GetEnvironmentVariable(\'PATH\',\'Machine\')"',
            { encoding: 'utf8' }
        ).trim()
        const newPath = current.split(';')
            .filter(p => p.trim().toLowerCase() !== dir.toLowerCase())
            .join(';')
        execSync(
            `powershell -Command "[System.Environment]::SetEnvironmentVariable('PATH','${newPath}','Machine')"`,
            { encoding: 'utf8' }
        )
    } catch { }
}

function main() {
    console.log('\nclaude-memory: uninstalling...')

    // Restore original claude.cmd from backup
    const claudeCmd = findClaudeCmd()
    if (claudeCmd) {
        const backup = claudeCmd.replace('claude.cmd', 'claude.original.cmd')
        if (fs.existsSync(backup)) {
            try {
                fs.copyFileSync(backup, claudeCmd)
                fs.unlinkSync(backup)
                console.log('claude-memory: original claude restored.')
            } catch { }
        }
    }

    // Remove shim dir and PATH entry
    const shimDir = path.join(os.homedir(), '.claude-memory', 'shim')
    if (fs.existsSync(shimDir)) fs.rmSync(shimDir, { recursive: true, force: true })
    removeFromPath(shimDir)

    console.log('claude-memory: removed cleanly.')
    console.log('Your memories are at ~/.claude-memory/projects')
    console.log('Delete them with:  cmem delete --all\n')
}

main()