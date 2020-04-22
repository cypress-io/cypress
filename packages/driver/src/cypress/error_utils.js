const _ = require('lodash')

const $errorMessages = require('./error_messages')
const $utils = require('./utils')

const ERROR_PROPS = 'message type name stack sourceMappedStack parsedStack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl'.split(' ')

const CypressErrorRe = /(AssertionError|CypressError)/
const twoOrMoreNewLinesRe = /\n{2,}/

const wrapErr = (err) => {
  if (!err) return

  return $utils.reduceProps(err, ERROR_PROPS)
}

const mergeErrProps = (origErr, ...newProps) => {
  return _.extend(origErr, ...newProps)
}

const replaceNameInStack = (err, newName) => {
  const { name, stack } = err

  if (!stack) return stack

  return stack.replace(name, newName)
}

const modifyErrName = (err, newName) => {
  const newStack = replaceNameInStack(err, newName)

  err.name = newName
  err.stack = newStack

  return err
}

const replaceMsgInStack = (err, newMsg) => {
  const { message, name, stack } = err

  if (!stack) return stack

  if (message) {
    // reset stack by replacing the original message with the new one
    return stack.replace(message, newMsg)
  }

  // if message is undefined or an empty string, the error (in Chrome at least)
  // is 'Error\n\n<stack>' and it results in wrongly prepending the
  // new message, looking like '<newMsg>Error\n\n<stack>'
  return stack.replace(name, `${name}: ${newMsg}`)
}

const newLineAtBeginningRe = /^\n+/

const replacedStack = (err, newStackErr) => {
  // if err already lacks a stack or we've removed the stack
  // for some reason, keep it stackless
  if (!err.stack) return err.stack

  const errString = err.toString()

  const newStackErrString = newStackErr.toString()
  const stackLines = newStackErr.stack
  .replace(newStackErrString, '')
  .replace(newLineAtBeginningRe, '')

  // sometimes the new stack doesn't include any lines, so just stick
  // with the original stack
  if (!stackLines) return err.stack

  return `${errString}\n${stackLines}`
}

const modifyErrMsg = (err, newErrMsg, cb) => {
  err = normalizeErrorStack(err)

  const newMsg = cb(err.message, newErrMsg)
  const newStack = replaceMsgInStack(err, newMsg)

  err.message = newMsg
  err.stack = newStack

  return err
}

const appendErrMsg = (err, messageOrObj) => {
  return modifyErrMsg(err, messageOrObj, (msg1, msg2) => {
    // we don't want to just throw in extra
    // new lines if there isn't even a msg
    if (!msg1) return msg2

    if (!msg2) return msg1

    return `${msg1}\n\n${msg2}`
  })
}

const makeErrFromObj = (obj) => {
  const err2 = new Error(obj.message)

  err2.name = obj.name
  err2.stack = obj.stack

  _.each(obj, (val, prop) => {
    if (!err2[prop]) {
      err2[prop] = val
    }
  })

  return err2
}

const throwErr = (err, options = {}) => {
  if (_.isString(err)) {
    err = cypressErr({ message: err })
  }

  if (options.noStackTrace) {
    err.stack = ''
  }

  let { onFail, errProps } = options

  // assume onFail is a command if
  //# onFail is present and isnt a function
  if (onFail && !_.isFunction(onFail)) {
    const command = onFail

    //# redefine onFail and automatically
    //# hook this into our command
    onFail = (err) => {
      return command.error(err)
    }
  }

  if (onFail) {
    err.onFail = onFail
  }

  if (errProps) {
    _.extend(err, errProps)
  }

  throw err
}

const throwErrByPath = (errPath, options = {}) => {
  let err

  try {
    err = cypressErrByPath(errPath, options)
  } catch (internalError) {
    err = internalErr(internalError)
  }

  return throwErr(err, options)
}

const warnByPath = (errPath, options = {}) => {
  const errObj = errObjByPath($errorMessages, errPath, options.args)
  let err = errObj.message

  if (errObj.docsUrl) {
    err += `\n\n${errObj.docsUrl}`
  }

  $utils.warning(err)
}

const internalErr = (err) => {
  const newErr = new Error(err)

  return mergeErrProps(newErr, err, { name: 'InternalError' })
}

const cypressErr = (err) => {
  const newErr = new Error(err.message)

  return mergeErrProps(newErr, err, { name: 'CypressError' })
}

const cypressErrByPath = (errPath, options = {}) => {
  const errObj = errObjByPath($errorMessages, errPath, options.args)

  return cypressErr(errObj)
}

const normalizeMsgNewLines = (message) => {
  //# normalize more than 2 new lines
  //# into only exactly 2 new lines
  return _
  .chain(message)
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join('\n\n')
  .value()
}

const replaceErrMsgTokens = (errMessage, args) => {
  if (!errMessage) return errMessage

  const getMsg = function (args = {}) {
    return _.reduce(args, (message, argValue, argKey) => {
      return message.replace(new RegExp(`\{\{${argKey}\}\}`, 'g'), argValue)
    }, errMessage)
  }

  return normalizeMsgNewLines(getMsg(args))
}

const errObjByPath = (errLookupObj, errPath, args) => {
  let errObjStrOrFn = getObjValueByPath(errLookupObj, errPath)

  if (!errObjStrOrFn) {
    throw new Error(`Error message path '${errPath}' does not exist`)
  }

  let errObj = errObjStrOrFn

  if (_.isFunction(errObjStrOrFn)) {
    errObj = errObjStrOrFn(args)
  }

  if (_.isString(errObj)) {
    // normalize into object if given string
    errObj = {
      message: errObj,
    }
  }

  let extendErrObj = {
    message: replaceErrMsgTokens(errObj.message, args),
  }

  if (errObj.docsUrl) {
    extendErrObj.docsUrl = replaceErrMsgTokens(errObj.docsUrl, args)
  }

  return _.extend({}, errObj, extendErrObj)
}

const errMsgByPath = (errPath, args) => {
  return getErrMsgWithObjByPath($errorMessages, errPath, args)
}

const getErrMsgWithObjByPath = (errLookupObj, errPath, args) => {
  const errObj = errObjByPath(errLookupObj, errPath, args)

  return errObj.message
}

const getErrMessage = (err) => {
  if (err && err.displayMessage) {
    return err.displayMessage
  }

  if (err && err.message) {
    return err.message
  }

  return err
}

const getErrStack = (err) => {
  // if cypress or assertion error
  // don't return the stack
  if (CypressErrorRe.test(err.name)) {
    return err.toString()
  }

  return err.stack
}

const normalizeErrorStack = (err) => {
  // normalize error message + stack for firefox
  const errString = err.toString()
  const errStack = err.stack || ''

  if (!errStack.slice(0, errStack.indexOf('\n')).includes(errString.slice(0, errString.indexOf('\n')))) {
    err.stack = `${errString}\n${errStack}`
  }

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

//// all errors flow through this function before they're finally thrown
//// or used to reject promises
const processErr = (errObj = {}, config) => {
  if (config('isInteractive') || !errObj.docsUrl) {
    return errObj
  }

  // append the docs url when not interactive so it appears in the stdout
  return appendErrMsg(errObj, errObj.docsUrl)
}

module.exports = {
  appendErrMsg,
  cypressErr,
  cypressErrByPath,
  CypressErrorRe,
  errMsgByPath,
  errObjByPath,
  getErrMessage,
  getErrMsgWithObjByPath,
  getErrStack,
  getObjValueByPath,
  internalErr,
  makeErrFromObj,
  mergeErrProps,
  modifyErrMsg,
  modifyErrName,
  normalizeErrorStack,
  normalizeMsgNewLines,
  replacedStack,
  processErr,
  throwErr,
  throwErrByPath,
  warnByPath,
  wrapErr,
}
