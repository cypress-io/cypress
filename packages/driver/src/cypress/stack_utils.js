const _ = require('lodash')
const { codeFrameColumns } = require('@babel/code-frame')
const errorStackParser = require('error-stack-parser')
const path = require('path')

const $sourceMapUtils = require('./source_map_utils')

const whitespaceRegex = /^(\s*)\S*/
const stackLineRegex = /^\s*(at )?.*@?\(?.*\:\d+\:\d+\)?$/

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

// stacks from command failures and assertion failures have the right message
// but the stack points to cypress internals. here we combine the message
// with the invocation stack, which points to the user's code
const combineMessageAndStack = (message, stack = '') => {
  if (!message) return stack

  // eslint-disable-next-line no-unused-vars
  const [__, stackLines] = splitStack(stack)
  const relevantStackLines = _.reject(stackLines, (line) => {
    return line.indexOf('__getSpecFrameStack') > -1
  })

  return [message].concat(relevantStackLines).join('\n')
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
    relativeFile,
    absoluteFile,
    frame,
    language: getLanguageFromExtension(relativeFile),
  }
}

const getCodeFrame = (err) => {
  if (err.codeFrame) return err.codeFrame

  const firstStackLine = _.find(err.parsedStack, (line) => !!line.fileUrl)

  if (!firstStackLine) return

  const { fileUrl, relativeFile } = firstStackLine

  return getCodeFrameFromSource($sourceMapUtils.getSourceContents(fileUrl, relativeFile), firstStackLine)
}

const getWhitespace = (line) => {
  if (!line) return ''

  // eslint-disable-next-line no-unused-vars
  const [__, whitespace] = line.match(whitespaceRegex) || []

  return whitespace || ''
}

const getSourceDetails = (generatedDetails) => {
  const sourceDetails = $sourceMapUtils.getSourcePosition(generatedDetails.file, generatedDetails)

  if (!sourceDetails) return generatedDetails

  const { line, column, file } = sourceDetails
  let fn = generatedDetails.function

  if (fn === 'Context.eval') {
    fn = 'Test.run'
  }

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

  return functionName.replace(functionExtrasRegex, '')
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

  return {
    function: sourceDetails.function,
    fileUrl: generatedDetails.file,
    relativeFile: sourceDetails.file,
    absoluteFile: path.join(projectRoot, sourceDetails.file),
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

    const { whitespace, relativeFile, function: fn, line, column } = parsedLine

    return `${whitespace}at ${fn} (${relativeFile || '<unknown>'}:${line}:${column})`
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

module.exports = {
  combineMessageAndStack,
  getCodeFrame,
  getSourceStack,
}
