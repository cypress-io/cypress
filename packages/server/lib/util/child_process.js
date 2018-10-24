// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const cp = require('child_process')
const Promise = require('bluebird')

module.exports = Promise.promisifyAll(cp)
