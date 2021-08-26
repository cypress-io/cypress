// @ts-nocheck

// See: ./errorScenarios.md for details about error messages and stack traces

import _ from 'lodash'
import chai from 'chai'

import * as $dom from '../dom'
import * as $utils from './utils'
import * as $stackUtils from './stack_utils'
import * as $errorMessages from './error_messages'

const ERROR_PROPS = 'message type name stack sourceMappedStack parsedStack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl codeFrame'.split(' ')
const ERR_PREPARED_FOR_SERIALIZATION = Symbol('ERR_PREPARED_FOR_SERIALIZATION')

const crossOriginScriptRe = /^script error/i

if (!Error.captureStackTrace) {
  Error.captureStackTrace = (err, fn) => {
    const stack = (new Error()).stack

    err.stack = $stackUtils.stackWithLinesDroppedFromMarker(stack, fn.name)
  }
}

export const prepareErrorForSerialization = (err) => {
  if (typeof err === 'string') {
    err = new Error(err)
  }

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

export const wrapErr = (err) => {
  if (!err) return

  prepareErrorForSerialization(err)

  return $utils.reduceProps(err, ERROR_PROPS)
}

export const isAssertionErr = (err = {}) => {
  return err.name === 'AssertionError'
}

export const isChaiValidationErr = (err = {}) => {
  return _.startsWith(err.message, 'Invalid Chai property')
}

export const isCypressErr = (err = {}) => {
  return err.name === 'CypressError'
}

export const isSpecError = (spec, err) => {
  return _.includes(err.stack, spec.relative)
}

export const mergeErrProps = (origErr, ...newProps) => {
  return _.extend(origErr, ...newProps)
}

export const stackWithReplacedProps = (err, props) => {
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

export const modifyErrMsg = (err, newErrMsg, cb) => {
  err.stack = $stackUtils.normalizedStack(err)

  const newMessage = cb(err.message, newErrMsg)
  const newStack = stackWithReplacedProps(err, { message: newMessage })

  err.message = newMessage
  err.stack = newStack

  return err
}

export const appendErrMsg = (err, errMsg) => {
  return modifyErrMsg(err, errMsg, (msg1, msg2) => {
    // we don't want to just throw in extra
    // new lines if there isn't even a msg
    if (!msg1) return msg2

    if (!msg2) return msg1

    return `${msg1}\n\n${msg2}`
  })
}

export const makeErrFromObj = (obj) => {
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

export const throwErr = (err, options = {}) => {
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

export const throwErrByPath = (errPath, options = {}) => {
  const err = errByPath(errPath, options.args)

  // gets rid of internal stack lines that just build the error
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, throwErrByPath)
  }

  return throwErr(err, options)
}

export const warnByPath = (errPath, options = {}) => {
  const errObj = errByPath(errPath, options.args)
  let err = errObj.message

  if (errObj.docsUrl) {
    err += `\n\n${errObj.docsUrl}`
  }

  $utils.warning(err)
}

export class InternalCypressError extends Error {
  constructor (message) {
    super(message)

    this.name = 'InternalCypressError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalCypressError)
    }
  }
}

export class CypressError extends Error {
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

export const getUserInvocationStackFromError = (err) => {
  return err.userInvocationStack
}

export const internalErr = (err) => {
  const newErr = new InternalCypressError(err.message)

  return mergeErrProps(newErr, err)
}

export const cypressErr = (err) => {
  const newErr = new CypressError(err.message)

  return mergeErrProps(newErr, err)
}

export const cypressErrByPath = (errPath, options = {}) => {
  const errObj = errByPath(errPath, options.args)

  return cypressErr(errObj)
}

export const replaceErrMsgTokens = (errMessage, args) => {
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

// recursively try for a default docsUrl
export const docsUrlByParents = (msgPath) => {
  msgPath = msgPath.split('.').slice(0, -1).join('.')

  if (!msgPath) {
    return // reached root
  }

  const obj = _.get($errorMessages.default, msgPath)

  if (obj.hasOwnProperty('docsUrl')) {
    return obj.docsUrl
  }

  return docsUrlByParents(msgPath)
}

export const errByPath = (msgPath, args) => {
  let msgValue = _.get($errorMessages.default, msgPath)

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

  const docsUrl = (msgObj.hasOwnProperty('docsUrl') && msgObj.docsUrl) || docsUrlByParents(msgPath)

  return cypressErr({
    message: replaceErrMsgTokens(msgObj.message, args),
    docsUrl: docsUrl ? replaceErrMsgTokens(docsUrl, args) : undefined,
  })
}

export const createUncaughtException = ({ frameType, handlerType, state, err }) => {
  const errPath = frameType === 'spec' ? 'uncaught.fromSpec' : 'uncaught.fromApp'
  let uncaughtErr = errByPath(errPath, {
    errMsg: err.message,
    promiseAddendum: handlerType === 'unhandledrejection' ? ' It was caused by an unhandled promise rejection.' : '',
  })

  modifyErrMsg(err, uncaughtErr.message, () => uncaughtErr.message)

  err.docsUrl = _.compact([uncaughtErr.docsUrl, err.docsUrl])

  const current = state('current')

  err.onFail = () => {
    current?.getLastLog()?.error(err)
  }

  return err
}

// stacks from command failures and assertion failures have the right message
// but the stack points to cypress internals. here we replace the internal
// cypress stack with the invocation stack, which points to the user's code
export const stackAndCodeFrameIndex = (err, userInvocationStack) => {
  if (!userInvocationStack) return { stack: err.stack }

  if (isCypressErr(err) || isChaiValidationErr(err)) {
    return $stackUtils.stackWithUserInvocationStackSpliced(err, userInvocationStack)
  }

  return { stack: $stackUtils.replacedStack(err, userInvocationStack) }
}

export const preferredStackAndCodeFrameIndex = (err, userInvocationStack) => {
  let { stack, index } = stackAndCodeFrameIndex(err, userInvocationStack)

  stack = $stackUtils.stackWithContentAppended(err, stack)
  stack = $stackUtils.stackWithReplacementMarkerLineRemoved(stack)

  return { stack, index }
}

export const enhanceStack = ({ err, userInvocationStack, projectRoot }) => {
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
export const processErr = (errObj = {}, config) => {
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

const getStackFromErrArgs = ({ filename, lineno, colno }) => {
  if (!filename) return undefined

  const line = lineno != null ? `:${lineno}` : ''
  const column = lineno != null && colno != null ? `:${colno}` : ''

  return `  at <unknown> (${filename}${line}${column})`
}

const convertErrorEventPropertiesToObject = (args) => {
  let { message, filename, lineno, colno, err } = args

  // if the error was thrown as a string (throw 'some error'), `err` is
  // the message ('some error') and message is some browser-created
  // variant (e.g. 'Uncaught some error')
  message = _.isString(err) ? err : message
  const stack = getStackFromErrArgs({ filename, lineno, colno })

  return makeErrFromObj({
    name: 'Error',
    message,
    stack,
  })
}

export const errorFromErrorEvent = (event) => {
  let { message, filename, lineno, colno, error } = event
  let docsUrl = error?.docsUrl

  // reset the message on a cross origin script error
  // since no details are accessible
  if (crossOriginScriptRe.test(message)) {
    const crossOriginErr = errByPath('uncaught.cross_origin_script')

    message = crossOriginErr.message
    docsUrl = crossOriginErr.docsUrl
  }

  // it's possible the error was thrown as a string (throw 'some error')
  // so create it in the case it's not already an object
  const err = _.isObject(error) ? error : convertErrorEventPropertiesToObject({
    message, filename, lineno, colno,
  })

  err.docsUrl = docsUrl

  // makeErrFromObj clones the error, so the original doesn't get mutated
  return {
    originalErr: err,
    err: makeErrFromObj(err),
  }
}

export const errorFromProjectRejectionEvent = (event) => {
  // Bluebird triggers "unhandledrejection" with its own custom error event
  // where the `promise` and `reason` are attached to event.detail
  // http://bluebirdjs.com/docs/api/error-management-configuration.html
  if (event.detail) {
    event = event.detail
  }

  // makeErrFromObj clones the error, so the original doesn't get mutated
  return {
    originalErr: event.reason,
    err: makeErrFromObj(event.reason),
    promise: event.promise,
  }
}

export const errorFromUncaughtEvent = (handlerType, event) => {
  return handlerType === 'error' ?
    errorFromErrorEvent(event) :
    errorFromProjectRejectionEvent(event)
}

export const logError = (Cypress, handlerType, err, handled = false) => {
  Cypress.log({
    message: `${err.name}: ${err.message}`,
    name: 'uncaught exception',
    type: 'parent',
    // specifying the error causes the log to be red/failed
    // otherwise, if it's been handled, we omit the error so it is grey/passed
    error: handled ? undefined : err,
    snapshot: true,
    event: true,
    timeout: 0,
    end: true,
    consoleProps: () => {
      const consoleObj = {
        'Caught By': `"${handlerType}" handler`,
        'Error': err,
      }

      return consoleObj
    },
  })
}
