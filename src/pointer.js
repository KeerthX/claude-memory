const fs = require('fs')
const path = require('path')

const POINTER = '.claude-memory'

function pointerExists(cwd) {
    return fs.existsSync(path.join(cwd, POINTER))
}

function readPointer(cwd) {
    try {
        return fs.readFileSync(path.join(cwd, POINTER), 'utf8').trim()
    } catch { return null }
}

function writePointer(cwd, memoryFile) {
    fs.writeFileSync(path.join(cwd, POINTER), memoryFile)
}

function pointerValid(cwd) {
    const target = readPointer(cwd)
    return target && fs.existsSync(target)
}

module.exports = { pointerExists, readPointer, writePointer, pointerValid, POINTER }