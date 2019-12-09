import _ from 'lodash'
import Bluebird from 'bluebird'
import debugModule from 'debug'

const debug = debugModule('cypress:server:xhr_ws_server')

function trunc (str) {
  return _.truncate(str, {
    length: 100,
    omission: '... [truncated to 100 chars]',
  })
}

type DeferredPromise<T> = {
  resolve: Function
  reject: Function
  promise: Bluebird<T>
}

export function create () {
  let incomingXhrResponses: {
    [key: string]: string | DeferredPromise<string>
  } = {}

  function onIncomingXhr (id: string, data: string) {
    debug('onIncomingXhr %o', { id, res: trunc(data) })
    const deferred = incomingXhrResponses[id]

    if (deferred && typeof deferred !== 'string') {
      // request came before response, resolve with it
      return deferred.resolve(data)
    }

    // response came before request, cache the data
    incomingXhrResponses[id] = data
  }

  function getDeferredResponse (id) {
    debug('getDeferredResponse %o', { id })
    // if we already have it, send it
    const res = incomingXhrResponses[id]

    if (res) {
      if (typeof res === 'object') {
        debug('returning existing deferred promise for %o', { id, res })

        return res.promise
      }

      debug('already have deferred response %o', { id, res: trunc(res) })
      delete incomingXhrResponses[id]

      return res
    }

    let deferred: Partial<DeferredPromise<string>> = {}

    deferred.promise = new Bluebird((resolve, reject) => {
      debug('do not have response, waiting %o', { id })
      deferred.resolve = resolve
      deferred.reject = reject
    })
    .tap((res) => {
      debug('deferred response found %o', { id, res: trunc(res) })
    }) as Bluebird<string>

    incomingXhrResponses[id] = deferred as DeferredPromise<string>

    return deferred.promise
  }

  function reset () {
    debug('resetting incomingXhrs %o', { incomingXhrResponses })

    _.forEach(incomingXhrResponses, (res) => {
      if (typeof res !== 'string') {
        const err: any = new Error('This stubbed XHR was pending on a stub response object from the driver, but the test ended before that happened.')

        err.testEndedBeforeResponseReceived = true

        res.reject(err)
      }
    })

    incomingXhrResponses = {}
  }

  return {
    onIncomingXhr,
    getDeferredResponse,
    reset,
  }
}
