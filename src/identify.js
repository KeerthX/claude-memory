const crypto = require('crypto')
const path = require('path')

function getProjectId(cwd) {
    const hash = crypto.createHash('md5').update(cwd).digest('hex').slice(0, 8)
    const name = path.basename(cwd)
    return `${hash}_${name}`
}

module.exports = { getProjectId }