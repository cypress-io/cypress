/* eslint-disable no-console */

const fs = require('@packages/fs')
const eos = require('end-of-stream')
const path = require('path')
const omit = require('lodash.omit')
const debug = require('debug')
const isempty = require('lodash.isempty')
const winston = require('winston')
const Promise = require('bluebird')

const { combine, timestamp, json } = winston.format

/* eslint-disable one-var */
let TTY, prevTime, transport, fileLogger = null

const reset = () => {
  TTY = true
  prevTime = null
  transport = null
  fileLogger = null
}

reset()

const noop = () => {}

// proxy the console logs if we've enabled
// console output to TTY
const consoleLog = (...args) => {
  if (TTY) {
    console.log(...args)
  }
}

// does this string have a single line
// object format: %o ?
const needsSingleLineFormat = (args) => {
  const str = args[0]

  return args.length > 1 && !str.includes('%o')
}

const createLogger = (namespace) => {
  const d = debug(namespace)

  const log = (...args) => {
    const [message, props] = args

    // are we using a function as message?
    const isMessageFn = typeof message === 'function'
    const isMessageStr = typeof message === 'string'

    if (args.length > 2) {
      throw new Error(`Logs may contain at most 2 arguments. You passed: ${args.length}. The namespace was: ${namespace} and the message was: ${message}`)
    }

    // if we've passed a single argument and its not
    // a string or function then blow up
    if (args.length === 1 && !isMessageFn && !isMessageStr) {
      throw new Error(`Logs must contain at least a string message. You only passed a single argument which was not a string or function. The namespace was: ${namespace}`)
    }

    // enable passing a function callback to allow
    // to for optimized / conditional debug writes
    if (isMessageFn) {
      // recurse here
      return message(log)
    }

    const now = new Date()

    // what's the delta between our last log?
    const diff = now - (prevTime || now)

    // reset the prev time to now
    prevTime = now

    const payload = {
      props,
      namespace,
      ms: diff,
    }

    if (props && props.timestamp) {
      payload.timestamp = props.timestamp
    }

    payload.props = omit(payload.props, 'timestamp')

    if (isempty(payload.props)) {
      payload.props = undefined
    }

    // do the winston stuff here
    // if we're running in runMode
    if (fileLogger) {
      fileLogger.log('info', args[0], payload)
    }

    // noop if we're silencing TTY
    if (!TTY || !debug.enabled(namespace)) {
      return
    }

    // if printing an object and missing
    // a single line object formatter
    //
    // TODO: account for all arguments not
    // just a single %o
    if (needsSingleLineFormat(args)) {
      args[0] = `${args[0]} %o`
    }

    return d(...args)

  }

  // attach for convenience
  log.console = consoleLog

  return log
}

createLogger.verbose = () => {
  TTY = true
}

createLogger.silence = () => {
  TTY = false
}

createLogger.start = (folder) => {
  folder = folder || process.cwd()

  const filename = path.resolve(folder, 'debug.log')

  return fs
  .removeAsync(filename) // remove old log files
  .catch(noop) // honey badger dont care
  .then(() => {
    // now make sure we get a blank one
    return fs.ensureFile(filename)
  })
  .then(() => {
    transport = new winston.transports.File({ filename })

    // winston is missing this function... wtf
    transport.normalizeQuery = (options) => {
      return options
    }

    fileLogger = winston.createLogger({
      transports: [transport],
      format: combine(
        timestamp(),
        json()
      ),
    })
    .on('error', (err) => {
      console.log('winston logger errored:', err.stack)
    })

    fileLogger.queryAsync = Promise.promisify(transport.query, {
      context: transport,
    })

    return fileLogger
  })
}

createLogger.end = () => {
  // TODO: test this timeout
  return new Promise((resolve, reject) => {
    if (!fileLogger) return resolve()

    eos(transport._stream, (err) => {
      if (err) return reject(err)

      return resolve(fileLogger)
    })

    transport.end()
  })
  .timeout(5000)
  .catch(Promise.TimeoutError, noop)
}

// attach to proxy console logs
createLogger.console = consoleLog

// for testing
createLogger.reset = reset

// using singleton pattern here
module.exports = createLogger
