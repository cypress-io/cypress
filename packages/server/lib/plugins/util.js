const _ = require('lodash')
const EE = require('events')
const Promise = require('bluebird')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

const serializeError = (err) => {
  const obj = _.pick(err,
    'name', 'message', 'stack', 'code', 'annotated', 'type',
    'details', 'isCypressErr', 'messageMarkdown',
    'originalError',
    // Location of the error when a TSError or a esbuild error occurs (parse error from ts-node or esbuild)
    'compilerErrorLocation')

  if (obj.originalError) {
    obj.originalError = serializeError(obj.originalError)
  }

  return obj
}

module.exports = {
  serializeError,

  nonNodeRequires () {
    return Object.keys(require.cache).filter((c) => !c.includes('/node_modules/'))
  },

  wrapIpc (aProcess) {
    const emitter = new EE()

    aProcess.on('message', (message) => {
      return emitter.emit(message.event, ...message.args)
    })

    // prevent max listeners warning on ipc
    // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
    emitter.setMaxListeners(Infinity)

    return {
      send (event, ...args) {
        if (aProcess.killed || !aProcess.connected) {
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
  },

  wrapChildPromise (ipc, invoke, ids, args = []) {
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
  },
}
