#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const { execSync, spawn } = require('child_process')
const { configExists, readConfig } = require('../src/config')
const { runSetup } = require('../src/setup')
const { pointerExists, readPointer, writePointer, pointerValid } = require('../src/pointer')
const { createMemoryFile, getContext, updateContext, appendLog } = require('../src/memory')
const { injectMemory, removeMemory, ensureGitignore } = require('../src/claudemd')
const { getLatestSession } = require('../src/capture')
const { getProjectId } = require('../src/identify')

function findRealClaude() {
    try {
        const { execSync } = require('child_process')
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim()

        // Top level
        const topLevel = require('path').join(root, '@anthropic-ai', 'claude-code', 'cli.js')
        if (require('fs').existsSync(topLevel)) return topLevel

        // Nested inside memclaude
        const nested = require('path').join(root, 'memclaude', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js')
        if (require('fs').existsSync(nested)) return nested

        // Search all packages
        const packages = require('fs').readdirSync(root)
        for (const pkg of packages) {
            const p = require('path').join(root, pkg, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js')
            if (require('fs').existsSync(p)) return p
        }
    } catch { }
    return null
}
function buildContext(entries) {
    const userMsgs = entries.filter(e => e.role === 'User').map(e => e.text)
    const claudeMsgs = entries.filter(e => e.role === 'Claude').map(e => e.text)
    const tools = entries.filter(e => e.role === 'Tool').map(e => e.text)

    const parts = []

    const lastUser = userMsgs[userMsgs.length - 1]
    if (lastUser) parts.push(`Last task: ${lastUser.slice(0, 150)}`)

    const filesWritten = tools
        .filter(t => t.includes('[Write]') || t.includes('[Edit]'))
        .map(t => t.replace(/\[(Write|Edit)\]\s*/, '').trim())
    if (filesWritten.length > 0) {
        parts.push(`Files changed: ${[...new Set(filesWritten)].slice(-5).join(', ')}`)
    }

    const lastClaude = claudeMsgs.filter(m => m.length > 30).slice(-1)[0]
    if (lastClaude) parts.push(`Last summary: ${lastClaude.slice(0, 200)}`)

    return parts.join('\n')
}

async function main() {
    const args = process.argv.slice(2)
    const cwd = process.cwd()

    if (args.includes('--dry-run')) {
        const config = readConfig()
        const id = getProjectId(cwd)
        console.log('\n[claude-memory dry run]')
        console.log('Project:', id)
        console.log('Config:', config ? 'found' : 'not set up')
        if (config) console.log('Store:', config.memoryStorePath)
        console.log('')
        return
    }

    // First run setup
    if (!configExists()) await runSetup()
    const config = readConfig()

    // Resolve memory file for this project
    let memoryFile = null

    if (pointerValid(cwd)) {
        memoryFile = readPointer(cwd)
    } else {
        // Decide whether to create memory
        let shouldCreate = config.saveMode === 'auto'

        if (config.saveMode === 'custom') {
            const readline = require('readline')
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
            const answer = await new Promise(r => rl.question('Enable memory for this project? (y/n) ', r))
            rl.close()
            shouldCreate = answer.trim().toLowerCase() === 'y'
        }

        if (shouldCreate) {
            const id = getProjectId(cwd)
            memoryFile = path.join(config.memoryStorePath, id, 'memory.md')
            createMemoryFile(memoryFile, path.basename(cwd), cwd)
            writePointer(cwd, memoryFile)
            ensureGitignore(cwd)
        }
    }

    // Inject memory into CLAUDE.md before launching
    if (memoryFile) {
        const ctx = getContext(memoryFile)
        if (ctx) {
            injectMemory(cwd, path.basename(cwd), ctx)
            console.log(`claude-memory: context loaded for "${path.basename(cwd)}"`)
        } else {
            console.log(`claude-memory: memory enabled for "${path.basename(cwd)}" — building context...`)
        }
    }

    // Find and launch real claude
    const realClaude = findRealClaude()
    if (!realClaude) {
        console.error('claude-memory: cannot find claude. Is Claude Code installed?')
        process.exit(1)
    }

    const startTime = Date.now()

    await new Promise((resolve, reject) => {
        const isJs = realClaude.endsWith('.js')
        const child = spawn(
            isJs ? process.execPath : realClaude,
            isJs ? [realClaude, ...args] : args,
            { stdio: 'inherit', shell: false, cwd }
        )
        child.on('close', resolve)
        child.on('error', reject)
    })

    // Clean up CLAUDE.md after session
    if (memoryFile) removeMemory(cwd)

    // Read what happened from Claude's session files
    if (memoryFile) {
        const entries = getLatestSession(cwd)

        if (entries.length > 0) {
            // Append to session log
            const now = new Date(startTime).toISOString().replace('T', ' ').slice(0, 16)
            const duration = Math.round((Date.now() - startTime) / 60000)
            const logLines = [`### ${now}  (~${duration} min)`]

            for (const e of entries) {
                if (e.role === 'User') logLines.push(`\n**You:** ${e.text}`)
                else if (e.role === 'Claude') logLines.push(`**Claude:** ${e.text}`)
                else logLines.push(`  ${e.text}`)
            }

            appendLog(memoryFile, logLines.join('\n') + '\n')

            // Update context section
            const newCtx = buildContext(entries)
            if (newCtx) updateContext(memoryFile, newCtx)

            const userCount = entries.filter(e => e.role === 'User').length
            console.log(`\nclaude-memory: ${userCount} messages saved for "${path.basename(cwd)}"`)
        } else {
            console.log(`\nclaude-memory: session ended (no messages captured)`)
        }
    }
}

main().catch(err => {
    console.error('claude-memory error:', err.message)
    process.exit(1)
})