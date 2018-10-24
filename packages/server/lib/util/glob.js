const glob = require('glob')
const Promise = require('bluebird')

module.exports = Promise.promisify(glob)
