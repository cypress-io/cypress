// See: ./errorScenarios.md for details about error messages and stack traces

/**
 * @type {typeof toExports}
 */
module.exports = {}

const _ = require('lodash')
const path = require('path')
const errorStackParser = require('error-stack-parser')
const { codeFrameColumns } = require('@babel/code-frame')

const $utils = require('./utils')
const $errUtils = require('./error_utils')
const $sourceMapUtils = require('./source_map_utils')
const { getStackLines, replacedStack, stackWithoutMessage, splitStack, unsplitStack } = require('@packages/server/lib/util/stack_utils')

const whitespaceRegex = /^(\s*)*/
const stackLineRegex = /^\s*(at )?.*@?\(?.*\:\d+\:\d+\)?$/
const customProtocolRegex = /^[^:\/]+:\/+/
const percentNotEncodedRegex = /%(?![0-9A-F][0-9A-F])/g
const STACK_REPLACEMENT_MARKER = '__stackReplacementMarker'

const hasCrossFrameStacks = (specWindow) => {
  // get rid of the top lines since they naturally have different line:column
  const normalize = (stack) => {
    return stack.replace(/^.*\n/, '')
  }

  const topStack = normalize((new Error()).stack)
  const specStack = normalize((new specWindow.Error()).stack)

  return topStack === specStack
}

const stackWithContentAppended = (err, stack) => {
  const appendToStack = err.appendToStack

  if (!appendToStack || !appendToStack.content) return stack

  delete err.appendToStack

  // if the content is a stack trace, which is should be, then normalize the
  // indentation, then indent it a little further than the rest of the stack
  const normalizedContent = normalizeStackIndentation(appendToStack.content)
  const content = $utils.indent(normalizedContent, 2)

  return `${stack}\n\n${appendToStack.title}:\n${content}`
}

const stackWithLinesRemoved = (stack, cb) => {
  const [messageLines, stackLines] = splitStack(stack)
  const remainingStackLines = cb(stackLines)

  return unsplitStack(messageLines, remainingStackLines)
}

const stackWithLinesDroppedFromMarker = (stack, marker, includeLast = false) => {
  return stackWithLinesRemoved(stack, (lines) => {
    // drop lines above the marker
    const withAboveMarkerRemoved = _.dropWhile(lines, (line) => {
      return !_.includes(line, marker)
    })

    return includeLast ? withAboveMarkerRemoved : withAboveMarkerRemoved.slice(1)
  })
}

const stackWithReplacementMarkerLineRemoved = (stack) => {
  return stackWithLinesRemoved(stack, (lines) => {
    return _.reject(lines, (line) => _.includes(line, STACK_REPLACEMENT_MARKER))
  })
}

const stackWithUserInvocationStackSpliced = (err, userInvocationStack) => {
  const stack = _.trim(err.stack, '\n') // trim newlines from end
  const [messageLines, stackLines] = splitStack(stack)
  const userInvocationStackWithoutMessage = stackWithoutMessage(userInvocationStack)

  let commandCallIndex = _.findIndex(stackLines, (line) => {
    return line.includes(STACK_REPLACEMENT_MARKER)
  })

  if (commandCallIndex < 0) {
    commandCallIndex = stackLines.length
  }

  stackLines.splice(commandCallIndex, stackLines.length, 'From Your Spec Code:')
  stackLines.push(userInvocationStackWithoutMessage)

  // the commandCallIndex is based off the stack without the message,
  // but the full stack includes the message + 'From Your Spec Code:',
  // so we adjust it
  return {
    stack: unsplitStack(messageLines, stackLines),
    index: commandCallIndex + messageLines.length + 1,
  }
}

const getInvocationDetails = (specWindow, config) => {
  if (specWindow.Error) {
    let stack = (new specWindow.Error()).stack

    // note: specWindow.Cypress can be undefined or null
    // if the user quickly reloads the tests multiple times

    // firefox throws a different stack than chromium
    // which includes stackframes from cypress_runner.js.
    // So we drop the lines until we get to the spec stackframe (incldues __cypress/tests)
    if (specWindow.Cypress && specWindow.Cypress.isBrowser('firefox')) {
      stack = stackWithLinesDroppedFromMarker(stack, '__cypress/tests', true)
    }

    const details = getSourceDetailsForFirstLine(stack, config('projectRoot'))

    return {
      details,
      stack,
    }
  }
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
  let userInvocationStack = $errUtils.getUserInvocationStackFromError(err) || state('currentAssertionUserInvocationStack')

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
    $errUtils.isCypressErr(err)
    || $errUtils.isAssertionErr(err)
    || $errUtils.isChaiValidationErr(err)
  ) {
    return userInvocationStack
  }
}

const getLanguageFromExtension = (filePath) => {
  return (path.extname(filePath) || '').toLowerCase().replace('.', '') || null
}

const getCodeFrameFromSource = (sourceCode, { line, column, relativeFile, absoluteFile }) => {
  if (!sourceCode) return

  const frame = codeFrameColumns(sourceCode, { start: { line, column } })

  if (!frame) return

  return {
    line,
    column,
    originalFile: relativeFile,
    relativeFile,
    absoluteFile,
    frame,
    language: getLanguageFromExtension(relativeFile),
  }
}

const captureUserInvocationStack = (ErrorConstructor, userInvocationStack) => {
  if (!userInvocationStack) {
    const newErr = new ErrorConstructor('userInvocationStack')

    // if browser natively supports Error.captureStackTrace, use it (chrome) (must be bound)
    // otherwise use our polyfill on top.Error
    const captureStackTrace = ErrorConstructor.captureStackTrace ? ErrorConstructor.captureStackTrace.bind(ErrorConstructor) : Error.captureStackTrace

    captureStackTrace(newErr, captureUserInvocationStack)

    userInvocationStack = newErr.stack
  }

  userInvocationStack = normalizedUserInvocationStack(userInvocationStack)

  return userInvocationStack
}

const getCodeFrameStackLine = (err, stackIndex) => {
  // if a specific index is not specified, use the first line with a file in it
  if (stackIndex == null) return _.find(err.parsedStack, (line) => !!line.fileUrl)

  return err.parsedStack[stackIndex]
}

const getCodeFrame = (err, stackIndex) => {
  if (err.codeFrame) return err.codeFrame

  const stackLine = getCodeFrameStackLine(err, stackIndex)

  if (!stackLine) return

  const { fileUrl, originalFile } = stackLine

  return getCodeFrameFromSource($sourceMapUtils.getSourceContents(fileUrl, originalFile), stackLine)
}

const getWhitespace = (line) => {
  if (!line) return ''

  const [, whitespace] = line.match(whitespaceRegex) || []

  return whitespace || ''
}

const decodeSpecialChars = (filePath) => {
  // the source map will encode certain characters like spaces and emojis
  // but characters like &%#^% are not encoded
  // because % is not encoded we must encode it manually before trying to decode
  // or else decodeURIComponent will throw an error
  //
  // however if a filename has something like %20 in it we have no way of telling
  // if that's the actual filename or an encoded space so we'll assume that its encoded
  // since that's far more likely and to fix this issue
  // we would have to patch the source-map library which likely isn't worth it

  if (filePath) {
    return decodeURIComponent(filePath.replace(percentNotEncodedRegex, '%25'))
  }

  return filePath
}

const getSourceDetails = (generatedDetails) => {
  const sourceDetails = $sourceMapUtils.getSourcePosition(generatedDetails.file, generatedDetails)

  if (!sourceDetails) return generatedDetails

  const { line, column, file } = sourceDetails
  let fn = generatedDetails.function

  return {
    line,
    column,
    file: decodeSpecialChars(file),
    function: fn,
  }
}

const functionExtrasRegex = /(\/<|<\/<)$/

const cleanFunctionName = (functionName) => {
  if (!_.isString(functionName)) return '<unknown>'

  return _.trim(functionName.replace(functionExtrasRegex, ''))
}

const parseLine = (line) => {
  const isStackLine = stackLineRegex.test(line)

  if (!isStackLine) return

  const parsed = errorStackParser.parse({ stack: line })[0]

  if (!parsed) return

  return {
    line: parsed.lineNumber,
    column: parsed.columnNumber,
    file: parsed.fileName,
    function: cleanFunctionName(parsed.functionName),
  }
}

const stripCustomProtocol = (filePath) => {
  if (!filePath) {
    return
  }

  // if the file path (after all said and done)
  // still starts with "http://" or "https://" then
  // it is an URL and we have no idea how it maps
  // to a physical file location on disk. Let it be.
  const httpProtocolRegex = /^https?:\/\//

  if (httpProtocolRegex.test(filePath)) {
    return
  }

  return filePath.replace(customProtocolRegex, '')
}

const getSourceDetailsForLine = (projectRoot, line) => {
  const whitespace = getWhitespace(line)
  const generatedDetails = parseLine(line)

  // if it couldn't be parsed, it's a message line
  if (!generatedDetails) {
    return {
      message: line,
      whitespace,
    }
  }

  const sourceDetails = getSourceDetails(generatedDetails)

  const originalFile = sourceDetails.file

  let relativeFile = stripCustomProtocol(originalFile)

  if (relativeFile) {
    relativeFile = path.normalize(relativeFile)
  }

  return {
    function: sourceDetails.function,
    fileUrl: generatedDetails.file,
    originalFile,
    relativeFile,
    absoluteFile: (relativeFile && projectRoot) ? path.join(projectRoot, relativeFile) : undefined,
    line: sourceDetails.line,
    // adding 1 to column makes more sense for code frame and opening in editor
    column: sourceDetails.column + 1,
    whitespace,
  }
}

const getSourceDetailsForFirstLine = (stack, projectRoot) => {
  const line = getStackLines(stack)[0]

  if (!line) return

  return getSourceDetailsForLine(projectRoot, line)
}

const reconstructStack = (parsedStack) => {
  return _.map(parsedStack, (parsedLine) => {
    if (parsedLine.message != null) {
      return `${parsedLine.whitespace}${parsedLine.message}`
    }

    const { whitespace, originalFile, function: fn, line, column } = parsedLine

    return `${whitespace}at ${fn} (${originalFile || '<unknown>'}:${line}:${column})`
  }).join('\n')
}

const getSourceStack = (stack, projectRoot) => {
  if (!_.isString(stack)) return {}

  const getSourceDetailsWithStackUtil = _.partial(getSourceDetailsForLine, projectRoot)
  const parsed = _.map(stack.split('\n'), getSourceDetailsWithStackUtil)

  return {
    parsed,
    sourceMapped: reconstructStack(parsed),
  }
}

const normalizeStackIndentation = (stack) => {
  const [messageLines, stackLines] = splitStack(stack)
  const normalizedStackLines = _.map(stackLines, (line) => {
    if (stackLineRegex.test(line)) {
      // stack lines get indented 4 spaces
      return line.replace(whitespaceRegex, '    ')
    }

    // message lines don't get indented at all
    return line.replace(whitespaceRegex, '')
  })

  return unsplitStack(messageLines, normalizedStackLines)
}

const normalizedStack = (err) => {
  // Firefox errors do not include the name/message in the stack, whereas
  // Chromium-based errors do, so we normalize them so that the stack
  // always includes the name/message
  const errString = err.toString()
  const errStack = err.stack || ''

  // the stack has already been normalized and normalizing the indentation
  // again could mess up the whitespace
  if (errStack.includes(errString)) return err.stack

  const firstErrLine = errString.slice(0, errString.indexOf('\n'))
  const firstStackLine = errStack.slice(0, errStack.indexOf('\n'))
  const stackIncludesMsg = firstStackLine.includes(firstErrLine)

  if (!stackIncludesMsg) {
    return `${errString}\n${errStack}`
  }

  return normalizeStackIndentation(errStack)
}

const normalizedUserInvocationStack = (userInvocationStack) => {
  // Firefox user invocation stack includes a line at the top that looks like
  // addCommand/cy[name]@cypress:///../driver/src/cypress/cy.js:936:77 or
  // add/$Chainer.prototype[key] (cypress:///../driver/src/cypress/chainer.js:30:128)
  // whereas Chromium browsers have the user's line first
  const stackLines = getStackLines(userInvocationStack)
  const winnowedStackLines = _.reject(stackLines, (line) => {
    // WARNING: STACK TRACE WILL BE DIFFERENT IN DEVELOPMENT vs PRODUCTOIN
    // stacks in development builds look like:
    //     at cypressErr (cypress:///../driver/src/cypress/error_utils.js:259:17)
    // stacks in prod builds look like:
    //     at cypressErr (http://localhost:3500/isolated-runner/cypress_runner.js:173123:17)
    return line.includes('cy[name]') || line.includes('Chainer.prototype[key]')
  }).join('\n')

  return normalizeStackIndentation(winnowedStackLines)
}

// unfortunately due to our mix of typescript imports and requires
// and circular imports, we need to mutate module.exports instead of reassign
// so that errUtils can maintain a reference to our exports
// and we can still mock them in testing
const _exports = {
  replacedStack,
  getCodeFrame,
  getSourceStack,
  getStackLines,
  getSourceDetailsForFirstLine,
  hasCrossFrameStacks,
  normalizedStack,
  normalizedUserInvocationStack,
  getUserInvocationStack,
  stackWithContentAppended,
  stackWithLinesDroppedFromMarker,
  stackWithoutMessage,
  stackWithReplacementMarkerLineRemoved,
  stackWithUserInvocationStackSpliced,
  captureUserInvocationStack,
  getInvocationDetails,
}

Object.assign(module.exports, _exports)

module.exports = _exports
