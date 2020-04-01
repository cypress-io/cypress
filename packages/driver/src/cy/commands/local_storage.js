// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')

const $errUtils = require('../../cypress/error_utils')
const $LocalStorage = require('../../cypress/local_storage')

const clearLocalStorage = function (state, keys) {
  const local = window.localStorage
  const remote = state('window').localStorage

  // set our localStorage and the remote localStorage
  $LocalStorage.setStorages(local, remote)

  // clear the keys
  $LocalStorage.clear(keys)

  // and then unset the references
  $LocalStorage.unsetStorages()

  // return the remote localStorage object
  return remote
}

module.exports = function (Commands, Cypress, cy, state, config) {
  // this MUST be prepended before anything else
  Cypress.prependListener('test:before:run', () => {
    try {
      // this may fail if the current
      // window is bound to another origin
      return clearLocalStorage(state, [])
    } catch (error) {
      return null
    }
  })

  return Commands.addAll({
    clearLocalStorage (keys, options = {}) {
      if (_.isPlainObject(keys)) {
        options = keys
        keys = null
      }

      _.defaults(options, { log: true })

      // bail if we have keys and we're not a string and we're not a regexp
      if (keys && !_.isString(keys) && !_.isRegExp(keys)) {
        $errUtils.throwErrByPath('clearLocalStorage.invalid_argument')
      }

      const remote = clearLocalStorage(state, keys)

      if (options.log) {
        Cypress.log({
          name: 'clear ls',
          snapshot: true,
          end: true,
        })
      }

      // return the remote local storage object
      return remote
    },
  })
}
