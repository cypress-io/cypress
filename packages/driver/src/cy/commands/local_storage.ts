import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'
import $LocalStorage from '../../cypress/local_storage'

const clearLocalStorage = (state, keys) => {
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

export default (Commands, Cypress, cy, state) => {
  // TODO: Cypress sessions will clear local storage on its own before each test.
  // Once experimentalSessionAndOrigin is made GA, remove this logic. Leave clearing
  // session data (cookies / local storage / session storage) to reset functionality
  if (!Cypress.config('experimentalSessionAndOrigin')) {
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
  }

  Commands.addAll({
    clearLocalStorage (keys, options: Partial<Cypress.Loggable> = {}) {
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
          snapshot: true,
          end: true,
        })
      }

      // return the remote local storage object
      return remote
    },
  })
}
