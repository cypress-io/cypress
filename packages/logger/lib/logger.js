/* eslint-disable  */

const debug = require('debug')
const winston = require('winston')

let ENABLED = true
let prevTime = null
let LOGS_FOLDER = null

const noop = () => {}

// proxy the console logs if we're enabled
const console = (...args) => {
  if (ENABLED) {
    console.log(...args)
  }
}

// does this string have a single line
// object format: %o ?
const needsSingleLineFormat = (args) => {
  const str = args[0]

  return args.length > 1 && !str.includes('%o')
}

const create = (namespace) => {
  const d = debug(namespace)

  const log = (...args) => {
    const now = new Date()

    // what's the delta between our last log?
    const diff = now - (prevTime || now)

    // reset the prev time to now
    prevTime = now

    // do the winston stuff here
    // if we're running in runMode

    // noop if everything is disabled
    if (!ENABLED) {
      return
    }

    // enable passing a function callback to allow
    // to for optimized / conditional debug writes
    if (typeof args[0] === 'function') {
      // recurse here
      return args[0](log)
    }

    // if we've passed a single argument
    // and its not a string, then format
    // as a single line object
    if (typeof args[0] !== 'string') {
      args.unshift('%o')
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
  log.console = console

  return log
}

const createLogger = (namespace) => {
  if (debug.enabled(namespace)) {
    return create(namespace)
  }

  // return a function
  // that does nuffin'
  return noop
}

createLogger.enable = () => {
  ENABLED = true
}

createLogger.disable = () => {
  ENABLED = false
}

createLogger.setDestination = (folder) => {
  LOGS_FOLDER = folder
}

// attach to proxy console logs
createLogger.console = console

// using singleton pattern here
module.exports = createLogger
