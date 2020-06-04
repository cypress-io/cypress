// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const Promise = require('bluebird')
const json = require('@packages/root')

module.exports = (options) => {
  return Promise.resolve(
  // TODO: omit anything from options which is a function
    _.extend({}, options, _.pick(json, 'version')),
  )
}
