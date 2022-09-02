// See: ./errorScenarios.md for details about error messages and stack traces

import chai from 'chai'
import _ from 'lodash'
import $dom from '../dom'
import { stripAnsi } from '@packages/errors'
import $errorMessages from './error_messages'
import $stackUtils, { StackAndCodeFrameIndex } from './stack_utils'
import $utils from './utils'

const ERROR_PROPS = 'message type name stack parsedStack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl codeFrame'.split(' ')
const ERR_PREPARED_FOR_SERIALIZATION = Symbol('ERR_PREPARED_FOR_SERIALIZATION')

const crossOriginScriptRe = /^script error/i

if (!Error.captureStackTrace) {
  Error.captureStackTrace = (err, fn) => {
    const stack = (new Error()).stack;

    (err as Error).stack = $stackUtils.stackWithLinesDroppedFromMarker(stack, fn?.name)
  }
}

const prepareErrorForSerialization = (err) => {
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

// some errors, probably from user callbacks, might be boolean, number or falsy values
// which means serializing will not provide any useful context
const isSerializableError = (err) => {
  return !!err && (typeof err === 'object' || typeof err === 'string')
}

const wrapErr = (err) => {
  if (!isSerializableError(err)) return

  prepareErrorForSerialization(err)

  return $utils.reduceProps(err, ERROR_PROPS)
}

const isAssertionErr = (err: Error) => {
  return err.name === 'AssertionError'
}

const isChaiValidationErr = (err: Error) => {
  return _.startsWith(err.message, 'Invalid Chai property')
}

const isCypressErr = (err: Error): boolean => {
  return err.name === 'CypressError'
}

const isSpecError = (spec, err) => {
  return _.includes(err.stack, spec.relative)
}

const mergeErrProps = (origErr: Error, ...newProps): Error => {
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

const getUserInvocationStack = (err, state) => {
  const current = state('current')

  const currentAssertionCommand = current?.get('currentAssertionCommand')
  const withInvocationStack = currentAssertionCommand || current
  // user assertion errors (expect().to, etc) get their invocation stack
  // attached to the error thrown from chai
  // command errors and command assertion errors (default assertion or cy.should)
  // have the invocation stack attached to the current command
  // prefer err.userInvocation stack if it's been set
  let userInvocationStack = getUserInvocationStackFromError(err) || state('currentAssertionUserInvocationStack')

  // if there is no user invocation stack from an assertion or it is the default
  // assertion, meaning it came from a command (e.g. cy.get), prefer the
  // command's user invocation stack so the code frame points to the command.
  // `should` callbacks are tricky because the `currentAssertionUserInvocationStack`
  // points to the `cy.should`, but the error came from inside the callback,
  // so we need to prefer that.
  if (
    !userInvocationStack
    || err.isDefaultAssertionErr
    || (currentAssertionCommand && !current?.get('followedByShouldCallback'))
  ) {
    userInvocationStack = withInvocationStack?.get('userInvocationStack')
  }

  if (!userInvocationStack) return

  if (
    isCypressErr(err)
    || isAssertionErr(err)
    || isChaiValidationErr(err)
  ) {
    return userInvocationStack
  }
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

const makeErrFromErr = (err, options: any = {}) => {
  if (_.isString(err)) {
    err = cypressErr({ message: err })
  }

  let { onFail, errProps } = options

  // assume onFail is a command if
  // onFail is present and isn't a function
  if (onFail && !_.isFunction(onFail)) {
    const command = onFail

    // redefine onFail and automatically
    // hook this into our command
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

  return err
}

const throwErr = (err, options: any = {}): never => {
  throw makeErrFromErr(err, options)
}

const throwErrByPath = (errPath, options: any = {}): never => {
  const err = errByPath(errPath, options.args)

  if (options.stack) {
    err.stack = $stackUtils.replacedStack(err, options.stack)
  } else if (Error.captureStackTrace) {
    // gets rid of internal stack lines that just build the error
    Error.captureStackTrace(err, throwErrByPath)
  }

  throw makeErrFromErr(err, options)
}

const warnByPath = (errPath, options: any = {}) => {
  const errObj = errByPath(errPath, options.args)
  let err = errObj.message
  const docsUrl = (errObj as CypressError).docsUrl

  if (docsUrl) {
    err += `\n\n${docsUrl}`
  }

  $utils.warning(err)
}

export class InternalCypressError extends Error {
  onFail?: undefined | Function

  constructor (message) {
    super(message)

    this.name = 'InternalCypressError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalCypressError)
    }
  }
}

export class CypressError extends Error {
  docsUrl?: string
  retry?: boolean
  userInvocationStack?: any
  onFail?: undefined | Function

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

const getUserInvocationStackFromError = (err) => {
  return err.userInvocationStack
}

const internalErr = (err): InternalCypressError => {
  const newErr = new InternalCypressError(err.message)

  return mergeErrProps(newErr, err)
}

const cypressErr = (err): CypressError => {
  const newErr = new CypressError(err.message)

  return mergeErrProps(newErr, err) as CypressError
}

const cypressErrByPath = (errPath, options: any = {}) => {
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

// recursively try for a default docsUrl
const docsUrlByParents = (msgPath) => {
  msgPath = msgPath.split('.').slice(0, -1).join('.')

  if (!msgPath) {
    return // reached root
  }

  const obj = _.get($errorMessages, msgPath)

  if (obj.hasOwnProperty('docsUrl')) {
    return obj.docsUrl
  }

  return docsUrlByParents(msgPath)
}

const errByPath = (msgPath, args?) => {
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

  const docsUrl = (msgObj.hasOwnProperty('docsUrl') && msgObj.docsUrl) || docsUrlByParents(msgPath)

  return cypressErr({
    message: replaceErrMsgTokens(msgObj.message, args),
    docsUrl: docsUrl ? replaceErrMsgTokens(docsUrl, args) : undefined,
  })
}

const createUncaughtException = ({ frameType, handlerType, state, err }) => {
  const errPath = frameType === 'spec' ? 'uncaught.fromSpec' : 'uncaught.fromApp'
  let uncaughtErr = errByPath(errPath, {
    errMsg: stripAnsi(err.message),
    promiseAddendum: handlerType === 'unhandledrejection' ? ' It was caused by an unhandled promise rejection.' : '',
  }) as CypressError

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
const stackAndCodeFrameIndex = (err, userInvocationStack): StackAndCodeFrameIndex => {
  if (!userInvocationStack) return { stack: err.stack }

  if (isCypressErr(err) || isChaiValidationErr(err)) {
    return $stackUtils.stackWithUserInvocationStackSpliced(err, userInvocationStack)
  }

  return { stack: $stackUtils.replacedStack(err, userInvocationStack) || '' }
}

const preferredStackAndCodeFrameIndex = (err, userInvocationStack) => {
  let { stack, index } = stackAndCodeFrameIndex(err, userInvocationStack)

  stack = $stackUtils.stackWithContentAppended(err, stack)
  stack = $stackUtils.stackWithReplacementMarkerLineRemoved(stack)

  return { stack, index }
}

const enhanceStack = ({ err, userInvocationStack, projectRoot }: {
  err: any
  userInvocationStack?: any
  projectRoot?: any
}) => {
  const { stack, index } = preferredStackAndCodeFrameIndex(err, userInvocationStack)
  const { sourceMapped, parsed } = $stackUtils.getSourceStack(stack, projectRoot)

  /*
    TODO:
    1. See if it passes with hardcoded `stack` string using "yarn test webpack_dev_server_fresh_spec.ts --headed --no-exit"
    2. If it passes, tweak line number in hardcoded `stack` string and see if that passes
    3. If it doesn't, find out why getSourceStack has different numbers
    4. If different numbers are necessary, find out why message is getting appended
  */
  err.stack = sourceMapped
  err.parsedStack = parsed
  err.codeFrame = $stackUtils.getCodeFrame(err, index)

  return err
}

// all errors flow through this function before they're finally thrown
// or used to reject promises
const processErr = (errObj: CypressError, config) => {
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

export interface ErrorFromErrorEvent {
  originalErr: Error
  err: Error
}

const errorFromErrorEvent = (event): ErrorFromErrorEvent => {
  let { message, filename, lineno, colno, error } = event
  let docsUrl = error?.docsUrl

  // reset the message on a cross origin script error
  // since no details are accessible
  if (crossOriginScriptRe.test(message)) {
    const crossOriginErr = errByPath('uncaught.cross_origin_script') as CypressError

    message = crossOriginErr.message
    docsUrl = crossOriginErr.docsUrl
  }

  // it's possible the error was thrown as a string (throw 'some error')
  // so create it in the case it's not already an object
  const err = (_.isObject(error) ? error : convertErrorEventPropertiesToObject({
    message, filename, lineno, colno,
  })) as CypressError

  err.docsUrl = docsUrl

  // makeErrFromObj clones the error, so the original doesn't get mutated
  return {
    originalErr: err,
    err: makeErrFromObj(err),
  }
}

export interface ErrorFromProjectRejectionEvent extends ErrorFromErrorEvent {
  promise: Promise<any>
}

const errorFromProjectRejectionEvent = (event): ErrorFromProjectRejectionEvent => {
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

const errorFromUncaughtEvent = (handlerType, event) => {
  return handlerType === 'error' ?
    errorFromErrorEvent(event) :
    errorFromProjectRejectionEvent(event)
}

const logError = (Cypress, handlerType, err, handled = false) => {
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

const getUnsupportedPlugin = (runnable) => {
  if (!(runnable.invocationDetails && runnable.invocationDetails.originalFile && runnable.err && runnable.err.message)) {
    return null
  }

  const pluginsErrors = {
    '@cypress/code-coverage': 'glob pattern string required',
  }

  const unsupportedPluginFound = Object.keys(pluginsErrors).find((plugin) => runnable.invocationDetails.originalFile.includes(plugin))

  if (unsupportedPluginFound && pluginsErrors[unsupportedPluginFound] && runnable.err.message.includes(pluginsErrors[unsupportedPluginFound])) {
    return unsupportedPluginFound
  }

  return null
}

export default {
  stackWithReplacedProps,
  appendErrMsg,
  createUncaughtException,
  cypressErr,
  cypressErrByPath,
  enhanceStack,
  errByPath,
  errorFromUncaughtEvent,
  getUnsupportedPlugin,
  getUserInvocationStack,
  getUserInvocationStackFromError,
  isAssertionErr,
  isChaiValidationErr,
  isCypressErr,
  isSpecError,
  logError,
  makeErrFromObj,
  mergeErrProps,
  modifyErrMsg,
  processErr,
  throwErr,
  throwErrByPath,
  warnByPath,
  wrapErr,
}

/*
// EXPECTED

1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /private/var/folders/gw/50bnkq8n2k79cr_l_sqkw8dm0000gn/T/cy-projects/webpack4_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (8:0)

  6 |   cy.get('h1').contains('Hello World')
  7 | }
> 8 | })
    | ^
  9 |
    at instantiate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parse-error/credentials.js:61:22)
    at toParseError (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parse-error.js:58:12)
    at Parser.raise (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/tokenizer/index.js:1763:19)
    at Parser.unexpected (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/tokenizer/index.js:1808:16)
    at Parser.expect (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/util.js:153:28)
    at Parser.parseCallExpressionArguments (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:988:14)
    at Parser.parseCoverCallAndAsyncArrowHead (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:863:29)
    at Parser.parseSubscript (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:748:19)
    at Parser.parseSubscripts (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:704:19)
    at Parser.parseExprSubscripts (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:689:17)
    at Parser.parseUpdate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:662:21)
    at Parser.parseMaybeUnary (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:631:23)
    at Parser.parseMaybeUnaryOrPrivate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:383:14)
    at Parser.parseExprOps (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:393:23)
    at Parser.parseMaybeConditional (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:351:23)
    at Parser.parseMaybeAssign (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:296:21)
    at Parser.parseExpressionBase (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:221:23)
    at callback (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:214:39)
    at Parser.allowInAnd (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:2957:16)
    at Parser.parseExpression (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:214:17)
    at Parser.parseStatementContent (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:468:23)
    at Parser.parseStatement (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:329:17)
    at Parser.parseBlockOrModuleBlockBody (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:1078:25)
    at Parser.parseBlockBody (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:1054:10)
    at Parser.parseProgram (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:214:10)
    at Parser.parseTopLevel (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:197:25)
    at Parser.parse (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/index.js:41:10)
    at parse (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/index.js:58:38)

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at eval (webpack:///./src/AppCompilationError.cy.jsx?:1:7)
      at ./src/AppCompilationError.cy.jsx (http://localhost:51733/__cypress/src/spec-1.js:10:1)
      at __webpack_require__ (http://localhost:51733/__cypress/src/main.js:64:30)
      at __webpack_require__.t (http://localhost:51733/__cypress/src/main.js:162:33)

*/
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
/*
  ACTUAL

  1) An uncaught error was detected outside of a test:
     The following error originated from your test code, not from Cypress.

  > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /private/var/folders/gw/50bnkq8n2k79cr_l_sqkw8dm0000gn/T/cy-projects/webpack4_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (8:0)

  6 |   cy.get('h1').contains('Hello World')
  7 | }
> 8 | })
    | ^
  9 |
    at instantiate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parse-error/credentials.js:61:22)
    at toParseError (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parse-error.js:58:12)
    at Parser.raise (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/tokenizer/index.js:1763:19)
    at Parser.unexpected (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/tokenizer/index.js:1808:16)
    at Parser.expect (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/util.js:153:28)
    at Parser.parseCallExpressionArguments (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:988:14)
    at Parser.parseCoverCallAndAsyncArrowHead (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:863:29)
    at Parser.parseSubscript (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:748:19)
    at Parser.parseSubscripts (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:704:19)
    at Parser.parseExprSubscripts (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:689:17)
    at Parser.parseUpdate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:662:21)
    at Parser.parseMaybeUnary (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:631:23)
    at Parser.parseMaybeUnaryOrPrivate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:383:14)
    at Parser.parseExprOps (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:393:23)
    at Parser.parseMaybeConditional (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:351:23)
    at Parser.parseMaybeAssign (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:296:21)
    at Parser.parseExpressionBase (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:221:23)
    at callback (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:214:39)
    at Parser.allowInAnd (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:2957:16)
    at Parser.parseExpression (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:214:17)
    at Parser.parseStatementContent (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:468:23)
    at Parser.parseStatement (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:329:17)
    at Parser.parseBlockOrModuleBlockBody (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:1078:25)
    at Parser.parseBlockBody (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:1054:10)
    at Parser.parseProgram (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:214:10)
    at Parser.parseTopLevel (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:197:25)
    at Parser.parse (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/index.js:41:10)
    at parse (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/index.js:58:38)

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
  Error: The following error originated from your test code, not from Cypress.

    > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/babel-loader/lib/index.js):
  SyntaxError: /private/var/folders/gw/50bnkq8n2k79cr_l_sqkw8dm0000gn/T/cy-projects/webpack4_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (8:0)

    6 |   cy.get('h1').contains('Hello World')
    7 | }
  > 8 | })
      | ^
    9 |
      at instantiate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parse-error/credentials.js:61:23)
      at toParseError (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parse-error.js:58:13)
      at Parser.raise (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/tokenizer/index.js:1763:20)
      at Parser.unexpected (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/tokenizer/index.js:1808:17)
      at Parser.expect (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/util.js:153:29)
      at Parser.parseCallExpressionArguments (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:988:15)
      at Parser.parseCoverCallAndAsyncArrowHead (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:863:30)
      at Parser.parseSubscript (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:748:20)
      at Parser.parseSubscripts (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:704:20)
      at Parser.parseExprSubscripts (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:689:18)
      at Parser.parseUpdate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:662:22)
      at Parser.parseMaybeUnary (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:631:24)
      at Parser.parseMaybeUnaryOrPrivate (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:383:15)
      at Parser.parseExprOps (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:393:24)
      at Parser.parseMaybeConditional (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:351:24)
      at Parser.parseMaybeAssign (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:296:22)
      at Parser.parseExpressionBase (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:221:24)
      at callback (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:214:40)
      at Parser.allowInAnd (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:2957:17)
      at Parser.parseExpression (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/expression.js:214:18)
      at Parser.parseStatementContent (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:468:24)
      at Parser.parseStatement (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:329:18)
      at Parser.parseBlockOrModuleBlockBody (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:1078:26)
      at Parser.parseBlockBody (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:1054:11)
      at Parser.parseProgram (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:214:11)
      at Parser.parseTopLevel (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/statement.js:197:26)
      at Parser.parse (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/parser/index.js:41:11)
      at parse (/private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/@babel/parser/src/index.js:58:39)

  When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

  Cypress could not associate this error to any specific test.

  We dynamically generated a new test to display this failure.
      at eval (webpack:///./src/AppCompilationError.cy.jsx?:1:8)
      at ./src/AppCompilationError.cy.jsx (http://localhost:51570/__cypress/src/spec-1.js:10:2)
      at __webpack_require__ (http://localhost:51570/__cypress/src/main.js:64:31)
      at __webpack_require__.t (http://localhost:51570/__cypress/src/main.js:162:34)

*/

/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  stackWithReplacedProps may be the culprit !!!!!!!!!!!
  your whitespace change needs to go in `normalizeStackIndentation`
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

*/
