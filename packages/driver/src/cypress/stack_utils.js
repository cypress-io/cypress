const _ = require('lodash')
const { codeFrameColumns } = require('@babel/code-frame')
const errorStackParser = require('error-stack-parser')
const path = require('path')

const { getStackLines, replacedStack, stackWithoutMessage, splitStack, unsplitStack } = require('@packages/server/lib/util/stack_utils')
const $sourceMapUtils = require('./source_map_utils')
const $utils = require('./utils')

const whitespaceRegex = /^(\s*)*/
const stackLineRegex = /^\s*(at )?.*@?\(?.*\:\d+\:\d+\)?$/
const customProtocolRegex = /^[^:\/]+:\/+/
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

const captureUserInvocationStack = (Error, userInvocationStack) => {
  userInvocationStack = userInvocationStack || (new Error('userInvocationStack')).stack

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
    return line.includes('cy[name]') || line.includes('Chainer.prototype[key]')
  }).join('\n')

  return normalizeStackIndentation(winnowedStackLines)
}

module.exports = {
  getCodeFrame,
  getSourceStack,
  getStackLines,
  getSourceDetailsForFirstLine,
  hasCrossFrameStacks,
  normalizedStack,
  normalizedUserInvocationStack,
  replacedStack,
  stackWithContentAppended,
  stackWithLinesDroppedFromMarker,
  stackWithoutMessage,
  stackWithReplacementMarkerLineRemoved,
  stackWithUserInvocationStackSpliced,
  captureUserInvocationStack,
}

/**
The various error scenarios Cypress can encounter and how to address them
Error: err.name
Uncaught: whether it's an uncaught error
Codeframe: what the code frame should display
Original stack: what does the error stack include before we've modified it at all
Replace: whether we should replace the stack with the user invocation stack
Translate: whether we should translate the stack to point to source files instead of the built files served to the browser
Append: whether we should append all or part of the original error stack to the newly replaced stack
====
Scenario 1: command assertion errors
====
cy.wrap({ foo: 'foo' })
  .should('have.property', 'foo')
  .should('equal', 'bar')
//
cy.get('#non-existent') // default assertion
- Error: AssertionError
- Uncaught: false
- Codeframe: cy.should, cy.get
- Original Stack: cypress internals
- Replace: yes, with command invocation stack
- Translate: yes
- Append: no
====
Scenario 2: exceptions
====
// at root level
foo.bar()
// in test
foo.bar()
// at root or in test
setTimeout(() => {
  foo.bar()
}, 20)
cy.wait(10000)
//
cy.wrap({}).should(() => {
  foo.bar()
})
//
Cypress.Commands.add('foo', () => {
  foo.bar()
})
cy.foo()
- Error: ReferenceError, etc
- Uncaught: true/false
- Codeframe: foo.bar()
- Original Stack: spec callsite
- Replace: no
- Translate: yes
- Append: no
====
Scenario 3: assertion errors
====
// at root
expect(true).to.be.false
// in test
expect(true).to.be.false
//
cy.wrap({}).then(() => {
  expect(true).to.be.false
})
//
cy.wrap({}).should(() => {
  expect(true).to.be.false
})
- Error: AssertionError
- Uncaught: true/false
- Codeframe: expect()
- Original Stack: cypress internals
- Replace: yes, with assertion invocation stack
- Translate: yes
- Append: no
====
Scenario 4: validation errors
====
async:
cy.viewport() // invalid args
// double visit
cy.visit('/test.html')
cy.visit('https://google.com')
cy.get('div:first').then(($el) => {
  $el.hide()
})
.click()

sync:
beforeEach(()=>{
  beforeEach(()=>{})
})

expect(true).to.be.nope
- Error: CypressError, Error<Chai validation>
- Uncaught: false
- Codeframe: cy.viewport
- Original Stack: cypress internals / chai internals
- Replace: yes
- Translate: yes
- Append: yes

====
Scenario 5: app sync uncaught errors
====
cy.visit('/visit_error.html') // error synchronously
cy
.visit('/error_on_click.html')
.get('p').click() // error on click event
- Error: ReferenceError, etc
- Uncaught: true
- Codeframe: none (but want to show app code + maybe cy.visit/cy.click)
- Original Stack: app code
- Replace: no
- Translate: yes (but can't now)
- Append: no
====
Scenario 6: app async uncaught errors
====
cy.visit('/html/visit_error.html') // error asynchronously
- Error: ReferenceError, etc
- Uncaught: true
- Codeframe: none (but want to show app code, don't show cy.visit)
- Original Stack: app code
- Replace: no
- Translate: yes (but can't now)
- Append: no
====
Scenario 7: network errors
====
cy.visit('/404')
cy.request('http://localhost:12345')
- Error: RequestError, etc - wrapped in CypressError
- Uncaught: false
- Codeframe: cy.visit
- Original Stack: node, cypress internals
- Replace: yes, with command invocation stack
- Translate: yes
- Append: yes, append both node and cypress internals
====
Rules:
====
- if assertion error, don't append original stack because the rules of why it errored are explicit
- if internal cypress error, append original stack so users can use it to understand the source of the error
- if internal cypress error originating from node, append node stack and internal cypress stack
TODO:
- if visit synchronously fails in app code, point to cy.visit in spec code
  - add 2nd code frame that points to app code
- don't hide stack trace by default, because now it's actually useful and not overly verbose with internal crap
- profile how much time Bluebird spends when we enable longStackTraces (cypress.js) and maybe turn it always off or always on
- splice out cypress internals when there's a user error (Scenario 2 when error is in a command callback)
 */
