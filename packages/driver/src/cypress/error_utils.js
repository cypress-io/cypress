const _ = require('lodash')

const $errorMessages = require('./error_messages')
const $utils = require('./utils')

const ERROR_PROPS = 'message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending'.split(' ')
const CypressErrorRe = /(AssertionError|CypressError)/
const twoOrMoreNewLinesRe = /\n{2,}/

const appendErrMsg = (err, message) => {
  //# preserve stack
  //# this is the critical part
  //# because the browser has a cached
  //# dynamic stack getter that will
  //# not be evaluated later
  const stack = err.stack || ''

  //# preserve message
  //# and toString
  let msg = err.message
  const str = err.toString()

  //# append message
  msg += `\n\n${message}`

  //# set message
  err.message = msg

  //# reset stack by replacing the original first line
  //# with the new one
  err.stack = stack.replace(str, err.toString())

  module.exports.normalizeErrorStack(err)

  return err
}

const normalizeErrorStack = (e) => {
  //# normalize error message + stack for firefox
  const errString = e.toString()
  const errStack = e.stack || ''

  if (!errStack.slice(0, errStack.indexOf('\n')).includes(errString.slice(0, errString.indexOf('\n')))) {
    e.stack = `${errString}\n${errStack}`
  }

  return e
}

const cloneErr = (obj) => {
  const err2 = new Error(obj.message)

  err2.name = obj.name
  err2.stack = obj.stack

  for (let prop of Object.keys(obj || {})) {
    const val = obj[prop]

    if (!err2[prop]) {
      err2[prop] = val
    }
  }

  return err2
}

const throwErr = (err, options) => {
  if (options == null) {
    options = {}
  }

  if (_.isString(err)) {
    err = cypressErr(err)

    if (options.noStackTrace) {
      err.stack = ''
    }
  }

  let { onFail } = options
  const { errProps } = options

  //# assume onFail is a command if
  //# onFail is present and isnt a function
  if (onFail && !_.isFunction(onFail)) {
    const command = onFail

    //# redefine onFail and automatically
    //# hook this into our command
    onFail = (err) => command.error(err)
  }

  if (onFail) {
    err.onFail = onFail
  }

  if (errProps) {
    _.extend(err, errProps)
  }

  throw err
}

const throwErrByPath = (errPath, options) => {
  let err

  if (options == null) {
    options = {}
  }

  err = (() => {
    try {
      return errMsgByPath(errPath, options.args)
    } catch (e) {
      return internalErr(e)
    }
  })()

  throwErr(err, options)
}

const warnByPath = (errPath, options) => {
  if (options == null) {
    options = {}
  }

  const err = errMsgByPath(errPath, options.args)

  return $utils.warning(err)
}

const internalErr = (err) => {
  err = new Error(err)
  err.name = 'InternalError'

  return err
}

const cypressErr = (err) => {
  err = new Error(err)
  err.name = 'CypressError'

  return err
}

const getObjValueByPath = (obj, keyPath) => {
  if (!_.isObject(obj)) {
    throw new Error('The first parameter to utils.getObjValueByPath() must be an object')
  }

  if (!_.isString(keyPath)) {
    throw new Error('The second parameter to utils.getObjValueByPath() must be a string')
  }

  const keys = keyPath.split('.')
  let val = obj

  for (let key of keys) {
    val = val[key]
    if (!val) {
      break
    }
  }

  return val
}

const errMsgByPath = (errPath, args) => {
  let errMessage

  if (!(errMessage = getObjValueByPath($errorMessages, errPath))) {
    throw new Error(`Error message path '${errPath}' does not exist`)
  }

  const getMsg = function () {
    if (_.isFunction(errMessage)) {
      return errMessage(args)
    }

    return _.reduce(args, (message, argValue, argKey) => message.replace(new RegExp(`\{\{${argKey}\}\}`, 'g'), argValue)
      , errMessage)
  }

  //# normalize two or more new lines
  //# into only exactly two new lines
  return _
  .chain(getMsg())
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join('\n\n')
  .value()
}

const serializeError = (err) => {
  if (!err) return null

  return _.reduce(ERROR_PROPS, (memo, prop) => {
    if (_.has(err, prop) || err[prop]) {
      memo[prop] = err[prop]
    }

    return memo
  }, {})
}

const wrapErr = (err) => {
  return $utils.reduceProps(err, ERROR_PROPS)
}

module.exports = {
  CypressErrorRe,
  appendErrMsg,
  normalizeErrorStack,
  cloneErr,
  throwErr,
  throwErrByPath,
  warnByPath,
  internalErr,
  cypressErr,
  errMsgByPath,
  serializeError,
  wrapErr,
  getObjValueByPath,
}
