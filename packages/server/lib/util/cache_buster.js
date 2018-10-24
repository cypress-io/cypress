/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')

const DIGITS = 3
const SEPERATOR = '-'

module.exports = {
  get () {
    return SEPERATOR + Math.random().toFixed(DIGITS).slice(2, 5)
  },

  strip (str) {
    if (this._hasCacheBuster(str)) {
      return str.slice(0, -4)
    }

    return str

  },

  _hasCacheBuster (str) {
    return str.split('').slice(-4, -3).join('') === SEPERATOR
  },
}
