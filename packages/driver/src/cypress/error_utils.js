// See: ./errorScenarios.md for details about error messages and stack traces

const _ = require('lodash')
const chai = require('chai')

const $dom = require('../dom')
const $utils = require('./utils')
const $stackUtils = require('./stack_utils')
const $errorMessages = require('./error_messages')

const ERROR_PROPS = 'message type name stack sourceMappedStack parsedStack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl codeFrame'.split(' ')
const ERR_PREPARED_FOR_SERIALIZATION = Symbol('ERR_PREPARED_FOR_SERIALIZATION')

if (!Error.captureStackTrace) {
  Error.captureStackTrace = (err, fn) => {
    const stack = (new Error()).stack

    err.stack = $stackUtils.stackWithLinesDroppedFromMarker(stack, fn.name)
  }
}

const prepareErrorForSerialization = (err) => {
  if (err[ERR_PREPARED_FOR_SERIALIZATION]) {
    return err
  }

  if (err.type === 'existence' || $dom.isDom(err.actual) || $dom.isDom(err.expected)) {
    err.showDiff = false
  }

  if (err.showDiff === true) {
    if (err.actual) {
      err.actual = chai.util.inspect(err.actual)
    }

    if (err.expected) {
      err.expected = chai.util.inspect(err.expected)
    }
  } else {
    delete err.actual
    delete err.expected
    delete err.showDiff
  }

  err[ERR_PREPARED_FOR_SERIALIZATION] = true

  return err
}

const wrapErr = (err) => {
  if (!err) return

  prepareErrorForSerialization(err)

  return $utils.reduceProps(err, ERROR_PROPS)
}

const isAssertionErr = (err = {}) => {
  return err.name === 'AssertionError'
}

const isChaiValidationErr = (err = {}) => {
  return _.startsWith(err.message, 'Invalid Chai property')
}

const isCypressErr = (err = {}) => {
  return err.name === 'CypressError'
}

const mergeErrProps = (origErr, ...newProps) => {
  return _.extend(origErr, ...newProps)
}

const stackWithReplacedProps = (err, props) => {
  const {
    message: originalMessage,
    name: originalName,
    stack: originalStack,
  } = err

  const {
    message: newMessage,
    name: newName,
  } = props

  // if stack doesn't already exist, leave it as is
  if (!originalStack) return originalStack

  let stack

  if (newMessage) {
    stack = originalStack.replace(originalMessage, newMessage)
  }

  if (newName) {
    stack = originalStack.replace(originalName, newName)
  }

  if (originalMessage) {
    return stack
  }

  // if message is undefined or an empty string, the error (in Chrome at least)
  // is 'Error\n\n<stack>' and it results in wrongly prepending the
  // new message, looking like '<newMsg>Error\n\n<stack>'
  const message = newMessage || err.message
  const name = newName || err.name

  return originalStack.replace(originalName, `${name}: ${message}`)
}

const modifyErrMsg = (err, newErrMsg, cb) => {
  err.stack = $stackUtils.normalizedStack(err)

  const newMessage = cb(err.message, newErrMsg)
  const newStack = stackWithReplacedProps(err, { message: newMessage })

  err.message = newMessage
  err.stack = newStack

  return err
}

const appendErrMsg = (err, errMsg) => {
  return modifyErrMsg(err, errMsg, (msg1, msg2) => {
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
  const err = errByPath(errPath, options.args)

  // gets rid of internal stack lines that just build the error
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, throwErrByPath)
  }

  return throwErr(err, options)
}

const warnByPath = (errPath, options = {}) => {
  const errObj = errByPath(errPath, options.args)
  let err = errObj.message

  if (errObj.docsUrl) {
    err += `\n\n${errObj.docsUrl}`
  }

  $utils.warning(err)
}

class InternalCypressError extends Error {
  constructor (message) {
    super(message)

    this.name = 'InternalCypressError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalCypressError)
    }
  }
}

class CypressError extends Error {
  constructor (message) {
    super(message)

    this.name = 'CypressError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CypressError)
    }
  }

  setUserInvocationStack (stack) {
    this.userInvocationStack = stack

    return this
  }
}

const getUserInvocationStack = (err) => {
  return err.userInvocationStack
}

const internalErr = (err) => {
  const newErr = new InternalCypressError(err.message)

  return mergeErrProps(newErr, err)
}

const cypressErr = (err) => {
  const newErr = new CypressError(err.message)

  return mergeErrProps(newErr, err)
}

const cypressErrByPath = (errPath, options = {}) => {
  const errObj = errByPath(errPath, options.args)

  return cypressErr(errObj)
}

const replaceErrMsgTokens = (errMessage, args) => {
  if (!errMessage) return errMessage

  const replace = (str, argValue, argKey) => {
    return str.replace(new RegExp(`\{\{${argKey}\}\}`, 'g'), argValue)
  }

  const getMsg = function (args = {}) {
    return _.reduce(args, (message, argValue, argKey) => {
      if (_.isArray(message)) {
        return _.map(message, (str) => replace(str, argValue, argKey))
      }

      return replace(message, argValue, argKey)
    }, errMessage)
  }

  // replace more than 2 newlines with exactly 2 newlines
  return $utils.normalizeNewLines(getMsg(args), 2)
}

const errByPath = (msgPath, args) => {
  let msgValue = _.get($errorMessages, msgPath)

  if (!msgValue) {
    return internalErr({ message: `Error message path '${msgPath}' does not exist` })
  }

  let msgObj = msgValue

  if (_.isFunction(msgValue)) {
    msgObj = msgValue(args)
  }

  if (_.isString(msgObj)) {
    msgObj = {
      message: msgObj,
    }
  }

  return cypressErr({
    message: replaceErrMsgTokens(msgObj.message, args),
    docsUrl: msgObj.docsUrl ? replaceErrMsgTokens(msgObj.docsUrl, args) : undefined,
  })
}

const createUncaughtException = (type, err) => {
  // FIXME: `fromSpec` is a dirty hack to get uncaught exceptions in `top` to say they're from the spec
  const errPath = (type === 'spec' || err.fromSpec) ? 'uncaught.fromSpec' : 'uncaught.fromApp'
  let uncaughtErr = errByPath(errPath, {
    errMsg: err.message,
  })

  modifyErrMsg(err, uncaughtErr.message, () => uncaughtErr.message)

  err.docsUrl = _.compact([uncaughtErr.docsUrl, err.docsUrl])

  return err
}

// stacks from command failures and assertion failures have the right message
// but the stack points to cypress internals. here we replace the internal
// cypress stack with the invocation stack, which points to the user's code
const stackAndCodeFrameIndex = (err, userInvocationStack) => {
  if (!userInvocationStack) return { stack: err.stack }

  if (isCypressErr(err) || isChaiValidationErr(err)) {
    return $stackUtils.stackWithUserInvocationStackSpliced(err, userInvocationStack)
  }

  return { stack: $stackUtils.replacedStack(err, userInvocationStack) }
}

const preferredStackAndCodeFrameIndex = (err, userInvocationStack) => {
  let { stack, index } = stackAndCodeFrameIndex(err, userInvocationStack)

  stack = $stackUtils.stackWithContentAppended(err, stack)
  stack = $stackUtils.stackWithReplacementMarkerLineRemoved(stack)

  return { stack, index }
}

const enhanceStack = ({ err, userInvocationStack, projectRoot }) => {
  const { stack, index } = preferredStackAndCodeFrameIndex(err, userInvocationStack)
  const { sourceMapped, parsed } = $stackUtils.getSourceStack(stack, projectRoot)

  err.stack = stack
  err.sourceMappedStack = sourceMapped
  err.parsedStack = parsed
  err.codeFrame = $stackUtils.getCodeFrame(err, index)

  return err
}

// all errors flow through this function before they're finally thrown
// or used to reject promises
const processErr = (errObj = {}, config) => {
  let docsUrl = errObj.docsUrl

  if (config('isInteractive') || !docsUrl) {
    return errObj
  }

  // backup, and then delete the docsUrl property in runMode
  // so that it does not add the 'Learn More' link to the UI
  // for screenshots or videos
  delete errObj.docsUrl

  docsUrl = _(docsUrl).castArray().compact().join('\n\n')

  // append the docs url when not interactive so it appears in the stdout
  return appendErrMsg(errObj, docsUrl)
}

module.exports = {
  appendErrMsg,
  createUncaughtException,
  cypressErr,
  cypressErrByPath,
  enhanceStack,
  errByPath,
  isAssertionErr,
  isChaiValidationErr,
  isCypressErr,
  makeErrFromObj,
  mergeErrProps,
  modifyErrMsg,
  processErr,
  throwErr,
  throwErrByPath,
  warnByPath,
  wrapErr,
  getUserInvocationStack,
}
