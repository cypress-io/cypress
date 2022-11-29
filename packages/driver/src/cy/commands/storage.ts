import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'
import $LocalStorage from '../../cypress/local_storage'

type Options = Partial<Cypress.Loggable>

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

const getAllStorage = async (type: InternalCypress.StorageType, Cypress: InternalCypress.Cypress, userOptions: Options = {}) => {
  const options: Options = {
    log: true,
    ...userOptions,
  }

  let storageByOrigin: Cypress.StorageByOrigin = {}

  if (options.log) {
    Cypress.log({
      consoleProps () {
        const obj = {}

        if (Object.keys(storageByOrigin).length) {
          obj['Yielded'] = storageByOrigin
        }

        return obj
      },
    })
  }

  const storages = await Cypress._session.getStorage({ origin: '*' })

  storageByOrigin = storages[type].reduce((memo, storage) => {
    memo[storage.origin] = storage.value

    return memo
  }, {} as Cypress.StorageByOrigin)

  return storageByOrigin
}

const clearAllStorage = async (type: InternalCypress.StorageType, Cypress: InternalCypress.Cypress, userOptions: Options = {}) => {
  const options: Options = {
    log: true,
    ...userOptions,
  }

  if (options.log) {
    Cypress.log({})
  }

  await Cypress._session.clearStorage(type)

  return null
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

  Commands.addAll({
    getAllLocalStorage: getAllStorage.bind(null, 'localStorage', Cypress),
    getAllSessionStorage: getAllStorage.bind(null, 'sessionStorage', Cypress),

    clearAllLocalStorage: clearAllStorage.bind(null, 'localStorage', Cypress),
    clearAllSessionStorage: clearAllStorage.bind(null, 'sessionStorage', Cypress),

    clearLocalStorage (keys, options: Options = {}) {
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
