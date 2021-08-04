import _ from 'lodash'
import EE from 'events'
import Debug from 'debug'
import Promise from 'bluebird'
import type { ChildProcess } from 'child_process'

const debug = Debug('cypress:server:plugins')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'
const FUNCTION_SERIALIZED = '__cypress_function__'

export function serializeError (err) {
  return _.pick(err, 'name', 'message', 'stack', 'code', 'annotated', 'type')
}

function serializeArgument (arg) {
  if (arg === null || arg === undefined) {
    return null
  }

  if (typeof arg === 'function') {
    return FUNCTION_SERIALIZED
  }

  if (typeof arg === 'object') {
    if (_.isArray(arg)) {
      return arg.map(serializeArgument)
    }

    const serializedObject = {}

    for (const [key, val] of Object.entries(arg)) {
      serializedObject[key] = serializeArgument(val)
    }

    return serializedObject
  }

  return arg
}

function deserializeArgument (arg) {
  if (arg === null || arg === undefined) {
    return null
  }

  if (arg === FUNCTION_SERIALIZED) {
    return function () {
      throw Error('this function is not meant to be used on it\'s own. It is the result of a deserialization and can be used to check the type of a returned object.')
    }
  }

  if (typeof arg === 'object') {
    if (_.isArray(arg)) {
      return arg.map((argElement) => deserializeArgument(argElement))
    }

    return Object.keys(arg).reduce(function (acc, key) {
      acc[key] = deserializeArgument(arg[key])

      return acc
    }, {})
  }

  return arg
}

type Handler = {(...args: any[]): any, __realHandlerFunction__?: () => void}

export function wrapIpc (aProcess: ChildProcess | (NodeJS.Process & {
  killed: boolean
  send: (opts: {
    event: string
    args: any[]
  }) => void
})): {
  send: (event: string, ...rawArgs: any[]) => void
  on: (event: string, handler: Handler) => void
  removeListener: (event: string, handler: Handler) => void
} {
  const emitter = new EE()

  aProcess.on('message', (message) => {
    return emitter.emit(message.event, ...message.args)
  })

  // prevent max listeners warning on ipc
  // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
  emitter.setMaxListeners(Infinity)

  return {
    send (event, ...rawArgs) {
      if (aProcess.killed) {
        return
      }

      const args = rawArgs.map((arg) => serializeArgument(arg))

      return aProcess.send({
        event,
        args,
      })
    },

    on (event, handler) {
      function wrappedHandler (...rawArgs) {
        return handler(...rawArgs.map((arg) => deserializeArgument(arg)))
      }
      handler.__realHandlerFunction__ = wrappedHandler
      emitter.on(event, wrappedHandler)
    },

    removeListener (event, handler) {
      if (handler.__realHandlerFunction__) {
        emitter.removeListener(event, handler.__realHandlerFunction__)
      }
    },
  }
}

export function wrapChildPromise (ipc, invoke, ids, args = []) {
  return Promise.try(() => {
    return invoke(ids.eventId, args)
  })
  .then((value) => {
    // undefined is coerced into null when sent over ipc, but we need
    // to differentiate between them for 'task' event
    if (value === undefined) {
      value = UNDEFINED_SERIALIZED
    }

    return ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
  }).catch((err) => {
    return ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(err))
  })
}

export function wrapParentPromise (ipc, eventId, callback) {
  const invocationId = _.uniqueId('inv')

  return new Promise((resolve, reject) => {
    const handler = function (err, value) {
      ipc.removeListener(`promise:fulfilled:${invocationId}`, handler)

      if (err) {
        debug('promise rejected for id %s %o', invocationId, ':', err.stack)
        reject(_.extend(new Error(err.message), err))

        return
      }

      if (value === UNDEFINED_SERIALIZED) {
        value = undefined
      }

      debug(`promise resolved for id '${invocationId}' with value`, value)

      return resolve(value)
    }

    ipc.on(`promise:fulfilled:${invocationId}`, handler)

    return callback(invocationId)
  })
}
