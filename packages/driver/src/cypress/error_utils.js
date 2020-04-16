const _ = require('lodash')

const $errorMessages = require('./error_messages')
const $utils = require('./utils')
const $stackUtils = require('./stack_utils')

const ERROR_PROPS = 'message type name stack sourceMappedStack parsedStack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl codeFrame'.split(' ')
const chaiValidationRe = /^Invalid Chai property/
const twoOrMoreNewLinesRe = /\n{2,}/

const wrapErr = (err) => {
  if (!err) return

  return $utils.reduceProps(err, ERROR_PROPS)
}

const isAssertionErr = (err = {}) => {
  return err.name === 'AssertionError'
}

const isChaiValidationErr = (err = {}) => {
  return chaiValidationRe.test(err.message)
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
  // TODO: can we remove this?
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

const normalizeMsgNewLines = (message) => {
  // normalize more than 2 new lines into only exactly 2 new lines
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
  const errPath = type === 'spec' ? 'uncaught.fromSpec' : 'uncaught.fromApp'
  let uncaughtErr = errByPath(errPath, {
    errMsg: err.message,
  })

  modifyErrMsg(err, uncaughtErr.message, () => uncaughtErr.message)

  err.docsUrl = uncaughtErr.docsUrl

  return err
}

const enhanceStack = ({ err, userInvocationStack, projectRoot }) => {
  // stacks from command failures and assertion failures have the right message
  // but the stack points to cypress internals. here we replace the internal
  // cypress stack with the invocation stack, which points to the user's code
  if (userInvocationStack) {
    // const originalStack = err.stack

    err.stack = $stackUtils.replacedStack(err, userInvocationStack)

    // if (isCypressErr(err) || isChaiValidationErr(err)) {
    //   err.stack = $stackUtils.stackWithOriginalAppended(err, {
    //     stackTitle: 'From Cypress Internals',
    //     stack: originalStack,
    //   })
    // }
  }

  const { sourceMapped, parsed } = $stackUtils.getSourceStack(err.stack, projectRoot)

  err.sourceMappedStack = sourceMapped
  err.parsedStack = parsed
  err.codeFrame = $stackUtils.getCodeFrame(err)

  return err
}

// all errors flow through this function before they're finally thrown
// or used to reject promises
const processErr = (errObj = {}, config) => {
  if (config('isInteractive') || !errObj.docsUrl) {
    return errObj
  }

  // append the docs url when not interactive so it appears in the stdout
  return appendErrMsg(errObj, errObj.docsUrl)
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
  normalizeMsgNewLines,
  processErr,
  throwErr,
  throwErrByPath,
  warnByPath,
  wrapErr,
}
