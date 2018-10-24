// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const glob = require('glob')
const Promise = require('bluebird')

module.exports = Promise.promisify(glob)
