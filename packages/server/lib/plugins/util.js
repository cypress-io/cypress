const { EventEmitter } = require('events')

// Minimal util functions needed by child processes
const wrapIpc = (aProcess) => {
  const emitter = new EventEmitter()

  aProcess.on('message', (message) => {
    return emitter.emit(message.event, ...message.args)
  })

  // prevent max listeners warning on ipc
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
}

const wrapChildPromise = (ipc, invoke, ids, args = []) => {
  return require('bluebird').try(() => {
    return invoke(ids.eventId, args)
  })
  .then((value) => {
    // undefined is coerced into null when sent over ipc, but we need
    // to differentiate between them for 'task' event
    if (value === undefined) {
      value = '__cypress_undefined__'
    }

    return ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
  }).catch((err) => {
    return ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(err))
  })
}

const serializeError = (err) => {
  const obj = {}

  if (err.name) obj.name = err.name

  if (err.message) obj.message = err.message

  if (err.stack) obj.stack = err.stack

  if (err.code) obj.code = err.code

  if (err.annotated) obj.annotated = err.annotated

  if (err.type) obj.type = err.type

  if (err.details) obj.details = err.details

  if (err.isCypressErr) obj.isCypressErr = err.isCypressErr

  if (err.messageMarkdown) obj.messageMarkdown = err.messageMarkdown

  if (err.originalError) obj.originalError = serializeError(err.originalError)

  if (err.compilerErrorLocation) obj.compilerErrorLocation = err.compilerErrorLocation

  return obj
}

const nonNodeRequires = () => {
  return Object.keys(require.cache).filter((c) => !c.includes('/node_modules/'))
}

const buildErrorLocationFromTransformError = (err, projectRoot) => {
  const cleanMessage = err.message
  .replace(/^.*\n/g, 'Error compiling file\n')

  // Regex to pull out the error from the message body of a tsx TransformError
  const transformErrorRegex = /\n(.*?):(\d+):(\d+):/g
  const failurePath = transformErrorRegex.exec(cleanMessage)

  return {
    compilerErrorLocation: failurePath ? {
      filePath: require('path').relative(projectRoot, failurePath[1]),
      line: Number(failurePath[2]),
      column: Number(failurePath[3]),
    } : null,
    originalMessage: err.message,
    message: cleanMessage,
  }
}

module.exports = {
  wrapIpc,
  wrapChildPromise,
  serializeError,
  nonNodeRequires,
  buildErrorLocationFromTransformError,
}
