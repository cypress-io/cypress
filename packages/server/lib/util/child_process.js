const cp = require('child_process')
const Promise = require('bluebird')

module.exports = Promise.promisifyAll(cp)
