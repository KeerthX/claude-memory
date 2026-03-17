const readline = require('readline')
const { writeConfig, DEFAULTS } = require('./config')

async function runSetup() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const ask = (q) => new Promise(resolve => rl.question(q, a => resolve(a.trim())))

    console.log('\n╔══════════════════════════════════════╗')
    console.log('║      claude-memory  setup            ║')
    console.log('╚══════════════════════════════════════╝\n')
    console.log('This runs once. Change anytime with: cmem config\n')

    const pathAnswer = await ask(
        `Where should memories be stored?\n  (Enter for default: ${DEFAULTS.memoryStorePath})\n> `
    )
    const memoryStorePath = pathAnswer.length > 0
        ? pathAnswer.replace(/^["']|["']$/g, '').trim()
        : DEFAULTS.memoryStorePath

    let saveMode = ''
    while (saveMode !== 'auto' && saveMode !== 'custom') {
        const m = await ask('\nSave mode:\n  auto   = memory on for every project\n  custom = ask me per project\n> ')
        saveMode = m.toLowerCase() || 'auto'
        if (saveMode !== 'auto' && saveMode !== 'custom') console.log('Type auto or custom')
    }

    rl.close()

    const config = writeConfig({ memoryStorePath, saveMode })
    console.log('\nSetup complete.')
    console.log('Memory stored at: ' + config.memoryStorePath)
    console.log('Run  cmem --help  to manage memories.\n')
    return config
}

module.exports = { runSetup }