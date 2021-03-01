/* eslint-disable no-console */
const path = require('path')
const _ = require('lodash')
const Promise = require('bluebird')
const winston = require('winston')
const { fs } = require('./util/fs')
const appData = require('./util/app_data')

const folder = appData.path()

const getName = (name) => {
  return `${name}.log`
}

const getPathToLog = (name) => {
  return path.join(folder, getName(name))
}

const createFile = function (name, level, opts = {}) {
  const file = getPathToLog(name)

  // ensure that the containing dir exists
  fs.ensureDirSync(path.dirname(file))

  const obj = {
    name,
    filename: file,
    colorize: true,
    tailable: true,
    maxsize: 1000000, // 1mb
  }

  if (level) {
    obj.level = level
  }

  _.extend(obj, opts)

  return new (winston.transports.File)(obj)
}

const transports = [createFile('all', null, { handleExceptions: true })]

if (process.env.CYPRESS_DEBUG) {
  transports.push(new (winston.transports.Console)())
}

const logger = new (winston.Logger)({
  transports,

  exitOnError (err) {
    // cannot use a reference here since
    // defaultErrorHandler does not exist yet
    return logger.defaultErrorHandler(err)
  },

})

logger.createException = (err) => {
  return require('./exception').create(err, logger.getSettings())
}

logger.defaultErrorHandler = function (err) {
  logger.info('caught error', { error: err.message, stack: err.stack })

  const exit = () => {
    return process.exit(1)
  }

  const handleErr = function () {
    let e

    e = logger.errorHandler

    if (e) {
      const ret = e(err)

      if (ret === true) {
        return exit()
      }
    } else {
      // instead of console'ing these we should
      // think about chalking them so they are
      // formatted and displayed
      console.log(err)
      console.log(err.stack)

      return exit()
    }
  }

  logger.createException(err).then(handleErr).catch(handleErr)

  // do not exit on error, let us
  // handle it manually
  // why are we returning false here?
  // we need to return false only from
  // exitOnError
  return false
}

logger.setSettings = (obj) => {
  return logger._settings = obj
}

logger.getSettings = () => {
  return logger._settings
}

logger.unsetSettings = () => {
  return delete logger._settings
}

logger.setErrorHandler = (fn) => {
  return logger.errorHandler = fn
}

logger.getData = function (obj) {
  const keys = ['level', 'message', 'timestamp', 'type']

  return _.reduce(obj, (memo, value, key) => {
    if (!keys.includes(key)) {
      memo.data[key] = value
    } else {
      memo[key] = value
    }

    return memo
  }
  , { data: {} })
}

logger.normalize = (logs = []) => {
  return _.map(logs, logger.getData)
}

logger.getLogs = function () {
  const transport = 'all'

  return new Promise((resolve, reject) => {
    const opts = {
      limit: 500,
      order: 'desc',
    }

    const t = logger.transports[transport] != null ? logger.transports[transport] : (() => {
      throw new Error(`Log transport: '${transport}' does not exist!`)
    })()

    return t.query(opts, (err, results) => {
      if (err) {
        return reject(err)
      }

      return resolve(logger.normalize(results))
    })
  })
}

logger.off = () => {
  return logger.removeAllListeners('logging')
}

logger.onLog = function (fn) {
  const name = 'all'

  logger.off()

  return logger.on('logging', (transport, level, msg, data) => {
    if (transport.name === name) {
      const obj = { level, message: msg }

      obj.type = data.type
      obj.data = _.omit(data, 'type')
      obj.timestamp = new Date

      return fn(obj)
    }
  })
}

logger.clearLogs = function () {
  const files = _.map(logger.transports, (value, key) => {
    return fs.outputFileAsync(getPathToLog(key), '')
  })

  return Promise.all(files)
}

logger.log = _.wrap(logger.log, function (orig, ...args) {
  const last = _.last(args)

  // should be cloning this last object
  // and not mutating it directly!
  if (_.isObject(last)) {
    _.defaults(last,
      { type: 'server' })
  }

  return orig.apply(this, args)
})

process.removeAllListeners('unhandledRejection')
process.on('unhandledRejection', (err, promise) => {
  logger.defaultErrorHandler(err)

  return false
})

module.exports = logger
