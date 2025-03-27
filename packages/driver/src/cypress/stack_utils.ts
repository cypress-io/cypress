// See: ./errorScenarios.md for details about error messages and stack traces

// NOTE: If you modify the logic relating to this file, ensure the
// UI for error code frames works as expected with the binary. This includes each
// browser, as well as e2e and CT testing types. Stack patterns differ in Chrome
// between the binary and dev mode, so Cy in Cy tests cannot catch them proactively.

// Various stack patterns are saved as scenario fixtures in ./driver/test
// to prevent regressions.

import _ from 'lodash'
import path from 'path'
import errorStackParser from 'error-stack-parser'
import { codeFrameColumns } from '@babel/code-frame'

import $utils from './utils'
import $sourceMapUtils from './source_map_utils'

// Intentionally deep-importing from @packages/errors so as to not bundle the entire @packages/errors in the client unnecessarily
import { getStackLines, replacedStack, stackWithoutMessage, splitStack, unsplitStack, stackLineRegex } from '@packages/errors/src/stackUtils'

const whitespaceRegex = /^(\s*)*/
const customProtocolRegex = /^[^:\/]+:\/{1,3}/
// Find 'namespace' values (like `_N_E` for Next apps) without adjusting relative paths (like `../`)
const webpackDevtoolNamespaceRegex = /webpack:\/{2}([^.]*)?\.\//
const percentNotEncodedRegex = /%(?![0-9A-F][0-9A-F])/g
const webkitStackLineRegex = /(.*)@(.*)(\n?)/g

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

const stackWithContentAppended = (err, stack: string | undefined) => {
  const usableStack = stack ?? ''
  const appendToStack = err.appendToStack

  if (!appendToStack || !appendToStack.content) return usableStack

  delete err.appendToStack

  // if the content is a stack trace, which is should be, then normalize the
  // indentation, then indent it a little further than the rest of the stack
  const normalizedContent = normalizeStackIndentation(appendToStack.content)
  const content = $utils.indent(normalizedContent, 2)

  return `${usableStack}\n\n${appendToStack.title}:\n${content}`
}

const stackWithLinesRemoved = (stack, cb) => {
  const [messageLines, stackLines] = splitStack(stack)
  const remainingStackLines = cb(stackLines)

  return unsplitStack(messageLines, remainingStackLines)
}

const stackWithLinesDroppedFromMarker = (stack, marker, includeLast = false) => {
  return stackWithLinesRemoved(stack, (lines) => {
    // drop lines above the marker
    const withAboveMarkerRemoved = _.dropWhile(lines, (line: any) => {
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

const stackPriorToReplacementMarker = (stack) => {
  return _.chain(stack).split('\n')
  .takeWhile((line) => !line.includes(STACK_REPLACEMENT_MARKER))
  .join('\n')
  .value()
}

export type StackAndCodeFrameIndex = {
  stack: string
  index?: number
}

const stackWithUserInvocationStackSpliced = (err, userInvocationStack): StackAndCodeFrameIndex => {
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

type InvocationDetails = {
  absoluteFile?: string
  column?: number
  line?: number
  originalFile?: string
  relativeFile?: string
  stack: string
}

// used to determine codeframes for hook/test/etc definitions rather than command invocations
const getInvocationDetails = (specWindow, config): InvocationDetails | undefined => {
  if (specWindow.Error) {
    let stack = (new specWindow.Error()).stack

    // note: specWindow.Cypress can be undefined or null
    // if the user quickly reloads the tests multiple times

    // firefox and chrome throw stacks that include lines from cypress
    // So we drop the lines until we get to the spec stackframe (includes __cypress)
    if (specWindow.Cypress) {
      // The stack includes frames internal to cypress, after the spec stackframe. In order
      // to determine the invocation details, the stack needs to be parsed and trimmed.

      // in Chrome and Firefox in E2E contexts, the spec stackframe includes the pattern, '__cypress/tests'.
      if (stack.includes('__cypress/tests')) {
        stack = stackWithLinesDroppedFromMarker(stack, '__cypress/tests', true)
      } else {
        // CT error contexts include the `__cypress` marker but not the `/tests` portion
        stack = stackWithLinesDroppedFromMarker(stack, '__cypress', true)
      }
    }

    const details: Omit<InvocationDetails, 'stack'> = getSourceDetailsForFirstLine(stack, config('projectRoot')) || {};

    (details as any).stack = stack

    return details as (InvocationDetails & { stack: any })
  }

  return
}

const getLanguageFromExtension = (filePath) => {
  return (path.extname(filePath) || '').toLowerCase().replace('.', '') || null
}

const getCodeFrameFromSource = (sourceCode, { line, column: originalColumn, relativeFile, absoluteFile }) => {
  if (!sourceCode) return

  // stack columns are 0-based but code frames and IDEs start columns at 1.
  // add 1 so the code frame and "open in IDE" point to the right line
  const column = originalColumn + 1
  const frame = codeFrameColumns(sourceCode, { start: { line, column } })

  if (!frame) return

  return {
    line,
    column,
    originalFile: relativeFile,
    relativeFile: getRelativePathFromRoot(relativeFile, absoluteFile),
    absoluteFile,
    frame,
    language: getLanguageFromExtension(relativeFile),
  }
}

export const toPosix = (file: string) => {
  return Cypress.config('platform') === 'win32'
    ? file.replaceAll('\\', '/')
    : file
}

const getRelativePathFromRoot = (relativeFile: string, absoluteFile?: string) => {
  // at this point relativeFile is relative to the cypress config
  // we need it to be relative to the repo root, which is different for monorepos
  const repoRoot = Cypress.config('repoRoot')
  const posixAbsoluteFile = absoluteFile ? toPosix(absoluteFile) : ''

  if (posixAbsoluteFile?.startsWith(`${repoRoot}/`)) {
    return posixAbsoluteFile.replace(`${repoRoot}/`, '')
  }

  return relativeFile
}

const captureUserInvocationStack = (ErrorConstructor: SpecWindow['Error'], userInvocationStack?: string | false) => {
  if (!userInvocationStack) {
    const newErr = new ErrorConstructor('userInvocationStack')

    userInvocationStack = newErr.stack

    // if browser natively supports Error.captureStackTrace, use it (chrome) (must be bound)
    // otherwise use our polyfill on top.Error
    const captureStackTrace: ErrorConstructor['captureStackTrace'] = ErrorConstructor.captureStackTrace ? ErrorConstructor.captureStackTrace.bind(ErrorConstructor) : Error.captureStackTrace

    captureStackTrace(newErr, captureUserInvocationStack)

    // On Chrome 99+, captureStackTrace strips away the whole stack,
    // leaving nothing beyond the error message. If we get back a single line
    // (just the error message with no stack trace), then use the original value
    // instead of the trimmed one.
    if (newErr.stack!.match('\n')) {
      userInvocationStack = newErr.stack
    }
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
  if (!stackLineRegex.test(line)) return

  const parsed = errorStackParser.parse({ stack: line } as any)[0]

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

  // Check the path to see if custom namespaces have been applied and, if so, remove them
  // For example, in Next.js we end up with paths like `_N_E/pages/index.cy.js`, and we
  // need to strip off the `_N_E` so that "Open in IDE" links work correctly
  if (webpackDevtoolNamespaceRegex.test(filePath)) {
    return filePath.replace(webpackDevtoolNamespaceRegex, '')
  }

  return filePath.replace(customProtocolRegex, '')
}

interface MessageLineDetail {
  message: any
  whitespace: any
}

interface StackLineDetail {
  function: any
  fileUrl: any
  originalFile: any
  relativeFile: any
  absoluteFile: any
  line: any
  column: number
  whitespace: any
}

const getSourceDetailsForLine = (projectRoot, line): MessageLineDetail | StackLineDetail => {
  const whitespace = getWhitespace(line)
  const generatedDetails = parseLine(line)

  // if it couldn't be parsed, it's a message line
  if (!generatedDetails) {
    return {
      message: line.replace(whitespace, ''), // strip leading whitespace
      whitespace,
    }
  }

  const sourceDetails = getSourceDetails(generatedDetails)

  const originalFile = sourceDetails.file

  let relativeFile = stripCustomProtocol(originalFile)

  if (relativeFile) {
    relativeFile = path.normalize(relativeFile)

    if (relativeFile.includes(projectRoot)) {
      relativeFile = relativeFile.replace(projectRoot, '').substring(1)
    }
  }

  let absoluteFile

  // WebKit stacks may include an `<unknown>` or `[native code]` location that is not navigable.
  // We ensure that the absolute path is not set in this case.
  const canBuildAbsolutePath = relativeFile && projectRoot && (
    !Cypress.isBrowser('webkit') || (relativeFile !== '<unknown>' && relativeFile !== '[native code]')
  )

  if (canBuildAbsolutePath) {
    absoluteFile = path.resolve(projectRoot, relativeFile)

    // rollup-plugin-node-builtins/src/es6/path.js only support POSIX, we have
    // to remove the / so the openFileInIDE can find the correct path
    if (Cypress.config('platform') === 'win32' && absoluteFile.startsWith('/')) {
      absoluteFile = absoluteFile.substring(1)
    }
  }

  return {
    function: sourceDetails.function,
    fileUrl: generatedDetails.file,
    originalFile,
    relativeFile,
    absoluteFile,
    line: sourceDetails.line,
    column: sourceDetails.column,
    whitespace,
  }
}

const getSourceDetailsForFirstLine = (stack, projectRoot) => {
  const line = getStackLines(stack)[0]

  if (!line) return

  return getSourceDetailsForLine(projectRoot, line) as StackLineDetail
}

const reconstructStack = (parsedStack) => {
  return _.map(parsedStack, (parsedLine) => {
    if (parsedLine.message != null) {
      return `${parsedLine.whitespace}${parsedLine.message}`
    }

    const { whitespace, originalFile, function: fn, line, column } = parsedLine

    const lineAndColumn = (Number.isInteger(line) || Number.isInteger(column)) ? `:${line}:${column}` : ''

    return `${whitespace}at ${fn} (${originalFile || '<unknown>'}${lineAndColumn})`
  }).join('\n').trimEnd()
}

const getSourceStack = (stack, projectRoot?) => {
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
  let errStack = err.stack || ''

  if (Cypress.isBrowser('webkit')) {
    // WebKit will not determine the proper stack trace for an error, with stack entries
    // missing function names, call locations, or both. This is due to a number of documented
    // issues with WebKit:
    // https://bugs.webkit.org/show_bug.cgi?id=86493
    // https://bugs.webkit.org/show_bug.cgi?id=243668
    // https://bugs.webkit.org/show_bug.cgi?id=174380
    //
    // We update these stack entries with placeholder names/locations to more closely align
    // the output with other browsers, minimizing the visual impact to the stack traces we render
    // within the command log and console and ensuring that the stacks can be identified within
    // and parsed out of test snapshots that include them.
    errStack = errStack.replaceAll(webkitStackLineRegex, (match, ...parts: string[]) => {
      // We patch WebKit's Error within the AUT as CyWebKitError, causing it to
      // be presented within the stack. If we detect it within the stack, we remove it.
      if (parts[0] === '__CyWebKitError') {
        return ''
      }

      return [
        parts[0] || '<unknown>',
        '@',
        parts[1] || '<unknown>',
        parts[2],
      ].join('')
    })
  }

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
  const nonCypressStackLines = _.reject(stackLines, (line) => {
    // WARNING: STACK TRACE WILL BE DIFFERENT IN DEVELOPMENT vs PRODUCTION
    // stacks in development builds look like:
    //     at cypressErr (cypress:///../driver/src/cypress/error_utils.js:259:17)
    // stacks in prod builds look like:
    //     at cypressErr (http://localhost:3500/isolated-runner/cypress_runner.js:173123:17)
    return line.includes('cy[name]')
    || line.includes('Chainer.prototype[key]')
    || line.includes('cy.<computed>')
    || line.includes('$Chainer.<computed>')
  }).join('\n')

  return normalizeStackIndentation(nonCypressStackLines)
}

export default {
  replacedStack,
  getCodeFrame,
  getCodeFrameFromSource,
  getRelativePathFromRoot,
  getSourceStack,
  getStackLines,
  getSourceDetailsForFirstLine,
  hasCrossFrameStacks,
  normalizedStack,
  normalizedUserInvocationStack,
  stackWithContentAppended,
  stackWithLinesDroppedFromMarker,
  stackWithoutMessage,
  stackWithReplacementMarkerLineRemoved,
  stackPriorToReplacementMarker,
  stackWithUserInvocationStackSpliced,
  captureUserInvocationStack,
  getInvocationDetails,
  toPosix,
}
