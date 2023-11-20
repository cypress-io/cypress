import _ from 'lodash'

import { $Location } from '../../../cypress/location'
import { getAllHtmlOrigins, mapOrigins } from './origins'
import { getCurrentOriginStorage, getPostMessageLocalStorage, setPostMessageLocalStorage } from './utils'

export type StorageType = 'localStorage' | 'sessionStorage'

interface GetStorageOptions {
  origin?: '*' | 'currentOrigin' | string | string[]
}

interface OriginStorageOptions {
  clear?: boolean
  origin?: string | string[]
  value?: any
}

interface SetStoragesOptions {
  localStorage?: OriginStorageOptions[]
  sessionStorage?: OriginStorageOptions[]
}
/**
  * 1) if we only need currentOrigin localStorage, access sync
  * 2) if cross-origin http, we need to load in iframe from our proxy that will intercept all http reqs at /__cypress/automation/*
  *      and postMessage() the localStorage value to us
  * 3) if cross-origin https, since we pass-thru https connections in the proxy, we need to
  *      send a message telling our proxy server to intercept the next req to the https domain,
  *      then follow 2)
  */
export async function getStorage (Cypress: Cypress.Cypress, options: GetStorageOptions = {}): Promise<Cypress.Storages> {
  const specWindow = Cypress.state('specWindow')

  if (!_.isObject(options)) {
    throw new Error('getStorage() takes an object')
  }

  const opts = _.defaults({}, options, {
    origin: 'currentOrigin',
  })

  const currentOrigin = window.location.origin
  const origins: Array<string> = await mapOrigins(Cypress, opts.origin)
  const results = {
    localStorage: [] as Cypress.OriginStorage[],
    sessionStorage: [] as Cypress.OriginStorage[],
  }

  function pushValue (origin, value) {
    if (!_.isEmpty(value.localStorage)) {
      results.localStorage.push({ origin, value: value.localStorage })
    }

    if (!_.isEmpty(value.sessionStorage)) {
      results.sessionStorage.push({ origin, value: value.sessionStorage })
    }
  }

  const currentOriginIndex = origins.indexOf(currentOrigin)

  if (currentOriginIndex !== -1) {
    origins.splice(currentOriginIndex, 1)
    const currentOriginStorage = getCurrentOriginStorage()

    pushValue(currentOrigin, currentOriginStorage)
  }

  if (_.isEmpty(origins)) {
    return results
  }

  if (currentOrigin.startsWith('https:')) {
    _.remove(origins, (v) => v.startsWith('http:'))
  }

  const postMessageResults = await getPostMessageLocalStorage(specWindow, origins)

  postMessageResults.forEach((val) => {
    pushValue(val[0], val[1])
  })

  return results
}

export async function clearStorage (Cypress: Cypress.Cypress, type?: StorageType) {
  const origins = await getAllHtmlOrigins(Cypress)
  const originOptions = origins.map((origin) => ({ origin, clear: true }))
  const options: SetStoragesOptions = {}

  if (!type || type === 'localStorage') {
    options.localStorage = originOptions
  }

  if (!type || type === 'sessionStorage') {
    options.sessionStorage = originOptions
  }

  await setStorage(Cypress, options)
}

async function setStorageOnOrigins (Cypress: Cypress.Cypress, originOptions) {
  const specWindow = Cypress.state('specWindow')

  const currentOrigin = window.location.origin

  const currentOriginIndex = _.findIndex(originOptions, { origin: currentOrigin })

  if (currentOriginIndex !== -1) {
    const opts = originOptions.splice(currentOriginIndex, 1)[0]

    if (!_.isEmpty(opts.localStorage)) {
      if (opts.localStorage.clear) {
        window.localStorage.clear()
      }

      _.each(opts.localStorage.value, (val, key) => localStorage.setItem(key, val))
    }

    if (opts.sessionStorage) {
      if (opts.sessionStorage.clear) {
        window.sessionStorage.clear()
      }

      _.each(opts.sessionStorage.value, (val, key) => sessionStorage.setItem(key, val))
    }
  }

  if (_.isEmpty(originOptions)) {
    return
  }

  await setPostMessageLocalStorage(specWindow, originOptions)
}

export async function setStorage (Cypress: Cypress.Cypress, options: SetStoragesOptions) {
  const currentOrigin = window.location.origin

  function mapToCurrentOrigin (v) {
    return {
      ...v,
      origin: (v.origin && v.origin !== 'currentOrigin')
        ? $Location.create(v.origin).origin
        : currentOrigin,
    }
  }

  const mappedLocalStorage = _.map(options.localStorage, (v) => {
    return mapToCurrentOrigin({ origin: v.origin, localStorage: _.pick(v, 'value', 'clear') })
  })

  const mappedSessionStorage = _.map(options.sessionStorage, (v) => {
    return mapToCurrentOrigin({ origin: v.origin, sessionStorage: _.pick(v, 'value', 'clear') })
  })

  const storageOptions = _.map(_.groupBy(mappedLocalStorage.concat(mappedSessionStorage), 'origin'), (v) => _.merge({}, ...v))

  await setStorageOnOrigins(Cypress, storageOptions)
}
