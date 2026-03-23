const glob = require('glob')
const { promisify } = require('util')

module.exports = promisify(glob)
