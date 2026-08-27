import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
import $LocalStorage from '../../cypress/local_storage'
import { clearStorage, getStorage, StorageType } from './sessions/storage'

type Options = Partial<Cypress.Loggable & Cypress.Timeoutable>

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
  // getAllLocalStorage and getAllSessionStorage are query commands: they re-read
  // storage from all origins and retry attached assertions until they pass or time out.
  function createGetAllStorageQuery (type: StorageType, commandName: string, userOptions: Options = {}) {
    const options: Options = {
      log: true,
      ...userOptions,
    }

    const timeout = options.timeout || config('defaultCommandTimeout')

    this.set('timeout', timeout)

    let storageByOrigin: Cypress.StorageByOrigin = {}
    let hasResult = false
    let pending: Promise<void> | null = null
    let mostRecentError = $errUtils.cypressErrByPath('getAllStorage.timed_out', {
      args: { cmd: commandName, timeout },
    })

    Cypress.log({
      hidden: options.log === false,
      timeout,
      consoleProps () {
        const obj = {}

        if (Object.keys(storageByOrigin).length) {
          obj['Yielded'] = storageByOrigin
        }

        return obj
      },
    })

    const fetch = () => {
      // getStorage attaches a `message` listener to the shared spec window, so the
      // pending guard serializes the reads one command issues while retrying. It's
      // per-command: a trailing read can briefly overlap the next command's, but
      // that's benign since each command yields only its own storage type.
      if (pending) {
        return
      }

      // getStorage bounds itself, so wrapping it in our own `.timeout()` would only
      // clear `pending` while the underlying read kept running, defeating the guard
      // above. The command's overall timeout is handled by the query retry mechanism.
      pending = Promise.try(() => {
        return getStorage(Cypress, { origin: '*' })
      })
      .then((storages) => {
        storageByOrigin = storages[type].reduce((memo, storage) => {
          memo[storage.origin] = storage.value

          return memo
        }, {} as Cypress.StorageByOrigin)

        hasResult = true
      })
      .catch((err) => {
        mostRecentError = err
      })
      .finally(() => {
        pending = null
      })
    }

    return () => {
      if (hasResult) {
        // re-read in the background (keeping the current result) so retries -
        // including assertions chained through another query - see fresh storage.
        fetch()

        return storageByOrigin
      }

      fetch()

      // no result yet - throw to retry once the pending read resolves.
      throw mostRecentError
    }
  }

  Commands.addQuery('getAllLocalStorage', function getAllLocalStorage (userOptions: Options = {}) {
    return createGetAllStorageQuery.call(this, 'localStorage', 'getAllLocalStorage', userOptions)
  })

  Commands.addQuery('getAllSessionStorage', function getAllSessionStorage (userOptions: Options = {}) {
    return createGetAllStorageQuery.call(this, 'sessionStorage', 'getAllSessionStorage', userOptions)
  })

  Commands.addAll({
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
