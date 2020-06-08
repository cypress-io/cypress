const _ = require('lodash')
const Promise = require('bluebird')
const json = require('@packages/root')

module.exports = (options) => {
  return Promise.resolve(
  // TODO: omit anything from options which is a function
    _.extend({}, options, _.pick(json, 'version')),
  )
}
