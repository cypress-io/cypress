import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'
import $LocalStorage from '../../cypress/local_storage'
import { clearStorage, getStorage, StorageType } from './sessions/storage'

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

const getAllStorage = async (type: StorageType, Cypress: InternalCypress.Cypress, userOptions: Options = {}) => {
  const options: Options = {
    log: true,
    ...userOptions,
  }

  let storageByOrigin: Cypress.StorageByOrigin = {}

  Cypress.log({
    hidden: options.log === false,
    consoleProps () {
      const obj = {}

      if (Object.keys(storageByOrigin).length) {
        obj['Yielded'] = storageByOrigin
      }

      return obj
    },
  })

  const storages = await getStorage(Cypress, { origin: '*' })

  storageByOrigin = storages[type].reduce((memo, storage) => {
    memo[storage.origin] = storage.value

    return memo
  }, {} as Cypress.StorageByOrigin)

  return storageByOrigin
}

const clearAllStorage = async (type: StorageType, Cypress: InternalCypress.Cypress, userOptions: Options = {}) => {
  const options: Options = {
    log: true,
    ...userOptions,
  }

  Cypress.log({ hidden: options.log === false })

  await clearStorage(Cypress, type)

  return null
}

export default (Commands, Cypress: InternalCypress.Cypress, cy, state, config) => {
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

      Cypress.log({
        hidden: options.log === false,
        snapshot: true,
        end: true,
      })

      // return the remote local storage object
      return remote
    },
  })
}
