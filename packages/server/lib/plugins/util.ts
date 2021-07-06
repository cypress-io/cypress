import _ from 'lodash'
import EE from 'events'
import Debug from 'debug'
import Promise from 'bluebird'

const debug = Debug('cypress:server:plugins')
const UNDEFINED_SERIALIZED = '__cypress_undefined__'

const serializeError = (err) => {
  return _.pick(err, 'name', 'message', 'stack', 'code', 'annotated', 'type')
}

export { serializeError }

export function wrapIpc (aProcess) {
  const emitter = new EE()

  aProcess.on('message', (message) => {
    return emitter.emit(message.event, ...message.args)
  })

  // prevent max listeners warning on ipc
  // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
  emitter.setMaxListeners(Infinity)

  return {
    send (event, ...args) {
      if (aProcess.killed) {
        return
      }

      return aProcess.send({
        event,
        args,
      })
    },

    on: emitter.on.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
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
