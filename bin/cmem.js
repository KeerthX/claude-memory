#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { readConfig, configExists } = require('../src/config')
const { pointerValid, readPointer, pointerExists } = require('../src/pointer')
const { readMemory, getContext, clearContext, clearLog } = require('../src/memory')
const { runSetup } = require('../src/setup')

const [, , command, flag] = process.argv

function requireMemory() {
    const cwd = process.cwd()
    if (!pointerExists(cwd)) {
        console.error('No memory for this project. Run claude here first.')
        process.exit(1)
    }
    const f = readPointer(cwd)
    if (!f || !fs.existsSync(f)) {
        console.error('Memory file missing. Run claude to recreate.')
        process.exit(1)
    }
    return f
}

async function main() {
    if (!command || command === '--help' || command === '-h') {
        console.log(`
  cmem — claude-memory

  cmem list              all projects with memory
  cmem show              full memory for current project
  cmem show --context    context section only
  cmem show --log        session log only
  cmem clear             clear context (keep log)
  cmem clear --log       clear log (keep context)
  cmem clear --all       clear everything
  cmem delete            delete memory for current project
  cmem delete --all      delete ALL memories
  cmem config            re-run setup
  cmem config --show     show current config
  cmem open              open memory file in editor
    `)
        return
    }

    if (command === 'list') {
        const config = readConfig()
        if (!config) { console.log('Not set up. Run claude first.'); return }
        const store = config.memoryStorePath
        if (!fs.existsSync(store)) { console.log('No memories yet.'); return }
        const projects = fs.readdirSync(store).filter(p =>
            fs.existsSync(path.join(store, p, 'memory.md'))
        )
        if (projects.length === 0) { console.log('No memories yet.'); return }
        console.log(`\nMemories at: ${store}\n`)
        for (const p of projects) {
            const f = path.join(store, p, 'memory.md')
            const stat = fs.statSync(f)
            console.log(`  ${p.split('_').slice(1).join('_')}`)
            console.log(`    updated: ${stat.mtime.toISOString().split('T')[0]}  size: ${(stat.size / 1024).toFixed(1)}KB`)
        }
        console.log('')
        return
    }

    if (command === 'show') {
        const f = requireMemory()
        if (flag === '--context') {
            console.log(getContext(f) || 'No context yet.')
        } else if (flag === '--log') {
            const c = readMemory(f)
            const i = c.indexOf('## Session log')
            console.log(i !== -1 ? c.slice(i) : 'No log yet.')
        } else {
            console.log(readMemory(f))
        }
        return
    }

    if (command === 'clear') {
        const f = requireMemory()
        if (flag === '--log') { clearLog(f); console.log('Log cleared.') }
        else if (flag === '--all') { clearContext(f); clearLog(f); console.log('Memory cleared.') }
        else { clearContext(f); console.log('Context cleared.') }
        return
    }

    if (command === 'delete') {
        if (flag === '--all') {
            const readline = require('readline')
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
            const answer = await new Promise(r => rl.question('Delete ALL memories? (y/n) ', r))
            rl.close()
            if (answer.trim().toLowerCase() !== 'y') { console.log('Cancelled.'); return }
            const config = readConfig()
            fs.rmSync(config.memoryStorePath, { recursive: true, force: true })
            console.log('All memories deleted.')
            return
        }
        const f = requireMemory()
        const dir = path.dirname(f)
        const pointer = path.join(process.cwd(), '.claude-memory')
        fs.rmSync(dir, { recursive: true, force: true })
        if (fs.existsSync(pointer)) fs.unlinkSync(pointer)
        console.log('Memory deleted for this project.')
        return
    }

    if (command === 'config') {
        if (flag === '--show') {
            console.log(readConfig() ? JSON.stringify(readConfig(), null, 2) : 'Not configured.')
            return
        }
        await runSetup()
        return
    }

    if (command === 'open') {
        const f = requireMemory()
        const { execSync } = require('child_process')
        try { execSync(`start "" "${f}"`) } catch { }
        console.log('Memory file:', f)
        return
    }

    console.error(`Unknown command: ${command}. Run cmem --help`)
}

main().catch(err => {
    console.error('cmem error:', err.message)
    process.exit(1)
})