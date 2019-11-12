const _ = require('lodash')
const { codeFrameColumns } = require('@babel/code-frame')
const StackUtils = require('stack-utils')
const path = require('path')

const $errorMessages = require('./error_messages')
const $utils = require('./utils')
const $sourceMapUtils = require('./source_map_utils')

const ERROR_PROPS = 'message type name stack sourceMappedStack parsedStack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl codeFrame'.split(' ')

const CypressErrorRe = /(AssertionError|CypressError)/
const twoOrMoreNewLinesRe = /\n{2,}/
const mdReplacements = [
  ['`', '\\`'],
]

const wrapErr = (err) => {
  if (!err) return

  return $utils.reduceProps(err, ERROR_PROPS)
}

const mergeErrProps = (origErr, newProps) => {
  return _.extend(origErr, newProps)
}

const modifyErrMsg = (origErrObj, newErrMsg, cb) => {
  let { stack, message } = origErrObj

  // preserve message
  const originalErrMsg = message

  // modify message
  message = cb(originalErrMsg, newErrMsg)

  if (stack) {
    // reset stack by replacing the original
    // first line with the new one
    stack = stack.replace(originalErrMsg, message)
  }

  return _.extend({}, origErrObj, {
    message,
    stack,
  })
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
    err = cypressErr(err)
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
  const { args } = options
  let err

  try {
    const obj = errObjByPath($errorMessages, errPath, args)

    err = cypressErr(obj.message)
    _.defaults(err, obj)
  } catch (e) {
    err = internalErr(e)
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
  err = new Error(err)
  err.name = 'InternalError'

  return err
}

const cypressErrObj = (errObj) => {
  errObj.name = 'CypressError'

  return errObj
}

const cypressErr = (msg) => {
  const err = new Error(msg)

  return cypressErrObj(err)
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
    throw new Error(`Error message path: '${errPath}' does not exist`)
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

const getLanguageFromExtension = (filePath) => {
  return (path.extname(filePath) || '').toLowerCase().replace('.', '') || null
}

const getCodeFrame = (sourceCode, { line, column, source: file }) => {
  // add 1 to column because it looks better in code frame
  // since column is 0-based
  column++
  const location = { start: { line, column } }
  const frame = codeFrameColumns(sourceCode, location)

  if (!frame) return null

  return {
    line,
    column,
    file,
    frame,
    language: getLanguageFromExtension(file),
  }
}

const getSourceDetails = (generatedDetails) => {
  const sourceDetails = $sourceMapUtils.getSourcePosition(generatedDetails.file, generatedDetails)

  if (!sourceDetails) return generatedDetails

  const { line, column, source } = sourceDetails

  return {
    line,
    column,
    file: source,
    function: generatedDetails.function,
  }
}

const getCodeFrameFromStack = (stack, lineIndex) => {
  if (!stack) return

  const generatedStackLineDetails = getStackLineDetails(stack, lineIndex)

  if (!generatedStackLineDetails) return

  const { file } = generatedStackLineDetails
  const stackLineDetails = $sourceMapUtils.getSourcePosition(file, generatedStackLineDetails)

  if (!stackLineDetails) return

  return getCodeFrame($sourceMapUtils.getSourceContents(file), stackLineDetails)
}

// stacks from command failures and assertion failures have the right message
// but the stack points to cypress internals. here we combine the message
// with the invocation stack, which points to the user's code
const combineMessageAndStack = (err, stack = '') => {
  if (!err || !err.message) return stack

  // eslint-disable-next-line no-unused-vars
  const [__, stackLines] = splitStack(stack)
  const relevantStackLines = _.reject(stackLines, (line) => {
    return line.indexOf('__getSpecFrameStack') > -1
  })

  return [err.message].concat(relevantStackLines).join('\n')
}

const addCodeFrameToErr = ({ err, stack, lineIndex = 0 }) => {
  if (err.codeFrame) return err

  err.codeFrame = getCodeFrameFromStack(stack, lineIndex)

  return err
}

const escapeErrMarkdown = (text) => {
  if (!_.isString(text)) {
    return text
  }

  // escape markdown syntax supported by reporter
  return _.reduce(mdReplacements, (str, replacement) => {
    const re = new RegExp(replacement[0], 'g')

    return str.replace(re, replacement[1])
  }, text)
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

const getCleanedStackLines = (stackUtil, stack) => {
  return stackUtil.clean(stack).split('\n')
}

const getStackLineDetails = (stack, lineIndex = 0) => {
  const stackUtil = new StackUtils()
  const line = getCleanedStackLines(stackUtil, stack)[lineIndex]
  const details = stackUtil.parseLine(line)

  if (!details) return null

  // stackUtils.clean removes the // in http:// for some reason, so put it back
  return _.extend(details, {
    file: details.file.replace(':', '://'),
  })
}

const stackLineRegex = /^(\s*)at /

const getWhitespace = (line) => {
  if (!line) return ''

  // eslint-disable-next-line no-unused-vars
  const [__, whitespace] = line.match(stackLineRegex) || []

  return whitespace || ''
}

// returns tuple of [message, stack]
const splitStack = (stack) => {
  const lines = stack.split('\n')

  return _.reduce(lines, (memo, line) => {
    if (memo.messageEnded || stackLineRegex.test(line)) {
      memo.messageEnded = true
      memo[1].push(line)
    } else {
      memo[0].push(line)
    }

    return memo
  }, [[], []])
}

const reconstructStack = (parsedStack) => {
  return _.map(parsedStack, (parsedLine) => {
    if (parsedLine.message != null) {
      return `${parsedLine.whitespace}${parsedLine.message}`
    }

    const { whitespace, relativeFile, function: fn, line, column } = parsedLine

    return `${whitespace}at ${fn || '<unknown>'} (${relativeFile || '<unknown>'}:${line}:${column})`
  }).join('\n')
}

const getSourceDetailsForLine = (stackUtil, projectRoot, line) => {
  const whitespace = getWhitespace(line)
  const generatedDetails = stackUtil.parseLine(line)

  // if it couldn't be parsed, it's a message line
  if (!generatedDetails) {
    return {
      message: line,
      whitespace,
    }
  }

  const sourceDetails = getSourceDetails(generatedDetails)

  return {
    function: sourceDetails.function,
    relativeFile: sourceDetails.file,
    absoluteFile: path.join(projectRoot, sourceDetails.file),
    line: sourceDetails.line,
    // adding 1 to column makes more sense when opening in editor
    column: sourceDetails.column + 1,
    whitespace,
  }
}

const getSourceStack = (stack, projectRoot) => {
  if (!_.isString(stack)) return {}

  const getSourceDetailsWithStackUtil = _.partial(getSourceDetailsForLine, new StackUtils(), projectRoot)
  const parsed = _.map(stack.split('\n'), getSourceDetailsWithStackUtil)

  return {
    parsed,
    sourceMapped: reconstructStack(parsed),
  }
}

const enhanceStack = ({ err, stack, projectRoot }) => {
  err.stack = combineMessageAndStack(err, stack)

  const { sourceMapped, parsed } = getSourceStack(err.stack, projectRoot)

  err.sourceMappedStack = sourceMapped
  err.parsedStack = parsed

  return err
}

//// all errors flow through this function before they're finally thrown
//// or used to reject promises
const processErr = (errObj = {}, config) => {
  if (config('isInteractive') || !errObj.docsUrl) {
    return errObj
  }

  // append the docs url when not interactive so it appears in the stdout
  return appendErrMsg(errObj, `${errObj.docsUrl}\n`)
}

module.exports = {
  CypressErrorRe,
  wrapErr,
  modifyErrMsg,
  mergeErrProps,
  appendErrMsg,
  makeErrFromObj,
  throwErr,
  throwErrByPath,
  warnByPath,
  internalErr,
  cypressErr,
  cypressErrObj,
  normalizeMsgNewLines,
  errObjByPath,
  getErrMsgWithObjByPath,
  getErrMessage,
  errMsgByPath,
  getErrStack,
  addCodeFrameToErr,
  enhanceStack,
  escapeErrMarkdown,
  getObjValueByPath,
  getStackLineDetails,
  processErr,
  getSourceStack,
}
