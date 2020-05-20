const _ = require('lodash')
const { codeFrameColumns } = require('@babel/code-frame')
const errorStackParser = require('error-stack-parser')
const path = require('path')

const $sourceMapUtils = require('./source_map_utils')
const $utils = require('./utils')

const whitespaceRegex = /^(\s*)*/
const stackLineRegex = /^\s*(at )?.*@?\(?.*\:\d+\:\d+\)?$/
const customProtocolRegex = /^[^:\/]+:\/+/
const STACK_REPLACEMENT_MARKER = '__stackReplacementMarker'

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

const unsplitStack = (messageLines, stackLines) => {
  return _.castArray(messageLines).concat(stackLines).join('\n')
}

const getStackLines = (stack) => {
  const [, stackLines] = splitStack(stack)

  return stackLines
}

const stackWithoutMessage = (stack) => {
  return getStackLines(stack).join('\n')
}

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

const stackWithLinesDroppedFromMarker = (stack, marker) => {
  return stackWithLinesRemoved(stack, (lines) => {
    // drop lines above the marker
    const withAboveMarkerRemoved = _.dropWhile(lines, (line) => {
      return !_.includes(line, marker)
    })

    // remove the first line because it includes the marker
    return withAboveMarkerRemoved.slice(1)
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

const getSourceDetails = (generatedDetails) => {
  const sourceDetails = $sourceMapUtils.getSourcePosition(generatedDetails.file, generatedDetails)

  if (!sourceDetails) return generatedDetails

  const { line, column, file } = sourceDetails
  let fn = generatedDetails.function

  return {
    line,
    column,
    file,
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
  const relativeFile = stripCustomProtocol(originalFile)

  return {
    function: sourceDetails.function,
    fileUrl: generatedDetails.file,
    originalFile,
    relativeFile,
    absoluteFile: path.join(projectRoot, relativeFile),
    line: sourceDetails.line,
    // adding 1 to column makes more sense for code frame and opening in editor
    column: sourceDetails.column + 1,
    whitespace,
  }
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
    return line.includes('cy[name]') || line.includes('Chainer.prototype[key]')
  }).join('\n')

  return normalizeStackIndentation(winnowedStackLines)
}

const replacedStack = (err, newStack) => {
  // if err already lacks a stack or we've removed the stack
  // for some reason, keep it stackless
  if (!err.stack) return err.stack

  const errString = err.toString()
  const stackLines = getStackLines(newStack)

  return unsplitStack(errString, stackLines)
}

module.exports = {
  getCodeFrame,
  getSourceStack,
  getStackLines,
  hasCrossFrameStacks,
  normalizedStack,
  normalizedUserInvocationStack,
  replacedStack,
  stackWithContentAppended,
  stackWithLinesDroppedFromMarker,
  stackWithoutMessage,
  stackWithReplacementMarkerLineRemoved,
  stackWithUserInvocationStackSpliced,
}
