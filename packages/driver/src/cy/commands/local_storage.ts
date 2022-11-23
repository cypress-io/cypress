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

export default (Commands, Cypress: InternalCypress.Cypress, cy, state, config) => {
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

  type Options = Partial<Cypress.Loggable & Cypress.Timeoutable>

  Commands.addAll({
    async getAllLocalStorage (userOptions: Options = {}) {
      const options: Options = _.defaults({}, userOptions, {
        log: true,
        timeout: config('responseTimeout'),
      })

      let localStorageByOrigin: Cypress.StorageByOrigin = {}

      if (options.log) {
        Cypress.log({
          message: '',
          timeout: options.timeout,
          consoleProps () {
            const obj = {}

            if (Object.keys(localStorageByOrigin).length) {
              obj['Yielded'] = localStorageByOrigin
            }

            return obj
          },
        })
      }

      const storages = await (Cypress.session as InternalCypress.Session).getStorage({ origin: '*' })

      localStorageByOrigin = storages.localStorage.reduce((memo, storage) => {
        memo[storage.origin] = storage.value

        return memo
      }, {} as Cypress.StorageByOrigin)

      return localStorageByOrigin
    },

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
