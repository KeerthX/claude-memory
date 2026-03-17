const fs = require('fs')
const path = require('path')
const os = require('os')

const CONFIG_DIR = path.join(os.homedir(), '.claude-memory')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const DEFAULTS = {
    memoryStorePath: path.join(os.homedir(), '.claude-memory', 'projects'),
    saveMode: 'auto'
}

function configExists() {
    return fs.existsSync(CONFIG_FILE)
}

function readConfig() {
    if (!configExists()) return null
    try {
        return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) }
    } catch { return DEFAULTS }
}

function writeConfig(data) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
    const merged = { ...DEFAULTS, ...data }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2))
    return merged
}

module.exports = { configExists, readConfig, writeConfig, CONFIG_DIR, DEFAULTS }